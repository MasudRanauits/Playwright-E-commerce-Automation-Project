import {
  test,
  expect,
  GUEST_SESSION,
  addProducts,
  resetAccountCart,
} from '../../fixtures/workflow.fixture';
import { CartPage } from '../../pages/CartPage';
import { blockAds } from '../../utils/common.helper';
import { paths } from '../../data/locators';

/**
 * WF-18 — Cart Persistence.
 *
 * The behaviour users rely on most and the one most often broken by a session
 * change. The authenticated cases skip with a clear message when the
 * credential fixture is absent: a missing secret is an environment condition,
 * never an application defect.
 */
test.use({ storageState: GUEST_SESSION });

test.describe('WF-18 Cart Persistence', () => {
  test('TC-W18-001 the cart survives navigation across all three pages @smoke @regression @cart @parallel-unsafe', async ({
    productsPage,
    homePage,
    cartModal,
    cartPage,
  }) => {
    await productsPage.open();
    const captured = await addProducts(productsPage.grid, cartModal, [0, 1]);

    /* Navigated through the header, the real user path, which exercises the
       same links WF-02 covers. */
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

  test('TC-W18-002 the cart survives a page refresh @regression @cart @parallel-unsafe', async ({
    productsPage,
    cartModal,
    cartPage,
    page,
  }) => {
    await productsPage.open();
    await addProducts(productsPage.grid, cartModal, [0, 1]);

    await cartPage.goto();
    const before = await cartPage.readRows();

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(cartPage.table).toBeVisible();
    const after = await cartPage.readRows();

    expect(after).toHaveLength(before.length);
    expect(after.map((r) => r.name + '|' + r.quantity + '|' + r.totalText)).toEqual(
      before.map((r) => r.name + '|' + r.quantity + '|' + r.totalText),
    );
    /* Targets the defect class where a refresh replays the add request. */
    const names = after.map((r) => r.name);
    expect(names, 'rows duplicated by the refresh').toHaveLength(new Set(names).size);
  });

  test('TC-W18-003 a guest cart is preserved through login @regression @cart @e2e @parallel-unsafe', async ({
    productsPage,
    loginPage,
    cartPage,
    cartModal,
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

    await productsPage.open();
    const captured = await addProducts(productsPage.grid, cartModal, [0, 1]);
    await cartPage.goto();
    expect(await cartPage.rowCount()).toBe(2);

    await loginPage.goto();
    await loginPage.login(env.credentials.email, env.credentials.password);
    await expect(cartPage.header.logout).toBeVisible();

    await cartPage.goto();
    const rows = await cartPage.readRows();
    expect(rows, 'rows after authentication').toHaveLength(2);
    expect(rows.map((r) => r.name).sort()).toEqual(captured.map((p) => p.name).sort());
    for (const row of rows) {
      expect(row.quantity).toBe(1);
      expect(row.total).toBe(captured.find((p) => p.name === row.name)?.price);
    }
  });

  test('TC-W18-004 the cart is preserved across logout and a subsequent login @regression @cart @e2e @parallel-unsafe', async ({
    productsPage,
    loginPage,
    cartPage,
    cartModal,
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
    const captured = await addProducts(productsPage.grid, cartModal, [0, 1]);

    await cartPage.header.logout.click();
    await page.waitForURL(new RegExp(paths.login));

    await loginPage.login(env.credentials.email, env.credentials.password);
    await expect(cartPage.header.logout).toBeVisible();

    /* Recorded behaviour: the account cart is retained across the session
       change. If the application ever clears it on logout by design, invert
       this assertion and record the intent here. */
    await cartPage.goto();
    const rows = await cartPage.readRows();
    expect(rows.map((r) => r.name).sort()).toEqual(captured.map((p) => p.name).sort());
    for (const row of rows) {
      expect(row.quantity).toBe(1);
      expect(row.total).toBe(captured.find((p) => p.name === row.name)?.price);
    }
  });

  test('TC-W18-005 the cart is not shared between two different accounts @regression @cart @e2e @parallel-unsafe', async ({
    productsPage,
    loginPage,
    cartPage,
    cartModal,
    browser,
    env,
  }) => {
    const second = env.secondaryCredentials;
    test.skip(
      !env.credentials.email || !second?.email || !second?.password,
      'No second account fixture — set QA_USER2_EMAIL / QA_USER2_PASSWORD in .env',
    );

    await loginPage.goto();
    await loginPage.login(env.credentials.email, env.credentials.password);
    await productsPage.open();
    const captured = await addProducts(productsPage.grid, cartModal, [0, 1]);

    /* Two genuinely separate drivers; two tabs of one session would share
       state and make the case pass while proving nothing. */
    const otherContext = await browser.newContext({ storageState: GUEST_SESSION });
    try {
      const otherPage = await otherContext.newPage();
      await blockAds(otherPage);
      await otherPage.goto(paths.login);
      await otherPage.locator('[data-qa="login-email"]').fill(second!.email);
      await otherPage.locator('[data-qa="login-password"]').fill(second!.password);
      await otherPage.locator('[data-qa="login-button"]').click();

      const otherCart = new CartPage(otherPage);
      await otherCart.goto();
      const otherNames = await otherCart.rowNames();
      for (const product of captured) {
        expect(otherNames, product.name + ' leaked into the second account').not.toContain(
          product.name,
        );
      }
    } finally {
      await otherContext.close();
    }

    await cartPage.goto();
    expect(await cartPage.rowNames(), 'the first account cart was disturbed').toHaveLength(2);
  });

  test('TC-W18-006 the cart state is restored correctly in a new tab of the same session @regression @cart @parallel-unsafe', async ({
    productsPage,
    cartModal,
    cartPage,
    page,
  }) => {
    await productsPage.open();
    const captured = await addProducts(productsPage.grid, cartModal, [0, 1]);
    await cartPage.goto();
    const before = await cartPage.readRows();

    const newTab = await page.context().newPage();
    try {
      await blockAds(newTab);
      const tabCart = new CartPage(newTab);
      await tabCart.goto();

      const rows = await tabCart.readRows();
      expect(rows.map((r) => r.name).sort()).toEqual(captured.map((p) => p.name).sort());
      expect(rows.map((r) => r.quantity + '|' + r.totalText)).toEqual(
        before.map((r) => r.quantity + '|' + r.totalText),
      );
    } finally {
      /* Always restore the original page: a run left pointing at a closed tab
         fails every subsequent test with a confusing no-such-window error. */
      await newTab.close();
    }

    await page.bringToFront();
    await cartPage.goto();
    expect(await cartPage.readRows()).toHaveLength(before.length);
  });
});
