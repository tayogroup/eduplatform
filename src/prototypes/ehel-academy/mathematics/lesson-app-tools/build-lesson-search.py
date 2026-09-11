# -*- coding: utf-8 -*-
"""Derive a standalone lesson build's search index: lesson-search.json.

WHAT IS SEARCHABLE HERE IS NOT WHAT THE PAGE LOOKS LIKE. Measured on the live
Grade 1 Maths build, the static markup inside the 102 slides holds 9,363
characters of text in total - about 92 per slide - because these lessons BUILD
their exercises in JavaScript: a slide's markup is a heading and an empty
container, and the number line, the coins, the options and the feedback are
written into it at runtime. The teaching language lives in `data-explain`
(56k characters), the narration attribute, with `data-say` beside it.

So the index reads heading + visible body + narration, and the narration is
the bulk of it. Indexing the rendered DOM instead would need a browser;
indexing the markup alone would index the furniture and none of the teaching.

THE VOCABULARY GAP IS THE WHOLE REASON FOR `terms`. A parent or teacher types
the formal word; a Grade 1 lesson says the child's one. Measured over these
seven lessons, before expansion:

    "addition"     0 slides        "adding"      7 slides
    "subtraction"  1 slide         "take away"   3 slides

A search that only matched the literal text would answer "no results" to the
two words this feature was asked for. So each slide also carries `g`, the
formal terms its own words imply, worked out here at build time: the client
stays a plain matcher and the vocabulary decision sits in one reviewable
place, in data, next to the evidence for it.

PER SUBJECT, NEVER A WIDENED DEFAULT. `TERMS` is keyed by subject for the
reason `tools/lib/ehel-learner-voice.js` is: widening a shared word list
changes what an already-built subject produces. A subject with no map indexes
its literal text and SAYS SO on stdout, because a search that quietly stopped
expanding would look like working search with thin content.

A TAG THAT MATCHES EVERYTHING SAYS NOTHING. Every expansion is counted and
printed, and one landing on more than HALF the slides is refused: it would
rank every slide equally for that word, which is the same as having no index.

The output is a pure function of the lessons - no timestamps, sorted keys - so
`--check` re-derives it and byte-compares. A content change without a re-run
of this tool fails that, the way check:topic-index does for the shell.

    python ../lesson-app-tools/build-lesson-search.py            # write it
    python ../lesson-app-tools/build-lesson-search.py --check     # is it stale?

Idempotent.
"""
import html
import io
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _app import load  # noqa: E402

OUT = "lesson-search.json"

# The slide opening tag, quote-aware. A plain `<section class="slide"[^>]*>`
# is WRONG on these pages: data-explain carries SSML, so the attribute value
# itself contains `>` (`<mstts:express-as style="calm" styledegree="1.15">`)
# and the naive form stops inside the attribute. Same expression
# add-explanations.py uses.
OPEN = re.compile(r'<section class="slide"(?:[^>"\']|"[^"]*"|\'[^\']*\')*>')
SCRIPT = re.compile(r"<(script|style)\b.*?</\1>", re.S)
TAG = re.compile(r"<[^>]*>")
WS = re.compile(r"\s+")
SAY = re.compile(r'data-say="([^"]*)"')
EXPLAIN = re.compile(r"data-explain='([^']*)'")
H2 = re.compile(r"<h2[^>]*>(.*?)</h2>", re.S)

# Furniture, removed before the text is read. The step number and the Read-it
# -to-me speaker are chrome the learner does not search for, and they were
# landing at the FRONT of every result's snippet ("2 Taking away [speaker]
# Tap the counters..."), which is where the words that answer the query should
# be. The speaker is written both ways in these pages - the character and
# `&#128266;` - so it goes by its element, not by its glyph.
STEP_N = re.compile(r'<span class="n">.*?</span>', re.S)
SPEAK = re.compile(r'<button[^>]*class="speak"[^>]*>.*?</button>', re.S)
# The warm-up label. Its QUESTION is authored in JS (const WARM = [...]) and
# so is already gone with the scripts; what is left in the markup is the words
# "Warm up" and some empty containers, which landed at the front of step 1's
# snippet in every lesson. It is also a recap of the PREVIOUS lesson
# (add-warmup.py: "NOT a step"), so it is not what this step teaches.
WARM = re.compile(r'<p class="eh-warm-h">.*?</p>', re.S)

# Formal term -> the words these lessons actually use for it. Read off the
# content, not off a curriculum document: every phrase below was measured to
# occur in this subject's slide text. Add a subject by adding a key.
TERMS = {
    "mathematics": {
        "addition": ["adding", "add", "adds", "plus", "altogether",
                     "counting on", "count on", "number bond",
                     "pairs that make", "how many more make"],
        # NOT "fewer": it is comparison language here, and it sits in the
        # HEADING "More or fewer?" - which the heading tier then scored as
        # strong evidence of subtraction, tying with "Taking away" and
        # winning the tie on course order. So a search for "subtraction"
        # answered with a counting step first and the subtraction step
        # second. Moved to "comparison", where the lessons use it.
        "subtraction": ["take away", "taking away", "takes away", "minus",
                        "cross them out", "how many are left", "left over"],
        "multiplication": ["double", "doubles", "doubling", "twice",
                           "groups of", "in each group"],
        "division": ["share", "sharing", "fair share", "halve", "split",
                     "equal groups", "each person"],
        "fraction": ["half", "halves", "quarter", "quarters", "equal parts",
                     "one half", "a whole"],
        "place value": ["tens and ones", "how many tens", "digit"],
        "estimation": ["estimate", "guess how many", "about how many"],
        "odd and even": ["odd", "even number", "odd number", "partner"],
        # NO "counting" entry, and the first run of this tool is why: "count"
        # and "how many" reached 53 of 95 slides and the refusal below fired.
        # It is also the one term with nothing to bridge - these lessons say
        # "count" and "counting" themselves, so a learner typing either
        # matches the literal text and needs no tag. A tag earns its place
        # only where the formal word and the lesson's word differ.
        "sequence": ["pattern", "patterns", "repeat", "repeating",
                     "what comes next", "growing", "the part that repeats"],
        "geometry": ["shape", "shapes", "sides", "corners", "faces", "edges",
                     "flat", "solid", "circle", "square", "triangle",
                     "rectangle", "cube", "cylinder", "sphere"],
        # NOT "same on both sides": that sentence is how these lessons teach
        # the EQUALS SIGN ("The = sign means the same on both sides"), and it
        # was the only slide the term matched. A bridge to the wrong topic is
        # worse than none, because the learner cannot see why it answered.
        # Grade 1 teaches no symmetry, so this term is expected to match
        # nothing here and earns its place when the tool runs on Grade 2.
        "symmetry": ["symmetry", "symmetrical", "line of symmetry", "fold it"],
        "measurement": ["longer", "shorter", "taller", "heavier", "lighter",
                        "holds more", "measure", "measuring", "ruler",
                        "scales", "how long", "how heavy"],
        "time": ["clock", "o'clock", "half past", "hour", "the hands",
                 "days of the week", "month", "week", "year"],
        "money": ["coin", "coins", "price", "pay", "purse", "change",
                  "cost", "shilling"],
        "statistics": ["sort", "sorting", "chart", "block graph", "pictogram",
                       "tally", "ask everyone", "record the answers",
                       "fewest"],
        # bare "left" and "right" were measured on 18 and 22 of the 95 slides
        # and almost none of it was position: "left over", "the one on the
        # right", "That's right!". Same test as "counting" above - they are
        # also words a searcher types literally, so they need no bridge.
        "position": ["between", "next to", "above", "below", "half turn",
                     "quarter turn"],
        # "bigger" alone reached 19 slides ("bigger sums", "bigger number").
        # Dropped with "smaller" for the same reason: both are literal.
        "comparison": ["more than", "less than", "compare", "biggest",
                       "smallest", "in order", "more or fewer", "fewer"],
    },
}


def untag(s):
    # html.unescape, not a hand-kept list: these pages carry &#128266; as well
    # as the named forms, and a numeric entity the list did not know about
    # reached the index as the literal text "&#128266;" and was displayed that
    # way in the first results panel that ever rendered.
    s = html.unescape(TAG.sub(" ", s))
    # one apostrophe, so o'clock and o’clock are the same word to the matcher
    return WS.sub(" ", s.replace("’", "'")).strip()


def slides_of(page):
    """Every .slide chunk, each running to the next slide's opening tag.

    The LAST chunk is cut at its final </section>: without that it runs to the
    end of the file and swallows the page's own scripts, which measured as
    647k characters of "slide text" that was almost entirely JavaScript.
    """
    starts = [m.start() for m in OPEN.finditer(page)]
    out = []
    for k, a in enumerate(starts):
        b = starts[k + 1] if k + 1 < len(starts) else None
        chunk = page[a:b] if b else page[a:]
        if b is None:
            e = chunk.rfind("</section>")
            if e > 0:
                chunk = chunk[:e]
        out.append(chunk)
    return out


def read_slide(chunk):
    """(heading, searchable text) for one slide."""
    say = " ".join(SAY.findall(chunk))
    explain = " ".join(EXPLAIN.findall(chunk))
    m = H2.search(chunk)
    heading = untag(m.group(1)) if m else ""
    # the narration is read from the attributes FIRST, then removed, so the
    # body is the text a learner can see and nothing else
    rest = EXPLAIN.sub(" ", chunk)
    rest = SAY.sub(" ", rest)
    rest = WARM.sub(" ", SPEAK.sub(" ", STEP_N.sub(" ", SCRIPT.sub(" ", rest))))
    body = untag(rest)
    text = WS.sub(" ", " ".join([body, untag(say), untag(explain)])).strip()
    return heading, text


_WORDY = {}


def _phrase(w):
    """A phrase matcher that respects word edges.

    A plain `w in text` made "add" match inside other words and counted the
    tag on slides that never mention adding. Whole words only, but still a
    PREFIX-free match for multi-word phrases like "take away".
    """
    if w not in _WORDY:
        _WORDY[w] = re.compile(r"(?<!\w)" + re.escape(w) + r"(?!\w)")
    return _WORDY[w]


def tags_for(text, terms, counter=None):
    """(terms this text implies, and the phrase that implied each).

    The phrase is carried so the results panel can SHOW why a bridged term
    matched. Without it, searching "addition" highlighted nothing - the word
    is not in the content, which is the whole reason the bridge exists - and
    every expanded hit rendered with the step's opening words and no mark on
    them, which reads like a match the search could not justify.
    """
    hit = []
    why = {}
    low = text.lower()
    for formal, words in sorted(terms.items()):
        for w in words:
            if _phrase(w).search(low):
                hit.append(formal)
                why[formal] = w
                if counter is not None:
                    counter[formal] = counter.get(formal, 0) + 1
                break
    return hit, why


def build(app):
    terms = TERMS.get(app.subject, {})
    counter = {}
    lessons = []
    total = skipped = 0
    for unit, name, title in app.lessons:
        page = app.read(name)
        chunks = slides_of(page)
        if not chunks:
            sys.exit("  REFUSED %s has no .slide sections" % name)
        steps = []
        # the last slide is the sticker page - "The end" in show(), and
        # earnable = slides.length - 1 everywhere else. It teaches nothing, so
        # indexing it would put "My stickers" in the results of every search
        # that happened to match its congratulation line.
        for i, chunk in enumerate(chunks[:-1]):
            heading, text = read_slide(chunk)
            if not heading and not text:
                skipped += 1
                continue
            # TWO tag fields, because the ranking needs to tell them apart.
            # With one, every slide the term touched scored the same, so
            # "addition" answered with "Count to 10" above every step of
            # Adding and Taking Away - the tie was broken by course order and
            # the lesson actually about adding came 8th. A term implied by the
            # HEADING is about the whole step; one implied by a sentence
            # inside it is a mention.
            head_tags, _ = tags_for(heading, terms)
            all_tags, why = tags_for(heading + " " + text, terms, counter)
            steps.append({
                "i": i,
                "h": heading,
                "t": text,
                "gh": " ".join(head_tags),
                "g": " ".join(all_tags),
                "gm": why,
            })
            total += 1
        lessons.append({"u": unit, "file": name, "title": title, "steps": steps})
    doc = {
        "subject": app.subject,
        "subjectLabel": app.subject_label,
        "grade": app.grade,
        "gradeLabel": app.grade_label,
        "fromParam": app.from_param,
        "lessons": lessons,
    }
    return doc, counter, total, skipped


def main():
    app = load()
    check = "--check" in sys.argv[1:]
    for a in sys.argv[1:]:
        if a not in ("--check", "--app") and not os.path.isdir(a):
            sys.exit("  REFUSED unknown argument %r (did you mean --check?)" % a)

    print("\n  Search index for %s %s\n" % (app.subject_label, app.grade_label))
    doc, counter, total, skipped = build(app)
    if not TERMS.get(app.subject):
        print("  NOTE: no term map for %r. The index carries the lessons' own\n"
              "        words only, so a formal word the lessons never say\n"
              "        ('addition' where they say 'adding') will find nothing.\n"
              % app.subject)

    # a tag on more than half the slides ranks every slide the same for that
    # word, which is indistinguishable from having no tag at all
    loud = [(k, v) for k, v in counter.items() if total and v > total / 2]
    if loud:
        print("  REFUSED these terms match more than half of the %d slides:" % total)
        for k, v in sorted(loud, key=lambda x: -x[1]):
            print("    %-14s %d slides" % (k, v))
        print("\n  Narrow their phrases in TERMS[%r].\n" % app.subject)
        sys.exit(1)

    text = json.dumps(doc, ensure_ascii=False, sort_keys=True, indent=1) + "\n"
    path = app.path(OUT)
    old = io.open(path, encoding="utf-8").read() if os.path.isfile(path) else None

    for l in doc["lessons"]:
        print("  %-32s %2d step(s) indexed" % (l["file"], len(l["steps"])))
    print("\n  %d slides indexed, %d characters" % (total, sum(
        len(s["t"]) for l in doc["lessons"] for s in l["steps"])))
    if skipped:
        print("  %d slide(s) had no heading and no text" % skipped)
    print("  %d term expansions: %s" % (
        sum(counter.values()),
        ", ".join("%s %d" % (k, v) for k, v in sorted(counter.items()))))
    # a term this grade does not teach is a legitimate zero - Grade 1 has no
    # symmetry - but it has to be VISIBLE, or a map that quietly stopped
    # matching reads exactly like a grade that never covered the topic
    silent = sorted(set(TERMS.get(app.subject, {})) - set(counter))
    if silent:
        print("  matched nothing here (literal text only): %s" % ", ".join(silent))

    if check:
        if old is None:
            print("\n  STALE: %s does not exist. Run without --check.\n" % OUT)
            sys.exit(1)
        if old != text:
            print("\n  STALE: %s does not match the lessons on disk.\n"
                  "  Re-run without --check and commit the result.\n" % OUT)
            sys.exit(1)
        print("\n  %s is current.\n" % OUT)
        sys.exit(0)

    app.write(OUT, text)
    print("\n  wrote %s (%d bytes)%s\n"
          % (OUT, len(text.encode("utf-8")),
             "" if old is None else (" - unchanged" if old == text else " - updated")))


main()
