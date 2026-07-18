# EduPlatform UI Redesign — Design Specification

**Date:** 2026-07-19 · **Status:** v1 proposal
**Companion prototype:** `prototype.html` (self-contained HTML/CSS/JS — open in any browser; use the role switcher in the top bar)

Canvas LMS is the architectural inspiration — role-first dashboards, course cards, prominent action lists, drill-down reporting. The visual identity, components, and layouts are original EduPlatform work built on the blue design system already shipping in `local_hubredirect` (dashboard.php, workspace_dashboard.php, teacher_workspace.php, student_workplace.php).

---

## 1 · Information architecture

```
EduPlatform (multi-tenant Moodle)
├─ Platform admin        → platform overview, institutions, users, settings, help desk
├─ Institution admin     → institution overview, schools/branches, courses, teachers,
│                          students, reports, help desk
├─ School admin          → same as institution admin, scoped to one branch
├─ Teacher               → teaching day: courses, grading, live classes, attendance,
│                          messages, per-student drill-down
├─ Student (older)       → today's learning, deadlines, courses, grades, live classes
├─ Young learner         → simplified: continue learning, today's lessons, stars, live class
├─ Parent                → child selector, progress, attendance, feedback, weekly summary
└─ Help-desk staff       → ticket queues, SLA view, user lookup
```

Drill-down spine (same across the product, mirrors the reporting path):
**Platform → institution → school/branch → grade/stage → course → class → student → activity.**
Every level: breadcrumbs · filters · date range · KPI cards · charts · detail table · export · saved views.

## 2 · User-role navigation map

| Item | Platform | Inst/School admin | Teacher | Student | Young | Parent | Help desk |
|---|---|---|---|---|---|---|---|
| Dashboard | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Courses | — | ✓ | ✓ | ✓ | ✓ (visual) | ✓ (read) | — |
| Calendar | ✓ | ✓ | ✓ | ✓ | simplified | ✓ | — |
| Live Classes | — | ✓ | ✓ | ✓ | ✓ | ✓ (observe) | — |
| Messages | ✓ | ✓ | ✓ | ✓ | ✓ (guarded) | ✓ | ✓ |
| Reports | ✓ | ✓ | ✓ (own classes) | — | — | — | ✓ (helpdesk) |
| Help Desk | ✓ | ✓ | ticket links | ticket links | — | ticket links | ✓ |
| Users | ✓ | ✓ (own tenant) | — | — | — | — | lookup |
| Institutions | ✓ | — | — | — | — | — | — |
| Settings | ✓ | ✓ (tenant) | prefs | prefs | — | prefs | prefs |

Visibility is driven by Moodle capabilities plus the existing consumer/workspace role model (`pqh_user_workspace_role`, `pqh_can_manage_academy_operations`, teacher/marketplace profiles). Never render an item the capability check would reject server-side.

## 3 · Design tokens

```css
--ink:#0f2237;      /* primary text */        --muted:#5b6b7c;  --faint:#8494a5;
--line:#e4e9ef;     /* hairline borders */    --bg:#f4f6f9;     --surface:#fff;
--tint:#edf3fc;     --tint-2:#e0ebfa;         /* blue tints */
--primary:#2166d1;  --primary-ink:#17498f;    --primary-soft:#4d8be0;
--ok:#2e7d4f/#e8f4ec;   --info:#2166d1/#e9f1fc;   --warn:#b7791f/#faf1dd;
--risk:#c0392b/#fbe9e7; --idle:#8494a5/#eef1f4;
--r-lg:16px; --r-md:12px; --r-sm:9px;
--shadow: 0 1px 2px rgba(15,34,55,.05), 0 10px 28px -16px rgba(15,34,55,.14);
type: 24px/800 page titles · 17px/750 section · 13.5px/400–550 body · 10.5px caps labels
```

Status system (never colour alone — always icon + label): **green** completed/on-track · **blue** active/informational · **amber** approaching/needs attention · **red** overdue/missing/at-risk · **grey** inactive/not started.

Two registers, one system: adult surfaces use the neutral institutional style; the young-learner mode swaps to gradient activity cards, rounded 20px corners, stars/badges, large touch targets, minimal text — same tokens, warmer application.

## 4 · Application shell

- **Desktop:** fixed left nav (248px expanded / 72px icon-only, animated), brand mark, role-filtered items with badges, active pill, keyboard focus states, collapse control. Sticky translucent top bar: page title, institution selector (permitted roles), year/term selector, global search, notifications, help, profile.
- **Mobile (≤880px):** compact top header; bottom nav with the five key destinations + "More"; 44px+ targets; tables collapse to card lists; content bottom-padded above the bar.
- Institution branding: the brand mark and accent gradient are themable per consumer (existing `pqh_consumer_theme` fields map to `--primary` / `--primary-soft`).

## 5 · Screens (prototype coverage + specification)

For each screen: **Goal · Priority · Actions · Data · Permissions · Mobile · Empty · Error**

### 5.1 Platform admin dashboard
- **Goal:** platform health in 10 seconds; what needs intervention today.
- **Priority:** urgent attention panel ≥ KPIs ≥ trends.
- **Actions:** open ticket queue, review failed task, contact low-activity institution, assign teacherless courses, manage storage.
- **Data:** institution/user/course counts, MAU, live-session counts, ticket stats, uptime, storage — from scheduled aggregation (see §9), never live cross-tenant scans.
- **Permissions:** site admin / `local/prequran:manageplatform`-class capability.
- **Mobile:** KPIs 2-up; attention panel first.
- **Empty:** new platform → onboarding checklist card. **Error:** per-card fallback "Data unavailable — retry" without blanking the page.

### 5.2 Institution admin dashboard
- **Goal:** enrolment, attendance, completion, risk for my institution; who needs intervention.
- **Priority:** at-risk queue and KPIs above charts.
- **Actions:** open at-risk report, drill to course/teacher/student, export, message.
- **Data:** enrolments, attendance aggregates, completion, grade distribution, live-session counts — scoped by workspace/consumer.
- **Permissions:** workspace `owner/admin` (existing `pqh_user_can_manage_workspace`).
- **Filters:** year, term, branch, grade, course, teacher, student status, date range.
- **Mobile:** filters collapse into a sheet; charts stack. **Empty:** pre-term state points to onboarding/enrolment. **Error:** cards degrade individually.

### 5.3 Teacher dashboard
- **Goal:** "what do I do next" — Canvas's strongest idea, executed with our data.
- **Priority:** Start-next-class button → To-Do panel → course cards → analytics.
- **Actions:** start class (existing split-view launcher), grade, remind, reply, record attendance; every To-Do row carries its action button.
- **Data:** teacher's sessions today (`local_prequran_live_session`), grading queue (Moodle assign), unread messages, at-risk students (scoped via `teacher_student`/class groups), course progress.
- **Permissions:** teacher/marketplace-teacher role; students scoped exactly as today's dashboard scoping.
- **Mobile:** summary cards 2-up, To-Do first, course cards single column.
- **Empty:** no courses → "Create your first session / Find students" (marketplace) or "Awaiting assignment" (institution). **Error:** To-Do falls back to links to the underlying pages.

### 5.4 Student dashboard (older)
- **Goal:** what's due, what's missing, where to continue.
- **Priority:** missing work (red) → today's live class → due-this-week → course cards → feedback.
- **Actions:** continue course, submit missing work, join class.
- **Data:** own enrolments, due dates (calendar/assign), grades (gradebook), sessions.
- **Permissions:** self only. **Mobile:** continue button + up-next list first. **Empty:** "No courses yet — browse the catalog" (institution catalog page exists). **Error:** grade card shows "—" with retry.

### 5.5 Young-learner dashboard
- **Goal:** continue learning with zero reading friction; feel successful.
- **Priority:** one giant Continue button → today's activity cards → stars/badges → teacher message.
- **Actions:** continue, open story, join live class (managed-student join flow).
- **Data:** step-map progress (existing lesson progress records), next session, badges.
- **Permissions:** managed child accounts (existing `pqh_is_managed_student`); messaging stays inside guarded channels.
- **Mobile-first by nature**; no analytics widgets, no tables, no percentages — stars and "3 activities done!" language. **Empty:** friendly "Ask your teacher for your first lesson". **Error:** mascot-style "Try again" card.

### 5.6 Parent dashboard
- **Goal:** is my child okay, and what should I do this week.
- **Priority:** child selector → weekly summary → upcoming → strengths/support areas → grades → messages.
- **Actions:** observe live class (existing parent-observer flow), reply to teacher, open recommended activity; drill parent → child → course → lesson/assignment.
- **Data:** child progress/attendance/grades/feedback via existing parent-child cohort links; learning time from focus tracking (already recorded).
- **Permissions:** verified parent-child relationship only. **Mobile:** summary card first. **Empty:** "Link your child" flow. **Error:** per-card degrade.

### 5.7 Course homepage
- **Goal:** resume the course; see the next required thing.
- **Priority:** continue button + next required activity → modules → grades/attendance rail.
- **Actions:** continue, join live class, open module/activity, gradebook (teacher).
- **Data:** course, sections/modules with completion (core completion API), announcements (forum), grades, attendance, estimated time (course format data).
- **Permissions:** enrolment-based; teacher sees grading affordances.
- **Modules:** expandable sections showing count, %, locked/available, due dates, estimated time, continue.
- **Mobile:** rail stacks under modules. **Empty module:** "No activities yet". **Locked:** explicit reason ("Complete Unit 5").

### 5.8 At-risk student report (intervention dashboard)
- **Goal:** find and act on struggling learners before they fail.
- **Rules (configurable per tenant):** no login ≥ N days · ≥ N missing assignments · attendance < N% · grade decline ≥ N points · progress < N% · ≥ N missed live sessions · no participation · repeated failed assessments.
- **Columns:** student, institution, grade/stage, course, risk level, reasons, last activity, attendance, current grade, missing count, assigned teacher, recommended action.
- **Row actions:** message student · message parent · notify teacher · intervention note · assign follow-up · schedule meeting · mark reviewed. Notes/reviews write to the existing audit pattern.
- **Permissions:** admins tenant-wide; teachers see only their scoped students.
- **Mobile:** card view per student. **Empty:** "No students at risk 🎉 — rules run nightly." **Error:** last-good snapshot with timestamp.

## 6 · Reports catalogue

Student progress · course completion · assignment submission · attendance · live-class attendance · grade distribution · student engagement · teacher activity · parent engagement · institution activity · help-desk performance · login/inactivity · learning time · content usage · at-risk (§5.8) · enrolment trends · certificates issued · storage/media usage.

Every report: breadcrumbed drill-down level, filter bar, date range, KPI header, 1–3 charts, detail table, CSV/XLSX/PDF export, saved views, print stylesheet (prototype includes `@media print`).

**Tables:** search, sort, filter, pagination, column picker, sticky header, mobile card view, exports, saved filters, role-scoped rows, row actions; secondary data in expandable rows/drawers, never extra columns.
**Charts:** line = trends, bar = comparisons, stacked bar = submission status, donut only for single proportions, heatmap = activity patterns, progress bars = completion, sparklines in KPIs. Each: title, description, period, tooltip, `role="img"` + aria text alternative, data-table toggle, download.

## 7 · Dashboard customization

Widget rearrange (drag), show/hide, saved layouts, default filters, date-range preference, compact/comfortable density — persisted per user (Moodle user preferences API), with sensible role defaults. Ship defaults first; customization is Phase 2.

## 8 · Notifications & action design

Central panel grouped **Urgent / Requires action / Upcoming / Informational**; every notification deep-links to its student, assignment, course, live class, or ticket. Message/notification counts come from Moodle message API popups. Principle everywhere: **no passive reporting** — if a screen shows a problem, it shows the button that fixes it.

## 9 · Moodle implementation recommendations

**Packaging:** continue the proven pattern — these are pages of `local_hubredirect` (it already bypasses theme chrome, handles consumer branding, roles, and auth). A custom theme is *not* required; a small theme override remains optional later for Moodle-native pages.

**Data access:** all reads server-side in PHP via Moodle APIs (`enrol_get_users_courses`, completion API, gradelib, calendar, message API, capability checks) plus the existing `local_prequran` tables through `$DB`. Browser code talks only to our PHP endpoints / approved web services (`pqh_embedded_support_ws_token` pattern) — never SQL from the client.

**Aggregation:** platform/institution KPIs and at-risk detection run as scheduled tasks (pattern: `local_prequran\task\*`) writing to summary tables (`..._analytics_*` tables already exist as a home); dashboards read the summaries. Keeps dashboards fast on cheap hosting and slow links.

**Tenancy & privacy:** every query scoped by consumer/workspace exactly as today (`pqh_consumer_context_*`); parent-child via existing cohort links; child surfaces respect managed-student rules and guarded messaging; report access mirrors capabilities; exports honour the same scoping.

**Phasing:**
1. **Shell + teacher dashboard** (highest daily-use value) — reuse existing data functions from dashboard.php.
2. **Student + young-learner + parent** dashboards (young mode keyed off managed-student + age/stage field).
3. **Institution + platform dashboards** with aggregation tasks.
4. **Reporting spine + at-risk engine** with configurable rules, exports, saved views.
5. **Customization + notification center.**

**Performance:** no JS framework — server-rendered PHP + the prototype's vanilla CSS/JS patterns (the whole prototype is one file, no dependencies); skeleton loaders for async cards; empty/error states designed per card; WCAG 2.2 AA (contrast-checked tokens, keyboard nav, aria labels, focus rings, skip link — all present in the prototype).
