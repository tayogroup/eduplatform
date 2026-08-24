#!/usr/bin/env python3
"""Transcribe Intensive English narration and compare it with its script.

The existence checks cannot see this defect. Clips here are named cyrb53(text),
so a file always corresponds to the text that minted it — that is what makes
staleness impossible in this course. What it does NOT guarantee is that the
recording SAYS that text: a render can be truncated, or the voice can simply
say a different word (`toe` narrated as "two" in the Grade 2 English dictionary
survived a fresh re-render from the correct script).

Three rules carried over from tools/audit-ehel-english-sentence-audio.py,
each of which was learned by getting it wrong there:

  Compare by WORD, never by character. difflib cannot realign after a few early
  differences in a long passage, and a Grade 4 reading differing by seven words
  in 189 scored 0.48 by character.

  Never fail a clip for a proper noun. Whisper renders unfamiliar names
  unpredictably ("Tariq" as "Tareek"), and that overlaps the range real drift
  occupies. They are reported, never scored against.

  Do not transcribe single words. On sub-second audio Whisper hallucinates —
  "mouth" comes back as "Please subscribe" — so the 420 `words` clips are
  excluded by default. Homophones are undecidable by anything that listens
  anyway, which is why English ranks candidates for those instead of
  transcribing. --include-words overrides, for inspection only.

Usage:
  python tools/audit-intensive-english-audio.py                  # all but `words`
  python tools/audit-intensive-english-audio.py --categories readings lecture
  python tools/audit-intensive-english-audio.py --limit 50       # prove the pipeline
  python tools/audit-intensive-english-audio.py --out report.json
"""
from __future__ import annotations

import argparse
import io
import json
import os
import re
import subprocess
import sys
import time
import warnings
from pathlib import Path

warnings.filterwarnings("ignore")

ROOT = Path(__file__).resolve().parents[1]
COURSE = ROOT / "src/prototypes/ehel-academy/intensive-english"
TTS = COURSE / "media/audio/tts"
# Whisper spells by ear, so a mismatch that is only a spelling convention is not
# drift. This course was migrated to UK spelling on 2026-08-17; the model was
# trained on both and will return either.
SPELLING_EQUIV = [
    ("our", "or"), ("ise", "ize"), ("isation", "ization"), ("yse", "yze"),
    ("re", "er"), ("ll", "l"), ("ae", "e"), ("oe", "e"),
    # Found by running the full pass: the generic rules above miss these, and
    # each one produced flags that were purely orthographic.
    ("judgement", "judgment"), ("practise", "practice"), ("licence", "license"),
    ("enquir", "inquir"), ("metre", "meter"), ("centre", "center"),
    ("travelling", "traveling"), ("cheque", "check"),
]

# Whisper writes numbers as DIGITS and the scripts write them as words, so
# "The party starts at eight" comes back as "at 8". That single fact produced
# 105 of the first run's 293 flags — more than a third of everything reported,
# none of it drift. Normalise before comparing rather than explaining it in the
# output afterwards.
NUMBER_WORDS = {
    "zero": "0", "one": "1", "two": "2", "three": "3", "four": "4", "five": "5",
    "six": "6", "seven": "7", "eight": "8", "nine": "9", "ten": "10",
    "eleven": "11", "twelve": "12", "thirteen": "13", "fourteen": "14",
    "fifteen": "15", "sixteen": "16", "seventeen": "17", "eighteen": "18",
    "nineteen": "19", "twenty": "20", "thirty": "30", "forty": "40",
    "fifty": "50", "sixty": "60", "seventy": "70", "eighty": "80", "ninety": "90",
}
MULTI_WORD_NUMBERS = [
    ("one thousand", "1000"), ("a thousand", "1000"), ("two thousand", "2000"),
    ("three thousand", "3000"), ("four thousand", "4000"), ("five thousand", "5000"),
    ("one hundred", "100"), ("two hundred", "200"), ("three hundred", "300"),
    ("per cent", "%"), ("percent", "%"),
]


def normalise_numbers(text: str) -> str:
    out = text.lower()
    for phrase, digits in MULTI_WORD_NUMBERS:
        out = out.replace(phrase, digits)
    out = _WORD_TOKEN.sub(lambda m: NUMBER_WORDS.get(m.group(0), m.group(0)), out)
    return out

WORD_RE = re.compile(r"[a-z0-9']+")
_WORD_TOKEN = re.compile("[a-z]+")

# A printed form: a run of capitalised column headers, or a price/time table.
FORM_RE = re.compile("(?:[A-Z]{3,}[^a-z]*){2,}|[0-9]{1,2}:[0-9]{2}")

# Below this many words, one wrong word is a defect rather than noise.
SHORT_WORDS = 12
# Function words the model drops or inserts freely; their absence is not drift.
STOPWORDS = {
    "a", "an", "the", "and", "or", "but", "so", "of", "to", "in", "on", "at",
    "for", "with", "is", "are", "was", "were", "be", "been", "am", "do", "does",
    "did", "it", "its", "this", "that", "these", "those", "as", "by", "from",
    "up", "out", "if", "then", "than", "too", "very", "s", "t",
}


def clips_from_node() -> list[dict]:
    """Ask the narration library, not the filesystem.

    The library is the one definition of what this course narrates — the
    generator, uploader and pruner all read it — so deriving the list any other
    way is how two tools come to disagree about what is reachable.
    """
    script = r"""
const fs=require('fs'),path=require('path');
const n=require('./tools/lib/ehel-intensive-narration.js');
const C='src/prototypes/ehel-academy/intensive-english';
const out=new Map();
for(const raw of require('./tools/lib/ehel-wehel-phrases').phrasesForSubject('intensive-english')){
  const t=n.clean(raw); if(t.length>=n.MIN_CHARS) out.set(n.cyrb53(t),{text:t,category:'wehel'});
}
for(const e of fs.readdirSync(C)){
  const m=e.match(/^level-(\d+)$/); if(!m) continue;
  const d=path.join(C,e,'data','units'); if(!fs.existsSync(d)) continue;
  for(const f of fs.readdirSync(d)){
    if(!/^unit-\d+\.json$/.test(f)) continue;
    const u=JSON.parse(fs.readFileSync(path.join(d,f),'utf8'));
    for(const c of n.clipsForUnit(u)) if(!out.has(c.hash)) out.set(c.hash,{text:c.text,category:c.category});
  }
}
process.stdout.write(JSON.stringify([...out].map(([hash,v])=>({hash,...v}))));
"""
    proc = subprocess.run([_node(), "-e", script], cwd=ROOT, capture_output=True, text=True, encoding="utf-8")
    if proc.returncode != 0:
        sys.exit(f"could not read the narration library:\n{proc.stderr[:800]}")
    return json.loads(proc.stdout)


def _node() -> str:
    return "node"


def words(text: str) -> list[str]:
    return WORD_RE.findall(normalise_numbers(text))


def spelling_variants(w: str) -> set[str]:
    out = {w}
    for a, b in SPELLING_EQUIV:
        if a in w:
            out.add(w.replace(a, b))
        if b in w:
            out.add(w.replace(b, a))
    return out


# Words seen capitalised MID-SENTENCE anywhere in the course. Built once over
# every script, because a name at the start of its own sentence is
# indistinguishable from an ordinary word — "Tariq met Amal" would leave Tariq
# undetected and the clip flagged for a name, which is the documented false
# positive this is meant to avoid. Seeing the same name mid-sentence elsewhere
# in the corpus settles it.
CORPUS_NAMES: set[str] = set()


def proper_nouns(text: str) -> set[str]:
    """Names in this text, resolved against the whole-course set."""
    found = set()
    for sentence in re.split(r"(?<=[.!?])\s+", text):
        for i, tok in enumerate(sentence.split()):
            bare = tok.strip(".,;:!?\"'()")
            if not bare or bare.lower() == "i":
                continue
            if bare[:1].isupper() and (i or bare.lower() in CORPUS_NAMES):
                found.add(bare.lower())
    return found


def learn_names(clips: list[dict]) -> None:
    for c in clips:
        for sentence in re.split(r"(?<=[.!?])\s+", c["text"]):
            for i, tok in enumerate(sentence.split()):
                bare = tok.strip(".,;:!?\"'()")
                if i and bare[:1].isupper() and bare.lower() != "i":
                    CORPUS_NAMES.add(bare.lower())


def score(script: str, heard: str) -> tuple[float, list[str], list[str]]:
    """Word-level similarity, plus what was missed and what was invented."""
    import difflib

    a, b = words(script), words(heard)
    if not a:
        return 1.0, [], []
    sm = difflib.SequenceMatcher(a=a, b=b, autojunk=False)
    matched = sum(bl.size for bl in sm.get_matching_blocks())
    missed, extra = [], []
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag in ("replace", "delete"):
            missed.extend(a[i1:i2])
        if tag in ("replace", "insert"):
            extra.extend(b[j1:j2])
    # A word the model only spelled differently is not a miss.
    heard_set = set(b)
    missed = [w for w in missed if not (spelling_variants(w) & heard_set)]
    return matched / len(a), missed, extra


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--categories", nargs="*", default=None)
    ap.add_argument("--include-words", action="store_true")
    ap.add_argument("--score-forms", action="store_true")
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--model", default="base")
    ap.add_argument("--threshold", type=float, default=0.80)
    ap.add_argument("--out", default=None)
    # A successful run with findings used to exit 1, which the harness and any CI
    # step read as a crash — so a completed audit reported itself as failed, and a
    # real crash became indistinguishable from a clean finish with results.
    # Findings are the OUTPUT of this tool, not an error in it.
    ap.add_argument("--fail-on-findings", action="store_true",
                    help="exit 1 when clips are flagged (default: exit 0; findings are output, not failure)")
    args = ap.parse_args()

    clips = clips_from_node()
    if not clips:
        sys.exit("the narration library returned no clips — refusing to report a clean run")
    if args.categories:
        clips = [c for c in clips if c["category"] in args.categories]
    elif not args.include_words:
        clips = [c for c in clips if c["category"] != "words"]
    # `readings` at Level 1 are printed FORMS — timetables, receipts, nutrition
    # labels — narrated from passageScriptSpeech, which is deliberately not the
    # printed layout. Comparing a transcript against column headers and prices
    # measures the wrong thing, so they are reported separately rather than
    # scored. --score-forms overrides.
    if not args.score_forms:
        clips = [c for c in clips if not (c["category"] == "readings" and FORM_RE.search(c["text"]))]
    learn_names(clips)
    clips.sort(key=lambda c: (c["category"], c["hash"]))
    if args.limit:
        clips = clips[: args.limit]

    missing = [c for c in clips if not (TTS / f"{c['hash']}.mp3").exists()]
    clips = [c for c in clips if (TTS / f"{c['hash']}.mp3").exists()]
    print(f"clips to transcribe: {len(clips)}  (missing on disk: {len(missing)})", flush=True)

    import whisper

    model = whisper.load_model(args.model)
    started = time.time()
    findings, ok = [], 0
    for i, c in enumerate(clips, 1):
        path = TTS / f"{c['hash']}.mp3"
        try:
            heard = model.transcribe(str(path), language="en", fp16=False)["text"].strip()
        except Exception as exc:  # a failed decode is a finding, not a crash
            findings.append({**c, "score": None, "error": str(exc)[:200]})
            continue
        s, missed, extra = score(c["text"], heard)
        names = proper_nouns(c["text"])
        missed_real = [w for w in missed if w not in names]
        # A fixed similarity threshold is the wrong instrument for short clips,
        # and short clips are 4,552 of the 5,592 here. One wrong content word in
        # a six-word sentence scores 0.83 and would pass at 0.80 — and one wrong
        # word IS the defect this audit exists for (`toe` narrated as "two"
        # survived a correct script and a fresh re-render). So below SHORT_WORDS
        # any missed content word flags, and the score only governs passages long
        # enough for a mis-hear to be noise.
        content_missed = [w for w in missed_real if w not in STOPWORDS]
        if len(words(c["text"])) <= SHORT_WORDS:
            passed = not content_missed
        else:
            passed = s >= args.threshold or not missed_real
        if passed:
            ok += 1
        else:
            findings.append({
                "hash": c["hash"], "category": c["category"], "score": round(s, 3),
                "script": c["text"][:300], "heard": heard[:300],
                "missed": missed_real[:25], "invented": extra[:25],
                "proper_nouns_ignored": sorted(names & set(missed))[:10],
            })
        if i % 100 == 0 or i == len(clips):
            rate = (time.time() - started) / i
            print(f"  {i}/{len(clips)}  ok={ok}  flagged={len(findings)}  "
                  f"eta {int(rate * (len(clips) - i) / 60)}m", flush=True)

    print(f"\ntranscribed {len(clips)}  passed {ok}  flagged {len(findings)}")
    for f in findings[:20]:
        if f.get("error"):
            print(f"  ! {f['hash']} {f['category']}: {f['error']}")
            continue
        print(f"  {f['hash']}  {f['category']}  score={f['score']}")
        print(f"     script: {f['script'][:110]}")
        print(f"     heard : {f['heard'][:110]}")
        if f["missed"]:
            print(f"     missed: {' '.join(f['missed'][:12])}")
    if len(findings) > 20:
        print(f"  … and {len(findings) - 20} more")

    if args.out:
        io.open(args.out, "w", encoding="utf-8").write(json.dumps(
            {"transcribed": len(clips), "passed": ok, "missingOnDisk": [c["hash"] for c in missing],
             "findings": findings}, indent=1, ensure_ascii=False))
        print(f"\nwrote {args.out}")
    return 1 if (findings and args.fail_on_findings) else 0


if __name__ == "__main__":
    sys.exit(main())
