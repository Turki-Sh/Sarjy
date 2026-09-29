// Which words of Sarjy's confirmation get the stitched underline when a fact is saved?
// The brand's example: "Saved. Your [favorite color is green]." From the label to the value.

const norm = (w: string) => w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");

function findRun(words: string[], phrase: string, from = 0): number {
  const target = phrase.split(/\s+/).map(norm).filter(Boolean);
  if (!target.length) return -1;
  for (let i = from; i + target.length <= words.length; i++) {
    if (target.every((t, j) => norm(words[i + j]!) === t)) return i;
  }
  return -1;
}

/** Word range (start inclusive, end exclusive) to stitch, or undefined if the fact isn't in the words. */
export function findKeep(
  words: string[],
  memory: { label: string; value: string },
): { start: number; end: number } | undefined {
  const valueAt = findRun(words, memory.value);
  if (valueAt < 0) return undefined;
  const valueEnd = valueAt + memory.value.split(/\s+/).filter(Boolean).length;
  const labelAt = findRun(words, memory.label);
  const start = labelAt >= 0 && labelAt < valueAt && valueAt - labelAt <= 6 ? labelAt : valueAt;
  return { start, end: valueEnd };
}
