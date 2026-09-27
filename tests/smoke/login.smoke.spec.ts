import { test, expect } from '../../fixtures/base.fixture';
import { users } from '../../data/testData';

/**
 * Smoke: the login critical path only — page renders, a real user can get in.
 * Runs signed out, so the stored session from auth.setup.ts is discarded.
 */
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Login @smoke', () => {
  test('TC_LOGIN_01 — login page shows email, password and Login button', async ({
    homePage,
    loginPage,
    page,
  }) => {
    await homePage.goto();
    await homePage.expectLoaded();

    // Hold on the home page as the manual script does, then enter via the nav link.
    await page.waitForTimeout(5_000);
    await homePage.goToSignupLogin();

    await expect(page).toHaveURL(/\/login/);
    await loginPage.expectLoaded();
  });

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

  test('TC_LOGIN_03 — invalid password is rejected', async ({ loginPage, homePage, env }) => {
    test.skip(!env.credentials.email, 'No account email configured');

    await loginPage.goto();
    await loginPage.login(env.credentials.email, users.login.wrongPassword);

    await loginPage.expectLoginFailed();
    await expect(homePage.loggedInAs).toHaveCount(0);
  });
});
