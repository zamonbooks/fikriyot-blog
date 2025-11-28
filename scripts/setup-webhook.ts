/**
 * Telegram Bot webhook'ni sozlash
 * 
 * Ishlatish:
 * npx tsx scripts/setup-webhook.ts <webhook-url>
 * 
 * Misol:
 * npx tsx scripts/setup-webhook.ts https://your-site.netlify.app/.netlify/functions/telegram-webhook
 */

import { Telegraf } from 'telegraf';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;

if (!BOT_TOKEN) {
  console.error('Error: TELEGRAM_BOT_TOKEN must be set');
  process.exit(1);
}

const webhookUrl = process.argv[2];

if (!webhookUrl) {
  console.error('Error: Webhook URL required');
  console.log('\nUsage:');
  console.log('  npx tsx scripts/setup-webhook.ts <webhook-url>');
  console.log('\nExample:');
  console.log('  npx tsx scripts/setup-webhook.ts https://your-site.netlify.app/.netlify/functions/telegram-webhook');
  process.exit(1);
}

async function setupWebhook() {
  const bot = new Telegraf(BOT_TOKEN);

  try {
    console.log('Setting up webhook...');
    console.log(`Webhook URL: ${webhookUrl}`);

    // Webhook o'rnatish
    await bot.telegram.setWebhook(webhookUrl, {
      allowed_updates: ['channel_post', 'edited_channel_post'],
    });

    console.log('✓ Webhook set successfully');

    // Webhook ma'lumotlarini tekshirish
    const info = await bot.telegram.getWebhookInfo();
    console.log('\nWebhook info:');
    console.log(`  URL: ${info.url}`);
    console.log(`  Pending updates: ${info.pending_update_count}`);
    console.log(`  Max connections: ${info.max_connections}`);
    console.log(`  Allowed updates: ${info.allowed_updates?.join(', ') || 'all'}`);

    if (info.last_error_date) {
      console.log(`\n⚠ Last error: ${info.last_error_message}`);
      console.log(`  Date: ${new Date(info.last_error_date * 1000).toISOString()}`);
    }

    console.log('\n✓ Webhook setup completed');
  } catch (error: any) {
    console.error('Error setting up webhook:', error);
    
    if (error.response) {
      console.error('Telegram API error:', error.response);
    }
    
    process.exit(1);
  }
}

// Delete webhook command
if (webhookUrl === 'delete' || webhookUrl === 'remove') {
  (async () => {
    const bot = new Telegraf(BOT_TOKEN);
    
    try {
      console.log('Deleting webhook...');
      await bot.telegram.deleteWebhook();
      console.log('✓ Webhook deleted');
      
      const info = await bot.telegram.getWebhookInfo();
      console.log('\nWebhook info:');
      console.log(`  URL: ${info.url || '(none)'}`);
      
      process.exit(0);
    } catch (error) {
      console.error('Error deleting webhook:', error);
      process.exit(1);
    }
  })();
} else {
  setupWebhook()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}
