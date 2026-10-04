import { ApiHelper } from './api.helper';
import { endpoints } from '../data/testData';

/**
 * The relevance rule the search cases share.
 *
 * A keyword can match a product by its name or by its category — "top"
 * returns shirts filed under Tops. Asserting on the name alone would report
 * a defect for behaviour the document explicitly allows (TC-W10-003), so the
 * category comes from the search API for the same keyword, which is the only
 * place the listing card does not render it.
 *
 * Returns the names that match neither, i.e. the genuinely irrelevant ones.
 */
export async function irrelevantResults(
  names: string[],
  keyword: string,
  api: ApiHelper,
): Promise<string[]> {
  const term = keyword.toLowerCase();
  const unmatchedByName = names.filter((name) => !name.toLowerCase().includes(term));
  if (unmatchedByName.length === 0) return [];

  const response = await api.post(endpoints.searchProduct, { search_product: keyword });
  const body = await api.expectResponseCode(response, 200);

  const categoryOf = new Map<string, string>(
    (body.products ?? []).map((product: { name: string; category?: { category?: string } }) => [
      product.name.replace(/\s+/g, ' ').trim(),
      (product.category?.category ?? '').toLowerCase(),
    ]),
  );

  return unmatchedByName.filter((name) => !(categoryOf.get(name) ?? '').includes(term));
}
