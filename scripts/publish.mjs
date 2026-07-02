import { readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";

const registry = "https://registry.npmjs.org";
const otp = process.argv[2];
const versionBump = process.argv[3] || "patch";
const allowedVersionBumps = new Set(["patch", "minor", "major"]);

if (!otp || !allowedVersionBumps.has(versionBump)) {
  console.error("Usage: pnpm run publish <otp> [patch|minor|major]");
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

const bumpVersion = (version, bump) => {
  const parts = version.split(".").map((part) => parseInt(part, 10));
  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) {
    throw new Error(`Cannot bump invalid version: ${version}`);
  }

  const [major, minor, patch] = parts;
  if (bump === "major") return `${major + 1}.0.0`;
  if (bump === "minor") return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
};

const bumpBuildPackageVersion = async () => {
  const buildScriptPath = "scripts/build.mjs";
  const buildScript = await readFile(buildScriptPath, "utf8");
  const versionMatch = buildScript.match(/version: "(\d+\.\d+\.\d+)"/);
  if (!versionMatch) {
    throw new Error("Could not find package version in scripts/build.mjs");
  }

  const currentVersion = versionMatch[1];
  const nextVersion = bumpVersion(currentVersion, versionBump);
  await writeFile(
    buildScriptPath,
    buildScript.replace(versionMatch[0], `version: "${nextVersion}"`),
  );
  console.log(`Version bumped ${currentVersion} -> ${nextVersion} (${versionBump})`);
};

run("npm", ["whoami", "--registry", registry]);
await bumpBuildPackageVersion();
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
