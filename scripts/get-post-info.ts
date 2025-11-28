/**
 * Post ma'lumotlarini olish (forward qilmasdan)
 */

import { Telegraf } from 'telegraf';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const CHANNEL_USERNAME = process.env.TELEGRAM_CHANNEL_USERNAME!;

async function getPostInfo() {
  const bot = new Telegraf(BOT_TOKEN);

  try {
    console.log('Getting post info without forwarding...');
    console.log(`Channel: @${CHANNEL_USERNAME}\n`);
    
    const chatId = -1002143517542; // Chat ID from previous check
    
    // Mavjud post ID'lar
    const postIds = [3, 4, 6, 8, 10, 25];
    
    for (const postId of postIds) {
      try {
        // getMessage API'sini ishlatish (agar mavjud bo'lsa)
        // Yoki boshqa usullar
        
        console.log(`Post ${postId}:`);
        console.log(`  Link: https://t.me/${CHANNEL_USERNAME}/${postId}`);
        console.log(`  You can manually copy content from this link`);
        console.log('');
        
      } catch (error: any) {
        console.error(`Error with post ${postId}:`, error.message);
      }
    }
    
    console.log('📋 Manual steps:');
    console.log('1. Open each link above in browser');
    console.log('2. Copy the post content');
    console.log('3. Tell me the content and I\'ll create proper JSON');
    console.log('');
    console.log('Or we can create a simple manual entry script...');
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

getPostInfo()
  .then(() => {
    console.log('\n✓ Info check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });