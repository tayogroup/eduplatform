# -*- coding: utf-8 -*-
"""The spoken mini-lesson for the 27 steps this depth pass added.

    python add-explain-scripts.py            # report
    python add-explain-scripts.py --write

WHY THIS EXISTS. The Stage 2 comparison counted 112 of the build's 139 steps
carrying a data-explain, and the 27 that do not are exactly the ones added by
this pass: spot-the-mistake, the story problem, and always-or-sometimes-true,
three per lesson. Those steps read aloud - they all have data-say - but a child
who taps Explain on them gets nothing, while every other step in the build
answers with a spoken mini-lesson. That gap was named on the comparison page as
the first thing owed, and this closes it.

THE FOUR MOVES, taken from the 112 rather than invented here. Measured across
the existing scripts: 103 of 112 run calm/1.15 -> friendly/1.25 ->
empathetic/1.3 -> cheerful/1.45, separated by three 330ms breaks, 5 to 9
sentences, 201 to 901 characters, median 785. The moves mean:

    1 CALM        name the idea, once, in one sentence.
    2 FRIENDLY    show it - a WORKED example, not a restatement.
    3 EMPATHETIC  the thing that trips people, said kindly.
    4 CHEERFUL    hand the next one to the child.

WHAT IS DIFFERENT ABOUT THESE 27. Every other script in the build teaches a
piece of mathematics. These three steps teach a way of THINKING - critiquing
someone else, reading a sum out of a story, testing whether an idea always
holds - so move 1 names the move and move 2 works a real example FROM THAT
LESSON, never a generic one. Each worked example below is an item the child
actually meets on that step, so the explanation and the questions cannot drift
apart.

NO APOSTROPHES, AND NO WORDS WITH THE APOSTROPHE TAKEN OUT. data-explain is a
single-quoted HTML attribute and the 112 existing scripts contain not one
apostrophe, raw or escaped; one would end the attribute early and silently
swallow the rest of the tag. The second half of that rule matters just as much
and is easier to get wrong: these scripts are CAPTIONED sentence by sentence,
so dodging the apostrophe by writing "elses" or "oclock" puts a misspelling on
screen in front of the child. The audit refuses both. The house spelling for
the one unavoidable case is "o clock", two words, which the existing scripts
already use three times.

LENGTH. Every script here was written twice. The first draft averaged 910
characters and 14 of the 27 failed the audit's ceiling; the voice was simply
wordier than the 112 it has to sit beside. They were not trimmed to the line -
they were trimmed to the median, which is what makes them sound like the rest
of the build rather than like a visitor.

Guarded by a marker and by the data-say signature of each target step: this
refuses any page where the three steps are not present in the shape
add-spot-the-mistake.py, add-story-problems.py and add-always-true.py write
them, so it cannot run before them or against a page it does not understand.
"""
import io, os, re, sys

sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))
WRITE = "--write" in sys.argv[1:]
for a in sys.argv[1:]:
    if a != "--write":
        sys.exit("unrecognised argument: %s" % a)

MARK = "ehel-explain-scripts"

# The three steps this pass added, identified by the data-say each tool writes.
# These strings are constant across all nine lessons by construction; the tool
# checks that each appears exactly once per page before anything is written.
TARGETS = {
    "spot":   "Read what each child says. Work it out yourself. Then tap what went wrong.",
    "story":  "Read the story. Work out the answer. Then tap it.",
    "always": "Somebody has an idea. Test it on each example, then say whether it always works.",
}

# Each script is four moves; each move is a list of sentences, one <s> apiece.
# The worked example in move 2 is a real item from that lesson's own bank.
S = {}

S["tens-and-ones"] = {
 "spot": (
  ["Finding a mistake somebody else made is its own skill."],
  ["Ali says his array is 4 rows of 5.",
   "But two rows have 5 counters and two have only 4.",
   "Rows must match, so it is not an array."],
  ["A mistake usually starts from a sensible idea.",
   "Ali did draw 4 rows. He just never checked them."],
  ["Read the first one. Work it out yourself first."]),
 "story": (
  ["A story problem hides a sum inside words."],
  ["A farmer has 34 goats and buys 20 more.",
   "Buys more means add.",
   "30 and 20 make 50, and the 4 ones stay, so 54."],
  ["The numbers are not always used in the order given.",
   "Some stories need two steps, so read to the end."],
  ["Read the first story twice, then find the sum."]),
 "always": (
  ["Some ideas work every time, and some only sometimes."],
  ["Musa says multiplying always makes a bigger answer.",
   "2 times 5 is 10, bigger than both, so it holds.",
   "But 5 times 1 is just 5, which is not bigger."],
  ["Examples that agree never prove an idea.",
   "One that breaks it settles the question."],
  ["Test the idea on each example, then decide."]),
}

S["coins-and-change"] = {
 "spot": (
  ["Checking a money answer means checking value, not how many coins."],
  ["Hodan counts eight 10 shilling coins and three 1 shilling coins.",
   "She says 11 shillings, which counts the pieces.",
   "Eight tens is 80, and 3 more is 83 shillings."],
  ["Counting the coins is a sensible move.",
   "It just does not tell you what they are worth."],
  ["Read the first one. Work out the real amount first."]),
 "story": (
  ["A money story hides a sum like any other story problem."],
  ["Ali buys a pencil for 25 shillings and a rubber for 15.",
   "Altogether means add.",
   "The tens make 30 and the ones 10, so 40 shillings."],
  ["Spends and buys mean add.",
   "Has left and change mean take away."],
  ["Read the first story. Decide the sum before you work it."]),
 "always": (
  ["Some ideas about money hold every time, and some only look true."],
  ["Ali says more coins always means more money.",
   "Five 1 shilling coins is five pieces and 5 shillings.",
   "One 20 shilling coin is one piece, worth four times that."],
  ["More pieces feels like more, and with sweets it would be.",
   "Each coin carries its own value."],
  ["Test the idea on each example, then decide."]),
}

S["fair-shares"] = {
 "spot": (
  ["A fraction answer can look right, so check the parts first."],
  ["Ali sees a bar cut into 2 parts and calls each a half.",
   "But one part is much longer than the other.",
   "Halves must be equal, so neither is a half."],
  ["Two parts is what anybody notices first.",
   "Equal parts is what makes them halves."],
  ["Read the first one. Look hard at the picture."]),
 "story": (
  ["A fraction story asks you to share a number."],
  ["There are 12 sweets and Amina eats half.",
   "Half means two equal groups.",
   "6 and 6 make 12, so Amina eats 6."],
  ["Half of a number is not the small number in the story.",
   "Find what is being shared, then share it."],
  ["Read the first story. Say what is being shared."]),
 "always": (
  ["A fraction idea can hold once and fall apart next time."],
  ["Musa says a bigger bottom number means a bigger fraction.",
   "Compare a half with a quarter.",
   "A quarter has the bigger bottom number and is the smaller piece."],
  ["The bottom number counts the pieces, not their size.",
   "More pieces means each one is smaller."],
  ["Test the idea on each example, then decide."]),
}

S["patterns-that-grow"] = {
 "spot": (
  ["To check a counting pattern, check every jump."],
  ["Musa counts in fives: 5, 10, 15, 25, 30.",
   "The jumps go 5, 5, 10, 5.",
   "20 is missing, so one jump is twice as big."],
  ["The list still rises and still ends in the right place.",
   "That is why this is easy to read straight past."],
  ["Read the first one. Check each jump in turn."]),
 "story": (
  ["A pattern story asks you to count on, not to do one sum."],
  ["Musa saves 5 shillings a week for 4 weeks.",
   "Count on in fives, once per week.",
   "5, 10, 15, 20, so he has 20 shillings."],
  ["Count the jumps, not the numbers you say.",
   "Four weeks means four jumps."],
  ["Read the first story. Find the jump, then count on."]),
 "always": (
  ["Some patterns grow by the same amount, and some do not."],
  ["Hodan says a growing pattern always steps up equally.",
   "5, 10, 15, 20 does, going up by 5.",
   "But 1, 3, 6, 10 goes up by 2, then 3, then 4."],
  ["Equal steps is one kind of pattern, not the only kind.",
   "A pattern needs a rule you can carry on."],
  ["Test the idea on each example, then decide."]),
}

S["sides-and-corners"] = {
 "spot": (
  ["A shape is what it is, whatever way round you see it."],
  ["Ali says a triangle upside down is not a triangle.",
   "Count the sides: still 3.",
   "Turning a shape changes nothing about it."],
  ["Shapes are nearly always drawn flat on one side.",
   "So a turned one just looks unfamiliar."],
  ["Read the first one. Count the sides yourself."]),
 "story": (
  ["A shape story describes a shape and asks you to name it."],
  ["Kiki draws a shape with 4 straight sides, all equal.",
   "Four equal sides is a square.",
   "The story never says square, so the description names it."],
  ["Read every part of the description.",
   "Four sides alone is not enough, as a rectangle has four."],
  ["Read the first story. List what you are told."]),
 "always": (
  ["Some things are true of every flat shape."],
  ["Ali says a shape has as many corners as sides.",
   "A triangle has 3 sides and 3 corners.",
   "A square has 4 and 4, and a six sided shape has 6."],
  ["Every side has to end somewhere.",
   "Where two sides meet is a corner."],
  ["Test the idea on each example, then decide."]),
}

S["which-way-from-here"] = {
 "spot": (
  ["A direction depends on which way you are facing."],
  ["Ali says left is the same side for everybody.",
   "Face a friend and you both point left.",
   "You point at opposite walls."],
  ["Left feels fixed because your own left never moves.",
   "It moves for anyone facing you."],
  ["Read the first one. Work out which way they face."]),
 "story": (
  ["A movement story asks you to follow moves and count."],
  ["Musa walks 3 squares, turns, then walks 2 more.",
   "A turn changes the way he faces, not where he is.",
   "So he walked 3 and 2, which is 5 squares."],
  ["Turns are easy to count as moves by mistake.",
   "Count only steps that take you somewhere."],
  ["Read the first story. Follow the moves one at a time."]),
 "always": (
  ["Some things about turning hold every time."],
  ["Musa says four quarter turns bring you back.",
   "Face the door and make four quarter turns.",
   "You face the door again, wherever you started."],
  ["Four quarters make one whole, for turns as for shapes.",
   "So the starting point does not matter."],
  ["Test the idea on each example, then decide."]),
}

S["how-much-how-long"] = {
 "spot": (
  ["Before comparing measurements, check the unit is the same."],
  ["Musa says the book is longer, as it took more cubes.",
   "The pencil was measured in paperclips.",
   "Different units, so the numbers do not compare."],
  ["Comparing the numbers is the right instinct.",
   "It works once both count the same unit."],
  ["Read the first one. Check what each was measured with."]),
 "story": (
  ["A measuring story gives two amounts and compares them."],
  ["A pencil is 9 centimetres and a crayon is 6.",
   "How much longer asks for the difference.",
   "9 take away 6 is 3 centimetres longer."],
  ["How much longer and how long altogether sound alike.",
   "Longer than means take away, altogether means add."],
  ["Read the first story. Difference, or total?"]),
 "always": (
  ["Some ideas about size hold every time, and some do not."],
  ["Ali says a bigger object is always heavier.",
   "A stone is smaller than a balloon.",
   "It is also much heavier, so size does not decide."],
  ["Bigger things often are heavier, so this feels true.",
   "Often is not always."],
  ["Test the idea on each example, then decide."]),
}

S["half-past-quarter-to"] = {
 "spot": (
  ["To check a time, read the short hand first."],
  ["Musa sees it between 3 and 4 and says half past 4.",
   "The short hand has passed 3, not reached 4.",
   "So the hour is 3, and it is half past 3."],
  ["The short hand moves towards the next number all hour.",
   "Reading the one ahead is the usual slip."],
  ["Read the first one. Say which hour has passed."]),
 "story": (
  ["A time story moves you forwards or back from a time."],
  ["A lesson starts at 9 o clock and lasts half an hour.",
   "Half an hour is 30 minutes.",
   "So the lesson ends at half past 9."],
  ["Lasts and takes move you forwards.",
   "Started and was move you back."],
  ["Read the first story. Say which way time moves."]),
 "always": (
  ["Some things about clocks are fixed whatever the time."],
  ["Kiki says every hour has 60 minutes.",
   "From 2 to 3 is 60 minutes.",
   "From 9 to 10 is 60 as well, morning or night."],
  ["Hours feel long or short depending what you are doing.",
   "What the clock counts does not change."],
  ["Test the idea on each example, then decide."]),
}

S["count-it-chart-it"] = {
 "spot": (
  ["A graph can be read wrongly even when drawn perfectly."],
  ["Ali counts 4 pictures and says 4 children.",
   "But the key says one picture stands for 2.",
   "So 4 pictures means 8 children."],
  ["Counting pictures is right on some graphs.",
   "The key tells you which kind you have."],
  ["Read the first one. Find the key before counting."]),
 "story": (
  ["A data story asks a question about collected numbers."],
  ["8 children chose mango and 5 chose banana.",
   "How many more asks for the difference.",
   "8 take away 5 is 3 more for mango."],
  ["How many more means difference.",
   "How many altogether means total."],
  ["Read the first story. Say what is being asked."]),
 "always": (
  ["Some ideas about chance sound sensible and are wrong."],
  ["Hodan says a thing not happening makes it more likely.",
   "A coin landed heads three times.",
   "The next throw is still an even chance."],
  ["Waiting makes something feel more and more due.",
   "A coin starts fresh every single time."],
  ["Test the idea on each example, then decide."]),
}

# --------------------------------------------------------------------------
W1 = '<mstts:express-as style="calm" styledegree="1.15"><prosody rate="-8%">'
W2 = '<break time="330ms"/><mstts:express-as style="friendly" styledegree="1.25">'
W3 = ('<break time="330ms"/><mstts:express-as style="empathetic" styledegree="1.3">'
      '<prosody rate="-6%">')
W4 = '<break time="330ms"/><mstts:express-as style="cheerful" styledegree="1.45">'
CLOSE_P = "</prosody></mstts:express-as>"
CLOSE = "</mstts:express-as>"

# Avoiding the apostrophe is how the attribute survives; misspelling a word is
# how that goes wrong. These scripts are CAPTIONED sentence by sentence, so a
# stripped contraction is not merely spoken - the child reads it on screen.
STRIPPED = ("elses", "oclock", "dont", "cant", "wont", "isnt", "doesnt", "didnt",
            "thats", "heres", "theres", "youre", "lets", "shes", "hes",
            "childs", "musas", "aminas", "hodans", "alis", "kikis", "vitis")


def section_tags(s):
    """(start, end, inner) for every <section class="slide" ...> tag.

    The tag ends at the first > that is NOT inside a quoted attribute value.
    This cannot be a [^>]* regex once a data-explain is present, because the
    SSML in it contains > on every closing tag - and that is legal HTML which
    the browser parses correctly. Written naively, the "already carries a
    data-explain" guard below reads a tag truncated at </prosody>, never sees
    the attribute, and waves a second copy through.
    """
    out = []
    for m in re.finditer(r'<section class="slide"', s):
        i, q = m.end(), None
        while i < len(s):
            c = s[i]
            if q:
                if c == q:
                    q = None
            elif c in "\"'":
                q = c
            elif c == ">":
                break
            i += 1
        out.append((m.start(), i + 1, s[m.end():i]))
    return out


def build(moves):
    """Four lists of sentences -> the SSML the 112 existing scripts use."""
    idea, worked, trap, hand = moves
    j = lambda ss: "".join("<s>" + x + "</s>" for x in ss)
    return (W1 + j(idea) + CLOSE_P + W2 + j(worked) + CLOSE
            + W3 + j(trap) + CLOSE_P + W4 + j(hand) + CLOSE)


def audit(script, where):
    """Refuse anything that would not pass for one of the 112."""
    bad = []
    if "'" in script:
        bad.append("contains an apostrophe - it would close the attribute early")
    low = script.lower()
    for w in STRIPPED:
        if re.search(r"\b" + w + r"\b", low):
            bad.append("apostrophe stripped out of a word, leaving %r on screen" % w)
    if script.count("<break") != 3:
        bad.append("%d breaks, want 3" % script.count("<break"))
    sig = re.findall(r'style="(\w+)" styledegree="([\d.]+)"', script)
    want = [("calm", "1.15"), ("friendly", "1.25"), ("empathetic", "1.3"), ("cheerful", "1.45")]
    if sig != want:
        bad.append("move signature is %s" % sig)
    n = script.count("<s>")
    if script.count("</s>") != n:
        bad.append("unbalanced <s>")
    if not 5 <= n <= 9:
        bad.append("%d sentences, the 112 run 5 to 9" % n)
    if not 201 <= len(script) <= 901:
        bad.append("%d characters, the 112 run 201 to 901" % len(script))
    if bad:
        sys.exit("  REFUSED %s: %s" % (where, "; ".join(bad)))
    return script


def main():
    pages = sorted(f for f in os.listdir(HERE)
                   if f.endswith(".html") and not f.startswith(("g2-index", "g2-review")))
    todo, done, refused, total, lens = [], 0, 0, 0, []
    for f in pages:
        slug = f[:-5]
        if slug not in S:
            continue
        path = os.path.join(HERE, f)
        s = io.open(path, encoding="utf-8", newline="").read()
        if MARK in s:
            print("  already  %-26s" % f)
            done += 1
            continue

        out, wrote = s, 0
        for kind in ("spot", "story", "always"):
            say = 'data-say="' + TARGETS[kind] + '"'
            hits = [t for t in section_tags(out) if say in t[2]]
            if len(hits) != 1:
                print("  REFUSED  %-26s %s step: found %d, want 1" % (f, kind, len(hits)))
                refused += 1
                out = None
                break
            start, end, inner = hits[0]
            if "data-explain" in inner:
                print("  REFUSED  %-26s %s step already carries a data-explain" % (f, kind))
                refused += 1
                out = None
                break
            script = audit(build(S[slug][kind]), "%s %s" % (f, kind))
            lens.append(len(script))
            out = (out[:start] + '<section class="slide"' + inner
                   + " data-explain='" + script + "'>" + out[end:])
            wrote += 1
        if out is None:
            continue

        # These pages are FRAGMENTS - no </body> to anchor to, they end on a
        # </style> - so the marker is appended, the way the sibling tools put
        # theirs inside the <style> block they add. A </body> anchor here would
        # match nothing and leave the page unmarked, which a second run would
        # read as "not done yet" and patch all over again.
        out = out.rstrip() + "\n<!-- " + MARK + ": see add-explain-scripts.py -->\n"
        assert out.count(MARK) == 1, f
        todo.append((path, out))
        total += wrote
        print("  would    %-26s %d mini-lesson(s)" % (f, wrote))

    if WRITE:
        for path, out in todo:
            io.open(path, "w", encoding="utf-8", newline="").write(out)
    print("")
    if lens:
        print("  script length: min %d, median %d, max %d   (the 112 run 201-901, median 785)"
              % (min(lens), sorted(lens)[len(lens) // 2], max(lens)))
    print("  %d mini-lesson(s) across %d lesson(s) %s, %d already done, %d refused%s"
          % (total, len(todo), "written" if WRITE else "to write", done, refused,
             "" if WRITE else "   (--write to apply)"))


main()
