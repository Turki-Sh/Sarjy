// The Rafeeq art lab: every companion, in every pose, on one page, drawn from the same art modules
// as the app. Run: node scripts/rafeeq/lab.mjs (it bundles this file, writes the page, and
// screenshots it). Poses come from Rafeeq.module.css with its module scoping removed.
import { readFileSync, writeFileSync } from "node:fs";
import { ART } from "../../src/client/ui/rafeeq/art";

const [, , out, only, posesArg] = process.argv;
const tokens = readFileSync("src/styles/tokens.css", "utf8");
const css = readFileSync("src/client/ui/rafeeq/Rafeeq.module.css", "utf8").replace(
  /:global\(([^)]+)\)/g,
  "$1",
);
const POSES: [string, string, string][] = [
  ["idle", "idle", "none"],
  ["listening", "listening", "none"],
  ["thinking", "thinking", "none"],
  ["speaking", "speaking", "none"],
  ["happy", "idle", "happy"],
  ["petted", "idle", "petted"],
  ["sleepy", "idle", "sleepy"],
  ["droop", "idle", "droop"],
];
const poses = posesArg ? POSES.filter(([n]) => posesArg.split(",").includes(n)) : POSES;
const ids = only ? only.split(",") : Object.keys(ART);
const size = poses.length <= 4 ? 300 : 150;
const cell = (id: string, [n, state, mood]: [string, string, string]) => `
  <div class="cell"><div class="wrap" data-rafeeq="${id}" data-state="${state}" data-mood="${mood}" data-purr data-star style="--orb-size:${size}px;--mouth:${state === "speaking" ? 0.8 : 0};--lvl:${state === "listening" ? 0.5 : 0}">
    <svg class="svg" viewBox="0 0 200 200">${ART[id as keyof typeof ART](`${id}${n}`)}</svg>
  </div><span>${id} · ${n}</span></div>`;
writeFileSync(
  out!,
  `<!doctype html><html><head><meta charset="utf-8"><style>${tokens}${css}
  body{margin:0;padding:16px;background:var(--bg);color:var(--text);font:12px sans-serif}
  .row{display:flex;gap:6px;margin-bottom:6px}.cell{display:flex;flex-direction:column;align-items:center}
  .cell span{opacity:.6}
  </style></head><body>${ids.map((id) => `<div class="row">${poses.map((p) => cell(id, p)).join("")}</div>`).join("")}</body></html>`,
);
