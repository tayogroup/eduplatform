# Stopping unauthenticated use of the lesson apps

Goal, in the owner's words (2026-09-26): *"i want to prevent users accessing
directly outside moodle … stopping unauthenticated use."*

A lesson URL pasted into any browser renders the whole lesson. The launch token
only decides whether the lesson can *report*: without `pwsToken` / `pwsEndpoint`
the class controls and Wehel do not mount and progress goes nowhere, but every
word, film and question is served. The page says so itself — it describes "the
state of a lesson opened as a standalone page: it falls through to the browser's
own voice and nothing is requested."

So the gate has to be at the edge, before bytes are served. Client-side checks
are not a gate: the content is already in the browser by the time they run.

## DO NOT ENABLE "Token Authentication" ON THE ZONE

`ZoneSecurityEnabled` must stay **False**. Nothing in this design ever needs it on.
One edge rule with the *Enable Token Authentication* action does the whole job.

It was switched on by mistake on 2026-09-26 and took the **entire platform** down
for as long as it was on: measured unsigned, all six shell subject apps, every
standalone build, `app/shell/course-app.js` and `content/` returned **403**. Not a
partial outage — everything.

The trap is that the dashboard control is called "Token Authentication", which is
exactly what somebody setting this up would expect to turn on. It is the wrong
switch. The right one is an edge rule.

**If you find the zone showing `ZoneSecurityEnabled: True`, that is an outage.**
Set it back to False; service returns within seconds. Then check the one-year cache
tiers for stored denials — `media/**` and `app/*/v*/**` — by confirming a file
exists on storage with the access key and only then fetching that exact path from
the edge. A 403 cached on those paths cannot be purged with the key in `.env`.
(Checked after the 2026-09-26 incident: no cached denials. Token-auth denials
appear not to be stored, but do not rely on that.)

## What this is

Bunny **Token Authentication V2**. Moodle signs the launch URL; the edge verifies
the signature and refuses anything unsigned with a 403 before serving a byte.

`pqpg_cdn_sign_dir_url()` in `src/moodle/local_prequran/progress_gatewaylib.php`
does the signing, and `pqpg_ehel_launch_url()` calls it on both of its return
paths (school course and tutoring umbrella).

**All of it is verified against a live Bunny edge (2026-09-26)**, on a throwaway
pull zone built on the same storage so no learner could be affected. See
*What was measured* below. The test zone has been deleted.

Three properties of the token, each chosen for a reason that will bite if it is
changed without reading the comment on the function:

| choice | why |
| --- | --- |
| **directory** token (`token_path`) | a lesson page pulls `./course-shell.js`, `./learner-controls.js`, `./seb-session.js`, `./wehel.js` and its `lecture-video/*.mp4`+`.vtt`+`.jpg`. A per-file token authorises the HTML and 403s everything it needs. Verified: one directory token serves all of them, including the `lecture-video/` subdirectory. |
| **`token_ignore_params=true`** | the signature otherwise covers the sorted query string, and ours does not survive one click — `unit` changes, `?from=comp4` is added, the audio path appends `location.search`. Verified: with this set, a request carrying extra params is served. |
| **no IP lock** | a phone changing cells, or a school leaving one NAT, would 403 a child mid-lesson, and the edge cannot explain itself — the page would just stop. |

The TTL is `PQPG_TOKEN_TTL` (12 hours) so the CDN token and the launch token die
together. Split them and you get a lesson that renders and cannot report, or
reports and cannot render, and neither says why.

## THE PATH IS SIGNED PERCENT-DECODED

The single most important fact here, and the one that cost a wrong first
implementation.

Every path on this zone contains a space — `Ehel Primary`. The edge decodes the
request path before it checks the signature, so the signed path must be

    /Ehel Primary/app/computing/grade-4-v2/          <- 200

and not

    /Ehel%20Primary/app/computing/grade-4-v2/        <- 403

Measured both ways, on both schemes. **Bunny's own reference signer gets this
wrong for our paths**, so do not "correct" the helper by reading that code:
`php/url_signing.php` takes its path from `parse_url()`, which does not decode,
so handing it a URL containing `%20` makes it sign a path the edge will never
compute. It is right for paths needing no encoding and misleading for ours.

The first version of this work signed the encoded form, and carried a comment
confidently explaining why that was correct. The gate agreed — because the gate's
frozen expected token had been produced by feeding that same encoded path to the
reference signer. Helper and gate agreed with each other while the edge refused
both. A known-answer test is only as good as the input that was frozen, and
nothing short of the edge could tell. `check-cdn-token-signing.php` now has an
explicit guard: a `token_path` containing `%` fails it.

## The configuration: ONE edge rule, and the zone toggle stays OFF

`ZoneSecurityEnabled` is **zone-wide**, and this zone serves far more than the
apps: `app`, `content`, `media`, `qa`, the root catalogue JSONs, and the custom
hostname `app.ehelacademy.org` as well as `ehelacademy.b-cdn.net`. Turning it on
would refuse all of it.

It does not need to be turned on. An edge rule with the **Enable Token
Authentication** action switches verification on for matching requests while the
zone toggle stays off — measured, 5/5. So:

> **Leave Token Authentication on the zone OFF.** Add one edge rule to the
> `ehelacademy` pull zone: action **Enable Token Authentication**, trigger
> **Url**, match type **Match Any**, pattern `*/app/computing/grade-4-v2/*`.

This is the configuration to use, and the reason is how it fails. A mistake in
the pattern leaves that folder **unprotected** — the old, already-shipped
behaviour. The inverse arrangement (zone toggle on, plus a *Disable* rule with
match type **Match None** to exempt everything else) is also possible and fails
the other way: a pattern mistake refuses `media/`, `content/`, all six subjects
and every mp3 and mp4 at once. Do not use it.

The pattern syntax is the one already in use on this zone — its six existing
cache rules use `*/app/*/v*/*`, `*/media/*`, `*/app/*/index.html`. Widen by
adding directories one at a time.

The signing key is the zone's existing **ZoneSecurityKey** (already set, 36
characters — nothing needs generating). It is what goes in the Moodle admin
field.

## LIVE for Computing Grade 4 since 2026-09-26 — HTML DOCUMENTS ONLY

Enforcing now, pattern `*/app/computing/grade-4-v2/*.html`. A pasted lesson or hub
URL gets 403; everything the page then fetches is served without a token.

Zone state: `ZoneSecurityEnabled` **False** (the edge rule does the work), 7 edge
rules = the original 6 cache rules plus one Enable Token Authentication rule.
**Rollback is one action: disable that rule.**

### Why *.html and not the whole directory

The first attempt matched `*/app/computing/grade-4-v2/*` and **broke the film**,
reported by the owner within minutes. The cause is the distinction that matters
most here:

> **A token's SCOPE covering a file is not the page DELIVERING a token on that
> request.**

The directory token authorises everything under the folder — verified, 8/8. But
the page does not put the token on most of its own subresource requests:

| what the page fetches | carries the token? |
| --- | --- |
| lesson `.html` links, the picker, the hub | **yes** — `location.search` appended verbatim |
| word audio (`w.file + location.search`) | **yes** |
| `<link rel="modulepreload">` ×4 (`course-shell.js`, `learner-controls.js`, `wehel.js`, `seb-session.js`) | **no** — static build-time HTML |
| the film's `src`, `poster` and `captions` | **no** — built without `location.search` |
| `../../shared/ehel-academy-logo.png` | no, and outside the prefix anyway |

So protecting the directory 403'd the film, its captions, its poster **and all four
shell modules**. Only the film was reported, because browser cache was hiding the
rest — which is the more alarming half.

`check-cdn-token-signing.php` printed "9 subresources covered" throughout. That
was true about scope and silent about delivery, and its wording is now corrected
to say so.

### The pattern is query-safe, and that had to be checked

`*.html` matches on the PATH, not the full URL. Verified against the edge:
`index.html`, `index.html?stage=4&unit=1`, `?from=comp4`, three junk params, and a
query ending in `.js` are all refused. Had matching included the query string,
`index.html?anything` would have bypassed the rule completely — a silent total
defeat of the feature, not a partial one.

### What this protects, and what it does not

**Protected:** the lesson and hub documents. Without them there is no lesson, so
this is what "prevent access outside Moodle" actually needs.

**Not protected:** the mp4, vtt, poster, the four shell modules and the CSS are
fetchable by anyone who knows the exact URL (the film's filename is content-hashed,
so guessing it is not trivial, but it is not a secret). This is consistent with
`media/` and `content/`, which are wholly public and hold every narration clip on
the platform — gating this folder's mp4 while `media/` is open would be theatre.

Closing that gap means every build appending `location.search` to its film and
module references, and the modulepreload tags are static HTML emitted at build
time. That is a rebuild and redeploy of all 24 lesson apps, and it is a separate
job — not a config change.

### Measured on the live zone

9/9 at enable time: pasted hub and pasted lesson URL (with params) both 403;
Moodle's signed launch and signed in-app navigation served; the film, its captions,
`course-shell.js` and `wehel.js` all served unsigned; Computing Grade 3 untouched.

### The deploy-order trap, recorded because it nearly shipped

The PHP was deployed, the decoded-path defect was found afterwards, and the fix
was committed but not re-deployed — so the server signed the encoded path while the
repo was correct and every gate was green. Caught by recomputing a REAL launch
URL's token against the zone key and seeing it match the ENCODED variant, which
named the deployed version exactly. **Verify the running artefact, not the commit.**

**One-time window:** anyone who launched before the corrected file was installed
holds an encoded-path token, which now 403s on the HTML. Relaunching fixes it.
Tokens live 12 hours.

## The rollout: 36 patterns, three rules, and two traps

Live since 2026-09-26 on **30 standalone builds + 6 shell subject entries**, HTML
documents only. Verified: unsigned 403 and signed 200 on every one of the 36, with
the films, the per-build shell modules, the shared `app/shell/course-app.js` and the
crest all still serving unsigned.

**Bunny's hard limit is 25 patterns per rule** — max 5 conditions per rule, max 5
patterns per condition, and it refuses with `edgerule.invalid` rather than
truncating. 35 patterns therefore needs two rules (25 + 10), plus the original
Computing G4 rule. Rollback is disabling all three.

**The dashboard collapses newlines into spaces.** Pasting 35 patterns one per line
into the pattern field saved them as ONE pattern with spaces in it. That matches
nothing, so it failed open and protected nothing — no outage, and no error either.
If you paste a list, read the rule back and count the patterns; the tell is a single
pattern containing a space. The API is the reliable route.

**Mathematics `grade-5-v2` was the one exception and is now fixed and protected**
(37 patterns). It needed TWO fixes, not the obvious one: its hub carried a param
allowlist that dropped the four token params on hub→lesson, AND every lesson page
carried a bare `href="index.html"` back-link with no query at all, so lesson→hub
dropped everything. Adding four names to the allowlist would have tested fine from
the hub and failed the first time a child pressed back.
`grade-5-app/carry-cdn-token.py` carries the whole query on every internal `.html`
link instead, matching the other thirty builds.

One finding from that build worth keeping: `URLSearchParams.toString()` re-encodes
the space in `Ehel Primary` as **`+`**, not `%20`, so it sends a differently encoded
`token_path` than Moodle does. **The edge accepts both** — measured. Every other
build appends `location.search` verbatim and never hits this.

### Delivery was audited per build, not assumed

Because of the film incident, every build was checked for whether it actually SENDS
the token on in-app `.html` navigation before being protected: 30 of 31 append the
whole query string, Maths G5 is the exception above. All 50 `window.open` calls are
`window.open("", "_blank")` with `document.write` — no CDN request, so the print
sheets are unaffected. Maths G4's 25 extra `.html` files are `*-body.html` build
fragments and audit pages, not navigation targets.

The shell subject apps pass for reasons written into the shell: the subject switch
goes through `course_launch.php`, so a cross-subject jump re-launches and mints that
subject's own token, and `homeHref`/`sessionHref` build from `new URL(location.href)`
and only set or delete named params, so the token survives.

## Widening it: turn it on in this order

1. **Deploy the PHP.** Inert: with no key configured `pqpg_cdn_sign_dir_url()`
   returns the URL unchanged. *(Done 2026-09-26, hash-verified.)*
2. **Set the key** — Site administration → Plugins → Local plugins → Pre-Quran,
   *Ehel CDN token authentication key*. Copy it from the `ehelacademy` pull zone:
   Security → Token Authentication. Launches now emit signed URLs, which the edge
   still ignores because no rule enables verification. **Confirm a real launch
   still plays a lesson and its film here** — signed URLs with nothing verifying
   them prove the signing has broken nothing.
3. **Add the edge rule** above. Only now is an unsigned URL refused.

Rollback is the reverse and the first step is enough: **disable or delete the
edge rule** and everything serves unsigned again within seconds. Blanking the
Moodle key while the rule is live is the failure mode — every launch would be
unsigned and every learner refused.

## Proving it

```bash
curl -s -o /dev/null -w '%{http_code}\n' "https://ehelacademy.b-cdn.net/Ehel%20Primary/app/computing/grade-4-v2/index.html"
```

403 once the rule is live. Then launch the course from Moodle and confirm the
lesson opens, **the film plays**, and a second lesson opens from the picker —
those exercise the `lecture-video/` subdirectory and the token surviving in-app
navigation.

**Only ever probe entry paths.** Confirmed from this zone's own cache rules:
`*/media/*` and `*/app/*/v*/*` are `31536000` (one year), while `*/app/*` and
`*/app/*/index.html` are `300`. A 403 or 404 minted on a media or version path is
edge-cached for a year and **cannot be purged with the key in `.env`**. An edge
read is a write to the cache; a storage read with the access key is passive.

## What was measured, 2026-09-26

On a throwaway pull zone (`ehel-tokentest-*`) built on storage zone 1065325 — the
same storage the live zone serves — then deleted.

Zone toggle on, no rules: **8/8.** One directory token served `index.html`, a
sibling lesson page, `./course-shell.js`, `./wehel.js`, the `lecture-video/` mp4
and a request with extra query params; a path outside `token_path` was refused;
an expired token was refused. The URLs emitted by the real
`pqpg_cdn_sign_dir_url()` were served, **3/3**.

Zone toggle off, one Enable-Token-Authentication rule: **5/5.** Inside the
pattern, unsigned 403 and signed 200 including the film subdirectory; outside it,
the shared logo and Computing Grade 3 still served unsigned.

Also established, and neither is in Bunny's prose: **the edge accepts both
schemes** (V1 is base64 of a raw md5 over key+path+expires; V2 is hmac-sha256
with an `HS256-` prefix), and a first request to a cold zone can return 500 while
it warms, so a single probe is not evidence.

## What this does NOT cover

- **Only the pattern in the edge rule is protected.** Every other app, and all of
  `media/` and `content/`, stays open. The narration mp3s of the shell subject
  apps live under `media/`, a different top-level prefix from the app, so gating
  the lessons does not gate the raw media.
- **Maths Grade 5 would need one change.** Its `wire-platform.py` carries an
  explicit allowlist — `["pwsToken", "pwsEndpoint", "studentid", "category"]` —
  so the token params would be dropped on the first click into a lesson. Every
  other live build carries the whole query string (`location.search` appended
  verbatim, or `URLSearchParams(location.search)` with only `from` deleted), so
  the token rides along for free. Grade 5 is on hold and unrouted; add the four
  token params to that list before it ships.
- **A learner who has launched can still share their URL** for up to 12 hours.
  Shortening the TTL is the lever and it is the same lever as the launch token,
  so it shortens a school day too. IP locking would close it and costs a child
  their lesson when a phone changes cells.

## The gate

```bash
npm run check:cdn-token      # also chained into npm run check:php
```

A known-answer test whose expected token comes from Bunny's reference signer, fed
the **decoded** path, and whose construction the edge has been observed to
accept. Mutation-tested 9 of 9, tree restored byte-identical. Plus the explicit
`%`-in-`token_path` guard described above, which is the one defect this work
actually shipped and had to be caught by the edge instead.

## Sources

- [BunnyWay/BunnyCDN.TokenAuthentication](https://github.com/BunnyWay/BunnyCDN.TokenAuthentication) — the reference signer and its 15 published test vectors
- [How to sign URLs for BunnyCDN Token Authentication](https://support.bunny.net/hc/en-us/articles/360016055099-How-to-sign-URLs-for-BunnyCDN-Token-Authentication)
- [Advanced Token Authentication](https://bunny.net/docs/cdn/security/token-authentication/advanced)
- [Update Pull Zone API reference](https://bunny.net/docs/reference/pullzonepublic_updatepullzone) — `ZoneSecurityEnabled`, `ZoneSecurityKey`, and the `EnableTokenAuthentication` (9) / `DisableTokenAuthentication` (8) edge-rule actions
- [Edge Rules](https://bunny.net/docs/cdn/edge-rules)
