/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7f7',
          100: '#d9ecee',
          200: '#b4dbe0',
          500: '#15616d',
          600: '#114f59',
          700: '#0d3d45',
          800: '#0a2e34',
          900: '#071f23',
        },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '6px',
        md: '6px',
        lg: '8px',
      },
    },
  },
  plugins: [],
};
