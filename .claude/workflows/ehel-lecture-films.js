export const meta = {
  name: 'ehel-lecture-films',
  description: 'Write, review or revise the unit lecture films of a lesson app, one agent per lesson, all at once',
  whenToUse: 'Making several unit lecture films together with tools/create-ehel-unit-lecture.js. args: {app, brief, scenesDir, subject, grade, example, mode: "draft" | "review" | "revise", review, narrated, draftModel, reviewModel, reviseModel, lessons: [{n, slug, title, notes}]}',
  phases: [
    { title: 'Films', detail: 'one agent per lesson: storyboard and pictures, checked with the free modes' },
    { title: 'Reviews', detail: 'with review: true, another agent checks each drafted film against its lesson' },
  ],
}

/* One agent per lesson, in parallel. Each owns exactly two kinds of file (its
   storyboard and its pictures), follows the brief, checks its film with the
   tool's free modes (--dry, --preview, --sample) and reports. Nothing here
   buys narration, renders, commits or deploys: the lead does those, once, for
   every film together, with tools/run-ehel-lecture-films.js, after the owner
   has approved every script.

   mode "draft":  write the film from the lesson.
   mode "review": another agent checks a written film against its lesson and
                  the brief, changes nothing, and returns notes, each with its
                  evidence (the lesson's words, or a search of the WHOLE lesson
                  when the note is that something is absent). The lead vets
                  the notes and sends the ones that stand to "revise".
   "draft" with review: true reviews each film as soon as it is drafted, in
                  the same run, rather than after every draft is in.
   mode "revise": apply the lead's notes (lessons[k].notes) to a film that
                  exists. With narrated: true the words are bought and approved,
                  so no line may change: pictures and cues only, checked on the
                  MEASURED timeline. */

/* A resumed workflow does NOT keep the args of the run it resumes - it throws
   "args need app, brief, scenesDir ..." in milliseconds - so every retry must
   resend the whole lessons array. That cost three full resends in one afternoon
   (a network outage, then the session limit twice).

   An args-in-a-file escape was tried on 2026-09-24 and REMOVED the same hour:
   a workflow script has neither `require` nor `import()`, so it cannot read a
   file at all. Both were tried and both were refused - `require is not defined`
   at run time, and `import() is not available in workflow scripts` before the
   script even launches. There is no file access here to build on. Resend the
   args. */
const A = args || {}
/* app, brief, scenesDir, grade and example may be set per lesson, so one run
   can carry several grades (and stay under the account's rate limit: a run
   holds at most ten agents at once, where five runs at once held 35 and were
   refused, 2026-09-19). */
const lessons = (A.lessons || []).filter((l) => l && l.slug).map((l) => Object.assign(
  { app: A.app, brief: A.brief, scenesDir: A.scenesDir, grade: A.grade || 1, example: A.example }, l))
if (!lessons.length || lessons.some((l) => !l.app || !l.brief || !l.scenesDir)) {
  throw new Error('args need app, brief, scenesDir (at the top or per lesson) and lessons [{n, slug, title}]')
}
const mode = ['draft', 'review', 'revise'].includes(A.mode) ? A.mode : 'draft'

/* WHERE A LESSON LIVES IS NOT THE SAME IN EVERY SUBJECT. Science keeps each
   lesson in content/lesson-N.py; Mathematics has no content directory at all -
   a lesson IS its HTML page, and what the Unit lecture teaches is a WORK entry
   in that grade's add-lesson-opener.py. This was hardcoded to the Science shape
   and sent all 31 Mathematics agents to a file that does not exist (found by
   the what-comes-next agent, 2026-09-24, which recovered by reading the brief).
   `lessonPath` overrides it per run; otherwise the subject decides. */
const lessonOf = (l) =>
  A.lessonPath ? String(A.lessonPath).replace('{n}', l.n).replace('{slug}', l.slug).replace('{app}', l.app)
  : /mathematics/.test(l.app) ? `${l.app}/${l.slug}.html, and its WORK entry (keyed "${l.slug}") in that grade's add-lesson-opener.py - there is no content/lesson-N.py in Mathematics`
  : `${l.app}/content/lesson-${l.n}.py`
/* A stage may name its own model; without one an agent inherits the session's.
   Reviewing is checklist work under a hard evidence rule, and every note it
   makes is vetted twice afterwards (by the lead and by the reviser, who is
   told to check each note against the lesson), so it is the stage that can
   take a cheaper model. Drafting and revising author the script that gets
   BOUGHT and the pictures that get drawn. */
const MODEL = { draft: A.draftModel, review: A.reviewModel, revise: A.reviseModel }
const modelFor = (m) => (MODEL[m] ? { model: MODEL[m] } : {})
const subject = A.subject || 'Science'
/* a finished film to read for how a chapter is choreographed around its cues */
const EXAMPLE = 'tools/lib/ehel-computing-lecture-scenes.js'

const REPORT = {
  type: 'object',
  properties: {
    slug: { type: 'string' },
    characters: { type: 'number', description: 'narration characters, from --dry' },
    beats: { type: 'number' },
    chapters: { type: 'number' },
    length: { type: 'string', description: 'from --dry, and whether estimated or measured' },
    objectives: { type: 'array', items: { type: 'string' }, description: 'codes the film teaches' },
    missing: { type: 'array', items: { type: 'string' }, description: 'codes --dry reports MISSING' },
    chapterNotes: {
      type: 'array',
      items: {
        type: 'object',
        properties: { id: { type: 'string' }, heading: { type: 'string' }, moves: { type: 'string', description: 'what the child sees move, on which words' } },
        required: ['id', 'moves'],
      },
    },
    files: { type: 'array', items: { type: 'string' }, description: 'every file written or changed' },
    sheets: { type: 'string', description: 'the folder holding the last contact sheets' },
    rounds: { type: 'number', description: 'check-and-fix rounds run' },
    problems: { type: 'array', items: { type: 'string' }, description: 'anything still not right' },
    sharedChanges: { type: 'array', items: { type: 'string' }, description: 'changes a shared file needs; none were made' },
    questions: { type: 'array', items: { type: 'string' }, description: 'questions for the owner' },
  },
  required: ['slug', 'characters', 'beats', 'chapters', 'length', 'files', 'problems'],
}

const REVIEW = {
  type: 'object',
  properties: {
    slug: { type: 'string' },
    verdict: { type: 'string', enum: ['good', 'fix'] },
    characters: { type: 'number', description: 'from --dry' },
    beats: { type: 'number', description: 'from --dry' },
    notes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          where: { type: 'string', description: 'chapter id and beat number, or the sheet' },
          kind: { type: 'string', enum: ['script', 'language', 'length', 'objective', 'picture'] },
          problem: { type: 'string' },
          evidence: { type: 'string', description: "the lesson's words with line numbers, or the whole-file search and its full output, or what the sheet shows" },
          fix: { type: 'string', description: 'the smallest change that puts it right' },
        },
        required: ['where', 'kind', 'problem', 'evidence', 'fix'],
      },
    },
    lessonProblems: { type: 'array', items: { type: 'string' }, description: "faults in the LESSON itself, with the lesson's own words" },
    sheets: { type: 'string', description: 'the folder of the sheets looked at' },
  },
  required: ['slug', 'verdict', 'notes'],
}

function prompt(l, m) {
  m = m || mode
  const board = `${l.app}/lecture-video/${l.slug}.json`
  const pics = `${l.scenesDir}/${l.slug}.js`
  const common = `
The brief is ${l.brief}. It is your specification: the files you own, the
script's format, length and language, the pictures API, the rules, the checks
and what you must not do. The other lessons' films are being made at the same
time by other agents, from the same brief, and you must not touch their files.

Your files, and the only files you may write:
  ${board}
  ${pics}   (and ${l.scenesDir}/${l.slug}-2.js, -3.js ... if you split it)

Never: --narrate, any render (not even --draft), --calibrate, the runner
tools/run-ehel-lecture-films.js, git add, git commit, rebuild.sh, or an edit to
any other file. Narration costs money and needs the owner's approval for all
the films at once. Keep any helper script of your own in one scratchpad folder
named ${l.slug}: the agents share one scratchpad.`

  if (m === 'review') {
    return `You are REVIEWING ONE unit lecture film: Grade ${l.grade} ${subject}, Lesson ${l.n}, "${l.title}" (slug ${l.slug}).
Another agent wrote it from the brief, ${l.brief}. You change NO file: you
read, you run the tool's free modes, you look, and you report what is wrong,
with its evidence, so the lead can decide what to fix.

The film's files:
  ${board}
  ${l.scenesDir}/${l.slug}*.js
Its lesson: ${lessonOf(l)}

Never: a write or an edit to any file, --narrate, any render (not even
--draft), --calibrate, the runner tools/run-ehel-lecture-films.js, or git. The
free modes are yours: --dry, --preview, --sample and --sweep (the brief's
Checking section has the commands). Keep any helper script of your own in one
scratchpad folder named review-${l.slug}.

1. Read the brief, all of it. Then the lesson file, all of it. Then the
   storyboard, and the pictures files.
2. The script, line by line. Does the lesson teach this, in these terms? Is
   it true? Is it in the brief's language (sentence length, the lesson's own
   words, UK spelling), and would a Grade ${l.grade} child follow it?
   THE EVIDENCE RULE. A note that the lesson says something must quote the
   lesson's words, with line numbers. A note that the lesson does NOT say
   something must show the search you ran over the WHOLE lesson file, never
   piped through head or tail, and its complete output. A Grade 1 review
   changed a line the lesson taught word for word, because a search cut short
   by head -3 was read as absence. No evidence, no note.
3. Run --dry: the characters and beats against the brief's range, and every
   objective covered. Look up each code's official wording with the brief's
   command and compare it with the storyboard's.
4. The pictures. Run --sample and open EVERY sheet it writes. For each
   chapter: does the thing named move or appear as it is named, and is it the
   right thing? Is anything clipped, overlapping, outside the box or over the
   words? Is every label readable? Does each picture match what is said about
   it (a colour, a side, a number, a size)? Are the people brown, as the
   brief's People section asks? Then run --sweep for throws and overflows.
5. The lesson itself. If you find the LESSON wrong (a picture that contradicts
   its words, a fact one step contradicts in another), put it under
   lessonProblems with the lesson's own words, not in the film's notes.

Every note says where it is (chapter id and beat number, or the sheet), what
is wrong, the evidence and the smallest fix. A film with nothing wrong gets
verdict "good" and no notes: say so rather than find something to say.`
  }

  if (m === 'draft') {
    return `You are making ONE unit lecture film: Grade ${l.grade} ${subject}, Lesson ${l.n}, "${l.title}" (slug ${l.slug}).
${common}

1. Read the brief, all of it.
2. Read your lesson, ${lessonOf(l)}, all of it. Its
   docstring names its objectives; LESSON["lecture"] is what the film teaches;
   its steps, words and experiments are where the pictures come from.
3. Read tools/lib/ehel-film-engine-head.js, tools/lib/ehel-film-marks.js and
   tools/lib/ehel-film-art-science.page.js (the ART functions), and skim
   ${l.example || EXAMPLE} to see how a chapter is
   choreographed around its cues.
4. Write the storyboard first and run --dry until its length, language and
   objectives are right. Then write the pictures, in parts. Then --preview and
   --sample, and open every image the tool writes. Fix and look again.
5. Run --sweep last: every frame drawn once, so a frame that throws or draws
   outside the box between the sampled frames is found now, not in the render.
6. Report.${l.notes ? `\n\nThe lead's notes for this lesson:\n${l.notes}` : ''}`
  }

  return `You are revising ONE unit lecture film: Grade ${l.grade} ${subject}, Lesson ${l.n}, "${l.title}" (slug ${l.slug}).
It exists; the lead has reviewed its script and pictures.
${common}

${A.narrated
  ? `THE NARRATION IS BOUGHT, and the owner approved these exact words. Do not
change any "say" in the storyboard, in any way: a changed line is narration
nobody approved. Change pictures and cues (art.at) only. --preview and
--sample now run on the MEASURED timeline, the one the render will use, so
check every chapter on it.`
  : `The narration is not bought yet, so lines may change where a note asks. Keep
the film within the brief's length.`}

The lead's notes:
${l.notes || '(none: check every chapter again against the brief)'}

Check each note against the lesson before you apply it. If one is wrong (the
lesson says otherwise), do not apply it: report it under problems, with the
lesson's words.

Read the brief again, then your two files, then apply the notes. Run --dry,
then --sample, and open every sheet. Fix until a pass finds nothing. Run
--sweep last. Report.`
}

phase('Films')
log(`${{ draft: 'Writing', review: 'Reviewing', revise: 'Revising' }[mode]} ${lessons.length} film(s), one agent each: ${lessons.map((l) => l.slug).join(', ')}`)

if (mode === 'draft' && A.review) {
  /* draft, then review, per film, with no barrier between: a film is
     reviewed as soon as its draft is in */
  const out = await pipeline(lessons,
    (l) => agent(prompt(l, 'draft'), Object.assign({ label: `G${l.grade} L${l.n} ${l.slug}`, phase: 'Films', schema: REPORT }, modelFor('draft'))),
    (report, l) => (report
      ? agent(prompt(l, 'review'), Object.assign({ label: `review G${l.grade} L${l.n} ${l.slug}`, phase: 'Reviews', schema: REVIEW }, modelFor('review')))
          .then((review) => ({ report: report, review: review }))
      : { report: null, review: null }))
  const lost = lessons.filter((l, k) => !out[k] || !out[k].report).map((l) => l.slug)
  const unreviewed = lessons.filter((l, k) => out[k] && out[k].report && !out[k].review).map((l) => l.slug)
  if (lost.length) log(`No draft from: ${lost.join(', ')}`)
  if (unreviewed.length) log(`Drafted but not reviewed: ${unreviewed.join(', ')}`)
  return {
    mode: 'draft+review',
    reports: out.filter((x) => x && x.report).map((x) => x.report),
    reviews: out.filter((x) => x && x.review).map((x) => x.review),
    lost: lost,
    unreviewed: unreviewed,
  }
}

const reports = await parallel(lessons.map((l) => () =>
  agent(prompt(l), Object.assign({ label: `${mode === 'review' ? 'review ' : ''}G${l.grade} L${l.n} ${l.slug}`, phase: mode === 'review' ? 'Reviews' : 'Films', schema: mode === 'review' ? REVIEW : REPORT }, modelFor(mode)))))

const done = reports.filter(Boolean)
const lost = lessons.filter((l, k) => !reports[k]).map((l) => l.slug)
if (lost.length) log(`No report from: ${lost.join(', ')}`)
return { mode, reports: done, lost }
