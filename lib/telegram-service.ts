import { Telegraf } from 'telegraf';
import { PostInput } from '@/types/post';
import { RateLimiter, retryWithBackoff } from './rate-limiter';

export class TelegramService {
  private bot: Telegraf;
  private channelUsername: string;
  private rateLimiter: RateLimiter;

  constructor(botToken: string, channelUsername: string) {
    this.bot = new Telegraf(botToken);
    this.channelUsername = channelUsername;
    this.rateLimiter = new RateLimiter(20); // 20 requests/second
  }

  /**
   * Telegram kanalidan postlarni olish (initial sync uchun)
   */
  async fetchChannelPosts(limit: number = 100, offsetId?: number): Promise<PostInput[]> {
    return retryWithBackoff(async () => {
      return this.rateLimiter.schedule(async () => {
        try {
          const posts: PostInput[] = [];
          
          // Telegram Bot API orqali kanal postlarini olish
          // Note: Bot kanalda admin bo'lishi kerak
          const chat = await this.bot.telegram.getChat(`@${this.channelUsername}`);
          
          // Hozircha oddiy implementatsiya
          // Keyinchalik getUpdates yoki boshqa metodlardan foydalanish mumkin
          
          return posts;
        } catch (error: any) {
          console.error('Error fetching channel posts:', error);
          
          // Telegram API error kodlarini handle qilish
          if (error.response?.error_code === 429) {
            // Too Many Requests
            const retryAfter = error.response.parameters?.retry_after || 60;
            console.log(`Rate limited. Retry after ${retryAfter} seconds`);
            throw new Error(`RATE_LIMITED:${retryAfter}`);
          }
          
          throw error;
        }
      });
    }, 3, 2000);
  }

  /**
   * Webhook sozlash
   */
  async setWebhook(webhookUrl: string): Promise<boolean> {
    return retryWithBackoff(async () => {
      return this.rateLimiter.schedule(async () => {
        try {
          await this.bot.telegram.setWebhook(webhookUrl);
          console.log(`Webhook set to: ${webhookUrl}`);
          return true;
        } catch (error) {
          console.error('Error setting webhook:', error);
          throw error;
        }
      });
    });
  }

  /**
   * Webhook o'chirish
   */
  async deleteWebhook(): Promise<boolean> {
    try {
      await this.bot.telegram.deleteWebhook();
      console.log('Webhook deleted');
      return true;
    } catch (error) {
      console.error('Error deleting webhook:', error);
      throw error;
    }
  }

  /**
   * Webhook ma'lumotlarini olish
   */
  async getWebhookInfo() {
    try {
      const info = await this.bot.telegram.getWebhookInfo();
      return info;
    } catch (error) {
      console.error('Error getting webhook info:', error);
      throw error;
    }
  }

  /**
   * Webhook request'ni validate qilish
   */
  validateWebhookRequest(token: string): boolean {
    // Telegram webhook secret token'ni tekshirish
    const expectedToken = process.env.TELEGRAM_BOT_TOKEN;
    return token === expectedToken;
  }

  /**
   * Bot ma'lumotlarini olish
   */
  async getBotInfo() {
    return retryWithBackoff(async () => {
      return this.rateLimiter.schedule(async () => {
        try {
          const me = await this.bot.telegram.getMe();
          return me;
        } catch (error) {
          console.error('Error getting bot info:', error);
          throw error;
        }
      });
    });
  }
}

// Singleton instance
let telegramService: TelegramService | null = null;

export function getTelegramService(): TelegramService {
  if (!telegramService) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const channelUsername = process.env.TELEGRAM_CHANNEL_USERNAME;

    if (!botToken || !channelUsername) {
      throw new Error('TELEGRAM_BOT_TOKEN and TELEGRAM_CHANNEL_USERNAME must be set');
    }

    telegramService = new TelegramService(botToken, channelUsername);
  }

  return telegramService;
}
