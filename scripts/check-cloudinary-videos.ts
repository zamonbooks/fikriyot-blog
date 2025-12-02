/**
 * Check which videos actually exist on Cloudinary
 */

import axios from 'axios';

const VIDEO_IDS = [261, 260, 226, 221, 211, 203, 188, 177, 147, 126, 119, 115, 114, 112, 108, 93, 87, 79, 74, 69, 68, 54, 52, 41];

async function checkVideo(postId: number) {
  // Try different URL patterns
  const patterns = [
    `https://res.cloudinary.com/dg8ryayj8/video/upload/fikriyot/video-${postId}.mp4`,
    `https://res.cloudinary.com/dg8ryayj8/video/upload/v1/fikriyot/video-${postId}.mp4`,
    `https://res.cloudinary.com/dg8ryayj8/video/upload/fikriyot/video-${postId}`,
  ];

  for (const url of patterns) {
    try {
      const response = await axios.head(url, { timeout: 5000 });
      if (response.status === 200) {
        console.log(`✅ Post ${postId}: ${url}`);
        return url;
      }
    } catch (error) {
      // Continue to next pattern
    }
  }

  console.log(`❌ Post ${postId}: Not found`);
  return null;
}

async function main() {
  console.log('🔍 Checking Cloudinary videos...\n');

  const found: { [key: number]: string } = {};

  for (const postId of VIDEO_IDS.slice(0, 5)) { // Test first 5
    const url = await checkVideo(postId);
    if (url) {
      found[postId] = url;
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`\n📊 Found ${Object.keys(found).length} videos`);
  
  if (Object.keys(found).length > 0) {
    console.log('\nWorking URLs:');
    Object.entries(found).forEach(([id, url]) => {
      console.log(`  ${id}: ${url}`);
    });
  }
}

main();
