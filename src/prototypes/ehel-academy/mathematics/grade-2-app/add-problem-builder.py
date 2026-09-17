# -*- coding: utf-8 -*-
"""Make up a word problem that matches this number sentence.

    python add-problem-builder.py            # report
    python add-problem-builder.py --write

WHAT CAMBRIDGE ACTUALLY ASKS, taken from the Stage 2 books rather than from the
phrase "make up your own problem" in the abstract. Counted: 5 in the Learner's
Book, 18 in the Teacher's Guide, and many more in Ready to Go's Extension
notes. The dominant shape is not free invention - it is:

    "Ask learners to make up a word problem to MATCH A NUMBER SENTENCE,
     for example, 70 + 30 = 100."                        (Guide, Unit 7)

and the Guide names the TWM skill it exercises, repeatedly and consistently:

    "Learners use the skill of SPECIALISING as they make up their own word
     problems in the Wrapping up activity."
    "Can they use skills of SPECIALISING to make up a word problem of their
     own to match one of the addition or subtraction sentences?"
    "ask them to use their skills of SPECIALISING to make up stories to go
     with their calculations."

SO THIS STEP DOES NOT CLAIM CONJECTURING, and the TWM count does not move.
Conjecturing is "Forming mathematical questions or ideas" and stays unclaimed
at 7 of 8, exactly as the hub says. A child choosing values to fit a frame is
specialising - "Choosing an example and checking if it satisfies or does not
satisfy specific mathematical criteria" - which is precisely what happens here:
they pick, then they check their story against the sentence. Stamping this as
conjecturing would be the over-claim the open-response spec warns about, and
would make the other seven worth less.

WHY THIS IS CHECKABLE, which free text is not. The number sentence is given, so
the numbers are fixed; what the child chooses is the PERSON, and then the thing
that HAPPENS. Only an action matching the operation can match the sentence -
"buys 20 more" matches 34 + 20, "gives away 20" does not - so the choice that
carries the mathematics is markable by three buttons. Then the child solves the
problem they just built, and the app knows that answer because it composed it.
No free-text input, no marking of prose, nothing pretended.

WHAT IS STILL NOT DONE, said plainly: Cambridge's version ends "and swap with a
partner". A child alone cannot swap. That half is left to the teacher.

THE STEP MOVES THE CHECK. Progress is recorded by step POSITION, so this
reopens the lesson for a learner who had finished it. Same cost the other steps
in this pass paid, and it is announced rather than hidden.
"""
import io, os, re, sys

sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))
WRITE = "--write" in sys.argv[1:]
for a in sys.argv[1:]:
    if a != "--write":
        sys.exit("unrecognised argument: %s" % a)

MARK = "ehel-problem-builder"
RUNNER_MARK = "ehel-build-runner"
CEILING = 100

# lesson -> (objective, sentence, whos, things, actions, solve, explain)
#   sentence  (a, op, b, ans)   op is one of + - share repeat
#   actions   (text, ok) - exactly one ok, and it must match the operation
#   explain   the four moves: idea, worked, trap, handover
WORK = {
 "tens-and-ones": ("2Ni.01", (34, "+", 20, 54), ["Amina", "Musa", "Hodan"], ("has 34 mangoes", "mangoes"),
   [("buys 20 more", True), ("gives away 20", False), ("shares them with 20 friends", False)],
   [("54", True), ("14", False), ("36", False)],
   (["A number sentence can be told as a story, and the story has to match it."],
    ["Look at 34 add 20.",
     "Add means the amount grows, so the story needs something that makes it grow.",
     "Buys 20 more makes it grow. Gives away 20 makes it shrink."],
    ["The numbers are already decided for you.",
     "The only thing that can go wrong is what happens in the middle."],
    ["Pick who your story is about, then what happens to them."])),

 "coins-and-change": ("2Nm.02", (25, "+", 15, 40), ["Ali", "Kiki", "Hodan"], ("has 25 shillings", "shillings"),
   [("is given 15 more", True), ("spends 15", False), ("drops 15", False)],
   [("40", True), ("10", False), ("30", False)],
   (["A money story has to match its number sentence, just like any other."],
    ["Look at 25 add 15.",
     "Add means more money at the end, not less.",
     "Is given 15 more adds. Spends 15 takes away."],
    ["Spends and buys sound like doing something, so they feel like adding.",
     "They take money away."],
    ["Pick who has the money, then what happens to it."])),

 "fair-shares": ("2Nf.03", (12, "share", 2, 6), ["Amina", "Musa", "Kiki"], ("has 12 sweets", "sweets"),
   [("shares them equally between 2 friends", True), ("buys 2 more", False),
    ("eats 2 of them", False)],
   [("6", True), ("10", False), ("14", False)],
   (["Sharing has its own number sentence, and its own kind of story."],
    ["Look at 12 shared between 2.",
     "Sharing splits one amount into equal groups.",
     "Shares them equally between 2 friends splits it. Eats 2 does not."],
    ["Eating 2 and sharing between 2 both use the number 2.",
     "Only one of them makes equal groups."],
    ["Pick who has the sweets, then what they do with them."])),

 "patterns-that-grow": ("2Nc.04", (5, "repeat", 4, 20), ["Musa", "Hodan", "Ali"], ("saves 5 shillings every week", "shillings"),
   [("keeps saving for 4 weeks", True), ("saves for one week only", False),
    ("spends 5 every week", False)],
   [("20", True), ("9", False), ("25", False)],
   (["A pattern story repeats the same step, and says how many times."],
    ["Look at 5 four times.",
     "The same amount arrives again and again.",
     "Keeps saving for 4 weeks repeats it four times."],
    ["Saving for one week only uses the right number the wrong number of times.",
     "How many times is part of the sentence too."],
    ["Pick who is saving, then how the saving repeats."])),

 "sides-and-corners": ("2Gg.01", (12, "-", 5, 7), ["Kiki", "Ali", "Amina"], ("has 12 sticks", "sticks"),
   [("uses 5 to make a shape", True), ("finds 5 more", False), ("counts them twice", False)],
   [("7", True), ("17", False), ("5", False)],
   (["Take away has a story shape too, and it has to lose something."],
    ["Look at 12 take away 5.",
     "Take away means fewer at the end.",
     "Uses 5 to make a shape takes 5 of the sticks out of the pile."],
    ["Finds 5 more uses the right number and moves the wrong way.",
     "Check which way the amount travels before you choose."],
    ["Pick who has the sticks, then what happens to five of them."])),

 "which-way-from-here": ("2Gp.01", (3, "+", 2, 5), ["Musa", "Amina", "Ali"], ("walks 3 steps forward", "steps"),
   [("walks 2 more steps", True), ("turns around twice", False), ("walks back 2 steps", False)],
   [("5", True), ("1", False), ("3", False)],
   (["A story about moving still has to match its number sentence."],
    ["Look at 3 add 2.",
     "Add means the journey gets longer.",
     "Walks 2 more steps adds to it. Turning does not move you anywhere."],
    ["A turn feels like a move, so it is easy to count one.",
     "Only steps that take you somewhere count."],
    ["Pick who is walking, then what they do next."])),

 "how-much-how-long": ("2Gg.03", (9, "-", 6, 3), ["Hodan", "Kiki", "Musa"], ("has a ribbon 9 centimetres long", "centimetres"),
   [("cuts off 6 centimetres", True), ("finds a 6 centimetre piece", False),
    ("measures it twice", False)],
   [("3", True), ("15", False), ("6", False)],
   (["A measuring story matches a number sentence like any other story."],
    ["Look at 9 take away 6.",
     "Take away means the ribbon ends up shorter.",
     "Cuts off 6 centimetres makes it shorter by exactly 6."],
    ["Measuring it twice changes nothing at all.",
     "Something has to actually happen to the ribbon."],
    ["Pick who has the ribbon, then what they do to it."])),

 "half-past-quarter-to": ("2Gt.02", (30, "+", 30, 60), ["Amina", "Ali", "Hodan"], ("reads for 30 minutes", "minutes"),
   [("reads for 30 minutes more", True), ("stops for 30 minutes", False),
    ("reads it again quickly", False)],
   [("60", True), ("30", False), ("90", False)],
   (["Time can be added up in a story, the same way anything else can."],
    ["Look at 30 add 30.",
     "Two lots of 30 minutes make one whole hour.",
     "Reads for 30 minutes more adds the second half hour."],
    ["Stopping for 30 minutes also uses the number 30.",
     "It does not add to the reading time."],
    ["Pick who is reading, then what they do next."])),

 "count-it-chart-it": ("2Ss.02", (8, "-", 5, 3), ["Viti", "Amina", "Hodan"], ("counts 8 votes for mango", "votes"),
   [("counts 5 votes for banana", True), ("counts 5 more votes for mango", False),
    ("counts them all again", False)],
   [("3", True), ("13", False), ("5", False)],
   (["Comparing two counts is a take away, and its story needs both counts."],
    ["Look at 8 take away 5.",
     "How many more asks for the difference between the two.",
     "Counting 5 votes for banana gives the second amount to compare."],
    ["Counting 5 more for mango adds instead of comparing.",
     "The question is how many MORE, not how many altogether."],
    ["Pick who is counting, then what they count next."])),
}

OPWORD = {"+": "add", "-": "take away", "share": "shared between", "repeat": "four times"}


def lit(t):
    return '"' + t.replace("\\", "\\\\").replace('"', '\\"') + '"'


# ---- the spoken mini-lesson, to the same rules add-explain-scripts.py enforces
W1 = '<mstts:express-as style="calm" styledegree="1.15"><prosody rate="-8%">'
W2 = '<break time="330ms"/><mstts:express-as style="friendly" styledegree="1.25">'
W3 = ('<break time="330ms"/><mstts:express-as style="empathetic" styledegree="1.3">'
      '<prosody rate="-6%">')
W4 = '<break time="330ms"/><mstts:express-as style="cheerful" styledegree="1.45">'
CP, CE = "</prosody></mstts:express-as>", "</mstts:express-as>"
STRIPPED = ("elses", "oclock", "dont", "cant", "wont", "isnt", "doesnt", "didnt",
            "thats", "heres", "theres", "youre", "lets", "shes", "hes")


def build_explain(moves, where):
    j = lambda ss: "".join("<s>" + x + "</s>" for x in ss)
    sc = W1 + j(moves[0]) + CP + W2 + j(moves[1]) + CE + W3 + j(moves[2]) + CP \
        + W4 + j(moves[3]) + CE
    bad = []
    if "'" in sc:
        bad.append("apostrophe would close the attribute")
    for w in STRIPPED:
        if re.search(r"\b" + w + r"\b", sc.lower()):
            bad.append("stripped contraction %r would show in the caption" % w)
    if sc.count("<break") != 3:
        bad.append("%d breaks" % sc.count("<break"))
    if re.findall(r'style="(\w+)"', sc) != ["calm", "friendly", "empathetic", "cheerful"]:
        bad.append("move order")
    n = sc.count("<s>")
    if sc.count("</s>") != n:
        bad.append("unbalanced <s>")
    if not 5 <= n <= 9:
        bad.append("%d sentences" % n)
    if not 201 <= len(sc) <= 901:
        bad.append("%d characters" % len(sc))
    if bad:
        sys.exit("  REFUSED %s: %s" % (where, "; ".join(bad)))
    return sc


RUNNER = """
  /* ==== %s: make up a word problem that matches the number sentence ====
     Cambridge's own task ("make up a word problem to match a number sentence,
     for example, 70 + 30 = 100") and its own TWM skill for it, SPECIALISING -
     the child chooses an example and then checks it against the criteria.

     THREE PICKS, and only the middle one carries mathematics. Who the story is
     about cannot be wrong, so every option there is accepted; what HAPPENS can
     be wrong, because only an action matching the operation can match the
     sentence; and then the child solves the problem they have just written,
     which is markable because this composed it. Nothing here marks prose and
     nothing pretends to. */
  function buildStep(o) {
    const el = o.el, s = o.sentence;
    const picks = {};
    const stages = [
      { key: "who", ask: "Who is your story about?", opts: o.whos.map((w) => ({ t: w, ok: true })) },
      { key: "act", ask: "What happens next? Only one of these matches the number sentence.",
        opts: o.actions },
      { key: "ans", ask: "Now solve the problem you just wrote.", opts: o.solve },
    ];
    let i = 0, lock = true;
    const story = () => picks.who
      ? picks.who + " " + o.opening + ". Then " + picks.who + " "
        + (picks.act || "&hellip;") + ". " + o.question
      : "";
    function panel() {
      return '<p class="pb-sum">' + o.sentenceText + "</p>"
        + (picks.who ? '<p class="pb-story">' + story() + "</p>" : "");
    }
    function draw() {
      const st = stages[i];
      lock = true;
      el.next.hidden = true;
      el.say.innerHTML = st.ask;
      el.stage.innerHTML = panel();
      el.fb.className = "fb"; el.fb.textContent = "";
      el.score.textContent = "Step " + (i + 1) + " of " + stages.length;
      el.ch.innerHTML = shuffle(st.opts.slice()).map((c) => '<button type="button" '
        + 'class="choice ss-w" data-ok="' + (c.ok ? 1 : 0) + '">' + c.t + "</button>").join("");
      lock = false;
      say(String(st.ask).replace(/<[^>]*>/g, " "));
    }
    el.ch.addEventListener("click", (e) => {
      const b = e.target.closest("button.choice");
      if (!b || lock) return;
      const st = stages[i], ok = b.dataset.ok === "1";
      if (!ok) {
        el.fb.className = "fb bad";
        el.fb.textContent = o.wrong[st.key] || "Not that one. Read the number sentence again.";
        say(el.fb.textContent);
        return;
      }
      lock = true;
      picks[st.key] = b.textContent;
      el.stage.innerHTML = panel();
      el.fb.className = "fb good";
      el.fb.textContent = o.right[st.key] || "Yes.";
      say(el.fb.textContent);
      i++;
      if (i >= stages.length) { cheer(); finish(o.finish, o.done); return; }
      el.next.hidden = false;
    });
    el.next.addEventListener("click", draw);
    draw();
  }
"""

STYLE = """<style>/* %s - see add-problem-builder.py */
  .pb-sum { font-size: 30px; font-weight: 800; text-align: center; margin: 6px 0 10px;
    letter-spacing: .02em; }
  .pb-story { font-size: 18px; line-height: 1.5; text-align: center; margin: 0 auto;
    max-width: 30ch; padding: 10px 12px; border-radius: 10px;
    background: var(--cell, var(--card)); border: 1px solid var(--line, #ddd); }
</style>
""" % MARK

FINISH = "  function finish(i, msg)"

pages = sorted(f for f in os.listdir(HERE) if f.endswith(".html") and "review-pack" not in f)
todo, done, refused, skipped = [], 0, 0, 0
for f in pages:
    slug = f[:-5]
    if slug not in WORK:
        skipped += 1
        continue
    p = os.path.join(HERE, f)
    s = io.open(p, encoding="utf-8", newline="").read()
    if MARK in s:
        print("  already  %-26s" % f)
        done += 1
        continue

    code, (a, op, b, ans), whos, (opening, things), actions, solve, moves = WORK[slug]

    bad = []
    if sum(1 for _, ok in actions if ok) != 1:
        bad.append("actions must have exactly one match")
    if sum(1 for _, ok in solve if ok) != 1:
        bad.append("solve must have exactly one key")
    if max(a, b, ans) > CEILING:
        bad.append("over the Stage 2 ceiling of %d" % CEILING)
    if op == "+" and a + b != ans: bad.append("%d + %d is not %d" % (a, b, ans))
    if op == "-" and a - b != ans: bad.append("%d - %d is not %d" % (a, b, ans))
    if op == "share" and a // b != ans: bad.append("%d shared between %d is not %d" % (a, b, ans))
    if op == "repeat" and a * b != ans: bad.append("%d four times is not %d" % (a, ans))
    if str(ans) not in [t for t, ok in solve if ok]:
        bad.append("the solve key is not the answer the sentence gives")

    st = [m.start() for m in re.finditer(r'<section class="slide"', s)]
    chk = [i for i, x in enumerate(st)
           if '<span class="n">&#10003;</span>' in s[x:(st[i + 1] if i + 1 < len(st) else len(s))]
           or '<span class="n">✓</span>' in s[x:(st[i + 1] if i + 1 < len(st) else len(s))]]
    if len(chk) != 1:
        bad.append("found %d check slides, expected 1" % len(chk))
    nums = re.findall(r'<div class="slide-head"><span class="n">(\d+)</span>', s)
    if not nums:
        bad.append("no numbered steps")
    fm = re.search(r"const CHECK\s*=\s*\[[\s\S]*?finish\((\d+)", s)
    if not fm:
        bad.append("no CHECK array with a finish()")
    if bad:
        print("  REFUSED  %-26s %s" % (f, "; ".join(bad)))
        refused += 1
        continue

    at, fi = st[chk[0]], int(fm.group(1))
    n = max(int(x) for x in nums) + 1
    sid = "pb%d" % n
    explain = build_explain(moves, f)

    sent_text = {"+": "%d + %d = %d", "-": "%d &minus; %d = %d",
                 "share": "%d shared between %d = %d",
                 "repeat": "%d + %d + %d + %d = %d"}[op]
    sent_text = sent_text % ((a, a, a, a, ans) if op == "repeat" else (a, b, ans))
    question = {"tens-and-ones": "How many mangoes now?",
                "coins-and-change": "How many shillings now?",
                "fair-shares": "How many does each friend get?",
                "patterns-that-grow": "How many shillings altogether?",
                "sides-and-corners": "How many sticks are left?",
                "which-way-from-here": "How many steps altogether?",
                "how-much-how-long": "How many centimetres are left?",
                "half-past-quarter-to": "How many minutes altogether?",
                "count-it-chart-it": "How many more chose mango?"}[slug]

    slide = (
        '<!-- %d  %s  Make up a problem -->\n    '
        '<section class="slide" data-twm="specialising generalising" '
        'data-say="Here is a number sentence. Build a story that matches it, then solve it." '
        "data-explain='%s'>\n"
        '      <div class="slide-head"><span class="n">%d</span><h2>Make up a problem</h2></div>\n'
        '      <div class="say"><button type="button" class="speak" aria-label="Read it to me">'
        '&#128266;</button><span id="%ssay">Here is a number sentence. Build a story that '
        'matches it, then solve it.</span></div>\n'
        '      <div class="stage" id="%sst"></div>\n'
        '      <div class="choices" id="%sch"></div>\n'
        '      <p class="fb" id="%sfb" role="status" aria-live="polite"></p>\n'
        '      <div class="bigbtns"><button type="button" class="big small teal" id="%snx" hidden>'
        'Next</button></div>\n'
        '      <p class="score" id="%ssc"></p>\n'
        '    </section>\n    '
        % (n, code, explain, n, sid, sid, sid, sid, sid, sid))

    call = ("""
  /* ---- %d: make up a problem to match %s - specialising, Cambridge Stage 2 ---- */
  buildStep({
    el: { say: $("%ssay"), stage: $("%sst"), ch: $("%sch"), fb: $("%sfb"), score: $("%ssc"), next: $("%snx") },
    sentence: { a: %d, b: %d, ans: %d },
    sentenceText: %s,
    opening: %s,
    question: %s,
    whos: [%s],
    actions: [%s],
    solve: [%s],
    right: { who: "Good. Now what happens to them?", act: "That matches the number sentence.",
             ans: "That is the answer to your own problem." },
    wrong: { act: "That does not match the number sentence. Which way does the amount go?",
             ans: "Read your story again and work it out." },
    finish: %d,
    done: "You can write a word problem that matches a number sentence.",
  });
""" % (n, sent_text.replace("&minus;", "-"), sid, sid, sid, sid, sid, sid, a, b, ans,
       lit(sent_text), lit(opening), lit(question),
       ", ".join(lit(w) for w in whos),
       ", ".join("{ t: %s, ok: %s }" % (lit(t), "true" if ok else "false") for t, ok in actions),
       ", ".join("{ t: %s, ok: %s }" % (lit(t), "true" if ok else "false") for t, ok in solve),
       fi))

    out = s[:at] + slide + s[at:]
    ck = out.index("const CHECK")
    head, tail = out[:ck], out[ck:]
    if tail.count("finish(%d" % fi) != 1:
        print("  REFUSED  %-26s finish(%d) appears %d times from CHECK on, not once"
              % (f, fi, tail.count("finish(%d" % fi)))
        refused += 1
        continue
    out = head + tail.replace("finish(%d" % fi, "finish(%d" % (fi + 1), 1)
    ins = out.index(FINISH)
    runner = "" if RUNNER_MARK in out else (RUNNER % RUNNER_MARK).lstrip("\n")
    out = out[:ins] + runner + call.lstrip("\n") + out[ins:]
    out = out.rstrip() + "\n" + STYLE

    region = out[out.rindex("<script", 0, out.index("function buildStep")):
                 out.index("</script>", out.index("function buildStep"))]
    for nm in ("shuffle", "cheer", "say"):
        if not re.search(r"(?:function|const|let|var)\s+%s\b" % nm, region):
            bad.append("the runner landed in a script with no %s()" % nm)
    if out.count(MARK) != 1 or out.count("buildStep(") != 2:
        bad.append("marker %d, buildStep %d" % (out.count(MARK), out.count("buildStep(")))
    if bad:
        print("  REFUSED  %-26s %s" % (f, "; ".join(bad)))
        refused += 1
        continue

    todo.append((p, out))
    print("  would    %-26s step %-2d  %s  check moves finish(%d)->finish(%d)"
          % (f, n, sent_text.replace("&minus;", "-"), fi, fi + 1))

if WRITE:
    for p, out in todo:
        io.open(p, "w", encoding="utf-8", newline="").write(out)
print("")
print("  %d step(s) across %d lesson(s) %s, %d already done, %d without one, %d refused%s"
      % (len(todo), len(todo), "written" if WRITE else "to write", done, skipped, refused,
         "" if WRITE else "   (--write to apply)"))
