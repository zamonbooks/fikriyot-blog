export interface ChannelInfo {
  id: number;              // Telegram channel ID
  title: string;           // Channel title/name
  username: string;        // Channel username (without @)
  description?: string;    // Channel bio/description
  photo?: string;          // Channel photo URL
  memberCount?: number;    // Number of subscribers
  lastUpdated: string;     // ISO 8601 format - last time info was fetched
}
