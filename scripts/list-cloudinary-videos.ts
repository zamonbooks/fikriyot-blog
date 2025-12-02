/**
 * List all videos in Cloudinary using Admin API
 */

import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME!;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY!;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET!;

async function listVideos() {
  console.log('🔍 Listing videos in Cloudinary...\n');

  try {
    const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/resources/video`;
    
    const response = await axios.get(url, {
      auth: {
        username: CLOUDINARY_API_KEY,
        password: CLOUDINARY_API_SECRET
      },
      params: {
        type: 'upload',
        prefix: 'fikriyot/',
        max_results: 500
      }
    });

    const videos = response.data.resources;
    
    console.log(`📊 Found ${videos.length} videos in Cloudinary\n`);

    if (videos.length > 0) {
      console.log('Videos:');
      videos.forEach((video: any, index: number) => {
        console.log(`${index + 1}. ${video.public_id}`);
        console.log(`   URL: ${video.secure_url}`);
        console.log(`   Size: ${Math.round(video.bytes / 1024 / 1024)}MB`);
        console.log('');
      });
    } else {
      console.log('❌ No videos found in fikriyot folder!');
      console.log('\n💡 This means videos were not uploaded or were deleted.');
    }

  } catch (error: any) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

listVideos();
