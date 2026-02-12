import type { NextApiRequest, NextApiResponse } from 'next';
import { getDailyInsights } from '../../lib/getDailyInsights';
import type { DailyInsights, APIConfig, RedisConfig } from '../../lib/types';

// Mock data for when API keys aren't configured
const MOCK_INSIGHTS: DailyInsights = {
    date: new Date().toISOString().split('T')[0],
    marketSummary: {
        totalVolume: 82000000,
        advancers: 24,
        decliners: 18,
        unchanged: 12,
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
        {
            ticker: 'KCB',
            name: 'KCB Group',
            currentPrice: 38.75,
            entryPoint: 38.00,
            stopLoss: 35.50,
            targetPrice: 42.50,
            reasoning: 'Regional expansion momentum with 18% volume surge. Strong Q4 earnings expected.',
            momentumScore: 78,
            dividendScore: 65,
            totalScore: 73,
            volumeSpike: 18.3,
        },
        {
            ticker: 'EQTY',
            name: 'Equity Group Holdings',
            currentPrice: 55.25,
            entryPoint: 54.50,
            stopLoss: 51.00,
            targetPrice: 60.00,
            reasoning: 'Digital banking leader. 20-day MA breakout with strong fintech growth.',
            momentumScore: 82,
            dividendScore: 58,
            totalScore: 73,
            volumeSpike: 22.1,
        },
        {
            ticker: 'BAMB',
            name: 'Bamburi Cement',
            currentPrice: 32.80,
            entryPoint: 32.00,
            stopLoss: 29.50,
            targetPrice: 36.50,
            reasoning: 'Infrastructure boom catalyst. Dividend yield 5.5% with volume spike.',
            momentumScore: 70,
            dividendScore: 72,
            totalScore: 71,
            volumeSpike: 14.2,
        },
        {
            ticker: 'COOP',
            name: 'Co-operative Bank',
            currentPrice: 16.40,
            entryPoint: 16.00,
            stopLoss: 15.00,
            targetPrice: 18.00,
            reasoning: 'Value play with 6.8% dividend yield. Strong loan book growth.',
            momentumScore: 62,
            dividendScore: 76,
            totalScore: 68,
            volumeSpike: 9.8,
        },
        {
            ticker: 'ABSA',
            name: 'Absa Bank Kenya',
            currentPrice: 14.85,
            entryPoint: 14.50,
            stopLoss: 13.50,
            targetPrice: 16.20,
            reasoning: 'Post-rebranding efficiency gains. 7.2% dividend yield attracts income investors.',
            momentumScore: 58,
            dividendScore: 80,
            totalScore: 67,
            volumeSpike: 8.5,
        },
        {
            ticker: 'KPLC',
            name: 'Kenya Power & Lighting',
            currentPrice: 2.45,
            entryPoint: 2.35,
            stopLoss: 2.10,
            targetPrice: 2.85,
            reasoning: 'Restructuring progress. High-risk turnaround play with 25% volume spike.',
            momentumScore: 72,
            dividendScore: 35,
            totalScore: 58,
            volumeSpike: 25.6,
        },
        {
            ticker: 'KENGEN',
            name: 'KenGen',
            currentPrice: 3.85,
            entryPoint: 3.75,
            stopLoss: 3.40,
            targetPrice: 4.35,
            reasoning: 'Renewable energy leader. Stable 5.0% dividend with govt support.',
            momentumScore: 64,
            dividendScore: 68,
            totalScore: 66,
            volumeSpike: 10.2,
        },
        {
            ticker: 'SASINI',
            name: 'Sasini PLC',
            currentPrice: 12.50,
            entryPoint: 12.00,
            stopLoss: 10.80,
            targetPrice: 14.00,
            reasoning: 'Tea prices rebounding. Agriculture sector recovery with 6.5% yield.',
            momentumScore: 66,
            dividendScore: 70,
            totalScore: 68,
            volumeSpike: 11.8,
        },
        {
            ticker: 'BRIT',
            name: 'Britam Holdings',
            currentPrice: 7.20,
            entryPoint: 7.00,
            stopLoss: 6.30,
            targetPrice: 8.10,
            reasoning: 'Insurance sector consolidation play. Improving underwriting ratios.',
            momentumScore: 60,
            dividendScore: 62,
            totalScore: 61,
            volumeSpike: 7.9,
        },
        {
            ticker: 'KCSE',
            name: 'Kakuzi PLC',
            currentPrice: 385.00,
            entryPoint: 380.00,
            stopLoss: 355.00,
            targetPrice: 420.00,
            reasoning: 'Avocado export boom. Niche agribusiness with 4.8% dividend yield.',
            momentumScore: 68,
            dividendScore: 64,
            totalScore: 66,
            volumeSpike: 13.4,
        },
        {
            ticker: 'TPSE',
            name: 'Standard Group',
            currentPrice: 18.50,
            entryPoint: 18.00,
            stopLoss: 16.20,
            targetPrice: 21.00,
            reasoning: 'Media sector recovery. Digital transformation underway.',
            momentumScore: 63,
            dividendScore: 55,
            totalScore: 60,
            volumeSpike: 16.7,
        },
        {
            ticker: 'UNGA',
            name: 'Unga Group',
            currentPrice: 42.00,
            entryPoint: 41.00,
            stopLoss: 38.00,
            targetPrice: 46.50,
            reasoning: 'Staple food producer. Inflation hedge with improving margins.',
            momentumScore: 67,
            dividendScore: 61,
            totalScore: 64,
            volumeSpike: 10.5,
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
