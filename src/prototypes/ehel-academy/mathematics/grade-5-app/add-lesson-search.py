# -*- coding: utf-8 -*-
"""Search the lesson content, Grade 5 shaped.

    python add-lesson-search.py            # report
    python add-lesson-search.py --write

WHY THIS BUILD NEEDS ITS OWN. Twenty standalone builds carry the search that
lesson-app-tools/add-lesson-search.py wires, and Maths Grade 5 is the one that
does not. Both shared tools refuse it, correctly:

    build-lesson-search.py   "has no .slide sections"  - it reads <section
                             class="slide">, and this build has <section
                             class="step">
    add-lesson-search.py     wants bar 1, .eh-b1right, #ehSteps, one script
                             declaring `slides`, and an IIFE to insert before.
                             This build has a <header class="hero">, a
                             .steps-nav of #sN anchors, and no deck at all.

So this is not a missing file, which is what it looked like from the outside.
The FEATURE was never wired here, and shipping lesson-search.json on its own
would have added a file nothing fetches - the shape of gate-is-green-about-
something-unreachable this repo already has a name for.

ONE VOCABULARY, NOT TWO. The term expansion that makes "addition" find "adding"
and "counting on" is read out of lesson-app-tools/build-lesson-search.py rather
than retyped here, because two copies of a subject's vocabulary drift and the
drift is one build answering a query the other cannot. It is read from HEAD
(`git show`) rather than from the working tree, which another session currently
has open with uncommitted changes.

WHAT IS DIFFERENT ABOUT THE TEXT HERE, measured rather than assumed. In the deck
builds the teaching language lives in `data-explain`, the narration attribute -
their markup is a heading and an empty container, because the exercises are
built in JavaScript. This build has no narration attributes at all (0 across all
six lessons) and its teaching language is the VISIBLE prose: `<p class="intro">`
on every step. So the index reads the rendered text, and gets more of it per
step than a deck page would.

A RESULT CARRIES `?from=g5`, and that is the whole launch carry here. This build
is deliberately self-contained - its own app.config.json says so: no module
imports, no progress reporting, no Wehel. There is no pwsToken to drop, unlike
the deck builds where dropping it would leave a learner's work unreported.

THE ANCHOR IS THE STEP'S OWN id. The deck builds link `#step-N` where N is the
learner-facing "Step 4 of 12". Here each step already carries `id="sN"` and the
page's own .steps-nav already links to it, so a result reuses the navigation the
page has rather than inventing a second one.
"""
import io, json, os, re, subprocess, sys

sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))
WRITE = "--write" in sys.argv[1:]
for a in sys.argv[1:]:
    if a != "--write":
        sys.exit("unrecognised argument: %s" % a)

MARK = "ehel-g5-search"
CFG = json.load(io.open(os.path.join(HERE, "app.config.json"), encoding="utf-8"))
FROM = CFG["fromParam"]
SHARED = ("src/prototypes/ehel-academy/mathematics/lesson-app-tools/"
          "build-lesson-search.py")


def shared_terms():
    """The subject's term map, from HEAD's copy of the shared builder."""
    repo = os.path.abspath(os.path.join(HERE, "..", "..", "..", "..", ".."))
    r = subprocess.run(["git", "show", "HEAD:" + SHARED], cwd=repo,
                       capture_output=True, text=True, encoding="utf-8")
    if r.returncode:
        sys.exit("  REFUSED: cannot read %s from HEAD - the shared vocabulary is "
                 "where the terms live and this will not retype them." % SHARED)
    src = r.stdout
    i = src.find("TERMS = {")
    if i < 0:
        sys.exit("  REFUSED: no TERMS map in the shared builder any more")
    j = src.find("\n}\n", i)
    ns = {}
    exec(src[i:j + 3], ns)                                   # noqa: S102
    terms = ns["TERMS"].get(CFG["subject"])
    if not terms:
        sys.exit("  REFUSED: the shared TERMS map has no %r" % CFG["subject"])
    return terms


def phrase(w):
    return re.compile(r"(?<![a-z])" + re.escape(w).replace(r"\ ", r"\s+") + r"(?![a-z])")


TERMS = shared_terms()


def tags_for(text):
    hit, why = [], {}
    low = text.lower()
    for formal, words in sorted(TERMS.items()):
        for w in words:
            if phrase(w).search(low):
                hit.append(formal)
                why[formal] = w
                break
    return hit, why


TAG = re.compile(r"<[^>]+>")
WS = re.compile(r"\s+")
STEP = re.compile(r'<section class="step" id="([^"]+)">')


def visible(html):
    t = re.sub(r"<(script|style)\b[\s\S]*?</\1>", " ", html, flags=re.I)
    t = TAG.sub(" ", t)
    t = (t.replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">")
          .replace("&mdash;", "-").replace("&ndash;", "-").replace("&nbsp;", " ")
          .replace("&hellip;", "...").replace("&quot;", '"').replace("&#39;", "'"))
    return WS.sub(" ", t).strip()


FIELD = ('\n    <!-- %s: search this grade\'s lesson content. The field sits with\n'
         '         the step list because that is this page\'s table of contents. -->\n'
         '    <div class="lsearch">\n'
         '      <label class="lsearch-lab" for="lsq">Search the lessons</label>\n'
         '      <input id="lsq" type="search" autocomplete="off" placeholder="try '
         '&quot;square number&quot; or &quot;rounding&quot;">\n'
         '      <div id="lsout" class="lsearch-out" role="status" aria-live="polite"></div>\n'
         '    </div>\n  ' % MARK)

STYLE = """<style>/* %s - see add-lesson-search.py */
  .lsearch { margin: 0 0 18px; }
  .lsearch-lab { display: block; font-size: 12.5px; letter-spacing: .05em;
    text-transform: uppercase; color: var(--muted); margin: 0 0 6px; }
  .lsearch input { font: inherit; font-size: 15px; width: 100%%; max-width: 30rem;
    padding: 9px 13px; border-radius: 10px; border: 1px solid var(--line);
    background: var(--card); color: var(--ink); }
  .lsearch-out { margin-top: 10px; }
  .lsearch-out:empty { display: none; }
  .ls-hit { display: block; text-decoration: none; color: inherit;
    padding: 9px 12px; border: 1px solid var(--line); border-radius: 10px;
    background: var(--card); margin-bottom: 7px; }
  .ls-hit:hover, .ls-hit:focus-visible { border-color: var(--accent); }
  .ls-where { font-size: 12px; color: var(--muted); }
  .ls-head { font-weight: 600; font-size: 15px; margin: 1px 0 2px; }
  .ls-snip { font-size: 13.5px; color: var(--muted); line-height: 1.5; }
  .ls-snip mark { background: var(--accent-soft); color: var(--accent);
    padding: 0 2px; border-radius: 3px; }
  .ls-none { font-size: 14px; color: var(--muted); }
</style>
""" % MARK

JS = """
<script>
/* %s - see add-lesson-search.py.
   One matcher, both hosts: the hub and every lesson page get this same body.
   It tells them apart by asking the page - a result in THIS document scrolls
   to the step, anything else navigates, carrying ?from=%s exactly as the hub's
   own lesson links do. */
(function () {
  const box = document.getElementById("lsq"), out = document.getElementById("lsout");
  if (!box || !out) return;
  const HERE = location.pathname.split("/").pop() || "index.html";
  let INDEX = null, pending = null;
  const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

  fetch("lesson-search.json").then((r) => r.json()).then((d) => {
    INDEX = d;
    if (pending !== null) { const q = pending; pending = null; run(q); }
  }).catch(() => { out.innerHTML = '<p class="ls-none">The lesson list could not be loaded.</p>'; });

  /* Word-PREFIX, not substring: a substring search for "even" answers with
     "seven" and "eleven". Each token must start a word somewhere in the step. */
  const toks = (q) => q.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 1);
  const hasAll = (hay, ts) => ts.every((t) =>
    new RegExp("(?:^|[^a-z0-9])" + t.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")).test(hay));

  function snippet(text, ts) {
    const low = text.toLowerCase();
    let at = -1;
    for (const t of ts) {
      const m = low.search(new RegExp("(?:^|[^a-z0-9])" + t.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")));
      if (m >= 0 && (at < 0 || m < at)) at = m;
    }
    if (at < 0) at = 0;
    const from = Math.max(0, at - 40);
    let s = text.slice(from, from + 170);
    if (from > 0) s = "..." + s;
    if (from + 170 < text.length) s += "...";
    let html = esc(s);
    for (const t of ts) {
      html = html.replace(new RegExp("((?:^|[^a-z0-9]))(" + t.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&") + "[a-z0-9]*)", "gi"),
        (m0, a, b) => a + "<mark>" + b + "</mark>");
    }
    return html;
  }

  function run(q) {
    const ts = toks(q);
    if (!ts.length) { out.innerHTML = ""; return; }
    if (!INDEX) { pending = q; return; }
    const hits = [];
    for (const l of INDEX.lessons) {
      for (const s of l.steps) {
        const hay = (s.h + " " + s.t + " " + (s.g || "")).toLowerCase();
        if (hasAll(hay, ts)) hits.push({ l: l, s: s });
      }
    }
    if (!hits.length) {
      out.innerHTML = '<p class="ls-none">Nothing in this grade matches "'
        + esc(q) + '".</p>';
      return;
    }
    out.innerHTML = hits.slice(0, 12).map((h) => {
      const here = h.l.file === HERE;
      const href = (here ? "" : h.l.file + "?from=%s") + "#" + h.s.a;
      return '<a class="ls-hit" href="' + href + '">'
        + '<span class="ls-where">' + esc(h.l.title) + (here ? " - this lesson" : "")
        + '</span><p class="ls-head">' + esc(h.s.h) + "</p>"
        + '<p class="ls-snip">' + snippet(h.s.t, ts) + "</p></a>";
    }).join("") + (hits.length > 12
      ? '<p class="ls-none">' + (hits.length - 12) + " more.</p>" : "");
  }

  box.addEventListener("input", () => run(box.value));
  out.addEventListener("click", (e) => {
    const a = e.target.closest(".ls-hit");
    if (!a) return;
    const href = a.getAttribute("href");
    if (href.charAt(0) !== "#") return;          // another lesson: let it navigate
    e.preventDefault();
    const el = document.getElementById(href.slice(1));
    if (el) { history.replaceState(null, "", href); el.scrollIntoView({ block: "start" }); }
  });
})();
</script>
""" % (MARK, FROM, FROM)

# ---- build the index ----------------------------------------------------------
lessons, total, noheading = [], 0, 0
for lesson in CFG["lessons"]:
    name = lesson["file"]
    p = os.path.join(HERE, name)
    if not os.path.isfile(p):
        sys.exit("  REFUSED: %s is in app.config.json and not on disk" % name)
    s = io.open(p, encoding="utf-8", newline="").read()
    opens = list(STEP.finditer(s))
    if not opens:
        sys.exit("  REFUSED %s has no <section class=\"step\" id=...> sections" % name)
    steps = []
    for i, m in enumerate(opens):
        end = opens[i + 1].start() if i + 1 < len(opens) else s.find("</div>", m.end())
        chunk = s[m.end():end if end > 0 else len(s)]
        h = re.search(r"<h2>([\s\S]*?)</h2>", chunk)
        heading = visible(h.group(1)) if h else ""
        body = visible(chunk[h.end():] if h else chunk)
        if not heading and not body:
            noheading += 1
            continue
        hg, _ = tags_for(heading)
        ag, why = tags_for(heading + " " + body)
        steps.append({"i": i, "a": m.group(1), "h": heading, "t": body[:1800],
                      "gh": " ".join(hg), "g": " ".join(ag), "gm": why})
        total += 1
    lessons.append({"file": name, "title": lesson.get("title") or name,
                    "steps": steps})
    print("  %-34s %2d step(s) indexed" % (name, len(steps)))

doc = {"subject": CFG["subject"], "subjectLabel": CFG["subjectLabel"],
       "grade": CFG["grade"], "gradeLabel": CFG["gradeLabel"],
       "fromParam": FROM, "lessons": lessons}
chars = sum(len(s["t"]) for l in lessons for s in l["steps"])
tagged = sum(1 for l in lessons for s in l["steps"] if s["g"])
print("\n  %d steps indexed, %d characters, %d carrying a term tag"
      % (total, chars, tagged))
if total < 30:
    sys.exit("  REFUSED: only %d steps - a field that answers almost nothing is "
             "worse than no field." % total)

# ---- wire the pages -----------------------------------------------------------
todo, refused, done = [], 0, 0
pages = [l["file"] for l in CFG["lessons"]] + [CFG["hub"]]
for name in pages:
    p = os.path.join(HERE, name)
    s = io.open(p, encoding="utf-8", newline="").read()
    if MARK in s:
        print("  already    %-34s" % name)
        done += 1
        continue
    if name == CFG["hub"]:
        anchor = re.search(r'<div class="grid">', s)
        if not anchor:
            print("  REFUSED    %-34s no .grid to put the field before" % name)
            refused += 1
            continue
        at = anchor.start()
    else:
        # the step list is this page's table of contents, so the field belongs
        # with it. check-what-you-know is the quiz page and has no nav, so there
        # the field goes above the first step instead - a child stuck on a
        # question is exactly who wants to search, and leaving one page of six
        # without the field would be the odd one out for no reason.
        anchor = re.search(r'<nav class="steps-nav"', s) \
            or re.search(r'<section class="step" id="', s)
        if not anchor:
            print("  REFUSED    %-34s no .steps-nav and no step to sit above" % name)
            refused += 1
            continue
        at = anchor.start()
    out = s[:at] + FIELD.lstrip("\n") + s[at:]
    k = out.rfind("</script>")
    out = (out[:k + len("</script>")] + JS + out[k + len("</script>"):]) if k >= 0 \
        else out.rstrip() + "\n" + JS
    out = out.rstrip() + "\n" + STYLE
    if out.count(MARK) != 3 or out.count('id="lsq"') != 1:
        print("  REFUSED    %-34s marker %d (want 3), field %d"
              % (name, out.count(MARK), out.count('id="lsq"')))
        refused += 1
        continue
    todo.append((p, out))
    print("  would wire %-34s" % name)

if WRITE and not refused:
    io.open(os.path.join(HERE, "lesson-search.json"), "w", encoding="utf-8",
            newline="\n").write(json.dumps(doc, ensure_ascii=False, indent=1) + "\n")
    for p, out in todo:
        io.open(p, "w", encoding="utf-8", newline="").write(out)
    # the index has to SHIP, or the field 404s on a path nobody has fetched
    cfg = json.load(io.open(os.path.join(HERE, "app.config.json"), encoding="utf-8"))
    extra = cfg.get("extraPages") or []
    if "lesson-search.json" not in extra:
        cfg["extraPages"] = extra + ["lesson-search.json"]
        io.open(os.path.join(HERE, "app.config.json"), "w", encoding="utf-8",
                newline="\n").write(json.dumps(cfg, ensure_ascii=False, indent=2) + "\n")
        print("  app.config.json: extraPages now ships lesson-search.json")

print("")
print("  %d page(s) %s, %d already done, %d refused%s"
      % (len(todo), "wired" if (WRITE and not refused) else "to wire", done, refused,
         "" if WRITE else "   (--write to apply)"))
