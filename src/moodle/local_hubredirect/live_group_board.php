<?php
declare(strict_types=1);

// Live group board — one teacher, two groups of nine, run out of phase.
//
// While the teacher teaches one group in its breakout room, the other nine work
// in the app with no adult in the room. This is what the teacher glances at on
// entering each room: eighteen tiles, quietest first.
//
// WHY THE SORT IS THE FEATURE. A learner who has reported nothing for twelve
// minutes is the one to look at, and that single ordering catches three
// problems the teacher cannot tell apart from the other room — stuck, gone, and
// disconnected. Everything else on a tile is context for that one decision.
//
// ONE RENDERER, IN JS, SEEDED WITH INLINE JSON. The obvious build is to paint
// the first frame in PHP and refresh it in JavaScript, and that is two
// renderers for one board — they drift, and the drift shows up as a tile that
// changes shape the moment it refreshes. So the page ships the first board as
// inline JSON and lets one JS function draw every frame including the first.
// There is no fetch on load, so it paints as fast as a server-rendered page.
//
// The board is useless without its refresh, so a no-JS visitor is told that
// rather than shown a frozen frame with no way to know it is frozen.

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/live_group_boardlib.php');
require_once($CFG->dirroot . '/local/prequran/progress_gatewaylib.php');

$requestedworkspaceid = optional_param('workspaceid', 0, PARAM_INT);
$windowminutes = pqlgb_clean_window(optional_param('window', PQLGB_DEFAULT_WINDOW_MINUTES, PARAM_INT));
$env = pqlgb_clean_env(optional_param('env', 'production', PARAM_ALPHA));

$consumercontext = pqh_requested_consumer_context();
if ($requestedworkspaceid <= 0 && (int)($consumercontext->workspaceid ?? 0) > 0) {
    $requestedworkspaceid = (int)$consumercontext->workspaceid;
}
$workspaceid = pqh_current_workspace_id((int)$USER->id, $requestedworkspaceid);
if ($workspaceid <= 0 || !pqh_user_can_teach_in_workspace((int)$USER->id, $workspaceid)) {
    pqh_access_denied(
        'The live group board is for teachers of a school workspace.',
        new moodle_url('/local/hubredirect/workspace_dashboard.php'),
        'Teacher access required'
    );
}
pqh_enforce_role_domain($consumercontext, $workspaceid, (int)$USER->id);

// Cover supervision: an administrator may read another teacher's board. The
// manage check is what allows it, so the parameter alone can never widen
// access — same rule the poll endpoint restates for itself.
$teacherid = (int)$USER->id;
$requestedteacherid = optional_param('teacherid', 0, PARAM_INT);
$canmanage = pqh_user_can_manage_workspace((int)$USER->id, $workspaceid);
if ($requestedteacherid > 0 && $requestedteacherid !== $teacherid && $canmanage) {
    $teacherid = $requestedteacherid;
}

// A manager landing on their own empty board is what this exists to prevent:
// the board defaults to $USER->id, an administrator owns no groups, and the
// message said "no class groups are assigned to you" with no hint that a
// teacher can be chosen. The teacherid parameter was undiscoverable without
// reading the source, so every admin's first visit read as a broken page.
$boardteachers = $canmanage ? pqlgb_board_teachers($workspaceid) : [];

$urlparams = ['workspaceid' => $workspaceid];
if ($windowminutes !== PQLGB_DEFAULT_WINDOW_MINUTES) {
    $urlparams['window'] = $windowminutes;
}
if ($teacherid !== (int)$USER->id) {
    $urlparams['teacherid'] = $teacherid;
}
if (!empty($consumercontext->consumerslug)) {
    $urlparams['consumer'] = (string)$consumercontext->consumerslug;
}

$ready = pqlgb_schema_ready();
$board = $ready ? pqlgb_build($teacherid, $workspaceid, $windowminutes, $env) : ['groups' => [], 'totals' => [
    'learners' => 0, 'quiet' => 0, 'breaks' => 0, 'leftearly' => 0, 'hands' => 0, 'donewindow' => 0,
], 'generated' => time(), 'window' => $windowminutes, 'env' => $env];
$board['ok'] = true;
$board['teacherid'] = $teacherid;

$dataurl = new moodle_url('/local/hubredirect/live_group_board_data.php', [
    'workspaceid' => $workspaceid,
    'window' => $windowminutes,
    'env' => $env,
    'teacherid' => $teacherid,
    'sesskey' => sesskey(),
]);

$handurl = new moodle_url('/local/hubredirect/live_group_board_hand.php', [
    'workspaceid' => $workspaceid,
    'teacherid' => $teacherid,
    'sesskey' => sesskey(),
]);
$chaturl = new moodle_url('/local/hubredirect/live_group_board_chat.php', [
    'workspaceid' => $workspaceid,
    'teacherid' => $teacherid,
    'sesskey' => sesskey(),
]);

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/live_group_board.php', $urlparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Live group board');
$PAGE->set_heading('Live group board');
$PAGE->add_body_class('pqlgb-page');

echo $OUTPUT->header();
?>
<style><?php echo pqh_openproject_skin_css('pqlgb', 'pqlgb-page'); ?></style>
<style>
.pqlgb{font-family:var(--op-font);color:var(--op-ink);max-width:1240px;margin:0 auto;padding:4px 0 40px}
.pqlgb-bar{display:flex;flex-wrap:wrap;align-items:center;gap:12px;padding:14px 16px;margin-bottom:16px;background:var(--op-surface);border:1px solid var(--op-line);border-radius:var(--op-radius)}
.pqlgb-bar h2{margin:0;font-size:18px;font-weight:900;letter-spacing:-.01em}
.pqlgb-spacer{flex:1 1 auto}
.pqlgb-form{display:flex;align-items:center;gap:8px}
.pqlgb-form label{font-size:12px;font-weight:700;letter-spacing:.4px;text-transform:uppercase;color:var(--op-ink-soft)}
.pqlgb-select{min-height:34px;padding:0 8px;border:1px solid var(--op-line-strong);border-radius:var(--op-radius);background:var(--op-surface);color:var(--op-ink);font-family:var(--op-font);font-size:13px;font-weight:700}
.pqlgb-freshness{display:inline-flex;align-items:center;gap:7px;font-size:12.5px;font-weight:700;color:var(--op-ink-soft)}
.pqlgb-dot{width:8px;height:8px;border-radius:50%;background:#2f8f5b;flex:none}
.pqlgb-freshness.is-stale .pqlgb-dot{background:var(--op-ink-faint)}
.pqlgb-freshness.is-failing .pqlgb-dot{background:#b02a37}

/* Grid, not wrapping flex: with flex:1 1 150px a fourth tile that does not fit
   wraps alone and then GROWS to the full row, so "Not started" ends up the
   widest thing on the board. auto-fit keeps them equal and wraps 2x2. */
.pqlgb-totals{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-bottom:18px}
.pqlgb-total{padding:11px 14px;background:var(--op-surface);border:1px solid var(--op-line);border-radius:var(--op-radius)}
.pqlgb-total b{display:block;font-size:24px;font-weight:900;line-height:1.1;letter-spacing:-.02em;font-variant-numeric:tabular-nums}
.pqlgb-total span{display:block;margin-top:2px;font-size:12px;font-weight:700;color:var(--op-ink-soft)}
.pqlgb-total.is-flagged b{color:#b02a37}

.pqlgb-groups{display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:16px;align-items:start}
.pqlgb-group{background:var(--op-surface);border:1px solid var(--op-line);border-radius:var(--op-radius);overflow:hidden}
.pqlgb-group-head{display:flex;align-items:baseline;gap:10px;padding:12px 14px;border-bottom:1px solid var(--op-line);background:var(--op-surface-tint)}
.pqlgb-group-head h3{margin:0;font-size:15px;font-weight:900}
.pqlgb-group-head span{font-size:12px;font-weight:700;color:var(--op-ink-soft)}
.pqlgb-tiles{display:flex;flex-direction:column}

.pqlgb-tile{display:grid;grid-template-columns:38px 1fr auto;gap:11px;padding:11px 14px;border-bottom:1px solid var(--op-line);border-left:3px solid transparent}
.pqlgb-tile:last-child{border-bottom:0}
.pqlgb-tile--alert{border-left-color:#b02a37;background:var(--op-bad-bg)}
.pqlgb-tile--warn{border-left-color:#997404;background:var(--op-warn-bg)}
.pqlgb-tile--nodata{border-left-color:var(--op-line-strong);background:var(--op-surface-soft)}
/* A raised hand is the only state the LEARNER declared, so it gets the one
   saturated treatment on the board and outranks every inferred colour. */
.pqlgb-tile--hand{border-left-color:#1a67a3;background:var(--op-primary-subtle)}
.pqlgb-tile--hand .pqlgb-avatar{background:#1a67a3;color:#fff}
.pqlgb-tile--hand .pqlgb-quiet b{color:var(--op-primary-emphasis)}
.pqlgb-answer{margin-top:6px;min-height:28px;padding:0 10px;border:1px solid #1a67a3;border-radius:var(--op-pill);background:#1a67a3;color:#fff;font-family:var(--op-font);font-size:11.5px;font-weight:800;cursor:pointer}
.pqlgb-answer:hover{background:var(--op-primary-hover);border-color:var(--op-primary-hover)}
.pqlgb-answer[disabled]{opacity:.55;cursor:default}
.pqlgb-avatar{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;background:var(--op-primary-subtle);color:var(--op-primary-emphasis);font-size:13px;font-weight:900;letter-spacing:.02em}
.pqlgb-tile--alert .pqlgb-avatar{background:#f1aeb5;color:#58151c}
.pqlgb-tile--warn .pqlgb-avatar{background:#ffe69c;color:#664d03}
.pqlgb-who{min-width:0}
.pqlgb-who b{display:block;font-size:14px;font-weight:800;line-height:1.3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pqlgb-where{margin-top:2px;font-size:12.5px;color:var(--op-ink-muted);line-height:1.4;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pqlgb-flags{display:flex;flex-wrap:wrap;gap:5px;margin-top:6px}
.pqlgb-flag{display:inline-flex;align-items:center;padding:2px 7px;border:1px solid var(--op-line-strong);border-radius:var(--op-pill);background:var(--op-surface);font-size:11px;font-weight:800;letter-spacing:.02em}
.pqlgb-flag--bad{border-color:#f1aeb5;background:#f8d7da;color:#58151c}
.pqlgb-flag--warn{border-color:#ffe69c;background:#fff3cd;color:#664d03}
.pqlgb-flag--ok{border-color:#a3cfbb;background:#d1e7dd;color:#0a3622}
.pqlgb-flag--moved{border-color:#a3cfbb;background:#d1e7dd;color:#0a3622}
/* A raised hand is the one thing on this board the learner said out loud, and
   its flag had been rendering with no rule of its own since the feature
   shipped -- it read as an ordinary grey pill among the inferred signals it is
   meant to outrank. Blue rather than red: it is a request for help, not a
   fault. */
.pqlgb-flag--hand{border-color:#9ec5fe;background:#cfe2ff;color:#052c65}
/* In Wehel right now. Same blue family as the hand, one step quieter: both say
   "this learner is already getting help", which is the reading that changes
   what the teacher does next. */
.pqlgb-flag--live{border-color:#9ec5fe;background:#e7f1ff;color:#084298}
.pqlgb-reason{margin-top:6px;padding:6px 8px;border-left:2px solid #f1aeb5;background:var(--op-surface);font-size:12px;font-style:italic;color:var(--op-ink-muted);line-height:1.4}
.pqlgb-quiet{text-align:right;white-space:nowrap}
.pqlgb-quiet b{display:block;font-size:17px;font-weight:900;line-height:1.15;font-variant-numeric:tabular-nums}
.pqlgb-quiet span{display:block;margin-top:1px;font-size:11px;font-weight:700;color:var(--op-ink-soft);text-transform:uppercase;letter-spacing:.4px}
.pqlgb-tile--alert .pqlgb-quiet b{color:#b02a37}
.pqlgb-tile--warn .pqlgb-quiet b{color:#997404}

.pqlgb-empty{padding:26px 16px;text-align:center;font-size:14px}
.pqlgb-note{margin-top:18px;padding:12px 14px;background:var(--op-surface);border:1px solid var(--op-line);border-left:3px solid var(--op-primary);border-radius:var(--op-radius);font-size:12.5px;color:var(--op-ink-muted);line-height:1.55}
.pqlgb-note b{color:var(--op-ink)}
.pqlgb-noscript{padding:14px 16px;margin-bottom:16px;background:var(--op-warn-bg);border:1px solid var(--op-warn-line);border-radius:var(--op-radius);color:var(--op-warn-ink);font-size:13.5px;font-weight:700}
@media (max-width:640px){.pqlgb-groups{grid-template-columns:1fr}}
/* The classroom chat, on the right of the tiles. A column rather than an
   overlay, because the board is left open all session and a drawer that covers
   tiles hides the thing the page exists to show. */
.pqlgb-cols{display:flex;gap:16px;align-items:start}
.pqlgb-main{flex:1;min-width:0}
.pqlgb-chat{width:320px;flex:0 0 320px;background:var(--op-surface);border:1px solid var(--op-line-strong);border-radius:10px;display:flex;flex-direction:column;max-height:78vh;position:sticky;top:12px}
.pqlgb-chat-head{padding:10px 12px;border-bottom:1px solid var(--op-line-strong);font-weight:800;display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.pqlgb-chat-tab{border:1px solid var(--op-line-strong);background:transparent;border-radius:999px;padding:3px 10px;font:inherit;font-size:12px;font-weight:700;cursor:pointer}
.pqlgb-chat-tab.is-active{background:#cfe2ff;border-color:#9ec5fe;color:#052c65}
.pqlgb-chat-msgs{flex:1;overflow-y:auto;padding:10px 12px;display:flex;flex-direction:column;gap:8px;min-height:120px}
.pqlgb-chat-msg{max-width:92%;padding:7px 10px;border-radius:10px;background:#f1f3f5;font-size:13px;line-height:1.4}
.pqlgb-chat-msg b{display:block;font-size:11px;margin-bottom:2px;opacity:.75}
.pqlgb-chat-msg.is-mine{align-self:flex-end;background:#cfe2ff}
/* A learner's message: only the teacher and the child see it, and the tint
   says so — it must not read like something the room saw. */
.pqlgb-chat-msg.is-private{background:#fff3cd;border:1px solid #ffe69c}
.pqlgb-chat-msg.is-private small{display:block;font-size:10px;color:#664d03;margin-top:3px}
.pqlgb-chat-empty{color:var(--op-muted,#6c757d);font-size:13px;padding:8px 2px}
.pqlgb-chat-form{display:flex;gap:8px;padding:10px 12px;border-top:1px solid var(--op-line-strong)}
.pqlgb-chat-form input{flex:1;border:1px solid var(--op-line-strong);border-radius:8px;padding:7px 10px;font:inherit;font-size:13px;min-width:0}
.pqlgb-chat-form button{border:1px solid #052c65;background:#0d6efd;color:#fff;border-radius:8px;padding:7px 14px;font:inherit;font-size:13px;font-weight:700;cursor:pointer}
@media (max-width:900px){.pqlgb-cols{flex-direction:column}.pqlgb-chat{width:100%;flex:1 1 auto;position:static;max-height:50vh}}
</style>

<div class="pqlgb">
  <noscript>
    <div class="pqlgb-noscript">This board refreshes itself every few seconds and needs JavaScript. Without it the tiles below would freeze with nothing to tell you they had, so they are not shown.</div>
  </noscript>

  <div class="pqlgb-bar">
    <h2>Live group board</h2>
    <span class="pqlgb-freshness" id="pqlgb-freshness"><i class="pqlgb-dot"></i><span id="pqlgb-freshness-text">just updated</span></span>
    <span class="pqlgb-spacer"></span>
    <form class="pqlgb-form" method="get" action="<?php echo (new moodle_url('/local/hubredirect/live_group_board.php'))->out(false); ?>">
      <input type="hidden" name="workspaceid" value="<?php echo $workspaceid; ?>">
      <?php // Only carried when there is no select to carry it — two inputs of
            // the same name would post twice and the last one would win. ?>
      <?php if (!$boardteachers && $teacherid !== (int)$USER->id): ?><input type="hidden" name="teacherid" value="<?php echo $teacherid; ?>"><?php endif; ?>
      <?php if (!empty($consumercontext->consumerslug)): ?><input type="hidden" name="consumer" value="<?php echo s((string)$consumercontext->consumerslug); ?>"><?php endif; ?>
      <?php if ($boardteachers): ?>
        <label for="pqlgb-teacher">Teacher</label>
        <select class="pqlgb-select" id="pqlgb-teacher" name="teacherid" onchange="this.form.submit()">
          <?php if (!isset($boardteachers[(int)$USER->id])): ?>
            <option value="<?php echo (int)$USER->id; ?>"<?php echo $teacherid === (int)$USER->id ? ' selected' : ''; ?>>Me (no groups)</option>
          <?php endif; ?>
          <?php foreach ($boardteachers as $tid => $tname): ?>
            <option value="<?php echo (int)$tid; ?>"<?php echo (int)$tid === $teacherid ? ' selected' : ''; ?>><?php echo s((string)$tname); ?></option>
          <?php endforeach; ?>
        </select>
      <?php endif; ?>
      <label for="pqlgb-window">Window</label>
      <select class="pqlgb-select" id="pqlgb-window" name="window" onchange="this.form.submit()">
        <?php foreach (pqlgb_window_choices() as $value => $label): ?>
          <option value="<?php echo (int)$value; ?>"<?php echo $value === $windowminutes ? ' selected' : ''; ?>><?php echo s($label); ?></option>
        <?php endforeach; ?>
      </select>
      <noscript><button class="pqlgb-btn" type="submit">Apply</button></noscript>
    </form>
  </div>

  <?php if (!$ready): ?>
    <div class="pqlgb-empty pqlgb-group">The grouping tables are not installed on this site yet, so there are no groups to show.</div>
  <?php else: ?>
    <div class="pqlgb-totals" id="pqlgb-totals"></div>
    <div class="pqlgb-cols">
      <div class="pqlgb-main">
        <div class="pqlgb-groups" id="pqlgb-groups"></div>
        <div class="pqlgb-note">
      <b>What these numbers are.</b> <b>Quiet for</b> is time since the learner's app last reported anything — it is the board's headline because it catches stuck, gone and disconnected alike, which look identical from the other room. <b>Left page</b> counts focus breaks in the chosen window: it is evidence, not prevention, because a web page can report that a learner left it and cannot stop them. <b>Wehel</b> is AI-tutor minutes <em>used</em> today, not minutes left. <b>This cycle</b> counts sections completed and quizzes scored inside the chosen window, from the timestamps the progress gateway now records (<code>_activity</code>). It reads <b>N+</b> where that unit began recording after the window opened &mdash; the count is a floor then, not a total. <b>Done</b> beside it is the running total for the unit, which is a different question and always was.
        </div>
      </div>
      <aside class="pqlgb-chat" id="pqlgb-chat" hidden>
        <div class="pqlgb-chat-head">Class chat<span id="pqlgb-chat-tabs"></span></div>
        <div class="pqlgb-chat-msgs" id="pqlgb-chat-msgs"><div class="pqlgb-chat-empty">Loading&hellip;</div></div>
        <form class="pqlgb-chat-form" id="pqlgb-chat-form">
          <input id="pqlgb-chat-input" type="text" maxlength="1200" placeholder="Message the class&hellip;" autocomplete="off">
          <button type="submit">Send</button>
        </form>
      </aside>
    </div>
  <?php endif; ?>
</div>

<script>
(function () {
  "use strict";
  var seed = <?php echo json_encode($board, JSON_HEX_TAG | JSON_HEX_AMP | JSON_UNESCAPED_SLASHES); ?>;
  var dataUrl = <?php echo json_encode($dataurl->out(false), JSON_HEX_TAG | JSON_HEX_AMP); ?>;
  var handUrl = <?php echo json_encode($handurl->out(false), JSON_HEX_TAG | JSON_HEX_AMP); ?>;
  var chatUrl = <?php echo json_encode($chaturl->out(false), JSON_HEX_TAG | JSON_HEX_AMP); ?>;
  // Written for whoever is looking. The teacher-facing wording sent an
  // administrator away believing the board was broken, when they were simply
  // looking at their own groups and had none.
  var emptyMessage = <?php echo json_encode(
      $boardteachers
          ? 'You own no class groups here. Choose a teacher above to supervise their board.'
          : ($canmanage
              ? 'Nobody in this workspace owns a class group yet. Groups are created in Student grouping.'
              : 'No class groups are assigned to you in this workspace. Groups are created in Student grouping.'),
      JSON_HEX_TAG | JSON_HEX_AMP); ?>;
  var groupsEl = document.getElementById("pqlgb-groups");
  var totalsEl = document.getElementById("pqlgb-totals");
  var freshEl = document.getElementById("pqlgb-freshness");
  var freshTextEl = document.getElementById("pqlgb-freshness-text");
  if (!groupsEl || !totalsEl) { return; }

  var WARN = <?php echo PQLGB_STALE_WARN_SECONDS; ?>;
  var ALERT = <?php echo PQLGB_STALE_ALERT_SECONDS; ?>;
  var POLL_MS = 15000;

  var board = seed;
  // Clock skew between this browser and the server, measured once per response.
  // Quiet times tick between polls so the board never looks frozen, and they
  // tick off the SERVER's own generated stamp rather than a second clock kept
  // here — the same rule the Wehel panel timer follows.
  var skew = 0;
  var lastFetch = Date.now();
  var failures = 0;
  var lastGroupsHtml = "";
  var lastTotalsHtml = "";

  function serverNow() { return Math.floor((Date.now() - skew) / 1000); }

  function esc(value) {
    return String(value === null || value === undefined ? "" : value)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  // Returns [value, unit] rather than a bare string, because the value changes
  // UNIT past an hour and every caller was appending "min" regardless. The live
  // board showed a learner quiet since the previous day as "7h44 MIN QUIET".
  // Keeping the unit with the number is what stops the two drifting again.
  // "3h30" / "45m". Distinct from humanGap(), which formats the big quiet
  // counter and returns a [value, unit] pair for its two-line layout; a flag is
  // one short string.
  function hm(seconds) {
    var m = Math.max(0, Math.round(seconds / 60));
    if (m < 60) { return m + "m"; }
    var h = Math.floor(m / 60), rest = m % 60;
    return h + "h" + (rest < 10 ? "0" : "") + rest;
  }

  function humanGap(seconds) {
    if (seconds < 60) { return ["&lt;1", "min"]; }
    var minutes = Math.floor(seconds / 60);
    if (minutes < 60) { return [String(minutes), "min"]; }
    var hours = Math.floor(minutes / 60);
    var rest = minutes % 60;
    // 7h04, not 7h4 — an unpadded remainder reads as a different number.
    // No unit word past the hour: the "h" in 7h44 already says it, and
    // "7h44 hours quiet" reads worse than "7h44 quiet" on a tile scanned in a
    // second. Callers drop an empty unit rather than printing a stray space.
    return [hours + "h" + (rest < 10 ? "0" : "") + rest, ""];
  }

  // Unit keys are the app's own: "u03" on a course, "g05-u03" for a tutoring
  // learner (course-app.js :: PROGRESS_UNIT), and the three special units the
  // checkpoint emitters use. Printing them raw gives "Unit u03" and, worse,
  // "Unit prereq" — which is not a unit number at all.
  function unitLabel(unit) {
    var raw = String(unit || "");
    var named = { prereq: "Prerequisite", final: "Final assessment", capstone: "Capstone" };
    if (named[raw]) { return named[raw]; }
    var tutoring = raw.match(/^g(\d+)-u(\d+)$/);
    if (tutoring) { return "G" + Number(tutoring[1]) + " Unit " + Number(tutoring[2]); }
    var course = raw.match(/^u(\d+)$/);
    if (course) { return "Unit " + Number(course[1]); }
    return raw;
  }

  // Recomputed here rather than trusted from the payload, because the payload
  // is up to POLL_MS old and a tile that says "5 min" for twenty seconds after
  // it became six is the one case this board must not get wrong.
  function liveState(tile) {
    // A raised hand replaces the state rather than colouring alongside it: the
    // learner has said they are stuck, so what staleness would have GUESSED
    // about them no longer matters for where they sit or how they read.
    if (tile.handup) {
      return { state: "hand", quiet: tile.lastprogress ? Math.max(0, serverNow() - tile.lastprogress) : 0 };
    }
    if (!tile.lastprogress) { return { state: "nodata", quiet: 0 }; }
    var quiet = Math.max(0, serverNow() - tile.lastprogress);
    var state = quiet >= ALERT ? "alert" : (quiet >= WARN ? "warn" : "ok");
    return { state: state, quiet: quiet };
  }

  function tileHtml(tile) {
    var live = liveState(tile);
    var where = [];
    if (tile.subject) { where.push(esc(tile.subject)); }
    if (tile.stage) { where.push(esc(tile.stage)); }
    if (tile.unit) { where.push(esc(unitLabel(tile.unit))); }
    var place = where.length ? where.join(" &middot; ") : "No app activity recorded";

    var flags = [];
    if (tile.handup) {
      flags.push('<span class="pqlgb-flag pqlgb-flag--hand">hand up ' +
        (tile.handsince ? humanGap(Math.max(0, serverNow() - tile.handsince)).filter(Boolean).join(" ") : "") + "</span>");
    }
    // Work done IN the window, ahead of the running total, because the
    // question a teacher asks entering the room is "did this child move since I
    // last looked", not "how far are they overall".
    //
    // "N+" rather than "N" when the ring started recording after the window
    // opened: the count is then a floor and printing a bare number would claim
    // a precision the data does not have. A bare 0 there is worse still — it
    // points the teacher at a learner who is fine.
    var moved = (tile.donewindow || 0) + (tile.quizwindow || 0);
    flags.push('<span class="pqlgb-flag' + (moved > 0 ? " pqlgb-flag--moved" : "") + '"' +
      ' title="' + (tile.windowcovered
        ? "Sections and quizzes completed in the chosen window."
        : "At least this many — this unit began recording after the window opened.") + '">' +
      (moved > 0
        ? "+" + moved + (tile.windowcovered ? "" : "+") + " this cycle"
        // "nothing" is a CLAIM about the window and may only be made when the
        // window was actually covered. Every row written before the gateway
        // started recording has no ring, so saying "nothing" there would
        // report a learner as idle on the strength of data that does not
        // exist — the false negative windowcovered exists to prevent.
        : (tile.windowcovered ? "nothing this cycle" : "not counted yet")) + "</span>");
    // THREE different claims, and the label has to match which one we hold.
    //
    //   in <x>        the learner is in a section they have NOT completed
    //   finished <x>  they are still on it, but it is done -- about to move
    //   last <x>      no resume pointer at all (an app predating v317): we know
    //                 only what they last completed, never where they are
    //
    // The first version said "in:" for both of the first two, so the instant a
    // learner completed a section the tile claimed they were still working in
    // it. It only ever read correctly mid-activity, which is the half of the
    // time a teacher does not need to be told.
    var whereText = "";
    if (tile.resume) {
      // The caption the learner sees, never the route id -- see resumelabel in
      // the library. A teacher matching the tile against a child's screen has
      // to be reading the same word they are.
      whereText = (tile.resumedone ? " &middot; finished " : " &middot; in ")
        + esc(tile.resumelabel || tile.resume);
    } else if (tile.lastsection) {
      whereText = " &middot; last: " + esc(tile.lastsection);
    }
    flags.push('<span class="pqlgb-flag">' + tile.sectionsdone + " done" + whereText + "</span>");
    if (tile.checkpoint) {
      flags.push('<span class="pqlgb-flag pqlgb-flag--' + (tile.checkpoint.passed ? "ok" : "bad") + '">' +
        esc(tile.checkpoint.section) + " " + tile.checkpoint.score + "%</span>");
    }
    if (tile.breaks > 0) {
      flags.push('<span class="pqlgb-flag pqlgb-flag--warn">left page &times;' + tile.breaks + "</span>");
    }
    if (tile.leftearly > 0) {
      flags.push('<span class="pqlgb-flag pqlgb-flag--bad">left early</span>');
    }
    // Presence first: a learner IN the tutor right now is a different thing
    // from one who used it earlier, and it is the one that changes what a
    // teacher does next -- they are already getting help, so leave them.
    if (tile.wehellive) {
      flags.push('<span class="pqlgb-flag pqlgb-flag--live">&#9679; in Wehel' +
        (tile.wehelminutes > 0 ? " &middot; " + tile.wehelminutes + " min today" : "") + "</span>");
    } else if (tile.wehelminutes > 0) {
      flags.push('<span class="pqlgb-flag">Wehel ' + tile.wehelminutes + " min</span>");
    }
    // The learner's DAY: what they have banked today and what is left of the
    // target. Never a countdown to a stop -- used-time is a floor (a long read
    // reports nothing until the learner moves), so "left" is a ceiling, and
    // nothing happens at zero.
    //
    // ALWAYS RENDERED, including when there is no ledger. The first version
    // drew nothing at all in that case, on the reasoning that "3h 30m left" for
    // a day nobody measured is a confident lie -- which is true, and led to the
    // wrong fix: on the morning it shipped every tile was silent and the
    // feature was indistinguishable from a failed deploy. The board already had
    // the right answer one line above, where the activity ring says "not
    // counted yet" instead of a zero. Say that here too: absent data is a state
    // worth showing, not a reason to show nothing.
    if (tile.learntarget > 0) {
      if (!tile.learncounted) {
        flags.push('<span class="pqlgb-flag">day not counted yet</span>');
      } else {
        var left = tile.learnremaining;
        flags.push('<span class="pqlgb-flag' + (left <= 0 ? " pqlgb-flag--ok" : "") + '">' +
          hm(tile.learnused) + " today &middot; " +
          (left <= 0 ? "target met" : hm(left) + " left") + "</span>");
      }
    }

    return '<div class="pqlgb-tile pqlgb-tile--' + live.state + '">' +
      '<div class="pqlgb-avatar">' + esc(tile.initials) + "</div>" +
      '<div class="pqlgb-who">' +
        "<b>" + esc(tile.name) + "</b>" +
        '<div class="pqlgb-where">' + place + "</div>" +
        '<div class="pqlgb-flags">' + flags.join("") + "</div>" +
        (tile.reason ? '<div class="pqlgb-reason">&ldquo;' + esc(tile.reason) + "&rdquo;</div>" : "") +
        (tile.handup ? '<button class="pqlgb-answer" type="button" data-answer="' + tile.userid + '">Mark answered</button>' : "") +
      "</div>" +
      '<div class="pqlgb-quiet">' +
        (live.state === "nodata"
          ? "<b>&mdash;</b><span>not started</span>"
          : live.state === "hand"
            ? "<b>&#9995;</b><span>hand up</span>"
            : (function (gap) {
                return "<b>" + gap[0] + "</b><span>" + (gap[1] ? gap[1] + " " : "") + "quiet</span>";
              })(humanGap(live.quiet))) +
      "</div>" +
    "</div>";
  }

  function render() {
    var groups = board.groups || [];
    var learners = 0, quiet = 0, breaks = 0, notStarted = 0, hands = 0, moved = 0, inWehel = 0;

    var html = groups.map(function (group) {
      var tiles = (group.tiles || []).slice();
      // Re-sorted here for the same reason liveState exists: a tile can cross
      // the warn threshold between polls, and the order is the thing a teacher
      // reads first.
      var rank = { hand: -1, alert: 0, warn: 1, ok: 2, nodata: 3 };
      tiles.forEach(function (tile) {
        var live = liveState(tile);
        tile._rank = rank[live.state];
        tile._quiet = live.quiet;
        learners++;
        breaks += tile.breaks || 0;
        if (tile.handup) { hands++; }
        // Counted client-side from the same field the tile reads, not taken
        // from board.totals: render() re-derives everything each second so a
        // learner can cross a threshold between polls, and a headline taken
        // from the server while the tiles are recomputed would disagree with
        // the tiles beneath it.
        if (tile.wehellive) { inWehel++; }
        moved += (tile.donewindow || 0) + (tile.quizwindow || 0);
        if (live.state === "alert" || live.state === "warn") { quiet++; }
        if (live.state === "nodata") { notStarted++; }
      });
      tiles.sort(function (a, b) {
        if (a._rank !== b._rank) { return a._rank - b._rank; }
        // Among raised hands, longest WAIT first — not longest quiet. The
        // ladder promises the teacher takes them at the swap, so the one who
        // asked earliest has been waiting through the other three steps.
        if (a.handup && b.handup && a.handsince !== b.handsince) { return a.handsince - b.handsince; }
        if (a._quiet !== b._quiet) { return b._quiet - a._quiet; }
        return String(a.name).localeCompare(String(b.name));
      });

      return '<section class="pqlgb-group">' +
        '<div class="pqlgb-group-head"><h3>' + esc(group.title) + "</h3>" +
          "<span>" + tiles.length + " of " + (group.capacity || 9) +
          (group.level ? " &middot; " + esc(group.level) : "") + "</span></div>" +
        '<div class="pqlgb-tiles">' +
          (tiles.length ? tiles.map(tileHtml).join("")
            : '<div class="pqlgb-empty">No active learners are assigned to this group.</div>') +
        "</div></section>";
    }).join("");

    var groupsHtml = html ||
      '<section class="pqlgb-group"><div class="pqlgb-empty">' + emptyMessage + '</div></section>';

    var totalsHtml = [
      ["Hands up", hands, hands > 0],
      // Not flagged, deliberately: a learner in the tutor is being helped, so
      // this is context for the quiet count above it rather than something the
      // teacher must act on. Highlighting it would put a call to action on the
      // one row that says "this one is fine".
      ["In Wehel now", inWehel, false],
      ["Done this cycle", moved, false],
      ["Learners on screen", learners, false],
      ["Quiet " + Math.floor(WARN / 60) + " min or more", quiet, quiet > 0],
      ["Left the page", breaks, breaks > 0],
      ["Not started", notStarted, notStarted > 0]
    ].map(function (row) {
      return '<div class="pqlgb-total' + (row[2] ? " is-flagged" : "") + '"><b>' + row[1] + "</b><span>" + row[0] + "</span></div>";
    }).join("");

    // render() runs every second so the quiet counters cannot look frozen, but
    // they only CHANGE once a minute — so assign only when the markup actually
    // differs. Without this the board rebuilds its whole DOM 3,600 times an
    // hour on a page a teacher leaves open all day, dropping any text
    // selection and hover state each time.
    if (groupsHtml !== lastGroupsHtml) { groupsEl.innerHTML = groupsHtml; lastGroupsHtml = groupsHtml; }
    if (totalsHtml !== lastTotalsHtml) { totalsEl.innerHTML = totalsHtml; lastTotalsHtml = totalsHtml; }
  }

  function paintFreshness() {
    if (!freshEl || !freshTextEl) { return; }
    var age = Math.floor((Date.now() - lastFetch) / 1000);
    freshEl.className = "pqlgb-freshness" +
      (failures >= 3 ? " is-failing" : (age > 45 ? " is-stale" : ""));
    // Says what is true rather than what is reassuring: if the poll is failing
    // the board is a photograph, and the teacher has to know that to trust a
    // quiet tile.
    freshTextEl.textContent = failures >= 3
      ? "not updating — showing " + (age < 60 ? age + "s" : Math.floor(age / 60) + " min") + " ago"
      : (age < 20 ? "just updated" : "updated " + (age < 60 ? age + "s" : Math.floor(age / 60) + " min") + " ago");
  }

  function poll() {
    if (document.hidden) { return; }
    fetch(dataUrl, { credentials: "same-origin", headers: { "Accept": "application/json" } })
      .then(function (response) {
        if (!response.ok) { throw new Error("HTTP " + response.status); }
        return response.json();
      })
      .then(function (payload) {
        if (!payload || !payload.ok) { throw new Error("payload"); }
        skew = Date.now() - (payload.generated * 1000);
        board = payload;
        lastFetch = Date.now();
        failures = 0;
        render();
      })
      .catch(function () { failures++; })
      .then(paintFreshness);
  }

  // Delegated, because render() replaces the tiles whenever anything changes,
  // so a listener bound to a button would not survive the next repaint.
  groupsEl.addEventListener("click", function (event) {
    var button = event.target.closest ? event.target.closest("[data-answer]") : null;
    if (!button) { return; }
    var learnerid = Number(button.getAttribute("data-answer"));
    if (!learnerid) { return; }
    button.disabled = true;
    button.textContent = "Clearing…";
    fetch(handUrl, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Accept": "application/json" },
      body: new URLSearchParams({ learnerid: String(learnerid) })
    })
      .then(function (response) { return response.ok ? response.json() : null; })
      .then(function (payload) {
        if (!payload || !payload.ok) { throw new Error("refused"); }
        // Lower it locally too, so the tile leaves the top of the list on the
        // next tick rather than after the next poll. The poll confirms it; this
        // only removes the lag between the teacher acting and the board saying
        // so, which is the moment they would otherwise click twice.
        (board.groups || []).forEach(function (group) {
          (group.tiles || []).forEach(function (tile) {
            if (tile.userid === learnerid) { tile.handup = false; tile.handsince = 0; }
          });
        });
        render();
      })
      .catch(function () {
        button.disabled = false;
        button.textContent = "Not cleared — retry";
      });
  });

  skew = Date.now() - ((board.generated || Math.floor(Date.now() / 1000)) * 1000);
  render();
  paintFreshness();
  setInterval(poll, POLL_MS);
  // CATCH UP THE MOMENT THE TAB IS LOOKED AT AGAIN.
  //
  // poll() returns early while the tab is hidden, which is right -- a board
  // left open all day should not poll from behind another window. But nothing
  // resumed on return, so the first thing a teacher saw after switching to the
  // board was whatever was true when they last left it, for up to POLL_MS.
  // Reported as the board "needing a refresh": that refresh was the teacher
  // manually doing what this now does.
  //
  // It matters more than the fifteen seconds suggest, because the two moments
  // a teacher looks at this board are the swap and a learner asking for help --
  // both immediately after looking at something else. The stale window lands
  // exactly when the board is being read.
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) { poll(); }
  });
  // Ticks the quiet counters and the freshness line between polls.
  setInterval(function () { render(); paintFreshness(); }, 1000);

  // --- the classroom chat ---------------------------------------------------
  // One room per group, from the same exchange function the learner's app
  // calls; this panel is only a second door onto it. The teacher's messages
  // are public to the room; a learner's arrive here marked private, because
  // the room's rule is that learners never read each other ("no
  // student-to-student messaging", tools/check-class-group-chat.php).
  //
  // Appends by `since` id rather than repainting — the board's own render()
  // rule applied to chat, so an open panel never eats a half-typed reply.
  (function () {
    var panel = document.getElementById("pqlgb-chat");
    var tabsEl = document.getElementById("pqlgb-chat-tabs");
    var msgsEl = document.getElementById("pqlgb-chat-msgs");
    var form = document.getElementById("pqlgb-chat-form");
    var input = document.getElementById("pqlgb-chat-input");
    if (!panel || !tabsEl || !msgsEl || !form) { return; }

    var CHAT_POLL_MS = 8000;
    var activeGroup = 0;
    var lastId = 0;
    var chatDisabled = false;
    var inflight = false;

    function esc2(s) { var d = document.createElement("div"); d.textContent = s == null ? "" : String(s); return d.innerHTML; }

    function groupsOnBoard() { return (board && board.groups) ? board.groups : []; }

    function drawTabs() {
      var groups = groupsOnBoard();
      if (!groups.length) { panel.hidden = true; return; }
      panel.hidden = chatDisabled;
      if (!activeGroup && groups[0]) { activeGroup = groups[0].id; }
      tabsEl.innerHTML = groups.map(function (g) {
        return '<button type="button" class="pqlgb-chat-tab' + (g.id === activeGroup ? " is-active" : "") + '" data-chatgroup="' + g.id + '">' + esc2(g.title) + "</button>";
      }).join("");
    }

    tabsEl.addEventListener("click", function (event) {
      var btn = event.target.closest ? event.target.closest("[data-chatgroup]") : null;
      if (!btn) { return; }
      var next = Number(btn.getAttribute("data-chatgroup"));
      if (!next || next === activeGroup) { return; }
      activeGroup = next;
      lastId = 0;
      msgsEl.innerHTML = '<div class="pqlgb-chat-empty">Loading&hellip;</div>';
      drawTabs();
      pollChat();
    });

    function appendMessages(list) {
      if (!list || !list.length) { return; }
      var empty = msgsEl.querySelector(".pqlgb-chat-empty");
      if (empty) { empty.remove(); }
      var nearBottom = msgsEl.scrollHeight - msgsEl.scrollTop - msgsEl.clientHeight < 60;
      list.forEach(function (m) {
        if (m.id <= lastId) { return; }
        lastId = Math.max(lastId, m.id);
        var cls = "pqlgb-chat-msg" + (m.mine ? " is-mine" : "") + (m.toteacheronly ? " is-private" : "");
        var who = m.mine ? "" : "<b>" + esc2(m.name) + (m.teacher ? " (teacher)" : "") + "</b>";
        var priv = m.toteacheronly ? "<small>Only you and " + (m.mine ? "your teacher" : "this learner") + " can see this</small>" : "";
        var el = document.createElement("div");
        el.className = cls;
        el.innerHTML = who + esc2(m.body) + priv;
        msgsEl.appendChild(el);
      });
      if (nearBottom) { msgsEl.scrollTop = msgsEl.scrollHeight; }
    }

    function callChat(body) {
      if (!activeGroup || inflight) { return Promise.resolve(null); }
      inflight = true;
      var params = new URLSearchParams();
      params.set("groupid", String(activeGroup));
      params.set("since", String(lastId));
      if (body) { params.set("body", body); }
      return fetch(chatUrl, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString()
      }).then(function (r) { return r.json(); }).then(function (payload) {
        inflight = false;
        if (!payload) { return null; }
        if (payload.enabled === false) {
          // The flag is off for this workspace. Hide rather than tease: a
          // composer that can only be refused teaches the teacher to ignore
          // the panel that one day works.
          chatDisabled = true;
          panel.hidden = true;
          return null;
        }
        if (payload.ok) { appendMessages(payload.messages); }
        return payload;
      }).catch(function () { inflight = false; return null; });
    }

    function pollChat() {
      if (document.hidden || chatDisabled) { return; }
      callChat("");
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var text = (input.value || "").trim();
      if (!text) { return; }
      input.value = "";
      callChat(text);
    });

    drawTabs();
    pollChat();
    setInterval(pollChat, CHAT_POLL_MS);
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) { pollChat(); }
    });
    // Tabs follow the board: a group renamed or added shows up on the next
    // board poll without a reload.
    setInterval(drawTabs, 5000);
  })();
  document.addEventListener("visibilitychange", function () { if (!document.hidden) { poll(); } });
})();
</script>
<?php
echo $OUTPUT->footer();
