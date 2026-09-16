# -*- coding: utf-8 -*-
"""Support and Extension on the story-problem step, the way Ready to Go does it.

    python add-differentiation.py            # report
    python add-differentiation.py --write

THE GAP THIS CLOSES. Measured against the Cambridge Stage 1 books on 2026-09-16,
differentiation was the build's clearest outright hole: every one of the 18
Ready to Go lessons carries a "Digging deeper" panel with a Support paragraph
and an Extension paragraph, and this build had nothing at all - every child
walked the same path at the same depth, with a retry on a failed check as the
only adjustment anywhere.

WHAT CAMBRIDGE ACTUALLY DOES, because the shape matters more than the idea.
Support NARROWS the same task and Extension WIDENS it. It is never a different
worksheet:

    1.2  Support: give these learners a 1-2 spinner, so that they count on a
         maximum of two each time.
         Extension: challenge these learners to extend their number track to 20.
         Give them a 1-6 spinner.
    2.5  Extension: give learners addition sentences related to their
         subtractions: if they carried out 7 subtract 5 leaves 2, ask: what is
         2 add 5?
    4.2  Support: adapt the worksheet so these learners focus on two of the
         mothers.  Extension: ... so that there are six mothers.
    8.3  Support: focus on making a pattern with two shapes.
         Extension: a repeating pattern with four shapes.

So the support items below are the SAME problems with smaller numbers and fewer
things, and the extension items are the same problems reaching past ten, into an
inverse fact, or over three groups instead of two.

WHO CHOOSES. In the books the teacher chooses, by watching. On a screen the only
honest signal is the child's own answers, so:

  - a WRONG answer in the core bank puts a support item next - narrower, and
    labelled as an easier one rather than slipped in silently;
  - finishing the core bank with at most one slip offers an extension behind a
    button the child may ignore. Cambridge's extensions are all "once they have
    completed the worksheet ...", so the offer comes after, never instead.

WHAT IT DOES NOT TOUCH, and this is the point of the design. Neither tier counts
toward the score, and finish() still fires at the end of the CORE bank exactly as
before - so progress, the sticker, the dot rail and the lesson gate are bit for
bit what they were. A child who is offered three support items and takes none of
the extensions completes the step identically to one who takes both.

WHY A SEPARATE RUNNER. secondStep() drives 24 steps across the seven lessons (17
second steps and 7 spot-the-mistake steps) and exists in TWO textual variants -
add-second-steps.py's, which carries the flash arm, and add-spot-the-mistake.py's,
which does not. Threading tiers through both would put all 24 at risk to give 7
of them a new feature. tieredStep() is a second, self-contained runner used by
the story step alone, so no existing step can regress: it is not reachable from
one. If tiering is ever wanted on the other steps, merge the two then, with the
24 driven as the test.

Guarded by a marker; every anchor must match exactly once or the file is
refused. Written with the Write tool, never a heredoc (backslashes).
"""
import io, os, re, sys

sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))
G = os.path.join(HERE, "g1v2")
WRITE = "--write" in sys.argv[1:]
for a in sys.argv[1:]:
    if a != "--write":
        sys.exit("unrecognised argument: %s" % a)

MARK = "ehel-differentiation"
FINISH = "  function finish(i, msg) {"

RUNNER = r'''
  /* ==== ehel-differentiation: the tiered runner - see grade-1-app/add-differentiation.py ====
     The story step, with Ready to Go's Support and Extension. A wrong answer puts
     a NARROWER version of the same problem next; finishing with at most one slip
     offers a WIDER one behind a button. Neither tier scores, and finish() fires at
     the end of the core bank exactly as secondStep does - so progress, the sticker
     and the gate are untouched.

     Separate from secondStep() on purpose: that one drives 24 other steps in two
     textual variants, and none of them should carry the risk of this change. */
  function tieredStep(o) {
    const el = o.el, core = o.items;
    const words = (h) => String(h).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
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
      el.ch.innerHTML = shuffle(it.opts).map((c) => '<button type="button" class="choice' +
        (/^\s*\d+\s*$/.test(c.t) ? "" : " ss-w") + '" data-ok="' + (c.ok ? 1 : 0) + '">' + c.t + "</button>").join("");
      lock = false;
      say(words(it.ask));
    }
    function endCore() {
      el.score.className = "score";
      el.score.textContent = "You got " + right + " of " + core.length + ". " + o.done;
      finish(o.finish);
      /* the offer comes AFTER the step is done, and only to a child who did not
         need the support - Cambridge's extensions all read "once they have
         completed ...". One slip is allowed; two means an easier one was the
         right call, not a harder one. */
      if (ext.length && right >= core.length - 1) {
        el.next.textContent = "Try a harder one";
        el.next.hidden = false;
      }
    }
    el.ch.addEventListener("click", (e) => {
      const b = e.target.closest(".choice"); if (!b || lock) return;
      lock = true;
      const it = current(), ok = b.dataset.ok === "1";
      el.ch.querySelectorAll(".choice").forEach((c) => { c.disabled = true; if (c.dataset.ok === "1") c.classList.add("right"); });
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
        mode = "core";                       /* back to where the child was */
        if (i < core.length) { el.next.textContent = o.nextLabel || "Next question"; el.next.hidden = false; }
        else endCore();
        return;
      }
      i++;
      if (!ok && sup.length) {               /* narrow the task, then carry on */
        queued = sup.shift(); mode = "support";
        el.next.textContent = "Try an easier one";
        el.next.hidden = false;
        return;
      }
      if (i < core.length) { el.next.textContent = o.nextLabel || "Next question"; el.next.hidden = false; }
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
'''

CSS = """  .score.tier-support, .score.tier-extension { font-weight: 700; }
  .score.tier-support { color: var(--teal); }
  .score.tier-extension { color: var(--gold); }
"""

# ---------------------------------------------------------------------------
# THE TIERS. Support narrows the same problem; extension widens it.
# ---------------------------------------------------------------------------
SUP = "support"
EXT = "extension"

TIERS = {
    "counting-to-twenty.html": {
        SUP: [
            ("There are 4 goats in the pen. 1 more goat walks in. How many goats are in the pen now?",
             [("5", True), ("4", False), ("6", False)],
             "One more than 4 is 5. Count on one: four, five."),
            ("Amina has 3 shells. Kiki has 6 shells. Who has more shells?",
             [("Kiki", True), ("Amina", False), ("They have the same", False)],
             "6 comes after 3 when you count, so 6 is more."),
            ("Musa had 2 sweets. He eats both sweets. How many sweets does Musa have left?",
             [("0", True), ("2", False), ("1", False)],
             "None at all is zero. We write it 0."),
        ],
        EXT: [
            ("Ali has one bag of ten beans and 9 loose beans. He finds 1 more bean. How many beans does Ali have now?",
             [("20", True), ("19", False), ("11", False)],
             "One ten and 9 ones is 19, and one more makes 20. That is two full tens."),
            ("Five children stand in a line. Amina is third. How many children are behind Amina?",
             [("2", True), ("3", False), ("4", False)],
             "Third means two are in front. That leaves 2 behind her, because 2 and 1 and 2 make 5."),
        ],
    },
    "adding-and-taking-away.html": {
        SUP: [
            ("Gran buys 2 mangoes and 3 oranges. How many fruits does Gran buy in total?",
             [("5", True), ("4", False), ("6", False)],
             "Put the groups together: 2 and 3 make 5."),
            ("Ali has 5 crayons. He gives 2 crayons away. How many crayons does Ali have left?",
             [("3", True), ("7", False), ("2", False)],
             "Giving away means counting back. Back 2 from 5 is 4, then 3."),
            ("Kiki needs 5 bottle tops. She has 3 bottle tops. How many more does Kiki need?",
             [("2", True), ("8", False), ("3", False)],
             "3 and 2 make 5, so Kiki needs 2 more."),
        ],
        EXT: [
            ("Musa has 8 beans. Hodan gives him 5 more beans. How many beans does Musa have now?",
             [("13", True), ("12", False), ("3", False)],
             "Fill a ten first: 8 and 2 make 10, and 3 of the 5 are left. 10 and 3 make 13."),
            # Ready to Go 2.5's own extension: the addition that belongs to the subtraction
            ("Amina knows that 6 add 7 is 13. What is 13 take away 7?",
             [("6", True), ("7", False), ("20", False)],
             "Adding and taking away undo each other. 6 and 7 made 13, so taking the 7 away leaves the 6."),
        ],
    },
    "halves-and-wholes.html": {
        SUP: [
            ("Amina shares 4 beans fairly with her sister. How many beans does each girl get?",
             [("2", True), ("4", False), ("1", False)],
             "Fairly means the same each. 2 and 2 make 4."),
            ("There are 2 mangoes on a plate. Half of them are ripe. How many mangoes are ripe?",
             [("1", True), ("2", False), ("0", False)],
             "Half of 2 is 1, because 1 and 1 make 2."),
            ("Musa cuts one orange into two equal parts. How many halves does Musa have?",
             [("2", True), ("1", False), ("4", False)],
             "Cutting into two equal parts makes 2 halves."),
        ],
        EXT: [
            ("Ali shares 18 beans fairly with Kiki. How many beans does each of them get?",
             [("9", True), ("8", False), ("10", False)],
             "Half of 18 is 9, because 9 and 9 make 18."),
            ("There are 10 halves of orange on a plate. How many whole oranges do they make?",
             [("5", True), ("10", False), ("20", False)],
             "Every whole orange takes 2 halves, and there are five 2s in 10."),
        ],
    },
    "what-comes-next.html": {
        SUP: [
            ("The beads go red, blue, red, blue. What colour comes next?",
             [("red", True), ("blue", False), ("yellow", False)],
             "The part that repeats is red, blue. After blue comes red again."),
            ("Musa counts in twos: 2, 4, 6. What number comes next?",
             [("8", True), ("7", False), ("9", False)],
             "Every jump is 2 more. 6 and 2 make 8."),
            ("Kiki has 2 stones. She needs 5 stones. How many more stones does Kiki need?",
             [("3", True), ("7", False), ("2", False)],
             "2 and 3 make 5, so Kiki needs 3 more."),
        ],
        EXT: [
            # Ready to Go 8.3 widens a two-shape pattern to four; three is the step past two
            ("The beads go red, blue, yellow, red, blue, yellow. What colour comes next?",
             [("red", True), ("yellow", False), ("blue", False)],
             "The part that repeats is three long: red, blue, yellow. After yellow it starts again with red."),
            ("A number machine adds 4 to every number. Hodan puts in 9. What number comes out?",
             [("13", True), ("12", False), ("5", False)],
             "9 and 1 make 10, and 3 of the 4 are left. 10 and 3 make 13."),
        ],
    },
    "shapes-and-sizes.html": {
        SUP: [
            ("Amina finds a box of tea in the kitchen. Which solid shape is the box like?",
             [("a cuboid", True), ("a sphere", False), ("a cone", False)],
             "A box has flat faces and square corners, so it is a cuboid."),
            ("Musa's pencil is 5 cubes long. Ali's pencil is 8 cubes long. Whose pencil is longer?",
             [("Ali's pencil", True), ("Musa's pencil", False), ("They are the same", False)],
             "They used the same cubes, so 8 cubes is longer than 5."),
            ("Kiki wants to know how long her desk is. Which tool should Kiki use?",
             [("a ruler", True), ("scales", False), ("a jug", False)],
             "A ruler measures how long something is."),
        ],
        EXT: [
            # Ready to Go 6.2 extends comparing two things to ordering three
            ("A bottle holds 8 cups. A pot holds 5 cups. A jug holds 3 cups. Which one holds the most?",
             [("the bottle", True), ("the pot", False), ("the jug", False)],
             "The same cup measured all three, so the counts can be put in order: 3, 5, 8. The bottle holds the most."),
            ("Hodan has a solid shape with 6 faces, and every face is a flat square. What shape is it?",
             [("a cube", True), ("a cuboid", False), ("a cylinder", False)],
             "Six flat faces that are all squares make a cube."),
        ],
    },
    "days-months-and-clocks.html": {
        SUP: [
            ("Today is Monday. Which day comes next?",
             [("Tuesday", True), ("Sunday", False), ("Friday", False)],
             "The week goes Monday, Tuesday, Wednesday. Tuesday comes next."),
            ("Does blinking your eyes take about a second or about an hour?",
             [("about a second", True), ("about an hour", False), ("about a day", False)],
             "A second is very short, and a blink is quicker than you can say it."),
            ("The long hand points at the 12 and the short hand points at the 3. What time is it?",
             [("3 o'clock", True), ("half past 3", False), ("12 o'clock", False)],
             "The long hand on 12 means o'clock, and the short hand says which hour."),
        ],
        EXT: [
            ("Musa's lesson starts at 2 o'clock and finishes at half past 2. Is the lesson shorter or longer than one hour?",
             [("shorter than an hour", True), ("longer than an hour", False), ("exactly one hour", False)],
             "Half past 2 is only halfway to 3 o'clock, so the lesson is half an hour. That is shorter than an hour."),
            ("Hodan's birthday is in the month straight after June. Which month is it?",
             [("July", True), ("May", False), ("January", False)],
             "The months go May, June, July. July comes straight after June."),
        ],
    },
    "asking-and-sorting.html": {
        SUP: [
            ("Amina asks 4 friends. 3 friends say mango and 1 says banana. Which fruit is most popular?",
             [("mango", True), ("banana", False), ("they are the same", False)],
             "Most popular means the most friends chose it. 3 is more than 1."),
            ("A block graph shows 3 goats and 5 sheep. Which are there more of?",
             [("sheep", True), ("goats", False), ("the same of each", False)],
             "The sheep bar is taller, and 5 is more than 3."),
            ("Ali counts 2 red cars and 3 blue cars. How many cars does Ali count altogether?",
             [("5", True), ("6", False), ("1", False)],
             "Altogether means put them together. 2 and 3 make 5."),
        ],
        EXT: [
            # Ready to Go 4.2 widens a two-category pictogram to six; three groups is the step past two
            ("A block graph shows 6 goats, 4 sheep and 2 cows. How many animals are there altogether?",
             [("12", True), ("10", False), ("6", False)],
             "Put all three groups together: 6 and 4 make 10, and 2 more makes 12."),
            ("Kiki's tally shows two gates of five and 3 more marks. How many is that?",
             [("13", True), ("10", False), ("8", False)],
             "Each gate is 5, so two gates are 10, and 3 more makes 13."),
        ],
    },
}

MAX_NUMBER = 20


def audit(name, tiers):
    for tier, rows in tiers.items():
        for ask, opts, why in rows:
            for t in (ask, why):
                assert '"' not in t and "\\" not in t, "%s/%s: a quote or backslash" % (name, tier)
                assert "<" not in t and ">" not in t, "%s/%s: markup" % (name, tier)
            oks = [o for _, o in opts if o]
            assert len(oks) == 1, "%s/%s: %d right answers in %r" % (name, tier, len(oks), ask[:40])
            ts = [t for t, _ in opts]
            assert len(ts) == len(set(ts)) >= 2, "%s/%s: repeated options %r" % (name, tier, ts)
            for t in ts:
                assert '"' not in t and "\\" not in t, "%s/%s: a quote in an option" % (name, tier)
            assert ask.rstrip().endswith("?"), "%s/%s: not a question: %r" % (name, tier, ask[:40])
            for n in re.findall(r"\b\d+\b", ask + " " + " ".join(ts)):
                assert int(n) <= MAX_NUMBER, "%s/%s: %s is past Stage 1" % (name, tier, n)
    # Support must be EASIER than the extension, by the only measure a tool has:
    # the size of the numbers it puts in front of a child.
    #
    # NOT IN DAYS, MONTHS AND CLOCKS, and the exemption is the interesting part.
    # Its numbers are POSITIONS, not amounts: "the short hand points at the 3" and
    # "the long hand points at the 12" are places on a clock face, and a 12 there
    # is not bigger mathematics than a 2 in "half past 2". Run against it, the rule
    # fires on perfectly graded content - which it did, on the first run of this
    # tool. Scoped rather than deleted, so it still guards the six lessons where a
    # number really is a quantity.
    if name != "days-months-and-clocks.html":
        big = lambda rows: max([int(n) for r in rows for n in re.findall(r"\b\d+\b", r[0])] or [0])
        assert big(tiers[SUP]) <= big(tiers[EXT]), \
            "%s: the support items reach higher numbers than the extension ones" % name


def items_js(rows, indent=6):
    pad = " " * indent
    out = []
    for ask, opts, why in rows:
        o = ", ".join('{ t: "%s"%s }' % (t, ", ok: true" if ok else "") for t, ok in opts)
        out.append('\n%s{ ask: "%s",\n%s  opts: [%s],\n%s  why: "%s" },' % (pad, ask, pad, o, pad, why))
    return "".join(out)


done = skipped = refused = 0
for name in sorted(TIERS):
    p = os.path.join(G, name)
    s = io.open(p, encoding="utf-8", newline="").read()
    if MARK in s:
        print("  already  %s" % name)
        skipped += 1
        continue
    audit(name, TIERS[name])

    bad = []
    m = re.search(r"  /\* ---- \d+: story problems[^\n]*\n  secondStep\(\{", s)
    if not m:
        bad.append("the story-problems block is not the shape add-story-problems.py wrote")
    if s.count("function secondStep(") != 1:
        bad.append("secondStep declared %d times" % s.count("function secondStep("))
    if "function tieredStep(" in s:
        bad.append("tieredStep is already present")
    if s.count(FINISH) != 1:
        bad.append("finish() found %d times" % s.count(FINISH))
    if bad:
        print("  REFUSED  %-30s %s" % (name, "; ".join(bad)))
        refused += 1
        continue

    # the story block, from its marker to the "});" that closes the call
    start = m.start()
    end = s.index("\n  });\n", start) + len("\n  });\n")
    block = s[start:end]
    if block.count("finish:") != 1 or block.count("items: [") != 1:
        print("  REFUSED  %-30s the story block does not carry one items array and one finish" % name)
        refused += 1
        continue

    new_block = block.replace("  secondStep({", "  tieredStep({", 1)
    inject = ('    /* ' + MARK + ' - Ready to Go Support and Extension; neither tier scores */\n'
              '    support: [%s\n    ],\n'
              '    extension: [%s\n    ],\n'
              % (items_js(TIERS[name][SUP]), items_js(TIERS[name][EXT])))
    new_block = new_block.replace("    finish:", inject + "    finish:", 1)
    s = s[:start] + new_block + s[end:]

    # the runner, in the prelude where finish() and shuffle() are in scope
    eol = s.index("\n", s.index(FINISH))
    s = s[:eol + 1] + RUNNER.lstrip("\n") + s[eol + 1:]
    s = s.rstrip() + "\n\n<style>/* " + MARK + " - see add-differentiation.py */\n" + CSS + "</style>\n"

    assert s.count(MARK) >= 2 and s.count("tieredStep(") == 2
    if WRITE:
        io.open(p, "w", encoding="utf-8", newline="").write(s)
    print("  %s %-30s %d support, %d extension"
          % ("wrote  " if WRITE else "would  ", name, len(TIERS[name][SUP]), len(TIERS[name][EXT])))
    done += 1

print("\n  %d lesson(s) %s, %d already done, %d refused%s"
      % (done, "written" if WRITE else "to write", skipped, refused,
         "" if WRITE else "   (--write to apply)"))
sys.exit(1 if refused else 0)
