import { Locator, Page, expect } from '@playwright/test';
import { locators } from '../../data/locators';
import { validityState } from '../../utils/browser.helper';

/**
 * The newsletter subscription control in the footer.
 *
 * It is exposed on both the home page and the cart page. WF-20 asserts the two
 * behave identically, so both use this one implementation — if the two pages
 * ever needed different implementations, that difference is itself the defect.
 */
export class FooterSubscriptionComponent {
  readonly page: Page;

  readonly title: Locator;
  readonly email: Locator;
  readonly submit: Locator;
  readonly success: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.locator(locators.FTR_SUBSCRIPTION_TITLE).filter({ hasText: 'Subscription' });
    /* The id in the markup is spelled "susbscribe_email". Keep the real spelling. */
    this.email = page.locator(locators.FTR_SUBSCRIBE_EMAIL);
    this.submit = page.locator(locators.FTR_SUBSCRIBE_SUBMIT);
    this.success = page.locator(locators.FTR_SUBSCRIBE_SUCCESS);
  }

  async reveal(): Promise<void> {
    await this.title.scrollIntoViewIfNeeded();
    await expect(this.title).toBeVisible();
  }

  async subscribe(address: string): Promise<void> {
    await this.email.fill(address);
    await this.submit.click();
  }

  /** TC-W08-006 — submits with the keyboard alone, no mouse click. */
  async subscribeWithKeyboard(address: string): Promise<void> {
    await this.email.focus();
    await expect(this.email).toBeFocused();
    await this.email.type(address);
    await this.page.keyboard.press('Enter');
  }

  /**
   * TC-W08-003, TC-W08-004 — the field's own validity, not the browser's
   * validation message, which differs between Chrome, Firefox and Safari.
   */
  async validity(): Promise<{ valid: boolean; message: string }> {
    return validityState(this.email);
  }

  async successIsVisible(): Promise<boolean> {
    if ((await this.success.count()) === 0) return false;
    return this.success.isVisible();
  }

  /** The rendered structure, so the cart footer can be compared with the home footer. */
  async structure(): Promise<{ heading: string; placeholder: string; submitText: string }> {
    return {
      heading: (await this.title.innerText()).replace(/\s+/g, ' ').trim(),
      placeholder: (await this.email.getAttribute('placeholder')) ?? '',
      submitText: (await this.submit.innerText()).replace(/\s+/g, ' ').trim(),
    };
  }
}
