import { defineConfig } from "@playwright/test";
const database = process.env.IMPORT_TEST_DATABASE_URL;
if (
  !database ||
  !new URL(database).pathname.startsWith("/studyflow_import_test_")
)
  throw new Error(
    "Set IMPORT_TEST_DATABASE_URL to an isolated studyflow_import_test_* database with migrations applied.",
  );
export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "admin-import.spec.ts",
  workers: 1,
  timeout: 180000,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3103",
    channel: "chrome",
    trace: "retain-on-failure",
  },
  webServer: {
    command:
      "node node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 3103",
    url: "http://127.0.0.1:3103/auth",
    timeout: 120000,
    reuseExistingServer: false,
    env: {
      DATABASE_URL: database,
      // auth.ts sets trustHost: true, so AUTH_TRUST_HOST is not needed.
      AUTH_SECRET: "import-test-secret-only",
      SCHEDULE_PYTHON: process.env.SCHEDULE_PYTHON || "python",
      SCHEDULE_UPLOAD_DIR: ".review-output/import-test-pdfs",
    },
  },
});
