const fs = require('fs');
const path = require('path');

const postsFile = path.resolve(__dirname, '../data/posts.json');
const data = JSON.parse(fs.readFileSync(postsFile, 'utf-8'));

console.log('Fixing post 288 position...\n');

// Find post 288
const post288Index = data.posts.findIndex(p => p.postId === 288);
const post288 = data.posts[post288Index];

console.log('Current position:', post288Index);
console.log('Post 288 date:', post288.date);

// Find where it should be (after post 289, before post 287)
const post289Index = data.posts.findIndex(p => p.postId === 289);
const post287Index = data.posts.findIndex(p => p.postId === 287);

console.log('Post 289 at index:', post289Index);
console.log('Post 287 at index:', post287Index);

// Remove post 288 from current position
data.posts.splice(post288Index, 1);

// Insert after post 289 (which should be before post 287)
const insertIndex = post287Index; // Insert before 287
data.posts.splice(insertIndex, 0, post288);

console.log('\nNew position:', insertIndex);
console.log('\nPosts around 288:');
data.posts.slice(insertIndex - 2, insertIndex + 3).forEach((p, i) => {
  const actualIndex = insertIndex - 2 + i;
  console.log(`  ${actualIndex}. Post ${p.postId} - ${p.date}`);
});

fs.writeFileSync(postsFile, JSON.stringify(data, null, 2), 'utf-8');
console.log('\n✅ Post 288 moved to correct position!');
