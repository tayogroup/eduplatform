"use strict";

// The one definition of what the English Story Library holds, shared by the
// builder (tools/build-english-story-library.mjs) and the gate
// (tools/check-english-story-library.mjs). Two copies would eventually
// disagree, and the gate's whole job is to prove the committed file still
// matches the units it was derived from — a gate deriving it differently would
// pass having compared the wrong thing.
//
// What the library is: Grades 5-8 already carry 38 original short stories
// (~40,600 words), every one narrated, but each is split into 2-3 "parts"
// buried inside one unit's Reading section. This index gathers each story back
// into one entry so the app can shelve it whole. It copies the text rather than
// pointing at it — a unit file is ~250 KB and a grade has ten of them, so the
// alternative is 2.5 MB to open a shelf. The gate is what keeps the copy honest.

// Fiction, and only fiction. The shelf is a STORY library: the information
// texts, recipes, interviews and persuasive pieces beside these stories are
// unit teaching material, not something a learner curls up with.
//
// Poems, playscripts and film scripts are deliberately NOT here. Grade 5 has
// four of them and every one exists to demonstrate a text FORM — "The Forest
// Guardians" is printed twice in Unit 9, once as a play script and once as the
// same scene as a film script, which is a lesson about adaptation and reads as
// a duplicate on a shelf.
const FICTION_GENRES = new Set([
  "Narrative",
  "Adventure narrative",
  "Realistic fiction",
  "Realistic science fiction",
  "Fable",
  "Legend",
]);

// Listed rather than defaulted, so an unrecognised genre STOPS the build
// instead of being silently shelved or silently dropped. A new text form is a
// decision for a person; the failure mode of guessing is a shelf that quietly
// gains an information text, or quietly loses a story, and nothing says so.
const NON_FICTION_GENRES = new Set([
  "Information text",
  "Narrative information text",
  "Dialogue",
  "Interview",
  "Interview dialogue",
  "Procedural text",
  "Recount",
  "Persuasive text",
  "Reflective writing",
  "Rhyming poetry",
  "Haiku",
  "Playscript",
  "Film script",
]);

const LIBRARY_GRADES = [5, 6, 7, 8];
const SCHEMA_VERSION = "1.0";

const REVIEW_PREFIX = /^Review text\s*\d+\s*:\s*/i;
// Two title forms, and the second one is a single unit's: Grade 8 Unit 9 writes
// "The Curtain Never Lies, Part 1: The Competition" where every other story in
// four grades writes "The Memory Wall, part 1". Requiring the part number to
// END the title split that story into three one-part books on the shelf.
//
// The base title is matched lazily so a colon EARLIER in the title survives —
// "Nookwatch: The Forest Mission, part 1" and "Code Name: Bonanza, part 1" both
// keep their own colons and take no subtitle. `part` must be followed by a
// digit, so a title like "Part of the Deal" is never mistaken for an instalment.
const PART_SUFFIX = /^(.*?)\s*[,:]?\s*part\s*(\d+)\s*(?::\s*(.+))?$/i;

const collapse = (value) => String(value || "").replace(/\s+/g, " ").trim();
const wordCount = (value) => collapse(value).split(" ").filter(Boolean).length;

// A reading's place in the library, or null if it has none.
//
// Unit 10 is the reason this is more than a genre test. It reprints five texts
// as "Review text N: …", and the two shapes mean opposite things:
//
//  - WITH a part suffix it is a real instalment. Three of Grade 5's five are
//    byte-identical reprints of a part already in the source unit, but two —
//    "The Silence After the Rumble, part 3" and "The Cracked Charter, part 3" —
//    exist ONLY here. Those stories are two parts long in their own unit and
//    genuinely finish in the review unit; dropping every review text would
//    shelve two stories without their endings.
//  - WITHOUT one it is an abridged re-read of a whole text (Grade 7 prints
//    "The Hero of Kitale (Unit 2)" at 503 words against the original's 1,193).
//    That is a revision exercise, not a book.
function classifyReading(reading, unitNumber) {
  const genre = collapse(reading.genre);
  if (!genre) return { skip: true, reason: "no genre" };
  if (NON_FICTION_GENRES.has(genre)) return { skip: true, reason: "not fiction" };
  if (!FICTION_GENRES.has(genre)) {
    return { unknownGenre: genre };
  }
  const rawTitle = collapse(reading.title);
  const fromReview = REVIEW_PREFIX.test(rawTitle);
  const title = rawTitle.replace(REVIEW_PREFIX, "");
  const parted = title.match(PART_SUFFIX);
  if (fromReview && !parted) return { skip: true, reason: "review re-read" };
  return {
    storyTitle: parted ? collapse(parted[1]) : title,
    part: parted ? Number(parted[2]) : 1,
    subtitle: parted && parted[3] ? collapse(parted[3]) : undefined,
    unitNumber,
    fromReview,
  };
}

// units: [{ number, title, data }] in ascending unit order, `data` being the
// parsed unit-N.json. Returns { stories, problems } — problems are fatal and
// are reported by the caller, never worked around here.
function buildLibrary(grade, units) {
  const problems = [];
  const byTitle = new Map();

  for (const { number, data } of units) {
    for (const reading of data.readings || []) {
      const placed = classifyReading(reading, number);
      if (placed.unknownGenre) {
        problems.push(`grade ${grade} unit ${number}: unrecognised genre "${placed.unknownGenre}" on "${collapse(reading.title)}" — add it to FICTION_GENRES or NON_FICTION_GENRES in tools/lib/english-story-library.js`);
        continue;
      }
      if (placed.skip) continue;
      if (!collapse(reading.passageScript)) {
        problems.push(`grade ${grade} unit ${number}: "${collapse(reading.title)}" is fiction with an empty passageScript`);
        continue;
      }
      if (!byTitle.has(placed.storyTitle)) {
        byTitle.set(placed.storyTitle, { title: placed.storyTitle, parts: new Map() });
      }
      const story = byTitle.get(placed.storyTitle);
      const existing = story.parts.get(placed.part);
      if (existing) {
        // Units are walked in ascending order, so `existing` is always the
        // earlier unit and is the one kept. A reprint that DIFFERS is not a
        // reprint — one of the two is stale, and picking either silently would
        // ship a story whose middle does not join up.
        if (collapse(existing.reading.passageScript) !== collapse(reading.passageScript)) {
          problems.push(`grade ${grade}: "${placed.storyTitle}" part ${placed.part} appears in unit ${existing.unitNumber} and unit ${number} with different text — one of them is stale`);
        }
        continue;
      }
      story.parts.set(placed.part, { reading, unitNumber: number, fromReview: placed.fromReview, subtitle: placed.subtitle });
    }
  }

  const stories = [];
  for (const story of byTitle.values()) {
    const parts = [...story.parts.entries()].sort((a, b) => a[0] - b[0]);
    const numbers = parts.map(([part]) => part);
    // A story missing part 2 would read as a jump cut with nothing on the page
    // to say so. Gaps are a content defect, not something to paper over.
    const expected = numbers.map((_, index) => index + 1);
    if (numbers.join(",") !== expected.join(",")) {
      problems.push(`grade ${grade}: "${story.title}" has parts ${numbers.join(", ")} — expected a run from 1`);
    }
    const home = parts[0][1];
    const homeUnit = units.find((unit) => unit.number === home.unitNumber);
    const first = home.reading;
    stories.push({
      storyId: `${collapse(first.unitId).slice(0, 7) || `eng-g${String(grade).padStart(2, "0")}`}-story-${slug(story.title)}`,
      title: story.title,
      genre: collapse(first.genre),
      theme: collapse(first.theme) || undefined,
      setting: collapse(first.setting) || undefined,
      unitNumber: home.unitNumber,
      unitTitle: collapse(homeUnit?.data?.unit?.unitTitle) || `Unit ${home.unitNumber}`,
      // No cover image, deliberately. The obvious candidate is the home unit's
      // own artwork, and it is wrong here: english/assets holds ONE set of nine
      // primary-school illustrations that every grade reuses, so Grade 8's
      // story about a school production would be shelved under
      // "unit-3-ready-steady-go.png". The reader draws a typographic cover
      // instead, which is honest about there being no artwork for these
      // stories yet. Real covers are a commission, not a field.
      words: parts.reduce((sum, [, entry]) => sum + wordCount(entry.reading.passageScript), 0),
      parts: parts.map(([part, entry]) => ({
        part,
        // Only Grade 8 Unit 9 names its parts; everywhere else the reader
        // labels them "Part 1", "Part 2" itself.
        subtitle: entry.subtitle,
        readingId: entry.reading.readingId,
        unitNumber: entry.unitNumber,
        // True only for the two Grade 5 endings that live in the review unit.
        // The app needs it: those parts unlock with Unit 10, not with the unit
        // the rest of the story is in.
        fromReviewUnit: entry.fromReview || undefined,
        words: wordCount(entry.reading.passageScript),
        passageScript: entry.reading.passageScript,
        audio: entry.reading.audio && entry.reading.audio.available
          ? { source: entry.reading.audio.source, available: true }
          : undefined,
      })),
    });
  }

  stories.sort((a, b) => a.unitNumber - b.unitNumber || a.title.localeCompare(b.title));

  const seen = new Set();
  for (const story of stories) {
    if (seen.has(story.storyId)) problems.push(`grade ${grade}: duplicate storyId ${story.storyId}`);
    seen.add(story.storyId);
  }

  return {
    // No generatedAt. This file is committed and rebuilt often; a timestamp
    // would make every rebuild a diff and hide the one line that actually
    // changed, which is the only reason to look at it.
    library: { schemaVersion: SCHEMA_VERSION, grade, storyCount: stories.length, stories },
    problems,
  };
}

function slug(title) {
  return String(title)
    .toLowerCase()
    .replace(/[’'"“”]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

module.exports = { LIBRARY_GRADES, SCHEMA_VERSION, FICTION_GENRES, NON_FICTION_GENRES, buildLibrary, wordCount };
