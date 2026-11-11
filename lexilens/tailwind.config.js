/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#faf9f5',
          dim: '#dbdad6',
          bright: '#faf9f5',
          lowest: '#ffffff',
          low: '#f4f4f0',
          container: '#efeeea',
          high: '#e9e8e4',
          highest: '#e3e2df',
        },
        'on-surface': {
          DEFAULT: '#1b1c1a',
          variant: '#56423d',
          muted: '#716e68',
        },
        primary: {
          DEFAULT: '#9a4023', // Terracotta Clay
          container: '#ba5838',
          hover: '#82351c',
          tint: '#ffdbd0',
        },
        secondary: {
          DEFAULT: '#715a3e', // Bookbinder Leather
          container: '#fdddb9',
        },
        tertiary: {
          DEFAULT: '#37645c', // Deep Forest Sage
          container: '#507d74',
          tint: '#bcece1',
        },
        outline: {
          DEFAULT: '#89726b',
          variant: '#dcc1b9',
          hairline: '#e5e2d9',
        },
        syntax: {
          main: { bg: '#e0f2fe', text: '#0369a1', border: '#bae6fd' },
          subordinate: { bg: '#dcfce7', text: '#15803d', border: '#bbf7d0' },
          relative: { bg: '#f3e8ff', text: '#7e22ce', border: '#e9d5ff' },
          participle: { bg: '#fef3c7', text: '#b45309', border: '#fde68a' },
        }
      },
      fontFamily: {
        serif: ['Newsreader', 'Georgia', 'serif'],
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        sm: '0.125rem',
        DEFAULT: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
      },
      boxShadow: {
        academic: '0 2px 8px -2px rgba(60, 50, 40, 0.06), 0 8px 24px -4px rgba(60, 50, 40, 0.04)',
      }
    },
  },
  plugins: [],
}
