#!/usr/bin/env python
"""Find English clips whose script was edited after the recording was made.

English clips are named for their content, and the generator reuses any mp3
over 1 KB that already exists. So editing a sentence leaves the old audio in
place, still marked available:true, and nothing notices. Every other subject
orphans the clip automatically, because its filename is a hash of its text.

This is the detector that found the 201 stale readings, made repeatable. It
asks one question per clip, and answers it from git alone:

    has the text changed since the commit that last wrote this mp3?

That is deterministic and free. It runs in a minute, spends nothing, and has
none of the failure modes of listening to the audio: no transcription noise, no
similarity threshold, no trouble with proper nouns or British spelling. Where
tools/audit-ehel-english-sentence-audio.py must hear a clip to judge it, this
knows without listening.

It is also the right tool for the one thing the transcription audit cannot do
reliably. A pure rename — "Amal" for "Sarah" throughout a long story, nothing
else altered — scores about 0.90-0.96 by word, inside the range a correct
recording with a mistranscribed name occupies, so no threshold separates them.
Here it is not a judgement call: the text changed on 2026-07-24, the recording
is from 2026-07-21, the clip is stale.

Most clips carry their script in a field, and for those the comparison is a
diff of that field across two commits. Overview panels do not: their text is
composed by the generator, so no field holds it and the field-derivation below
finds nothing. That silently skipped all 31 live overview clips — reported as
"could not be identified" under an otherwise clean ok. They are now covered by
running the generator itself against a checkout of the recording commit
(composed_scripts_at), and any clip still unexamined is named BY CATEGORY, so
the number cannot read as rounding error again.

What it cannot see, so run the transcription audit as well: a recording that
never matched its script in the first place. Grade 1's speaking clips said "My
name is Nabe Gadao" the day they were made — the text and the audio have the
same date, and only listening finds that. It also holds the composition rule
fixed at today's, so a change to how a panel is ASSEMBLED (rather than to the
data it assembles) is invisible here.

    python tools/check-english-audio-staleness.py
    python tools/check-english-audio-staleness.py --grades 5 6 7 8
    python tools/check-english-audio-staleness.py --out repair.json

Exits non-zero when any clip is stale, so it can gate a release.
"""
from __future__ import annotations

import argparse
import atexit
import collections
import functools
import json
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

print = functools.partial(print, flush=True)  # noqa: A001 - long runs, live log
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace", line_buffering=True)
except AttributeError:  # pragma: no cover
    pass

ROOT = Path(__file__).resolve().parents[1]
ENGLISH = ROOT / "src" / "prototypes" / "ehel-academy" / "english"
AUDIO = "src/prototypes/ehel-academy/english/media/audio"

# Keys that are not the script: identifiers, provenance, and the audio
# descriptor itself. Everything else in a clip's object is text a learner reads,
# so a change to any of it is a change the recording does not know about.
NOT_SCRIPT = {
    "audio", "practiceAudio", "source", "normal", "slow", "provider", "voiceId",
    "available", "status", "outcomeId", "unitId", "conceptId", "sequence",
    "origin", "reviewStatus", "sourceFile", "recordingRequired", "activityType",
    "practiceType",
}
ID_KEYS = ("readingId", "speakingId", "grammarId", "writingId", "activityId",
           "vocabularyId", "questionId", "wordId")


def _load_audit():
    """The transcription audit, imported for its clips_for_grade only.

    Its filename has hyphens, so it cannot be imported by name.
    """
    import importlib.util
    path = Path(__file__).with_name("audit-ehel-english-sentence-audio.py")
    spec = importlib.util.spec_from_file_location("ehel_audit", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def git(*args: str) -> str:
    return subprocess.run(["git", *args], cwd=ROOT, capture_output=True,
                          text=True, encoding="utf-8", errors="replace").stdout


def newest_commit_per_clip() -> dict:
    """{repo-relative mp3 path: (commit, date)} in ONE traversal.

    A `git log` per file is the obvious way and takes longer than the audit it
    is meant to replace — 16,953 files timed out at ten minutes. One walk of the
    audio tree, newest first, answers every file at once.
    """
    out, seen, commit, date = {}, set(), None, None
    log = git("log", "--format=COMMIT %H %ad", "--date=short", "--name-only", "--", AUDIO)
    for line in log.split("\n"):
        line = line.rstrip()
        if line.startswith("COMMIT "):
            _, commit, date = line.split(" ", 2)
            continue
        if line.endswith(".mp3") and line not in seen:
            seen.add(line)
            out[line] = (commit, date)
    return out


@functools.lru_cache(maxsize=4096)
def file_at(commit: str, path: str) -> str:
    return git("show", f"{commit}:{path}")


# --- composed scripts (the overview category) --------------------------------
# An overview panel's text is not a field. It is the first two sentences of
# unitOverview, or the outcomes joined, or the learning path flattened, and one
# panel's wording exists only inside the generator. So narrated_fields() below
# finds no field whose text is in the script, returns nothing, and the clip is
# skipped — which is how all 31 live overview clips came to be counted as
# "narrated field could not be identified" while the run still reported ok.
#
# Rebuilding the composition here would be the second copy of a rule the audit
# tool's docstring already warns about. Instead the real generator is run twice:
# once on the working tree and once on a checkout of the recording commit. Both
# runs use --emit-scripts, which writes what it WOULD narrate and sends nothing,
# so this costs no ElevenLabs characters.
#
# The generator resolves its own paths from __dirname, so running it inside a
# worktree makes it read that commit's data — no path overrides needed. The
# checkout is sparse (tools/ and the English unit data only); a full one would
# materialise the ~1.4 GB media tree for a text comparison.
_WORKTREES: dict = {}


def _cleanup_worktrees() -> None:
    for target in list(_WORKTREES.values()):
        if target is None:
            continue
        git("worktree", "remove", "--force", str(target))
        shutil.rmtree(target.parent, ignore_errors=True)


atexit.register(_cleanup_worktrees)


def _worktree_at(commit: str):
    """A sparse checkout of `commit`, deep enough to run the generator in."""
    if commit in _WORKTREES:
        return _WORKTREES[commit]
    holder = Path(tempfile.mkdtemp(prefix="ehel-staleness-"))
    target = holder / "tree"
    added = subprocess.run(
        ["git", "worktree", "add", "--no-checkout", "--detach", str(target), commit],
        cwd=ROOT, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if added.returncode != 0:
        shutil.rmtree(holder, ignore_errors=True)
        _WORKTREES[commit] = None
        return None
    for argv in (["sparse-checkout", "set", "--no-cone",
                  "/src/prototypes/ehel-academy/english/grade-*/data/"],
                 ["checkout"]):
        subprocess.run(["git", "-C", str(target), *argv],
                       capture_output=True, text=True, encoding="utf-8", errors="replace")
    # The CURRENT generator is copied in rather than checked out with the rest.
    # --emit-scripts did not exist at every commit that recorded a clip: the
    # 2026-08-05 overview commit predates it, and that generator ignores the
    # unknown flag, tries to narrate all 36 panels and writes no script file.
    #
    # So this holds the composition rule fixed at today's and varies only the
    # DATA, which is the question being asked — did the text change under the
    # recording. A change to the composition itself is invisible to that, and is
    # reported separately below rather than silently folded in.
    (target / "tools").mkdir(parents=True, exist_ok=True)
    shutil.copy2(ROOT / "tools" / "generate-ehel-english-audio.js", target / "tools")
    shutil.copytree(ROOT / "tools" / "lib", target / "tools" / "lib", dirs_exist_ok=True)
    _WORKTREES[commit] = target
    return target


# Categories whose narrated text is COMPOSED rather than stored in a field, so
# the only way to know what a clip said at a past commit is to ask the generator
# as it was then.
#
# `glossary` is here because a glossary clip's text is not reachable from the
# object the descriptor sits in. sentence-glossary.json keys its entries BY THE
# WORD, so the word clip narrates the map key while narrated_fields() only ever
# looks at the entry's own values — no field holds it, so every one of them fell
# through to `unmapped`. That was 35,314 clips, every glossary clip in the
# course, reported as unexamined behind a "174 stale" headline that was a result
# over 62% of it.
#
# Asking the generator rather than rebuilding the rule is not fastidiousness
# here, it is the difference between a check and a false alarm: the word clip
# narrates `narration(entry.speechSpelling || word)`, and speechSpelling exists
# precisely to send a DIFFERENT string from the one on the page ("toe" is sent
# as "tow" because the voice reads the real spelling as "two"). A local
# reimplementation that narrated the key would report every respelled clip as
# stale — the clips that are correct BECAUSE somebody fixed them.
COMPOSED_CATEGORIES = ("overview", "glossary")


@functools.lru_cache(maxsize=None)
def composed_scripts_at(commit: str, grade: int) -> tuple:
    """{clip_id: script} the generator would narrate for `grade` at `commit`.

    Returned as a tuple of pairs so lru_cache can hold it.
    """
    target = _worktree_at(commit)
    if target is None:
        return ()
    merged = {}
    with tempfile.TemporaryDirectory() as tmp:
        for category in COMPOSED_CATEGORIES:
            out = Path(tmp) / f"{category}.json"
            subprocess.run(
                ["node", "tools/generate-ehel-english-audio.js", category, str(grade),
                 "--emit-scripts", str(out)],
                cwd=target, capture_output=True, text=True, encoding="utf-8", errors="replace")
            # One category failing must not discard the other. A commit that
            # predates sentence-glossary.json emits no glossary and still has
            # overviews worth comparing, and returning () for both would put the
            # overviews back into `unmapped` — trading one blind spot for another.
            if out.exists():
                merged.update(json.loads(out.read_text(encoding="utf-8")))
    return tuple(merged.items())


def clip_objects(node, parent=None, found=None):
    """Every clip in the file, keyed by its mp3 filename, mapped to the object
    that holds its text.

    Keyed by FILENAME, not by an id field, and that is the whole point. The
    first version indexed on readingId/speakingId/grammarId and friends, which
    silently limited it to items that carry one: it checked 1,898 clips and
    reported English clean, while English has 16,950. The 10,355 vocabulary
    sentences, 2,211 meanings and 1,889 dictionary words are bare audio
    descriptors nested inside their parent item with no id of their own, so 85%
    of the course was never examined — including a Grade 5 sentence still saying
    "Miss Rahma" a fortnight after the text became "Teacher Yasmin".

    Every clip has a source path by definition, so nothing can hide from this.
    The basename also matches the id the audit tool uses, so the two agree on
    what a clip is called without either being told.
    """
    found = {} if found is None else found
    if isinstance(node, list):
        for item in node:
            clip_objects(item, parent, found)
    elif isinstance(node, dict):
        source = node.get("source") or node.get("normal")
        if isinstance(source, str) and source.endswith(".mp3"):
            # The descriptor names the clip; the object AROUND it carries the
            # text. For a reading that parent is the reading; for a practice
            # sentence it is the sentence.
            found[source.rsplit("/", 1)[-1][:-4]] = (
                parent if isinstance(parent, dict) else node, node)
        for value in node.values():
            clip_objects(value, node, found)
    return found


def narrated_fields(obj: dict, script: str) -> list:
    """Which of this object's fields the recording actually says.

    Comparing every text field was the first attempt and it over-reports: it
    called seven Grade 4 speaking clips stale because `aiTutorPrompt` had been
    rewritten, which no recording has ever narrated — the audio reads
    `instructionsAndModelLines`, and that was untouched.

    A hand-kept per-category list would be exact and would rot: a field added to
    the data stays invisible until somebody remembers this file. So the fields
    are derived instead, from the script the audit tool builds for the clip — a
    field is narrated when its text is IN that script. One definition of what is
    narrated, in tools/audit-ehel-english-sentence-audio.py, and this follows it
    automatically.
    """
    flat = re.sub(r"\s+", " ", script or "").strip()
    out = []
    for key, value in obj.items():
        if key in NOT_SCRIPT or key in ID_KEYS or not isinstance(value, str):
            continue
        text = re.sub(r"\s+", " ", value).strip()
        if not text:
            continue
        # Containment needs length behind it or short strings match anything —
        # "a" is inside every script. But a short script is exactly what a
        # dictionary word or a one-line meaning IS, and requiring 12 characters
        # skipped 1,455 clips in Grade 5 alone, reporting them as unidentifiable
        # rather than checking them. So a short field has to match the script
        # outright instead.
        if text == flat or (len(text) >= 12 and text in flat):
            out.append((key, None))

    # Practice sentences keep their text in a LIST beside a parallel list of
    # audio descriptors, so the clip's script is one element rather than a
    # field. Considering only string fields skipped every one of them: 1,234
    # clips in Grade 5 alone were reported as unidentifiable and silently not
    # checked, which is how a sentence still saying "Miss Rahma" survived.
    #
    # The element is found by matching the audit's script for THIS clip, so the
    # right index is identified by content rather than by parsing "-sentence-4"
    # out of the id and trusting the numbering to line up.
    if not out:
        for key, value in obj.items():
            if key in NOT_SCRIPT or key in ID_KEYS or not isinstance(value, list):
                continue
            for index, element in enumerate(value):
                if not isinstance(element, str):
                    continue
                if re.sub(r"\s+", " ", element).strip() == flat:
                    out.append((key, index))
                    break
            if out:
                break
    return out


# --ignore-respelling: a US→British respelling ("emphasize" → "emphasise",
# "center" → "centre", "labor" → "labour") changes the file and changes nothing
# a listener could hear, exactly like a reflow. On 2026-08-17 the whole course
# was respelled British (repair-ehel-english-british-spelling.js, 730 strings)
# and this check reported every one of them stale — a bill for ~300 clips that
# already say the right thing. Under the flag both sides of the comparison go
# through the same map, so only edits that move the SOUND count. The map is the
# same pairs the respelling tool used; keep the two in step.
IGNORE_RESPELLING = False
_IZE_STEMS = ("synthes|emphas|organ|antagon|material|character|plagiar|critic|civil|mechan|recogn|real|apolog|memor|"
              "summar|visual|categor|priorit|minim|maxim|special|util|stabil|modern|industrial|author|global|social|"
              "harmon|ideal|mobil|normal|optim|personal|popular|public|random|revolution|standard|sympath|symbol|theor|"
              "vandal|victim|fertil|familiar|dramat|digit|custom|colon|capital|central|commercial|criminal|econom|energ|"
              "equal|final|formal|general|human|hypnot|item|jeopard|legitim|local|marginal|mesmer|monopol|national|"
              "neutral|patron|penal|polar|pressur|privat|rational|satir|scrutin|steril|subsid|terror|traumat|trivial|"
              "urban|verbal|vocal|agon|empath|epitom|fantas|immortal|individual|internal|ion|legal|liberal|magnet|"
              "memorial|moral|natural|prior|reorgan|roman|sanit|scandal|sensational|solemn|stigmat|tender|vapor")
_IZE_RE = re.compile(r"\b((?:" + _IZE_STEMS + r"))iz(e|es|ed|ing|ation|ations|er|ers|able)\b", re.I)
_PAIRS = {
    "labor": "labour", "labors": "labours", "labored": "laboured", "laboring": "labouring", "laborer": "labourer", "laborers": "labourers",
    "honor": "honour", "honors": "honours", "honored": "honoured", "honoring": "honouring", "honorable": "honourable", "honorably": "honourably",
    "demeanor": "demeanour", "candor": "candour", "clamor": "clamour", "clamors": "clamours", "clamored": "clamoured", "clamoring": "clamouring",
    "humor": "humour", "behavior": "behaviour", "behaviors": "behaviours", "neighbor": "neighbour", "neighbors": "neighbours",
    "neighborhood": "neighbourhood", "neighborhoods": "neighbourhoods", "favor": "favour", "favors": "favours", "favorite": "favourite",
    "favorites": "favourites", "flavor": "flavour", "flavors": "flavours", "color": "colour", "colors": "colours", "colored": "coloured",
    "colorful": "colourful", "harbor": "harbour", "harbors": "harbours", "rumor": "rumour", "rumors": "rumours", "odor": "odour",
    "odors": "odours", "vigor": "vigour", "endeavor": "endeavour", "endeavors": "endeavours", "splendor": "splendour", "valor": "valour",
    "fervor": "fervour", "armor": "armour", "center": "centre", "centers": "centres", "centered": "centred", "meter": "metre",
    "meters": "metres", "centimeter": "centimetre", "centimeters": "centimetres", "kilometer": "kilometre", "kilometers": "kilometres",
    "millimeter": "millimetre", "millimeters": "millimetres", "liter": "litre", "liters": "litres", "theater": "theatre",
    "theaters": "theatres", "fiber": "fibre", "fibers": "fibres", "somber": "sombre", "meager": "meagre", "luster": "lustre",
    "specter": "spectre", "defense": "defence", "defenses": "defences", "offense": "offence", "offenses": "offences", "mold": "mould",
    "molds": "moulds", "moldy": "mouldy", "artifact": "artefact", "artifacts": "artefacts", "mollusk": "mollusc", "mollusks": "molluscs",
    "archeological": "archaeological", "archeology": "archaeology", "archeologist": "archaeologist", "archeologists": "archaeologists",
    "instill": "instil", "instills": "instils", "grueling": "gruelling", "cozy": "cosy", "cozier": "cosier", "coziest": "cosiest",
    "curb": "kerb", "curbs": "kerbs", "traveling": "travelling", "traveled": "travelled", "traveler": "traveller", "travelers": "travellers",
    "canceled": "cancelled", "canceling": "cancelling", "labeled": "labelled", "labeling": "labelling", "modeled": "modelled",
    "modeling": "modelling", "marvelous": "marvellous", "jewelry": "jewellery", "gray": "grey", "skeptical": "sceptical", "skeptic": "sceptic",
    "catalog": "catalogue", "catalogs": "catalogues", "plow": "plough", "plows": "ploughs", "analyze": "analyse", "analyzes": "analyses",
    "analyzed": "analysed", "analyzing": "analysing", "paralyze": "paralyse", "paralyzed": "paralysed",
}
_PAIR_RE = re.compile(r"\b(" + "|".join(sorted(_PAIRS, key=len, reverse=True)) + r")\b", re.I)


def british(text: str) -> str:
    """Map US spellings to British so a respelling compares equal (lower-cased —
    only the SOUND is being compared here)."""
    text = _IZE_RE.sub(lambda m: m.group(1) + "is" + m.group(2), text)
    # A hyphen between letters is silent too: "brightly-coloured" and "brightly
    # coloured" are one recording.
    text = re.sub(r"(?<=[A-Za-z])-(?=[A-Za-z])", " ", text)
    # Also silent: the full stop after Mr/Mrs/Ms/Dr, and the space in "any
    # more" / "per cent" (US "anymore" / "percent").
    text = re.sub(r"(Mr|Mrs|Ms|Dr)\.", r"", text)
    text = re.sub(r"any more", "anymore", text, flags=re.I).replace("per cent", "percent").replace("Per cent", "percent")
    return _PAIR_RE.sub(lambda m: _PAIRS[m.group(1).lower()], text.lower())


def norm(text: str) -> str:
    """Whitespace collapsed, for the same reason script_of() collapses it: a
    reflow changes the file and changes nothing a listener could hear."""
    out = re.sub(r"\s+", " ", text or "").strip()
    return british(out) if IGNORE_RESPELLING else out


def script_of(obj: dict, fields: list) -> str:
    """The narrated text, with whitespace collapsed.

    Collapsing matters: a reflow that turns "?” → “I" into "?”  →  “I" changes
    the file and changes nothing a listener could hear, and reporting it as
    stale would spend money re-recording an identical clip.
    """
    parts = []
    for key, index in sorted(fields, key=lambda f: (f[0], f[1] if f[1] is not None else -1)):
        value = obj.get(key, "")
        if index is not None:
            value = value[index] if isinstance(value, list) and index < len(value) else ""
        parts.append("{}[{}]={}".format(key, index, norm(str(value))))
    return "\n".join(parts)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--grades", nargs="*", type=int, default=list(range(1, 9)))
    parser.add_argument("--out", help="write stale clip ids here, as the generator's --only-file")
    parser.add_argument("--ignore-respelling", action="store_true",
                        help="treat a US→British respelling as unchanged (a homophone is the same recording)")
    args = parser.parse_args()
    global IGNORE_RESPELLING
    IGNORE_RESPELLING = args.ignore_respelling

    print("reading git history for the audio tree…")
    newest = newest_commit_per_clip()
    print(f"  {len(newest)} clips have a commit\n")

    # The audit tool owns the definition of what each clip narrates. Importing it
    # rather than restating it is the point: the two cannot disagree about which
    # text a recording is supposed to say.
    audit = _load_audit()

    # unmapped is counted BY CATEGORY. As one number it was uninterpretable: 31
    # out of 16,948 reads as rounding, and it was in fact every overview clip in
    # the course going unexamined behind an "ok".
    stale, checked, untracked = [], 0, 0
    unmapped = collections.Counter()
    for grade in args.grades:
        data_dir = ENGLISH / f"grade-{grade}" / "data"
        if not data_dir.exists():
            continue
        # Keyed by the clip's PATH, not by its bare id, because ids are only
        # unique within a category and the categories share a grade.
        #
        # A word can be both a master-dictionary headword and a sentence-glossary
        # entry, and then both narrate a clip whose basename is the same slug —
        # media/audio/grade-2/dictionary/adobe-house.mp3 and
        # .../glossary/adobe-house.mp3. Keyed by id, the second wins and the
        # first is compared against the other one's script. They are usually the
        # same string, which is what makes this quiet: it only shows up where the
        # two spellings differ, and then it shows up as a clip that was never
        # touched being reported stale. Grade 2 alone has 246 such collisions and
        # every one of the 22 "stale" glossary clips a path-blind run reported
        # was one of them — the dictionary says "adobe house", the glossary key
        # is "adobe-house", and neither recording had changed.
        #
        # The path is what the descriptor actually points at, so it cannot
        # collide. Paths are normalised to repo-relative posix on both sides.
        scripts = {}
        for _, _, _clip_id, script, clip_mp3 in audit.clips_for_grade(grade, audit.CATEGORIES):
            try:
                key = Path(clip_mp3).resolve().relative_to(ROOT.resolve()).as_posix()
            except ValueError:
                key = Path(clip_mp3).as_posix()
            scripts[key] = script
        for path in sorted(data_dir.rglob("*.json")):
            rel = path.relative_to(ROOT).as_posix()
            try:
                current = json.loads(path.read_text(encoding="utf-8"))
            except json.JSONDecodeError as error:
                print(f"  {rel}: unreadable ({error})")
                continue
            now = clip_objects(current)
            if not now:
                continue
            for clip_id, (obj, descriptor) in now.items():
                source = descriptor.get("source") or descriptor.get("normal")
                if descriptor.get("available") is not True or not source:
                    continue
                mp3 = f"{AUDIO}/{source.replace('./media/audio/', '')}"
                if mp3 not in newest:
                    untracked += 1
                    continue
                commit, recorded = newest[mp3]
                checked += 1
                was = file_at(commit, rel)
                if not was:
                    continue  # the data file did not exist then; nothing to compare
                try:
                    was_pair = clip_objects(json.loads(was)).get(clip_id)
                except json.JSONDecodeError:
                    continue
                if was_pair is None:
                    continue
                then = was_pair[0]
                fields = narrated_fields(obj, scripts.get(mp3, ""))
                if not fields:
                    # No field carries this clip's text, so the script is composed
                    # rather than stored. Ask the generator what it narrated then
                    # and what it narrates now, instead of giving up on the clip.
                    category = mp3.split("/")[-2]
                    then_scripts = dict(composed_scripts_at(commit, grade))
                    now_script = scripts.get(mp3)
                    then_script = then_scripts.get(clip_id)
                    if not now_script or then_script is None:
                        unmapped[category] += 1
                        continue
                    if norm(then_script) != norm(now_script):
                        stale.append((grade, clip_id, recorded, rel, mp3))
                    continue
                if script_of(then, fields) != script_of(obj, fields):
                    stale.append((grade, clip_id, recorded, rel, mp3))

    total_unmapped = sum(unmapped.values())
    print(f"checked {checked} live clips ({untracked} not in git history, "
          f"{total_unmapped} whose narrated text could not be identified)")
    # Named per category, because the number alone cannot be acted on and a
    # clean "ok" underneath it reads as full coverage when it is not.
    if total_unmapped:
        print("  unexamined by category:", dict(unmapped.most_common()))
        print("  these are NOT checked below — the run says nothing about them.")
    print()
    if not stale:
        print("──────── ok ──────── every clip's script is unchanged since it was recorded")
        return

    by_grade = collections.Counter(g for g, *_ in stale)
    by_cat = collections.Counter(m.split("/")[-2] for *_, m in stale)
    print(f"──────── STALE: {len(stale)} clip(s) ────────")
    print("  by grade:   ", dict(sorted(by_grade.items())))
    print("  by category:", dict(by_cat.most_common()))
    print("\n  e.g.")
    for grade, clip_id, recorded, *_ in stale[:8]:
        print(f"    g{grade} {clip_id}  recorded {recorded}, script edited since")

    if args.out:
        repair = collections.defaultdict(list)
        for grade, clip_id, *_ in stale:
            repair[str(grade)].append(clip_id)
        Path(args.out).write_text(json.dumps(repair, indent=1), encoding="utf-8")
        print(f"\n  repair list written to {args.out}")
    sys.exit(1)


if __name__ == "__main__":
    main()
