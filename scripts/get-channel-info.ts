/**
 * Telegram kanalining ma'lumotlarini olish va mavjud postlarni tekshirish
 * 
 * Ishlatish:
 * npx tsx scripts/get-channel-info.ts
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

async function getChannelInfo() {
  const bot = new Telegraf(BOT_TOKEN);

  try {
    console.log('Getting channel info...');
    console.log(`Channel: @${CHANNEL_USERNAME}\n`);

    // Bot ma'lumotlari
    const me = await bot.telegram.getMe();
    console.log(`Bot: @${me.username} (${me.first_name})`);

    // Kanal ma'lumotlari
    const chat = await bot.telegram.getChat(`@${CHANNEL_USERNAME}`);
    console.log(`\nChannel info:`);
    console.log(`  ID: ${chat.id}`);
    console.log(`  Type: ${chat.type}`);
    console.log(`  Title: ${(chat as any).title || 'N/A'}`);
    console.log(`  Username: @${(chat as any).username || 'N/A'}`);
    console.log(`  Description: ${(chat as any).description || 'N/A'}`);

    // Postlarni tekshirish (1 dan 1000 gacha)
    console.log(`\nChecking posts from 1 to 1000...`);
    
    const existingPosts: number[] = [];
    const batchSize = 10;
    
    for (let i = 1; i <= 1000; i += batchSize) {
      const promises = [];
      
      for (let j = i; j < i + batchSize && j <= 1000; j++) {
        promises.push(
          bot.telegram.forwardMessage(chat.id, `@${CHANNEL_USERNAME}`, j)
            .then(() => j)
            .catch(() => null)
        );
      }
      
      const results = await Promise.all(promises);
      const validPosts = results.filter(id => id !== null) as number[];
      existingPosts.push(...validPosts);
      
      if (validPosts.length > 0) {
        console.log(`Found posts: ${validPosts.join(', ')}`);
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`\n✓ Scan completed`);
    console.log(`Found ${existingPosts.length} posts: ${existingPosts.join(', ')}`);

    // Eng so'nggi postni topish
    if (existingPosts.length > 0) {
      const latestPost = Math.max(...existingPosts);
      console.log(`\nLatest post ID: ${latestPost}`);
      
      // So'nggi postning ma'lumotlarini olish
      try {
        const message = await bot.telegram.forwardMessage(chat.id, `@${CHANNEL_USERNAME}`, latestPost);
        console.log(`Latest post date: ${new Date((message as any).date * 1000).toISOString()}`);
      } catch (error) {
        console.log('Could not get latest post details');
      }
    }

  } catch (error: any) {
    console.error('Error:', error);
    
    if (error.response) {
      console.error('Telegram API error:', error.response);
    }
    
    process.exit(1);
  }
}

getChannelInfo()
  .then(() => {
    console.log('\n✓ Channel info retrieved');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });