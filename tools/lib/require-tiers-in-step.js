// Post-deploy step shared by upload-content-to-bunny.js and
// deploy-app-version.js: having shipped one tier, say whether the others still
// agree with it.
//
// It exists because agreement is nobody's job at deploy time. Each uploader has
// its own manifest and verifies its own work, and on 2026-08-12 that was enough
// for Mathematics to ship app v141 against content three weeks old with both
// sides reporting success. The grading rule in the new code reads every number
// in a stored answer as a value the learner must produce, so against the old
// text "1) 43, 45, 47." asserted [1, 43, 45, 47]: the question number became a
// required answer, 557 items across 102 units started rejecting correct work,
// and 16 grades shut behind an unreachable fluency threshold.
//
// Deliberately a POST step, not a pre-flight. Before a release the working tree
// is supposed to be ahead of the CDN, so checking first would fail every
// legitimate deploy. Checking after answers the question the operator actually
// has — am I finished? — and the upload stands either way; only the exit code
// changes.
//
// Scoped to the subjects just deployed. Running the whole suite here would fail
// on another subject's unrelated drift and teach everyone to ignore it.

const path = require("path");
const { spawnSync } = require("child_process");

// The six the sync check knows. A subject outside this list is skipped rather
// than passed through, because the check exits 2 on an unknown name and that
// would look like a deploy failure.
const CHECKED = new Set(["english", "mathematics", "science", "computing", "global-perspectives", "intensive-english"]);

function requireTiersInStep(subjects) {
  const scope = [...new Set(subjects || [])].filter((s) => CHECKED.has(s));
  if (!scope.length) return true;

  const check = path.join(__dirname, "..", "check-ehel-deploy-sync.mjs");
  console.log(`\n──────── tiers ──────── checking app, content and audio agree for: ${scope.join(", ")}`);
  const run = spawnSync(process.execPath, [check, ...scope], { stdio: "inherit" });

  // A check that cannot run must not read as agreement — the whole failure this
  // guards is two sides each looking fine on their own.
  if (run.error || run.status === null) {
    console.error(`\n✗ could not run check-ehel-deploy-sync.mjs (${run.error ? run.error.message : "no exit status"}).`);
    console.error("  The deploy stands, but nothing confirmed the tiers agree. Run it by hand before walking away.");
    process.exitCode = 1;
    return false;
  }
  if (run.status !== 0) {
    console.error("\n✗ this deploy leaves the tiers out of step. What you shipped is live; something else is not.");
    console.error("  Follow the instruction printed above for each subject before treating the release as done.");
    process.exitCode = 1;
    return false;
  }
  console.log("\n✓ app, content and audio agree for everything this deploy touched.");
  return true;
}

module.exports = { requireTiersInStep, CHECKED };
