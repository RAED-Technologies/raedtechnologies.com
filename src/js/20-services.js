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
