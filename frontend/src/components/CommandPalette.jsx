/**
 * CommandPalette — CTRL+K global command palette
 * Keyboard shortcuts: CTRL+K open, ESC close, Arrow navigate, Enter execute
 * Sections: Navigation, Portfolio Actions, Market, Settings
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMarketData } from '../lib/MarketDataContext.jsx';
import {
  LayoutDashboard, TrendingUp, BookOpen, BarChart2, User, Settings,
  Search, Plus, Upload, Download, RefreshCw, Bell, LogOut,
  Keyboard, ChevronRight, Command, Activity,
} from 'lucide-react';
import { theme } from '../lib/theme.js';

const COMMANDS = [
  { id: 'nav-dashboard',  label: 'Go to Dashboard',   section: 'Navigate', icon: LayoutDashboard, path: '/' },
  { id: 'nav-portfolio',  label: 'Go to Portfolio',    section: 'Navigate', icon: TrendingUp,      path: '/portfolio' },
  { id: 'nav-watchlist',  label: 'Go to Watchlist',    section: 'Navigate', icon: BookOpen,        path: '/watchlist' },
  { id: 'nav-analytics',  label: 'Go to Analytics',    section: 'Navigate', icon: BarChart2,       path: '/analytics' },
  { id: 'nav-profile',    label: 'Go to Profile',      section: 'Navigate', icon: User,            path: '/profile' },
  { id: 'nav-signals',    label: 'Go to Signals',      section: 'Navigate', icon: Activity,        path: '/signals' },
  { id: 'action-add',     label: 'Add New Holding',    section: 'Actions',  icon: Plus,            action: 'add-holding' },
  { id: 'action-import',  label: 'Import Holdings CSV',section: 'Actions',  icon: Upload,          action: 'import' },
  { id: 'action-export',  label: 'Export Portfolio CSV',section:'Actions',  icon: Download,        action: 'export' },
  { id: 'action-refresh', label: 'Refresh Market Data',section: 'Actions',  icon: RefreshCw,       action: 'refresh' },
  { id: 'action-alerts',  label: 'Manage Price Alerts',section: 'Actions',  icon: Bell,            path: '/watchlist' },
  { id: 'help-shortcuts', label: 'Keyboard Shortcuts', section: 'Help',     icon: Keyboard,        action: 'shortcuts' },
];

const SHORTCUTS = [
  { keys: ['Ctrl', 'K'],   description: 'Open command palette' },
  { keys: ['Esc'],         description: 'Close / go back' },
  { keys: ['G', 'D'],      description: 'Go to Dashboard' },
  { keys: ['G', 'P'],      description: 'Go to Portfolio' },
  { keys: ['G', 'W'],      description: 'Go to Watchlist' },
  { keys: ['G', 'A'],      description: 'Go to Analytics' },
  { keys: ['\u2191', '\u2193'],   description: 'Navigate results' },
  { keys: ['Enter'],       description: 'Execute command' },
];

function kbd(keys) {
  return keys.map((k, i) => (
    <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
      <span style={{ padding: '1px 6px', borderRadius: 4, border: `1px solid ${theme.colors.border}`,
        background: theme.colors.surface2, fontSize: 11, fontFamily: 'monospace', color: theme.colors.textMuted }}>{ k }</span>
      {i < keys.length - 1 && <span style={{ fontSize: 10, color: theme.colors.textFaint }}>+</span>}
    </span>
  ));
}

export default function CommandPalette({ onAction }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const navigate = useNavigate();
  const { isConnected, status } = useMarketData();

  // CTRL+K / global keyboard nav
  useEffect(() => {
    let gBuffer = '';
    let gTimer = null;

    const onKey = (e) => {
      // CTRL+K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
        setQuery('');
        setActiveIdx(0);
        return;
      }

      // G+X shortcuts (only when palette is closed and not typing in input)
      if (!open && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        if (e.key === 'g' || e.key === 'G') {
          gBuffer = 'g';
          clearTimeout(gTimer);
          gTimer = setTimeout(() => { gBuffer = ''; }, 600);
          return;
        }
        if (gBuffer === 'g') {
          gBuffer = '';
          clearTimeout(gTimer);
          const routes = { d: '/', p: '/portfolio', w: '/watchlist', a: '/analytics' };
          const route = routes[e.key.toLowerCase()];
          if (route) { e.preventDefault(); navigate(route); }
        }
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, navigate]);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
  }, [open]);

  const filtered = useMemo(() => {
    if (!query.trim()) return COMMANDS;
    const q = query.toLowerCase();
    return COMMANDS.filter((c) => c.label.toLowerCase().includes(q) || c.section.toLowerCase().includes(q));
  }, [query]);

  // Group by section
  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach((cmd) => {
      if (!map[cmd.section]) map[cmd.section] = [];
      map[cmd.section].push(cmd);
    });
    return map;
  }, [filtered]);

  const flatFiltered = filtered;

  const handleKey = useCallback((e) => {
    if (e.key === 'Escape') { setOpen(false); setShowShortcuts(false); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, flatFiltered.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); }
    if (e.key === 'Enter') {
      e.preventDefault();
      const cmd = flatFiltered[activeIdx];
      if (cmd) executeCmd(cmd);
    }
  }, [flatFiltered, activeIdx]);

  const executeCmd = useCallback((cmd) => {
    setOpen(false);
    setQuery('');
    if (cmd.path) { navigate(cmd.path); return; }
    if (cmd.action === 'shortcuts') { setShowShortcuts(true); setOpen(false); return; }
    if (onAction) onAction(cmd.action);
  }, [navigate, onAction]);

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${activeIdx}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIdx]);

  if (!open && !showShortcuts) return null;

  const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '15vh' };
  const palette = {
    width: '100%', maxWidth: 560, background: theme.colors.surface,
    border: `1px solid ${theme.colors.border}`, borderRadius: 3,
    boxShadow: '0 24px 64px rgba(0,0,0,0.5)', overflow: 'hidden',
    animation: 'cmdFadeIn 0.12s ease',
  };

  // Shortcuts modal
  if (showShortcuts) {
    return (
      <div style={overlay} onClick={() => setShowShortcuts(false)}>
        <div style={{ ...palette, maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${theme.colors.border}`, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Keyboard size={16} />
            Keyboard Shortcuts
          </div>
          <div style={{ padding: 20 }}>
            {SHORTCUTS.map((s, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 0', borderBottom: i < SHORTCUTS.length - 1 ? `1px solid ${theme.colors.border}` : 'none' }}>
                <span style={{ fontSize: 13, color: theme.colors.textMuted }}>{s.description}</span>
                <span style={{ display: 'flex', gap: 4 }}>{kbd(s.keys)}</span>
              </div>
            ))}
          </div>
          <div style={{ padding: '12px 20px', borderTop: `1px solid ${theme.colors.border}`, textAlign: 'center', fontSize: 12, color: theme.colors.textFaint }}>Press Esc to close</div>
        </div>
        <style>{`@keyframes cmdFadeIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}`}</style>
      </div>
    );
  }

  return (
    <div style={overlay} onClick={() => setOpen(false)}>
      <div style={palette} onClick={(e) => e.stopPropagation()} onKeyDown={handleKey}>
        {/* Search input */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: `1px solid ${theme.colors.border}`, gap: 10 }}>
          <Search size={16} style={{ color: theme.colors.textMuted, flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveIdx(0); }}
            placeholder="Search commands..."
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none',
              fontSize: 14, color: theme.colors.text, fontFamily: 'inherit' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: isConnected ? 'var(--color-success,#4ade80)' : 'var(--color-error,#f87171)', flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: theme.colors.textFaint }}>{status}</span>
          </div>
        </div>

        {/* Results */}
        <div ref={listRef} style={{ maxHeight: 400, overflow: 'auto', padding: '8px 0' }}>
          {Object.entries(grouped).map(([section, cmds]) => (
            <div key={section}>
              <div style={{ padding: '6px 16px 4px', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: theme.colors.textFaint }}>{section}</div>
              {cmds.map((cmd) => {
                const globalIdx = flatFiltered.indexOf(cmd);
                const isActive = globalIdx === activeIdx;
                const Icon = cmd.icon;
                return (
                  <div key={cmd.id} data-idx={globalIdx}
                    onMouseEnter={() => setActiveIdx(globalIdx)}
                    onClick={() => executeCmd(cmd)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px',
                      cursor: 'pointer', transition: 'background 0.1s',
                      background: isActive ? `${theme.colors.primary}18` : 'transparent',
                      borderLeft: isActive ? `2px solid var(--color-primary,#4f98a3)` : '2px solid transparent' }}>
                    <Icon size={15} style={{ color: isActive ? 'var(--color-primary,#4f98a3)' : theme.colors.textMuted, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: isActive ? theme.colors.text : theme.colors.text }}>{cmd.label}</span>
                    {isActive && <ChevronRight size={13} style={{ marginLeft: 'auto', color: theme.colors.textMuted }} />}
                  </div>
                );
              })}
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: theme.colors.textMuted, fontSize: 13 }}>No commands found</div>
          )}
        </div>

        {/* Footer hint */}
        <div style={{ padding: '8px 16px', borderTop: `1px solid ${theme.colors.border}`,
          display: 'flex', gap: 16, fontSize: 11, color: theme.colors.textFaint }}>
          <span>{kbd(['\u2191\u2193'])} navigate</span>
          <span>{kbd(['Enter'])} select</span>
          <span>{kbd(['Esc'])} close</span>
        </div>
      </div>
      <style>{`@keyframes cmdFadeIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}
