# -*- coding: utf-8 -*-
"""A "Spot the mistake" step in every lesson: the TWM skills Cambridge calls
critiquing and improving.

    python add-spot-the-mistake.py            # report
    python add-spot-the-mistake.py --write

WHY THIS STEP AND NOT MORE PRACTICE. The 2026-09-16 comparison against the
Cambridge Stage 1 books found the build strong on explanation (every one of the
109 steps carries an authored four-move mini-lesson, and its WARN move already
names the misconception out loud) and strong on practice volume (banks of four
to eight items, which is Cambridge's own Practise range). What it had none of
was the task Cambridge uses most for reasoning: a character makes a SPECIFIC
mistake and the learner has to find it and say what it was.

That is not a stylistic flourish there - it is the house method. The Stage 1
Teacher's Guide has no misconception sidebar at all; what it has instead, over
and over, is a scripted error:

    Unit 2   "Suggest that he will sit in car number 4. Can learners explain
             why you have made a mistake?"
    Unit 14  "learners engage in the TWM skills of critiquing and improving as
             they evaluate Maris's addition ... her error is that she left out
             1 counter"
    Unit 16  "why it is incorrect and what should be done to make it right ...
             Jack hasn't lined up the faces"

So every item below is taken from a named Cambridge error, and the sources are
cited per item in the data. Where Cambridge names the wrong ANSWER as well as
the error (counting on 3 from 3 and landing on 4; 7 + 5 read as 11; the
difference between 9 and 5 given for 3) that number is the item's distractor,
because a distractor a child actually produces is worth more than a plausible
one nobody reaches for.

ONE ITEM IN EVERY STEP IS CORRECT, and that is also Cambridge's design - Unit
14's assessment note mixes right and wrong answers deliberately, "so that
learners can't pattern-match it is always wrong". A child who learns that the
checking step always finds a fault has learned the step, not the mathematics.

WHERE IT GOES, AND WHAT IT COSTS. After the lesson's own steps and before the
check, which is the owner's standing choice (2026-09-11) for every step added
since. Progress records steps by POSITION, so a child who has already finished
a lesson returns to find the check undone and this step ticked in its place.
That is the accepted cost of adding a step here and is unchanged by this tool.

WHAT MOVES, all of it asserted before a byte is written:
  - one slide per lesson, carrying its own `<!-- N  CODE  title -->` comment;
  - the check's finish() index, by one;
  - STICKERS, one new entry before the check's, so the shelf keeps counting
    itself (every lesson already counts from STICKERS.length);
  - nothing else. explorationSteps in app.config.json names steps by number and
    this step is appended after all of them, so no recorded number moves.

THE RUNNER is secondStep(), already in four of the seven lessons from
add-second-steps.py. The three that lack it (Halves and Wholes, What Comes
Next, Asking and Sorting) are given the same function and the same base
stylesheet, under this tool's own marker - never a second copy where one is
already present, which the guard below refuses.

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

MARK = "ehel-spot-the-mistake"
CHECK_BADGE = '<span class="n">✓</span>'
FINISH = "  function finish(i, msg) {"
STICK_TAIL = '["✅", "Show what I know"]'


def ssml(calm, friendly, empathetic, cheerful):
    """The four voices every step's Explain speaks in, exactly as the lessons write them."""
    s = lambda xs: "".join("<s>%s</s>" % x for x in xs)
    return ('<mstts:express-as style="calm" styledegree="1.15"><prosody rate="-8%%">%s</prosody></mstts:express-as>'
            '<break time="330ms"/><mstts:express-as style="friendly" styledegree="1.25">%s</mstts:express-as>'
            '<break time="330ms"/><mstts:express-as style="empathetic" styledegree="1.3"><prosody rate="-6%%">%s</prosody></mstts:express-as>'
            '<break time="330ms"/><mstts:express-as style="cheerful" styledegree="1.45">%s</mstts:express-as>'
            % (s(calm), s(friendly), s(empathetic), s(cheerful)))


# The runner, for the three lessons that do not already carry it. Byte-identical
# to add-second-steps.py's, minus the flash arm, which no item here uses.
RUNNER = r'''
  /* ==== ehel-spot-the-mistake: the runner - see grade-1-app/add-spot-the-mistake.py ====
     The same question-after-question shape as add-second-steps.py's secondStep,
     installed here for the three lessons that never had one. The child moves on
     with a button rather than a timer: say() stops whatever is playing, so a
     timer that draws the next question cuts the explanation off, and every item
     here explains itself. Takes ELEMENTS, so each step's block names its slide. */
  function secondStep(o) {
    const el = o.el, items = o.items;
    const words = (h) => String(h).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    let i = 0, right = 0, lock = true;
    function draw() {
      const it = items[i];
      lock = true;
      el.next.hidden = true;
      el.say.innerHTML = it.ask;
      el.fb.className = "fb"; el.fb.textContent = "";
      el.score.textContent = (o.label || "Question") + " " + (i + 1) + " of " + items.length;
      el.stage.innerHTML = it.pic || "";
      el.ch.innerHTML = shuffle(items[i].opts).map((c) => '<button type="button" class="choice' +
        (/^\s*\d+\s*$/.test(c.t) ? "" : " ss-w") + '" data-ok="' + (c.ok ? 1 : 0) + '">' + c.t + "</button>").join("");
      lock = false;
      say(words(it.ask));
    }
    el.ch.addEventListener("click", (e) => {
      const b = e.target.closest(".choice"); if (!b || lock) return;
      lock = true;
      const it = items[i], ok = b.dataset.ok === "1";
      el.ch.querySelectorAll(".choice").forEach((c) => { c.disabled = true; if (c.dataset.ok === "1") c.classList.add("right"); });
      if (ok) right++; else b.classList.add("wrong");
      const msg = (ok ? cheer() + " " : "Not quite. ") + it.why;
      el.fb.className = "fb " + (ok ? "good" : "bad"); el.fb.textContent = msg;
      i++;
      if (i < items.length) el.next.hidden = false;
      else { el.score.textContent = "You got " + right + " of " + items.length + ". " + o.done; finish(o.finish); }
      say(msg);
    });
    el.next.addEventListener("click", () => { if (i < items.length) draw(); });
    draw();
  }
'''

# The speech bubble: the claim a child is asked to judge, said in the first
# person by a name this build already uses. Cambridge puts the claim in a
# character's mouth on every one of these tasks, and a claim attributed to
# somebody is easier to disagree with than a sentence on its own.
BUBBLE = r'''  /* ehel-spot-the-mistake: the claim being judged, in the mouth of the child who made it */
  const smSays = (who, what) => '<div class="sm-bubble"><p class="sm-what">' + what +
    '</p><p class="sm-who">' + who + '</p></div>';
'''

CSS_SM = """  .sm-bubble { max-width: min(92%, 460px); margin: 0 auto; background: var(--card); border: 4px solid var(--line);
    border-radius: 22px; padding: 16px 20px 12px; }
  .sm-what { margin: 0; font-size: clamp(19px, 4.4vw, 24px); line-height: 1.35; color: var(--ink); }
  .sm-who { margin: 8px 0 0; font-family: "Inter", "Segoe UI", sans-serif; font-weight: 800; font-size: 17px;
    color: var(--muted); text-align: right; }
"""
# only for the three lessons that never had add-second-steps.py's stylesheet
CSS_WORDS = """  .choice.ss-w { height: auto; min-height: 64px; padding: 10px 16px; font-size: 22px; line-height: 1.25; }
"""

EXPLAIN = ssml(
    ["Today you are the checker."],
    ["Somebody has done some maths and told you what they think.",
     "Sometimes they are right and sometimes they have slipped.",
     "Do it yourself first, then look at what they said.",
     "If it does not match, work out WHICH part went wrong."],
    ["Children often tap the first answer that sounds like a mistake.",
     "Look again before you tap.",
     "And some of these are right.",
     "Saying right when it is right is just as clever as finding a mistake."],
    ["So read what they say, work it out yourself, and tap what went wrong."])

SAY = "Read what each child says. Work it out yourself. Then tap what went wrong."
PROMPT = "Read what each child says, work it out yourself, then tap what went wrong."
DONE = "You can check somebody else and say what went wrong."

# ===========================================================================
# THE ITEMS. Every one is a named Cambridge error - the source is in `src`.
# ===========================================================================
COUNTING = [
    dict(src="TG p92, Unit 10 Differentiation - counting on includes the start number",
         who="Musa", claim="I start at 5 and count on 3. I get 7.",
         ask="Musa starts at 5 and counts on 3. He says the answer is 7. What went wrong?",
         opts=[("He counted the 5 as his first jump", True),
               ("He counted back instead of on", False),
               ("He made 4 jumps instead of 3", False)],
         why="Counting on 3 from 5 is three jumps: 6, 7, 8. The 5 is where you start, not a jump. The answer is 8."),
    dict(src="LB p125 Explore, Unit 13 - number bibs are names, not positions",
         who="Amina", claim="The runner wearing number 1 must have finished first.",
         ask="The runners wear numbers on their shirts. Amina says the runner wearing 1 must have finished first. What went wrong?",
         opts=[("The number is only a name for that runner", True),
               ("Number 1 always finishes first", False),
               ("The runner wearing 1 finished last", False)],
         why="A number on a shirt is like a name. It does not say who came first. First, second and third tell you the order."),
    dict(src="RTG p67, Unit 13 - Jack has put 13 in the wrong place",
         who="Hodan", claim="In order: 11, 12, 15, 13, 16.",
         ask="Hodan puts these in order: 11, 12, 15, 13, 16. Where is her mistake?",
         opts=[("13 is in the wrong place", True),
               ("11 is in the wrong place", False),
               ("There is no mistake", False)],
         why="After 12 comes 13, then 14, then 15. Hodan put 13 after 15 instead of before it."),
    dict(src="TG p11 and Unit 9 Practise - read a ten frame by its structure, not by counting from 1",
         who="Kiki", claim="The top row is full and there is one more. That is 5.",
         ask="The top row of the ten frame is full, and there is one more counter below it. Kiki says 5. What went wrong?",
         opts=[("She forgot the one below the full row", True),
               ("A full row is 4, not 5", False),
               ("She counted the empty boxes too", False)],
         why="A full top row is always 5. One more below makes 6."),
    dict(src="TG Unit 14 Assessment ideas - some of the examples must be right",
         who="Ali", claim="17 is 1 ten and 7 ones.",
         ask="Ali says 17 is 1 ten and 7 ones. Is he right?",
         opts=[("Yes, he is right", True),
               ("No, it is 7 tens and 1 one", False),
               ("No, it is 1 ten and 8 ones", False)],
         why="17 is one ten and seven ones, so Ali is right. Saying so when it is right is good checking too."),
    dict(src="0096 1Nc.05 - even and odd as every other number, not as size",
         who="Musa", claim="9 is even, because 9 is a big number.",
         ask="Musa says 9 is even because it is a big number. What went wrong?",
         opts=[("Even is about pairs, not about size", True),
               ("9 is even, so he is right", False),
               ("Even means the number is small", False)],
         why="Put 9 into pairs and one is left over, so 9 is odd. Being big or small does not decide it."),
]

ADDING = [
    dict(src="LB p150 Try this, Unit 14 - Maris left out 1 counter bridging ten",
         who="Amina", claim="7 add 5. I filled a ten frame and put 1 more. That is 11.",
         ask="Amina works out 7 add 5 with counters. She fills a ten frame and puts 1 more beside it. She says 11. What went wrong?",
         opts=[("She lost a counter on the way", True),
               ("She should have filled two whole frames", False),
               ("7 add 5 really is 11", False)],
         why="Fill the ten frame with 10 and 2 are still left over. 7 add 5 is 12."),
    dict(src="LB p16 Explore, Unit 2 - counting on when the problem says count back",
         who="Hodan", claim="Take away 2 from 9. I count on 2 and get 11.",
         ask="The question says take away 2 from 9. Hodan counts on 2 and says 11. What went wrong?",
         opts=[("She counted on when she should count back", True),
               ("She counted back too many", False),
               ("She started at the wrong number", False)],
         why="Take away means count back. Back 2 from 9 is 8, then 7. The answer is 7."),
    dict(src="TG Unit 14 Assessment ideas - the planted 5 + 12 = 16",
         who="Ali", claim="5 add 12 is 16.",
         ask="Ali writes that 5 add 12 is 16. What went wrong?",
         opts=[("It is 17, one more than he said", True),
               ("It is 16, so he is right", False),
               ("It is 15, one less than he said", False)],
         why="Start at 12, the bigger number, and count on 5: 13, 14, 15, 16, 17."),
    dict(src="TG Units 11 and 14 - the equals sign means has the same value",
         who="Kiki", claim="3 add 1 equals 2 add 2 cannot be right. There is no answer after the equals sign.",
         ask="Kiki sees 3 add 1 equals 2 add 2. She says it cannot be right because no answer comes after the equals sign. What went wrong?",
         opts=[("Equals means both sides have the same value", True),
               ("The answer must always come last", False),
               ("3 add 1 does not make 4", False)],
         why="3 and 1 make 4. 2 and 2 make 4. Both sides have the same value, so the equals sign is right where it is."),
    dict(src="LB p112 Try this, Unit 11 - the planted pair 9 and 5 for a difference of 3",
         who="Musa", claim="Two numbers with a difference of 3: 9 and 5.",
         ask="Musa is asked for two numbers with a difference of 3. He says 9 and 5. What went wrong?",
         opts=[("The difference between 9 and 5 is 4", True),
               ("The difference between 9 and 5 is 3", False),
               ("You cannot find the difference of 9 and 5", False)],
         why="Count up from 5 to 9: 6, 7, 8, 9. That is 4 jumps, so the difference is 4. 8 and 5 would have a difference of 3."),
    dict(src="TG Unit 14 Assessment ideas - 8 + 7 = 15 is the correct one of the pair",
         who="Amina", claim="8 add 7 is 15.",
         ask="Amina says 8 add 7 is 15. Is she right?",
         opts=[("Yes, she is right", True),
               ("No, it is 14", False),
               ("No, it is 16", False)],
         why="Double 7 is 14, and one more makes 15. Amina is right."),
]

HALVES = [
    dict(src="LB p116 Learn, Unit 12 - the fold that is not accurate makes two parts that are not equal",
         who="Ali", claim="I cut the strip near one end. Both parts are halves.",
         ask="Ali cuts a strip of paper near one end. He says both parts are halves. What went wrong?",
         opts=[("The two parts are not the same size", True),
               ("He made two parts, so they are halves", False),
               ("He needed to cut it into three parts", False)],
         why="A half is one of two EQUAL parts. Cutting near the end leaves one thin part and one fat part."),
    dict(src="the build own WARN move, Colour one half",
         who="Amina", claim="I coloured both parts. That is one half.",
         ask="Amina colours both parts of a circle and says she has coloured one half. What went wrong?",
         opts=[("Colouring both parts is the whole circle", True),
               ("She coloured the wrong part", False),
               ("One half means colouring none of it", False)],
         why="One half is ONE of the two equal parts. Both parts together make the whole."),
    dict(src="RTG lesson 12.3 - David has not cut his shape into halves",
         who="Musa", claim="I shared 8 mangoes. One gets 5 and one gets 3. That is fair.",
         ask="Musa shares 8 mangoes between two people. He gives 5 to one and 3 to the other and says it is fair. What went wrong?",
         opts=[("5 and 3 are not the same", True),
               ("8 mangoes cannot be shared fairly", False),
               ("He should give 6 and 2", False)],
         why="Fair means both get the same. Half of 8 is 4, so each person gets 4."),
    dict(src="the build own step 2 - a corner to corner cut is fair too; one item in every step is right",
         who="Hodan", claim="I cut the square from corner to corner. Both parts are halves.",
         ask="Hodan cuts a square from corner to corner. She says both parts are halves. Is she right?",
         opts=[("Yes, the two parts are the same size", True),
               ("No, a fair cut must go straight down", False),
               ("No, corner to corner makes three parts", False)],
         why="A fair cut does not have to go straight down. Corner to corner leaves two parts that match exactly."),
    dict(src="0096 1Nf.03 - half as an operator, and the doubling slip",
         who="Kiki", claim="Half of 10 is 20.",
         ask="Kiki says half of 10 is 20. What went wrong?",
         opts=[("She doubled it instead of halving it", True),
               ("Half of 10 really is 20", False),
               ("She should have said 15", False)],
         why="Halving makes a number smaller. 5 and 5 make 10, so half of 10 is 5."),
    dict(src="0096 1Nf.04 - halves combine to make wholes",
         who="Ali", claim="Two halves make two wholes.",
         ask="Ali says two halves make two wholes. What went wrong?",
         opts=[("Two halves fit together to make ONE whole", True),
               ("Two halves make four wholes", False),
               ("He is right", False)],
         why="Two halves join up to make one whole. You would need four halves to make two wholes."),
]

PATTERNS = [
    dict(src="LB p164 Learn, Unit 15 - sequences can repeat 2, 3, 4 or more objects",
         who="Kiki", claim="Red, blue, yellow, red, blue, yellow is not a pattern. It does not go red, blue, red, blue.",
         ask="The beads go red, blue, yellow, red, blue, yellow. Kiki says that is not a pattern because it does not go red, blue, red, blue. What went wrong?",
         opts=[("The part that repeats can be 3 long", True),
               ("A pattern must always use two colours", False),
               ("The beads are in the wrong order", False)],
         why="The part that repeats here is red, blue, yellow, and it repeats. A repeating part can be 2, 3, 4 or more."),
    dict(src="0096 1Nc.04 - counting on in twos",
         who="Musa", claim="Counting in twos: 2, 4, 6, 7, 10.",
         ask="Musa counts in twos: 2, 4, 6, 7, 10. Where is his mistake?",
         opts=[("He said 7 when it should be 8", True),
               ("He said 10 when it should be 9", False),
               ("He started at the wrong number", False)],
         why="Counting in twos goes 2, 4, 6, 8, 10. Every jump is 2, and 7 is only 1 more than 6."),
    dict(src="TG Unit 11 Learn - if each first number grows by 1 the totals should grow by 1",
         who="Amina", claim="1 add 1 is 2. 2 add 1 is 3. 3 add 1 is 5. 4 add 1 is 5.",
         ask="Amina writes: 1 add 1 is 2, 2 add 1 is 3, 3 add 1 is 5, 4 add 1 is 5. Which line is wrong?",
         opts=[("3 add 1 is 4, not 5", True),
               ("2 add 1 is 4, not 3", False),
               ("4 add 1 is 6, not 5", False)],
         why="Each first number grows by 1, so each total should grow by 1 as well: 2, 3, 4, 5."),
    dict(src="0096 1Nc.04 - counting back in tens, not in ones",
         who="Hodan", claim="Counting back in tens from 20: 20, 19, 18.",
         ask="Hodan counts back in tens from 20. She says 20, 19, 18. What went wrong?",
         # the distractors stay INSIDE Stage 1. "She counted back in twos" was
         # the obvious wrong option and 1Nc.04 counts back in ones and tens only,
         # so naming it puts a skill this stage does not teach in front of a
         # child as though it were one. review-stage-boundary.py catches it.
         opts=[("She counted back in ones", True),
               ("She counted on instead of back", False),
               ("She should have started at 10", False)],
         why="Counting back in tens from 20 goes 20, 10, 0. Every jump takes away ten, not one."),
    dict(src="one item in every step is right - TG Unit 14 Assessment ideas",
         who="Ali", claim="3 add something is 7. The something is 4.",
         ask="Ali is asked what is missing in 3 add something makes 7. He says 4. Is he right?",
         opts=[("Yes, he is right", True),
               ("No, it is 10", False),
               ("No, it is 3", False)],
         why="3 and 4 make 7, so 4 is the missing number. Ali checked by counting on from 3."),
    dict(src="TG Unit 11 - the equals sign, on the balance",
         who="Kiki", claim="5 add 2 on one side and 4 add 3 on the other cannot balance. The numbers are different.",
         ask="One side of the scales shows 5 add 2 and the other shows 4 add 3. Kiki says they cannot balance because the numbers are different. What went wrong?",
         opts=[("Both sides make 7, so they balance", True),
               ("5 add 2 makes 8", False),
               ("Only the very same numbers can balance", False)],
         why="5 and 2 make 7. 4 and 3 make 7 as well. The totals are the same, so the scales balance."),
]

SHAPES = [
    dict(src="LB p74 Practise, Unit 8 - make sure learners understand 2D shapes are flat and 3D shapes are solid",
         who="Amina", claim="That ball is a circle.",
         ask="Amina points at a ball and says it is a circle. What went wrong?",
         opts=[("A ball is solid, so it is a sphere", True),
               ("A ball is a flat shape", False),
               ("A ball is a cube", False)],
         why="A circle is flat and you can draw it. A ball is solid and you can hold it. A solid round shape is a sphere."),
    dict(src="LB p92 Let's talk, Unit 10 - you must use the same item for measuring",
         who="Musa", claim="The book took 8 cubes and the pencil took 5 paperclips, so the book is longer.",
         ask="Musa measures the book with cubes and the pencil with paperclips. The book took 8 and the pencil took 5, so he says the book is longer. What went wrong?",
         opts=[("He measured the two things with different units", True),
               ("8 is more than 5, so he is right", False),
               ("He should have counted the cubes twice", False)],
         why="To compare two lengths you must measure both with the SAME thing. Eight of one and five of another tell you nothing."),
    dict(src="RTG lesson 15.4 - Annay is incorrect about which way the toy faces after a turn",
         who="Hodan", claim="I faced the door and turned all the way round. Now I face the window behind me.",
         ask="Hodan faces the door, then turns all the way round once. She says she is now facing the window behind her. What went wrong?",
         opts=[("A whole turn brings her back to the door", True),
               ("A whole turn is the same as a half turn", False),
               ("She is right", False)],
         why="A whole turn goes all the way round and finishes where it started. A HALF turn would face her the other way."),
    dict(src="0096 1Gg.03 - faces of a 3D shape, including the ones you cannot see",
         who="Ali", claim="A cube has 4 faces.",
         ask="Ali says a cube has 4 faces. What went wrong?",
         opts=[("He forgot the top and the bottom", True),
               ("A cube has 8 faces", False),
               ("A cube really does have 4 faces", False)],
         why="A cube has 6 flat faces: four around the sides, one on top and one underneath."),
    dict(src="0096 1Gg.05 - capacity is not height; pour into the same cups to compare",
         who="Kiki", claim="The tall thin jug must hold more than the short wide one.",
         ask="Without pouring anything, Kiki says the tall thin jug must hold more than the short wide one. What went wrong?",
         opts=[("Tall does not always mean it holds more", True),
               ("The tall jug always holds more", False),
               ("There is no way to find out which holds more", False)],
         why="A short wide jug can hold more than a tall thin one. Pour each into the same cups and count to find out."),
    dict(src="0096 1Gg.07 - one item in every step is right",
         who="Amina", claim="A square still looks the same after a quarter turn.",
         ask="Amina says a square still looks the same when you give it a quarter turn. Is she right?",
         opts=[("Yes, she is right", True),
               ("No, it turns into a diamond", False),
               ("No, it turns into a rectangle", False)],
         why="A square has four equal sides and four square corners, so a quarter turn leaves it looking exactly the same."),
]

DAYS = [
    dict(src="LB Practise, Unit 6 - some activities take years and some take minutes",
         who="Hodan", claim="A baby grows into a child in about 3 minutes.",
         ask="Hodan says a baby grows into a child in about 3 minutes. What went wrong?",
         opts=[("Growing up takes years, not minutes", True),
               ("It takes about 3 hours", False),
               ("She is right", False)],
         why="A minute is short, about as long as cleaning your teeth. Growing up takes years."),
    dict(src="0096 1Gt.03 - the short hand is the hour hand",
         who="Amina", claim="The long hand tells you the hour.",
         ask="Amina says the long hand on the clock tells you the hour. What went wrong?",
         opts=[("The SHORT hand tells you the hour", True),
               ("Both hands tell you the hour", False),
               ("The long hand tells you the day", False)],
         why="The short hand points at the hour. The long hand shows the minutes, and at o'clock it points straight up at 12."),
    dict(src="0096 1Gt.03 - at half past the hour hand sits between two numbers",
         who="Musa", claim="The short hand is between 3 and 4 and the long hand points down. It is half past 4.",
         ask="The short hand is between 3 and 4, and the long hand points straight down at 6. Musa says half past 4. What went wrong?",
         opts=[("It is half past 3, the hour it has passed", True),
               ("It is half past 6", False),
               ("It is 4 o'clock", False)],
         why="At half past, the short hand sits between two numbers. You say the hour it has already gone past, so this is half past 3."),
    dict(src="0096 1Gt.02 - the days of the week in order",
         who="Ali", claim="The day after Sunday is Saturday.",
         ask="Ali says the day after Sunday is Saturday. What went wrong?",
         opts=[("After Sunday the week starts again with Monday", True),
               ("The day after Sunday is Friday", False),
               ("He is right", False)],
         why="Saturday comes BEFORE Sunday. After Sunday the week begins again with Monday."),
    dict(src="LB Practise, Unit 6 - matching the unit of time to the length of the activity",
         who="Kiki", claim="A whole school day lasts about one minute.",
         ask="Kiki says a whole school day lasts about one minute. What went wrong?",
         opts=[("A school day lasts hours, not one minute", True),
               ("A school day lasts about one week", False),
               ("She is right", False)],
         why="One minute is very short. A whole school day takes many hours."),
    dict(src="0096 1Gt.02 - one item in every step is right",
         who="Amina", claim="There are 12 months in a year.",
         ask="Amina says there are 12 months in a year. Is she right?",
         opts=[("Yes, she is right", True),
               ("No, there are 7", False),
               ("No, there are 10", False)],
         why="There are 12 months in a year, from January to December. 7 is the number of DAYS in a week."),
]

DATA = [
    dict(src="RTG lesson 16.1 - Jack hasn't lined up the faces; they should be one on top of another",
         who="Musa", claim="My pictogram is finished. The faces in each row start wherever there was room.",
         ask="Musa makes a pictogram, but the faces in each row start in different places. What went wrong?",
         opts=[("The pictures must line up one above another", True),
               ("He used the wrong pictures", False),
               ("A pictogram does not need rows", False)],
         why="When the pictures line up you can see at a glance which row is longest. Starting in different places makes the rows impossible to compare."),
    dict(src="RTG lesson 7.2 - agree that he has made a table, not a Carroll diagram",
         who="Ali", claim="Here is my Carroll diagram. I wrote the red things in one list and the rest in another.",
         ask="Ali says he has made a Carroll diagram, but he has only written two lists side by side. What went wrong?",
         opts=[("A Carroll diagram sorts by IS and IS NOT in boxes", True),
               ("A Carroll diagram needs three lists", False),
               ("He is right", False)],
         why="A Carroll diagram has a box for the things that ARE red and a box for the things that are NOT red, so everything has a place."),
    dict(src="RTG lesson 7.3 - Annay has missed the fifth diagonal mark on each set of lines",
         who="Hodan", claim="Five in the tally: five straight lines side by side.",
         ask="Hodan writes five in a tally chart as five straight lines side by side. What went wrong?",
         opts=[("The fifth mark goes across the other four", True),
               ("She should write only four marks", False),
               ("Tally marks should be circles", False)],
         why="The fifth mark goes across the first four to make a gate of five. Then you can count the groups in fives."),
    dict(src="TG Units 4 and 16 - make sure learners recognise it is the same information presented another way",
         who="Kiki", claim="The table and the block graph show different things.",
         ask="Kiki looks at a table and a block graph made from the SAME answers. She says the graph shows something different. What went wrong?",
         opts=[("It is the same information shown another way", True),
               ("A graph always shows more than a table", False),
               ("She is right", False)],
         why="A list, a table, a block graph and a pictogram can all show the very same answers. Only the way it is drawn changes."),
    dict(src="LB p171, Unit 16 - what most popular means",
         who="Amina", claim="The shortest bar is the most popular one.",
         ask="Amina looks at the block graph and says the shortest bar is the most popular. What went wrong?",
         opts=[("The most popular is the TALLEST bar", True),
               ("The shortest bar is the most popular", False),
               ("A graph cannot tell you which is most popular", False)],
         why="Most popular means the most people chose it, so it is the tallest bar. The shortest bar is the least popular."),
    dict(src="0096 1Ss.01 - one item in every step is right",
         who="Ali", claim="I asked everybody in my class and wrote down every answer.",
         ask="Ali asks everyone in his class his question and writes down every answer. Is that a good way to collect the answers?",
         opts=[("Yes, asking everyone and writing it down is right", True),
               ("No, he should ask only his friends", False),
               ("No, he should remember them instead", False)],
         why="Asking everyone gives the whole picture, and writing each answer down means not one of them is forgotten."),
]

# Which lessons already carry secondStep() and its word-option rule is READ from
# the files rather than listed here: a list of that kind is a second copy of
# something the page already knows, and the first draft of this tool had it
# wrong for Shapes and Sizes.
PLAN = {
    "counting-to-twenty.html": dict(items=COUNTING, code="1Nc.01"),
    "adding-and-taking-away.html": dict(items=ADDING, code="1Ni.05"),
    "halves-and-wholes.html": dict(items=HALVES, code="1Nf.01"),
    "what-comes-next.html": dict(items=PATTERNS, code="1Nc.06"),
    "shapes-and-sizes.html": dict(items=SHAPES, code="1Gg.06"),
    "days-months-and-clocks.html": dict(items=DAYS, code="1Gt.01"),
    "asking-and-sorting.html": dict(items=DATA, code="1Ss.02"),
}
TITLE = "Spot the mistake"
STICKER = ("🕵️", "Spot the mistake")


def audit(name, items):
    """Refuse content that would break the markup, the voice, or the key checker."""
    for it in items:
        for k in ("ask", "why", "claim", "who"):
            assert '"' not in it[k], "%s: a double quote in %s" % (name, k)
            assert "\\" not in it[k], "%s: a backslash in %s" % (name, k)
            assert "<" not in it[k] and ">" not in it[k], "%s: markup in %s" % (name, k)
        oks = [o for t, o in it["opts"] if o]
        assert len(oks) == 1, "%s: %d right answers in %r" % (name, len(oks), it["ask"][:40])
        ts = [t for t, _ in it["opts"]]
        assert len(ts) == len(set(ts)) >= 2, "%s: repeated or missing options %r" % (name, ts)
        for t in ts:
            assert '"' not in t and "\\" not in t, "%s: a quote or backslash in an option" % name
    assert "'" not in EXPLAIN, "an apostrophe inside the single-quoted data-explain"
    for k, v in (("say", SAY), ("prompt", PROMPT), ("title", TITLE), ("done", DONE)):
        assert '"' not in v, "a double quote in %s" % k


def items_js(items):
    out = []
    for it in items:
        opts = ", ".join('{ t: "%s"%s }' % (t, ", ok: true" if ok else "") for t, ok in it["opts"])
        out.append('\n      /* %s */\n'
                   '      { ask: "%s",\n'
                   '        pic: smSays("%s", "%s"),\n'
                   '        opts: [%s],\n'
                   '        why: "%s" },' % (it["src"], it["ask"], it["who"], it["claim"], opts, it["why"]))
    return "".join(out)


def section(n, code):
    return ('<!-- %d  %s  %s -->\n'
            '<section class="slide" data-explain=\'%s\' data-say="%s">\n'
            '      <div class="slide-head"><span class="n">%d</span><h2>%s</h2></div>\n'
            '      <div class="say"><button type="button" class="speak" aria-label="Read it to me">🔊</button>'
            '<span id="sm%dsay">%s</span></div>\n'
            '      <div class="stage" id="sm%dst"></div>\n'
            '      <div class="choices" id="sm%dch"></div>\n'
            '      <p class="fb" id="sm%dfb" role="status" aria-live="polite"></p>\n'
            '      <div class="bigbtns"><button type="button" class="big small teal" id="sm%dnx" hidden>Next question</button></div>\n'
            '      <p class="score" id="sm%dsc"></p>\n'
            '    </section>\n') % (n, code, TITLE, EXPLAIN, SAY, n, TITLE, n, PROMPT, n, n, n, n, n)


def block(n, idx, items):
    return ('  /* ---- %d: spot the mistake - critiquing and improving, from the Cambridge Stage 1 books ---- */\n'
            '  secondStep({\n'
            '    el: { say: $("sm%dsay"), stage: $("sm%dst"), ch: $("sm%dch"), fb: $("sm%dfb"), score: $("sm%dsc"), next: $("sm%dnx") },\n'
            '    label: "Mistake",\n'
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
    if s.count(FINISH) != 1:
        bad.append("finish() found %d times" % s.count(FINISH))
    if s.count(STICK_TAIL) != 1:
        bad.append("the check sticker found %d times" % s.count(STICK_TAIL))
    if s.count(STICKER[0]) or s.count(STICKER[1]):
        bad.append("this lesson already uses the %s sticker" % STICKER[1])
    has_runner = "function secondStep(" in s
    has_words = ".choice.ss-w" in s
    if s.count("function secondStep(") > 1:
        bad.append("secondStep is declared %d times" % s.count("function secondStep("))
    # the check's own finish(), in whichever of the two shapes this lesson writes it
    paren, colon = "finish(%d, " % teach, "finish: %d," % teach
    form = paren if s.count(paren) == 1 else (colon if s.count(colon) == 1 else None)
    if form is None:
        bad.append("the check finish(%d) is not present exactly once in either shape" % teach)
    stick = re.search(r"(?:[ \t]*/\*[^\n]*stickers[^\n]*\*/\n)?[ \t]*const STICKERS = \[", s)
    if not stick:
        bad.append("no STICKERS declaration")
    if not re.search(r"</(script|style)>\s*$", s):
        bad.append("page does not end on </script> or </style>")
    if bad:
        print("  REFUSED  %-30s %s" % (name, "; ".join(bad)))
        refused += 1
        continue

    n = teach + 1
    # 1. the slide, in front of the check
    at = s.rindex('<section class="slide"', 0, s.index(CHECK_BADGE))
    s = s[:at] + section(n, plan["code"]) + s[at:]
    # 2. the bubble, and the runner where this lesson has none
    eol = s.index("\n", s.index(FINISH))
    add = BUBBLE if has_runner else (RUNNER.lstrip("\n") + BUBBLE)
    s = s[:eol + 1] + add + s[eol + 1:]
    # 3. the step's block, after the check's code and before the stickers'
    stick = re.search(r"(?:[ \t]*/\*[^\n]*stickers[^\n]*\*/\n)?[ \t]*const STICKERS = \[", s)
    s = s[:stick.start()] + block(n, teach, plan["items"]) + s[stick.start():]
    # 4. the check moves along by one
    s = s.replace(form, form.replace(str(teach), str(teach + 1), 1), 1)
    # 5. one sticker, before the check's
    s = s.replace(STICK_TAIL, '["%s", "%s"], %s' % (STICKER[0], STICKER[1], STICK_TAIL), 1)
    # 6. the classes the bubble uses
    css = CSS_SM + ("" if has_words else CSS_WORDS)
    s = s.rstrip() + "\n\n<style>/* " + MARK + " - see add-spot-the-mistake.py */\n" + css + "</style>\n"

    assert s.count(MARK) >= 2
    if WRITE:
        io.open(p, "w", encoding="utf-8", newline="").write(s)
    print("  %s %-30s step %d added, %d items, the check is now finish(%d)%s%s"
          % ("wrote  " if WRITE else "would  ", name, n, len(plan["items"]), teach + 1,
             "" if has_runner else "   + the runner", "" if has_words else "   + the word-option rule"))
    done += 1

print("\n  %d lesson(s) %s, %d already done, %d refused%s"
      % (done, "written" if WRITE else "to write", skipped, refused,
         "" if WRITE else "   (--write to apply)"))
sys.exit(1 if refused else 0)
