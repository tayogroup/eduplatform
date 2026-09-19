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

Not fixed, and each is the lesson's to decide: Lesson 3 says Nora wears glasses
and her picture has none; Lesson 2's measure step says "3 cubes long" where it
asks how tall; `twoPots` draws the Sun on the cupboard side; the "your country"
zoom picture is a world map; the shaker tin draws as a tomato tin on Windows.
Grade 2 Lesson 5 and Grade 3 Lesson 11 picture a nail as a nut and bolt too,
and Grade 3 Lesson 11 a fridge door as an ice cube.

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
