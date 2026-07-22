<?php
// Institution-onboarding portal library (prefix pqiob_) — companion to the
// token-gated portal handler portal_handlers/institution-onboarding.php.
//
// The legacy page local_hubredirect/institution_onboarding.php defines NO
// functions of its own: every helper it uses (pqhi_* option lists, slug/domain
// cleaners, consumer/workspace upserts) already lives in
// local/hubredirect/institutionlib.php, and its access + table helpers (pqh_*)
// live in local/hubredirect/accesslib.php. Both are shared libraries and are
// required directly by the handler — never copied here.
//
// There is therefore nothing to extract verbatim, so this file is intentionally
// a guard-only stub (zero top-level code, zero output when included). It exists
// only to keep the one-portallib-per-report naming convention consistent with
// platform_consumers_portallib.php and parent_trust_portallib.php.

defined('MOODLE_INTERNAL') || die();

// (No page-defined functions to port — see comment above.)
