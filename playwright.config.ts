import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.ts",
  workers: 1,
  reporter: "list",
  use: { headless: true },
  projects: [
    {
      name: "unconfigured",
      testMatch: ["**/home.spec.ts", "**/admin.spec.ts"],
      use: { baseURL: "http://127.0.0.1:3004" },
    },
    {
      name: "catalog-database",
      testMatch: ["**/catalog.spec.ts", "**/dashboard.spec.ts"],
      use: { baseURL: "http://127.0.0.1:3003" },
    },
  ],
  webServer: [
    {
      command: "node --import tsx tests/helpers/serve-catalog.ts empty",
      url: "http://127.0.0.1:3004/apps",
      reuseExistingServer: false,
      timeout: 120000,
    },
    {
      command: "node --import tsx tests/helpers/serve-catalog.ts catalog",
      url: "http://127.0.0.1:3003/apps",
      reuseExistingServer: false,
      timeout: 120000,
      stdout: "pipe",
    },
  ],
});
