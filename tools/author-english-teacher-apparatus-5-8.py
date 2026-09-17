# -*- coding: utf-8 -*-
"""The Cambridge teacher apparatus for Grades 5-8: a misconception and a lesson shape per unit.

WHY THIS IS A SECOND TOOL AND NOT A FLAG ON THE FIRST
=====================================================
`author-english-teacher-apparatus.py` does this for Grades 1-4 and its wording
cannot be reused. The Teacher & Parent Guide's framing SPLITS AT GRADE 5 (owner,
2026-08-20): at Grades 1-4 the adult leads the lesson ("YOU lead this unit"),
and from Grade 5 the learner works through the unit largely alone and the adult
"keeps them company from outside the screen rather than leading every step".
Every sentence the 1-4 tool writes is in the leading voice, so sharing it would
put a teacher's move in a guide that has just told the adult not to make one.
The fixture differs too, and so does every pick. What is shared is the shape:
four sections, a cited misconception, three derived from the unit's own content.

WHERE THE PICKS COME FROM, AND THE ONE PLACE THAT WAS DERIVABLE
==============================================================
Grade 5's units ARE the Stage 5 book's nine chapters, in order and under the
same names - "There's a Lesson in That", "Exploring Space", "Reflections" ... -
so each unit's misconception was chosen from the ones the book itself prints in
that chapter, located by the session heading (5.1, 5.2 ...) above each table.
Grades 6, 7 and 8 are NOT built on their books: TR6 runs "Different voices",
"People in the news", "Personification and imagery" against Ehel's "Sports and
Health", "Life in the Wild", "Money Matters". So those thirty picks are matched
to what the unit teaches and were read one at a time, which is the only method
available and the one the Grade 1-4 pass used throughout.

A pick must cite its OWN stage. A Grade 8 unit teaching "clauses that end with
prepositions" is not allowed to cite Stage 7's "You should never end a sentence
with a preposition", however apt - the guide names the book a teacher would open.

    python tools/author-english-teacher-apparatus-5-8.py --dry
    python tools/author-english-teacher-apparatus-5-8.py
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
FIXTURE = os.path.join(ENGLISH, "data", "cambridge-misconceptions-5-8.json")

ORIGIN = "Ehel authoring 2026-09-17 (Cambridge teacher apparatus 5-8: misconceptions and lesson shape)"
REVIEW = "Needs curriculum review"

MIS_TITLE = "⚠️ Watch out for this"
START_TITLE = "▶️ Before they start"
END_TITLE = "⏹️ When they finish"
HOME_TITLE = "\U0001f3e0 Away from the screen"

BOOK = {5: "Cambridge Primary English Teacher’s Resource 5",
        6: "Cambridge Primary English Teacher’s Resource 6",
        7: "Cambridge Lower Secondary English Teacher’s Resource 7",
        8: "Cambridge Lower Secondary English Teacher’s Resource 8"}

# (grade, unit) -> (fixture id, how to spot it, how to help)
PICKS = {
    # ---- GRADE 5: chosen from the book's own chapter for that unit ----------
    (5, 1): ("cme-s5-001",
             "Ask them to name three fables. If every one stars an animal, the idea is there.",
             "Agree that animals are common because they let a writer show one fault at a time — then read a fable with people in it. The moral is what makes it a fable, not the cast."),
    (5, 2): ("cme-s5-012",
             "Ask where they would check a fact about space, and whether the first result is enough.",
             "Ask who wrote it, when, and what they wanted. Have them find the same fact in a second place — agreement between two sources is the habit, not trust in one."),
    (5, 3): ("cme-s5-018",
             "Give them “the sea is a mirror” and “the sea is like a mirror” and ask which is which.",
             "A simile keeps the word like or as and says two things are alike; a metaphor drops it and says one IS the other. Have them turn each into the other and hear what changes."),
    (5, 4): ("cme-s5-025",
             "Ask them to sort four titles into myths and legends. Hesitation, or sorting by how old the story is, shows it.",
             "A myth explains something about the world — why the sea is salt, how fire came. A legend grew from a person or a place that may once have been real. Ask which job each story is doing."),
    (5, 5): ("cme-s5-031",
             "Ask them to write two sentences about bread: one telling someone how to make it, one saying why it rises.",
             "Instructions tell you what to DO, in order, with command verbs. An explanation tells you WHY or HOW something happens, and needs no reader to act. Both can sit in one text."),
    (5, 6): ("cme-s5-035",
             "Ask what kind of text a nature article is. If the answer is one word, offer the possibility of two.",
             "Show a page that informs AND explains — most real texts do more than one job. Ask what each paragraph is for rather than what the whole text is called."),
    (5, 7): ("cme-s5-053",
             "After they retell an event as a second character, ask whether the story changed or only the telling.",
             "Both changed. Have them mark one fact that stayed and one that moved. The narrator decides what the reader is allowed to see, so a different narrator is a different story."),
    (5, 8): ("cme-s5-050",
             "Give them “The new library opened in March and it is the best building in town” and ask: fact or opinion?",
             "It is both, and finding the join is the skill. Have them underline the provable half and circle the half somebody merely holds. Real persuasive writing mixes them on purpose."),
    (5, 9): ("cme-s5-054",
             "Ask how many actors a ten-character play needs. If the answer is ten, the idea is there.",
             "Explain doubling — one actor, two parts, a change of voice or coat. Have them cast the unit's script with four people and work out who can double without meeting themselves on stage."),
    (5, 10): ("cme-s5-016",
              "Ask whether their capstone piece is finished. If the answer comes fast and the page has no crossings-out, it is a first draft.",
              "A draft is for getting the ideas down; the next pass is for a reader. Have them read it aloud — the sentences they stumble on are the ones to rewrite, and that is the whole method."),

    # ---- GRADE 6: matched to what the unit teaches --------------------------
    (6, 1): ("cme-s6-029",
             "Ask them to find figurative language in the unit's information text. If they say there is none, the idea is there.",
             "Point at everyday speech — time is running out, a warm welcome. Have them collect three from a non-fiction page. Figurative language is how people write, not a poetry decoration."),
    (6, 2): ("cme-s6-014",
             "Ask whether “swimming is the best exercise” is a fact, given that they can show you evidence for it.",
             "Evidence can sit under an opinion without turning it into a fact. Ask what would have to be true for it to be provable, and for whom. A supported opinion is still an opinion."),
    (6, 3): ("cme-s6-032",
             "Ask them to say a sentence about a friend using who or which. If it sounds stiff to them, the idea is there.",
             "Have them listen for who and which in ordinary talk — “the one who lives next door”. Relative clauses are how speech packs two ideas together; formality is a separate choice."),
    (6, 4): ("cme-s6-012",
             "Ask what science fiction is about. If the answer is “science”, the idea is there.",
             "Science fiction asks what would happen to PEOPLE if something were possible. Have them turn one of their invention predictions into a story problem — who gains, who loses."),
    (6, 5): ("cme-s6-035",
             "Give them “I saved my money however I bought the game” and ask what is wrong.",
             "Connectives are not interchangeable: each names a relationship — adding, contrasting, causing, sequencing. Have them sort the unit's connectives into those four piles before writing the essay."),
    (6, 6): ("cme-s6-031",
             "Ask what the re- in ready means. If they say “again”, the idea is there.",
             "Sometimes letters at the front of a word are simply part of it. Have them test by removing the piece: return leaves turn, ready leaves ady. Only one of those is a word."),
    (6, 7): ("cme-s6-034",
             "Read a safety instruction flatly — “Leave the building” — and ask whether it sounds angry.",
             "A command is short because it has one job and no time to waste, not because it is cross. Have them write three calm safety commands with full stops and read them aloud."),
    (6, 8): ("cme-s6-019",
             "Ask them to rewrite “The documentary was filmed in Mogadishu” in the active voice and say which is better.",
             "Neither is better. The passive puts the important thing first and can leave the doer out — useful when nobody knows who did it, or when it does not matter. Ask what each version emphasises."),
    (6, 9): ("cme-s6-037",
             "Ask how their art presentation would change for a class of six-year-olds.",
             "If the answer is “it would not”, that is the misconception. Have them name the audience first, then cut one thing and add one thing. Audience decides length, vocabulary and what can be assumed."),
    (6, 10): ("cme-s6-017",
              "Ask them to defend a capstone claim. If the answer is only “because I think so”, the idea is there.",
              "A viewpoint is worth more when it can point at something. Have them attach one piece of evidence from Units 1-9 to each claim before they present."),

    # ---- GRADE 7 -----------------------------------------------------------
    (7, 1): ("cme-s7-010",
             "Ask them to retell the migration passage. If they tell it strictly in date order, the idea is there.",
             "Writers move time about — starting late, going back, holding something back. Have them mark where the text jumps and ask what the jump achieves."),
    (7, 2): ("cme-s7-018",
             "Ask whether “Which festival is it from?” is wrong English.",
             "It is not. The rule was borrowed from Latin and never described English. The alternative — “From which festival is it?” — is stiffer, and stiffer is not the same as correct."),
    (7, 3): ("cme-s7-005",
             "Ask them how many words a phrase must have. If the answer is “more than one”, the idea is there.",
             "A phrase is a unit doing one job, and one word can do it — Clothes is a noun phrase on its own. Have them test by substitution rather than by counting words."),
    (7, 4): ("cme-s7-011",
             "Ask who the subject is in “The road was widened last year”.",
             "The road, which did nothing. The grammatical subject is what the sentence is ABOUT, not always who acted — which is exactly what the passive is for when the doer is unknown or unimportant."),
    (7, 5): ("cme-s7-000",
             "Ask them to plan an adventure story. If every element is extreme, the idea is there.",
             "Tension comes from something ordinary being at risk. Have them keep one everyday detail — a packed lunch, a phone at 4% — and notice how much harder it makes the danger feel."),
    (7, 6): ("cme-s7-016",
             "Show a sports headline stating a record and ask whether it needs checking.",
             "Even a true statement is selected by someone. Ask what was left out and who benefits from the framing. Bias lives in the choosing as much as in the wording."),
    (7, 7): ("cme-s7-008",
             "Ask them to learn five career words from definitions alone, then use one in speech the next day.",
             "Definitions give the meaning and not the company a word keeps. Have them meet each word in two real sentences and write a third of their own — that is what makes it usable."),
    (7, 8): ("cme-s7-015",
             "Ask them to interview someone about the news using only yes/no questions, and count what they learn.",
             "Closed questions confirm; open ones discover. Have them rewrite three as How or Why and notice the length of the answers."),
    (7, 9): ("cme-s7-002",
             "Ask what makes a sentence “complex”. If the answer is long words or hard ideas, the idea is there.",
             "The labels describe CLAUSES, not difficulty. Have them write a complex sentence out of the plainest words they know — “If we share it, it lasts” — and see that it is still complex."),
    (7, 10): ("cme-s7-004",
              "Ask which of two passages is better written: a plain one or a heavily subordinated one.",
              "Neither, until you ask what it is for. Have them find one place in their capstone where a short sentence lands harder than a long one, and one where the long one is doing real work."),

    # ---- GRADE 8 -----------------------------------------------------------
    (8, 1): ("cme-s8-000",
             "Ask what they inferred from the text, and what the writer implied. If the two answers are the same, the idea is there.",
             "The writer implies; the reader infers. Have them name the sentence that carries the hint and then their own conclusion from it, and notice that those are two different acts."),
    (8, 2): ("cme-s8-002",
             "Ask them to write an argument about packaging. If it becomes two people disagreeing, the idea is there.",
             "In English an argument is a case: a claim with reasons behind it. Have them set out one claim and three reasons with nobody to quarrel with."),
    (8, 3): ("cme-s8-008",
             "Ask whether “No water. Not one drop.” is bad writing.",
             "Minor sentences are deliberate and effective where the effect is wanted. Have them find one in the unit's text and say what it does that a full sentence would not."),
    (8, 4): ("cme-s8-011",
             "Play an advertisement and ask whether people really talk like that.",
             "Scripted speech is written to sound spontaneous and is nothing like it — no false starts, no overlap, every word chosen. Have them transcribe ten seconds of real talk and compare."),
    (8, 5): ("cme-s8-001",
             "Ask them to find the action in “the destruction of the forest”.",
             "Destruction names an action while being a noun. Nominalisation is how formal writing packs events into noun phrases — useful, and worth noticing, because it also hides who did it."),
    (8, 6): ("cme-s8-005",
             "Ask them to make an adverb from fast. If they offer fastly, the idea is there.",
             "Many adverbs carry no -ly at all — fast, hard, well, straight — and some -ly words are adjectives (friendly, lonely). Have them test by what the word modifies, never by its ending."),
    (8, 7): ("cme-s8-003",
             "Ask them for the difference between reported speech and indirect speech.",
             "They are the same thing under two names, and the confusion costs marks when a question uses the other one. Say both aloud once so neither term is a surprise."),
    (8, 8): ("cme-s8-010",
             "Ask them to tell you the story, then the plot, of the unit's narrative.",
             "The story is what happened, in order. The plot is how the telling arranges it — what is withheld, what is placed first. Have them write the story as five events and then say where the plot puts each."),
    (8, 9): ("cme-s8-004",
             "Ask whether a poem with no rhyme and no regular beat is still a poem.",
             "It is. Have them read a free verse piece aloud and mark where they naturally pause — line breaks and images do the work that rhyme and metre do elsewhere."),
    (8, 10): ("cme-s8-006",
              "Ask them to swap a word in their capstone for a synonym and read both aloud.",
              "Synonyms carry different weight and company — thin, slim, skinny. Have them justify one word choice in the capstone on the grounds of what it suggests, not what it means."),
}


def load(path):
    with io.open(path, encoding="utf-8") as fh:
        return json.load(fh)


def save(path, obj):
    io.open(path, "w", encoding="utf-8", newline="\n").write(
        json.dumps(obj, indent=2, ensure_ascii=False) + "\n")


def unit_path(grade, n):
    return os.path.join(ENGLISH, "grade-%d" % grade, "data", "units", "unit-%d.json" % n)


def first_title(items, *keys):
    for it in items or []:
        if not isinstance(it, dict):
            continue
        for k in keys:
            v = it.get(k)
            if isinstance(v, str) and v.strip():
                return v.strip()
    return ""


def derived_sections(unit):
    """A lesson shape from the unit's OWN content, in the Grade 5-8 voice.

    The adult here is alongside, not leading - so these are three conversations
    rather than three teaching moves, and each names something in this unit so a
    reader can tell it was not written for a different one.
    """
    title = unit["unit"]["unitTitle"]
    read = first_title(unit.get("readings"), "title")
    gram = first_title(unit.get("grammar"), "title", "concept")
    write = first_title(unit.get("writing"), "title", "task")
    group = first_title(unit.get("vocabularyGroups"), "title")

    start = ("Two minutes before they open the unit. Ask what they already think about %s — not "
             "to test them, but so they notice later how much moved. If they have nothing to say, "
             "read them the title “%s” and ask what they expect from it. Then leave them to it: "
             "at this age the work is theirs and the value of your question is that it was asked "
             "first."
             % (title.lower(), read or title))
    end = ("Five minutes, on the day they finish a session rather than the whole unit. Ask for one "
           "sentence out loud using %s, and for the hardest thing they met today. The second "
           "question matters more than the first — a learner who can name what was hard has "
           "something to start with tomorrow, and one who says “nothing” usually has not been "
           "stretched."
           % (("the pattern “%s”" % gram) if gram else "today’s pattern"))
    home = ("%s is worth doing on paper, away from the screen, and worth reading aloud to somebody "
            "afterwards. Reading your own writing out loud is where most of the corrections get "
            "made, and it is the one part of this unit that works better with another person in the "
            "room.%s"
            % (("“%s”" % write) if write else "This unit’s first writing task",
               (" Their words from %s are the ones to listen for." % ("“%s”" % group)) if group else ""))
    return start, end, home


def build(unit, grade, n, fixture):
    fid, spot, help_ = PICKS[(grade, n)]
    e = fixture[fid]
    body = ("Learners often think: “%s”\n\n"
            "HOW TO SPOT IT — %s\n\n"
            "HOW TO HELP — %s\n\n"
            "From the %s, page %d (%s). Cambridge’s own wording for this one is kept in "
            "english/data/cambridge-misconceptions-5-8.json, along with the other %d it prints "
            "for Stages 5 to 8."
            % (e["misconception"].rstrip(". "), spot, help_, BOOK[grade], e["page"], fid, 132))
    start, end, home = derived_sections(unit)
    note = ("\n\nDerived from this unit’s own text, pattern and writing task rather than written "
            "one by one — a shape for the week, not a script.")
    return [
        {"title": MIS_TITLE, "body": body, "origin": ORIGIN, "reviewStatus": REVIEW},
        {"title": START_TITLE, "body": start + note, "origin": ORIGIN, "reviewStatus": REVIEW},
        {"title": END_TITLE, "body": end, "origin": ORIGIN, "reviewStatus": REVIEW},
        {"title": HOME_TITLE, "body": home, "origin": ORIGIN, "reviewStatus": REVIEW},
    ]


def main(argv):
    dry = "--dry" in argv
    for a in argv[1:]:
        if a != "--dry":
            sys.stderr.write("REFUSED: unknown argument %r\n" % a)
            return 2

    fixture = {e["id"]: e for e in load(FIXTURE)["entries"]}

    # ---- PRE-FLIGHT: refuse BEFORE writing anything ------------------------
    # The Grade 4 authoring tool half-applied once - it wrote three units and
    # then refused on the fourth, leaving the grade in a state no gate
    # described. Every refusable condition is therefore checked for every unit
    # up front, and a refusal writes nothing at all.
    problems, used = [], {}
    if len(PICKS) != 40:
        problems.append("PICKS holds %d entries, expected 40 (4 grades x 10 units)" % len(PICKS))
    for (g, n), (fid, spot, help_) in sorted(PICKS.items()):
        if not os.path.isfile(unit_path(g, n)):
            problems.append("grade %d unit %d: no unit file" % (g, n))
            continue
        if fid not in fixture:
            problems.append("grade %d unit %d: %s is not in the fixture" % (g, n, fid))
            continue
        if fixture[fid]["stage"] != g:
            problems.append("grade %d unit %d: %s is a Stage %d misconception - a unit may only "
                            "cite the book for its own stage"
                            % (g, n, fid, fixture[fid]["stage"]))
        if fid in used:
            problems.append("grade %d unit %d: %s already used by grade %d unit %d"
                            % (g, n, fid, used[fid][0], used[fid][1]))
        used[fid] = (g, n)
        if not spot.strip() or not help_.strip():
            problems.append("grade %d unit %d: empty spot/help" % (g, n))
    if problems:
        sys.stderr.write("REFUSED: nothing written.\n")
        for p in problems:
            sys.stderr.write("  - %s\n" % p)
        return 1

    wrote = 0
    for (g, n) in sorted(PICKS):
        p = unit_path(g, n)
        unit = load(p)
        guide = unit.setdefault("grownUpGuide", {})
        sections = guide.setdefault("sections", [])
        titles = {s.get("title") for s in sections}
        new = [s for s in build(unit, g, n, fixture) if s["title"] not in titles]
        if not new:
            print("  skip  grade %d unit %d - already has all four" % (g, n))
            continue
        sections.extend(new)
        if not dry:
            save(p, unit)
        wrote += 1
        print("  %s grade %d unit %d  +%d section(s)  [%s]"
              % ("would" if dry else "ok   ", g, n, len(new), PICKS[(g, n)][0]))

    print("\n  %s %d unit(s) across Grades 5-8" % ("would write" if dry else "wrote", wrote))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
