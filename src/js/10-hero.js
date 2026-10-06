// Hero: layered "system architecture" network with data particles flowing between nodes.
(() => {
  const canvas = document.querySelector('[data-hero-canvas]');
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');
  const hero = canvas.closest('.hero') || canvas.parentElement;
  const reduced = !!(window.RAED && RAED.reducedMotion);
  const BLUE = '47,107,255', SOFT = '127,165,255';
  const LABELS = ['Interface', 'Gateway', 'Services', 'Data', 'Intelligence'];
  let cols = [], w = 0, h = 0, dpr = 1, nodes = [], edges = [], parts = [], raf = 0, visible = true, last = 0, built = 0;
  const mouse = { x: -1e4, y: -1e4, px: 0, py: 0, tx: 0, ty: 0 };

  // Deterministic PRNG so the layout is stable across reloads
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

  function build() {
    const r = canvas.getBoundingClientRect();
    w = r.width; h = r.height; built = w;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed = 7; nodes = []; edges = []; parts = []; cols = [];
    const desktop = window.matchMedia('(min-width: 960px)').matches, small = !desktop && w < 640;
    const layers = small ? [2, 3, 3, 2] : [3, 4, 5, 4, 2];
    const padX = w * (small ? 0.1 : 0.12), padY = h * (small ? 0.2 : 0.26);
    layers.forEach((n, li) => {
      const x = padX + (w - padX * 2) * (li / (layers.length - 1));
      if (desktop) cols.push({ x, label: LABELS[li], depth: 0.4 + li / layers.length });
      for (let i = 0; i < n; i++) {
        const y = padY + (h - padY * 2) * ((i + 0.5) / n) + (rnd() - 0.5) * h * 0.06;
        nodes.push({ x: x + (rnd() - 0.5) * w * 0.04, y, li, depth: 0.4 + li / layers.length, hub: rnd() < 0.28, glow: 0, out: [] });
      }
    });
    // Connect each node to 1-2 nearest nodes in the next layer; ensure every node has an input
    nodes.forEach((a) => {
      const next = nodes.filter((b) => b.li === a.li + 1).sort((p, q) => Math.abs(p.y - a.y) - Math.abs(q.y - a.y));
      next.slice(0, rnd() < 0.55 ? 2 : 1).forEach((b, k) => { if (!k || Math.abs(b.y - a.y) < h * 0.22) link(a, b); });
    });
    nodes.forEach((b) => {
      if (b.li && !edges.some((e) => e.b === b)) {
        const prev = nodes.filter((a) => a.li === b.li - 1).sort((p, q) => Math.abs(p.y - b.y) - Math.abs(q.y - b.y));
        link(prev[0], b);
      }
    });
    const count = small ? 7 : 14;
    for (let i = 0; i < count; i++) spawn(rnd());
  }
  function link(a, b) { const e = { a, b }; edges.push(e); a.out.push(e); }
  function spawn(t) {
    const starts = edges.filter((e) => e.a.li === 0);
    const e = t !== undefined ? edges[Math.floor(rnd() * edges.length)] : starts[Math.floor(Math.random() * starts.length)];
    parts.push({ e, t: t || 0, v: 0.18 + Math.random() * 0.16, accent: Math.random() < 0.6 });
  }

  // Parallax-shifted position (deeper layers move more)
  const pos = (n) => [n.x + mouse.px * n.depth * 14, n.y + mouse.py * n.depth * 10];
  // Gentle curve: horizontal-tangent cubic between two nodes
  function curve(a, b, t) {
    const [x1, y1] = pos(a), [x2, y2] = pos(b), mx = (x2 - x1) * 0.5, u = 1 - t;
    return [u*u*u*x1 + 3*u*u*t*(x1+mx) + 3*u*t*t*(x2-mx) + t*t*t*x2, u*u*u*y1 + 3*u*u*t*y1 + 3*u*t*t*y2 + t*t*t*y2];
  }
  const near = (x, y) => Math.max(0, 1 - Math.hypot(x - mouse.x, y - mouse.y) / 160);

  function draw(dt) {
    ctx.clearRect(0, 0, w, h);
    mouse.px += (mouse.tx - mouse.px) * Math.min(1, dt * 3);
    mouse.py += (mouse.ty - mouse.py) * Math.min(1, dt * 3);
    // Layer guides + labels
    ctx.font = '500 10px "Geist Mono", ui-monospace, monospace'; ctx.textAlign = 'center';
    ctx.setLineDash([2, 6]); ctx.strokeStyle = 'rgba(255,255,255,.06)'; ctx.lineWidth = 1;
    cols.forEach((c) => {
      const x = c.x + mouse.px * c.depth * 14;
      ctx.beginPath(); ctx.moveTo(x, h * 0.21); ctx.lineTo(x, h * 0.79); ctx.stroke();
      ctx.fillStyle = 'rgba(169,176,188,.55)'; ctx.fillText(c.label.toUpperCase(), x, h * 0.21 - 12);
    });
    ctx.setLineDash([]);
    // Edges
    ctx.lineWidth = 1;
    edges.forEach(({ a, b }) => {
      const [x1, y1] = pos(a), [x2, y2] = pos(b), mx = (x2 - x1) * 0.5;
      const hl = Math.max(near(x1, y1), near(x2, y2), (a.glow + b.glow) * 0.4);
      ctx.strokeStyle = hl > 0.02 ? `rgba(${SOFT},${0.12 + hl * 0.35})` : 'rgba(255,255,255,.1)';
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.bezierCurveTo(x1 + mx, y1, x2 - mx, y2, x2, y2); ctx.stroke();
    });
    // Particles with short trails
    parts.forEach((p) => {
      const [x, y] = curve(p.e.a, p.e.b, p.t), [tx, ty] = curve(p.e.a, p.e.b, Math.max(0, p.t - 0.12));
      const g = ctx.createLinearGradient(tx, ty, x, y), c = p.accent ? BLUE : SOFT;
      g.addColorStop(0, `rgba(${c},0)`); g.addColorStop(1, `rgba(${c},.9)`);
      ctx.strokeStyle = g; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(x, y); ctx.stroke();
      ctx.fillStyle = p.accent ? `rgb(${SOFT})` : '#fff';
      ctx.beginPath(); ctx.arc(x, y, 1.6, 0, 6.283); ctx.fill();
    });
    // Nodes
    nodes.forEach((n) => {
      const [x, y] = pos(n), hl = Math.min(1, n.glow + near(x, y));
      if (hl > 0.02) {
        const g = ctx.createRadialGradient(x, y, 0, x, y, 26);
        g.addColorStop(0, `rgba(${BLUE},${0.35 * hl})`); g.addColorStop(1, `rgba(${BLUE},0)`);
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 26, 0, 6.283); ctx.fill();
      }
      ctx.fillStyle = '#0B0D12';
      ctx.strokeStyle = n.hub ? `rgba(${SOFT},${0.55 + hl * 0.45})` : `rgba(255,255,255,${0.22 + hl * 0.5})`;
      ctx.lineWidth = 1;
      if (n.hub) {
        const s = 7; ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(x - s, y - s, s * 2, s * 2, 3); else ctx.rect(x - s, y - s, s * 2, s * 2);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = `rgba(${BLUE},${0.7 + hl * 0.3})`; ctx.fillRect(x - 2, y - 2, 4, 4);
      } else {
        ctx.beginPath(); ctx.arc(x, y, 3.5, 0, 6.283); ctx.fill(); ctx.stroke();
      }
    });
  }

  function step(dt) {
    nodes.forEach((n) => { n.glow = Math.max(0, n.glow - dt * 1.4); });
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.t += p.v * dt;
      if (p.t >= 1) {
        const n = p.e.b; n.glow = 1;
        if (n.out.length) { p.e = n.out[Math.floor(Math.random() * n.out.length)]; p.t -= 1; }
        else { parts.splice(i, 1); spawn(); }
      }
    }
  }

  function loop(now) {
    const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
    step(dt); draw(dt);
    raf = requestAnimationFrame(loop);
  }
  const start = () => { if (!raf && !reduced && visible && !document.hidden) { last = 0; raf = requestAnimationFrame(loop); } };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };

  build(); draw(0);

  // Rebuild on size change (debounced); ResizeObserver also catches layout-driven changes
  let rt;
  const onResize = () => {
    clearTimeout(rt);
    rt = setTimeout(() => { const r = canvas.getBoundingClientRect(); if (Math.abs(r.width - built) > 1 || Math.abs(r.height - h) > 40) { build(); draw(0); } }, 150);
  };
  if ('ResizeObserver' in window) new ResizeObserver(onResize).observe(canvas); else window.addEventListener('resize', onResize, { passive: true });
  if (reduced) return;

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; visible ? start() : stop(); }).observe(canvas);
  }
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    hero.addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
      mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2; mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });
    hero.addEventListener('pointerleave', () => { mouse.x = mouse.y = -1e4; mouse.tx = mouse.ty = 0; });
  }
  start();
})();
