# Brief: the Grade 2 Mathematics unit lecture films

9 films, one per lesson, written at the same time by 9 agents,
one agent per lesson. This brief is what keeps them one set. Read all of it
before writing anything. The owner asked for Mathematics Grades 1 to 4 on
2026-09-23, beside the Science films, and approves the narration of all of them
at once, before any of it is bought.

## What you are making

A film of **about 2½ minutes** that plays in your lesson's **Unit lecture** step, in
place of the walkthrough the voice reads there now. It is that step's teaching
done as a short animated lecture: the lesson's own ideas, its own words and its
own pictures, with the thing being named moving on screen as it is said.

**The eight Grade 1 Science films are your worked examples** — same tool, same
marks, same engine, and they are live. Read one storyboard and its pictures
before you write anything:

- `src/prototypes/ehel-academy/science/grade-1-app/lecture-video/parts-of-a-plant.json`
- `tools/lib/film-scenes/science-g1/parts-of-a-plant*.js`

and their account of what the checks caught:
`science/grade-1-app/lecture-video/README.md`.

**The Maths film that exists already** is Grade 4's Shape and Measures
(`mathematics/grade-4-app/lecture-video/shape-and-measures.json`, drawn by
`tools/lib/ehel-math-lecture-scenes.js`). It was made with an older tool of its
own, so do not copy its code — but look at it, because it is what a Maths film
of this school looks like. It is not remade, and it is not yours.

## Your files, and only these

| file | what it is |
| --- | --- |
| `src/prototypes/ehel-academy/mathematics/grade-2-app/lecture-video/<slug>.json` | the storyboard: the script and its cues |
| `tools/lib/film-scenes/math-g2/<slug>.js` | your pictures (more parts if needed: `<slug>-2.js`, `<slug>-3.js`) |

`<slug>` is your lesson's slug, for example `tens-and-ones`. Everything else is
read-only for you: the lessons, the openers, the film tool, the engine, the
shared marks, the picture library, and the other lessons' films. If a shared
piece needs changing, do not change it: say so in your report.

**Write big files in parts.** A single write of more than about 300 lines can
fail. Split your pictures into `<slug>.js`, `<slug>-2.js` and so on, one or two
chapters each, and list them all in `renderer.scenes` in order. They are joined
into one script, so they share one scope.

## Where your lesson is

Mathematics is not built like Science. There is no lesson module to read: the
lesson is its page, and what the Unit lecture step teaches is authored in the
grade's opener, in a `WORK` entry keyed by your slug:

**`src/prototypes/ehel-academy/mathematics/grade-2-app/add-lesson-opener.py`** — your lesson's entry has
`about` (what the child will be able to do), `parts` (the three-part lecture the
step reads today, which your film replaces) and `words` (the lesson's Maths
words, with their meanings and uses).

**That is your starting point, and it is thin on purpose: about 390
characters.** A film of 1,800 to 2,100 characters cannot come out of it alone, so
read the lesson page itself — `src/prototypes/ehel-academy/mathematics/grade-2-app/<slug>.html` — for the examples,
the numbers, the questions and the pictures the child will actually meet, and
build the film out of those. Search it for the step headings and the questions;
do not try to read all 300 KB.

**Do not copy the lecture's sentences.** They are written for one voice reading
a paragraph: 22 words a sentence here, up to 31. A film line is
a short spoken sentence with a picture moving under it. Break them up.

## The script

### The storyboard

```json
{
  "_comment": "Storyboard for the Grade 2 Mathematics unit lecture film, <Title>. Rendered by tools/create-ehel-unit-lecture.js. See lecture-video/BRIEF.md.",
  "slug": "<slug>",
  "lesson": N,
  "grade": 2,
  "stage": 2,
  "title": "<the lesson's title, exactly as app.config.json has it>",
  "subtitle": "Grade 2 Mathematics",
  "framework": "Cambridge Primary Mathematics 0096",
  "renderer": {
    "art": ["math"],
    "skin": "brown",
    "scenes": ["tools/lib/ehel-film-marks.js", "tools/lib/film-scenes/math-g2/<slug>.js"]
  },
  "objectives": [["2Gg.01", "<its official wording>"]],
  "scenes": [
    { "id": "title", "kind": "title", "codes": [], "beats": [ ... two beats ... ] },
    { "id": "<chapter>", "kind": "<chapter>", "heading": "<a few words>", "codes": ["2Gg.01"], "beats": [ ... ] },
    { "id": "recap", "kind": "recap", "heading": "What you now know", "codes": ["..."], "beats": [ ... ] }
  ]
}
```

- **A beat is one sentence or two, and one narration clip.** `art.at` names
  phrases in that beat's `say`, exactly as written (case and all). Your pictures
  ask when each phrase is said with `sc(scene, k, "name")`. A phrase that is not
  in its line stops the page from loading, with the beat named.
- **`objectives`** are the Cambridge Primary Mathematics 0096 codes the film
  teaches, with their official wording. The lesson pages carry their codes in
  `data-objectives` / the objectives note; look the wording up rather than
  paraphrase it:

  ```bash
  node -e "const f=require('./src/curriculum/cambridge-mathematics-0096.json');const all=[].concat(...Object.values(f.objectivesByStage));for(const c of process.argv.slice(1)){const o=all.find(o=>o.code===c);console.log(c,o?o.text:'NOT FOUND')}" 2Gg.01
  ```

  Every listed code must be in some chapter's `codes`, and `--dry` says MISSING
  if one is not.
- **Chapters:** a spoken `title` chapter of two beats, then one teaching chapter
  per idea (four to six), then `recap`, three or four beats. Six to eight
  chapters in all.
- **`"skin": "brown"` and `"art": ["math"]` are both required.**

### Length

**1,800 to 2,100 characters of narration**, in **26 to 34 beats**: about 2:25 to 2:45 of film.
`--dry` counts both. Its estimate runs 5 to 10% long — the Grade 1 Science films
measured 14.7 characters a second against the estimate's 13.96.

A beat's line should be **30 to 120 characters**. A line under about 30
characters lasts under two seconds, and a picture that waits for it flicks past.

### Language: a Grade 2 child (about seven), and the lesson's own words

- Keep sentences at **9 words or under on average, and none over
  16**.
- **Use the lesson's own numbers and examples.** If the lesson counts to twenty
  with beans, the film counts beans. If it pays 35 shillings, the film pays 35
  shillings. Money is shillings, as the lessons write it.
- **Say nothing the lesson does not.** No new methods, no new notation, nothing
  that contradicts it. Before you claim the lesson does or does not teach
  something, search the whole page for it and read every match: a search that
  shows nothing proves nothing until you have seen it show everything.
- **Do the maths, twice.** Every number a film says must be right, and must
  match the picture beside it. A film that says "four and three make eight" is
  worse than no film. Check each sum, each count, each measurement, and check
  that the picture shows that many.
- **UK spelling and UK maths words**: maths, metre, centimetre, "take away",
  "share equally", "lots of", "times", "quarter to", as the lessons use them.
- Address the child as "you". Short questions work, answered in the next line.
- No stage directions, no "In this video". The film opens on the idea.

## The pictures

### How a film is put together

`tools/create-ehel-unit-lecture.js` builds one page from:

1. `tools/lib/ehel-film-engine-head.js`: the timeline, the cues, the svg helpers
   and the palette. **Read it**; it is short.
2. The picture library (`"art": ["math"]`): `ART`, below.
3. Your `renderer.scenes` files, in order: `tools/lib/ehel-film-marks.js` (`MK`)
   first, then yours.
4. `tools/lib/ehel-film-engine-tail.js`: the title and end cards, and `frame(t)`.

All of it runs in one scope. Your files must define `HUE` (a colour per chapter
id, plus `title` and `recap`), `KINDS` (one drawing function per chapter kind,
with `title: MK.titleKind({...})` and `recap: MK.recapKind([...])`) and
`titleMotif(o)`, an `<svg viewBox="0 0 360 360">` that sums up the lesson. The
Science example shows all three.

Give your own top-level names a prefix of two or three letters from your slug,
as the Science films do, so they read as yours.

### The space and the clock

- A teaching chapter returns `svg(inner)`: **one drawing, 1168 x 440**. Anything
  outside 0 to 1168 and 0 to 440 draws over the heading or the words.
- `t` is the film's clock in seconds. `BEATS[i]` has `start`, `end`, `dur` and
  `say`; `scene.first` is the chapter's first beat.
- **Everything is a pure function of `t`.** No `Date`, no `Math.random`, no
  timers, no CSS transition or animation. For scatter, use a fixed list.

The engine's helpers — `sc`, `cue`, `spokenEnd`, `inAt`, `on`, `popIn`, `bump`,
`tally`, `ease`, `lerp`, `clamp`, `breathe`, `crossfade`, `G`, `R`, `C`, `E`,
`L`, `Pth`, `Em`, `tr`, `around`, `Tx`, `P` — are listed in the head, with the
class names `Tx` takes.

### The Maths pictures: ART

**Mathematics has no lesson kit to draw from.** Its pages build ten frames,
number lines, coins and clocks as HTML and CSS, differently in each lesson, so
there is nothing to lift. `tools/lib/ehel-film-art-math.js` is the shared
library written for these films instead: the same manipulatives, drawn as SVG,
in the lessons' own colours. Use it for everything it covers, so that 31 films
count, measure and pay in one visual language.

| | |
| --- | --- |
| `ART.tenFrame(n, o)` | n counters in one or two frames of ten: `{frames, split, colour, label}` |
| `ART.counters(n, o)` | loose counters, in rows or in pairs: `{cols, pairs, markOdd, colour, label}` |
| `ART.numberLine(o)` | `{from, to, step, labelEvery, marks, jumps, label}`: ticks, markers and counting jumps |
| `ART.dice(faces, o)` | one die or several, 1 to 6 pips: `{total, label}` |
| `ART.coins(values, o)` | shilling coins and notes: `{total, unit, perRow, label}` |
| `ART.clock(h, m, o)` | an analogue face: `{quarters, minuteNumbers, digital, label}` |
| `ART.barModel(o)` | `{whole, parts, unknown, label}`: part-part-whole |
| `ART.array(rows, cols, o)` | dots in rows and columns: `{colour, markRow, markCol, label}` |
| `ART.fraction(o)` | `{shape: "bar" or "circle", parts, shaded, label}` |
| `ART.placeValue(o)` | `{value}` or `{hundreds, tens, ones}`, as flats, rods and cubes: `{lit, blocks, label}` |
| `ART.tally(n, o)` | tally marks in fives |
| `ART.barChart(o)` | `{bars, max, step, highlight, title, values}` |
| `ART.pictogram(o)` | `{rows, each, shape, title}`, with a key |
| `ART.balance(left, right, o)` | a pan balance: `{tilt, label}` |
| `ART.ruler(o)` | `{length, item, unit, label}`: a ruler and the thing measured |
| `ART.shape2d(kind, o)` | square, rectangle, triangle, circle, pentagon, hexagon: `{sides, corners, rightAngles, label}` |
| `ART.grid(o)` | `{cols, rows, fill, coords, points, label}`: area and coordinates |
| `ART.sequence(o)` | `{terms, step, arrows, label}`: a pattern with one term missing |
| `ART.spinner(o)` | `{parts, pointer, title}` |
| `ART.columnSum(o)` | `{a, b, op: "+" "-" or "x", carries, exchanges, answer, highlight, headings}`: a written calculation, its working computed, up to four columns |
| `ART.calendar(o)` | `{month, year, days, leap, start (0 = Monday), mark}`: one month; `start` is given, never worked out |
| `ART.compass(o)` | `{points: 4 or 8, facing, turn: {quarters, way}}`: the turn's arc drawn and where it lands |
| `ART.symmetry(o)` | `{kind, lines (a count, so they arrive one at a time, or a list), reflect}` |
| `ART.solid(kind, o)` | cube, cuboid, pyramid, cylinder, cone, sphere: `{faces, edges, vertices, counts}`, drawn see-through so hidden edges can be counted |
| `ART.jug(o)` | `{capacity, step, minorPer, level, unit, kind}`: a graduated jug or scale, its reading captioned |
| `ART.sortDiagram(o)` | `{shape: "venn" or "carroll", labels, items: [{label, a, b}]}`: the item says what it is, the picture places it |
| `ART.grid(o)` with `numbers: true` | the 100 square, 1 to 100 written in; `fill` still marks cells |
| `ART.place(svg, x, y, w, h)` | nest a drawing in a box of the film's 1168 x 440 space |
| `ART.C` | the lessons' light palette, by name |

The library's own header (`tools/lib/ehel-film-art-math.page.js`) is the exact
specification of every argument: read it before you draw.

Each returns a complete `<svg>` with its own viewBox; put it in your stage with
`ART.place(svg, x, y, w, h)`. To move one, draw it again each frame with the
value that frame needs. Anything the library does not cover, draw yourself with
the engine's helpers — and say so in your report, so the library can grow.

### People: brown

The owner, on 2026-09-19: "for human faces, make them brown color", and "you can
mix yellow and brown faces". `"skin": "brown"` in `renderer` does it: every
person, hand or ear emoji without a skin tone of its own is drawn brown, in
every frame. A tone the lesson chose is kept, and a smiley has no tone to take
and stays yellow, which is fine.

### Shared marks: MK

`tools/lib/ehel-film-marks.js` (its header lists them): `MK.tick`, `MK.cross`,
`MK.qmark`, `MK.pop`, `MK.ripple`, `MK.finger`, `MK.pic`, `MK.arrow`,
`MK.leader`, `MK.waves`, `MK.glow`, `MK.pill`, `MK.bubble`, `MK.list`, and the
two chapter kinds.

### Rules that keep a film right

1. **The thing named moves as it is named**, within half a second of the cue.
2. **An action finishes** inside its beat, or carries on into the next beat of
   the same chapter.
3. **Point at one thing at a time.**
4. **Words in a picture are few and big enough** (`lab mid` or larger). The band
   already shows the sentence.
5. **A number on screen is the number said**, and the picture shows that many.
   Count your own dots.
6. **No cartoon teacher and no mascot.** The film points with a line
   (`MK.leader`), which was the owner's decision on 2026-09-17.
7. **Nothing drawn outside the 1168 x 440 box**, and nothing left over from the
   previous beat unless it belongs there.

## Checking, before you report

From the repository root:

```bash
T="node tools/create-ehel-unit-lecture.js --app src/prototypes/ehel-academy/mathematics/grade-2-app --slug <slug>"
$T --dry          # characters, beats, objective coverage, estimated length
$T --preview      # a still 70% through each beat, and both cards
$T --sample       # a frame just after each beat starts, 0.75 s after every cue, and just before each line ends
$T --sweep        # every frame the render will draw: any that throws, and anything outside the box
```

All four are free and buy nothing. Stills land in
`%TEMP%\ehel-unit-lecture\<slug>\preview\` and cue frames in `...\sample\`.
**Open every sheet and look at it.** A passing command proves the page loaded,
not that the film is right. **Run `--sweep` before you report.** For each frame:

- Did the thing just named move or appear, and is it the right thing?
- Is anything clipped, overlapping, off the box, or over the words?
- Is every number readable, and is it the right number?
- Does a chapter's last frame show its action finished?

Fix and look again, until a pass finds nothing. Five rounds is plenty; if it is
still wrong after five, report what is wrong instead of going on.

Many films are being made on this machine at once, so a check can be slow. If
one stops on a time limit, run it again before deciding anything is wrong.

The timing is **estimated** until the owner approves and the narration is
bought, so leave slack at the end of a line.

## What you must not do

- **Buy anything.** No `--narrate`, no render (not even `--draft`), no
  `--calibrate`, and do not run `tools/run-ehel-lecture-films.js`.
- **Commit, push, deploy or rebuild.** No `git add`, no `git commit`, no opener
  run. The lead integrates all the films together.
- Edit anything that is not one of your files, or set `CLAUDE_SCRATCH`.
- Keep any helper script of your own in one scratchpad folder named for your
  slug.

## Your report

Say, briefly and plainly:

- the characters, beats, chapters and estimated length from `--dry`;
- the objectives covered;
- one line per chapter: what the child sees move, and on which words;
- where your last contact sheets are;
- any picture you had to draw yourself because the library lacks it;
- anything you could not get right, and any question for the owner. If you found
  something wrong in the LESSON itself — a sum that does not work, a picture
  that contradicts its words — say so in `problems`: do not work around it
  silently, and do not fix it, because the lesson is not yours.
