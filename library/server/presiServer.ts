import { createReadStream, readFileSync } from "node:fs";
import { access, mkdir, stat, unlink, writeFile } from "node:fs/promises";
import {
  createServer as createHttpServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from "node:http";
import { createServer as createHttpsServer } from "node:https";
import { isAbsolute, join, resolve, sep } from "node:path";
import {
  build,
  createServer as createViteServer,
  loadConfigFromFile,
  mergeConfig,
  type InlineConfig,
  type Plugin,
} from "vite";
import defaultConfig, {
  type PresiConfig,
  type PresiUserConfig,
} from "./presiConfig";

interface ServerOptions {
  configFile?: string;
}

const loadConfig = async (
  configFile = "presi.config.ts",
  command: "serve" | "build" = "serve",
): Promise<PresiConfig> => {
  const configPath = isAbsolute(configFile)
    ? configFile
    : resolve(process.cwd(), configFile);
  const loaded = await loadConfigFromFile(
    { command, mode: command === "serve" ? "development" : "production" },
    configPath,
  );

  return defaultConfig((loaded?.config || {}) as PresiConfig | PresiUserConfig);
};

const getBuildOutDir = (config: PresiConfig) =>
  config.build.distFolder
    ? join(config.build.outDir, config.build.distFolder)
    : config.build.outDir;

const readSslFile = (path: string) =>
  readFileSync(isAbsolute(path) ? path : resolve(process.cwd(), path));

const getHttpsOptions = (config: PresiConfig) => {
  if (!config.ssl) return undefined;

  return {
    key: readSslFile(config.ssl.key),
    cert: readSslFile(config.ssl.cert),
  };
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
    const entry = JSON.stringify(`/${config.entry}`);

    return `import render from ${entry};

const resolveMountElement = ${config.resolveMountElement.toString()};
const mountElement = resolveMountElement();
let cleanup;

if (!mountElement) {
  throw new Error("Presi mount element not found.");
}

const run = (renderPresentation) => {
  cleanup?.();
  const nextCleanup = renderPresentation(mountElement);
  cleanup = typeof nextCleanup === "function" ? nextCleanup : undefined;
};

run(render);

if (import.meta.hot) {
  import.meta.hot.accept(${entry}, (mod) => {
    if (!mod?.default) return;
    run(mod.default);
  });

  import.meta.hot.dispose(() => {
    cleanup?.();
  });
}`;
  },
  transformIndexHtml(html) {
    return html.replace("%PRESI_TITLE%", config.title);
  },
});

const createViteConfig = (
  config: PresiConfig,
  command: "dev" | "build" | "present" | "export",
): InlineConfig => {
  const includeNotes =
    command === "dev"
      ? config.dev.includeNotes
      : command === "build"
      ? config.build.includeNotes
      : true;
  const outDir = getBuildOutDir(config);
  const https = getHttpsOptions(config);

  return mergeConfig(config.vite, {
    root: config.root,
    define: {
      PRESI_INCLUDE_NOTES: JSON.stringify(String(includeNotes)),
      "globalThis.PRESI_DISABLE_TRANSITIONS": JSON.stringify(
        command === "export",
      ),
      "globalThis.PRESI_EXPORT_MODE": JSON.stringify(command === "export"),
    },
    plugins: [presiPlugin(config)],
    server: {
      host: config.dev.host,
      port: config.dev.port,
      ...(https ? { https } : {}),
    },
    build: {
      outDir,
      rollupOptions: {
        input: resolve(config.root, "index.html"),
      },
    },
  } satisfies InlineConfig);
};

export const devPresentation = async (options: ServerOptions = {}) => {
  const config = await loadConfig(options.configFile, "serve");
  await writeHtml(config);
  const server = await createViteServer(createViteConfig(config, "dev"));
  await server.listen();
  server.printUrls();
};

export const buildPresentation = async (options: ServerOptions = {}) => {
  const config = await loadConfig(options.configFile, "build");
  await writeHtml(config);
  await build(createViteConfig(config, "build"));
};

const contentTypes: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".wasm": "application/wasm",
};

const getContentType = (path: string) => {
  const extension = path.match(/\.[^.]+$/)?.[0] || "";
  return contentTypes[extension] || "application/octet-stream";
};

const createStaticServer = (
  outDir: string,
  https?: ReturnType<typeof getHttpsOptions>,
): Server => {
  const requestHandler = async (req: IncomingMessage, res: ServerResponse) => {
    const url = new URL(
      req.url || "/",
      `http://${req.headers.host || "localhost"}`,
    );
    const pathname = decodeURIComponent(url.pathname);
    const requestedPath = pathname === "/" ? "/index.html" : pathname;
    const filePath = resolve(outDir, `.${requestedPath}`);

    if (filePath !== outDir && !filePath.startsWith(`${outDir}${sep}`)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    try {
      const fileStat = await stat(filePath);
      const finalPath = fileStat.isDirectory()
        ? resolve(filePath, "index.html")
        : filePath;
      res.setHeader("Content-Type", getContentType(finalPath));
      createReadStream(finalPath).pipe(res);
    } catch {
      res.writeHead(404);
      res.end("Not found");
    }
  };

  return https
    ? createHttpsServer(https, requestHandler)
    : createHttpServer(requestHandler);
};

const closeServer = (server: Server) =>
  new Promise<void>((resolveClose, rejectClose) => {
    server.close((error) => {
      error ? rejectClose(error) : resolveClose();
    });
  });

export const presentPresentation = async (options: ServerOptions = {}) => {
  const config = await loadConfig(options.configFile, "build");
  await writeHtml(config);
  await build(createViteConfig(config, "present"));

  const outDir = resolve(config.root, getBuildOutDir(config));
  const https = getHttpsOptions(config);
  const protocol = https ? "https" : "http";
  const server = createStaticServer(outDir, https);

  server.on("error", (error: NodeJS.ErrnoException) => {
    if (error.code === "EADDRINUSE") {
      console.error(`Port ${config.present.port} is already in use.`);
    } else {
      console.error(error);
    }
    process.exitCode = 1;
  });

  server.listen(config.present.port, config.present.host, () => {
    console.log(`Presi presentation serving ${outDir}`);
    console.log(`Local:   ${protocol}://localhost:${config.present.port}/`);
    console.log(
      `Network: ${protocol}://${config.present.host}:${config.present.port}/`,
    );
  });
};

const getExportPath = (config: PresiConfig) => {
  return isAbsolute(config.export.file)
    ? config.export.file
    : resolve(config.root, config.export.file);
};

const removeExistingExport = async (path: string) => {
  try {
    await unlink(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
};

const CSS_PIXELS_PER_INCH = 96;
const PDF_WIDTH_INCHES = 16;
const DEFAULT_PDF_HEIGHT_INCHES = 9;
const PDF_VIEWPORT_WIDTH = PDF_WIDTH_INCHES * CSS_PIXELS_PER_INCH;
const DEFAULT_PDF_VIEWPORT_HEIGHT =
  DEFAULT_PDF_HEIGHT_INCHES * CSS_PIXELS_PER_INCH;

export const exportPresentation = async (options: ServerOptions = {}) => {
  const config = await loadConfig(options.configFile, "build");
  await writeHtml(config);
  await build(createViteConfig(config, "export"));

  const outDir = resolve(config.root, getBuildOutDir(config));
  const https = getHttpsOptions(config);
  const protocol = https ? "https" : "http";
  const server = createStaticServer(outDir, https);

  await new Promise<void>((resolveListen, rejectListen) => {
    server.once("error", rejectListen);
    server.listen(0, config.present.host, () => resolveListen());
  });

  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  const baseUrl = `${protocol}://localhost:${port}`;
  const outputPath = getExportPath(config);
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ headless: true }).catch((error) => {
    throw new Error(
      `Unable to launch Playwright Chromium. Run "pnpm exec playwright install chromium" to install the browser.\n${error}`,
    );
  });
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: {
      width: PDF_VIEWPORT_WIDTH,
      height: DEFAULT_PDF_VIEWPORT_HEIGHT,
    },
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
  });

  try {
    const page = await context.newPage();
    await page.goto(`${baseUrl}/#/0/0`, {
      waitUntil: "networkidle",
    });
    await page.evaluate(() => document.fonts?.ready.then(() => true));

    await page.waitForFunction(() =>
      Boolean(
        (
          window as typeof window & {
            __PRESI_DECK__?: {
              aspectRatio: `${number}:${number}`;
              slides: Array<{ stepCount: number }>;
            };
          }
        ).__PRESI_DECK__,
      ),
    );
    const deck = await page.evaluate(
      () =>
        (
          window as typeof window & {
            __PRESI_DECK__?: {
              aspectRatio: `${number}:${number}`;
              slides: Array<{ stepCount: number }>;
            };
          }
        ).__PRESI_DECK__!,
    );
    const [aspectWidth, aspectHeight] = deck.aspectRatio.split(":").map(Number);
    const pdfHeightInches = PDF_WIDTH_INCHES * (aspectHeight / aspectWidth);
    await page.setViewportSize({
      width: PDF_VIEWPORT_WIDTH,
      height: Math.round(pdfHeightInches * CSS_PIXELS_PER_INCH),
    });
    await page.evaluate(
      () =>
        new Promise<void>((resolveFrame) =>
          requestAnimationFrame(() =>
            requestAnimationFrame(() => resolveFrame()),
          ),
        ),
    );
    await page.evaluate(() => document.fonts?.ready.then(() => true));

    const slides = deck.slides;

    const styles = await page.evaluate(() =>
      Array.from(document.styleSheets)
        .map((styleSheet) => {
          try {
            return Array.from(styleSheet.cssRules)
              .map((rule) => rule.cssText)
              .join("\n");
          } catch {
            return "";
          }
        })
        .filter(Boolean)
        .join("\n"),
    );
    const rootFontSize = await page.evaluate(
      () => getComputedStyle(document.documentElement).fontSize,
    );

    const pages: string[] = [];
    for (const [slideIndex, slide] of slides.entries()) {
      for (let stepIndex = 0; stepIndex < slide.stepCount; stepIndex += 1) {
        await page.evaluate(
          ({ nextSlideIndex, nextStepIndex }) => {
            window.location.hash = `#/${nextSlideIndex}/${nextStepIndex}`;
          },
          { nextSlideIndex: slideIndex, nextStepIndex: stepIndex },
        );
        await page.waitForFunction(
          ({ nextSlideIndex, nextStepIndex }) =>
            window.location.hash === `#/${nextSlideIndex}/${nextStepIndex}`,
          { nextSlideIndex: slideIndex, nextStepIndex: stepIndex },
          {},
        );
        await page.waitForSelector(".presi-wrapper");
        await page.waitForTimeout(50);

        const snapshot = await page.evaluate(() => {
          const wrapper = document.querySelector(".presi-wrapper");
          if (!wrapper) return null;
          return wrapper.outerHTML;
        });
        if (!snapshot)
          throw new Error("Presi wrapper not found while exporting.");
        pages.push(snapshot);
      }
    }

    const pdfPage = await context.newPage();
    await pdfPage.emulateMedia({ media: "screen" });
    await pdfPage.setContent(
      `<!doctype html><html><head><base href="${baseUrl}/"><style>${styles}</style><style>
        @page { size: ${PDF_WIDTH_INCHES}in ${pdfHeightInches}in; margin: 0; }
        html { font-size: ${rootFontSize}; }
        html, body { margin: 0; padding: 0; }
        .page { background: #000; break-after: page; height: ${pdfHeightInches}in; overflow: hidden; position: relative; width: ${PDF_WIDTH_INCHES}in; }
        .page:last-child { break-after: auto; }
        .page .presi-wrapper {
          height: 100% !important;
          left: 0 !important;
          max-height: none !important;
          max-width: none !important;
          position: absolute !important;
          top: 0 !important;
          transform: none !important;
          width: 100% !important;
        }
        .page .presi-slide {
          height: 100% !important;
          width: 100% !important;
        }
      </style></head><body>${pages
        .map((snapshot) => `<div class="page">${snapshot}</div>`)
        .join("")}</body></html>`,
      { waitUntil: "load" },
    );
    await pdfPage.evaluate(() => document.fonts?.ready.then(() => true));
    await removeExistingExport(outputPath);
    await pdfPage.pdf({
      path: outputPath,
      printBackground: true,
      width: `${PDF_WIDTH_INCHES}in`,
      height: `${pdfHeightInches}in`,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    console.log(`Exported ${pages.length} pages to ${outputPath}`);
  } finally {
    await browser.close();
    await closeServer(server);
  }
};
