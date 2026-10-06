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
