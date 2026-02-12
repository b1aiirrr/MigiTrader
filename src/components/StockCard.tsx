import React from 'react';
import type { StockPick } from '../lib/types';

interface StockCardProps {
    stock: StockPick;
    onExecute: (ticker: string) => void;
}

export default function StockCard({ stock, onExecute }: StockCardProps) {
    const priceChange = ((stock.currentPrice - stock.entryPoint) / stock.entryPoint) * 100;
    const isPositive = priceChange >= 0;

    return (
        <div
            className="glass-metallic border-metallic"
            style={{
                borderRadius: 'var(--radius-xl)',
                padding: 'var(--spacing-lg)',
                animation: 'fadeIn var(--transition-slow)',
                position: 'relative',
                zIndex: 1,
            }}
        >
            {/* Chrome Accent Bar */}
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '4px',
                    background: 'var(--chrome-gradient)',
                    borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
                }}
            />

            {/* Header with Ticker and Score */}
            <div style={{ marginBottom: 'var(--spacing-md)', paddingTop: 'var(--spacing-xs)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-xs)' }}>
                    <div>
                        <h3
                            style={{
                                fontSize: 'var(--font-size-2xl)',
                                fontWeight: '800',
                                background: 'var(--chrome-gradient)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                                marginBottom: '0.25rem',
                                letterSpacing: '-0.02em',
                            }}
                        >
                            {stock.ticker}
                        </h3>
                        <p
                            style={{
                                fontSize: 'var(--font-size-sm)',
                                color: 'var(--text-secondary)',
                                fontWeight: '500',
                            }}
                        >
                            {stock.name}
                        </p>
                    </div>

                    {/* Total Score Badge */}
                    <div
                        style={{
                            padding: 'var(--spacing-xs) var(--spacing-sm)',
                            background: 'var(--accent-cyan)',
                            borderRadius: 'var(--radius-md)',
                            boxShadow: 'var(--shadow-glow-cyan)',
                            animation: 'pulse-glow 3s infinite',
                        }}
                    >
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--metal-darker)', fontWeight: '700', textAlign: 'center', opacity: 0.8 }}>SCORE</div>
                        <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: '800', color: 'var(--metal-darker)', lineHeight: 1 }}>{stock.totalScore.toFixed(0)}</div>
                    </div>
                </div>
            </div>

            {/* Current Price with Change */}
            <div style={{ marginBottom: 'var(--spacing-md)' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-xs)' }}>
                    <span
                        style={{
                            fontSize: 'var(--font-size-3xl)',
                            fontWeight: '800',
                            color: 'var(--text-primary)',
                            letterSpacing: '-0.03em',
                        }}
                    >
                        KES {stock.currentPrice.toFixed(2)}
                    </span>
                    <span
                        style={{
                            fontSize: 'var(--font-size-base)',
                            fontWeight: '600',
                            color: isPositive ? 'var(--accent-emerald)' : 'var(--accent-red)',
                            padding: '0.25rem 0.5rem',
                            background: isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            borderRadius: 'var(--radius-sm)',
                        }}
                    >
                        {isPositive ? '▲' : '▼'} {Math.abs(priceChange).toFixed(2)}%
                    </span>
                </div>
            </div>

            {/* Trading Levels */}
            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: 'var(--spacing-sm)',
                    }}
                >
                    {/* Entry Point */}
                    <div
                        style={{
                            padding: 'var(--spacing-sm)',
                            background: 'var(--glass-light)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid rgba(0, 212, 255, 0.3)',
                        }}
                    >
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: '600' }}>ENTRY</div>
                        <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: '700', color: 'var(--accent-cyan)' }}>{stock.entryPoint.toFixed(2)}</div>
                    </div>

                    {/* Target */}
                    <div
                        style={{
                            padding: 'var(--spacing-sm)',
                            background: 'var(--glass-light)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                        }}
                    >
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: '600' }}>TARGET</div>
                        <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: '700', color: 'var(--accent-emerald)' }}>{stock.targetPrice.toFixed(2)}</div>
                    </div>

                    {/* Stop Loss */}
                    <div
                        style={{
                            padding: 'var(--spacing-sm)',
                            background: 'var(--glass-light)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                        }}
                    >
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: '600' }}>STOP</div>
                        <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: '700', color: 'var(--accent-red)' }}>{stock.stopLoss.toFixed(2)}</div>
                    </div>
                </div>
            </div>

            {/* Reasoning */}
            <div
                style={{
                    padding: 'var(--spacing-md)',
                    background: 'var(--glass-light)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: 'var(--spacing-md)',
                    borderLeft: '3px solid var(--accent-purple)',
                }}
            >
                <p
                    style={{
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.6,
                        fontWeight: '500',
                    }}
                >
                    {stock.reasoning}
                </p>
            </div>

            {/* Momentum & Dividend Scores */}
            <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Momentum
                        </span>
                        <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: '700', color: 'var(--accent-purple)' }}>{stock.momentumScore.toFixed(0)}</span>
                    </div>
                    <div style={{ height: '6px', background: 'var(--glass-light)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                        <div
                            style={{
                                height: '100%',
                                width: `${stock.momentumScore}%`,
                                background: 'var(--chrome-gradient)',
                                transition: 'width var(--transition-slow)',
                            }}
                        />
                    </div>
                </div>

                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Dividend
                        </span>
                        <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: '700', color: 'var(--accent-emerald)' }}>{stock.dividendScore.toFixed(0)}</span>
                    </div>
                    <div style={{ height: '6px', background: 'var(--glass-light)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                        <div
                            style={{
                                height: '100%',
                                width: `${stock.dividendScore}%`,
                                background: 'linear-gradient(90deg, var(--accent-emerald), var(--accent-gold))',
                                transition: 'width var(--transition-slow)',
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Execute Button */}
            <button
                onClick={() => onExecute(stock.ticker)}
                style={{
                    width: '100%',
                    padding: 'var(--spacing-md)',
                    background: 'var(--chrome-gradient)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: 'var(--font-size-base)',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all var(--transition-normal)',
                    boxShadow: 'var(--shadow-glow-purple)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    position: 'relative',
                    overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 0 40px rgba(139, 92, 246, 0.5)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-glow-purple)';
                }}
            >
                Execute on Ziidi 🚀
            </button>
        </div>
    );
}
