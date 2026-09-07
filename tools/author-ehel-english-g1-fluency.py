# -*- coding: utf-8 -*-
"""Author the "fluency" review section for Grade 1 English, from the unit's
own already-taught content only.

WHAT THIS ADDS AND WHY. A gap analysis (2026-09-07) comparing Grade 1 English's
item volume against Grade 1 Mathematics found Math has ~540 items whose job is
repeated low-stakes PRACTICE of already-taught material (workedExamples,
practice, fluency) and English has no matching category at all - its closest
sections (activities, quizzes) test NEW application, not consolidation. This
section is that missing category: 15 questions per unit, all drawn from
content the unit already teaches, with NO new vocabulary and NO new grammar.

TWO TEMPLATES, both derived entirely from data already in the unit JSON:

  - GRAMMAR REVIEW (one per grammar concept, so 6/unit): "Which sentence uses
    the pattern...?" The correct answer and every distractor are REAL example
    sentences the unit's own `grammar[].practice` field already authored -
    nothing is invented, the distractors are simply examples of OTHER
    patterns taught in the same unit.
  - WORD REVIEW (9/unit, spread across the unit's phonics/topic/sight
    groups): "Which word means: <childMeaning>?" using the unit's own
    dictionaryLinks childMeaning, with three other CORE words from the same
    unit as distractors - the same shape the built-in Meaning Match game
    already uses, extended to a section that requires it rather than offers
    it as play.

HONESTY OF PROVENANCE. Every other array in these unit files carries
"origin": "Ehel Year 1 source curriculum conversion" and "reviewStatus":
"Approved - curriculum reviewer" - a real curriculum team wrote and checked
that content. This section did NOT go through that process. Every item here
is stamped "origin": "AI-authored fluency review (2026-09-07), pending
curriculum review" and "reviewStatus": "Needs curriculum review", and must
stay that way until a human curriculum reviewer has actually read it and
updated the stamp themselves. Do not "fix" these stamps to look like the
rest of the file - that would misrepresent what happened.

Idempotent: re-running replaces the `fluency` array with a freshly generated
one from current content, rather than appending. Deterministic (no random
shuffling of which words/patterns are picked, only of on-page option order,
which the RENDERER does, not this script) so a diff against a previous run
shows only real content drift.

Usage:
    python tools/author-ehel-english-g1-fluency.py            # all 10 units
    python tools/author-ehel-english-g1-fluency.py 1          # just unit 1
    python tools/author-ehel-english-g1-fluency.py 1 --dry    # print, don't write
"""
import io
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, ".."))
DATA = os.path.join(REPO, "src", "prototypes", "ehel-academy", "english", "grade-1", "data")

ORIGIN = "AI-authored fluency review (2026-09-07), pending curriculum review"
REVIEW_STATUS = "Needs curriculum review"


def load(path):
    return json.load(io.open(path, encoding="utf-8"))


def save(path, data):
    # indent=2 and a trailing newline, because that is what these files
    # already are. Writing any other shape reformats ~100KB of untouched
    # content and buries the real change in an unreviewable diff - verified
    # by round-tripping a unit with no edits and requiring byte-identity.
    io.open(path, "w", encoding="utf-8", newline="").write(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n")


def practice_sentences(grammar_item):
    """The 2-3 real example sentences already authored in `practice`.

    Format is completely consistent across all 10 units: "<instruction>:
    <ex1>. <ex2>. <ex3>." - split on the first colon, then on ". ", cleaned.
    """
    text = grammar_item.get("practice") or ""
    if ":" not in text:
        return []
    tail = text.split(":", 1)[1].strip()
    parts = [p.strip() for p in re.split(r"(?<=[.!?])\s+", tail) if p.strip()]
    # keep only genuine sentences (has a letter, ends in punctuation already
    # or gets one) - drops any trailing fragment from a mis-split
    out = []
    for p in parts:
        if not re.search(r"[A-Za-z]", p):
            continue
        if not p.endswith((".", "!", "?")):
            p += "."
        out.append(p)
    return out


def grammar_review_items(unit, count_start=1):
    """One question per grammar concept: pick that concept's own first
    example as the answer, and one example each from three OTHER concepts in
    the same unit as distractors - genuinely different patterns, genuinely
    real sentences, nothing invented.

    Distractors are chosen by ROTATING which other concepts (and which of
    their 2-3 examples) get used, offset by the question's own index - not
    always "the next three concepts' first example". Six questions each
    picking from the same fixed short list made the same handful of
    sentences reappear as the wrong answer on nearly every question, which a
    child can learn to pattern-match without understanding why ("that one's
    always wrong") - exactly the shortcut a review section must not reward.
    """
    grammar = unit["grammar"]
    per_item_examples = [practice_sentences(g) for g in grammar]
    n = len(grammar)
    items = []
    for i, g in enumerate(grammar):
        mine = per_item_examples[i]
        if not mine:
            continue
        answer = mine[0]
        distractors = []
        for step in range(1, n):
            other = (i + step) % n
            ex = per_item_examples[other]
            if not ex:
                continue
            # rotate which of THAT concept's examples too, offset by i, so
            # concept X does not always contribute the same sentence
            pick = ex[(i + step) % len(ex)]
            if pick not in distractors and pick != answer:
                distractors.append(pick)
            if len(distractors) >= 3:
                break
        if len(distractors) < 3:
            continue
        distractors = distractors[:3]
        items.append({
            "sequence": count_start + len(items),
            "practiceType": "Fluency - grammar review",
            "question": 'Which sentence uses the pattern "%s"?' % g["ruleAndExamples"],
            "options": " | ".join(place_answer(answer, distractors, i)),
            "correctAnswer": answer,
            "explanation": g.get("explanation") or ('That sentence follows "%s".' % g["ruleAndExamples"]),
            "reviewOf": "grammar",
        })
    return items


def word_review_items(unit, links_by_word, count_start=1, want=9):
    """One question per word, definition -> word, spread across the unit's
    taught strand groups so review touches phonics, topic and sight words
    alike rather than clustering on whichever group is listed first."""
    groups = unit["vocabularyGroups"]
    core_group_ids = {g["id"] for g in groups if g["title"] == "Core words"}
    # the unit's own strand sub-groups (core-words.json) aren't loaded here;
    # spread by simple round-robin across the ORDER words appear in
    # dictionaryLinks, which already groups phonics/topic/sight contiguously
    core_links = [l for l in unit["dictionaryLinks"] if l["groupId"] in core_group_ids]
    if not core_links:
        return []
    step = max(1, len(core_links) // want)
    picked = core_links[::step][:want]
    all_words = [l.get("masterWord") or l.get("displayWord") for l in core_links]

    items = []
    for link in picked:
        word = link.get("masterWord") or link.get("displayWord")
        meaning = (link.get("childMeaning") or "").strip()
        if not word or not meaning:
            continue
        pool = [w for w in all_words if w and w.lower() != word.lower()]
        # stable, deterministic distractor pick: nearest three OTHER words by
        # list position, wrapping - avoids any randomness so re-runs agree
        idx = all_words.index(word) if word in all_words else 0
        distractors = []
        step2 = 1
        while len(distractors) < 3 and step2 < len(pool) + 1:
            cand = pool[(idx + step2 - 1) % len(pool)]
            if cand not in distractors:
                distractors.append(cand)
            step2 += 1
        if len(distractors) < 3:
            continue
        items.append({
            "sequence": count_start + len(items),
            "practiceType": "Fluency - word review",
            "question": "Which word means: %s" % meaning,
            "options": " | ".join(place_answer(word, distractors, len(items) + 2)),
            "correctAnswer": word,
            "explanation": "%s: %s" % (word, meaning),
            "reviewOf": "core-word",
        })
    return items


def place_answer(answer, distractors, position):
    """Put the answer at a chosen index among the distractors.

    THE RENDERER DOES NOT SHUFFLE. english.js's drawFluencyQuestion splits
    `options` and renders them in literal order, exactly as the quiz above it
    does - the authored quizzes vary the answer's position themselves because
    a human wrote each one. Generated items had the answer first every single
    time, which was caught by driving the finished page: clicking the top
    option fifteen times scored 15/15 without reading a word. A review
    section a child can pass by tapping the same spot is worse than no review
    section, so the position rotates deterministically by item index -
    varied on the page, still identical between runs.
    """
    opts = list(distractors)
    opts.insert(position % (len(distractors) + 1), answer)
    return opts


def build_fluency(unit_no, unit):
    unit_id = unit["unit"]["unitId"]
    outcome_id = unit["outcomes"][0]["outcomeId"] if unit.get("outcomes") else None

    grammar_items = grammar_review_items(unit)
    words_needed = 15 - len(grammar_items)
    word_items = word_review_items(unit, None, count_start=len(grammar_items) + 1, want=max(9, words_needed))

    combined = grammar_items + word_items
    combined = combined[:15]
    for i, item in enumerate(combined):
        item["sequence"] = i + 1
        item["fluencyId"] = "%s-fluency%02d" % (unit_id, i + 1)
        item["unitId"] = unit_id
        if outcome_id:
            item["outcomeId"] = outcome_id
        item["origin"] = ORIGIN
        item["reviewStatus"] = REVIEW_STATUS
    return combined


def main():
    args = sys.argv[1:]
    dry = "--dry" in args
    wanted = [int(a) for a in args if a.isdigit()]
    manifest = load(os.path.join(DATA, "course-manifest.json"))
    units = wanted or [u["number"] for u in manifest["units"]]

    print("\n  Authoring Grade 1 English fluency review%s\n" % (" (dry run)" if dry else ""))
    for n in units:
        path = os.path.join(DATA, "units", "unit-%d.json" % n)
        unit = load(path)
        fluency = build_fluency(n, unit)
        if len(fluency) < 15:
            print("  WARNING unit %-2d only produced %d/15 items - check its grammar/word data" % (n, len(fluency)))
        if dry:
            print("  unit %-2d: %d items" % (n, len(fluency)))
            for it in fluency:
                print("    [%s] %s -> %s" % (it["reviewOf"], it["question"][:70], it["correctAnswer"]))
            continue
        unit["fluency"] = fluency
        save(path, unit)
        print("  ok   unit-%d.json   %d fluency items" % (n, len(fluency)))
    print()


main()
