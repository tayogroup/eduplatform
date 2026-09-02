// PRE-release step, and the only one in this tool that runs before the upload.
//
// The sibling hooks (require-tiers-in-step, require-platform-cors) run AFTER the
// PUTs, because they answer "is what I just shipped usable?" and the deploy
// stands either way. This one answers "should this go out at all?", and the
// three print sheets are the one thing a release can break where the damage
// lands on paper — a page a teacher prints for a child, where nothing reports
// back and no rollback reaches the copies already in a folder. So it blocks.
//
// ENGLISH ONLY, deliberately. `printSheetCss()` and the three sheets live in
// shell/subjects/english.js and are drawn from Student resources there; the
// other five subjects have no print path at all, so running a 2m20s Chromium
// sweep in front of a Global Perspectives release would be pure cost. The gate
// itself only ever loads /english/, so pointing it at anything else would check
// nothing while looking busy.
//
// It runs BEFORE the zone lock is taken. Holding the lock across two and a half
// minutes of rendering would block every other subject's release for a check
// that is about this working tree and not about the zone at all.
//
// The full sweep, never --quick. That is the whole point of running it here:
// --quick (chained into check:english) samples unit 1 of every grade, and page
// count is the only assertion that varies per unit — so a Unit or Grade plan
// that grew onto a second page at unit 7 is exactly what --quick cannot see and
// exactly what a content release changes.

const path = require("path");
const { spawnSync } = require("child_process");

function requirePrintSheets(subjects, { skip = false } = {}) {
  if (!subjects.includes("english")) return true;
  if (skip) {
    console.log("\n──────── print ──────── SKIPPED by --skip-print-check; the sheets were not checked");
    return true;
  }

  const check = path.join(__dirname, "..", "check-print-sheets.mjs");
  console.log("\n──────── print ──────── rendering all 240 Student-resources sheets through Chrome (~2m20s)");
  const run = spawnSync(process.execPath, [check], { stdio: "inherit" });

  const refuse = (msg, hint) => {
    console.error(`\n✗ ${msg}`);
    console.error(`  ${hint}`);
    console.error("  Nothing has been uploaded. Fix it, or pass --skip-print-check to release anyway.");
    return false;
  };

  if (run.error || run.status === null) {
    return refuse(
      `could not run check-print-sheets.mjs (${run.error ? run.error.message : "no exit status"}).`,
      "The sheets were NOT checked, which is not the same as their being fine.",
    );
  }
  // 2 = it refused to run: a bad argument, no Chromium, or fewer sheets rendered
  // than its own floor. Every one of those means it compared nothing, and a tick
  // over a comparison that never ran is this repo's most-repeated failure.
  if (run.status === 2) {
    return refuse(
      "check-print-sheets.mjs refused to run — see above. Nothing was checked.",
      "Most often Chromium is missing: npx playwright install chromium",
    );
  }
  if (run.status !== 0) {
    return refuse(
      "the printed sheets are wrong — see the findings above.",
      "A bad sheet reaches a child on paper, where no rollback can follow it.",
    );
  }
  console.log("\n✓ every Student-resources sheet still paginates. Proceeding with the release.");
  return true;
}

module.exports = { requirePrintSheets };
