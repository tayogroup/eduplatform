# Grade 2 English: the Stage 2 objectives the units did not claim, and how they were closed

Measured 2026-09-11, while closing the Grade 3 and Grade 4 gaps, against
Cambridge Primary English 0058, Stage 2. Grades 1, 3 and 4 each had a gap
document; Grade 2 had none, nobody had measured it, and it is live.

| strand | before | after | of |
| --- | --- | --- | --- |
| Reading (2R) | 28 | 42 | 42 |
| Writing (2W) | 29 | 39 | 39 |
| Speaking and listening (2SL) | 15 | 18 | 18 |
| **Stage 2** | **72** | **99** | **99** |

Measured against HEAD and the working tree; the strict curriculum validator
passes every English unit.

## Two kinds of gap

**Taught, never claimed.** Grade 2's spelling strand (`core-words.json`, the
sounds step in the lesson app) teaches ai and ay, ee and oo, igh, oa and ow,
and the split digraphs a_e, i_e, o_e and u_e, and its writing section already
has pupils write poems on the pattern of a familiar poem (Unit 1 "Your Own
Poem", Unit 8 "Your Own Animal Homes Poem"). A search of the unit JSONs for
those objectives finds nothing - the same trap Grade 1's phonics set, whose
spine also lives in `core-words.json` rather than the units. They are claimed on the outcome
that owns them, with a rule that states the pattern the strand only lists.

**Not taught.** The rest: nothing in the ten units taught fiction and
non-fiction, story or poem features, the contents page, commas in a list,
speech marks, special plurals, joining words, decoding a long word,
retelling, predicting, implicit meaning, stories from other times and places,
choosing a book, what a picture adds, setting and character, handwriting,
speech marks aloud, role-play or matching faces to words.

## How each was closed

`tools/author-english-g2-stage2-gaps.py`, in shapes the lesson app shows: the
"How English works" step shows every rule, the story step reaches a question
placed first in its reading (five readings per unit, one question each in the
first round), and "Write it yourself" and "Talk it through" show every task.
Story answers stay within Grade 2's 70-character option limit.

| code | what now teaches it | unit, outcome |
| --- | --- | --- |
| 2Ra.04 | speaking task: Which Book Would You Choose? | 1 lo06 |
| 2Ra.05 | story question: today or long ago, and where ("How People Measured Long Ago") | 5 lo07 |
| 2Rg.03 | rule: Joining Words: and, but, because, if, when (quotes from the unit story) | 6 lo05 |
| 2Ri.01 | rule: Stories, Poems and Fact Texts; story question: story or fact text? | 10 lo02 |
| 2Ri.02 | speaking task: What the Picture Adds (the unit's picture books) | 8 lo01 |
| 2Ri.03 | rule: Stories, Poems and Fact Texts (characters, setting, beginning-middle-end) | 10 lo02 |
| 2Ri.07 | speaking task: Tell the Race Again (four main events) | 3 lo06 |
| 2Ri.10 | story question: why Omar wipes his eyes | 2 lo02 |
| 2Ri.11 | story question: which clue predicts that Amal will help Theo | 3 lo03 |
| 2Ri.14 | rule: Using a Contents Page (Homes Around the World) | 8 lo04 |
| 2Rs.02 | rule: Stories, Poems and Fact Texts; story question on the Project Brief | 10 lo02 |
| 2Rw.01 | rule: One Spelling, Two Sounds: ow and o | 7 lo04 |
| 2Rw.02 | rule: Magic e: Split Digraphs (and the spelling strand's a_e, i_e, o_e, u_e) | 9 lo05 |
| 2Rw.05 | rule: Reading a Long New Word (thorax, abdomen, antennae) | 6 lo02 |
| 2SLp.02 | speaking task: Read the Talking Parts | 2 lo03 |
| 2SLp.03 | speaking task: Act It Out - The Lost Old Man | 9 lo07 |
| 2SLr.03 | speaking task: Does It Match? | 3 lo04 |
| 2Wc.01 | ALREADY TAUGHT: Unit 1 "Your Own Poem", Unit 8 "Your Own Animal Homes Poem" | 1 lo03, 8 lo01 |
| 2Wc.03 | writing task: Where and Who - Begin a Story | 4 lo05 |
| 2Wg.02 | rule: Commas in a List | 2 lo06 |
| 2Wg.03 | writing task: Who Said It? Speech Marks | 9 lo07 |
| 2Wp.01 | writing task: My Neatest Handwriting | 10 lo05 |
| 2Wp.02 | writing task: My Neatest Handwriting (join the small letters, capitals unjoined) | 10 lo05 |
| 2Ww.01 | rule: One Sound, Different Spellings (and the spelling strand's ai/ay) | 1 lo01 |
| 2Ww.02 | rule: Magic e: Split Digraphs | 9 lo05 |
| 2Ww.03 | rule: One Sound, Different Spellings (rhymes that share a spelling, and not) | 1 lo01 |
| 2Ww.04 | rule: Special Plurals | 3 lo01 |

Four story questions, nine rules, three writing tasks, six speaking tasks,
twenty-two answer-key rows.

**A prediction question asks for the clue, not the ending.** The lesson app
shows the unit's story as a picture book before its questions, so "how do you
think it will end?" is answered from memory by then. "Which clue tells you
Amal might help Theo?" is still a prediction skill after reading. Grade 3's
Unit 6 and Grade 4's Unit 5 prediction questions were rewritten the same way.

## What this is not

**Authored, not reviewed.** Every new item is "Needs curriculum review"; the
twenty-one outcomes whose mapping widened carry a re-review flag. The rules and
tasks have no recording yet (their audio descriptors say so), so the app
speaks their text. Every line quoted from a unit text was checked against it.
