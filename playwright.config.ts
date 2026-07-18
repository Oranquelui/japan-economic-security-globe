import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  outputDir: "test-results/prefecture-map",
  use: {
    baseURL: "http://127.0.0.1:3101",
    browserName: "chromium",
    trace: "retain-on-failure"
  },
  webServer: {
    command: "NEXT_PUBLIC_MAP_ACCEPTANCE_FIXTURES=1 npm run dev -- --hostname 127.0.0.1 --port 3101",
    url: "http://127.0.0.1:3101/?theme=rice&layer=rice-harvest",
    reuseExistingServer: false,
    timeout: 120_000
  }
});
