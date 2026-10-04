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
| `npm run test:workflows` | The WF-01..WF-21 workflow suite |
| `npm run test:cart` | Everything tagged `@cart` |
| `npm run test:e2e` | The end-to-end journeys (`@e2e`) |
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

## Products menu coverage

[tests/smoke/products.smoke.spec.ts](tests/smoke/products.smoke.spec.ts) holds the critical path;
[tests/regression/products.regression.spec.ts](tests/regression/products.regression.spec.ts) holds the rest.

| Case | Covers | Suite |
| --- | --- | --- |
| TC_005 | Products in the header opens the Products page | smoke + regression |
| TC_005 | The link renders and points at `/products` | regression |
| TC_005 | Landing URL is `/products`, titled "All Products" | regression |
| TC_005 | Grid lists products with prices and View Product links | regression |
| TC_005 | Search box, category panel and brand panel all present | regression |
| TC_005 | Products is highlighted as the active menu item | regression |
| TC_005 | Menu reaches Products from a page other than home | regression |
| TC_005 | Menu works signed in and keeps the session | regression |
| TC_005 | Browser back returns to the page the menu was clicked from | regression |
| TC_005 | Menu and a direct `/products` visit render the same list | regression |
| TC_005 | Listed products match the `productsList` API exactly | regression |

The smoke case runs signed out; the regression cases run with the stored session, so the
cross-page check starts from Contact Us — a signed-in user is redirected away from `/login`.
The active-item assertion matches the site's own marker, an inline `color: orange` on the
current nav entry.

## Workflow coverage (WF-01 to WF-21)

[tests/workflows/](tests/workflows/) implements the workflow-based test case
document: one spec per workflow, one Playwright test per TC ID, with the ID as
the first token of the test title so a report row traces straight back to the
document. [docs/workflow-traceability.md](docs/workflow-traceability.md) has the
full map, including the two cases that were already automated elsewhere and are
therefore not duplicated here.

Three conventions hold across all of them:

- **Expected values are captured, never hard coded.** A cart assertion compares
  against the name and price read from the card at the moment it was added, so a
  catalogue change never produces a false failure.
- **The locator repository is keyed by the document.** [data/locators.ts](data/locators.ts)
  uses the same names the written steps use (HDR_NAV_ITEMS, CART_TABLE, …).
- **Waits are on conditions, never on the clock.** Modal dismissal waits for
  invisibility, removal waits for the row to detach, the scroll utility waits on
  the offset.

The specs run as a guest, and each test gets a fresh context, so every cart case
starts from an empty cart without a teardown. Cases needing a registered account
skip with a clear message when the credentials are absent.

Three cases fail against the live site because the application is wrong, not the
test — mixed-content stylesheets, a search that does not trim its input, and a
missing search control on filtered listings. They are written up in
[docs/known-defects.md](docs/known-defects.md) rather than relaxed. The four
`@performance` cases are indicative benchmarks against a shared public
environment; exclude them from a gating run with `--grep-invert @performance`
and read the attached values as a trend.

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
  workflows/    WF-01..WF-21, one spec per workflow (see docs/)
  api/          endpoint contract tests (@api)
  auth.setup.ts logs in once, saves session to playwright/.auth/user.json
pages/          page objects — locators + actions, no assertions about test intent
  components/   header, slider, sidebars, product grid, modal, footer
fixtures/       Playwright fixtures; specs import from base.fixture.ts
                workflow.fixture.ts is the entry point for the workflow specs
utils/          api / browser / cart / date / file / common helpers
data/           static JSON test data, typed builders, the locator repository
config/         per-environment configuration plus test.config.ts
docs/           traceability and known defects
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
