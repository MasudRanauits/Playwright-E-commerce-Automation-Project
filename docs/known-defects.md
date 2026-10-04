# What the workflow suite reports about the application

Cases listed here fail because the application does something the workflow
document says it must not. The assertions are deliberately **not** relaxed to
make the suite green — reporting these is what the cases are for.

Review this file each sprint and delete an entry once its defect is fixed.

---

## D-01 — Stylesheets are requested over HTTP from an HTTPS page

| | |
|---|---|
| **Reported by** | TC-W01-005, TC-W15-009, TC-W21-001, TC-W21-008 |
| **Severity** | Medium |
| **Status** | Open |

Every page is served over HTTPS but requests three Google Fonts stylesheets
over plain HTTP:

```
http://fonts.googleapis.com/css?family=Roboto:400,300,400italic,500,700,100
http://fonts.googleapis.com/css?family=Open+Sans:400,800,300,600,700
http://fonts.googleapis.com/css?family=Abel
```

Chrome blocks all three as mixed content and logs a severe console error for
each, so the pages render with fallback fonts.

**Why the assertion is not relaxed.** These are the application's own markup
references, not third-party frame noise, so they do not belong in
`allowedConsoleNoiseHosts` in `config/test.config.ts`. Adding them would also
hide the next genuine error from the same source.

**Fix.** Change the three `<link>` hrefs in the site template to `https://`.

---

## D-02 — Search does not trim surrounding whitespace

| | |
|---|---|
| **Reported by** | TC-W10-005 |
| **Severity** | Medium |
| **Status** | Open |

Searching `top` returns results. Searching `"   top   "` — the same keyword
with leading and trailing spaces — returns none. A user who pastes a term
with a trailing space sees an empty catalogue.

The trimming belongs on the server. The workflow document is explicit that it
must not be worked around by trimming the input inside the page object, so
`ProductsPage.search` passes the term through unchanged.

---

## D-03 — The search control is absent on every filtered listing

| | |
|---|---|
| **Reported by** | TC-W13-005 |
| **Severity** | Medium |
| **Status** | Open |

`/products` renders `#search_product` and `#submit_search`. Neither element
exists on a category listing (`/category_products/1`) or a brand listing
(`/brand_products/Polo`), so a user who has filtered the catalogue cannot
search without navigating back to All Products first.

Verified directly against all three URLs; the sidebar and the product grid
render normally on the filtered pages, only the search control is missing.

---

## O-01 — The products page load time sits on the budget (observation)

| | |
|---|---|
| **Reported by** | TC-W09-008 |
| **Severity** | Low — intermittent |
| **Status** | Monitoring |

The 5000 ms budget is breached intermittently: 7974 ms on one run, comfortably
inside the budget on the next. The page's dominant cost is images, and the
case attaches the image request count alongside the timing for exactly this
reason.

Treat the number as a trend, not a gate. The four performance cases
(TC-W01-006, TC-W09-008, TC-W11-010, TC-W17-006) carry a `@performance` tag so
a gating run can exclude them while the values are still recorded every run:

```bash
npx playwright test tests/workflows --grep-invert @performance
```

---

## E-01 — The target throttles a sustained run (environment, not a defect)

The suite takes roughly half an hour against the live public demo, and the
site starts stalling requests part-way through: page loads that take two
seconds on an idle connection occasionally exceed 45 s late in a run. The
same cases pass on retry and pass when run on their own.

Two things in the suite account for it rather than hiding it:

- `BasePage.waitForReady` gates on DOMContentLoaded and treats a late load
  event as non-fatal, because every caller then asserts on a visible element
  the page owns — a slow third-party tail is not an application failure.
- `retries` stays at 1 locally and 2 in CI, as the project already configured.

Two further practices follow from it:

- Do not run another suite against the same host at the same time. The
  contention produces failures that look like application defects and are not.
- Against this public demo, run the suite in workflow-sized chunks rather than
  end to end, for example `npm run test:workflows -- -g WF-16`. A full
  end-to-end pass takes around half an hour and the host starts refusing a
  client well before the end of it; the same cases pass in smaller groups and
  would pass in one pass against an environment that does not throttle.

What this means for a verification result: a clean full-suite number is only
meaningful on an environment that is not rate-limiting the runner. On the
public demo, read a full-suite run together with a re-run of whatever failed,
and treat only the reproducible failures above as findings.
