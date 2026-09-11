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
    python tools/author-ehel-english-g1-fluency.py --grade 2  # Grade 2 (2026-09-11)

GRADE 2 (2026-09-11). Same two templates, same stamps, one difference forced
by the content: Grade 2's `grammar[].practice` is a worksheet ("Write he or
she in each gap. 1. ... Check yourself: 1. He 2. She") rather than spoken
examples, so its grammar review draws its sentences from `ruleAndExamples`
instead - the rule's own held-up examples, "This is Leo. He likes football."
- and names the pattern by the title before its colon ("He and She"), because
Grade 2 authors each pattern as a PAIR of items and a question per item
would offer the pair's other example as a distractor: a second right answer.
Grade 1's path is byte-for-byte what it was; the Grade 2 path is chosen by
--grade, not by sniffing the shape, so neither can drift into the other.
"""
import io
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, ".."))


def grade_arg(argv):
    if "--grade" in argv:
        i = argv.index("--grade")
        if i + 1 >= len(argv) or not argv[i + 1].isdigit():
            sys.exit("REFUSED: --grade needs a number")
        return int(argv[i + 1])
    return 1


GRADE = grade_arg(sys.argv[1:])
DATA = os.path.join(REPO, "src", "prototypes", "ehel-academy", "english", "grade-%d" % GRADE, "data")

ORIGIN = {1: "AI-authored fluency review (2026-09-07), pending curriculum review",
          2: "AI-authored fluency review (2026-09-11), pending curriculum review"}.get(
    GRADE, "AI-authored fluency review, pending curriculum review")
REVIEW_STATUS = "Needs curriculum review"
STORY_GLOSSARY_GROUP = "Words from our stories"   # shell/subjects/english.js's own name for the untaught group


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


# Sentences in a Grade 2 rule that are ABOUT the rule rather than examples of
# it ("The word will never changes.", "Count the creatures before you choose
# the verb.", "Use like with I, you, we and they.") - metalanguage a child is
# not meant to say. Two tests: the words a rule uses to talk about itself,
# and the instruction verbs its commentary opens with. THE ONE DEFINITION:
# the standalone builder's Let us talk imports this module and reads
# concept_pools() below rather than keeping a copy.
RULE_TALK = re.compile(
    r"\b(verbs?|words?|nouns?|pronouns?|question mark|silent e|vowels?|consonants?|"
    r"spellings?|sentences?|phrase|helping|then|becomes|gives|we (?:write|say|use)|"
    r"add|the rest|match|count|choose|pick|plan|open with|name the|give every|"
    r"stays the same|for everyone|the same for|all use)\b|-(?:ing|ed|er|s|es)\b", re.I)
RULE_INSTRUCTION = re.compile(
    r"^(Use|Write|Rewrite|Choose|Pick|Plan|Count|Match|Name|Add|Finish|Begin|Start|Take|Open with|Put|Always|Remember|Say|Ask|Change|Drop|Make)\b")


QUOTED = re.compile(r"[\u201c\"]([^\u201d\"]{3,160}?)[\u201d\"]")
FORMULA = re.compile(r"\+|\s/\s|\u2192|\.\.\.|\u2026|___")


def _is_list(p):
    """"I, you, we, they." - three or more one-word items and nothing else."""
    parts = [x.strip(" .") for x in p.split(",")]
    return len(parts) >= 3 and all(len(x.split()) <= 2 for x in parts)


def _sayable(p, quoted):
    if not re.match(r"^[A-Z]", p) or FORMULA.search(p) or ":" in p:
        return False
    if re.search(r"(?<![\w.])\d+\.", p) or not 2 <= len(p.split()) <= 12:
        return False
    if _is_list(p):
        return False
    # A sentence a rule QUOTES is an example by construction - "I count the
    # shells." is an example even though "count" is a word the rules use to
    # talk about themselves - so the two metalanguage tests apply only to
    # unquoted lines.
    if not quoted and (RULE_TALK.search(p) or RULE_INSTRUCTION.match(p)):
        return False
    return True


def rule_sentences(grammar_item):
    """The example sentences a rule holds up, labels and commentary stripped.

    Two shapes, both measured. Grade 2 writes most examples as bare lines -
    "Near and one: This seed is very small." -> "This seed is very small." -
    and Grade 3 puts them in speech marks inside a line of explanation:
    "I am + verb-ing: \u201cI am learning English.\u201d" -> "I am learning
    English." So a line with quoted sentences contributes exactly those; a
    line without quotes contributes its own sentences, minus commentary
    ("The word will never changes."), formulas ("Subject + can + see +
    object"), slash lists ("Go. / Stop.") and word lists ("I, you, we, they.").
    A bare three-word intro beside a longer sentence ("This is Leo. He likes
    football.") is the name, not the pattern, and is dropped.
    """
    out = []

    def add(p, quoted):
        p = p.strip().strip("\u2018\u2019'").strip()
        if not p or not re.search(r"[A-Za-z]", p):
            return
        p = p if p.endswith((".", "!", "?")) else p + "."
        if _sayable(p, quoted) and p not in out:
            out.append(p)

    for line in (grammar_item.get("ruleAndExamples") or "").split("\n"):
        line = line.strip()
        quoted = QUOTED.findall(line)
        if quoted:
            for q in quoted:
                q = q.strip()
                if not q.endswith((".", "!", "?")):
                    continue        # a quoted word or phrase, not a sentence
                for p in re.split(r"(?<=[.!?])\s+", q):
                    add(p, True)
            continue
        m = re.match(r"^[^:]{1,45}:\s*(.+)$", line)
        if m:
            line = m.group(1)
        parts = [p.strip() for p in re.split(r"(?<=[.!?])\s+", line)]
        parts = [p for p in parts if p and re.search(r"[A-Za-z]", p)]
        if len(parts) > 1:
            parts = [p for p in parts if len(p.split()) > 3]
        for p in parts:
            add(p, False)
    return out


# Words that, named in a pattern's title, are the thing the pattern is about:
# "Using because for Explanations", "The Word 'Could'", "Future with 'Will'".
FUNCTION_WORDS = {"because", "so", "and", "but", "or", "when", "since", "as", "from",
                  "can", "could", "will", "would", "should", "must", "might", "got",
                  "this", "that", "these", "those", "there", "like", "likes", "than",
                  "first", "next", "then", "finally", "please", "don't", "not"}


def concept_keys(name):
    """(key words, is a question pattern) for a pattern's name."""
    low = name.lower()
    quoted = re.findall(r"[\u2018\u201c'\"]([^\u2019\u201d'\"]+)[\u2019\u201d'\"]", name)
    keys = {w for q in quoted for w in re.findall(r"[a-z']+", q.lower())}
    # a function word is the pattern's subject only where the title writes it
    # in lowercase ("Using because for Explanations", "The Conjunction and");
    # capitalised, it is joining two terms ("Likes and Dislikes")
    keys |= {w for w in re.findall(r"\b[a-z][a-z']*", name) if w in FUNCTION_WORDS}
    return keys, "question" in low


def shows(sentence, name):
    """Whether a sentence visibly shows the pattern its name names - its key
    word, or a question mark for a question pattern. None when the name
    names nothing checkable ("Present Continuous"), so callers fall back."""
    keys, question = concept_keys(name)
    if not keys and not question:
        return None
    low = sentence.lower()
    if question and sentence.rstrip().endswith("?"):
        return True
    return any(re.search(r"\b%s\b" % re.escape(k), low) for k in keys)


def pick_answer(name, sentences):
    """The first example that shows the pattern, else the first example.
    Grade 3's "Using because for Explanations" quotes a BEFORE and an AFTER -
    "I like the officer." then "I like the officer because he helps people."
    - and taking the first made the answer the one sentence without because."""
    for s in sentences:
        if shows(s, name):
            return s
    return sentences[0]


def fair_distractor(sentence, name):
    """A wrong option must not also show the asked pattern: "What do you
    like?" offered under "Asking Questions" is a second right answer."""
    return shows(sentence, name) is not True


def concept_pools(unit):
    """[(name, sentences, explanation)] - one entry per grammar CONCEPT.

    Grade 2 authors its grammar in pairs ("He and She: Choose the Pronoun",
    "He and She: Introduce a Person") that teach one pattern twice, sharing a
    `conceptId`; Unit 2 puts four items under one. Pooled by that id, so a
    question about the pattern never offers the pair's other example as a
    wrong answer. The name is the first item's title before its colon, with
    any bracketed gloss and quotes removed. Entries with no usable sentence
    are left out.
    """
    order, pool, name, expl = [], {}, {}, {}
    for i, g in enumerate(unit.get("grammar") or []):
        cid = g.get("conceptId") or ("item-%d" % i)
        if cid not in pool:
            order.append(cid)
            pool[cid] = []
            base = re.sub(r"\s*\(.*?\)", "", (g.get("title") or "").split(":")[0])
            name[cid] = re.sub(r"[\u201c\u201d\"]", "", base).strip()
            expl[cid] = (g.get("explanation") or "").strip()
        for sent in rule_sentences(g):
            if sent not in pool[cid]:
                pool[cid].append(sent)
    return [(name[c], pool[c], expl[c]) for c in order if pool[c] and name[c]]


def grammar_review_items_from_rules(unit, count_start=1):
    """Grade 2's grammar review: one question per CONCEPT (concept_pools),
    the answer that concept's first rule example, the distractors rule
    examples of the unit's other concepts - rotated by question index
    exactly as grammar_review_items() rotates."""
    pools = concept_pools(unit)
    pool = {n: s for n, s, _ in pools}
    expl = {n: e for n, _, e in pools}
    bases = [n for n, _, _ in pools]
    items = []
    for i, b in enumerate(bases):
        answer = pick_answer(b, pool[b])
        others = [x for x in bases if x != b]
        cands = []
        for step in range(8):
            for o in others:
                ex = pool[o]
                if step < len(ex):
                    pick = ex[(i + step) % len(ex)]
                    if pick not in cands and pick != answer and fair_distractor(pick, b):
                        cands.append(pick)
        if len(cands) < 3:
            continue
        distractors = cands[:3]
        items.append({
            "sequence": count_start + len(items),
            "practiceType": "Fluency - grammar review",
            # curly, because this course teaches what a speech mark looks
            # like (Grade 1 validation, areas 4 and 19; the Grade 1 path above
            # writes straight ones and repair-english-g1-straight-quotes.py
            # turned them after the fact)
            "question": "Which sentence uses the pattern \u201c%s\u201d?" % b,
            "options": " | ".join(place_answer(answer, distractors, i)),
            "correctAnswer": answer,
            "explanation": expl[b] or ('That sentence follows "%s".' % b),
            "reviewOf": "grammar",
        })
    return items


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
    # the taught groups are every group but the story glossary - Grade 1's
    # one "Core words" group, Grade 2's four strand groups - the same split
    # the shell's taughtGroups() makes
    core_group_ids = {g["id"] for g in groups if g["title"] != STORY_GLOSSARY_GROUP}
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
        # A meaning that NAMES ITS OWN ANSWER is not a question: "Fun means
        # enjoying yourself." -> fun. Measured 2026-09-11: 45 of the 90 word
        # questions in Grade 1's live bank are that shape, and Grade 2 and 3
        # write childMeanings the same way ("To move means to go from one place
        # to another."). Skipping them thinned Grade 2 units to nine questions,
        # so the word is blanked instead and the question asks for the gap:
        # "Which word fills the gap: ___ means enjoying yourself." The
        # explanation keeps the meaning whole.
        own = re.compile(r"\b%s(?:s|es|d|ed|ing)?\b" % re.escape(word), re.I)
        stem = "Which word means: %s"
        shown = meaning
        if own.search(meaning):
            shown = own.sub("___", meaning)
            stem = "Which word fills the gap: %s"
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
            "question": stem % shown,
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

    grammar_items = grammar_review_items(unit) if GRADE == 1 else grammar_review_items_from_rules(unit)
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
    if "--grade" in args:
        i = args.index("--grade")
        args = args[:i] + args[i + 2:]
    wanted = [int(a) for a in args if a.isdigit()]
    manifest = load(os.path.join(DATA, "course-manifest.json"))
    units = wanted or [u["number"] for u in manifest["units"]]

    print("\n  Authoring Grade %d English fluency review%s\n" % (GRADE, " (dry run)" if dry else ""))
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


if __name__ == "__main__":
    main()
