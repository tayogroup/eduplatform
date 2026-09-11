# Grade 1 English — the uncovered Cambridge objectives

**Closed 2026-09-11: 90 of 90.** The last two - `1Wp.03` (join letters for a
two-letter sound) and `1Ww.07` (ask for spellings, keep a spelling log) - were
closed as Grades 2-4 were, by teaching first and claiming second:
`tools/author-english-g1-stage1-gaps.py` adds "Writing 7 - Join sh and ch"
(Unit 6, lo02) and "Writing 7 - My Word Book" (Unit 9, lo02), both "Needs
curriculum review", both shown by the lesson app's "Write it yourself" step.
What follows is the history of how the other eighty-eight got there.

Found by the content validation of 2026-09-09. Updated 2026-09-10, when three
of the fifteen turned out to be a mapping fix and were claimed.

**Coverage now: 78 of the 90 Stage 1 objectives in `cambridge-english-0058`**
(Primary — *not* 0861, which is Lower Secondary). It was 75 when the validation
ran. The twelve below are what nobody claims.

**This document does not close the gap. It costs it.** Adding a Cambridge claim
is a curriculum assertion, so authoring belongs to the curriculum author. What
this does is separate the objectives whose teaching **already exists and only
lacks a code** from the ones that need material written.

---

## Read this before trusting anything below

The first version of this document put seven objectives in "teaching probably
exists". Measuring moved four of them out. Then, on 2026-09-10, **the method
failed in the other direction and I got three wrong the expensive way.**

`1Rw.03`, `1Rw.06` and `1Ww.02` — adjacent consonants and digraphs — were
listed here as the largest authoring commission, on the strength of a search of
the unit JSONs for *digraph*, *adjacent consonant*, *blend* and *grapheme*
that returned zero for every unit.

**The teaching was there the whole time, in a file this document never
opened.** The phonics spine is the `phonics` strand of
`grade-1/data/core-words.json`, which `build-lessons.py` reads as
`groups["phonics"]`:

| unit | | |
| --- | --- | --- |
| 1-5 | short a, e, i, o, u | cat, egg, big, dog, sun |
| **6** | **Phonics: sh and ch** | ship, shop, dish, shell, brush, chip, chin, chat |
| **7** | **Phonics: th and ng** | long, sing, ring, king, song, thin, thick |
| **8** | **Phonics: ck and qu** | duck, sock, clock, queen, quick, quiz |
| **9** | **Phonics: blends** | flag, swim, stop, step, drum, tent, nest, sand |

A Grade 1 course teaches `sh` and `ch` without ever printing the word
"digraph" in front of a six-year-old, so the vocabulary searched for was
vocabulary the content could not contain. Two lessons, and the second is the
one that generalises:

- **The unit JSONs are not the whole content.** `core-words.json` carries the
  phonics, topic and sight strands and is read at build time. Anything asking
  "does Grade 1 teach X" has to look there too.
- **A search for the METALANGUAGE of a skill is not a search for the skill.**
  Confirm an objective against the item a learner actually does.

So each verdict below now says what it rests on. **Read** means somebody opened
the content and looked at it; **searched** means it rests on a pattern match and
should be confirmed before money is spent on it.

---

## Closed since the validation

### `1Rw.03` · `1Rw.06` · `1Ww.02` — adjacent consonants and digraphs

**Claimed 2026-09-10 in `7fa0ecdf0` — a mapping fix, no authoring.** `1Ww.02`
joined units 6-9 and `1Rw.03`/`1Rw.06` joined unit 9, each on the outcome that
already carried that unit's word-level reading claim. The four touched outcomes
carry a re-review flag, which is correct: a reviewer approved each with the
mapping it had. `tools/repair-english-g1-phonics-mapping.py` is idempotent and
prints coverage before and after.

This is what the "teaching exists, code missing" half of this document is for,
and it was the largest single item in it.

---

## A. Teaching exists — add the code

### `1Ri.02` Identify the characteristics of simple stories — *read*

Covered in all ten units. Every unit carries a *Talk about the text* activity on
the same frame: **"1. Who is in it? 2. Where does it happen? 3. What…"** —
character, setting, event, asked ten times across the year. Unit 5's checkpoint
also asks which word tells what happens *at the beginning* (answer: *First*).

### `1Wp.03` Join some letters, including to support multi-letter graphemes — *read*

Covered by the cursive module, and by more than its existence:
`shell/subjects/cursive-strokes.js` authors a pen path per letter with explicit
entry and exit points, and the composer draws a connector from one letter's exit
to the next letter's entry. Four bridge letters (`b`, `o`, `v`, `w`) exit at the
midline "the way continuous cursive actually works".

Its second clause — *to support use of multi-letter graphemes* — is now
satisfied too, since the graphemes it would join are the ones units 6-9 teach.

---

## B. Half covered

### `1Ri.01` Read and explore a range of simple stories and poems, **including identifying the contribution of any visual elements** — *read / searched*

Two clauses, two answers.

- **The range is real** (*read*): 30 passages — 10 stories, 9 shared readings,
  9 rhymes, a project brief, a dialogue — plus the illustrated shelf.
- **The visual-elements clause** (*searched*): no comprehension item, activity
  or quiz asks what a picture shows or contributes. Worth confirming against the
  book-question sets before commissioning: the `picture` questions ("Tap the
  picture of the crayon in the nest") do ask a child to read an illustration,
  which may already satisfy the clause. **This is the verdict most likely to be
  wrong in the same way the phonics one was.**

---

## C. Needs authoring

### C2. Joining with *and* — 2 objectives — *read*

`1Rg.04` explore sentences containing *and* · `1Wg.05` use *and* to join words
and clauses

**Smaller than first stated.** The course already joins two clauses — it just
uses a different connective. Unit 5 teaches *"First we feed the hens, then we
collect the eggs"* and unit 7 *"First we walk, then we take the bus"*. So the
sentence shape and the idea of two joined ideas are in place; *and* itself is
not taught anywhere in the grammar sequence.

**Suggested home: Unit 5 (On the Farm).** Its content is list-like — *a cow and
a sheep*, *feeding and planting* — and it already carries the two-clause
pattern, so *and* is a variation on something the child has met rather than a
new structure.

### C3. How stories work — 3 objectives — *read*

`1Wc.01` write simple stories and poems using familiar structures · `1Wv.02`
formulaic language, e.g. *Once upon a time* · `1Ri.10` anticipate what happens
next

- **`1Wc.01`** — Unit 10's six-page capstone is a *labelled personal book*, not
  a story: `My name is ___`, `I can ___`, `I like ___`, `This is a ___`,
  `It is ___`, `My next goal is ___`. Real writing, no narrative structure.
- **`1Wv.02`** — no *Once upon a time*, *long ago* or *happily ever after*.
- **`1Ri.10`** — four comprehension items look like prediction and all four are
  retrospective: *What happened to the ball after Leo threw it?*

**Suggested home: spread.** `1Ri.10` is a question type for every unit's
comprehension set; `1Wv.02` and `1Wc.01` want a narrative unit, and Unit 8 (The
Well in the Village) is the closest thing to a folk tale in the year.

### C4. Story against real life — 1 objective — *read*

`1Ra.06`. Cheap to place: the readings are set in a world the learners
recognise — a school, a market, a farm, a bus — so the comparison is one
question on texts that already exist. Unit 6 or Unit 9 would carry it.

### C5. Non-fiction text types — 1 objective — *read*

`1Ri.04`. The grade contains **no non-fiction text**: all 30 passages are Story,
Shared reading, Rhyme, Project brief or Dialogue.

**Suggested home: Unit 9 (A Walk Around Town)**, already reaching for this — its
story turns on reading traffic lights and its rhyme is *The Traffic Lights*
("Red means STOP. / Green means GO."). A sign, a label and a short list beside
those would make the purpose contrast explicit.

### C6. Non-verbal communication — 1 objective — *searched*

`1SLr.02` suggest how someone's non-verbal communication reflects their
feelings. Unit 6's speaking uses gesture heavily — *point as you speak* — but
pointing to name a thing is using non-verbal communication, not reading it.
Confirm against the speaking sets before commissioning.

**Suggested home: Unit 6**, or Unit 2 where feelings vocabulary already appears
(*How does Amal feel about her family?*).

---

## D. Needs a routine, not a lesson

`1Ww.07` — ask for support in spelling unfamiliar words, and use spelling logs.
A classroom habit, and it may belong in the Teacher & Parent Guide rather than a
unit's outcomes. Worth deciding explicitly, because an unclaimed objective reads
as an oversight when it may be a choice.

---

## What to do with this

1. **A** (2) — add `1Ri.02` and `1Wp.03` to the outcomes that already teach them.
   Same shape as the phonics fix that just closed three.
2. **B** (1) — check the book-question sets first; `1Ri.01` may already be whole.
3. **C** (8) — five commissions, each scoped to a named unit. C2 is now the
   cheapest, since the two-clause pattern is already taught.
4. **D** (1) — decide: unit outcome, or Teacher & Parent Guide.

Re-run the coverage measurement afterwards. It reads every unit's
`cambridgeObjectives` against `cambridge-english-0058` — and remember that it
measures what is CLAIMED, not what is taught: it cannot tell a mapping gap from
a teaching gap, which is the whole reason this document exists.
