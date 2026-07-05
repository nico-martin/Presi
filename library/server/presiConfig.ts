import type { InlineConfig, PluginOption } from "vite";

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
    includeNotes: boolean;
  };
}

export interface PresiUserConfig {
  root?: string;
  entry?: string;
  title?: string;
  resolveMountElement?: () => HTMLElement | null;
  ssl?: PresiConfig["ssl"];
  vite?: InlineConfig & {
    plugins?: PluginOption[];
  };
  dev?: Partial<PresiConfig["dev"]>;
  present?: Partial<PresiConfig["present"]>;
  export?: Partial<PresiConfig["export"]>;
  build?: Partial<PresiConfig["build"]>;
}

const defineConfig = (config: PresiUserConfig = {}): PresiConfig => ({
  root: config.root || ".",
  entry: config.entry || "Slides.tsx",
  title: config.title || "Presi",
  resolveMountElement:
    config.resolveMountElement || (() => document.getElementById("presi")),
  ssl: config.ssl,
  vite: config.vite || {},
  dev: {
    port: config.dev?.port || (process.env.PORT ? parseInt(process.env.PORT) : 3000),
    host: config.dev?.host || "0.0.0.0",
    includeNotes: config.dev?.includeNotes ?? true,
  },
  present: {
    port: config.present?.port || config.dev?.port || (process.env.PORT ? parseInt(process.env.PORT) : 3000),
    host: config.present?.host || config.dev?.host || "0.0.0.0",
  },
  export: {
    file: config.export?.file || "slide.pdf",
  },
  build: {
    outDir: config.build?.outDir || "dist",
    distFolder: config.build?.distFolder,
    includeNotes: config.build?.includeNotes ?? false,
  },
});

export default defineConfig;
