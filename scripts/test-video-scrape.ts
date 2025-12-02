import axios from 'axios';
import * as cheerio from 'cheerio';

async function testVideoScrape() {
  const postId = 285;
  const url = `https://t.me/fikriyot_uz/${postId}`;
  
  console.log(`Fetching: ${url}\n`);
  
  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  });

  const $ = cheerio.load(response.data);
  
  console.log('Video element:', $('video').length);
  console.log('Video source:', $('video source').attr('src'));
  console.log('Video data-src:', $('video').attr('data-src'));
  console.log('Video class:', $('video').attr('class'));
  
  // Check for any video-related elements
  console.log('\nAll video-related attributes:');
  $('video').each((i, el) => {
    console.log('Video element:', $(el).html());
  });
  
  // Check for tgme_widget_message_video
  console.log('\nVideo widget:', $('.tgme_widget_message_video').length);
  console.log('Video wrap:', $('.tgme_widget_message_video_wrap').length);
  
  // Get the video wrap style
  const videoWrapStyle = $('.tgme_widget_message_video_wrap').attr('style');
  console.log('Video wrap style:', videoWrapStyle);
  
  // Try to find video URL in style
  if (videoWrapStyle) {
    const match = videoWrapStyle.match(/url\('([^']+)'\)/);
    if (match) {
      console.log('\nFound video thumbnail:', match[1]);
    }
  }
}

testVideoScrape();
