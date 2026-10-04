import { test, expect, GUEST_SESSION, addProducts } from '../../fixtures/workflow.fixture';
import { budgets, expectedText } from '../../config/test.config';
import { locators, paths } from '../../data/locators';
import { median } from '../../utils/browser.helper';

/**
 * WF-11 — Add to Cart from the Products Listing.
 *
 * Establishes the cart state that WF-15 to WF-19 verify. Every expected value
 * is captured from the card at the moment it is added.
 */
test.use({ storageState: GUEST_SESSION });

test.describe('WF-11 Add to Cart from the Products Listing', () => {
  test.beforeEach(async ({ productsPage }) => {
    await productsPage.open();
  });

  test('TC-W11-001 add a single product from the listing and verify the modal @smoke @regression @cart @parallel-unsafe', async ({
    productsPage,
    cartModal,
  }) => {
    const product = await productsPage.grid.capture(0);

    /* Centred scroll before the click: the sticky header intercepts clicks on
       cards near the top and the error looks like an application defect. */
    await productsPage.grid.addToCart(0);

    await cartModal.waitVisible();
    await expect(cartModal.title).toHaveText(new RegExp(expectedText.addedConfirmation, 'i'));
    await expect(cartModal.continueShopping).toBeVisible();
    await expect(cartModal.viewCart).toBeVisible();
    expect(product.name).not.toBe('');
  });

  test('TC-W11-002 Continue Shopping returns control to the listing @regression @cart @parallel-unsafe', async ({
    productsPage,
    cartModal,
    page,
  }) => {
    await productsPage.grid.addToCart(0);
    await cartModal.waitVisible();

    await cartModal.dismiss();

    await expect(cartModal.content).toBeHidden();
    await expect(page).toHaveURL(new RegExp(paths.products + '/?$'));
    await expect(productsPage.grid.card(1)).toBeVisible();
    await expect(
      productsPage.grid.card(1).locator(locators.PRD_CARD_ADD_TO_CART).first(),
    ).toBeEnabled();
  });

  test('TC-W11-003 View Cart from the modal transitions to the cart page @smoke @regression @cart @parallel-unsafe', async ({
    productsPage,
    cartModal,
    cartPage,
    page,
  }) => {
    const product = await productsPage.grid.capture(0);
    await productsPage.grid.addToCart(0);
    await cartModal.waitVisible();

    await cartModal.openCart();

    await expect(page).toHaveURL(new RegExp(paths.cart + '$'));
    await expect(cartPage.table).toBeVisible();

    const rows = await cartPage.readRows();
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe(product.name);
  });

  test('TC-W11-004 add three distinct products and verify all three reach the cart @regression @cart @parallel-unsafe', async ({
    productsPage,
    cartModal,
    cartPage,
  }) => {
    /* All three captured before the first addition, so the grid is read in
       one consistent state. */
    const captured = await addProducts(productsPage.grid, cartModal, [0, 1, 2]);

    await cartPage.goto();
    const rows = await cartPage.readRows();

    expect(rows).toHaveLength(3);
    /* Compared as a set: the cart row ordering is not specified. */
    expect(rows.map((r) => r.name).sort()).toEqual(captured.map((p) => p.name).sort());
    for (const row of rows) {
      expect(row.quantity, row.name + ' quantity').toBe(1);
      const source = captured.find((p) => p.name === row.name);
      expect(row.total, row.name + ' total').toBe(source?.price);
    }
  });

  test('TC-W11-005 add the same product twice and verify quantity accumulation @regression @cart @parallel-unsafe', async ({
    productsPage,
    cartModal,
    cartPage,
  }) => {
    const product = await productsPage.grid.capture(0);

    await productsPage.grid.addToCart(0);
    await cartModal.waitVisible();
    await cartModal.dismiss();
    await productsPage.grid.addToCart(0);
    await cartModal.waitVisible();
    await cartModal.openCart();

    const rows = await cartPage.readRows();
    /* The accumulation contract WF-16 relies on; a regression here silently
       corrupts every order total. */
    expect(rows).toHaveLength(1);
    expect(rows[0].quantity).toBe(2);
    expect(rows[0].total).toBe(product.price * 2);
  });

  test('TC-W11-006 add a product from the hover overlay action @regression @cart @parallel-unsafe', async ({
    productsPage,
    cartModal,
    cartPage,
  }) => {
    const product = await productsPage.grid.capture(1);

    await productsPage.grid.addToCartViaOverlay(1);
    await cartModal.waitVisible();
    await cartModal.openCart();

    const rows = await cartPage.readRows();
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe(product.name);
    expect(rows[0].quantity).toBe(1);
  });

  test('TC-W11-007 add a product from a filtered category listing @regression @cart @parallel-unsafe', async ({
    productsPage,
    cartModal,
    cartPage,
  }) => {
    await productsPage.categories.openFirstSubCategory('Women');

    const product = await productsPage.grid.capture(0);
    await productsPage.grid.addToCart(0);
    await cartModal.waitVisible();
    await cartModal.openCart();

    const rows = await cartPage.readRows();
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe(product.name);
    expect(rows[0].total).toBe(product.price);
  });

  test('TC-W11-008 the cart contents survive navigation away from the products page @regression @cart @parallel-unsafe', async ({
    productsPage,
    homePage,
    cartModal,
    cartPage,
  }) => {
    const captured = await addProducts(productsPage.grid, cartModal, [0, 1]);

    await productsPage.header.goToHome();
    await homePage.header.goToProducts();
    await productsPage.header.goToCart();

    const rows = await cartPage.readRows();
    expect(rows).toHaveLength(2);
    expect(rows.map((r) => r.name).sort()).toEqual(captured.map((p) => p.name).sort());
    for (const row of rows) {
      expect(row.quantity).toBe(1);
      expect(row.total).toBe(captured.find((p) => p.name === row.name)?.price);
    }
  });

  test('TC-W11-009 adding a product does not alter the listing state @regression @ui', async ({
    productsPage,
    cartModal,
    page,
  }) => {
    const before = await productsPage.grid.captureAll();

    await productsPage.grid.addToCart(0);
    await cartModal.waitVisible();
    /* Read after the add and before the dismissal: adding scrolls its own
       card into the centre, and that movement is not what this case is
       about. What must not move is the position across the dismissal. */
    const scrollBefore = await productsPage.scrollOffset();
    await cartModal.dismiss();

    const after = await productsPage.grid.captureAll();
    expect(after.length, 'card count after the addition').toBe(before.length);
    expect(after.map((p) => p.name + '|' + p.priceText)).toEqual(
      before.map((p) => p.name + '|' + p.priceText),
    );

    /* Catches the regression where dismissing the modal jumps the user back
       to the top of a long listing. */
    const scrollAfter = await productsPage.scrollOffset();
    expect(
      Math.abs(scrollAfter - scrollBefore),
      'scroll position moved when the modal was dismissed',
    ).toBeLessThan(150);
    expect(page.url()).toContain(paths.products);
  });

  test('TC-W11-010 the add-to-cart action responds within the agreed budget @regression @performance', async ({
    productsPage,
    cartModal,
  }) => {
    const samples: number[] = [];

    for (let i = 0; i < 5; i++) {
      const started = Date.now();
      await productsPage.grid.addToCart(i);
      /* Measured from the click to the modal being visible, never a sleep. */
      await cartModal.waitVisible();
      samples.push(Date.now() - started);
      await cartModal.dismiss();
    }

    const middle = median(samples);
    await test.info().attach('add-to-cart-ms', {
      body: 'samples=' + samples.join(',') + ' median=' + middle,
      contentType: 'text/plain',
    });

    expect(middle, 'median add-to-cart response').toBeLessThan(budgets.interactionMedianMs);
    /* An outlier ceiling tolerates one noisy run on a shared environment. */
    expect(Math.max(...samples), 'slowest add-to-cart response').toBeLessThan(
      budgets.interactionMedianMs * 2,
    );
  });
});
