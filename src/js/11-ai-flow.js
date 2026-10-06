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
