
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
        'light-primary': '#F9F9F9',
        'light-secondary': '#FFFFFF',
        'light-text': '#111827',
        'light-accent': '#4F46E5',
        'dark-primary': '#111827',
        'dark-secondary': '#1F2937',
        'dark-text': '#F9F9F9',
        'dark-accent': '#6366F1',
        'success': '#10B981',
        'success-hover': '#059669',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideIn: {
          '0%': { transform: 'translateY(20px)', opacity: '0'},
          '100%': { transform: 'translateY(0)', opacity: '1'},
        }
      },
      animation: {
        'fade-in': 'fadeIn 1s ease-in-out',
        'fade-out': 'fadeOut 1s ease-in-out',
        'slide-in': 'slideIn 0.5s ease-out forwards',
      }
    },
  },
  plugins: [],
}
