<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');

function pqme_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqme_column_exists(string $table, string $column): bool {
    global $DB;
    if (!pqme_table_exists($table)) {
        return false;
    }
    try {
        return array_key_exists($column, $DB->get_columns($table));
    } catch (Throwable $e) {
        return false;
    }
}

function pqme_text(string $name, string $default = '', int $limit = 1000): string {
    return core_text::substr(trim(optional_param($name, $default, PARAM_TEXT)), 0, $limit);
}

function pqme_contact_valid(string $contact): bool {
    if (validate_email($contact)) {
        return true;
    }
    $digits = preg_replace('/\D+/', '', $contact);
    return core_text::strlen((string)$digits) >= 7 && core_text::strlen((string)$digits) <= 20;
}

function pqme_parent_children(int $parentid): array {
    global $DB;
    if ($parentid <= 0 || !pqme_table_exists('local_prequran_comm_consent') || !pqme_table_exists('local_prequran_student_profile')) {
        return [];
    }
    return array_values($DB->get_records_sql(
        "SELECT sp.userid, sp.student_display_name
           FROM {local_prequran_comm_consent} cc
           JOIN {local_prequran_student_profile} sp ON sp.userid = cc.studentid
          WHERE cc.guardianid = :parentid
       ORDER BY sp.student_display_name ASC",
        ['parentid' => $parentid],
        0,
        100
    ));
}

function pqme_add_participant(int $threadid, int $userid, string $role): void {
    global $DB;
    if ($threadid <= 0 || $userid <= 0 || !pqme_table_exists('local_prequran_comm_participant')) {
        return;
    }
    if ($DB->record_exists('local_prequran_comm_participant', ['threadid' => $threadid, 'userid' => $userid])) {
        return;
    }
    $now = time();
    $DB->insert_record('local_prequran_comm_participant', (object)[
        'threadid' => $threadid,
        'userid' => $userid,
        'role' => $role,
        'canreply' => 1,
        'lastreadmessageid' => 0,
        'muted' => 0,
        'timecreated' => $now,
        'timemodified' => $now,
    ]);
}

function pqme_create_thread(int $requesterid, int $teacherid, int $studentid, string $teachername, string $body): int {
    global $DB;
    if ($requesterid <= 0 || !pqme_table_exists('local_prequran_comm_thread')
            || !pqme_table_exists('local_prequran_comm_participant')
            || !pqme_table_exists('local_prequran_comm_message')) {
        return 0;
    }
    $now = time();
    $threadid = (int)$DB->insert_record('local_prequran_comm_thread', (object)[
        'type' => 'parent_teacher',
        'cohortid' => 0,
        'studentid' => max(0, $studentid),
        'createdby' => $requesterid,
        'status' => 'active',
        'subject' => 'Marketplace enrollment for ' . $teachername,
        'lastmessageat' => $now,
        'timecreated' => $now,
        'timemodified' => $now,
    ]);
    $messageid = (int)$DB->insert_record('local_prequran_comm_message', (object)[
        'threadid' => $threadid,
        'senderid' => $requesterid,
        'studentid' => max(0, $studentid),
        'messagekind' => 'text',
        'body' => $body,
        'templatekey' => 'marketplace_enrollment',
        'status' => 'visible',
        'moderationflags' => '',
        'timecreated' => $now,
        'timemodified' => $now,
    ]);
    pqme_add_participant($threadid, $requesterid, 'parent');
    pqme_add_participant($threadid, $teacherid, 'teacher');
    if (pqme_table_exists('local_prequran_comm_audit')) {
        $DB->insert_record('local_prequran_comm_audit', (object)[
            'threadid' => $threadid,
            'messageid' => $messageid,
            'actorid' => $requesterid,
            'action' => 'marketplace_enrollment_submitted',
            'details' => json_encode(['teacherid' => $teacherid, 'studentid' => $studentid]),
            'timecreated' => $now,
        ]);
    }
    return $threadid;
}

function pqme_option(string $value, string $current, string $label): string {
    return '<option value="' . s($value) . '"' . ($value === $current ? ' selected' : '') . '>' . s($label) . '</option>';
}

$context = context_system::instance();
$consumercontext = pqh_requested_consumer_context();
$consumerparams = ['consumer' => (string)$consumercontext->consumerslug];
$brandname = trim((string)($consumercontext->consumername ?? '')) ?: 'the marketplace';
$teacherid = optional_param('teacherid', 0, PARAM_INT);
$loggedin = isloggedin() && !isguestuser();
$requesterid = $loggedin ? (int)$USER->id : 0;
$children = $loggedin ? pqme_parent_children($requesterid) : [];
$ready = pqme_table_exists('local_prequran_teacher_profile') && pqme_table_exists('local_prequran_teacher_request');
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
    redirect(new moodle_url('/local/hubredirect/teacher_marketplace.php', $consumerparams));
}

$teachername = trim((string)($teacher->teacher_display_name ?? ''));
if ($teachername === '') {
    $teacheruser = core_user::get_user($teacherid, 'id,firstname,lastname', IGNORE_MISSING);
    $teachername = $teacheruser ? fullname($teacheruser) : 'Selected teacher';
}
$profileurl = pqh_teacher_public_profile_url($teacher, $consumercontext);
$pageurl = new moodle_url('/local/hubredirect/marketplace_enrollment.php', ['teacherid' => $teacherid] + $consumerparams);
$loginurl = new moodle_url('/local/hubredirect/consumer_login.php', [
    'consumer' => (string)$consumercontext->consumerslug,
    'intent' => 'login',
    'wantsurl' => $pageurl->out(false),
]);

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

$form = [
    'requester_name' => $loggedin ? fullname($USER) : '',
    'contact' => $loggedin ? (string)$USER->email : '',
    'requester_role' => 'parent_guardian',
    'learner_type' => $children ? 'linked_child' : 'new_learner',
    'studentid' => '', 'learner_name' => '', 'age_years' => '', 'subject_area' => '',
    'language_subject' => '', 'learner_level' => '', 'learning_goals' => '',
    'support_needs' => '', 'service_mode' => '', 'timezone' => 'Africa/Nairobi',
    'availability' => '', 'questions' => '', 'consent' => 0,
];
$errors = [];
$message = '';
$createdthreadid = 0;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    foreach (array_keys($form) as $field) {
        if ($field === 'consent') {
            $form[$field] = optional_param($field, 0, PARAM_BOOL) ? 1 : 0;
        } else {
            $form[$field] = pqme_text($field, '', in_array($field, ['learning_goals', 'support_needs', 'availability', 'questions'], true) ? 3000 : 255);
        }
    }
    if (!confirm_sesskey()) {
        $errors['form'] = 'This enrollment form expired. Refresh the page and try again.';
    }
    if (pqme_text('website') !== '') {
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

    $studentid = 0;
    if ($loggedin && $form['learner_type'] === 'self') {
        $studentid = $requesterid;
    } else if ($loggedin && $form['learner_type'] === 'linked_child') {
        $studentid = (int)$form['studentid'];
        $allowed = array_fill_keys(array_map(static fn($child): int => (int)$child->userid, $children), true);
        if ($studentid <= 0 || !isset($allowed[$studentid])) {
            $errors['studentid'] = 'Choose a learner linked to your account.';
        }
    }

    if (!$errors) {
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
        $body = implode("\n", $bodylines);
        $createdthreadid = $loggedin ? pqme_create_thread($requesterid, $teacherid, $studentid, $teachername, $body) : 0;
        $existing = false;
        if ($loggedin) {
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
        }
        $now = time();
        $identitynote = $loggedin
            ? 'Enrollment completed by verified Moodle user #' . $requesterid . '.'
            : 'Guest enrollment submitted. Verify contact and link or create the requester/learner identity before enabling communication.';
        if (!$loggedin && validate_email((string)$form['contact'])) {
            $matcheduserid = (int)$DB->get_field('user', 'id', ['email' => core_text::strtolower((string)$form['contact']), 'deleted' => 0], IGNORE_MISSING);
            if ($matcheduserid > 0) {
                $identitynote .= ' Existing Moodle email match: user #' . $matcheduserid . '; reuse this identity.';
            }
        }
        if ($existing) {
            $existing->request_status = 'enrollment_submitted';
            $existing->message = $body;
            $existing->threadid = $createdthreadid > 0 ? $createdthreadid : (int)$existing->threadid;
            $existing->admin_notes = trim((string)$existing->admin_notes . "\n" . $identitynote);
            $existing->timemodified = $now;
            $DB->update_record('local_prequran_teacher_request', $existing);
            $requestid = (int)$existing->id;
        } else {
            $record = (object)[
                'teacherid' => $teacherid, 'parentid' => $requesterid, 'studentid' => $studentid,
                'request_status' => 'enrollment_submitted', 'message' => $body,
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
                'details' => json_encode(['teacherid' => $teacherid, 'studentid' => $studentid, 'threadid' => $createdthreadid, 'loggedin' => $loggedin]),
                'timecreated' => $now,
            ]);
        }
        $message = $loggedin
            ? 'Enrollment submitted. Your request and communication thread are ready for marketplace review.'
            : 'Enrollment submitted. ' . $brandname . ' will verify your contact and existing account before communication is enabled.';
    }
}

$PAGE->set_context($context);
$PAGE->set_url($pageurl);
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Marketplace Enrollment');
$PAGE->set_heading('Marketplace Enrollment');
$PAGE->add_body_class('pqh-marketplace-enrollment-page');

echo $OUTPUT->header();
?>
<style>
body.pqh-marketplace-enrollment-page header,body.pqh-marketplace-enrollment-page footer,body.pqh-marketplace-enrollment-page nav.navbar,body.pqh-marketplace-enrollment-page #page-header,body.pqh-marketplace-enrollment-page #page-footer,body.pqh-marketplace-enrollment-page .drawer,body.pqh-marketplace-enrollment-page .drawer-toggles{display:none!important}
body.pqh-marketplace-enrollment-page #page,body.pqh-marketplace-enrollment-page #page-content,body.pqh-marketplace-enrollment-page #region-main,body.pqh-marketplace-enrollment-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqme-shell{min-height:100vh;padding:28px 18px 54px;background:#f4f8fb;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#173044}.pqme-wrap{max-width:1080px;margin:0 auto}.pqme-top,.pqme-panel{background:#fff;border:1px solid rgba(23,48,68,.12);border-radius:8px;box-shadow:0 10px 24px rgba(23,48,68,.06)}.pqme-top{display:flex;justify-content:space-between;gap:16px;align-items:center;padding:24px;margin-bottom:14px;background:linear-gradient(90deg,#3f7a50,#a8c3b5 58%,#fff)}.pqme-title{margin:0;color:#fff;font-size:30px;font-weight:950}.pqme-sub{margin:7px 0 0;color:rgba(255,255,255,.92);font-weight:800}.pqme-actions{display:flex;gap:9px;flex-wrap:wrap}.pqme-btn{display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:0 15px;border:0;border-radius:8px;background:#2f6f4e;color:#fff!important;text-decoration:none;font-weight:950;cursor:pointer}.pqme-btn--light{background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12)}.pqme-panel{padding:22px}.pqme-panel h2{margin:0 0 8px;font-size:22px;font-weight:950;color:#241b24}.pqme-intro{margin:0 0 18px;color:#526875;font-weight:780;line-height:1.5}.pqme-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.pqme-field{display:grid;gap:6px}.pqme-field--full{grid-column:1/-1}.pqme-field label{font-size:13px;font-weight:950;color:#415665}.pqme-input,.pqme-select,.pqme-textarea{width:100%;min-height:46px;border:1px solid rgba(23,48,68,.2);border-radius:8px;padding:10px 12px;background:#fff;color:#173044;font:800 15px/1.35 system-ui}.pqme-textarea{min-height:105px;resize:vertical}.pqme-error{color:#9b392a;font-size:12px;font-weight:850}.pqme-alert{margin-bottom:14px;padding:14px 16px;border-radius:8px;font-weight:850}.pqme-alert--ok{background:#edf9ef;color:#245c35}.pqme-alert--bad{background:#fff0ed;color:#883526}.pqme-check{display:flex;gap:10px;align-items:flex-start;padding:14px;border:1px solid rgba(23,48,68,.14);border-radius:8px;background:#f8fbfc;font-weight:800;line-height:1.45}.pqme-check input{width:20px;height:20px;flex:0 0 auto}.pqme-footer{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:18px}.pqme-note{color:#607582;font-size:13px;font-weight:780}.pqme-trap{position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden}@media(max-width:720px){.pqme-top{display:block}.pqme-actions{margin-top:14px}.pqme-grid{grid-template-columns:1fr}.pqme-field--full{grid-column:auto}.pqme-title{font-size:25px}}
</style>
<main class="pqme-shell"><div class="pqme-wrap">
  <section class="pqme-top">
    <div><h1 class="pqme-title">Enroll to request <?php echo s($teachername); ?></h1><p class="pqme-sub">Complete the learner enrollment before messaging or selecting this teacher.</p></div>
    <div class="pqme-actions"><a class="pqme-btn pqme-btn--light" href="<?php echo $profileurl->out(false); ?>">Teacher profile</a><?php if (!$loggedin): ?><a class="pqme-btn pqme-btn--light" href="<?php echo $loginurl->out(false); ?>">Log in</a><?php endif; ?></div>
  </section>
  <?php if ($message !== ''): ?><div class="pqme-alert pqme-alert--ok"><?php echo s($message); ?><?php if ($createdthreadid > 0): ?> <a href="<?php echo (new moodle_url('/local/hubredirect/communications.php', $consumerparams + ['threadid' => $createdthreadid, 'opencomm' => 'messages']))->out(false); ?>">Open messages</a><?php elseif (!$loggedin): ?> <a href="<?php echo $loginurl->out(false); ?>">Log in if you already have an account</a><?php endif; ?></div><?php endif; ?>
  <?php if ($errors): ?><div class="pqme-alert pqme-alert--bad">Please complete the highlighted enrollment information.</div><?php endif; ?>
  <section class="pqme-panel">
    <h2>Marketplace learner enrollment</h2>
    <p class="pqme-intro">This information gives <?php echo s($teachername); ?> and <?php echo s($brandname); ?> the context needed to communicate safely and review whether the service is a good fit. It does not assign the teacher automatically.</p>
    <form method="post" novalidate>
      <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>"><input type="hidden" name="teacherid" value="<?php echo $teacherid; ?>"><input type="hidden" name="consumer" value="<?php echo s((string)$consumercontext->consumerslug); ?>">
      <div class="pqme-trap" aria-hidden="true"><label>Website<input name="website" tabindex="-1" autocomplete="off"></label></div>
      <div class="pqme-grid">
        <div class="pqme-field"><label>Your name</label><input class="pqme-input" name="requester_name" value="<?php echo s((string)$form['requester_name']); ?>"><?php if(isset($errors['requester_name'])):?><span class="pqme-error">Required</span><?php endif; ?></div>
        <div class="pqme-field"><label>Email or phone</label><input class="pqme-input" name="contact" value="<?php echo s((string)$form['contact']); ?>"><?php if(isset($errors['contact'])):?><span class="pqme-error"><?php echo s($errors['contact']); ?></span><?php endif; ?></div>
        <div class="pqme-field"><label>Your role</label><select class="pqme-select" name="requester_role"><?php echo pqme_option('parent_guardian',(string)$form['requester_role'],'Parent / guardian'); echo pqme_option('adult_learner',(string)$form['requester_role'],'Adult learner'); echo pqme_option('institution_representative',(string)$form['requester_role'],'Institution representative'); ?></select></div>
        <div class="pqme-field"><label>Learner record</label><select class="pqme-select" name="learner_type"><?php echo pqme_option('self',(string)$form['learner_type'],'For myself'); if($children){echo pqme_option('linked_child',(string)$form['learner_type'],'Existing linked learner');} echo pqme_option('new_learner',(string)$form['learner_type'],'New learner / child'); ?></select></div>
        <?php if ($children): ?><div class="pqme-field"><label>Existing linked learner</label><select class="pqme-select" name="studentid"><option value="">Select learner</option><?php foreach($children as $child){echo pqme_option((string)$child->userid,(string)$form['studentid'],(string)$child->student_display_name);} ?></select><?php if(isset($errors['studentid'])):?><span class="pqme-error"><?php echo s($errors['studentid']); ?></span><?php endif; ?></div><?php endif; ?>
        <div class="pqme-field"><label>Learner name</label><input class="pqme-input" name="learner_name" value="<?php echo s((string)$form['learner_name']); ?>"><?php if(isset($errors['learner_name'])):?><span class="pqme-error">Required</span><?php endif; ?></div>
        <div class="pqme-field"><label>Learner age</label><input class="pqme-input" name="age_years" type="number" min="1" max="99" value="<?php echo s((string)$form['age_years']); ?>"><?php if(isset($errors['age_years'])):?><span class="pqme-error"><?php echo s($errors['age_years']); ?></span><?php endif; ?></div>
        <div class="pqme-field"><label>Subject or learning service</label><select class="pqme-select" name="subject_area"><option value="">Select</option><?php foreach($subjects as $value=>$label){echo pqme_option($value,(string)$form['subject_area'],$label);} ?></select><?php if(isset($errors['subject_area'])):?><span class="pqme-error"><?php echo s($errors['subject_area']); ?></span><?php endif; ?></div>
        <div class="pqme-field"><label>Language subject, when applicable</label><select class="pqme-select" name="language_subject"><option value="">Not applicable</option><?php foreach($languages as $language){echo pqme_option($language,(string)$form['language_subject'],$language);} ?></select><?php if(isset($errors['language_subject'])):?><span class="pqme-error"><?php echo s($errors['language_subject']); ?></span><?php endif; ?></div>
        <div class="pqme-field"><label>Learner level</label><select class="pqme-select" name="learner_level"><option value="">Select</option><?php foreach($levels as $value=>$label){echo pqme_option($value,(string)$form['learner_level'],$label);} ?></select><?php if(isset($errors['learner_level'])):?><span class="pqme-error"><?php echo s($errors['learner_level']); ?></span><?php endif; ?></div>
        <div class="pqme-field"><label>Preferred service mode</label><select class="pqme-select" name="service_mode"><option value="">Select</option><?php foreach($modes as $value=>$label){echo pqme_option($value,(string)$form['service_mode'],$label);} ?></select><?php if(isset($errors['service_mode'])):?><span class="pqme-error"><?php echo s($errors['service_mode']); ?></span><?php endif; ?></div>
        <div class="pqme-field"><label>Time zone</label><input class="pqme-input" name="timezone" value="<?php echo s((string)$form['timezone']); ?>" placeholder="Example: Africa/Nairobi"><?php if(isset($errors['timezone'])):?><span class="pqme-error">Required</span><?php endif; ?></div>
        <div class="pqme-field pqme-field--full"><label>Learning goals</label><textarea class="pqme-textarea" name="learning_goals" placeholder="What should the learner be able to do or improve?"><?php echo s((string)$form['learning_goals']); ?></textarea><?php if(isset($errors['learning_goals'])):?><span class="pqme-error">Required</span><?php endif; ?></div>
        <div class="pqme-field pqme-field--full"><label>Learning support or accessibility needs</label><textarea class="pqme-textarea" name="support_needs" placeholder="Optional"><?php echo s((string)$form['support_needs']); ?></textarea></div>
        <div class="pqme-field pqme-field--full"><label>Preferred days and times</label><textarea class="pqme-textarea" name="availability" placeholder="Include your local days and times."><?php echo s((string)$form['availability']); ?></textarea><?php if(isset($errors['availability'])):?><span class="pqme-error">Required</span><?php endif; ?></div>
        <div class="pqme-field pqme-field--full"><label>Questions for <?php echo s($teachername); ?></label><textarea class="pqme-textarea" name="questions" placeholder="Optional questions about teaching style, materials, scheduling, or fees."><?php echo s((string)$form['questions']); ?></textarea></div>
        <div class="pqme-field pqme-field--full"><label class="pqme-check"><input type="checkbox" name="consent" value="1"<?php echo !empty($form['consent'])?' checked':''; ?>><span>I confirm that the information is accurate and consent to <?php echo s($brandname); ?> sharing this enrollment with the selected teacher for marketplace review and communication.</span></label><?php if(isset($errors['consent'])):?><span class="pqme-error"><?php echo s($errors['consent']); ?></span><?php endif; ?></div>
      </div>
      <div class="pqme-footer"><button class="pqme-btn" type="submit">Submit enrollment</button><span class="pqme-note"><?php echo $loggedin ? 'Your verified account will be used; no duplicate identity is created.' : 'No account is created automatically. ' . s($brandname) . ' verifies and reuses existing identities first.'; ?></span></div>
    </form>
  </section>
</div></main>
<?php echo $OUTPUT->footer();
