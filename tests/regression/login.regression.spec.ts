import { test, expect } from '../../fixtures/base.fixture';
import { users, endpoints } from '../../data/testData';

/** Every login test starts signed out — the stored session would skip the form. */
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Login @regression', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('TC_LOGIN_01 — login form UI is complete', async ({ loginPage, page }) => {
    await loginPage.expectLoaded();

    await expect(loginPage.emailInput).toHaveAttribute('type', 'email');
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
    await expect(loginPage.emailInput).toBeEditable();
    await expect(loginPage.passwordInput).toBeEditable();
    await expect(loginPage.loginButton).toBeEnabled();

    // The signup half of the page must still be reachable.
    await expect(loginPage.signupHeading).toHaveText(/New User Signup!/i);
    await expect(page).toHaveTitle(/Automation Exercise/i);
  });

  test('TC_LOGIN_03 — valid email with invalid password shows an error', async ({
    loginPage,
    homePage,
    env,
  }) => {
    test.skip(!env.credentials.email, 'No account email configured');

    await loginPage.login(env.credentials.email, users.login.wrongPassword);

    await loginPage.expectLoginFailed();
    await expect(homePage.loggedInAs).toHaveCount(0);
    await expect(homePage.logoutLink).toHaveCount(0);
    // The form stays put so the user can retry.
    await expect(loginPage.loginButton).toBeVisible();
  });

  test('TC_LOGIN_04 — unregistered email with a valid password shows an error', async ({
    loginPage,
    homePage,
    env,
  }) => {
    await loginPage.login(users.login.unregisteredEmail, env.credentials.password || 'Passw0rd!23');

    await loginPage.expectLoginFailed();
    await expect(homePage.loggedInAs).toHaveCount(0);
  });

  test('TC_LOGIN_05 — empty fields are blocked by required-field validation', async ({
    loginPage,
    page,
  }) => {
    await loginPage.submit();

    // Nothing is submitted: still on /login, no server-side error rendered.
    await expect(page).toHaveURL(/\/login/);
    await expect(loginPage.loginError).toHaveCount(0);

    const email = await loginPage.validationState(loginPage.emailInput);
    expect(email.valid).toBe(false);
    expect(email.message).not.toBe('');
  });

  test('TC_LOGIN_05 — empty password alone is blocked', async ({ loginPage, page }) => {
    await loginPage.emailInput.fill(users.login.wellFormedEmail);
    await loginPage.submit();

    await expect(page).toHaveURL(/\/login/);

    const email = await loginPage.validationState(loginPage.emailInput);
    const password = await loginPage.validationState(loginPage.passwordInput);
    expect(email.valid).toBe(true);
    expect(password.valid).toBe(false);
  });

  test('TC_LOGIN_06 — password characters are masked', async ({ loginPage }) => {
    const secret = 'Passw0rd!23';
    await loginPage.passwordInput.fill(secret);

    // type=password is what masks the characters; the value stays readable to JS.
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
    await expect(loginPage.passwordInput).toHaveValue(secret);

    // The typed secret must not leak into the serialised markup.
    const serialised = await loginPage.passwordInput.evaluate((el) => ({
      valueAttribute: el.getAttribute('value'),
      outerHTML: el.outerHTML,
    }));
    expect(serialised.valueAttribute || '').toBe('');
    expect(serialised.outerHTML).not.toContain(secret);
  });

  test('TC_LOGIN_07 — a well-formed email is accepted without a validation error', async ({
    loginPage,
  }) => {
    await loginPage.emailInput.fill(users.login.wellFormedEmail);

    await expect(loginPage.emailInput).toHaveValue(users.login.wellFormedEmail);
    const state = await loginPage.validationState(loginPage.emailInput);
    expect(state.valid).toBe(true);
    expect(state.message).toBe('');
  });

  for (const malformed of users.login.malformedEmails) {
    test(`TC_LOGIN_07 — malformed email "${malformed}" fails field validation`, async ({
      loginPage,
    }) => {
      await loginPage.emailInput.fill(malformed);
      await loginPage.passwordInput.fill('Passw0rd!23');
      await loginPage.submit();

      const state = await loginPage.validationState(loginPage.emailInput);
      expect(state.valid).toBe(false);
    });
  }

  test('TC_LOGIN_08 — Login button submits the form', async ({ loginPage, env, page }) => {
    test.skip(!env.credentials.email, 'No account email configured');

    await loginPage.fillCredentials(env.credentials.email, users.login.wrongPassword);
    await expect(loginPage.loginButton).toBeEnabled();

    // A POST to /login proves the click reached the server, whatever the outcome.
    const [request] = await Promise.all([
      page.waitForRequest((r) => r.url().includes('/login') && r.method() === 'POST'),
      loginPage.submit(),
    ]);
    expect(request.method()).toBe('POST');
  });

  test('TC_LOGIN_09 — valid credentials log in, and logout ends the session', async ({
    loginPage,
    homePage,
    env,
    page,
  }) => {
    test.skip(
      !env.credentials.email || !env.credentials.password,
      'No credentials configured — set QA_USER_EMAIL / QA_USER_PASSWORD in .env',
    );

    await loginPage.login(env.credentials.email, env.credentials.password);

    await expect(homePage.loggedInAs).toBeVisible();
    await expect(homePage.logoutLink).toBeVisible();
    await expect(homePage.signupLoginLink).toHaveCount(0);
    await expect(page).toHaveURL(/automationexercise\.com\/?$/);

    await homePage.logoutLink.click();
    await expect(page).toHaveURL(/\/login/);
    await expect(homePage.signupLoginLink).toBeVisible();
  });

  test('TC_LOGIN_09 — the API agrees the account exists', async ({ api, env }) => {
    test.skip(
      !env.credentials.email || !env.credentials.password,
      'No credentials configured — set QA_USER_EMAIL / QA_USER_PASSWORD in .env',
    );

    const response = await api.post(endpoints.verifyLogin, {
      email: env.credentials.email,
      password: env.credentials.password,
    });
    const body = await api.expectResponseCode(response, 200);
    expect(body.message).toMatch(/User exists!/i);
  });
});
