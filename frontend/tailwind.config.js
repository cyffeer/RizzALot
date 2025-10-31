/** @type {import('tailwindcss').Config} */
export default {
  // Enable class-based dark mode so we can toggle by adding/removing `dark` on <html>
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#f43f5e',
          dark: '#e11d48',
          light: '#fda4af',
        },
      },
    },
  },
  plugins: [],
}
