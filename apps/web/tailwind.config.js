/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // PRD 2.0 Brand System
        terracotta: {
          50: '#FDF7F4',
          100: '#F9ECE5',
          200: '#F3D7C9',
          300: '#EBBFA9',
          400: '#E29E7E',
          500: '#D97A4E', // PRD Primary Warm Terracotta
          600: '#C66539',
          700: '#A85028',
          800: '#874020',
          900: '#6C341A',
        },
        honey: {
          50: '#FCF8F2',
          100: '#F8F0E2',
          200: '#F1DFC4',
          300: '#E8B87A', // PRD Secondary Muted Warm Amber / Honey
          400: '#DDA35F',
          500: '#C78C46',
          600: '#A87133',
        },
        sage: {
          50: '#F5F7F3',
          100: '#EAEEE6',
          200: '#D5DFCF',
          300: '#B8C9B0',
          400: '#8FA37E', // PRD Accent / Success Gentle Sage Green
          500: '#768B66',
          600: '#5C704E',
        },
        cream: {
          DEFAULT: '#FAF6F1', // PRD Background Warm Cream
          50: '#FDFBF8',
          100: '#FAF6F1',
          200: '#F4ECE2',
          300: '#EDE0D1',
        },
        surface: {
          DEFAULT: '#F3EBE2', // PRD Surface Soft Warm Beige
          50: '#F9F5F0',
          100: '#F3EBE2',
          200: '#E7DCcf',
          300: '#D9CBBA',
        },
        // Backward-compatible calm mapping to PRD Terracotta palette
        calm: {
          50: '#FDF7F4',
          100: '#F9ECE5',
          200: '#F3D7C9',
          300: '#EBBFA9',
          400: '#E29E7E',
          500: '#D97A4E',
          600: '#C66539',
          700: '#D97A4E',  // Primary Brand Warm Terracotta
          800: '#A85028',
          900: '#3E332B',  // Warm Dark Brown
          950: '#2A221C',
        },
        // Backward-compatible sand mapping to PRD Warm Cream & Beige
        sand: {
          50: '#FAF6F1',   // PRD Background Warm Cream
          100: '#F3EBE2',  // PRD Surface Soft Warm Beige
          200: '#E8DED3',  // Subtle Borders
          300: '#D8CABE',
          400: '#B8A899',
          500: '#9B8B7C',
          600: '#7A6E63',  // PRD Secondary Text Muted Warm Gray
          700: '#685D52',
          800: '#4E443A',
          900: '#3E332B',  // PRD Primary Text Warm Dark Brown
        },
        warm: {
          50: '#FCF8F2',
          100: '#F8F0E2',
          500: '#E8B87A',  // Honey Amber
          600: '#DDA35F',
          700: '#C78C46',
        },
        crisis: {
          light: '#FDF2F0',
          DEFAULT: '#C75B4A', // PRD Crisis Soft Brick Red
          dark: '#AA4737',
          border: '#F2BDB4',
        }
      },
      boxShadow: {
        'soft-xs': '0 1px 2px 0 rgba(62, 51, 43, 0.04)',
        'soft-sm': '0 2px 8px -1px rgba(62, 51, 43, 0.06), 0 1px 3px -1px rgba(62, 51, 43, 0.03)',
        'soft-md': '0 6px 20px -4px rgba(62, 51, 43, 0.07), 0 2px 6px -2px rgba(62, 51, 43, 0.03)',
        'soft-lg': '0 12px 32px -6px rgba(62, 51, 43, 0.09), 0 4px 12px -2px rgba(62, 51, 43, 0.04)',
        'glass': '0 8px 32px 0 rgba(217, 122, 78, 0.06), 0 1px 2px 0 rgba(255, 255, 255, 0.7) inset',
      },
      backdropBlur: {
        'xs': '2px',
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
};
