import fs from "fs";

/* The four platform modules the wiring imports - see
   ../../lesson-app-tools/wire-platform-controls.py and wire-progress.py.
   deploy.mjs copies all four in beside the lessons.

   TWO SEPARATE JOBS HERE, and the split was forced by a mutation the first
   version of this file did not catch.

   1. NOISE. None of the four can load in these checks, and not because they are
      missing: an ES module import is impossible from a file:// page whatever is
      on disk, because Chrome allows module fetches only over chrome,
      chrome-untrusted, data, http and https. Four expected errors in every run
      is the condition in which a real one goes unnoticed, so residualErrors()
      drops exactly those and returns everything else.

      Chrome reports each blocked load TWICE - once naming the URL ("Access to
      script at '...wehel.js' ... blocked by CORS policy") and once bare
      ("Failed to load resource: net::ERR_FAILED"). The bare one names nothing,
      so it cannot be matched on the module. It is dropped BY COUNT instead, up
      to the number of platform modules the page imports and no further: a fifth
      failing resource is still reported. Blanket-dropping the string would hide
      any other 404 on the page.

   2. PRESENCE. The first version then asserted that all four had been blocked,
      on the theory that a dropped import would stop appearing. It does not.
      preload-platform.py puts <link rel="modulepreload"> on the same four URLs,
      so the fetch and its error happen whether the import is there or not - the
      assertion was measuring the preload. Removing the wehel.js import from a
      lesson left it green.

      That is the same trap check-lessons.py's own mutation suite hit: a
      substring test for "./course-shell.js" satisfied by the modulepreload link
      while the import itself was gone.

      No runtime signal can separate the two, because both are one GET of one
      URL. So presence is checked STATICALLY, against the import statement,
      which is the only thing that differs.

   Matched with includes() on a literal, not a built regex. The regex version
   was written through a shell heredoc that collapsed its backslashes, so "\s"
   became "s", nothing matched, and the check reported all four missing on a
   perfectly good page - a false positive that reads as the wiring being broken. */
/* FIVE since focus mode: wire-platform-controls.py imports seb-session.js for its
   side effect - `import "./seb-session.js";`, with no `from` clause - and
   preload-platform.py preloads it. Left off this list, its two file:// errors
   were reported as real ones by every check-l*.mjs (2026-09-11). */
export const PLATFORM_MODULES = ["learner-controls.js", "wehel.js", "course-shell.js", "progress-client.js", "seb-session.js"];

const NAMED = (msg) =>
  PLATFORM_MODULES.some((m) => msg.includes(m)) &&
  /blocked by CORS policy|ERR_FAILED|Failed to load resource/.test(msg);

const BARE = (msg) => /Failed to load resource: net::ERR_FAILED/.test(msg) && !PLATFORM_MODULES.some((m) => msg.includes(m));

/** Modules the page never actually imports. A modulepreload link cannot satisfy
 *  this, because it carries no `from` clause. */
export function notImported(file) {
  const s = fs.readFileSync(file, "utf8");
  // a side-effect import has no `from`: `import "./seb-session.js";`
  return PLATFORM_MODULES.filter((m) => !s.includes('from "./' + m + '"') && !s.includes('import "./' + m + '";'));
}

/** Everything that is NOT an expected platform-module block. Pass the lesson
 *  file so the bare-error budget matches the modules that page really imports;
 *  omit it for a page with none, such as the hub. */
export function residualErrors(errors, file) {
  const imported = file ? PLATFORM_MODULES.length - notImported(file).length : 0;
  let budget = imported;
  return errors.filter((e) => {
    if (NAMED(e)) return false;
    if (BARE(e) && budget > 0) { budget--; return false; }
    return true;
  });
}
