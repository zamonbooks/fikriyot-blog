# 🔗 Telegram Webhook Setup Guide

Bu guide Telegram kanalingizni Netlify saytingiz bilan bog'lash uchun.

## 📋 Nima qiladi?

Kanalda post:
- ✅ Yaratilsa → avtomatik sayt yangilanadi
- ✅ Tahriransa → avtomatik sayt yangilanadi  
- ✅ O'chirilsa → avtomatik sayt yangilanadi

## 🚀 Sozlash (5 qadam)

### 1. Netlify'ga deploy qiling

```bash
git add .
git commit -m "Add webhook support"
git push
```

Netlify avtomatik deploy qiladi.

### 2. Netlify Build Hook yarating

1. Netlify dashboard → **Site settings**
2. **Build & deploy** → **Build hooks**
3. **Add build hook** tugmasini bosing
4. Nom: `Telegram Webhook`
5. Branch: `main` (yoki sizning branch'ingiz)
6. **Save** → URL nusxalang (masalan: `https://api.netlify.com/build_hooks/...`)

### 3. Environment variable qo'shing

Netlify dashboard → **Site settings** → **Environment variables**

Qo'shing:
```
NETLIFY_BUILD_HOOK=https://api.netlify.com/build_hooks/[your-hook-id]
```

**Save** va saytni qayta deploy qiling.

### 4. Telegram webhook'ni sozlang

```bash
npm run setup-webhook
```

Yoki qo'lda:

```bash
npx tsx scripts/setup-telegram-webhook.ts
```

Netlify URL'ingizni kiriting (masalan: `https://fikriyot-blog.netlify.app`)

### 5. Test qiling! 🎉

1. Telegram kanalingizda yangi post yozing
2. 1-2 daqiqa kuting (Netlify build qiladi)
3. Saytingizni yangilang - yangi post ko'rinadi!

## 🔍 Tekshirish

### Webhook holatini ko'rish:

```bash
curl https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo
```

### Webhook o'chirish:

```bash
npm run setup-webhook
# Enter tugmasini bosing (bo'sh qoldiring)
```

## ⚙️ Qanday ishlaydi?

```
Telegram Channel
    ↓ (post created/edited)
Telegram Bot Webhook
    ↓ (signal)
Netlify Function (telegram-webhook.ts)
    ↓ (trigger)
Netlify Build Hook
    ↓ (rebuild)
Site Updated! ✅
```

## 🐛 Troubleshooting

### Webhook ishlamayapti?

1. **Netlify logs'ni tekshiring:**
   - Netlify dashboard → **Functions** → `telegram-webhook`
   - Logs'da xatolar bormi?

2. **Environment variables to'g'rimi?**
   - `TELEGRAM_BOT_TOKEN` ✅
   - `NETLIFY_BUILD_HOOK` ✅

3. **Bot admin'mi?**
   - Bot kanalda administrator bo'lishi kerak
   - "Post messages" huquqi bo'lishi shart emas, faqat "Read messages"

4. **Webhook URL to'g'rimi?**
   ```bash
   curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo
   ```
   
   URL: `https://your-site.netlify.app/.netlify/functions/telegram-webhook`

### Build juda ko'p marta ishga tushyapti?

Webhook har bir post uchun rebuild qiladi. Agar bu ko'p bo'lsa:

1. **Debounce qo'shing** - 5 daqiqa ichida faqat 1 marta rebuild
2. **Manual sync** - webhook'ni o'chiring, qo'lda sync qiling

## 📝 Qo'shimcha

### Webhook'siz ishlash:

Agar webhook kerak bo'lmasa, oddiy qo'lda sync qiling:

```bash
npm run sync
git add data/posts.json
git commit -m "Update posts"
git push
```

### Cron job (alternative):

GitHub Actions bilan har 10 daqiqada avtomatik sync:

```yaml
# .github/workflows/sync.yml
name: Sync Posts
on:
  schedule:
    - cron: '*/10 * * * *'  # Har 10 daqiqa
  workflow_dispatch:

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run sync
      - run: |
          git config user.name "Bot"
          git config user.email "bot@example.com"
          git add data/posts.json
          git commit -m "Auto sync posts" || exit 0
          git push
```

## ✅ Tayyor!

Endi kanalingiz va saytingiz sinxronlashgan! 🎉
