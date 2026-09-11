# English Grade 5: content review and gap fixes (2026-09-11)

The Grade 1-4 review of the same day (`docs/english-g1-4-content-review-20260911.md`)
run over Grade 5, plus the fixes the Grade 5 app build left open. Every
learner-facing item in the ten units was read: readings, story questions,
quizzes, grammar practice and keys, activities, writing models and completed
examples, speaking tasks and answer keys. Each answer was checked against its
text and each key against its options.

## The review: 62 edits, one tool

`tools/repair-english-g5-review-20260911.py` applies them. It asserts the old
text, so an edit whose target has moved is refused rather than guessed, and a
second run reports all 62 as already applied.

| class | where | example |
| --- | --- | --- |
| exercise points at material it never gives | U4 grammar 4 and 5; U4, U6, U7 Activity 1 | "Delete the unnecessary commas from four sentences" with no sentences; "Sort all twenty-five unit words" with no list. The sentences and the lists are now printed. |
| key disagrees with its exercise | U4, U5, U6, U7 | grateful/irritable and miserable/prosperous given as opposites; exaggerate said to have no adjective (exaggerated); "funniest" missing from a list of judgement words; ten un- words claimed where the list gave nine (the tenth is *unlikely*, from the same group, as *reliable* is in Unit 4) |
| two right answers, one allowed | U2, U6, U8 | someone / no one both fitting a gap; the subordinating conjunctions and the modals now list their alternatives; "very magnificent" as the model answer |
| model or key contradicts the story | U2, U7, U9 | the class did not REPAINT the mural, they painted a new one; Omar's back ached, not his feet; a model line offered as the blog's words that the blog does not say; a model line given to Amal that is Sami's |
| text contradicts itself | U8, U9 | the Toolkit reading quotes a poster claim the poster never makes; part 3 of the Nookwatch story opens with Sami answering a question nobody asked (Amal now asks it) |
| a word taught wrongly | U9 | *nook* listed as a compound noun; CUT TO: keyed as "a new scene" where the film script uses it inside Scene 1 |
| stale or loose explanations | U1, U5, U6, U8, U10 | "sorry for" where the unit teaches "sorry about" for your own act; a quiz key pointing at "the comma rule" for a tense question; two quiz reasons that cite events not in the review texts |

**Unit 9's animals, changed after the owner said so.** The story set lemurs
and gibbons in a bamboo forest outside Fort Portal, a real Ugandan town;
lemurs live only on Madagascar and gibbons only in Asia. The review removed the
town; the owner then asked for the species too. `tools/repair-english-g5-u9-african-animals.py`
makes Kobi a **golden monkey** (it lives in the bamboo forests of the Virunga
volcanoes, so the grove, the nook and the climbing all hold) and the gibbons
**colobus monkeys** (common in Uganda's forests; their babies are born white,
so the baby's "brown textile coat" is now white). The verbs the vocabulary
sentences teach ("swing", "swung") stay. It touched 39 strings in Unit 9,
3 in Unit 7, the two core-word source files, and the sentence glossary (lemur,
gibbon and gibbons out; colobus and monkeys in). Games, glossary examples, the
Story Library and the topic index were rebuilt from it. A before-and-after
diff of every narration script found exactly what moved: 4 readings, 2
grammar-practice clips, 1 activity, 19 vocabulary sentences (2 of them Unit 7
core words in the Alice voice) and 4 new glossary clips.

**Not a defect.** Many writing tasks' `modelText` describes a good answer
rather than showing one. Every Grade 5 task also carries a `completedExample`
with the worked answer, and the shell draws both; the app now shows the
completed example (below).

## The fixes the app build left open

| gap | fix |
| --- | --- |
| "Say it out loud" missing in Units 3, 7, 9, 10 | `grade-5-app/sayit-lines.json` (`sayitLines`). Units 3, 7 and 9 take the model lines their own tasks print; Unit 10's six are written there. App-only. |
| step explanations pitched at six-year-olds | `grade-5-app/step-voice.json` (`stepVoice`), nine steps reworded. Grades 1-4 set none; Grade 4 rebuilt byte-identical. |
| "See an example" showing a description | `writeExample`: the app shows the task's `completedExample`. |
| no learning-time estimates | `estimate-learning-time.py --grade 5`: reading at 110 words a minute (continuing 60/75/90/100), and - from Grade 5 up - writing priced from each task's own `expectedLength` ("150 to 250 words", "One paragraph of four to six sentences", "eight to twelve steps") at 8 words a minute plus 4 minutes to plan and check, instead of Grade 1's flat 90 seconds a task, which had put a whole unit's writing at 9 minutes. Writing is now 88-155 minutes a unit; 149-216 minutes self-paced per unit, 30 hours a year. Grades 1-4 keep the flat rate (their stored estimates do not move). Provisional. |
| 397 of 400 core links, 690 of 1,972 overall, with no tutor prompt or spelling row | `fill-english-core-word-prompts.py --grade 5` (397, the core links' bare spelling form) and `--story --spelling-prefix "Say, tap and trace: "` (293, the glossary's form - the tool refused to choose between the grade's two forms, 1,018 of 1,279 against the rest, so the choice is on the command line). |
| Cambridge Stage 5 at 87 of 92 | `tools/author-english-g5-stage5-gaps.py`: four grammar rules (-ful and -fully with consonant doubling, U4; spelling-rule exceptions, U5; homonyms, U7; letter strings with more than one sound, U8) and one speaking task (choosing presentation media, U10), each claimed on the outcome carrying the unit's word-level or presentation claims. 92 of 92. All new items "Needs curriculum review"; the five outcomes re-flagged. The app's `grammar-practice.json` gained one talk round and one fluency question for each new rule. |

## Knock-ons

- Games rebuilt (`build-ehel-english-games.js 5`), topic index rebuilt.
- `check-english-content.mjs` and `validate:curriculum-units --strict-cambridge`
  pass. The new Unit 8 rule first printed "/f/" and the content gate failed it
  (the voice reads a phoneme between slashes as a letter name); it now says
  "the f sound".
- Lectures: all nine match their units.
- Audio: see the release note in the commit - the staleness check's list, the
  re-recordings under `audioRevision: "rv"`, and the 1,018 word-meaning clips
  (62,609 characters, priced by a dry run first).
- Routing: `repoint-grade.php` knows English Grade 5 (`ehel-eng-g05` ->
  `grade-5-v2`).

## Owed

A Stage 5 teacher's sign-off on the new rules, the speaking task, Unit 10's
say-it lines, the app's grammar practice and Unit 9's new animals.
