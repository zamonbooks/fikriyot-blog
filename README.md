# 📱 Telegram Channel Blog

Professional blog platform that automatically syncs content from your Telegram channel. Built with Next.js 16, TypeScript, and Tailwind CSS.

## ✨ Features

- 🔄 **Automatic Sync**: Scrapes posts from public Telegram channels
- 🖼️ **High-Quality Images**: Cloudinary integration with original quality preservation
- 📹 **Video Support**: Handles videos with multi-part splitting for large files
- 🎨 **Beautiful UI**: Liquid glass design with Telegram-style post ordering
- 📝 **Rich Text Formatting**: Supports bold, italic, links, code blocks, mentions, hashtags
- 🖼️ **Media Groups**: Grid layout for posts with multiple images
- 🔔 **Auto Updates**: Telegram webhook triggers automatic site rebuilds
- ⚡ **Fast Performance**: Static site generation with ISR (Incremental Static Regeneration)
- 📱 **Responsive**: Mobile-first design that works on all devices

## 🚀 Quick Start

### Prerequisites

- Node.js 20 or higher
- npm or yarn
- Telegram channel (public or private)
- Cloudinary account (free tier: 25GB/month)
- Netlify account (for deployment)

### 1. Clone Repository

```bash
git clone <your-repo-url>
cd fikriyot-blog
npm install
```

### 2. Environment Setup

Create `.env.local` file in the root directory:

```env
# Telegram Configuration
TELEGRAM_CHANNEL_USERNAME=your_channel_username
TELEGRAM_BOT_TOKEN=your_bot_token

# Cloudinary Configuration (Optional but recommended)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_UPLOAD_PRESET=your_upload_preset
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Netlify Configuration (For production)
NETLIFY_BUILD_HOOK=your_build_hook_url
```

### 3. Get Telegram Bot Token

1. Open Telegram and search for [@BotFather](https://t.me/BotFather)
2. Send `/newbot` command
3. Follow instructions to create your bot
4. Copy the bot token (format: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`)
5. Add bot as admin to your channel:
   - Go to your channel
   - Click channel name → Administrators → Add Administrator
   - Search for your bot and add it

### 4. Setup Cloudinary (Optional but Recommended)

Cloudinary provides image and video hosting with optimization:

1. Sign up at [cloudinary.com](https://cloudinary.com) (free tier available)
2. Go to Dashboard → Copy your **Cloud Name**
3. Go to Settings → Upload → Add upload preset:
   - Preset name: `fikriyot` (or your choice)
   - Signing mode: **Unsigned**
   - Folder: `fikriyot`
4. Go to Settings → Security → Access Keys:
   - Copy **API Key** and **API Secret**
5. Add credentials to `.env.local`

**Why Cloudinary?**
- Automatic image optimization (WebP, AVIF)
- CDN delivery for fast loading
- Video hosting and streaming
- Original quality preservation
- Free tier: 25GB storage, 25GB bandwidth/month

### 5. Sync Posts from Telegram

```bash
# Full sync (scrapes all posts from channel)
npm run sync

# Upload media to Cloudinary
npm run upload-media
```

This will:
- Scrape all posts from your Telegram channel
- Save posts to `data/posts.json`
- Upload images to Cloudinary (if configured)
- Preserve text formatting and entities

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your blog.

## 📦 Project Structure

```
fikriyot-blog/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout with metadata
│   ├── page.tsx                 # Home page
│   ├── icon.svg                 # Favicon source
│   └── globals.css              # Global styles
├── components/                   # React components
│   ├── PostCard.tsx             # Individual post display
│   └── PostList.tsx             # Post list with header
├── lib/                         # Utility libraries
│   └── text-formatter.tsx       # Text formatting with entities
├── types/                       # TypeScript types
│   └── post.ts                  # Post interface definitions
├── scripts/                     # Automation scripts
│   ├── fetch-from-rss.ts       # Scrape posts from Telegram
│   ├── upload-media-to-cloudinary.ts  # Upload images/videos
│   ├── setup-telegram-webhook.ts      # Configure webhook
│   └── ...                      # Other utility scripts
├── .netlify/functions/          # Netlify serverless functions
│   └── telegram-webhook.ts     # Webhook handler
├── data/                        # Data storage
│   └── posts.json              # Cached posts
├── .env.local                   # Environment variables (create this)
├── netlify.toml                # Netlify configuration
├── next.config.ts              # Next.js configuration
└── package.json                # Dependencies and scripts
```

## 🔧 Configuration

### Telegram Channel Setup

**For Public Channels:**
- Channel username format: `@your_channel` or `your_channel`
- No special permissions needed
- Posts are scraped from `https://t.me/s/your_channel`

**For Private Channels:**
- Bot must be added as administrator
- Use bot API for fetching posts
- Requires `TELEGRAM_BOT_TOKEN`

### Cloudinary Setup

**Upload Preset Configuration:**
```
Preset name: fikriyot
Signing mode: Unsigned
Folder: fikriyot
Quality: auto:best
Format: auto
Flags: preserve_transparency
```

**Why these settings?**
- `auto:best`: Preserves original quality
- `auto` format: Serves WebP/AVIF when supported
- `preserve_transparency`: Keeps PNG transparency

### Next.js Configuration

The `next.config.ts` includes:
- Image optimization settings
- Remote image patterns (Telegram, Cloudinary)
- Cache headers for performance

## 🚀 Deployment to Netlify

### Step 1: Prepare for Deployment

1. **Push to Git:**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-git-repo-url>
git push -u origin main
```

2. **Ensure data is synced:**
```bash
npm run sync
npm run upload-media
```

### Step 2: Deploy to Netlify

**Option A: Netlify UI (Recommended for first deployment)**

1. Go to [netlify.com](https://netlify.com) and sign in
2. Click "Add new site" → "Import an existing project"
3. Connect your Git repository (GitHub, GitLab, Bitbucket)
4. Configure build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`
   - **Node version:** 20
5. Click "Deploy site"

**Option B: Netlify CLI**

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize site
netlify init

# Deploy
netlify deploy --prod
```

### Step 3: Configure Environment Variables

In Netlify Dashboard:

1. Go to Site settings → Environment variables
2. Add all variables from `.env.local`:

```
TELEGRAM_CHANNEL_USERNAME=your_channel
TELEGRAM_BOT_TOKEN=1234567890:ABC...
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_UPLOAD_PRESET=fikriyot
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz
```

3. Click "Save"
4. Trigger a new deploy: Deploys → Trigger deploy → Deploy site

### Step 4: Setup Build Hook

Build hooks allow automatic rebuilds when content changes:

1. Go to Site settings → Build & deploy → Build hooks
2. Click "Add build hook"
3. Name: `Telegram Webhook`
4. Branch: `main`
5. Click "Save"
6. Copy the build hook URL (format: `https://api.netlify.com/build_hooks/...`)
7. Add to Netlify environment variables:
   ```
   NETLIFY_BUILD_HOOK=https://api.netlify.com/build_hooks/...
   ```

### Step 5: Configure Telegram Webhook

This enables automatic updates when you post to Telegram:

```bash
# Run webhook setup script
npm run setup-webhook
```

The script will:
- Register your Netlify function as Telegram webhook
- Verify webhook is working
- Test with a sample update

**Webhook URL format:**
```
https://your-site.netlify.app/.netlify/functions/telegram-webhook
```

### Step 6: Verify Deployment

1. **Check site is live:**
   - Visit your Netlify URL: `https://your-site.netlify.app`
   - Verify posts are displayed correctly
   - Check images load properly

2. **Test webhook:**
   - Post something new to your Telegram channel
   - Wait 2-3 minutes
   - Check Netlify deploys (should see automatic deploy)
   - Refresh your site to see new post

3. **Check function logs:**
   - Go to Netlify Dashboard → Functions → telegram-webhook
   - View logs to see webhook activity

## 🔄 Workflow

### Daily Usage

Once deployed, your blog updates automatically:

1. **Post to Telegram** → Webhook receives notification
2. **Webhook triggers** → Netlify starts rebuild
3. **Build process** → Scrapes latest posts, uploads media
4. **Deploy** → Site updates with new content
5. **Live** → New post visible on your blog (2-5 minutes)

### Manual Updates

If you need to manually update:

```bash
# Sync posts locally
npm run sync
npm run upload-media

# Commit and push
git add data/posts.json
git commit -m "Update posts"
git push

# Or trigger build hook directly
curl -X POST -d {} https://api.netlify.com/build_hooks/YOUR_HOOK_ID
```

## 📝 Available Scripts

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Content Management
```bash
npm run sync         # Full sync from Telegram (all posts)
npm run upload-media # Upload images/videos to Cloudinary
```

### Deployment
```bash
npm run setup-webhook    # Configure Telegram webhook
netlify deploy --prod    # Deploy to Netlify
```

### Utilities
```bash
npm run generate-favicon # Generate favicon from SVG
```

## 🎨 Customization

### Change Channel

Edit `.env.local`:
```env
TELEGRAM_CHANNEL_USERNAME=new_channel_name
```

Then re-sync:
```bash
npm run sync
npm run upload-media
```

### Customize Design

**Colors and Styling:**
- Edit `app/globals.css` for global styles
- Modify `components/PostCard.tsx` for post appearance
- Update `components/PostList.tsx` for header and layout

**Fonts:**
- Add fonts to `app/layout.tsx`
- Update Tailwind config if needed

**Logo/Favicon:**
- Replace `app/icon.svg` with your logo
- Run `npm run generate-favicon` to regenerate favicon

### Add Custom Domain

In Netlify Dashboard:
1. Go to Domain settings → Add custom domain
2. Enter your domain (e.g., `blog.example.com`)
3. Follow DNS configuration instructions
4. Enable HTTPS (automatic with Netlify)

## 🐛 Troubleshooting

### Posts not syncing

**Check Telegram channel:**
```bash
# Verify channel is accessible
curl https://t.me/s/YOUR_CHANNEL
```

**Check bot permissions:**
- Bot must be admin in private channels
- For public channels, no bot needed

**Check logs:**
```bash
npm run sync
# Look for errors in output
```

### Images not loading

**Verify Cloudinary config:**
```bash
# Check environment variables
echo $CLOUDINARY_CLOUD_NAME
echo $CLOUDINARY_UPLOAD_PRESET
```

**Re-upload media:**
```bash
npm run upload-media
```

**Check Next.js image config:**
- Verify `next.config.ts` includes Cloudinary hostname
- Check browser console for image errors

### Webhook not working

**Verify webhook is registered:**
```bash
curl https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo
```

**Check function logs:**
- Netlify Dashboard → Functions → telegram-webhook → Logs

**Test webhook manually:**
```bash
curl -X POST https://your-site.netlify.app/.netlify/functions/telegram-webhook \
  -H "Content-Type: application/json" \
  -d '{"update_id":1,"channel_post":{"message_id":1,"text":"test"}}'
```

**Common issues:**
- `NETLIFY_BUILD_HOOK` not set in environment variables
- Webhook URL incorrect (must be HTTPS)
- Bot token invalid or expired

### Build failures

**Check Node version:**
```bash
node --version  # Should be 20+
```

**Clear cache and rebuild:**
```bash
rm -rf .next node_modules
npm install
npm run build
```

**Check Netlify build logs:**
- Netlify Dashboard → Deploys → Click failed deploy → View logs

## 📊 Performance Optimization

### Image Optimization

Images are automatically optimized:
- Cloudinary serves WebP/AVIF formats
- Next.js Image component handles lazy loading
- Original quality preserved for text readability

### Caching Strategy

```
Static assets: 1 year cache
Pages: 60 seconds cache, 120 seconds stale-while-revalidate
API routes: No cache
```

### Build Optimization

- Static generation for all posts
- Incremental Static Regeneration (ISR)
- Automatic code splitting
- Tree shaking for smaller bundles

## 🔒 Security

### Environment Variables

**Never commit:**
- `.env.local` (in `.gitignore`)
- API keys or tokens
- Cloudinary secrets

**Use Netlify environment variables for:**
- Production secrets
- API keys
- Build hooks

### Webhook Security

The webhook function includes:
- Method validation (POST only)
- Error handling
- Request logging
- Rate limiting (via Netlify)

### Content Security

- XSS protection via React
- Content Security Policy headers
- HTTPS only (enforced by Netlify)
- No inline scripts

## 📚 Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **Hosting:** Netlify
- **Media:** Cloudinary
- **Data Source:** Telegram
- **Automation:** Netlify Functions

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - feel free to use for your own projects!

## 🆘 Support

**Issues?**
- Check troubleshooting section above
- Review Netlify function logs
- Check browser console for errors

**Questions?**
- Open an issue on GitHub
- Check existing issues for solutions

## 🎯 Roadmap

- [ ] Search functionality
- [ ] Post categories/tags
- [ ] Comments system
- [ ] RSS feed
- [ ] Analytics integration
- [ ] Multi-language support
- [ ] Dark mode toggle
- [ ] Post reactions

## 📸 Screenshots

[Add screenshots of your blog here]

## 🌟 Credits

Built with ❤️ using modern web technologies.

---

**Happy blogging! 🚀**
