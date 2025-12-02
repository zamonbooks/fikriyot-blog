/**
 * Fix Cloudinary video URLs - remove version numbers
 */

import * as fs from 'fs';
import * as path from 'path';

const POSTS_FILE = path.resolve(process.cwd(), 'data/posts.json');

function fixVideoUrls() {
  console.log('🔧 Fixing Cloudinary video URLs...\n');

  const data = JSON.parse(fs.readFileSync(POSTS_FILE, 'utf-8'));
  const posts = data.posts;

  let fixed = 0;

  for (const post of posts) {
    if (post.media?.type === 'video' && post.media.cloudinaryUrl) {
      const oldUrl = post.media.cloudinaryUrl;
      
      // Remove version number from URL
      // From: https://res.cloudinary.com/dg8ryayj8/video/upload/v1764453088/fikriyot/video-261.mp4
      // To: https://res.cloudinary.com/dg8ryayj8/video/upload/fikriyot/video-261.mp4
      const newUrl = oldUrl.replace(/\/v\d+\//, '/');
      
      if (oldUrl !== newUrl) {
        post.media.cloudinaryUrl = newUrl;
        fixed++;
        console.log(`✅ Fixed post ${post.postId}`);
        console.log(`   Old: ${oldUrl.substring(0, 80)}...`);
        console.log(`   New: ${newUrl.substring(0, 80)}...`);
      }
      
      // Fix videoParts if exists
      if (post.media.videoParts) {
        post.media.videoParts = post.media.videoParts.map((url: string) => 
          url.replace(/\/v\d+\//, '/')
        );
      }
    }
  }

  fs.writeFileSync(POSTS_FILE, JSON.stringify(data, null, 2), 'utf-8');

  console.log(`\n📊 Summary:`);
  console.log(`✅ Fixed: ${fixed} video URLs`);
  console.log(`💾 Saved to ${POSTS_FILE}\n`);
}

fixVideoUrls();
