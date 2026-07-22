<?php
// Portal launch (hubredirect Phase C) — the one-click bridge from a Moodle
// session to a Bunny-hosted portal page. Enforces the SAME access check the
// legacy PHP page uses, mints a portal-scoped token, and redirects.
//
//   /local/prequran/portal_launch.php            → live-reports (default)
//   /local/prequran/portal_launch.php?report=…   → future portal pages

require(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/progress_gatewaylib.php');
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');

require_login();

/** managed-reports is open to any authenticated user — the data endpoint
 *  scopes what they see by role (admin/teacher/parent/student), exactly like
 *  the legacy page. */
function pqpl_any_authenticated(int $userid): bool {
    return $userid > 0;
}

$report = optional_param('report', 'live-reports', PARAM_ALPHANUMEXT);
$reports = [
    // report id => [access callback, page filename]
    'live-reports' => ['pqh_can_manage_academy_operations', 'live-reports.html'],
    'managed-reports' => ['pqpl_any_authenticated', 'managed-reports.html'],
    'dashboard' => ['pqpl_any_authenticated', 'dashboard-17.html'],
    'intake-requests' => ['pqh_can_manage_academy_operations', 'intake-requests.html'],
    'workspace-reports' => ['pqpl_any_authenticated', 'workspace-reports.html'],
    'live-schedule' => ['pqpl_any_authenticated', 'live-schedule.html'],
    'live-summaries' => ['pqpl_any_authenticated', 'live-summaries.html'],
    // Batch wave (handlers in portal_handlers/): entry mirrors each legacy
    // page's require_login()-only gate; the handlers re-enforce the real
    // per-action authorization (course-offerings ports the workspace-manager
    // gate with the exact legacy denial message).
    'recordings' => ['pqpl_any_authenticated', 'recordings.html'],
    'communications' => ['pqpl_any_authenticated', 'communications.html'],
    'course-offerings' => ['pqpl_any_authenticated', 'course-offerings.html'],
    'parent-trust' => ['pqpl_any_authenticated', 'parent-trust.html'],
    'live-sessions' => ['pqpl_any_authenticated', 'live-sessions.html'],
    // Batch wave 2. live-review's real gate is per-session (handler enforces
    // owner/workspace/ops with the legacy security audit); student-intake's is
    // ops-or-independent-teacher (handler enforces with the legacy messages).
    'live-review' => ['pqpl_any_authenticated', 'live-review.html'],
    'student-dashboard' => ['pqpl_any_authenticated', 'student-dashboard.html'],
    'student-intake' => ['pqpl_any_authenticated', 'student-intake.html'],
    'teacher-intake' => ['pqh_can_manage_academy_operations', 'teacher-intake.html'],
    'teacher-intake-requests' => ['pqh_can_manage_academy_operations', 'teacher-intake-requests.html'],
    // Batch wave 3. workspace-dashboard/-people gates are workspace-scoped
    // (handlers enforce the legacy manage checks with identical messages).
    'live-ops' => ['pqh_can_manage_academy_operations', 'live-ops.html'],
    'workspace-dashboard' => ['pqpl_any_authenticated', 'workspace-dashboard.html'],
    'workspace-people' => ['pqpl_any_authenticated', 'workspace-people.html'],
    'quality-analytics' => ['pqh_can_manage_academy_operations', 'quality-analytics.html'],
    'master-dashboard' => ['is_siteadmin', 'master-dashboard.html'],
    // Batch wave 4. Wizard + followups gates are workspace/role-scoped
    // (handlers enforce the legacy checks with identical messages);
    // platform-consumers' handler adds the foundation-domain stage.
    'live-create-wizard' => ['pqpl_any_authenticated', 'live-create-wizard.html'],
    'platform-consumers' => ['pqh_can_manage_academy_operations', 'platform-consumers.html'],
    'live-quality' => ['pqh_can_manage_academy_operations', 'live-quality.html'],
    'live-followups' => ['pqpl_any_authenticated', 'live-followups.html'],
    'recordings-admin' => ['pqh_can_manage_academy_operations', 'recordings-admin.html'],
    // Wave 5: teacher family. Workspace/teacher/self-scoped gates live in the
    // handlers with the exact legacy denial messages; marketplace-admin keeps
    // the legacy academy-ops entry gate.
    'teacher-administration' => ['pqpl_any_authenticated', 'teacher-administration.html'],
    'teacher-homework' => ['pqpl_any_authenticated', 'teacher-homework.html'],
    'teacher-marketing' => ['pqpl_any_authenticated', 'teacher-marketing.html'],
    'teacher-marketplace' => ['pqpl_any_authenticated', 'teacher-marketplace.html'],
    'teacher-marketplace-request' => ['pqpl_any_authenticated', 'teacher-marketplace-request.html'],
    'teacher-marketplace-admin' => ['pqh_can_manage_academy_operations', 'teacher-marketplace-admin.html'],
    'teacher-marketplace-profile' => ['pqpl_any_authenticated', 'teacher-marketplace-profile.html'],
    'teacher-marketplace-queue' => ['pqpl_any_authenticated', 'teacher-marketplace-queue.html'],
    'teacher-office' => ['pqpl_any_authenticated', 'teacher-office.html'],
    'teacher-portal' => ['pqpl_any_authenticated', 'teacher-portal.html'],
    'teacher-student-connect' => ['pqpl_any_authenticated', 'teacher-student-connect.html'],
    'teacher-workspace' => ['pqpl_any_authenticated', 'teacher-workspace.html'],
    // Wave 6: student + course families. Self/parent/workspace-admin gates
    // live in the handlers with the exact legacy denial messages.
    'student-billing' => ['pqpl_any_authenticated', 'student-billing.html'],
    'student-finance' => ['pqpl_any_authenticated', 'student-finance.html'],
    'student-homework' => ['pqpl_any_authenticated', 'student-homework.html'],
    'student-parent-portal' => ['pqpl_any_authenticated', 'student-parent-portal.html'],
    'student-workplace' => ['pqpl_any_authenticated', 'student-workplace.html'],
    'course-catalog-browse' => ['pqpl_any_authenticated', 'course-catalog-browse.html'],
    'course-seat-report' => ['pqpl_any_authenticated', 'course-seat-report.html'],
    'course-student-history' => ['pqpl_any_authenticated', 'course-student-history.html'],
    'course-sync-report' => ['pqpl_any_authenticated', 'course-sync-report.html'],
    'course-transcript' => ['pqpl_any_authenticated', 'course-transcript.html'],
    'course-transcript-export' => ['pqpl_any_authenticated', 'course-transcript-export.html'],
    'course-transcript-official' => ['pqpl_any_authenticated', 'course-transcript-official.html'],
    // Wave 7: finance family. Workspace-finance-admin and invoice-ownership
    // gates live in the handlers with the exact legacy denial messages.
    'finance-audit' => ['pqpl_any_authenticated', 'finance-audit.html'],
    'finance-policy' => ['pqpl_any_authenticated', 'finance-policy.html'],
    'payment-gateway-settings' => ['pqpl_any_authenticated', 'payment-gateway-settings.html'],
    'finance-operations' => ['pqpl_any_authenticated', 'finance-operations.html'],
    'invoice-detail' => ['pqpl_any_authenticated', 'invoice-detail.html'],
    'invoice-view' => ['pqpl_any_authenticated', 'invoice-view.html'],
    'payment-receipt' => ['pqpl_any_authenticated', 'payment-receipt.html'],
    // Wave 8: live-ops satellites. Per-session/self/child gates live in the
    // handlers with the exact legacy messages; academy-ops reports keep the
    // legacy academy-operations entry gate.
    'live-monitor' => ['pqpl_any_authenticated', 'live-monitor.html'],
    'live-recordings' => ['pqpl_any_authenticated', 'live-recordings.html'],
    'live-leadership' => ['pqh_can_manage_academy_operations', 'live-leadership.html'],
    'live-followup-message' => ['pqpl_any_authenticated', 'live-followup-message.html'],
    'live-practice-coach' => ['pqpl_any_authenticated', 'live-practice-coach.html'],
    'live-availability' => ['pqpl_any_authenticated', 'live-availability.html'],
    'live-admin' => ['pqh_can_manage_academy_operations', 'live-admin.html'],
    'live-improvement-plans' => ['pqh_can_manage_academy_operations', 'live-improvement-plans.html'],
    'live-capacity' => ['pqh_can_manage_academy_operations', 'live-capacity.html'],
    'live-trust' => ['pqpl_any_authenticated', 'live-trust.html'],
    'live-calendar' => ['pqpl_any_authenticated', 'live-calendar.html'],
    // Wave 9: workspace + institution family. Workspace-manage/self/parent gates
    // live in the handlers with the exact legacy messages; workspaces + onboarding
    // keep the legacy academy-ops (+ foundation-domain) entry gate.
    'workspaces' => ['pqh_can_manage_academy_operations', 'workspaces.html'],
    'workspace-student' => ['pqpl_any_authenticated', 'workspace-student.html'],
    'workspace-sessions' => ['pqpl_any_authenticated', 'workspace-sessions.html'],
    'workspace-series' => ['pqpl_any_authenticated', 'workspace-series.html'],
    'workspace-materials' => ['pqpl_any_authenticated', 'workspace-materials.html'],
    'workspace-parent' => ['pqpl_any_authenticated', 'workspace-parent.html'],
    'institution-onboarding' => ['pqh_can_manage_academy_operations', 'institution-onboarding.html'],
    'institution-settings' => ['pqpl_any_authenticated', 'institution-settings.html'],
    'institution-profile' => ['pqpl_any_authenticated', 'institution-profile.html'],
    'institution-inquiry' => ['pqpl_any_authenticated', 'institution-inquiry.html'],
    // Wave 10: platform admin + live-ops tier 2. Platform reports keep the
    // legacy foundation-domain + academy-ops gate (handlers re-enforce it);
    // workspace/self/session gates live in the handlers with legacy messages.
    'platform-settings' => ['pqh_can_manage_academy_operations', 'platform-settings.html'],
    'platform-dashboard' => ['pqh_can_manage_academy_operations', 'platform-dashboard.html'],
    'platform-landing' => ['pqpl_any_authenticated', 'platform-landing.html'],
    'platform-user-roster' => ['pqh_can_manage_academy_operations', 'platform-user-roster.html'],
    'platform-course-roster' => ['pqh_can_manage_academy_operations', 'platform-course-roster.html'],
    'live-grouping' => ['pqpl_any_authenticated', 'live-grouping.html'],
    'live-series' => ['pqpl_any_authenticated', 'live-series.html'],
    'live-series-schedule' => ['pqpl_any_authenticated', 'live-series-schedule.html'],
    'live-session-materials' => ['pqpl_any_authenticated', 'live-session-materials.html'],
    'live-virtual-tutor' => ['pqpl_any_authenticated', 'live-virtual-tutor.html'],
    'marketplace-enrollment' => ['pqpl_any_authenticated', 'marketplace-enrollment.html'],
    // Wave 11: parent-trust family + directory + reports. Academy-ops reports keep
    // the legacy ops gate; parent-trust audit/retention/evidence are siteadmin-only
    // (handlers re-enforce); self/parent-scoped pages use any_authenticated.
    'live-teacher-profile' => ['pqh_can_manage_academy_operations', 'live-teacher-profile.html'],
    'live-teacher-directory' => ['pqh_can_manage_academy_operations', 'live-teacher-directory.html'],
    'live-parent-links' => ['pqh_can_manage_academy_operations', 'live-parent-links.html'],
    'parent-trust-retention' => ['is_siteadmin', 'parent-trust-retention.html'],
    'parent-trust-audit' => ['is_siteadmin', 'parent-trust-audit.html'],
    'parent-trust-purge-evidence' => ['is_siteadmin', 'parent-trust-purge-evidence.html'],
    'parent-trust-review-pack' => ['is_siteadmin', 'parent-trust-review-pack.html'],
    'at-risk-report' => ['pqpl_any_authenticated', 'at-risk-report.html'],
    'unmanaged-reports' => ['pqh_can_manage_academy_operations', 'unmanaged-reports.html'],
    'safenet' => ['pqpl_any_authenticated', 'safenet.html'],
    'referrers' => ['pqpl_any_authenticated', 'referrers.html'],
    'enrollment-approval' => ['pqpl_any_authenticated', 'enrollment-approval.html'],
    // Wave 12: support/admissions/transcript-controls cluster. Workspace-manage
    // and platform-ops gates live in the handlers with the legacy messages.
    // (public-teacher-intake is a standalone cookieless endpoint, not a report.)
    'live-series-wizard' => ['pqpl_any_authenticated', 'live-series-wizard.html'],
    'communications-center' => ['pqpl_any_authenticated', 'communications-center.html'],
    'consumer-wizard' => ['pqh_can_manage_academy_operations', 'consumer-wizard.html'],
    'academic-quality-controls' => ['pqpl_any_authenticated', 'academic-quality-controls.html'],
    'attendance-operations' => ['pqpl_any_authenticated', 'attendance-operations.html'],
    'admissions' => ['pqpl_any_authenticated', 'admissions.html'],
    'roles-permissions' => ['pqpl_any_authenticated', 'roles-permissions.html'],
    'transcript-controls' => ['pqpl_any_authenticated', 'transcript-controls.html'],
    'transcript-policy' => ['pqpl_any_authenticated', 'transcript-policy.html'],
];
if (!isset($reports[$report])) {
    throw new moodle_exception('invalidparameter', 'debug', '', null, 'Unknown portal report: ' . $report);
}
[$accesscheck, $page] = $reports[$report];
if (!$accesscheck((int)$USER->id)) {
    pqh_access_denied(
        'This portal report is available to academy operations users only.',
        new moodle_url('/local/hubredirect/dashboard.php'),
        'Reports are not available for this account'
    );
}

$token = pqpg_mint_token((int)$USER->id, 'portal:' . $report);
$base = rtrim((string)get_config('local_prequran', 'portal_base_url'), '/');
if ($base === '') {
    $base = 'https://ehelacademy.b-cdn.net/platform/portal';
}
$endpoint = $CFG->wwwroot . '/local/prequran/portal_data.php';

$redirecturl = $base . '/' . $page . '?endpoint=' . urlencode($endpoint) . '&token=' . urlencode($token);
// Forward deep-link context so "Review"-style links land on a preselected
// record (e.g. live_sessions roster -> live-review with sessionid set).
foreach (['sessionid', 'childid', 'studentid', 'workspaceid', 'threadid', 'requestid', 'teacher_requestid', 'existing_teacherid', 'invoiceid', 'paymentid', 'teacherid'] as $p) {
    $v = optional_param($p, 0, PARAM_INT);
    if ($v > 0) {
        $redirecturl .= '&' . $p . '=' . $v;
    }
}
$consumer = optional_param('consumer', '', PARAM_ALPHANUMEXT);
if ($consumer !== '') {
    $redirecturl .= '&consumer=' . urlencode($consumer);
}
redirect($redirecturl);
