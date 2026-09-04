<?php
declare(strict_types=1);

// Tutoring inbox — the tutor's side of the tutoring chat.
//
// One thread per learner per subject, with the subject's whole teacher group
// as participants (owner, 2026-09-05; see tutoring_chatlib.php). A tutor
// therefore needs an INBOX, not the live group board's tiles: every learner
// thread in their subjects, the unanswered ones first and the longest-waiting
// first among those — the board's sort applied to a queue. Selecting a thread
// opens the conversation beside the list; a reply is sent as the caller, and
// the learner's panel captions it "Tutor".
//
// ONE RENDERER, IN JS, SEEDED WITH INLINE JSON — the board's rule, for the
// board's reason: two renderers for one list drift. The first list ships in
// the page; tutoring_inbox_data.php refreshes it and serves the threads.

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/tutoring_chatlib.php');
require_once($CFG->dirroot . '/local/prequran/externallib_v4.php');

$cohorts = pqtut_user_cohorts((int)$USER->id);
if (!$cohorts) {
    pqh_access_denied(
        'The tutoring inbox is for teachers in a tutoring teacher group (math_tutoring, science_tutoring, …).',
        new moodle_url('/local/hubredirect/dashboard.php'),
        'Tutoring teacher group required'
    );
}

$consumercontext = pqh_requested_consumer_context();
$navparams = [];
if (trim((string)($consumercontext->consumerslug ?? '')) !== '') {
    $navparams['consumer'] = (string)$consumercontext->consumerslug;
}

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/tutoring_inbox.php', $navparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Tutoring inbox');
$PAGE->set_heading('Tutoring inbox');

$seed = [
    'subjects' => array_map(static fn(string $slug): array => ['subject' => $slug, 'label' => pqtut_subject_label($slug)], array_keys($cohorts)),
    'threads' => local_prequran_external::tutoring_inbox_threads($cohorts),
    'servertime' => time(),
];
$dataurl = (new moodle_url('/local/hubredirect/tutoring_inbox_data.php'))->out(false);

echo $OUTPUT->header();
?>
<style>
body.pqh-tutoring-inbox #page-header, body.pqh-tutoring-inbox .navbar, body.pqh-tutoring-inbox #nav-drawer,
body.pqh-tutoring-inbox .drawer-toggles, body.pqh-tutoring-inbox #page-footer, body.pqh-tutoring-inbox .secondary-navigation { display:none !important; }
body.pqh-tutoring-inbox #page { margin:0 !important; padding:0 !important; }
body.pqh-tutoring-inbox #region-main { padding:0 !important; }
<?php echo pqh_design_shell_css('.pqtut-shell'); ?>
.pqtut-shell .pqh-appbar{background:linear-gradient(90deg,#cfe9ff 0%,#e3f4ff 50%,#f2fbff 100%)}
.pqtut-wrap{max-width:1240px;margin:0 auto;padding:22px 20px 60px;font-family:"Inter",Aptos,"Segoe UI",system-ui,sans-serif;color:#17324d}
.pqtut-top{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;background:#fff;border:2px solid #dbe3ea;border-radius:18px;padding:20px 22px;margin-bottom:16px}
.pqtut-top h1{margin:0 0 4px;font-size:24px;font-family:"Fraunces",Georgia,serif;font-weight:600}
.pqtut-top p{margin:0;color:#5d6b80;font-size:14px}
.pqtut-subjects{display:flex;gap:6px;flex-wrap:wrap}
.pqtut-tag{display:inline-flex;align-items:center;height:24px;padding:0 10px;border-radius:999px;background:#dff3ef;color:#0b5f59;font-size:12px;font-weight:600;white-space:nowrap}
.pqtut-grid{display:grid;grid-template-columns:360px minmax(0,1fr);gap:16px;align-items:start}
.pqtut-list{background:#fff;border:2px solid #dbe3ea;border-radius:18px;overflow:hidden}
.pqtut-list-head{display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-bottom:2px solid #eef3f4;font-size:13px;color:#5d6b80}
.pqtut-item{display:grid;grid-template-columns:1fr auto;gap:6px 10px;width:100%;text-align:left;border:0;border-bottom:1px solid #eef3f4;background:#fff;padding:12px 16px;cursor:pointer;font:inherit;color:inherit}
.pqtut-item:hover{background:#f4f9fd}
.pqtut-item.is-open{background:#dff3ef}
.pqtut-item b{font-size:15px}
.pqtut-item small{color:#5d6b80;font-size:12px}
.pqtut-item .pqtut-preview{grid-column:1/-1;color:#5d6b80;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pqtut-wait{display:inline-flex;align-items:center;height:22px;padding:0 9px;border-radius:999px;background:#fff5cf;color:#7a5a00;font-size:12px;font-weight:600;white-space:nowrap}
.pqtut-wait.is-long{background:#ffebe5;color:#94341e}
.pqtut-wait.is-ok{background:#eef3f4;color:#5d6b80}
.pqtut-empty{padding:26px 18px;color:#5d6b80;font-size:14px}
.pqtut-thread{background:#fff;border:2px solid #dbe3ea;border-radius:18px;display:flex;flex-direction:column;min-height:520px;max-height:78vh}
.pqtut-thread-head{padding:14px 18px;border-bottom:2px solid #eef3f4}
.pqtut-thread-head b{font-size:17px}
.pqtut-thread-head span{display:block;color:#5d6b80;font-size:13px;margin-top:2px}
.pqtut-msgs{flex:1;overflow-y:auto;padding:16px 18px;display:flex;flex-direction:column;gap:10px;background:#fdfdfb}
.pqtut-bubble{max-width:82%;padding:10px 14px;border-radius:14px;font-size:14px;line-height:1.45;background:#f2f4f6;border-bottom-left-radius:6px}
.pqtut-bubble.is-mine{align-self:flex-end;background:#d7ecff;border-bottom-left-radius:14px;border-bottom-right-radius:6px}
.pqtut-bubble.is-staff{background:#e3f4ec}
.pqtut-bubble b{display:block;font-size:11px;opacity:.75;margin-bottom:2px}
.pqtut-bubble small{display:block;font-size:11px;color:#5d6b80;margin-top:4px}
.pqtut-bubble img{display:block;max-width:100%;border-radius:8px;margin-top:6px}
.pqtut-bubble a.pqtut-dl{display:inline-flex;align-items:center;gap:6px;margin-top:6px;padding:6px 10px;border:2px solid #dbe3ea;border-radius:10px;background:#fff;color:#0b5f59;text-decoration:none;font-weight:600;font-size:13px}
.pqtut-form{display:flex;gap:8px;padding:12px 14px;border-top:2px solid #eef3f4;background:#f4f9fd}
.pqtut-form textarea{flex:1;min-height:44px;max-height:140px;border:2px solid #dbe3ea;border-radius:12px;padding:9px 12px;font:inherit;font-size:14px;resize:vertical}
.pqtut-form button{border:0;background:#0f766e;color:#fff;border-radius:12px;padding:0 18px;font:inherit;font-weight:700;cursor:pointer;box-shadow:0 4px 0 #0a544e}
.pqtut-form button:disabled{opacity:.5;box-shadow:none}
.pqtut-note{padding:8px 18px;font-size:12px;color:#5d6b80;border-top:1px solid #eef3f4}
.pqtut-noscript{background:#fff5cf;border:2px solid #f4c95d;border-radius:14px;padding:14px 16px;margin-bottom:16px}
@media(max-width:900px){.pqtut-grid{grid-template-columns:1fr}.pqtut-thread{max-height:none}}
</style>
<style><?php echo pqh_viewer_chrome_css('.pqtut-shell'); ?></style>
<main class="pqtut-shell">
<?php
echo pqh_design_shell_html('pqtut-shell', 'tutoring', [
    'title' => 'Tutoring inbox',
    'appbar' => [
        ['Dashboard', new moodle_url('/local/hubredirect/dashboard.php', $navparams)],
        ['Back', 'BACK', new moodle_url('/local/hubredirect/dashboard.php', $navparams)],
    ],
    'navitems' => [[
        'label' => 'Tutoring inbox',
        'key' => 'tutoring',
        'url' => new moodle_url('/local/hubredirect/tutoring_inbox.php', $navparams),
        'icon' => '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    ]],
]);
?>
<div class="pqtut-wrap">
  <section class="pqtut-top">
    <div>
      <h1>Tutoring inbox</h1>
      <p>Every learner who wrote to your subjects. Unanswered first, longest waiting at the top. Your reply reaches that learner alone.</p>
    </div>
    <div class="pqtut-subjects" id="pqtut-subjects"></div>
  </section>
  <noscript><div class="pqtut-noscript">This inbox refreshes itself and needs JavaScript. Without it the list would freeze with nothing to say it had, so it is not shown.</div></noscript>
  <div class="pqtut-grid">
    <section class="pqtut-list" aria-label="Conversations">
      <div class="pqtut-list-head"><span id="pqtut-count">…</span><span id="pqtut-fresh">just updated</span></div>
      <div id="pqtut-items"></div>
    </section>
    <section class="pqtut-thread" aria-label="Conversation">
      <div class="pqtut-thread-head"><b id="pqtut-who">Pick a conversation</b><span id="pqtut-where">The learner's messages and your group's replies appear here.</span></div>
      <div class="pqtut-msgs" id="pqtut-msgs"></div>
      <form class="pqtut-form" id="pqtut-form" hidden>
        <textarea id="pqtut-body" maxlength="1200" placeholder="Reply to this learner…" aria-label="Reply"></textarea>
        <button type="submit">Send</button>
      </form>
      <div class="pqtut-note" id="pqtut-note" hidden></div>
    </section>
  </div>
</div>
</main>
<script>
(function () {
  var SEED = <?php echo json_encode($seed, JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT); ?>;
  var DATA_URL = <?php echo json_encode($dataurl, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT); ?>;
  var SESSKEY = <?php echo json_encode(sesskey(), JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT); ?>;
  var ME = <?php echo (int)$USER->id; ?>;
  document.body.classList.add('pqh-tutoring-inbox');

  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var post = function (params) {
    var form = new URLSearchParams(params);
    form.set('sesskey', SESSKEY);
    return fetch(DATA_URL, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: form.toString() })
      .then(function (r) { return r.json(); }).catch(function () { return null; });
  };
  var minutes = function (seconds) {
    var m = Math.round(seconds / 60);
    if (m < 1) return 'just now';
    if (m < 60) return m + ' min';
    var h = Math.floor(m / 60);
    return h < 48 ? h + ' h ' + (m % 60) + ' min' : Math.round(h / 24) + ' days';
  };
  var timeOf = function (at) { var d = new Date(at * 1000); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); };

  var threads = SEED.threads || [];
  var openId = 0;
  var lastId = 0;
  var openMeta = null;

  var paintSubjects = function () {
    document.getElementById('pqtut-subjects').innerHTML = (SEED.subjects || []).map(function (s) { return '<span class="pqtut-tag">' + esc(s.label) + '</span>'; }).join('');
  };
  var paintList = function () {
    var items = document.getElementById('pqtut-items');
    var waiting = threads.filter(function (t) { return t.unanswered; }).length;
    document.getElementById('pqtut-count').textContent = threads.length + ' conversation' + (threads.length === 1 ? '' : 's') + ' · ' + waiting + ' waiting';
    if (!threads.length) {
      items.innerHTML = '<div class="pqtut-empty">No learner has written to your subjects yet. When one does, they appear here.</div>';
      return;
    }
    items.innerHTML = threads.map(function (t) {
      var wait = t.unanswered
        ? '<span class="pqtut-wait' + (t.waitingseconds > 3600 ? ' is-long' : '') + '">waiting ' + minutes(t.waitingseconds) + '</span>'
        : '<span class="pqtut-wait is-ok">answered</span>';
      return '<button type="button" class="pqtut-item' + (t.threadid === openId ? ' is-open' : '') + '" data-thread="' + t.threadid + '">'
        + '<span><b>' + esc(t.learner) + '</b> <small>· ' + esc(t.subjectlabel) + '</small></span>' + wait
        + '<span class="pqtut-preview">' + (t.lastfromlearner ? '' : 'You: ') + esc(t.lastbody) + '</span></button>';
    }).join('');
    Array.prototype.forEach.call(items.querySelectorAll('[data-thread]'), function (b) {
      b.addEventListener('click', function () { openThread(Number(b.getAttribute('data-thread'))); });
    });
  };

  var msgsEl = document.getElementById('pqtut-msgs');
  var bubble = function (m) {
    var el = document.createElement('div');
    el.className = 'pqtut-bubble' + (m.mine ? ' is-mine' : (m.teacher ? ' is-staff' : ''));
    var who = m.mine ? '' : '<b>' + esc(m.name) + (m.teacher ? ' (tutor)' : '') + '</b>';
    if (m.kind === 'file' || m.kind === 'screenshot') {
      el.innerHTML = who + '<span>' + (m.kind === 'screenshot' ? '📷 Screenshot of the lesson page' : '📎 ' + esc(m.file && m.file.name)) + '</span><small>' + timeOf(m.at) + '</small>';
      post({ verb: 'file', threadid: openId, fileid: m.id }).then(function (f) {
        if (!f || !f.ok) return;
        var span = el.querySelector('span');
        if (f.gone) { span.textContent += ' (expired after 30 days)'; return; }
        if (/^image\//.test(f.mime)) {
          var img = document.createElement('img');
          img.src = 'data:' + f.mime + ';base64,' + f.base64;
          img.alt = f.name;
          el.insertBefore(img, el.querySelector('small'));
        } else {
          var a = document.createElement('a');
          a.className = 'pqtut-dl';
          a.href = 'data:' + f.mime + ';base64,' + f.base64;
          a.download = f.name;
          a.textContent = '⬇ Open ' + f.name;
          el.insertBefore(a, el.querySelector('small'));
        }
      });
      return el;
    }
    el.innerHTML = who + esc(m.body) + '<small>' + timeOf(m.at) + '</small>';
    return el;
  };
  var append = function (list) {
    if (!list || !list.length) return;
    var nearBottom = msgsEl.scrollHeight - msgsEl.scrollTop - msgsEl.clientHeight < 80;
    list.forEach(function (m) {
      if (m.id <= lastId) return;
      lastId = Math.max(lastId, m.id);
      msgsEl.appendChild(bubble(m));
    });
    if (nearBottom) msgsEl.scrollTop = msgsEl.scrollHeight;
  };

  var openThread = function (id) {
    openId = id;
    lastId = 0;
    msgsEl.innerHTML = '';
    openMeta = threads.filter(function (t) { return t.threadid === id; })[0] || null;
    document.getElementById('pqtut-who').textContent = openMeta ? openMeta.learner : 'Conversation';
    document.getElementById('pqtut-where').textContent = openMeta ? (openMeta.subjectlabel + ' · your reply reaches ' + openMeta.learner + ' and your teacher group only') : '';
    document.getElementById('pqtut-form').hidden = false;
    paintList();
    post({ verb: 'thread', threadid: id, since: 0 }).then(function (state) {
      if (state && state.ok) { append(state.messages); msgsEl.scrollTop = msgsEl.scrollHeight; }
    });
  };

  document.getElementById('pqtut-form').addEventListener('submit', function (event) {
    event.preventDefault();
    var ta = document.getElementById('pqtut-body');
    var text = (ta.value || '').trim();
    if (!text || !openId) return;
    var btn = event.target.querySelector('button');
    btn.disabled = true;
    post({ verb: 'send', threadid: openId, body: text, since: lastId }).then(function (state) {
      btn.disabled = false;
      var note = document.getElementById('pqtut-note');
      if (!state || !state.ok) { note.hidden = false; note.textContent = 'That did not send. Try again.'; return; }
      note.hidden = true;
      ta.value = '';
      append(state.messages);
      refreshList();
    });
  });

  var refreshList = function () {
    post({ verb: 'list' }).then(function (state) {
      if (!state || !state.ok) return;
      threads = state.threads || [];
      paintList();
      document.getElementById('pqtut-fresh').textContent = 'updated ' + timeOf(state.servertime);
    });
  };

  paintSubjects();
  paintList();
  setInterval(function () {
    if (document.hidden) return;
    if (openId) post({ verb: 'thread', threadid: openId, since: lastId }).then(function (s) { if (s && s.ok) append(s.messages); });
  }, 8000);
  setInterval(function () { if (!document.hidden) refreshList(); }, 30000);
})();
</script>
<?php
echo $OUTPUT->footer();
