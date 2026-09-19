# Brief: the Grade 1 Science unit lecture films

Eight films, one per lesson, written at the same time by eight agents, one
agent per lesson. This brief is what keeps them one set. Read all of it before
writing anything. The owner asked for the eight together on 2026-09-18, and
approves the narration of all eight at once, before any of it is bought.

## What you are making

A film of about **2½ minutes** that plays in your lesson's **Unit lecture**
step, above the five parts the lesson's voice reads (`LESSON["lecture"]` in
`content/lesson-N.py`). It is that step's teaching done as a short animated
lecture: the same ideas, in the lesson's own words and examples, with the
thing being named moving on screen as it is said.

The Computing Grade 1 film is the worked example of the whole method:
`computing/grade-1-app/lecture-video/computers-everywhere.json` (its script)
and `tools/lib/ehel-computing-lecture-scenes.js` (its pictures). Read its
README, `computing/grade-1-app/lecture-video/README.md`, for the faults its
checks caught. Every one of them can happen to you.

## Your files, and only these

| file | what it is |
| --- | --- |
| `src/prototypes/ehel-academy/science/grade-1-app/lecture-video/<slug>.json` | the storyboard: the script and its cues |
| `tools/lib/film-scenes/science-g1/<slug>.js` | your pictures (more parts if needed: `<slug>-2.js`, `<slug>-3.js`) |

`<slug>` is your lesson's slug, for example `alive-or-never-alive`. Everything
else is read-only for you: the lesson files, the kit, the film tool, the engine,
the shared marks, the art adapter, and the other seven lessons' files. If a
shared piece needs changing, do not change it: say so in your report.

**Write big files in parts.** A single write of more than about 300 lines can
fail. Split your pictures into `<slug>.js`, `<slug>-2.js` and so on, one or two
chapters each, and list them all in `renderer.scenes` in order. They are joined
into one script, so they share one scope.

## The script

### The storyboard

```json
{
  "_comment": "Storyboard for the Grade 1 Science unit lecture film, Lesson N <Title>. Rendered by tools/create-ehel-unit-lecture.js. See lecture-video/BRIEF.md.",
  "slug": "<slug>",
  "lesson": N,
  "grade": 1,
  "stage": 1,
  "title": "<the lesson's title, exactly as app.config.json has it>",
  "subtitle": "Grade 1 Science",
  "framework": "Cambridge Primary Science 0097",
  "renderer": {
    "art": ["science"],
    "scenes": ["tools/lib/ehel-film-marks.js", "tools/lib/film-scenes/science-g1/<slug>.js"]
  },
  "objectives": [["1Bp.01", "Identify living things and things that have never been alive."]],
  "scenes": [
    { "id": "title", "kind": "title", "codes": [], "beats": [
      { "say": "Look at a goat, and look at a stone.", "art": { "at": { "goat": "a goat", "stone": "a stone" } } },
      { "say": "One of them is alive. One was never alive." }
    ] },
    { "id": "alive", "kind": "alive", "heading": "What alive means", "codes": ["1Bp.01"], "beats": [ ... ] },
    { "id": "recap", "kind": "recap", "heading": "What you now know", "codes": ["1Bp.01", "..."], "beats": [ ... ] }
  ]
}
```

- **A beat is one sentence or two, and one narration clip.** `art.at` names
  phrases in that beat's `say`, exactly as written (case and all). Your pictures
  ask when each phrase is said with `sc(scene, k, "name")`. A phrase that is not
  in its line stops the page from loading, with the beat named.
- **`objectives`** are the Cambridge 0097 codes the film teaches, with their
  official wording. Look it up; do not paraphrase it:

  ```bash
  node -e "const f=require('./src/curriculum/cambridge-science-0097.json');const all=[].concat(...Object.values(f.objectivesByStage));for(const c of process.argv.slice(1)){const o=all.find(o=>o.code===c);console.log(c,o?o.text:'NOT FOUND')}" 1Bp.01 1Bp.02
  ```

  List the content objectives your lesson's docstring names (1Bp, 1Bs, 1Cm,
  1Pf, 1ESp and so on). List a TWS or SIC code only if a chapter really teaches
  it. Every listed code must be in some chapter's `codes`, and `--dry` says
  MISSING if one is not.
- **Chapters:** a spoken `title` chapter of two beats, then one teaching
  chapter per idea (four to six), then `recap`, three or four beats. Six to
  eight chapters in all. Each teaching chapter has a `heading` of a few words,
  and its `codes`.

### Length

**1,800 to 2,100 characters of narration**, in **26 to 34 beats**. That is
about 2:25 to 2:45 of film. `--dry` counts both. The estimate it gives runs
about 10% long: the Computing film estimated 3:35 and measured 3:13.

A beat's line should be **30 to 110 characters**. A line under about 30
characters lasts under two seconds, and a picture that waits for it flicks past
(the Computing film's tablet chapter). If a line must be short, its picture
must not need time.

### Language: a Grade 1 child, and the lesson's own words

- **Write as the lesson writes.** The five lecture parts average **7 words a
  sentence**. Keep yours at 8 or under on average, and no sentence over 14.
- **Use the lesson's words and examples**: its animals, its objects, its
  experiment, its vocabulary (`LESSON["words"]`). Name a Cambridge term when the
  lesson does (`material`, `force`, `source`), and say what it means in the
  same sentence or the next.
- **Say nothing the lesson does not.** No new facts, no new examples that
  compete with the lesson's, and nothing that contradicts it. Where the lesson
  corrects a misconception (the "Children think..." lines in its `explain()`
  blocks), a film can correct it too, in the same terms.
- **UK spelling** (colour, centre, metre), as the lessons use.
- Address the child as "you". Short questions work ("Is it alive?"), followed
  by the answer in the next line.
- No stage directions, no "In this video". The film opens on the idea.

### What to teach

Start from `LESSON["lecture"]`: its five parts are what this step teaches, and
the film should cover the same ground in the same order, one chapter per part
or per objective. Then read the rest of the lesson (its steps, experiments and
words) for the pictures: the film should show the experiment the child is about
to do, the objects they will sort, the figure they will tap.

## The pictures

### How a film is put together

`tools/create-ehel-unit-lecture.js` builds one page from:

1. `tools/lib/ehel-film-engine-head.js`: the timeline, the cues, the svg helpers
   and the palette. **Read it**; it is short.
2. The art adapter (`"art": ["science"]`): `ART`, the lesson kit's own drawings.
3. Your `renderer.scenes` files, in order: `tools/lib/ehel-film-marks.js` (`MK`)
   first, then yours.
4. `tools/lib/ehel-film-engine-tail.js`: the title and end cards, and `frame(t)`.

All of it runs in one scope. Your files must define:

- `HUE`: a colour for each chapter id, and for `title` and `recap`. Use the
  palette: `P.teal`, `P.gold`, `P.plum`, `P.accent`, `P.good`, `P.blue`. Give
  neighbouring chapters different colours, and `title` and `recap` `P.teal`.
- `KINDS`: `{ kind: function (scene, beat, t, i) -> markup }`, one per chapter
  kind. `title: MK.titleKind({ sub: [two or three short lines] })` and
  `recap: MK.recapKind([...cards])` draw those two chapters the same way in
  every film. Use them.
- `function titleMotif(o)`: an `<svg viewBox="0 0 360 360">` that sums up the
  lesson. It is drawn large in the title chapter and faintly behind both cards.

### The space and the clock

- A teaching chapter returns `svg(inner)`: **one drawing, 1168 x 440**. The
  chapter heading sits above it and the spoken line's band below it, and the
  svg does not clip, so **anything outside 0 to 1168 and 0 to 440 draws over
  the heading or the words**. Keep everything inside.
- `t` is the film's clock in seconds. `BEATS[i]` has `start`, `end`, `dur` and
  `say`. `scene.first` is the index of the chapter's first beat.
- **Everything is a pure function of `t`.** No `Date`, no `Math.random`, no
  timers, no `requestAnimationFrame`, no CSS transition or animation. Frames are
  drawn in any order, in several browsers at once, and each must be the same
  every time. For scatter, use a fixed list of numbers.

The engine, in short (all in the head):

| | |
| --- | --- |
| `sc(scene, k, "name")` | when the phrase `name` in the chapter's k-th beat begins; null if not named |
| `cue(i, "name")`, `spokenEnd(i)` | the same by beat index; when beat i's voice stops |
| `inAt(t, at, span)` | 0 to 1, eased, from `at` over `span` seconds |
| `on(t, at, span)` | the same, but 0 when `at` is null |
| `popIn(t, at, span)` | 0, then an overshoot to 1.1, settling on 1 |
| `bump(t, at, span)` | 0 to 1 and back to 0: a flash |
| `tally(t, at, n, span)` | how many of n have appeared, counting from `at` over `span` |
| `ease`, `lerp`, `clamp`, `breathe(t)` | |
| `crossfade(t, i, scene, draw)` | the previous beat's picture fading out as this beat's fades in |
| `G`, `R`, `C`, `E`, `L`, `Pth`, `Em`, `tr`, `around` | svg: group, rect, circle, ellipse, line, path, emoji, translate, scale about a point |
| `Tx(x, y, text, cls, anchor, extra)` | text. `cls` is `"lab"` plus a size (`huge`, `big`, `mid`, `small`) and a colour (`muted`, `hue`, `gold`, `good`, `bad`, `dark`); a `fill` or `font-size` in `extra` wins over the class |
| `P` | the palette: `ground`, `card`, `cell`, `line`, `ink`, `muted`, `teal`, `gold`, `plum`, `accent`, `good`, `bad`, `blue`, `grass`, `sky`, `paper` |

### The lesson's own drawings: ART

**Where the lesson draws something, the film draws the lesson's drawing**, so
the child sees in the film exactly what they tap two steps later. The adapter
lifts these out of `lesson-kit/lib/science.js` when the film is built:

| | |
| --- | --- |
| `ART.figure("plant")`, `ART.figure("body")` | the tap figures. Parts: plant `roots stem leaves flower`; body `head eyes ears nose mouth tummy arms hands legs feet` |
| `ART.scene("plant", 0..5)` | a seed growing: seed, root, shoot, leaves, taller, flower |
| `ART.scene("ground", 0..3)` | digging down: grass, soil, stones, rock |
| `ART.scene("globe", turn)` | the Earth from space, turned `turn` degrees |
| `ART.scene("sky", 0..4)` | night and stars, sunrise in the east, midday, the Sun as a star, sunset in the west |
| `ART.pots(a, b, day, opts)` | two potted plants, each 0 (fresh) to 4 (drooped): `{sun, labelA, labelB, darkB, coldB}` |
| `ART.tank(pic, y)` | the float-or-sink tank, the thing dropped `y` px: `ART.TANK.float`, `ART.TANK.sink` |
| `ART.magnet(pic, reach, jump)` | the magnet slid `reach` (0 to 1) of its way, the thing jumped to it by `jump` (0 to 1) |
| `ART.sim("soundFar", "draw", steps)` | the bell, the child `steps` (0 to 6) steps away |
| `ART.sim("pushBall", "draw", x, label, thing)` | a ball `x` steps along the marked track |
| `ART.sim("sunShade", "draw", hour, a, b)` | two cups with thermometers, in the sun and in the shade |
| `ART.place(svg, x, y, w, h)` | puts one of those drawings into a box of your 1168 x 440 space, scaled to fit |
| `ART.ring(svg, part, colour, width)`, `ART.dim(svg, part, opacity)` | a figure part's own tap outline; a part faded |
| `ART.icon(pic)`, `MK.pic(cx, cy, size, pic)` | an emoji, or the kit's own drawing where the emoji is too new for old devices, as the lesson shows it |

To move one of them, draw it again for each frame with the value that frame
needs: `ART.place(ART.tank("\u{1FAB5}", lerp(0, ART.TANK.float, on(t, sink, 1.1))), 400, 20, 380, 309)`.

The lesson's drawings have light backgrounds. On the dark stage they are
cards: place each one whole, with room around it, and never crop one.

### Shared marks: MK

`tools/lib/ehel-film-marks.js` (its header lists them): `MK.tick`, `MK.cross`,
`MK.qmark`, `MK.pop`, `MK.ripple` (a tap), `MK.finger`, `MK.pic`, `MK.arrow` (a
push or a pull), `MK.leader` (a line from a label to a thing), `MK.waves`
(sound), `MK.glow`, `MK.pill` (a word in a box), `MK.bubble` (a question),
`MK.list` (rows that tick or cross as they are said), and the two chapter kinds.

### Rules that keep a film right

These are the faults the earlier films shipped, or nearly shipped:

1. **The thing named moves as it is named.** Every idea the voice names gets a
   cue, and something visibly changes within half a second of it.
2. **An action finishes.** An action that starts on a cue must finish inside
   its beat, or carry on into the next beat of the same chapter. The Computing
   film's robot started "move and do a job" a second before its line ended and
   was cut off mid-move.
3. **Point at one part at a time.** Ring only the part being named, and show
   the parts already named by brightness (`ART.dim` the rest to about 0.35).
   The Bones and Muscles film stacked the lesson's outlines, one per bone, until
   seven boxes sat over the skeleton and read as debug boxes. `ART.dim` is
   opacity, so a dimmed part shows what is drawn behind it: where parts overlap
   (the plant's flower over its leaves), darken with a brightness filter instead
   (`style="filter:brightness(0.4)"` on the part's group).
4. **Words in a picture are few, and big enough.** The band already shows the
   sentence. Label with the lesson's words, at `lab mid` or larger.
5. **Check every emoji as it draws here.** This machine draws Windows' emoji:
   its paperclip `📎` has eyes, for example. If a thing must look exact (a
   magnet's two poles, a circuit), draw it.
6. **No cartoon teacher and no mascot.** The film points with a line
   (`MK.leader`), which was the owner's decision on 2026-09-17.
7. **Nothing drawn outside the 1168 x 440 box**, and nothing left in it from
   the previous beat unless it belongs there.

## Checking, before you report

From the repository root:

```bash
T="node tools/create-ehel-unit-lecture.js --app src/prototypes/ehel-academy/science/grade-1-app --slug <slug>"
$T --dry          # characters, beats, objective coverage, estimated length
$T --preview      # a still 70% through each beat, and both cards
$T --sample       # a frame just after each beat starts, 0.75 s after every cue, and just before each line ends
$T --sample alive # one chapter only (the other chapters' sheets are kept)
$T --sweep        # every frame the render will draw, drawn once: any that throws, and anything outside the box
```

All four are free and buy nothing. Stills land in
`%TEMP%\ehel-unit-lecture\<slug>\preview\` (with contact sheets,
`sheet-<n>.png`) and cue frames in `...\sample\sheet-<chapter>-<n>.png`.
**Open every sheet and look at it.** A passing command proves the page loaded,
not that the film is right. **Run `--sweep` before you report**: the first
round of these films had a throw that lived 0.35 s after a cue, between every
sampled frame, and three overflows no sheet showed. For each frame, ask:

- Did the thing just named move or appear, and is it the right thing?
- Is anything clipped, overlapping, off the 1168 x 440 box, or over the words?
- Is every word readable, and every picture recognisable to a six-year-old?
- Does a chapter's last frame show its action finished?

Fix and look again, until a pass finds nothing. Five rounds is plenty; if it is
still wrong after five, report what is wrong instead of going on.

The timing is **estimated** until the owner approves and the narration is
bought. The real voice runs about 10% faster, so leave slack: do not cue an
action that needs two seconds into the last second of a line.

## What you must not do

- **Buy anything.** No `--narrate`, no render (not even `--draft`), no
  `--calibrate`, and do not run `tools/run-ehel-lecture-films.js`. Narration
  costs money per character and needs the owner's approval, for all eight films
  at once.
- **Commit, push, deploy or rebuild.** No `git add`, no `git commit`, no
  `rebuild.sh`. The lead integrates all eight films together.
- Edit anything that is not one of your files (see above), or set
  `CLAUDE_SCRATCH`: the tool already gives each film its own scratch folder.
- Keep any helper script of your own in one folder of the scratchpad, named
  for your slug, and nowhere else. The agents share one scratchpad, and in the
  first round two agents' `film.sh` and `fast/` overwrote each other.

## Your report

Say, briefly and plainly:

- the characters, beats, chapters and estimated length from `--dry`;
- the objectives covered;
- one line per chapter: what the child sees move, and on which words;
- where your last contact sheets are;
- anything you could not get right, any shared piece that needs changing, and
  any question for the owner.
