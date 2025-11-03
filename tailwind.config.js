/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'park': {
          from: '#a3e635',
          to: '#059669'
        },
        'beach': {
          from: '#38bdf8',
          to: '#2563eb'
        },
        'forest': {
          from: '#22c55e',
          to: '#166534'
        },
        'tundra': {
          from: '#22d3ee',
          to: '#0369a1'
        }
      },
      animation: {
        'flip': 'flip 0.6s ease-in-out',
        'fadeIn': 'fadeIn 0.3s ease-in'
      },
      keyframes: {
        flip: {
          '0%': { transform: 'rotateY(0deg)' },
          '100%': { transform: 'rotateY(180deg)' }
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        }
      }
    },
  },
  plugins: [],
}
