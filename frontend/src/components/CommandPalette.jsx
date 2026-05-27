/**
 * CommandPalette — CTRL+K global command palette.
 * Institutional-grade keyboard-driven navigation.
 * No emojis. No gradients. Clean terminal feel.
 */
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

const COMMANDS = [
  { id: 'nav-dashboard',  label: 'Go to Dashboard',   group: 'Navigation', path: '/',          shortcut: 'G D' },
  { id: 'nav-portfolio',  label: 'Go to Portfolio',    group: 'Navigation', path: '/portfolio', shortcut: 'G P' },
  { id: 'nav-watchlist',  label: 'Go to Watchlist',    group: 'Navigation', path: '/watchlist', shortcut: 'G W' },
  { id: 'nav-analytics',  label: 'Go to Analytics',    group: 'Navigation', path: '/analytics', shortcut: 'G A' },
  { id: 'nav-import',     label: 'Go to Import',       group: 'Navigation', path: '/import',    shortcut: 'G I' },
  { id: 'nav-profile',    label: 'Go to Profile',      group: 'Navigation', path: '/profile',   shortcut: 'G U' },
];

function highlight(text, query) {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: 'rgba(1,105,111,0.25)', color: 'inherit', borderRadius: 2 }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export function CommandPalette({ open, onClose }) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    if (!query.trim()) return COMMANDS;
    const q = query.toLowerCase();
    return COMMANDS.filter(c => c.label.toLowerCase().includes(q) || c.group.toLowerCase().includes(q));
  }, [query]);

  useEffect(() => { setSelected(0); }, [filtered]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  const execute = useCallback((cmd) => {
    if (cmd.path) navigate(cmd.path);
    if (cmd.action) cmd.action();
    onClose();
  }, [navigate, onClose]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, filtered.length - 1)); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
      if (e.key === 'Enter') { e.preventDefault(); if (filtered[selected]) execute(filtered[selected]); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, filtered, selected, execute, onClose]);

  // Scroll selected into view
  useEffect(() => {
    const el = listRef.current?.children[selected];
    el?.scrollIntoView({ block: 'nearest' });
  }, [selected]);

  if (!open) return null;

  const groups = [...new Set(filtered.map(c => c.group))];

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 9100,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-label="Command palette"
        aria-modal="true"
        style={{
          position: 'fixed',
          top: '15%',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9200,
          width: 'min(600px, 92vw)',
          background: 'var(--color-surface, #1c1b19)',
          border: '1px solid var(--color-border, #393836)',
          borderRadius: '0.75rem',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
          overflow: 'hidden',
          fontFamily: 'inherit',
        }}
      >
        {/* Search input */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '0.875rem 1rem', borderBottom: '1px solid var(--color-border, #393836)', gap: '0.625rem' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted, #797876)" strokeWidth="2" aria-hidden><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search commands, pages..."
            aria-label="Command search"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '0.9375rem',
              color: 'var(--color-text, #cdccca)',
              fontFamily: 'inherit',
            }}
          />
          <kbd style={{ fontSize: '0.7rem', color: 'var(--color-text-faint, #5a5957)', background: 'var(--color-surface-offset, #1d1c1a)', border: '1px solid var(--color-border, #393836)', borderRadius: 4, padding: '2px 6px' }}>ESC</kbd>
        </div>

        {/* Results */}
        <div
          ref={listRef}
          role="listbox"
          style={{ maxHeight: 360, overflowY: 'auto', padding: '0.375rem 0' }}
        >
          {filtered.length === 0 && (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted, #797876)', fontSize: '0.875rem' }}>
              No results for “{query}”
            </div>
          )}
          {groups.map(group => (
            <div key={group}>
              <div style={{ padding: '0.375rem 1rem 0.25rem', fontSize: '0.6875rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-faint, #5a5957)', fontWeight: 600 }}>{group}</div>
              {filtered.filter(c => c.group === group).map((cmd, i) => {
                const globalIdx = filtered.indexOf(cmd);
                const isSelected = globalIdx === selected;
                return (
                  <div
                    key={cmd.id}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => execute(cmd)}
                    onMouseEnter={() => setSelected(globalIdx)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.5rem 1rem',
                      cursor: 'pointer',
                      background: isSelected ? 'var(--color-primary-highlight, rgba(1,105,111,0.15))' : 'transparent',
                      borderLeft: isSelected ? '2px solid var(--color-primary, #4f98a3)' : '2px solid transparent',
                      transition: 'background 120ms',
                    }}
                  >
                    <span style={{ fontSize: '0.875rem', color: 'var(--color-text, #cdccca)' }}>
                      {highlight(cmd.label, query)}
                    </span>
                    {cmd.shortcut && (
                      <span style={{ display: 'flex', gap: 4 }}>
                        {cmd.shortcut.split(' ').map((k, ki) => (
                          <kbd key={ki} style={{ fontSize: '0.65rem', color: 'var(--color-text-faint, #5a5957)', background: 'var(--color-surface-offset, #1d1c1a)', border: '1px solid var(--color-border, #393836)', borderRadius: 3, padding: '1px 5px' }}>{k}</kbd>
                        ))}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer hint */}
        <div style={{ display: 'flex', gap: '1rem', padding: '0.5rem 1rem', borderTop: '1px solid var(--color-border, #393836)', fontSize: '0.7rem', color: 'var(--color-text-faint, #5a5957)' }}>
          <span><kbd style={{ background: 'var(--color-surface-offset)', border: '1px solid var(--color-border)', borderRadius: 3, padding: '1px 4px', fontSize: '0.65rem' }}>↵</kbd> select</span>
          <span><kbd style={{ background: 'var(--color-surface-offset)', border: '1px solid var(--color-border)', borderRadius: 3, padding: '1px 4px', fontSize: '0.65rem' }}>↑↓</kbd> navigate</span>
          <span><kbd style={{ background: 'var(--color-surface-offset)', border: '1px solid var(--color-border)', borderRadius: 3, padding: '1px 4px', fontSize: '0.65rem' }}>esc</kbd> close</span>
        </div>
      </div>
    </>
  );
}

/**
 * useCommandPalette — hook to wire CTRL+K globally.
 */
export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(o => !o);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return { open, setOpen, onClose: () => setOpen(false) };
}

export default CommandPalette;
