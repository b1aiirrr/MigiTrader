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
        setRefreshing(false);
    };

    const handleExecute = (ticker: string) => {
        const ziidiNumber = process.env.NEXT_PUBLIC_ZIIDI_PHONE_NUMBER || '+254700000000';
        const message = encodeURIComponent(`I want to execute a trade for ${ticker} via Ziidi`);
        const whatsappUrl = `https://wa.me/${ziidiNumber.replace('+', '')}?text=${message}`;
        window.open(whatsappUrl, '_blank');
    };

    if (loading && !insights) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--spacing-xl)' }}>
                <div style={{ textAlign: 'center' }}>
                    <div
                        style={{
                            width: '80px',
                            height: '80px',
                            border: '4px solid var(--glass-border)',
                            borderTopColor: 'var(--accent-cyan)',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            margin: '0 auto var(--spacing-lg)',
                        }}
                    />
                    <style jsx>{`
            @keyframes spin {
              to {
                transform: rotate(360deg);
              }
            }
          `}</style>
                    <p style={{ fontSize: 'var(--font-size-lg)', color: 'var(--text-secondary)', fontWeight: '600' }}>Loading Daily Alpha...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--spacing-xl)' }}>
                <div className="glass-strong" style={{ padding: 'var(--spacing-2xl)', borderRadius: 'var(--radius-xl)', maxWidth: '500px', textAlign: 'center' }}>
                    <div style={{ fontSize: '4rem', marginBottom: 'var(--spacing-md)' }}>⚠️</div>
                    <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '800', color: 'var(--accent-red)', marginBottom: 'var(--spacing-sm)' }}>
                        Something went wrong
                    </h2>
                    <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-lg)' }}>{error}</p>
                    <button
                        onClick={handleRefresh}
                        style={{
                            padding: 'var(--spacing-md) var(--spacing-xl)',
                            background: 'var(--chrome-gradient)',
                            color: 'white',
                            border: 'none',
                            borderRadius: 'var(--radius-lg)',
                            fontSize: 'var(--font-size-base)',
                            fontWeight: '700',
                            cursor: 'pointer',
                            transition: 'transform var(--transition-fast)',
                            boxShadow: 'var(--shadow-glow-purple)',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', padding: 'var(--spacing-xl) var(--spacing-md)', position: 'relative' }}>
            {/* Header */}
            <header style={{ marginBottom: 'var(--spacing-2xl)', textAlign: 'center', animation: 'fadeIn var(--transition-slow)' }}>
                <h1
                    style={{
                        fontSize: 'var(--font-size-4xl)',
                        fontWeight: '900',
                        background: 'var(--chrome-gradient)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        marginBottom: 'var(--spacing-sm)',
                        letterSpacing: '-0.04em',
                    }}
                >
                    MigiTrader
                </h1>
                <p style={{ fontSize: 'var(--font-size-lg)', color: 'var(--text-secondary)', fontWeight: '600', marginBottom: 'var(--spacing-xs)' }}>
                    NSE Daily Alpha Engine
                </p>
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>{insights?.date}</p>
            </header>

            {/* Market Summary */}
            {insights?.marketSummary && (
                <div className="glass-strong" style={{ borderRadius: 'var(--radius-xl)', padding: 'var(--spacing-xl)', marginBottom: 'var(--spacing-2xl)', animation: 'fadeIn var(--transition-slow) 0.1s' }}>
                    <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '800', color: 'var(--text-primary)', marginBottom: 'var(--spacing-lg)', textAlign: 'center' }}>
                        Market Snapshot
                    </h2>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                            gap: 'var(--spacing-md)',
                        }}
                    >
                        <div style={{ textAlign: 'center', padding: 'var(--spacing-md)', background: 'var(--glass-light)', borderRadius: 'var(--radius-lg)' }}>
                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Volume
                            </div>
                            <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '800', color: 'var(--accent-cyan)' }}>
                                {(insights.marketSummary.totalVolume / 1000000).toFixed(1)}M
                            </div>
                        </div>
                        <div style={{ textAlign: 'center', padding: 'var(--spacing-md)', background: 'var(--glass-light)', borderRadius: 'var(--radius-lg)' }}>
                            <div style={{ fontSize: 'var--(font-size-xs)', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Gainers
                            </div>
                            <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '800', color: 'var(--accent-emerald)' }}>{insights.marketSummary.advancers}</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: 'var(--spacing-md)', background: 'var(--glass-light)', borderRadius: 'var(--radius-lg)' }}>
                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Losers
                            </div>
                            <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '800', color: 'var(--accent-red)' }}>{insights.marketSummary.decliners}</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: 'var(--spacing-md)', background: 'var(--glass-light)', borderRadius: 'var(--radius-lg)' }}>
                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Unchanged
                            </div>
                            <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '800', color: 'var(--text-secondary)' }}>{insights.marketSummary.unchanged}</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Stock Picks */}
            <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                    <h2
                        style={{
                            fontSize: 'var(--font-size-2xl)',
                            fontWeight: '800',
                            color: 'var(--text-primary)',
                            letterSpacing: '-0.02em',
                        }}
                    >
                        Today's Alpha Picks
                    </h2>
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        style={{
                            padding: 'var(--spacing-sm) var(--spacing-md)',
                            background: 'var(--glass-dark)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: 'var(--radius-lg)',
                            color: 'var(--accent-cyan)',
                            fontSize: 'var(--font-size-sm)',
                            fontWeight: '700',
                            cursor: refreshing ? 'not-allowed' : 'pointer',
                            transition: 'all var(--transition-fast)',
                            opacity: refreshing ? 0.5 : 1,
                        }}
                        onMouseEnter={(e) => !refreshing && (e.currentTarget.style.borderColor = 'var(--accent-cyan)')}
                        onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--glass-border)')}
                    >
                        {refreshing ? '🔄 Refreshing...' : '🔄 Refresh'}
                    </button>
                </div>

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))',
                        gap: 'var(--spacing-xl)',
                    }}
                >
                    {insights?.picks.map((stock, index) => (
                        <div
                            key={stock.ticker}
                            style={{
                                animation: `fadeIn var(--transition-slow) ${index * 0.1}s`,
                            }}
                        >
                            <StockCard stock={stock} onExecute={handleExecute} />
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <footer style={{ textAlign: 'center', padding: 'var(--spacing-xl) 0', borderTop: '1px solid var(--glass-border)' }}>
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginBottom: 'var(--spacing-xs)' }}>
                    Data powered by NSE Kenya {insights?.cacheHit && '· Cached for performance'}
                </p>
                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Built with ❤️ for traders</p>
            </footer>
        </div>
    );
}
