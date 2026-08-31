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
      contents: `export default ${JSON.stringify(
        await readFile(args.path, "utf8"),
      )};`,
      loader: "js",
    }));
  },
};

const builds = [
  {
    entryPoints: ["library/react/index.ts"],
    outfile: "packages/presi-js/dist/react.js",
    external: ["react", "react-dom"],
  },
  {
    entryPoints: ["library/server/index.ts"],
    outfile: "packages/presi-js/dist/server.js",
    external: ["playwright", "vite"],
    platform: "node",
  },
  {
    entryPoints: ["library/server/cli.ts"],
    outfile: "packages/presi-js/dist/cli.js",
    external: ["playwright", "vite"],
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

const reactTypes = `import type React from "react";

export type TransitionName =
  | "fade"
  | "fade-up"
  | "fade-left"
  | "fade-right"
  | "fade-down"
  | "fade-grow"
  | "fade-up-grow"
  | "fade-left-grow"
  | "fade-right-grow"
  | "fade-down-grow"
  | "pop";

export declare const TRANSITIONS: Record<
  TransitionName,
  {
    keyframes: readonly Readonly<Record<string, string | number>>[];
    easing?: string;
  }
>;

export interface PresiTransitionConfig {
  duration?: number;
  delay?: number;
  inDelay?: number;
  easing?: string;
}

export type PresiStepCleanup = void | (() => void);
export type PresiStepFunction = () => PresiStepCleanup;

export interface DeckConfig {
  aspectRatio: \`${"${number}:${number}"}\`;
  transition?: PresiTransitionConfig;
  calculateFontSize?: () => number;
}

export interface WrapperProps {
  children: React.ReactNode;
  aspectRatio: \`${"${number}:${number}"}\`;
  transition?: PresiTransitionConfig;
  calculateFontSize?: () => number;
}

export interface SlideProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  id?: string;
  background?: SlideBackground;
  className?: string;
  title?: string;
  notes?: Array<string> | null;
  transitionIn?: TransitionName;
  transitionOut?: TransitionName;
  onMount?: () => void;
  onUnmount?: () => void;
}

export interface SlideBackground {
  className?: string;
  color?: React.CSSProperties["backgroundColor"];
  image?: string;
  style?: React.CSSProperties;
}

export interface FragmentConfig {
  transitionIn?: TransitionName;
  transitionOut?: TransitionName;
  order?: number;
  stepIndex?: number;
}

export interface FragmentOwnProps {
  transitionIn?: TransitionName;
  transitionOut?: TransitionName;
  order?: number;
  stepIndex?: number;
}

export type FragmentProps<T extends React.ElementType = "span"> =
  FragmentOwnProps & { as?: T } & Omit<
      React.ComponentPropsWithoutRef<T>,
      "as" | keyof FragmentOwnProps
    >;

export interface StepProps {
  stepIndex?: number;
  run: PresiStepFunction;
}

export interface PresiSnapshot {
  isExporting: boolean;
  slideIndex: number;
  stepIndex: number;
  totalSlides: number;
  totalSteps: number;
  currentSlide: {
    title: string;
  };
}

export type PresiContextValue = PresiSnapshot;

export declare const Wrapper: React.FC<WrapperProps>;
export declare const Slide: React.FC<SlideProps>;
export declare const Fragment: <T extends React.ElementType = "span">(
  props: FragmentProps<T>,
) => React.ReactElement;
export declare const Step: React.FC<StepProps>;
export declare const usePresi: () => PresiContextValue;
`;

const writeTypes = async () => {
  await Promise.all([mkdir("packages/presi-js/dist", { recursive: true })]);

  await Promise.all([
    writeFile("packages/presi-js/dist/react.d.ts", reactTypes),
    writeFile(
      "packages/presi-js/dist/server.d.ts",
      `import type { InlineConfig } from "vite";

export interface PresiConfig {
  root: string;
  entry: string;
  title: string;
  resolveMountElement: () => HTMLElement | null;
  ssl?: {
    key: string;
    cert: string;
  };
  vite: InlineConfig;
  dev: {
    port: number;
    host: string;
    includeNotes: boolean;
  };
  present: {
    port: number;
    host: string;
  };
  export: {
    file: string;
  };
  build: {
    outDir: string;
    distFolder?: string;
  };
}

export interface PresiUserConfig {
  root?: string;
  entry?: string;
  title?: string;
  resolveMountElement?: () => HTMLElement | null;
  ssl?: PresiConfig["ssl"];
  vite?: InlineConfig;
  dev?: Partial<PresiConfig["dev"]>;
  present?: Partial<PresiConfig["present"]>;
  export?: Partial<PresiConfig["export"]>;
  build?: Partial<PresiConfig["build"]>;
}

export declare const defineConfig: (config?: PresiUserConfig) => PresiConfig;
export declare const devPresentation: (options?: { configFile?: string }) => Promise<void>;
export declare const buildPresentation: (options?: { configFile?: string }) => Promise<void>;
export declare const presentPresentation: (options?: { configFile?: string }) => Promise<void>;
export type ExportMode = "pdf" | "transcript" | "notes";
export interface ExportPresentationOptions {
  configFile?: string;
  mode?: ExportMode;
}
export declare const exportPresentation: (options?: ExportPresentationOptions) => Promise<void>;
`,
    ),
    writeFile(
      "packages/presi-js/dist/index.d.ts",
      `export * from "./react.js";
`,
    ),
    writeFile(
      "packages/presi-js/dist/index.js",
      `export * from "./react.js";
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
        version: "0.0.16",
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
          "presi-js": "dist/cli.js",
        },
        main: "./dist/index.js",
        module: "./dist/index.js",
        types: "./dist/index.d.ts",
        exports: {
          ".": {
            types: "./dist/index.d.ts",
            import: "./dist/index.js",
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
          playwright: "^1.45.0",
          vite: "^4.5.0",
        },
        peerDependencies: {
          react: "^18.2.0",
          "react-dom": "^18.2.0",
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
  await Promise.all(
    builds.map((build) => esbuild.build({ ...options, ...build })),
  );
  await writePackageFiles();
}
