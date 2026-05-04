// js/parent-badge.js
(function () {
  function renderParent(name) {
    const badge = document.getElementById('parentBadge');
    const nameEl = document.getElementById('parentName');
    const hasName = name && String(name).trim() !== '';

    if (badge && nameEl && hasName) {
      nameEl.textContent = name;
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
        renderParent(obj.parent_name);
        return;
      }
      sessionStorage.removeItem('pq_payload');
    }
  } catch(e) {}

  const mtoken = window.__mtoken;
  if (!mtoken) return;

  fetch(
    'https://quraan.academy/local/hubredirect/exchange.php?token=' +
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
    renderParent(data.parent_name);
  }).catch(() => {});
})();
