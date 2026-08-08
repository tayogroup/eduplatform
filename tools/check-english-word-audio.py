#!/usr/bin/env python
"""Audit the single-word pronunciation clips, which transcription cannot judge.

The 1,889 dictionary clips were left out of every earlier audit for a good
reason, recorded in c21fa23c9: Whisper given 0.6 seconds of "baa" with no
context hears "Bye", and "neigh" as "no". A sample of 40 bears that out — 15%
come back unusable, and not as near misses: "mouth" transcribes as "Please
subscribe and please!", "juicier" as "Lip inner circles", "see" as nothing at
all. Those are the model's known behaviour on sub-second audio, not evidence
about the recording.

So this does not transcribe. It asks a different and much easier question:

    is this audio more likely to be WORD than any of these other words?

The model never has to produce the answer, only rank it, and ranking survives
exactly the conditions that break transcription. Every clip the sample could
not read is ranked correctly here: "mouth" beats the subscribe hallucination by
3.7 logprob, "juicier" beats "Lip inner circles" by 5.4, "see" wins outright.

WHAT IT CANNOT DECIDE, and does not pretend to. "write" and "right" are the same
sound; no method that listens can tell them apart, and the model prefers the
commoner spelling. "my" and "bye" differ by 0.42 logprob, which is inside the
noise. So a clip passes when its word is within MARGIN of the best candidate:
the claim is "nothing here contradicts the recording", not "the word is proven".
A genuinely different word sits 2 to 4 logprob below — "mouse" for "mouth" is
2.2, the hallucination 3.7 — so the margin separates a homophone from a mistake
without swallowing real errors.

    python tools/check-english-word-audio.py --grades 1
    python tools/check-english-word-audio.py --sample 50      # per grade, for a quick read
    python tools/check-english-word-audio.py --out suspect.json

Exits non-zero if any clip's word is beaten by a clearly different one.
"""
from __future__ import annotations

import argparse
import collections
import difflib
import functools
import importlib.util
import json
import re
import sys
import warnings
from pathlib import Path

warnings.filterwarnings("ignore")
print = functools.partial(print, flush=True)  # noqa: A001
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace", line_buffering=True)
except AttributeError:  # pragma: no cover
    pass

ROOT = Path(__file__).resolve().parents[1]

# How far below the best candidate the target may sit and still pass. Calibrated
# on real clips rather than chosen: homophone and near-homophone gaps measured
# 0.42 ("my"/"bye") and 1.11 ("write"/"right"); a different word measured 2.2
# and a hallucination 3.7. Anything between is genuinely ambiguous and is
# reported as such rather than being forced into a verdict.
MARGIN = 1.5

# Candidates are single words ONLY, and the omission is deliberate. Whisper's
# stock inventions ("please subscribe", "thank you for watching") were included
# at first so a hallucinating clip had something to lose to, and they broke the
# comparison: the score is an average per token, and every later token of a
# fluent phrase is nearly certain GIVEN the earlier ones, whatever the audio
# says. "thank you for watching" scored -2.49 against "van" at -4.35 on the
# clip for "van" — and by total logprob the ranking reverses, -12.46 against
# -8.70. An average only means something between candidates of similar length.
#
# So the rivals are other single words from the same dictionary. The question
# becomes "of the words this could have been, is it the right one?", which is
# well posed. Audio that is silence or noise rather than a word is already
# caught by check-ehel-english-audio-integrity.py, which reads file size and
# frame headers and needs no model at all.


def load_audit():
    path = Path(__file__).with_name("audit-ehel-english-sentence-audio.py")
    spec = importlib.util.spec_from_file_location("ehel_audit", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def distractors(word: str, vocabulary: list, count: int = 8) -> list:
    """The most confusable other words in the same dictionary.

    Drawn from the course's own vocabulary rather than invented, so the test is
    against words this recording could plausibly have been. Sorting by
    orthographic closeness is a proxy for sounding alike, and a coarse one — but
    it only has to produce plausible rivals, not rank them.
    """
    scored = sorted(
        ((difflib.SequenceMatcher(None, word, other).ratio(), other)
         for other in vocabulary if other != word),
        reverse=True,
    )
    return [other for _, other in scored[:count]]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--grades", nargs="*", type=int, default=list(range(1, 9)))
    parser.add_argument("--sample", type=int, help="check only the first N clips of each grade")
    parser.add_argument("--model", default="base")
    parser.add_argument("--out", help="write suspect clip ids here as JSON")
    args = parser.parse_args()

    audit = load_audit()
    import torch
    import whisper

    model = whisper.load_model(args.model)
    tokenizer = whisper.tokenizer.get_tokenizer(
        model.is_multilingual, language="en", task="transcribe")
    prefix = list(tokenizer.sot_sequence_including_notimestamps)

    def features_for(path: Path):
        audio = whisper.pad_or_trim(whisper.load_audio(str(path)))
        mel = whisper.log_mel_spectrogram(audio).to(model.device)
        with torch.no_grad():
            return model.encoder(mel.unsqueeze(0))

    def score(audio_features, text: str) -> float:
        """Average per-token logprob that this audio says `text`.

        The encoder output is passed in rather than recomputed: it is the
        expensive half, it does not depend on the candidate, and recomputing it
        per candidate made the sweep nine times slower for the same answer.
        """
        body = tokenizer.encode(" " + text.strip())
        tokens = torch.tensor([prefix + body + [tokenizer.eot]]).to(model.device)
        with torch.no_grad():
            logits = model.decoder(tokens[:, :-1], audio_features)
        logprobs = torch.log_softmax(logits.float(), dim=-1)[0]
        positions = range(len(prefix) - 1, tokens.shape[1] - 1)
        total = sum(logprobs[i, tokens[0, i + 1]].item() for i in positions)
        return total / max(len(list(positions)), 1)

    suspect, ambiguous, checked = [], [], 0
    for grade in args.grades:
        clips = [c for c in audit.clips_for_grade(grade, ("words",)) if c[4].exists()]
        if args.sample:
            clips = clips[: args.sample]
        if not clips:
            continue
        vocabulary = [str(script).strip().lower() for _, _, _, script, _ in clips]
        flagged_here = 0
        for _, _, clip_id, script, mp3 in clips:
            word = str(script).strip().lower()
            candidates = [word] + distractors(word, vocabulary)
            try:
                audio_features = features_for(mp3)
            except Exception as error:  # noqa: BLE001
                print(f"g{grade} {mp3.name}: UNREADABLE ({type(error).__name__}: {error})")
                continue
            ranked = sorted(((score(audio_features, c), c) for c in set(candidates)), reverse=True)
            checked += 1
            best_score, best = ranked[0]
            mine = next(s for s, c in ranked if c == word)
            gap = best_score - mine
            if best == word or gap <= MARGIN:
                continue
            flagged_here += 1
            suspect.append((grade, clip_id, word, best, round(gap, 2)))
            print(f"g{grade} {clip_id}: says {best!r} rather than {word!r} "
                  f"(by {gap:.2f} logprob)")
        print(f"  grade {grade}: {len(clips)} checked, {flagged_here} suspect")

    print(f"\nchecked {checked} word clips")
    if not suspect:
        print("──────── ok ──────── no clip is beaten by a clearly different word")
        return
    print(f"──────── SUSPECT: {len(suspect)} ────────")
    print("  by grade:", dict(sorted(collections.Counter(g for g, *_ in suspect).items())))
    if args.out:
        repair = collections.defaultdict(list)
        for grade, clip_id, *_ in suspect:
            repair[str(grade)].append(clip_id)
        Path(args.out).write_text(json.dumps(repair, indent=1), encoding="utf-8")
        print(f"  written to {args.out}")
    print("\n  These need an ear before anything is re-recorded: the test says the")
    print("  audio fits another word better, not that the recording is wrong.")
    sys.exit(1)


if __name__ == "__main__":
    main()
