/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#2C5F4A',
          hover: '#234c3b',
          50: '#f0fdf6',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          900: '#14532d',
        },
        surface: {
          bg: '#0a0a0b',
          DEFAULT: '#141416',
          overlay: '#1c1c1f',
        },
        border: {
          DEFAULT: '#27272a',
        },
        risk: {
          low: '#059669',
          medium: '#d97706',
          high: '#dc2626',
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
