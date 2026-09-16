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
# Grade 2 keeps its lessons in the app root, where Grade 1 has a g1v2/ subfolder
G = HERE
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
    ("tens-and-ones",
     [("Which is more: 47 or 74?", [74, 47, 44], 74,
       "74 has 7 tens and 47 has only 4, so 74 is more. Compare the tens first."),
      ("Round 62 to the nearest 10.", [60, 70, 62], 60,
       "62 is 2 away from 60 and 8 away from 70, so it rounds to 60."),
      ("4 rows of 5 counters is how many altogether?", [20, 9, 45], 20,
       "An array of 4 rows of 5 counts in fives: 5, 10, 15, 20.")]),
    ("coins-and-change",
     [("What is 25 sh and 25 sh altogether?", [50, 40, 55], 50,
       "The tens make 40 and the ones make 10, so it is 50 sh."),
      ("A pen costs 20 sh. You pay with 50 sh. What is the change?", [30, 70, 20], 30,
       "Count on from 20 to 50: that is 30 sh change."),
      ("Which is worth more: three 10 sh coins, or one 20 sh coin?",
       ["three 10 sh coins", "one 20 sh coin", "they are the same"], "three 10 sh coins",
       "Three 10 sh coins make 30 sh, and 30 is more than 20.")]),
    ("fair-shares",
     [("What is half of 20?", [10, 5, 40], 10,
       "20 shared into two equal groups is 10 and 10."),
      ("Which is bigger: one half or one quarter?",
       ["one half", "one quarter", "they are the same"], "one half",
       "Cut the same thing into 2 instead of 4 and each piece is bigger."),
      ("How many quarters make one whole?", [4, 2, 8], 4,
       "Four equal parts fit back together into the whole.")]),
    ("patterns-that-grow",
     [("Count on in fives: 15, 20, 25. What comes next?", [30, 26, 35], 30,
       "Every jump is 5, so 25 and 5 more is 30."),
      ("Count back in tens from 60. What comes next?", [50, 59, 70], 50,
       "Counting back in tens takes away a whole ten: 60, 50, 40."),
      ("In 2, 4, 6, 8 how big is each jump?", [2, 1, 4], 2,
       "Take each number from the next: every jump is 2.")]),
    ("sides-and-corners",
     [("How many corners has a rectangle?", [4, 3, 6], 4,
       "A rectangle has 4 straight sides and 4 corners."),
      ("Which solid shape has no flat faces at all?",
       ["a sphere", "a cube", "a cylinder"], "a sphere",
       "A sphere is curved all over. A cube has 6 flat faces and a cylinder has 2."),
      ("A shape folds so both halves match exactly. What is that fold called?",
       ["a line of symmetry", "a corner", "a curved side"], "a line of symmetry",
       "A line of symmetry splits a shape into two halves that land on top of each other.")]),
    ("which-way-from-here",
     [("How many quarter turns make a whole turn?", [4, 2, 3], 4,
       "Four quarter turns take you all the way round to where you started."),
      ("You face the door and make a half turn. What do you face?",
       ["the way you came", "the door still", "the floor"], "the way you came",
       "A half turn is two quarter turns, and it faces you back the way you came."),
      ("In a mirror, which way does the picture face?",
       ["the other way", "the same way", "upside down"], "the other way",
       "A mirror turns a picture over, so it faces the other way.")]),
    ("how-much-how-long",
     [("How many centimetres make 1 metre?", [100, 10, 60], 100,
       "It takes 100 centimetres to make 1 metre."),
      ("Which unit tells you how heavy something is?",
       ["grams", "centimetres", "litres"], "grams",
       "Grams and kilograms measure mass. Centimetres measure length and litres measure capacity."),
      ("A jug's water is halfway between the 20 and the 30 marks. What does it read?",
       [25, 20, 30], 25,
       "Halfway from 20 to 30 is 25. Look at the small marks between the numbers.")]),
    ("half-past-quarter-to",
     [("How many minutes are there in one hour?", [60, 100, 30], 60,
       "An hour is 60 minutes, whatever time of day it is."),
      ("The long hand points at the 9. Is it quarter past or quarter to?",
       ["quarter to", "quarter past", "half past"], "quarter to",
       "Quarter past is at the 3 and quarter to is at the 9, three quarters of the way round."),
      ("Moving from one number to the next on a clock is how many minutes?", [5, 1, 10], 5,
       "Count round the clock face in fives: 5, 10, 15.")]),
    ("count-it-chart-it",
     [("In a tally chart, how many is one gate?", [5, 4, 10], 5,
       "Four lines and a fifth across them make a gate of five."),
      ("On a block graph where one block is one child, what does the tallest bar mean?",
       ["the most children chose it", "the fewest chose it", "it was drawn first"],
       "the most children chose it",
       "Each block stands for one child, so the tallest stack is the most children."),
      ("A coin has landed on heads three times. What happens next?",
       ["heads and tails are still equally likely", "tails is certain", "heads is certain"],
       "heads and tails are still equally likely",
       "The coin does not remember. Every toss is exactly like the first one.")]),
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
        # Stage 2 is numbers to 100 (owner-confirmed). Reusing Stage 1's 20 here
        # would refuse correct content - 47, 62, 74 and 100 are all Stage 2's.
        for n in re.findall(r"(?<![\w.])(\d+)(?!\d|\.\d)", q + " " + " ".join(map(str, opts))):
            assert int(n) <= 100, "%s: %s is past Stage 2" % (key, n)

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
assert len(set(UNIT_OF.values())) == 9, "two lessons share a progress unit id"

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
                             "draws from the other eight once they are finished"))
    done += 1

if done and len(hashes) != 1:
    sys.exit("  REFUSED the bank is not byte-identical across the pages (%d versions)" % len(hashes))
print("\n  %d item(s) in the bank, %d lesson(s) %s, %d skipped, %d refused%s"
      % (sum(len(i) for _, i in SPIRAL), done, "written" if WRITE else "to write",
         skipped, refused, "" if WRITE else "   (--write to apply)"))
sys.exit(1 if refused else 0)
