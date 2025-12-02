/**
 * Forward remaining large videos to user for manual download
 */

import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const CHANNEL_USERNAME = process.env.TELEGRAM_CHANNEL_USERNAME!;
const USER_ID = '6932895539';
const BOT_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// Remaining large videos
const REMAINING_VIDEOS = [285, 243, 203, 131, 127, 99, 94, 90];

async function forwardVideos() {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📤 Forwarding Remaining Videos`);
    console.log(`${'='.repeat(60)}\n`);

    console.log(`Videos to forward: ${REMAINING_VIDEOS.length}\n`);

    let forwarded = 0;
    let failed = 0;

    for (const postId of REMAINING_VIDEOS) {
        try {
            console.log(`[${forwarded + failed + 1}/${REMAINING_VIDEOS.length}] Forwarding post ${postId}...`);

            const channelId = `@${CHANNEL_USERNAME}`;
            
            const response = await axios.post(`${BOT_API}/forwardMessage`, {
                chat_id: USER_ID,
                from_chat_id: channelId,
                message_id: postId
            });

            const forwardedMsg = response.data.result;
            
            if (forwardedMsg.video) {
                const video = forwardedMsg.video;
                console.log(`  ✅ Forwarded (${video.duration}s, ${Math.round((video.file_size || 0) / 1024 / 1024)}MB)`);
                forwarded++;
            } else {
                console.log(`  ⚠️  Forwarded but no video found`);
                failed++;
            }

        } catch (error: any) {
            console.log(`  ❌ Error: ${error.response?.data?.description || error.message}`);
            failed++;
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`📊 Results:`);
    console.log(`${'='.repeat(60)}`);
    console.log(`✅ Forwarded: ${forwarded}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`\n📱 Check your Telegram for forwarded videos!`);
    console.log(`💾 Download them manually, then run upload script.`);
}

forwardVideos();
