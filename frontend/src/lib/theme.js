export const theme = {
  colors: {
    bg: '#0A201F',
    bgSoft: '#102321',
    surface: '#172923',
    border: '#2D3C37',
    text: '#ECE0CC',
    textSoft: '#ACA492',
    textMuted: '#7B7C70',
    accent: '#869FC4',
    gold: '#C8B38E',
    success: '#6FAE8D',
    warning: '#D2A76D',
    error: '#B66A6A',
  },
  radius: {
    sm: 12,
    md: 14,
    lg: 16,
  },
  shadow: '0 24px 90px rgba(0,0,0,0.38), inset 0 1px 0 rgba(255,255,255,0.02)',
  ease: 'cubic-bezier(0.16, 1, 0.3, 1)',
  duration: 220,
};

export function panelStyle(extra = {}) {
  return {
    background:
      'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.006)), linear-gradient(180deg, rgba(23,41,35,0.96), rgba(16,35,33,0.92))',
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.md,
    boxShadow: theme.shadow,
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    ...extra,
  };
}

export function fieldStyle(extra = {}) {
  return {
    width: '100%',
    minHeight: 42,
    borderRadius: 12,
    border: `1px solid ${theme.colors.border}`,
    background: 'rgba(10,32,31,0.75)',
    color: theme.colors.text,
    padding: '11px 14px',
    outline: 'none',
    transition: `all ${theme.duration}ms ${theme.ease}`,
    ...extra,
  };
}
