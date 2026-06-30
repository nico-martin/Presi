import react from "@vitejs/plugin-react";
import { defineConfig } from "@presi/server";

export default defineConfig({
  entry: "Slides.tsx",
  title: "Presi Test Slides",
  vite: {
    plugins: [react()],
  },
  dev: {
    port: 3000,
    includeNotes: true,
  },
  build: {
    outDir: "dist",
    includeNotes: false,
  },
});
