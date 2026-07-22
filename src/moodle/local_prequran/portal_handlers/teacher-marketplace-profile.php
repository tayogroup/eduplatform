<?php
// ---- report: teacher-marketplace-profile (public teacher profile; READ-ONLY) --
// Ported from local_hubredirect/teacher_marketplace_profile.php via
// teacher_marketplace_profile_portallib (pqtmpl_*). Included from
// portal_data.php AFTER token auth: $claims verified, $USER set, JSON
// exception handler installed, headers sent.
//
// IMPORTANT: the legacy page is PUBLIC — it has no require_login() at entry
// (it renders the profile to guests and only calls require_login() inside its
// two POST branches). Following the public-endpoint pattern
// (local_prequran/public_intake_data.php), this handler is READ-ONLY and does
// not scope by user: it returns only what the page shows to an anonymous
// visitor. It still runs behind the token dispatcher for now (the launch link
// supplies the token); the token merely opens the report, it grants nothing
// extra. The legacy POST writes (submit_request / submit_selection) are
// login+sesskey-gated parent actions and are intentionally NOT ported — the
// portal page links to the legacy request/enrollment flow exactly as the
// public branch of the page does.
//
// GET params: teacherid= or teacherslug= (profile lookup, same rules as the
// page), plus consumer=/workspaceid= for the consumer context (the CDN host
// the page is served from carries no consumer meaning).

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/teacher_marketplace_profile_portallib.php');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    // Read-only public report: the legacy page's POST actions require an
    // interactive login session and (with the marketplace feature enabled)
    // redirect into the enrollment flow before writing anyway.
    pqpd_fail(405, 'This public teacher profile report is read-only. Use the request/enrollment link on the profile.');
}

// Consumer context — same resolution chain as the public endpoint exemplar:
// ?consumer= / ?workspaceid= drive it (this endpoint's own host is the Moodle
// host; the requesting portal page lives on the CDN).
$consumercontext = pqh_requested_consumer_context();
$requestedslug = trim(optional_param('consumer', '', PARAM_ALPHANUMEXT));
$requestedworkspaceid = optional_param('workspaceid', 0, PARAM_INT);
if ($requestedslug !== '' && (string)($consumercontext->consumerslug ?? '') !== $requestedslug) {
    $slugcontext = pqh_consumer_context_by_slug($requestedslug);
    if ((string)($slugcontext->consumerslug ?? '') === $requestedslug
        && ($requestedworkspaceid <= 0 || (int)($slugcontext->workspaceid ?? 0) === $requestedworkspaceid)) {
        $consumercontext = $slugcontext;
    }
}
if ($requestedworkspaceid > 0 && (int)($consumercontext->workspaceid ?? 0) !== $requestedworkspaceid) {
    $workspacecontext = pqh_consumer_context_by_workspace($requestedworkspaceid);
    if ($workspacecontext) {
        $consumercontext = $workspacecontext;
    }
}
$brandname = trim((string)($consumercontext->consumername ?? '')) ?: 'The marketplace';
$consumerparams = ['consumer' => (string)$consumercontext->consumerslug];
if ((int)($consumercontext->workspaceid ?? 0) > 0) {
    $consumerparams['workspaceid'] = (int)$consumercontext->workspaceid;
}

$teacherid = optional_param('teacherid', 0, PARAM_INT);
$teacherslug = trim(optional_param('teacherslug', '', PARAM_ALPHANUMEXT));

$ready = pqtmpl_ready();
$teacher = null;
$marketing = [];

// Teacher lookup — verbatim eligibility rules from the page: active +
// marketplace_visible + published + vetting approved + not deleted/suspended,
// consumer-scoped when the column exists.
if ($ready && ($teacherid > 0 || $teacherslug !== '')) {
    $consumerwhere = '';
    $consumerqueryparams = [];
    if (pqtmpl_column_exists('local_prequran_teacher_profile', 'consumerid') && (int)$consumercontext->consumerid > 0) {
        $consumerwhere = ' AND tp.consumerid = :consumerid';
        $consumerqueryparams['consumerid'] = (int)$consumercontext->consumerid;
    }
    $lookupwhere = $teacherid > 0 ? ' AND tp.userid = :teacherid' : '';
    $lookupparams = $teacherid > 0 ? ['teacherid' => $teacherid] : [];
    $candidates = array_values($DB->get_records_sql(
        "SELECT tp.*, u.firstname, u.lastname
           FROM {local_prequran_teacher_profile} tp
           JOIN {user} u ON u.id = tp.userid
          WHERE tp.status = :activestatus
            AND tp.marketplace_visible = 1
            AND tp.marketplace_status = :marketstatus
            AND tp.vetting_status = :vettingstatus
            {$consumerwhere}
            {$lookupwhere}
            AND u.deleted = 0
            AND u.suspended = 0
       ORDER BY tp.vetting_reviewedat DESC, tp.timemodified DESC",
        ['activestatus' => 'active', 'marketstatus' => 'published', 'vettingstatus' => 'approved'] + $consumerqueryparams + $lookupparams,
        0,
        $teacherid > 0 ? 1 : 200
    ));
    if ($teacherid > 0) {
        $teacher = $candidates ? reset($candidates) : null;
    } else {
        foreach ($candidates as $candidate) {
            if (pqh_teacher_public_slug($candidate) === $teacherslug) {
                $teacher = $candidate;
                $teacherid = (int)$candidate->userid;
                break;
            }
        }
    }
    if ($teacher) {
        $marketing = pqtmpl_application($teacher);
    }
}

// Legacy CTA targets (the public/anonymous branch of the page links here).
$requesturl = (new moodle_url('/local/hubredirect/teacher_marketplace_request.php', ['teacherid' => $teacherid] + $consumerparams))->out(false);
$marketplaceenrollmenturl = (new moodle_url('/local/hubredirect/marketplace_enrollment.php', ['teacherid' => $teacherid] + $consumerparams))->out(false);
$marketplaceurl = (new moodle_url('/local/hubredirect/teacher_marketplace.php', $consumerparams))->out(false);
$canonicalprofileurl = $teacher
    ? pqh_teacher_public_profile_url($teacher, $consumercontext)->out(false)
    : (new moodle_url('/local/hubredirect/teacher_marketplace_profile.php', ['teacherid' => $teacherid] + $consumerparams))->out(false);

$teacherout = null;
if ($teacher) {
    $teachername = trim((string)$teacher->teacher_display_name) !== '' ? (string)$teacher->teacher_display_name : fullname($teacher);
    // Panel map — same headings, same source fields, same order and same
    // fallback (marketplace_courses ?: courses_taught) as the page; the client
    // esc()s and renders newlines (page-side pqtmp_safe_lines equivalent).
    $panels = [];
    foreach ([
        'Skills' => (string)$teacher->marketplace_skills,
        'Experience' => (string)$teacher->marketplace_experience,
        'Education and qualifications' => (string)$teacher->marketplace_education,
        'Teaching style' => (string)$teacher->marketplace_teaching_style,
        'Subjects and services' => trim((string)$teacher->marketplace_courses) !== '' ? (string)$teacher->marketplace_courses : (string)$teacher->courses_taught,
        'Availability' => (string)$teacher->availability_summary,
        'Platform vetting summary' => (string)$teacher->vetting_summary,
    ] as $heading => $content) {
        if (trim($content) !== '') {
            $panels[] = ['heading' => $heading, 'content' => $content];
        }
    }
    foreach ([
        'Learner outcomes' => (string)($marketing['learner_outcomes'] ?? ''),
        'Curriculum and materials' => (string)($marketing['curriculum_materials'] ?? ''),
        'Pricing and packages' => (string)($marketing['pricing_summary'] ?? ''),
    ] as $heading => $content) {
        if (trim($content) !== '') {
            $panels[] = ['heading' => $heading, 'content' => $content];
        }
    }
    $teacherout = [
        'userid' => (int)$teacher->userid,
        'name' => $teachername,
        'slug' => pqh_teacher_public_slug($teacher),
        'pills' => array_values(array_filter([
            (string)$teacher->primary_language,
            (string)$teacher->other_languages,
            (string)$teacher->timezone,
        ], static function(string $value): bool {
            return $value !== '';
        })),
        'bio' => (string)$teacher->marketplace_bio,
        'panels' => $panels,
        'online' => [
            'social_handle' => ltrim(trim((string)($marketing['social_media_handle'] ?? '')), '@'),
            'social_url' => pqtmpl_public_url($marketing, 'social_profile_url'),
            'website_url' => pqtmpl_public_url($marketing, 'website_or_booking_url'),
            'demo_url' => pqtmpl_public_url($marketing, 'demo_video_url'),
        ],
        'canonicalurl' => $canonicalprofileurl,
    ];
}

echo json_encode([
    'ok' => true,
    'ready' => $ready,
    'notready_message' => $ready ? '' : 'Teacher marketplace schema is not ready yet. Please run the local_prequran Moodle upgrade.',
    'brand' => $brandname,
    'reviewnote' => $brandname . ' performs initial marketplace review and controls which profiles are visible. Visibility is not a guarantee of fit, outcome, or assignment. Families should review the profile, communicate with the teacher or tutor, and make the final selection for their child or for themselves.',
    'consumer' => [
        'slug' => (string)($consumercontext->consumerslug ?? ''),
        'name' => $brandname,
        'workspaceid' => (int)($consumercontext->workspaceid ?? 0),
    ],
    'teacher' => $teacherout,
    'requesturl' => $requesturl,
    'enrollmenturl' => $marketplaceenrollmenturl,
    'marketplaceurl' => $marketplaceurl,
], JSON_UNESCAPED_SLASHES);
exit;
