import { test, expect, GUEST_SESSION } from '../../fixtures/workflow.fixture';
import {
  expectedText,
  injectionPayload,
  scriptPayload,
  searchTerms,
  timeouts,
} from '../../config/test.config';
import { noDialogAppeared } from '../../utils/browser.helper';
import { irrelevantResults } from '../../utils/search.helper';

/**
 * WF-10 — Product Search.
 *
 * The assertions compare the query with the results, not with a fixed expected
 * set: every search term is either read from the catalogue at runtime or kept
 * in configuration, so a content change never fails these cases.
 */
test.use({ storageState: GUEST_SESSION });

test.describe('WF-10 Product Search', () => {
  test.beforeEach(async ({ productsPage }) => {
    await productsPage.open();
  });

  test('TC-W10-001 the search control renders on the products page @regression @ui', async ({
    productsPage,
  }) => {
    await expect(productsPage.searchInput).toBeVisible();
    await expect(productsPage.searchInput).toBeEnabled();
    /* Asserted explicitly: a retained value would silently corrupt every
       search case that follows in the same session. */
    await expect(productsPage.searchInput).toHaveValue('');

    await expect(productsPage.searchButton).toBeVisible();
    await expect(productsPage.searchButton).toBeEnabled();
    expect(await productsPage.searchInput.getAttribute('placeholder')).toBeTruthy();
  });

  test('TC-W10-002 search with an exact product name and verify the result @smoke @regression @search', async ({
    productsPage,
  }) => {
    /* The term comes from the catalogue, so the case is valid anywhere. */
    const target = (await productsPage.grid.captureAll())[0];

    await productsPage.search(target.name);

    await productsPage.expectSearchResultView();
    const names = await productsPage.grid.names();
    expect(names.length, 'results for an exact product name').toBeGreaterThan(0);
    expect(names).toContain(target.name);

    const term = target.name.toLowerCase();
    const irrelevant = names.filter((name) => !name.toLowerCase().includes(term));
    expect(irrelevant, 'results that do not contain the search term').toEqual([]);
  });

  for (const keyword of searchTerms.partial) {
    test('TC-W10-003 search "' + keyword + '" returns only relevant results @smoke @regression @search @data', async ({
      productsPage,
      api,
    }) => {
      await productsPage.search(keyword);
      await productsPage.expectSearchResultView();

      const names = await productsPage.grid.names();
      expect(names.length, 'results for "' + keyword + '"').toBeGreaterThan(0);

      /* Where a keyword matches by category rather than by name, the shared
         rule asserts against the name and the category together, never by
         relaxing the check to a mere non-empty result. */
      expect(
        await irrelevantResults(names, keyword, api),
        "results irrelevant to \"" + keyword + '"',
      ).toEqual([]);
    });
  }

  test('TC-W10-004 the search is case insensitive @regression @search', async ({
    productsPage,
  }) => {
    const sets: string[][] = [];

    for (const variant of searchTerms.caseVariants) {
      await productsPage.open();
      await productsPage.search(variant);
      sets.push(await productsPage.grid.names());
    }

    for (let i = 0; i < sets.length; i++) {
      expect(sets[i].length, 'results for "' + searchTerms.caseVariants[i] + '"').toBeGreaterThan(0);
    }
    /* Compared as sets: result ordering is not specified. */
    const asSet = (names: string[]) => [...names].sort();
    expect(asSet(sets[1])).toEqual(asSet(sets[0]));
    expect(asSet(sets[2])).toEqual(asSet(sets[0]));
  });

  test('TC-W10-005 leading and trailing whitespace is trimmed before searching @regression @search @negative', async ({
    productsPage,
  }) => {
    await productsPage.search(searchTerms.padded);
    const padded = await productsPage.grid.names();

    await productsPage.open();
    await productsPage.search(searchTerms.padded.trim());
    const plain = await productsPage.grid.names();

    /* If the padded search returns nothing the defect is in the server-side
       trimming; it must be logged, not worked around in the page object. */
    expect(padded.length, 'results for the padded term').toBeGreaterThan(0);
    expect(plain.length, 'results for the trimmed term').toBeGreaterThan(0);
    expect([...padded].sort()).toEqual([...plain].sort());
  });

  test('TC-W10-006 an unmatched keyword returns an empty result without an error @regression @search @negative', async ({
    productsPage,
    page,
  }) => {
    await productsPage.search(searchTerms.unmatched);

    await expect(productsPage.title).toHaveText(new RegExp(expectedText.searchedProducts, 'i'));
    expect(await productsPage.grid.count(), 'results for an unmatched keyword').toBe(0);

    const body = (await page.locator('body').innerText()).toLowerCase();
    expect(body.includes('internal server error'), 'server error in the body').toBe(false);

    /* A page that renders an empty state but destroys its own search control
       is a real defect a result-count assertion alone would miss. */
    await expect(productsPage.searchInput).toBeEnabled();
    await productsPage.search(searchTerms.partial[0]);
    expect(await productsPage.grid.count()).toBeGreaterThan(0);
  });

  test('TC-W10-007 an empty search submission is handled safely @regression @search @negative', async ({
    productsPage,
    page,
  }) => {
    await expect(productsPage.searchInput).toHaveValue('');

    await productsPage.searchButton.click();
    await page.waitForLoadState('domcontentloaded');

    /* Either documented outcome is accepted; only an error page or a broken
       layout fails the case. Pinning it to one behaviour would make this a
       change-detector rather than a defect-detector. */
    const body = (await page.locator('body').innerText()).toLowerCase();
    expect(body.includes('internal server error')).toBe(false);
    await expect(productsPage.title).toBeVisible();
    await expect(productsPage.searchInput).toBeEnabled();
  });

  test('TC-W10-008 a numeric search term is handled safely @regression @search @negative', async ({
    productsPage,
    page,
  }) => {
    await productsPage.search(searchTerms.numeric);

    await productsPage.expectSearchResultView();
    const body = (await page.locator('body').innerText()).toLowerCase();
    expect(body.includes('internal server error')).toBe(false);

    const names = await productsPage.grid.names();
    const irrelevant = names.filter((name) => !name.includes(searchTerms.numeric));
    expect(irrelevant, 'results not containing the numeric term').toEqual([]);
  });

  test('TC-W10-009 a special character search term is handled safely @regression @search @negative', async ({
    productsPage,
    page,
  }) => {
    await productsPage.search(searchTerms.special);

    await expect(productsPage.title).toBeVisible();
    const body = (await page.locator('body').innerText()).toLowerCase();
    expect(body.includes('internal server error')).toBe(false);

    /* Assert on the rendered DOM: a screenshot cannot distinguish escaped
       from unescaped output. */
    const injected = await page.locator('.features_items script').count();
    expect(injected, 'markup rendered unescaped from the search term').toBe(0);
  });

  test('TC-W10-010 a script payload in the search field is not executed @regression @search @negative @security', async ({
    productsPage,
    page,
  }) => {
    await productsPage.searchInput.fill(scriptPayload);
    await productsPage.searchButton.click();

    expect(await noDialogAppeared(page, timeouts.noAlert), 'a browser alert appeared').toBe(true);

    /* The absence of a script element created from the payload, not merely the
       absence of a dialog: a payload can be injected without firing one. */
    const injected = await page.locator('body script:has-text("alert(1)")').count();
    expect(injected, 'live script element created from the payload').toBe(0);
    await expect(productsPage.searchInput).toBeEnabled();
  });

  test('TC-W10-011 an injection payload does not disclose the catalogue @regression @search @negative @security', async ({
    productsPage,
    page,
  }) => {
    /* The full catalogue size, captured the same way WF-09 captures it. */
    const catalogueSize = await productsPage.grid.count();
    expect(catalogueSize).toBeGreaterThan(0);

    await productsPage.searchInput.fill(injectionPayload);
    await productsPage.searchButton.click();
    await page.waitForLoadState('domcontentloaded');

    const resultCount = await productsPage.grid.count();
    expect(resultCount, 'the always-true condition was evaluated').not.toBe(catalogueSize);

    const body = (await page.locator('body').innerText()).toLowerCase();
    for (const signature of ['sqlstate', 'sql syntax', 'mysqli', 'stack trace']) {
      expect(body.includes(signature), 'database error signature "' + signature + '"').toBe(false);
    }
    await expect(productsPage.title).toBeVisible();
  });

  test('TC-W10-012 a product can be added to the cart from the search results @regression @search @cart @parallel-unsafe', async ({
    productsPage,
    cartModal,
    cartPage,
  }) => {
    await productsPage.search(searchTerms.partial[0]);
    await productsPage.expectSearchResultView();

    const first = await productsPage.grid.capture(0);
    await productsPage.grid.addToCart(0);

    await cartModal.waitVisible();
    await expect(cartModal.title).toHaveText(new RegExp(expectedText.addedConfirmation, 'i'));
    await cartModal.openCart();

    const rows = await cartPage.readRows();
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe(first.name);
    expect(rows[0].total).toBe(first.price);
  });
});
