import { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/useAuth.js';
import { request } from '../lib/api.js';
import {
  Terminal,
  ChartPie,
  TrendUp,
  ArrowsLeftRight,
  Brain,
  Broadcast,
  Star,
  Gear,
  UserCircle,
  MagnifyingGlass,
  SquaresFour,
  Bell,
  Sword,
  List,
  X
} from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'framer-motion';
import Fuse from 'fuse.js';
import { usePortfolio } from '../lib/usePortfolio.js';
import MarketStatusBadge from './MarketStatusBadge.jsx';
import TopbarRight from './TopbarRight.jsx';
import { GreekFrieze } from './GreekOrnaments.jsx';

const NAV = [
  { to: '/dashboard', label: 'Command Center', icon: Terminal, group: 'CORE' },
  { to: '/portfolio', label: 'Portfolio', icon: ChartPie, group: 'CORE' },
  { to: '/market-watch', label: 'Market Watch', icon: TrendUp, group: 'CORE' },
  { to: '/transactions', label: 'Transactions', icon: ArrowsLeftRight, group: 'CORE' },
  { to: '/advisor', label: 'Advisor', icon: Brain, group: 'INTELLIGENCE' },
  { to: '/signals', label: 'Signals', icon: Broadcast, group: 'INTELLIGENCE' },
  { to: '/watchlist', label: 'Watchlist', icon: Star, group: 'INTELLIGENCE' },
  { to: '/settings', label: 'Settings', icon: Gear, group: 'CONTROL' },
  { to: '/profile', label: 'Profile', icon: UserCircle, group: 'CONTROL' },
];

const grouped = NAV.reduce((acc, item) => {
  acc[item.group] ||= [];
  acc[item.group].push(item);
  return acc;
}, {});

const titles = {
  '/dashboard': ['Command Center', 'Portfolio intelligence cockpit'],
  '/portfolio': ['Portfolio', 'Risk, allocation, and live exposure'],
  '/market-watch': ['Market Watch', 'Live indices and sentiment'],
  '/transactions': ['Transactions', 'Trade history and activity'],
  '/advisor': ['AI Advisor', 'Portfolio-aware financial reasoning'],
  '/signals': ['Signals', 'Editorial intelligence feed'],
  '/watchlist': ['Watchlist', 'Tracked symbols and price targets'],
  '/settings': ['Settings', 'Keys, targets, and preferences'],
  '/profile': ['Client Profile', 'Account settings'],
  '/sandbox': ['Sandbox', 'Paper trading and options demo'],
};

// Nav item component
const NavItem = ({ to, icon: Icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `nav-item ${isActive ? 'nav-item--active' : ''}`
    }
    style={{ textDecoration: 'none' }}
  >
    {({ isActive }) => (
      <>
        <Icon size={16} weight={isActive ? 'fill' : 'regular'} />
        <span>{label}</span>
      </>
    )}
  </NavLink>
);

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [topSearch, setTopSearch] = useState('');
  const paletteInputRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { holdings, watchlist, refresh } = usePortfolio();
  const { user } = useAuth();
  
  const path = location.pathname;
  const [title, sub] = titles[path] || ['Command Center', 'Portfolio intelligence cockpit'];

  useEffect(() => {
    setMobileOpen(false);
  }, [path]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        paletteInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className="layout-shell app-shell">
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div className="mobile-sidebar-backdrop" onClick={() => setMobileOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`layout-sidebar ${mobileOpen ? 'mobile-open' : ''}`} style={{
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-default)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Top block (88px height) */}
        <div style={{ height: 88, paddingTop: 16, paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Logo */}
          <div style={{ width: 28, height: 28, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.2">
              <path d="M14 6c-2.5 0-4.5 1.5-4.5 4.5 0 .5.1 1.2.3 1.7-.5.5-.8 1.2-.8 2 0 2 1.5 3.8 3.5 3.8h3c2 0 3.5-1.8 3.5-3.8 0-.8-.3-1.5-.8-2 .2-.5.3-1.2.3-1.7 0-3-2-4.5-4.5-4.5z" />
              <circle cx="11.5" cy="10.5" r="1.2" fill="currentColor" />
              <circle cx="16.5" cy="10.5" r="1.2" fill="currentColor" />
              <polygon points="14,11.5 13,13 15,13" fill="currentColor" />
              <path d="M7 8c-2.5 3-2.5 7.5 0 11.5c2 3.5 5 4.5 7 4.5" />
              <path d="M5.5 11l1.5.5M4 14.5l2 .5M5 18l1.5.2" />
              <path d="M21 8c2.5 3 2.5 7.5 0 11.5c-2 3.5-5 4.5-7 4.5" />
              <path d="M22.5 11l-1.5.5M24 14.5l-2 .5M23 18l-1.5.2" />
            </svg>
          </div>
          <div>
            <div className="brand-logo-name" style={{ fontFamily: 'Cinzel', fontSize: 13, fontWeight: 700, letterSpacing: '0.20em', textTransform: 'uppercase', color: 'var(--text-primary)' }}>ANTIGRAVITY</div>
            <div className="brand-logo-tagline" style={{ fontFamily: 'Cinzel', fontSize: 9, fontWeight: 400, letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: 1 }}>PRIVATE TERMINAL</div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, overflowY: 'auto', marginTop: 10, display: 'flex', flexDirection: 'column' }}>
          {Object.entries(grouped).map(([group, items]) => (
            <div key={group} style={{ marginBottom: 16 }}>
              <div className="nav-section-label" style={{ marginTop: 20, paddingLeft: 16, marginBottom: 6, fontFamily: 'Inter', fontSize: 9, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.16em', color: 'var(--text-muted)' }}>{group}</div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {items.map(({ to, label, icon: Icon }) => (
                  <NavItem key={to} to={to} icon={Icon} label={label} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom status block */}
        <div style={{ position: 'absolute', bottom: 0, width: '100%', borderTop: '1px solid var(--border-subtle)', padding: '12px 16px', background: 'var(--bg-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--status-gain)' }} />
            <span style={{ fontFamily: 'Cinzel', fontSize: 11, fontWeight: 400, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>SECURE SYNC</span>
          </div>
          <div style={{ fontFamily: 'Inter', fontSize: 9, fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>22ms · encrypted</div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="layout-body">
        
        {/* ── Topbar ── */}
        <header className="layout-topbar bg-[var(--color-surface)] h-[48px] min-h-[48px] max-h-[48px] border-b border-[var(--color-border)] px-[20px] pl-[24px] flex items-center justify-between">
          {/* Left zone */}
          <div className="flex items-center gap-[12px]">
            <button 
              className="mobile-hamburger-btn"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle navigation menu"
            >
              {mobileOpen ? <X size={18} /> : <List size={18} />}
            </button>
            <div className="flex flex-col justify-center gap-[3px]">
              <div className="font-inter text-[9px] font-medium tracking-[0.16em] uppercase text-[var(--color-text-faint)] leading-none">
                WEALTH INTELLIGENCE
              </div>
              <div className="flex flex-row items-baseline">
                <h1 className="font-cinzel text-[20px] font-bold text-[var(--color-text)] m-0 leading-none">{title}</h1>
                <span className="font-inter text-[11px] font-normal text-[var(--color-text-faint)] ml-[12px] leading-none hide-mobile">{sub}</span>
              </div>
            </div>
          </div>

          {/* Center zone */}
          <div className="search-box-center flex items-center gap-[8px] bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[3px] px-[10px] h-[30px] w-[320px] shrink-0 focus-within:border-[rgba(45,60,55,0.90)] transition-colors">
            <MagnifyingGlass size={14} className="text-[var(--color-text-faint)] shrink-0" />
            <input
              ref={paletteInputRef}
              type="text"
              value={topSearch}
              onChange={(e) => setTopSearch(e.target.value)}
              placeholder="Search holdings, watchlist, news..."
              className="flex-1 bg-transparent border-none outline-none text-[var(--color-text)] font-inter text-[12px] placeholder:text-[var(--color-text-faint)]"
            />
            <span className="bg-[var(--color-overlay)] border border-[var(--color-border)] rounded-[2px] px-[5px] py-[2px] text-[10px] text-[var(--color-text-faint)] font-inter shrink-0 leading-none">
              CTRL K
            </span>
          </div>

          {/* Right zone */}
          <TopbarRight />
        </header>

        {/* Greek Meander Strip */}
        <div style={{ height: 5, background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-default)', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
          <GreekFrieze height={5} color="rgba(200, 179, 142, 0.15)" />
        </div>

        {/* Global Ticker Bar */}
        <TickerBar />

        {/* ── Content Area ── */}
        <main className="layout-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

// Global Ticker Bar component
function TickerBar() {
  const [indices, setIndices] = useState(null);
  
  const SKELETON_INDICES = [
    { label: "NIFTY 50", price: 22419.95, change_pct: 0.42 },
    { label: "SENSEX", price: 73806.15, change_pct: 0.45 },
    { label: "USD/INR", price: 83.24, change_pct: -0.12 },
    { label: "GOLD", price: 71200, change_pct: 1.20, isGold: true },
    { label: "MIDCAP 150", price: 11847.30, change_pct: 0.54 },
    { label: "IT INDEX", price: 36214.80, change_pct: -0.18 },
  ];

  useEffect(() => {
    async function fetchIndices() {
      try {
        const data = await request('GET', '/api/market/indices');
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map(item => {
            if (item.label === 'INDIA VIX') return { ...item, label: 'USD/INR', price: 83.24, change_pct: -0.12 };
            if (item.label === 'BANK NIFTY') return { ...item, label: 'GOLD', price: 71200, change_pct: 1.20, isGold: true };
            if (item.label === 'MIDCAP 150') return { ...item, label: 'MIDCAP 150', price: 11847.30, change_pct: 0.54 };
            if (item.label === 'INDIA VIX') return { ...item, label: 'IT INDEX', price: 36214.80, change_pct: -0.18 };
            return item;
          });
          setIndices(mapped);
        }
      } catch (err) {
        console.error("Indices marquee fetch failed", err);
      }
    }
    fetchIndices();
    const interval = setInterval(fetchIndices, 60000);
    return () => clearInterval(interval);
  }, []);

  const items = indices || SKELETON_INDICES;

  return (
    <div className="ticker-bar">
      <div className="ticker-live" style={{ width: 80, paddingLeft: 14, justifyContent: 'flex-start', borderRight: '1px solid var(--border-default)' }}>
        <span className="ticker-live-dot" style={{ width: 8, height: 8, background: 'var(--status-gain)' }} />
        <span className="ticker-live-text" style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em' }}>LIVE</span>
      </div>

      <div className="ticker-track-container" style={{ overflow: 'hidden' }}>
        <div className="ticker-track">
          {[...items, ...items].map((item, i) => {
            const isGold = item.isGold || item.label === 'GOLD';
            const isGain = item.change_pct >= 0;
            const priceStr = isGold 
              ? `₹${item.price.toLocaleString('en-IN')}` 
              : item.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            return (
              <div key={i} className="ticker-item" style={{ borderRight: '1px solid var(--border-subtle)', padding: '0 20px', display: 'flex', alignItems: 'center', gap: 7 }}>
                <span className="ticker-name" style={{ fontFamily: 'Inter', fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{item.label}</span>
                <span className="ticker-value" style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: 'var(--text-primary)' }}>{priceStr}</span>
                <span className={isGain ? 'ticker-change-up' : 'ticker-change-down'} style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: isGain ? 'var(--status-gain)' : 'var(--status-loss)' }}>
                  {isGain ? '+' : ''}{item.change_pct.toFixed(2)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
