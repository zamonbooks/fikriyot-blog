/**
 * Download videos from Telegram using Playwright and upload to Cloudinary
 */

import { chromium } from 'playwright';
import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import FormData from 'form-data';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const CHANNEL_USERNAME = process.env.TELEGRAM_CHANNEL_USERNAME!;
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME!;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY!;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET!;
const POSTS_FILE = path.resolve(process.cwd(), 'data/posts.json');
const TEMP_DIR = path.resolve(process.cwd(), 'temp-videos');

// Create temp directory if it doesn't exist
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}

async function downloadVideo(postId: number): Promise<string | null> {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();

    try {
        const url = `https://t.me/${CHANNEL_USERNAME}/${postId}`;
        
        let videoUrl: string | null = null;
        
        page.on('response', async (response) => {
            const url = response.url();
            const contentType = response.headers()['content-type'] || '';
            
            if (contentType.includes('video/') || url.includes('.mp4')) {
                if (!url.includes('blob:') && url.startsWith('http')) {
                    videoUrl = url;
                    console.log(`    📹 Found: ${url.substring(0, 80)}...`);
                }
            }
        });

        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForSelector('video', { timeout: 10000 }).catch(() => null);

        // Try to trigger video load
        await page.evaluate(() => {
            const video = document.querySelector('video');
            const playButton = document.querySelector('.tgme_widget_message_video_player');
            
            if (playButton) {
                (playButton as HTMLElement).click();
            }
            
            if (video) {
                video.scrollIntoView();
                video.play().catch(() => {});
            }
        });

        await page.waitForTimeout(5000);

        await browser.close();

        if (!videoUrl) {
            return null;
        }

        // Download the video
        console.log(`    ⬇️  Downloading...`);
        const videoPath = path.join(TEMP_DIR, `video-${postId}.mp4`);
        
        const response = await axios.get(videoUrl, {
            responseType: 'stream',
            timeout: 120000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        const writer = fs.createWriteStream(videoPath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => {
                console.log(`    💾 Saved to ${videoPath}`);
                resolve(videoPath);
            });
            writer.on('error', reject);
        });

    } catch (error: any) {
        await browser.close();
        console.log(`    ❌ Error: ${error.message}`);
        return null;
    }
}

async function uploadToCloudinary(videoPath: string, postId: number): Promise<string | null> {
    try {
        const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`;

        const timestamp = Math.round(Date.now() / 1000);
        const signature = require('crypto')
            .createHash('sha1')
            .update(`folder=fikriyot&public_id=fikriyot/video-${postId}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`)
            .digest('hex');

        const formData = new FormData();
        formData.append('file', fs.createReadStream(videoPath));
        formData.append('public_id', `fikriyot/video-${postId}`);
        formData.append('folder', 'fikriyot');
        formData.append('api_key', CLOUDINARY_API_KEY);
        formData.append('timestamp', timestamp.toString());
        formData.append('signature', signature);
        formData.append('resource_type', 'video');

        console.log(`    ☁️  Uploading to Cloudinary...`);

        const response = await axios.post(uploadUrl, formData, {
            headers: formData.getHeaders(),
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            timeout: 300000,
        });

        // Delete local file after successful upload
        fs.unlinkSync(videoPath);
        console.log(`    🗑️  Deleted local file`);

        return response.data.secure_url;
    } catch (error: any) {
        console.error(`    ❌ Upload failed:`, error.response?.data?.error?.message || error.message);
        return null;
    }
}

async function downloadAndUploadVideos() {
    console.log('Downloading and uploading videos to Cloudinary...\n');

    const data = JSON.parse(fs.readFileSync(POSTS_FILE, 'utf-8'));
    const posts = data.posts;

    const videoPosts = posts.filter((p: any) =>
        p.media?.type === 'video' && !(p.media as any).cloudinaryUrl
    );

    console.log(`Video posts to process: ${videoPosts.length}\n`);

    let uploaded = 0;
    let failed = 0;

    for (const post of videoPosts) {
        try {
            console.log(`\nProcessing post ${post.postId}...`);

            const videoPath = await downloadVideo(post.postId);

            if (!videoPath) {
                console.log(`  ⚠️ Video download failed`);
                failed++;
                continue;
            }

            const cloudinaryUrl = await uploadToCloudinary(videoPath, post.postId);

            if (cloudinaryUrl) {
                post.media.cloudinaryUrl = cloudinaryUrl;
                uploaded++;
                console.log(`  ✅ Success!`);
            } else {
                failed++;
                console.log(`  ❌ Upload failed`);
                // Delete local file if upload failed
                if (fs.existsSync(videoPath)) {
                    fs.unlinkSync(videoPath);
                }
            }

        } catch (error: any) {
            failed++;
            console.log(`  ❌ Error: ${error.message}`);
        }

        // Save progress after each video
        fs.writeFileSync(POSTS_FILE, JSON.stringify(data, null, 2), 'utf-8');

        await new Promise(resolve => setTimeout(resolve, 3000));
    }

    console.log('\n📊 Summary:');
    console.log(`✅ Uploaded: ${uploaded}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`\n💾 Saved to ${POSTS_FILE}`);

    // Clean up temp directory
    if (fs.existsSync(TEMP_DIR)) {
        const files = fs.readdirSync(TEMP_DIR);
        if (files.length === 0) {
            fs.rmdirSync(TEMP_DIR);
            console.log('🗑️  Cleaned up temp directory');
        }
    }
}

downloadAndUploadVideos();
