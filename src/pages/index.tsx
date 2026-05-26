import Head from 'next/head';
import { useState } from 'react';
import DailyAlphaDashboard from '../components/DailyAlphaDashboard';
import Dashboard from '../components/Dashboard';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'ALPHA' | 'SIGNALS'>('SIGNALS');

  return (
    <>
      <Head>
        <title>MigiTrader - Real-Time Market Intelligence Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />
        <meta name="description" content="High-performance institutional-grade PWA for NSE Kenya trading insights and signals. Track real-time technical indicators and execute trades securely." />
        <meta name="theme-color" content="#0a0e1a" />
        
        {/* OpenGraph (OG) metadata for rich link sharing */}
        <meta property="og:title" content="MigiTrader - Real-Time Market Intelligence Dashboard" />
        <meta property="og:description" content="AI-powered stock picks and real-time technical signals (14-Day RSI, 20-Day Moving Average) for the Nairobi Securities Exchange." />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/images/og-share-card.png" />
        <meta property="og:site_name" content="MigiTrader" />
        
        {/* Twitter Card metadata */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="MigiTrader - Real-Time Market Intelligence Dashboard" />
        <meta name="twitter:description" content="Institutional-grade stock picks and technical signals for NSE Kenya." />
        <meta name="twitter:image" content="/images/og-share-card.png" />
        
        {/* PWA IOS support */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="MigiTrader" />
        
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
      </Head>

      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Unified Platform Top Bar */}
        <div 
          className="glass-metallic" 
          style={{ 
            position: 'sticky', 
            top: 0, 
            zIndex: 100, 
            borderBottom: '1px solid var(--glass-border)', 
            padding: 'var(--spacing-sm) var(--spacing-md)',
            backdropFilter: 'var(--blur-md)'
          }}
        >
          <div 
            style={{ 
              maxWidth: '1200px', 
              margin: '0 auto', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 'var(--spacing-sm)'
            }}
          >
            {/* Brand Logo & Title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div 
                style={{ 
                  width: '32px', 
                  height: '32px', 
                  borderRadius: 'var(--radius-sm)', 
                  background: 'var(--chrome-gradient)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontWeight: '900',
                  color: 'white',
                  fontSize: '1.25rem',
                  boxShadow: 'var(--shadow-glow-cyan)'
                }}
              >
                M
              </div>
              <div>
                <span 
                  style={{ 
                    fontSize: 'var(--font-size-lg)', 
                    fontWeight: '900', 
                    letterSpacing: '-0.03em', 
                    background: 'var(--chrome-gradient)', 
                    WebkitBackgroundClip: 'text', 
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
                  MigiTrader
                </span>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--accent-cyan)', fontWeight: '700', marginLeft: '6px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  PRO
                </span>
              </div>
            </div>

            {/* Premium Navigation Tabs */}
            <div 
              style={{ 
                display: 'flex', 
                gap: '6px', 
                background: 'rgba(0, 0, 0, 0.2)', 
                padding: '4px', 
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(255,255,255,0.05)'
              }}
            >
              <button
                onClick={() => setActiveTab('SIGNALS')}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: activeTab === 'SIGNALS' ? 'white' : 'var(--text-secondary)',
                  background: activeTab === 'SIGNALS' ? 'rgba(255,255,255,0.08)' : 'transparent',
                  boxShadow: activeTab === 'SIGNALS' ? '0 1px 3px rgba(0,0,0,0.2)' : 'none',
                  borderBottom: activeTab === 'SIGNALS' ? '2px solid var(--accent-cyan)' : 'none'
                }}
              >
                📊 Signals Terminal
              </button>
              <button
                onClick={() => setActiveTab('ALPHA')}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: activeTab === 'ALPHA' ? 'white' : 'var(--text-secondary)',
                  background: activeTab === 'ALPHA' ? 'rgba(255,255,255,0.08)' : 'transparent',
                  boxShadow: activeTab === 'ALPHA' ? '0 1px 3px rgba(0,0,0,0.2)' : 'none',
                  borderBottom: activeTab === 'ALPHA' ? '2px solid var(--accent-cyan)' : 'none'
                }}
              >
                🎯 Alpha Picks
              </button>
            </div>
          </div>
        </div>

        {/* Main Workspace Frame */}
        <main 
          style={{ 
            flex: 1, 
            maxWidth: '1200px', 
            width: '100%', 
            margin: '0 auto', 
            padding: 'var(--spacing-lg) var(--spacing-md) var(--spacing-2xl)',
            position: 'relative',
            zIndex: 1
          }}
        >
          {activeTab === 'SIGNALS' ? <Dashboard /> : <DailyAlphaDashboard />}
        </main>
      </div>
    </>
  );
}
