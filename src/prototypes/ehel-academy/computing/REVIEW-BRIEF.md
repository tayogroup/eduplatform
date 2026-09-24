# Reviewing a unit lecture film

You are a second pair of eyes on a film someone else wrote. **You change
nothing** — not one byte of the film, the lesson, or any tool. A review that
edits is not a review, because the author never learns what you found and
nobody can tell your work from theirs.

## What only you can do

Three machines already ran on this film and it passed all three:

| check | what it proves |
| --- | --- |
| `--dry` | the character count, the estimate, and that no claimed objective is missing |
| `--sweep` | no frame throws, and nothing is drawn outside the 1168 × 440 box |
| `check-ehel-film-cues.js` | no cue is dead — in either direction |

None of them reads. **Every real fault this programme has found passed all
three first.** So run `--preview` and `--sample`, and LOOK at every sheet: take
each sentence of narration and ask whether the frame it plays over shows what
the words claim.

## Quote your evidence

A note without a quote is not usable. Give the chapter, the beat, the sentence
as written, and what the frame actually shows. If you cannot point at it, you
have a hunch rather than a finding — say so, and say it is one.

Finding nothing is a real result. Say it plainly. Do not manufacture a note to
look thorough; a reviser who checks three invented notes learns to discount the
fourth, and the fourth is the one that matters.

## The shapes that have actually gone wrong here

Each of these is a real fault found in a real film in this programme.

- **INVENTED DETAIL — the most serious class.** A Grade 1 Computing film said a
  message "hops from computer to computer" and described a message with nobody
  to send it to. Neither idea appears anywhere in its lesson. Both were cut. A
  Grade 4 Science film drew a hand-span demonstration with invented figures; a
  Maths film opened on a mango its lesson never mentions. **Search the lesson
  for anything the film asserts, and quote what you find.**
- **A FILM TEACHING AGAINST ITS OWN LESSON.** A debugging film told the child
  "First say what you think the dog will do. Then press Run" — in the exact
  round whose misconception note reads *"Children guess the bug before running
  the program. Run it first."* The film was not merely over-claiming; it taught
  the habit the lesson warns against. Read the lesson step's own `explain()`
  block, including its misconception line.
- **A CONTRAST CARD DRAWN OVER THE PICTURE IT CONTRADICTS.** A "one big
  computer" card sat on the same circle, with the same gold ring, as the
  correct many-computers globe — so the big red cross landed where the CORRECT
  artwork was still visible underneath.
- **COUNT WHAT YOU DREW.** A five-step program shown as four chips, in the beat
  that says "the list you build is called a program". A woodlouse labelled
  fourteen legs over a drawing with seven, in the step that says count them.
- **AN OBJECTIVE CITED IN FULL AND DELIVERED IN HALF.** Read every code this
  film claims in FULL in `src/curriculum/cambridge-computing-0059.json`, quote
  it, and judge whether the chapter delivers the whole wording. Five Maths
  films cited "estimate AND divide", "adding AND SUBTRACTING", "both clockwise
  AND ANTICLOCKWISE" and taught one half of each. A coverage count cannot see
  it. Check too that the code belongs to the lesson step the chapter draws —
  one film claimed a code its own step does not claim.
- **A MOVING THING THAT IS UNREADABLE MID-MOVE.** Two table rows swapped
  straight past each other and at the crossing their picture, label and number
  were all on one spot. A corrected block slid in and clipped the block above
  it — in a film about fixing mistakes, which reads as a new bug.
- **MARK THE MISTAKE, NEVER THE CHILD.** A Grade 2 Science film drew a red
  cross across an ill child's face in a film where a red cross meant "not
  this". If something is crossed, it must be the wrong step.
- **A DEAD PICTURE THE CHECKER CANNOT SEE.** `sc()` returns null for a miss, so
  a cue read with the wrong beat draws nothing silently. The checker catches a
  literal call naming a beat no scene declares — it does NOT catch a call with
  the right beat and key in the wrong scene, nor one whose result is assigned
  and never drawn. If a sentence names something and the sheet does not show
  it, that is the likely cause.

## Two things to confirm, every time

- **Every wrong order is shown by passing the WRONG LIST to the lesson kit's
  own `ART.scene`**, never by a drawing of a mistake the film made up. The
  kit's scenes label their own consequence — "socks on the OUTSIDE of the
  shoes!", "no lid on: smoothie everywhere!" — so the lesson's own drawing does
  the teaching.
- **Anything the kit computes is BORROWED, not retyped**: a cipher, a loop
  expansion, a branch, an LED pattern, a sprite's end state. A rule borrowed
  cannot disagree with the lesson; a rule retyped can, and no check in the
  pipeline would catch a letter off by one.

## Report

Every fault, with its quote — or plainly that you found none. List any fault in
the **lesson** separately, and do not fix it: that is someone else's call.
