# 🚀 MigiTrader - Quick Start & Deployment Guide

## ✅ What's Already Done

- ✅ Git repository initialized
- ✅ All dependencies installed
- ✅ Vercel CLI installed globally
- ✅ Project structure ready

---

## 📋 How to Run Locally

### Step 1: Set up environment variables

```bash
# Copy the example file
copy .env.example .env

# Edit .env and add your API keys
# For now, you can use placeholder values for testing the UI
```

### Step 2: Run the development server

```bash
npm run dev
```

Visit **http://localhost:3000** in your browser.

> **Note**: The app will show errors if you don't have real API keys yet. That's expected!

---

## 🌐 Deploy to Vercel

### Option 1: Deploy via Vercel CLI (Recommended)

```bash
# Login to Vercel (opens browser)
vercel login

# Deploy to production
vercel --prod
```

The CLI will:
1. Ask you to login/authenticate
2. Create a new project on Vercel
3. Deploy your app
4. Give you a production URL like: `https://migitrader.vercel.app`

### Option 2: Deploy via Vercel Dashboard (Easier)

1. **Push to GitHub first**:
   ```bash
   # Create a new repo on GitHub, then:
   git remote add origin https://github.com/YOUR_USERNAME/MigiTrader.git
   git branch -M main
   git push -u origin main
   ```

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel auto-detects Next.js settings
   - Click "Deploy"

3. **Add Environment Variables** (in Vercel dashboard):
   - Go to Project Settings → Environment Variables
   - Add:
     - `NEXT_PUBLIC_NSE_API_URL`
     - `NEXT_PUBLIC_NSE_API_KEY`
     - `REDIS_URL`
     - `REDIS_PASSWORD`

---

## 🔑 Getting API Keys & Services

### 1. NSE Market Data API

**Options**:
- **NSE Official**: Contact [NSE Kenya](https://www.nse.co.ke) for API access
- **Synergy Systems**: Request access via their website
- **ICE Data Services**: Enterprise solution

**For Testing**: You can mock the API responses initially to test the UI.

### 2. Redis Cache (Upstash - Free Tier)

1. Go to [upstash.com](https://upstash.com)
2. Sign up (free)
3. Create a new Redis database
4. Copy the `REDIS_URL` and `REDIS_PASSWORD`
5. Add to your `.env` file

**Upstash Free Tier**: 10,000 commands/day (perfect for testing)

---

## 📱 Test PWA on iPhone 14 Pro Max

### After Deployment:

1. Open your Vercel URL in **Safari** on iPhone
2. Tap the **Share** button (square with arrow)
3. Scroll down and tap **"Add to Home Screen"**
4. Tap **"Add"**

The app will now:
- Launch in standalone mode (no Safari UI)
- Display your custom icon
- Work offline (service worker caching)

---

## 🧪 Testing Without Real API Keys

To test the UI without NSE API access, create a mock API route:

**File**: `src/pages/api/market-data/stocks.ts`

```typescript
export default function handler(req, res) {
  // Mock NSE data for testing
  res.status(200).json({
    stocks: [
      {
        ticker: 'SCOM',
        name: 'Safaricom PLC',
        currentPrice: 25.50,
        previousClose: 24.80,
        volume: 15000000,
        averageVolume: 12000000,
        marketCap: 1020000000000,
        dividendYield: 5.8,
        high52Week: 28.00,
        low52Week: 22.50,
        movingAverage20Day: 24.50,
      },
      // Add more mock stocks...
    ],
  });
}
```

Then update `.env`:
```
NEXT_PUBLIC_NSE_API_URL=http://localhost:3000/api
NEXT_PUBLIC_NSE_API_KEY=mock_key_for_testing
```

---

## 🎨 Next Steps

1. **Test locally**: `npm run dev`
2. **Deploy to Vercel**: `vercel --prod` (after logging in)
3. **Set up Redis**: Create free Upstash account
4. **Get NSE API access**: Contact providers or use mock data
5. **Test PWA**: Install on iPhone via Safari

---

## ⚡ Quick Commands Reference

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server
npm run type-check       # Check TypeScript types

# Git
git status              # Check what's changed
git add .               # Stage all changes
git commit -m "msg"     # Commit changes
git push                # Push to remote

# Vercel
vercel login            # Login to Vercel
vercel                  # Deploy to preview
vercel --prod           # Deploy to production
vercel env ls           # List environment variables
```

---

## 🆘 Troubleshooting

### "Module not found" errors
```bash
npm install
```

### Redis connection errors
- Check your `REDIS_URL` format: `redis://default:password@host:port`
- Verify Upstash credentials

### API errors
- For testing, use mock data (see section above)
- Check API key format and permissions

### Build errors on Vercel
- Ensure all environment variables are set in Vercel dashboard
- Check build logs for specific errors

---

## 📞 Support

Need help? Check:
- [Next.js Docs](https://nextjs.org/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Upstash Docs](https://docs.upstash.com)

---

**Ready to launch MigiTrader? Start with `npm run dev` to see it in action! 🚀**
