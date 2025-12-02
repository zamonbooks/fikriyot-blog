/**
 * Upload videos directly from telesco.pe URLs to Cloudinary
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

async function checkIfVideo(url: string): Promise<boolean> {
    try {
        const response = await axios.head(url, { timeout: 10000 });
        const contentType = response.headers['content-type'] || '';
        return contentType.includes('video');
    } catch (error) {
        return false;
    }
}

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

        const response = await axios.post(uploadUrl, formData, {
            headers: formData.getHeaders(),
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            timeout: 120000,
        });

        return response.data.secure_url;
    } catch (error: any) {
        const errorMsg = error.response?.data?.error?.message || error.message;
        throw new Error(errorMsg);
    }
}

async function uploadDirectVideos() {
    console.log('Uploading videos directly from telesco.pe URLs...\n');

    const data = JSON.parse(fs.readFileSync(POSTS_FILE, 'utf-8'));
    const posts = data.posts;

    const videoPosts = posts.filter((p: any) =>
        p.media?.type === 'video' && 
        p.media?.url && 
        !p.media.cloudinaryUrl
    );

    console.log(`Total video posts: ${posts.filter((p: any) => p.media?.type === 'video').length}`);
    console.log(`Already uploaded: ${posts.filter((p: any) => p.media?.type === 'video' && p.media.cloudinaryUrl).length}`);
    console.log(`Remaining to process: ${videoPosts.length}\n`);

    if (videoPosts.length === 0) {
        console.log('✅ All videos are already uploaded!');
        return;
    }

    let uploaded = 0;
    let failed = 0;
    let notVideo = 0;

    for (const post of videoPosts) {
        try {
            console.log(`\n[${uploaded + failed + notVideo + 1}/${videoPosts.length}] Processing post ${post.postId}...`);

            const videoUrl = post.media.url;
            console.log(`  🔍 Checking URL: ${videoUrl.substring(0, 60)}...`);

            // Check if it's actually a video
            const isVideo = await checkIfVideo(videoUrl);
            
            if (!isVideo) {
                console.log(`  ⚠️  Not a video (might be image/thumbnail)`);
                notVideo++;
                continue;
            }

            console.log(`  ✅ Confirmed as video`);
            console.log(`  📤 Uploading to Cloudinary...`);

            const cloudinaryUrl = await uploadToCloudinary(videoUrl, post.postId);

            if (cloudinaryUrl) {
                post.media.cloudinaryUrl = cloudinaryUrl;
                uploaded++;
                console.log(`  ✅ Successfully uploaded!`);
                
                // Save after each successful upload
                fs.writeFileSync(POSTS_FILE, JSON.stringify(data, null, 2), 'utf-8');
            }

        } catch (error: any) {
            failed++;
            console.log(`  ❌ Error: ${error.message}`);
        }

        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 Final Summary:');
    console.log('='.repeat(50));
    console.log(`✅ Successfully uploaded: ${uploaded}`);
    console.log(`⚠️  Not video files: ${notVideo}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📁 Total processed: ${uploaded + failed + notVideo}`);
    console.log(`\n💾 Saved to ${POSTS_FILE}`);
}

uploadDirectVideos();
