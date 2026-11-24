// Serves MediaPipe's WebAssembly from our own origin instead of a third-party CDN.
// The target folder is generated: it is emptied and refilled on every run.
import { cpSync, existsSync, rmSync } from "node:fs";

const from = "node_modules/@mediapipe/tasks-vision/wasm";
const to = "public/mediapipe/wasm";
if (!existsSync(from)) {
  console.error(`copy-mediapipe: ${from} not found; run npm install`);
  process.exit(1);
}
rmSync(to, { recursive: true, force: true });
// forVisionTasks() loads the non-module build; skip the 14 MB module variant.
cpSync(from, to, { recursive: true, filter: (src) => !src.includes("_module_") });
