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


@functools.lru_cache(maxsize=None)
def composed_scripts_at(commit: str, grade: int) -> tuple:
    """{clip_id: script} the generator would narrate for `grade` at `commit`.

    Returned as a tuple of pairs so lru_cache can hold it.
    """
    target = _worktree_at(commit)
    if target is None:
        return ()
    with tempfile.TemporaryDirectory() as tmp:
        out = Path(tmp) / "overview.json"
        subprocess.run(
            ["node", "tools/generate-ehel-english-audio.js", "overview", str(grade),
             "--emit-scripts", str(out)],
            cwd=target, capture_output=True, text=True, encoding="utf-8", errors="replace")
        if not out.exists():
            return ()
        return tuple(json.loads(out.read_text(encoding="utf-8")).items())


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


def norm(text: str) -> str:
    """Whitespace collapsed, for the same reason script_of() collapses it: a
    reflow changes the file and changes nothing a listener could hear."""
    return re.sub(r"\s+", " ", text or "").strip()


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
        parts.append("{}[{}]={}".format(key, index, re.sub(r"\s+", " ", str(value)).strip()))
    return "\n".join(parts)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--grades", nargs="*", type=int, default=list(range(1, 9)))
    parser.add_argument("--out", help="write stale clip ids here, as the generator's --only-file")
    args = parser.parse_args()

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
        scripts = {clip_id: script for _, _, clip_id, script, _ in
                   audit.clips_for_grade(grade, audit.CATEGORIES)}
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
                fields = narrated_fields(obj, scripts.get(clip_id, ""))
                if not fields:
                    # No field carries this clip's text, so the script is composed
                    # rather than stored. Ask the generator what it narrated then
                    # and what it narrates now, instead of giving up on the clip.
                    category = mp3.split("/")[-2]
                    then_scripts = dict(composed_scripts_at(commit, grade))
                    now_script = scripts.get(clip_id)
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
