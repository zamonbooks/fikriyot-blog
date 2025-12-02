/**
 * Sync posts from Telegram channel to JSON file
 * Usage: npx tsx scripts/sync-posts.ts
 */

import { Telegraf } from 'telegraf';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { PostInput, MessageEntity, MediaContent } from '../types/post';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const CHANNEL_USERNAME = process.env.TELEGRAM_CHANNEL_USERNAME!;
const OUTPUT_FILE = path.resolve(process.cwd(), 'data/posts.json');

interface TelegramMessage {
  message_id: number;
  date: number;
  text?: string;
  caption?: string;
  entities?: Array<{
    type: string;
    offset: number;
    length: number;
    url?: string;
    language?: string;
  }>;
  caption_entities?: Array<{
    type: string;
    offset: number;
    length: number;
    url?: string;
    language?: string;
  }>;
  photo?: Array<{
    file_id: string;
    file_unique_id: string;
    width: number;
    height: number;
    file_size?: number;
  }>;
  video?: {
    file_id: string;
    width: number;
    height: number;
    duration: number;
    thumbnail?: any;
    file_size?: number;
    mime_type?: string;
  };
  document?: {
    file_id: string;
    file_name?: string;
    mime_type?: string;
    file_size?: number;
  };
  views?: number;
}

function transformMessage(msg: TelegramMessage): PostInput {
  const text = msg.text || msg.caption || '';
  const entities = (msg.entities || msg.caption_entities || []).map(e => ({
    type: e.type as any,
    offset: e.offset,
    length: e.length,
    url: e.url,
    language: e.language,
  })) as MessageEntity[];

  let media: MediaContent | undefined;
  let hasMedia = false;

  // Photo
  if (msg.photo && msg.photo.length > 0) {
    const largestPhoto = msg.photo[msg.photo.length - 1];
    media = {
      type: 'photo',
      url: `https://api.telegram.org/file/bot${BOT_TOKEN}/${largestPhoto.file_id}`,
      width: largestPhoto.width,
      height: largestPhoto.height,
      fileSize: largestPhoto.file_size,
    };
    hasMedia = true;
  }

  // Video
  if (msg.video) {
    media = {
      type: 'video',
      url: `https://api.telegram.org/file/bot${BOT_TOKEN}/${msg.video.file_id}`,
      width: msg.video.width,
      height: msg.video.height,
      duration: msg.video.duration,
      mimeType: msg.video.mime_type,
      fileSize: msg.video.file_size,
    };
    hasMedia = true;
  }

  // Document
  if (msg.document) {
    media = {
      type: 'document',
      url: `https://api.telegram.org/file/bot${BOT_TOKEN}/${msg.document.file_id}`,
      fileName: msg.document.file_name,
      mimeType: msg.document.mime_type,
      fileSize: msg.document.file_size,
    };
    hasMedia = true;
  }

  return {
    channelUsername: CHANNEL_USERNAME,
    postId: msg.message_id,
    date: new Date(msg.date * 1000).toISOString(),
    timestamp: msg.date,
    text,
    entities: entities.length > 0 ? entities : undefined,
    media,
    views: msg.views,
    hasMedia,
  };
}

async function syncPosts() {
  console.log('Starting Telegram posts sync...\n');
  console.log(`Channel: @${CHANNEL_USERNAME}`);
  console.log(`Output: ${OUTPUT_FILE}`);
  console.log('');

  const bot = new Telegraf(BOT_TOKEN);

  try {
    console.log('Getting updates from Telegram...');
    
    const updates = await bot.telegram.getUpdates({
      limit: 100,
      allowed_updates: ['channel_post'],
    });

    console.log(`Received ${updates.length} updates`);
    console.log('');

    const posts: PostInput[] = [];
    
    for (const update of updates) {
      if ('channel_post' in update && update.channel_post) {
        const msg = update.channel_post as any as TelegramMessage;
        const post = transformMessage(msg);
        posts.push(post);
        
        console.log(`Post ${post.postId}: ${post.text?.substring(0, 50)}...`);
      }
    }

    console.log('');
    console.log(`Transformed ${posts.length} posts`);

    // Sort by timestamp (newest first)
    posts.sort((a, b) => b.timestamp - a.timestamp);

    // Read existing posts
    let existingPosts: PostInput[] = [];
    if (fs.existsSync(OUTPUT_FILE)) {
      const data = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'));
      existingPosts = data.posts || [];
    }

    // Merge with existing (avoid duplicates)
    const existingIds = new Set(existingPosts.map(p => p.postId));
    const newPosts = posts.filter(p => !existingIds.has(p.postId));

    console.log(`New posts: ${newPosts.length}`);
    console.log(`Existing posts: ${existingPosts.length}`);

    const allPosts = [...newPosts, ...existingPosts]
      .sort((a, b) => b.timestamp - a.timestamp)
      .map((post, index) => ({
        id: `${index + 1}`,
        ...post,
        createdAt: post.date,
      }));

    // Save to file
    const output = {
      posts: allPosts,
      lastSync: new Date().toISOString(),
    };

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf-8');

    console.log('');
    console.log(`Saved ${allPosts.length} posts to ${OUTPUT_FILE}`);
    console.log('Sync completed!');

  } catch (error: any) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response, null, 2));
    }
  }
}

syncPosts();
