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
"Cambridge leads" for Grade 3 and 4 because of exactly that gap.

HOW IT GETS THE RECORD, WHY IT PATCHES THE BUILT PAGE, and THE BANK IS
IDENTICAL IN ALL EIGHT PAGES: unchanged from grade-1-app's version of this
tool and from grade-3-app's port of it - see either header for the full
reasoning on `units[lNN].completed`, `window.__ehelSpiral`, hydrate ordering
and the flat-array shape check-answer-keys.py needs.

THE QUESTIONS ARE NEW, pinned to what each lesson actually teaches, with a
generous numeric ceiling (Stage 4 reaches five-digit numbers and below zero,
unlike Stage 1's 0-20) rather than Stage 3's stricter cap. Two things checked
against the lessons' own wording before writing them: this build's "Shape and
Measures" atHome text already uses "acute" and "obtuse" (Stage 4's own
vocabulary, one stage past Stage 3's "smaller/bigger than a right angle"
phrasing), so the spiral question for it does too; and three questions were
rewritten because a first draft duplicated a lesson's own warmUp text nearly
word for word, which would have asked a child the identical question twice.

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

# Three per lesson, each pinned to something that lesson actually teaches.
# Stage 4 reaches five-digit numbers and below zero, so the ceiling here is
# generous rather than tight - it exists to catch a typo, not to bound the
# stage.
SPIRAL = [
    ("big-numbers-below-zero",
     [("What is the 5 worth in 5,240?", [5000, 500, 50], 5000,
       "The 5 is in the thousands column, so it is worth 5000."),
      ("Which is colder: -3 degrees or -8 degrees?",
       ["-8 degrees", "-3 degrees", "they are the same"], "-8 degrees",
       "The further a negative number is from zero, the colder it is - -8 is further from zero than -3."),
      ("Which is bigger: 4,082 or 4,820?", [4082, 4820, 4028], 4820,
       "Compare the hundreds: 8 hundreds is more than 0 hundreds, so 4,820 is bigger.")]),
    ("patterns-and-squares",
     [("Is 15 odd or even?", ["odd", "even", "both"], "odd",
       "15 counters make 7 pairs and 1 left over, so 15 is odd."),
      ("What is 4 squared - 4 times 4?", [16, 8, 44], 16,
       "4 rows of 4 make a square of 16."),
      ("You add two odd numbers together. Is the answer always odd or always even?",
       ["always even", "always odd", "it depends"], "always even",
       "Two odd numbers always pair up completely with nothing left over, so the answer is always even.")]),
    ("ways-to-calculate",
     [("You estimate 396 add 205 by rounding to the nearest hundred. What is your estimate?",
       [600, 500, 700], 600,
       "396 rounds to 400 and 205 rounds to 200, and 400 add 200 is 600."),
      ("Which pair of numbers multiplies to make 12, using 3?",
       ["3 and 4", "3 and 9", "3 and 12"], "3 and 4",
       "3 times 4 is 12, so 3 and 4 are a factor pair of 12."),
      ("What is 48 divided by 6?", [8, 6, 42], 8,
       "6 times 8 is 48, so 48 divided by 6 is 8.")]),
    ("parts-of-a-whole",
     [("Which is bigger: three eighths or one half?",
       ["one half", "three eighths", "they are equal"], "one half",
       "One half is the same as four eighths, and four eighths is more than three eighths."),
      ("What is a quarter of 20?", [5, 4, 10], 5,
       "20 shared into 4 equal groups is 5 in each group."),
      ("What is 50% of a number the same as?",
       ["half of it", "a quarter of it", "all of it"], "half of it",
       "50 out of 100 is the same amount as one half.")]),
    ("telling-the-time",
     [("What is 15:00 in 12-hour time?",
       ["3 o'clock", "5 o'clock", "1 o'clock"], "3 o'clock",
       "15:00 is 12 hours plus 3 more, which is 3 o'clock in the afternoon."),
      ("A bus leaves at 09:40 and the journey takes 25 minutes. What time does it arrive?",
       ["10:05", "09:65", "10:15"], "10:05",
       "40 minutes plus 25 minutes is 65 minutes, which is 1 hour and 5 minutes, so it arrives at 10:05."),
      ("Which is longer: 90 minutes, or 1 hour and a half?",
       ["they are the same", "90 minutes", "1 hour and a half"], "they are the same",
       "90 minutes is 60 minutes plus 30 more, which is exactly 1 hour and a half.")]),
    ("shape-and-measures",
     [("An angle is smaller than a right angle. What is it called?",
       ["acute", "obtuse", "reflex"], "acute",
       "An angle smaller than a right angle is called acute."),
      ("A rectangle is 4 cm by 5 cm. What is its area?", [20, 18, 9], 20,
       "Area is length times width: 4 times 5 is 20 square centimetres."),
      ("A shape has one line of symmetry. If you fold it exactly on that line, what happens to the two halves?",
       ["they match exactly", "they overlap unevenly", "nothing happens"], "they match exactly",
       "A line of symmetry is exactly where a shape folds so both halves match.")]),
    ("where-things-are",
     [("To reach the point (3, 2) from the start, which do you do first?",
       ["go along 3, then up 2", "go up 2, then along 3", "go along 2, then up 3"],
       "go along 3, then up 2",
       "A coordinate is always read along first, then up."),
      ("You face east and turn to face south. Which way did you turn?",
       ["a quarter turn clockwise", "a quarter turn anticlockwise", "a half turn"],
       "a quarter turn clockwise",
       "East to south is one quarter turn in the clockwise direction."),
      ("A shape is reflected in a mirror line that touches one of its edges. What happens to that edge?",
       ["it stays exactly where it is", "it moves to the opposite side", "it disappears"],
       "it stays exactly where it is",
       "An edge sitting exactly on the mirror line does not move, because it is its own reflection.")]),
    ("asking-sorting-chance",
     [("A Venn diagram has a circle for red and a circle for square. Where does a red square go?",
       ["in both circles, where they overlap", "in the red circle only", "outside both circles"],
       "in both circles, where they overlap",
       "A red square is red and a square, so it belongs where the two circles cross."),
      ("Which is more likely: picking a red counter from a bag of 8 red and 2 blue, or a fair coin landing tails?",
       ["the red counter", "the coin landing tails", "they are the same"], "the red counter",
       "8 out of 10 counters are red, which is more likely than a fair coin's 1 out of 2 chance."),
      ("An event is described as impossible. What is the chance it happens?",
       ["no chance at all", "a small chance", "a certain chance"], "no chance at all",
       "Impossible means it cannot happen, so there is no chance at all.")]),
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
        # a generous ceiling to catch a typo, not to bound Stage 4's own range
        for n in re.findall(r"(?<![\w.])(\d+)(?!\d|\.\d)", q + " " + " ".join(map(str, opts))):
            assert int(n) <= 100000, "%s: %s looks like a typo, not a Stage 4 number" % (key, n)

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
