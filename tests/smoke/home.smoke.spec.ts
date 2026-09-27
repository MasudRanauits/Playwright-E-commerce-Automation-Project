import { test } from '../../fixtures/base.fixture';

/**
 * Smoke: the home page critical path only — it loads.
 * Needs no session, so the smoke run can skip auth.setup.ts entirely.
 */
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Home page @smoke', () => {
  test('loads with logo and featured products', async ({ homePage }) => {
    await homePage.goto();
    await homePage.expectLoaded();
  });
});
