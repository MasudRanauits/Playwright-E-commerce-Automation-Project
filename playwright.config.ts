import { defineConfig, devices } from '@playwright/test';
import env, { STORAGE_STATE } from './config/env.config';

/**
 * See https://playwright.dev/docs/test-configuration
 * Environment is selected with ENV=qa|staging|prod (default: qa).
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
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
      use: { ...devices['Desktop Chrome'], storageState: STORAGE_STATE },
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      testDir: './tests',
      testIgnore: /api[\\/]/,
      use: { ...devices['Desktop Firefox'], storageState: STORAGE_STATE },
      dependencies: ['setup'],
    },
    {
      name: 'webkit',
      testDir: './tests',
      testIgnore: /api[\\/]/,
      use: { ...devices['Desktop Safari'], storageState: STORAGE_STATE },
      dependencies: ['setup'],
    },

    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'], storageState: STORAGE_STATE },
    //   dependencies: ['setup'],
    // },
  ],
});
