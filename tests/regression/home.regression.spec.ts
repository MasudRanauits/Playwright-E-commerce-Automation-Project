import { test, expect } from '../../fixtures/base.fixture';
import { endpoints, products } from '../../data/testData';
import { randomEmail, scrollToBottom } from '../../utils/common.helper';

test.describe('Home page @regression', () => {
  test.beforeEach(async ({ homePage }) => {
    await homePage.goto();
  });

  test('lists every top-level category', async ({ homePage }) => {
    for (const category of products.expectedCategories) {
      await expect(homePage.categoryPanel).toContainText(category);
    }
  });

  test('renders at least one featured product with a price', async ({ homePage }) => {
    const first = homePage.featuredProducts.first();
    await expect(first).toBeVisible();
    await expect(first.locator('.productinfo h2')).toContainText('Rs.');
  });

  test('search results match the search API for the same term', async ({ homePage, page, api }) => {
    const term = 'dress';
    await homePage.search(term);

    await expect(homePage.featuredProducts.first()).toBeVisible();
    const uiNames = (await homePage.productNames()).sort();

    const response = await api.post(endpoints.searchProduct, { search_product: term });
    const body = await api.expectResponseCode(response, 200);
    const apiNames = body.products
      .map((p: { name: string }) => p.name.replace(/\s+/g, ' ').trim())
      .sort();

    expect(uiNames.length).toBeGreaterThan(0);
    expect(uiNames).toEqual(apiNames);
  });

  test('search with no match shows an empty result set', async ({ homePage, page }) => {
    await homePage.search(products.noResultTerm);
    await expect(page.locator('.features_items .product-image-wrapper')).toHaveCount(0);
  });

  test('newsletter subscription is confirmed', async ({ homePage, page }) => {
    await scrollToBottom(page);
    await homePage.subscribe(randomEmail());
    await expect(homePage.subscribeSuccess).toBeVisible();
  });

  test('scroll-up control returns to the top', async ({ homePage, page }) => {
    await scrollToBottom(page);
    await homePage.scrollUpButton.click();
    await expect(homePage.logo).toBeInViewport();
  });
});
