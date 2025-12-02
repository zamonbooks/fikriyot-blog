/**
 * Scrape video URLs from Telegram Web using Playwright and upload to Cloudinary
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

async function getVideoUrl(postId: number): Promise<string | null> {
    const browser = await chromium.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 720 }
    });
    
    const page = await context.newPage();

    try {
        const url = `https://t.me/${CHANNEL_USERNAME}/${postId}`;

        // Intercept network requests to capture video URL
        let videoUrl: string | null = null;
        const capturedUrls: string[] = [];

        page.on('response', async (response) => {
            const responseUrl = response.url();
            const contentType = response.headers()['content-type'] || '';

            // Check if it's a video file
            if (contentType.includes('video/') || responseUrl.includes('.mp4')) {
                if (!responseUrl.includes('blob:') && responseUrl.startsWith('http')) {
                    capturedUrls.push(responseUrl);
                    if (!videoUrl) {
                        videoUrl = responseUrl;
                    }
                }
            }
        });

        // Navigate to the post
        console.log(`    🌐 Loading page...`);
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

        // IMPORTANT: Wait longer for slow internet and rendering
        console.log(`    ⏳ Waiting for content to render (15 seconds)...`);
        await page.waitForTimeout(15000);

        // Check if video element exists
        const hasVideo = await page.evaluate(() => {
            return !!document.querySelector('video');
        });

        if (!hasVideo) {
            console.log(`    ⚠️  No video element found on page`);
            await browser.close();
            return null;
        }

        console.log(`    ✅ Video element found`);

        // Method 1: Try to get video source from DOM
        if (!videoUrl) {
            const videoSrc = await page.evaluate(() => {
                const video = document.querySelector('video');
                if (video) {
                    const source = video.querySelector('source');
                    if (source?.src && !source.src.startsWith('blob:')) return source.src;
                    if (video.src && !video.src.startsWith('blob:')) return video.src;
                    if (video.getAttribute('data-src')) return video.getAttribute('data-src');
                }
                return null;
            });

            if (videoSrc) {
                videoUrl = videoSrc;
                console.log(`    📹 Method 1: Found in DOM`);
            }
        }

        // Method 2: Click play and wait for network request
        if (!videoUrl) {
            console.log(`    🔄 Method 2: Clicking play button and waiting...`);
            
            await page.evaluate(() => {
                const video = document.querySelector('video');
                const playButton = document.querySelector('.tgme_widget_message_video_player, .tgme_widget_message_video_thumb');
                
                if (playButton) {
                    (playButton as HTMLElement).click();
                }
                
                if (video) {
                    video.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setTimeout(() => {
                        video.play().catch(() => {});
                    }, 1000);
                }
            });

            // Wait longer for video to load
            await page.waitForTimeout(8000);
            
            if (capturedUrls.length > 0) {
                videoUrl = capturedUrls[capturedUrls.length - 1];
                console.log(`    📹 Method 2: Captured from network`);
            }
        }

        // Method 3: Try to extract from page source
        if (!videoUrl) {
            console.log(`    🔍 Method 3: Checking page source...`);
            
            const pageContent = await page.content();
            const mp4Match = pageContent.match(/https:\/\/[^"'\s]+\.mp4[^"'\s]*/);
            
            if (mp4Match) {
                videoUrl = mp4Match[0];
                console.log(`    📹 Method 3: Found in page source`);
            }
        }

        // Method 4: Check for telesco.pe links
        if (!videoUrl) {
            console.log(`    🔍 Method 4: Looking for telesco.pe links...`);
            
            const telescopeUrl = await page.evaluate(() => {
                const links = Array.from(document.querySelectorAll('a, video, source'));
                for (const el of links) {
                    const href = (el as any).href || (el as any).src;
                    if (href && href.includes('telesco.pe') && href.includes('file')) {
                        return href;
                    }
                }
                return null;
            });

            if (telescopeUrl) {
                videoUrl = telescopeUrl;
                console.log(`    📹 Method 4: Found telesco.pe link`);
            }
        }

        await browser.close();
        
        if (videoUrl) {
            console.log(`    ✅ Video URL: ${videoUrl.substring(0, 60)}...`);
        }
        
        return videoUrl;

    } catch (error: any) {
        await browser.close();
        console.log(`    ❌ Error: ${error.message}`);
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

        const response = await axios.post(uploadUrl, formData, {
            headers: formData.getHeaders(),
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
        });

        return response.data.secure_url;
    } catch (error: any) {
        console.error(`Upload failed:`, error.response?.data?.error?.message || error.message);
        return null;
    }
}

async function scrapeAndUploadVideos() {
    console.log('Scraping video URLs and uploading to Cloudinary...\n');

    const data = JSON.parse(fs.readFileSync(POSTS_FILE, 'utf-8'));
    const posts = data.posts;

    // Filter: only videos WITHOUT cloudinaryUrl
    const videoPosts = posts.filter((p: any) =>
        p.media?.type === 'video' && !p.media.cloudinaryUrl
    );

    console.log(`Total video posts: ${posts.filter((p: any) => p.media?.type === 'video').length}`);
    console.log(`Already uploaded: ${posts.filter((p: any) => p.media?.type === 'video' && p.media.cloudinaryUrl).length}`);
    console.log(`Remaining to process: ${videoPosts.length}\n`);

    if (videoPosts.length === 0) {
        console.log('✅ All videos are already uploaded!');
        return;
    }

    let uploaded = 0;
    let failed = 0;
    let skipped = 0;

    for (const post of videoPosts) {
        try {
            console.log(`\n[${uploaded + failed + skipped + 1}/${videoPosts.length}] Processing post ${post.postId}...`);

            // Skip if already has cloudinaryUrl (double check)
            if (post.media.cloudinaryUrl) {
                console.log(`  ⏭️  Already uploaded, skipping`);
                skipped++;
                continue;
            }

            const videoUrl = await getVideoUrl(post.postId);

            if (!videoUrl) {
                console.log(`  ⚠️  Video URL not found`);
                failed++;
                continue;
            }

            console.log(`  ✅ Found video URL`);
            console.log(`  📤 Uploading to Cloudinary...`);

            const cloudinaryUrl = await uploadToCloudinary(videoUrl, post.postId);

            if (cloudinaryUrl) {
                post.media.cloudinaryUrl = cloudinaryUrl;
                uploaded++;
                console.log(`  ✅ Successfully uploaded!`);
                
                // Save after each successful upload
                fs.writeFileSync(POSTS_FILE, JSON.stringify(data, null, 2), 'utf-8');
            } else {
                failed++;
                console.log(`  ❌ Upload failed`);
            }

        } catch (error: any) {
            failed++;
            console.log(`  ❌ Error: ${error.message}`);
        }

        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 Final Summary:');
    console.log('='.repeat(50));
    console.log(`✅ Newly uploaded: ${uploaded}`);
    console.log(`⏭️  Skipped (already uploaded): ${skipped}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📁 Total processed: ${uploaded + failed + skipped}`);
    console.log(`\n💾 Saved to ${POSTS_FILE}`);
}

scrapeAndUploadVideos();
