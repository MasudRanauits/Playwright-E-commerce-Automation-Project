import { test, expect } from '../../fixtures/base.fixture';
import { endpoints, products } from '../../data/testData';

test.describe('Search API @api', () => {
  for (const term of products.searchTerms) {
    test(`searchProduct returns matches for "${term}"`, async ({ api }) => {
      const response = await api.post(endpoints.searchProduct, { search_product: term });
      const body = await api.expectResponseCode(response, 200);

      expect(Array.isArray(body.products)).toBe(true);

      for (const product of body.products) {
        const haystack = `${product.name} ${product.category.category}`.toLowerCase();
        expect(haystack).toContain(term.toLowerCase());
      }
    });
  }

  test('a term with no match returns an empty list', async ({ api }) => {
    const response = await api.post(endpoints.searchProduct, {
      search_product: products.noResultTerm,
    });
    const body = await api.expectResponseCode(response, 200);
    expect(body.products).toHaveLength(0);
  });

  test('missing search_product parameter is rejected', async ({ api }) => {
    const response = await api.post(endpoints.searchProduct);
    const body = await api.expectResponseCode(response, 400);
    expect(body.message).toContain('search_product');
  });
});
