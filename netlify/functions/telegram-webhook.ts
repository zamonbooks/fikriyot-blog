import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Firebase Admin SDK initialization
if (!getApps().length) {
  initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

const db = getFirestore();

interface TelegramUpdate {
  update_id: number;
  channel_post?: any;
  edited_channel_post?: any;
  deleted_channel_post?: any;
}

/**
 * Telegram Webhook handler
 * URL: /.netlify/functions/telegram-webhook
 */
export const handler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
) => {
  // Faqat POST requestlarni qabul qilish
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Request body'ni parse qilish
    const update: TelegramUpdate = JSON.parse(event.body || '{}');
    
    // Telegram webhook signature'ni tekshirish
    const token = event.headers['x-telegram-bot-api-secret-token'];
    const expectedToken = process.env.TELEGRAM_BOT_TOKEN;

    if (token !== expectedToken) {
      console.error('Invalid webhook token');
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Forbidden' }),
      };
    }

    console.log('Received webhook update:', update.update_id);

    const channelUsername = process.env.TELEGRAM_CHANNEL_USERNAME || 'fikriyot';

    // Yangi post
    if (update.channel_post) {
      await handleNewPost(update.channel_post, channelUsername);
    }

    // Post tahrirlangan
    if (update.edited_channel_post) {
      await handleEditedPost(update.edited_channel_post, channelUsername);
    }

    // Post o'chirilgan (Telegram API bu eventni bermaydi, lekin handle qilamiz)
    if (update.deleted_channel_post) {
      await handleDeletedPost(update.deleted_channel_post, channelUsername);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true }),
    };
  } catch (error: any) {
    console.error('Error handling webhook:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
    };
  }
};

async function handleNewPost(post: any, channelUsername: string) {
  try {
    const postId = post.message_id;
    const date = new Date(post.date * 1000).toISOString();
    const timestamp = post.date;
    const text = post.text || post.caption || '';
    
    const hasMedia = !!(
      post.photo ||
      post.video ||
      post.document ||
      post.audio ||
      post.voice ||
      post.animation ||
      post.sticker
    );

    // Duplicate check
    const existingPost = await db
      .collection('posts')
      .where('channelUsername', '==', channelUsername)
      .where('postId', '==', postId)
      .limit(1)
      .get();

    if (!existingPost.empty) {
      console.log(`Post already exists: ${channelUsername}/${postId}`);
      return;
    }

    // Firestore'ga qo'shish
    await db.collection('posts').add({
      channelUsername,
      postId,
      date,
      timestamp,
      text,
      hasMedia,
      createdAt: new Date().toISOString(),
    });

    console.log(`✓ New post added: ${channelUsername}/${postId}`);
  } catch (error) {
    console.error('Error handling new post:', error);
    throw error;
  }
}

async function handleEditedPost(post: any, channelUsername: string) {
  try {
    const postId = post.message_id;
    
    // Post'ni topish
    const snapshot = await db
      .collection('posts')
      .where('channelUsername', '==', channelUsername)
      .where('postId', '==', postId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      console.log(`Post not found for edit: ${channelUsername}/${postId}`);
      // Yangi post sifatida qo'shish
      await handleNewPost(post, channelUsername);
      return;
    }

    // Post'ni yangilash
    const docId = snapshot.docs[0].id;
    const text = post.text || post.caption || '';
    
    await db.collection('posts').doc(docId).update({
      text,
      updatedAt: new Date().toISOString(),
    });

    console.log(`✓ Post updated: ${channelUsername}/${postId}`);
  } catch (error) {
    console.error('Error handling edited post:', error);
    throw error;
  }
}

async function handleDeletedPost(post: any, channelUsername: string) {
  try {
    const postId = post.message_id;
    
    // Post'ni topish va o'chirish
    const snapshot = await db
      .collection('posts')
      .where('channelUsername', '==', channelUsername)
      .where('postId', '==', postId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      console.log(`Post not found for deletion: ${channelUsername}/${postId}`);
      return;
    }

    const docId = snapshot.docs[0].id;
    await db.collection('posts').doc(docId).delete();

    console.log(`✓ Post deleted: ${channelUsername}/${postId}`);
  } catch (error) {
    console.error('Error handling deleted post:', error);
    throw error;
  }
}
