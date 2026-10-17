// Blog index: category filters + "Show more" paging. Without JS every card stays visible.
(() => {
  const bar = document.querySelector('[data-bl-filters]');
  const grid = document.querySelector('[data-bl-grid]');
  if (!bar || !grid) return;
  const empty = document.querySelector('[data-bl-empty]');
  const moreWrap = document.querySelector('[data-bl-more-wrap]');
  const moreBtn = document.querySelector('[data-bl-more]');
  const items = [...grid.children];
  const PAGE = 15;
  let cat = '';
  let limit = PAGE;

  const apply = () => {
    const matches = items.filter((li) => !cat || li.dataset.cat === cat);
    items.forEach((li) => { li.hidden = true; });
    matches.forEach((li, i) => {
      li.hidden = !cat && i >= limit;
    });
    if (empty) empty.hidden = matches.length > 0;
    if (moreWrap) moreWrap.hidden = !!cat || matches.length <= limit;
  };

  bar.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-filter]');
    if (!btn) return;
    cat = btn.dataset.filter;
    bar.querySelectorAll('[data-filter]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    apply();
  });

  if (moreBtn) moreBtn.addEventListener('click', () => {
    const first = items.find((li, i) => i === limit);
    limit += PAGE;
    apply();
    if (first) first.querySelector('a').focus({ preventScroll: true });
  });

  apply();
})();
