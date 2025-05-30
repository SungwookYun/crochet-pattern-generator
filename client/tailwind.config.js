/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        'crochet-primary': '#f4a261',
        'crochet-secondary': '#e76f51',
        'crochet-accent': '#2a9d8f',
        'crochet-neutral': '#264653'
      },
      fontFamily: {
        'korean': ['-apple-system', 'BlinkMacSystemFont', 'Malgun Gothic', 'Apple SD Gothic Neo', 'sans-serif']
      }
    },
  },
  plugins: [],
} 