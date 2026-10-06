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
