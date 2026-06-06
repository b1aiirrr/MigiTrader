import type { NextApiRequest, NextApiResponse } from 'next';

// TypeScript interfaces for signals data
export interface AssetSignal {
  ticker: string;
  name: string;
  currentPrice: number;
  priceChangePercent: number;
  rsi14: number;
  movingAverage20Day: number;
  volume: number;
  signalStatus: 'BUY' | 'SELL' | 'HOLD';
  timestamp: string;
  reasoning: string;
  assetType: 'EQUITY' | 'IFB';
  portalUrl: string;
}

export interface SignalsResponse {
  date: string;
  marketSentiment: number; // percentage of BUY signals
  totalAssets: number;
  buyCount: number;
  holdCount: number;
  sellCount: number;
  signals: AssetSignal[];
}

interface BrokerEntry {
  readonly clientCode?: string;
  readonly accountId?: string;
  readonly portalUrl: string;
}

type BrokerKey = 'STERLING_CAPITAL' | 'DHOW_CSD';

const BROKER_REGISTRY: Readonly<Record<BrokerKey, BrokerEntry>> = {
  STERLING_CAPITAL: {
    clientCode: '75653',
    portalUrl: 'https://sterling.kenyaonlinetrading.com/ActiveTrader/',
  },
  DHOW_CSD: {
    accountId: '393076-0004',
    portalUrl: 'https://dhowcsd.centralbank.go.ke',
  },
} as const;

// Deterministic pseudo-random number generator based on seed (for consistent daily data)
function seedRandom(seedStr: string): () => number {
  let h = 1779033703 ^ seedStr.length;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function() {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

// Core stock definitions with base stats
const STOCKS_POOL = [
  { ticker: 'SCOM', name: 'Safaricom PLC', basePrice: 25.50, volatility: 0.02, isBullish: true },
  { ticker: 'EQTY', name: 'Equity Group Holdings', basePrice: 55.25, volatility: 0.03, isBullish: true },
  { ticker: 'KCB', name: 'KCB Group', basePrice: 38.75, volatility: 0.025, isBullish: false },
  { ticker: 'EABL', name: 'East African Breweries', basePrice: 185.00, volatility: 0.015, isBullish: true },
  { ticker: 'COOP', name: 'Co-operative Bank', basePrice: 16.40, volatility: 0.012, isBullish: false },
  { ticker: 'ABSA', name: 'Absa Bank Kenya', basePrice: 14.85, volatility: 0.018, isBullish: true },
  { ticker: 'BATK', name: 'BAT Kenya', basePrice: 420.00, volatility: 0.01, isBullish: false },
  { ticker: 'BAMB', name: 'Bamburi Cement', basePrice: 32.80, volatility: 0.035, isBullish: true },
  { ticker: 'KENGEN', name: 'KenGen', basePrice: 3.85, volatility: 0.02, isBullish: true },
  { ticker: 'KPLC', name: 'Kenya Power & Lighting', basePrice: 2.45, volatility: 0.05, isBullish: false },
  { ticker: 'SASINI', name: 'Sasini PLC', basePrice: 12.50, volatility: 0.04, isBullish: true },
  { ticker: 'IMHC', name: 'I&M Holdings', basePrice: 42.50, volatility: 0.015, isBullish: false },
  { ticker: 'JBIC', name: 'Jubilee Holdings', basePrice: 280.00, volatility: 0.01, isBullish: true },
  { ticker: 'SCBK', name: 'Standard Chartered Bank', basePrice: 168.00, volatility: 0.012, isBullish: false },
  { ticker: 'DTK', name: 'Diamond Trust Bank Kenya Ltd', basePrice: 143.00, volatility: 0.02, isBullish: true },
  { ticker: 'IFB1/2026/10Yr', name: 'CBK Infrastructure Bond IFB1/2026/10Yr', basePrice: 18.25, volatility: 0.002, isBullish: true }
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SignalsResponse | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    
    const signals: AssetSignal[] = STOCKS_POOL.map(stock => {
      // Create seed unique to stock and date
      const rng = seedRandom(`${stock.ticker}-${dateStr}`);
      
      // Generate 30 days of historical closing prices to compute indicators
      const prices: number[] = [];
      let currentPrice = stock.basePrice;
      
      // We simulate 30 steps of price path
      for (let i = 0; i < 30; i++) {
        // Daily drift: upward if bullish, downward if bearish
        const drift = stock.isBullish ? 0.001 : -0.001;
        // Random daily change
        const changePercent = (rng() - 0.5) * 2 * stock.volatility + drift;
        currentPrice = currentPrice * (1 + changePercent);
        prices.push(currentPrice);
      }
      
      // Latest current price
      const latestPrice = parseFloat(prices[prices.length - 1].toFixed(2));
      const previousPrice = prices[prices.length - 2];
      const priceChangePercent = parseFloat((((latestPrice - previousPrice) / previousPrice) * 100).toFixed(2));
      
      // Calculate 20-day Simple Moving Average
      const last20Prices = prices.slice(-20);
      const sum20 = last20Prices.reduce((sum, p) => sum + p, 0);
      const ma20 = parseFloat((sum20 / 20).toFixed(2));
      
      // Calculate 14-day RSI (Relative Strength Index)
      const last15Prices = prices.slice(-15); // Need 15 prices for 14 changes
      let gainsSum = 0;
      let lossesSum = 0;
      
      for (let i = 1; i < last15Prices.length; i++) {
        const diff = last15Prices[i] - last15Prices[i - 1];
        if (diff > 0) {
          gainsSum += diff;
        } else {
          lossesSum += Math.abs(diff);
        }
      }
      
      const avgGain = gainsSum / 14;
      const avgLoss = lossesSum / 14;
      
      let rsi = 50; // Neutral fallback
      if (avgLoss === 0) {
        rsi = 100;
      } else {
        const rs = avgGain / avgLoss;
        rsi = Math.round(100 - (100 / (1 + rs)));
      }
      
      // Calculate volume spike
      const volumeBase = 1000000 + Math.round(rng() * 5000000);
      const volume = Math.round(volumeBase * (1 + (rng() - 0.2) * 0.5));
      
      // Determine Signal Status based on technical rules:
      // BUY: Oversold (RSI < 35) OR breakout above 20MA
      // SELL: Overbought (RSI > 65) OR drop below 20MA
      // HOLD: Otherwise
      let signalStatus: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
      let reasoning = 'Consolidating within neutral indicators range.';
      
      if (rsi < 35) {
        signalStatus = 'BUY';
        reasoning = `Asset is technically oversold (RSI: ${rsi}). Strong potential rebound candidate.`;
      } else if (latestPrice > ma20 * 1.015 && rsi < 60) {
        signalStatus = 'BUY';
        reasoning = `Bullish breakout. Price crossed above the 20-day MA (${ma20}) on strong volume.`;
      } else if (rsi > 65) {
        signalStatus = 'SELL';
        reasoning = `Asset is technically overbought (RSI: ${rsi}). High risk of profit-taking correction.`;
      } else if (latestPrice < ma20 * 0.985) {
        signalStatus = 'SELL';
        reasoning = `Bearish breakdown. Price has slipped below the 20-day MA (${ma20}) support level.`;
      } else if (rsi > 55) {
        reasoning = 'Bullish bias, holding above moving average support.';
      } else if (rsi < 45) {
        reasoning = 'Bearish pressure, trading near key support zones.';
      }
      
      const assetType = stock.ticker.startsWith('IFB') ? ('IFB' as const) : ('EQUITY' as const);
      const portalUrl = assetType === 'EQUITY'
        ? BROKER_REGISTRY.STERLING_CAPITAL.portalUrl
        : BROKER_REGISTRY.DHOW_CSD.portalUrl;

      // Customize reasoning for simulated bonds
      if (assetType === 'IFB') {
        signalStatus = 'BUY';
        reasoning = `High-yield sovereign infrastructure bond. Attractive tax-exempt risk-adjusted returns (Yield: ${latestPrice}%).`;
      }

      return {
        ticker: stock.ticker,
        name: stock.name,
        currentPrice: latestPrice,
        priceChangePercent,
        rsi14: rsi,
        movingAverage20Day: ma20,
        volume,
        signalStatus,
        timestamp: new Date().toISOString(),
        reasoning,
        assetType,
        portalUrl
      };
    });
    
    // Aggregate status statistics
    const totalAssets = signals.length;
    const buyCount = signals.filter(s => s.signalStatus === 'BUY').length;
    const holdCount = signals.filter(s => s.signalStatus === 'HOLD').length;
    const sellCount = signals.filter(s => s.signalStatus === 'SELL').length;
    
    // Calculate overall market sentiment (percentage of BUY & HOLD vs SELL, or strictly BUY)
    const marketSentiment = Math.round((buyCount / totalAssets) * 100);
    
    const responseData: SignalsResponse = {
      date: dateStr,
      marketSentiment,
      totalAssets,
      buyCount,
      holdCount,
      sellCount,
      signals
    };
    
    res.status(200).json(responseData);
  } catch (err) {
    console.error('Error generating trading signals:', err);
    res.status(500).json({ error: 'Failed to ingest and compute signal data' });
  }
}
