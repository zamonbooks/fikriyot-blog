/**
 * Test scraping one video to debug
 */

import { chromium } from 'playwright';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const CHANNEL_USERNAME = process.env.TELEGRAM_CHANNEL_USERNAME!;
const TEST_POST_ID = 285; // Test with one post

async function testVideo() {
    console.log(`Testing video scraping for post ${TEST_POST_ID}...\n`);

    const browser = await chromium.launch({ 
        headless: false, // Show browser to see what's happening
        args: ['--no-sandbox']
    });
    
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        viewport: { width: 1280, height: 720 }
    });
    
    const page = await context.newPage();

    try {
        const url = `https://t.me/${CHANNEL_USERNAME}/${TEST_POST_ID}`;
        
        let videoUrl: string | null = null;

        page.on('response', async (response) => {
            const responseUrl = response.url();
            const contentType = response.headers()['content-type'] || '';

            if (contentType.includes('video/') || responseUrl.includes('.mp4')) {
                if (!responseUrl.includes('blob:') && responseUrl.startsWith('http')) {
                    console.log(`📹 Captured: ${responseUrl}`);
                    videoUrl = responseUrl;
                }
            }
        });

        console.log(`Loading: ${url}`);
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

        console.log(`Waiting 15 seconds for content...`);
        await page.waitForTimeout(15000);

        const hasVideo = await page.evaluate(() => {
            return !!document.querySelector('video');
        });

        console.log(`Has video element: ${hasVideo}`);

        if (hasVideo) {
            console.log(`Clicking play...`);
            await page.evaluate(() => {
                const video = document.querySelector('video');
                const playButton = document.querySelector('.tgme_widget_message_video_player, .tgme_widget_message_video_thumb');
                
                if (playButton) {
                    (playButton as HTMLElement).click();
                }
                
                if (video) {
                    video.scrollIntoView();
                    setTimeout(() => {
                        video.play().catch(() => {});
                    }, 1000);
                }
            });

            console.log(`Waiting 10 seconds for video to load...`);
            await page.waitForTimeout(10000);
        }

        console.log(`\nFinal result: ${videoUrl || 'NOT FOUND'}`);

        // Keep browser open for inspection
        console.log(`\nBrowser will stay open for 30 seconds for inspection...`);
        await page.waitForTimeout(30000);

        await browser.close();

    } catch (error: any) {
        console.error(`Error: ${error.message}`);
        await browser.close();
    }
}

testVideo();
