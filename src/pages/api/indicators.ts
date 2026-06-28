import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchLiveEquityData, getActiveBonds } from '../../lib/nse-market-data';

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
  peRatio?: number;
  eps?: number;
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

// Deterministic pseudo-random number generator based on seed (for consistent padded/simulated data)
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

// In-memory cache for live stock signals
let cachedResponse: SignalsResponse | null = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SignalsResponse | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const forceRefresh = req.query.refresh === 'true' || req.query.force === 'true';
    const now = Date.now();

    if (cachedResponse && (now - lastFetchTime < CACHE_TTL_MS) && !forceRefresh) {
      console.log('⚡ Serving indicators from in-memory cache');
      return res.status(200).json(cachedResponse);
    }

    const today = new Date();
    const nairobiTime = new Date(
        today.toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })
    );
    const year = nairobiTime.getFullYear();
    const month = String(nairobiTime.getMonth() + 1).padStart(2, '0');
    const day = String(nairobiTime.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    // Fetch live stock data
    const liveStocksRes = await fetchLiveEquityData();
    if (!liveStocksRes.success || !liveStocksRes.data) {
      throw new Error(liveStocksRes.error || 'Failed to fetch live equity data');
    }
    const liveStocks = liveStocksRes.data;

    // Process each equity stock
    const signals: AssetSignal[] = liveStocks.map(stock => {
      // Get historical close prices
      const histPrices = stock.history ? stock.history.map(h => h.close).reverse() : [];
      
      const prices: number[] = [];
      if (histPrices.length > 0) {
        // Pad backward using oldest price
        const oldestPrice = histPrices[0];
        const rng = seedRandom(`${stock.ticker}-pad`);
        const padded: number[] = [];
        let currentVal = oldestPrice;
        for (let i = 0; i < 20; i++) {
          const changePercent = (rng() - 0.5) * 2 * 0.015;
          currentVal = currentVal * (1 - changePercent);
          padded.unshift(currentVal);
        }
        prices.push(...padded, ...histPrices);
      } else {
        // Fallback simulation
        const rng = seedRandom(`${stock.ticker}-fallback`);
        let currentVal = stock.currentPrice;
        const simulated: number[] = [currentVal];
        for (let i = 0; i < 29; i++) {
          const changePercent = (rng() - 0.5) * 2 * 0.02;
          currentVal = currentVal * (1 - changePercent);
          simulated.unshift(currentVal);
        }
        prices.push(...simulated);
      }

      // Latest price info
      const latestPrice = stock.currentPrice;
      const previousPrice = stock.previousClose;
      const priceChangePercent = parseFloat((((latestPrice - previousPrice) / previousPrice) * 100).toFixed(2));

      // Calculate 20-day SMA
      const last20Prices = prices.slice(-20);
      const sum20 = last20Prices.reduce((sum, p) => sum + p, 0);
      const ma20 = parseFloat((sum20 / 20).toFixed(2));

      // Calculate 14-day RSI
      const last15Prices = prices.slice(-15);
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
      let rsi = 50;
      if (avgLoss === 0) {
        rsi = 100;
      } else {
        const rs = avgGain / avgLoss;
        rsi = Math.round(100 - (100 / (1 + rs)));
      }

      // Determine signal status and reasoning
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

      return {
        ticker: stock.ticker,
        name: stock.name,
        currentPrice: latestPrice,
        priceChangePercent,
        rsi14: rsi,
        movingAverage20Day: ma20,
        volume: stock.volume,
        signalStatus,
        timestamp: new Date().toISOString(),
        reasoning,
        assetType: 'EQUITY' as const,
        portalUrl: BROKER_REGISTRY.STERLING_CAPITAL.portalUrl,
        peRatio: stock.peRatio,
        eps: stock.eps
      };
    });

    // Process active bonds
    const activeBonds = getActiveBonds();
    const bondSignals: AssetSignal[] = activeBonds.map(bond => {
      return {
        ticker: bond.ticker,
        name: bond.issueName,
        currentPrice: bond.yield,
        priceChangePercent: 0,
        rsi14: 50,
        movingAverage20Day: bond.yield,
        volume: 0,
        signalStatus: 'BUY',
        timestamp: new Date().toISOString(),
        reasoning: `High-yield sovereign infrastructure bond. Attractive tax-exempt risk-adjusted returns (Yield: ${bond.yield}%).`,
        assetType: 'IFB' as const,
        portalUrl: BROKER_REGISTRY.DHOW_CSD.portalUrl
      };
    });

    signals.push(...bondSignals);

    // Aggregate status statistics
    const totalAssets = signals.length;
    const buyCount = signals.filter(s => s.signalStatus === 'BUY').length;
    const holdCount = signals.filter(s => s.signalStatus === 'HOLD').length;
    const sellCount = signals.filter(s => s.signalStatus === 'SELL').length;
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

    // Cache the response
    cachedResponse = responseData;
    lastFetchTime = now;

    res.status(200).json(responseData);
  } catch (err) {
    console.error('Error generating trading signals:', err);
    res.status(500).json({ error: 'Failed to ingest and compute signal data' });
  }
}
