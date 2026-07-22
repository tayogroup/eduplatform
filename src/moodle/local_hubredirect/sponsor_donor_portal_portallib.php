<?php
// Sponsor/donor portal query library — companion to the token-gated portal
// endpoint (portal_handlers/sponsor-donor-portal.php).
//
// sponsor_donor_portal.php defines NO functions of its own: every helper it
// uses is a SHARED library that stays in place and is require_once'd by the
// handler (never copied) —
//   - pqss_*  (schema/pledge/student helpers) : scholarship_sponsorlib.php
//   - pqfin_* (invoice/commitment/money)       : finance_lib.php
//   - pqh_*   (workspace access + consumer ctx) : accesslib.php
//
// There is therefore nothing page-defined to extract here. This file exists to
// satisfy the standard per-page portallib contract and carries only the
// MOODLE_INTERNAL guard so it is safe to require from the handler.

defined('MOODLE_INTERNAL') || die();
