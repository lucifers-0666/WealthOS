import { useState, useEffect, useCallback } from 'react';
const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const fmt = (n, d = 2) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });
const fmtPct = (n) => (Number(n || 0) >= 0 ? '+' : '') + fmt(n) + '%';

export default function Watchlist() {
  const [items, setItems] = useState([]);
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [alertModal, setAlertModal] = useState(null);
  const [alertForm, setAlertForm] = useState({ target_price: '', direction: 'above' });
  const [recentSearches, setRecentSearches] = useState([]);

  useEffect(() => { fetchWatchlist(); }, []);
  useEffect(() => {
    if (!items.length) return;
    fetchPrices();
    const id = setInterval(fetchPrices, 15000);
    return () => clearInterval(id);
  }, [items]);

  const fetchWatchlist = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/watchlist`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` },
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data.watchlist || data || []);
      }
    } catch (e) { console.warn('Watchlist fetch failed'); }
    finally { setLoading(false); }
  };

  const fetchPrices = useCallback(async () => {
    if (!items.length) return;
    const symbols = items.map(i => i.symbol).join(',');
    try {
      const res = await fetch(`${API}/api/market/batch?symbols=${symbols}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPrices(data.prices || data);
      }
    } catch (e) { console.warn('Price fetch failed'); }
  }, [items]);

  const handleSearch = async (q) => {
    setSearch(q);
    if (!q.trim() || q.length < 2) { setSearchResults([]); return; }
    try {
      const res = await fetch(`${API}/api/market/search?q=${encodeURIComponent(q)}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.results || []);
      }
    } catch (e) { setSearchResults([]); }
  };

  const addSymbol = async (symbol) => {
    try {
      const res = await fetch(`${API}/api/watchlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` },
        body: JSON.stringify({ symbol }),
      });
      if (res.ok) {
        setSearch('');
        setSearchResults([]);
        setRecentSearches(prev => [symbol, ...prev.filter(s => s !== symbol)].slice(0, 5));
        await fetchWatchlist();
      }
    } catch (e) { console.warn('Add watchlist failed'); }
  };

  const removeSymbol = async (symbol) => {
    try {
      await fetch(`${API}/api/watchlist/${symbol}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` },
      });
      await fetchWatchlist();
    } catch (e) { console.warn('Remove watchlist failed'); }
  };

  const setAlert = async () => {
    if (!alertModal || !alertForm.target_price) return;
    try {
      await fetch(`${API}/api/watchlist/alerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` },
        body: JSON.stringify({ symbol: alertModal, ...alertForm }),
      });
      setAlertModal(null);
    } catch (e) { console.warn('Set alert failed'); }
  };

  const change = (sym) => prices[sym]?.change_pct || 0;
  const isUp = (sym) => change(sym) >= 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-cream">Watchlist</h1>
          <p className="text-xs text-muted mt-1">Live prices · Price alerts · Updates every 15s</p>
        </div>
        <span className="text-xs text-emerald-400">{items.length} tracked</span>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          value={search}
          onChange={e => handleSearch(e.target.value)}
          placeholder="Search NSE symbol (e.g. RELIANCE, TCS)..."
          className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-cream placeholder-muted text-sm focus:outline-none focus:border-emerald-500/50"
        />
        {(searchResults.length > 0 || (search.length > 0 && searchResults.length === 0)) && (
          <div className="absolute top-full mt-1 left-0 right-0 z-20 bg-surface border border-white/10 rounded-xl overflow-hidden shadow-xl">
            {searchResults.length === 0 ? (
              <div className="px-4 py-3 text-xs text-muted">No symbols found for "{search}"</div>
            ) : (
              searchResults.map(r => (
                <button
                  key={r.symbol || r}
                  onClick={() => addSymbol(r.symbol || r)}
                  className="w-full px-4 py-2.5 text-left text-sm hover:bg-white/5 transition flex items-center justify-between"
                >
                  <span className="text-cream font-medium">{r.symbol || r}</span>
                  <span className="text-xs text-muted">{r.name || ''}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Recent searches */}
      {recentSearches.length > 0 && !search && (
        <div className="flex gap-2 items-center">
          <span className="text-xs text-muted">Recent:</span>
          {recentSearches.map(s => (
            <button key={s} onClick={() => addSymbol(s)}
              className="text-xs px-2 py-1 rounded-lg bg-white/5 text-muted hover:text-cream transition">
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 rounded-2xl bg-white/5 animate-pulse" />
        ))}</div>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">📈</div>
          <p className="font-medium text-cream">Your watchlist is empty</p>
          <p className="text-xs text-muted mt-1">Search for any NSE symbol above to start tracking</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(item => {
            const sym = item.symbol;
            const p = prices[sym] || {};
            const up = (p.change_pct || 0) >= 0;
            return (
              <div key={sym} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/8 transition group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-cream">{sym}</span>
                    <span className="text-xs text-muted">{item.name || ''}</span>
                  </div>
                  <div className="flex gap-3 mt-1 text-xs text-muted">
                    {p.week_52_high && <span>52W H: ₹{fmt(p.week_52_high)}</span>}
                    {p.week_52_low && <span>52W L: ₹{fmt(p.week_52_low)}</span>}
                    {p.market_cap > 0 && <span>Mcap: ₹{fmt(p.market_cap / 1e7, 0)}Cr</span>}
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm font-bold text-cream">₹{fmt(p.ltp || 0)}</p>
                  <p className={`text-xs font-medium ${up ? 'text-emerald-400' : 'text-red-400'}`}>
                    {fmtPct(p.change_pct)}
                  </p>
                </div>

                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={() => { setAlertModal(sym); setAlertForm({ target_price: '', direction: 'above' }); }}
                    className="p-1.5 rounded-lg bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 transition text-xs"
                    title="Set price alert"
                  >🔔</button>
                  <button
                    onClick={() => removeSymbol(sym)}
                    className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition text-xs"
                    title="Remove from watchlist"
                  >×</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Alert Modal */}
      {alertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-surface border border-white/10 rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h2 className="text-base font-semibold text-cream">Set Price Alert — {alertModal}</h2>
            <div className="space-y-3">
              <select
                value={alertForm.direction}
                onChange={e => setAlertForm(p => ({ ...p, direction: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-cream text-sm"
              >
                <option value="above">Price goes above</option>
                <option value="below">Price goes below</option>
              </select>
              <input
                type="number"
                placeholder="Target price (₹)"
                value={alertForm.target_price}
                onChange={e => setAlertForm(p => ({ ...p, target_price: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-cream placeholder-muted text-sm"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setAlertModal(null)} className="px-4 py-2 text-sm text-muted hover:text-cream">Cancel</button>
              <button onClick={setAlert} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-lg">Set Alert</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
