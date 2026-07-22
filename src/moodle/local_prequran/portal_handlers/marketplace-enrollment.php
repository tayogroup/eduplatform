<?php
// ---- report: marketplace-enrollment (parent/adult-learner enrollment flow) ----
// Ported from local_hubredirect/marketplace_enrollment.php via
// marketplace_enrollment_portallib (pqme_*). Included from portal_data.php AFTER
// token auth: $claims verified, $USER set to the token user, JSON exception
// handler installed, headers sent.
// GET  = the enrollment options/state for ?teacherid= (resolved teacher, linked
//        children, subject/level/language/mode option lists, prefilled requester
//        identity) exactly as the legacy page renders it.
// POST = do=submit_enrollment (the page's enrollment write verbatim: comm thread
//        creation, teacher_request upsert, live_audit).
//
// ACCESS: the legacy page has NO require_login and NO pqh_access_denied — it is a
// public page that serves guests and logged-in users alike, redirecting only when
// the teacher cannot be resolved. Token auth is strictly stronger: every portal
// request already carries an authenticated token user, so the page's public gate
// is fully satisfied. The teacher-not-found redirect (data guard, not browser nav
// for a valid submission) becomes a JSON error. The page has no
// pqh_live_security_audit calls — none to keep. The legacy guest-enrollment
// branch (studentid=0 guest identity note, email-match lookup) is unreachable
// here (a token user is always logged in) and is not ported.

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/marketplace_enrollment_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

$consumercontext = pqh_requested_consumer_context();
$consumerparams = ['consumer' => (string)$consumercontext->consumerslug];
$brandname = trim((string)($consumercontext->consumername ?? '')) ?: 'the marketplace';
$teacherid = optional_param('teacherid', 0, PARAM_INT);

// Requester is always the authenticated token user (the portal has no guests).
$requesterid = $userid;
$children = pqme_parent_children($requesterid);
$ready = pqme_table_exists('local_prequran_teacher_profile') && pqme_table_exists('local_prequran_teacher_request');

// -- resolve the teacher exactly as the legacy page does (verbatim conditions) --
$teacher = null;
if ($ready && $teacherid > 0) {
    $conditions = ['userid' => $teacherid, 'status' => 'active'];
    if (pqme_column_exists('local_prequran_teacher_profile', 'marketplace_visible')) {
        $conditions['marketplace_visible'] = 1;
    }
    if (pqme_column_exists('local_prequran_teacher_profile', 'marketplace_status')) {
        $conditions['marketplace_status'] = 'published';
    }
    if (pqme_column_exists('local_prequran_teacher_profile', 'vetting_status')) {
        $conditions['vetting_status'] = 'approved';
    }
    if (pqme_column_exists('local_prequran_teacher_profile', 'consumerid') && (int)$consumercontext->consumerid > 0) {
        $conditions['consumerid'] = (int)$consumercontext->consumerid;
    }
    $teacher = $DB->get_record('local_prequran_teacher_profile', $conditions, '*', IGNORE_MISSING) ?: null;
}
if (!$teacher) {
    // Legacy redirects to teacher_marketplace.php; an API says why instead.
    pqpd_fail(404, 'This teacher is not available for marketplace enrollment.');
}

$teachername = trim((string)($teacher->teacher_display_name ?? ''));
if ($teachername === '') {
    $teacheruser = core_user::get_user($teacherid, 'id,firstname,lastname', IGNORE_MISSING);
    $teachername = $teacheruser ? fullname($teacheruser) : 'Selected teacher';
}
$profileurl = pqh_teacher_public_profile_url($teacher, $consumercontext)->out(false);

// -- option lists (verbatim from the page) -------------------------------------
$subjects = [
    'languages' => 'Languages', 'math' => 'Math', 'science' => 'Science',
    'social_science' => 'Social Science', 'technology' => 'Technology',
    'homeschool_support' => 'Homeschool support', 'tvet' => 'Technical & Vocational Education (TVET)',
    'special_needs_support' => 'Special needs / learning support',
    'test_preparation' => 'Test preparation', 'other' => 'Other subject or service',
];
$levels = [
    'early_childhood' => 'Early childhood', 'primary_elementary' => 'Primary / elementary',
    'middle_school' => 'Middle school', 'high_school' => 'High school',
    'university' => 'University', 'tvet' => 'TVET', 'adult' => 'Adult learner',
];
$languages = ['English', 'Arabic', 'French', 'Spanish', 'Swahili', 'Somali', 'Amharic', 'Other'];
$modes = [
    'one_to_one_online' => 'One-to-one online', 'small_group_online' => 'Small-group online',
    'in_person' => 'In person', 'homework_support' => 'Homework support',
    'assessment' => 'Assessment / placement', 'recorded_support' => 'Recorded lessons / content',
];
$roles = [
    'parent_guardian' => 'Parent / guardian',
    'adult_learner' => 'Adult learner',
    'institution_representative' => 'Institution representative',
];

// ==============================================================================
// POST — enrollment write (legacy POST handler, verbatim; confirm_sesskey dropped
// because token auth replaces the session key; redirect replaced by ok JSON).
// ==============================================================================
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    if (!$ready) {
        pqpd_fail(403, 'Marketplace enrollment schema is not ready yet. Please run the local_prequran Moodle upgrade.');
    }
    $body = json_decode((string)file_get_contents('php://input'), true);
    if (!is_array($body)) {
        $body = [];
    }
    if ((string)($body['do'] ?? '') !== 'submit_enrollment') {
        pqpd_fail(400, 'Unknown marketplace-enrollment action.');
    }

    // Field capture mirrors the page: PARAM_TEXT, trimmed, length-capped
    // (3000 for the long free-text fields, 255 otherwise); consent is a bool.
    $longfields = ['learning_goals', 'support_needs', 'availability', 'questions'];
    $capture = static function (string $field) use ($body, $longfields): string {
        $limit = in_array($field, $longfields, true) ? 3000 : 255;
        return core_text::substr(trim(clean_param((string)($body[$field] ?? ''), PARAM_TEXT)), 0, $limit);
    };

    $form = [
        'requester_name' => $capture('requester_name'),
        'contact' => $capture('contact'),
        'requester_role' => $capture('requester_role'),
        'learner_type' => $capture('learner_type'),
        'studentid' => $capture('studentid'),
        'learner_name' => $capture('learner_name'),
        'age_years' => $capture('age_years'),
        'subject_area' => $capture('subject_area'),
        'language_subject' => $capture('language_subject'),
        'learner_level' => $capture('learner_level'),
        'learning_goals' => $capture('learning_goals'),
        'support_needs' => $capture('support_needs'),
        'service_mode' => $capture('service_mode'),
        'timezone' => $capture('timezone'),
        'availability' => $capture('availability'),
        'questions' => $capture('questions'),
        'consent' => !empty($body['consent']) ? 1 : 0,
    ];

    $errors = [];
    // Honeypot (verbatim spam trap).
    if (trim((string)($body['website'] ?? '')) !== '') {
        $errors['form'] = 'The enrollment could not be submitted.';
    }
    foreach (['requester_name', 'contact', 'requester_role', 'learner_type', 'learner_name', 'age_years', 'subject_area', 'learner_level', 'learning_goals', 'service_mode', 'timezone', 'availability'] as $required) {
        if (trim((string)$form[$required]) === '') {
            $errors[$required] = 'Required.';
        }
    }
    if (!pqme_contact_valid((string)$form['contact'])) {
        $errors['contact'] = 'Enter a valid email address or phone number.';
    }
    if ((int)$form['age_years'] < 1 || (int)$form['age_years'] > 99) {
        $errors['age_years'] = 'Enter an age from 1 to 99.';
    }
    if (!isset($subjects[$form['subject_area']])) {
        $errors['subject_area'] = 'Choose a valid subject or service.';
    }
    if ($form['subject_area'] === 'languages' && !in_array($form['language_subject'], $languages, true)) {
        $errors['language_subject'] = 'Choose the language to be studied.';
    }
    if (!isset($levels[$form['learner_level']])) {
        $errors['learner_level'] = 'Choose a valid learner level.';
    }
    if (!isset($modes[$form['service_mode']])) {
        $errors['service_mode'] = 'Choose a valid service mode.';
    }
    if (empty($form['consent'])) {
        $errors['consent'] = 'Consent is required before the request can be reviewed.';
    }

    // Learner record resolution (verbatim; the guest 'new_learner' path keeps
    // studentid = 0, and the token user is always logged in).
    $studentid = 0;
    if ($form['learner_type'] === 'self') {
        $studentid = $requesterid;
    } else if ($form['learner_type'] === 'linked_child') {
        $studentid = (int)$form['studentid'];
        $allowed = array_fill_keys(array_map(static fn($child): int => (int)$child->userid, $children), true);
        if ($studentid <= 0 || !isset($allowed[$studentid])) {
            $errors['studentid'] = 'Choose a learner linked to your account.';
        }
    }

    if ($errors) {
        // Legacy re-renders the form with per-field errors (not a hard fail);
        // return the same map so the portal page can highlight the fields.
        http_response_code(422);
        echo json_encode([
            'ok' => false,
            'error' => 'Please complete the highlighted enrollment information.',
            'errors' => $errors,
        ], JSON_UNESCAPED_SLASHES);
        exit;
    }

    $subjectlabel = $subjects[$form['subject_area']];
    if ($form['subject_area'] === 'languages') {
        $subjectlabel .= ' - ' . $form['language_subject'];
    }
    $bodylines = [
        'Marketplace enrollment request for ' . $teachername,
        '',
        'Requester: ' . $form['requester_name'] . ' (' . str_replace('_', ' ', $form['requester_role']) . ')',
        'Contact: ' . $form['contact'],
        'Learner: ' . $form['learner_name'] . ', age ' . (int)$form['age_years'],
        'Subject / service: ' . $subjectlabel,
        'Learner level: ' . $levels[$form['learner_level']],
        'Service mode: ' . $modes[$form['service_mode']],
        'Time zone: ' . $form['timezone'],
        'Availability: ' . $form['availability'],
        'Learning goals: ' . $form['learning_goals'],
    ];
    if ($form['support_needs'] !== '') {
        $bodylines[] = 'Support needs: ' . $form['support_needs'];
    }
    if ($form['questions'] !== '') {
        $bodylines[] = 'Questions for the teacher: ' . $form['questions'];
    }
    $enrollmentbody = implode("\n", $bodylines);
    $createdthreadid = pqme_create_thread($requesterid, $teacherid, $studentid, $teachername, $enrollmentbody);

    $params = ['teacherid' => $teacherid, 'parentid' => $requesterid, 'studentid' => $studentid];
    $consumerwhere = '';
    if (pqme_column_exists('local_prequran_teacher_request', 'consumerid')) {
        $consumerwhere = ' AND consumerid = :consumerid';
        $params['consumerid'] = (int)$consumercontext->consumerid;
    }
    $existing = $DB->get_record_sql(
        "SELECT * FROM {local_prequran_teacher_request}
          WHERE teacherid = :teacherid AND parentid = :parentid AND studentid = :studentid
            {$consumerwhere} AND request_status NOT IN ('assigned', 'declined', 'closed')
       ORDER BY id DESC",
        $params,
        IGNORE_MULTIPLE
    );
    $now = time();
    $identitynote = 'Enrollment completed by verified Moodle user #' . $requesterid . '.';
    if ($existing) {
        $existing->request_status = 'enrollment_submitted';
        $existing->message = $enrollmentbody;
        $existing->threadid = $createdthreadid > 0 ? $createdthreadid : (int)$existing->threadid;
        $existing->admin_notes = trim((string)$existing->admin_notes . "\n" . $identitynote);
        $existing->timemodified = $now;
        $DB->update_record('local_prequran_teacher_request', $existing);
        $requestid = (int)$existing->id;
    } else {
        $record = (object)[
            'teacherid' => $teacherid, 'parentid' => $requesterid, 'studentid' => $studentid,
            'request_status' => 'enrollment_submitted', 'message' => $enrollmentbody,
            'threadid' => $createdthreadid, 'admin_notes' => $identitynote,
            'reviewedby' => 0, 'reviewedat' => 0, 'timecreated' => $now, 'timemodified' => $now,
        ];
        if (pqme_column_exists('local_prequran_teacher_request', 'consumerid')) {
            $record->consumerid = (int)$consumercontext->consumerid;
        }
        $requestid = (int)$DB->insert_record('local_prequran_teacher_request', $record);
    }
    if (pqme_table_exists('local_prequran_live_audit')) {
        $DB->insert_record('local_prequran_live_audit', (object)[
            'sessionid' => 0, 'actorid' => $requesterid,
            'action' => 'marketplace_enrollment_submitted', 'targettype' => 'teacher_request',
            'targetid' => $requestid,
            'details' => json_encode(['teacherid' => $teacherid, 'studentid' => $studentid, 'threadid' => $createdthreadid, 'loggedin' => true]),
            'timecreated' => $now,
        ]);
    }

    $messagesurl = $createdthreadid > 0
        ? (new moodle_url('/local/hubredirect/communications.php', $consumerparams + ['threadid' => $createdthreadid, 'opencomm' => 'messages']))->out(false)
        : '';
    echo json_encode([
        'ok' => true,
        'message' => 'Enrollment submitted. Your request and communication thread are ready for marketplace review.',
        'requestid' => $requestid,
        'threadid' => $createdthreadid,
        'messagesurl' => $messagesurl,
    ], JSON_UNESCAPED_SLASHES);
    exit;
}

// ==============================================================================
// GET — enrollment options + state (same data the page renders inline).
// ==============================================================================
$childrenout = [];
foreach ($children as $child) {
    $childrenout[] = [
        'studentid' => (int)$child->userid,
        'name' => (string)$child->student_display_name,
    ];
}

echo json_encode([
    'ok' => true,
    'ready' => $ready,
    'brand' => $brandname,
    'teacher' => [
        'id' => $teacherid,
        'name' => $teachername,
        'profileurl' => $profileurl,
    ],
    'requester' => [
        'name' => fullname($USER),
        'contact' => (string)$USER->email,
    ],
    'children' => $childrenout,
    'options' => [
        'roles' => $roles,
        'subjects' => $subjects,
        'levels' => $levels,
        'languages' => $languages,
        'modes' => $modes,
    ],
    'defaults' => [
        'requester_role' => 'parent_guardian',
        'learner_type' => $childrenout ? 'linked_child' : 'new_learner',
        'timezone' => 'Africa/Nairobi',
    ],
], JSON_UNESCAPED_SLASHES);
exit;
