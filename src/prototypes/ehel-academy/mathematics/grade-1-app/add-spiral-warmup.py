# -*- coding: utf-8 -*-
"""The warm-up draws from every lesson the child has already FINISHED, not just
the one before it.

    python add-spiral-warmup.py            # report
    python add-spiral-warmup.py --write

THE GAP. add-warmup.py gives each lesson a recap line naming the previous lesson
and one question about TODAY's topic - a diagnostic, which is what area 11 asked
for and is not retrieval. Nothing in the build ever RE-ASKS an earlier lesson:
each end-of-lesson check covers its own lesson and stops. So a child who learnt
halves in lesson 3 is never asked about halves again, and Cambridge's volume
comes from exactly that - the spiral, not example count. This is the cheap half
of closing it: one extra question at the top of the lesson, drawn from what they
have already finished.

WHAT "FINISHED" MEANS, and why it is not counted here. `units[lNN].completed` is
set by the reducer on `unit.completed` (shared/progress-client.js) and returned
by the server's public_state() untouched, so the same flag answers for a local
session and for a school launch. The alternative - comparing sectionsDone
against a per-lesson step total - would need this tool to know how many steps
every OTHER lesson has, and the step counts moved three times in one week: a
stale total reads as "not finished" and silently switches the spiral off.

HOW IT GETS THE RECORD. `window.__ehelSpiral(units)`, called from the page's own
hydrate block, beside the existing `window.__ehelRestore` call and for the same
reason: hydrate is asynchronous and is the only thing that knows. It is inserted
ABOVE `if (!u) return;` deliberately - that line returns when THIS lesson has no
record yet, which is exactly the child standing at the top of lesson 3 with
lessons 1 and 2 behind them.

THE BANK IS IDENTICAL IN ALL SEVEN PAGES, and the audit asserts it by hash. Each
page filters out its own lesson at runtime instead of shipping a different
subset, so seven files cannot drift into seven banks.

IT IS NOT A STEP - no sticker, no dot, no score, no finish(). Same rule as the
warm-up it sits inside, and for the same reason: a real slide would renumber
every finish(), the sticker shelf and explorationSteps.

WRITTEN IN THE SHAPE check-answer-keys.py CAN READ - one flat `const SPIRAL = [
{ from, q, opts, a, why } ]`, not an object of per-lesson arrays. That gate finds
question objects inside anything matching `= [`, so a bank nested under `l01:`
would be invisible to it, which is the `items:` failure this build has already
had once. The cost is that the same 21 items are harvested in each of the seven
pages; the report's totals move by 147 and the questions are checked seven times.

Guarded by a marker; every anchor must match exactly once or the file is refused.
"""
import io, json, os, re, sys

sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))
G = os.path.join(HERE, "g1v2")
WRITE = "--write" in sys.argv[1:]
for a in sys.argv[1:]:
    if a != "--write":
        sys.exit("unrecognised argument: %s" % a)

MARK = "ehel-spiral"

# Three per lesson, each pinned to something that lesson actually teaches, all
# answers inside Stage 1 (0-20), three options so a guess is a third rather than
# a coin. `why` says why the answer is right; the runner adds which lesson it
# came from, so the lesson name is never written twice.
SPIRAL = [
    ("counting-to-twenty",
     [("Which number is odd: 6, 7 or 10?", [7, 6, 10], 7,
       "7 things cannot all go into pairs - one is always left over."),
      ("Which is the biggest: 9, 12 or 11?", [12, 9, 11], 12,
       "Count them in order: 9, 11, 12. The biggest comes last."),
      ("You have 5 counters and take all 5 away. How many are left?", [0, 5, 1], 0,
       "None left is zero.")]),
    ("adding-and-taking-away",
     [("What goes with 6 to make 10?", [4, 3, 16], 4,
       "6 and 4 make 10. That is a pair that makes 10."),
      ("Double 5 is...", [10, 7, 15], 10,
       "Double means the same number twice: 5 and 5 make 10."),
      ("8 take away 3 is...", [5, 11, 4], 5,
       "Count back from 8: 7, 6, 5.")]),
    ("halves-and-wholes",
     [("Half of 8 is...", [4, 2, 16], 4,
       "8 split into two equal parts is 4 and 4."),
      ("Two halves make...", ["a whole", "a half", "two wholes"], "a whole",
       "Put the two equal parts back together and you have the whole thing again."),
      ("Share 6 sweets fairly between 2 people. How many each?", [3, 6, 2], 3,
       "6 shared into two equal parts is 3 each.")]),
    ("what-comes-next",
     [("Count in twos: 4, 6, 8. What comes next?", [10, 9, 12], 10,
       "Counting in twos goes up by 2 each time, so 8 and 2 more is 10."),
      ("3 and how many more make 7?", [4, 3, 10], 4,
       "3 and 4 make 7."),
      ("Count back: 9, 8, 7. What comes next?", [6, 8, 10], 6,
       "Counting back goes down by 1 each time.")]),
    ("shapes-and-sizes",
     [("How many sides has a square?", [4, 3, 5], 4,
       "A square has 4 straight sides, all the same length."),
      ("Which shape has no corners?", ["circle", "square", "triangle"], "circle",
       "A circle is one curved line all the way round, so it has no corners."),
      ("Which holds more: a jug or a cup?", ["the jug", "the cup", "the same"], "the jug",
       "You can pour a cup into a jug and there is still room.")]),
    ("days-months-and-clocks",
     [("What day comes after Monday?", ["Tuesday", "Sunday", "Friday"], "Tuesday",
       "The week goes Monday, Tuesday, Wednesday."),
      ("How many months are in a year?", [12, 7, 10], 12,
       "There are 12 months, from January to December."),
      ("The short hand is on 3 and the long hand is on 12. What time is it?",
       ["3 o'clock", "12 o'clock", "half past 3"], "3 o'clock",
       "The short hand tells you the hour, and the long hand on 12 means o'clock.")]),
    ("asking-and-sorting",
     [("4 people said mango and 2 said banana. Which had more?",
       ["mango", "banana", "the same"], "mango",
       "4 is more than 2, so mango had more."),
      ("One hoop is for red things. One hoop is for squares. Where does a red square go?",
       ["in both hoops", "in the red hoop only", "outside both hoops"], "in both hoops",
       "A red square is red and it is a square, so it belongs where the two hoops cross."),
      ("A block graph shows 5 blocks for cats and 3 for dogs. How many more cats?",
       [2, 8, 3], 2,
       "5 take away 3 is 2, so there are 2 more cats.")]),
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
        # Stage 1 is 0 to 20. A distractor past it teaches a number the child has
        # not met, and this build has been caught doing exactly that with 26 and 45.
        for n in re.findall(r"(?<![\w.])(\d+)(?!\d|\.\d)", q + " " + " ".join(map(str, opts))):
            assert int(n) <= 20, "%s: %s is past Stage 1" % (key, n)

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
     FINISHED - see add-spiral-warmup.py. Cambridge's volume comes from the
     spiral, and nothing here re-asked an earlier lesson. Like the warm-up above
     it: not a step, no sticker, no dot, no score. */
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
        "         lesson 3 with lessons 1 and 2 behind them has no `u` yet. */\n"
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
assert len(set(UNIT_OF.values())) == 7, "two lessons share a progress unit id"

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
    # `  })();` closes a dozen IIFEs in these pages, so COUNTING it proves
    # nothing: the guard has to be that the run from `const WARM` to the first
    # one is the warm-up's OWN runner. Without this the bank would be appended
    # after whichever IIFE happened to close first, silently.
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
    # the warm-up's IIFE is the FIRST `  })();` after `const WARM` - proved to
    # be that one by the guard above. NOT after the marker: `ehel-warmup`
    # appears again in the stylesheet at the foot of the page, and searching
    # from there finds no runner at all.
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
                             "draws from the other six once they are finished"))
    done += 1

if done and len(hashes) != 1:
    sys.exit("  REFUSED the bank is not byte-identical across the pages (%d versions)" % len(hashes))
print("\n  %d item(s) in the bank, %d lesson(s) %s, %d skipped, %d refused%s"
      % (sum(len(i) for _, i in SPIRAL), done, "written" if WRITE else "to write",
         skipped, refused, "" if WRITE else "   (--write to apply)"))
sys.exit(1 if refused else 0)
