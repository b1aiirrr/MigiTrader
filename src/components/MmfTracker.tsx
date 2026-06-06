import React, { useState, useEffect } from 'react';

interface MmfApiResponse {
  success: boolean;
  accountName: string;
  initialPrincipal: number;
  annualYield: number;
  startDate: string;
  daysElapsed: number;
  currentBalance: number;
  totalInterestEarned: number;
  dailyRate: number;
}

interface Transaction {
  id: string;
  amount: number;
  date: string;
  description: string;
  type: 'INITIAL' | 'DEPOSIT';
}

export default function MmfTracker() {
  const [apiData, setApiData] = useState<MmfApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Client transactions ledger (loaded from localStorage on mount)
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositDate, setDepositDate] = useState('');
  const [depositDesc, setDepositDesc] = useState('');

  // Calculations states
  const [totalPrincipal, setTotalPrincipal] = useState(0);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [totalInterest, setTotalInterest] = useState(0);

  useEffect(() => {
    fetchMmfState();
  }, []);

  // Recalculate balances when API data or transactions list changes
  useEffect(() => {
    if (!apiData) return;

    const rate = apiData.dailyRate;
    let principalSum = 0;
    let balanceSum = 0;

    // Compound each transaction from its specific date
    transactions.forEach((tx) => {
      principalSum += tx.amount;

      const txStart = new Date(tx.date);
      txStart.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const diffTime = Math.max(0, today.getTime() - txStart.getTime());
      const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      const compounded = tx.amount * Math.pow(1 + rate, days);
      balanceSum += compounded;
    });

    setTotalPrincipal(principalSum);
    setCurrentBalance(parseFloat(balanceSum.toFixed(2)));
    setTotalInterest(parseFloat((balanceSum - principalSum).toFixed(2)));
  }, [apiData, transactions]);

  const fetchMmfState = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/mmf');
      if (!res.ok) {
        throw new Error(`Failed to load MMF state: ${res.status}`);
      }
      const data: MmfApiResponse = await res.json();
      setApiData(data);

      // Initialize local storage transactions list
      const saved = localStorage.getItem('etica_mmf_txs');
      if (saved) {
        setTransactions(JSON.parse(saved));
      } else {
        const initialTx: Transaction = {
          id: 'initial-seed',
          amount: data.initialPrincipal,
          date: data.startDate,
          description: 'Initial Fund Placement',
          type: 'INITIAL',
        };
        setTransactions([initialTx]);
        localStorage.setItem('etica_mmf_txs', JSON.stringify([initialTx]));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred fetching MMF parameters');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiData) return;

    const amountNum = parseFloat(depositAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Please enter a valid positive deposit amount.');
      return;
    }

    const txDate = depositDate || new Date().toISOString().split('T')[0];
    const txDesc = depositDesc.trim() || 'M-Pesa Deposit Top-up';

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      amount: amountNum,
      date: txDate,
      description: txDesc,
      type: 'DEPOSIT',
    };

    const updated = [...transactions, newTx];
    setTransactions(updated);
    localStorage.setItem('etica_mmf_txs', JSON.stringify(updated));

    // Reset fields and close modal
    setDepositAmount('');
    setDepositDate('');
    setDepositDesc('');
    setIsModalOpen(false);
  };

  const handleResetTransactions = () => {
    if (!apiData) return;
    if (!confirm('Are you sure you want to reset all manual transactions?')) return;

    const initialTx: Transaction = {
      id: 'initial-seed',
      amount: apiData.initialPrincipal,
      date: apiData.startDate,
      description: 'Initial Fund Placement',
      type: 'INITIAL',
    };
    setTransactions([initialTx]);
    localStorage.setItem('etica_mmf_txs', JSON.stringify([initialTx]));
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2,
    }).format(val);
  };

  if (loading && !apiData) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
          <p style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>
            Compounding Interest Yields & Retrieving MMF Parameters...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="glass-strong" style={{ padding: 'var(--spacing-xl)', borderRadius: 'var(--radius-lg)', maxWidth: '480px', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-sm)' }}>🏛️</div>
          <h3 style={{ color: 'var(--accent-red)', fontWeight: '800', marginBottom: 'var(--spacing-xs)' }}>MMF Integration Offline</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-lg)' }}>{error}</p>
          <button
            onClick={fetchMmfState}
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
      {/* Title Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xl)', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
        <div>
          <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '900', letterSpacing: '-0.03em', background: 'var(--chrome-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Money Market Fund Terminal
          </h2>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
            Real-time compounding simulator representing assets held inside the Etica MMF
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleResetTransactions}
            className="glass-metallic"
            style={{
              padding: 'var(--spacing-sm) var(--spacing-lg)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--accent-red)',
              fontWeight: '700',
              fontSize: 'var(--font-size-sm)',
              cursor: 'pointer',
              border: '1px solid rgba(239, 68, 68, 0.2)'
            }}
          >
            Reset Logs
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="glass-metallic"
            style={{
              padding: 'var(--spacing-sm) var(--spacing-lg)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--accent-cyan)',
              fontWeight: '700',
              fontSize: 'var(--font-size-sm)',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-glow-cyan)'
            }}
          >
            💸 Log M-Pesa Deposit
          </button>
        </div>
      </div>

      {/* Main Metric Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-xl)' }}>
        {/* Core dynamic balance */}
        <div className="glass-metallic border-metallic" style={{ padding: 'var(--spacing-xl)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-glow-cyan)' }}>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700', marginBottom: 'var(--spacing-xs)' }}>
            Dynamic Compound Balance
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--text-primary)', wordBreak: 'break-all' }}>
            {formatCurrency(currentBalance)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: 'var(--spacing-sm)' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-emerald)', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--accent-emerald)', fontWeight: '700' }}>
              Compounding Daily
            </span>
          </div>
        </div>

        {/* Secondary metric card */}
        <div className="glass-metallic border-metallic" style={{ padding: 'var(--spacing-xl)', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
            <div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', marginBottom: 'var(--spacing-xs)' }}>
                Total Interest Earned
              </div>
              <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: '800', color: 'var(--accent-emerald)' }}>
                {formatCurrency(totalInterest)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', marginBottom: 'var(--spacing-xs)' }}>
                Annualized Yield
              </div>
              <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: '800', color: 'var(--accent-cyan)' }}>
                {apiData?.annualYield.toFixed(2)}%
              </div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', marginBottom: 'var(--spacing-xs)' }}>
                Original Principal
              </div>
              <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: '700', color: 'var(--text-secondary)' }}>
                {formatCurrency(totalPrincipal)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', marginBottom: 'var(--spacing-xs)' }}>
                Day Count
              </div>
              <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: '700', color: 'var(--text-secondary)' }}>
                {apiData?.daysElapsed} Calendar Days
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Logs Table */}
      <div className="glass-strong" style={{ borderRadius: 'var(--radius-xl)', padding: 'var(--spacing-lg)', boxShadow: 'var(--shadow-lg)' }}>
        <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '800', marginBottom: 'var(--spacing-md)', color: 'var(--text-primary)' }}>
          M-Pesa Deposit Ledger
        </h3>
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <th style={{ padding: 'var(--spacing-md) var(--spacing-sm)', color: 'var(--text-secondary)', fontWeight: '800', fontSize: 'var(--font-size-xs)', textTransform: 'uppercase' }}>Description</th>
                <th style={{ padding: 'var(--spacing-md) var(--spacing-sm)', color: 'var(--text-secondary)', fontWeight: '800', fontSize: 'var(--font-size-xs)', textTransform: 'uppercase' }}>Date</th>
                <th style={{ padding: 'var(--spacing-md) var(--spacing-sm)', color: 'var(--text-secondary)', fontWeight: '800', fontSize: 'var(--font-size-xs)', textTransform: 'uppercase' }}>Type</th>
                <th style={{ padding: 'var(--spacing-md) var(--spacing-sm)', color: 'var(--text-secondary)', fontWeight: '800', fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx, idx) => (
                <tr
                  key={tx.id}
                  style={{
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                    background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.01)',
                  }}
                >
                  <td style={{ padding: 'var(--spacing-md) var(--spacing-sm)', color: 'var(--text-primary)', fontWeight: '600' }}>
                    {tx.description}
                  </td>
                  <td style={{ padding: 'var(--spacing-md) var(--spacing-sm)', color: 'var(--text-secondary)' }}>
                    {tx.date}
                  </td>
                  <td style={{ padding: 'var(--spacing-md) var(--spacing-sm)' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: '800',
                      color: tx.type === 'INITIAL' ? 'var(--accent-purple)' : 'var(--accent-cyan)',
                      background: tx.type === 'INITIAL' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(0, 212, 255, 0.1)',
                      border: `1px solid ${tx.type === 'INITIAL' ? 'var(--accent-purple)' : 'var(--accent-cyan)'}30`,
                    }}>
                      {tx.type}
                    </span>
                  </td>
                  <td style={{ padding: 'var(--spacing-md) var(--spacing-sm)', color: 'var(--text-primary)', fontWeight: '700', textAlign: 'right' }}>
                    {formatCurrency(tx.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dynamic transaction modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(5, 8, 16, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          animation: 'fadeIn var(--transition-fast)'
        }}>
          <div className="glass-strong" style={{
            padding: 'var(--spacing-xl)',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: '450px',
            border: '1px solid var(--glass-border-strong)',
            boxShadow: 'var(--shadow-lg)',
            animation: 'fadeIn var(--transition-normal)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
              <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '800', color: 'var(--text-primary)' }}>
                Log M-Pesa Deposit
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddDeposit}>
              <div style={{ marginBottom: 'var(--spacing-md)' }}>
                <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', fontWeight: '700', marginBottom: 'var(--spacing-xs)', textTransform: 'uppercase' }}>
                  Amount (KES)
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 15000"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'var(--metal-dark)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    fontSize: 'var(--font-size-sm)',
                  }}
                />
              </div>
              <div style={{ marginBottom: 'var(--spacing-md)' }}>
                <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', fontWeight: '700', marginBottom: 'var(--spacing-xs)', textTransform: 'uppercase' }}>
                  Transaction Date
                </label>
                <input
                  type="date"
                  value={depositDate}
                  onChange={(e) => setDepositDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'var(--metal-dark)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    fontSize: 'var(--font-size-sm)',
                  }}
                />
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  Leave blank for current local date.
                </span>
              </div>
              <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', fontWeight: '700', marginBottom: 'var(--spacing-xs)', textTransform: 'uppercase' }}>
                  Description / Reference
                </label>
                <input
                  type="text"
                  placeholder="e.g. M-Pesa Top-up ref: K298AJ28H"
                  value={depositDesc}
                  onChange={(e) => setDepositDesc(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'var(--metal-dark)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    fontSize: 'var(--font-size-sm)',
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="glass-metallic"
                  style={{ padding: 'var(--spacing-sm) var(--spacing-lg)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', cursor: 'pointer', border: '1px solid var(--glass-border)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="glass-metallic"
                  style={{ padding: 'var(--spacing-sm) var(--spacing-lg)', borderRadius: 'var(--radius-md)', color: 'var(--accent-cyan)', fontWeight: '700', cursor: 'pointer', boxShadow: 'var(--shadow-glow-cyan)' }}
                >
                  Confirm Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <style jsx>{`
        @keyframes pulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
      `}</style>
    </div>
  );
}
