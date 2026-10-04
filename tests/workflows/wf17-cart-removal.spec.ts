import { test, expect, GUEST_SESSION, addProducts, buildCart } from '../../fixtures/workflow.fixture';
import { budgets, expectedText } from '../../config/test.config';
import { median } from '../../utils/browser.helper';

/**
 * WF-17 — Cart Item Removal.
 *
 * Rows are always resolved by product name, never by position index: an
 * index-based deletion silently removes the wrong row when the ordering
 * differs, and the test still passes.
 */
test.use({ storageState: GUEST_SESSION });

test.describe('WF-17 Cart Item Removal', () => {
  test('TC-W17-001 remove a single row and verify the correct row is removed @smoke @regression @cart @parallel-unsafe', async ({
    productsPage,
    cartModal,
    cartPage,
  }) => {
    await productsPage.open();
    const [first, second] = await addProducts(productsPage.grid, cartModal, [0, 1]);

    await cartPage.goto();
    const before = await cartPage.readRows();
    expect(before).toHaveLength(2);
    const survivor = before.find((row) => row.name === second.name);

    await cartPage.deleteRowByName(first.name);

    const after = await cartPage.readRows();
    expect(after).toHaveLength(1);
    expect(after[0].name).toBe(second.name);
    expect(after.map((r) => r.name)).not.toContain(first.name);
    expect(after[0].quantity, 'surviving row quantity').toBe(survivor?.quantity);
    expect(after[0].total, 'surviving row total').toBe(survivor?.total);
  });

  test('TC-W17-002 remove the last remaining row and verify the empty state @regression @cart @parallel-unsafe', async ({
    productsPage,
    cartModal,
    cartPage,
  }) => {
    await productsPage.open();
    const [product] = await addProducts(productsPage.grid, cartModal, [0]);

    await cartPage.goto();
    await cartPage.deleteRowByName(product.name);

    /* Wait for the empty block explicitly: the table re-renders
       asynchronously and an immediate count reads the pre-removal state. */
    await expect(cartPage.emptyBlock).toBeVisible();
    await expect(cartPage.emptyBlock).toContainText(expectedText.cartEmpty);
    await expect(cartPage.rows).toHaveCount(0);
  });

  test('TC-W17-003 remove every row in sequence from a multi-row cart @regression @cart @parallel-unsafe', async ({
    productsPage,
    cartModal,
    cartPage,
  }) => {
    /* Four or more cart mutations: each is a round trip plus a modal. */
    test.slow();
    await productsPage.open();
    await addProducts(productsPage.grid, cartModal, [0, 1, 2]);

    await cartPage.goto();
    let remaining = await cartPage.rowCount();
    expect(remaining).toBe(3);

    while (remaining > 0) {
      /* The row collection is re-resolved after every deletion: holding a
         stale collection across iterations is the classic cause of a stale
         element reference failure in a removal loop. */
      await cartPage.deleteFirstRow();
      const next = await cartPage.rowCount();
      expect(next, 'rows removed by a single deletion').toBe(remaining - 1);
      remaining = next;
    }

    await expect(cartPage.emptyBlock).toBeVisible();
  });

  test('TC-W17-004 a removal survives a page refresh @regression @cart @parallel-unsafe', async ({
    productsPage,
    cartModal,
    cartPage,
    page,
  }) => {
    await productsPage.open();
    const [first, second] = await addProducts(productsPage.grid, cartModal, [0, 1]);

    await cartPage.goto();
    await cartPage.deleteRowByName(first.name);

    /* The refresh is what distinguishes a genuine server-side removal from a
       purely client-side row hide. */
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(cartPage.table).toBeVisible();

    const rows = await cartPage.readRows();
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe(second.name);
    expect(rows.map((r) => r.name)).not.toContain(first.name);
  });

  test('TC-W17-005 browser back navigation does not restore a removed row @regression @cart @negative @parallel-unsafe', async ({
    productsPage,
    cartModal,
    cartPage,
    page,
  }) => {
    await productsPage.open();
    const [first, second] = await addProducts(productsPage.grid, cartModal, [0, 1]);

    await cartPage.goto();
    await cartPage.deleteRowByName(first.name);

    await page.goBack();
    /* The refresh after the back navigation is essential: a back navigation
       alone may legitimately render a cached page. */
    await page.reload({ waitUntil: 'domcontentloaded' });
    await cartPage.goto();

    const rows = await cartPage.readRows();
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe(second.name);
    expect(rows.map((r) => r.name), 'the deleted row was restored').not.toContain(first.name);
  });

  test('TC-W17-006 the removal action responds within the agreed budget @regression @performance @cart @parallel-unsafe', async ({
    productsPage,
    cartModal,
    cartPage,
  }) => {
    /* Four or more cart mutations: each is a round trip plus a modal. */
    test.slow();
    await buildCart(productsPage, cartModal, [1, 1, 1]);
    await cartPage.goto();

    const samples: number[] = [];
    for (let i = 0; i < 3; i++) {
      const started = Date.now();
      /* Measured to the staleness of the row — the first objective signal
         that the removal completed — not to an arbitrary visual cue. */
      await cartPage.deleteFirstRow();
      samples.push(Date.now() - started);
    }

    const middle = median(samples);
    await test.info().attach('cart-removal-ms', {
      body: 'samples=' + samples.join(',') + ' median=' + middle,
      contentType: 'text/plain',
    });

    expect(middle, 'median removal response').toBeLessThan(budgets.interactionMedianMs);
    expect(Math.max(...samples), 'slowest removal response').toBeLessThan(
      budgets.interactionMedianMs * 2,
    );
  });
});
