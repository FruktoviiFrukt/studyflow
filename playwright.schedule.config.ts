import { defineConfig, devices } from "@playwright/test";

// Isolated UI contract tests: signed test session, intercepted schedule API, no DB.
export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "schedule-api-ui.spec.ts",
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3102",
    ...devices["Desktop Chrome"],
    channel: "chrome",
    trace: "retain-on-failure",
  },
  webServer: {
    command:
      "node node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 3102",
    url: "http://127.0.0.1:3102/auth",
    reuseExistingServer: false,
    timeout: 120000,
    env: {
      // auth.ts sets trustHost: true, so AUTH_TRUST_HOST is not needed.
      AUTH_SECRET: "schedule-ui-test-secret-only",
    },
  },
});
