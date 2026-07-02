import esbuild from "esbuild";
import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const watch = process.argv.includes("--watch");

const rawPlugin = {
  name: "raw-loader",
  setup(build) {
    build.onResolve({ filter: /\?raw$/ }, (args) => ({
      path: join(args.resolveDir, args.path.replace(/\?raw$/, "")),
      namespace: "raw-loader",
    }));

    build.onLoad({ filter: /.*/, namespace: "raw-loader" }, async (args) => ({
      contents: `export default ${JSON.stringify(await readFile(args.path, "utf8"))};`,
      loader: "js",
    }));
  },
};

const builds = [
  {
    entryPoints: ["library/index.ts"],
    outfile: "packages/presi-js/dist/index.js",
    external: ["vite", "react", "react-dom"],
  },
  {
    entryPoints: ["library/core/index.ts"],
    outfile: "packages/presi-js/dist/core.js",
    external: [],
  },
  {
    entryPoints: ["library/react/index.ts"],
    outfile: "packages/presi-js/dist/react.js",
    external: ["presi-js/core", "react", "react-dom"],
  },
  {
    entryPoints: ["library/server/index.ts"],
    outfile: "packages/presi-js/dist/server.js",
    external: ["vite"],
    platform: "node",
  },
  {
    entryPoints: ["library/server/cli.ts"],
    outfile: "packages/presi-js/dist/cli.js",
    external: ["vite"],
    platform: "node",
  },
];

const options = {
  bundle: true,
  format: "esm",
  jsx: "automatic",
  platform: "browser",
  sourcemap: true,
  target: "es2020",
  plugins: [rawPlugin],
};

const writeTypes = async () => {
  await Promise.all([
      mkdir("packages/presi-js/dist", { recursive: true }),
  ]);

  await Promise.all([
    writeFile(
      "packages/presi-js/dist/core.d.ts",
      `export interface PresiConfig {
  aspectRatio?: \`${"${number}:${number}"}\`;
  calculateFontSize?: () => number;
  transition?: PresiTransitionConfig;
}

export interface PresiTransitionConfig {
  duration?: number;
  delay?: number;
  easing?: string;
  attributes?: Partial<PresiTransitionAttributes>;
}

export interface PresiTransitionAttributes {
  in: string;
  out: string;
  inOrder: string;
  outOrder: string;
}

export interface PresiHashState {
  slideIndex: number;
  fragmentIndex: number;
}

export interface PresiEventsSlideChange {
  prevSlide: HTMLElement;
  prevSlideIndex: number;
  slide: HTMLElement;
  slideIndex: number;
}

export interface PresiEventsFragmentChange {
  prevFragmentIndex: number;
  fragmentIndex: number;
}

export interface PresiEventsStateChange {
  currentState: PresiHashState;
  nextState: PresiHashState;
}

export type PresiStepCleanup = void | (() => void);
export type PresiStepFunction = () => PresiStepCleanup;

export declare const PRESI_TRANSITION_CONFIG: {
  readonly duration: 200;
  readonly delay: 100;
  readonly easing: "cubic-bezier(.2, .85, .25, 1)";
  readonly attributes: {
    readonly in: "data-transition-in";
    readonly out: "data-transition-out";
    readonly inOrder: "data-transition-in-order";
    readonly outOrder: "data-transition-out-order";
  };
  readonly transitions: {
    readonly fade: { readonly x: "0"; readonly y: "0"; readonly scale: 1 };
    readonly "fade-up": { readonly x: "0"; readonly y: "2rem"; readonly scale: 1 };
    readonly "fade-left": { readonly x: "2rem"; readonly y: "0"; readonly scale: 1 };
    readonly "fade-right": { readonly x: "-2rem"; readonly y: "0"; readonly scale: 1 };
    readonly "fade-down": { readonly x: "0"; readonly y: "-2rem"; readonly scale: 1 };
    readonly "fade-grow": { readonly x: "0"; readonly y: "0"; readonly scale: 0.5 };
    readonly "fade-up-grow": { readonly x: "0"; readonly y: "2rem"; readonly scale: 0.5 };
    readonly "fade-left-grow": { readonly x: "2rem"; readonly y: "0"; readonly scale: 0.5 };
    readonly "fade-right-grow": { readonly x: "-2rem"; readonly y: "0"; readonly scale: 0.5 };
    readonly "fade-down-grow": { readonly x: "0"; readonly y: "-2rem"; readonly scale: 0.5 };
  };
};

export declare const registerPresiStep: (id: string, run: PresiStepFunction) => void;
export declare const unregisterPresiStep: (id: string) => void;

export declare class Presi {
  aspect: \`${"${number}:${number}"}\`;

  constructor(wrapper: HTMLElement, options: PresiConfig);
  onSlideChange(cb: (data: PresiEventsSlideChange) => void): void;
  onFragmentChange(cb: (data: PresiEventsFragmentChange) => void): void;
  onStateChange(cb: (data: PresiEventsStateChange) => void): void;
  cleanUp(): void;
  getCurrentHashStateSave(): PresiHashState;
  next(): Promise<void>;
  prev(): Promise<void>;
  nextState(prev: PresiHashState): PresiHashState | false;
  backState(prev: PresiHashState): PresiHashState | false;
  getCurrentSlide(): HTMLElement;
}
`,
    ),
    writeFile(
      "packages/presi-js/dist/react.d.ts",
      `import type React from "react";

export interface WrapperProps {
  children: React.ReactNode;
  aspectRatio: \`${"${number}:${number}"}\`;
  transition?: import("presi-js/core").PresiConfig["transition"];
}

export interface SlideProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  className?: string;
  title?: string;
  notes?: Array<string>;
  onMount?: () => void;
  onUnmount?: () => void;
}

export interface StepProps {
  stepIndex?: number;
  run: () => void | (() => void);
}

export interface PresiSlideProps {
  title: string;
}

export interface PresiContextValue {
  slideIndex: number;
  stepIndex: number;
  totalSlides: number;
  totalSteps: number;
  currentSlide: PresiSlideProps;
}

export declare const Wrapper: React.FC<WrapperProps>;
export declare const Slide: React.FC<SlideProps>;
export declare const Step: React.FC<StepProps>;
export declare const usePresi: () => PresiContextValue;
`,
    ),
    writeFile(
      "packages/presi-js/dist/server.d.ts",
      `import type { InlineConfig } from "vite";

export interface PresiConfig {
  root: string;
  entry: string;
  title: string;
  resolveMountElement: () => HTMLElement | null;
  vite: InlineConfig;
  dev: {
    port: number;
    host: string;
    includeNotes: boolean;
  };
  build: {
    outDir: string;
    includeNotes: boolean;
  };
}

export interface PresiUserConfig {
  root?: string;
  entry?: string;
  title?: string;
  resolveMountElement?: () => HTMLElement | null;
  vite?: InlineConfig;
  dev?: Partial<PresiConfig["dev"]>;
  build?: Partial<PresiConfig["build"]>;
}

export declare const defineConfig: (config?: PresiUserConfig) => PresiConfig;
export declare const devPresentation: (options?: { configFile?: string }) => Promise<void>;
export declare const buildPresentation: (options?: { configFile?: string }) => Promise<void>;
`,
    ),
    writeFile(
      "packages/presi-js/dist/index.d.ts",
      `export * from "./core.js";
`,
    ),
  ]);
};

const copyPackageAssets = async () => {
  await rm("packages/presi-js/skills", { recursive: true, force: true });
  await Promise.all([
    cp("skills", "packages/presi-js/skills", { recursive: true }),
    cp("README.md", "packages/presi-js/README.md"),
    cp("LICENSE", "packages/presi-js/LICENSE"),
  ]);
};

const writePackageJson = async () => {
  await mkdir("packages/presi-js", { recursive: true });
  await writeFile(
    "packages/presi-js/package.json",
    `${JSON.stringify(
      {
        name: "presi-js",
        version: "0.0.5",
        description: "A modern presentation framework",
        type: "module",
        author: "Nico Martin <mail@nico.dev>",
        license: "Apache-2.0",
        repository: {
          type: "git",
          url: "git+https://github.com/nico-martin/presi.git",
        },
        bugs: {
          url: "https://github.com/nico-martin/presi/issues",
        },
        homepage: "https://github.com/nico-martin/presi#readme",
        bin: {
          "presi-js": "./dist/cli.js",
        },
        main: "./dist/index.js",
        module: "./dist/index.js",
        types: "./dist/index.d.ts",
        exports: {
          ".": {
            types: "./dist/index.d.ts",
            import: "./dist/index.js",
          },
          "./core": {
            types: "./dist/core.d.ts",
            import: "./dist/core.js",
          },
          "./react": {
            types: "./dist/react.d.ts",
            import: "./dist/react.js",
          },
          "./server": {
            types: "./dist/server.d.ts",
            import: "./dist/server.js",
          },
        },
        files: ["dist", "skills", "README.md", "LICENSE"],
        dependencies: {
          vite: "^4.5.0",
        },
        peerDependencies: {
          react: "^18.2.0",
          "react-dom": "^18.2.0",
        },
        peerDependenciesMeta: {
          react: {
            optional: true,
          },
          "react-dom": {
            optional: true,
          },
        },
      },
      null,
      2,
    )}\n`,
  );
};

const writePackageFiles = async () => {
  await Promise.all([writeTypes(), copyPackageAssets(), writePackageJson()]);
};

if (watch) {
  const contexts = await Promise.all(
    builds.map((build) => esbuild.context({ ...options, ...build })),
  );

  await Promise.all(contexts.map((context) => context.watch()));
  await writePackageFiles();
  console.log("Watching library bundles...");
} else {
  await Promise.all(builds.map((build) => esbuild.build({ ...options, ...build })));
  await writePackageFiles();
}
