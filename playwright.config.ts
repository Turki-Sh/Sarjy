import { defineConfig, devices } from "@playwright/test";

// E2E runs against a production build with fake providers, so it needs no keys or network.
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 30_000,
  // In CI, also write the HTML report so a failure can be inspected from the uploaded artifact.
  reporter: process.env.CI
    ? [["list"], ["html", { open: "never" }], ["json", { outputFile: "reports/playwright.json" }]]
    : "list",
  use: { baseURL: "http://localhost:3100", trace: "retain-on-failure" },
  webServer: {
    command: "pnpm build && pnpm start -p 3100",
    url: "http://localhost:3100",
    timeout: 180_000,
    reuseExistingServer: !process.env.CI,
    // The handbook key below opens /handbook in the tests only; it is not a secret. gitleaks:allow
    env: { SARJY_PROVIDERS: "fake", HANDBOOK_KEY: "e2e-handbook-key-0123456789" }, // gitleaks:allow
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
