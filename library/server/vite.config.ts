import react from "@vitejs/plugin-react";
import autoprefixer from "autoprefixer";
import postcssMixins from "postcss-mixins";
import postcssNesting from "postcss-nesting";
import postcssPresetEnv from "postcss-preset-env";
import { defineConfig } from "vite";
import htmlPlugin from "vite-plugin-html-config";
import svgr from "vite-plugin-svgr";
import tsconfigPaths from "vite-tsconfig-paths";

import presiConfig from "../../presi.config.ts";

export default defineConfig(async () => {
  const root = presiConfig.slidesRoot.replace("./", "../../");
  const talk = require(`${root}config.json`);

  const title = talk.title;
  const description = `${talk.title} // ${talk.venue}`;

  const dynamicIndexPlugin = () => {
    return {
      name: "html-transform",
      transformIndexHtml(html: string) {
        return html.replace("[MODULE]", `${root}Slides.tsx`);
      },
    };
  };

  return {
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
      ...(presiConfig.https
        ? {
            https: presiConfig.https,
          }
        : {}),
      port: presiConfig.port,
      open: `https://localhost:${presiConfig.port}`,
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
  };
});
