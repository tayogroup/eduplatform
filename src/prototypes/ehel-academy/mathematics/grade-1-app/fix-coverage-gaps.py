# -*- coding: utf-8 -*-
"""Close the two Stage 1 coverage gaps found by the 2026-09-06 audit.

  1Ni.03  subtraction is taught as take-away and difference, but counting
          back is never framed as a way to subtract.   -> up-to-twenty.html slide 13
  1Ss.02  the Venn diagram is taught as "two hoops that cross" and never
          named, while Carroll IS named on slide 9.    -> asking-and-sorting.html slide 8

Both files are wholly CRLF. Read and write as bytes, newline="" on the way
out, so the line endings survive - a normalised file would rewrite 3,123
lines under whoever reads the diff next.

Every replacement asserts exactly one occurrence before writing, and nothing
is written unless every replacement in that file matched.
"""
import io, os, sys

SP = os.path.dirname(os.path.abspath(__file__))
DRY = "--dry" in sys.argv


def patch(fname, edits):
    path = os.path.join(SP, fname)
    with io.open(path, "r", encoding="utf-8", newline="") as f:
        src = f.read()
    crlf = src.count("\r\n")
    out = src
    for label, old, new in edits:
        n = out.count(old)
        if n != 1:
            print("  REFUSED  %-46s found %d occurrences, need exactly 1" % (label, n))
            return False
        out = out.replace(old, new, 1)
        print("  ok       %s" % label)
    if out == src:
        print("  nothing changed")
        return False
    if DRY:
        print("  [dry] %s would grow by %d chars" % (fname, len(out) - len(src)))
        return True
    with io.open(path, "w", encoding="utf-8", newline="") as f:
        f.write(out)
    with io.open(path, "r", encoding="utf-8", newline="") as f:
        back = f.read()
    print("  written  %s  (+%d chars, CRLF %d -> %d)"
          % (fname, len(out) - len(src), crlf, back.count("\r\n")))
    return True


# ---------------------------------------------------------------- 1Ni.03
# Teach counting back as a SECOND route to a subtraction the learner has
# just done by taking away. Cambridge names three structures; the lesson
# already links two of them on slide 14 ("Taking away and finding the
# difference are both subtraction"), so this completes the set in the same
# voice. The worked example in the explainer counts back from seven.
UP = [
 ("1Ni.03 explainer: counting back as a way to subtract",
  "<s>Four left.</s><s>Seven take away three is four.</s></mstts:express-as>",
  "<s>Four left.</s><s>Seven take away three is four.</s>"
  "<s>There is a second way to reach that answer, and it is called counting back.</s>"
  "<s>Start at seven and count back three.</s>"
  "<s>Six.</s><s>Five.</s><s>Four.</s>"
  "<s>Taking away and counting back are two ways of doing the same subtraction.</s>"
  "</mstts:express-as>"),

 ("1Ni.03 activity: show the count back after each answer",
  '$("fb8").className = "fb good"; $("fb8").textContent = cheer() + " " + n8 '
  '+ " take away " + k8 + " leaves " + left + ".";',
  'const back8 = []; for (let j = 1; j <= k8; j++) back8.push(n8 - j);\r\n'
  '      $("fb8").className = "fb good"; $("fb8").textContent = cheer() + " " + n8 '
  '+ " take away " + k8 + " leaves " + left + ". Count back " + k8 + " from " + n8 '
  '+ " and you land on the same answer: " + back8.join(", ") + ".";'),

 ("1Ni.03 narration: say the count back aloud",
  'say(cheer() + " " + n8 + " take away " + k8 + " leaves " + left); '
  '$("next8").hidden = false; r8++; right8++;',
  'say(cheer() + " " + n8 + " take away " + k8 + " leaves " + left '
  '+ ". Now count back " + k8 + " from " + n8 + ". " + back8.map((x) => WORDS[x]).join(", ") '
  '+ ". The same answer."); $("next8").hidden = false; r8++; right8++;'),
]

# ---------------------------------------------------------------- 1Ss.02
# Name the diagram, mirroring slide 9, whose heading is the formal name
# ("A Carroll diagram") while its body keeps the plain language. The child
# friendly phrase is not lost - it stays in the explainer and the say line.
ASK = [
 ("1Ss.02 heading: name it, as slide 9 names Carroll",
  "<h2>Two hoops that cross</h2>",
  "<h2>A Venn diagram</h2>"),

 ("1Ss.02 explainer: introduce the name",
  "<s>Two hoops, crossing over, with a space in the middle.</s>"
  "<s>Each hoop has its own rule.</s>",
  "<s>Two hoops, crossing over, with a space in the middle.</s>"
  "<s>Two hoops that cross like this are called a Venn diagram.</s>"
  "<s>Each hoop has its own rule.</s>"),

 ("1Ss.02 opening line: name it on screen",
  'data-say="Two hoops that cross over. A card that follows both rules goes '
  'in the middle, where the hoops overlap."',
  'data-say="This is a Venn diagram: two hoops that cross over. A card that '
  'follows both rules goes in the middle, where the hoops overlap."'),

 ("1Ss.02 completion line: name it again at the end",
  '$("say8").innerHTML = "Every card has a place. The <b>middle</b> is for '
  'cards that follow <b>both</b> rules.";',
  '$("say8").innerHTML = "Every card has a place. The <b>middle</b> is for '
  'cards that follow <b>both</b> rules. Two hoops that cross like this are a '
  '<b>Venn diagram</b>.";'),

 ("1Ss.02 sticker: match the renamed slide",
  '["\U0001f517", "Two hoops that cross"]',
  '["\U0001f517", "I can read a Venn diagram"]'),
]

print("up-to-twenty.html")
a = patch("up-to-twenty.html", UP)
print("\nasking-and-sorting.html")
b = patch("asking-and-sorting.html", ASK)
print("\n%s" % ("BOTH PATCHED" if (a and b) else "INCOMPLETE - see refusals above"))
sys.exit(0 if (a and b) else 1)
