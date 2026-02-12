import { getRedisClient } from './redis-cache';
import { generateStockPicks } from './strategy-engine';
import type {
    APIConfig,
    RedisConfig,
    NSEStock,
    DividendAnnouncement,
    DailyInsights,
} from './types';

/**
 * Main function to fetch daily NSE insights
 * Implements caching, retry logic, and mobile optimization
 */
export async function getDailyInsights(
    apiConfig: APIConfig,
    redisConfig: RedisConfig
): Promise<DailyInsights> {
    const cacheKey = `migitrader:daily:${getTodayDate()}`;
    const redis = getRedisClient(redisConfig);

    // Step 1: Check cache first
    console.log('📊 Checking cache for daily insights...');
    const cachedData = await redis.get<DailyInsights>(cacheKey);

    if (cachedData) {
        console.log('✅ Cache hit! Returning cached data');
        return {
            ...cachedData,
            cacheHit: true,
        };
    }

    console.log('⚠️ Cache miss. Fetching from API...');

    // Step 2: Fetch market data from NSE API
    const stocks = await fetchNSEMarketData(apiConfig);

    // Step 3: Fetch recent dividend announcements
    const dividends = await fetchRecentDividends(apiConfig);

    // Step 4: Generate stock picks using strategy engine
    const picks = generateStockPicks(stocks, dividends, 3);

    // Step 5: Calculate market summary
    const marketSummary = calculateMarketSummary(stocks);

    // Step 6: Construct insights object
    const insights: DailyInsights = {
        date: getTodayDate(),
        marketSummary,
        picks,
        cacheHit: false,
        dataFreshnessMinutes: 0,
    };

    // Step 7: Cache the results
    await redis.set(cacheKey, insights);
    console.log('✅ Insights cached successfully');

    return insights;
}

/**
 * Fetch NSE market data with retry logic and mobile optimization
 */
async function fetchNSEMarketData(
    config: APIConfig
): Promise<NSEStock[]> {
    const url = `${config.baseUrl}/market-data/stocks`;

    for (let attempt = 1; attempt <= config.retryAttempts; attempt++) {
        try {
            console.log(`🔄 Fetching market data (attempt ${attempt})...`);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${config.apiKey}`,
                    'Content-Type': 'application/json',
                    'Accept-Encoding': 'gzip, deflate', // Request compression
                },
                signal: AbortSignal.timeout(config.timeout),
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log(`✅ Fetched ${data.stocks?.length || 0} stocks`);

            return data.stocks as NSEStock[];
        } catch (error) {
            console.error(`❌ Attempt ${attempt} failed:`, error);

            if (attempt === config.retryAttempts) {
                throw new Error(`Failed to fetch market data after ${attempt} attempts`);
            }

            // Exponential backoff: 1s, 2s, 4s
            const backoffMs = Math.pow(2, attempt - 1) * 1000;
            console.log(`⏳ Retrying in ${backoffMs}ms...`);
            await sleep(backoffMs);
        }
    }

    // Fallback: return empty array (should never reach here)
    return [];
}

/**
 * Fetch recent dividend announcements
 */
async function fetchRecentDividends(
    config: APIConfig
): Promise<DividendAnnouncement[]> {
    const url = `${config.baseUrl}/dividends/recent?days=30`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${config.apiKey}`,
                'Content-Type': 'application/json',
            },
            signal: AbortSignal.timeout(config.timeout),
        });

        if (!response.ok) {
            console.warn('⚠️ Dividend data unavailable, using fallback');
            return [];
        }

        const data = await response.json();
        return data.dividends as DividendAnnouncement[];
    } catch (error) {
        console.error('❌ Failed to fetch dividends:', error);
        return [];
    }
}

/**
 * Calculate market summary statistics
 */
function calculateMarketSummary(stocks: NSEStock[]) {
    const totalVolume = stocks.reduce((sum, s) => sum + s.volume, 0);
    const advancers = stocks.filter(
        (s) => s.currentPrice > s.previousClose
    ).length;
    const decliners = stocks.filter(
        (s) => s.currentPrice < s.previousClose
    ).length;
    const unchanged = stocks.length - advancers - decliners;

    return {
        totalVolume,
        advancers,
        decliners,
        unchanged,
    };
}

/**
 * Get today's date in YYYY-MM-DD format (Nairobi timezone)
 */
function getTodayDate(): string {
    const now = new Date();
    const nairobiTime = new Date(
        now.toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })
    );

    const year = nairobiTime.getFullYear();
    const month = String(nairobiTime.getMonth() + 1).padStart(2, '0');
    const day = String(nairobiTime.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

/**
 * Sleep utility for retry backoff
 */
function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Example usage:
 * 
 * const apiConfig: APIConfig = {
 *   baseUrl: process.env.NSE_API_URL!,
 *   apiKey: process.env.NSE_API_KEY!,
 *   timeout: 10000,
 *   retryAttempts: 3,
 * };
 * 
 * const redisConfig: RedisConfig = {
 *   url: process.env.REDIS_URL!,
 *   password: process.env.REDIS_PASSWORD,
 *   ttl: 900, // 15 minutes
 * };
 * 
 * const insights = await getDailyInsights(apiConfig, redisConfig);
 */
