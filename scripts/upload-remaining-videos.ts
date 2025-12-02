/**
 * Upload remaining videos directly from their telesco.pe URLs
 */

import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import FormData from 'form-data';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME!;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY!;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET!;
const POSTS_FILE = path.resolve(process.cwd(), 'data/posts.json');

async function uploadToCloudinary(videoUrl: string, postId: number): Promise<string | null> {
    try {
        const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`;

        const timestamp = Math.round(Date.now() / 1000);
        const signature = require('crypto')
            .createHash('sha1')
            .update(`folder=fikriyot&public_id=fikriyot/video-${postId}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`)
            .digest('hex');

        const formData = new FormData();
        formData.append('file', videoUrl);
        formData.append('public_id', `fikriyot/video-${postId}`);
        formData.append('folder', 'fikriyot');
        formData.append('api_key', CLOUDINARY_API_KEY);
        formData.append('timestamp', timestamp.toString());
        formData.append('signature', signature);

        console.log(`  Uploading from: ${videoUrl.substring(0, 60)}...`);

        const response = await axios.post(uploadUrl, formData, {
            headers: formData.getHeaders(),
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            timeout: 60000,
        });

        return response.data.secure_url;
    } catch (error: any) {
        console.error(`  Upload failed:`, error.response?.data?.error?.message || error.message);
        return null;
    }
}

async function uploadRemainingVideos() {
    console.log('Uploading remaining videos to Cloudinary...\n');

    const data = JSON.parse(fs.readFileSync(POSTS_FILE, 'utf-8'));
    const posts = data.posts;

    const videoPosts = posts.filter((p: any) =>
        p.media?.type === 'video' && 
        p.media?.url && 
        !(p.media as any).cloudinaryUrl
    );

    console.log(`Video posts to process: ${videoPosts.length}\n`);

    let uploaded = 0;
    let failed = 0;

    for (const post of videoPosts) {
        try {
            console.log(`Processing post ${post.postId}...`);

            const videoUrl = post.media.url;

            const cloudinaryUrl = await uploadToCloudinary(videoUrl, post.postId);

            if (cloudinaryUrl) {
                post.media.cloudinaryUrl = cloudinaryUrl;
                uploaded++;
                console.log(`  ✅ Success\n`);
            } else {
                failed++;
                console.log(`  ❌ Failed\n`);
            }

        } catch (error: any) {
            failed++;
            console.log(`  ❌ Error: ${error.message}\n`);
        }

        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    fs.writeFileSync(POSTS_FILE, JSON.stringify(data, null, 2), 'utf-8');

    console.log('📊 Summary:');
    console.log(`✅ Uploaded: ${uploaded}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`\n💾 Saved to ${POSTS_FILE}`);
}

uploadRemainingVideos();
