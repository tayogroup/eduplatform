# -*- coding: utf-8 -*-
"""Math Words, on the sticker shelf - the same gap the Grade 4 build closed,
now closed at Stage 1, the thin end of it.

    python add-vocabulary.py            # report
    python add-vocabulary.py --write

WHY HERE, AND WHY THIS SHAPE. Cambridge's own vocabulary is thin at Stage
1-2 (a one-or-two-word "Maths words" box per page) and becomes a real A-Z
glossary from Stage 3 - full worked definitions, not just a word list. This
build had neither: no glossary, no word card, no dictionary link, at any of
the four grades, confirmed by direct search. Following add-self-check.py's
own precedent exactly - the same insertion point (the sticker-shelf slide,
via an empty host div populated by its own small script, no renumbering, no
sticker-shelf math, no new finish() call) - because that is the lowest-risk
place in this deck to add reference content a child revisits rather than
answers once.

WORDS ACTUALLY USED IN THIS LESSON, not a generic Stage 1 list lifted from
the syllabus. Each term below is one this lesson's own steps use un-defined
- check the lesson's own text before trusting this comment if the lesson is
ever rewritten. Stage 1 vocabulary is much simpler than Stage 4's: Cambridge's
own Stage 1 box is a one-or-two-word list per page, not full sentences, so
the definitions here are short, concrete, one-sentence explanations pitched
at a six-year-old, not the fuller worked definitions the Grade 4 build used.

NEVER A SCORE, matching self-check: nothing here is asked, nothing is
marked, and opening or not opening it changes no progress.
"""
import io, os, re, sys

sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))
WRITE = "--write" in sys.argv[1:]
for a in sys.argv[1:]:
    if a != "--write":
        sys.exit("unrecognised argument: %s" % a)

MARK = "ehel-g1-vocabulary"
HEAD = ("Math Words", "Words from this lesson, explained in one line each.")

# lesson -> [(term, definition)]
WORK = {
 "adding-and-taking-away": [
  ("add", "Put two groups together to find out how many there are altogether."),
  ("take away", "Start with a group and remove some of it."),
  ("double", "The same amount again, like 3 and 3 more."),
  ("number bond", "Two numbers that add together to make ten."),
  ("count back", "Start at a number and count backwards to take some away."),
  ("shilling", "The money we count in. We write it as sh for short."),
 ],
 "asking-and-sorting": [
  ("table", "A short way to write answers down, with a number next to each one."),
  ("block graph", "Towers of blocks. Each block stands for one answer."),
  ("pictogram", "Like a block graph, but with a little picture instead of a block."),
  ("Venn diagram", "Two hoops that cross over, for sorting things by two rules at once."),
  ("Carroll diagram", "Four boxes for sorting things by two rules, using yes and no."),
  ("hoop", "A ring that holds everything which follows one rule."),
 ],
 "counting-to-twenty": [
  ("odd number", "A number that always has one left over when you pair it up."),
  ("even number", "A number that pairs up exactly, with nobody left out."),
  ("zero", "The number for none at all."),
  ("ordinal number", "A number that says where something is in a line, like first or second."),
  ("estimate", "A sensible guess you make before you count."),
  ("number line", "A line of numbers in order, so you can see which one is bigger."),
 ],
 "days-months-and-clocks": [
  ("hour hand", "The short hand on a clock. It tells you the hour."),
  ("minute hand", "The long hand on a clock. It tells you how far through the hour you are."),
  ("o'clock", "When the long hand points straight up to twelve."),
  ("half past", "When the long hand points straight down to six."),
  ("week", "Seven days, from Monday round to Sunday."),
  ("year", "Twelve months, from January to December."),
 ],
 "halves-and-wholes": [
  ("equal", "Exactly the same size, not just nearly the same."),
  ("half", "One of two equal parts."),
  ("whole", "All of a shape, with no parts missing or taken away."),
  ("share", "Give things out so that everyone gets the same amount."),
  ("fair", "The same for everyone, like two parts the same size."),
  ("halve", "Find half of a number or a shape."),
 ],
 "shapes-and-sizes": [
  ("side", "A straight or curved edge of a flat shape."),
  ("corner", "The point where two sides of a shape meet."),
  ("face", "A flat surface on a solid shape."),
  ("edge", "The line where two faces of a solid shape meet."),
  ("capacity", "How much a container can hold."),
  ("balance", "A tool that shows which of two things is heavier."),
 ],
 "what-comes-next": [
  ("pattern", "Something that happens again and again in the same order."),
  ("repeat", "Do the same small part over and over again."),
  ("jump pattern", "A pattern where the numbers go up by the same amount each time."),
  ("equals sign", "Means both sides have the same amount, not \"here comes the answer\"."),
  ("number machine", "Something that does the same thing to every number that goes in."),
  ("growing pattern", "A pattern where each part gets bigger by the same amount every time."),
 ],
}


def lit(t):
    return '"' + t.replace("\\", "\\\\").replace('"', '\\"') + '"'


def js(lesson, items):
    rows = ", ".join("{ w: %s, d: %s }" % (lit(w), lit(d)) for w, d in items)
    return ('\n  /* ==== ' + MARK + ': Math Words for this lesson ====\n'
            '     Same insertion pattern as add-self-check.py: an empty host div on\n'
            '     the sticker-shelf slide, populated by this script, never scored. */\n'
            '  (function () {\n'
            '    const VOCAB = [' + rows + '];\n'
            '    const host = document.getElementById("vocab");\n'
            '    if (!host) return;\n'
            '    const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;")\n'
            '      .replace(/"/g, "&quot;");\n'
            '    host.innerHTML = \'<p class="vc-head">' + HEAD[0] + '</p>\'\n'
            '      + \'<p class="vc-sub">' + HEAD[1] + '</p>\'\n'
            '      + \'<dl class="vc-list">\'\n'
            '      + VOCAB.map((it) => \'<div class="vc-row"><dt>\' + esc(it.w) + \'</dt><dd>\'\n'
            '        + esc(it.d) + "</dd></div>").join("")\n'
            '      + "</dl>";\n'
            '  })();\n\n')


STYLE = """<style>/* %s - see add-vocabulary.py */
  #vocab { margin: 18px auto 0; max-width: 46ch; text-align: left; }
  .vc-head { font-size: 17px; font-weight: 700; margin: 0 0 4px; }
  .vc-sub { font-size: 13.5px; color: var(--muted, #666); margin: 0 0 12px; line-height: 1.5; }
  .vc-list { margin: 0; }
  .vc-row { padding: 9px 0; border-top: 1px solid var(--line, #ddd); }
  .vc-row dt { margin: 0 0 3px; font-size: 15px; font-weight: 700; }
  .vc-row dd { margin: 0; font-size: 14px; line-height: 1.45; color: var(--ink, #222); }
</style>
""" % MARK

pages = sorted(f for f in os.listdir(HERE)
               if f.endswith(".html") and not re.search(r"index|review-pack|audit|^_|-body\.html$", f))
todo, done, refused, total = [], 0, 0, 0
for f in pages:
    slug = f[:-5]
    if slug not in WORK:
        continue
    p = os.path.join(HERE, f)
    s = io.open(p, encoding="utf-8", newline="").read()
    if MARK in s:
        print("  already    %-26s" % slug)
        done += 1
        continue

    m = re.search(r'(<div[^>]*id="selfcheck"[^>]*>\s*</div>)', s)
    if not m:
        print("  REFUSED    %-26s no self-check host to sit after (add-self-check.py runs first)" % slug)
        refused += 1
        continue
    anchor = "  show(0, false);"
    if s.count(anchor) != 1:
        print("  REFUSED    %-26s show(0,false) x%d" % (slug, s.count(anchor)))
        refused += 1
        continue

    items = WORK[slug]
    out = s[:m.end()] + '\n      <div id="vocab"></div>' + s[m.end():]
    out = out.replace(anchor, js(slug, items) + anchor, 1)
    out = out.rstrip() + "\n" + STYLE
    if out.count(MARK) != 2 or out.count('id="vocab"') != 1:
        print("  REFUSED    %-26s marker %d, host %d"
              % (slug, out.count(MARK), out.count('id="vocab"')))
        refused += 1
        continue

    todo.append((p, out))
    total += len(items)
    print("  would      %-26s %2d word(s)" % (slug, len(items)))

if WRITE:
    for p, out in todo:
        io.open(p, "w", encoding="utf-8", newline="").write(out)
print("")
print("  %d word(s) across %d lesson(s) %s, %d already done, %d refused%s"
      % (total, len(todo), "written" if WRITE else "to write", done, refused,
         "" if WRITE else "   (--write to apply)"))
