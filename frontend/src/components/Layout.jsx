import { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart2,
  Bell,
  Bot,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Command,
  Eye,
  LayoutDashboard,
  Newspaper,
  Settings,
  ShieldCheck,
  TrendingUp,
  Upload,
  Zap,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import Fuse from 'fuse.js';
import { theme, panelStyle } from '../lib/theme.js';
import MarketStatusBadge from './MarketStatusBadge.jsx';
import { usePortfolio } from '../lib/usePortfolio.js';
import { Search as SearchIcon } from 'lucide-react';

const NAV = [
  { to: '/dashboard', label: 'Command', icon: LayoutDashboard, group: 'Core' },
  { to: '/portfolio', label: 'Portfolio', icon: Briefcase, group: 'Core' },
  { to: '/analytics', label: 'Analytics', icon: BarChart2, group: 'Core' },
  { to: '/upload', label: 'Import', icon: Upload, group: 'Data' },
  { to: '/advisor', label: 'Advisor', icon: Bot, group: 'Intelligence' },
  { to: '/news', label: 'Signals', icon: Newspaper, group: 'Intelligence' },
  { to: '/watchlist', label: 'Watchlist', icon: Eye, group: 'Intelligence' },
  { to: '/profile', label: 'Profile', icon: ShieldCheck, group: 'Control' },
  { to: '/settings', label: 'System', icon: Settings, group: 'Control' },
];

const grouped = NAV.reduce((acc, item) => {
  acc[item.group] ||= [];
  acc[item.group].push(item);
  return acc;
}, {});

const titles = {
  '/dashboard': ['Command Center', 'Portfolio intelligence cockpit'],
  '/portfolio': ['Portfolio Matrix', 'Risk, allocation, and live exposure'],
  '/analytics': ['Analytics', 'P&L breakdown, allocation, and heatmaps'],
  '/upload': ['Data Ingestion', 'Broker imports and OCR processing'],
  '/advisor': ['AI Analyst', 'Portfolio-aware financial reasoning'],
  '/news': ['Market Signals', 'Editorial intelligence feed'],
  '/watchlist': ['Watchlist', 'Tracked symbols and price targets'],
  '/profile': ['Client Profile', 'Account settings and preferences'],
  '/settings': ['System Control', 'Keys, targets, and preferences'],
};

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState('');
  const [topSearch, setTopSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [paletteIndex, setPaletteIndex] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const paletteInputRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { holdings, watchlist, refresh } = usePortfolio();
  const [title, sub] = titles[location.pathname.replace('/app', '')] || ['WealthOS', 'Financial operating system'];
  const meta = useMemo(() => ({ latency: '22ms' }), []);

  const commandItems = useMemo(() => {
    const pageItems = NAV.map((item) => ({
      id: item.to,
      label: item.label,
      description: `Navigate to ${item.label.toLowerCase()}`,
      keywords: [item.label, item.group, item.to, 'page'],
      action: () => navigate(`/app${item.to}`),
    }));

    const holdingItems = holdings.slice(0, 12).map((holding) => ({
      id: `holding:${holding.id}`,
      label: holding.ticker,
      description: holding.company_name || holding.sector || 'Holding',
      keywords: [holding.ticker, holding.company_name, holding.sector, 'holding', 'portfolio'],
      action: () => navigate('/app/portfolio'),
    }));

    const watchItems = watchlist.slice(0, 10).map((item) => ({
      id: `watchlist:${item.id || item.ticker}`,
      label: item.ticker,
      description: item.company_name || 'Watchlist',
      keywords: [item.ticker, item.company_name, 'watchlist', 'signals'],
      action: () => navigate('/app/watchlist'),
    }));

    const actionItems = [
      { id: 'action:refresh', label: 'Refresh market data', description: 'Refetch portfolio and market status', keywords: ['refresh', 'reload', 'market'], action: () => refresh() },
      { id: 'action:advisor', label: 'Ask advisor', description: 'Open the AI Analyst', keywords: ['advisor', 'ai', 'ask'], action: () => navigate('/app/advisor') },
      { id: 'action:import', label: 'Import CSV', description: 'Open secure ingestion', keywords: ['import', 'csv', 'upload'], action: () => navigate('/app/upload') },
      { id: 'action:watchlist', label: 'Open watchlist', description: 'Monitor tracked symbols', keywords: ['watchlist', 'signals'], action: () => navigate('/app/watchlist') },
      { id: 'action:analytics', label: 'Open analytics', description: 'P&L breakdown and heatmaps', keywords: ['analytics', 'pnl', 'chart'], action: () => navigate('/app/analytics') },
      { id: 'action:profile', label: 'Open profile', description: 'Account and preferences', keywords: ['profile', 'account', 'settings'], action: () => navigate('/app/profile') },
    ];

    return [...actionItems, ...pageItems, ...holdingItems, ...watchItems];
  }, [holdings, navigate, refresh, watchlist]);

  const fuse = useMemo(() => new Fuse(commandItems, { keys: ['label', 'description', 'keywords'], threshold: 0.35, ignoreLocation: true }), [commandItems]);
  const commandResults = useMemo(() => {
    const query = paletteQuery.trim();
    const baseResults = !query
      ? commandItems.slice(0, 8)
      : fuse.search(query).slice(0, 7).map((result) => result.item);

    if (!query) return baseResults;

    const newsSearch = {
      id: `action:news-search:${query}`,
      label: `Search news: "${query}"`,
      description: 'Scan news for the current query',
      keywords: ['news', 'search', query],
      action: () => navigate(`/app/news?q=${encodeURIComponent(query)}`),
    };

    return [newsSearch, ...baseResults];
  }, [commandItems, fuse, navigate, paletteQuery]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen((value) => !value);
      }
      if (event.key === 'Escape') {
        setPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (paletteOpen) {
      window.setTimeout(() => paletteInputRef.current?.focus(), 0);
    } else {
      setPaletteQuery('');
      setPaletteIndex(0);
    }
  }, [paletteOpen]);

  function runCommand(item) {
    item.action();
    setPaletteOpen(false);
    setPaletteQuery('');
    setPaletteIndex(0);
  }

  function handlePaletteKeyDown(event) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setPaletteIndex((idx) => Math.min(idx + 1, commandResults.length - 1));
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setPaletteIndex((idx) => Math.max(idx - 1, 0));
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      const item = commandResults[paletteIndex];
      if (item) runCommand(item);
    }
  }

  return (
    <div
      className="app-shell"
      style={{
        minHeight: '100dvh',
        display: 'flex',
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #081817 0%, #0A201F 46%, #081716 100%)',
      }}
    >
      {/* ── Sidebar ── */}
      <motion.aside
        animate={{ width: collapsed ? 84 : 238 }}
        transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
        style={{ flexShrink: 0, height: '100dvh', padding: 14, position: 'sticky', top: 0, zIndex: 20 }}
      >
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', ...panelStyle() }}>
          {/* Logo */}
          <div style={{ padding: collapsed ? '16px 12px' : '18px 16px', display: 'flex', alignItems: 'center', gap: 11 }}>
            <div
              style={{
                width: 36, height: 36, borderRadius: 12,
                display: 'grid', placeItems: 'center',
                color: '#0A201F',
                background: theme.colors.gold,
                boxShadow: '0 16px 34px rgba(200,179,142,0.12)',
                flexShrink: 0,
              }}
            >
              <TrendingUp size={18} strokeWidth={2.5} />
            </div>
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }} transition={{ duration: 0.18 }}>
                  <div className="editorial-title" style={{ fontSize: 17, lineHeight: 1 }}>WealthOS</div>
                  <div className="section-label" style={{ marginTop: 5 }}>Private Terminal</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="divider" />

          {/* Nav groups */}
          <nav style={{ flex: 1, overflowY: 'auto', padding: collapsed ? '12px 9px' : '14px 10px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {Object.entries(grouped).map(([group, items]) => (
              <div key={group}>
                {!collapsed && <div className="section-label" style={{ padding: '0 10px 8px' }}>{group}</div>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {items.map(({ to, label, icon: Icon }) => (
                    <NavLink key={to} to={`/app${to}`}>
                      {({ isActive }) => (
                        <motion.div
                          whileHover={{ x: collapsed ? 0 : 2 }}
                          style={{
                            minHeight: 38,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: collapsed ? 'center' : 'flex-start',
                            gap: 10,
                            padding: collapsed ? '0' : '0 10px',
                            position: 'relative',
                            borderRadius: 12,
                            border: `1px solid ${isActive ? 'rgba(200,179,142,0.22)' : 'transparent'}`,
                            color: isActive ? theme.colors.text : theme.colors.textSoft,
                            background: isActive ? 'rgba(200,179,142,0.09)' : 'transparent',
                            transition: 'all 180ms cubic-bezier(0.16,1,0.3,1)',
                          }}
                        >
                          {isActive && (
                            <span
                              style={{
                                position: 'absolute', left: -1, top: 9, bottom: 9, width: 2,
                                borderRadius: 99,
                                background: `linear-gradient(180deg, ${theme.colors.gold}, ${theme.colors.accent})`,
                                boxShadow: '0 0 16px rgba(200,179,142,0.18)',
                              }}
                            />
                          )}
                          <Icon size={16} strokeWidth={isActive ? 2.2 : 1.7} />
                          <AnimatePresence initial={false}>
                            {!collapsed && (
                              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.16 }} style={{ fontSize: 13, fontWeight: isActive ? 700 : 500 }}>
                                {label}
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div style={{ padding: 10, borderTop: `1px solid ${theme.colors.border}` }}>
            {!collapsed && (
              <div style={{ padding: '12px 10px', marginBottom: 10, borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: `1px solid ${theme.colors.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: theme.colors.success, fontSize: 12, fontWeight: 700 }}>
                  <ShieldCheck size={14} /> Secure Sync
                </div>
                <div style={{ color: theme.colors.textMuted, fontSize: 11, marginTop: 5 }}>{meta.latency} · encrypted</div>
              </div>
            )}
            <button onClick={() => setCollapsed((v) => !v)} className="btn-icon" style={{ width: '100%' }} aria-label="Toggle navigation">
              {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
            </button>
          </div>
        </div>
      </motion.aside>

      {/* ── Main content ── */}
      <div style={{ flex: 1, minWidth: 0, height: '100dvh', display: 'flex', flexDirection: 'column', padding: '14px 14px 14px 0' }}>
        <header style={{ height: 62, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '0 16px 0 20px', ...panelStyle({ minHeight: 62 }) }}>
          <div style={{ minWidth: 0 }}>
            <div className="section-label">Wealth Intelligence</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 9, marginTop: 2 }}>
              <h1 className="editorial-title" style={{ fontSize: 18 }}>{title}</h1>
              <span className="hide-mobile" style={{ color: theme.colors.textMuted, fontSize: 12 }}>{sub}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Search bar */}
            <div className="hide-mobile" style={{ position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, width: 300, padding: '8px 10px', borderRadius: 12, border: `1px solid ${theme.colors.border}`, background: 'rgba(10,32,31,0.42)' }}>
                <SearchIcon size={14} color={theme.colors.textMuted} />
                <input
                  value={topSearch}
                  onChange={(e) => {
                    const q = e.target.value;
                    setTopSearch(q);
                    if (!q.trim()) { setSearchResults([]); return; }
                    const h = portfolio?.holdings || [];
                    const matches = h.filter(item => 
                      (item.name || '').toLowerCase().includes(q.toLowerCase()) || 
                      (item.symbol || item.ticker || '').toLowerCase().includes(q.toLowerCase())
                    );
                    setSearchResults(matches.slice(0, 6));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setSearchResults([]);
                      setTopSearch('');
                    }
                  }}
                  placeholder="Search holdings, watchlist, news…"
                  style={{ flex: 1, border: 0, outline: 'none', background: 'transparent', color: theme.colors.text, fontSize: 12 }}
                />
                <span className="mono" style={{ color: theme.colors.textMuted, fontSize: 10, border: `1px solid ${theme.colors.border}`, borderRadius: 6, padding: '1px 5px' }}>CTRL K</span>
              </div>
              
              {searchResults.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 8, background: '#111811', border: `1px solid ${theme.colors.border}`, borderRadius: 8, zIndex: 100, overflow: 'hidden' }}>
                  {searchResults.map((item, i) => (
                    <button key={i} onClick={() => {
                      setTopSearch('');
                      setSearchResults([]);
                      navigate(`/portfolio?highlight=${item.symbol || item.ticker}`);
                    }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '10px 12px', background: 'transparent', border: 'none', borderBottom: i === searchResults.length - 1 ? 'none' : `1px solid ${theme.colors.borderSubtle}`, color: theme.colors.text, cursor: 'pointer', textAlign: 'left' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>{item.symbol || item.ticker}</span>
                        <span style={{ fontSize: 10, color: theme.colors.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{item.name}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <span style={{ fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>₹{(item.current_value || 0).toLocaleString('en-IN', {maximumFractionDigits:0})}</span>
                        <span style={{ fontSize: 10, color: (item.pnl_pct || item.change_pct || 0) >= 0 ? '#4ade80' : '#f87171' }}>
                          {(item.pnl_pct || item.change_pct || 0) >= 0 ? '+' : ''}{(item.pnl_pct || item.change_pct || 0).toFixed(2)}%
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Real-time market status badge ── */}
            <div className="hide-tablet">
              <MarketStatusBadge showClock={true} showNextOpen={true} />
            </div>

            <button className="btn-icon" aria-label="AI actions" onClick={() => navigate('/app/advisor')}><Zap size={15} /></button>
            <button className="btn-icon" aria-label="Command menu" onClick={() => setPaletteOpen(true)}><Command size={15} /></button>
            <button className="btn-icon" aria-label="Notifications" onClick={() => setNotificationsOpen((open) => !open)} style={{ position: 'relative' }}>
              <Bell size={15} />
              <span style={{ position: 'absolute', top: 8, right: 8, width: 6, height: 6, borderRadius: 99, background: theme.colors.gold }} />
            </button>
            <button onClick={() => navigate('/app/profile')} style={{ width: 36, height: 36, borderRadius: 12, display: 'grid', placeItems: 'center', background: 'rgba(200,179,142,0.1)', border: '1px solid rgba(200,179,142,0.22)', color: theme.colors.gold, fontWeight: 800, cursor: 'pointer' }} aria-label="Open profile">W</button>
          </div>
        </header>

        <main style={{ flex: 1, overflowY: 'auto', padding: '24px 10px 10px 20px' }}>
          <Outlet />
        </main>
      </div>

      <AnimatePresence>
        {notificationsOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            style={{ position: 'fixed', top: 82, right: 72, zIndex: 75, width: 'min(340px, calc(100vw - 28px))', ...panelStyle({ padding: 14 }) }}
          >
            <div className="section-label">Notifications</div>
            <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>
              {[
                ['Market sync active', 'Live websocket and fallback polling are online.'],
                ['Advisor ready', 'Portfolio context is attached to AI requests.'],
                ['Risk monitor', holdings.length ? `${holdings.length} holdings tracked.` : 'Import holdings to activate risk alerts.'],
              ].map(([label, detail]) => (
                <div key={label} style={{ padding: 12, borderRadius: 12, border: `1px solid ${theme.colors.border}`, background: 'rgba(255,255,255,0.012)' }}>
                  <div style={{ color: theme.colors.text, fontWeight: 700, fontSize: 13 }}>{label}</div>
                  <div style={{ color: theme.colors.textSoft, fontSize: 12, marginTop: 4, lineHeight: 1.5 }}>{detail}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {paletteOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(2,6,23,0.62)', backdropFilter: 'blur(10px)', display: 'grid', placeItems: 'start center', paddingTop: 72 }}
            onClick={() => setPaletteOpen(false)}
          >
            <motion.div
              initial={{ y: 18, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 16, opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              onClick={(e) => e.stopPropagation()}
              style={{ width: 'min(760px, calc(100vw - 28px))', ...panelStyle({ padding: 18 }) }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, border: `1px solid ${theme.colors.border}`, borderRadius: 14, padding: '10px 12px', background: 'rgba(10,32,31,0.42)' }}>
                <SearchIcon size={16} color={theme.colors.textMuted} />
                <input
                  ref={paletteInputRef}
                  value={paletteQuery}
                  onChange={(e) => setPaletteQuery(e.target.value)}
                  onKeyDown={handlePaletteKeyDown}
                  placeholder="Search holdings, pages, or quick actions…"
                  style={{ flex: 1, border: 0, outline: 'none', background: 'transparent', color: theme.colors.text, fontSize: 14 }}
                />
                <span className="mono" style={{ color: theme.colors.textMuted, fontSize: 10, border: `1px solid ${theme.colors.border}`, borderRadius: 6, padding: '1px 5px' }}>ESC</span>
              </div>
              <div style={{ marginTop: 14, display: 'grid', gap: 8 }}>
                {commandResults.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => runCommand(item)}
                    style={{ textAlign: 'left', border: `1px solid ${theme.colors.border}`, borderRadius: 12, background: commandResults[paletteIndex]?.id === item.id ? 'rgba(200,179,142,0.08)' : 'rgba(255,255,255,0.01)', padding: '12px 14px', cursor: 'pointer', color: theme.colors.text }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                      <strong style={{ fontSize: 14 }}>{item.label}</strong>
                      <span style={{ color: theme.colors.textMuted, fontSize: 11 }}>{item.id.startsWith('action:') ? 'Action' : item.id.startsWith('holding:') ? 'Holding' : 'Navigation'}</span>
                    </div>
                    <div style={{ color: theme.colors.textSoft, fontSize: 12, marginTop: 4 }}>{item.description}</div>
                  </button>
                ))}
                {!commandResults.length && (
                  <div style={{ color: theme.colors.textMuted, padding: '12px 2px' }}>No matches found. Try another term or a page name.</div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pulse animation keyframe — injected once */}
      <style>{`
        @keyframes market-pulse {
          0%, 100% { transform: scale(1); opacity: 0.25; }
          50% { transform: scale(2.2); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
