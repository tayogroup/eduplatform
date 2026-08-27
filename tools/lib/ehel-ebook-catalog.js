// The ONE way a Node tool reads `ebookCatalog` out of the English shell.
//
// The catalogue is a `const` in shell/subjects/english.js rather than a content
// file, so every tool that needs it has to slice it out of the source. That was
// fine while check-english-ebooks.mjs was the only reader; the topic index now
// needs it too (Books were offered in the tutoring picker and answered "no
// lessons are indexed", because nothing derived topics from a shell const), and
// two copies of a source-slicing extractor is the drift this repo keeps warning
// about — the second copy is the one that stops matching the file.
//
// The array is pure data literals, so it is safe to slice and evaluate. Parsing
// it with a regex instead would mean re-implementing string escaping, and every
// page's text is full of quotes.

const fs = require("fs");
const path = require("path");
const vm = require("vm");

function literalBetweenBrackets(source, declaration, where) {
  const start = source.indexOf(declaration);
  if (start < 0) throw new Error(`${declaration} not found in ${where}`);
  const open = source.indexOf("[", start);
  let depth = 0;
  let inString = null;
  let inComment = null;
  for (let i = open; i < source.length; i += 1) {
    const ch = source[i];
    if (inComment) {
      // Comments are skipped, not scanned. A prose apostrophe — "the unit's own
      // vocabulary" — otherwise opens a string that swallows the rest of the
      // array, and the slice ends on whatever bracket happens to come next.
      if (inComment === "line" && ch === "\n") inComment = null;
      else if (inComment === "block" && ch === "*" && source[i + 1] === "/") { inComment = null; i += 1; }
      continue;
    }
    if (inString) {
      if (ch === "\\") i += 1;
      else if (ch === inString) inString = null;
      continue;
    }
    if (ch === "/" && source[i + 1] === "/") { inComment = "line"; i += 1; continue; }
    if (ch === "/" && source[i + 1] === "*") { inComment = "block"; i += 1; continue; }
    if (ch === '"' || ch === "'" || ch === "`") { inString = ch; continue; }
    if (ch === "[") depth += 1;
    if (ch === "]") {
      depth -= 1;
      if (depth === 0) return source.slice(open, i + 1);
    }
  }
  throw new Error(`${declaration} is not closed in ${where}`);
}

const shellPath = (ehelRoot) => path.join(ehelRoot, "shell", "subjects", "english.js");

// Cached per shell path: the topic index builds eight grades in one run and the
// catalogue is the same file every time.
const cache = new Map();

function readEbookCatalog(ehelRoot) {
  const file = shellPath(ehelRoot);
  if (cache.has(file)) return cache.get(file);
  const source = fs.readFileSync(file, "utf8");
  const catalog = vm.runInNewContext(`(${literalBetweenBrackets(source, "const ebookCatalog = [", "shell/subjects/english.js")})`);
  cache.set(file, catalog);
  return catalog;
}

// The shelf rule, copied from ONE place rather than restated: english.js ::
// unitEbooks is `grades.includes(g) && (!units || units.includes(u))`. A book
// with no `units` belongs to every unit of its grades.
const ebooksFor = (catalog, grade, unit) =>
  catalog.filter((b) => (b.grades || []).includes(Number(grade)) && (!b.units || b.units.includes(Number(unit))));

module.exports = { readEbookCatalog, ebooksFor, literalBetweenBrackets };
