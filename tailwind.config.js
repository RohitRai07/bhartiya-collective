/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bhartiya: {
          saffron: '#D97706',      // Deep warm saffron / Surya
          saffronDark: '#B45309',
          saffronLight: '#FEF3C7',
          indigo: '#1E293B',       // Deep navy indigo
          indigoDark: '#0F172A',
          terracotta: '#9A3412',
          gold: '#CA8A04',
          parchment: '#FDFBF7',
          stoneMuted: '#78716C'
        }
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
