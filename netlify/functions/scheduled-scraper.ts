/**
 * Netlify Scheduled Function - runs auto-scraper daily
 * Schedule: Every day at 00:00 UTC
 */

import { schedule } from '@netlify/functions';
import axios from 'axios';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const CHANNEL_USERNAME = process.env.TELEGRAM_CHANNEL_USERNAME!;
const YOUR_CHAT_ID = process.env.TELEGRAM_YOUR_CHAT_ID!;
const NETLIFY_BUILD_HOOK = process.env.NETLIFY_BUILD_HOOK!;

interface TelegramMessage {
  message_id: number;
  date: number;
  text?: string;
  caption?: string;
  photo?: any[];
  video?: any;
  audio?: any;
  voice?: any;
  document?: any;
  sticker?: any;
  animation?: any;
  poll?: any;
  location?: any;
  contact?: any;
  forward_from_chat?: any;
  forward_signature?: string;
}

async function getChannelId(): Promise<string> {
  const chatUrl = `https://api.telegram.org/bot${BOT_TOKEN}/getChat`;
  const response = await axios.get(chatUrl, {
    params: { chat_id: `@${CHANNEL_USERNAME}` }
  });
  return response.data.result.id;
}

async function fetchPost(channelId: string, postId: number): Promise<TelegramMessage | null> {
  try {
    const forwardUrl = `https://api.telegram.org/bot${BOT_TOKEN}/forwardMessage`;
    const response = await axios.post(forwardUrl, {
      chat_id: YOUR_CHAT_ID,
      from_chat_id: channelId,
      message_id: postId
    });
    return response.data.result;
  } catch (error: any) {
    if (error.response?.data?.description?.includes('message not found')) {
      return null;
    }
    throw error;
  }
}

function parseMedia(message: TelegramMessage, postId: number): any {
  if (message.photo && message.photo.length > 0) {
    const largestPhoto = message.photo[message.photo.length - 1];
    return {
      type: 'photo',
      url: `https://t.me/${CHANNEL_USERNAME}/${postId}`,
      width: largestPhoto.width,
      height: largestPhoto.height,
      caption: message.caption
    };
  }

  if (message.video) {
    return {
      type: 'video',
      url: `https://t.me/${CHANNEL_USERNAME}/${postId}`,
      duration: message.video.duration,
      width: message.video.width,
      height: message.video.height,
      mimeType: message.video.mime_type,
      fileSize: message.video.file_size
    };
  }

  if (message.audio) {
    return {
      type: 'audio',
      url: `https://t.me/${CHANNEL_USERNAME}/${postId}`,
      duration: message.audio.duration,
      title: message.audio.title,
      performer: message.audio.performer,
      fileName: message.audio.file_name,
      mimeType: message.audio.mime_type,
      fileSize: message.audio.file_size
    };
  }

  if (message.voice) {
    return {
      type: 'voice',
      url: `https://t.me/${CHANNEL_USERNAME}/${postId}`,
      duration: message.voice.duration,
      mimeType: message.voice.mime_type,
      fileSize: message.voice.file_size
    };
  }

  if (message.document) {
    return {
      type: 'document',
      url: `https://t.me/${CHANNEL_USERNAME}/${postId}`,
      fileName: message.document.file_name,
      mimeType: message.document.mime_type,
      fileSize: message.document.file_size
    };
  }

  if (message.sticker) {
    return { type: 'sticker', url: `https://t.me/${CHANNEL_USERNAME}/${postId}`, emoji: message.sticker.emoji };
  }

  if (message.animation) {
    return {
      type: 'animation',
      url: `https://t.me/${CHANNEL_USERNAME}/${postId}`,
      duration: message.animation.duration,
      width: message.animation.width,
      height: message.animation.height
    };
  }

  if (message.poll) {
    return { type: 'poll', url: `https://t.me/${CHANNEL_USERNAME}/${postId}`, question: message.poll.question };
  }

  if (message.location) {
    return {
      type: 'location',
      url: `https://t.me/${CHANNEL_USERNAME}/${postId}`,
      latitude: message.location.latitude,
      longitude: message.location.longitude
    };
  }

  if (message.contact) {
    return {
      type: 'contact',
      url: `https://t.me/${CHANNEL_USERNAME}/${postId}`,
      phoneNumber: message.contact.phone_number,
      firstName: message.contact.first_name
    };
  }

  return null;
}

const handler = schedule('0 0 * * *', async () => {
  console.log('🤖 Scheduled scraper running...');

  try {
    // This is a simplified version - in production, you'd need to:
    // 1. Fetch posts.json from your repo or storage
    // 2. Parse and update it
    // 3. Commit changes back to repo or update storage
    // 4. Trigger rebuild

    const channelId = await getChannelId();
    console.log(`📢 Channel ID: ${channelId}`);

    // For now, just trigger a rebuild
    // The actual scraping should happen during build time
    if (NETLIFY_BUILD_HOOK) {
      console.log('🔨 Triggering rebuild...');
      await fetch(NETLIFY_BUILD_HOOK, {
        method: 'POST',
        body: JSON.stringify({ trigger_title: 'Scheduled scraper' })
      });
      console.log('✅ Rebuild triggered');
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: 'Scraper executed' })
    };
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
});

export { handler };
