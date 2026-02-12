import React from 'react';
import type { StockPick } from '../lib/types';

interface StockCardProps {
    stock: StockPick;
    onExecute: (ticker: string) => void;
}

export default function StockCard({ stock, onExecute }: StockCardProps) {
    const priceChange = stock.currentPrice - (stock.entryPoint / 1.02); // Approximate previous close
    const priceChangePercent = ((priceChange / (stock.entryPoint / 1.02)) * 100).toFixed(2);
    const isPositive = priceChange >= 0;

    return (
        <div
            className="stock-card glass animate-fade-in"
            style={{
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--spacing-md)',
                transition: 'all var(--transition-base)',
                cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-strong)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-medium)';
            }}
        >
            {/* Header: Ticker & Name */}
            <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{
                        fontSize: 'var(--font-size-xl)',
                        fontWeight: '700',
                        color: 'var(--text-dark)',
                        margin: 0,
                    }}>
                        {stock.ticker}
                    </h3>

                    {/* Volume spike indicator */}
                    {stock.volumeSpike > 20 && (
                        <span style={{
                            backgroundColor: 'var(--primary-blue)',
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: 'var(--font-size-xs)',
                            fontWeight: '600',
                        }}>
                            🔥 +{stock.volumeSpike.toFixed(0)}%
                        </span>
                    )}
                </div>

                <p style={{
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--text-gray)',
                    margin: '4px 0 0 0',
                }}>
                    {stock.name}
                </p>
            </div>

            {/* Price Section */}
            <div style={{
                marginBottom: 'var(--spacing-md)',
                display: 'flex',
                alignItems: 'baseline',
                gap: 'var(--spacing-xs)',
            }}>
                <span style={{
                    fontSize: 'var(--font-size-2xl)',
                    fontWeight: '700',
                    color: 'var(--text-dark)',
                }}>
                    KES {stock.currentPrice.toFixed(2)}
                </span>

                <span style={{
                    fontSize: 'var(--font-size-sm)',
                    color: isPositive ? 'var(--success-emerald)' : '#ef4444',
                    fontWeight: '600',
                }}>
                    {isPositive ? '↑' : '↓'} {priceChangePercent}%
                </span>
            </div>

            {/* Trading Levels */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 'var(--spacing-sm)',
                marginBottom: 'var(--spacing-md)',
            }}>
                <TradingLevel
                    label="Entry"
                    value={stock.entryPoint}
                    color="var(--primary-blue)"
                />
                <TradingLevel
                    label="Target"
                    value={stock.targetPrice}
                    color="var(--success-emerald)"
                />
                <TradingLevel
                    label="Stop Loss"
                    value={stock.stopLoss}
                    color="#ef4444"
                />
            </div>

            {/* Reasoning */}
            <div style={{
                padding: 'var(--spacing-sm)',
                backgroundColor: 'rgba(0, 112, 243, 0.05)',
                borderRadius: 'var(--radius-md)',
                marginBottom: 'var(--spacing-md)',
            }}>
                <p style={{
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--text-gray)',
                    margin: 0,
                }}>
                    💡 {stock.reasoning}
                </p>
            </div>

            {/* Scores */}
            <div style={{
                display: 'flex',
                gap: 'var(--spacing-sm)',
                marginBottom: 'var(--spacing-md)',
            }}>
                <ScoreBadge label="Momentum" score={stock.momentumScore} />
                <ScoreBadge label="Dividend" score={stock.dividendScore} />
            </div>

            {/* CTA Button */}
            <button
                onClick={() => onExecute(stock.ticker)}
                style={{
                    width: '100%',
                    padding: 'var(--spacing-sm) var(--spacing-md)',
                    backgroundColor: 'var(--success-emerald)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--font-size-base)',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#059669';
                    e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--success-emerald)';
                    e.currentTarget.style.transform = 'scale(1)';
                }}
            >
                Execute on Ziidi 🚀
            </button>
        </div>
    );
}

/* Sub-component: Trading Level */
function TradingLevel({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div style={{ textAlign: 'center' }}>
            <p style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--text-gray)',
                margin: '0 0 4px 0',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
            }}>
                {label}
            </p>
            <p style={{
                fontSize: 'var(--font-size-sm)',
                fontWeight: '700',
                color,
                margin: 0,
            }}>
                {value.toFixed(2)}
            </p>
        </div>
    );
}

/* Sub-component: Score Badge */
function ScoreBadge({ label, score }: { label: string; score: number }) {
    const getColor = (score: number) => {
        if (score >= 70) return 'var(--success-emerald)';
        if (score >= 40) return '#f59e0b';
        return '#ef4444';
    };

    return (
        <div style={{
            flex: 1,
            padding: 'var(--spacing-xs)',
            backgroundColor: 'rgba(255, 255, 255, 0.5)',
            borderRadius: 'var(--radius-sm)',
            border: `1px solid ${getColor(score)}20`,
        }}>
            <p style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--text-gray)',
                margin: '0 0 2px 0',
            }}>
                {label}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{
                    flex: 1,
                    height: '4px',
                    backgroundColor: '#e5e7eb',
                    borderRadius: '2px',
                    overflow: 'hidden',
                }}>
                    <div style={{
                        width: `${score}%`,
                        height: '100%',
                        backgroundColor: getColor(score),
                        transition: 'width var(--transition-base)',
                    }} />
                </div>
                <span style={{
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: '700',
                    color: getColor(score),
                }}>
                    {score}
                </span>
            </div>
        </div>
    );
}
