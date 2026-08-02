// Global Perspectives course UI — loader only. The implementation lives in
// ../../shell/subjects/global-perspectives.js.
//
// This file used to be a standalone 684-line app with its own boot, routing,
// navigation, voice engine and progress store — a fourth copy of scaffolding
// the shell core already owns. All 15 renderers moved across byte-for-byte;
// only renderNav, renderRoute and renderPickers were dropped, the first two
// because ../course-app.js owns them and the third because it became the
// module's onReady hook.
//
// Two things the shell had to accommodate rather than flatten: this course has
// no stage capstone (so no grade progress store), and its section list is
// computed per unit from the pack shape rather than fixed. Both are config
// hooks, not exceptions.
//
// The path stays because the deploy contract depends on the name:
// versionIndexHtml() rewrites "./shared/course-ui.js" in index.html to
// "v{TAG}/course-ui.js", and course-ui.js is the one entry --shell mode
// excludes from the version bundle (it is replaced by the shell subject
// module). Global Perspectives must now be released WITH --shell.
import "../../shell/subjects/global-perspectives.js";
