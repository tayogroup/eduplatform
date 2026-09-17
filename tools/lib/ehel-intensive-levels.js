"use strict";

/**
 * Where each Intensive English level lives on disk.
 *
 * For four years a level's number WAS its folder name — `level-1` through
 * `level-3`, later `level-0` — so a dozen tools wrote `level-${n}` inline and
 * discovered levels with `/^level-(\d+)$/`. The Phonics level breaks that:
 * it sits below Intro, so its number is -1, and `level--1` is not a folder
 * name anybody should see. It is `level-phonics`.
 *
 * Every one of those inline literals then fails the same way, which is the
 * dangerous way: SILENTLY, while reporting success. A discovery regex that no
 * longer matches yields one fewer level and no error; a path built as
 * `level-${-1}` points at nothing and the caller's `if (!fs.existsSync) continue`
 * skips it. In this session five separate tools were found doing exactly that
 * for the Intro level — a generator whose default was `[1, 2]`, an argument
 * filter of `/^[1-5]$/` that ignored `0` and silently WIDENED to every level, a
 * pruner listing `[1,2,3]`, an uploader looping from `g = 1`, and a catalogue
 * loop from `level = 1`. Each walked real files, uploaded the ones it saw, and
 * printed a tick.
 *
 * So the mapping lives here once, and it is DISCOVERED rather than declared:
 * each level's own `data/course-manifest.json` states its number, and that file
 * ships with the content, so a release tree and a dev tree answer alike. A
 * hardcoded table here would be the same defect one directory further up.
 *
 * Callers should prefer `levels()` and `levelDir()` over any literal. If you
 * are about to write `level-${n}`, write `levelDir(n)` instead.
 */

const fs = require("fs");
const path = require("path");

const COURSE_ROOT = path.join(
  __dirname, "..", "..",
  "src", "prototypes", "ehel-academy", "intensive-english");

/**
 * Every level that exists, ordered by number.
 *
 * A directory counts as a level when it holds `data/course-manifest.json` with
 * a numeric `level.number`. That deliberately excludes the `level-N-app`
 * standalone builds, which carry no manifest.
 */
function levels(courseRoot = COURSE_ROOT) {
  if (!fs.existsSync(courseRoot)) return [];
  const out = [];
  for (const entry of fs.readdirSync(courseRoot)) {
    if (!entry.startsWith("level-")) continue;
    const manifestPath = path.join(courseRoot, entry, "data", "course-manifest.json");
    if (!fs.existsSync(manifestPath)) continue;
    let level;
    try {
      level = JSON.parse(fs.readFileSync(manifestPath, "utf8")).level;
    } catch (error) {
      throw new Error(`${entry}/data/course-manifest.json is not readable JSON: ${error.message}`);
    }
    if (!level || typeof level.number !== "number") continue;
    out.push({ number: level.number, dir: entry, id: level.id, label: level.label });
  }
  return out.sort((a, b) => a.number - b.number);
}

/** Just the numbers, ordered. `[-1, 0, 1, 2, 3]` today. */
function levelNumbers(courseRoot = COURSE_ROOT) {
  return levels(courseRoot).map((level) => level.number);
}

/**
 * The folder name for a level number.
 *
 * Throws rather than guessing. A caller that asked for a level which does not
 * exist has a bug, and returning `level-${n}` would hand it a path that simply
 * never matches anything — the silent failure this module exists to stop.
 */
function levelDir(number, courseRoot = COURSE_ROOT) {
  const found = levels(courseRoot).find((level) => level.number === Number(number));
  if (!found) {
    const known = levelNumbers(courseRoot).join(", ");
    throw new Error(`No Intensive English level numbered ${number}. Levels are: ${known}`);
  }
  return found.dir;
}

/** The absolute path to a level's folder. */
function levelPath(number, courseRoot = COURSE_ROOT) {
  return path.join(courseRoot, levelDir(number, courseRoot));
}

/** The number for a folder name, or null when it is not a level folder. */
function levelFromDir(dir, courseRoot = COURSE_ROOT) {
  const found = levels(courseRoot).find((level) => level.dir === dir);
  return found ? found.number : null;
}

module.exports = { COURSE_ROOT, levels, levelNumbers, levelDir, levelPath, levelFromDir };
