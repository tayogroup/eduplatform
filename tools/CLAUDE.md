<!--
  Extracted from the root CLAUDE.md on 2026-09-12.
  Loads on demand when Claude reads files in this directory,
  so it costs no context in sessions that work elsewhere.
  Cross-cutting rules stay in the root CLAUDE.md.
-->

### The platform is a tier too, and nothing could see it

```bash
npm run check:platform-cors                                   # the launch host
node tools/check-platform-cors.mjs --host <host>[,<host>]     # somewhere else
```

Runs automatically after an app release and after a content upload, beside the
tier check (`tools/lib/require-platform-cors.js`).

On 2026-08-26 book narration stopped for a day. Nothing here was wrong: the
live bundle was byte-identical to HEAD and the ebook code had not changed in
five days. A browser-integrity challenge had been put in front of the Moodle
box, and it answered **CORS preflights** with a 200 HTML interstitial carrying
no `Access-Control-Allow-Origin`. A preflight is sent with no cookies, ever, so
passing the challenge in a tab never helped the app — every cross-origin call
died before it was made.

Three things hid it, and each is why this gate exists:

- **The failure is a response nobody logs.** A blocked preflight never reaches
  Apache, so the access log showed ZERO narration calls rather than failing
  ones — the block's signature and its alibi at once. "No traffic" and "all
  traffic refused" look identical from the server.
- **Only the runtime surfaces broke.** Every other kind of narration is a
  pre-rendered mp3 on the CDN, and the CDN was healthy. Books are the one
  surface that calls the platform per page, so an outage of the whole API read
  as one broken feature. Wehel and progress saving were down the same day and
  nobody noticed.
- **A probe run ON the box passes.** The challenge layer exempts local traffic:
  `curl` from cPanel Terminal answered `204` with correct CORS headers in the
  same minute an external client got the interstitial. Only an off-box client
  can see this — which is what a deploy step on a laptop is.

It asserts the CONTRACT, never the symptom. The interstitial's wording, vendor
and URL can all change; what cannot is what our own PHP promises an allowed
origin. The challenge fingerprint is used only to make the message name the
cause. Endpoints are read out of the source (`platformUrl("…")`, plus the
gateway's minting line in `progress_gatewaylib.php`), so an endpoint added to
the app is probed by the next release with nobody remembering to add it — and
it refuses to run below 5 of them, the same floor the portal-route gate carries.

**Whether an endpoint needs `Allow-Credentials` is a property of the CALL.** The
six `hubredirect` endpoints send `credentials: "include"`; the progress gateway
authenticates by bearer token alone and correctly omits the header. Asserting it
everywhere fails a healthy gateway — the first run of this gate did exactly
that — so it is read off the `fetch`, with its own floor: if no endpoint parses
as credentialed, the check refuses rather than silently testing less.

Mutation-tested seven ways, all caught: a saved copy of the real challenge page
(exit 1, and it names the challenge), a host with no CORS at all, an
unresolvable host (exit 3 — not checked is not a pass), an unrecognised
argument, a broken endpoint parser, a broken credential parser, and a fixture
serving the correct contract as a positive control (exit 0). Watching a gate
pass proves nothing until you have watched it fail.

One bug it found in itself, worth keeping because the shape recurs: it printed a
correct verdict and then exited **127**. `process.exit()` tore down the process
while undici still held sockets, and on Windows that raced a libuv assertion. A
failing check reporting a code no caller reads as failure is exactly the class
of defect this file is about, so the terminal paths set `process.exitCode` and
let node drain.

**A floor cannot see a partial parse, and this gate proved it on itself.** It
refuses below 5 endpoints; the true number is 9; a release tree missing
`src/moodle/local_prequran` yields 8, which clears the floor. It ran that way
inside a real release on 2026-08-27 — when those numbers were 7 and 6 — and
printed a tick over six of seven. The count has grown twice since without this
floor moving, which makes the point harder rather than softer: it now sits FOUR
below the true count. Both figures here were stale until 2026-08-31, and not
because anyone mis-measured — `course_group_chat.php` shipped with the classroom
chat and nobody updated a count two sections away. Adding an endpoint means
updating this number in the same commit. Two
guards now cover what the floor cannot: the gateway's source file must be
READABLE (absent → exit 2, naming the archive recipe), and the gateway must
appear in the discovered list even when the file is present (a moved minting
line → exit 2). Both mutation-tested. The general form is worth more than the
fix: **a floor set below the true count is not a floor, it is a formality** —
name the specific thing that must be there.

**What it cannot see**: it probes from wherever it runs. The 2026-08-26 outage
was per-IP — this network was greylisted while other families' calls were
landing all along, which looked like a refutation and was not. A pass here means
*this* machine can reach the platform.

**And it writes to the log you read when something breaks.** Every run puts one
`OPTIONS … 204 0` in the platform's access log per endpoint, so a session that
runs it a few times leaves a tidy row of identical counts — 6 `wehel_chat`,
6 `wehel_speak`, 6 `wehel_listen` — which reads exactly like traffic recovering.
It fooled the person who wrote it, hours after writing it, while checking
whether learners had come back from that same outage. **Identical counts across
unrelated endpoints are the tell**, and the way through is to separate the
preflights from the real calls, because only the second kind is a learner:

```bash
grep "quiz_tts.php" ~/access-logs/<host>-ssl_log | awk '{print $9, $10}' | sort | uniq -c
```

A `204 0` is somebody's preflight, this gate's included. A `200` with a
five-figure byte count is a page of a book actually narrated — which is the only
line in that file that proves the whole chain works, and on the evening of the
outage there was exactly one of them.

