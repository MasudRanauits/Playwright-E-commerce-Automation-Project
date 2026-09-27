# E-commerce Automation Project

UI and API test automation for the storefront, built with [Playwright](https://playwright.dev) and TypeScript.

## Requirements

- Node.js 18+
- npm

## Setup

```bash
npm install
npx playwright install
cp .env.example .env   # then fill in credentials
```

## Running tests

| Command | What it runs |
| --- | --- |
| `npm test` | Everything — API + UI on all browsers |
| `npm run test:api` | API specs only (no browser needed) |
| `npm run test:smoke` | Everything tagged `@smoke` |
| `npm run test:regression` | Everything tagged `@regression` |
| `npm run test:login` | The login smoke + regression specs |
| `npm run test:ui` | UI specs on Chromium |
| `npm run test:cross-browser` | `@smoke` on Chromium, Firefox and WebKit |
| `npm run test:headed` | Chromium with a visible browser |
| `npm run test:debug` | Playwright Inspector |
| `npm run report` | Opens the last HTML report |

Filter by tag:

```bash
npx playwright test --grep @smoke
npx playwright test --grep-invert @regression
```

> Passing `--reporter=list` on the command line **replaces** the configured reporters, so
> `reports/` stays empty for that run. Omit it to get the HTML, JSON and JUnit output.

## Login coverage

[tests/smoke/login.smoke.spec.ts](tests/smoke/login.smoke.spec.ts) holds the critical path;
[tests/regression/login.regression.spec.ts](tests/regression/login.regression.spec.ts) holds the rest.

| Case | Covers | Suite |
| --- | --- | --- |
| TC_LOGIN_01 | Email, password and Login button render | smoke + regression |
| TC_LOGIN_03 | Valid email, wrong password → error, not logged in | smoke + regression |
| TC_LOGIN_04 | Unregistered email → error | regression |
| TC_LOGIN_05 | Empty fields blocked by required-field validation | regression |
| TC_LOGIN_06 | Password is masked and never reaches the serialised markup | regression |
| TC_LOGIN_07 | Well-formed email accepted; four malformed ones rejected | regression |
| TC_LOGIN_08 | Login button POSTs the form | regression |
| TC_LOGIN_09 | Valid credentials log in; logout ends the session; API agrees | smoke + regression |

Login specs run signed out — they set `storageState: { cookies: [], origins: [] }` to discard the
session that [tests/auth.setup.ts](tests/auth.setup.ts) stores, since a live session skips the form.

TC_LOGIN_05 and TC_LOGIN_07 assert against the browser's own `checkValidity()` rather than a page
message: the site relies on HTML5 `required` / `type="email"`, so there is no server-rendered error
to match. Only a submitted bad *credential* produces "Your email or password is incorrect!".

## Environments

`ENV` selects which config module loads — `qa` (default), `staging` or `prod`.

```bash
npm run test:staging
# or
ENV=prod npx playwright test
```

Each environment's URLs and credentials come from `.env`, read by [config/env.config.ts](config/env.config.ts).
`.env` is git-ignored; CI supplies the same values as repository secrets.

## Parallelism

Workers default to 2 locally and 1 on CI. Playwright's own default is half the CPU cores, which is
memory-bound rather than CPU-bound against this ad-heavy site — on a 4 GB box, 6 browsers OOM the
machine mid-run. Raise it on a larger machine:

```bash
WORKERS=4 npm test
```

Because the target is a live public demo site that drops requests under load, the suite retries
once locally and twice on CI.

## Project layout

```
tests/
  smoke/        fast, business-critical checks (@smoke)
  regression/   deep functional coverage (@regression)
  api/          endpoint contract tests (@api)
  auth.setup.ts logs in once, saves session to playwright/.auth/user.json
pages/          page objects — locators + actions, no assertions about test intent
fixtures/       Playwright fixtures; specs import from base.fixture.ts
utils/          api / date / file / common helpers
data/           static JSON test data and typed builders
config/         per-environment configuration
reports/        html, json and junit output (git-ignored)
```

## Writing a test

```ts
import { test, expect } from '../../fixtures/base.fixture';

test('home page loads @smoke', async ({ homePage }) => {
  await homePage.goto();
  await homePage.expectLoaded();
});
```

`base.fixture` provides `homePage` / `loginPage` (page objects), `api` (request helper) and `env`
(current config). The `page` fixture also blocks the storefront's ad networks — the Google vignette
(`#google_vignette`) otherwise covers the page and swallows clicks, and its scripts crash WebKit.
Add new page objects in [pages/](pages/) and register them in [fixtures/page.fixtures.ts](fixtures/page.fixtures.ts).

## Conventions

- One spec file per feature area, named `<feature>.<suite>.spec.ts`.
- Tag every test — `@smoke`, `@regression` or `@api` — so CI can slice the suite.
- Locators belong in page objects; assertions belong in specs (except page-level readiness checks).
- No hard-coded credentials or URLs in specs — use `config/` and `data/`.
- Generate unique data with `buildNewUser()` / `randomEmail()` so parallel runs don't collide.

## CI

[.github/workflows/playwright.yml](.github/workflows/playwright.yml) runs the API, smoke and regression suites in
parallel on push, PR, a nightly schedule, and on demand via **Run workflow** (with an environment picker).
Reports upload as build artifacts.
