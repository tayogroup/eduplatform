# Progress Auth Bridge (hubredirect Phase B)

**2026-07-22.** The signed-launch-token bridge between the Bunny-hosted learner
apps and Moodle. Replaces "plain `studentid` in the URL + per-learner WS tokens"
with a short-lived signed token: identity comes from the token, verified
statelessly on every call — the foundation every hubredirect UI migration rides
on, and the switch that turns the apps' remote progress sync on.

## Pieces (all in `local/prequran`)

| File | Role |
|---|---|
| `progress_gatewaylib.php` | HS256 mint/verify (12 h TTL; claims `sub`/`course`/`env`), auto-generated secret (`progress_launch_secret` config; blank to rotate), CORS origin allow-list (`progress_allowed_origins` setting; defaults = Ehel CDN + app.ehelacademy.org) |
| `progress_gateway.php` | The stateless endpoint the apps call. Speaks the ProgressClient wire protocol: `POST …/progress_gateway.php/progress/ingest` (batch envelope) · `GET …/progress_gateway.php/progress/{course}` (hydrate doc). Token from Bearer header, envelope `token` field (sendBeacon), or `?token=`. Enforces token↔body student/course match. Delegates to the shared internals below. |
| `progress_token.php` | Session-authenticated mint (interim launch surface + test): `?course=ehel-math-g03[&studentid=N][&pq_env=…]` → `{token, endpoint, launchparams}`. Self or siteadmin. `course_launch.php` calls `pqpg_mint_token()` directly when the ehel launch flow lands (P1.8). |
| `externallib_progress.php` | Refactored: `ingest_events()` / `state_document()` are now shared public internals. The WS functions (token-service path) assert self/siteadmin then delegate; the gateway verifies the JWT then delegates. One code path, two front doors. |
| `shared/progress-client.js` | Beacon fix: the page-hide beacon now carries the token in the envelope body and posts as `text/plain` (CORS-safelisted) so cross-origin beacons deliver without preflight. |

## Flow

```
Moodle session (course_launch / progress_token.php)
   └─ mints JWT {sub, course, env, exp}                       [server, secret]
App launched with ?pwsEndpoint=<gateway>&pwsToken=<jwt>&studentid=<id>
   └─ ProgressClient(remote): POST batches / GET hydrate      [Bearer <jwt>]
progress_gateway.php: verify sig+exp → enforce student/course match
   └─ ingest_events() / state_document() → table + gradebook  [same code the WS runs]
```

No Moodle cookies, no per-learner WS tokens, nothing secret in the SPA. A token
binds one learner to one course for 12 h; re-launching renews it.

## Deploy (files only — no version bump, no schema change)

Copy to the server: `progress_gatewaylib.php`, `progress_gateway.php`,
`progress_token.php`, the refactored `externallib_progress.php`, `settings.php`.
Then purge Moodle caches **and restart PHP workers** (`pkill lsphp`) — opcache
serves stale endpoint code otherwise (learned the hard way).

## Test recipe

1. Logged in to Moodle in a browser, open
   `https://<moodle>/local/prequran/progress_token.php?course=ehel-math-g03&pq_env=integration`
   → copy `launchparams`.
2. Open `https://ehelacademy.b-cdn.net/Ehel%20Primary/app/mathematics/index.html?stage=3&unit=1&<launchparams>`
   → work a section; the app now POSTs batches to the gateway (watch the network
   tab: `progress_gateway.php/progress/ingest` → `{ok:true,…}`).
3. Reload on another browser/device with the same launchparams → hydrate returns
   the saved state (cross-device resume).
4. Or curl:
   `curl -H "Authorization: Bearer <token>" "https://<moodle>/local/prequran/progress_gateway.php/progress/ehel-math-g03"`

## Security notes

- Identity is the token's `sub` claim — the URL `studentid` is display-only.
- Course-scoped: a token for `ehel-math-g03` cannot write `ehel-eng-g03`.
- Secret rotation: blank `progress_launch_secret` in config → next mint
  regenerates; outstanding tokens die (12 h max anyway).
- The gateway never creates users/enrolments; it writes progress + grades for
  an already-authorised learner, same as the WS path.
- Guardian/teacher delegation for `progress_token.php` mirrors the WS assert —
  extend both together when staff tooling needs it.
