import { Locator, Page, expect } from '@playwright/test';

/**
 * Login / Signup page (/login).
 * Locators live at the top, actions below, assertions last.
 */
export class LoginPage {
  readonly page: Page;

  /* Login form */
  readonly loginHeading: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly loginError: Locator;

  /* Signup form — same page, left column */
  readonly signupHeading: Locator;
  readonly signupName: Locator;
  readonly signupEmail: Locator;
  readonly signupButton: Locator;
  readonly signupError: Locator;

  constructor(page: Page) {
    this.page = page;

    this.loginHeading = page.locator('.login-form h2');
    this.emailInput = page.locator('[data-qa="login-email"]');
    this.passwordInput = page.locator('[data-qa="login-password"]');
    this.loginButton = page.locator('[data-qa="login-button"]');
    this.loginError = page.locator('.login-form p');

    this.signupHeading = page.locator('.signup-form h2');
    this.signupName = page.locator('[data-qa="signup-name"]');
    this.signupEmail = page.locator('[data-qa="signup-email"]');
    this.signupButton = page.locator('[data-qa="signup-button"]');
    this.signupError = page.locator('.signup-form p');
  }

  async goto(): Promise<void> {
    await this.page.goto('/login');
  }

  async fillCredentials(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
  }

  async login(email: string, password: string): Promise<void> {
    await this.fillCredentials(email, password);
    await this.loginButton.click();
  }

  /** Submits whatever is currently in the form, including nothing. */
  async submit(): Promise<void> {
    await this.loginButton.click();
  }

  /**
   * The browser's own required-field state for an input.
   * Empty-field validation here is HTML5, not a server message.
   */
  async validationState(field: Locator): Promise<{ valid: boolean; message: string }> {
    return field.evaluate((el: HTMLInputElement) => ({
      valid: el.checkValidity(),
      message: el.validationMessage,
    }));
  }

  async expectLoaded(): Promise<void> {
    await expect(this.loginHeading).toHaveText(/Login to your account/i);
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.loginButton).toBeVisible();
  }

  async expectLoginFailed(): Promise<void> {
    await expect(this.loginError).toHaveText(/Your email or password is incorrect!/i);
    await expect(this.page).toHaveURL(/\/login/);
  }
}
