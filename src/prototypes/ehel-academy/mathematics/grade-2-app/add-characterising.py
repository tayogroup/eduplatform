# -*- coding: utf-8 -*-
"""Characterising and classifying, named: "Why do they go together?"

    python add-characterising.py            # report
    python add-characterising.py --write

THE TWO CHARACTERISTICS. Cambridge defines characterising as identifying and
describing the mathematical PROPERTIES of an object, and classifying as
organising objects into groups BY those properties. They are a pair and they run
in that order: say what is the same about these, then decide what else belongs.

WHY THIS IS A NAMING RATHER THAN A BUILD. Nine steps in this course already
classify - Odd or even?, Sort them into groups, Which unit?, Know your
money, Seconds to years, Equal parts first. A child sorts correctly in every one of
them and is never once asked to SAY what the rule was, which is the
characterising half and the half that transfers. So each of those steps gains a
three-item coda - what is the same about these, which one belongs with them,
which one does not - in the step that already does the sorting.

IT ADDS NO STEP, and that is the design constraint rather than a convenience.
Progress is recorded by step POSITION: a step inserted before the end-of-lesson
check moves the check's index, and every learner who had finished the lesson
sees it reopen. In this pass it has already happened three times. So this is a
block appended INSIDE an existing step, after its own runner, and finish() still
fires where it always did - the same rule the Support and Extension tiers keep.

IT DOES NOT SCORE. The step is already judged by its sorting. This is the
question a teacher asks after the sorting is right, and a wrong answer to it
should not take away a correctly sorted hoop.

THE INDEX IS DERIVED, NOT LISTED. Every TWM step in the build is stamped with
`data-twm` on its own <section>, by TITLE, and build-grownup-section.py reads
those stamps back to print the per-lesson index the Teacher's Guide has. Four
families are stamped, not one: this tool's steps, "How do you know?"
(convincing), "Spot the mistake" (critiquing and improving) and "Will it always
work?" (specialising and generalising). A hand-kept list of which step does what
would be wrong the first time a step is renamed.

CONJECTURING IS STILL NOT CLAIMED, and the hub says so. Forming your own
mathematical question is not something three buttons can carry, and stamping a
step with it to reach 8 of 8 would be exactly the tick this build keeps refusing
to take.

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

MARK = "ehel-characterising"
# the lesson script's own scope, and the one anchor that names it - see the
# insert below for what happens when a runner lands in the progress module
FINISH = "  function finish(i, msg)"
# Cambridge's eight, in the Guide's order. build-grownup-section.py refuses to
# render a stamp outside this list, but the check belongs HERE too: this is the
# tool that WRITES the stamps, and a vocabulary checked only by the reader is one
# a bad stamp gets past, into the pages, to be caught a step later by a tool
# somebody may not run.
TWM8 = ("specialising generalising conjecturing convincing characterising "
        "classifying critiquing improving").split()
MINE = "characterising classifying"

# The other three TWM families already in the build, stamped by the title of the
# step that carries them. Cambridge's own index is per question; this is per
# step, which is the finest grain these pages have.
STAMP = {
    "How do you know?": "convincing",
    "Spot the mistake": "critiquing improving",
    "Will it always work?": "specialising generalising",
}

# lesson -> (the step that already sorts, three items: characterise, then
# classify in, then classify out)
WORK = {
    "tens-and-ones": ("Odd or even?", [
        ("14, 26, 40 and 68. What is the same about all of them?",
         ["they are all even", "they are all odd", "they are all above 50"],
         "they are all even",
         "Each one splits into two equal groups with none left over, and each ends in an even digit."),
        ("Which number belongs with 14, 26, 40 and 68?", [52, 37, 45], 52,
         "52 ends in 2, so it splits into pairs with none left over. It is even like the others."),
        ("Which number does NOT belong with 15, 27, 33 and 49?", [60, 71, 85], 60,
         "15, 27, 33 and 49 are all odd. 60 ends in 0, so it is even."),
    ]),
    "coins-and-change": ("Know your money", [
        ("A 10 sh coin, a 20 sh coin and a 50 sh coin. What is the same about all of them?",
         ["they are all worth a whole number of tens", "they are all worth 10 sh",
          "they are all the same size"],
         "they are all worth a whole number of tens",
         "10, 20 and 50 are all made of whole tens, so you can count them all in tens."),
        ("Which coin belongs with the 10 sh, 20 sh and 50 sh coins?",
         ["a 100 sh coin", "a 5 sh coin", "a 1 sh coin"], "a 100 sh coin",
         "100 is a whole number of tens as well: ten tens. 5 and 1 are not."),
        ("Which does NOT belong in a group of coins worth more than 10 sh?",
         ["a 5 sh coin", "a 20 sh coin", "a 50 sh coin"], "a 5 sh coin",
         "The rule is worth MORE than 10 sh. 5 sh is less, so it stays outside."),
    ]),
    "fair-shares": ("Equal parts first", [
        ("A square in 2 equal parts, a circle in 4 equal parts, a strip in 3 equal parts. "
         "What is the same about all of them?",
         ["every part in each one is the same size", "each one is cut into 2 parts",
          "each one is a square"],
         "every part in each one is the same size",
         "The number of parts differs, but within each shape the parts are equal. That is what makes them fractions."),
        ("Which one belongs with them?",
         ["a cake cut into 5 equal slices", "a cake cut into one big and one small piece",
          "a cake with no cuts"],
         "a cake cut into 5 equal slices",
         "Five equal parts follows the same rule: the parts are all the same size."),
        ("Which one does NOT belong with shapes cut into equal parts?",
         ["two parts, one bigger than the other", "four parts the same size",
          "three parts the same size"],
         "two parts, one bigger than the other",
         "If the parts are not equal they are not fractions of the whole, however many there are."),
    ]),
    "patterns-that-grow": ("The part that repeats", [
        ("Red blue red blue. Clap stamp clap stamp. Circle square circle square. "
         "What is the same about all of them?",
         ["a part of two things repeats", "a part of three things repeats", "they all get bigger"],
         "a part of two things repeats",
         "In each one the same two things come round again and again."),
        ("Which pattern belongs with them?",
         ["up down up down", "1, 2, 3, 4, 5", "small bigger biggest"],
         "up down up down",
         "Up and down take turns, exactly like red and blue."),
        ("Which one does NOT belong with the repeating patterns?",
         ["2, 4, 6, 8, 10", "hop jump hop jump", "red blue red blue"],
         "2, 4, 6, 8, 10",
         "Counting in twos grows each time. Nothing in it comes round again."),
    ]),
    "sides-and-corners": ("Sides and corners", [
        ("A triangle, a square and a rectangle. What is the same about all of them?",
         ["every side is straight", "every side is curved", "they all have 3 sides"],
         "every side is straight",
         "You can run a finger along any side without it bending."),
        ("Which shape belongs with them?",
         ["a shape with 5 straight sides", "a circle", "a ball"],
         "a shape with 5 straight sides",
         "Its sides are straight too, so it goes in the same group."),
        ("Which one does NOT belong with a triangle, a square and a rectangle?",
         ["a circle", "a shape with 6 straight sides", "a shape with 4 straight sides"],
         "a circle",
         "A circle is one curved line all the way round. It has no straight sides at all."),
    ]),
    "which-way-from-here": ("Saying where", [
        ("Above, below, beside and between. What is the same about all of them?",
         ["they all say where something is", "they all say how big something is",
          "they all say how many"],
         "they all say where something is",
         "Every one of them describes a position: where one thing is compared with another."),
        ("Which word belongs with above, below, beside and between?",
         ["behind", "heavy", "seven"], "behind",
         "Behind says where something is as well. Heavy is about mass and seven is a number."),
        ("Which one does NOT belong with left, right, forwards and backwards?",
         ["taller", "sideways", "round"], "taller",
         "The others describe a direction you can move in. Taller compares heights."),
    ]),
    "how-much-how-long": ("Which unit?", [
        ("Centimetres, metres and kilometres. What is the same about all of them?",
         ["they all measure length", "they all measure mass", "they all measure time"],
         "they all measure length",
         "Every one of them tells you how long, how tall or how far something is."),
        ("Which unit belongs with grams and kilograms?",
         ["the mass of a bag of rice", "the length of a pencil", "the time a film takes"],
         "the mass of a bag of rice",
         "Grams and kilograms measure mass, which is how heavy something is."),
        ("Which does NOT belong with litres and millilitres?",
         ["how tall a door is", "how much a jug holds", "how much water is in a bottle"],
         "how tall a door is",
         "Litres measure capacity, which is how much a container holds. Height is a length."),
    ]),
    "half-past-quarter-to": ("Seconds to years", [
        ("A blink, a clap and saying your name. What is the same about all of them?",
         ["they all take about a second", "they all take about an hour",
          "they all take about a year"],
         "they all take about a second",
         "Each one is over almost as soon as it starts, which is what a second is."),
        ("Which one belongs with a school day, a football match and a long journey?",
         ["baking a cake", "blinking", "growing up"], "baking a cake",
         "Those are all measured in hours. A blink is seconds and growing up is years."),
        ("Which does NOT belong with a week, a month and a year?",
         ["a minute", "a fortnight", "a term"], "a minute",
         "The others are long stretches of days. A minute is 60 seconds."),
    ]),
    "count-it-chart-it": ("Sort them into groups", [
        ("A red circle, a red square and a red triangle. What is the same about all of them?",
         ["they are all red", "they are all circles", "they are all blue"],
         "they are all red",
         "The shapes are different. The colour is the property they share."),
        ("Which card belongs in the hoop for red things?",
         ["a red star", "a blue circle", "a blue square"], "a red star",
         "It is red, so it follows the rule, whatever shape it happens to be."),
        ("Which card does NOT belong in the hoop for shapes with straight sides?",
         ["a circle", "a square", "a triangle"], "a circle",
         "The rule is straight sides. A circle has none, whatever colour it is."),
    ]),
}

cfg = json.load(io.open(os.path.join(G, "app.config.json"), encoding="utf-8"))
ORDER = [l["file"][:-5] for l in cfg["lessons"]]

# ---- the audit, before a byte is written -------------------------------------
assert sorted(WORK) == sorted(ORDER), "every lesson needs a host step"
for _c in MINE.split() + " ".join(STAMP.values()).split():
    assert _c in TWM8, "%r is not one of Cambridge's eight characteristics" % _c
for key, (title, items) in WORK.items():
    assert len(items) == 3, "%s: characterise, classify in, classify out" % key
    # THE FIRST ITEM MUST BE THE CHARACTERISING ONE. The pair only teaches
    # anything in that order - say the property, then use it - and an edit that
    # reorders them would leave a step stamped `characterising` that never asks
    # for a property.
    assert items[0][0].rstrip().endswith("What is the same about all of them?"), \
        "%s: the first item must ask for the property" % key
    assert " NOT " in items[2][0], "%s: the third item must be the one that does not belong" % key
    for q, opts, a, why in items:
        assert len(opts) == 3, "%s: three options" % key
        assert a in opts, "%s: the answer must be one of the options" % key
        assert len(set(map(str, opts))) == 3, "%s: repeated option" % key
        for t in (q, why) + tuple(map(str, opts)):
            assert '"' not in t and "\\" not in t and "<" not in t, "%s: unsafe text %r" % (key, t)
        # Stage 2 is numbers to 100 (owner-confirmed), where Stage 1 was 20 -
        # reusing 20 here refuses correct content such as 26, 40 and 68.
        for n in re.findall(r"(?<![\w.])(\d+)(?!\d|\.\d)", q + " " + " ".join(map(str, opts))):
            assert int(n) <= 100, "%s: %s is past Stage 2's ceiling of 100" % (key, n)


def lit(v):
    return ('"%s"' % v) if isinstance(v, str) else str(v)


def esc(t):
    return t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")


BLOCK = ('\n      <div class="twm" id="twm%(n)s">'
         '<p class="twm-h">Why do they go together?</p>'
         '<div class="twm-say"><button type="button" class="speak" aria-label="Read it to me">&#128266;</button>'
         '<span class="twm-q"></span></div>'
         '<div class="choices twm-ch"></div>'
         '<p class="fb" role="status" aria-live="polite"></p>'
         '<p class="score twm-sc"></p>'
         # the build's own Next button, class for class - a .next of my own would
         # be a second button style on a page that already has one
         '<div class="bigbtns"><button type="button" class="big small teal twm-next" hidden>'
         'Next question</button></div>'
         '</div>\n    ')


def runner_js(n, items):
    rows = ",\n    ".join("{ q: %s, opts: [%s], a: %s, why: %s }"
                          % (lit(q), ", ".join(lit(o) for o in opts), lit(a), lit(why))
                          for q, opts, a, why in items)
    return """
  /* ---- """ + MARK + """: characterising, then classifying - see add-characterising.py.
     The sorting above is already judged and already called finish(). This is the
     question a teacher asks AFTER the sorting is right: say what the rule was.
     It adds no step and it does not score. */
  const TWM""" + n + """ = [
    """ + rows + """
  ];
  (function () {
    const w = document.getElementById("twm""" + n + """"); if (!w) return;
    const ch = w.querySelector(".twm-ch"), fb = w.querySelector(".fb"),
          sc = w.querySelector(".twm-sc"), nx = w.querySelector(".twm-next");
    let k = 0;
    function paint() {
      const t = TWM""" + n + """[k];
      w.querySelector(".twm-q").textContent = t.q;
      ch.innerHTML = shuffle(t.opts.slice()).map((o) =>
        '<button type="button" class="choice" data-v="' + o + '">' + o + "</button>").join("");
      fb.className = "fb"; fb.textContent = "";
      sc.textContent = "Question " + (k + 1) + " of " + TWM""" + n + """.length;
      nx.hidden = true;
    }
    ch.addEventListener("click", (e) => {
      const b = e.target.closest(".choice"); if (!b || b.disabled) return;
      const t = TWM""" + n + """[k], ok = String(b.dataset.v) === String(t.a);
      ch.querySelectorAll(".choice").forEach((c) => {
        c.disabled = true;
        if (String(c.dataset.v) === String(t.a)) c.classList.add("right");
      });
      if (!ok) b.classList.add("wrong");
      const last = k === TWM""" + n + """.length - 1;
      const msg = (ok ? cheer() + " " : "Good try. ") + t.why
        + (last ? " That is what the rule was all along." : "");
      fb.className = "fb" + (ok ? " good" : ""); fb.textContent = msg; say(msg);
      nx.hidden = last;
    });
    nx.addEventListener("click", () => { k += 1; paint(); });
    paint();
  })();"""


STYLE = """
<style>/* """ + MARK + """ - see add-characterising.py */
  .twm { margin: 16px 0 0; padding: 14px 16px 16px; border-radius: 18px;
    border: 2px dashed var(--line); }
  .twm-h { margin: 0 0 10px; font-family: "Inter", "Segoe UI", sans-serif;
    font-weight: 700; font-size: 14px; letter-spacing: .06em; text-transform: uppercase;
    color: var(--muted); }
  /* mirrors .say under its own class, so the Explain button never finds it -
     it looks for the FIRST .say in the slide and would read this instead */
  .twm-say { display: flex; align-items: center; gap: 12px; padding: 12px 16px;
    border-radius: 16px; background: var(--cell); font-size: 20px; }
  .twm-say button { flex: 0 0 auto; width: 52px; height: 52px; border-radius: 50%;
    border: 0; background: var(--teal, #2BB3A6); color: #06231F; font-size: 24px;
    display: grid; place-items: center; cursor: pointer; }
  .twm-say button:active { transform: scale(0.94); }
  .twm-ch { margin-top: 12px; }
  .twm-sc { margin: 10px 0 0; }
</style>
"""

done = skipped = refused = 0
for l in cfg["lessons"]:
    name, key = l["file"], l["file"][:-5]
    p = os.path.join(G, name)
    s = io.open(p, encoding="utf-8", newline="").read()
    if MARK in s:
        print("  already  %s" % name)
        skipped += 1
        continue
    title, items = WORK[key]

    starts = [m.start() for m in re.finditer(r'<section class="slide"', s)]
    host = None
    bad = []
    for i, a in enumerate(starts):
        b = starts[i + 1] if i + 1 < len(starts) else len(s)
        if "<h2>%s</h2>" % title in s[a:b]:
            if host is not None:
                bad.append("two steps are titled %r" % title)
            host = (a, b)
    if host is None:
        bad.append("no step titled %r" % title)
    if s.count(FINISH) != 1:
        bad.append("no single finish() to sit above")
    if bad:
        print("  REFUSED  %-30s %s" % (name, "; ".join(bad)))
        refused += 1
        continue

    a, b = host
    sec = s[a:b]
    n = re.search(r'<div class="slide-head"><span class="n">(\d+)</span>', sec)
    if not n:
        print("  REFUSED  %-30s %r has no step number" % (name, title))
        refused += 1
        continue
    n = n.group(1)
    # the block goes at the END of the step, under whatever the step already draws
    end = sec.rindex("</section>")
    sec2 = sec[:end] + (BLOCK % {"n": n}) + sec[end:]
    # and the stamp goes on the section tag itself
    sec2 = sec2.replace('<section class="slide"',
                        '<section class="slide" data-twm="%s"' % MINE, 1)
    s = s[:a] + sec2 + s[b:]

    # the other three families, by title, on their own section tags
    for t, chars in STAMP.items():
        st = [m.start() for m in re.finditer(r'<section class="slide"', s)]
        for i, x in enumerate(st):
            y = st[i + 1] if i + 1 < len(st) else len(s)
            if "<h2>%s</h2>" % t in s[x:y] and "data-twm" not in s[x:s.index(">", x)]:
                s = (s[:x] + s[x:y].replace('<section class="slide"',
                                            '<section class="slide" data-twm="%s"' % chars, 1)
                     + s[y:])
                break

    # THE RUNNER GOES ABOVE finish(), IN THE LESSON'S OWN SCRIPT. The obvious
    # anchor - the LAST `  })();` in the file - is in the progress <script
    # type="module"> at the foot of the page, which is a different scope: the
    # block rendered its question, then threw on `shuffle` and drew no options at
    # all. It set the text first, so the step LOOKED built and was dead.
    at = s.index(FINISH)
    s = s[:at] + runner_js(n, items).lstrip("\n") + "\n" + s[at:]
    s = s.rstrip() + "\n" + STYLE

    stamped = len(re.findall(r'data-twm="', s))
    # the marker rides on the runner and on the stylesheet; the block is found
    # by its id, which is the step number and so unique in the page
    assert s.count(MARK) == 2 and s.count('id="twm%s"' % n) == 1
    # THE SCRIPT THE RUNNER LANDED IN MUST DEFINE WHAT IT CALLS. This is the
    # guard for the failure above, and it is worth the four lines: a runner in
    # the wrong <script> threw on `shuffle` AFTER writing the question text, so
    # the block looked built, drew no options, and no check on the page's markup
    # could have told the difference.
    i = s.index("const TWM%s" % n)
    region = s[s.rindex("<script", 0, i):s.index("</script>", i)]
    for nm in ("shuffle", "cheer", "say"):
        if not re.search(r"(?:function|const|let|var)\s+%s\b" % nm, region):
            sys.exit("  REFUSED %s: the runner landed in a script that does not define "
                     "%s() - it would throw at load" % (name, nm))
    if WRITE:
        io.open(p, "w", encoding="utf-8", newline="").write(s)
    print("  %s %-30s on %r (step %s); %d step(s) stamped"
          % ("wrote  " if WRITE else "would  ", name, title, n, stamped))
    done += 1

print("\n  %d lesson(s) %s, %d skipped, %d refused%s"
      % (done, "written" if WRITE else "to write", skipped, refused,
         "" if WRITE else "   (--write to apply)"))
sys.exit(1 if refused else 0)
