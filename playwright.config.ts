import { defineConfig, devices } from '@playwright/test';
import env, { STORAGE_STATE } from './config/env.config';

/**
 * See https://playwright.dev/docs/test-configuration
 * Environment is selected with ENV=qa|staging|prod (default: qa).
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  /* The target is a live public demo site; it drops requests under parallel load. */
  retries: process.env.CI ? 2 : 1,
  /**
   * Playwright's default (half the CPU cores) is memory-bound here, not CPU-bound:
   * this box has 12 cores but 4 GB of RAM, and 6 browsers OOM the machine.
   * Override with WORKERS=4 npm test on a larger machine.
   */
  workers: process.env.WORKERS ? Number(process.env.WORKERS) : 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },

  outputDir: './test-results',

  reporter: [
    ['list'],
    ['html', { outputFolder: './reports/html', open: 'never' }],
    ['json', { outputFile: './reports/results.json' }],
    ['junit', { outputFile: './reports/junit.xml' }],
  ],

  use: {
    baseURL: env.baseURL,
    headless: !!process.env.CI,
    /* Full-screen browser window; viewport: null lets the page fill it. */
    launchOptions: { args: ['--start-maximized'] },
    viewport: null,
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    /* API specs need no browser. */
    {
      name: 'api',
      testDir: './tests/api',
      use: { baseURL: env.apiURL },
    },

    /* Logs in once and stores the session for the UI projects. */
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },

    {
      name: 'chromium',
      testDir: './tests',
      testIgnore: /api[\\/]/,
      use: {
        ...devices['Desktop Chrome'],
        /* Fill the maximized window; deviceScaleFactor must go with the fixed viewport. */
        viewport: null,
        deviceScaleFactor: undefined,
        storageState: STORAGE_STATE,
      },
      dependencies: ['setup'],
    },
    // {
    //   name: 'firefox',
    //   testDir: './tests',
    //   testIgnore: /api[\\/]/,
    //   use: { ...devices['Desktop Firefox'], storageState: STORAGE_STATE },
    //   dependencies: ['setup'],
    // },
    // {
    //   name: 'webkit',
    //   testDir: './tests',
    //   testIgnore: /api[\\/]/,
    //   use: { ...devices['Desktop Safari'], storageState: STORAGE_STATE },
    //   dependencies: ['setup'],
    // },

    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'], storageState: STORAGE_STATE },
    //   dependencies: ['setup'],
    // },
  ],
});
