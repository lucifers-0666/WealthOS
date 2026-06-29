import { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/useAuth.js';
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
  Sword
} from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'framer-motion';
import Fuse from 'fuse.js';
import { usePortfolio } from '../lib/usePortfolio.js';
import MarketStatusBadge from './MarketStatusBadge.jsx';
import TopbarRight from './TopbarRight.jsx';

const NAV = [
  { to: '/dashboard', label: 'Command Center', icon: Terminal, group: 'CORE' },
  { to: '/portfolio', label: 'Portfolio', icon: ChartPie, group: 'CORE' },
  { to: '/market-watch', label: 'Market Watch', icon: TrendUp, group: 'CORE' },
  { to: '/transactions', label: 'Transactions', icon: ArrowsLeftRight, group: 'CORE' },
  { to: '/advisor', label: 'Advisor', icon: Brain, group: 'INTELLIGENCE' },
  { to: '/signals', label: 'Signals', icon: Broadcast, group: 'INTELLIGENCE' },
  { to: '/watchlist', label: 'Watchlist', icon: Star, group: 'INTELLIGENCE' },
  { to: '/sandbox', label: 'Sandbox', icon: Sword, group: 'INTELLIGENCE' },
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
  >
    {({ isActive }) => (
      <>
        <Icon size={15} weight={isActive ? 'fill' : 'regular'} />
        <span>{label}</span>
      </>
    )}
  </NavLink>
);

export default function Layout() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState('');
  const [topSearch, setTopSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [paletteIndex, setPaletteIndex] = useState(0);
  const paletteInputRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { holdings, watchlist, refresh } = usePortfolio();
  const { user } = useAuth();
  
  const path = location.pathname;
  const [title, sub] = titles[path] || ['Command Center', 'Portfolio intelligence cockpit'];

  // Command palette logic...
  const commandItems = useMemo(() => {
    return NAV.map((item) => ({
      id: item.to,
      label: item.label,
      description: `Navigate to ${item.label.toLowerCase()}`,
      keywords: [item.label, item.group, item.to],
      action: () => navigate(item.to),
    }));
  }, [navigate]);

  const fuse = useMemo(() => new Fuse(commandItems, { keys: ['label', 'description', 'keywords'], threshold: 0.35 }), [commandItems]);
  const commandResults = useMemo(() => {
    const query = paletteQuery.trim();
    return !query ? commandItems.slice(0, 8) : fuse.search(query).slice(0, 7).map((result) => result.item);
  }, [commandItems, fuse, paletteQuery]);

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
      {/* ── Sidebar ── */}
      <aside className="layout-sidebar" style={{
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-default)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Top block */}
        <div style={{ height: 88, paddingTop: 18, paddingLeft: 16 }}>
          {/* Logo SVG Placeholder */}
          <div style={{ width: 22, height: 22, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" />
            </svg>
          </div>
          <div style={{ marginTop: 8 }}>
            <div className="brand-logo-name" style={{ fontFamily: 'Cinzel', fontSize: 12, fontWeight: 700, letterSpacing: '0.20em', textTransform: 'uppercase' }}>ARCA</div>
            <div className="brand-logo-tagline" style={{ fontFamily: 'Cinzel', fontSize: 8, fontWeight: 400, letterSpacing: '0.24em', textTransform: 'uppercase' }}>PRIVATE TERMINAL</div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, overflowY: 'auto', marginTop: 10, display: 'flex', flexDirection: 'column' }}>
          {Object.entries(grouped).map(([group, items]) => (
            <div key={group} style={{ marginBottom: 16 }}>
              <div className="nav-section-label" style={{ marginTop: 24, paddingLeft: 16, marginBottom: 6, fontFamily: 'Inter', fontSize: 9, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--text-muted)' }}>{group}</div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {items.map(({ to, label, icon: Icon }) => (
                  <NavItem key={to} to={to} icon={Icon} label={label} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom status block */}
        <div style={{ position: 'absolute', bottom: 0, width: '100%', borderTop: '1px solid var(--border-subtle)', padding: '14px 16px', background: 'var(--bg-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--status-gain)' }} />
            <span style={{ fontFamily: 'Inter', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--status-gain)' }}>SECURE SYNC</span>
          </div>
          <div style={{ fontFamily: 'Inter', fontSize: 9, fontWeight: 400, color: 'var(--text-muted)' }}>22ms · encrypted</div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="layout-body">
        
        {/* ── Topbar ── */}
        <header className="layout-topbar bg-[var(--color-surface)] h-[48px] min-h-[48px] max-h-[48px] border-b border-[var(--color-border)] px-[20px] pl-[24px] flex items-center justify-between">
          {/* Left zone */}
          <div className="flex flex-col justify-center gap-[3px]">
            <div className="font-inter text-[9px] font-medium tracking-[0.16em] uppercase text-[var(--color-text-faint)] leading-none">
              WEALTH INTELLIGENCE
            </div>
            <div className="flex flex-row items-center">
              <h1 className="font-cinzel text-[18px] font-bold text-[var(--color-text)] m-0 leading-none">{title}</h1>
              <span className="font-inter text-[11px] font-normal text-[var(--color-text-faint)] ml-[10px] leading-none">{sub}</span>
            </div>
          </div>

          {/* Center zone */}
          <div className="flex items-center gap-[8px] bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[3px] px-[10px] h-[30px] w-[300px] shrink-0 focus-within:border-[rgba(45,60,55,0.90)] transition-colors">
            <MagnifyingGlass size={13} className="text-[var(--color-text-faint)] shrink-0" />
            <input
              ref={paletteInputRef}
              type="text"
              value={topSearch}
              onChange={(e) => setTopSearch(e.target.value)}
              placeholder={user?.email ?? "Search holdings, watchlist, news..."}
              className="flex-1 bg-transparent border-none outline-none text-[var(--color-text)] font-inter text-[11px] placeholder:text-[var(--color-text-faint)]"
            />
            <span className="bg-[var(--color-overlay)] border border-[var(--color-border)] rounded-[2px] px-[5px] py-[2px] text-[9px] text-[var(--color-text-faint)] font-inter shrink-0 leading-none">
              CTRL K
            </span>
          </div>

          {/* Right zone */}
          <TopbarRight />
        </header>

        {/* ── Content Area ── */}
        <main className="layout-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
