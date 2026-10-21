import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const viteCli = path.join(projectDirectory, "node_modules", "vite", "bin", "vite.js");
const processes = [
  spawn(process.execPath, ["--watch", "server/index.js"], {
    cwd: projectDirectory,
    stdio: "inherit",
  }),
  spawn(process.execPath, [viteCli], {
    cwd: projectDirectory,
    stdio: "inherit",
  }),
];
let shuttingDown = false;

function stopProcesses(exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  process.exitCode = exitCode;
  for (const child of processes) {
    if (child.exitCode === null && !child.killed) child.kill();
  }
}

for (const child of processes) {
  child.on("error", (error) => {
    console.error("Could not start development process:", error);
    stopProcesses(1);
  });
  child.on("exit", (code) => {
    if (!shuttingDown) stopProcesses(code || 0);
  });
}

process.on("SIGINT", () => stopProcesses(0));
process.on("SIGTERM", () => stopProcesses(0));
