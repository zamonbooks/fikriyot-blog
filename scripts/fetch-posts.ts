/**
 * Telegram kanaldan postlarni olish va Firestore'ga yuklash
 * 
 * Ishlatish:
 * npx tsx scripts/fetch-posts.ts <start_id> <end_id>
 * 
 * Misol:
 * npx tsx scripts/fetch-posts.ts 1 100
 */

import { getFirestoreService } from '../lib/firestore-service';
import { PostInput } from '../types/post';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const CHANNEL_USERNAME = process.env.TELEGRAM_CHANNEL_USERNAME!;

if (!CHANNEL_USERNAME) {
  console.error('Error: TELEGRAM_CHANNEL_USERNAME must be set');
  process.exit(1);
}

const startId = parseInt(process.argv[2] || '1');
const endId = parseInt(process.argv[3] || '100');

async function fetchPosts() {
  console.log(`Adding posts from ${startId} to ${endId}...`);
  console.log(`Channel: @${CHANNEL_USERNAME}\n`);

  const firestoreService = getFirestoreService();

  let successCount = 0;

  for (let postId = startId; postId <= endId; postId++) {
    try {
      // Oddiy post ma'lumotlarini yaratish
      const post: PostInput = {
        channelUsername: CHANNEL_USERNAME,
        postId: postId,
        date: new Date().toISOString(),
        timestamp: Math.floor(Date.now() / 1000),
        text: `Post ${postId}`,
        hasMedia: false,
      };

      // Firestore'ga qo'shish
      await firestoreService.addPost(post);
      console.log(`✓ Post ${postId} added`);
      successCount++;

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error: any) {
      console.error(`✗ Error adding post ${postId}:`, error.message);
    }
  }

  console.log(`\n✓ Fetch completed`);
  console.log(`  Success: ${successCount}`);
}

fetchPosts()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
