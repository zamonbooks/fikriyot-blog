import { collection, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { ChannelInfo } from '@/types/channel';

// Default fallback values
const DEFAULT_CHANNEL_INFO: ChannelInfo = {
  id: 0,
  title: 'Fikriyot',
  username: 'fikriyot_uz',
  description: 'Telegram kanalining rasmiy veb-sayti',
  lastUpdated: new Date().toISOString(),
};

export class ChannelService {
  private collectionName = 'channelInfo';
  private documentId = 'info';

  /**
   * Get channel information from Firestore
   * Returns default values if data is unavailable
   */
  async getChannelInfo(): Promise<ChannelInfo> {
    try {
      const docRef = doc(db, this.collectionName, this.documentId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as ChannelInfo;
        
        // Merge with defaults in case some fields are missing
        return {
          ...DEFAULT_CHANNEL_INFO,
          ...data,
        };
      } else {
        console.warn('Channel info document not found, using defaults');
        return DEFAULT_CHANNEL_INFO;
      }
    } catch (error) {
      console.error('Error getting channel info:', error);
      console.warn('Using default channel info due to error');
      return DEFAULT_CHANNEL_INFO;
    }
  }

  /**
   * Save channel information to Firestore
   * Used by the fetch-channel-info script
   */
  async saveChannelInfo(info: ChannelInfo): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, this.documentId);
      await setDoc(docRef, info);
      console.log('Channel info saved successfully');
    } catch (error) {
      console.error('Error saving channel info:', error);
      throw error;
    }
  }
}

// Singleton instance
let channelServiceInstance: ChannelService | null = null;

export function getChannelService(): ChannelService {
  if (!channelServiceInstance) {
    channelServiceInstance = new ChannelService();
  }
  return channelServiceInstance;
}

// Export default instance for convenience
export const channelService = new ChannelService();
