# Generated Bundle Policy

The shared unit runtime is edited as source fragments under:

```text
src/shared/js/runtime/*.js
```

The browser loads the generated bundle:

```text
src/shared/js/runtime/runtime.bundle.js
```

Do not hand-edit `runtime.bundle.js`. It is rebuilt from the fragment manifest in:

```text
tools/build-unit-runtime-bundle.js
```

When changing runtime behavior:

1. Edit the semantic shared source fragment, such as `speak.js`, `grid.js`, `playback.js`, or `progress.js`.
2. Run `npm.cmd run check:alphabet` to rebuild and syntax-check the bundle.
3. Run `npm.cmd run build:bunny` before local Bunny preview or deployment.
4. Commit the changed fragments and the regenerated `runtime.bundle.js` together.

For now, `runtime.bundle.js` stays committed under `src/shared/js/runtime/` because the current static Bunny output and simple hosting flow depend on a ready browser bundle. If the build pipeline later becomes mandatory for every deploy, the bundle can move to generated output only.
