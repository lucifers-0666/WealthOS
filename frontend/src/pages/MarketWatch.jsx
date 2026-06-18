import React, { useEffect, useState, useMemo } from 'react';
import { panelStyle } from '../lib/theme.js';
import { TrendingUp, Search, Activity, AlertTriangle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import {
  LineChart,
  Line,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
  AreaChart,
  Area
} from 'recharts';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function fmt(n, digits = 2) {
  if (n == null || isNaN(n)) return '—';
  return new Intl.NumberFormat('en-IN', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);
}

export default function MarketWatch() {
  const [symbol, setSymbol] = useState('NIFTYBEES');
  const [range, setRange] = useState('90');
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [indices, setIndices] = useState([
    { name: "NIFTY 50", symbol: "^NSEI", value: 22419.95, change: 0.42 },
    { name: "SENSEX", symbol: "^BSESN", value: 73806.15, change: 0.45 },
    { name: "USD/INR", symbol: "INR=X", value: 83.24, change: -0.12 },
    { name: "GOLD", symbol: "GC=F", value: 71200, change: 1.20 },
    { name: "MIDCAP 150", symbol: "NIFTY_MID_150.NS", value: 11847.30, change: 0.54 },
  ]);

  // Fetch indices from backend quotes if possible, else fall back to static
  useEffect(() => {
    const fetchIndices = async () => {
      try {
        const token = localStorage.getItem('token') || '';
        const symbolsStr = indices.map(i => i.symbol).join(',');
        const res = await fetch(`${API}/prices?tickers=${symbolsStr}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const next = indices.map(idx => {
            const quote = data[idx.symbol];
            if (quote) {
              return {
                ...idx,
                value: quote.price_inr || quote.price || idx.value,
                change: quote.pct_change || idx.change
              };
            }
            return idx;
          });
          setIndices(next);
        }
      } catch (err) {
        console.warn("Failed to fetch live indices prices, using fallbacks.");
      }
    };
    fetchIndices();
  }, []);

  // Fetch history for selected symbol
  useEffect(() => {
    const loadHistory = async () => {
      setLoadingHistory(true);
      try {
        const token = localStorage.getItem('token') || '';
        const res = await fetch(`${API}/api/market/history?symbol=${symbol}&range=${range}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setHistory(data.points || []);
        } else {
          setHistory([]);
        }
      } catch (err) {
        setHistory([]);
      } finally {
        setLoadingHistory(false);
      }
    };
    loadHistory();
  }, [symbol, range]);

  // Search symbols autocomplete
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      try {
        const token = localStorage.getItem('token') || '';
        const res = await fetch(`${API}/api/market/search?q=${searchQuery}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.results || []);
        }
      } catch (err) {
        setSearchResults([]);
      }
    }, 200);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const selectSymbol = (sym) => {
    setSymbol(sym);
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 32 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div className="section-label">Markets & Sentiment</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Real-time indicators, indices benchmarking, and technical histories.</div>
        </div>

        {/* Autocomplete Search input */}
        <div style={{ position: 'relative', width: 280 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
            borderRadius: 3, padding: '0 10px', height: 36
          }}>
            <Search size={14} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search ticker (e.g. INFY)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1, background: 'transparent', border: 'none',
                outline: 'none', color: 'var(--text-primary)', fontSize: 12,
                fontFamily: 'var(--font-sans)'
              }}
            />
          </div>
          {searchResults.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0,
              background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
              borderRadius: 3, marginTop: 4, zIndex: 10, maxHeight: 200, overflowY: 'auto'
            }}>
              {searchResults.map((res) => (
                <div
                  key={res.symbol}
                  onClick={() => selectSymbol(res.symbol)}
                  style={{
                    padding: '8px 12px', fontSize: 12, cursor: 'pointer',
                    color: 'var(--text-primary)', borderBottom: '1px solid var(--border-subtle)',
                    transition: 'background 150ms'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <strong style={{ color: 'var(--accent-gold)' }}>{res.symbol}</strong> — {res.name}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Indices Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14 }}>
        {indices.map((idx) => {
          const isUp = idx.change >= 0;
          return (
            <div key={idx.name} className="card" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {idx.name}
                <TrendingUp size={12} style={{ opacity: 0.6 }} />
              </div>
              <div style={{ color: 'var(--text-primary)', fontSize: 20, fontWeight: 600, fontFamily: 'var(--font-serif)' }}>
                {fmt(idx.value, 2)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: isUp ? 'var(--status-gain)' : 'var(--status-loss)', fontSize: 12, fontWeight: 600 }}>
                {isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {isUp ? '+' : ''}{fmt(idx.change, 2)}%
              </div>
            </div>
          );
        })}
      </div>

      {/* Symbol History Panel */}
      <div className="card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={16} style={{ color: 'var(--accent-gold)' }} />
            <h3 style={{ margin: 0, fontFamily: 'var(--font-serif)', color: 'var(--text-primary)', fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Historical Chart: <span style={{ color: 'var(--accent-gold)' }}>{symbol}</span>
            </h3>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { key: '30', label: '1M' },
              { key: '90', label: '3M' },
              { key: '365', label: '1Y' }
            ].map((r) => (
              <button
                key={r.key}
                onClick={() => setRange(r.key)}
                style={{
                  padding: '5px 10px', borderRadius: 3, border: `1px solid ${range === r.key ? 'var(--accent-gold)' : 'var(--border-default)'}`,
                  background: range === r.key ? 'var(--accent-gold-dim)' : 'transparent',
                  color: 'var(--text-primary)', fontSize: 11, fontWeight: 600, cursor: 'pointer'
                }}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Recharts chart */}
        <div style={{ height: 320, width: '100%', position: 'relative' }}>
          {loadingHistory ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              Loading index telemetry…
            </div>
          ) : history.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-gold)" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="var(--accent-gold)" stopOpacity={0.005}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border-subtle)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => {
                    try {
                      return new Date(val).toLocaleDateString('en-IN', { month: 'short', day: '2-digit' });
                    } catch (e) {
                      return val;
                    }
                  }}
                />
                <YAxis
                  tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  domain={['auto', 'auto']}
                  width={60}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 3,
                    color: 'var(--text-primary)'
                  }}
                  labelFormatter={(lbl) => new Date(lbl).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                />
                <Area type="monotone" dataKey="value" stroke="var(--accent-gold)" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: 8 }}>
              <AlertTriangle size={24} style={{ opacity: 0.5 }} />
              <div style={{ fontSize: 12 }}>No historical data available for {symbol}. Try another symbol.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
