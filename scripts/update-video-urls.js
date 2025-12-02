const fs = require('fs');
const path = require('path');

const postsFile = path.resolve(__dirname, '../data/posts.json');
const data = JSON.parse(fs.readFileSync(postsFile, 'utf-8'));

console.log('Updating video URLs from Cloudinary...\n');

// Map of postId to Cloudinary URL
const cloudinaryVideos = {
  108: 'https://res.cloudinary.com/dg8ryayj8/video/upload/v1764453404/fikriyot/fikriyot/video-108.mp4',
  112: 'https://res.cloudinary.com/dg8ryayj8/video/upload/v1764492420/fikriyot/fikriyot/video-112.mp4',
  114: 'https://res.cloudinary.com/dg8ryayj8/video/upload/v1764453367/fikriyot/fikriyot/video-114.mp4',
  115: 'https://res.cloudinary.com/dg8ryayj8/video/upload/v1764453347/fikriyot/fikriyot/video-115.mp4',
  119: 'https://res.cloudinary.com/dg8ryayj8/video/upload/v1764453327/fikriyot/fikriyot/video-119.mp4',
  126: 'https://res.cloudinary.com/dg8ryayj8/video/upload/v1764492412/fikriyot/fikriyot/video-126.mp4',
  127: 'https://res.cloudinary.com/dg8ryayj8/video/upload/v1764493406/fikriyot/fikriyot/video-127.mp4',
  131: 'https://res.cloudinary.com/dg8ryayj8/video/upload/v1764493379/fikriyot/fikriyot/video-131.mp4',
  147: 'https://res.cloudinary.com/dg8ryayj8/video/upload/v1764453254/fikriyot/fikriyot/video-147.mp4',
  177: 'https://res.cloudinary.com/dg8ryayj8/video/upload/v1764453233/fikriyot/fikriyot/video-177.mp4',
  188: 'https://res.cloudinary.com/dg8ryayj8/video/upload/v1764453212/fikriyot/fikriyot/video-188.mp4',
  211: 'https://res.cloudinary.com/dg8ryayj8/video/upload/v1764453176/fikriyot/fikriyot/video-211.mp4',
  221: 'https://res.cloudinary.com/dg8ryayj8/video/upload/v1764492402/fikriyot/fikriyot/video-221.mp4',
  226: 'https://res.cloudinary.com/dg8ryayj8/video/upload/v1764453138/fikriyot/fikriyot/video-226.mp4',
  243: 'https://res.cloudinary.com/dg8ryayj8/video/upload/v1764493397/fikriyot/fikriyot/video-243.mp4',
  260: 'https://res.cloudinary.com/dg8ryayj8/video/upload/v1764492335/fikriyot/fikriyot/video-260.mp4',
  261: 'https://res.cloudinary.com/dg8ryayj8/video/upload/v1764453083/fikriyot/fikriyot/video-261.mp4',
  285: 'https://res.cloudinary.com/dg8ryayj8/video/upload/v1764493388/fikriyot/fikriyot/video-285.mp4',
  41: 'https://res.cloudinary.com/dg8ryayj8/video/upload/v1764453635/fikriyot/fikriyot/video-41.mp4',
  52: 'https://res.cloudinary.com/dg8ryayj8/video/upload/v1764453614/fikriyot/fikriyot/video-52.mp4',
  54: 'https://res.cloudinary.com/dg8ryayj8/video/upload/v1764453592/fikriyot/fikriyot/video-54.mp4',
  68: 'https://res.cloudinary.com/dg8ryayj8/video/upload/v1764453571/fikriyot/fikriyot/video-68.mp4',
  69: 'https://res.cloudinary.com/dg8ryayj8/video/upload/v1764453549/fikriyot/fikriyot/video-69.mp4',
  74: 'https://res.cloudinary.com/dg8ryayj8/video/upload/v1764453530/fikriyot/fikriyot/video-74.mp4',
  79: 'https://res.cloudinary.com/dg8ryayj8/video/upload/v1764453512/fikriyot/fikriyot/video-79.mp4',
  87: 'https://res.cloudinary.com/dg8ryayj8/video/upload/v1764453491/fikriyot/fikriyot/video-87.mp4',
  90: 'https://res.cloudinary.com/dg8ryayj8/video/upload/v1764493362/fikriyot/fikriyot/video-90.mp4',
  93: 'https://res.cloudinary.com/dg8ryayj8/video/upload/v1764492427/fikriyot/fikriyot/video-93.mp4',
  94: 'https://res.cloudinary.com/dg8ryayj8/video/upload/v1764493412/fikriyot/fikriyot/video-94.mp4',
  99: 'https://res.cloudinary.com/dg8ryayj8/video/upload/v1764493347/fikriyot/fikriyot/video-99.mp4',
};

// Special case for post 203 with 3 parts
const post203Parts = [
  'https://res.cloudinary.com/dg8ryayj8/video/upload/v1764498843/fikriyot/fikriyot/video-203-part1.mp4',
  'https://res.cloudinary.com/dg8ryayj8/video/upload/v1764498892/fikriyot/fikriyot/video-203-part2.mp4',
  'https://res.cloudinary.com/dg8ryayj8/video/upload/v1764498940/fikriyot/fikriyot/video-203-part3.mp4',
];

let updated = 0;

data.posts.forEach(post => {
  if (post.media && post.media.type === 'video') {
    if (post.postId === 203) {
      // Special handling for multi-part video
      post.media.videoParts = post203Parts;
      post.media.cloudinaryUrl = post203Parts[0]; // First part as main URL
      updated++;
      console.log(`✅ Updated post ${post.postId} (3 parts)`);
    } else if (cloudinaryVideos[post.postId]) {
      post.media.cloudinaryUrl = cloudinaryVideos[post.postId];
      delete post.media.videoUrl; // Remove old videoUrl
      updated++;
      console.log(`✅ Updated post ${post.postId}`);
    }
  }
});

fs.writeFileSync(postsFile, JSON.stringify(data, null, 2), 'utf-8');
console.log(`\n✅ Updated ${updated} video posts!`);
