/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50:  '#eef1f8',
          100: '#d5ddf0',
          200: '#adbce2',
          300: '#7a93ce',
          400: '#4e6ab8',
          500: '#2d4d9e',
          600: '#1e3a82',
          700: '#162d6b',
          800: '#0f2057',
          900: '#091543',
          950: '#060e2d',
        },
        gold: {
          50:  '#fefbe8',
          100: '#fef5c3',
          200: '#fee885',
          300: '#fed348',
          400: '#fdc017',
          500: '#eda607',
          600: '#cc7f03',
          700: '#a35a07',
          800: '#87450e',
          900: '#723a12',
        },
      },
      keyframes: {
        'fade-in': {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          '0%':   { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in':  'fade-in 0.4s ease-out',
        'slide-up': 'slide-up 0.5s ease-out',
      },
    },
  },
  plugins: [],
};
