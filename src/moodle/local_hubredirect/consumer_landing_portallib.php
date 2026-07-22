<?php
// Consumer-landing query/view library — the ONE page-defined function extracted
// VERBATIM from local_hubredirect/consumer_landing.php (renamed pqhcl_service_cards,
// unchanged body) for the token-gated portal handler. The legacy page keeps its
// inline copy and stays untouched (parallel-run).
// Every other value the page uses comes from shared accesslib.php helpers
// (pqh_consumer_theme/copy/feature_enabled/hero_image_url/brand_initials/
// requested_consumer_context/context_by_slug/context_by_workspace) — those are
// NOT copied here.
// Requires: local/hubredirect/accesslib.php loaded first.

defined('MOODLE_INTERNAL') || die();

function pqhcl_service_cards(bool $ismarketplace, bool $isinstitution, string $brand): array {
    if ($isinstitution) {
        return [
            ['Branded workspace', 'Use your own institution identity and custom domain while keeping operations in the shared learning platform.'],
            ['Student and teacher management', 'Coordinate students, teachers, parent contacts, courses, assignments, and workspace membership.'],
            ['Live sessions', 'Schedule recurring classes, track upcoming sessions, manage attendance, and review live-class activity.'],
            ['Reports and operations', 'Review workspace reports, teaching load, student progress, materials, and operational follow-up.'],
        ];
    }
    if ($ismarketplace) {
        return [
            ['For independent teachers', 'Create a public profile, receive parent inquiries, manage students and courses, and run live sessions from one workspace.'],
            ['For parents', 'Browse teacher profiles, request services, and submit student learning needs through a guided intake form.'],
            ['For institutions', 'Find qualified teachers to hire, refer students for tutoring, and request extra learning support through the ' . $brand . ' marketplace.'],
            ['For live learning', 'Use scheduling, session materials, recordings, consent controls, and follow-up tools built for recurring instruction.'],
        ];
    }
    return [
        ['Student intake', 'Collect student, parent, placement, consent, language, and schedule information before enrollment.'],
        ['Teacher operations', 'Onboard teachers, publish marketplace profiles, and manage teaching responsibilities.'],
        ['Live sessions', 'Create recurring live sessions, attach materials, manage recordings, and review quality.'],
        ['Workspace management', 'Coordinate students, teachers, courses, parent communication, reports, and academy operations.'],
    ];
}
