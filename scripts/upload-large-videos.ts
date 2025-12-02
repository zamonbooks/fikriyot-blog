/**
 * Try to upload large videos directly from telesco.pe URLs
 * These are videos that are too large for Bot API (>20MB)
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

// Large video posts that failed with Bot API
const LARGE_VIDEO_POSTS = [285, 243, 203, 131, 127, 99, 94, 90];

async function downloadAndUpload(videoUrl: string, postId: number): Promise<string | null> {
    try {
        console.log(`  📥 Downloading video...`);
        
        // Download video to memory
        const videoResponse = await axios.get(videoUrl, {
            responseType: 'arraybuffer',
            timeout: 300000, // 5 minutes
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            onDownloadProgress: (progressEvent) => {
                if (progressEvent.total) {
                    const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    if (percent % 10 === 0) {
                        process.stdout.write(`\r  📥 Downloading: ${percent}%`);
                    }
                }
            }
        });

        console.log(`\n  ✅ Downloaded ${Math.round(videoResponse.data.length / 1024 / 1024)}MB`);
        console.log(`  📤 Uploading to Cloudinary...`);

        const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`;

        const timestamp = Math.round(Date.now() / 1000);
        const signature = require('crypto')
            .createHash('sha1')
            .update(`folder=fikriyot&public_id=fikriyot/video-${postId}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`)
            .digest('hex');

        const formData = new FormData();
        formData.append('file', Buffer.from(videoResponse.data), {
            filename: `video-${postId}.mp4`,
            contentType: 'video/mp4'
        });
        formData.append('public_id', `fikriyot/video-${postId}`);
        formData.append('folder', 'fikriyot');
        formData.append('api_key', CLOUDINARY_API_KEY);
        formData.append('timestamp', timestamp.toString());
        formData.append('signature', signature);
        formData.append('resource_type', 'video');

        const uploadResponse = await axios.post(uploadUrl, formData, {
            headers: formData.getHeaders(),
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            timeout: 600000, // 10 minutes
            onUploadProgress: (progressEvent) => {
                if (progressEvent.total) {
                    const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    if (percent % 10 === 0) {
                        process.stdout.write(`\r  📤 Uploading: ${percent}%`);
                    }
                }
            }
        });

        console.log(`\n  ✅ Upload complete!`);
        return uploadResponse.data.secure_url;

    } catch (error: any) {
        console.log(`\n  ❌ Error: ${error.response?.data?.error?.message || error.message}`);
        return null;
    }
}

async function tryDirectUpload(videoUrl: string, postId: number): Promise<string | null> {
    try {
        console.log(`  🔗 Trying direct URL upload...`);

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
        formData.append('resource_type', 'video');

        const response = await axios.post(uploadUrl, formData, {
            headers: formData.getHeaders(),
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            timeout: 600000,
        });

        console.log(`  ✅ Direct upload successful!`);
        return response.data.secure_url;

    } catch (error: any) {
        console.log(`  ⚠️  Direct upload failed: ${error.response?.data?.error?.message || error.message}`);
        return null;
    }
}

async function main() {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🎬 Large Video Uploader`);
    console.log(`${'='.repeat(60)}\n`);

    const data = JSON.parse(fs.readFileSync(POSTS_FILE, 'utf-8'));
    const posts = data.posts;

    const largePosts = posts.filter((p: any) =>
        LARGE_VIDEO_POSTS.includes(p.postId) && !p.media.cloudinaryUrl
    );

    console.log(`Large videos to process: ${largePosts.length}\n`);

    if (largePosts.length === 0) {
        console.log('✅ All large videos already uploaded!');
        return;
    }

    let uploaded = 0;
    let failed = 0;

    for (const post of largePosts) {
        try {
            console.log(`\n[${uploaded + failed + 1}/${largePosts.length}] Processing post ${post.postId}...`);
            console.log(`  URL: ${post.media.url.substring(0, 60)}...`);

            // Method 1: Try direct URL upload (fastest)
            let cloudinaryUrl = await tryDirectUpload(post.media.url, post.postId);

            // Method 2: If direct fails, download and upload
            if (!cloudinaryUrl) {
                console.log(`  🔄 Trying download and upload method...`);
                cloudinaryUrl = await downloadAndUpload(post.media.url, post.postId);
            }

            if (cloudinaryUrl) {
                post.media.cloudinaryUrl = cloudinaryUrl;
                uploaded++;
                console.log(`  ✅ Successfully uploaded!\n`);
                
                // Save after each success
                fs.writeFileSync(POSTS_FILE, JSON.stringify(data, null, 2), 'utf-8');
            } else {
                failed++;
                console.log(`  ❌ All methods failed\n`);
            }

        } catch (error: any) {
            failed++;
            console.log(`  ❌ Error: ${error.message}\n`);
        }

        // Wait between uploads
        await new Promise(resolve => setTimeout(resolve, 3000));
    }

    console.log(`${'='.repeat(60)}`);
    console.log(`📊 Final Results:`);
    console.log(`${'='.repeat(60)}`);
    console.log(`✅ Uploaded: ${uploaded}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`\n💾 Saved to ${POSTS_FILE}`);
}

main();
