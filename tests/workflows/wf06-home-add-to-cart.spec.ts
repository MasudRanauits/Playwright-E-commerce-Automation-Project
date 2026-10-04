import { test, expect, GUEST_SESSION } from '../../fixtures/workflow.fixture';
import { currencyPattern, expectedText } from '../../config/test.config';
import { paths } from '../../data/locators';

/**
 * WF-06 — Features Items and Add to Cart from Home.
 *
 * Every assertion compares against the name and price captured from the card
 * at the moment it was added, never against a literal. That is what makes the
 * cart workflows downstream of this one stable.
 *
 * Each test runs in a fresh guest context, so the cart starts empty without a
 * teardown and a mid-test failure cannot leak state into the next case.
 */
test.use({ storageState: GUEST_SESSION });

test.describe('WF-06 Features Items and Add to Cart from Home', () => {
  test.beforeEach(async ({ homePage }) => {
    await homePage.open();
  });

  test('TC-W06-001 the features grid renders a non-empty set of product cards @smoke @regression @ui', async ({
    homePage,
  }) => {
    await homePage.featuresTitle.scrollIntoViewIfNeeded();
    await expect(homePage.featuresTitle).toBeVisible();

    const count = await homePage.grid.count();
    /* Never an absolute count: the catalogue of a shared environment changes. */
    expect(count, 'product cards in the features grid').toBeGreaterThan(0);
    expect(await homePage.grid.scriptedCount(), 'cards hidden behind a rendering fault').toBe(count);
  });

  test('TC-W06-002 every product card exposes name, price, image and actions @smoke @regression @ui', async ({
    homePage,
  }) => {
    const cards = await homePage.grid.captureAll();
    expect(cards.length).toBeGreaterThan(0);

    expect(cards.filter((c) => !c.name).map((c) => c.index), 'cards without a name').toEqual([]);
    expect(
      cards.filter((c) => !currencyPattern.test(c.priceText)).map((c) => c.name),
      'prices not matching the currency pattern',
    ).toEqual([]);
    expect(cards.filter((c) => c.imageWidth <= 0).map((c) => c.name), 'undecoded images').toEqual([]);
    expect(cards.filter((c) => !c.hasAddToCart).map((c) => c.name), 'no add-to-cart').toEqual([]);
    expect(cards.filter((c) => !c.href).map((c) => c.name), 'no view product link').toEqual([]);
  });

  test('TC-W06-003 price values parse as positive numbers in a consistent format @regression @data', async ({
    homePage,
  }) => {
    const cards = await homePage.grid.captureAll();

    const malformed = cards.filter((c) => !currencyPattern.test(c.priceText));
    expect(malformed.map((c) => c.name + ' -> ' + c.priceText), 'malformed prices').toEqual([]);

    const nonPositive = cards.filter((c) => !(c.price > 0));
    expect(nonPositive.map((c) => c.name + ' -> ' + c.price), 'non-positive prices').toEqual([]);
  });

  test('TC-W06-004 add the first product and verify the confirmation modal @smoke @regression @cart @parallel-unsafe', async ({
    homePage,
    cartModal,
  }) => {
    const product = await homePage.grid.capture(0);

    await homePage.grid.addToCartViaOverlay(0);

    await cartModal.waitVisible();
    await expect(cartModal.title).toHaveText(new RegExp(expectedText.addedConfirmation, 'i'));
    await expect(cartModal.continueShopping).toBeVisible();
    await expect(cartModal.continueShopping).toBeEnabled();
    await expect(cartModal.viewCart).toBeVisible();
    await expect(cartModal.viewCart).toHaveAttribute('href', paths.cart);

    expect(product.name, 'captured product name').not.toBe('');
  });

  test('TC-W06-005 Continue Shopping dismisses the modal and keeps the user on home @regression @cart @parallel-unsafe', async ({
    homePage,
    cartModal,
    page,
  }) => {
    await homePage.grid.addToCart(0);
    await cartModal.waitVisible();

    await cartModal.dismiss();

    await expect(cartModal.content).toBeHidden();
    await expect(page).toHaveURL(/automationexercise\.com\/?$/);
    /* The grid is still rendered and interactive after the dismissal. */
    await expect(homePage.grid.cards.first()).toBeVisible();
    await expect(homePage.grid.card(1)).toBeVisible();
  });

  test('TC-W06-006 View Cart from the modal transitions to the cart page @smoke @regression @cart @parallel-unsafe', async ({
    homePage,
    cartModal,
    cartPage,
    page,
  }) => {
    const product = await homePage.grid.capture(0);
    await homePage.grid.addToCart(0);
    await cartModal.waitVisible();

    await cartModal.openCart();

    await expect(page).toHaveURL(new RegExp(paths.cart + '$'));
    await expect(cartPage.table).toBeVisible();

    const rows = await cartPage.readRows();
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe(product.name);
  });

  test('TC-W06-007 add a product using the inline action rather than the overlay @regression @cart @parallel-unsafe', async ({
    homePage,
    cartModal,
    cartPage,
  }) => {
    const product = await homePage.grid.capture(1);

    /* No hover: the inline anchor must be reachable on its own. */
    await homePage.grid.addToCart(1);
    await cartModal.waitVisible();
    await cartModal.openCart();

    const rows = await cartPage.readRows();
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe(product.name);
    expect(rows[0].quantity).toBe(1);
  });

  test('TC-W06-008 add two distinct products from the home grid in sequence @regression @cart @parallel-unsafe', async ({
    homePage,
    cartModal,
    cartPage,
  }) => {
    const captured = await homePage.grid.captureAll();
    const [first, second] = captured;

    await homePage.grid.addToCart(0);
    await cartModal.waitVisible();
    /* The dismissal wait is the critical step: without it the second click is
       intercepted by the fading backdrop. */
    await cartModal.dismiss();

    await homePage.grid.addToCart(1);
    await cartModal.waitVisible();
    await cartModal.openCart();

    const rows = await cartPage.readRows();
    expect(rows).toHaveLength(2);
    expect(rows.map((row) => row.name).sort()).toEqual([first.name, second.name].sort());
    for (const row of rows) {
      expect(row.quantity, row.name + ' quantity').toBe(1);
      const source = captured.find((product) => product.name === row.name);
      expect(row.total, row.name + ' total').toBe(source?.price);
    }
  });

  test('TC-W06-009 add the same product twice from the home grid @regression @cart @parallel-unsafe', async ({
    homePage,
    cartModal,
    cartPage,
  }) => {
    const product = await homePage.grid.capture(0);

    await homePage.grid.addToCart(0);
    await cartModal.waitVisible();
    await cartModal.dismiss();

    await homePage.grid.addToCart(0);
    await cartModal.waitVisible();
    await cartModal.openCart();

    const rows = await cartPage.readRows();
    /* The accumulation rule WF-16 depends on: one row, quantity two. */
    expect(rows, 'cart rows for the same product added twice').toHaveLength(1);
    expect(rows[0].quantity).toBe(2);
    expect(rows[0].total).toBe(product.price * 2);
  });

  test('TC-W06-010 the view product link on a card carries a valid product path @regression @navigation', async ({
    homePage,
    productDetailPage,
    page,
  }) => {
    const cards = await homePage.grid.captureAll();

    const invalid = cards.filter((card) => card.productId === null);
    expect(invalid.map((card) => card.name + ' -> ' + card.href), 'invalid paths').toEqual([]);

    const ids = cards.map((card) => card.productId);
    expect(ids, 'duplicate product identifiers in the grid').toHaveLength(new Set(ids).size);

    /* Validate every href statically, click only one: full coverage, low runtime. */
    const first = cards[0];
    await homePage.grid.openProduct(0);
    await expect(page).toHaveURL(new RegExp('/product_details/' + first.productId));
    await expect(productDetailPage.name).toBeVisible();
  });
});
