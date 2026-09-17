# -*- coding: utf-8 -*-
"""The 23 Stage 6-8 objectives no outcome claimed, closed one at a time.

WHAT "CLOSED" HAS TO MEAN HERE
==============================
Not a citation. This repo's own worked example is Intensive English reporting a
clean "176/176 objectives cited" while `intonation` appeared zero times in
twenty units - real codes, right stage, all placed, and nothing taught. So every
closure below is a THING A LEARNER DOES, and the objective is claimed by an
outcome that describes that doing.

Each of the 23 was triaged against the grade's own teaching surfaces -
outcomes, grammar, readings, comprehension, activities, speaking, writing -
with dictionaryLinks and vocabularyGroups EXCLUDED, because a dictionary entry
defining the word "homophone" is the metalanguage and not the skill. That
exclusion changed the answer: 6Ww.04 looked covered (nine hits) and every one
was the dictionary entry for the word itself.

ONE is a pure mapping fix. 6Rv.06 ("explain how figurative language creates
imagery and takes understanding beyond the literal") is Grade 6 Unit 1's
existing outcome almost verbatim - "the difference between literal meaning and
figurative meaning (a deeper or hidden meaning)" - so it gets the code and no
new content. Its WRITING twin 6Wv.05 ("use figurative language to evoke an
imaginative response") is NOT: every hit was about reading figurative language,
and no writing task asked for any. Reading and writing the same idea are two
objectives and the course had one.

TWO grades share one objective and it is the one to be honest about. 7Wp.01 and
8Wp.01 are "Sustain a fast, fluent and legible handwriting style". A screen
cannot mark handwriting, and the printable cursive worksheet is gated to Grades
1-4 by a constant that is overloaded and must not be flipped. What closes it
honestly is the task a teacher would actually set - write this by hand, timed,
then judge your own legibility - which is why both are authored as handwriting
tasks with a self-check rather than claimed off the pen animation.

NO POSITION RISK. Grades 6, 7 and 8 have no standalone lesson app - the hard
rule keeps 5-8 on the shell page design, and Grade 5's app is the one
owner-approved exception - so there is no baked-in step count for a new
activity to re-scale. Grade 5 is untouched here anyway: it cites all 92.

New activities carry NO audio key. Every activity in these grades points at a
recorded clip, and inventing a path would either 404 or fall through to the
paid runtime voice on every tap. Narration for these is owed and unpaid.

    python tools/author-english-g6-g8-uncited-objectives.py --dry
    python tools/author-english-g6-g8-uncited-objectives.py
"""

import io
import json
import os
import sys

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except AttributeError:      # pragma: no cover
    pass

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
ENGLISH = os.path.join(ROOT, "src", "prototypes", "ehel-academy", "english")

ORIGIN = "Ehel authoring 2026-09-17 (Stage 6-8 uncited objectives)"
REVIEW = "Needs curriculum review"

# code -> (grade, unit, outcome text, activity title, what the learner does, answer note)
A = "author"
M = "map"

CLOSURES = {
    # ---------------- GRADE 6 ----------------
    "6Rv.06": (M, 6, 1, "literal meaning", None, None, None),
    "6Ri.17": (A, 6, 1,
               "Tell a writer’s voice from a narrator’s voice, and say how you knew.",
               "Activities 7: Whose Voice Is This?",
               "Take the unit’s fable and its information text. For each one, decide whether the words "
               "come from a NARRATOR invented to tell a story, or from the WRITER speaking as "
               "themselves. Write one sentence of evidence for each — a word, a phrase or an opinion "
               "that only that kind of voice would use. Then rewrite the fable’s opening two lines as "
               "if the writer were talking to you directly, and say what was lost.",
               "A narrator is a character in the telling; a writer speaks as themselves. Accept any "
               "evidence quoted from the text that distinguishes the two."),
    "6Ra.04": (A, 6, 8,
               "Explain how two readers can take different things from the same text.",
               "Activities 7: The Same Text, Two Readers",
               "Choose one text from this unit. Describe how it might land for someone reading it in a "
               "different country, and for someone reading it fifty years from now. Write two short "
               "paragraphs, and underline the one detail in the text that you think changes most "
               "between them. Nothing in the text changes — only who is holding it.",
               "Accept any answer that names a reader’s time, place or experience and ties it to a "
               "specific detail of the text."),
    "6SLg.04": (A, 6, 3,
                "Bring quieter voices into a discussion on purpose.",
                "Speaking 7: Make Room for Another Voice",
                # NO BLANKS IN A LINE THE LEARNER SAYS ALOUD. These were written
                # with "___" for a name, and narration() correctly read that as a
                # gap to fill: the emitted script opened "Fill in the blank: What
                # do you think, ...?" for an invitation a child is meant to speak.
                # The transform is right; the source was wrong.
                "In this unit’s wildlife discussion, give yourself one extra job: bring somebody else "
                "in. Use three invitations — “What do you think?”, “We have not heard from you "
                "yet”, “Can you add to that?” — and count how many times you use them. Afterwards say "
                "who spoke most, who spoke least, and whether your invitations changed that.",
                "Accept an honest count and a named effect. Chairing is a skill, not a personality."),
    "6SLm.04": (A, 6, 9,
                "Change your gestures, eye contact and pace to suit the audience.",
                "Speaking 7: The Same Talk, Two Rooms",
                "Give your art presentation twice: once to an adult and once as if to a class of "
                "six-year-olds. Keep the words nearly the same and change only how you use your hands, "
                "your eyes and your speed. Afterwards write down the three things you changed and why "
                "each suited that audience.",
                "Accept any three named non-verbal changes with a reason tied to the audience."),
    "6SLp.04": (A, 6, 8,
                "Choose the medium that suits what you have to say, and justify the choice.",
                "Activities 7: Poster, Slides or Film?",
                "You have to tell your class one thing you learned about media in this unit. Pick ONE "
                "of: a poster, three slides, or a one-minute film. Write four sentences saying why that "
                "medium fits your message better than the other two — think about how long the message "
                "is, whether it needs pictures, and whether it needs your voice. Then make it.",
                "Accept any choice that is justified against the message rather than by preference."),
    "6Wv.05": (A, 6, 9,
               "Use a simile, a metaphor and personification in your own writing, on purpose.",
               "Activities 8: Write It So They See It",
               "Take three plain sentences from your art project description and rewrite each one: the "
               "first with a simile, the second with a metaphor, the third with personification. Keep "
               "the fact the same. Then read both versions to somebody and ask which one they can "
               "picture. If they cannot tell the difference, the image is not doing its work yet.",
               "Accept one of each device, correctly formed, where the original meaning survives."),
    "6Wv.06": (A, 6, 5,
               "Use a word list, a dictionary and a thesaurus to strengthen your own writing.",
               "Activities 7: Upgrade Five Words",
               "Open your opinion essay and find five words you have used that are doing almost no "
               "work — good, big, nice, thing, said. For each one, find two stronger alternatives in a "
               "thesaurus, check what each really means in a dictionary, and choose the one that fits. "
               "Keep your own list of the words you kept: that list is the start of your own "
               "vocabulary book, and it is worth more than any list somebody hands you.",
               "Accept five replacements where the learner can say why the chosen word beat the other."),
    "6Ww.04": (A, 6, 6,
               "Spell homophones and commonly confused words correctly in your own writing.",
               "Activities 7: The Pairs That Catch People Out",
               # "and", never "/". The slash rule reads a list of three or more
               # alternatives as a comma list, so "aloud / allowed, past / passed"
               # was narrated "aloud, allowed, past, passed" - eight words in a row
               # with nothing to say which pairs with which, which is the whole
               # activity. Heard aloud, "and" is what keeps a pair a pair.
               "Learn these four pairs: aloud and allowed, past and passed, advice and advise, "
               "desert and dessert. For each pair write one sentence that uses BOTH words correctly, so the "
               "difference is visible in the sentence itself. Then look back at your own writing from "
               "this unit and check every one you used.",
               "aloud = out loud, allowed = permitted; past = time gone, passed = the verb; advice = "
               "the noun, advise = the verb; desert = dry land, dessert = pudding."),
    "6Ww.07": (A, 6, 2,
               "Keep a spelling log and use tools to check the words you get wrong.",
               "Activities 7: Start Your Spelling Log",
               "Make a page you will keep for the rest of the year. Every time a word is marked wrong "
               "— in this unit or any other — write the wrong version, look the word up (a dictionary, "
               "or a spell checker that tells you what it changed), and write the correct version "
               "beside it. Test yourself on the last five every Friday. A word only leaves the log "
               "when you have spelled it right twice in a row without looking.",
               "The log itself is the evidence. Accept any consistent record with corrections and a "
               "re-test."),

    # ---------------- GRADE 7 ----------------
    "7Ra.01": (A, 7, 5,
               "Read widely and say what you enjoyed about each kind of text.",
               "Activities 7: Five Kinds of Reading",
               "Over this unit, read five things that are not the same kind: a news article, a poem, a "
               "set of instructions, part of a story, and something you chose yourself. Write one "
               "sentence on each saying what it was like to read — not what it was about. Then say "
               "which one you would read more of, and why.",
               "Accept any five distinct text types with a response about the READING experience "
               "rather than a summary."),
    "7Ra.03": (A, 7, 6,
               "Choose a writer or a genre unlike your last one, and compare the two.",
               "Activities 7: Read Against Your Own Grain",
               "Think of the last thing you read for pleasure. Now deliberately choose something "
               "different — a different writer, or a genre you usually avoid. Read at least the first "
               "few pages. Then write a short comparison: what the two ask of a reader, what each one "
               "does that the other does not, and whether the new one is worth continuing.",
               "Accept any genuine contrast between two named texts, including a decision not to "
               "continue, provided it is reasoned."),
    "7Ra.04": (A, 7, 8,
               "Explain how readers decide what to read, including how they are influenced.",
               "Activities 7: Why That One?",
               "Ask two people what made them start the last thing they read — a cover, a "
               "recommendation, a headline, an algorithm, a set text. Write down their answers. Then "
               "write a paragraph on which of those reasons are the reader’s own and which belong to "
               "somebody who wanted them to read it. This unit is about media: the same question "
               "applies to what appears in your feed.",
               "Accept any answer distinguishing a reader’s own choice from an influenced one."),
    "7Rg.01": (A, 7, 9,
               "Comment on how a writer uses punctuation to create an effect.",
               "Activities 7: What the Punctuation Does",
               "Find three places in this unit’s texts where punctuation is doing more than grammar: "
               "an ellipsis that leaves something hanging, a dash that interrupts, a full stop where "
               "you expected the sentence to run on. For each, write what the effect is, then rewrite "
               "the line with ordinary punctuation and say what was lost.",
               "Accept any three marks with a named effect and a before/after comparison."),
    "7Rg.04": (A, 7, 1,
               "Comment on why a writer uses non-standard English.",
               "Activities 7: When the Writer Breaks the Rule",
               "Writers put dialect, slang and half-finished sentences into characters’ mouths on "
               "purpose. Find two places in this unit’s family-history texts where the English is not "
               "standard. For each, say who is speaking, what it tells you about them, and what would "
               "change if it were corrected. Then write two lines of dialogue for a relative of your "
               "own, in the English they actually use.",
               "Accept any two examples where the learner ties the non-standard form to character, "
               "place or relationship rather than to error."),
    "7Rg.05": (A, 7, 2,
               "Identify what makes language formal or informal, and switch between them.",
               "Activities 7: Same Message, Two Registers",
               "Write one invitation to this unit’s festival twice: once to a head teacher, once to a "
               "close friend. Keep the facts identical. Then list what actually changed — contractions, "
               "how you greeted them, whether you used idioms, how long the sentences got. Those "
               "differences are register, and naming them is the skill.",
               "Accept any pair where the learner can name at least three concrete differences."),
    "7SLp.02": (A, 7, 4,
                "Read an unseen text aloud fluently by looking ahead as you speak.",
                "Speaking 7: Read One Line Ahead",
                "Ask somebody to hand you a short text you have not seen. Read it aloud once, cold. "
                "Then read it again, this time deliberately letting your eyes run to the END of each "
                "line while your voice is still finishing the one before. Record both. The second "
                "should have fewer stumbles at commas and full stops, because you saw them coming.",
                "The comparison is the evidence. Accept any honest account of what changed between "
                "the two readings."),
    "7SLp.03": (A, 7, 1,
                "Use speech, gesture and movement in drama to show what a text means.",
                "Speaking 8: Play It, Do Not Just Say It",
                "Take the conflict scene from this unit’s role-play and perform a short moment of it "
                "twice: once standing still and reading the words, once using where you stand, what "
                "your hands do, and when you turn away. Ask your listener what they understood about "
                "the characters the second time that they did not the first.",
                "Accept any answer where a physical choice is tied to a meaning in the text."),
    "7Wc.01": (A, 7, 10,
               "Write in a range of fiction genres and types of poem, and compare what each demands.",
               "Activities 7: The Forms You Have Written",
               "Gather what you wrote across Grade 7 — the poem, the story opening, the article, the "
               "letter. Lay them side by side and write a paragraph on what each FORM made you do "
               "differently: line length, how much you could leave out, who you were speaking to. Then "
               "write one short new piece in a form you have not tried this year.",
               "Accept any comparison naming form-specific demands, plus one new piece in a new form."),
    "7Wp.01": (A, 7, 7,
               "Write at length by hand, fast enough and clearly enough to be read.",
               "Activities 7: Ten Minutes, By Hand",
               "Take this unit’s careers writing task and do the first draft ON PAPER, by hand, in "
               "ten minutes without stopping to correct. Then swap with somebody — or leave it a day "
               "and read it yourself. Mark every word that cannot be read at a glance, and write those "
               "words out again slowly. Speed is worth nothing if the reader has to stop.",
               "Legibility is judged by a second reader, not by the writer. Accept the marked draft as "
               "the evidence."),

    # ---------------- GRADE 8 ----------------
    "8Rg.04": (A, 8, 1,
               "Explain why a writer moves between standard and non-standard English.",
               "Activities 7: Two Englishes, One Text",
               "This unit is about how people communicate. Find a text — in the unit or outside it — "
               "where the writer uses both standard English and something else: dialect, slang, texting "
               "shorthand, another language. Write about what each one is doing there: who it includes, "
               "who it shuts out, and what the switch itself tells you. Then write a short exchange of "
               "your own where a character switches, and say what the switch shows.",
               "Accept any answer treating both varieties as choices with an effect, never one as "
               "correct and the other as wrong."),
    "8SLp.02": (A, 8, 8,
                "Read an unseen text aloud fluently by looking ahead as you speak.",
                "Speaking 7: Sight-Read a Story",
                "Have somebody choose a page of a story you have not read. Read it aloud cold, then "
                "again after one silent scan in which you look only for the punctuation and the names. "
                "Compare the two: the second reading should phrase whole clauses instead of single "
                "words, because you already know where each one ends.",
                "Accept any honest comparison naming what the silent scan changed."),
    "8Wp.01": (A, 8, 7,
               "Sustain fast, legible handwriting over a long piece.",
               "Activities 7: The Handwritten Draft",
               "Write this unit’s account of a historical figure by hand, in one sitting, aiming for a "
               "full side without stopping. Then read it back the next day and mark anywhere your "
               "writing broke down — usually where you sped up or where your hand tired. Those places, "
               "not the neat opening, are what to practise.",
               "Accept the marked handwritten piece. The evidence is the learner finding their own "
               "breakdown points."),
}


def load(p):
    with io.open(p, encoding="utf-8") as fh:
        return json.load(fh)


def save(p, obj):
    io.open(p, "w", encoding="utf-8", newline="\n").write(
        json.dumps(obj, indent=2, ensure_ascii=False) + "\n")


def unit_path(g, n):
    return os.path.join(ENGLISH, "grade-%d" % g, "data", "units", "unit-%d.json" % n)


def apply_map(unit, code, anchor):
    for o in unit.get("outcomes") or []:
        if anchor in (o.get("learningOutcome") or ""):
            if code in (o.get("cambridgeObjectives") or []):
                return "skip"
            o.setdefault("cambridgeObjectives", []).append(code)
            return "ok"
    return None


def apply_author(unit, code, g, n, otext, atitle, ainstr, ans):
    outs = unit.setdefault("outcomes", [])
    acts = unit.setdefault("activities", [])
    if any(code in (o.get("cambridgeObjectives") or []) for o in outs):
        return "skip"
    uid = unit["unit"].get("unitId") or ("eng-g%02d-u%02d" % (g, n))
    oid = "%s-lo%02d" % (uid, len(outs) + 1)
    outs.append({
        "outcomeId": oid, "unitId": uid, "sequence": len(outs) + 1,
        "learningOutcome": otext,
        "bloomLevel": "Apply and analyse",
        "evidenceOfLearning": "The activity named in this outcome, completed and checked",
        "cambridgeObjectives": [code],
        "origin": ORIGIN, "reviewStatus": REVIEW,
        "sourceFile": "Stage %d uncited-objective closure" % g,
    })
    # NO audio key: see the module docstring.
    acts.append({
        "activityId": "%s-act%02d" % (uid, len(acts) + 1),
        "unitId": uid, "sequence": len(acts) + 1,
        "title": atitle, "outcomeId": oid,
        "activityType": "Guided practice",
        "instructionsAndItems": ainstr,
        "answerSummary": ans,
        "deliveryMode": "Online or workbook",
        "origin": ORIGIN, "reviewStatus": REVIEW,
        "sourceFile": "Stage %d uncited-objective closure" % g,
    })
    return "ok"


def main(argv):
    dry = "--dry" in argv
    for a in argv[1:]:
        if a != "--dry":
            sys.stderr.write("REFUSED: unknown argument %r\n" % a)
            return 2

    # ---- PRE-FLIGHT: refuse before writing anything ------------------------
    problems = []
    if len(CLOSURES) != 23:
        problems.append("CLOSURES holds %d entries, expected 23" % len(CLOSURES))
    for code, spec in sorted(CLOSURES.items()):
        kind, g, n = spec[0], spec[1], spec[2]
        if not code.startswith(str(g)):
            problems.append("%s is not a Stage %d code" % (code, g))
        p = unit_path(g, n)
        if not os.path.isfile(p):
            problems.append("%s: grade %d unit %d does not exist" % (code, g, n))
            continue
        unit = load(p)
        if kind == M:
            if not any(spec[3] in (o.get("learningOutcome") or "")
                       for o in unit.get("outcomes") or []):
                problems.append("%s: no outcome in grade %d unit %d contains %r - the anchor moved"
                                % (code, g, n, spec[3]))
        else:
            if not spec[3] or not spec[4] or not spec[5]:
                problems.append("%s: incomplete authored closure" % code)
    if problems:
        sys.stderr.write("REFUSED: nothing written.\n")
        for x in problems:
            sys.stderr.write("  - %s\n" % x)
        return 1

    touched, done = {}, 0
    for code, spec in sorted(CLOSURES.items()):
        kind, g, n = spec[0], spec[1], spec[2]
        p = unit_path(g, n)
        unit = touched.get(p) or load(p)
        r = (apply_map(unit, code, spec[3]) if kind == M
             else apply_author(unit, code, g, n, spec[3], spec[4], spec[5], spec[6]))
        if r is None:
            sys.stderr.write("REFUSED mid-run: %s anchor vanished\n" % code)
            return 1
        touched[p] = unit
        if r == "ok":
            done += 1
        print("  %-9s %-6s grade %d unit %-3d %s"
              % (code, "map" if kind == M else "author", g, n, r))

    if not dry:
        for p, unit in touched.items():
            save(p, unit)
    print("\n  %s %d closure(s) across %d unit file(s)"
          % ("would apply" if dry else "applied", done, len(touched)))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
