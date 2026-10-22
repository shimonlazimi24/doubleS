import { defineConfig, devices } from "@playwright/test";

/**
 * Accessibility audit (axe) against the dev server. The course pages need the
 * auth bypass + full access, so this config starts `next dev` with those env
 * vars on its own port instead of the production build the main config uses.
 *
 *   npm run test:a11y
 *   PLAYWRIGHT_BASE_URL=http://127.0.0.1:3458 npm run test:a11y   # reuse a running dev server
 */
const PORT = Number(process.env.A11Y_PORT ?? "3471");
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: /a11y\.spec\.ts/,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  timeout: 120_000,
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: `PREP_AUTH_BYPASS=1 NEXT_PUBLIC_PREP_HAS_FULL_ACCESS=1 npx next dev -p ${PORT}`,
        url: BASE_URL,
        reuseExistingServer: true,
        timeout: 240_000,
        stdout: "pipe",
        stderr: "pipe",
      },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
