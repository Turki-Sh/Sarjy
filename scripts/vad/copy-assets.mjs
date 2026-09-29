// Copies the voice activity detector's files into public/vad/, so the browser loads them from
// Sarjy's own domain (no third-party CDN, works behind strict networks). Runs before every build
// and dev start. The folder is git-ignored: these are build outputs, not source.
//
//   silero_vad_v5.onnx            the speech detection model (about 2 MB)
//   vad.worklet.bundle.min.js     the audio worklet that feeds it 16 kHz frames
//   ort-wasm-simd-threaded.*      ONNX Runtime for WebAssembly, which runs the model

import { copyFileSync, existsSync, mkdirSync, realpathSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const vadDir = dirname(require.resolve("@ricky0123/vad-web/package.json"));
// onnxruntime-web is vad-web's own dependency, so resolve it from there (pnpm keeps it nested),
// then walk up from its entry file to the package folder.
let ortDir = dirname(createRequire(realpathSync(join(vadDir, "package.json"))).resolve("onnxruntime-web"));
while (!existsSync(join(ortDir, "package.json"))) ortDir = dirname(ortDir);

const out = "public/vad";
mkdirSync(out, { recursive: true });
const files = [
  [join(vadDir, "dist/silero_vad_v5.onnx"), "silero_vad_v5.onnx"],
  [join(vadDir, "dist/vad.worklet.bundle.min.js"), "vad.worklet.bundle.min.js"],
  [join(ortDir, "dist/ort-wasm-simd-threaded.wasm"), "ort-wasm-simd-threaded.wasm"],
  [join(ortDir, "dist/ort-wasm-simd-threaded.mjs"), "ort-wasm-simd-threaded.mjs"],
];
for (const [from, name] of files) copyFileSync(from, join(out, name));
console.log(`vad: ${files.length} files in ${out}/`);
