import type { NextApiRequest, NextApiResponse } from 'next';
import { getDailyInsights } from '../../lib/getDailyInsights';
import type { DailyInsights, APIConfig, RedisConfig } from '../../lib/types';

// Mock data for when API keys aren't configured
const MOCK_INSIGHTS: DailyInsights = {
    date: new Date().toISOString().split('T')[0],
    marketSummary: {
        totalVolume: 45000000,
        advancers: 12,
        decliners: 8,
        unchanged: 5,
    },
    picks: [
        {
            ticker: 'SCOM',
            name: 'Safaricom PLC',
            currentPrice: 25.50,
            entryPoint: 25.00,
            stopLoss: 23.75,
            targetPrice: 27.50,
            reasoning: 'Strong dividend yield (5.8%) + 15% volume spike. M-Pesa revenue growth expected.',
            momentumScore: 75,
            dividendScore: 85,
            totalScore: 79,
            volumeSpike: 15.2,
        },
        {
            ticker: 'EABL',
            name: 'East African Breweries Ltd',
            currentPrice: 185.00,
            entryPoint: 183.60,
            stopLoss: 171.00,
            targetPrice: 203.50,
            reasoning: 'High dividend yield (6.2%) with strong consumer staples resilience.',
            momentumScore: 68,
            dividendScore: 78,
            totalScore: 72,
            volumeSpike: 12.8,
        },
        {
            ticker: 'IMHC',
            name: 'I&M Holdings',
            currentPrice: 42.50,
            entryPoint: 41.80,
            stopLoss: 38.95,
            targetPrice: 46.75,
            reasoning: 'Highest banking dividend yield (7.1%) with improving ROE from recent acquisition.',
            momentumScore: 65,
            dividendScore: 82,
            totalScore: 72,
            volumeSpike: 11.5,
        },
    ],
    cacheHit: false,
    dataFreshnessMinutes: 0,
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<DailyInsights | { error: string }>
) {
    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Check if API keys are configured
        const hasApiKeys = process.env.NEXT_PUBLIC_NSE_API_URL && process.env.REDIS_URL;

        if (!hasApiKeys) {
            // Return mock data if no API keys configured
            console.log('📊 Using mock data (API keys not configured)');
            return res.status(200).json(MOCK_INSIGHTS);
        }

        // API Configuration from environment variables
        const apiConfig: APIConfig = {
            baseUrl: process.env.NEXT_PUBLIC_NSE_API_URL || '',
            apiKey: process.env.NEXT_PUBLIC_NSE_API_KEY || '',
            timeout: 10000,
            retryAttempts: 3,
        };

        // Redis Configuration
        const redisConfig: RedisConfig = {
            url: process.env.REDIS_URL || '',
            password: process.env.REDIS_PASSWORD,
            ttl: 900, // 15 minutes
        };

        // Fetch daily insights
        const insights = await getDailyInsights(apiConfig, redisConfig);

        // Return data
        res.status(200).json(insights);
    } catch (error) {
        console.error('API Error:', error);

        // Fallback to mock data on error
        console.log('⚠️ API error, returning mock data as fallback');
        res.status(200).json(MOCK_INSIGHTS);
    }
}
