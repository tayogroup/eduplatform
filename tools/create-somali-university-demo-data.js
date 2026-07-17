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
  { id: "SU-ENG101", fullname: "English Foundations", category: "Languages", teacherIndex: 0, capacity: 240, schedule: "Mon/Wed 10:00 AM" },
  { id: "SU-MATH101", fullname: "Mathematics Foundations", category: "Sciences", teacherIndex: 1, capacity: 240, schedule: "Tue/Thu 8:00 AM" },
  { id: "SU-QURN101", fullname: "Quraan Recitation and Tajweed", category: "Islamic Studies", teacherIndex: 2, capacity: 210, schedule: "Sat/Sun 4:00 PM" },
  { id: "SU-ARB101", fullname: "Arabic Language Basics", category: "Languages", teacherIndex: 3, capacity: 240, schedule: "Mon/Thu 2:00 PM" },
  { id: "SU-ISL101", fullname: "Islamic Studies Foundations", category: "Islamic Studies", teacherIndex: 4, capacity: 270, schedule: "Tue/Sat 6:00 PM" },
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
    course.fullname, "foundations", 40, 20, "Monday, Tuesday, Wednesday, Thursday, Saturday", course.schedule, "", `Leads ${course.fullname} (${course.id}); ${course.schedule}.`,
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
  const student = { username, first, last, email: `${username}@${DOMAIN}`, courses: myCourses, password: `SUDemo-S${pad(i)}-2026!` };
  students.push(student);
  studentRows.push([
    i, `${first} ${last}`, first, last, age, "yes", female ? "female" : "male", "no",
    myCourses.map((c) => c.fullname).join("; "), WORKSPACE.country, city, WORKSPACE.timezone, "Somalia", "Somali", "English, Arabic",
    "foundations", "secondary_completed", myCourses.length * 2, days.join(", "), hour, days.map((d) => `${d} ${hour}`).join("; "),
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
console.log(`\nDone: package in ${path.relative(root, outDir)}`);
