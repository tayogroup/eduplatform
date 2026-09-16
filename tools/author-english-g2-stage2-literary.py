# -*- coding: utf-8 -*-
"""Grade 2 English: the literary strand nobody named, and the two objectives nothing taught.

WHY THIS IS NOT THE GRADE 1 JOB
===============================
Grade 1's defect was that its reading diet was ONE text type ten times over, so
six non-fiction objectives had no teaching to point at and had to be written.
**Grade 2 is not like that and the fix must not pretend it is.** Measured
2026-09-17: 43 readings, 13,777 words, and already varied -- 10 stories, 9 poems
and songs, 14 listening texts, information texts, an interview, a schedule, a
project brief. All 190 comprehension questions are written short answers, not
Grade 1's oral prompts. Coverage is 99/99.

What Grade 2 has instead is a MAPPING defect and two real holes.

**The mapping defect.** Not one of the 71 outcomes in units 1-9 is about reading
a story or a poem. Every unit HAS a story, nine have a poem, and 19 comprehension
questions ask about those poems -- but because no outcome names that work, the
literary objectives were parked on whatever outcome shared a word:

    2Ri.16  patterns in stories and poems, e.g. rhyme, repetition
            <- "Notice, continue and describe a pattern that repeats."  (a MATHS
               pattern: the unit is Let's Measure)
    2Ri.07  use the main events to retell a story verbally
            <- "Create and follow a simple exercise routine."
    2Ri.08  describe story settings and characters
            <- "Introduce yourself and a partner using simple sentences."
    2Ri.02  read and explore a range of simple stories and poems
            <- "Name different kinds of homes for people and animals."
    2Wc.01  begin to write simple stories and poems
            <- "Say what you and other people like, using like and likes."
    2Ri.09  find information from simple visual sources, incl. tables and charts
            <- "Use position words (on, under, in, between...)"

Every one of those skills IS taught. Unit 3's speaking task says "Retell 'The
Big Race' in four steps"; every unit carries an activity asking "Who is in it?
Where does it happen?"; units 1, 2 and 8 each set "Your Own Poem" and unit 6 "A
Tiny Garden Story"; unit 9's questions read the aquarium schedule. So this tool
does NOT author that teaching. It gives each unit the outcome its own texts
already deliver, and moves the claims onto it.

**The two holes, and how they were told apart from the six.**

    2Ri.11  Predict story endings.
            <- "Follow simple movement instructions in English."
    2Ri.14  Locate relevant information in texts, including using a contents
            page, index or glossary.
            <- "Compare different kinds of homes around the world."

Nothing in the grade teaches either. The only prediction-shaped items are
guessing games (I Spy, Bug Riddles, Mystery Animal) and the only "which page"
is a child admiring page four of their own booklet.

**Three claims were nearly stripped and are DEFENSIBLE. Checking cost less than
being wrong would have.** `2Rs.03` (organisational features) reads as mis-pointed
on "Name the special clothes and equipment used in different jobs" until you look
at the unit, which asks learners to "Give the card a heading with the job name"
and "Draw and label a firefighter" -- 23 such items across the grade. `2Wp.04`
sits correctly on "Name the parts of a plant" and on the capstone booklet, and
only its third home (the maths pattern) is wrong. `2Wc.01` was called untaught by
a regex wanting the word "write", while the tasks are titled "Your Own Poem".
A search for the METALANGUAGE of a skill is not a search for the skill; list the
items and read them.

POSITION-SAFE
=============
Everything lands in a step that already exists -- outcomes in `overview`,
questions in `questions`, self-checks in `reflect`, readings as another card in
`story`, all of which build-lessons.py declares with a single add(). No slide
moves, which is the owner's standing constraint for a live routed grade.

    python tools/author-english-g2-stage2-literary.py --dry
    python tools/author-english-g2-stage2-literary.py
"""

import io
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
UNITS = os.path.join(ROOT, "src", "prototypes", "ehel-academy", "english",
                     "grade-2", "data", "units")
FRAMEWORK = os.path.join(ROOT, "src", "curriculum", "cambridge-english-0058.json")

ORIGIN = "Ehel authoring 2026-09-17 (Cambridge Stage 2 literary strand and gaps)"
REVIEW = "Needs curriculum review"
SOURCE = "Authored against Cambridge Primary English Stage 2 (LB2/WB2/TR2)"

# ---------------------------------------------------------------------------
# ONE LITERARY OUTCOME PER UNIT, naming work the unit's own texts already do.
# `story` is that unit's story; `poem` is its poem or song, where it has one
# (unit 10 is the capstone and has neither, so it takes the story alone).
# ---------------------------------------------------------------------------
LITERARY = {
    1:  ("Amal's First Week", "When I Open Up a Book"),
    2:  ("The Helpers of Warta Street", "My Neighbourhood"),
    3:  ("The Big Race", "Reach for the Sky!"),
    4:  ("The Night Amal Counted the Stars", "My Shadow"),
    5:  ("A Fair Way to Measure", "A Counting Song"),
    6:  ("Amal and the Little Garden Friends", "A Bug Poem"),
    7:  ("Amal and the Little Tree", "A Poem for the Earth"),
    8:  ("Helping Hands at Home", "Homes"),
    9:  ("A Big Day in the City", "At the Zebra Crossing"),
    10: ("Amal's English Year", None),
}

# The claims to MOVE onto each unit's new literary outcome, and the outcome each
# is moving OFF. Every entry was evidenced by reading the unit; see the docstring
# for the three that were checked and left alone.
MOVE = [
    (1,  "lo02", ["2Ri.08"]),
    (1,  "lo03", ["2Wc.01"]),
    (2,  "lo01", ["2Ri.08"]),
    (3,  "lo03", ["2Ri.11"]),
    (3,  "lo06", ["2Ri.07"]),
    (5,  "lo03", ["2Ri.16", "2Wp.04"]),
    (6,  "lo04", ["2Ri.09"]),
    (8,  "lo01", ["2Ri.02", "2Ri.16", "2Wc.01"]),
    (8,  "lo04", ["2Ri.14"]),
]

# Which codes each unit's literary outcome takes. 2Ri.11 and 2Ri.14 are the two
# holes and are placed where this tool AUTHORS their teaching (units 3 and 9).
LIT_CODES = {
    1:  ["2Ri.02", "2Ri.08", "2Wc.01"],
    2:  ["2Ri.02", "2Ri.08"],
    3:  ["2Ri.07", "2Ri.11"],
    4:  ["2Ri.02", "2Ri.16"],
    5:  ["2Ri.16"],
    6:  ["2Ri.02", "2Wc.01"],
    7:  ["2Ri.02", "2Ri.08"],
    8:  ["2Ri.02", "2Ri.16", "2Wc.01"],
    9:  ["2Ri.02"],
    10: ["2Ri.02", "2Ri.07"],
}

# Unit 9 gains a SECOND outcome, and it is deliberately not folded into the
# literary one. The guide and the aquarium schedule are what deliver 2Ri.09 and
# 2Ri.14; "talk about the unit's story and poem" does not, and hanging them
# there would reproduce the exact defect this tool corrects.
GUIDE_OUTCOME = {
    "unit": 9,
    "learningOutcome": ("Use a contents page, an index and a schedule to find one piece of "
                        "information without reading the whole text."),
    "evidence": ("Observed through answering the guide questions, reading the aquarium "
                 "schedule, and naming which part of a book to use for a big section and "
                 "which for one word."),
    "codes": ["2Ri.09", "2Ri.14"],
    "selfCheck": ("I can use a contents page or an index to find just the part I need."),
}


# Units whose writing section already sets a poem or story of the learner's own
# ("W2 - Your Own Poem", "W2 - Your Own Neighbourhood Poem", "W6 - A Tiny Garden
# Story", "W2 - Your Own Animal Homes Poem"). 2Wc.01 is about WRITING one, so it
# may only sit on an outcome that says so -- putting it on a "talk about the
# story" outcome would be the same mis-pointing this tool exists to correct,
# made by me instead of inherited.
WRITES_ITS_OWN = {1: "poem", 2: "poem", 6: "story", 8: "poem"}


def lit_outcome(unit_no):
    story, poem = LITERARY[unit_no]
    base = ("Talk about the unit's story and poem: who is in it, where it happens, "
            "and the lines that repeat."
            if poem else
            "Talk about the unit's story: who is in it, where it happens, and what "
            "changes from the beginning to the end.")
    # A clause per code the outcome claims. An outcome may not carry an objective
    # its own wording does not describe -- that is the whole defect being fixed,
    # and it is just as wrong when I write it as when I inherit it.
    if "2Ri.11" in LIT_CODES[unit_no]:
        base += " Say what in the story told you how it would end."
    if "2Ri.07" in LIT_CODES[unit_no]:
        base += " Retell it in your own words, in order."
    kind = WRITES_ITS_OWN.get(unit_no)
    if kind:
        base += (" Then write your own short %s using the same pattern." % kind)
    return base


# ---------------------------------------------------------------------------
# HOLE 1 -- 2Ri.11, predict story endings. One question per story, in units 3
# and 10 (where the literary outcome carries the code).
#
# A PREDICTION QUESTION HERE MUST ASK FOR THE CLUE, NOT THE OUTCOME. The app
# shows the story before its questions, so "how does it end?" is answered from
# memory and tests nothing -- the same defect that was rewritten out of Grade 3
# Unit 6 and Grade 4 Unit 5 on 2026-09-11. So each asks what in the text told
# you, which is answerable only by having read it.
# ---------------------------------------------------------------------------
PREDICT = {
    3: [("Before the last part of The Big Race, Amal stops to help Theo up. "
         "What did that tell you about how the race would end for her?",
         "That she would be called the winner for being kind, not for being first",
         "Stopping to help is the clue: the story ends with Teacher Yasmin calling "
         "Amal the true winner because she was kind.",
         ["That she would come first and win the cup",
          "That she would give up and go home"])],
    10: [("Amal's English Year begins with her shy on the first day. What did that "
          "tell you about what the end of the year would show?",
          "That she would grow more confident by the end",
          "A story that starts with a shy first day is setting up a change; the end "
          "shows Amal presenting her own book to the class.",
          ["That she would stay quiet all year",
           "That she would move to a new school"])],
}

# ---------------------------------------------------------------------------
# HOLE 2 -- 2Ri.14, locating information with a contents page, index or
# glossary. Grade 2 has no such text, so one is authored: a page of the city
# guide unit 9's own writing task already asks learners to make ("W4 - My City
# Guide"), which is why it belongs there and not in a unit that never mentions
# a guide.
# ---------------------------------------------------------------------------
GUIDE = {
    "unit": 9,
    "type": "Contents page",
    "title": "Using the City Guide",
    "passage": """A guide book is made to be searched, not read from front to back.

Three parts help you find things fast.

The contents page is at the front. It lists the big sections in the order they
appear, with the page each one starts on.

The index is at the back. It lists small things in alphabetical order, so you can
look up one word.

The glossary explains hard words.

Contents

Getting around ....... page 2

Places to visit ....... page 6

Eating out ....... page 11

Index

aquarium, 7

bus station, 3

library, 8

underground, 4

You want to know when the aquarium opens. The index says aquarium is on page 7,
so you turn to page 7. You do not read pages 2 to 6 first.

You want to plan a whole day of travel. That is a big section, so you use the
contents page instead, and turn to Getting around on page 2.""",
    "questions": [
        ("Which part of a guide book lists small things in alphabetical order?",
         "The index",
         "The index is at the back and lists small things in alphabetical order, so "
         "you can look up one word.",
         ["The contents page", "The glossary"]),
        ("The index says aquarium, 7. Which page do you turn to?",
         "Page 7",
         "An index entry gives the page the thing is on, so aquarium, 7 sends you "
         "straight to page 7.",
         ["Page 2", "Page 11"]),
        ("You want to plan a whole day of travel. Which part do you use, and why?",
         "The contents page, because travel is a big section",
         "The contents page lists the big sections, so a whole-day plan is found "
         "there; the index is for looking up one small thing.",
         ["The index, because it is alphabetical",
          "The glossary, because it explains words"]),
    ],
}


def paragraphs(script):
    return [p.strip() for p in re.split(r"\n{2,}", script) if p.strip()]


ENDS_A_SENTENCE = (".", "!", "?", '"', "”", ":", ";", ",")


def narration_script(passage):
    """The spoken copy: leader dots become a comma, unpunctuated lines gain a stop.

    Same rule and the same reason as Grade 1's non-fiction -- see
    tools/author-english-g1-nonfiction.py. narration() flattens whitespace, so a
    contents line without a full stop runs into the next one and the pairings
    shift: "The shop page two. The school page four" becomes one long list in
    which no place keeps its page.
    """
    out = []
    for para in paragraphs(passage):
        para = re.sub(r"\s*\.{3,}\s*", ", ", para)
        para = re.sub(r"\s*\n\s*", " ", para)
        if not para.endswith(ENDS_A_SENTENCE):
            para += "."
        out.append(para)
    return "\n\n".join(out)


def load(path):
    with io.open(path, encoding="utf-8") as fh:
        return json.load(fh)


def save(path, obj):
    with io.open(path, "w", encoding="utf-8", newline="\n") as fh:
        fh.write(json.dumps(obj, indent=2, ensure_ascii=False) + "\n")


def unit_path(n):
    return os.path.join(UNITS, "unit-%d.json" % n)


def next_seq(items, key):
    best = 0
    for it in items:
        try:
            best = max(best, int(it.get(key) or 0))
        except (TypeError, ValueError):
            pass
    return best + 1


def stage2_codes():
    fw = load(FRAMEWORK)
    by = fw["objectivesByStage"]
    items = by["2"] if isinstance(by, dict) else by[1]
    return {o["code"] for o in items if o.get("code")}


def claimed_codes():
    out = {}
    for n in range(1, 11):
        for o in load(unit_path(n)).get("outcomes") or []:
            for code in o.get("cambridgeObjectives") or []:
                out.setdefault(code, []).append((n, o["outcomeId"]))
    return out


def main(argv):
    dry = "--dry" in argv
    for a in argv[1:]:
        if a not in ("--dry",):
            sys.stderr.write("REFUSED: unknown argument %r\n" % a)
            return 2

    before = claimed_codes()
    changed = skipped = 0
    plan = []

    for n in range(1, 11):
        path = unit_path(n)
        unit = load(path)
        uid = unit["unit"]["unitId"]

        lit_id = "%s-lo%02d" % (uid, len(unit["outcomes"]) + 1)
        if any(ORIGIN in (o.get("origin") or "") for o in unit["outcomes"]):
            skipped += 1
            continue

        # --- pre-state ----------------------------------------------------
        titles = {r.get("title") for r in unit["readings"]}
        story, poem = LITERARY[n]
        if story not in titles:
            sys.stderr.write("REFUSED: unit %d has no reading titled %r; the literary "
                             "outcome would name a text that is not there.\n" % (n, story))
            return 1

        outcome = {
            "outcomeId": lit_id,
            "unitId": uid,
            "sequence": next_seq(unit["outcomes"], "sequence"),
            "learningOutcome": lit_outcome(n),
            "evidenceOfLearning": ("Observed through answering the story and poem questions, "
                                   "retelling the main events aloud, and naming the repeated "
                                   "lines in the poem."),
            "origin": ORIGIN,
            "reviewStatus": REVIEW,
            "sourceFile": SOURCE,
            "bloomLevel": "Understand and analyse",
            "cambridgeObjectives": list(LIT_CODES[n]),
        }

        adds = {"outcome": lit_id, "questions": 0, "reading": None}
        new_comp = []

        for q, a, why, wrong in PREDICT.get(n, []):
            new_comp.append({
                "questionId": "%s-predq%d" % (uid, len(new_comp) + 1),
                "unitId": uid,
                "readingId": next(r["readingId"] for r in unit["readings"]
                                  if r.get("title") == story),
                "section": story,
                "sequence": next_seq(unit["comprehension"], "sequence") + len(new_comp),
                "questionType": "Short answer",
                "question": q, "correctAnswer": a, "distractors": list(wrong),
                "explanation": why, "marks": 1, "outcomeId": lit_id,
                "difficulty": "Grade 2 core",
                "origin": ORIGIN, "reviewStatus": REVIEW, "sourceFile": SOURCE,
            })

        reading = None
        if GUIDE["unit"] == n:
            read_id = "%s-read%02d" % (uid, len(unit["readings"]) + 1)
            reading = {
                "readingId": read_id, "unitId": uid,
                "sequence": next_seq(unit["readings"], "sequence"),
                "type": GUIDE["type"], "title": GUIDE["title"], "genre": GUIDE["type"],
                "theme": "finding information in a guide book",
                "setting": "Home, online lesson or Grade 2 classroom",
                "passageScript": GUIDE["passage"],
                "narrationScript": narration_script(GUIDE["passage"]),
                "audioRequired": True,
                "audio": {"provider": "ElevenLabs", "available": False,
                          "status": "Not recorded - authored 2026-09-17"},
                "origin": ORIGIN, "reviewStatus": REVIEW, "sourceFile": SOURCE,
            }
            adds["reading"] = read_id
            for k, (q, a, why, wrong) in enumerate(GUIDE["questions"], start=1):
                new_comp.append({
                    "questionId": "%s-guideq%d" % (uid, k),
                    "unitId": uid, "readingId": read_id, "section": GUIDE["title"],
                    "sequence": next_seq(unit["comprehension"], "sequence") + len(new_comp),
                    "questionType": "Short answer",
                    "question": q, "correctAnswer": a, "distractors": list(wrong),
                    "explanation": why, "marks": 1, "outcomeId": lit_id,
                    "difficulty": "Grade 2 core",
                    "origin": ORIGIN, "reviewStatus": REVIEW, "sourceFile": SOURCE,
                })

        # Unit 9's guide outcome, and the guide questions belong to IT rather
        # than to the literary outcome above.
        guide_outcome = None
        if GUIDE_OUTCOME["unit"] == n:
            guide_id = "%s-lo%02d" % (uid, len(unit["outcomes"]) + 2)
            guide_outcome = {
                "outcomeId": guide_id, "unitId": uid,
                "sequence": next_seq(unit["outcomes"], "sequence") + 1,
                "learningOutcome": GUIDE_OUTCOME["learningOutcome"],
                "evidenceOfLearning": GUIDE_OUTCOME["evidence"],
                "origin": ORIGIN, "reviewStatus": REVIEW, "sourceFile": SOURCE,
                "bloomLevel": "Apply", "cambridgeObjectives": list(GUIDE_OUTCOME["codes"]),
            }
            for c in new_comp:
                if c["questionId"].find("-guideq") >= 0:
                    c["outcomeId"] = guide_id
            adds["outcome"] += " + " + guide_id

        adds["questions"] = len(new_comp)
        check = {
            "selfAssessmentId": "%s-self%02d" % (uid, len((unit.get("selfAssessment") or [])) + 1),
            "unitId": uid,
            "sequence": next_seq(unit.get("selfAssessment") or [], "sequence"),
            "statement": ("I can talk about the story and the poem: who is in them, where they "
                          "happen, and the lines that repeat."
                          if poem else
                          "I can talk about the story: who is in it, where it happens, and what "
                          "changes by the end."),
            "scale": ["Not yet", "Getting there", "Yes, I can"],
            "outcomeId": lit_id,
            "origin": ORIGIN, "reviewStatus": REVIEW, "sourceFile": SOURCE,
        }

        plan.append((n, adds))
        if not dry:
            unit["outcomes"].append(outcome)
            if guide_outcome:
                unit["outcomes"].append(guide_outcome)
                unit.setdefault("selfAssessment", []).append({
                    "selfAssessmentId": "%s-self%02d" % (uid, len(unit["selfAssessment"]) + 2),
                    "unitId": uid,
                    "sequence": next_seq(unit["selfAssessment"], "sequence") + 1,
                    "statement": GUIDE_OUTCOME["selfCheck"],
                    "scale": ["Not yet", "Getting there", "Yes, I can"],
                    "outcomeId": guide_outcome["outcomeId"],
                    "origin": ORIGIN, "reviewStatus": REVIEW, "sourceFile": SOURCE,
                })
            if new_comp:
                unit["comprehension"].extend(new_comp)
            if reading:
                unit["readings"].append(reading)
            unit.setdefault("selfAssessment", []).append(check)

            for mu, suffix, codes in MOVE:
                if mu != n:
                    continue
                target = [o for o in unit["outcomes"] if o["outcomeId"].endswith("-" + suffix)]
                if not target:
                    sys.stderr.write("REFUSED: unit %d has no outcome ending -%s\n" % (n, suffix))
                    return 1
                for o in target:
                    had = o.get("cambridgeObjectives") or []
                    absent = [c for c in codes if c not in had]
                    if absent:
                        sys.stderr.write(
                            "REFUSED: unit %d %s does not claim %s, so this move removes "
                            "nothing. The data shifted under the tool.\n"
                            % (n, suffix, ", ".join(absent)))
                        return 1
                    o["cambridgeObjectives"] = [c for c in had if c not in codes]
            save(path, unit)
        changed += 1

    for n, a in plan:
        bits = ["+ %s" % a["outcome"]]
        if a["questions"]:
            bits.append("+ %d question(s)" % a["questions"])
        if a["reading"]:
            bits.append("+ %s" % a["reading"])
        bits.append("+ 1 self-check")
        print("unit %-2d %s" % (n, "  ".join(bits)))

    if dry:
        print("\n--dry: nothing written. %d unit(s) would change, %d already done."
              % (changed, skipped))
        return 0

    after = claimed_codes()
    stage2 = stage2_codes()
    lost = sorted(c for c in stage2 if c in before and c not in after)
    if lost:
        sys.stderr.write("REFUSED (already written): these objectives are now claimed by "
                         "nobody: %s\n" % ", ".join(lost))
        return 1
    missing = sorted(c for c in stage2 if c not in after)
    print("\n%d unit(s) changed, %d already done." % (changed, skipped))
    print("Cambridge Stage 2 coverage: %d/%d claimed%s"
          % (len(stage2) - len(missing), len(stage2),
             "" if not missing else " -- MISSING " + ", ".join(missing)))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
