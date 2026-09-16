# -*- coding: utf-8 -*-
"""Every question in the build, as one page a teacher can read and sign off.

    python build-review-pack.py --out <file.html>        # a file to open locally
    python build-review-pack.py --out <file.html> --artifact
        # the same page with no <!doctype>/<html>/<head>/<body> wrapper, for
        # publishing as an Artifact, which supplies its own skeleton

WHY THIS EXISTS. check-answer-keys.py verifies the keys it can COMPUTE - 152 of
315 as this was written - and reports the rest as unverified rather than
counting them as passes, which is the honest thing to do and leaves 163
questions whose key rests on the author alone. The README has said so since the
build went into git: "a wrong key among them reaches a child in silence... that
needs a human reading, and this build has never had one. English has a
reviewed-scripts workbook process for exactly this and Grade 1 Maths has
nothing equivalent."

This is the missing half. It is not a gate and cannot fail: it lays every
question out - the words a child sees, every option, which one is keyed right,
and the explanation they are given when they answer - with the unverifiable ones
first, because those are the ones a human read is the ONLY check on.

WHAT "VERIFIED" MEANS HERE, and it is a narrower claim than it looks. A question
is marked verified if check-answer-keys.py can derive its answer from the
question and the item's own data. That catches a key bound to the wrong option.
It says nothing about whether the question is well pitched, whether the
explanation teaches, or whether the distractors are the mistakes a child
actually makes. Those need the reader.

THE OBJECTIVE CODE beside each question is resolved the way anatomy.py resolves
a block to its slide - by the element ids the item's own block touches - and
then read off the `<!-- N  1Xx.NN  Title -->` comment annotate-objectives.py
wrote. A question whose block cannot be placed shows no code rather than a
guessed one.

The pack is GENERATED, never hand-kept: re-run it after any content change. It
prints its own count beside check-answer-keys.py's so a divergence between the
two is visible on the page rather than discovered later.

THE TWO COUNTS DO NOT MATCH, AND THAT IS EXPECTED. This pack lists every
question OBJECT; the checker reports a slightly smaller number. The difference
is stems that appear more than once with a different picture each time - five
"Where is the ball?" items in Shapes and Sizes, two asking a cube's faces. For a
reader each of those is a separate thing a child meets and each needs its own
look, so they are all listed here.

It is NOT a hole in the gate, which was the first guess and was wrong: moving
the key on the second copy of a repeated stem is caught. That took three
attempts to establish, because the first two mutations did not change the file
at all and their "survival" read as a gate failure. A mutation that survives is
a claim about the gate AND about the mutation; check the mutation first.
"""
import io, os, re, sys, json, html, subprocess

sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))
G = os.path.join(HERE, "g1v2")
argv = sys.argv[1:]
OUT = argv[argv.index("--out") + 1] if "--out" in argv else os.path.join(HERE, "g1-review-pack.html")
ARTIFACT = "--artifact" in argv

cfg = json.load(io.open(os.path.join(G, "app.config.json"), encoding="utf-8"))
FILES = [l["file"] for l in cfg["lessons"]]
TITLES = {l["file"]: l["title"] for l in cfg["lessons"]}
FW = json.load(io.open(os.path.join(HERE, "..", "..", "..", "..", "curriculum",
                                    "cambridge-mathematics-0096.json"), encoding="utf-8"))
OBJ_TEXT = {o["code"]: o.get("text", "") for o in FW["objectivesByStage"]["1"]}


def plain(s):
    s = re.sub(r"\\u([0-9a-fA-F]{4})", lambda m: chr(int(m.group(1), 16)), str(s))
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]*>", "", s))).strip()


def balanced(s, i):
    o = s[i]; c = {"[": "]", "{": "}"}[o]
    d, j, q = 0, i, None
    while j < len(s):
        ch = s[j]
        if q:
            if ch == "\\":
                j += 2; continue
            if ch == q:
                q = None
        elif ch in "\"'`":
            q = ch
        elif ch == o:
            d += 1
        elif ch == c:
            d -= 1
            if d == 0:
                return s[i:j + 1]
        j += 1
    return s[i:]


def slide_index(s):
    """[(codes, title, ids)] per slide, and the objective comment above it."""
    out = []
    codes_for = {}
    for m in re.finditer(r"<!--\s*(\d+)\s+((?:1[A-Za-z]{2}\.\d{2}[,\s]*)+)\s*([^>]*?)-->", s):
        codes_for[int(m.group(1))] = re.findall(r"1[A-Za-z]{2}\.\d{2}", m.group(2))
    n = 0
    for m in re.finditer(r'<section class="slide"[\s\S]*?</section>', s):
        n += 1
        body = m.group(0)
        h = re.search(r"<h2[^>]*>(.*?)</h2>", body, re.S)
        out.append((codes_for.get(n, []), plain(h.group(1)) if h else "",
                    set(re.findall(r'id="([A-Za-z0-9_-]+)"', body))))
    return out


RE_MARK = re.compile(r"/\* *-{2,} *(?:\d+ *: *)?([^*]*?) *-* *\*/")


def block_spans(s):
    """(start, end, title) for every activity block, in source order."""
    marks = [(m.start(), m.end(), m.group(1).strip()) for m in RE_MARK.finditer(s)]
    out = []
    for i, (st, en, title) in enumerate(marks):
        stop = marks[i + 1][0] if i + 1 < len(marks) else len(s)
        out.append((en, stop, title))
    return out


def placer(s):
    """position -> (step title, objective codes), by the ids the block touches."""
    slides = slide_index(s)
    spans = []
    for st, en, title in block_spans(s):
        code = s[st:en]
        touched = set(re.findall(r'\$\("([A-Za-z0-9_-]+)"\)', code)) | \
            set(re.findall(r'getElementById\("([A-Za-z0-9_-]+)"\)', code))
        best, score = None, 0
        for si, (codes, t, ids) in enumerate(slides):
            ov = len(touched & ids)
            if ov > score:
                best, score = si, ov
        spans.append((st, en, title, best))

    def place(pos):
        for st, en, title, best in spans:
            if st <= pos < en:
                if best is not None:
                    return slides[best][1], slides[best][0]
                return title, []
        return "", []
    return place


# the "How do you know?" bank: claim, the reason that explains it, the two that
# do not, and the hint. A bare array, which is why neither harvester saw it.
REASON = re.compile(
    r'\[\s*\n\s*"((?:[^"\\]|\\.)*)",\s*\n\s*"((?:[^"\\]|\\.)*)",\s*\n\s*\[\s*\n'
    r'\s*"((?:[^"\\]|\\.)*)",\s*\n\s*"((?:[^"\\]|\\.)*)"\s*\n\s*\],\s*\n'
    r'\s*"((?:[^"\\]|\\.)*)"\s*\n\s*\]')

rows = []
for f in FILES:
    s = io.open(os.path.join(G, f), encoding="utf-8").read()
    place = placer(s)
    # shape 1: { q: "...", opts: [...], a: "...", why: "..." }
    for m in re.finditer(r"\{\s*q:\s*\"", s):
        o = balanced(s, m.start())
        q = re.search(r'q:\s*"((?:[^"\\]|\\.)*)"', o)
        a = re.search(r'a:\s*("(?:[^"\\]|\\.)*"|[\w.]+)', o)
        w = re.search(r'why:\s*"((?:[^"\\]|\\.)*)"', o)
        op = re.search(r"opts:\s*\[", o)
        if not (q and a and op):
            continue
        opts = [x for x in re.findall(r'"((?:[^"\\]|\\.)*)"|(\d+)', balanced(o, op.end() - 1))
                for x in [plain(x[0] or x[1])] if x]
        step, codes = place(m.start())
        rows.append(dict(file=f, step=step, codes=codes, q=plain(q.group(1)),
                         key=plain(a.group(1).strip('"')), opts=opts,
                         why=plain(w.group(1)) if w else ""))
    # shape 2: { ask: "...", opts: [{ t: "...", ok: true }], why: "..." }
    for m in re.finditer(r"\{\s*ask:\s*\"", s):
        o = balanced(s, m.start())
        q = re.search(r'ask:\s*"((?:[^"\\]|\\.)*)"', o)
        w = re.search(r'why:\s*"((?:[^"\\]|\\.)*)"', o)
        op = re.search(r"opts:\s*", o)
        if not (q and op):
            continue
        pairs = re.findall(r'\{\s*t:\s*("(?:[^"\\]|\\.)*"|[\w.]+)\s*(,\s*ok:\s*true)?[^}]*\}',
                           o[op.end():])
        opts = [plain(t.strip('"')) for t, _ in pairs]
        key = [plain(t.strip('"')) for t, ok in pairs if ok]
        step, codes = place(m.start())
        rows.append(dict(file=f, step=step, codes=codes, q=plain(q.group(1)),
                         key=key[0] if len(key) == 1 else ("** %d right options **" % len(key)),
                         opts=opts, why=plain(w.group(1)) if w else ""))
    # shape 3: [ "claim", "the reason", [ "not this", "nor this" ], "the hint" ]
    # "How do you know?" - and these were in NO pack and NO gate until 2026-09-16.
    # They have neither `q:` nor `ask:`, so both harvesters above walked straight
    # past all 42 of them, and the read that called itself end-to-end was
    # end-to-end over what this file could see. That is the whole argument for a
    # floor: a harvester that silently stops finding a shape reports a clean run.
    n_reason = 0
    for m in REASON.finditer(s):
        claim, good, b1, b2, hint = [plain(x) for x in m.groups()]
        step, codes = place(m.start())
        rows.append(dict(file=f, step=step or "How do you know?", codes=codes,
                         q=claim, key=good, opts=[good, b1, b2], why=hint,
                         reason=True))
        n_reason += 1
    if n_reason < 6:
        sys.exit("  REFUSED: %s holds %d reasoning items, fewer than the 6 every "
                 "lesson carries - the harvester has stopped seeing them" % (f, n_reason))

# which of them the machine can verify: ask the real tool rather than guess
try:
    r = subprocess.run([sys.executable, os.path.join(HERE, "..", "lesson-app-tools", "check-answer-keys.py"),
                        "--app", G, "--list-unverified"], capture_output=True, text=True,
                       encoding="utf-8", errors="replace")
    out = r.stdout or ""
    unver = set()
    for line in out.splitlines():
        m = re.match(r"\s{3,}(\S+\.html)\s{2,}(.+?)\s*$", line)
        if m:
            unver.add((m.group(1), m.group(2).strip()))
    tot = re.search(r"(\d+) questions, (\d+) verified, (\d+) WRONG", out)
    counts = tot.groups() if tot else ("?", "?", "?")
except Exception:                                        # noqa
    unver, counts = set(), ("?", "?", "?")

for r0 in rows:
    # a reasoning item is unverifiable BY CONSTRUCTION: no rule can decide which
    # of three reasons explains a claim, and check-answer-keys.py cannot even see
    # them, so they would otherwise be listed as if something had checked them.
    r0["unverified"] = r0.get("reason", False) or any(
        f == r0["file"] and r0["q"].startswith(q[:60].strip()) for f, q in unver)

rows.sort(key=lambda r: (not r["unverified"], FILES.index(r["file"])))
nun = len([r for r in rows if r["unverified"]])
esc = lambda t: html.escape(str(t))

STYLE = """
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&display=swap">
<style>
  :root{
    --paper:#FCFDFE; --card:#FFFFFF; --ink:#14212E; --muted:#5C6F80;
    --rule:#DDE6ED; --rule-soft:#EDF2F6;
    --flag:#B3261E; --flag-soft:#FBEDEC; --ok:#1B6B4C; --ok-soft:#EAF4EF;
    --accent:#2B4C8C; --accent-soft:#EAEFF8;
    --serif:"Source Serif 4",Georgia,"Times New Roman",serif;
    --sans:"IBM Plex Sans",-apple-system,Segoe UI,Roboto,sans-serif;
  }
  @media (prefers-color-scheme: dark){
    :root:not([data-theme="light"]){
      --paper:#0E1620; --card:#152130; --ink:#E7EEF5; --muted:#9BAEC0;
      --rule:#25374A; --rule-soft:#1B2836;
      --flag:#F08379; --flag-soft:#2C1917; --ok:#6FCFA4; --ok-soft:#12261F;
      --accent:#9BB8EE; --accent-soft:#182437;
    }
  }
  :root[data-theme="dark"]{
    --paper:#0E1620; --card:#152130; --ink:#E7EEF5; --muted:#9BAEC0;
    --rule:#25374A; --rule-soft:#1B2836;
    --flag:#F08379; --flag-soft:#2C1917; --ok:#6FCFA4; --ok-soft:#12261F;
    --accent:#9BB8EE; --accent-soft:#182437;
  }
  *{box-sizing:border-box}
  body{background:var(--paper);color:var(--ink);font-family:var(--sans);
    font-size:16px;line-height:1.55;margin:0}
  .wrap{max-width:980px;margin:0 auto;padding:34px 22px 90px}
  header h1{font-family:var(--serif);font-weight:600;font-size:clamp(28px,4.2vw,38px);
    line-height:1.15;margin:0 0 8px;text-wrap:balance;letter-spacing:-.01em}
  .lede{margin:0 0 22px;color:var(--muted);max-width:64ch}
  .panel{background:var(--card);border:1px solid var(--rule);border-radius:4px;
    padding:18px 20px;margin:0 0 26px}
  .panel h2{font-size:14px;letter-spacing:.09em;text-transform:uppercase;margin:0 0 10px;
    color:var(--muted);font-weight:600}
  .panel p{margin:0 0 10px;max-width:70ch}
  .panel p:last-child{margin-bottom:0}
  .figs{display:flex;flex-wrap:wrap;gap:26px;margin:0 0 14px;padding:0;list-style:none}
  .figs div{display:flex;flex-direction:column;gap:2px}
  .figs b{font-size:26px;font-weight:600;font-variant-numeric:tabular-nums;line-height:1}
  .figs span{font-size:13px;color:var(--muted)}
  .figs .is-flag b{color:var(--flag)}
  .bar{position:sticky;top:0;z-index:5;background:var(--paper);
    border-bottom:1px solid var(--rule);padding:10px 0 12px;margin:0 0 6px;
    display:flex;flex-wrap:wrap;gap:10px;align-items:center}
  .bar input[type=search],.bar select{font-family:var(--sans);font-size:14px;color:var(--ink);
    background:var(--card);border:1px solid var(--rule);border-radius:3px;padding:8px 10px;min-height:40px}
  .bar input[type=search]{flex:1 1 220px;min-width:170px}
  .toggle{display:inline-flex;align-items:center;gap:7px;font-size:14px;color:var(--muted);
    border:1px solid var(--rule);border-radius:3px;padding:8px 11px;min-height:40px;
    background:var(--card);cursor:pointer}
  .toggle input{accent-color:var(--accent);width:16px;height:16px}
  .count{font-size:13px;color:var(--muted);font-variant-numeric:tabular-nums;margin-left:auto}
  h2.lesson{font-family:var(--serif);font-weight:600;font-size:22px;margin:34px 0 4px;
    padding-top:18px;border-top:2px solid var(--rule)}
  h2.lesson span{font-family:var(--sans);font-size:13px;font-weight:500;color:var(--muted);
    margin-left:10px;font-variant-numeric:tabular-nums}
  .q{display:grid;grid-template-columns:4px 1fr;gap:0 16px;background:var(--card);
    border:1px solid var(--rule);border-left:0;border-radius:3px;margin:12px 0 0}
  .q .stripe{background:var(--ok);border-radius:3px 0 0 3px}
  .q.un .stripe{background:var(--flag)}
  .q .inner{padding:14px 18px 15px}
  .meta{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:0 0 9px;
    font-size:12.5px;color:var(--muted)}
  .chip{font-size:11.5px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;
    padding:3px 8px;border-radius:2px;background:var(--ok-soft);color:var(--ok)}
  .q.un .chip{background:var(--flag-soft);color:var(--flag)}
  .code{font-weight:600;color:var(--accent);background:var(--accent-soft);
    padding:3px 7px;border-radius:2px;font-size:11.5px;letter-spacing:.03em}
  .ask{font-family:var(--serif);font-size:19px;line-height:1.45;margin:0 0 10px;max-width:62ch}
  ul.opts{list-style:none;margin:0 0 10px;padding:0;display:flex;flex-wrap:wrap;gap:7px}
  ul.opts li{border:1px solid var(--rule);border-radius:2px;padding:5px 10px;font-size:14px;
    color:var(--muted);background:var(--paper)}
  ul.opts li.k{border-color:var(--ok);color:var(--ok);font-weight:600;background:var(--ok-soft)}
  ul.opts li.k::before{content:"keyed  ";font-size:10.5px;letter-spacing:.06em;
    text-transform:uppercase;opacity:.75;font-weight:600}
  .why{font-size:14.5px;color:var(--muted);margin:0;max-width:70ch}
  .why b{color:var(--ink);font-weight:600}
  .acts{display:flex;gap:8px;margin:12px 0 0}
  .acts button{font-family:var(--sans);font-size:13px;font-weight:600;color:var(--muted);
    background:var(--paper);border:1px solid var(--rule);border-radius:3px;
    padding:7px 12px;min-height:38px;cursor:pointer}
  .acts button[aria-pressed=true]{background:var(--accent-soft);border-color:var(--accent);color:var(--accent)}
  .q.read{opacity:.55}
  .empty{padding:26px 0;color:var(--muted)}
  a{color:var(--accent)}
  :focus-visible{outline:2px solid var(--accent);outline-offset:2px}
  @media (max-width:560px){ .wrap{padding:24px 14px 70px} .figs{gap:18px} }
  @media print{
    .bar,.acts{display:none} body{background:#fff}
    .q{break-inside:avoid;border-color:#ccc}
  }
</style>
"""

BODY = ['<div class="wrap">', '<header>',
        '<h1>Every question in Grade 1 Maths, for review</h1>',
        '<p class="lede">The seven live lesson pages, laid out for a human read. '
        'Questions no tool can check come first &mdash; those are the ones where a wrong '
        'answer key would reach a child in silence.</p>', '</header>']

BODY.append('<div class="panel"><h2>What has and has not been checked</h2>'
            '<ul class="figs">'
            '<div><b>%d</b><span>questions in the build</span></div>'
            '<div class="is-flag"><b>%d</b><span>no tool can check the key</span></div>'
            '<div><b>%s</b><span>key confirmed by arithmetic</span></div>'
            '<div><b>%s</b><span>found wrong</span></div>'
            '</ul>'
            '<p>A question counts as checked when <code>check-answer-keys.py</code> can work its '
            'answer out from the question and the item\'s own data. That catches a key bound to the '
            'wrong option &mdash; and nothing else. Whether the question is pitched right for a '
            'six-year-old, whether the explanation teaches, and whether the wrong options are the '
            'mistakes children actually make are all still for you.</p>'
            '<p>This page lists %d items where the checker counts %s: a few questions are asked '
            'more than once with a different picture each time, and each copy is its own thing to read.</p>'
            '<p>Marks are kept in this browser only. Nothing here is sent anywhere.</p></div>'
            % (len(rows), nun, counts[1], counts[2], len(rows), counts[0]))

BODY.append('<div class="bar">'
            '<input type="search" id="q" placeholder="Search questions, answers or explanations" '
            'aria-label="Search the questions">'
            '<select id="lesson" aria-label="Filter by lesson"><option value="">All seven lessons</option>%s</select>'
            '<label class="toggle"><input type="checkbox" id="onlyun"> Unchecked keys only</label>'
            '<label class="toggle"><input type="checkbox" id="hideread"> Hide what I have read</label>'
            '<span class="count" id="count"></span></div>'
            % "".join('<option value="%s">%s</option>' % (esc(f), esc(TITLES[f])) for f in FILES))

cur = None
for i, r0 in enumerate(rows):
    if r0["file"] != cur:
        cur = r0["file"]
        n_here = len([x for x in rows if x["file"] == cur])
        n_un = len([x for x in rows if x["file"] == cur and x["unverified"]])
        BODY.append('<h2 class="lesson" data-file="%s">%s<span>%d questions &middot; %d unchecked</span></h2>'
                    % (esc(cur), esc(TITLES.get(cur, cur)), n_here, n_un))
    code = r0["codes"][0] if r0["codes"] else ""
    BODY.append(
        '<article class="q %s" data-file="%s" data-un="%d" data-i="%d">'
        '<div class="stripe"></div><div class="inner">'
        '<p class="meta">%s<span>%s</span>%s</p>'
        '<p class="ask">%s</p><ul class="opts">%s</ul><p class="why">%s</p>'
        '<div class="acts">'
        '<button type="button" class="mark" data-i="%d" aria-pressed="false">Mark read</button>'
        '<button type="button" class="flagit" data-i="%d" aria-pressed="false">Looks wrong</button>'
        '</div></div></article>'
        % ("un" if r0["unverified"] else "", esc(r0["file"]), 1 if r0["unverified"] else 0, i,
           '<span class="chip">%s</span>' % ("unchecked key" if r0["unverified"] else "key checked"),
           esc(r0["step"] or "-"),
           ('<span class="code" title="%s">%s</span>' % (esc(OBJ_TEXT.get(code, "")), esc(code))) if code else "",
           esc(r0["q"]),
           "".join('<li class="%s">%s</li>' % ("k" if o == r0["key"] else "", esc(o)) for o in r0["opts"]),
           ('<b>Why the child is told:</b> ' + esc(r0["why"])) if r0["why"] else "",
           i, i))

BODY.append('<p class="empty" id="none" hidden>Nothing matches those filters.</p>')
BODY.append("</div>")

SCRIPT = """
<script>
(function(){
  var KEY="ehel-g1-review-v1", state={};
  try{ state=JSON.parse(localStorage.getItem(KEY)||"{}")||{}; }catch(e){ state={}; }
  function save(){ try{ localStorage.setItem(KEY,JSON.stringify(state)); }catch(e){} }
  var items=[].slice.call(document.querySelectorAll(".q"));
  var q=document.getElementById("q"), lesson=document.getElementById("lesson"),
      onlyun=document.getElementById("onlyun"), hideread=document.getElementById("hideread"),
      count=document.getElementById("count"), none=document.getElementById("none");
  function paintOne(el){
    var i=el.dataset.i, s=state[i]||{};
    el.classList.toggle("read",!!s.read);
    el.querySelector(".mark").setAttribute("aria-pressed",s.read?"true":"false");
    el.querySelector(".mark").textContent=s.read?"Read":"Mark read";
    el.querySelector(".flagit").setAttribute("aria-pressed",s.flag?"true":"false");
    el.querySelector(".flagit").textContent=s.flag?"Flagged":"Looks wrong";
  }
  function apply(){
    var t=(q.value||"").toLowerCase(), f=lesson.value, un=onlyun.checked, hr=hideread.checked, n=0;
    items.forEach(function(el){
      var s=state[el.dataset.i]||{};
      var ok = (!f || el.dataset.file===f) && (!un || el.dataset.un==="1") && (!hr || !s.read)
            && (!t || el.textContent.toLowerCase().indexOf(t)>-1);
      el.hidden=!ok; if(ok) n++;
    });
    document.querySelectorAll("h2.lesson").forEach(function(h){
      var any=items.some(function(el){ return el.dataset.file===h.dataset.file && !el.hidden; });
      h.hidden=!any;
    });
    var flagged=Object.keys(state).filter(function(k){return state[k].flag;}).length;
    var read=Object.keys(state).filter(function(k){return state[k].read;}).length;
    count.textContent=n+" showing \\u00b7 "+read+" read \\u00b7 "+flagged+" flagged";
    none.hidden = n>0;
  }
  document.addEventListener("click",function(e){
    var b=e.target.closest(".mark,.flagit"); if(!b) return;
    var i=b.dataset.i, s=state[i]||(state[i]={});
    if(b.classList.contains("mark")) s.read=!s.read; else s.flag=!s.flag;
    save(); paintOne(b.closest(".q")); apply();
  });
  [q,lesson,onlyun,hideread].forEach(function(el){ el.addEventListener("input",apply); });
  items.forEach(paintOne); apply();
})();
</script>
"""

TITLE = "<title>Grade 1 Maths Question Review</title>"
page = TITLE + STYLE + "\n".join(BODY) + SCRIPT
if not ARTIFACT:
    page = ('<!doctype html><html lang="en-GB"><head><meta charset="utf-8">'
            '<meta name="viewport" content="width=device-width,initial-scale=1">'
            + page.replace(TITLE, TITLE, 1) + "</body></html>")
    page = page.replace(STYLE + "\n".join(BODY), STYLE + "<body>" + "\n".join(BODY), 1)

io.open(OUT, "w", encoding="utf-8").write(page)
print("  %d questions (%d unverifiable, first in the pack)" % (len(rows), nun))
print("  check-answer-keys.py reads %s; this pack reads %d%s"
      % (counts[0], len(rows),
         "" if str(counts[0]) == str(len(rows))
         else "   (repeated stems are listed once there and per item here)"))
print("  %d carry an objective code" % len([r for r in rows if r["codes"]]))
print("  written to %s%s" % (OUT, "   (artifact-shaped: no doctype wrapper)" if ARTIFACT else ""))
