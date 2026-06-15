# Bunny Deploy

Pre-Quraan uses five practical environments:

```text
local dev -> local unit QA -> Bunny integration -> Bunny staging -> Bunny production
```

The deployable output always lives locally in:

```text
dist/pre_quraan/
```

The public URL path is environment-specific:

```text
Integration: /pre_quraan_integration/
Staging:     /pre_quraan_staging/
Production:  /pre_quraan/
```

The build writes `dist/pre_quraan/.bunny-build.json` with the selected public base path. Deploy refuses to upload if the generated build path does not match the selected deploy target.

## Local Dev

Purpose: active Codex work and fast local checks.

Run:

```bash
npm.cmd run env:local-dev
npm.cmd run preview:bunny:production
```

Open:

```text
http://127.0.0.1:4173/pre_quraan/units/alphabet/index.html
```

Use local dev for:

- Editing unit config and runtime code.
- Importing or checking media.
- Testing grid/audio/video order.
- Testing Speak and Write UI.
- Fast browser checks.

Local dev must not upload to Bunny.

## Local Unit QA

Purpose: confirm changed units are ready before any Bunny upload.

Run:

```bash
npm.cmd run env:local-unit
npm.cmd run preview:bunny:integration
```

Open:

```text
http://127.0.0.1:4173/pre_quraan_integration/units/alphabet/index.html
```

Manually check each changed unit:

- First tile audio.
- Middle tile audio.
- Last tile audio.
- Watch step video.
- Speak Done/progress.
- Page refresh progress.
- Mobile layout.
- Moodle-like `?managed=1` launch.

Do not upload until local unit QA passes.

## Bunny Integration

Purpose: active Bunny-side QA. Use this for testing, issue discovery, and fixes before a build is allowed into staging.

Build, verify, and preview the integration upload plan:

```bash
npm.cmd run env:integration
```

Upload to integration:

```bash
npm.cmd run deploy:integration
```

Expected URL root:

```text
https://app.quraan.academy/pre_quraan_integration/
```

Check:

- Bunny upload completes.
- HTML, CSS, JS, image, audio, and video paths resolve under `/pre_quraan_integration/`.
- No integration page requests staging `/pre_quraan_staging/` or production `/pre_quraan/` assets.
- Moodle admin/test launch can route to integration.
- Moodle progress tables write and read `environment = integration`.
- CDN cache does not hide changed files.

## Bunny Staging

Purpose: production-ready release candidate. Do not use staging as the active testing playground.

Build, verify, and preview the staging upload plan:

```bash
npm.cmd run env:staging
```

Upload to staging:

```bash
npm.cmd run deploy:staging
```

Expected URL root:

```text
https://app.quraan.academy/pre_quraan_staging/
```

Check:

- Bunny upload completes.
- HTML, CSS, JS, image, audio, and video paths resolve under `/pre_quraan_staging/`.
- No staging page requests integration `/pre_quraan_integration/` or production `/pre_quraan/` assets.
- Moodle staging/admin launch can route to staging.
- Moodle progress tables write and read `environment = staging`.
- CDN cache does not hide changed files.

## Bunny Production

Purpose: student-facing release.

Production receives only output that already passed:

- Local validation.
- Local unit QA.
- Bunny integration smoke test.
- Bunny staging smoke test.
- Moodle staging/admin launch test.

Build, verify, and preview the production upload plan:

```bash
npm.cmd run env:production:dry-run
```

Upload to production:

```bash
npm.cmd run deploy:production
```

Production deploy requires this exact confirmation:

```text
DEPLOY PRODUCTION
```

Expected URL root:

```text
https://app.quraan.academy/pre_quraan/
```

## Environment Variables

Keep real credentials in `.env` only. Do not commit them.

```powershell
BUNNY_STORAGE_ZONE=your-storage-zone-name
BUNNY_STORAGE_ACCESS_KEY=your-storage-zone-password
BUNNY_STORAGE_ENDPOINT=https://storage.bunnycdn.com
BUNNY_DEPLOY_BASE_PATH_INTEGRATION=pre_quraan_integration
BUNNY_DEPLOY_BASE_PATH_STAGING=pre_quraan_staging
BUNNY_DEPLOY_BASE_PATH_PRODUCTION=pre_quraan
```

`BUNNY_REMOTE_PREFIX` is still supported as a backward-compatible fallback for the legacy `deploy:bunny` command. Explicit `deploy:integration`, `deploy:staging`, and `deploy:production` commands prefer their target-specific base paths.

## Moodle Alignment

The Moodle `local_prequran` plugin has matching environment settings:

```text
bunny_environment=production|staging|integration
bunny_base_production=/pre_quraan/
bunny_base_staging=/pre_quraan_staging/
bunny_base_integration=/pre_quraan_integration/
allow_nonproduction_launch=0|1
```

After the Moodle upgrade runs, progress and QA tables include an `environment` column. Run this SQL after deployment to confirm Moodle, database, and Bunny paths match:

```text
src/moodle/local_prequran/sql/verify_environment_readiness.sql
```

For regional storage zones, replace the endpoint with Bunny's regional endpoint, such as:

```text
https://ny.storage.bunnycdn.com
https://uk.storage.bunnycdn.com
```

## Output Layout

The upload root should contain folders like:

```text
app/
lessons/
messages/
scripts/
shared/
units/
```

For example, local file:

```text
dist/pre_quraan/scripts/index_v030.html
```

Becomes this in production:

```text
https://app.quraan.academy/pre_quraan/scripts/index_v030.html
```

And this in staging:

```text
https://app.quraan.academy/pre_quraan_staging/scripts/index_v030.html
```

And this in integration:

```text
https://app.quraan.academy/pre_quraan_integration/scripts/index_v030.html
```

Do not preview built `index.html` files with `file://`; absolute environment paths only resolve correctly when the files are served from a web root.
