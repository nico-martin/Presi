import { access, mkdir, writeFile } from "node:fs/promises";
import { isAbsolute, resolve } from "node:path";
import {
  build,
  createServer,
  loadConfigFromFile,
  mergeConfig,
  type InlineConfig,
  type Plugin,
} from "vite";
import defaultConfig, { type PresiConfig, type PresiUserConfig } from "./presiConfig";

interface ServerOptions {
  configFile?: string;
}

const loadConfig = async (configFile = "presi.config.ts"): Promise<PresiConfig> => {
  const configPath = isAbsolute(configFile) ? configFile : resolve(process.cwd(), configFile);
  const loaded = await loadConfigFromFile(
    { command: "serve", mode: "development" },
    configPath,
  );

  return defaultConfig((loaded?.config || {}) as PresiConfig | PresiUserConfig);
};

const html = (config: PresiConfig) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${config.title}</title>
  </head>
  <body>
    <div id="presi"></div>
    <script type="module" src="/virtual:presi-entry"></script>
  </body>
</html>`;

const writeHtml = async (config: PresiConfig) => {
  const indexPath = resolve(config.root, "index.html");

  try {
    await access(indexPath);
    return;
  } catch {
    // Generate a default shell only when the presentation did not provide one.
  }

  await mkdir(resolve(config.root), { recursive: true });
  await writeFile(indexPath, html(config));
};

const presiPlugin = (config: PresiConfig): Plugin => ({
  name: "presi-server",
  resolveId(id) {
    if (id === "virtual:presi-entry" || id === "/virtual:presi-entry") {
      return "virtual:presi-entry";
    }
  },
  load(id) {
    if (id !== "virtual:presi-entry") return;

    return `import render from ${JSON.stringify(`/${config.entry}`)};

const resolveMountElement = ${config.resolveMountElement.toString()};
const mountElement = resolveMountElement();

if (!mountElement) {
  throw new Error("Presi mount element not found.");
}

render(mountElement);`;
  },
  transformIndexHtml(html) {
    return html.replace("%PRESI_TITLE%", config.title);
  },
});

const createHtmlPlugin = (config: PresiConfig): Plugin => ({
  name: "presi-html-fallback",
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url !== "/" && req.url !== "/index.html") {
        next();
        return;
      }

      server.transformIndexHtml(req.url, html(config)).then((transformed) => {
        res.setHeader("Content-Type", "text/html");
        res.end(transformed);
      });
    });
  },
});

const createViteConfig = (config: PresiConfig, command: "dev" | "build"): InlineConfig => {
  const includeNotes = command === "dev" ? config.dev.includeNotes : config.build.includeNotes;

  return mergeConfig(config.vite, {
    root: config.root,
    define: {
      "import.meta.env.PRESI_INCLUDE_NOTES": JSON.stringify(String(includeNotes)),
    },
    plugins: [createHtmlPlugin(config), presiPlugin(config)],
    server: {
      host: config.dev.host,
      port: config.dev.port,
    },
    build: {
      outDir: config.build.outDir,
      rollupOptions: {
        input: resolve(config.root, "index.html"),
      },
    },
  } satisfies InlineConfig);
};

export const devPresentation = async (options: ServerOptions = {}) => {
  const config = await loadConfig(options.configFile);
  await writeHtml(config);
  const server = await createServer(createViteConfig(config, "dev"));
  await server.listen();
  server.printUrls();
};

export const buildPresentation = async (options: ServerOptions = {}) => {
  const config = await loadConfig(options.configFile);
  await writeHtml(config);
  await build(createViteConfig(config, "build"));
};
