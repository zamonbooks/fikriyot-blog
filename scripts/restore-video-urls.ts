/**
 * Restore Cloudinary video URLs that were lost during sync
 */

import * as fs from 'fs';
import * as path from 'path';

const POSTS_FILE = path.resolve(process.cwd(), 'data/posts.json');

// Video posts that have Cloudinary URLs (from our previous upload session)
const CLOUDINARY_VIDEOS: { [key: number]: string } = {
  261: 'https://res.cloudinary.com/dg8ryayj8/video/upload/v1764453088/fikriyot/video-261.mp4',
  260: 'https://res.cloudinary.com/dg8ryayj8/video/upload/v1764492337/fikriyot/video-260.mp4',
  226: 'https://res.cloudinary.com/dg8ryayj8/video/upload/v1764453138/fikriyot/video-226.mp4',
  221: 'https://res.cloudinary.com/dg8ryayj8/video/upload/v1764492409/fikriyot/video-221.mp4',
  211: 'https://res.cloudinary.com/dg8ryayj8/video/upload/v1764453177/fikriyot/video-211.mp4',
  188: 'https://res.cloudinary.com/dg8ryayj8/video/upload/v1764453218/fikriyot/video-188.mp4',
  177: 'https://res.cloudinary.com/dg8ryayj8/video/upload/v1764453239/fikriyot/video-177.mp4',
  147: 'https://res.cloudinary.com/dg8ryayj8/video/upload/v1764453259/fikriyot/video-147.mp4',
  126: 'https://res.cloudinary.com/dg8ryayj8/video/upload/v1764492419/fikriyot/video-126.mp4',
  119: 'https://res.cloudinary.com/dg8ryayj8/video/upload/v1764453329/fikriyot/video-119.mp4',
  115: 'https://res.cloudinary.com/dg8ryayj8/video/upload/v1764453349/fikriyot/video-115.mp4',
  114: 'https://res.cloudinary.com/dg8ryayj8/video/upload/v1764453369/fikriyot/video-114.mp4',
  112: 'https://res.cloudinary.com/dg8ryayj8/video/upload/v1764492429/fikriyot/video-112.mp4',
  108: 'https://res.cloudinary.com/dg8ryayj8/video/upload/v1764453409/fikriyot/video-108.mp4',
  93: 'https://res.cloudinary.com/dg8ryayj8/video/upload/v1764492429/fikriyot/video-93.mp4',
  87: 'https://res.cloudinary.com/dg8ryayj8/video/upload/v1764453499/fikriyot/video-87.mp4',
  79: 'https://res.cloudinary.com/dg8ryayj8/video/upload/v1764453519/fikriyot/video-79.mp4',
  74: 'https://res.cloudinary.com/dg8ryayj8/video/upload/v1764453539/fikriyot/video-74.mp4',
  69: 'https://res.cloudinary.com/dg8ryayj8/video/upload/v1764453549/fikriyot/video-69.mp4',
  68: 'https://res.cloudinary.com/dg8ryayj8/video/upload/v1764453579/fikriyot/video-68.mp4',
  54: 'https://res.cloudinary.com/dg8ryayj8/video/upload/v1764453599/fikriyot/video-54.mp4',
  52: 'https://res.cloudinary.com/dg8ryayj8/video/upload/v1764453619/fikriyot/video-52.mp4',
  41: 'https://res.cloudinary.com/dg8ryayj8/video/upload/v1764453639/fikriyot/video-41.mp4',
  // Multi-part video (Post 203)
  203: 'https://res.cloudinary.com/dg8ryayj8/video/upload/v1764498849/fikriyot/video-203-part1.mp4',
};

// Video parts for Post 203
const VIDEO_PARTS_203 = [
  'https://res.cloudinary.com/dg8ryayj8/video/upload/v1764498849/fikriyot/video-203-part1.mp4',
  'https://res.cloudinary.com/dg8ryayj8/video/upload/v1764498929/fikriyot/video-203-part2.mp4',
  'https://res.cloudinary.com/dg8ryayj8/video/upload/v1764499009/fikriyot/video-203-part3.mp4',
];

function restoreVideoUrls() {
  console.log('🔧 Restoring Cloudinary video URLs...\n');

  const data = JSON.parse(fs.readFileSync(POSTS_FILE, 'utf-8'));
  const posts = data.posts;

  let restored = 0;

  for (const post of posts) {
    if (post.media?.type === 'video' && CLOUDINARY_VIDEOS[post.postId]) {
      post.media.cloudinaryUrl = CLOUDINARY_VIDEOS[post.postId];
      
      // Special case for Post 203 (multi-part)
      if (post.postId === 203) {
        post.media.videoParts = VIDEO_PARTS_203;
      }
      
      restored++;
      console.log(`✅ Restored video URL for post ${post.postId}`);
    }
  }

  fs.writeFileSync(POSTS_FILE, JSON.stringify(data, null, 2), 'utf-8');

  console.log(`\n📊 Summary:`);
  console.log(`✅ Restored: ${restored} videos`);
  console.log(`💾 Saved to ${POSTS_FILE}\n`);
}

restoreVideoUrls();
