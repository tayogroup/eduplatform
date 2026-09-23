# Professor Adow TVET — setting up a second school on eduplatform

Decided with the owner on 2026-09-23:

| | |
| --- | --- |
| certification | **in-house certificates for now**, designed so an external framework can be mapped on later |
| delivery | **blended** — online theory + competency sign-off at a physical centre |
| separation | **a fully separate school** — own domain, own storage zone, own consumer record |
| scope | 6 departments, 22 courses (listed at the end) |

Nothing for TVET exists in the repo yet. This is greenfield, and the point of
this document is that it does **not** have to be: almost every piece of
plumbing a second school needs was built once already for Quraan Academy.

## The precedent to copy: Quraan Academy

Quraan Academy is already a second school beside Ehel Academy, and it is the
working answer to "how do I host another school here":

- its content tree is `src/prototypes/quraan-academy/`, entirely separate from
  `ehel-academy/`;
- it has **its own Bunny storage zone** (`quraanacademy`, served at
  `app.quraan.academy`) with its own access key — explicitly *not* Ehel's
  `BUNNY_KEY`;
- it has **its own catalogue generator**, `tools/generate-quraan-catalog.js`,
  emitting the same `catalog.json` contract (`contract: "1.0"`, courses keyed
  by `idnumber`, per-unit grade items, category paths);
- its catalogue is a **second line** in the Moodle setting
  `local_prequran/catalog_source_url`, which takes one URL per line, one per
  consumer school;
- it has **its own uploader**, `tools/upload-prequran-to-bunny.js`, in three
  tiers (`media/`, `content/`, `app/`) mirroring the Ehel layout;
- and it **reuses the Ehel shell by copying it in at deploy time**, rewriting
  the imports as it goes (`../../ehel-academy/shell/course-app.js` →
  `../shared/course-app.js`). The dev tree keeps Ehel-relative paths; the
  deployed tree is self-contained.

Read that uploader's header comment before writing the TVET one. It is the
whole contract in twenty lines.

Two places where TVET should *not* copy Quraan:

- **Environment variable names.** Quraan uses the generic
  `BUNNY_STORAGE_ZONE` / `BUNNY_STORAGE_ACCESS_KEY`. A third school collides
  with that. Give TVET explicit names — `BUNNY_TVET_ZONE`, `BUNNY_TVET_KEY` —
  and leave Quraan's alone.
- **The manifest file.** Quraan keeps `.bunny-quraan-manifest.json` at the repo
  root. TVET gets `.bunny-adow-manifest.json`. The manifests are contended in
  this shared checkout; never let two schools write the same one.

## The tenancy already exists in Moodle — no PHP needed to create the school

`local_hubredirect/consumer_wizard.php` creates a consumer in four steps:
consumer type → workspace + first admin → domains → landing defaults (logo,
colours, support email, copy, routes). `platform_consumers.php` edits it
afterwards.

For Professor Adow TVET:

- **consumer type** `institution` (from `pqhi_consumer_type_options()`);
- **institution type** `technical_training` — **already an option** in
  `pqhi_institution_type_options()` (`institutionlib.php:268`). No code change
  is needed to classify this school. That option exists and has never been
  used.
- theme and copy go in the consumer's `themejson` / `copyjson`, so **no Ehel
  branding reaches a TVET learner** and none of it is hard-coded anywhere.

So step one is an admin action in the platform UI, not a commit.

## What to reuse, what to write fresh, what must not be copied

**Reuse verbatim** (these are school-agnostic already):

| | |
| --- | --- |
| `shared/progress-client.js` | progress saving, with its five known silent failures documented in `ehel-academy/CLAUDE.md` |
| `shared/lesson-gate.js`, `shared/course-shell.js`, `shared/seb-session.js` | launch, gating, exam sessions |
| `lesson-kit/lib/lesson.css` | the Mathematics design system — the house look, no children in it |
| the lesson-kit **architecture** | `app.config.json` + `content/lesson-N.py` → `build-lessons.py` / `build-hub.py` / `check-coverage.py`. Config-driven builder plus a gate that runs on the **built pages**, not the source. That shape is the single most valuable thing Ehel has built and it transfers whole. |
| lesson search, print sheets, narration captions, the deploy manifest pattern | all config-driven |
| Wehel | with its own allowance band — see the `grade` trap below |

**Write fresh:**

- **The step vocabulary.** `lesson-kit/_kit.py` speaks in `sort`, `measure`,
  `label`, `tester`, `experiment` — a six-year-old's verbs. A TVET learner
  needs `procedure`, `safety`, `toolId`, `faultDiagnosis`, `specRead`,
  `measurement`, `wiringDiagram`, `evidence`. Same renderer contract, different
  words. Fork `_kit.py` into a TVET kit rather than widening the Science one.
- **The voice.** `tools/lib/ehel-learner-voice.js` converts teacher voice to
  *child* learner voice, and the root CLAUDE.md warns that widening its default
  word lists changes what already-gated subjects produce. TVET learners are
  adults. Pass a TVET vocabulary from the calling builder; do not touch the
  defaults.
- **The occupational standards spine** — see the next section.

**Do not copy:**

- `ehel-academy-logo.png` and anything else Ehel-branded.
- The Cambridge framing: `cambridgeCode`, stage numbers, `unit.cambridge`,
  `validate:curriculum-units`. The root CLAUDE.md is explicit that
  `validate-unit.mjs` is English-shaped and reports dozens of false failures
  when pointed at another subject. Pointing it at TVET would be worse.
- **The deck.** `shell/deck.js` and the `gc-*` slide deck are Grades 1-4 only,
  by owner decision, because by Grade 5 a learner scans a page rather than
  being walked through it one item at a time. An adult tradesperson looking up
  a wiring rule is the strongest case of that argument there is. TVET is page
  design throughout.

## The curriculum spine — get this right before writing a single lesson

In-house certification does not mean unstructured. The unit of currency in any
TVET system is the **unit of competency**: a named competency, its
**performance criteria**, the **range** it applies over, and the **evidence**
that proves it. Write that down first, as data, in the shape this repo already
uses for frameworks.

`src/curriculum/cambridge-*.json` is the model: `framework`, `curriculumCode`,
`codeScheme`, `strands`, `subStrands`, objectives, `counts`. Mirror it as
`src/curriculum/adow-tvet-<course-slug>.json`, one file per course:

- **department** → strand (Construction & Building Trades, …)
- **course** → the qualification the file describes
- **unit of competency** → sub-strand
- **performance criterion** → objective, with a code like `ADOW-SPV-03.2`
- plus two fields Cambridge has no equivalent for, and TVET cannot do without:
  `assessmentMode` (`knowledge` | `practical` | `both`) and `evidence`.

`assessmentMode` is what makes the whole thing honest. It records, per
criterion, whether the platform can assess it at all. A blended school that
cannot answer "which criteria does the app actually certify?" will certify none
of them or all of them, and both are wrong.

Then write **one new validator** — `tools/validate-adow-standards.mjs`, wired
into `npm test` — that checks the standards file against itself (numbering
gaps, `counts` agreeing with the arrays) and checks that every criterion a
course claims exists in that course's file. That is what
`validate:frameworks` + `validate:curriculum-units --strict-cambridge` do for
Cambridge, and it is worth having from day one rather than retrofitted.

**A warning this repo bought the hard way.** The root CLAUDE.md records, from
2026-09-16, that a citation gate proves a code is *real*, never that the
teaching *matches* it: Intensive English reported a clean 176/176 objectives
cited while one of them — pronunciation and stress — had **zero** occurrences
of `intonation`, `stress` or `schwa` across twenty units. Coverage counts mean
"every criterion has a citation". They do not mean anything is taught. For TVET
the equivalent trap is a safety criterion cited by a lesson that mentions
safety in passing. Grep the built pages for the words the criterion is about.

## The half of the qualification the platform cannot carry

Blended delivery means competency is signed off by an assessor in a workshop,
holding a multimeter. The platform must therefore hold, from the first cohort:

- a **portfolio of practical evidence** per learner per criterion (photo,
  video, a signed job card);
- an **assessor verdict** — competent / not yet competent, who, when, against
  which criterion;
- **workshop attendance**, which is evidence of hours, not just of turning up.

Some of this exists. `local_hubredirect` already has
`attendance_operations.php`, `certificates_awards.php`,
`certificate_verify.php`, `admissions.php` and `bulk_import_export.php`. What
does **not** exist anywhere in the plugin is a **per-criterion competency
record**. That is the one genuinely new piece of platform engineering this
school needs, and it is worth scoping before content, because it decides what
the lesson builder has to emit.

## The `grade` trap — decide it now, not in month six

`app.config.json` carries `grade`, `gradeLabel` and `stage`, and `grade` is
load-bearing well beyond the builder: it picks the Wehel daily minutes band,
and it shapes progress keys.

This repo has already been bitten. Intensive English sends its **CEFR level**
as `grade` (`grade: levelNumber`), so reading that field as a school year hands
an adult beginner a Grade 1 allowance — which is why `WEHEL_INTENSIVE_BANDS`
exists as a whole separate table. The root CLAUDE.md names it as "the trap to
know before touching the bands: the field is called grade in the payload and is
not one".

TVET has levels, not grades, and its learners are adults. Do the same thing
deliberately rather than by accident: carry an explicit `levelKind: "tvet"` in
the app config and give TVET its own Wehel band (an adult trade learner should
not be on a ten-minute primary allowance). One decision, taken once, at the
start.

Related: TVET progress keys should be competency-shaped (`c01`…), not unit- or
lesson-shaped. `science/grade-1-app/app.config.json` documents at length why
emitting `u01` from a lesson build "would claim a whole unit was finished by
one lesson" — six units and eight lessons being different partitions of the
same stage. A TVET course has *three* plausible partitions (modules, units of
competency, assessment events). Pick one as the progress partition and say so
in the config comment, as that file does.

## Order of work

**Phase 0 — naming.** Slug (`adow-tvet`), domain, storage zone name, and the
`.env` keys. Cheap to decide, expensive to change once anything is uploaded:
version and media paths on Bunny are cached for a year and a 404 minted by a
premature probe cannot be purged with the key in `.env`.

**Phase 1 — prove the tenancy with an empty school.** Create the consumer in
the wizard; create the zone; fork the uploader; write
`tools/generate-adow-catalog.js` emitting **one placeholder course**; add its
content-addressed URL (`catalog-<digest>.json`, never the plain name — the
plain one is served with a 30-day max-age and cannot be purged) as a new line
in `catalog_source_url`. Then watch the course appear in Moodle and launch.
That is the full path working end to end, with no content at risk. Quraan
Academy is the proof that this path works.

**Phase 2 — the spine for the first course.** Standards file + validator.
Reviewed by someone who has actually done the trade.

**Phase 3 — one exemplar course, built deep.** Recommend **Solar Photovoltaic
Installation & Maintenance**. It has the highest proportion of content an app
can genuinely teach — array sizing, load calculation, wiring diagrams, fault
finding, safety — so it exercises every renderer the TVET kit will need, and
regional demand for it is real. **Building Electrical Installation** is the
alternative and shares most of the same components. Either becomes the template
the other 21 are cloned from, exactly as "alphabet" is the golden unit for
`src/units/` and Grade 1 Science is for the lesson kit.

**Phase 4 — the competency record** in `local_hubredirect`, once Phase 3 has
shown what evidence a lesson actually produces.

**Phase 5 — scale**, department by department.

## One honest caution about scope

Twenty-two courses is not a small curriculum. Ehel Academy is six subjects
across eight stages and has taken months of continuous work with heavy tooling
support, and that is *with* Cambridge's frameworks supplying the spine. TVET
has no published spine here — every performance criterion has to be authored
and trade-reviewed — and practical trades put a hard ceiling on how much of
each course a screen can carry at all.

So do not plan twenty-two courses at equal depth. Triage:

- **all 22** get the platform as the record system: enrolment, attendance,
  the standards file, assessment scheduling, certificates. This is mostly
  configuration, and it is the part that makes the school run.
- **two or three** get deep interactive content first, chosen for the ratio of
  teachable theory to workshop hours — solar PV, electrical installation,
  electronics servicing, and among the agriculture group, crop production.
- **the rest** get theory notes, safety modules and assessment banks, and are
  deepened as demand shows where learners actually are.

The trades where a screen helps least — masonry, welding, carpentry — are
still fully served by the record system, and that is not a lesser outcome.

## The 22 courses, as given

| department | courses |
| --- | --- |
| Construction & Building Trades | Building Electrical Installation; Carpentry & Furniture Making; Finishing Construction Works; Masonry; Sanitary Installation (plumbing) |
| Mechanical & Automotive Engineering | Automotive Mechanics; Mechanics, Welding & General Metal Fabrication |
| Electronics & Renewable Energy | Electronics & Multimedia Equipment Servicing; Solar Photovoltaic Installation & Maintenance |
| Agriculture & Crop Production | Horticultural Crop Production; Crop Production; Irrigation & Drainage; Agricultural Machinery & Equipment Operation |
| Livestock & Animal Sciences | Animal Health (department also covers animal production, poultry, beekeeping) |
| Food & Agro-Processing | Bee Product Processing; Dairy Product Processing; Fruit & Vegetable Processing; Meat & Meat Product Processing; Edible Oil Processing; Spice & Herb Processing |
