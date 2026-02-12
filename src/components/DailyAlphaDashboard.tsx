import React, { useState, useEffect } from 'react';
import StockCard from './StockCard';
import type { DailyInsights } from '../lib/types';

export default function DailyAlphaDashboard() {
    const [insights, setInsights] = useState<DailyInsights | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadInsights();
    }, []);

    const loadInsights = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch from server-side API route (avoids Redis in browser)
            const response = await fetch('/api/insights');

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data: DailyInsights = await response.json();
            setInsights(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load insights');
            console.error('Error loading insights:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadInsights();
        setTimeout(() => setRefreshing(false), 500);
    };

    const handleExecute = (ticker: string) => {
        // Deep link to Ziidi Trader or M-Pesa
        const message = `I want to buy ${ticker} stock via M-Pesa`;
        const phoneNumber = '254700000000'; // Replace with Ziidi support number
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

        window.open(whatsappUrl, '_blank');
    };

    if (loading) {
        return <LoadingSkeleton />;
    }

    if (error) {
        return <ErrorState message={error} onRetry={loadInsights} />;
    }

    if (!insights) {
        return null;
    }

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: 'var(--bg-white)',
            padding: 'var(--spacing-md)',
        }}>
            {/* Header */}
            <header style={{
                marginBottom: 'var(--spacing-lg)',
                textAlign: 'center',
            }}>
                <h1 style={{
                    fontSize: 'var(--font-size-2xl)',
                    fontWeight: '800',
                    color: 'var(--text-dark)',
                    marginBottom: 'var(--spacing-xs)',
                }}>
                    MigiTrader Daily Alpha
                </h1>

                <p style={{
                    fontSize: 'var(--font-size-base)',
                    color: 'var(--text-gray)',
                    marginBottom: 'var(--spacing-sm)',
                }}>
                    {new Date(insights.date).toLocaleDateString('en-KE', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}
                </p>

                {/* Refresh button */}
                <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    style={{
                        padding: 'var(--spacing-xs) var(--spacing-md)',
                        backgroundColor: 'var(--primary-blue)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: '600',
                        cursor: refreshing ? 'not-allowed' : 'pointer',
                        transition: 'all var(--transition-fast)',
                        opacity: refreshing ? 0.6 : 1,
                    }}
                >
                    {refreshing ? '🔄 Refreshing...' : '🔄 Refresh Data'}
                </button>

                {/* Cache indicator */}
                {insights.cacheHit && (
                    <p style={{
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--text-gray)',
                        marginTop: 'var(--spacing-xs)',
                    }}>
                        ⚡ Cached data (saved on mobile data costs)
                    </p>
                )}
            </header>

            {/* Market Summary */}
            <section
                className="glass"
                style={{
                    padding: 'var(--spacing-md)',
                    borderRadius: 'var(--radius-lg)',
                    marginBottom: 'var(--spacing-lg)',
                }}
            >
                <h2 style={{
                    fontSize: 'var(--font-size-lg)',
                    fontWeight: '700',
                    color: 'var(--text-dark)',
                    marginBottom: 'var(--spacing-sm)',
                }}>
                    📊 Market Overview
                </h2>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: 'var(--spacing-md)',
                }}>
                    <MarketStat
                        label="Advancers"
                        value={insights.marketSummary.advancers}
                        color="var(--success-emerald)"
                    />
                    <MarketStat
                        label="Decliners"
                        value={insights.marketSummary.decliners}
                        color="#ef4444"
                    />
                    <MarketStat
                        label="Unchanged"
                        value={insights.marketSummary.unchanged}
                        color="var(--text-gray)"
                    />
                    <MarketStat
                        label="Volume"
                        value={`${(insights.marketSummary.totalVolume / 1_000_000).toFixed(1)}M`}
                        color="var(--primary-blue)"
                    />
                </div>
            </section>

            {/* Stock Picks */}
            <section>
                <h2 style={{
                    fontSize: 'var(--font-size-lg)',
                    fontWeight: '700',
                    color: 'var(--text-dark)',
                    marginBottom: 'var(--spacing-md)',
                }}>
                    🎯 Today's Top Picks
                </h2>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                    gap: 'var(--spacing-md)',
                }}>
                    {insights.picks.map((stock, index) => (
                        <StockCard
                            key={stock.ticker}
                            stock={stock}
                            onExecute={handleExecute}
                        />
                    ))}
                </div>

                {insights.picks.length === 0 && (
                    <div style={{
                        textAlign: 'center',
                        padding: 'var(--spacing-xl)',
                        color: 'var(--text-gray)',
                    }}>
                        <p style={{ fontSize: 'var(--font-size-lg)' }}>
                            No qualifying stocks found today. Check back tomorrow!
                        </p>
                    </div>
                )}
            </section>

            {/* Disclaimer */}
            <footer style={{
                marginTop: 'var(--spacing-xl)',
                padding: 'var(--spacing-md)',
                backgroundColor: 'rgba(0, 0, 0, 0.02)',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center',
            }}>
                <p style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--text-gray)',
                }}>
                    ⚠️ This is not financial advice. Always do your own research before investing.
                </p>
            </footer>
        </div>
    );
}

/* Sub-component: Market Stat */
function MarketStat({ label, value, color }: { label: string; value: number | string; color: string }) {
    return (
        <div>
            <p style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--text-gray)',
                marginBottom: '4px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
            }}>
                {label}
            </p>
            <p style={{
                fontSize: 'var(--font-size-xl)',
                fontWeight: '700',
                color,
            }}>
                {value}
            </p>
        </div>
    );
}

/* Loading Skeleton */
function LoadingSkeleton() {
    return (
        <div style={{ padding: 'var(--spacing-md)' }}>
            <div className="skeleton" style={{ height: '100px', marginBottom: 'var(--spacing-lg)' }} />
            <div className="skeleton" style={{ height: '200px', marginBottom: 'var(--spacing-md)' }} />
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: 'var(--spacing-md)',
            }}>
                <div className="skeleton" style={{ height: '400px' }} />
                <div className="skeleton" style={{ height: '400px' }} />
                <div className="skeleton" style={{ height: '400px' }} />
            </div>
        </div>
    );
}

/* Error State */
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--spacing-md)',
            textAlign: 'center',
        }}>
            <div style={{
                fontSize: '64px',
                marginBottom: 'var(--spacing-md)',
            }}>
                ⚠️
            </div>
            <h2 style={{
                fontSize: 'var(--font-size-xl)',
                fontWeight: '700',
                color: 'var(--text-dark)',
                marginBottom: 'var(--spacing-sm)',
            }}>
                Something went wrong
            </h2>
            <p style={{
                fontSize: 'var(--font-size-base)',
                color: 'var(--text-gray)',
                marginBottom: 'var(--spacing-md)',
            }}>
                {message}
            </p>
            <button
                onClick={onRetry}
                style={{
                    padding: 'var(--spacing-sm) var(--spacing-lg)',
                    backgroundColor: 'var(--primary-blue)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--font-size-base)',
                    fontWeight: '600',
                    cursor: 'pointer',
                }}
            >
                Try Again
            </button>
        </div>
    );
}
