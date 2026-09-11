# -*- coding: utf-8 -*-
"""Grade 4 fixes from the 2026-09-11 validation, made in the SOURCES that
compose-lessons.py and build-lessons.py read, so build-all.sh carries them into
every rebuild.

    python fix-validation.py            # report
    python fix-validation.py --write    # change the sources; then run ./build-all.sh

1. A FAILED CHECK HAD NOWHERE TO GO. Each check completes the lesson only at its
   own pass mark (7 of 10, 8 of 11, 11 of 14, 6 of 8 ...). Below it the page
   said "That is all of them." and "5 out of 10 right." and stopped: no button,
   no way on but reloading. Now it shows how many are needed and a Try again
   button that restarts the check. The marks are unchanged - compose-lessons.py
   SCALES each source's mark to the questions a lesson keeps, and it now scales
   the number in the Try again call the same way, so the two cannot disagree.
   The helper is ONE function in shell.js, beside say(), not a copy per lesson.
2. THREE THINGS FROM STAGE 5, each checked against the framework file:
     - a "Decimal" readout (0.35) on the hundred square in Parts of a Whole.
       Stage 4 has percentages (4Nf.06) and no decimals at all; tenths and
       hundredths are 5Np.01 and decimal equivalents 5Nf.04.
     - "isosceles" and "equilateral" in Shape and Measures - naming triangles by
       their sides is 5Gg.01. The shapes stay; they are described instead.
     - "an even chance" on the chance line in Asking, Sorting and Chance, and
       "both are as likely as each other" - equally likely is 5Sp.01. Stage 4's
       own words are maybe, likely, certain and impossible (4Sp.01).
3. 4Gg.08 WAS TAUGHT AND NOT WRITTEN DOWN. "Acute, right or obtuse?" comes from
   the donor slide in g4-lesson.js, whose header named no code, so the coverage
   audit reported 45 of 46. The code goes on the header.

Idempotent: every edit is skipped when its new text is already there.
"""
import io, os, re, sys

sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))
WRITE = "--write" in sys.argv[1:]
for a in sys.argv[1:]:
    if a != "--write":
        sys.exit("unrecognised argument: %s" % a)
MARK = "ehel-g4-validation-fixes"
HELPER = """
  /* %s: a check below its pass mark shows how many are needed and a Try
     again button, instead of stopping with nothing to press. One definition for
     every lesson; each check passes its own pass mark. */
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

out = {}


def get(f):
    # Read with CRLF folded to LF. Eight of these sources were COMMITTED with CRLF
    # although .gitattributes says `* text=auto eol=lf`, so git normalises them on
    # the next commit whatever this does; writing LF here matches what git will
    # store, and what compose-lessons.py and build-lessons.py now write.
    return out.get(f) or io.open(os.path.join(HERE, f), encoding="utf-8", newline="").read().replace("\r\n", "\n")


def swap(f, old, new, label):
    s = get(f)
    if old not in s and (s.count(new) == 1 or new == ""):   # a deletion is done when the old text is gone
        return
    if s.count(old) != 1:
        sys.exit("  REFUSED: %s: %s - expected 1, found %d" % (f, label, s.count(old)))
    out[f] = s.replace(old, new)


# 1a. the helper, once, in the shell every lesson is built with
s = get("shell.js")
if MARK not in s:
    anchor = "  function say(text) { VOICE.speak(text); }\n"
    if s.count(anchor) != 1:
        sys.exit("  REFUSED: shell.js has no single say() to put the helper beside")
    out["shell.js"] = s.replace(anchor, anchor + HELPER)

# 1b. each source's check: the end-of-list branch that says "That is all of them."
BRANCH = re.compile(r'if \((\w+) >= Q(\d+)\.length\) \{\n\s*\$\("stem\2"\)\.textContent = "That is all of them\.";'
                    r'.*?\n(\s*)if \((\w+) >= (\d+)\) finish\((\d+), ""\);\n', re.S)
for f in ("num-slides.js", "frac-slides.js", "time-slides.js", "shape-slides.js", "stats-slides.js"):
    s = get(f)
    if "retryCheck(" in s:
        continue
    ms = list(BRANCH.finditer(s))
    if len(ms) != 1:
        sys.exit("  REFUSED: %s: %d check branches of the known shape" % (f, len(ms)))
    m = ms[0]
    c, k, ind, got, need, _slot = m.groups()
    rnd = re.findall(r"function (round\w*)\(\) \{", s[:m.start()])[-1]
    add = ('%selse retryCheck($("fb%s"), $("choices%s"), %s, Q%s.length, %s, '
           'function () { %s = 0; %s = 0; %s(); });\n' % (ind, k, k, got, k, need, c, got, rnd))
    out[f] = s[:m.end()] + add + s[m.end():]

# 1c. compose-lessons.py scales the pass mark; it must scale the Try again's too.
# Guarded on its own name: the new text CONTAINS the old, so the generic test in
# swap() would find the old line still there and insert the block again.
if "retryCheck" not in get("compose-lessons.py"):
  swap("compose-lessons.py",
     '    chk = chk[: mth.start(2)] + str(scaled) + chk[mth.end(2):]\n',
     '    chk = chk[: mth.start(2)] + str(scaled) + chk[mth.end(2):]\n'
     '    # ...and the same number where Try again says how many are needed\n'
     '    # (fix-validation.py, 2026-09-11) - two copies of one mark must not disagree\n'
     '    chk, nr = re.subn(r"(retryCheck\\([^;]*?\\.length, )\\d+(, function)",\n'
     '                      lambda r: r.group(1) + str(scaled) + r.group(2), chk)\n'
     '    assert nr == 1, "%s: expected one retryCheck in the check block, found %d" % (key, nr)\n',
     "compose scales the Try again mark")

# 2. Stage 5 content
swap("frac-slides.js",
     "      '<div class=\"read3\"><span class=\"r3lab\">Decimal</span><b>' + (n5 / 100).toFixed(2) + \"</b></div>\" +\n",
     "", "the Decimal readout")
# the readout row was three fixed columns; with the decimal gone it holds two
swap("frac-extra.css", ".reads3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 10px; }",
     ".reads3 { display: grid; grid-auto-flow: column; grid-auto-columns: 1fr; gap: 8px; margin-top: 10px; }",
     "readout columns")
swap("shape-slides.js", '{ name: "Isosceles triangle", ok: ["V"],', '{ name: "Triangle", ok: ["V"],', "isosceles")
swap("shape-slides.js", "Six equilateral triangles round a point make a regular hexagon",
     "Six triangles with equal sides, fitted round a point, make a regular hexagon", "equilateral (why)")
swap("shape-slides.js", 'const yes = ["equilateral triangle", "square", "regular hexagon"][rnd(0, 2)];',
     'const yes = ["triangle with equal sides", "square", "regular hexagon"][rnd(0, 2)];', "equilateral (option)")
swap("stats-slides.js", 'const WORDS6 = ["impossible", "unlikely", "even chance", "likely", "certain"];',
     'const WORDS6 = ["impossible", "unlikely", "maybe", "likely", "certain"];   /* "even chance" is Stage 5\'s Sp.01 */',
     "the chance line")
swap("stats-slides.js", "Three faces are even and three are odd, so it happens about half the time. An even chance.",
     "Three faces are even and three are odd, so it might happen and it might not. Maybe.", "dice reason")
swap("stats-slides.js", "A coin has two sides and both are as likely as each other. An even chance.",
     "A coin has two sides, so heads might come up and it might not. Maybe.", "coin reason")

# 3. the objective the angle step teaches
swap("g4-lesson.js", "  /* ---- 10: angles ---- */", "  /* ---- 10: angles (0096 4Gg.08) ---- */", "4Gg.08 header")

for f, s in sorted(out.items()):
    if WRITE:
        io.open(os.path.join(HERE, f), "w", encoding="utf-8", newline="").write(s)
    print("  %s  %s" % ("changed" if WRITE else "would change", f))
print("\n  %d source(s) %s" % (len(out), "changed - now run ./build-all.sh" if WRITE else "to change - pass --write"))
