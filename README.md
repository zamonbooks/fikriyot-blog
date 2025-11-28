# Fikriyot Blog

Fikriyot Telegram kanalining rasmiy blog sayti.

## Texnologiyalar

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Netlify Functions, Firebase Firestore
- **Telegram**: Telegraf, Telegram Bot API, Telegram Widgets

## O'rnatish

1. Dependencies o'rnatish:
```bash
npm install
```

2. Environment variables sozlash:
`.env.local` faylini yarating va quyidagi ma'lumotlarni kiriting:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHANNEL_USERNAME=fikriyot
```

3. Development server'ni ishga tushirish:
```bash
npm run dev
```

## Deployment

### Netlify'ga deploy qilish

1. GitHub repository'ni Netlify'ga ulang
2. Build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
3. Environment variables qo'shing (`.env.local` dan)
4. Deploy qiling

### Webhook sozlash

Deploy qilingandan keyin webhook'ni sozlang:

```bash
npm run webhook:setup https://your-site.netlify.app/.netlify/functions/telegram-webhook
```

### Initial sync

Dastlabki postlarni yuklash uchun:

```bash
npm run sync
```

## Scripts

- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run start` - Production server
- `npm run sync` - Initial sync (postlarni yuklash)
- `npm run webhook:setup <url>` - Webhook sozlash
- `npm run webhook:delete` - Webhook o'chirish

## Arxitektura

```
fikriyot-blog/
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── PostList.tsx      # Posts list with pagination
│   └── TelegramWidget.tsx # Telegram widget wrapper
├── lib/                   # Utility libraries
│   ├── firebase.ts       # Firebase client
│   ├── firebase-admin.ts # Firebase admin
│   ├── telegram-service.ts # Telegram API service
│   ├── firestore-service.ts # Firestore operations
│   ├── post-validator.ts # Post validation
│   └── rate-limiter.ts   # Rate limiting
├── netlify/
│   └── functions/        # Netlify Functions
│       └── telegram-webhook.ts # Webhook handler
├── scripts/              # Utility scripts
│   ├── initial-sync.ts  # Initial data sync
│   └── setup-webhook.ts # Webhook setup
├── types/                # TypeScript types
│   └── post.ts          # Post interface
└── netlify.toml         # Netlify configuration
```

## Features

- ✅ Real-time postlar ko'rsatish
- ✅ Telegram Widget integratsiyasi
- ✅ Lazy loading va pagination
- ✅ Responsive dizayn
- ✅ Webhook orqali avtomatik sync
- ✅ Firebase Firestore database
- ✅ Rate limiting va error handling

## License

© 2024 Fikriyot. Barcha huquqlar himoyalangan.
