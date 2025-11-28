/**
 * Telegram web versiyasidan postlarni scraping qilish
 * https://t.me/s/fikriyot_uz dan HTML tahlil qilish
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { PostInput } from '../types/post';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const CHANNEL_USERNAME = process.env.TELEGRAM_CHANNEL_USERNAME!;

async function scrapeTelegramWeb() {
  try {
    console.log('Scraping Telegram web version...');
    console.log(`URL: https://t.me/s/${CHANNEL_USERNAME}\n`);

    // Telegram web sahifasini olish
    const response = await axios.get(`https://t.me/s/${CHANNEL_USERNAME}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    const posts: PostInput[] = [];

    console.log('Parsing HTML...');

    // Telegram postlarini topish
    $('.tgme_widget_message').each((index, element) => {
      try {
        const $post = $(element);
        
        // Post ID'ni olish
        const postLink = $post.find('.tgme_widget_message_date').attr('href');
        const postIdMatch = postLink?.match(/\/(\d+)$/);
        const postId = postIdMatch ? parseInt(postIdMatch[1]) : null;
        
        if (!postId) return;

        // Post matnini olish
        const textElement = $post.find('.tgme_widget_message_text');
        let text = '';
        
        if (textElement.length > 0) {
          // HTML taglarni olib tashlash va matnni tozalash
          text = textElement.text().trim();
        }

        // Sana va vaqtni olish
        const dateElement = $post.find('.tgme_widget_message_date time');
        const datetime = dateElement.attr('datetime');
        
        if (!datetime) return;

        const date = new Date(datetime);
        const timestamp = Math.floor(date.getTime() / 1000);

        // Media borligini tekshirish
        const hasPhoto = $post.find('.tgme_widget_message_photo').length > 0;
        const hasVideo = $post.find('.tgme_widget_message_video').length > 0;
        const hasDocument = $post.find('.tgme_widget_message_document').length > 0;
        const hasMedia = hasPhoto || hasVideo || hasDocument;

        const post: PostInput = {
          channelUsername: CHANNEL_USERNAME,
          postId: postId,
          date: date.toISOString(),
          timestamp: timestamp,
          text: text,
          hasMedia: hasMedia,
        };

        posts.push(post);

        console.log(`✓ Post ${postId}:`);
        console.log(`  Date: ${date.toISOString()}`);
        console.log(`  Text: ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`);
        console.log(`  Has Media: ${hasMedia}`);
        console.log('');

      } catch (error) {
        console.error('Error parsing post:', error);
      }
    });

    if (posts.length === 0) {
      console.log('❌ No posts found! HTML structure might have changed.');
      console.log('Checking page content...');
      
      // Sahifa mazmunini tekshirish
      const title = $('title').text();
      console.log(`Page title: ${title}`);
      
      const messageCount = $('.tgme_widget_message').length;
      console.log(`Found ${messageCount} message elements`);
      
      return;
    }

    // Posts'ni timestamp bo'yicha tartiblash (eng yangi birinchi)
    posts.sort((a, b) => b.timestamp - a.timestamp);

    console.log(`\n📝 Found ${posts.length} posts. Saving...`);

    // JSON faylga saqlash
    const jsonData = {
      posts: posts.map((post, index) => ({
        id: (index + 1).toString(),
        ...post,
        createdAt: post.date,
      })),
      lastSync: new Date().toISOString(),
    };

    const jsonPath = path.resolve(__dirname, '../data/posts.json');
    fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2));
    console.log(`✓ Saved to JSON: ${jsonPath}`);

    console.log('\n🎉 Web scraping completed successfully!');
    console.log('Posts are now available on your website.');

  } catch (error: any) {
    console.error('❌ Scraping error:', error.message);
    
    if (error.response) {
      console.error('HTTP Status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    }
    
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check if the channel is public');
    console.log('2. Try accessing the URL manually in browser');
    console.log('3. The channel might have restrictions');
  }
}

scrapeTelegramWeb()
  .then(() => {
    console.log('\n✓ Scraping completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });