const data = require('../data/posts.json');

const videoPosts = data.posts.filter(p => p.media?.type === 'video');

console.log('Video Posts Status:\n');
console.log(`Total video posts: ${videoPosts.length}\n`);

const withCloudinary = videoPosts.filter(p => p.media.cloudinaryUrl);
const withoutCloudinary = videoPosts.filter(p => !p.media.cloudinaryUrl);

console.log('✅ With Cloudinary URL:');
withCloudinary.forEach(p => {
    console.log(`  - Post ${p.postId}: ${p.media.cloudinaryUrl?.substring(0, 60)}...`);
});

console.log(`\n❌ Without Cloudinary URL (${withoutCloudinary.length}):`);
withoutCloudinary.forEach(p => {
    console.log(`  - Post ${p.postId}: ${p.media.url?.substring(0, 60)}...`);
});
