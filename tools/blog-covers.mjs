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
  Retail(R) { // storefront card + basket + order flow
    let s = '';
    s += `<rect x="180" y="150" width="420" height="380" rx="22" fill="#141821" stroke="${DIM}"/><rect x="180" y="150" width="420" height="56" rx="22" fill="rgba(255,255,255,.04)"/><circle cx="214" cy="178" r="7" fill="${DIM}"/><circle cx="238" cy="178" r="7" fill="${DIM}"/>`;
    for (let i = 0; i < 4; i++) { const x = 210 + (i % 2) * 196, y = 230 + Math.floor(i / 2) * 146; s += `<rect x="${x}" y="${y}" width="170" height="80" rx="12" fill="rgba(127,165,255,${i === 1 ? .35 : .12})"/><path d="M${x} ${y + 100}h${90 + R() * 50}M${x} ${y + 120}h60" stroke="${STROKE}" stroke-width="4" stroke-linecap="round"/>`; }
    s += `<path d="M700 230h40l40 170h170l36-120H770" stroke="${STROKE}" stroke-width="6" fill="none" stroke-linejoin="round"/><circle cx="800" cy="450" r="20" fill="#141821" stroke="${STROKE}" stroke-width="5"/><circle cx="930" cy="450" r="20" fill="#141821" stroke="${STROKE}" stroke-width="5"/>`;
    s += `<rect x="820" y="290" width="44" height="44" rx="8" fill="${BLUE}"/><rect x="876" y="300" width="40" height="34" rx="8" fill="rgba(127,165,255,.5)"/><circle cx="1010" cy="220" r="34" fill="${BLUE}"/><path d="M996 220l10 11 20-22" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
    return s;
  },
  Healthcare(R) { // cross + patient record + heartbeat
    let s = '';
    s += `<rect x="200" y="200" width="220" height="220" rx="44" fill="${BLUE}"/><path d="M310 245v130M245 310h130" stroke="#fff" stroke-width="30" stroke-linecap="round"/>`;
    s += `<rect x="520" y="140" width="320" height="400" rx="20" fill="#F4F6F9"/><circle cx="580" cy="210" r="30" fill="#C9D1DD"/><path d="M630 196h150M630 222h100" stroke="#9AA3B2" stroke-width="8" stroke-linecap="round"/>`;
    for (let i = 0; i < 5; i++) s += `<path d="M560 ${290 + i * 44}h${150 + R() * 100}" stroke="#C9D1DD" stroke-width="7" stroke-linecap="round"/>`;
    s += `<rect x="760" y="440" width="56" height="56" rx="12" fill="${BLUE}"/><rect x="777" y="466" width="22" height="18" rx="3" fill="#fff"/><path d="M780 466v-6a8 8 0 0 1 16 0v6" stroke="#fff" stroke-width="3" fill="none"/>`;
    s += `<path d="M880 330h60l20-50 30 100 24-70 16 20h90" stroke="${BLUE2}" stroke-width="5" fill="none" stroke-linejoin="round"/>`;
    return s;
  },
  Education(R) { // cap + timetable + progress
    let s = '';
    s += `<path d="M320 230l170-70 170 70-170 70z" fill="#141821" stroke="${STROKE}" stroke-width="5" stroke-linejoin="round"/><path d="M400 266v74c0 30 40 52 90 52s90-22 90-52v-74" fill="#141821" stroke="${STROKE}" stroke-width="5"/><path d="M660 230v100" stroke="${BLUE}" stroke-width="5"/><circle cx="660" cy="340" r="12" fill="${BLUE}"/>`;
    const gx = 740, gy = 170; s += `<rect x="${gx}" y="${gy}" width="320" height="250" rx="20" fill="#141821" stroke="${DIM}"/>`;
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const on = R() > .55; s += `<rect x="${gx + 20 + i * 74}" y="${gy + 24 + j * 54}" width="62" height="40" rx="8" fill="${on ? (R() > .5 ? 'rgba(127,165,255,.45)' : 'rgba(111,215,155,.35)') : 'rgba(255,255,255,.05)'}"/>`; }
    s += `<path d="M320 470h420" stroke="rgba(255,255,255,.1)" stroke-width="16" stroke-linecap="round"/><path d="M320 470h${r1(150 + R() * 230)}" stroke="${BLUE}" stroke-width="16" stroke-linecap="round"/>`;
    return s;
  },
  Finance(R) { // phone payment + card + coins
    let s = '';
    s += `<rect x="360" y="110" width="230" height="460" rx="34" fill="#0F1218" stroke="${BLUE2}" stroke-width="3"/><rect x="445" y="124" width="60" height="10" rx="5" fill="${DIM}"/>`;
    s += `<circle cx="475" cy="250" r="60" fill="${BLUE}"/><path d="M450 250l18 18 34-36" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M410 350h130M430 380h90" stroke="${STROKE}" stroke-width="6" stroke-linecap="round"/><rect x="400" y="470" width="150" height="50" rx="14" fill="rgba(127,165,255,.18)"/>`;
    s += `<g transform="rotate(-10 820 330)"><rect x="680" y="250" width="300" height="180" rx="20" fill="#24406B" stroke="${BLUE2}" stroke-width="2"/><rect x="710" y="290" width="50" height="38" rx="6" fill="#D9A04A"/><path d="M710 380h${r1(120 + R() * 80)}" stroke="rgba(255,255,255,.6)" stroke-width="8" stroke-linecap="round"/></g>`;
    s += `<path d="M590 330C 630 330, 650 330, 690 330" stroke="${BLUE2}" stroke-width="3" stroke-dasharray="8 7"/>`;
    for (let i = 0; i < 3; i++) s += `<ellipse cx="900" cy="${520 - i * 18}" rx="56" ry="16" fill="#141821" stroke="${STROKE}" stroke-width="3"/>`;
    return s;
  },
  Logistics(R) { // map route + van + pins
    let s = '';
    for (let i = 0; i < 6; i++) s += `<path d="M${120 + i * 200} 120 L${80 + i * 200} 560" stroke="rgba(255,255,255,.05)" stroke-width="18"/>`;
    const pts = [[220, 470], [420, 300 + R() * 60], [650, 380], [860, 210 + R() * 60], [1000, 300]];
    let d = `M${pts[0][0]} ${pts[0][1]}`; for (let i = 1; i < pts.length; i++) { const [px, py] = pts[i - 1], [x, y] = pts[i]; d += ` C ${px + 90} ${r1(py)}, ${x - 90} ${r1(y)}, ${x} ${r1(y)}`; }
    s += `<path d="${d}" stroke="${BLUE}" stroke-width="6" fill="none" stroke-dasharray="16 10"/>`;
    pts.forEach(([x, y], i) => { if (i === 0 || i === pts.length - 1) s += `<path d="M${x} ${r1(y + 6)}c-24-30-36-48-36-66a36 36 0 0 1 72 0c0 18-12 36-36 66z" fill="${i ? '#6FD79B' : BLUE}"/><circle cx="${x}" cy="${r1(y - 58)}" r="12" fill="${INK}"/>`; else s += `<circle cx="${x}" cy="${r1(y)}" r="10" fill="#E9ECF2"/>`; });
    const [vx, vy] = pts[2]; s += `<g transform="translate(${vx - 70} ${vy - 120})"><rect width="100" height="56" rx="10" fill="#141821" stroke="${STROKE}" stroke-width="4"/><path d="M100 18h26l18 20v18h-44z" fill="#141821" stroke="${STROKE}" stroke-width="4" stroke-linejoin="round"/><circle cx="26" cy="62" r="12" fill="${INK}" stroke="${STROKE}" stroke-width="4"/><circle cx="118" cy="62" r="12" fill="${INK}" stroke="${STROKE}" stroke-width="4"/></g>`;
    return s;
  },
  'Real Estate'(R) { // buildings with units
    let s = ''; const bs = [[230, 260, 150, 290], [410, 160, 190, 390], [630, 220, 160, 330], [820, 300, 170, 250]];
    const hot = [Math.floor(R() * 4), Math.floor(R() * 4)];
    bs.forEach(([x, y, w, h], bi) => {
      s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="#141821" stroke="${bi === 1 ? BLUE2 : DIM}" stroke-width="3"/>`;
      const cols = Math.floor((w - 20) / 44), rows = Math.floor((h - 70) / 52);
      for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) { const on = bi === 1 && c === hot[0] % cols && r === hot[1] % rows; s += `<rect x="${x + 18 + c * 44}" y="${y + 22 + r * 52}" width="28" height="34" rx="5" fill="${on ? BLUE : R() > .6 ? 'rgba(242,178,92,.45)' : 'rgba(255,255,255,.07)'}"/>`; }
      s += `<rect x="${x + w / 2 - 18}" y="${y + h - 48}" width="36" height="48" rx="5" fill="rgba(255,255,255,.1)"/>`;
    });
    s += `<path d="M180 550h860" stroke="${DIM}" stroke-width="3"/>`;
    return s;
  },
  Startups(R) { // rocket + build-measure-learn loop
    let s = ''; const cx = 760, cy = 340;
    s += `<circle cx="${cx}" cy="${cy}" r="170" stroke="${DIM}" stroke-width="3" fill="none" stroke-dasharray="12 12"/>`;
    [['Build', -90], ['Measure', 30], ['Learn', 150]].forEach(([, a], i) => { const x = cx + Math.cos(a * Math.PI / 180) * 170, y = cy + Math.sin(a * Math.PI / 180) * 170; s += `<circle cx="${r1(x)}" cy="${r1(y)}" r="38" fill="${i === Math.floor(R() * 3) ? BLUE : '#141821'}" stroke="${BLUE2}" stroke-width="3"/>`; });
    s += `<path d="M${cx + 70} ${cy - 150}a170 170 0 0 1 90 90" stroke="${BLUE}" stroke-width="5" fill="none"/><path d="M${cx + 156} ${cy - 76}l4 20-20-4" stroke="${BLUE}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
    s += `<g transform="translate(250 150) rotate(35 110 150)"><path d="M110 20c50 40 70 110 50 190H60C40 130 60 60 110 20z" fill="#F4F6F9"/><circle cx="110" cy="110" r="24" fill="${BLUE}" stroke="#24406B" stroke-width="5"/><path d="M60 170l-34 50 44-8M160 170l34 50-44-8" fill="#24406B"/><path d="M85 220c4 40 21 60 25 80 4-20 21-40 25-80z" fill="#F2B25C"/></g>`;
    return s;
  },
  Web(R) { // browser + speed gauge
    let s = '';
    s += `<rect x="170" y="140" width="520" height="400" rx="20" fill="#141821" stroke="${DIM}"/><rect x="170" y="140" width="520" height="50" rx="20" fill="rgba(255,255,255,.04)"/><circle cx="204" cy="165" r="7" fill="${DIM}"/><circle cx="228" cy="165" r="7" fill="${DIM}"/><rect x="270" y="155" width="300" height="20" rx="10" fill="rgba(255,255,255,.06)"/>`;
    s += `<rect x="200" y="220" width="460" height="130" rx="12" fill="rgba(127,165,255,.18)"/><path d="M200 390h300M200 420h220M200 450h260" stroke="${STROKE}" stroke-width="6" stroke-linecap="round"/><rect x="200" y="480" width="140" height="36" rx="10" fill="${BLUE}"/>`;
    const gx = 880, gy = 380, gr = 150; s += `<path d="M${gx - gr} ${gy}a${gr} ${gr} 0 0 1 ${gr * 2} 0" stroke="rgba(255,255,255,.1)" stroke-width="22" fill="none"/>`;
    const v = 0.72 + R() * 0.2, ang = Math.PI * (1 - v);
    s += `<path d="M${gx - gr} ${gy}a${gr} ${gr} 0 0 1 ${r1(gx + Math.cos(ang) * gr - (gx - gr))} ${r1(-Math.sin(ang) * gr)}" stroke="#6FD79B" stroke-width="22" fill="none"/>`;
    s += `<path d="M${gx} ${gy}L${r1(gx + Math.cos(ang) * (gr - 40))} ${r1(gy - Math.sin(ang) * (gr - 40))}" stroke="#E9ECF2" stroke-width="7" stroke-linecap="round"/><circle cx="${gx}" cy="${gy}" r="14" fill="#E9ECF2"/>`;
    return s;
  },
  Design(R) { // wireframe + cursor + components
    let s = '';
    s += `<rect x="180" y="130" width="560" height="420" rx="22" fill="#141821" stroke="${DIM}"/><rect x="200" y="150" width="120" height="380" rx="12" fill="rgba(255,255,255,.04)"/>`;
    for (let i = 0; i < 5; i++) s += `<rect x="218" y="${176 + i * 46}" width="84" height="22" rx="6" fill="${i === 1 ? BLUE : 'rgba(255,255,255,.08)'}"/>`;
    s += `<rect x="340" y="150" width="380" height="130" rx="12" fill="none" stroke="${BLUE2}" stroke-width="3" stroke-dasharray="10 8"/><path d="M370 190h200M370 220h140" stroke="${STROKE}" stroke-width="6" stroke-linecap="round"/>`;
    for (let i = 0; i < 3; i++) s += `<rect x="${340 + i * 130}" y="300" width="118" height="110" rx="12" fill="rgba(255,255,255,.05)" stroke="${DIM}"/>`;
    s += `<rect x="340" y="430" width="160" height="44" rx="12" fill="${BLUE}"/>`;
    s += `<path d="M560 450l0 70 20-18 14 32 14-6-14-32 26-2z" fill="#F4F6F9" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`;
    const sw = ['#2F6BFF', '#7FA5FF', '#24406B', '#6FD79B', '#F2B25C']; sw.forEach((c, i) => { s += `<circle cx="${850 + (i % 2) * 90}" cy="${190 + Math.floor(i / 2) * 90}" r="32" fill="${c}"/>`; });
    s += `<text x="830" y="500" fill="#E9ECF2" font-family="ui-sans-serif,system-ui,sans-serif" font-size="64" font-weight="600">Aa</text>`;
    return s;
  },
  'Customer Experience'(R) { // chat with AI → handover to person
    let s = '';
    const bubble = (x, y, w, mine, lines) => { let b = `<rect x="${x}" y="${y}" width="${w}" height="${30 + lines * 26}" rx="22" fill="${mine ? BLUE : '#141821'}" stroke="${mine ? 'none' : DIM}"/>`; for (let i = 0; i < lines; i++) b += `<path d="M${x + 24} ${y + 28 + i * 26}h${w - 60 - (i === lines - 1 ? 60 : 0)}" stroke="${mine ? 'rgba(255,255,255,.8)' : STROKE}" stroke-width="6" stroke-linecap="round"/>`; return b; };
    s += bubble(240, 130, 380, false, 2) + bubble(470, 240, 330, true, 1) + bubble(240, 320, 420, false, 3);
    s += `<rect x="170" y="140" width="50" height="50" rx="14" fill="#24406B"/><path d="M184 160h22M184 172h14" stroke="#fff" stroke-width="4" stroke-linecap="round"/><circle cx="836" cy="270" r="26" fill="#24406B"/>`;
    s += `<path d="M680 470 C 760 470, 800 420, 860 420" stroke="${BLUE2}" stroke-width="3" stroke-dasharray="8 7" fill="none"/>`;
    s += `<circle cx="930" cy="400" r="40" fill="#141821" stroke="#6FD79B" stroke-width="4"/><path d="M890 500c0-40 18-62 40-62s40 22 40 62" fill="#141821" stroke="#6FD79B" stroke-width="4"/><rect x="980" y="360" width="120" height="44" rx="14" fill="rgba(111,215,155,.15)" stroke="rgba(111,215,155,.7)"/><path d="M1000 382h80" stroke="#6FD79B" stroke-width="5" stroke-linecap="round"/>`;
    return s;
  },
  mobile(R) { // phones with scan + list screens
    let s = '';
    const phone = (x, y, w, h, hot) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="34" fill="#0F1218" stroke="${hot ? BLUE2 : DIM}" stroke-width="3"/><rect x="${x + w / 2 - 30}" y="${y + 14}" width="60" height="10" rx="5" fill="${DIM}"/>`;
    s += phone(330, 110, 240, 470, false) + phone(630, 90, 250, 490, true);
    for (let i = 0; i < 4; i++) s += `<rect x="360" y="${170 + i * 86}" width="180" height="66" rx="14" fill="#141821" stroke="${DIM}"/><path d="M380 ${195 + i * 86}h${80 + R() * 50}M380 ${217 + i * 86}h${50 + R() * 40}" stroke="${STROKE}" stroke-width="4" stroke-linecap="round"/><circle cx="515" cy="${203 + i * 86}" r="8" fill="${i === 1 ? '#6FD79B' : 'rgba(233,236,242,.35)'}"/>`;
    s += `<path d="M680 170v-20h20M810 150h20v20M830 330v20h-20M700 350h-20v-20" stroke="${BLUE2}" stroke-width="5"/>`;
    for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) if (R() > .45 || (i < 2 && j < 2)) s += `<rect x="${712 + i * 20}" y="${182 + j * 20}" width="15" height="15" rx="2" fill="rgba(233,236,242,.75)"/>`;
    s += `<path d="M675 250h160" stroke="${BLUE}" stroke-width="3"/><rect x="660" y="400" width="190" height="56" rx="16" fill="${BLUE}"/><path d="M700 428h110" stroke="#fff" stroke-width="5" stroke-linecap="round"/><path d="M690 500h130" stroke="${DIM}" stroke-width="4" stroke-linecap="round"/>`;
    s += `<path d="M905 190c30 20 30 60 0 80M935 165c50 35 50 115 0 150" stroke="${BLUE2}" stroke-width="3" opacity=".6"/>`;
    return s;
  },
  order(R) { // order → cut → sew → wash → pack → ship
    let s = ''; const xs = [170, 330, 490, 650, 810, 980]; const y = 390; const done = 2 + Math.floor(R() * 3);
    s += `<path d="M${xs[0]} ${y}H${xs[5]}" stroke="${DIM}" stroke-width="4"/><path d="M${xs[0]} ${y}H${xs[done]}" stroke="${BLUE}" stroke-width="6"/>`;
    xs.forEach((x, i) => {
      const st = i < done ? 'done' : i === done ? 'now' : 'next';
      s += `<circle cx="${x}" cy="${y}" r="${st === 'now' ? 30 : 22}" fill="${st === 'done' ? BLUE : st === 'now' ? '#141821' : '#0F1218'}" stroke="${st === 'next' ? DIM : BLUE2}" stroke-width="4"/>`;
      if (st === 'done') s += `<path d="M${x - 9} ${y}l6 7 12-14" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
      if (st === 'now') s += `<circle cx="${x}" cy="${y}" r="10" fill="${BLUE2}"/><circle cx="${x}" cy="${y}" r="46" stroke="${BLUE2}" stroke-width="2" fill="none" opacity=".5"/>`;
      s += `<rect x="${x - 50}" y="${y + 60}" width="100" height="14" rx="7" fill="${st === 'next' ? 'rgba(233,236,242,.15)' : 'rgba(233,236,242,.45)'}"/>`;
    });
    s += `<path d="M${xs[5] - 50} ${y - 120}h80l20 26v34h-120v-38z" fill="#141821" stroke="${STROKE}" stroke-width="3" stroke-linejoin="round"/><path d="M${xs[5] - 60} ${y - 52}h120" stroke="${STROKE}" stroke-width="3"/><circle cx="${xs[5] - 30}" cy="${y - 52}" r="10" fill="#141821" stroke="${STROKE}" stroke-width="3"/><circle cx="${xs[5] + 30}" cy="${y - 52}" r="10" fill="#141821" stroke="${STROKE}" stroke-width="3"/>`;
    s += `<rect x="${xs[0] - 50}" y="${y - 150}" width="120" height="96" rx="14" fill="#141821" stroke="${DIM}"/><path d="M${xs[0] - 30} ${y - 120}h80M${xs[0] - 30} ${y - 98}h56M${xs[0] - 30} ${y - 76}h68" stroke="${STROKE}" stroke-width="4" stroke-linecap="round"/>`;
    return s;
  },
  maintenance(R) { // gear + wrench + schedule
    let s = ''; const cx = 420, cy = 340, ro = 130, ri = 100, n = 10;
    let d = ''; for (let i = 0; i < n * 2; i++) { const a = (i * Math.PI) / n, r = i % 2 ? ri : ro; const a2 = a + Math.PI / n * 0.5; d += `${i ? 'L' : 'M'}${r1(cx + Math.cos(a) * r)} ${r1(cy + Math.sin(a) * r)}L${r1(cx + Math.cos(a2) * r)} ${r1(cy + Math.sin(a2) * r)}`; }
    s += `<path d="${d}Z" fill="#141821" stroke="${STROKE}" stroke-width="4" stroke-linejoin="round"/><circle cx="${cx}" cy="${cy}" r="42" fill="${INK}" stroke="${BLUE2}" stroke-width="4"/>`;
    s += `<path d="M${cx + 70} ${cy + 70}l120 120" stroke="${BLUE}" stroke-width="22"/><circle cx="${cx + 60}" cy="${cy + 60}" r="30" fill="none" stroke="${BLUE}" stroke-width="14"/>`;
    const gx = 720, gy = 170; s += `<rect x="${gx}" y="${gy}" width="330" height="320" rx="22" fill="#141821" stroke="${DIM}"/><path d="M${gx} ${gy + 60}h330" stroke="${DIM}" stroke-width="2"/>`;
    const due = Math.floor(R() * 20);
    for (let i = 0; i < 20; i++) { const x = gx + 24 + (i % 5) * 62, y = gy + 84 + Math.floor(i / 5) * 58; s += `<rect x="${x}" y="${y}" width="44" height="40" rx="8" fill="${i === due ? BLUE : i % 7 === 3 ? 'rgba(111,215,155,.35)' : 'rgba(255,255,255,.05)'}" stroke="${i === due ? BLUE2 : 'none'}"/>`; }
    return s;
  },
  hr(R) { // people + calendar + payslip
    let s = '';
    for (let i = 0; i < 3; i++) { const x = 230 + i * 120, y = 250 + (i === 1 ? -30 : 0); s += `<circle cx="${x}" cy="${y}" r="34" fill="#141821" stroke="${i === 1 ? BLUE2 : STROKE}" stroke-width="4"/><path d="M${x - 58} ${y + 120}c0-44 26-70 58-70s58 26 58 70" fill="#141821" stroke="${i === 1 ? BLUE2 : STROKE}" stroke-width="4"/>`; }
    const cx = 640, cy = 170; s += `<rect x="${cx}" y="${cy}" width="230" height="230" rx="22" fill="#141821" stroke="${DIM}"/><rect x="${cx}" y="${cy}" width="230" height="52" rx="22" fill="${BLUE}"/><path d="M${cx + 50} ${cy - 14}v30M${cx + 180} ${cy - 14}v30" stroke="${STROKE}" stroke-width="5" stroke-linecap="round"/>`;
    for (let i = 0; i < 15; i++) { const x = cx + 22 + (i % 5) * 40, y = cy + 72 + Math.floor(i / 5) * 42; s += `<rect x="${x}" y="${y}" width="26" height="26" rx="6" fill="${R() > .75 ? 'rgba(111,215,155,.6)' : 'rgba(255,255,255,.08)'}"/>`; }
    const px = 900, py = 250; s += `<rect x="${px}" y="${py}" width="190" height="250" rx="16" fill="#F4F6F9"/><path d="M${px + 24} ${py + 40}h100M${px + 24} ${py + 84}h142M${px + 24} ${py + 114}h142M${px + 24} ${py + 144}h120" stroke="#C9D1DD" stroke-width="6" stroke-linecap="round"/><path d="M${px + 24} ${py + 200}h70" stroke="${BLUE}" stroke-width="10" stroke-linecap="round"/><circle cx="${px + 150}" cy="${py + 200}" r="18" fill="#6FD79B"/><path d="M${px + 142} ${py + 200}l6 6 11-12" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/>`;
    return s;
  },
  docs(R) { // document scanned into fields
    let s = ''; const dx = 300, dy = 110;
    s += `<rect x="${dx}" y="${dy}" width="300" height="400" rx="16" fill="#F4F6F9"/><path d="M${dx + 32} ${dy + 46}h120" stroke="#9AA3B2" stroke-width="10" stroke-linecap="round"/>`;
    for (let i = 0; i < 7; i++) s += `<path d="M${dx + 32} ${dy + 100 + i * 36}h${140 + R() * 90}" stroke="#C9D1DD" stroke-width="7" stroke-linecap="round"/>`;
    const sy = dy + 150 + R() * 160; s += `<rect x="${dx - 20}" y="${r1(sy)}" width="340" height="4" fill="${BLUE}"/><rect x="${dx - 20}" y="${r1(sy - 40)}" width="340" height="40" fill="url(#scan)"/>`;
    s += `<path d="M${dx + 320} 310 C 700 310, 700 230, 760 230M${dx + 320} 310 C 700 310, 700 390, 760 390" stroke="${BLUE2}" stroke-width="3" stroke-dasharray="9 8"/>`;
    for (const [y, ok] of [[190, true], [350, false]]) s += `<rect x="760" y="${y}" width="280" height="80" rx="16" fill="#141821" stroke="${ok ? DIM : 'rgba(242,178,92,.7)'}"/><path d="M790 ${y + 30}h120M790 ${y + 54}h80" stroke="${STROKE}" stroke-width="4" stroke-linecap="round"/><circle cx="1004" cy="${y + 40}" r="16" fill="${ok ? '#6FD79B' : '#F2B25C'}"/>`;
    s += `<path d="M997 230l5 6 9-11" stroke="${INK}" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M1004 380v10M1004 397v2" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`;
    return s;
  },
  backup(R) { // original → local copy → off-site copy
    let s = '';
    const db = (x, y, hot) => `<ellipse cx="${x}" cy="${y}" rx="78" ry="22" fill="#141821" stroke="${hot ? BLUE2 : STROKE}" stroke-width="4"/><path d="M${x - 78} ${y}v120c0 12 35 22 78 22s78-10 78-22V${y}" fill="#141821" stroke="${hot ? BLUE2 : STROKE}" stroke-width="4"/><path d="M${x - 78} ${y + 60}c0 12 35 22 78 22s78-10 78-22" stroke="${hot ? BLUE2 : STROKE}" stroke-width="3" fill="none"/>`;
    s += db(270, 250, true) + db(600, 250, false);
    s += `<path d="M860 330c-40 0-66-28-66-60 0-34 28-60 64-60 12-36 48-60 90-58 46 2 80 34 86 74 38 0 64 26 64 56 0 30-26 48-62 48z" fill="#141821" stroke="${STROKE}" stroke-width="4" stroke-linejoin="round"/>`;
    s += `<path d="M360 310H510" stroke="${BLUE}" stroke-width="5"/><path d="M500 298l14 12-14 12" stroke="${BLUE}" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
    s += `<path d="M690 310H790" stroke="${BLUE}" stroke-width="5" stroke-dasharray="12 9"/><path d="M780 298l14 12-14 12" stroke="${BLUE}" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
    const ok = Math.floor(R() * 3);
    [[270, 'Original'], [600, 'Second copy'], [960, 'Off-site']].forEach(([x], k) => { s += `<rect x="${x - 70}" y="430" width="140" height="14" rx="7" fill="rgba(233,236,242,.35)"/><circle cx="${x}" cy="480" r="16" fill="${k === ok ? BLUE : '#6FD79B'}"/><path d="M${x - 7} 480l5 6 10-11" stroke="${INK}" stroke-width="4" fill="none" stroke-linecap="round"/>`; });
    return s;
  },
  roi(R) { // balance scale
    let s = ''; const cx = 600, top = 160; const tilt = 6 + R() * 6;
    s += `<path d="M${cx} ${top}v330M${cx - 110} 500h220" stroke="${STROKE}" stroke-width="6" stroke-linecap="round"/><circle cx="${cx}" cy="${top}" r="14" fill="${BLUE}"/>`;
    s += `<g transform="rotate(${-tilt} ${cx} ${top + 20})"><path d="M${cx - 260} ${top + 20}H${cx + 260}" stroke="${STROKE}" stroke-width="6" stroke-linecap="round"/>`;
    for (const side of [-1, 1]) { const x = cx + side * 240; s += `<path d="M${x} ${top + 20}l-70 140M${x} ${top + 20}l70 140" stroke="${DIM}" stroke-width="3"/><path d="M${x - 90} ${top + 160}h180c0 40-40 60-90 60s-90-20-90-60z" fill="#141821" stroke="${side === 1 ? BLUE2 : STROKE}" stroke-width="4"/>`; }
    s += `<rect x="${cx - 285}" y="${top + 110}" width="90" height="46" rx="10" fill="rgba(233,236,242,.18)" stroke="${STROKE}" stroke-width="3"/>`;
    for (let i = 0; i < 3; i++) s += `<rect x="${cx + 200 + i * 2}" y="${top + 120 - i * 28}" width="${84 - i * 6}" height="24" rx="6" fill="${BLUE}" stroke="${BLUE2}" stroke-width="2"/>`;
    s += `</g>`;
    return s;
  },
  legacy(R) { // old CRT → modern screen
    let s = '';
    s += `<rect x="170" y="190" width="300" height="240" rx="26" fill="#141821" stroke="${DIM}" stroke-width="4"/><rect x="200" y="220" width="240" height="170" rx="14" fill="#0F1218" stroke="${DIM}"/>`;
    for (let i = 0; i < 6; i++) s += `<path d="M220 ${244 + i * 24}h${60 + R() * 120}" stroke="rgba(111,215,155,.45)" stroke-width="5" stroke-linecap="round"/>`;
    s += `<path d="M280 430l-20 50h120l-20-50" fill="#141821" stroke="${DIM}" stroke-width="4"/>`;
    s += `<path d="M520 320h130" stroke="${BLUE}" stroke-width="6" stroke-linecap="round" stroke-dasharray="14 10"/><path d="M640 300l26 20-26 20" stroke="${BLUE}" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
    s += `<rect x="700" y="160" width="380" height="250" rx="20" fill="#141821" stroke="${BLUE2}" stroke-width="3"/><rect x="720" y="182" width="90" height="206" rx="10" fill="rgba(255,255,255,.04)"/>`;
    for (let i = 0; i < 4; i++) s += `<path d="M734 ${210 + i * 34}h60" stroke="${i === 1 ? BLUE2 : DIM}" stroke-width="5" stroke-linecap="round"/>`;
    s += `<rect x="826" y="182" width="232" height="96" rx="12" fill="rgba(47,107,255,.18)"/><path d="M846 250 L880 226 L912 238 L950 206 L990 220 L1030 196" stroke="${BLUE}" stroke-width="4" fill="none"/><rect x="826" y="294" width="110" height="94" rx="12" fill="rgba(255,255,255,.05)"/><rect x="948" y="294" width="110" height="94" rx="12" fill="rgba(255,255,255,.05)"/>`;
    s += `<path d="M860 410v40M780 460h200" stroke="${STROKE}" stroke-width="5" stroke-linecap="round"/>`;
    return s;
  },
};

// Topic-specific art for posts whose category already has several covers
const COVER = {
  'ldc-graduation-traceability-factory-data': 'Industry',
  'mobile-apps-field-floor-teams': 'mobile',
  'digital-order-tracking-merchandisers': 'order',
  'preventive-maintenance-without-paperwork': 'maintenance',
  'attendance-leave-payroll-automation': 'hr',
  'ai-document-processing-human-review': 'docs',
  'backups-disaster-recovery-mid-size-business': 'backup',
  'measuring-software-roi-honestly': 'roi',
  'modernising-legacy-software': 'legacy',
};

for (const p of posts) {
  const R = rng(p.slug);
  const gx = r1(W * (0.25 + R() * 0.5)), gy = r1(H * (0.25 + R() * 0.4));
  const motif = (motifs[COVER[p.slug]] || motifs[p.category] || motifs.Strategy)(R);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${p.title.replace(/"/g, '&quot;')}">
<defs><radialGradient id="g" cx="${gx}" cy="${gy}" r="560" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${BLUE}" stop-opacity=".42"/><stop offset="1" stop-color="${BLUE}" stop-opacity="0"/></radialGradient>
<pattern id="p" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M48 0H0V48" fill="none" stroke="${LINE}" stroke-width="1"/></pattern>
<linearGradient id="scan" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${BLUE}" stop-opacity="0"/><stop offset="1" stop-color="${BLUE}" stop-opacity=".35"/></linearGradient><linearGradient id="v" x1="0" y1="0" x2="0" y2="1"><stop offset=".55" stop-color="${INK}" stop-opacity="0"/><stop offset="1" stop-color="${INK}" stop-opacity=".85"/></linearGradient></defs>
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
