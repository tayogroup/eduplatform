// The one reader and writer of .bunny-upload-manifest.json.
//
// The file records what upload-media-to-bunny.js has sent. It began as a flat
// LIST of remote paths, which says a path was uploaded once and nothing about
// what was in it — so a clip re-recorded under the same filename was skipped
// forever. That cost 853 stale clips once, then 4,831 more that sat undeployed
// for weeks while every run reported success. It now stores `path -> sha1 of
// the bytes sent`, and a file is skipped only when the hash still matches.
//
// This module exists because the format has FOUR readers, and three of them
// (the deploy-sync check and the two pruners) assumed an array. Two of those
// three also wrote an array back, which would have silently downgraded a hashed
// manifest to a path list and reintroduced the defect on the next prune — a
// regression with no symptom until months-old audio turned up in production
// again. One definition, so the shape can only change in one place.
"use strict";

const fs = require("fs");

/** The manifest as `{ remotePath: sha1|null }`. A legacy array reads as
 *  `{path: null}` — "uploaded, contents unknown", which is not a hash match, so
 *  those files upload once more and gain one. Missing file reads as empty. */
function readManifest(file) {
  if (!fs.existsSync(file)) return {};
  const raw = JSON.parse(fs.readFileSync(file, "utf8"));
  if (!Array.isArray(raw)) return raw;
  return Object.fromEntries(raw.map((remote) => [remote, null]));
}

/** Just the remote paths, for callers that only ask "was this ever sent". */
function readManifestPaths(file) {
  return Object.keys(readManifest(file));
}

/** Always writes the object form. Never write this file by hand: a bare
 *  JSON.stringify of an array here is the downgrade described above. */
function writeManifest(file, manifest) {
  if (Array.isArray(manifest)) {
    throw new TypeError("refusing to write the manifest as an array — that drops every hash");
  }
  fs.writeFileSync(file, JSON.stringify(manifest));
}

module.exports = { readManifest, readManifestPaths, writeManifest };
