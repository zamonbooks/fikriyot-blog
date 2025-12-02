/**
 * Download audio files from Telegram and upload to Cloudinary
 */

import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import FormData from 'form-data';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const CHANNEL_USERNAME = process.env.TELEGRAM_CHANNEL_USERNAME!;
const YOUR_CHAT_ID = process.env.TELEGRAM_YOUR_CHAT_ID!;
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME!;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY!;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET!;
const POSTS_FILE = path.resolve(process.cwd(), 'data/posts.json');

interface TelegramMessage {
  message_id: number;
  audio?: {
    file_id: string;
    duration: number;
    performer?: string;
    title?: string;
    file_name?: string;
  };
}

async function getAudioFileId(postId: number): Promise<string | null> {
  try {
    // Get channel info
    const chatUrl = `https://api.telegram.org/bot${BOT_TOKEN}/getChat`;
    const chatResponse = await axios.get(chatUrl, {
      params: { chat_id: `@${CHANNEL_USERNAME}` }
    });
    
    const channelId = chatResponse.data.result.id;
    
    // Forward message to get file_id
    const forwardUrl = `https://api.telegram.org/bot${BOT_TOKEN}/forwardMessage`;
    const forwardResponse = await axios.post(forwardUrl, {
      chat_id: YOUR_CHAT_ID,
      from_chat_id: channelId,
      message_id: postId
    });
    
    const message: TelegramMessage = forwardResponse.data.result;
    return message.audio?.file_id || null;
  } catch (error: any) {
    console.error(`Failed to get file_id for post ${postId}:`, error.response?.data || error.message);
    return null;
  }
}

async function downloadAudioFile(fileId: string): Promise<Buffer | null> {
  try {
    // Get file path
    const fileUrl = `https://api.telegram.org/bot${BOT_TOKEN}/getFile`;
    const fileResponse = await axios.get(fileUrl, {
      params: { file_id: fileId }
    });
    
    const filePath = fileResponse.data.result.file_path;
    console.log(`   File path: ${filePath}`);
    
    // Download file
    const downloadUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`;
    const downloadResponse = await axios.get(downloadUrl, {
      responseType: 'arraybuffer'
    });
    
    return Buffer.from(downloadResponse.data);
  } catch (error: any) {
    console.error(`Failed to download file:`, error.response?.data || error.message);
    return null;
  }
}

async function uploadToCloudinary(buffer: Buffer, fileName: string): Promise<string | null> {
  try {
    const formData = new FormData();
    formData.append('file', buffer, fileName);
    formData.append('upload_preset', 'fikriyot');
    formData.append('resource_type', 'video'); // Cloudinary uses 'video' for audio files
    
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`,
      formData,
      {
        headers: formData.getHeaders(),
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );
    
    return response.data.secure_url;
  } catch (error: any) {
    console.error(`Failed to upload to Cloudinary:`, error.response?.data || error.message);
    return null;
  }
}

async function processAudioPosts() {
  console.log('Downloading and uploading audio files...\n');
  
  // Read posts
  const data = JSON.parse(fs.readFileSync(POSTS_FILE, 'utf-8'));
  const audioPosts = data.posts.filter((p: any) => 
    p.media && p.media.type === 'audio' && !p.media.cloudinaryUrl
  );
  
  console.log(`Found ${audioPosts.length} audio posts to process\n`);
  
  for (const post of audioPosts) {
    console.log(`Processing post ${post.postId}...`);
    
    // Get file_id
    const fileId = await getAudioFileId(post.postId);
    if (!fileId) {
      console.log(`   ❌ Could not get file_id\n`);
      continue;
    }
    
    console.log(`   File ID: ${fileId}`);
    
    // Download file
    const buffer = await downloadAudioFile(fileId);
    if (!buffer) {
      console.log(`   ❌ Could not download file\n`);
      continue;
    }
    
    console.log(`   Downloaded: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);
    
    // Upload to Cloudinary
    const fileName = post.media.fileName || `audio_${post.postId}.mp3`;
    const cloudinaryUrl = await uploadToCloudinary(buffer, fileName);
    if (!cloudinaryUrl) {
      console.log(`   ❌ Could not upload to Cloudinary\n`);
      continue;
    }
    
    console.log(`   ✅ Uploaded to Cloudinary: ${cloudinaryUrl}`);
    
    // Update post
    post.media.cloudinaryUrl = cloudinaryUrl;
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Save
  fs.writeFileSync(POSTS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`\n💾 Saved to ${POSTS_FILE}`);
}

processAudioPosts();
