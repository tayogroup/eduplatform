// Regression tests for the write-back merge in tools/generate-ehel-english-audio.js.
//
// The generator reads every unit JSON up front, spends minutes narrating, then
// writes the files back. It used to write the whole in-memory snapshot, so any
// edit made to a unit during that window was silently erased -- that is how 48
// Grade 8 grammar descriptors lost their repoint on 2026-08-01. writeMerged()
// re-reads the file and lays down only the leaves the run actually changed.
//
// Run: npm run test:tools

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { changedLeaves, setPath, writeMerged } = require("../../tools/generate-ehel-english-audio.js");

const UNIT = {
  grammar: [
    { grammarId: "g1", audio: { source: "./a/g1-20260725.mp3", available: false } },
    { grammarId: "g2", audio: { source: "./a/g2-20260725.mp3", available: false } },
  ],
  readings: [{ readingId: "r1", audio: { source: "./a/r1.mp3", available: false } }],
  reviewStatus: "Approved v1.2",
};

let tmpdir;
const unitFile = () => {
  tmpdir = tmpdir || fs.mkdtempSync(path.join(os.tmpdir(), "ehel-merge-"));
  const file = path.join(tmpdir, `unit-${fs.readdirSync(tmpdir).length}.json`);
  fs.writeFileSync(file, `${JSON.stringify(UNIT, null, 2)}\n`);
  return file;
};
const read = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const snapshots = (file) => {
  const text = fs.readFileSync(file, "utf8");
  return { pristine: JSON.parse(text), mutated: JSON.parse(text) };
};

test.after(() => { if (tmpdir) fs.rmSync(tmpdir, { recursive: true, force: true }); });

test("a concurrent edit survives the run's write-back", () => {
  const file = unitFile();
  const { pristine, mutated } = snapshots(file);

  // the run narrates r1 and updates only that descriptor
  mutated.readings[0].audio = { source: "./a/r1.mp3", available: true, provider: "ElevenLabs" };

  // meanwhile something else repoints grammar to the undated clips
  const concurrent = read(file);
  concurrent.grammar[0].audio = { source: "./a/g1.mp3", available: true };
  concurrent.grammar[1].audio = { source: "./a/g2.mp3", available: true };
  fs.writeFileSync(file, `${JSON.stringify(concurrent, null, 2)}\n`);

  const result = writeMerged(file, pristine, mutated);
  const after = read(file);

  assert.equal(after.grammar[0].audio.source, "./a/g1.mp3", "concurrent repoint was clobbered");
  assert.equal(after.grammar[1].audio.available, true, "concurrent availability flip was clobbered");
  assert.equal(after.readings[0].audio.available, true, "the run's own change was lost");
  assert.equal(after.readings[0].audio.provider, "ElevenLabs");
  assert.equal(after.reviewStatus, "Approved v1.2", "an untouched field was disturbed");
  assert.equal(result.rebased, true, "a rebase onto a changed file should be reported");
});

test("without a concurrent edit the write behaves as before", () => {
  const file = unitFile();
  const { pristine, mutated } = snapshots(file);
  mutated.readings[0].audio.available = true;

  const result = writeMerged(file, pristine, mutated);
  const after = read(file);

  assert.equal(after.readings[0].audio.available, true);
  assert.equal(result.rebased, false, "an untouched file should not report a rebase");
  assert.equal(after.grammar[0].audio.source, "./a/g1-20260725.mp3", "fields the run never touched must not move");
});

test("a run that changed nothing does not rewrite the file", () => {
  const file = unitFile();
  const before = fs.readFileSync(file, "utf8");
  const { pristine, mutated } = snapshots(file);

  const result = writeMerged(file, pristine, mutated);

  assert.equal(result.written, false);
  assert.equal(fs.readFileSync(file, "utf8"), before);
});

test("a resized array is carried across whole", () => {
  const file = unitFile();
  const { pristine, mutated } = snapshots(file);
  mutated.grammar.push({ grammarId: "g3", audio: { source: "./a/g3.mp3", available: true } });

  writeMerged(file, pristine, mutated);
  const after = read(file);

  assert.equal(after.grammar.length, 3);
  assert.equal(after.grammar[2].grammarId, "g3");
});

test("a descriptor added by the run reaches a file that lacks it", () => {
  const file = unitFile();
  const { pristine, mutated } = snapshots(file);
  mutated.readings[0].audio.cueStart = 1.5;

  const concurrent = read(file);
  concurrent.reviewStatus = "Needs re-review";
  fs.writeFileSync(file, `${JSON.stringify(concurrent, null, 2)}\n`);

  writeMerged(file, pristine, mutated);
  const after = read(file);

  assert.equal(after.readings[0].audio.cueStart, 1.5, "a newly added key was dropped");
  assert.equal(after.reviewStatus, "Needs re-review", "the concurrent edit was clobbered");
});

test("changedLeaves reports only what the run touched", () => {
  const pristine = JSON.parse(JSON.stringify(UNIT));
  const mutated = JSON.parse(JSON.stringify(UNIT));
  mutated.grammar[1].audio.available = true;

  const changes = changedLeaves(pristine, mutated);

  assert.equal(changes.length, 1);
  assert.deepEqual(changes[0][0], ["grammar", 1, "audio", "available"]);
  assert.equal(changes[0][1], true);
});

test("setPath creates missing containers on the way down", () => {
  const target = {};
  assert.equal(setPath(target, ["audio", "source"], "./a/x.mp3"), true);
  assert.equal(target.audio.source, "./a/x.mp3");

  const withArray = {};
  setPath(withArray, ["grammar", 0], { grammarId: "g1" });
  assert.ok(Array.isArray(withArray.grammar), "a numeric next key should create an array");
  assert.equal(withArray.grammar[0].grammarId, "g1");
});

test("the JSON on disk stays valid and 2-space indented", () => {
  const file = unitFile();
  const { pristine, mutated } = snapshots(file);
  mutated.readings[0].audio.available = true;

  writeMerged(file, pristine, mutated);
  const text = fs.readFileSync(file, "utf8");

  assert.doesNotThrow(() => JSON.parse(text));
  assert.ok(text.endsWith("\n"), "file should end with a newline");
  assert.match(text, /\n {2}"grammar":/, "indentation should stay at 2 spaces");
});
