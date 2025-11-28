/**
 * Telegram kanaldan postlarni to'g'ridan-to'g'ri olish
 */

import { Telegraf } from 'telegraf';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const CHANNEL_USERNAME = process.env.TELEGRAM_CHANNEL_USERNAME!;

async function getChannelPosts() {
  const bot = new Telegraf(BOT_TOKEN);

  try {
    console.log('Trying to get channel posts...');
    
    const chatId = '@' + CHANNEL_USERNAME;
    console.log(`Chat ID: ${chatId}`);

    // Turli post ID'larni sinab ko'ramiz
    const postIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 25, 30, 50, 100];
    
    console.log('\nChecking post IDs...');
    
    for (const postId of postIds) {
      try {
        // Har bir post ID'ni tekshirish
        const message = await bot.telegram.forwardMessage(
          chatId, // to
          chatId, // from  
          postId  // message_id
        );
        
        console.log(`✓ Post ${postId} exists!`);
        console.log(`  Date: ${new Date(message.date * 1000).toISOString()}`);
        console.log(`  Text: ${message.text?.substring(0, 100) || 'No text'}...`);
        
      } catch (error: any) {
        if (error.response?.error_code === 400) {
          // Post mavjud emas
          continue;
        } else {
          console.log(`? Post ${postId}: ${error.message}`);
        }
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    
    console.log('\n🔧 Alternative approach:');
    console.log('1. Manually visit: https://t.me/' + CHANNEL_USERNAME);
    console.log('2. Right-click on posts and copy post links');
    console.log('3. Post links look like: https://t.me/fikriyot_uz/123');
    console.log('4. The number at the end is the post ID');
    console.log('5. Tell me the post IDs and I\'ll create the JSON manually');
  }
}

getChannelPosts()
  .then(() => {
    console.log('\n✓ Post check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });