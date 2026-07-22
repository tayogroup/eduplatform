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
let total = 0;

for (const cohort of roster.cohorts) {
  const g = cohort.grade;
  const members = [];
  for (let n = 1; n <= PER; n++) {
    const idx = (g - 1) * PER + (n - 1); // global running index → stable names
    const nn = String(n).padStart(2, "0");
    const username = `ehel-pilot-s${g}-${nn}`;
    members.push({
      username,
      firstname: GIVEN[idx % GIVEN.length],
      lastname: `${SURNAME[g % SURNAME.length]} (S${g})`,
      email: `${username}@ehel.example.com`,
    });
    total++;
  }
  cohort.members = members;
}

fs.writeFileSync(FILE, JSON.stringify(roster, null, 2) + "\n");
console.log(`Wrote ${total} demo students across ${roster.cohorts.length} cohorts → ${path.relative(process.cwd(), FILE)}`);
console.log("All usernames prefixed ehel-pilot- ; all emails @ehel.example.com (non-routable).");
