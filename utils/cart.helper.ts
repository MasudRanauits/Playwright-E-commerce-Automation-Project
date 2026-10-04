import { Page, expect } from '@playwright/test';
import { ProductsPage } from '../pages/ProductsPage';
import { CartPage } from '../pages/CartPage';
import { AddToCartModalComponent } from '../pages/components/AddToCartModalComponent';
import { CapturedProduct, ProductGridComponent } from '../pages/components/ProductGridComponent';

/**
 * Cart flows shared by WF-11 and every workflow downstream of it.
 *
 * Each addition dismisses the modal and waits for it to disappear before the
 * next click. Without that wait the following click is intercepted by the
 * fading backdrop and the run fails with a confusing element-not-clickable
 * error — the single most common source of flakiness in these workflows.
 */

/** Adds the cards at the given indexes, capturing each identity before it is added. */
export async function addProducts(
  grid: ProductGridComponent,
  modal: AddToCartModalComponent,
  indexes: number[],
): Promise<CapturedProduct[]> {
  /* Capture the whole grid first so every product is read in one consistent state. */
  const all = await grid.captureAll();
  const captured: CapturedProduct[] = [];

  for (const index of indexes) {
    expect(all.length, 'product card at index ' + index).toBeGreaterThan(index);
    await grid.addToCart(index);
    await modal.waitVisible();
    await modal.dismiss();
    captured.push(all[index]);
  }
  return captured;
}

/** Adds one card repeatedly — the accumulation contract of TC-W11-005. */
export async function addSameProduct(
  grid: ProductGridComponent,
  modal: AddToCartModalComponent,
  index: number,
  times: number,
): Promise<CapturedProduct> {
  const captured = await grid.capture(index);
  for (let i = 0; i < times; i++) {
    await grid.addToCart(index);
    await modal.waitVisible();
    await modal.dismiss();
  }
  return captured;
}

/**
 * Builds a cart of (product, quantity) pairs from the products listing.
 * Returns the captured products in the order they were requested.
 */
export async function buildCart(
  productsPage: ProductsPage,
  modal: AddToCartModalComponent,
  quantities: number[],
): Promise<CapturedProduct[]> {
  await productsPage.open();
  const all = await productsPage.grid.captureAll();
  expect(all.length).toBeGreaterThanOrEqual(quantities.length);

  for (let index = 0; index < quantities.length; index++) {
    for (let repeat = 0; repeat < quantities[index]; repeat++) {
      await productsPage.grid.addToCart(index);
      await modal.waitVisible();
      await modal.dismiss();
    }
  }
  return all.slice(0, quantities.length);
}

/** The teardown every cart test calls; safe to run against an already-empty cart. */
export async function ensureEmptyCart(page: Page): Promise<void> {
  const cart = new CartPage(page);
  await cart.goto();
  await cart.clearCart();
}

/**
 * Empties the cart of a registered account and returns the session to a guest.
 *
 * The account cart lives on the server and survives the run, so without this
 * the cases that log in inherit whatever previous runs left behind and read
 * quantities of three or five where they expect one. Clearing it is setup,
 * not part of what any case asserts.
 */
export async function resetAccountCart(
  page: Page,
  credentials: { email: string; password: string },
): Promise<void> {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-qa="login-email"]').fill(credentials.email);
  await page.locator('[data-qa="login-password"]').fill(credentials.password);
  await page.locator('[data-qa="login-button"]').click();
  await page.waitForURL(/automationexercise\.com\/?$/);

  await ensureEmptyCart(page);

  await page.context().clearCookies();
}
