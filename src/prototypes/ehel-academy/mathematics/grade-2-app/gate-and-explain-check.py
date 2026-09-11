# -*- coding: utf-8 -*-
"""Grade 2's end-of-lesson check decides completion at 75%, and explains every answer.

    python gate-and-explain-check.py            # report
    python gate-and-explain-check.py --write

The same two owner decisions Grade 1 took on 2026-09-11, applied to the nine
Grade 2 lessons, which the 2026-09-11 validation found doing neither:

  1. THE CHECK SCORE DECIDES COMPLETION, AT 75%. Every Grade 2 check called
     finish() when its questions ran out, whatever the score - and told a child
     on 3 of 10 "Try the steps again, then come back." while completing the
     lesson anyway. Now at or above the mark it completes as before; below it the
     child sees the score, how many they need, and a Try again button.
  2. THE CHECK EXPLAINS ITS ANSWERS. A wrong tap showed "It is 36." and a right
     one a cheer, no reason either way. Every check item now carries a `why`
     (written by hold-stage-2.py, which also replaced the out-of-stage items),
     shown and spoken after the answer, with 2.8 s to read it - Grade 1's pause.

All nine Grade 2 checks share one shape - const CHECK, cN/rightN/lockN,
roundN(), a click handler - so one set of anchors fits, with N and the finish
index read from each file. Every anchor must match exactly once or the file is
refused untouched. Guarded by a marker: a second run changes nothing.
"""
import io, os, re, sys

sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))
WRITE = "--write" in sys.argv[1:]
for a in sys.argv[1:]:
    if a != "--write":
        sys.exit("unrecognised argument: %s" % a)
MARK = "ehel-gate-check"
PASS = 0.75
LESSONS = ["tens-and-ones", "coins-and-change", "fair-shares", "patterns-that-grow", "sides-and-corners",
           "which-way-from-here", "how-much-how-long", "half-past-quarter-to", "count-it-chart-it"]
HELPER = """  /* %s: the end-of-lesson check completes the lesson only at %d%% (owner,
     2026-09-11, the rule Grade 1 already keeps). Below it the child sees the score,
     how many they need, and a button that restarts the check. */
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

changed = refused = done = 0
for name in LESSONS:
    path = os.path.join(HERE, name + ".html")
    s = io.open(path, encoding="utf-8", newline="").read()
    if MARK in s:
        print("  already  %s" % name); done += 1; continue
    ci = s.index("  const CHECK = [")
    m = re.compile(r"let c(\d+) = 0, right\1 = 0, lock\1 = false;").search(s, ci)
    if not m:
        print("  REFUSED  %s: no check counter after const CHECK" % name); refused += 1; continue
    k = m.group(1)
    fm = re.compile(r'finish\((\d+), "You got " \+ right%s \+ " out of " \+ CHECK\.length \+ "\."\); return;' % k).search(s, ci)
    if not fm:
        print("  REFUSED  %s: no unconditional finish() in round%s" % (name, k)); refused += 1; continue
    fin = fm.group(0)
    tm = re.compile(r"c%s\+\+; setTimeout\(round%s, (\d+)\);" % (k, k)).search(s, ci)
    anchors = [
        ("helper", "  const CHECK = [", HELPER + "  const CHECK = ["),
        ("gate", fin, 'if (right%s >= Math.ceil(CHECK.length * %s)) { %s }\n'
                      '      retryCheck($("fb%s"), $("ch%s"), right%s, CHECK.length, '
                      'function () { c%s = 0; right%s = 0; round%s(); }); return;' % (k, PASS, fin, k, k, k, k, k, k)),
        ("explain on screen", '$("fb%s").textContent = ok ? cheer() : "It is " + q.a + ".";' % k,
         '$("fb%s").textContent = (ok ? cheer() + " " : "It is " + q.a + ". ") + (q.why || "");' % k),
        ("explain aloud", 'say(ok ? cheer() : "It is " + q.a);', 'say((ok ? cheer() + " " : "It is " + q.a + ". ") + (q.why || ""));'),
        ("time to read it", tm.group(0) if tm else "<missing>", "c%s++; setTimeout(round%s, 2800);" % (k, k)),
    ]
    bad = [a for a in anchors if s.count(a[1]) != 1]
    if bad:
        print("  REFUSED  %s: %s" % (name, ", ".join("%s (x%d)" % (a[0], s.count(a[1])) for a in bad))); refused += 1; continue
    for _, old, new in anchors:
        s = s.replace(old, new)
    whys = len(re.findall(r"\bwhy: ", s[s.index("  const CHECK = ["):s.index("\n  ];", s.index("  const CHECK = ["))]))
    items = len(re.findall(r"\{ q: ", s[s.index("  const CHECK = ["):s.index("\n  ];", s.index("  const CHECK = ["))]))
    if whys != items:
        print("  REFUSED  %s: %d check items but %d reasons" % (name, items, whys)); refused += 1; continue
    if WRITE:
        io.open(path, "w", encoding="utf-8", newline="").write(s)
    changed += 1
    print("  %s  %-24s check c%s, finish(%s), %d items, every one with a reason" % ("gated " if WRITE else "would gate", name, k, fm.group(1), items))
# THE SCORE LINE UNDER THE CHECK HAS TO AGREE WITH THE GATE. It praised from a
# fixed 7 right - "Nearly all of them!" - so a child on 7 of 10, one short of
# the mark, read praise beside "Get 8 right to finish". It now praises from the
# pass mark, and below it says what the Try again button is for.
SCORE = re.compile(r'right(\d+) >= 7 \? "Nearly all of them!" : "Try the steps again, then come back\."')
scored = 0
for name in LESSONS:
    path = os.path.join(HERE, name + ".html")
    s = io.open(path, encoding="utf-8", newline="").read()
    t, n = SCORE.subn(lambda m: 'right%s >= Math.ceil(CHECK.length * %s) ? "Nearly all of them!" : '
                                '"Look back at the steps if you like, then have another go."' % (m.group(1), PASS), s)
    if n > 1:
        print("  REFUSED  %s: %d score lines" % (name, n)); refused += 1; continue
    if n and WRITE:
        io.open(path, "w", encoding="utf-8", newline="").write(t)
    scored += n
print("  score line tied to the pass mark: %d %s" % (scored, "changed" if WRITE else "to change"))
print("\n  report: %d %s, %d already done, %d refused" % (changed, "changed" if WRITE else "to change", done, refused))
sys.exit(1 if refused else 0)
