import { defineConfig, devices } from "@playwright/test";

// Frontend-only admin prototype: no database or auth fixtures are needed.
export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "admin-schedule.spec.ts",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: { baseURL: "http://127.0.0.1:3101", trace: "retain-on-failure" },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        channel: process.env.PLAYWRIGHT_CHANNEL,
      },
    },
  ],
  webServer: {
    command:
      "node node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 3101",
    url: "http://127.0.0.1:3101/admin/schedule",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
