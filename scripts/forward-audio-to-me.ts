/**
 * Forward audio posts from channel to your personal chat
 * This allows you to access audio files via Bot API
 */

import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const CHANNEL_USERNAME = process.env.TELEGRAM_CHANNEL_USERNAME!;

async function forwardAudioToMe() {
  console.log('Forward audio posts to your chat...\n');
  
  if (!BOT_TOKEN) {
    console.error('❌ TELEGRAM_BOT_TOKEN not configured');
    return;
  }
  
  console.log('📝 Instructions:');
  console.log('1. Open Telegram and start a chat with your bot');
  console.log('2. Send any message to the bot (e.g., /start)');
  console.log('3. The bot will forward audio posts to you\n');
  
  // Get your chat ID first
  console.log('Getting your chat ID...');
  const updatesUrl = `https://api.telegram.org/bot${BOT_TOKEN}/getUpdates`;
  const updatesResponse = await axios.get(updatesUrl);
  
  const updates = updatesResponse.data.result;
  if (updates.length === 0) {
    console.error('❌ No messages found. Please send a message to your bot first!');
    return;
  }
  
  // Get the most recent chat ID (your personal chat)
  const yourChatId = updates[updates.length - 1].message.chat.id;
  console.log(`✅ Your chat ID: ${yourChatId}\n`);
  
  // Audio post IDs to forward
  const audioPostIds = [288, 201, 200];
  
  console.log(`Forwarding ${audioPostIds.length} audio posts...\n`);
  
  for (const postId of audioPostIds) {
    try {
      console.log(`Forwarding post ${postId}...`);
      
      const forwardUrl = `https://api.telegram.org/bot${BOT_TOKEN}/forwardMessage`;
      const response = await axios.post(forwardUrl, {
        chat_id: yourChatId,
        from_chat_id: `@${CHANNEL_USERNAME}`,
        message_id: postId
      });
      
      if (response.data.ok) {
        const message = response.data.result;
        if (message.audio) {
          console.log(`✅ Audio forwarded!`);
          console.log(`   Title: ${message.audio.title || 'N/A'}`);
          console.log(`   Performer: ${message.audio.performer || 'N/A'}`);
          console.log(`   Duration: ${Math.floor(message.audio.duration / 60)}:${(message.audio.duration % 60).toString().padStart(2, '0')}`);
          console.log(`   File ID: ${message.audio.file_id}`);
        } else if (message.voice) {
          console.log(`✅ Voice message forwarded!`);
          console.log(`   Duration: ${message.voice.duration}s`);
          console.log(`   File ID: ${message.voice.file_id}`);
        } else {
          console.log(`⚠️  Post ${postId} forwarded but no audio found`);
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error: any) {
      console.error(`❌ Failed to forward post ${postId}:`, error.response?.data?.description || error.message);
    }
  }
  
  console.log('\n✅ Done! Check your Telegram chat with the bot.');
}

forwardAudioToMe();
