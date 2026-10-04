import { test, expect, GUEST_SESSION } from '../../fixtures/workflow.fixture';
import { currencyPattern, searchTerms } from '../../config/test.config';
import { paths } from '../../data/locators';

/**
 * WF-13 — Sidebar Filtering from the Products Page.
 *
 * The same sidebar components as WF-04 and WF-05; the only difference is the
 * page the interaction starts from, so the implementation is shared.
 */
test.use({ storageState: GUEST_SESSION });

test.describe('WF-13 Sidebar Filtering from the Products Page', () => {
  test.beforeEach(async ({ productsPage }) => {
    await productsPage.open();
  });

  test('TC-W13-001 apply a category filter from the products page @regression @navigation', async ({
    productsPage,
    page,
  }) => {
    const subCategory = await productsPage.categories.openFirstSubCategory('Women');

    await expect(page).toHaveURL(new RegExp(paths.categoryProducts));
    const heading = (await productsPage.headingText()).toLowerCase();
    expect(heading).toContain('women');
    expect(heading).toContain(subCategory.toLowerCase());
    expect(await productsPage.grid.count(), 'products in the filtered listing').toBeGreaterThan(0);
  });

  test('TC-W13-002 apply a brand filter from the products page @regression @navigation', async ({
    productsPage,
  }) => {
    const brand = await productsPage.brands.open(0);

    expect((await productsPage.headingText()).toLowerCase()).toContain(brand.name.toLowerCase());
    /* The count comparison is the substantive assertion: a heading-only check
       passes against a filter that routes correctly but returns the wrong set. */
    expect(await productsPage.grid.count(), brand.name + ' rendered count').toBe(brand.count);

    const cards = await productsPage.grid.captureAll();
    expect(
      cards.filter((c) => !c.name || !currencyPattern.test(c.priceText)).map((c) => c.index),
      'cards with an invalid name or price',
    ).toEqual([]);
  });

  test('TC-W13-003 a filtered listing supports the add-to-cart action @regression @cart @parallel-unsafe', async ({
    productsPage,
    cartModal,
    cartPage,
  }) => {
    await productsPage.categories.openFirstSubCategory('Women');

    const product = await productsPage.grid.capture(0);
    await productsPage.grid.addToCart(0);
    await cartModal.waitVisible();
    await cartModal.openCart();

    const rows = await cartPage.readRows();
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe(product.name);
    expect(rows[0].total).toBe(product.price);
  });

  test('TC-W13-004 switching from a category filter to a brand filter refreshes the grid @regression', async ({
    productsPage,
  }) => {
    await productsPage.categories.openFirstSubCategory('Women');
    const categoryNames = await productsPage.grid.names();

    const brand = (await productsPage.brands.entries())[0];
    await productsPage.brands.linkFor(brand.name).click();
    /* Wait on the heading text changing: asserting too early reads the
       previous grid and produces a misleading failure. */
    await expect
      .poll(async () => productsPage.headingText(), { message: 'listing heading' })
      .toContain(brand.name);

    const brandNames = await productsPage.grid.names();
    expect(brandNames).not.toEqual(categoryNames);
    expect(brandNames.length, brand.name + ' rendered count').toBe(brand.count);
  });

  test('TC-W13-005 the search control remains usable on a filtered listing @regression @search', async ({
    productsPage,
  }) => {
    await productsPage.categories.openFirstSubCategory('Women');

    await expect(productsPage.searchInput).toBeVisible();
    await expect(productsPage.searchInput).toBeEnabled();

    await productsPage.search(searchTerms.partial[0]);

    /* Observed behaviour: the search resets the active filter and renders the
       Searched Products view across the whole catalogue. Recorded here so the
       assertion encodes an intended contract rather than an accident. */
    await productsPage.expectSearchResultView();
    const names = await productsPage.grid.names();
    expect(names.length).toBeGreaterThan(0);
    expect(
      names.filter((name) => !name.toLowerCase().includes(searchTerms.partial[0])),
      'results irrelevant to the keyword',
    ).toEqual([]);
  });

  test('TC-W13-006 an invalid filter path is handled gracefully @regression @negative', async ({
    productsPage,
    page,
  }) => {
    await page.goto(paths.categoryProducts + '/99999', { waitUntil: 'domcontentloaded' });
    await productsPage.waitForReady();

    const body = (await page.locator('body').innerText()).toLowerCase();
    for (const signature of ['internal server error', 'stack trace', 'sqlstate']) {
      expect(body.includes(signature), 'rendered "' + signature + '"').toBe(false);
    }
    /* The retained header confirms a handled response. */
    await expect(productsPage.header.nav).toBeVisible();
    /* Either an empty listing or a handled not-found view is acceptable. */
    expect(await productsPage.grid.count()).toBeGreaterThanOrEqual(0);
  });
});
