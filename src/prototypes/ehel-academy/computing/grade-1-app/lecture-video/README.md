# The unit lecture film: Computers Everywhere (Grade 1, Lesson 8)

The first Computing film, made on 2026-09-18 at the owner's request ("do the
same for computers-everywhere.html", after the Grade 4 Maths film). It plays in
the lesson's own **Unit lecture** step, above the five parts the voice reads,
exactly as Science's Bones and Muscles film does. It is not a new step, so no
step moves and a learner's saved record still lines up with the dots.

| | |
| --- | --- |
| storyboard | `computers-everywhere.json`: 9 chapters, 40 beats, 2,459 characters |
| tool | `tools/create-ehel-unit-lecture.js`, the tool for a film in any subject (it began as this film's) |
| pictures | `tools/lib/ehel-computing-lecture-scenes.js`, named by the storyboard's `renderer`, between the shared `ehel-film-engine-head.js` and `-tail.js`, over `ehel-film-base.css` |
| film | `computers-everywhere.16b93198.mp4`: 1280x720, 30 fps, 3:13 (192.53 s), 12.6 MB |
| captions | `computers-everywhere.8d4a4942.vtt`: 40 cues, offered and off by default (the film draws each sentence itself) |
| poster | `computers-everywhere.c2a3425a.jpg` |
| wired by | `LESSON["video"]` in `content/lesson-8.py`, and `extraPages` in `app.config.json` |

The narration was bought once, on 2026-09-18, with the owner's go-ahead: 40
clips, 2,459 characters, in the same voice and settings as the science and
maths films. It measured 3:13 against the 3:35 the character estimate gave,
because short Grade 1 sentences run faster than the estimate's per-beat
allowance. The clips are cached in `.cache/ehel-lecture-audio/`, so every
render since has bought nothing.

## Rendering it, and what each mode costs

The tool is the maths film's tool, which is the science film's; read
`science/grade-4-app/lecture-video/README.md` first. **`--narrate` and a
render buy narration from ElevenLabs, per character.** Every other mode is
free:

```bash
T="node tools/create-ehel-unit-lecture.js --app src/prototypes/ehel-academy/computing/grade-1-app --slug computers-everywhere"
$T --dry            # cost, coverage, length (measured once the clips are cached)
$T --preview        # one still per beat and both cards
$T --sample apps    # a frame 0.75 s after every spoken cue, as contact sheets (no ids: every chapter)
$T --draft          # the whole film in the free OS voice
$T --narrate        # BUYS the narration, then stops
$T --workers 5      # BUYS what is not cached, renders; frames drawn by 5 browsers at once
```

**The order that buys once and renders once** (the tool's header has it in
full): preview and sample until the pictures are right; ask the owner; then
`--narrate`; then `--sample` again, which now runs on the MEASURED timeline;
then render once. This film was the lesson: it was checked on the estimate,
rendered, found wrong on the real timing, and rendered again.

The tool became subject-neutral on 2026-09-18, and nothing about this film
changed. Its engine (the timeline, the cues, the chrome, the caption band, the
two cards) moved into `ehel-film-engine-head.js` and `-tail.js`. The pictures
stayed in `ehel-computing-lecture-scenes.js`. 59 frames spread across the whole
film came out byte-identical before and after the split.

A five-browser render of this film took 6 minutes: 4 drawing frames, 2
encoding. The one-browser render took 19. Compared frame by frame, 5,629 of
5,776 frames were identical. The other 147 differed only at text edges, by
at most 2,129 pixels. Drawn again in fresh browsers, those frames came out
identical every time, and the SHIPPED one-browser render has such frames too.
So it is Chromium's text antialiasing drifting over a long run, not the
parallel drawing. The live film was not replaced; it is the one below.

Three things are different from the maths tool:

- **An option it does not know is refused** before anything runs, so a
  mistyped `--dyr` cannot fall through to a paid render.
- **It names its output by content**: `computers-everywhere.<sha1 8>.mp4`, and
  the same for the `.vtt` and `.jpg`. The CDN keeps a media path for a year, so
  a re-render under the old name would never reach a learner who had already
  played the old one (the maths README, "New names for a new render"). Naming
  by hash from the first render means there is no rename step to forget. The
  tool prints the three names for `LESSON["video"]` and `extraPages`.
- **A `--draft` render says so in its names** (`computers-everywhere.draft.<hash>.mp4`)
  and the kit's `build-lessons.py` refuses any film whose name contains
  `.draft.`, so the free OS voice cannot be wired into a lesson by accident.

Clips are cached by a hash of the voice, its settings and the words, so a
picture change re-renders for nothing. Only a changed line is bought again.

## What it teaches, chapter by chapter

Every 1CS objective has a chapter, and every chapter shows the thing it names
MOVING as the word is said (`art.at` cues, the maths film's system; a phrase
missing from its line stops the render):

| chapter | objective | what moves |
| --- | --- | --- |
| What is a computer? | 1CS.01 | a laptop runs its programs; a desktop, laptop, tablet and smartphone line up and are ticked "All four are computers" |
| What are computers for? | 1CS.01 | the laptop's screen does each job as it is named: Grandma's call rings, a film plays, a ball game, a rainbow painted arc by arc and a tune, "lions" typed and found; then a washing machine takes its place with its computer inside |
| One computer, many programs | 1CS.02 | a finger taps each of the lesson's six programs on one tablet and each opens and works (Paint's dots, the ball game, Writing types a story, Videos, Call Grandma, Search); "app" is named as a program on a tablet |
| Information goes in | 1CS.03 | letters travel down the keyboard's cable, a click from the mouse, a voice from the microphone, a photo from the camera, a tap from the touchscreen |
| Information comes out | 1CS.04 | "hello" and a picture reach the screen, notes leave the speaker, a page prints, a light flashes; the touchscreen sends a tap in and gets a picture back |
| Computers hiding inside | 1CS.05 | the lesson's own sort fills a grid as each thing is named; the washing machine runs fill, wash, spin; the traffic lights change; the spoon, book and candle are scanned and hold nothing |
| Robots | 1CS.06 | a robot runs a three-block program; a factory arm welds a car; a robot vacuum cleans and docks; a rover drives on Mars and takes a picture; hospital, warehouse and sea robots; most robots do not look like people; a bicycle is not one |
| What you now know | all six | six cards light as they are said |

## Faults the stills caught before anything was bought

The free `--preview` stills and a cue sampler (a frame 0.75 s after every
named phrase) were read before the narration was bought. They found:

- **Every coloured word was white.** The `.lab` classes set `fill` and
  `font-size` in CSS, and a stylesheet rule beats an SVG presentation
  attribute, so the job words, INPUT and OUTPUT, and the music notes all drew
  in the default. `Tx()` now writes both into `style`, which wins.
- **The robot never finished its program.** It started on "move and do a job",
  a second before the line ended, so the chapter cut away mid-move. It now runs
  from "Its program", a block every 0.6 s.
- **The car arrived from outside the factory.** The SVG draws with
  `overflow: visible`, so the car sliding in on the belt showed in the margin.
  The factory is clipped to its room.
- **The washing machine's "computer" label ran under the grid**, and the
  speaker's notes floated up into the screen above it.

## Faults only the real render could show

The preview estimates every clip's length; the render measures it. Pulling
frames out of the first MP4 at the real cue times (not the preview's) found
that the tablet chapter's programs flicked past: "Open Paint, and you can
draw." is 1.8 seconds, so a program that waited for "you can draw" and closed
before the next tap drew for half a second. Now a tapped program works from
the moment it opens and stays open until just before the next tap; the three
named in one line ("Videos plays films. Call rings Grandma. Search finds
things out.") switch straight from one to the next; and Search stays open
into the next line so its result can be read. The robot vacuum reaches its
charger before the chapter moves on. The film was rendered again, free.

**Check a film against its measured timeline, not the estimate.** The cue
sampler takes a `FILM_SRC` for exactly this: the render's own `film.html`.

## Faults only the page could show

Playing the film inside the built lesson found what no still could:

- **Two voices at once.** "Next part" reads the part aloud, so pressing it
  mid-film had the lesson's voice talking over the film's. A part read aloud
  now pauses the film, as the film starting already stopped the lesson's
  voice (`quiet()` in `lecture()`).
- **The recorded drive's replica left out `extraPages`**, so the poster
  404'd there while it would load live. `drive-lessons.mjs` now copies them,
  as `deploy.mjs` uploads them.

Checked in the page: the film sits in step 2 of 18; it pauses when the child
leaves the step and keeps its place when they come back; moving between parts
keeps the same `<video>` playing; the end of the film writes "You have watched
the whole lesson" and ticks the step's dot.

## Deploying it

Media first, then the page: an edge read of a media path that does not exist
yet can cache a 404 for a year. Deploys are run by the owner; see the upload
command in the commit that wired it.
