#!/usr/bin/env python
"""Does each vocabulary clip actually say the sentence printed beside it?

English clips are named by id -- {vocabularyId}-sentence-{n}.mp3 -- and the
generator reuses any mp3 over 1 KB that already exists. So when a sentence's
TEXT is edited afterwards (a script review, a content rebuild), the recording is
never remade: the file is there, so it is kept, and the descriptor goes on
saying available:true. Nothing in the pipeline has ever compared a recording to
the words it is supposed to be.

Science, Global Perspectives and Computing cannot drift this way, because their
filenames are a hash of the text: change the text and the clip orphans itself.
English is the exception, and this is the cost of it.

The existing integrity check measures duration against script length, so a clip
of the WRONG sentence with a plausible duration sails through. This transcribes
the audio (Whisper, offline, free) and compares it with the sentence on screen.

Usage:
  python tools/audit-ehel-english-sentence-audio.py --grades 3 --sample 20
  python tools/audit-ehel-english-sentence-audio.py --grades 1 2 3 4 5 6 7 8
  python tools/audit-ehel-english-sentence-audio.py --grades 3 --out stale.json

--out writes the mismatching clip ids, which is what feeds the repair:
  node tools/generate-ehel-english-audio.js vocabulary 3 --force --only <ids>
"""

from __future__ import annotations

import argparse
import collections
import difflib
import functools
import json
import re
import sys
import warnings
from pathlib import Path

warnings.filterwarnings("ignore")

# A sweep runs for hours and prints only as it finds things, so the output is
# the only window into it. Piped into a log or a pipeline, Python block-buffers
# stdout, and that window goes stale: four audits an hour into their run still
# showed the counts from whenever the buffer last filled, which reads as "not
# progressing" and is wrong. Flush every line so the log is the truth.
print = functools.partial(print, flush=True)  # noqa: A001 - deliberate shadow
# UTF-8, and unbuffered. Both matter, for reasons this tool learned the hard way:
#   * A transcript can contain anything the speech model produces — the readings
#     sweep died on a "ī" because Windows hands Python a cp1252 stdout, and the
#     crash landed in the print, OUTSIDE the per-clip guard, so it took the whole
#     run with it after 200 clips.
#   * Piped into a log, Python block-buffers, and a four-hour audit shows counts
#     from whenever the buffer last filled — which reads as a stalled job.
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace", line_buffering=True)
except AttributeError:  # pragma: no cover - very old interpreters
    pass
ROOT = Path(__file__).resolve().parents[1]
ENGLISH = ROOT / "src" / "prototypes" / "ehel-academy" / "english"
# Whisper mishears the odd proper noun, so this is a similarity floor, not an
# equality test: a stale clip is a DIFFERENT sentence and scores far below it.
MATCH_FLOOR = 0.85


# Whisper writes numbers as digits ("Yes, 5 is easy") where the sentence spells
# them out ("Yes, five is easy!"), which scored four perfectly good Grade 1 clips
# as mismatches. Both sides are reduced to digits so a number is a number.
NUMBER_WORDS = {
    "zero": "0", "one": "1", "two": "2", "three": "3", "four": "4", "five": "5",
    "six": "6", "seven": "7", "eight": "8", "nine": "9", "ten": "10",
    "eleven": "11", "twelve": "12", "thirteen": "13", "fourteen": "14",
    "fifteen": "15", "sixteen": "16", "seventeen": "17", "eighteen": "18",
    "nineteen": "19", "twenty": "20", "thirty": "30", "forty": "40",
    "fifty": "50", "sixty": "60", "seventy": "70", "eighty": "80", "ninety": "90",
    "hundred": "100",
}


def normalise(text: str) -> str:
    flat = re.sub(r"[^a-z0-9 ]", "", re.sub(r"\s+", " ", str(text).lower())).strip()
    return " ".join(NUMBER_WORDS.get(word, word) for word in flat.split())


# Every narrated category in the course, and where each one's text and its
# descriptor live. The vocabulary sentences were audited first because that is
# where the drift was reported, but every category is named by id and reused if
# the file exists, so every category can drift the same way.
#
# "meanings" is included because the word carousel added a Meaning button in
# grades 1-4; before that nothing played those clips and auditing them would
# have been checking audio no learner could hear.
CATEGORIES = (
    "sentences", "meanings", "words", "readings", "grammar",
    "grammar-practice", "speaking", "writing", "activities", "quiz",
)


def _live(descriptor):
    return bool(descriptor) and descriptor.get("available") is True


def _mp3(descriptor):
    return ENGLISH / str(descriptor.get("source") or descriptor.get("normal") or "").replace("./", "")


def clips_for_grade(grade: int, categories=("sentences",)):
    """(category, unit name, clip id, script, mp3 path) for every live clip.

    The clip id is the one the generator's --only matches on, so a repair list
    written from this audit feeds straight back into the generator.
    """
    wanted = set(categories)
    units = ENGLISH / f"grade-{grade}" / "data" / "units"
    if units.exists():
        for unit_path in sorted(units.glob("unit-*.json"), key=lambda p: int(re.findall(r"\d+", p.stem)[0])):
            unit = json.loads(unit_path.read_text(encoding="utf-8"))
            name = unit_path.stem

            for link in unit.get("dictionaryLinks", []):
                if "sentences" in wanted:
                    audio = link.get("sentenceAudio") or []
                    for index, sentence in enumerate(link.get("practiceSentences") or []):
                        descriptor = audio[index] if index < len(audio) else None
                        if _live(descriptor):
                            yield ("sentences", name, f'{link["vocabularyId"]}-sentence-{index + 1}',
                                   sentence, _mp3(descriptor))
                if "meanings" in wanted and _live(link.get("meaningAudio")):
                    yield ("meanings", name, f'{link["vocabularyId"]}-meaning',
                           link.get("childMeaning"), _mp3(link["meaningAudio"]))

            if "readings" in wanted:
                for item in unit.get("readings", []):
                    if _live(item.get("audio")):
                        yield ("readings", name, item["readingId"], item.get("passageScript"), _mp3(item["audio"]))
            for item in unit.get("grammar", []):
                if "grammar" in wanted and _live(item.get("audio")):
                    yield ("grammar", name, item["grammarId"],
                           f"{item.get('explanation')} {item.get('ruleAndExamples', '')}", _mp3(item["audio"]))
                if "grammar-practice" in wanted and _live(item.get("practiceAudio")):
                    yield ("grammar-practice", name, f'{item["grammarId"]}-practice',
                           item.get("practice"), _mp3(item["practiceAudio"]))
            if "speaking" in wanted:
                for item in unit.get("speaking", []):
                    if _live(item.get("audio")):
                        yield ("speaking", name, item["speakingId"],
                               item.get("instructionsAndModelLines"), _mp3(item["audio"]))
            if "writing" in wanted:
                for item in unit.get("writing", []):
                    if _live(item.get("audio")):
                        yield ("writing", name, item["writingId"],
                               item.get("promptAndInstructions"), _mp3(item["audio"]))
            if "activities" in wanted:
                for item in unit.get("activities", []):
                    if _live(item.get("audio")):
                        yield ("activities", name, item["activityId"],
                               item.get("instructionsAndItems"), _mp3(item["audio"]))

    # The word pronunciations and the final quiz live outside units/, the way
    # the generator's own dictionary and final-quiz branches read them.
    if "words" in wanted:
        master = ENGLISH / f"grade-{grade}" / "data" / f"master-dictionary.grade{grade}.json"
        if master.exists():
            for entry in json.loads(master.read_text(encoding="utf-8")).get("entries", []):
                if _live(entry.get("audio")):
                    yield ("words", "master-dictionary",
                           re.sub(r"[^a-z0-9]+", "-", str(entry.get("lemma") or entry["displayWord"]).lower()).strip("-"),
                           entry["displayWord"], _mp3(entry["audio"]))
    if "quiz" in wanted:
        quiz = ENGLISH / f"grade-{grade}" / "data" / "course-final-quiz.json"
        if quiz.exists():
            for question in json.loads(quiz.read_text(encoding="utf-8")).get("questions", []):
                if _live(question.get("audio")):
                    yield ("quiz", "course-final-quiz", question["questionId"],
                           question.get("question"), _mp3(question["audio"]))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--grades", nargs="*", type=int, default=[3])
    parser.add_argument("--sample", type=int, help="check only the first N clips of each grade")
    parser.add_argument("--model", default="base")
    parser.add_argument("--out", help="write the stale clip ids here as JSON")
    # Verifying a repair only needs the clips that were repaired: the rest were
    # listened to on the first pass and found correct, and re-listening to them
    # costs three times the CPU to re-answer a question already answered. Takes
    # the same JSON the audit writes and the generator repairs from, so the
    # three steps cannot disagree about which clips were in scope.
    parser.add_argument("--only-file", dest="only_file",
                        help="check only the clip ids in this JSON (as written by --out)")
    parser.add_argument("--categories", nargs="*", default=["sentences"],
                        help=f"which narrated categories to check; one or more of {', '.join(CATEGORIES)}, or 'all'")
    args = parser.parse_args()

    categories = list(CATEGORIES) if "all" in args.categories else args.categories
    unknown = [c for c in categories if c not in CATEGORIES]
    if unknown:
        raise SystemExit(f"unknown category: {', '.join(unknown)} (known: {', '.join(CATEGORIES)})")

    targeted = {}
    if args.only_file:
        raw = json.loads(Path(args.only_file).read_text(encoding="utf-8"))
        targeted = {grade: set(ids) for grade, ids in raw.items()}

    import whisper
    model = whisper.load_model(args.model)

    stale: dict[str, list[str]] = {}
    unreadable: dict[str, list[str]] = {}
    totals = {}

    def save() -> None:
        """Persist what is known so far — a sweep of 10,000 clips runs for hours,
        and losing all of it to the last clip is the failure this guards."""
        if args.out and stale:
            Path(args.out).write_text(json.dumps(stale, indent=2) + "\n", encoding="utf-8")

    try:
        for grade in args.grades:
            checked = missing = bad = broken = 0
            ids: list[str] = []
            wanted = targeted.get(str(grade)) if targeted else None
            per_category = collections.Counter()
            for category, unit_name, clip_id, sentence, mp3 in clips_for_grade(grade, categories):
                if args.sample and checked >= args.sample:
                    break
                if wanted is not None and clip_id not in wanted:
                    continue
                if not str(sentence or "").strip():
                    continue
                if not mp3.exists():
                    missing += 1
                    print(f"g{grade} {unit_name} {mp3.name}: FILE MISSING (descriptor says available)")
                    continue
                # One unreadable clip must not end the sweep. A truncated or
                # half-written mp3 makes the transcriber raise, and an audit that
                # dies on clip 3,000 of 10,000 has told you nothing about the
                # 7,000 it never reached. It is also a finding in its own right:
                # a clip the auditor cannot open is a clip a learner cannot play.
                try:
                    heard = model.transcribe(str(mp3), language="en", fp16=False)["text"]
                except Exception as error:  # noqa: BLE001 - any decode failure is the same finding
                    broken += 1
                    unreadable.setdefault(str(grade), []).append(mp3.name)
                    print(f"g{grade} {unit_name} {mp3.name}: UNREADABLE ({type(error).__name__}: {error})")
                    continue
                ratio = difflib.SequenceMatcher(None, normalise(sentence), normalise(heard)).ratio()
                checked += 1
                per_category[category] += 1
                if ratio >= MATCH_FLOOR:
                    continue
                bad += 1
                per_category[f"{category}!"] += 1
                ids.append(clip_id)
                # Belt as well as braces: the finding is already recorded above,
                # so a stream that cannot render some character must not cost us
                # the clip — let alone the rest of the sweep.
                try:
                    print(f"g{grade} {category} {unit_name} {mp3.name}  similarity {ratio:.2f}")
                    print(f"      printed: {str(sentence)[:300]}")
                    print(f"      spoken : {heard.strip()[:300]}")
                except UnicodeError:
                    print(f"g{grade} {category} {unit_name} {mp3.name}  similarity {ratio:.2f}"
                          " (text omitted: unprintable characters)")
            totals[grade] = (checked, bad, missing, broken)
            if len(categories) > 1 and per_category:
                for cat in categories:
                    if per_category[cat]:
                        flagged = per_category[f"{cat}!"]
                        print(f"  g{grade} {cat}: {per_category[cat]} checked, {flagged} flagged"
                              f" ({100 * flagged / per_category[cat]:.0f}%)")
            if ids:
                stale[str(grade)] = ids
            # Written per grade, not once at the end: an interrupted run still
            # leaves a usable repair list for the grades it did finish.
            save()
    except KeyboardInterrupt:
        print("\ninterrupted — reporting what was checked so far")
        save()

    print("\n-------- summary --------")
    for grade, (checked, bad, missing, broken) in totals.items():
        share = f"{100 * bad / checked:.0f}%" if checked else "n/a"
        print(f"grade {grade}: {checked} clips checked | {bad} say a different sentence ({share})"
              + (f" | {missing} missing files" if missing else "")
              + (f" | {broken} unreadable" if broken else ""))
    if unreadable:
        print("\nUNREADABLE clips (the auditor could not open them; nor could a learner):")
        for grade, names in unreadable.items():
            print(f"  grade {grade}: {len(names)} — {', '.join(names[:5])}" + (" …" if len(names) > 5 else ""))
    if args.out and stale:
        print(f"\nstale ids written to {args.out}")
        for grade, ids in stale.items():
            print(f"  node tools/generate-ehel-english-audio.js vocabulary {grade} --force --only {','.join(ids[:6])}"
                  + (" …" if len(ids) > 6 else ""))


if __name__ == "__main__":
    main()
