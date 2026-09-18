# -*- coding: utf-8 -*-
"""The warm-up draws from every lesson the child has already FINISHED, not just
the one before it.

    python add-spiral-warmup.py            # report
    python add-spiral-warmup.py --write

THE SAME GAP GRADE 1 AND GRADE 2 CLOSED, NEVER CLOSED HERE. add-warmup.py gives
each lesson a recap line naming the previous lesson and one question about
TODAY's topic - a diagnostic, not retrieval. Nothing in this build ever
RE-ASKS an earlier lesson: each end-of-lesson check covers its own lesson and
stops. The books vs app comparison for Mathematics Stages 1-4 named this row
"Cambridge leads" for Grade 3 and 4 specifically because of that gap - Grade 1
and 2 already had this file, and this build did not.

HOW IT GETS THE RECORD, WHY IT PATCHES THE BUILT PAGE, and THE BANK IS
IDENTICAL IN ALL EIGHT PAGES: unchanged from Grade 1's version of this tool -
see grade-1-app/add-spiral-warmup.py's own header for the full reasoning on
`units[lNN].completed`, `window.__ehelSpiral`, hydrate ordering and the
flat-array shape check-answer-keys.py needs. The only structural change here is
the page count (8 lessons, not 7) and the fact this build's pages are
GENERATED - like every other tool that has patched Grade 3 since the depth
pass, this one patches the BUILT .html files directly, because none of the
teaching added this week (spot-the-mistake, TWM stamps, differentiation,
self-check) lives in the src/ fragments either, and a rebuild from src/ would
discard all of it.

THE QUESTIONS ARE NEW, not carried over. Three per lesson, each pinned to
something that lesson actually teaches, answers kept inside Stage 3's own
number range (up to 1000) rather than Grade 1's 0-20. One trap avoided on
purpose: Measure It's own angle step was fixed on 2026-09-11 to say "smaller,
the same or bigger than a right angle" rather than "acute/obtuse", because
3Gg.10 is a comparison and 4Gg.08's vocabulary is a stage ahead - the spiral
question for that lesson uses the same wording, not the Stage 4 one.

Guarded by a marker; every anchor must match exactly once or the file is
refused rather than half-patched.
"""
import io, json, os, re, sys

sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))
G = HERE
WRITE = "--write" in sys.argv[1:]
for a in sys.argv[1:]:
    if a != "--write":
        sys.exit("unrecognised argument: %s" % a)

MARK = "ehel-spiral"

# Three per lesson, each pinned to something that lesson actually teaches, all
# answers inside Stage 3's own range (up to 1000). `why` says why the answer is
# right; the runner adds which lesson it came from.
SPIRAL = [
    ("up-to-a-thousand",
     [("Which number is bigger: 348 or 438?", [348, 438, 384], 438,
       "4 hundreds is more than 3 hundreds, so 438 is the bigger number."),
      ("What is the value of the 6 in 462?", [6, 60, 600], 60,
       "The 6 is in the tens column, so it is worth 6 tens, which is 60."),
      ("How many hundreds are in 700?", [7, 70, 700], 7,
       "700 is 7 hundreds, with no tens or ones left over.")]),
    ("adding-and-money",
     [("What is 300 add 400?", [700, 300, 340], 700,
       "3 hundreds and 4 hundreds make 7 hundreds, which is 700."),
      ("You have 500 shillings and spend 150. How much is left?", [350, 450, 650], 350,
       "500 take away 150 is 350."),
      ("Which makes 250 shillings: two 100s and a 50, or three 50s?",
       ["two 100s and a 50", "three 50s", "the same"], "two 100s and a 50",
       "Two 100s make 200, plus a 50 makes 250. Three 50s make only 150.")]),
    ("rows-and-rules",
     [("How many is 4 rows of 5?", [20, 9, 45], 20,
       "4 rows of 5 is 4 times 5, which is 20."),
      ("Share 12 into groups of 3. How many groups?", [4, 3, 9], 4,
       "12 shared into groups of 3 makes 4 groups."),
      ("What is 6 times 10?", [60, 16, 600], 60,
       "6 times 10 is 60 - put a zero after the 6.")]),
    ("equal-parts",
     [("A shape is cut into 5 equal pieces. What is one piece called?",
       ["a fifth", "a quarter", "a half"], "a fifth",
       "5 equal parts are called fifths."),
      ("Share 10 sweets equally among 5 people. How many does each person get?", [2, 5, 10], 2,
       "10 shared equally among 5 people is 2 each."),
      ("Which is bigger, a half or a quarter of the same whole?",
       ["a half", "a quarter", "they are the same"], "a half",
       "Cutting something into only 2 parts makes each part bigger than cutting it into 4.")]),
    ("shapes-and-symmetry",
     [("How many sides does a hexagon have?", [6, 5, 8], 6,
       "A hexagon has 6 straight sides."),
      ("How many lines of symmetry does a square have?", [4, 1, 2], 4,
       "A square can be folded in half four different ways and match exactly each time."),
      ("A rectangle has sides 5 cm and 3 cm. What is the distance all the way round it?",
       [16, 8, 15], 16,
       "5 add 3 add 5 add 3 is 16 - add all four sides to find the perimeter.")]),
    ("measure-it",
     [("Which unit would you use to measure how heavy an apple is?",
       ["grams", "centimetres", "litres"], "grams",
       "Weight is measured in grams or kilograms, not length or capacity units."),
      ("A jug shows 300 ml of water. You pour in 200 ml more. How much is in the jug now?",
       [500, 100, 600], 500,
       "300 and 200 more makes 500 millilitres."),
      ("You compare an angle to a right angle and it opens wider. Is it smaller, the same, or bigger than a right angle?",
       ["bigger", "smaller", "the same"], "bigger",
       "An angle that opens wider than a right angle's corner is bigger than it.")]),
    ("time-and-direction",
     [("The clock shows 20 minutes past 3. In how many minutes will it be half past 3?",
       [10, 20, 5], 10,
       "Half past 3 is 30 minutes past. From 20 minutes past to 30 minutes past is 10 minutes."),
      ("You face north and turn to face east. Which way did you turn?",
       ["a quarter turn clockwise", "a quarter turn anticlockwise", "a half turn"],
       "a quarter turn clockwise",
       "North to east is one quarter turn in the clockwise direction."),
      ("A film starts at 4:15 and lasts 45 minutes. What time does it finish?",
       ["5:00", "4:45", "5:15"], "5:00",
       "45 minutes after 4:15 is 5:00.")]),
    ("ask-count-chart",
     [("A tally shows one bundle of five and 3 more marks. How many is that?", [8, 7, 53], 8,
       "A bundle of five plus 3 more is 8."),
      ("A bar chart shows 6 for red and 4 for blue. How many more chose red?", [2, 10, 4], 2,
       "6 take away 4 is 2, so 2 more people chose red."),
      ("Which is more likely: a red ball from a bag of 9 red and 1 blue, or a fair coin landing heads?",
       ["the red ball", "the coin landing heads", "they are the same"], "the red ball",
       "9 out of 10 balls are red, which is more likely than a fair coin's 1 out of 2 chance.")]),
]

cfg = json.load(io.open(os.path.join(G, "app.config.json"), encoding="utf-8"))
TITLE = {l["file"][:-5]: l["title"] for l in cfg["lessons"]}
ORDER = [l["file"][:-5] for l in cfg["lessons"]]

# ---- the audit, before a byte is written -------------------------------------
assert [k for k, _ in SPIRAL] == ORDER, "the bank must name every lesson, in the config's order"
for key, items in SPIRAL:
    assert len(items) == 3, "%s: three items per lesson" % key
    for q, opts, a, why in items:
        assert len(opts) == 3, "%s: three options - a guess should be a third, not a coin" % key
        assert a in opts, "%s: the answer must be one of the options" % key
        assert len(set(map(str, opts))) == 3, "%s: repeated option" % key
        for t in (q, why) + tuple(map(str, opts)):
            assert '"' not in t and "\\" not in t and "<" not in t, "%s: unsafe text %r" % (key, t)
        # Stage 3 is up to 1000. A distractor past it teaches a number the child
        # has not met at this stage.
        for n in re.findall(r"(?<![\w.])(\d+)(?!\d|\.\d)", q + " " + " ".join(map(str, opts))):
            assert int(n) <= 1000, "%s: %s is past Stage 3" % (key, n)

UNIT_OF = {}        # lesson -> the lNN the progress record calls it


def lit(v):
    return ('"%s"' % v) if isinstance(v, str) else str(v)


def bank_js(unit_of):
    """The block, IDENTICAL in every page - the lesson it is in is read from the
    page's own progress UNIT at the bottom, not baked per file."""
    rows = []
    for key, items in SPIRAL:
        for q, opts, a, why in items:
            rows.append("{ from: %s, q: %s, opts: [%s], a: %s, why: %s }"
                        % (lit(unit_of[key]), lit(q), ", ".join(lit(o) for o in opts),
                           lit(a), lit(why)))
    titles = ", ".join("%s: %s" % (unit_of[k], lit(TITLE[k])) for k in ORDER)
    return """

  /* ---- """ + MARK + """: the warm-up's second question, drawn from lessons already
     FINISHED - see add-spiral-warmup.py. Not a step: no sticker, no dot, no
     score, no finish(). */
  const SPIRAL = [
    """ + ",\n    ".join(rows) + """
  ];
  const SPIRAL_TITLES = { """ + titles + """ };
  /* Called from the page's hydrate block with the whole course record. Until it
     answers there is no spiral question, which is also what a child on their
     first lesson correctly sees. */
  window.__ehelSpiral = function (units, here) {
    const w = document.getElementById("ehWarm");
    if (!w || w.querySelector(".eh-spiral")) return;          /* once only */
    const pool = SPIRAL.filter(function (it) {
      const u = units && units[it.from];
      return it.from !== here && u && u.completed === true;
    });
    if (!pool.length) return;
    const it = pool[Math.floor(Math.random() * pool.length)];
    const box = document.createElement("div");
    box.className = "eh-spiral";
    box.innerHTML = '<p class="eh-warm-h">And one from before</p>'
      + '<div class="eh-warm-say"><button type="button" class="speak" aria-label="Read it to me">&#128266;</button>'
      + '<span class="eh-spiral-q"></span></div>'
      + '<div class="choices eh-spiral-ch"></div>'
      + '<p class="fb" role="status" aria-live="polite"></p>';
    box.querySelector(".eh-spiral-q").textContent = it.q;
    /* bound here, not by the page-wide .speak wiring, which ran at load */
    box.querySelector(".speak").addEventListener("click", function () { say(it.q); });
    const ch = box.querySelector(".eh-spiral-ch"), fb = box.querySelector(".fb");
    ch.innerHTML = shuffle(it.opts.slice()).map(function (o) {
      return '<button type="button" class="choice" data-v="' + o + '">' + o + "</button>";
    }).join("");
    ch.addEventListener("click", function (e) {
      const b = e.target.closest(".choice"); if (!b || b.disabled) return;
      const ok = String(b.dataset.v) === String(it.a);
      ch.querySelectorAll(".choice").forEach(function (c) {
        c.disabled = true;
        if (String(c.dataset.v) === String(it.a)) c.classList.add("right");
      });
      if (!ok) b.classList.add("wrong");
      const msg = (ok ? cheer() + " " : "Good try. ") + it.why
        + " That was in " + SPIRAL_TITLES[it.from] + ".";
      fb.className = "fb" + (ok ? " good" : ""); fb.textContent = msg; say(msg);
    });
    w.appendChild(box);
  };"""


STYLE = """
<style>/* """ + MARK + """ - see add-spiral-warmup.py */
  .eh-spiral { margin-top: 16px; padding-top: 14px; border-top: 2px dashed var(--line); }
  .eh-spiral .eh-spiral-ch { margin-top: 12px; }
</style>
"""

# the page's own hydrate block, from lesson-app-tools/wire-progress.py
ANCHOR = "      const u = doc && doc.units && doc.units[UNIT];\n"
HOOK = ("      /* " + MARK + ": the whole record, not this unit - a child at the top of\n"
        "         a later lesson with earlier ones behind them has no `u` yet. */\n"
        "      try { if (window.__ehelSpiral) window.__ehelSpiral(doc && doc.units, UNIT); }\n"
        "      catch (_) { /* never break the lesson */ }\n")

# the warm-up's runner ends here; the bank goes after it so `say`/`shuffle`/`cheer`
# are in scope exactly as they are for the warm-up
TAIL = "  })();"

# every page must agree on which lNN each lesson is, or the bank cannot be shared
for l in cfg["lessons"]:
    s = io.open(os.path.join(G, l["file"]), encoding="utf-8", newline="").read()
    m = re.search(r'const UNIT = "(l\d\d)";', s)
    if not m:
        sys.exit("  REFUSED %s has no progress UNIT - run wire-progress.py first" % l["file"])
    UNIT_OF[l["file"][:-5]] = m.group(1)
assert len(set(UNIT_OF.values())) == 8, "two lessons share a progress unit id"

BANK = bank_js(UNIT_OF)
done = skipped = refused = 0
hashes = set()
for l in cfg["lessons"]:
    name = l["file"]
    p = os.path.join(G, name)
    s = io.open(p, encoding="utf-8", newline="").read()
    if MARK in s:
        print("  already  %s" % name)
        skipped += 1
        continue
    bad = [n for n, x in (("the warm-up", "ehel-warmup"), ("its bank", "const WARM"))
           if s.count(x) < 1]
    if s.count(ANCHOR) != 1:
        bad.append("the hydrate block is not there exactly once")
    # `  })();` closes several IIFEs in these pages, so COUNTING it proves
    # nothing: the guard has to be that the run from `const WARM` to the first
    # one is the warm-up's OWN runner.
    runner = None
    if not bad:
        try:
            runner = s[s.index("const WARM"):s.index(TAIL, s.index("const WARM")) + len(TAIL)]
        except ValueError:
            bad.append("no runner closes after const WARM")
    if runner is not None and ".eh-warm-ch" not in runner:
        bad.append("the first runner after const WARM is not the warm-up's")
    if bad:
        print("  REFUSED  %-30s %s" % (name, "; ".join(bad)))
        refused += 1
        continue
    end = s.index("const WARM") + len(runner)
    s = s[:end] + BANK + s[end:]
    s = s.replace(ANCHOR, ANCHOR + HOOK, 1)
    s = s.rstrip() + "\n" + STYLE
    # once where it is published, twice in the hydrate hook's guard and call
    assert s.count(MARK) >= 3 and s.count("window.__ehelSpiral") == 3
    hashes.add(hash(s[s.index("const SPIRAL = ["):s.index("  };", s.index("window.__ehelSpiral"))]))
    if WRITE:
        io.open(p, "w", encoding="utf-8", newline="").write(s)
    print("  %s %-30s %s" % ("wrote  " if WRITE else "would  ", name,
                             "draws from the other seven once they are finished"))
    done += 1

if done and len(hashes) != 1:
    sys.exit("  REFUSED the bank is not byte-identical across the pages (%d versions)" % len(hashes))
print("\n  %d item(s) in the bank, %d lesson(s) %s, %d skipped, %d refused%s"
      % (sum(len(i) for _, i in SPIRAL), done, "written" if WRITE else "to write",
         skipped, refused, "" if WRITE else "   (--write to apply)"))
sys.exit(1 if refused else 0)
