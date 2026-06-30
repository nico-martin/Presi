import esbuild from "esbuild";
import { mkdir, writeFile } from "node:fs/promises";
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
    entryPoints: ["library/core/index.ts"],
    outfile: "packages/core/dist/index.js",
    external: [],
  },
  {
    entryPoints: ["library/react/index.ts"],
    outfile: "packages/react/dist/index.js",
    external: ["@presi/core", "react", "react-dom"],
  },
  {
    entryPoints: ["library/server/index.ts"],
    outfile: "packages/server/dist/index.js",
    external: ["vite"],
    platform: "node",
  },
  {
    entryPoints: ["library/server/cli.ts"],
    outfile: "packages/server/dist/cli.js",
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
    mkdir("packages/core/dist", { recursive: true }),
    mkdir("packages/react/dist", { recursive: true }),
    mkdir("packages/server/dist", { recursive: true }),
  ]);

  await Promise.all([
    writeFile(
      "packages/core/dist/index.d.ts",
      `export interface PresiConfig {
  aspectRatio?: \`${"${number}:${number}"}\`;
  calculateFontSize?: () => number;
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
      "packages/react/dist/index.d.ts",
      `import type React from "react";

export interface WrapperProps {
  children: React.ReactNode;
  aspectRatio: \`${"${number}:${number}"}\`;
}

export interface SlideProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  notes?: Array<string>;
}

export interface StepProps {
  stepIndex?: number;
  run: () => void | (() => void);
}

export type SlideMountProps = Pick<StepProps, "run">;

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
export declare const SlideMount: React.FC<SlideMountProps>;
export declare const useSlideMount: (run: () => void | (() => void)) => void;
export declare const usePresi: () => PresiContextValue;
`,
    ),
    writeFile(
      "packages/server/dist/index.d.ts",
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
  ]);
};

if (watch) {
  const contexts = await Promise.all(
    builds.map((build) => esbuild.context({ ...options, ...build })),
  );

  await Promise.all(contexts.map((context) => context.watch()));
  await writeTypes();
  console.log("Watching library bundles...");
} else {
  await Promise.all(builds.map((build) => esbuild.build({ ...options, ...build })));
  await writeTypes();
}
