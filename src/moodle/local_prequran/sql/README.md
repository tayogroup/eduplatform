# SQL scripts

Ad-hoc scripts written to inspect and repair the live Moodle database while
building features. They are kept because the diagnosis they encode is worth
having again — not because they are a supported interface.

**Read the script before you run it.** Most were written for one situation on
one instance, and several hardcode the database name `ehelacad_quraantest` and
the table prefix `mdlgx_`. On any other instance those are wrong.

## Which scripts write

The prefix tells you the intent, and it is reliable — every script was checked
against what it actually contains:

| Read-only (safe to run any time) | Modifies data |
|---|---|
| `verify_*` (129) · `check_*` (19) · `list_*` · `identify_*` · `find_*` · `audit_*` · `count_*` · `pull_*` | `create_*` (16) · `alter_*` (13) · `fix_*` (10) · `repair_*` (7) · `add_*` (6) · `seed_*` (5) · `reset_*` (3) · `rename_*` (3) · `set_*` · `link_*` · `archive_*` · `cleanup_*` · `widen_*` · `upgrade_*` |

The read-only ones are `SELECT`s: run them freely to answer "what is the
current state?" The rest change the database.

Three `seed_*` scripts contain `DROP`/`TRUNCATE`/`DELETE` and exist to build or
rebuild test data:

- `seed_existing_moodle_enrolments_into_course_offerings.sql`
- `seed_multicourse_dual_enrolment_students.sql`
- `seed_multicourse_test_students.sql`

Never run those against an instance holding real student records.

## Schema scripts vs the plugin upgrade

`add_*` and `alter_*` scripts that add columns are **twins of steps in
`db/upgrade.php`** — written so a column can be added by hand when the plugin
upgrade cannot be run immediately. For example
`add_student_availability_json.sql` mirrors upgrade step `202607310030`.

The plugin upgrade is the real mechanism. If you apply a twin script by hand,
still run the upgrade afterwards: it records the version, and some steps do
work beyond the column (the availability one backfills existing rows). Applying
a twin is idempotent-ish, not authoritative.

## Before running anything that writes

1. Read it, including the `WHERE` clauses. Every write here is scoped to
   specific ids or slugs — none is an unguarded `UPDATE`/`DELETE` — but the
   scope was chosen for one instance's data and may not match yours.
2. Confirm the database name and prefix in the script match your target.
3. Take a backup, or at minimum run the matching `check_*`/`verify_*` script
   first and keep its output so you can tell what changed.
4. Run it once. Re-running a `fix_*` is usually harmless but was not designed
   for it.

## Naming new scripts

Keep the prefix honest — `check_`/`verify_` for anything read-only, and a
writing prefix for anything that is not. Someone deciding whether it is safe to
run should be able to tell from the filename, and that is only true if the
convention holds.
