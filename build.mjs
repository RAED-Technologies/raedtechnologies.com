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
for (const file of readdirSync(join(SRC, 'pages')).filter((f) => f.endsWith('.html'))) {
  const raw = read(join('pages', file));
  const m = raw.match(/^<!--meta\s*([\s\S]*?)-->/);
  if (!m) throw new Error(`${file}: missing <!--meta {...} --> header`);
  const meta = JSON.parse(m[1]);
  const content = render(raw.slice(m[0].length), meta);
  const canonical = data.site.url + meta.path;
  // meta.robots (e.g. "noindex") replaces the canonical link; otherwise pages are indexable with a self-canonical.
  const headMeta = meta.robots
    ? `  <meta name="robots" content="${meta.robots}">`
    : `  <link rel="canonical" href="${canonical}">`;
  let html = render(layout, { ...meta, content: '%%CONTENT%%', version, canonical, headMeta })
    .replace('%%CONTENT%%', content)
    .replace(new RegExp(`data-nav="${meta.nav}"`, 'g'), `data-nav="${meta.nav}" aria-current="page"`);
  const outFile = meta.path === '/' ? join(OUT, 'index.html') : join(OUT, meta.path, 'index.html');
  mkdirSync(dirname(outFile), { recursive: true });
  writeFileSync(outFile, html);
  const left = html.match(/\{\{[\w:.]+\}\}|<!--\s*@\w+/g);
  if (left) console.warn(`  ! ${file}: unresolved ${[...new Set(left)].join(', ')}`);
  console.log(`built ${outFile}`);
}

// GitHub Pages serves /404.html for missing paths
if (existsSync(join(OUT, '404/index.html'))) cpSync(join(OUT, '404/index.html'), join(OUT, '404.html'));
