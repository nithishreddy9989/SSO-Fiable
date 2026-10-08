/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        azure: {
          blue: '#0078D4',
          cyan: '#00A4EF',
          light: '#50E6FF',
        }
      }
    },
  },
  plugins: [],
}
