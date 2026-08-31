#!/usr/bin/env node
import { createReactPresentation } from "./createReact";
import {
  buildPresentation,
  devPresentation,
  exportPresentation,
  presentPresentation,
  type ExportMode,
} from "./presiServer";

const parseExportMode = (args: string[]): ExportMode => {
  let mode: string;

  if (args.length === 0) {
    return "pdf";
  } else if (args.length === 1) {
    mode = args[0].replace(/^(?:--)?mode=/, "");
  } else if (args.length === 2 && args[0] === "--mode") {
    mode = args[1];
  } else {
    throw new Error("Usage: presi export [--mode=pdf|transcript|notes]");
  }

  if (mode !== "pdf" && mode !== "transcript" && mode !== "notes") {
    throw new Error(`Unknown export mode: ${mode}`);
  }

  return mode;
};

const main = async () => {
  const command = process.argv[2] || "dev";

  if (command === "create") {
    const template = process.argv[3] || "react";
    const target = process.argv[4] || "presi-presentation";

    if (template !== "react") {
      console.error(`Unknown Presi template: ${template}`);
      process.exit(1);
    }

    await createReactPresentation(target);
  } else if (command === "react") {
    await createReactPresentation(process.argv[3] || "presi-presentation");
  } else if (command === "dev") {
    await devPresentation();
  } else if (command === "build") {
    await buildPresentation();
  } else if (command === "present") {
    await presentPresentation();
  } else if (command === "export") {
    await exportPresentation({ mode: parseExportMode(process.argv.slice(3)) });
  } else {
    console.error(`Unknown presi command: ${command}`);
    process.exit(1);
  }
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
