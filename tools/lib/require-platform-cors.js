// Post-deploy step beside require-tiers-in-step.js: having shipped, say whether
// the platform still answers the calls the app makes.
//
// The tier check asks "did everything I shipped go together?". This asks the
// question nothing asked before 2026-08-26: "can a learner's browser reach the
// API at all?" That day a browser-integrity challenge was put in front of the
// Moodle box and answered CORS preflights with an HTML interstitial. Book
// narration, Wehel and progress saving all died at once; the pre-rendered audio
// on the CDN kept playing, so it read as one broken feature, and the blocked
// requests never reached Apache, so the server's own logs showed nothing.
//
// It runs AFTER the upload for the same reason the tier check does: the deploy
// stands either way, and this answers the operator's real question — is what I
// just shipped actually usable?
//
// A deploy is also the one moment when "could not reach it" is worth failing
// on. The upload just proved this machine can reach the network; if the
// platform is unreachable in the same breath, that is a fact about the
// platform, not about the laptop.

const path = require("path");
const { spawnSync } = require("child_process");

function requirePlatformCors() {
  const check = path.join(__dirname, "..", "check-platform-cors.mjs");
  console.log("\n──────── platform ──────── checking the app's cross-origin calls still work");
  const run = spawnSync(process.execPath, [check], { stdio: "inherit" });

  if (run.error || run.status === null) {
    console.error(`\n✗ could not run check-platform-cors.mjs (${run.error ? run.error.message : "no exit status"}).`);
    console.error("  The deploy stands, but nothing confirmed learners can reach the API.");
    process.exitCode = 1;
    return false;
  }
  // 3 = it could not reach the host, so it checked nothing. Not agreement.
  if (run.status === 3) {
    console.error("\n✗ the platform could not be reached, so its API was NOT checked. Your upload stands.");
    console.error("  Run it again from a network that can see the platform before treating the release as done.");
    process.exitCode = 1;
    return false;
  }
  if (run.status === 2) {
    console.error("\n✗ check-platform-cors.mjs refused to run — see above. Nothing was checked.");
    process.exitCode = 1;
    return false;
  }
  if (run.status !== 0) {
    console.error("\n✗ the app's cross-origin calls are being refused. What you shipped is live and unusable:");
    console.error("  runtime narration, Wehel and progress saving are all down until this is fixed.");
    process.exitCode = 1;
    return false;
  }
  console.log("\n✓ the platform answers every cross-origin call the app makes.");
  return true;
}

module.exports = { requirePlatformCors };
