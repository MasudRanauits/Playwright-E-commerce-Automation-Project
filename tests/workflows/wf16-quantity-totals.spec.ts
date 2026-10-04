import { test, expect, GUEST_SESSION, buildCart, addSameProduct } from '../../fixtures/workflow.fixture';
import { currencyPattern } from '../../config/test.config';

/**
 * WF-16 — Quantity and Total Calculation.
 *
 * The highest-risk logic reachable from the three pages in scope, because an
 * error here silently corrupts the order value. Every value is parsed to a
 * number before it is compared: comparing formatted strings conflates a
 * formatting change with an arithmetic error.
 */
test.use({ storageState: GUEST_SESSION });

test.describe('WF-16 Quantity and Total Calculation', () => {
  test('TC-W16-001 the row total equals the unit price for a single-quantity row @smoke @regression @cart @parallel-unsafe', async ({
    productsPage,
    cartModal,
    cartPage,
  }) => {
    const [product] = await buildCart(productsPage, cartModal, [1]);

    await cartPage.goto();
    const [row] = await cartPage.readRows();

    expect(row.quantity).toBe(1);
    expect(row.price, 'unit price vs captured listing price').toBe(product.price);
    expect(row.total, 'total vs unit price times quantity').toBe(row.price * row.quantity);
    expect(currencyPattern.test(row.totalText), 'total currency format').toBe(true);
  });

  test('TC-W16-002 the row total scales correctly with an accumulated quantity @smoke @regression @cart @parallel-unsafe', async ({
    productsPage,
    cartModal,
    cartPage,
  }) => {
    await productsPage.open();
    const product = await addSameProduct(productsPage.grid, cartModal, 0, 3);

    await cartPage.goto();
    const rows = await cartPage.readRows();

    expect(rows).toHaveLength(1);
    expect(rows[0].quantity).toBe(3);
    expect(rows[0].total).toBe(product.price * 3);
    /* Catches the defect class where the stored unit price is multiplied
       instead of the displayed total, compounding on every further addition. */
    expect(rows[0].price, 'unit price after accumulation').toBe(product.price);
  });

  test('TC-W16-003 totals are independent across multiple rows @regression @cart @parallel-unsafe', async ({
    productsPage,
    cartModal,
    cartPage,
  }) => {
    /* Four or more cart mutations: each is a round trip plus a modal. */
    test.slow();
    const quantities = [1, 2, 3];
    const captured = await buildCart(productsPage, cartModal, quantities);

    await cartPage.goto();
    const rows = await cartPage.readRows();

    expect(rows).toHaveLength(3);

    /* Soft assertions so one run reports every incorrect row rather than
       stopping at the first mismatch. */
    for (let i = 0; i < captured.length; i++) {
      const product = captured[i];
      const row = rows.find((r) => r.name === product.name);
      expect.soft(row, 'row for ' + product.name).toBeTruthy();
      if (!row) continue;

      expect.soft(row.quantity, product.name + ' quantity').toBe(quantities[i]);
      expect.soft(row.price, product.name + ' unit price').toBe(product.price);
      expect.soft(row.total, product.name + ' total').toBe(product.price * quantities[i]);
    }
  });

  test('TC-W16-004 the quantity control reflects the accumulated value @regression @cart @parallel-unsafe', async ({
    productsPage,
    cartModal,
    cartPage,
  }) => {
    await productsPage.open();
    const product = await addSameProduct(productsPage.grid, cartModal, 0, 2);

    await cartPage.goto();
    const control = cartPage.rows.first().locator('.cart_quantity button');

    await expect(control).toHaveText('2');
    const [row] = await cartPage.readRows();
    expect(row.total, 'the displayed quantity is the one used in the total').toBe(
      row.price * 2,
    );

    /* Recorded contract: the quantity control on the cart page is a disabled
       display, not an editable field. */
    await expect(control).toHaveClass(/disabled/);
  });

  test('TC-W16-005 totals remain correct after a row is removed @regression @cart @parallel-unsafe', async ({
    productsPage,
    cartModal,
    cartPage,
  }) => {
    /* Four or more cart mutations: each is a round trip plus a modal. */
    test.slow();
    const captured = await buildCart(productsPage, cartModal, [1, 2, 3]);

    await cartPage.goto();
    /* Stored before the deletion so the comparison is against a captured
       truth rather than a recomputed one. */
    const before = await cartPage.readRows();
    expect(before).toHaveLength(3);

    const removed = captured[1];
    await cartPage.deleteRowByName(removed.name);

    const after = await cartPage.readRows();
    expect(after).toHaveLength(2);
    expect(after.map((r) => r.name)).not.toContain(removed.name);

    /* Catches the index-shift defect where a deletion reassigns values
       between the surviving rows. */
    for (const row of after) {
      const original = before.find((r) => r.name === row.name);
      expect.soft(row.quantity, row.name + ' quantity after deletion').toBe(original?.quantity);
      expect.soft(row.total, row.name + ' total after deletion').toBe(original?.total);
    }
  });

  test('TC-W16-006 the arithmetic holds for the highest and lowest priced products @regression @cart @data @parallel-unsafe', async ({
    productsPage,
    cartModal,
    cartPage,
  }) => {
    /* Four or more cart mutations: each is a round trip plus a modal. */
    test.slow();
    await productsPage.open();
    const catalogue = await productsPage.grid.captureAll();

    /* Resolved from the captured catalogue, never hard coded, so the case
       stays meaningful as the catalogue changes. */
    const sorted = [...catalogue].sort((a, b) => a.price - b.price);
    const cheapest = sorted[0];
    const dearest = sorted[sorted.length - 1];
    expect(cheapest.name, 'two distinct boundary products').not.toBe(dearest.name);

    await addSameProduct(productsPage.grid, cartModal, cheapest.index, 2);
    await addSameProduct(productsPage.grid, cartModal, dearest.index, 2);

    await cartPage.goto();
    const rows = await cartPage.readRows();
    expect(rows).toHaveLength(2);

    for (const product of [cheapest, dearest]) {
      const row = rows.find((r) => r.name === product.name);
      expect.soft(row?.quantity, product.name + ' quantity').toBe(2);
      expect.soft(row?.total, product.name + ' total').toBe(product.price * 2);
      /* No precision lost and nothing truncated in the rendering. */
      expect.soft(currencyPattern.test(row?.totalText ?? ''), product.name + ' total format').toBe(
        true,
      );
    }
  });
});
