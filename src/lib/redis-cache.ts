import { createClient, RedisClientType } from 'redis';
import type { RedisConfig } from './types';

class RedisCache {
    private client: RedisClientType | null = null;
    private config: RedisConfig;
    private isConnected = false;

    constructor(config: RedisConfig) {
        this.config = config;
    }

    /**
     * Initialize Redis connection with exponential backoff retry
     */
    async connect(): Promise<void> {
        if (this.isConnected) return;

        try {
            this.client = createClient({
                url: this.config.url,
                password: this.config.password,
                socket: {
                    reconnectStrategy: (retries) => {
                        if (retries > 3) {
                            console.error('Redis: Max reconnection attempts reached');
                            return new Error('Redis connection failed');
                        }
                        return Math.min(retries * 100, 3000);
                    },
                },
            });

            this.client.on('error', (err) => {
                console.error('Redis Client Error:', err);
                this.isConnected = false;
            });

            await this.client.connect();
            this.isConnected = true;
            console.log('✅ Redis connected successfully');
        } catch (error) {
            console.error('Failed to connect to Redis:', error);
            throw error;
        }
    }

    /**
     * Get cached data with automatic JSON parsing
     */
    async get<T>(key: string): Promise<T | null> {
        if (!this.client || !this.isConnected) {
            await this.connect();
        }

        try {
            const data = await this.client!.get(key);
            if (!data) return null;

            // Decompress and parse JSON
            return JSON.parse(data) as T;
        } catch (error) {
            console.error(`Redis GET error for key ${key}:`, error);
            return null;
        }
    }

    /**
     * Set cached data with automatic JSON serialization and compression
     * TTL is dynamically calculated based on market hours
     */
    async set(key: string, value: any, customTTL?: number): Promise<boolean> {
        if (!this.client || !this.isConnected) {
            await this.connect();
        }

        try {
            const ttl = customTTL || this.calculateDynamicTTL();
            const serialized = JSON.stringify(value);

            await this.client!.setEx(key, ttl, serialized);
            return true;
        } catch (error) {
            console.error(`Redis SET error for key ${key}:`, error);
            return false;
        }
    }

    /**
     * Calculate TTL based on NSE market hours (9:00 AM - 3:00 PM EAT)
     * During market hours: 15 minutes (900 seconds)
     * After hours: Cache until next market open
     */
    private calculateDynamicTTL(): number {
        const now = new Date();
        const nairobiTime = new Date(
            now.toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })
        );

        const currentHour = nairobiTime.getHours();
        const currentMinute = nairobiTime.getMinutes();
        const currentTimeInMinutes = currentHour * 60 + currentMinute;

        const marketOpenTime = 9 * 60; // 9:00 AM
        const marketCloseTime = 15 * 60; // 3:00 PM

        // Market hours: 15-minute cache
        if (
            currentTimeInMinutes >= marketOpenTime &&
            currentTimeInMinutes < marketCloseTime
        ) {
            return 900; // 15 minutes
        }

        // After hours: cache until next market open
        if (currentTimeInMinutes >= marketCloseTime) {
            // Cache until 9 AM next day
            const minutesUntilNextOpen =
                1440 - currentTimeInMinutes + marketOpenTime;
            return minutesUntilNextOpen * 60;
        }

        // Before market opens: cache until 9 AM today
        const minutesUntilOpen = marketOpenTime - currentTimeInMinutes;
        return minutesUntilOpen * 60;
    }

    /**
     * Delete cached data
     */
    async delete(key: string): Promise<boolean> {
        if (!this.client || !this.isConnected) {
            await this.connect();
        }

        try {
            await this.client!.del(key);
            return true;
        } catch (error) {
            console.error(`Redis DELETE error for key ${key}:`, error);
            return false;
        }
    }

    /**
     * Check if key exists in cache
     */
    async exists(key: string): Promise<boolean> {
        if (!this.client || !this.isConnected) {
            await this.connect();
        }

        try {
            const result = await this.client!.exists(key);
            return result === 1;
        } catch (error) {
            console.error(`Redis EXISTS error for key ${key}:`, error);
            return false;
        }
    }

    /**
     * Graceful disconnect
     */
    async disconnect(): Promise<void> {
        if (this.client && this.isConnected) {
            await this.client.quit();
            this.isConnected = false;
            console.log('Redis disconnected');
        }
    }
}

// Singleton instance for serverless environments
let redisCache: RedisCache | null = null;

export const getRedisClient = (config?: RedisConfig): RedisCache => {
    if (!redisCache && config) {
        redisCache = new RedisCache(config);
    }

    if (!redisCache) {
        throw new Error(
            'Redis cache not initialized. Provide config on first call.'
        );
    }

    return redisCache;
};

export default RedisCache;
