export const meta = {
  name: 'ehel-lecture-films',
  description: 'Write or revise the unit lecture films of a lesson app, one agent per lesson, all at once',
  whenToUse: 'Making several unit lecture films together with tools/create-ehel-unit-lecture.js. args: {app, brief, scenesDir, subject, mode: "draft" | "revise", narrated, lessons: [{n, slug, title, notes}]}',
  phases: [{ title: 'Films', detail: 'one agent per lesson: storyboard and pictures, checked with the free modes' }],
}

/* One agent per lesson, in parallel. Each owns exactly two kinds of file (its
   storyboard and its pictures), follows the brief, checks its film with the
   tool's free modes (--dry, --preview, --sample) and reports. Nothing here
   buys narration, renders, commits or deploys: the lead does those, once, for
   every film together, with tools/run-ehel-lecture-films.js, after the owner
   has approved every script.

   mode "draft":  write the film from the lesson.
   mode "revise": apply the lead's notes (lessons[k].notes) to a film that
                  exists. With narrated: true the words are bought and approved,
                  so no line may change: pictures and cues only, checked on the
                  MEASURED timeline. */

const A = args || {}
const lessons = (A.lessons || []).filter((l) => l && l.slug)
if (!A.app || !A.brief || !A.scenesDir || !lessons.length) {
  throw new Error('args need app, brief, scenesDir and lessons [{n, slug, title}]')
}
const mode = A.mode === 'revise' ? 'revise' : 'draft'
const subject = A.subject || 'Science'

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

function prompt(l) {
  const board = `${A.app}/lecture-video/${l.slug}.json`
  const pics = `${A.scenesDir}/${l.slug}.js`
  const common = `
The brief is ${A.brief}. It is your specification: the files you own, the
script's format, length and language, the pictures API, the rules, the checks
and what you must not do. The other lessons' films are being made at the same
time by other agents, from the same brief, and you must not touch their files.

Your files, and the only files you may write:
  ${board}
  ${pics}   (and ${A.scenesDir}/${l.slug}-2.js, -3.js ... if you split it)

Never: --narrate, any render (not even --draft), --calibrate, the runner
tools/run-ehel-lecture-films.js, git add, git commit, rebuild.sh, or an edit to
any other file. Narration costs money and needs the owner's approval for all
the films at once. Keep any helper script of your own in one scratchpad folder
named ${l.slug}: the agents share one scratchpad.`

  if (mode === 'draft') {
    return `You are making ONE unit lecture film: Grade 1 ${subject}, Lesson ${l.n}, "${l.title}" (slug ${l.slug}).
${common}

1. Read the brief, all of it.
2. Read your lesson, ${A.app}/content/lesson-${l.n}.py, all of it. Its
   docstring names its objectives; LESSON["lecture"] is what the film teaches;
   its steps, words and experiments are where the pictures come from.
3. Read tools/lib/ehel-film-engine-head.js, tools/lib/ehel-film-marks.js and
   tools/lib/ehel-film-art-science.page.js (the ART functions), and skim
   tools/lib/ehel-computing-lecture-scenes.js to see how a chapter is
   choreographed around its cues.
4. Write the storyboard first and run --dry until its length, language and
   objectives are right. Then write the pictures, in parts. Then --preview and
   --sample, and open every image the tool writes. Fix and look again.
5. Run --sweep last: every frame drawn once, so a frame that throws or draws
   outside the box between the sampled frames is found now, not in the render.
6. Report.${l.notes ? `\n\nThe lead's notes for this lesson:\n${l.notes}` : ''}`
  }

  return `You are revising ONE unit lecture film: Grade 1 ${subject}, Lesson ${l.n}, "${l.title}" (slug ${l.slug}).
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

Read the brief again, then your two files, then apply the notes. Run --dry,
then --sample, and open every sheet. Fix until a pass finds nothing. Run
--sweep last. Report.`
}

phase('Films')
log(`${mode === 'draft' ? 'Writing' : 'Revising'} ${lessons.length} film(s), one agent each: ${lessons.map((l) => l.slug).join(', ')}`)

const reports = await parallel(lessons.map((l) => () =>
  agent(prompt(l), { label: `L${l.n} ${l.slug}`, phase: 'Films', schema: REPORT })))

const done = reports.filter(Boolean)
const lost = lessons.filter((l, k) => !reports[k]).map((l) => l.slug)
if (lost.length) log(`No report from: ${lost.join(', ')}`)
return { mode, reports: done, lost }
