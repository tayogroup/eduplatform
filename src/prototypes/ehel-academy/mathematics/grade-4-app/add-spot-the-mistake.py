# -*- coding: utf-8 -*-
"""Stage 4's own learner errors, as a step that asks the child to diagnose one.

    python add-spot-the-mistake.py            # report
    python add-spot-the-mistake.py --write

ASKING IN STAGE 3'S VOCABULARY WOULD HAVE UNDER-BUILT THIS, and that is the
finding worth keeping. Stage 4 is a different book series, and it names learner
errors differently:

    "misconception"      Stage 3: 7, one of them past the front matter
                         Stage 4: 11, EIGHT of them front matter on pp.19-23,
                                  where the Guide describes its own pedagogy
                                  and says nothing about any mathematics

Four usable notes, on that reading - not enough for a feature. Asked in Stage
4's own words instead, past the introduction: confuse 5, confusion 5, error 5,
look out for 4, incorrectly 3, misconception 4, tend to 1. Twenty-odd notes,
and the fourteen below are the ones specific enough to mark with three buttons.

SEVEN OF EIGHT LESSONS. Asking, Sorting and Chance has no error note anywhere in
Stage 4 that this could use, so it gets no step and the report says NO_SOURCE
rather than inventing one - the same way five Grade 3 lessons went without.

NOTHING HERE IS QUOTED. Stage 4's OCR is materially worse than Stage 3's - 19.3%
of lines are one or two characters against 11.8%, and word order is destroyed in
places ("misconceptions mistakes that and them quickly or common arise acting
upon"). Every item is therefore written in this build's own voice with the
Guide's page cited, and no sentence is put in Cambridge's mouth.

EVERY KEY IS CHECKED BY ARITHMETIC, per this subject's rule that answers are
verified by computing them rather than by provenance:

    437 + 246 = 683, which is odd     so 684 is wrong, and parity is the tell
    2.5 x 10 = 25                     not 2.50
    0 x 10 = 0                        so a "multiply by 10" chain from 0 stays 0
    one eighth is 1 / 8               not 8 / 1
    15:00 to 15:45 is 45 minutes      not 3 hours 45
    1 January to 3 January is 2 days  though counting the dates gives 3

THE STICKER IS INSERTED HERE, not left to a repair tool. The shelf is positional
- STICKERS[i] is bound to done[i] and nothing else links them - so a tool that
adds a step and not a sticker silently re-points every sticker after it. Six
tools across Grades 2 and 3 did exactly that; see lesson-app-tools/
fix-sticker-shelf.py, which is now the audit rather than the fixer.
"""
import io, os, re, sys

sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))
WRITE = "--write" in sys.argv[1:]
for a in sys.argv[1:]:
    if a != "--write":
        sys.exit("unrecognised argument: %s" % a)

MARK = "ehel-g4-spot"
STICKER = ("\U0001F50D", "Spot the mistake")

# lesson -> [(what the child said, [(option, ok)], why, Guide page)]
WORK = {
 "big-numbers-below-zero": [
   ("Amina says: negative 5 is bigger than negative 2, because 5 is bigger than 2.",
    [("She compared the digits and ignored the minus sign", True),
     ("She is right, negative 5 is bigger", False),
     ("You cannot compare two negative numbers", False)],
    "On a number line negative 5 sits further left than negative 2, so it is SMALLER. "
    "The further left you go, the smaller the number.  (Teacher's Guide p27)"),
   ("Sami reads the number -10 out loud as \"minus ten\".",
    [("\"Minus\" is the operation, so this sounds like subtract ten", True),
     ("He should say \"less ten\"", False),
     ("Nothing is wrong, minus and negative are the same word", False)],
    "Say \"negative ten\". Minus is what you DO to a number; negative is what the "
    "number IS.  (Teacher's Guide p27)"),
 ],
 "patterns-and-squares": [
   ("The rule is multiply by 10. The first term is 0. Hodan writes 0, 10, 100, 1000.",
    [("0 x 10 is 0, so every term stays 0", True),
     ("She should have added 10 each time", False),
     ("The rule cannot start at 0", False)],
    "Multiplying 0 by 10 gives 0, so the sequence is 0, 0, 0, 0. Hodan applied the "
    "rule to the position, not to the term before.  (Teacher's Guide p111)"),
 ],
 "ways-to-calculate": [
   ("Yusuf works out 437 + 246 and writes 684.",
    [("Odd plus even is odd, so the answer cannot end in 4", True),
     ("He forgot to regroup the hundreds", False),
     ("Nothing is wrong, 684 is correct", False)],
    "437 is odd and 246 is even, so the total must be ODD. 684 is even, so it is "
    "wrong before you check a single column. The answer is 683. "
    " (Ready to Go p51)"),
   ("Layla says: to multiply by 10 you just add a zero. So 2.5 x 10 = 2.50",
    [("Adding a zero changes nothing here - every digit moves one column left", True),
     ("She should add two zeros", False),
     ("2.50 is correct", False)],
    "2.50 is the same number as 2.5. Multiplying by 10 moves every digit one place "
    "to the left, so 2.5 x 10 = 25.  (Teacher's Guide p171)"),
 ],
 "parts-of-a-whole": [
   ("Omar writes one eighth as the division 8 divided by 1.",
    [("He has the numerator and denominator the wrong way round", True),
     ("One eighth cannot be written as a division", False),
     ("8 divided by 1 is right, it equals 8", False)],
    "One eighth means one whole shared into 8, so it is 1 divided by 8. The top "
    "number is what is shared and the bottom is how many shares. "
    " (Teacher's Guide p130)"),
 ],
 "telling-the-time": [
   ("In a race, Ayaan sees that Salma scored the highest time and says she won.",
    [("In a timed race the LOWEST time wins", True),
     ("The highest time always wins", False),
     ("You cannot tell who won from times", False)],
    "In a game the highest score usually wins, but a race is timed, so the fastest "
    "runner has the smallest number.  (Teacher's Guide p182)"),
   ("An art lesson runs from 15:00 to 15:45. Kai says it lasted 3 hours 45 minutes.",
    [("He read the clock time as a duration", True),
     ("He should have said 15 hours 45 minutes", False),
     ("3 hours 45 minutes is right", False)],
    "15:00 and 15:45 are both times of day. The lesson is the gap between them, "
    "which is 45 minutes.  (Teacher's Guide p183)"),
   ("Nadia counts 1 January, 2 January, 3 January and says that is 3 days.",
    [("She counted the dates, not the gaps between them", True),
     ("She should have counted 4 days", False),
     ("3 days is right", False)],
    "From 1 January to 3 January is 2 days. Counting dates gives you one more than "
    "the duration, every time.  (Teacher's Guide p185)"),
 ],
 "shape-and-measures": [
   ("A rectangle covers 12 squares on a grid. Zara says its perimeter is 12.",
    [("She has found the area, not the perimeter", True),
     ("The perimeter of any rectangle is always 12", False),
     ("12 is right, she counted correctly", False)],
    "Perimeter is the distance all the way ROUND the edge. The squares inside are "
    "the area. They are different measurements of the same shape. "
    " (Teacher's Guide p45)"),
   ("A line is drawn across a shape and Idris says it is a line of symmetry because "
    "it looks right.",
    [("Fold the shape along the line and see if the halves match", True),
     ("If it looks right then it is right", False),
     ("Only vertical lines can be lines of symmetry", False)],
    "A line that looks correct at a glance can be wrong on closer inspection. "
    "Folding is the test.  (Teacher's Guide p121)"),
   ("A shape is reflected, but the reflection is drawn much closer to the mirror "
    "line than the shape is.",
    [("Every point must be the same distance the other side of the line", True),
     ("A reflection is always drawn closer to the mirror", False),
     ("The reflection should be a different size", False)],
    "A reflection keeps the shape and size, and every corner sits the same distance "
    "from the mirror line as the one it came from.  (Teacher's Guide p201)"),
 ],
 "where-things-are": [
   ("Dahir sees a car symbol on a map and says it marks the car park, without "
    "looking at the key.",
    [("A symbol means whatever the key says it means", True),
     ("A car symbol always means car park", False),
     ("Maps do not need a key", False)],
    "The key tells you what each symbol stands for. A car might mark a garage, a "
    "road or a car hire place.  (Teacher's Guide p142)"),
   ("A dot sits at (3, 5). Marwa writes its position as (5, 3).",
    [("Coordinates say how far ALONG first, then how far UP", True),
     ("(5, 3) and (3, 5) are the same point", False),
     ("She should have written (3, 3)", False)],
    "Always read across before up. (5, 3) is a different point from (3, 5). "
    " (Teacher's Guide p145)"),
 ],
}

# ---- audits -------------------------------------------------------------------
for lesson, items in WORK.items():
    for said, opts, why in ((i[0], i[1], i[2]) for i in WORK[lesson]):
        if len(opts) != 3:
            sys.exit("  REFUSED %s: wants 3 options, got %d" % (lesson, len(opts)))
        if sum(1 for _, ok in opts if ok) != 1:
            sys.exit("  REFUSED %s: wants exactly one key" % lesson)
        if not re.search(r"\(Teacher's Guide p\d+\)|\(Ready to Go p\d+\)", why):
            sys.exit("  REFUSED %s: every item cites the page it came from - %r"
                     % (lesson, why[-40:]))


def lit(t):
    return '"' + t.replace("\\", "\\\\").replace('"', '\\"') + '"'


RUNNER = """
  /* ==== %s: Stage 4's own learner errors ====
     The child reads what somebody said, works it out, and says what went
     wrong - not whether it is wrong. Every item is a note from the Stage 4
     Teacher's Guide or Ready to Go, written in this build's voice because
     that book's OCR cannot be quoted safely, with the page on the answer.

     SLOT is derived from the DOM rather than written in, so inserting a step
     before this one cannot silently re-point it. */
  (function () {
    const host = document.getElementById("smG");
    if (!host) return;
    const SLOT = [...document.querySelectorAll(".slide")].indexOf(host.closest(".slide"));
    const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
    const ITEMS = %s;
    let at = 0, live = false, got = 0;
    function paint() {
      const it = ITEMS[at];
      /* The spoken bar carries the INSTRUCTION and the quote box carries the
         claim. Setting both to it.said printed the same sentence twice, one
         above the other - caught by looking at the screenshot, not by the
         drive, which passed on the duplicated page. */
      document.getElementById("sayG").textContent =
        "Read what they said, then work it out yourself. What went wrong?";
      document.getElementById("clG").textContent = it.said;
      document.getElementById("chG").innerHTML = shuffle(it.opts.slice())
        .map((o) => '<button type="button" class="choice word" data-ok="' + (o.ok ? 1 : 0)
          + '">' + esc(o.t) + "</button>").join("");
      document.getElementById("fbG").className = "fb";
      document.getElementById("fbG").textContent = "";
      document.getElementById("scG").textContent =
        "Mistake " + (at + 1) + " of " + ITEMS.length;
      live = true;
    }
    document.getElementById("chG").addEventListener("click", (e) => {
      const b = e.target.closest(".choice");
      if (!b || !live) return;
      live = false;
      const it = ITEMS[at], ok = b.dataset.ok === "1";
      [...document.getElementById("chG").querySelectorAll(".choice")].forEach((x) => {
        x.disabled = true;
        if (x.dataset.ok === "1") x.classList.add("right");
      });
      if (!ok) b.classList.add("wrong");
      const fb = document.getElementById("fbG");
      fb.className = "fb " + (ok ? "good" : "");
      fb.textContent = (ok ? cheer() + " " : "Not quite. ") + it.why;
      say(ok ? cheer() : it.why);
      if (ok) got += 1;
      at += 1;
      if (at < ITEMS.length) { later(paint, 3800); }
      else {
        document.getElementById("scG").textContent =
          got + " of " + ITEMS.length + " found";
        finish(SLOT, "You can find what went wrong and say why.");
      }
    });
    paint();
  })();
"""

STYLE = """<style>/* %s - see add-spot-the-mistake.py */
  #clG { display: block; margin: 10px auto 2px; max-width: 42ch; font-size: 15px;
    line-height: 1.5; padding: 10px 13px; border-radius: 12px;
    background: var(--card, #fff); border: 1px solid var(--line, #ddd); }
  #scG { font-size: 12px; letter-spacing: .05em; text-transform: uppercase;
    color: var(--muted, #666); }
</style>
""" % MARK

EXPLAIN = ('<mstts:express-as style="calm" styledegree="1.15"><prosody rate="-8%">'
           "<s>Finding a mistake is a different job from getting the answer right.</s>"
           "</prosody></mstts:express-as>"
           '<break time="330ms"/><mstts:express-as style="friendly" styledegree="1.25">'
           "<s>Read what the child said.</s><s>Work it out yourself first.</s>"
           "<s>Then say what went wrong, not just that it is wrong.</s>"
           "</mstts:express-as>"
           '<break time="330ms"/><mstts:express-as style="empathetic" styledegree="1.3">'
           '<prosody rate="-6%"><s>These are real mistakes that real children make.</s>'
           "<s>If you have made one of them, you are in good company.</s></prosody>"
           "</mstts:express-as>"
           '<break time="330ms"/><mstts:express-as style="cheerful" styledegree="1.45">'
           "<s>See if you can catch each one.</s></mstts:express-as>")


def shelf_span(s):
    i = s.find("const STICKERS")
    if i < 0:
        return None
    i = s.find("[", i)
    depth, j, instr, esc_, quote = 0, i, False, False, ""
    while j < len(s):
        c = s[j]
        if instr:
            if esc_:
                esc_ = False
            elif c == "\\":
                esc_ = True
            elif c == quote:
                instr = False
        elif c in "\"'":
            instr, quote = True, c
        elif c == "[":
            depth += 1
        elif c == "]":
            depth -= 1
            if depth == 0:
                return i, j
        j += 1
    return None


def entries(body):
    out, d, start, instr, esc_, quote = [], 0, None, False, False, ""
    for k, c in enumerate(body):
        if instr:
            if esc_:
                esc_ = False
            elif c == "\\":
                esc_ = True
            elif c == quote:
                instr = False
            continue
        if c in "\"'":
            instr, quote = True, c
        elif c == "[":
            if d == 0:
                start = k
            d += 1
        elif c == "]":
            d -= 1
            if d == 0:
                out.append(body[start:k + 1])
    return out


pages = sorted(f for f in os.listdir(HERE)
               if f.endswith(".html") and not re.search(r"index|review-pack|audit|^_|-body\.html$", f))
todo, done, refused, nosrc, total = [], 0, 0, 0, 0
for f in pages:
    slug = f[:-5]
    p = os.path.join(HERE, f)
    s = io.open(p, encoding="utf-8", newline="").read()
    if slug not in WORK:
        if "<section class=\"slide\"" in s:
            print("  no source  %-26s Stage 4 names no error this could use" % slug)
            nosrc += 1
        continue
    if MARK in s:
        print("  already    %-26s" % slug)
        done += 1
        continue

    bad = []
    for nm in ("shuffle", "cheer", "say", "later", "finish"):
        if not re.search(r"(?:function|const|let|var)\s+%s\b" % nm, s):
            bad.append("no %s()" % nm)
    st = [m.start() for m in re.finditer(r'<section class="slide"', s)]
    chk = [i for i, x in enumerate(st)
           if re.search(r'<span class="n">(&#10003;|✓)</span>',
                        s[x:(st[i + 1] if i + 1 < len(st) else len(s))])]
    if len(chk) != 1:
        bad.append("%d check slides" % len(chk))
    anchor = "  show(0, false);"
    if s.count(anchor) != 1:
        bad.append("show(0,false) x%d" % s.count(anchor))
    sp = shelf_span(s)
    if not sp:
        bad.append("no STICKERS shelf")
    if bad:
        print("  REFUSED    %-26s %s" % (slug, "; ".join(bad)))
        refused += 1
        continue

    at = st[chk[0]]
    before = len([x for x in st if x < at])
    n = max(int(x) for x in re.findall(
        r'<div class="slide-head"><span class="n">(\d+)</span>', s)) + 1
    shifted = []

    def bump(m):
        i = int(m.group(1))
        if i >= before:
            shifted.append(i)
            return "finish(%d" % (i + 1)
        return m.group(0)

    items = ", ".join(
        "{ said: %s, why: %s, opts: [%s] }"
        % (lit(said), lit(why),
           ", ".join("{ t: %s, ok: %s }" % (lit(o), "true" if ok else "false")
                     for o, ok in opts))
        for said, opts, why in WORK[slug])

    slide = (
        '<!-- %d  Spot the mistake  (Stage 4 Teacher\'s Guide / Ready to Go) -->\n    '
        '<section class="slide" data-twm="critiquing improving" '
        'data-say="Read what the child said. Work it out yourself. Then tap what went wrong." '
        "data-explain='%s'>\n"
        '      <div class="slide-head"><span class="n">%d</span><h2>Spot the mistake</h2></div>\n'
        '      <div class="say"><button type="button" class="speak" aria-label="Read it to me">'
        '&#128266;</button><span id="sayG"></span></div>\n'
        '      <div id="smG"><span id="clG"></span></div>\n'
        '      <div class="choices" id="chG"></div>\n'
        '      <p class="fb" id="fbG" role="status" aria-live="polite"></p>\n'
        '      <p class="score" id="scG"></p>\n'
        '    </section>\n    ' % (n, EXPLAIN, n))

    out = s[:at] + slide + s[at:]
    out = re.sub(r"finish\((\d+)", bump, out)
    out = out.replace(anchor, (RUNNER % (MARK, "[" + items + "]")).lstrip("\n")
                      + "\n" + anchor, 1)

    # the sticker, at the index of the step it belongs to
    sp2 = shelf_span(out)
    body = out[sp2[0] + 1:sp2[1]]
    ent = entries(body)
    ent.insert(before, '["%s", "%s"]' % STICKER)
    if "\n" in body.strip():
        lines = ["    " + ", ".join(ent[k:k + 4]) + ("," if k + 4 < len(ent) else "")
                 for k in range(0, len(ent), 4)]
        new_body = "\n" + "\n".join(lines) + "\n  "
    else:
        new_body = ", ".join(ent)
    out = out[:sp2[0] + 1] + new_body + out[sp2[1]:]

    steps = out.count('<section class="slide"') - 1
    sp3 = shelf_span(out)
    got = entries(out[sp3[0] + 1:sp3[1]])
    if len(got) != steps:
        print("  REFUSED    %-26s shelf %d for %d steps after the insert"
              % (slug, len(got), steps))
        refused += 1
        continue
    if STICKER[1] not in got[before]:
        print("  REFUSED    %-26s the sticker did not land on the new step" % slug)
        refused += 1
        continue
    out = out.rstrip() + "\n" + STYLE
    if out.count(MARK) != 2:
        print("  REFUSED    %-26s marker count %d" % (slug, out.count(MARK)))
        refused += 1
        continue

    todo.append((p, out))
    total += len(WORK[slug])
    print("  would      %-26s step %-2d  %d item(s)  sticker at %d  finish shifted: %s"
          % (slug, n, len(WORK[slug]), before, shifted or "none"))

if WRITE:
    for p, out in todo:
        io.open(p, "w", encoding="utf-8", newline="").write(out)
print("")
print("  %d item(s) across %d lesson(s) %s, %d already done, %d with no source, %d refused%s"
      % (total, len(todo), "written" if WRITE else "to write", done, nosrc, refused,
         "" if WRITE else "   (--write to apply)"))
