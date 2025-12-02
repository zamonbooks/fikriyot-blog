/**
 * Upload manually downloaded videos to Cloudinary
 * 
 * Usage:
 * 1. Download videos from Telegram to a folder (e.g., downloads/)
 * 2. Name them as: video-285.mp4, video-243.mp4, etc.
 * 3. Run: npx tsx scripts/upload-manual-videos.ts
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

// Folder where you downloaded videos (parent directory)
const DOWNLOADS_FOLDER = path.resolve(process.cwd(), '../cloud');

// Video post IDs
const VIDEO_POST_IDS = [285, 243, 203, 131, 127, 99, 94, 90];

async function uploadToCloudinary(videoPath: string, postId: number): Promise<string | null> {
    try {
        console.log(`  📤 Uploading to Cloudinary...`);

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
        return response.data.secure_url;

    } catch (error: any) {
        console.log(`\n  ❌ Error: ${error.response?.data?.error?.message || error.message}`);
        return null;
    }
}

async function main() {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📤 Manual Video Uploader`);
    console.log(`${'='.repeat(60)}\n`);

    // Check if downloads folder exists
    if (!fs.existsSync(DOWNLOADS_FOLDER)) {
        console.log(`❌ Downloads folder not found: ${DOWNLOADS_FOLDER}`);
        console.log(`\n📝 Instructions:`);
        console.log(`   1. Create a 'downloads' folder in project root`);
        console.log(`   2. Download videos from Telegram`);
        console.log(`   3. Name them as: video-285.mp4, video-243.mp4, etc.`);
        console.log(`   4. Run this script again\n`);
        return;
    }

    const data = JSON.parse(fs.readFileSync(POSTS_FILE, 'utf-8'));
    const posts = data.posts;

    // Find video files in downloads folder
    const videoFiles = fs.readdirSync(DOWNLOADS_FOLDER)
        .filter(f => f.startsWith('video-') && (f.endsWith('.mp4') || f.endsWith('.MP4')));

    console.log(`Found ${videoFiles.length} video files in downloads folder\n`);

    if (videoFiles.length === 0) {
        console.log(`⚠️  No video files found!`);
        console.log(`   Expected format: video-285.mp4, video-243.mp4, etc.\n`);
        return;
    }

    let uploaded = 0;
    let failed = 0;
    let skipped = 0;

    for (const videoFile of videoFiles) {
        try {
            // Extract post ID from filename
            const match = videoFile.match(/video-(\d+)\./);
            if (!match) {
                console.log(`⚠️  Skipping ${videoFile} - invalid filename format\n`);
                skipped++;
                continue;
            }

            const postId = parseInt(match[1]);
            const post = posts.find((p: any) => p.postId === postId);

            if (!post) {
                console.log(`⚠️  Skipping ${videoFile} - post ${postId} not found\n`);
                skipped++;
                continue;
            }

            if (post.media?.cloudinaryUrl) {
                console.log(`⏭️  Skipping post ${postId} - already uploaded\n`);
                skipped++;
                continue;
            }

            console.log(`\n[${uploaded + failed + skipped + 1}/${videoFiles.length}] Processing ${videoFile}...`);
            
            const videoPath = path.join(DOWNLOADS_FOLDER, videoFile);
            const stats = fs.statSync(videoPath);
            const sizeMB = Math.round(stats.size / 1024 / 1024);
            
            console.log(`  📁 File size: ${sizeMB}MB`);

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
