# Cohort Enrolment — integration steps (P1.7)

**2026-07-22.** Closes the **catalog → learner** loop: catalog_sync (P1.7) creates
the courses; this enrols the pilot learners into them. Once a learner is enrolled
in `ehel-{subj}-gNN`, the progress web service's `push_gradebook()` writes their
checkpoints as real grades in a course they belong to — the full chain from an
app tap to a gradebook entry is live.

## Pieces

| Piece | State | What it is |
|---|---|---|
| `tools/generate-ehel-cohorts.js` | ✅ live | Scaffolds `cohorts.json` from `catalog.json` — one cohort per grade (`ehel-pilot-gNN`) mapped to that grade's 3 courses. **Preserves** rosters already filled in on rerun. |
| `src/prototypes/ehel-academy/cohorts.json` | ✅ generated + deployed | The roster. On Bunny at `Ehel Primary/cohorts.json` (serves 200). Members start empty. |
| `src/moodle/local_prequran/classes/task/cohort_sync.php` | ⚠️ inert | Scheduled task: ensure cohorts → add **existing** users → `enrol_cohort` into mapped courses. Lints clean; does nothing until registered + configured. |

## 1. Fill the roster (you)

Edit `cohorts.json` — add learners to the right grade's `members[]`:

```json
{
  "idnumber": "ehel-pilot-g03",
  "name": "Ehel Pilot — Stage 3",
  "courses": ["ehel-eng-g03", "ehel-math-g03", "ehel-sci-g03"],
  "members": [
    { "username": "aisha.h", "firstname": "Aisha", "lastname": "H" },
    { "email": "yusuf@example.com" }
  ]
}
```

Each member needs a **`username` or `email`** that matches an **existing** Moodle
account (the task never creates users — see below). Re-running
`node tools/generate-ehel-cohorts.js` keeps your members and only refreshes the
cohort→course structure. Then redeploy:

```bash
BUNNY_KEY=… curl -X PUT \
  "https://storage.bunnycdn.com/ehelacademy/Ehel%20Primary/cohorts.json" \
  -H "AccessKey: $BUNNY_KEY" -H "Content-Type: application/json" \
  --data-binary @src/prototypes/ehel-academy/cohorts.json
```

## 2. Create the learner accounts first (prerequisite)

The cohort task only **adds existing users** to cohorts. Create the pilot accounts
via **Site administration → Users → Upload users** (CSV), or the admissions flow,
before running it. Rostered members that don't resolve are reported and skipped,
never created — this keeps a typo from silently minting an account.

## 3. Activate the task (on a Moodle instance you can test)

Same inert pattern as catalog_sync — four edits switch it on:

**`settings.php`** (inside `if ($hassiteconfig)`):
```php
$settings->add(new admin_setting_configtext(
    'local_prequran/cohorts_source_url',
    'Ehel cohorts URL',
    'cohorts.json the cohort-sync task reads to enrol pilot learners.',
    'https://ehelacademy.b-cdn.net/Ehel%20Primary/cohorts.json',
    PARAM_URL
));
```

**`lang/en/local_prequran.php`**:
```php
$string['task_cohort_sync'] = 'Ehel Academy cohort enrolment sync';
```

**`db/tasks.php`** (append; run after catalog_sync, e.g. 03:25):
```php
[
    'classname' => 'local_prequran\task\cohort_sync',
    'blocking'  => 0,
    'minute'    => '25',
    'hour'      => '3',
    'day'       => '*',
    'month'     => '*',
    'dayofweek' => '*',
],
```

**`version.php`** — bump `$plugin->version` (coordinate with the catalog/progress bumps).

Also confirm the **Cohort sync** enrolment method is enabled: Site administration
→ Plugins → Enrolments → Manage enrol plugins → **Cohort sync** (enabled by default).

Run **Notifications**, set the URL under the plugin settings, then **Site admin →
Server → Scheduled tasks → Ehel Academy cohort enrolment sync → Run now**.

## 4. Verify

```sql
-- cohort exists with members
SELECT ch.idnumber, COUNT(cm.userid) members
  FROM {cohort} ch LEFT JOIN {cohort_members} cm ON cm.cohortid = ch.id
  WHERE ch.idnumber LIKE 'ehel-pilot-%' GROUP BY ch.idnumber;
-- cohort-enrol instance links cohort → course
SELECT c.idnumber course, e.enrol FROM {enrol} e
  JOIN {course} c ON c.id = e.courseid
  WHERE e.enrol = 'cohort' AND c.idnumber LIKE 'ehel-%';
-- learners actually enrolled
SELECT c.idnumber, COUNT(ue.id) enrolled FROM {user_enrolments} ue
  JOIN {enrol} e ON e.id = ue.enrolid JOIN {course} c ON c.id = e.courseid
  WHERE e.enrol = 'cohort' AND c.idnumber LIKE 'ehel-%' GROUP BY c.idnumber;
```

Then a rostered learner opening `app/{subject}/…?studentid=<their id>` with the
progress WS in remote mode writes a `checkpoint.result` that lands as a grade in
their now-enrolled course — the catalog → learner → gradebook chain end to end.

## The full chain, now closed

```
catalog.json → catalog_sync → courses + grade items (by idnumber)      [P1.7]
cohorts.json → cohort_sync   → learners enrolled (cohort → course)      [P1.7 · this]
app checkpoint → ProgressClient(remote) → progress_ingest → push_gradebook
   → grade on the enrolled learner in the synced course                [P1.4]
```

## Notes

- **Idempotent.** Cohorts by idnumber, memberships via `cohort_is_member`,
  enrol links via an existing-instance check. Re-running only fills gaps.
- **Un-enrolment.** Removing a member from `cohorts.json` does not currently
  un-enrol them (the task only adds). Manage leavers in Moodle directly, or extend
  the task to reconcile memberships if the pilot needs it.
- **One cohort per grade.** A learner belongs to their grade's cohort and is
  enrolled in all three subject courses for that grade at once.
