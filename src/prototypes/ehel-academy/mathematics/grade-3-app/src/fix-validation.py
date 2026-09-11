# -*- coding: utf-8 -*-
"""Grade 3 fixes from the 2026-09-11 validation, made in the SOURCE fragments so
src/build-all.sh carries them into every rebuild.

    python src/fix-validation.py            # report
    python src/fix-validation.py --write    # change the fragments; then run src/build-all.sh

1. A failed check had nowhere to go. Every lesson's check completes only at its
   own pass mark (4 of 6, 5 of 7 or 7 of 10), and below it the page said
   "Finished! 3 out of 7." and stopped: no sticker, no button, nothing to press.
   A child had to know to reload. Now a score below the mark shows how many are
   needed and a Try again button that restarts the check with the questions in
   a new order. The marks themselves are unchanged.
2. Two words from Stage 4. Measure It named angles 'acute' and 'obtuse', which
   is 4Gg.08; 3Gg.10 is 'compare angles with a right angle', and the step already
   asks exactly that, so its explanation now says smaller, the same or bigger.
   Ask, Count and Chart used 'unlikely' and 'most likely' beside the Stage 3
   words will, might and will not (3Sp.01); they now say it in those words.

The 2026-09-11 report also said this build 'drills the 7 times table'. It does
not, and nothing changes for it: TABLES is 1-6, 8, 9 and 10 exactly as 3Ni.07
lists them, and the 7s that appear (six sevens, 7 x 8) are facts of the 6 and 8
times tables that Stage 3 does name.

Guarded: the helper by a marker in _shell.js, the gates by their own call, the
words by their new text. A second run changes nothing.
"""
import io, os, re, sys

sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))
WRITE = "--write" in sys.argv[1:]
MARK = "ehel-g3-validation-fixes"
HELPER = """  /* %s: a check below its pass mark shows how many are needed and a Try
     again button, instead of stopping with nothing to press. */
  function retryCheck(fb, ch, got, total, need, restart) {
    const msg = "You got " + got + " out of " + total + ". Get " + need + " right to finish. Have another go!";
    fb.className = "fb bad"; fb.textContent = msg; say(msg);
    const b = document.createElement("button");
    b.type = "button"; b.className = "big retry-check"; b.textContent = "Try again";
    b.addEventListener("click", function () { restart(); });
    ch.innerHTML = ""; ch.appendChild(b);
    try { b.focus({ preventScroll: true }); } catch (e) {}
  }
""" % MARK


def read(f):
    return io.open(os.path.join(HERE, f), encoding="utf-8", newline="").read()


def one(s, old, new, label):
    if old not in s and s.count(new) == 1:
        return s                      # done on an earlier run
    c = s.count(old)
    if c != 1:
        raise SystemExit("  REFUSED: %s - expected 1, found %d: %r" % (label, c, old[:80]))
    return s.replace(old, new)


GATE = re.compile(r'if \(got(\d+) >= (\d+)\) finish\((\d+), ("You have finished the check[^"]*")\);\n(\s*)return;')
out = {}
# ONE helper, in the shell every lesson is built from - not a copy per lesson.
# The first version of this script put a copy at the top of each check block,
# and check-judging.py, which reads a 900-character window around every step's
# element ids, then saw its "fb bad" beside the step BEFORE the check: Ask,
# Count and Chart's "Try it and see", a recorded exploration, read as a step that
# marks answers, and its exemption was reported stale. The helper belongs to no
# step, so it now sits beside say(), hundreds of lines from any of them.
SHELL_ANCHOR = "  function say(text) { VOICE.speak(text); }\n"
s = read("_shell.js")
if MARK not in s:
    out["_shell.js"] = one(s, SHELL_ANCHOR, SHELL_ANCHOR + "\n" + HELPER, "_shell.js helper")
else:
    print("  already  _shell.js")
for n in range(1, 9):
    f = "l%d-content.js" % n
    s = read(f)
    t = s.replace(HELPER, "")                  # the per-lesson copies, if an earlier run left them
    if "retryCheck(" not in t:
        m = GATE.search(t)
        if not m:
            raise SystemExit("  REFUSED: %s has no check gate of the known shape" % f)
        k, need, slot, msg, ind = m.groups()
        t = t[:m.start()] + ('if (got%s >= %s) finish(%s, %s);\n%selse retryCheck($("fb%s"), $("ch%s"), got%s, order%s.length, %s, '
                             'function () { qi = 0; got%s = 0; order%s = shuffle(QS); round%s(); });\n%sreturn;'
                             % (k, need, slot, msg, ind, k, k, k, k, need, k, k, k, ind)) + t[m.end():]
    if t != s:
        out[f] = t
    else:
        print("  already  %s" % f)

# Stage 4 words
s = out.get("l6-content.js") or read("l6-content.js")
s = one(s, "const kind = rnd(0, 2);   /* 0 acute, 1 right, 2 obtuse */",
        "const kind = rnd(0, 2);   /* 0 smaller than, 1 the same as, 2 bigger than a right angle - 'acute' and 'obtuse' are Stage 4's Gg.08 */", "l6 comment")
if s != read("l6-content.js"): out["l6-content.js"] = s
s = read("l6-slides.html")
if MARK not in s:
    s = one(s, "<s>Smaller than a right angle is acute.</s><s>Bigger is obtuse.</s>",
            "<s>So each angle is smaller than the square corner, the same, or bigger.</s>", "l6 explain")
    s = s.replace("</section>", "</section><!-- " + MARK + " -->", 1)
    out["l6-slides.html"] = s
s = out.get("l8-content.js") or read("l8-content.js")
s = one(s, "Remember that unlikely is not the same as impossible - save “will not” for things that truly cannot happen.",
        "Save “will not” for things that truly cannot happen. If it could happen, even rarely, it might happen.", "l8 feedback")
s = one(s, 'q: "You roll an ordinary six-sided dice. How likely is a 7?"', 'q: "You roll an ordinary six-sided dice. Will you get a 7?"', "l8 check dice")
s = one(s, 'q: "You toss a coin. How likely is heads?"', 'q: "You toss a coin. Will it land on heads?"', "l8 check coin")
s = one(s, '"It is very unlikely, but it could still happen.",', '"It could still happen, even if it hardly ever does.",', "l8 reason 1")
s = one(s, '"Save will not for things that genuinely cannot happen. Unlikely is a different thing."',
        '"Save will not for things that genuinely cannot happen. Something that hardly ever happens still might."', "l8 reason 2")
s = one(s, '"Three spins of a spinner do not tell you which colour is most likely.",',
        '"Three spins of a spinner do not tell you which colour will come up most often.",', "l8 reason 3")
if s != read("l8-content.js"): out["l8-content.js"] = s
s = read("l8-slides.html")
if MARK not in s:
    s = one(s, '<span id="say8">How likely is it?</span>', '<span id="say8">Will it happen?</span>', "l8 say")
    s = s.replace("</section>", "</section><!-- " + MARK + " -->", 1)
s = one(s, "<s>Unlikely is not the same as impossible.</s><s>Rolling a six is unlikely on any one go, and it happens all the time.</s>",
        "<s>Might is not the same as will not.</s><s>You might not roll a six on your next go, and sixes still come up all the time.</s>", "l8 explain")
if s != read("l8-slides.html"): out["l8-slides.html"] = s

for f, s in sorted(out.items()):
    if WRITE:
        io.open(os.path.join(HERE, f), "w", encoding="utf-8", newline="").write(s)
    print("  %s  %s" % ("changed" if WRITE else "would change", f))
print("\n  %d fragment(s) %s" % (len(out), "changed - now run src/build-all.sh" if WRITE else "to change - pass --write"))
