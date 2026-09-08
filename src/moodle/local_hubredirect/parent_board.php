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
.pqpb{font-family:var(--op-font);color:var(--op-ink);max-width:1240px;margin:0 auto;padding:4px 0 40px}
.pqpb-top{display:flex;flex-wrap:wrap;gap:14px;align-items:flex-start;padding:18px 18px 16px;margin-bottom:16px;
  background:var(--op-surface);border:1px solid var(--op-line);border-radius:var(--op-radius)}
.pqpb-top h1{margin:0;font-size:26px;font-weight:900;letter-spacing:-.02em}
.pqpb-top p{margin:6px 0 0;font-size:14px;color:var(--op-ink-soft);max-width:64ch}
.pqpb-noscript{padding:12px 14px;margin-bottom:16px;border-radius:var(--op-radius);
  border:1px solid var(--op-line);background:var(--op-surface);font-size:14px}
/* Grid, not wrapping flex: a tile that does not fit would wrap alone and then
   grow to the whole row - the group board's own note, and its own fix. */
.pqpb-totals{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-bottom:18px}
.pqpb-total{padding:11px 14px;background:var(--op-surface);border:1px solid var(--op-line);border-radius:var(--op-radius)}
.pqpb-total b{display:block;font-size:24px;font-weight:900;line-height:1.1;font-variant-numeric:tabular-nums}
.pqpb-total span{display:block;margin-top:2px;font-size:12px;font-weight:700;color:var(--op-ink-soft)}
.pqpb-cols{display:grid;grid-template-columns:minmax(0,1fr) minmax(300px,340px);gap:16px;align-items:start}
@media(max-width:900px){.pqpb-cols{grid-template-columns:minmax(0,1fr)}}
.pqpb-tile{display:flex;gap:12px;padding:13px 14px;margin-bottom:10px;background:var(--op-surface);
  border:1px solid var(--op-line);border-left-width:4px;border-radius:var(--op-radius)}
.pqpb-tile--ok{border-left-color:#2f8f5b}
.pqpb-tile--warn{border-left-color:#b8860b}
.pqpb-tile--alert{border-left-color:#b02a37}
.pqpb-tile--nodata{border-left-color:var(--op-line-strong)}
.pqpb-avatar{flex:none;width:40px;height:40px;border-radius:50%;display:grid;place-items:center;
  background:var(--op-surface-tint);font-weight:900;font-size:14px}
.pqpb-who{flex:1 1 auto;min-width:0}
.pqpb-who b{display:block;font-size:15.5px;font-weight:900}
.pqpb-place{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}
.pqpb-pl{padding:2px 9px;border-radius:999px;border:1px solid var(--op-line);font-size:12px;font-weight:700}
.pqpb-pl--course{background:#edf3fc;border-color:#d5e3f8;color:#17498f}
.pqpb-pl--pos{background:#cff4fc;border-color:#9eeaf9;color:#055160}
.pqpb-pl--done{background:#f7d6e6;border-color:#efadce;color:#801f4f}
.pqpb-pl--words{background:#d2f4ea;border-color:#a6e9d5;color:#114e3d}
.pqpb-flags{display:flex;flex-wrap:wrap;gap:6px;margin-top:7px}
.pqpb-flag{padding:2px 9px;border-radius:999px;border:1px solid var(--op-line);font-size:12px;font-weight:700}
.pqpb-flag--ok{border-color:#a3cfbb;background:#d1e7dd;color:#0a3622}
.pqpb-flag--quiet{border-color:#ced4da;background:#e9ecef;color:#41464b}
.pqpb-flag--time{border-color:#a6e9d5;background:#d2f4ea;color:#114e3d}
.pqpb-flag--bad{border-color:#f1aeb5;background:#f8d7da;color:#58151c}
.pqpb-note{margin-top:8px;padding:7px 10px;border-left:3px solid #f1aeb5;background:var(--op-surface-tint);
  font-size:12.5px;font-style:italic;line-height:1.45}
.pqpb-quiet{flex:none;text-align:right;min-width:74px}
.pqpb-quiet b{display:block;font-size:19px;font-weight:900;font-variant-numeric:tabular-nums}
.pqpb-quiet span{display:block;font-size:11px;font-weight:700;color:var(--op-ink-soft);text-transform:uppercase}
.pqpb-chat{background:var(--op-surface);border:1px solid var(--op-line);border-radius:var(--op-radius);
  position:sticky;top:72px;overflow:hidden}
.pqpb-chat-head{padding:12px 14px;border-bottom:1px solid var(--op-line);background:var(--op-surface-tint);
  display:flex;align-items:baseline;gap:8px}
.pqpb-chat-head h3{margin:0;font-size:15px;font-weight:900}
.pqpb-chat-head span{font-size:12px;font-weight:700;color:var(--op-ink-soft)}
.pqpb-log{max-height:340px;overflow:auto;display:flex;flex-direction:column;gap:8px;padding:12px 14px}
.pqpb-msg{max-width:88%;padding:8px 11px;border-radius:13px;font-size:13.5px;line-height:1.5}
.pqpb-msg--them{align-self:flex-start;background:var(--op-surface-tint)}
.pqpb-msg--me{align-self:flex-end;background:#cfe2ff;color:#052c65}
.pqpb-msg b{display:block;font-size:11px;font-weight:800;opacity:.75}
.pqpb-msg i{display:block;font-size:10.5px;opacity:.65;margin-top:3px;font-style:normal}
.pqpb-compose{display:flex;gap:8px;padding:10px 12px;border-top:1px solid var(--op-line)}
.pqpb-compose input{flex:1 1 auto;min-width:0;padding:8px 12px;border-radius:999px;
  border:1px solid var(--op-line-strong);background:var(--op-surface);color:var(--op-ink);font:inherit;font-size:13.5px}
.pqpb-compose button{border:0;border-radius:999px;padding:8px 16px;background:#0d6efd;color:#fff;
  font:inherit;font-weight:800;font-size:13px;cursor:pointer}
.pqpb-compose button:disabled{opacity:.55;cursor:default}
.pqpb-empty{padding:14px;font-size:13.5px;color:var(--op-ink-soft)}
.pqpb-legend{margin-top:18px;padding:14px 16px;background:var(--op-surface);border:1px solid var(--op-line);
  border-radius:var(--op-radius);font-size:13px;line-height:1.6;color:var(--op-ink-soft)}
.pqpb-wrap{margin:0 auto}
<?php // THE SHELL'S OWN STYLESHEET, and it is not optional: its first rule is
      // {scope}{padding:0 0 54px 248px} — the left padding that clears the
      // FIXED nav rail. Without it the page renders correctly and sits
      // underneath the rail, which is what a formatting fault looks like from
      // the outside. Emitted inside this block exactly as the group board does
      // it, because the function returns raw CSS rather than a <style> tag. ?>
<?php echo pqh_design_shell_css('.pqpb-shell'); ?>
.pqpb-shell .pqh-appbar{background:linear-gradient(90deg,#cfe9ff 0%,#e3f4ff 50%,#f2fbff 100%)}
</style>
<?php // Hides the Moodle furniture this page replaces. ?>
<style><?php echo pqh_viewer_chrome_css('.pqpb-shell'); ?></style>
<?php // 62 of this sheet's rules style the SHARED chrome (.pqh-appbar,
      // .pqh-gnav) and do reach this page; the other 101 name .pqlgb-* and
      // cannot. The tiles below are styled by this file's own rules above —
      // renaming them to .pqlgb-* to inherit the board's would tie a family
      // page to markup built for a different one. ?>
<style><?php echo pqh_ehel_group_board_css('.pqpb-shell', 'pqpb-page'); ?></style>
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
      <p>Where your children are, what they finished this week, and a line to their teacher — on one page.</p>
    </div>
  </section>
  <noscript>
    <div class="pqpb-noscript">This board refreshes itself and needs JavaScript. Without it the tiles would freeze with nothing to tell you they had, so they are not shown.</div>
  </noscript>

  <div class="pqpb-totals" id="pqpb-totals"></div>
  <div class="pqpb-cols">
    <div id="pqpb-children"></div>
    <aside class="pqpb-chat">
      <div class="pqpb-chat-head">
        <h3>Message the teacher</h3>
        <span id="pqpb-chat-who"></span>
      </div>
      <div class="pqpb-log" id="pqpb-log"></div>
      <form class="pqpb-compose" id="pqpb-form" autocomplete="off">
        <input id="pqpb-body" maxlength="2000" placeholder="Write a message&hellip;" aria-label="Message the teacher">
        <button type="submit">Send</button>
      </form>
    </aside>
  </div>

  <div class="pqpb-legend">
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
    if (c.unit) { place.push(['<span class="pqpb-pl pqpb-pl--course">' + esc(String(c.unit).replace(/^u0?/, "Unit ")) + "</span>"]); }
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
      flags.push('<span class="pqpb-flag pqpb-flag--quiet">not counted yet</span>');
    } else if (c.weekdone > 0) {
      flags.push('<span class="pqpb-flag pqpb-flag--ok">' + (c.weekcovered ? "" : "at least ")
        + c.weekdone + " finished this week</span>");
    } else {
      flags.push('<span class="pqpb-flag pqpb-flag--quiet">nothing yet this week</span>');
    }
    if (!c.daycounted) {
      flags.push('<span class="pqpb-flag pqpb-flag--quiet">today not counted yet</span>');
    } else if (c.minutestoday > 0) {
      flags.push('<span class="pqpb-flag pqpb-flag--time">' + hm(c.minutestoday) + " today</span>");
    }
    if (c.checkscount > 1) {
      flags.push('<span class="pqpb-flag pqpb-flag--quiet">' + c.checkscount + " checks &middot; avg " + c.checksavg + "%</span>");
    } else if (c.checkpoint) {
      flags.push('<span class="pqpb-flag pqpb-flag--' + (c.checkpoint.passed ? "ok" : "bad") + '">'
        + esc(c.checkpoint.section) + " " + c.checkpoint.score + "%</span>");
    }

    var notes = (c.leaving || []).slice(0, 2).map(function (n) {
      return '<div class="pqpb-note">&ldquo;' + esc(n.reason) + "&rdquo;</div>";
    }).join("");

    return '<article class="pqpb-tile pqpb-tile--' + esc(c.state) + '">'
      + '<span class="pqpb-avatar">' + esc(c.initials) + "</span>"
      + '<div class="pqpb-who"><b>' + esc(c.name) + "</b>"
      + '<div class="pqpb-place">' + (place.length ? place.join("") : '<span class="pqpb-pl">No app activity recorded</span>') + "</div>"
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
    document.getElementById("pqpb-children").innerHTML = list.length
      ? list.map(tile).join("")
      : '<div class="pqpb-empty">No children are linked to your account yet. The school links them when your place is confirmed.</div>';

    var who = document.getElementById("pqpb-chat-who");
    who.textContent = list.length ? "about " + list[0].name : "";
  }

  /* --- the chat, exactly the panel used everywhere else ----------------- */
  var chatChild = 0, since = 0, busy = false, chatTimer = null;
  var log = document.getElementById("pqpb-log");
  var form = document.getElementById("pqpb-form");
  var box = document.getElementById("pqpb-body");

  function line(m) {
    var when = new Date((Number(m.at) || 0) * 1000);
    var clock = when.getFullYear() > 1971
      ? when.toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
      : "";
    return '<div class="pqpb-msg ' + (m.mine ? "pqpb-msg--me" : "pqpb-msg--them") + '">'
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
          log.innerHTML = '<div class="pqpb-empty">No messages yet. Write the first one.</div>';
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
    log.innerHTML = '<div class="pqpb-empty">A conversation opens here once a child is linked to your account.</div>';
    box.disabled = true;
    form.querySelector("button").disabled = true;
  }
  timers(document.visibilityState === "visible");
})();
</script>
<?php
echo $OUTPUT->footer();
