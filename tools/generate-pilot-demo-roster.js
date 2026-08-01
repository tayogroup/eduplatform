// Populates cohorts.json member[] arrays with DEMO pilot students.
//
// Demo-safety conventions (so these can never be confused with real people or
// leak email): username prefix `ehel-pilot-`, email domain `ehel.example.com`
// (RFC 2606 reserved — never routable). Deterministic (index-based, no RNG) so
// re-running produces the identical roster and stays idempotent.
//
//   node tools/generate-pilot-demo-roster.js [--per 4]
//
// Companion: create_pilot_accounts.php creates the matching Moodle users, then
// the local_prequran cohort-sync task links them (it never creates accounts).

const fs = require("fs");
const path = require("path");

const EHEL = path.resolve(__dirname, "..", "src", "prototypes", "ehel-academy");
const FILE = path.join(EHEL, "cohorts.json");
const arg = (name, dflt) => {
  const i = process.argv.indexOf(name);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : dflt;
};
const PER = Math.max(1, parseInt(arg("--per", "4"), 10));

// Fictional given-name pool (diverse, obviously demo in context of the fake
// email domain). Surnames pair by a fixed offset so names vary across stages.
const GIVEN = [
  "Amina", "Deqa", "Yusuf", "Layla", "Omar", "Hana", "Ibrahim", "Sara",
  "Kaltun", "Bilal", "Nadia", "Faisal", "Iman", "Zakaria", "Sumaya", "Idris",
  "Ayaan", "Ruweyda", "Suleiman", "Hodan", "Tariq", "Maryan", "Yasin", "Fatima",
  "Abdi", "Sahra", "Khalid", "Ubah", "Mohamed", "Asli", "Warsame", "Naima",
];
const SURNAME = [
  "Demo", "Sample", "Test", "Pilot", "Trial", "Example", "Mock", "Proto",
];

const roster = JSON.parse(fs.readFileSync(FILE, "utf8"));
const pad2 = (n) => String(n).padStart(2, "0");

// Adult intake cohorts are keyed by CEFR level + intake month and carry no
// `grade`. Keying off grade alone produced usernames like `ehel-pilot-sundefined-01`
// with firstname/lastname dropped by JSON.stringify, so the two shapes are
// built separately.
const isAdult = (c) => typeof c.intake === "string" && Number.isInteger(c.cefrLevel);

const DEMO_DOMAIN = "ehel.example.com";
const isDemo = (m) => typeof m.email === "string" && m.email.endsWith(`@${DEMO_DOMAIN}`);

// This tool replaces a roster outright. That is fine for demo members, but a
// cohort holding hand-authored real learners must not be silently destroyed by
// a demo seeder, so those are skipped unless --force says otherwise.
const FORCE = process.argv.includes("--force");
const kept = [];

let total = 0;
for (const cohort of roster.cohorts) {
  const current = cohort.members || [];
  if (current.length && !current.every(isDemo) && !FORCE) {
    kept.push(`${cohort.idnumber} (${current.length} member(s))`);
    continue;
  }

  const members = [];
  for (let n = 1; n <= PER; n++) {
    const nn = pad2(n);
    if (isAdult(cohort)) {
      const lvl = cohort.cefrLevel;
      const compact = cohort.intake.replace("-", "");
      // Seeded from level + intake, so names stay put when another intake opens.
      const idx = Number(compact) + lvl + (n - 1);
      const username = `ehel-intensive-l${pad2(lvl)}-${compact}-${nn}`;
      members.push({
        username,
        firstname: GIVEN[idx % GIVEN.length],
        lastname: `${SURNAME[(lvl + n) % SURNAME.length]} (L${lvl})`,
        email: `${username}@${DEMO_DOMAIN}`,
      });
    } else {
      const g = cohort.grade;
      const idx = (g - 1) * PER + (n - 1); // global running index → stable names
      const username = `ehel-pilot-s${g}-${nn}`;
      members.push({
        username,
        firstname: GIVEN[idx % GIVEN.length],
        lastname: `${SURNAME[g % SURNAME.length]} (S${g})`,
        email: `${username}@${DEMO_DOMAIN}`,
      });
    }
    total++;
  }
  cohort.members = members;
}

fs.writeFileSync(FILE, JSON.stringify(roster, null, 2) + "\n");
const seeded = roster.cohorts.length - kept.length;
console.log(`Wrote ${total} demo students across ${seeded} cohorts → ${path.relative(process.cwd(), FILE)}`);
console.log(`All emails @${DEMO_DOMAIN} (non-routable); usernames prefixed ehel-pilot- (school) or ehel-intensive- (adult).`);
if (kept.length) {
  console.log(`\nLEFT ALONE — these hold members that are not demo accounts:`);
  for (const k of kept) console.log(`  ${k}`);
  console.log("Pass --force to overwrite them with demo students.");
}
