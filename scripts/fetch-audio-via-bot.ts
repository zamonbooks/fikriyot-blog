/**
 * Fetch audio posts from Telegram channel using Bot API
 */

import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const CHANNEL_USERNAME = process.env.TELEGRAM_CHANNEL_USERNAME!;
const POSTS_FILE = path.resolve(process.cwd(), 'data/posts.json');

interface TelegramMessage {
  message_id: number;
  date: number;
  text?: string;
  caption?: string;
  audio?: {
    file_id: string;
    file_unique_id: string;
    duration: number;
    performer?: string;
    title?: string;
    file_name?: string;
    mime_type?: string;
    file_size?: number;
  };
  voice?: {
    file_id: string;
    file_unique_id: string;
    duration: number;
    mime_type?: string;
    file_size?: number;
  };
  views?: number;
}

async function getChannelPost(postId: number, yourChatId: string): Promise<TelegramMessage | null> {
  try {
    // Get channel info first
    const chatUrl = `https://api.telegram.org/bot${BOT_TOKEN}/getChat`;
    const chatResponse = await axios.get(chatUrl, {
      params: {
        chat_id: `@${CHANNEL_USERNAME}`
      }
    });
    
    const channelId = chatResponse.data.result.id;
    console.log(`   Channel ID: ${channelId}`);
    
    // Forward message to YOUR CHAT (not back to channel!)
    const forwardUrl = `https://api.telegram.org/bot${BOT_TOKEN}/forwardMessage`;
    const forwardResponse = await axios.post(forwardUrl, {
      chat_id: yourChatId,  // YOUR chat ID, not channel!
      from_chat_id: channelId,
      message_id: postId
    });
    
    console.log(`   ✅ Forwarded to your chat!`);
    return forwardResponse.data.result;
  } catch (error: any) {
    console.error(`Failed to get post ${postId}:`, error.response?.data || error.message);
    return null;
  }
}

async function fetchAudioPosts() {
  console.log('Fetching audio posts via Bot API...\n');
  
  if (!BOT_TOKEN) {
    console.error('❌ TELEGRAM_BOT_TOKEN not configured in .env.local');
    return;
  }
  
  const YOUR_CHAT_ID = process.env.TELEGRAM_YOUR_CHAT_ID;
  if (!YOUR_CHAT_ID) {
    console.error('❌ TELEGRAM_YOUR_CHAT_ID not configured in .env.local');
    console.error('   Add your personal chat ID (not channel ID!)');
    return;
  }
  
  // Read existing posts
  const data = JSON.parse(fs.readFileSync(POSTS_FILE, 'utf-8'));
  const posts = data.posts;
  
  console.log(`Found ${posts.length} existing posts`);
  
  // Try to fetch known audio post IDs from the screenshots
  const audioPostIds = [288, 201, 200]; // Based on user confirmation
  
  console.log(`\nTrying to fetch audio posts: ${audioPostIds.join(', ')}\n`);
  console.log(`Will forward to your chat: ${YOUR_CHAT_ID}\n`);
  
  for (const postId of audioPostIds) {
    console.log(`Fetching post ${postId}...`);
    const message = await getChannelPost(postId, YOUR_CHAT_ID);
    
    if (message && (message.audio || message.voice)) {
      console.log(`✅ Found ${message.audio ? 'audio' : 'voice'} in post ${postId}`);
      
      if (message.audio) {
        console.log(`   Title: ${message.audio.title || 'N/A'}`);
        console.log(`   Performer: ${message.audio.performer || 'N/A'}`);
        console.log(`   Duration: ${message.audio.duration}s`);
      }
      
      // Update or add to posts
      const existingPost = posts.find((p: any) => p.postId === postId);
      if (existingPost) {
        console.log(`   Updating existing post ${postId}`);
        existingPost.media = {
          type: message.audio ? 'audio' : 'voice',
          url: `https://t.me/${CHANNEL_USERNAME}/${postId}`, // Placeholder
          duration: message.audio?.duration || message.voice?.duration,
          title: message.audio?.title,
          performer: message.audio?.performer,
          fileName: message.audio?.file_name,
          fileSize: message.audio?.file_size || message.voice?.file_size,
          mimeType: message.audio?.mime_type || message.voice?.mime_type,
        };
        existingPost.hasMedia = true;
      }
    } else {
      console.log(`❌ No audio found in post ${postId}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Save updated posts
  fs.writeFileSync(POSTS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`\n💾 Saved to ${POSTS_FILE}`);
}

fetchAudioPosts();
