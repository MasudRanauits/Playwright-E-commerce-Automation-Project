import { test, expect, GUEST_SESSION } from '../../fixtures/workflow.fixture';
import { budgets, expectedText } from '../../config/test.config';
import {
  expectNoServerError,
  formatConsoleEntries,
  naturalWidth,
  naturalWidths,
  pageLoadDuration,
} from '../../utils/browser.helper';

/**
 * WF-01 — Launch and Home Page Load.
 *
 * The gate for the whole run: it establishes that the application is reachable
 * and that the home page rendered completely, so every later workflow can rely
 * on a known good starting state.
 */
test.use({ storageState: GUEST_SESSION });

test.describe('WF-01 Launch and Home Page Load', () => {
  test('TC-W01-001 open the base URL and confirm the home page renders @smoke @regression @navigation', async ({
    homePage,
    page,
    env,
  }) => {
    await page.context().clearCookies();
    await homePage.open();

    const resolved = new URL(page.url());
    expect(resolved.origin + resolved.pathname.replace(/\/$/, '')).toBe(
      env.baseURL.replace(/\/$/, ''),
    );
    expect(resolved.protocol).toBe('https:');
    await expect(page).toHaveTitle(new RegExp(expectedText.homeTitle, 'i'));
    await expect(homePage.featuresTitle).toBeVisible();
    await expectNoServerError(page);
  });

  test('TC-W01-002 confirm the three structural regions are present @smoke @regression @ui', async ({
    homePage,
  }) => {
    await homePage.open();

    /* Soft so that one run reports every missing region, not just the first. */
    expect.soft(await homePage.header.navItems.count()).toBeGreaterThan(0);
    await expect.soft(homePage.header.nav).toBeVisible();
    await expect.soft(homePage.slider.root).toBeVisible();

    /* The footer is below the fold at every supported resolution. */
    await homePage.subscription.reveal();
    await expect.soft(homePage.subscription.title).toBeVisible();
  });

  test('TC-W01-003 the logo is rendered and its image actually decoded @regression @ui', async ({
    homePage,
  }) => {
    await homePage.open();

    await expect(homePage.logo).toBeVisible();
    await expect(homePage.logo).not.toHaveAttribute('src', '');

    /* A displayed check alone passes for an image that failed to load. */
    expect(await naturalWidth(homePage.logo)).toBeGreaterThan(0);
  });

  test('TC-W01-004 no product card on the home page has a broken image @regression @ui', async ({
    homePage,
  }) => {
    await homePage.open();

    const cards = await homePage.grid.captureAll();
    expect(cards.length, 'features grid is empty').toBeGreaterThan(0);

    const missingImage = cards.filter((card) => !card.imageSrc);
    expect(missingImage.map((c) => c.name), 'cards without an image element').toEqual([]);

    const broken = cards.filter((card) => card.imageWidth <= 0);
    expect(
      broken.map((card) => card.name),
      'products whose image failed to decode',
    ).toEqual([]);
  });

  test('TC-W01-005 the browser console is free of application errors on load @regression', async ({
    homePage,
    consoleErrors,
  }) => {
    await homePage.open();

    const errors = consoleErrors.applicationErrors();
    expect(errors, 'severe console entries:\n' + formatConsoleEntries(errors)).toHaveLength(0);
  });

  test('TC-W01-006 the home page load time is within the agreed budget @regression @performance', async ({
    homePage,
  }) => {
    await homePage.open();
    /* This case measures the load event, so here it is waited for explicitly. */
    await homePage.page.waitForLoadState('load');

    const duration = await pageLoadDuration(homePage.page);
    /* Recorded every run so a regression shows up as a trend, not one failure. */
    await test.info().attach('home-page-load-ms', {
      body: String(Math.round(duration)),
      contentType: 'text/plain',
    });

    expect(duration, 'home page load duration in ms').toBeLessThan(budgets.pageLoadMs);
  });
});
