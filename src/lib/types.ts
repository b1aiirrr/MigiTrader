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
  peRatio?: number;
  eps?: number;
  history?: { close: number; volume: number }[];
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

// ─────────────────────────────────────────────────────────────────────────────
// Live Market Data Types — MigiTrader V2
// ─────────────────────────────────────────────────────────────────────────────

/** A ticker in the equity watchlist with its Yahoo Finance symbol mapping. */
export interface EquityWatchlistEntry {
  /** Local NSE ticker symbol, e.g. 'SCOM' */
  readonly ticker: string;
  /** Full company name */
  readonly name: string;
  /** Yahoo Finance symbol, e.g. 'SCOM.NR' */
  readonly yahooSymbol: string;
}

/** Configuration for a CBK infrastructure bond on the watchlist. */
export interface BondConfig {
  /** Bond issue name, e.g. 'CBK Infrastructure Bond IFB1/2026/10Yr' */
  readonly issueName: string;
  /** Bond ticker/reference, e.g. 'IFB1/2026/10Yr' */
  readonly ticker: string;
  /** Annual coupon rate as a percentage */
  readonly couponRate: number;
  /** Maturity date in YYYY-MM-DD format */
  readonly maturityDate: string;
  /** Yield to maturity as a percentage (set at auction) */
  readonly yield: number;
  /** Issue/auction date in YYYY-MM-DD format */
  readonly issueDate: string;
  /** Whether this bond should trigger alerts */
  readonly triggerAlert: boolean;
}

/** Wrapper for live data fetch results with graceful error handling. */
export interface DataFetchResult<T> {
  readonly success: boolean;
  readonly data: T | null;
  readonly error?: string;
  readonly timestamp: string;
}
