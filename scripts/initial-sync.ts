/**
 * Initial sync script - 2024-yildan boshlab barcha postlarni Firestore'ga yuklash
 * 
 * Ishlatish:
 * npx tsx scripts/initial-sync.ts
 */

import { Telegraf } from 'telegraf';
import { getFirestoreService } from '../lib/firestore-service';
import { transformTelegramPost, validatePost } from '../lib/post-validator';
import { PostInput } from '../types/post';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const CHANNEL_USERNAME = process.env.TELEGRAM_CHANNEL_USERNAME!;

if (!BOT_TOKEN || !CHANNEL_USERNAME) {
  console.error('Error: TELEGRAM_BOT_TOKEN and TELEGRAM_CHANNEL_USERNAME must be set');
  process.exit(1);
}

async function syncChannelPosts() {
  console.log('Starting initial sync...');
  console.log(`Channel: @${CHANNEL_USERNAME}`);
  
  const bot = new Telegraf(BOT_TOKEN);
  const firestoreService = getFirestoreService();

  try {
    // Bot ma'lumotlarini tekshirish
    const me = await bot.telegram.getMe();
    console.log(`Bot: @${me.username}`);

    // Kanal ma'lumotlarini olish
    const chat = await bot.telegram.getChat(`@${CHANNEL_USERNAME}`);
    console.log(`Chat ID: ${chat.id}`);
    console.log(`Chat type: ${chat.type}`);

    // 2024-yil 1-yanvardan boshlab postlarni olish
    const startDate = new Date('2024-01-01T00:00:00Z');
    const startTimestamp = Math.floor(startDate.getTime() / 1000);

    console.log(`\nFetching posts from ${startDate.toISOString()}...`);

    // Telegram Bot API orqali postlarni olish
    // Note: Bu oddiy implementatsiya. Real implementatsiyada
    // getUpdates yoki boshqa metodlardan foydalanish kerak

    // Hozircha test uchun manual ravishda postlar qo'shamiz
    console.log('\nNote: Telegram Bot API public kanallarda to\'liq postlar tarixini bermaydi.');
    console.log('Postlarni qo\'lda qo\'shish uchun quyidagi formatdan foydalaning:\n');
    
    const examplePost: PostInput = {
      channelUsername: CHANNEL_USERNAME,
      postId: 1,
      date: new Date().toISOString(),
      timestamp: Math.floor(Date.now() / 1000),
      text: 'Test post',
      hasMedia: false,
    };

    console.log('Example post format:');
    console.log(JSON.stringify(examplePost, null, 2));

    // JSON fayldan postlarni Firestore'ga ko'chirish
    console.log('\nMigrating posts from JSON to Firestore...');
    
    try {
      const fs = require('fs');
      const jsonPath = path.resolve(__dirname, '../data/posts.json');
      
      if (fs.existsSync(jsonPath)) {
        const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        const posts = jsonData.posts || [];
        
        console.log(`Found ${posts.length} posts in JSON file`);
        
        let addedCount = 0;
        for (const post of posts) {
          const postInput: PostInput = {
            channelUsername: post.channelUsername,
            postId: post.postId,
            date: post.date,
            timestamp: post.timestamp,
            text: post.text || '',
            hasMedia: post.hasMedia || false,
          };
          
          if (validatePost(postInput)) {
            try {
              await firestoreService.addPost(postInput);
              addedCount++;
              console.log(`✓ Added post ${post.postId}`);
            } catch (error: any) {
              if (error.message?.includes('already exists')) {
                console.log(`- Post ${post.postId} already exists, skipping`);
              } else {
                console.error(`✗ Error adding post ${post.postId}:`, error.message);
              }
            }
          }
        }
        
        console.log(`\n✓ Migration completed: ${addedCount} posts added`);
      } else {
        console.log('No JSON file found, creating test post...');
        
        // Test post qo'shish
        const testPost: PostInput = {
          channelUsername: CHANNEL_USERNAME,
          postId: Date.now(), // Unique ID
          date: new Date().toISOString(),
          timestamp: Math.floor(Date.now() / 1000),
          text: 'Initial sync test post',
          hasMedia: false,
        };

        if (validatePost(testPost)) {
          await firestoreService.addPost(testPost);
          console.log('✓ Test post added successfully');
        }
      }
    } catch (error) {
      console.error('Error during migration:', error);
    }

    console.log('\n✓ Initial sync completed');
    console.log('\nNext steps:');
    console.log('1. Webhook sozlang (Task 7)');
    console.log('2. Yangi postlar avtomatik sync bo\'ladi');

  } catch (error: any) {
    console.error('Error during sync:', error);
    
    if (error.response) {
      console.error('Telegram API error:', error.response);
    }
    
    process.exit(1);
  }
}

// Run sync
syncChannelPosts()
  .then(() => {
    console.log('\nSync script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
