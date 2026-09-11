# Grade 3 English: Cambridge objectives the units do not claim

Measured 2026-09-11, while building the Grade 3 standalone lesson app
(`english/grade-3-app`), against Cambridge Primary English 0058, Stage 3
(`src/curriculum/cambridge-english-0058.json`). Claims are read from the ten
unit JSONs' outcomes, the same place Grade 1's are.

| strand | claimed | of |
| --- | --- | --- |
| Reading (3R) | 36 | 48 |
| Writing (3W) | 31 | 36 |
| Speaking and listening (3SL) | 16 | 18 |
| **Stage 3** | **83** | **102** |

Zero invalid codes. Grade 1 stood at 78 of 90 when its gap document was first
written and reached 88 of 90 by authoring the teaching first and the claim
second; that is the route here too.

## The 19, and what the units actually hold

Each was searched for across every learner-facing section of all ten units
(readings, comprehension, grammar, quizzes, activities, speaking, writing).
**Not one is taught as a lesson.** What the search finds is incidental: a
metadata field (`"genre": "Information text"`), a story line ("Teacher Yasmin
nodded"), a word in passing ("What about prepositions?" asked Amal). Those are
not evidence of teaching, and claiming an objective on them would put a
confident statement on a report about something nobody taught. None is claimed
by this build.

| code | objective (abridged) | what the units hold |
| --- | --- | --- |
| 3Ra.04 | choose books for pleasure, using blurbs and reviews | nothing |
| 3Ra.05 | compare retellings of the same story | one retelling talk (U5 Speaking 6); no comparison |
| 3Rg.02 | exclamation marks in texts | nothing |
| 3Rg.09 | purposes of prepositions | named once in a U2 story; not taught |
| 3Ri.01 | fiction vs non-fiction; locate books by classification | genre is metadata only |
| 3Ri.03 | fiction genres and their features | genre is metadata only |
| 3Ri.05 | non-fiction text types and features | information texts are read, their features are not taught |
| 3Ri.11 | predict story endings | "prediction" appears only as a use of *will* |
| 3Ri.15 | locate information, including an index | nothing |
| 3Ri.17 | recognise themes | theme is metadata only |
| 3Rs.03 | how information is organised (paragraphs, sections, lists) | nothing taught |
| 3Rw.01 | less common grapheme pronunciations (young, could) | nothing |
| 3SLm.04 | non-verbal communication | characters nod; not taught |
| 3SLp.02 | different voices when reading aloud | nothing |
| 3Wg.08 | use prepositions accurately | position words occur in texts; not taught as grammar |
| 3Wp.01 | write legibly and fluently | the app's handwriting resource (Student resources, pen-path animation and a printable sheet) draws joined letters; **no step teaches or checks it** - the same position Grade 1's 1Wp.03 is in |
| 3Ww.01 | consonant phoneme spellings (jar, giraffe, bridge) | the spelling strand covers vowel patterns and silent letters, not these |
| 3Ww.04 | homophones (to/two/too, right/write) | nothing at Grade 3 (Grade 2 Unit 5 teaches two/too/to) |
| 3Ww.06 | spelling tools and spelling logs | "Sort the words" activities use word lists; no log |

## What would close them

Content, not engineering. The cheapest candidates, because an existing
section already has the shape:

- **Grammar items** for 3Rg.02 (exclamation marks), 3Rg.09 and 3Wg.08
  (prepositions): the grammar section's own format (explanation, rule and
  examples, common mistake, memory tip, practice).
- **Comprehension questions** for 3Ri.17 (theme) and 3Ri.11 (predict an
  ending) against the stories already there.
- **A spelling group** in a later unit for 3Ww.01 or 3Ww.04.

Two are reviewer decisions rather than gaps, as they were at Grade 1: whether
the handwriting resource satisfies 3Wp.01, and whether 3Ww.06 (spelling logs)
belongs in a unit or in the grown-up guide.
