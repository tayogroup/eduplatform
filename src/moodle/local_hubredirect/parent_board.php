<?php
declare(strict_types=1);

// Parent board — the family's version of the live group board.
//
// The teacher's board answers "who do I go to next" across two groups of nine.
// A parent's question is smaller and different: how are MY children doing, and
// can I say something to their teacher. So this is the board's shape with the
// board's own numbers, narrowed to one family, with the parent-teacher chat
// where the class chat sits.
//
// ONE RENDERER, IN JS, SEEDED WITH INLINE JSON — the group board's rule, for
// the group board's reason: painting the first frame in PHP and refreshing it
// in JavaScript is two renderers for one board, and the drift shows up as a
// tile that changes shape the moment it refreshes. A no-JS visitor is told the
// page needs JS rather than shown a frozen frame with nothing to say so.
//
// It exists partly because the chat had nowhere a parent could find it. It was
// added to the dashboard and to the parent Workspace and still was not seen;
// a page of its own, with its own rail entry, is a route rather than a card
// somebody has to scroll to.

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/parent_boardlib.php');

$requestedworkspaceid = optional_param('workspaceid', 0, PARAM_INT);
$consumercontext = pqh_requested_consumer_context();
if ($requestedworkspaceid <= 0 && (int)($consumercontext->workspaceid ?? 0) > 0) {
    $requestedworkspaceid = (int)$consumercontext->workspaceid;
}
$workspaceid = pqh_current_workspace_id((int)$USER->id, $requestedworkspaceid);

// A GUARDIAN IS PROVED BY HAVING CHILDREN, not by a workspace role. A parent
// account can sit in a workspace with any label, and the only thing that makes
// this page meaningful is a link to a child — which is also exactly what
// authorises every tile on it. An administrator may look, because they can
// already read every one of these facts on the teacher's board.
$children = pqpb_parent_children((int)$USER->id);
$canmanage = $workspaceid > 0 && pqh_user_can_manage_workspace((int)$USER->id, $workspaceid);
if (!$children && !$canmanage) {
    pqh_access_denied(
        'The parent board is for a guardian with a child at the school.',
        new moodle_url('/local/hubredirect/dashboard.php'),
        'Parent access required'
    );
}
if ($workspaceid > 0) {
    pqh_enforce_role_domain($consumercontext, $workspaceid, (int)$USER->id);
}

$navparams = $workspaceid > 0 ? ['workspaceid' => $workspaceid] : [];
if (!empty($consumercontext->consumerslug)) {
    $navparams['consumer'] = (string)$consumercontext->consumerslug;
}
$urlparams = $navparams;

$board = pqpb_build((int)$USER->id);
$board['sesskey'] = sesskey();

$dataurl = new moodle_url('/local/hubredirect/parent_board_data.php', $navparams + ['sesskey' => sesskey()]);
$chaturl = new moodle_url('/local/hubredirect/parent_teacher_chat.php');

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/parent_board.php', $urlparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Parent board');
$PAGE->set_heading('Parent board');
$PAGE->add_body_class('pqpb-page');

echo $OUTPUT->header();
?>
<style><?php echo pqh_openproject_skin_css('pqpb', 'pqpb-page'); ?></style>
<style>
<?php // THE SAME COMPONENTS THE TEACHER'S BOARD WEARS, not a second drawing of
      // them. Totals, tiles, pills, flags, the chat column and the page chrome
      // all come from one function now (accesslib :: pqh_ehel_board_components_css),
      // which was inline in live_group_board.php and therefore unreachable from
      // here. This page used to hand-roll approximations of every one of them
      // underneath 34KB of a re-skin whose component rules all named .pqlgb-*
      // and so matched nothing at all -- it wore the chrome and none of the
      // parts. A parent tile IS a teacher tile now; the two cannot drift, and
      // parent_boardlib's rule about not restating the board's own definitions
      // finally holds for the stylesheet as well as for the numbers. ?>
<?php echo pqh_ehel_board_components_css('pqpb', 'pqpb-page'); ?>
<?php // The handful of things a FAMILY page has and a classroom one does not.
      // Everything else above is shared. ?>
.pqpb-reason em{font-style:normal;font-weight:700;color:var(--op-ink)}
.pqpb-chat-head h3{margin:0;font-size:14px;font-weight:800}
.pqpb-chat-head span{font-size:12px;font-weight:700;color:var(--op-ink-soft)}
<?php echo pqh_design_shell_css('.pqpb-shell'); ?>
.pqpb-shell .pqh-appbar{background:linear-gradient(90deg,#cfe9ff 0%,#e3f4ff 50%,#f2fbff 100%)}
</style>
<?php // Hides the Moodle furniture this page replaces. ?>
<style><?php echo pqh_viewer_chrome_css('.pqpb-shell'); ?></style>
<?php // The dark re-skin over those components. It takes the prefix now, so
      // all 144 of its rules reach this page; until they did, its component
      // half named .pqlgb-* and matched nothing here.
      //
      // The fourth argument is the totals row's ICONS, and it is not
      // decoration: they are applied by :nth-child, so a board that does not
      // emit the teacher's seven rows in the teacher's order inherits the
      // teacher's meanings. This board's first total is its CHILDREN and would
      // otherwise have been given the raised-hand icon. ?>
<style><?php echo pqh_ehel_group_board_css('.pqpb-shell', 'pqpb-page', 'pqpb',
    ['users', 'star', 'calendar', 'clock']); ?></style>
<main class="pqpb-shell">
<?php
echo pqh_design_shell_html('pqpb-shell', 'parentboard', [
    'title' => 'Parent board',
    'appbar' => [
        ['Dashboard', new moodle_url('/local/hubredirect/dashboard.php', $navparams)],
        ['Workspace', new moodle_url('/local/hubredirect/workspace_parent.php', $navparams)],
        ['Back', 'BACK', new moodle_url('/local/hubredirect/dashboard.php', $navparams)],
    ],
    'navitems' => [[
        'label' => 'Parent board',
        'key' => 'parentboard',
        'url' => new moodle_url('/local/hubredirect/parent_board.php', $urlparams),
        'icon' => '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>',
    ]],
]);
?>
<div class="pqpb-wrap">
<div class="pqpb">
  <section class="pqpb-top">
    <div>
      <h1>Parent board</h1>
      <?php // `pqpb-sub` is the SKIN'S own class, not decoration: it emits
            // `.{prefix}-top .{prefix}-sub{color:var(--op-header-ink-soft)}`.
            // Without it this paragraph kept my body-ink grey (#707070) on the
            // header's dark ground and was very nearly invisible. ?>
      <p class="pqpb-sub">Where your children are, what they finished this week, and a line to their teacher — on one page.</p>
    </div>
  </section>
  <noscript>
    <div class="pqpb-noscript">This board refreshes itself and needs JavaScript. Without it the tiles would freeze with nothing to tell you they had, so they are not shown.</div>
  </noscript>

  <div class="pqpb-totals" id="pqpb-totals"></div>
  <div class="pqpb-cols">
    <div class="pqpb-main" id="pqpb-children"></div>
    <aside class="pqpb-chat">
      <div class="pqpb-chat-head">
        <h3>Message the teacher</h3>
        <span id="pqpb-chat-who"></span>
      </div>
      <div class="pqpb-chat-msgs" id="pqpb-chat-msgs"></div>
      <form class="pqpb-chat-form" id="pqpb-form" autocomplete="off">
        <input id="pqpb-body" maxlength="2000" placeholder="Write a message&hellip;" aria-label="Message the teacher">
        <button type="submit">Send</button>
      </form>
    </aside>
  </div>

  <div class="pqpb-note">
    <b>What these say.</b> <b>Quiet for</b> is time since your child's app last reported anything — it is not a
    measure of effort, only of when the app last heard from them. <b>Finished this week</b> counts sections and
    quizzes completed since Monday; it reads <b>at least N</b> where counting began mid-week, and
    <b>not counted yet</b> where there is nothing to count from — a zero there would be a claim about a week
    nobody measured. <b>Words known</b> are words your child picked correctly for a sound or a picture; there is
    no target, it only grows. Anything your child wrote when they stopped a lesson early is shown in their own
    words.
  </div>
</div>
</div>
</main>
<script>
(function () {
  "use strict";
  /* ONE RENDERER, seeded with the JSON below and used for every frame
     including the first — the group board's rule. Two renderers for one board
     drift, and the drift shows as a tile that changes shape when it refreshes. */
  var board = <?php echo json_encode($board, JSON_UNESCAPED_SLASHES); ?>;
  var DATA_URL = <?php echo json_encode($dataurl->out(false)); ?>;
  var CHAT_URL = <?php echo json_encode($chaturl->out(false)); ?>;
  var WORKSPACE = <?php echo (int)$workspaceid; ?>;
  var skew = Math.floor(Date.now() / 1000) - (board.generated || 0);
  function serverNow() { return Math.floor(Date.now() / 1000) - skew; }

  function esc(t) {
    return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  /* Recomputed each second from the SERVER's own stamp, never from a second
     clock of our own — the rule the Wehel timer and the group board share. */
  function gap(seconds) {
    var s = Math.max(0, seconds | 0);
    if (s < 60) { return "&lt;1 min"; }
    var m = Math.floor(s / 60);
    if (m < 60) { return m + " min"; }
    var h = Math.floor(m / 60);
    return h + "h" + ("0" + (m % 60)).slice(-2);
  }
  function hm(mins) {
    var m = Math.max(0, mins | 0);
    return m < 60 ? m + " min" : Math.floor(m / 60) + "h" + ("0" + (m % 60)).slice(-2);
  }

  function tile(c) {
    var quiet = c.lastprogress ? Math.max(0, serverNow() - c.lastprogress) : 0;
    var place = [];
    if (c.subject) { place.push(['<span class="pqpb-pl pqpb-pl--course">' + esc(c.subject) + "</span>"]); }
    if (c.stage) { place.push(['<span class="pqpb-pl pqpb-pl--course">' + esc(c.stage) + "</span>"]); }
    /* "l03" is a standalone lesson build's Lesson 3 - it used to print as a raw
       "l03", which names nothing on the child's own screen */
    if (c.unit) { place.push(['<span class="pqpb-pl pqpb-pl--course">' + esc(String(c.unit).replace(/^u0?/, "Unit ").replace(/^l0*(\d+)$/, "Lesson $1")) + "</span>"]); }
    if (c.resumelabel) {
      /* The learner's OWN caption, never the route id: a surface printing
         `dictionary` names a section the family cannot find. */
      place.push(['<span class="pqpb-pl pqpb-pl--pos">' + esc((c.resumedone ? "finished " : "in ") + c.resumelabel)
        + (c.activity ? " &middot; " + c.activity.answered + " of " + c.activity.total : "") + "</span>"]);
    }
    if (c.sectionsdone) { place.push(['<span class="pqpb-pl pqpb-pl--done">' + c.sectionsdone + " done</span>"]); }
    if (c.knownwords) { place.push(['<span class="pqpb-pl pqpb-pl--words">' + c.knownwords + " words known</span>"]); }

    var flags = [];
    /* FOUR CLAIMS, and the wording has to match which one is held. A zero
       where nothing was measured tells a parent their child did nothing on
       the strength of data that does not exist. */
    if (!c.weekcounted) {
      flags.push('<span class="pqpb-flag pqpb-flag--cycle">not counted yet</span>');
    } else if (c.weekdone > 0) {
      flags.push('<span class="pqpb-flag pqpb-flag--ok">' + (c.weekcovered ? "" : "at least ")
        + c.weekdone + " finished this week</span>");
    } else {
      flags.push('<span class="pqpb-flag pqpb-flag--cycle">nothing yet this week</span>');
    }
    if (!c.daycounted) {
      flags.push('<span class="pqpb-flag pqpb-flag--cycle">today not counted yet</span>');
    } else if (c.minutestoday > 0) {
      flags.push('<span class="pqpb-flag pqpb-flag--time">' + hm(c.minutestoday) + " today</span>");
    }
    if (c.checkscount > 1) {
      flags.push('<span class="pqpb-flag pqpb-flag--cycle">' + c.checkscount + " checks &middot; avg " + c.checksavg + "%</span>");
    } else if (c.checkpoint) {
      flags.push('<span class="pqpb-flag pqpb-flag--' + (c.checkpoint.passed ? "ok" : "bad") + '">'
        + esc(c.checkpoint.section) + " " + c.checkpoint.score + "%</span>");
    }

    var notes = (c.leaving || []).slice(0, 2).map(function (n) {
      return '<div class="pqpb-reason">&ldquo;' + esc(n.reason) + "&rdquo;</div>";
    }).join("");

    return '<article class="pqpb-tile pqpb-tile--' + esc(c.state) + '">'
      + '<span class="pqpb-avatar">' + esc(c.initials) + "</span>"
      + '<div class="pqpb-who"><b>' + esc(c.name) + "</b>"
      + '<div class="pqpb-where">' + (place.length ? place.join("") : '<span class="pqpb-pl">No app activity recorded</span>') + "</div>"
      + '<div class="pqpb-flags">' + flags.join("") + "</div>"
      + notes
      + "</div>"
      + '<div class="pqpb-quiet">'
      + (c.lastprogress ? "<b>" + gap(quiet) + "</b><span>quiet for</span>" : "<b>&mdash;</b><span>not started</span>")
      + "</div></article>";
  }

  function paint() {
    var t = board.totals || {};
    document.getElementById("pqpb-totals").innerHTML = [
      ["children", t.children || 0, (t.children === 1 ? "Child" : "Children")],
      ["working", t.working || 0, "Working now"],
      ["weekdone", t.weekdone || 0, "Finished this week"],
      ["minutes", hm(t.minutes || 0), "Learning today"],
    ].map(function (row) {
      return '<div class="pqpb-total"><b>' + esc(String(row[1])) + "</b><span>" + esc(row[2]) + "</span></div>";
    }).join("");

    var list = board.children || [];
    // The teacher board's own card shape -- a titled group with the tiles
    // inside it -- rather than bare tiles on the page background. Same
    // markup, so the same rules paint it.
    document.getElementById("pqpb-children").innerHTML =
      '<section class="pqpb-group"><div class="pqpb-group-head"><h3>Your children</h3>'
      + '<span>' + (list.length === 1 ? "1 child" : list.length + " children") + '</span></div>'
      + '<div class="pqpb-tiles">'
      + (list.length ? list.map(tile).join("")
          : '<div class="pqpb-empty">No children are linked to your account yet. The school links them when your place is confirmed.</div>')
      + '</div></section>';

    var who = document.getElementById("pqpb-chat-who");
    who.textContent = list.length ? "about " + list[0].name : "";
  }

  /* --- the chat, exactly the panel used everywhere else ----------------- */
  var chatChild = 0, since = 0, busy = false, chatTimer = null;
  var log = document.getElementById("pqpb-chat-msgs");
  var form = document.getElementById("pqpb-form");
  var box = document.getElementById("pqpb-body");

  function line(m) {
    var when = new Date((Number(m.at) || 0) * 1000);
    var clock = when.getFullYear() > 1971
      ? when.toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
      : "";
    return '<div class="pqpb-chat-msg ' + (m.mine ? "is-mine" : "is-theirs") + '">'
      + "<b>" + esc(m.who) + "</b>" + esc(m.body)
      + (clock ? "<i>" + esc(clock) + "</i>" : "") + "</div>";
  }

  function exchange(body) {
    if (busy || !chatChild) { return Promise.resolve(false); }
    busy = true;
    var p = new URLSearchParams();
    p.set("sesskey", board.sesskey);
    p.set("studentid", String(chatChild));
    p.set("workspaceid", String(WORKSPACE));
    p.set("since", String(since));
    p.set("body", body || "");
    return fetch(CHAT_URL, { method: "POST", credentials: "same-origin",
      headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" }, body: p.toString() })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res || !res.ok) { throw new Error((res && res.message) || "Not available."); }
        /* APPENDED, never redrawn: the server sends what is new since the last
           id, so a redraw would lose the reader's scroll position. */
        if (res.messages && res.messages.length) {
          var atBottom = log.scrollHeight - log.scrollTop - log.clientHeight < 40;
          log.insertAdjacentHTML("beforeend", res.messages.map(line).join(""));
          if (atBottom) { log.scrollTop = log.scrollHeight; }
        } else if (!log.children.length) {
          log.innerHTML = '<div class="pqpb-chat-empty">No messages yet. Write the first one.</div>';
        }
        since = Math.max(since, Number(res.lastmessageid) || 0);
        return true;
      })
      .catch(function (e) {
        /* A failed poll is not worth interrupting a parent for; a failed SEND
           is, because they are waiting to see their own words appear. */
        if (body) { window.alert("Could not send: " + e.message); }
        return false;
      })
      .then(function (ok) { busy = false; return ok; });
  }

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var body = box.value.trim();
    if (!body) { return; }
    var btn = form.querySelector("button");
    btn.disabled = true;
    box.value = "";
    exchange(body).then(function (ok) {
      if (!ok) { box.value = body; }
      btn.disabled = false;
      box.focus();
    });
  });

  /* --- refresh ---------------------------------------------------------- */
  var boardTimer = null;
  function refreshBoard() {
    fetch(DATA_URL, { credentials: "same-origin" })
      .then(function (r) { return r.json(); })
      .then(function (next) {
        if (!next || !next.ok) { return; }
        next.sesskey = board.sesskey;
        board = next;
        skew = Math.floor(Date.now() / 1000) - (board.generated || 0);
        paint();
      })
      .catch(function () { /* a failed refresh keeps the last good frame */ });
  }
  /* NOTHING RUNS WHILE THE TAB IS HIDDEN. A parent leaves this open; a timer
     that ignores that turns one tab into a day of requests. */
  function timers(on) {
    if (boardTimer) { clearInterval(boardTimer); boardTimer = null; }
    if (chatTimer) { clearInterval(chatTimer); chatTimer = null; }
    if (!on) { return; }
    boardTimer = setInterval(refreshBoard, 60000);
    chatTimer = setInterval(function () { exchange(""); }, 8000);
  }
  document.addEventListener("visibilitychange", function () {
    var visible = document.visibilityState === "visible";
    timers(visible);
    if (visible) { refreshBoard(); exchange(""); }
  });
  /* The quiet counters tick locally off the server's own stamp, so they stay
     honest between refreshes without a second clock. */
  setInterval(function () { if (document.visibilityState === "visible") { paint(); } }, 1000);

  paint();
  chatChild = (board.children && board.children.length) ? board.children[0].userid : 0;
  if (chatChild) { exchange(""); } else {
    log.innerHTML = '<div class="pqpb-chat-empty">A conversation opens here once a child is linked to your account.</div>';
    box.disabled = true;
    form.querySelector("button").disabled = true;
  }
  timers(document.visibilityState === "visible");
})();
</script>
<?php
echo $OUTPUT->footer();
