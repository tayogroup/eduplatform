# BBB Student Grouping Foundation

This adds the first implementation layer for flexible student grouping before launch.

## Implemented

- Student learning profiles:
  - time zone
  - language
  - age and age band
  - current level
  - base of learning
  - country
  - city
  - gender
  - availability
  - parent preferences
- Matching pools for admin-defined rules.
- Actual live class groups for teacher assignment and schedule planning.
- Group membership with match score and match status.
- `groupid` links on live sessions and recurring series.
- Admin grouping page: `/local/hubredirect/live_grouping.php`.
- Admin menu and dashboard links.
- One-time and recurring session wizards can use a class group to pull active students automatically.
- Verification SQL: `src/moodle/local_prequran/sql/verify_student_grouping.sql`.

## Recommended Workflow

Use this order:

1. Create or update student profiles.
2. Create a matching pool for compatible students.
3. Create a class group from the pool.
4. Assign suggested students into the class group.
5. Use the class group in the session or series wizard.

## Matching Logic

The first implementation uses a transparent scoring model:

```text
Time zone: 30
Current level: 25
Base of learning: 15
Age range: 10
Language: 10
Gender policy: 5
Country: 3
City: 2
```

Match labels:

```text
80-100: best_match
60-79: good_match
40-59: review
0-39: weak_match
```

Admins can still override by assigning a student manually. The assignment is audited.

## Tables

```text
local_prequran_student_profile
local_prequran_group_pool
local_prequran_class_group
local_prequran_group_member
```

Additional links:

```text
local_prequran_live_session.groupid
local_prequran_live_series.groupid
```

## Testing

After uploading the code and running the Moodle upgrade:

1. Open `/local/hubredirect/live_grouping.php` as admin.
2. Add a profile for a test student.
3. Create a matching pool.
4. Create a class group.
5. Confirm the suggested assignment appears.
6. Assign the student.
7. Open `/local/hubredirect/live_create_wizard.php`.
8. Choose the class group on the Students step.
9. Confirm the active group members are included.
10. Repeat with `/local/hubredirect/live_series_wizard.php`.

Run:

```text
src/moodle/local_prequran/sql/verify_student_grouping.sql
```

## Notes

The preferred production path is Moodle plugin upgrade, not manual SQL. The manual SQL file exists for inspection and emergency database setup only. If running SQL manually, check whether `groupid` already exists on `local_prequran_live_session` and `local_prequran_live_series` before running the `ALTER TABLE` statements.

