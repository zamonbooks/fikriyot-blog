/**
 * Check channel info and available posts
 */

import { Telegraf } from 'telegraf';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const CHANNEL_USERNAME = process.env.TELEGRAM_CHANNEL_USERNAME!;

async function checkChannel() {
  console.log('Checking channel info...\n');
  
  const bot = new Telegraf(BOT_TOKEN);

  try {
    const chat = await bot.telegram.getChat(`@${CHANNEL_USERNAME}`);
    console.log('Channel info:');
    console.log('Type:', chat.type);
    if ('title' in chat) console.log('Title:', chat.title);
    if ('username' in chat) console.log('Username:', chat.username);
    console.log('');

    // Try different offset values to see how many posts we can get
    console.log('Testing getUpdates with different limits...\n');
    
    for (const limit of [10, 50, 100]) {
      const updates = await bot.telegram.getUpdates({
        limit,
        allowed_updates: ['channel_post'],
      });
      
      const channelPosts = updates.filter(u => 'channel_post' in u);
      console.log(`Limit ${limit}: Got ${channelPosts.length} channel posts`);
      
      if (channelPosts.length > 0) {
        const firstPost = channelPosts[0].channel_post as any;
        const lastPost = channelPosts[channelPosts.length - 1].channel_post as any;
        console.log(`  First post ID: ${firstPost.message_id}`);
        console.log(`  Last post ID: ${lastPost.message_id}`);
      }
    }

    console.log('\nNote: getUpdates only returns unconfirmed updates.');
    console.log('To get all posts, we need to use webhook or web scraping.');

  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

checkChannel();
