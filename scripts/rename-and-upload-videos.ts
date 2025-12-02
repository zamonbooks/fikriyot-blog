/**
 * Rename videos in cloud folder and upload to Cloudinary
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
const CLOUD_FOLDER = path.resolve(process.cwd(), '../cloud');

// Expected video sizes (from Telegram)
const VIDEO_MAPPING = [
    { postId: 203, expectedSizeMB: 272, tolerance: 20 },
    { postId: 99, expectedSizeMB: 60, tolerance: 5 },
    { postId: 90, expectedSizeMB: 52, tolerance: 5 },
    { postId: 131, expectedSizeMB: 37, tolerance: 3 },
    { postId: 285, expectedSizeMB: 31, tolerance: 3 },
    { postId: 243, expectedSizeMB: 30, tolerance: 3 },
    { postId: 127, expectedSizeMB: 21, tolerance: 2 },
    { postId: 94, expectedSizeMB: 21, tolerance: 2 },
];

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

        console.log(`\n  ✅ Upload complete!`);
        return response.data.secure_url;

    } catch (error: any) {
        console.log(`\n  ❌ Error: ${error.response?.data?.error?.message || error.message}`);
        return null;
    }
}

async function main() {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📤 Auto-Rename and Upload Videos`);
    console.log(`${'='.repeat(60)}\n`);

    if (!fs.existsSync(CLOUD_FOLDER)) {
        console.log(`❌ Cloud folder not found: ${CLOUD_FOLDER}\n`);
        return;
    }

    const data = JSON.parse(fs.readFileSync(POSTS_FILE, 'utf-8'));
    const posts = data.posts;

    // Get all video files
    const videoFiles = fs.readdirSync(CLOUD_FOLDER)
        .filter(f => f.toLowerCase().endsWith('.mp4'))
        .map(f => {
            const filePath = path.join(CLOUD_FOLDER, f);
            const stats = fs.statSync(filePath);
            const sizeMB = Math.round(stats.size / 1024 / 1024);
            return { filename: f, path: filePath, sizeMB };
        });

    console.log(`Found ${videoFiles.length} video files:\n`);
    videoFiles.forEach(v => {
        console.log(`  - ${v.filename} (${v.sizeMB}MB)`);
    });
    console.log('');

    // Match files to posts
    const matches: { file: any; postId: number }[] = [];
    const usedFiles = new Set<string>();

    for (const mapping of VIDEO_MAPPING) {
        const matchingFile = videoFiles.find(f => 
            !usedFiles.has(f.filename) &&
            Math.abs(f.sizeMB - mapping.expectedSizeMB) <= mapping.tolerance
        );

        if (matchingFile) {
            matches.push({ file: matchingFile, postId: mapping.postId });
            usedFiles.add(matchingFile.filename);
            console.log(`✅ Matched: ${matchingFile.filename} → Post ${mapping.postId}`);
        } else {
            console.log(`⚠️  No match found for Post ${mapping.postId} (${mapping.expectedSizeMB}MB)`);
        }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`Uploading ${matches.length} videos...\n`);

    let uploaded = 0;
    let failed = 0;

    for (const match of matches) {
        try {
            const post = posts.find((p: any) => p.postId === match.postId);

            if (!post) {
                console.log(`⚠️  Post ${match.postId} not found, skipping\n`);
                failed++;
                continue;
            }

            if (post.media?.cloudinaryUrl) {
                console.log(`⏭️  Post ${match.postId} already uploaded, skipping\n`);
                continue;
            }

            console.log(`\n[${uploaded + failed + 1}/${matches.length}] Uploading post ${match.postId}...`);
            console.log(`  📁 File: ${match.file.filename} (${match.file.sizeMB}MB)`);

            const cloudinaryUrl = await uploadToCloudinary(match.file.path, match.postId);

            if (cloudinaryUrl) {
                post.media.cloudinaryUrl = cloudinaryUrl;
                uploaded++;
                console.log(`  ✅ Successfully uploaded!\n`);
                
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
    console.log(`❌ Failed: ${failed}`);
    console.log(`\n💾 Saved to ${POSTS_FILE}`);
}

main();
