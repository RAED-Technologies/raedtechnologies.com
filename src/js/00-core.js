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
