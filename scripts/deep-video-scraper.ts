/**
 * Deep scraping for video URLs using multiple methods
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

async function deepScrapeVideo(postId: number): Promise<string | null> {
    console.log(`\n🔍 Deep scraping post ${postId}...`);
    
    const browser = await chromium.launch({ 
        headless: false, // Non-headless mode to see what's happening
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1920, height: 1080 }
    });
    
    const page = await context.newPage();

    try {
        const url = `https://t.me/${CHANNEL_USERNAME}/${postId}`;
        
        // Capture all network requests
        const capturedUrls: { url: string; type: string }[] = [];
        
        page.on('request', (request) => {
            const reqUrl = request.url();
            if (reqUrl.includes('telesco.pe') || reqUrl.includes('.mp4') || reqUrl.includes('video')) {
                capturedUrls.push({ url: reqUrl, type: 'request' });
            }
        });

        page.on('response', async (response) => {
            const resUrl = response.url();
            const contentType = response.headers()['content-type'] || '';
            
            if (contentType.includes('video/') || resUrl.includes('.mp4')) {
                capturedUrls.push({ url: resUrl, type: 'response-video' });
                console.log(`  📹 Network: ${resUrl.substring(0, 80)}...`);
            }
        });

        console.log(`  🌐 Loading: ${url}`);
        await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
        
        await page.waitForTimeout(3000);

        // Method 1: Check for video element and all its attributes
        console.log(`  🔍 Method 1: Checking video element...`);
        const videoData = await page.evaluate(() => {
            const video = document.querySelector('video');
            if (!video) return null;
            
            return {
                src: video.src,
                currentSrc: video.currentSrc,
                poster: video.poster,
                dataSrc: video.getAttribute('data-src'),
                sources: Array.from(video.querySelectorAll('source')).map(s => ({
                    src: s.src,
                    type: s.type
                })),
                innerHTML: video.innerHTML
            };
        });

        if (videoData) {
            console.log(`  📊 Video element data:`, JSON.stringify(videoData, null, 2));
        }

        // Method 2: Try to click and play the video
        console.log(`  🔍 Method 2: Clicking video player...`);
        const clicked = await page.evaluate(() => {
            const selectors = [
                '.tgme_widget_message_video_player',
                '.tgme_widget_message_video_thumb',
                '.tgme_widget_message_video',
                'video',
                '.js-message_video_player'
            ];
            
            for (const selector of selectors) {
                const element = document.querySelector(selector);
                if (element) {
                    (element as HTMLElement).click();
                    return selector;
                }
            }
            return null;
        });

        if (clicked) {
            console.log(`  ✅ Clicked: ${clicked}`);
            await page.waitForTimeout(5000);
        }

        // Method 3: Scroll and interact
        console.log(`  🔍 Method 3: Scrolling and interacting...`);
        await page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight / 2);
        });
        await page.waitForTimeout(2000);

        // Method 4: Check page source for video URLs
        console.log(`  🔍 Method 4: Searching page source...`);
        const pageContent = await page.content();
        const mp4Matches = pageContent.match(/https?:\/\/[^"'\s]+\.mp4[^"'\s]*/g);
        const videoMatches = pageContent.match(/https?:\/\/cdn\d*\.telesco\.pe\/file\/[^"'\s]+/g);
        
        if (mp4Matches) {
            console.log(`  📹 Found .mp4 URLs in source: ${mp4Matches.length}`);
            mp4Matches.forEach(m => console.log(`    - ${m.substring(0, 80)}...`));
        }
        
        if (videoMatches) {
            console.log(`  📹 Found telesco.pe URLs in source: ${videoMatches.length}`);
            videoMatches.forEach(m => console.log(`    - ${m.substring(0, 80)}...`));
        }

        // Method 5: Check all captured network requests
        console.log(`  🔍 Method 5: Analyzing captured requests...`);
        console.log(`  📊 Total captured URLs: ${capturedUrls.length}`);
        
        const videoUrls = capturedUrls
            .filter(c => c.type === 'response-video' || c.url.includes('.mp4'))
            .map(c => c.url);

        if (videoUrls.length > 0) {
            console.log(`  ✅ Found ${videoUrls.length} potential video URLs`);
            const bestUrl = videoUrls[videoUrls.length - 1];
            await browser.close();
            return bestUrl;
        }

        // Method 6: Try alternative URL patterns
        console.log(`  🔍 Method 6: Trying alternative URL patterns...`);
        const alternativeUrls = [
            `https://t.me/${CHANNEL_USERNAME}/${postId}?embed=1`,
            `https://t.me/${CHANNEL_USERNAME}/${postId}?single`,
        ];

        for (const altUrl of alternativeUrls) {
            console.log(`  🔄 Trying: ${altUrl}`);
            await page.goto(altUrl, { waitUntil: 'networkidle', timeout: 30000 });
            await page.waitForTimeout(3000);
            
            if (capturedUrls.length > 0) {
                const newVideoUrls = capturedUrls
                    .filter(c => c.type === 'response-video')
                    .map(c => c.url);
                
                if (newVideoUrls.length > 0) {
                    const bestUrl = newVideoUrls[newVideoUrls.length - 1];
                    await browser.close();
                    return bestUrl;
                }
            }
        }

        await browser.close();
        console.log(`  ❌ No video URL found after all methods`);
        return null;

    } catch (error: any) {
        await browser.close();
        console.log(`  ❌ Error: ${error.message}`);
        return null;
    }
}

async function uploadToCloudinary(videoUrl: string, postId: number): Promise<string | null> {
    try {
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

        console.log(`  📤 Uploading to Cloudinary...`);

        const response = await axios.post(uploadUrl, formData, {
            headers: formData.getHeaders(),
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            timeout: 120000,
        });

        return response.data.secure_url;
    } catch (error: any) {
        console.error(`  ❌ Upload failed:`, error.response?.data?.error?.message || error.message);
        return null;
    }
}

async function main() {
    const data = JSON.parse(fs.readFileSync(POSTS_FILE, 'utf-8'));
    const posts = data.posts;

    const videoPosts = posts.filter((p: any) =>
        p.media?.type === 'video' && !p.media.cloudinaryUrl
    );

    console.log(`\n${'='.repeat(60)}`);
    console.log(`🎬 Deep Video Scraper`);
    console.log(`${'='.repeat(60)}`);
    console.log(`Total videos without Cloudinary URL: ${videoPosts.length}\n`);

    if (videoPosts.length === 0) {
        console.log('✅ All videos are already uploaded!');
        return;
    }

    // Test with first 3 posts
    const testPosts = videoPosts.slice(0, 3);
    console.log(`🧪 Testing with first ${testPosts.length} posts...\n`);

    let uploaded = 0;
    let failed = 0;

    for (const post of testPosts) {
        try {
            const videoUrl = await deepScrapeVideo(post.postId);

            if (!videoUrl) {
                console.log(`  ⚠️  No video URL found\n`);
                failed++;
                continue;
            }

            console.log(`  ✅ Found: ${videoUrl.substring(0, 80)}...`);

            const cloudinaryUrl = await uploadToCloudinary(videoUrl, post.postId);

            if (cloudinaryUrl) {
                post.media.cloudinaryUrl = cloudinaryUrl;
                uploaded++;
                console.log(`  ✅ Successfully uploaded!\n`);
                
                fs.writeFileSync(POSTS_FILE, JSON.stringify(data, null, 2), 'utf-8');
            } else {
                failed++;
                console.log(`  ❌ Upload failed\n`);
            }

        } catch (error: any) {
            failed++;
            console.log(`  ❌ Error: ${error.message}\n`);
        }

        await new Promise(resolve => setTimeout(resolve, 3000));
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`📊 Test Results:`);
    console.log(`${'='.repeat(60)}`);
    console.log(`✅ Uploaded: ${uploaded}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`\n💾 Saved to ${POSTS_FILE}`);
}

main();
