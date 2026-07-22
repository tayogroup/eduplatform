<?php
// ---- report: teacher-marketing (teacher marketplace profile; read + submit) ----
// Ported from local_hubredirect/teacher_marketing.php via teacher_marketing_portallib
// (pqtmktl_*). Included from portal_data.php AFTER token auth: $claims verified,
// $USER set to the token user, JSON exception handler installed, headers sent.
// GET  = the teacher's marketing profile state (source fields + review status);
//        ?statuscheck=1 = the page's lightweight status-poll JSON, verbatim shape.
// POST = do=submit_marketing (the page's submit_marketing=1 write, verbatim:
//        same validation, unchanged-detection, draft store, audit, preference;
//        confirm_sesskey dropped — token auth replaces it; redirects -> ok JSON).

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/teacher_marketing_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

// -- shared preamble (verbatim page order: context -> profiles -> repair ->
//    canonical status -> profile selection -> access check) ------------------
$consumercontext = pqh_requested_consumer_context();
$consumerparams = [];
if (trim((string)($consumercontext->consumerslug ?? '')) !== '') {
    $consumerparams['consumer'] = (string)$consumercontext->consumerslug;
}
$workspaceid = optional_param('workspaceid', 0, PARAM_INT);
if ($workspaceid <= 0) {
    $workspaceid = (int)($consumercontext->workspaceid ?? 0);
}
if ($workspaceid > 0) {
    $consumerparams['workspaceid'] = $workspaceid;
}

if (!pqtmktl_table_exists('local_prequran_teacher_profile')
        || !pqtmktl_column_exists('local_prequran_teacher_profile', 'application_json')) {
    throw new moodle_exception('Teacher marketing profile storage is not ready.');
}

$profilewhere = 'tp.userid = :userid';
$profileparams = ['userid' => (int)$USER->id];
if (pqtmktl_column_exists('local_prequran_teacher_profile', 'consumerid')
        && (int)($consumercontext->consumerid ?? 0) > 0) {
    $profilewhere .= ' AND tp.consumerid = :consumerid';
    $profileparams['consumerid'] = (int)$consumercontext->consumerid;
}
$profiles = $DB->get_records_sql(
    "SELECT tp.*
       FROM {local_prequran_teacher_profile} tp
      WHERE {$profilewhere}
   ORDER BY tp.timemodified DESC, tp.id DESC",
    $profileparams
);
$profiles = array_values($profiles);
// Repair unchanged forms that were re-POSTed when the old polling script reloaded a POST response.
foreach ($profiles as $index => $candidate) {
    $candidateapplication = pqtmktl_json((string)($candidate->application_json ?? ''));
    $candidatedraft = $candidateapplication['marketplace_marketing_draft'] ?? [];
    if (is_array($candidatedraft) && pqtmktl_draft_matches_approved($candidate, $candidateapplication, $candidatedraft)) {
        unset($candidateapplication['marketplace_marketing_draft']);
        $candidate->application_json = json_encode($candidateapplication, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        $DB->update_record('local_prequran_teacher_profile', $candidate);
        $profiles[$index] = $candidate;
    }
}
$canonicalstatus = pqtmktl_canonical_review_status(
    (int)$USER->id,
    (int)($consumercontext->consumerid ?? 0),
    $profiles
);
$profile = false;
foreach ($profiles as $candidate) {
    $candidateapplication = pqtmktl_json((string)($candidate->application_json ?? ''));
    $candidatedraft = $candidateapplication['marketplace_marketing_draft'] ?? [];
    if ($canonicalstatus === 'published'
            && (int)($candidate->marketplace_visible ?? 0) === 1
            && (string)($candidate->marketplace_status ?? '') === 'published') {
        $profile = $candidate;
        break;
    }
    if ($canonicalstatus === 'pending_review' && is_array($candidatedraft) && $candidatedraft) {
        $profile = $candidate;
        break;
    }
}
$profile = $profile ?: ($profiles ? reset($profiles) : false);
if (!$profile || (string)($profile->status ?? '') !== 'active'
        || (string)($profile->vetting_status ?? '') !== 'approved') {
    // Legacy: pqh_access_denied(...) redirect to access_denied.php.
    pqpd_fail(403, 'An active approved teacher profile is required before marketing services.');
}

$application = pqtmktl_json((string)($profile->application_json ?? ''));
$draft = isset($application['marketplace_marketing_draft']) && is_array($application['marketplace_marketing_draft'])
    ? $application['marketplace_marketing_draft']
    : [];
$reviewstatus = pqtmktl_review_status($profile, $application, $draft, $canonicalstatus);

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    $body = json_decode((string)file_get_contents('php://input'), true);
    $do = is_array($body) ? (string)($body['do'] ?? '') : '';

    // -- write: submit_marketing (legacy submit_marketing=1 POST, verbatim) --
    // confirm_sesskey() dropped: token auth replaces the session key. The
    // verbatim helpers read via optional_param, so surface the JSON body
    // fields as request parameters before running the unchanged write block.
    if ($do === 'submit_marketing') {
        foreach (['display_name', 'bio', 'skills', 'experience', 'education', 'teaching_style',
                'services', 'social_media_handle', 'social_profile_url', 'website_or_booking_url',
                'demo_video_url', 'learner_outcomes', 'curriculum_materials', 'pricing_summary'] as $field) {
            $_POST[$field] = (string)($body[$field] ?? '');
        }
        try {
            $socialurl = pqtmktl_social_url(optional_param('social_profile_url', '', PARAM_RAW_TRIMMED));
            $handle = ltrim(pqtmktl_text('social_media_handle', 100), '@');
            if ($handle === '' && strpos($socialurl, 'instagram.com/') !== false) {
                $handle = trim((string)parse_url($socialurl, PHP_URL_PATH), '/');
            }
            $draft = [
                'display_name' => pqtmktl_text('display_name', 160),
                'bio' => pqtmktl_text('bio', 3000),
                'skills' => pqtmktl_text('skills', 2000),
                'experience' => pqtmktl_text('experience', 3000),
                'education' => pqtmktl_text('education', 3000),
                'teaching_style' => pqtmktl_text('teaching_style', 2500),
                'services' => pqtmktl_text('services', 3000),
                'social_media_handle' => $handle,
                'social_profile_url' => $socialurl,
                'website_or_booking_url' => pqtmktl_url(optional_param('website_or_booking_url', '', PARAM_RAW_TRIMMED)),
                'demo_video_url' => pqtmktl_url(optional_param('demo_video_url', '', PARAM_RAW_TRIMMED)),
                'learner_outcomes' => pqtmktl_text('learner_outcomes', 2500),
                'curriculum_materials' => pqtmktl_text('curriculum_materials', 2500),
                'pricing_summary' => pqtmktl_text('pricing_summary', 1200),
                'review_status' => 'pending_review',
                'submitted_by' => (int)$USER->id,
                'submitted_at' => time(),
            ];
            if ($draft['display_name'] === '' || $draft['bio'] === '' || $draft['services'] === '') {
                throw new invalid_parameter_exception('Public name, profile summary, and services are required.');
            }
            if (pqtmktl_draft_matches_approved($profile, $application, $draft)) {
                set_user_preference(
                    pqtmktl_preference_key((int)($consumercontext->consumerid ?? 0)),
                    'published',
                    (int)$USER->id
                );
                // Legacy: redirect(... + ['unchanged' => 1]).
                echo json_encode([
                    'ok' => true,
                    'unchanged' => true,
                    'status' => 'published',
                    'label' => pqtmktl_status_label('published'),
                    'message' => 'Your published marketing profile is already up to date.',
                ], JSON_UNESCAPED_SLASHES);
                exit;
            }
            $application['marketplace_marketing_draft'] = $draft;
            $profile->application_json = json_encode($application, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
            $profile->timemodified = time();
            $DB->update_record('local_prequran_teacher_profile', $profile);
            pqtmktl_audit('teacher_marketing_submitted', (int)$profile->id, ['social_profile_url' => $socialurl]);
            set_user_preference(
                pqtmktl_preference_key((int)($consumercontext->consumerid ?? 0)),
                'pending_review',
                (int)$USER->id
            );
            // Legacy: redirect(... + ['submitted' => 1]).
            echo json_encode([
                'ok' => true,
                'submitted' => true,
                'status' => 'pending_review',
                'label' => pqtmktl_status_label('pending_review'),
                'message' => 'Marketing profile submitted for marketplace review.',
            ], JSON_UNESCAPED_SLASHES);
            exit;
        } catch (Throwable $e) {
            // Legacy: $error rendered inline on the page.
            pqpd_fail(400, 'Marketing profile was not submitted: ' . $e->getMessage());
        }
    }

    pqpd_fail(400, 'Unknown teacher-marketing action.');
}

// -- GET: lightweight status poll (legacy ?statuscheck=1 JSON, verbatim shape) --
if (optional_param('statuscheck', 0, PARAM_BOOL)) {
    echo json_encode([
        'ok' => true,
        'status' => $reviewstatus,
        'label' => pqtmktl_status_label($reviewstatus),
        'profileid' => (int)$profile->id,
        'timemodified' => (int)$profile->timemodified,
    ]);
    exit;
}

// -- GET: the marketing page state (same $source resolution as the page) --------
$source = ($reviewstatus !== 'published' && $draft) ? $draft : [
    'display_name' => (string)($profile->teacher_display_name ?? ''),
    'bio' => (string)($profile->marketplace_bio ?? ''),
    'skills' => (string)($profile->marketplace_skills ?? ''),
    'experience' => (string)($profile->marketplace_experience ?? ''),
    'education' => (string)($profile->marketplace_education ?? ''),
    'teaching_style' => (string)($profile->marketplace_teaching_style ?? ''),
    'services' => (string)($profile->marketplace_courses ?? ''),
    'social_media_handle' => (string)($application['social_media_handle'] ?? ''),
    'social_profile_url' => (string)($application['social_profile_url'] ?? ''),
    'website_or_booking_url' => (string)($application['website_or_booking_url'] ?? ''),
    'demo_video_url' => (string)($application['demo_video_url'] ?? ''),
    'learner_outcomes' => (string)($application['learner_outcomes'] ?? ''),
    'curriculum_materials' => (string)($application['curriculum_materials'] ?? ''),
    'pricing_summary' => (string)($application['pricing_summary'] ?? ''),
];

$brandname = trim((string)($consumercontext->consumername ?? '')) ?: 'Marketplace';
$publicurl = pqh_teacher_public_profile_url($profile, $consumercontext);

echo json_encode([
    'ok' => true, 'ready' => true,
    'brandname' => $brandname,
    'consumer' => (string)($consumerparams['consumer'] ?? ''),
    'workspaceid' => $workspaceid,
    'profileid' => (int)$profile->id,
    'timemodified' => (int)$profile->timemodified,
    'status' => $reviewstatus,
    'label' => pqtmktl_status_label($reviewstatus),
    'hasdraft' => (bool)$draft,
    'source' => [
        'display_name' => (string)($source['display_name'] ?? ''),
        'bio' => (string)($source['bio'] ?? ''),
        'skills' => (string)($source['skills'] ?? ''),
        'experience' => (string)($source['experience'] ?? ''),
        'education' => (string)($source['education'] ?? ''),
        'teaching_style' => (string)($source['teaching_style'] ?? ''),
        'services' => (string)($source['services'] ?? ''),
        'social_media_handle' => (string)($source['social_media_handle'] ?? ''),
        'social_profile_url' => (string)($source['social_profile_url'] ?? ''),
        'website_or_booking_url' => (string)($source['website_or_booking_url'] ?? ''),
        'demo_video_url' => (string)($source['demo_video_url'] ?? ''),
        'learner_outcomes' => (string)($source['learner_outcomes'] ?? ''),
        'curriculum_materials' => (string)($source['curriculum_materials'] ?? ''),
        'pricing_summary' => (string)($source['pricing_summary'] ?? ''),
    ],
    'publicurl' => $publicurl->out(false),
    'names' => pqpd_names([(int)($profile->userid ?? 0), $userid]),
], JSON_UNESCAPED_SLASHES);
exit;
