/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#050816',
        bg2: '#0B1120',
        accent: '#3B82F6',
        cyan: '#22D3EE',
        violet: '#8B5CF6',
        ag: {
          // v2 — updated panel contrast
          'canvas':        '#0B1F12',
          'panel-left':    '#071A0E',
          'panel-right':   '#0F2518',
          'surface':       '#142B19',
          'input':         '#132115',
          'input-focus':   '#162818',
          'border':        '#2A3C35',
          'cream':         '#F9F3E6',
          'muted':         '#B0A890',
          'faint':         '#72776A',
          'gold':          '#D4A017',
          'gold-hover':    '#C4900F',
          'gold-active':   '#B07F0D',
          'error':         '#E05252',
          'success':       '#1E4A1E',
          'success-text':  '#6FAE8D',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      },
      animation: {
        'fade-up': 'fadeUp 0.45s cubic-bezier(0.16,1,0.3,1) forwards',
        'fade-in': 'fadeIn 0.35s ease forwards',
        shimmer: 'shimmer 1.8s linear infinite',
        'spin-slow': 'spin 1.4s linear infinite'
      },
      keyframes: {
        fadeUp: { from: { opacity: '0', transform: 'translateY(14px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } }
      }
    }
  },
  plugins: []
}
