import { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
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
  Bell
} from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'framer-motion';
import Fuse from 'fuse.js';
import { usePortfolio } from '../lib/usePortfolio.js';

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
        <Icon size={16} weight={isActive ? 'fill' : 'regular'} />
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
        <div style={{ height: 88, paddingTop: 16, paddingLeft: 16 }}>
          {/* Logo SVG Placeholder */}
          <div style={{ width: 28, height: 28, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" />
            </svg>
          </div>
          <div style={{ marginTop: 10 }}>
            <div className="brand-logo-name">ARCA</div>
            <div className="brand-logo-tagline">PRIVATE TERMINAL</div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, overflowY: 'auto', marginTop: 10, display: 'flex', flexDirection: 'column' }}>
          {Object.entries(grouped).map(([group, items]) => (
            <div key={group} style={{ marginBottom: 16 }}>
              <div className="nav-section-label" style={{ marginTop: 20, paddingLeft: 16, marginBottom: 8 }}>{group}</div>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--status-gain)' }} />
            <span className="nav-item-inactive">SECURE SYNC</span>
          </div>
          <div className="nav-section-label">22ms · encrypted</div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="layout-body">
        
        {/* ── Topbar ── */}
        <header className="layout-topbar" style={{
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-default)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingLeft: 24,
          paddingRight: 20
        }}>
          {/* Left zone */}
          <div style={{ display: 'flex', alignItems: 'baseline' }}>
            <div>
              <div className="nav-section-label" style={{ marginBottom: 2 }}>WEALTH INTELLIGENCE</div>
              <div style={{ display: 'flex', alignItems: 'baseline' }}>
                <h1 className="topbar-page-title">{title}</h1>
                <span className="topbar-subtitle" style={{ marginLeft: 12 }}>{sub}</span>
              </div>
            </div>
          </div>

          {/* Center zone */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--bg-base)',
            border: '1px solid var(--border-default)',
            borderRadius: '3px',
            padding: '0 10px',
            height: '30px',
            width: '320px',
            flexShrink: 0,
          }}>
            {/* MagnifyingGlass icon */}
            <MagnifyingGlass size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            
            <input
              ref={paletteInputRef}
              type="text"
              value={topSearch}
              onChange={(e) => setTopSearch(e.target.value)}
              placeholder="Search holdings, watchlist, no..."
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-sans)',
                fontSize: '12px',
                lineHeight: 1,
              }}
            />

            {/* CTRL K badge */}
            <span style={{
              background: 'var(--bg-overlay)',
              border: '1px solid var(--border-default)',
              borderRadius: '2px',
              padding: '2px 5px',
              fontSize: '10px',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-sans)',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}>
              CTRL K
            </span>
          </div>

          {/* Right zone */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'var(--fill-gain)', border: '1px solid var(--border-gain)', borderRadius: 3,
              padding: '4px 10px'
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--status-gain)' }} />
              <span className="badge-label" style={{ color: 'var(--status-gain)' }}>MARKETS OPEN</span>
            </div>
            
            <SquaresFour size={16} color="var(--text-muted)" />
            
            <div style={{ position: 'relative' }}>
              <Bell size={16} color="var(--text-muted)" />
              {/* Optional notification dot */}
              <span style={{ position: 'absolute', top: -2, right: -2, width: 6, height: 6, borderRadius: '50%', background: 'var(--status-loss)' }} />
            </div>

            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: 10, color: 'var(--text-primary)' }}>AK</span>
            </div>
          </div>
        </header>

        {/* ── Content Area ── */}
        <main className="layout-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
