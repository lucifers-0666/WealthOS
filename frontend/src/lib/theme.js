// theme.js — Antigravity Dark Forest Teal palette
// Legacy bridge: use Tailwind classes for new components.
// Only import this in components that cannot use Tailwind yet.

export const theme = {
  colors: {
    bg:         'var(--color-bg)',
    bgSoft:     'var(--color-surface)',
    surface:    'var(--color-card)',
    overlay:    'var(--color-overlay)',
    border:     'var(--color-border)',
    borderSubtle: 'rgba(45,60,55,0.55)',
    text:       'var(--color-text)',
    textSoft:   'var(--color-text-muted)',
    textMuted:  'var(--color-text-faint)',
    accent:     'var(--color-gold)',
    gold:       'var(--color-gold)',
    success:    'var(--color-gain)',
    warning:    'var(--color-warn)',
    error:      'var(--color-loss)',
  },
  radius: {
    sm: 3,
    md: 3,
    lg: 3,
  },
  shadow: 'none',
  ease: 'cubic-bezier(0.16, 1, 0.3, 1)',
  duration: 180,
};

export function panelStyle(extra = {}) {
  return {
    background: 'var(--color-card)',
    border: '1px solid var(--color-border)',
    borderRadius: 3,
    ...extra,
  };
}

export function fieldStyle(extra = {}) {
  return {
    width: '100%',
    minHeight: 38,
    borderRadius: 3,
    border: '1px solid var(--color-border)',
    background: 'var(--color-bg)',
    color: 'var(--color-text)',
    padding: '9px 12px',
    outline: 'none',
    fontFamily: 'Inter, sans-serif',
    fontSize: 12,
    transition: `all 180ms cubic-bezier(0.16,1,0.3,1)`,
    ...extra,
  };
}
