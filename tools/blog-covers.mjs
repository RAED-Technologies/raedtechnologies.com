// Generates on-brand SVG cover art for every blog post: src/public/blog/covers/<slug>.svg (1200x675).
// Social share images (JPEG 1200x630) are rendered from these SVGs with a headless browser and committed next to them.
// Run: node tools/blog-covers.mjs   (re-run after adding posts; outputs are committed)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const posts = JSON.parse(readFileSync('content/blog/posts.json', 'utf8'));
const OUT = 'src/public/blog/covers';
mkdirSync(OUT, { recursive: true });

const W = 1200, H = 675;
const BLUE = '#2F6BFF', BLUE2 = '#7FA5FF', INK = '#0B0D12', LINE = 'rgba(255,255,255,.07)', STROKE = 'rgba(233,236,242,.78)', DIM = 'rgba(233,236,242,.28)';

// Small deterministic PRNG per slug so each cover varies but is reproducible
function rng(seed) { let h = 2166136261; for (const c of seed) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 10000) / 10000; }; }
const r1 = (n) => Math.round(n * 10) / 10;

const motifs = {
  Manufacturing(R) { // QR label → roll → bundle → carton chain
    let s = '';
    const q = 7, cell = 22, x0 = 150, y0 = 210;
    s += `<rect x="${x0 - 18}" y="${y0 - 18}" width="${q * cell + 36}" height="${q * cell + 36}" rx="18" fill="rgba(255,255,255,.04)" stroke="${DIM}"/>`;
    for (let i = 0; i < q; i++) for (let j = 0; j < q; j++) {
      const finder = (i < 2 && j < 2) || (i < 2 && j > 4) || (i > 4 && j < 2);
      if (finder || R() > .5) s += `<rect x="${x0 + i * cell}" y="${y0 + j * cell}" width="${cell - 4}" height="${cell - 4}" rx="3" fill="${finder ? '#E9ECF2' : 'rgba(233,236,242,.55)'}"/>`;
    }
    const nodes = [[520, 300, 'roll'], [700, 260, 'bundle'], [880, 330, 'carton'], [1040, 280, 'pallet']];
    s += `<path d="M${x0 + q * cell + 18} ${y0 + 77} C 420 300, 460 300, 470 300" stroke="${BLUE2}" stroke-width="3" stroke-dasharray="10 9" fill="none"/>`;
    nodes.forEach(([x, y, k], i) => {
      if (i) { const [px, py] = nodes[i - 1]; s += `<path d="M${px + 50} ${py} C ${px + 110} ${py}, ${x - 110} ${y}, ${x - 50} ${y}" stroke="${BLUE2}" stroke-width="3" stroke-dasharray="10 9" fill="none"/>`; }
      s += `<rect x="${x - 50}" y="${y - 50}" width="100" height="100" rx="24" fill="#141821" stroke="${i === 3 ? 'rgba(111,215,155,.7)' : DIM}"/>`;
      if (k === 'roll') s += `<circle cx="${x}" cy="${y}" r="28" stroke="${STROKE}" stroke-width="3" fill="none"/><circle cx="${x}" cy="${y}" r="8" stroke="${STROKE}" stroke-width="3" fill="none"/>`;
      if (k === 'bundle') s += `<rect x="${x - 26}" y="${y - 26}" width="52" height="52" rx="5" stroke="${STROKE}" stroke-width="3" fill="none"/><path d="M${x - 26} ${y - 8}h52M${x - 26} ${y + 10}h52" stroke="${STROKE}" stroke-width="3"/>`;
      if (k === 'carton') s += `<path d="M${x - 28} ${y - 12}l28-12 28 12v32l-28 12-28-12z M${x - 28} ${y - 12}l28 12 28-12M${x} ${y}v32" stroke="${STROKE}" stroke-width="3" fill="none" stroke-linejoin="round"/>`;
      if (k === 'pallet') s += `<path d="M${x - 30} ${y + 18}h60M${x - 24} ${y + 18}v10M${x + 24} ${y + 18}v10M${x} ${y + 18}v10" stroke="${STROKE}" stroke-width="3"/><rect x="${x - 24}" y="${y - 22}" width="20" height="40" stroke="${STROKE}" stroke-width="3" fill="none"/><rect x="${x + 4}" y="${y - 8}" width="20" height="26" stroke="${STROKE}" stroke-width="3" fill="none"/><circle cx="${x + 38}" cy="${y - 40}" r="11" fill="#6FD79B"/><path d="M${x + 33} ${y - 40}l4 4 7-8" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    });
    return s;
  },
  Industry(R) { // globe + trade route
    let s = ''; const cx = 600, cy = 360, rr = 210;
    s += `<circle cx="${cx}" cy="${cy}" r="${rr}" stroke="${DIM}" stroke-width="2" fill="rgba(255,255,255,.02)"/>`;
    for (const k of [0.35, 0.7]) s += `<ellipse cx="${cx}" cy="${cy}" rx="${rr * k}" ry="${rr}" stroke="${DIM}" stroke-width="1.5" fill="none"/>`;
    for (const k of [-0.5, 0, 0.5]) s += `<ellipse cx="${cx}" cy="${cy + rr * k}" rx="${rr * Math.sqrt(1 - k * k)}" ry="${18}" stroke="${DIM}" stroke-width="1.5" fill="none"/>`;
    const a = [cx - 130, cy + 60 + R() * 30], b = [cx + 150, cy - 90 - R() * 30];
    s += `<path d="M${a[0]} ${a[1]} Q ${cx + 20} ${cy - 260} ${b[0]} ${b[1]}" stroke="${BLUE}" stroke-width="4" fill="none" stroke-dasharray="14 10"/>`;
    for (const [x, y] of [a, b]) s += `<circle cx="${x}" cy="${y}" r="13" fill="${BLUE}"/><circle cx="${x}" cy="${y}" r="26" stroke="${BLUE2}" stroke-width="2" fill="none" opacity=".6"/>`;
    s += `<rect x="${b[0] + 40}" y="${b[1] - 24}" width="150" height="48" rx="12" fill="#141821" stroke="${DIM}"/><path d="M${b[0] + 58} ${b[1]}h40M${b[0] + 110} ${b[1]}h60" stroke="${STROKE}" stroke-width="3" stroke-linecap="round"/>`;
    return s;
  },
  Strategy(R) { // decision tree
    let s = ''; const root = [220, 340];
    const lvl1 = [[520, 200], [520, 480]], lvl2 = [[860, 130], [860, 270], [860, 420], [860, 560]];
    const win = Math.floor(R() * 4);
    const link = (p, q, hot) => `<path d="M${p[0] + 40} ${p[1]} C ${p[0] + 170} ${p[1]}, ${q[0] - 170} ${q[1]}, ${q[0] - 40} ${q[1]}" stroke="${hot ? BLUE : DIM}" stroke-width="${hot ? 4 : 2.5}" fill="none"/>`;
    lvl1.forEach((p, i) => { s += link(root, p, Math.floor(win / 2) === i); });
    lvl2.forEach((p, i) => { s += link(lvl1[Math.floor(i / 2)], p, i === win); });
    const node = (p, hot, d) => `<rect x="${p[0] - 40}" y="${p[1] - 40}" width="80" height="80" rx="${d ? 8 : 40}" fill="${hot ? BLUE : '#141821'}" stroke="${hot ? BLUE2 : DIM}" ${d ? `transform="rotate(45 ${p[0]} ${p[1]})"` : ''}/>`;
    s += node(root, false, true); lvl1.forEach((p, i) => { s += node(p, Math.floor(win / 2) === i, true); });
    lvl2.forEach((p, i) => { s += node(p, i === win, false); if (i === win) s += `<path d="M${p[0] - 14} ${p[1]}l9 10 19-21" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`; });
    return s;
  },
  AI(R) { // layered network
    let s = ''; const layers = [3, 5, 5, 2]; const xs = [260, 480, 720, 940]; const pts = [];
    layers.forEach((n, li) => { const col = []; for (let i = 0; i < n; i++) col.push([xs[li], 337 + (i - (n - 1) / 2) * 105]); pts.push(col); });
    const hot = pts.map((c) => Math.floor(R() * c.length));
    for (let li = 0; li < pts.length - 1; li++) for (const [ai, a] of pts[li].entries()) for (const [bi, b] of pts[li + 1].entries()) {
      const h = hot[li] === ai && hot[li + 1] === bi;
      s += `<path d="M${a[0]} ${a[1]} L${b[0]} ${b[1]}" stroke="${h ? BLUE : DIM}" stroke-width="${h ? 4 : 1.5}"/>`;
    }
    pts.forEach((c, li) => c.forEach((p, i) => { const h = hot[li] === i; s += `<circle cx="${p[0]}" cy="${p[1]}" r="${h ? 24 : 18}" fill="${h ? BLUE : '#141821'}" stroke="${h ? BLUE2 : STROKE}" stroke-width="3"/>`; }));
    s += `<rect x="${xs[3] + 60}" y="300" width="130" height="74" rx="16" fill="#141821" stroke="${DIM}"/><path d="M${xs[3] + 82} 326h86M${xs[3] + 82} 348h56" stroke="${STROKE}" stroke-width="3" stroke-linecap="round"/><circle cx="${xs[3] + 178}" cy="306" r="14" fill="#6FD79B"/><path d="M${xs[3] + 172} 306l4 4 8-9" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    return s;
  },
  Operations(R) { // racks with boxes
    let s = ''; const x0 = 200, y0 = 150, cols = 4, rows = 3, cw = 200, rh = 125;
    const hot = [Math.floor(R() * cols), Math.floor(R() * rows)];
    for (let c = 0; c < cols; c++) {
      const x = x0 + c * (cw + 20);
      s += `<path d="M${x} ${y0}v${rows * rh + 20}M${x + cw} ${y0}v${rows * rh + 20}" stroke="${DIM}" stroke-width="3"/>`;
      for (let r = 0; r <= rows; r++) s += `<path d="M${x} ${y0 + r * rh}h${cw}" stroke="${DIM}" stroke-width="3"/>`;
      for (let r = 0; r < rows; r++) { const n = 1 + Math.floor(R() * 3); for (let k = 0; k < n; k++) { const h = c === hot[0] && r === hot[1] && k === 0; s += `<rect x="${x + 14 + k * 60}" y="${y0 + r * rh + rh - 70}" width="50" height="62" rx="6" fill="${h ? BLUE : '#141821'}" stroke="${h ? BLUE2 : STROKE}" stroke-width="2.5"/>`; } }
    }
    const hx = x0 + hot[0] * (cw + 20) + 39, hy = y0 + hot[1] * rh + rh - 70;
    s += `<path d="M${hx} ${hy - 8}v-40" stroke="${BLUE2}" stroke-width="3" stroke-dasharray="6 6"/><rect x="${hx - 70}" y="${hy - 96}" width="140" height="44" rx="12" fill="#141821" stroke="${BLUE2}"/><path d="M${hx - 50} ${hy - 74}h60" stroke="${STROKE}" stroke-width="3" stroke-linecap="round"/><circle cx="${hx + 44}" cy="${hy - 74}" r="7" fill="#6FD79B"/>`;
    return s;
  },
  Delivery(R) { // gantt with milestones
    let s = ''; const x0 = 180, w = 840;
    for (let i = 0; i <= 12; i++) s += `<path d="M${x0 + i * w / 12} 150v380" stroke="${LINE}" stroke-width="2"/>`;
    const j = () => r1((R() - 0.5) * 1.4);
    const bars = [[0, 2.2 + j(), 0], [1.8 + j(), 5.5 + j(), 1], [3.5 + j(), 8.5 + j(), 1], [7.8 + j(), 10 + j(), 0], [9.6 + j(), 11.6, 2]];
    bars.forEach(([a, b, k], i) => {
      const y = 180 + i * 68, x = x0 + a * w / 12, bw = (b - a) * w / 12;
      s += `<rect x="${x}" y="${y}" width="${bw}" height="38" rx="10" fill="${k === 1 ? BLUE : k === 2 ? 'rgba(111,215,155,.85)' : '#24406B'}"/>`;
      if (k === 1) for (let t = 1; t < (b - a) / 1.2; t++) s += `<path d="M${x + t * 1.2 * w / 12} ${y + 6}v26" stroke="rgba(255,255,255,.5)" stroke-width="2"/>`;
    });
    for (const m of [bars[0][1], bars[2][1], 11.6]) { const x = x0 + m * w / 12; s += `<rect x="${x - 13}" y="${130 - 13}" width="26" height="26" fill="#E9ECF2" transform="rotate(45 ${x} 130)"/>`; }
    s += `<path d="M${x0} 560h${w}" stroke="${DIM}" stroke-width="2"/>`;
    return s;
  },
  Security(R) { // shield + rings
    let s = ''; const cx = 600, cy = 345;
    for (const [rr, o] of [[250, .25], [190, .4], [130, .55]]) s += `<circle cx="${cx}" cy="${cy}" r="${rr}" stroke="${BLUE2}" stroke-opacity="${o}" stroke-width="2" fill="none" stroke-dasharray="${rr === 190 ? '6 10' : '0'}"/>`;
    s += `<path d="M${cx} ${cy - 120}l100 36v74c0 70-44 118-100 140-56-22-100-70-100-140v-74z" fill="#141821" stroke="${STROKE}" stroke-width="4" stroke-linejoin="round"/>`;
    s += `<rect x="${cx - 32}" y="${cy - 4}" width="64" height="52" rx="10" fill="${BLUE}"/><path d="M${cx - 20} ${cy - 4}v-18a20 20 0 0 1 40 0v18" stroke="#fff" stroke-width="5" fill="none"/><circle cx="${cx}" cy="${cy + 20}" r="7" fill="#fff"/>`;
    const ang = R() * Math.PI * 2;
    for (let i = 0; i < 5; i++) { const a = ang + i * 1.256, x = cx + Math.cos(a) * 250, y = cy + Math.sin(a) * 250; s += `<circle cx="${r1(x)}" cy="${r1(y)}" r="9" fill="${i ? '#E9ECF2' : '#F2B25C'}"/>`; }
    return s;
  },
  Data(R) { // dashboard
    let s = '';
    const card = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" fill="#141821" stroke="${DIM}"/>`;
    s += card(150, 130, 560, 420); s += card(740, 130, 310, 200); s += card(740, 350, 310, 200);
    const n = 9; for (let i = 0; i < n; i++) { const h = 60 + R() * 240, x = 195 + i * 56; s += `<rect x="${x}" y="${500 - h}" width="34" height="${h}" rx="6" fill="${i === n - 2 ? BLUE : 'rgba(127,165,255,.35)'}"/>`; }
    s += `<path d="M190 500h480" stroke="${DIM}" stroke-width="2"/>`;
    let d = 'M770 290'; for (let i = 1; i <= 8; i++) d += ` L${770 + i * 32} ${r1(290 - i * 12 - R() * 40)}`; s += `<path d="${d}" stroke="${BLUE}" stroke-width="4" fill="none" stroke-linejoin="round"/>`;
    s += `<path d="M770 170h90" stroke="${STROKE}" stroke-width="4" stroke-linecap="round"/><circle cx="840" cy="450" r="52" stroke="rgba(127,165,255,.2)" stroke-width="14" fill="none"/><circle cx="840" cy="450" r="52" stroke="${BLUE}" stroke-width="14" fill="none" stroke-dasharray="${r1(200 + R() * 100)} 400" transform="rotate(-90 840 450)"/><path d="M920 430h70M920 462h48" stroke="${DIM}" stroke-width="4" stroke-linecap="round"/><circle cx="1010" cy="390" r="12" fill="#6FD79B"/>`;
    return s;
  },
  Integration(R) { // systems connected through a hub
    let s = ''; const hub = [600, 340];
    const sys = [[230, 180], [230, 500], [970, 180], [970, 500]];
    sys.forEach((p, i) => {
      s += `<path d="M${p[0] + (p[0] < 600 ? 90 : -90)} ${p[1]} C ${p[0] < 600 ? 450 : 750} ${p[1]}, ${p[0] < 600 ? 470 : 730} ${hub[1]}, ${hub[0] + (p[0] < 600 ? -60 : 60)} ${hub[1]}" stroke="${i === 0 || i === 3 ? BLUE : DIM}" stroke-width="${i === 0 || i === 3 ? 4 : 2.5}" fill="none" stroke-dasharray="${i === 0 || i === 3 ? '0' : '8 8'}"/>`;
      s += `<rect x="${p[0] - 90}" y="${p[1] - 60}" width="180" height="120" rx="20" fill="#141821" stroke="${DIM}"/><path d="M${p[0] - 60} ${p[1] - 22}h${70 + R() * 50}M${p[0] - 60} ${p[1] + 2}h${50 + R() * 60}M${p[0] - 60} ${p[1] + 26}h${40 + R() * 40}" stroke="${STROKE}" stroke-width="4" stroke-linecap="round"/>`;
    });
    s += `<rect x="${hub[0] - 60}" y="${hub[1] - 60}" width="120" height="120" rx="28" fill="${BLUE}"/><path d="M${hub[0] - 26} ${hub[1] - 14}h52M${hub[0] - 26} ${hub[1] + 14}h52M${hub[0] - 14} ${hub[1] - 28}v56M${hub[0] + 14} ${hub[1] - 28}v56" stroke="#fff" stroke-width="5" stroke-linecap="round"/>`;
    for (const t of [0.35, 0.7]) s += `<circle cx="${r1(230 + 90 + (hub[0] - 60 - 320) * t)}" cy="${r1(180 + (hub[1] - 180) * t * t)}" r="7" fill="#E9ECF2"/>`;
    return s;
  },
  Cloud(R) { // cloud + servers
    let s = '<g transform="translate(0 50)">'; const cx = 600;
    s += `<path d="M${cx - 190} 300c-62 0-100-44-100-94 0-54 44-94 100-92 18-58 74-98 140-96 70 2 126 52 136 116 56 0 100 40 100 84 0 48-40 82-96 82z" fill="#141821" stroke="${STROKE}" stroke-width="4" stroke-linejoin="round"/>`;
    s += `<path d="M${cx - 60} 220h120M${cx - 40} 250h80" stroke="${BLUE2}" stroke-width="4" stroke-linecap="round"/>`;
    const srv = [[340, 470], [600, 500], [860, 470]];
    srv.forEach((p, i) => {
      s += `<path d="M${p[0]} ${p[1] - 48} L${cx + (p[0] - cx) * 0.45} 310" stroke="${i === 1 ? BLUE : DIM}" stroke-width="${i === 1 ? 4 : 2.5}" stroke-dasharray="${i === 1 ? '0' : '8 8'}"/>`;
      for (let k = 0; k < 3; k++) s += `<rect x="${p[0] - 90}" y="${p[1] - 44 + k * 38}" width="180" height="30" rx="8" fill="#141821" stroke="${DIM}"/><circle cx="${p[0] + 66}" cy="${p[1] - 29 + k * 38}" r="5" fill="${k === 0 && i === 1 ? '#6FD79B' : 'rgba(233,236,242,.5)'}"/>`;
    });
    return s + '</g>';
  },
  Automation(R) { // workflow with loop
    let s = ''; const steps = [[190, 340], [430, 340], [670, 340], [910, 340]];
    steps.forEach((p, i) => {
      if (i) { const q = steps[i - 1]; s += `<path d="M${q[0] + 70} ${p[1]}H${p[0] - 70}" stroke="${BLUE}" stroke-width="4"/><path d="M${p[0] - 84} ${p[1] - 10}l12 10-12 10" stroke="${BLUE}" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`; }
      s += `<rect x="${p[0] - 70}" y="${p[1] - 60}" width="140" height="120" rx="22" fill="${i === 3 ? 'rgba(111,215,155,.15)' : '#141821'}" stroke="${i === 3 ? 'rgba(111,215,155,.8)' : DIM}"/>`;
      const icons = [`<path d="M${p[0] - 24} ${p[1] - 28}h34l14 14v42h-48z" stroke="${STROKE}" stroke-width="4" fill="none" stroke-linejoin="round"/>`,
        `<circle cx="${p[0]}" cy="${p[1]}" r="28" stroke="${STROKE}" stroke-width="4" fill="none"/><path d="M${p[0]} ${p[1] - 14}v14l10 8" stroke="${STROKE}" stroke-width="4" fill="none" stroke-linecap="round"/>`,
        `<path d="M${p[0] - 28} ${p[1] + 18}h56M${p[0] - 20} ${p[1] + 18}v-26M${p[0]} ${p[1] + 18}v-40M${p[0] + 20} ${p[1] + 18}v-18" stroke="${STROKE}" stroke-width="5" stroke-linecap="round"/>`,
        `<path d="M${p[0] - 22} ${p[1]}l14 15 30-32" stroke="#6FD79B" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`];
      s += icons[i];
    });
    s += `<path d="M910 270 C 910 140, 430 140, 430 270" stroke="${BLUE2}" stroke-width="3" fill="none" stroke-dasharray="10 9"/><circle cx="${r1(560 + R() * 200)}" cy="175" r="9" fill="${BLUE2}"/>`;
    return s;
  },
};

for (const p of posts) {
  const R = rng(p.slug);
  const gx = r1(W * (0.25 + R() * 0.5)), gy = r1(H * (0.25 + R() * 0.4));
  const motif = (motifs[p.category] || motifs.Strategy)(R);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${p.title.replace(/"/g, '&quot;')}">
<defs><radialGradient id="g" cx="${gx}" cy="${gy}" r="560" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${BLUE}" stop-opacity=".42"/><stop offset="1" stop-color="${BLUE}" stop-opacity="0"/></radialGradient>
<pattern id="p" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M48 0H0V48" fill="none" stroke="${LINE}" stroke-width="1"/></pattern>
<linearGradient id="v" x1="0" y1="0" x2="0" y2="1"><stop offset=".55" stop-color="${INK}" stop-opacity="0"/><stop offset="1" stop-color="${INK}" stop-opacity=".85"/></linearGradient></defs>
<rect width="${W}" height="${H}" fill="${INK}"/><rect width="${W}" height="${H}" fill="url(#p)"/><rect width="${W}" height="${H}" fill="url(#g)"/>
<g fill="none" stroke-linecap="round">${motif}</g>
<rect width="${W}" height="${H}" fill="url(#v)"/>
<text x="56" y="${H - 52}" fill="${BLUE2}" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="20" letter-spacing="4">${p.category.toUpperCase()}</text>
<g transform="translate(${W - 92} ${H - 84})"><rect width="36" height="36" rx="8" fill="#fff"/><path d="M11.25 25.9V10.1h7a4.8 4.8 0 0 1 1.5 9.5L24.2 25.9" fill="none" stroke="${INK}" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round"/><circle cx="25.3" cy="11.25" r="2.25" fill="${BLUE}"/></g>
</svg>
`;
  writeFileSync(`${OUT}/${p.slug}.svg`, svg);
  console.log('cover', p.slug, p.category);
}
