import type { InlineConfig, PluginOption } from "vite";

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
  vite?: InlineConfig & {
    plugins?: PluginOption[];
  };
  dev?: Partial<PresiConfig["dev"]>;
  build?: Partial<PresiConfig["build"]>;
}

const defineConfig = (config: PresiUserConfig = {}): PresiConfig => ({
  root: config.root || ".",
  entry: config.entry || "Slides.tsx",
  title: config.title || "Presi",
  resolveMountElement:
    config.resolveMountElement || (() => document.getElementById("presi")),
  vite: config.vite || {},
  dev: {
    port: config.dev?.port || (process.env.PORT ? parseInt(process.env.PORT) : 3000),
    host: config.dev?.host || "0.0.0.0",
    includeNotes: config.dev?.includeNotes ?? true,
  },
  build: {
    outDir: config.build?.outDir || "dist",
    includeNotes: config.build?.includeNotes ?? false,
  },
});

export default defineConfig;
