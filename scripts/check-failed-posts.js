const data = require('../data/posts.json');

const failed = [285, 260, 243, 221, 203, 131, 127, 126, 112, 99, 94, 93, 90];

console.log('Checking failed video posts:\n');

failed.forEach(id => {
    const post = data.posts.find(p => p.postId === id);
    if (post) {
        console.log(`Post ${id}:`);
        console.log(`  Media type: ${post.media?.type}`);
        console.log(`  Media URL: ${post.media?.url?.substring(0, 80)}`);
        console.log(`  Has cloudinaryUrl: ${!!post.media?.cloudinaryUrl}`);
        console.log('');
    } else {
        console.log(`Post ${id}: NOT FOUND\n`);
    }
});
