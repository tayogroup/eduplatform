<?php
// Bulk import/export portal library — companion to portal_handlers/
// bulk-import-export.php (token-gated parallel-run of bulk_import_export.php).
//
// GUARD-ONLY: bulk_import_export.php defines NO functions of its own. Every
// helper it uses is a SHARED function that already lives in an existing library
// and is NOT copied here (per the migration contract "shared not copied"):
//   - pqh_*   -> local/hubredirect/accesslib.php
//   - pqdo_*  -> local/hubredirect/data_operationslib.php
// The handler requires those libraries directly. This file exists only to keep
// the per-page lib naming convention consistent (prefix pqbietl_); it declares
// nothing.
//
// The legacy page keeps its inline includes and stays untouched (parallel-run).

defined('MOODLE_INTERNAL') || die();
