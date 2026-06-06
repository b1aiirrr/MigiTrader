import React, { useState, useEffect } from 'react';
import type { AssetSignal, SignalsResponse } from '../pages/api/indicators';

export default function Dashboard() {
  const [data, setData] = useState<SignalsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterSignal, setFilterSignal] = useState<'ALL' | 'BUY' | 'SELL' | 'HOLD'>('ALL');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchSignals();
  }, []);

  const fetchSignals = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/indicators');
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }
      const json: SignalsResponse = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retrieve signal intelligence');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSignals();
    setRefreshing(false);
  };

  const handleTrade = (portalUrl: string) => {
    // Open target execution broker or settlement portal
    window.open(portalUrl, '_blank');
  };

  // Filter signals based on search query and status selector
  const filteredSignals = data?.signals.filter(signal => {
    const matchesSearch = 
      signal.ticker.toLowerCase().includes(search.toLowerCase()) ||
      signal.name.toLowerCase().includes(search.toLowerCase());
    
    const matchesSignal = filterSignal === 'ALL' || signal.signalStatus === filterSignal;
    
    return matchesSearch && matchesSignal;
  }) || [];

  if (loading && !data) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '60px',
              height: '60px',
              border: '3px solid var(--glass-border)',
              borderTopColor: 'var(--accent-cyan)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto var(--spacing-md)',
            }}
          />
          <style jsx>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
          <p style={{ color: 'var(--text-secondary)', fontWeight: '600', fontSize: 'var(--font-size-base)' }}>
            Analyzing Market Liquidity & Generating Signals...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
        <div className="glass-strong" style={{ padding: 'var(--spacing-xl)', borderRadius: 'var(--radius-lg)', maxWidth: '480px', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-sm)' }}>📡</div>
          <h3 style={{ color: 'var(--accent-red)', fontWeight: '800', marginBottom: 'var(--spacing-xs)' }}>Signal Connection Lost</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-lg)', fontSize: 'var(--font-size-sm)' }}>{error}</p>
          <button
            onClick={fetchSignals}
            className="glass-metallic"
            style={{
              padding: 'var(--spacing-sm) var(--spacing-lg)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontWeight: '700',
            }}
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeIn var(--transition-slow)' }}>
      {/* Header Panel */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xl)', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
        <div>
          <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '900', letterSpacing: '-0.03em', background: 'var(--chrome-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Real-Time Market Intelligence
          </h2>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
            EAT Timezone · Fully automated 14-day RSI and 20-day Moving Average signal analysis
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="glass-metallic"
          style={{
            padding: 'var(--spacing-sm) var(--spacing-lg)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--accent-cyan)',
            fontWeight: '700',
            fontSize: 'var(--font-size-sm)',
            cursor: refreshing ? 'not-allowed' : 'pointer',
            transition: 'all var(--transition-fast)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: refreshing ? 'none' : '0 0 15px rgba(0,212,255,0.1)'
          }}
        >
          <span style={{ display: 'inline-block', transform: refreshing ? 'rotate(360deg)' : 'none', transition: 'transform 1s ease' }}>🔄</span>
          {refreshing ? 'Refreshing Feed...' : 'Trigger Pipeline'}
        </button>
      </div>

      {/* KPI Highlight Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--spacing-lg)',
          marginBottom: 'var(--spacing-2xl)'
        }}
      >
        {/* KPI 1: Sentiment Index */}
        <div className="glass-metallic border-metallic" style={{ padding: 'var(--spacing-lg)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-glow-cyan)' }}>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700', marginBottom: 'var(--spacing-xs)' }}>
            Market Sentiment Index
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '2.25rem', fontWeight: '900', color: 'var(--accent-cyan)' }}>
              {data?.marketSentiment}%
            </span>
            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--accent-emerald)', fontWeight: '700' }}>
              Bullish Bias
            </span>
          </div>
          <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', marginTop: 'var(--spacing-sm)', overflow: 'hidden' }}>
            <div style={{ width: `${data?.marketSentiment}%`, height: '100%', background: 'var(--accent-cyan)', borderRadius: '2px' }} />
          </div>
        </div>

        {/* KPI 2: Total Assets */}
        <div className="glass-metallic border-metallic" style={{ padding: 'var(--spacing-lg)', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700', marginBottom: 'var(--spacing-xs)' }}>
            Assets Tracked
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: '900', color: 'var(--text-primary)' }}>
            {data?.totalAssets}
          </div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: '8px' }}>
            Fully liquidated blue-chips & mid-caps
          </div>
        </div>

        {/* KPI 3: Buy Signals */}
        <div className="glass-metallic border-metallic" style={{ padding: 'var(--spacing-lg)', borderRadius: 'var(--radius-lg)', borderLeft: '4px solid var(--accent-emerald)' }}>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700', marginBottom: 'var(--spacing-xs)' }}>
            Active BUY Signals
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '2.25rem', fontWeight: '900', color: 'var(--accent-emerald)' }}>
              {data?.buyCount}
            </span>
            <span style={{ animation: 'pulse 2s infinite', display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-emerald)' }} />
          </div>
          <style jsx>{`
            @keyframes pulse {
              0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
              70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
              100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
            }
          `}</style>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: '8px' }}>
            Oversold or 20MA breakouts
          </div>
        </div>

        {/* KPI 4: Sell Signals */}
        <div className="glass-metallic border-metallic" style={{ padding: 'var(--spacing-lg)', borderRadius: 'var(--radius-lg)', borderLeft: '4px solid var(--accent-red)' }}>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700', marginBottom: 'var(--spacing-xs)' }}>
            Active SELL Signals
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: '900', color: 'var(--accent-red)' }}>
            {data?.sellCount}
          </div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: '8px' }}>
            Overbought or 20MA breakdowns
          </div>
        </div>
      </div>

      {/* Main Signal Console Table */}
      <div className="glass-strong" style={{ borderRadius: 'var(--radius-xl)', padding: 'var(--spacing-lg)', boxShadow: 'var(--shadow-lg)' }}>
        
        {/* Search and Filters Controller */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
          
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1', minWidth: '240px', maxWidth: '400px' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '1rem' }}>🔍</span>
            <input
              type="text"
              placeholder="Search ticker or asset name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 38px',
                background: 'var(--metal-dark)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                outline: 'none',
                fontSize: 'var(--font-size-sm)',
                transition: 'border-color var(--transition-fast)'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--accent-cyan)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--glass-border)'}
            />
          </div>

          {/* Tab Filters */}
          <div style={{ display: 'flex', gap: '4px', background: 'var(--metal-dark)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
            {(['ALL', 'BUY', 'HOLD', 'SELL'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilterSignal(tab)}
                style={{
                  padding: '6px 16px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: '700',
                  cursor: 'pointer',
                  color: filterSignal === tab ? 'white' : 'var(--text-secondary)',
                  background: filterSignal === tab 
                    ? tab === 'BUY' ? 'rgba(16, 185, 129, 0.2)' 
                      : tab === 'SELL' ? 'rgba(239, 68, 68, 0.2)' 
                      : tab === 'HOLD' ? 'rgba(255, 255, 255, 0.08)' 
                      : 'var(--accent-cyan)'
                    : 'transparent',
                  transition: 'all var(--transition-fast)',
                  borderBottom: filterSignal === tab && tab === 'ALL' ? '2px solid var(--accent-cyan)' : 'none'
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Signals Terminal Grid / Table */}
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <th style={{ padding: 'var(--spacing-md) var(--spacing-sm)', color: 'var(--text-secondary)', fontWeight: '800', fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Asset</th>
                <th style={{ padding: 'var(--spacing-md) var(--spacing-sm)', color: 'var(--text-secondary)', fontWeight: '800', fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Price</th>
                <th style={{ padding: 'var(--spacing-md) var(--spacing-sm)', color: 'var(--text-secondary)', fontWeight: '800', fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>P/E Ratio</th>
                <th style={{ padding: 'var(--spacing-md) var(--spacing-sm)', color: 'var(--text-secondary)', fontWeight: '800', fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>RSI (14-Day)</th>
                <th style={{ padding: 'var(--spacing-md) var(--spacing-sm)', color: 'var(--text-secondary)', fontWeight: '800', fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Moving Average (20-Day)</th>
                <th style={{ padding: 'var(--spacing-md) var(--spacing-sm)', color: 'var(--text-secondary)', fontWeight: '800', fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Signal Recommendation</th>
                <th style={{ padding: 'var(--spacing-md) var(--spacing-sm)', color: 'var(--text-secondary)', fontWeight: '800', fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Portal Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredSignals.length > 0 ? (
                filteredSignals.map((signal, index) => {
                  const isBuy = signal.signalStatus === 'BUY';
                  const isSell = signal.signalStatus === 'SELL';
                  const badgeColor = isBuy 
                    ? 'var(--accent-emerald)' 
                    : isSell 
                      ? 'var(--accent-red)' 
                      : 'var(--text-secondary)';
                  const badgeBg = isBuy 
                    ? 'rgba(16, 185, 129, 0.1)' 
                    : isSell 
                      ? 'rgba(239, 68, 68, 0.1)' 
                      : 'rgba(255, 255, 255, 0.05)';
                  
                  return (
                    <tr
                      key={signal.ticker}
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.03)',
                        transition: 'background var(--transition-fast)',
                        background: index % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.01)'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = index % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.01)'}
                    >
                      {/* Asset */}
                      <td style={{ padding: 'var(--spacing-md) var(--spacing-sm)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: '800', color: 'var(--text-primary)', fontSize: 'var(--font-size-base)' }}>{signal.ticker}</span>
                          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>{signal.name}</span>
                        </div>
                      </td>
                      
                      {/* Price */}
                      <td style={{ padding: 'var(--spacing-md) var(--spacing-sm)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: '700', fontSize: 'var(--font-size-base)' }}>
                            {signal.assetType === 'IFB' ? `${signal.currentPrice.toFixed(2)}% Yield` : `KES ${signal.currentPrice.toFixed(2)}`}
                          </span>
                          {signal.assetType !== 'IFB' && (
                            <span style={{ fontSize: 'var(--font-size-xs)', color: signal.priceChangePercent >= 0 ? 'var(--accent-emerald)' : 'var(--accent-red)', fontWeight: '700' }}>
                              {signal.priceChangePercent >= 0 ? '+' : ''}{signal.priceChangePercent}%
                            </span>
                          )}
                        </div>
                      </td>
                      
                      {/* P/E Ratio */}
                      <td style={{ padding: 'var(--spacing-md) var(--spacing-sm)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: 'var(--font-size-base)' }}>
                            {signal.peRatio !== undefined ? signal.peRatio.toFixed(2) : '—'}
                          </span>
                          {signal.eps !== undefined && (
                            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                              EPS: {signal.eps.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </td>
                      
                      {/* RSI Indicator */}
                      <td style={{ padding: 'var(--spacing-md) var(--spacing-sm)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontWeight: '700', color: signal.rsi14 <= 35 ? 'var(--accent-emerald)' : signal.rsi14 >= 65 ? 'var(--accent-red)' : 'var(--text-primary)' }}>
                            {signal.rsi14}
                          </span>
                          <div style={{ width: '80px', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', position: 'relative' }}>
                            <div 
                              style={{ 
                                position: 'absolute', 
                                left: `${signal.rsi14}%`, 
                                transform: 'translateX(-50%)', 
                                top: '-2px', 
                                width: '10px', 
                                height: '10px', 
                                borderRadius: '50%', 
                                background: signal.rsi14 <= 35 ? 'var(--accent-emerald)' : signal.rsi14 >= 65 ? 'var(--accent-red)' : 'var(--accent-cyan)',
                                boxShadow: signal.rsi14 <= 35 ? '0 0 8px var(--accent-emerald)' : signal.rsi14 >= 65 ? '0 0 8px var(--accent-red)' : 'none'
                              }} 
                            />
                            {/* Target Zones lines */}
                            <div style={{ position: 'absolute', left: '30%', height: '100%', width: '1px', background: 'rgba(255,255,255,0.2)' }} />
                            <div style={{ position: 'absolute', left: '70%', height: '100%', width: '1px', background: 'rgba(255,255,255,0.2)' }} />
                          </div>
                        </div>
                      </td>

                      {/* Moving Average */}
                      <td style={{ padding: 'var(--spacing-md) var(--spacing-sm)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>KES {signal.movingAverage20Day.toFixed(2)}</span>
                          <span style={{ fontSize: 'var(--font-size-xs)', color: signal.currentPrice >= signal.movingAverage20Day ? 'var(--accent-emerald)' : 'var(--accent-red)' }}>
                            {signal.currentPrice >= signal.movingAverage20Day ? 'Above 20-Day MA ▲' : 'Below 20-Day MA ▼'}
                          </span>
                        </div>
                      </td>

                      {/* Signal Badge & Reason */}
                      <td style={{ padding: 'var(--spacing-md) var(--spacing-sm)', maxWidth: '280px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div>
                            <span style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: 'var(--font-size-xs)',
                              fontWeight: '900',
                              color: badgeColor,
                              background: badgeBg,
                              border: `1px solid ${badgeColor}40`,
                              boxShadow: isBuy ? '0 0 10px rgba(16, 185, 129, 0.2)' : isSell ? '0 0 10px rgba(239, 68, 68, 0.2)' : 'none'
                            }}>
                              {signal.signalStatus}
                            </span>
                          </div>
                          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                            {signal.reasoning}
                          </span>
                        </div>
                      </td>

                      {/* Interactive Deep Link Button */}
                      <td style={{ padding: 'var(--spacing-md) var(--spacing-sm)', textAlign: 'center' }}>
                        <button
                          onClick={() => handleTrade(signal.portalUrl)}
                          className="glass-metallic"
                          style={{
                            padding: '8px 12px',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            color: 'white',
                            fontSize: 'var(--font-size-xs)',
                            fontWeight: '700',
                            cursor: 'pointer',
                            transition: 'all var(--transition-fast)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--accent-cyan)';
                            e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 212, 255, 0.2)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          🚀 Open Portal to Trade
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 'var(--spacing-2xl)', color: 'var(--text-muted)' }}>
                    No assets matches your criteria. Try adjusting search or tab filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
