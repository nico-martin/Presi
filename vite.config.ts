import react from "@vitejs/plugin-react";
import autoprefixer from "autoprefixer";
import dotenv from "dotenv";
import postcssMixins from "postcss-mixins";
import postcssNesting from "postcss-nesting";
import postcssPresetEnv from "postcss-preset-env";
import { defineConfig } from "vite";
import htmlPlugin from "vite-plugin-html-config";
import svgr from "vite-plugin-svgr";
import tsconfigPaths from "vite-tsconfig-paths";
import fs from "fs";

dotenv.config();

const currentSlide = "test";

const root = `./slides/${currentSlide}/`;
const talk = require(`${root}/config.json`);

const title = talk.title;
const description = `${talk.title} // ${talk.venue}`;

const dynamicIndexPlugin = () => {
  return {
    name: "html-transform",
    transformIndexHtml(html) {
      return html.replace("[MODULE]", `${root}Slides.tsx`);
    },
  };
};

export default defineConfig({
  css: {
    postcss: {
      plugins: [
        postcssMixins({
          mixinsDir: "./src/styles/mixins",
        }),
        postcssNesting,
        autoprefixer,
        postcssPresetEnv,
      ],
    },
  },
  server: {
    ...(process.env.SSL_KEY && process.env.SSL_CRT
      ? {
          https: {
            key: fs.readFileSync(process.env.SSL_KEY),
            cert: fs.readFileSync(process.env.SSL_CRT),
          },
        }
      : {}),
    port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
    open: `https://localhost:${process.env.PORT || 3000}`,
  },
  plugins: [
    dynamicIndexPlugin(),
    react(),
    tsconfigPaths(),
    svgr(),
    htmlPlugin({
      title: title,
      metas: [
        {
          name: "description",
          content: description,
        },
        //{
        //  name: 'og:image',
        //  content: '/facebook.jpg',
        //},
        {
          name: "og:title",
          content: title,
        },
        {
          name: "og:description",
          content: description,
        },
        {
          name: "og:locale",
          content: "en_US",
        },
        {
          name: "og:type",
          content: "website",
        },
        {
          name: "twitter:card",
          content: "summary_large_image",
        },
        {
          name: "twitter:creator",
          content: "@nic_o_martin",
        },
        {
          name: "twitter:title",
          content: title,
        },
        {
          name: "twitter:description",
          content: description,
        },
        //{
        //  name: 'twitter:image',
        //  content: '/twitter.jpg',
        //},
      ],
    }),
  ],
});
