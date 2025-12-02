const fs = require('fs');
const path = require('path');

const postsFile = path.resolve(__dirname, '../data/posts.json');
const data = JSON.parse(fs.readFileSync(postsFile, 'utf-8'));

const post288 = data.posts.find(p => p.postId === 288);

if (post288) {
  const index = data.posts.indexOf(post288);
  console.log('Post 288 found at index:', index);
  console.log('Date:', post288.date);
  console.log('Timestamp:', post288.timestamp);
  console.log('Has cloudinaryUrl:', !!post288.media?.cloudinaryUrl);
  console.log('CloudinaryUrl:', post288.media?.cloudinaryUrl);
  console.log('\nFirst 10 posts:');
  data.posts.slice(0, 10).forEach((p, i) => {
    console.log(`  ${i}. Post ${p.postId} - ${p.date}`);
  });
} else {
  console.log('❌ Post 288 NOT FOUND!');
  console.log('Total posts:', data.posts.length);
  
  // Check if it was deleted
  console.log('\nSearching for any mention of 288...');
  const mentions = data.posts.filter(p => 
    JSON.stringify(p).includes('288')
  );
  console.log('Found', mentions.length, 'posts mentioning 288');
}
