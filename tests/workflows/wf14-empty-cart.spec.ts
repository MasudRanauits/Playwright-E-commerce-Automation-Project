import { test, expect, GUEST_SESSION, addProducts } from '../../fixtures/workflow.fixture';
import { expectedText } from '../../config/test.config';
import { paths } from '../../data/locators';
import { clickAndWaitForUrl } from '../../utils/browser.helper';

/**
 * WF-14 — Empty Cart State.
 *
 * The baseline every cart test starts from and the state every cart test must
 * restore. TC-W14-005 is the reference implementation of the teardown helper
 * (CartPage.clearCart) that the other cart workflows call.
 */
test.use({ storageState: GUEST_SESSION });

test.describe('WF-14 Empty Cart State', () => {
  test('TC-W14-001 open the cart URL in a fresh session and verify the empty state @smoke @regression @cart', async ({
    cartPage,
    page,
  }) => {
    /* Clearing storage is part of this test, not of the generic fixture: the
       case specifically asserts the behaviour of a genuinely empty session. */
    await page.context().clearCookies();
    await page.goto(paths.cart, { waitUntil: 'domcontentloaded' });
    await cartPage.waitForReady();

    await expect(page).toHaveURL(new RegExp(paths.cart + '$'));
    await expect(cartPage.emptyBlock).toBeVisible();
    await expect(cartPage.emptyBlock).toContainText(expectedText.cartEmpty);
    await expect(cartPage.rows).toHaveCount(0);
  });

  test('TC-W14-002 exactly one of the empty state and the cart table is rendered @regression @ui @cart', async ({
    cartPage,
  }) => {
    await cartPage.goto();

    const emptyVisible = await cartPage.isEmptyStateVisible();
    const tableVisible = await cartPage.isTableVisible();

    /* Two separate single-element assertions would both pass against the
       rendering defect where both blocks appear together. */
    expect(
      [emptyVisible, tableVisible].filter(Boolean).length,
      'empty=' + emptyVisible + ' table=' + tableVisible,
    ).toBe(1);
    expect(emptyVisible, 'the empty block is the visible one for an empty session').toBe(true);
  });

  test('TC-W14-003 the empty state link navigates to the products page @regression @navigation @cart', async ({
    cartPage,
    productsPage,
    page,
  }) => {
    await cartPage.goto();
    await expect(cartPage.emptyBlock).toBeVisible();

    await expect(cartPage.emptyLink).toHaveAttribute('href', paths.products);
    await clickAndWaitForUrl(page, cartPage.emptyLink, new RegExp(paths.products + '/?$'));

    await expect(page).toHaveURL(new RegExp(paths.products + '/?$'));
    await expect(productsPage.title).toBeVisible();
    expect(await productsPage.grid.count()).toBeGreaterThan(0);
  });

  test('TC-W14-004 the cart page renders its breadcrumb and heading in the empty state @regression @ui', async ({
    cartPage,
    homePage,
  }) => {
    await cartPage.goto();

    await expect(cartPage.breadcrumb).toBeVisible();
    await expect(cartPage.breadcrumb).toContainText(/cart/i);
    await expect(homePage.header.nav).toBeVisible();
    await cartPage.subscription.reveal();

    /* Targets the layout defect where the table head renders while the body
       is empty. */
    expect(await cartPage.headerCells.count(), 'stray table header row').toBe(0);
  });

  test('TC-W14-005 the empty state is restored after every product is removed @regression @cart @parallel-unsafe', async ({
    productsPage,
    cartModal,
    cartPage,
  }) => {
    await productsPage.open();
    await addProducts(productsPage.grid, cartModal, [0, 1]);

    await cartPage.goto();
    expect(await cartPage.rowCount(), 'rows before the deletions').toBe(2);

    await cartPage.deleteFirstRow();
    expect(await cartPage.rowCount()).toBe(1);
    await cartPage.deleteFirstRow();

    await expect(cartPage.emptyBlock).toBeVisible();
    await expect(cartPage.emptyBlock).toContainText(expectedText.cartEmpty);
    await expect(cartPage.rows).toHaveCount(0);
  });
});
