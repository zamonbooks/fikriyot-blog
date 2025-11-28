export interface Post {
    id: string;              // Firestore document ID
    channelUsername: string; // Telegram kanal username
    postId: number;          // Telegram post ID
    date: string;            // ISO 8601 format
    timestamp: number;       // Unix timestamp (sorting uchun)
    text?: string;           // Post matni (optional, preview uchun)
    hasMedia: boolean;       // Media borligini ko'rsatish
    createdAt: string;       // Database ga qo'shilgan vaqt
}

export interface PostInput {
    channelUsername: string;
    postId: number;
    date: string;
    timestamp: number;
    text?: string;
    hasMedia: boolean;
}
