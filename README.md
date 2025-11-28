# Fikriyot Blog

Telegram kanalining postlarini veb-saytda ko'rsatuvchi blog platformasi. Tizim Telegram kanalidan barcha mavjud postlarni oladi va yangi postlar chiqishi bilan avtomatik ravishda saytni yangilaydi.

## Xususiyatlar

- 📱 **Responsive dizayn** - Barcha qurilmalarda yaxshi ishlaydi
- 🔄 **Real-time sync** - Telegram webhook orqali avtomatik yangilanish
- ⚡ **Tez yuklash** - Next.js SSG va optimizatsiya
- 🎨 **Telegram Widget** - Postlarning to'liq formatini saqlaydi
- 📊 **Dual storage** - Firestore va JSON fallback
- 🔍 **API endpoints** - RESTful API

## Texnologiyalar

- **Frontend**: Next.js 16, React, TypeScript, Tailwind CSS
- **Backend**: Netlify Functions, Firebase Firestore
- **Telegram**: Bot API, Webhook, Widget SDK
- **Deployment**: Netlify

## O'rnatish

1. **Repository'ni clone qiling**
```bash
git clone <repository-url>
cd fikriyot-blog
```

2. **Dependencies'larni o'rnating**
```bash
npm install
```

3. **Environment variables'ni sozlang**
`.env.local` faylini yarating:
```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHANNEL_USERNAME=your_channel_username
```

4. **Firebase'ni sozlang**
```bash
npx firebase login
npx firebase use your_project_id
npx firebase deploy --only firestore:rules
```

5. **Development server'ni ishga tushiring**
```bash
npm run dev
```

Loyiha [http://localhost:3000](http://localhost:3000) da ochiladi.

## Script'lar

- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run start` - Production server
- `npm run sync` - Dastlabki ma'lumotlarni sync qilish
- `npm run webhook:setup <url>` - Telegram webhook sozlash
- `npm run webhook:delete` - Webhook o'chirish

## API Endpoints

- `GET /api/posts` - Barcha postlar (pagination bilan)
- `GET /api/posts/latest` - Eng so'nggi postlar

## Deployment

### Netlify'ga deploy qilish

1. **GitHub'ga push qiling**
2. **Netlify'da yangi site yarating**
3. **Environment variables'ni qo'shing**
4. **Build settings**:
   - Build command: `npm run build`
   - Publish directory: `.next`

### Webhook sozlash

Production'da webhook URL:
```bash
npm run webhook:setup https://your-site.netlify.app/.netlify/functions/telegram-webhook
```

## Loyiha strukturasi

```
fikriyot-blog/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx          # Home page
├── components/            # React components
│   ├── PostList.tsx      # Posts list with pagination
│   └── TelegramWidget.tsx # Telegram widget wrapper
├── lib/                   # Utility libraries
│   ├── firebase.ts       # Firebase client config
│   ├── firestore-service.ts # Firestore operations
│   ├── telegram-service.ts  # Telegram API
│   └── post-validator.ts    # Data validation
├── netlify/functions/     # Netlify Functions
│   └── telegram-webhook.ts # Webhook handler
├── scripts/              # Utility scripts
│   ├── initial-sync.ts   # Initial data sync
│   └── setup-webhook.ts  # Webhook setup
├── types/                # TypeScript types
└── data/                 # Static data (fallback)
```

## Monitoring

- **Netlify**: Function logs va analytics
- **Firebase**: Firestore usage va errors
- **Telegram**: Bot API logs

## Troubleshooting

### Firebase permission errors
```bash
npx firebase deploy --only firestore:rules
```

### Webhook issues
```bash
npm run webhook:delete
npm run webhook:setup <new-url>
```

### Build errors
```bash
rm -rf .next node_modules
npm install
npm run build
```

## Contributing

1. Fork qiling
2. Feature branch yarating (`git checkout -b feature/amazing-feature`)
3. Commit qiling (`git commit -m 'Add amazing feature'`)
4. Push qiling (`git push origin feature/amazing-feature`)
5. Pull Request oching

## License

MIT License - [LICENSE](LICENSE) faylini ko'ring.