// Thin top progress bar, shown only when a same-site page takes more than 500 ms to open after a click.
(() => {
  const DELAY = 500;
  let timer = null;
  let bar = null;

  const reset = () => {
    clearTimeout(timer);
    timer = null;
    if (bar) { bar.remove(); bar = null; }
  };

  const show = () => {
    bar = document.createElement('div');
    bar.className = 'nav-progress';
    bar.setAttribute('role', 'progressbar');
    bar.setAttribute('aria-label', 'Loading page');
    document.body.appendChild(bar);
    requestAnimationFrame(() => bar && bar.classList.add('is-running'));
  };

  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest('a[href]');
    if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.search === location.search && url.hash) return; // in-page anchor
    reset();
    timer = setTimeout(show, DELAY);
  });

  // Back/forward cache restores the old page with the bar still on screen; clear it.
  window.addEventListener('pageshow', reset);
  window.addEventListener('pagehide', () => clearTimeout(timer));
})();
