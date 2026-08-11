// Build Ehel Academy Science runtime packages for every stage from the
// extracted science content model. Mirrors the mathematics builder but parses
// the science document conventions: Part N concepts, Section A-E practice
// with answer keys, Experiment N investigations, and reference glossaries.
// Usage: node tools/build-ehel-science-runtime.js [grade ...]   (default: all)

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const modelPath = path.join(root, "outputs", "science-content", "science-content-model.json");
const sciRoot = path.join(root, "src", "prototypes", "ehel-academy", "science");
const model = JSON.parse(fs.readFileSync(modelPath, "utf8"));

const grades = process.argv.slice(2).length ? process.argv.slice(2).map(Number) : Object.keys(model.grades).map(Number).sort((a, b) => a - b);

// ── Cambridge objective mapping ──────────────────────────────────────────────
// Every unit declared a syllabus and a stage but claimed no objective, so
// check-science-content.mjs reported all 53 as "alignment is declared, not
// evidenced". CAMBRIDGE_OBJECTIVES below is that evidence: which published
// objectives each unit actually teaches.
//
// Unlike Global Perspectives, nothing in the Science pipeline can extract this.
// GP's Year 5/7/8 packs print their own "Code | What Cambridge says" table, so
// its build proves the mapping against the source. The Science Word packs print
// no codes — the extracted content model contains zero matches for the published
// code shape — and the packs themselves are not kept in the repo (inputs/
// ehel-grade*-source is English). So the only authority here is Cambridge's own
// framework, and the mapping is authored against it rather than extracted.
//
// That is why the codes are recorded as PROPOSED. Each was chosen by reading a
// unit's own outcomes against its stage's objectives, and the mapping is stated
// so a reviewer can check it — but it is not a Cambridge-verified alignment, and
// the units already carry "Curriculum review required" for the same reason.
// alignmentStatus below says so in the data rather than only in this comment.
//
// Two rules held while authoring, both to keep the mapping honest:
//   - An objective is claimed only where the unit's outcomes or concepts teach
//     it. Padding every unit with the recurring enquiry objectives (Ep/Eo) would
//     turn 53 real mappings into 53 that mean nothing.
//   - Objective TEXT is never copied here. It is resolved from the framework
//     file at build time, so the wording in a unit is always Cambridge's current
//     wording and cannot drift from it.
const frameworkCache = new Map();
function cambridgeFramework(code) {
  if (!frameworkCache.has(code)) {
    frameworkCache.set(code, JSON.parse(fs.readFileSync(path.join(root, "src", "curriculum", `cambridge-science-${code}.json`), "utf8")));
  }
  return frameworkCache.get(code);
}

const CAMBRIDGE_OBJECTIVES = {
  // ── Stage 1 (0846) ──
  // 1Ep3 and 1Eo5 are on every Stage 1 unit because every one of them runs the
  // same exploration cycle: the prompt is literally "What do you predict will
  // happen in <investigation>?" and the answer is "carry it out, record what you
  // observe, and compare it with the prediction you wrote before you started".
  // That is 1Ep3 "Make predictions" and 1Eo5 "Compare what happened with
  // predictions", word for word, so claiming them six times is accurate rather
  // than padding — leaving them off reported a whole sub-strand as untaught.
  "1-1": ["1Bp1", "1Bp2", "1Bh5", "1Ep3", "1Eo1", "1Eo4", "1Eo5"],
  "1-2": ["1Bp1", "1Bp4", "1Bp5", "1Bp6", "1Ep3", "1Eo1", "1Eo3", "1Eo5"],
  "1-3": ["1Bh1", "1Bh2", "1Bh4", "1Cp1", "1Ep3", "1Eo4", "1Eo5"],
  "1-4": ["1Cp1", "1Cp2", "1Cp3", "1Cp4", "1Ep3", "1Eo3", "1Eo4", "1Eo5"],
  "1-5": ["1Pf1", "1Pf2", "1Pf3", "1Ep3", "1Eo1", "1Eo5"],
  "1-6": ["1Ps1", "1Ps2", "1Ps3", "1Ep3", "1Eo4", "1Eo5"],
  // ── Stage 2 (0846) ──
  "2-1": ["2Be1", "2Be2", "2Be3", "2Eo2", "2Eo3", "2Eo5"],
  "2-2": ["2Cp1", "2Cp2", "2Eo3", "2Eo6"],
  "2-3": ["2Cc2", "2Cc3", "2Ep2", "2Ep5", "2Eo2"],
  "2-4": ["2Pl1", "2Pl2", "2Pl3", "2Pb2", "2Eo2"],
  "2-5": ["2Pm1", "2Pm2", "2Eo2"],
  // 2Ep5 for the same reason 1Ep3 is claimed at Stage 1: this unit's explorations
  // run the "What do you predict will happen in <investigation>?" cycle. That
  // prompt is not universal — it appears in 6 of 6 Stage 1 units but only 6 units
  // across Stages 2-8 — so it is claimed exactly where it is used, not by rule.
  "2-6": ["2Pb1", "2Pb2", "2Pl3", "2Ep5", "2Eo2", "2Eo3"],
  // ── Stage 3 (0846) ──
  "3-1": ["3Bh1", "3Bh2", "3Bp2", "3Ep1", "3Eo4"],
  "3-2": ["3Cp2", "3Ep2", "3Ep3", "3Eo2", "3Eo4"],
  "3-3": ["3Cp1", "3Cp2", "3Ep2", "3Eo1", "3Eo4"],
  "3-4": ["3Bh1", "3Bh3", "3Eo2", "3Eo4"],
  "3-5": ["3Pf1", "3Pf2", "3Pf4", "3Cp3", "3Ep3"],
  "3-6": ["3Eo1", "3Eo2", "3Eo5"],
  // ── Stage 4 (0846) ──
  // 4Bh1 is claimed on the strength of "Animals With Backbones and Without",
  // which has the learner feel their own spine, and the five vertebrate groups.
  // 4Bh2 is not: the unit never covers how a skeleton supports or protects, and
  // says nothing about muscles at all.
  "4-1": ["4Bh1", "4Be1", "4Be2", "4Eo1"],
  "4-2": ["4Be3", "4Ep1", "4Eo4"],
  "4-3": ["4Cs1", "4Cs2", "4Cs3", "4Cs4", "4Ep4", "4Eo4"],
  "4-4": ["4Be1", "4Eo7"],
  "4-5": ["4Ep2", "4Eo1"],
  "4-6": ["4Pm1", "4Pm2", "4Pm3", "4Ep3", "4Eo1"],
  // ── Stage 5 (0846) ──
  "5-1": ["5Bp1", "5Bp2", "5Bp4", "5Bp7", "5Ep4", "5Eo2", "5Eo4"],
  "5-2": ["5Bp2", "5Bp3", "5Bp5", "5Bp6", "5Bp7", "5Ep3", "5Eo1"],
  "5-3": ["5Cs1", "5Cs2", "5Cs3", "5Cs4", "5Ep4", "5Ep6"],
  "5-4": ["5Pl1", "5Pl6", "5Pl7", "5Pl8", "5Eo1"],
  "5-5": ["5Pl1", "5Pl2", "5Pl3", "5Pl5", "5Ep3", "5Eo1"],
  "5-6": ["5Pb1", "5Pb2", "5Pb3", "5Eo1"],
  // ── Stage 6 (0846) ──
  "6-1": ["6Bh1", "6Bh2", "6Bh3", "6Bh4", "6Ep4", "6Eo1", "6Eo3"],
  "6-2": ["6Be1", "6Be2", "6Be3", "6Be4", "6Be5", "6Be6"],
  "6-3": ["6Cc1", "6Cc2", "6Cc3", "6Cc4", "6Cc5", "6Ep6"],
  "6-4": ["6Pf1", "6Pf2", "6Pf3", "6Pf4", "6Eo1"],
  "6-5": ["6Pm1", "6Pm2", "6Pm3", "6Pm4", "6Pm5"],
  // ── Stage 7 (0893) ──
  "7-1": ["7Bs.01", "7Bs.02", "7Bs.03", "7Bs.04", "7Bs.05", "7SIC.01"],
  "7-2": ["7Cm.01", "7Cm.04", "7Cm.06", "7Cm.07", "7ESc.01"],
  "7-3": ["7Pf.03", "7TWSm.02"],
  "7-4": ["7Bp.01", "7Bp.02", "7Bp.03", "7Bp.04", "7TWSc.01"],
  "7-5": ["7Cm.03", "7Cp.01", "7Cp.02", "7Cp.03", "7Cp.05", "7Cp.06", "7Cp.07", "7TWSp.05"],
  "7-6": ["7Ps.01", "7Ps.02", "7ESp.01", "7ESp.02", "7ESs.04", "7TWSc.05"],
  "7-7": ["7Bs.01", "7Be.01", "7Be.02", "7TWSp.04", "7TWSa.03", "7SIC.02"],
  "7-8": ["7Cc.01", "7Cc.03", "7Cc.04", "7TWSc.05", "7TWSc.07"],
  "7-9": ["7Pe.01", "7Pe.02", "7Pe.03", "7Pe.04", "7Pe.05"],
  // ── Stage 8 (0893) ──
  // 8TWSp.04: the germination investigation is planned with variables controlled
  // explicitly — "Each jar changes only ONE condition… you keep everything the
  // same except the one thing you are testing" — which is the objective's
  // substance even though the unit plans one investigation rather than a range.
  // 8Be.01-8Be.03 are claimed on the passage CONCEPT_INSERTS continues concept 6
  // with: habitats within an ecosystem, invasive species, and bioaccumulation up
  // a food chain. The unit's own subject — plant reproduction — is Stage 9 in
  // 0893, so before this it claimed almost nothing at its own stage.
  "8-1": ["8SIC.02", "8TWSp.04", "8Be.01", "8Be.02", "8Be.03"],
  "8-2": ["8Bp.01", "8Bp.03"],
  "8-3": ["8Pf.01", "8Pf.02", "8TWSm.03", "8TWSc.02", "8TWSc.04"],
  "8-4": ["8TWSm.03"],
  "8-5": ["8Cm.04", "8Cp.01", "8Cp.02", "8Cc.05", "8TWSp.03", "8TWSa.05"],
  "8-6": ["8Ps.01", "8Ps.02", "8Ps.03", "8Ps.04", "8TWSc.04"],
  // 8Bs.02-8Bs.04 are claimed on the passage CONCEPT_INSERTS continues concept 4
  // with: blood components, the alveolar structure that makes gas exchange
  // possible, and the diffusion of oxygen and carbon dioxide across it. 8Bs.01
  // (joints and antagonistic muscles) is not claimed — nothing in Grade 8
  // teaches it, and a digestion unit is not where it belongs.
  // 8Bs.01 joins them, claimed on the passage that continues the mechanical
  // digestion concept: hinge and ball-and-socket joints identified, and
  // antagonistic muscle pairs explained at a hinge — the elbow explicitly, and
  // the jaw the learner is chewing with.
  "8-7": ["8Bp.01", "8Bp.02", "8Bp.03", "8Bs.01", "8Bs.02", "8Bs.03", "8Bs.04", "8TWSc.07", "8TWSa.05"],
  // 8ESs.01-8ESs.02 are claimed on the passage CONCEPT_INSERTS continues the
  // rock cycle concept with: asteroids as leftover rock smaller than any planet,
  // and a galaxy as stars, planetary systems and star-forming dust and gas. The
  // unit's own subject, rocks and the rock cycle, appears nowhere in 0893 at any
  // stage, so before this it claimed only enquiry and application objectives.
  // 8ESc.01-8ESc.03 join them, claimed on the passage that continues the
  // sedimentary concept: climate distinguished from weather, the rock, fossil
  // and ice-core evidence for the ice-age cycle, and atmospheric change as what
  // drives it.
  "8-8": ["8TWSc.01", "8TWSc.07", "8SIC.02", "8ESs.01", "8ESs.02", "8ESc.01", "8ESc.02", "8ESc.03"],
  // Both Planet Earth objectives are claimed on passages CONCEPT_INSERTS adds:
  // 8ESp.01 on concept 6, which attributes the Earth's field to its moving iron
  // core, and 8ESp.02 on concept 2, which teaches renewable and non-renewable
  // resources at the stage that examines them.
  "8-9": ["8Pe.01", "8Pe.02", "8Pe.03", "8ESp.01", "8ESp.02", "8TWSm.03", "8TWSc.02"],
};

// Where a unit teaches content its own stage does not carry, the mapping says so
// rather than going quiet. Cambridge Stage 3 of 0846 has no light sub-strand and
// no Earth-and-beyond sub-strand at all — its 27 objectives are enquiry, plants,
// humans and animals, material properties and forces — so two Grade 3 units sit
// outside it. Their enquiry objectives are real and are claimed; the content
// strand genuinely has nowhere to map, and a reader of the unit should be told
// that instead of seeing a short list and assuming it is complete.
const CAMBRIDGE_ALIGNMENT_NOTES = {
  "3-3": "Light and shadow are not in 0846 Stage 3 — the framework carries light at Stage 2 (2Pl) and Stage 5 (5Pl) only. The material-property and enquiry objectives claimed here are met in full; the light content itself has no Stage 3 objective to map to.",
  "3-6": "Earth, Sun and Moon are not in 0846 Stage 3 — the framework carries Earth and beyond at Stage 2 (2Pb) and Stage 5 (5Pb) only. Only the enquiry objectives this unit genuinely meets are claimed; its astronomy content has no Stage 3 objective to map to.",
  "4-2": "Energy is not a sub-strand of 0846 Stage 4, or of any primary stage — the framework first treats it as \"energy in movement\" at Stage 6 (6Pf3). The environmental and enquiry objectives claimed here are met; the unit's core energy content sits outside the primary framework.",
  "4-4": "The Earth's structure, volcanoes and earthquakes are not in 0846 Stage 4 — the framework carries Earth and beyond at Stage 2 (2Pb) and Stage 5 (5Pb), and neither covers plate geology. The habitat and enquiry objectives claimed here are met in full.",
  "4-5": "Light is not in 0846 Stage 4 — the framework carries light at Stage 2 (2Pl) and Stage 5 (5Pl). Only the enquiry objectives this unit genuinely meets are claimed; Stage 4 has no light or material-property objective for its content.",
  "8-1": "Plant reproduction is not in 0893 Stage 8 — the framework introduces fertilisation as the fusion of gametes at Stage 9 (9Bp.01), and Stages 7 and 8 carry no pollination, seed or germination objective. Only the application objective this unit meets is claimed; its subject matter is a stage ahead.",
  "8-2": "Human reproduction is not in 0893 Stage 8 — as with Unit 1, the framework places fertilisation at Stage 9 (9Bp.01) and carries no puberty or gestation objective at any Lower Secondary stage. The diet and lifestyle objectives claimed here are Stage 8 and are met in full.",
  "8-3": "Half of this unit is a stage ahead: speed and distance/time graphs are Stage 8 (8Pf.01, 8Pf.02) and are claimed, but density is Stage 9 (9Cp.02, and 9Pf.01 for floating and sinking). The unit teaches both together.",
  "8-4": "Atoms, elements, compounds and metals versus non-metals are Stage 7 in 0893 (7Cm.01-7Cm.04, 7Cp.05), and the structure and trends of the Periodic Table are Stage 9 (9Cm.01, 9Cp.01). Stage 8 carries none of this unit's chemistry, so only its use of chemical symbols and formulae is claimed.",
  "8-7": "The nutrition half of this unit maps to Stage 8 in full (8Bp.01-8Bp.03), but digestion does not: 0893 carries no objective for mechanical or chemical digestion, enzymes or absorption at Stage 7, 8 or 9.",
  "8-8": "Rocks and the rock cycle are not in 0893 at any stage — Lower Secondary treats geology as plate tectonics at Stage 7 (7ESp.01, 7ESp.02), and rock types, weathering, erosion and fossils appear nowhere in Stages 7-9. Only the enquiry and application objectives this unit genuinely meets are claimed.",
  "8-9": "The magnetism half of this unit is Stage 8 and is claimed in full (8Pe.01-8Pe.03). Current, voltage and resistance are Stage 9 (9Pe.02, 9Pe.03), as is the motor effect, so the electricity half is a stage ahead.",
};

// Resolve a unit's codes against the framework, and refuse the build if one is
// not published for that unit's own stage. A wrong code is worse than none: it
// reads as verified alignment to anyone downstream, which is the exact claim
// this mapping exists to stop the course making without evidence.
function cambridgeObjectivesFor(grade, unitNo, code) {
  const claimed = CAMBRIDGE_OBJECTIVES[`${grade}-${unitNo}`];
  // All 53 units are mapped. A new unit arriving unmapped is the state this
  // whole table exists to end, and it would otherwise reappear only as a line in
  // check:science that does not fail — which is how it went unnoticed before.
  if (!claimed) {
    throw new Error(`Grade ${grade} Unit ${unitNo}: no CAMBRIDGE_OBJECTIVES entry. Add "${grade}-${unitNo}" with the objectives this unit teaches, from ${code} Stage ${grade}.`);
  }
  const stageObjectives = (cambridgeFramework(code).objectivesByStage || {})[String(grade)] || [];
  const byCode = new Map(stageObjectives.map((entry) => [entry.code, entry]));
  const missing = claimed.filter((entry) => !byCode.has(entry));
  if (missing.length) {
    throw new Error(`Grade ${grade} Unit ${unitNo}: objective ${missing.join(", ")} is not published in ${code} Stage ${grade}`);
  }
  const duplicates = claimed.filter((entry, index) => claimed.indexOf(entry) !== index);
  if (duplicates.length) {
    throw new Error(`Grade ${grade} Unit ${unitNo}: objective ${[...new Set(duplicates)].join(", ")} is claimed twice`);
  }
  return claimed.map((entry) => {
    const objective = byCode.get(entry);
    return { code: objective.code, strand: objective.strand, subStrand: objective.subStrand, text: objective.text };
  });
}

// ── What a stage does NOT teach ──────────────────────────────────────────────
// The per-unit mapping answers "which objectives does this unit meet". It cannot
// answer "which objectives does this stage miss entirely", because that is a
// fact about the absence of a unit, and an absent unit has no file to carry a
// note. Stage 4 is the case in point: 0846 gives it five sound objectives
// (4Ps1-4Ps5) and no Grade 4 unit teaches sound at all, so nothing anywhere in
// the course recorded that until this block.
//
// Derived from the mapping rather than hand-listed, so it cannot go stale: map a
// unit to a new objective and the gap closes here on the next build. Only the
// REASON is authored, and only where it has actually been established.
const CAMBRIDGE_GAP_REASONS = {
  "4-Sound": "No Year 4 Science pack contains a sound unit. Grade 4's six units are Living Things, Energy, Materials, The Earth, Light and Electricity; the only sound content anywhere in the stage is one glossary line in the Energy unit (\"Sound energy = Energy of vibrations that we hear\"), which teaches none of 4Ps1-4Ps5. Grade 1 covers sound at Stage 1 depth (1Ps1-1Ps3) and nothing revisits it. Closing this needs a Stage 4 sound unit to be written — a content commission, not a rebuild.",
};

// ── Targeted teaching added to a source concept ──────────────────────────────
// Grade 8 Unit 9 taught that the Earth behaves like a giant magnet and that a
// compass lines up with its field, but never why. 0893's 8ESp.01 is specifically
// "Know that the REASON the Earth has a magnetic field is that the core acts as
// a magnet", so the objective was a near miss on one missing clause — the word
// "core" appeared in that unit only as "core ideas" boilerplate and as a
// difficulty label.
//
// The insert is anchored to the exact sentence it follows rather than to an
// offset, and a missing anchor fails the build. The source pack is re-extracted
// from Word documents; an insert that silently stopped applying would drop the
// teaching while leaving 8ESp.01 claimed, which is the one outcome worse than
// never having claimed it.
//
// Kept deliberately small. This is a clause the unit was missing, in the voice
// it already uses, not an excuse to author Science content in the builder — a
// whole missing topic (Stage 4 sound) is recorded as a commission instead.
const CONCEPT_INSERTS = {
  // Structure and function is the largest Stage 8 hole: 0893 publishes four
  // objectives and no Grade 8 unit taught any of them. The course covers body
  // systems at Grade 6 (6Bh1-6Bh4) at Stage 6 depth and never returns to them,
  // so blood, lungs and gas exchange were taught once, to eleven-year-olds, and
  // then examined at Stage 8.
  //
  // Three of the four have a genuine home here. Unit 7 ends its digestion arc on
  // "absorbed into the blood, which carries the nutrients to every cell", which
  // is the question "and what IS blood, and what else does it carry" left
  // hanging — and the villi passage has just taught surface area as the reason
  // absorption is efficient, which is the same idea alveoli exist for. The
  // insert continues the concept rather than interrupting it, and reuses the
  // unit's own Amina, whose cut finger it already used for tissue repair.
  //
  // 8Bs.01 is deliberately NOT covered. Joints and antagonistic muscles have no
  // honest home in a unit about food, and bolting a skeleton onto a digestion
  // concept to turn a number green is the kind of mapping this table exists to
  // avoid. It stays recorded as a gap with its reason.
  // Ecosystems is the same shape as Structure and function: 0893 publishes three
  // objectives at Stage 8, the course teaches ecology at Grade 6 (6Be1-6Be6) and
  // never returns to it. All three are kept together because they need each
  // other — bioaccumulation cannot be taught without a food chain, and a food
  // chain needs the ecosystem it sits in.
  //
  // Unit 1 is the home because its seed concept ends on dispersal ("part of the
  // plant's clever plan for spreading its seeds" … "much of what you eat is the
  // reproductive success of a plant"). Where a seed lands is a habitat; a plant
  // that lands where nothing checks it is invasive; and the unit's closing theme
  // is farming, which is where the pesticide comes from. That also lifts a unit
  // that claimed almost nothing — its own subject, plant reproduction, is Stage
  // 9 in 0893 — to one that genuinely carries three Stage 8 objectives.
  "8-1": [{
    conceptId: "concept-6-seeds-and-fruits-form",
    after: "much of what you eat is the reproductive success of a plant.",
    text: "\n\nWhere those seeds land matters. A place with its own conditions and its own community of living things is a habitat — the shade under a mango tree, a stretch of riverbank, a patch of thorn scrub. Group the habitats of an area together with the soil, water, air and weather they share and you have an ecosystem. The Earth carries many kinds: coral reef, mangrove, savanna, desert, mountain forest. One ecosystem holds many habitats, and a seed that thrives in one may fail a few metres away.\n\nDispersal usually carries a seed a short way, but people move plants across the world. A species that arrives somewhere new, without the insects and diseases that kept it in check at home, can spread unchecked. Such an invasive species crowds out native plants for light, water and soil, and the animals that fed on those natives lose their food. Prosopis, the thorny tree planted across the Horn of Africa to hold back the desert, now chokes grazing land and waterholes that people and their livestock depended on.\n\nWhat we add to an ecosystem travels too. A pesticide sprayed on a crop does not stay on the leaf: it washes into soil and water and is taken up by plants and small creatures. Every animal that eats many of them takes in all the poison they carried, so the amount rises at each step of the food chain, and the hunters at the top — big fish, fish eagles, and the people who eat them — carry the heaviest dose of all. This building up is called bioaccumulation, and it is why a chemical that looks harmless in a single spray can damage an ecosystem years later.",
  }],
  // Earth in space: 0893 publishes two objectives at Stage 8 and no Grade 8 unit
  // teaches astronomy — the course covers the Solar System at Grade 5
  // (5Pb1-5Pb3) and never returns. Unit 8 had no astronomy at all: zero mentions
  // of asteroid, galaxy or solar system, and its thirteen apparent hits on
  // "star" were all "start".
  //
  // The rock cycle concept is the home because of how it ends — "the rock
  // beneath your feet has almost certainly been many different rocks before, and
  // will become many more long after we are gone". That is already a passage
  // about deep time, and pushing the same question one step further ("so where
  // did the FIRST rock come from") leaves the Earth without changing the
  // subject. Asteroids are the bridge: they are rocks, which is what this unit
  // is about, and they are what the planets were built from.
  "8-8": [{
    // Cycles on Earth was the last Stage 8 sub-strand no unit reached, and the
    // hardest to place: climate is taught nowhere in the course at any stage, and
    // no Grade 8 unit has it as a subject. It looked like it would have to be
    // bolted on somewhere.
    //
    // It does not, because rock IS the evidence. The sedimentary concept ends on
    // the stone town of Lamu — "sedimentary rock made from the skeletons of sea
    // creatures that lived long ago" — and coral only grows in warm, shallow,
    // clear sea. That building is already a record of what the climate was like
    // there, which is the natural place to separate climate from weather and
    // then to say that the record shows it changing. 8ESc.01's own wording is
    // about EVIDENCE for the cycle, and this unit is where a learner meets it.
    conceptId: "concept-3-sedimentary-rock-built-in-layers",
    after: "you are looking at sedimentary rock made from the skeletons of sea creatures that lived long ago.",
    text: "\n\nRock records more than the creatures in it. Coral grows only in warm, shallow, clear sea, so coral limestone beneath a town tells you what conditions were like there long ago — and conditions over the long run are climate, not weather. The two are easy to confuse. Weather is what the sky is doing now, or this week: today's rain, this morning's wind, the heat this afternoon. Climate is the pattern of weather a place has over decades, the reason we can say the coast is hot and humid and the highlands are cool even though any single day may go against it. Weather changes hour by hour; climate changes over lifetimes and longer.\n\nAnd it does change. Rock layers, the fossils inside them, and bubbles of ancient air trapped deep in polar ice all point the same way: the Earth's climate has swung slowly between long cold periods called ice ages, when sheets of ice spread far from the poles, and warmer periods between them, when the ice drew back and forests and seas advanced. That cycle has repeated many times over.\n\nWhat tips the balance is largely the air itself. Gases such as carbon dioxide and methane trap some of the Sun's heat instead of letting it escape back into space, so when their share of the atmosphere rises the world warms, and when it falls the world cools. That is why burning coal, oil and gas — which releases carbon dioxide that was locked away for millions of years — changes the climate, and not merely the weather outside your window today.",
  }, {
    conceptId: "concept-5-the-rock-cycle-nature-s-great-recycling",
    after: "the rock beneath your feet has almost certainly been many different rocks before, and will become many more long after we are gone.",
    text: "\n\nPush that question back far enough, though, and you leave the Earth altogether. Where did the very first rock come from? Our Sun and everything circling it formed from an enormous cloud of dust and gas. Gravity drew that cloud together: most of it became the Sun, while the dust further out clumped into larger and larger lumps until those lumps became planets. Not all of the material was used up. Between Mars and Jupiter, and scattered elsewhere, lie asteroids — rocks left over from that building work, far smaller than any planet, ranging from boulders to bodies hundreds of kilometres across. They never gathered into a planet of their own, so they remain close to the original material the planets were made from. Now and then one falls to Earth as a meteorite, and you can hold a piece of rock older than the ground you are standing on.\n\nThe Sun and its planets together make a planetary system, and it is not alone. A galaxy is a vast collection of stars, planetary systems, and the clouds of dust and gas that new stars form from, all held together by gravity. Ours is called the Milky Way, and on a really dark night the pale band of light across the sky is our own view of it, seen edge-on from the inside. It holds hundreds of billions of stars, and our Sun is one of them.",
  }],
  "8-7": [{
    // 8Bs.01 was the last Stage 8 objective outstanding, and I twice said it had
    // no honest home — the candidate units are about food, reproduction and
    // rocks, none of which leans toward a skeleton. That was wrong, and the lean
    // was in the unit I had already extended.
    //
    // Mechanical digestion IS this objective in use. The concept ends on "we are
    // taught to eat calmly and chew our food well", and chewing is the body's
    // most familiar hinge joint driven by opposing muscles. Starting from the
    // jaw rather than from the elbow also makes the "a muscle can only pull"
    // rule land on something the learner is doing while reading it. The unit
    // already teaches calcium building bones, so bone is in its vocabulary.
    //
    // Anchored on the chewing sentence rather than the concept's true last line,
    // which is a stray fragment ("Breaking large molecules into small ones.") —
    // a definition merged into the explanation during extraction. 18 concepts
    // across the course end that way; it is a real defect, but a separate one.
    conceptId: "concept-5-mechanical-and-chemical-digestion",
    after: "This is also why we are taught to eat calmly and chew our food well.",
    text: "\n\nNone of that chewing would happen without the machinery that moves your jaw. Bones themselves cannot bend, so wherever the body needs to move, two bones meet at a joint. Your jaw swings on a hinge joint, which opens and closes in one plane like a door; your elbow and knee are hinges too. A ball-and-socket joint, where the rounded end of one bone sits in a cup in another, turns in almost any direction — that is your shoulder and your hip. It is why you can swing your arm in a full circle but bend your elbow only one way.\n\nMuscles move those bones, and there is a catch: a muscle can only pull, never push. So muscles are arranged in antagonistic pairs that pull in opposite directions. At the elbow, the biceps on top of your upper arm contracts and shortens to bend the joint while the triceps underneath relaxes; to straighten the arm again the triceps contracts and the biceps relaxes. Your jaw works the same way — one set of muscles contracts to close it against the food, another set opens it again — and those two take turns for every mouthful you chew.",
  }, {
    conceptId: "concept-4-the-journey-through-your-digestive-system",
    after: "digested food is absorbed quickly and efficiently into the blood, which carries the nutrients to every cell in your body.",
    text: "\n\nSo what is blood, and what else does it carry? A little over half of it is plasma, a straw-coloured liquid that carries the dissolved nutrients you have just absorbed, along with wastes and heat. Floating in that plasma are three kinds of cell, each with its own job. Red blood cells are packed with a red pigment called haemoglobin, which grips oxygen and carries it to every working cell. White blood cells are part of your defence against infection. Platelets are cell fragments that clump together to seal a cut — they are why Amina's finger stops bleeding.\n\nThe oxygen those red cells carry is collected in your lungs. Each lung divides into finer and finer tubes that end in millions of tiny air sacs called alveoli. The trick is the one the small intestine already showed you: an enormous surface area folded into a small space. The wall of an alveolus is a single cell thick and is wrapped in blood capillaries whose walls are also a single cell thick, so the air and the blood are separated by almost nothing.\n\nGases cross that thin barrier by diffusion, moving from where they are crowded to where they are not. The air in an alveolus is rich in oxygen and the blood arriving there is poor in it, so oxygen diffuses into the blood. Carbon dioxide, the waste your cells produce, is crowded in the arriving blood and scarce in the air, so it diffuses the other way and you breathe it out.",
  }],
  "8-9": [{
    conceptId: "concept-6-magnets-and-magnetic-fields",
    after: "the Earth itself behaves like a giant magnet, with a magnetic field stretching all around it.",
    text: " The reason lies deep inside the planet. The Earth's core is mostly iron, and its outer part is liquid and always moving. That moving iron acts like a magnet, and it is what gives the whole Earth its magnetic field.",
  }, {
    // 8ESp.02 was not missing from the course, only from the stage that can
    // credit it: renewable and non-renewable resources are a learning outcome of
    // Grade 4's Energy unit, where 0846 publishes no energy sub-strand at all,
    // while Stage 8 publishes the objective and taught nothing towards it. The
    // Grade 4 teaching is left where it is — it is sound, and stripping a unit
    // to satisfy a mapping would be the tail wagging the dog — so the fix is to
    // teach it again at the stage that examines it, at Stage 8 depth.
    //
    // Placed on Voltage rather than on a unit of its own: that concept has just
    // explained that the cell does not create the charge but provides the energy
    // that pushes it, which is the question "and where does THAT energy come
    // from" arriving on its own. The named examples are the objective's own —
    // wind, tidal and solar power, and bioplastics.
    conceptId: "concept-2-voltage-the-push-behind-the-current",
    after: "That is why a torch that needs more power holds several cells stacked end to end.",
    text: "\n\nA cell is only a store, though, and the energy inside it had to come from somewhere — so did the electricity in a wall socket. Some of the resources we draw that energy from are renewable, which means nature replaces them about as fast as we use them: sunlight caught by a solar panel, wind turning a turbine, and the rise and fall of the tide. Plants count as renewable too, which is why bioplastics can be made from them instead of from oil. Other resources are non-renewable. Coal, oil and natural gas took many millions of years to form underground, and once they are burned they are gone for good. The difference matters to a whole country, not just to a science lesson: building on renewable resources means the lights still come on long after the coal would have run out.",
  }],
};

function applyConceptInserts(grade, unitNo, concepts) {
  const inserts = CONCEPT_INSERTS[`${grade}-${unitNo}`];
  if (!inserts) return concepts;
  return inserts.reduce((current, insert) => {
    const index = current.findIndex((concept) => concept.id === insert.conceptId);
    if (index < 0) {
      throw new Error(`Grade ${grade} Unit ${unitNo}: CONCEPT_INSERTS targets ${insert.conceptId}, which this unit no longer has`);
    }
    const explanation = current[index].explanation || "";
    if (!explanation.includes(insert.after)) {
      throw new Error(`Grade ${grade} Unit ${unitNo}: CONCEPT_INSERTS anchor not found in ${insert.conceptId} — "${insert.after.slice(0, 60)}…"`);
    }
    if (explanation.includes(insert.text.trim())) return current;
    const next = [...current];
    next[index] = { ...current[index], explanation: explanation.replace(insert.after, `${insert.after}${insert.text}`) };
    return next;
  }, concepts);
}

function stageCoverage(grade, code, builtUnits) {
  const objectives = (cambridgeFramework(code).objectivesByStage || {})[String(grade)] || [];
  const claimed = new Set(builtUnits.flatMap((unit) => unit.cambridge.objectiveCodes || []));
  const uncovered = objectives.filter((objective) => !claimed.has(objective.code));
  const bySubStrand = new Map();
  for (const objective of uncovered) {
    if (!bySubStrand.has(objective.subStrand)) bySubStrand.set(objective.subStrand, []);
    bySubStrand.get(objective.subStrand).push(objective);
  }
  // Two kinds of gap are worth reporting, and only these two. A sub-strand no
  // unit reaches AT ALL is a hole in the stage. A sub-strand that is partly
  // covered is ordinary — every stage has that, and listing them all would bury
  // the holes — EXCEPT where a cause has been established, which is the only
  // reason an entry is authored below.
  //
  // That exception is load-bearing. Closing 8ESp.01 left Planet Earth partly
  // covered, and without it the finding behind 8ESp.02 — renewable resources
  // taught in Grade 4, where 0846 has no objective to credit them, while Stage 8
  // publishes one and never teaches it — would have vanished from the record the
  // moment the sibling objective was fixed.
  const claimedSubStrands = new Set(objectives.filter((objective) => claimed.has(objective.code)).map((objective) => objective.subStrand));
  const gaps = [...bySubStrand.entries()]
    .filter(([subStrand]) => !claimedSubStrands.has(subStrand) || CAMBRIDGE_GAP_REASONS[`${grade}-${subStrand}`])
    .map(([subStrand, entries]) => ({
      subStrand,
      reachedByNoUnit: !claimedSubStrands.has(subStrand),
      objectives: entries.map((objective) => ({ code: objective.code, text: objective.text })),
      ...(CAMBRIDGE_GAP_REASONS[`${grade}-${subStrand}`] ? { reason: CAMBRIDGE_GAP_REASONS[`${grade}-${subStrand}`] } : {}),
    }));
  return {
    framework: code,
    status: "Proposed mapping — Cambridge sign-off pending",
    objectivesPublished: objectives.length,
    objectivesClaimed: claimed.size,
    coveragePercent: Math.round((claimed.size / objectives.length) * 100),
    gaps,
  };
}

// The source books mark callouts with a bracketed tag the typesetter turned
// into an icon ("[Star] Big Idea…", "[!] Did You Know?"). Those tags are
// layout instructions, not words for the learner, so strip them here rather
// than letting 91 of them show up mid-sentence on screen.
// The typesetter marks callouts with a bracketed tag that became an icon in
// print ("[Star] Big Idea…", "[SAFE] Safety First…"). They are layout, not
// words for the learner, so every short bracketed tag is stripped rather than a
// hand-kept list — the list went stale each time a new tag appeared, and "[Sort]"
// and "[Recipe]" reached learners mid-sentence.
//
// This is only safe because grab() no longer decides a section boundary from
// tag-stripped text alone: it also requires the line to be heading-length.
// Without that, removing "[SAFE]" turned a paragraph of electrical safety
// guidance into a boundary and dropped it from the unit.
// The booklet answer key reads "2. texture. Texture is how a surface feels".
// Stripping the "2." leaves the key restating the chosen option before it
// explains it, so the learner is shown "texture. Texture is how a surface
// feels" — opening on a lowercase stutter. Drop the restatement only where the
// explanation already begins with that same word; elsewhere the fragment
// carries the answer and the sentence after it leans on that ("A named box…
// That is exactly what a variable is."), so removing it would strand the
// reference. Then capitalise, because the fragment held the only capital.
const RESTATED_ANSWER = /^([A-Za-z][A-Za-z0-9'’-]*)\.\s+(?=\1\b)/i;

// Only the stutter is repaired, and only then is the result re-capitalised.
// Capitalising every explanation that opens lowercase looked like the same fix
// and was not: it rewrote 409 more, including a separate defect where the
// restated answer carries no full stop at all ("melting A solid turning into a
// liquid when heated is called melting"), which capitalisation tidies the look
// of without mending. Those need their own decision, not this one's side
// effect.
function tidyAnswerExplanations(questions = [], stats = null) {
  for (const question of questions || []) {
    const before = String(question.explanation || "");
    if (!before) continue;
    const deduped = before.replace(RESTATED_ANSWER, "");
    if (deduped === before) continue;
    question.explanation = deduped.charAt(0).toUpperCase() + deduped.slice(1);
    if (stats) stats.push(`${question.id}`);
  }
}

const SOURCE_MARKER = /\[(?:[A-Za-z]{1,12}|!)\]\s*/g;
// Sub-headings the source runs straight into the sentence after them, listed
// rather than matched by shape. A shape rule cannot tell a heading from a
// proper noun: the same pattern catches "The Rift Valley", "The Dead Sea",
// "The Periodic Table" and "In East Africa", and splitting those would be
// worse than the seam. Each entry below was read in context first, and the
// ones already punctuated in the source ("What You Need:", "Did You Know?",
// "Worked Example 1:") are deliberately absent.
//
// Longest first, so "The Golden Rule of Changing State" wins over any prefix.
const KNOWN_HEADINGS = [
  "The Golden Rule of Changing State",
  "Common Misconception",
  "Your Hypothesis",
  "Safety First",
];
const HEADING_RUN_ON = KNOWN_HEADINGS.map((phrase) => ({
  phrase,
  // Only where it opens the text or follows a sentence, and only where the
  // next word starts a new one — never when already punctuated.
  pattern: new RegExp(`(^|[.!?]\\s+)${phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s+(?=[A-Z0-9])`, "g"),
}));
function punctuateKnownHeadings(value) {
  let out = value;
  for (const { phrase, pattern } of HEADING_RUN_ON) out = out.replace(pattern, `$1${phrase}: `);
  return out;
}

const tidy = (value = "") => punctuateKnownHeadings(String(value)
  .replace(/�/g, "–")
  .replace(SOURCE_MARKER, "")
  .replace(/\s+/g, " ")
  .trim());
const slug = (value = "") => tidy(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const sentence = (value = "", max = 250) => {
  const text = tidy(value);
  if (text.length <= max) return text;
  const cut = text.slice(0, max).replace(/\s+\S*$/, "");
  return `${cut}…`;
};

// Join source paragraphs into one field, keeping the paragraph breaks. Teaching
// prose is never clipped: an explainer that stops mid-sentence is worse than
// useless to a learner working without a teacher. Consumers split on the blank
// line to render one <p> per paragraph.
const paragraphs = (values = []) => values
  .map((value) => tidy(value))
  .filter(Boolean)
  .join("\n\n");

const EMPTY_DOC = { blocks: [], source_file: "(not provided)" };

// A sub-heading inside a section is its own block in the source ("Safety First",
// "The Recipe", "Sorting Made Simple"). Joining blocks with a plain space ran it
// straight into the sentence after it — "Safety First Use ONLY a 1.5 V battery"
// — which the bracketed icon tag used to disguise. Punctuate the seam instead.
//
// Only a Title Case fragment of a few words with no closing punctuation counts,
// so an ordinary short sentence ("Look at the cup") is left alone.
const HEADING_BLOCK = /^(?:[A-Z][\w’'-]*)(?:\s+(?:[A-Z][\w’'-]*|a|an|the|of|and|to|for|in|on))*$/;
function looksLikeHeading(text) {
  const value = String(text || "").trim();
  if (!value || value.length > 40) return false;
  if (/[.!?:;]$/.test(value)) return false;
  const words = value.split(/\s+/);
  if (words.length > 5) return false;
  const capitalised = words.filter((w) => /^[A-Z]/.test(w)).length;
  return capitalised >= Math.max(2, words.length - 1) && HEADING_BLOCK.test(value);
}
// The same seam, but inside a single source block: the heading and its
// explanation were one run, so there is no join to punctuate. "The Recipe Water
// + Carbon dioxide…" and "Big Idea Everything is made of tiny particles" read
// as one sentence until the colon goes back in.
const LEAD_HEADING = /^((?:[A-Z][\w’'-]*)(?:\s+(?:[A-Z][\w’'-]*|of|the|and|a|an|to|for|in|on)){1,4})\s+(?=[A-Z0-9])/;
function punctuateLeadHeading(text) {
  const value = String(text || "").trim();
  const match = value.match(LEAD_HEADING);
  if (!match) return value;
  const head = match[1];
  const words = head.split(/\s+/);
  if (words.filter((w) => /^[A-Z]/.test(w)).length < Math.max(2, words.length - 1)) return value;
  const rest = value.slice(match[0].length);
  return rest.length < 20 ? value : `${head}: ${rest}`;
}

function joinBlocks(parts, separator = " ") {
  const out = [];
  parts.forEach((part, index) => {
    out.push(part);
    const next = parts[index + 1];
    out.push(next && looksLikeHeading(part) ? ": " : separator);
  });
  return out.slice(0, -1).join("").trim();
}

// Reference "key idea" cards are lifted from lesson lines that open "Remember…".
// Deleting just the word left whatever followed it as the whole card, so a
// learner met a rule starting mid-clause: "that the Earth's crust is not one
// smooth shell", "how heat makes materials expand", "This! Heating: parts move
// faster". Drop the full lead-in — the word plus the connective it governs —
// and restore the capital the sentence lost with it.
function openingLine(text) {
  const raw = String(text).trim();
  // "Remember this!" is one lead-in, not the word plus a sentence — taking only
  // the first word left cards opening "This! Heating: parts move faster".
  const rest = raw.replace(/^Remember(?:\s+this)?\b[\s:!,.]*/i, "").trim();
  if (!rest) return raw;
  // Drop the lead-in only where what follows already stands as a sentence.
  // In "Remember how heat makes…" or "Remember too that not every decomposer…"
  // the word governs the clause, so removing it leaves the card opening
  // mid-sentence — worse than the repetition it was meant to avoid.
  return /^[A-Z0-9]/.test(rest) ? rest : raw;
}

// Reviewer corrections, keyed grade → unit file → category → item id → field.
// The reviewed scripts come back as a workbook, not as source-pack edits, so
// tools/apply-ehel-science-script-review.py lands them here and the build lays
// them over the generated content. Without this pass every rebuild would quietly
// throw the review away.
const reviewPath = path.join(sciRoot, "data", "script-review.json");
const scriptReview = fs.existsSync(reviewPath)
  ? (JSON.parse(fs.readFileSync(reviewPath, "utf8")).overrides || {})
  : {};
const reviewStats = { applied: 0, missed: [] };
const tidiedExplanations = [];

// Where each exported category's fields live inside a built unit. Returns the
// object a field should be written to, or null when the item has gone from the
// content (a source pack changed under a review) — reported, never guessed at.
function reviewTarget(unit, category, itemId) {
  const find = (list, id) => (list || []).find((entry) => entry.id === id) || null;
  const indexed = (list, prefix) => {
    const n = Number(String(itemId).slice(prefix.length));
    return Number.isFinite(n) ? (list || [])[n - 1] || null : null;
  };
  switch (category) {
    case "Unit Overview": return { unitOverview: unit.unit, learningPath: unit.unit, outcomes: unit };
    case "Concept": return find(unit.concepts, itemId);
    case "Exploration": return find(unit.explorations, itemId);
    case "Visual Model": return find(unit.visualModels, itemId);
    case "Method": return find(unit.methods, itemId);
    case "Worked Example": return find(unit.workedExamples, itemId);
    case "Practice": return find(unit.practice, itemId);
    case "Activity": return indexed(unit.activities, "activity-");
    case "Fluency": return find(unit.fluency, itemId);
    case "Real Problem": return find(unit.realProblems, itemId);
    case "Reasoning Prompt": return find(unit.reasoningPrompts, itemId);
    case "Assessment Question": return find((unit.assessment || {}).questions, itemId);
    case "Game Round": {
      const match = String(itemId).match(/^(.*)-r(\d+)$/);
      if (!match) return null;
      const game = ((unit.games || {}).games || []).find((entry) => entry.id === match[1]);
      const round = game && (game.rounds || [])[Number(match[2]) - 1];
      return round ? { round, game } : null;
    }
    case "Reference": {
      const ref = unit.reference || {};
      if (itemId.startsWith("rule-")) return indexed(ref.rules, "rule-");
      if (itemId.startsWith("term-")) return indexed(ref.terms, "term-");
      if (itemId.startsWith("vocab-")) return indexed(ref.vocabulary, "vocab-");
      if (itemId.startsWith("mistake-")) return indexed(ref.commonMistakes, "mistake-");
      if (itemId.startsWith("connection-")) return indexed(ref.connections, "connection-");
      return null;
    }
    case "Self Assessment": return unit.selfAssessment ? { list: unit.selfAssessment, itemId } : null;
    default: return null;
  }
}

function applyReviewFields(unit, category, itemId, fields, label) {
  const target = reviewTarget(unit, category, itemId);
  if (!target) { reviewStats.missed.push(`${label} ${category}/${itemId} (item not found)`); return; }
  // Reviewed text is written straight over the built content and never passes
  // through tidy(), so a mechanical fix in the builder cannot reach a field a
  // reviewer has touched — they inherited the seam from the export and had no
  // reason to repunctuate it. Apply the heading rule here too, and only that
  // rule: tidy() would collapse the blank lines separating paragraphs.
  for (let [field, value] of Object.entries(fields)) {
    if (typeof value === "string") value = punctuateKnownHeadings(value);
    if (category === "Unit Overview") {
      target[field][field === "outcomes" ? "outcomes" : field] = value;
    } else if (category === "Game Round") {
      if (field === "gameTitle") target.game.title = value;
      else if (field === "gameSkill") target.game.skill = value;
      else target.round[field] = value;
    } else if (category === "Self Assessment") {
      const n = Number(String(itemId).slice("can-".length));
      if (!Number.isFinite(n) || !target.list[n - 1]) {
        reviewStats.missed.push(`${label} ${category}/${itemId} (slot not found)`);
        continue;
      }
      target.list[n - 1] = value;
    } else if (category === "Reference" && itemId.startsWith("term-")) {
      target[field === "term" ? 0 : 1] = value;
    } else if (category === "Reference" && itemId.startsWith("mistake-")) {
      target[field === "mistake" ? 0 : 1] = value;
    } else {
      target[field] = value;
    }
    reviewStats.applied += 1;
  }
}

function applyScriptReview(unit, grade, unitNumber) {
  const items = ((scriptReview[`grade-${grade}`] || {})[`unit-${unitNumber}`]) || {};
  // Where practice has been authored, the reviewer's corrections for that
  // category describe the extracted page furniture it replaced — they were
  // written against "Year 1 Science — Unit 1 — My Activity Sheet". Applying them
  // would put the furniture straight back over the authored questions.
  const authoredPractice = grade === 1 && !!(GRADE1[unitNumber] || {}).practice;
  for (const [category, byId] of Object.entries(items)) {
    if (authoredPractice && category === "Practice") continue;
    for (const [itemId, fields] of Object.entries(byId)) {
      applyReviewFields(unit, category, itemId, fields, `grade ${grade} unit ${unitNumber}:`);
    }
  }
}

function applyCapstoneReview(capstone, grade) {
  const items = ((scriptReview[`grade-${grade}`] || {}).capstone || {}).Capstone || {};
  const project = capstone.project || {};
  for (const [itemId, fields] of Object.entries(items)) {
    let target = null;
    if (itemId === "capstone-overview") target = { overview: capstone, drivingQuestion: project, finalProduct: project };
    else if (itemId.startsWith("capstone-stage-")) target = (project.stages || [])[Number(itemId.slice(15)) - 1] || null;
    else if (itemId.startsWith("capstone-evidence-")) target = { list: project.evidenceChecklist, index: Number(itemId.slice(18)) - 1 };
    else target = ((capstone.quiz || {}).questions || []).find((q) => `capstone-${q.id}` === itemId) || null;

    if (!target || (target.list && !target.list[target.index])) {
      reviewStats.missed.push(`grade ${grade} capstone: ${itemId} (item not found)`);
      continue;
    }
    for (const [field, value] of Object.entries(fields)) {
      if (itemId === "capstone-overview") target[field][field] = value;
      else if (field === "evidence") target.list[target.index] = value;
      else target[field] = value;
      reviewStats.applied += 1;
    }
  }
}

// Hand-authored Grade 1 content. The Grade 1 source is a parent/teacher
// guide, not a student workbook, so it lacks concept headings, named
// experiments and multiple-choice questions. These age-5-6 overrides give
// each unit clean concept titles, real investigation names, corrected
// vocabulary and picture-friendly quiz questions.
const q = (question, options, answer, explanation) => ({ question, options, answer, explanation });
// Reviewer-authored concept titles (pilot 2026-07) for the 14 units whose
// source lessons carry no per-concept headings, so the builder derived titles
// from learning objectives. Titles are in curriculum order and align to each
// unit's objective-derived concept explanations. Applied over the derived
// titles in buildUnit; extra titles beyond a unit's concept count are ignored.
// Titles for the "Key ideas" revision cards whose source pack carries no
// heading of its own (2026-08). Keyed grade-unit, in the order the placeholder
// cards appear in that unit. Each was written from the card's own text — the
// source has nothing to extract, so numbering them was the only alternative.
const RULE_TITLE_OVERRIDES = {
  "2-1": ["What Living Things Need", "Staying Safe in Extreme Weather"],
  "2-3": ["Heating Expands, Cooling Contracts", "Melting, Freezing and Boiling"],
  "2-6": ["Why We Have Day and Night"],
  // "How Plants Make Food" is gone with the heading-only card it named.
  "3-1": ["The Seven Life Processes", "Living, Dead or Never Alive",
    "The Photosynthesis Recipe"],
  "3-2": ["Filter, Then Boil"],
  "4-2": ["What Energy Is", "Energy Is Never Lost", "Speed and Kinetic Energy",
    "Energy: The Big Picture"],
  "4-3": ["Particles Decide the State"],
  "4-4": ["Plates of the Earth's Crust"],
  "4-5": ["Shadows Prove Light Travels Straight", "Why Some Surfaces Make Images"],
  "5-2": ["From Flower to Seed to New Plant"],
  // Slot 1 is titled again by the review overlay, which runs after this and
  // would otherwise consume the only entry here and leave slot 2 numbered.
  "5-4": ["Protect Your Eyes", "Light Words to Know"],
  "5-5": ["Reading the Sun's Shadows"],
  "6-1": ["Caring for Your Body"],
  "6-4": ["Mass and Weight Are Different", "Balanced and Unbalanced Forces"],
  "7-1": ["Life Is Built From Cells"],
  "7-3": ["Mass in Kilograms, Weight in Newtons", "Energy Transfers and Wasted Heat"],
  "7-5": ["Properties, Metals and pH"],
  "7-6": ["Sound Needs Vibration and a Medium", "Three Plate Movements, Three Results"],
  "7-7": ["Not Every Decomposer Is a Microbe"],
  "8-3": ["Density and Speed Formulas"],
  "8-5": ["Filtration Does Not Make Water Safe", "Mixtures and How to Separate Them"],
  "8-6": ["Always Measure From the Normal", "Protect Your Eyes From the Sun"],
  "8-8": ["The Three Rock Families", "How the Rock Cycle Works"],
  "8-9": ["Ammeters in Series, Voltmeters Across", "Electrical Safety Rules",
    "A Way to Remember the Meters", "Current, Voltage and Resistance"],
};

// Grade 2 Unit 4 (Light) is the one unit whose source pack sets three options per
// quiz question instead of four. Its Practice document is written that way
// throughout, so all twelve questions gave a one-in-three guess where every other
// unit in the course gives one in four — a different pass mark in practice,
// inside a single graded unit, reported only as a warning that had been passing
// for months.
//
// A fourth distractor rather than a hand-authored quiz (which is what Grade 1
// uses): the source's questions and answers were reviewed and are right, and only
// the option count is short. Each distractor below is drawn from what THIS unit
// teaches — "a phone screen" is its own example of artificial light, "reflective"
// belongs to its own vocabulary — so none tests a word the unit never introduces.
// That is what ruled out "translucent" for the transparent question, the obvious
// distractor everywhere else: Stage 2 here teaches opaque and transparent only,
// and a distractor has to be wrong for a reason the learner was taught.
//
// Keyed by question stem rather than by position, so a reordered extraction
// cannot attach a distractor to the wrong question. A key that matches nothing is
// a build error, not a silent no-op — an override that quietly stops applying is
// the option count dropping back to three with the warning as the only trace.
const QUIZ_FOURTH_OPTION = {
  "2-4": {
    "Which of these is a natural light source?": "a phone screen",
    "Which of these makes its OWN light?": "a shiny spoon",
    "Darkness is best described as:": "something you can hold in your hand",
    "To see an object, light must:": "pass straight through the object",
    "To make a shadow you need a light, a surface, and:": "a sheet of clear glass",
    "A material that lets light pass straight through is called:": "reflective",
    "When you move a torch closer to an object, its shadow gets:": "stays the same size",
    "Which surface reflects light the best?": "a woollen blanket",
    "The moon shines because it:": "is covered in bright lamps",
    "We have day and night because:": "the sun moves around the Earth",
    "Your shadow outside is longest:": "when the sky is cloudy",
    "Which is the safest rule when exploring light?": "stare at a bright lamp to test it",
  },
};

const CONCEPT_TITLE_OVERRIDES = {
  "2-1": ["What Animals Need to Live", "What Plants Need to Live", "Different Environments", "Protecting the Environment", "Weather and Seasons", "Science Words for Living Things"],
  "2-3": ["Heating Melts Solids", "Cooling Freezes Liquids", "Melting and Freezing", "Reversible and Irreversible Changes", "Dissolving in Water", "Mixing Materials"],
  "2-5": ["Devices That Use Electricity", "Sorting Electrical Devices", "Batteries and Cells", "Simple Circuits", "Switches", "Using Electricity Safely"],
  "2-6": ["Earth Spins on Its Axis", "The Sun's Apparent Movement", "How Shadows Change", "How Shadows Form", "The Sun Is a Star", "Finding Direction by the Sun"],
  "3-2": ["What Is a Mixture", "Testing What Dissolves", "Separating Mixtures", "Carrying Out a Fair Test", "Observing Carefully", "Mixtures in Daily Life"],
  "3-3": ["Sources of Light", "Why We Need Light to See", "Light Travels in Straight Lines", "How Shadows Form", "Transparent, Translucent and Opaque", "Shadows Through the Day"],
  "3-4": ["The Major Body Organs", "What Each Organ Does", "How Organs Work Together", "Exercise, Heart and Lungs", "Keeping Your Organs Healthy", "Science Words for the Body"],
  "4-5": ["How We See Objects", "Sources of Light", "Light Travels in Straight Lines", "Reflection", "Transparent, Translucent and Opaque", "How the Eye Sees Light"],
  "6-4": ["What Is a Force", "Types of Force", "Mass and Weight", "Friction", "Balanced and Unbalanced Forces", "Measuring Forces"],
  "7-3": ["Gravity as a Non-Contact Force", "Weight on the Moon and Earth", "The Solar System", "Movement in Space", "Tides", "Forms of Energy"],
  "7-4": ["The Seven Characteristics of Life", "The Five Kingdoms", "Vertebrates and Invertebrates", "The Structure of a Virus", "What Is a Species", "Using a Dichotomous Key"],
  "8-3": ["Density", "Measuring Mass and Volume", "Floating and Sinking", "Speed", "Calculating Speed", "Distance-Time Graphs"],
  "8-4": ["What Is an Atom", "Elements and Compounds", "The Periodic Table", "Groups and Their Properties", "Metals and Non-Metals", "Chemical Reactions"],
  "8-6": ["Light as Energy", "Luminous and Non-Luminous Objects", "The Law of Reflection", "Angles of Incidence and Reflection", "Refraction", "Lenses"],
};

const GRADE1 = {
  1: {
    // Stage 1's source is a parent's activity sheet, so the practice extractor
    // had nothing question-shaped to take and lifted the page furniture instead
    // — sheet titles, section headings, horizontal rules, table column labels
    // ("Thing", "Circle one") and picture placeholders. 34 of 72 items were
    // furniture and only 6 contained a question, so the answer key could not be
    // written: there is no answer to "———————————————". These are authored.
    //
    // Answers lead with the word a five-year-old would type, because the app
    // matches a learner's response against this string by substring.
    practice: [
      { level: "Warm-up", prompt: "A goat eats grass, drinks water and grows bigger. Is a goat living or not living?", answer: "A goat is living because it eats, drinks and grows.", hint: "Living things eat, drink, grow and can have young." },
      { level: "Warm-up", prompt: "A stone sits on the ground all day. It never eats and it never grows. Is a stone living or not living?", answer: "A stone is not living because it does not eat, drink or grow.", hint: "Ask the four questions: does it grow, eat, drink, and can it have babies?" },
      { level: "Warm-up", prompt: "Name one thing a living thing must have to stay alive.", answer: "Food, water, air or warmth — any one of these is right.", hint: "There are four. You need them too." },
      { level: "Core", prompt: "A mango tree does not walk about. Some children say that means it is not alive. Are they right?", answer: "No, a mango tree is living because it grows, drinks water and makes new seeds.", hint: "Moving is not the test. Growing, feeding and having young are." },
      { level: "Core", prompt: "A toy car rolls across the floor. Does moving make the toy car alive?", answer: "No, the toy car is not living because it does not eat, drink or grow.", hint: "Rivers and clouds move too, and they are not alive." },
      { level: "Core", prompt: "Write the four things every living thing needs to stay alive.", answer: "Food, water, air and warmth.", hint: "Think about what your own body asks you for each day." },
      { level: "Challenge", prompt: "A hen has chicks. What does that tell you about the hen?", answer: "The hen is living because living things can have young.", hint: "Only living things make new living things." },
      { level: "Challenge", prompt: "You feel hungry. Which of the four needs is your body asking for?", answer: "Food. Feeling hungry is your body asking for food.", hint: "You are a living thing, so you need the same four things a goat needs." },
      { level: "Challenge", prompt: "A banana plant has no mouth. How does it get the water it needs?", answer: "It drinks water from the soil through its roots.", hint: "Look at the part of the plant that hides under the ground." },
      { level: "Extension", prompt: "Your family keeps a chicken. Write one kind thing you can do to care for it.", answer: "Give it food and clean water, and keep it safe and warm.", hint: "Living things depend on kindness. What would you want if you were the chicken?" },
      { level: "Extension", prompt: "A seed is small and still. When you plant it and water it, it grows into a plant. Was the seed living?", answer: "Yes, the seed is living because it can grow into a new plant.", hint: "Something that can grow into a new living thing is alive, even when it looks still." },
      { level: "Extension", prompt: "Sort these into living and not living: a cat, a spoon, a mango plant, a stone.", answer: "Living: the cat and the mango plant. Not living: the spoon and the stone.", hint: "Ask of each one: does it eat, drink, grow, and can it have young?" },
    ],
    outcomes: [
      "Sort things into living and non-living, and say why.",
      "Say that living things move, feed, grow and can have young.",
      "Name some animals and say that they are living.",
      "Name some plants and say that they are living.",
      "Say what living things need to stay alive: food, water and air.",
      "Show care and kindness towards a living animal or plant.",
    ],
    conceptTitles: ["Living Things", "Non-Living Things", "Animals Are Alive", "Plants Are Alive", "What Living Things Need", "Caring for Living Things"],
    misconceptions: [
      ["If it moves, it is alive.", "Cars, clouds and rivers move but are not alive. Living things grow, eat, drink and have young."],
      ["Plants are not alive because they do not walk.", "Plants are alive — they grow, drink water and make new seeds."],
    ],
    connections: [
      { area: "Unit 2 (Plants)", text: "Plants are living things too — next you will watch how they grow from seeds." },
      { area: "At home", text: "Caring for a pet or a plant uses everything you learned about what living things need." },
    ],
    experimentTitles: ["Watch a Seed Grow", "Living or Not-Living Hunt", "Does a Plant Need Water?", "Sort Living and Non-Living Things", "Find the Baby Animals", "Draw a Living Thing You Care For"],
    quiz: [
      q("Which one is alive?", ["a camel", "a rock", "a metal spoon", "a plastic cup"], "a camel", "A camel moves, eats and grows, so it is alive."),
      q("Which one is NOT alive?", ["a mango tree", "a goat", "a stone", "a bird"], "a stone", "A stone never eats, grows or moves by itself, so it is not alive."),
      q("What do living things need to stay alive?", ["food and water", "toys", "a phone", "a car"], "food and water", "All living things need food and water."),
      q("A baby goat grows into a...", ["big goat", "tree", "rock", "car"], "big goat", "Living things grow. A baby goat grows into a big goat."),
      q("Which of these is a plant?", ["a mango tree", "a dog", "a fish", "a cat"], "a mango tree", "A mango tree is a plant. It is living."),
      q("How do we care for a living plant?", ["give it water and light", "put it in a box", "hide it in the dark", "never touch it"], "give it water and light", "Plants need water and light to stay alive and grow."),
    ],
  },
  2: {
    practice: [
      { level: "Warm-up", prompt: "Which part of a plant hides under the soil and drinks water?", answer: "The roots. Roots drink water from the soil.", hint: "It is the part you cannot see when the plant is growing." },
      { level: "Warm-up", prompt: "Which part of a plant stands up tall and holds the rest of it up?", answer: "The stem. The stem holds the plant up.", hint: "It is the long part between the roots and the leaves." },
      { level: "Warm-up", prompt: "Name one thing a plant needs to grow.", answer: "Water, light or warmth — any one of these is right.", hint: "There are three. A plant in a dark cupboard is missing one of them." },
      { level: "Core", prompt: "A plant is kept in a dark cupboard and watered every day. Will it grow well? Why?", answer: "No, because a plant needs light as well as water.", hint: "Water is only one of the three things a plant needs." },
      { level: "Core", prompt: "Which part of the plant is green and catches the sunlight?", answer: "The leaves. Leaves catch sunlight so the plant can make its food.", hint: "You can count them, and they are usually flat and green." },
      { level: "Core", prompt: "You put a seed in the soil and water it. What will it grow into?", answer: "A new plant. A seed grows into a new plant.", hint: "Think what a mango seed becomes after many weeks." },
      { level: "Challenge", prompt: "Name the four main parts of a plant.", answer: "Roots, stem, leaves and flower.", hint: "Start under the soil and work your way up to the top." },
      { level: "Challenge", prompt: "Which part of the plant makes the seeds that grow into new plants?", answer: "The flower. The flower makes the seeds.", hint: "It is usually the brightest, most colourful part." },
      { level: "Challenge", prompt: "A banana plant grows a little taller every week. What does that tell you about it?", answer: "It is living, because living things grow.", hint: "Growing is one of the signs of a living thing." },
      { level: "Extension", prompt: "Your seed was planted two weeks ago and nothing has grown. Write one thing it might be missing.", answer: "Water, light or warmth — any one of these is right.", hint: "Check the three things every plant needs." },
      { level: "Extension", prompt: "Why does a plant in a pot need you to water it, but a plant outside in the rain does not?", answer: "The rain waters the plant outside. A pot plant can only get water from you.", hint: "Where does the outside plant get its water from?" },
      { level: "Extension", prompt: "Write one way you can care for a growing plant.", answer: "Water it, keep it in the light, and keep it safe from harm.", hint: "Think about the three things it needs, and about kindness." },
    ],
    outcomes: [
      "Name the main parts of a plant: roots, stem, leaves and flower.",
      "Say what each part of a plant does.",
      "Say what a plant needs to grow: water, light and warmth.",
      "Describe how a seed grows into a new plant.",
      "Observe and record how a plant changes as it grows.",
      "Care for a growing plant over time.",
    ],
    conceptTitles: ["The Parts of a Plant", "Roots Hold and Drink", "The Stem Carries Water", "Leaves and Flowers", "What Plants Need to Grow", "Looking After a Plant"],
    misconceptions: [
      ["Plants eat food from the soil.", "Plants make their own food in their leaves using sunlight. Soil gives them water and a place to hold on."],
      ["Seeds need light to start growing.", "Most seeds wake up in the dark under the soil — they need water and warmth first."],
    ],
    connections: [
      { area: "Unit 1 (Being Alive)", text: "Plants do everything living things do: grow, feed and make new plants." },
      { area: "Mathematics", text: "Measuring how tall your plant grows each week is real measuring, just like in maths." },
    ],
    experimentTitles: ["Grow a Bean in a Jar", "Plant a Seed and Watch", "Does a Plant Reach for Light?", "Look Inside a Flower", "Water One, Not the Other", "Make a Plant Diary"],
    quiz: [
      q("Which part holds the plant in the soil?", ["roots", "flower", "leaf", "petal"], "roots", "Roots hold the plant firm and drink water from the soil."),
      q("Which part makes food using sunlight?", ["leaves", "roots", "seed", "soil"], "leaves", "Green leaves catch sunlight to make food for the plant."),
      q("A new plant grows from a...", ["seed", "stone", "spoon", "cup"], "seed", "A seed holds a tiny plant that grows when it gets water and warmth."),
      q("What do plants need to grow?", ["water, light and air", "toys", "milk", "shoes"], "water, light and air", "Plants need water, light and air to grow well."),
      q("Which part carries water up to the leaves?", ["the stem", "the flower", "the root hair", "the petal"], "the stem", "The stem holds the plant up and carries water to the leaves."),
      q("To care for a plant we should...", ["water it and give it light", "keep it in the dark", "never water it", "put it in a bag"], "water it and give it light", "A plant stays healthy with water and light."),
    ],
  },
  3: {
    practice: [
      { level: "Warm-up", prompt: "Which part of your body do you use to see?", answer: "The eyes. We see with our eyes.", hint: "You have two of them, and you close them when you sleep." },
      { level: "Warm-up", prompt: "Which part of your body do you use to hear?", answer: "The ears. We hear with our ears.", hint: "You have one on each side of your head." },
      { level: "Warm-up", prompt: "How many senses do we have?", answer: "Five senses.", hint: "Count them: seeing, hearing, smelling, tasting and touching." },
      { level: "Core", prompt: "You smell smoke in the kitchen. Which sense warned you?", answer: "Smell. We smell with our nose.", hint: "Which part of your face did the warning come through?" },
      { level: "Core", prompt: "You reach towards a sufuria and feel that it is hot. Which sense told you?", answer: "Touch. We feel with our skin and hands.", hint: "You did not see it or hear it — you felt it." },
      { level: "Core", prompt: "Which part of your body do you use to taste your food?", answer: "The tongue. We taste with our tongue.", hint: "It is inside your mouth." },
      { level: "Challenge", prompt: "Name the five senses.", answer: "Sight, hearing, smell, taste and touch.", hint: "One for the eyes, ears, nose, tongue and skin." },
      { level: "Challenge", prompt: "Write one way a sense keeps you safe.", answer: "Smelling smoke, hearing a car coming, or seeing a hole in the path.", hint: "Think of something your body warns you about before you get hurt." },
      { level: "Challenge", prompt: "Why should you wash your hands before you eat?", answer: "To wash off dirt and germs so you stay healthy.", hint: "You cannot see what is on your hands, but it can make you ill." },
      { level: "Extension", prompt: "Your friend has curly hair and you have straight hair. Are you both still children?", answer: "Yes. People are the same in some ways and different in others.", hint: "Being different does not make someone a different kind of living thing." },
      { level: "Extension", prompt: "Name two parts of your face.", answer: "Eyes, ears, nose or mouth — any two are right.", hint: "Touch your face and name what you find." },
      { level: "Extension", prompt: "Write one way to keep your body healthy.", answer: "Wash, eat good food, drink clean water, sleep well and play.", hint: "Think about what you do each morning and each night." },
    ],
    outcomes: [
      "Point to and name parts of the body: head, arms, legs, hands and feet.",
      "Point to and name parts of the face: eyes, ears, nose and mouth.",
      "Name the five senses and the body part used for each.",
      "Say one way a sense helps to keep us safe.",
      "Sort objects using touch, such as soft and hard or rough and smooth.",
      "Say ways to keep our bodies clean and healthy.",
    ],
    conceptTitles: ["Parts of My Body", "My Face", "My Five Senses", "Same and Different", "Keeping Clean and Healthy", "Staying Safe"],
    misconceptions: [
      ["We taste food only with our tongue.", "Smell helps us taste too — hold your nose and food tastes different."],
      ["Only eyes tell us about the world.", "All five senses work together: seeing, hearing, smelling, tasting and touching."],
    ],
    connections: [
      { area: "Unit 6 (Sound)", text: "Your ears are the sense organ for hearing — you will explore sound soon." },
      { area: "Staying healthy", text: "Washing your hands and eating good food keeps your body and senses working well." },
    ],
    experimentTitles: ["Point and Name Body Parts", "Feely Bag: Soft or Hard?", "Listen and Point to the Sound", "Taste Test: Sweet or Sour", "Which Nose Knows? Smell Test", "Draw Myself and Label"],
    vocabulary: [
      ["Head", "The top part of your body, above your neck."], ["Arms", "The two long parts joined to your shoulders."],
      ["Legs", "The two long parts you stand and walk on."], ["Hands", "The parts at the end of your arms, used to hold things."],
      ["Feet", "The parts at the end of your legs that you stand on."], ["Eyes", "The body part we use to see."],
      ["Ears", "The body part we use to hear."], ["Nose", "The body part we use to smell."],
      ["Mouth", "The body part we use to taste and to speak."], ["Senses", "The five ways we learn about the world: see, hear, smell, taste and touch."],
    ],
    quiz: [
      q("Which body part do we use to see?", ["eyes", "ears", "nose", "hands"], "eyes", "We use our eyes to see."),
      q("Which body part do we use to hear?", ["ears", "eyes", "feet", "mouth"], "ears", "We use our ears to hear sounds."),
      q("We smell a flower with our...", ["nose", "eyes", "hands", "knees"], "nose", "We use our nose to smell."),
      q("How many senses do we have?", ["five", "two", "ten", "one"], "five", "We have five senses: sight, hearing, smell, taste and touch."),
      q("We taste food with our...", ["mouth", "ears", "eyes", "feet"], "mouth", "We taste food using our tongue in our mouth."),
      q("Which keeps us clean and healthy?", ["washing our hands", "eating mud", "never sleeping", "skipping water"], "washing our hands", "Washing our hands keeps germs away and keeps us healthy."),
    ],
  },
  4: {
    practice: [
      { level: "Warm-up", prompt: "A cooking sufuria is made from which material?", answer: "Metal. A sufuria is made from metal.", hint: "It is hard, shiny and it does not burn on the fire." },
      { level: "Warm-up", prompt: "Is a stone hard or soft?", answer: "Hard. A stone is hard.", hint: "Press it with your finger. Does it squash?" },
      { level: "Warm-up", prompt: "Name one thing in your home that is made from wood.", answer: "A spoon, a chair, a table or a door.", hint: "Look for something that came from a tree." },
      { level: "Core", prompt: "Why are windows made from glass and not from wood?", answer: "Glass is see-through, so the light can come in.", hint: "What would the room be like if the window were wood?" },
      { level: "Core", prompt: "A dress is made from which material?", answer: "Cloth. A dress is made from cloth.", hint: "It is soft and bendy, and it can be folded." },
      { level: "Core", prompt: "Is a pillow hard or soft? Why is that good for a pillow?", answer: "Soft, so it is comfortable to rest your head on.", hint: "Imagine resting your head on a stone instead." },
      { level: "Challenge", prompt: "Why is a raincoat made from plastic and not from cloth?", answer: "Plastic keeps the water out. Cloth soaks the water up.", hint: "Think what happens to a cloth shirt in heavy rain." },
      { level: "Challenge", prompt: "Sort these by their material: a wooden spoon, a metal key, a plastic cup.", answer: "Wood: the spoon. Metal: the key. Plastic: the cup.", hint: "Say what each one is made from, one at a time." },
      { level: "Challenge", prompt: "Why do we make a knife from metal and not from cloth?", answer: "Metal is hard and stiff, so it can cut. Cloth is soft and bendy.", hint: "Which material keeps its shape when you press it?" },
      { level: "Extension", prompt: "Would a paper cup be a good choice for hot soup? Say why.", answer: "No. Paper goes soft and wet, so the soup would leak out.", hint: "Think what happens to paper when it gets wet." },
      { level: "Extension", prompt: "Name a material that bends easily.", answer: "Cloth, rubber or plastic — any bendy material is right.", hint: "Which things in your home can you fold or squash?" },
      { level: "Extension", prompt: "Write one word that describes how a smooth stone feels.", answer: "Smooth. It is not rough or bumpy.", hint: "Rub your finger over it and say what you feel." },
    ],
    outcomes: [
      "Name the material an everyday object is made from.",
      "Describe materials using words like hard, soft, rough, smooth, bendy and stiff.",
      "Sort objects by their material or by a property.",
      "Say why a material is chosen for a particular job.",
      "Test and compare how different materials feel and behave.",
      "Observe and record the properties of materials.",
    ],
    conceptTitles: ["What Things Are Made Of", "Hard and Soft", "Rough and Smooth", "Bendy and Stiff", "Sorting Materials", "Choosing the Right Material"],
    misconceptions: [
      ["Hard things are always strong.", "Some hard things snap easily — glass is hard but it breaks."],
      ["All metal things are heavy.", "Some metal things, like kitchen foil, are very light."],
    ],
    connections: [
      { area: "Unit 5 (Pushes and Pulls)", text: "Bendy and stiff materials behave differently when you push and pull them." },
      { area: "At home", text: "Look around the kitchen: every object's material was chosen to do its job well." },
    ],
    experimentTitles: ["Feel and Sort: Hard or Soft", "Rough or Smooth Hunt", "Bendy or Stiff Test", "Will It Float or Sink?", "Build the Strongest Tower", "Sort Toys by Material"],
    quiz: [
      q("A pillow feels...", ["soft", "hard", "rough", "stiff"], "soft", "A pillow is soft, so it is nice to rest on."),
      q("A stone feels...", ["hard", "soft", "bendy", "fluffy"], "hard", "A stone is hard. It does not squash."),
      q("Which material is bendy?", ["a rubber band", "a brick", "a glass", "a rock"], "a rubber band", "A rubber band bends easily, so it is bendy."),
      q("Sandpaper feels...", ["rough", "smooth", "soft", "wet"], "rough", "Sandpaper is rough and scratchy to touch."),
      q("Glass is usually...", ["smooth", "rough", "bendy", "furry"], "smooth", "Glass feels smooth and flat."),
      q("Which is best for a warm blanket?", ["soft cloth", "hard metal", "sharp glass", "cold stone"], "soft cloth", "Soft cloth is warm and comfy, so it is best for a blanket."),
    ],
  },
  5: {
    practice: [
      { level: "Warm-up", prompt: "You open a door by moving it away from you. Is that a push or a pull?", answer: "A push. A push moves something away from you.", hint: "Which way did the door go — away from you or towards you?" },
      { level: "Warm-up", prompt: "You pull a rope towards you. Does the rope come nearer or go further away?", answer: "Nearer. A pull brings something towards you.", hint: "Say the word 'pull' and think which way your hands move." },
      { level: "Warm-up", prompt: "What do we call a push or a pull?", answer: "A force. A push and a pull are both forces.", hint: "It is the science word for both of them together." },
      { level: "Core", prompt: "A ball is rolling across the floor. What could you do to make it stop?", answer: "Push it the other way, or hold it. A force can stop it.", hint: "It takes a force to start something moving, and a force to stop it." },
      { level: "Core", prompt: "You push a toy car harder than before. Does it go faster or slower?", answer: "Faster. A bigger push makes it go faster.", hint: "Think about pushing a swing gently and then hard." },
      { level: "Core", prompt: "Name one push you do at home.", answer: "Pushing a door, a swing, a chair or a cart.", hint: "Look for something you move away from you." },
      { level: "Challenge", prompt: "Is opening a drawer a push or a pull?", answer: "A pull. You bring the drawer towards you.", hint: "Which way does the drawer travel when it opens?" },
      { level: "Challenge", prompt: "A ball rolls towards a wall, hits it, and comes back. What changed about the ball?", answer: "Its direction. A force changed the way it was moving.", hint: "It was going one way, and then it went another." },
      { level: "Challenge", prompt: "Why does a ball roll but a box slides?", answer: "A ball is round, so it rolls. A box has flat sides, so it slides.", hint: "Look at the shape of each one." },
      { level: "Extension", prompt: "Name one pull you do at home.", answer: "Pulling a door, a rope, a drawer or a zip.", hint: "Look for something you bring towards you." },
      { level: "Extension", prompt: "You give a heavy box and a light box the same push. Which one moves further?", answer: "The light box. The same push moves a light thing more.", hint: "Which is easier to move, a full sack or an empty one?" },
      { level: "Extension", prompt: "Write one way to make a moving toy slow down.", answer: "Push it the other way, or let it rub along the ground.", hint: "Slowing down needs a force too." },
    ],
    outcomes: [
      "Recognise a push and a pull as forces.",
      "Make an object move by pushing or pulling it.",
      "Make a moving object slow down or stop.",
      "Change how fast an object moves.",
      "Change the direction in which an object moves.",
      "Observe and describe pushes and pulls in play and at home.",
    ],
    conceptTitles: ["Pushes", "Pulls", "Making Things Move", "Making Things Stop", "Fast and Slow", "Changing Direction"],
    misconceptions: [
      ["Only people can push and pull things.", "Wind and water push things too — a breeze can push a boat along."],
      ["Big things always move slowly.", "How fast something moves depends on how hard it is pushed or pulled."],
    ],
    connections: [
      { area: "Unit 4 (Materials)", text: "Pushing and pulling shows which materials bend, stretch or stay stiff." },
      { area: "Playtime", text: "Swings, slides and balls all move because of pushes and pulls." },
    ],
    experimentTitles: ["Push a Toy Car", "Pull a Toy on a String", "Ramp Race: Fast or Slow", "Make a Ball Stop", "Push Hard, Push Gently", "Change the Way It Goes"],
    quiz: [
      q("Opening a door by pulling it is a...", ["pull", "push", "lift", "drop"], "pull", "Pulling the door towards you is a pull."),
      q("Kicking a ball away from you is a...", ["push", "pull", "twist", "stop"], "push", "Kicking pushes the ball away, so it is a push."),
      q("A push or a pull is called a...", ["force", "colour", "shape", "sound"], "force", "A push or a pull is a force."),
      q("To make a moving toy stop, you...", ["push against it", "sing to it", "close your eyes", "wait a year"], "push against it", "A force such as a push can make a moving thing stop."),
      q("If you push a swing harder, it goes...", ["faster", "slower", "backwards only", "nowhere"], "faster", "A bigger push makes things move faster."),
      q("A push on the side of a ball can...", ["change its direction", "change its colour", "make it sing", "make it vanish"], "change its direction", "A force can change the direction a thing moves in."),
    ],
  },
  6: {
    practice: [
      { level: "Warm-up", prompt: "Which part of your body do you use to hear?", answer: "The ear. We hear with our ears.", hint: "You have one on each side of your head." },
      { level: "Warm-up", prompt: "A drum being hit makes a very big sound. Is that sound loud or quiet?", answer: "Loud. A drum makes a loud sound.", hint: "Would you cover your ears, or lean in to listen?" },
      { level: "Warm-up", prompt: "When something makes a sound, what is it doing?", answer: "Shaking, or vibrating. Sounds are made when things vibrate.", hint: "Touch a drum skin just after it is hit and feel it." },
      { level: "Core", prompt: "Put your hand on your throat and hum. What can you feel?", answer: "A shaking, or vibration. Your voice makes your throat vibrate.", hint: "It tickles your fingers a little." },
      { level: "Core", prompt: "Is a whisper loud or quiet?", answer: "Quiet. A whisper is a quiet sound.", hint: "Think how close you must be to hear one." },
      { level: "Core", prompt: "Name one loud sound you hear near your home.", answer: "A car horn, a drum, thunder or a cockerel.", hint: "Think of a sound you can hear from far away." },
      { level: "Challenge", prompt: "A drum only makes a sound when you hit it. Why?", answer: "Hitting it makes the skin shake, and shaking makes the sound.", hint: "No shaking means no sound." },
      { level: "Challenge", prompt: "Name one quiet sound.", answer: "A whisper, a leaf moving, or someone breathing.", hint: "Think of a sound you must be close to hear." },
      { level: "Challenge", prompt: "Why should you never push anything into your ear?", answer: "It can hurt your ear, and you need your ears to hear.", hint: "Ears are delicate and they do not mend easily." },
      { level: "Extension", prompt: "How does the sound of a drum reach your ear?", answer: "It travels through the air to your ear.", hint: "There is something between the drum and you, even though you cannot see it." },
      { level: "Extension", prompt: "Why do we cover our ears when a sound is very loud?", answer: "To keep our ears safe. Very loud sounds can hurt them.", hint: "What does your body want to do near a very loud noise?" },
      { level: "Extension", prompt: "Write one sound you hear in the morning.", answer: "A cockerel, birds, a car, or people talking.", hint: "Listen tomorrow morning and remember the first sound you hear." },
    ],
    outcomes: [
      "Say that sounds are made when things shake or vibrate.",
      "Name the ear as the body part we use to hear.",
      "Sort sounds into loud and quiet.",
      "Make sounds in different ways.",
      "Describe the sounds we hear around us.",
      "Listen carefully and identify different sounds.",
    ],
    conceptTitles: ["What Is Sound?", "How We Hear", "Loud Sounds", "Quiet Sounds", "Making Sounds", "Sounds Around Us"],
    vocabulary: [
      ["Sound", "What we hear when something shakes the air"],
      ["Vibration", "A fast shaking that makes sound"],
      ["Ear", "The body part we hear with"],
      ["Loud", "A big, strong sound"],
      ["Quiet", "A small, soft sound"],
      ["Volume", "How loud or quiet a sound is"],
      ["Listen", "To pay attention with your ears"],
      ["Echo", "A sound that bounces back to you"],
    ],
    misconceptions: [
      ["Sound happens by itself.", "Every sound is made by something shaking or vibrating — a drum skin, a string, or your voice."],
      ["Loud sounds always come from near by.", "Far-away thunder can still be loud; sounds get quieter as they travel further."],
    ],
    connections: [
      { area: "Unit 3 (Ourselves)", text: "You hear with your ears — one of the five senses you learned about." },
      { area: "Music", text: "Drums, strings and your own voice all make sound by shaking." },
    ],
    experimentTitles: ["Listen for One Minute", "Shake a Sound Maker", "Loud and Quiet Sorting", "Feel a Drum Vibrate", "Make a String Buzz", "Guess That Sound"],
    quiz: [
      q("We hear with our...", ["ears", "eyes", "nose", "hands"], "ears", "We use our ears to hear sounds."),
      q("A drum banged hard makes a...", ["loud sound", "quiet sound", "no sound", "cold sound"], "loud sound", "Banging a drum hard makes a loud sound."),
      q("A whisper is a...", ["quiet sound", "loud sound", "bright light", "warm smell"], "quiet sound", "A whisper is a very quiet sound."),
      q("Sounds are made when things...", ["shake or vibrate", "sit still", "go to sleep", "turn cold"], "shake or vibrate", "Sounds are made when things vibrate — they shake very fast."),
      q("Which is a loud sound?", ["a shouting crowd", "a falling feather", "a sleeping cat", "a soft breath"], "a shouting crowd", "A shouting crowd makes a loud sound."),
      q("To hear a soft sound better, we should...", ["listen quietly", "shout", "cover our ears", "run away"], "listen quietly", "Listening quietly helps us hear soft sounds."),
    ],
  },
};

// Child-facing Grade 1 concept text.
//
// Every other year ships a student lesson book, so the builder can carry the
// source prose straight through. Grade 1 ships only a Teacher & Parent Guide:
// its prose addresses the adult ("Goal: your child learns...", "Take your child
// outside"), which is wrong to show a 5-year-old and, worse, teaches nothing
// when no adult is reading. These explainers say the same science directly to
// the child, keeping the guide's teaching order, its local examples (goats,
// mango and banana plants, the sufuria, the Jubba) and its warmth.
//
// Titles follow the guide's own lesson/part order, so a unit has as many
// concepts as the guide has lessons — never a fixed six padded with filler.
const GRADE1_CONCEPTS = {
  1: [
    {
      title: "Living or Not Living?",
      explanation: "Look around you. Some things near you are alive. Some things are not alive. A goat is alive. A stone is not alive. A mango tree is alive. A cooking spoon is not alive.\n\nHow can you tell? Ask four questions about the thing. Does it grow bigger? Does it eat? Does it drink? Can it have babies? If the answers are mostly yes, it is a living thing. If the answers are no, it is not living.\n\nHold a stone in your hand. Does the stone eat? No. Does it drink water? No. Does it grow bigger? No. So the stone is not living.\n\nNow look at a goat. The goat eats grass. It drinks water. It grew from a small kid into a big goat. So the goat is living. It is alive!\n\nHere is a tricky one. A toy goat looks like a goat, but it is not alive. It cannot eat or grow. A toy car moves, but it still does not eat or grow or have babies. So moving is not the same as being alive.",
      example: "Try this: find a stone, a spoon, a leaf and a cup of water. Make two piles on the floor — a Living pile and a Not Living pile. Put each thing in the right pile, and say out loud why you chose it.",
    },
    {
      title: "What Living Things Need",
      explanation: "Every living thing needs the same four things to stay alive: food, water, air and warmth. A tiny chick needs them. A big camel needs them. A tall mango tree needs them. You need them too.\n\nThink about your own body. When you feel hungry, that is your body asking for food. You are a living thing, and living things need food. When you feel thirsty, your body is asking for water.\n\nFood gives living things the energy to move and grow. A goat eats grass. A chicken pecks seeds. A cat drinks milk. A mango plant makes its own food in the sunshine.\n\nWater matters just as much. You drink from a cup. The goat drinks from the well. The banana plant drinks water from the soil through its roots. No living thing can live without water.\n\nAir is all around you, even though you cannot see it. Take a slow breath in, then out. You just used air. Every living thing needs air to breathe.\n\nWarmth is the last one. Living things need to be warm enough, not too cold. That is why a hen sits on her eggs, and why seeds wake up and grow in the warm season.",
      example: "Put your hand on your chest and breathe in slowly. You are using air. Now say the four things every living thing needs: food, water, air, warmth.",
    },
    {
      title: "Animals and Plants Are Alive",
      explanation: "Animals are living things. Goats, camels, chickens, cats and birds all move about, eat, drink and breathe. It is easy to see that they are alive.\n\nPlants are living things too, and this surprises many people. A mango plant does not run about. It does not make a sound. So you might think it is not alive. But look closely and you will see the signs of life.\n\nA plant grows taller and taller. It drinks water from the soil through its roots. It makes its own food in the sunlight with its green leaves. Growing, drinking and feeding are all things that living things do. So a plant is alive.\n\nHere is another wonderful sign of a living thing: living things can make new living things. A grown goat can have a baby goat, and the baby is called a kid. A hen can have chicks. A tiny seed can grow into a big plant, and one day that plant makes seeds of its own.\n\nSo both animals and plants are living. They grow, they feed, they drink, and they can make new life.",
      example: "Look at a mango or banana plant near you. Say three things that show it is alive: it grows, it drinks water, and it makes food in the sun.",
    },
    {
      title: "Caring for Living Things",
      explanation: "Now you know that living things need food, water, air and warmth. That means living things depend on kindness — often on your kindness.\n\nA goat cannot fetch its own water from the well. A plant cannot water itself when the dry season comes. A small chick cannot look after itself. They need someone to care for them, and that someone can be you.\n\nBeing kind to living things means being gentle. Give the goat water. Do not hurt the cat. Give the plant water and let it stand in the sun. Hold small chicks very gently, because they are little.\n\nWhen you care for an animal, wash your hands afterwards. That keeps you healthy too.\n\nEvery living thing around you is a gift from Allah — the chickens that give eggs, the goats that give milk, the plants that give mangoes and bananas, and your own living body. Saying Alhamdulillah is a beautiful way to thank Allah for all of them.",
      example: "Choose one living thing today and care for it. Give a plant some water, or put out grain for the chickens. Then say what you did and why it helped.",
    },
  ],
  2: [
    {
      title: "The Parts of a Plant",
      explanation: "Find a real plant to look at — a mango plant, a banana plant, or even a tuft of grass. Look at it slowly. A plant has different parts, and each part has its own job, just as your body has parts with jobs: eyes to see, legs to walk.\n\nDown at the bottom are the roots. They grow down into the soil. Roots drink water for the plant, and they hold the plant steady so the wind cannot blow it over.\n\nIn the middle is the stem. It stands up tall and holds the plant up. The stem also carries water from the roots all the way up to the leaves.\n\nThe green parts are the leaves. Leaves catch the sunlight and use it to make food for the plant. That is a wonderful thing: a plant makes its own food, and it does it with light.\n\nMany plants also have a flower. The flower is the pretty part, and it is where new seeds begin.\n\nPoint to each part and say its name out loud: roots, stem, leaves, flower.",
      example: "Point at a plant and name its parts in order from the bottom up: roots, stem, leaves, flower. Say what job each part does.",
    },
    {
      title: "What Plants Need to Grow",
      explanation: "A plant is a living thing, so it has needs — just like you. But a plant cannot walk to find food or water the way a goat or a chicken can. It must get everything it needs from the place where it grows.\n\nThere are four things every plant needs to grow strong and healthy.\n\nWater comes first. Plants drink water through their roots. In the dry season we must water them, or they wilt and droop.\n\nLight comes next. Plants use light from the bright sun to make their food in their leaves. Without light they turn pale and weak.\n\nWarmth is the third. Seeds and plants like to be warm. The warm sun helps a sleeping seed wake up and start to grow.\n\nSoil is the fourth. Good soil holds the roots firmly and gives the plant food from the ground.\n\nWater, light, warmth and soil — remember those four, and you know how to keep a plant alive.",
      example: "Water a plant near your home. Then check that it is standing where the sun can reach it. You have just given it two of the four things it needs.",
    },
    {
      title: "Planting a Seed",
      explanation: "Every big plant, even a tall tree, started as a tiny seed. Inside each seed sleeps a baby plant, waiting for water and warmth to wake it up.\n\nHold one dry bean in your hand. It feels hard and small and still. But a whole plant — taller than a cup, maybe taller than you — is folded up asleep inside it. A seed can wait a very long time, dry and quiet, until water and warmth find it.\n\nSoak a bean in water overnight and it changes. A dry bean is hard. A soaked bean is soft and fat, because it has drunk up water and is beginning to wake.\n\nGently split a soaked bean into two halves. Inside you can see a tiny pale tip — that is the baby plant. Around it is packed food, which feeds the baby plant until it can make its own food with its leaves. A tough coat wraps around everything to keep it safe.\n\nNow plant one. Scoop soil into a cup until it is nearly full. Poke a small hole with one finger. Drop the seed in, cover it gently, and water it. Put the cup where the sun reaches it.\n\nThen watch each day. The root grows down first to find water. Then the shoot pushes up towards the light.",
      example: "Plant a bean in a cup of soil and water it. Look at it every day and say what has changed. Which came first — the root going down, or the shoot coming up?",
    },
  ],
  3: [
    {
      title: "The Parts of Our Body",
      explanation: "The best place to start learning about the body is your own body. It is right here with you.\n\nStand up. Touch the top of your head and say the word: head. Now move down, one part at a time. Touch your arms. Touch your hands. Touch your legs. Touch your feet. Say each name out loud as you touch it.\n\nNow your face. Point to your eyes. Point to your ears. Point to your nose. Point to your mouth.\n\nNow count. You have two eyes. Two ears. Two hands. Ten fingers. Ten toes. Count them slowly and see if you get the same number every time.\n\nEach part of your body has a job to do. Your eyes see. Your ears hear. Your legs carry you. Your hands hold and carry things. All these parts work together, all day long, without you even asking them to.",
      example: "Touch and name five parts of your body out loud: head, arms, hands, legs, feet. Then count your fingers and your toes.",
    },
    {
      title: "Same and Different",
      explanation: "Here is a big and kind idea: all people have the same body parts, and yet every person looks a little different. Both things are true at the same time, and both are wonderful.\n\nLook at the people in your home. What is the same? Everyone has a head. Everyone has two eyes, a nose, two hands and two feet. That is the same for every person in the whole world.\n\nNow look again. What is different? Some hair is curly and some is straight. Some eyes are dark brown and some are lighter. Some people are tall and some are small. Some hands are big and some are little.\n\nYou and a grown-up both have two hands — that is the same. But your hands are small and their hands are big — that is different.\n\nBeing different is good. Allah made every person special. Nobody in the whole world is exactly like you. What a gift that is.",
      example: "Look at two people in your home. Say one thing that is the same about them, and one thing that is different.",
    },
    {
      title: "Our Five Senses",
      explanation: "Your body has special helpers called senses. They tell your brain about the world around you. You have five of them.\n\nSight comes from your eyes. Your eyes let you see colours, shapes, people and the bright sun. Look around and name what you can see — a cup, the door, a green plant. Now gently close your eyes and try to point at the door. It is much harder! Eyes help you a great deal.\n\nHearing comes from your ears. Tap a spoon on a cup, or clap your hands. Some sounds are happy, like a bird singing or your mother's voice. Some sounds warn us and keep us safe, like a loud beep.\n\nSmell comes from your nose. Smell a piece of mango, a date, or some bread. Smell helps you enjoy good food, and it warns you too — if food smells bad, we do not eat it.\n\nTaste comes from your tongue. A date tastes sweet. Before we eat we say Bismillah, and after we eat we say Alhamdulillah, to thank Allah for our food.\n\nTouch comes from your skin, especially your hands. Touch tells you if something is hot or cold, rough or smooth, hard or soft.\n\nSight, hearing, smell, taste and touch — five senses, working for you all day.",
      example: "Close your eyes and ask someone to make a soft sound. Which sense did you use to find it? Now name all five senses and the body part each one uses.",
    },
    {
      title: "Staying Healthy and Clean",
      explanation: "Your body is wonderful, and it is your job to take care of it.\n\nIn Islam, being clean is loved and important. The Prophet (peace be upon him) taught that cleanliness is a beautiful part of our faith. So washing and keeping clean is healthy AND a good deed at the same time.\n\nWashing your hands is the best place to start. Wet your hands. Rub in the soap. Make bubbles between your fingers. Scrub while you count slowly, so your hands get really clean. Then rinse the soap away.\n\nWhen should you wash? Before you eat. After you use the toilet. And whenever your hands are dirty from playing.\n\nWhy does it matter? Because there are germs — tiny living things far too small for your eyes to see. If germs get onto your food and into your body, they can make you unwell. Soap and water wash them away.\n\nYour body also needs good food, clean water, plenty of sleep and lots of moving and playing to stay strong.",
      example: "Wash your hands with soap and count slowly to twenty while you scrub. Then say two times of day when washing hands is most important.",
    },
  ],
  4: [
    {
      title: "What Is It Made From?",
      explanation: "Here is a new science word: material. A material is what an object is made from.\n\nLook at a wooden spoon and a metal spoon side by side. They do the same job — but they are made from different materials. One is made from wood. One is made from metal.\n\nLook around your home and you will find many materials. Wood. Plastic. Metal. Glass. Paper. Cloth. Stone. Pick up one thing at a time, feel it in your hand, and say what material it is made from.\n\nHere is something interesting: one object can be made from more than one material. Look closely at a pencil. The outside is wood. The soft grey part inside writes. At the top there is metal, and often rubber too. That is three or four materials in one small pencil.\n\nSo when you meet a new object, ask yourself: what is this made from?",
      example: "Pick up three things near you. For each one, say what material it is made from. Then find one object that is made from more than one material.",
    },
    {
      title: "How Does It Feel?",
      explanation: "A property is a describing word for a material. It tells you how the material feels, or what it can do.\n\nThe best way to learn properties is with your fingers. Touch, press and gently bend things, and notice what you feel.\n\nHard and soft is the first pair. Press a stone — it is hard and does not squash. Press a piece of cloth — it is soft and squashes easily.\n\nRough and smooth is the next pair. Feel a coral stone or a brick — it is rough and bumpy. Feel a glass jar — it is smooth, with no bumps at all.\n\nBendy and stiff is the last pair. Bend a piece of cloth and it folds easily, so cloth is bendy. Try to bend a wooden spoon and it will not move, so wood is stiff.\n\nHard and soft. Rough and smooth. Bendy and stiff. These words help you describe any material you meet.",
      example: "Find one hard thing and one soft thing. Then find one rough thing and one smooth thing. Say each property out loud as you touch it.",
    },
    {
      title: "The Right Material for the Job",
      explanation: "People do not choose materials by accident. We match the material to the job, because of what that material can do.\n\nThink about why. Nobody builds a window out of wood — you could not see through it. Nobody makes a cooking pot out of paper — it would burn and fall apart on the fire.\n\nA metal sufuria is used for cooking because metal is hard and strong and does not burn on the fire.\n\nA window is made of glass because glass is smooth and you can see straight through it.\n\nA dress is made of cloth because cloth is soft on your skin, keeps you warm, and bends when you move.\n\nA cup for a small child is made of plastic because plastic does not break when it is dropped.\n\nSo before you choose a material, ask: what does this thing need to do?",
      example: "Look at a cooking pot and a window. Say what each is made from, and why that material is the right one for that job.",
    },
    {
      title: "Sorting Materials",
      explanation: "Sorting means putting things into groups that are the same in some way. Sorting is a big science skill, and you can do it with almost anything.\n\nGather a basket of objects from around your home. Now you can sort them in many different ways.\n\nYou can sort by material: all the wooden things in one group, all the metal things in another.\n\nYou can sort by how they feel: hard things in one group, soft things in another.\n\nYou can sort by what they do: things we eat with, things we wear, things we build with.\n\nWhy does sorting matter so much? Because when you put all the metal things together, you are noticing what those things share. That is the beginning of real scientific thinking — looking for what is the same and what is different. Grown-up scientists do exactly this when they study the world.",
      example: "Collect six objects. Sort them into two groups by material. Then mix them up and sort the same six a different way — by how they feel.",
    },
  ],
  5: [
    {
      title: "Many Ways to Move",
      explanation: "Before we talk about pushing and pulling other things, feel how your own body moves.\n\nStand up in a clear space. How many ways can you move?\n\nWalk slowly, like a camel walking in the heat. Now walk fast. Which one was fast?\n\nJump up high. Did you notice what you did? You pushed the floor with your feet, and that push sent you up.\n\nTurn around slowly, like a spinning top. Now you are turning.\n\nSwing your arms back and forth, like a swing at the park.\n\nEvery one of those movements happened because something pushed or pulled. When you jump, your feet push the ground. When you swing your arms, your muscles pull them back and forth. Movement always starts with a push or a pull.",
      example: "Stand up and move in four ways: walk, jump, turn and swing your arms. After each one, say whether you pushed or pulled to make it happen.",
    },
    {
      title: "Push Moves Away, Pull Brings Near",
      explanation: "Here are the two big words of this unit: push and pull.\n\nA push moves something away from you. A pull brings something closer to you. That is the whole idea, and it is easy to feel with your own hands.\n\nPut a toy car on the floor. Push it away with one finger and say the word out loud: push! It went away from you.\n\nNow tie a string to a small box and pull it towards you. Say: pull! It came to you.\n\nDoors are a good place to spot both. You push a door to shut it. You pull a door to open it.\n\nSay the word at the same time as you do the action. Push and say push. Pull and say pull. Doing it and saying it together helps you remember which is which.",
      example: "Find a door. Push it shut and say push. Pull it open and say pull. Then find two more things at home that you push, and two that you pull.",
    },
    {
      title: "Move, Stop, and Turn",
      explanation: "A push or a pull can do three different jobs. Many people think a push only makes things go — but it can do more than that.\n\nThe first job is to start something moving. Roll a ball across the floor. Your push made it move.\n\nThe second job is to stop something. When the ball rolls back to you, put your hand out. The ball stops. Your hand pushed it to stop.\n\nThe third job is to make something turn a new way. Roll the ball again, then push it gently from the side. It does not stop — it turns and travels in a new direction.\n\nTry all three with a toy car. Push it to start. Block it to stop. Tap its side to make it turn.\n\nA push or a pull can make a thing go, make a thing stop, and make a thing turn. With your pushes and pulls, you are the boss of the ball.",
      example: "Roll a ball three times. First make it move, then stop it with your hand, then tap it from the side to make it turn.",
    },
    {
      title: "Fast and Slow, Roll and Slide",
      explanation: "Now for two new ideas you can feel with your own hands.\n\nThe first idea is about how hard you push. A big push makes a thing go fast. A small push makes it go slow.\n\nGive a ball a soft push and watch it travel slowly. Soft push, slow ball. Now give it a big push and watch it race away. Big push, fast ball. The size of your push decides the speed.\n\nThe second idea is about shape. Round things roll, and flat things slide.\n\nRoll a ball or an orange along the floor. It rolls because it is round and has no corners to stop it.\n\nNow push a shoe or a block. It does not roll — it slides along on its flat bottom.\n\nSo the shape of a thing changes how it moves when you push it.",
      example: "Push a ball softly, then hard, and say which push made it faster. Then find one thing that rolls and one thing that slides.",
    },
    {
      title: "Pushes and Pulls Around Us",
      explanation: "Pushes and pulls are everywhere. Once you know the two words, you start seeing them all day long.\n\nWalk around your home and yard. At each thing you meet, ask yourself one question: do we push it, or pull it?\n\nYou push a chair in under the table. You pull a drawer out. You push a door shut and pull it open. You turn a tap.\n\nOut in the yard there are more. You push a swing to send it away. You pull a toy cart behind you. You roll a ball with a push.\n\nWatch a grown-up sweeping with a broom. Look carefully — that is a push and a pull, over and over again.\n\nOut on the road, a camel or a donkey pulls a cart. The animal pulls, and the cart follows.\n\nScience is not only in books. It is in your home, your yard and your road, all day long.",
      example: "Walk around your home and find five things you push or pull. Say push or pull for each one as you find it.",
    },
  ],
  6: [
    {
      title: "Sounds All Around Us",
      explanation: "There are sounds everywhere, all the time — but we are usually too busy to notice them.\n\nSit somewhere and stay very still. Close your eyes and just listen. Wait quietly and listen hard for a whole minute.\n\nNow think about what you heard. Maybe a bird calling. Maybe a goat. Maybe the wind moving, a car passing, or people talking somewhere nearby.\n\nCount the different sounds on your fingers. You probably heard more than you expected.\n\nHere is the surprising part: even when a place feels quiet, there are still little sounds to hear. Quiet does not mean there is no sound at all — it just means the sounds are small and soft.\n\nGood scientists notice things. Listening carefully is one of the best ways to notice the world.",
      example: "Close your eyes and listen for one whole minute. Then count on your fingers how many different sounds you heard, and name each one.",
    },
    {
      title: "How We Make Sounds",
      explanation: "Here is the big science idea of this unit: sounds happen when things shake.\n\nWhen something moves back and forth very fast, it makes a sound. That fast shaking has a special name — vibrating.\n\nStretch a rubber band between your fingers and pluck it gently. Look closely. You can see it shaking, so fast that it blurs. That shaking is the vibration, and that is what makes the sound you hear.\n\nNow tap a metal pot with a spoon. You hear a sound. Rest your finger gently on the pot while it is still ringing — you can feel it buzzing. The pot is vibrating too.\n\nTry one more. Put your fingers gently on the front of your throat and hum. Can you feel the buzzing under your fingers? That is your voice vibrating inside you.\n\nEvery single sound, everywhere, comes from something shaking and moving.",
      example: "Put your fingers on your throat and hum a long note. Say what you can feel, and use the science word for that fast shaking.",
    },
    {
      title: "Loud Sounds and Quiet Sounds",
      explanation: "Sounds come in different sizes. Some sounds are loud, and some sounds are quiet. Quiet sounds are sometimes called soft sounds.\n\nThe good news is that you can control how loud or quiet a sound is.\n\nClap your hands very softly. That is a quiet clap. Now clap firmly — but not near anyone's ears. That is a loud clap. You made both, using the same two hands.\n\nTry it with your voice. Whisper a word very quietly. Now say the same word in your normal voice. Same word, different loudness.\n\nTry it with a pot. Bang it firmly and it makes a loud sound. Tap it lightly and it makes a quiet one.\n\nWhat makes the difference? How much energy you give it. A bigger, harder movement makes a bigger vibration, and a bigger vibration makes a louder sound.",
      example: "Clap once quietly and once loudly. Say which one needed more energy from you, and why it sounded louder.",
    },
    {
      title: "How We Hear With Our Ears",
      explanation: "You hear with your ears. You have two of them, one on each side of your head — and there is a good reason for that.\n\nTouch your ears now, one on each side.\n\nYour ears are shaped a little like small cups, and they catch sounds travelling through the air. Try cupping your hands behind your ears and listening. Sounds get a bit louder, because your hands are catching even more sound.\n\nNow here is why two ears are so useful. Close your eyes and ask someone to make a soft sound on your left side, then on your right side. Each time, point to where the sound came from.\n\nYou can do it because a sound from the left reaches your left ear a tiny bit sooner and a tiny bit louder. Your brain notices that difference and works out which direction the sound came from. Two ears help you find where a sound is.\n\nCover your ears with your hands and the sound becomes quiet and far away, because your hands are blocking it.",
      example: "Close your eyes while someone makes a soft sound to one side of you. Point to where it came from, then say why two ears helped you.",
    },
    {
      title: "Sounds Travel, and We Keep Ears Safe",
      explanation: "Sound has to travel to reach you. It moves through the air, from the thing that is shaking all the way to your ears.\n\nHere is how you can tell. Ask someone to clap from far across the room, then clap again standing close to you. The close clap sounds louder.\n\nThat is because sound gets weaker as it travels. The further a sound has to go, the quieter it is when it arrives. A sound made far away reaches you faint and small.\n\nNow the important part: looking after your ears. Your ears are delicate, and very loud sounds can hurt them. Once hearing is damaged, it does not always come back.\n\nSo keep loud noises away from your ears. Do not shout right into someone's ear, and do not let anyone shout into yours. If a sound is so loud that it hurts, cover your ears with your hands and move away from it.\n\nYour ears let you hear a bird singing, your mother's voice, and someone reciting beautifully. They are worth protecting.",
      example: "Ask someone to clap far away and then close to you. Say which was louder and why. Then say one way you will keep your ears safe.",
    },
  ],
};

// Text that briefs the adult rather than teaching the learner. The Grade 1
// guide and the Year 1-2 activity sheets are written for whoever is sitting
// with the child ("For the grown-up: read each instruction aloud"), and those
// lines are meaningless — sometimes misleading — on the learner's screen.
// Matched per sentence, so a legitimate mention ("grown-up scientists do
// exactly this") is left alone.
// Headings that mark the end of a unit's teaching prose. Everything from here
// on belongs to another section of the runtime package (self-assessment, the
// quiz, the glossary), so a concept must not absorb it.
const LESSON_TAIL = /^(self[- ]assessment|i can\b|check what you (have )?learned|what you have learned|key ?words|key science words|key scientific terms|glossary|vocabulary\b|summary\b|unit summary|end[- ]of[- ]unit|quiz\b|answer key|answers?\b|going further|prerequisite|what.?s next|next unit|well done|wonderful work|congratulations|checklist|practice\b|section [a-e]\b|experiment \d|reference\b)/i;

// Inline callouts that interrupt the prose without ending the section.
const CALLOUT = /^(?:[\p{Emoji_Presentation}\p{Extended_Pictographic}\s]*)?(ask your ai tutor|remember|did you know|tip\b|note\b|watch out|safety)/iu;

// A short, title-cased line with no sentence punctuation starts a new section.
// Several books stop numbering partway through a unit and carry on with plain
// headings like "Circuits: The Path Electricity Travels"; without recognising
// those, the last numbered concept absorbs the entire rest of the book.
function isSectionHeading(text) {
  const value = String(text || "").trim();
  if (value.length < 6 || value.length > 70) return false;
  if (/[.?!,;]$/.test(value)) return false;
  if (CALLOUT.test(value) || LESSON_TAIL.test(value)) return false;
  if (!/^[A-Z0-9]/.test(value)) return false;
  // Headings are short phrases; a long clause is prose that happens to wrap.
  return value.split(/\s+/).length <= 9;
}

const ADULT_ADDRESSED = /teach in short bursts|cannot sit still for long|\byour child\b|\bthe child (draws|watches|points|is|will|looks|gets)\b|\blet (the|your) child\b|\bchildren learn\b|\bat this age\b|keep every lesson|\byou, the grown-?up\b|as the adult|as a parent|teacher or parent|in this guide you will|you will do the talking|you read the words aloud|for the grown-?up|a grown-?up reads|when the grown-?up says|if the child is tired|stop before the child/i;

// Grade 1 unit overviews, written to the learner. The guide's own opening
// paragraphs all brief the adult, so there is nothing in the source to fall
// back to once those are filtered out.
const GRADE1_OVERVIEWS = {
  "1-1": "In this unit you will discover one big idea: some things around you are alive, and some things are not. A goat is alive. A stone is not. You will learn the four questions that tell you whether something is living, find out what every living thing needs to stay alive, see that plants are alive just as animals are, and learn how to care kindly for the living things around you.",
  "1-2": "In this unit you will get to know plants. You will find the parts of a plant and learn the job each part does, discover the four things every plant needs to grow, and plant a real seed of your own. Then you will watch it every day as the root grows down and the shoot pushes up towards the light.",
  "1-3": "In this unit you will learn about the most interesting thing you own: your own body. You will name its parts, see how all people are the same and yet each person is different, meet your five senses and try each one out, and learn how to keep your body clean, healthy and strong.",
  "1-4": "In this unit you will become a material detective. You will learn what a material is and find the materials things are made from, describe how materials feel using words like hard, soft, rough, smooth, bendy and stiff, work out why we choose one material for a job instead of another, and sort a basket of objects in several different ways.",
  "1-5": "In this unit you will explore pushes and pulls. You will feel the many ways your own body moves, learn that a push moves things away and a pull brings them near, discover that a push can start, stop or turn a thing, find out why a big push makes something go fast, and then hunt for pushes and pulls all around your home.",
  "1-6": "In this unit you will explore sound. You will listen carefully to the sounds around you, discover the big idea that sounds are made when things shake, learn about loud and quiet sounds, find out how your two ears help you tell where a sound came from, and learn how to keep your ears safe from sounds that are too loud.",
};

function buildGrade(grade) {
  const source = model.grades[String(grade)];
  if (!source) throw new Error(`Grade ${grade} missing from the science content model.`);
  const stageId = `s${String(grade).padStart(2, "0")}`;
  const stageLabel = `Stage ${grade}`;
  const contentPackage = `Ehel-Academy-Science-Grade-${grade}-Content-Package`;
  // Official Cambridge framework: Primary Science 0846 (Stages 1-6),
  // Lower Secondary Science 0893 (Stages 7-9). The primary code was previously
  // recorded as 0097; the curriculum framework Cambridge publishes for these
  // stages is titled "Cambridge Primary Science 0846 Curriculum Framework",
  // and it is the document these mappings validate against
  // (src/curriculum/cambridge-science-0846.json).
  const cambridge = grade <= 6
    ? { level: "Cambridge Primary Science", code: "0846", stage: grade }
    : { level: "Cambridge Lower Secondary Science", code: "0893", stage: grade };
  const cambridgeLabel = `${cambridge.level} ${cambridge.code} — Stage ${grade}`;
  const gradeDir = path.join(sciRoot, `grade-${grade}`);
  const unitDir = path.join(gradeDir, "data", "units");

  const docFor = (unit, type) => source.documents.find((doc) => doc.unit === unit && doc.document_type === type) || EMPTY_DOC;
  const sectionBlocks = (doc, pattern) => doc.blocks.filter((block) => pattern.test(block.section) && block.content_kind !== "Heading");
  const sectionNames = (doc) => [...new Set(doc.blocks.map((block) => block.section))];

  function unitTitle(lesson, fallback, unitNo) {
    for (const block of lesson.blocks.slice(0, 4)) {
      const match = tidy(block.text).match(/^Year\s+\d+(?:\s+Science)?\s*[-–—]\s*Unit\s+\d+\s*:\s*(.+)$/i);
      if (match && match[1].length > 1 && match[1].length <= 90) return tidy(match[1]);
    }
    for (let index = 0; index < Math.min(6, lesson.blocks.length - 1); index += 1) {
      const text = tidy(lesson.blocks[index].text);
      const next = tidy(lesson.blocks[index + 1].text);
      if (/^Year\s+\d+\s+Science/i.test(next) && text.length > 2 && text.length <= 90 && !/^Year\s+\d+/i.test(text)) return text;
    }
    if (fallback && !/^(learning objectives|key words glossary|teacher and parent guide)/i.test(fallback)) return fallback;
    return `Unit ${unitNo}`;
  }

  function outcomeList(lesson) {
    let list = sectionBlocks(lesson, /able to do|learning objectives|what you will learn/i)
      .map((block) => tidy(block.text))
      .filter((text) => text.length > 20 && !/^(read them now|by the time|these are)/i.test(text))
      .slice(0, 10);
    if (!list.length) {
      list = lesson.blocks.map((block) => tidy(block.text))
        .filter((text) => /^(sort|name|describe|explain|identify|compare|plan|record|measure|observe|predict|investigate|use|give|connect|state|label)\b/i.test(text) && text.length > 25)
        .slice(0, 8);
    }
    return list;
  }

  // Turn a verb-led objective into a short noun-phrase concept title:
  // "Explain that Earth spins on its axis, giving day and night" -> "Earth
  // Spins On Its Axis". Strips the leading verb and filler, trims to ~6 words.
  function titleFromObjective(objective) {
    const VERB = "sort|name|describe|explain|identify|compare|classify|plan|record|measure|observe|predict|investigate|use|give|connect|state|label|list|recognise|recognize|discuss|show|define";
    let s = tidy(objective)
      .replace(new RegExp(`^(?:${VERB})\\b\\s*`, "i"), "")            // leading verb
      .replace(new RegExp(`^and\\s+(?:${VERB})\\b\\s*`, "i"), "")     // "Observe and describe ..." -> after both verbs
      .replace(/[,.;:].*$/, "")                                       // first clause only
      .replace(new RegExp(`\\s+and\\s+(?:${VERB})\\b.*$`, "i"), "")   // drop a trailing second clause
      .replace(/\s+(and give local examples|and use them|correctly|using science words)\b.*$/i, "")
      .trim();
    // "what an atom is" / "how X works" -> the noun phrase itself
    const m = s.match(/^what\s+(?:an?\s+|the\s+)?(.+?)\s+(?:is|are|does|means?|works?)\b/i)
      || s.match(/^how\s+(.+?)\s+(?:work|happens?|forms?|moves?)\b/i);
    if (m) s = m[1];
    else s = s.replace(/^(that|how|the difference between|why|what|to|a|an|the|its|and|when|as|is|are)\s+/i, "");
    s = s.split(/\s+/).slice(0, 8).join(" ");
    // Trim dangling connectives from the end, repeatedly.
    let prev;
    do { prev = s; s = s.replace(/\s+(of|in|on|to|the|a|an|and|with|by|for|as|into|from|when|that|through|such)$/i, "").trim(); } while (s !== prev);
    // Reject only true junk; a single strong noun ("Density", "Reflection") is
    // a fine title.
    if (s.length < 5 || /^(and|when|that|as|is|are|the|a|an|this|these|each|some|both)$/i.test(s)) return null;
    const small = new Set(["of", "in", "on", "to", "the", "a", "an", "and", "with", "by", "for", "its", "into", "from", "as", "when"]);
    return s.split(/\s+/).map((w, i) => (i > 0 && small.has(w.toLowerCase())) ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  }

  // Which blocks are rows of a real grid, as opposed to a paragraph that merely
  // has a border drawn round it.
  //
  // The model marks every table cell the same way, but Word is being used for
  // two different things. A data table (states of matter, plant versus animal,
  // the element list) is a grid whose cells are fragments — "Milk, oil, honey"
  // means nothing read aloud in a paragraph. A callout box ("Did You Know? …")
  // is a single cell that contains an ordinary paragraph, and there are 213 of
  // those in this course.
  //
  // A run of consecutive Table cell blocks is one table. If any cell in the run
  // reaches column 2, it is a grid and the whole run is data — including its
  // first column, which is why the test is on the run and not on each cell.
  // A run that never leaves column 1 is a box, and its text is prose.
  function gridCellIndexes(blocks) {
    const grid = new Set();
    let runStart = null;
    const closeRun = (endExclusive) => {
      if (runStart === null) return;
      let widest = 0;
      for (let i = runStart; i < endExclusive; i += 1) widest = Math.max(widest, Number(blocks[i].table_col) || 0);
      if (widest >= 2) for (let i = runStart; i < endExclusive; i += 1) grid.add(i);
      runStart = null;
    };
    blocks.forEach((block, index) => {
      if (block.block_type !== "Table cell") { closeRun(index); return; }
      // Two tables can sit back to back with no paragraph between them, and in
      // this course they routinely do: a callout box follows the data table it
      // comments on. Treating the cells as one run merged the box into the grid
      // and deleted five callouts. A cell at row 1, column 1 is a table's
      // top-left corner, so it ends the previous run and starts a new one.
      const topLeft = Number(block.table_row) === 1 && Number(block.table_col) === 1;
      if (runStart !== null && topLeft) closeRun(index);
      if (runStart === null) runStart = index;
    });
    closeRun(blocks.length);
    return grid;
  }

  // How these books open a line of a worked solution. Anchored, so a sentence
  // that merely contains the word "answer" is not mistaken for one.
  const WORKED_STEP = /^(?:Step\s*\d|Given\b|Formula\b|Calculate\b|Working\b|Solution\b|Answer\b)\s*[:.—-]/i;

  function conceptList(lesson, title) {
    const gridCells = gridCellIndexes(lesson.blocks);
    // Concept headings are not written the same way in every year. Three
    // conventions appear across the source books:
    //   "Part 2 - What Plants Need"      (word marker, Years 1-6)
    //   "Big Idea 1: All Living Things"  (word marker, Year 2)
    //   "3. Mass and Weight"             (bare number, Years 2/3/7/8)
    // Only the word markers were recognised before, so units written the third
    // way produced no concepts at all and fell through to the objective
    // fallback, which restates the objective instead of teaching it.
    const CONCEPT_MARKER = /^(?:Part|Concept|Topic|Section|Idea|Big Idea|Lesson)\s+\d+\s*[—:.\-]/i;
    // A numbered heading is short, is not a sentence, and is not workbook
    // scaffolding ("4. Complete the table", "2. Explain why...").
    const NUMBERED = /^(\d{1,2})[.)]\s+(\S.{5,79})$/;
    const NOT_A_HEADING = /^(answer|example|step|remember|aim|method|materials|hypothesis|conclusion|analysis|going further|safety|what you|how to|read |write |draw |name |list |explain |describe |identify |complete |circle |match |tick |fill |copy |look )/i;
    const numberedHeading = (text) => {
      const match = NUMBERED.exec(text);
      if (!match) return null;
      const body = match[2].trim();
      if (/[.?!;,]$/.test(body) || NOT_A_HEADING.test(body)) return null;
      return { number: Number(match[1]), body };
    };

    let starts = lesson.blocks
      .map((block, index) => ({ block, index }))
      .filter(({ block }) => CONCEPT_MARKER.test(tidy(block.text)));
    if (starts.length < 4) {
      // Fall back to bare-numbered headings. Numbers must ascend, but gaps are
      // tolerated: some books leave a section unnumbered mid-run.
      const numbered = [];
      let highest = 0;
      lesson.blocks.forEach((block, index) => {
        const heading = numberedHeading(tidy(block.text));
        if (heading && heading.number > highest) {
          highest = heading.number;
          numbered.push({ block, index, heading: heading.body });
        }
      });
      if (numbered.length > starts.length) starts = numbered;
    }
    // Some books number the first few sections and then continue with plain
    // headings ("Circuits: The Path Electricity Travels"). Those sections are
    // ordinary teaching content, so fold them in rather than letting the last
    // numbered concept run to the end of the book.
    if (starts.length && starts.length < 6) {
      const lastStart = starts[starts.length - 1].index;
      const taken = new Set(starts.map((entry) => entry.index));
      const extra = [];
      for (let index = lastStart + 1; index < lesson.blocks.length; index += 1) {
        const text = tidy(lesson.blocks[index].text);
        if (LESSON_TAIL.test(text)) break;
        if (!taken.has(index) && isSectionHeading(text)) extra.push({ block: lesson.blocks[index], index, heading: text });
      }
      starts = starts.concat(extra.slice(0, Math.max(0, 6 - starts.length)));
    }
    let concepts = starts.map(({ block, index, heading: numberedTitle }, position) => {
      const end = starts[position + 1]?.index ?? lesson.blocks.length;
      // Take the concept's whole body, not a 10-block window. These courses are
      // self-teaching: the source prose is the only explainer a learner without
      // a teacher ever sees, so it is carried across in full.
      // The last concept has no following heading to stop at, so without a
      // terminator it swallows everything to the end of the book — the
      // self-assessment checklist, the closing note, the next unit's
      // prerequisites. Cut at the first block that is no longer teaching prose.
      const slice = lesson.blocks.slice(index + 1, end);
      // Concepts with a following heading are already bounded by it. Only the
      // final concept runs to the end of the document, so only it needs cutting
      // at the first non-teaching heading — applying the cut everywhere would
      // truncate bodies at their own sub-headings and drop the prose beneath.
      const isLast = position === starts.length - 1;
      const tailAt = isLast
        ? slice.findIndex((item) => {
          const text = tidy(item.text);
          return LESSON_TAIL.test(text) || isSectionHeading(text);
        })
        : slice.findIndex((item) => LESSON_TAIL.test(tidy(item.text)));
      const kept = tailAt >= 0 ? slice.slice(0, tailAt) : slice;
      // A worked example's steps are short by nature — "Calculate: m = 1.03 x
      // 500 = 515." is 32 characters — so the 40-character prose filter dropped
      // the arithmetic and kept the sentence that set it up. A line opening with
      // a step marker is teaching however short it is, so it is measured against
      // the same floor the table fallback uses rather than the prose one.
      const usable = (text, minLength) => text.length > (WORKED_STEP.test(text) ? 12 : minLength)
        && !/Ask Your AI Tutor|^Remember\b/i.test(text);
      // Prose first, and prose is decided by the table a block sits in, not by
      // its length. The 40-character filter was doing both jobs and could only
      // do one: it kept out SHORT table cells and let long ones through as if
      // they were paragraphs, so a concept of ordinary prose ended on a stray
      // row of somebody's comparison table — "Milk, oil, honey", "Distant suns;
      // they twinkle in the night sky", "Needed by plants and by your body;
      // from Latin kalium".
      //
      // Excluding every Table cell is NOT the fix, and trying it is what showed
      // why: Word draws a callout box as a one-cell table, and every one of the
      // 213 "Did You Know?" callouts in this course is a table cell. Dropping
      // them all would delete real teaching to remove a dozen fragments.
      // gridCells separates the two by shape — see the helper.
      const prose = kept.filter((item, offset) => !gridCells.has(index + 1 + offset));
      let bodyItems = prose.filter((item) => usable(tidy(item.text), 40));
      // Some sections teach mostly through a table (states of matter, beak
      // shapes, natural vs man-made). Their rows arrive as short table-cell
      // blocks, so the 40-character prose filter empties the concept. Fall back
      // to the shorter blocks so the table's content survives — cells included,
      // because here they ARE the teaching rather than debris caught beside it.
      if (bodyItems.map((item) => tidy(item.text)).join(" ").length < 300) {
        bodyItems = kept.filter((item) => usable(tidy(item.text), 12));
      }
      const body = bodyItems.map((item) => tidy(item.text));
      const heading = numberedTitle
        || tidy(block.text).replace(/^(?:Part|Concept|Topic|Section|Idea|Big Idea|Lesson)\s+\d+\s*[—:.\-]\s*/i, "");
      // The closing paragraph becomes the worked "Example", so hold it out of
      // the explanation whenever there is enough prose to spare one.
      //
      // Unless it is the tail of a worked example, which is not a spare
      // paragraph but the second half of a sentence pair. Three concepts ended
      // mid-solution because of this: the explanation stopped at "Step 1 — Pick
      // the two numbers. Metal box = 12 N, plastic toy = 2 N." and Step 2, the
      // one with the answer in it, was displayed on its own under "Example:".
      // Nothing was lost, but a learner read the setup and never the result.
      //
      // The test is on the last TWO blocks, not one. A single closing worked
      // example makes a perfectly good Example and should still be held out;
      // what must not be severed is a run of steps. The model marks these
      // (content_kind "Worked example"), so the sequence is visible here.
      // content_kind alone cannot answer this. The same worked example is
      // labelled "Worked example" in the Year 3 pack and "Learning outcome" in
      // the Year 8 one, so the marker the author actually wrote is the more
      // reliable signal, and both are used.
      const isWorkedStep = (item) => Boolean(item)
        && (item.content_kind === "Worked example" || WORKED_STEP.test(tidy(item.text)));
      const endsMidWorkedExample = bodyItems.length > 1
        && isWorkedStep(bodyItems[bodyItems.length - 1])
        && isWorkedStep(bodyItems[bodyItems.length - 2]);
      const hasSpareParagraph = body.length > 2 && !endsMidWorkedExample;
      return {
        id: `concept-${position + 1}-${slug(heading) || position + 1}`,
        title: heading,
        explanation: paragraphs(hasSpareParagraph ? body.slice(0, -1) : body),
        // When the closing run is a worked example the whole run stays in the
        // explanation, so the Example line has to come from somewhere else —
        // and it must not be another step, or the card shows "Step 1 — Look
        // closely" with nothing to look at. Take the last paragraph that is not
        // a step: it is the concept's own illustrative sentence, already read in
        // context above.
        example: tidy(hasSpareParagraph
          ? body[body.length - 1]
          : (endsMidWorkedExample
            ? (([...bodyItems].reverse().find((item) => {
              const text = tidy(item.text);
              // Not a step, and not the example's own title line — "Worked
              // Example: using the law of reflection." names the thing rather
              // than showing it, which reads as badly under "Example:" as a
              // bare step does.
              return !isWorkedStep(item) && !/^Worked Examples?\b/i.test(text);
            }) || {}).text || body[0])
            : null)
            || body[1] || body[0] || heading),
        // The book gave this concept its own heading, so the title is the
        // author's, not one the builder inferred.
        fromHeading: true,
      };
    });
    if (!concepts.length) {
      // Look for genuine topic sub-headings; reject workbook scaffolding.
      const BLOCK = /^(example|step by step|worked example|answer|recording|analysis|going further|remember|key|assessment|about this unit|learning objectives|unit overview|welcome|materials|method|aim|hypothesis|conclusion|lesson\s*\d|part\s*\d\b|section|introduction|summary|glossary|vocabulary|self[- ]|checklist|what you will|how to use|ask your ai)/i;
      const topicHeadings = lesson.blocks
        .filter((block) => block.content_kind === "Heading")
        .map((block) => tidy(block.text).replace(/^(Part|Lesson)\s*\d+\s*[—:\-]\s*/i, ""))
        .filter((text) => text.length >= 6 && text.length <= 52 && !/[.!?]$/.test(text) && !BLOCK.test(text));
      // Prefer the unit's own learning-objective statements as concepts —
      // these are real teaching content, unlike the lesson's welcome/why-it-
      // matters narrative. Each objective that yields a clean title becomes a
      // concept; fall back to substantive paragraphs only if too few do.
      const readablePhrase = (text) => {
        const stripped = tidy(text).replace(/^(?:and\s+)?(?:sort|name|describe|explain|identify|compare|classify|plan|record|measure|observe|predict|investigate|use|give|connect|state|label|list|recognise|recognize|discuss|show|define)\b\s*/i, "");
        const short = sentence(stripped.replace(/[,.;:].*$/, ""), 46).replace(/\s+(of|in|on|to|the|a|an|and|with|by|for|as|into|from|when|that)$/i, "");
        return short.charAt(0).toUpperCase() + short.slice(1);
      };
      const VERB_LED = /^(?:and\s+)?(sort|name|describe|explain|identify|compare|classify|plan|record|measure|observe|predict|investigate|use|give|connect|state|label|list|recognise|recognize|discuss|show|define)\b/i;
      const objectiveTexts = outcomeList(lesson).filter((text) => VERB_LED.test(text));
      // If the objectives section captured fewer than six, top up from
      // verb-led teaching lines elsewhere in the lesson (some units split
      // their objectives across sub-headings).
      if (objectiveTexts.length < 6) {
        for (const line of lesson.blocks.map((b) => tidy(b.text))) {
          if (objectiveTexts.length >= 6) break;
          if (VERB_LED.test(line) && line.length > 25 && line.length < 240 && !objectiveTexts.includes(line)) objectiveTexts.push(line);
        }
      }
      const objectiveConcepts = objectiveTexts.map((text) => ({ text, title: titleFromObjective(text) || readablePhrase(text) }));
      if (objectiveConcepts.length >= 4) {
        concepts = objectiveConcepts.slice(0, 6).map((o, index) => ({
          id: `concept-${index + 1}-${slug(o.title) || index + 1}`,
          title: o.title,
          explanation: tidy(o.text),
          example: tidy(objectiveConcepts[(index + 1) % objectiveConcepts.length].text),
        }));
      } else {
        const bodyParagraphs = lesson.blocks.map((block) => tidy(block.text))
          .filter((text) => text.length > 90 && !/^(assalaam|welcome|young scientist|by the (end|time)|this is your lesson|read them (now|again)|ask your ai|in this unit you (are|will))/i.test(text))
          .slice(0, 6);
        concepts = bodyParagraphs.map((text, index) => ({
          id: `concept-${index + 1}-${slug(title)}-${index + 1}`,
          title: topicHeadings[index] || `${title} — part ${index + 1}`,
          explanation: tidy(text),
          example: tidy(bodyParagraphs[(index + 1) % bodyParagraphs.length] || text),
        }));
      }
    }
    // Drop concepts too thin to teach anything — a promoted heading whose
    // section turned out to be a stub ("Reading Comprehension") is worse than
    // no card at all. Keep them only if removing them would leave too few.
    // Where a concept's section held only one paragraph, `example` fell back to
    // that same paragraph — so the card printed its explanation twice, once
    // under "Example". Give it a real prompt instead.
    concepts = concepts.map((concept) => {
      if (tidy(concept.example) !== tidy(concept.explanation)) return concept;
      const opening = String(concept.explanation).split("\n\n")[0];
      const firstSentence = (opening.match(/^.*?[.!?](?=\s|$)/) || [opening])[0];
      return {
        ...concept,
        example: `Say this idea back in your own words: ${tidy(firstSentence)} Then find one example of ${concept.title.toLowerCase().replace(/[?.!]$/, "")} around your home or outside.`,
      };
    });
    const substantial = concepts.filter((concept) => String(concept.explanation).length >= 300);
    if (substantial.length >= 3) concepts = substantial;
    return concepts.slice(0, 6);
  }

  function termPairsFromTables(doc, pattern) {
    const cells = doc.blocks.filter((block) => pattern.test(block.section) && block.block_type === "Table cell");
    const byRow = new Map();
    for (const cell of cells) {
      const key = `${cell.section}::${cell.table_row}`;
      if (!byRow.has(key)) byRow.set(key, {});
      byRow.get(key)[cell.table_col] = tidy(cell.text);
    }
    const pairs = [];
    for (const row of byRow.values()) {
      if (row[1] && row[2] && row[1].length < 100 && row[2].length < 260
          && !/^(word|term|what it means|meaning|mistake|misconception|error|the truth|why it is wrong|correct( approach)?|q|question|answer|explanation|example)$/i.test(row[1])) pairs.push([row[1], row[2]]);
    }
    return pairs;
  }

  function sentencesFrom(...docs) {
    const out = [];
    for (const doc of docs) for (const block of doc.blocks) {
      const text = tidy(block.text);
      if (text.length < 40) continue;
      if (/Ask Your AI Tutor|🤖/i.test(text)) continue; // boilerplate, not example material
      for (const part of text.split(/(?<=[.!?])\s+(?=[A-Z“"])/)) {
        const s = tidy(part);
        if (s.length >= 40 && s.length <= 240) out.push(s);
      }
    }
    return out;
  }

  function referenceData(reference, lesson, experimentsDoc) {
    let terms = termPairsFromTables(reference, /glossary|key words/i);
    if (!terms.length) terms = termPairsFromTables(lesson, /key science words|glossary|key words/i);
    if (!terms.length) terms = termPairsFromTables(lesson, /./);

    let rules = sectionBlocks(reference, /most important rule|key rules?\b/i)
      .map((block) => tidy(block.text)).filter((text) => text.length > 20 && !ADULT_ADDRESSED.test(text))
      .map((text, index) => ({ title: `Key idea ${index + 1}`, text }));
    if (!rules.length) {
      rules = lesson.blocks.map((block) => tidy(block.text))
        .filter((text) => /^remember\b/i.test(text) && text.length > 25 && !ADULT_ADDRESSED.test(text)).slice(0, 6)
        .map((text, index) => ({ title: `Key idea ${index + 1}`, text: openingLine(text) }));
    }

    let commonMistakes = [];
    const mistakeCells = termPairsFromTables(reference, /common mistakes/i);
    if (mistakeCells.length) commonMistakes = mistakeCells;
    else {
      const lines = sectionBlocks(reference, /common mistakes/i).map((block) => tidy(block.text)).filter((text) => text.length > 15);
      // Table-less mistakes often read "Mistake ... The truth is ..." — split on that.
      for (const line of lines) {
        const m = line.match(/^(.*?)(?:\bthe truth\b|\bactually\b|\bcorrect\b|\binstead\b|—|:)\s*(.+)$/i);
        if (m && m[1].length > 8 && m[2].length > 8) commonMistakes.push([tidy(m[1]).replace(/[—:]$/, ""), tidy(m[2])]);
        else if (commonMistakes.length && commonMistakes[commonMistakes.length - 1].length === 1) commonMistakes[commonMistakes.length - 1].push(line);
        else commonMistakes.push([line]);
      }
      commonMistakes = commonMistakes.filter((pair) => pair.length === 2);
    }
    // Some reference tables ship with their own column headings as the first
    // row ("Common mistake" / "Why it is wrong"), which the table reader picks
    // up as if it were a mistake. It carries no science, and a learner sees a
    // card whose heading and body are both placeholder labels. Four of these
    // reached the courses before a reviewer spotted them.
    const PLACEHOLDER_MISTAKE = /^(common mistake|misconception|why people think it|why it is wrong|correction|the truth)$/i;
    commonMistakes = commonMistakes.filter(
      (pair) => !PLACEHOLDER_MISTAKE.test(String(pair[0] || "").trim()));

    // Cross-curricular / cross-unit connections: authored in almost every
    // reference doc but previously unused.
    const connections = sectionBlocks(reference, /connection/i)
      .map((block) => tidy(block.text))
      .filter((text) => text.length > 20 && !/^connections?\b/i.test(text))
      .map((text) => {
        const m = text.match(/^(Unit\s+\d+[^:—-]*|[A-Z][A-Za-z ]{2,30}?)\s*[:—-]\s*(.+)$/);
        return m ? { area: tidy(m[1]), text: sentence(m[2], 240) } : { area: "Links", text: sentence(text, 240) };
      }).slice(0, 6);

    // Drop non-vocabulary rows that leak in from source tables: bare header
    // words ("Fact | Value"), fact-figure rows whose meaning is just a number
    // ("Number of planets | 8"), and checklist rows ("Knows that... | Can
    // do / Getting there"). Chemical formulas like "Water | H2O" stay.
    const HEADER_WORD = /^(fact|value|quantity|factor|amount|number|item|word|term|meaning|name|formula|symbol|example|definition)$/i;
    terms = terms.filter(([term, meaning]) => {
      const t = tidy(term), m = tidy(meaning);
      if (HEADER_WORD.test(t) && (HEADER_WORD.test(m) || m.length < 8)) return false; // "Formula | Name" header rows
      if (/^what it (finds|does|shows|means|tells)/i.test(t)) return false;
      if (/^(number|how many|amount) of\b/i.test(t)) return false; // fact rows, not vocabulary
      if (/^\d+([.,]\d+)?$/.test(m) || (/^(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)$/i.test(m) && t.split(" ").length > 2)) return false;
      if (/^(knows?|tells?|can\b|names?|says?|shows?|uses?|identifies)\b/i.test(t) && t.split(" ").length > 3) return false;
      if (/can do|getting there|needs (help|support)|not yet/i.test(m)) return false;
      return true;
    });
    terms = terms.slice(0, 12);

    // Rich vocabulary: pair each term with an example sentence from the
    // source that actually uses the word, plus a short category.
    const corpus = sentencesFrom(lesson, reference, experimentsDoc || EMPTY_DOC);
    const vocabulary = terms.map(([term, meaning]) => {
      const head = tidy(term).replace(/\s*\(.*?\)\s*/g, " ").trim();
      const key = head.split(/[\/,]/)[0].trim();
      const wordRe = new RegExp(`\\b${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      const example = corpus.find((s) => wordRe.test(s) && s.toLowerCase() !== tidy(meaning).toLowerCase() && !/^[a-z ]+:/i.test(s)) || "";
      const cleanExample = ADULT_ADDRESSED.test(example) ? "" : sentence(example, 220);
      return { term: head, meaning: tidy(meaning), example: cleanExample, letter: (head[0] || "?").toUpperCase() };
    });
    return { rules: rules.slice(0, 6), terms, vocabulary, commonMistakes: commonMistakes.slice(0, 6), connections };
  }

  // Safety review (pilot, 2026-07): every home experiment gets targeted
  // safety guidance appended as a final step when its materials or steps
  // involve a hazard and no equivalent warning is already present.
  const SAFETY_RULES = [
    { match: /\bmagnets?\b/i, dedupe: /magnet.{0,60}(mouth|swallow)/i, maxGrade: 8, note: "Magnets must never go in or near your mouth — swallowing magnets is a medical emergency. Keep them away from babies and young children." },
    { match: /small (?:objects?|stones|beads|seeds|beans|buttons)|bottle cap|marble|\bcoin\b|date stone|small item/i, dedupe: /(mouth|nose|swallow)/i, maxGrade: 4, note: "Small objects must never go in your mouth, nose or ears. Keep them away from babies and toddlers." },
    { match: /plastic bag|cling ?film/i, dedupe: /plastic bag.{0,60}(face|head|toy)/i, maxGrade: 5, note: "Plastic bags are not toys — never put them over or near your face." },
    { match: /balloon/i, dedupe: /balloon.{0,60}(adult|chew|suck)/i, maxGrade: 4, note: "Ask an adult to blow up the balloon, and never chew or suck on it." },
    { match: /\b(nails?|pins?|drawing pins?|needle|tack)\b/i, dedupe: /(adult|grown[- ]?up).{0,60}(nail|pin|sharp)|sharp point|no needle/i, maxGrade: 8, note: "Pins and nails have sharp points — ask an adult to help, and store them safely afterwards." },
    { match: /syringe/i, dedupe: /never point.{0,40}(face|eye)|no needle.{0,80}(adult|careful|point)/i, maxGrade: 8, note: "Use a syringe with NO needle. Never point it at anyone's face or eyes." },
    { match: /hot water|boiling|kettle|warm water from|heat(?:ed)? water/i, dedupe: /(adult|grown[- ]?up).{0,60}(hot|boil|kettle)/i, maxGrade: 8, note: "Hot water must be poured and carried by an adult only." },
    { match: /glass (?:jar|bottle|cup|container)|\bmirror\b/i, dedupe: /glass.{0,60}(break|adult|careful|two hands)/i, maxGrade: 5, note: "Glass breaks — carry jars and mirrors with two hands, and tell an adult straight away if anything chips or cracks." },
    { match: /\bbattery\b|\bcircuit\b|\bbulb\b.*\bwire|wire.*\bbulb\b/i, dedupe: /(mains|socket|plug)/i, maxGrade: 8, note: "Use only a small 1.5 V battery. Never use plug sockets or mains electricity, and disconnect the battery when you finish." },
    { match: /acid|alkali|indicator|vinegar.*(?:test|liquid)|household liquids/i, dedupe: /(bleach|never taste|cleaning product)/i, maxGrade: 8, note: "Only test safe kitchen liquids such as lemon juice and vinegar. Never touch or mix cleaning products like bleach, and never taste anything you are testing." },
    { match: /sundial|sun shadow|shadow.*sun|sunny patch/i, dedupe: /never look.{0,30}sun/i, maxGrade: 8, note: "Never look directly at the sun — it can damage your eyes." },
    { match: /\bmould\b|\bbacteria\b|\bmicroorganism/i, dedupe: /(never open|do not open|sealed.{0,40}(closed|shut|throw))/i, maxGrade: 8, note: "Keep the sealed bags closed at all times — never open or smell the mould. Throw the sealed bags away, unopened, when the investigation ends, and wash your hands." },
  ];
  function appendSafety(activity, grade) {
    const text = `${activity.title} ${activity.materials || ""} ${(activity.steps || []).join(" ")}`;
    const notes = [];
    for (const rule of SAFETY_RULES) {
      if (grade > rule.maxGrade) continue;
      if (!rule.match.test(text)) continue;
      if (rule.dedupe.test(text)) continue; // an equivalent warning already exists
      notes.push(rule.note);
    }
    if (notes.length) activity.steps = [...(activity.steps || []), `Safety: ${notes.join(" ")}`];
  }

  function experimentsData(experiments) {
    const starts = experiments.blocks
      .map((block, index) => ({ block, index }))
      .filter(({ block }) => /^(Experiment|Investigation)\s+\d+\s*[—:\-]/i.test(tidy(block.text)));
    return starts.map(({ block, index }, position) => {
      const end = starts[position + 1]?.index ?? experiments.blocks.length;
      const body = experiments.blocks.slice(index, end);
      const grab = (marker) => {
        const at = body.findIndex((item) => marker.test(tidy(item.text)));
        if (at < 0) return [];
        const stopMarkers = /^(aim|make a hypothesis|hypothesis|materials|method|recording sheet|analysis questions?|what to observe|safety|conclusion|going further)\b/i;
        // A section heading is a short label. Prose that merely opens with one
        // of these words is not a boundary: "Safety First — use ONLY a 1.5 V
        // battery, never the mains…" is a paragraph of the aim, and treating it
        // as a heading dropped that guidance from the unit entirely. The tag
        // that used to shield it ("[SAFE]") is stripped for display, so length
        // is what separates a label from a sentence.
        const HEADING_MAX = 60;
        const out = [];
        for (let cursor = at + 1; cursor < body.length; cursor += 1) {
          const text = tidy(body[cursor].text);
          if (stopMarkers.test(text) && text.length <= HEADING_MAX) break;
          if (text.length > 3) out.push(text);
        }
        return out;
      };
      // Year 1's investigations come from a parent Activity Sheet, so the aim
      // and method can be written to the adult ("Take your child outside…").
      // Those lines go straight onto the learner's Explore card, so drop them.
      const learnerFacing = (values) => values.filter((text) => !ADULT_ADDRESSED.test(text));
      return {
        title: tidy(block.text).replace(/^(Experiment|Investigation)\s+\d+\s*[—:\-]\s*/i, ""),
        aim: tidy(joinBlocks(learnerFacing(grab(/^Aim\b/i)))),
        hypothesis: tidy(joinBlocks(learnerFacing(grab(/^(Make a Hypothesis|Hypothesis)\b/i)))),
        materials: tidy(grab(/^Materials\b/i).join("; ")) || "Safe everyday materials from home",
        steps: learnerFacing(grab(/^Method\b/i)).slice(0, 6),
        analysis: learnerFacing(grab(/^Analysis Questions?\b/i)).slice(0, 4),
      };
    }).filter((item) => item.title);
  }

  // `unitWords` are this unit's own glossary terms. A hint that names them is
  // actually usable; the single sentence that used to be shared by every unit
  // in every grade ("Use the unit's key words and explain your thinking") told
  // the learner nothing they could act on.
  function practiceData(practice, activitiesDoc, unitWords = []) {
    const words = unitWords.filter(Boolean).slice(0, 3);
    const recallHint = words.length >= 2
      ? `Look back at what ${words.slice(0, 2).join(" and ")} mean in this unit, then answer in a full sentence.`
      : "Find the sentence in the lesson that explains this idea, then answer in your own words.";
    const applyHint = words.length >= 2
      ? `Decide which idea the situation is about — ${words.join(", ")} — then explain your reasoning step by step.`
      : "Work out which idea from this unit the situation is about, then explain your reasoning step by step.";
    // Everything before the first answer-key marker is tasks; everything
    // after is answer keys. This survives every naming variant in the packs.
    const firstKeyIndex = practice.blocks.findIndex((block) =>
      /^Answer Keys?\b/i.test(block.section) || /^Answer Keys?\b/i.test(tidy(block.text)));
    const taskBlocks = firstKeyIndex >= 0 ? practice.blocks.slice(0, firstKeyIndex) : practice.blocks;
    const keyBlocks = firstKeyIndex >= 0 ? practice.blocks.slice(firstKeyIndex) : [];
    const names = [...new Set(taskBlocks.map((block) => block.section))].filter((section) => /^Section\s+[A-E]\b/i.test(section));
    // Answer letters appear as "b)", "(b)", "B -", "1. (b)", "1: b", bare
    // table cells, or several answers combined in one block.
    const LETTER_RE = /^[^a-z0-9(]*(?:\d+\s*[).:\-]?\s*)?\(?([a-d])\)?(?:\b|\s|[).:—\-]|$)/i;
    const normalizeKeys = (rawKeys) => {
      if (rawKeys.length <= 2 && (rawKeys.join(" ").match(/\d+[.):]\s*\(?[a-d]\)?\b/gi) || []).length >= 5) {
        return rawKeys.join(" ").split(/(?=\b\d+[.):]\s*\(?[a-d]\)?\b)/i).map(tidy).filter((text) => /^\d+[.):]/.test(text));
      }
      return rawKeys;
    };
    const keysFor = (letter) => {
      const raw = keyBlocks.filter((block) => new RegExp(`\\bSection\\s+${letter}\\b`, "i").test(block.section) && block.content_kind !== "Heading");
      const tableCells = raw.filter((block) => block.block_type === "Table cell");
      if (tableCells.length > raw.length / 2) {
        // Rebuild answer rows from table cells (Q | answer | explanation),
        // starting a new row whenever the column resets.
        const rows = [];
        let current = null;
        let previousCol = 0;
        for (const cell of tableCells) {
          if (!current || cell.table_col <= previousCol) {
            current = [];
            rows.push(current);
          }
          current.push(tidy(cell.text));
          previousCol = cell.table_col;
        }
        const list = rows
          .map((cells) => cells.join(" "))
          .filter((text) => text.length > 1 && !/^(q|question|answer|why|explanation)\b/i.test(text));
        return normalizeKeys(list);
      }
      return normalizeKeys(raw.map((block) => tidy(block.text)).filter((text) => text.length > 1));
    };
    const levelFor = { A: "Warm-up", B: "Core", C: "Core", D: "Challenge", E: "Extension" };
    const items = [];
    let mcqs = [];
    let contradictions = 0;
    for (const section of names) {
      const letter = section.match(/^Section\s+([A-E])/i)[1].toUpperCase();
      const isInstruction = (text) => text.length < 110 && !/\(?[a-d]\)\s/i.test(text)
        && /^(choose|circle|tick|select|answer(\s+each|\s+in)|write|read\s+each|match|complete|label|draw|for the grown-up|try every|do not)/i.test(text);
      const tasks = taskBlocks
        .filter((block) => block.section === section && block.content_kind !== "Heading")
        .map((block) => tidy(block.text))
        .filter((text) => text.length > 15 && !isInstruction(text) && !ADULT_ADDRESSED.test(text));
      let keys = keysFor(letter);
      keys = letter === "A"
        ? keys.filter((key) => LETTER_RE.test(key))
        : keys.filter((key) => !/^(each answer|answers? (are|below)|explanations?$|why$|question$|q$)/i.test(key) && key.length > 8);
      tasks.forEach((prompt, index) => {
        const answer = keys[index] ? tidy(keys[index]) : "Work through the task, then check your answer against the Science Words reference card and the concept explanations for this unit.";
        const optionStart = prompt.search(/[\s:]\(?a\)\s/i);
        if (letter === "A" && optionStart > 5 && /\(?b\)\s/i.test(prompt)) {
          const stem = tidy(prompt.slice(0, optionStart + 1));
          const optionsPart = prompt.slice(optionStart + 1);
          const all = optionsPart.split(/\s*\(?[a-d]\)\s+/i).map(tidy).filter(Boolean).slice(0, 4);
          const keyText = keys[index] || "";
          const letterMatch = keyText.match(LETTER_RE);
          let answerText = "";
          if (letterMatch) answerText = all["abcd".indexOf(letterMatch[1].toLowerCase())] || "";
          const textMatch = all.find((option) => option.length > 3 && keyText.toLowerCase().includes(option.slice(0, 30).toLowerCase()));
          if (answerText && textMatch && textMatch !== answerText
              && !keyText.toLowerCase().includes(answerText.slice(0, 30).toLowerCase())) contradictions += 1;
          if (!answerText) answerText = textMatch || "";
          if (all.length >= 3 && answerText) mcqs.push({ question: stem, options: all, answer: answerText, explanation: sentence(keyText.replace(/^[^a-z0-9(]*(?:\d+\s*[).:\-]?\s*)?\(?[a-d]\)?\s*[).:—\-]*\s*/i, ""), 220) || `${answerText}.` });
        }
        items.push({
          id: `p${String(items.length + 1).padStart(2, "0")}`,
          level: levelFor[letter] || "Core",
          prompt,
          answer,
          hint: letter === "A" || letter === "B" ? recallHint : applyHint,
        });
      });
    }
    if (contradictions >= 3) mcqs = []; // Systematic key misalignment: fall back to safe vocabulary quizzes.
    if (!items.length && activitiesDoc.blocks.length) {
      activitiesDoc.blocks
        .filter((block) => block.content_kind === "Task" && !ADULT_ADDRESSED.test(block.text))
        .slice(0, 12)
        .forEach((block, index) => items.push({
          id: `p${String(index + 1).padStart(2, "0")}`,
          level: ["Warm-up", "Core", "Challenge", "Extension"][Math.floor(index / 3) % 4],
          prompt: tidy(block.text),
          answer: "Say your answer out loud in a full sentence, then check it against the concept explanations and the Science Words reference for this unit. Talk it through with a teacher, parent or study partner if someone is nearby.",
          hint: recallHint,
        }));
    }
    return { items, mcqs };
  }

  function assessmentData(mcqs, reference, unitNo) {
    // Fourth options for the one unit whose source offers three. Applied here,
    // before the vocabulary-derived padding below, which already builds four.
    const fourthOptions = QUIZ_FOURTH_OPTION[`${grade}-${unitNo}`] || {};
    const applied = new Set();
    const questions = mcqs.slice(0, 12).map((mcq, index) => {
      const options = [...new Set(mcq.options)].slice(0, 4);
      const stem = String(mcq.question || "").trim();
      const fourth = fourthOptions[stem];
      if (fourth && options.length === 3 && !options.includes(fourth)) {
        options.push(fourth);
        applied.add(stem);
      }
      return {
        id: `q${String(index + 1).padStart(2, "0")}`,
        type: index < 4 ? "Concept" : index < 8 ? "Application" : "Reasoning",
        outcomeId: `lo${String(index % 8 + 1).padStart(2, "0")}`,
        difficulty: index < 4 ? "Basic" : index < 9 ? "Core" : "Challenge",
        question: mcq.question,
        options,
        answer: mcq.answer,
        hint: `Use the Unit ${unitNo} Science Words reference.`,
        explanation: mcq.explanation,
      };
    });
    // A stale override means the option count has silently dropped back to
    // three, so refuse the build rather than ship the guess it restores. If the
    // source has since grown a fourth option of its own, delete the entry here.
    const unapplied = Object.keys(fourthOptions).filter((stem) => !applied.has(stem));
    if (unapplied.length) {
      throw new Error(`Grade ${grade} Unit ${unitNo}: QUIZ_FOURTH_OPTION matched no three-option question for ${unapplied.map((stem) => JSON.stringify(stem)).join(", ")}`);
    }
    const terms = reference.terms.length >= 4 ? reference.terms : [["Science", "Studying the world by observing and testing"], ["Observe", "Look carefully and notice details"], ["Predict", "Say what you think will happen"], ["Record", "Write or draw what you find"]];
    let index = questions.length;
    const seenQuestions = new Set(questions.map((q) => q.question));
    let attempts = 0;
    while (questions.length < 12 && attempts < 60) {
      attempts += 1;
      const entry = terms[index % terms.length];
      const reverse = index >= Math.min(terms.length, 6);
      const pool = terms.filter((item) => item !== entry).map((item) => reverse ? item[0] : item[1]);
      const answer = reverse ? entry[0] : entry[1];
      const distractors = [];
      for (let offset = 0; offset < pool.length && distractors.length < 3; offset += 1) {
        const candidate = pool[(index + offset) % pool.length];
        if (candidate !== answer && !distractors.includes(candidate)) distractors.push(candidate);
      }
      const options = [answer, ...distractors];
      while (options.length < 4) options.push(`Not this ${reverse ? "term" : "meaning"}`);
      const questionText = reverse ? `Which science word matches this meaning: ${entry[1]}?` : `What does “${entry[0]}” mean?`;
      index += 1;
      if (seenQuestions.has(questionText)) continue; // two terms sharing a meaning would repeat
      seenQuestions.add(questionText);
      questions.push({ id: `q${String(questions.length + 1).padStart(2, "0")}`, type: questions.length < 4 ? "Concept" : questions.length < 8 ? "Application" : "Reasoning", outcomeId: `lo${String(questions.length % 8 + 1).padStart(2, "0")}`, difficulty: questions.length < 4 ? "Basic" : questions.length < 9 ? "Core" : "Challenge", question: questionText, options: [...new Set(options)].slice(0, 4), answer, hint: `Use the Unit ${unitNo} Science Words reference.`, explanation: `${entry[0]} means ${entry[1]}.` });
    }
    return { passPercent: 80, questions };
  }

  function gameData(assessment, terms, unitNo) {
    const names = ["Quick Match", "Concept Quest", "Lab Detective", "Fact Runner", "Vocabulary Vault", "Challenge Cards", "Think Fast", "Explain It", "Real-Life Round", "Spot the Error", "Mastery Mix", "Unit Champion"];
    return names.map((name, index) => ({
      id: `u${unitNo}-game-${index + 1}`,
      icon: ["?", "★", "◫", "→", "Σ", "◇", "⚡", "☁", "⌂", "!", "≡", "T"][index],
      skill: terms[index % Math.max(1, terms.length)]?.[0] || `Unit ${unitNo} skill`,
      title: `${name}: ${terms[index % Math.max(1, terms.length)]?.[0] || "Science"}`,
      description: `Practise ${terms[index % Math.max(1, terms.length)]?.[0]?.toLowerCase() || "the unit ideas"} through four short challenges.`,
      type: "choice",
      rounds: Array.from({ length: 4 }, (_, round) => {
        const question = assessment.questions[(index + round * 3) % assessment.questions.length];
        return { prompt: question.question, choices: question.options, answer: question.answer, clue: question.hint, explanation: question.explanation };
      }),
    }));
  }

  const unitCount = source.units.length;
  const perTerm = Math.ceil(unitCount / 3);
  const termOf = (position) => Math.min(3, Math.floor(position / perTerm) + 1);

  function buildUnit(unitMeta, position) {
    const unitNo = unitMeta.unit;
    // Resolved here so an unpublished or duplicated code stops the build at the
    // unit that claims it, named, rather than at the end of the run.
    const unitObjectives = cambridgeObjectivesFor(grade, unitNo, cambridge.code);
    const term = termOf(position);
    const lesson = docFor(unitNo, "Lesson");
    const practiceDoc = docFor(unitNo, "Practice");
    const experimentsDoc = docFor(unitNo, "Experiments");
    const activitiesDoc = docFor(unitNo, "Activities");
    const referenceDoc = docFor(unitNo, "Reference");
    const title = unitTitle(lesson, unitMeta.title, unitNo);
    const override = grade === 1 ? GRADE1[unitNo] : null;
    // Targeted extras for units whose source lacks a connections section.
    const EXTRA_CONNECTIONS = {
      "2-3": [
        { area: "Cooking at home", text: "Cooking changes materials: eggs set, bread toasts, and ice melts in a warm drink." },
        { area: "Science skill", text: "Predict, test and record what happens when materials are heated or cooled." },
      ],
    };
    const reference = referenceData(referenceDoc, lesson, experimentsDoc);
    if (override && override.misconceptions) reference.commonMistakes = override.misconceptions.map((pair) => pair.slice());
    if (override && override.connections) reference.connections = override.connections.map((c) => ({ ...c }));
    if (EXTRA_CONNECTIONS[`${grade}-${unitNo}`] && !reference.connections.length) reference.connections = EXTRA_CONNECTIONS[`${grade}-${unitNo}`];
    if (override && override.vocabulary) {
      // Replace weak checklist-derived vocabulary with authored terms.
      reference.vocabulary = override.vocabulary.map(([term, meaning]) => ({ term, meaning, example: "", letter: (term[0] || "?").toUpperCase() }));
      reference.terms = override.vocabulary;
    }
    const experiments = experimentsData(experimentsDoc.blocks.length ? experimentsDoc : activitiesDoc);
    let { items: practice, mcqs: rawMcqs } = practiceData(practiceDoc, activitiesDoc, (reference.terms || []).map((pair) => pair[0]));
    // Authored practice replaces the extracted set outright where a unit has it.
    // Merging would keep the page furniture the extractor picked up, and there
    // is no answer to write for a horizontal rule or a table column heading.
    if (override && override.practice) {
      practice = override.practice.map((item, index) => ({
        id: `p${String(index + 1).padStart(2, "0")}`,
        level: item.level,
        prompt: item.prompt,
        answer: item.answer,
        hint: item.hint,
      }));
    }
    const mcqs = override && override.quiz ? override.quiz.map((entry) => ({ ...entry })) : rawMcqs;
    let concepts = conceptList(lesson, title);
    if (grade === 1 && GRADE1_CONCEPTS[unitNo]) {
      // Grade 1's source is a Teacher & Parent Guide, so its prose speaks to the
      // adult and cannot be shown to the child. Use the authored child-facing
      // text instead of the extracted blocks.
      concepts = GRADE1_CONCEPTS[unitNo].map((entry, index) => ({
        id: `concept-${index + 1}-${slug(entry.title)}`,
        title: entry.title,
        explanation: entry.explanation,
        example: entry.example,
      }));
    } else if (override && override.conceptTitles) {
      // Keep the source explanations but give each concept a clean, authored
      // title (used where a guide has no concept headings of its own).
      concepts = override.conceptTitles.map((ctitle, index) => {
        const srcExpl = concepts[index]?.explanation || "";
        const explanation = srcExpl.length >= 60 ? srcExpl : `${ctitle}. ${srcExpl} Explore this idea together by looking, doing and talking about what you notice.`.replace(/\s+/g, " ").trim();
        return {
          id: `concept-${index + 1}-${slug(ctitle)}`,
          title: ctitle,
          explanation,
          example: concepts[index]?.example || ctitle,
        };
      });
    }
    // Reviewer-authored titles for units whose source lacks concept headings
    // (keeps the objective-derived explanations, replaces the derived title).
    // Only for concepts the builder titled itself. Several of these units are
    // now matched by the numbered-heading rule, so they carry the book's own
    // headings — those beat a reviewer's guess and must not be overwritten.
    const titleOverride = CONCEPT_TITLE_OVERRIDES[`${grade}-${unitNo}`];
    if (titleOverride) {
      concepts = concepts.map((concept, index) => (titleOverride[index] && !concept.fromHeading
        ? { ...concept, id: `concept-${index + 1}-${slug(titleOverride[index])}`, title: titleOverride[index] }
        : concept));
    }
    concepts = concepts.map(({ fromHeading, ...concept }) => concept);
    // "Key ideas" is the unit's revision card — the thing a learner re-reads
    // before the quiz. Most reference books carry no explicit rules section, so
    // build it from the concepts themselves: each concept's title plus the
    // opening sentence of its explanation, which is where these books state the
    // idea before developing it.
    if (!reference.rules.length) {
      reference.rules = concepts.map((concept, index) => {
        const opening = String(concept.explanation).split("\n\n")[0];
        const firstSentence = (opening.match(/^.*?[.!?](?=\s|$)/) || [opening])[0];
        return { title: concept.title, text: tidy(firstSentence) };
      }).filter((rule) => rule.text.length > 20).slice(0, 6);
    }
    // A card whose body is only a heading teaches nothing — "How Plants Make
    // Food (Photosynthesis)" with no sentence under it. The source ran the
    // heading and its explanation as separate blocks and only the heading was
    // captured, so drop the card rather than show a learner an empty one.
    reference.rules = reference.rules
      .map((rule) => ({ ...rule, text: punctuateLeadHeading(rule.text) }))
      .filter((rule) => {
        const text = String(rule.text || "").trim();
        return /[.!?]/.test(text) || text.length > 90;
      });
    // Where the source has no heading for a key-idea card, the extractor can
    // only number it ("Key idea 1"), which tells a learner nothing about what
    // the card says. These titles were written from each card's own text.
    // Applied in order to the cards still carrying the placeholder, so a unit
    // that later gains a real heading from the source keeps it.
    const authoredTitles = RULE_TITLE_OVERRIDES[`${grade}-${unitNo}`];
    if (authoredTitles) {
      let next = 0;
      for (const rule of reference.rules) {
        if (!/^Key idea \d+$/.test(rule.title || "")) continue;
        if (next < authoredTitles.length) rule.title = authoredTitles[next];
        next += 1;
      }
    }
    let outcomes = (override && override.outcomes) ? override.outcomes.slice() : outcomeList(lesson);
    if (!outcomes.length) outcomes = concepts.map((concept) => `Explore and talk about ${concept.title.toLowerCase()}.`).slice(0, 6);
    const assessment = assessmentData(mcqs, reference, unitNo);
    // After assessmentData, which copies mcq.explanation across verbatim. The
    // stage capstone samples these same question objects, so it inherits the
    // repair rather than needing its own.
    tidyAnswerExplanations(assessment.questions, tidiedExplanations);
    // The first long paragraph is the unit's own introduction — except in
    // Grade 1, where it opens by briefing the adult ("In this unit your child
    // learns..."). Skip anything addressed to the adult; the overview is shown
    // to the learner and feeds the discovery screens too.
    // Safety notices are long enough to look like introduction prose, but they
    // are a checklist for whoever supervises, not a description of the unit.
    const SAFETY_NOTICE = /^\[Safety\]|safety first|please read/i;
    const overview = lesson.blocks
      .map((block) => tidy(block.text))
      .find((text, index) => index > 2 && text.length > 180
        && !ADULT_ADDRESSED.test(text) && !SAFETY_NOTICE.test(text))
      || GRADE1_OVERVIEWS[`${grade}-${unitNo}`]
      || `Explore ${title} through concepts, investigations, methods and real-life practice.`;

    const workedExamples = [];
    const weHeads = lesson.blocks.map((block, index) => ({ block, index })).filter(({ block }) => /^Worked Example/i.test(tidy(block.text)));
    for (const { block, index } of weHeads.slice(0, 12)) {
      const body = lesson.blocks.slice(index + 1, index + 6).map((item) => tidy(item.text)).filter((text) => text.length > 10);
      workedExamples.push({ id: `we${String(workedExamples.length + 1).padStart(2, "0")}`, outcomeId: `lo${String(workedExamples.length % 8 + 1).padStart(2, "0")}`, difficulty: "Intermediate", title: tidy(block.text).replace(/^Worked Examples?\s*[—:\-]?\s*/i, "") || `Worked example`, prompt: tidy(body[0] || title), solution: paragraphs(body.slice(1)) || tidy(body[0] || title) });
    }
    // Pad only with real practice items — skip source junk whose prompt is a
    // unit title / page marker or whose answer is the generic placeholder.
    const BOILERPLATE = /talk through your answer|my activity sheet|^[—\-\s]+$|^year \d|^unit \d|^being alive$/i;
    const realPractice = practice.filter((item) => (item.prompt || "").length > 18 && !BOILERPLATE.test(item.prompt || "") && (item.answer || "").length > 8 && !BOILERPLATE.test(item.answer || ""));
    let pi = 0;
    while (workedExamples.length < 8 && pi < realPractice.length) {
      const item = realPractice[pi]; pi += 1;
      const n = workedExamples.length + 1;
      workedExamples.push({ id: `we${String(n).padStart(2, "0")}`, outcomeId: `lo${String(workedExamples.length % 8 + 1).padStart(2, "0")}`, difficulty: workedExamples.length < 4 ? "Basic" : "Intermediate", title: `Guided example ${n}`, prompt: item.prompt, solution: item.answer });
    }
    // Still short? Build worked examples from the unit's own concepts — a real
    // question and a worked answer drawn from the concept's teaching text.
    // Skip parent-/teacher-facing prose (Grade 1 guides address the adult) and
    // give young learners a simple, child-facing worked answer instead.
    const PARENT_FACING = /\byour child\b|\bthis unit\b|you do not need|weeks?, doing|is 5 or 6|learning to read|as the adult|as a parent|teacher or parent/i;
    let ci = 0;
    while (workedExamples.length < 6 && ci < concepts.length) {
      const c = concepts[ci]; ci += 1;
      const n = workedExamples.length + 1;
      const cleanExpl = !PARENT_FACING.test(c.explanation) ? c.explanation : "";
      const solution = cleanExpl
        ? `${cleanExpl}${c.example && c.example !== c.title && !PARENT_FACING.test(c.example) ? `\n\nFor example: ${c.example}` : ""}`.trim()
        : `Look, point and talk about ${c.title.toLowerCase().replace(/\?$/, "")}. Say what you notice and give one example you can see around you.`;
      workedExamples.push({ id: `we${String(n).padStart(2, "0")}`, outcomeId: `lo${String(workedExamples.length % 8 + 1).padStart(2, "0")}`, difficulty: workedExamples.length < 3 ? "Basic" : "Intermediate", title: c.title, prompt: grade <= 1 ? `Look around you. Can you find an example of: ${c.title.replace(/\?$/, "")}?` : `Explain in your own words: ${c.title.replace(/\?$/, "")}.`, solution });
    }

    const methods = experiments.slice(0, 6).map((experiment, index) => ({
      id: `method-${index + 1}`,
      outcomeId: `lo${String(index % Math.max(1, outcomes.length) + 1).padStart(2, "0")}`,
      difficulty: index < 3 ? "Core" : "Challenge",
      title: experiment.title,
      // Falling back to the title made `example` a copy of `title` on 22 items,
      // so the card showed its own heading back as the worked example. Prefer
      // the aim, then the materials — either tells the learner something new.
      example: tidy(experiment.aim)
        || (experiment.materials ? `What you need: ${experiment.materials}` : "")
        || `Follow the steps below to carry out ${experiment.title.toLowerCase()}.`,
      steps: experiment.steps.length >= 3 ? experiment.steps.slice(0, 5) : [...experiment.steps, "Observe carefully and record what you see.", "Compare your result with your hypothesis."].slice(0, 5),
    }));
    while (methods.length < 4 && concepts.length) {
      const concept = concepts[methods.length % concepts.length];
      methods.push({ id: `method-${methods.length + 1}`, outcomeId: "lo01", difficulty: "Core", title: concept.title, example: concept.example, steps: ["Read the idea and put it in your own words.", "Find one example of it around your home.", "Explain it to someone using the key words."] });
    }

    const activities = experiments.slice(0, 6).map((experiment) => ({ title: experiment.title, materials: experiment.materials, steps: experiment.steps.length ? experiment.steps.slice(0, 5) : ["Follow the investigation plan in your experiments book."] }));
    activities.forEach((activity) => appendSafety(activity, grade));
    // Every unit shows six investigations. When the source has fewer, add
    // concept-grounded "explore at home" investigations to reach six.
    const investigationIdeas = [
      { verb: "Observe", tail: "Watch it closely for a few minutes and note three things you notice." },
      { verb: "Sort", tail: "Find examples at home and sort them into groups, then explain your rule." },
      { verb: "Test", tail: "Change one thing, keep everything else the same, and record what happens." },
      { verb: "Compare", tail: "Look at two examples side by side and list how they are the same and different." },
      { verb: "Model", tail: "Build or draw a model of it and label the important parts." },
      { verb: "Record", tail: "Make a simple chart or drawing to show what you found and share it." },
    ];
    let ideaCursor = 0;
    while (activities.length < 6) {
      const concept = concepts[activities.length % Math.max(1, concepts.length)] || { title, example: overview };
      const idea = investigationIdeas[ideaCursor % investigationIdeas.length];
      ideaCursor += 1;
      activities.push({
        title: `${idea.verb}: ${concept.title}`,
        // Name the unit's own kit where the source lists one, so the card is not
        // the same "notebook and pencil" line in all 53 units.
        materials: experiments[activities.length % Math.max(1, experiments.length)]?.materials
          || `Notebook and pencil, plus anything at home you can use to look closely at ${concept.title.toLowerCase()}`,
        steps: [
          `Look for an example of ${concept.title.toLowerCase()} around your home or outside.`,
          idea.tail,
          `Write or draw what you observed, using the words ${(reference.terms || []).slice(0, 2).map((pair) => pair[0]).filter(Boolean).join(" and ") || "from this unit"}.`,
          // Explaining aloud is the point of the step, so it must work with
          // nobody else in the room — a learner with no teacher still has to be
          // able to finish it.
          "Explain your finding out loud, as if you were teaching it. Say it to a family member or your teacher if someone is nearby, or explain it to yourself and check it against the concept explanations.",
        ],
      });
    }
    // Grade 1: give investigations clean authored names in order.
    if (override && override.experimentTitles) {
      activities.forEach((activity, index) => { if (override.experimentTitles[index]) activity.title = override.experimentTitles[index]; });
    }

    // The three reveal fields must each say something different, or the learner
    // reads the same sentence three times:
    //   context     — what this investigation is for   (the experiment's aim)
    //   answer      — what you should have found       (its analysis answers)
    //   explanation — the science behind it            (the matching concept)
    // They previously all derived from `aim`, so context and explanation came
    // out byte-identical on 194 of 227 items.
    const conceptFor = (index) => concepts[index % Math.max(1, concepts.length)];
    const scienceBehind = (index) => {
      const concept = conceptFor(index);
      const opening = String(concept?.explanation || overview).split("\n\n")[0];
      return concept?.title ? `${concept.title}: ${sentence(opening, 300)}` : sentence(opening, 320);
    };
    // A hint has to point at this unit's investigation. A single sentence
    // repeated across every grade ("Predict first, then observe, then explain")
    // teaches nothing and tells the learner nothing they did not already know.
    const glossaryWords = (reference.terms || []).map((pair) => pair[0]).filter(Boolean).slice(0, 3);
    const hintFor = (experiment) => {
      const step = (experiment.steps || []).find((text) => text.length > 30);
      if (step) return `Work through the method one step at a time. Start here: ${sentence(step, 150)}`;
      if (glossaryWords.length >= 2) return `Predict what will happen before you start, then observe carefully. Use these words when you explain: ${glossaryWords.join(", ")}.`;
      return `Predict what will happen in ${experiment.title.toLowerCase()}, test it, then compare what you saw with what you expected.`;
    };
    const explorations = experiments.slice(0, 6).map((experiment, index) => ({
      id: `explore-${index + 1}`,
      outcomeId: `lo${String(index % Math.max(1, outcomes.length) + 1).padStart(2, "0")}`,
      difficulty: index < 3 ? "Discover" : "Explore",
      title: experiment.title,
      // Year 1's activity sheets carry no per-investigation aim, so falling back
      // to the unit overview gave every card on the screen the same paragraph.
      // Say what *this* investigation is for instead.
      context: tidy(experiment.aim)
        || `In this investigation you will ${experiment.title.toLowerCase().replace(/^(watch|find|sort|draw|does)\b/i, (m) => m.toLowerCase())}. Set it up, look carefully, and record what you notice.`,
      prompt: experiment.hypothesis || experiment.analysis[0] || `What do you predict will happen in ${experiment.title}?`,
      answer: tidy(experiment.analysis.join(" ")) || `Carry out ${experiment.title.toLowerCase()}, record exactly what you observe, and compare it with the prediction you wrote before you started.`,
      modelType: `model-${index + 1}`,
      hint: hintFor(experiment),
      explanation: scienceBehind(index),
    }));
    while (explorations.length < 4 && practice.length) {
      const item = practice[(explorations.length * 2) % practice.length];
      const index = explorations.length;
      explorations.push({ id: `explore-${index + 1}`, outcomeId: "lo01", difficulty: "Explore", title: conceptFor(index)?.title || title, context: sentence(overview, 260), prompt: item.prompt, answer: item.answer, modelType: `model-${index + 1}`, hint: item.hint, explanation: scienceBehind(index) });
    }

    const visualModels = concepts.map((concept, index) => ({ id: `model-${index + 1}`, outcomeId: `lo${String(index % Math.max(1, outcomes.length) + 1).padStart(2, "0")}`, title: concept.title, modelType: `concept-model-${index + 1}`, purpose: sentence(String(concept.explanation).split("\n\n")[0], 220), defaultNumber: null }));

    const pool = practice.length ? practice : explorations.map((explore, index) => ({ id: `p${index}`, level: "Core", prompt: explore.prompt, answer: explore.answer, hint: explore.hint }));
    const realProblems = pool.filter((item) => item.level === "Challenge" || item.level === "Extension").slice(0, 6).map((item, index) => ({ id: `rp${String(index + 1).padStart(2, "0")}`, outcomeId: `lo${String(index % Math.max(1, outcomes.length) + 1).padStart(2, "0")}`, difficulty: index < 3 ? "Core" : "Challenge", context: ["Home", "Market", "Travel", "School", "Community", "Nature"][index], prompt: item.prompt, answer: item.answer, hint: item.hint, errorFeedback: `Check your reasoning against this: ${item.answer}` }));
    while (realProblems.length < 4 && pool.length) {
      const item = pool[(realProblems.length + 3) % pool.length];
      realProblems.push({ id: `rp${String(realProblems.length + 1).padStart(2, "0")}`, outcomeId: "lo01", difficulty: "Core", context: "Daily life", prompt: item.prompt, answer: item.answer, hint: item.hint, errorFeedback: `Check your reasoning against this: ${item.answer}` });
    }

    const reasoningPrompts = pool.filter((item) => item.level === "Core").slice(0, 6).map((item, index) => ({ id: `reason${String(index + 1).padStart(2, "0")}`, outcomeId: `lo${String(index % Math.max(1, outcomes.length) + 1).padStart(2, "0")}`, difficulty: index < 3 ? "Core" : "Challenge", responseMode: "text", prompt: item.prompt, keyIdeas: reference.terms.slice(index, index + 3).map((termPair) => termPair[0]), modelAnswer: item.answer }));
    while (reasoningPrompts.length < 4 && concepts.length) {
      const concept = concepts[reasoningPrompts.length % concepts.length];
      reasoningPrompts.push({ id: `reason${String(reasoningPrompts.length + 1).padStart(2, "0")}`, outcomeId: "lo01", difficulty: "Core", responseMode: "text", prompt: `Explain the key idea in ${concept.title}.`, keyIdeas: reference.terms.slice(0, 3).map((termPair) => termPair[0]), modelAnswer: concept.explanation });
    }

    return {
      schemaVersion: "Ehel Science Runtime v1.0",
      generatedAt: new Date().toISOString(),
      stage: { id: stageId, label: stageLabel }, subject: "Science",
      term: { id: `t0${term}`, label: `Term ${term}` },
      unit: { unitId: unitMeta.unit_id, unitNo, unitTitle: title, unitOverview: sentence(overview, 760), learningPath: ["Preview the goals and core ideas", "Explore concepts and investigations", "Learn methods and study worked examples", "Complete guided practice, experiments and games", "Apply, explain and complete the Unit Challenge"], reviewStatus: "Curriculum review required" },
      // Spread rather than mutated: one `cambridge` object is shared by every
      // unit in the grade, so assigning onto it would give all six the codes of
      // whichever unit was built last. objectiveCodes is the flat list the gate
      // reads (it treats every string under that key as a claimed code, so it
      // must hold codes and nothing else); objectives carries the same codes
      // with Cambridge's own wording resolved from the framework file.
      cambridge: unitObjectives
        ? {
          ...cambridge,
          objectiveCodes: unitObjectives.map((entry) => entry.code),
          objectives: unitObjectives,
          alignmentStatus: "Proposed from unit outcomes — Cambridge sign-off pending",
          ...(CAMBRIDGE_ALIGNMENT_NOTES[`${grade}-${unitNo}`] ? { alignmentNote: CAMBRIDGE_ALIGNMENT_NOTES[`${grade}-${unitNo}`] } : {}),
        }
        : cambridge,
      provenance: { contentPackage, framework: cambridgeLabel, sourceArchive: source.metadata.source_archive, sourceDocuments: [lesson, experimentsDoc, activitiesDoc, practiceDoc, referenceDoc].filter((doc) => doc !== EMPTY_DOC).map((doc) => doc.source_file), sourceBlockCount: unitMeta.source_block_count, transformation: `Structured from the ${cambridgeLabel} workbook source documents for screen presentation.`, reviewStatus: unitMeta.review_status },
      media: { lectureStatus: "Video pending", lectureVideo: null, poster: null },
      outcomes, concepts, explorations, visualModels, methods, workedExamples,
      practice: practice.slice(0, 12), activities, reference,
      fluency: pool.slice(0, 12).map((item, index) => ({ id: `fl${String(index + 1).padStart(2, "0")}`, outcomeId: `lo${String(index % Math.max(1, outcomes.length) + 1).padStart(2, "0")}`, difficulty: index < 4 ? "Round 1" : index < 8 ? "Round 2" : "Round 3", prompt: item.prompt, answer: item.answer, hint: item.hint, errorFeedback: item.answer })),
      realProblems, reasoningPrompts, assessment,
      games: { masteryScore: 3, games: gameData(assessment, reference.terms, unitNo) },
      selfAssessment: outcomes.slice(0, 8).map((outcome) => `I can ${outcome.charAt(0).toLowerCase()}${outcome.slice(1)}`),
    };
  }

  fs.mkdirSync(unitDir, { recursive: true });
  const warnings = [];
  const builtUnits = [];
  source.units.forEach((unitMeta, position) => {
    const runtime = buildUnit(unitMeta, position);
    // Reviewed prose wins over the generated text, and must land before the
    // capstone samples questions out of the unit assessments.
    applyScriptReview(runtime, grade, unitMeta.unit);
    // AFTER the review overlay, deliberately. The overlay replaces a reviewed
    // field wholesale, so an insert applied while the concepts were being built
    // was simply thrown away for any field a reviewer had touched — which is
    // exactly the case here, and it failed silently: the anchor matched the
    // pre-overlay text, so nothing threw, and the unit shipped claiming 8ESp.01
    // with the teaching absent. Running last makes the reviewer's prose the base
    // and checks the anchor against the text that actually ships.
    runtime.concepts = applyConceptInserts(grade, unitMeta.unit, runtime.concepts);
    builtUnits.push(runtime);
    for (const key of ["outcomes", "concepts", "practice", "workedExamples", "activities"]) {
      if (!runtime[key] || !runtime[key].length) warnings.push(`grade ${grade} unit ${unitMeta.unit}: empty ${key}`);
    }
    fs.writeFileSync(path.join(unitDir, `unit-${unitMeta.unit}.json`), `${JSON.stringify(runtime, null, 2)}\n`, "utf8");
  });

  // Sample each unit across the difficulty bands rather than taking the first
  // two questions. Unit assessments are ordered Basic → Core → Challenge, so
  // "first two" always produced an all-Basic capstone that never tested the
  // reasoning the unit spent most of its pages teaching.
  const capstoneQuestions = builtUnits.flatMap((unit) => {
    const questions = unit.assessment.questions;
    const picked = [];
    for (const band of ["Basic", "Core", "Challenge"]) {
      const next = questions.find((question) => question.difficulty === band && !picked.includes(question));
      if (next) picked.push(next);
    }
    // Top up from whatever is left if a unit does not use all three bands.
    for (const question of questions) {
      if (picked.length >= 3) break;
      if (!picked.includes(question)) picked.push(question);
    }
    return picked.map((question, index) => ({
      ...question,
      id: `cap-u${String(unit.unit.unitNo).padStart(2, "0")}-q${index + 1}`,
      unitNo: unit.unit.unitNo,
      unitTitle: unit.unit.unitTitle,
    }));
  });

  const manifest = {
    schemaVersion: "Ehel Science Course Manifest v2.0",
    stage: { id: stageId, label: stageLabel },
    subject: "Science",
    defaultUnit: source.units[0]?.unit || 1,
    sourcePackage: contentPackage,
    cambridgeFramework: cambridgeLabel,
    // Deliberately not "Approved": this rebuild carried the source prose across
    // in full and made the content self-teaching, but no curriculum reviewer has
    // signed it off. The banner the learner sees is driven by this string, so it
    // has to describe what actually happened.
    packageReviewStatus: "Rebuilt v2.0 - self-teaching content pass complete; curriculum review pending",
    units: source.units.map((unit, position) => ({
      number: unit.unit,
      id: unit.unit_id,
      termId: `t0${termOf(position)}`,
      title: builtUnits[position].unit.unitTitle,
      data: `./data/units/unit-${unit.unit}.json`,
      sourceDocumentCount: unit.source_document_count,
      implementationStatus: "Complete runtime package",
      reviewStatus: unit.review_status,
    })),
    // Mirrors the English manifest's finalAssessment block so every subject
    // advertises its end-of-course assessment the same way. For Science that
    // assessment is the stage capstone quiz.
    finalAssessment: {
      id: `sci-${stageId}-capstone-quiz-v2`,
      title: `${stageLabel} Science Capstone Quiz`,
      data: "./data/grade-capstone.json",
      placement: `After the ${stageLabel} capstone project`,
      questionCount: capstoneQuestions.length,
      passPercent: 80,
      reviewStatus: "Rebuilt v2.0 - curriculum review pending",
    },
    cambridgeCoverage: stageCoverage(grade, cambridge.code, builtUnits),
  };
  fs.writeFileSync(path.join(gradeDir, "data", "course-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  const termUnits = (term) => manifest.units.filter((unit) => unit.termId === `t0${term}`).map((unit) => unit.number);
  const allUnitNumbers = manifest.units.map((unit) => unit.number);
  const gradeCapstone = {
    schemaVersion: "Ehel Science Stage Capstone v1.0",
    stage: { id: stageId, label: stageLabel },
    title: `Run a ${stageLabel} Science Fair`,
    overview: `Bring together everything from ${stageLabel} Science to run a science fair that teaches visitors the most important ideas from this stage through real investigations.`,
    project: {
      drivingQuestion: `How can we use the science from ${stageLabel} to run an accurate, safe and exciting science fair for our school or community?`,
      finalProduct: "Create a science-fair plan with a live investigation, labelled displays, a safety checklist, a visitor survey with a data display, and a short explanation of your scientific decisions.",
      stages: [
        { id: "foundations", title: "1. Foundations display", units: termUnits(1), prompt: `Choose the two most important ideas from Units ${termUnits(1).join(", ")}. Build a display that teaches each idea with a model or diagram, an example and a check question.`, evidence: "Two labelled displays with models, examples and check questions" },
        { id: "investigation", title: "2. Live investigation", units: termUnits(2).length ? termUnits(2) : allUnitNumbers, prompt: `Pick one investigation from Units ${(termUnits(2).length ? termUnits(2) : allUnitNumbers).join(", ")} and run it live: state your hypothesis, follow the method, record results and explain your conclusion.`, evidence: "A completed investigation with hypothesis, method, results and conclusion" },
        { id: "connections", title: "3. Connections wall", units: termUnits(3).length ? termUnits(3) : allUnitNumbers, prompt: `Create a connections wall that links ideas from Units ${(termUnits(3).length ? termUnits(3) : allUnitNumbers).join(", ")} to everyday life, with at least three labelled connections.`, evidence: "A connections wall with three labelled links to daily life" },
        { id: "present", title: "4. Present and explain", units: allUnitNumbers, prompt: "Present your science fair. Explain at least three scientific choices, check that your conclusions match your evidence and identify one improvement you would make.", evidence: "Spoken, written or recorded scientific explanation" },
      ],
      evidenceChecklist: ["Two foundation displays with models", "A completed live investigation", "A safety checklist for every activity", "A connections wall with three links", "A survey with organised data display", "A scientific explanation and reflection"],
      rubric: [
        { criterion: "Scientific accuracy", secure: "Observations, measurements, models and conclusions are accurate and checked." },
        { criterion: "Investigation skills", secure: "Hypotheses, fair testing, recording and conclusions follow the scientific method." },
        { criterion: "Models and representations", secure: "Labels, diagrams, tables or charts make the science visible." },
        { criterion: "Reasoning and communication", secure: "Decisions are explained using appropriate science words and evidence." },
      ],
    },
    quiz: { passPercent: 80, questions: capstoneQuestions },
    reviewStatus: "Curriculum review required",
  };
  applyCapstoneReview(gradeCapstone, grade);
  fs.writeFileSync(path.join(gradeDir, "data", "grade-capstone.json"), `${JSON.stringify(gradeCapstone, null, 2)}\n`, "utf8");

  // Prerequisite unit: the placement exam is hand-authored, not generated, so
  // it lives outside the build-owned tree (science/data/placement/) and the
  // build carries a copy into grade-N/data — same pattern as script-review
  // overrides. Without this copy, the exam a rebuild found on disk would be
  // whatever the last build left there, and a cleaned tree would ship none.
  const placementSource = path.join(sciRoot, "data", "placement", `grade-${grade}.json`);
  if (fs.existsSync(placementSource)) {
    fs.copyFileSync(placementSource, path.join(gradeDir, "data", "placement-exam.json"));
  }

  const indexHtml = `<!doctype html>
<html lang="en" data-stage="${grade}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Opening ${stageLabel} Science</title></head>
<body><p>Opening the shared Science course…</p><script type="module" src="../shared/grade-redirect.js"></script></body>
</html>
`;
  fs.writeFileSync(path.join(gradeDir, "index.html"), indexHtml, "utf8");

  console.log(`grade ${grade}: ${manifest.units.length} units, capstone, manifest, index written.`);
  return warnings;
}

const allWarnings = [];
for (const grade of grades) allWarnings.push(...buildGrade(grade));
console.log(`\nReviewer corrections applied: ${reviewStats.applied}`);
if (tidiedExplanations.length) {
  console.log(`Restated-answer stutters removed from quiz explanations (${tidiedExplanations.length}) — `
    + `"texture. Texture is how a surface feels" opened by naming the option, then said it again.`);
}
if (reviewStats.missed.length) {
  console.log(`Review entries with no matching item (${reviewStats.missed.length}) — re-run tools/apply-ehel-science-script-review.py:`);
  for (const miss of reviewStats.missed) console.log(`  - ${miss}`);
}
if (allWarnings.length) {
  console.log(`\nWarnings (${allWarnings.length}):`);
  for (const warning of allWarnings) console.log(`  - ${warning}`);
} else {
  console.log("\nNo empty-section warnings.");
}
