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
        affogato: ["Affogato", "sans-serif"],
      },
    },
  },
  plugins: [],
};
