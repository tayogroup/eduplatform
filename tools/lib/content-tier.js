// What counts as CONTENT — the one definition, shared by the uploader and the
// check that grades it.
//
// upload-content-to-bunny.js walks each subject's grade-N/data tree and takes
// every .json it finds, because that is what the app reads. check-ehel-deploy-
// sync.mjs then walks the same tree the same way and reports anything on disk
// that the CDN does not match. The two must agree about what belongs in the
// tier or the check is grading the uploader against a different rule than the
// uploader is following — and it fails in the direction that is worst: the
// uploader is right, the check is red, and the red is permanent because no
// upload can ever satisfy it.
//
// That is exactly what happened. The Core-word authoring files were excluded
// from the uploader on 2026-08-28 (they are not content — see below) and the
// check knew nothing about it, so english reported "1 stale, 6 never uploaded"
// on every run, none of them learner content. A check that is permanently red is
// one people stop reading, which is how a real failure gets skimmed past; this
// repo has several other entries about precisely that.
//
// Hence one module, imported by both, rather than the same regex written twice.
"use strict";

// core-words.json is the allocation plan, core-words-draft.json the review
// surface, core-words-authored.json the hand-written source the build reads.
// The app fetches none of them. They live under data/ only because that is where
// the build reads them, so without this they ship as a side effect of the
// directory layout rather than any decision — and they carry working notes about
// the content's own defects, which is not something to put on a public CDN by
// accident.
const AUTHORING_ONLY = /(^|\/)core-words(-draft|-authored)?\.json$/;

/**
 * True for a file that lives in a data/ tree but is not part of the content
 * tier. `rel` is the path relative to that tree, with forward slashes.
 */
function isAuthoringArtefact(rel) {
  return AUTHORING_ONLY.test(String(rel).replace(/\\/g, "/"));
}

module.exports = { isAuthoringArtefact };
