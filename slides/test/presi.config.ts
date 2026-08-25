import react from "@vitejs/plugin-react";
import { config as loadEnv } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "../../library/server/index.ts";

const slidesRoot = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(slidesRoot, "../..");

loadEnv({ path: resolve(repoRoot, ".env") });
loadEnv({ path: resolve(slidesRoot, ".env"), override: true });

const ssl =
  process.env.SSL_KEY && process.env.SSL_CRT
    ? {
        key: process.env.SSL_KEY,
        cert: process.env.SSL_CRT,
      }
    : undefined;

export default defineConfig({
  entry: "Slides.tsx",
  title: "Presi Test Slides",
  ssl,
  vite: {
    plugins: [react()],
    resolve: {
      alias: {
        "presi-js/react": resolve(repoRoot, "library/react/index.ts"),
      },
    },
  },
  dev: {
    port: 3000,
    includeNotes: true,
  },
  present: {
    port: 4001,
  },
  export: {
    file: "testslide.pdf",
  },
  build: {
    outDir: "dist",
    distFolder: "test",
  },
});
