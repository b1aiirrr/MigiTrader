import dns from 'dns';

if (dns && typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

import type {
  NSEStock,
  EquityWatchlistEntry,
  BondConfig,
  DataFetchResult,
} from './types';

// ─────────────────────────────────────────────────────────────────────────────
// 1. EQUITY WATCHLIST — NSE tickers mapped to their afx.kwayisi.org pages
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Active equity watchlist. Add/remove tickers here to change what the
 * signal pipeline monitors.
 *
 * This can be overridden at runtime via the EQUITY_WATCHLIST env var
 * (comma-separated NSE tickers, e.g. "SCOM,EQTY,KCB,DTK").
 */
const DEFAULT_EQUITY_WATCHLIST: readonly EquityWatchlistEntry[] = [
  { ticker: 'SCOM',   name: 'Safaricom PLC',                yahooSymbol: 'scom' },
  { ticker: 'EQTY',   name: 'Equity Group Holdings PLC',    yahooSymbol: 'eqty' },
  { ticker: 'KCB',    name: 'KCB Group PLC',                yahooSymbol: 'kcb'  },
  { ticker: 'EABL',   name: 'East African Breweries PLC',   yahooSymbol: 'eabl' },
  { ticker: 'COOP',   name: 'Co-operative Bank of Kenya',   yahooSymbol: 'coop' },
  { ticker: 'ABSA',   name: 'Absa Bank Kenya PLC',          yahooSymbol: 'absa' },
  { ticker: 'BAT',    name: 'BAT Kenya PLC',                yahooSymbol: 'bat'  },
  { ticker: 'BAMB',   name: 'Bamburi Cement PLC',           yahooSymbol: 'bamb' },
  { ticker: 'KEGN',   name: 'KenGen Co. PLC',               yahooSymbol: 'kengen' },
  { ticker: 'KPLC',   name: 'Kenya Power & Lighting Co.',   yahooSymbol: 'kplc' },
  { ticker: 'SASN',   name: 'Sasini PLC',                   yahooSymbol: 'sasini' },
  { ticker: 'IMH',    name: 'I&M Group PLC',                yahooSymbol: 'imh'  },
  { ticker: 'JUB',    name: 'Jubilee Holdings Ltd',         yahooSymbol: 'jub'  },
  { ticker: 'SCBK',   name: 'Standard Chartered Bank PLC',  yahooSymbol: 'scbk' },
  { ticker: 'DTK',    name: 'Diamond Trust Bank Kenya Ltd', yahooSymbol: 'dtk'  },
] as const;

/** Source URL for live NSE price list. */
const AFX_NSE_URL = 'https://afx.kwayisi.org/nse/';

// ─────────────────────────────────────────────────────────────────────────────
// 2. BOND WATCHLIST — CBK Infrastructure Bonds (updated at each auction)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Active IFB watchlist. Bond data is auction-based (not real-time) —
 * update these entries when new bonds are issued or auctioned by CBK.
 */
const BOND_WATCHLIST: readonly BondConfig[] = [
  {
    issueName: 'CBK Infrastructure Bond IFB1/2026/10Yr',
    ticker: 'IFB1/2026/10Yr',
    couponRate: 17.93,
    maturityDate: '2036-06-15',
    yield: 18.25,
    issueDate: '2026-05-20',
    triggerAlert: true,
  },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// 3. AFX.KWAYISI.ORG HTML PARSER — Extracts price data from the NSE page
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Raw parsed row from the afx.kwayisi.org price table.
 */
interface ParsedRow {
  ticker: string;
  volume: number;
  price: number;
  change: number;
}

/**
 * Parses the afx.kwayisi.org HTML to extract ticker, volume, price, change
 * from the main price table.
 *
 * The table structure is:
 *   <table> → <tbody> → <tr> → <td>TICKER</td><td>Name</td><td>Volume</td><td>Price</td><td>Change</td>
 *
 * We use regex parsing since we're in a Node.js serverless context
 * (no DOM available) and don't want heavy dependencies like cheerio.
 */
function parseAfxHtml(html: string): ParsedRow[] {
  const rows: ParsedRow[] = [];

  // Split by <tr to handle rows. The HTML may omit closing tags like </td> or </tr>.
  const trs = html.split(/<tr/i);

  for (const tr of trs) {
    // Split the row by <td
    const tds = tr.split(/<td/i);
    // A valid stock row has at least 5 <td> cells (split length >= 6)
    if (tds.length < 6) continue;

    // Extract ticker from 1st td (tds[1])
    // e.g. "<td><a href=.../scom.html ...>SCOM</a>"
    const tickerMatch = tds[1].match(/>\s*<a[^>]*>\s*([A-Z0-9-]+)\s*<\/a>/i);
    if (!tickerMatch) continue;
    const ticker = tickerMatch[1].toUpperCase();

    // Helper to get text inside <td> stripping outer tags/attributes
    const getCleanText = (tdText: string) => {
      const textOnly = tdText.replace(/^[^>]*>/, ''); // remove everything before first '>'
      return textOnly.replace(/<[^>]*>/g, '').trim();  // strip nested tags and trim
    };

    const volumeStr = getCleanText(tds[3]).replace(/,/g, '');
    const priceStr = getCleanText(tds[4]).replace(/,/g, '');
    const changeStr = getCleanText(tds[5]).replace(/,/g, '');

    const price = parseFloat(priceStr);
    const volume = volumeStr ? parseInt(volumeStr, 10) : 0;
    const change = changeStr ? parseFloat(changeStr) : 0;

    if (!isNaN(price) && price > 0) {
      rows.push({ ticker, volume, price, change });
    }
  }

  return rows;
}

/**
 * Parses the historical table data from a stock's detail page.
 * Returns an array of historical closing prices and volumes.
 */
function parseHistoricalTable(html: string): { close: number; volume: number }[] {
  const history: { close: number; volume: number }[] = [];
  const matchHistTable = html.match(/<table[^>]*data-hist[^>]*>([\s\S]*?)<\/table>/i);
  if (!matchHistTable) return history;
  
  const tbodyMatch = matchHistTable[1].match(/<tbody>([\s\S]*?)<\/tbody>/i);
  const tableBody = tbodyMatch ? tbodyMatch[1] : matchHistTable[1];
  
  const rows = tableBody.split(/<tr/i);
  for (const row of rows) {
    const tds = row.split(/<td/i);
    if (tds.length < 4) continue;
    
    const getCleanText = (tdText: string) => {
      const textOnly = tdText.replace(/^[^>]*>/, '');
      return textOnly.replace(/<[^>]*>/g, '').trim();
    };
    
    const volumeStr = getCleanText(tds[2]).replace(/,/g, '');
    const closeStr = getCleanText(tds[3]).replace(/,/g, '');
    
    const volume = volumeStr ? parseInt(volumeStr, 10) : 0;
    const close = parseFloat(closeStr);
    
    if (!isNaN(close) && close > 0) {
      history.push({ close, volume });
    }
  }
  return history;
}

/**
 * Resolves the effective equity watchlist.
 * If `EQUITY_WATCHLIST` env var is set (comma-separated tickers),
 * it filters the default list to only those tickers.
 */
function getEffectiveWatchlist(): EquityWatchlistEntry[] {
  const envList = process.env.EQUITY_WATCHLIST;
  if (!envList) return [...DEFAULT_EQUITY_WATCHLIST];

  const requestedTickers = new Set(
    envList.split(',').map((t) => t.trim().toUpperCase())
  );

  const filtered = DEFAULT_EQUITY_WATCHLIST.filter((entry) =>
    requestedTickers.has(entry.ticker)
  );

  if (filtered.length === 0) {
    console.warn(
      `⚠️ EQUITY_WATCHLIST="${envList}" matched no known tickers. Falling back to full default watchlist.`
    );
    return [...DEFAULT_EQUITY_WATCHLIST];
  }

  return filtered;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. PUBLIC API — Live data fetchers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetches live equity data from afx.kwayisi.org for all tickers in the
 * effective watchlist. Returns an array of NSEStock objects.
 *
 * On failure, returns null with error details — never throws.
 */
export async function fetchLiveEquityData(): Promise<DataFetchResult<NSEStock[]>> {
  const watchlist = getEffectiveWatchlist();
  const watchlistTickers = new Set(watchlist.map((e) => e.ticker));

  console.log(`📊 Fetching live NSE prices from afx.kwayisi.org for: ${[...watchlistTickers].join(', ')}`);

  try {
    const response = await fetch(AFX_NSE_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(8_000), // 8s timeout — must complete within Vercel's 10s limit
    });

    if (!response.ok) {
      throw new Error(`afx.kwayisi.org returned status ${response.status}`);
    }

    const html = await response.text();
    const allRows = parseAfxHtml(html);

    console.log(`📋 Parsed ${allRows.length} total tickers from NSE price list`);

    // Filter to only our watchlist tickers
    const matchedRows = allRows.filter((r) => watchlistTickers.has(r.ticker));

    // Skip detail page fetches on Vercel to stay within 10s serverless limit.
    // Detail pages provide P/E, EPS, and history which are nice-to-have.
    // The main price table gives us everything essential (price, volume, change).
    const detailsMap = new Map<string, { pe?: number; eps?: number; history?: { close: number; volume: number }[] }>();

    const stocks: NSEStock[] = matchedRows.map((row) => {
      const entry = watchlist.find((w) => w.ticker === row.ticker)!;
      const previousClose = row.price - row.change;
      const details = detailsMap.get(row.ticker);
      
      let averageVolume = row.volume;
      if (details?.history && details.history.length > 0) {
        const sumVol = details.history.reduce((sum, h) => sum + h.volume, 0);
        averageVolume = Math.round(sumVol / details.history.length);
      }

      return {
        ticker: entry.ticker,
        name: entry.name,
        currentPrice: row.price,
        previousClose: previousClose > 0 ? previousClose : row.price,
        volume: row.volume,
        averageVolume: averageVolume > 0 ? averageVolume : row.volume,
        marketCap: 0, // Not available from this source
        high52Week: row.price,
        low52Week: row.price,
        movingAverage20Day: previousClose > 0 ? previousClose : row.price, // Approximate with prev close
        peRatio: details?.pe,
        eps: details?.eps,
        history: details?.history,
      };
    });

    console.log(`✅ Matched ${stocks.length}/${watchlist.length} watchlist tickers with live prices`);

    return {
      success: stocks.length > 0,
      data: stocks,
      timestamp: new Date().toISOString(),
      ...(stocks.length < watchlist.length && {
        error: `Partial data: ${stocks.length}/${watchlist.length} tickers resolved`,
      }),
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown fetch error';
    console.error(`❌ NSE data fetch failed: ${message}`);

    return {
      success: false,
      data: null,
      error: message,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Returns the active infrastructure bond watchlist.
 * Bonds are static auction-based instruments — no live fetch needed.
 */
export function getActiveBonds(): readonly BondConfig[] {
  return BOND_WATCHLIST;
}

/**
 * Returns the full effective equity watchlist (for reference/display).
 */
export function getEquityWatchlist(): EquityWatchlistEntry[] {
  return getEffectiveWatchlist();
}
