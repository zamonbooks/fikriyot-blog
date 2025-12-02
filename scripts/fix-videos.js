const fs = require('fs');
const path = require('path');

const postsFile = path.resolve(__dirname, '../data/posts.json');
const data = JSON.parse(fs.readFileSync(postsFile, 'utf-8'));

console.log('Fixing video posts...\n');

let fixed = 0;
data.posts.forEach(post => {
  if (post.media && post.media.type === 'video') {
    // If video has URL but no videoUrl or cloudinaryUrl, use URL as videoUrl
    if (post.media.url && !post.media.videoUrl && !post.media.cloudinaryUrl) {
      post.media.videoUrl = post.media.url;
      fixed++;
      console.log(`Fixed post ${post.postId}`);
    }
  }
});

fs.writeFileSync(postsFile, JSON.stringify(data, null, 2), 'utf-8');
console.log(`\n✅ Fixed ${fixed} video posts!`);
