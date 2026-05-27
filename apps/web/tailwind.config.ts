/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: 'var(--color-accent)',
          hover: 'oklch(42% 0.07 155)', /* high-fidelity custom hover */
          50: '#f0fdf6',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          900: '#14532d',
        },
        surface: {
          bg: 'var(--color-bg)',
          DEFAULT: 'var(--color-surface)',
          overlay: 'var(--color-overlay)',
        },
        border: {
          DEFAULT: 'var(--color-border)',
        },
        risk: {
          low: 'oklch(60% 0.15 150)',
          medium: 'var(--color-warning)',
          high: 'var(--color-danger)',
        },
      },
      fontFamily: {
        display: ['Instrument Serif', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};
