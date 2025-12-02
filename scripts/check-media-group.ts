/**
 * Check if a post has media group (multiple images)
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const CHANNEL_USERNAME = process.env.TELEGRAM_CHANNEL_USERNAME!;

async function checkMediaGroup(postId: number) {
  console.log(`\n🔍 Checking post ${postId} for media group...\n`);

  const url = `https://t.me/s/${CHANNEL_USERNAME}/${postId}`;
  
  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  });

  const $ = cheerio.load(response.data);
  
  // Find all images in the post
  const images: string[] = [];
  
  $('.tgme_widget_message_photo_wrap').each((_, el) => {
    const style = $(el).attr('style');
    if (style) {
      const match = style.match(/background-image:url\('([^']+)'\)/);
      if (match) {
        images.push(match[1]);
      }
    }
  });

  // Also check for grouped media
  $('.tgme_widget_message_grouped_wrap .tgme_widget_message_photo_wrap').each((_, el) => {
    const style = $(el).attr('style');
    if (style) {
      const match = style.match(/background-image:url\('([^']+)'\)/);
      if (match && !images.includes(match[1])) {
        images.push(match[1]);
      }
    }
  });

  console.log(`📊 Found ${images.length} image(s):\n`);
  
  images.forEach((img, i) => {
    console.log(`${i + 1}. ${img.substring(0, 80)}...`);
  });

  if (images.length > 1) {
    console.log(`\n✅ This is a media group with ${images.length} images!`);
  } else if (images.length === 1) {
    console.log(`\n⚠️  Only 1 image found (not a media group)`);
  } else {
    console.log(`\n❌ No images found`);
  }
}

// Check post 231
checkMediaGroup(231);
