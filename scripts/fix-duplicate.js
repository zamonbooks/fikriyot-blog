const fs = require('fs');
const path = require('path');

const postsFile = path.resolve(__dirname, '../data/posts.json');
const data = JSON.parse(fs.readFileSync(postsFile, 'utf-8'));

console.log('Looking for post 288...\n');

// Find all post 288s
const post288s = data.posts
  .map((p, index) => ({ post: p, index }))
  .filter(item => item.post.postId === 288);

console.log(`Found ${post288s.length} posts with postId 288:\n`);

post288s.forEach((item, i) => {
  const p = item.post;
  console.log(`${i + 1}. Array index: ${item.index}`);
  console.log(`   ID: ${p.id}`);
  console.log(`   Date: ${p.date}`);
  console.log(`   Text: ${p.text?.substring(0, 60)}...`);
  console.log('');
});

// Keep the OLDER one (earlier date), remove the newer one
if (post288s.length > 1) {
  // Sort by date - oldest first
  post288s.sort((a, b) => new Date(a.post.date) - new Date(b.post.date));
  
  const keepThis = post288s[0]; // Oldest
  const removeThis = post288s[1]; // Newest (bugungisi)
  
  console.log(`Keeping: ${keepThis.post.date} (avvalgisi)`);
  console.log(`Removing: ${removeThis.post.date} (bugungisi)\n`);
  
  // Remove the newer one
  data.posts.splice(removeThis.index, 1);
  
  fs.writeFileSync(postsFile, JSON.stringify(data, null, 2), 'utf-8');
  console.log('✅ Bugungisi o\'chirildi, avvalgisi qoldirildi!');
}
