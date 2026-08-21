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
        ink: {
          50:  '#F7F8FA',
          100: '#EEF0F4',
          200: '#DFE3EA',
          300: '#C4CAD6',
          400: '#8D96A8',
          500: '#5C6579',
          600: '#434B5C',
          700: '#2E3542',
          800: '#1D222C',
          900: '#12151C',
        },
        gold: {
          50:  '#FBF6E9',
          100: '#F4E7BF',
          300: '#E2C270',
          500: '#C9A227',
          600: '#A9841C',
          700: '#846315',
        },
      },
      fontFamily: {
        display: ['Sora', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
      },
      keyframes: {
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0px) translateX(0px)' },
          '50%': { transform: 'translateY(-18px) translateX(10px)' },
        },
        floatSlower: {
          '0%, 100%': { transform: 'translateY(0px) translateX(0px)' },
          '50%': { transform: 'translateY(14px) translateX(-14px)' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: 0.5, transform: 'scale(1)' },
          '50%': { opacity: 0.9, transform: 'scale(1.06)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-500px 0' },
          '100%': { backgroundPosition: '500px 0' },
        },
      },
      animation: {
        floatSlow: 'floatSlow 7s ease-in-out infinite',
        floatSlower: 'floatSlower 10s ease-in-out infinite',
        gradientShift: 'gradientShift 8s ease infinite',
        pulseGlow: 'pulseGlow 3.5s ease-in-out infinite',
        shimmer: 'shimmer 2.5s linear infinite',
      },
      backgroundSize: {
        '200': '200% 200%',
      },
    },
  },
  plugins: [],
}