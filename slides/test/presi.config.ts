import react from "@vitejs/plugin-react";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "../../library/server/index.ts";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

export default defineConfig({
  entry: "Slides.tsx",
  title: "Presi Test Slides",
  vite: {
    plugins: [react()],
    resolve: {
      alias: {
        "presi-js/core": resolve(repoRoot, "library/core/index.ts"),
        "presi-js/react": resolve(repoRoot, "library/react/index.ts"),
      },
    },
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
