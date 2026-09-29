// Builds docs/reader.html: all numbered docs in docs/ as one searchable, styled page.
// The Markdown files stay the source of truth; this page is generated and git-ignored.
// Usage: pnpm docs:reader

import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Marked } from "marked";

const here = dirname(fileURLToPath(import.meta.url));
const docsDir = join(here, "..", "..", "docs");
const template = readFileSync(join(here, "template.html"), "utf8");

// Labels shown above each chapter and in the cover index, keyed by file number.
const CHAPTER_INFO = {
  "01": { eyebrow: "PRODUCT NOTES", blurb: "The product and its commitments" },
  "02": { eyebrow: "SYSTEM NOTES", blurb: "How one conversational turn moves" },
  "03": { eyebrow: "BUILD NOTES", blurb: "Day by day, with tangible milestones" },
  "04": { eyebrow: "QUALITY NOTES", blurb: "The conditions for shipping" },
  "05": { eyebrow: "RELEASE NOTES", blurb: "From repository to public URL" },
  "06": { eyebrow: "AUDIT NOTES", blurb: "Every line of the brief, and how we answer it" },
};

const escapeHtml = (s) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const stripTags = (s) => s.replace(/<[^>]+>/g, "");

// Our ids collapse repeated hyphens ("Day 1 · Tuesday" becomes "day-1-tuesday").
const slug = (text) =>
  stripTags(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

// GitHub keeps repeated hyphens. Links written for GitHub use this form, so we map it too.
const githubSlug = (text) =>
  stripTags(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s/g, "-");

const files = readdirSync(docsDir)
  .filter((f) => /^\d\d-.+\.md$/.test(f))
  .sort();

// Pass 1: read every doc and collect its headings, so links between docs can be resolved.
const docs = files.map((file) => {
  const no = file.slice(0, 2);
  const source = readFileSync(join(docsDir, file), "utf8");
  const tokens = new Marked({ gfm: true }).lexer(source);
  const anchors = new Map(); // any anchor a link might use -> our element id
  for (const t of tokens) {
    if (t.type === "heading" && t.depth > 1) {
      const id = `c${no}-${slug(t.text)}`;
      anchors.set(slug(t.text), id);
      anchors.set(githubSlug(t.text), id);
    }
    if (t.type === "html") {
      for (const m of t.raw.matchAll(/id="([^"]+)"/g)) anchors.set(m[1], `c${no}-${m[1]}`);
    }
  }
  return { no, file, tokens, anchors };
});
const byFile = new Map(docs.map((d) => [d.file, d]));

function resolveHref(href, doc) {
  if (/^(https?:|mailto:)/.test(href)) return { href, external: true };
  const [path, frag] = href.split("#");
  const target = path ? byFile.get(path) : doc;
  if (target) {
    if (!frag) return { href: `#chapter-${target.no}` };
    return { href: `#${target.anchors.get(frag) ?? `chapter-${target.no}`}` };
  }
  return { href }; // a repository path such as brand/, relative to docs/
}

// Pass 2: render each doc with the reader's markup.
function renderDoc(doc) {
  let tableCount = 0;
  let taskCount = 0;
  let lastHeading = "";
  const marked = new Marked({ gfm: true });

  marked.use({
    renderer: {
      heading({ tokens, depth, text }) {
        const inner = this.parser.parseInline(tokens);
        const id = `c${doc.no}-${slug(text)}`;
        lastHeading = stripTags(inner);
        const anchor = `<a aria-label="Link to ${escapeHtml(lastHeading)}" class="heading-anchor" href="#${id}">#</a>`;
        return `<h${depth} class="section-heading" id="${id}">${inner}${anchor}</h${depth}>\n`;
      },
      link({ href, title, tokens }) {
        const r = resolveHref(href, doc);
        const attrs = r.external ? ' target="_blank" rel="noopener"' : "";
        const t = title ? ` title="${escapeHtml(title)}"` : "";
        return `<a href="${escapeHtml(r.href)}"${t}${attrs}>${this.parser.parseInline(tokens)}</a>`;
      },
      html({ text }) {
        return text.replace(/id="([^"]+)"/g, (_, id) => `id="c${doc.no}-${id}"`);
      },
      code({ text, lang }) {
        if (lang === "mermaid") {
          const label = `DIAGRAM / ${lastHeading.replace(/^\d+(\.\d+)*\.?\s*/, "").toUpperCase()}`;
          return `<div class="diagram-block"><div class="diagram-bar"><span>${escapeHtml(label)}</span><span class="diagram-hint">Scroll horizontally on smaller screens</span></div><div class="diagram-wrap" role="region" tabindex="0" aria-label="${escapeHtml(lastHeading)} diagram"><pre class="mermaid">${escapeHtml(text)}</pre></div><details class="diagram-source"><summary>View original Mermaid source</summary><pre class="code-block"><code class="language-mermaid">${escapeHtml(text)}</code></pre></details></div>\n`;
        }
        const cls = lang ? ` class="language-${escapeHtml(lang)}"` : "";
        return `<pre class="code-block"><code${cls}>${escapeHtml(text)}</code></pre>\n`;
      },
      table(token) {
        tableCount += 1;
        const labels = token.header.map((c) => stripTags(this.parser.parseInline(c.tokens)) || "Item");
        const head = token.header.map((c) => `<th>${this.parser.parseInline(c.tokens)}</th>`).join("");
        const rows = token.rows
          .map(
            (row) =>
              `<tr>${row.map((c, i) => `<td data-label="${escapeHtml(labels[i] ?? "Item")}">${this.parser.parseInline(c.tokens)}</td>`).join("")}</tr>`,
          )
          .join("\n");
        const title = docs.find((d) => d === doc)?.title ?? "Table";
        return `<div aria-label="${escapeHtml(title)}, table ${tableCount}" class="table-scroll" role="region" tabindex="0"><table class="doc-table"><thead><tr>${head}</tr></thead><tbody>\n${rows}\n</tbody></table></div>\n`;
      },
      list(token) {
        const isTasks = token.items.some((i) => i.task);
        const tag = token.ordered ? "ol" : "ul";
        const items = token.items
          .map((item) => {
            const body = this.parser.parse(
              item.tokens.filter((t) => t.type !== "checkbox"),
              !!item.loose,
            );
            if (!item.task) return `<li>${body}</li>`;
            taskCount += 1;
            const key = `${doc.no}-${taskCount}-${slug(item.text).slice(0, 40)}`;
            const checked = item.checked ? " checked" : "";
            return `<li class="task-list-item"><input class="task-check" type="checkbox" data-task="${escapeHtml(key)}" aria-label="${escapeHtml(stripTags(item.text).slice(0, 80))}"${checked}><span>${body}</span></li>`;
          })
          .join("\n");
        return `<${tag}${isTasks ? ' class="task-list"' : ""}>\n${items}\n</${tag}>\n`;
      },
    },
  });

  // The first heading is the chapter title; the first paragraph is its lead.
  const tokens = [...doc.tokens];
  const titleToken = tokens.splice(
    tokens.findIndex((t) => t.type === "heading" && t.depth === 1),
    1,
  )[0];
  doc.title = titleToken.text.replace(/^\d+\s*·\s*/, "");
  const leadIndex = tokens.findIndex((t) => t.type === "paragraph");
  const leadToken = tokens.splice(leadIndex, 1)[0];
  const lead = marked.parser([leadToken]).replace(/^<p>|<\/p>\s*$/g, "");
  const body = marked.parser(tokens);

  const info = CHAPTER_INFO[doc.no] ?? { eyebrow: "NOTES", blurb: "" };
  return `<section class="chapter" id="chapter-${doc.no}" data-chapter="${doc.no}" aria-labelledby="chapter-${doc.no}-title">
<div class="chapter-eyebrow"><span>PART ${doc.no} / ${String(docs.length).padStart(2, "0")}</span><span>${info.eyebrow}</span></div>
<div class="chapter-number" aria-hidden="true">${doc.no}</div>
<div class="chapter-copy"><h1 id="chapter-${doc.no}-title">${escapeHtml(doc.title)}</h1>
<p class="chapter-lead">${lead}</p>
${body}</div></section>`;
}

const chapters = docs.map(renderDoc).join("\n");

const sidebar = docs
  .map((d) => {
    const subs = d.tokens
      .filter((t) => t.type === "heading" && t.depth === 2)
      .map((t) => `<a href="#c${d.no}-${slug(t.text)}">${escapeHtml(stripTags(t.text))}</a>`)
      .join("");
    return `<div class="chapter-nav-group"><a class="chapter-link" href="#chapter-${d.no}" data-nav="${d.no}"><span class="nav-number">${d.no}</span><span class="nav-name">${escapeHtml(d.title)}</span><span class="nav-arrow">↗</span></a><div class="sub-nav">${subs}</div></div>`;
  })
  .join("\n");

const index = docs
  .map(
    (d) =>
      `<a class="index-row" href="#chapter-${d.no}"><span class="index-number">${d.no}</span><span class="index-main"><strong>${escapeHtml(d.title)}</strong><small>${CHAPTER_INFO[d.no]?.blurb ?? ""}</small></span><span class="index-arrow">↗</span></a>`,
  )
  .join("\n");

// Mermaid renders in the browser, in the reader's own colors, and again when the theme changes.
const mermaid = `<script type="module">
import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";
const blocks = [...document.querySelectorAll("pre.mermaid")];
blocks.forEach((b) => (b.dataset.src = b.textContent));
const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
async function draw() {
  mermaid.initialize({
    startOnLoad: false,
    theme: "base",
    fontFamily: "Figtree, system-ui, sans-serif",
    themeVariables: {
      background: css("--surface"), primaryColor: css("--surface"), primaryBorderColor: css("--accent"),
      primaryTextColor: css("--ink"), lineColor: css("--muted"), secondaryColor: css("--paper-2"),
      tertiaryColor: css("--paper"), noteBkgColor: css("--accent-soft"), noteTextColor: css("--ink"),
      actorBkg: css("--surface"), actorBorder: css("--accent"), actorTextColor: css("--ink"),
      signalColor: css("--ink"), signalTextColor: css("--ink"), labelBoxBkgColor: css("--surface"),
      clusterBkg: css("--paper"), clusterBorder: css("--line"), edgeLabelBackground: css("--surface"),
    },
  });
  blocks.forEach((b) => { b.removeAttribute("data-processed"); b.textContent = b.dataset.src; });
  await mermaid.run({ nodes: blocks });
}
draw();
new MutationObserver(draw).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
</script>
<style>.diagram-wrap pre.mermaid{background:transparent;border:0;margin:0;padding:0;text-align:center}.diagram-wrap pre.mermaid svg{max-width:100%;height:auto}</style>`;

// Link-preview tags for /notes: the "Notes from building Sarjy" card. Absolute URLs when the
// production address is known (on Vercel), otherwise relative.
function social() {
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const base = host ? `https://${host}` : "";
  const title = "Notes from building Sarjy";
  const description =
    "How Sarjy was planned and built: requirements, architecture, the build plan, acceptance tests and deployment.";
  const image = `${base}/og/notes-from-building.png`;
  return [
    `<meta property="og:type" content="article">`,
    `<meta property="og:site_name" content="Sarjy">`,
    `<meta property="og:title" content="${title}">`,
    `<meta property="og:description" content="${description}">`,
    `<meta property="og:url" content="${base}/notes">`,
    `<meta property="og:image" content="${image}">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta property="og:image:alt" content="Small things, made to matter. Notes from building Sarjy.">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${title}">`,
    `<meta name="twitter:description" content="${description}">`,
    `<meta name="twitter:image" content="${image}">`,
  ].join("");
}

const now = new Date();
const date = now
  .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
  .toUpperCase();
const dateDots = `${String(now.getDate()).padStart(2, "0")}.${String(now.getMonth() + 1).padStart(2, "0")}.${now.getFullYear()}`;

const html = template
  .replaceAll("{{TOTAL}}", String(docs.length).padStart(2, "0"))
  .replaceAll("{{DATE}}", date)
  .replaceAll("{{DATE_DOTS}}", dateDots)
  .replaceAll("{{VERSION}}", "READER EDITION")
  .replace("{{SIDEBAR}}", sidebar)
  .replace("{{INDEX}}", index)
  .replace(
    "{{NOTICE}}",
    "Generated from the Markdown files in <code>docs/</code>, which stay the source of truth. Styled from Sarjy visual identity v3. Checklist changes here are stored only in your browser, not in the Markdown.",
  )
  .replace("{{CHAPTERS}}", chapters)
  .replace("{{MERMAID}}", mermaid)
  .replace("{{SOCIAL}}", social());

writeFileSync(join(docsDir, "reader.html"), html);

// The same page, served by the app at /notes (git-ignored; rebuilt by every `pnpm build`).
const notesDir = join(here, "..", "..", "public", "notes");
mkdirSync(notesDir, { recursive: true });
writeFileSync(join(notesDir, "index.html"), html);
console.log(`docs/reader.html: ${docs.length} chapters, ${(html.length / 1024).toFixed(0)} KB`);
