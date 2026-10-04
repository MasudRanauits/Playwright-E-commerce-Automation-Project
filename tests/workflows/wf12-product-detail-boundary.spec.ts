import { test, expect, GUEST_SESSION } from '../../fixtures/workflow.fixture';
import { searchTerms } from '../../config/test.config';
import { locators, paths } from '../../data/locators';
import { documentStatus } from '../../utils/browser.helper';

/**
 * WF-12 — Product Detail Transition Boundary.
 *
 * Only the boundary is asserted: the detail page itself is outside the scope
 * of this document, so nothing here duplicates what the master suite covers.
 */
test.use({ storageState: GUEST_SESSION });

test.describe('WF-12 Product Detail Transition Boundary', () => {
  test('TC-W12-001 every view product link exposes a valid product path @regression @navigation @data', async ({
    productsPage,
  }) => {
    await productsPage.open();

    const cards = await productsPage.grid.captureAll();
    const linkCount = await productsPage.page.locator(locators.PRD_VIEW_PRODUCT_LINKS).count();

    expect(linkCount, 'view product links vs product cards').toBe(cards.length);
    expect(
      cards.filter((c) => !/\/product_details\/\d+/.test(c.href)).map((c) => c.name),
      'hrefs not matching the product detail path',
    ).toEqual([]);
    expect(
      cards.filter((c) => (c.productId ?? 0) <= 0).map((c) => c.name),
      'identifiers that are not positive integers',
    ).toEqual([]);

    /* Validate every link statically and click only one: full coverage,
       low runtime. */
    const ids = cards.map((c) => c.productId);
    expect(ids, 'duplicate identifiers').toHaveLength(new Set(ids).size);
  });

  test('TC-W12-002 open the first product detail page and verify the boundary @smoke @regression @navigation', async ({
    productsPage,
    productDetailPage,
    page,
  }) => {
    await productsPage.open();
    const first = await productsPage.grid.capture(0);

    await productsPage.grid.openProduct(0);
    await page.waitForURL(new RegExp('/product_details/' + first.productId));

    /* Comparing name and price across the transition is the real value here:
       a URL assertion alone passes when the wrong product is rendered. */
    await expect(productDetailPage.name).toContainText(first.name);
    expect(await productDetailPage.renderedPrice(), 'detail page price').toBe(first.price);
  });

  test('TC-W12-003 browser back navigation returns to the intact listing @regression @navigation', async ({
    productsPage,
    page,
  }) => {
    await productsPage.open();
    const before = await productsPage.grid.captureAll();

    await productsPage.grid.openProduct(0);
    await page.waitForURL(/\/product_details\/\d+/);

    await page.goBack();
    /* A back navigation may be served from the cache; wait for a listing
       element before reading anything. */
    await expect(productsPage.title).toBeVisible();

    await expect(page).toHaveURL(new RegExp(paths.products + '/?$'));
    const after = await productsPage.grid.captureAll();
    expect(after.map((p) => p.name + '|' + p.priceText)).toEqual(
      before.map((p) => p.name + '|' + p.priceText),
    );
    await expect(
      productsPage.grid.card(0).locator(locators.PRD_CARD_ADD_TO_CART).first(),
    ).toBeEnabled();
  });

  test('TC-W12-004 the detail transition from a search result preserves the identity @regression @navigation @search', async ({
    productsPage,
    productDetailPage,
    page,
  }) => {
    await productsPage.open();
    await productsPage.search(searchTerms.partial[0]);
    await productsPage.expectSearchResultView();

    const first = await productsPage.grid.capture(0);
    await productsPage.grid.openProduct(0);
    await page.waitForURL(/\/product_details\/\d+/);

    /* Covering the filtered context guards against the identifier being taken
       from the unfiltered grid position rather than from the rendered card. */
    await expect(page).toHaveURL(new RegExp('/product_details/' + first.productId));
    await expect(productDetailPage.name).toContainText(first.name);

    const body = (await page.locator('body').innerText()).toLowerCase();
    expect(body.includes('internal server error')).toBe(false);
  });

  test('TC-W12-005 an invalid product identifier is handled gracefully @regression @negative', async ({
    productDetailPage,
    homePage,
    page,
    env,
  }) => {
    const target = paths.productDetail + '/99999999';
    await page.goto(target, { waitUntil: 'domcontentloaded' });
    await productDetailPage.waitForReady();

    const body = (await page.locator('body').innerText()).toLowerCase();
    for (const signature of ['internal server error', 'stack trace', 'sqlstate', 'mysqli']) {
      expect(body.includes(signature), 'rendered "' + signature + '"').toBe(false);
    }
    /* The header surviving is what proves this is a handled application
       response rather than a raw error. */
    await expect(homePage.header.nav).toBeVisible();

    /* Playwright does not expose the document status of a navigation, so read
       it with a direct request alongside it. */
    const status = await documentStatus(page, env.baseURL.replace(/\/$/, '') + target);
    expect(status, 'document status for an impossible identifier').toBeLessThan(500);
  });
});
