# QA document templates

Standard formats for this project. Copy, do not edit in place — these two
files are the reference, and a filled-in copy left here stops being one.

| Template | Copy to | Use it for |
|---|---|---|
| [bug-report-template.md](bug-report-template.md) | `docs/bugs/BUG-<id>-<slug>.md` | Every defect raised against the application |
| [test-case-template.md](test-case-template.md) | `docs/test-cases/TC-<module>.md` | Designing cases, and the regression sheet that executes them |

## PDF

`pdf/` holds a print-ready A4 copy of each template — hand these to someone who
does not pull the repo, or print them as a fill-in form. Markdown stays the
source; the PDF is generated, so edit the `.md` and regenerate:

```bash
npm run docs:pdf
```

[scripts/md-to-pdf.js](../../scripts/md-to-pdf.js) renders them through the
Chromium that Playwright already installs — no extra dependency and no network.
It takes any Markdown file:

```bash
node scripts/md-to-pdf.js docs/known-defects.md -o docs/templates/pdf
```

An image the document references but that is not on disk prints as a dashed
"paste screenshot here" slot, so a template with no evidence yet still comes
out as a clean form rather than a page of broken icons.

## Evidence

Screenshots, videos and traces live beside the document that references them,
in an `evidence/` folder, and are **embedded inline** — never left as a bare
file path. `docs/templates/evidence/` holds the placeholder images the two
templates point at; a copied document gets its own `evidence/` folder.

Naming: `<ID>-<NN>-<what-it-shows>.png` — `BUG-002-02-padded-term.png`,
`TC-W10-005-01-trimmed.png`. The number orders the sequence, the slug says
what the reader is looking at.

Playwright already produces most of this. After a run:

| Artifact | Where |
|---|---|
| Screenshots | `test-results/<test>/test-failed-1.png` |
| Video | `test-results/<test>/video.webm` |
| Trace | `test-results/<test>/trace.zip` — `npx playwright show-trace <file>` |
| HTML report | `reports/html` — `npm run report` |

Copy the artifact into the document's `evidence/` folder under the naming
scheme above rather than linking into `test-results/`, which `npm run clean`
deletes.

## The three IDs stay in step

A defect, a test case and a Playwright test title all carry the same case ID.

```
TC-W10-005  ──  docs/test-cases/TC-products.md        (the case)
            ──  tests/workflows/wf10-product-search.spec.ts   (the test title)
            ──  docs/bugs/BUG-002-search-whitespace.md        (the defect it found)
```

`docs/known-defects.md` keeps the short, sprint-reviewed list; a full bug
report file carries the steps, environment and evidence behind each entry.
When a defect is fixed, delete the `known-defects.md` entry and set the bug
report's **Status** to Closed with a retest row — do not delete the report.
