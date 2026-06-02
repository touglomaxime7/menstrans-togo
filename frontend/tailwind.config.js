/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#E6F1FB',
          100: '#B5D4F4',
          500: '#2E5FA3',
          700: '#1F3864',
          900: '#0C2444',
        },
      },
    },
  },
  plugins: [],
}