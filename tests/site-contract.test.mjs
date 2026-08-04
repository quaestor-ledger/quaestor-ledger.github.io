import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const css = await readFile(new URL("../styles.css", import.meta.url), "utf8");

function matches(pattern) {
  return [...html.matchAll(pattern)];
}

test("document has a stable title, language, and one descriptive h1", () => {
  assert.match(html, /<html\s+lang="en">/i);
  assert.match(html, /<title>Quaestor Ledger[^<]*<\/title>/i);
  const headings = matches(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi);
  assert.equal(headings.length, 1);
  assert.match(headings[0][1], /Observe, record, and prove/i);
});

test("search and sharing metadata are HTTPS and non-empty", () => {
  assert.match(
    html,
    /<meta\s+name="description"\s+content="[^"]{80,}"\s*\/>/i,
  );
  assert.match(
    html,
    /<link\s+rel="canonical"\s+href="https:\/\/quaestor-ledger\.github\.io\/"\s*\/>/i,
  );
  assert.doesNotMatch(html, /(?:href|src)="http:\/\//i);
});

test("page is script-free and ships a restrictive content security policy", () => {
  assert.equal(matches(/<script\b/gi).length, 0);
  assert.doesNotMatch(html, /\son[a-z]+\s*=/i);
  assert.match(html, /Content-Security-Policy/i);
  assert.match(html, /default-src 'none'/i);
  assert.match(html, /style-src 'self'/i);
  assert.match(html, /frame-ancestors 'none'/i);
});

test("primary landmarks and keyboard navigation are explicit", () => {
  assert.equal(matches(/<main\b/gi).length, 1);
  assert.equal(matches(/<header\b/gi).length, 1);
  assert.equal(matches(/<footer\b/gi).length, 1);
  assert.match(html, /class="skip-link"\s+href="#main-content"/i);
  assert.match(html, /<nav\s+aria-label="Primary navigation">/i);
  assert.match(html, /id="main-content"/i);
});

test("all same-page links target existing ids", () => {
  const ids = new Set(matches(/\sid="([^"]+)"/gi).map((match) => match[1]));
  const fragments = matches(/href="#([^"]+)"/gi).map((match) => match[1]);
  assert.ok(fragments.length >= 3);
  for (const fragment of fragments) {
    assert.ok(ids.has(fragment), `missing target id for #${fragment}`);
  }
});

test("external links do not open untrusted auxiliary browsing contexts", () => {
  assert.equal(matches(/target="_blank"/gi).length, 0);
  for (const [, href] of matches(/href="(https:[^"]+)"/gi)) {
    const url = new URL(href);
    assert.ok(
      ["github.com", "quaestor-ledger.github.io"].includes(url.hostname),
      `unexpected external hostname: ${url.hostname}`,
    );
  }
});

test("stylesheet is local and includes focus, responsive, and reduced-motion rules", () => {
  assert.match(html, /<link\s+rel="stylesheet"\s+href="\.\/styles\.css"\s*\/>/i);
  assert.match(css, /:focus-visible/);
  assert.match(css, /@media\s*\(max-width:/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.doesNotMatch(css, /@import|url\(\s*["']?https?:/i);
});

test("non-custodial boundary is visible in the rendered copy", () => {
  assert.match(html, /never moves or holds money/i);
  assert.match(html, /identity token never grants access to a tenant by itself/i);
});
