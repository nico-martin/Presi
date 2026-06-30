import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const files = {
  "package.json": (name: string) => `{
  "name": ${JSON.stringify(name)},
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "presi dev",
    "build": "presi build"
  },
  "dependencies": {
    "presi": "latest",
    "@vitejs/plugin-react": "^4.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.31",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.2.2",
    "vite": "^4.5.0"
  }
}
`,
  "index.html": () => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Presi Presentation</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/virtual:presi-entry"></script>
  </body>
</html>
`,
  "presi.config.ts": () => `import react from "@vitejs/plugin-react";
import { defineConfig } from "presi/server";

export default defineConfig({
  entry: "Slides.tsx",
  title: "Presi Presentation",
  resolveMountElement: () => document.getElementById("app"),
  vite: {
    plugins: [react()],
  },
});
`,
  "postcss.config.js": () => `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`,
  "tailwind.config.js": () => `/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./Slides.tsx", "./slides/**/*.{ts,tsx}", "./theme/**/*.{ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};
`,
  "style.css": () => `@tailwind base;
@tailwind components;
@tailwind utilities;
`,
  "Slides.tsx": () => `import React from "react";
import ReactDOM from "react-dom/client";
import { Wrapper } from "presi/react";
import Slide from "./theme/Slide";
import "./style.css";

const App: React.FC = () => (
  <Wrapper aspectRatio="16:9">
    <Slide title="Hello Presi">
      <p>Start editing <code>Slides.tsx</code>.</p>
      <p className="fragment" data-step-index="1">This is your first fragment.</p>
    </Slide>
  </Wrapper>
);

export default function render(mountElement: HTMLElement) {
  ReactDOM.createRoot(mountElement).render(<App />);
}
`,
  "theme/Slide.tsx": () => `import { Slide as PresiSlide } from "presi/react";
import type { ReactNode } from "react";

export default function Slide({
  children,
  title = "",
}: {
  children: ReactNode;
  title?: string;
}) {
  return (
    <PresiSlide className="space-y-6 p-10" title={title}>
      {Boolean(title) && <h1 className="text-5xl font-bold">{title}</h1>}
      {children}
    </PresiSlide>
  );
}
`,
  "tsconfig.json": () => `{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["."]
}
`,
};

export const createReactPresentation = async (target = "presi-presentation") => {
  await mkdir(target, { recursive: true });

  await Promise.all(
    Object.entries(files).map(async ([path, getContent]) => {
      const filePath = join(target, path);
      await mkdir(join(filePath, ".."), { recursive: true });
      await writeFile(filePath, getContent(target));
    }),
  );

  console.log(`Created Presi React presentation in ${target}`);
  console.log(`Next steps:`);
  console.log(`  cd ${target}`);
  console.log(`  pnpm install`);
  console.log(`  pnpm dev`);
};
