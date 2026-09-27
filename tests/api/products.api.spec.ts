import { test, expect } from '../../fixtures/base.fixture';
import { endpoints } from '../../data/testData';

test.describe('Products API @api', () => {
  test('GET productsList returns the catalogue', async ({ api }) => {
    const response = await api.get(endpoints.productsList);
    expect(response.status()).toBe(200);

    const body = await api.expectResponseCode(response, 200);
    expect(Array.isArray(body.products)).toBe(true);
    expect(body.products.length).toBeGreaterThan(0);
  });

  test('every product carries id, name, price, brand and category', async ({ api }) => {
    const response = await api.get(endpoints.productsList);
    const body = await api.expectResponseCode(response, 200);

    for (const product of body.products.slice(0, 10)) {
      expect(product).toMatchObject({
        id: expect.any(Number),
        name: expect.any(String),
        price: expect.any(String),
        brand: expect.any(String),
      });
      expect(product.category).toHaveProperty('category');
      expect(product.category.usertype).toHaveProperty('usertype');
    }
  });

  test('POST to productsList is not supported', async ({ api }) => {
    const response = await api.post(endpoints.productsList);
    const body = await api.expectResponseCode(response, 405);
    expect(body.message).toContain('not supported');
  });
});
