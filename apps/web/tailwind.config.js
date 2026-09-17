/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        calm: {
          50: '#F5F8F6',
          100: '#EBF2EE',
          200: '#D6E4DC',
          300: '#B6CFC2',
          400: '#8EB5A1',
          500: '#699982',
          600: '#4D7D67',
          700: '#38614F',  // Primary Brand Accent
          800: '#2F4F41',
          900: '#264136',
          950: '#14241E',
        },
        sand: {
          50: '#FAF8F5',   // Canvas Base
          100: '#F4F0E8',  // Soft Card Fill
          200: '#EAE4D8',  // Subtle Borders
          300: '#DDD5C4',
          400: '#C5BAA4',
          500: '#AA9E86',
          700: '#6E6452',
          800: '#4A4337',
          900: '#2A261F',  // Primary Text
        },
        warm: {
          50: '#FDF8F5',
          100: '#FBF0E9',
          500: '#D97736',
          600: '#C8682E',
          700: '#A75222',
        },
        crisis: {
          light: '#FEF2F2',
          DEFAULT: '#DC2626',
          dark: '#991B1B',
          border: '#FCA5A5',
        }
      },
      boxShadow: {
        'soft-xs': '0 1px 2px 0 rgba(28, 37, 34, 0.03)',
        'soft-sm': '0 2px 8px -1px rgba(28, 37, 34, 0.04), 0 1px 3px -1px rgba(28, 37, 34, 0.02)',
        'soft-md': '0 6px 20px -4px rgba(28, 37, 34, 0.05), 0 2px 6px -2px rgba(28, 37, 34, 0.02)',
        'soft-lg': '0 12px 32px -6px rgba(28, 37, 34, 0.06), 0 4px 12px -2px rgba(28, 37, 34, 0.03)',
        'glass': '0 8px 32px 0 rgba(46, 75, 63, 0.04), 0 1px 2px 0 rgba(255, 255, 255, 0.6) inset',
      },
      backdropBlur: {
        'xs': '2px',
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
};
