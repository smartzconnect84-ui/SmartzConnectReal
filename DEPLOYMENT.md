# SmartzConnect — Deployment Guide

## 🚀 Quick Deploy

### Option 1: Cloudflare Pages (Recommended)
```bash
# Build
pnpm run build

# Deploy via Cloudflare Pages dashboard
# Build command: pnpm run build
# Build output: dist
# Root directory: /
```

**Environment Variables to set in Cloudflare Pages:**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_CLOUDINARY_CLOUD_NAME`
- `VITE_CLOUDINARY_UPLOAD_PRESET`
- `VITE_ONESIGNAL_APP_ID`

### Option 2: Vercel
```bash
npm i -g vercel
vercel --prod
```

### Option 3: Netlify
```bash
npm i -g netlify-cli
netlify deploy --prod --dir=dist
```

---

## 🗄️ Database Setup

1. Create a new Supabase project at https://supabase.com
2. Go to SQL Editor
3. Run `supabase/schema.sql` first
4. Run `supabase/rls_policies.sql` second
5. Enable Realtime for: messages, notifications, matches, ride_requests
6. Copy your project URL and anon key to `.env`

---

## 🔐 Supabase Auth Setup

1. Enable Email/Password auth
2. Enable Google OAuth (optional)
3. Enable Facebook OAuth (optional)
4. Set Site URL to your domain
5. Add redirect URLs

---

## 📱 PWA Setup

The app is PWA-ready. To enable:
1. Update `public/manifest.json` with your app details
2. Ensure HTTPS is enabled on your domain
3. Service worker is auto-registered via Vite PWA plugin

---

## 🌍 Custom Domain

Point your domain DNS to Cloudflare Pages / Vercel / Netlify
and add it in the platform dashboard.
