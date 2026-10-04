import { test, expect, GUEST_SESSION, addProducts } from '../../fixtures/workflow.fixture';
import { expectedText, malformedEmails, uniqueSubscriberEmail } from '../../config/test.config';

/**
 * WF-20 — Newsletter Subscription from the Cart Page.
 *
 * The cart page is the second place the subscription component is exposed.
 * Every case here reuses the exact page object method written for WF-08: if
 * the two pages ever needed different implementations, that difference would
 * itself be the defect worth reporting.
 */
test.use({ storageState: GUEST_SESSION });

test.describe('WF-20 Newsletter Subscription from the Cart Page', () => {
  test('TC-W20-001 the subscription control renders in the cart page footer @regression @ui', async ({
    homePage,
    cartPage,
  }) => {
    await homePage.open();
    await homePage.subscription.reveal();
    const onHome = await homePage.subscription.structure();

    await cartPage.goto();
    await cartPage.subscription.reveal();

    await expect(cartPage.subscription.title).toBeVisible();
    await expect(cartPage.subscription.email).toBeVisible();
    await expect(cartPage.subscription.submit).toBeVisible();
    await expect(cartPage.subscription.email).toHaveValue('');

    /* Comparing against the home page capture is what proves the component is
       shared rather than duplicated with drift between the two pages. */
    expect(await cartPage.subscription.structure()).toEqual(onHome);
  });

  test('TC-W20-002 subscribe successfully from the cart page @regression @cart', async ({
    cartPage,
  }) => {
    await cartPage.goto();
    await cartPage.subscription.reveal();

    await cartPage.subscription.subscribe(uniqueSubscriberEmail());

    await expect(cartPage.subscription.success).toBeVisible();
    /* The same message as on the home page: consistent behaviour across pages. */
    await expect(cartPage.subscription.success).toContainText(expectedText.subscriptionSuccess);
    await expect(cartPage.subscription.email).toHaveValue('');
  });

  test('TC-W20-003 empty and malformed submissions are rejected on the cart page @regression @negative @data', async ({
    cartPage,
  }) => {
    await cartPage.goto();
    await cartPage.subscription.reveal();

    const wronglyAccepted: string[] = [];
    /* The data provider is shared with WF-08, so a new invalid value is added
       in one place and is immediately covered on both pages. */
    for (const value of ['', ...malformedEmails]) {
      await cartPage.subscription.email.fill(value);
      await cartPage.subscription.submit.click();

      const validity = await cartPage.subscription.validity();
      if (validity.valid || (await cartPage.subscription.successIsVisible())) {
        wronglyAccepted.push(value === '' ? '(empty)' : value);
      }
      await cartPage.subscription.email.fill('');
    }

    expect(wronglyAccepted, 'invalid values the cart page footer accepted').toEqual([]);
  });

  test('TC-W20-004 subscribing does not alter the cart contents @regression @cart @parallel-unsafe', async ({
    productsPage,
    cartModal,
    cartPage,
  }) => {
    await productsPage.open();
    await addProducts(productsPage.grid, cartModal, [0, 1]);

    await cartPage.goto();
    const before = await cartPage.readRows();
    expect(before).toHaveLength(2);

    await cartPage.subscription.reveal();
    await cartPage.subscription.subscribe(uniqueSubscriberEmail());
    await expect(cartPage.subscription.success).toBeVisible();

    /* A submission that triggers a reload can legitimately re-render the
       cart, so the rows are re-read rather than held as stale references. */
    await expect(cartPage.table).toBeVisible();
    const after = await cartPage.readRows();

    expect(after).toHaveLength(before.length);
    expect(after.map((r) => r.name + '|' + r.quantity + '|' + r.totalText)).toEqual(
      before.map((r) => r.name + '|' + r.quantity + '|' + r.totalText),
    );
  });
});
