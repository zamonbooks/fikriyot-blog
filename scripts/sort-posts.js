const fs = require('fs');
const path = require('path');

const postsFile = path.resolve(__dirname, '../data/posts.json');
const data = JSON.parse(fs.readFileSync(postsFile, 'utf-8'));

console.log('Sorting posts by date (newest first)...\n');

// Sort by timestamp descending (newest first)
data.posts.sort((a, b) => b.timestamp - a.timestamp);

console.log('First 5 posts after sorting:');
data.posts.slice(0, 5).forEach((p, i) => {
  console.log(`${i + 1}. Post ${p.postId} - ${p.date}`);
});

fs.writeFileSync(postsFile, JSON.stringify(data, null, 2), 'utf-8');
console.log('\n✅ Posts sorted and saved!');
