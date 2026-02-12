// Type definitions for NSE stock data and MigiTrader engine

export interface NSEStock {
  ticker: string;
  name: string;
  currentPrice: number;
  previousClose: number;
  volume: number;
  averageVolume: number; // 20-day average
  marketCap: number;
  dividendYield?: number;
  lastDividendDate?: string;
  high52Week: number;
  low52Week: number;
  movingAverage20Day: number;
}

export interface DividendAnnouncement {
  ticker: string;
  announcementDate: string;
  exDividendDate: string;
  dividendPerShare: number;
  yield: number;
}

export interface StockPick {
  ticker: string;
  name: string;
  currentPrice: number;
  entryPoint: number;
  stopLoss: number;
  targetPrice: number;
  reasoning: string;
  momentumScore: number;
  dividendScore: number;
  totalScore: number;
  volumeSpike: number; // Percentage increase vs average
}

export interface DailyInsights {
  date: string;
  marketSummary: {
    totalVolume: number;
    advancers: number;
    decliners: number;
    unchanged: number;
  };
  picks: StockPick[];
  cacheHit: boolean;
  dataFreshnessMinutes: number;
}

export interface APIConfig {
  baseUrl: string;
  apiKey: string;
  timeout: number;
  retryAttempts: number;
}

export interface RedisConfig {
  url: string;
  password?: string;
  ttl: number; // Time to live in seconds
}
