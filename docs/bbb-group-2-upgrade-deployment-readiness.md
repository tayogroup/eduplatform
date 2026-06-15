# Group 2: Data Integrity, Upgrade Safety, and Deployment Readiness

This group moves the live-session schema away from one-off phpMyAdmin `ALTER TABLE` scripts and into Moodle's install/upgrade lifecycle.

## Implemented

- Added `local/prequran/db/upgradelib.php`.
- Added `local/prequran/db/install.php`.
- Added `local/prequran/db/upgrade.php`.
- Bumped `local_prequran` version to `2026051201`.
- Added guarded table, field, and index creation for the live-session schema.
- Added a consolidated schema readiness script: `local/prequran/sql/verify_live_schema_readiness.sql`.

## Deployment Steps

1. Upload the updated `local/prequran` files.
2. Go to Moodle administration and run the plugin upgrade.
3. Purge Moodle caches.
4. Run `verify_live_schema_readiness.sql` in phpMyAdmin.
5. Confirm all required tables and columns show `PRESENT`.
6. Confirm the duplicate BBB meeting ID query returns zero rows.
7. Open Live Diagnostics, Live Sessions, Teacher Workspace, Parent Trust Dashboard, and Admin Operations Dashboard.

## Why This Matters

The upgrade code is idempotent. If a table, column, or index already exists, Moodle skips it. This prevents the duplicate-column failures seen during earlier phases.

## Production Notes

- The upgrade builder does not remove old columns or indexes. It only creates missing required schema.
- Existing manually-created data is preserved.
- Fresh installs now receive the live schema through `install.php`.
- Existing installs receive the live schema through `upgrade.php`.
- Keep manual SQL files as reference and verification assets, but prefer Moodle upgrade for production changes.

## Rollback Readiness

Before production upgrade:

1. Take a database backup.
2. Take a copy of `local/prequran` and `local/hubredirect`.
3. Record the current `local_prequran` plugin version.
4. Run the upgrade during a low-traffic window.
5. If upgrade fails, restore the database backup first, then restore the previous plugin files.
