# Brief: the Grade 4 Computing unit lecture films

13 films, one per lesson, written at the same time by 13 agents,
one agent per lesson. This brief is what keeps them one set. Read all of it
before writing anything. Asked for by the owner on 2026-09-24
("prepare grade 1 to 4 of Computing"), after the 43 Science films and the 31
Mathematics ones, all of which are live. THE NARRATION IS NOT YET APPROVED:
nothing may be bought until the owner has seen the approval sheet.

## Before anything else: what is different about Computing

Computing is built like Science - there is a lesson kit whose drawings you
borrow, and your lesson is `content/lesson-N.py`. Almost all of this brief
therefore carries over unchanged. Four things do not.

**This grade has 14 lessons and 14 film(s) to make.**

**A SCENE IS AN ORDERED LIST, and the order is the teaching.** The Computing
kit draws its everyday tasks from the list of step ids done so far, IN THE
ORDER THEY WERE DONE, painting later ids over earlier ones - so "shoes" then
"socks" draws the socks outside the shoes, and "top" before "jam" puts the jam
on top of the sandwich. That is not a quirk to work around; for half of Stage 1
it IS the lesson. If your film shows a wrong order, pass the wrong list and let
the drawing be wrong on purpose.

**Your objectives are Cambridge Primary Computing 0059.** The lessons cite 100
distinct codes across the four grades. Read the code's FULL wording in
`src/curriculum/cambridge-computing-0059.json` before you claim it. The
Mathematics set had five codes cited in full and half delivered - "estimate AND
divide", "adding AND SUBTRACTING", "both clockwise AND ANTICLOCKWISE" - and a
coverage count cannot see it. Where the lesson supports the missing half, add
it; where it does not, claim less.

**A film may name its own voice, and every film is now levelled to -16 LUFS**
(`tools/create-ehel-unit-lecture.js`, 2026-09-24). Do not set `voice` unless
you have a reason you can state: clips are cached per voice, so switching costs
a full re-narration of that film.

## What you are making

A film of **about 2¾ minutes** that plays in your lesson's **Unit lecture** step, above
the five parts the lesson's voice reads (`LESSON["lecture"]` in
`content/lesson-N.py`). It is that step's teaching done as a short animated
lecture: the same ideas, in the lesson's own words and examples, with the thing
being named moving on screen as it is said.

**The eight Grade 1 Science films are your worked examples.** They were made
with this tool, these marks and this art the day before, and they are live.
Read two of them before you write anything:

- `src/prototypes/ehel-academy/science/grade-1-app/lecture-video/parts-of-a-plant.json`
  and `tools/lib/film-scenes/computing-g1/parts-of-a-plant*.js`: a figure, a
  growing seed and the light test, all the lesson's own drawings;
- `.../pushes-pulls-and-floating.json` and
  `tools/lib/film-scenes/computing-g1/pushes-pulls-and-floating*.js`: a sim, the
  tank, arrows for pushes and pulls.

Their README, `science/grade-1-app/lecture-video/README.md`, says what their
checks caught. Every one of those faults can happen to you.

## Your files, and only these

| file | what it is |
| --- | --- |
| `src/prototypes/ehel-academy/computing/grade-4-app/lecture-video/<slug>.json` | the storyboard: the script and its cues |
| `tools/lib/film-scenes/computing-g4/<slug>.js` | your pictures (more parts if needed: `<slug>-2.js`, `<slug>-3.js`) |

`<slug>` is your lesson's slug, for example `flowering-plants`. Everything else is
read-only for you: the lesson files, the kit, the film tool, the engine, the
shared marks, the art adapter, and the other lessons' files, in every grade. If
a shared piece needs changing, do not change it: say so in your report.

**Write big files in parts.** A single write of more than about 300 lines can
fail. Split your pictures into `<slug>.js`, `<slug>-2.js` and so on, one or two
chapters each, and list them all in `renderer.scenes` in order. They are joined
into one script, so they share one scope.

## The script

### The storyboard

```json
{
  "_comment": "Storyboard for the Grade 4 Computing unit lecture film, Lesson N <Title>. Rendered by tools/create-ehel-unit-lecture.js. See lecture-video/BRIEF.md.",
  "slug": "<slug>",
  "lesson": N,
  "grade": 3,
  "stage": 3,
  "title": "<the lesson's title, exactly as app.config.json has it>",
  "subtitle": "Grade 4 Computing",
  "framework": "Cambridge Primary Computing 0059",
  "renderer": {
    "art": ["computing"],
    "skin": "brown",
    "scenes": ["tools/lib/ehel-film-marks.js", "tools/lib/film-scenes/computing-g4/<slug>.js"]
  },
  "objectives": [["3Bp.01", "<its official wording>"]],
  "scenes": [
    { "id": "title", "kind": "title", "codes": [], "beats": [
      { "say": "<a first line that opens on the idea>", "art": { "at": { "<name>": "<a phrase in that line>" } } },
      { "say": "<a second line>" }
    ] },
    { "id": "<chapter>", "kind": "<chapter>", "heading": "<a few words>", "codes": ["3Bp.01"], "beats": [ ... ] },
    { "id": "recap", "kind": "recap", "heading": "What you now know", "codes": ["3Bp.01", "..."], "beats": [ ... ] }
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
  node -e "const f=require('./src/curriculum/cambridge-computing-0059.json');const all=[].concat(...Object.values(f.objectivesByStage));for(const c of process.argv.slice(1)){const o=all.find(o=>o.code===c);console.log(c,o?o.text:'NOT FOUND')}" 3Bp.01 3Bs.01
  ```

  List the content objectives your lesson's docstring names (3Bs, 3Bp, 3Be, 3Cm, 3Cp, 3Cc, 3Pf, 3Ps, 3Pe, 3ESp, 3ESs and so
  on). List a TWS or SIC code only if a chapter really teaches it. Every listed
  code must be in some chapter's `codes`, and `--dry` says MISSING if one is
  not.
- **Chapters:** a spoken `title` chapter of two beats, then one teaching
  chapter per idea (four to six), then `recap`, three or four beats. Six to
  eight chapters in all. Each teaching chapter has a `heading` of a few words,
  and its `codes`.
- **`"skin": "brown"` is required** (see People, below).

### Length

**1,950 to 2,300 characters of narration**, in **28 to 36 beats**. That is
about 2:35 to 3:00 of film. `--dry` counts both. The estimate it gives runs about 5 to
10% long: the Grade 1 films measured 14.7 characters a second against the
estimate's 13.96.

A beat's line should be **30 to 120 characters**. A line under about 30
characters lasts under two seconds, and a picture that waits for it flicks past
(the Computing film's tablet chapter). If a line must be short, its picture
must not need time.

### Language: a Grade 4 child (about 9), and the lesson's own words

- **Write as the lesson writes.** Its five lecture parts average **9 words
  a sentence**. Keep yours at 10 or under on average, and no sentence over
  18.
- **Use the lesson's words and examples**: its animals, its objects, its
  experiment, its vocabulary (`LESSON["words"]`). Name a Cambridge term when the
  lesson does, and say what it means in the same sentence or the next.
- **Say nothing the lesson does not.** No new facts, no new examples that
  compete with the lesson's, and nothing that contradicts it. Where the lesson
  corrects a misconception (the "Children think..." lines in its `explain()`
  blocks), a film can correct it too, in the same terms. Before you claim that
  the lesson does or does not say something, search the whole lesson file for
  it and read every match: a search that shows nothing proves nothing until you
  have seen it show everything.
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
2. The art adapter (`"art": ["computing"]`): `ART`, the lesson kit's own drawings.
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

Every film's pictures share the page with nothing else, but give your own
top-level names a prefix of two or three letters from your slug (`pp` for
Parts of a Plant: `ppPotsCard`), as the Grade 1 films do, so they read as yours.

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

`"art": ["computing"]` gives you `ART`, sliced live out of
`computing/lesson-kit/lib/computing.js` — so you draw the lesson's own picture,
and if the lesson's drawing changes, yours changes with it. 175 pictures and 89
rules are exercised as the film page loads, so a drawing that throws is caught
there, before a single frame is drawn or a clip is bought.

**`ART.scene(name, ids)` — and the ids ARE the teaching.** Fourteen scenes. The
list is painted in order, later ids over earlier ones, and each scene LABELS ITS
OWN CONSEQUENCE:

```js
ART.scene("dress", ["socks", "shoes"])   // socks, then shoes over them
ART.scene("dress", ["shoes", "socks"])   // socks OVER the shoes — and it says so
```

"socks on the OUTSIDE of the shoes!", "the filling is on TOP of the sandwich!",
"no lid on: smoothie everywhere!", "no string yet: the wind took the kite!". So
a film showing a wrong order passes the wrong list and draws nothing extra — the
lesson's own drawing does the teaching. To build a scene up across a beat, pass
`ids.slice(0, n)`, the same growing prefix the lesson's own `paintScene` uses.
`internet` is the exception: it takes a number 0–3 rather than a list.

**`ART.figure(name)`** — the laptop and the tablet, carrying `data-part` and
`.outline`, exactly as Science's figures do.

**`ART.run(sprite, blocks)`** returns the lesson's OWN end state
(`[{x, scale, spin, hidden}]`), so grow's ×1.4-capped-at-2.2 and right's
stop-at-three come from the kit rather than from a copy in your film.
`ART.stage` draws the sprite stage.

**THE BIGGEST DIFFERENCE FROM SCIENCE, and it is structural rather than an
oversight: THERE IS NO `ART.sim`.** Science keeps its experiments in a top-level
object with `draw()` and `init()`, which is why a Science film can lift one
whole. Computing keeps nothing comparable — Robo's grid, Bitsy's board, the
spreadsheet, the network, the bar graph and the cipher wheel are each a closure
inside a `function someActivity(o)`, unreachable without running the activity,
and running one needs the lesson page's own element ids.

**So a Computing film draws the grid and the board ITSELF**, in the engine's
idiom, and takes only the RULES from the kit: Robo's directions and turns, the
Stage 3 rule machines, Bitsy's device semantics and LED patterns, and the
Stage 4 loops, sub-routines, branches, Caesar and Pigpen. Draw the picture;
borrow the logic. A grid you draw and a rule you borrow cannot disagree with the
lesson; a rule you retype can.

**`ART.foreign()` is a last resort and it looks like one.** The sprite stage is
HTML and the film carries no `computing.css`, so it renders as a bare emoji.
Prefer drawing it yourself.

One known fault in the lesson's own art, not yours to fix and not yours to work
around: the `internet` scene's caption is wider than its 320-unit viewBox at
states 2 and 3, so it clips when placed — it clips the same way on the lesson
page.

### People: brown

The owner, on 2026-09-19: "for human faces, make them brown color", and "you
can mix yellow and brown faces". So:

- Set `"skin": "brown"` in `renderer`. The film then draws every person, hand,
  ear and foot emoji that has no skin tone of its own with a brown one, in
  every frame (the engine head's `skin()`): `\u{1F9D2}` draws as a brown child.
  You do not add tones yourself.
- A tone the lesson chose is kept, so a lesson's own named people look as they
  do in the lesson. A smiley has no skin tone to take and stays yellow, which is
  fine.
- A group of people joined into one emoji (a family) is left as it is, and so
  are the family, bunny-ears and wrestlers emoji, which have no one-tone form:
  draw people one by one instead.
- Where you draw skin yourself, use the kit's skin colour `#C68642` (its body
  figure), or a darker brown.
- Look at your people in the sheets: every face you meant to be brown should
  be.

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
   opacity, so a dimmed part shows what is drawn behind it: where parts overlap,
   darken with a brightness filter instead (`style="filter:brightness(0.4)"` on
   the part's group).
4. **Words in a picture are few, and big enough.** The band already shows the
   sentence. Label with the lesson's words, at `lab mid` or larger.
5. **Check every emoji as it draws here.** This machine draws Windows' emoji:
   its paperclip has eyes, for example, and its canned food is a tin of
   tomatoes. If a thing must look exact (a magnet's two poles, a circuit), draw
   it, or use the lesson's drawing of it.
6. **No cartoon teacher and no mascot.** The film points with a line
   (`MK.leader`), which was the owner's decision on 2026-09-17.
7. **Nothing drawn outside the 1168 x 440 box**, and nothing left in it from
   the previous beat unless it belongs there.
8. **A picture must match what is said about it.** The Grade 1 review found a
   word card that called a girl blonde beside a picture of a girl with black
   hair, and a Sun drawn inside the cupboard of the light test. If the words
   name a colour, a side, a number or a size, the picture shows that.

## Checking, before you report

From the repository root:

```bash
T="node tools/create-ehel-unit-lecture.js --app src/prototypes/ehel-academy/computing/grade-4-app --slug <slug>"
$T --dry          # characters, beats, objective coverage, estimated length
$T --preview      # a still 70% through each beat, and both cards
$T --sample       # a frame just after each beat starts, 0.75 s after every cue, and just before each line ends
$T --sample <id>  # one chapter only (the other chapters' sheets are kept)
$T --sweep        # every frame the render will draw, drawn once: any that throws, and anything outside the box
```

All four are free and buy nothing. Stills land in
`%TEMP%\ehel-unit-lecture\<slug>\preview\` (with contact sheets,
`sheet-<n>.png`) and cue frames in `...\sample\sheet-<chapter>-<n>.png`.
**Open every sheet and look at it.** A passing command proves the page loaded,
not that the film is right. **Run `--sweep` before you report**: the Grade 1
round had a throw that lived 0.35 s after a cue, between every sampled frame,
and three overflows no sheet showed. For each frame, ask:

- Did the thing just named move or appear, and is it the right thing?
- Is anything clipped, overlapping, off the 1168 x 440 box, or over the words?
- Is every word readable, and every picture recognisable to an eight-year-old?
- Does a chapter's last frame show its action finished?

Fix and look again, until a pass finds nothing. Five rounds is plenty; if it is
still wrong after five, report what is wrong instead of going on.

About thirty-five films are being made on this machine at once, so a check can
be slow. If one stops on a time limit, run it again before deciding anything is
wrong with your film.

The timing is **estimated** until the owner approves and the narration is
bought. The real voice runs about 5 to 10% faster, so leave slack: do not cue
an action that needs two seconds into the last second of a line.

## What you must not do

- **Buy anything.** No `--narrate`, no render (not even `--draft`), no
  `--calibrate`, and do not run `tools/run-ehel-lecture-films.js`. Narration
  costs money per character and needs the owner's approval, for all the films
  at once.
- **Commit, push, deploy or rebuild.** No `git add`, no `git commit`, no
  `rebuild.sh`. The lead integrates all the films together.
- Edit anything that is not one of your files (see above), or set
  `CLAUDE_SCRATCH`: the tool already gives each film its own scratch folder.
- Keep any helper script of your own in one folder of the scratchpad, named
  for your slug, and nowhere else. The agents share one scratchpad, and in the
  Grade 1 round two agents' `film.sh` and `fast/` overwrote each other.

## Your report

Say, briefly and plainly:

- the characters, beats, chapters and estimated length from `--dry`;
- the objectives covered;
- one line per chapter: what the child sees move, and on which words;
- where your last contact sheets are;
- anything you could not get right, any shared piece that needs changing, and
  any question for the owner. If you found something wrong in the LESSON itself
  (a picture that does not match its words, a fact that contradicts another
  step), say so in `problems`: do not work around it silently, and do not fix
  it, because the lesson is not yours.

## Every cue you declare must be READ by a picture

A beat names phrases in `art.at`, and a scene reads one with
`sc(scene, k, "<key>")` or `cue(i, "<key>")`. A key you declare and never read
is a promise the film does not keep: nothing happens when those words are said.

**No check you run will tell you.** `--dry` counts characters and objectives.
`--sweep` draws every frame and finds none wrong, because none IS wrong. And
`--sample` will cheerfully shoot a frame at the dead cue's own moment — the
frame exists, it simply does not differ from the one before it, which is why
looking at your sample sheets does not catch this. It was found in a Grade 4
film by a reviewer that diffed two stills and noticed the brightening between
them was the ordinary beat fade.

So check it yourself, once, before you report:

```bash
node tools/check-ehel-film-cues.js computing 4
```

It lists every declared cue that no scene file names. Then either give the cue
something to do, or drop the key — and prefer giving it something to do, since
you declared it because the phrase deserved a picture.
