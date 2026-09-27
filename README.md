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
| `npm run test:smoke` | `tests/smoke` |
| `npm run test:regression` | `tests/regression` |
| `npm run test:ui` | UI specs on Chromium |
| `npm run test:headed` | Chromium with a visible browser |
| `npm run test:debug` | Playwright Inspector |
| `npm run report` | Opens the last HTML report |

Filter by tag:

```bash
npx playwright test --grep @smoke
npx playwright test --grep-invert @regression
```

## Environments

`ENV` selects which config module loads — `qa` (default), `staging` or `prod`.

```bash
npm run test:staging
# or
ENV=prod npx playwright test
```

Each environment's URLs and credentials come from `.env`, read by [config/env.config.ts](config/env.config.ts).
`.env` is git-ignored; CI supplies the same values as repository secrets.

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

`base.fixture` provides `homePage` (page objects), `api` (request helper) and `env` (current config).
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
