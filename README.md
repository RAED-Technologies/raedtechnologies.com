# RAED Technologies — website

Static site, no dependencies. Node 20+.

- `npm run build` → builds `dist/`
- `npm run serve` → build + preview at http://localhost:8080
- `npm run deploy` → builds and force-pushes `dist/` to the `gh-pages` branch, served by GitHub Pages at raedtechnologies.com.

Structure: `src/pages` (one file per page), `src/sections`, `src/partials`, `src/components`, `src/data/site.json` (all shared content), `src/css` + `src/js` (bundled in filename order), `src/public` (copied as-is). See `CONTRACT.md` for template syntax and conventions.

Contact form posts to FormSubmit (`site.formAction` / `site.formAjax` in `site.json`).

Brand kit: `brand-assets/` (logos in SVG/PDF/PNG, social profile + cover images, favicons; see its README). Regenerate with `python tools/brand_assets.py <dir with geist-500.ttf and geist-700.ttf>` (needs `fonttools`, `pillow`, `rsvg-convert`).
