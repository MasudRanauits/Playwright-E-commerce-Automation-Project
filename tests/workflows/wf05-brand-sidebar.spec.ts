import { test, expect, GUEST_SESSION } from '../../fixtures/workflow.fixture';
import { paths } from '../../data/locators';

/**
 * WF-05 — Brand Sidebar Navigation.
 *
 * Every brand name is read at runtime; none is ever hard coded, because the
 * brand list does change on a shared environment.
 */
test.use({ storageState: GUEST_SESSION });

test.describe('WF-05 Brand Sidebar Navigation', () => {
  test.beforeEach(async ({ homePage }) => {
    await homePage.open();
    await homePage.brands.panel.scrollIntoViewIfNeeded();
  });

  test('TC-W05-001 the brand panel renders a non-empty brand list with counts @regression @ui', async ({
    homePage,
  }) => {
    await expect(homePage.brands.panel).toBeVisible();

    const brands = await homePage.brands.entries();
    expect(brands.length, 'brands listed').toBeGreaterThan(0);

    expect(
      brands.filter((brand) => !brand.name).length,
      'brands with an empty name',
    ).toBe(0);
    for (const brand of brands) {
      expect(Number.isInteger(brand.count) && brand.count >= 0, brand.name + ' count').toBe(true);
    }

    /* A duplicate brand is a data defect no visual review reliably spots. */
    const names = brands.map((brand) => brand.name);
    expect(names, 'duplicate brand names').toHaveLength(new Set(names).size);
  });

  test('TC-W05-002 a brand listing heading matches the brand @regression @navigation', async ({
    homePage,
    productsPage,
    page,
  }) => {
    const brand = await homePage.brands.open(0);

    await expect(page).toHaveURL(new RegExp(paths.brandProducts));
    expect((await productsPage.headingText()).toLowerCase()).toContain(brand.name.toLowerCase());
    expect(await productsPage.grid.count(), 'products in the brand listing').toBeGreaterThan(0);
  });

  test('TC-W05-003 the rendered product count matches the sidebar count @regression @data', async ({
    homePage,
    productsPage,
  }) => {
    const brands = (await homePage.brands.entries()).slice(0, 3);
    const mismatches: string[] = [];

    for (const brand of brands) {
      await homePage.open();
      await homePage.brands.panel.scrollIntoViewIfNeeded();
      await homePage.brands.linkFor(brand.name).click();
      await productsPage.page.waitForURL(new RegExp(paths.brandProducts));

      const rendered = await productsPage.grid.count();
      if (rendered !== brand.count) {
        mismatches.push(brand.name + ': sidebar=' + brand.count + ', rendered=' + rendered);
      }
    }

    expect(mismatches, 'brand count mismatches').toEqual([]);
  });

  test('TC-W05-004 switching brands replaces the previous result set @regression', async ({
    homePage,
    productsPage,
  }) => {
    const brands = await homePage.brands.entries();
    expect(brands.length, 'at least two brands are needed').toBeGreaterThan(1);

    const first = await homePage.brands.open(0);
    const firstNames = await productsPage.grid.names();

    const second = brands[1];
    await productsPage.brands.linkFor(second.name).click();
    /* Wait on the heading text changing, not on a fixed interval. */
    await expect
      .poll(async () => productsPage.headingText(), { message: 'listing heading' })
      .toContain(second.name);

    const secondNames = await productsPage.grid.names();
    expect(secondNames, 'result set after switching brand').not.toEqual(firstNames);
    expect(secondNames.length, second.name + ' rendered count').toBe(second.count);
    expect(first.name).not.toBe(second.name);
  });

  test('TC-W05-005 the brand panel remains usable on a filtered listing @regression @ui', async ({
    homePage,
    productsPage,
  }) => {
    const onHome = await homePage.brands.entries();
    await homePage.brands.open(0);

    await expect(productsPage.brands.panel).toBeVisible();
    /* The same component, not a duplicate that has drifted. */
    expect(await productsPage.brands.entries()).toEqual(onHome);

    const target = onHome[onHome.length - 1];
    await productsPage.brands.linkFor(target.name).click();
    await expect
      .poll(async () => productsPage.headingText(), { message: 'listing heading' })
      .toContain(target.name);
  });
});
