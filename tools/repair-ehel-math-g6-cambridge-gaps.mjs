// Close the last five Cambridge Stage 6 objectives in Mathematics Grade 6.
//
// Grade 6 sat at 49/54 against cambridge-mathematics-0096.json. The five that
// were unclaimed are NOT one kind of gap, and treating them as one would have
// meant citing three objectives the course does not actually teach. Read the
// content before the codes, which is what this file records:
//
//   6Gg.03  area of right-angled triangles from knowledge of rectangles
//           FULLY TAUGHT, unit 7. concepts[2] "Area of Triangles" says it in
//           as many words - "connects triangles back to rectangles you already
//           understand ... any triangle has exactly half the area of a
//           rectangle with the same base and height" - plus an outcome, a
//           four-step method and practice with a hint. MAPPING ONLY.
//
//   6Nc.03  repeated addition -> multiplication, position-to-term rule
//           FULLY TAUGHT, unit 2. 53 matching strings: an outcome, the concept
//           "Position-to-Term (nth Term) Rules" with a worked table, and its
//           own exploration. MAPPING ONLY.
//
//   6Nc.01  count on and back in constant steps, including fractions and
//           decimals, AND extend beyond zero into negative numbers
//           SPLIT, WITH THE JOIN MISSING. Unit 2 counts in constant steps and
//           does it with decimals ("15, 14.6, 14.2 ... count back by 0.4"),
//           and never mentions a negative number - zero hits. Unit 4 teaches
//           negative numbers thoroughly - 85 hits, two outcomes - and never
//           counts in steps: zero hits for "count on", "count back", "in steps
//           of" or "sequence". So each half is taught well and the thing the
//           objective actually asks for, a constant step that CROSSES zero,
//           is taught nowhere. CONTENT ADDED.
//
//   6Sp.02  two events that cannot happen at the same time are called
//           'mutually exclusive'
//           APPLIED BUT NEVER NAMED. workedExamples[7] adds two probabilities
//           and justifies it with "because these choices cannot both be a
//           single student's favourite" - correct, and exactly the idea. The
//           phrase "mutually exclusive" appears nowhere in the unit, and the
//           objective's second half is explicitly that learners KNOW THE NAME.
//           CONTENT ADDED.
//
//   6Ss.04  interpret data, identify patterns WITHIN AND BETWEEN data sets,
//           discuss conclusions considering sources of variation, check
//           predictions
//           PARTIAL. Unit 15 interprets charts well - bar charts, pictograms,
//           line graphs, pie charts all have outcomes - and one activity step
//           asks for a conclusion. Comparing two data sets, sources of
//           variation, and checking a prediction against what happened are
//           absent. CONTENT ADDED.
//
// So two of the five were a citation away and three were not. A pass that had
// only added codes would have produced 54/54 and three objectives taught
// around - the failure this repo already has a worked example of in Intensive
// English, where 176/176 were cited and one had zero coverage of its subject.
//
// WHY THIS EDITS BUILT UNITS. mathematics/CLAUDE.md: about twenty
// repair-ehel-math-* tools edit the built units in place, none of that work is
// in the content model, and build:math refuses to run without --force for
// exactly that reason. This follows that pattern rather than inventing a new
// one.
//
//   node tools/repair-ehel-math-g6-cambridge-gaps.mjs [--write]
//
// Runs as a dry run unless --write is passed. Idempotent: every insert is
// keyed and skipped if already present.

import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const UNITS = path.resolve(HERE, "..", "src", "prototypes", "ehel-academy",
  "mathematics", "grade-6", "data", "units");
const FRAMEWORK = path.resolve(HERE, "..", "src", "curriculum",
  "cambridge-mathematics-0096.json");
const WRITE = process.argv.includes("--write");

// ---- the framework's own text, so a mapping cannot quote a paraphrase
const fw = {};
(function walk(o) {
  if (!o || typeof o !== "object") return;
  if (Array.isArray(o)) return o.forEach(walk);
  if (o.code && /^[1-9][A-Z][a-z]{1,2}\.\d{2}$/.test(o.code)) fw[o.code] = o.text || o.statement || "";
  Object.values(o).forEach(walk);
})(JSON.parse(fs.readFileSync(FRAMEWORK, "utf8")));

const MAP = [
  { unit: "unit-7.json", code: "6Gg.03" },
  { unit: "unit-2.json", code: "6Nc.03" },
  { unit: "unit-2.json", code: "6Nc.01" },
  { unit: "unit-9.json", code: "6Sp.02" },
  { unit: "unit-15.json", code: "6Ss.04" },
];

// ---- the content, per unit. Each entry is keyed so a second run skips it.
const CONTENT = {
  "unit-2.json": {
    outcomes: [
      "Count on and back in constant steps that cross zero, and say which term of a sequence first becomes negative.",
    ],
    concepts: [{
      id: "concept-7-counting-through-zero",
      title: "Counting Back Through Zero",
      explanation:
        "A constant step does not stop at zero. Take 12, 9, 6, 3, 0 … the term-to-term rule is " +
        "subtract 3, and there is no reason for it to halt: the next terms are -3, -6, -9. The rule " +
        "is doing the same thing on both sides of zero, and the number line is the picture that " +
        "makes that obvious - each step is the same distance to the left, whether it lands on a " +
        "positive number, on zero, or past it. A temperature falling 3 degrees an hour from 12 " +
        "degrees behaves exactly this way, which is why the winter forecast can read -6.",
      example:
        "Start at 7 and count back in steps of 4: 7, 3, -1, -5, -9. The third term is the first " +
        "negative one. To find which term first goes below zero without listing them all, ask how " +
        "many whole steps of 4 fit into 7: one step reaches 3, two steps reach -1, so it is the " +
        "third term. The same works with decimals. Start at 1.2 and count back in steps of 0.5: " +
        "1.2, 0.7, 0.2, -0.3, -0.8. And with fractions: start at 1 and count back in steps of one " +
        "third and you get 1, two thirds, one third, 0, minus one third.",
    }],
    referenceRules: [{
      title: "Steps Do Not Stop At Zero",
      text: "A term-to-term rule keeps working past zero. Counting back in steps of 3 from 6 gives " +
            "6, 3, 0, -3, -6: the step is the same size every time, and zero is just another term.",
    }],
    referenceTerms: [
      ["Negative term", "A term of a sequence that is less than zero, reached by counting back past zero"],
    ],
  },
  "unit-9.json": {
    outcomes: [
      "Identify when two events can happen at the same time and when they cannot, and use the term 'mutually exclusive' for the second kind.",
    ],
    concepts: [{
      id: "concept-7-mutually-exclusive-events",
      title: "Events That Cannot Both Happen",
      explanation:
        "Some pairs of events can happen together and some cannot. Roll one die: 'the score is " +
        "even' and 'the score is 6' can both be true at once, because 6 is even. But 'the score is " +
        "even' and 'the score is 5' cannot both be true on the same roll - one outcome cannot be " +
        "two things at once. A pair of events that cannot both happen is called MUTUALLY EXCLUSIVE. " +
        "The name is worth knowing because it tells you when you are allowed to add probabilities: " +
        "for mutually exclusive events you may add them, and for events that can overlap you may " +
        "not, because anything counted in both would be counted twice.",
      example:
        "Drawing one card from a bag of red, blue and green counters: 'it is red' and 'it is blue' " +
        "are mutually exclusive, so P(red or blue) = P(red) + P(blue). Now take a class survey where " +
        "pupils may choose more than one hobby: 'plays football' and 'plays chess' are NOT mutually " +
        "exclusive, because somebody can do both, and adding the two fractions would count those " +
        "pupils twice. Ask first whether one thing can be both, then decide whether to add.",
    }],
    referenceRules: [{
      title: "Mutually Exclusive Rule",
      text: "Two events are mutually exclusive when they cannot both happen at the same time. Only " +
            "then may their probabilities be added.",
    }],
    referenceTerms: [
      ["Mutually exclusive", "Describes two events that cannot both happen at the same time, such as rolling a 5 and rolling an even number"],
    ],
  },
  "unit-15.json": {
    outcomes: [
      "Compare two data sets, describe a pattern within each and between them, and say what could explain the difference.",
      "Check a prediction against the data actually collected, and explain why they differ.",
    ],
    concepts: [{
      id: "concept-7-comparing-data-sets",
      title: "Patterns Within and Between Data Sets",
      explanation:
        "One data set tells you about one group. Two let you compare, and comparison is where most " +
        "real statistical questions live: did the taller plants get more water, is Tuesday busier " +
        "than Saturday, do Class A and Class B travel to school differently. Look for a pattern " +
        "inside each set first - where the values bunch, where they spread - and only then look " +
        "across them. And when the two differ, the honest next question is WHY they might, which " +
        "means thinking about the sources of variation: how the data was collected, how many people " +
        "were asked, when it was measured, and what else was different between the groups.",
      example:
        "Class A and Class B both record their journey times. Class A's median is 12 minutes and " +
        "Class B's is 20. That is a pattern between the sets. Before concluding that Class B lives " +
        "further away, ask what else could produce it: Class B may have been asked on a day when " +
        "the bus was late, or one class may include several pupils who live on the school site and " +
        "pull the median down. A difference in the data is a question to investigate, not an answer " +
        "on its own.",
    }],
    referenceRules: [{
      title: "Check The Prediction",
      text: "After collecting data, compare what happened with what you predicted. If they disagree, " +
            "say so and suggest why - the prediction being wrong is a finding, not a mistake.",
    }],
    referenceTerms: [
      ["Sources of variation", "The things that could make two data sets differ apart from the one you are studying: who was asked, how many, and when"],
    ],
  },
};

let changed = 0, skipped = 0;
const report = [];

for (const file of [...new Set([...MAP.map((m) => m.unit), ...Object.keys(CONTENT)])].sort()) {
  const p = path.join(UNITS, file);
  const raw = fs.readFileSync(p, "utf8");
  const j = JSON.parse(raw);
  const lines = [];

  // ---- content first
  const c = CONTENT[file];
  if (c) {
    for (const o of c.outcomes || []) {
      if (j.outcomes.includes(o)) { skipped++; continue; }
      j.outcomes.push(o); changed++; lines.push("outcome  + " + o.slice(0, 74));
    }
    for (const k of c.concepts || []) {
      if (j.concepts.some((x) => x.id === k.id)) { skipped++; continue; }
      j.concepts.push(k); changed++; lines.push("concept  + " + k.title);
    }
    for (const r of c.referenceRules || []) {
      j.reference.rules = j.reference.rules || [];
      if (j.reference.rules.some((x) => x.title === r.title)) { skipped++; continue; }
      j.reference.rules.push(r); changed++; lines.push("rule     + " + r.title);
    }
    for (const t of c.referenceTerms || []) {
      j.reference.terms = j.reference.terms || [];
      if (j.reference.terms.some((x) => x[0] === t[0])) { skipped++; continue; }
      j.reference.terms.push(t); changed++; lines.push("term     + " + t[0]);
    }
  }

  // ---- then the codes, quoting the framework verbatim
  for (const m of MAP.filter((x) => x.unit === file)) {
    if (!fw[m.code]) { console.error("  REFUSED: " + m.code + " is not in 0096"); process.exit(1); }
    if (j.cambridge.objectives.some((o) => o.code === m.code)) { skipped++; continue; }
    j.cambridge.objectives.push({ code: m.code, text: fw[m.code] });
    changed++; lines.push("OBJECTIVE+ " + m.code);
  }

  if (!lines.length) continue;
  report.push("  " + file.padEnd(14) + lines.join("\n                 "));
  if (WRITE) fs.writeFileSync(p, JSON.stringify(j, null, 2) + "\n", "utf8");
}

console.log(report.join("\n"));
console.log("\n  " + changed + " addition(s), " + skipped + " already present"
  + (WRITE ? ", written" : "   (--write to apply)"));
