# Environment Promotion Checklist

Use this flow for Pre-Quraan unit releases:

```text
local dev -> local unit QA -> Bunny integration -> Bunny staging -> Bunny production
```

## 1. Local Dev

Purpose: active editing and fast browser checks.

Run:

```bash
npm run validate:units
npm run build:bunny
npm run preview:bunny
```

Check:

- Unit config changes load locally.
- Audio/video ordering is correct.
- Speak and Write interactions work.
- Refresh keeps expected progress.
- Mobile layout remains usable.
- Moodle-like launch mode works with `?managed=1`.

Local dev must not upload to Bunny.

## 2. Local Unit QA

Purpose: block bad unit builds before any upload.

Run:

```bash
npm run validate:units
npm run check:alphabet
npm run build:bunny:integration
npm run verify:bunny:integration
```

For each changed unit, manually test:

- First tile audio.
- Middle tile audio.
- Last tile audio.
- Watch step video.
- Speak Done/progress.
- Page refresh progress.
- Mobile layout.
- Moodle-like `?managed=1` launch.

Do not upload until this gate passes.

## 3. Bunny Integration

Purpose: active Bunny-side QA without affecting staging or production.

Build and verify integration output:

```bash
npm run build:bunny:integration
npm run verify:bunny:integration
```

Upload to integration:

```bash
npm run deploy:integration
```

Expected public path:

```text
https://app.quraan.academy/pre_quraan_integration/
```

Check:

- Bunny upload completes.
- HTML, CSS, JS, image, audio, and video paths resolve under `/pre_quraan_integration/`.
- Moodle admin/test launch can route to integration.
- Moodle progress, focus, speak, and submit rows are written with `environment = integration`.
- CDN cache does not hide changed files.
- No integration page requests staging `/pre_quraan_staging/` or production `/pre_quraan/` assets.

## 4. Bunny Staging

Purpose: production-ready release candidate. Staging should receive only builds that already passed integration.

Build and verify staging output:

```bash
npm run build:bunny:staging
npm run verify:bunny:staging
```

Upload to staging:

```bash
npm run deploy:staging
```

Expected public path:

```text
https://app.quraan.academy/pre_quraan_staging/
```

Check:

- Bunny upload completes.
- HTML, CSS, JS, image, audio, and video paths resolve under `/pre_quraan_staging/`.
- Moodle staging/admin launch routes to staging.
- Moodle progress, focus, speak, and submit rows are written with `environment = staging`.
- CDN cache does not hide changed files.
- No staging page requests integration `/pre_quraan_integration/` or production `/pre_quraan/` assets.

## 5. Bunny Production

Purpose: student-facing release.

Production receives only output that already passed:

- Local validation.
- Local preview checks.
- Bunny integration smoke test.
- Bunny staging smoke test.
- Moodle staging/admin launch test.

Build and verify production output:

```bash
npm run build:bunny:production
npm run verify:bunny:production
```

Preview the production upload plan:

```bash
npm run deploy:production:dry-run
```

Upload to production:

```bash
npm run deploy:production
```

The production deploy requires typing:

```text
DEPLOY PRODUCTION
```

Expected public path:

```text
https://app.quraan.academy/pre_quraan/
```

## Release Notes

Before production, record:

- Git branch and commit.
- Unit keys included.
- Integration verification result.
- Staging verification result.
- Moodle environment readiness SQL result.
- Production dry-run result.
- Known issues or rollback notes.
- Release tag, for example `app-v1.0.0` or `alphabet-v1.0.0`.

## Path Safety Rule

The generated Bunny output records its public base path in `dist/pre_quraan/.bunny-build.json`.
Deployment refuses to upload when the build path and deploy target do not match.

## Moodle Environment Rule

Moodle launch routes and web services must stay aligned with Bunny:

```text
integration -> /pre_quraan_integration/ -> environment = integration
staging     -> /pre_quraan_staging/     -> environment = staging
production  -> /pre_quraan/             -> environment = production
```

After installing the Moodle plugin upgrade, run:

```text
src/moodle/local_prequran/sql/verify_environment_readiness.sql
```

Only admins, or sites with `allow_nonproduction_launch` enabled, should use `pq_env=integration` or `pq_env=staging` launch overrides.
