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
// The shared shell's own links carry only the stable identifiers -- consumer
// and workspace -- never this page's teacher/window state.
$navparams = $workspaceid > 0 ? ['workspaceid' => $workspaceid] : [];
if (!empty($consumercontext->consumerslug)) {
    $navparams['consumer'] = (string)$consumercontext->consumerslug;
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
$livesessionsurl = new moodle_url('/local/hubredirect/live_sessions.php', [
    'workspaceid' => $workspaceid,
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
<?php // The board's components -- totals, tiles, pills, flags, chat, chrome.
      // Lifted verbatim out of this file so the PARENT board can wear the
      // same components instead of approximating them; the extraction is
      // verified byte-identical against the block that was here. ?>
<?php echo pqh_ehel_board_components_css('pqlgb', 'pqlgb-page'); ?>
<?php echo pqh_design_shell_css('.pqlgb-shell'); ?>
.pqlgb-shell .pqh-appbar{background:linear-gradient(90deg,#cfe9ff 0%,#e3f4ff 50%,#f2fbff 100%)}
</style>
<style><?php echo pqh_viewer_chrome_css('.pqlgb-shell'); ?></style>
<style><?php echo pqh_ehel_group_board_css('.pqlgb-shell', 'pqlgb-page'); ?></style>
<main class="pqlgb-shell">
<?php
echo pqh_design_shell_html('pqlgb-shell', 'board', [
    'title' => 'Live group board',
    'appbar' => [
        ['Dashboard', new moodle_url('/local/hubredirect/dashboard.php', $navparams)],
        ['Workspace', new moodle_url('/local/hubredirect/teacher_workspace.php', $navparams)],
        ['Back', 'BACK', new moodle_url('/local/hubredirect/teacher_workspace.php', $navparams)],
    ],
    'navitems' => [[
        'label' => 'Live group board',
        'key' => 'board',
        'url' => new moodle_url('/local/hubredirect/live_group_board.php', $urlparams),
        'icon' => '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>',
    ]],
]);
?>
<div class="pqlgb-wrap">
<div class="pqlgb">
  <section class="pqlgb-top">
    <div>
      <h1>Live group board</h1>
      <p>Hands, quiet time, the chat, and the live room, across both groups at a glance.</p>
    </div>
    <div class="pqlgb-top-actions">
      <a href="<?php echo (new moodle_url('/local/hubredirect/teacher_workspace.php', $navparams))->out(false); ?>">Teacher workspace</a>
    </div>
  </section>
  <noscript>
    <div class="pqlgb-noscript">This board refreshes itself every few seconds and needs JavaScript. Without it the tiles below would freeze with nothing to tell you they had, so they are not shown.</div>
  </noscript>

  <div class="pqlgb-bar">
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
    <?php // Fullscreen: totals + tiles only, chrome/header/note/chat hidden --
          // for a teacher glancing across the room or a wall display beside
          // it. Needs no JS from the board's own script: it toggles one body
          // class and, best-effort, the real Fullscreen API; see the small
          // script block near the end of this file, kept separate from
          // render()'s so this addition cannot touch a single line of the
          // sort/state code above it. ?>
    <button type="button" class="pqlgb-fullscreen-btn" id="pqlgb-fullscreen-btn" aria-pressed="false" title="Show only the student monitoring data">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
      <span>Fullscreen</span>
    </button>
  </div>

  <?php if (!$ready): ?>
    <div class="pqlgb-empty pqlgb-group">The grouping tables are not installed on this site yet, so there are no groups to show.</div>
  <?php else: ?>
    <div class="pqlgb-totals" id="pqlgb-totals"></div>
    <div class="pqlgb-cols">
      <div class="pqlgb-main">
        <div class="pqlgb-groups" id="pqlgb-groups"></div>
        <div class="pqlgb-note">
      <b>What these numbers are.</b> <b>Quiet for</b> is time since the learner's app last reported anything — it is the board's headline because it catches stuck, gone and disconnected alike, which look identical from the other room. <b>Left page</b> counts focus breaks in the chosen window: it is evidence, not prevention, because a web page can report that a learner left it and cannot stop them. Where it says <b>N full screen</b>, that many of them were only a drop out of full screen &mdash; much weaker evidence than hiding the tab. <b>3 of 7</b> on the position pill is how far into that activity the learner has got, for the sections that report it. <b>Words known</b> counts the words this learner has picked correctly for a sound or a picture &mdash; evidence, never a mark, and with no denominator because the tile knows the learner and not the content. <b>N checks &middot; avg</b> is every scored check in the unit beside the weakest one, which alone cannot tell one bad quiz from a bad morning. <b>Wehel</b> is AI-tutor minutes <em>used</em> today, not minutes left. <b>This cycle</b> counts sections completed and quizzes scored inside the chosen window, from the timestamps the progress gateway now records (<code>_activity</code>). It reads <b>N+</b> where that unit began recording after the window opened &mdash; the count is a floor then, not a total. <b>Done</b> beside it is the running total for the unit, which is a different question and always was.
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
</div>
</main>

<script>
(function () {
  "use strict";
  var seed = <?php echo json_encode($board, JSON_HEX_TAG | JSON_HEX_AMP | JSON_UNESCAPED_SLASHES); ?>;
  var dataUrl = <?php echo json_encode($dataurl->out(false), JSON_HEX_TAG | JSON_HEX_AMP); ?>;
  var handUrl = <?php echo json_encode($handurl->out(false), JSON_HEX_TAG | JSON_HEX_AMP); ?>;
  var chatUrl = <?php echo json_encode($chaturl->out(false), JSON_HEX_TAG | JSON_HEX_AMP); ?>;
  var liveSessionsUrl = <?php echo json_encode($livesessionsurl->out(false), JSON_HEX_TAG | JSON_HEX_AMP); ?>;
  var boardSesskey = <?php echo json_encode(sesskey(), JSON_HEX_TAG | JSON_HEX_AMP); ?>;
  var boardWorkspaceId = <?php echo (int)$workspaceid; ?>;
  var boardTeacherId = <?php echo (int)$teacherid; ?>;
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
    // A standalone lesson build's own unit (Maths, Science, Computing and
    // Global Perspectives at Grades 1-4): "l03" is Lesson 3, not a unit id.
    var lesson = raw.match(/^l(\d+)$/);
    if (lesson) { return "Lesson " + Number(lesson[1]); }
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
    // The place line: every fact a tinted pill, position first (owner,
    // 2026-08-30) -- context, like the unit, never a state; states stay on
    // the chip row. Position wording keeps its three claims (see the comment
    // block below where it was settled): in <x> mid-activity, finished <x>
    // done and about to move, last: <x> when no resume pointer exists. The
    // caption is the learner's own (resumelabel), never the route id. A tile
    // with no app record keeps saying so instead of showing a bare "0 done".
    var placeparts = [];
    if (tile.subject) { placeparts.push([esc(tile.subject), "course"]); }
    if (tile.stage) { placeparts.push([esc(tile.stage), "course"]); }
    if (tile.unit) { placeparts.push([esc(unitLabel(tile.unit)), "course"]); }
    if (tile.resume) {
      // HOW FAR INTO IT, where the app reports participation for this section:
      // "in Reading books" and "in Reading books - 3 of 7" are different
      // conversations, and the second is the one that says whether to go over.
      // It rides on the position pill because it is the same fact made
      // precise, not a state of its own.
      placeparts.push([(tile.resumedone ? "finished " : "in ") + esc(tile.resumelabel || tile.resume) +
        (tile.activity ? " &middot; " + tile.activity.answered + " of " + tile.activity.total : ""), "pos"]);
    } else if (tile.lastsection) {
      placeparts.push(["last: " + esc(tile.lastsection), "pos"]);
    }
    if (placeparts.length) {
      placeparts.push([tile.sectionsdone + " done", "done"]);
      // Words the learner has PROVED, by picking the right one for a sound or
      // a picture. Not a mark and not a target -- there is no denominator on
      // this board, because the unit's word count is a property of the content
      // and this tile only knows the learner.
      if (tile.knownwords > 0) {
        placeparts.push([tile.knownwords + " words known", "words"]);
      }
      if (tile.wehelminutes > 0 && !tile.wehellive) {
        placeparts.push(["Wehel " + tile.wehelminutes + " min", "wehel"]);
      }
    }
    var place = placeparts.length
      ? placeparts.map(function (part) {
          return '<span class="pqlgb-pl pqlgb-pl--' + part[1] + '">' + part[0] + "</span>";
        }).join("")
      : "No app activity recorded";

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
    flags.push('<span class="pqlgb-flag' + (moved > 0 ? " pqlgb-flag--moved" : " pqlgb-flag--cycle") + '"' +
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
    // (The position chip that used to render here moved onto the place line
    // above, 2026-08-30.)
    if (tile.checkpoint) {
      flags.push('<span class="pqlgb-flag pqlgb-flag--' + (tile.checkpoint.passed ? "ok" : "bad") + '">' +
        esc(tile.checkpoint.section) + " " + tile.checkpoint.score + "%</span>");
    }
    // The weakest score alone cannot say whether it was one bad quiz or a bad
    // morning, and those ask for different things. Only where there is more
    // than one -- with a single check the chip above already IS the spread.
    if (tile.checkscount > 1) {
      flags.push('<span class="pqlgb-flag pqlgb-flag--cycle"' +
        ' title="Every scored check in this unit, and their mean.">' +
        tile.checkscount + " checks &middot; avg " + tile.checksavg + "%</span>");
    }
    if (tile.breaks > 0) {
      // Focus tracking, stated as the EVENT rather than a claim about now:
      // "away Xm" is the time since their last reported departure with no
      // return reported after it. Evidence, not prevention -- and only
      // learners launched in focus mode report at all.
      var brk = "left page &times;" + tile.breaks;
      // Leaving fullscreen is much weaker evidence than hiding the tab: a
      // child can drop out of it with Escape and carry on reading the page.
      // Counted inside the total, named separately so the total is not read
      // as four departures when three of them were a keypress.
      if (tile.fsexits > 0) {
        brk += " &middot; " + tile.fsexits + " full screen";
      }
      if (tile.awaysince > 0) {
        brk += " &middot; away " + humanGap(Math.max(0, serverNow() - tile.awaysince)).filter(Boolean).join(" ").replace("&lt;1 min", "just now");
      }
      flags.push('<span class="pqlgb-flag pqlgb-flag--warn">' + brk + "</span>");
    }
    if (tile.leftearly > 0) {
      flags.push('<span class="pqlgb-flag pqlgb-flag--bad">left early</span>');
    }
    // The live room, while one is running: who is IN it. A child in BBB has
    // this app tab backgrounded, so without this flag they read as quiet/gone
    // on the very board that should show them doing the right thing. JOINED is
    // the measured fact (the join action's attendance row); BBB does not
    // reliably report leaving, so the flag says when they joined and never
    // claims "still in". Only the positive fact is stated: a learner without
    // it may be working in the app on purpose, so "not in live class yet"
    // was an accusation the data cannot support (owner, 2026-08-30) --
    // absence of the flag says everything the amber version did, honestly.
    if (tile.liveclass && tile.liveclass.joined > 0) {
      var jt = new Date(tile.liveclass.joined * 1000);
      flags.push('<span class="pqlgb-flag pqlgb-flag--ok">in live class &middot; joined '
        + ("0" + jt.getHours()).slice(-2) + ":" + ("0" + jt.getMinutes()).slice(-2) + "</span>");
    }
    // Presence first: a learner IN the tutor right now is a different thing
    // from one who used it earlier, and it is the one that changes what a
    // teacher does next -- they are already getting help, so leave them.
    if (tile.wehellive) {
      flags.push('<span class="pqlgb-flag pqlgb-flag--live">&#9679; in Wehel' +
        (tile.wehelminutes > 0 ? " &middot; " + tile.wehelminutes + " min today" : "") + "</span>");
    }
    // (The Wehel-minutes chip moved onto the place line, 2026-08-30.)
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
        flags.push('<span class="pqlgb-flag pqlgb-flag--cycle">day not counted yet</span>');
      } else {
        var left = tile.learnremaining;
        flags.push('<span class="pqlgb-flag' + (left <= 0 ? " pqlgb-flag--ok" : " pqlgb-flag--time") + '">' +
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
        goLiveControl(group) +
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

  // The administrator schedules the classes; the teacher STARTS them. So when
  // a group has a session on today's calendar, Go live is a LINK into the
  // existing join flow for exactly that session -- due now it says "Start
  // class", still ahead it shows the time, and either way nothing new is
  // created. Only a group with nothing scheduled today gets the create-now
  // fallback below.
  function goLiveControl(group) {
    var sess = group.session;
    if (sess && sess.id) {
      var href = liveSessionsUrl + "&action=join&sessionid=" + sess.id + "&sesskey=" + encodeURIComponent(boardSesskey);
      var when = new Date(sess.start * 1000);
      // A LIVE room outranks the calendar wording: "Class at 09:00" over a
      // room that is running right now (a future-dated recurring session the
      // teacher went live on) reads as a stuck board. The link is the same
      // join action either way.
      var label = sess.live
        ? "In session"
        : (sess.due
            ? "Start class"
            : "Class at " + ("0" + when.getHours()).slice(-2) + ":" + ("0" + when.getMinutes()).slice(-2));
      return '<a class="pqlgb-golive' + (sess.due || sess.live ? "" : " is-upcoming") + '" target="_blank" rel="noopener" href="' + esc(href) + '" title="' + esc(sess.title) + '">' + esc(label) + "</a>";
    }
    return '<button type="button" class="pqlgb-golive" data-golive="' + group.id + '" data-golivetitle="' + esc(group.title) + '">Go live</button>';
  }

  // --- Go live fallback: create-and-start a session for one group -----------
  // No new endpoint and no duplicated scheduling logic: this drives the SAME
  // action=create the session wizard submits, which already takes a groupid
  // and seeds every active member as a participant, already checks teacher
  // conflicts, already queues reminders and audits, and (policy, 2026-07-17)
  // publishes teacher-created sessions immediately. The board contributes only
  // sensible defaults: starting NOW, running one Counterpoint cycle (40 min),
  // titled after the group. live_sessions.php then shows the new session with
  // its Join button, and the teacher JOINING is what creates the BBB meeting --
  // that is the existing start semantics, not a gap.
  //
  // For a non-admin, action=create forces the session's teacher to $USER
  // regardless of what we send, so a teacher can only ever go live as
  // themselves; an admin supervising this board creates on the board teacher's
  // behalf. The times are formatted IN the schedule timezone via Intl rather
  // than the browser's own clock fields, because a supervisor abroad clicking
  // "Go live" must not schedule the lesson eight hours away.
  groupsEl.addEventListener("click", function (event) {
    var btn = event.target.closest ? event.target.closest("[data-golive]") : null;
    if (!btn) { return; }
    var groupid = Number(btn.getAttribute("data-golive"));
    if (!groupid) { return; }
    if (!window.confirm('Start a live session for "' + (btn.getAttribute("data-golivetitle") || "this group") + '" now?')) { return; }
    btn.disabled = true;
    setTimeout(function () { btn.disabled = false; }, 4000);
    var TZ = "Africa/Nairobi";
    var parts = {};
    new Intl.DateTimeFormat("en-CA", {
      timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hour12: false
    }).formatToParts(new Date()).forEach(function (part) { parts[part.type] = part.value; });
    var form = document.createElement("form");
    form.method = "POST";
    form.action = liveSessionsUrl;
    form.target = "_blank";
    var fields = {
      sesskey: boardSesskey,
      action: "create",
      workspaceid: String(boardWorkspaceId),
      teacherid: String(boardTeacherId),
      groupid: String(groupid),
      title: (btn.getAttribute("data-golivetitle") || "Class group") + " — live session",
      sessiondate: parts.year + "-" + parts.month + "-" + parts.day,
      sessiontime: (parts.hour === "24" ? "00" : parts.hour) + ":" + parts.minute,
      timezone: TZ,
      duration: "40"
    };
    Object.keys(fields).forEach(function (name) {
      var input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      input.value = fields[name];
      form.appendChild(input);
    });
    document.body.appendChild(form);
    form.submit();
    form.remove();
  });
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
    // The learner question a typed reply will broadcast with. Cleared on send,
    // on cancel, and on switching group -- a reply must never quote a question
    // from the other room.
    var replyTarget = null;

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
      setReplyTarget(null);
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
        if (m.screenshot) { appendShot(m); return; }
        var cls = "pqlgb-chat-msg" + (m.mine ? " is-mine" : "") + (m.toteacheronly ? " is-private" : "");
        // No "(teacher)" suffix: the exchange now sends staff AS "Teacher"
        // (the learner-facing rule), so the suffix would render "Teacher
        // (teacher)". Students arrive as first names.
        var who = m.mine ? "" : "<b>" + esc2(m.name) + "</b>";
        var priv = m.toteacheronly ? "<small>Only you and " + (m.mine ? "your teacher" : "this learner") + " can see this</small>" : "";
        // An announcement is the teacher's raised voice: banner-styled, so it
        // reads differently from conversation even in the scrollback.
        if (m.announcement) { cls += " is-announcement"; who = who ? who : ""; }
        var megaphone = m.announcement ? '<span class="pqlgb-chat-mega">\uD83D\uDCE2 Teacher Message!</span>' : "";
        // An answered-to-class message carries its question, never its asker.
        var quote = m.quote
          ? '<span class="pqlgb-chat-quote">' + (m.quote.mine ? "You asked" : "Someone asked") + ": " + esc2(m.quote.body) + "</span>"
          : "";
        // A learner question gets the one action that makes it teaching: answer
        // it in front of everyone, with the asker kept out of it. The question
        // TEXT goes to the class, so the button says so -- if a child wrote
        // their name into the question, the teacher is the judgment call.
        var answer = (m.toteacheronly && !m.mine)
          ? '<button type="button" class="pqlgb-chat-answer" data-replyto="' + m.id + '" data-preview="' + esc2(m.body).replace(/"/g, "&quot;") + '">Answer to class</button>'
          : "";
        var el = document.createElement("div");
        el.className = cls;
        el.innerHTML = megaphone + who + quote + esc2(m.body) + priv + answer;
        msgsEl.appendChild(el);
      });
      if (nearBottom) { msgsEl.scrollTop = msgsEl.scrollHeight; }
    }

    // A learner's screenshot: thumbnail fetched lazily through this door (the
    // visibility check runs again server-side), click to toggle full size.
    function appendShot(m) {
      var el = document.createElement("div");
      el.className = "pqlgb-chat-msg is-private";
      el.innerHTML = "<b>" + esc2(m.name) + "</b><span>\uD83D\uDCF7 Screenshot\u2026</span>"
        + "<small>Only you and this learner can see this</small>";
      msgsEl.appendChild(el);
      var params = new URLSearchParams();
      params.set("groupid", String(activeGroup));
      params.set("image", String(m.id));
      fetch(chatUrl, {
        method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString()
      }).then(function (r) { return r.json(); }).then(function (img) {
        var label = el.querySelector("span");
        if (!img || !img.ok) { return; }
        if (img.gone) { label.textContent = "\uD83D\uDCF7 Screenshot (expired)"; return; }
        var pic = document.createElement("img");
        pic.src = "data:image/jpeg;base64," + img.jpegbase64;
        pic.alt = "Learner screenshot";
        pic.className = "pqlgb-chat-shot";
        // A lightbox, not an in-column toggle: the first version expanded
        // inside the 320px chat column, which made a full lesson page
        // unreadable -- the owner's words were "too small for the teacher to
        // review". The teacher is REVIEWING a child's screen; that needs the
        // whole viewport. Esc or any click closes.
        pic.addEventListener("click", function () {
          var box = document.createElement("div");
          box.className = "pqlgb-shot-lightbox";
          var big = document.createElement("img");
          big.src = pic.src;
          big.alt = pic.alt;
          box.appendChild(big);
          var close = function () { box.remove(); document.removeEventListener("keydown", onkey); };
          var onkey = function (ev) { if (ev.key === "Escape") { close(); } };
          box.addEventListener("click", close);
          document.addEventListener("keydown", onkey);
          document.body.appendChild(box);
        });
        el.insertBefore(pic, el.querySelector("small"));
        label.remove();
      }).catch(function () { /* leave the placeholder */ });
    }

    function callChat(body, announce) {
      if (!activeGroup || inflight) { return Promise.resolve(null); }
      inflight = true;
      var params = new URLSearchParams();
      params.set("groupid", String(activeGroup));
      params.set("since", String(lastId));
      if (body) { params.set("body", body); }
      if (body && replyTarget && !announce) { params.set("replyto", String(replyTarget.id)); }
      if (body && announce) { params.set("announce", "1"); }
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

    // TWO SEND BUTTONS, no modes (owner, after first use: "Arm does not send").
    // The megaphone SENDS the typed message as an announcement to all groups;
    // Send sends it as an ordinary message or, with the chip armed, as the
    // answer to a learner. A button that only changes what a LATER button will
    // do is a state a teacher mid-lesson should not have to carry.
    var announceBtn = document.createElement("button");
    announceBtn.type = "button";
    announceBtn.className = "pqlgb-chat-announce";
    announceBtn.textContent = "\uD83D\uDCE2";
    announceBtn.title = "Send this message to ALL your groups as an announcement";
    announceBtn.addEventListener("click", function () {
      var text = (input.value || "").trim();
      if (!text) { input.focus(); return; }
      input.value = "";
      setReplyTarget(null); // an announcement is not an answer
      callChat(text, true);
    });
    form.insertBefore(announceBtn, form.firstChild);

    var chip = document.createElement("div");
    chip.className = "pqlgb-chat-chip";
    chip.hidden = true;
    form.insertBefore(chip, form.firstChild);
    function setReplyTarget(next) {
      replyTarget = next;
      chip.hidden = !next;
      chip.innerHTML = next
        ? 'Answering for the class: &ldquo;' + esc2(next.preview).slice(0, 160) + '&rdquo; '
          + '<button type="button" class="pqlgb-chat-chip-x" aria-label="Cancel">&times;</button>'
        : "";
      if (next) { input.placeholder = "Answer the class\u2026"; input.focus(); }
      else { input.placeholder = "Message the class\u2026"; }
    }
    chip.addEventListener("click", function (event) {
      if (event.target.closest && event.target.closest(".pqlgb-chat-chip-x")) { setReplyTarget(null); }
    });
    msgsEl.addEventListener("click", function (event) {
      var btn = event.target.closest ? event.target.closest("[data-replyto]") : null;
      if (!btn) { return; }
      setReplyTarget({ id: Number(btn.getAttribute("data-replyto")), preview: btn.getAttribute("data-preview") || "" });
    });

    // ENTER SENDS NOTHING (owner). With two send buttons of different scope --
    // one room versus every room -- an implicit third path had to pick one of
    // them silently, and a message meant for one child going to every group is
    // the expensive direction to be wrong in. The teacher chooses a button.
    input.addEventListener("keydown", function (event) {
      if (event.key === "Enter") { event.preventDefault(); }
    });
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var text = (input.value || "").trim();
      if (!text) { return; }
      input.value = "";
      callChat(text, false);
      setReplyTarget(null);
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
<script>
// Fullscreen: hides the rail, app bar, header, filter controls, legend and
// chat, leaving the totals row and the tiles -- the student monitoring data
// -- alone on the screen. Deliberately separate from the board's own script
// above: it needs none of render()'s state and touching nothing there is
// what keeps this addition from being able to disturb the sort/state code.
(function () {
  "use strict";
  var btn = document.getElementById("pqlgb-fullscreen-btn");
  if (!btn) { return; }
  var ICON_MAXIMIZE = '<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>';
  var ICON_MINIMIZE = '<path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>';
  var icon = btn.querySelector("svg");
  var label = btn.querySelector("span");

  // The class toggle is the RELIABLE half of this feature and works
  // everywhere; the real Fullscreen API (hiding the browser's own chrome
  // too) is a best-effort bonus on top of it, so a refusal here (an iframe
  // with no allowfullscreen, an older iOS Safari with no element fullscreen)
  // must not stop the declutter itself.
  function nativeRequest() {
    var el = document.documentElement;
    var fn = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen;
    if (!fn) { return; }
    try { var p = fn.call(el); if (p && p.catch) { p.catch(function () {}); } } catch (e) { /* declutter still applies */ }
  }
  function nativeExit() {
    var native = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
    if (!native) { return; }
    var fn = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;
    if (!fn) { return; }
    try { var p = fn.call(document); if (p && p.catch) { p.catch(function () {}); } } catch (e) {}
  }
  function isOn() { return document.body.classList.contains("pqlgb-fullscreen-on"); }
  function setOn(on) {
    document.body.classList.toggle("pqlgb-fullscreen-on", on);
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    btn.title = on ? "Show the full board again" : "Show only the student monitoring data";
    if (icon) { icon.innerHTML = on ? ICON_MINIMIZE : ICON_MAXIMIZE; }
    if (label) { label.textContent = on ? "Exit fullscreen" : "Fullscreen"; }
  }

  btn.addEventListener("click", function () {
    if (isOn()) { setOn(false); nativeExit(); } else { setOn(true); nativeRequest(); }
  });

  // The browser's own Esc handling (or a viewer leaving fullscreen through
  // window chrome this page does not control) exits NATIVE fullscreen
  // without ever touching our class, so the class has to follow the
  // browser's reported state rather than only our own click handler.
  ["fullscreenchange", "webkitfullscreenchange", "mozfullscreenchange", "MSFullscreenChange"].forEach(function (evt) {
    document.addEventListener(evt, function () {
      var native = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
      if (!native && isOn()) { setOn(false); }
    });
  });

  // And Escape has to leave DECLUTTER mode even where native fullscreen
  // never engaged in the first place -- the fullscreenchange listener above
  // only fires when there was a native fullscreen element to leave.
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && isOn()) { setOn(false); nativeExit(); }
  });
})();
</script>
<?php
echo $OUTPUT->footer();
