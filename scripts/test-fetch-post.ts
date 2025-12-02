/**
 * Test script - Fetch a single post from Telegram channel
 * Usage: npx tsx scripts/test-fetch-post.ts
 */

import { Telegraf } from 'telegraf';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const CHANNEL_USERNAME = process.env.TELEGRAM_CHANNEL_USERNAME!;

async function testFetchPost() {
  console.log('Testing Telegram Bot API...\n');
  console.log(`Channel: @${CHANNEL_USERNAME}`);
  console.log(`Bot Token: ${BOT_TOKEN.substring(0, 10)}...`);
  console.log('');

  const bot = new Telegraf(BOT_TOKEN);

  try {
    console.log('1. Getting bot info...');
    const me = await bot.telegram.getMe();
    console.log(`Bot: @${me.username} (${me.first_name})`);
    console.log('');

    console.log('2. Getting channel info...');
    const chat = await bot.telegram.getChat(`@${CHANNEL_USERNAME}`);
    console.log(`Channel type: ${chat.type}`);
    if ('title' in chat) {
      console.log(`Title: ${chat.title}`);
    }
    if ('username' in chat) {
      console.log(`Username: @${chat.username}`);
    }
    console.log('');

    console.log('3. Trying to get updates...');
    
    try {
      const updates = await bot.telegram.getUpdates({
        limit: 10,
        offset: -1,
      });
      
      console.log('Updates count:', updates.length);
      if (updates.length > 0) {
        console.log('Latest update:', JSON.stringify(updates[0], null, 2));
      }
    } catch (error: any) {
      console.log('getUpdates failed:', error.message);
      console.log('');
      console.log('Note: To fetch channel posts via Bot API:');
      console.log('  1. Bot must be admin in the channel');
      console.log('  2. Or use webhook to receive new posts');
      console.log('  3. Or use unofficial Telegram API');
      console.log('');
      console.log('Alternative: Use RSS feed or web scraping');
    }

  } catch (error: any) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response);
    }
  }
}

testFetchPost();
