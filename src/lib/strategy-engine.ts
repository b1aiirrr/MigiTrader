import type {
    NSEStock,
    DividendAnnouncement,
    StockPick,
} from './types';

/**
 * MigiTrader Strategy Engine
 * Combines Dividend Yields and Momentum Trading for NSE stock selection
 */

// Blue-chip tickers to prioritize for dividend strategy
const BLUE_CHIP_TICKERS = ['SCOM', 'EABL', 'IMHC', 'KCB', 'EQTY'];

/**
 * Calculate momentum score based on volume spike and price movement
 * Score range: 0-100
 */
export function calculateMomentumScore(stock: NSEStock): number {
    const volumeSpike =
        ((stock.volume - stock.averageVolume) / stock.averageVolume) * 100;
    const priceChange =
        ((stock.currentPrice - stock.previousClose) / stock.previousClose) * 100;
    const trendStrength =
        ((stock.currentPrice - stock.movingAverage20Day) /
            stock.movingAverage20Day) *
        100;

    // Volume spike must be > 10% to qualify
    if (volumeSpike < 10) return 0;

    // Scoring formula
    let score = 0;

    // Volume component (40% weight)
    score += Math.min((volumeSpike / 50) * 40, 40); // Max 50% spike = 40 points

    // Price momentum component (30% weight)
    if (priceChange > 0) {
        score += Math.min((priceChange / 5) * 30, 30); // Max 5% gain = 30 points
    }

    // Trend confirmation component (30% weight)
    if (trendStrength > 0) {
        score += Math.min((trendStrength / 10) * 30, 30); // Max 10% above MA = 30 points
    }

    return Math.min(Math.round(score), 100);
}

/**
 * Calculate dividend score based on yield and recent announcements
 * Score range: 0-100
 */
export function calculateDividendScore(
    stock: NSEStock,
    recentDividends: DividendAnnouncement[]
): number {
    let score = 0;

    // Check for recent dividend announcement (within 30 days)
    const recentAnnouncement = recentDividends.find(
        (div) =>
            div.ticker === stock.ticker &&
            isWithinDays(div.announcementDate, 30)
    );

    if (recentAnnouncement) {
        score += 50; // 50 points for recent announcement

        // Bonus for blue-chip stocks
        if (BLUE_CHIP_TICKERS.includes(stock.ticker)) {
            score += 20;
        }
    }

    // Dividend yield component (30 points max)
    if (stock.dividendYield) {
        score += Math.min((stock.dividendYield / 10) * 30, 30); // 10% yield = 30 points
    }

    return Math.min(Math.round(score), 100);
}

/**
 * Calculate support level (entry point) using 20-day MA
 */
export function calculateEntryPoint(stock: NSEStock): number {
    // Entry point: 20-day MA + 2% buffer
    const entryPoint = stock.movingAverage20Day * 1.02;
    return parseFloat(entryPoint.toFixed(2));
}

/**
 * Calculate stop-loss level
 */
export function calculateStopLoss(stock: NSEStock): number {
    // Stop-loss: 20-day MA - 5%
    const stopLoss = stock.movingAverage20Day * 0.95;
    return parseFloat(stopLoss.toFixed(2));
}

/**
 * Calculate target price for day trades (8-12% gain target)
 */
export function calculateTargetPrice(stock: NSEStock): number {
    // Conservative target: current price + 10%
    const target = stock.currentPrice * 1.1;
    return parseFloat(target.toFixed(2));
}

/**
 * Generate stock picks using weighted scoring
 * 60% momentum, 40% dividend
 */
export function generateStockPicks(
    stocks: NSEStock[],
    recentDividends: DividendAnnouncement[],
    topN: number = 3
): StockPick[] {
    const scoredStocks: StockPick[] = stocks
        .map((stock) => {
            const momentumScore = calculateMomentumScore(stock);
            const dividendScore = calculateDividendScore(stock, recentDividends);

            // Weighted total score
            const totalScore = momentumScore * 0.6 + dividendScore * 0.4;

            // Filter: only stocks above 20-day MA and market cap > KES 5B
            if (
                stock.currentPrice < stock.movingAverage20Day ||
                stock.marketCap < 5_000_000_000
            ) {
                return null;
            }

            const volumeSpike =
                ((stock.volume - stock.averageVolume) / stock.averageVolume) * 100;

            // Generate reasoning
            let reasoning = '';
            if (momentumScore > dividendScore) {
                reasoning = `${volumeSpike.toFixed(1)}% volume spike with strong uptrend`;
            } else {
                const recentDiv = recentDividends.find(
                    (d) => d.ticker === stock.ticker
                );
                reasoning = recentDiv
                    ? `Recent dividend announcement (${stock.dividendYield?.toFixed(2)}% yield)`
                    : `High dividend yield (${stock.dividendYield?.toFixed(2)}%)`;
            }

            return {
                ticker: stock.ticker,
                name: stock.name,
                currentPrice: stock.currentPrice,
                entryPoint: calculateEntryPoint(stock),
                stopLoss: calculateStopLoss(stock),
                targetPrice: calculateTargetPrice(stock),
                reasoning,
                momentumScore,
                dividendScore,
                totalScore,
                volumeSpike,
            };
        })
        .filter((pick): pick is StockPick => pick !== null);

    // Sort by total score (descending) and return top N
    return scoredStocks
        .sort((a, b) => b.totalScore - a.totalScore)
        .slice(0, topN);
}

/**
 * Helper: Check if date is within N days
 */
function isWithinDays(dateString: string, days: number): boolean {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays <= days;
}
