# RAED Technologies site — build contract

Static multi-page site. `node build.mjs` → `dist/` (upload `dist/` contents to Hostinger `public_html`).
Agents building in parallel: test with `OUT=/tmp/claude-1000/raed-<yourname> node build.mjs` (never build into `dist/` — others use it).
Preview: `python3 -m http.server <port> -d <outdir>` (pick a unique port 8100-8199). Headless screenshot:
`google-chrome --headless=new --disable-gpu --hide-scrollbars --window-size=390,2400 --screenshot=/path.png http://localhost:<port>/path/`

## Template language (build.mjs)
- `<!-- @include path -->` path relative to `src/`. Recursive.
- `<!-- @each dataKey path -->` renders `path` once per item of `src/data/site.json[dataKey]`. Inside: `{{field}}`, `{{index}}` (01,02…), `{{list:field}}` (array → `<li>`s).
- `{{site.key}}` anywhere: phone, phoneHref, emailInfo, emailDev, emailHr, location, tagline, year, url, name.
- Pages: `src/pages/<name>.html`, first line `<!--meta {"title","description","nav","path"} -->`. nav ∈ home|services|solutions|approach|about|contact. path like `/services/`.
- All URLs root-absolute: `/services/`, `/services/#automation`, `/contact/`, `/assets/...`.
- Content data lives in `src/data/site.json` (services, solutions, steps, principles, reasons, capabilities, inquiryTypes). REUSE IT via @each — do not hardcode copies of that copy. Do not edit site.json except to ADD fields you need (coordinate: only add, never rename/remove).

## CSS / JS
- Bundled in filename order from `src/css/*.css` → `/assets/site.css`, `src/js/*.js` → `/assets/site.js`.
- Already provided (DO NOT EDIT): 00-tokens, 01-base, 02-components, 03-layout-chrome, js/00-core.js.
- Each agent owns ONE css file and at most ONE js file with its assigned prefix. Scope selectors under a section class to avoid collisions (e.g. `.svc-…`, `.hero-…`).
- JS: plain ES2018, IIFE, guard on element presence (`if (!el) return;`), respect `RAED.reducedMotion`. No libraries, no frameworks.

## Design system (use these, don't reinvent)
Tokens: --ink --ink-2 --ink-3 --paper --paper-2 --line --line-dark --text --text-2 --text-3 --text-inv --text-inv-2 --accent (#2F6BFF) --accent-hover --accent-soft --accent-ink --accent-on-dark --font --mono --fs-* --space-section --gutter --radius --radius-lg --ease --dur --shadow --shadow-lg.
Layout: `.container`, `.section` (+ `--gray` `--dark` `--tight`), `.grid .grid--2/3/4`, `.split` (+`--wide-left`), `.section-head` (+`--center` `--row`), `.eyebrow`, `.lead`, `.muted`.
Components: `.btn .btn--primary|--ghost|--dark|--sm`, `.btn-row`, `.link-arrow`, `.card` (+`.card--hover`, `a.card`), `.card__num`, `.icon-box`, `.check-list`, `.chip`, `.page-hero` (inner page dark hero), `[data-reveal]` + `[data-reveal-group]` (scroll fade-up, auto stagger).
Icons: `<svg class="icon" aria-hidden="true"><use href="#i-NAME"/></svg>`. Available NAMEs:
code browser layers workflow spark plug cloud refresh compass grid chart scale shield gauge target arrow-right arrow-up-right mail phone pin check send chevron-down clock
Rhythm: alternate light / gray / dark sections. Dark sections sparing (hero, AI section, CTA band). Not overly dark overall.

## Shared partials (owner → consumers include them)
- `partials/icons.svg` — sprite (icons agent)
- `partials/cta-band.html` — dark "Let's Build Something Meaningful" CTA band, end of every inner page (contact agent)
- `partials/contact-form.html` + `partials/contact-info.html` — form and contact details block (contact agent)
- `components/timeline-step.html` — one step; consumers write `<ol class="timeline" data-timeline><!-- @each steps components/timeline-step.html --></ol>` (approach agent)
- `components/service-card.html` — one card for home services grid (home-services agent)

## Hard content rules
No fake clients, testimonials, stats, numbers-of-anything, awards, certifications, partners, logos, history, founding year, team, social links. Never "startup", "world's best", "industry leader", "cutting-edge", "revolutionary", "game-changing", "unparalleled". Don't name specific technologies/frameworks as the company stack. No industries. AI = accelerator, never replaces engineers. HR email only in footer/careers line, never in main CTA. Copy concise, human, confident.

## Quality bar
Premium, minimal, technical (think Linear/Vercel/Stripe restraint). Semantic HTML, one h1 per page, proper h2/h3, labels, visible focus, AA contrast, 44px tap targets, works 320px→1920px with no horizontal scroll. All links must point to real pages/anchors. Lightweight animation only.
