/**
 * Split large video into parts and upload to Cloudinary
 * Requires ffmpeg to be installed
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import FormData from 'form-data';

const execAsync = promisify(exec);

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME!;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY!;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET!;
const POSTS_FILE = path.resolve(process.cwd(), 'data/posts.json');

async function checkFFmpeg(): Promise<boolean> {
    try {
        await execAsync('ffmpeg -version');
        return true;
    } catch (error) {
        return false;
    }
}

async function getVideoDuration(videoPath: string): Promise<number> {
    try {
        const { stdout } = await execAsync(
            `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`
        );
        return parseFloat(stdout.trim());
    } catch (error) {
        throw new Error('Could not get video duration');
    }
}

async function splitVideo(videoPath: string, outputDir: string, parts: number): Promise<string[]> {
    try {
        console.log(`  ✂️  Splitting video into ${parts} parts...`);

        // Get video duration
        const duration = await getVideoDuration(videoPath);
        const partDuration = Math.ceil(duration / parts);

        console.log(`  📊 Total duration: ${Math.round(duration)}s`);
        console.log(`  📊 Each part: ~${partDuration}s`);

        // Create output directory
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const outputFiles: string[] = [];

        for (let i = 0; i < parts; i++) {
            const startTime = i * partDuration;
            const outputFile = path.join(outputDir, `part-${i + 1}.mp4`);
            
            console.log(`  ✂️  Creating part ${i + 1}/${parts}...`);

            await execAsync(
                `ffmpeg -i "${videoPath}" -ss ${startTime} -t ${partDuration} -c copy -avoid_negative_ts 1 "${outputFile}" -y`
            );

            outputFiles.push(outputFile);
            
            const stats = fs.statSync(outputFile);
            console.log(`     ✅ Part ${i + 1}: ${Math.round(stats.size / 1024 / 1024)}MB`);
        }

        return outputFiles;
    } catch (error: any) {
        throw new Error(`Failed to split video: ${error.message}`);
    }
}

async function uploadToCloudinary(videoPath: string, publicId: string): Promise<string | null> {
    try {
        const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`;

        const timestamp = Math.round(Date.now() / 1000);
        const signature = require('crypto')
            .createHash('sha1')
            .update(`folder=fikriyot&public_id=${publicId}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`)
            .digest('hex');

        const formData = new FormData();
        formData.append('file', fs.createReadStream(videoPath));
        formData.append('public_id', publicId);
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
                    if (percent % 20 === 0) {
                        process.stdout.write(`\r     📤 Uploading: ${percent}%`);
                    }
                }
            }
        });

        console.log('');
        return response.data.secure_url;

    } catch (error: any) {
        console.log('');
        console.log(`     ❌ Error: ${error.response?.data?.error?.message || error.message}`);
        return null;
    }
}

async function main() {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`✂️  Video Splitter & Uploader`);
    console.log(`${'='.repeat(60)}\n`);

    // Check ffmpeg
    console.log('🔍 Checking for ffmpeg...');
    const hasFFmpeg = await checkFFmpeg();
    
    if (!hasFFmpeg) {
        console.log('❌ ffmpeg not found!');
        console.log('\n📝 Install ffmpeg:');
        console.log('   Windows: choco install ffmpeg');
        console.log('   Or download from: https://ffmpeg.org/download.html\n');
        return;
    }
    
    console.log('✅ ffmpeg found\n');

    // Video to split (Post 203) - largest video
    const videoPath = path.resolve(process.cwd(), '..', 'cloud', 'JONLI-EFIR-Utilitarizm-g-oyasini-kim-asos-solgan-fikratuz.mp4');
    
    if (!fs.existsSync(videoPath)) {
        console.log(`❌ Video not found: ${videoPath}`);
        console.log('\n📝 Available videos in cloud folder:\n');
        
        const cloudDir = path.resolve(process.cwd(), '..', 'cloud');
        if (fs.existsSync(cloudDir)) {
            const files = fs.readdirSync(cloudDir).filter(f => f.endsWith('.mp4') || f.endsWith('.MP4'));
            files.forEach(f => {
                const stats = fs.statSync(path.join(cloudDir, f));
                console.log(`   - ${f} (${Math.round(stats.size / 1024 / 1024)}MB)`);
            });
        }
        console.log('');
        return;
    }

    const stats = fs.statSync(videoPath);
    console.log(`📹 Video: video-203.mp4 (${Math.round(stats.size / 1024 / 1024)}MB)\n`);

    try {
        // Split video
        const outputDir = path.resolve(process.cwd(), '..', 'cloud', 'parts-203');
        const parts = await splitVideo(videoPath, outputDir, 3);

        console.log(`\n✅ Video split into ${parts.length} parts\n`);

        // Upload each part
        const uploadedUrls: string[] = [];

        for (let i = 0; i < parts.length; i++) {
            console.log(`📤 Uploading part ${i + 1}/${parts.length}...`);
            
            const publicId = `fikriyot/video-203-part${i + 1}`;
            const url = await uploadToCloudinary(parts[i], publicId);

            if (url) {
                uploadedUrls.push(url);
                console.log(`   ✅ Part ${i + 1} uploaded\n`);
            } else {
                console.log(`   ❌ Part ${i + 1} failed\n`);
            }
        }

        // Update posts.json
        if (uploadedUrls.length === 3) {
            const data = JSON.parse(fs.readFileSync(POSTS_FILE, 'utf-8'));
            const post = data.posts.find((p: any) => p.postId === 203);

            if (post) {
                post.media.videoParts = uploadedUrls;
                post.media.cloudinaryUrl = uploadedUrls[0]; // First part as main
                
                fs.writeFileSync(POSTS_FILE, JSON.stringify(data, null, 2), 'utf-8');
                
                console.log('✅ Updated posts.json with video parts');
            }
        }

        console.log(`\n${'='.repeat(60)}`);
        console.log(`📊 Results:`);
        console.log(`${'='.repeat(60)}`);
        console.log(`✅ Uploaded: ${uploadedUrls.length}/3 parts`);
        console.log(`\n💾 Saved to ${POSTS_FILE}`);

    } catch (error: any) {
        console.log(`\n❌ Error: ${error.message}`);
    }
}

main();
