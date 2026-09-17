# -*- coding: utf-8 -*-
"""The two things Cambridge hands a teacher and this course did not: misconceptions, and a lesson shape.

WHAT THIS CLOSES
================
Measured against the four Cambridge Teacher's Resources on 2026-09-17, two gaps
were named as the largest the books still had:

  MISCONCEPTIONS OUTSIDE GRAMMAR. Cambridge carries 192 three-column tables
  (185 distinct) across Stages 1-4 -- the misconception, how to identify it, how
  to overcome it -- spanning reading, spelling, phonics, listening and
  handwriting. This course carried 264, one on every grammar concept, which is
  complete for grammar and ONLY grammar. Nothing named a reading, spelling or
  listening misconception, and nothing told an adult how to spot one.

  THE LESSON SHAPE. Cambridge gives every session a starter, a plenary and a
  homework idea -- 361 of each across the four stages. This course gave none.

WHY BOTH LAND IN THE TEACHER & PARENT GUIDE, NOT IN FRONT OF THE CHILD
======================================================================
Cambridge's "how to identify" is written for the adult: it tells a teacher what
to ask a class in order to find out who holds the misconception. Put that on a
six-year-old's screen and it is noise. The guide already exists, is already
teacher-facing, and build-lessons.py renders its sections generically from
`title` / `body` / `items` -- so this is pure content and changes no code, no
step and no slide.

WHERE THE MISCONCEPTIONS COME FROM
==================================
`english/data/cambridge-misconceptions-1-4.json`, which is every table in the
four Teacher's Resources, de-duplicated, with stage and page as the citation.
One is chosen per unit, matched to what that unit actually teaches -- the
contents-page misconception goes to the unit that has a contents page, the
"instructions sound rude and bossy" one to the unit that writes instructions,
the narrator one to the unit whose objective is identifying viewpoint.

**NOT ONE IS INVENTED.** Where Cambridge's own identify/overcome columns split
cleanly out of the PDF text they are used, condensed; where they did not (20 of
the 40) the wording below is written from the raw table, which is kept in the
fixture so the source can be checked.

**GRAMMAR IS DELIBERATELY EXCLUDED.** The 264 `commonMistake` entries already
cover it, they already reach the child on the rules step, and duplicating them
in the guide would pad the count without adding teaching.

THE STARTER, PLENARY AND HOME TASK ARE DERIVED, AND SAY SO
===========================================================
They are built from each unit's own content -- its word groups, its grammar
pattern, its first writing task -- rather than written one by one. That makes
them specific to the unit and honest about what they are: a shape for the
lesson, not Cambridge's 361 hand-authored ideas. The guide says as much in the
section itself.

    python tools/author-english-teacher-apparatus.py --dry
    python tools/author-english-teacher-apparatus.py
"""

import io
import json
import os
import sys

# The section titles carry emoji, as every other guide section in this course
# does, and Windows consoles default to cp1252 - so printing the tool's own
# output raised UnicodeEncodeError and took the run down with it. Reconfigure
# rather than strip: the emoji belong in the data, and a tool that cannot print
# what it wrote is broken on the platform this repo runs on.
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except AttributeError:      # pragma: no cover - Python < 3.7
    pass

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
ENGLISH = os.path.join(ROOT, "src", "prototypes", "ehel-academy", "english")
FIXTURE = os.path.join(ENGLISH, "data", "cambridge-misconceptions-1-4.json")

ORIGIN = "Ehel authoring 2026-09-17 (Cambridge teacher apparatus: misconceptions and lesson shape)"
REVIEW = "Needs curriculum review"

MIS_TITLE = "⚠️ Watch out for this"
START_TITLE = "▶️ Starting the lesson"
END_TITLE = "⏹️ Ending the lesson"
HOME_TITLE = "\U0001f3e0 At home"

# (grade, unit) -> (fixture id, how to spot it, how to help)
# Spot/help are Cambridge's own columns condensed where they split, and written
# from the raw table where they did not. Every one cites a real entry.
PICKS = {
    (1, 1): ("cme-s1-000",
             "Ask a child to tell you about a picture, then read the words on that page together. Ask whether they said the same thing.",
             "Agree that a picture helps and often adds something extra - but the words carry what the writer actually said, so we read those too."),
    (1, 2): ("cme-s1-006",
             "Play the start of the unit's story and ask what they heard. If the answer is only 'a voice' or 'words', the idea is there.",
             "Ask what the words and the voice told them - who is speaking, where they are, how they feel. Good listening is working out meaning, not only catching sound."),
    (1, 3): ("cme-s1-050",
             "Read an instruction aloud flatly - 'Get a long rope' - and ask whether it sounds unkind.",
             "Explain that an instruction is short because it has one job, not because it is cross. Read the same line warmly and let them hear the difference."),
    (1, 4): ("cme-s1-048",
             "Ask how they would show the order of the paper-hat steps without using 1, 2, 3.",
             "Show that First, Next, Then and Finally do the same work as numbers, and that a picture in order can too."),
    (1, 5): ("cme-s1-012",
             "Ask what an information book has in it. If the answer is only 'photos', the idea is there.",
             "Turn to the farm text and point at the headings, the labels and the lists. Information comes in several shapes, and photographs are only one."),
    (1, 6): ("cme-s1-055",
             "Ask what a list is for. A shopping list is usually the only answer offered.",
             "Show the senses chart: a list can group things so you can find one fast, not only remind you to buy something."),
    (1, 7): ("cme-s1-071",
             "Show a sign in capitals, like STOP, and ask what the big letters mean.",
             "Explain that print can be made to stand out for several reasons - here it is a sign that must be read in a hurry, not a word to be shouted."),
    (1, 8): ("cme-s1-076",
             "Ask what the difference is between the water fact file and a report on the same subject.",
             "Both give facts. A fact file breaks them into short separate pieces you can read one at a time; a report joins them into sentences that run on."),
    (1, 9): ("cme-s1-067",
             "Ask whether a story book can have a contents page. Most children say only information books do.",
             "Show that a book of several stories or poems often has one, because a reader needs to find one story among many."),
    (1, 10): ("cme-s1-044",
              "Ask what kinds of book they know. If the answer is 'story books', the idea is there.",
              "Look back over the year's texts together - a rhyme, a diary, instructions, a chart, a fact file, a contents page. Books hold many kinds of writing."),

    (2, 1): ("cme-s2-083",
             "Ask what 'right' means, then use it in two sentences - the right answer, and turn right.",
             "Collect other words that do this. A word can carry more than one meaning, and the sentence around it decides which one is meant."),
    (2, 2): ("cme-s2-093",
             "Ask a child to describe a non-fiction book they know. Most describe information and photographs.",
             "Put the firefighter interview beside the fact card and the news report. Recounts, interviews, diaries and letters are all non-fiction and none looks like the others."),
    (2, 3): ("cme-s2-088",
             "Ask them to make a sign that says 'turn left' without writing the words.",
             "An arrow does the job. Instructions can be a picture, a number, an arrow or a word, and good ones often use several at once."),
    (2, 4): ("cme-s2-122",
             "Ask 'what is a poem?' and listen for whether rhyme is the first or only thing offered.",
             "Read them a poem that does not rhyme. Rhyme is one thing a poem may do, alongside rhythm, repetition and the shape of the lines."),
    (2, 5): ("cme-s2-092",
             "Ask for the plural of box, baby and child in the same breath.",
             "Sort the words into groups: add -s, add -es, change the middle, change nothing. The rule has families, and the exceptions are worth learning by sight."),
    (2, 6): ("cme-s2-094",
             "After a paired task, ask what they did together. If the answer is only the finished thing, the idea is there.",
             "Name the working parts too: taking turns, listening, disagreeing kindly, changing your mind. The product is the smaller half of group work."),
    (2, 7): ("cme-s2-106",
             "Ask what they changed when they checked their writing. Spelling and full stops are the usual answers.",
             "Separate the two jobs: correcting fixes what is wrong, improving makes a good sentence better. Ask for one of each."),
    (2, 8): ("cme-s2-114",
             "Ask when they start a new paragraph. A length is the common answer.",
             "Show that a paragraph holds one idea, so it ends when the idea does - which is sometimes two lines and sometimes eight."),
    (2, 9): ("cme-s2-120",
             "Put the aquarium schedule beside a text explaining why the animals are fed at those times, and ask what each is for.",
             "A report tells you what things ARE. An explanation tells you WHY they are like that. Their joining words differ too: and and but against so and because."),
    (2, 10): ("cme-s2-089",
              "After a prediction, ask whether they were right. If being right is the point, the idea is there.",
              "Ask instead what in the text made them think it. A prediction is judged on its evidence, not its luck."),

    (3, 1): ("cme-s3-132",
             "Ask them to sort a pile of books into fiction and non-fiction, and watch which ones cause an argument.",
             "Show a story that has headings, boxed text and a diagram. A book's features are a clue to its kind, not proof - check several before deciding."),
    (3, 2): ("cme-s3-156",
             "Ask which they would use to find out whether a book mentions cheetahs at all: the contents page or the index.",
             "The contents lists big sections in book order; the index lists single things alphabetically with every page. For one fact the index wins, for a whole topic the contents does."),
    (3, 3): ("cme-s3-131",
             "Ask a child to recite the alphabet alone. Listen for letters swapped or dropped, usually around l-m-n-o-p.",
             "Practise in short runs rather than end to end, with three children taking a section each, so the weak stretch is found and rehearsed on its own."),
    (3, 4): ("cme-s3-137",
             "Ask them to find the rhyming words in the unit's poem. If they look for them before reading it, the idea is there.",
             "Read a poem with no rhyme at all and ask what makes it a poem. Rhythm, repeated lines and images do the work rhyme is assumed to do."),
    (3, 5): ("cme-s3-141",
             "Look at their written dialogue. A new line for each speaker written as a full new paragraph is the tell.",
             "Explain that a new speaker takes a new line, and that a new paragraph is a bigger move - a change of idea, time or place."),
    (3, 6): ("cme-s3-160",
             "Ask for the difference between bat (the animal) and bat (the cricket bat), then between their and there.",
             "Name the two: homonyms are spelled the same and mean different things; homophones sound the same and are spelled differently."),
    (3, 7): ("cme-s3-162",
             "Ask what gives the unit's nature poem its beat. Rhyme is the usual answer.",
             "Clap the poem's rhythm with the rhyme removed. Rhythm comes from the stresses and the line length; rhyme sits on top of it."),
    (3, 8): ("cme-s3-146",
             "Ask them to scan the maths text for one number. Watch whether they start at the first word.",
             "Scanning is hunting for one thing and ignoring everything else - eyes moving down the page, not across every line. Reading quickly is a different skill."),
    (3, 9): ("cme-s3-158",
             "Ask which of these is a fact: 'the box is blue' and 'I love the box'. Watch for the second being called a fact.",
             "A feeling is real without being a fact. Test it: could someone else check it and get the same answer?"),
    (3, 10): ("cme-s3-155",
              "Show a blurb and a review of the same book and ask what each is called.",
              "A blurb sells the book and hides the ending. A review says what the writer thought of it and who else would enjoy it."),

    (4, 1): ("cme-s4-176",
             "Ask where else speech marks appear, outside a story's dialogue.",
             "Show them round a quotation, a thought, a title and an unusual phrase. Dialogue is the commonest use, not the only one."),
    (4, 2): ("cme-s4-171",
             "Ask what makes something a poem. Rhyme is named first by most children, and often alone.",
             "Read the unit's poem and name what it is actually doing - line length, rhythm, punctuation, repetition. Nursery rhymes come first in life, which is why rhyme feels compulsory."),
    (4, 3): ("cme-s4-170",
             "Count the exclamation marks in their persuasive poster.",
             "An exclamation mark is for an exclamation or a command, and only rarely for emphasis. Show that a strong sentence does not need one."),
    (4, 4): ("cme-s4-167",
             "Read a text containing two or three hard words, then ask whether they followed it.",
             "Replace a word with a nonsense word and ask what it must mean. The sentence around a word usually carries enough - the dictionary confirms, it does not rescue."),
    (4, 5): ("cme-s4-166",
             "Ask how stories start. Count how many say 'once upon a time'.",
             "Look at the openings of the books they are reading now. Formulaic beginnings belong to fairy tales and legends; most stories start somewhere in the middle of something happening."),
    (4, 6): ("cme-s4-165",
             "Ask why writers use paragraphs. 'To break up the text' is the answer to listen for.",
             "Paragraphs group ideas, and the break is the result rather than the purpose. Show a page where the breaks follow the ideas and one where they do not."),
    (4, 7): ("cme-s4-163",
             "Ask who is telling the unit's recount, and how they know.",
             "Point at the I and the we. A story told from inside can only report what that person saw, which is exactly what makes it different from one told from outside."),
    (4, 8): ("cme-s4-168",
             "Ask what they would find in the contents that they would not find in the index.",
             "The contents names the chapters and where they start. The index names single words and every page they appear on. Different questions, different tool."),
    (4, 9): ("cme-s4-172",
             "Offer big, large, huge and enormous and ask whether any sentence would take all four equally well.",
             "Try them in one sentence and listen. Synonyms share a meaning and differ in strength, formality and company."),
    (4, 10): ("cme-s4-184",
              "Ask what the capstone poem means, and watch for a child who will not answer in case they are wrong.",
              "Accept every reading that can point at a line. A poem makes meaning with its reader; being unsure is the normal condition, not a failure."),
}


def load(path):
    with io.open(path, encoding="utf-8") as fh:
        return json.load(fh)


def save(path, obj):
    with io.open(path, "w", encoding="utf-8", newline="\n") as fh:
        fh.write(json.dumps(obj, indent=2, ensure_ascii=False) + "\n")


def unit_path(grade, n):
    return os.path.join(ENGLISH, "grade-%d" % grade, "data", "units", "unit-%d.json" % n)


def first_group(unit):
    for g in unit.get("vocabularyGroups") or []:
        t = (g.get("title") or "").strip()
        if t:
            return t
    return ""


def derived_sections(unit):
    """A lesson shape built from the unit's OWN content, and labelled as derived."""
    title = unit["unit"]["unitTitle"]
    group = first_group(unit)
    gram = next((g.get("title") or "" for g in (unit.get("grammar") or []) if g.get("title")), "")
    write = next((w.get("title") or "" for w in (unit.get("writing") or []) if w.get("title")), "")
    read = next((r.get("title") or "" for r in (unit.get("readings") or []) if r.get("title")), "")

    start = ("Five to ten minutes before the first step. Ask what your child already knows about "
             "%s, and write the words they offer where they can see them. Keep the list: at the end "
             "of the unit you will add to it, and the growth is the point. If they have nothing to "
             "say, read the first line of “%s” aloud and ask what they think it is about."
             % (title.lower(), read))
    end = ("Five minutes after the last step they finish today. Ask for one sentence out loud using "
           "%s, and one word from %s used correctly. If either comes slowly, that is the thing to "
           "start tomorrow with rather than the next step."
           % (("the pattern “%s”" % gram) if gram else "today's pattern",
              ("“%s”" % group) if group else "this unit's words"))
    home = ("%s can be done away from the screen, on paper, with whoever is at home. Ask them to "
            "read it back to you afterwards - reading their own writing aloud is where most of the "
            "corrections get made."
            % (("“%s”" % write) if write else "This unit's first writing task"))
    return start, end, home


def build(unit, grade, n, fixture):
    fid, spot, help_ = PICKS[(grade, n)]
    entry = fixture[fid]
    body = ("Children often think: “%s”\n\n"
            "HOW TO SPOT IT — %s\n\n"
            "HOW TO HELP — %s\n\n"
            "From the Cambridge Primary English Teacher’s Resource %d, page %d (%s). "
            "The full table is in english/data/cambridge-misconceptions-1-4.json."
            % (entry["misconception"].rstrip(". "), spot, help_, entry["stage"], entry["page"], fid))
    start, end, home = derived_sections(unit)
    note = ("Derived from this unit’s own words, pattern and writing task rather than written "
            "one by one — a shape for the lesson, not a script.")
    return [
        {"title": MIS_TITLE, "body": body, "origin": ORIGIN, "reviewStatus": REVIEW},
        {"title": START_TITLE, "body": start + "\n\n" + note, "origin": ORIGIN, "reviewStatus": REVIEW},
        {"title": END_TITLE, "body": end, "origin": ORIGIN, "reviewStatus": REVIEW},
        {"title": HOME_TITLE, "body": home, "origin": ORIGIN, "reviewStatus": REVIEW},
    ]


def main(argv):
    dry = "--dry" in argv
    for a in argv[1:]:
        if a not in ("--dry",):
            sys.stderr.write("REFUSED: unknown argument %r\n" % a)
            return 2

    fx = load(FIXTURE)
    fixture = {e["id"]: e for e in fx["entries"]}

    # ---- PRE-FLIGHT: nothing is written until every unit can be written -----
    problems = []
    for (g, n), (fid, _s, _h) in sorted(PICKS.items()):
        p = unit_path(g, n)
        if not os.path.isfile(p):
            problems.append("grade %d unit %d: no unit file" % (g, n)); continue
        if fid not in fixture:
            problems.append("grade %d unit %d: %s is not in the fixture" % (g, n, fid)); continue
        if fixture[fid]["stage"] != g:
            problems.append("grade %d unit %d cites %s, which is a STAGE %d misconception"
                            % (g, n, fid, fixture[fid]["stage"]))
        u = load(p)
        if not (u.get("grownUpGuide") or {}).get("sections"):
            problems.append("grade %d unit %d has no grownUpGuide.sections to add to" % (g, n))
    used = [f for f, _s, _h in PICKS.values()]
    if len(set(used)) != len(used):
        dupes = sorted({f for f in used if used.count(f) > 1})
        problems.append("the same misconception is used twice: %s" % ", ".join(dupes))
    if problems:
        sys.stderr.write("REFUSED before writing anything:\n")
        for p in problems:
            sys.stderr.write("  - %s\n" % p)
        return 1

    changed = skipped = 0
    for (g, n) in sorted(PICKS):
        p = unit_path(g, n)
        unit = load(p)
        secs = unit["grownUpGuide"]["sections"]
        if any(ORIGIN in (s.get("origin") or "") for s in secs):
            skipped += 1
            continue
        add = build(unit, g, n, fixture)
        if not dry:
            secs.extend(add)
            save(p, unit)
        changed += 1
        if dry and (g, n) in ((1, 1), (4, 10)):
            print("  grade %d unit %d would gain: %s"
                  % (g, n, ", ".join(s["title"] for s in add)))

    print("\n%d unit(s) %s four guide sections, %d already done."
          % (changed, "would gain" if dry else "gained", skipped))
    print("Misconceptions cited: %d distinct, all from the fixture's %d."
          % (len(set(used)), fx["counts"]["total"]))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
