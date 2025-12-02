/**
 * Fetch actual video URLs from Telegram Bot API
 */

import { Telegraf } from 'telegraf';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const CHANNEL_USERNAME = process.env.TELEGRAM_CHANNEL_USERNAME!;
const POSTS_FILE = path.resolve(process.cwd(), 'data/posts.json');

async function fetchVideoUrls() {
  console.log('Fetching video URLs from Telegram Bot API...\n');

  const bot = new Telegraf(BOT_TOKEN);
  const data = JSON.parse(fs.readFileSync(POSTS_FILE, 'utf-8'));
  const posts = data.posts;

  console.log(`Total posts: ${posts.length}`);
  
  const videoPosts = posts.filter((p: any) => p.media?.type === 'video');
  console.log(`Video posts: ${videoPosts.length}\n`);

  let updated = 0;
  let failed = 0;

  for (const post of videoPosts) {
    if (post.media.videoUrl) {
      console.log(`Post ${post.postId}: Already has video URL`);
      continue;
    }

    try {
      console.log(`Fetching post ${post.postId}...`);
      
      // Try to get updates that include this message
      const updates = await bot.telegram.getUpdates({
        limit: 100,
        allowed_updates: ['channel_post'],
      });

      const channelPost = updates.find((u: any) => 
        u.channel_post?.message_id === post.postId
      );

      if (channelPost?.channel_post?.video) {
        const video = channelPost.channel_post.video;
        const file = await bot.telegram.getFile(video.file_id);
        const videoUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${file.file_path}`;
        
        post.media.videoUrl = videoUrl;
        post.media.width = video.width;
        post.media.height = video.height;
        post.media.duration = video.duration;
        
        updated++;
        console.log(`✅ Got video URL`);
      } else {
        console.log(`⚠️ Post not in recent updates - video URL unavailable`);
        failed++;
      }
    } catch (error: any) {
      failed++;
      console.log(`❌ Failed: ${error.message}`);
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  fs.writeFileSync(POSTS_FILE, JSON.stringify(data, null, 2), 'utf-8');

  console.log('\n📊 Summary:');
  console.log(`✅ Updated: ${updated}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`\n💾 Saved to ${POSTS_FILE}`);
}

fetchVideoUrls();
