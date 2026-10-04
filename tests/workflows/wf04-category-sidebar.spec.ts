import { test, expect, GUEST_SESSION } from '../../fixtures/workflow.fixture';
import { CategoryKey } from '../../pages/components/CategorySidebarComponent';
import { paths } from '../../data/locators';

/**
 * WF-04 — Category Sidebar Navigation.
 *
 * The assertions compare the selection with the result rather than with a
 * fixed product set, so a catalogue taxonomy change does not break the class.
 */
test.use({ storageState: GUEST_SESSION });

test.describe('WF-04 Category Sidebar Navigation', () => {
  test.beforeEach(async ({ homePage }) => {
    await homePage.open();
  });

  test('TC-W04-001 the category panel lists the three top-level categories @regression @ui', async ({
    homePage,
  }) => {
    await homePage.categories.panel.scrollIntoViewIfNeeded();
    await expect(homePage.categories.panel).toBeVisible();

    /* The panel renders the names upper-cased through CSS, so compare the
       labels case-insensitively rather than against the rendered casing. */
    const names = (await homePage.categories.topLevelNames()).map((name) => name.toLowerCase());
    expect(names).toEqual(['women', 'men', 'kids']);

    /* Asserted explicitly: a regression that renders every panel expanded
       changes the page height and silently breaks the scroll-dependent cases. */
    expect(await homePage.categories.expandedCount(), 'sub-category lists expanded on load').toBe(0);
  });

  test('TC-W04-002 a top-level category expands to reveal its sub-categories @regression', async ({
    homePage,
  }) => {
    await homePage.categories.expand('Women');

    await expect(homePage.categories.body('Women')).toBeVisible();

    const names = await homePage.categories.subCategoryNames('Women');
    expect(names.length, 'Women sub-categories').toBeGreaterThan(0);

    const hrefs = await homePage.categories.subCategoryHrefs('Women');
    for (const href of hrefs) {
      expect(href, 'sub-category href').toContain(paths.categoryProducts);
    }
  });

  test('TC-W04-003 a second category collapses the first @regression @ui', async ({ homePage }) => {
    await homePage.categories.expand('Women');
    await expect(homePage.categories.body('Women')).toBeVisible();

    await homePage.categories.header('Men').click();
    await expect(homePage.categories.body('Men')).toBeVisible();

    /* Accordion behaviour, not independent panels. */
    await expect(homePage.categories.body('Women')).toBeHidden();
  });

  /* One parameterised helper; the three cases differ only by their data row. */
  const categoryRows: Array<{ id: string; category: CategoryKey }> = [
    { id: 'TC-W04-004', category: 'Women' },
    { id: 'TC-W04-005', category: 'Men' },
    { id: 'TC-W04-006', category: 'Kids' },
  ];

  for (const row of categoryRows) {
    test(row.id + ' navigate to a ' + row.category + ' sub-category listing @regression @navigation', async ({
      homePage,
      productsPage,
      page,
    }) => {
      /* Read the sub-category at runtime instead of hard coding "Dress". */
      const subCategory = await homePage.categories.openFirstSubCategory(row.category);

      await expect(page).toHaveURL(new RegExp(paths.categoryProducts));

      const heading = (await productsPage.headingText()).toLowerCase();
      expect(heading, 'filtered listing heading').toContain(row.category.toLowerCase());
      expect(heading).toContain(subCategory.toLowerCase());

      const products = await productsPage.grid.captureAll();
      expect(products.length, 'products in the filtered listing').toBeGreaterThan(0);
      expect(
        products.filter((product) => !product.name).length,
        'cards with an empty product name',
      ).toBe(0);
    });
  }

  test('TC-W04-007 switching category filters replaces the previous result set @regression', async ({
    homePage,
    productsPage,
  }) => {
    await homePage.categories.openFirstSubCategory('Women');
    const womenNames = await productsPage.grid.names();
    expect(womenNames.length).toBeGreaterThan(0);

    await homePage.categories.openFirstSubCategory('Men');
    const menHeading = (await productsPage.headingText()).toLowerCase();
    const menNames = await productsPage.grid.names();

    expect(menHeading).toContain('men');
    expect(menNames).not.toEqual(womenNames);

    /* Catches the stale-render defect where the heading updates but the grid
       is not refreshed; a heading-only assertion would pass against that bug. */
    const carriedOver = menNames.filter((name) => womenNames.includes(name));
    expect(carriedOver, 'products carried over from the previous listing').toEqual([]);
  });
});
