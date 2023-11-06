import { defineConfig } from "./library/server/index";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

const currentSlide = "test";
const root = `./slides/${currentSlide}/`;

export default defineConfig({
  slidesRoot: root,
  ...(process.env.SSL_KEY && process.env.SSL_CRT
    ? {
        https: {
          key: fs.readFileSync(process.env.SSL_KEY),
          cert: fs.readFileSync(process.env.SSL_CRT),
        },
      }
    : {}),
  port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
});
