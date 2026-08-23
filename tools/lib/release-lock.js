// A mutual-exclusion lock around a release to one Bunny storage zone.
//
// WHY THIS EXISTS
// ===============
// On 2026-08-24 two sessions on this machine were each told, by the same human,
// to release English v261. Both would have written app/english/v261/. It did not
// happen, and the only reason is that both sessions announced their tag in chat
// before writing and one stood down — a convention that had to win a race, and
// won it by about sixty seconds.
//
// deploy-app-version.js already refuses a tag that exists on storage with
// DIFFERENT bytes, and deliberately allows the same bytes ("a retry after a
// failed upload is not a second release"). That is exactly the case that
// applied here: both sessions were building the same two commits from the same
// HEAD, so their bundles were byte-identical (verified afterwards — both
// produced af28fd9d…). The guard would have waved the second one straight
// through and nothing in the uploaded files would have looked wrong.
//
// What breaks is .bunny-appver-manifest.json. Whoever wrote it second erases
// the other's record of what it just uploaded, and that manifest decides what a
// FUTURE upload SKIPS — so the loss is silent, permanent, and only shows up
// later as a file that never goes up again while the tool reports success. A
// version path is immutable and edge-cached for a year, and there is no purge
// key in .env, so it cannot be repaired by re-running anything.
//
// WHAT IT LOCKS, AND WHY THAT KEY
// ===============================
// One lock per storage ZONE, held for the whole upload — from before the
// manifest is read to after it is written back, because that read-modify-write
// is half of what is being protected.
//
// The lock file lives in the OS temp directory, NOT in the repo and NOT in the
// release tree. That is load-bearing rather than incidental: releases here are
// routinely run from a `git archive HEAD` tree in a fresh temp directory (see
// CLAUDE.md), so two concurrent releases have two different repo roots and two
// different copies of the manifest. A lock beside the manifest would be a lock
// each session held against itself. The zone is the thing actually contended,
// and it is the same string from any tree.
//
// STALE LOCKS
// ===========
// A killed release must not wedge every later one, and a human should never
// have to go hunting for a file. Two independent releases:
//   - the holder's pid is no longer alive (checked with signal 0, which tests
//     for the process without touching it), or
//   - the lock is older than STALE_MS.
// Both are needed. A pid check alone fails when the pid has been recycled onto
// an unrelated process, which would keep a dead lock alive indefinitely; a TTL
// alone makes every release wait out the clock after a crash. Either condition
// breaks the lock, and breaking one is always reported, never silent.
//
// WHAT IT DOES NOT COVER
// ======================
// This is a LOCAL lock. Two releases from two different machines do not see
// each other's lock file, and Bunny storage has no compare-and-swap to build a
// remote one on. The cross-machine case is covered — partially — by the tag
// guard in deploy-app-version.js, which this change also tightens so that a tag
// already on storage but absent from this checkout's manifest is refused even
// when the bytes match. Between them the observed failure is closed by a
// mechanism; do not read either as a distributed lock.

"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

// Long enough that a slow release (a full six-subject upload over a bad link)
// is never mistaken for a dead one, short enough that a crash does not block
// the next attempt for the rest of the session. The pid check is what handles
// the common crash; this is only the backstop for a recycled pid.
const STALE_MS = 30 * 60 * 1000;

const lockPath = (zone) => path.join(os.tmpdir(), `ehel-release-${zone}.lock`);

function readHolder(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    // Unreadable or truncated — a release that died between open and write.
    // Treat it as a lock with no owner, which the staleness test below breaks.
    return null;
  }
}

function isAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    // EPERM means the process exists and belongs to somebody else, which for
    // our purposes is alive. Only ESRCH proves it is gone.
    return e.code === "EPERM";
  }
}

function staleReason(holder) {
  if (!holder) return "the lock file could not be read";
  if (!isAlive(holder.pid)) return `pid ${holder.pid} is no longer running`;
  const age = Date.now() - Date.parse(holder.startedAt || 0);
  if (!(age < STALE_MS)) return `it has been held for ${Math.round(age / 60000)} minutes`;
  return null;
}

const describe = (holder) => (holder
  ? `pid ${holder.pid} on ${holder.host}, ${holder.what || "a release"}, started ${holder.startedAt}${holder.tree ? `\n    from ${holder.tree}` : ""}`
  : "an unreadable lock file");

// Take the lock, or fail loudly. Returns a release() to call when done —
// idempotent, so a caller may call it from both a finally and an exit handler.
//
// `force` skips a live holder. It exists because every guard here needs an
// escape hatch, but it is the one flag in this file that can cause the damage
// the file was written to prevent, so it says so when used.
function acquireReleaseLock({ zone, what = "", tree = process.cwd(), force = false }) {
  const file = lockPath(zone);
  const mine = {
    pid: process.pid,
    host: os.hostname(),
    what,
    tree,
    startedAt: new Date().toISOString(),
    // Identity, and it has to be a nonce rather than (pid, startedAt). That pair
    // looks unique and is not: toISOString has millisecond resolution, so a lock
    // taken and one written by another process in the same millisecond compare
    // equal, and release() then deletes somebody else's lock believing it to be
    // its own — handing a third release into the middle of the second. Found by
    // the test for exactly that case failing, not by reasoning about it.
    nonce: crypto.randomBytes(8).toString("hex"),
  };

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      // 'wx' is the whole mechanism: create-if-absent is one atomic syscall, so
      // two processes racing here cannot both succeed. Everything else in this
      // file is about what to do with the one that loses.
      const fd = fs.openSync(file, "wx");
      fs.writeFileSync(fd, JSON.stringify(mine, null, 2));
      fs.closeSync(fd);
      break;
    } catch (e) {
      if (e.code !== "EEXIST") throw e;
      const holder = readHolder(file);
      const stale = staleReason(holder);
      if (force) {
        console.error(`\nWARNING: --force-lock is overriding a live release lock held by\n    ${describe(holder)}`);
        console.error("If that release is still uploading, both of you are writing the same immutable\nversion path and the manifest of whoever finishes first will be lost silently.\n");
      } else if (stale) {
        console.error(`\nBreaking a stale release lock on zone "${zone}" — ${stale}.\n  It was held by ${describe(holder)}`);
      } else {
        // The message is the product here. Somebody is mid-release and the
        // right move is to wait or to talk to them, not to reach for a flag,
        // so name the holder precisely enough to go and find them.
        const err = new Error(
          `another release is in progress on zone "${zone}":\n`
          + `    ${describe(holder)}\n\n`
          + "Two releases writing one version path is unrecoverable: a version path is immutable,\n"
          + "cached at the edge for a year, and cannot be purged with the key in .env. If the bundles\n"
          + "are identical the files will look correct and the damage will be a silently clobbered\n"
          + ".bunny-appver-manifest.json, which decides what a FUTURE upload skips.\n\n"
          + "Wait for it to finish, or pass --force-lock if you know that release is dead."
        );
        err.code = "ERELEASELOCKED";
        throw err;
      }
      // Lost the race but entitled to the lock: drop the holder's file and go
      // round once. A second EEXIST means somebody else claimed it in between,
      // and that one is fresh by definition — the loop exits and reports it.
      try { fs.unlinkSync(file); } catch { /* already gone; the retry will take it */ }
    }
  }

  let released = false;
  return function release() {
    if (released) return;
    released = true;
    // Only ever remove OUR lock. If it has been force-broken and retaken while
    // we ran, deleting it would hand a third release into the middle of the
    // second one — the failure this file exists to prevent, caused by its own
    // cleanup.
    const holder = readHolder(file);
    if (holder && holder.nonce === mine.nonce) {
      try { fs.unlinkSync(file); } catch { /* nothing left to release */ }
    }
  };
}

module.exports = { acquireReleaseLock, lockPath, STALE_MS };
