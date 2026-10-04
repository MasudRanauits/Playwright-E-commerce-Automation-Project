import { test, expect, GUEST_SESSION } from '../../fixtures/workflow.fixture';
import {
  expectedText,
  malformedEmails,
  scriptPayload,
  timeouts,
  uniqueSubscriberEmail,
} from '../../config/test.config';
import { noDialogAppeared } from '../../utils/browser.helper';

/**
 * WF-08 — Newsletter Subscription from Home.
 *
 * The negative cases assert on the input's own validity state rather than on
 * the browser's validation message: that message differs between Chrome,
 * Firefox and Safari, so a text assertion fails on two browsers for no reason
 * that has anything to do with the application.
 */
test.use({ storageState: GUEST_SESSION });

test.describe('WF-08 Newsletter Subscription from Home', () => {
  test.beforeEach(async ({ homePage }) => {
    await homePage.open();
    await homePage.subscription.reveal();
  });

  test('TC-W08-001 the subscription control renders in the home page footer @regression @ui', async ({
    homePage,
  }) => {
    await expect(homePage.subscription.title).toBeVisible();
    await expect(homePage.subscription.email).toBeVisible();
    await expect(homePage.subscription.email).toBeEnabled();
    await expect(homePage.subscription.submit).toBeVisible();
    await expect(homePage.subscription.submit).toBeEnabled();

    const placeholder = await homePage.subscription.email.getAttribute('placeholder');
    expect(placeholder, 'email input placeholder').toBeTruthy();
  });

  test('TC-W08-002 subscribe with a valid unique email address @smoke @regression', async ({
    homePage,
  }) => {
    /* A fresh address per run so repeated executions never collide. */
    await homePage.subscription.subscribe(uniqueSubscriberEmail());

    await expect(homePage.subscription.success).toBeVisible();
    await expect(homePage.subscription.success).toContainText(expectedText.subscriptionSuccess);
    await expect(homePage.subscription.email).toHaveValue('');
  });

  test('TC-W08-003 an empty submission is blocked by field validation @regression @negative', async ({
    homePage,
    page,
  }) => {
    const urlBefore = page.url();
    await expect(homePage.subscription.email).toHaveValue('');

    await homePage.subscription.submit.click();

    const validity = await homePage.subscription.validity();
    expect(validity.valid, 'validity state of an empty required field').toBe(false);
    expect(await homePage.subscription.successIsVisible(), 'success alert shown').toBe(false);
    expect(page.url(), 'the page navigated on an invalid submission').toBe(urlBefore);
  });

  test('TC-W08-004 malformed email addresses are rejected @regression @negative @data', async ({
    homePage,
  }) => {
    const wronglyAccepted: string[] = [];

    for (const value of malformedEmails) {
      await homePage.subscription.email.fill('');
      await homePage.subscription.email.fill(value);
      await homePage.subscription.submit.click();

      const validity = await homePage.subscription.validity();
      const accepted = validity.valid || (await homePage.subscription.successIsVisible());
      if (accepted) wronglyAccepted.push(value);

      await homePage.subscription.email.fill('');
    }

    /* Naming the offending value turns five identical failures into one
       immediately actionable report. */
    expect(wronglyAccepted, 'malformed addresses the field accepted').toEqual([]);
  });

  test('TC-W08-005 a repeated subscription with the same address is handled gracefully @regression @negative', async ({
    homePage,
    page,
  }) => {
    const address = uniqueSubscriberEmail();

    await homePage.subscription.subscribe(address);
    await expect(homePage.subscription.success).toBeVisible();

    await page.reload({ waitUntil: 'domcontentloaded' });
    await homePage.subscription.reveal();
    await homePage.subscription.subscribe(address);

    /* Either documented outcome is acceptable; a silent no-op is the defect. */
    const alert = page.locator('#success-subscribe');
    await expect(alert).toBeVisible();
    const text = (await alert.innerText()).toLowerCase();
    expect(
      text.includes('successfully subscribed') || text.includes('already'),
      'feedback text after a repeated subscription: ' + text,
    ).toBe(true);
    await expect(homePage.subscription.email).toBeEnabled();
  });

  test('TC-W08-006 the subscription control can be operated by keyboard alone @regression @ui', async ({
    homePage,
  }) => {
    /* Confirm the focused element is the intended input before typing. */
    await homePage.subscription.subscribeWithKeyboard(uniqueSubscriberEmail());

    await expect(homePage.subscription.success).toBeVisible();
  });

  test('TC-W08-007 a script payload in the subscription field is not executed @regression @negative @security', async ({
    homePage,
    page,
  }) => {
    await homePage.subscription.email.fill(scriptPayload);
    await homePage.subscription.submit.click();

    /* A short explicit wait whose no-dialog outcome is the pass, rather than a
       broad catch that would also swallow a genuine driver failure. */
    expect(await noDialogAppeared(page, timeouts.noAlert), 'a browser alert appeared').toBe(true);

    const injected = await page.locator('.single-widget script').count();
    expect(injected, 'script element created from the payload').toBe(0);
    await expect(homePage.subscription.email).toBeEnabled();
  });
});
