const fs = require('fs');
const path = require('path');

const postsFile = path.resolve(__dirname, '../data/posts.json');
const data = JSON.parse(fs.readFileSync(postsFile, 'utf-8'));

const withoutMedia = data.posts.filter(p => !p.hasMedia);
console.log('Posts without media:', withoutMedia.length);

console.log('\nFirst 10 posts without media:');
withoutMedia.slice(0, 10).forEach(p => {
  console.log(`\nPost ${p.postId}:`);
  console.log(`  Date: ${p.date}`);
  console.log(`  Text: ${p.text?.substring(0, 60) || '(empty)'}...`);
  console.log(`  Forwarded: ${p.forwardedFrom || 'No'}`);
});
