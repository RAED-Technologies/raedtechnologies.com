// Blog index: filter article cards by category. Without JS every card stays visible.
(() => {
  const bar = document.querySelector('[data-bl-filters]');
  const grid = document.querySelector('[data-bl-grid]');
  if (!bar || !grid) return;
  const empty = document.querySelector('[data-bl-empty]');
  const items = [...grid.children];
  bar.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-filter]');
    if (!btn) return;
    const cat = btn.dataset.filter;
    bar.querySelectorAll('[data-filter]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    let shown = 0;
    items.forEach((li) => { const on = !cat || li.dataset.cat === cat; li.hidden = !on; if (on) shown += 1; });
    if (empty) empty.hidden = shown > 0;
  });
})();
