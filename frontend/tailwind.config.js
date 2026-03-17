/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary Accent (Teal/Forest Green)
        primary: {
          DEFAULT: '#3B8268',
          50: '#E8F5F0',
          100: '#C5E6D9',
          200: '#9DD6C0',
          300: '#75C6A7',
          400: '#57B68F',
          500: '#3B8268',
          600: '#2F6B56',
          700: '#245444',
          800: '#183D32',
          900: '#0D2620',
        },
        // Secondary Accent (Mustard/Golden Yellow)
        secondary: {
          DEFAULT: '#F0B84A',
          50: '#FEF7E8',
          100: '#FDECC5',
          200: '#FBE09D',
          300: '#F9D475',
          400: '#F7C857',
          500: '#F0B84A',
          600: '#D9A033',
          700: '#B8872A',
          800: '#976E22',
          900: '#76561A',
        },
        // Background & Surface
        background: '#F4F7F6',
        surface: '#FFFFFF',
        // Typography
        'text-primary': '#2D3748',
        'text-secondary': '#718096',
        // Status Colors
        success: '#48BB78',
        warning: '#ED8936',
        danger: '#F56565',
        info: '#4299E1',
      },
      boxShadow: {
        'card': '0 4px 20px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 6px 30px rgba(0, 0, 0, 0.08)',
        'soft': '0 2px 15px rgba(0, 0, 0, 0.03)',
      },
      borderRadius: {
        'lg': '12px',
        'md': '8px',
      },
      fontSize: {
        'kpi': ['48px', { lineHeight: '1.2', fontWeight: '700' }],
        'kpi-sm': ['32px', { lineHeight: '1.2', fontWeight: '700' }],
        'heading': ['24px', { lineHeight: '1.3', fontWeight: '600' }],
        'subheading': ['20px', { lineHeight: '1.4', fontWeight: '600' }],
        'body': ['16px', { lineHeight: '1.5', fontWeight: '400' }],
        'caption': ['13px', { lineHeight: '1.4', fontWeight: '400' }],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
    },
  },
  plugins: [],
}
