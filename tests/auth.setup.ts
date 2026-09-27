import { test as setup, expect } from '@playwright/test';
import env, { STORAGE_STATE } from '../config/env.config';

/**
 * Runs once before the browser projects and saves a logged-in session,
 * so specs don't pay the login cost on every test.
 */
setup('authenticate', async ({ page }) => {
  const { email, password } = env.credentials;

  setup.skip(!email || !password, 'No credentials configured for this environment — set them in .env');

  await page.goto('/login');
  await page.locator('[data-qa="login-email"]').fill(email);
  await page.locator('[data-qa="login-password"]').fill(password);
  await page.locator('[data-qa="login-button"]').click();

  await expect(page.locator('li', { hasText: 'Logged in as' })).toBeVisible();

  await page.context().storageState({ path: STORAGE_STATE });
});
