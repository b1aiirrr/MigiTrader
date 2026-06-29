import type { NextApiRequest, NextApiResponse } from 'next';
import https from 'https';
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
  debug?: any;
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
    const start = Date.now();
    const res2 = await fetch('https://live.mystocks.co.ke/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: AbortSignal.timeout(5000)
    });
    const text = await res2.text();
    res.status(200).json({
      success: res2.ok,
      status: res2.status,
      time: Date.now() - start,
      preview: text.substring(0, 300)
    } as any);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
}
