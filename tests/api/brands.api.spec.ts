import { test, expect } from '../../fixtures/base.fixture';
import { endpoints, products } from '../../data/testData';

test.describe('Brands API @api', () => {
  test('GET brandsList returns all brands', async ({ api }) => {
    const response = await api.get(endpoints.brandsList);
    expect(response.status()).toBe(200);

    const body = await api.expectResponseCode(response, 200);
    expect(Array.isArray(body.brands)).toBe(true);
    expect(body.brands.length).toBeGreaterThan(0);
  });

  test('known brands are present', async ({ api }) => {
    const response = await api.get(endpoints.brandsList);
    const body = await api.expectResponseCode(response, 200);

    const names = body.brands.map((brand: { brand: string }) => brand.brand);
    for (const expected of products.expectedBrands) {
      expect(names).toContain(expected);
    }
  });

  test('brand entries have a unique numeric id', async ({ api }) => {
    const response = await api.get(endpoints.brandsList);
    const body = await api.expectResponseCode(response, 200);

    const ids = body.brands.map((brand: { id: number }) => brand.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('PUT to brandsList is not supported', async ({ api }) => {
    const response = await api.put(endpoints.brandsList);
    const body = await api.expectResponseCode(response, 405);
    expect(body.message).toContain('not supported');
  });
});
