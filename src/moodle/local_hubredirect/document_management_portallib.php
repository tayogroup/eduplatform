<?php
// Document-management portal library — companion to portal_handlers/
// document-management.php (token-gated parallel-run of document_management.php).
//
// GUARD-ONLY: document_management.php defines NO functions of its own. Every
// helper it uses is a SHARED function that already lives in an existing library
// and is NOT copied here (per the migration contract "shared not copied"):
//   - pqh_*    -> local/hubredirect/accesslib.php
//   - pqwdoc_* -> local/hubredirect/workflow_documentlib.php
// The handler requires those libraries directly. This file exists only to keep
// the per-page lib naming convention consistent; it declares nothing.
//
// The legacy page keeps its inline includes and stays untouched (parallel-run).

defined('MOODLE_INTERNAL') || die();
