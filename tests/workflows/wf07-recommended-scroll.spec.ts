import { test, expect, GUEST_SESSION } from '../../fixtures/workflow.fixture';
import { currencyPattern, expectedText } from '../../config/test.config';

/**
 * WF-07 — Recommended Items and Scroll Utility.
 *
 * Both features operate below the fold, so the scroll is part of the behaviour
 * under test rather than an implementation detail.
 */
test.use({ storageState: GUEST_SESSION });

test.describe('WF-07 Recommended Items and Scroll Utility', () => {
  test('TC-W07-001 the recommended items section renders at the foot of the page @regression @ui', async ({
    homePage,
  }) => {
    await homePage.open();
    await homePage.recommended.reveal();

    await expect(homePage.recommended.title).toBeVisible();
    await expect(homePage.recommended.carousel).toBeVisible();

    const items = await homePage.recommended.items();
    expect(items.length, 'active recommended cards').toBeGreaterThan(0);
    expect(items.filter((item) => !item.name).length, 'cards without a name').toBe(0);
    expect(
      items.filter((item) => !currencyPattern.test(item.priceText)).map((item) => item.name),
      'cards with an unparseable price',
    ).toEqual([]);
    expect(items.filter((item) => !item.hasAddToCart).length, 'cards without add-to-cart').toBe(0);
  });

  test('TC-W07-002 the recommended carousel advances to a different product set @regression', async ({
    homePage,
  }) => {
    await homePage.open();
    await homePage.recommended.reveal();

    const before = await homePage.recommended.names();
    const after = await homePage.recommended.advance(before);

    expect(after, 'active card set after Next').not.toEqual(before);
    expect(after.length).toBeGreaterThan(0);

    const items = await homePage.recommended.items();
    expect(
      items.filter((item) => !item.name || !currencyPattern.test(item.priceText)).length,
      'cards with an invalid name or price',
    ).toBe(0);
  });

  test('TC-W07-003 add a recommended product to the cart @regression @cart @parallel-unsafe', async ({
    homePage,
    cartModal,
    cartPage,
  }) => {
    await homePage.open();
    await homePage.recommended.reveal();

    /* Capture before clicking: the carousel may rotate. */
    const captured = await homePage.recommended.addToCart(0);

    await cartModal.waitVisible();
    await expect(cartModal.title).toHaveText(new RegExp(expectedText.addedConfirmation, 'i'));
    await cartModal.openCart();

    const rows = await cartPage.readRows();
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe(captured.name);
    expect(rows[0].total).toBe(captured.price);
  });

  test('TC-W07-004 the scroll-up control is absent at the top of the document @regression @ui', async ({
    homePage,
  }) => {
    await homePage.open();

    expect(await homePage.scrollOffset(), 'vertical scroll offset on load').toBe(0);
    /* Absence and invisibility are equally valid implementations. */
    expect(await homePage.scrollUpIsHidden(), 'scroll-up control hidden at the top').toBe(true);
  });

  test('TC-W07-005 the scroll-up control appears after scrolling and returns to the top @regression', async ({
    homePage,
    page,
  }) => {
    await homePage.open();
    const urlBefore = page.url();

    await homePage.scrollToBottom();
    await expect(homePage.scrollUp).toBeVisible();

    await homePage.clickScrollUp();

    expect(await homePage.scrollOffset(), 'offset after the scroll-up click').toBeLessThanOrEqual(5);
    /* The control scrolls; it must not reload or navigate. */
    expect(page.url()).toBe(urlBefore);
  });

  test('TC-W07-006 the scroll-up control behaves identically on the products page @regression', async ({
    productsPage,
    page,
  }) => {
    await productsPage.open();
    const urlBefore = page.url();

    await productsPage.scrollToBottom();
    await expect(productsPage.scrollUp).toBeVisible();
    await productsPage.clickScrollUp();

    expect(await productsPage.scrollOffset()).toBeLessThanOrEqual(5);
    expect(page.url(), 'URL unchanged by the scroll-up control').toBe(urlBefore);
  });
});
