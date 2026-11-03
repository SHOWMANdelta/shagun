/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      boxShadow: {
        card: '0 1px 2px rgba(11,33,41,0.06), 0 4px 16px -6px rgba(11,33,41,0.1)',
        'card-lg': '0 2px 4px rgba(11,33,41,0.07), 0 16px 40px -16px rgba(11,33,41,0.22)',
      },
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
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '8px',
        md: '10px',
        lg: '14px',
      },
    },
  },
  plugins: [],
};
