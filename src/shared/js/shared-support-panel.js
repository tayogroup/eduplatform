/* EduPlatform support panel: asynchronous help desk and teacher support. */
(function () {
  'use strict';

  function moodleOrigin() {
    try {
      if (window.__prequran_moodle_origin) return new URL(window.__prequran_moodle_origin).origin;
      if (document.referrer) return new URL(document.referrer).origin;
    } catch (_) {}
    return window.location.origin;
  }

  const CFG = {
    endpointDefault: moodleOrigin() + '/webservice/rest/server.php',
    pollMs: 30000,
    activePollMs: 6000,
    waitMs: 5000
  };

  const state = {
    inited: false,
    open: false,
    minimized: false,
    loading: false,
    conversations: [],
    selected: null,
    messages: [],
    timer: null,
    pollMs: CFG.pollMs,
    livePollAvailable: true,
    lastMessageId: 0,
    typing: false,
    typingTimer: null,
    availabilityStatus: 'offline',
    availabilityMessage: '',
    indicators: []
  };

  function qp(name) {
    try { return new URLSearchParams(window.location.search || '').get(name) || ''; } catch (_) { return ''; }
  }

  function getToken() {
    const token = window.__prequran_ws_token || (window.PQIframe && window.PQIframe.getToken && window.PQIframe.getToken());
    if (token) return String(token);
    try { return sessionStorage.getItem('pq_ws_token') || ''; } catch (_) { return ''; }
  }

  function getEndpoint() {
    return String(window.__prequran_ws_endpoint || qp('wsendpoint') || qp('ws_endpoint') || qp('ws') || CFG.endpointDefault);
  }

  function getUid() {
    const value = window.__prequran_support_uid || window.__prequran_uid || (window.PQIframe && window.PQIframe.getUid && window.PQIframe.getUid()) || qp('uid') || qp('userid') || '';
    return parseInt(value, 10) || 0;
  }

  function getStudentId() {
    const candidates = [
      window.__prequran_support_studentid,
      window.__prequran_studentid,
      window.__prequran_childid,
      qp('studentid'),
      qp('childid'),
      qp('monitor_studentid')
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
      if (parsed > 0) return parsed;
    }
    return 0;
  }

  function getTeacherId() {
    const value = window.__prequran_support_teacherid || window.__prequran_teacherid || qp('teacherid') || qp('teacher_id') || '';
    return parseInt(value, 10) || 0;
  }

  function getWorkspaceId() {
    const candidates = [window.__prequran_support_workspaceid, window.__prequran_workspaceid, window.__prequran_workspace_id, qp('workspaceid'), qp('workspace_id')];
    try {
      if (window.PQ && window.PQ.config && window.PQ.config.moodle) {
        candidates.push(window.PQ.config.moodle.workspaceid, window.PQ.config.moodle.workspaceId);
      }
    } catch (_) {}
    for (const value of candidates) {
      const parsed = parseInt(value, 10);
      if (parsed > 0) return parsed;
    }
    return 0;
  }

  function getConsumerId() {
    const candidates = [window.__prequran_support_consumerid, window.__prequran_consumerid, window.__prequran_consumer_id, qp('consumerid'), qp('consumer_id')];
    try {
      if (window.PQ && window.PQ.config && window.PQ.config.moodle) {
        candidates.push(window.PQ.config.moodle.consumerid, window.PQ.config.moodle.consumerId);
      }
    } catch (_) {}
    for (const value of candidates) {
      const parsed = parseInt(value, 10);
      if (parsed > 0) return parsed;
    }
    return 0;
  }

  function getCohortId() {
    const candidates = [window.__prequran_cohortid, window.__prequran_cohort_id, qp('cohortid'), qp('cohort_id'), qp('cid')];
    try {
      const stored = sessionStorage.getItem('pq_cohortid') || sessionStorage.getItem('pq_cohort_id');
      if (stored) candidates.push(stored);
    } catch (_) {}
    for (const value of candidates) {
      const parsed = parseInt(value, 10);
      if (parsed > 0) return parsed;
    }
    return 0;
  }

  function isManagedStudent() {
    const raw = String(window.__prequran_support_managed_student || window.__prequran_managed_student || qp('managed_student') || qp('managed') || '').toLowerCase();
    return raw === '1' || raw === 'true' || raw === 'yes' || raw === 'on';
  }

  function defaultType() {
    const explicit = String(window.__prequran_support_type || qp('supporttype') || qp('support_type') || '').toLowerCase();
    if (explicit === 'parent_teacher' || explicit === 'student_teacher' || explicit === 'student_helpdesk') return explicit;
    return isManagedStudent() ? 'student_helpdesk' : 'parent_teacher';
  }

  function isReady() {
    return !!getToken();
  }

  function canConvertTicket() {
    return window.__prequran_support_can_convert === true || String(window.__prequran_support_can_convert || '').toLowerCase() === 'true';
  }

  function waitForReady(maxMs) {
    return new Promise(function (resolve) {
      const start = Date.now();
      const tick = function () {
        if (isReady()) return resolve(true);
        if (Date.now() - start >= maxMs) return resolve(false);
        setTimeout(tick, 100);
      };
      tick();
    });
  }

  function wsCall(fn, params) {
    const url = new URL(getEndpoint());
    url.searchParams.set('wstoken', getToken());
    url.searchParams.set('moodlewsrestformat', 'json');
    url.searchParams.set('wsfunction', fn);
    Object.keys(params || {}).forEach(function (key) {
      if (params[key] !== undefined && params[key] !== null) url.searchParams.set(key, String(params[key]));
    });
    return fetch(url.toString(), {
      method: 'GET',
      credentials: 'omit',
      cache: 'no-store',
      mode: 'cors'
    }).then(function (res) { return res.json(); });
  }

  function text(value) {
    return value == null ? '' : String(value);
  }

  function formatDate(ts) {
    const n = parseInt(ts, 10);
    if (!n) return '';
    try { return new Date(n * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); } catch (_) { return ''; }
  }

  function maxMessageId(messages) {
    return (messages || []).reduce(function (max, item) {
      return Math.max(max, parseInt(item && item.id, 10) || 0);
    }, 0);
  }

  function applyDirection(el, value) {
    if (!el) return;
    const rtl = /[\u0590-\u08ff]/.test(text(value));
    el.dir = rtl ? 'rtl' : 'ltr';
    el.style.textAlign = rtl ? 'right' : 'left';
  }

  function ensurePillRow() {
    return document.querySelector('.pq-legacy-about-row')
      || document.querySelector('.pq-pill-row')
      || document.getElementById('pqHeaderActionSlot')
      || document.querySelector('.top-actions');
  }

  function ensurePill() {
    let pill = document.getElementById('pqSupportBtn');
    if (pill) return pill;
    const row = ensurePillRow();
    if (!row) return null;
    pill = document.createElement('button');
    pill.type = 'button';
    pill.id = 'pqSupportBtn';
    pill.className = 'pq-pill pq-pill--about pq-support-pill';
    pill.hidden = true;
    pill.setAttribute('aria-haspopup', 'dialog');
    pill.setAttribute('aria-controls', 'pqSupportPanel');
    pill.innerHTML = [
      '<span class="pq-pill__text pq-bilingual-control">',
      '<span class="pq-bilingual-control__en">Help</span>',
      '<span class="pq-bilingual-control__ar" dir="rtl">&#1605;&#1587;&#1575;&#1593;&#1583;&#1577;</span>',
      '</span>',
      '<span class="pq-pill__icon" aria-hidden="true">?</span>',
      '<span class="pq-support-pill__badge" aria-hidden="true"></span>'
    ].join('');
    pill.addEventListener('click', openPanel);
    row.insertBefore(pill, row.firstChild);
    return pill;
  }

  function ensureLauncher() {
    let launcher = document.getElementById('pqSupportLauncher');
    if (launcher) return launcher;
    launcher = document.createElement('button');
    launcher.type = 'button';
    launcher.id = 'pqSupportLauncher';
    launcher.className = 'pq-support-launcher';
    launcher.hidden = true;
    launcher.setAttribute('aria-haspopup', 'dialog');
    launcher.setAttribute('aria-controls', 'pqSupportPanel');
    launcher.innerHTML = '<span class="pq-support-launcher__icon" aria-hidden="true">?</span><span>Live support</span><span class="pq-support-launcher__badge" aria-hidden="true"></span>';
    launcher.addEventListener('click', openPanel);
    document.body.appendChild(launcher);
    return launcher;
  }

  function ensurePanel() {
    let panel = document.getElementById('pqSupportPanel');
    if (panel) return panel;
    panel = document.createElement('div');
    panel.id = 'pqSupportPanel';
    panel.className = 'pq-support-panel';
    panel.hidden = true;
    panel.setAttribute('aria-hidden', 'true');
    panel.innerHTML = [
      '<section class="pq-support-panel__sheet" role="dialog" aria-modal="false" aria-labelledby="pqSupportTitle">',
      '<div class="pq-support-panel__top">',
      '<div class="pq-support-panel__identity"><span class="pq-support-panel__avatar" aria-hidden="true">?</span><span><strong id="pqSupportTitle" class="pq-support-panel__title">Live support</strong><small>EduPlatform support team</small></span></div>',
      '<button type="button" class="pq-support-panel__minimize" aria-label="Minimize live support" data-pq-support-minimize="1">&minus;</button>',
      '</div>',
      '<div class="pq-support-panel__toolbar">',
      '<button type="button" id="pqSupportRefresh" class="pq-support-panel__refresh" aria-label="Refresh help">Refresh</button>',
      '<button type="button" id="pqSupportNew" class="pq-support-new">New help request</button>',
      '</div>',
      '<div class="pq-support-panel__statusbar"><div id="pqSupportLive" class="pq-support-live" data-state="offline">Offline</div><div id="pqSupportStatus" class="pq-support-panel__status">Loading help</div></div>',
      '<div id="pqSupportBody" class="pq-support-panel__body"></div>',
      '</section>'
    ].join('');
    panel.addEventListener('click', function (event) {
      const target = event.target;
      if (target && target.getAttribute && target.getAttribute('data-pq-support-minimize') === '1') minimizePanel();
    });
    document.body.appendChild(panel);
    document.getElementById('pqSupportRefresh').addEventListener('click', function () { refresh(true); });
    document.getElementById('pqSupportNew').addEventListener('click', renderStart);
    document.getElementById('pqSupportBody').addEventListener('click', function (event) {
      const card = event.target && event.target.closest ? event.target.closest('[data-pq-support-conversationid]') : null;
      if (!card) return;
      event.preventDefault();
      openConversation(card.getAttribute('data-pq-support-conversationid'));
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && state.open) minimizePanel();
    });
    return panel;
  }

  function setStatus(message) {
    const el = document.getElementById('pqSupportStatus');
    if (el) el.textContent = message || '';
  }

  function setAvailability(status, message) {
    state.availabilityStatus = status || state.availabilityStatus || 'offline';
    state.availabilityMessage = message || state.availabilityMessage || '';
    const el = document.getElementById('pqSupportLive');
    if (!el) return;
    el.dataset.state = state.availabilityStatus;
    el.textContent = state.availabilityStatus === 'online' ? 'Online' : (state.availabilityStatus === 'away' ? 'Away' : 'Offline');
    el.title = state.availabilityMessage || '';
  }

  function setPillVisibility(visible) {
    const pill = ensurePill();
    if (pill) pill.hidden = !visible;
  }

  function setBadge() {
    const pill = ensurePill();
    const count = state.conversations.reduce(function (sum, item) {
      return sum + Math.max(0, parseInt(item.unreadcount, 10) || 0);
    }, 0);
    if (pill) {
      const badge = pill.querySelector('.pq-support-pill__badge');
      pill.classList.toggle('has-unread', count > 0);
      if (badge) badge.textContent = count > 99 ? '99+' : (count > 0 ? String(count) : '');
    }
    const launcher = ensureLauncher();
    const launcherBadge = launcher.querySelector('.pq-support-launcher__badge');
    launcher.classList.toggle('has-unread', count > 0);
    if (launcherBadge) launcherBadge.textContent = count > 99 ? '99+' : (count > 0 ? String(count) : '');
  }

  function showError(message) {
    const body = document.getElementById('pqSupportBody');
    if (!body) return;
    body.innerHTML = '<div class="pq-support-error"></div>';
    body.querySelector('.pq-support-error').textContent = message;
    setStatus('Unable to load help');
  }

  function renderList() {
    const body = document.getElementById('pqSupportBody');
    if (!body) return;
    state.selected = null;
    state.messages = [];
    if (!state.conversations.length) {
      body.innerHTML = '<div class="pq-support-empty">No help conversations yet.</div>';
      setStatus('No help conversations');
      return;
    }
    const list = document.createElement('div');
    list.className = 'pq-support-list';
    state.conversations.forEach(function (item) {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'pq-support-card';
      card.dataset.pqSupportConversationid = String(item.id);
      const unread = parseInt(item.unreadcount, 10) || 0;
      card.innerHTML = [
        '<span class="pq-support-card__row"><span class="pq-support-card__subject"></span><span class="pq-support-card__date"></span></span>',
        '<span class="pq-support-card__preview"></span>',
        '<span class="pq-support-card__meta"></span>'
      ].join('');
      const subject = text(item.subject) || 'Help request';
      const preview = text(item.lastmessagebody);
      const meta = [item.category || 'other', item.priority || 'normal', item.status || 'active'].join(' - ');
      const subjectEl = card.querySelector('.pq-support-card__subject');
      const previewEl = card.querySelector('.pq-support-card__preview');
      subjectEl.textContent = subject;
      previewEl.textContent = preview;
      applyDirection(subjectEl, subject);
      applyDirection(previewEl, preview);
      card.querySelector('.pq-support-card__date').textContent = formatDate(item.lastmessageat);
      card.querySelector('.pq-support-card__meta').innerHTML = (unread > 0 ? '<span class="pq-support-unread">' + String(unread) + '</span> ' : '') + meta;
      list.appendChild(card);
    });
    body.innerHTML = '';
    body.appendChild(list);
    setStatus(String(state.conversations.length) + ' help conversation' + (state.conversations.length === 1 ? '' : 's'));
  }

  function startTypeOptions() {
    const type = defaultType();
    const opts = [
      ['student_helpdesk', 'Help desk'],
      ['student_teacher', 'Teacher'],
      ['parent_teacher', 'Parent to teacher']
    ];
    return opts.map(function (opt) {
      return '<option value="' + opt[0] + '"' + (type === opt[0] ? ' selected' : '') + '>' + opt[1] + '</option>';
    }).join('');
  }

  function renderStart() {
    const body = document.getElementById('pqSupportBody');
    if (!body) return;
    body.innerHTML = [
      '<form class="pq-support-start" id="pqSupportStartForm">',
      '<div class="pq-support-detail__top"><button type="button" class="pq-support-back" data-pq-support-back="1">Back</button><div class="pq-support-detail__subject">New help request</div></div>',
      '<div class="pq-support-start__grid">',
      '<label>Send to<select name="type">' + startTypeOptions() + '</select></label>',
      '<label>Topic<select name="category">',
      '<option value="technical_access">Technical access</option>',
      '<option value="lesson_help">Lesson help</option>',
      '<option value="recording_review">Recording review</option>',
      '<option value="schedule_attendance">Schedule or attendance</option>',
      '<option value="teacher_feedback">Teacher feedback</option>',
      '<option value="parent_follow_up">Parent follow-up</option>',
      '<option value="account_profile">Account profile</option>',
      '<option value="bug_report">Bug report</option>',
      '<option value="other">Other</option>',
      '</select></label>',
      '<label>Subject<input name="subject" maxlength="120" value="Help request"></label>',
      '<label>Message<textarea name="body" maxlength="1200" placeholder="Write what you need help with"></textarea></label>',
      '</div>',
      '<div class="pq-support-compose__row"><div class="pq-support-compose__status" aria-live="polite"></div><button type="submit" class="pq-support-send">Send</button></div>',
      '</form>'
    ].join('');
    setStatus('New help request');
    const form = document.getElementById('pqSupportStartForm');
    form.querySelector('[data-pq-support-back]').addEventListener('click', renderList);
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      submitStart(form);
    });
  }

  function submitStart(form) {
    if (!form || form.__sending) return;
    const status = form.querySelector('.pq-support-compose__status');
    const button = form.querySelector('.pq-support-send');
    const data = new FormData(form);
    const message = text(data.get('body')).trim();
    if (!message) {
      status.textContent = 'Type a message first.';
      return;
    }
    form.__sending = true;
    button.disabled = true;
    status.textContent = 'Sending...';
    wsCall('local_prequran_support_start_conversation', {
      type: data.get('type'),
      workspaceid: getWorkspaceId(),
      consumerid: getConsumerId(),
      cohortid: getCohortId(),
      studentid: getStudentId() || getUid(),
      teacherid: getTeacherId(),
      subject: data.get('subject') || 'Help request',
      body: message,
      category: data.get('category') || 'other',
      priority: 'normal',
      contextjson: JSON.stringify({ route: location.pathname, title: document.title || '' })
    }).then(function (res) {
      if (!res || res.exception) throw new Error(res && res.message ? res.message : 'Unable to start help request.');
      if (res.ok !== true || res.tables_ready !== true) throw new Error(res.message || 'Support is not ready yet.');
      return refresh(false).then(function () { openConversation(res.conversation && res.conversation.id); });
    }).catch(function (err) {
      status.textContent = err && err.message ? err.message : 'Unable to start help request.';
    }).finally(function () {
      form.__sending = false;
      button.disabled = false;
    });
  }

  function indicatorText() {
    const indicators = Array.isArray(state.indicators) ? state.indicators : [];
    const typing = indicators.filter(function (item) { return item && item.indicator === 'typing'; });
    if (typing.length) return 'Someone is typing...';
    const viewing = indicators.filter(function (item) { return item && item.indicator === 'viewing'; });
    if (viewing.length) return 'Another participant is viewing this chat.';
    if (state.availabilityMessage) return state.availabilityMessage;
    return '';
  }

  function renderDetail() {
    const body = document.getElementById('pqSupportBody');
    if (!body || !state.selected) return;
    const existingInput = body.querySelector('.pq-support-compose textarea');
    const draft = existingInput ? existingInput.value : '';
    const hadFocus = existingInput && document.activeElement === existingInput;
    const wrap = document.createElement('div');
    wrap.className = 'pq-support-detail';
    wrap.innerHTML = [
      '<div class="pq-support-detail__top"><button type="button" class="pq-support-back">Back</button><div class="pq-support-detail__subject"></div><div class="pq-support-detail__actions"></div></div>',
      '<div class="pq-support-detail__messages"></div>',
      '<div class="pq-support-livehint" aria-live="polite"></div>',
      '<form class="pq-support-compose"><textarea name="body" maxlength="1200" placeholder="Write a reply" aria-label="Write a reply"></textarea><div class="pq-support-compose__row"><div class="pq-support-compose__status" aria-live="polite"></div><button type="submit" class="pq-support-send">Send</button></div></form>'
    ].join('');
    const subject = text(state.selected.subject) || 'Help request';
    wrap.querySelector('.pq-support-detail__subject').textContent = subject;
    wrap.querySelector('.pq-support-back').addEventListener('click', renderList);
    const actions = wrap.querySelector('.pq-support-detail__actions');
    const linkedTicketId = parseInt(state.selected.linkedticketid, 10) || 0;
    if (linkedTicketId > 0) {
      const badge = document.createElement('span');
      badge.className = 'pq-support-ticket-badge';
      badge.textContent = 'Ticket #' + linkedTicketId;
      actions.appendChild(badge);
    } else if (canConvertTicket()) {
      const convert = document.createElement('button');
      convert.type = 'button';
      convert.className = 'pq-support-convert';
      convert.textContent = 'Convert to ticket';
      convert.addEventListener('click', function () { convertToTicket(convert); });
      actions.appendChild(convert);
    }
    const messages = wrap.querySelector('.pq-support-detail__messages');
    state.messages.forEach(function (message) {
      const article = document.createElement('article');
      article.className = 'pq-support-message';
      if ((parseInt(message.senderid, 10) || 0) === getUid()) article.classList.add('pq-support-message--own');
      article.innerHTML = '<div class="pq-support-message__meta"></div><div class="pq-support-message__body"></div>';
      article.querySelector('.pq-support-message__meta').textContent = (message.senderrole || 'participant') + ' - ' + formatDate(message.timecreated);
      const msgBody = text(message.body);
      const bodyEl = article.querySelector('.pq-support-message__body');
      bodyEl.textContent = msgBody;
      applyDirection(bodyEl, msgBody);
      messages.appendChild(article);
    });
    const form = wrap.querySelector('.pq-support-compose');
    const textarea = form.querySelector('textarea');
    textarea.addEventListener('input', function () {
      state.typing = textarea.value.trim().length > 0;
      clearTimeout(state.typingTimer);
      state.typingTimer = setTimeout(function () { state.typing = false; }, 4000);
    });
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      submitReply(form);
    });
    wrap.querySelector('.pq-support-livehint').textContent = indicatorText();
    body.innerHTML = '';
    body.appendChild(wrap);
    if (draft) textarea.value = draft;
    if (hadFocus) {
      textarea.focus();
      try { textarea.setSelectionRange(textarea.value.length, textarea.value.length); } catch (_) {}
    }
    setStatus(state.selected.category || 'Help conversation');
  }

  function submitReply(form) {
    if (!state.selected || !form || form.__sending) return;
    const input = form.querySelector('textarea');
    const status = form.querySelector('.pq-support-compose__status');
    const button = form.querySelector('.pq-support-send');
    const body = text(input.value).trim();
    if (!body) {
      status.textContent = 'Type a message first.';
      return;
    }
    form.__sending = true;
    button.disabled = true;
    status.textContent = 'Sending...';
    wsCall('local_prequran_support_send_message', {
      conversationid: state.selected.id,
      body: body
    }).then(function (res) {
      if (!res || res.exception) throw new Error(res && res.message ? res.message : 'Unable to send reply.');
      if (res.ok !== true || res.tables_ready !== true) throw new Error(res.message || 'Support is not ready yet.');
      input.value = '';
      return openConversation(state.selected.id);
    }).catch(function (err) {
      status.textContent = err && err.message ? err.message : 'Unable to send reply.';
    }).finally(function () {
      form.__sending = false;
      button.disabled = false;
    });
  }

  function convertToTicket(button) {
    if (!state.selected || !canConvertTicket() || (button && button.disabled)) return;
    const status = document.querySelector('.pq-support-compose__status');
    if (button) button.disabled = true;
    if (status) status.textContent = 'Converting...';
    wsCall('local_prequran_support_convert_to_ticket', {
      conversationid: state.selected.id,
      priority: state.selected.priority || 'normal',
      category: state.selected.category || 'other',
      assigneeid: -1,
      assignmentgroupid: state.selected.assignmentgroupid || 0,
      status: 'assigned',
      metadatajson: JSON.stringify({ route: location.pathname, title: document.title || '' })
    }).then(function (res) {
      if (!res || res.exception) throw new Error(res && res.message ? res.message : 'Unable to convert to ticket.');
      if (res.ok !== true || res.tables_ready !== true) throw new Error(res.message || 'Support tickets are not ready yet.');
      state.selected = res.conversation || state.selected;
      if (status) status.textContent = 'Converted to ticket.';
      return openConversation(state.selected.id);
    }).catch(function (err) {
      if (status) status.textContent = err && err.message ? err.message : 'Unable to convert to ticket.';
    }).finally(function () {
      if (button) button.disabled = false;
    });
  }

  function applyLivePoll(res, render) {
    if (!res || res.exception) throw new Error(res && res.message ? res.message : 'Unable to refresh live support.');
    if (res.ok !== true || res.tables_ready !== true) throw new Error(res.message || 'Support is not ready yet.');
    state.pollMs = parseInt(res.poll_ms, 10) || (state.selected ? CFG.activePollMs : CFG.pollMs);
    setAvailability(res.availability_status || 'offline', res.availability_message || '');
    state.conversations = Array.isArray(res.conversations) ? res.conversations : state.conversations;
    setBadge();
    if (state.selected && res.conversation && parseInt(res.conversation.id, 10) === parseInt(state.selected.id, 10)) {
      state.selected = res.conversation;
      const incoming = Array.isArray(res.messages) ? res.messages : [];
      if (incoming.length) {
        const byId = {};
        state.messages.concat(incoming).forEach(function (message) {
          if (message && message.id) byId[String(message.id)] = message;
        });
        state.messages = Object.keys(byId).sort(function (a, b) { return parseInt(a, 10) - parseInt(b, 10); }).map(function (id) { return byId[id]; });
        state.lastMessageId = maxMessageId(state.messages);
      }
      state.indicators = Array.isArray(res.indicators) ? res.indicators : [];
      if (state.open) renderDetail();
    } else if (render || (state.open && !state.selected)) {
      renderList();
    }
    return res;
  }

  function livePoll(render) {
    if (!state.livePollAvailable || !isReady()) return Promise.reject(new Error('live_poll_unavailable'));
    return wsCall('local_prequran_support_live_poll', {
      workspaceid: getWorkspaceId(),
      consumerid: getConsumerId(),
      studentid: getStudentId(),
      conversationid: state.selected && state.selected.id ? state.selected.id : 0,
      since: state.selected ? state.lastMessageId : 0,
      typing: state.typing ? 1 : 0,
      viewing: state.open && state.selected ? 1 : 0,
      listlimit: 30
    }).then(function (res) {
      return applyLivePoll(res, render);
    }).catch(function (err) {
      if (err && /invalid|unknown|not found|wsfunction/i.test(String(err.message || ''))) {
        state.livePollAvailable = false;
      }
      throw err;
    });
  }

  function refresh(render) {
    if (state.loading || !isReady()) return Promise.resolve(null);
    state.loading = true;
    setStatus('Loading help');
    const load = state.livePollAvailable ? livePoll(render) : Promise.reject(new Error('live_poll_unavailable'));
    return load.catch(function () {
      return wsCall('local_prequran_support_list_conversations', {
      workspaceid: getWorkspaceId(),
      studentid: getStudentId(),
      type: 'all',
      status: 'active',
      category: 'all',
      assignedto: 0,
      limit: 30,
      before: 0
      });
    }).then(function (res) {
      if (!res || res.exception) throw new Error(res && res.message ? res.message : 'Unable to load help.');
      if (res.availability_status) {
        applyLivePoll(res, render);
      } else {
        if (res.ok !== true || res.tables_ready !== true) throw new Error('Support is not ready yet.');
        state.conversations = Array.isArray(res.conversations) ? res.conversations : [];
        setBadge();
        if (render || (state.open && !state.selected)) renderList();
      }
      return res;
    }).catch(function (err) {
      if (state.open) showError(err && err.message ? err.message : 'Unable to load help.');
      return null;
    }).finally(function () {
      state.loading = false;
    });
  }

  function openConversation(id) {
    const conversationid = parseInt(id, 10) || 0;
    if (conversationid <= 0) return;
    setStatus('Loading help conversation');
    return wsCall('local_prequran_support_get_conversation', {
      conversationid: conversationid,
      limit: 50,
      before: 0
    }).then(function (res) {
      if (!res || res.exception) throw new Error(res && res.message ? res.message : 'Unable to open help conversation.');
      if (res.ok !== true || res.tables_ready !== true) throw new Error('Support is not ready yet.');
      state.selected = res.conversation;
      state.messages = Array.isArray(res.messages) ? res.messages : [];
      state.lastMessageId = maxMessageId(state.messages);
      state.indicators = [];
      renderDetail();
      refresh(false);
    }).catch(function (err) {
      showError(err && err.message ? err.message : 'Unable to open help conversation.');
    });
  }

  function openPanel() {
    ensurePanel();
    const launcher = ensureLauncher();
    const panel = document.getElementById('pqSupportPanel');
    state.open = true;
    state.minimized = false;
    panel.hidden = false;
    panel.setAttribute('aria-hidden', 'false');
    launcher.hidden = true;
    renderList();
    refresh(true);
  }

  function minimizePanel() {
    const panel = document.getElementById('pqSupportPanel');
    const launcher = ensureLauncher();
    state.open = false;
    state.minimized = true;
    state.typing = false;
    if (panel) {
      panel.hidden = true;
      panel.setAttribute('aria-hidden', 'true');
    }
    launcher.hidden = false;
  }

  function bindEmbeddedTriggers() {
    document.addEventListener('click', function (event) {
      const trigger = event.target && event.target.closest ? event.target.closest('[data-pq-support-action]') : null;
      if (!trigger) return;
      event.preventDefault();
      openPanel();
      if (trigger.getAttribute('data-pq-support-action') === 'new') {
        setTimeout(renderStart, 0);
      }
    });
  }

  function schedule() {
    clearTimeout(state.timer);
    state.timer = setTimeout(function () {
      refresh(false).finally(schedule);
    }, state.open && state.selected ? CFG.activePollMs : (state.pollMs || CFG.pollMs));
  }

  function init() {
    if (state.inited) return;
    state.inited = true;
    ensurePill();
    ensureLauncher();
    ensurePanel();
    bindEmbeddedTriggers();
    waitForReady(CFG.waitMs).then(function (ready) {
      setPillVisibility(ready);
      if (!ready) return;
      refresh(false).finally(schedule);
      if (String(qp('opensupport') || '').toLowerCase() === '1') openPanel();
    });
  }

  window.PQSupportPanel = {
    open: openPanel,
    minimize: minimizePanel,
    newRequest: renderStart,
    refresh: function () { return refresh(true); },
    openConversation: openConversation,
    debug: function () {
      return {
        ready: isReady(),
        uid: getUid(),
        studentid: getStudentId(),
        workspaceid: getWorkspaceId(),
        conversations: state.conversations.length
      };
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
