<?php
// Institution-inquiry query library — companion to the token-gated portal
// endpoint (portal_handlers/institution-inquiry.php). The legacy page
// local_hubredirect/institution_inquiry.php defines NO functions of its own:
// it composes only shared helpers — pqh_requested_consumer_context
// (accesslib.php) and pqhi_support_recipient_for_consumer /
// pqhi_send_consumer_email (institutionlib.php) — plus inline json_decode of the
// consumer theme/copy. Those shared libs are required directly by the handler,
// never copied here. This file therefore has nothing to extract and exists only
// as a guard-only marker so the handler's require_once resolves and the
// parallel-run wiring matches the other migrated reports.
// The legacy page stays live and untouched (parallel-run).

defined('MOODLE_INTERNAL') || die();
