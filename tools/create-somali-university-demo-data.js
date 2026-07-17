#!/usr/bin/env node

// Generates a complete demo onboarding package for the "Somali University"
// institution workspace: 1 admin, TEACHER_COUNT teachers across 5 courses,
// STUDENT_COUNT students,
// enrollments, and a Moodle-standard upload-users CSV. Deterministic
// (seeded) so reruns produce identical data. Demo/staging use only.
// Output: deliverables/somali-university-demo/

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "deliverables", "somali-university-demo");

// Deterministic pseudo-random (LCG) so the package is reproducible.
const STUDENT_COUNT = 500;
const TEACHER_COUNT = 30;

let seed = 20260717;
function rand() {
  seed = (seed * 1103515245 + 12345) % 2147483648;
  return seed / 2147483648;
}
function pick(list) { return list[Math.floor(rand() * list.length)]; }
function pad(n, w = 3) { return String(n).padStart(w, "0"); }

const FEMALE = ["Amina", "Ayaan", "Fadumo", "Hodan", "Halima", "Sagal", "Ubax", "Ifrah", "Zahra", "Layla", "Naima", "Hibo", "Farhiya", "Khadija", "Maryan", "Nasra", "Deeqa", "Filsan", "Hamdi", "Iman", "Jawahir", "Nimco", "Rahma", "Sahra", "Yasmin"];
const MALE = ["Mohamed", "Abdi", "Ahmed", "Omar", "Yusuf", "Hassan", "Hussein", "Abdullahi", "Ismail", "Liban", "Guled", "Khalid", "Farah", "Jamal", "Awil", "Zakariye", "Bashir", "Dahir", "Elmi", "Hamza", "Kaafi", "Mustaf", "Nur", "Sharmarke", "Warsame"];
const SURNAMES = ["Ali", "Hassan", "Hussein", "Mohamed", "Farah", "Warsame", "Jama", "Abdi", "Yusuf", "Osman", "Aden", "Ismail", "Elmi", "Duale", "Barre", "Samatar", "Egal", "Gedi", "Awale", "Isse", "Hersi", "Guleed", "Mire", "Nuur", "Sheikh"];
const CITIES = ["Mogadishu", "Hargeisa", "Kismayo", "Baidoa", "Garowe", "Beledweyne", "Jowhar", "Berbera"];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Saturday", "Sunday"];
const HOURS = ["8:00 AM", "10:00 AM", "2:00 PM", "4:00 PM", "6:00 PM"];

const DOMAIN = "somaliuniversity.demo.test";
const WORKSPACE = {
  name: "Somali University",
  shortname: "somali-university",
  type: "institution",
  country: "Somalia",
  city: "Mogadishu",
  timezone: "Africa/Mogadishu",
  languages: "Somali, English, Arabic",
};

const COURSES = [
  { id: "SU-ENG101", fullname: "Academic English I", category: "Languages", teacherIndex: 0, capacity: 240, schedule: "Mon/Wed 10:00 AM" },
  { id: "SU-MATH101", fullname: "University Mathematics I", category: "Sciences", teacherIndex: 1, capacity: 240, schedule: "Tue/Thu 8:00 AM" },
  { id: "SU-ICT101", fullname: "Introduction to Computing", category: "Computing", teacherIndex: 2, capacity: 210, schedule: "Sat/Sun 4:00 PM" },
  { id: "SU-ARB101", fullname: "Arabic Language I", category: "Languages", teacherIndex: 3, capacity: 240, schedule: "Mon/Thu 2:00 PM" },
  { id: "SU-ECON101", fullname: "Principles of Economics I", category: "Business", teacherIndex: 4, capacity: 270, schedule: "Tue/Sat 6:00 PM" },
];

function csvCell(value) {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
function writeCsv(file, rows) {
  fs.writeFileSync(path.join(outDir, file), rows.map((row) => row.map(csvCell).join(",")).join("\n") + "\n", "utf8");
  console.log(`Wrote ${file} (${rows.length - 1} records)`);
}

fs.mkdirSync(outDir, { recursive: true });

// ---------------------------------------------------------------- admin

const admin = {
  username: "su-admin",
  firstname: "Fartun",
  lastname: "Warsame",
  email: `admin@${DOMAIN}`,
  password: "SUDemo-Admin-2026!",
  role: "admin (workspace owner)",
};

writeCsv("admin.csv", [
  ["username", "firstname", "lastname", "email", "password", "workspace", "workspace_type", "workspace_role", "city", "country", "timezone", "notes"],
  [admin.username, admin.firstname, admin.lastname, admin.email, admin.password, WORKSPACE.name, WORKSPACE.type, "owner/admin", WORKSPACE.city, WORKSPACE.country, WORKSPACE.timezone, "Demo institution administrator. Change password on first login."],
]);

// ---------------------------------------------------------------- teachers (matches mock_teacher_data.csv columns)

const teacherHeader = ["mock_teacher_no", "teacher_display_name", "teacher_firstname", "teacher_lastname", "teacher_username", "teacher_contact", "teacher_phone", "preferred_contact", "gender", "country", "city", "timezone", "timezone_group", "primary_language", "other_languages", "courses_taught", "levels_taught", "max_students_per_class", "max_weekly_hours", "availability_days", "availability_hours_local", "availability_slots", "availability_summary", "bbb_trained", "safeguarding_trained", "recording_qa_ack", "status", "can_teach_children", "preferred_student_gender", "preferred_age_range", "group_capacity_notes", "moodle_course_ready", "bbb_ready", "quality_review_required", "admin_notes"];

const teachers = [];
const teacherRows = [teacherHeader];
for (let i = 0; i < TEACHER_COUNT; i += 1) {
  const female = i % 2 === 0;
  const first = pick(female ? FEMALE : MALE);
  const last = SURNAMES[(i * 7 + 3) % SURNAMES.length];
  const username = `su-teacher${i + 1}`;
  const course = COURSES[i % COURSES.length];
  const teacher = { first, last, username, email: `${username}@${DOMAIN}`, course, gender: female ? "female" : "male", password: `SUDemo-T${i + 1}-2026!` };
  teachers.push(teacher);
  teacherRows.push([
    `SU-T-${pad(i + 1)}`, `Teacher ${first} ${last}`, first, last, username, teacher.email, `+252610020${pad(i + 1)}`, i % 2 ? "whatsapp" : "email", teacher.gender,
    WORKSPACE.country, WORKSPACE.city, WORKSPACE.timezone, "Somalia", "Somali", "English, Arabic",
    course.fullname, "year_1", 40, 20, "Monday, Tuesday, Wednesday, Thursday, Saturday", course.schedule, "", `Leads ${course.fullname} (${course.id}); ${course.schedule}.`,
    "yes", "yes", "yes", "active", "no", "mixed adult cohorts", "18-30", `Course capacity ${course.capacity}.`, "yes", "yes", "standard monthly QA",
    "Demo teacher record for Somali University onboarding.",
  ]);
}
writeCsv("teachers.csv", teacherRows);

// ---------------------------------------------------------------- courses

writeCsv("courses.csv", [
  ["course_id", "shortname", "fullname", "category", "capacity", "schedule", "teacher_username", "teacher_name", "workspace"],
  ...COURSES.map((c) => { const t = teachers[c.teacherIndex]; return [c.id, c.id.toLowerCase(), c.fullname, c.category, c.capacity, c.schedule, t.username, `${t.first} ${t.last}`, WORKSPACE.name]; }),
]);

// ---------------------------------------------------------------- students (matches mock_student_data.csv columns) + enrollments

const studentHeader = ["mock_student_no", "student_display_name", "student_firstname", "student_lastname", "age", "over_18", "gender", "special_needs", "course_type", "country", "city", "timezone", "timezone_group", "primary_language", "other_languages", "current_level", "base_of_learning", "number_of_sessions_per_week", "preferred_days", "preferred_hours_local", "schedule_choices", "parent_guardian_required", "parent_name", "parent_contact_email_or_phone", "parent_phone_whatsapp", "live_class_consent", "recording_consent", "consent_notes_comment", "recommended_group_pool", "recommended_group_size_target", "bbb_ready", "moodle_course_ready", "admin_notes"];

const students = [];
const studentRows = [studentHeader];
const enrollmentRows = [["student_username", "student_name", "course_id", "course_name", "role"]];
const usedNames = new Set();

for (let i = 1; i <= STUDENT_COUNT; i += 1) {
  const female = rand() < 0.5;
  let first; let last;
  do { first = pick(female ? FEMALE : MALE); last = pick(SURNAMES); } while (usedNames.has(`${first} ${last}`) && usedNames.size < 1200);
  usedNames.add(`${first} ${last}`);
  const username = `su-student${pad(i)}`;
  const age = 18 + Math.floor(rand() * 11);
  const city = pick(CITIES);
  const days = [pick(DAYS), pick(DAYS)].filter((d, idx, a) => a.indexOf(d) === idx);
  const hour = pick(HOURS);
  const courseCount = 1 + Math.floor(rand() * 3);
  const shuffled = [...COURSES].sort(() => rand() - 0.5);
  const myCourses = shuffled.slice(0, courseCount);
  const student = { username, first, last, email: `${username}@${DOMAIN}`, courses: myCourses, password: `SUDemo-S${pad(i)}-2026!`, age, gender: female ? "female" : "male", city };
  students.push(student);
  studentRows.push([
    i, `${first} ${last}`, first, last, age, "yes", female ? "female" : "male", "no",
    myCourses.map((c) => c.fullname).join("; "), WORKSPACE.country, city, WORKSPACE.timezone, "Somalia", "Somali", "English, Arabic",
    "year_1", "secondary_completed", myCourses.length * 2, days.join(", "), hour, days.map((d) => `${d} ${hour}`).join("; "),
    "no", "", "", "", "yes", "yes", "Adult learner; consent captured directly. Demo record.",
    `Somalia | ${myCourses[0].fullname} | foundations | ${female ? "female" : "male"} | adults`, 20, "yes", "yes",
    "Demo student record for Somali University onboarding.",
  ]);
  myCourses.forEach((c) => enrollmentRows.push([username, `${first} ${last}`, c.id, c.fullname, "student"]));
}
writeCsv("students.csv", studentRows);
writeCsv("enrollments.csv", enrollmentRows);

// ---------------------------------------------------------------- Moodle upload users CSV (Site administration > Users > Upload users)

const maxCourses = 3;
const moodleHeader = ["username", "firstname", "lastname", "email", "password", "city", "country", "timezone", "cohort1"];
for (let c = 1; c <= maxCourses; c += 1) moodleHeader.push(`course${c}`, `role${c}`);

const moodleRows = [moodleHeader];
function moodleRow(username, first, last, email, password, courseRoles) {
  const row = [username, first, last, email, password, WORKSPACE.city, "SO", WORKSPACE.timezone, WORKSPACE.shortname];
  for (let c = 0; c < maxCourses; c += 1) row.push(courseRoles[c] ? courseRoles[c][0] : "", courseRoles[c] ? courseRoles[c][1] : "");
  return row;
}
moodleRows.push(moodleRow(admin.username, admin.firstname, admin.lastname, admin.email, admin.password, []));
teachers.forEach((t) => moodleRows.push(moodleRow(t.username, t.first, t.last, t.email, t.password, [[t.course.id.toLowerCase(), "editingteacher"]])));
students.forEach((s) => moodleRows.push(moodleRow(s.username, s.first, s.last, s.email, s.password, s.courses.map((c) => [c.id.toLowerCase(), "student"]))));
writeCsv("moodle-upload-users.csv", moodleRows);

// ---------------------------------------------------------------- workspace profile + README

fs.writeFileSync(path.join(outDir, "workspace.json"), JSON.stringify({
  workspace: WORKSPACE,
  owner: { username: admin.username, name: `${admin.firstname} ${admin.lastname}`, email: admin.email },
  counts: { admins: 1, teachers: teachers.length, students: students.length, courses: COURSES.length, enrollments: enrollmentRows.length - 1 },
  generated: "2026-07-17",
  purpose: "Demo onboarding package. Not for production use.",
}, null, 2) + "\n", "utf8");
console.log("Wrote workspace.json");

fs.writeFileSync(path.join(outDir, "README.md"), `# Somali University - demo onboarding package

Generated by tools/create-somali-university-demo-data.js (deterministic;
rerun to reproduce identical data). Demo/staging use only - every email
uses the reserved domain ${DOMAIN} and passwords follow a visible
pattern. Do not import into production with these passwords.

## Contents

- admin.csv - 1 institution administrator (workspace owner)
- teachers.csv - ${teachers.length} teachers (each course has one lead and several section teachers), same columns as local_hubredirect mock_teacher_data.csv
- students.csv - ${students.length} adult students, same columns as mock_student_data.csv
- courses.csv - 5 courses, each led by one teacher
- enrollments.csv - ${enrollmentRows.length - 1} student-course enrollments (1-3 courses per student)
- moodle-upload-users.csv - single file for Moodle: Site administration > Users > Upload users
- workspace.json - workspace descriptor (institution type, per docs/workspace-institution-model.md)

## Onboarding steps (staging)

1. Create the five courses (shortnames su-eng101, su-math101, su-qurn101,
   su-arb101, su-isl101) or let upload users create-and-enrol against
   existing shortnames.
2. Create cohort "somali-university" (the upload file assigns everyone to it).
3. Site administration > Users > Upload users > moodle-upload-users.csv.
   Roles per course are in the file (editingteacher / student).
4. Create the "Somali University" workspace (type: institution) in the
   workspace admin and add ${admin.username} as owner/admin.
5. Use teachers.csv and students.csv with the existing grouping/scheduling
   tooling (same schema as the local_hubredirect mock data).
`, "utf8");
console.log("Wrote README.md");

// ---------------------------------------------------------------- Moodle SQL (demo-data.sql)
// Direct-SQL variant for admins who prefer running the import themselves.
// One shared bcrypt password for every demo account (SQL cannot hash
// per-user): SUDemo2026!
const SHARED_PASSWORD_HASH = "$2y$10$wF5wvYEyod5IcmiB0H1EOuTLCpEVONoa0OYmiIPbfRIns3DCzEvbi";
// Moodle table prefix of the target database (quraantest uses mdlgx_).
const DB_PREFIX = "mdlgx_";

function sqlStr(value) { return `'${String(value).replace(/'/g, "''")}'`; }

const allUsers = [
  { username: admin.username, first: admin.firstname, last: admin.lastname, email: admin.email },
  ...teachers.map((t) => ({ username: t.username, first: t.first, last: t.last, email: t.email })),
  ...students.map((s) => ({ username: s.username, first: s.first, last: s.last, email: s.email })),
];

const enrolPairs = [
  ...teachers.map((t) => ({ username: t.username, shortname: t.course.id.toLowerCase(), role: "editingteacher" })),
  ...students.flatMap((s) => s.courses.map((c) => ({ username: s.username, shortname: c.id.toLowerCase(), role: "student" }))),
];

function chunkValues(rows, size = 200) {
  const chunks = [];
  for (let i = 0; i < rows.length; i += size) chunks.push(rows.slice(i, i + size));
  return chunks;
}

const sql = [];
sql.push(`-- Somali University demo data for Moodle (MySQL/MariaDB)
-- Generated by tools/create-somali-university-demo-data.js on 2026-07-17.
--
-- ASSUMPTIONS - review before running:
--   * Table prefix: set via DB_PREFIX in the generator (currently mdlgx_).
--   * Roles 'editingteacher' and 'student' exist (Moodle defaults).
--   * Courses are placed in the site's first course category.
--   * Every demo account gets the SAME password: SUDemo2026!
--     (bcrypt hash below; change passwords after the demo).
--   * Safe to re-run: every insert skips rows that already exist.
--
-- AFTER RUNNING: purge caches (php admin/cli/purge_caches.php) so the
-- new courses and enrolments appear. Course context paths are set by
-- this script; Moodle's cron heals anything remaining.
--
-- CLEANUP (when the demo is over): see the commented block at the end.

START TRANSACTION;

-- 1) Users ------------------------------------------------------------
DROP TEMPORARY TABLE IF EXISTS tmp_su_users;
CREATE TEMPORARY TABLE tmp_su_users (
  username VARCHAR(100) PRIMARY KEY,
  firstname VARCHAR(100),
  lastname VARCHAR(100),
  email VARCHAR(100)
);`);

for (const chunk of chunkValues(allUsers)) {
  sql.push(`INSERT INTO tmp_su_users (username, firstname, lastname, email) VALUES\n${chunk.map((u) => `(${sqlStr(u.username)},${sqlStr(u.first)},${sqlStr(u.last)},${sqlStr(u.email)})`).join(",\n")};`);
}

sql.push(`INSERT INTO mdl_user
  (auth, confirmed, mnethostid, username, password, firstname, lastname, email,
   city, country, lang, timezone, timecreated, timemodified)
SELECT 'manual', 1,
       (SELECT CAST(value AS UNSIGNED) FROM mdl_config WHERE name = 'mnet_localhost_id'),
       t.username, ${sqlStr(SHARED_PASSWORD_HASH)}, t.firstname, t.lastname, t.email,
       ${sqlStr(WORKSPACE.city)}, 'SO', 'en', ${sqlStr(WORKSPACE.timezone)}, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()
FROM tmp_su_users t
WHERE NOT EXISTS (SELECT 1 FROM mdl_user u WHERE u.username = t.username AND u.deleted = 0);

-- 2) Courses ----------------------------------------------------------`);

for (const c of COURSES) {
  sql.push(`INSERT INTO mdl_course (category, sortorder, fullname, shortname, idnumber, summary, summaryformat, format, startdate, visible, timecreated, timemodified)
SELECT (SELECT MIN(id) FROM mdl_course_categories), 0, ${sqlStr(c.fullname)}, ${sqlStr(c.id.toLowerCase())}, ${sqlStr(c.id)},
       ${sqlStr(`${c.fullname} - Somali University Year 1 course. Schedule: ${c.schedule}.`)}, 1, 'topics', UNIX_TIMESTAMP(), 1, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM mdl_course WHERE shortname = ${sqlStr(c.id.toLowerCase())});`);
}

sql.push(`-- 3) Course contexts (created with correct path/depth) ----------------
INSERT INTO mdl_context (contextlevel, instanceid, depth, path)
SELECT 50, c.id, 0, NULL
FROM mdl_course c
WHERE c.shortname IN (${COURSES.map((c) => sqlStr(c.id.toLowerCase())).join(", ")})
  AND NOT EXISTS (SELECT 1 FROM mdl_context x WHERE x.contextlevel = 50 AND x.instanceid = c.id);

UPDATE mdl_context ctx
JOIN mdl_course c ON c.id = ctx.instanceid AND ctx.contextlevel = 50
JOIN mdl_context catctx ON catctx.contextlevel = 40 AND catctx.instanceid = c.category
SET ctx.depth = catctx.depth + 1,
    ctx.path = CONCAT(catctx.path, '/', ctx.id)
WHERE c.shortname IN (${COURSES.map((c) => sqlStr(c.id.toLowerCase())).join(", ")})
  AND (ctx.path IS NULL OR ctx.depth = 0);

-- 4) Manual enrolment method on each course ---------------------------
INSERT INTO mdl_enrol (enrol, status, courseid, sortorder, roleid, timecreated, timemodified)
SELECT 'manual', 0, c.id, 0,
       (SELECT id FROM mdl_role WHERE shortname = 'student'),
       UNIX_TIMESTAMP(), UNIX_TIMESTAMP()
FROM mdl_course c
WHERE c.shortname IN (${COURSES.map((c) => sqlStr(c.id.toLowerCase())).join(", ")})
  AND NOT EXISTS (SELECT 1 FROM mdl_enrol e WHERE e.courseid = c.id AND e.enrol = 'manual');

-- 5) Enrolments and role assignments ----------------------------------
DROP TEMPORARY TABLE IF EXISTS tmp_su_enrol;
CREATE TEMPORARY TABLE tmp_su_enrol (
  username VARCHAR(100),
  shortname VARCHAR(255),
  role VARCHAR(30),
  KEY idx_u (username), KEY idx_s (shortname)
);`);

for (const chunk of chunkValues(enrolPairs)) {
  sql.push(`INSERT INTO tmp_su_enrol (username, shortname, role) VALUES\n${chunk.map((e) => `(${sqlStr(e.username)},${sqlStr(e.shortname)},${sqlStr(e.role)})`).join(",\n")};`);
}

sql.push(`INSERT INTO mdl_user_enrolments (status, enrolid, userid, timestart, timeend, modifierid, timecreated, timemodified)
SELECT 0, e.id, u.id, UNIX_TIMESTAMP(), 0, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()
FROM tmp_su_enrol t
JOIN mdl_user u ON u.username = t.username AND u.deleted = 0
JOIN mdl_course c ON c.shortname = t.shortname
JOIN mdl_enrol e ON e.courseid = c.id AND e.enrol = 'manual'
WHERE NOT EXISTS (SELECT 1 FROM mdl_user_enrolments ue WHERE ue.enrolid = e.id AND ue.userid = u.id);

INSERT INTO mdl_role_assignments (roleid, contextid, userid, component, itemid, timemodified, modifierid)
SELECT r.id, ctx.id, u.id, '', 0, UNIX_TIMESTAMP(), 0
FROM tmp_su_enrol t
JOIN mdl_user u ON u.username = t.username AND u.deleted = 0
JOIN mdl_course c ON c.shortname = t.shortname
JOIN mdl_context ctx ON ctx.contextlevel = 50 AND ctx.instanceid = c.id
JOIN mdl_role r ON r.shortname = t.role
WHERE NOT EXISTS (SELECT 1 FROM mdl_role_assignments ra WHERE ra.roleid = r.id AND ra.contextid = ctx.id AND ra.userid = u.id);

-- 6) Account numbers (5-digit user.idnumber) --------------------------
-- The workspace UI shows "Account No. pending repair" for users whose
-- idnumber is not a 5-digit code (accesslib.php pqh_account_no_value).
-- Assign sequential demo numbers 70001+ to the su-* accounts.
SET @acct := 70000;
UPDATE mdl_user
SET idnumber = (@acct := @acct + 1)
WHERE username LIKE 'su-%' AND deleted = 0
  AND (idnumber IS NULL OR idnumber = '' OR idnumber NOT REGEXP '^[0-9]{5}$')
ORDER BY id;

DROP TEMPORARY TABLE IF EXISTS tmp_su_users;
DROP TEMPORARY TABLE IF EXISTS tmp_su_enrol;

COMMIT;

-- ---------------------------------------------------------------------
-- CLEANUP (run when the demo is over; uncomment to use)
-- DELETE ra FROM mdl_role_assignments ra JOIN mdl_user u ON u.id = ra.userid WHERE u.username LIKE 'su-%';
-- DELETE ue FROM mdl_user_enrolments ue JOIN mdl_user u ON u.id = ue.userid WHERE u.username LIKE 'su-%';
-- UPDATE mdl_user SET deleted = 1, email = CONCAT(username, '@deleted.invalid') WHERE username LIKE 'su-%';
-- (Delete the five su-* courses through the Moodle UI so activities,
--  contexts, and gradebook entries are cleaned up properly.)
`);

fs.writeFileSync(path.join(outDir, "demo-data.sql"), (sql.join("\n\n") + "\n").replace(/\bmdl_/g, DB_PREFIX), "utf8");
console.log(`Wrote demo-data.sql (${allUsers.length} users, ${COURSES.length} courses, ${enrolPairs.length} enrolments)`);

// ---------------------------------------------------------------- workspace linking SQL
// Run AFTER demo-data.sql. Links the Moodle records to the EduPlatform
// workspace so the workspace dashboard counters (students, teachers,
// course offerings) light up. Membership and offering shapes follow
// local_hubredirect (admissionslib.php / course_offerings.php).
const linkSql = `-- Somali University: link demo records to the EduPlatform workspace
-- Run AFTER demo-data.sql. MySQL/MariaDB. Prefix from DB_PREFIX (mdlgx_).
--
-- 1. SET the workspace id below. Yours is in the dashboard URL,
--    e.g. workspace_dashboard.php?...&workspaceid=15  ->  15
-- 2. The consumer id is read from the workspace row automatically.
-- 3. Safe to re-run: inserts skip rows that already exist.
-- 4. Purge caches afterwards so the dashboard counters refresh.

SET @workspaceid := 15;
-- The consumer row points at the workspace via primaryworkspaceid.
-- If this returns NULL (multi-workspace consumer), use the slug lookup
-- on the next line instead.
SET @consumerid := (SELECT id FROM mdl_local_prequran_consumer WHERE primaryworkspaceid = @workspaceid LIMIT 1);
-- SET @consumerid := (SELECT id FROM mdl_local_prequran_consumer WHERE slug = 'institution-1784275208');

START TRANSACTION;

-- Workspace members: admin, teachers, students -------------------------
INSERT INTO mdl_local_prequran_workspace_member (workspaceid, userid, workspace_role, status, timecreated, timemodified)
SELECT @workspaceid, u.id, 'admin', 'active', UNIX_TIMESTAMP(), UNIX_TIMESTAMP()
FROM mdl_user u
WHERE u.username = 'su-admin' AND u.deleted = 0
  AND NOT EXISTS (SELECT 1 FROM mdl_local_prequran_workspace_member m
                  WHERE m.workspaceid = @workspaceid AND m.userid = u.id);

INSERT INTO mdl_local_prequran_workspace_member (workspaceid, userid, workspace_role, status, timecreated, timemodified)
SELECT @workspaceid, u.id, 'teacher', 'active', UNIX_TIMESTAMP(), UNIX_TIMESTAMP()
FROM mdl_user u
WHERE u.username LIKE 'su-teacher%' AND u.deleted = 0
  AND NOT EXISTS (SELECT 1 FROM mdl_local_prequran_workspace_member m
                  WHERE m.workspaceid = @workspaceid AND m.userid = u.id);

INSERT INTO mdl_local_prequran_workspace_member (workspaceid, userid, workspace_role, status, timecreated, timemodified)
SELECT @workspaceid, u.id, 'student', 'active', UNIX_TIMESTAMP(), UNIX_TIMESTAMP()
FROM mdl_user u
WHERE u.username LIKE 'su-student%' AND u.deleted = 0
  AND NOT EXISTS (SELECT 1 FROM mdl_local_prequran_workspace_member m
                  WHERE m.workspaceid = @workspaceid AND m.userid = u.id);

-- Published course offerings (one per su-* course) ---------------------
${COURSES.map((c) => `INSERT INTO mdl_local_prequran_course_offering
  (consumerid, workspaceid, moodlecourseid, course_key, title, summary,
   capacity, tuition_amount, pricing_currency, visibility, approval_mode,
   status, createdby, startdate, enddate, timecreated, timemodified)
SELECT @consumerid, @workspaceid, c.id, ${sqlStr(c.id.toLowerCase())}, ${sqlStr(c.fullname)},
       ${sqlStr(`${c.fullname} - Somali University Year 1 offering. Schedule: ${c.schedule}.`)},
       ${c.capacity}, '0.00', 'USD', 'public', 'admin_approval', 'published', 0,
       UNIX_TIMESTAMP(), UNIX_TIMESTAMP() + (180 * 86400), UNIX_TIMESTAMP(), UNIX_TIMESTAMP()
FROM mdl_course c
WHERE c.shortname = ${sqlStr(c.id.toLowerCase())}
  AND NOT EXISTS (SELECT 1 FROM mdl_local_prequran_course_offering o
                  WHERE o.workspaceid = @workspaceid AND o.moodlecourseid = c.id);`).join("\n\n")}

COMMIT;

-- If an insert fails with "Unknown column", that optional column does
-- not exist in your plugin version - remove it from the column list and
-- its value from the SELECT, then re-run.
--
-- CLEANUP (when the demo is over; uncomment to use)
-- DELETE m FROM mdl_local_prequran_workspace_member m JOIN mdl_user u ON u.id = m.userid
--   WHERE m.workspaceid = @workspaceid AND u.username LIKE 'su-%';
-- DELETE FROM mdl_local_prequran_course_offering
--   WHERE workspaceid = @workspaceid AND course_key LIKE 'su-%';
`;
fs.writeFileSync(path.join(outDir, "workspace-link.sql"), linkSql.replace(/\bmdl_/g, DB_PREFIX), "utf8");
console.log("Wrote workspace-link.sql (members + published offerings)");

// ---------------------------------------------------------------- student linking SQL
// Run AFTER workspace-link.sql. Creates class groups (one per teacher),
// puts every enrolled student into the right teacher's group, and gives
// each student a primary teacher. Shapes follow live_grouping.php and
// workspace_people.php. Teacher slots: course index ci (0-4), section k
// (0-5) -> teacher username su-teacher{ci+1+5k}; students distribute by
// MOD(userid, 6).
const courseMapRows = COURSES.map((c, ci) => `(${sqlStr(c.id.toLowerCase())}, ${ci}, ${sqlStr(c.fullname)}, ${sqlStr(c.schedule)})`).join(",\n");
const sectionsPerCourse = Math.floor(TEACHER_COUNT / COURSES.length);
const kUnion = Array.from({ length: sectionsPerCourse }, (_, k) => `SELECT ${k} AS k`).join(" UNION ALL ");

const studentLinksSql = `-- Somali University: link students to teachers and class groups
-- Run AFTER workspace-link.sql. MySQL/MariaDB. Prefix from DB_PREFIX (mdlgx_).
--
-- Creates:
--   * ${TEACHER_COUNT} class groups (one per teacher, named per course section)
--   * group members: every course enrolment placed in one of the course's
--     ${sectionsPerCourse} sections (spread by MOD(userid, ${sectionsPerCourse}))
--   * one primary teacher per student (from their first course's section)
-- Safe to re-run; purge caches afterwards.

SET @workspaceid := 15;

START TRANSACTION;

DROP TEMPORARY TABLE IF EXISTS tmp_su_cmap;
CREATE TEMPORARY TABLE tmp_su_cmap (shortname VARCHAR(255) PRIMARY KEY, ci INT, title VARCHAR(255), schedule VARCHAR(80));
INSERT INTO tmp_su_cmap (shortname, ci, title, schedule) VALUES
${courseMapRows};

-- 1) Class groups: one per teacher ------------------------------------
INSERT INTO mdl_local_prequran_class_group
  (workspaceid, poolid, teacherid, title, age_min, age_max, gender_policy,
   schedule_summary, max_students, status, createdby, timecreated, timemodified)
SELECT @workspaceid, 0, t.id,
       CONCAT(m.title, ' - Group ', s.k + 1),
       18, 99, 'flexible', m.schedule, 40, 'open', 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()
FROM tmp_su_cmap m
JOIN (${kUnion}) s
JOIN mdl_user t ON t.username = CONCAT('su-teacher', m.ci + 1 + ${COURSES.length} * s.k) AND t.deleted = 0
WHERE NOT EXISTS (SELECT 1 FROM mdl_local_prequran_class_group g
                  WHERE g.title = CONCAT(m.title, ' - Group ', s.k + 1)
                    AND g.workspaceid = @workspaceid);

-- 2) Group members: place each enrolment in its course section --------
INSERT INTO mdl_local_prequran_group_member
  (workspaceid, groupid, poolid, studentid, match_score, match_status,
   assignment_status, match_details, assignedby, timecreated, timemodified)
SELECT @workspaceid, g.id, 0, u.id, 100, 'manual', 'active',
       'Somali University demo assignment.', 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()
FROM mdl_user u
JOIN mdl_user_enrolments ue ON ue.userid = u.id
JOIN mdl_enrol e ON e.id = ue.enrolid AND e.enrol = 'manual'
JOIN mdl_course c ON c.id = e.courseid
JOIN tmp_su_cmap m ON m.shortname = c.shortname
JOIN mdl_local_prequran_class_group g
  ON g.workspaceid = @workspaceid
 AND g.title = CONCAT(m.title, ' - Group ', MOD(u.id, ${sectionsPerCourse}) + 1)
WHERE u.username LIKE 'su-student%' AND u.deleted = 0
  AND NOT EXISTS (SELECT 1 FROM mdl_local_prequran_group_member gm
                  WHERE gm.groupid = g.id AND gm.studentid = u.id);

-- 3) Primary teacher per student (from their first course) ------------
INSERT INTO mdl_local_prequran_teacher_student
  (workspaceid, teacherid, studentid, cohortid, status, assignedby, timecreated, timemodified)
SELECT @workspaceid, t.id, fc.uid, 0, 'active', 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()
FROM (
  SELECT u.id AS uid, MIN(m.ci) AS ci
  FROM mdl_user u
  JOIN mdl_user_enrolments ue ON ue.userid = u.id
  JOIN mdl_enrol e ON e.id = ue.enrolid AND e.enrol = 'manual'
  JOIN mdl_course c ON c.id = e.courseid
  JOIN tmp_su_cmap m ON m.shortname = c.shortname
  WHERE u.username LIKE 'su-student%' AND u.deleted = 0
  GROUP BY u.id
) fc
JOIN mdl_user t ON t.username = CONCAT('su-teacher', fc.ci + 1 + ${COURSES.length} * MOD(fc.uid, ${sectionsPerCourse})) AND t.deleted = 0
WHERE NOT EXISTS (SELECT 1 FROM mdl_local_prequran_teacher_student ts
                  WHERE ts.workspaceid = @workspaceid AND ts.studentid = fc.uid);

DROP TEMPORARY TABLE IF EXISTS tmp_su_cmap;

COMMIT;

-- If an insert fails with "Unknown column", that optional column does
-- not exist in your plugin version - remove it and its value, re-run.
--
-- CLEANUP (when the demo is over; uncomment to use)
-- DELETE gm FROM mdl_local_prequran_group_member gm JOIN mdl_user u ON u.id = gm.studentid
--   WHERE gm.workspaceid = @workspaceid AND u.username LIKE 'su-%';
-- DELETE FROM mdl_local_prequran_class_group
--   WHERE workspaceid = @workspaceid AND title LIKE '%- Group %' AND createdby = 0;
-- DELETE ts FROM mdl_local_prequran_teacher_student ts JOIN mdl_user u ON u.id = ts.studentid
--   WHERE ts.workspaceid = @workspaceid AND u.username LIKE 'su-%';
`;
fs.writeFileSync(path.join(outDir, "student-links.sql"), studentLinksSql.replace(/\bmdl_/g, DB_PREFIX), "utf8");
console.log("Wrote student-links.sql (class groups, group members, primary teachers)");

// ---------------------------------------------------------------- student profiles SQL
// Run AFTER workspace-link.sql. Creates local_prequran_student_profile
// rows so pickers and portals show display names, level, timezone,
// consent and demographics (shape from admissionslib.php
// pqadm_upsert_student_profile plus the picker fields the session
// wizard reads).
const profileRows = students.map((s) => `(${sqlStr(s.username)},${sqlStr(`${s.first} ${s.last}`)},${s.age},${sqlStr(s.gender)},${sqlStr(s.city)},${sqlStr(s.courses[0].fullname)})`);
const profileChunks = [];
for (let i = 0; i < profileRows.length; i += 200) profileChunks.push(profileRows.slice(i, i + 200));

const profilesSql = `-- Somali University: student profiles for pickers and portals
-- Run AFTER workspace-link.sql. MySQL/MariaDB. Prefix from DB_PREFIX (mdlgx_).
-- Safe to re-run (skips users that already have a profile). If an insert
-- fails with "Unknown column", remove that column and its value, re-run.

SET @workspaceid := 15;

START TRANSACTION;

DROP TEMPORARY TABLE IF EXISTS tmp_su_profiles;
CREATE TEMPORARY TABLE tmp_su_profiles (
  username VARCHAR(100) PRIMARY KEY,
  display_name VARCHAR(255),
  age INT,
  gender VARCHAR(20),
  city VARCHAR(120),
  course_type VARCHAR(255)
);
${profileChunks.map((chunk) => `INSERT INTO tmp_su_profiles (username, display_name, age, gender, city, course_type) VALUES\n${chunk.join(",\n")};`).join("\n")}

INSERT INTO mdl_local_prequran_student_profile
  (userid, workspaceid, student_display_name, current_level, course_type,
   status, gender, age_years, city, country, timezone, primary_language,
   live_class_consent, recording_consent, createdby, timecreated, timemodified)
SELECT u.id, @workspaceid, t.display_name, 'year_1', t.course_type,
       'active', t.gender, t.age, t.city, ${sqlStr(WORKSPACE.country)}, ${sqlStr(WORKSPACE.timezone)}, 'Somali',
       'yes', 'yes', 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()
FROM tmp_su_profiles t
JOIN mdl_user u ON u.username = t.username AND u.deleted = 0
WHERE NOT EXISTS (SELECT 1 FROM mdl_local_prequran_student_profile sp WHERE sp.userid = u.id);

DROP TEMPORARY TABLE IF EXISTS tmp_su_profiles;

COMMIT;

-- CLEANUP (when the demo is over; uncomment to use)
-- DELETE sp FROM mdl_local_prequran_student_profile sp JOIN mdl_user u ON u.id = sp.userid
--   WHERE u.username LIKE 'su-%';
`;
fs.writeFileSync(path.join(outDir, "student-profiles.sql"), profilesSql.replace(/\bmdl_/g, DB_PREFIX), "utf8");
console.log("Wrote student-profiles.sql (picker/portal profile rows)");
console.log(`\nDone: package in ${path.relative(root, outDir)}`);
