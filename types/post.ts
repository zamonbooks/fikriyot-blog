export interface Post {
    id: string;              // Firestore document ID
    channelUsername: string; // Telegram kanal username
    postId: number;          // Telegram post ID
    date: string;            // ISO 8601 format
    timestamp: number;       // Unix timestamp (sorting uchun)
    text?: string;           // Post matni (to'liq text)
    entities?: MessageEntity[]; // Text formatting entities
    media?: MediaContent;    // Media content (photo, video, etc.)
    views?: number;          // Post ko'rishlar soni
    hasMedia: boolean;       // Media borligini ko'rsatish
    forwardedFrom?: string;  // Uzatilgan kanal nomi
    forwardedFromUrl?: string; // Uzatilgan kanal URL
    createdAt: string;       // Database ga qo'shilgan vaqt
}

export interface PostInput {
    channelUsername: string;
    postId: number;
    date: string;
    timestamp: number;
    text?: string;
    entities?: MessageEntity[];
    media?: MediaContent;
    views?: number;
    hasMedia: boolean;
    forwardedFrom?: string;
    forwardedFromUrl?: string;
}

export interface MessageEntity {
    type: 'bold' | 'italic' | 'code' | 'pre' | 'text_link' | 'mention' | 'hashtag' | 'url' | 'underline' | 'strikethrough' | 'spoiler';
    offset: number;
    length: number;
    url?: string;           // for text_link
    language?: string;      // for pre (code block)
}

export interface MediaContent {
    type: 'photo' | 'video' | 'document' | 'animation' | 'voice' | 'audio';
    url: string;
    videoUrl?: string;      // Actual video file URL
    thumbnailUrl?: string;
    width?: number;
    height?: number;
    fileSize?: number;
    mimeType?: string;
    duration?: number;      // video/audio uchun (seconds)
    fileName?: string;      // document uchun
    caption?: string;
    mediaGroup?: string[];  // Multiple images/videos (media group)
}
