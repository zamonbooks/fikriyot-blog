/**
 * Scrape videos from Telegram Web with authentication
 */

import { chromium } from 'playwright';
import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import FormData from 'form-data';
import * as readline from 'readline';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const CHANNEL_USERNAME = process.env.TELEGRAM_CHANNEL_USERNAME!;
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME!;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY!;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET!;
const POSTS_FILE = path.resolve(process.cwd(), 'data/posts.json');
const AUTH_STATE_FILE = path.resolve(process.cwd(), '.telegram-auth-state.json');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query: string): Promise<string> {
    return new Promise(resolve => rl.question(query, resolve));
}

async function loginToTelegram(page: any) {
    console.log('\n🔐 Logging in to Telegram Web...\n');
    
    await page.goto('https://web.telegram.org/a/', { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForTimeout(5000);

    // Check if already logged in
    const isLoggedIn = await page.evaluate(() => {
        return !document.querySelector('.login-wrapper');
    });

    if (isLoggedIn) {
        console.log('✅ Already logged in!\n');
        return true;
    }

    console.log('📱 Please log in to Telegram Web in the browser window that opened.');
    console.log('   1. Enter your phone number');
    console.log('   2. Enter the code sent to your Telegram app');
    console.log('   3. Wait for the chat list to load\n');

    // Wait for login to complete (up to 5 minutes)
    try {
        await page.waitForSelector('.chat-list', { timeout: 300000 });
        console.log('✅ Login successful!\n');
        
        // Save auth state
        const cookies = await page.context().cookies();
        const localStorage = await page.evaluate(() => JSON.stringify(window.localStorage));
        
        fs.writeFileSync(AUTH_STATE_FILE, JSON.stringify({ cookies, localStorage }, null, 2));
        console.log('💾 Auth state saved for future use\n');
        
        return true;
    } catch (error) {
        console.log('❌ Login timeout or failed\n');
        return false;
    }
}

async function scrapeVideoWithAuth(page: any, postId: number): Promise<string | null> {
    console.log(`\n🔍 Scraping post ${postId}...`);
    
    try {
        // Navigate to channel
        const channelUrl = `https://web.telegram.org/a/#@${CHANNEL_USERNAME}`;
        console.log(`  🌐 Opening channel: ${channelUrl}`);
        
        await page.goto(channelUrl, { waitUntil: 'domcontentloaded', timeout: 120000 });
        await page.waitForTimeout(3000);

        // Search for specific message
        console.log(`  🔍 Looking for message ${postId}...`);
        
        // Try to find the message by scrolling
        const messageFound = await page.evaluate(async (targetId: number) => {
            // Look for message with data-mid attribute
            const messages = document.querySelectorAll('[data-mid]');
            for (const msg of messages) {
                const mid = msg.getAttribute('data-mid');
                if (mid === targetId.toString()) {
                    msg.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    return true;
                }
            }
            return false;
        }, postId);

        if (!messageFound) {
            console.log(`  ⚠️  Message not found, trying direct link...`);
            await page.goto(`https://web.telegram.org/a/#@${CHANNEL_USERNAME}/${postId}`, { 
                waitUntil: 'domcontentloaded', 
                timeout: 120000 
            });
            await page.waitForTimeout(3000);
        }

        // Capture video URLs from network
        const capturedUrls: string[] = [];
        
        page.on('response', async (response: any) => {
            const url = response.url();
            const contentType = response.headers()['content-type'] || '';
            
            if (contentType.includes('video/') || url.includes('.mp4')) {
                if (!url.includes('blob:') && url.startsWith('http')) {
                    capturedUrls.push(url);
                    console.log(`  📹 Captured: ${url.substring(0, 80)}...`);
                }
            }
        });

        // Try to find and click video
        console.log(`  🎬 Looking for video element...`);
        
        const videoClicked = await page.evaluate(() => {
            const videoElements = document.querySelectorAll('video, .media-video, .video-player');
            for (const el of videoElements) {
                (el as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
                (el as HTMLElement).click();
                return true;
            }
            return false;
        });

        if (videoClicked) {
            console.log(`  ✅ Video element clicked`);
            await page.waitForTimeout(5000);
        }

        // Try to play video
        await page.evaluate(() => {
            const videos = document.querySelectorAll('video');
            videos.forEach(v => {
                v.play().catch(() => {});
            });
        });

        await page.waitForTimeout(3000);

        // Check for captured URLs
        if (capturedUrls.length > 0) {
            const videoUrl = capturedUrls[capturedUrls.length - 1];
            console.log(`  ✅ Found video URL!`);
            return videoUrl;
        }

        // Try to get video src from DOM
        const videoSrc = await page.evaluate(() => {
            const video = document.querySelector('video');
            if (video) {
                if (video.src && !video.src.startsWith('blob:')) return video.src;
                const source = video.querySelector('source');
                if (source?.src && !source.src.startsWith('blob:')) return source.src;
            }
            return null;
        });

        if (videoSrc) {
            console.log(`  ✅ Found video in DOM!`);
            return videoSrc;
        }

        console.log(`  ❌ No video URL found`);
        return null;

    } catch (error: any) {
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
    const browser = await chromium.launch({ 
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1920, height: 1080 }
    });

    // Restore auth state if exists
    if (fs.existsSync(AUTH_STATE_FILE)) {
        try {
            const authState = JSON.parse(fs.readFileSync(AUTH_STATE_FILE, 'utf-8'));
            await context.addCookies(authState.cookies);
            console.log('✅ Restored previous auth state\n');
        } catch (error) {
            console.log('⚠️  Could not restore auth state\n');
        }
    }
    
    const page = await context.newPage();

    // Login to Telegram
    const loggedIn = await loginToTelegram(page);
    
    if (!loggedIn) {
        console.log('❌ Login failed. Exiting...');
        await browser.close();
        rl.close();
        return;
    }

    // Load posts
    const data = JSON.parse(fs.readFileSync(POSTS_FILE, 'utf-8'));
    const posts = data.posts;

    const videoPosts = posts.filter((p: any) =>
        p.media?.type === 'video' && !p.media.cloudinaryUrl
    );

    console.log(`\n${'='.repeat(60)}`);
    console.log(`🎬 Authenticated Video Scraper`);
    console.log(`${'='.repeat(60)}`);
    console.log(`Videos to process: ${videoPosts.length}\n`);

    if (videoPosts.length === 0) {
        console.log('✅ All videos are already uploaded!');
        await browser.close();
        rl.close();
        return;
    }

    // Process first 3 as test
    const testPosts = videoPosts.slice(0, 3);
    console.log(`🧪 Testing with first ${testPosts.length} posts...\n`);

    let uploaded = 0;
    let failed = 0;

    for (const post of testPosts) {
        try {
            const videoUrl = await scrapeVideoWithAuth(page, post.postId);

            if (!videoUrl) {
                failed++;
                continue;
            }

            const cloudinaryUrl = await uploadToCloudinary(videoUrl, post.postId);

            if (cloudinaryUrl) {
                post.media.cloudinaryUrl = cloudinaryUrl;
                uploaded++;
                console.log(`  ✅ Successfully uploaded!\n`);
                
                fs.writeFileSync(POSTS_FILE, JSON.stringify(data, null, 2), 'utf-8');
            } else {
                failed++;
            }

        } catch (error: any) {
            failed++;
            console.log(`  ❌ Error: ${error.message}\n`);
        }

        await new Promise(resolve => setTimeout(resolve, 3000));
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`📊 Results:`);
    console.log(`${'='.repeat(60)}`);
    console.log(`✅ Uploaded: ${uploaded}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`\n💾 Saved to ${POSTS_FILE}`);

    await browser.close();
    rl.close();
}

main();
