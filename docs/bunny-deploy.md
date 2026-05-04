# Bunny Deploy

Build deployable files with:

```bash
npm run build:bunny
```

The build writes Bunny-ready static files to:

```text
dist/pre_quraan/
```

The Alphabet unit is emitted as:

```text
dist/pre_quraan/units/alphabet/index.html
dist/pre_quraan/styles/locked/
dist/pre_quraan/styles/units/alphabet.css
dist/pre_quraan/scripts/js/units/alphabet/unit.config.js
dist/pre_quraan/scripts/js/units/alphabet/unit.runtime.js
dist/pre_quraan/scripts/js/units/alphabet/patches/
```

Upload the contents of `dist/pre_quraan/` to Bunny.net under the `/pre_quraan/` path.

The source HTML in `src/units/alphabet/index.html` uses local relative paths for development. The build rewrites those paths to production `/pre_quraan/...` paths for Bunny output.
