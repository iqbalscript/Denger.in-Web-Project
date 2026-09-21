/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // PRD-DESIGN.md Canonical Palette
        paper: '#FFF8EF',
        ink: '#151515',
        cobalt: '#4169FF',
        lime: '#B8F34A',
        yellow: '#FFD84D',
        amber: '#FF8A3D',
        tangerine: '#FF8A3D',
        coral: '#FF5252',
        borderSubtle: '#D8D3C9',

        // Semantic mappings
        brand: {
          bg: '#FFF8EF',
          ink: '#151515',
          primary: '#4169FF',   // Cobalt
          cta: '#B8F34A',       // Positive Lime
          accent: '#FFD84D',    // Sunny Yellow
          warm: '#FF8A3D',      // Tangerine
          crisis: '#FF5252',    // Urgent Coral
          surface: '#FFFFFF',
          border: '#151515',
          borderSubtle: '#D8D3C9',
        },

        // Backward compatibility mappings
        terracotta: {
          50: '#FFF8EF',
          100: '#F5ECE0',
          200: '#EBD9C6',
          500: '#FF8A3D',
          600: '#E67528',
          700: '#CC6017',
          800: '#A3480B',
          900: '#151515',
        },
        sand: {
          50: '#FFF8EF',
          100: '#F7F0E6',
          200: '#D8D3C9',
          300: '#C5BFB4',
          400: '#9E988D',
          500: '#7A756D',
          600: '#59544D',
          700: '#3D3934',
          800: '#26231F',
          900: '#151515',
        },
        calm: {
          50: '#F0F4FF',
          100: '#DBE4FE',
          200: '#BAC9FE',
          500: '#4169FF',
          600: '#2B51E6',
          700: '#4169FF',
          800: '#1A37B3',
          900: '#151515',
          950: '#151515',
        },
        crisis: {
          light: '#FFEBEB',
          DEFAULT: '#FF5252',
          dark: '#D93838',
          border: '#151515',
        },
      },
      boxShadow: {
        'hard-sm': '2px 2px 0px #151515',
        'hard': '3px 3px 0px #151515',
        'hard-lg': '4px 4px 0px #151515',
        'hard-xl': '6px 6px 0px #151515',
        'hard-cobalt': '3px 3px 0px #4169FF',
        'hard-lime': '3px 3px 0px #B8F34A',
        'hard-coral': '3px 3px 0px #FF5252',
        // Backward-compat aliases
        'soft-xs': '2px 2px 0px #151515',
        'soft-sm': '2px 2px 0px #151515',
        'soft-md': '3px 3px 0px #151515',
        'soft-lg': '4px 4px 0px #151515',
        'glass': '3px 3px 0px #151515',
      },
      borderRadius: {
        'xs': '2px',
        'sm': '4px',
        'md': '6px',
        'lg': '8px',
        'xl': '8px',
        '2xl': '8px',
        '3xl': '8px',
      },
      fontFamily: {
        sans: ['"Space Grotesk"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
