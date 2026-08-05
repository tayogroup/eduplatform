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
# Also unbuffer the stream itself, for anything that writes around this print
# (warnings, tracebacks, the transcriber's own output).
try:
    sys.stdout.reconfigure(line_buffering=True)
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


def clips_for_grade(grade: int):
    """(unit file, vocabularyId, index, sentence, mp3 path) for every live clip."""
    units = ENGLISH / f"grade-{grade}" / "data" / "units"
    if not units.exists():
        return
    for unit_path in sorted(units.glob("unit-*.json"), key=lambda p: int(re.findall(r"\d+", p.stem)[0])):
        unit = json.loads(unit_path.read_text(encoding="utf-8"))
        for link in unit.get("dictionaryLinks", []):
            audio = link.get("sentenceAudio") or []
            for index, sentence in enumerate(link.get("practiceSentences") or []):
                descriptor = audio[index] if index < len(audio) else None
                if not descriptor or descriptor.get("available") is not True:
                    continue
                source = descriptor.get("source") or descriptor.get("normal") or ""
                mp3 = ENGLISH / source.replace("./", "")
                yield unit_path.stem, link["vocabularyId"], index, sentence, mp3


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
    args = parser.parse_args()

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
            for unit_name, vocabulary_id, index, sentence, mp3 in clips_for_grade(grade):
                if args.sample and checked >= args.sample:
                    break
                if wanted is not None and f"{vocabulary_id}-sentence-{index + 1}" not in wanted:
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
                if ratio >= MATCH_FLOOR:
                    continue
                bad += 1
                ids.append(f"{vocabulary_id}-sentence-{index + 1}")
                print(f"g{grade} {unit_name} {mp3.name}  similarity {ratio:.2f}")
                print(f"      printed: {sentence}")
                print(f"      spoken : {heard.strip()}")
            totals[grade] = (checked, bad, missing, broken)
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
