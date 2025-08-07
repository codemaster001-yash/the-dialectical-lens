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
        'dark-bg': '#121212',
        'dark-surface': '#1E1E1E',
        'dark-text': '#E0E0E0',
        'dark-accent': '#00A78E',
        'light-bg': '#F7F7F7',
        'light-surface': '#FFFFFF',
        'light-text': '#1E1E1E',
        'light-accent': '#008C76',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      }
    }
  },
  plugins: [],
}
