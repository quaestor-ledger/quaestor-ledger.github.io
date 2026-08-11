import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PRODUCT_NAME = 'Quaestor';
const distDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const indexPath = path.join(distDir, 'index.html');
const html = readFileSync(indexPath, 'utf8');

test('dist/index.html exists', () => {
  assert.ok(existsSync(indexPath), `expected ${indexPath} to exist`);
});

test('production artifact has a title and product name', () => {
  assert.match(html, /<title>[^<]+<\/title>/);
  assert.ok(html.includes(PRODUCT_NAME));
});

test('production artifact contains no template placeholder leakage', () => {
  assert.ok(!html.includes('undefined'), 'found "undefined" in index.html');
  assert.ok(!/\$\{|\$\d/.test(html), 'found template placeholder');
});

test('same-site href and src references resolve to files in dist', () => {
  const refs = [...html.matchAll(/(?:href|src)="(\/[^"]*)"/g)].map((match) => match[1]);
  for (const ref of refs) {
    if (ref === '/') continue;
    const clean = ref.split(/[?#]/)[0].replace(/^\/+/, '');
    const candidates = [
      path.join(distDir, clean),
      path.join(distDir, clean, 'index.html'),
      path.join(distDir, `${clean}.html`),
    ];
    assert.ok(
      candidates.some((candidate) => existsSync(candidate)),
      `broken same-site reference: ${ref}`,
    );
  }
});

test('styles are emitted as a same-site compiled stylesheet', () => {
  const stylesheet = html.match(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+\.css)"/i)?.[1];
  assert.ok(stylesheet, 'expected a compiled stylesheet link');
  assert.match(stylesheet, /^\/_astro\//);
  assert.ok(existsSync(path.join(distDir, stylesheet.replace(/^\//, ''))));
});
