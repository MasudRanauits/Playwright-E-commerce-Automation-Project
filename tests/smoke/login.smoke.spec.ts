import { test, expect } from '../../fixtures/base.fixture';

/**
 * Smoke: the login critical path only — a real user can get in.
 * Runs signed out, so the stored session from auth.setup.ts is discarded.
 */
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Login @smoke', () => {
  test('TC_LOGIN_09 — valid credentials log the user in', async ({ loginPage, homePage, env }) => {
    test.skip(
      !env.credentials.email || !env.credentials.password,
      'No credentials configured — set QA_USER_EMAIL / QA_USER_PASSWORD in .env',
    );

    await loginPage.goto();
    await loginPage.login(env.credentials.email, env.credentials.password);

    await expect(homePage.loggedInAs).toBeVisible();
    await expect(homePage.logoutLink).toBeVisible();
    await expect(loginPage.page).toHaveURL(/automationexercise\.com\/?$/);
  });
});
