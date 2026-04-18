/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0B0F0E',
        bg2: '#111714',
        bg3: '#1A201D',
        card: '#161C19',
        border: '#2A3530',
        green: '#2ECC7A',
        green2: '#1A9954',
        'green-dim': '#1A3029',
        orange: '#F4903B',
        'orange-dim': '#2D1E0F',
        red: '#E85454',
        'red-dim': '#2D1010',
        blue: '#4A9EFF',
        'blue-dim': '#0F1E30',
        gold: '#F5C842',
        'gold-dim': '#2B2308',
        text: '#E8EDE9',
        'text2': '#8FA898',
        'text3': '#5A7065',
      },
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        sans: ['DM Sans', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '14px',
        sm: '8px',
      },
    },
  },
  plugins: [],
}