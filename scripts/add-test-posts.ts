/**
 * Test postlarni qo'shish
 */

import { getFirestoreService } from '../lib/firestore-service';
import { PostInput } from '../types/post';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const CHANNEL_USERNAME = process.env.TELEGRAM_CHANNEL_USERNAME!;

async function addTestPosts() {
  console.log('Adding test posts...\n');

  const firestoreService = getFirestoreService();

  // Real Telegram post ID'lari
  const postIds = [3, 4, 5, 6, 7, 8, 9, 10];

  for (const postId of postIds) {
    try {
      const post: PostInput = {
        channelUsername: CHANNEL_USERNAME,
        postId: postId,
        date: new Date().toISOString(),
        timestamp: Math.floor(Date.now() / 1000) - (postId * 3600), // Har bir post 1 soat oldin
        text: `Post ${postId} from Telegram`,
        hasMedia: false,
      };

      await firestoreService.addPost(post);
      console.log(`✓ Post ${postId} added`);

      // Biroz kutish
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log(`- Post ${postId} already exists`);
      } else {
        console.error(`✗ Error adding post ${postId}:`, error.message);
      }
    }
  }

  console.log('\n✓ Test posts added');
}

addTestPosts()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });