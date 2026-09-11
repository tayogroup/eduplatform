# -*- coding: utf-8 -*-
"""The end-of-lesson check decides completion at 75%, and explains every answer.

    python gate-and-explain-check.py            # report
    python gate-and-explain-check.py --write

TWO OWNER DECISIONS, 2026-09-11, both answering questions the re-validation put:

  1. THE CHECK SCORE DECIDES COMPLETION, AT 75%. Until now every lesson called
     finish() when the questions ran out, whatever the score - and three of them
     already told a child below 75% "Try the steps again, then come back." and
     then completed the lesson anyway. The page said one thing and did another.
     Now a child at or above the mark completes as before; below it they see
     their score, how many they need, and a Try again button that restarts the
     check. 75% is the mark those three lessons already printed, so the gate and
     the praise agree. The teaching steps stay open, so going back to them is
     always possible.

  2. THE CHECK EXPLAINS ITS ANSWERS. Measured before writing a word, and it
     corrected both validation reports: four of the seven lessons ALREADY show an
     authored reason after every check answer (44 items). The three that did not
     - Counting to Twenty, Adding and Taking Away, What Comes Next, 41 items -
     answered a wrong tap with "It is 7." and a right one with a cheer, no
     reason either way. Each now carries a reason written around the method its
     own lesson teaches (counting on, going through ten, pairs for odd and even),
     and the pause before the next question is 2.8 s, the length the four
     explaining lessons already use - 1.3 s was not long enough to read one.

THREE CHECK IMPLEMENTATIONS, each gated where it completes:
  A  const CHECK + askCheck()   days-months-and-clocks, shapes-and-sizes, asking-and-sorting
  B  const CHECK + roundNN()    counting-to-twenty, adding-and-taking-away, what-comes-next
  C  sequence({...})            halves-and-wholes - sequence() also runs TEACHING
     steps, so it gates only when its caller passes `pass`, and only the check does.

Every anchor must match exactly once or the file is refused untouched. Guarded by
a marker: a second run changes nothing.
"""
import io, os, sys

sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))
G = os.path.join(HERE, "g1v2")
WRITE = "--write" in sys.argv[1:]
for a in sys.argv[1:]:
    if a != "--write":
        sys.exit("unrecognised argument: %s" % a)

MARK = "ehel-gate-check"
PASS = 0.75

HELPER = """  /* %s: the end-of-lesson check completes the lesson only at %d%% (owner,
     2026-09-11). Below it the child sees the score, how many they need, and a
     button that restarts the check. */
  function retryCheck(fb, ch, got, total, restart) {
    const need = Math.ceil(total * %s);
    const msg = "You got " + got + " out of " + total + ". Get " + need + " right to finish. Have another go!";
    fb.className = "fb bad"; fb.textContent = msg; say(msg);
    const b = document.createElement("button");
    b.type = "button"; b.className = "big retry-check"; b.textContent = "Try again";
    b.addEventListener("click", function () { restart(); });
    ch.innerHTML = ""; ch.appendChild(b);
    try { b.focus({ preventScroll: true }); } catch (e) {}
  }
""" % (MARK, int(PASS * 100), PASS)

# ---- style A: const CHECK + askCheck() --------------------------------------
def style_a(n):
    return [
        ("helper", "  const CHECK = [", HELPER + "  const CHECK = ["),
        ("gate", 'finish(%d, "Well done!");' % n,
         'if (rightc >= Math.ceil(CHECK.length * %s)) finish(%d, "Well done!");\n'
         '        else retryCheck($("fbck"), $("chck"), rightc, CHECK.length, '
         'function () { qc = 0; rightc = 0; askCheck(); });' % (PASS, n)),
    ]

# ---- style B: const CHECK + roundNN() ---------------------------------------
def style_b(n, k):
    fin = 'finish(%d, "You got " + right%s + " out of " + CHECK.length + "."); return;' % (n, k)
    return [
        ("helper", "  const CHECK = [", HELPER + "  const CHECK = ["),
        ("gate", fin,
         'if (right%s >= Math.ceil(CHECK.length * %s)) { %s }\n'
         '      retryCheck($("fb%s"), $("ch%s"), right%s, CHECK.length, '
         'function () { c%s = 0; right%s = 0; round%s(); }); return;'
         % (k, PASS, fin, k, k, k, k, k, k)),
        ("explain on screen", '$("fb%s").textContent = ok ? cheer() : "It is " + q.a + ".";' % k,
         '$("fb%s").textContent = (ok ? cheer() + " " : "It is " + q.a + ". ") + (q.why || "");' % k),
        ("explain aloud", 'say(ok ? cheer() : "It is " + q.a);',
         'say((ok ? cheer() + " " : "It is " + q.a + ". ") + (q.why || ""));'),
        ("time to read it", "c%s++; setTimeout(round%s, 1300);" % (k, k),
         "c%s++; setTimeout(round%s, 2800);" % (k, k)),
    ]

# ---- style C: sequence() ----------------------------------------------------
STYLE_C = [
    ("helper", "  function sequence(o) {", HELPER + "  function sequence(o) {"),
    ("gate", "          finish(o.finish, o.done);",
     "          if (o.pass && right < Math.ceil(o.items.length * o.pass))\n"
     "            retryCheck($(el.fb), $(el.ch), right, o.items.length, "
     "function () { i = 0; right = 0; draw(); });\n"
     "          else finish(o.finish, o.done);"),
    ("the check alone passes `pass`",
     '    finish: 8,\n    done: "That is the whole lesson done.",',
     '    finish: 8,\n    pass: %s,\n    done: "That is the whole lesson done.",' % PASS),
]

# ---- the 41 reasons, keyed by each item's own spoken line --------------------
WHY = {
    "counting-to-twenty": {
        "How many counters?": "Touch each counter once as you count. The last number you say is how many.",
        "A dice shows five dots. How many dots?": "That pattern is always 5: one dot in each corner and one in the middle.",
        "Which word says thirteen?": "Thirteen is 13. Thirty is 30, and three is 3.",
        "Which digits do you press to write fourteen?": "Fourteen is 1 ten and 4 ones, so you write 1 and then 4.",
        "There are no apples left. Which number is that?": "None left is zero, and we write zero as 0.",
        "Which is more, nine or six?": "When you count, 9 comes after 6, so 9 is more.",
        "And how many counters now?": "One full frame is 10. The 4 in the next frame make 14.",
        "Which number comes just after sixteen?": "Count on one from 16: sixteen, seventeen.",
        "two, four, six, eight, what comes next?": "Counting in twos, each number is 2 more. 8 and 2 more is 10.",
        "seventeen is one ten and how many ones?": "One full frame is the ten. The 7 counters left over are the ones.",
        "count on in tens. zero, ten, what comes next?": "Counting in tens, each number is 10 more. 10 and 10 more is 20.",
        "Which is more, fourteen or seventeen?": "When you count, 17 comes after 14, so 17 is more.",
        "Is fifteen odd or even?": "Put 15 counters in pairs and one is left alone, so 15 is odd.",
        "In the line A, B, C, D, who is third?": "Count from the front: A is 1st, B is 2nd and C is 3rd.",
        "twenty, nineteen, eighteen, seventeen, what comes next?": "Counting back, each number is 1 less. One less than 17 is 16.",
    },
    "adding-and-taking-away": {
        "six add four": "Start at 6 and count on 4: 7, 8, 9, 10.",
        "Eight red and five blue. How many more red than blue?": "Count on from 5 to 8: 6, 7, 8. That is 3 more.",
        "ten take away three": "Start at 10 and count back 3: 9, 8, 7.",
        "four and what make ten?": "Count on from 4 up to 10: that is 6 more. 4 and 6 make 10.",
        "What is double five?": "Double 5 means 5 and 5 more. That makes 10.",
        "eight add five": "Go through 10: 8 and 2 make 10, then 3 more make 13.",
        "fourteen take away six": "Go through 10: take 4 to get to 10, then take 2 more to get to 8.",
        "six and what make ten?": "Count on from 6 up to 10: that is 4 more. 6 and 4 make 10.",
        "What is double eight?": "Double 8 means 8 and 8 more. That makes 16.",
        "six add seven. Use double six and one more.": "Double 6 is 12. Seven is one more than six, so add 1 to get 13.",
        "ten shillings and five shillings and two shillings. How much?": "10 and 5 make 15, and 2 more make 17 shillings.",
    },
    "what-comes-next": {
        "orange, teal, orange, teal, orange. What comes next?": "The colours take turns: orange, then teal. After orange comes teal.",
        "purple, gold, gold, purple, gold, gold. How many beads repeat?": "Purple, gold, gold is the part that repeats. That is 3 beads.",
        "two, four, six, what comes next?": "Each number is 2 more. 6 and 2 more is 8.",
        "ten, nine, eight, what comes next?": "Each number is 1 less. One less than 8 is 7.",
        "thirteen, fourteen, something, sixteen. What is missing?": "The numbers go up by 1. After 14 comes 15, and then 16.",
        "three add four?": "Start at 4 and count on 3: 5, 6, 7.",
        "nine take away five?": "Start at 9 and count back 5: 8, 7, 6, 5, 4.",
        "four add five?": "Start at 5 and count on 4: 6, 7, 8, 9.",
        "twelve take away four?": "Go through 10: take 2 to get to 10, then take 2 more to get to 8.",
        "The machine does add two. Six goes in. What comes out?": "The machine adds 2. 6 and 2 more is 8.",
        "twelve, fourteen, sixteen, what comes next?": "Each number is 2 more. 16 and 2 more is 18.",
        "Pattern one has two squares, pattern two has four, pattern three has six. How many squares in pattern four?": "Each pattern has 2 more squares than the one before. 6 and 2 more is 8.",
        "three, eight, three, eight, three, what comes next?": "3 and 8 take turns. After 3 comes 8.",
        "something, eight, ten, twelve, fourteen. Which number is missing at the start?": "The numbers go up by 2. The number before 8 is 2 less, which is 6.",
        "orange circle, teal square, orange circle, something, orange circle, teal square. Which shape is missing in the middle?": "An orange circle and a teal square take turns. After an orange circle comes a teal square.",
    },
}
for lesson, items in WHY.items():
    for say, why in items.items():
        assert '"' not in why and "\\" not in why, "a reason must not break its JS string: %r" % why

PLAN = {
    "days-months-and-clocks": style_a(4),
    "shapes-and-sizes": style_a(10),
    "asking-and-sorting": style_a(11),
    "counting-to-twenty": style_b(16, "12"),
    "adding-and-taking-away": style_b(8, "12"),
    "what-comes-next": style_b(14, "10"),
    "halves-and-wholes": STYLE_C,
}
for lesson, items in WHY.items():
    PLAN[lesson] = PLAN[lesson] + [
        ("reason: " + say[:34], 'say: "%s" }' % say, 'say: "%s", why: "%s" }' % (say, why))
        for say, why in items.items()]

done = skipped = refused = 0
for lesson, edits in PLAN.items():
    p = os.path.join(G, lesson + ".html")
    s = io.open(p, encoding="utf-8", newline="").read()
    if MARK in s:
        print("  already  %s" % lesson)
        skipped += 1
        continue
    bad = ["%s (%d)" % (name, s.count(old)) for name, old, _ in edits if s.count(old) != 1]
    if bad:
        print("  REFUSED  %s  not exactly once: %s" % (lesson, "; ".join(bad)))
        refused += 1
        continue
    for _, old, new in edits:
        s = s.replace(old, new, 1)
    if WRITE:
        io.open(p, "w", encoding="utf-8", newline="").write(s)
    reasons = sum(1 for n, _, _ in edits if n.startswith("reason"))
    print("  %s %-24s gate%s" % ("wrote   " if WRITE else "would   ", lesson,
                                   (" + %d reasons" % reasons) if reasons else ""))
    done += 1

print("\n  %s: %d changed, %d already done, %d refused"
      % ("write" if WRITE else "report", done, skipped, refused))
sys.exit(1 if refused else 0)
