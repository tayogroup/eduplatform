<?php
// Portal library for the platform-landing report — companion to
// local_prequran/portal_handlers/platform-landing.php (parallel-run of
// local_hubredirect/platform_landing.php, which stays live and untouched).
//
// GUARD-ONLY MARKER: platform_landing.php defines NO functions of its own. It
// is a static platform-foundation marketing page whose only dynamic inputs are
// the consumer context and the platform-admin flag — both read through the
// SHARED accesslib.php helpers (pqh_current_consumer_context,
// pqh_requested_consumer_context, pqh_can_manage_academy_operations,
// pqh_context_is_platform_foundation, pqh_consumer_context_by_slug/workspace).
// Those are shared, so they are NOT copied here; the handler requires accesslib
// directly. There is therefore nothing page-defined to extract into a pqpll_*
// namespace, and this file intentionally holds no functions.

defined('MOODLE_INTERNAL') || die();
