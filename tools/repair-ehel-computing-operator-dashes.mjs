// One-time (idempotent) repair for computing/data/script-review.json: the
// reviewed workbook round-tripped through Excel, and Excel's "replace
// hyphens with dash" autocorrect turned every literal minus/subtraction sign
// into an em dash wherever a reviewer touched arithmetic content — "10 - 3"
// became "10 — 3", "+ - * and /" became "+ — * and /". The corrupted text is
// data, not builder logic, so it is fixed here rather than in the builder.
//
// Scoped narrowly on purpose: an em dash between two digits ("100 — 10") is
// never a real sentence dash in this content, and the same is true for an em
// dash standing in for the minus in a short list of operator symbols
// ("+ — *", "+ and —"). A general "em dash means minus" rule would also
// rewrite genuine prose dashes ("a duck — or a fish is fine too"), so this
// script does not attempt that; it only touches the shapes above.
//
// Usage: node tools/repair-ehel-computing-operator-dashes.mjs [--dry]

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const target = path.join(root, "src", "prototypes", "ehel-academy", "computing", "data", "script-review.json");
const dry = process.argv.includes("--dry");

const original = fs.readFileSync(target, "utf8");
// Normalise to LF regardless of what is on disk: the file is committed LF-only,
// and writing back whatever line ending happened to be there turns a handful
// of real fixes into a whole-file diff that is unreviewable.
let text = original.replace(/\r\n/g, "\n");
let count = 0;

// Digit — digit, both in plain prose ("100 — 10 — 10") and inside a JSON
// \n-escaped string ("0 — 0 · 0 · 0"). \s already matches JSON's literal
// space; no need to special-case escaped newlines since the digits sit on
// one line either way.
text = text.replace(/(\d)\s*—\s*(\d)/g, (whole, a, b) => { count += 1; return `${a} - ${b}`; });

// A short list of operator symbols with an em dash standing in for "-":
// "+ — *", "+ and —", "— and +", "operators + and —".
text = text.replace(/([+*/])\s*—\s*([+*/])/g, (whole, a, b) => { count += 1; return `${a} - ${b}`; });
text = text.replace(/\+\s*and\s*—/g, () => { count += 1; return "+ and -"; });
text = text.replace(/—\s*and\s*\+/g, () => { count += 1; return "- and +"; });
text = text.replace(/—\s*for subtraction/gi, () => { count += 1; return "- for subtraction"; });
text = text.replace(/and\s*—\s*\(subtract\)/gi, () => { count += 1; return "and - (subtract)"; });

console.log(`${count} operator-dash occurrence(s) repaired.`);
if (dry) {
  console.log(count === 0 ? "No change (dry run)." : "Dry run — file not written.");
} else if (text !== original) {
  fs.writeFileSync(target, text, "utf8");
  console.log(`Written: ${path.relative(root, target)}`);
} else {
  console.log("Nothing to write — already clean.");
}
