/**
 * Upload media from Telegram to Cloudinary
 */

import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET || 'fikriyot';
const POSTS_FILE = path.resolve(process.cwd(), 'data/posts.json');

interface Post {
  id: string;
  postId: number;
  media?: {
    type: string;
    url: string;
    cloudinaryUrl?: string;
  };
  [key: string]: any;
}

async function uploadToCloudinary(mediaUrl: string, postId: number, mediaType: string): Promise<string | null> {
  if (!CLOUDINARY_CLOUD_NAME) {
    return null;
  }

  try {
    // Use video/upload for videos and audio, image/upload for images
    // Cloudinary treats audio files as 'video' resource type
    const resourceType = (mediaType === 'video' || mediaType === 'audio' || mediaType === 'voice') ? 'video' : 'image';
    const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`;
    
    const response = await axios.post(uploadUrl, {
      file: mediaUrl,
      upload_preset: CLOUDINARY_UPLOAD_PRESET,
      public_id: `fikriyot/post-${postId}`,
      folder: 'fikriyot',
      resource_type: resourceType,
      quality: 'auto:best',
      fetch_format: 'auto',
      flags: 'preserve_transparency',
    });

    return response.data.secure_url;
  } catch (error: any) {
    console.error(`Failed to upload post ${postId}:`, error.response?.data?.error?.message || error.message);
    return null;
  }
}

async function uploadAllMedia() {
  console.log('Starting media upload to Cloudinary...\n');

  if (!CLOUDINARY_CLOUD_NAME) {
    console.log('⚠️  Cloudinary not configured.');
    console.log('\nTo use this feature:');
    console.log('1. Sign up at https://cloudinary.com (free: 25GB/month)');
    console.log('2. Go to Settings → Upload → Add upload preset');
    console.log('   - Preset name: fikriyot');
    console.log('   - Signing mode: Unsigned');
    console.log('3. Add to .env.local:');
    console.log('   CLOUDINARY_CLOUD_NAME=your_cloud_name');
    console.log('   CLOUDINARY_UPLOAD_PRESET=fikriyot');
    return;
  }

  const data = JSON.parse(fs.readFileSync(POSTS_FILE, 'utf-8'));
  const posts: Post[] = data.posts;

  console.log(`Found ${posts.length} posts`);
  
  const postsWithMedia = posts.filter(p => p.media?.url && !p.media.cloudinaryUrl);
  console.log(`Posts with media to upload: ${postsWithMedia.length}\n`);

  if (postsWithMedia.length === 0) {
    console.log('✅ All media already uploaded!');
    return;
  }

  let uploaded = 0;
  let failed = 0;

  for (const post of postsWithMedia) {
    if (!post.media?.url) continue;

    const mediaTypeLabel = post.media.type === 'voice' ? 'voice message' : 
                          post.media.type === 'audio' ? 'audio' : 
                          post.media.type;
    console.log(`Uploading post ${post.postId} (${mediaTypeLabel})...`);
    
    const cloudinaryUrl = await uploadToCloudinary(post.media.url, post.postId, post.media.type);
    
    if (cloudinaryUrl) {
      post.media.cloudinaryUrl = cloudinaryUrl;
      uploaded++;
      console.log(`✅ Success`);
    } else {
      failed++;
      console.log(`❌ Failed`);
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  fs.writeFileSync(POSTS_FILE, JSON.stringify(data, null, 2), 'utf-8');

  console.log('\n📊 Summary:');
  console.log(`✅ Uploaded: ${uploaded}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`\n💾 Saved to ${POSTS_FILE}`);
}

uploadAllMedia();
