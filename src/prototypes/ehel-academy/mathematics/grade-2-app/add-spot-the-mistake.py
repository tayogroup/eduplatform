# -*- coding: utf-8 -*-
""""Spot the mistake" - critiquing and improving, from the Cambridge Stage 2
books. Installs the item runner this build does not have, then gives every
lesson a step of six.

    python add-spot-the-mistake.py            # report
    python add-spot-the-mistake.py --write

WHY IT COMES FIRST. Grade 2 has a warm-up, nine or so teaching steps, a gated
check and a "How do you know?" step - and NO generic item runner at all. Grade 1
had `secondStep()` already; here it has to be installed before anything else can
add a bank of questions. Story problems, differentiation and "Will it always
work?" all want the same runner, so it is written once, here, in the shape those
tools expect (`el`/`items`/`finish`/`done`, options as `{t, ok}`).

WHERE THE ERRORS COME FROM, and the limit on that. Cambridge Stage 2 scripts
errors for learners to critique, mostly in Ready to Go's "Think about it" and in
the Teacher's Guide's per-unit notes - and unlike Stage 1, the Guide really does
carry a misconception feature. The traceable ones are cited by page below. But
**40 of the 81 error passages point at a PowerPoint slide that is not in the
PDF** ("Display PowerPoint 9, slide 2"), so those errors are not recoverable and
are NOT invented and attributed here. The rest are authored from the
mathematics of the lesson and carry no citation, which is the honest way round.

ONE ITEM PER LESSON IS DELIBERATELY CORRECT (owner, confirmed for Stage 2).
Cambridge mixes right and wrong on purpose: if every claim were wrong, "what
went wrong" would stop being a question and become a format. The audit enforces
exactly one per lesson.

THE CEILING IS 100 (owner). Stage 2 is "Numbers to 100", and reusing Stage 1's
20 would refuse correct content - the same trap that would have refused arrays,
which Stage 1 has none of and Stage 2 requires.

IT MOVES THE CHECK. Progress is recorded by step POSITION, so a step inserted
before the check shifts the check's own finish index by one, and a learner who
had finished the lesson sees the check reopen. That is inherent in adding a
teaching step and is the same trade Grade 1 made; the renumber is exactly one
index per lesson and the tool refuses if it cannot find precisely one.

Guarded by a marker; every anchor must match exactly once or the file is refused.
"""
import io, json, os, re, sys

sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))
WRITE = "--write" in sys.argv[1:]
for a in sys.argv[1:]:
    if a != "--write":
        sys.exit("unrecognised argument: %s" % a)

MARK = "ehel-spot-the-mistake"
RUNNER_MARK = "ehel-item-runner"
CEILING = 100
FINISH = "  function finish(i, msg)"

# lesson -> (the objective code the step is filed under, six items).
# An item is (who, what they say, the question, [(option, is-right)], why).
WORK = {
    "tens-and-ones": ("2Np.01", [
        # TG p63 - the array whose rows are not equal
        ("Ali", "My array has 4 rows of 5.",
         "Ali draws 4 rows. The first two rows have 5 counters and the last two have 4. What went wrong?",
         [("The rows are not all equal", True), ("An array must have 5 rows", False),
          ("Ali is right", False)],
         "An array has equal rows and equal columns. Two rows of 5 and two rows of 4 is not an array."),
        # TG p18 - the divide written the wrong way round
        ("Hodan", "15 shared between 5 is 5 shared between 15.",
         "Hodan shares 15 beans between 5 friends and writes it as 5 shared between 15. What went wrong?",
         [("The whole group of 15 goes first", True), ("She should share 15 between 3", False),
          ("Sharing works either way round", False)],
         "15 is the whole group being shared out, so it comes first: 15 shared between 5 is 3 each."),
        # TG p31 - losing count, and counting one thing twice
        ("Musa", "I counted the marbles and got 25.",
         "There are 24 marbles in the pile. Musa counts them and says 25. What went wrong?",
         [("He counted one marble twice", True), ("He forgot to count in twos", False),
          ("24 marbles cannot be counted", False)],
         "Move each marble as you count it. Then you cannot count the same one twice or miss one out."),
        # TG p135 - a line that looks ordered because it rises
        ("Kiki", "12, 20, 31, 28, 45 are in order.",
         "Kiki says these numbers are in order because the small ones are on the left. What went wrong?",
         [("28 comes before 31", True), ("12 should be last", False), ("They are in order", False)],
         "Going up most of the way is not the same as being in order. 28 is less than 31, so it comes first."),
        ("Amina", "47 to the nearest 10 is 40.",
         "Amina rounds 47 to the nearest 10 and says 40. What went wrong?",
         [("47 is nearer to 50", True), ("47 is nearer to 40", False), ("47 rounds to 100", False)],
         "47 is 7 away from 40 and only 3 away from 50, so it rounds to 50."),
        ("Ali", "63 is 6 tens and 3 ones.",
         "Ali says 63 is 6 tens and 3 ones. Is he right?",
         [("Yes, he is right", True), ("No, it is 3 tens and 6 ones", False),
          ("No, it is 63 tens", False)],
         "6 tens is 60 and 3 ones is 3, and that makes 63. Saying so when it is right is good checking too."),
    ]),
    "coins-and-change": ("2Nm.01", [
        # RtG p50 - eight 10s counted as eight ones
        ("Hodan", "Eight 10 sh coins and three 1 sh coins is 11 sh.",
         "Hodan counts eight 10 sh coins and three 1 sh coins and says 11 sh. What went wrong?",
         [("She counted the 10 sh coins as ones", True), ("She forgot one coin", False),
          ("Eleven is right", False)],
         "Count the tens in tens first: 10, 20, 30, 40, 50, 60, 70, 80. Then count on 3 to make 83 sh."),
        ("Musa", "50 take away 35 is 25.",
         "A pen costs 35 sh. Musa pays with 50 sh and says the change is 25 sh. What went wrong?",
         [("50 take away 35 is 15", True), ("The change is 25 sh", False),
          ("The change is 85 sh", False)],
         "Count on from 35 to 50: 5 more makes 40, then 10 more makes 50. That is 15 sh change."),
        ("Amina", "Eight 5 sh coins is the fewest pieces for 40 sh.",
         "Amina makes 40 sh with eight 5 sh coins and says that is the fewest pieces. What went wrong?",
         [("Two 20 sh coins would be fewer", True), ("Eight coins is the fewest", False),
          ("40 sh cannot be made", False)],
         "The fewest pieces means the biggest coins first. Two 20 sh coins make 40 sh with only 2 pieces."),
        ("Kiki", "Five 2 sh coins is worth more than one 20 sh coin.",
         "Kiki says her purse is worth more because it has more coins in it. What went wrong?",
         [("More coins does not mean more money", True), ("Five coins beats one coin", False),
          ("Both purses are the same", False)],
         "Five 2 sh coins is 10 sh. One 20 sh coin is 20 sh, and 20 is more than 10."),
        ("Ali", "I can pay 45 sh with two 20 sh coins.",
         "Ali has two 20 sh coins and says he can pay exactly 45 sh. What went wrong?",
         [("Two 20 sh coins make only 40 sh", True), ("Two 20 sh coins make 45 sh", False),
          ("He needs three 20 sh coins", False)],
         "20 and 20 make 40, which is 5 sh short. He needs 5 sh more to pay exactly."),
        ("Musa", "Two 20 sh coins and one 10 sh coin make 50 sh.",
         "Musa says two 20 sh coins and one 10 sh coin make 50 sh. Is he right?",
         [("Yes, he is right", True), ("No, it is 40 sh", False), ("No, it is 60 sh", False)],
         "20 and 20 make 40, and 10 more makes 50. Musa counted the big coins first, which is the quick way."),
    ]),
    "fair-shares": ("2Nf.01", [
        ("Ali", "The bar is cut into 2 parts, so each part is a half.",
         "Ali cuts a bar into one big piece and one small piece and calls each one a half. What went wrong?",
         [("Halves must be the same size", True), ("Two pieces are always halves", False),
          ("He needed 4 pieces", False)],
         "A half is one of TWO EQUAL parts. Two parts that are not equal are not halves."),
        ("Amina", "One quarter is bigger than one half.",
         "Amina says a quarter is bigger than a half because 4 is bigger than 2. What went wrong?",
         [("The more parts, the smaller each one is", True), ("4 is bigger, so a quarter is bigger", False),
          ("They are the same size", False)],
         "Cut the same cake into 4 instead of 2 and every piece gets smaller. A half is bigger than a quarter."),
        ("Hodan", "Three quarters of 8 is 3.",
         "Hodan works out three quarters of 8 and says 3. What went wrong?",
         [("She found three quarters, not three of them", True), ("Three quarters of 8 is 3", False),
          ("Three quarters of 8 is 8", False)],
         "One quarter of 8 is 2, so three quarters is 2 and 2 and 2, which is 6."),
        ("Kiki", "Two quarters and one half are different amounts.",
         "Kiki says two quarters cannot be the same as one half. What went wrong?",
         [("Two quarters make exactly one half", True), ("Quarters are always smaller", False),
          ("She is right", False)],
         "Put two quarters side by side and they cover the same amount as one half. They are equal fractions."),
        ("Musa", "I shaded 1 part of 5, so I shaded one quarter.",
         "Musa shades 1 part of a shape cut into 5 equal parts and calls it a quarter. What went wrong?",
         [("One of five parts is a fifth", True), ("One part is always a quarter", False),
          ("He shaded one half", False)],
         "The bottom number says how many equal parts there are. Five parts means each one is a fifth."),
        ("Amina", "Four quarters make one whole.",
         "Amina says four quarters make one whole. Is she right?",
         [("Yes, she is right", True), ("No, it makes two wholes", False),
          ("No, it makes one half", False)],
         "Four quarters fit back together into the one thing you started with. Amina is right."),
    ]),
    "patterns-that-grow": ("2Nc.04", [
        ("Musa", "Counting in fives: 5, 10, 15, 25, 30.",
         "Musa counts in fives and says 5, 10, 15, 25, 30. Where is his mistake?",
         [("He missed 20 out", True), ("He should not say 30", False), ("There is no mistake", False)],
         "Every jump is 5, so after 15 comes 20, then 25. He jumped by 10 in the middle."),
        ("Kiki", "1, 3, 6, 10 goes up by the same amount each time.",
         "Kiki says this pattern goes up by the same amount every time. What went wrong?",
         [("The jumps get bigger: 2, then 3, then 4", True), ("The jumps are all 2", False),
          ("She is right", False)],
         "Take each number from the next: 2, 3, 4. The jump grows, so it is a growing pattern, not a steady one."),
        ("Ali", "Counting back in tens from 84: 84, 83, 82.",
         "Ali counts back in tens from 84 and says 84, 83, 82. What went wrong?",
         [("He counted back in ones", True), ("He should start at 80", False),
          ("Counting back in tens is not allowed", False)],
         "Counting back in tens takes away ten each time: 84, 74, 64. Only the tens digit changes."),
        ("Amina", "Red, blue, yellow, red, blue, yellow is not a pattern.",
         "Amina says it is not a pattern because it does not go red, blue, red, blue. What went wrong?",
         [("The part that repeats can be 3 long", True), ("A pattern must use two colours", False),
          ("The beads are in the wrong order", False)],
         "The repeating part here is red, blue, yellow, and it comes round again. A repeating part can be any length."),
        ("Hodan", "On a hundred square, going down one square adds 1.",
         "Hodan says moving down one square on a hundred square adds 1. What went wrong?",
         [("Going down adds 10", True), ("Going down adds 1", False), ("Going down takes away 10", False)],
         "Each row holds ten numbers, so the square below is ten further on. 23 is above 33."),
        ("Musa", "In 2, 4, 6, 8 the next number is 10.",
         "Musa says the next number is 10. Is he right?",
         [("Yes, he is right", True), ("No, it is 9", False), ("No, it is 12", False)],
         "Every jump is 2, and 8 and 2 more is 10. Musa checked the jump before answering."),
    ]),
    "sides-and-corners": ("2Gg.01", [
        ("Kiki", "Any shape with four sides is a square.",
         "Kiki points at a long thin rectangle and calls it a square. What went wrong?",
         [("A square needs all four sides equal", True), ("Four sides always means a square", False),
          ("A rectangle has five sides", False)],
         "A square and a rectangle both have 4 sides and 4 corners. Only a square has all four sides the same."),
        ("Ali", "This triangle is not a triangle because it is upside down.",
         "Ali says a triangle pointing downwards is not a triangle. What went wrong?",
         [("Turning a shape does not change it", True), ("Triangles must point up", False),
          ("It has four sides now", False)],
         "It still has 3 straight sides and 3 corners, whichever way round it sits."),
        ("Amina", "A cube has 4 faces.",
         "Amina counts the faces of a cube and says 4. What went wrong?",
         [("She forgot the top and the bottom", True), ("A cube has 8 faces", False),
          ("A cube really has 4 faces", False)],
         "A cube has 6 flat faces: four around the sides, one on top and one underneath."),
        ("Hodan", "This shape folds in half here, so the fold is a line of symmetry.",
         "Hodan folds a shape so one half hangs over the edge of the other. What went wrong?",
         [("The two halves must match exactly", True), ("Any fold is a line of symmetry", False),
          ("She should fold it twice", False)],
         "A line of symmetry only works if the two halves land exactly on top of each other."),
        ("Musa", "A whole turn brings me to face the other way.",
         "Musa faces the door, turns all the way round once, and says he now faces the window. What went wrong?",
         [("A whole turn brings him back to the door", True), ("A whole turn is a half turn", False),
          ("He is right", False)],
         "A whole turn goes all the way round and finishes where it started. A HALF turn faces you the other way."),
        ("Kiki", "A square still looks the same after a quarter turn.",
         "Kiki says a square looks the same after a quarter turn. Is she right?",
         [("Yes, she is right", True), ("No, it becomes a diamond", False),
          ("No, it becomes a rectangle", False)],
         "A square has four equal sides and four square corners, so a quarter turn leaves it looking the same."),
    ]),
    "which-way-from-here": ("2Gp.01", [
        ("Ali", "Left is always the same side for everyone.",
         "Ali stands facing Hodan and says her left is the same as his left. What went wrong?",
         [("She is facing him, so her left is opposite", True), ("Left is the same for everyone", False),
          ("Left depends on the room", False)],
         "Turn to face the same way she is facing and your lefts match. Facing each other, they are opposite."),
        ("Amina", "Forward, forward, right gets me to the flag.",
         "The flag is two squares forward and one to the LEFT. Amina says forward, forward, right. What went wrong?",
         [("The last turn should be left", True), ("She needs three forwards", False),
          ("She is right", False)],
         "Check the route square by square. The flag is on the left, so the turn at the end is a left turn."),
        ("Musa", "A quarter turn and a half turn are the same.",
         "Musa says a quarter turn takes him the same way round as a half turn. What went wrong?",
         [("A half turn is two quarter turns", True), ("They are the same turn", False),
          ("A quarter turn is bigger", False)],
         "A quarter turn is one corner of the way round. Two of them make a half turn."),
        ("Kiki", "The mirror picture is just the same picture again.",
         "Kiki draws the same shape on both sides of the mirror line, facing the same way. What went wrong?",
         [("A mirror picture is flipped over", True), ("A mirror picture is the same", False),
          ("She should draw it upside down", False)],
         "In a mirror, the side nearest the line stays nearest the line. The picture turns over, it does not slide across."),
        ("Hodan", "Between means next to.",
         "Hodan says the ball is between the box and the chair when it is beside both of them. What went wrong?",
         [("Between means one on each side", True), ("Between and next to are the same", False),
          ("Between means on top", False)],
         "Between means the ball has the box on one side of it and the chair on the other."),
        ("Ali", "Turning right twice is the same as turning all the way round halfway.",
         "Ali says two right turns leave him facing the way he came. Is he right?",
         [("Yes, two quarter turns make a half turn", True), ("No, he faces the same way", False),
          ("No, he needs four turns", False)],
         "Two quarter turns make a half turn, and a half turn faces you back the way you came."),
    ]),
    "how-much-how-long": ("2Gg.03", [
        ("Musa", "The book is longer because it needed more cubes than the pencil needed paperclips.",
         "Musa measures the book in cubes and the pencil in paperclips, then compares the numbers. What went wrong?",
         [("He measured them with different units", True), ("8 is more than 5, so he is right", False),
          ("He should count the cubes twice", False)],
         "To compare two lengths you must measure both with the SAME thing. Eight of one and five of another tell you nothing."),
        ("Amina", "The pencil is 7 cm long.",
         "Amina lines the pencil up with the 1 on the ruler, reads 8 at the end, and says 7 cm. "
         "Her teacher says to start at 0. What went wrong?",
         [("Measuring should start at 0", True), ("She should read the 1", False),
          ("Rulers start at 1", False)],
         "Line the end up with 0, not with 1. Then the number at the far end is the length."),
        ("Kiki", "The tall thin jug must hold more than the short wide one.",
         "Without pouring anything, Kiki says the tall jug holds more. What went wrong?",
         [("Tall does not always mean it holds more", True), ("The tall jug always holds more", False),
          ("There is no way to find out", False)],
         "A short wide jug can hold more than a tall thin one. Pour each into the same cups and count to find out."),
        ("Ali", "I would weigh a bag of rice in centimetres.",
         "Ali says he would measure how heavy a bag of rice is in centimetres. What went wrong?",
         [("Centimetres measure length, not mass", True), ("Centimetres measure anything", False),
          ("He should use litres", False)],
         "Length is measured in centimetres and metres. How heavy something is is measured in grams and kilograms."),
        ("Hodan", "The pointer is between 20 and 30, so it says 20.",
         "Hodan reads a kitchen scale whose pointer sits halfway between 20 and 30 and says 20. What went wrong?",
         [("Halfway between 20 and 30 is 25", True), ("It says 20", False), ("It says 30", False)],
         "Look at the small marks between the numbers. Halfway from 20 to 30 is 25."),
        ("Amina", "A metre is longer than a centimetre.",
         "Amina says a metre is longer than a centimetre. Is she right?",
         [("Yes, she is right", True), ("No, a centimetre is longer", False),
          ("No, they are the same", False)],
         "It takes 100 centimetres to make 1 metre, so a metre is much longer."),
    ]),
    "half-past-quarter-to": ("2Gt.02", [
        ("Musa", "The short hand is between 3 and 4, so it is half past 4.",
         "The long hand points down at 6 and the short hand is between 3 and 4. Musa says half past 4. What went wrong?",
         [("It is half past 3, the hour it has passed", True), ("It is half past 6", False),
          ("It is 4 o'clock", False)],
         "At half past, the short hand sits between two numbers. You say the hour it has already gone past."),
        ("Kiki", "Quarter to 5 means the long hand is on the 3.",
         "Kiki says quarter to 5 is shown with the long hand on the 3. What went wrong?",
         [("Quarter TO is the 9, quarter PAST is the 3", True), ("Quarter to is always the 3", False),
          ("Quarter to is the 12", False)],
         "Quarter past is a quarter of the way round, at the 3. Quarter to is three quarters round, at the 9."),
        ("Ali", "The long hand is on the 4, so it is 4 minutes past.",
         "Ali reads the long hand on the 4 and says 4 minutes past. What went wrong?",
         [("Each number is 5 minutes, so it is 20 past", True), ("It is 4 minutes past", False),
          ("It is 40 minutes past", False)],
         "Count round in fives: 5, 10, 15, 20. The long hand on the 4 means 20 minutes past."),
        ("Amina", "There are 100 seconds in a minute.",
         "Amina says a minute is 100 seconds because everything goes up in hundreds. What went wrong?",
         [("A minute is 60 seconds", True), ("A minute is 100 seconds", False),
          ("A minute is 10 seconds", False)],
         "There are 60 seconds in a minute and 60 minutes in an hour."),
        ("Hodan", "The day after the last day of the month is the 32nd.",
         "Hodan says the day after the last day of a month is the 32nd. What went wrong?",
         [("A new month starts at the 1st again", True), ("Months have 32 days", False),
          ("She is right", False)],
         "Months have 28, 30 or 31 days. When one ends, the next starts again at the 1st."),
        ("Musa", "Half past 2 comes before 3 o'clock.",
         "Musa says half past 2 comes before 3 o'clock. Is he right?",
         [("Yes, he is right", True), ("No, it comes after", False),
          ("No, they are the same time", False)],
         "Half past 2 is halfway from 2 o'clock to 3 o'clock, so it comes first."),
    ]),
    "count-it-chart-it": ("2Ss.01", [
        # RtG p25 - blocks that do not line up, read as a total
        ("Viti", "My block graph shows 3 peach juices.",
         "Viti draws three blocks for peach juice but leaves gaps between them. What went wrong?",
         [("The blocks must be stacked with no gaps", True), ("Three blocks is wrong", False),
          ("She should use four blocks", False)],
         "Blocks only show how many if they are stacked touching. Gaps make a short bar look tall."),
        ("Amina", "The shortest bar is the most popular.",
         "Amina looks at a block graph and says the shortest bar is the one most children chose. What went wrong?",
         [("The most popular is the TALLEST bar", True), ("The shortest bar is the most popular", False),
          ("A graph cannot show this", False)],
         "Each block is one child, so the tallest stack is the most children. The shortest bar is the least popular."),
        ("Hodan", "Five in a tally is five lines side by side.",
         "Hodan writes five in a tally chart as five straight lines side by side. What went wrong?",
         [("The fifth mark goes across the other four", True), ("She should write four marks", False),
          ("Tally marks should be circles", False)],
         "The fifth mark goes across the first four to make a gate of five. Then you can count the gates in fives."),
        ("Ali", "One picture is one child, so 4 pictures is 4 children - even when the key says 2.",
         "The key says one picture stands for 2 children. Ali counts 4 pictures and says 4 children. What went wrong?",
         [("He ignored the key: 4 pictures is 8 children", True), ("Four pictures is four children", False),
          ("The key does not matter", False)],
         "Always read the key first. If one picture is 2 children, then 4 pictures is 2, 4, 6, 8 children."),
        ("Kiki", "A coin landed on heads three times, so the next one must be tails.",
         "Kiki says the next toss has to be tails because heads came up three times. What went wrong?",
         [("The coin does not remember the last toss", True), ("Tails is now certain", False),
          ("She is right", False)],
         "Each toss is on its own. Heads and tails are still equally likely, whatever happened before."),
        ("Amina", "A table and a block graph of the same answers show the same numbers.",
         "Amina says drawing the answers a different way does not change them. Is she right?",
         [("Yes, she is right", True), ("No, a graph shows more", False),
          ("No, a table shows more", False)],
         "A list, a table, a block graph and a pictogram can all show the very same answers."),
    ]),
}

cfg = json.load(io.open(os.path.join(HERE, "app.config.json"), encoding="utf-8"))
ORDER = [l["file"][:-5] for l in cfg["lessons"]]

# ---- the audit, before a byte is written -------------------------------------
assert sorted(WORK) == sorted(ORDER), "every lesson needs a bank"
for key, (code, items) in WORK.items():
    assert re.fullmatch(r"2[A-Z][a-z]\.\d\d", code), "%s: %r is not a Stage 2 code" % (key, code)
    assert len(items) == 6, "%s: six items per lesson" % key
    right_claims = 0
    for who, what, ask, opts, why in items:
        assert len(opts) == 3, "%s: three options" % key
        assert sum(1 for _t, ok in opts if ok) == 1, "%s: exactly one right option" % key
        assert len(set(t for t, _ in opts)) == 3, "%s: repeated option" % key
        if ask.rstrip().endswith(("Is he right?", "Is she right?")):
            right_claims += 1
            assert opts[0][1] and opts[0][0].startswith("Yes"), \
                "%s: a claim that IS right must key the Yes" % key
        for t in (who, what, ask, why) + tuple(t for t, _ in opts):
            assert '"' not in t and "\\" not in t and "<" not in t, "%s: unsafe text %r" % (key, t)
            for n in re.findall(r"(?<![\w.])(\d+)(?!\d|\.\d)", t):
                assert int(n) <= CEILING, "%s: %s is past Stage 2's ceiling of %d" % (key, n, CEILING)
    # Cambridge mixes right and wrong on purpose - see the docstring
    assert right_claims == 1, "%s: exactly one item must be a claim that IS right (%d)" % (key, right_claims)

RUNNER = """
  /* ==== """ + RUNNER_MARK + """: one question after another - see add-spot-the-mistake.py ====
     This build had no generic item runner: a warm-up, its own hand-written
     steps, a gated check and How do you know?, and nothing that drives a BANK.
     Written once here, in the shape Grade 1's secondStep() has, so the tools
     that follow - story problems, Support and Extension, Will it always work? -
     can use it unchanged. The child moves on with a button rather than a timer,
     because say() stops whatever is playing and a timer would cut the
     explanation off, and every one of these explains its answer. */
  function secondStep(o) {
    const el = o.el, items = o.items;
    const words = (h) => String(h).replace(/<[^>]*>/g, " ").replace(/\\s+/g, " ").trim();
    let i = 0, right = 0, lock = true;
    function draw() {
      const it = items[i];
      lock = true;
      el.next.hidden = true;
      el.say.innerHTML = it.ask;
      el.stage.innerHTML = it.pic || "";
      el.fb.className = "fb"; el.fb.textContent = "";
      el.score.textContent = (o.label || "Question") + " " + (i + 1) + " of " + items.length;
      el.ch.innerHTML = shuffle(it.opts.slice()).map((c) => '<button type="button" class="choice'
        + (/^\\s*\\d+\\s*$/.test(c.t) ? "" : " ss-w") + '" data-ok="' + (c.ok ? 1 : 0) + '">'
        + c.t + "</button>").join("");
      lock = false;
      say(words(it.ask));
    }
    el.ch.addEventListener("click", (e) => {
      const b = e.target.closest(".choice"); if (!b || lock) return;
      lock = true;
      const it = items[i], ok = b.dataset.ok === "1";
      el.ch.querySelectorAll(".choice").forEach((c) => {
        c.disabled = true; if (c.dataset.ok === "1") c.classList.add("right");
      });
      if (ok) right++; else b.classList.add("wrong");
      const last = i === items.length - 1;
      const msg = (ok ? cheer() + " " : "Not quite. ") + it.why;
      el.fb.className = "fb" + (ok ? " good" : ""); el.fb.textContent = msg; say(msg);
      if (last) { finish(o.finish, o.done); } else { el.next.hidden = false; }
      i += 1;
    });
    el.next.addEventListener("click", () => { if (i < items.length) draw(); });
    draw();
  }
  /* """ + MARK + """: the claim being judged, in the mouth of the child who made it */
  const smSays = (who, what) => '<div class="sm-bubble"><p class="sm-what">' + what +
    '</p><p class="sm-who">' + who + '</p></div>';
"""

STYLE = """
<style>/* """ + MARK + """ - see add-spot-the-mistake.py */
  .sm-bubble { max-width: min(92%, 460px); margin: 0 auto; background: var(--cell);
    border: 3px solid var(--gold, #E8B44A); border-radius: 18px; padding: 14px 18px 10px; }
  .sm-what { margin: 0; font-size: 21px; line-height: 1.45; color: var(--ink); }
  .sm-who { margin: 6px 0 0; font-family: "Inter", "Segoe UI", sans-serif; font-weight: 800;
    font-size: 16px; color: var(--muted); text-align: right; }
  .choice.ss-w { font-size: 18px; }
</style>
"""


def lit(t):
    return '"%s"' % t


done_n = skipped = refused = 0
for l in cfg["lessons"]:
    name, key = l["file"], l["file"][:-5]
    p = os.path.join(HERE, name)
    s = io.open(p, encoding="utf-8", newline="").read()
    if MARK in s:
        print("  already  %s" % name)
        skipped += 1
        continue
    code, items = WORK[key]

    bad = []
    if s.count(FINISH) != 1:
        bad.append("no single finish() to sit above")
    # the check slide is the one numbered with a tick
    st = [m.start() for m in re.finditer(r'<section class="slide"', s)]
    chk = [i for i, a in enumerate(st)
           if '<span class="n">✓</span>' in s[a:(st[i + 1] if i + 1 < len(st) else len(s))]]
    if len(chk) != 1:
        bad.append("found %d check slides, expected 1" % len(chk))
    nums = re.findall(r'<div class="slide-head"><span class="n">(\d+)</span>', s)
    if not nums:
        bad.append("no numbered steps")
    if bad:
        print("  REFUSED  %-26s %s" % (name, "; ".join(bad)))
        refused += 1
        continue

    at = st[chk[0]]
    n = max(int(x) for x in nums) + 1          # the new step's number on screen
    # THE CHECK'S OWN finish INDEX, found through its CHECK array and not by
    # position. Every slide comes before every line of script in these pages, so
    # "the first finish( after the check SLIDE" is step 1's - which is what the
    # first version of this did, and it reported finish(0)->finish(1) for all
    # nine lessons where the real index is 5, 9 or 15.
    fm = re.search(r"const CHECK\s*=\s*\[[\s\S]*?finish\((\d+)", s)
    if not fm:
        print("  REFUSED  %-26s no CHECK array with a finish() in it" % name)
        refused += 1
        continue
    fi = int(fm.group(1))

    sid = "sm%d" % n
    slide = (
        '<!-- %d  %s  Spot the mistake -->\n    '
        '<section class="slide" data-twm="critiquing improving" '
        'data-say="Read what each child says. Work it out yourself. Then tap what went wrong.">\n'
        '      <div class="slide-head"><span class="n">%d</span><h2>Spot the mistake</h2></div>\n'
        '      <div class="say"><button type="button" class="speak" aria-label="Read it to me">'
        '&#128266;</button><span id="%ssay">Read what each child says, work it out yourself, '
        'then tap what went wrong.</span></div>\n'
        '      <div class="stage" id="%sst"></div>\n'
        '      <div class="choices" id="%sch"></div>\n'
        '      <p class="fb" id="%sfb" role="status" aria-live="polite"></p>\n'
        '      <div class="bigbtns"><button type="button" class="big small teal" id="%snx" hidden>'
        'Next question</button></div>\n'
        '      <p class="score" id="%ssc"></p>\n'
        '    </section>\n    ' % (n, code, n, sid, sid, sid, sid, sid, sid))

    rows = []
    for who, what, ask, opts, why in items:
        rows.append(
            '      { ask: %s,\n        pic: smSays(%s, %s),\n        opts: [%s],\n        why: %s },'
            % (lit(ask), lit(who), lit(what),
               ", ".join("{ t: %s, ok: %s }" % (lit(t), "true" if ok else "false") for t, ok in opts),
               lit(why)))
    call = ("""
  /* ---- %d: spot the mistake - critiquing and improving, from the Cambridge Stage 2 books ---- */
  secondStep({
    el: { say: $("%ssay"), stage: $("%sst"), ch: $("%sch"), fb: $("%sfb"), score: $("%ssc"), next: $("%snx") },
    label: "Mistake",
    items: [
%s
    ],
    finish: %d,
    done: "You can find the mistake and say what went wrong.",
  });
""" % (n, sid, sid, sid, sid, sid, sid, "\n".join(rows), fi))

    # 1. the slide, immediately before the check
    s = s[:at] + slide + s[at:]
    # 2. the check's finish index moves on by one. Anchored on the CHECK ARRAY
    #    for the same reason as above, and required to be there exactly once
    #    from that point on - the index is the highest in the lesson, so nothing
    #    later uses it, and if anything does this refuses rather than guesses.
    ck = s.index("const CHECK")
    head, tailtxt = s[:ck], s[ck:]
    if tailtxt.count("finish(%d" % fi) != 1:
        print("  REFUSED  %-26s finish(%d) appears %d times from the CHECK array on, not once"
              % (name, fi, tailtxt.count("finish(%d" % fi)))
        refused += 1
        continue
    s = head + tailtxt.replace("finish(%d" % fi, "finish(%d" % (fi + 1), 1)
    # 3. the runner and the bank, in the lesson's own script scope
    ins = s.index(FINISH)
    s = s[:ins] + RUNNER.lstrip("\n") + call.lstrip("\n") + s[ins:]
    s = s.rstrip() + "\n" + STYLE

    region = s[s.rindex("<script", 0, s.index("function secondStep")):s.index("</script>", s.index("function secondStep"))]
    for nm in ("shuffle", "cheer", "say"):
        if not re.search(r"(?:function|const|let|var)\s+%s\b" % nm, region):
            print("  REFUSED  %-26s the runner landed in a script with no %s()" % (name, nm))
            refused += 1
            break
    else:
        assert s.count(MARK) >= 2 and s.count('id="%ssay"' % sid) == 1
        if WRITE:
            io.open(p, "w", encoding="utf-8", newline="").write(s)
        print("  %s %-26s step %-2d  6 items, check moves finish(%d)->finish(%d)"
              % ("wrote  " if WRITE else "would  ", name, n, fi, fi + 1))
        done_n += 1

print("\n  %d item(s) across %d lesson(s) %s, %d skipped, %d refused%s"
      % (sum(len(i) for _c, i in WORK.values()), done_n, "written" if WRITE else "to write",
         skipped, refused, "" if WRITE else "   (--write to apply)"))
sys.exit(1 if refused else 0)
