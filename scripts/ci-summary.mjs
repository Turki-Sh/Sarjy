// Writes the test results as a readable table on the GitHub Actions run page (the job summary).
// Reads the JSON reports from Vitest (reports/vitest.json) and Playwright (reports/playwright.json).
// Locally it prints the same markdown to the terminal: node scripts/ci-summary.mjs

import { appendFileSync, existsSync, readFileSync } from "node:fs";

const read = (file) => (existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : null);
const icon = (ok) => (ok ? "✅" : "❌");
const lines = ["## Sarjy test suite", ""];

// Vitest: unit and integration tests, one row per file.
const vitest = read("reports/vitest.json");
if (vitest) {
  const files = vitest.testResults.map((f) => {
    const tests = f.assertionResults;
    const passed = tests.filter((t) => t.status === "passed").length;
    return { name: f.name.replace(/^.*?\/tests\//, "tests/"), tests, passed };
  });
  lines.push(
    `### Unit and integration (Vitest): ${vitest.numPassedTests} of ${vitest.numTotalTests} passed`,
    "",
    "| | File | Tests |",
    "|---|---|---|",
    ...files.map(
      (f) => `| ${icon(f.passed === f.tests.length)} | \`${f.name}\` | ${f.passed} / ${f.tests.length} |`,
    ),
    "",
    "<details><summary>Every test</summary>",
    "",
    ...files.flatMap((f) => [
      `**${f.name}**`,
      "",
      ...f.tests.map((t) => `- ${icon(t.status === "passed")} ${[...t.ancestorTitles, t.title].join(" › ")}`),
      "",
    ]),
    "</details>",
    "",
  );
}

// Playwright: end-to-end tests in a real browser.
const pw = read("reports/playwright.json");
if (pw) {
  const specs = [];
  const walk = (suite, file) => {
    for (const spec of suite.specs ?? []) {
      const ok = spec.tests.every((t) => t.results.at(-1)?.status === "passed");
      specs.push({ file: file ?? suite.file, title: spec.title, ok });
    }
    for (const child of suite.suites ?? []) walk(child, file ?? suite.file);
  };
  pw.suites.forEach((s) => walk(s));
  const passed = specs.filter((s) => s.ok).length;
  lines.push(
    `### End to end in Chromium (Playwright): ${passed} of ${specs.length} passed`,
    "",
    "| | File | Test |",
    "|---|---|---|",
    ...specs.map((s) => `| ${icon(s.ok)} | \`tests/e2e/${s.file}\` | ${s.title} |`),
    "",
    "The full browser report (with traces for any failure) is attached to this run as the `playwright-report` artifact.",
    "",
  );
}

const markdown = lines.join("\n");
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown);
else console.log(markdown);
