import type { NextApiRequest, NextApiResponse } from 'next';
import { getDailyInsights } from '../../lib/getDailyInsights';
import type { DailyInsights, APIConfig, RedisConfig } from '../../lib/types';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<DailyInsights | { error: string }>
) {
    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
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
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to fetch insights',
        });
    }
}
