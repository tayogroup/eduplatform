/* Put the four platform modules beside the lessons for LOCAL testing only.
 *
 * They are what deploy.mjs uploads alongside the pages. Without them the
 * lessons' imports 404, and over file:// they cannot load at all whatever is on
 * disk - Chrome allows module fetches only over chrome, chrome-untrusted, data,
 * http and https. So testing the wiring for real means serving the tree over
 * http AND having these four present:
 *
 *   node checks/stage-local-modules.mjs
 *   # then serve src/ (tools/serve-src-preview.js, port 4287) and open
 *   # /prototypes/ehel-academy/mathematics/grade-3-app/index.html
 *
 * The copies are gitignored. They are NOT source - deploy.mjs is what puts the
 * real ones beside the lessons.
 *
 * THE FLATTEN IS COPIED VERBATIM FROM deploy.mjs, in the same language, on
 * purpose. A first attempt re-expressed it in Python and got `from "./"` - the
 * filename gone - because Python read the replacement's \2 as an octal escape
 * rather than a group reference. Every module then loaded 200 while importing a
 * specifier that resolved to the server's HTML 404 page, which surfaces as
 * "Expected a JavaScript-or-Wasm module script but the server responded with a
 * MIME type of text/html" and names no file. Do not re-translate it.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = path.resolve(HERE, "..");
const EHEL = path.resolve(APP, "../..");

const MODULES = [
  [path.join(EHEL, "shell", "learner-controls.js"), "learner-controls.js"],
  [path.join(EHEL, "shell", "wehel.js"), "wehel.js"],
  [path.join(EHEL, "shared", "course-shell.js"), "course-shell.js"],
  [path.join(EHEL, "shared", "progress-client.js"), "progress-client.js"],
];

const flatten = (s) => s
  .replace(/from\s*(["'])\.\.\/shared\/([A-Za-z0-9_-]+\.js)(\?[^"']*)?\1/g, 'from "./$2"')
  .replace(/from\s*(["'])\.\/([A-Za-z0-9_-]+\.js)(\?[^"']*)?\1/g, 'from "./$2"');

let bad = 0;
for (const [src, dst] of MODULES) {
  if (!fs.existsSync(src)) { console.error("missing source: " + src); process.exit(2); }
  const out = flatten(fs.readFileSync(src, "utf8"));
  fs.writeFileSync(path.join(APP, dst), out);
  // a flatten that eats the filename is silent until a page tries to load it
  const broken = out.match(/from\s+["']\.\/[^A-Za-z]/g) || [];
  if (broken.length) { console.error("  BROKEN specifier in " + dst + ": " + JSON.stringify(broken[0])); bad++; }
  console.log("  staged " + dst.padEnd(24) + out.length + " bytes");
}

// every ./ import any of them makes must now resolve beside the lessons
const missing = new Set();
for (const [, dst] of MODULES) {
  const s = fs.readFileSync(path.join(APP, dst), "utf8");
  for (const m of s.matchAll(/from\s+["']\.\/([A-Za-z0-9_-]+\.js)["']/g)) {
    if (!fs.existsSync(path.join(APP, m[1]))) missing.add(m[1] + " (imported by " + dst + ")");
  }
}
if (missing.size) { console.error("\nunresolved sibling imports:\n  " + [...missing].join("\n  ")); bad++; }
console.log(bad ? "\nFAILED" : "\nall four staged, every sibling import resolves");
process.exit(bad ? 1 : 0);
