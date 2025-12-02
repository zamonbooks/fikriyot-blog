/**
 * Fetch post 284 metadata via Bot API
 */

import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const CHANNEL_USERNAME = process.env.TELEGRAM_CHANNEL_USERNAME!;
const YOUR_CHAT_ID = process.env.TELEGRAM_YOUR_CHAT_ID!;
const POSTS_FILE = path.resolve(process.cwd(), 'data/posts.json');

async function fetchPost284() {
  console.log('Fetching post 284 metadata...\n');
  
  try {
    // Get channel info
    const chatUrl = `https://api.telegram.org/bot${BOT_TOKEN}/getChat`;
    const chatResponse = await axios.get(chatUrl, {
      params: { chat_id: `@${CHANNEL_USERNAME}` }
    });
    
    const channelId = chatResponse.data.result.id;
    console.log(`Channel ID: ${channelId}`);
    
    // Forward message to YOUR CHAT
    const forwardUrl = `https://api.telegram.org/bot${BOT_TOKEN}/forwardMessage`;
    const forwardResponse = await axios.post(forwardUrl, {
      chat_id: YOUR_CHAT_ID,
      from_chat_id: channelId,
      message_id: 284
    });
    
    const message = forwardResponse.data.result;
    console.log('\n✅ Forwarded to your chat!');
    console.log('\nMessage data:');
    console.log(JSON.stringify(message, null, 2));
    
    // Check if document exists
    if (message.document) {
      console.log('\n📄 Document found:');
      console.log('  File name:', message.document.file_name);
      console.log('  File size:', (message.document.file_size / 1024 / 1024).toFixed(2), 'MB');
      console.log('  MIME type:', message.document.mime_type);
      
      // Update post 284
      const data = JSON.parse(fs.readFileSync(POSTS_FILE, 'utf-8'));
      const post = data.posts.find((p: any) => p.postId === 284);
      
      if (post) {
        post.media = {
          type: 'document',
          url: `https://t.me/${CHANNEL_USERNAME}/284`,
          fileName: message.document.file_name,
          fileSize: message.document.file_size,
          mimeType: message.document.mime_type
        };
        post.hasMedia = true;
        
        fs.writeFileSync(POSTS_FILE, JSON.stringify(data, null, 2), 'utf-8');
        console.log('\n✅ Updated post 284 in posts.json');
      }
    } else {
      console.log('\n❌ No document found in message');
    }
    
  } catch (error: any) {
    console.error('Error:', error.response?.data || error.message);
  }
}

fetchPost284();
