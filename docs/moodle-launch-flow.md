# Moodle Launch Flow

This repo keeps Moodle PHP source/reference files separate from the Bunny-hosted static frontend.

## Production Request Path

1. Moodle login validates the user session.

   ```text
   https://quraan.academy/login/index.php
   ```

2. Main Moodle launcher creates a short-lived `mtoken` and redirects to the Bunny app shell.

   ```text
   src/moodle/local_hubredirect/issue.php
   -> https://app.quraan.academy/pre_quraan/scripts/index_v030.html?mtoken=...
   ```

3. Bunny app shell shows the learner dashboard and routes unit buttons.

   ```text
   src/app-shell/index_v030.html
   -> dist/pre_quraan/scripts/index_v030.html
   ```

4. Unit requests go back through Moodle child launcher for access, signing, and token brokering.

   ```text
   https://quraan.academy/local/hubredirect/issue_child.php?goto=alphabet_listen
   ```

5. Moodle child launcher resolves `goto` to a Bunny lesson path, adds short-lived launch data, and wraps managed lessons in an iframe.

   Current Alphabet Listen route in the imported reference:

   ```text
   alphabet_listen
   -> /pre_quraan/scripts/pq_unit_alphabet_html_v0.0_match.html?managed=1&v=20260425_240
   ```

   In the new repo build, the equivalent Bunny output is:

   ```text
   /pre_quraan/units/alphabet/index.html?managed=1
   ```

6. The iframe wrapper sends Moodle data to the unit with `postMessage`.

   ```text
   type: PQ_TOKENS
   uid
   wstoken
   wsendpoint: https://quraan.academy/webservice/rest/server.php
   managed: 1
   ```

7. The Alphabet unit loads static assets from Bunny and reads/writes progress through Moodle web services.

   ```text
   src/units/alphabet/
   src/platform/locked/
   src/moodle/local_prequran/services.php
   src/moodle/local_prequran/externallib_v4.php
   ```

## Local Development Path

Local preview intentionally bypasses Moodle for frontend work:

```text
http://127.0.0.1:4173/pre_quraan/scripts/index_v030.html
-> Alphabet Listen
-> http://127.0.0.1:4173/pre_quraan/units/alphabet/index.html?managed=1
```

The local-only route is controlled in:

```text
src/app-shell/js/app-config3_v003.js
```

The local-only access-gate exception is controlled in:

```text
src/units/alphabet/patches/access-gate.js
```

Production still routes through Moodle because the local overrides only apply to `localhost` and `127.0.0.1`.

## Imported Moodle Files

```text
src/moodle/local_hubredirect/issue.php
src/moodle/local_hubredirect/issue_child.php
src/moodle/local_prequran/services.php
src/moodle/local_prequran/externallib_v4.php
src/moodle/course_format_reference/index.php
```

## Deployment Boundaries

Bunny output comes from:

```text
npm run build:bunny
dist/pre_quraan/
```

Moodle PHP files are not copied into `dist/`. They belong in the Moodle server/plugin environment, not Bunny static hosting.

## Next Integration Step

Update the Moodle `alphabet_listen` route after Bunny deployment so it points to the repo-built unit path:

```php
'alphabet_listen' => '/pre_quraan/units/alphabet/index.html?managed=1&v=...'
```

Do this only after the Bunny upload path is confirmed.

The app shell launcher route in `issue.php` should remain:

```php
$appBase = 'https://app.quraan.academy';
$appPath = '/pre_quraan/scripts/index_v030.html';
```
