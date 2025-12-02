/**
 * Netlify Function to handle Telegram webhook
 * Triggers when channel posts are created, edited, or deleted
 * Also updates channel info (bio, title, etc.)
 */

import type { Handler, HandlerEvent } from '@netlify/functions';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const NETLIFY_BUILD_HOOK = process.env.NETLIFY_BUILD_HOOK!;

// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

interface TelegramUpdate {
  update_id: number;
  channel_post?: any;
  edited_channel_post?: any;
}

interface ChannelInfo {
  id: number;
  title: string;
  username: string;
  description?: string;
  photo?: string;
  memberCount?: number;
  lastUpdated: string;
}

/**
 * Fetch and update channel info from Telegram
 */
async function updateChannelInfo(channelUsername: string): Promise<void> {
  try {
    console.log('📡 Fetching channel info from Telegram...');
    
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getChat?chat_id=@${channelUsername}`
    );
    
    const data = await response.json();
    
    if (!data.ok) {
      console.error('❌ Failed to fetch channel info:', data.description);
      return;
    }
    
    const chat = data.result;
    
    const channelInfo: ChannelInfo = {
      id: chat.id,
      title: chat.title,
      username: chat.username,
      description: chat.description || chat.bio,
      lastUpdated: new Date().toISOString(),
    };
    
    // Add optional fields only if they exist
    if (chat.member_count !== undefined) {
      channelInfo.memberCount = chat.member_count;
    }
    
    // Save to Firebase
    const docRef = doc(db, 'channelInfo', 'info');
    await setDoc(docRef, channelInfo);
    
    console.log('✅ Channel info updated successfully');
    console.log(`   Title: ${channelInfo.title}`);
    console.log(`   Description: ${channelInfo.description || 'N/A'}`);
  } catch (error: any) {
    console.error('❌ Error updating channel info:', error.message);
  }
}

const handler: Handler = async (event: HandlerEvent) => {
  // Only accept POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const update: TelegramUpdate = JSON.parse(event.body || '{}');

    console.log('📥 Received Telegram update:', update.update_id);

    // Check if it's a channel post update
    const isChannelUpdate = update.channel_post || update.edited_channel_post;

    if (!isChannelUpdate) {
      console.log('⏭️  Not a channel update, skipping');
      return {
        statusCode: 200,
        body: JSON.stringify({ ok: true, message: 'Not a channel update' })
      };
    }

    const post = update.channel_post || update.edited_channel_post;
    const action = update.channel_post ? 'created' : 'edited';

    console.log(`📝 Channel post ${action}: ${post.message_id}`);
    console.log(`📢 Text: ${post.text?.substring(0, 50) || 'No text'}...`);

    // Update channel info (bio, title, etc.) whenever a post comes in
    const channelUsername = post.sender_chat?.username || post.chat?.username;
    if (channelUsername) {
      await updateChannelInfo(channelUsername);
    }

    // NOTE: Webhook can't directly modify posts.json in the repo
    // Instead, it triggers a rebuild which will run the scraper during build
    // The scraper (auto-scraper.ts) will fetch and parse the new post

    // Trigger Netlify rebuild
    if (NETLIFY_BUILD_HOOK) {
      console.log('🔨 Triggering Netlify rebuild...');

      const response = await fetch(NETLIFY_BUILD_HOOK, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          trigger_title: `Telegram Update: Post ${post.message_id} ${action}`
        })
      });

      if (response.ok) {
        console.log('✅ Rebuild triggered - new post will be scraped during build');
      } else {
        console.error('❌ Failed to trigger rebuild:', response.statusText);
      }
    } else {
      console.warn('⚠️  NETLIFY_BUILD_HOOK not configured');
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        message: `Channel post ${action}, rebuild triggered`,
        post_id: post.message_id
      })
    };

  } catch (error: any) {
    console.error('❌ Error processing webhook:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        ok: false,
        error: error.message
      })
    };
  }
};

export { handler };
