/**
 * Render a Markdown document to a print-ready PDF using the Chromium that
 * Playwright already installs — no extra dependency, no network.
 *
 *   node scripts/md-to-pdf.js docs/templates/bug-report-template.md
 *   node scripts/md-to-pdf.js docs/templates/*.md -o docs/templates/pdf
 *
 * The converter covers the Markdown subset these documents use: headings,
 * GFM tables (escaped pipes included), fenced code, blockquotes, lists,
 * horizontal rules, images, links, bold and inline code. It is deliberately
 * small — if a document needs more than this, the document is the problem.
 *
 * An image that does not exist on disk renders as a labelled placeholder
 * rather than a broken icon, so a template with no evidence yet still prints
 * as a clean, fillable form.
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

/* ---------------------------------------------------------------- inline */

const escapeHtml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const DATA_URI = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

/** Resolve an image reference to a data URI, or null when it is not on disk. */
function embedImage(src, baseDir) {
  if (/^(https?:|data:)/.test(src)) return src;
  const file = path.resolve(baseDir, src);
  if (!fs.existsSync(file)) return null;
  const mime = DATA_URI[path.extname(file).toLowerCase()];
  if (!mime) return null;
  return `data:${mime};base64,${fs.readFileSync(file).toString('base64')}`;
}

function imageHtml(alt, src, baseDir, block) {
  const resolved = embedImage(src, baseDir);
  if (resolved) {
    const fig = `<img src="${resolved}" alt="${alt}">`;
    return block ? `<figure>${fig}<figcaption>${alt}</figcaption></figure>` : fig;
  }
  /* Not captured yet — print a slot that says what belongs here. */
  return (
    `<div class="shot-missing">` +
    `<div class="shot-label">${alt || 'Screenshot'}</div>` +
    `<div class="shot-path">${src}</div>` +
    `</div>`
  );
}

function inline(text, baseDir) {
  const codes = [];
  let out = text.replace(/`([^`]+)`/g, (_, c) => {
    codes.push(c);
    return `%%C${codes.length - 1}%%`;
  });
  out = escapeHtml(out);
  out = out.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, src) =>
    imageHtml(alt, src, baseDir, false),
  );
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(
    /%%C(\d+)%%/g,
    (_, i) => `<code>${escapeHtml(codes[+i])}</code>`,
  );
  return out;
}

/** Split a table row on unescaped pipes, then unescape the rest. */
function cells(row) {
  const parts = [];
  let cur = '';
  for (let i = 0; i < row.length; i += 1) {
    if (row[i] === '\\' && row[i + 1] === '|') {
      cur += '|';
      i += 1;
    } else if (row[i] === '|') {
      parts.push(cur);
      cur = '';
    } else {
      cur += row[i];
    }
  }
  parts.push(cur);
  if (parts[0].trim() === '') parts.shift();
  if (parts.length && parts[parts.length - 1].trim() === '') parts.pop();
  return parts.map((c) => c.trim());
}

const isTableRow = (l) => l.trimStart().startsWith('|');
const isTableRule = (l) => /^\s*\|[\s:|-]+\|\s*$/.test(l);

/* ----------------------------------------------------------------- block */

function render(md, baseDir) {
  const lines = md.split(/\r?\n/);
  const html = [];
  let i = 0;
  let title = null;

  const para = [];
  const flushPara = () => {
    if (para.length) {
      html.push(`<p>${inline(para.join(' '), baseDir)}</p>`);
      para.length = 0;
    }
  };

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      flushPara();
      i += 1;
      continue;
    }

    /* fenced code */
    if (/^```/.test(line.trim())) {
      flushPara();
      const body = [];
      i += 1;
      while (i < lines.length && !/^```/.test(lines[i].trim())) {
        body.push(lines[i]);
        i += 1;
      }
      i += 1;
      html.push(`<pre><code>${escapeHtml(body.join('\n'))}</code></pre>`);
      continue;
    }

    /* heading */
    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      flushPara();
      const level = heading[1].length;
      const text = inline(heading[2], baseDir);
      if (level === 1 && !title) title = heading[2];
      html.push(`<h${level}>${text}</h${level}>`);
      i += 1;
      continue;
    }

    /* horizontal rule */
    if (/^(-{3,}|\*{3,})\s*$/.test(line.trim())) {
      flushPara();
      html.push('<hr>');
      i += 1;
      continue;
    }

    /* table */
    if (isTableRow(line) && isTableRule(lines[i + 1] || '')) {
      flushPara();
      const head = cells(line);
      i += 2;
      const body = [];
      while (i < lines.length && isTableRow(lines[i])) {
        body.push(cells(lines[i]));
        i += 1;
      }
      const headerIsBlank = head.every((c) => c === '');
      const thead = headerIsBlank
        ? ''
        : `<thead><tr>${head
            .map((c) => `<th>${inline(c, baseDir)}</th>`)
            .join('')}</tr></thead>`;
      const tbody = body
        .map(
          (row) =>
            `<tr>${row
              .map((c) => `<td>${inline(c, baseDir)}</td>`)
              .join('')}</tr>`,
        )
        .join('');
      html.push(
        `<table class="${headerIsBlank ? 'kv' : ''}">${thead}<tbody>${tbody}</tbody></table>`,
      );
      continue;
    }

    /* blockquote */
    if (/^>\s?/.test(line)) {
      flushPara();
      const body = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        body.push(lines[i].replace(/^>\s?/, ''));
        i += 1;
      }
      html.push(`<blockquote>${render(body.join('\n'), baseDir).html}</blockquote>`);
      continue;
    }

    /* list */
    if (/^\s*([-*]|\d+\.)\s+/.test(line)) {
      flushPara();
      const ordered = /^\s*\d+\./.test(line);
      const items = [];
      while (i < lines.length && /^\s*([-*]|\d+\.)\s+/.test(lines[i])) {
        let item = lines[i].replace(/^\s*([-*]|\d+\.)\s+/, '');
        i += 1;
        /* continuation lines of the same item */
        while (
          i < lines.length &&
          lines[i].trim() &&
          /^\s{2,}\S/.test(lines[i]) &&
          !/^\s*([-*]|\d+\.)\s+/.test(lines[i])
        ) {
          item += ` ${lines[i].trim()}`;
          i += 1;
        }
        items.push(`<li>${inline(item, baseDir)}</li>`);
      }
      const tag = ordered ? 'ol' : 'ul';
      html.push(`<${tag}>${items.join('')}</${tag}>`);
      continue;
    }

    /* standalone image becomes a figure */
    const img = line.trim().match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (img) {
      flushPara();
      html.push(imageHtml(img[1], img[2], baseDir, true));
      i += 1;
      continue;
    }

    para.push(line.trim());
    i += 1;
  }
  flushPara();
  return { html: html.join('\n'), title };
}

/* ------------------------------------------------------------------- css */

const CSS = `
:root {
  --ink: #16191d;
  --muted: #5b646e;
  --rule: #d7dce2;
  --soft: #f4f6f8;
  --accent: #1f4f82;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  color: var(--ink);
  font: 10.5pt/1.55 "Segoe UI", "Helvetica Neue", Arial, sans-serif;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
h1, h2, h3, h4 { line-height: 1.25; break-after: avoid; margin: 0 0 .5em; }
h1 {
  font-size: 21pt;
  padding-bottom: .35em;
  border-bottom: 2.5pt solid var(--accent);
  margin-bottom: .8em;
}
h2 {
  font-size: 14pt;
  color: var(--accent);
  margin-top: 1.9em;
  padding-bottom: .25em;
  border-bottom: .75pt solid var(--rule);
}
h3 { font-size: 11.5pt; margin-top: 1.5em; }
h4 { font-size: 10.5pt; margin-top: 1.2em; color: var(--muted); }
p { margin: 0 0 .75em; orphans: 3; widows: 3; }
a { color: var(--accent); text-decoration: none; }
hr { border: 0; border-top: .75pt solid var(--rule); margin: 1.6em 0; }
ul, ol { margin: 0 0 .85em; padding-left: 1.3em; }
li { margin-bottom: .3em; }
code {
  font-family: "Cascadia Mono", Consolas, "Courier New", monospace;
  font-size: .87em;
  background: var(--soft);
  border: .5pt solid var(--rule);
  border-radius: 2pt;
  padding: .5pt 3pt;
  white-space: pre-wrap;
}
pre {
  background: var(--soft);
  border: .5pt solid var(--rule);
  border-left: 2.5pt solid var(--accent);
  border-radius: 3pt;
  padding: .7em .9em;
  margin: 0 0 1em;
  overflow-wrap: anywhere;
  break-inside: avoid;
}
pre code { background: none; border: 0; padding: 0; font-size: .85em; }
blockquote {
  margin: 0 0 1em;
  padding: .6em .9em;
  background: #fbfaf4;
  border-left: 2.5pt solid #d9b84d;
  border-radius: 0 3pt 3pt 0;
  color: #4a4435;
  break-inside: avoid;
}
blockquote p:last-child { margin-bottom: 0; }
table {
  width: 100%;
  border-collapse: collapse;
  margin: 0 0 1.1em;
  font-size: 9.5pt;
  break-inside: auto;
}
thead { display: table-header-group; }
tr { break-inside: avoid; }
th, td {
  border: .5pt solid var(--rule);
  padding: 5pt 7pt;
  text-align: left;
  vertical-align: top;
}
th { background: var(--accent); color: #fff; font-weight: 600; }
tbody tr:nth-child(even) { background: #f8fafb; }
table.kv td:first-child { width: 28%; background: var(--soft); }
figure { margin: 0 0 1.2em; break-inside: avoid; text-align: center; }
figure img { max-width: 100%; border: .5pt solid var(--rule); border-radius: 3pt; }
figcaption { font-size: 8.5pt; color: var(--muted); margin-top: .4em; font-style: italic; }
.shot-missing {
  border: 1pt dashed #b7c0ca;
  border-radius: 4pt;
  background: repeating-linear-gradient(45deg, #fbfcfd, #fbfcfd 9pt, #f3f5f8 9pt, #f3f5f8 18pt);
  padding: 20pt 12pt;
  margin: 0 0 1.2em;
  text-align: center;
  break-inside: avoid;
}
.shot-label { font-size: 9.5pt; font-weight: 600; color: #4a5560; }
.shot-path {
  font-family: "Cascadia Mono", Consolas, monospace;
  font-size: 8pt;
  color: #808b96;
  margin-top: .35em;
}
.shot-missing::before {
  content: "paste screenshot here";
  display: block;
  font-size: 7.5pt;
  letter-spacing: .09em;
  text-transform: uppercase;
  color: #9aa4ae;
  margin-bottom: .5em;
}
`;

/* ------------------------------------------------------------------- run */

function page(doc, title, source) {
  return `<!doctype html><html><head><meta charset="utf-8">
<title>${escapeHtml(title)}</title><style>${CSS}</style></head>
<body><main>${doc}</main>
<!-- generated from ${escapeHtml(source)} --></body></html>`;
}

async function main() {
  const argv = process.argv.slice(2);
  const outIdx = argv.findIndex((a) => a === '-o' || a === '--out');
  const outDir = outIdx === -1 ? null : argv[outIdx + 1];
  const inputs = argv.filter(
    (a, n) => n !== outIdx && n !== outIdx + 1 && !a.startsWith('-'),
  );

  if (!inputs.length) {
    console.error('usage: node scripts/md-to-pdf.js <file.md> [...] [-o <dir>]');
    process.exit(1);
  }

  const browser = await chromium.launch();
  const tab = await browser.newPage();

  for (const input of inputs) {
    const src = path.resolve(input);
    const md = fs.readFileSync(src, 'utf8');
    const baseDir = path.dirname(src);
    const { html, title } = render(md, baseDir);
    const name = title || path.basename(src, '.md');
    const dest = path.join(
      outDir ? path.resolve(outDir) : baseDir,
      `${path.basename(src, '.md')}.pdf`,
    );
    fs.mkdirSync(path.dirname(dest), { recursive: true });

    await tab.setContent(page(html, name, path.basename(src)), {
      waitUntil: 'load',
    });
    await tab.pdf({
      path: dest,
      format: 'A4',
      printBackground: true,
      margin: { top: '18mm', bottom: '18mm', left: '15mm', right: '15mm' },
      displayHeaderFooter: true,
      headerTemplate: `<div style="font:7pt 'Segoe UI',Arial;color:#8d969f;width:100%;padding:0 15mm;">
        <span>${escapeHtml(name)}</span></div>`,
      footerTemplate: `<div style="font:7pt 'Segoe UI',Arial;color:#8d969f;width:100%;padding:0 15mm;display:flex;justify-content:space-between;">
        <span>E-commerce Automation Project — QA</span>
        <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span></div>`,
    });

    console.log(`${path.relative(process.cwd(), src)}  ->  ${path.relative(process.cwd(), dest)}`);
  }

  await browser.close();
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

/* Exported so a preview or a test can render the same HTML this PDF uses. */
module.exports = { render, page };
