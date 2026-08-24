#!/usr/bin/env python3
"""Check the single-word Intensive English clips by RANKING, not transcription.

audit-intensive-english-audio.py deliberately skips the 420 `words` clips, and
that is exactly where this defect class lives. `toe` narrated as "two" in the
Grade 2 English dictionary was caught in a one-word clip precisely because a
one-word clip gives the error nowhere to hide: the same mispronunciation inside
a sentence is one word in two hundred and scores ~0.99.

Transcription cannot do this job. On sub-second audio Whisper hallucinates
outright — "mouth" comes back as "Please subscribe" — so asking what it SAYS
returns noise. Asking whether the audio ranks the right word above its rivals is
well posed on the same audio: the model never has to produce the answer, only
score it, and scoring survives where generation does not.

Method, carried from tools/check-english-word-audio.py, including the two
things that file learned by getting them wrong:

  Candidates are single words ONLY. The score is an average per token, and every
  later token of a fluent phrase is nearly certain GIVEN the earlier ones,
  whatever the audio says — "thank you for watching" beat "van" on the clip for
  "van", and by TOTAL logprob the ranking reversed. An average only compares
  candidates of similar length.

  Rivals come from this course's own dictionary, not from invention, so the
  question is "of the words this could have been, is it the right one?".

  The rival set also includes the model's OWN greedy decode, first word only.
  Without it the check is not discriminating, and a mutation test proved it:
  lookalike rivals are drawn from the CLAIMED word, so they can only contain
  confusions that resemble the claim, and a mislabelled clip whose real word
  looks nothing like it cleared at 0.71 logprob. Scoring the entire 420-word
  vocabulary also fixes it and is decisive, but at 208 ms per candidate that is
  10.4 hours for this course; the greedy decode is one extra pass and supplies
  exactly the hypothesis the lookalike list cannot. First word only, because the
  score is an average per token and a fluent multi-token hallucination beats a
  single word for reasons unrelated to the audio.

  Audio features are computed once per clip and reused across candidates. They
  are the expensive half and do not depend on the candidate; recomputing them
  per candidate made the English sweep nine times slower for the same answer.

A homophone is undecidable by anything that listens, so a clip passes when its
word is within MARGIN of the best candidate rather than having to win outright.
MARGIN is inherited from the English calibration and was re-checked here: over
all 420 clips the gap is 0.00 at p90 and 1.22 at p99, so 1.5 is comfortable.

One systematic exception is handled before the margin rather than by relaxing
it. Whisper spells by ear with a US bias and this course uses UK spelling, so
apologise/apologize, organise/organize and practise/practice each lose to their
US form by about 2.0 — the whole of the first run's ambiguous set. Those are
homophones, so the recording is right and only the orthography differs. Raising
MARGIN to swallow them would also swallow a genuinely different word, which the
English calibration measured at 2.2. A spelling variant is therefore not counted
as a rival at all, which leaves the margin free to do what it was calibrated for.

Usage:
  python tools/check-intensive-english-word-audio.py
  python tools/check-intensive-english-word-audio.py --distribution
  python tools/check-intensive-english-word-audio.py --limit 40 --model base
"""
from __future__ import annotations

import argparse
import difflib
import io
import json
import os
import subprocess
import sys
import warnings
from pathlib import Path

warnings.filterwarnings("ignore")

ROOT = Path(__file__).resolve().parents[1]
COURSE = ROOT / "src/prototypes/ehel-academy/intensive-english"
TTS = COURSE / "media/audio/tts"

# How far below the best candidate the target may sit and still pass. Calibrated
# in the English tool on real clips rather than chosen: homophone and
# near-homophone gaps measured 0.42 ("my"/"bye") and 1.11 ("write"/"right"); a
# genuinely different word measured 2.2 and a hallucination 3.7. Anything
# between is ambiguous and is reported as such rather than forced to a verdict.
MARGIN = 1.5


def words_from_course() -> list[dict]:
    """(word, hash) for every single-word clip, from the narration library.

    The library is the one definition of what this course narrates — generator,
    uploader and pruner all read it — so deriving the list any other way is how
    two tools come to disagree about what exists.
    """
    script = (
        "const fs=require('fs'),path=require('path');"
        "const n=require('./tools/lib/ehel-intensive-narration.js');"
        "const C='src/prototypes/ehel-academy/intensive-english';"
        "const out=new Map();"
        "for(const e of fs.readdirSync(C)){"
        "  const m=e.match(/^level-([0-9]+)$/); if(!m) continue;"
        "  const d=path.join(C,e,'data','units'); if(!fs.existsSync(d)) continue;"
        "  for(const f of fs.readdirSync(d)){"
        "    if(!/^unit-[0-9]+[.]json$/.test(f)) continue;"
        "    const u=JSON.parse(fs.readFileSync(path.join(d,f),'utf8'));"
        "    for(const c of n.clipsForUnit(u,['words']))"
        "      if(!out.has(c.hash)) out.set(c.hash,{word:c.text,level:Number(m[1])});"
        "  }"
        "}"
        "process.stdout.write(JSON.stringify([...out].map(([hash,v])=>({hash,...v}))));"
    )
    proc = subprocess.run(["node", "-e", script], cwd=ROOT, capture_output=True,
                          text=True, encoding="utf-8")
    if proc.returncode != 0:
        sys.exit("could not read the narration library:\n" + proc.stderr[:800])
    return json.loads(proc.stdout)


# Orthographic conventions that differ without the sound differing. Applied to
# both sides before deciding whether a candidate is a genuine rival.
# Unambiguous suffix conventions. Order matters — the longer form first, or
# "isation" is consumed by the "ise" rule before it can match.
SPELLING_FOLDS = [
    ("isation", "ization"), ("ise", "ize"), ("yse", "yze"),
    ("our", "or"), ("ae", "e"), ("oe", "e"),
]

# UK noun/US verb spellings that are homophones. Listed explicitly rather than
# derived from a ce/se rule, because that rule would also equate advice with
# advise — different words, not homophones — and quietly excuse a real
# substitution.
SPELLING_PAIRS = {
    ("practise", "practice"), ("licence", "license"), ("defence", "defense"),
    ("offence", "offense"), ("pretence", "pretense"), ("cheque", "check"),
    ("grey", "gray"), ("tyre", "tire"), ("kerb", "curb"), ("programme", "program"),
    ("metre", "meter"), ("centre", "center"), ("theatre", "theater"),
    ("litre", "liter"), ("fibre", "fiber"), ("judgement", "judgment"),
    ("enquire", "inquire"), ("storey", "story"), ("plough", "plow"),
}


def same_word(a: str, b: str) -> bool:
    """True when two spellings are the same word under UK/US convention."""
    def fold(t: str) -> str:
        t = t.strip().lower()
        for uk, us in SPELLING_FOLDS:
            t = t.replace(uk, us)
        return t
    x, y = a.strip().lower(), b.strip().lower()
    if (x, y) in SPELLING_PAIRS or (y, x) in SPELLING_PAIRS:
        return True
    return fold(x) == fold(y)


def distractors(word: str, vocabulary: list[str], count: int = 8) -> list[str]:
    """The most confusable other words in this course's own dictionary.

    Orthographic closeness is a coarse proxy for sounding alike, but it only has
    to produce plausible rivals — the model does the ranking.
    """
    scored = sorted(
        ((difflib.SequenceMatcher(None, word, other).ratio(), other)
         for other in vocabulary if other.lower() != word.lower() and not same_word(other, word)),
        reverse=True,
    )
    return [other for _, other in scored[:count]]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", default="small")
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--margin", type=float, default=MARGIN)
    ap.add_argument("--distribution", action="store_true",
                    help="print the gap spread and exit, to re-check the margin for this course")
    ap.add_argument("--out", default=None)
    args = ap.parse_args()

    clips = words_from_course()
    if not clips:
        sys.exit("the narration library returned no single-word clips — refusing to report a clean run")
    vocabulary = sorted({c["word"] for c in clips})
    clips.sort(key=lambda c: c["word"].lower())
    missing = [c for c in clips if not (TTS / (c["hash"] + ".mp3")).exists()]
    clips = [c for c in clips if (TTS / (c["hash"] + ".mp3")).exists()]
    if args.limit:
        clips = clips[: args.limit]
    print("single-word clips: %d   vocabulary: %d   missing on disk: %d"
          % (len(clips), len(vocabulary), len(missing)), flush=True)

    import torch
    import whisper

    model = whisper.load_model(args.model)
    tokenizer = whisper.tokenizer.get_tokenizer(model.is_multilingual, language="en", task="transcribe")

    def features_for(path: Path):
        audio = whisper.pad_or_trim(whisper.load_audio(str(path)))
        mel = whisper.log_mel_spectrogram(audio, model.dims.n_mels).to(model.device)
        with torch.no_grad():
            return model.encoder(mel.unsqueeze(0))

    def score(audio_features, text: str) -> float:
        """Average per-token logprob that this audio says `text`."""
        ids = [*tokenizer.sot_sequence_including_notimestamps, *tokenizer.encode(" " + text.strip()), tokenizer.eot]
        tokens = torch.tensor([ids]).to(model.device)
        with torch.no_grad():
            logits = model.decoder(tokens[:, :-1], audio_features)
        logprobs = torch.log_softmax(logits.float(), dim=-1)[0]
        first = len(tokenizer.sot_sequence_including_notimestamps) - 1
        positions = range(first, tokens.shape[1] - 1)
        total = sum(logprobs[i, tokens[0, i + 1]].item() for i in positions)
        return total / max(len(list(positions)), 1)

    gaps, findings, ambiguous = [], [], []
    for i, c in enumerate(clips, 1):
        word = c["word"]
        feats = features_for(TTS / (c["hash"] + ".mp3"))
        heard_first = ""
        try:
            heard = model.transcribe(str(TTS / (c["hash"] + ".mp3")), language="en", fp16=False)["text"]
            tokens_heard = [t for t in "".join(ch if ch.isalpha() or ch.isspace() else " "
                                               for ch in heard).split() if t]
            heard_first = tokens_heard[0].lower() if tokens_heard else ""
        except Exception:
            heard_first = ""
        candidates = {word, *distractors(word, vocabulary)}
        if heard_first and heard_first != word.lower():
            candidates.add(heard_first)
        ranked = sorted(((score(feats, cand), cand) for cand in candidates), reverse=True)
        # A rival that is only a spelling of the same word is not a rival.
        ranked = [(s, cand) for s, cand in ranked if cand == word or not same_word(cand, word)]
        best_score, best = ranked[0]
        mine = next(s for s, cand in ranked if cand == word)
        gap = best_score - mine
        gaps.append(gap)
        if gap > args.margin:
            row = {"word": word, "hash": c["hash"], "level": c["level"],
                   "beaten_by": best, "gap": round(gap, 2), "heard": heard_first,
                   "runners_up": [[round(s, 2), w] for s, w in ranked[:4]]}
            (findings if gap > args.margin * 2 else ambiguous).append(row)
        if i % 50 == 0 or i == len(clips):
            print("  %d/%d  flagged=%d  ambiguous=%d" % (i, len(clips), len(findings), len(ambiguous)), flush=True)

    if args.distribution:
        gaps.sort()
        q = lambda p: gaps[min(int(len(gaps) * p), len(gaps) - 1)]
        print("\ngap distribution (0 = the word won outright)")
        for p in (0.5, 0.75, 0.9, 0.95, 0.99, 1.0):
            print("  p%-3d %.2f" % (p * 100, q(p)))
        print("  margin in use: %.2f" % args.margin)

    print("\nchecked %d   clear %d   ambiguous %d   flagged %d"
          % (len(clips), len(clips) - len(findings) - len(ambiguous), len(ambiguous), len(findings)))
    for f in findings:
        print("  L%d  %-18s lost to %-18s by %.2f logprob" % (f["level"], f["word"], f["beaten_by"], f["gap"]))
    if ambiguous:
        print("\n  within %.1f-%.1f logprob — homophone territory, reported not judged:" % (args.margin, args.margin * 2))
        for a in ambiguous[:15]:
            print("    L%d  %-18s vs %-18s %.2f" % (a["level"], a["word"], a["beaten_by"], a["gap"]))

    if args.out:
        io.open(args.out, "w", encoding="utf-8").write(json.dumps(
            {"checked": len(clips), "margin": args.margin, "missingOnDisk": [c["hash"] for c in missing],
             "flagged": findings, "ambiguous": ambiguous}, indent=1, ensure_ascii=False))
        print("\nwrote " + args.out)
    # Findings are this tool's OUTPUT, not an error in it — same reason the
    # transcription audit stopped exiting 1 and having a completed run reported
    # to the harness as a crash.
    return 0


if __name__ == "__main__":
    sys.exit(main())
