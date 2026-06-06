import { NextResponse } from 'next/server';
import { fetchLiveEquityData, getActiveBonds } from '@/lib/nse-market-data';
import { calculateMomentumScore } from '@/lib/strategy-engine';
import type { NSEStock } from '@/lib/types';

export const dynamic = 'force-dynamic';

// ─────────────────────────────────────────────────────────────────────────────
// 1. BROKER REGISTRY — Strict execution endpoint mapping for MigiTrader V2
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Each registered broker/platform entry carries a unique client identifier
 * and the direct portal URL used for trade execution or settlement.
 */
interface BrokerEntry {
  readonly clientCode?: string;
  readonly accountId?: string;
  readonly portalUrl: string;
}

/**
 * Exhaustive union of active platform keys.
 * Extending this type automatically enforces that BROKER_REGISTRY stays in sync.
 */
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

// ─────────────────────────────────────────────────────────────────────────────
// 2. TYPESCRIPT INTERFACES — Signal model with dynamic portal routing
// ─────────────────────────────────────────────────────────────────────────────

/** Supported asset classes in the MigiTrader signal pipeline. */
type AssetClass = 'EQUITY' | 'IFB';

export interface AssetSignal {
  readonly assetName: string;
  readonly ticker: string;
  readonly assetType: AssetClass;
  readonly currentValue: string;
  readonly metricDetails: string;
  readonly portalUrl: string;
  readonly triggerAlert: boolean;
  /** Strategy engine score (0–100) for equities, undefined for bonds */
  readonly score?: number;
  readonly peRatio?: number;
  readonly eps?: number;
}

/**
 * Resolves the correct execution portal URL based on asset class.
 *  - EQUITY  → Sterling Capital dashboard
 *  - IFB     → DhowCSD web portal
 */
function resolvePortalUrl(assetType: AssetClass): string {
  switch (assetType) {
    case 'EQUITY':
      return BROKER_REGISTRY.STERLING_CAPITAL.portalUrl;
    case 'IFB':
      return BROKER_REGISTRY.DHOW_CSD.portalUrl;
    default: {
      // Exhaustive check — TypeScript will error if a new AssetClass is added
      // but not handled here.
      const _exhaustive: never = assetType;
      throw new Error(`Unhandled asset class: ${_exhaustive}`);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. UTILITIES — MarkdownV2 Safe Escaper for Telegram Parser
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Escapes all Telegram MarkdownV2 special characters.
 *
 * Per the Telegram Bot API docs the following characters must be escaped
 * with a preceding backslash when they appear *outside* of code spans:
 *   _ * [ ] ( ) ~ ` > # + - = | { } . !
 *
 * The backslash itself must be escaped first to avoid double-escaping.
 *
 * @see https://core.telegram.org/bots/api#markdownv2-style
 */
function escapeMarkdown(text: string): string {
  // 1. Escape the backslash first
  return text.replace(/\\/g, '\\\\')
    // 2. Escape every other MarkdownV2 special character in a single pass
    .replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. TELEGRAM BOT INTEGRATION — Institutional-grade alert formatter
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Builds and dispatches an institutional-grade MarkdownV2 Telegram alert.
 *
 * Layout varies by asset class:
 *  - EQUITY → includes Sterling Capital broker line with Client Code
 *  - IFB    → includes DhowCSD settlement gateway with CSD Account
 */
async function sendTelegramAlert(signal: AssetSignal): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.warn(
      '⚠️ Telegram bot credentials missing in process.env ' +
      '(TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID). Skipping dispatch.'
    );
    return false;
  }

  // ── Compose message sections ──────────────────────────────────────────

  const emoji = signal.assetType === 'IFB' ? '💎' : '📈';

  const header = [
    `*${emoji} NEW SIGNAL: ${escapeMarkdown(signal.assetName)}*`,
    `\\(\`${escapeMarkdown(signal.ticker)}\`\\)`,
  ].join(' ');

  const assetClassLine = `*Asset Class:* _${escapeMarkdown(signal.assetType)}_`;
  const valueLine      = `*Current Value:* \`${escapeMarkdown(signal.currentValue)}\``;
  const metricsLine    = `*Metrics:* _${escapeMarkdown(signal.metricDetails)}_`;

  // ── Score line (equities only) ────────────────────────────────────────

  const scoreLine = signal.score !== undefined
    ? `📊 *Signal Score:* ${escapeMarkdown(String(signal.score))}/100`
    : null;

  // ── Broker / Settlement metadata (asset-class–specific) ───────────────

  let executionLine: string;

  if (signal.assetType === 'EQUITY') {
    const broker = BROKER_REGISTRY.STERLING_CAPITAL;
    executionLine =
      `🔑 *Execution Broker:* Sterling Capital ` +
      `\\(Client: ${escapeMarkdown(broker.clientCode!)}\\)`;
  } else {
    const csd = BROKER_REGISTRY.DHOW_CSD;
    executionLine =
      `🏛️ *Settlement Gateway:* DhowCSD ` +
      `\\(Account: ${escapeMarkdown(csd.accountId!)}\\)`;
  }

  // ── Timestamp ─────────────────────────────────────────────────────────

  const timeLine = `*Dispatch Time:* ${escapeMarkdown(new Date().toISOString())}`;

  // ── Assemble full message ─────────────────────────────────────────────

  const messageParts = [
    header,
    '',
    assetClassLine,
    valueLine,
    metricsLine,
    ...(scoreLine ? [scoreLine] : []),
    executionLine,
    '',
    timeLine,
  ];

  const messageText = messageParts.join('\n');

  // ── Inline keyboard action button ─────────────────────────────────────

  const buttonLabel =
    signal.assetType === 'EQUITY'
      ? '🚀 Open Sterling Capital'
      : '🏛️ Open DhowCSD Portal';

  const payload = {
    chat_id: chatId,
    text: messageText,
    parse_mode: 'MarkdownV2' as const,
    reply_markup: {
      inline_keyboard: [
        [{ text: buttonLabel, url: signal.portalUrl }],
      ],
    },
  };

  // ── Dispatch to Telegram Bot API ──────────────────────────────────────

  const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

  try {
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error(
        `❌ Telegram sendMessage returned ${response.status}: ${errBody}`
      );
      return false;
    }

    console.log(`✅ Telegram alert dispatched for ${signal.ticker}`);
    return true;
  } catch (error: unknown) {
    console.error(
      `❌ Exception sending Telegram alert for ${signal.ticker}:`,
      error instanceof Error ? error.message : error
    );
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. SIGNAL BUILDERS — Convert live data to AssetSignal[]
// ─────────────────────────────────────────────────────────────────────────────

/** Configurable minimum score to trigger an equity alert (default: 40). */
const SCORE_THRESHOLD = parseInt(process.env.SIGNAL_SCORE_THRESHOLD ?? '40', 10);

/**
 * Builds a human-readable metric summary for an equity based on live data.
 */
function buildEquityMetrics(stock: NSEStock, momentumScore: number): string {
  const priceChange = ((stock.currentPrice - stock.previousClose) / stock.previousClose) * 100;
  const volumeSpike = ((stock.volume - stock.averageVolume) / stock.averageVolume) * 100;
  const maPosition = stock.currentPrice >= stock.movingAverage20Day ? 'above' : 'below';

  const parts: string[] = [];

  if (Math.abs(priceChange) >= 0.01) {
    parts.push(`${priceChange >= 0 ? '▲' : '▼'} ${Math.abs(priceChange).toFixed(2)}% day change`);
  }

  if (volumeSpike > 10) {
    parts.push(`${volumeSpike.toFixed(0)}% volume spike`);
  }

  parts.push(`Trading ${maPosition} 50-day MA`);
  parts.push(`Momentum score: ${momentumScore}/100`);

  if (stock.dividendYield && stock.dividendYield > 0) {
    parts.push(`Div yield: ${stock.dividendYield.toFixed(2)}%`);
  }

  return parts.join('. ') + '.';
}

/**
 * Converts live NSEStock data into scored AssetSignal objects.
 * Only stocks with momentumScore >= SCORE_THRESHOLD trigger alerts.
 */
function buildEquitySignals(stocks: NSEStock[]): AssetSignal[] {
  return stocks.map((stock) => {
    const momentumScore = calculateMomentumScore(stock);
    const shouldAlert = momentumScore >= SCORE_THRESHOLD;

    return {
      assetName: stock.name,
      ticker: stock.ticker,
      assetType: 'EQUITY' as const,
      currentValue: `KES ${stock.currentPrice.toFixed(2)}`,
      metricDetails: buildEquityMetrics(stock, momentumScore),
      portalUrl: resolvePortalUrl('EQUITY'),
      triggerAlert: shouldAlert,
      score: momentumScore,
      peRatio: stock.peRatio,
      eps: stock.eps,
    };
  });
}

/**
 * Converts the bond watchlist into AssetSignal objects.
 */
function buildBondSignals(): AssetSignal[] {
  const bonds = getActiveBonds();

  return bonds.map((bond) => ({
    assetName: bond.issueName,
    ticker: bond.ticker,
    assetType: 'IFB' as const,
    currentValue: `${bond.yield.toFixed(2)}% Yield`,
    metricDetails:
      `Coupon: ${bond.couponRate}%. ` +
      `Maturity: ${bond.maturityDate}. ` +
      `Tax-exempt infrastructure bond with attractive risk-adjusted income.`,
    portalUrl: resolvePortalUrl('IFB'),
    triggerAlert: bond.triggerAlert,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. HTTP GET HANDLER — Live signal pipeline entry point
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(): Promise<NextResponse> {
  try {
    // ── Fetch live equity data from Yahoo Finance ─────────────────────────
    const equityResult = await fetchLiveEquityData();

    const equitySignals: AssetSignal[] = equityResult.success && equityResult.data
      ? buildEquitySignals(equityResult.data)
      : [];

    // ── Build bond signals from configured watchlist ──────────────────────
    const bondSignals = buildBondSignals();

    // ── Merge all signals ────────────────────────────────────────────────
    const allSignals: AssetSignal[] = [...equitySignals, ...bondSignals];

    const dispatchedTickers: string[] = [];
    const failedTickers: string[] = [];
    const skippedTickers: string[] = [];

    // ── Sequential dispatch — preserves Telegram rate-limit compliance ──
    for (const signal of allSignals) {
      if (!signal.triggerAlert) {
        skippedTickers.push(signal.ticker);
        continue;
      }

      const success = await sendTelegramAlert(signal);
      (success ? dispatchedTickers : failedTickers).push(signal.ticker);
    }

    return NextResponse.json({
      success: true,
      dataSource: equityResult.success ? 'LIVE' : 'UNAVAILABLE',
      dataError: equityResult.error ?? undefined,
      scoreThreshold: SCORE_THRESHOLD,
      signals: allSignals.map((s) => ({
        ticker: s.ticker,
        assetName: s.assetName,
        assetType: s.assetType,
        currentValue: s.currentValue,
        score: s.score,
        portalUrl: s.portalUrl,
        triggerAlert: s.triggerAlert,
        peRatio: s.peRatio,
        eps: s.eps,
      })),
      dispatchedTickers,
      failedTickers: failedTickers.length > 0 ? failedTickers : undefined,
      skippedTickers: skippedTickers.length > 0 ? skippedTickers : undefined,
      totalSignals: allSignals.length,
      totalDispatched: dispatchedTickers.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('❌ Critical failure in GET signals pipeline:', error);

    return NextResponse.json(
      {
        success: false,
        error:
          'Failed to process signal queue and dispatch bot intelligence indicators',
        details:
          error instanceof Error ? error.message : 'Unknown internal system error',
      },
      { status: 500 }
    );
  }
}
