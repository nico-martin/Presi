/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./Slides.tsx",
    "./slides/**/*.{ts,tsx}",
    "./theme/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        body: ["Nunito Sans", "sans-serif"],
        heading: ["Nunito", "sans-serif"],
      },
    },
  },
  plugins: [],
};
