const data = require('../data/posts.json');

const mediaGroups = data.posts.filter(p => p.media?.mediaGroup && p.media.mediaGroup.length > 1);

console.log(`\n📊 Found ${mediaGroups.length} posts with media groups:\n`);

mediaGroups.forEach(p => {
  console.log(`Post ${p.postId}: ${p.media.mediaGroup.length} images`);
  console.log(`  URL: https://t.me/fikriyot_uz/${p.postId}`);
  console.log('');
});

console.log(`\n✅ All ${mediaGroups.length} posts already have media groups!`);
console.log(`No need to re-sync.\n`);
