# Stopping unauthenticated use of the lesson apps

Goal, in the owner's words (2026-09-26): *"i want to prevent users accessing
directly outside moodle … stopping unauthenticated use."*

Today a lesson URL pasted into any browser renders the whole lesson. The launch
token only decides whether the lesson can *report*: without `pwsToken` /
`pwsEndpoint` the class controls and Wehel do not mount and progress goes
nowhere, but every word, film and question is served. The page says so itself —
it describes "the state of a lesson opened as a standalone page: it falls through
to the browser's own voice and nothing is requested."

So the gate has to be at the edge, before bytes are served. Client-side checks
are not a gate: the content is already in the browser by the time they run.

## What this is

Bunny **Token Authentication V2**. Moodle signs the launch URL; the edge verifies
the signature and refuses anything unsigned with a 403 before serving a byte.

`pqpg_cdn_sign_dir_url()` in `src/moodle/local_prequran/progress_gatewaylib.php`
does the signing, and `pqpg_ehel_launch_url()` calls it on both of its return
paths (school course and tutoring umbrella).

Three properties of the token, each chosen for a reason that will bite if it is
changed without reading the comment on the function:

| choice | why |
| --- | --- |
| **directory** token (`token_path`) | a lesson page pulls `./course-shell.js`, `./learner-controls.js`, `./seb-session.js`, `./wehel.js` and its `lecture-video/*.mp4`+`.vtt`+`.jpg`. A per-file token authorises the HTML and 403s everything it needs. |
| **`token_ignore_params=true`** | the signature otherwise covers the sorted query string, and ours does not survive one click — `unit` changes, `?from=comp4` is added, the audio path appends `location.search`. Signing the params mints a token valid for exactly the page the learner landed on. |
| **no IP lock** | a phone changing cells, or a school leaving one NAT, would 403 a child mid-lesson, and the edge cannot explain itself — the page would just stop. |

The TTL is `PQPG_TOKEN_TTL` (12 hours) so the CDN token and the launch token die
together. Split them and you get a lesson that renders and cannot report, or
reports and cannot render, and neither says why.

## Turn it on in THIS order

Any other order 403s live learners.

1. **Deploy the PHP.** It is inert: with no key configured `pqpg_cdn_sign_dir_url()`
   returns the URL unchanged, and launches are emitted exactly as before.
2. **Set the key** — Site administration → Plugins → Local plugins → Pre-Quran,
   *Ehel CDN token authentication key*. Copy it from Bunny: Pull Zone → Security
   → Token Authentication. Setting it makes launches emit signed URLs, which the
   edge still ignores because the zone setting is off. **Confirm a real launch
   still plays a lesson and its film at this point** — signed URLs with
   verification off prove the signing has broken nothing.
3. **Enable it on the zone, scoped by an edge rule** (below). Only now does an
   unsigned URL start being refused.

To roll back, reverse it: disable the zone setting **first**, blank the key
second. Blanking the key while the zone still verifies is the failure mode —
every launch would be unsigned and every learner refused.

## The edge rule is what keeps the blast radius small

`ZoneSecurityEnabled` is **zone-wide**, and this zone serves far more than the
apps: `app`, `content`, `media`, `qa`, plus the root catalogue JSONs, with four
server-side referencers (`accesslib.php`, `public_intake_guide.php`, `seb_lib.php`,
`wehel.js`). Enabling it bare would refuse all of it at once.

Bunny's edge rules carry two actions for exactly this — `DisableTokenAuthentication`
and `EnableTokenAuthentication` — triggered on URL patterns. So:

> Enable Token Authentication on the zone, then add an edge rule
> **`DisableTokenAuthentication`** whose URL trigger matches
> `*/app/computing/grade-4-v2/*` with the match type set to **does not match**.

That protects one directory and exempts everything else, including
`app/shared/ehel-academy-logo.png`, which sits one level above the app folder and
is therefore outside the signed prefix. It is public branding; leaving it
unprotected is the intended outcome, not an oversight. `check-cdn-token-signing.php`
asserts that it is outside, so if the layout ever moves, the gate says so.

Widen the pattern one directory at a time. Do **not** widen it to `*/app/*`
without re-reading the caveats below.

## Proving it works, and the one hazard

Two requests, in this order:

```bash
curl -s -o /dev/null -w '%{http_code}\n' "<the signed launch URL, copied from a real launch>"
```

```bash
curl -s -o /dev/null -w '%{http_code}\n' "https://ehelacademy.b-cdn.net/Ehel%20Primary/app/computing/grade-4-v2/index.html"
```

The first must be 200 (a real launch still works), the second 403 (an unsigned
URL is refused).

Then open the lesson from Moodle and confirm the **film plays** and a second
lesson page opens from the picker — those exercise the two things a naive
per-file token breaks: the `lecture-video/` subdirectory, and the token surviving
in-app navigation.

**Only ever probe entry paths.** Entry paths are `max-age=300` and cheap to be
wrong about. A 403 or 404 minted on a `v{TAG}/` or `media/` path is edge-cached
for a year and **cannot be purged with the key in `.env`**. An edge read is a
write to the cache; a storage read with the access key is passive. If you need to
know whether a file exists, ask storage.

## What this does NOT cover

Stated plainly, because each of these would otherwise read as done:

- **Only the directory in the edge rule is protected.** Every other app, and all
  of `media/` and `content/`, stays open until the pattern is widened. The
  narration mp3s of the shell subject apps live under `media/`, a different
  top-level prefix from the app, so they are not covered by an app directory
  token — gating the lessons does not gate the raw media.
- **Maths Grade 5 would need one change.** Its `wire-platform.py` carries an
  explicit allowlist — `["pwsToken", "pwsEndpoint", "studentid", "category"]` —
  so the token params would be dropped on the first click into a lesson. Every
  other live build carries the whole query string (`location.search` appended
  verbatim, or `URLSearchParams(location.search)` with only `from` deleted), so
  the token rides along for free and no build change is needed. Grade 5 is on
  hold and unrouted, so nothing is broken today; add the four token params to
  that list before it ships.
- **A learner who has launched can still share their URL** for up to 12 hours.
  Shortening the TTL is the lever, and it is the same lever as the launch token,
  so it shortens a school day too. IP locking would close it and costs a child
  their lesson when a phone changes cells.
- **The gate cannot prove the edge accepts the token.** See below.

## The gate, and its honest limit

```bash
npm run check:cdn-token
```

Also chained into `npm run check:php`.

`tools/check-cdn-token-signing.php` is a **known-answer** test. The expected
token was produced by BunnyWay's own signer (`BunnyCDN.TokenAuthentication`,
`php/url_signing.php`), which was first proved against that repository's
published test vectors — **15 of 15** — before a line of our helper was written.
So the frozen string is Bunny's answer, not ours, and nothing in our code can
drift it.

That matters because Bunny has **two** schemes: V1 is a bare `sha256` of
key+path+expires, V2 is `hmac-sha256` with an `HS256-` prefix. They produce
different tokens for identical inputs, and prose about "the" algorithm does not
say which. The gate pins V2.

**Mutation-tested 9 of 9**, tree restored byte-identical afterwards and the gate
green again: V1 instead of V2, hex instead of raw digest, dropping
`token_ignore_params`, signing the file path instead of the directory, keeping
the base64 padding, a blank key that still signs, dropping the launch query
string, omitting `token_path` from the URL while still signing it, and
percent-decoding the path before signing.

**The limit, which no amount of local testing removes:** no published vector
combines `token_path` with `token_ignore_params` — our exact combination. Our
helper agrees with Bunny's reference code on that combination (checked), so the
arithmetic is right. Whether the *edge* honours that pair is a contract question,
and only a real 200-then-403 answers it. A green gate means the helper still
computes what it computed when the edge was last observed to accept it.

One thing the design could easily have got wrong, and did until it was executed:
the first version of the coverage check re-signed each subresource and concluded
the lecture video needed a different token. `token_path` is a **prefix** at the
edge, so the question is whether the one launch token *covers* the file, not
whether re-signing reproduces it. Re-signing derives a new directory per file and
answers a question nobody asks.

## Sources

- [How to sign URLs for BunnyCDN Token Authentication](https://support.bunny.net/hc/en-us/articles/360016055099-How-to-sign-URLs-for-BunnyCDN-Token-Authentication)
- [BunnyWay/BunnyCDN.TokenAuthentication](https://github.com/BunnyWay/BunnyCDN.TokenAuthentication) — the reference signer and the test vectors
- [Advanced Token Authentication](https://bunny.net/docs/cdn/security/token-authentication/advanced)
- [Update Pull Zone API reference](https://bunny.net/docs/reference/pullzonepublic_updatepullzone) — `ZoneSecurityEnabled`, `ZoneSecurityKey`, `ZoneSecurityIncludeHashRemoteIP`, and the `EnableTokenAuthentication` / `DisableTokenAuthentication` edge-rule actions
