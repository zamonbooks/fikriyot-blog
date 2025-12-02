/**
 * Fix media types for posts that are incorrectly marked as videos
 */

import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const POSTS_FILE = path.resolve(process.cwd(), 'data/posts.json');

async function checkMediaType(url: string): Promise<string> {
    try {
        const response = await axios.head(url, { timeout: 10000 });
        const contentType = response.headers['content-type'] || '';
        
        if (contentType.includes('video')) return 'video';
        if (contentType.includes('image')) return 'photo';
        
        return 'unknown';
    } catch (error) {
        return 'unknown';
    }
}

async function fixMediaTypes() {
    console.log('Checking and fixing media types...\n');

    const data = JSON.parse(fs.readFileSync(POSTS_FILE, 'utf-8'));
    const posts = data.posts;

    const videoPosts = posts.filter((p: any) =>
        p.media?.type === 'video' && 
        p.media?.url && 
        !(p.media as any).cloudinaryUrl
    );

    console.log(`Posts to check: ${videoPosts.length}\n`);

    let fixed = 0;
    let stillVideo = 0;

    for (const post of videoPosts) {
        console.log(`Checking post ${post.postId}...`);
        
        const actualType = await checkMediaType(post.media.url);
        console.log(`  Current: ${post.media.type}, Actual: ${actualType}`);
        
        if (actualType === 'photo' && post.media.type === 'video') {
            post.media.type = 'photo';
            fixed++;
            console.log(`  ✅ Fixed to photo\n`);
        } else if (actualType === 'video') {
            stillVideo++;
            console.log(`  ℹ️  Still video\n`);
        } else {
            console.log(`  ⚠️  Unknown type\n`);
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    fs.writeFileSync(POSTS_FILE, JSON.stringify(data, null, 2), 'utf-8');

    console.log('📊 Summary:');
    console.log(`✅ Fixed to photo: ${fixed}`);
    console.log(`📹 Still video: ${stillVideo}`);
    console.log(`\n💾 Saved to ${POSTS_FILE}`);
}

fixMediaTypes();
