#!/usr/bin/env node
import { buildPresentation, devPresentation } from "./presiServer";

const main = async () => {
  const command = process.argv[2] || "dev";

  if (command === "dev") {
    await devPresentation();
  } else if (command === "build") {
    await buildPresentation();
  } else {
    console.error(`Unknown presi command: ${command}`);
    process.exit(1);
  }
};

main();
