<!--
  Extracted from the root CLAUDE.md on 2026-09-12.
  Loads on demand when Claude reads files in this directory,
  so it costs no context in sessions that work elsewhere.
  Cross-cutting rules stay in the root CLAUDE.md.
-->

### Several sessions share this working tree — stage explicit pathspecs

**Never `git add -A`, `git add .` or `git commit -a` here.** More than one session
works in this checkout at once, so the tree routinely holds somebody else's
half-finished change. Run `git status` before every commit and stage the paths you
actually touched.

**Run it BARE. A filtered `git status` is not that check** (2026-09-10). Asking
`git status --short src/.../lesson-app-tools/` before a commit is the natural
move — it is the directory you edited — and it answers only about that
directory. Across several commits that day it printed exactly the two tool files
being committed and nothing else, while seven `grade-1-app/g1v2` lessons in the
same subject carried another session's unfinished 134-line feature. The output
of a narrow status is *indistinguishable* from a clean tree: it cannot tell you
"nothing else changed" from "I did not ask". Same shape as a pathspec that
matches nothing at all, which reads as clean for the same reason. Filter
afterwards to read detail; never to decide whether the tree is clean, and never
before a release, where what else is in the tree is the whole question.

**And then commit with a pathspec, because staging them is not enough.** The
index is shared state and `git add` is not atomic with `git commit`, so between
your add and your commit another session can add its own files — and your commit
takes them. Use the one-command form, which reads the working tree for the paths
you name and ignores whatever else is staged:

```bash
git commit -F <message-file> -- <paths>      # flags BEFORE the --
```

Not `git add <paths> && git commit`. The gap between those two is the whole bug,
and it is milliseconds wide rather than theoretically wide: on 2026-08-24 it fired
twice within minutes, in both directions — one `git add` of two files reported
seven staged, a later `git add` of five also reported seven. Note the shape,
because it is not the one the section above describes: **neither session staged
the other's work.** Each added its OWN files to an index that already held
somebody else's. So "check what your add picked up" is the weak version of this
rule, and `EHEL_COMMIT_REVIEWED=1` cannot see it either — the hook fires on paths,
and by then the paths are already wrong.

Two mechanical notes, both of which cost a failed command or a wrong belief:

- `git commit -- <paths> -F-` fails with "pathspec '-F-' did not match any
  file(s)". Everything after `--` is a path. Message first, or in a file.
- An untracked file has to be `git add`ed before a pathspec commit will see it,
  which reopens the window for exactly one command. Put the `add` and the
  `commit` in one invocation.

The full incident, including the verification trap that follows a `reset --soft`
(**an orphaned commit still answers `git show`** — use `git merge-base
--is-ancestor`), is under "Ask storage properly, and ask it late" below. Worth
reading before a release, because the two failures compound: the thing being
swept in and out of commits that night was the release lock.

A pre-commit hook enforces the part of this that can be enforced. It blocks any
commit that stages a file listed in `tools/hooks/co-edited-files`, prints the
hunks going in, and asks you to confirm they are yours:

```bash
sh tools/hooks/install.sh                    # once per clone; hooks are not tracked
EHEL_COMMIT_REVIEWED=1 git commit …          # once you have actually looked
```

It cannot tell whose hunks are whose — git records nothing about that — so it
does not guess: it fires whenever the risk is present and makes you look. Keep
that list short. A list that grows to cover everything gets routed around with
`EHEL_COMMIT_REVIEWED=1` as a reflex, and then it protects nothing. Note it is
installed into `.git/hooks/` rather than via `core.hooksPath`, because Git LFS
owns four hooks in that directory and pointing `hooksPath` elsewhere disables all
four without saying so.

This is not hypothetical. On 2026-08-20 two commits an hour apart
(`b1b2d077c`, `716fcf128` — Grade 3 and Grade 4 picture books) each swept in
another session's uncommitted work on
`src/prototypes/ehel-academy/shell/subjects/english.js`, so a feature shipped
under a commit message about something else and its own commit landed afterwards
describing code already on main.

Two consequences worth knowing:

- **One file can carry two sessions' work** — `shell/subjects/english.js` is the
  usual one. If `git diff` shows hunks you did not write, they are someone's work
  in progress: leave the file out of that commit, or say so in the message. Never
  revert them to "clean up".
- **A release packages the working TREE, not HEAD.** `deploy-app-version.js` reads
  the files on disk, so cutting a release from a shared tree publishes whatever
  else is sitting in it — that is how v218 and v219 put a feature into production
  ahead of its own commit. `git status` before a release, the same as before a
  commit.

  **That check sees work already sitting in the tree. It cannot see work that
  STARTS while you package**, and the gap is the whole width of the upload. On
  2026-08-27, v301 was cut from this tree while another session had just been
  told by its user to revert `a2414f064` — the topbar, `course-app.js` and
  `course-ui.css`. It held off, unasked, purely because it knew a release was in
  flight; had it started, a revert nobody asked for would have shipped under a
  tag whose message is about the tutoring picker. Exactly the v218/v219 shape,
  reached from the other direction: not stale work found in the tree, but fresh
  work arriving after the tree was found clean.

  Nothing in the tooling covers this. `git status` had passed, correctly, and
  would have passed again a minute later while the tree was being rewritten
  underneath. The release lock is per storage ZONE and stops two concurrent
  *releases*; it says nothing about an ordinary edit landing mid-package. So the
  only cover is the announcement — which is a courtesy that reduces the odds,
  not a control, for the reasons already recorded above. **Say when a release
  STARTS and say when its pointers have flipped**, not just which tag you are
  taking: "I am taking v301" tells a peer nothing about when it is safe to edit
  again, and the window they need to know about is the one between those two
  messages.

  **This is not a release rule, and scoping it to releases cost a peer a wrong
  conclusion within the hour.** A content upload takes no tag and no lock, so it
  got none of this treatment — and it changed what everyone else's checks would
  say. The sequence: a session measured 24 files as stale against
  `.bunny-content-manifest.json` and told a peer so; the owner then authorised
  the upload; the peer compared STORAGE forty minutes later, found the files
  identical, and concluded the manifest had lied. It had not — it was accurate
  at both readings, and the missing fact was an upload performed after saying it
  would not be. Note the manifest has now been accused twice in one evening and
  was telling the truth both times: "the manifest is a claim, storage is the
  fact" is a good METHOD and a false RULE, and carrying it as "the manifest
  lies" would mean ignoring an accurate instrument. **Announce anything that
  changes shared state, not only the things that take a lock.**

  The generalisable half is about shelf life. The tag was re-measured from
  storage immediately before use, because this file says a verified tag goes
  stale in minutes — and the TREE was not re-measured, though it is a reading of
  shared state with exactly the same shelf life. One had a rule written about it
  and the other did not, which is not a reason to treat them differently. The
  same applies to HEAD: the session holding v301 had its local `main` move from
  `a2414f064` to `f45ed2f2a` under it mid-task, because somebody pulled in the
  shared checkout. **In this repo, "the tree is clean at `<sha>`" is a
  measurement, not a fact you established.**

If that pre-release check finds someone else's work in the tree, **do not stash
it and do not ask them to hurry** — build the release from HEAD instead:

```bash
git archive HEAD tools package.json src/moodle \
  src/prototypes/ehel-academy/shell src/prototypes/ehel-academy/shared \
  src/prototypes/ehel-academy/english/shared \
  src/prototypes/ehel-academy/<subject> \
  ':(exclude)src/prototypes/ehel-academy/<subject>/media' | tar -x -C <tmpdir>
```

**Two of those paths look unrelated to the subject you are releasing, and both
are load-bearing for the post-deploy tier check:**

- `src/moodle` holds two things a Bunny release turns out to need.
  `local_hubredirect/wehel_prompt.json` is the Wehel phrase bank, and every
  subject EXCEPT English resolves its narration hashes through it
  (`tools/lib/ehel-wehel-phrases.js`, `CLIP_SUBJECTS`); without it the check dies
  on a Moodle path in the middle of a Bunny deploy. And
  `local_prequran/progress_gatewaylib.php` is where `check-platform-cors.mjs`
  reads the progress gateway's path — **this pathspec used to say
  `src/moodle/local_hubredirect`, and the narrower form bought a silently smaller
  sweep**: on 2026-08-27 the platform check ran inside a release from an archive
  tree, printed "Preflighting 6 endpoint(s)" where there are seven, and passed.
  Six of seven, under a green tick, at the moment an operator trusts it most.
  The check now refuses rather than narrowing, so the narrow pathspec fails
  loudly — but widening it here is the actual fix.
- `english/shared` holds `course-ui.css`, which the other subjects `@import`
  and which `deploy-app-version.js` bundles into each release as
  `design-system.css`. Without it `--plan-json` cannot build the release plan,
  so the app tier goes uncompared.

The recipe went years working because English needs neither — it IS the shared
stylesheet, and it is the one subject with no phrase-bank lookup. It broke the
first time a non-English subject was released through it. Verify by running the
check inside `<tmpdir>` and confirming it reports the same file count as the
repo does; anything less means it compared less.

That English stylesheet is also a live coupling worth knowing: an English CSS
change makes every other subject's app tier stale, because their bundled
`design-system.css` came from it. Intensive English v242 went stale exactly that
way an hour after release, when an English commit touched `course-ui.css`.

**But "stale" is not the question. "Can the drift RENDER" is.** Read literally,
the paragraph above says an English CSS commit obliges you to re-release five
other subjects, and on 2026-08-26 that would have been wrong. English v286
carried a comment-only edit to `course-ui.css`; the tier check duly reported all
five other subjects behind in exactly one file, `design-system.css`. Fetching the
live `app/mathematics/v284/design-system.css` and reading it settled it in one
step: it already carried the `.deck-only` rule, and it carried the exact comment
block the commit REPLACED while carrying none of the new one. So the drift was
comments, and comments cannot render.

Releasing the five anyway would have spent five tags and put five untested
bundles in front of learners to synchronise a comment. The English-only release
was correct, and the sentence to carry forward is that the five are "stale on the
shared stylesheet" — which is a different claim from "behind", and one you can
only turn into a decision by fetching the live bundle and diffing it.

The general form is the one this file keeps arriving at from other directions:
`check-ehel-deploy-sync.mjs` compares HASHES, so it answers "are these bytes the
same" and never "does the difference matter". That is the right design — a gate
that tried to judge significance would start passing real drift — but it means
its ✗ is the START of a question. Ask the bundle, not the tick.

then run the deploy from `<tmpdir>`, copying `.env` and the
`.bunny-*-manifest.json` caches in so the uploader still skips what is already on
storage. `git worktree add` is the obvious answer and the wrong one here: a full
checkout of this repo is 1.4 GB of media, it takes minutes, and when it is killed
part-way it leaves `tools/` missing and the index reporting tens of thousands of
files as deleted — which reads as catastrophic damage and is not.

**Copy THREE manifests for an app release, because the upload and the check that
follows it read different ones.** `deploy-app-version.js` skips what is already
on storage using `.bunny-appver-manifest.json` alone; the post-deploy tier check
reads that one **plus** `.bunny-content-manifest.json` and
`.bunny-upload-manifest.json`. Copy only the uploader's — which is what "the two
caches" used to read as — and the check has nothing to compare. English v238 and
v239 both shipped that way; both times the missing one was
`.bunny-upload-manifest.json`. (`.bunny-app-manifest.json` is a fourth file and
belongs to the older `upload-app-to-bunny.js` path — copying it does nothing for
a versioned release, which is a way to believe you have brought the manifests
along when you have not.)

Until 2026-08-22 that failure was **invisible and looked like success**:
`check-ehel-deploy-sync.mjs` exits 0 when the tree has no manifests, which is
correct on its own (a fresh checkout genuinely has deployed nothing), and
`require-tiers-in-step.js` read that 0 as agreement. So a real production upload
ended with

```
No deploy manifests present — nothing has been deployed from this checkout. Skipping.
✓ app, content and audio agree for everything this deploy touched.
```

— a tick over a comparison that never ran, printed at the moment an operator is
most likely to believe it. The tiers were out of step both times.

The check now takes `--after-deploy`, which the wrapper passes: with it a missing
manifest is **exit 3** and the wrapper says the tiers were NOT checked, which is
neither agreement nor drift because either would be a guess. Standalone
behaviour is unchanged. **A release from a temporary tree without all three
manifests therefore ends non-zero now** — the upload still stands, since this is
a post-step, but you no longer get to mistake it for a pass. If you see exit 3,
the answer is to re-run the check from the repo:

```bash
node tools/check-ehel-deploy-sync.mjs english
```

Two more things the archive recipe does not cover, both found by releasing a
NON-English subject through it:

- **`git archive HEAD` as written above is English-shaped.** Intensive English's
  tier check reads `src/moodle/local_hubredirect/wehel_prompt.json` through
  `tools/lib/ehel-intensive-narration.js`, which the pathspec list does not
  include, so the check dies with `ENOENT` after a perfectly good upload. Add
  `src/moodle` to the archive for those subjects, or accept that the check has
  to be run from the repo afterwards.
- **A check that CRASHES is still reported as drift.** The exit-3 path above
  covers a missing manifest; an uncaught exception exits 1, and the wrapper then
  prints "this deploy leaves the tiers out of step", which is a verdict it never
  reached. Same class as the ✓-after-skip, one case short. If you see that
  message with a stack trace above it, the tiers were not compared at all.

#### A mutation harness is a WRITER in this tree, and it restores from a snapshot

Every gate in this file described as "mutation-tested" works the same way:
snapshot the files once, break one, run the gate, require a failure, restore.
The rebuilt Wehel harness earned that shape by leaving two files mutated on
disk, and the rule it bought — *a harness that cannot prove it put the tree back
is not evidence about anything it printed* — is right and is not enough here.
**It verifies the restore against ITS OWN snapshot, so it is fully satisfied by
a tree it has just overwritten with somebody else's older content.**

Worked example, 2026-09-10: `mathematics/lesson-app-tools/mutate-answer-keys.py`
was run three times over `grade-1-app/g1v2` while another session was adding a
134-line header-bar feature to all seven lessons there. Each case rewrites a
whole file and restores it, so a peer write landing inside that window is
replaced by the snapshot and never reported. Nothing was lost — verified
byte-for-byte on the third run against an independent copy taken first — but the
first two runs were luck rather than design, and the failure mode is the worst
kind: their edit simply gone, no error, no conflict, nothing to notice.

Two cheap habits, and the first is the one that turns luck into a measurement:

- **Copy the files the harness will touch to the scratchpad first, and `cmp`
  them afterwards.** It costs one command and converts "probably fine" into
  evidence. It is also the only thing that can detect this at all.
- **Look at a bare `git status` before starting**, and do not run a
  whole-suite mutation over a build somebody else has open. A per-`--app` run
  confines the blast radius to one build.

This is not specific to that harness. It applies to every mutate-and-restore
tool here, and to anything else that rewrites tracked files in place —
`repair-*` scripts, the renormalise-style fixers, `--write-fixture` runs. A tool
that assumes it is the only writer is correct in a private clone and wrong in
this one.

#### Committing half a co-edited file: `git apply --cached`

`git add <path>` is all-or-nothing, so the first bullet above — "leave the file
out of that commit" — is the only advice the tooling supports, and it means your
work waits on somebody else finishing theirs. It does not have to. Generate the
diff, classify each hunk, write a patch of your hunks alone, and stage that:

```bash
git diff -U3 -- <path> > /tmp/all.patch     # then keep only your hunks
git apply --cached /tmp/mine.patch          # stages those hunks, tree untouched
```

The working tree keeps the other session's edits; only the index gets yours.

**Then grep the STAGED diff for their identifiers.** This is the step that
matters, and skipping it staged the wrong hunks on 2026-08-24:

```bash
git diff --cached -- <path> | grep -nE 'taughtWords|STORY_GLOSSARY_GROUP|…'
```

Two ways the classification goes wrong, both of which look right while doing it:

- **Line numbers are not stable.** They are a function of the context width, so
  every hunk start shifts the moment you regenerate at a different `-U`. A
  classifier keyed on them silently retargets.
- **"Everything after my first hunk" is proximity pretending to be ownership.**
  It fails on the real layout of these files rather than on a contrived one: in
  `shell/subjects/english.js` the shell's `config` object sits BELOW the
  worksheet code, so another session's `onBeforeRender` edit was *after* the
  first worksheet hunk and sailed through on position alone.

Same shape as the recognition-check trap recorded below — a heuristic that
happens to agree with the answer on the cases you built it from. The difference
is that here you can check it directly, because the index is readable: after
`--cached`, ask what is actually staged rather than what you meant to stage.

#### Git cannot tell you whose commit it is, and three sessions proved it (2026-08-27)

```bash
git log --format='%an <%ae>' -20 | sort | uniq -c
#  20  hwarsame <hassanwarsame@gmail.com>
```

One identity, every commit, because every session commits as the same person.
So **per-session authorship is not recorded and cannot be** — not hard to find,
absent. The only handles are the commit subject line and what a session says
about itself.

That is worth writing down because of what it does to the fix. Three attribution
errors happened in one evening between two sessions — a dirty file attributed to
whoever was in the conversation, a contact inferred from the same fact, and four
unpushed commits assigned to "the tutoring session" from their subject lines.
The reflex reading is carelessness, and it is wrong: **the fact does not exist,
so care cannot supply it**, and "be more careful" against an unavailable fact
just produces a more confident guess.

Every one of those three inferences was also *probably right*, which is what kept
the habit alive through three repetitions. So the correction has to be about the
FORM of the claim rather than its accuracy: say what you can establish and let
the gap show. "One is mine because I made it; three are not mine; whose they are
is unknowable from here" is thinner than "three are the tutoring session's" and
is the only version that survives being wrong. Same move as reporting exit 3
rather than a tick.

The pre-commit hook already works this way and is worth reading as the pattern
rather than as a nuisance: it cannot tell whose hunks are whose, so it does not
guess — it fires whenever the risk is present and makes a human look.

#### A commit can be LIVE and on no remote, and `git status` is silent about it

Found the same evening, after four releases from this checkout. Three commits
were serving learners in v304 and existed on **neither** remote:

```bash
git rev-list origin/main..HEAD    # before any release, and before you report "pushed"
git rev-list backup/main..HEAD    # CLAUDE.md names TWO copies; check both
```

A release archives HEAD, so it publishes whatever is committed locally —
pushing is a separate act nobody's release performs. The deployed bundle is not
a recovery path: `course-app.js` has its imports rewritten by
`deploy-app-version.js` and there is no `english.js` on the CDN at all, so the
only copy of those three features' source was one disk.

Two traps, both hit within minutes of each other:

- **"Is my commit on origin" does not answer "what is riding underneath it".**
  The session that flagged this knew what IT had not pushed and reported that as
  the state of the branch; there were four commits, three of them somebody
  else's, all ancestors of the one being asked about. `is-ancestor` on your own
  sha answers about you. `rev-list origin/main..HEAD` answers about the branch.
- **Checking ONE remote and reporting it as "the remote".** This file names
  `backup` as the second copy precisely for this, and it was exactly as far
  behind as origin — so "not on origin" read as "not backed up anywhere" only by
  luck. Check every remote this file claims as a copy, not the one you push to
  first.

**And there is no scoped push.** Those commits are ancestors, so a push of your
own work publishes everyone's whether you like it or not — git offers no way to
push one and not the other, and cherry-picking onto a side branch to invent one
is worse than the problem. Say so before pushing rather than after: an
instruction to push your work is not authority over anybody else's, beyond what
git forces on you.


### Diff the BUNDLE with --plan-json, never the files on disk

`deploy-app-version.js --plan-json` prints `{remote, sha1}` for every item a
release would write, needs no `BUNNY_KEY`, and uploads nothing. Compare those
hashes against the live `v{TAG}/` equivalents to see what a release actually
changes.

**Comparing a live bundle against its repo source instead gives false
positives**, because the build rewrites imports on the way in:
`shellSubjectModule()` and `shellCore()` (`deploy-app-version.js`) rewrite
`../../{subject}/shared/X.js` and `../../shared/X.js` to `./X.js` so they
resolve inside the version path. So `course-ui.js` and `course-app.js` are NEVER
byte-identical to the files they were built from. Only verbatim-copied
components — `wehel.js`, `deck.js`, `word-pictures.js`, `lucide.min.js` — can be
compared that way, which is exactly why grepping a live bundle for a marker
string appears to work right up until it silently does not.

This is the form of "verify what shipped, not what you wrote" that survives a
build step. The weaker form — grep the deployed file for a string you expect —
is fine for a verbatim component and misleading everywhere else.

#### A marker proves presence, not correctness (2026-08-25)

Marker-grepping has one honest use, and the night of six-plus releases pinned
down exactly where its edges are. When another session's release supersedes
yours — which happened to English three times in one night, twice announced to
nobody who was watching that subject — grepping the LIVE bundle for your
feature's identifiers is the cheap check for "did my work survive at all". It
was run three times that night; all three survived. Use it, with both caveats:

- **Do not derive safety from provenance instead of checking.** "The release
  was built from current HEAD, so it carries my committed work by construction"
  was argued that night and is wrong: a CURRENT tree can carry your feature
  edited, narrowed or deleted by another session that committed properly —
  `shell/subjects/english.js` was edited by four sessions in one night, so this
  is the existence proof, not a hypothetical. Stale trees are one danger case,
  not the only one. This is "HEAD is a cleaner input, not a safety property"
  (above, for content tiers) re-landing on the app tier.
- **A marker is a claim about presence read as a claim about behaviour** — the
  same shape as `uploaded: 2`, HTTP 200 on a missing directory, and
  `already uploaded: N`. Rename a function, narrow a filter by one clause,
  change a constant: marker intact, feature gone.

So the honest ordering: a marker grep is the cheap NECESSARY condition, good
for "did my work survive at all" after somebody else's release; behaviour
exercised against the live bundle is the SUFFICIENT one, worth its cost on
releases you cut yourself and whenever a marker check surprises you. And note
where a typical careful release actually sits: markers against the live bundle
plus behaviour verified in a browser against the same COMMIT is still one build
step short of behaviour against the shipped bundle itself — a small gap, not a
zero one.

One companion practice from the same night, because the superseding releases
were the trigger: **an unnamed release stamps all six subjects, so announce it
as "vNNN, all six".** The v271 announcement named only the subject that
motivated it, and a verified English deployment was superseded with no signal —
nobody did anything wrong, and the take-a-number convention cannot cover it,
because that convention is about who holds a number and this is about who owns
a subject.

### `.bunny-appver-manifest.json` is CONTENDED, and a wrong entry is silent

Several sessions share this checkout, so they share this file, and
`deploy-app-version.js:520` is why that matters:

```js
const todo = all.filter((x) => x.always || manifest[x.remote] !== sha1(x.buf));
```

The manifest decides what a future upload **skips**. A wrong entry is therefore
not noisy — the file simply never goes up, and `--verify` still passes, because
it only confirms that the bytes at that path arrive, not that they are the
current bytes. Identical shape to the `.bunny-upload-manifest.json` trap
recorded above for Computing — "a local cache, not a record of the CDN", where
630 clips sat generated-but-undeployed behind entries claiming they were up —
and to the ✓-after-skip: silence read as success.

Note what this is NOT. Both manifests compare a content hash, so neither can be
fooled by a file whose CONTENTS changed under an unchanged name; that was the
old claim about re-recorded audio and it was wrong (corrected above). The live
failure is the opposite direction — an entry that is *right about the bytes* and
wrong about whether they ever reached storage. Nothing local can tell those
apart, which is why the repair is to list storage and compare, not to reason
about the manifest.

Treat it as shared. Copy it into a release tree and back out again if you must,
but know that writing it while another session is mid-release overwrites their
record of what they just uploaded. That happened on 2026-08-22 with two other
releases in flight; nothing broke, and nothing would have said so if it had.

**So do not copy it BACK. Merge.** The paragraph above names the hazard and then
prescribes the operation that causes it, which is worth fixing in place:
"copy the manifests in and back out" is right on the way in and wrong on the way
out. On the way out, read the repo's CURRENT manifest, apply only the entries
your release wrote, and write that — the other session's entries survive because
you never held a stale copy of them in the first place.

**Keep the copy-in snapshot, and merge against THAT.** A two-way diff of the
release tree against the repo cannot do this, and the first version of this
paragraph got it wrong in a way worth keeping as the worked example:

```js
for (const [k, v] of Object.entries(rel)) if (repo[k] !== v) repo[k] = v;   // WRONG
```

`rel` is not "your entries" — it is the baseline you copied in PLUS your
entries. So for a key that already existed and that another session UPDATED
while you ran, `repo[k]` is their fresh value and `rel[k]` is the stale one you
carried in; they differ, the loop writes the stale value back, and their entry
is gone. That is the clobber, reintroduced by the code written to prevent it.
Nor is it a corner case: the pointer files every release rewrites — the
per-subject `index.html`, `current.json`, `shared/grade-redirect.js` — already
have keys, so two overlapping releases collide on exactly those.

Two-way cannot distinguish "I wrote this" from "they wrote this", because that
information is in neither file. It needs a third input: the baseline, or the set
of remotes this run actually uploaded (`deploy-app-version.js` computes that as
`todo`, which is authoritative and needs no snapshot).

```bash
cp .bunny-appver-manifest.json "$TMP/.bunny-appver-manifest.base.json"   # at copy-in
```
```js
const base = JSON.parse(fs.readFileSync(`${TMP}/.bunny-appver-manifest.base.json`, "utf8"));
const rel  = JSON.parse(fs.readFileSync(`${TMP}/.bunny-appver-manifest.json`, "utf8"));
const repo = JSON.parse(fs.readFileSync(".bunny-appver-manifest.json", "utf8"));
for (const [k, v] of Object.entries(rel)) if (v !== base[k]) repo[k] = v;   // only what THIS run wrote
```

**Ask the baseline which case you were in**, because it is the only thing that
can tell you: any key where the repo's copy now differs from your baseline was
written by somebody else while you ran — added OR changed. Comparing against the
release tree instead sees only the ADDED half, and the changed half is precisely
what the broken loop damages, so the weaker check reports clean on the one case
that matters.

On v306 (2026-08-27), measured after the fact: 103 entries written, **all of
them `/v306/` paths**, 0 keys added by another session, and 0 non-`v306` keys
touched. So that run was genuinely clean and a straight copy-back would have
been harmless — but it was clean because no other release overlapped it, not
because the check would have caught one.

**Every measured instance so far is clean, and that is the expected reading
rather than the reassuring one.** v302-v305 were all copy-backs; all 309 of
their entries were checked against storage and every one agrees with what is
actually held, and the v306 entries written afterwards are intact. No damage —
but the reason is sequencing, not care: the only appver writers are app
releases, and no two of those overlapped. A release landing between somebody's
copy-in and their copy-back would have lost its entries. That is the whole
argument in one sentence: **the copy-back's correctness depends on something the
person performing it cannot see** — whether anyone else released inside their
window — and the merge's does not.

So a note recording only bad outcomes would never have been written here. Every
instance of this hazard is still in the future.

Checking the entries against storage is the cheap confirmation and takes a
couple of minutes for a release's worth: fetch each remote the release wrote and
compare. It cannot find damage retroactively in general — a clobbered entry that
has since been re-uploaded looks correct — but run after a release it confirms
the entries that release just wrote.

**The unsafe case leaves no trace at all.** A clobbered entry does not fail the
release that causes it. It fails a FUTURE upload, silently, by claiming a file is
already on storage — so the damage surfaces weeks later as a file that never
deploys, with nothing connecting it back to the release that ate the record.
There is no run to inspect, no log line, no failed check. Which means the merge
is not a refinement of the copy: it is the only version of the operation whose
correctness you can establish at the time you perform it.

Preserve the file's formatting when you write it — it is one single-line JSON
object, and re-serialising it pretty would rewrite 8,000 lines under whoever
reads the diff next.

#### One file is skipped on trust AND verified by nothing

`shared/grade-redirect.js` falls through both safeguards at once, and neither is
broken. Found 2026-08-26 while accounting for English v286.

- The manifest skips it when `manifest[x.remote] === sha1(x.buf)` — the trust
  path this whole section is about, where a wrong entry means the file is never
  sent and nothing says so.
- `--verify` cannot see it. `verifyRelease()` builds its read-back list as
  ``items.map((i) => i.remote).filter((r) => r.includes(`/${TAG}/`))``, and the
  stub is deliberately unversioned so the entry path `grade-N/index.html` stays
  stable across releases.
- The rescue that would otherwise catch it does not reach it either.
  `verifyRelease` also resolves what the ENTRY references rather than only what
  was uploaded — added because `versionIndexHtml()` rewrites computing's
  `brand-fx.js` into `v{TAG}/` while `shared/brand-fx.js` is untracked, so a
  clean checkout points the entry at a file it never sent. But that loop selects
  `/^app\/[^/]+\/index\.html$/`, the SUBJECT entry, and `grade-redirect.js` is
  referenced from `grade-N/index.html`, which the pattern cannot match.

**Half of it is safe and that is why this has never bitten.** The manifest
compares a content hash, so it cannot be wrong about CHANGED bytes: edit the
stub and it uploads. The exposure is the other direction, the same one recorded
above — an entry that is right about the bytes and wrong about whether they ever
reached storage. It bites only a release that DEPENDS on new redirect behaviour,
which would pass 16/16 and be broken on the CDN.

The guard is passive, costs nothing and mints no cached 404, because it reads
STORAGE rather than probing the edge. Take the expected hash from the release
plan, which needs no `BUNNY_KEY`:

```bash
node tools/deploy-app-version.js <tag> --shell --plan-json english   # sha1 per remote, uploads nothing
curl -s -H "AccessKey: $BUNNY_KEY" "https://storage.bunnycdn.com/ehelacademy/Ehel%20Primary/app/english/shared/grade-redirect.js" | sha1sum
```

Run on v286: both `30c9606829b5ef784ea1d6dbcf7d2f869b123058`, 920 bytes.

**Scope this honestly.** It is demonstrated for exactly one file, on one
release, where it did not bite — a real hole, and NOT yet evidence about any
other pair of checks in this repo. What is worth carrying is the shape: two
safeguards that are each complete on their own, with a file between them that
was invisible because each one could point at the other. That is a step past the
failures elsewhere in this file — the ✓ printed after a skip, the gate that is
green about an unreachable feature — because here neither check is doing nothing.
Their union has a hole, and no single check can report it.

#### `--dry` prints the RELEASE, not the upload set

The per-file list under a `--dry` run is every item the release CONTAINS. It is
not what will be sent, and a file appearing in it says nothing about whether the
manifest will skip it:

```js
// tools/deploy-app-version.js
const todo = all.filter((x) => x.always || manifest[x.remote] !== sha1(x.buf));  // :581
console.log(`items: ${all.length} | to upload: ${todo.length} …`);              // :583 — only the COUNT
if (DRY) { for (const item of all) console.log(…); }                            // :585 — iterates `all`
```

Read as an upload list it inverts the answer for exactly the files this section
is about. On 2026-08-26 a science+computing release was planned by reading that
list, and the conclusion drawn was that `app/computing/shared/grade-redirect.js`
was being uploaded while `app/science/shared/grade-redirect.js` was being
skipped. **Both were skipped** — the two stubs are byte-identical
(`17afd85ca4b5…`, 845 B) and both matched the manifest. The inference pointed at
dropping the check on computing's stub, which sits on the identical
invisible-to-`--verify` path as science's, so the file that most needed the
storage comparison was the one the reasoning excused.

**Two compounding errors produced that, and the second is the one to learn
from.** The first is reading `all` as `todo`. The second is that the command was
run as `--dry … | tail -45` against 50 lines of output, and the 5 discarded lines
were:

```
tag: v287 | subjects: science,computing …
items: 44 | to upload: 42 (4 pointer files always sent)   <- the refutation
    34976B  app/science/v287/course-ui.css
    13760B  app/science/v287/geometry-webgl.js
      845B  app/science/shared/grade-redirect.js          <- one of the two files being compared
```

So the asymmetry between the two stubs was **manufactured by the truncation**:
science's line was cut, computing's survived, and two byte-identical files on
identical paths appeared to be treated differently. And `items: 44 | to upload:
42` — the arithmetic that refutes the whole inference — was printed immediately
above the list being misread, at PLAN time, and thrown away by the same pipe.
This was not corroboration discovered afterwards; the refutation was on screen
before the wrong belief was formed.

**`tail` a tool's output and you discard its summary first.** These tools print
counts before detail, so a pipe that keeps the end keeps the least
interrogatable part. Where the question is "what will this do", read the header,
not the list.

Reproducing this today prints `to upload: 4`, not 42: v287 has since been
released, so the manifest records those files and only the four always-sent
pointers remain in `todo`. The 42 is specific to the pre-release run. A count
that does not reproduce is the expected behaviour of a manifest-driven tool, not
a sign this entry has gone stale.

**This is the INVERSE of the rest of this section, and that is why it is worth the
space.** Everything else here is a check that silently does no work: a ✓ after a
skip, a gate green about an unreachable feature, a parser matching nothing. Here
nothing malfunctions and nothing is missing. The output does exactly what it says,
and the reader supplies the error. It shares that shape with the platform probe
writing its own `OPTIONS … 204` lines into the access log it is used to read
(recorded above, same day) — the two failures here that are a PRESENCE rather
than an absence. An absence you can go looking for; a presence has to be
recognised, and the extra data is what misleads you.

To learn what a release will actually SEND, compare `--plan-json`'s `sha1` per
remote against `.bunny-appver-manifest.json` — or skip the inference entirely and
compare the plan against storage after the fact, which is what the guard above
does.

#### `| head` on a deploy does not truncate the output, it KILLS the upload

The section above is about `tail` discarding a tool's summary header. `head` is
the same reflex and a worse failure, because the damage is not to what you read:
`head` exits at its line count, node takes SIGPIPE, and **the upload stops where
it stands.** Redirect the whole run to a file and read the file:

```bash
node tools/deploy-app-version.js vNNN --shell --verify > "$SCRATCH/deploy.log" 2>&1
```

On 2026-08-26 `… v288 --shell --verify | head -40` died at **65 of 126 files** —
and pointers are written per subject as that subject finishes, so
`app/english/index.html` and `current.json` had ALREADY been flipped to v288.
English's live pointer referenced `v288/lucide.min.js`, which never uploaded, so
every icon in the English shell was an empty `<i>` for about twenty minutes.
Mathematics happened to complete before the kill; the other four never had their
pointers flipped and stayed safe on their previous bundles throughout. **A
partial release is not uniformly partial** — which subjects are live on the new
tag is decided by where in the sequence it died.

**Do not complete the half-written tag, and do not probe it.** The manifest is
written back only at the end, so a killed run records nothing, and the retry is
refused by `tagAlreadyWritten` — "identical bytes … but this checkout never
uploaded it" — which is correct: from the manifest's side your own dead run is
indistinguishable from a stranger's release. `--force-tag` would get past it and
is still the wrong move, because a version-path 404 is edge-cached 37+ hours and
cannot be purged with the key in `.env`. If a learner hit the missing file in
those minutes, that miss is cached and overwriting the tag does not reach them —
and checking whether one did is itself the thing that mints it. Roll forward to a
fresh tag, which is the remedy the tool's own error prints first, and leave the
spent tag in place: the v262 precedent, where deleting an orphan would convert it
into an unpurgeable 404.

**And verify from storage, never from the run's own output** — the output is
exactly what a SIGPIPE takes away. Compare `--plan-json`'s remotes against a
storage listing, then read each subject's `index.html` and confirm every
`v{TAG}/` file it references is actually there. That comparison is what found
this; the truncated log looked like a healthy release scrolling past.

### A pre-commit check shaped like recognition cannot see a new feature

Three sessions swept each other's work into their commits over 2026-08-21/22 —
twice a single line, once a whole feature (211 insertions of another session's
grade dictionary, under a commit message about handwriting). The instinct after
the first two was to grep the staged diff for the markers that had already
caught people: `dictionaryPicture`, `wordPicture`, `wehel`. That grep came back
clean on the third, because **an allowlist of yesterday's accidents can only
find yesterday's accidents.**

What worked was the opposite move: reading the hunk headers and stopping at
function names the author did not recognise. Scan for the UNFAMILIAR, and treat
"I do not know what this is" as the signal — it is the only check here that does
not require having been burned by the specific thing first.

The same shape runs through every deploy bug in this file: a check that can only
see what it was told to look for, reporting silence as a pass.

### The release tag is ONE GLOBAL number, shared by every subject

`v{TAG}` is a release number for the platform, not a per-subject counter. A
release with no subject named stamps all six subjects with the same tag, so the
same number exists under several `app/{subject}/v{TAG}/` directories and means
the same release. Naming a subject leaves the others behind, which is where the
gaps come from — on 2026-08-22 English stood at v242 while Mathematics, Science,
Computing and Global Perspectives all sat at v237 from the last full release.

Measured, not inferred: **38 tag numbers exist in both `app/english/` and
`app/intensive-english/`**, and the other four subjects share v233-v237 exactly.
`nextFreeTag()` in `check-ehel-deploy-sync.mjs` matches that — it scans
`app/[a-z-]+/v(\d+)/` across EVERY subject in the manifest and returns the
global maximum plus one.

So the rule is the simple one: **take the highest v{N} across ALL subjects and
add one.** Do not reason from a single subject's own series. Intensive English's
highest was v237 on 2026-08-22 and v238 was NOT free — English was already four
releases past it.

Three ways to get this wrong, all seen the same day:

- **Listing ONE subject's directory and adding one.** This is the trap, because
  it is right about as often as it is wrong and nothing tells you which case you
  are in. Two sessions used exactly this method within an hour: listing
  `app/english/` gave v242, which was correct only because English happened to
  hold the global maximum; listing `app/intensive-english/` gave v238, which was
  four releases stale. Same method, opposite outcomes, decided entirely by which
  subject was in front of you. A number that is right by luck is worse than one
  that is plainly wrong.
- **Trusting the tool's number without checking storage.** It reads
  `.bunny-appver-manifest.json`, which is per-worktree, so it reports whatever
  this checkout happens to have released. It said "next free: v241" while
  English's v241 was already live from another session. The manifest is a local
  cache; storage is the fact. List all six subjects and take the true maximum.
- **Two sessions releasing at once.** Both compute the same next number from the
  same storage state and both write it. That happened: Intensive English v242
  and English v242 were released an hour apart by different sessions, each
  correct in isolation. Nothing broke — the directories never meet, and each
  release verifies clean — but the global sequence now has a duplicate, and
  "v242" no longer identifies a release without naming the subject too. **If
  another session may be releasing, say which tag you are taking before you
  take it.**

#### Ask storage properly, and ask it late (2026-08-24)

Six app releases landed on the night of 2026-08-24 — v257 through v262, four of
them English — from several sessions sharing this checkout, and every rule above
was exercised. What follows is what they added. (How many sessions is
deliberately not stated: peer session names are opaque and two of them claimed
the same tag, so the count is not something that was ever established.)

**A tag verified free has a shelf life measured in MINUTES.** Three separate
"next free" answers went stale that night between being measured and being
used — v259, v261 and v262 — each because another session released in the gap.
One of them was passed to a user as free in the same message it stopped being
true. So re-measure at the point of use, not the point of planning: the listing
belongs immediately before `deploy-app-version.js`, not in the paragraph where
you decided to release.

**Probing a candidate path does not answer the question, and answers it wrongly.**
`GET app/<subject>/v{N}/` returns **HTTP 200 with an empty JSON array** for a
directory that does not exist. Measured: a probe of a then-unwritten tag across
all six subjects returned 200 six times out of six, and the same listing showed
0 objects in every body. So a status check reports EVERY candidate tag as taken,
including free ones. Read the body and
count objects: a real tag holds 15-ish, a free one holds 0. This is the concrete
mechanism behind "list storage, never probe"; the rule was written from the
CDN-side hazard (a probe against the edge mints a cached 404 that cannot be
purged with the key in `.env`) and the storage side fails differently and just
as silently.

**How long that cached 404 lasts depends on the PATH SHAPE, and the gap is five
minutes against at least 37 hours.** Measured 2026-08-26, around the v285/v286
releases: an entry-path 404 carries `max-age=300`, while a version-path 404
survived **37+ hours and was never observed to expire**. The contrast is what
makes "never probe" usable rather than blanket. Never probe a `v{TAG}/` path
before its upload lands — the mistake is effectively permanent, the key in
`.env` cannot purge it, and it has already cost one session a real five-minute
outage and a burned tag. An entry path is cheap to be wrong about, because it
clears itself in five minutes. Storage reads with the access key are passive and
answer the same question without minting anything.

**The rule is about PROVING ABSENCE, not about `v{TAG}/`, and filing it under
the path shape is what let two sessions break it in one evening (2026-08-31).**
Both had this passage, both applied it correctly to version paths all night, and
both then fetched a MEDIA path through the edge to confirm a file was missing.
Media carries `max-age=31536000`, so each miss minted a year-long cached 404:
one on `app/english/v356/english.js`, two on
`app/english/grade-8/media/unit-1/teacher-lecture.3f8b63f5.mp4` and its poster
(`CDN-Cache: HIT`, `CDN-CachedAt` stamped at the moment of the probe). **To
prove a file is absent, ask STORAGE with the access key. A storage read is
passive; an edge read is a WRITE to the cache.**

Note the failure shape, because it is the opposite of the ones this file mostly
records. A broken check announces itself — a total-failure verdict on something
known-good, three of which happened the same evening. This one returns exactly
the answer you expected and costs nothing you can see; the damage is created BY
the confirmation and is invisible until somebody goes looking.

**Two of those three 404s are recoverable-by-luck and one carries a live trap.**
Nothing references any of them today. But `version-lecture-video.js --salt` is
DETERMINISTIC — `shortHash` is `sha1(contents + salt)` — so re-running it with
the same salt over the same bytes reproduces the same name. Verified: for Grade 8
Unit 1's trimmed lecture, `sha1(bytes + "tail-20260831")[:8]` is `3f8b63f5`,
which is now a cached 404 until 2027-08. **Never reuse the salt
`tail-20260831`**, and treat any salt as burned once its output has been probed:
a salt is not a nonce, and picking a fresh string costs nothing. Its whole
purpose is to mint a path nothing has ever requested, which a reused salt is
not.

It cuts the other way too, and that half is about `app/shared/fonts/`. Assets
exempted from the version path sit on ENTRY paths, so a correction to one lands
within five minutes instead of waiting on a new tag — but the same fact means a
release's font depends on a short-cached fetch rather than on the immutable
`v{TAG}/` copy the rest of the bundle gets. Good trade, worth knowing you made
it.

Same standing caution as the cache-control table above, and for the same reason:
these are edge-rule numbers, not properties of the path, so they can change
under the repo with no commit to notice. Re-measure before relying on either.

**Announcing is point-to-point, so "I announced" and "nobody was told" are both
true at once.** This is the finding, and it is worth more than the convention it
kills. That night one session announced v261 to a second session — which is the
only reason those two did not collide — and not to a third, which had just told
its user v261 was free. From the third session's side the release was
unannounced and its verified number went stale; from the first session's side it
had announced. Nobody can distinguish "not announced" from "not announced TO
ME", and a convention requiring every session to broadcast to every other fails
silently the first time one pair is missed.

**Then it failed with both parties complying, which is the case that settles
it.** Later the same night two sessions took v263 for English, for the same
commit, minutes apart. Both announced before writing. Both listed all six
subjects on storage and both got the right answer. Both said which subject and
which tag. Each did everything this section asks — and they announced to
DISJOINT sets of peers, so neither heard the other, and both proceeded believing
they had coordinated. It was caught only because a third session happened to
receive both messages and warned them; without that accident the second write
would have gone out. There is no broadcast channel here, and no session can see
the set of sessions, so "I announced" cannot be strengthened into "everyone
knows" by trying harder.

So: **announce anyway** — name the subject, the tag and the moment it lands; it
costs nothing, and it is what stopped the v261 collision. But it is a courtesy
that reduces the odds, not a control that prevents the failure. The controls are
the two things that reach a session nobody can enumerate: the zone lock below,
which is in the tool every release runs, and the take-the-global-maximum rule
above, which is in this file every session reads at startup. A convention lives
only in the messages people remember to send.

**The control is `tools/lib/release-lock.js`**, one lock per storage ZONE, held
from before `.bunny-appver-manifest.json` is read to after it is written back
(the read-modify-write is half of what is being protected). It lives in the OS
temp dir, deliberately NOT in the repo: releases here run from `git archive`
temp trees, so two concurrent releases have two different repo roots and a lock
beside the manifest would be a lock each session held against itself — it would
contend with nothing and pass every test. Stale locks break on a dead pid or a
30-minute TTL and always report it; `--dry` and `--plan-json` neither take it
nor wait for it, because a plan is exactly what somebody blocked by the lock
wants to run.

**Byte equality proves a release is correct, not that it is YOURS.** The old
guard refused a tag that existed with DIFFERENT bytes and let identical bytes
through, reasoning that a retry after a failed upload is not a second release —
true for one writer, false for two. Two sessions told to release english v261
from the same HEAD produced byte-identical bundles, so every check passed for
the second one, and the damage would have been a silently clobbered
`.bunny-appver-manifest.json`, which decides what a FUTURE upload skips: the
loss surfaces weeks later as a file that never deploys. `tagAlreadyWritten` now
takes the manifest and refuses identical bytes that this checkout has no record
of writing, which separates our retry from a stranger's release without breaking
retries. It also makes the temp-tree recipe's "copy the manifests in and back
out" load-bearing rather than housekeeping — a release tree without them now
fails this check, correctly, because it genuinely cannot tell whose release it
is resuming.

**Do not test release tooling with a real release.** `v262` exists because a
session testing a new lock planted a held lock and ran a real release to watch
it refuse — from a `git archive HEAD` tree built BEFORE the lock existed, so the
old tool ran, with a real key and a real tag, and shipped. It is byte-identical
to v261 so nothing regressed, and it is deliberately NOT deleted: a version path
is edge-cached for a year, so deleting it converts a harmless duplicate into an
unpurgeable 404. A spent tag number is much the cheaper failure. The general
trap is that an archive tree is a snapshot of HEAD, so it cannot contain the
uncommitted change you are trying to exercise — testing new tooling from one
tests the old tooling.

**Two of these fixes were swept into somebody else's commit, and then vanished
with it.** `release-lock.js` and the `tagAlreadyWritten` change landed in
`5236df358`, whose message is "English: Grade 8 Unit 7 kept its source list's
numbers inside the words" — release-safety work committed under a message about
vocabulary, because `git add` is not atomic with `git commit` and the index is
shared. Its author then noticed (`git show --stat` reported seven staged files
where five were asked for), ran `reset --soft` and re-committed their own five
as `cbd49170d`. **So `5236df358` is not on main at all** — and for about twenty
minutes neither fix was, while its author believed both were. They are on main
now, re-committed properly scoped as `a73840ab8` ("Refuse to start a release
while another one holds the zone", two files, nothing else swept in).

Two things to take from that, both of which cost somebody an hour:

- **An orphaned commit still answers `git show`.** The lock's author verified
  the committed blobs against their tested copies, got byte-identical, re-ran
  the suite green, and reported the hole closed on main. Every step was correct
  and the conclusion was wrong, because `5236df358` had already been reset out
  of the branch. `git merge-base --is-ancestor <sha> HEAD` is the question;
  `git show <sha>` is not — nor are `git show --stat` or
  `git log --oneline -- <path>`, which answer just as happily for a commit that
  has been reset away. The same trap caught the person writing this section
  down, twice: the paragraph above first claimed the fixes WERE on main, from a
  `git show --stat` run while that commit was still HEAD; the correction then
  went stale within twenty minutes when they genuinely landed. **The shelf-life
  rule this section opens with applies to these notes too** — state the sha and
  let the reader check it, rather than writing a present-tense claim about the
  branch that expires.
- **Explicit pathspecs do not protect the INDEX.** The rule further up — stage
  the paths you actually touched — is about your own `git add`, and it is not
  enough, because the index is shared state and `git add` is not atomic with
  `git commit`. Note the shape carefully: neither session staged the other's
  work. Each added its OWN files to an index that already held somebody else's,
  and it happened in both directions within minutes — one `git add` of two files
  reported seven staged, and a later `git add` of five also reported seven. So
  "check what your add picked up" is the weak version of the rule. `git commit
  -- <paths>` is the form that is safe for both parties; failing that, read
  `git show --stat` after every commit and confirm the file count is the one you
  asked for. That is what caught this one. (Put the message before the `--`, or
  in a file: `git commit -- <paths> -F-` reads the flag as a pathspec and
  fails.)

**And a reading trap that cost a wrong claim that night:** in a tree several
sessions share, the working copy is not evidence about the shipped code. A grep
of `tools/deploy-app-version.js` found a comment line stating the old behaviour
and it was reported as current — but the file was being rewritten at that
moment, and the line survived only as a QUOTATION inside its own replacement,
which existed to say it was wrong. `git show HEAD:<path>` is the check; grep of
the working tree is not, and it is worse than relaying because it comes with a
claim of having verified.

**HEAD is a cleaner input, not a safety property.** The recipe above keeps
somebody else's uncommitted work out of a release. It does NOT make the release
safe, and reading it that way is how the content tier nearly shipped broken on
2026-08-22. What is committed can be just as far from the CDN as what is not:
that day HEAD carried five master-dictionaries and 50 unit JSONs that had never
been deployed, so the "57 committed files" a release was scoped to were 62.

**Diff against the LIVE copies and ship only if the deploy introduces nothing.**
For content, that means resolving every audio path the shipping files reference
against storage, then fetching each file's deployed copy and comparing:

- 272 of 10,535 references pointed at clips not on the CDN — a silent fallback to
  the PAID runtime TTS endpoint, one per reference, that nothing in the repo
  reports.
- Every one of them was **already** broken in the deployed copy. 0 introduced,
  0 fixed. That is what made the deploy safe — not where the tree came from.

Had that number been non-zero, HEAD would have been exactly as unsafe as the
dirty tree. Run the comparison; do not infer it from provenance.

The same day's dirty tree is the other half of the lesson: 8 uncommitted
master-dictionaries had moved from 25 renamed clip references to **8,134 added**
ones (4,774 distinct basenames — a word taught in eight grades is eight
references and one file), essentially all of them 404 on the CDN. A "small
spelling migration" by description; thousands of silent paid fallbacks in fact.
Count the references, never the description.

