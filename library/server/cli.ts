#!/usr/bin/env node
import { createReactPresentation } from "./createReact";
import { buildPresentation, devPresentation } from "./presiServer";

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
  } else {
    console.error(`Unknown presi command: ${command}`);
    process.exit(1);
  }
};

main();
