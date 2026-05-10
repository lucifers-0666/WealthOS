/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#050816',
        bg2: '#0B1120',
        accent: { blue: '#3B82F6', cyan: '#22D3EE', violet: '#8B5CF6' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'fade-up': 'fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) forwards',
        shimmer: 'shimmer 1.8s infinite',
        'typing-dot': 'typingDot 1.2s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: { from: { opacity: 0, transform: 'translateY(14px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        typingDot: { '0%,80%,100%': { transform: 'scale(0.6)', opacity: 0.4 }, '40%': { transform: 'scale(1)', opacity: 1 } },
      },
    }
  },
  plugins: []
}
