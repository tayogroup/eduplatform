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
dist/pre_quraan/scripts/css/
dist/pre_quraan/scripts/js/
dist/pre_quraan/scripts/img/
dist/pre_quraan/units/alphabet/index.html
dist/pre_quraan/styles/locked/
dist/pre_quraan/scripts/js/locked/
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

The source HTML in `src/units/alphabet/index.html` uses local relative paths for development. The build rewrites those paths to production `/pre_quraan/...` paths for Bunny output.
