/**
 * Barcha postlarni olish (1 dan 400 gacha ID'larni tekshirish)
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { PostInput } from '../types/post';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const CHANNEL_USERNAME = process.env.TELEGRAM_CHANNEL_USERNAME!;

async function scrapeAllPosts() {
  try {
    console.log('Scraping ALL posts from Telegram web...');
    console.log(`Channel: @${CHANNEL_USERNAME}`);
    console.log('Checking post IDs from 1 to 400...\n');

    const allPosts: PostInput[] = [];
    let foundCount = 0;
    let checkedCount = 0;

    // 1 dan 400 gacha barcha ID'larni tekshirish
    for (let postId = 1; postId <= 400; postId++) {
      try {
        checkedCount++;
        
        // Har bir post uchun alohida request
        const postUrl = `https://t.me/s/${CHANNEL_USERNAME}/${postId}`;
        
        const response = await axios.get(postUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
          timeout: 5000
        });

        const $ = cheerio.load(response.data);
        
        // Post mavjudligini tekshirish
        const messageElement = $('.tgme_widget_message').first();
        
        if (messageElement.length > 0) {
          // Post matnini olish
          const textElement = messageElement.find('.tgme_widget_message_text');
          let text = '';
          
          if (textElement.length > 0) {
            text = textElement.text().trim();
          }

          // Sana va vaqtni olish
          const dateElement = messageElement.find('.tgme_widget_message_date time');
          const datetime = dateElement.attr('datetime');
          
          if (datetime) {
            const date = new Date(datetime);
            const timestamp = Math.floor(date.getTime() / 1000);

            // Media borligini tekshirish
            const hasPhoto = messageElement.find('.tgme_widget_message_photo').length > 0;
            const hasVideo = messageElement.find('.tgme_widget_message_video').length > 0;
            const hasDocument = messageElement.find('.tgme_widget_message_document').length > 0;
            const hasMedia = hasPhoto || hasVideo || hasDocument;

            const post: PostInput = {
              channelUsername: CHANNEL_USERNAME,
              postId: postId,
              date: date.toISOString(),
              timestamp: timestamp,
              text: text,
              hasMedia: hasMedia,
            };

            allPosts.push(post);
            foundCount++;

            console.log(`✓ Post ${postId} found:`);
            console.log(`  Date: ${date.toISOString()}`);
            console.log(`  Text: ${text.substring(0, 80)}${text.length > 80 ? '...' : ''}`);
            console.log(`  Has Media: ${hasMedia}`);
            console.log('');
          }
        }

        // Progress ko'rsatish
        if (checkedCount % 50 === 0) {
          console.log(`Progress: ${checkedCount}/400 checked, ${foundCount} posts found`);
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error: any) {
        // 404 yoki boshqa xatolar - post mavjud emas
        if (error.response?.status === 404) {
          // Post mavjud emas, davom etamiz
          continue;
        } else {
          console.log(`? Error checking post ${postId}: ${error.message}`);
        }
      }
    }

    console.log(`\n🎉 Scraping completed!`);
    console.log(`Total checked: ${checkedCount}`);
    console.log(`Posts found: ${foundCount}`);

    if (allPosts.length === 0) {
      console.log('❌ No posts found!');
      return;
    }

    // Posts'ni timestamp bo'yicha tartiblash (eng yangi birinchi)
    allPosts.sort((a, b) => b.timestamp - a.timestamp);

    // JSON faylga saqlash
    const jsonData = {
      posts: allPosts.map((post, index) => ({
        id: (index + 1).toString(),
        ...post,
        createdAt: post.date,
      })),
      lastSync: new Date().toISOString(),
      totalFound: allPosts.length,
    };

    const jsonPath = path.resolve(__dirname, '../data/posts.json');
    fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2));
    console.log(`✓ Saved ${allPosts.length} posts to: ${jsonPath}`);

    console.log('\n📊 Statistics:');
    console.log(`- Total posts: ${allPosts.length}`);
    console.log(`- Posts with media: ${allPosts.filter(p => p.hasMedia).length}`);
    console.log(`- Text-only posts: ${allPosts.filter(p => !p.hasMedia).length}`);
    console.log(`- Date range: ${new Date(Math.min(...allPosts.map(p => p.timestamp * 1000))).toLocaleDateString()} - ${new Date(Math.max(...allPosts.map(p => p.timestamp * 1000))).toLocaleDateString()}`);

  } catch (error: any) {
    console.error('❌ Scraping error:', error.message);
  }
}

scrapeAllPosts()
  .then(() => {
    console.log('\n✓ All posts scraping completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });