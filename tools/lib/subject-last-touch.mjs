// Print the last commit that touched a subject, as the first line of its gate.
//
// Six sessions review six subjects, and CLAUDE.md's one-session-per-subject rule
// is what is supposed to keep them out of each other's way. On 2026-08-12 it did
// not hold in any direction: something renamed a section in Mathematics and
// Science mid-session, something added a ceiling to English's content gate and
// renamed its nav, one session followed up another's Science repair with 246
// re-recorded clips, and one deployed another's content to production. All of it
// was fine in the end. None of it was found by the tooling — every discovery was
// a cross-session note written after the fact, and two of those notes attributed
// the work to the wrong session because git could not settle it.
//
// It cannot settle it: every session commits as the same identity, so authorship
// is unavailable by construction. What IS available is that the last commit to
// touch your subject is not one you recognise, and that is enough. A session
// running its gate — which every session does constantly — would have seen it
// immediately instead of days later in a message.
//
// The pathspec is the whole design. shell/subjects/{subject}.js lives OUTSIDE
// the subject folder, and it is the file most likely to be swept by a
// cross-subject change: it is what 4b9484672 edited in both Mathematics and
// Science, and where this session's grading and hint defects lived. Scoped to
// the subject folder alone, Mathematics reports its own last commit and hides
// exactly the collision this exists to surface. Measured, not assumed:
//
//   folder alone            → 823f30d7f  (this session's own work)
//   folder + shell module   → 4b9484672  (the cross-subject sweep)
//
// Informational only. It never fails a gate and never throws: a checkout without
// git, or a subject with no history, prints nothing rather than breaking a check
// that has real work to do.

import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

export function reportLastTouch(subject) {
  let line;
  try {
    line = execFileSync("git", [
      "log", "-1", "--format=%h %ci %s", "--",
      `src/prototypes/ehel-academy/${subject}`,
      `src/prototypes/ehel-academy/shell/subjects/${subject}.js`,
    ], { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return; // no git, no history, nothing to say
  }
  if (!line) return;
  const [hash, date, time, , ...rest] = line.split(/\s+/);
  const subjectLine = rest.join(" ");
  console.log(`last touched ${subject}: ${hash} ${date} ${time.slice(0, 5)} — ${subjectLine.slice(0, 68)}`);
  console.log("   (if that is not work you recognise, another session has been in this subject)\n");
}
