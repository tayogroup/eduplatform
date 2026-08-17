#!/usr/bin/env python3
"""Rewrite learner-facing English text that was written to the teacher or parent.

Section 3 (audience) of docs/english-content-review-2026-08-17.md. Three classes:

1. comprehension `explanation` / `correctAnswer` — shown to the child after
   answering as "Reviewed guidance", but written as a mark scheme ("Accept any
   two…", "Award one mark…", "Look for…", "Answers vary.") or about "the
   learner" in the third person ("This retrieval question checks that the
   learner can…"). Rule-based rewrite into second person; every rule was
   checked against the full set of 161 changed lines before it was kept.
   Grade 1 Unit 10 is skipped: there "the learner" is a CHARACTER in the
   celebration dialogue ("Learner: I like my family page best.").
   Not narrated.

2. Grade 1 `grammar[].commonMistake` — the card is drawn on the child's page
   but instructs the adult ("Remind them…", "Ask gently…", "Show the child…").
   Explicit phrase replacements into the child's own voice. Not narrated.

3. Grade 1 readings — the "Talk about…" scripts say "An adult can read each
   line while the learner points…", and five rhymes carry parent staging
   ("ask your child…", "Sit facing your child…"). Rewritten to address the
   child, with the grown-up named as "a grown-up". The five rhymes are
   narrated and their clips go stale (listed at the end of the run).

Everything else the review filed under audience is left alone on purpose:
`aiTutorPrompt` is not rendered by the English shell (Wehel reads it as
context); `assignments[].instructions` renders only in the Teacher view;
`answerKey`, `teacherNotes`, `liveSessions` and `rubrics` are teacher fields.

The content gate holds these adult-addressed strings in its baseline. Once
they are fixed the baseline entries stop firing and the gate fails asking to
remove them — regenerate it deliberately with
`node tools/check-english-content.mjs --write-baseline` and review the diff:
it must only shrink.

Idempotent. Usage: python tools/repair-ehel-english-audience-20260817.py [--dry]
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENGLISH = ROOT / "src" / "prototypes" / "ehel-academy" / "english"
DRY = "--dry" in sys.argv

# ---------------------------------------------------------------------------
# 1. comprehension guidance → second person

VERBS = ("retrieves|scans|reads|infers|connects|explains|identifies|compares|tracks|tracked|links|quotes|finds|weighs|judges|"
         "matches|counts|answers|selects|chooses|picks|works out|notices|recognises|considers|uses|writes|names|gives|lists|"
         "shows|checks|looks|thinks|decides|draws|points|spots|locates|adds|unpacks|practises|follows|sets|takes|applies|"
         "evaluates|interprets|synthesises|gathers|restates|justifies|supports|responds|reflects|argues|states|describes|"
         "summarises|distinguishes|contrasts|reasons|traces|organises|separates|grasps|has grasped|has understood|"
         "has located|then gives|then|must|should|needs to|has to|can|will|is expected to|is asked to|will need to|lives")


def de_s(word: str) -> str:
    irregular = {"has understood": "have understood", "has grasped": "have grasped", "has located": "have located",
                 "has to": "have to", "is expected to": "are expected to", "is asked to": "are asked to",
                 "identifies": "identify", "justifies": "justify", "practises": "practise", "tracked": "tracked",
                 "then": "then", "then gives": "then give", "must": "must", "should": "should", "can": "can", "will": "will",
                 "needs to": "need to", "will need to": "will need to", "works out": "work out"}
    if word in irregular:
        return irregular[word]
    if word.endswith("ies"):
        return word[:-3] + "y"
    if re.search(r"(ches|shes|xes|sses)$", word):
        return word[:-2]
    if word.endswith("s"):
        return word[:-1]
    return word


RULES = [
    # marker instructions → what a good answer contains
    (re.compile(r"^Answers (?:will )?vary\.\s*", re.I), "There is more than one good answer. "),
    (re.compile(r"(^|[.!?;]\s+)Look for\b"), r"\1A good answer gives"),
    (re.compile(r"(^|[.!?;]\s+)Accept any\b"), r"\1Any"),
    (re.compile(r"(^|[.!?;]\s+)Accept (either|both|a|an|the)\b"), r"\1\2"),
    (re.compile(r"(^|[.!?;]\s+)Award (one|two|the) marks? for (.+?) and (one|another|the other) for (.+?)\."), r"\1One mark is for \3 and one for \5."),
    (re.compile(r"(^|[.!?;]\s+)Award the mark when\b"), r"\1The mark is earned when"),
    (re.compile(r"(^|[.!?;]\s+)Award (one|two|full) marks? (?:for|when)\b"), r"\1The mark is for"),
    (re.compile(r"(^|[.!?;]\s+)Ask (?:the child|them) to\b"), r"\1Try to"),
    (re.compile(r"\band ask them to say\b"), "and say"),
    (re.compile(r"\bso ask them to compare their\b"), "so compare your"),
    # the child (as the reader, not a story character)
    (re.compile(r"\basking the child's name\b"), "asking the new child's name"),
    (re.compile(r"\bthe child's own\b"), "your own"),
    (re.compile(r"\bthe child could really do\b"), "you could really do"),
    (re.compile(r"\bwhen the child will do it\b"), "when you will do it"),
    (re.compile(r"\bthe child (names|must|should|can|needs to|has to)\b"), lambda m: "you " + de_s(m.group(1))),
    (re.compile(r"\bthe child\b(?! (?:draws|writes|circles|points|says|will|dance|sang|sing))"), "you"),
    # the learner / learners (as the reader)
    (re.compile(r"\b([Aa]sks|[Aa]sking|[Rr]equires|[Rr]equiring|[Cc]hecks that|[Cc]hecking that|[Cc]hecking|[Cc]onfirms|[Aa]nchors|[Ll]inks|[Gg]ives|[Aa]llows|[Hh]elps|[Ii]nvites|[Ee]xpects|[Ll]ets|[Pp]rompts)\s+(?:the learner|learners)\b"), r"\1 you"),
    (re.compile(r"\bthe learner's own\b"), "your own"),
    (re.compile(r"\bthe learner’s own\b"), "your own"),
    (re.compile(r"\b[Tt]he learner (" + VERBS + r")\b"), lambda m: "you " + de_s(m.group(1))),
    (re.compile(r"\blearners (must|should|then|can|need to|have to|are asked to|are expected to|will|weigh|gather|judge|then give)\b"), r"you \1"),
]
FIXUPS = [
    (re.compile(r"\bsay what they like\b"), "say what you like"),
    (re.compile(r"\bjustify their (view|opinion|choice|answer)\b"), r"justify your \1"),
    (re.compile(r"\bgive their own\b"), "give your own"),
    (re.compile(r"\bcompare their (effort|patience|own)\b"), r"compare your \1"),
    (re.compile(r"\bshowing they grasp\b"), "showing that you grasp"),
    (re.compile(r"\byou ([^.]{0,80}?)\bin their own words\b"), r"you \1in your own words"),
    (re.compile(r"\byou (?:himself|herself|themselves)\b"), "yourself"),
    (re.compile(r"\byou has\b"), "you have"), (re.compile(r"\byou is\b"), "you are"), (re.compile(r"\byou was\b"), "you were"),
    (re.compile(r"\byou (" + VERBS + r")\b"), lambda m: "you " + de_s(m.group(1))),
    (re.compile(r"\bsays how they feel\b"), "says how you feel"),
    (re.compile(r"\bchecking you have understood\b"), "checking that you have understood"),
    (re.compile(r"(^|[.!?]\s+)you\b"), lambda m: m.group(1) + "You"),
]
# "you unpack the metaphor and connects it" — the second verb of a compound
# predicate still carries the third-person -s.
COMPOUND = re.compile(r"\b([Yy]ou [^.;]*?) and (cites|infers|applies|supports|reports|links|draws|keeps|connects|explains|names|gives|selects|weighs|adds|matches|quotes|justifies|identifies|compares|contrasts|evaluates|interprets|traces|gathers|restates)\b")
CAP = re.compile(r"(^|[.!?]\s+)(a|an|the|any)\b")


def rewrite_guidance(text: str) -> str:
    out = text
    for rx, rep in RULES:
        out = rx.sub(rep, out)
    for rx, rep in FIXUPS:
        out = rx.sub(rep, out)
    for _ in range(3):
        out = COMPOUND.sub(lambda m: m.group(1) + " and " + de_s(m.group(2)), out)
    if out != text:
        out = CAP.sub(lambda m: m.group(1) + m.group(2)[0].upper() + m.group(2)[1:], out)
    return out


# ---------------------------------------------------------------------------
# 2. Grade 1 commonMistake — adult imperatives → the child's own voice

MISTAKE_PHRASES = [
    ("Warmly encourage the full sentence: 'My name is...'.", "Say the full sentence: 'My name is...'."),
    ("Remind them the sentence needs a thing at the end.", "The sentence needs a thing at the end: 'I like apples.'"),
    ("Encourage a different 'I can' in every sentence.", "Try a different 'I can' in every sentence."),
    ("Ask 'What is it like?' to get a describing word.", "Ask yourself 'What is it like?' to find a describing word."),
    ("Mixing up 'he' and 'she' is very common at this age. Ask gently: is this person a boy or a girl?",
     "'He' and 'she' are easy to mix up. Ask yourself: is this person a boy or a girl?"),
    ("Ask kindly for the whole sentence: 'I can hop.'", "Say the whole sentence: 'I can hop.'"),
    ("Move the ball and check together.", "Move the ball and check."),
    ("Show the child that h-EAR has the word EAR hiding inside it.", "Look: h-EAR has the word EAR hiding inside it."),
    ("Ask who makes it, then say the whole sentence.", "Say who makes it in a whole sentence: 'The cow says moo.'"),
    ("Ask 'How does it feel?' to get a describing word.", "Ask yourself 'How does it feel?' to find a describing word."),
    ("Ask again: which body part is doing the work?", "Ask yourself: which body part is doing the work?"),
    ("Say it slowly together.", "Say it slowly."),
    ("Try it together slowly.", "Try it slowly."),
]

# ---------------------------------------------------------------------------
# 3. Grade 1 readings — parent staging → the child, with "a grown-up"

READING_PHRASES = [
    ("An adult can read each line while the learner points, repeats and acts — or listen to the audio read each line and do the same on your own.",
     "A grown-up can read each line while you point, repeat and act — or listen to the audio read each line and do the same on your own."),
    ("After you say it, ask your child: “Is our family big or small? Who is in our family?”",
     "After you say it, ask a grown-up: “Is our family big or small? Who is in our family?”"),
    ("Sing a new verse for each animal your child names.", "Sing a new verse for each animal you can name."),
    ("This helps your child listen for different sounds.", "This helps you listen for different sounds."),
    ("Take turns: your child asks “May I have a ride?” and you answer.", "Take turns: you ask “May I have a ride?” and a grown-up answers."),
    ("Sit facing your child, hold hands, and rock back and forth like rowing a boat.",
     "Sit facing a grown-up, hold hands, and rock back and forth like rowing a boat."),
]

# ---------------------------------------------------------------------------


def serialise(doc, raw: str) -> str:
    text = json.dumps(doc, ensure_ascii=bool(re.search(r"\\u[0-9a-f]{4}", raw)), indent=2)
    eol = "\r\n" if "\r\n" in raw else "\n"
    return text.replace("\n", eol) + (eol if raw.endswith(eol) else "")


changed_strings = 0
changed_files = 0
stale: list[str] = []
guard_missing: list[str] = []

for unit_path in sorted(ENGLISH.glob("grade-*/data/units/unit-*.json")):
    rel = unit_path.relative_to(ENGLISH).as_posix()
    grade = int(rel.split("/")[0].split("-")[1])
    raw = unit_path.read_text(encoding="utf-8")
    unit = json.loads(raw)
    n = 0

    if rel != "grade-1/data/units/unit-10.json":
        for q in unit.get("comprehension", []):
            for key in ("explanation", "correctAnswer"):
                v = q.get(key)
                if not isinstance(v, str):
                    continue
                w = rewrite_guidance(v)
                if w != v:
                    q[key] = w
                    n += 1

    if grade == 1:
        for g in unit.get("grammar", []):
            cm = g.get("commonMistake") or ""
            for old, new in MISTAKE_PHRASES:
                if old in cm:
                    cm = cm.replace(old, new)
            if cm != g.get("commonMistake"):
                g["commonMistake"] = cm
                n += 1
        for r in unit.get("readings", []):
            s = r.get("passageScript") or ""
            before = s
            for old, new in READING_PHRASES:
                if old in s:
                    s = s.replace(old, new)
            if s != before:
                r["passageScript"] = s
                n += 1
                if (r.get("audio") or {}).get("available"):
                    stale.append(f"grade-1 reading {r.get('readingId')}")

    if n:
        changed_strings += n
        changed_files += 1
        if not DRY:
            unit_path.write_text(serialise(unit, raw), encoding="utf-8", newline="")

# Every Grade 1 phrase in the tables must have existed somewhere, or the fix
# silently did nothing — the same loud-failure rule as the sibling scripts.
if not DRY:
    all_g1 = "\n".join(p.read_text(encoding="utf-8") for p in ENGLISH.glob("grade-1/data/units/unit-*.json"))
    for old, new in MISTAKE_PHRASES + READING_PHRASES:
        if json.dumps(new, ensure_ascii=True)[1:-1] not in all_g1 and json.dumps(new, ensure_ascii=False)[1:-1] not in all_g1:
            guard_missing.append(new[:70])

print(json.dumps({"dry": DRY, "filesChanged": changed_files, "stringsChanged": changed_strings}))
if stale:
    print("Narrated text changed — clips now stale:\n  " + "\n  ".join(stale))
if guard_missing:
    print("✘ replacement text not found after applying (phrase table stale?):\n  " + "\n  ".join(guard_missing), file=sys.stderr)
    sys.exit(1)
