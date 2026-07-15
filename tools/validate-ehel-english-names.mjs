import fs from "node:fs";
import path from "node:path";
import {
  approvedMen,
  approvedWomen,
  contentRoot,
  retiredMen,
  retiredWomen
} from "./normalize-ehel-english-names.mjs";

const extensions = new Set([".json", ".js", ".html", ".vtt"]);
const approved = new Set([...approvedWomen, ...approvedMen]);
const retired = [...retiredWomen, ...retiredMen, "Simba"];
const violations = [];

function walk(directory, files = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(target, files);
    else if (extensions.has(path.extname(entry.name).toLowerCase())) files.push(target);
  }
  return files;
}

for (const file of walk(contentRoot)) {
  const source = fs.readFileSync(file, "utf8");
  for (const name of retired) {
    const match = source.match(new RegExp(`(^|\\\\n|[^A-Za-z])${name}(?=$|\\\\n|[^A-Za-z])`));
    if (match) violations.push(`${path.relative(contentRoot, file)}: retired name ${name}`);
  }
}

if (violations.length) {
  console.error(violations.slice(0, 100).join("\n"));
  console.error(`Name validation failed with ${violations.length} violation(s).`);
  process.exit(1);
}

console.log(`Name validation passed. Approved fictional names: ${[...approved].join(", ")}.`);
