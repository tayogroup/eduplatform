# Grade 1 English — the 15 uncovered Cambridge objectives

Found by the content validation of 2026-09-09. The ten units claim **75 of the
90** Stage 1 objectives in `cambridge-english-0058` (Primary — *not* 0861, which
is Lower Secondary and covers Stages 7-9). All 75 claimed are valid and
correctly staged. These are the 15 nobody claims.

**This document does not close the gap. It sizes it.** Adding a Cambridge claim
is a curriculum assertion, not an edit — every unit carries
`reviewStatus: "Approved - curriculum reviewer"` — so authoring here belongs to
the curriculum author. What this does is separate the objectives whose teaching
**already exists and only lacks a code** from the ones that need material
written, so the work can be decided rather than estimated.

Everything below was measured against the unit JSON and the shell source. Where
a claim rests on a judgement rather than a count, it says so.

---

## The short answer

| | objectives | what it costs |
|---|---|---|
| **A** Teaching exists, code missing | 2 | one line per outcome |
| **B** Teaching exists for half the objective | 1 | one clause, or a decision to defer |
| **C** Needs authoring | 11 | five commissions, scoped below |
| **D** Needs a routine, not a lesson | 1 | a decision |

**A first draft of this document put 7 in group A.** Measuring each one moved
four of them into C — the teaching a keyword search appeared to find was not
the teaching the objective asks for. The detail is under "What the search got
wrong", because the failure shape matters more than the correction: every one
of the four looked covered right up until the actual item was read.

---

## A. Teaching exists — add the code

### `1Ri.02` Identify the characteristics of simple stories

**Covered, in all ten units.** Every unit carries a *Talk about the text*
activity built on the same frame:

> Read "Amal's First Day" again, or listen to it. Then answer these questions in
> your own words. **1. Who is in it? 2. Where does it happen? 3. What…**

Character, setting, event — the characteristics of a simple story, asked ten
times across the year. Unit 5's checkpoint also asks which word tells what
happens *at the beginning* of a story (answer: *First*).

### `1Wp.03` Join some letters, including to support multi-letter graphemes

**Covered by the cursive module**, and by more than the worksheet's existence —
`shell/subjects/cursive-strokes.js` authors a pen path per letter with explicit
entry and exit points, and the composer draws a connector from one letter's exit
to the next letter's entry. Four bridge letters (`b`, `o`, `v`, `w`) exit at the
midline rather than the baseline, "the way continuous cursive actually works".
That is letter joining as a taught mechanic, not a font that happens to look
joined.

The objective's second clause — *to support use of multi-letter graphemes* —
depends on C1 below, since the graphemes in question are the adjacent consonants
and digraphs that are not yet taught. The joining is there; what it would join
is not.

---

## B. Half covered

### `1Ri.01` Read and explore a range of simple stories and poems, **including identifying the contribution of any visual elements**

Two clauses, and they have different answers.

- **The range is real and generous**: 10 stories, 9 rhymes, 9 shared readings,
  a project brief and a dialogue — 30 passages, plus the illustrated picture-book
  shelf.
- **The visual-elements clause is asked nowhere.** No comprehension item,
  activity or quiz question in any of the ten units asks what a picture shows,
  tells or contributes. Measured: zero matches for *look at the picture*, *what
  does the picture*, *the picture shows/tells*.

So this is one question type away, not one lesson. The illustrated books are
already on the page and already carry comprehension questions; asking one of
them about the picture rather than the words would close it.

---

## C. Needs authoring — five commissions

### C1. Adjacent consonants and digraphs — 3 objectives

`1Rw.03` blend adjacent consonants (br, nd) · `1Rw.06` sound out unfamiliar
words · `1Ww.02` identify graphemes for adjacent consonants **and consonant
digraphs th, ch, sh**

The phonics spine stops at single sounds — Unit 3 short *u* (sun, fun, duck),
Unit 4 short *e* (hen, pen, tent). **Neither clusters nor digraphs appear
anywhere in the grade**: a search for th/ch/sh teaching returned two hits, both
false (the letters inside the word *she*).

This is the largest real gap, and the one with downstream consequences — it is
the step that unlocks independent decoding, it is what `1Wp.03`'s second clause
needs, and digraphs are assumed by Stage 2.

**Suggested home: Unit 7 (Amal's Big Bus Ride).** Its own vocabulary already
carries the clusters — *stop*, *train*, *tram*, *stand*, *bus stop* — so the
phonics rides the unit's existing words instead of importing a list. Digraphs
may want an earlier home, since *th* appears in the function words of every
unit from the first.

### C2. Joining with *and* — 2 objectives

`1Rg.04` explore sentences containing *and* · `1Wg.05` use *and* to join words
and clauses

The grammar sequence teaches naming, describing, position and possession, and
never joins two ideas. *And* is the first clause connective in the Stage 1
sequence and the gateway to sentences longer than four words.

**Suggested home: Unit 5 (Amal and the Little Hen).** Farm content is
inherently list-like — *a cow and a sheep*, *feeding and planting* — so the
pattern has somewhere honest to live.

### C3. How stories work — 3 objectives

`1Wc.01` write simple stories and poems using the structures of familiar
stories · `1Wv.02` use formulaic language, e.g. *Once upon a time* ·
`1Ri.10` anticipate what happens next in a story

These three cohere as one commission because they are the same skill from three
directions: recognising a story shape, having the words to build one, and
predicting inside one.

None is covered, and the near-misses are worth stating precisely:

- **`1Wc.01`** — Unit 10's six-page capstone book is a *labelled personal
  book*, not a story: its six pages are `My name is ___`, `I can ___`,
  `I like ___`, `This is a ___`, `It is ___`, `My next goal is ___`. Real
  writing, no narrative structure.
- **`1Wv.02`** — no *Once upon a time*, *long ago* or *happily ever after*
  anywhere in the grade.
- **`1Ri.10`** — four comprehension items look like prediction and all four are
  retrospective: *What happened to the ball after Leo threw it?*, *What happened
  to the grass when no rain came?* Asking what already happened is the opposite
  of anticipating what happens next.

**Suggested home: spread, not one unit.** `1Ri.10` is a question type that
belongs in every unit's comprehension set (pause the story, ask what comes
next). `1Wv.02` and `1Wc.01` want a narrative unit — Unit 8 (The Well in the
Village) is the closest thing to a folk tale in the year.

### C4. Story against real life — 1 objective

`1Ra.06` begin to identify how contexts and events in stories are the same as
or different from real life.

Not covered. Cheap to place: the readings are already set in a world the
learners recognise — a school, a market, a farm, a bus — so the comparison is
one question on texts that already exist. Unit 6 (Amal at the Market) or Unit 9
(A Walk Around Town) would carry it without new content.

### C5. Non-fiction text types — 1 objective

`1Ri.04` begin to show awareness that different non-fiction text types have
different purposes.

Not covered — **the grade contains no non-fiction text at all**. All 30
passages are Story, Shared reading, Rhyme, Project brief or Dialogue.

**Suggested home: Unit 9 (A Walk Around Town),** which is already reaching for
this without naming it: its story turns on reading traffic lights, and its
rhyme is *The Traffic Lights* — "Red means STOP. / Green means GO." A sign, a
label and a short list beside those would make the purpose contrast explicit.

### C6. Non-verbal communication — 1 objective

`1SLr.02` suggest how someone's non-verbal communication reflects their
feelings.

Not covered. Unit 6's speaking uses gesture heavily — *point as you speak*,
"These are my hands" — but pointing to name a thing is using non-verbal
communication, never reading it. Nothing asks what a face or a gesture says
about how someone feels.

**Suggested home: Unit 6 (Amal at the Market)** if the senses framing carries
it, or Unit 2 (family), where feelings vocabulary already appears — *How does
Amal feel about her family?*

---

## D. Needs a routine, not a lesson

`1Ww.07` — ask for support in spelling unfamiliar words, and use spelling logs.

A classroom habit rather than a unit of content, and it may belong in the
Teacher & Parent Guide instead of a unit's outcomes. Worth deciding explicitly,
because an unclaimed objective reads as an oversight when it may be a choice.

---

## What the search got wrong

Four objectives moved from "already taught" to "needs authoring" when the actual
content was read rather than searched, and they failed the same way each time —
**a keyword matched something real that was not the thing the objective asks
for.**

| objective | what matched | why it isn't that |
|---|---|---|
| `1Wc.01` write stories | Unit 10's six-page book | six sentence frames, no narrative |
| `1Ri.10` predict | 4 items saying *what happened* | retrospective, not anticipatory |
| `1SLr.02` read non-verbal cues | 45 hits on *point*, *face*, *wave* | using gesture, not interpreting it |
| `1Ri.04` non-fiction types | 125 hits on *sign*, *label*, *list*, *poster* | inside stories; no non-fiction text exists |

The counts are what make this worth recording. 125 hits reads as overwhelming
evidence of coverage and is evidence of nothing — the words appear because the
stories are set in a town. **Confirm an objective against the item a learner
actually does, never against a search that finds its vocabulary.**

---

## What to do with this

1. **A** (2) — add `1Ri.02` and `1Wp.03` to the outcomes that already teach them.
2. **B** (1) — one picture-based comprehension question closes `1Ri.01`.
3. **C** (11) — five commissions, each scoped to a named unit whose existing
   content already carries the pattern. C1 is the one with downstream
   consequences and should go first.
4. **D** (1) — decide: unit outcome, or Teacher & Parent Guide.

Re-run the coverage measurement afterwards; it reads every unit's
`cambridgeObjectives` against `cambridge-english-0058` and reports what is still
unclaimed.
