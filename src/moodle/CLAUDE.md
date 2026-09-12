<!--
  Extracted from the root CLAUDE.md on 2026-09-12.
  Loads on demand when Claude reads files in this directory,
  so it costs no context in sessions that work elsewhere.
  Cross-cutting rules stay in the root CLAUDE.md.
-->

## The live group board: one teacher, two groups of nine, out of phase

```bash
npm run check:php            # includes the reducer gate the activity ring lives under
node tools/check-platform-cors.mjs   # probes course_hand_raise.php, discovered automatically
```

The school runs a 3-4 hour learner day where one live teacher takes **two groups
of nine**. They cannot be taught at the same instant, so they are taught out of
phase: a 40-minute cycle of shared launch, 15 minutes taught at 1:9 while the
other nine work in the app, swap, shared close. Every learner therefore spends
as long with no adult in the room as with one, and **nothing showed the teacher
that second nine**. The signals all existed; nothing read them together.

- `live_group_boardlib.php` — the query library, read-only.
- `live_group_board.php` — the page (teacher of the workspace; an administrator
  may read another teacher's board, gated on `pqh_user_can_manage_workspace`).
- `live_group_board_data.php` — the poll endpoint, gating restated not inherited.
- `live_group_board_hand.php` — the teacher marking a raised hand answered.
- `course_hand_raise.php` — the learner's end, launch-token auth.
- Entry point: "Live group board", first in Teacher Operations on
  `teacher_workspace.php`, because it is the only tool there used DURING a session.

**THE SORT IS THE FEATURE.** Hand raised, then alert, then warn, then
longest-quiet-first, then not-started. "Quiet" is time since the learner's app
last reported anything (`local_prequran_progress.timemodified`, rewritten on
every ingest), and that single ordering catches three problems a teacher cannot
tell apart from the other room — stuck, gone, and disconnected. Everything else
on a tile is context for that one decision.

A **raised hand outranks every inferred signal** and replaces the tile's state
rather than colouring alongside it: staleness is the board guessing who needs
help, a hand is the one thing on it the learner said out loud. Among hands the
order is longest WAIT first, not longest quiet.

**ONE RENDERER, IN JS, SEEDED WITH INLINE JSON.** The obvious build paints the
first frame in PHP and refreshes it in JavaScript, and that is two renderers for
one board: they drift, and the drift shows up as a tile that changes shape the
moment it refreshes. The page ships the first board as inline JSON and one JS
function draws every frame including the first, so there is no fetch on load. A
no-JS visitor is told the board needs JS rather than shown a frozen frame with
nothing to say it is frozen. Quiet counters are recomputed client-side each
second from the server's own `generated` stamp — the Wehel timer's rule, the
client doing the server's arithmetic on the server's data rather than keeping a
second clock.

**Wehel is reported as minutes USED, never minutes left.** The daily allowance is
a spec held byte-equal across three files by `check:wehel-contract`; a fourth
copy here would be one that gate cannot see. `used` comes straight out of the
ledger preference and needs no band table.

### The activity ring: the progress document now records WHEN

`sectionsDone` is an append-ordered list and `checkpoints` a map — both say WHAT
a learner has done and neither said when, so per-block counts were not missing
from the board, they were **absent from the data**.
`externallib_progress.php` keeps `_activity`, a bounded ring (`MAX_ACTIVITY`, 80)
of `[timestamp, kind, section]` appended only where the state actually CHANGED —
`s` a section completed, `c` a checkpoint scored. No new table: it rides in
`statejson`, and `public_state()` strips it, so the app never receives it and only
the board, which reads the row directly, can see it. Extends the two-store note
above; this is the server store, and the local one is untouched.

Four decisions, each of which changes what the number means:

- **Server clock, not the event's own `at`.** The board's headline (minutes
  quiet) comes from `timemodified`, also server-side, and two numbers on one tile
  from different clocks disagree the moment a device is skewed. The cost is that
  work queued offline is stamped when it arrives; that is the honest reading of
  "we learned of it now".
- **A section arriving only via `progress.summary` still counts.** A tab closed
  before the durable `section.completed` flushes loses it and the next summary
  carries the section instead. Counting only the durable event undercounts
  exactly the learner whose connection is worst.
- **`_activitySince` records when counting began**, because every row written
  before this shipped has no ring. Without it the board reports 0 for the first
  cycle after release and a teacher chases a learner who is fine.
- **That has to be carried all the way to the tile, and the first version got it
  wrong in the UI after getting it right in the data.** A zero rendered as
  "nothing this cycle" is a confident claim about a window nobody measured. Four
  states now, and they are different claims: `+4 this cycle` (counted),
  `+2+ this cycle` (the ring began mid-window, so a FLOOR), `nothing this cycle`
  (idle, and we know), `not counted yet` (no ring — say nothing).

`check-progress-attempted.php` covers it (34 assertions to 44) and its strip
check was **widened**, not merely extended: it named only `_lastAt` and
`_appliedIds`, so it would have passed while `_activity` leaked to every client
on every hydrate. Mutation-tested five ways — dropping the record on
`section.completed`, on `checkpoint.result` and on the summary catch-up, removing
the cap, and leaking the key — all caught, green on restore. The leak mutation is
what proves the widened assertion earns its place.

### Hand-raise, and why it does not always draw

The escalation ladder a learner is taught is worked example, then Wehel, then the
group chat, then the teacher — and there was no fourth step, because a child in
the other breakout room had no way to say "I am stuck" short of interrupting the
lesson next door by voice.

**The button does not mount unless somebody is watching.** The server answers
`watched` (is this learner in an active class group with a teacher on it) and a
false answer draws nothing. A tutoring learner working alone at nine at night
must not be offered a button that reaches nobody: they would wait for help that
is not coming instead of asking Wehel. Same "silent unless it can do something"
rule the tutoring subject picker keeps.

**A hand nobody can lower is as broken as a hand nobody can raise** — within one
cycle the board is a wall of permanent flags and the teacher stops reading it.
Both ends clear it, and the teacher's row is written with the **learner** as
`actorid` and the teacher in `details`, so `pqlgb_hand_state()` stays a
single-actor query. State is `course_hand_raised` / `course_hand_lowered` in
`local_prequran_live_audit`, beside the focus events on the same actorid index,
and deliberately **not windowed** the way focus breaks are: a hand raised twenty
minutes ago is still up, and a window would drop the learner waiting longest.
Rows are written only on a real transition, so pressing twenty times is one row.

**Two limits the UI must keep stating.** Focus breaks are evidence, not
prevention — a web page can report that a learner left it and cannot stop them.
And outside a live room the board is a monitoring surface, not attendance: it
shows last-seen rather than marking anyone present. (While a room IS running,
the tile does carry a real attendance fact — the section below.)

### The live class reaches the board, and the lookup that was blind to a running room

One lookup, `pqlgb_group_next_session()` in `live_group_boardlib.php`, feeds
three surfaces: the teacher's Go live header, the learner's Join pill in the
app (delivered with every chat poll through the learner door), and — since
2026-08-29 evening — the live-class flag. While a group's room is
RUNNING, a tile whose learner has JOINED it says 🟢 "in live class · joined
HH:MM"; the header says "In session". ONLY the positive fact is stated: an
amber "not in live class yet" shipped first and the owner removed it the next
day — a learner without the flag may be working in the app on purpose, so the
amber version accused people the data could not convict. Verified on
production with a real room and a real learner in it.

- **JOINED is the measured fact and the only claim made.** The join action
  writes `local_prequran_live_attendance` (`pql_mark_student_join`); BBB does
  not reliably report leaving, so the flag says when they joined and never
  "still in". A child in BBB has this app tab backgrounded, so without the flag
  they read as quiet/gone on the very board that should show them doing the
  right thing.
- **No room running → no flag.** A screenshot with no flags and a header
  showing "Go live" (the create fallback) means no room exists — the design
  waiting for a class, not a fault. That reading was mistaken for a failure
  once already.
- **The bug the live test found: the lookup was TODAY-ONLY, and the room
  everyone was in was scheduled for two days later.** The teacher's Go live on
  the admin's recurring Monday session flipped it `status='live'` and it STAYED
  live; a student joined it; the board was blind because
  `scheduled_start < end-of-day` excluded it. A `status='live'` session is now
  admitted whatever its date — bounded by the same `scheduled_end + after`
  window the join door enforces — and a running room BEATS a merely-scheduled
  one for the group's slot ("earliest wins" alone would hide the live room
  behind an upcoming slot).
- **A session leaves `live` two ways since 2026-08-30, and the second exists
  because the first was not enough**: the old sweep on `scheduled_end`
  passing, and `retire_ended_rooms()` in the same task
  (`live_session_reminders`, every 15 minutes), which asks BBB
  `isMeetingRunning` for every `live` row and retires ended rooms to
  `awaiting_review` (audit `session_room_ended`). Before it, a future-dated
  session a teacher went live on early stayed "open" — to the board AND
  the join door — for DAYS after everyone left. Three rules keep the sweep
  honest: it retires only on BBB's DEFINITE "not running" (a failed call
  returns null from `local_prequran_bbb_is_meeting_running()` and null is
  no evidence, never false); a 5-minute grace on `bbb_create_time`, because
  BBB reports a meeting as not running until its FIRST joiner, so a teacher
  mid-redirect must not have the room retired under them; and it is
  self-healing, because the join door admits a teacher to `awaiting_review`
  and every join re-creates the room and re-sets `live`. Cadence is the
  task's schedule, editable in Site admin — no code change. Two traps from
  shipping it: `require_once` from inside a method runs the included file's
  TOP-LEVEL code in function scope, and `locallib.php` opens with
  `require_once($CFG->libdir . '/filelib.php')` — with `$CFG` unset there
  the path collapsed to `/filelib.php` and the whole task died (`global
  $CFG;` in the method is the fix). And BBB itself only auto-ends EMPTY
  rooms (`meetingExpireIfNoUserJoinedInMinutes` default 5,
  `meetingExpireWhenLastUserLeftInMinutes` default 1) — it cannot end an
  idle-but-occupied room (the inactivity timeout was removed in BBB 2.3),
  so our 270-minute `duration` cap is the backstop there.
- **"Pressed Go live" can create session A while the teacher joins session B.**
  The create fallback lands on the sessions page, which lists everything; the
  night this shipped the created session was never joined and the joined one
  was the recurring session. Never assume the created session is the joined
  one.
- The diagnosis pattern that split four hypotheses in one run: a read-only
  staged probe listing every session row of the last three hours with exactly
  the fields the lookup filters on (groupid / status / bbb_created / times)
  plus each row's attendance — which distinguishes create-failed, groupid=0,
  lookup-blind and join-didn't-flip without a second round trip.

The Join pill earned its own three lessons the same evening, all one shape —
two rules for one fact: it first hardcoded a 10-minute lead while the door
reads config (`bbb_join_window_before/after_minutes` — and after is **180**
on this install, not the 15 default); then mirroring the door exactly kept the
pill red for three hours over a dead room in `awaiting_review`. The settled
split: the door answers "would you be admitted", the pill and the header
answer "is there a class" — a session past its scheduled end is only a class
while the room is live, and `joinable` is computed by the door's own
expression so the pill can never say yes where the door says no.

### The dashboard entry, the board's chrome, and one group per session (2026-08-29/30)

The board is reached from the TEACHER DASHBOARD's rail -- "Group Board",
between Live Classes and Schedule -- as well as from Teacher Operations on
`teacher_workspace.php`. Two things about how that entry landed are worth more
than the entry itself:

- **`dashboard.php`'s quick-card grid is `display:none` on the current
  design.** The first attempt added a perfectly correct card to the
  `$role === 'teacher'` quick-links block, and it rendered invisibly -- the
  markup is live, the container is hidden, and nothing but opening the page
  can tell you so (a text search does not match hidden text either). The
  VISIBLE navigation is the hand-built per-role `pqh-gnav` rail further up the
  same file. The invisible card was left in place deliberately: it is correct
  if the quick grid ever returns. Same lesson as the two suns and the
  break-inside page count -- the declaration says intent, only the rendered
  page says what a user gets.
- **`teacher_dashboard.php` is a 5-line wrapper around `dashboard.php`**
  (`PQH_TEACHER_DASHBOARD_WRAPPER`); the teacher dashboard's logic, rail and
  role-switch all live in dashboard.php.

The board itself wears the same chrome as the pages that dashboard links,
modelled on `teacher_workspace.php`: Moodle furniture hidden by the body-class
block, the shared design shell (`pqh_design_shell_css`/`_html` -- left rail
plus sky-gradient app bar, with the board highlighted via a `navitems` entry
carrying a `key`), and a workspace-style header card that took over the title
from the toolbar's h2. Two mechanical consequences: the chat column's sticky
top moved to 72px so it parks below the 60px sticky app bar, and the
screenshot lightbox's z-index rose to 120 to cover the fixed rail (z 80).

**One group per session** (owner, 2026-08-29): a teacher handles ONE group per
live session. The board needed no code change -- it draws whatever
non-archived groups the teacher owns -- and the change was pure data: QA class
group #38 "group board 2" archived (`status='archived'`, the platform's own
removal idiom; memberships and sessions kept, restore by flipping the status
back) via a staged two-fence script that refused unless id AND exact title
both matched. The section heading above still says "two groups of nine, out of
phase" because that is the school DAY the board was built for; a board SCREEN
now shows one group at a time, and the sort, the flags and the chat are
unchanged by how many groups happen to render.

**A tile splits CONTEXT from STATES, and both halves are colour-coded by
category** (owner, settled across 2026-08-30 in three steps — a cyan
position chip and a purple Wehel-minutes chip each shipped and moved to the
place line within hours, so do not re-add either as a chip). The PLACE LINE
is a row of tinted pills, one per fact: blue the course (subject / stage /
unit), cyan the position ("in Vocabulary" — mid-activity, "finished x",
or "last: x" when no resume pointer exists), pink the done-count, purple
the Wehel minutes. Pills wrap rather than ellipsize. The CHIP ROW keeps
only what changes a teacher's next action: grey the cycle count ("nothing
this cycle", "day not counted yet"), teal the learning time, and the
semantic states with their meanings untouched — ok green (moved this
cycle / in live class / target met), warn amber, bad red, hand blue, and
the live-blue "in Wehel" presence, which carries the minutes on its face
so the place line skips them while a learner is in the tutor and the
number never shows twice. A new fact joins a category or argues for a new
one — bare white now reads as unstyled rather than neutral — and a tile
with no app record still says "No app activity recorded" rather than a
bare "0 done".

### The classroom chat: built INSIDE "no student-to-student messaging"

```bash
php tools/check-class-group-chat.php   # also chained into check:php
```

The escalation ladder taught to learners (worked example, then Wehel, then the
group chat, then the teacher) named a group chat the platform did not have.
It exists now (2026-08-29, plugin 202608290033 + app v328-v330), and the first
thing to know is what it was built ON: **the LiveChat already existed.** The
support system — `support.php`, `comm_thread`/`comm_message`/`comm_participant`,
the `support_*` external API with polling, moderation and audit, specified in
`docs/livechat-helpdesk-*` — is the LiveChat. The classroom room is its FOURTH
conversation type, `class_group`, not a second system: one room per class group,
found-or-created by `(type, assignmentgroupid)`, inheriting reading, replying,
moderation, visibility and audit unchanged because those were already
participant-based. Do not build a parallel chat store; the search that found
this one took three attempts because it looked for "chat" instead of reading
what `support.php` was.

**The room is ASYMMETRIC, and that is a safeguarding decision, not a
limitation.** The requirements doc states "no student-to-student messaging"
twice — once under Safety And Moderation — and a whole-group room IS
student-to-student messaging, unsupervised for 15 minutes at a stretch by the
Counterpoint Model's own design, for learners as young as five. A whole-group
version was built first and stopped one step short of committing when the rule
was found. The shipped shape: a STUDENT's message is stamped
`group_teacher_only` (visible to the teacher and its own author alone); anyone
else's is public to the room. The learner's own bubble says "Only your teacher
can see this", because a child who cannot see what they sent believes it failed,
and a child must never believe the class read something the class cannot read.

**The stamp keys on ROLE, not on being the assigned teacher.** The first live
exchange had a site admin covering the board — the ordinary second user here,
not an edge case — and the assigned-teacher version stamped their messages as
learner messages: amber on their own panel, invisible to every child. Who is a
student is answered by the participant row the roster seeded (`role='student'`);
staff replying via capability have no row, which correctly reads as
not-a-student. The same rows answer the display name: a child sees **"Teacher"**
over any staff message — the admin account's literal firstname is "System", and
that reached a five-year-old's screen before this rule existed. Students appear
as first names only; nine children share a room and full names are roll-call
furniture.

**Answer-to-class: the whole room gets the teaching, nobody learns who needed
it** (owner). Each learner question on the teacher's panel carries an "Answer to
class" button; the reply is a public message whose `templatekey` holds
`reply:<id>` (existing unused column — no schema change for one pointer), and
the exchange returns a `quote`: the question's body capped at 300 chars plus
ONE identity fact, `mine`, sent only to the asker so their panel says "You
asked" while everyone else reads "Someone asked". Guarded at the STORE: only
staff may reference a message, same-thread only, and the referenced message must
be `group_teacher_only` — and the learner door has no `replyto` parameter at
all, so a student cannot broadcast another child's words even in principle. A
failed reference drops silently and the reply still sends as a plain broadcast.
The question TEXT going public is the feature; a child sometimes writes their
own name into a question, and the teacher reading it before clicking the button
is the judgment call, kept human on purpose.

**One implementation, two doors.** Everything after auth is
`local_prequran_external::class_group_chat_exchange()`. The learner door
(`course_group_chat.php`) authenticates by launch token in the
`course_hand_raise.php` mould and derives the learner's group FROM THE ROSTER —
a groupid in the payload would let any token read any room in the school. The
teacher door (`live_group_board_chat.php`) is session + sesskey with the board's
restated gating, and rebuilds `pqlgb_teacher_groups()` rather than trusting a
groupid. A manager supervising another teacher's board reads its rooms but
sends as themselves. The panel mounts for a learner only when the server says
the room exists and is enabled — the Raise-hand rule that a control which
reaches nobody is worse than none.

**The gate extracts source, because it cannot load the class.**
`externallib_v4.php` is 11k lines behind `MOODLE_INTERNAL`, so unlike
`check-progress-attempted.php` the gate cannot include it; it extracts the two
visibility functions' text by brace-counting and exercises THAT — the shipped
bytes, not a copy — and exits 2 when extraction fails, because a gate that
cannot read its target and passes is green about nothing. It also asserts the
send path CALLS the stamp and both read paths filter: a perfect function
nothing invokes protects nobody. Mutation-tested; one mutation first "survived"
because the harness broke on an apostrophe and never applied it — the mutation
is the cheaper thing to be wrong about, check it first.

Four traps, each of which cost real time on ship day:

- **The policy resolver copies a WHITELIST of flags off the support_policy row,
  and a new flag must be added to it** (`local_prequran_support_effective_policy`
  in locallib.php) or the DB column can hold 1 for ever while the type reads
  false. Found only by reading the resolver before writing the flag script;
  no gate sees that layer. The flag is `class_group_enabled`, per-workspace,
  deliberately NOT behind `async_enabled` — that governs the ticketing pipeline
  (SLA, queues, business hours) and a live classroom is none of those.
- **Moodle records the declared version even when no upgrade step ran for it.**
  `version.php` landed on the served tree while `db/upgrade{lib}.php` silently
  did not; the upgrade then stamped 202608290033 having done nothing, and "No
  upgrade needed" was true about an upgrade that never happened. Repair without
  version surgery: the ensure functions are add-if-missing, so pull the real
  files and call `xmldb_local_prequran_ensure_support_schema()` directly.
- **Messages keep their stored visibility stamp for ever.** A stamp fix applies
  from the NEXT message; anything sent before it never becomes visible to the
  people the fix would have shown it to. Resend; do not wait for old messages
  to appear.
- **A learner message containing a phone number, email, URL or @handle is
  refused** by `support_clean_message_body` — the requirements' contact-details
  filter, inherited free. It currently refuses QUIETLY; a kind explanation for
  the child is still owed.

Policy row note: enabling workspace 23 created support_policy row **id 1** — the
first policy row this install has ever had, meaning the helpdesk LiveChat has
been running on config defaults everywhere. The resolver only ever PROMOTES
flags (a zero column never demotes a config default), which is what makes a
minimal per-workspace row safe to create.

### The chat's screenshot: a child sends the lesson page, and only the lesson page

The camera beside Send (owner, 2026-08-29; app v332 + the chat's PHP) lets a
learner send their current screen to the teacher. **The capture is a render of
the app's own DOM** — html2canvas 1.4.1, vendored at
`shared/html2canvas.min.js`, upstream-unmodified and tracked in git exactly
like lucide — and deliberately NEVER the browser screen-capture API. That
API's picker offers a five-year-old the whole desktop: other tabs, other apps,
whatever the family had open. Its failure mode is a safeguarding incident, not
a bug, and no permission dialog fixes that for this audience. A DOM render can
only contain what the lesson shows and what the child typed into it; the
requirements doc's attachments non-goal carries the owner's approved exception
beside the rule.

The pieces, and the decision inside each:

- **The child previews before anything is sent** — "Your teacher will see
  exactly this" over the actual image. A capture a child cannot inspect is a
  capture they cannot consent to. Downscaled to 1280 wide, JPEG 0.7.
- **Always `group_teacher_only`, hardcoded at the insert** — the stamp
  function is not on this path, so `check-class-group-chat.php` asserts the
  LITERAL at the insert site. Answer-to-class cannot carry an image because
  its quote is text-only.
- **Proven a JPEG by magic bytes, 500KB decoded cap** (plus an 800KB base64
  cap at the learner door before decoding is attempted). The text safety
  filter does not apply to pixels; the bounded capture stands in for it.
- **No public URL, ever.** Stored via the file API (system context, filearea
  `class_chat_shot`, itemid = messageid); the only ways out are the two gated
  chat doors, and the image fetch re-runs `support_message_visible_to_user`
  per request — a bubble and its pixels cannot diverge in who may see them.
- **30-day retention**, swept opportunistically on store (bounded to 50 per
  call, no cron wiring). The message row stays; panels say "expired". Text
  forever is cheap; images of children's work forever is a policy nobody chose.
- **The board shows a thumbnail; click opens a FULL-VIEWPORT lightbox.** The
  first version expanded inside the 320px chat column and the owner's first
  review said "too small for the teacher to review" — the thumbnail is the
  conversation form, the lightbox is the review form, and review needs the
  viewport.
- **html2canvas lazy-loads by deriving its URL from the lucide script tag**
  already on every page — correct in local dev and under `v{TAG}/` alike, zero
  index.html changes, and the 200KB loads only when a child presses the
  camera. It rides `SHARED_MODULES` in `deploy-app-version.js`.
- Known limitation, accepted: WebGL canvases (Science/Computing interactive
  models) render blank in a DOM capture. English — where the classroom runs —
  draws none.

### v331 shipped my own patch script inside course-app.js, and three checks watched it happen

The release carrying the screenshot feature took **all six subjects down at
boot**: `course-app.js` line 574 was `}"""` followed by
`assert s.count(old) == 1` — the PYTHON SOURCE of the patch script that built
the feature, inside the shipped JavaScript. Rolled forward as v332 inside the
hour (never roll back a version path).

The mechanism: a repair script re-derived its replacement text by
REGEX-EXTRACTING `old = """…"""` / `new = """…"""` literals out of an earlier
patch script, matched by their assert markers. For the second marker, the
leftmost `old = """` in that file belonged to the FIRST block — so the lazy
groups satisfied the anchor by extending ACROSS the first block's closing
quotes, swallowing the python between the blocks into the "replacement".

**Three verifications passed, and each was a real measurement of the wrong
thing** — which is why this section exists:

- `node --check` ran on intermediate states, never on the final bytes. The
  multi-step patch script asserts before it writes, so a mid-script assert
  means NOTHING landed — and a later partial re-apply left checks running on
  states that never shipped.
- The **symbol-presence check passed BECAUSE of the poison**: the injected
  text was the feature's source code, as text, so every symbol it defines was
  present in it. Presence of a name is not presence of working code — the
  marker-proves-presence-not-correctness rule, at its pathological limit.
- The **hunk-split classifier waved it through**, because it recognises my
  work by my identifiers and the poison was made of them.

The rules bought, each now practised:

- **Never derive patch text by regex from another patch script.** Replacement
  text recovered from a script that failed is the failure wearing a new name.
  Type the strings.
- **Verification belongs AFTER the last write, on the final file.** Every
  check in the broken round passed; none of them ran last.
- **Parse the LIVE bundle after every release** — `node --check` on the CDN's
  own `course-app.js`. It is the check v331 never got and v332 did, it costs
  one curl, and it is the only check that runs on the bytes learners execute.

Recovery shape, because the tree is shared: the poisoned file was rebuilt from
the last good commit — but a plain `git checkout` would have DESTROYED another
session's uncommitted narration work in the same file. Their hunks were saved
as a patch FIRST (`git diff HEAD -- <file>` before any reset), the file
restored, their patch re-applied, and only then the feature re-applied as one
handwritten script.

### A platform endpoint's CORS contract depends on how the gate finds it

`check-platform-cors.mjs` discovers endpoints by parsing `platformUrl("…")` in
`shell/*.js`, so `course_hand_raise.php` was probed the moment it was written —
and failed, because it allowed only `Content-Type`. That exposed a split worth
knowing before adding an endpoint:

| how the gate finds it | endpoints | Allow-Headers | probed |
| --- | --- | --- | --- |
| `platformUrl("…")` in `shell/*.js` | 8 probed (the six Wehel/quiz calls, this one, and `course_group_chat.php`) | `Authorization, Content-Type, Accept` | yes |
| the gateway's minting line in `progress_gatewaylib.php` | `progress_gateway.php` | `Authorization, Content-Type` | yes |
| a URL parameter | `course_focus_event.php`, `practice_coach_event.php` | `Content-Type` only | **never** |

`live_sessions.php` matches the `platformUrl` rule too and is deliberately NOT
probed — it is a link target, and no preflight is ever sent for a link, so the
gate names it and skips it. That is why a healthy run prints **9** preflights
(8 from this table's first row, plus the gateway) while ten paths match.

Being callable through `platformUrl` is what buys an endpoint gate coverage;
matching the contract is the price. **Every endpoint the gate probes must allow
`Authorization`**, because it preflights with
`Access-Control-Request-Headers: authorization,content-type` and requires both —
so allowing it on an endpoint that authenticates from the body costs nothing and
is the difference between a green release and a failing one. `Accept` is a
hubredirect convention rather than a requirement; the gateway omits it and
passes. Narrowing a discovered endpoint's headers fails the next release.

### Deploying these files: the md5 is the only proof

Plugin PHP goes to the Moodle box on its own channel, and on 2026-08-28 a cPanel
File Manager upload of `externallib_progress.php` **reported success and
delivered nothing** — the file's mtime stayed on the previous day and a `find`
across the whole account turned up no copy written in two hours. Every cheaper
check passed: the path returned `200`, the endpoint answered its preflight, the
file compiled. All of that was true of the OLD file too. Only the hash could tell
them apart, which is the repo's "a successful-looking upload proves nothing"
arriving on this tier.

The CDN-staging loop is self-verifying and is the better route: stage under
`Ehel Primary/qa/` on the storage zone with a fresh, unguessable filename,
`curl -fsS -o <name>.new` on the box, hash it, `mv` only if it matches, then
delete both copies. Downloading to a temporary name is what keeps a partial
transfer from truncating a live file — and for the progress gateway that file is
every learner's ingest path.

**THE PULL ZONE MUST MATCH THE STORAGE ZONE YOU STAGED TO, and there are TWO of
them, each with its own key and its own `Ehel Primary/qa/`.** This note used to
say the pull zone "is `quraanacademy.b-cdn.net` (`BUNNY_STORAGE_ZONE`), not
`ehelacademy`, which 404s for `Ehel Primary/qa/`" — true of the zone it was
written about and false as a general rule, which cost a step on 2026-09-10 when
a script staged to the `ehelacademy` zone 404'd on the URL this file named.

| storage zone (`AccessKey`) | staged with | fetch from |
| --- | --- | --- |
| `ehelacademy` | `BUNNY_KEY` — the app/content zone `deploy.mjs` writes | `https://ehelacademy.b-cdn.net/Ehel%20Primary/qa/…` |
| `quraanacademy` | `BUNNY_STORAGE_ACCESS_KEY` / `BUNNY_STORAGE_ZONE` | `https://quraanacademy.b-cdn.net/Ehel%20Primary/qa/…` |

Measured both ways that day: a file PUT to `ehelacademy` returns 200 with a
matching hash from `ehelacademy.b-cdn.net` and 404 from `quraanacademy.b-cdn.net`;
the `IN-FLIGHT-prequran-fix-20260831` file sitting on the `quraanacademy` zone
returns 200 from `quraanacademy.b-cdn.net`. Neither zone fronts the other, so
picking the wrong pair is a 404 on a perfectly good upload — and, worse, **mints
a cached 404 that burns that filename on that zone**, which is the other half of
why a re-stage takes a new name.

`BUNNY_STORAGE_ZONE` naming the second zone is what makes this easy to get
wrong: it is a STORAGE zone name and reads like the answer to "which pull zone",
which it only is when you staged to that zone. Check where you actually PUT the
file, not what the variable is called.

Do not resolve the ambiguity by probing. A storage listing with the access key
answers "is it there" passively; an edge fetch of an absent path is a write to
the cache.

Two things about `design_version.php` that look contradictory and are not: its
listing globs `local/hubredirect/*.php`, so it **cannot show** a file in
`local_prequran` — but `&reset=1` calls `opcache_reset()`, which is
process-global and **does** clear that file's cached bytecode. Reset AFTER the
real upload; a reset run against a failed upload just recompiles the old code.

### The PHP gate, and the corruption it exists for

`src/moodle` is the source of truth for the Moodle plugins, but until this gate
existed nothing in the npm workflow ever parsed it — PHP was first executed on a
server. `sql_tools.php` sat on `main` broken through several commits, and
`deploy/bbb-live-corrupted-q-files-rescue-20260624-v01.zip` records the same
damage being cleaned up once before that.

The damage is always one shape: a botched global replace turns every lowercase
`p` into `q`, so `<?php` becomes `<?qhq`, `strict_types` becomes `strict_tyqes`.
In a large file it is invisible to diff review.

**`php -l` alone does not catch it**, twice over — which is why `check:php` runs
three checks and none is redundant:

1. **Every file opens with `<?php`.** Ini-independent and instant. Needed because
   with `short_open_tag=Off` — the normal production setting — `<?qhq` is not a
   PHP tag at all, so the file is inline HTML, lints perfectly clean, and PHP
   *serves the source instead of running it*. Nothing executes, `require_login()`
   included, so the file goes to whoever requests the URL.
2. **No p→q markers in the body.** Needed because the damage is not always
   whole-file: `a2fd7041d` was partial. `require_once(__DIR__ . "/config.qhq")`
   keeps a valid opening tag *and* parses cleanly, then fatals at runtime.
   Checks 1 and 3 both pass it.
3. **`php -l` with `-d short_open_tag=1` pinned**, so the parser can see the
   corruption too whatever the local ini says.

Every marker was verified zero-hit across all 610 files before being added. Two
words are deliberately **not** markers: bare `qhq` (`dashboard.php` legitimately
has `$pqhq`, `$pqhplatquiet`) and `exqort` — `live_leadership.php` and
`live_teacher_profile.php` accept `?exqort=` on purpose, a compatibility shim
left over from the June 2026 incident when corrupted pages went live and emitted
those links. Flagging it would be flagging the fix rather than the bug.

Removing any of the three checks makes the gate blind to a real shape of the bug
it was written for.

PHP is found via `PHP_BINARY`, then `PATH`, then the winget package directory —
a freshly winget-installed PHP updates the persistent user PATH but not
already-running shells. If no PHP is found the gate **fails** rather than
skipping: a gate that passes without running is worse than none. Install with
`winget install --id PHP.PHP.8.4 --scope user` (the 8.3 manifest currently 404s).

`check:php` also runs `check-progress-attempted.php`, the one behavioural test
of the progress reducer. Global Perspectives has no score to report — its 315
questions are self-marked free text — so it sends `attempted`
(`{section: {answered, total}}`) on `progress.summary` instead. The property
worth gating is that this can never become a grade: a count reaching
`checkpoint.result` is a coloured percentage in the family portal and a row in
the gradebook, reporting mastery nobody measured. That lives in the reducer's
behaviour, not in any file's shape, so the gate loads the real
`externallib_progress.php` and calls its real private statics by reflection —
a copy of the logic would pass while the shipped code was broken.

**Mutation-tested**, and one mutation survived the first version: deleting the
`sanitise_attempted()` call from `apply_event()` entirely changed nothing,
because every `apply_event` case fed an already-clean payload while the
sanitiser was only tested in isolation. The two were never tested as
*connected*. The fix is the hostile-input-through-the-event-path case — assert
on what is STORED, never on what a helper returns on its own. Same lesson as
the Wehel gate's message-count check, found the same way.

It also pins a pre-existing quirk rather than leaving it to be rediscovered:
`apply_event` ends with `$state['checkpoints'] = (array)…`, and
`(array)new stdClass()` is `[]`, so an untouched checkpoints map serialises as
`[]` rather than `{}` once any event lands. `sql/verify_progress_curriculum_map.sql`
check 7 already works around it. `attempted` does not share the quirk — it is
only ever the untouched `stdClass` or a non-empty map — and the gate asserts
both halves of that.
