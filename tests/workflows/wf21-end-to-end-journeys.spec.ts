import {
  test,
  expect,
  GUEST_SESSION,
  addProducts,
  resetAccountCart,
} from '../../fixtures/workflow.fixture';
import { expectedText, searchTerms } from '../../config/test.config';
import { paths } from '../../data/locators';
import { formatConsoleEntries } from '../../utils/browser.helper';
import { irrelevantResults } from '../../utils/search.helper';
import { clickAndWaitForUrl } from '../../utils/browser.helper';

/**
 * WF-21 — End-to-End Journeys Across the Three Pages.
 *
 * Complete journeys that traverse home, catalogue and cart, so an integration
 * defect between the three pages is caught even when each page passes its own
 * workflow.
 */
test.use({ storageState: GUEST_SESSION });

test.describe('WF-21 End-to-End Journeys', () => {
  test('TC-W21-001 journey: home browse, add to cart, verify in cart @smoke @regression @e2e @cart @parallel-unsafe', async ({
    homePage,
    cartModal,
    cartPage,
    consoleErrors,
  }) => {
    await homePage.open();

    const product = await homePage.grid.capture(0);
    await homePage.grid.addToCart(0);
    await cartModal.waitVisible();
    await cartModal.openCart();

    const rows = await cartPage.readRows();
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe(product.name);
    expect(rows[0].total).toBe(product.price);

    const errors = consoleErrors.applicationErrors();
    expect(errors, 'console errors during the journey:\n' + formatConsoleEntries(errors)).toHaveLength(0);
  });

  test('TC-W21-002 journey: header to products, add two, verify in cart @smoke @regression @e2e @cart @parallel-unsafe', async ({
    homePage,
    productsPage,
    cartModal,
    cartPage,
  }) => {
    /* Header navigation only, no direct URL entry: that is what makes this a
       genuine integration test rather than three isolated checks in sequence. */
    await homePage.open();
    await homePage.header.goToProducts();
    await expect(productsPage.title).toBeVisible();

    const captured = await addProducts(productsPage.grid, cartModal, [0, 1]);

    await productsPage.header.goToCart();

    const rows = await cartPage.readRows();
    expect(rows).toHaveLength(2);
    expect(rows.map((r) => r.name).sort()).toEqual(captured.map((p) => p.name).sort());
    for (const row of rows) {
      expect(row.total, row.name + ' total').toBe(
        captured.find((p) => p.name === row.name)?.price,
      );
    }
  });

  test('TC-W21-003 journey: search, add a result, verify, then remove it @regression @e2e @search @cart @parallel-unsafe', async ({
    productsPage,
    cartModal,
    cartPage,
    api,
  }) => {
    await productsPage.open();
    await productsPage.search(searchTerms.partial[0]);
    await productsPage.expectSearchResultView();

    const names = await productsPage.grid.names();
    expect(names.length, 'search results').toBeGreaterThan(0);
    expect(await irrelevantResults(names, searchTerms.partial[0], api), 'irrelevant results').toEqual(
      [],
    );

    const first = await productsPage.grid.capture(0);
    await productsPage.grid.addToCart(0);
    await cartModal.waitVisible();
    await cartModal.openCart();

    const rows = await cartPage.readRows();
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe(first.name);
    expect(rows[0].total).toBe(first.price);

    /* The journey cleans up by design, so a mid-journey failure still leaves
       a predictable state and no teardown hook is needed. */
    await cartPage.deleteRowByName(first.name);
    await expect(cartPage.emptyBlock).toBeVisible();
  });

  test('TC-W21-004 journey: category filter, add from the filtered grid, verify @regression @e2e @cart @parallel-unsafe', async ({
    homePage,
    productsPage,
    cartModal,
    cartPage,
  }) => {
    await homePage.open();
    const subCategory = await homePage.categories.openFirstSubCategory('Women');

    const heading = (await productsPage.headingText()).toLowerCase();
    expect(heading).toContain('women');
    expect(heading).toContain(subCategory.toLowerCase());

    const product = await productsPage.grid.capture(0);
    await productsPage.grid.addToCart(0);
    await cartModal.waitVisible();
    await cartModal.openCart();

    const rows = await cartPage.readRows();
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe(product.name);
    expect(rows[0].total).toBe(product.price);
  });

  test('TC-W21-005 journey: build a multi-product cart and verify every total @regression @e2e @cart @parallel-unsafe', async ({
    productsPage,
    cartModal,
    cartPage,
  }) => {
    /* Four or more cart mutations: each is a round trip plus a modal. */
    test.slow();
    await productsPage.open();
    const catalogue = await productsPage.grid.captureAll();
    const quantities = [1, 2, 3];

    for (let index = 0; index < quantities.length; index++) {
      for (let repeat = 0; repeat < quantities[index]; repeat++) {
        await productsPage.grid.addToCart(index);
        await cartModal.waitVisible();
        await cartModal.dismiss();
      }
    }

    await cartPage.goto();
    const rows = await cartPage.readRows();
    expect(rows).toHaveLength(3);

    /* Soft assertions so a single run reports every incorrect row. */
    for (let index = 0; index < quantities.length; index++) {
      const product = catalogue[index];
      const row = rows.find((r) => r.name === product.name);
      expect.soft(row?.quantity, product.name + ' quantity').toBe(quantities[index]);
      expect.soft(row?.price, product.name + ' unit price carried through').toBe(product.price);
      expect.soft(row?.total, product.name + ' total').toBe(product.price * quantities[index]);
    }
  });

  test('TC-W21-006 journey: guest builds a cart, logs in, cart is preserved @regression @e2e @cart @parallel-unsafe', async ({
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

    await productsPage.open();
    const captured = await addProducts(productsPage.grid, cartModal, [0, 1]);
    await cartPage.goto();
    expect(await cartPage.rowCount()).toBe(2);

    await loginPage.goto();
    await loginPage.login(env.credentials.email, env.credentials.password);
    await expect(cartPage.header.logout).toBeVisible();

    await cartPage.goto();
    const rows = await cartPage.readRows();
    expect(rows.map((r) => r.name).sort()).toEqual(captured.map((p) => p.name).sort());
    for (const row of rows) {
      expect(row.quantity).toBe(1);
      expect(row.total).toBe(captured.find((p) => p.name === row.name)?.price);
    }

    /* The valuable assertion: a merge implemented as an append rather than a
       union produces duplicated rows, and only an explicit check catches it. */
    const names = rows.map((r) => r.name);
    expect(names, 'rows duplicated by the cart merge').toHaveLength(new Set(names).size);
  });

  test('TC-W21-007 journey: guest attempts checkout and is prompted to authenticate @regression @e2e @cart @negative @parallel-unsafe', async ({
    homePage,
    loginPage,
    cartModal,
    cartPage,
    page,
  }) => {
    await homePage.open();
    const product = await homePage.grid.capture(0);
    await homePage.grid.addToCart(0);
    await cartModal.waitVisible();
    await cartModal.openCart();

    await cartPage.clickCheckout();

    await expect(cartPage.checkoutModal).toBeVisible();
    await expect(page, 'the checkout navigation also proceeded').toHaveURL(
      new RegExp(paths.cart + '$'),
    );

    await clickAndWaitForUrl(page, cartPage.registerLoginLink, new RegExp(paths.login));
    await expect(loginPage.emailInput).toBeAttached();

    /* Users notice immediately when the cart does not survive the redirect. */
    await cartPage.goto();
    expect(await cartPage.rowNames()).toEqual([product.name]);
  });

  test('TC-W21-008 journey: full traversal of the three pages with no console errors @regression @e2e', async ({
    homePage,
    productsPage,
    cartModal,
    cartPage,
    consoleErrors,
  }) => {
    const started = Date.now();

    await homePage.open();
    await expect(homePage.featuresTitle).toBeVisible();

    await homePage.header.goToProducts();
    await expect(productsPage.title).toBeVisible();

    await productsPage.search(searchTerms.partial[0]);
    await productsPage.expectSearchResultView();

    await productsPage.open();
    await productsPage.categories.openFirstSubCategory('Women');
    await expect(productsPage.title).toBeVisible();

    const product = await productsPage.grid.capture(0);
    await productsPage.grid.addToCart(0);
    await cartModal.waitVisible();
    await cartModal.openCart();
    await expect(cartPage.table).toBeVisible();

    /* The session ends with an empty cart. */
    await cartPage.deleteRowByName(product.name);
    await expect(cartPage.emptyBlock).toContainText(expectedText.cartEmpty);

    /* Collected once at the end rather than per page: each entry carries its
       own source URL, so failures are still attributable. */
    const errors = consoleErrors.applicationErrors();
    expect(errors, 'severe console entries:\n' + formatConsoleEntries(errors)).toHaveLength(0);

    await test.info().attach('traversal-duration-ms', {
      body: String(Date.now() - started),
      contentType: 'text/plain',
    });
  });
});
