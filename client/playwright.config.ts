import { defineConfig, devices } from "@playwright/test";

const API_PORT = 3100;
const WEB_PORT = 5174;

// Starts both apps against a separate, freshly seeded database (storage/e2e.sqlite3),
// so end-to-end runs never touch development data.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: `cd ../server && bin/rails db:prepare db:seed && bin/rails server -p ${API_PORT}`,
      url: `http://localhost:${API_PORT}/up`,
      env: {
        DATABASE_PATH: "storage/e2e.sqlite3",
        CORS_ALLOWED_ORIGINS: `http://localhost:${WEB_PORT}`,
        LOG_LEVEL: "warn",
      },
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: `npx vite --port ${WEB_PORT} --strictPort`,
      url: `http://localhost:${WEB_PORT}`,
      env: { VITE_API_URL: `http://localhost:${API_PORT}/graphql` },
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
});
