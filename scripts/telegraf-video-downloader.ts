/**
 * Download videos using Telegraf library
 */

import { Telegraf } from 'telegraf';
import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import FormData from 'form-data';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const CHANNEL_USERNAME = process.env.TELEGRAM_CHANNEL_USERNAME!;
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME!;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY!;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET!;
const POSTS_FILE = path.resolve(process.cwd(), 'data/posts.json');

const bot = new Telegraf(BOT_TOKEN);

async function getVideoFromChannel(postId: number): Promise<string | null> {
    try {
        console.log(`  🔍 Trying to get video file...`);
        
        // Get file link using bot API
        const chatId = `@${CHANNEL_USERNAME}`;
        
        // Try to get the message (this might not work for old messages)
        const fileUrl = `https://api.telegram.org/bot${BOT_TOKEN}/getFile`;
        
        // Alternative: Use channel post link
        const postUrl = `https://t.me/${CHANNEL_USERNAME}/${postId}`;
        console.log(`  📎 Post URL: ${postUrl}`);
        
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
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🎬 Telegraf Video Downloader`);
    console.log(`${'='.repeat(60)}\n`);

    try {
        const botInfo = await bot.telegram.getMe();
        console.log(`✅ Bot: @${botInfo.username}\n`);

        const data = JSON.parse(fs.readFileSync(POSTS_FILE, 'utf-8'));
        const posts = data.posts;

        const videoPosts = posts.filter((p: any) =>
            p.media?.type === 'video' && !p.media.cloudinaryUrl
        );

        console.log(`Videos to process: ${videoPosts.length}\n`);

        if (videoPosts.length === 0) {
            console.log('✅ All videos uploaded!');
            return;
        }

        console.log('⚠️  Bot API limitation: Cannot access old channel posts directly.');
        console.log('📝 Possible solutions:');
        console.log('   1. Use Telegram Client API (requires phone number)');
        console.log('   2. Download videos manually and upload');
        console.log('   3. Use existing thumbnail URLs\n');

        // Show first few posts that need videos
        console.log('Posts needing videos:');
        videoPosts.slice(0, 5).forEach((p: any) => {
            console.log(`  - Post ${p.postId}: https://t.me/${CHANNEL_USERNAME}/${p.postId}`);
        });

    } catch (error: any) {
        console.log(`❌ Error: ${error.message}`);
    }
}

main();
