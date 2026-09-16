# -*- coding: utf-8 -*-
"""Grade 3 English: three objectives nothing taught, and four claims that named the wrong work.

RE-MEASURED, NOT PORTED
=======================
Grade 2 taught that a grade's findings do not transfer, so Grade 3 was measured
from scratch. It is the most mature of the three: **50 readings, 12,242 words,
73 outcomes**, and 124 comprehension items across **16 distinct question types**
(Evidence and inference 47, Short answer 37, Literal recall 12, Vocabulary in
context 8, Sequence 5, plus Purpose, Cause and effect, Quotation, Scanning...).
Genres are real and varied: 15 information texts, 10 narratives, 4 poems, 5
dialogues, 3 songs, 2 recounts, realistic fiction, instructions. 102/102 claimed,
no unclaimed codes, no foreign codes.

Neither Grade 1's "one text type ten times" nor Grade 2's "no literary outcome
anywhere" is true here. What Grade 3 has is a smaller, sharper version of the
mapping defect plus three genuine holes.

ONE CLAIM LOOKED LIKE THE WORST OFFENDER AND IS FINE
====================================================
`3Ra.01` (enjoy reading fiction genres, poems, playscripts) and `3Rs.02` (key
features of text structure) both sit on **"Talk about straight lines and
repeating patterns"** -- which reads exactly like the maths word-match that
Grade 2's `2Ri.16` turned out to be. It is not. Unit 8's second reading is **"A
Pattern Poem"** ("One, two, buckle my shoe... Straight and round, patterns
found!") and its comprehension asks *"What repeats in the first three lines of
the pattern poem?"* -- repetition as a feature of text structure, in a unit whose
topic is patterns. Weak wording, real teaching. **Left alone.** Checking it cost
one minute; stripping it would have removed a true claim.

Same verdict, same method, for `3Ri.09` (follow written instructions): it sits on
outcomes about GIVING instructions, but every unit's activities are written
instructions the learner follows, and units 7 and 8 open with spoken instruction
texts. Weak, arguable, left -- and recorded here rather than silently kept.

THE THREE HOLES (zero teaching anywhere in the grade, verified by listing every
writing task, activity, reading and question rather than by regex)
=================================================================
    3Ri.15  Locate relevant information in texts, including using an index.
            <- "Prepare for a contest and write a short report about a topic you
               have chosen."   No index, contents page or glossary exists in the
               grade. This is the THIRD stage running with this hole.
    3Ra.05  Compare different retellings of the same story.
            <- "Tell someone what another person said, using reported speech."
    3Ri.11  Predict story endings based on knowledge of other stories.
            <- "Describe your favourite person and say what makes them special."

3Ra.05 needed no new text. **Unit 9 already carries two retellings of the same
events** and nobody had used them: "The Box of Ideas at School" is a first-person
recount ("*Imagine something better,* I told him") and "The Box of Ideas" is a
third-person narrative of the same box, the same Teacher Yasmin and the same
Sami. The comparison questions below put that pair to work.

FOUR CLAIMS MOVED, because the teaching exists and the outcome did not name it
=============================================================================
    3Ra.04  choose books from blurbs   <- "Talk about your school subjects"
    3Ra.03  share a review of a text   <- "Share your ideas politely"
    3Wc.01  creative writing in fiction and poetry genres
                                       <- "Say what you imagine"
Unit 2 sets **"Writing 7: A Blurb and a Review"** -- whose own prompt explains
what a blurb is for -- and units 4 and 7 set "Your Own Poem" and "Your Own Nature
Poem". Each moves onto an outcome that says so.

POSITION-SAFE. Outcomes, questions, self-checks and readings all land in steps
build-lessons.py declares with a single add().

    python tools/author-english-g3-stage3-gaps-and-mapping.py --dry
    python tools/author-english-g3-stage3-gaps-and-mapping.py
"""

import io
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
UNITS = os.path.join(ROOT, "src", "prototypes", "ehel-academy", "english",
                     "grade-3", "data", "units")
FRAMEWORK = os.path.join(ROOT, "src", "curriculum", "cambridge-english-0058.json")

ORIGIN = "Ehel authoring 2026-09-17 (Cambridge Stage 3 gaps and objective mapping)"
REVIEW = "Needs curriculum review"
SOURCE = "Authored against Cambridge Primary English Stage 3 (LB3/WB3/TR3)"

# ---------------------------------------------------------------------------
# The new outcomes, one per unit that needs one.
# ---------------------------------------------------------------------------
NEW_OUTCOMES = {
    2: {
        "learningOutcome": ("Use a contents page and an index to find one fact quickly, then "
                            "choose a book from its blurb and write a short review of it."),
        "evidence": ("Observed through answering the guide questions, naming which part to use "
                     "for a whole section and which for a single word, and producing a blurb "
                     "and a review in Writing 7."),
        "codes": ["3Ri.15", "3Ra.03", "3Ra.04"],
        "bloom": "Apply",
        "selfCheck": "I can use an index to find a fact, and write a review of a book I chose.",
    },
    4: {
        "learningOutcome": ("Write your own poem about a place, using the shape and repeated "
                            "lines of the poem you read."),
        "evidence": ("Observed through the finished poem in Writing 2 and by naming which "
                     "feature of the model poem it borrows."),
        "codes": ["3Wc.01"],
        "bloom": "Create",
        "selfCheck": "I can write my own poem using the shape of a poem I have read.",
    },
    6: {
        "learningOutcome": ("Predict how a story will end, and say what in the story - or in "
                            "other stories you know - told you."),
        "evidence": ("Observed through the prediction questions on the unit story, each of "
                     "which asks for the evidence rather than the ending."),
        "codes": ["3Ri.11"],
        "bloom": "Analyse",
        "selfCheck": "I can say how I think a story will end and what made me think it.",
    },
    9: {
        "learningOutcome": ("Compare two tellings of the same events and explain how the "
                            "person telling it changes what you learn."),
        "evidence": ("Observed through the comparison questions on 'The Box of Ideas at "
                     "School' and 'The Box of Ideas', naming who tells each one and one "
                     "thing only one of them reveals."),
        "codes": ["3Ra.05"],
        "bloom": "Analyse",
        "selfCheck": "I can compare two tellings of the same events and say how they differ.",
    },
}

# Claims to move OFF, once the new outcome exists to receive them.
MOVE = [
    (2, "lo02", ["3Ra.04"]),
    (2, "lo07", ["3Ri.15"]),
    (5, "lo06", ["3Ra.03"]),
    (6, "lo02", ["3Ri.11"]),
    (9, "lo02", ["3Wc.01"]),
    (9, "lo06", ["3Ra.05"]),
]
# 3Wc.01 moves from unit 9 to unit 4's new outcome -- a cross-unit move, which is
# why MOVE and NEW_OUTCOMES are keyed separately.

# ---------------------------------------------------------------------------
# The one new text. Stage 3 sentences are longer than Stage 1's, and this is a
# reference text rather than a story, so it is laid out the way one is.
# ---------------------------------------------------------------------------
GUIDE = {
    "unit": 2,
    "type": "Reference text",
    "genre": "Information text",
    "title": "Finding It Fast: Contents, Index and Glossary",
    "passage": """When you are researching for a contest, you do not read a whole book. You go
straight to the part you need, and three tools take you there.

The contents page sits at the front. It lists the big sections in the order they
appear, with the page each one begins on. Use it when you want a whole topic.

Contents

1 Animals of the grassland ....... page 4

2 Animals of the forest ....... page 18

3 Animals of the coast ....... page 31

4 Animals of the mountains ....... page 44

The index sits at the back. It lists small things in alphabetical order, with
every page each one appears on. Use it when you want one fact.

Index

cheetah, 6, 9

elephant, 5, 12, 20

zebra, 6, 11

The glossary also sits at the back. It explains the difficult words the book
uses, in alphabetical order, so you do not have to guess from the sentence
around them.

Suppose you need to know how fast a cheetah runs. The index lists cheetah on
pages 6 and 9, so you turn to page 6 and then to page 9. You do not read
pages 1 to 5 on the way.

Suppose instead you are writing about the whole grassland. That is a section,
not a single fact, so the contents page is the right tool, and it sends you to
page 4.""",
    "questions": [
        ("Which of the three tools lists things in alphabetical order with every page they "
         "appear on?",
         "The index",
         "The index sits at the back and lists small things alphabetically, with every page "
         "each one appears on.",
         ["The contents page", "The glossary"]),
        ("The index lists cheetah, 6, 9. What does that tell you to do?",
         "Turn to page 6 and then to page 9",
         "An index entry gives every page the thing appears on, so cheetah, 6, 9 sends you to "
         "both pages.",
         ["Read pages 6 to 9 in order", "Turn to page 69"]),
        ("You are writing about the whole grassland, not one animal. Which tool do you use, "
         "and why?",
         "The contents page, because a whole grassland is a section rather than a single fact",
         "The contents page lists the big sections, so a whole topic is found there; the index "
         "is for one fact.",
         ["The index, because it is alphabetical",
          "The glossary, because it explains hard words"]),
        ("What is the glossary for?",
         "It explains the difficult words the book uses",
         "The glossary sits at the back and explains the book's difficult words in "
         "alphabetical order.",
         ["It lists the sections in order", "It gives every page an animal appears on"]),
    ],
}

# ---------------------------------------------------------------------------
# Prediction (3Ri.11) and retelling comparison (3Ra.05).
#
# EVERY PREDICTION QUESTION ASKS FOR THE EVIDENCE, NOT THE ENDING. The app shows
# the story before its questions, so "how does it end?" is answered from memory
# and tests nothing -- the defect rewritten out of Grades 3 and 4 on 2026-09-11
# and avoided again in Grade 2 yesterday.
# ---------------------------------------------------------------------------
PREDICT = {
    6: [("Amal has no favourite person yet, and then she twice watches Nora help somebody. "
         "What did that tell you about who Amal would write about?",
         "That she would choose Nora",
         "The writer shows Amal noticing Nora twice - the fallen bag, then the hurt boy - "
         "before the writing is due. Noticing is the clue.",
         ["That she would write about Teacher Yasmin",
          "That she would write about Daniel's uncle"]),
        ("Under the tall tree, Nora tells Amal 'you are kind too - you noticed the things "
         "that other people missed'. What did that prepare you for at the end?",
         "That Amal would include herself when asked to describe somebody again",
         "Nora names Amal's own kindness before the last task arrives, so the ending Amal "
         "writes about herself is one the story has already pointed at.",
         ["That Nora would write her description about Amal",
          "That Amal would stop writing altogether"])],
}

COMPARE = {
    9: [("Who is telling 'The Box of Ideas at School', and who is telling 'The Box of Ideas'?",
         "The first is told by a classmate in the room; the second by a narrator outside it",
         "The recount says 'My friend Sami' and 'I told him', so a child in the class is "
         "telling it. The story stands outside and names everyone, including Amal.",
         ["Both are told by Teacher Yasmin",
          "Both are told by Sami"]),
        ("Both tellings say Sami's idea is about flying over the sea. What does the STORY "
         "include that the recount leaves out?",
         "That he would wave at his grandfather",
         "The story quotes Sami's paper - 'I would fly over the sea and wave at my "
         "grandfather' - while the recount gives the cliffs and the fishing boats instead.",
         ["That he would fly past the cliffs",
          "That the whole class smiled"]),
        ("What does only the story show you, because of who is telling it?",
         "Sami alone under a tree the next day, still unsure about his idea",
         "A classmate writing a recount can only report what they saw in the room; a narrator "
         "outside can follow Sami into the playground when nobody is watching.",
         ["What Teacher Yasmin said about every idea having a reason",
          "That Amal clapped softly when Sami read his idea"])],
}


def paragraphs(script):
    return [p.strip() for p in re.split(r"\n{2,}", script) if p.strip()]


ENDS_A_SENTENCE = (".", "!", "?", '"', "”", ":", ";", ",")


def narration_script(passage):
    """Spoken copy: leader dots to a comma, unpunctuated lines gain a stop.

    Same rule and the same reason as Grades 1 and 2 -- narration() flattens
    whitespace, so "1 Animals of the grassland ....... page 4" would run into the
    next entry and the pairings would shift.
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


def stage3_codes():
    fw = load(FRAMEWORK)
    by = fw["objectivesByStage"]
    items = by["3"] if isinstance(by, dict) else by[2]
    return {o["code"] for o in items if o.get("code")}


def claimed_codes():
    out = {}
    for n in range(1, 11):
        for o in load(unit_path(n)).get("outcomes") or []:
            for code in o.get("cambridgeObjectives") or []:
                out.setdefault(code, []).append((n, o["outcomeId"]))
    return out


def spec_for(unit_no):
    return NEW_OUTCOMES.get(unit_no)


def story_id(unit, title_fragment):
    for r in unit["readings"]:
        if title_fragment.lower() in (r.get("title") or "").lower():
            return r["readingId"]
    return None


def main(argv):
    dry = "--dry" in argv
    for a in argv[1:]:
        if a not in ("--dry",):
            sys.stderr.write("REFUSED: unknown argument %r\n" % a)
            return 2

    # Refuse before writing anything if a passage would strand a heading at the
    # foot of a page -- Grade 1's lesson, and this text is full of list lines.
    paras = paragraphs(GUIDE["passage"])
    for i, p in enumerate(paras):
        last_on_page = (i + 1) % 4 == 0
        short = len(p.split()) <= 4 and not p.endswith(ENDS_A_SENTENCE)
        prev_short = i > 0 and len(paras[i - 1].split()) <= 4 and not paras[i - 1].endswith(ENDS_A_SENTENCE)
        if last_on_page and i + 1 < len(paras) and short and not prev_short:
            sys.stderr.write("REFUSED: %r would sit last on a page with its content "
                             "overleaf (paragraph %d).\n" % (p, i + 1))
            return 1

    before = claimed_codes()
    changed = skipped = 0
    plan = []

    for n in range(1, 11):
        if n not in NEW_OUTCOMES and not any(m[0] == n for m in MOVE):
            continue
        path = unit_path(n)
        unit = load(path)
        uid = unit["unit"]["unitId"]

        # ALREADY APPLIED? Two tells, because a unit that only has claims MOVED
        # off it gains nothing this tool stamps with ORIGIN. Unit 5 is exactly
        # that -- it loses 3Ra.03 and receives no outcome, no question and no
        # reading -- so the origin test alone reported it as fresh on every
        # re-run and the move then refused, correctly but unhelpfully: a tool
        # whose second run fails is not idempotent, whatever its docstring says.
        if any(ORIGIN in (o.get("origin") or "") for o in unit["outcomes"]):
            skipped += 1
            continue
        mine = [codes for mu, _s, codes in MOVE if mu == n]
        if mine and not spec_for(n):
            still = {c for o in unit["outcomes"] for c in (o.get("cambridgeObjectives") or [])}
            if not any(c in still for codes in mine for c in codes):
                skipped += 1
                continue

        adds = {"outcome": None, "questions": 0, "reading": None}
        new_comp = []
        out_id = None

        spec = NEW_OUTCOMES.get(n)
        if spec:
            out_id = "%s-lo%02d" % (uid, len(unit["outcomes"]) + 1)
            outcome = {
                "outcomeId": out_id, "unitId": uid,
                "sequence": next_seq(unit["outcomes"], "sequence"),
                "learningOutcome": spec["learningOutcome"],
                "evidenceOfLearning": spec["evidence"],
                "origin": ORIGIN, "reviewStatus": REVIEW, "sourceFile": SOURCE,
                "bloomLevel": spec["bloom"],
                "cambridgeObjectives": list(spec["codes"]),
            }
            adds["outcome"] = out_id

        reading = None
        if GUIDE["unit"] == n:
            read_id = "%s-read%02d" % (uid, len(unit["readings"]) + 1)
            reading = {
                "readingId": read_id, "unitId": uid,
                "sequence": next_seq(unit["readings"], "sequence"),
                "type": GUIDE["type"], "title": GUIDE["title"], "genre": GUIDE["genre"],
                "theme": "finding information without reading a whole book",
                "setting": "Home, online lesson or Grade 3 classroom",
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
                    "questionId": "%s-refq%d" % (uid, k), "unitId": uid,
                    "readingId": read_id, "section": GUIDE["title"],
                    "sequence": next_seq(unit["comprehension"], "sequence") + len(new_comp),
                    "questionType": "Scanning",
                    "question": q, "correctAnswer": a, "distractors": list(wrong),
                    "explanation": why, "marks": 1, "outcomeId": out_id,
                    "difficulty": "Grade 3 core",
                    "origin": ORIGIN, "reviewStatus": REVIEW, "sourceFile": SOURCE,
                })

        for bank, kind, frag in ((PREDICT, "Prediction", "Kindness"),
                                 (COMPARE, "Comparison", "Box of Ideas at School")):
            for k, (q, a, why, wrong) in enumerate(bank.get(n, []), start=1):
                rid = story_id(unit, frag)
                if rid is None:
                    sys.stderr.write("REFUSED: unit %d has no reading matching %r\n" % (n, frag))
                    return 1
                new_comp.append({
                    "questionId": "%s-%sq%d" % (uid, kind[:4].lower(), k), "unitId": uid,
                    "readingId": rid, "section": kind,
                    "sequence": next_seq(unit["comprehension"], "sequence") + len(new_comp),
                    "questionType": "Evidence and inference",
                    "question": q, "correctAnswer": a, "distractors": list(wrong),
                    "explanation": why, "marks": 1, "outcomeId": out_id,
                    "difficulty": "Grade 3 core",
                    "origin": ORIGIN, "reviewStatus": REVIEW, "sourceFile": SOURCE,
                })

        adds["questions"] = len(new_comp)
        plan.append((n, adds))

        if not dry:
            if spec:
                unit["outcomes"].append(outcome)
                unit.setdefault("selfAssessment", []).append({
                    "selfAssessmentId": "%s-self%02d" % (uid, len(unit.get("selfAssessment") or []) + 1),
                    "unitId": uid,
                    "sequence": next_seq(unit.get("selfAssessment") or [], "sequence"),
                    "statement": spec["selfCheck"],
                    "scale": ["Not yet", "Getting there", "Yes, I can"],
                    "outcomeId": out_id,
                    "origin": ORIGIN, "reviewStatus": REVIEW, "sourceFile": SOURCE,
                })
            if reading:
                unit["readings"].append(reading)
            if new_comp:
                unit["comprehension"].extend(new_comp)

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
                            "nothing.\n" % (n, suffix, ", ".join(absent)))
                        return 1
                    o["cambridgeObjectives"] = [c for c in had if c not in codes]
            save(path, unit)
        changed += 1

    for n, a in plan:
        bits = []
        if a["outcome"]:
            bits.append("+ %s" % a["outcome"])
        if a["reading"]:
            bits.append("+ %s" % a["reading"])
        if a["questions"]:
            bits.append("+ %d question(s)" % a["questions"])
        print("unit %-2d %s" % (n, "  ".join(bits) or "(claims moved only)"))

    if dry:
        print("\n--dry: nothing written. %d unit(s) would change, %d already done."
              % (changed, skipped))
        return 0

    after = claimed_codes()
    stage3 = stage3_codes()
    lost = sorted(c for c in stage3 if c in before and c not in after)
    if lost:
        sys.stderr.write("REFUSED (already written): now claimed by nobody: %s\n"
                         % ", ".join(lost))
        return 1
    missing = sorted(c for c in stage3 if c not in after)
    print("\n%d unit(s) changed, %d already done." % (changed, skipped))
    print("Cambridge Stage 3 coverage: %d/%d claimed%s"
          % (len(stage3) - len(missing), len(stage3),
             "" if not missing else " -- MISSING " + ", ".join(missing)))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
