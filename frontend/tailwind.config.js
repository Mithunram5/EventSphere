/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Theme color definitions for premium appearance
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9', // Sky blue
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#030712',
        },
        accent: {
          50: '#faf5ff',
          100: '#f3e8ff',
          500: '#a855f7', // Purple/Violet
          600: '#9333ea',
          700: '#7e22ce',
        },
        darkbg: '#0f172a', // slate-900
        darkcard: '#1e293b', // slate-800
        darkborder: '#334155', // slate-700
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
