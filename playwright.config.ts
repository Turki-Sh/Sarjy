import { defineConfig, devices } from "@playwright/test";

// E2E runs against a production build with fake providers, so it needs no keys or network.
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 30_000,
  // In CI, also write the HTML report so a failure can be inspected from the uploaded artifact.
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: { baseURL: "http://localhost:3100", trace: "retain-on-failure" },
  webServer: {
    command: "pnpm build && pnpm start -p 3100",
    url: "http://localhost:3100",
    timeout: 180_000,
    reuseExistingServer: !process.env.CI,
    env: { SARJY_PROVIDERS: "fake" },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
