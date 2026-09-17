# -*- coding: utf-8 -*-
"""Render the reviewer pack: 660 author-dependent questions, as a working page.

    python render-reviewer-pack.py <rows.json> <out.html>

The 660 cards are written into the HTML here, not built by script in the
browser, so the document is complete the moment it loads - it reads and prints
with JavaScript switched off, and a reviewer who loses the network keeps the
questions. The script only attaches the verdict buttons and syncs them with the
artifact's shared store.
"""
import hashlib, io, json, os, sys

sys.stdout.reconfigure(encoding="utf-8")
if len(sys.argv) != 3:
    sys.exit("usage: render-reviewer-pack.py <rows.json> <out.html>")
ROWS = json.load(io.open(sys.argv[1], encoding="utf-8"))
OUT = sys.argv[2]

E = [("&", "&amp;"), ("<", "&lt;"), (">", "&gt;"), ('"', "&quot;"), ("'", "&#39;")]


def esc(t):
    for a, b in E:
        t = t.replace(a, b)
    return t


def qid(r):
    """Stable per QUESTION, not per position: a reordered pack keeps every
    verdict, and an EDITED question loses its verdict, which is correct -
    a changed key has not been reviewed."""
    key = next((o["t"] for o in r["opts"] if o["k"]), "")
    raw = "%d|%s|%s|%s" % (r["stage"], r["file"], r["ask"], key)
    return hashlib.sha1(raw.encode("utf-8")).hexdigest()[:12]


# ---- group: stage -> lesson (in the order a child meets them) ---------------
stages = {}
for r in ROWS:
    stages.setdefault(r["stage"], {}).setdefault((r["file"], r["lesson"], r["live"]), []).append(r)

seen = set()
for st in stages:
    for k in stages[st]:
        for r in stages[st][k]:
            i = qid(r)
            if i in seen:
                # two questions identical in stage, file, stem and key: one
                # verdict genuinely covers both, so they share an id.
                r["_dup"] = True
            seen.add(i)
            r["_id"] = i

TOTAL = len(ROWS)
SCREEN = sum(1 for r in ROWS if r["screen"])
GEN = sum(1 for r in ROWS if r["generated"])

# ---------------------------------------------------------------- the page --
P = []
w = P.append

w("<title>Maths Answer-Key Review</title>")
w('<link rel="preconnect" href="https://fonts.googleapis.com">')
w('<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>')
w('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?'
  'family=Source+Sans+3:wght@400;600;700&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600'
  '&display=swap">')
w("""<style>
  :root{
    --ground:#FAF9F6; --card:#FFFFFF; --ink:#22201D; --muted:#6B655D;
    --rule:#E5E1D8; --soft:#F2EFE8; --raise:#FFFFFF;
    --accent:#40567A; --accent-soft:#E8EDF5;
    --ok:#2F6F4A; --ok-soft:#E6F1EA;
    --bad:#A3392C; --bad-soft:#F8E9E6;
    --hmm:#8A6216; --hmm-soft:#F7EFDD;
    --sans:"Source Sans 3",-apple-system,"Segoe UI",Roboto,sans-serif;
    --serif:"Source Serif 4",Georgia,"Times New Roman",serif;
  }
  @media (prefers-color-scheme:dark){ :root:not([data-theme="light"]){
    --ground:#16181A; --card:#1E2124; --ink:#E9EAEC; --muted:#9BA0A6;
    --rule:#31353A; --soft:#24282C; --raise:#262A2E;
    --accent:#8FA9D4; --accent-soft:#1E2733;
    --ok:#7CC49A; --ok-soft:#18271F;
    --bad:#E2907F; --bad-soft:#2A1B18;
    --hmm:#D8B166; --hmm-soft:#282114;
  }}
  :root[data-theme="dark"]{
    --ground:#16181A; --card:#1E2124; --ink:#E9EAEC; --muted:#9BA0A6;
    --rule:#31353A; --soft:#24282C; --raise:#262A2E;
    --accent:#8FA9D4; --accent-soft:#1E2733;
    --ok:#7CC49A; --ok-soft:#18271F;
    --bad:#E2907F; --bad-soft:#2A1B18;
    --hmm:#D8B166; --hmm-soft:#282114;
  }
  *{box-sizing:border-box}
  body{margin:0;background:var(--ground);color:var(--ink);font-family:var(--sans);
    font-size:16px;line-height:1.55}
  .wrap{max-width:900px;margin:0 auto;padding:34px 20px 120px}
  a{color:var(--accent)}
  :focus-visible{outline:2px solid var(--accent);outline-offset:2px}

  .eyebrow{font-size:11.5px;letter-spacing:.14em;text-transform:uppercase;
    color:var(--muted);font-weight:700;margin:0 0 10px}
  h1{font-family:var(--serif);font-size:clamp(28px,4.4vw,40px);line-height:1.1;
    font-weight:600;margin:0 0 12px;letter-spacing:-.01em;text-wrap:balance}
  .lede{font-family:var(--serif);font-size:18px;line-height:1.6;color:var(--muted);
    max-width:62ch;margin:0 0 22px}

  .brief{border:1px solid var(--rule);border-radius:4px;background:var(--card);
    padding:18px 20px;margin:0 0 18px}
  .brief h2{font-size:15px;font-weight:700;margin:0 0 10px;font-family:var(--sans)}
  .brief p{margin:0 0 10px;font-size:14.5px;max-width:68ch}
  .brief p:last-child{margin:0}
  .brief b{font-weight:700}
  .warn{border-left:3px solid var(--hmm);background:var(--hmm-soft);
    padding:14px 16px;border-radius:0 4px 4px 0;margin:14px 0 0}
  .warn p{margin:0;font-size:14.5px}

  .bar{position:sticky;top:0;z-index:20;background:var(--ground);
    border-bottom:1px solid var(--rule);padding:12px 0 10px;margin:0 0 20px}
  .meter{height:7px;border-radius:4px;background:var(--soft);overflow:hidden;
    display:flex;margin:0 0 9px}
  .meter i{display:block;height:100%}
  .meter .m-ok{background:var(--ok)} .meter .m-bad{background:var(--bad)}
  .meter .m-hmm{background:var(--hmm)}
  .tally{display:flex;flex-wrap:wrap;gap:6px 14px;font-size:13px;color:var(--muted);
    font-variant-numeric:tabular-nums;align-items:center}
  .tally b{color:var(--ink);font-weight:700}
  .filters{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0 0}
  .filters button{font:inherit;font-size:12.5px;font-weight:600;padding:5px 11px;
    border-radius:999px;border:1px solid var(--rule);background:var(--card);
    color:var(--muted);cursor:pointer}
  .filters button[aria-pressed="true"]{background:var(--accent-soft);
    border-color:var(--accent);color:var(--accent)}

  h2.stage{font-family:var(--serif);font-size:24px;font-weight:600;
    margin:36px 0 4px;letter-spacing:-.01em}
  h2.stage span{display:block;font-family:var(--sans);font-size:13px;
    font-weight:400;color:var(--muted);letter-spacing:0}
  h3.lesson{font-size:15px;font-weight:700;margin:26px 0 10px;
    padding:9px 12px;background:var(--soft);border-radius:4px;
    display:flex;flex-wrap:wrap;gap:8px;align-items:baseline}
  h3.lesson span.n{font-weight:400;color:var(--muted);font-size:13px;
    font-variant-numeric:tabular-nums}
  h3.lesson a{margin-left:auto;font-size:12.5px;font-weight:600}

  article.q{position:relative;border:1px solid var(--rule);border-radius:4px;
    background:var(--card);margin:0 0 10px;padding:14px 16px 12px 19px;
    scroll-margin-top:150px}
  article.q::before{content:"";position:absolute;left:0;top:0;bottom:0;width:4px;
    border-radius:4px 0 0 4px;background:var(--rule)}
  article.q[data-v="ok"]::before{background:var(--ok)}
  article.q[data-v="bad"]::before{background:var(--bad)}
  article.q[data-v="hmm"]::before{background:var(--hmm)}
  article.q[hidden]{display:none}
  .qmeta{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:0 0 8px}
  .num{font-size:12px;font-weight:700;color:var(--muted);
    font-variant-numeric:tabular-nums}
  .tag{font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;
    padding:2px 7px;border-radius:3px;background:var(--soft);color:var(--muted)}
  .tag.screen{background:var(--hmm-soft);color:var(--hmm)}
  .tag.gen{background:var(--accent-soft);color:var(--accent)}
  .ask{font-family:var(--serif);font-size:17px;line-height:1.45;margin:0 0 9px}
  ul.opts{list-style:none;margin:0 0 9px;padding:0;display:flex;
    flex-wrap:wrap;gap:6px}
  ul.opts li{font-size:14px;padding:4px 10px;border-radius:3px;
    background:var(--soft);color:var(--muted)}
  ul.opts li.k{background:var(--ok-soft);color:var(--ok);font-weight:700}
  ul.opts li.k::before{content:"\\2713 ";font-weight:700}
  .why{font-size:14px;margin:0;color:var(--ink);padding:9px 11px;
    background:var(--soft);border-radius:3px}
  .why b{color:var(--muted);font-weight:700;font-size:12px;
    text-transform:uppercase;letter-spacing:.04em;display:block;margin:0 0 3px}
  .acts{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0 0;align-items:center}
  .acts button{font:inherit;font-size:13px;font-weight:600;padding:5px 12px;
    border-radius:3px;border:1px solid var(--rule);background:var(--card);
    color:var(--muted);cursor:pointer}
  .acts button:hover{border-color:var(--accent)}
  .acts button[aria-pressed="true"][data-v="ok"]{background:var(--ok-soft);
    border-color:var(--ok);color:var(--ok)}
  .acts button[aria-pressed="true"][data-v="bad"]{background:var(--bad-soft);
    border-color:var(--bad);color:var(--bad)}
  .acts button[aria-pressed="true"][data-v="hmm"]{background:var(--hmm-soft);
    border-color:var(--hmm);color:var(--hmm)}
  .acts input{flex:1 1 220px;min-width:0;font:inherit;font-size:13.5px;
    padding:5px 9px;border-radius:3px;border:1px solid var(--rule);
    background:var(--ground);color:var(--ink)}
  .who{font-size:11.5px;color:var(--muted);margin-left:auto}

  footer{margin:48px 0 0;padding:16px 0 0;border-top:1px solid var(--rule);
    font-size:13px;color:var(--muted)}
  footer p{margin:0 0 7px;max-width:74ch}
  @media print{
    .bar,.acts,.filters{display:none}
    article.q{break-inside:avoid;border-color:#ccc}
    body{background:#fff}
  }
</style>""")

w('<div class="wrap">')
w('<p class="eyebrow">Cambridge Primary Mathematics 0096 &middot; Stages 1 and 2</p>')
w("<h1>The questions no machine has checked</h1>")
w('<p class="lede">%d questions from the Grade&nbsp;1 and Grade&nbsp;2 lesson apps whose '
  'answers rest entirely on the person who wrote them. They need a reader who did not '
  'write them &mdash; which is you.</p>' % TOTAL)

w('<div class="brief">')
w("<h2>What you are being asked to do</h2>")
w("<p>For each question below, decide one thing: <b>is the ticked answer right, and does "
  "the explanation underneath it actually explain why?</b> Both were written by the same "
  "person in the same minute, so they agree with each other whether or not they are "
  "correct. That is precisely what a second reader can see and the author cannot.</p>")
w("<p>Mark each one <b>Right</b>, <b>Looks wrong</b>, or <b>Can&rsquo;t tell</b>. If it is "
  "not right, please say why in the note box &mdash; one line is plenty. Your marks save "
  "as you go, so you can stop and come back.</p>")
w("<p>The questions a computer could already check by arithmetic have been left out on "
  "purpose. These %d are the ones where nothing but a human reading has ever stood "
  "between a mistake and a child.</p>" % TOTAL)
w('<div class="warn"><p><b>Some questions are about something drawn on the screen</b> '
  '&mdash; a shape, a clock face, coins on a table. The words alone cannot tell you '
  'whether the answer is right. %d are tagged <b>needs the screen</b>, but that tag is a '
  'hint and not a promise: it is guessed from the wording, so it will miss some. Every '
  'lesson heading links to the live lesson &mdash; open it whenever the words are not '
  'enough, and use <b>Can&rsquo;t tell</b> freely. &ldquo;I could not judge this from the '
  'page&rdquo; is a useful finding, not a failure.</p></div>' % SCREEN)
w("</div>")

w('<div class="bar">')
w('<div class="meter" id="meter"><i class="m-ok" id="mOk" style="width:0"></i>'
  '<i class="m-bad" id="mBad" style="width:0"></i><i class="m-hmm" id="mHmm" style="width:0"></i></div>')
w('<div class="tally"><span><b id="tDone">0</b> of <b>%d</b> reviewed</span>'
  '<span><b id="tOk">0</b> right</span><span><b id="tBad">0</b> look wrong</span>'
  '<span><b id="tHmm">0</b> can&rsquo;t tell</span>'
  '<span id="saveState" class="who"></span></div>' % TOTAL)
w('<div class="filters">'
  '<button type="button" data-f="all" aria-pressed="true">Everything</button>'
  '<button type="button" data-f="todo" aria-pressed="false">Not yet reviewed</button>'
  '<button type="button" data-f="bad" aria-pressed="false">Looks wrong</button>'
  '<button type="button" data-f="hmm" aria-pressed="false">Can&rsquo;t tell</button>'
  '<button type="button" data-f="screen" aria-pressed="false">Needs the screen</button>'
  '<button type="button" data-f="s1" aria-pressed="false">Stage 1</button>'
  '<button type="button" data-f="s2" aria-pressed="false">Stage 2</button>'
  '</div>')
w("</div>")

n = 0
for stage in sorted(stages):
    lessons = stages[stage]
    cnt = sum(len(v) for v in lessons.values())
    w('<h2 class="stage">Stage %d &mdash; Grade %d Maths<span>%d questions across %d lessons</span></h2>'
      % (stage, stage, cnt, len(lessons)))
    for (f, lesson, live), rows in lessons.items():
        w('<h3 class="lesson">%s <span class="n">%d question%s</span>'
          '<a href="%s" target="_blank" rel="noopener">Open the live lesson &rarr;</a></h3>'
          % (esc(lesson), len(rows), "" if len(rows) == 1 else "s", esc(live)))
        for r in rows:
            n += 1
            tags = []
            if r["step"]:
                tags.append('<span class="tag">%s</span>' % esc(r["step"]))
            if r["screen"]:
                tags.append('<span class="tag screen">needs the screen</span>')
            if r["generated"]:
                tags.append('<span class="tag gen">made fresh each time</span>')
            w('<article class="q" id="q%s" data-id="%s" data-stage="%d" data-screen="%d">'
              % (r["_id"], r["_id"], stage, 1 if r["screen"] else 0))
            w('<div class="qmeta"><span class="num">%d</span>%s</div>' % (n, "".join(tags)))
            w('<p class="ask">%s</p>' % esc(r["ask"]))
            if r["opts"]:
                w('<ul class="opts">%s</ul>' % "".join(
                    '<li class="%s">%s</li>' % ("k" if o["k"] else "", esc(o["t"]))
                    for o in r["opts"]))
            w('<p class="why"><b>What the child is told</b>%s</p>' % esc(r["why"]))
            w('<div class="acts">'
              '<button type="button" class="v" data-v="ok" aria-pressed="false">Right</button>'
              '<button type="button" class="v" data-v="bad" aria-pressed="false">Looks wrong</button>'
              '<button type="button" class="v" data-v="hmm" aria-pressed="false">Can&rsquo;t tell</button>'
              '<input type="text" class="note" placeholder="What is wrong with it?" '
              'aria-label="Note on this question">'
              '<span class="who"></span></div>')
            w("</article>")

w("<footer>")
w("<p><b>Where these came from.</b> Every question in the Grade&nbsp;1 and Grade&nbsp;2 "
  "maths lesson apps was put through a checker that recomputes the answer where it can. "
  "It verified 141 of 600 at Stage&nbsp;2 and 176 of 489 at Stage&nbsp;1, and found none "
  "wrong. These %d are the remainder &mdash; the ones it could not derive, so nobody but "
  "the author has ever checked them.</p>" % TOTAL)
w("<p>%d are tagged as needing the screen. %d are generated fresh on each visit, so the "
  "one shown here is an example of its kind rather than a fixed question.</p>" % (SCREEN, GEN))
w("</footer>")
w("</div>")

w('<script type="application/json" id="seed">%s</script>'
  % json.dumps({"total": TOTAL}, ensure_ascii=False))

w("""<script>
(function () {
  "use strict";
  var cards = Array.prototype.slice.call(document.querySelectorAll("article.q"));
  var byId = {};
  cards.forEach(function (c) { byId[c.dataset.id] = c; });
  var state = {};                        // id -> {v, note, by}
  var db = null, me = null, saving = 0;
  var el = function (id) { return document.getElementById(id); };

  /* ---- paint ------------------------------------------------------------ */
  function paintCard(c) {
    var s = state[c.dataset.id];
    var v = s && s.v ? s.v : "";
    c.dataset.v = v;
    c.querySelectorAll("button.v").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.v === v));
    });
    var note = c.querySelector("input.note");
    if (document.activeElement !== note) { note.value = (s && s.note) || ""; }
    c.querySelector(".who").textContent = (s && s.byName) ? s.byName : "";
  }
  function tally() {
    var n = { ok: 0, bad: 0, hmm: 0 };
    Object.keys(state).forEach(function (k) {
      if (byId[k] && state[k] && n.hasOwnProperty(state[k].v)) { n[state[k].v]++; }
    });
    var total = cards.length, done = n.ok + n.bad + n.hmm;
    el("tDone").textContent = done; el("tOk").textContent = n.ok;
    el("tBad").textContent = n.bad; el("tHmm").textContent = n.hmm;
    el("mOk").style.width = (100 * n.ok / total) + "%";
    el("mBad").style.width = (100 * n.bad / total) + "%";
    el("mHmm").style.width = (100 * n.hmm / total) + "%";
  }
  function paintAll() { cards.forEach(paintCard); tally(); applyFilter(); }

  /* ---- filter ----------------------------------------------------------- */
  var filter = "all";
  function applyFilter() {
    cards.forEach(function (c) {
      var v = c.dataset.v || "", show = true;
      if (filter === "todo")   { show = !v; }
      else if (filter === "bad")  { show = v === "bad"; }
      else if (filter === "hmm")  { show = v === "hmm"; }
      else if (filter === "screen") { show = c.dataset.screen === "1"; }
      else if (filter === "s1") { show = c.dataset.stage === "1"; }
      else if (filter === "s2") { show = c.dataset.stage === "2"; }
      c.hidden = !show;
    });
    // a lesson heading with nothing under it is noise
    document.querySelectorAll("h3.lesson").forEach(function (h) {
      var any = false, s = h.nextElementSibling;
      while (s && s.tagName === "ARTICLE") { if (!s.hidden) { any = true; break; }
        s = s.nextElementSibling; }
      h.hidden = !any;
    });
  }
  document.querySelectorAll(".filters button").forEach(function (b) {
    b.addEventListener("click", function () {
      filter = b.dataset.f;
      document.querySelectorAll(".filters button").forEach(function (o) {
        o.setAttribute("aria-pressed", String(o === b));
      });
      applyFilter();
    });
  });

  /* ---- local fallback, so a reviewer is never blocked ------------------- */
  function loadLocal() {
    try {
      var raw = localStorage.getItem("mathsReview");
      if (raw) { state = JSON.parse(raw) || {}; }
    } catch (e) { /* private window, blocked storage: carry on with nothing */ }
  }
  function saveLocal() {
    try { localStorage.setItem("mathsReview", JSON.stringify(state)); } catch (e) {}
  }

  /* ---- writes ----------------------------------------------------------- */
  function note(msg) { el("saveState").textContent = msg; }
  function push(id) {
    var s = state[id];
    saveLocal();
    if (!db) { note("saved on this device only"); return; }
    saving++; note("saving\\u2026");
    var body = { v: s.v || "", note: s.note || "", at: new Date().toISOString() };
    if (me) { body.by = me; }
    db.collection("verdicts").doc(id).set(body).then(function () {
      saving--; if (!saving) { note("saved"); }
    }, function (e) {
      saving--;
      note(e && e.code === "permission_denied"
        ? "you can read this pack but not save to it \\u2014 marks kept on this device"
        : "could not save \\u2014 marks kept on this device");
    });
  }
  function setVerdict(id, v) {
    var s = state[id] || (state[id] = {});
    s.v = (s.v === v) ? "" : v;
    paintCard(byId[id]); tally(); applyFilter(); push(id);
  }
  cards.forEach(function (c) {
    c.querySelectorAll("button.v").forEach(function (b) {
      b.addEventListener("click", function () { setVerdict(c.dataset.id, b.dataset.v); });
    });
    var inp = c.querySelector("input.note"), t = null;
    inp.addEventListener("input", function () {
      var s = state[c.dataset.id] || (state[c.dataset.id] = {});
      s.note = inp.value;
      clearTimeout(t);
      t = setTimeout(function () { push(c.dataset.id); }, 700);
    });
  });

  loadLocal();
  paintAll();

  /* ---- shared store, when the viewer has one ---------------------------- */
  if (window.claude && window.claude.use) {
    window.claude.use("user").then(function (u) {
      if (!u) { return null; }
      return u.id().then(function (id) { me = id; }, function () {});
    }, function () {}).then(function () {
      return window.claude.use("db");
    }).then(function (d) {
      if (!d) { note("saved on this device only"); return; }
      db = d;
      /* subscribe ONCE, to the whole small collection, and derive the view */
      db.collection("verdicts").onSnapshot(function (snap) {
        snap.docs.forEach(function (doc) {
          if (!byId[doc.id]) { return; }
          var data = doc.data() || {};
          var mine = state[doc.id];
          /* do not stomp a note being typed right now */
          var live = document.activeElement;
          if (live && live.classList && live.classList.contains("note") &&
              live.closest("article.q").dataset.id === doc.id) { return; }
          state[doc.id] = { v: data.v || "", note: data.note || "",
                            byName: (me && data.by && data.by !== me) ? "another reviewer" : "" };
          paintCard(byId[doc.id]);
          if (mine) { /* nothing: snapshot wins, last writer wins by contract */ }
        });
        saveLocal(); tally(); applyFilter();
      }, function () { note("not syncing \\u2014 marks kept on this device"); });
      note("saving to the shared pack");
    }, function () { note("saved on this device only"); });
  } else {
    note("saved on this device only");
  }
})();
</script>""")

html = "\n".join(P)
io.open(OUT, "w", encoding="utf-8", newline="").write(html)
print("  %d questions rendered (stage 1 %d, stage 2 %d)"
      % (TOTAL, sum(len(v) for v in stages[1].values()), sum(len(v) for v in stages[2].values())))
print("  %d tagged as needing the screen, %d generated" % (SCREEN, GEN))
print("  wrote %s (%d bytes)" % (OUT, len(html.encode("utf-8"))))
