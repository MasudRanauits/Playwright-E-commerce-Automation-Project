import { test, expect } from '../../fixtures/base.fixture';
import { endpoints, products, routes } from '../../data/testData';

/**
 * TC_005 — Verify Products Menu.
 * The smoke run proves the click opens the page; these cover the rest of the
 * navigation contract: the link itself, where it lands, what the page shows,
 * and that it behaves the same from any page and in both session states.
 */
test.describe('Products menu @regression', () => {
  test('TC_005 — the header exposes a Products link pointing at /products', async ({
    homePage,
  }) => {
    await homePage.goto();

    await expect(homePage.productsLink).toBeVisible();
    await expect(homePage.productsLink).toHaveAttribute('href', routes.products);
    await expect(homePage.productsLink).toContainText('Products');
  });

  test('TC_005 — clicking Products navigates to /products and titles the page', async ({
    homePage,
    productsPage,
    page,
  }) => {
    await homePage.goto();
    await homePage.goToProducts();

    await expect(page).toHaveURL(new RegExp(`${routes.products}/?$`));
    await expect(productsPage.title).toHaveText(/All Products/i);
  });

  test('TC_005 — the opened page lists products with prices and View Product links', async ({
    homePage,
    productsPage,
  }) => {
    await homePage.goto();
    await homePage.goToProducts();
    await productsPage.expectLoaded();

    const count = await productsPage.productCount();
    expect(count).toBeGreaterThan(0);

    const first = productsPage.productCards.first();
    await expect(first.locator('.productinfo h2')).toContainText('Rs.');
    await expect(first.locator('.productinfo p')).not.toBeEmpty();
    await expect(productsPage.viewProductLinks).toHaveCount(count);
    await expect(productsPage.viewProductLinks.first()).toHaveAttribute(
      'href',
      /\/product_details\/\d+/,
    );
  });

  test('TC_005 — the opened page carries the search box, categories and brands', async ({
    homePage,
    productsPage,
  }) => {
    await homePage.goto();
    await homePage.goToProducts();

    await expect(productsPage.searchInput).toBeVisible();
    await expect(productsPage.searchButton).toBeVisible();

    for (const category of products.expectedCategories) {
      await expect(productsPage.categoryPanel).toContainText(category);
    }
    for (const brand of products.expectedBrands) {
      await expect(productsPage.brandsPanel).toContainText(brand);
    }
  });

  test('TC_005 — the Products entry is highlighted as the active menu item', async ({
    homePage,
    productsPage,
  }) => {
    await homePage.goto();
    /* On the home page nothing marks Products as current. */
    await expect(homePage.productsLink).not.toHaveAttribute('style', /orange/i);

    await homePage.goToProducts();
    /* The site marks the page you are on by colouring its nav entry orange. */
    await expect(productsPage.navProductsLink).toHaveAttribute('style', /orange/i);
  });

  /* Contact Us, not Login: the stored session redirects a signed-in user away from /login. */
  test('TC_005 — the menu reaches Products from a page other than home', async ({
    productsPage,
    page,
  }) => {
    await page.goto(routes.contactUs);
    await expect(page.locator('.contact-form h2')).toBeVisible();

    await productsPage.openFromHeader();
    await productsPage.expectLoaded();
  });

  test('TC_005 — the menu works the same for a signed-in user', async ({
    homePage,
    productsPage,
    env,
  }) => {
    test.skip(
      !env.credentials.email || !env.credentials.password,
      'No credentials configured — set QA_USER_EMAIL / QA_USER_PASSWORD in .env',
    );

    await homePage.goto();
    await expect(homePage.loggedInAs).toBeVisible();

    await homePage.goToProducts();
    await productsPage.expectLoaded();
    /* Navigation must not cost the session. */
    await expect(homePage.logoutLink).toBeVisible();
  });

  test('TC_005 — browser back returns to the page the menu was clicked from', async ({
    homePage,
    productsPage,
    page,
  }) => {
    await homePage.goto();
    await homePage.goToProducts();
    await productsPage.expectLoaded();

    await page.goBack();
    await homePage.expectLoaded();
  });

  test('TC_005 — the menu and a direct visit open the same page', async ({
    homePage,
    productsPage,
  }) => {
    await homePage.goto();
    await homePage.goToProducts();
    const viaMenu = await productsPage.productNames();

    await productsPage.goto();
    const viaUrl = await productsPage.productNames();

    expect(viaMenu.length).toBeGreaterThan(0);
    expect(viaMenu).toEqual(viaUrl);
  });

  test('TC_005 — the opened page lists exactly what the products API returns', async ({
    homePage,
    productsPage,
    api,
  }) => {
    await homePage.goto();
    await homePage.goToProducts();
    await productsPage.expectLoaded();

    const uiNames = (await productsPage.productNames()).sort();

    const response = await api.get(endpoints.productsList);
    const body = await api.expectResponseCode(response, 200);
    const apiNames = body.products
      .map((p: { name: string }) => p.name.replace(/\s+/g, ' ').trim())
      .sort();

    expect(uiNames.length).toBeGreaterThan(0);
    expect(uiNames).toEqual(apiNames);
  });
});
