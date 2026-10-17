// Minimal static site builder: partial includes, data loops, page meta. No dependencies.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, cpSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';

const SRC = 'src';
const OUT = process.env.OUT || 'dist';
const data = JSON.parse(readFileSync(join(SRC, 'data/site.json'), 'utf8'));
const read = (p) => readFileSync(join(SRC, p), 'utf8');
const pad = (n) => String(n).padStart(2, '0');

// {{field}}, {{list:field}} (array -> <li>), {{site.key}}
function fill(tpl, ctx = {}) {
  return tpl
    .replace(/\{\{list:(\w+)\}\}/g, (_, k) => (ctx[k] || []).map((v) => `<li>${v}</li>`).join(''))
    .replace(/\{\{site\.(\w+)\}\}/g, (_, k) => data.site[k] ?? '')
    .replace(/\{\{(\w+)\}\}/g, (m, k) => (k in ctx ? ctx[k] : m));
}

// <!-- @include path --> and <!-- @each dataKey path -->
function render(tpl, ctx = {}, depth = 0) {
  if (depth > 10) throw new Error('Include depth exceeded');
  tpl = tpl.replace(/<!--\s*@include\s+(\S+)\s*-->/g, (_, p) => render(read(p), ctx, depth + 1));
  tpl = tpl.replace(/<!--\s*@each\s+(\w+)\s+(\S+)\s*-->/g, (_, key, p) => {
    const items = data[key];
    if (!Array.isArray(items)) throw new Error(`@each: data.${key} is not an array`);
    const part = read(p);
    return items.map((it, i) => render(fill(part, { ...it, index: pad(i + 1) }), ctx, depth + 1)).join('\n');
  });
  return fill(tpl, ctx);
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(join(OUT, 'assets'), { recursive: true });
if (existsSync(join(SRC, 'public'))) cpSync(join(SRC, 'public'), OUT, { recursive: true });

// Bundle CSS / JS in filename order
const bundle = (dir, ext) => readdirSync(join(SRC, dir)).filter((f) => f.endsWith(ext)).sort()
  .map((f) => `/* ${f} */\n${read(join(dir, f))}`).join('\n');
writeFileSync(join(OUT, 'assets/site.css'), bundle('css', '.css'));
writeFileSync(join(OUT, 'assets/site.js'), bundle('js', '.js'));

const layout = read('layout.html');
const version = Date.now().toString(36);
// Write one page: meta {title, description, nav, path, robots?}, content = rendered HTML.
// raw = HTML inserted verbatim after rendering (e.g. article bodies), so it is never template-processed.
function writePage(meta, content, label, raw = '') {
  const canonical = data.site.url + meta.path;
  // meta.robots (e.g. "noindex") replaces the canonical link; otherwise pages are indexable with a self-canonical.
  const headMeta = meta.robots
    ? `  <meta name="robots" content="${meta.robots}">`
    : `  <link rel="canonical" href="${canonical}">`;
  let html = render(layout, { ...meta, content: '%%CONTENT%%', version, canonical, headMeta })
    .replace('%%CONTENT%%', () => content)
    .replace(new RegExp(`data-nav="${meta.nav}"`, 'g'), `data-nav="${meta.nav}" aria-current="page"`);
  const left = html.match(/\{\{[\w:.]+\}\}|<!--\s*@\w+/g);
  if (left) console.warn(`  ! ${label}: unresolved ${[...new Set(left)].join(', ')}`);
  html = html.replace('%%RAW%%', () => raw);
  const outFile = meta.path === '/' ? join(OUT, 'index.html') : join(OUT, meta.path, 'index.html');
  mkdirSync(dirname(outFile), { recursive: true });
  writeFileSync(outFile, html);
  console.log(`built ${outFile}`);
}

for (const file of readdirSync(join(SRC, 'pages')).filter((f) => f.endsWith('.html'))) {
  const raw = read(join('pages', file));
  const m = raw.match(/^<!--meta\s*([\s\S]*?)-->/);
  if (!m) throw new Error(`${file}: missing <!--meta {...} --> header`);
  const meta = JSON.parse(m[1]);
  writePage(meta, render(raw.slice(m[0].length), meta), file);
}

// Blog: content/blog/posts.json + one HTML body per post -> /blog/ index and /blog/<slug>/ articles
const BLOG = 'content/blog';
if (existsSync(join(BLOG, 'posts.json'))) {
  const posts = JSON.parse(readFileSync(join(BLOG, 'posts.json'), 'utf8'));
  const escAttr = (v) => String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  const fmtDate = (d) => new Date(`${d}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  const ctxOf = (p) => ({ ...p, title: escAttr(p.title), excerpt: escAttr(p.excerpt), dateText: fmtDate(p.date), url: `/blog/${p.slug}/` });
  const card = read('blog/card.html');
  const cards = (list) => list.map((p) => fill(card, ctxOf(p))).join('\n');
  const featured = posts.find((p) => p.featured) || posts[0];
  const rest = posts.filter((p) => p !== featured);

  const indexMeta = { title: 'Blog | RAED Technologies', description: 'Practical ideas on software, automation, AI and digital transformation for growing businesses in Bangladesh, from the RAED Technologies team.', nav: 'blog', path: '/blog/' };
  const indexTpl = read('blog/index.html').replace('%%FEATURED%%', () => fill(read('blog/featured.html'), ctxOf(featured))).replace('%%CARDS%%', () => cards(rest));
  writePage(indexMeta, render(indexTpl, indexMeta), 'blog index');

  for (const p of posts) {
    const body = readFileSync(join(BLOG, `${p.slug}.html`), 'utf8');
    const related = posts.filter((x) => x.slug !== p.slug && x.category === p.category).concat(posts.filter((x) => x.slug !== p.slug && x.category !== p.category)).slice(0, 3);
    const ld = JSON.stringify({ '@context': 'https://schema.org', '@type': 'BlogPosting', headline: p.title, description: p.description, datePublished: p.date, author: { '@type': 'Organization', name: 'RAED Technologies' }, publisher: { '@type': 'Organization', name: 'RAED Technologies', logo: { '@type': 'ImageObject', url: `${data.site.url}/logo.png` } }, mainEntityOfPage: `${data.site.url}/blog/${p.slug}/` }).replace(/</g, '\\u003c');
    const meta = { title: `${escAttr(p.title)} | RAED Technologies`, description: escAttr(p.description), nav: 'blog', path: `/blog/${p.slug}/` };
    const tpl = read('blog/article.html').replace('%%RELATED%%', () => cards(related)).replace('%%LD%%', () => ld);
    writePage(meta, render(tpl, { ...meta, ...ctxOf(p) }), `blog/${p.slug}`, body);
  }

  // Add blog URLs to the sitemap copied from src/public
  const smPath = join(OUT, 'sitemap.xml');
  if (existsSync(smPath)) {
    const urls = ['/blog/', ...posts.map((p) => `/blog/${p.slug}/`)]
      .map((u) => `  <url><loc>${data.site.url}${u}</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>`).join('\n');
    writeFileSync(smPath, readFileSync(smPath, 'utf8').replace('</urlset>', `${urls}\n</urlset>`));
  }
}

// GitHub Pages serves /404.html for missing paths
if (existsSync(join(OUT, '404/index.html'))) cpSync(join(OUT, '404/index.html'), join(OUT, '404.html'));
