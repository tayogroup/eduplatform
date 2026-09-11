# -*- coding: utf-8 -*-
"""Show conservation of number on a slide, instead of only saying it.

    python show-conservation.py            # report
    python show-conservation.py --write

1Nc.01 is "Count objects from 0 to 20, recognising CONSERVATION of number and
one-to-one correspondence". The 2026-09-11 re-validation (area 3) found the
second half taught - one counter, one number, in the ten frame of step 1 - and
the first half only said. Conservation is the idea that moving things does not
change how many there are, and a five-year-old believes it when they watch it,
not when they are told.

So step 1 gets a MIX THEM UP button beside + and -. It moves the same counters
into other holes of the frame; the number underneath does not move, and the
page says so: "Still seven. Moving the counters does not change how many there
are." It needs two counters to mean anything and an empty hole to move one
into, so it is off below two and at ten.

IN PLACE, NOT A NEW STEP. Progress is recorded by step position and this build
is live and routed, so a step inserted here would move every learner's record
after it. The step's spoken instruction and explanation gain one sentence each.

Every anchor must match exactly once, or nothing is written; a second run
changes nothing.
"""
import io, os, sys

sys.stdout.reconfigure(encoding="utf-8")
P = os.path.join(os.path.dirname(os.path.abspath(__file__)), "g1v2", "counting-to-twenty.html")
WRITE = "--write" in sys.argv[1:]
for a in sys.argv[1:]:
    if a != "--write":
        sys.exit("unrecognised argument: %s" % a)
MARK = "ehel-show-conservation"

EDITS = [
    ("button",
     '<div class="bigbtns"><button type="button" class="big ghost" id="minus1">−</button><button type="button" class="big" id="plus1">+</button></div>',
     '<div class="bigbtns"><button type="button" class="big ghost" id="minus1">−</button><button type="button" class="big" id="plus1">+</button><button type="button" class="big teal" id="mix1">Mix them up</button></div>'),
    ("spoken instruction",
     'data-say="Press the plus to put a counter in the frame. Count out loud with me."',
     'data-say="Press the plus to put a counter in the frame. Count out loud with me. Then press Mix them up. Is it still the same number?"'),
    ("instruction on screen",
     '<span>Press <b>+</b> to put a counter in the frame. Count out loud with me.</span>',
     '<span>Press <b>+</b> to put a counter in the frame. Count out loud with me. Then press <b>Mix them up</b>. Is it still the same number?</span>'),
    ("explanation",
     "<s>Let your voice keep up with your finger.</s>",
     "<s>Let your voice keep up with your finger.</s><s>Then press Mix them up. The counters move to new holes, but no counter comes or goes, so the number stays the same.</s>"),
    ("button state",
     '    $("plus1").disabled = n1 >= 10; $("minus1").disabled = n1 <= 0;\n',
     '    $("plus1").disabled = n1 >= 10; $("minus1").disabled = n1 <= 0; $("mix1").disabled = n1 < 2 || n1 >= 10;\n'),
    ("the mixing",
     '  $("minus1").addEventListener("click", () => { if (n1 > 0) { n1--; paint1(); say(WORDS[n1]); } });\n',
     '  $("minus1").addEventListener("click", () => { if (n1 > 0) { n1--; paint1(); say(WORDS[n1]); } });\n'
     '  /* %s: 1Nc.01 names CONSERVATION of number - the same counters, moved,\n'
     '     are still the same number. Shown, not only said: the counters move to\n'
     '     other holes and the number underneath stays where it is. */\n'
     '  $("mix1").addEventListener("click", () => {\n'
     '    if (n1 < 2 || n1 >= 10) return;   /* a full frame has nowhere to move a counter to */\n'
     '    const cells = [...$("tf1").querySelectorAll("i")];\n'
     '    cells.forEach((c) => c.classList.remove("on", "pop"));\n'
     '    shuffle(cells).slice(0, n1).forEach((c) => c.classList.add("on"));\n'
     '    const msg = "Still " + WORDS[n1] + ". Moving the counters does not change how many there are.";\n'
     '    $("fb1").className = "fb good"; $("fb1").textContent = msg; say(msg);\n'
     '  });\n' % MARK),
]

s = io.open(P, encoding="utf-8", newline="").read()
if MARK in s:
    print("  already  counting-to-twenty.html"); sys.exit(0)
for name, old, new in EDITS:
    if s.count(old) != 1:
        sys.exit("  REFUSED: the %s anchor matches %d times - nothing written" % (name, s.count(old)))
    s = s.replace(old, new)
if WRITE:
    io.open(P, "w", encoding="utf-8", newline="").write(s)
print("  %s  counting-to-twenty.html (%d edits)" % ("changed" if WRITE else "would change", len(EDITS)))
