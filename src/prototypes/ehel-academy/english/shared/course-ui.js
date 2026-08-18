// English course UI — loader only. The implementation lives in
// ../../shell/subjects/english.js.
//
// This file used to be a second, standalone copy of the same ~2,500 lines. The two
// drifted: the shell module gained the Grade 1 grammar carousel this one never had,
// and the identical shared-audio path bug had to be found and fixed twice (c30b3b8ae
// here, 242b9269 there). The shell module is the one that ships —
// tools/deploy-app-version.js runs in --shell mode and builds v{TAG}/course-ui.js
// from shell/subjects/english.js — so that is the copy kept, and dev now runs
// exactly the same code as production instead of a diverging sibling.
//
// The file stays at this path because the deploy contract depends on the name:
// versionIndexHtml() rewrites "./shared/course-ui.js" in index.html to
// "v{TAG}/course-ui.js", and course-ui.js is the one entry --shell mode excludes
// from the version bundle (it is replaced by the shell subject module). Repointing
// index.html straight at ../shell/subjects/english.js would break that rewrite and
// leave the deployed entry unversioned.
//
// index.html and shell-test.html expose the same DOM ids, so both drive this app.
import "../../shell/subjects/english.js?v=english-shell-20260818a";
