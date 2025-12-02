/**
 * Upload local audio file to Cloudinary
 */

import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import FormData from 'form-data';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME!;
const POSTS_FILE = path.resolve(process.cwd(), 'data/posts.json');

async function uploadToCloudinary(filePath: string): Promise<string | null> {
  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));
    formData.append('upload_preset', 'fikriyot');
    formData.append('resource_type', 'video'); // Cloudinary uses 'video' for audio files
    
    console.log('Uploading to Cloudinary...');
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
    console.error(`Failed to upload:`, error.response?.data || error.message);
    return null;
  }
}

async function processLocalAudio() {
  console.log('Uploading local audio file...\n');
  
  const audioPath = path.resolve(process.cwd(), '../cloud/Erkin A\'zam - Anoyining jaydari olmasi.mp3');
  
  if (!fs.existsSync(audioPath)) {
    console.error('❌ Audio file not found:', audioPath);
    return;
  }
  
  const stats = fs.statSync(audioPath);
  console.log(`File: ${path.basename(audioPath)}`);
  console.log(`Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB\n`);
  
  // Upload to Cloudinary
  const cloudinaryUrl = await uploadToCloudinary(audioPath);
  if (!cloudinaryUrl) {
    console.error('❌ Upload failed');
    return;
  }
  
  console.log(`✅ Uploaded: ${cloudinaryUrl}\n`);
  
  // Update post 288
  const data = JSON.parse(fs.readFileSync(POSTS_FILE, 'utf-8'));
  const post288 = data.posts.find((p: any) => p.postId === 288);
  
  if (post288 && post288.media) {
    post288.media.cloudinaryUrl = cloudinaryUrl;
    fs.writeFileSync(POSTS_FILE, JSON.stringify(data, null, 2), 'utf-8');
    console.log('✅ Updated post 288 in posts.json');
  } else {
    console.error('❌ Post 288 not found');
  }
}

processLocalAudio();
