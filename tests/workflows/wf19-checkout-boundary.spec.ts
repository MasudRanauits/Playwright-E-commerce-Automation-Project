import {
  test,
  expect,
  GUEST_SESSION,
  addProducts,
  ensureEmptyCart,
  resetAccountCart,
} from '../../fixtures/workflow.fixture';
import { expectedText } from '../../config/test.config';
import { paths } from '../../data/locators';
import { clickAndWaitForUrl } from '../../utils/browser.helper';

/**
 * WF-19 — Proceed to Checkout Boundary.
 *
 * Only the boundary is asserted. Verifying the checkout page content belongs
 * to the master document; duplicating it here would create two places to
 * maintain the same assertion.
 */
test.use({ storageState: GUEST_SESSION });

test.describe('WF-19 Proceed to Checkout Boundary', () => {
  test('TC-W19-001 the checkout action is present when the cart holds products @regression @ui @cart @parallel-unsafe', async ({
    productsPage,
    cartModal,
    cartPage,
  }) => {
    await productsPage.open();
    await addProducts(productsPage.grid, cartModal, [0]);
    await cartPage.goto();

    /* Scroll before reading the state: an element that has never been in the
       viewport can report an unexpected state. */
    await cartPage.scrollIntoCentre(cartPage.checkoutButton);
    await expect(cartPage.checkoutButton).toBeVisible();
    await expect(cartPage.checkoutButton).toBeEnabled();
    await expect(cartPage.checkoutButton).toContainText(
      new RegExp(expectedText.checkoutCta, 'i'),
    );

    /* Rendered below the table, not inside a row. */
    expect(await cartPage.rows.locator('.check_out').count(), 'checkout inside a row').toBe(0);
  });

  test('TC-W19-002 a guest is prompted to register or log in at checkout @smoke @regression @cart @negative @parallel-unsafe', async ({
    productsPage,
    cartModal,
    cartPage,
    page,
  }) => {
    await productsPage.open();
    await addProducts(productsPage.grid, cartModal, [0]);
    await cartPage.goto();

    await cartPage.clickCheckout();

    await expect(cartPage.checkoutModal).toBeVisible();
    await expect(cartPage.checkoutModalBody).toContainText(/register|login/i);
    await expect(cartPage.registerLoginLink).toBeVisible();
    await expect(cartPage.registerLoginLink).toHaveAttribute('href', paths.login);

    /* The substantive part: a modal that appears while the navigation also
       proceeds is a real defect a modal-only assertion would not catch. */
    await expect(page).toHaveURL(new RegExp(paths.cart + '$'));
  });

  test('TC-W19-003 the modal link routes the guest to the login page @regression @navigation @cart @parallel-unsafe', async ({
    productsPage,
    loginPage,
    cartModal,
    cartPage,
    page,
  }) => {
    await productsPage.open();
    const captured = await addProducts(productsPage.grid, cartModal, [0]);
    await cartPage.goto();
    await cartPage.clickCheckout();
    await expect(cartPage.checkoutModal).toBeVisible();

    await clickAndWaitForUrl(page, cartPage.registerLoginLink, new RegExp(paths.login));

    await expect(page).toHaveURL(new RegExp(paths.login + '$'));
    await expect(loginPage.emailInput).toBeAttached();

    /* A prompt that silently discards the cart while routing the user to
       login is a severe defect, and this is the cheapest place to catch it. */
    await cartPage.goto();
    expect(await cartPage.rowNames()).toEqual([captured[0].name]);
  });

  test('TC-W19-004 the guest modal can be dismissed without losing the cart @regression @cart @parallel-unsafe', async ({
    productsPage,
    cartModal,
    cartPage,
  }) => {
    await productsPage.open();
    await addProducts(productsPage.grid, cartModal, [0, 1]);
    await cartPage.goto();
    const before = await cartPage.readRows();

    await cartPage.clickCheckout();
    await expect(cartPage.checkoutModal).toBeVisible();

    await cartPage.checkoutModalClose.click();
    await expect(cartPage.checkoutModal).toBeHidden();

    const after = await cartPage.readRows();
    expect(after.map((r) => r.name + '|' + r.quantity + '|' + r.totalText)).toEqual(
      before.map((r) => r.name + '|' + r.quantity + '|' + r.totalText),
    );
    /* A second attempt must still be possible. */
    await expect(cartPage.checkoutButton).toBeEnabled();
  });

  test('TC-W19-005 an authenticated user reaches the checkout boundary directly @regression @cart @e2e @parallel-unsafe', async ({
    productsPage,
    loginPage,
    cartModal,
    cartPage,
    page,
    env,
  }) => {
    test.skip(
      !env.credentials.email || !env.credentials.password,
      'No credentials configured — set QA_USER_EMAIL / QA_USER_PASSWORD in .env',
    );

    /* The account cart is server-side and survives the run, so clear it
       before the case builds the state it asserts on. */
    await resetAccountCart(page, env.credentials);

    await loginPage.goto();
    await loginPage.login(env.credentials.email, env.credentials.password);

    await productsPage.open();
    await addProducts(productsPage.grid, cartModal, [0]);
    await cartPage.goto();

    await cartPage.clickCheckout();
    await page.waitForURL(new RegExp(paths.checkout));

    expect(await cartPage.checkoutModal.count(), 'registration modal for a signed-in user').toBe(0);
    await expect(page).toHaveURL(new RegExp(paths.checkout));
  });

  test('TC-W19-006 the checkout action is not offered for an empty cart @regression @cart @negative', async ({
    loginPage,
    cartPage,
    page,
    env,
  }) => {
    test.skip(
      !env.credentials.email || !env.credentials.password,
      'No credentials configured — set QA_USER_EMAIL / QA_USER_PASSWORD in .env',
    );

    /* The account cart is server-side and survives the run, so clear it
       before the case builds the state it asserts on. */
    await resetAccountCart(page, env.credentials);

    await loginPage.goto();
    await loginPage.login(env.credentials.email, env.credentials.password);
    await ensureEmptyCart(page);

    await cartPage.goto();
    await expect(cartPage.emptyBlock).toBeVisible();

    /* Either documented behaviour is accepted; the case fails only if an
       empty order can be initiated. */
    if ((await cartPage.checkoutButton.count()) > 0 && (await cartPage.checkoutButton.isVisible())) {
      await cartPage.checkoutButton.click();
      await page.waitForLoadState('domcontentloaded');
      expect(page.url(), 'an empty cart reached the checkout page').not.toContain(paths.checkout);
    }

    await expect(cartPage.emptyBlock).toBeVisible();
    const body = (await page.locator('body').innerText()).toLowerCase();
    expect(body.includes('internal server error')).toBe(false);
  });
});
