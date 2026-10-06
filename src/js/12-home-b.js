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
