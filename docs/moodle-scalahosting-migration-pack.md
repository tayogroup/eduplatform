# Moodle Migration Pack: hosting.com → ScalaHosting

**Last verified against the repo: 2026-08-05.** Facts marked *[verified]* were checked
against `src/moodle/` on that date. Facts marked *[ops]* come from operational sessions
and live server output, not from this repo — re-confirm them against the live box before
acting. Facts marked *[decide]* are open questions with no answer yet.

This pack supports a controlled migration from the current cPanel host into fresh Moodle
installations on ScalaHosting.

The goal is not to clone the old site. The goal is:

1. Install clean Moodle core on ScalaHosting.
2. Install required plugins cleanly, through Moodle's own install/upgrade lifecycle.
3. Move Moodle learning data with Moodle-native tools where possible.
4. Move project-specific plugin data with targeted SQL exports/imports.
5. Re-enter secrets and host-specific settings deliberately.

## Migration Rule

Do not import the full old Moodle database over the fresh ScalaHosting database.

Use Moodle backup/restore for courses and files, CSV/admin tools for users where possible,
and targeted SQL only for data that belongs to the PreQuran custom tables or carefully
selected Moodle configuration tables.

---

## Phase 0: Current State (the source you are migrating from)

The live platform is **not** on ScalaHosting today. Several planning sessions asserted it
was — it is not. Only DNS is on ScalaHosting nameservers, which is what makes the two look
interchangeable.

| Property | Value |
|---|---|
| Host | hosting.com shared cPanel *[ops]* |
| Server | `s4478.usc1.stableserver.net` (cPanel on :2083) *[ops]* |
| IP | `198.38.90.19` *[ops]* |
| Docroot | `~/quraantest.academy` *[ops]* |
| Database | `ehelacad_quraantest`, prefix `mdlgx_` *[ops]* |
| `$CFG->dataroot` | `/home/ehelacad/moodledata_quraantest` *[verified]* — outside the web root ✔ |
| PHP | LiteSpeed (`lsphp`); OPcache flushed by `pkill lsphp` *[ops]* |
| TLS | cPanel AutoSSL *[ops]* |

Regional context: the operator is based in **Nairobi, Kenya**. See
[Data Protection](#data-protection-kenya) — this constrains which target jurisdictions are
viable and is not a formality.

### Domains — the part the old pack missed entirely

`src/moodle/config-custom-domains-snippet.php` *[verified]* maps **~60 hostnames** across
six consumer families onto one Moodle install, setting `$CFG->wwwroot` per request:

```text
eduplatform.ai          (+ www, app)          — the platform identity
ehelacademy.org         (+ www, app)
quraanacademy.org       (+ www, app)
edufortomorrow.com      (+ www, app)
quraantest.academy · quraan.academy · quraanacademy.info · uniso.site
k-12 / languages / skills / tech / adult .ehelacademy.org
    each with app· students· teachers· parents· admins· finance· subdomains
```

Migration implications, none of which the previous version of this pack covered:

- **Every hostname needs DNS + a valid certificate on the new host before cutover.** This
  is the single largest volume of manual work in the whole migration. Batch it, and verify
  issuance per host — the `skills.*` AutoSSL failure in July showed that DNS pointing at a
  server is not the same as the panel knowing about the subdomain.
- **`$CFG->sessioncookiedomain`** is set from the host labels so one session spans the
  role portals of a school. Reproduce this exactly or users bounce between role subdomains
  as logged-out.
- **`$CFG->sessioncookie = 'ep1'`.** Changing this suffix logs every user out. Carry the
  value across unchanged; do not "clean it up" during the move.
- **`$CFG->directorypermissions = 0777`** *[verified]*. Carried from the shared host. On a
  VPS with a single site owner this should be tightened (`0755` / `02775`) — do it as a
  deliberate step on the fresh install, and verify file uploads still work.
- **Docroot naming.** The current docroot is named for a consumer (`quraantest.academy`),
  not the platform. The decision taken on 2026-07-20 was to fix this *at the migration*:
  name the new docroot for the platform (`eduplatform.ai`) and map all domains to it. This
  is the migration's one free opportunity to correct it.

---

## Phase 1: Target Topology

Decided 2026-07-21, recorded in [ehel-academy-scale-plan.md §0](ehel-academy-scale-plan.md).
Four tiers, **one pinned Moodle version everywhere**, all deployed tiers on ScalaHosting +
Bunny for full version-and-host parity. hosting.com is retired from the topology — kept
only as the live legacy site until production cutover, then decommissioned.

| Tier | Moodle backend | Bunny base path |
|---|---|---|
| local / unit | Local Moodle (Docker/SPanel), pinned to ScalaHosting's version | `ehel_unit/` |
| intg | ScalaHosting (shared VPS) | `ehel_integration/` |
| staging | ScalaHosting (shared VPS) | `ehel_staging/` |
| production | ScalaHosting (isolated VPS) | `ehel/` |

Rationale: a Moodle version split across tiers is disqualifying — lower tiers would test
plugins against a Moodle you don't ship. Consolidating means every promotion tests exactly
what ships.

### Server sizing — for 1000 learners

Sizing assumes ~1000 registered learners on a school-day rhythm, giving **100–150 peak
concurrent sessions**. The box is lighter than a stock Moodle because content and media are
served from Bunny and live video from BBB; Moodle handles auth, launch, portal PHP,
gradebook and progress-web-service writes only.

| Tier | ScalaHosting plan | Spec | Intro | Renewal |
|---|---|---|---|---|
| Production (isolated) | Managed Cloud **Build #4** | 4 cores / 8 GB / 240 GB NVMe | $94.95/mo | $244.95/mo |
| Staging + intg (shared) | Managed Cloud **Build #3** | 3 cores / 4 GB / 120 GB NVMe | $69.95/mo | $170.95/mo |
| | | **Total** | **$164.90/mo** | **$415.90/mo** |

Notes:

- **Build #3, not #2, for non-prod.** Build #2's 2 GB must hold two Moodle sites, two
  databases and Redis; it will swap. Staging matches prod for *fidelity* (PHP/MySQL
  versions, extensions, OPcache/Redis config), not capacity — 4 GB is the floor where that
  is still true.
- **Budget on the renewal price**, not the intro price. The intro is ~40% of renewal.
- Build #4 is the top of the published range. Confirm what exists above it before
  committing, so growth past 1000 users is not another migration. *[decide]*

### Sequencing — non-prod first, as a paid evaluation

Do **not** move production first. The topology already brings intg and staging up first;
use that as evidence-gathering rather than mere provisioning.

1. Order **Build #3 only**. Leave production on hosting.com.
2. Migrate integration onto it. Run it 4–8 weeks.
3. In that window verify: PHP and MariaDB/MySQL versions against the pinned Moodle;
   Redis available; **cron at one-minute granularity**; CLI PHP over SSH; and — the step
   everyone skips — **a real restore from their backup**.
4. Open one deliberately awkward support ticket and judge the response.
5. Only then order Build #4 and move staging, then production.

If ScalaHosting disappoints, the cost of finding out is a few hundred dollars rather than
the live site and 1000 learners.

### Questions to answer before ordering *[decide]*

1. PHP and MariaDB/MySQL versions available — do they meet the pinned Moodle's minimums?
2. Is **Redis** available for the MUC store?
3. Is **cron permitted at one-minute granularity**? (Moodle requires it; some managed
   plans cap at 5 or 15 minutes. `local_prequran` registers **19 scheduled tasks**
   *[verified]* — `db/tasks.php`.)
4. SSH with CLI PHP, so `admin/cli/*.php` works — the current deploy and sync workflow
   depends on it.
5. What the automatic offsite backups actually cover: database included? retention?
   self-service restore?
6. What plan sits above Build #4?

---

## Phase 2: Hard Prerequisites — fix in the repo BEFORE provisioning

These are blockers. A fresh install of this platform is **not currently reproducible**, and
a migration is precisely a fresh install. Each item below was verified on 2026-08-05.

### 2.1 The plugin install lifecycle is incomplete — the top blocker

- **No `install.xml` exists for any plugin** *[verified]* — `src/moodle/*/db/install.xml`
  matches nothing. All tables are created programmatically via
  `xmldb_local_prequran_create_table_if_missing()` in `db/upgradelib.php` *[verified]*,
  plus **16 manual `sql/create_*.sql` files** *[verified]*:

  ```text
  create_comm_phase1.sql          create_seb_exam_tables.sql
  create_intake_request.sql       create_speakrec.sql
  create_live_availability.sql    create_student_grouping.sql
  create_live_series.sql          create_submitrec.sql
  create_live_sessions.sql        create_teacher_intake.sql
  create_missing_live_sessions.sql create_teacher_marketplace.sql
  create_practice_coach.sql       create_teacher_student.sql
  create_virtual_tutor_schema.sql create_workspace_schema.sql
  ```

  (The previous version of this pack listed 7 of these. It was already out of date.)

- **`local_hubredirect` has no `version.php`** *[verified]* — only `local_prequran` has
  one. Moodle cannot install or upgrade `local_hubredirect` through the plugin lifecycle at
  all; it is a page bundle that creates and reads tables opportunistically behind
  `table_exists()` guards.

**Best option:** add the still-required tables to the install/upgrade lifecycle and give
`local_hubredirect` a `version.php` **before** the production cutover.
**Operational fallback:** run the relevant `CREATE TABLE IF NOT EXISTS` scripts once on the
target after the fresh plugin install and before importing rows — and record exactly which
ones were run, because that record becomes the only description of the schema.

### 2.2 The custom-table inventory must be regenerated, not hand-maintained

The old pack hand-listed **31** tables. A mechanical scan of `src/moodle/` finds **331
distinct `local_prequran_*` identifiers used in table positions** (`$DB->` arguments, `{…}`
SQL braces, `mdlgx_`-prefixed SQL) *[verified]*; a July security audit put the true table
count at roughly **150**. Either way the hand-list is an order of magnitude short and any
import order derived from it is incomplete.

**Do not hand-maintain this list.** Generate it from the source database at migration time:

```sql
SELECT table_name, table_rows
FROM information_schema.tables
WHERE table_schema = DATABASE()
  AND table_name LIKE 'mdlgx_local_prequran%'
ORDER BY table_name;
```

Then order the import by dependency, not alphabetically — the principle in Phase 6 still
holds even though its 31-row list does not.

### 2.3 `local_prequran_seb_proctor` will dominate disk and backups

The table stores base64 `data:image/jpeg` webcam frames in an `imagedata` column, plaintext,
capped at 260 KB per frame *[verified]* (`db/upgradelib.php`, `sql/create_seb_exam_tables.sql`).

At 1000 learners under proctored assessment this becomes the fastest-growing object in the
system, it sits on the same NVMe as everything else, and it inflates every backup and every
migration dump.

**Move these frames to file storage (or Bunny) with a retention window before the
migration**, while the dataset is still small. Doing it afterwards just relocates the
problem to the new host first. `local_prequran\task\data_retention` *[verified]* already
exists as the natural home for the policy.

### 2.4 Redis MUC + tuned OPcache (P1.10)

Not optional at 1000 users. Without it you will attribute cache-configuration problems to
the VPS, and a bigger box will not fix them. Configure on the target at install time, not
after go-live.

### 2.5 Plugin list correction

The previous pack instructed installing `src/moodle/local_ehelhome`. **That path does not
exist** *[verified]* — `src/moodle/` contains only `local_prequran`, `local_hubredirect`,
plus `course_format_reference/` and `teacher/` (not plugins). `local_ehelhome` was
uninstalled from the live site in July, along with `mb2builder` and `mb2megamenu` *[ops]*.
Do not reinstall any of the three.

---

## Phase 3: Fresh ScalaHosting Install

Install a fresh Moodle site per tier. Pin one Moodle version across all tiers.

1. Create a new database and database user.
2. Install Moodle core fresh.
3. Configure HTTPS and the dynamic `$CFG->wwwroot` (carry
   `config-custom-domains-snippet.php` across — including `sessioncookiedomain` and
   `sessioncookie = 'ep1'`).
4. Configure cron — confirm one-minute granularity.
5. Configure mail/SMTP.
6. Configure timezone (**Africa/Nairobi** — confirm against the learner base rather than the
   operator's location *[decide]*).
7. Confirm `moodledata` is outside the public web root.
8. Confirm required PHP extensions are enabled.
9. Configure Redis for the MUC store.
10. Set directory permissions deliberately (see Phase 0) rather than inheriting `0777`.

### Plugin installation

```text
src/moodle/local_prequran    ->  local/prequran
src/moodle/local_hubredirect ->  local/hubredirect
```

```text
local_prequran version: 202606150002        release: 0.1.2-pilot
    requires: Moodle 2022041900 or newer
local_hubredirect: page bundle, NO version.php — see Phase 2.1
```

After uploading plugin code: visit Site administration → run the install/upgrade prompts →
purge caches → confirm tables were created by the Moodle upgrade path, not by hand →
reinstall any remaining third-party plugins from original sources at matching versions.

---

## Phase 4: Moodle Core Data Move

Use Moodle-native tools first.

- **Users**: CSV import if history is not critical; course backup/restore with user data if
  it is.
- **Courses/categories**: Moodle backup/restore.
- **Course and activity files**: Moodle backup/restore, not raw SQL.
- **Cohorts/groups/groupings**: admin export/import or course restore.
- **Enrolments**: course restore with user data, or recreate via CSV/enrolment methods.
- **Roles/capabilities**: recreate manually unless there are many custom roles. Note
  `xmldb_local_prequran_ensure_school_principal_role()` and
  `..._ensure_sqa_tester_role()` *[verified]* create two roles programmatically.

Handle carefully:

- Passwords may not migrate cleanly if auth settings differ.
- **User IDs must be preserved or mapped before importing custom tables.**
- Course, cohort, group and context IDs may differ on the target.
- File API records depend on `moodledata/filedir`; never move file rows without their files.

---

## Phase 5: Custom Table Export

Generate the inventory per Phase 2.2, then run:

```text
src/moodle/local_prequran/sql/migration/source_inventory.sql
src/moodle/local_prequran/sql/migration/custom_table_export_list.sql
```

Treat the output as a planning list, not as proof a table is safe to import directly. Any
table containing Moodle user, course, cohort, group or context IDs, or File API references,
must be checked against target IDs first.

---

## Phase 6: Import Order

Import only after users, courses and cohorts exist on the target. Order by dependency:

1. Configuration and reference data (`stepcfg` and equivalents).
2. Identity and relationship tables (`student_profile`, `teacher_profile`,
   `teacher_student`, `intake_request`).
3. Grouping (`group_pool`, `class_group`, `group_member`).
4. Progress and recordings (`lessonprog`, `stepprog`, `focuslog`, `focusagg`, `speakrec`,
   `submitrec`).
5. Communications (`comm_thread`, `comm_participant`, `comm_message`, `comm_consent`).
6. Live operations (`live_availability`, `live_consent`, `live_series`, `live_session`,
   `live_participant`, `live_attendance`, `live_note`, `live_recording`, `live_ack`,
   `live_audit`).
7. Quiz analytics (`quiz_attempt`, `quiz_pass`, `quiz_question`).
8. Everything else the generated inventory surfaces — finance, admissions, workspace,
   marketplace, SEB, safenet, wellness — ordered by foreign-key dependency.

**If IDs differ between source and target, build mapping tables first. Do not import
directly.**

---

## Phase 7: Settings To Recreate Manually

Re-enter, never copy:

- `$CFG->wwwroot`, database, dataroot, cache settings
- SMTP credentials
- BigBlueButton base URL and shared secret
- ElevenLabs / OpenAI / TTS API keys
- Anthropic key for the Wehel tutor
- WhatsApp/Meta/webhook credentials
- Web service tokens (issue **new** ones; do not reuse hosting.com tokens)
- OAuth/SSO secrets
- Payment provider keys
- Any hosting-specific paths

Copy only after review: non-secret `local_prequran` settings, web service service
definitions, role capabilities, scheduled-task enablement and frequency.

### The Bunny / app tier — absent from the old pack

The Moodle box is only half the platform. Also re-point or re-verify per tier:

- **Bunny base path** for the tier (`ehel_unit/`, `ehel_integration/`, `ehel_staging/`,
  `ehel/`) and the storage zone.
- **`catalog.json` and `cohorts.json` URLs** consumed by
  `local_prequran\task\catalog_sync` and `\task\cohort_sync` *[verified]*.
- **Progress web service** endpoints and tokens.
- **App version pointer** (`app/vN/` + `current.json`) and the Bunny cache Edge Rules.
- **`course_launch.php` still resolves only `integration` / `staging` / `production` with
  `/pre_quraan*/` base paths** *[verified, `course_launch.php:38-79`]* — the `unit` env and
  the `ehel` prefix are **not implemented**. That is change-register item P1.8 and it is a
  prerequisite for the four-tier topology, not a follow-up.
- The hardcoded `quraantest` endpoint in the public intake page becomes per-environment
  config as part of this work.

---

## Phase 8: Post-Migration Verification

```text
src/moodle/local_prequran/sql/migration/target_post_migration_verification.sql
src/moodle/local_prequran/sql/verify_live_schema_readiness.sql
src/moodle/local_prequran/sql/verify_group_1_access_security.sql
src/moodle/local_prequran/sql/verify_group_4_production_smoke.sql
src/moodle/local_prequran/sql/verify_group_5_monitoring_runbook.sql
src/moodle/local_prequran/sql/verify_group_12_consistency_audit.sql
```

The target verification script assumes the expected tables exist; a missing-table failure
sends you back to Phase 2.1, not forward.

**Browser checks** — legacy hubredirect surfaces:

```text
/local/hubredirect/dashboard.php        /local/hubredirect/live_teacher.php
/local/hubredirect/live_admin.php       /local/hubredirect/live_schedule.php
/local/hubredirect/live_ops.php         /local/hubredirect/live_summaries.php
/local/hubredirect/live_diagnostics.php /local/hubredirect/live_recordings.php
/local/hubredirect/quiz_report.php
```

Plus the portal surfaces and the learner apps, and **one host from each of the six domain
families** (certificate valid, correct `wwwroot`, session survives a hop between two role
subdomains of the same school).

**Role checks**: admin sees diagnostics; teacher sees only assigned students; parent sees
only linked children; student sees only own schedule; anonymous users are refused.

**Web service checks**: the PreQuran service exists and is enabled; functions from
`local/prequran/db/services.php` are registered; a **new** token is issued for external
integrations.

**Host-parity smoke test** (the class of bug that already bit you on hosting.com): OPcache
invalidation on deploy, cron actually firing, TTS proxy, file paths, DB prefix, Redis MUC
in use.

---

## Backup and Disaster Recovery

There is **no database backup automation in this repo**, and no documented RPO or RTO.
`local_prequran_backup_check` is an operator evidence log — it records that a human claims
to have done a backup; it performs none.

A host move is exactly when this gets discovered. Before cutover, define and test:

- Database backup schedule, retention, and off-box copy.
- `moodledata/filedir` backup (Bunny is **not** a backup of this).
- A written **RPO and RTO**, signed off.
- **A restore rehearsal on the non-prod VPS** — restore is the only part that matters, and
  the only part nobody tests.

Note that Bunny Storage is the system of record for delivered media, and media is not in
git long-term; the rebuild path is the generator scripts plus the hash manifests, not the
binaries. Static content JSON is rebuildable from `src/`.

---

## Data Protection (Kenya)

The operator is in **Nairobi**; learners are **minors**; the platform holds identity,
payment, health/wellness and biometric (webcam proctoring) data. This is not a formality
and it may constrain which target jurisdictions are viable — settle it **before** signing a
hosting contract. *[decide]*

Under the **Data Protection Act 2019**:

- Transferring **sensitive personal data** out of Kenya requires the data subject's consent
  *and* confirmation of appropriate safeguards.
- Children's data carries additional obligations; the ODPC has issued a dedicated guidance
  note on processing it.
- The Cabinet Secretary may prescribe categories of processing that must occur on a server
  or data centre located in Kenya.
- Data controllers and processors must register with the ODPC.

Every option under consideration — ScalaHosting, and the current US-Central box most of all
— is a cross-border transfer. That is permissible but must be *documented*: parental consent
capture, standard contractual clauses with the host, ODPC registration. This is a question
for Kenyan counsel, and it is the same body of work as change-register item **P0.6**
(privacy policy, terms, consent).

Practical consequence for host choice: prefer a target region you can defend on paper, and
record the reasoning in the go/no-go below.

---

## Optional: a Moodle Certified Partner engagement

ScalaHosting manages the server; nobody there will manage *Moodle*. For the Moodle-level
problems in Phase 2 — the install lifecycle, the schema and retention review across ~150
tables, upgrade strategy against that much custom surface, and the DR plan — a Moodle
Certified Partner is the specialist you cannot buy from a hosting provider.

Recommended shape: a **bounded project engagement**, not a hosting move. Partner hosting
would route every plugin change through their pipeline on their turnaround, which is better
engineering than the current SSH file-drop but would throttle a platform still changing
daily.

Shortlist, ranked for a Nairobi operator (timezone overlap dominates, because Bunny already
serves learner-facing content from the edge and this is about support responsiveness rather
than latency):

1. **Eummena** — Gulf offices at UTC+3, identical working day to EAT; MENA/Islamic-education
   market fit.
2. **Adapt IT** (South Africa) — explicitly serves Kenya; SAST is one hour behind EAT;
   African regulatory familiarity and likely friendlier invoicing. Tertiary-focused rather
   than K-12.
3. **Titus Learning** (UK + UAE) — schools-and-colleges specialists, strongest Cambridge
   curriculum fit.
4. **Synergy Learning** (UK/IE/DE) — solid, least differentiated here.
5. **Catalyst IT** — best pure engineering (Moodle core contributors), but AU/NZ centre of
   gravity is 7–9 hours off Nairobi and it is the most expensive.

Decide on the answer to one question: *what is your turnaround on a change to a
client-owned plugin, and is it self-service?*

---

## Go/No-Go Decision

```text
Migration date:
Tier being cut over:            intg / staging / production
Source site:
Target site:
Source Moodle version:
Target Moodle version:
Source DB prefix:               mdlgx_
Target DB prefix:

PREREQUISITES (Phase 2)
Install lifecycle complete (install.xml / version.php):
Custom table inventory regenerated from information_schema:
seb_proctor frames offloaded + retention policy live:
Redis MUC + OPcache configured:

PROVISIONING
Plan ordered and sized:
Pre-order questions answered in writing:
Non-prod evaluation completed (weeks run):
Backup restore rehearsal passed:

MIGRATION
Fresh Moodle install confirmed:
Plugins installed via lifecycle (not manual SQL):
Manual create_*.sql scripts run (list which):
Courses restored:
Users restored + ID mapping verified:
Custom tables imported:
Secrets recreated:
Cron confirmed at 1-minute granularity:
Web services confirmed + new tokens issued:

DOMAINS
All ~60 hostnames resolving:
Certificates issued for all hostnames:
sessioncookiedomain + sessioncookie='ep1' carried across:
Docroot named for the platform:

BUNNY / APP TIER
Tier base path + storage zone repointed:
catalog.json / cohorts.json URLs updated:
course_launch.php env support (P1.8) shipped:
Progress web service verified:

COMPLIANCE
Kenya DPA position documented (counsel sign-off):
ODPC registration current:
Parental consent capture live:
Data residency decision recorded:

VERIFICATION
SQL verification passed:
Role browser checks passed:
Host-parity smoke test passed:
One host per domain family verified:

RPO / RTO agreed:
Rollback plan + trigger defined:
Known issues:
Decision: GO / NO-GO
Approved by:
```

### Rollback

Until production cuts over, hosting.com remains live and authoritative — rollback is DNS.
After cutover, rollback means restoring the source site and re-pointing ~60 hostnames, so
**define the rollback trigger and the maximum decision window before you start**, not
during the incident.
