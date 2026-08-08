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
# Above this the recording plainly says the script, so the proper-noun check is
# not consulted — see where it is used for why it cannot be trusted on its own.
NAME_TRUST = 0.95


# Whisper writes numbers as digits ("Yes, 5 is easy") where the sentence spells
# them out ("Yes, five is easy!"), which scored four perfectly good Grade 1 clips
# as mismatches. Both sides are reduced to digits so a number is a number.
#
# Cardinals alone were not enough, and the gap was not academic: a sweep of
# Grade 2 flagged 21 clips and Grade 3 one, and every one of the 22 was a
# correct recording of a number. Two things were missing.
#
# ORDINALS. Whisper writes a spoken ordinal as "11th", "21st"; the script spells
# "eleventh", "twenty-first". Neither was in the map, so they could never agree
# — and this lands hardest exactly where it matters least, because Grade 2
# unit-1 TEACHES ordinal numbers, so nearly every clip in the unit tripped.
#
# COMPOUNDS. "twenty-eight" had its hyphen deleted rather than split, welding it
# into "twentyeight" — a token the map cannot reach even though both halves are
# in it. Splitting alone still gives "20 8" against Whisper's "28", so the parts
# have to be composed, not just separated.
#
# Both sides therefore fold to one canonical form, and that form is WORDS, not
# digits. Digits look like the obvious choice and quietly break the comparison:
# the score is a character ratio, so collapsing "twelfth" and "second" to "12o"
# and "2o" shrinks the differing region until a genuinely wrong number scores
# above the floor. Two deliberately-wrong pairs scored 0.88 that way. Spelling
# both sides out keeps a wrong number as expensive as it should be, and leaves
# a right one exactly equal.
UNITS = {
    "zero": 0, "one": 1, "two": 2, "three": 3, "four": 4, "five": 5,
    "six": 6, "seven": 7, "eight": 8, "nine": 9,
}
TEENS = {
    "ten": 10, "eleven": 11, "twelve": 12, "thirteen": 13, "fourteen": 14,
    "fifteen": 15, "sixteen": 16, "seventeen": 17, "eighteen": 18, "nineteen": 19,
}
TENS = {
    "twenty": 20, "thirty": 30, "forty": 40, "fifty": 50,
    "sixty": 60, "seventy": 70, "eighty": 80, "ninety": 90,
}
CARDINAL_WORDS = {**UNITS, **TEENS, **TENS, "hundred": 100}
UNIT_ORDINALS = {
    "first": 1, "second": 2, "third": 3, "fourth": 4, "fifth": 5,
    "sixth": 6, "seventh": 7, "eighth": 8, "ninth": 9,
}
ORDINAL_WORDS = {
    **UNIT_ORDINALS,
    "tenth": 10, "eleventh": 11, "twelfth": 12, "thirteenth": 13,
    "fourteenth": 14, "fifteenth": 15, "sixteenth": 16, "seventeenth": 17,
    "eighteenth": 18, "nineteenth": 19, "twentieth": 20, "thirtieth": 30,
    "fortieth": 40, "fiftieth": 50, "sixtieth": 60, "seventieth": 70,
    "eightieth": 80, "ninetieth": 90, "hundredth": 100,
}
_DIGITS = re.compile(r"(\d+)(st|nd|rd|th)?$")
_CARDINAL_OF = {v: k for k, v in {**UNITS, **TEENS, **TENS}.items()}
_ORDINAL_OF = {v: k for k, v in ORDINAL_WORDS.items()}


def _spell(value: int, ordinal: bool) -> str:
    """The one spelling of a number that both sides fold onto."""
    table = _ORDINAL_OF if ordinal else _CARDINAL_OF
    if value in table:
        return table[value]
    # Hundreds. Left out of the first version, so "one hundred centimetres"
    # normalised to "one 100 …" and could never meet Whisper's "100 cm".
    if 100 <= value < 1000:
        hundreds, rest = divmod(value, 100)
        head = f"{_CARDINAL_OF[hundreds]} hundred"
        return head if not rest else f"{head} {_spell(rest, ordinal)}"
    tens, unit = divmod(value, 10)
    if 2 <= tens <= 9 and unit:
        # "twenty first", "twenty eight" — the tens part stays cardinal in both.
        return f"{_CARDINAL_OF[tens * 10]} {(_ORDINAL_OF if ordinal else _CARDINAL_OF)[unit]}"
    return f"{value}{'th' if ordinal else ''}"  # out of range: leave it recognisable


def _fold_numbers(tokens: list[str]) -> list[str]:
    """Collapse every way of writing a number onto one spelling.

    A tens word is read together with the word after it, so "twenty eight" and
    "28" both become "twenty eight", and "twenty-first" and "21st" both become
    "twenty first".
    """
    out: list[str] = []
    i = 0
    while i < len(tokens):
        token = tokens[i]
        digits = _DIGITS.fullmatch(token)
        if digits:
            out.append(_spell(int(digits.group(1)), bool(digits.group(2))))
            i += 1
            continue
        # "one hundred", "three hundred and twenty" — read the multiplier with
        # the word after it, or "one hundred" folds to "one" + "one hundred".
        if token in UNITS and UNITS[token] and i + 1 < len(tokens) and tokens[i + 1] == "hundred":
            value = UNITS[token] * 100
            j = i + 2
            if j < len(tokens) and tokens[j] == "and":
                j += 1
            if j < len(tokens) and tokens[j] in TENS:
                value += TENS[tokens[j]]
                j += 1
                if j < len(tokens) and tokens[j] in UNITS and UNITS[tokens[j]]:
                    value += UNITS[tokens[j]]
                    j += 1
            elif j < len(tokens) and tokens[j] in TEENS:
                value += TEENS[tokens[j]]
                j += 1
            elif j < len(tokens) and tokens[j] in UNITS and UNITS[tokens[j]]:
                value += UNITS[tokens[j]]
                j += 1
            out.append(_spell(value, False))
            i = j
            continue
        if token in TENS and i + 1 < len(tokens):
            nxt = tokens[i + 1]
            if nxt in UNIT_ORDINALS:
                out.append(_spell(TENS[token] + UNIT_ORDINALS[nxt], True))
                i += 2
                continue
            if nxt in UNITS and UNITS[nxt]:  # "twenty zero" is not a number
                out.append(_spell(TENS[token] + UNITS[nxt], False))
                i += 2
                continue
        if token in ORDINAL_WORDS:
            out.append(_spell(ORDINAL_WORDS[token], True))
            i += 1
            continue
        if token in CARDINAL_WORDS:
            out.append(_spell(CARDINAL_WORDS[token], False))
            i += 1
            continue
        out.append(token)
        i += 1
    return out


# Whisper transcribes in American spelling; the course is written in British.
# Every occurrence costs similarity, and a passage repeats its topic word — a
# Grade 2 reading says "neighbourhood" five times and scored 0.20 against its
# own correct recording, transcribed as "neighborhood". 41 of the 201 re-recorded
# readings still flagged for this and nothing else.
#
# Rules rather than a word list, because the list is unbounded. Applied to BOTH
# sides, so the risk is asymmetric in the safe direction: a wrong merge can only
# make two spellings agree that should have differed (practise/practice), never
# make a correct clip look wrong. The exceptions are words where the suffix is
# not a British ending at all — "four", "hour", "your" must not become "for",
# "hor", "yor".
_OUR_KEEP = {"four", "hour", "your", "our", "pour", "tour", "sour", "flour",
             "scour", "devour", "detour", "contour", "velour", "amour"}
_RE_KEEP = {"are", "here", "there", "where", "more", "sure", "pure", "core",
            "score", "store", "before", "care", "share", "share", "square",
            "figure", "future", "nature", "picture", "capture", "measure"}


def _anglicise(word: str) -> str:
    """Fold a British spelling onto its American form (one canonical side)."""
    if len(word) > 4 and word.endswith("our") and word not in _OUR_KEEP:
        return word[:-3] + "or"                       # colour -> color
    if len(word) > 6 and word.endswith("ours") and word[:-1] not in _OUR_KEEP:
        return word[:-4] + "ors"
    if len(word) > 6 and "ourhood" in word:
        return word.replace("ourhood", "orhood")      # neighbourhood
    if len(word) > 5 and word.endswith(("ise", "ised", "ising", "isation")):
        for suf, rep in (("isation", "ization"), ("ising", "izing"),
                         ("ised", "ized"), ("ise", "ize")):
            if word.endswith(suf):
                return word[: -len(suf)] + rep        # realise -> realize
    if len(word) > 4 and word.endswith("re") and word not in _RE_KEEP:
        return word[:-2] + "er"                       # centre -> center
    if len(word) > 5 and word.endswith(("lled", "ller", "lling")):
        for suf, rep in (("lling", "ling"), ("ller", "ler"), ("lled", "led")):
            if word.endswith(suf):
                return word[: -len(suf)] + rep        # traveller -> traveler
    if len(word) > 5 and word.endswith(("ence",)) and word[:-4].endswith(("def", "pret", "off")):
        return word[:-4] + "ense"                     # defence -> defense
    return word


def normalise(text: str) -> str:
    # Separators become spaces rather than vanishing, so "twenty-eight" arrives
    # as two tokens to compose. Both sides pass through here, so the treatment of
    # apostrophes and the rest stays symmetric whatever it is.
    flat = re.sub(r"[^a-z0-9]+", " ", str(text).lower()).strip()
    return " ".join(_anglicise(w) for w in _fold_numbers(flat.split()))


def similarity(script: str, heard: str) -> float:
    """How much of the script the recording actually says, compared by WORD.

    This was a character comparison, and on long text that is not a weaker
    measure but a wrong one. difflib aligns by finding the longest matching
    block and recursing; a few early differences in a thousand-character string
    stop it realigning, and it never recovers. A Grade 4 reading whose recording
    differs by SEVEN WORDS out of 189 — "favourite"/"favorite", "Amal" heard as
    "a mall" — matched 477 of 992 characters across 7 fragmented blocks and
    scored 0.48. Word-level scores the same pair 0.98.

    That single choice produced most of this tool's false positives, and they
    rose with grade level because the texts get longer: 0% of Grade 1 readings
    against 43% of Grade 8's, all of them correct recordings. It also explains
    the 62 grammar flags in grades whose files postdate every rewrite, where
    drift was impossible.

    Words are the right unit anyway: a wrong recording says different WORDS, and
    Whisper's errors are word-shaped (a homophone, a split name), not
    character-shaped.
    """
    return difflib.SequenceMatcher(None, normalise(script).split(), normalise(heard).split()).ratio()


def missing_names(script: str, heard: str) -> list:
    """Recurring proper nouns in the script that the recording never says.

    Word-level similarity alone is not enough, and the gap is precisely the
    defect this course actually had. When f1248b10c renamed characters across
    all 8 grades, the stale recordings differed from their scripts by a handful
    of names in a long passage — "Amal" for "Sarah", "Teacher Yasmin" for
    "Teacher Nadia" — and nothing else. That scores 0.93 by word, comfortably
    inside the floor. A tool that only measured overall similarity would have
    called those 201 readings clean.

    So names are checked directly. Only names the script says at least TWICE
    count: a name mentioned once and split by the transcriber ("Amal" heard as
    "a mall") is a transcription artefact, while a character named throughout a
    story and absent from the recording is drift. Sentence-initial words are
    skipped, since capitalisation there says nothing about proper nouns.

    A name also counts as spoken when the transcriber merely broke it up.
    Whisper splits unfamiliar names — "Kalimani" comes back as "Kali Mani",
    "Amal" as "a mall" — so a word-set lookup alone reported three correct Grade
    5 and 6 readings as missing their characters, at similarity 0.97-0.99. The
    despaced check finds the name across the split, and the fuzzy pass catches a
    near-miss spelling ("Kalembo"/"Kalembe").
    """
    # Sentence-initial words are NOT skipped. Doing so looked like protection
    # against ordinary capitalised words and silently dropped real names: "Idris
    # begged… Idris waited." puts the character at the start of every sentence,
    # so both mentions vanished and the check saw nothing to look for. The
    # protection is not needed, because a word only matters here when the
    # recording never says it — and an ordinary word like "Then" or "Every" is
    # in the transcript regardless of case, so it can never reach the report.
    words = re.findall(r"\b[A-Z][a-z]{2,}\b", str(script))
    counts = collections.Counter(w.lower() for w in words)
    heard_words = normalise(heard).split()
    spoken = set(heard_words)
    despaced = "".join(heard_words)

    def said(name: str) -> bool:
        if name in spoken or name in despaced:
            return True
        # The fuzzy bar has to scale with length, because one substituted letter
        # is a far bigger fraction of a short name. "Kian" comes back as "Kean"
        # and scores 0.75 — flagged as never spoken on an otherwise 0.97 match —
        # while the same single change in "Kalimani"/"Kalamani" scores 0.88. A
        # flat threshold has to be either blind to Kean or deaf to real renames;
        # a name-length one is neither, since Amal/Sarah and Yasmin/Nadia differ
        # in most of their letters, not one.
        bar = 0.70 if len(name) <= 5 else 0.80
        return any(difflib.SequenceMatcher(None, name, w).ratio() >= bar for w in heard_words)

    return sorted({w for w, n in counts.items() if n >= 2 and not said(w)})


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
    "overview",
)


def overview_clips(grade: int):
    """Overview panels, with their scripts taken from the generator itself.

    These were the last category no audit could reach, and the reason is that
    their text is not a field: a panel is the first two sentences of
    unitOverview, or the outcomes joined, or the learning path flattened, and
    one panel's wording exists only inside the generator. Rebuilding that here
    would be a second copy of a composition rule, which is exactly how the
    grammar audit ended up comparing recordings against text nothing narrates.

    So the generator is asked. `--emit-scripts` writes what it would narrate and
    sends nothing, so the two cannot disagree about the script even when the
    composition changes.
    """
    import subprocess
    import tempfile

    with tempfile.TemporaryDirectory() as tmp:
        out = Path(tmp) / "overview.json"
        result = subprocess.run(
            [sys.executable and "node", "tools/generate-ehel-english-audio.js",
             "overview", str(grade), "--emit-scripts", str(out)],
            cwd=ROOT, capture_output=True, text=True, encoding="utf-8", errors="replace")
        if not out.exists():
            print(f"  overview g{grade}: generator emitted nothing "
                  f"({result.stderr.strip()[:120] or 'no error reported'})")
            return
        scripts = json.loads(out.read_text(encoding="utf-8"))

    directory = ENGLISH / "media" / "audio" / f"grade-{grade}" / "overview"
    for clip_id, script in sorted(scripts.items()):
        mp3 = directory / f"{clip_id}.mp3"
        if mp3.exists():
            yield ("overview", "overview", clip_id, script, mp3)


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
    if "overview" in wanted:
        yield from overview_clips(grade)

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
                ratio = similarity(sentence, heard)
                # Names are REPORTED, never used to fail a clip. The check was
                # written to gate, and the data says it cannot: Whisper renders
                # unfamiliar names phonetically and unpredictably — "Tariq" as
                # "Tareek", "Kalembo" as "Colombo" — at 0.5-0.6 orthographic
                # similarity, below any fuzzy bar that would not also match
                # unrelated names. It reported nine correct readings as missing
                # their characters.
                #
                # Gating it behind a similarity threshold does not rescue it
                # either. Name-only drift scores about 0.90-0.96 because names
                # are a small share of the words; a correct recording with a
                # mistranscribed name scores 0.96-0.99. Those overlap, so any
                # threshold between them decides the overlapping cases by luck,
                # and shipping that would trade a loud false positive for a
                # silent false negative.
                #
                # Printing it still earns its place: on a clip that failed for
                # some other reason, "names never spoken: amal" tells you at a
                # glance that a rename is the cause.
                #
                # Rename drift has a better detector that owes nothing to
                # transcription: compare a clip's file date against the commit
                # that renamed the characters. It is deterministic, free, and it
                # is what actually found the 201 stale readings.
                gone = missing_names(sentence, heard) if ratio < NAME_TRUST else []
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
                    why = f"similarity {ratio:.2f}"
                    if gone:
                        why += f" | names never spoken: {', '.join(gone)}"
                    print(f"g{grade} {category} {unit_name} {mp3.name}  {why}")
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
