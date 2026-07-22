<?php
// Institution-profile query library — companion to the token-gated portal
// endpoint (portal_handlers/institution-profile.php). The legacy page
// local_hubredirect/institution_profile.php defines NO functions of its own:
// it composes only shared helpers — pqh_requested_consumer_context,
// pqh_consumer_theme/_copy/_hero_image_url/_brand_initials, pqh_table_exists_safe
// (accesslib.php) and pqhi_support_recipient_for_consumer /
// pqhi_send_consumer_email (institutionlib.php). Those shared libs are required
// directly by the handler, never copied here. This file therefore has nothing
// to extract and exists only as a guard-only marker so the handler's require_once
// resolves and the parallel-run wiring matches the other migrated reports.
// The legacy page stays live and untouched (parallel-run).

defined('MOODLE_INTERNAL') || die();
