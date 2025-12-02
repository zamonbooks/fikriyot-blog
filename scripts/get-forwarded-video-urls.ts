/**
 * Get video URLs from forwarded messages
 * Bot already forwarded large videos to user, now we extract their URLs
 */

import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const USER_ID = '6932895539';
const POSTS_FILE = path.resolve(process.cwd(), 'data/posts.json');
const BOT_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// Large video posts
const LARGE_VIDEO_POSTS = [285, 243, 203, 131, 127, 99, 94, 90];

async function getForwardedMessages() {
    try {
        console.log('📥 Getting forwarded messages from chat...\n');

        // Get chat history with user
        const updates = await axios.get(`${BOT_API}/getUpdates`, {
            params: {
                offset: -100,
                limit: 100
            }
        });

        const messages = updates.data.result
            .filter((u: any) => u.message?.chat?.id?.toString() === USER_ID)
            .map((u: any) => u.message);

        console.log(`Found ${messages.length} messages in chat\n`);

        // Find video messages
        const videoMessages = messages.filter((m: any) => m.video);
        
        console.log(`Video messages: ${videoMessages.length}\n`);

        for (const msg of videoMessages) {
            const video = msg.video;
            const forwardFrom = msg.forward_from_message_id;
            
            console.log(`Message ID: ${msg.message_id}`);
            console.log(`  Forward from: ${forwardFrom || 'N/A'}`);
            console.log(`  Video: ${video.duration}s, ${Math.round((video.file_size || 0) / 1024 / 1024)}MB`);
            console.log(`  File ID: ${video.file_id.substring(0, 40)}...`);
            
            // Try to get file URL
            try {
                const fileResponse = await axios.get(`${BOT_API}/getFile`, {
                    params: { file_id: video.file_id }
                });
                
                const filePath = fileResponse.data.result.file_path;
                const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`;
                console.log(`  URL: ${fileUrl.substring(0, 80)}...`);
            } catch (e: any) {
                console.log(`  URL: ${e.response?.data?.description || 'Too large for Bot API'}`);
            }
            
            console.log('');
        }

        return videoMessages;

    } catch (error: any) {
        console.log(`❌ Error: ${error.response?.data?.description || error.message}`);
        return [];
    }
}

async function main() {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔍 Forwarded Video URL Extractor`);
    console.log(`${'='.repeat(60)}\n`);

    const messages = await getForwardedMessages();

    console.log(`\n${'='.repeat(60)}`);
    console.log(`📊 Summary:`);
    console.log(`${'='.repeat(60)}`);
    console.log(`Total video messages found: ${messages.length}`);
    console.log(`\n💡 Note: Videos larger than 20MB cannot be downloaded via Bot API`);
    console.log(`   These videos need to be downloaded manually or via Telegram Client API`);
}

main();
