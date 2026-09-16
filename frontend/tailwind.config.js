/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#f2f0ff',
          100: '#e6e2ff',
          200: '#cfc7ff',
          300: '#ab9dff',
          400: '#8b7bfa',
          500: '#6c5ce7',
          600: '#5b3fe0',
          700: '#4c2fc7',
          800: '#3f28a1',
          900: '#352481',
          950: '#0f0b2e',
        },
      },
      boxShadow: {
        soft: '0 4px 24px -4px rgba(76, 47, 199, 0.08)',
      },
    },
  },
  plugins: [],
}
