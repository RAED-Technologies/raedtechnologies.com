# RAED Technologies — website

Static site, no dependencies. Node 20+.

- `npm run build` → builds `dist/`
- `npm run serve` → build + preview at http://localhost:8080
- Push to `main` → GitHub Actions builds and deploys to GitHub Pages (raedtechnologies.com).

Structure: `src/pages` (one file per page), `src/sections`, `src/partials`, `src/components`, `src/data/site.json` (all shared content), `src/css` + `src/js` (bundled in filename order), `src/public` (copied as-is). See `CONTRACT.md` for template syntax and conventions.

Contact form posts to FormSubmit (`site.formAction` / `site.formAjax` in `site.json`).
