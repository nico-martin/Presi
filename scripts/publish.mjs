import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";

const registry = "https://registry.npmjs.org";
const otp = process.argv[2];

if (!otp) {
  console.error("Usage: pnpm run publish <otp>");
  process.exit(1);
}

const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    ...options,
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
};

run("npm", ["whoami", "--registry", registry]);
run("pnpm", ["build"]);

const packageJson = JSON.parse(
  await readFile("packages/presi-js/package.json", "utf8"),
);

console.log(`Publishing ${packageJson.name}@${packageJson.version}...`);

run(
  "npm",
  ["publish", "--registry", registry, "--otp", otp],
  { cwd: "packages/presi-js" },
);
