# quaestor-ledger.github.io

GitHub Pages landing site for **Quaestor: Love the Ledge** — a multi-tenant AR/AP ledger that observes, records, and proves, and never moves money.

Served at https://quaestor-ledger.github.io from the compiled Astro artifact in `dist/`. The canonical page source is `src/pages/index.astro`; styles live in `src/styles/global.css`. See [AGENTS.md](AGENTS.md) for repo rules.

## Search indexing

`public/robots.txt` explicitly allows crawling the public marketing site and points to `public/sitemap.xml`, which lists only the canonical HTTPS landing URL. These static files are copied into the Astro build; `tests/site-contract.test.mjs` checks both production artifacts and their agreement with the canonical page URL. No login, tenant-specific or private application URL is included in the sitemap.
