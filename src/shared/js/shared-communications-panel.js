/* PreQuraan communications panel: announcements and private parent-teacher messages. */
(function () {
  'use strict';

  const CFG = {
    endpointDefault: 'https://quraan.academy/webservice/rest/server.php',
    pollMs: 60000,
    waitMs: 5000
  };

  let state = {
    inited: false,
    open: false,
    loading: false,
    activeTab: 'announcement',
    threadsByType: {
      announcement: [],
      parent_teacher: []
    },
    selectedThread: null,
    selectedMessages: [],
    timer: null
  };

  function qp(name) {
    try { return new URLSearchParams(window.location.search || '').get(name) || ''; } catch (_) { return ''; }
  }

  function getToken() {
    const token = window.__prequran_ws_token || (window.PQIframe && window.PQIframe.getToken && window.PQIframe.getToken());
    if (token) return String(token);
    try { return sessionStorage.getItem('pq_ws_token') || ''; } catch (_) { return ''; }
  }

  function getUid() {
    const uid = window.__prequran_uid || (window.PQIframe && window.PQIframe.getUid && window.PQIframe.getUid());
    if (uid) return parseInt(uid, 10) || 0;
    return parseInt(qp('uid') || qp('userid') || qp('studentid') || '0', 10) || 0;
  }

  function getEndpoint() {
    const endpoint = window.__prequran_ws_endpoint || qp('wsendpoint') || qp('ws_endpoint') || qp('ws') || CFG.endpointDefault;
    return String(endpoint || CFG.endpointDefault);
  }

  function getCohortId() {
    const candidates = [
      window.__prequran_cohortid,
      window.__prequran_cohort_id,
      window.PQ_COMM_COHORT_ID,
      qp('cohortid'),
      qp('cohort_id'),
      qp('cid')
    ];
    try {
      const stored = sessionStorage.getItem('pq_cohortid') || sessionStorage.getItem('pq_cohort_id');
      if (stored) candidates.push(stored);
    } catch (_) {}
    try {
      if (window.PQ && window.PQ.config && window.PQ.config.moodle) {
        candidates.push(window.PQ.config.moodle.cohortid, window.PQ.config.moodle.cohortId);
      }
    } catch (_) {}

    for (const value of candidates) {
      const parsed = parseInt(value, 10);
      if (parsed > 0) {
        try { sessionStorage.setItem('pq_cohortid', String(parsed)); } catch (_) {}
        return parsed;
      }
    }
    return 0;
  }

  function getStudentId() {
    const candidates = [
      window.__prequran_studentid,
      window.__prequran_childid,
      window.PQ_COMM_STUDENT_ID,
      qp('studentid'),
      qp('childid')
    ];
    try {
      const stored = sessionStorage.getItem('pq_studentid') || sessionStorage.getItem('pq_childid');
      if (stored) candidates.push(stored);
    } catch (_) {}
    try {
      if (window.PQ && window.PQ.config && window.PQ.config.moodle) {
        candidates.push(window.PQ.config.moodle.studentid, window.PQ.config.moodle.childid);
      }
    } catch (_) {}

    for (const value of candidates) {
      const parsed = parseInt(value, 10);
      if (parsed > 0) {
        try { sessionStorage.setItem('pq_studentid', String(parsed)); } catch (_) {}
        return parsed;
      }
    }
    return 0;
  }

  function isManagedStudent() {
    const raw = String(qp('managed_student') || qp('managed') || window.__prequran_managed_student || '').toLowerCase();
    return raw === '1' || raw === 'true' || raw === 'yes' || raw === 'on';
  }

  function getStudentFilter() {
    const scopedStudent = getStudentId();
    if (scopedStudent > 0) return scopedStudent;
    if (state.activeTab === 'announcement' && isManagedStudent()) return getUid();
    return 0;
  }

  function isReady() {
    return !!getToken();
  }

  function waitForReady(maxMs) {
    return new Promise(function (resolve) {
      const start = Date.now();
      const tick = function () {
        if (isReady()) {
          resolve(true);
          return;
        }
        if (Date.now() - start >= maxMs) {
          resolve(false);
          return;
        }
        setTimeout(tick, 100);
      };
      tick();
    });
  }

  function wsCall(fn, params) {
    const token = getToken();
    const url = new URL(getEndpoint());
    url.searchParams.set('wstoken', token);
    url.searchParams.set('moodlewsrestformat', 'json');
    url.searchParams.set('wsfunction', fn);
    Object.keys(params || {}).forEach(function (key) {
      url.searchParams.set(key, String(params[key]));
    });
    if (window.__prequran_comm_actorid && window.__prequran_comm_sig && window.__prequran_comm_ts) {
      url.searchParams.set('commactorid', String(window.__prequran_comm_actorid));
      url.searchParams.set('commstudentid', String(window.__prequran_comm_scope_studentid || getStudentFilter() || 0));
      url.searchParams.set('commts', String(window.__prequran_comm_ts));
      url.searchParams.set('commsig', String(window.__prequran_comm_sig));
    }

    return fetch(url.toString(), {
      method: 'GET',
      credentials: 'omit',
      cache: 'no-store',
      mode: 'cors'
    }).then(function (res) {
      return res.json();
    });
  }

  function formatDate(ts) {
    const n = parseInt(ts, 10);
    if (!n) return '';
    try {
      return new Date(n * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch (_) {
      return '';
    }
  }

  function text(value) {
    return value == null ? '' : String(value);
  }

  function textDirection(value) {
    return /[\u0590-\u08ff]/.test(text(value)) ? 'rtl' : 'ltr';
  }

  function applyTextDirection(el, value) {
    if (!el) return;
    const dir = textDirection(value);
    el.dir = dir;
    el.style.textAlign = dir === 'rtl' ? 'right' : 'left';
  }

  function ensurePill() {
    let pill = document.getElementById('pqAnnouncementsBtn');
    if (pill) return pill;

    const row = document.querySelector('.pq-legacy-about-row') || document.querySelector('.pq-pill-row') || document.getElementById('pqHeaderActionSlot');
    if (!row) return null;

    pill = document.createElement('button');
    pill.type = 'button';
    pill.id = 'pqAnnouncementsBtn';
    pill.className = 'pq-pill pq-pill--about pq-comm-pill';
    pill.hidden = true;
    pill.setAttribute('aria-haspopup', 'dialog');
    pill.setAttribute('aria-controls', 'pqAnnouncementsPanel');
    pill.innerHTML = [
      '<span class="pq-pill__text pq-bilingual-control">',
      '<span class="pq-bilingual-control__en">Announcements</span>',
      '<span class="pq-bilingual-control__ar" dir="rtl">&#1575;&#1604;&#1573;&#1593;&#1604;&#1575;&#1606;&#1575;&#1578;</span>',
      '</span>',
      '<span class="pq-pill__icon" aria-hidden="true">!</span>',
      '<span class="pq-comm-pill__badge" aria-hidden="true"></span>'
    ].join('');
    pill.addEventListener('click', openPanel);
    row.insertBefore(pill, row.firstChild);
    return pill;
  }

  function ensurePanel() {
    let panel = document.getElementById('pqAnnouncementsPanel');
    if (panel) return panel;

    panel = document.createElement('div');
    panel.id = 'pqAnnouncementsPanel';
    panel.className = 'pq-comm-panel';
    panel.hidden = true;
    panel.setAttribute('aria-hidden', 'true');
    panel.innerHTML = [
      '<div class="pq-comm-panel__scrim" data-pq-comm-close="1"></div>',
      '<section class="pq-comm-panel__sheet" role="dialog" aria-modal="true" aria-labelledby="pqCommTitle">',
      '<div class="pq-comm-panel__top">',
      '<div id="pqCommTitle" class="pq-comm-panel__title">Communications</div>',
      '<button type="button" class="pq-comm-panel__close" aria-label="Close communications" data-pq-comm-close="1">&times;</button>',
      '</div>',
      '<div class="pq-comm-panel__toolbar">',
      '<button type="button" id="pqCommRefresh" class="pq-comm-panel__refresh" aria-label="Refresh communications">Refresh</button>',
      '<div class="pq-comm-tabs" role="tablist" aria-label="Communication type">',
      '<button type="button" class="pq-comm-tab is-active" data-pq-comm-tab="announcement" role="tab" aria-selected="true">Announcements</button>',
      '<button type="button" class="pq-comm-tab" data-pq-comm-tab="parent_teacher" role="tab" aria-selected="false">Messages</button>',
      '</div>',
      '</div>',
      '<div class="pq-comm-panel__statusbar">',
      '<div id="pqCommStatus" class="pq-comm-panel__status">Loading announcements</div>',
      '</div>',
      '<div id="pqCommBody" class="pq-comm-panel__body"></div>',
      '</section>'
    ].join('');

    panel.addEventListener('click', function (event) {
      const target = event.target;
      if (target && target.getAttribute && target.getAttribute('data-pq-comm-close') === '1') closePanel();
    });

    document.body.appendChild(panel);

    const refresh = document.getElementById('pqCommRefresh');
    if (refresh) refresh.addEventListener('click', function () { refreshThreads(true); });

    panel.querySelectorAll('[data-pq-comm-tab]').forEach(function (tab) {
      tab.addEventListener('click', function () {
        setActiveTab(tab.getAttribute('data-pq-comm-tab') || 'announcement');
      });
    });

    const body = document.getElementById('pqCommBody');
    if (body && !body.__pqCommDelegated) {
      body.__pqCommDelegated = true;
      body.addEventListener('click', function (event) {
        const target = event.target;
        const card = target && target.closest ? target.closest('[data-pq-comm-threadid]') : null;
        if (!card) return;
        event.preventDefault();
        openThread(card.getAttribute('data-pq-comm-threadid'));
      });
    }

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && state.open) closePanel();
    });

    return panel;
  }

  function setStatus(message) {
    const el = document.getElementById('pqCommStatus');
    if (el) el.textContent = message || '';
  }

  function setPillVisibility(visible) {
    const pill = ensurePill();
    if (pill) pill.hidden = !visible;
  }

  function setUnreadBadge() {
    const pill = ensurePill();
    if (!pill) return;
    const badge = pill.querySelector('.pq-comm-pill__badge');
    const allThreads = []
      .concat(state.threadsByType.announcement || [])
      .concat(state.threadsByType.parent_teacher || []);
    const count = allThreads.reduce(function (sum, thread) {
      return sum + Math.max(0, parseInt(thread.unreadcount, 10) || 0);
    }, 0);
    if (count > 0) {
      pill.classList.add('has-unread');
      if (badge) badge.textContent = String(count > 99 ? '99+' : count);
    } else {
      pill.classList.remove('has-unread');
      if (badge) badge.textContent = '';
    }
  }

  function getActiveThreads() {
    return state.threadsByType[state.activeTab] || [];
  }

  function activeLabel() {
    return state.activeTab === 'parent_teacher' ? 'messages' : 'announcements';
  }

  function activeSingularLabel() {
    return state.activeTab === 'parent_teacher' ? 'message' : 'announcement';
  }

  function threadKindLabel(thread) {
    if (thread && String(thread.type || '') === 'parent_teacher') return 'Parent-teacher message';
    return thread && thread.studentid ? 'Student update' : 'Class announcement';
  }

  function setActiveTab(tab) {
    state.activeTab = tab === 'parent_teacher' ? 'parent_teacher' : 'announcement';
    state.selectedThread = null;
    state.selectedMessages = [];

    document.querySelectorAll('#pqAnnouncementsPanel [data-pq-comm-tab]').forEach(function (el) {
      const active = el.getAttribute('data-pq-comm-tab') === state.activeTab;
      el.classList.toggle('is-active', active);
      el.setAttribute('aria-selected', active ? 'true' : 'false');
    });

    renderList();
    refreshThreads(true);
  }

  function renderList() {
    const body = document.getElementById('pqCommBody');
    if (!body) return;
    const threads = getActiveThreads();
    const label = activeLabel();

    state.selectedThread = null;
    state.selectedMessages = [];

    if (!threads.length) {
      body.innerHTML = '<div class="pq-comm-empty"></div>';
      body.querySelector('.pq-comm-empty').textContent = 'No ' + label + ' yet.';
      setStatus('No ' + label);
      return;
    }

    const list = document.createElement('div');
    list.className = 'pq-comm-thread-list';

    threads.forEach(function (thread) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pq-comm-thread';
      btn.dataset.pqCommThreadid = String(thread.id);

      const unread = parseInt(thread.unreadcount, 10) || 0;
      btn.innerHTML = [
        '<span class="pq-comm-thread__row">',
        '<span class="pq-comm-thread__subject"></span>',
        '<span class="pq-comm-thread__date"></span>',
        '</span>',
        '<span class="pq-comm-thread__preview"></span>',
        '<span class="pq-comm-thread__meta">',
        unread > 0 ? '<span class="pq-comm-unread">' + String(unread) + '</span>' : '',
        '<span class="pq-comm-thread__kind"></span>',
        '</span>'
      ].join('');
      const subjectEl = btn.querySelector('.pq-comm-thread__subject');
      const previewEl = btn.querySelector('.pq-comm-thread__preview');
      const subject = text(thread.subject) || (state.activeTab === 'parent_teacher' ? 'Message' : 'Announcement');
      const preview = text(thread.lastmessagebody);
      subjectEl.textContent = subject;
      applyTextDirection(subjectEl, subject);
      btn.querySelector('.pq-comm-thread__date').textContent = formatDate(thread.lastmessageat);
      previewEl.textContent = preview;
      applyTextDirection(previewEl, preview);
      btn.querySelector('.pq-comm-thread__kind').textContent = threadKindLabel(thread);
      list.appendChild(btn);
    });

    body.innerHTML = '';
    body.appendChild(list);
    setStatus(String(threads.length) + ' ' + activeSingularLabel() + (threads.length === 1 ? '' : 's'));
  }

  function renderReplyComposer(wrap) {
    if (!state.selectedThread || String(state.selectedThread.type || '') !== 'parent_teacher') return;

    const form = document.createElement('form');
    form.className = 'pq-comm-reply';
    form.innerHTML = [
      '<textarea class="pq-comm-reply__input" name="body" maxlength="1000" placeholder="Write a reply" aria-label="Write a reply"></textarea>',
      '<div class="pq-comm-reply__row">',
      '<div class="pq-comm-reply__status" aria-live="polite"></div>',
      '<button type="submit" class="pq-comm-reply__send">Send</button>',
      '</div>'
    ].join('');
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      sendReply(form);
    });
    wrap.appendChild(form);
  }

  function renderDetail() {
    const body = document.getElementById('pqCommBody');
    if (!body || !state.selectedThread) return;

    const wrap = document.createElement('div');
    wrap.className = 'pq-comm-detail';
    setStatus('');

    const top = document.createElement('div');
    top.className = 'pq-comm-detail__top';

    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'pq-comm-back';
    back.textContent = 'Back';
    back.addEventListener('click', renderList);
    top.appendChild(back);

    const title = document.createElement('h3');
    title.className = 'pq-comm-detail__subject';
    const detailSubject = text(state.selectedThread.subject) || (String(state.selectedThread.type || '') === 'parent_teacher' ? 'Message' : 'Announcement');
    title.textContent = detailSubject;
    applyTextDirection(title, detailSubject);
    top.appendChild(title);
    wrap.appendChild(top);

    state.selectedMessages.forEach(function (message) {
      const item = document.createElement('article');
      item.className = 'pq-comm-message';
      item.innerHTML = [
        '<div class="pq-comm-message__meta"></div>',
        '<div class="pq-comm-message__body"></div>'
      ].join('');
      item.querySelector('.pq-comm-message__meta').textContent = formatDate(message.timecreated);
      const messageBody = text(message.body);
      const messageBodyEl = item.querySelector('.pq-comm-message__body');
      messageBodyEl.textContent = messageBody;
      applyTextDirection(messageBodyEl, messageBody);
      wrap.appendChild(item);
    });

    renderReplyComposer(wrap);

    body.innerHTML = '';
    body.appendChild(wrap);
  }

  function showError(message) {
    const body = document.getElementById('pqCommBody');
    if (body) body.innerHTML = '<div class="pq-comm-error"></div>';
    const err = body && body.querySelector('.pq-comm-error');
    if (err) err.textContent = message;
    setStatus('Could not load ' + activeLabel());
  }

  function sendReply(form) {
    if (!state.selectedThread || !form || form.__pqSending) return;

    const input = form.querySelector('.pq-comm-reply__input');
    const status = form.querySelector('.pq-comm-reply__status');
    const button = form.querySelector('.pq-comm-reply__send');
    const body = text(input && input.value).trim();

    if (!body) {
      if (status) status.textContent = 'Type a message first.';
      if (input && typeof input.focus === 'function') input.focus();
      return;
    }

    form.__pqSending = true;
    if (button) button.disabled = true;
    if (status) status.textContent = 'Sending...';

    wsCall('local_prequran_comm_send_message', {
      threadid: state.selectedThread.id,
      body: body,
      templatekey: ''
    }).then(function (data) {
      if (!data || data.exception) throw new Error(data && data.message ? data.message : 'Unable to send message.');
      if (data.ok !== true || data.tables_ready !== true) throw new Error('Messages are not ready yet.');
      if (input) input.value = '';
      if (status) status.textContent = 'Sent';
      return openThread(state.selectedThread.id);
    }).catch(function (err) {
      if (status) status.textContent = err && err.message ? err.message : 'Unable to send message.';
    }).finally(function () {
      form.__pqSending = false;
      if (button) button.disabled = false;
    });
  }

  function refreshThreads(forceRender) {
    if (state.loading || !isReady()) return Promise.resolve(null);
    state.loading = true;
    const type = state.activeTab;
    const label = activeLabel();
    if (state.open && !state.selectedThread) setStatus('Loading ' + label);

    return wsCall('local_prequran_comm_list_threads', {
      cohortid: getCohortId(),
      studentid: getStudentFilter(),
      type: type,
      limit: 20,
      before: 0
    }).then(function (data) {
      if (!data || data.exception) throw new Error(data && data.message ? data.message : 'Unable to load ' + label + '.');
      if (data.ok !== true || data.tables_ready !== true) throw new Error('Communications are not ready yet.');
      state.threadsByType[type] = Array.isArray(data.threads) ? data.threads : [];
      setUnreadBadge();
      if (state.activeTab === type && (state.open || forceRender) && !state.selectedThread) renderList();
      return data;
    }).catch(function (err) {
      if (state.open && state.activeTab === type && !state.selectedThread) showError(err && err.message ? err.message : 'Unable to load ' + label + '.');
      return null;
    }).finally(function () {
      state.loading = false;
    });
  }

  function openThread(threadid) {
    const thread = getActiveThreads().find(function (item) { return parseInt(item.id, 10) === parseInt(threadid, 10); });
    if (!thread) return;
    setStatus('Loading ' + activeSingularLabel());

    wsCall('local_prequran_comm_get_thread', {
      threadid: threadid,
      limit: 50,
      before: 0
    }).then(function (data) {
      if (!data || data.exception) throw new Error(data && data.message ? data.message : 'Unable to open ' + activeSingularLabel() + '.');
      state.selectedThread = data.thread || thread;
      state.selectedMessages = Array.isArray(data.messages) ? data.messages : [];
      renderDetail();
      refreshThreads(false);
    }).catch(function (err) {
      showError(err && err.message ? err.message : 'Unable to open ' + activeSingularLabel() + '.');
    });
  }

  function openPanel(tab) {
    ensurePanel();
    const panel = document.getElementById('pqAnnouncementsPanel');
    if (!panel) return;
    if (tab) {
      state.activeTab = tab === 'parent_teacher' || tab === 'messages' ? 'parent_teacher' : 'announcement';
      document.querySelectorAll('#pqAnnouncementsPanel [data-pq-comm-tab]').forEach(function (el) {
        const active = el.getAttribute('data-pq-comm-tab') === state.activeTab;
        el.classList.toggle('is-active', active);
        el.setAttribute('aria-selected', active ? 'true' : 'false');
      });
    }
    state.open = true;
    state.selectedThread = null;
    state.selectedMessages = [];
    panel.hidden = false;
    panel.setAttribute('aria-hidden', 'false');
    renderList();
    refreshThreads(true).then(function () {
      const initialThreadId = requestedInitialThreadId();
      if (initialThreadId > 0 && !state.selectedThread) {
        openThread(initialThreadId);
      }
    });
  }

  function requestedInitialTab() {
    const raw = String(qp('opencomm') || qp('comm') || '').toLowerCase();
    if (raw === 'messages' || raw === 'message' || raw === 'parent_teacher') return 'parent_teacher';
    if (raw === 'announcements' || raw === 'announcement') return 'announcement';
    return '';
  }

  function requestedInitialThreadId() {
    return parseInt(window.__prequran_open_threadid || qp('threadid') || qp('thread_id') || '0', 10) || 0;
  }

  function closePanel() {
    const panel = document.getElementById('pqAnnouncementsPanel');
    state.open = false;
    if (panel) {
      try {
        if (panel.contains(document.activeElement)) {
          const trigger = document.getElementById('pqAnnouncementsBtn');
          if (trigger && typeof trigger.focus === 'function') trigger.focus();
          else if (document.activeElement && typeof document.activeElement.blur === 'function') document.activeElement.blur();
        }
      } catch (_) {}
      panel.hidden = true;
      panel.setAttribute('aria-hidden', 'true');
    }
  }

  function schedule() {
    clearTimeout(state.timer);
    state.timer = setTimeout(function () {
      refreshThreads(false).finally(schedule);
    }, CFG.pollMs);
  }

  function init() {
    if (state.inited) return;
    state.inited = true;
    ensurePill();
    ensurePanel();

    waitForReady(CFG.waitMs).then(function (ready) {
      setPillVisibility(ready);
      if (!ready) return;
      const initialTab = requestedInitialTab();
      if (initialTab) {
        setActiveTab(initialTab);
        openPanel();
        schedule();
        return;
      }
      refreshThreads(false).finally(schedule);
    });
  }

  window.PQAnnouncementsPanel = {
    open: openPanel,
    openMessages: function () { return openPanel('parent_teacher'); },
    openAnnouncements: function () { return openPanel('announcement'); },
    refresh: function () { return refreshThreads(true); },
    debug: function () {
      return {
        ready: isReady(),
        token: !!getToken(),
        uid: getUid(),
        cohortid: getCohortId(),
        managedStudent: isManagedStudent(),
        activeTab: state.activeTab,
        threads: getActiveThreads().length,
        announcementThreads: (state.threadsByType.announcement || []).length,
        messageThreads: (state.threadsByType.parent_teacher || []).length
      };
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
