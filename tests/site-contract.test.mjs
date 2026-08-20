import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const distUrl = new URL("../dist/", import.meta.url);
const html = await readFile(new URL("index.html", distUrl), "utf8");
const stylesheetHref = html.match(
  /<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["']/i,
)?.[1];
assert.ok(stylesheetHref, "built page must link its compiled stylesheet");
const stylesheetUrl = new URL(stylesheetHref.replace(/^\//, ""), distUrl);
const css = await readFile(stylesheetUrl, "utf8");

function matches(pattern) {
  return [...html.matchAll(pattern)];
}

test("production artifact has a stable title, language, and one descriptive h1", () => {
  assert.match(html, /<html\s+lang="en">/i);
  assert.match(html, /<title>Quaestor: Love the Ledge[^<]*<\/title>/i);
  const headings = matches(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi);
  assert.equal(headings.length, 1);
  assert.match(headings[0][1], /Quaestor:[\s\S]*Love the Ledge/i);
});

test("production search and sharing metadata are HTTPS and non-empty", () => {
  assert.match(html, /<meta\s+name="description"\s+content="[^"]{80,}"\s*\/?>/i);
  assert.match(html, /<link\s+rel="canonical"\s+href="https:\/\/quaestor-ledger\.github\.io\/"\s*\/?>/i);
  assert.match(html, /<meta\s+property="og:title"\s+content="[^"]+"\s*\/?>/i);
  assert.match(html, /<meta\s+property="og:description"\s+content="[^"]+"\s*\/?>/i);
  assert.match(html, /<link\s+rel="icon"\s+href="\/favicon\.svg"/i);
  assert.doesNotMatch(html, /(?:href|src)="http:\/\//i);
});

test("production page is script-free and ships a restrictive content security policy", () => {
  assert.equal(matches(/<script\b/gi).length, 0);
  assert.equal(matches(/<style\b/gi).length, 0);
  assert.doesNotMatch(html, /\son[a-z]+\s*=/i);
  assert.match(html, /Content-Security-Policy/i);
  assert.match(html, /default-src 'none'/i);
  assert.match(html, /style-src 'self'/i);
  assert.match(html, /base-uri 'none'/i);
  assert.match(html, /form-action 'none'/i);
  assert.doesNotMatch(html, /frame-ancestors/i);
});

test("production landmarks and keyboard navigation are explicit", () => {
  assert.equal(matches(/<main\b/gi).length, 1);
  assert.equal(matches(/<header\b/gi).length, 1);
  assert.equal(matches(/<footer\b/gi).length, 1);
  assert.match(html, /class="skip-link"\s+href="#main-content"/i);
  assert.match(html, /<nav\s+aria-label="Primary navigation">/i);
  assert.match(html, /id="main-content"/i);
});

test("hero artwork carries the surf, money, board-star, and quasar-star concept", () => {
  assert.match(html, /<img\b[^>]*src="\/hero-love-the-ledge\.webp"/i);
  assert.match(
    html,
    /alt="[^"]*surfer[^"]*five-point-star surfboard[^"]*banknotes and coins[^"]*quasar star[^"]*"/i,
  );
});

test("all production same-page links target existing ids", () => {
  const ids = new Set(matches(/\sid="([^"]+)"/gi).map((match) => match[1]));
  const fragments = matches(/href="#([^"]+)"/gi).map((match) => match[1]);
  assert.ok(fragments.length >= 3);
  for (const fragment of fragments) {
    assert.ok(ids.has(fragment), `missing target id for #${fragment}`);
  }
});

test("external links stay on the documented project hosts", () => {
  assert.equal(matches(/target="_blank"/gi).length, 0);
  for (const [, href] of matches(/href="(https:[^"]+)"/gi)) {
    const url = new URL(href);
    assert.ok(
      ["github.com", "quaestor-ledger.github.io"].includes(url.hostname),
      `unexpected external hostname: ${url.hostname}`,
    );
  }
});

test("compiled stylesheet includes focus, responsive, and reduced-motion rules", () => {
  assert.match(stylesheetHref, /^\/_astro\/.+\.css$/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /@media\s*\(max-width:/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.doesNotMatch(css, /@import|url\(\s*["']?https?:/i);
});

test("non-custodial boundary is visible in the production copy", () => {
  assert.match(html, /never moves or holds money/i);
  assert.match(html, /identity token never grants access to a tenant by itself/i);
});
