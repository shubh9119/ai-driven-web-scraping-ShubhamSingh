// @ts-check
const { defineConfig, devices } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  // Default reporter is json (overridden per-run via PLAYWRIGHT_JSON_OUTPUT_NAME env var)
  reporter: [["json"], ["list"]],
  use: {
    baseURL: "https://demo.playwright.dev/todomvc/",
    trace: "off",
    screenshot: "only-on-failure",
    headless: true,
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
