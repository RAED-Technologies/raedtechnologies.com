/* 00-core.js */
// Core: header state, mobile nav, scroll reveal. Each feature module guards on its own elements.
document.documentElement.classList.add('js');
window.RAED = window.RAED || {};
RAED.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

(() => {
  const header = document.querySelector('[data-header]');
  const toggle = document.querySelector('[data-nav-toggle]');
  const body = document.body;

  if (header) {
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    // Adapt the scrolled header when it sits over a dark band (AI section, CTA band, footer...).
    const darks = document.querySelectorAll('.section--dark, .page-hero, .hero, .site-footer');
    if (darks.length && 'IntersectionObserver' in window) {
      const under = new Set();
      const hio = new IntersectionObserver((entries) => {
        entries.forEach((en) => (en.isIntersecting ? under.add(en.target) : under.delete(en.target)));
        header.classList.toggle('is-on-dark', under.size > 0);
      }, { rootMargin: `-31px 0px -${Math.max(0, window.innerHeight - 33)}px 0px` }); // 2px line at the header's middle
      darks.forEach((el) => hio.observe(el));
    }
  }

  if (toggle) {
    const setOpen = (open) => {
      body.classList.toggle('nav-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      // Keep focus inside the full-screen menu: everything behind it becomes inert.
      document.querySelectorAll('#main, .site-footer, .skip-link, .site-header .brand').forEach((el) => {
        if ('inert' in el) el.inert = open;
        else if (open) el.setAttribute('aria-hidden', 'true');
        else el.removeAttribute('aria-hidden');
      });
    };
    toggle.addEventListener('click', () => setOpen(!body.classList.contains('nav-open')));
    document.querySelectorAll('#site-nav a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && body.classList.contains('nav-open')) { setOpen(false); toggle.focus(); } });
    window.matchMedia('(min-width: 961px)').addEventListener('change', (e) => e.matches && setOpen(false));
  }

  // Reveal on scroll. Stagger siblings via [data-reveal-group] > [data-reveal].
  document.querySelectorAll('[data-reveal-group]').forEach((g) =>
    g.querySelectorAll(':scope > [data-reveal]').forEach((el, i) => el.style.setProperty('--i', i)));
  const items = document.querySelectorAll('[data-reveal]');
  if (!('IntersectionObserver' in window) || RAED.reducedMotion) {
    items.forEach((el) => el.classList.add('is-visible'));
  } else {
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }
    }), { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach((el) => io.observe(el));
  }
})();

/* 10-hero.js */
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

/* 11-ai-flow.js */
// Home: AI flow stage sequencer + service card pointer highlight.
(() => {
  document.querySelectorAll('.svc-card').forEach((card) => card.addEventListener('pointermove', (e) => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - r.left}px`);
    card.style.setProperty('--my', `${e.clientY - r.top}px`);
  }));

  const flow = document.querySelector('[data-ai-flow]');
  if (!flow) return;
  const steps = Array.from(flow.querySelectorAll('.ai-step'));
  const n = steps.length;
  if (RAED.reducedMotion || !('IntersectionObserver' in window)) { steps.forEach((s) => s.classList.add('is-done')); return; }
  let cur = -1, timer = null;
  const tick = () => {
    cur = (cur + 1) % (n + 1); // extra beat: all steps settled before restart
    steps.forEach((s, i) => {
      s.classList.toggle('is-current', i === cur);
      s.classList.toggle('is-done', i < cur || cur === n);
      s.classList.remove('is-flowing');
    });
    if (cur < n - 1) { void steps[cur].offsetWidth; steps[cur].classList.add('is-flowing'); }
  };
  new IntersectionObserver((en) => {
    if (en[0].isIntersecting) { if (!timer) { tick(); timer = setInterval(tick, 1800); } }
    else { clearInterval(timer); timer = null; }
  }, { threshold: 0.3 }).observe(flow);
})();

/* 12-home-b.js */
// 12-home-b: engineering principles accordion + solutions tabs (home).
(function () {
  // Principles: one item open at a time; opens on click, focus and (fine-pointer) hover.
  var list = document.querySelector('[data-principles]');
  if (list) {
    var items = [].slice.call(list.querySelectorAll('.eng-item'));
    var hover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    var open = function (item) {
      items.forEach(function (it) {
        var on = it === item;
        it.classList.toggle('is-active', on);
        it.querySelector('.eng-item__btn').setAttribute('aria-expanded', String(on));
      });
    };
    items.forEach(function (it) {
      var btn = it.querySelector('.eng-item__btn');
      btn.addEventListener('click', function () { open(it); });
      btn.addEventListener('focus', function () { open(it); });
      if (hover) it.addEventListener('mouseenter', function () { open(it); });
    });
    open(items[0]);
  }

  // Solutions: ARIA tabs on desktop; stacked cards on small screens.
  var wrap = document.querySelector('[data-sol-tabs]');
  if (!wrap) return;
  var tabs = [].slice.call(wrap.querySelectorAll('[role="tab"]'));
  var panels = tabs.map(function (t) { return document.getElementById(t.getAttribute('aria-controls')); });
  var mq = window.matchMedia('(min-width: 960px)');
  var current = 0;
  var select = function (i, focus) {
    current = i;
    tabs.forEach(function (t, j) {
      var on = j === i;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      panels[j].hidden = !on;
    });
    if (focus) tabs[i].focus();
  };
  var apply = function () {
    wrap.classList.toggle('is-tabs', mq.matches);
    var tabsMode = mq.matches;
    // Tabpanel semantics only while the tablist is visible; stacked cards are plain groups.
    panels.forEach(function (p, j) {
      if (tabsMode) {
        p.setAttribute('role', 'tabpanel');
        p.setAttribute('aria-labelledby', tabs[j].id);
        p.tabIndex = 0;
      } else {
        p.setAttribute('role', 'group');
        p.removeAttribute('tabindex');
        p.removeAttribute('aria-labelledby');
        p.setAttribute('aria-label', (p.querySelector('h3') || {}).textContent || '');
        p.hidden = false;
      }
    });
    if (tabsMode) panels.forEach(function (p) { p.removeAttribute('aria-label'); });
    if (tabsMode) select(current);
  };
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { select(i); });
    t.addEventListener('keydown', function (e) {
      var n = tabs.length, k = e.key, to = null;
      if (k === 'ArrowDown' || k === 'ArrowRight') to = (i + 1) % n;
      else if (k === 'ArrowUp' || k === 'ArrowLeft') to = (i - 1 + n) % n;
      else if (k === 'Home') to = 0;
      else if (k === 'End') to = n - 1;
      if (to !== null) { e.preventDefault(); select(to, true); }
    });
  });
  mq.addEventListener ? mq.addEventListener('change', apply) : mq.addListener(apply);
  apply();
})();

/* 20-services.js */
// Services page: build in-page index from articles + scrollspy.
(() => {
  const list = document.querySelector('[data-svc-index-list]');
  const items = document.querySelectorAll('[data-svc-item]');
  if (!list || !items.length) return;

  const links = new Map();
  items.forEach((it) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = '#' + it.id;
    a.innerHTML = '<span class="svc-index__n">' + it.dataset.index + '</span>';
    a.appendChild(document.createTextNode(it.dataset.title));
    li.appendChild(a);
    list.appendChild(li);
    links.set(it.id, a);
  });

  let current = null;
  const setActive = (id) => {
    if (id === current) return;
    if (current) { links.get(current).classList.remove('is-active'); links.get(current).removeAttribute('aria-current'); }
    const a = links.get(id);
    a.classList.add('is-active');
    a.setAttribute('aria-current', 'true');
    current = id;
    // keep active chip visible in horizontal row (mobile) without vertical scroll jumps
    if (list.scrollWidth > list.clientWidth) {
      const left = list.scrollLeft + a.getBoundingClientRect().left - list.getBoundingClientRect().left - (list.clientWidth - a.offsetWidth) / 2;
      list.scrollTo({ left: left, behavior: RAED.reducedMotion ? 'auto' : 'smooth' });
    }
  };

  if (!('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) setActive(en.target.id); });
  }, { rootMargin: '-35% 0px -60% 0px' });
  items.forEach((it) => io.observe(it));
  setActive(items[0].id);
})();

/* 22-timeline.js */
// 22: scroll-linked progress for every [data-timeline]. Fill grows with scroll; nodes activate in sequence.
(() => {
  const lists = document.querySelectorAll('[data-timeline]');
  if (!lists.length || RAED.reducedMotion) return;
  const mq = window.matchMedia('(min-width: 960px)');

  const items = Array.prototype.map.call(lists, (ol) => {
    const steps = Array.prototype.slice.call(ol.querySelectorAll('.timeline__step'));
    ol.classList.add('is-live');
    return { ol, steps, nodes: steps.map((s) => s.querySelector('.timeline__node')), offsets: [], len: 0 };
  });

  // Measure node centres along the active axis; track runs first -> last node.
  const measure = () => {
    const h = mq.matches;
    items.forEach((t) => {
      const box = t.ol.getBoundingClientRect();
      t.offsets = t.nodes.map((n) => {
        const r = n.getBoundingClientRect();
        return h ? r.left + r.width / 2 - box.left : r.top + r.height / 2 - box.top;
      });
      const start = t.offsets[0] || 0;
      t.len = Math.max(0, (t.offsets[t.offsets.length - 1] || 0) - start);
      t.ol.style.setProperty('--tl-start', start + 'px');
      t.ol.style.setProperty('--tl-len', t.len + 'px');
    });
    update();
  };

  const update = () => {
    const vh = window.innerHeight;
    const h = mq.matches;
    items.forEach((t) => {
      const r = t.ol.getBoundingClientRect();
      // Horizontal: fill over a short scroll window. Vertical: follow a reading line at ~62% viewport.
      const p = h ? (vh * 0.88 - r.top) / (vh * 0.42) : (vh * 0.62 - r.top - (t.offsets[0] || 0)) / (t.len || 1);
      const prog = Math.min(1, Math.max(0, p));
      t.ol.style.setProperty('--tl-p', prog.toFixed(4));
      const reach = prog * t.len + (t.offsets[0] || 0) + 1;
      let current = -1;
      t.steps.forEach((s, i) => {
        const on = prog > 0 && t.offsets[i] <= reach;
        s.classList.toggle('is-active', on);
        if (on) current = i;
      });
      t.steps.forEach((s, i) => s.classList.toggle('is-current', i === current && prog < 1));
    });
  };

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; update(); });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', measure);
  if (mq.addEventListener) mq.addEventListener('change', measure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  measure();
})();

/* 24-form.js */
// Contact form: client validation, fetch submit, honest status messages. Works without JS via normal POST.
(() => {
  const form = document.querySelector('[data-contact-form]');
  if (!form) return;

  const FALLBACK = form.dataset.fallback || 'dev@raedtechnologies.com';
  const status = form.querySelector('[data-cf-status]');
  const submit = form.querySelector('[data-cf-submit]');
  const started = Date.now();
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fallback = `<a href="mailto:${FALLBACK}">${FALLBACK}</a>`;

  const setStatus = (html, ok) => {
    status.classList.toggle('is-ok', !!ok);
    status.innerHTML = html;
  };

  const rules = {
    name: (v) => (v ? '' : 'Please enter your full name.'),
    email: (v) => (!v ? 'Please enter your work email.' : EMAIL_RE.test(v) ? '' : 'Please enter a valid email address.'),
    service: (v) => (v ? '' : 'Please choose what we can help with.'),
    message: (v) => (!v ? 'Please describe your project or requirement.' : v.length < 20 ? 'Please add a little more detail (at least 20 characters).' : ''),
  };

  const showError = (field, msg) => {
    const id = `${field.id}-error`;
    let err = document.getElementById(id);
    if (msg) {
      if (!err) {
        err = document.createElement('p');
        err.className = 'cf-error';
        err.id = id;
        field.closest('.cf-field').appendChild(err);
      }
      err.textContent = msg;
      field.setAttribute('aria-invalid', 'true');
      field.setAttribute('aria-describedby', id);
    } else {
      if (err) err.remove();
      field.removeAttribute('aria-invalid');
      field.removeAttribute('aria-describedby');
    }
    return !msg;
  };

  const check = (name) => {
    const field = form.elements[name];
    return showError(field, rules[name](field.value.trim()));
  };

  const validate = () => {
    let first = null;
    Object.keys(rules).forEach((name) => {
      if (!check(name) && !first) first = form.elements[name];
    });
    if (first) first.focus();
    return !first;
  };

  // Re-validate a field once the user has interacted with it after an error
  Object.keys(rules).forEach((name) => {
    const field = form.elements[name];
    const live = () => { if (field.getAttribute('aria-invalid') === 'true') check(name); };
    field.addEventListener('input', live);
    field.addEventListener('change', live);
    field.addEventListener('blur', () => { if (field.value.trim()) check(name); });
  });

  const setLoading = (on) => {
    submit.classList.toggle('is-loading', on);
    submit.disabled = on;
    submit.setAttribute('aria-busy', String(on));
    submit.querySelector('.cf-submit__label').textContent = on ? 'Sending…' : 'Send Inquiry';
  };

  const success = (email) => {
    const panel = document.createElement('div');
    panel.className = 'cf-success';
    panel.setAttribute('role', 'status');
    panel.tabIndex = -1;
    panel.innerHTML = '<span class="icon-box"><svg class="icon" aria-hidden="true"><use href="#i-check"/></svg></span>' +
      '<h3>Thank you — your inquiry has been sent.</h3>' +
      `<p>${email ? `We'll get back to you at <strong>${esc(email)}</strong>.` : "We'll get back to you soon."}</p>`;
    form.replaceWith(panel);
    panel.focus({ preventScroll: true });
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    setStatus('');
    if (!validate()) return;
    const subject = form.querySelector('[data-cf-subject]');
    if (subject) subject.value = `New inquiry: ${form.elements.service.value} — ${form.elements.name.value.trim()}`;
    if (!window.fetch || !window.FormData) { form.submit(); return; }
    // Basic bot check: honeypot filled or submitted implausibly fast → pretend success, send nothing.
    if (form.elements._honey.value || Date.now() - started < 3000) { success(form.elements.email.value.trim()); return; }

    setLoading(true);
    const email = form.elements.email.value.trim();
    fetch(form.dataset.ajax || form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
      .then((res) => res.json().catch(() => ({})))
      .then((data) => {
        if (data && String(data.success) === 'true') { success(email); return; }
        const reason = 'We couldn\'t send your inquiry right now.';
        setStatus(`${reason} Please try again, or email us directly at ${fallback}.`);
        setLoading(false);
      })
      .catch(() => {
        setStatus(`We couldn't reach the server. Please check your connection and try again, or email us directly at ${fallback}.`);
        setLoading(false);
      });
  });

  // Inquiry category chips (contact page): preselect the type and move to the form.
  document.querySelectorAll('[data-inquiry]').forEach((chip) => chip.addEventListener('click', () => {
    const select = form.isConnected && form.elements.service;
    if (!select) return;
    select.value = chip.getAttribute('data-inquiry');
    if (select.value) check('service');
    select.scrollIntoView({ behavior: RAED.reducedMotion ? 'auto' : 'smooth', block: 'center' });
    select.focus({ preventScroll: true });
  }));

  // No-JS fallback round trip: the form service redirects (_next) to /contact/?sent=1 or ?error=1
  const q = new URLSearchParams(window.location.search);
  if (q.has('sent') || q.has('error')) {
    if (q.get('sent') === '1') success('');
    else setStatus(`Sorry, your inquiry couldn't be sent. Please check the details and try again, or email us directly at ${fallback}.`);
    if (window.history.replaceState) window.history.replaceState(null, '', window.location.pathname + window.location.hash);
  }
})();
