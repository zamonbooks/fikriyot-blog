/**
 * Fetch posts from Telegram RSS feed
 * RSS URL: https://t.me/s/{channel_username}
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { PostInput, MessageEntity } from '../types/post';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const CHANNEL_USERNAME = process.env.TELEGRAM_CHANNEL_USERNAME!;
const OUTPUT_FILE = path.resolve(process.cwd(), 'data/posts.json');

interface ScrapedPost {
  postId: number;
  date: Date;
  text: string;
  hasMedia: boolean;
  mediaUrl?: string;
  mediaType?: 'photo' | 'video';
  mediaGroup?: string[];
  views?: number;
  forwardedFrom?: string;
  forwardedFromUrl?: string;
}

async function fetchFromWeb(beforePostId?: number): Promise<ScrapedPost[]> {
  const url = beforePostId 
    ? `https://t.me/s/${CHANNEL_USERNAME}?before=${beforePostId}`
    : `https://t.me/s/${CHANNEL_USERNAME}`;
  
  console.log(`Fetching: ${url}`);
  
  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  });

  const $ = cheerio.load(response.data);
  const posts: ScrapedPost[] = [];

  $('.tgme_widget_message').each((_, element) => {
    const $post = $(element);
    
    // Post ID
    const dataPost = $post.attr('data-post');
    if (!dataPost) return;
    
    const postId = parseInt(dataPost.split('/')[1]);
    
    // Skip deleted posts (they have "deleted" class or no content)
    if ($post.hasClass('deleted') || $post.find('.tgme_widget_message_text').length === 0) {
      console.log(`Skipping deleted post: ${postId}`);
      return;
    }
    
    // Date
    const dateStr = $post.find('.tgme_widget_message_date time').attr('datetime');
    if (!dateStr) return;
    const date = new Date(dateStr);
    
    // Text - preserve line breaks and formatting
    const textElement = $post.find('.tgme_widget_message_text');
    let text = '';
    
    if (textElement.length > 0) {
      // Get HTML and convert <br> to newlines
      const html = textElement.html() || '';
      text = html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/div>/gi, '\n')
        .replace(/<div[^>]*>/gi, '')
        .replace(/<[^>]+>/g, '') // Remove other HTML tags
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .trim();
    }
    
    // Forward info
    let forwardedFrom: string | undefined;
    let forwardedFromUrl: string | undefined;
    const forwardedHeader = $post.find('.tgme_widget_message_forwarded_from');
    if (forwardedHeader.length > 0) {
      forwardedFrom = forwardedHeader.text().trim();
      const forwardLink = forwardedHeader.find('a').attr('href');
      if (forwardLink) forwardedFromUrl = forwardLink;
    }
    
    // Media
    const hasPhoto = $post.find('.tgme_widget_message_photo_wrap').length > 0;
    const hasVideo = $post.find('.tgme_widget_message_video_wrap').length > 0;
    const hasMedia = hasPhoto || hasVideo;
    
    let mediaUrl: string | undefined;
    let mediaType: 'photo' | 'video' | undefined;
    let mediaGroup: string[] | undefined;
    
    if (hasPhoto) {
      // Check for media group (multiple images)
      const photoWraps = $post.find('.tgme_widget_message_photo_wrap');
      
      if (photoWraps.length > 1) {
        // Media group - collect all images
        mediaGroup = [];
        photoWraps.each((_, el) => {
          const style = $(el).attr('style');
          const match = style?.match(/url\('([^']+)'\)/);
          if (match) {
            mediaGroup!.push(match[1]);
          }
        });
        
        // First image as main URL
        if (mediaGroup.length > 0) {
          mediaUrl = mediaGroup[0];
          mediaType = 'photo';
        }
      } else {
        // Single image
        const style = photoWraps.first().attr('style');
        const match = style?.match(/url\('([^']+)'\)/);
        if (match) {
          mediaUrl = match[1];
          mediaType = 'photo';
        }
      }
    } else if (hasVideo) {
      const videoThumb = $post.find('.tgme_widget_message_video_thumb').attr('style');
      const match = videoThumb?.match(/url\('([^']+)'\)/);
      if (match) {
        mediaUrl = match[1];
        mediaType = 'video';
      }
    }
    
    // Views
    const viewsText = $post.find('.tgme_widget_message_views').text().trim();
    const views = viewsText ? parseViews(viewsText) : undefined;
    
    posts.push({
      postId,
      date,
      text,
      hasMedia,
      mediaUrl,
      mediaType,
      mediaGroup,
      views,
      forwardedFrom,
      forwardedFromUrl,
    });
  });

  return posts;
}

function parseViews(text: string): number {
  text = text.toLowerCase().replace(/\s/g, '');
  if (text.endsWith('k')) {
    return Math.round(parseFloat(text) * 1000);
  } else if (text.endsWith('m')) {
    return Math.round(parseFloat(text) * 1000000);
  }
  return parseInt(text) || 0;
}

async function fetchAllPosts() {
  console.log('Fetching all posts from Telegram web...\n');
  console.log(`Channel: @${CHANNEL_USERNAME}`);
  console.log('');

  const allPosts: ScrapedPost[] = [];
  let beforePostId: number | undefined;
  let page = 1;
  const maxPages = 200; // Increased limit for more posts

  try {
    while (page <= maxPages) {
      console.log(`\nPage ${page}:`);
      const posts = await fetchFromWeb(beforePostId);
      
      if (posts.length === 0) {
        console.log('No more posts found');
        break;
      }

      console.log(`Found ${posts.length} posts`);
      allPosts.push(...posts);

      // Get the oldest post ID for next page
      const oldestPost = posts[posts.length - 1];
      beforePostId = oldestPost.postId;
      
      console.log(`Oldest post ID: ${beforePostId}`);
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      page++;
    }

    console.log(`\n\nTotal posts fetched: ${allPosts.length}`);

    // Transform to PostInput format
    const transformedPosts: PostInput[] = allPosts.map(post => ({
      channelUsername: CHANNEL_USERNAME,
      postId: post.postId,
      date: post.date.toISOString(),
      timestamp: Math.floor(post.date.getTime() / 1000),
      text: post.text,
      entities: undefined, // We'll need to parse HTML for entities
      media: post.mediaUrl ? {
        type: post.mediaType || 'photo',
        url: post.mediaUrl,
        mediaGroup: post.mediaGroup,
      } : undefined,
      views: post.views,
      hasMedia: post.hasMedia,
      forwardedFrom: post.forwardedFrom,
      forwardedFromUrl: post.forwardedFromUrl,
    }));

    // Remove duplicates by postId
    const uniquePosts = Array.from(
      new Map(transformedPosts.map(post => [post.postId, post])).values()
    );

    // Sort by timestamp (newest first)
    uniquePosts.sort((a, b) => b.timestamp - a.timestamp);

    // Add IDs using postId to ensure uniqueness
    const postsWithIds = uniquePosts.map(post => ({
      id: `post-${post.postId}`,
      ...post,
      createdAt: post.date,
    }));

    // Save to file
    const output = {
      posts: postsWithIds,
      lastSync: new Date().toISOString(),
    };

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf-8');

    console.log(`\nSaved ${postsWithIds.length} posts to ${OUTPUT_FILE}`);
    console.log('Sync completed!');

  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

fetchAllPosts();
