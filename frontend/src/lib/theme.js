// theme.js — Antigravity Dark Forest Teal palette
// Legacy bridge: use Tailwind classes for new components.
// Only import this in components that cannot use Tailwind yet.

export const theme = {
  colors: {
    bg:         '#0A201F',
    bgSoft:     '#102321',
    surface:    '#172923',
    overlay:    '#1E3530',
    border:     '#2D3C37',
    borderSubtle: 'rgba(45,60,55,0.55)',
    text:       '#ECE0CC',
    textSoft:   '#ACA492',
    textMuted:  '#7B7C70',
    accent:     '#C8B38E',
    gold:       '#C8B38E',
    success:    '#6FAE8D',
    warning:    '#D2A76D',
    error:      '#B66A6A',
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
    background: '#172923',
    border: '1px solid #2D3C37',
    borderRadius: 3,
    ...extra,
  };
}

export function fieldStyle(extra = {}) {
  return {
    width: '100%',
    minHeight: 38,
    borderRadius: 3,
    border: '1px solid #2D3C37',
    background: '#0A201F',
    color: '#ECE0CC',
    padding: '9px 12px',
    outline: 'none',
    fontFamily: 'Inter, sans-serif',
    fontSize: 12,
    transition: `all 180ms cubic-bezier(0.16,1,0.3,1)`,
    ...extra,
  };
}
