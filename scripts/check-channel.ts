/**
 * Telegram kanalini tekshirish va mavjud postlarni ko'rish
 */

import { Telegraf } from 'telegraf';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const CHANNEL_USERNAME = process.env.TELEGRAM_CHANNEL_USERNAME!;

if (!BOT_TOKEN || !CHANNEL_USERNAME) {
  console.error('Error: TELEGRAM_BOT_TOKEN and TELEGRAM_CHANNEL_USERNAME must be set');
  process.exit(1);
}

async function checkChannel() {
  const bot = new Telegraf(BOT_TOKEN);

  try {
    console.log('Checking Telegram channel...');
    console.log(`Channel: @${CHANNEL_USERNAME}`);
    console.log(`Bot Token: ${BOT_TOKEN.substring(0, 10)}...`);

    // Bot ma'lumotlarini olish
    const me = await bot.telegram.getMe();
    console.log(`\n✓ Bot: @${me.username} (${me.first_name})`);

    // Kanal ma'lumotlarini olish
    const chat = await bot.telegram.getChat(`@${CHANNEL_USERNAME}`);
    console.log(`✓ Chat ID: ${chat.id}`);
    console.log(`✓ Chat type: ${chat.type}`);
    
    if ('title' in chat) {
      console.log(`✓ Chat title: ${chat.title}`);
    }
    
    if ('description' in chat) {
      console.log(`✓ Description: ${chat.description}`);
    }

    // Kanal postlarini olishga harakat qilish
    console.log('\nTrying to get channel posts...');
    
    // getUpdates orqali postlarni olish
    const updates = await bot.telegram.getUpdates(0, 100, 0, []);
    console.log(`Found ${updates.length} updates`);
    
    if (updates.length > 0) {
      console.log('\nRecent updates:');
      updates.slice(-5).forEach((update, index) => {
        console.log(`${index + 1}. Update ID: ${update.update_id}`);
        if ('channel_post' in update && update.channel_post) {
          const post = update.channel_post;
          console.log(`   Post ID: ${post.message_id}`);
          console.log(`   Date: ${new Date(post.date * 1000).toISOString()}`);
          console.log(`   Text: ${post.text?.substring(0, 100) || 'No text'}...`);
        }
      });
    }

    console.log('\n📝 Manual post checking needed:');
    console.log('1. Go to https://t.me/' + CHANNEL_USERNAME);
    console.log('2. Check what posts are actually there');
    console.log('3. Copy the real post IDs and content');
    console.log('4. We\'ll add them manually to the JSON file');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    
    if (error.response) {
      console.error('Telegram API response:', error.response);
    }
    
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure the bot is added to the channel as admin');
    console.log('2. Check if the channel username is correct');
    console.log('3. Verify the bot token is valid');
  }
}

checkChannel()
  .then(() => {
    console.log('\n✓ Channel check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });