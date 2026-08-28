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
    <div class="pqlgb-groups" id="pqlgb-groups"></div>
    <div class="pqlgb-note">
      <b>What these numbers are.</b> <b>Quiet for</b> is time since the learner's app last reported anything — it is the board's headline because it catches stuck, gone and disconnected alike, which look identical from the other room. <b>Left page</b> counts focus breaks in the chosen window: it is evidence, not prevention, because a web page can report that a learner left it and cannot stop them. <b>Wehel</b> is AI-tutor minutes <em>used</em> today, not minutes left. <b>This cycle</b> counts sections completed and quizzes scored inside the chosen window, from the timestamps the progress gateway now records (<code>_activity</code>). It reads <b>N+</b> where that unit began recording after the window opened &mdash; the count is a floor then, not a total. <b>Done</b> beside it is the running total for the unit, which is a different question and always was.
    </div>
  <?php endif; ?>
</div>

<script>
(function () {
  "use strict";
  var seed = <?php echo json_encode($board, JSON_HEX_TAG | JSON_HEX_AMP | JSON_UNESCAPED_SLASHES); ?>;
  var dataUrl = <?php echo json_encode($dataurl->out(false), JSON_HEX_TAG | JSON_HEX_AMP); ?>;
  var handUrl = <?php echo json_encode($handurl->out(false), JSON_HEX_TAG | JSON_HEX_AMP); ?>;
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

  function humanGap(seconds) {
    if (seconds < 60) { return "&lt;1"; }
    var minutes = Math.floor(seconds / 60);
    if (minutes < 60) { return String(minutes); }
    return Math.floor(minutes / 60) + "h" + (minutes % 60);
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
        (tile.handsince ? humanGap(Math.max(0, serverNow() - tile.handsince)) + " min" : "") + "</span>");
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
    flags.push('<span class="pqlgb-flag">' + tile.sectionsdone + " done" +
      (tile.lastsection ? " &middot; last: " + esc(tile.lastsection) : "") + "</span>");
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
    if (tile.wehelminutes > 0) {
      flags.push('<span class="pqlgb-flag">Wehel ' + tile.wehelminutes + " min</span>");
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
            : "<b>" + humanGap(live.quiet) + "</b><span>min quiet</span>") +
      "</div>" +
    "</div>";
  }

  function render() {
    var groups = board.groups || [];
    var learners = 0, quiet = 0, breaks = 0, notStarted = 0, hands = 0, moved = 0;

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
  // Ticks the quiet counters and the freshness line between polls.
  setInterval(function () { render(); paintFreshness(); }, 1000);
  document.addEventListener("visibilitychange", function () { if (!document.hidden) { poll(); } });
})();
</script>
<?php
echo $OUTPUT->footer();
