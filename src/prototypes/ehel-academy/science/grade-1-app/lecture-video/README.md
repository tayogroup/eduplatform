# The unit lecture films: Science Grade 1, all eight lessons

Eight films, one in each lesson's **Unit lecture** step, above the five parts
the voice reads. Asked for by the owner on 2026-09-18 ("science grade 1 lessons
and units done together using parallel sessions or agents ... build the tool
that does it"). A film is not a new step, so no step moves and a learner's saved
record still lines up with the dots.

| lesson | film | length | lines | characters |
| --- | --- | --- | --- | --- |
| 1 Alive or Never Alive | `alive-or-never-alive` | 2:35 | 33 | 1,935 |
| 2 Parts of a Plant | `parts-of-a-plant` | 2:25 | 34 | 1,855 |
| 3 My Body and My Senses | `my-body-and-my-senses` | 2:20 | 34 | 1,820 |
| 4 What Is It Made Of? | `what-is-it-made-of` | 2:27 | 32 | 1,879 |
| 5 Pushes, Pulls and Floating | `pushes-pulls-and-floating` | 2:26 | 30 | 1,871 |
| 6 Sounds Near and Far | `sounds-near-and-far` | 2:29 | 31 | 1,867 |
| 7 Electricity and Magnets | `electricity-and-magnets` | 2:28 | 33 | 1,831 |
| 8 Our Earth, Our Sun | `our-earth-our-sun` | 2:33 | 34 | 1,925 |

Each film is `<slug>.json` here (the storyboard: its lines, its chapters, its
Cambridge codes and its cues) and its pictures in
`tools/lib/film-scenes/science-g1/<slug>*.js`. The rendered files are named by
content (`<slug>.<sha1 8>.mp4`, `.vtt`, `.jpg`), wired by `LESSON["video"]` in
`content/lesson-N.py` and listed in `app.config.json :: extraPages`.

The narration was bought on 2026-09-19, with the owner's go-ahead for all eight
at once: 261 lines, 14,997 characters, in the voice and settings of every film
so far, and later that morning one more line of 48 characters (the review
mistake below). The clips are cached in `.cache/ehel-lecture-audio/`, so a
picture change re-renders for nothing.

## How the eight were made at once

| step | what | time |
| --- | --- | --- |
| the tool | the runner, the art adapter, the shared marks, the brief, the workflow | ~35 min |
| the agents | one per lesson, in parallel, each writing its script and pictures and checking them with the free modes | 67 min |
| review | every line against its lesson, a still of every line, every frame swept; fixes | ~40 min |
| narration | 261 lines, one film at a time | 12 min |
| real-timing check | every film's line-end frames on the measured timeline | ~10 min |
| renders | two films at a time, five browsers each | ~30 min |

- **`.claude/workflows/ehel-lecture-films.js`** gives one agent per lesson the
  brief (`BRIEF.md`, in this folder) and exactly two files to own: the
  storyboard and its pictures. Nothing an agent can do buys narration, renders,
  commits or deploys. Its `revise` mode sends notes back to the same films; with
  `narrated: true` no line may change.
- **`tools/run-ehel-lecture-films.js`** runs the film tool over every film of a
  grade: `--dry` prints one approval sheet and a **fingerprint of every line of
  every film**; `--narrate` and `--render` refuse unless `--approved` is that
  fingerprint, so a line changed after the approval cannot be bought. It buys
  one film at a time (two films can share a line) and renders two at a time.
- **The lesson's own drawings** come into the films through
  `renderer.art: ["science"]` (`tools/lib/ehel-film-art-science.js`): the plant,
  the body, the seed, the sky, the globe, the ground, the pots, the tank, the
  magnet, the bell and the track are sliced out of `lesson-kit/lib/science.js`
  when a film is built, so the child sees in the film the picture they tap two
  steps later. A moved marker stops the build.
- **`tools/lib/ehel-film-marks.js`** holds the marks every film shares (tick,
  cross, arrow, sound waves, checklist) and the title and recap chapters, so
  the eight read as one set.

## What the checks found

**In the shared pieces, found by the agents** (all fixed before anything was
bought):

- `ART.dim` wrote its opacity in front of `data-part`, so ringing or dimming a
  part a second time threw. The throw lived 0.35 s after each part was named,
  between every sampled frame, and would have stopped a paid render. The Parts
  of a Plant agent found it by drawing every frame. That is why the tool now has
  `--sweep`: every frame drawn once, for throws and for anything outside the box.
- The recap cards overhung the frame by 2 px and their second line was 16 px,
  below the brief's own floor; the glow drew grey plates on dark cards; an arrow's
  head hung behind its tail while it grew; `--sample <chapter>` deleted the other
  chapters' sheets; and a cue named `start` or `end` overwrote the sampler's own
  frame.

**In the scripts, found in review:** Lesson 1 no longer claims 1TWSa.01, which
its film mentions and does not teach, and Lesson 2's hand-washing line uses the
lesson's own words.

**A review mistake, kept here because its shape recurs.** The lead changed
Lesson 5's boat line, "A boat floats because the water pushes up on it", on the
grounds that the lesson did not teach it, and the owner approved the changed
script. The lesson does teach it: it is word for word the lecture part read
under the film, in a chapter about pushes and pulls. The search that "showed"
otherwise was cut off by `head -3` one line before the match, and the silence
was read as absence. The agent's line and picture were restored the next
morning, the one clip (48 characters) bought, and the film rendered again. A
search that returns nothing proves nothing until you have seen it return
everything.

**In the lessons themselves, found by the agents.** Three were fixed on
2026-09-19, at the owner's request:

- Lesson 7 pictured kitchen foil as a fire extinguisher (U+1F9EF), the fridge
  as an ice cube (U+1F9CA) and the iron nail as a nut and bolt (U+1F529). There
  is no fridge or nail emoji, so the kit draws both now (`icon("fridge")`,
  `icon("nail")` in `lesson-kit/_icons.py`) and foil uses its existing
  `icon("foil")`. The ice cube and the bolt stay where the lesson means ice or a
  bolt.
- Lesson 6's `soundFar` drawing cut the child in half at six steps (the child's
  ink reaches x 324.8 in a 320-wide viewBox). It is 344 wide now, which is
  exactly how this film had reframed its own copy, so the film's frames are
  unchanged (compared at every 0.1 s) and it keeps only a guard on the width.
- Lesson 3's word card said "Nora has blonde hair", and the lesson's Nora has
  black hair. It says "This person has blonde hair" now, of the card's own
  picture.

Three more of the same kind were fixed the same day, also at the owner's
request:

- Lesson 3 says Nora wears glasses, and her picture had none. No emoji is a
  child in glasses, so she is the girl with the lesson's own glasses picture
  beside her (`NORA` in `content/lesson-3.py`), kept on one line with the
  glasses a little smaller, because as two plain emoji the card wrapped the
  glasses under her chin. This film shows her the same way now, in the friends
  lineup, the height table and the recap card. It was rendered again for
  nothing (every clip cached), and only its video file changed.
- Grade 2 Lesson 5 (a nail left outdoors) and Grade 3 Lesson 11 (the iron nail,
  twice, and its question) pictured a nail as a nut and bolt. They now use
  `icon("nail")`.
- Grade 3 Lesson 11 pictured a fridge door as an ice cube, in the item and its
  question. They now use `icon("fridge")`.

And the last four, also that day:

- Lesson 2's measuring step asked "How tall is the seedling?" and answered "The
  seedling is 3 cubes long", because the step named no height word and the
  renderer defaults to "long". Lesson 3's hand-span step did the same ("Amal is
  9 hand spans long"). Both set `"dim": "tall"` now.
- The two-pot drawing put its Sun at the top right, inside the light test's
  cupboard. `twoPots` takes `sunA` now, which puts the Sun over pot A, the pot
  by the window, and the light test sets it. The water test (Lesson 1) is
  unchanged: its film's frames were compared at every 0.1 s and are identical.
  The warm-and-cold test (Grade 3) is unchanged too, deliberately: there both
  pots get the same light, so neither side is the Sun's.
- "Your country", on the zoom from your house to the Earth, was the world-map
  emoji, which shows every continent, one step before "the whole Earth". It is
  the kit's own map of one land with a pin now (`icon("country")`), drawn at
  the emoji's size beside the house, the town and the Earth (`.zoompic`: a
  drawing in a picture box is otherwise drawn as a scene, 120 px and up), and
  the Our Earth film takes its zoom pictures from the lesson's `SCENES.zoom`
  instead of copying them.
- The shaker tin was the canned-food emoji, a tin of tomatoes on Windows. It is
  the kit's own shaker, a tin with shake lines (`icon("shaker")`). The other
  canned-food pictures are real tins (a steel lid, a food tin) and stay.

The Parts of a Plant, Sounds Near and Far and Our Earth films were rendered
again for these, for nothing (every clip cached).

## Remaking a film

```bash
R="node tools/run-ehel-lecture-films.js --app src/prototypes/ehel-academy/science/grade-1-app"
$R --dry                            # the approval sheet and its fingerprint; buys nothing
$R --sweep                          # every frame of every film; buys nothing
$R --sample                         # cue sheets, on the measured timeline now; buys nothing
$R --dry --films <slug>             # that film's own fingerprint: --films fingerprints the films it names
$R --render --approved <that fingerprint> --films <slug>
```

A picture change renders for nothing, and the new file gets a new hashed name:
update `LESSON["video"]` and `extraPages`, rebuild, and upload the film before
the page. A changed line changes the fingerprint and goes back to the owner.

## Known, and left: six dead cues

A beat names phrases in `art.at` - "when the voice says this, do that" - and a
scene reads one with `sc()` or `cue()`. Six keys in these eight films are
declared and read by nothing, so nothing happens when those words are said:
`lets` in Electricity and Magnets, `night` twice in Our Earth Our Sun, `droops`
in Parts of a Plant, and `little` and `long` in Pushes Pulls and Floating.

Found on 2026-09-24, well after these films went live, by a check written for
the Grade 4 set: `node tools/check-ehel-film-cues.js 1`.

**Nothing in the pipeline could see it.** `--dry` counts characters and
objectives. `--sweep` draws every frame and finds none wrong, because none IS
wrong. And `--sample` shoots a frame at the dead cue's own moment, so the
contact sheet looks complete - the frame simply does not differ from the one
before it.

They are left. No frame is wrong and no child sees anything broken; the cost is
a word that gains no picture, and these films are live, so fixing them would
mean re-rendering and re-uploading eight films for that. Grade 3's README has
the fuller account, and the rule is in every brief now, so films written after
this set check themselves - Grade 4 has zero across 1,127 declared cues.
