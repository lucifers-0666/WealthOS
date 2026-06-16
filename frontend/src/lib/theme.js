export const theme = {
  colors: {
    bg: '#1a1206',
    bgSoft: '#221808',
    surface: '#221808',
    border: '#3d2e0a',
    text: '#f0e6c8',
    textSoft: '#e8d8a8',
    textMuted: '#c4b48a',
    accent: '#d4a017',
    gold: '#d4a017',
    success: '#4a8a6a',
    warning: '#b8960a',
    error: '#6b2e2e',
  },
  radius: {
    sm: 12,
    md: 18,
    lg: 24,
  },
  shadow: '0 8px 32px rgba(0,0,0,0.18)',
  ease: 'cubic-bezier(0.16, 1, 0.3, 1)',
  duration: 220,
};

export function panelStyle(extra = {}) {
  return {
    background:
      'linear-gradient(180deg, rgba(212,160,23,0.03), rgba(212,160,23,0.01)), linear-gradient(180deg, rgba(34,24,8,0.96), rgba(26,18,6,0.92))',
    border: `1px solid rgba(212,160,23,0.15)`,
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
    background: 'rgba(26,18,6,0.75)',
    color: theme.colors.text,
    padding: '11px 14px',
    outline: 'none',
    transition: `all ${theme.duration}ms ${theme.ease}`,
    ...extra,
  };
}
