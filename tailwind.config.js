/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./**/*.html", "./js/**/*.js"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Lato', 'sans-serif'],
        heading: ['Lato', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
