# Remaking the halving-joint film

Everything needed to rebuild *Marking Out and Cutting a Halving Joint*
(3:52, 1280×720) from nothing. Three parts: the **commands**, the
**scenes**, and the **script**.

Made on 2026-09-23. Narration bought once, film rendered once.

---

## 1. The commands

The tool is `tools/create-ehel-unit-lecture.js`. Two of these steps cost
money; the rest are free and exist so that nothing is bought until the script
and the pictures are settled.

```bash
A=src/prototypes/professor-adow-tvet/carpentry/tools-and-joints-app
S=marking-out-and-cutting-a-halving-joint
```

| # | command | cost | what it does |
| --- | --- | --- | --- |
| 1 | `node tools/create-ehel-unit-lecture.js --app $A --slug $S --dry` | free | character count, objective coverage, estimated length. Reads only the script — the scenes file need not exist yet. |
| 2 | `… --preview` | free | one still per beat plus both cards, as contact sheets. **The scenes file must exist.** |
| 3 | `… --narrate` | **BUYS** | buys every clip whose TEXT has changed, and stops. 3,097 characters over two passes. |
| 4 | `… --sample` | free | a frame 0.75 s after every spoken cue, on the **measured** timeline. |
| 4b | `… --sweep` | free | draws EVERY frame the render will draw, and refuses if one throws or paints outside the box. |
| 5 | `… --workers 4` | render | draws every frame and muxes. 6,956 frames, ~4 min on four browsers. |

**`--sweep` is the step this film paid for twice over.** It draws EVERY frame
the render will draw and refuses if one throws or paints outside the box, and
on the second pass it refused twice — an undefined variable three scenes
referenced (the render would have stopped at 72 s; `--dry` never draws, so it
passed) and a falling piece of waste that left the stage by 84 px between
cues, where `--sample` cannot look. It costs 5 seconds.

**Run them in that order.** Steps 1–2 loop until the script and pictures are
right; step 4 exists because the timeline before narration is an *estimate*
and after it is *measured*, and a mark that lands correctly on the estimate
can land wrongly on the real thing. Skipping step 4 is what cost the
Computing film a second render.

`--sample` is cheap enough to use freely: 28 s for 95 frames across the whole
film, 38 s for one scene (`--sample tools`).

A picture change after step 3 costs render time only — the clips are cached
by their text, so nothing is re-bought unless the words change.

### What each step produced here

```
pass 1 (10 scenes, 25 beats)
--dry       2,375 characters, estimated 3:19
--narrate   25 clips bought, measured 3:01 (the real voice runs shorter)
render      a501162d.mp4  8.31 MB

pass 2 (11 scenes, 30 beats — a safety scene and four added beats)
--dry       3,097 characters; 24 clips CACHED, 6 to buy (829 characters)
--narrate   6 clips bought, measured 3:52
--sweep     6,956 frames; refused twice, and both refusals were real
--sample    116 frames, 12 contact sheets
render      marking-out-and-cutting-a-halving-joint.38840040.mp4  11.20 MB
            marking-out-and-cutting-a-halving-joint.54b24e37.vtt  30 cues
            marking-out-and-cutting-a-halving-joint.7cfa3a81.jpg  poster
            6,956 frames drawn in 5.7 min by 4 browsers
```

Names are content-addressed: a re-render gets a different hash and therefore a
different path, so a CDN cannot serve a stale film from a cached path.

---

## 2. The scenes

Two files, and they divide cleanly: the **storyboard** says *what is said and
when*, the **scenes file** says *what is drawn*.

```
lecture-video/marking-out-and-cutting-a-halving-joint.json   the storyboard
tools/lib/film-scenes/adow-carpentry/halving-joint.js        the pictures (1,054 lines)
```

### The storyboard

```json
{
  "slug": "…", "title": "…", "subtitle": "Carpentry Tools & Joints",
  "framework": "…",
  "brand": { "name": "Professor Adow TVET", "mark": "A", "by": "…" },
  "renderer": { "scenes": ["tools/lib/ehel-film-marks.js",
                           "tools/lib/film-scenes/adow-carpentry/halving-joint.js"] },
  "objectives": [ ["ADOW-CJ-TJ.02.1", "…"], … ],
  "scenes": [ { "id": "…", "kind": "…", "heading": "…", "codes": […],
                "beats": [ { "say": "…", "art": { "at": { "<mark>": "<phrase>" } } } ] } ]
}
```

**`art.at` is the whole trick.** A mark is keyed to a *phrase in the
narration*, not to a timestamp, so the tool measures where that phrase falls
in the bought clip and the drawing changes as the word is spoken. `cue(beat,
"shoulder")` in the scenes file returns that moment.

`brand` was added on 2026-09-23 — without it the engine defaults to Ehel
Academy, and a Professor Adow film carried another school's crest on every
frame.

### The eleven scenes

| id | heading | marks |
| --- | --- | --- |
| title | Marking Out and Cutting a Halving Joint | cross, flush |
| joint | What a halving joint is | apart, half, close, flush |
| tools | Three tools | square, gauge, saw, teeth, back, rip |
| faces | Face side, face edge | board, faceside, faceedge, both, no |
| shoulder | The shoulder line | measure, line, edges, press, lift, bad |
| gauge | Half the thickness | set, lock, score, both, equal, error |
| waste | Mark the waste | hatch, safe |
| safety | Before you cut | cramp, shift, eyes, after, sharp, force |
| saw | Which side of the line | kerf, waste, angle, thumb, groove, good, line, bad, slack, far, lean |
| fit | Pare, and fit it dry | pare, clean, dry, tight, closed, diag |
| recap | The order of work | one, two, three, four, five, six, seven |

61 marks in all. Every one must be implemented by the scenes file, or it
simply never draws.

### The scenes file

It must define three things, or the engine refuses:

```js
var HUE   = { <scene id>: <colour>, … };     // each scene owns a colour
var KINDS = { <scene kind>: <function>, … }; // kind -> draw(scene, beat, t, i)
function titleMotif(o) { … }                 // the figure behind both cards
```

A draw function returns `svg(<string of SVG elements>)` on a **1168 × 440**
stage. The engine head supplies the primitives — `R C E L Pth G Tx Em`, the
palette `P`, the easings `on bump inAt popIn ease lerp clamp`, and the cue
helpers `cue sc sb tally`.

**Nothing is lifted from the lesson.** The Science films pass
`renderer.art: ["science"]` and the engine pulls the kit's own drawings in;
that works because those are pure functions of a state index. Carpentry's are
SVG *DOM* built at run time, and this engine emits SVG *strings* at a time
`t` — so the timber, try square, gauge, saw, chisels and joint are all drawn
fresh here, in the lesson's colours.

---

## 3. The script

3,097 characters, 30 clips. Also in `SCRIPT.txt`, which is what to read
before buying a voice — corrections are free before step 3 and cost the whole
narration after it.

The voice and its settings are fixed in the tool so one course does not sound
different from another: ElevenLabs `eleven_multilingual_v2`, voice
`XfNU2rGpBa01ckF309OY`, stability 0.60, similarity 0.82, style 0.18, speed
0.88.

```
[TITLE] Marking Out and Cutting a Halving Joint
   Two pieces of timber have to cross, and finish flush. This is how that is done.

[JOINT] What a halving joint is
   A halving joint. Each member loses exactly half its thickness where they meet.
   Take half off one, half off the other, and the two faces come together level. That is the whole idea, and everything else is accuracy.

[TOOLS] Three tools
   Three tools do this job. A try square, to prove a line square.
   A marking gauge, to score the same distance from a face every time.
   And a tenon saw: fine teeth for a clean cut across the grain, and a stiff back that keeps the cut straight. A rip saw is filed to cut along the grain, and would tear this shoulder to pieces.

[FACES] Face side, face edge
   Start with a prepared piece. Planed straight, planed square, gauged to size.
   One wide face is marked as the face side. One edge, square to it, is marked as the face edge.
   Every measurement from here comes off those two surfaces. Not off a sawn end, and not off whichever side is nearest.

[SHOULDER] The shoulder line
   Take the width from the piece that has to fit, not from the drawing.
   Square the shoulder line across the face, and down both edges. The stock of the square presses hard against the face edge.
   If the stock lifts even slightly, the line is not square, and neither is anything you cut to it.

[GAUGE] Half the thickness
   Set the gauge to half the thickness. Lock it, then measure it again before it touches the wood.
   Score the cheek line with the fence riding on the face side, on both members, from the one setting.
   One setting used twice keeps the halves equal. A gauge a millimetre out puts the joint two millimetres out, because the error lands on both.

[WASTE] Mark the waste
   Now hatch the waste. This is the last mark before the first cut that cannot be undone.
   It takes seconds, and it is why nobody who does it ever saws off the wrong half.

[SAFETY] Before you cut
   Before any cut, the work is cramped to the bench. Work that shifts under a saw is what makes a cut wander and a hand slip.
   Eye protection goes on before the tool is picked up, not after the first cut. Sawdust and a sprung splinter both go for the eyes.
   And the saw is sharp. A blunt one has to be forced, and force is what slips, so the sharp tool is the safer tool.

[SAW] Which side of the line
   The saw takes out a kerf about a millimetre wide. That millimetre has to come out of the waste.
   Start it at a low angle, thumb of the free hand against the blade above the teeth, and two or three backward strokes to cut a groove.
   Saw on the waste side and the line stays on the work. The joint is full size, and a shaving brings it home.
   Saw down the middle of the line and half the kerf comes out of the joint. It is slack, and nothing puts wood back.
   Watch the far face as well as the near one. A saw can lean and stay true on the line you are looking at while it runs off the one you are not.

[FIT] Pare, and fit it dry
   Pare the waste with a chisel, cutting from both faces towards the middle, so the far edge is supported and does not tear out.
   Then fit it dry. If it needs a mallet it is too tight: take a shaving off the cheek and try it again.
   It should go together by hand and stay there. Check both diagonals before any glue.

[RECAP] The order of work
   Face side and face edge. Shoulder squared, cheek gauged, waste hatched.
   Sawn on the waste side, pared to the line, fitted dry. In that order, every time.
```

*(One indented line is one beat and one clip. This block is `SCRIPT.txt`
verbatim, regenerated from the storyboard.)*

---

## 4. Wiring it into a lesson

The lecture step takes the three paths:

```python
step("lecture", "Unit lecture", ["ADOW-CJ-TJ.02.1", "ADOW-CJ-TJ.03.1"],
     {"video": {"src": "lecture-video/….38840040.mp4",
                "captions": "lecture-video/….54b24e37.vtt",
                "poster": "lecture-video/….7cfa3a81.jpg"},
      "parts": [ … the same lecture, drawn live, to go back through … ]})
```

The caption track is attached but **not** `default`: the film burns its
narration band into every frame, so a track on by default draws each sentence
twice.

`tools/upload-adow-to-bunny.js` carries `.mp4 .vtt .jpg`. The claude.ai
artifact preview cannot serve `.vtt` under any content type, so captions are
unavailable there only — the burned-in band means the words are on screen
regardless.

---

## What to change for a different film

1. Copy the storyboard, change `slug`, `title`, `objectives`, `scenes`.
2. Write a scenes file defining `HUE`, `KINDS`, `titleMotif` for the new
   `kind`s, implementing every mark the beats name.
3. Point `renderer.scenes` at it.
4. Run steps 1–5 above, in that order.

The `brand` block carries over unchanged for any Professor Adow film.
