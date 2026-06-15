// js/parent-badge.js
(function () {
  function normalizeAccountLabel(type, label) {
    if (label && String(label).trim() !== '') return String(label).trim();
    if (type === 'student') return 'Student ID';
    if (type === 'teacher') return 'Teacher ID';
    if (type === 'parent') return 'Parent ID';
    return 'Account ID';
  }

  function cacheAccount(data) {
    if (!data || !data.account_id) return;
    window.__prequran_account_id = String(data.account_id);
    window.__prequran_account_type = data.account_type ? String(data.account_type) : '';
    window.__prequran_account_label = normalizeAccountLabel(data.account_type, data.account_label);
    try {
      sessionStorage.setItem('pq_account_id', window.__prequran_account_id);
      sessionStorage.setItem('pq_account_type', window.__prequran_account_type);
      sessionStorage.setItem('pq_account_label', window.__prequran_account_label);
    } catch(e) {}
  }

  function renderIdentity(data) {
    const badge = document.getElementById('parentBadge');
    const labelEl = document.getElementById('parentLbl');
    const nameEl = document.getElementById('parentName');
    const accountId = data && data.account_id ? String(data.account_id).trim() : '';
    const parentName = data && data.parent_name ? String(data.parent_name).trim() : '';
    const value = accountId || parentName;
    const label = accountId ? '' : 'Parent';

    if (badge && nameEl && value) {
      if (labelEl) labelEl.textContent = label;
      nameEl.textContent = value;
      badge.classList.remove('hidden');
    } else if (badge) {
      badge.classList.add('hidden');
    }
  }

  try {
    const cached = sessionStorage.getItem('pq_payload');
    if (cached) {
      const obj = JSON.parse(cached);
      if (!obj._ts || (Date.now() - obj._ts) < 10 * 60 * 1000) {
        cacheAccount(obj);
        renderIdentity(obj);
        return;
      }
      sessionStorage.removeItem('pq_payload');
    }
  } catch(e) {}

  const mtoken = window.__mtoken;
  if (!mtoken) return;

  function moodleOrigin() {
    try {
      const params = new URLSearchParams(window.location.search || '');
      const configured = params.get('moodle_origin') || params.get('moodle_base') || params.get('moodle');
      if (configured) return new URL(configured).origin;

      const host = String(window.location.hostname || '').toLowerCase();
      if (host.indexOf('quraantest') !== -1) return 'https://quraantest.academy';
    } catch(e) {}
    return 'https://quraan.academy';
  }

  fetch(
    moodleOrigin() + '/local/hubredirect/exchange.php?token=' +
    encodeURIComponent(mtoken),
    {
      method:'GET',
      headers:{ 'Accept':'application/json' }
    }
  ).then(async (res) => {
    let data = {};
    try {
      data = await res.json();
    } catch(_) {}

    if (!res.ok) return;

    try {
      data._ts = Date.now();
      sessionStorage.setItem('pq_payload', JSON.stringify(data));
    } catch(e) {}
    cacheAccount(data);
    renderIdentity(data);
  }).catch(() => {});
})();
