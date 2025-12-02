/**
 * Download videos using Telegram Bot API
 */

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

const BOT_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

interface TelegramMessage {
    message_id: number;
    video?: {
        file_id: string;
        file_unique_id: string;
        width: number;
        height: number;
        duration: number;
        file_size?: number;
    };
}

const USER_ID = '6932895539'; // Your Telegram user ID

async function getChannelPost(postId: number): Promise<TelegramMessage | null> {
    try {
        const channelId = `@${CHANNEL_USERNAME}`;
        
        // Forward message from channel to user
        console.log(`    📤 Forwarding message to user...`);
        const forwardResponse = await axios.post(`${BOT_API}/forwardMessage`, {
            chat_id: USER_ID,
            from_chat_id: channelId,
            message_id: postId
        });

        const forwardedMessage = forwardResponse.data.result;
        console.log(`    ✅ Message forwarded (ID: ${forwardedMessage.message_id})`);

        // Return the forwarded message which should contain video info
        return forwardedMessage;
    } catch (error: any) {
        console.log(`    ⚠️  Could not forward message: ${error.response?.data?.description || error.message}`);
        return null;
    }
}

async function getVideoFileUrl(fileId: string, fileSize?: number): Promise<string | null> {
    try {
        // Bot API limit is 20MB
        if (fileSize && fileSize > 20 * 1024 * 1024) {
            console.log(`    ⚠️  File too large (${Math.round(fileSize / 1024 / 1024)}MB > 20MB limit)`);
            console.log(`    💡 Skipping - will use thumbnail or manual download`);
            return null;
        }

        const response = await axios.get(`${BOT_API}/getFile`, {
            params: { file_id: fileId }
        });

        const filePath = response.data.result.file_path;
        const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`;
        
        return fileUrl;
    } catch (error: any) {
        console.log(`    ❌ Error getting file: ${error.response?.data?.description || error.message}`);
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

async function testBotAccess() {
    console.log('🤖 Testing Bot API access...\n');
    
    try {
        // Test 1: Get bot info
        const meResponse = await axios.get(`${BOT_API}/getMe`);
        const botInfo = meResponse.data.result;
        console.log(`✅ Bot connected: @${botInfo.username}`);
        console.log(`   Name: ${botInfo.first_name}`);
        console.log(`   ID: ${botInfo.id}\n`);

        // Test 2: Try to get channel info
        try {
            const chatResponse = await axios.get(`${BOT_API}/getChat`, {
                params: { chat_id: `@${CHANNEL_USERNAME}` }
            });
            const chatInfo = chatResponse.data.result;
            console.log(`✅ Channel access: @${chatInfo.username}`);
            console.log(`   Title: ${chatInfo.title}`);
            console.log(`   Type: ${chatInfo.type}\n`);
        } catch (error: any) {
            console.log(`⚠️  Channel access: ${error.response?.data?.description || error.message}\n`);
        }

        return true;
    } catch (error: any) {
        console.log(`❌ Bot API error: ${error.response?.data?.description || error.message}\n`);
        return false;
    }
}

async function downloadVideos() {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🎬 Bot Video Downloader`);
    console.log(`${'='.repeat(60)}\n`);

    // Test bot access first
    const hasAccess = await testBotAccess();
    if (!hasAccess) {
        console.log('❌ Cannot proceed without bot access');
        return;
    }

    const data = JSON.parse(fs.readFileSync(POSTS_FILE, 'utf-8'));
    const posts = data.posts;

    const videoPosts = posts.filter((p: any) =>
        p.media?.type === 'video' && !p.media.cloudinaryUrl
    );

    console.log(`Total videos without Cloudinary URL: ${videoPosts.length}\n`);

    if (videoPosts.length === 0) {
        console.log('✅ All videos are already uploaded!');
        return;
    }

    // Process all posts
    const testPosts = videoPosts;
    console.log(`📥 Processing all ${testPosts.length} posts...\n`);

    let uploaded = 0;
    let failed = 0;

    for (const post of testPosts) {
        try {
            console.log(`\n📹 Processing post ${post.postId}...`);

            const message = await getChannelPost(post.postId);

            if (!message || !message.video) {
                console.log(`  ⚠️  No video found in message`);
                failed++;
                continue;
            }

            const videoSize = message.video.file_size || 0;
            console.log(`  ✅ Video found (${message.video.duration}s, ${Math.round(videoSize / 1024 / 1024)}MB)`);

            const videoUrl = await getVideoFileUrl(message.video.file_id, videoSize);

            if (!videoUrl) {
                console.log(`  ⚠️  Could not get video URL`);
                failed++;
                continue;
            }

            console.log(`  ✅ Video URL obtained`);

            const cloudinaryUrl = await uploadToCloudinary(videoUrl, post.postId);

            if (cloudinaryUrl) {
                post.media.cloudinaryUrl = cloudinaryUrl;
                uploaded++;
                console.log(`  ✅ Successfully uploaded!`);
                
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

    console.log(`\n${'='.repeat(60)}`);
    console.log(`📊 Test Results:`);
    console.log(`${'='.repeat(60)}`);
    console.log(`✅ Uploaded: ${uploaded}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`\n💾 Saved to ${POSTS_FILE}`);
}

downloadVideos();
