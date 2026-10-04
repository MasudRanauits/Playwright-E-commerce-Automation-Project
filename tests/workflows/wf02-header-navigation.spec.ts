import { test, expect, GUEST_SESSION } from '../../fixtures/workflow.fixture';
import { expectedNav, viewports } from '../../config/test.config';
import { paths } from '../../data/locators';
import { hasHorizontalOverflow } from '../../utils/browser.helper';
import { clickAndWaitForUrl } from '../../utils/browser.helper';

/**
 * WF-02 — Header Navigation from Home.
 *
 * Every later workflow reaches its page through this header, so each
 * destination is proved here once.
 *
 * Not re-implemented, already covered:
 *   TC-W02-002 (header -> Products)        tests/smoke/products.smoke.spec.ts
 *                                          tests/regression/products.regression.spec.ts
 *   TC-W02-007 (active item marker)        tests/regression/products.regression.spec.ts
 */
test.use({ storageState: GUEST_SESSION });

test.describe('WF-02 Header Navigation from Home', () => {
  test.beforeEach(async ({ homePage }) => {
    await homePage.open();
  });

  test('TC-W02-001 the header exposes exactly the expected guest menu items @smoke @regression @navigation', async ({
    homePage,
  }) => {
    const items = await homePage.header.itemTexts();

    /* Assert on the set first, then on the ordering, so a reordering failure
       is distinguishable from a missing item. */
    for (const expectedItem of expectedNav) {
      expect(items, 'header items: ' + items.join(' | ')).toContain(expectedItem);
    }
    await homePage.header.expectGuestMenu();

    const ordered = items.filter((item) => (expectedNav as readonly string[]).includes(item));
    expect(ordered).toEqual(expectedNav.filter((item) => items.includes(item)));
  });

  test('TC-W02-003 navigate to the Cart page through the header @smoke @regression @navigation @cart', async ({
    homePage,
    cartPage,
    page,
  }) => {
    await homePage.header.goToCart();

    await expect(page).toHaveURL(new RegExp(paths.cart + '$'));

    /* Exactly one of the two states, never both and never neither — that is
       what catches the rendering bug where both blocks appear together. */
    const tableVisible = await cartPage.isTableVisible();
    const emptyVisible = await cartPage.isEmptyStateVisible();
    expect(
      [tableVisible, emptyVisible].filter(Boolean).length,
      'cart table visible=' + tableVisible + ', empty block visible=' + emptyVisible,
    ).toBe(1);
  });

  test('TC-W02-004 navigate to the Signup and Login page through the header @regression @navigation', async ({
    homePage,
    loginPage,
    page,
  }) => {
    await homePage.header.goToSignupLogin();

    await expect(page).toHaveURL(new RegExp(paths.login + '$'));
    /* Boundary only: the content of the login page belongs to the master document. */
    await expect(loginPage.emailInput).toBeAttached();
  });

  const informationalLinks = [
    { key: 'HDR_TEST_CASES', path: paths.testCases },
    { key: 'HDR_API_TESTING', path: paths.apiList },
    { key: 'HDR_CONTACT_US', path: paths.contactUs },
  ] as const;

  for (const row of informationalLinks) {
    test('TC-W02-005 header link ' + row.key + ' routes to ' + row.path + ' @regression @navigation @data', async ({
      page,
    }) => {
      const link = page.locator('.shop-menu .nav a[href="' + row.path + '"]');
      await clickAndWaitForUrl(page, link, new RegExp(row.path));

      await expect(page).toHaveURL(new RegExp(row.path + '$'));
      /* The destination renders its own heading rather than an error page. */
      await expect(page.locator('h2').first()).toBeVisible();
      /* Each row is independent because Playwright isolates the tests; no
         explicit return to the home page is needed between them. */
    });
  }

  test('TC-W02-006 the logo returns the user to the home page from another page @regression @navigation', async ({
    homePage,
    productsPage,
    page,
  }) => {
    await homePage.header.goToProducts();
    await productsPage.expectLoaded();

    await homePage.header.clickLogo();

    await expect(page).toHaveURL(/automationexercise\.com\/?$/);
    /* A URL check alone passes even when the body failed to render. */
    await expect(homePage.featuresTitle).toBeVisible();
  });

  test('TC-W02-008 the header renders and remains operable at mobile width @regression @ui', async ({
    homePage,
    productsPage,
    page,
  }) => {
    const original = page.viewportSize();
    try {
      await page.setViewportSize(viewports.mobile);
      await page.reload({ waitUntil: 'domcontentloaded' });

      await expect(homePage.header.nav).toBeAttached();
      await expect(homePage.header.products).toBeAttached();

      await homePage.header.goToProducts();
      await expect(productsPage.title).toBeVisible();

      /* The objective form of "no horizontal scrollbar". */
      expect(await hasHorizontalOverflow(page), 'document overflows horizontally').toBe(false);
    } finally {
      /* Restore so the next test starts from a known viewport. */
      await page.setViewportSize(original ?? viewports.desktop);
    }
  });
});
