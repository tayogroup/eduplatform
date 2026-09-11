# Grade 2 Science (science/grade-2-v2) validation

Reviewed 2026-09-11. First validation of this grade. Reviewer: Claude (automated measurement, browser driving, an independent content review by a second Claude agent, and judgement); no human teacher review yet. Scale: 1 Unsatisfactory; 2 Needs major improvement; 3 Acceptable with revisions; 4 Strong; 5 Excellent. Build reviewed: commit 924e54d4b (live since 2026-09-11).

Against the 27-area framework in *science-grade-1-v2 validation.docx*. The Word copy of this report is *science-grade-2-v2 validation report 2026-09-11.docx* in the same OneDrive folder; both are generated from the same rows.

## Summary

First validation of Grade 2 Science, the build learners have had since 2026-09-10. The machinery is sound. All 44 Stage 2 objectives are reached, all ten lessons were driven to 100% in a browser, and nothing overflows at phone width. Every control has an accessible name, the gates are green, and the day's kit fixes are live: drawn pictures, dialogs and resume. The content is not ready to sign off. An independent review of all ten lessons found 53 findings. There are 20 factual points, among them penguins sorted into the Arctic, a mushroom sorted as a plant, a battery that 'stores electricity', and a sunset drawn in the same place as the sunrise. There are 8 answer-key points, including 7 pictures that show the wrong thing, plus 15 wording points (39 capitalised words the voice may spell out), 6 safety points and 4 inclusion points. The worst safety point is 'a little cell is safe to handle', said to six-year-olds, with no warning about swallowing one. Lessons run 35 to 45 minutes in one sitting, and the quizzes are 88% recall. Average 3.7 out of 5. Grade 2 needs a content pass like the one Grade 1 had before a teacher is asked to approve it.

Average score **3.7 / 5** across 27 areas. Lowest score 2, in 1 areas: Content Accuracy and Correctness. Two High-priority findings: content accuracy (4) and home safety (20).

Change status at 2026-09-11: **7** areas need no change, **20** are open.

## How this was checked

- Measured on the content through the kit's own step builder, and on the built pages: objective coverage, steps per objective, reading level (Flesch-Kincaid), quiz shape, US spellings, emoji versions and page weight.
- All ten lessons driven to 100% in a browser by a script that plays every step as a child would. The dark-room step was finished by hand, because its toggles defeat a generic driver. Every step of every lesson was then checked for horizontal overflow at 375 px.
- Lesson 1's built page was scanned for controls and pictures without an accessible name; the other nine share the same renderers.
- An independent review of all ten content modules by a second Claude agent, as a primary science teacher and proofreader. Its claims about the shared kit were checked against the code before they were accepted.
- Cross-checks: identical questions in Grades 1 and 2, simulations and sort items shared between grades, and the Stage 2 framework text for every objective the review questioned.

## The 27 areas

| # | Area | Score | Evidence | Required changes | Priority | Change status | Approval status |
|---|---|---|---|---|---|---|---|
| 1 | Content Quality | 3 | Ten lessons, each one big idea, 14 to 17 steps inside the unit shell (overview with a 'Last time' recap, lecture, words, games, home projects, Science world, resources). The structure is sound. The text carries 53 review findings (areas 4, 10, 19, 20), and two home tasks cannot be followed as written (the dark-cupboard torch task, and a tape measure listed but not used). | The content pass in areas 4, 10, 19 and 20, then a teacher's read. | High | Open: not started | Acceptable with revisions |
| 2 | Learning Objectives and Outcomes | 4 | 44 of 44 Stage 2 objectives reached on the built pages (check-coverage.py), each step naming its codes, the builder refusing codes Stage 2 does not publish. Two steps claim codes they do not teach: the shadow clock is tagged 2TWSm.02 (make and use a model) but measures the real Sun, and a lesson 7 step is tagged 2TWSm.03 (diagram versus picture) but only teaches models. Both codes are reached elsewhere, so coverage holds without them. | Retag the two steps. | Medium | Open: not started | Pass with note |
| 3 | Content Depth and Coverage | 4 | About 3.1 teaching steps per objective. Four objectives have a single teaching step: 2Be.03 (local environments), 2Bp.04 (offspring features), 2Cp.01 (properties) and 2ESp.03 (human effect on the environment). Lessons 9 and 10 have no practice questions at all. The other lessons have 4 to 7 each, 44 in total. | Practice questions for lessons 9 and 10; a second step (items inside an existing step) for the four thin objectives. | Low | Open: not started | Pass with note |
| 4 | Content Accuracy and Correctness | 2 | 20 factual points. Several teach a misconception a later grade must undo: penguins in the Arctic, in the sort and in the kit's Arctic scene; a mushroom sorted as a plant; a battery that stores electricity; sunrise and sunset drawn in the same place, so the east-to-west path the lesson teaches cannot be seen; the Sun 'the biggest light source there is'; 'every force changes movement or shape'. Others are plainly false: ginger kittens from a black mother and ginger father, pumice scratched by a coin, bare wood 'waterproof', molars 'flat'. | Fix all 20, including a sunset state and a penguin-free Arctic scene in the kit; then a teacher's read. | High | Open: not started | Needs major improvement |
| 5 | Cambridge Curriculum Alignment | 4 | Cambridge Primary Science 0097 Stage 2, extracted from the published PDF; lessons organised by sub-strand; Thinking and Working Scientifically taught as its own steps (predict, fair test, record, block graph, models). Two steps are tagged with codes they do not teach (area 2). | Retag the two steps. | Medium | Open: not started | Pass with note |
| 6 | Grade-Level Appropriateness | 4 | Flesch-Kincaid grade 3.2 across all text (8.6 words per sentence) and 2.3 for the shell. Lesson 4, Natural or Made?, is highest at 4.8, carried by 'manufactured', 'transparent' and 'flexible'. Every line is also read aloud. 39 capitalised words may be spelled out by the voice (area 19). | Note lesson 4 for the teacher. | Low | No change needed | Pass |
| 7 | Progression and Grade Boundaries | 4 | The strands build on Grade 1: materials to changing materials, pushes and pulls to forces changing things, electricity to circuits, Earth and Sun to the Sun across the sky. Lesson 6 now uses its own objects in the two simulations it shares with Grade 1 (fixed today). Two quiz questions are Grade 1's word for word (area 26). | See area 26. | Low | Open: not started | Pass with note |
| 8 | Balance Across Grades | 3 | 10 lessons, 44 objectives, about 3.1 teaching steps per objective (Grade 1 3.9, Grade 4 3.3). Lessons run 35 to 45 minutes in ONE sitting at age six or seven, while Grade 1 is now two sittings of about 20 to 25 minutes. The switch that splits them is a single config line and is off. Four objectives have a single teaching step. | Two sittings for Grade 2 (area 17); the depth items in area 3. | Medium | Open: not started | Acceptable with revisions |
| 9 | Lesson Structure and Instructional Strength | 4 | The kit's sequence (overview with 'Last time' recap, lecture, words, demonstrate, explore, practise, experiment, record, graph, context, games, home, quiz). The recap is automatic and present on lessons 2 to 10. No lesson has a warm-up, because the kit supports one but the content has none. | A two-question warm-up per lesson (area 11). | Low | Open: not started | Pass with note |
| 10 | Question and Assessment Quality | 3 | 80 quiz items and 44 practice questions. The gate proves one key per item and no repeated option, and the builder refuses a game that repeats the quiz. The review found 8 key problems where a distractor is also right or the stem is ambiguous. Examples: 'as long as a song' contradicts the home project's two-minute song, 'baby teeth' fits a six-year-old's canines, 'sleep' is offered as unhealthy, and a lamp does light with one wire. | Fix the 8 keys; teacher read of the 80. | Medium | Open: not started | Acceptable with revisions |
| 11 | Assessment Balance | 3 | About 70 of 80 quiz items are recall, by the same stem classifier used for Grade 1. There is no warm-up and no reasoning item in any quiz. Reasoning is assessed in the experiments, sorts, block graphs and record tables. | A warm-up and one reasoning quiz item per lesson, as Grade 1 now has. | Medium | Open: not started | Acceptable with revisions |
| 12 | Feedback and Answer Explanations | 5 | Every answer, right or wrong, gets a spoken and written reason; wrong sorts are explained and moved; experiments quote the child's prediction back. Seen on every step while driving the ten lessons. | None. | - | No change needed | Pass |
| 13 | Standardized Interactivity and Ease of Use | 4 | All ten lessons reach 100% in a browser. Grade 2's own step kinds all complete: order, block graph, lookup, build, and the circuit, dark-room, Sun-path and new-material simulations. One stall point: the dark room finishes only when the lamp goes back ON. The instruction under the simulation says so, but the step's opening line ('close the curtains and switch the lamp off') does not. | Add 'then switch it back on' to the dark-room step's opening line; watch two or three children. | Low | Open: not started | Pass with note |
| 14 | Standardized Design and User-Interface Standards | 5 | The shared design system and kit, the same header bars, the dark theme and choice buttons of Grade 1; no new styles in the content. | None. | - | No change needed | Pass |
| 15 | Accessibility and Inclusion | 3 | Accessibility is sound. Lesson 1's page has no control and no picture without an accessible name, the language is set to en-GB, and there is a skip link. Game and resource overlays are dialogs with Tab trapped, simulations are named, and reduced motion is respected. Inclusion is not: 'we have two arms and two legs', hair 'on the head' for everyone, 'photos of your family: a child and both parents', and 'your feet to measure with'. | Fix the 4 inclusion points; a screen-reader session. | Medium | Open: not started | Acceptable with revisions |
| 16 | Online Teaching Standards | 4 | Self-paced; class chat, hand-raise, Join class and Wehel mount with a launch token (the same wiring as Grade 1). Every step has a written and spoken instruction plus Explain. | None. | - | No change needed | Pass |
| 17 | Learning-Time Estimates | 3 | The hub estimates 35 to 45 minutes per lesson, about 400 in all, derived from step kinds rather than measured. That is one sitting at six or seven. The kit can split each lesson into two halves with a break card, and Grade 1 uses it; Grade 2 does not. | Set "sittings": 2 in Grade 2's app.config.json; time two children. | Medium | Open: not started | Acceptable with revisions |
| 18 | Multimedia Quality | 3 | No Emoji 13+ glyph reaches a page (the kit draws its own). But 7 pictures show the wrong thing, from chalk drawn as a brick to litter drawn as a police siren. Two kit scenes teach errors: sunrise and sunset are the same centred Sun, and the Arctic scene has a penguin, drawn with the Emoji 13 polar-bear sequence that the guard cannot see. Narration is the device voice without a token. | Replace the 7 pictures; add a sunset state and fix the Arctic scene in the kit; device check. | Medium | Open: not started | Acceptable with revisions |
| 19 | Language and Reading Level | 3 | British spelling clean. 39 capitalised words for emphasis across nine lessons. Grammar slips include 'So is a desert, a forest and the Arctic'. The same thing gets two names: 'toy car' and 'ball', 'young chick' and 'young hen'. 'Transparent', 'flexible' and 'rigid' are taught but never used. | Fix the 15 wording points; lower-case the 39 capitals; a human proofread. | Medium | Open: not started | Acceptable with revisions |
| 20 | Cultural Relevance and Safeguarding | 3 | Names, settings and foods fit the course. Six safety points: 'a little cell is safe to handle' with no warning about swallowing a button cell; the child picking up heated things with oven gloves; 'never look at the Sun' only after the sunrise task; five outdoor tasks with no grown-up; raw egg with no hand-washing; eggs left in fizzy drink with no 'do not eat'. The family-photos task assumes two parents (area 15). | Fix the 6 safety points. | High | Open: not started | Acceptable with revisions |
| 21 | Technical Quality and Compatibility | 4 | Pages about 460 KB, about 111 KB compressed. Zero horizontal overflow at 375 px on every step of all ten lessons. The shared checks are green, including the header-bar check added today; the builder refuses too-new emoji. Live since 2026-09-11 from 924e54d4b. Not yet opened on the school's devices. | Open two lessons on the school's own devices. | Medium | Open: not started | Pass with note |
| 22 | Learner Progress and Completion | 4 | Progress under ehel-sci-g02, lessons l01 to l10; every page carries the resume guard, and the overview and Science world tick on arrival. Completion reaches 100% in all ten lessons. Resume on reopen was verified behaviourally on Grade 1 today with the same wiring, not separately on Grade 2. | None; resume can be re-tested on Grade 2 with the next deploy. | Low | No change needed | Pass |
| 23 | Motivation and Engagement | 4 | Games in every lesson (2 to 5), stickers and a shelf, honest praise for wrong predictions, no timers. The one-sitting length is the main risk at this age (area 17). | See area 17. | - | No change needed | Pass |
| 24 | Teacher and Parent Support | 4 | A printable grown-ups section on the hub for all ten lessons (objectives in Cambridge's words, every step, the experiment at home, answer keys), three home projects per lesson, student resources. Two home tasks cannot be followed as written, and several lack safety lines (area 20). | Rewrite the two home tasks. | Low | Open: not started | Pass with note |
| 25 | Religious Neutrality and Sensitivity | 5 | A scan of all ten modules found no religious references, celebrations or symbols, and no foods that would trouble a family in the school's setting. | None. | - | No change needed | Pass |
| 26 | Duplication / overlap | 4 | No practice or game item repeats a quiz item within Grade 2 (the builder refuses it), and no stem is used twice in the grade. Two quiz questions are copied word for word from Grade 1's quizzes. Sort items that recur across grades (fish, wood, sand, rabbit) are asked different questions each time. | Replace the two copied quiz questions with Stage 2 questions. | Low | Open: not started | Pass with note |
| 27 | Bugs, syntax, and errors | 4 | Both gates green, no console errors, every step completes. The two kit scene defects (sunset and Arctic, area 18) are content bugs in code. | The kit scene fixes; watch the first sessions. | Medium | Open: not started | Pass with note |

## Required changes, by priority

- High: fix the 20 factual points and the kit's sunrise/sunset and Arctic scenes (areas 4, 18), and the 6 safety points (area 20). Grade 2 is live, so every fix must keep each lesson's step count and order.
- Medium: fix the 8 answer keys and the 7 wrong pictures (10, 18), the 15 wording points and 39 capitalised words (19), and the 4 inclusion points (15). Retag two steps (5).
- Medium: switch on two sittings for Grade 2 (one config line, as Grade 1) and time children (17); add a two-question warm-up and a reasoning quiz item per lesson (11); a teacher's read after the fixes (1, 4, 10).
- Low: practice questions for lessons 9 and 10 and a second teaching step for 2Be.03, 2Bp.04, 2Cp.01 and 2ESp.03 (3); replace the two quiz questions copied from Grade 1 (26); a screen-reader session and the school's devices (15, 21).

## Findings in brief

- Facts (20). Penguins placed in the Arctic, in the sort and in the kit's own Arctic scene; a mushroom sorted as a plant; 'people have hair only on the head'; kittens from a black mother and ginger father said to be ginger (impossible); a plastic handle 'does not get hot'; bare wood 'waterproof'; 'every force changes movement or shape' when the lesson's own wooden block did neither; a ball 'rolling' in space; the Sun 'the biggest light source there is'; a phone battery 'filled with electricity'; pumice 'soft, it scratches'; the Sun 'below the ground' at night; sunrise and sunset drawn as the same centred Sun (a kit scene); 'the same path every single day'; a shadow clock called a model; a step tagged for diagrams that never mentions one; molars 'flat'; a raw egg 'clear'.
- Keys (8). 'As long as a song' is wrong on the quiz but right by the lesson's own home project; 'baby teeth' is a right answer for a six-year-old's canines; 'sleep' is offered as the unhealthy distractor after the lesson teaches it as healthy; 'what the kittens will be like' is keyed as a certainty; a lamp does light with one wire; 'nobody touches it' ignores the wind. Pictures that show the wrong thing: chalk as a brick, a towel as a toilet roll, a kettle as a teapot, a swing as a carousel horse, litter as a police siren, a painting as a palette, and a pond scene in the middle of a torch sequence.
- Language (15). 39 capitalised words used for emphasis across nine lessons; 'So is a desert, a forest and the Arctic'; 'Well, and looking after your body' read as an interjection; 'young chick' and 'young hen' for the same stage; 'toy car' in the experiment but 'ball' in the words and lecture; 'transparent', 'flexible' and 'rigid' taught as words but never used in the steps; two home tasks that cannot be followed as written.
- Safety (6). 'A little cell is safe to handle' with no warning about swallowing a button cell; heated things picked up with oven gloves by the child, contradicting 'a grown-up does the heat'; 'never look straight at the Sun' only at the end of a task that sends the child to watch the sunrise; five outdoor tasks with no grown-up; raw egg with no hand-washing; eggs left in fizzy drink with no 'do not eat'.
- Inclusion (4). 'We have two arms and two legs', and 'what do you have that a fish does not? arms and legs'; hair 'on the head' for every child; 'photos of your family: a child and both parents'; 'your feet to measure with'.
- Two Grade 2 quiz questions are Grade 1 quiz questions word for word: 'A push or a pull is called a...' and 'What goes into a wall socket?'.

## Verdict

Grade 2 works as software and teaches every objective, but its text teaches several things that are wrong, and one home task tells young children a cell is safe to handle. It should not go to a teacher for approval until the High findings are fixed. The fix is a content pass inside the existing steps, as was done for Grade 1 today, plus two small kit changes: a sunset scene, and an Arctic scene without the penguin.

## Appendix: the content review's findings, in full

From the independent review of all ten Grade 2 content modules (2026-09-11). L1 to L10 are `content/lesson-N.py`, and line numbers are as reviewed. Each finding gives the location, what is wrong, and a suggested fix. The two claims about the shared kit (the sky scene and the Arctic scene) were checked against `lesson-kit/lib/science.js` and are confirmed.

### Facts (20)
1. L3:29, 39, 51: penguins are placed in the Arctic, and the kit's Arctic scene draws one too. Use a seal or an Arctic fox, and say "Penguins live at the icy South Pole, not the Arctic."
2. L3:28, 52: a mushroom is sorted as a plant, but it is a fungus. Replace it with an owl.
3. L3:186: "A camel would not last a day" by a pond is false. Say "A camel's habitat is the dry desert."
4. L1:65, 204: "people have hair only on the head". Say "most of their hair on their head", and ask "Which animal is covered in skin, not fur, feathers or scales?"
5. L1:132: a black mother and a ginger father cannot have ginger kittens. Say "Some kittens are black, and some are black with ginger patches."
6. L4:126: "plastic does not get hot" is wrong; it just does not carry the heat to your hand.
7. L4:77, 96: bare wood is keyed "waterproof", but untreated wood soaks up water. Use metal foil, or key it "soaks it up slowly".
8. L6:122: "Every force does one of two things" contradicts the wooden block at L6:96-97. Say "A force can change movement, or shape, or both."
9. L6:145, 153: a ball "rolling" in space has nothing to roll on. Say "keep moving".
10. L7:27: the Sun is "the biggest light source there is". Say "the biggest light source we have".
11. L8:26, 36: a phone battery is "filled with electricity", which is the battery misconception. Say "A charger charges the battery, so the phone works later."
12. L9:54: pumice is harder than a coin. Say "rough; the coin does not scratch it, but bits break off".
13. L9:53: rubbing does not split slate. Say "smooth, nothing comes off".
14. L10:23: "The Sun is below the ground" at night. Say "Our side of the Earth is turned away from the Sun."
15. L10:24, 26: sunrise and sunset use the same sky state, which draws a centred Sun labelled "rising". Add a sunset state to the kit, with the Sun low on the opposite side.
16. L10:27: "The same path every single day". Say "Nearly the same path each day."
17. L10:118-130, 167: the shadow clock is tagged 2TWSm.02 (a model), but it is an instrument. Retag it, or model the Sun's path with a torch.
18. L7:79: the step is tagged 2TWSm.03 (diagram versus picture) but only teaches models. Drop the tag.
19. L2:197, 213: molars are "big and flat", which contradicts "wide and bumpy". Say "big and wide, with bumps".
20. L5:177, 210: "A raw egg is runny and clear." Say "The egg white is runny and clear."

### Keys (8)
1. L2:174: the distractor "as long as a song" is right by the home project's two-minute song. Use "as long as a sneeze".
2. L2:173: "baby teeth" is right for a six-year-old's canines. Use "front teeth".
3. L2:176: "sleep" is offered as unhealthy. Use "staying up late".
4. L1:138, 207: the kittens' colours are keyed as a certainty. Ask "What could the kittens be like?" and key "They can each look different."
5. L8:133: a lamp does light with one wire. Ask about a wire "joined only to the cell".
6. L6:169, 186: "if nobody touches it" ignores the wind. Say "if nothing pushes or pulls it".
7. L1:82: the key reads as two answers. Use "a bird has feathers and wings; a fish has scales and fins".
8. Pictures that show the wrong thing:
   - chalk shown as a brick (L9:26, 50, 69, 87, 174);
   - a towel shown as a toilet roll (L4:116, 156);
   - a kettle shown as a teapot (L4:131, L8:31, 147); use icon("kettle");
   - a swing shown as a carousel horse (L6:135, 168);
   - litter shown as a police siren (L9:148);
   - "a photo of a bird" and a painting shown as a palette (L1:153, 156);
   - a pond scene in the middle of a torch sequence (L8:98).

### Language (15)
1. Capitalised emphasis, which the voice may spell out. Use <b> or lower case at:
   - L1: 81, 82, 83, 85, 205, 209
   - L3: 67, 68, 69, 70, 112, 146, 163, 165
   - L4: 22, 65, 109, 149, 150, 206
   - L5: 152, 153
   - L6: 45, 49, 111, 187
   - L7: 71, 114, 125, 154, 156
   - L8: 133
   - L9: 180
   - L10: 62, 148, 168
2. L2:217: "Well, and looking after your body." Say "Being well, and looking after your body."
3. L3:184: "So is a desert, a forest and the Arctic." Say "So are…".
4. L2:201: "Sweets and fizzy drinks every day means holes." Say "Having sweets and fizzy drinks every day can cause holes."
5. L2:93: "Sweets all day: not." Say "not healthy".
6. L5:93, 97: "a grown-up does the cooker / the heat". Say "uses the cooker" and "handles the heat".
7. L1:34: "we are alike and different from the others" is awkward.
8. L1:100 and 103: "young chick" and "young hen" name the same stage. Pick one.
9. L6:14, 199, 208: "ball" is used where the experiment has a toy car; the medium push is also called "a bit harder". Use one name for each.
10. L6:240 and 244: "play dough" in the list, "clay" in the conclusion.
11. L4:206: "natural AND manufactured" suggests an object can be both. Say "made of a natural material and a manufactured one".
12. L4:194-199: "transparent", "flexible" and "rigid" are never used in the steps. Add "Another word for see-through", and the same for the other two.
13. L9:220: "Marble does not soak." Say "soak up water".
14. L7:207-210: the dark-cupboard torch task cannot be followed as written.
15. L10:225, 228: a tape measure is listed, but the steps use foot-lengths.

### Safety (6)
1. L8:46, 53, 135: "A little cell is safe to handle." Add "Never put a cell in your mouth, and never break one open."
2. L5:98, 105, 156, 183: the child picks up heated things with oven gloves. Say "Leave it for a grown-up to move, or wait until it is cool."
3. L10:220-224: "Never look straight at the Sun" comes last. Make it step 1, and repeat it at L10:215 and 225.
4. Outdoor tasks with no grown-up: L1:256, L3:213, L3:223, L9:228 and L9:238. For minibeasts add "Look, do not touch. Wash your hands afterwards."
5. L5:209-210: raw egg. Add "Wash your hands after touching raw egg."
6. L2:231: eggs left overnight in fizzy drink. Add "Do not eat the eggs afterwards."

### Inclusion (4)
1. L1:34, 83, 86: "two arms and two legs" is assumed for every child. Say "What do they both usually have?"
2. L1:65, 204: hair "on the head" for every child (covered by Fact 4).
3. L1:134, 266-270: "photos of your family… a child and both parents". Say "a family you know, or an animal and its young in a book".
4. L6:235, 237: "your feet to measure with". Say "your feet or a shoe".
