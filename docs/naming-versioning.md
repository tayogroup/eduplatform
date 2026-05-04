# Naming And Versioning

Active source and Bunny output filenames should be stable:

```text
app-shell.js
app-config.js
design-system.css
core-speak-engine.js
shared-match-engine.js
unit.config.js
unit.runtime.js
runtime.bundle.js
```

Do not include semantic versions, dates, patch labels, or `locked` in active filenames.

Version information belongs in:

1. Git commits and tags, such as `alphabet-v1.0.0` or `shared-v1.0.0`.
2. Release notes and deployment records.
3. Manifest metadata, such as `src/shared/shared.manifest.json`.

Stable names make cloning safer because every unit can reference the same shared dependency names. When a shared file changes, update the file content, run validation, and tag the release instead of changing every HTML reference.

## File Naming Rules

- Use lowercase kebab-case for shared app files: `core-audio-resolver.js`, `arabic-tiles.css`.
- Use fixed unit names for unit-owned files: `index.html`, `unit.config.js`, `unit.css`, `unit.runtime.js`.
- Use semantic runtime fragments: `progress.js`, `grid.js`, `playback.js`, `speak.js`, `write.js`.
- Keep generated bundle names stable: `runtime.bundle.js`.
- Use query strings only for temporary cache-busting during emergency production testing, not as the normal versioning system.

## Release Tags

Recommended tag format:

```text
app-shell-v1.0.0
shared-v1.0.0
alphabet-v1.0.0
release-YYYY-MM-DD
```

For cloned units:

```text
<unit-key>-v1.0.0
```
