# Lesson faults found while making the unit lecture films

Found 2026-09-24/25, while writing and reviewing the 46 Computing unit lecture
films for Grades 1-4. **None of these is fixed.** They are faults in the
LESSONS, not in the films; the films work around each one and say so in a
comment where they do.

Every line number and count below was checked against the source before it was
written down. The films' own faults were fixed at the time and are not listed
here — see the commit history for those.

This file exists because the same faults were previously recorded only in a
commit message, where nobody would find them. Science has its own
[`science/LESSON-FAULTS-FROM-FILMS.md`](../science/LESSON-FAULTS-FROM-FILMS.md);
its 27 faults are also still unfixed.

## The serious one

**Grade 2, lesson 5 (`debugging-together`): the sprite is a DOG and the lesson
says "cat" seven times.** `content/lesson-5.py` declares
`"sprite": "\U0001F436"` (DOG FACE) and its own lecture text says dog, but:

- **line 92 — the CORRECT ANSWER a child is told to pick**:
  `"one reads the blocks, one watches what the cat does"`.
- line 77, a good-habit sort item: `"take turns: one reads, one watches the cat"`.
- line 86, stated as plain fact in an `explain()` block:
  `"They can watch the cat while you read the blocks."`
- four more as wrong-answer distractors: lines 91, 128, 130, 194.

A distractor naming the wrong animal is untidy. **The correct answer naming an
animal that is not in the lesson is a child being marked right for identifying
something they never saw.** The film says dog throughout.

## A concept taught twice under two names

**Grade 4, lesson 13 (`software-sensors-and-files`).** The lesson defines the
same thing twice:

- `"systems software"` — 16 lines, the original word card and every step and
  lecture line. This is the correct Cambridge 4CS.02 term.
- `"system software"` — singular, added later by the Learner's Book depth pass:
  a second `word("system software", ...)` at line 250 and its own lecture part.

Both describe "the software that runs the computer itself... the operating
system". A Grade 4 learner has no way to know they are one word. The film uses
the dominant correct term and does not inherit the split.

## A case study filed under the wrong objective

**Grade 4, lesson 11 (`when-networks-fail`).** `LESSON["world"]` (line ~224)
describes a 2017 outbreak that spread worldwide in a day and stopped hospitals,
factories and railways, and says: *"Nothing was stolen. The damage was simply
that the networks stopped working."*

That is recognisably **WannaCry**, which was ransomware — and this same lesson,
about twenty lines earlier, defines *"Locking somebody's files and demanding
money"* as **cybercrime**. The lesson's two objectives, **4DC.04** (network
failure) and **4DC.05** (cybercrime), exist to hold that distinction apart, and
its own case study collapses them.

## Pictures that contradict their own labels

Each is an emoji whose meaning is not the thing the label says. A film may not
put a bottle beside "brush your hair", so in every case the film draws the
thing itself instead.

| Where | Code point | Renders as | Label says |
| --- | --- | --- | --- |
| G4 lesson 1, lines 47 and 63 | `U+1F6BF` | shower head | "Get the watering can" |
| G4 lesson 1, line 64 | `U+1F643` | upside-down smiley | "Tip the can upside down" |
| G4 lesson 3, lines 48 and 83 | `U+1F9F4` | lotion bottle | "brush your hair" |
| G4 lesson 3, line 86 | `U+1F454` | necktie | "Put on pyjamas" |
| G3 lesson 3, line 119 | `U+1F9F4` | lotion bottle | "brush your hair" |
| G2 lesson 1, line 115 | `U+1F4F1` | mobile phone | "switch the tablet on" |
| G2 lesson 1, line 84 | `U+1F9FA` | basket | "Put a tea bag in the cup" |

The `U+1F9F4` / "brush your hair" pairing appears in **two** grades, so it was
copied rather than mistyped once.

## Smaller, and lower confidence

- **G2 lesson 1, the "Robo does exactly what you say" demo**: frame 2 is
  `{"scene": {"id": "dress", "state": []}}` captioned *"We say: draw a shape."* —
  the DRESS scene with an empty list, i.e. a child standing on grass, beside a
  caption about Robo drawing. It reads as a copied-in scene id; a blank canvas
  is what the caption describes.
- **G2 lesson 1**, same demo, frame 3 uses `U+3030` PART ALTERNATION MARK for
  "a squiggle", which draws as a flat zigzag rather than a squiggle.
- **G4 lesson 4**: the quiz example is given two different outputs in two
  steps — the `context` step says *"Yes: say well done. No: say try again"*,
  while the `branch` step's own round gives yes = tick, point, well done and
  no = cross, hint. *"Say try again"* appears nowhere else.
- **G4 lesson 14**: the `explore` step teaches SIX industries; `LESSON["lecture"]`
  recaps only five, dropping the car company. The film follows the lecture and
  therefore drops it too.
- **G3 lesson 14**: the Learner's Book addition introduces a microwave as its
  example of a computer-controlled device. It is the only place the lesson names
  a microwave, and no step, sort item or word card reinforces it. Not a
  contradiction — an example that appears once and is never tested.

## One fault in the films, deliberately left

**`computers-everywhere` (G1 lesson 8) carries 13 frame-edge overflows**, and
they pre-date this work: a 👆 drawn **49 px** outside the stage at 54.5 s, four
`<rect>` overflows of 4 px at 69-73 s, and a `lab small gold` "computer" label
3 px out from 118-123 s. `--sweep` prints only its first twelve, so the
thirteenth is visible only by counting "and N more".

That film is live and was made with the older tool. The three dead cues in it
were fixed on 2026-09-25; the overflows were left alone, and fixing them was
not asked for.
