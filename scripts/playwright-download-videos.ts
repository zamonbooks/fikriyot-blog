/**
 * Download videos using Playwright and upload to Cloudinary
 */

import { chromium } from 'playwright';
import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import * as FormData from 'form-data';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const CHANNEL_USERNAME = process.env.TELEGRAM_CHANNEL_USERNAME!;
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME!;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY!;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET!;
const POSTS_FILE = path.resolve(process.cwd(), 'data/posts.json');

async function downloadVideo(postId: number): Promise<string | null> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    const url = `https://t.me/${CHANNEL_USERNAME}/${postId}`;
    console.log(`  Opening: ${url}`);
    
    await page.goto(url, { waitUntil: 'networkidle' });
    
    // Wait for video element
    await page.waitForSelector('video', { timeout: 10000 });
    
    // Click play button
    const playButton = await page.$('.tgme_widget_message_video_player');
    if (playButton) {
      await playButton.click();
      await page.waitForTimeout(2000);
    }
    
    // Intercept video requests
    let videoUrl: string | null = null;
    
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('.mp4') || url.includes('video')) {
        videoUrl = url;
      }
    });
    
    // Try to get video src
    const videoSrc = await page.evaluate(() => {
      const video = document.querySelector('video');
      return video?.src || video?.currentSrc;
    });
    
    if (videoSrc && !videoSrc.startsWith('blob:')) {
      videoUrl = videoSrc;
    }
    
    await browser.close();
    return videoUrl;
  } catch (error: any) {
    await browser.close();
    console.log(`  ❌ Error: ${error.message}`);
    return null;
  }
}

async function uploadToCloudinary(videoUrl: string, postId: number): Promise<string | null> {
  try {
    console.log(`  Uploading to Cloudinary...`);
    
    const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`;
    
    const timestamp = Math.round(Date.now() / 1000);
    const signature = require('crypto')
      .createHash('sha1')
      .update(`folder=fikriyot&public_id=fikriyot/video-${postId}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`)
      .digest('hex');

    const formData = new FormData();
    formData.append('file', videoUrl);
    formData.append('public_id', `fikriyot/video-${postId}`);
    formData.append('folder', 'fikriyot');
    formData.append('api_key', CLOUDINARY_API_KEY);
    formData.append('timestamp', timestamp.toString());
    formData.append('signature', signature);

    const response = await axios.post(uploadUrl, formData, {
      headers: formData.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    return response.data.secure_url;
  } catch (error: any) {
    console.log(`  ❌ Upload error: ${error.response?.data?.error?.message || error.message}`);
    return null;
  }
}

async function main() {
  console.log('Downloading videos with Playwright and uploading to Cloudinary...\n');

  const data = JSON.parse(fs.readFileSync(POSTS_FILE, 'utf-8'));
  const posts = data.posts;

  const videoPosts = posts.filter((p: any) => 
    p.media?.type === 'video' && !(p.media as any).cloudinaryUrl
  );
  
  console.log(`Video posts to process: ${videoPosts.length}\n`);

  let uploaded = 0;
  let failed = 0;

  for (const post of videoPosts.slice(0, 5)) { // Test with first 5
    try {
      console.log(`\nProcessing post ${post.postId}...`);
      
      const videoUrl = await downloadVideo(post.postId);
      
      if (!videoUrl) {
        console.log(`  ⚠️ Could not get video URL`);
        failed++;
        continue;
      }

      console.log(`  ✅ Got video URL: ${videoUrl.substring(0, 50)}...`);
      
      const cloudinaryUrl = await uploadToCloudinary(videoUrl, post.postId);
      
      if (cloudinaryUrl) {
        post.media.cloudinaryUrl = cloudinaryUrl;
        uploaded++;
        console.log(`  ✅ Uploaded to Cloudinary`);
      } else {
        failed++;
      }

    } catch (error: any) {
      failed++;
      console.log(`  ❌ Error: ${error.message}`);
    }
  }

  fs.writeFileSync(POSTS_FILE, JSON.stringify(data, null, 2), 'utf-8');

  console.log('\n\n📊 Summary:');
  console.log(`✅ Uploaded: ${uploaded}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`\n💾 Saved to ${POSTS_FILE}`);
}

main();
