# Grade 3 Science (science/grade-3-v2) validation

Reviewed 2026-09-11. First validation of this grade. Reviewer: Claude (automated measurement, browser driving, an independent content review by a second Claude agent, and judgement); no human teacher review yet. Scale: 1 Unsatisfactory; 2 Needs major improvement; 3 Acceptable with revisions; 4 Strong; 5 Excellent. Build reviewed: commit 0f8bed7f5 (live since 2026-09-11).

Against the 27-area framework in *science-grade-1-v2 validation.docx*. The Word copy of this report is *science-grade-3-v2 validation report 2026-09-11.docx* in the same OneDrive folder; both are generated from the same rows.

## Summary

First validation of Grade 3 Science, live since 2026-09-10. The software is sound. All 51 Stage 3 objectives are reached, every step of all thirteen lessons completes in a browser, nothing overflows at phone width, every control is named, and today's kit fixes are live. The content is not ready to sign off, and the review found more here than in Grade 2. There are 31 factual points: seaweed called a plant, every reptile said to lay eggs, 'without gravity things would float away', a crescent Moon always 'on the right', and fossils said to be rare in granite because it is hard. There are 13 safety points, the worst being a child told to watch the steam from a boiling kettle and cliffs suggested with no warning. There are also 12 wrong pictures (a fish for a tadpole, a frying pan for a sieve), 7 inclusion points and 22 capitalised words. Two shared-kit simulations teach wrong results: the force meter's pointer does not line up with its own scale, and the warm-or-cold plant test puts the cold plant in the dark, so it is not a fair test. Grade 3 also lacks what Grades 1 and 2 now have: two sittings, warm-ups, reasoning quiz items, and a second teaching step for five objectives. Average 3.7 out of 5.

Average score **3.7 / 5** across 27 areas. Lowest score 2, in 2 areas: Content Accuracy and Correctness, Cultural Relevance and Safeguarding. Three High-priority findings: content accuracy (4), home safety (20) and two kit simulations that show wrong results (27).

Change status at 2026-09-11: **9** areas need no change, **18** are open.

## How this was checked

- Measured on the content through the kit's own step builder, and on the built pages: coverage, steps per objective, reading level, quiz shape, spelling, repeated questions across grades.
- All thirteen lessons driven in a browser. Three multi-button experiments (force meter, friction, shadow size) were finished by hand, one button at a time as a child would, because a generic driver presses the same button over and over. Every step of every lesson was then checked for overflow at 375 px.
- The Moon lesson's built page was scanned for controls and pictures without an accessible name.
- An independent review of all thirteen content modules and the kit parts they use, by a second Claude agent. Its two main kit claims, the plant test and the force meter, were checked against the code and confirmed.

## The 27 areas

| # | Area | Score | Evidence | Required changes | Priority | Change status | Approval status |
|---|---|---|---|---|---|---|---|
| 1 | Content Quality | 3 | Thirteen lessons organised by the Stage 3 sub-strands, 14 to 17 steps each, inside the unit shell with a 'Last time' recap. The structure is sound. The text carries about 83 review findings, and one home task cannot be done as written: seeing a boat's hull vanish at a lake. | The content pass in areas 4, 10, 18, 19 and 20, then a fresh second review. | High | Open: not started | Acceptable with revisions |
| 2 | Learning Objectives and Outcomes | 4 | 51 of 51 Stage 3 objectives reached on the built pages, each step naming its codes. Two steps call an on-screen builder a physical model (3TWSm.02): the food-chain diagram and the Earth-Moon build. The lamp-and-ball and chain-card home tasks are the real physical models. | Retag the two builders, and give 3TWSm.02 a step that makes a physical model. | Medium | Open: not started | Pass with note |
| 3 | Content Depth and Coverage | 4 | About 3.5 teaching steps per objective, but five objectives have one: 3TWSa.02 (patterns in results), 3TWSa.04 (tables and bar charts), 3TWSc.02 (choosing equipment), 3TWSc.04 (practical work safely) and 3TWSp.04 (risks). 66 practice questions. | A second teaching step for each, as items inside existing steps. | Low | Open: not started | Pass with note |
| 4 | Content Accuracy and Correctness | 2 | 31 factual points. Several teach misconceptions a later grade must undo: seaweed as a plant, all reptiles laying eggs, 'without gravity things would float away', the crescent always on the right, and fossils rare in granite because it is hard. Two come from the kit's simulations: the force meter misreads, and the plant test mixes cold with dark. | Fix all 31 and the two simulations; then a fresh review and a teacher's read. | High | Open: not started | Needs major improvement |
| 5 | Cambridge Curriculum Alignment | 4 | Cambridge Primary Science 0097 Stage 3, from the published PDF, organised by sub-strand. Thinking and Working Scientifically is taught in its own steps (fair tests, forcemeter, bar charts, keys). Two tags are loose (area 2). | Retag the two model steps. | Medium | Open: not started | Pass with note |
| 6 | Grade-Level Appropriateness | 4 | Flesch-Kincaid grade 3.5 across all text and 3.4 for the shell. The highest lessons are Magnets (4.5) and Growing Up (4.3). Every line is also read aloud. | None beyond area 19. | Low | No change needed | Pass |
| 7 | Progression and Grade Boundaries | 4 | The strands build on Grades 1 and 2: once-alive things, flowering plants and life cycles, organs, food chains, states of matter, mixtures, gravity and friction, shadows, magnets, rocks and fossils, the Moon. No question repeats Grade 1 or 2. The magnet simulation is shared with Grade 1 but asks a harder question. | None. | - | No change needed | Pass |
| 8 | Balance Across Grades | 3 | 13 lessons, 51 objectives, 104 quiz items. Lessons run 35 to 40 minutes in one sitting, while Grades 1 and 2 now have two sittings of about 20. Five objectives have a single teaching step. | Two sittings (area 17); the depth items in area 3. | Medium | Open: not started | Acceptable with revisions |
| 9 | Lesson Structure and Instructional Strength | 4 | The kit's sequence with a 'Last time' recap on lessons 2 to 13. No warm-ups are authored. There are twelve predict-try-conclude experiments, the most of any grade. | A warm-up per lesson. | Low | Open: not started | Pass with note |
| 10 | Question and Assessment Quality | 3 | 104 quiz items and 66 practice questions, one key each, and no game repeats the quiz. Three keys are wrong or ambiguous: sunglasses keyed translucent, a steel spoon keyed magnetic, and a Moon prediction that contradicts its own conclusion. Nine consistency points, such as the stomach 'on the left'. | Fix the 3 keys and 9 consistency points; a teacher's read. | Medium | Open: not started | Acceptable with revisions |
| 11 | Assessment Balance | 3 | About 84 of 104 quiz items are recall. There is no warm-up and no reasoning item in any quiz; reasoning lives in the experiments, keys and graphs. | A warm-up and one reasoning quiz item per lesson. | Medium | Open: not started | Acceptable with revisions |
| 12 | Feedback and Answer Explanations | 5 | Every answer gets a spoken and written reason, and experiments quote the prediction back. Seen on every step while driving. | None. | - | No change needed | Pass |
| 13 | Standardized Interactivity and Ease of Use | 4 | Every step of all thirteen lessons completes. Three experiments need their buttons pressed in a particular order: the force meter, friction, and shadow size, which finishes only once the toy has been at both ends. A finished surface or item stays clickable and re-runs. | Watch children on the three multi-button experiments. | Low | Open: child observation not started | Pass with note |
| 14 | Standardized Design and User-Interface Standards | 5 | The shared design system and kit; no new styles in the content. | None. | - | No change needed | Pass |
| 15 | Accessibility and Inclusion | 3 | Accessibility is sound: no unnamed control or picture on a scanned page, en-GB, overlays are dialogs, and the simulations are named. Seven inclusion points: 'run on the spot', 'every pet you know: yours', 'everyone's feet point to the centre', 'most houses have more than ten', 'natural gas heats our water', and two more. | Fix the 7 inclusion points; a screen-reader session. | Medium | Open: not started | Acceptable with revisions |
| 16 | Online Teaching Standards | 4 | Self-paced; class controls and Wehel mount with a launch token. | None. | - | No change needed | Pass |
| 17 | Learning-Time Estimates | 3 | 35 to 40 minutes per lesson in one sitting at seven or eight, about 500 minutes in all, derived from step kinds. The two-sittings switch is off. | Set "sittings": 2; time two children. | Medium | Open: not started | Acceptable with revisions |
| 18 | Multimedia Quality | 3 | No Emoji 13+ glyph or sequence reaches a page. Twelve pictures show the wrong thing, from a fish for a tadpole to a frying pan for a sieve. The kit's globe scene cannot show what its caption says, the insect figure puts two legs on the abdomen, and the shadow simulation shows 'BIG' in capitals. | Replace the 12 pictures; fix the globe use and the insect figure; a device check. | Medium | Open: not started | Acceptable with revisions |
| 19 | Language and Reading Level | 3 | British spelling clean ('thermometer' is correct). 22 capitalised words for emphasis across thirteen lessons, plus one in the kit. | Lower-case the capitals; a human proofread. | Medium | Open: not started | Acceptable with revisions |
| 20 | Cultural Relevance and Safeguarding | 2 | Thirteen safety points. The most serious: a child told to watch the steam from a boiling kettle, cliffs suggested with no warning, nettles and weeds pulled by hand, a child cutting stems, glass jars and recycled glass handled, and outdoor tasks with no grown-up. | Fix all 13. | High | Open: not started | Needs major improvement |
| 21 | Technical Quality and Compatibility | 4 | Zero overflow at 375 px on every step of all thirteen lessons. Gates are green, including the header-bar and emoji checks. Live since 2026-09-11 from 0f8bed7f5. Not yet opened on the school's devices. | Open two lessons on the school's own devices. | Medium | Open: not started | Pass with note |
| 22 | Learner Progress and Completion | 4 | Progress under ehel-sci-g03 with the resume guard on every page. Completion reaches 100%. | None. | - | No change needed | Pass |
| 23 | Motivation and Engagement | 4 | Games in every lesson (3 to 5), stickers, twelve experiments. The one-sitting length is the main risk. | See area 17. | - | No change needed | Pass |
| 24 | Teacher and Parent Support | 4 | The grown-ups section on the hub for all thirteen lessons, home projects and student resources. Several home projects need safety lines, and one cannot be observed (area 20). | Rewrite the unsafe and unobservable home tasks. | Medium | Open: not started | Pass with note |
| 25 | Religious Neutrality and Sensitivity | 5 | No religious references in the thirteen modules. | None. | - | No change needed | Pass |
| 26 | Duplication / overlap | 5 | No quiz or practice question repeats Grade 1 or Grade 2, none is used twice in Grade 3, and no game repeats the quiz. | None. | - | No change needed | Pass |
| 27 | Bugs, syntax, and errors | 3 | No console errors and every step completes, but two shared-kit simulations show results that are not true. The force meter's pointer and ticks use different scales, and the plant test's cold plant is drawn in the dark. At 5 N the book is also drawn outside the force meter's frame. | Fix both simulations in the kit. | High | Open: not started | Acceptable with revisions |

## Required changes, by priority

- High: fix the 31 facts and 13 safety points, and the force meter and plant-test simulations in the kit (areas 4, 20, 27). Grade 3 is live, so every fix must keep each lesson's step count and order.
- Medium: fix the 12 pictures, 3 keys, 9 consistency points, 7 inclusion points and 22 capitalised words, the globe scene and the insect figure (10, 15, 18, 19); retag the two model steps (2, 5).
- Medium: bring Grade 3 up to Grades 1 and 2: two sittings, a warm-up and a reasoning quiz item per lesson, and a second teaching step for 3TWSa.02, 3TWSa.04, 3TWSc.02, 3TWSc.04 and 3TWSp.04 (3, 8, 9, 11, 17).
- After the fixes: a fresh second review, since one found 31 more points in Grade 1 after its first pass; then a teacher's read, a screen-reader session, the school's devices, and children watched.

## Findings in brief

- Facts (31). Seaweed called a plant; every reptile 'lays eggs on land'; 'without gravity things would float away'; the crescent Moon 'on the right' (true only in the northern half of the world); fossils rare in granite 'because it is hard'; 'only iron and steel are magnetic', and copper-coloured coins that are really steel; a magnet as 'a piece of metal'; gold 'melted out' of rock; blood carrying 'air'; 'the material, not the thickness' decides see-through; a sunflower always 'turns to follow the Sun'; a boat's hull disappearing at a lake.
- Kit (5). The force meter's pointer moves 14 units per newton against ticks 24 apart, so '5 N' points near the 3 N mark. The warm-or-cold plant test draws the cold plant in a dark cupboard. The globe scene cannot show the 'arrow to the centre' its caption describes. The insect figure has two legs on the abdomen. The Earth is 'a big ball, mostly water'.
- Pictures (12). The tadpole as a fish, while the lesson warns against 'the tadpole is a baby fish'; a tadpole with legs as a human leg; an adult ladybird for its larva; a frying pan for a sieve; a toilet roll for cling film, tissue and foil; a lotion bottle for a clear bottle; a lizard for a newt; a blood drop for the breathing muscle; the vet and the zookeeper as a nurse and a farmer.
- Safety (13). 'Watch the steam spread out' beside a boiling kettle; cliffs with no warning; nettles and pulling up weeds; stems cut by the child; glass jars; recycling glass and cans; outdoor tasks (night sky, park, lifting stones, street walk) with no grown-up; 'measure how hot' with no limit.
- Keys and consistency (12). 'Dark sunglasses' keyed translucent; 'steel spoon' keyed magnetic; the Moon prediction 'look bigger night by night' contradicting its own conclusion; the stomach 'on the left' when the figure draws it on the right; 'four ways to separate' when tasting separates nothing; 'as the Sun moves' in a grade that teaches the Earth turns.
- Inclusion (7), tags (2), capitalised words (22).

## Verdict

Grade 3 works as software and reaches every objective, but its text teaches more wrong science than Grade 2's did, and two of its simulations show results that are not true. It needs the same fix pass Grades 1 and 2 have had, with the two kit simulations corrected, before a teacher is asked to approve it.

## Appendix: the content review's findings, in full

From the independent review of all thirteen Grade 3 content modules and the kit parts they use (2026-09-11). "L1:22" means `content/lesson-1.py`, line 22, as reviewed. Each finding gives the location, what is wrong, and a suggested fix. Two kit claims were checked against the code and are confirmed: the plant test draws the cold plant in the dark, and the forcemeter pointer moves 14 px per newton against ticks 24 px apart.

### Lesson 1
- L1:22, 30, 32 (fact): "a sunflower turns to follow the Sun all day". Only young ones do; say "A young sunflower".
- L1:120 vs 127 (consistency): "Pick a question about snails", but two of the three questions are about woodlice. Say "about minibeasts".
- L1:141, L3:128 (picture): the vet uses the nurse's health-worker picture, and the zookeeper is shown as a farmer. Use a dog and an elephant.
- L1:231-232 (safety): a glass jar. Use a clear plastic cup.

### Lesson 2
- L2:54, 57, 99, 115, home 179-183, and the kit's `plantWarm` (fact, consistency, kit): the step says "the same light", but the kit draws the cold plant in a dark cupboard (`darkB: true`), and a fridge is dark anyway. The warm-or-cold test is not fair: "cold" is confounded with "dark". In the kit drop `darkB` and label it "cold place"; in the text say "somewhere very cold"; in the home task use a cold but bright place, not the fridge.
- L2:45 (fact): "That is why leaves are green and face the Sun." Say "leaves spread out towards the light".
- L2:184-187 (safety): "Cut the stem" names no grown-up, and uses a glass. Say "A grown-up cuts the stem", with a plastic cup.
- L2:189-191 (safety): pulling up a weed. Say "one a grown-up says is safe. Wash your hands afterwards."

### Lesson 3
- L3:63 (picture): the newt is drawn as a lizard, and the text says "not a lizard". Use a frog.
- L3:28, 59, 79, 171 (fact): reptiles "lay eggs on land". Some snakes and lizards bear live young. Say "most lay eggs on land".
- L3:202 (inclusion): "every pet you know: yours, …". Say "every pet you know or have seen".

### Lesson 4
- L4:24, 73, 179 (picture): the tadpole is a fish, while L4:20 names "the tadpole is a baby fish" as the misconception. Use a tadpole drawing.
- L4:25, 144 (picture): "tadpole with legs" is a human leg.
- L4:78 (picture): the "ladybird larva" is an adult ladybird.
- L4:81 (fact): "Frogs and insects change it", but grasshopper young look like small adults. Say "Frogs, butterflies and ladybirds".
- L4:199 (safety): cabbage patch or nettles, with no grown-up. Nettles sting; add "Do not touch hairy caterpillars."

### Lesson 5
- L5:57 (consistency): "the bag on the left of the picture", but the kit draws the stomach on the right. Say "on the right".
- L5:72 (picture): the breathing muscle is a blood drop.
- L5:43, 146 (fact): blood carries "food and air". Say "food and the goodness from the air".
- L5:174 (inclusion): "Run on the spot". Say "Move as fast as you can on the spot, in any way you can."

### Lesson 6
- L6:65, 75, 125, 162 (fact): "Seaweed is a plant", but it is an alga. Use seagrass or a water lily.
- L6:96 (fact): "the birds, which do not eat plants", but many birds eat seeds and berries. Say "the birds that eat caterpillars".
- L6:31, 117 (tag): 3TWSm.02 (a physical model) is on an on-screen builder that L6:34 calls "a food chain diagram". Retag it 3TWSm.03, or keep 3TWSm.02 on the chain-cards home task.

### Lesson 7
- L7:187-190 (safety, fact): "Watch the steam spread out" beside a boiling kettle. Steam scalds, and the visible cloud is droplets, not steam. Add "Stand well back", and say the steam just above the spout is invisible.
- L7:197-200 (safety): "how hot… measure it". Add "Measure only cold or room-temperature things."

### Lesson 8
- L8:29, 60, 138, 160, 173, 175, and the kit's `SIMS.separate` (picture): the sieve is a frying pan. Use a sieve drawing.
- L8:15, 34, and the kit's `separate` closing line (consistency): "four mixtures, four ways to separate". Tasting shows the salt; it does not separate it.
- L8:57 (fact): "Only iron and steel are magnetic. A copper coin is not." Nickel and cobalt are magnetic too, and many copper-coloured coins are plated steel. Use copper wire.
- L8:201-202 (fact): a glass of water will not dry out in "a few days". Use sugar water on a saucer.

### Lesson 9
- L9:56 (fact): "Children think heavy things have more friction", but heavier blocks do have more. Say "Children think smooth surfaces have no friction."
- L9:182 (fact): "Without gravity, things would float away", the space-floating misconception. Say "Gravity keeps us on the ground."
- L9:41 (inclusion): "Everyone's feet point to the centre." Say "Wherever you stand, down points to the centre."

### Lesson 10
- L10:56 (key): "dark sunglasses" is keyed translucent, but you see shapes clearly through them. Use a paper lampshade.
- L10:53-54, L11:64, 82, 134 (picture): cling film, tissue and aluminium foil are all a toilet roll.
- L10:30, L1:53 (picture): a clear or glass bottle is shown as an opaque lotion bottle.
- L10:22 (fact): "the material, not the thickness", but thickness matters. Say "Thin does not always mean see-through: thin foil is opaque."
- L10:33, 202 (consistency): "a thin plastic bag" is explained as "milky". Say "a cloudy white plastic bag".
- L10:119, 198, 216 vs L13:89 (consistency): "as the Sun moves". Say "as the Sun seems to move".
- L10:104 (safety): the distractor "Look at the Sun" is corrected with no warning. Use "Ask a friend".

### Lesson 11
- L11:61, 134 (key): "steel spoon: magnetic", but most stainless cutlery is not. Use a steel bottle top or a paperclip.
- L11:53, 60, 81, 118, 158 (fact): "copper" coins are often steel inside and stick. Use copper wire or pipe.
- L11:96, 136 (fact): the door seal pulls against "the steel door". It pulls against the fridge's steel frame.
- L11:164 (fact): a magnet as "a piece of metal", but fridge magnets are not metal. Say "An object that pulls iron and steel."
- L11:156, 185, and the kit's `magnetPoles` (fact): "You cannot make them touch, however hard you push", and a home task uses fridge magnets. Say "They push back hard", and use two bar magnets at home.
- L11:195 (inclusion): "Most houses have more than ten." Say "Many homes have several."

### Lesson 12
- L12:82, 88 (fact): fossils "almost never found in very hard rocks like granite" implies hardness is the reason. Say "rocks that were once melted, like granite".
- L12:83, 89, 142 (safety): cliffs. Add "with a grown-up; never stand under a cliff".
- L12:24, 137, 161 (fact): "heated until the metal melts out", including gold. Say "heated, and the metal is separated out", and drop gold.
- L12:198-201 (safety): sorting recycling. Add "A grown-up handles glass and cans; wash your hands."
- L12:178 (inclusion): "Natural gas heats our water." Say "can heat water".

### Lesson 13
- L13:21 (fact): "The shadow across it curves, and that is a ball's shadow" invites the Earth's-shadow explanation of phases. Talk about the line between the lit and dark sides.
- L13:25 (fact): "the edge is a curve all the way round", but a disc's edge is too. Point to the curved line on a half Moon.
- L13:40 (key): the prediction key "Look bigger night by night" contradicts the conclusion that the Moon does not grow. Say "More of it looks lit, then less."
- L13:54, 59, 60, and the kit's `moonPhases` (fact): "on the right" holds only in the northern half of the world. Drop it, or say "as seen from the north".
- L13:65, 114, 126 (tag, consistency): an on-screen build is called a "physical model". Retag it, and keep 3TWSm.02 on the lamp-and-ball home task.
- L13:173, L3:196-197, L6:176, 186 (safety): outdoor tasks with no grown-up. Add "with a grown-up".
- L13:183-187 (fact): watching a boat's hull vanish at a lake is not observable by a child. Drop the task, or make it the lamp-and-ball model.

### Capitalised emphasis (language)
The voice spells these out:
- L1:159, 178
- L2:56, 93, 131
- L3:74
- L4:208
- L5:67
- L6:113
- L7:120-123
- L8:36, 141
- L9:22, 92, 130, 208
- L10:112
- L11:26, 134
- L12:78
- L13:70
- the kit's shadowSize label "BIG shadow"

### Kit (`lib/science.js`)
- `plantWarm` / `potSvg`: the cold plant is drawn in the dark (see Lesson 2). **Confirmed.**
- `forcemeterSvg`: the pointer moves 14 px per newton, but the ticks are 24 px apart, so "5 N" points near the 3 N mark. At 5 N the book is also drawn below the 300-px frame. **Confirmed.**
- `SCENES.globe` at L9:45-46: it only rotates the planet, with no person and no arrow to the centre, so the picture cannot show what the caption says.
- `SIMS.earthMoon`: "The Earth: a big ball, mostly water." Say "a big ball of rock, mostly covered in water."
- `FIGURES.insect`: two legs start on the abdomen, although L3:12 says all six join the thorax, and one wing reaches in front of the head.

Counts: fact 31, picture 12, safety 13, consistency 9, key 3, inclusion 7, tag 2, language 1 grouped entry (22 words), kit 5 own entries plus kit parts of 5 others. No question repeats Grade 1 or Grade 2.
