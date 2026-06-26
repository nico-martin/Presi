import { spawn } from "node:child_process";

const commands = [
  ["node", ["scripts/build.mjs", "--watch"]],
  ["pnpm", ["--filter", "@presi/slides-test", "dev"]],
];

const processes = commands.map(([command, args]) =>
  spawn(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
  }),
);

const stop = (exitCode = 0) => {
  for (const child of processes) {
    child.kill("SIGTERM");
  }
  process.exit(exitCode);
};

for (const child of processes) {
  child.on("exit", (code) => {
    if (code !== 0 && code !== null) stop(code);
  });
}

process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());
