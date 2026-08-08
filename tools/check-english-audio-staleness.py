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

What it cannot see, so run the transcription audit as well: a recording that
never matched its script in the first place. Grade 1's speaking clips said "My
name is Nabe Gadao" the day they were made — the text and the audio have the
same date, and only listening finds that.

    python tools/check-english-audio-staleness.py
    python tools/check-english-audio-staleness.py --grades 5 6 7 8
    python tools/check-english-audio-staleness.py --out repair.json

Exits non-zero when any clip is stale, so it can gate a release.
"""
from __future__ import annotations

import argparse
import collections
import functools
import json
import re
import subprocess
import sys
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


def clip_objects(node, found=None):
    """Every object that names a clip id, keyed by that id."""
    found = {} if found is None else found
    if isinstance(node, list):
        for item in node:
            clip_objects(item, found)
    elif isinstance(node, dict):
        for key in ID_KEYS:
            if isinstance(node.get(key), str):
                found[node[key]] = node
                break
        for value in node.values():
            clip_objects(value, found)
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
        if len(text) >= 12 and text in flat:
            out.append(key)
    return out


def script_of(obj: dict, fields: list) -> str:
    """The narrated text, with whitespace collapsed.

    Collapsing matters: a reflow that turns "?” → “I" into "?”  →  “I" changes
    the file and changes nothing a listener could hear, and reporting it as
    stale would spend money re-recording an identical clip.
    """
    return "\n".join(
        "{}={}".format(key, re.sub(r"\s+", " ", str(obj.get(key, ""))).strip())
        for key in sorted(fields)
    )


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

    stale, checked, untracked, unmapped = [], 0, 0, 0
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
            for clip_id, obj in now.items():
                descriptor = obj.get("audio") or {}
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
                    then = clip_objects(json.loads(was)).get(clip_id)
                except json.JSONDecodeError:
                    continue
                if then is None:
                    continue
                fields = narrated_fields(obj, scripts.get(clip_id, ""))
                if not fields:
                    unmapped += 1
                    continue
                if script_of(then, fields) != script_of(obj, fields):
                    stale.append((grade, clip_id, recorded, rel, mp3))

    print(f"checked {checked} live clips ({untracked} not in git history, "
          f"{unmapped} whose narrated field could not be identified)\n")
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
