# Bunny Deploy

Build deployable files with:

```bash
npm run build:bunny
```

Verify the upload package before testing or deployment:

```bash
npm run verify:bunny
```

Preview the Bunny-style output locally with:

```bash
npm run preview:bunny
```

Then open:

```text
http://127.0.0.1:4173/pre_quraan/units/alphabet/index.html
```

Do not preview the built `index.html` with `file://`; absolute `/pre_quraan/...` CSS and JavaScript paths only resolve correctly when the files are served from a web root.

The build writes Bunny-ready static files to:

```text
dist/pre_quraan/
```

The Alphabet unit is emitted as:

```text
dist/pre_quraan/scripts/index_v030.html
dist/pre_quraan/scripts/index.html
dist/pre_quraan/scripts/css/
dist/pre_quraan/scripts/js/
dist/pre_quraan/scripts/img/
dist/pre_quraan/units/alphabet/index.html
dist/pre_quraan/styles/shared/
dist/pre_quraan/scripts/js/shared/
dist/pre_quraan/styles/units/alphabet.css
dist/pre_quraan/scripts/js/units/alphabet/unit.config.js
dist/pre_quraan/scripts/js/units/alphabet/unit.runtime.js
dist/pre_quraan/scripts/js/units/alphabet/patches/
```

Upload the contents of `dist/pre_quraan/` to Bunny.net under the `/pre_quraan/` path.

The upload root should contain folders like:

```text
scripts/
styles/
units/
```

For example, local file:

```text
dist/pre_quraan/scripts/index_v030.html
```

Should become:

```text
https://app.quraan.academy/pre_quraan/scripts/index_v030.html
```

`index_v030.html` is currently emitted as a compatibility alias for Moodle routes. The stable source file is `src/app-shell/index.html`, and the build also emits `dist/pre_quraan/scripts/index.html`.

## Upload Options

### Option A: Dashboard Upload

Use Bunny dashboard file manager if you prefer a visual first deployment:

1. Open Bunny.net dashboard.
2. Open the Storage Zone connected to `app.quraan.academy`.
3. Browse files and open or create the `pre_quraan` folder.
4. Upload the contents of `dist/pre_quraan/` into that folder.
5. Confirm this URL loads:

```text
https://app.quraan.academy/pre_quraan/scripts/index_v030.html
```

### Option B: HTTP API Upload

Set these in PowerShell, using the Storage Zone password from Bunny's `FTP & API Access` tab:

```powershell
$env:BUNNY_STORAGE_ZONE = "your-storage-zone-name"
$env:BUNNY_STORAGE_ACCESS_KEY = "your-storage-zone-password"
$env:BUNNY_STORAGE_ENDPOINT = "https://storage.bunnycdn.com"
$env:BUNNY_REMOTE_PREFIX = "pre_quraan"
```

For regional storage zones, replace the endpoint with Bunny's regional endpoint, such as:

```text
https://ny.storage.bunnycdn.com
https://uk.storage.bunnycdn.com
```

Then run:

```powershell
npm.cmd run build:bunny
npm.cmd run verify:bunny
npm.cmd run deploy:bunny
```

Do not commit real Bunny credentials.

The source HTML in `src/units/alphabet/index.html` uses stable shared dependency names. The build rewrites unit-local paths to production `/pre_quraan/...` paths for Bunny output.
