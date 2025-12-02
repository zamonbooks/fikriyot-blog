/**
 * Setup Telegram Bot Webhook
 * Run this after deploying to Netlify
 */

import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const BOT_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

async function setupWebhook() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🔗 Telegram Webhook Setup`);
  console.log(`${'='.repeat(60)}\n`);

  // Get webhook URL from user
  console.log('📝 Enter your Netlify site URL (e.g., https://your-site.netlify.app):');
  console.log('   Or press Enter to remove webhook\n');

  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  readline.question('Netlify URL: ', async (siteUrl: string) => {
    readline.close();

    try {
      if (!siteUrl.trim()) {
        // Remove webhook
        console.log('\n🗑️  Removing webhook...');
        
        const response = await axios.post(`${BOT_API}/deleteWebhook`);
        
        if (response.data.ok) {
          console.log('✅ Webhook removed successfully\n');
        } else {
          console.log('❌ Failed to remove webhook:', response.data.description);
        }
        return;
      }

      // Set webhook
      const webhookUrl = `${siteUrl.replace(/\/$/, '')}/.netlify/functions/telegram-webhook`;
      
      console.log(`\n🔗 Setting webhook to: ${webhookUrl}`);

      const response = await axios.post(`${BOT_API}/setWebhook`, {
        url: webhookUrl,
        allowed_updates: ['channel_post', 'edited_channel_post']
      });

      if (response.data.ok) {
        console.log('✅ Webhook set successfully!\n');
        
        // Get webhook info
        const infoResponse = await axios.get(`${BOT_API}/getWebhookInfo`);
        const info = infoResponse.data.result;
        
        console.log('📊 Webhook Info:');
        console.log(`   URL: ${info.url}`);
        console.log(`   Pending updates: ${info.pending_update_count}`);
        console.log(`   Max connections: ${info.max_connections || 40}`);
        
        if (info.last_error_message) {
          console.log(`   ⚠️  Last error: ${info.last_error_message}`);
          console.log(`   Error date: ${new Date(info.last_error_date * 1000).toLocaleString()}`);
        }
        
        console.log('\n✅ Setup complete!');
        console.log('\n📝 Next steps:');
        console.log('   1. Deploy your site to Netlify');
        console.log('   2. Add NETLIFY_BUILD_HOOK to Netlify environment variables');
        console.log('   3. Test by posting in your Telegram channel\n');
        
      } else {
        console.log('❌ Failed to set webhook:', response.data.description);
      }

    } catch (error: any) {
      console.error('❌ Error:', error.response?.data?.description || error.message);
    }
  });
}

setupWebhook();
