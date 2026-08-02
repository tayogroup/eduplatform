// Intensive English course UI — loader only. The implementation lives in
// ../../shell/subjects/intensive-english.js.
//
// index.html used to load that module directly. That worked in dev but put the
// course outside tools/deploy-app-version.js, whose contract is that an entry
// references ./shared/course-ui.{css,js} — those are the two names it rewrites
// to the immutable v{TAG}/ path. Sitting outside it, the course had no way to
// bust the CDN cache at all: it carried a ?v= tag, and the pull zone ignores
// query strings, so a change to the module was invisible for thirty days.
//
// This file is deliberately not uploaded: a --shell release builds
// v{TAG}/course-ui.js from the shell subject module instead (see buildItems),
// so the deployed entry loads the real implementation, not this indirection.
// Same arrangement as english/shared/course-ui.js.
import "../../shell/subjects/intensive-english.js";
