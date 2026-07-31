// Generate the English-only pilot data for Ehel Academy:
//   - catalog-eng-v1.json : the 8 English courses (grades 1-8), English categories only
//   - cohorts-eng-v1.json : per-grade cohorts, English-only enrolment, 50 students
//                           weighted 24/16/10 into grades 1-3; grades 4-8 empty.
// Fresh versioned filenames (…-v1) so the Bunny pull zone serves them uncached
// (the deploy-tmp/JSON 30-day edge cache ignores query strings).
//
//   node tools/generate-ehel-english-pilot.js

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', 'src', 'prototypes', 'ehel-academy');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'catalog.json'), 'utf8'));

// ---- English-only catalog --------------------------------------------------
const engCourses = catalog.courses.filter(c => c.subjectKey === 'eng');
const engCatPaths = new Set(engCourses.map(c => c.categoryPath.join(' > ')));
const engCategories = catalog.categories.filter(c => engCatPaths.has(c.path.join(' > ')));

const catalogEng = {
  catalog: 'ehel-academy-english-pilot',
  contract: catalog.contract || '1.0',
  categories: engCategories,
  courses: engCourses,
};
fs.writeFileSync(path.join(root, 'catalog-eng-v1.json'), JSON.stringify(catalogEng, null, 2) + '\n');

// ---- Cohorts (English-only enrolment, weighted intake) ---------------------
const YEAR = 2026;
const COUNTS = { 1: 24, 2: 16, 3: 10 }; // grades 1-3 = 50 students; 4-8 empty
const NAMES = [
  'Amina', 'Yusuf', 'Layla', 'Omar', 'Deqa', 'Bilal', 'Hana', 'Idris', 'Sara', 'Noor',
  'Zahra', 'Musa', 'Iman', 'Khalid', 'Maryam', 'Tariq', 'Sumaya', 'Hamza', 'Aisha', 'Yasin',
  'Fardowsa', 'Ismail', 'Ruqiya', 'Adan', 'Halima', 'Nuh', 'Safiya', 'Kadar', 'Asma', 'Salah',
];
const pad2 = n => String(n).padStart(2, '0');

const cohorts = engCourses.map(course => {
  const grade = course.stage;
  const count = COUNTS[grade] || 0;
  const members = [];
  for (let i = 1; i <= count; i++) {
    const username = `ehel-pilot-s${grade}-${pad2(i)}`;
    members.push({
      username,
      firstname: NAMES[(i - 1) % NAMES.length],
      lastname: `Pilot (G${grade})`,
      email: `${username}@ehel.example.com`,
    });
  }
  return {
    idnumber: `ehel-pilot-g${pad2(grade)}-${YEAR}`,
    name: `Ehel Pilot — Grade ${grade} English (${YEAR}–${(YEAR % 100) + 1})`,
    grade,
    level: course.level,
    courses: [course.idnumber], // English-only enrolment
    members,
  };
});

const cohortsEng = {
  catalog: 'ehel-academy-english-pilot',
  contract: '1.0',
  academicYear: YEAR,
  memberSchema: { required: 'username OR email', optional: ['firstname', 'lastname'] },
  cohorts,
};
fs.writeFileSync(path.join(root, 'cohorts-eng-v1.json'), JSON.stringify(cohortsEng, null, 2) + '\n');

const enrolled = cohorts.reduce((s, c) => s + c.members.length, 0);
console.log(`catalog-eng-v1.json: ${engCourses.length} English courses, ${engCategories.length} categories`);
console.log(`cohorts-eng-v1.json: ${cohorts.length} cohorts, ${enrolled} students (` +
  cohorts.filter(c => c.members.length).map(c => `g${c.grade}=${c.members.length}`).join(', ') + '; g4-g8 empty)');
