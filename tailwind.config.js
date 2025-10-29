/** @type {import('tailwindcss').Config} */
export default {
  content: ["./**/*.html", "./js/**/*.js"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Avenir', 'sans-serif'],
        heading: ['Avenir', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
