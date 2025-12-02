# Fikriyot Telegram Blog

Professional blog platformasi - Telegram kanalining postlarini veb-saytda ko'rsatish uchun.

## Features

✅ **Custom Post Rendering** - Telegram Widget o'rniga, o'zimizning chiroyli card komponentimiz  
✅ **Rich Text Formatting** - Bold, italic, links, code blocks, mentions, hashtags  
✅ **Media Support** - Rasmlar, videolar, dokumentlar  
✅ **Responsive Design** - Mobil va desktop uchun optimallashtirilgan  
✅ **SEO Friendly** - Server-side rendering bilan  
✅ **Performance** - Next.js Image optimization, lazy loading  

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Telegram Bot API, Telegraf
- **Deployment**: Netlify (ready)
- **Database**: JSON file (simple) yoki Firestore (advanced)

## Setup

### 1. Environment Variables

`.env.local` faylini yarating:

```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHANNEL_USERNAME=fikriyot_uz

# Development Settings
NEXT_PUBLIC_USE_SAMPLE_DATA=false
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Sync Posts

**Barcha postlarni olish (tavsiya etiladi):**

```bash
npm run sync
```

Bu script:
- Telegram Web'dan scraping qiladi (https://t.me/s/channel)
- **Barcha** postlarni oladi (limitatsiya yo'q)
- O'chirilgan postlarni avtomatik skip qiladi
- Text, media URL, views'ni saqlaydi
- `data/posts.json` fayliga yozadi

**Faqat yangi postlarni olish (tez):**

```bash
npm run sync:quick
```

Bu script:
- Telegram Bot API orqali oxirgi 100 ta postni oladi
- Text, entities, media'ni to'liq oladi
- Tezroq ishlaydi, lekin faqat yangi postlar

### 4. Run Development Server

```bash
npm run dev
```

Sayt: http://localhost:3000

## Scripts

- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run start` - Production server
- `npm run sync` - Sync ALL posts from Telegram (web scraping)
- `npm run sync:quick` - Sync only recent posts (Bot API)
- `npm run upload-media` - Upload media to Cloudinary (optional)
- `npm run test-fetch` - Test Telegram API connection
- `npm run check-channel` - Check channel info

## Media Storage Options

### Option 1: Telegram CDN (Default)
✅ No setup required  
✅ Free  
⚠️ Depends on Telegram servers  

### Option 2: Cloudinary (Recommended for production)
✅ Reliable and fast  
✅ Image optimization  
✅ 25GB/month free tier  

**Setup Cloudinary:**
1. Sign up at https://cloudinary.com
2. Add to `.env.local`:
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```
3. Create upload preset "fikriyot" in dashboard
4. Run: `npm run upload-media`

## Project Structure

```
fikriyot-blog/
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── PostCard.tsx      # Post card component
│   └── PostList.tsx      # Posts list component
├── lib/                   # Utilities
│   ├── telegram-service.ts    # Telegram API service
│   ├── json-service.ts        # JSON data service
│   └── text-formatter.tsx     # Text formatting utility
├── types/                 # TypeScript types
│   └── post.ts           # Post types
├── data/                  # Data files
│   ├── posts.json        # Real posts data
│   └── sample-posts.json # Sample data for testing
└── scripts/              # Utility scripts
    ├── sync-posts.ts     # Sync posts from Telegram
    └── test-fetch-post.ts # Test Telegram API
```

## How It Works

### 1. Telegram Bot Setup

Bot `@fikriyot_uz` kanalida admin bo'lishi kerak. Bot quyidagi ruxsatlarga ega:
- Read messages
- Access channel posts

### 2. Post Fetching

`getUpdates` API metodidan foydalanamiz:
- Oxirgi 100 ta update'ni oladi
- `channel_post` type'dagi update'larni filter qiladi
- Har bir post uchun: text, entities, media, views

### 3. Data Transformation

Telegram message → Post model:
```typescript
{
  id: string;
  channelUsername: string;
  postId: number;
  date: string;
  timestamp: number;
  text?: string;
  entities?: MessageEntity[];  // Bold, italic, links, etc.
  media?: MediaContent;        // Photo, video, document
  views?: number;
  hasMedia: boolean;
}
```

### 4. Rendering

- **PostCard** - Har bir post uchun chiroyli card
- **Text Formatting** - Entities'ni HTML'ga transform qilish
- **Media** - Next.js Image optimization bilan
- **Metadata** - Sana, vaqt, views

## Features & Solutions

✅ **Barcha postlarni olish** - Telegram Web scraping orqali  
✅ **O'chirilgan postlarni filter qilish** - Avtomatik skip  
✅ **Pagination** - Barcha sahifalarni o'qish  
✅ **Rate limiting** - 1 soniya delay har bir sahifa o'rtasida  

### Sync Strategies

1. **Full Sync** (`npm run sync`) - Telegram Web scraping
   - ✅ Barcha postlar
   - ✅ O'chirilganlarni skip qiladi
   - ⚠️ Entities yo'q (faqat text)
   
2. **Quick Sync** (`npm run sync:quick`) - Bot API
   - ✅ Entities bilan (formatting)
   - ✅ To'liq media ma'lumotlari
   - ⚠️ Faqat oxirgi ~100 ta post

## Next Steps

- [ ] Firestore integratsiyasi (real-time database)
- [ ] Webhook sozlash (real-time sync)
- [ ] Pagination (lazy loading)
- [ ] Search funksiyasi
- [ ] Dark/Light mode
- [ ] RSS feed

## Deployment

### Netlify

1. GitHub'ga push qiling
2. Netlify'da yangi site yarating
3. Environment variables qo'shing
4. Deploy!

Build settings:
```
Build command: npm run build
Publish directory: .next
```

## License

MIT

## Author

Fikriyot Team
