import { test, expect, GUEST_SESSION } from '../../fixtures/workflow.fixture';
import { budgets, currencyPattern, expectedText, viewports } from '../../config/test.config';
import { locators, paths } from '../../data/locators';
import {
  hasHorizontalOverflow,
  imageRequestCount,
  pageLoadDuration,
} from '../../utils/browser.helper';

/**
 * WF-09 — Products Page Load and Listing Structure.
 *
 * TC-W09-003 is the expected-value source for WF-10 and WF-11. Playwright
 * isolates each test, so rather than sharing mutable state between them each
 * downstream case re-captures the catalogue through the same component method.
 */
test.use({ storageState: GUEST_SESSION });

test.describe('WF-09 Products Page Load and Listing Structure', () => {
  test('TC-W09-001 open the products URL directly and confirm the listing renders @smoke @regression @navigation', async ({
    productsPage,
    page,
  }) => {
    await page.context().clearCookies();
    /* Direct navigation, not a click-through: a header defect then fails only
       WF-02 and not the whole products stage. */
    await productsPage.open();

    await expect(page).toHaveURL(new RegExp(paths.products + '/?$'));
    await expect(productsPage.title).toHaveText(new RegExp(expectedText.allProducts, 'i'));
    expect(await productsPage.grid.count(), 'product cards present').toBeGreaterThan(0);
  });

  test('TC-W09-002 the product grid is populated @smoke @regression @ui', async ({
    productsPage,
  }) => {
    await productsPage.open();

    const count = await productsPage.grid.count();
    expect(count, 'rendered product cards').toBeGreaterThan(0);
    /* Agreement between the two reads proves no card is excluded by a
       visibility fault. Never assert an absolute number here. */
    expect(await productsPage.grid.scriptedCount()).toBe(count);

    const cards = await productsPage.grid.captureAll();
    expect(cards.filter((card) => !card.name).length, 'empty placeholder cards').toBe(0);
  });

  test('TC-W09-003 capture and validate the complete product data set @smoke @regression @data', async ({
    productsPage,
  }) => {
    await productsPage.open();

    /* One scripted read replaces hundreds of individual round trips. */
    const catalogue = await productsPage.grid.captureAll();
    expect(catalogue.length, 'catalogue size').toBeGreaterThan(0);

    expect(catalogue.filter((p) => !p.name.trim()).map((p) => p.index), 'blank names').toEqual([]);
    expect(
      catalogue.filter((p) => !currencyPattern.test(p.priceText) || !(p.price > 0)).map((p) => p.name),
      'prices failing the currency pattern or not greater than zero',
    ).toEqual([]);
    expect(catalogue.filter((p) => p.imageWidth <= 0).map((p) => p.name), 'undecoded images').toEqual([]);

    const identities = catalogue.map((p) => p.name + '|' + p.priceText);
    expect(identities, 'duplicate name and price combinations').toHaveLength(new Set(identities).size);

    await test.info().attach('catalogue-size', {
      body: String(catalogue.length),
      contentType: 'text/plain',
    });
  });

  test('TC-W09-004 every card exposes both the add-to-cart and the view product action @regression @ui', async ({
    productsPage,
  }) => {
    await productsPage.open();
    const cards = await productsPage.grid.captureAll();

    expect(cards.filter((c) => !c.hasAddToCart).map((c) => c.name), 'no add-to-cart').toEqual([]);
    expect(cards.filter((c) => !c.href).map((c) => c.name), 'no view product link').toEqual([]);
    expect(
      cards.filter((c) => c.productId === null).map((c) => c.name + ' -> ' + c.href),
      'hrefs without a numeric identifier',
    ).toEqual([]);

    /* A duplicate identifier is invisible to a visual check and would later
       collapse two cart rows into one. */
    const ids = cards.map((c) => c.productId);
    expect(ids, 'duplicate product identifiers').toHaveLength(new Set(ids).size);
  });

  test('TC-W09-005 the hover overlay exposes the add-to-cart action @regression @ui', async ({
    productsPage,
  }) => {
    await productsPage.open();

    const card = productsPage.grid.card(0);
    await card.evaluate((el) => el.scrollIntoView({ block: 'center' }));
    await card.hover();

    const overlayAdd = card.locator(locators.PRD_CARD_OVERLAY_ADD).first();
    await expect(overlayAdd).toBeVisible();
    await expect(overlayAdd).toBeEnabled();
  });

  test('TC-W09-006 the catalogue sidebar renders on the products page @regression @ui', async ({
    homePage,
    productsPage,
  }) => {
    await homePage.open();
    const homeCategories = await homePage.categories.topLevelNames();
    const homeBrands = await homePage.brands.entries();

    await productsPage.open();

    /* Comparing against the home capture proves the component is genuinely
       shared rather than duplicated with drift. */
    await expect(productsPage.categoryPanel).toBeVisible();
    expect(await productsPage.categories.topLevelNames()).toEqual(homeCategories);
    expect(await productsPage.brands.entries()).toEqual(homeBrands);

    await productsPage.categories.expand('Women');
    await expect(productsPage.categories.body('Women')).toBeVisible();
  });

  test('TC-W09-007 the products page has no horizontal overflow at mobile width @regression @ui', async ({
    productsPage,
    page,
  }) => {
    await productsPage.open();
    const desktopCount = await productsPage.grid.count();
    const original = page.viewportSize();

    try {
      await page.setViewportSize(viewports.mobile);
      await page.reload({ waitUntil: 'domcontentloaded' });

      expect(await hasHorizontalOverflow(page), 'document overflows horizontally').toBe(false);
      /* Cards are reflowed, not dropped. */
      expect(await productsPage.grid.count(), 'cards at mobile width').toBe(desktopCount);
      await expect(
        productsPage.grid.card(0).locator(locators.PRD_CARD_ADD_TO_CART).first(),
      ).toBeEnabled();
    } finally {
      await page.setViewportSize(original ?? viewports.desktop);
    }
  });

  test('TC-W09-008 the products page load time is within the agreed budget @regression @performance', async ({
    productsPage,
    page,
  }) => {
    await page.context().clearCookies();
    await productsPage.open();
    /* This case measures the load event, so here it is waited for explicitly. */
    await page.waitForLoadState('load');

    const duration = await pageLoadDuration(page);
    const images = await imageRequestCount(page);

    await test.info().attach('products-page-load', {
      body: 'loadMs=' + Math.round(duration) + ' imageRequests=' + images,
      contentType: 'text/plain',
    });

    expect(duration, 'products page load duration in ms').toBeLessThan(budgets.pageLoadMs);
  });
});
