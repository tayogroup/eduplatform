// Acceptance check for the Computing WebGL scene catalogue.
//
// A scene is wired up in three files: computing-visuals.js names it on a
// diagram, computing-word-scenes.js names it on a vocabulary word's explainer,
// and computing-webgl.js builds its geometry. Nothing at runtime complains when
// those disagree — the canvas just renders empty — so check here that every
// named scene exists, produces geometry at several points in its animation, and
// only emits finite coordinates and known meshes.
//
// The word explainers carry their own promise: every Grade 2 vocabulary word
// resolves to a scene (that is the feature — a word card with no model is a
// silent regression, exactly like a blank canvas). Grades 1, 3 and 4 share many
// of these terms and are reported as coverage, not failures: only Grade 2's
// words were commissioned.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const sharedDir = path.join(here, "..", "src", "prototypes", "ehel-academy", "computing", "shared");

const { sceneObjects } = await import(`file://${path.join(sharedDir, "computing-webgl.js")}`);
const { COMPUTING_WORD_SCENES, computingWordScene } = await import(`file://${path.join(sharedDir, "computing-word-scenes.js")}`);

const visualsSource = fs.readFileSync(path.join(sharedDir, "computing-visuals.js"), "utf8");
const wordScenesSource = fs.readFileSync(path.join(sharedDir, "computing-word-scenes.js"), "utf8");
const webglSource = fs.readFileSync(path.join(sharedDir, "computing-webgl.js"), "utf8");

const referenced = [...new Set([...`${visualsSource}\n${wordScenesSource}`.matchAll(/scene:\s*"([A-Za-z]+)"/g)].map((m) => m[1]))];
const defined = [...new Set([...webglSource.matchAll(/id === "([A-Za-z]+)"/g)].map((m) => m[1]))];

const KNOWN_MESHES = new Set(["cube", "sphere", "cylinder", "cone"]);
const SAMPLE_TIMES = [0, 0.7, 2.3, 5.1, 11.9];

const failures = [];
const fail = (message) => failures.push(message);

for (const id of referenced) {
  if (!defined.includes(id)) fail(`scene "${id}" is used by a diagram but has no geometry in computing-webgl.js`);
}
for (const id of defined) {
  if (!referenced.includes(id)) fail(`scene "${id}" is defined but no diagram references it — dead scene`);
}

for (const id of defined) {
  for (const t of SAMPLE_TIMES) {
    const objects = sceneObjects(id, t);
    if (!Array.isArray(objects) || objects.length === 0) {
      fail(`scene "${id}" produced no objects at t=${t} — renders as a blank canvas`);
      continue;
    }
    for (const [index, object] of objects.entries()) {
      const where = `scene "${id}" object ${index} at t=${t}`;
      if (!KNOWN_MESHES.has(object.mesh)) fail(`${where}: unknown mesh "${object.mesh}"`);
      const numbers = [...(object.position || []), ...(object.scale || []), ...(object.rotation || [])];
      if (numbers.length !== 9) fail(`${where}: expected 3 position, 3 scale and 3 rotation values, got ${numbers.length}`);
      if (numbers.some((n) => typeof n !== "number" || !Number.isFinite(n))) fail(`${where}: non-finite transform value`);
      const color = object.color;
      if (!Array.isArray(color) || color.length !== 4 || color.some((c) => typeof c !== "number" || !Number.isFinite(c))) {
        fail(`${where}: colour is not 4 finite components`);
      }
    }
  }
}

// Every word-scene entry must name a real scene and carry a caption — the
// caption is what ties a shared scene to the specific word, so an empty one
// leaves the learner watching an unexplained animation.
for (const [term, entry] of Object.entries(COMPUTING_WORD_SCENES)) {
  if (!defined.includes(entry.scene)) fail(`word "${term}" names scene "${entry.scene}" which has no geometry`);
  if (!entry.caption || !entry.caption.trim()) fail(`word "${term}" has no caption`);
}

// Grade 2 word coverage is the commitment; the other Stage 1-4 grades reuse
// whatever terms they share and are reported for information.
const gradeCoverage = [];
for (const grade of [1, 2, 3, 4]) {
  const unitsDir = path.join(sharedDir, "..", `grade-${grade}`, "data", "units");
  if (!fs.existsSync(unitsDir)) continue;
  let total = 0;
  let covered = 0;
  for (const file of fs.readdirSync(unitsDir).filter((name) => /^unit-\d+\.json$/.test(name)).sort()) {
    const unit = JSON.parse(fs.readFileSync(path.join(unitsDir, file), "utf8"));
    const vocab = unit.reference?.vocabulary?.length
      ? unit.reference.vocabulary.map((entry) => entry.term)
      : (unit.reference?.terms || []).map(([term]) => term);
    for (const term of vocab) {
      total += 1;
      if (computingWordScene(term)) covered += 1;
      else if (grade === 2) fail(`grade 2 ${file}: word "${term}" has no explainer scene`);
    }
  }
  gradeCoverage.push(`grade ${grade}: ${covered}/${total}`);
}

const unique = [...new Set(failures)];
if (unique.length) {
  console.error(`✗ computing WebGL scenes: ${unique.length} problem(s)`);
  for (const message of unique.slice(0, 40)) console.error(`   ${message}`);
  process.exit(1);
}

const totals = defined.map((id) => sceneObjects(id, 1.5).length);
console.log(`✓ computing WebGL scenes: ${defined.length} scenes, all referenced and all render geometry`);
console.log(`   diagrams with a scene: ${(visualsSource.match(/scene:/g) || []).length} of ${(visualsSource.match(/caption:/g) || []).length}`);
console.log(`   objects per scene: min ${Math.min(...totals)}, max ${Math.max(...totals)}`);
console.log(`   word explainer coverage: ${gradeCoverage.join(", ")} (grade 2 must be total)`);
