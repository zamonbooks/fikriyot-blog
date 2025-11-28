import { PostInput } from '@/types/post';

/**
 * Post ma'lumotlarini validate qilish
 */
export function validatePost(post: any): post is PostInput {
  if (!post) {
    return false;
  }

  // Required fields
  if (typeof post.channelUsername !== 'string' || !post.channelUsername) {
    console.error('Invalid channelUsername');
    return false;
  }

  if (typeof post.postId !== 'number' || post.postId <= 0) {
    console.error('Invalid postId');
    return false;
  }

  if (typeof post.date !== 'string' || !post.date) {
    console.error('Invalid date');
    return false;
  }

  if (typeof post.timestamp !== 'number' || post.timestamp <= 0) {
    console.error('Invalid timestamp');
    return false;
  }

  if (typeof post.hasMedia !== 'boolean') {
    console.error('Invalid hasMedia');
    return false;
  }

  // Optional fields
  if (post.text !== undefined && typeof post.text !== 'string') {
    console.error('Invalid text');
    return false;
  }

  return true;
}

/**
 * Telegram API response'ni Post model'ga transform qilish
 */
export function transformTelegramPost(
  telegramPost: any,
  channelUsername: string
): PostInput | null {
  try {
    // Telegram message object'dan kerakli ma'lumotlarni olish
    const postId = telegramPost.message_id;
    const date = new Date(telegramPost.date * 1000).toISOString();
    const timestamp = telegramPost.date;
    const text = telegramPost.text || telegramPost.caption || '';
    
    // Media borligini tekshirish
    const hasMedia = !!(
      telegramPost.photo ||
      telegramPost.video ||
      telegramPost.document ||
      telegramPost.audio ||
      telegramPost.voice ||
      telegramPost.animation ||
      telegramPost.sticker
    );

    const post: PostInput = {
      channelUsername,
      postId,
      date,
      timestamp,
      text,
      hasMedia,
    };

    // Validate
    if (!validatePost(post)) {
      console.error('Post validation failed:', post);
      return null;
    }

    return post;
  } catch (error) {
    console.error('Error transforming Telegram post:', error);
    return null;
  }
}

/**
 * Telegram webhook update'ni transform qilish
 */
export function transformWebhookUpdate(
  update: any,
  channelUsername: string
): PostInput | null {
  try {
    // Channel post yoki edited channel post
    const post = update.channel_post || update.edited_channel_post;
    
    if (!post) {
      console.error('No channel post in update');
      return null;
    }

    return transformTelegramPost(post, channelUsername);
  } catch (error) {
    console.error('Error transforming webhook update:', error);
    return null;
  }
}

/**
 * Batch postlarni validate qilish
 */
export function validatePosts(posts: any[]): PostInput[] {
  const validPosts: PostInput[] = [];

  for (const post of posts) {
    if (validatePost(post)) {
      validPosts.push(post);
    }
  }

  return validPosts;
}
