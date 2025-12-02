const fs = require('fs');
const path = require('path');

const postsFile = path.resolve(__dirname, '../data/posts.json');
const data = JSON.parse(fs.readFileSync(postsFile, 'utf-8'));

console.log('Total posts:', data.posts.length);

const audios = data.posts.filter(p => p.media && p.media.type === 'audio');
console.log('\nAudio posts:', audios.length);
audios.forEach(p => {
  console.log(`  Post ${p.postId}: ${p.media.title}`);
});

const videos = data.posts.filter(p => p.media && p.media.type === 'video');
console.log('\nVideo posts:', videos.length);
videos.slice(0, 3).forEach(p => {
  console.log(`  Post ${p.postId}: ${p.text?.substring(0, 40)}...`);
  console.log(`    Video URL: ${p.media.url}`);
});

const photos = data.posts.filter(p => p.media && p.media.type === 'photo');
console.log('\nPhoto posts:', photos.length);
