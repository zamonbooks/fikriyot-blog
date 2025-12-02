const fs = require('fs');
const path = require('path');

const postsFile = path.resolve(__dirname, '../data/posts.json');
const data = JSON.parse(fs.readFileSync(postsFile, 'utf-8'));

// Find post 288 duplicates
const post288s = data.posts.filter(p => p.postId === 288);
console.log(`Found ${post288s.length} posts with postId 288:\n`);

post288s.forEach((p, i) => {
  console.log(`${i + 1}. ID: ${p.id}`);
  console.log(`   Date: ${p.date}`);
  console.log(`   Text: ${p.text?.substring(0, 50)}...`);
  console.log(`   Has Audio: ${p.media?.type === 'audio'}`);
  console.log('');
});

// Remove duplicates - keep only the one with audio
if (post288s.length > 1) {
  console.log('Removing duplicates...');
  
  // Keep the one with audio
  const withAudio = post288s.find(p => p.media?.type === 'audio');
  
  // Remove all post 288s
  data.posts = data.posts.filter(p => p.postId !== 288);
  
  // Add back the one with audio
  if (withAudio) {
    data.posts.unshift(withAudio);
  }
  
  fs.writeFileSync(postsFile, JSON.stringify(data, null, 2), 'utf-8');
  console.log('✅ Duplicates removed! Kept the one with audio.');
}
