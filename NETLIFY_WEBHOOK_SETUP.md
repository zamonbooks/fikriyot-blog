# 🚀 Netlify'da Webhook Sozlash - To'liq Qo'llanma

## 📋 BOSQICHMA-BOSQICH YO'RIQNOMA

---

## 1️⃣ **NETLIFY'GA DEPLOY QILISH**

### **A. Git Repository yaratish**

```bash
# Agar git repo yo'q bo'lsa:
cd fikriyot-blog
git init
git add .
git commit -m "Initial commit - Fikriyot Blog"

# GitHub'ga push qilish:
git remote add origin https://github.com/YOUR_USERNAME/fikriyot-blog.git
git branch -M main
git push -u origin main
```

### **B. Netlify'da Site yaratish**

1. **Netlify'ga kiring:** https://app.netlify.com
2. **"Add new site"** → **"Import an existing project"**
3. **GitHub'ni tanlang** va repository'ni toping
4. **Build settings:**
   ```
   Build command: npm run build
   Publish directory: .next
   ```
5. **"Deploy site"** tugmasini bosing

---

## 2️⃣ **ENVIRONMENT VARIABLES SOZLASH**

Netlify Dashboard'da:

1. **Site settings** → **Environment variables**
2. Quyidagi o'zgaruvchilarni qo'shing:

```env
# Telegram Configuration
TELEGRAM_CHANNEL_USERNAME=fikriyot_uz
TELEGRAM_BOT_TOKEN=your_bot_token_here

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=dg8ryayj8
CLOUDINARY_UPLOAD_PRESET=fikriyot
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

3. **"Save"** tugmasini bosing
4. **Site'ni qayta deploy qiling:** Deploys → Trigger deploy → Deploy site

---

## 3️⃣ **BUILD HOOK YARATISH**

Build hook - Telegram'dan yangi post kelganda avtomatik rebuild qilish uchun.

### **Netlify'da:**

1. **Site settings** → **Build & deploy** → **Build hooks**
2. **"Add build hook"** tugmasini bosing
3. **Sozlamalar:**
   ```
   Hook name: Telegram Webhook
   Branch to build: main
   ```
4. **"Save"** tugmasini bosing
5. **URL'ni nusxalang** (masalan):
   ```
   https://api.netlify.com/build_hooks/6789abcdef1234567890
   ```

### **Environment variable'ga qo'shish:**

1. **Site settings** → **Environment variables**
2. Yangi variable qo'shing:
   ```
   Key: NETLIFY_BUILD_HOOK
   Value: https://api.netlify.com/build_hooks/6789abcdef1234567890
   ```
3. **"Save"** va **qayta deploy qiling**

---

## 4️⃣ **TELEGRAM WEBHOOK SOZLASH**

### **A. Webhook URL'ni olish**

Deploy tugagandan keyin, sizning Netlify URL'ingiz:
```
https://your-site-name.netlify.app
```

Webhook function URL'i:
```
https://your-site-name.netlify.app/.netlify/functions/telegram-webhook
```

### **B. Telegram Bot'ga webhook o'rnatish**

#### **Variant 1: Script orqali (Tavsiya etiladi)**

1. `.env.local` faylini tekshiring:
```env
TELEGRAM_BOT_TOKEN=your_bot_token
NETLIFY_BUILD_HOOK=https://api.netlify.com/build_hooks/...
```

2. Script'ni ishga tushiring:
```bash
npm run setup-webhook
```

Bu script avtomatik:
- Telegram'ga webhook URL'ni yuboradi
- Webhook holatini tekshiradi
- Test qiladi

#### **Variant 2: Manual (cURL orqali)**

```bash
# Webhook o'rnatish
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-site-name.netlify.app/.netlify/functions/telegram-webhook",
    "allowed_updates": ["channel_post"]
  }'

# Webhook holatini tekshirish
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
```

#### **Variant 3: Browser orqali**

Browser'da oching:
```
https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://your-site-name.netlify.app/.netlify/functions/telegram-webhook
```

---

## 5️⃣ **WEBHOOK FUNCTION TEKSHIRISH**

### **Netlify Function'ni tekshirish:**

1. **Netlify Dashboard** → **Functions** → **telegram-webhook**
2. Function mavjudligini tekshiring
3. **Logs**'ni ko'ring

### **Manual test:**

```bash
# Test webhook
curl -X POST https://your-site-name.netlify.app/.netlify/functions/telegram-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "update_id": 1,
    "channel_post": {
      "message_id": 1,
      "chat": {"id": -1001234567890, "type": "channel"},
      "date": 1234567890,
      "text": "Test message"
    }
  }'
```

---

## 6️⃣ **WEBHOOK ISHLASHINI TEKSHIRISH**

### **A. Telegram kanalingizga yangi post yozing**

1. Telegram'da kanalingizga biror narsa yozing
2. 2-3 daqiqa kuting

### **B. Netlify'da tekshirish:**

1. **Netlify Dashboard** → **Deploys**
2. Yangi deploy boshlanganini ko'rasiz
3. **Functions** → **telegram-webhook** → **Logs**
4. Log'larda webhook kelganini ko'rasiz

### **C. Site'ni tekshirish:**

1. Deploy tugagandan keyin site'ni yangilang
2. Yangi post ko'rinishi kerak

---

## 7️⃣ **MUAMMOLARNI HAL QILISH**

### **Webhook ishlamayapti?**

#### **1. Webhook holatini tekshiring:**
```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
```

Javob:
```json
{
  "ok": true,
  "result": {
    "url": "https://your-site-name.netlify.app/.netlify/functions/telegram-webhook",
    "has_custom_certificate": false,
    "pending_update_count": 0,
    "last_error_date": 0,
    "max_connections": 40
  }
}
```

#### **2. Agar xato bo'lsa:**

**"SSL certificate problem":**
```bash
# Webhook'ni o'chirish
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/deleteWebhook"

# Qayta o'rnatish
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -d "url=https://your-site-name.netlify.app/.netlify/functions/telegram-webhook"
```

**"Function not found":**
- Netlify'da function deploy bo'lganini tekshiring
- `.netlify/functions/telegram-webhook.ts` fayli mavjudligini tekshiring

#### **3. Function logs'ni tekshiring:**

Netlify Dashboard → Functions → telegram-webhook → Logs

---

## 8️⃣ **TO'LIQ WORKFLOW**

```
Telegram'ga post → Telegram Webhook → Netlify Function → Build Hook → 
Netlify Deploy → npm run build → Scrape posts → Upload media → 
Build site → Deploy → Yangi post ko'rinadi
```

**Jarayon:**
1. Siz Telegram kanalingizga post yozasiz
2. Telegram webhook'ni chaqiradi
3. Netlify function webhook'ni qabul qiladi
4. Function build hook'ni trigger qiladi
5. Netlify yangi deploy boshlaydi
6. Build jarayonida `npm run build` ishga tushadi
7. `prebuild` script avtomatik `npm run sync` ni chaqiradi
8. Sync script Telegram'dan yangi postlarni scrape qiladi
9. Media fayllar Cloudinary'ga yuklanadi
10. Next.js site build qilinadi
11. Yangi versiya deploy qilinadi
12. Yangi post site'da ko'rinadi

---

## 📝 **QISQACHA CHECKLIST**

- [ ] Git repository yaratildi
- [ ] Netlify'ga deploy qilindi
- [ ] Environment variables qo'shildi
- [ ] Build hook yaratildi
- [ ] NETLIFY_BUILD_HOOK environment variable qo'shildi
- [ ] Telegram webhook o'rnatildi
- [ ] Webhook holati tekshirildi
- [ ] Test post yozildi
- [ ] Yangi post site'da ko'rindi

---

## 🎯 **KEYINGI QADAMLAR**

1. **Custom domain qo'shish** (ixtiyoriy)
   - Netlify Dashboard → Domain settings → Add custom domain
   - DNS sozlamalarini yangilang

2. **Analytics qo'shish** (ixtiyoriy)
   - Google Analytics
   - Plausible Analytics
   - Netlify Analytics

3. **SEO optimization**
   - Meta tags
   - Open Graph
   - Sitemap

4. **Performance monitoring**
   - Lighthouse scores
   - Core Web Vitals

---

## 🔧 **FOYDALI COMMANDLAR**

```bash
# Local'da test qilish
npm run dev

# Build qilish
npm run build

# Postlarni sync qilish
npm run sync

# Media'larni Cloudinary'ga yuklash
npm run upload-media

# Webhook sozlash
npm run setup-webhook
```

---

## 📞 **YORDAM**

Agar muammo yuzaga kelsa:

1. **Netlify Logs'ni tekshiring:** Dashboard → Functions → Logs
2. **Telegram webhook holatini tekshiring:** `getWebhookInfo` API
3. **Environment variables to'g'riligini tekshiring**
4. **Build logs'ni o'qing:** Dashboard → Deploys → [Deploy] → Deploy log

---

**Muvaffaqiyatli deploy qiling! 🚀**


---

# 📋 DEPLOY'DAN KEYIN QILISH KERAK BO'LGAN ISHLAR

---

## 🎯 **MUHIM ISHLAR (Darhol bajarish kerak)**

### 1. **Site'ni Test Qilish**

#### **A. Asosiy funksiyalarni tekshirish:**
- [ ] Site ochilayaptimi? (`https://your-site.netlify.app`)
- [ ] Postlar ko'rinyaptimi?
- [ ] Rasmlar yuklanayaptimi?
- [ ] Videolar ijro etilayaptimi?
- [ ] Audio'lar ijro etilayaptimi?
- [ ] Text formatting to'g'rimi? (bold, italic, links)
- [ ] Forwarded postlar ko'rinyaptimi?
- [ ] Views counter ishlayaptimi?

#### **B. Mobile'da test qilish:**
- [ ] Telefonda ochib ko'ring
- [ ] Responsive design ishlayaptimi?
- [ ] Media'lar to'g'ri ko'rinyaptimi?
- [ ] Touch controls ishlayaptimi?

#### **C. Turli brauzerlar'da test qilish:**
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

---

### 2. **Webhook'ni Test Qilish**

#### **A. Yangi post yozish:**
```bash
# 1. Telegram kanalingizga test post yozing
# 2. 2-3 daqiqa kuting
# 3. Netlify Dashboard → Deploys'ni tekshiring
# 4. Yangi deploy boshlanganini ko'ring
# 5. Deploy tugagandan keyin site'ni yangilang
# 6. Yangi post ko'rinishini tekshiring
```

#### **B. Webhook logs'ni tekshirish:**
```bash
# Netlify Dashboard'da:
1. Functions → telegram-webhook → Logs
2. Webhook kelganini ko'ring
3. Xatolar yo'qligini tekshiring
```

#### **C. Agar webhook ishlamasa:**
```bash
# Webhook holatini tekshiring:
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"

# Agar muammo bo'lsa, qayta o'rnating:
npm run setup-webhook
```

---

### 3. **Performance Tekshirish**

#### **A. Lighthouse audit:**
```bash
# Chrome DevTools'da:
1. F12 bosing
2. Lighthouse tab'ini oching
3. "Generate report" bosing
4. Natijalarni ko'ring:
   - Performance: 90+ bo'lishi kerak
   - Accessibility: 90+ bo'lishi kerak
   - Best Practices: 90+ bo'lishi kerak
   - SEO: 90+ bo'lishi kerak
```

#### **B. Loading speed:**
- [ ] Birinchi sahifa 3 soniyadan tez yuklanishi kerak
- [ ] Rasmlar lazy load bo'lishi kerak
- [ ] Video'lar on-demand yuklanishi kerak

---

## 🔧 **YAXSHILASHLAR (Keyinroq qilish mumkin)**

### 4. **Custom Domain Qo'shish**

#### **A. Domain sotib olish:**
- Namecheap.com
- GoDaddy.com
- Cloudflare Registrar
- Reg.ru (O'zbekiston uchun)

#### **B. Netlify'da sozlash:**
```bash
# Netlify Dashboard'da:
1. Domain settings → Add custom domain
2. Domain nomini kiriting (masalan: fikriyot.uz)
3. DNS sozlamalarini ko'rsatadi
```

#### **C. DNS sozlash:**
```
# Domain provider'ingizda quyidagi DNS record'larni qo'shing:

A Record:
Name: @
Value: 75.2.60.5 (Netlify IP)

CNAME Record:
Name: www
Value: your-site.netlify.app
```

#### **D. SSL sertifikat:**
- Netlify avtomatik Let's Encrypt SSL beradi
- 24 soat ichida faollashadi
- HTTPS avtomatik ishlaydi

---

### 5. **SEO Optimization**

#### **A. Meta tags qo'shish:**

`app/layout.tsx` faylini yangilang:
```typescript
export const metadata: Metadata = {
  title: "Fikriyot - Fikr qilmaysizlarmi?!",
  description: "Fikriyot Telegram kanalining rasmiy blog sayti. Eng so'nggi fikrlar, mulohazalar va postlar.",
  keywords: ["fikriyot", "blog", "o'zbek", "fikr", "mulohaza"],
  authors: [{ name: "Fikriyot" }],
  openGraph: {
    title: "Fikriyot - Fikr qilmaysizlarmi?!",
    description: "Fikriyot Telegram kanalining rasmiy blog sayti",
    url: "https://your-domain.com",
    siteName: "Fikriyot",
    images: [
      {
        url: "https://your-domain.com/logo.svg",
        width: 300,
        height: 300,
      },
    ],
    locale: "uz_UZ",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fikriyot - Fikr qilmaysizlarmi?!",
    description: "Fikriyot Telegram kanalining rasmiy blog sayti",
    images: ["https://your-domain.com/logo.svg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};
```

#### **B. Sitemap yaratish:**

`app/sitemap.ts` yarating:
```typescript
import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://your-domain.com',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
  ];
}
```

#### **C. robots.txt yaratish:**

`app/robots.ts` yarating:
```typescript
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: 'https://your-domain.com/sitemap.xml',
  };
}
```

---

### 6. **Analytics Qo'shish**

#### **A. Google Analytics:**

1. **Google Analytics account yarating:** https://analytics.google.com
2. **Measurement ID oling** (masalan: G-XXXXXXXXXX)
3. **Environment variable qo'shing:**
   ```env
   NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
   ```
4. **Script qo'shing** `app/layout.tsx`'ga:
   ```typescript
   import Script from 'next/script';
   
   // Layout ichida:
   {process.env.NEXT_PUBLIC_GA_ID && (
     <>
       <Script
         src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
         strategy="afterInteractive"
       />
       <Script id="google-analytics" strategy="afterInteractive">
         {`
           window.dataLayer = window.dataLayer || [];
           function gtag(){dataLayer.push(arguments);}
           gtag('js', new Date());
           gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
         `}
       </Script>
     </>
   )}
   ```

#### **B. Plausible Analytics (Privacy-friendly):**

1. **Plausible account yarating:** https://plausible.io
2. **Script qo'shing** `app/layout.tsx`'ga:
   ```typescript
   <Script
     defer
     data-domain="your-domain.com"
     src="https://plausible.io/js/script.js"
   />
   ```

#### **C. Netlify Analytics:**
- Netlify Dashboard → Analytics → Enable
- $9/month (ixtiyoriy)

---

### 7. **Social Media Integration**

#### **A. Telegram kanal linkini qo'shish:**

`app/layout.tsx` yoki `components/PostList.tsx`'ga:
```typescript
<a
  href="https://t.me/fikriyot_uz"
  target="_blank"
  rel="noopener noreferrer"
  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
>
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.009-1.252-.242-1.865-.442-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635.099-.002.321.023.465.141.121.099.155.232.171.326.016.094.036.308.02.475z"/>
  </svg>
  Telegram kanalga obuna bo'ling
</a>
```

#### **B. Share buttons qo'shish:**

Har bir post uchun share button:
```typescript
// components/ShareButton.tsx
export function ShareButton({ postId, text }: { postId: number; text: string }) {
  const shareUrl = `https://your-domain.com/#post-${postId}`;
  const shareText = text.substring(0, 100) + '...';
  
  return (
    <div className="flex gap-2">
      {/* Telegram */}
      <a
        href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 bg-blue-500 rounded-lg hover:bg-blue-600"
      >
        <TelegramIcon />
      </a>
      
      {/* Twitter */}
      <a
        href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 bg-sky-500 rounded-lg hover:bg-sky-600"
      >
        <TwitterIcon />
      </a>
      
      {/* Copy link */}
      <button
        onClick={() => {
          navigator.clipboard.writeText(shareUrl);
          alert('Link nusxalandi!');
        }}
        className="p-2 bg-gray-500 rounded-lg hover:bg-gray-600"
      >
        <CopyIcon />
      </button>
    </div>
  );
}
```

---

### 8. **Performance Optimization**

#### **A. Image optimization:**

Next.js avtomatik optimize qiladi, lekin qo'shimcha:
```typescript
// next.config.ts'da
images: {
  formats: ['image/avif', 'image/webp'],
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
}
```

#### **B. Caching strategy:**

`next.config.ts`'da:
```typescript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=3600, stale-while-revalidate=86400',
        },
      ],
    },
    {
      source: '/logo.svg',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
  ];
}
```

#### **C. Bundle size optimization:**

```bash
# Bundle analyzer o'rnatish
npm install @next/bundle-analyzer

# next.config.ts'ga qo'shish:
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer(nextConfig);

# Analyze qilish:
ANALYZE=true npm run build
```

---

### 9. **Monitoring va Logging**

#### **A. Error tracking (Sentry):**

```bash
# Sentry o'rnatish
npm install @sentry/nextjs

# Sentry sozlash
npx @sentry/wizard@latest -i nextjs

# Environment variable qo'shish
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

#### **B. Uptime monitoring:**

- **UptimeRobot:** https://uptimerobot.com (bepul)
- **Pingdom:** https://pingdom.com
- **StatusCake:** https://statuscake.com

Har 5 daqiqada site'ni tekshiradi va down bo'lsa email yuboradi.

#### **C. Netlify notifications:**

Netlify Dashboard → Site settings → Build & deploy → Deploy notifications:
- Email notification
- Slack notification
- Webhook notification

---

### 10. **Backup va Recovery**

#### **A. Git backup:**
```bash
# Har doim commit qiling
git add .
git commit -m "Update: [description]"
git push

# Tag yarating muhim versiyalar uchun
git tag -a v1.0.0 -m "Production release v1.0.0"
git push origin v1.0.0
```

#### **B. Data backup:**
```bash
# posts.json'ni backup qiling
# Har hafta yoki har oy:
cp data/posts.json data/backups/posts-$(date +%Y%m%d).json

# Cloudinary'da ham backup bor (avtomatik)
```

#### **C. Environment variables backup:**
```bash
# .env.local'ni xavfsiz joyda saqlang
# Masalan: password manager yoki encrypted file
```

---

## 🎨 **IXTIYORIY YAXSHILASHLAR**

### 11. **UI/UX Improvements**

- [ ] Dark mode toggle qo'shish
- [ ] Search functionality
- [ ] Post categories/tags
- [ ] Pagination yoki infinite scroll
- [ ] Loading skeletons
- [ ] Error boundaries
- [ ] 404 page customization
- [ ] Accessibility improvements (ARIA labels)

### 12. **Feature Additions**

- [ ] Comments system (Disqus, Utterances)
- [ ] RSS feed
- [ ] Newsletter subscription
- [ ] Related posts
- [ ] Post reactions (like, love, etc.)
- [ ] Reading time estimate
- [ ] Table of contents for long posts
- [ ] Print-friendly version

### 13. **Audio Player Improvements**

Agar audio player'ni yanada yaxshilashni istasangiz:

```typescript
// Task 4.3: Progress bar va time display
// Task 4.4: Metadata display (title, performer)
// Task 4.5: Waveform visualization

// Bu tasklar .kiro/specs/audio-support/tasks.md'da batafsil
```

---

## 📊 **MONITORING CHECKLIST**

### **Kunlik:**
- [ ] Site ishlayaptimi?
- [ ] Yangi postlar sync bo'lyaptimi?
- [ ] Xatolar yo'qmi? (Netlify logs)

### **Haftalik:**
- [ ] Analytics'ni ko'rish
- [ ] Performance metrics
- [ ] Backup yaratish
- [ ] Security updates

### **Oylik:**
- [ ] Dependencies update qilish
- [ ] SEO metrics ko'rish
- [ ] User feedback yig'ish
- [ ] Feature roadmap yangilash

---

## 🔐 **SECURITY CHECKLIST**

- [ ] Environment variables xavfsiz saqlangan
- [ ] API keys exposed emas
- [ ] HTTPS enabled
- [ ] Security headers configured
- [ ] Dependencies up to date
- [ ] No sensitive data in git
- [ ] Bot token secure
- [ ] Cloudinary credentials secure

---

## 📞 **YORDAM VA RESURSLAR**

### **Documentation:**
- Next.js: https://nextjs.org/docs
- Netlify: https://docs.netlify.com
- Telegram Bot API: https://core.telegram.org/bots/api
- Cloudinary: https://cloudinary.com/documentation

### **Community:**
- Next.js Discord: https://nextjs.org/discord
- Netlify Community: https://answers.netlify.com
- Stack Overflow: https://stackoverflow.com

### **Tools:**
- Lighthouse: Chrome DevTools
- PageSpeed Insights: https://pagespeed.web.dev
- GTmetrix: https://gtmetrix.com
- WebPageTest: https://webpagetest.org

---

## ✅ **FINAL CHECKLIST**

### **Muhim (Darhol):**
- [ ] Site deploy qilindi
- [ ] Webhook ishlayapti
- [ ] Test post muvaffaqiyatli
- [ ] Mobile'da test qilindi
- [ ] Performance yaxshi

### **Muhim (1 hafta ichida):**
- [ ] Custom domain qo'shildi
- [ ] Analytics sozlandi
- [ ] SEO optimized
- [ ] Social media links qo'shildi
- [ ] Monitoring sozlandi

### **Ixtiyoriy (Keyinroq):**
- [ ] UI improvements
- [ ] Additional features
- [ ] Advanced analytics
- [ ] A/B testing

---

**Muvaffaqiyatli launch qiling! 🎉🚀**

Agar biror savol yoki muammo bo'lsa, bemalol so'rang!