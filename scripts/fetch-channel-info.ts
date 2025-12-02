/**
 * Fetch channel information from Telegram and save to Firebase
 */

import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Initialize Firebase with client SDK
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

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHANNEL_USERNAME = process.env.TELEGRAM_CHANNEL_USERNAME;

interface ChannelInfo {
  id: number;
  title: string;
  username: string;
  description?: string;
  photo?: string;
  memberCount?: number;
  lastUpdated: string;
}

async function fetchChannelInfo() {
  if (!BOT_TOKEN) {
    console.error('❌ TELEGRAM_BOT_TOKEN not found in .env.local');
    return;
  }

  if (!CHANNEL_USERNAME) {
    console.error('❌ TELEGRAM_CHANNEL_USERNAME not found in .env.local');
    return;
  }

  console.log('📡 Fetching channel info from Telegram...\n');
  console.log(`Channel: @${CHANNEL_USERNAME}`);

  try {
    // Get channel info using getChat API
    const response = await axios.get(
      `https://api.telegram.org/bot${BOT_TOKEN}/getChat`,
      {
        params: {
          chat_id: `@${CHANNEL_USERNAME}`,
        },
      }
    );

    if (!response.data.ok) {
      console.error('❌ Failed to fetch channel info:', response.data.description);
      return;
    }

    const chat = response.data.result;

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

    // Get channel photo if available
    if (chat.photo) {
      try {
        const photoResponse = await axios.get(
          `https://api.telegram.org/bot${BOT_TOKEN}/getFile`,
          {
            params: {
              file_id: chat.photo.big_file_id,
            },
          }
        );

        if (photoResponse.data.ok) {
          const filePath = photoResponse.data.result.file_path;
          channelInfo.photo = `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`;
        }
      } catch (error) {
        console.log('⚠️  Could not fetch channel photo');
      }
    }

    // Save to Firebase
    try {
      const docRef = doc(db, 'channelInfo', 'info');
      await setDoc(docRef, channelInfo);
      
      console.log('\n✅ Channel info saved to Firebase successfully!\n');
      console.log('📋 Channel Info:');
      console.log(`   Title: ${channelInfo.title}`);
      console.log(`   Username: @${channelInfo.username}`);
      console.log(`   Description: ${channelInfo.description || 'N/A'}`);
      console.log(`   Members: ${channelInfo.memberCount || 'N/A'}`);
      console.log(`\n💾 Saved to: Firestore > channelInfo/info`);
    } catch (firebaseError: any) {
      console.error('❌ Error saving to Firebase:', firebaseError.message);
      throw firebaseError;
    }

  } catch (error: any) {
    console.error('❌ Error:', error.response?.data?.description || error.message);
  }
}

fetchChannelInfo();
