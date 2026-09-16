# -*- coding: utf-8 -*-
"""Grade 4 English: two objectives nothing taught, one claim on the wrong outcome, one thin.

GRADE 4 IS THE HEALTHIEST OF THE FOUR, AND THE REASON IS ON THE RECORD
======================================================================
Re-measured from scratch: 76 outcomes, 46 readings (13,327 words), 129
comprehension items across 16 question types, and genres that actually differ --
20 information texts, 8 narratives, 2 poems, 5 dialogues, a **playscript**, a
**persuasive text**, a rhyme, recounts, instructions. 106/106 claimed, nothing
unclaimed, no foreign codes.

Grades 1-3 each had objectives whose teaching did not exist, or existed under an
outcome that never named it. Grade 4 mostly does not, **because a gap-closing
pass already ran on 2026-09-11** (`author-english-g4-stage4-gaps.py`, origin
"Stage 4 gaps: prediction, viewpoint..."). Checked item by item, that pass hung
each new item on an outcome that ALREADY claims the matching code:

    U5 lo07  claims 4Wc.05  and owns "Writing 7: A Different Ending for The Spiral Cave"
    U7 lo02  claims 4Wc.07  and owns "Writing 7: A Playscript - The Queen and the Lion"
    U9 lo08  claims 4Wc.06  and owns "Writing 7: Noah's Diary"
    U7 lo08  claims 4Ri.17  and owns "Who is telling 'Where My Family Comes From'?"
    U5 lo06  claims 4Ri.10  and owns a prediction question that asks for the CLUE

So four claims that read as mis-pointed are backed by teaching in the same
outcome. **The outcome WORDING is what never caught up** -- "Describe how people
behave, using words like gentle, selfish, generous" is the home of a playscript
task -- and that is a documentation weakness, not a false claim. Left alone, and
recorded here so the next reader does not re-open it.

WHAT IS ACTUALLY WRONG
======================
    4Ra.03  Develop preferences about favourite books and share recommendations
            <- "Evaluate your own and a partner's work, proofread the final
               draft..."   NOTHING in the grade asks a learner to recommend a
               book. A genuine hole.
    4Ri.16  Recognise, compare and contrast the themes and features of texts
            <- "Compare foods and choices."   Every comparison in the grade
               compares foods, places, or two things inside ONE text. No text is
               ever compared with another. A genuine hole -- with ideal material
               already present and unused: unit 10 reads five capstone texts
               across THREE text types and never compares them.
    4Ri.13  Skim to gain an overall sense of a text
            <- U8 lo01 "Name and describe many tools, machines, and everyday
               items."   The teaching EXISTS ("Skim 'A Look at the Stars'
               quickly. What is the whole text about?") but hangs on U8 lo05,
               not on the outcome that claims the code. A real mis-point, and
               the only one in the grade.
    4Wc.03  Write character profiles to inform story writing
            <- "Write a role reflection, a short newspaper article, and an
               advice poster."   A role reflection is about a JOB. The nearest
               real teaching, "Picture the Attic", is a description and is
               already claimed as 4Wc.04. Thin rather than false, so a profile
               task is authored rather than the claim being stripped.

FOUR TIMES THIS SESSION A "GAP" TURNED OUT TAUGHT -- retell, write-a-poem,
organisational features, and skim -- every one of them found by LISTING the
items rather than searching for the metalanguage. Everything above was checked
that way.

POSITION-SAFE. Outcomes, questions, writing tasks and self-checks all land in
steps build-lessons.py declares with a single add().

    python tools/author-english-g4-stage4-thin-claims.py --dry
    python tools/author-english-g4-stage4-thin-claims.py
"""

import io
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
UNITS = os.path.join(ROOT, "src", "prototypes", "ehel-academy", "english",
                     "grade-4", "data", "units")
FRAMEWORK = os.path.join(ROOT, "src", "curriculum", "cambridge-english-0058.json")

ORIGIN = "Ehel authoring 2026-09-17 (Cambridge Stage 4 thin claims and two gaps)"
REVIEW = "Needs curriculum review"
SOURCE = "Authored against Cambridge Primary English Stage 4 (LB4/WB4/TR4)"

NEW_OUTCOMES = {
    5: {
        "learningOutcome": ("Choose a book you have read, say what you liked about it, and "
                            "recommend it to somebody else with a reason."),
        "evidence": ("Observed through the written recommendation, which must name the book, "
                     "give one reason a particular reader would enjoy it, and avoid giving "
                     "away the ending."),
        "codes": ["4Ra.03"], "bloom": "Evaluate",
        "selfCheck": "I can recommend a book to someone and give a real reason.",
    },
    6: {
        "learningOutcome": ("Write a character profile for a person in the unit's story, and "
                            "use it to plan your own writing."),
        "evidence": ("Observed through the completed profile - name, what they do, how they "
                     "behave, and one line of evidence from the story for each."),
        "codes": ["4Wc.03"], "bloom": "Create",
        "selfCheck": "I can write a character profile and use it to plan my own writing.",
    },
    8: {
        "learningOutcome": ("Skim a text quickly to get its overall sense before reading it "
                            "closely."),
        "evidence": ("Observed through answering what a whole text is about after a quick "
                     "first pass, before any close reading."),
        "codes": ["4Ri.13"], "bloom": "Understand",
        "selfCheck": "I can skim a text and say what the whole thing is about.",
    },
    10: {
        "learningOutcome": ("Compare two capstone texts of different types and explain how "
                            "their features and purposes differ."),
        "evidence": ("Observed through the comparison questions on the project brief and the "
                     "poem, naming what each uses its order for and why each chooses its "
                     "kind of language."),
        "codes": ["4Ri.16"], "bloom": "Analyse",
        "selfCheck": "I can compare two kinds of text and say how their features differ.",
    },
}

MOVE = [
    (3,  "lo07", ["4Ri.16"]),
    (6,  "lo07", ["4Wc.03"]),
    (8,  "lo01", ["4Ri.13"]),
    (10, "lo06", ["4Ra.03"]),
]

# The skim question already exists and hangs on U8 lo05. Re-point the ITEM too,
# so the outcome that CLAIMS 4Ri.13 is also the outcome that OWNS the teaching.
# A claim, an outcome and an item that do not agree is the whole defect class.
# Matched WITHOUT the quotation marks. The first version of this string used
# typographic DOUBLE quotes and the data uses SINGLE ones (U+2018), so it matched
# nothing -- and the refusal that caused arrived mid-loop, after three units had
# already been written. Match on the words; the quote style is not the identity.
REPOINT_ITEM = {"unit": 8, "match": "Skim", "also": "A Look at the Stars"}

NEW_WRITING = {
    5: {
        "title": "Writing 8: Recommend a Book",
        "prompt": ("Choose a book you have read this year, from your shelf or anywhere else. "
                   "Write five or six sentences recommending it to somebody in your class. "
                   "Name the book, say what kind of reader would enjoy it, and give one real "
                   "reason. Do not give away the ending."),
        "model": ("I would recommend ______ to anyone who likes ______, because ______."),
        "starter": "I would recommend",
        "length": "5-6 sentences",
        "example": ["I would recommend The Spiral Cave to anyone who likes adventures,",
                    "because the cave keeps turning and you never know what is round the next bend.",
                    "It is best for a reader who does not mind being a little frightened.",
                    "I will not say how they get out."],
    },
    6: {
        "title": "Writing 7: A Character Profile",
        "prompt": ("Choose Amal or Nora from “The Community Parade” and write a "
                   "profile of them. Use four headings: Name, What they do, How they behave, "
                   "and Evidence. Under Evidence, copy one line from the story that shows it. "
                   "Then write one sentence saying how your profile would help you write a "
                   "new story about that person."),
        "model": ("Name: ______\nWhat they do: ______\nHow they behave: ______\n"
                  "Evidence: “______”"),
        "starter": "Name:",
        "length": "4 headings and 1 sentence",
        "example": ["Name: Nora",
                    "What they do: She makes a poster about the caretaker's job.",
                    "How they behave: She notices the jobs other people forget.",
                    "Evidence: “Mine says, 'Caretaker - keeps our school clean.'”"],
    },
}

# Comparison questions (4Ri.16), written against the two texts after reading
# them: the project brief is numbered instructions with deadlines and marks; the
# poem is nine stanzas, one per unit of the year, naming none of them directly.
COMPARE = {
    10: [("Both 'The Year 4 Exhibition: Project Brief' and the poem 'Nine Rooms' put things "
          "in a numbered order. What does each one use its order for?",
          "The brief orders the steps you must do; the poem orders the nine units of the year",
          "The brief's four parts are things to complete in order. The poem's nine rooms are "
          "the nine units, walked through one at a time.",
          ["Both order the days of the week",
           "The brief orders rooms and the poem orders parts"]),
         ("The project brief says 'Choose', 'Build', 'Write' and 'Print'. What kind of text "
          "uses verbs like that, and why?",
          "Instructions, because they tell the reader what to do",
          "Verbs that give an order are the giveaway feature of instructions: the text exists "
          "to make something happen.",
          ["A poem, because it describes a feeling",
           "A story, because it tells you what happened next"]),
         ("Room Five 'began to gallop and to race, then curled into a spiral underground'. "
          "Why does the poem say it that way instead of naming the unit?",
          "Because a poem shows a thing through images rather than naming it",
          "The galloping and the spiral are unit 5's horse and its cave. A poem points at "
          "them; the project brief would simply have written the number.",
          ["Because the poet could not remember the unit",
           "Because that unit has no name"])],
}


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


def stage4_codes():
    fw = load(FRAMEWORK)
    by = fw["objectivesByStage"]
    items = by["4"] if isinstance(by, dict) else by[3]
    return {o["code"] for o in items if o.get("code")}


def already_applied(unit, n):
    """Has this unit already been done? TWO tells, and the pre-flight needs both.

    A unit that gains an outcome carries this tool's ORIGIN. A unit that only
    LOSES a claim (unit 3 here, unit 5 in the Grade 3 tool) carries nothing, so
    the origin test alone calls it fresh for ever and the move then refuses. The
    pre-flight used only the first tell and reported a clean second run as a
    failure -- the same shape the Grade 3 tool was fixed for, reintroduced in a
    new place because the check was duplicated instead of shared.
    """
    if any(ORIGIN in (o.get("origin") or "") for o in unit["outcomes"]):
        return True
    mine = [codes for mu, _s, codes in MOVE if mu == n]
    if mine and n not in NEW_OUTCOMES:
        still = {c for o in unit["outcomes"] for c in (o.get("cambridgeObjectives") or [])}
        return not any(c in still for codes in mine for c in codes)
    return False


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
    touched = sorted(set(NEW_OUTCOMES) | {m[0] for m in MOVE})

    # ---- PRE-FLIGHT: every refusable condition, before a single file is written.
    #
    # The first run of this tool refused on unit 8 -- and by then units 3, 5 and 6
    # were already saved, because the loop writes each unit as it goes. A tool
    # that refuses HALFWAY is worse than one that refuses at the start: the tree
    # is left in a state no run produced, and the operator has to know to revert.
    # Nothing below writes; it only checks.
    problems = []
    for n in touched:
        unit = load(unit_path(n))
        if already_applied(unit, n):
            continue
        for mu, suffix, codes in MOVE:
            if mu != n:
                continue
            target = [o for o in unit["outcomes"] if o["outcomeId"].endswith("-" + suffix)]
            if not target:
                problems.append("unit %d has no outcome ending -%s" % (n, suffix))
                continue
            for o in target:
                had = o.get("cambridgeObjectives") or []
                absent = [c for c in codes if c not in had]
                if absent:
                    problems.append("unit %d %s does not claim %s"
                                    % (n, suffix, ", ".join(absent)))
        if n in COMPARE and not any("Project Brief" in (r.get("title") or "")
                                    for r in unit["readings"]):
            problems.append("unit %d has no Project Brief reading to anchor comparisons to" % n)
        if REPOINT_ITEM["unit"] == n:
            hits = [c for c in unit["comprehension"]
                    if REPOINT_ITEM["match"] in (c.get("question") or "")
                    and REPOINT_ITEM["also"] in (c.get("question") or "")]
            if not hits:
                problems.append("unit %d has no question matching %r + %r"
                                % (n, REPOINT_ITEM["match"], REPOINT_ITEM["also"]))
    if problems:
        sys.stderr.write("REFUSED before writing anything:\n")
        for p in problems:
            sys.stderr.write("  - %s\n" % p)
        return 1

    for n in touched:
        path = unit_path(n)
        unit = load(path)
        uid = unit["unit"]["unitId"]
        spec = NEW_OUTCOMES.get(n)

        if already_applied(unit, n):     # one definition, shared with the pre-flight
            skipped += 1
            continue

        out_id = None
        adds = {"outcome": None, "writing": None, "questions": 0, "repointed": 0}
        if spec:
            out_id = "%s-lo%02d" % (uid, len(unit["outcomes"]) + 1)
            outcome = {
                "outcomeId": out_id, "unitId": uid,
                "sequence": next_seq(unit["outcomes"], "sequence"),
                "learningOutcome": spec["learningOutcome"],
                "evidenceOfLearning": spec["evidence"],
                "origin": ORIGIN, "reviewStatus": REVIEW, "sourceFile": SOURCE,
                "bloomLevel": spec["bloom"], "cambridgeObjectives": list(spec["codes"]),
            }
            adds["outcome"] = out_id

        new_write = None
        w = NEW_WRITING.get(n)
        if w:
            new_write = {
                "writingId": "%s-write%02d" % (uid, len(unit["writing"]) + 1),
                "unitId": uid, "sequence": next_seq(unit["writing"], "sequence"),
                "practiceType": "Grade 4 writing",
                "title": w["title"], "promptAndInstructions": w["prompt"],
                "modelText": w["model"], "sentenceStarter": w["starter"],
                "expectedLength": w["length"],
                "completedExample": {"items": list(w["example"])},
                "successCriteria": ("I named the text or person; I gave a real reason; I used "
                                    "evidence rather than opinion alone; I read it back and "
                                    "fixed what did not make sense"),
                "support": ("Re-read the story or book first. Talk your answer through before "
                            "writing it."),
                "extension": "Write a second one for a different book or person and compare them.",
                "rubricId": "rub-g4-writing-v1", "outcomeId": out_id,
                "origin": ORIGIN, "reviewStatus": REVIEW, "sourceFile": SOURCE,
            }
            adds["writing"] = new_write["writingId"]

        new_comp = []
        for k, (q, a, why, wrong) in enumerate(COMPARE.get(n, []), start=1):
            rid = next((r["readingId"] for r in unit["readings"]
                        if "Project Brief" in (r.get("title") or "")), None)
            if rid is None:
                sys.stderr.write("REFUSED: unit %d has no Project Brief reading to anchor "
                                 "the comparison questions to.\n" % n)
                return 1
            new_comp.append({
                "questionId": "%s-cmpq%d" % (uid, k), "unitId": uid, "readingId": rid,
                "section": "Comparing two kinds of text",
                "sequence": next_seq(unit["comprehension"], "sequence") + k - 1,
                "questionType": "Compare and contrast",
                "question": q, "correctAnswer": a, "distractors": list(wrong),
                "explanation": why, "marks": 1, "outcomeId": out_id,
                "difficulty": "Grade 4 core",
                "origin": ORIGIN, "reviewStatus": REVIEW, "sourceFile": SOURCE,
            })
        adds["questions"] = len(new_comp)

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
            if new_write:
                unit["writing"].append(new_write)
            if new_comp:
                unit["comprehension"].extend(new_comp)

            if REPOINT_ITEM["unit"] == n and out_id:
                hit = [c for c in unit["comprehension"]
                       if REPOINT_ITEM["match"] in (c.get("question") or "")
                       and REPOINT_ITEM["also"] in (c.get("question") or "")]
                for c in hit:            # pre-flight proved this is non-empty
                    c["outcomeId"] = out_id
                adds["repointed"] = len(hit)

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
                        sys.stderr.write("REFUSED: unit %d %s does not claim %s.\n"
                                         % (n, suffix, ", ".join(absent)))
                        return 1
                    o["cambridgeObjectives"] = [c for c in had if c not in codes]
            save(path, unit)
        changed += 1
        plan.append((n, adds))

    for n, a in plan:
        bits = []
        if a["outcome"]: bits.append("+ %s" % a["outcome"])
        if a["writing"]: bits.append("+ %s" % a["writing"])
        if a["questions"]: bits.append("+ %d question(s)" % a["questions"])
        if a["repointed"]: bits.append("re-pointed %d item(s)" % a["repointed"])
        print("unit %-2d %s" % (n, "  ".join(bits) or "(claims moved only)"))

    if dry:
        print("\n--dry: nothing written. %d unit(s) would change, %d already done."
              % (changed, skipped))
        return 0

    after = claimed_codes()
    stage4 = stage4_codes()
    lost = sorted(c for c in stage4 if c in before and c not in after)
    if lost:
        sys.stderr.write("REFUSED (already written): now claimed by nobody: %s\n"
                         % ", ".join(lost))
        return 1
    missing = sorted(c for c in stage4 if c not in after)
    print("\n%d unit(s) changed, %d already done." % (changed, skipped))
    print("Cambridge Stage 4 coverage: %d/%d claimed%s"
          % (len(stage4) - len(missing), len(stage4),
             "" if not missing else " -- MISSING " + ", ".join(missing)))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
