/**
 * Automatic scraper - fetches new posts from Telegram channel via Bot API
 * Supports: text, photo, video, audio, voice, document, and other media types
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
  views?: number;
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
      return null; // Post doesn't exist
    }
    throw error;
  }
}

function parseMedia(message: TelegramMessage): any {
  // Photo
  if (message.photo && message.photo.length > 0) {
    const largestPhoto = message.photo[message.photo.length - 1];
    return {
      type: 'photo',
      url: `https://t.me/${CHANNEL_USERNAME}/${message.message_id}`,
      width: largestPhoto.width,
      height: largestPhoto.height,
      caption: message.caption
    };
  }

  // Video
  if (message.video) {
    return {
      type: 'video',
      url: `https://t.me/${CHANNEL_USERNAME}/${message.message_id}`,
      duration: message.video.duration,
      width: message.video.width,
      height: message.video.height,
      mimeType: message.video.mime_type,
      fileSize: message.video.file_size
    };
  }

  // Audio
  if (message.audio) {
    return {
      type: 'audio',
      url: `https://t.me/${CHANNEL_USERNAME}/${message.message_id}`,
      duration: message.audio.duration,
      title: message.audio.title,
      performer: message.audio.performer,
      fileName: message.audio.file_name,
      mimeType: message.audio.mime_type,
      fileSize: message.audio.file_size
    };
  }

  // Voice
  if (message.voice) {
    return {
      type: 'voice',
      url: `https://t.me/${CHANNEL_USERNAME}/${message.message_id}`,
      duration: message.voice.duration,
      mimeType: message.voice.mime_type,
      fileSize: message.voice.file_size
    };
  }

  // Document
  if (message.document) {
    return {
      type: 'document',
      url: `https://t.me/${CHANNEL_USERNAME}/${message.message_id}`,
      fileName: message.document.file_name,
      mimeType: message.document.mime_type,
      fileSize: message.document.file_size
    };
  }

  // Sticker
  if (message.sticker) {
    return {
      type: 'sticker',
      url: `https://t.me/${CHANNEL_USERNAME}/${message.message_id}`,
      emoji: message.sticker.emoji
    };
  }

  // Animation (GIF)
  if (message.animation) {
    return {
      type: 'animation',
      url: `https://t.me/${CHANNEL_USERNAME}/${message.message_id}`,
      duration: message.animation.duration,
      width: message.animation.width,
      height: message.animation.height
    };
  }

  // Poll
  if (message.poll) {
    return {
      type: 'poll',
      url: `https://t.me/${CHANNEL_USERNAME}/${message.message_id}`,
      question: message.poll.question
    };
  }

  // Location
  if (message.location) {
    return {
      type: 'location',
      url: `https://t.me/${CHANNEL_USERNAME}/${message.message_id}`,
      latitude: message.location.latitude,
      longitude: message.location.longitude
    };
  }

  // Contact
  if (message.contact) {
    return {
      type: 'contact',
      url: `https://t.me/${CHANNEL_USERNAME}/${message.message_id}`,
      phoneNumber: message.contact.phone_number,
      firstName: message.contact.first_name
    };
  }

  return null;
}

async function scrapeNewPosts() {
  console.log('🤖 Starting automatic scraper...\n');

  // Read existing posts
  const data = JSON.parse(fs.readFileSync(POSTS_FILE, 'utf-8'));
  const existingPosts = data.posts;
  
  // Find highest post ID
  const maxPostId = Math.max(...existingPosts.map((p: any) => p.postId));
  console.log(`📊 Highest existing post ID: ${maxPostId}`);
  
  // Get channel ID
  const channelId = await getChannelId();
  console.log(`📢 Channel ID: ${channelId}\n`);

  // Try to fetch next 10 posts
  let newPostsCount = 0;
  const startId = maxPostId + 1;
  const endId = startId + 10;

  console.log(`🔍 Checking posts ${startId} to ${endId}...\n`);

  for (let postId = startId; postId <= endId; postId++) {
    try {
      const message = await fetchPost(channelId, postId);
      
      if (!message) {
        console.log(`⏭️  Post ${postId} not found (skipping)`);
        continue;
      }

      console.log(`✅ Post ${postId} found`);

      // Parse media
      const media = parseMedia(message);
      
      // Create post object
      const newPost: any = {
        id: `post-${postId}`,
        channelUsername: CHANNEL_USERNAME,
        postId: postId,
        date: new Date(message.date * 1000).toISOString(),
        timestamp: message.date,
        text: message.text || message.caption || '',
        views: 1,
        hasMedia: !!media,
        createdAt: new Date().toISOString()
      };

      if (media) {
        newPost.media = media;
        console.log(`   📎 Media: ${media.type}`);
      }

      // Check for forwarded message
      if (message.forward_from_chat) {
        newPost.forwardedFrom = `Forwarded from ${message.forward_from_chat.title}`;
        if (message.forward_signature) {
          newPost.forwardedFrom += ` (${message.forward_signature})`;
        }
        console.log(`   ↪️  ${newPost.forwardedFrom}`);
      }

      // Add to posts array (at beginning for newest first)
      existingPosts.unshift(newPost);
      newPostsCount++;

      console.log(`   💾 Added to posts.json\n`);

      // Wait a bit between requests
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error: any) {
      console.error(`❌ Error fetching post ${postId}:`, error.message);
    }
  }

  // Save updated posts
  if (newPostsCount > 0) {
    fs.writeFileSync(POSTS_FILE, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`\n✅ Scraping complete! Added ${newPostsCount} new posts.`);
  } else {
    console.log('\n📭 No new posts found.');
  }
}

scrapeNewPosts().catch(console.error);
