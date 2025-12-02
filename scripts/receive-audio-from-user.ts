/**
 * Receive audio posts forwarded by user via Telegram bot
 * User forwards audio posts from channel to bot
 * Bot extracts audio metadata and file URLs
 */

import { Telegraf } from 'telegraf';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const POSTS_FILE = path.resolve(process.cwd(), 'data/posts.json');

if (!BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN not configured in .env.local');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

console.log('🤖 Bot started! Waiting for audio messages...');
console.log('📝 Forward audio posts from your channel to this bot\n');

// Handle audio messages
bot.on('audio', async (ctx) => {
  const audio = ctx.message.audio;
  const forwardFrom = ctx.message.forward_origin;
  
  console.log('\n🎵 Received audio:');
  console.log(`   Title: ${audio.title || 'N/A'}`);
  console.log(`   Performer: ${audio.performer || 'N/A'}`);
  console.log(`   Duration: ${audio.duration}s (${Math.floor(audio.duration / 60)}:${(audio.duration % 60).toString().padStart(2, '0')})`);
  console.log(`   File Size: ${(audio.file_size! / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   File ID: ${audio.file_id}`);
  
  // Get file URL
  const fileLink = await ctx.telegram.getFileLink(audio.file_id);
  console.log(`   File URL: ${fileLink.href}`);
  
  // Extract post ID from forward info
  let postId: number | undefined;
  let channelUsername: string | undefined;
  let postDate: Date | undefined;
  
  if (forwardFrom && forwardFrom.type === 'channel') {
    const channel = forwardFrom as any;
    channelUsername = channel.chat?.username;
    postId = channel.message_id;
    postDate = new Date(channel.date * 1000);
    
    console.log(`\n📢 Forwarded from channel:`);
    console.log(`   Channel: @${channelUsername}`);
    console.log(`   Post ID: ${postId}`);
    console.log(`   Date: ${postDate.toISOString()}`);
  }
  
  // Read existing posts
  const data = JSON.parse(fs.readFileSync(POSTS_FILE, 'utf-8'));
  const posts = data.posts;
  
  if (postId && channelUsername) {
    // Check if post exists
    const existingPost = posts.find((p: any) => p.postId === postId);
    
    if (existingPost) {
      console.log(`\n✏️  Updating existing post ${postId}`);
      existingPost.media = {
        type: 'audio',
        url: fileLink.href,
        duration: audio.duration,
        title: audio.title,
        performer: audio.performer,
        fileName: audio.file_name,
        fileSize: audio.file_size,
        mimeType: audio.mime_type,
      };
      existingPost.hasMedia = true;
    } else {
      console.log(`\n➕ Adding new post ${postId}`);
      const newPost = {
        id: `post-${postId}`,
        channelUsername: channelUsername,
        postId: postId,
        date: postDate!.toISOString(),
        timestamp: Math.floor(postDate!.getTime() / 1000),
        text: ctx.message.caption || '',
        media: {
          type: 'audio',
          url: fileLink.href,
          duration: audio.duration,
          title: audio.title,
          performer: audio.performer,
          fileName: audio.file_name,
          fileSize: audio.file_size,
          mimeType: audio.mime_type,
        },
        views: 0,
        hasMedia: true,
        createdAt: new Date().toISOString(),
      };
      
      // Insert in correct position (sorted by timestamp)
      const insertIndex = posts.findIndex((p: any) => p.timestamp < newPost.timestamp);
      if (insertIndex === -1) {
        posts.push(newPost);
      } else {
        posts.splice(insertIndex, 0, newPost);
      }
    }
    
    // Save
    fs.writeFileSync(POSTS_FILE, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`\n💾 Saved to ${POSTS_FILE}`);
    
    await ctx.reply(`✅ Audio qo'shildi!\n\n🎵 ${audio.title || 'Audio'}\n👤 ${audio.performer || 'N/A'}\n⏱ ${Math.floor(audio.duration / 60)}:${(audio.duration % 60).toString().padStart(2, '0')}\n📝 Post ID: ${postId}`);
  } else {
    console.log('\n⚠️  Not a forwarded message from channel');
    await ctx.reply('⚠️ Iltimos, kanal postini forward qiling (oddiy audio emas)');
  }
});

// Handle voice messages
bot.on('voice', async (ctx) => {
  const voice = ctx.message.voice;
  const forwardFrom = ctx.message.forward_origin;
  
  console.log('\n🎤 Received voice message:');
  console.log(`   Duration: ${voice.duration}s`);
  console.log(`   File Size: ${(voice.file_size! / 1024).toFixed(2)} KB`);
  console.log(`   File ID: ${voice.file_id}`);
  
  // Get file URL
  const fileLink = await ctx.telegram.getFileLink(voice.file_id);
  console.log(`   File URL: ${fileLink.href}`);
  
  // Similar processing as audio...
  await ctx.reply('✅ Voice message qabul qilindi!');
});

// Handle text messages
bot.on('text', async (ctx) => {
  await ctx.reply('👋 Salom! Menga kanal postlarini forward qiling:\n\n1. Kanalingizdan audio postni oching\n2. Forward tugmasini bosing\n3. Bu botni tanlang\n\nMen audio metadata va file URL\'ini olaman va posts.json ga qo\'shaman.');
});

// Start bot
bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

console.log('✅ Bot is running. Press Ctrl+C to stop.');
