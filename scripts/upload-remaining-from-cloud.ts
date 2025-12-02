/**
 * Upload remaining videos from cloud folder to Cloudinary
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
const CLOUD_DIR = path.resolve(process.cwd(), '..', 'cloud');

// Mapping of video files to post IDs
const VIDEO_MAPPING: { [key: string]: number } = {
    'Ролик.mp4': 285,
    'FINAL 5-DAQIQA.mp4': 243,
    'RAMAZON TABRIGI 2025 tg.mp4': 131,
    'Ilmga-himmat-va-gunohga-rag-bat-Husayn-Buxoriy.mp4': 127,
    'IMG_6609.MP4': 99,
    'video_2025-11-30_15-53-20.mp4': 94,
    'AbroBey-Bolalik-Mood-video.mp4': 90
};

async function uploadToCloudinary(videoPath: string, postId: number): Promise<string | null> {
    try {
        const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`;

        const timestamp = Math.round(Date.now() / 1000);
        const signature = require('crypto')
            .createHash('sha1')
            .update(`folder=fikriyot&public_id=fikriyot/video-${postId}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`)
            .digest('hex');

        const formData = new FormData();
        formData.append('file', fs.createReadStream(videoPath));
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
            onUploadProgress: (progressEvent) => {
                if (progressEvent.total) {
                    const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    if (percent % 10 === 0) {
                        process.stdout.write(`\r  📤 Uploading: ${percent}%`);
                    }
                }
            }
        });

        console.log('');
        return response.data.secure_url;

    } catch (error: any) {
        console.log('');
        console.log(`  ❌ Error: ${error.response?.data?.error?.message || error.message}`);
        return null;
    }
}

async function main() {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📤 Upload Remaining Videos from Cloud`);
    console.log(`${'='.repeat(60)}\n`);

    if (!fs.existsSync(CLOUD_DIR)) {
        console.log(`❌ Cloud folder not found: ${CLOUD_DIR}\n`);
        return;
    }

    const data = JSON.parse(fs.readFileSync(POSTS_FILE, 'utf-8'));
    const posts = data.posts;

    let uploaded = 0;
    let failed = 0;
    let skipped = 0;

    const videoFiles = Object.keys(VIDEO_MAPPING);
    console.log(`Found ${videoFiles.length} videos to upload\n`);

    for (const videoFile of videoFiles) {
        try {
            const postId = VIDEO_MAPPING[videoFile];
            const post = posts.find((p: any) => p.postId === postId);

            if (!post) {
                console.log(`⚠️  Post ${postId} not found, skipping ${videoFile}\n`);
                skipped++;
                continue;
            }

            if (post.media?.cloudinaryUrl) {
                console.log(`⏭️  Post ${postId} already uploaded, skipping\n`);
                skipped++;
                continue;
            }

            console.log(`\n[${uploaded + failed + skipped + 1}/${videoFiles.length}] Processing post ${postId}...`);
            console.log(`  📁 File: ${videoFile}`);

            const videoPath = path.join(CLOUD_DIR, videoFile);
            
            if (!fs.existsSync(videoPath)) {
                console.log(`  ❌ File not found: ${videoPath}\n`);
                failed++;
                continue;
            }

            const stats = fs.statSync(videoPath);
            const sizeMB = Math.round(stats.size / 1024 / 1024);
            console.log(`  📊 Size: ${sizeMB}MB`);

            if (sizeMB > 100) {
                console.log(`  ⚠️  File too large (${sizeMB}MB > 100MB Cloudinary limit)`);
                console.log(`  💡 This video needs to be split into parts\n`);
                failed++;
                continue;
            }

            const cloudinaryUrl = await uploadToCloudinary(videoPath, postId);

            if (cloudinaryUrl) {
                post.media.cloudinaryUrl = cloudinaryUrl;
                uploaded++;
                console.log(`  ✅ Successfully uploaded!\n`);
                
                // Save after each success
                fs.writeFileSync(POSTS_FILE, JSON.stringify(data, null, 2), 'utf-8');
            } else {
                failed++;
                console.log(`  ❌ Upload failed\n`);
            }

        } catch (error: any) {
            failed++;
            console.log(`  ❌ Error: ${error.message}\n`);
        }

        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log(`${'='.repeat(60)}`);
    console.log(`📊 Final Results:`);
    console.log(`${'='.repeat(60)}`);
    console.log(`✅ Uploaded: ${uploaded}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`\n💾 Saved to ${POSTS_FILE}`);
}

main();
