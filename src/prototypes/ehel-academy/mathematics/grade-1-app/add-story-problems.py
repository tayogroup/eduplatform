# -*- coding: utf-8 -*-
"""A "Story problems" step in every lesson: the maths in a situation.

    python add-story-problems.py            # report
    python add-story-problems.py --write

WHY. The 2026-09-16 comparison against the Cambridge Stage 1 books found the
build teaching every objective and practising it, but almost always as a bare
question - "What is 7 add 5?", "Tap the fair cut". Cambridge runs one-step word
problems through Number from its Unit 2 onwards, and the whole build held about
nineteen sentences with a named child in them, most of them in one lesson.

THE PITCH IS COPIED FROM THE SOURCE, not guessed. Measured across 26 problems
transcribed from the Learner's Book and Workbook:

  - sentences of 4 to 9 words, two or three of them per problem;
  - the shape [who] [has] [number] [object]. [what happens]. [question]?
  - the question is ALWAYS its own sentence;
  - concrete picturable nouns only - crayons, shells, pebbles, buttons;
  - one step, never two. There is no genuine two-step problem in Stage 1;
  - answers from 0 to 20, and a subtraction never goes below zero;
  - THE OBJECT NOUN IS REPEATED IN THE QUESTION. Cambridge writes "How many
    crayons does David have left?", never "How many are left?" - it keeps the
    referent in front of a five-year-old who has just read three sentences.

The names are this build's own - Amina, Musa, Hodan, Ali, Kiki - not the
Cambridge cast, and the objects are the ones its at-home cards already use
(beans, bottle tops, mangoes, goats). Adults are named by relationship, which is
Cambridge's habit too: Gran, an aunt, a brother.

WHAT IS DELIBERATELY NOT HERE. Cambridge's open problems - "David has 16
marbles, more than 10 are in a bag, how many can be in the bag and his pocket?"
- have many correct answers, and every runner in this build judges exactly one
option right. Authoring one as multiple choice would turn an open task into a
closed one and teach the opposite lesson. Left out rather than flattened, and
worth building properly one day.

WHERE IT GOES, AND WHAT IT COSTS: after the lesson's own steps and before the
check, the owner's standing choice (2026-09-11). Progress records steps by
POSITION, so a child who has finished a lesson finds the check undone and this
step ticked in its place. Unchanged by this tool, and the same cost the step
before it carried.

THE RUNNER is secondStep(), in all seven lessons since add-spot-the-mistake.py.
This tool installs nothing and REFUSES a lesson that does not already have it,
rather than quietly adding a second copy.

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

MARK = "ehel-story-problems"
CHECK_BADGE = '<span class="n">✓</span>'
FINISH = "  function finish(i, msg) {"
STICK_TAIL = '["✅", "Show what I know"]'


def ssml(calm, friendly, empathetic, cheerful):
    s = lambda xs: "".join("<s>%s</s>" % x for x in xs)
    return ('<mstts:express-as style="calm" styledegree="1.15"><prosody rate="-8%%">%s</prosody></mstts:express-as>'
            '<break time="330ms"/><mstts:express-as style="friendly" styledegree="1.25">%s</mstts:express-as>'
            '<break time="330ms"/><mstts:express-as style="empathetic" styledegree="1.3"><prosody rate="-6%%">%s</prosody></mstts:express-as>'
            '<break time="330ms"/><mstts:express-as style="cheerful" styledegree="1.45">%s</mstts:express-as>'
            % (s(calm), s(friendly), s(empathetic), s(cheerful)))


EXPLAIN = ssml(
    ["A story problem is maths hiding inside a story."],
    ["Listen to the whole story first, right to the end.",
     "Then ask yourself one question.", "Am I putting things together, or taking them away?",
     "Putting together means adding.", "Taking away, or finding how many more, means subtracting."],
    ["Children often grab the two numbers and add them, whatever the story said.",
     "That is why the story comes first and the numbers come second.",
     "Say the story back to yourself in your own words before you choose."],
    ["So listen to the story, decide what is happening, then tap your answer."])

SAY = "Listen to the whole story. Work out the answer. Then tap it."
PROMPT = "Read the story, work out the answer, then tap it."
DONE = "You can find the maths inside a story."
TITLE = "Story problems"
STICKER = ("🎯", "Story problems")

# ===========================================================================
# THE PROBLEMS. Six per lesson, on that lesson's own objectives.
# ===========================================================================
COUNTING = [
    dict(ask="There are 8 goats in the pen. 1 more goat walks in. How many goats are in the pen now?",
         opts=[("9", True), ("8", False), ("10", False)],
         why="One more than 8 is 9. Counting on 1 means the very next number."),
    dict(ask="Five children stand in a line. Hodan is third in the line. How many children are in front of Hodan?",
         opts=[("2", True), ("3", False), ("4", False)],
         why="Third means two children came first, so 2 children are in front of Hodan."),
    dict(ask="Ali has one bag of ten beans and 6 loose beans. How many beans does Ali have?",
         # 7 is the bag counted as one thing; 10 is the loose beans forgotten.
         # The digit-reversal error, 60, would be the truest distractor of all and
         # is not offered: Stage 1 does not go past 20 and a wrong option is still
         # a number a child reads.
         opts=[("16", True), ("7", False), ("10", False)],
         why="One ten and 6 ones is 16. The ten stays whole and the 6 are counted on."),
    dict(ask="Amina has 12 shells. Kiki has 15 shells. Who has more shells?",
         opts=[("Kiki", True), ("Amina", False), ("They have the same", False)],
         why="15 comes after 12 when you count, so 15 is more. Kiki has more shells."),
    dict(ask="There are 2 baskets. Each basket holds 10 oranges. How many oranges are there altogether?",
         opts=[("20", True), ("12", False), ("2", False)],
         why="Counting in tens: 10, then 20. Two tens make 20 oranges."),
    dict(ask="Musa had 4 sweets. He eats all 4 sweets. How many sweets does Musa have left?",
         opts=[("0", True), ("4", False), ("1", False)],
         why="None at all is zero. We write it 0."),
]

ADDING = [
    dict(ask="Gran buys 4 mangoes and 11 oranges. How many fruits does Gran buy in total?",
         opts=[("15", True), ("14", False), ("7", False)],
         why="Putting the two groups together: 11 and 4 more is 15 fruits."),
    dict(ask="Ali has 8 crayons. He gives 3 crayons to his brother. How many crayons does Ali have left?",
         opts=[("5", True), ("11", False), ("6", False)],
         why="Giving away means taking away. Count back 3 from 8: 7, 6, 5."),
    # the numbers are chosen so the ADD-INSTEAD-OF-SUBTRACT distractor is itself
    # inside Stage 1: 7 and 11 give 18, where 11 and 15 would have given 26 and
    # put a number this stage does not use in front of a child
    dict(ask="Hodan has 7 pebbles. Kiki has 11 pebbles. How many more pebbles does Kiki have than Hodan?",
         opts=[("4", True), ("18", False), ("5", False)],
         why="How many more means the difference. Count up from 7 to 11: 8, 9, 10, 11. That is 4."),
    dict(ask="Amina has 1 more apple than Musa. Musa has 6 apples. How many apples does Amina have?",
         opts=[("7", True), ("5", False), ("6", False)],
         why="One more than 6 is 7. Amina has the bigger amount because she has one MORE."),
    dict(ask="Musa holds 7 beans in each hand. How many beans does Musa have altogether?",
         opts=[("14", True), ("7", False), ("13", False)],
         why="The same number twice is a double. Double 7 is 14."),
    dict(ask="Kiki needs 10 bottle tops. She has 6 bottle tops. How many more bottle tops does Kiki need?",
         opts=[("4", True), ("16", False), ("6", False)],
         why="6 and 4 make 10, so Kiki needs 4 more. Those are the pairs that make 10."),
]

HALVES = [
    dict(ask="Amina shares 12 beans fairly with her sister. How many beans does each girl get?",
         opts=[("6", True), ("12", False), ("2", False)],
         why="Fairly means two equal parts. 6 and 6 make 12, so each girl gets 6 beans."),
    dict(ask="There are 8 mangoes on a plate. Half of the mangoes are ripe. How many mangoes are ripe?",
         opts=[("4", True), ("8", False), ("2", False)],
         why="Half of 8 is 4, because 4 and 4 make 8."),
    dict(ask="Ali cuts one orange into two equal parts. He eats one part. How much of the orange does Ali eat?",
         opts=[("one half", True), ("the whole orange", False), ("two halves", False)],
         why="One of two equal parts is one half."),
    dict(ask="Hodan has 2 halves of a chapati. How many whole chapatis can Hodan make?",
         opts=[("1", True), ("2", False), ("4", False)],
         why="Two halves fit together to make one whole chapati."),
    dict(ask="Musa shares 10 sweets fairly with Kiki. How many sweets does Musa get?",
         opts=[("5", True), ("10", False), ("2", False)],
         why="Half of 10 is 5, because 5 and 5 make 10."),
    dict(ask="There are 6 halves of orange on a plate. How many whole oranges do they make?",
         opts=[("3", True), ("6", False), ("12", False)],
         why="Every whole orange takes 2 halves. 2 and 2 and 2 make 6, so that is 3 whole oranges."),
]

PATTERNS = [
    dict(ask="Amina threads beads: red, blue, red, blue, red. What colour comes next?",
         opts=[("blue", True), ("red", False), ("yellow", False)],
         why="The part that repeats is red, blue. After red comes blue."),
    dict(ask="Musa jumps along the number track in twos: 2, 4, 6, 8. What number does Musa jump to next?",
         opts=[("10", True), ("9", False), ("12", False)],
         why="Every jump is 2 more. 8 and 2 more is 10."),
    dict(ask="Kiki has 3 stones. She needs 7 stones for her game. How many more stones does Kiki need?",
         opts=[("4", True), ("10", False), ("3", False)],
         why="3 and 4 make 7, so Kiki needs 4 more stones."),
    dict(ask="Hodan builds growing steps. The first step has 1 block, the second has 2, the third has 3. How many blocks are in the fourth step?",
         opts=[("4", True), ("6", False), ("3", False)],
         why="Each step grows by one block, so after 3 comes 4."),
    dict(ask="Ali counts back from 10 in ones. He says 10, 9, 8. What number comes next?",
         opts=[("7", True), ("9", False), ("11", False)],
         why="Counting back in ones takes away 1 each time. One less than 8 is 7."),
    dict(ask="A number machine adds 3 to every number. Musa puts in 5. What number comes out?",
         opts=[("8", True), ("3", False), ("2", False)],
         why="The machine adds 3 every time. 5 and 3 more is 8."),
]

SHAPES = [
    dict(ask="Amina finds a tin of milk in the kitchen. Which solid shape is the tin like?",
         opts=[("a cylinder", True), ("a cube", False), ("a sphere", False)],
         why="A tin has two flat circle faces and a curved surface, so it is a cylinder."),
    dict(ask="Musa measures his desk with cubes and it takes 9 cubes. Ali measures his desk with the same cubes and it takes 12. Whose desk is longer?",
         opts=[("Ali's desk", True), ("Musa's desk", False), ("They are the same", False)],
         why="They used the SAME cubes, so the counts can be compared. 12 cubes is longer than 9."),
    dict(ask="Hodan fills a jug using 3 small cups. Kiki fills a pot using 5 of the same cups. Which holds more, the jug or the pot?",
         opts=[("the pot", True), ("the jug", False), ("they hold the same", False)],
         why="The same cup was used for both, so 5 cups is more than 3 cups. The pot holds more."),
    dict(ask="Ali puts a mango on the table. A cat sits below the table. Where is the cat?",
         opts=[("under the table", True), ("on the table", False), ("behind the mango", False)],
         why="Below the table means under it."),
    dict(ask="Kiki wants to know how heavy a bag of beans is. Which tool should Kiki use?",
         opts=[("scales", True), ("a ruler", False), ("a jug", False)],
         why="Scales measure how heavy something is. A ruler measures length and a jug measures how much it holds."),
    dict(ask="Amina draws a flat shape with 3 straight sides and 3 corners. What shape does Amina draw?",
         opts=[("a triangle", True), ("a square", False), ("a circle", False)],
         why="Three straight sides and three corners make a triangle."),
]

DAYS = [
    dict(ask="Today is Monday. Amina visits her aunt tomorrow. Which day does Amina visit her aunt?",
         opts=[("Tuesday", True), ("Sunday", False), ("Wednesday", False)],
         why="Tomorrow is the day after today. The day after Monday is Tuesday."),
    dict(ask="School starts at 8 o'clock. Where does the short hand point at 8 o'clock?",
         opts=[("at the 8", True), ("at the 12", False), ("at the 6", False)],
         why="The short hand tells the hour, so at 8 o'clock it points at the 8. The long hand points at the 12."),
    dict(ask="Musa brushes his teeth. Does that take about a minute or about a day?",
         opts=[("about a minute", True), ("about a day", False), ("about a year", False)],
         why="A minute is short, and brushing your teeth is a quick job."),
    dict(ask="Hodan was born in the first month of the year. Which month was Hodan born in?",
         opts=[("January", True), ("December", False), ("June", False)],
         why="The year starts with January and ends with December."),
    dict(ask="The long hand points straight down at the 6. The short hand is between the 2 and the 3. What time is it?",
         opts=[("half past 2", True), ("half past 3", False), ("half past 6", False)],
         why="The long hand down at 6 means half past. The short hand has passed the 2, so it is half past 2."),
    dict(ask="Kiki goes to sleep on Saturday night. Which day does Kiki wake up on?",
         opts=[("Sunday", True), ("Friday", False), ("Monday", False)],
         why="Sunday comes after Saturday."),
]

DATA = [
    dict(ask="Amina asks 5 friends their favourite fruit. 3 friends say mango and 2 say banana. Which fruit is the most popular?",
         opts=[("mango", True), ("banana", False), ("they are the same", False)],
         why="Most popular means the most friends chose it. 3 is more than 2, so mango is most popular."),
    dict(ask="A block graph shows 6 goats and 4 sheep. How many more goats than sheep are there?",
         opts=[("2", True), ("10", False), ("6", False)],
         why="How many more means the difference. Count up from 4 to 6: 5, 6. That is 2."),
    dict(ask="Musa makes a tally. He draws one gate of five and 2 more marks. How many is that?",
         opts=[("7", True), ("5", False), ("2", False)],
         why="A gate of five is 5, and 2 more makes 7."),
    dict(ask="Kiki sorts shapes into two hoops, red shapes and round shapes. Her shape is red AND round. Where does the shape go?",
         opts=[("where the hoops overlap", True), ("in the red hoop only", False), ("outside both hoops", False)],
         why="A shape that belongs to both groups goes in the middle, where the two hoops cross."),
    dict(ask="Hodan counts 4 red cars and 5 blue cars. How many cars does Hodan count altogether?",
         opts=[("9", True), ("1", False), ("8", False)],
         why="Altogether means put the groups together. 4 and 5 make 9 cars."),
    dict(ask="A pictogram shows 3 faces for mango and 1 face for orange. Each face is one child. How many children chose mango?",
         opts=[("3", True), ("1", False), ("4", False)],
         why="Each face stands for one child, so 3 faces means 3 children chose mango."),
]

PLAN = {
    "counting-to-twenty.html": dict(items=COUNTING, code="1Nc.01"),
    "adding-and-taking-away.html": dict(items=ADDING, code="1Ni.05"),
    "halves-and-wholes.html": dict(items=HALVES, code="1Nf.02"),
    "what-comes-next.html": dict(items=PATTERNS, code="1Nc.06"),
    "shapes-and-sizes.html": dict(items=SHAPES, code="1Gg.02"),
    "days-months-and-clocks.html": dict(items=DAYS, code="1Gt.02"),
    "asking-and-sorting.html": dict(items=DATA, code="1Ss.03"),
}

# Cambridge's own measurements, asserted rather than trusted to the eye.
MAX_SENTENCE_WORDS = 20      # its own range is 4-9; a question naming a tool runs longer
MAX_NUMBER = 20              # Stage 1 answers are 0 to 20


def audit(name, items):
    for it in items:
        for k in ("ask", "why"):
            assert '"' not in it[k], "%s: a double quote in %s" % (name, k)
            assert "\\" not in it[k], "%s: a backslash in %s" % (name, k)
            assert "<" not in it[k] and ">" not in it[k], "%s: markup in %s" % (name, k)
        oks = [o for t, o in it["opts"] if o]
        assert len(oks) == 1, "%s: %d right answers in %r" % (name, len(oks), it["ask"][:40])
        ts = [t for t, _ in it["opts"]]
        assert len(ts) == len(set(ts)) >= 2, "%s: repeated or missing options %r" % (name, ts)
        for t in ts:
            assert '"' not in t and "\\" not in t, "%s: a quote or backslash in an option" % name
        # the story ENDS with the question, and the question is its own sentence
        assert it["ask"].rstrip().endswith("?"), "%s: the story does not end on a question" % name
        parts = [p.strip() for p in re.split(r"(?<=[.?])\s+", it["ask"]) if p.strip()]
        assert 2 <= len(parts) <= 4, "%s: %d sentences in %r" % (name, len(parts), it["ask"][:40])
        for p in parts:
            assert len(p.split()) <= MAX_SENTENCE_WORDS, \
                "%s: a %d-word sentence: %r" % (name, len(p.split()), p)
        # every number a child reads, and every numeric answer, is within Stage 1
        for n in re.findall(r"\b\d+\b", it["ask"] + " " + " ".join(ts)):
            assert int(n) <= MAX_NUMBER, "%s: %s is past Stage 1 in %r" % (name, n, it["ask"][:40])
    assert "'" not in EXPLAIN, "an apostrophe inside the single-quoted data-explain"
    for k, v in (("say", SAY), ("prompt", PROMPT), ("title", TITLE), ("done", DONE)):
        assert '"' not in v, "a double quote in %s" % k


def items_js(items):
    out = []
    for it in items:
        opts = ", ".join('{ t: "%s"%s }' % (t, ", ok: true" if ok else "") for t, ok in it["opts"])
        out.append('\n      { ask: "%s",\n'
                   '        opts: [%s],\n'
                   '        why: "%s" },' % (it["ask"], opts, it["why"]))
    return "".join(out)


def section(n, code):
    return ('<!-- %d  %s  %s -->\n'
            '<section class="slide" data-explain=\'%s\' data-say="%s">\n'
            '      <div class="slide-head"><span class="n">%d</span><h2>%s</h2></div>\n'
            '      <div class="say"><button type="button" class="speak" aria-label="Read it to me">🔊</button>'
            '<span id="wp%dsay">%s</span></div>\n'
            '      <div class="stage" id="wp%dst"></div>\n'
            '      <div class="choices" id="wp%dch"></div>\n'
            '      <p class="fb" id="wp%dfb" role="status" aria-live="polite"></p>\n'
            '      <div class="bigbtns"><button type="button" class="big small teal" id="wp%dnx" hidden>Next story</button></div>\n'
            '      <p class="score" id="wp%dsc"></p>\n'
            '    </section>\n') % (n, code, TITLE, EXPLAIN, SAY, n, TITLE, n, PROMPT, n, n, n, n, n)


def block(n, idx, items):
    return ('  /* ---- %d: story problems - one-step problems in the Cambridge Stage 1 shape ---- */\n'
            '  secondStep({\n'
            '    el: { say: $("wp%dsay"), stage: $("wp%dst"), ch: $("wp%dch"), fb: $("wp%dfb"), score: $("wp%dsc"), next: $("wp%dnx") },\n'
            '    label: "Story",\n'
            '    items: [%s\n'
            '    ],\n'
            '    finish: %d,\n'
            '    done: "%s",\n'
            '  });\n\n') % (n, n, n, n, n, n, n, items_js(items), idx, DONE)


done = skipped = refused = 0
for name in sorted(PLAN):
    plan = PLAN[name]
    p = os.path.join(G, name)
    s = io.open(p, encoding="utf-8", newline="").read()
    if MARK in s:
        print("  already  %s" % name)
        skipped += 1
        continue
    audit(name, plan["items"])

    badges = [x for x in re.findall(r'<span class="n">(.*?)</span>', s)]
    teach = len([b for b in badges if b.isdigit()])
    bad = []
    if [b for b in badges if b.isdigit()] != [str(i) for i in range(1, teach + 1)]:
        bad.append("step badges do not run 1..%d" % teach)
    if s.count(CHECK_BADGE) != 1:
        bad.append("check badge found %d times" % s.count(CHECK_BADGE))
    if s.count("function secondStep(") != 1:
        bad.append("secondStep is declared %d times; this tool installs none"
                   % s.count("function secondStep("))
    if s.count(FINISH) != 1:
        bad.append("finish() found %d times" % s.count(FINISH))
    if s.count(STICK_TAIL) != 1:
        bad.append("the check sticker found %d times" % s.count(STICK_TAIL))
    if STICKER[0] in s or STICKER[1] in s:
        bad.append("this lesson already uses the %s sticker" % STICKER[1])
    paren, colon = "finish(%d, " % teach, "finish: %d," % teach
    form = paren if s.count(paren) == 1 else (colon if s.count(colon) == 1 else None)
    if form is None:
        bad.append("the check finish(%d) is not present exactly once in either shape" % teach)
    if not re.search(r"(?:[ \t]*/\*[^\n]*stickers[^\n]*\*/\n)?[ \t]*const STICKERS = \[", s):
        bad.append("no STICKERS declaration")
    if not re.search(r"</(script|style)>\s*$", s):
        bad.append("page does not end on </script> or </style>")
    if bad:
        print("  REFUSED  %-30s %s" % (name, "; ".join(bad)))
        refused += 1
        continue

    n = teach + 1
    at = s.rindex('<section class="slide"', 0, s.index(CHECK_BADGE))
    s = s[:at] + section(n, plan["code"]) + s[at:]
    stick = re.search(r"(?:[ \t]*/\*[^\n]*stickers[^\n]*\*/\n)?[ \t]*const STICKERS = \[", s)
    s = s[:stick.start()] + block(n, teach, plan["items"]) + s[stick.start():]
    s = s.replace(form, form.replace(str(teach), str(teach + 1), 1), 1)
    s = s.replace(STICK_TAIL, '["%s", "%s"], %s' % (STICKER[0], STICKER[1], STICK_TAIL), 1)
    s = s.rstrip() + "\n\n<style>/* " + MARK + " - see add-story-problems.py */\n" + \
        "  /* the story is read from the instruction line; the stage stays empty on purpose */\n" + \
        "  #wp%dst:empty { display: none; }\n" % n + "</style>\n"

    assert s.count(MARK) >= 1
    if WRITE:
        io.open(p, "w", encoding="utf-8", newline="").write(s)
    print("  %s %-30s step %d added, %d stories, the check is now finish(%d)"
          % ("wrote  " if WRITE else "would  ", name, n, len(plan["items"]), teach + 1))
    done += 1

print("\n  %d lesson(s) %s, %d already done, %d refused%s"
      % (done, "written" if WRITE else "to write", skipped, refused,
         "" if WRITE else "   (--write to apply)"))
sys.exit(1 if refused else 0)
