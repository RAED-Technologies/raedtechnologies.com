// Careers form: client validation incl. CV file checks, fetch submit with the file, honest status messages. Works without JS via normal POST.
(() => {
  const form = document.querySelector('[data-careers-form]');
  if (!form) return;

  const FALLBACK = form.dataset.fallback || 'info@raedtechnologies.com';
  const status = form.querySelector('[data-cf-status]');
  const submit = form.querySelector('[data-cf-submit]');
  const started = Date.now();
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const MAX_CV = 5 * 1024 * 1024;
  const CV_RE = /\.(pdf|docx?)$/i;
  const fallback = `<a href="mailto:${FALLBACK}">${FALLBACK}</a>`;

  const setStatus = (html) => { status.innerHTML = html; };

  const rules = {
    name: (f) => (f.value.trim() ? '' : 'Please enter your full name.'),
    email: (f) => { const v = f.value.trim(); return !v ? 'Please enter your email.' : EMAIL_RE.test(v) ? '' : 'Please enter a valid email address.'; },
    phone: (f) => (f.value.trim().replace(/\D/g, '').length >= 7 ? '' : 'Please enter a phone number we can call.'),
    location: (f) => (f.value.trim() ? '' : 'Please enter your current location.'),
    position: (f) => (f.value ? '' : 'Please choose a position.'),
    experience: (f) => (f.value ? '' : 'Please choose your experience.'),
    availability: (f) => (f.value.trim() ? '' : 'Please tell us when you could start.'),
    link: (f) => { const v = f.value.trim(); return !v || /^https?:\/\/\S+\.\S+/.test(v) ? '' : 'Please enter a full link starting with https://'; },
    attachment: (f) => {
      const file = f.files && f.files[0];
      if (!file) return 'Please attach your CV.';
      if (!CV_RE.test(file.name)) return 'Please upload a PDF, DOC or DOCX file.';
      if (file.size > MAX_CV) return 'Your CV is larger than 5 MB. Please upload a smaller file.';
      return '';
    },
    consent: (f) => (f.checked ? '' : 'Please confirm we may store your details for recruitment.'),
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

  const check = (name) => showError(form.elements[name], rules[name](form.elements[name]));

  const validate = () => {
    let first = null;
    Object.keys(rules).forEach((name) => { if (!check(name) && !first) first = form.elements[name]; });
    if (first) first.focus();
    return !first;
  };

  Object.keys(rules).forEach((name) => {
    const field = form.elements[name];
    const live = () => { if (field.getAttribute('aria-invalid') === 'true' || field.type === 'file') check(name); };
    field.addEventListener('input', live);
    field.addEventListener('change', live);
    if (field.type !== 'file' && field.type !== 'checkbox') field.addEventListener('blur', () => { if (field.value.trim()) check(name); });
  });

  const setLoading = (on) => {
    submit.classList.toggle('is-loading', on);
    submit.disabled = on;
    submit.setAttribute('aria-busy', String(on));
    submit.querySelector('.cf-submit__label').textContent = on ? 'Sending…' : 'Submit Application';
  };

  const success = () => {
    const panel = document.createElement('div');
    panel.className = 'cf-success';
    panel.setAttribute('role', 'status');
    panel.tabIndex = -1;
    panel.innerHTML = '<span class="icon-box"><svg class="icon" aria-hidden="true"><use href="#i-check"/></svg></span>' +
      '<h3>Thank you — we’ve received your application.</h3>' +
      '<p>Our team will review your profile. If it matches a current or upcoming role, we will contact you within 2 weeks.</p>';
    form.replaceWith(panel);
    panel.focus({ preventScroll: true });
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    setStatus('');
    if (!validate()) return;
    const subject = form.querySelector('[data-cf-subject]');
    if (subject) subject.value = `Job application: ${form.elements.position.value} — ${form.elements.name.value.trim()}`;
    if (!window.fetch || !window.FormData) { form.submit(); return; }
    // Basic bot check: honeypot filled or submitted implausibly fast → pretend success, send nothing.
    if (form.elements._honey.value || Date.now() - started < 3000) { success(); return; }

    setLoading(true);
    fetch(form.dataset.ajax || form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
      .then((res) => res.json().catch(() => ({})))
      .then((data) => {
        if (data && String(data.success) === 'true') { success(); return; }
        setStatus(`We couldn’t send your application right now. Please try again, or email your CV to ${fallback}.`);
        setLoading(false);
      })
      .catch(() => {
        setStatus(`We couldn’t reach the server. Please check your connection and try again, or email your CV to ${fallback}.`);
        setLoading(false);
      });
  });

  // No-JS fallback round trip: the form service redirects (_next) to /careers/?sent=1
  const q = new URLSearchParams(window.location.search);
  if (q.has('sent') || q.has('error')) {
    if (q.get('sent') === '1') success();
    else setStatus(`Sorry, your application couldn’t be sent. Please try again, or email your CV to ${fallback}.`);
    if (window.history.replaceState) window.history.replaceState(null, '', window.location.pathname + window.location.hash);
  }
})();
