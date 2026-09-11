# -*- coding: utf-8 -*-
"""Apply the content review of English Grade 5 (2026-09-11).

WHAT THIS IS. The same review Grades 1-4 had the same day
(repair-english-g1-4-review-20260911.py), run over the ten Grade 5 units:
every reading, question, key, grammar exercise, activity, writing model and
speaking task, each answer checked against its text and each key against its
options. The old text is asserted, so an edit whose target has moved is
refused rather than guessed.

The classes of defect:
  - exercises that point at material they never give: "the four sentences",
    "all twenty-five unit words", with no sentences and no list (Units 4, 6, 7)
  - keys that disagree with their own exercise: an "opposite" that is not one
    (grateful/irritable, miserable/prosperous), a verb said to have no
    adjective that has one (exaggerated), a judgement word that is not in the
    sentence, a count of ten un- words where the list gave nine
  - gaps with two right answers and a key that allows one (someone / no one,
    the modals, the subordinating conjunctions)
  - a model or key that contradicts the story: the class did not REPAINT the
    mural, they painted a new one; Omar's back ached, not his feet; a model
    line quoted as the blog that is not what the blog says; a reading that
    calls a claim "from the poster" that the poster never makes
  - a story part that opens by answering a question nobody asked (Unit 9,
    part 3 begins "Because the forest is not endless")
  - a real town named as the home of lemurs and gibbons (Unit 9). The place
    name is removed; the species are left and reported, because changing the
    animals rewrites the unit.

What is NOT here: the writing models that DESCRIBE a good answer rather than
show one. Every Grade 5 writing task also carries a completedExample, which
is the worked answer; the shell draws both, and the Grade 5 app now shows the
completed example behind "See an example" (writeExample in its config).

    python tools/repair-english-g5-review-20260911.py          # dry run
    python tools/repair-english-g5-review-20260911.py --write

Idempotent: an edit already applied is reported and skipped.
"""
import io
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UNITS = os.path.join(ROOT, "src", "prototypes", "ehel-academy", "english", "grade-5", "data", "units")
LQ, RQ = "“", "”"

EDITS = []


def S(n, path, old, new):          # substring at path
    EDITS.append(("S", n, path, old, new))


def W(n, path, contains, new):     # whole value at path, where it still contains `contains`
    EDITS.append(("W", n, path, contains, new))


def K(n, qid, old, new):           # substring in the answer-key row for this contentId
    EDITS.append(("K", n, qid, old, new))


def U(n, old, new):                # substring in every string of the unit
    EDITS.append(("U", n, None, old, new))


def word_list(words, count):
    if len(words) != count or len(set(words)) != count:
        sys.exit("REFUSED: a word list meant to hold %d words holds %d" % (count, len(set(words))))
    return ", ".join(sorted(words))


# ================================================================ UNIT 1
# "sorry about" is what grammar 3 teaches for something you did yourself
U(1, "sorry for the broken window", "sorry about the broken window")
W(1, "comprehension[4].explanation", "The paragraph after the sandstorm lists",
  "The lines after the sandstorm list the damage: crumbled walls and missing roofs, and worst of all the buried well.")

# ================================================================ UNIT 2
# Part B 3 and 5 took someone and no one equally; each now forces one
S(2, "grammar[2].practice", "3. __________ remembered to bring the map.",
  "3. Unfortunately, __________ remembered to bring the map, so we got lost.")
S(2, "grammar[2].practice", "5. __________ volunteered to clean the classroom.",
  "5. __________ volunteered to clean the classroom, so the teacher thanked her.")
S(2, "grammar[2].practice", "3. No one remembered to bring the map.",
  "3. Unfortunately, no one remembered to bring the map, so we got lost.")
S(2, "grammar[2].practice", "5. Someone volunteered to clean the classroom.",
  "5. Someone volunteered to clean the classroom, so the teacher thanked her.")
K(2, "eng-g05-t01-u02-act06", "5 to supply again. Prefix", "5 to supply again, 6 to read wrongly. Prefix")
# the model line is offered as a line from the blog, and the blog does not say it
S(2, "speaking[3].instructionsAndModelLines",
  'Model line: "We cooperated, shared ideas and wrote a plan, but not everyone agrees with us yet."',
  'Model line: "We cooperated, shared ideas and wrote a plan. Not everyone agrees yet, but we are working on it."')

# ================================================================ UNIT 4
W(4, "grammar[3].practice", "the four target sentences for Part A are not listed",
  "Part A: Delete the unnecessary commas from these four sentences and write out the corrected version. "
  "1. The girl, who won the race, is my cousin. 2. The shop, that sells fresh bread, opens at six. "
  "3. The legend, which Grandma told us, is about a lion. 4. The explorers, who found the well, were given a prize. "
  "Part B: For sentence 1, explain how the meaning shifts once the commas go. "
  "Part C: Proofread your own legend for stray commas around defining clauses.\n\n"
  "Answer key (self-check): Part A – 1. The girl who won the race is my cousin. "
  "2. The shop that sells fresh bread opens at six. 3. The legend which Grandma told us is about a lion. "
  "4. The explorers who found the well were given a prize. Part B – with the commas, the clause is only an "
  "extra fact about a girl we already know; without them, it tells us which girl is meant. "
  "Part C checks " + LQ + "your own legend," + RQ + " so self-check by scanning every who/which/that clause you "
  "wrote and confirming no commas surround it unless you truly intend a non-essential aside.")
S(4, "grammar[4].practice", "Part A: Repair four faulty sentences and name the mistake in each.",
  "Part A: Repair these four faulty sentences and name the mistake in each. 1. The girl, who scored the goal, "
  "celebrated. 2. The book who I borrowed was interesting. 3. Made the discovery the scientist won an award. "
  "4. The cat which it caught the mouse was fast.")
# grateful/irritable and miserable/prosperous are not opposites
S(4, "grammar[5].ruleAndExamples",
  "dreadful and delightful, miserable and prosperous, hasty and careful, reluctant and eager, grateful and irritable.",
  "dreadful and delightful, miserable and cheerful, prosperous and poor, hasty and careful, reluctant and eager, irritable and patient.")
S(4, "grammar[5].practice", "Write the opposite of dreadful, miserable, hasty, reluctant and grateful.",
  "Write the opposite of dreadful, miserable, hasty, reluctant and irritable.")
S(4, "grammar[5].practice", "miserable → prosperous; hasty → careful; reluctant → eager; grateful → irritable.",
  "miserable → cheerful; hasty → careful; reluctant → eager; irritable → patient.")
W(4, "activities[1].instructionsAndItems", "Left: dreadful, prosperous, reluctant, grateful, pleasant.",
  "Match each word on the left to its opposite on the right, then write one sentence that holds both words of "
  "the pair. Left: dreadful, prosperous, reluctant, irritable, miserable. Right: eager, cheerful, patient, "
  "delightful, poor. Read the whole right-hand list before you commit to any pair.")
K(4, "eng-g05-t02-u04-act02",
  "Pairs: dreadful and delightful; prosperous and miserable; reluctant and eager; grateful and irritable; pleasant and intolerable.",
  "Pairs: dreadful and delightful; prosperous and poor; reluctant and eager; irritable and patient; miserable and cheerful.")
K(4, "eng-g05-t02-u04-act02", '"The morning was pleasant, but the afternoon heat became intolerable."',
  '"Leo was irritable before breakfast, but patient again by lunchtime."')
U4_WORDS = word_list("anxious contagious delightful dreadful dutiful forceful furious glorious grateful hasty "
                     "honourable imaginable intolerable irritable justifiable miserable mysterious pleasant "
                     "profitable prosperous reasonable reliable reluctant remarkable significant".split(), 25)
S(4, "activities[0].instructionsAndItems", "Sort all twenty-five unit words into four columns:",
  "Sort these twenty-five unit words: " + U4_WORDS + ". Use four columns:")
S(4, "activities[4].instructionsAndItems", "Sort the unit words by their endings",
  "Sort the twenty-five words from Activity 1 by their endings")
K(4, "eng-g05-t02-u04-act05", "miserable, remarkable. -ant:", "miserable, remarkable, irritable. -ant:")
K(4, "eng-g05-t02-u04-act05", "significant. Accept", "significant. Hasty fits none of the four groups, so it stays outside them. Accept")

# ================================================================ UNIT 5
W(5, "comprehension[11].question", "Leo says his heart raced",
  "Leo's heart races, but the story says the feeling was not fear. What was it, and what caused it?")
# exaggerate has an adjective: exaggerated
S(5, "activities[2].instructionsAndItems",
  "One of these verbs has no common adjective form. Write which one, and say what you would use instead.",
  "Two of these verbs make their adjective from the -ing or -ed form of the verb. Write which two.")
K(5, "eng-g05-t02-u05-act03", "exaggerate, exaggeration and no common adjective;", "exaggerate, exaggeration, exaggerated;")
K(5, "eng-g05-t02-u05-act03", "The verb without an adjective form is exaggerate.",
  "The two verbs whose adjective is the -ing or -ed form are encourage (encouraging) and exaggerate (exaggerated).")
K(5, "eng-g05-t02-u05-quiz02-q01", "reread the comma rule, because will belongs to the first conditional only.",
  "reread how the zero conditional is formed: both halves use the present simple, and will belongs to the first conditional only.")

# ================================================================ UNIT 6
# the source's twenty-five: the twenty-four story words and "unlikely", the tenth un- word
U6_WORDS = word_list("unrest uneasy unexpected unsuccessful unfamiliar uncertain unaware unconscious unfortunately "
                     "unlikely dissatisfied disadvantage disability disregard discrimination dismantle incomplete "
                     "injustice incapable incompetent invincible illegible navigable miraculous monotonous".split(), 25)
S(6, "activities[0].instructionsAndItems",
  "Sort all twenty-five unit words into four columns, then answer the question underneath.",
  "Sort these twenty-five unit words into four columns, then answer the question underneath.\nThe words: " + U6_WORDS + ".")
K(6, "eng-g05-t02-u06-act01", "and either column is acceptable if the learner explains the choice.",
  "and either column is acceptable if the learner explains the choice. Invincible, with in- and -ible, is the same case.")
S(6, "grammar[2].practice", "Part B: 1) If, 2) until, 3) Although, 4) while, 5) unless, 6) After, 7) because.",
  "Part B: 1) If, 2) until, 3) Although, 4) while, 5) unless, 6) After, 7) because. Other words are right too "
  "wherever the meaning still works: in Part A, After for 1, since for 2 and 4, While for 3, When for 5, and "
  "When or While for 7; in Part B, When for 1, when for 4, until for 5, When for 6 and since for 7.")
K(6, "eng-g05-t02-u06-quiz08-q01", "Unaware would mean they did not know at all, which contradicts the sentence before it.",
  "Unaware would only repeat what Sami has just said, and Nora is adding a different reason.")
K(6, "eng-g05-t02-u06-quiz09-q01", "So would also make sense in meaning but is not offered;",
  "For would give a reason, which makes no sense here;")

# ================================================================ UNIT 7
S(7, "comprehension[5].explanation", "He lists aching feet,", "He lists an aching back,")
S(7, "quizzes[4].explanation", "The other three can be checked against the texts.", "The other three are statements that could be checked.")
K(7, "eng-g05-t03-u07-quiz05-q01", "the other three statements can be checked against the passages.",
  "the other three statements could be checked.")
K(7, "eng-g05-t03-u07-act04", "with judgement words best, should, healthier, should and easier.",
  "with judgement words best, funniest, healthier, should and easier.")
U7_WORDS = word_list("local urban rural spacious continent industrial detect contact conquer banished flee nurtured "
                     "vowing invasion festival pluralism symbol cultural political colonial historical revolutionary "
                     "synopsis current surplus impractical royal federal mural journal foundling plaintive "
                     "thriving".split(), 33)
S(7, "activities[0].instructionsAndItems", "Sort all thirty-three unit words into three columns.",
  "Sort these thirty-three unit words into three columns: " + U7_WORDS + ".")
# the class painted a NEW mural on the school wall, and the visitor promised her newsletter
S(7, "writing[1].modelText",
  "They study it, present their findings and repaint it, and a visitor from the heritage office shares it with the whole country.",
  "They study its symbols, present their findings and paint a new mural on their school wall, which a visitor from the heritage office promises to feature in her newsletter.")
S(7, "writing[1].modelText", "We repainted it, and I told the visitor",
  "We painted a new mural at school, and I told the visitor")
W(7, "writing[1].completedExample.items[2]", "repaints the mural",
  "Synopsis 1, sentence 3 (the ending): The class researches the symbols and paints a new mural on the school "
  "wall, and a visitor from the heritage office promises to feature it in her newsletter.")
W(7, "writing[1].completedExample.items[5]", "We repainted it together",
  "Synopsis 2, sentence 3: We painted a new mural at school together, and I proudly told the visitor from the "
  "heritage office that it belonged to the whole continent.")
S(7, "writing[1].completedExample.items[6]",
  "'The class researches the symbols, repaints the mural' becomes 'We repainted it together'; 'a visitor from the "
  "heritage office shares their discovery with the whole country' becomes",
  "'The class researches the symbols and paints a new mural on the school wall' becomes 'We painted a new mural "
  "at school together'; 'a visitor from the heritage office promises to feature it in her newsletter' becomes")

# ================================================================ UNIT 8
# the poster never says a physician studied anything; it reports a study of gardeners
S(8, "readings[1].passageScript",
  "Consider one claim from the poster: 'A physician studied pupils who eat fresh vegetables.'",
  "Consider one claim from the poster: 'Pupils who work in school gardens score higher marks in science.'")
W(8, "comprehension[4].explanation", "which is why the text still insists",
  "The reason is about memory, not truth: a feeling is remembered whether or not any evidence stands behind it.")
W(8, "quizzes[0].question", "Which sentence from the school garden poster",
  "Which of these sentences about the school garden is a fact rather than an opinion?")
S(8, "grammar[2].practice",
  "The hall was very magnificent. She is quite clever for her age. I am really excited about the trip. The homework was extremely easy.",
  "The hall was really magnificent. She is quite clever for her age. I am very excited about the trip. The "
  "homework was extremely easy. Magnificent is already a strong word, so it takes really or truly, not very.")
S(8, "grammar[5].practice", "Part B — 1. must 2. could 3. might 4. should.",
  "Part B — 1. must 2. could 3. might 4. should (could and might both offer a possibility, so they can swap "
  "in 2 and 3, and should also fits 1).")
S(8, "activities[4].instructionsAndItems",
  "Part B. Five words share a root: physics, physical, physician, physiology, philosophy.\n"
  "Group the words that come from the Greek root meaning nature or body.",
  "Part B. Look at these five words: physics, physical, physician, physiology, philosophy.\n"
  "Four of them come from the Greek root phys, meaning nature or body. Group those four.")
K(8, "eng-g05-t03-u08-act01", "Fact: the physician from the National Health Board.",
  'Fact: "According to a recent study, pupils who work in school gardens score higher marks in science."')

# ================================================================ UNIT 9
U(9, "outside Fort Portal, near", "near")
U(9, "rescue centre near Fort Portal", "rescue centre in the hills")
# part 3 opened with Sami answering a question nobody had asked
S(9, "readings[4].passageScript", LQ + "Because the forest is not endless," + RQ + " said Sami.",
  LQ + "Why does reusing matter so much?" + RQ + " asked Amal.\n" + LQ + "Because the forest is not endless," + RQ + " said Sami.")
# CUT TO: is a jump to a new SHOT; the film script uses it inside Scene 1
W(9, "quizzes[7].options", "The film jumps to a new scene",
  "The camera moves closer to the actor | The actor must whisper the next line | The scene is filmed from above | The film jumps straight to a new shot")
W(9, "quizzes[7].correctAnswer", "The film jumps to a new scene", "The film jumps straight to a new shot")
W(9, "quizzes[7].explanation", "marks a sudden change of scene",
  "CUT TO: marks a sudden jump to a new shot or scene, unlike ZOOM, which only changes the distance.")
K(9, "eng-g05-t03-u09-quiz08-q01", "Correct answer: The film jumps to a new scene. CUT TO: marks a sudden change of scene,",
  "Correct answer: The film jumps straight to a new shot. CUT TO: marks a sudden jump to a new shot or scene,")
# nook is not a compound noun
S(9, "grammar[5].practice", "in a shady nook before", "at a picnic table before")
S(9, "grammar[5].practice", ", guidebook, nook, rescue centre)", ", guidebook, picnic table, rescue centre)")
# the model line was Sami's, reworded, and offered as Amal's
S(9, "speaking[0].instructionsAndModelLines",
  "Model line: AMAL: [Worried] These prints look abnormal, and Kobi may already be hurt.",
  "Model line: AMAL: [Worried] Then we must tell you the moment we spot another one.")

# ================================================================ UNIT 10
S(10, "quizzes[9].question", " As they left, the cracked charter remained in its case.", "")
W(10, "quizzes[4].explanation", "a school policy about spelling",
  "A policy is a guiding rule, like the new policy the students wrote beside their youth charter.")
K(10, "eng-g05-t03-u10-quiz05-q01", "A policy is a guiding rule, like a school policy about spelling.",
  "A policy is a guiding rule, like the new policy the students wrote beside their youth charter.")
W(10, "quizzes[5].explanation", "The class met the curator in the museum lobby.",
  "A lobby is the entrance hall of a building, where visitors wait before going further in.")
K(10, "eng-g05-t03-u10-quiz06-q01", "The class met the curator in the museum lobby.",
  "A lobby is the entrance hall of a building, where visitors wait before going further in.")


# ============================================================== engine
def load(n):
    p = os.path.join(UNITS, "unit-%d.json" % n)
    raw = io.open(p, encoding="utf-8", newline="").read()
    nl = "\r\n" if "\r\n" in raw else "\n"
    d = json.loads(raw)
    if json.dumps(d, ensure_ascii=False, indent=2) + "\n" != raw.replace("\r\n", "\n"):
        sys.exit("REFUSED: %s does not round-trip" % p)
    return p, nl, d


def parts(path):
    return [int(x[1:-1]) if x.startswith("[") else x for x in re.findall(r"[^.\[\]]+|\[\d+\]", path)]


def getp(d, path):
    o = d
    for k in parts(path):
        o = o[k]
    return o


def setp(d, path, v):
    ps = parts(path)
    o = d
    for k in ps[:-1]:
        o = o[k]
    o[ps[-1]] = v


def main():
    write = "--write" in sys.argv
    for a in sys.argv[1:]:
        if a != "--write":
            sys.exit("REFUSED: unrecognised argument %r" % a)
    docs, done, skipped, problems = {}, 0, 0, []

    def doc(n):
        if n not in docs:
            docs[n] = list(load(n)) + [False]
        return docs[n]

    for op, n, path, old, new in EDITS:
        entry = doc(n)
        d = entry[2]
        if op == "S":
            cur = getp(d, path)
            # an edit that KEEPS its old text (a line added in front of it) is
            # recognised as applied by its new text, or it would apply twice
            if old in new and new in cur:
                skipped += 1
            elif old in cur:
                if cur.count(old) != 1:
                    problems.append("U%d %s: %r occurs %d times" % (n, path, old[:40], cur.count(old)))
                    continue
                setp(d, path, cur.replace(old, new)); done += 1; entry[3] = True
            elif new in cur:
                skipped += 1
            else:
                problems.append("U%d %s: old text not found: %r" % (n, path, old[:60]))
        elif op == "W":
            cur = getp(d, path)
            if cur == new:
                skipped += 1
            elif old in cur:
                setp(d, path, new); done += 1; entry[3] = True
            else:
                problems.append("U%d %s: expected fragment not found: %r (now %r)" % (n, path, old[:50], str(cur)[:60]))
        elif op == "K":
            rows = [a for a in d["answerKey"] if a.get("contentId") == path]
            changed = already = False
            for a in rows:
                if old in new and new in a["answerOrGuidance"]:
                    already = True
                elif old in a["answerOrGuidance"]:
                    a["answerOrGuidance"] = a["answerOrGuidance"].replace(old, new); changed = True
                elif new in a["answerOrGuidance"]:
                    already = True
            if changed:
                done += 1; entry[3] = True
            elif already:
                skipped += 1
            else:
                problems.append("U%d key %s: old text not found" % (n, path))
        elif op == "U":
            count = [0]

            def walk(o):
                if isinstance(o, dict):
                    for k, v in list(o.items()):
                        if isinstance(v, str) and old in v:
                            o[k] = v.replace(old, new); count[0] += 1
                        else:
                            walk(v)
                elif isinstance(o, list):
                    for i, v in enumerate(o):
                        if isinstance(v, str) and old in v:
                            o[i] = v.replace(old, new); count[0] += 1
                        else:
                            walk(v)
            walk(d)
            if count[0]:
                done += 1; entry[3] = True
            elif new in json.dumps(d, ensure_ascii=False):
                skipped += 1
            else:
                problems.append("U%d unit-wide: %r not found" % (n, old[:60]))

    for n, (p, nl, d, changed) in sorted(docs.items()):
        if changed and write:
            io.open(p, "w", encoding="utf-8", newline="").write((json.dumps(d, ensure_ascii=False, indent=2) + "\n").replace("\n", nl))

    print("\n  English Grade 5 review repairs (%s)" % ("WRITING" if write else "dry run - add --write"))
    print("    applied: %d | already applied: %d | refused: %d" % (done, skipped, len(problems)))
    for pr in problems:
        print("    REFUSED " + pr)
    print("    units touched: %s" % ", ".join("u%d" % k for k, v in sorted(docs.items()) if v[3]))
    if problems:
        sys.exit(1)


if __name__ == "__main__":
    main()
