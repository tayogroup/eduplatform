# -*- coding: utf-8 -*-
"""Give every Core word link the spellingPractice and aiTutorPrompt its grade
already writes for every other link.

WHY. The Grade 1 validation (area 3) counted the core links missing these two
fields and asked for them to be filled or the absence recorded. The Grade 3
build (2026-09-11) measured the same gap far wider: 320 of 323 Grade 3 core
links carry neither, and Grade 2 lacks 282 of 300. They are the links the
Core-words rebalance (2026-08-31) added; every other link in the same files
has both. The shell reads them - spellingPractice is the spelling row of the
printed handwriting sheet (english.js worksheetRowHtml, whose comment says
"Every one of the 3,563 Grade 1-4 links has one", no longer true) and the
spelling line under a deck word card; aiTutorPrompt is what Wehel is handed.

WHAT IT WRITES. Nothing new in wording. Each grade's files already carry the
forms, and this tool READS them out of the grade's own links and applies them
to the core links that lack them. It asks the grade's own CORE links first,
because the content team wrote those differently from the glossary: Grade 2's
18 and Grade 3's 3 authored core links spell bare ("c - h - o - i - c - e"),
the glossary's templated links say "Say, tap and trace: ..." - and the shell's
worksheet comment records the same split ("a bare 'n - a - m - e' higher
up"). Only where the core links give no form (the aiTutorPrompts they carry
are all bespoke) does it fall back to every link in the grade:

    spellingPractice   "c - h - o - i - c - e"                    (core links)
    aiTutorPrompt      "With an adult, ask the tutor to say name slowly,
                        use it in one easy sentence and wait for you to repeat."

A form is used only if it covers at least 80% of the TEMPLATED links it was
read from - links whose form recurs at least three times - so a grade whose
templates disagree is refused rather than given a guess. A prompt written for
one word alone ("With an adult beside me, ask me what arrives in the post and
let me name three examples") is not a competing template, and counting it as
one is what refused Grades 1, 2 and 4 on 2026-09-11: their tutor prompts are
one template (690, 628 and 835 links - the same sentence Grade 3 was filled
with) plus a few hundred one-offs, and "best covers 835 of 1,044" read as two
templates when it was one. The
letter string follows the course's own conventions, measured on the filled
links: letters joined by " - ", a hyphen spoken as "hyphen", a space as
"space", an apostrophe dropped. A field that already has a value is never
touched.

NO REVIEW FLAG MOVES. The templated form is the one already sitting unreviewed
beside every glossary link; a core link gaining it is no more approved than
those, and no less.

    python tools/fill-english-core-word-prompts.py --grade 3          # dry run
    python tools/fill-english-core-word-prompts.py --grade 3 --write
    python tools/fill-english-core-word-prompts.py --grade 3 --story --write

--story fills the STORY-GLOSSARY links ("Words from our stories") instead of
the core ones, in the form every link in the grade agrees on (the glossary's
own form - the core links' bare spelling is a core-word convention, not a
glossary one). The Grade 1 validation listed 81 and 252 of these empty (area
3); on 2026-09-11 they were the only empty ones left in Grades 1-4 (93, 217,
295 and 310 links).

Idempotent: a second run reports nothing to do.
"""
import collections
import io
import json
import os
import re
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
STORY_GLOSSARY_GROUP = "Words from our stories"   # shell/subjects/english.js's own name
COVER = 0.80


def args():
    argv = list(sys.argv[1:])
    write = "--write" in argv
    global STORY, PREFIX
    STORY = "--story" in argv
    # --spelling-prefix TEXT: a person's choice of spelling form where the
    # grade's links split (Grade 2's glossary: 620 "Say, tap and trace:"
    # against 248 bare). The tool still refuses to guess; this is the answer
    # it asks for, given on the command line where the diff shows it.
    PREFIX = None
    if "--spelling-prefix" in argv:
        i = argv.index("--spelling-prefix")
        PREFIX = argv[i + 1]
        del argv[i:i + 2]
    grade = None
    if "--grade" in argv:
        i = argv.index("--grade")
        if i + 1 < len(argv) and argv[i + 1].isdigit():
            grade = int(argv[i + 1])
            del argv[i:i + 2]
    for a in argv:
        if a not in ("--write", "--story"):
            sys.exit("REFUSED: unrecognised argument %r" % a)
    if grade is None:
        sys.exit("REFUSED: --grade N is required")
    return grade, write


def spelled(word):
    parts = []
    for ch in word.lower():
        if ch == "-":
            parts.append("hyphen")
        elif ch == " ":
            parts.append("space")
        elif ch.isalpha():
            parts.append(ch)
    return " - ".join(parts)


def word_of(link):
    return str(link.get("masterWord") or link.get("displayWord") or "").strip()


def learn_forms(units, core_only, fields=None):
    """The grade's own dominant form for each field, as a (prefix, suffix)
    around the word or its spelling. With core_only, read from the taught
    links alone and return None for a field they give no agreed form for."""
    sp, ai = collections.Counter(), collections.Counter()
    n_sp = n_ai = 0
    for u in units:
        taught = {g["id"] for g in u.get("vocabularyGroups") or [] if g.get("title") != STORY_GLOSSARY_GROUP}
        for l in u["dictionaryLinks"]:
            if core_only and l.get("groupId") not in taught:
                continue
            # --story learns from the story links' own siblings only: in Grades
            # 2 and 3 the core links spell bare and the glossary links say "Say,
            # tap and trace:", and pooling the two reads as no agreement at all
            if STORY and not core_only and l.get("groupId") in taught:
                continue
            w = word_of(l)
            if not w:
                continue
            s = l.get("spellingPractice")
            if s:
                n_sp += 1
                letters = spelled(w)
                if s.endswith(letters):
                    sp[s[:len(s) - len(letters)]] += 1
            a = l.get("aiTutorPrompt")
            if a:
                n_ai += 1
                m = re.search(r"\b%s\b" % re.escape(w), a)
                if m:
                    ai[(a[:m.start()], a[m.end():])] += 1
    out = {}
    for name, c, n in (("spellingPractice", sp, n_sp), ("aiTutorPrompt", ai, n_ai)):
        if fields and name not in fields:
            continue
        form, k = c.most_common(1)[0] if c else (None, 0)
        # agreement among the TEMPLATED links: a form seen fewer than three
        # times is one author's sentence for one word, not a rival template
        templated = sum(v for v in c.values() if v >= 3)
        if not c or k < COVER * templated or k < 3:
            # No agreed form: this field is left EMPTY and said so, never
            # guessed.
            out[name] = None
            if not core_only:
                print("  NOT FILLED: the grade's own %s templates do not agree on a form "
                      "(best covers %d of %d templated links)" % (name, k, templated))
            continue
        out[name] = (form, k, n)
    return out


def main():
    grade, write = args()
    units_dir = os.path.join(ROOT, "src", "prototypes", "ehel-academy", "english",
                             "grade-%d" % grade, "data", "units")
    paths = sorted((p for p in os.listdir(units_dir) if re.fullmatch(r"unit-\d+\.json", p)),
                   key=lambda p: int(re.search(r"\d+", p).group()))
    docs = []
    for p in paths:
        full = os.path.join(units_dir, p)
        raw = io.open(full, encoding="utf-8").read()
        doc = json.loads(raw)
        if json.dumps(doc, ensure_ascii=False, indent=2) + "\n" != raw:
            sys.exit("REFUSED: %s does not round-trip through this writer" % p)
        docs.append((full, p, doc))
    units = [d for _, _, d in docs]
    # --story: the glossary's form, read from every link in the grade
    core_forms = learn_forms(units, False) if STORY else learn_forms(units, True)
    forms = {}
    for name in ("spellingPractice", "aiTutorPrompt"):
        if core_forms[name]:
            forms[name] = core_forms[name]
        else:
            # the fallback is asked about THIS field only: Grade 2's glossary
            # links disagree on a spelling form it has no need to learn there
            forms[name] = learn_forms(units, False, fields={name})[name]
    if PREFIX is not None:
        forms["spellingPractice"] = (PREFIX, 0, 0)
    sp_form, ai_form = forms["spellingPractice"], forms["aiTutorPrompt"]
    print("\n  Grade %d forms, read from the grade's own links:" % grade)
    if sp_form:
        print("    spellingPractice  %r + letters   (%d of %d filled links)" % sp_form)
    if ai_form:
        print("    aiTutorPrompt     %r + word + %r   (%d of %d)" % (ai_form[0][0], ai_form[0][1], ai_form[1], ai_form[2]))
    print("")

    total_sp = total_ai = 0
    for full, p, doc in docs:
        taught = {g["id"] for g in doc.get("vocabularyGroups") or [] if g.get("title") != STORY_GLOSSARY_GROUP}
        n_sp = n_ai = 0
        for l in doc["dictionaryLinks"]:
            if (l.get("groupId") in taught) == STORY:
                continue
            w = word_of(l)
            if not w:
                continue
            if sp_form and not l.get("spellingPractice"):
                l["spellingPractice"] = sp_form[0] + spelled(w)
                n_sp += 1
            if ai_form and not l.get("aiTutorPrompt"):
                l["aiTutorPrompt"] = ai_form[0][0] + w + ai_form[0][1]
                n_ai += 1
        total_sp += n_sp
        total_ai += n_ai
        print("  %-12s spellingPractice +%-3d aiTutorPrompt +%d" % (p, n_sp, n_ai))
        if write and (n_sp or n_ai):
            io.open(full, "w", encoding="utf-8", newline="\n").write(
                json.dumps(doc, ensure_ascii=False, indent=2) + "\n")
    print("\n  %s: %d spellingPractice and %d aiTutorPrompt %s\n" % (
        "written" if write else "dry run", total_sp, total_ai,
        "filled" if write else "would be filled - add --write"))


if __name__ == "__main__":
    main()
