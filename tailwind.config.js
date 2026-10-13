/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff1f4',
          100: '#ffe0e7',
          200: '#ffc6d3',
          300: '#ff9bb2',
          400: '#fa6e8d',
          500: '#f24b69', // logo pink
          600: '#de2e4f',
          700: '#b9213f',
          800: '#991f3a',
          900: '#821f37',
        },
        navy: {
          50: '#eef6fd',
          100: '#d9eaf9',
          200: '#b9d7f3',
          300: '#8ebbea',
          400: '#5f98dc',
          500: '#3b78c8',
          600: '#2a5ea6',
          700: '#1f4a86',
          800: '#0f3a6a',
          900: '#064072', // logo navy
          950: '#042a4b',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Bricolage Grotesque"', '"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(6,64,114,.06), 0 8px 24px -12px rgba(6,64,114,.18)',
        pop: '0 20px 50px -20px rgba(6,64,114,.35)',
      },
      keyframes: {
        'fade-up': { '0%': { opacity: 0, transform: 'translateY(8px)' }, '100%': { opacity: 1, transform: 'none' } },
        'slide-in': { '0%': { transform: 'translateX(100%)' }, '100%': { transform: 'none' } },
        'slide-in-left': { '0%': { transform: 'translateX(-100%)' }, '100%': { transform: 'none' } },
      },
      animation: {
        'fade-up': 'fade-up .35s ease-out both',
        'slide-in': 'slide-in .25s ease-out both',
        'slide-in-left': 'slide-in-left .25s ease-out both',
      },
    },
  },
  plugins: [],
};
