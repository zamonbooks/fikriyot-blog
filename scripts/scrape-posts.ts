/**
 * Telegram kanaldan postlarni scrape qilish
 * 
 * Ishlatish:
 * npx tsx scripts/scrape-posts.ts
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { getFirestoreService } from '../lib/firestore-service';
import { PostInput } from '../types/post';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const CHANNEL_USERNAME = process.env.TELEGRAM_CHANNEL_USERNAME!;

async function scrapePosts() {
  console.log(`Scraping posts from @${CHANNEL_USERNAME}...\n`);

  const firestoreService = getFirestoreService();
  const url = `https://t.me/s/${CHANNEL_USERNAME}`;

  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    const posts: PostInput[] = [];

    $('.tgme_widget_message').each((i, element) => {
      const $el = $(element);
      
      // Post ID olish
      const dataPost = $el.attr('data-post');
      if (!dataPost) return;
      
      const postId = parseInt(dataPost.split('/')[1]);
      
      // Sana olish
      const timeEl = $el.find('.tgme_widget_message_date time');
      const datetime = timeEl.attr('datetime');
      if (!datetime) return;
      
      const date = new Date(datetime);
      const timestamp = Math.floor(date.getTime() / 1000);
      
      // Matn olish
      const text = $el.find('.tgme_widget_message_text').text().trim();
      
      // Media borligini tekshirish
      const hasMedia = $el.find('.tgme_widget_message_photo, .tgme_widget_message_video').length > 0;

      posts.push({
        channelUsername: CHANNEL_USERNAME,
        postId,
        date: date.toISOString(),
        timestamp,
        text: text || '',
        hasMedia,
      });
    });

    console.log(`Found ${posts.length} posts\n`);

    // Firestore'ga qo'shish
    let successCount = 0;
    for (const post of posts) {
      try {
        await firestoreService.addPost(post);
        console.log(`✓ Post ${post.postId} added`);
        successCount++;
      } catch (error: any) {
        if (error.message.includes('already exists')) {
          console.log(`- Post ${post.postId} already exists`);
        } else {
          console.error(`✗ Error adding post ${post.postId}:`, error.message);
        }
      }
    }

    console.log(`\n✓ Scraping completed`);
    console.log(`  Success: ${successCount}`);
    console.log(`  Total: ${posts.length}`);

  } catch (error: any) {
    console.error('Error scraping posts:', error.message);
    process.exit(1);
  }
}

scrapePosts()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
