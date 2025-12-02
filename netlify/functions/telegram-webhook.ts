/**
 * Netlify Function to handle Telegram webhook
 * Triggers when channel posts are created, edited, or deleted
 */

import type { Handler, HandlerEvent } from '@netlify/functions';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const NETLIFY_BUILD_HOOK = process.env.NETLIFY_BUILD_HOOK!;

interface TelegramUpdate {
  update_id: number;
  channel_post?: any;
  edited_channel_post?: any;
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
