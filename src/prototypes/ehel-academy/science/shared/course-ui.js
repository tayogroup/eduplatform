// Science course UI — loader only. The implementation lives in
// ../../shell/subjects/science.js.
//
// This file used to be a second, standalone copy of the same ~1,160 lines.
// Production has not run it since 2026-07-22: deploy-app-version.js in --shell
// mode builds v{TAG}/course-ui.js from the shell subject module, and science has
// been live on a shell release since v110. Only the dev server loaded this copy,
// so dev and production were running different code.
//
// The two had not drifted — every commit since the shell landed touched both by
// hand, and 23 of the 25 renderers were byte-identical (the other two,
// renderNav and renderRoute, belong to the shell core and are absent here by
// design). That hand-syncing is exactly the tax the English module removed when
// it did this: the same shared-audio path bug had to be found and fixed twice,
// once in each twin. Keeping one copy is what stops the next fix landing once.
//
// The path stays because the deploy contract depends on the name:
// versionIndexHtml() rewrites "./shared/course-ui.js" in index.html to
// "v{TAG}/course-ui.js", and course-ui.js is the one entry --shell mode excludes
// from the version bundle (it is replaced by the shell subject module).
// Pointing index.html at ../shell/subjects/science.js directly would break that
// rewrite and trip the guard requiring the stable name.
import "../../shell/subjects/science.js";
