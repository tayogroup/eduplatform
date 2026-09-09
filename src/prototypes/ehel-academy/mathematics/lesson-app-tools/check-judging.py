# -*- coding: utf-8 -*-
"""Gate: every teaching slide must be able to disagree with the child.

A slide that only DISPLAYS is not a lesson step - a slider or a variant chip
changes the picture and never tells a learner they are wrong. Grade 4 found 22
of its 37 slides in that state once, which is why the gate was written.

THE SHARED VERSION of grade-4-app/check-judging.py, which this replaces. That
one carried

    LES=[("time-slides.js","Telling the Time",4), ... ]

- five source filenames with a hardcoded teaching count each - and by the time
anyone read its output the build was eight lessons. It reported "teaching
slides: 37" against 72, named two lessons (Shape, Space and Place; Numbers and
How They Behave) that no longer ship, and printed a clean result over the half
it could not see. Green because it did no work, which is this repo's most
repeated failure.

Two things it did that this does not:

  - IT READ THE SOURCES, `*-slides.js`, not the built pages. The built page is
    what deploys and what a learner runs; a source that is not assembled into
    one is not a lesson.
  - IT PAIRED JS TO SLIDES BY THE /* ---- N: title ---- */ MARKER NUMBER.
    Those are activity counters, not slide indices - CLAUDE.md records
    up-to-twenty.html having two `2:` and two `14:`, and half-past-quarter-to
    numbering its last three blocks 9, 10, 11 after reaching 13. Pairing on
    them deletes or credits the wrong slide. Blocks are matched here by the
    element ids they touch, which is what anatomy.py asserts.

Usage:  python ../lesson-app-tools/check-judging.py            # from the build
        python ../lesson-app-tools/check-judging.py --app ../grade-4-app
"""
import io, os, re, sys, json

sys.stdout.reconfigure(encoding="utf-8")

argv = sys.argv[1:]
app = argv[argv.index("--app") + 1] if "--app" in argv else "."
SRC = os.path.abspath(app)
cfgp = os.path.join(SRC, "app.config.json")
if not os.path.exists(cfgp):
    sys.exit("No app.config.json in %s\n  pass --app <dir>" % SRC)
cfg = json.load(io.open(cfgp, encoding="utf-8"))

WIN = 900
# every way these builds say "you are wrong". The empty-string arm is Grade 3,
# which writes `"fb " + (ok ? "good" : "")` - judged, but with no colour on the
# wrong state; it counts here and is reported separately below.
WRONG = re.compile(
    r'\?\s*"good"\s*:\s*"bad"'
    r'|\?\s*"good"\s*:\s*""'
    r'|\?\s*"ok"\s*:\s*"bad"'
    r'|"fb bad"'
    r'|classList\.add\("wrong"\)'
    r'|classList\.add\(\s*\w+\s*\?\s*"right"\s*:\s*"wrong"\s*\)'
    r'|\bmark\(\s*"[^"]+"\s*,\s*\w+\s*,\s*\w+\s*\)'
    r'|\breveal\(\s*\$\('
    r'|REACTION\.wrong'
    r'|[Nn]ot quite|[Nn]ot this time|[Ll]ook again'
)
# a data table read by a shared runner: the judging is in the runner, hundreds
# of lines from the id, so a window around the id cannot see it
EL_BLOCK = re.compile(r"el:\s*\{(?P<map>[^}]*)\}(?=(?P<rest>.{0,6000}))", re.S)
SCORED = re.compile(r"\bok:\s*(true|false)|cards:\s*\[[^\]]{0,400}?\bv:\s*\d", re.S)
IDREF = re.compile(r'"([A-Za-z0-9_-]+)"')


def tag_end(s, i):
    q = None
    while i < len(s):
        c = s[i]
        if q:
            if c == q:
                q = None
        elif c in "\"'":
            q = c
        elif c == ">":
            return i
        i += 1
    return -1


def slides_of(src):
    """(printed step number, title, ids) per slide.

    The tag is scanned quote-aware because data-explain holds SSML and a
    [^>]* attribute scan truncates at the first '>' inside it - which silently
    drops data-say and pollutes the body, while the slide COUNT still comes out
    right so nothing looks wrong.
    """
    out = []
    for m in re.finditer(r'<section class="slide"', src):
        gt = tag_end(src, m.start())
        close = src.index("</section>", gt)
        body = src[gt + 1:close]
        h2 = re.search(r"<h2[^>]*>(.*?)</h2>", body, re.S)
        n = re.search(r'<span class="n">(.*?)</span>', body, re.S)
        out.append(dict(
            n=re.sub(r"<[^>]*>", "", n.group(1)).strip() if n else "",
            title=re.sub(r"<[^>]*>", "", h2.group(1)).strip() if h2 else "",
            ids=sorted(set(re.findall(r'id="([A-Za-z0-9_-]+)"', body))),
        ))
    return out


def lesson_script(src):
    """the lesson's own IIFE, not one of the wiring scripts beside it.

    A page has six scripts by the time the toolchain has finished with it, and
    add-header-bars.py's is the trap: it ALSO declares `slides`, so "the last
    script that mentions slides" picks a 3.7KB fragment with no judging in it
    over the 63KB lesson. That read every teaching step of six Grade 2 lessons
    as display-only. `const STICKERS` is the lesson's own marker; largest wins
    among candidates so a future wiring script cannot take the name back.
    """
    cands = [m.group(1) for m in re.finditer(r"<script[^>]*>(.*?)</script>", src, re.S)
             if "const STICKERS" in m.group(1)]
    if not cands:
        cands = [m.group(1) for m in re.finditer(r"<script[^>]*>(.*?)</script>", src, re.S)
                 if 'querySelectorAll(".slide")' in m.group(1)]
    return max(cands, key=len) if cands else ""


def windows_for(js, ids):
    spans = []
    for i in ids:
        for m in re.finditer(r'["\'\(]' + re.escape(i) + r'["\'\)]', js):
            spans.append((max(0, m.start() - WIN), min(len(js), m.end() + WIN)))
    if not spans:
        return ""
    spans.sort()
    merged, cur = [], list(spans[0])
    for a, b in spans[1:]:
        if a <= cur[1]:
            cur[1] = max(cur[1], b)
        else:
            merged.append(cur); cur = [a, b]
    merged.append(cur)
    return "\n".join(js[a:b] for a, b in merged)


def table_ids(js):
    out = set()
    for m in EL_BLOCK.finditer(js):
        if SCORED.search(m.group("rest")):
            out.update(IDREF.findall(m.group("map")))
    return out


print("\n  Can every teaching slide disagree with the child? %s %s\n"
      % (cfg.get("subjectLabel", ""), cfg.get("gradeLabel", "")))

total = judged = 0
passive = []
for l in cfg["lessons"]:
    p = os.path.join(SRC, l["file"])
    src = io.open(p, encoding="utf-8").read()
    js = lesson_script(src)
    tbl = table_ids(js)
    sl = slides_of(src)
    n_t = n_j = 0
    for s in sl:
        # teaching slides only: the check and the sticker shelf print a glyph
        if not s["n"].isdigit():
            continue
        n_t += 1; total += 1
        has_ask = any(re.fullmatch(r"(d\d+_)?ask\d+", i) for i in s["ids"])
        if WRONG.search(windows_for(js, s["ids"])) or has_ask or (set(s["ids"]) & tbl):
            n_j += 1; judged += 1
        else:
            passive.append((l["file"], s["n"], s["title"]))
    print("  %-4s %-32s %2d/%2d" % ("ok" if n_j == n_t else "--", l["file"][:32], n_j, n_t))

print("\n  %d teaching slides, %d can disagree, %d cannot" % (total, judged, total - judged))

# EXPLORATION STEPS: slides that deliberately have no right answer - build a
# number out of tens and ones, balance the scales, tap the hundred chart. They
# are named in app.config.json as "file.html#step" and are the only permitted
# failures.
#
# An exemption that stops firing FAILS, the way check-english-ebooks.mjs treats
# its recorded exemption: if a listed step starts judging, or names a step that
# is not there, the list has rotted into a permanent amnesty and says so. The
# alternative - a bare count that may not rise - cannot tell a new display-only
# slide from one somebody meant.
exempt = cfg.get("explorationSteps", [])
seen = set("%s#%s" % (f, n) for f, n, _ in passive)
allowed = set(exempt)
unexpected = [(f, n, t) for f, n, t in passive if "%s#%s" % (f, n) not in allowed]
stale = sorted(allowed - seen)

for f, n, t in passive:
    tag = "exploration" if "%s#%s" % (f, n) in allowed else "NOT JUDGED"
    print("     %-11s %-30s step %-3s %s" % (tag, f[:30], n, t[:40]))

if stale:
    print("\n  STALE EXEMPTIONS - these now judge, or name a step that is gone.")
    print("  Delete them from app.config.json :: explorationSteps:")
    for k in stale:
        print("     %s" % k)

if total == 0:
    sys.exit("\n  REFUSED: no teaching slides found. A gate that reads nothing is not a pass.")

if unexpected or stale:
    print("\n  %d slide(s) that cannot disagree and are not recorded as exploration,"
          " %d stale exemption(s)\n" % (len(unexpected), len(stale)))
    sys.exit(1)
print("\n  every teaching slide either judges or is a recorded exploration step\n")
sys.exit(0)
