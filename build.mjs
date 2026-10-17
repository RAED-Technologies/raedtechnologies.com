// Minimal static site builder: partial includes, data loops, page meta. No dependencies.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, cpSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';

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
const URL = data.site.url;
const today = new Date().toISOString().slice(0, 10);
// Last commit date of a source file (YYYY-MM-DD), for sitemap <lastmod>
const gitDate = (file) => { try { return execFileSync('git', ['log', '-1', '--format=%cs', '--', file], { encoding: 'utf8' }).trim() || today; } catch { return today; } };
const sitemap = []; // {path, lastmod, priority}

// Site-wide structured data: Organization + WebSite, referenced by @id from page-level nodes
const ORG = { '@type': 'Organization', '@id': `${URL}/#organization`, name: data.site.name, url: `${URL}/`, logo: { '@type': 'ImageObject', url: `${URL}/logo.png`, width: 512, height: 512 },
  description: 'Software company in Dhaka, Bangladesh building custom software, web applications, business automation and AI solutions.',
  email: data.site.emailInfo, telephone: data.site.phone, foundingDate: '2025',
  address: { '@type': 'PostalAddress', addressLocality: data.site.city, addressCountry: data.site.countryCode },
  areaServed: 'Worldwide', contactPoint: { '@type': 'ContactPoint', contactType: 'sales', email: data.site.emailInfo, telephone: data.site.phone, availableLanguage: ['English', 'Bengali'] },
  sameAs: data.social.map((s) => s.url) };
const WEBSITE = { '@type': 'WebSite', '@id': `${URL}/#website`, url: `${URL}/`, name: data.site.name, publisher: { '@id': `${URL}/#organization` }, inLanguage: 'en' };
const stripTags = (h) => String(h).replace(/<[^>]+>/g, '').replace(/&amp;/g, '&');
// Extra JSON-LD per page, chosen by meta.ld
const LD_EXTRA = {
  services: () => ({ '@type': 'ItemList', name: 'Software development services', itemListElement: data.services.map((sv, i) => ({ '@type': 'ListItem', position: i + 1,
    item: { '@type': 'Service', name: sv.title, description: stripTags(sv.short), provider: { '@id': `${URL}/#organization` }, areaServed: 'Worldwide', url: `${URL}/services/#${sv.id}` } })) }),
  projects: () => ({ '@type': 'ItemList', name: 'Software projects', itemListElement: data.projects.map((pr, i) => ({ '@type': 'ListItem', position: i + 1,
    item: { '@type': 'CreativeWork', name: stripTags(pr.title), description: stripTags(pr.summary), url: pr.url, image: URL + pr.image, creator: { '@id': `${URL}/#organization` }, keywords: pr.stack.join(', ') } })) }),
};
function ldFor(meta) {
  const graph = [ORG, WEBSITE];
  if (meta.path !== '/') {
    const crumbs = [{ name: 'Home', url: `${URL}/` }, ...(meta.parent ? [meta.parent] : []), { name: meta.crumb || meta.title.split(' | ')[0], url: URL + meta.path }];
    graph.push({ '@type': 'BreadcrumbList', itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: c.url })) });
  }
  if (meta.ld && LD_EXTRA[meta.ld]) graph.push(LD_EXTRA[meta.ld]());
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');
}
// Write one page: meta {title, description, nav, path, robots?}, content = rendered HTML.
// raw = HTML inserted verbatim after rendering (e.g. article bodies), so it is never template-processed.
function writePage(meta, content, label, raw = '') {
  const canonical = data.site.url + meta.path;
  // meta.robots (e.g. "noindex") replaces the canonical link; otherwise pages are indexable with a self-canonical.
  const headMeta = meta.robots
    ? `  <meta name="robots" content="${meta.robots}">`
    : `  <link rel="canonical" href="${canonical}">`;
  if (!meta.robots) sitemap.push({ path: meta.path, lastmod: meta.lastmod || today, priority: meta.priority || (meta.path === '/' ? '1.0' : '0.8') });
  let html = render(layout, { ogImage: `${data.site.url}/og.png`, ogType: 'website', ...meta, content: '%%CONTENT%%', version, canonical, headMeta, ldJson: '%%LDJSON%%' })
    .replace('%%LDJSON%%', () => ldFor(meta))
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
  const meta = { lastmod: gitDate(join(SRC, 'pages', file)), ...JSON.parse(m[1]) };
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

  const indexMeta = { title: 'Blog: Software and Automation Insights | RAED Technologies', crumb: 'Blog', description: 'Practical ideas on software, automation, AI and digital transformation for growing businesses in Bangladesh, from the RAED Technologies team.', nav: 'blog', path: '/blog/' };
  const indexTpl = read('blog/index.html').replace('%%FEATURED%%', () => fill(read('blog/featured.html'), ctxOf(featured))).replace('%%CARDS%%', () => cards(rest))
    .replace('%%FILTERS%%', () => {
      const INDUSTRIES = ['Retail', 'Healthcare', 'Education', 'Finance', 'Logistics', 'Real Estate', 'Startups', 'Manufacturing'];
      const cats = [...new Set(rest.map((p) => p.category))];
      const btn = (c) => `          <button type="button" class="bl-filter" aria-pressed="false" data-filter="${escAttr(c)}">${escAttr(c)}</button>`;
      const row = (label, list) => list.length ? `        <div class="bl-filters__row"><span class="bl-filters__label">${label}</span><div class="bl-filters__chips">\n${list.map(btn).join('\n')}\n        </div></div>` : '';
      return [row('Industry', INDUSTRIES.filter((c) => cats.includes(c))), row('Topic', cats.filter((c) => !INDUSTRIES.includes(c)))].join('\n');
    });
  indexMeta.lastmod = posts.map((p) => p.date).sort().at(-1);
  writePage(indexMeta, render(indexTpl, indexMeta), 'blog index');

  for (const p of posts) {
    const body = readFileSync(join(BLOG, `${p.slug}.html`), 'utf8');
    const related = posts.filter((x) => x.slug !== p.slug && x.category === p.category).concat(posts.filter((x) => x.slug !== p.slug && x.category !== p.category)).slice(0, 3);
    const ld = JSON.stringify({ '@context': 'https://schema.org', '@type': 'BlogPosting', headline: p.title, description: p.description, image: `${data.site.url}/blog/covers/${p.slug}.jpg`, datePublished: p.date, dateModified: p.date, inLanguage: 'en', articleSection: p.category, author: { '@type': 'Organization', name: 'RAED Technologies', url: `${URL}/` }, publisher: { '@id': `${URL}/#organization` }, mainEntityOfPage: `${data.site.url}/blog/${p.slug}/` }).replace(/</g, '\\u003c');
    // Long headlines drop the brand suffix so search results show the headline itself
    const title = p.title.length > 45 ? escAttr(p.title) : `${escAttr(p.title)} | RAED Technologies`;
    const meta = { title, crumb: escAttr(p.title), parent: { name: 'Blog', url: `${URL}/blog/` }, description: escAttr(p.description), nav: 'blog', path: `/blog/${p.slug}/`, ogImage: `${data.site.url}/blog/covers/${p.slug}.jpg`, ogType: 'article', lastmod: p.date, priority: '0.6' };
    const tpl = read('blog/article.html').replace('%%RELATED%%', () => cards(related)).replace('%%LD%%', () => ld);
    writePage(meta, render(tpl, { ...meta, ...ctxOf(p) }), `blog/${p.slug}`, body);
  }

}

// Sitemap of every indexable page
writeFileSync(join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemap.map((u) => `  <url><loc>${URL}${u.path}</loc><lastmod>${u.lastmod}</lastmod><priority>${u.priority}</priority></url>`).join('\n')}
</urlset>
`);

// GitHub Pages serves /404.html for missing paths
if (existsSync(join(OUT, '404/index.html'))) cpSync(join(OUT, '404/index.html'), join(OUT, '404.html'));
