# Bug Report — standard format

Copy this file for every new defect: `docs/bugs/BUG-<id>-<short-slug>.md`.
Keep the field names exactly as they are — the summary table is read by the
sprint review, and a renamed row is a row nobody finds.

Screenshots and videos go in `docs/templates/evidence/` (or `docs/bugs/evidence/`
once the report is copied out) and are embedded inline, never attached as a
bare link. A defect without evidence is a claim, not a report.

---

## BUG-000 — <one line, what breaks, not what you expected>

| Field | Value |
|---|---|
| **Bug ID** | BUG-000 |
| **Title** | <short, specific, searchable — "Search ignores leading spaces", not "Search broken"> |
| **Reported by** | <name> |
| **Reported on** | YYYY-MM-DD |
| **Module / Feature** | <Home \| Products \| Search \| Cart \| Checkout \| Login \| API> |
| **Related test case** | TC-WXX-NNN (`tests/workflows/wfXX-<name>.spec.ts`) |
| **Severity** | Critical \| High \| Medium \| Low |
| **Priority** | P1 \| P2 \| P3 \| P4 |
| **Bug type** | Functional \| UI \| Performance \| Security \| Compatibility \| Data |
| **Status** | New \| Open \| In Progress \| Fixed \| Retest \| Closed \| Deferred \| Rejected |
| **Assigned to** | <developer> |
| **Found in build** | <version / commit sha> |
| **Fixed in build** | <version / commit sha> |

### Environment

| | |
|---|---|
| **Application URL** | https://automationexercise.com |
| **Environment** | QA \| Staging \| Production |
| **Browser / version** | Chromium 140.x \| Firefox \| WebKit |
| **OS** | Windows 11 Pro 10.0.26100 |
| **Viewport** | 1280 x 720 |
| **Run type** | Manual \| Automated (`npm run test:workflows -- -g TC-WXX-NNN`) |

### Pre-condition

<State the app must be in before step 1 — logged in as X, cart holds 2 items,
catalogue seeded. Write "None" if the defect reproduces from a cold start.>

### Steps to reproduce

1. <One action per step. Name the exact element and the exact input.>
2. <...>
3. <...>

### Expected result

<What the requirement or the workflow document says must happen. Quote the
document line when there is one.>

### Actual result

<What the application does. Include the exact error text, status code, or
console message — paste it, do not paraphrase.>

```
<console error / API response / stack trace>
```

### Evidence

| Type | File | Shows |
|---|---|---|
| Screenshot | `evidence/BUG-000-01-before.png` | State just before the failing action |
| Screenshot | `evidence/BUG-000-02-failure.png` | The failure, with the defect circled |
| Video | `evidence/BUG-000-run.webm` | Full reproduction |
| Trace | `evidence/BUG-000-trace.zip` | `npx playwright show-trace <file>` |

**Before**

![Before — state prior to the failing action](evidence/BUG-000-01-before.png)

**Failure**

![Failure — actual result, defect marked in red](evidence/BUG-000-02-failure.png)

> Screenshot rules: full page unless the defect is a single control; mark the
> defect with a red box or arrow; keep the URL bar and any error text visible;
> never crop out the timestamp or the build banner.

### Reproducibility

| | |
|---|---|
| **Frequency** | Always \| Intermittent (N of 10 runs) \| Once |
| **Browsers affected** | Chromium / Firefox / WebKit |
| **First seen** | <build or date> |

### Impact

<Who is blocked and from what. One or two sentences — "A user who pastes a
search term with a trailing space sees an empty catalogue and no explanation.">

### Workaround

<What a user or tester can do meanwhile, or "None".>

### Root cause / Fix notes

<Filled by the developer. What was wrong and what changed.>

### Retest result

| | |
|---|---|
| **Retested by** | <name> |
| **Retested on** | YYYY-MM-DD |
| **Build** | <version> |
| **Result** | Pass \| Fail |
| **Evidence** | `evidence/BUG-000-retest.png` |

---

## Severity and priority — how to pick one

| Severity | Means | Example from this suite |
|---|---|---|
| **Critical** | Core flow dead, no workaround, data loss or security hole | Add to cart does nothing on every product |
| **High** | Major feature broken, workaround is painful | Cart total calculates wrong |
| **Medium** | Feature works but behaves wrongly in a real case | Search does not trim surrounding whitespace (D-02) |
| **Low** | Cosmetic, or correct behaviour presented badly | Misaligned label, typo, slow-but-inside-budget page |

| Priority | Means |
|---|---|
| **P1** | Fix now, blocks the release |
| **P2** | Fix in this sprint |
| **P3** | Fix when the area is next touched |
| **P4** | Backlog |

Severity is about the application. Priority is about the schedule. A Low
severity defect on the checkout button can still be P1.

---

## Worked example — a real defect from this suite

## BUG-002 — Search returns nothing when the term has surrounding whitespace

| Field | Value |
|---|---|
| **Bug ID** | BUG-002 (tracked as D-02 in `docs/known-defects.md`) |
| **Title** | Search does not trim leading and trailing whitespace |
| **Reported by** | QA — automation suite |
| **Reported on** | 2026-10-04 |
| **Module / Feature** | Products — Search |
| **Related test case** | TC-W10-005 (`tests/workflows/wf10-product-search.spec.ts`) |
| **Severity** | Medium |
| **Priority** | P2 |
| **Bug type** | Functional |
| **Status** | Open |
| **Assigned to** | Backend |
| **Found in build** | main @ ad105fe |

### Environment

| | |
|---|---|
| **Application URL** | https://automationexercise.com/products |
| **Environment** | Production demo |
| **Browser / version** | Chromium (Playwright 1.63) |
| **OS** | Windows 11 Pro |
| **Run type** | Automated — `npm run test:workflows -- -g TC-W10-005` |

### Pre-condition

None. Reproduces as a guest from a cold start.

### Steps to reproduce

1. Open https://automationexercise.com/products.
2. Type `top` into `#search_product` and click `#submit_search`. Note the
   result count is greater than zero.
3. Clear the field and type `   top   ` — the same keyword with three
   leading and three trailing spaces.
4. Click `#submit_search`.

### Expected result

The same results as step 2. The workflow document requires the server to trim
the term before matching, and explicitly forbids trimming it in the page
object as a workaround.

### Actual result

The searched-products grid renders with zero items. No "no results" message
and no validation hint is shown.

### Evidence

| Type | File | Shows |
|---|---|---|
| Screenshot | `evidence/BUG-002-01-trimmed-term.png` | `top` returns a populated grid |
| Screenshot | `evidence/BUG-002-02-padded-term.png` | `   top   ` returns an empty grid |
| Video | `evidence/BUG-002-run.webm` | Playwright run of TC-W10-005 |

**Trimmed term — works**

![Searching "top" returns a populated product grid](evidence/BUG-002-01-trimmed-term.png)

**Padded term — fails**

![Searching "   top   " returns an empty grid with no message](evidence/BUG-002-02-padded-term.png)

### Reproducibility

| | |
|---|---|
| **Frequency** | Always |
| **Browsers affected** | Chromium, Firefox, WebKit |

### Impact

A user who pastes a product name copied from an email or an invoice — which
almost always carries a trailing space — sees an empty catalogue and no
explanation, and has no way to tell that the space is the cause.

### Workaround

Delete the surrounding spaces manually before searching.

### Root cause / Fix notes

Pending. Trim the term server-side before the match; do not trim it in the
client, or the API keeps the defect.
