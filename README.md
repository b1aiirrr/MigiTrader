# MigiTrader - Daily Alpha Engine 📈

High-performance PWA for NSE Kenya trading insights. Execute trades via Ziidi Trader on M-Pesa.

---

## Features

✅ **Real-time NSE Market Data** (15-minute delayed)  
✅ **AI-Powered Stock Picks** (Dividend Yields + Momentum Trading)  
✅ **Glassmorphism UI** (Premium iPhone-optimized design)  
✅ **Redis Caching** (Mobile data cost optimization)  
✅ **PWA Support** (Install like a native app)  
✅ **Ziidi Integration** (One-tap M-Pesa trades)

---

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Redis instance (Upstash or Redis Cloud recommended)
- NSE API access (Synergy Systems/ICE or authorized vendor)

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/MigiTrader.git
cd MigiTrader

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your API keys

# Run development server
npm run dev
```

Visit http://localhost:3000

---

## Environment Variables

Create `.env` file:

```env
# NSE API Configuration
NEXT_PUBLIC_NSE_API_URL=https://api.nse.co.ke/v1
NEXT_PUBLIC_NSE_API_KEY=your_api_key_here

# Redis Configuration (Upstash recommended for serverless)
REDIS_URL=redis://username:password@host:port
REDIS_PASSWORD=your_redis_password

# Optional: Ziidi Integration
ZIIDI_PHONE_NUMBER=254700000000
```

---

## Project Structure

```
MigiTrader/
├── src/
│   ├── lib/
│   │   ├── types.ts              # TypeScript interfaces
│   │   ├── redis-cache.ts        # Redis caching layer
│   │   ├── strategy-engine.ts    # Stock ranking algorithm
│   │   └── getDailyInsights.ts   # Main data fetching logic
│   ├── components/
│   │   ├── StockCard.tsx         # Glassmorphism stock card
│   │   └── DailyAlphaDashboard.tsx
│   └── styles/
│       └── globals.css           # Design tokens
├── public/
│   ├── manifest.json             # PWA configuration
│   ├── sw.js                     # Service worker
│   └── icons/                    # App icons
├── docs/
│   └── daily-prompt.md           # AI analysis template
└── vercel.json                   # Deployment config
```

---

## Deployment

Deploy to Vercel (recommended):

```bash
npm install -g vercel
vercel
```

Or deploy to your own infrastructure with Docker:

```bash
docker build -t migitrader .
docker run -p 3000:3000 migitrader
```

---

## PWA Installation (iOS)

1. Open MigiTrader in Safari on your iPhone
2. Tap the Share button (□↑)
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add" in the top-right corner

The app will now launch in standalone mode (no Safari UI).

---

## Strategy Engine Details

### Scoring Algorithm

**Total Score = (Momentum Score × 60%) + (Dividend Score × 40%)**

**Momentum Score (0-100):**
- Volume spike component (40% weight): Max 50% spike = 40 points
- Price momentum component (30% weight): Max 5% gain = 30 points
- Trend confirmation component (30% weight): Max 10% above MA = 30 points

**Dividend Score (0-100):**
- Recent announcement bonus: 50 points
- Blue-chip bonus: 20 points
- Yield component: 10% yield = 30 points

### Entry Point Calculation

- **Entry Point**: 20-day MA + 2% buffer
- **Stop-Loss**: 20-day MA - 5%
- **Target**: Current price + 10%

---

## Mobile Data Optimization

Redis cache TTL is dynamically calculated:
- **Market hours (9 AM - 3 PM EAT)**: 15 minutes
- **After hours**: Cache until next market open

This reduces API calls and saves mobile data costs by ~80%.

---

## Security & Compliance

⚠️ **Disclaimer**: This app is for informational purposes only. Not financial advice.

- All recommendations must comply with CMA (Capital Markets Authority) Kenya regulations
- Human analyst review required before publication
- Real-time data delayed by 15 minutes per NSE requirements

---

## Contributing

Pull requests welcome! Please ensure:
1. Code follows TypeScript best practices
2. All functions have type annotations
3. UI maintains glassmorphism aesthetic
4. Mobile performance optimized (Lighthouse score > 90)

---

## License

MIT License - See LICENSE file for details

---

## Support

For issues or questions:
- Email: support@migitrader.co.ke
- WhatsApp: +254 700 000 000

---

**Built with ❤️ for NSE traders in Kenya**
