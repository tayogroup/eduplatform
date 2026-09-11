# Grade 4 Science (science/grade-4-v2) validation

Reviewed 2026-09-11. First validation of this grade. Reviewer: Claude (automated measurement, browser driving, two independent content reviews by other Claude agents, the second of the fixed text, and judgement); no human teacher review yet. Scale: 1 Unsatisfactory; 2 Needs major improvement; 3 Acceptable with revisions; 4 Strong; 5 Excellent. Build reviewed: commit f19a1506d.

Against the 27-area framework in *science-grade-1-v2 validation.docx*. The Word copy of this report is *science-grade-4-v2 validation report 2026-09-11.docx* in the same OneDrive folder; both are generated from the same rows.

## Summary

First validation of Grade 4 Science, built but not yet shipped to learners. The software is sound: all 63 Stage 4 objectives are reached, every step of all thirteen lessons completes in a browser, and nothing overflows at phone width. An independent review found 134 points: 26 facts, 34 pictures, 20 consistency points, 17 capitalised words, 10 safety points, 9 inclusion points, 6 keys and 6 tags. It also found six kit simulations that showed untrue results, the worst being a day-and-night globe that put 'you' on the dark side at midday and a mirror that broke the law of reflection. All of it is fixed, and a second, independent review of the fixed text found 22 smaller points, also fixed. Grade 4 now has what Grades 1 to 3 have: two sittings of about 20 minutes, a warm-up and a 'Last time' recap on every overview, and a reasoning question in every quiz. The fixes are committed as f19a1506d and pushed. Grade 4 is not deployed or routed; that waits on the owner. Average 4.3 out of 5. What remains needs people: a teacher's read, a screen-reader session, the school's devices, and children timed and watched.

Average score **4.3 / 5** across 27 areas. Lowest score 4, in 18 areas. No High-priority finding remains.

Change status at 2026-09-11: 16 areas need no change or are done in the committed build, 7 have their fix built with a person's check still open, and 4 are open. Grade 4 is not shipped, so none of this is on learners' screens. In the table, green means done or no change needed, amber means the fix is built and a person still has to check it, and red means open.

## How this was checked

- Measured on the content through the kit's own step builder, and on the built pages: coverage, steps per objective, reading level, quiz shape, spelling, and questions repeated across grades.
- All thirteen lessons driven in a browser to 100%, then every step checked for overflow at 375 px. The simulations the reviews questioned were also drawn state by state and looked at.
- An independent review of all thirteen modules and the kit parts they use by a second Claude agent (134 findings), then a fresh review of the fixed text by a third (22 findings). Every kit claim was checked against the code before it was fixed.

## The 27 areas

| # | Area | Score | Evidence | Required changes | Priority | Change status | Approval status |
|---|---|---|---|---|---|---|---|
| 1 | Content Quality | 4 | Thirteen lessons of 13 to 16 steps inside the unit shell, in two sittings, with a 'Last time' recap and a warm-up on every overview. An independent review found 134 points and a second review of the fixed text found 22 more. All are fixed. Home projects that could not be followed as written are rewritten: a safe circuit tester with a cell holder and a gap, a dark-room glow test, full paper-spinner instructions, and fallbacks for families without a garden, a freezer or a circuit kit. | A teacher's read of the thirteen content modules. | Medium | Fix committed f19a1506d; teacher read open | Pending owner |
| 2 | Learning Objectives and Outcomes | 5 | 63 of 63 Stage 4 objectives reached. Tags that claimed what a step did not teach are gone: 'draw a diagram' on label steps, 'classify using tests' on a behaviour sort, and 'work safely' on on-screen questions. Where that would have left an objective thin, real teaching was added instead. There are two 'draw it now on paper' frames for the ray diagram, a sea food chain drawn as a diagram, and safety rules for the fizz and circuit work. | None. | - | Done: committed f19a1506d | Pass |
| 3 | Content Depth and Coverage | 5 | No Stage 4 objective is reached by only one teaching step; about 3.3 tagged teaching steps per objective. Every lesson has a practice step: 88 practice questions and 117 quiz items. Ten predict-try-conclude experiments. | None. | - | Done: committed f19a1506d | Pass |
| 4 | Content Accuracy and Correctness | 4 | 26 factual points from the first review and 2 from the second are fixed. Examples: red foxes are omnivores, so the carnivore is now a lion; a two-cell torch goes off when a cell is removed, not dimmer; rust needs water as well as air; the thumb has two bones; comets are not slow, and every side of Mercury gets sunlight; the seismic evidence is a solid mantle and a liquid outer core; some meteorites are iron, not all. Six kit simulations that showed untrue results are corrected (area 27). | A teacher's read; no known errors remain. | Medium | Fix committed f19a1506d; teacher read open | Pending owner |
| 5 | Cambridge Curriculum Alignment | 5 | Cambridge Primary Science 0097 Stage 4, from the published PDF, organised by sub-strand; every tag now matches what its step teaches (area 2). | None. | - | Done: committed f19a1506d | Pass |
| 6 | Grade-Level Appropriateness | 4 | Flesch-Kincaid grade 4.4 across all text (9.9 words per sentence) and 4.3 for the shell, about right for eight- and nine-year-olds. The highest lessons are Staying Healthy (5.7), Habitats and Survival (5.5) and Backbone or Not? (5.3). No capitalised emphasis words remain. | Note the three highest lessons for the teacher. | Low | No change needed | Pass with note |
| 7 | Progression and Grade Boundaries | 4 | The strands build on Grade 3: skeletons and muscles after organs, vertebrates after animal groups, food webs after food chains, particles after solids and liquids, circuits, reflection and the solar system. No quiz question repeats a Grade 3 one. | None. | - | No change needed | Pass |
| 8 | Balance Across Grades | 4 | 13 lessons, 63 objectives and 117 quiz items. Lessons run 35 to 45 minutes and are now two sittings of about 20 minutes each, as in Grades 1 to 3. | Time two children (area 17). | Low | Done: committed f19a1506d | Pass |
| 9 | Lesson Structure and Instructional Strength | 5 | Every lesson opens with 'Last time', the aims and a two-question warm-up, then the lecture, words and teaching sequence. A break card sits at the halfway step, followed by games, home projects and the quiz. Ten predict-try-conclude experiments. | None. | - | Done: committed f19a1506d | Pass |
| 10 | Question and Assessment Quality | 4 | All six keys flagged are fixed. The fox is no longer keyed a carnivore. A wooden pencil is no longer keyed an insulator, because its graphite conducts. Other fixes: 'the biggest group' now reads 'the most kinds of animal'; a defensible 'corners are opaque' distractor is gone; 'which layer is thickest' is now answerable; salt is not a wrong answer to 'which is a material'. No sort item shares its bin's picture, and option lengths no longer give the right answer away. 117 quiz items and 88 practice questions, one key each. | A teacher's read of the 117 keys. | Medium | Fix committed f19a1506d; teacher read open | Pending owner |
| 11 | Assessment Balance | 4 | A warm-up in every lesson (26 questions, never marked) and a reasoning question in every quiz, such as 'Why must both spinners be dropped from the same height?' and 'What would happen if your triceps stopped working?'. About 94 of 117 quiz items are still recall. | More reasoning items in a later revision. | Low | Done: committed f19a1506d | Pass |
| 12 | Feedback and Answer Explanations | 5 | Every answer gets a spoken and written reason; the warm-up answers kindly and never marks. Seen on every step while driving. | None. | - | No change needed | Pass |
| 13 | Standardized Interactivity and Ease of Use | 4 | All thirteen lessons driven to 100%, warm-ups answered and the break card met at each halfway step. The spinner now asks for a second, bigger-winged spinner before it concludes. | Watch two or three children. | Medium | Open: child observation not started | Pass |
| 14 | Standardized Design and User-Interface Standards | 5 | The shared design system and kit; four new drawings (copper wire, an Arctic fox, a paper spinner, a lolly stick) match the flat style. | None. | - | No change needed | Pass |
| 15 | Accessibility and Inclusion | 4 | Accessibility is sound. The simulations and figures are named, and the layer names no longer print on the figure the child is asked to label. Inclusion points from both reviews are fixed. Nothing now assumes two usable arms, a chicken dinner, a medicine cupboard, meat at home, a cold winter, a garden, a freezer, a fridge or a circuit kit, and alternatives are given. | One screen-reader walk-through. | Medium | Open: screen-reader session not started | Pass with note |
| 16 | Online Teaching Standards | 4 | Self-paced; class controls and Wehel mount with a launch token. The sittings and recap give a teacher natural start and stop points. | None. | - | No change needed | Pass |
| 17 | Learning-Time Estimates | 4 | Two sittings of about 20 minutes each, cut at the step nearest halfway, shown on the hub and the overview. The minutes are still derived from step kinds. | Time two children. | Medium | Fix committed f19a1506d; timing with children open | Pass with note |
| 18 | Multimedia Quality | 4 | 40 picture points fixed. Examples: a unicorn for a horse, a caterpillar for a firefly, thread, a sponge, a paper roll and a lotion bottle for wire, an eraser, foil and glass. Pictures that gave answers away are fixed, and a bin and its items no longer share a picture. In the kit, the skeleton has two bones in each lower arm and leg, the Earth's core reaches over half-way out, and the volcano grows eruption by eruption. The earthquake's plates stay touching, and each muscle reaches the forearm by a tendon. The emoji guard now also refuses the exhaling face and three other Emoji 13.1 sequences. | Check two lessons on the school's oldest devices. | Medium | Fix committed f19a1506d; device check open | Pass with note |
| 19 | Language and Reading Level | 4 | All 17 capitalised words and the kit's are gone, and British spelling is clean. Language fixes include 'shellfish', 'degrees Celsius', and a question stem that now asks a question. Not yet proofread by a person. | A human proofread. | Low | Fix committed f19a1506d; human proofread open | Pending owner |
| 20 | Cultural Relevance and Safeguarding | 4 | 10 safety points from the first review and 2 from the second are fixed. Examples: never join the two battery ends; cover a bare wire only in your cell circuit, and a damaged mains lead is for a grown-up; goggles for the kitchen volcano; never look straight at the Sun at the shadow stick; a grown-up at ponds, beaches and street walks; look, do not touch, under stones; wash your hands after bones and minibeasts; eat the chocolate only if a grown-up says so. | A teacher's read of the 39 home projects. | Medium | Fix committed f19a1506d; teacher read open | Pass with note |
| 21 | Technical Quality and Compatibility | 4 | Gates green on all four grades, including the header-bar check. A transient Windows write error recurred often during these rebuilds; retries cleared it and the gates confirm every page. Zero overflow at 375 px on every step. Not yet opened on the school's devices. | Open two lessons on the school's own devices. | Medium | Open: device test not started | Pass with note |
| 22 | Learner Progress and Completion | 4 | Progress is written under ehel-sci-g04 with the resume guard on every page, and completion reaches 100% in all thirteen lessons. Grade 4 is not shipped, so no learner has a saved place yet. | Before shipping: route it and watch the first stored record. | Low | No change needed | Pass |
| 23 | Motivation and Engagement | 4 | Games in every lesson, stickers, ten experiments, shorter sittings with a 'Halfway there!' card, and a warm-up with nothing to lose. | None. | - | No change needed | Pass |
| 24 | Teacher and Parent Support | 5 | The grown-ups section on the hub for all thirteen lessons and three home projects per lesson, now safe, followable, and with alternatives for things a family may not have. Student resources included. | None. | - | Done: committed f19a1506d | Pass |
| 25 | Religious Neutrality and Sensitivity | 5 | No religious references in the thirteen modules. | None. | - | No change needed | Pass |
| 26 | Duplication / overlap | 5 | No quiz question repeats Grade 3 or another Grade 4 quiz; one question used in two lessons was reworded. No game or warm-up repeats a quiz question; the builder enforces both. | None. | - | Done: committed f19a1506d | Pass |
| 27 | Bugs, syntax, and errors | 4 | Six kit simulations showed results that are not true, and all are fixed. Day and night put 'you' on the dark side at midday, and now shows a stick and its shadow. The mirror broke the law of reflection and now computes equal angles. The energy bars totalled more than 100 and now always total 100 against a marked scale. The liquid's particles stood still and now slide past each other. 'Very dim' was drawn as off. The arm labelled the triceps contracted at rest. All gates are green. | Watch the first sessions once Grade 4 ships. | Medium | Open: first-session watch not started | Pass |

## Required changes, by priority

- High: none remaining.
- Medium: a teacher's read of the thirteen modules, 117 quiz keys and 39 home projects (1, 4, 10, 20); a screen-reader session (15); two lessons on the school's devices (18, 21); two or three children watched and timed (13, 17, 27).
- Low: more reasoning items in a later revision (11); a human proofread (19); note the three highest-reading lessons (6). Before shipping: route Grade 4 and watch the first stored record (22).

## Findings in brief

- Kit (6 simulations showing untrue results, plus figures and scenes). Day and night had 'you' on the dark side at midday. The mirror's reflected rays broke the law of reflection. The bouncing ball's energy bars totalled 104 to 112. The liquid's particles never moved. 'Very dim' was drawn as off. The arm labelled the triceps contracted at rest. The skeleton showed one bone per lower arm, the Earth's core was drawn too small, the volcano's magma was a molten layer under all the crust, and the earthquake opened a gap between plates pushed together.
- Facts (26 + 2). Red foxes keyed as carnivores; 'owl -> mouse' reversing the food-chain arrow; a two-cell torch 'dimmer' with one cell out; rust from 'iron and air'; 'penguins live at the South Pole'; Mercury 'baking on one side'; 'slow' comets; the seismic evidence misstated; 'meteorites are made of metal'; a vaccinated body that 'wins straight away'.
- Pictures (34 + 6). A unicorn for a horse, a caterpillar for a firefly, thread for copper wire (and thread is an insulator), a paper roll for foil. In at least six sorts an item shared its bin's picture, and many quiz pictures showed the right answer.
- Safety (10 + 2). Bridging a battery with foil, a bare mains wire, a kitchen volcano with no goggles, a shadow stick with no Sun warning, ponds, beaches and street walks with no grown-up, and 'taste it' after melting chocolate.

## Verdict

Grade 4 is at the same standard as Grades 1 to 3 in the committed build, after two independent reviews and their fixes. It is ready to ship when the owner decides; the remaining checks need people.

## Appendix A: the first review's findings, in full

From the independent review of all thirteen Grade 4 content modules and the kit parts they use (2026-09-11). "L1:59" means `content/lesson-1.py`, line 59, as reviewed. Categories: accuracy, pictures, keys, safety, consistency, inclusion, language, tags, repeats, home realism.

### Lesson 1 (Bones and Muscles)
- L1:59, 113 (language): "PULLS", "NOT" in capitals.
- L1:73-80, 24 (tag): 4TWSm.03 "draw a diagram" on a label-the-figure step; the blurb says "draw a labelled diagram".
- L1:176-179 (inclusion): "feel the pair" assumes two usable arms; add "or feel a grown-up's arm".
- L1:185 (accuracy): "three bones in each finger" is wrong for the thumb (two).
- L1:186-190 (inclusion, safety): the chicken bone assumes the family eats chicken; no hand-washing.

### Lesson 2 (Backbone or Not?)
- L2:26 (language): "OUTSIDE".
- L2:48, 59 (picture): the Invertebrate bin and the earthworm item share one drawing.
- L2:112, 114, 131, 132 (picture): pictures give the answers (snail, butterfly, spider, ant).
- L2:28, 185-187 (consistency): exoskeleton defined as "a hard skeleton on the outside", but a snail's shell is never placed.
- L2:113 (language): "shell fish" -> "shellfish".
- L2:133 (key): "the biggest group" could mean body size; "the most kinds of animal".
- L2:178-181 (safety, inclusion): lifting stones with no grown-up or hand-washing; assumes a garden and a magnifying glass.
- L2:188-192 (safety, home): beach or pond with no grown-up; finding a moult is luck; "in summer".

### Lesson 3 (Staying Healthy)
- L3:16 (tag): 4TWSc.01 on a safe/not-safe sort.
- L3:42 (language): "WELL".
- L3:48, 161 (accuracy): a vaccinated body "wins straight away. You do not get the disease" overclaims and contradicts L3:84.
- L3:49, 139 (accuracy): "Plants cannot be vaccinated" is too absolute.
- L3:80-89 (picture): the Opinion bin and all four opinion items use the same speech bubble.
- L3:136 (language): a stem with no question.
- L3:191-195 (home): counting a pulse is never taught.
- L3:186, 193 (inclusion): "medicine cupboard"; "run on the spot".

### Lesson 4 (Energy for Life)
- L4:21, 36, 78, 114, 133 (language): five capitalised words.
- L4:48 (picture): the horse is a unicorn (U+1F984).
- L4:43, 154, 166, 59 (accuracy, key): the fox keyed as a carnivore (red foxes are omnivores, and L4:78 says so); the mouse as a herbivore.
- L4:36 (inclusion): "You eat vegetables and meat".
- L4:129 (picture): the plant picture gives away "producer".
- L4:132 (accuracy): "owl -> mouse" reverses the food-chain arrow.

### Lesson 5 (Habitats and Survival)
- L5:22 (accuracy): "Penguins live at the South Pole".
- L5:32 (key): a seal keyed to Arctic is defensible as Ocean.
- L5:35 (picture): the Arctic fox is an orange red fox.
- L5:44, 50 (accuracy): gills take oxygen, not "air", out of water.
- L5:67, 136 (consistency, accuracy): a goldfish released in a river "would probably be eaten"; they often survive and become pests.
- L5:69, 153 (inclusion): "outside in winter" assumes a cold winter.
- L5:97-104 (consistency): "a good effect and a bad one", but two places get only good effects.
- L5:107, 154, 155 (language): three capitalised words.
- L5:151 (picture): the monkey picture gives the answer.
- L5:201-205 (consistency, safety): the damp patch is also shady and the dry one sunny (two things change), called "a fair comparison"; stones with no grown-up.
- L5:211 (safety): a street walk with no grown-up.

### Lesson 6 (Particles)
- L6:129 (key): salt as a wrong answer to "which is a material?".
- L6:131 (picture): flour shown as bread.
- L6:87 (accuracy): "millions of millions" particles in a drop understates it and disagrees with L6:61.
- L6:176 (inclusion): assumes a freezer.

### Lesson 7 (Changes and Reactions)
- L7:35, 37, 56, 125 (language): four capitalised words.
- L7:54, 77, 90, 142, 175 (accuracy): a chemical change "cannot be undone" is absolute; "usually".
- L7:70 vs 77, 90 (consistency): torn paper keyed physical, but the taught rule is "undo it: physical".
- L7:59-62 (picture): the bins share pictures with ice melting and wood burning.
- L7:65, 140, 180 (accuracy, key): rust from "iron and air" leaves out water, making a distractor partly right.
- L7:109 (picture): "carry low, walk" shows a runner.
- L7:92 (tag): 4TWSc.06 on an on-screen sort.
- L7:125, 141, 143, 144 (picture): pictures give the answers.
- L7:193-196 (inclusion): needs a fridge and a warm windowsill.

### Lesson 8 (Energy Everywhere)
- L8:32, 150, 201 (language): three capitalised words.
- L8:60-70 (consistency): the table's 3, 2, 1 marks cannot be read from the sim (no marks; drawn heights not 3:2:1).
- L8:143, 150 (picture): pictures give the answers.
- L8:199-203 (home): LED bulbs are barely warm.

### Lesson 9 (Light and Seeing)
- L9:43, 62, 80, 110, 116, 154 (language): six capitalised words.
- L9:93-100 (picture): the bins share pictures with the lamp and the Moon.
- L9:101 (picture): the firefly is a caterpillar.
- L9:102 (picture): "a white wall" is a red brick.
- L9:151, 152 (picture): pictures give the answers.
- L9:148 (key): the distractor "corners are opaque" is defensible.
- L9:51 (consistency): "block the line and you see nothing", but the lit book is seen.
- L9:172, 192 (accuracy): light "bounces off" every surface ignores absorption.
- L9:204-208 (home): the cupboard test proves nothing; a glow star must be charged first.
- L9:75 (tag): 4TWSm.03 on a label step.
- L9:155 vs L12:138 (repeat): "What makes scientific knowledge change?" in two quizzes.

### Lesson 10 (Circuits and Switches)
- L10:46, 67, 152, 169, 208 (picture): copper wire shown as thread (an insulator).
- L10:49 (picture): the eraser is a sponge.
- L10:50 (picture): foil is a paper roll.
- L10:53, 168, 210 (picture): the glass bead is a lotion bottle.
- L10:51, 70, 225-229 (key, accuracy): a wooden pencil keyed insulator, but its graphite conducts.
- L10:49 (consistency): "rubber covers wires" vs plastic elsewhere.
- L10:124 (tag): 4TWSc.06 on on-screen questions.
- L10:101 (safety): "cover a bare wire with tape" without "only in your cell circuit".
- L10:151, 168, 170 (picture): pictures give the answers.
- L10:204 (accuracy): a cell stores chemical energy.
- L10:215-219 (accuracy, home): taking one cell out of a two-cell torch turns it off, not "dimmer".
- L10:225-229 (safety, home): bridging with foil risks a short circuit across the battery ends.

### Lesson 11 (Inside the Earth)
- L11:30 (picture): the figure prints the layer names, so "tap the crust" is reading.
- L11:111, 116, 151 (accuracy): the seismic evidence misstated (the waves show a solid mantle and a liquid outer core; metal is inferred from density).
- L11:88-98, 172, 145 (accuracy, key): the apple model's tiny core misrepresents scale; "thickest layer" arguable.
- L11:149 (picture): nail polish gives away "fingernails".
- L11:200-204 (consistency, safety): the kitchen volcano uses no goggles, against L7's own plan.
- L11:73 (language): "degrees" should say "degrees Celsius".

### Lesson 12 (The Solar System)
- L12:44 (accuracy): Mercury "baking on one side" is the old tidally-locked error.
- L12:60 (accuracy): comets are not "slow".
- L12:117-119, 134 (picture): pictures give the answers.
- L12:182-186 (safety): shadow stick with no Sun warning.
- L12:187-191 (safety): a 130-metre walk with no grown-up.

### Lesson 13 (The Paper Spinner)
- L13:41, 133, 134, 151 (language): capitalised words.
- L13:46, 49 (picture): the Measure bin shares the stopwatch with "how long it takes to fall".
- L13:151 (picture): the cross picture gives the answer.
- L13:27, 48, 74 (picture): the spinner is shown as a kite.
- L13:74-91, 133, 155 (consistency, tag): the question is "does a bigger spinner fall more slowly?", but only one spinner is dropped, so the conclusion does not answer it (4TWSa.03 not met).
- L13:200-203 (home, safety): not enough to build a spinner; scissors with no grown-up; the dot plot's scale starts above a likely drop time.

### General
- In many quiz items the right option is the only long, explained one (e.g. L2:128, L4:133, L5:150, L13:152-155).

### Kit (`lib/science.js`, `_shell.py`, `_icons.py`)
- SIMS.dayNight: the night half is on the right, away from the Sun, but the marker runs top, right, bottom, left, so "midday" is on the dark side. **Confirmed.**
- SIMS.rayMirror and FIGURES.ray: the reflected rays do not obey equal angles; the ray figure's reflected ray has no arrow; "the eye sees nothing" when the lit book would be seen.
- SIMS.energyDrop: the bars total 104, 108, 112 after bounces; a ball held still shows 100 "movement energy".
- SIMS.particles: the liquid's particles never move; rows overlap.
- seriesSvg: "very dim" drawn the same as off; the cell button not capped.
- SIMS.muscles: "PULLS" in capitals; the triceps labelled contracted at rest; "every bone in your body moves".
- FIGURES.skeleton: one line for the lower arm while the voice says two bones.
- FIGURES.earthLayers: the core drawn at 36% of the radius (really about 55%).
- SCENES.volcano: magma as a continuous layer; the vent never breaks the crust; the cone never grows.
- SCENES.quake: a gap opens between plates pushed together; the house sits underground.
- _shell.py games_pack: the Sort race prompt "Where does <label> go?" garbles sentence labels and repeats item pictures.
- _icons.py ZWJ_TOO_NEW: the exhaling face (Emoji 13.1 sequence) is not refused.

Counts: accuracy 26, pictures 34, keys 6, safety 10, consistency 20, inclusion 9, language 17, tags 6, repeats 1, home realism 5; 134 in all.

## Appendix B: the second review's findings (of the fixed text and kit)

A fresh reviewer read the fixed modules and the changed kit parts on 2026-09-11 and found 22 points, most of them minor: accuracy 2, pictures 6, safety 2, consistency 5, language 1, tags 2, near-repeats 1, home projects 2. It confirmed that the mirror obeys equal angles, the energy bars total 100, "you" faces the Sun at midday, the circuit brightness and switch are right, the spinner answers its question, the core is drawn at 55% of the radius, and no sort item shares a picture with its bin.

### Content
- L1:196 (accuracy): "A real bone is a physical model of yours." A bone is a specimen, not a model.
- L2:23-33 (consistency): "three kinds of skeleton" as vertebrate / invertebrate / exoskeleton overlaps (exoskeleton animals are invertebrates).
- L2:185 (safety): the minibeast hunt should say "do not pick up or touch the creatures".
- L3:140 (picture): a walking person pictures "Which counts as moving every day?", whose answer starts with walking.
- L5:207 (home): "Damp or dry?" needs outdoor ground, with no fallback.
- L5:72/157 and 74/152 (near-repeat): two fact-card questions and quiz questions are paraphrases with the same answer text.
- L6:130 (picture): salt pictures "Which is a substance?", answer salt.
- L7:145 (consistency): "Who handles the hot pan in the experiment?", but no experiment uses a pan.
- L7:203 (safety): the melted-chocolate home project says "taste it", against the lesson's "never taste" rule.
- L7:32, L10:17 (tag): 4TWSc.06 (carry out practical work safely) on simulated experiments.
- L8:66-70 (picture): numbered pictures for bounces and for marks invite matching by picture.
- L9:23 (tag): 4TWSm.03 (draw a diagram) on a demo the child watches.
- L10:233 (home): the conductor test needs a circuit kit, with no fallback.
- L11:117, 106, 112 (accuracy): "meteorites are made of metal"; most are stony, some are iron.
- L12:31-33 (consistency): the conclusion asks about shadows, but the day/night sim draws none.

### Kit
- particleSvg: the liquid's particles still sit on a staggered grid, wobbling in place and not touching.
- armSvg: neither muscle reaches across the elbow to the forearm.
- SIMS.dayNight: no stick or shadow is drawn.
- SIMS.rayMirror, FIGURES.ray: the reflected ray is dashed, which in a ray diagram means an imagined ray.
- SIMS.reaction: "a MIXTURE", "a NEW substance" in capitals.
- SCENES.volcano: a cone stands before any eruption.
- SIMS.foodChain: "then the foxes have nothing to eat" with no qualifier.
