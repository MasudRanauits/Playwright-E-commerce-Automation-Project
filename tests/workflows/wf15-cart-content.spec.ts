import { test, expect, GUEST_SESSION, addProducts } from '../../fixtures/workflow.fixture';
import { currencyPattern, expectedCartColumns, viewports } from '../../config/test.config';
import { formatConsoleEntries } from '../../utils/browser.helper';
import { blockAds } from '../../utils/common.helper';
import { CartPage } from '../../pages/CartPage';

/**
 * WF-15 — Cart Content Verification.
 *
 * The whole value of this workflow rests on comparing against values captured
 * from the listing rather than against literals. No product name is ever hard
 * coded in a cart assertion.
 */
test.use({ storageState: GUEST_SESSION });

test.describe('WF-15 Cart Content Verification', () => {
  test('TC-W15-001 the cart table renders the expected column structure @regression @ui @cart', async ({
    productsPage,
    cartModal,
    cartPage,
  }) => {
    await productsPage.open();
    await addProducts(productsPage.grid, cartModal, [0]);
    await cartPage.goto();

    await expect(cartPage.table).toBeVisible();
    const headers = await cartPage.headerTexts();

    for (const column of expectedCartColumns) {
      expect(headers, 'cart columns: ' + headers.join(' | ')).toContain(column);
    }
    const ordered = headers.filter((h) => (expectedCartColumns as readonly string[]).includes(h));
    expect(ordered, 'column order').toEqual([...expectedCartColumns]);

    /* The cell-count comparison catches a colspan defect that misaligns the
       whole table while every individual heading assertion still passes. */
    const rows = await cartPage.readRows();
    for (const row of rows) {
      expect(row.cellCount, row.name + ' cells vs header cells').toBe(headers.length);
    }
  });

  test('TC-W15-002 a single added product is rendered with its captured identity @smoke @regression @cart @parallel-unsafe', async ({
    productsPage,
    cartModal,
    cartPage,
  }) => {
    await productsPage.open();
    const [product] = await addProducts(productsPage.grid, cartModal, [0]);

    await cartPage.goto();
    const rows = await cartPage.readRows();

    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe(product.name);
    expect(rows[0].price).toBe(product.price);
    expect(rows[0].quantity).toBe(1);
    expect(rows[0].total).toBe(product.price);
  });

  test('TC-W15-003 every cart row exposes a complete data set @regression @ui @cart @parallel-unsafe', async ({
    productsPage,
    cartModal,
    cartPage,
  }) => {
    /* Four or more cart mutations: each is a round trip plus a modal. */
    test.slow();
    await productsPage.open();
    await addProducts(productsPage.grid, cartModal, [0, 1, 2]);

    await cartPage.goto();
    /* One scripted read of the whole table: faster, and it cannot catch a
       half-updated table mid-render. */
    const rows = await cartPage.readRows();

    expect(rows).toHaveLength(3);
    expect(rows.filter((r) => !r.name).length, 'rows without a name').toBe(0);
    expect(rows.filter((r) => r.imageWidth <= 0).map((r) => r.name), 'undecoded row images').toEqual([]);
    expect(rows.filter((r) => !r.category).map((r) => r.name), 'rows without a category').toEqual([]);
    expect(
      rows.filter((r) => !currencyPattern.test(r.priceText) || !currencyPattern.test(r.totalText)),
      'rows whose price or total fails the currency pattern',
    ).toEqual([]);
    expect(
      rows.filter((r) => !Number.isInteger(r.quantity) || r.quantity <= 0).map((r) => r.name),
      'rows without a positive integer quantity',
    ).toEqual([]);
  });

  test('TC-W15-004 three distinct products produce three independent rows @regression @cart @parallel-unsafe', async ({
    productsPage,
    cartModal,
    cartPage,
  }) => {
    /* Four or more cart mutations: each is a round trip plus a modal. */
    test.slow();
    await productsPage.open();
    const captured = await addProducts(productsPage.grid, cartModal, [0, 1, 2]);

    await cartPage.goto();
    const rows = await cartPage.readRows();

    expect(rows).toHaveLength(3);
    /* Compared as sets: the cart row ordering is not specified. */
    expect(rows.map((r) => r.name).sort()).toEqual(captured.map((p) => p.name).sort());
    for (const row of rows) {
      expect(row.quantity, row.name + ' quantity').toBe(1);
      expect(row.total, row.name + ' total').toBe(
        captured.find((p) => p.name === row.name)?.price,
      );
    }
  });

  test('TC-W15-005 the cart row unit price matches the listing price exactly @regression @cart @data @parallel-unsafe', async ({
    productsPage,
    cartModal,
    cartPage,
  }) => {
    await productsPage.open();
    const captured = await addProducts(productsPage.grid, cartModal, [0, 1]);

    await cartPage.goto();
    const rows = await cartPage.readRows();

    const mismatches: string[] = [];
    for (const row of rows) {
      const source = captured.find((p) => p.name === row.name);
      /* Both parsed to numbers first, so a thousands separator is reported as
         a formatting defect rather than as a price mismatch. */
      if (source && row.price !== source.price) {
        mismatches.push(row.name + ': listing=' + source.price + ', cart=' + row.price);
      }
      if (source && row.priceText !== source.priceText) {
        mismatches.push(
          row.name + ': format listing="' + source.priceText + '", cart="' + row.priceText + '"',
        );
      }
    }
    expect(mismatches, 'price mismatches between the listing and the cart').toEqual([]);
  });

  test('TC-W15-006 the cart row links back to the correct product @regression @navigation @cart @parallel-unsafe', async ({
    productsPage,
    productDetailPage,
    cartModal,
    cartPage,
    page,
  }) => {
    await productsPage.open();
    const [product] = await addProducts(productsPage.grid, cartModal, [0]);

    await cartPage.goto();
    const [row] = await cartPage.readRows();

    /* Asserted on the identifier, not on the name: the path is identifier
       based, so a name comparison would be comparing the wrong thing. */
    expect(row.href).toContain('/product_details/' + product.productId);

    await cartPage.rowByName(product.name).locator('h4 a').click();
    await page.waitForURL(/\/product_details\/\d+/);
    await expect(productDetailPage.name).toContainText(product.name);
  });

  test('TC-W15-007 the cart renders a larger set of products without structural failure @regression @cart @parallel-unsafe', async ({
    productsPage,
    cartModal,
    cartPage,
    page,
  }) => {
    /* Slow by nature: its value is a layout failure that only appears at
       scale, so it belongs in the weekly suite rather than the CI run. */
    test.slow();

    await productsPage.open();
    const available = await productsPage.grid.count();
    const target = Math.min(20, available);
    await addProducts(
      productsPage.grid,
      cartModal,
      Array.from({ length: target }, (_, i) => i),
    );

    await cartPage.goto();
    const rows = await cartPage.readRows();

    expect(rows, 'rows for ' + target + ' distinct products').toHaveLength(target);
    expect(rows.filter((r) => !r.name || !r.priceText || !r.totalText).length, 'incomplete rows').toBe(0);

    const widths = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }));
    expect(widths.scroll - widths.client, 'horizontal overflow in px').toBeLessThanOrEqual(1);
    await expect(cartPage.rows.last().locator('.cart_quantity_delete')).toBeEnabled();
  });

  test('TC-W15-008 the cart table renders correctly at mobile width @regression @ui @cart @parallel-unsafe', async ({
    productsPage,
    cartModal,
    cartPage,
    page,
  }) => {
    await productsPage.open();
    await addProducts(productsPage.grid, cartModal, [0, 1]);
    await cartPage.goto();

    const original = page.viewportSize();
    try {
      await page.setViewportSize(viewports.mobile);
      await page.reload({ waitUntil: 'domcontentloaded' });

      const rows = await cartPage.readRows();
      expect(rows).toHaveLength(2);
      expect(
        rows.filter((r) => !r.name || !r.priceText || !r.quantity || !r.totalText).length,
        'rows with an unreadable value at mobile width',
      ).toBe(0);

      /* The body must not overflow; the table scrolling inside its own
         container is an acceptable responsive pattern, not a defect. */
      const body = await page.evaluate(() => ({
        scroll: document.body.scrollWidth,
        client: document.body.clientWidth,
      }));
      expect(body.scroll - body.client, 'body horizontal overflow in px').toBeLessThanOrEqual(1);

      for (let i = 0; i < 2; i++) {
        await expect(cartPage.rows.nth(i).locator('.cart_quantity_delete')).toBeEnabled();
      }
    } finally {
      await page.setViewportSize(original ?? viewports.desktop);
    }
  });

  test('TC-W15-009 the cart page renders without console errors @regression @cart', async ({
    productsPage,
    cartModal,
    cartPage,
    consoleErrors,
  }) => {
    await productsPage.open();
    await addProducts(productsPage.grid, cartModal, [0]);
    await cartPage.goto();

    /* The same filtered console helper WF-01 uses: the allowed-noise list
       exists in exactly one place. */
    const errors = consoleErrors.applicationErrors();
    expect(errors, 'severe console entries:\n' + formatConsoleEntries(errors)).toHaveLength(0);
  });

  test('TC-W15-010 the cart state is isolated between two independent sessions @regression @cart @parallel-unsafe', async ({
    productsPage,
    cartModal,
    cartPage,
    browser,
  }) => {
    await productsPage.open();
    const captured = await addProducts(productsPage.grid, cartModal, [0, 1]);

    /* A genuinely separate context, not a second tab: two tabs of one session
       would make this pass vacuously while proving nothing. */
    const other = await browser.newContext({ storageState: GUEST_SESSION });
    try {
      const otherPage = await other.newPage();
      await blockAds(otherPage);
      const otherCart = new CartPage(otherPage);
      await otherCart.goto();

      await expect(otherCart.emptyBlock).toBeVisible();
      const otherNames = await otherCart.rowNames();
      for (const product of captured) {
        expect(otherNames, 'leaked into the second session').not.toContain(product.name);
      }
    } finally {
      await other.close();
    }

    await cartPage.goto();
    expect(await cartPage.rowNames()).toHaveLength(2);
  });
});
