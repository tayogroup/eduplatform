import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "src", "prototypes", "ehel-academy", "english");
const files = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(target);
    else if (/\.(json|js|html|vtt)$/i.test(entry.name)) files.push(target);
  }
}

walk(root);

const patterns = [
  /\b(?:Teacher|Miss|Mr|Mrs|Ms|Dr)\.?\s+([A-Z][a-z]+)/g,
  /\b(?:name is|named|called)\s+([A-Z][a-z]+)/gi,
  /\b(?:said|asked|called|told|answered|replied|greeted|thanked|hugged|helped|watched)\s+([A-Z][a-z]+)/g,
  /\b([A-Z][a-z]+)\s+(?:said|asked|called|answered|replied|smiled|laughed|walked|looked|held|felt|learned|remembered|turned|closed|opened|lives|likes|has|is|was|will|went|found|made|gave|took|thought|wanted|decided)\b/g,
];
const findings = new Map();

for (const file of files) {
  const source = fs.readFileSync(file, "utf8");
  for (const expression of patterns) {
    for (const match of source.matchAll(new RegExp(expression.source, expression.flags))) {
      const name = match[1];
      const finding = findings.get(name) || { count: 0, file: path.relative(root, file) };
      finding.count += 1;
      findings.set(name, finding);
    }
  }
}

for (const [name, finding] of [...findings].sort((left, right) => right[1].count - left[1].count || left[0].localeCompare(right[0]))) {
  console.log(`${finding.count}\t${name}\t${finding.file}`);
}
