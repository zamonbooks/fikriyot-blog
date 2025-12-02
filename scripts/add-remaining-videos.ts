/**
 * Add remaining video URLs (manually uploaded ones)
 */

import * as fs from 'fs';
import * as path from 'path';

const POSTS_FILE = path.resolve(process.cwd(), 'data/posts.json');

// Manually uploaded videos from cloud folder
const MANUAL_VIDEOS: { [key: number]: string } = {
  285: 'https://res.cloudinary.com/dg8ryayj8/video/upload/fikriyot/video-285.mp4',
  243: 'https://res.cloudinary.com/dg8ryayj8/video/upload/fikriyot/video-243.mp4',
  131: 'https://res.cloudinary.com/dg8ryayj8/video/upload/fikriyot/video-131.mp4',
  127: 'https://res.cloudinary.com/dg8ryayj8/video/upload/fikriyot/video-127.mp4',
  99: 'https://res.cloudinary.com/dg8ryayj8/video/upload/fikriyot/video-99.mp4',
  94: 'https://res.cloudinary.com/dg8ryayj8/video/upload/fikriyot/video-94.mp4',
  90: 'https://res.cloudinary.com/dg8ryayj8/video/upload/fikriyot/video-90.mp4',
};

function addRemainingVideos() {
  console.log('🔧 Adding remaining video URLs...\n');

  const data = JSON.parse(fs.readFileSync(POSTS_FILE, 'utf-8'));
  const posts = data.posts;

  let added = 0;

  for (const post of posts) {
    if (post.media?.type === 'video' && !post.media.cloudinaryUrl && MANUAL_VIDEOS[post.postId]) {
      post.media.cloudinaryUrl = MANUAL_VIDEOS[post.postId];
      added++;
      console.log(`✅ Added video URL for post ${post.postId}`);
    }
  }

  fs.writeFileSync(POSTS_FILE, JSON.stringify(data, null, 2), 'utf-8');

  console.log(`\n📊 Summary:`);
  console.log(`✅ Added: ${added} video URLs`);
  console.log(`💾 Saved to ${POSTS_FILE}\n`);
  
  // Final count
  const videos = posts.filter((p: any) => p.media?.type === 'video');
  const withUrl = videos.filter((v: any) => v.media.cloudinaryUrl);
  console.log(`📹 Total videos: ${videos.length}`);
  console.log(`✅ With Cloudinary URL: ${withUrl.length}`);
  console.log(`❌ Missing: ${videos.length - withUrl.length}\n`);
}

addRemainingVideos();
