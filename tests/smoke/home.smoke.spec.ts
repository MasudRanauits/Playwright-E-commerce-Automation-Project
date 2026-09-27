import { test, expect } from '../../fixtures/base.fixture';

test.describe('Home page @smoke', () => {
  test.beforeEach(async ({ homePage }) => {
    await homePage.goto();
  });

  test('loads with logo and featured products', async ({ homePage }) => {
    await homePage.expectLoaded();
  });

  test('shows the account nav for a signed-in user', async ({ homePage, page, env }) => {
    test.skip(
      !env.credentials.email || !env.credentials.password,
      'No credentials configured — auth.setup.ts leaves the session anonymous',
    );

    await expect(homePage.logoutLink).toBeVisible();
    await expect(homePage.cartLink).toBeVisible();
    await expect(page).toHaveTitle(/Automation Exercise/i);
  });

  /** The public nav only renders without a session, so drop the stored one. */
  test.describe('signed out', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('shows the primary navigation links', async ({ homePage, page }) => {
      await expect(homePage.signupLoginLink).toBeVisible();
      await expect(homePage.cartLink).toBeVisible();
      await expect(page).toHaveTitle(/Automation Exercise/i);
    });
  });

  test('search box is usable', async ({ homePage, page }) => {
    await homePage.search('top');
    await expect(page.locator('.features_items')).toContainText('Searched Products');
  });
});
