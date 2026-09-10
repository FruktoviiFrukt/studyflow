import { defineConfig, devices } from "@playwright/test";
import { STORAGE_STATE } from "./tests/e2e/storage-state";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [["list"], ["html", { open: "never" }]],
  use: { baseURL: "http://127.0.0.1:3100", trace: "retain-on-failure" },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], storageState: STORAGE_STATE },
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: "npm run start -- --hostname 127.0.0.1 --port 3100",
    url: "http://127.0.0.1:3100/auth",
    reuseExistingServer: false,
    timeout: 60_000,
    env: {
      // The e2e server is local only; a fixed secret and trusted host are fine here.
      AUTH_SECRET:
        process.env.AUTH_SECRET ?? "e2e-only-secret-not-for-production",
      AUTH_TRUST_HOST: "true",
    },
  },
});
