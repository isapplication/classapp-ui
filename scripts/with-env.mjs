// Runs a command with an env file loaded, e.g. `node scripts/with-env.mjs .env.uat next build`.
// Variables already set in the environment win over the file (the same rule as Next.js and Node).
// (`node --env-file` can't be used: Next.js passes it on to its build workers, where Node rejects it.)
import { spawn } from "node:child_process";

const [file, command, ...args] = process.argv.slice(2);
if (!file || !command) {
  console.error("usage: node scripts/with-env.mjs <env-file> <command> [args...]");
  process.exit(2);
}
process.loadEnvFile(file);
const child = spawn(command, args, { stdio: "inherit", env: process.env, shell: process.platform === "win32" });
child.on("exit", (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
