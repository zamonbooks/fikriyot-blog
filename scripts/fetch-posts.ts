/**
 * Telegram kanaldan postlarni olish va Firestore'ga yuklash
 * 
 * Ishlatish:
 * npx tsx scripts/fetch-posts.ts <start_id> <end_id>
 * 
 * Misol:
 * npx tsx scripts/fetch-posts.ts 1 100
 */

import { Telegraf } from 'telegraf';
import { getFirestoreService } from '../lib/firestore-service';
import { transformTelegramPost } from '../lib/post-validator';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const CHANNEL_USERNAME = process.env.TELEGRAM_CHANNEL_USERNAME!;

if (!BOT_TOKEN || !CHANNEL_USERNAME) {
    console.error('Error: TELEGRAM_BOT_TOKEN and TELEGRAM_CHANNEL_USERNAME must be set');
    process.exit(1);
}

const startId = parseInt(process.argv[2] || '1');
const endId = parseInt(process.argv[3] || '100');

async function fetchPosts() {
    console.log(`Fetching posts from ${startId} to ${endId}...`);
    console.log(`Channel: @${CHANNEL_USERNAME}\n`);

    const bot = new Telegraf(BOT_TOKEN);
    const firestoreService = getFirestoreService();

    let successCount = 0;
    let errorCount = 0;

    for (let postId = startId; postId <= endId; postId++) {
        try {
            // Telegram API orqali post olish
            const chatId = `@${CHANNEL_USERNAME}`;
            const message = await bot.telegram.forwardMessage(
                chatId, // to
                chatId, // from
                postId  // message_id
            );

            // Post ma'lumotlarini transform qilish
            const post = transformTelegramPost(message, CHANNEL_USERNAME);

            if (post) {
                // Firestore'ga qo'shish
                await firestoreService.addPost(post);
                console.log(`✓ Post ${postId} added`);
                successCount++;
            } else {
                console.log(`✗ Post ${postId} validation failed`);
                errorCount++;
            }

            // Rate limiting: 1 request per 100ms
            await new Promise(resolve => setTimeout(resolve, 100));

        } catch (error: any) {
            if (error.response?.error_code === 400) {
                // Post topilmadi yoki o'chirilgan
                console.log(`- Post ${postId} not found`);
            } else {
                console.error(`✗ Error fetching post ${postId}:`, error.message);
            }
            errorCount++;
        }
    }

    console.log(`\n✓ Fetch completed`);
    console.log(`  Success: ${successCount}`);
    console.log(`  Errors: ${errorCount}`);
}

fetchPosts()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
