# The prompt this build was made from (improved)

The request arrived as one line, after the Grade 1 build had gone live:

> Build Grade 2 Global Perspectives on the same kit

Below is the version that states what that line assumes and the checks that
decide whether it was done. It is the Grade 1 prompt
(`../grade-1-app/PROMPT.md`) with the Stage-2-shaped parts stated, and it is
written so that Grade 3 can be asked for the same way.

---

## Build a Grade 2 Global Perspectives standalone lesson course on the Grade 1 kit

### What to build

A second grade directory, `global-perspectives/grade-2-app/`, holding only
`app.config.json` and `content/lesson-N.py`, built by the SAME
`global-perspectives/lesson-kit/` as Grade 1. Nothing in the kit is
grade-specific; the stage in the config decides which codes the builder
accepts and the gate demands.

**"On the same kit" means the kit may grow, and every growth is additive.**
Stage 2 asks for things Stage 1 did not, so the kit gains machines for them,
and the proof that a kit change is safe is not a byte-identical Grade 1
rebuild (every page embeds the kit's JS, so the bytes move) but a Grade 1
rebuilt through the new kit and driven to 100% again in the browser, every
step of every lesson, before Grade 2's own drive.

### The content: Cambridge Primary Global Perspectives 0838, Stage 2, all of it

- Stage 2 has **18** objectives, one per sub-strand, and each is a step ON
  from its Stage 1 twin. Author to the step, not to the topic: focused
  questions rather than basic ones (2Rq.01); LOCATING the part of a source
  that answers rather than talking about it (2Ri.01); interviews that find
  information AND opinions (2Rc.01); tables and bar charts beside pictograms
  (2Rf.01, 2Ad.01); different people knowing different things (2Ap.01);
  consequences on OTHERS (2Ac.01); a personal action for an issue affecting
  SELF (2As.01); SUGGESTING every relevant source (2Es.01); an opinion WITH
  reasons (2Ea.01); an IDEA as the contribution, not an action (2Fc.01,
  2Ft.01); a TASK carried out for a shared outcome (2Cc.01); a talk on a topic
  (2Mi.01); a RELEVANT question after listening (2Ml.01); and a look-back that
  asks which activity HELPED rather than which was liked (2Fl.01).
- Eight lessons by skill cluster, each on a topic a six-to-seven-year-old can
  talk about: the crowded playground; playtime interviews; our town; our
  classroom; sharing our planet; the vegetable patch and the assembly
  backdrop; a new pupil; and the course look-back.
- Every step names its codes; the builder refuses a code Stage 2 does not
  publish; the gate on the BUILT pages fails if any of the 18 is unreached.

### The machines Stage 2 adds to the kit

- **Locate rounds on a picture** (`source` with `rounds`): after exploring,
  "which part of the picture tells us X?" keyed by a spot.
- **A text source** (`text`): sentences as buttons; "which sentence tells
  us X?" keyed by line index.
- **Bars and tables** (`pictogram` with `display`): the same survey rows as a
  bar chart or a table of numbers, keys still computed.
- **Multi-source rounds** (`sources` with `multi`): tap EVERY relevant
  source before the reason; the builder requires two or more.
- **Two reasons** (`opinion` with `reasonsNeeded`).
- **Idea and task rounds** (`team`): the team is stuck and the child suggests
  the idea that gets it moving; the child carries out their own job's steps in
  order. `contrib` with `what: "idea"` asks whose IDEA was whose.
- **The talk board** (`know` with `mode: "talk"`): four things about the
  topic, then "Give my talk" reads them back as one talk.
- **The helped look-back** (`lookback` with `mode: "helped"`, drawn by the
  shell for every Stage 2+ lesson): "the part that helped me learn most was…".

### Definition of done

1. `build-lessons.py` builds 8 pages, 0 refusals, 18/18 at Stage 2.
2. `check-lessons.py` and `check-coverage.py` exit 0 for Grade 2 AND for the
   rebuilt Grade 1.
3. Every inline classic script parses under `node --check`.
4. The gate is mutation-tested on Grade 2, including the Stage 2 relationships
   (a locate round off the picture, a text line out of range, a multi-source
   round with one relevant source, an opinion round short of reasons, an idea
   round with no good idea, a task with duplicate step ids, a look-back
   carrying Stage 1's codes), each restored byte-identical.
5. Every step of all eight Grade 2 lessons AND all eight rebuilt Grade 1
   lessons is driven to completion in a browser; no console error but the
   five platform 404s; no overflow at 375px.
6. A README beside the build; the kit README updated with the new kinds.

### Out of scope

Deploying, routing, redeploying Grade 1 on the new kit, recorded narration,
Stage 3, a human reading of the content.
