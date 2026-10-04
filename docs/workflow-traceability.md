# Workflow suite — traceability

Maps every case in *Automation Test Case Document — Workflow Based* (WF-01 to
WF-21) to the spec that implements it. Each Playwright test title begins with
its TC ID, so a report row can be traced straight back to the document.

| Workflow | Cases in document | Implemented | Spec |
|---|---|---|---|
| WF-01 Launch and Home Page Load | 6 | 6 | `tests/workflows/wf01-home-load.spec.ts` |
| WF-02 Header Navigation from Home | 8 | 6 (2 already covered) | `tests/workflows/wf02-header-navigation.spec.ts` |
| WF-03 Promotional Slider | 5 | 5 | `tests/workflows/wf03-promotional-slider.spec.ts` |
| WF-04 Category Sidebar Navigation | 7 | 7 | `tests/workflows/wf04-category-sidebar.spec.ts` |
| WF-05 Brand Sidebar Navigation | 5 | 5 | `tests/workflows/wf05-brand-sidebar.spec.ts` |
| WF-06 Features Items and Add to Cart from Home | 10 | 10 | `tests/workflows/wf06-home-add-to-cart.spec.ts` |
| WF-07 Recommended Items and Scroll Utility | 6 | 6 | `tests/workflows/wf07-recommended-scroll.spec.ts` |
| WF-08 Newsletter Subscription from Home | 7 | 7 | `tests/workflows/wf08-home-subscription.spec.ts` |
| WF-09 Products Page Load and Listing Structure | 8 | 8 | `tests/workflows/wf09-products-load.spec.ts` |
| WF-10 Product Search | 12 | 12 | `tests/workflows/wf10-product-search.spec.ts` |
| WF-11 Add to Cart from the Products Listing | 10 | 10 | `tests/workflows/wf11-products-add-to-cart.spec.ts` |
| WF-12 Product Detail Transition Boundary | 5 | 5 | `tests/workflows/wf12-product-detail-boundary.spec.ts` |
| WF-13 Sidebar Filtering from the Products Page | 6 | 6 | `tests/workflows/wf13-products-sidebar-filtering.spec.ts` |
| WF-14 Empty Cart State | 5 | 5 | `tests/workflows/wf14-empty-cart.spec.ts` |
| WF-15 Cart Content Verification | 10 | 10 | `tests/workflows/wf15-cart-content.spec.ts` |
| WF-16 Quantity and Total Calculation | 6 | 6 | `tests/workflows/wf16-quantity-totals.spec.ts` |
| WF-17 Cart Item Removal | 6 | 6 | `tests/workflows/wf17-cart-removal.spec.ts` |
| WF-18 Cart Persistence | 6 | 6 | `tests/workflows/wf18-cart-persistence.spec.ts` |
| WF-19 Proceed to Checkout Boundary | 6 | 6 | `tests/workflows/wf19-checkout-boundary.spec.ts` |
| WF-20 Newsletter Subscription from the Cart Page | 4 | 4 | `tests/workflows/wf20-cart-subscription.spec.ts` |
| WF-21 End-to-End Journeys | 8 | 8 | `tests/workflows/wf21-end-to-end-journeys.spec.ts` |
| **Total** | **146** | **144** | |

## Cases not re-implemented

Two cases were already automated before this suite was written. They are left
where they are rather than duplicated, so there is one place to maintain each
assertion.

| Case | Covered by |
|---|---|
| TC-W02-002 — navigate to Products through the header | `tests/smoke/products.smoke.spec.ts` (TC_005) and `tests/regression/products.regression.spec.ts` |
| TC-W02-007 — the active header item reflects the current page | `tests/regression/products.regression.spec.ts` ("the Products entry is highlighted as the active menu item") |

Both are noted in the header of `wf02-header-navigation.spec.ts`.

## Where things live

| Concern | File |
|---|---|
| Locator repository, keyed by the names the document uses | `data/locators.ts` |
| Budgets, viewports, expected text, payloads, allowed console noise | `config/test.config.ts` |
| Console recording, image decode, overflow, timing, validity | `utils/browser.helper.ts` |
| Shared add-to-cart and teardown flows | `utils/cart.helper.ts` |
| Site-wide behaviour (scroll utility, ready state) | `pages/BasePage.ts` |
| Header, slider, sidebars, grid, modal, carousel, footer | `pages/components/` |
| Cart and product detail page objects | `pages/CartPage.ts`, `pages/ProductDetailPage.ts` |
| Entry point for every workflow spec | `fixtures/workflow.fixture.ts` |

## Running

```bash
npm run test:workflows           # the whole workflow suite
npm run test:workflows -- -g WF-16   # one workflow
npx playwright test --project=chromium -g "TC-W15-004"   # one case
```

The workflow specs run as a guest (`test.use({ storageState: GUEST_SESSION })`)
because each cart case needs an empty cart and WF-02 asserts the guest menu.
A fresh browser context per test gives every cart case an empty cart without a
teardown, so a mid-test failure cannot leak state into the next case.

Cases that need a registered account skip with a clear message when
`QA_USER_EMAIL` / `QA_USER_PASSWORD` are not set; TC-W18-005 needs a second
account in `QA_USER2_EMAIL` / `QA_USER2_PASSWORD`. A missing secret is an
environment condition, not an application defect.

## What the suite currently reports

See [known-defects.md](known-defects.md). Three cases fail against the live
application because the application is wrong, not the test:

| Case | Finding |
|---|---|
| TC-W01-005, TC-W15-009, TC-W21-001, TC-W21-008 | D-01 — stylesheets requested over HTTP from an HTTPS page |
| TC-W10-005 | D-02 — search does not trim surrounding whitespace |
| TC-W13-005 | D-03 — the search control is absent on every filtered listing |

The four `@performance` cases are indicative benchmarks against a shared
public environment; exclude them from a gating run with
`--grep-invert @performance` and read the attached values as a trend.
