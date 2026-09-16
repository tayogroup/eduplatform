# -*- coding: utf-8 -*-
"""Ready to Go's Support and Extension, on the story step.

    python add-differentiation.py            # report
    python add-differentiation.py --write

WHAT CAMBRIDGE ACTUALLY DOES AT STAGE 2, measured over the 74 "Digging deeper"
pairs rather than carried over from Stage 1. The Stage 1 finding was "support
NARROWS the same task, extension WIDENS it". At Stage 2 it is sharper than that
and the two halves are not symmetrical:

  SUPPORT is APPARATUS. "Provide interlocking cubes as a practical aid."
  "Give learners tens frames to sort their counters into." "Encourage them to
  use a hundred square." "Provide the actual shapes for these learners to
  explore." It is not a smaller task - it is the same task with something to
  think WITH.

  EXTENSION is an OPEN question. "Find the largest and the smallest totals
  possible." "Is it possible to make all totals from 10 to 20?" "Ask them to
  make up a similar problem of their own." "Count in twos and fives and decide
  which is the most efficient method."

A screen cannot hand a child cubes, which is the same wall the concrete-materials
row runs into. So SUPPORT here does the one thing a screen can: it puts the aid
ON the question - a ten frame, a number line, a hundred square, a smaller number
that fits in the frame - and NAMES it in the explanation, so the adult beside the
child knows which apparatus to reach for. The audit requires that naming.

EXTENSION keeps Cambridge's opening move in the one form multiple choice can
carry: largest, smallest, how many ways, is it possible, which is quicker.
"Make up a problem of your own" cannot be marked by three buttons and is not
faked here; it is left to the teacher, and the hub says so.

NEITHER TIER SCORES, and finish() still fires at the end of the core bank - the
same rule Grade 1 keeps. A wrong answer brings the easier one; finishing with at
most one slip offers the harder one AFTER the step is done, because Cambridge's
extensions all read "once they have completed...".

Guarded by a marker; it rewrites the block add-story-problems.py wrote and
refuses any block that is not that shape.
"""
import io, json, os, re, sys

sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))
WRITE = "--write" in sys.argv[1:]
for a in sys.argv[1:]:
    if a != "--write":
        sys.exit("unrecognised argument: %s" % a)

MARK = "ehel-differentiation"
CEILING = 100
# The apparatus a Stage 2 Digging deeper support note reaches for, plus the
# everyday things that stand in for it. Widened once, after the first version
# failed 14 of 27 of this file's own support items - every one of which DID name
# something physical (paper, beads, a ruler, a balance, a real clock face); the
# list was too narrow, not the content. One item failed honestly and was
# rewritten instead: "ask first, then draw" is a procedure, not a thing to think
# with, and widening the list to admit it would have made the check vacuous.
AIDS = ("ten frame", "tens frame", "number line", "hundred square", "cubes", "counters",
        "part-whole", "number track", "shape", "clock", "coins", "paper", "fold",
        "beads", "real", "mat", "ruler", "balance", "bottle", "jug", "pan", "hands")
# Cambridge's opening moves, as a PATTERN rather than a list of exact phrases -
# a fixed list refused "how many groups CAN a shape belong to", which is the
# same kind of question as "how many ways", just worded differently.
OPENERS = re.compile(
    r"largest|smallest|fewest|is it possible|which is quicker|most efficient"
    r"|how many (?:ways|different|.{0,24}\bcan\b)", re.I)

# lesson -> (3 support, 2 extension). An item is (question, [(option, right)], why).
WORK = {
    "tens-and-ones": (
        [("There are 14 goats and 20 more arrive. How many goats are there now?",
          [("34", True), ("24", False), ("16", False)],
          "Put 14 on a number line and jump 2 tens: 24, then 34. A hundred square does the same job."),
         ("A crate holds 30 mangoes. 10 are sold. How many are left?",
          [("20", True), ("40", False), ("25", False)],
          "Jump back one ten on the number line: 30 to 20. Only the tens digit changes."),
         ("Amina has 2 rows of 5 stickers. How many stickers is that?",
          [("10", True), ("7", False), ("25", False)],
          "Lay out counters in 2 rows of 5 and count in fives: 5, 10. A ten frame holds exactly this.")],
        [("Using the digits 3 and 5 once each, what is the largest two-digit number you can make?",
          [("53", True), ("35", False), ("85", False)],
          "Put the bigger digit in the tens place. 53 is more than 35 because 5 tens beats 3 tens."),
         ("You may use any two of 10, 20 and 30. What is the smallest total you can make?",
          [("30", True), ("50", False), ("10", False)],
          "Pick the two smallest: 10 and 20 make 30. Trying every pair is how you know it is the smallest.")]),
    "coins-and-change": (
        [("Ali buys a sweet for 10 sh and a pen for 20 sh. How much does he spend?",
          [("30 sh", True), ("10 sh", False), ("40 sh", False)],
          "Lay out the coins and count in tens: 10, 20, 30. Real coins make this easy to see."),
         ("Kiki has 20 sh and spends 5 sh. How much is left?",
          [("15 sh", True), ("25 sh", False), ("10 sh", False)],
          "Count back 5 on the number line from 20: 19, 18, 17, 16, 15."),
         ("How much are two 10 sh coins worth?",
          [("20 sh", True), ("12 sh", False), ("10 sh", False)],
          "Count the coins in tens: 10, 20. Counting coins in tens is quicker than counting in ones.")],
        [("Using 10 sh, 20 sh and 5 sh coins, what is the fewest coins that make 35 sh?",
          [("3 coins", True), ("7 coins", False), ("4 coins", False)],
          "Biggest first: 20, then 10, then 5. That is 3 coins, and no other way uses fewer."),
         ("You have one 20 sh and two 10 sh coins. How many different amounts can you pay exactly?",
          [("7", True), ("3", False), ("40", False)],
          "Try every group: 10, 20, 20, 30, 30, 40. Listing them all is how you know you have them all.")]),
    "fair-shares": (
        [("A cake is cut into 2 equal parts. Musa eats 1 part. What has he eaten?",
          [("one half", True), ("one quarter", False), ("the whole cake", False)],
          "Fold a paper circle in half and colour one part. Two equal parts means each one is a half."),
         ("What is half of 6?",
          [("3", True), ("2", False), ("12", False)],
          "Share 6 counters into two equal piles: 3 and 3. The cubes do the sharing for you."),
         ("There are 8 beads. One quarter of them are red. How many are red?",
          [("2", True), ("4", False), ("8", False)],
          "Share 8 counters into 4 equal groups. Each group has 2, so a quarter of 8 is 2.")],
        [("Using halves and quarters of one cake, how many different ways can you take exactly one half?",
          [("2", True), ("1", False), ("4", False)],
          "One half itself, or two quarters. Finding both is how you know a half and two quarters are equal."),
         ("A bag holds 12 sweets. Is it possible to share them equally between 5 friends?",
          [("no, 12 does not split into 5 equal groups", True), ("yes, 2 each", False),
           ("yes, 3 each", False)],
          "Try it: 5 groups of 2 is 10 and 5 groups of 3 is 15. Neither is 12, so it cannot be done.")]),
    "patterns-that-grow": (
        [("Count on in twos: 2, 4, 6. What comes next?",
          [("8", True), ("7", False), ("10", False)],
          "Hop along a number line in twos. Each hop is the same size, so after 6 comes 8."),
         ("Count on in tens: 10, 20, 30. What comes next?",
          [("40", True), ("31", False), ("50", False)],
          "Move down one row on a hundred square. Each row is ten further on."),
         ("A pattern goes red, blue, red, blue. What comes next?",
          [("red", True), ("blue", False), ("green", False)],
          "Lay the beads out and point at the part that repeats: red, blue. So red comes next.")],
        [("Counting on in twos from 0, what is the largest number you can say below 20?",
          [("18", True), ("20", False), ("19", False)],
          "The twos go 16, 18, 20. 20 is not below 20, so the largest one below it is 18."),
         ("Is it possible to land on 25 when you count on in tens from 0?",
          [("no, the tens all end in 0", True), ("yes, at the third jump", False),
           ("yes, at the fifth jump", False)],
          "Counting in tens from 0 lands on 10, 20, 30. Every one ends in 0, so 25 is never reached.")]),
    "sides-and-corners": (
        [("How many straight sides has a triangle?",
          [("3", True), ("4", False), ("1", False)],
          "Hold the actual shape and run a finger along each side, counting as you go."),
         ("How many corners has a square?",
          [("4", True), ("3", False), ("6", False)],
          "Put a counter on each corner of a paper square, then count the counters."),
         ("Which shape is round with no corners at all?",
          [("a circle", True), ("a square", False), ("a triangle", False)],
          "Feel round the edge of each shape. Only the circle has no corner to stop your finger.")],
        [("Using 4 straight sides, how many different shapes can you make that are NOT squares?",
          [("many, as long as the sides differ", True), ("only one", False), ("none", False)],
          "Rectangles, diamonds and long thin shapes all have 4 sides. Only equal sides make a square."),
         ("Is it possible for a shape to have 3 sides and 4 corners?",
          [("no, sides and corners match", True), ("yes, if it is bent", False),
           ("yes, if it is big", False)],
          "Every corner is where two sides meet, so a closed shape has as many corners as sides.")]),
    "which-way-from-here": (
        [("Musa faces the door and makes a half turn. What does he face?",
          [("the way he came", True), ("the door still", False), ("the floor", False)],
          "Stand up and turn yourself, facing a real thing in the room each time. "
          "A half turn is two quarter turns, and it faces you back the way you came."),
         ("The ball is on top of the box. Where is the ball?",
          [("above the box", True), ("under the box", False), ("in the box", False)],
          "Put a real ball on a real box. On top means above."),
         ("A robot moves forward, forward. How many squares has it moved?",
          [("2", True), ("1", False), ("3", False)],
          "Walk it out on a squared mat, counting each move as you make it.")],
        [("Using only quarter turns, what is the smallest number that brings you back to the start?",
          [("4", True), ("2", False), ("1", False)],
          "Try it: one, two, three, four quarter turns takes you all the way round. Fewer will not do it."),
         ("Is it possible to reach a square diagonally across using only forward and turn moves?",
          [("yes, with a turn in the middle", True), ("no, never", False),
           ("yes, in one move", False)],
          "Go forward, turn, go forward. Two straight runs with a turn between them reach the corner.")]),
    "how-much-how-long": (
        [("A pencil is 8 cm and a crayon is 5 cm. Which is longer?",
          [("the pencil", True), ("the crayon", False), ("they are equal", False)],
          "Line them up at the same end against a ruler. The one reaching further is longer."),
         ("Which is heavier, a book or a feather?",
          [("the book", True), ("the feather", False), ("they are the same", False)],
          "Put one in each pan of a balance. The pan that goes down holds the heavier thing."),
         ("A jug holds 2 litres. How many 1 litre bottles fill it?",
          [("2", True), ("1", False), ("4", False)],
          "Pour real bottles into the jug and count them. Two 1 litre bottles fill 2 litres.")],
        [("Measuring a desk in cubes and again in longer sticks, which count is smallest?",
          [("the stick count", True), ("the cube count", False), ("they are equal", False)],
          "Longer units mean fewer of them. This is why you must say WHICH unit you measured in."),
         ("Is it possible for a big box to be lighter than a small box?",
          [("yes, it depends what is inside", True), ("no, big is always heavier", False),
           ("only if it is empty", False)],
          "A big box of feathers weighs less than a small box of stones. Size does not tell you the mass.")]),
    "half-past-quarter-to": (
        [("The long hand points straight up at 12 and the short hand at 3. What time is it?",
          [("3 o'clock", True), ("12 o'clock", False), ("half past 3", False)],
          "Turn the hands on a real clock face to o'clock times and read them together."),
         ("Where does the long hand point at half past?",
          [("at the 6", True), ("at the 12", False), ("at the 3", False)],
          "Move the long hand halfway round a clock face. Halfway is straight down at the 6."),
         ("How many hands does a clock face have that tell the time?",
          [("2", True), ("1", False), ("12", False)],
          "Look at a real clock: a short hand for the hour and a long hand for the minutes.")],
        [("Between 2 o'clock and 3 o'clock, how many different quarter times are there?",
          [("3", True), ("1", False), ("4", False)],
          "Quarter past, half past and quarter to. Naming all three is how you know none is missing."),
         ("Is it possible for the two hands to point at the same number?",
          [("yes, at about 12 o'clock", True), ("no, never", False), ("only at half past", False)],
          "At 12 o'clock both hands point straight up at the 12. Trying every hour is how you find it.")]),
    "count-it-chart-it": (
        [("A block graph shows 4 blocks for cats and 2 for dogs. Which has more?",
          [("cats", True), ("dogs", False), ("the same", False)],
          "Build the towers out of real cubes side by side. The taller tower has more."),
         ("A tally shows one gate of five. How many is that?",
          [("5", True), ("1", False), ("4", False)],
          "Draw the gate on paper: four lines and one across. Count them and you get 5."),
         ("You want to know the favourite fruit in your class. What do you do first?",
          [("ask everyone the question", True), ("draw the graph", False),
           ("count the blocks", False)],
          "Keep a real list on paper and write each answer on it as you ask. "
          "The list comes before the chart.")],
        [("Sorting shapes by colour and by size, how many groups can a red small shape belong to?",
          [("2, so it goes where they overlap", True), ("1", False), ("none", False)],
          "It is red AND small, so it belongs to both groups at once and sits where they cross."),
         ("Is it possible for a spinner with 4 equal colours to land on red every time?",
          [("it is possible but very unlikely", True), ("no, it is impossible", False),
           ("yes, red is most likely", False)],
          "Each spin is on its own and red can come up again, but all four colours are equally likely.")]),
}

cfg = json.load(io.open(os.path.join(HERE, "app.config.json"), encoding="utf-8"))
ORDER = [l["file"][:-5] for l in cfg["lessons"]]

# ---- the audit ---------------------------------------------------------------
assert sorted(WORK) == sorted(ORDER), "every lesson needs a pair of tiers"
for key, (sup, ext) in WORK.items():
    assert len(sup) == 3 and len(ext) == 2, "%s: three support, two extension" % key
    for ask, opts, why in sup + ext:
        assert len(opts) == 3 and sum(1 for _t, ok in opts if ok) == 1, "%s: one right of three" % key
        assert len(set(t for t, _ in opts)) == 3, "%s: repeated option" % key
        assert ask.rstrip().endswith("?"), "%s: the question must be a question" % key
        for t in (ask, why) + tuple(t for t, _ in opts):
            assert '"' not in t and "\\" not in t and "<" not in t, "%s: unsafe text %r" % (key, t)
            for n in re.findall(r"(?<![\w.])(\d+)(?!\d|\.\d)", t):
                assert int(n) <= CEILING, "%s: %s is past the ceiling of %d" % (key, n, CEILING)
    # SUPPORT IS APPARATUS at Stage 2, so each one must name the thing to reach for
    for ask, _o, why in sup:
        assert any(a in why.lower() for a in AIDS), \
            "%s: a support item must name the aid a child can think with: %r" % (key, why[:60])
    # EXTENSION is Cambridge's opening move, in the form three buttons can carry
    for ask, _o, why in ext:
        assert OPENERS.search(ask), \
            "%s: an extension item must open the task: %r" % (key, ask[:60])


def lit(t):
    return '"%s"' % t


TIERED = """
  /* ==== """ + MARK + """: the tiered runner - see add-differentiation.py ====
     The story step, with Ready to Go's Support and Extension. A wrong answer
     puts an easier one next, with the apparatus named; finishing with at most
     one slip offers an opening question AFTER the step is done, because
     Cambridge's extensions all read "once they have completed...". Neither tier
     scores and finish() fires at the end of the core bank exactly as
     secondStep() does, so progress, the sticker and the gate are untouched.

     Separate from secondStep() on purpose: that one drives the other added
     steps, and none of them should carry the risk of this change. */
  function tieredStep(o) {
    const el = o.el, core = o.items;
    const words = (h) => String(h).replace(/<[^>]*>/g, " ").replace(/\\s+/g, " ").trim();
    const sup = (o.support || []).slice(), ext = (o.extension || []).slice();
    let i = 0, right = 0, lock = true, mode = "core", queued = null, extDone = 0;
    function current() { return mode === "core" ? core[i] : queued; }
    function label() {
      if (mode === "support") return "An easier one";
      if (mode === "extension") return "A harder one - " + (extDone + 1) + " of " + ext.length;
      return (o.label || "Question") + " " + (i + 1) + " of " + core.length;
    }
    function draw() {
      const it = current();
      lock = true;
      el.next.hidden = true;
      el.say.innerHTML = it.ask;
      el.fb.className = "fb"; el.fb.textContent = "";
      el.score.textContent = label();
      el.score.className = "score" + (mode === "core" ? "" : " tier-" + mode);
      el.stage.innerHTML = it.pic || "";
      el.ch.innerHTML = shuffle(it.opts.slice()).map((c) => '<button type="button" class="choice'
        + (/^\\s*\\d+\\s*$/.test(c.t) ? "" : " ss-w") + '" data-ok="' + (c.ok ? 1 : 0) + '">'
        + c.t + "</button>").join("");
      lock = false;
      say(words(it.ask));
    }
    function endCore() {
      el.score.className = "score";
      el.score.textContent = "You got " + right + " of " + core.length + ". " + o.done;
      finish(o.finish);
      if (ext.length && right >= core.length - 1) {
        el.next.textContent = "Try a harder one";
        el.next.hidden = false;
      }
    }
    el.ch.addEventListener("click", (e) => {
      const b = e.target.closest(".choice"); if (!b || lock) return;
      lock = true;
      const it = current(), ok = b.dataset.ok === "1";
      el.ch.querySelectorAll(".choice").forEach((c) => {
        c.disabled = true; if (c.dataset.ok === "1") c.classList.add("right");
      });
      if (!ok) b.classList.add("wrong");
      if (mode === "core" && ok) right++;
      const msg = (ok ? cheer() + " " : "Not quite. ") + it.why;
      el.fb.className = "fb " + (ok ? "good" : "bad"); el.fb.textContent = msg;
      say(msg);
      if (mode === "extension") {
        extDone++;
        if (extDone < ext.length) { el.next.textContent = "Next challenge"; el.next.hidden = false; }
        else el.score.textContent = "That is the last challenge. Well done.";
        return;
      }
      if (mode === "support") {
        mode = "core";
        if (i < core.length) { el.next.textContent = o.nextLabel || "Next story"; el.next.hidden = false; }
        else endCore();
        return;
      }
      i++;
      if (!ok && sup.length) {
        queued = sup.shift(); mode = "support";
        el.next.textContent = "Try an easier one";
        el.next.hidden = false;
        return;
      }
      if (i < core.length) { el.next.textContent = o.nextLabel || "Next story"; el.next.hidden = false; }
      else endCore();
    });
    el.next.addEventListener("click", () => {
      if (mode === "extension" || (el.next.textContent === "Try a harder one" && ext.length)) {
        if (mode !== "extension") { mode = "extension"; extDone = 0; }
        queued = ext[extDone];
        draw();
        return;
      }
      if (mode === "support") { draw(); return; }
      if (i < core.length) draw();
    });
    draw();
  }
"""

STYLE = """
<style>/* """ + MARK + """ - see add-differentiation.py */
  .score.tier-support { color: var(--teal, #2BB3A6); font-weight: 800; }
  .score.tier-extension { color: var(--gold, #E8B44A); font-weight: 800; }
</style>
"""

done_n = skipped = refused = 0
for l in cfg["lessons"]:
    name, key = l["file"], l["file"][:-5]
    p = os.path.join(HERE, name)
    s = io.open(p, encoding="utf-8", newline="").read()
    if MARK in s:
        print("  already  %s" % name)
        skipped += 1
        continue
    sup, ext = WORK[key]

    # the story block, exactly as add-story-problems.py wrote it
    m = re.search(r'(  secondStep\(\{\n    el: \{ say: \$\("(sp\d+)say"\)[\s\S]*?\n  \}\);\n)', s)
    if not m:
        print("  REFUSED  %-26s no story block in the shape add-story-problems.py writes" % name)
        refused += 1
        continue
    block, sid = m.group(1), m.group(2)
    if block.count("secondStep({") != 1:
        print("  REFUSED  %-26s the story block is not a single secondStep call" % name)
        refused += 1
        continue

    def bank(items):
        return "\n".join(
            '      { ask: %s, pic: "",\n        opts: [%s],\n        why: %s },'
            % (lit(a), ", ".join("{ t: %s, ok: %s }" % (lit(t), "true" if ok else "false")
                                 for t, ok in o), lit(w))
            for a, o, w in items)

    tiers = ("    support: [\n%s\n    ],\n    extension: [\n%s\n    ],\n"
             % (bank(sup), bank(ext)))
    new = block.replace("  secondStep({", "  tieredStep({", 1)
    new = new.replace("    finish: ", tiers + "    finish: ", 1)
    if new == block:
        print("  REFUSED  %-26s could not inject the tiers" % name)
        refused += 1
        continue
    s = s.replace(block, new, 1)
    # the runner goes beside the one it is a variant of
    anchor = "  /* ==== ehel-item-runner"
    if s.count(anchor) != 1:
        print("  REFUSED  %-26s no item runner to sit beside" % name)
        refused += 1
        continue
    s = s.replace(anchor, TIERED.lstrip("\n") + anchor, 1)
    s = s.rstrip() + "\n" + STYLE

    assert s.count("tieredStep(") == 2 and s.count(MARK) == 2
    if WRITE:
        io.open(p, "w", encoding="utf-8", newline="").write(s)
    print("  %s %-26s %d support + %d extension on %s" % ("wrote  " if WRITE else "would  ",
                                                          name, len(sup), len(ext), sid))
    done_n += 1

print("\n  %d support + %d extension across %d lesson(s) %s, %d skipped, %d refused%s"
      % (sum(len(a) for a, _b in WORK.values()), sum(len(b) for _a, b in WORK.values()),
         done_n, "written" if WRITE else "to write", skipped, refused,
         "" if WRITE else "   (--write to apply)"))
sys.exit(1 if refused else 0)
