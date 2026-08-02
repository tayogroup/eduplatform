// Computing course UI — loader only. The implementation lives in
// ../../shell/subjects/computing.js.
//
// This file used to be a standalone 1,309-line app that re-implemented the
// boot, routing, navigation, voice engine and progress store the shell core
// already owns. 9 of its renderers were byte-identical to science's and 13 more
// differed only in subject wording, so almost all of it was a third copy of the
// science/mathematics scaffolding.
//
// Migrating it moved 28 renderers across byte-for-byte; only renderNav and
// renderRoute were dropped, because those belong to ../course-app.js. The six
// genuinely computing-only sections — Tools & Setup, Code Examples, Debug It,
// Stay Safe Online, Unit Project and Computing Words — came over unchanged.
//
// The path stays because the deploy contract depends on the name:
// versionIndexHtml() rewrites "./shared/course-ui.js" in index.html to
// "v{TAG}/course-ui.js", and course-ui.js is the one entry --shell mode
// excludes from the version bundle (it is replaced by the shell subject
// module). Computing must now be released WITH --shell; the guard in
// deploy-app-version.js is updated to match.
import "../../shell/subjects/computing.js";
