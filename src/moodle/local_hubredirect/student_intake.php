<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once($CFG->dirroot . '/user/lib.php');
require_once(__DIR__ . '/account_ids.php');
require_login();

if (!is_siteadmin($USER)) {
    throw new moodle_exception('nopermissions', '', '', 'Only site administrators can create student intake records.');
}

$pqsioptions = require(__DIR__ . '/student_intake_config.php');

function pqsi_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqsi_profile_ready(): bool {
    return pqsi_table_exists('local_prequran_student_profile');
}

function pqsi_trim_param(string $name, string $default = ''): string {
    return trim(optional_param($name, $default, PARAM_TEXT));
}

function pqsi_email_param(string $name): string {
    return trim(optional_param($name, '', PARAM_TEXT));
}

function pqsi_contact_is_email(string $contact): bool {
    return validate_email($contact);
}

function pqsi_phone_email(string $contact, string $prefix): string {
    $token = preg_replace('/[^0-9a-z]+/i', '', core_text::strtolower($contact));
    if ($token === '') {
        $token = uniqid($prefix, false);
    }
    return $prefix . '.' . $token . '@quraanacademy.local';
}

function pqsi_moodle_email_from_contact(string $contact, string $prefix): string {
    if ($contact !== '' && pqsi_contact_is_email($contact)) {
        return $contact;
    }
    return pqsi_phone_email($contact, $prefix);
}

function pqsi_normalize_username(string $seed): string {
    $seed = core_text::strtolower(trim($seed));
    $seed = preg_replace('/[^a-z0-9._-]+/', '.', $seed);
    $seed = trim((string)$seed, '.-_');
    return $seed !== '' ? $seed : 'qauser';
}

function pqsi_unique_username(string $seed): string {
    global $DB;
    $base = core_text::substr(pqsi_normalize_username($seed), 0, 80);
    $username = $base;
    $suffix = 1;
    while ($DB->record_exists('user', ['username' => $username, 'mnethostid' => $GLOBALS['CFG']->mnet_localhost_id])) {
        $suffix++;
        $username = core_text::substr($base, 0, 70) . $suffix;
    }
    return $username;
}

function pqsi_age_band(int $age): string {
    if ($age <= 0) {
        return '';
    }
    if ($age <= 5) {
        return '4-5';
    }
    if ($age <= 8) {
        return '6-8';
    }
    if ($age <= 11) {
        return '9-11';
    }
    if ($age <= 14) {
        return '12-14';
    }
    return '15+';
}

function pqsi_profile_columns(): array {
    global $DB;
    static $columns = null;
    if ($columns === null) {
        $columns = pqsi_profile_ready() ? $DB->get_columns('local_prequran_student_profile') : [];
    }
    return $columns;
}

function pqsi_set_profile_field(stdClass $record, string $field, $value): void {
    $columns = pqsi_profile_columns();
    if (isset($columns[$field])) {
        $record->{$field} = $value;
    }
}

function pqsi_find_user_by_email(string $email): ?stdClass {
    global $DB, $CFG;
    if ($email === '' || !pqsi_contact_is_email($email)) {
        return null;
    }
    $user = $DB->get_record('user', [
        'email' => $email,
        'deleted' => 0,
        'mnethostid' => $CFG->mnet_localhost_id,
    ], '*', IGNORE_MULTIPLE);
    return $user ?: null;
}

function pqsi_existing_user(int $userid): stdClass {
    global $DB, $CFG;
    $user = $DB->get_record('user', [
        'id' => $userid,
        'deleted' => 0,
        'mnethostid' => $CFG->mnet_localhost_id,
    ], '*', MUST_EXIST);
    return $user;
}

function pqsi_find_duplicate_profile(string $displayname, string $parentemail, string $studentemail): ?stdClass {
    global $DB;

    if ($studentemail !== '') {
        $sql = "SELECT sp.id, sp.userid, sp.student_display_name, sp.parent_email, u.email AS student_email
                  FROM {local_prequran_student_profile} sp
                  JOIN {user} u ON u.id = sp.userid
                 WHERE u.deleted = 0 AND LOWER(u.email) = LOWER(:studentemail)
              ORDER BY sp.id DESC";
        $record = $DB->get_record_sql($sql, ['studentemail' => $studentemail], IGNORE_MULTIPLE);
        if ($record) {
            $record->duplicate_reason = 'student_email';
            return $record;
        }
    }

    if ($displayname !== '' && $parentemail !== '') {
        $sql = "SELECT sp.id, sp.userid, sp.student_display_name, sp.parent_email, u.email AS student_email
                  FROM {local_prequran_student_profile} sp
                  JOIN {user} u ON u.id = sp.userid
                 WHERE u.deleted = 0
                   AND LOWER(sp.student_display_name) = LOWER(:displayname)
                   AND LOWER(sp.parent_email) = LOWER(:parentemail)
              ORDER BY sp.id DESC";
        $record = $DB->get_record_sql($sql, [
            'displayname' => $displayname,
            'parentemail' => $parentemail,
        ], IGNORE_MULTIPLE);
        if ($record) {
            $record->duplicate_reason = 'student_parent';
            return $record;
        }
    }

    return null;
}

function pqsi_create_user(string $firstname, string $lastname, string $email, string $username, bool $emailstop): array {
    global $CFG;

    $password = generate_password(12);
    $user = (object)[
        'auth' => 'manual',
        'confirmed' => 1,
        'mnethostid' => $CFG->mnet_localhost_id,
        'username' => $username,
        'password' => $password,
        'firstname' => $firstname,
        'lastname' => $lastname,
        'email' => $email,
        'emailstop' => $emailstop ? 1 : 0,
        'country' => '',
        'city' => '',
        'timezone' => '99',
        'lang' => $CFG->lang ?? 'en',
    ];

    $userid = (int)user_create_user($user, true, false);
    return [$userid, $password];
}

function pqsi_save_profile(int $studentid, array $data): int {
    global $DB, $USER;
    $now = time();
    $age = (int)$data['age_years'];
    $primarylanguage = (string)$data['primary_language'];
    $otherlanguages = (string)$data['other_languages'];

    $record = (object)[
        'userid' => $studentid,
        'timezone' => (string)$data['timezone'],
        'language' => $primarylanguage !== '' ? $primarylanguage : $otherlanguages,
        'age_years' => $age,
        'age_band' => pqsi_age_band($age),
        'current_level' => (string)$data['current_level'],
        'learning_base' => (string)$data['learning_base'],
        'country' => (string)$data['country'],
        'city' => (string)$data['city'],
        'gender' => (string)$data['gender'],
        'availability' => (string)$data['availability'],
        'parent_preferences' => (string)$data['parent_preferences'],
        'status' => 'active',
        'timemodified' => $now,
    ];
    pqsi_set_profile_field($record, 'student_display_name', (string)$data['student_display_name']);
    pqsi_set_profile_field($record, 'date_of_birth', (string)$data['date_of_birth']);
    pqsi_set_profile_field($record, 'primary_language', $primarylanguage);
    pqsi_set_profile_field($record, 'special_needs', (string)$data['special_needs']);
    pqsi_set_profile_field($record, 'course_type', (string)$data['course_type']);
    pqsi_set_profile_field($record, 'parent_name', (string)$data['parent_name']);
    pqsi_set_profile_field($record, 'parent_email', (string)$data['parent_email']);
    pqsi_set_profile_field($record, 'parent_phone', (string)$data['parent_phone']);
    pqsi_set_profile_field($record, 'live_class_consent', (int)$data['live_class_consent']);
    pqsi_set_profile_field($record, 'recording_consent', (int)$data['recording_consent']);
    pqsi_set_profile_field($record, 'consent_notes', (string)$data['consent_notes']);

    $existing = $DB->get_record('local_prequran_student_profile', ['userid' => $studentid]);
    if ($existing) {
        $record->id = (int)$existing->id;
        $DB->update_record('local_prequran_student_profile', $record);
        return (int)$existing->id;
    }

    $record->createdby = (int)$USER->id;
    $record->timecreated = $now;
    return (int)$DB->insert_record('local_prequran_student_profile', $record);
}

function pqsi_upsert_comm_consent(int $studentid, int $parentid): void {
    global $DB;
    if (!pqsi_table_exists('local_prequran_comm_consent') || $studentid <= 0 || $parentid <= 0) {
        return;
    }
    $now = time();
    $record = (object)[
        'studentid' => $studentid,
        'guardianid' => $parentid,
        'student_messaging_enabled' => 0,
        'free_text_enabled' => 0,
        'parent_visible' => 1,
        'consent_source' => 'student_intake',
        'timemodified' => $now,
    ];
    $existing = $DB->get_record('local_prequran_comm_consent', ['studentid' => $studentid, 'guardianid' => $parentid]);
    if ($existing) {
        $record->id = (int)$existing->id;
        $DB->update_record('local_prequran_comm_consent', $record);
        return;
    }
    $record->timecreated = $now;
    $DB->insert_record('local_prequran_comm_consent', $record);
}

function pqsi_upsert_live_consent(int $studentid, int $parentid, string $type, int $granted, string $details): void {
    global $DB;
    if (!pqsi_table_exists('local_prequran_live_consent') || $studentid <= 0 || $parentid <= 0) {
        return;
    }
    $now = time();
    $record = (object)[
        'studentid' => $studentid,
        'guardianid' => $parentid,
        'consent_type' => $type,
        'granted' => $granted,
        'version' => '1',
        'consent_source' => 'student_intake',
        'details' => $details,
        'timemodified' => $now,
    ];
    $existing = $DB->get_record('local_prequran_live_consent', [
        'studentid' => $studentid,
        'guardianid' => $parentid,
        'consent_type' => $type,
    ]);
    if ($existing) {
        $record->id = (int)$existing->id;
        $DB->update_record('local_prequran_live_consent', $record);
        return;
    }
    $record->timecreated = $now;
    $DB->insert_record('local_prequran_live_consent', $record);
}

function pqsi_audit(string $action, string $targettype, int $targetid, array $details = []): void {
    global $DB, $USER;
    if (!pqsi_table_exists('local_prequran_live_audit')) {
        return;
    }
    $DB->insert_record('local_prequran_live_audit', (object)[
        'sessionid' => 0,
        'actorid' => (int)$USER->id,
        'action' => $action,
        'targettype' => $targettype,
        'targetid' => $targetid,
        'details' => $details ? json_encode($details) : '',
        'timecreated' => time(),
    ]);
}

function pqsi_form_value(array $form, string $name): string {
    if (!isset($form[$name])) {
        return '';
    }
    return is_array($form[$name]) ? implode(', ', array_map('strval', $form[$name])) : (string)$form[$name];
}

function pqsi_field_label(string $name): string {
    $labels = [
        'existing_studentid' => 'Existing Moodle student ID',
        'student_firstname' => 'First name',
        'student_lastname' => 'Last name',
        'student_display_name' => 'Display name',
        'student_username' => 'Username',
        'student_email' => 'Student email or phone',
        'date_of_birth' => 'Date of birth',
        'age_years' => 'Age',
        'gender' => 'Gender',
        'special_needs' => 'Special Needs',
        'course_type' => 'Course',
        'country' => 'Country',
        'city' => 'City',
        'city_other' => 'City not listed',
        'timezone' => 'Time zone',
        'primary_language' => 'Primary language',
        'other_languages' => 'Other languages',
        'current_level' => 'Current level',
        'learning_base' => 'Base of learning',
        'availability' => 'Availability notes',
        'availability_days' => 'Available days',
        'availability_time_windows' => 'Available times',
        'session_count' => 'Number of sessions',
        'slots' => 'Preferred weekly live-session number of sessions and hours',
        'parent_name' => 'Parent/guardian name',
        'parent_email' => 'Parent/guardian email or phone',
        'parent_phone' => 'Parent/guardian phone / WhatsApp',
        'parent_username' => 'Parent username',
        'parent_preferences' => 'Parent preferences',
        'live_class_consent' => 'Live class consent',
        'recording_consent' => 'Recording consent',
        'consent_notes' => 'Consent notes/comment',
    ];
    return $labels[$name] ?? ucfirst(str_replace('_', ' ', $name));
}

function pqsi_form_error(array $errors, string $name): string {
    return isset($errors[$name]) ? '<div class="pqsi-error">' . s(pqsi_field_label($name) . ': ' . $errors[$name]) . '</div>' : '';
}

function pqsi_field_class(array $errors, string $name): string {
    return isset($errors[$name]) ? ' pqsi-field--error' : '';
}

function pqsi_selected(array $form, string $name, string $value): string {
    return pqsi_form_value($form, $name) === $value ? ' selected' : '';
}

function pqsi_checked(array $form, string $name): string {
    return !empty($form[$name]) ? ' checked' : '';
}

function pqsi_select(string $name, array $options, array $form, array $errors, string $placeholder = 'Select'): string {
    $selected = pqsi_form_value($form, $name);
    $html = '<select class="pqsi-select" name="' . s($name) . '">';
    $html .= '<option value="">' . s($placeholder) . '</option>';
    foreach ($options as $value => $label) {
        $html .= '<option value="' . s((string)$value) . '"' . ($selected === (string)$value ? ' selected' : '') . '>' . s((string)$label) . '</option>';
    }
    $html .= '</select>' . pqsi_form_error($errors, $name);
    return $html;
}

function pqsi_multi_select(string $name, array $options, array $form, array $errors, int $size = 5): string {
    $selected = isset($form[$name]) && is_array($form[$name]) ? array_map('strval', $form[$name]) : [];
    $html = '<select class="pqsi-select pqsi-select--multi" name="' . s($name) . '[]" multiple size="' . max(2, $size) . '">';
    foreach ($options as $value => $label) {
        $html .= '<option value="' . s((string)$value) . '"' . (in_array((string)$value, $selected, true) ? ' selected' : '') . '>' . s((string)$label) . '</option>';
    }
    $html .= '</select>' . pqsi_form_error($errors, $name);
    return $html;
}

function pqsi_checkbox_group(string $name, array $options, array $form, array $errors): string {
    $selected = isset($form[$name]) && is_array($form[$name]) ? array_map('strval', $form[$name]) : [];
    $html = '<div class="pqsi-choicegrid">';
    foreach ($options as $value => $label) {
        $checked = in_array((string)$value, $selected, true) ? ' checked' : '';
        $html .= '<label class="pqsi-choice"><input type="checkbox" name="' . s($name) . '[]" value="' . s((string)$value) . '"' . $checked . '><span>' . s((string)$label) . '</span></label>';
    }
    $html .= '</div>' . pqsi_form_error($errors, $name);
    return $html;
}

function pqsi_param_array(string $name): array {
    $values = optional_param_array($name, [], PARAM_TEXT);
    $clean = [];
    foreach ($values as $value) {
        $value = trim((string)$value);
        if ($value !== '' && !in_array($value, $clean, true)) {
            $clean[] = $value;
        }
    }
    return $clean;
}

function pqsi_labels(array $values, array $options): array {
    $labels = [];
    foreach ($values as $value) {
        $labels[] = (string)($options[$value] ?? $value);
    }
    return $labels;
}

function pqsi_valid_slots(array $slots, array $days, array $hours): array {
    $clean = [];
    foreach ($slots as $slot) {
        $parts = explode('|', (string)$slot, 2);
        if (count($parts) !== 2) {
            continue;
        }
        [$day, $hour] = $parts;
        if (array_key_exists($day, $days) && array_key_exists($hour, $hours)) {
            $clean[$day . '|' . $hour] = $day . '|' . $hour;
        }
    }
    return array_values($clean);
}

function pqsi_slot_summary(array $slots, array $days, array $hours, int $sessioncount): string {
    $grouped = [];
    foreach ($slots as $slot) {
        $parts = explode('|', (string)$slot, 2);
        if (count($parts) !== 2) {
            continue;
        }
        [$day, $hour] = $parts;
        $daylabel = (string)($days[$day] ?? $day);
        $hourlabel = (string)($hours[$hour] ?? $hour);
        $grouped[$daylabel][$hourlabel] = $hourlabel;
    }
    $summary = ['Requested sessions per week: ' . $sessioncount];
    foreach ($grouped as $daylabel => $hourlabels) {
        $summary[] = $daylabel . ': ' . implode(', ', array_values($hourlabels));
    }
    return implode('; ', $summary);
}

$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/student_intake.php'));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Student Intake');
$PAGE->set_heading('Student Intake');
$PAGE->add_body_class('pqh-student-intake-page');

$ready = pqsi_profile_ready();
$message = '';
$error = '';
$created = [];
$fielderrors = [];
$form = [
    'requestid' => '',
    'existing_studentid' => '',
    'student_firstname' => '',
    'student_lastname' => '',
    'student_display_name' => '',
    'student_username' => '',
    'student_email' => '',
    'date_of_birth' => '',
    'age_years' => '',
    'gender' => '',
    'special_needs' => '',
    'course_type' => '',
    'country' => '',
    'city' => '',
    'city_other' => '',
    'timezone' => 'Africa/Nairobi',
    'primary_language' => '',
    'other_languages' => [],
    'current_level' => '',
    'learning_base' => '',
    'availability' => '',
    'session_count' => '1',
    'slots' => [],
    'availability_days' => [],
    'availability_time_windows' => [],
    'parent_name' => '',
    'parent_email' => '',
    'parent_phone' => '',
    'parent_username' => '',
    'parent_preferences' => '',
    'live_class_consent' => 0,
    'recording_consent' => 0,
    'consent_notes' => '',
];

$prefillrequestid = 0;
if ($ready && $_SERVER['REQUEST_METHOD'] !== 'POST' && !empty($SESSION->pqsi_prefill) && is_array($SESSION->pqsi_prefill)) {
    $prefill = $SESSION->pqsi_prefill;
    unset($SESSION->pqsi_prefill);
    foreach ($form as $field => $default) {
        if (array_key_exists($field, $prefill)) {
            $form[$field] = $prefill[$field];
        }
    }
    $prefillrequestid = (int)($form['requestid'] ?? 0);
    $message = $prefillrequestid > 0
        ? 'Public intake request #' . $prefillrequestid . ' loaded. Review the details, then create the Moodle student intake.'
        : 'Intake details loaded. Review the details, then create the Moodle student intake.';
}

if (!empty($SESSION->pqsi_created)) {
    $created = (array)$SESSION->pqsi_created;
    unset($SESSION->pqsi_created);
    $message = 'Student intake completed. The student is now ready for grouping.';
}

if ($ready && $_SERVER['REQUEST_METHOD'] === 'POST') {
    require_sesskey();
    $transaction = null;
    try {
        $requestid = optional_param('requestid', 0, PARAM_INT);
        $existingstudentid = optional_param('existing_studentid', 0, PARAM_INT);
        $firstname = pqsi_trim_param('student_firstname');
        $lastname = pqsi_trim_param('student_lastname');
        $displayname = pqsi_trim_param('student_display_name', trim($firstname . ' ' . $lastname));
        $studentemail = pqsi_email_param('student_email');
        $parentname = pqsi_trim_param('parent_name');
        $parentemail = pqsi_email_param('parent_email');
        $parentphone = pqsi_trim_param('parent_phone');
        $parentcontact = $parentemail !== '' ? $parentemail : $parentphone;
        $timezone = pqsi_trim_param('timezone', 'Africa/Nairobi');
        $country = pqsi_trim_param('country');
        $city = pqsi_trim_param('city');
        $cityother = pqsi_trim_param('city_other');
        $savedcity = $city === 'Other' ? $cityother : $city;

        $form = [
            'requestid' => $requestid > 0 ? (string)$requestid : '',
            'existing_studentid' => $existingstudentid > 0 ? (string)$existingstudentid : '',
            'student_firstname' => $firstname,
            'student_lastname' => $lastname,
            'student_display_name' => $displayname,
            'student_username' => optional_param('student_username', '', PARAM_USERNAME),
            'student_email' => $studentemail,
            'date_of_birth' => pqsi_trim_param('date_of_birth'),
            'age_years' => (string)optional_param('age_years', 0, PARAM_INT),
            'gender' => pqsi_trim_param('gender'),
            'special_needs' => pqsi_trim_param('special_needs'),
            'course_type' => pqsi_trim_param('course_type'),
            'country' => $country,
            'city' => $city,
            'city_other' => $cityother,
            'timezone' => $timezone,
            'primary_language' => pqsi_trim_param('primary_language'),
            'other_languages' => pqsi_param_array('other_languages'),
            'current_level' => pqsi_trim_param('current_level'),
            'learning_base' => pqsi_trim_param('learning_base'),
            'session_count' => (string)optional_param('session_count', 1, PARAM_INT),
            'slots' => pqsi_param_array('slots'),
            'availability_days' => [],
            'availability_time_windows' => [],
            'availability' => pqsi_trim_param('availability_summary'),
            'parent_name' => $parentname,
            'parent_email' => $parentemail,
            'parent_phone' => $parentphone,
            'parent_username' => optional_param('parent_username', '', PARAM_USERNAME),
            'parent_preferences' => pqsi_trim_param('parent_preferences'),
            'live_class_consent' => optional_param('live_class_consent', 0, PARAM_BOOL) ? 1 : 0,
            'recording_consent' => optional_param('recording_consent', 0, PARAM_BOOL) ? 1 : 0,
            'consent_notes' => pqsi_trim_param('consent_notes'),
        ];
        $sessioncount = max(1, min(5, (int)$form['session_count']));
        $form['session_count'] = (string)$sessioncount;
        $form['slots'] = pqsi_valid_slots(
            $form['slots'],
            $pqsioptions['availability_days'] ?? [],
            $pqsioptions['availability_time_windows'] ?? []
        );
        $slotsummary = pqsi_slot_summary(
            $form['slots'],
            $pqsioptions['availability_days'] ?? [],
            $pqsioptions['availability_time_windows'] ?? [],
            $sessioncount
        );
        $availabilitynotes = $form['availability'];
        $availabilityforsave = $slotsummary;
        if ($availabilityforsave !== '' && $availabilitynotes !== '') {
            $availabilityforsave .= '; Notes: ' . $availabilitynotes;
        } else if ($availabilityforsave === '') {
            $availabilityforsave = $availabilitynotes;
        }

        if ($existingstudentid <= 0 && ($firstname === '' || $lastname === '')) {
            if ($firstname === '') {
                $fielderrors['student_firstname'] = 'First name is required when creating a new Moodle student account.';
            }
            if ($lastname === '') {
                $fielderrors['student_lastname'] = 'Last name is required when creating a new Moodle student account.';
            }
        }
        $ageyears = optional_param('age_years', 0, PARAM_INT);
        $isadultstudent = $ageyears >= 18;
        if (!$isadultstudent) {
            if ($parentname === '') {
                $fielderrors['parent_name'] = 'Parent/guardian name is required for students under 18.';
            }
            if ($parentcontact === '') {
                $fielderrors['parent_email'] = 'Parent/guardian email, phone, or WhatsApp is required for students under 18.';
            }
        } else if ($studentemail === '') {
            $fielderrors['student_email'] = 'Adult students must have their own email address or phone number when no parent/guardian is linked.';
        }

        $data = [
            'student_display_name' => $displayname,
            'date_of_birth' => $form['date_of_birth'],
            'age_years' => max(0, min(99, $ageyears)),
            'gender' => $form['gender'],
            'special_needs' => $form['special_needs'],
            'course_type' => $form['course_type'],
            'country' => $country,
            'city' => $savedcity,
            'timezone' => $timezone,
            'primary_language' => $form['primary_language'],
            'other_languages' => implode(', ', pqsi_labels($form['other_languages'], $pqsioptions['other_languages'] ?? [])),
            'current_level' => $form['current_level'],
            'learning_base' => $form['learning_base'],
            'availability' => $availabilityforsave,
            'parent_name' => $parentname,
            'parent_email' => $parentcontact,
            'parent_phone' => $parentphone !== '' ? $parentphone : (!pqsi_contact_is_email($parentcontact) ? $parentcontact : ''),
            'parent_preferences' => $form['parent_preferences'],
            'live_class_consent' => (int)$form['live_class_consent'],
            'recording_consent' => (int)$form['recording_consent'],
            'consent_notes' => $form['consent_notes'],
        ];
        if ((int)$data['live_class_consent'] !== 1) {
            $fielderrors['live_class_consent'] = 'Live class consent is required before creating the student intake record.';
        }
        foreach ([
            'age_years' => 'Age is required.',
            'gender' => 'Gender is required.',
            'special_needs' => 'Special Needs must be Yes or No.',
            'course_type' => 'Course is required.',
            'country' => 'Country is required.',
            'city' => 'City is required.',
            'timezone' => 'Time zone is required.',
            'primary_language' => 'Primary language is required.',
            'current_level' => 'Current level is required.',
            'learning_base' => 'Base of learning is required.',
        ] as $field => $fieldmessage) {
            if (($field === 'age_years' && (int)$data['age_years'] <= 0) || ($field !== 'age_years' && trim((string)$data[$field]) === '')) {
                $fielderrors[$field] = $fieldmessage;
            }
        }
        if (!in_array((string)$data['special_needs'], ['yes', 'no'], true)) {
            $fielderrors['special_needs'] = 'Special Needs must be Yes or No.';
        }
        if (!array_key_exists((string)$data['course_type'], $pqsioptions['course_types'] ?? [])) {
            $fielderrors['course_type'] = 'Select a valid course.';
        }
        if (!array_key_exists((string)$form['session_count'], $pqsioptions['session_counts'] ?? [])) {
            $fielderrors['session_count'] = 'Select a valid number of sessions.';
        }
        if (!$form['slots']) {
            $fielderrors['slots'] = 'Select at least one weekly time that could work.';
        } else if (count($form['slots']) < (int)$form['session_count']) {
            $fielderrors['slots'] = 'Select at least as many weekly time options as the requested number of sessions.';
        }
        $countryzones = $pqsioptions['country_timezones'][$country] ?? [];
        if ($timezone !== '' && $countryzones && !in_array($timezone, array_map('strval', $countryzones), true)) {
            $fielderrors['timezone'] = 'Select a time zone for the selected country.';
        }
        if ($city === 'Other' && $cityother === '') {
            $fielderrors['city_other'] = 'Enter the city name.';
        }
        if ($fielderrors) {
            throw new InvalidArgumentException('__validation__');
        }

        if ($existingstudentid <= 0) {
            $studentduplicateemail = $studentemail !== '' ? pqsi_moodle_email_from_contact($studentemail, 'student') : '';
            $duplicate = pqsi_find_duplicate_profile($displayname, $parentcontact, $studentduplicateemail);
            if ($duplicate) {
                if (($duplicate->duplicate_reason ?? '') === 'student_email') {
                    $fielderrors['student_email'] = 'This student email or phone is already used by an existing intake profile. Existing Moodle student ID: ' . (int)$duplicate->userid . '. Use Existing Moodle student ID to update that profile instead of creating a duplicate.';
                } else {
                    $fielderrors['student_display_name'] = 'A student intake profile already exists with this display name and parent contact. Existing Moodle student ID: ' . (int)$duplicate->userid . '. Use Existing Moodle student ID to update that profile instead of creating a duplicate.';
                    $fielderrors['parent_email'] = 'This exact student display name + parent contact already exists.';
                }
                throw new InvalidArgumentException('__validation__');
            }
        }

        $transaction = $DB->start_delegated_transaction();

        $studentusername = '';
        $studentpassword = '';
        $studentaccountid = '';
        if ($existingstudentid > 0) {
            $studentuser = pqsi_existing_user($existingstudentid);
            $studentid = (int)$studentuser->id;
            $studentusername = (string)$studentuser->username;
            if ($displayname === '') {
                $displayname = fullname($studentuser);
                $data['student_display_name'] = $displayname;
            }
        } else {
            $studentusername = pqsi_unique_username(optional_param('student_username', '', PARAM_USERNAME) ?: 'student.' . $firstname . '.' . $lastname);
            $studentmoodleemail = $studentemail !== '' ? pqsi_moodle_email_from_contact($studentemail, 'student') : $studentusername . '@quraanacademy.local';

            [$studentid, $studentpassword] = pqsi_create_user($firstname, $lastname, $studentmoodleemail, $studentusername, true);
        }
        $studentaccountid = pqh_assign_account_id($studentid, 'student');

        $studentuser = core_user::get_user($studentid);
        if ($studentuser) {
            if (core_text::strlen($country) <= 2) {
                $studentuser->country = core_text::strtoupper($country);
            }
            $studentuser->city = $savedcity;
            $studentuser->timezone = $timezone;
            user_update_user($studentuser, false, false);
        }

        $parentid = 0;
        $parentpassword = '';
        $parentcreated = false;
        $parentaccountid = '';
        if ($parentcontact !== '') {
            $parentmoodleemail = pqsi_moodle_email_from_contact($parentcontact, 'parent');
            $parentuser = pqsi_find_user_by_email($parentmoodleemail);
            if (!$parentuser && pqsi_contact_is_email($parentcontact)) {
                $parentuser = pqsi_find_user_by_email($parentcontact);
            }
            if ($parentuser) {
                $parentid = (int)$parentuser->id;
            } else {
                $parts = preg_split('/\s+/', trim($parentname));
                $parentfirst = $parts && isset($parts[0]) && $parts[0] !== '' ? $parts[0] : 'Parent';
                $parentlast = $parts && count($parts) > 1 ? trim(implode(' ', array_slice($parts, 1))) : 'Guardian';
                $parentusername = pqsi_unique_username(optional_param('parent_username', '', PARAM_USERNAME) ?: $parentcontact);
                [$parentid, $parentpassword] = pqsi_create_user($parentfirst, $parentlast, $parentmoodleemail, $parentusername, false);
                $parentcreated = true;
            }
            $parentaccountid = pqh_assign_account_id($parentid, 'parent');
        }

        $profileid = pqsi_save_profile($studentid, $data);
        pqsi_upsert_comm_consent($studentid, $parentid);
        pqsi_upsert_live_consent($studentid, $parentid, 'live_session', (int)$data['live_class_consent'], (string)$data['consent_notes']);
        pqsi_upsert_live_consent($studentid, $parentid, 'recording', (int)$data['recording_consent'], (string)$data['consent_notes']);
        pqsi_audit('student_intake_created', 'student', $studentid, [
            'profileid' => $profileid,
            'parentid' => $parentid,
            'parent_created' => $parentcreated ? 1 : 0,
            'existing_student' => $existingstudentid > 0 ? 1 : 0,
            'requestid' => $requestid,
            'student_account_id' => $studentaccountid,
            'parent_account_id' => $parentaccountid,
        ]);

        if ($requestid > 0 && pqsi_table_exists('local_prequran_intake_request')) {
            $request = $DB->get_record('local_prequran_intake_request', ['id' => $requestid]);
            if ($request) {
                $request->status = 'transferred';
                $request->transferred_userid = $studentid;
                $request->transferred_profileid = $profileid;
                $request->reviewedby = (int)$USER->id;
                $request->reviewedat = time();
                $request->timemodified = time();
                $DB->update_record('local_prequran_intake_request', $request);
                pqsi_audit('student_intake_request_transferred', 'intake_request', $requestid, [
                    'studentid' => $studentid,
                    'profileid' => $profileid,
                    'parentid' => $parentid,
                ]);
            }
        }

        $transaction->allow_commit();
        $transaction = null;

        $created = [
            'studentid' => $studentid,
            'studentusername' => $studentusername,
            'studentaccountid' => $studentaccountid,
            'studentpassword' => $studentpassword,
            'existingstudent' => $existingstudentid > 0,
            'parentid' => $parentid,
            'parentaccountid' => $parentaccountid,
            'parentcreated' => $parentcreated,
            'parentpassword' => $parentpassword,
        ];
        $SESSION->pqsi_created = $created;
        redirect(new moodle_url('/local/hubredirect/student_intake.php', ['created' => 1]));
    } catch (Throwable $e) {
        if ($transaction) {
            try {
                $transaction->rollback($e);
            } catch (Throwable $rollbackerror) {
                $e = $rollbackerror;
            }
        }
        $error = $e->getMessage() === '__validation__'
            ? 'Please fix the highlighted fields below.'
            : 'Student intake did not complete: ' . $e->getMessage();
    }
}

$formcity = pqsi_form_value($form, 'city');
if ($formcity !== '' && $formcity !== 'Other') {
    $countrycities = $pqsioptions['country_cities'][pqsi_form_value($form, 'country')] ?? [];
    if ($countrycities && !array_key_exists($formcity, $countrycities)) {
        $form['city'] = 'Other';
        $form['city_other'] = $formcity;
    }
}

echo $OUTPUT->header();
?>
<style>
body.pqh-student-intake-page header,body.pqh-student-intake-page footer,body.pqh-student-intake-page nav.navbar,body.pqh-student-intake-page #page-header,body.pqh-student-intake-page #page-footer,body.pqh-student-intake-page .drawer,body.pqh-student-intake-page .drawer-toggles,body.pqh-student-intake-page .block-region,body.pqh-student-intake-page [data-region="drawer"],body.pqh-student-intake-page [data-region="right-hand-drawer"]{display:none!important}
body.pqh-student-intake-page #page,body.pqh-student-intake-page #page-content,body.pqh-student-intake-page #region-main,body.pqh-student-intake-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqsi-shell{min-height:100vh;padding:28px 18px 54px;background:#f5f8fb;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#173044}
.pqsi-wrap{max-width:1120px;margin:0 auto}.pqsi-top,.pqsi-panel{background:#fff;border:1px solid rgba(23,48,68,.12);border-radius:10px;box-shadow:0 10px 24px rgba(23,48,68,.06)}
.pqsi-top{display:flex;justify-content:space-between;gap:14px;align-items:center;padding:22px;margin-bottom:16px}.pqsi-title{margin:0;font-size:30px;line-height:1.12;font-weight:950;color:#241b24}.pqsi-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:800}.pqsi-muted{color:#5e7280;font-size:12px}
.pqsi-actions{display:flex;flex-wrap:wrap;gap:9px}.pqsi-btn{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:0 14px;border:0;border-radius:8px;background:#2f6f4e;color:#fff!important;text-decoration:none;font-size:14px;font-weight:950;cursor:pointer}.pqsi-btn--light{background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12)}.pqsi-btn--brown{background:#7a5637}
.pqsi-panel{padding:20px;margin-bottom:16px}.pqsi-panel h2{margin:0 0 12px;font-size:22px;font-weight:950}.pqsi-panel h3{margin:18px 0 10px;font-size:15px;font-weight:950;color:#7a5637}.pqsi-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.pqsi-field{display:grid;gap:6px;margin-bottom:10px}.pqsi-field label{font-size:12px;font-weight:900;color:#415665}.pqsi-city-other{display:none}.pqsi-city-other--visible{display:grid}.pqsi-input,.pqsi-select,.pqsi-textarea{width:100%;min-height:40px;border:1px solid rgba(23,48,68,.18);border-radius:8px;padding:8px 10px;font:800 14px/1.2 system-ui;background:#fff;color:#173044}.pqsi-select--multi{min-height:124px}.pqsi-field--error .pqsi-input,.pqsi-field--error .pqsi-select,.pqsi-field--error .pqsi-textarea,.pqsi-field--error .pqsi-choicegrid,.pqsi-field--error .pqsi-calendar{border-color:#a33a2c;background:#fff8f6}.pqsi-error{font-size:12px;font-weight:900;color:#a33a2c}.pqsi-textarea{min-height:86px}.pqsi-checkrow{display:flex;gap:10px;align-items:flex-start;margin:8px 0 12px;color:#173044;font-size:13px;font-weight:900}.pqsi-checkrow input{width:18px;height:18px;margin-top:1px}.pqsi-checkrow--error{color:#a33a2c}.pqsi-choicegrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;padding:10px;border:1px solid rgba(23,48,68,.18);border-radius:8px;background:#fff}.pqsi-choice{display:flex;gap:7px;align-items:center;font-size:13px;font-weight:850;color:#173044}.pqsi-choice input{width:17px;height:17px}.pqsi-field--full{grid-column:1/-1}.pqsi-section-pill{display:inline-flex;align-items:center;padding:8px 14px;border:1px solid #f2cda8;border-radius:999px;background:#fff5ea;color:#8a4518;font-weight:950}.pqsi-calendar{overflow:auto;border:2px solid #d9e7f7;border-radius:16px;background:#fff}.pqsi-calendar table{width:100%;border-collapse:separate;border-spacing:0;min-width:980px}.pqsi-calendar th,.pqsi-calendar td{border-right:1px solid #e0ebf3;border-bottom:1px solid #e0ebf3;padding:12px;text-align:center;vertical-align:middle}.pqsi-calendar th{background:#eaf7fb;color:#213747;font-weight:950}.pqsi-calendar td:first-child{font-weight:950;text-align:left;background:#fbfaf5;color:#122638}.pqsi-slot{display:inline-flex;width:38px;height:38px;align-items:center;justify-content:center;border:1px solid #cfe1f5;border-radius:12px;background:#eef7ff}.pqsi-slot input{width:22px;height:22px}
.pqsi-alert{padding:12px 14px;border-radius:8px;margin-bottom:12px;font-weight:850}.pqsi-alert--ok{background:#edf9ef;color:#245c35}.pqsi-alert--bad{background:#fff0ed;color:#883526}.pqsi-errorlist{margin:8px 0 0;padding-left:20px}.pqsi-errorlist a{color:#883526!important;text-decoration:underline}.pqsi-empty{padding:16px;border:1px dashed rgba(23,48,68,.22);border-radius:10px;color:#5e7280;font-weight:850;background:#fff}.pqsi-result{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.pqsi-result div{padding:12px;border-radius:8px;background:#f8fbfd;border:1px solid rgba(23,48,68,.1);font-weight:850}.pqsi-result strong{display:block;color:#7a5637;margin-bottom:4px}
@media(max-width:760px){.pqsi-top{display:block}.pqsi-actions{margin-top:12px}.pqsi-grid,.pqsi-result,.pqsi-choicegrid{grid-template-columns:1fr}.pqsi-calendar table{min-width:820px}.pqsi-title{font-size:24px}}
</style>
<main class="pqsi-shell">
  <div class="pqsi-wrap">
    <section class="pqsi-top">
      <div>
        <h1 class="pqsi-title">Student Intake</h1>
        <p class="pqsi-sub">Create a Moodle student account, link a parent when needed, capture consent, and prepare the student for grouping.</p>
      </div>
      <div class="pqsi-actions">
        <a class="pqsi-btn pqsi-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/intake_requests.php'))->out(false); ?>">Public requests</a>
        <a class="pqsi-btn pqsi-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_grouping.php'))->out(false); ?>">Student grouping</a>
        <a class="pqsi-btn pqsi-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/dashboard.php'))->out(false); ?>">Dashboard</a>
        <a class="pqsi-btn" href="<?php echo (new moodle_url('/local/hubredirect/live_admin.php'))->out(false); ?>">Admin menu</a>
      </div>
    </section>

    <?php if ($message !== ''): ?><div class="pqsi-alert pqsi-alert--ok"><?php echo s($message); ?></div><?php endif; ?>
    <?php if ($error !== ''): ?>
      <div class="pqsi-alert pqsi-alert--bad">
        <?php echo s($error); ?>
        <?php if ($fielderrors): ?>
          <ul class="pqsi-errorlist">
            <?php foreach ($fielderrors as $fieldname => $fieldmessage): ?>
              <li><a href="#pqsi-<?php echo s($fieldname); ?>"><strong><?php echo s(pqsi_field_label((string)$fieldname)); ?>:</strong> <?php echo s($fieldmessage); ?></a></li>
            <?php endforeach; ?>
          </ul>
        <?php endif; ?>
      </div>
    <?php endif; ?>
    <?php if (!$ready): ?>
      <section class="pqsi-panel"><div class="pqsi-empty">Student profile table is not ready. Run the Moodle plugin upgrade for local_prequran first.</div></section>
    <?php else: ?>
      <?php if ($created): ?>
        <section class="pqsi-panel">
          <h2>Created Accounts</h2>
          <div class="pqsi-result">
            <div><strong>Student</strong>ID <?php echo s((string)($created['studentaccountid'] ?? '')); ?><br>Moodle user ID: <?php echo (int)$created['studentid']; ?><br>Username: <?php echo s($created['studentusername']); ?><?php if (empty($created['existingstudent'])): ?><br>Temporary password: <?php echo s($created['studentpassword']); ?><?php else: ?><br>Existing Moodle account linked.<?php endif; ?></div>
            <div><strong>Parent/guardian</strong><?php if (!empty($created['parentid'])): ?>ID <?php echo s((string)($created['parentaccountid'] ?? '')); ?><br>Moodle user ID: <?php echo (int)$created['parentid']; ?><br><?php echo !empty($created['parentcreated']) ? 'Parent/guardian account created.' : 'Existing parent/guardian account linked.'; ?><?php if (!empty($created['parentpassword'])): ?><br>Temporary password: <?php echo s($created['parentpassword']); ?><?php endif; ?><?php else: ?><br>Not required for this adult student.<?php endif; ?></div>
          </div>
        </section>
      <?php endif; ?>

      <section class="pqsi-panel">
        <h2>Recommended Required Minimum</h2>
        <form method="post" novalidate>
          <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
          <input type="hidden" name="requestid" value="<?php echo s(pqsi_form_value($form, 'requestid')); ?>">

          <h3>Student account</h3>
          <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'existing_studentid'); ?>" id="pqsi-existing_studentid"><label>Existing Moodle student ID</label><input class="pqsi-input" name="existing_studentid" type="number" min="0" value="<?php echo s(pqsi_form_value($form, 'existing_studentid')); ?>" placeholder="Optional: use only to add an intake profile to an already-created student"><?php echo pqsi_form_error($fielderrors, 'existing_studentid'); ?></div>
          <div class="pqsi-grid">
            <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'student_firstname'); ?>" id="pqsi-student_firstname"><label>First name</label><input class="pqsi-input" name="student_firstname" value="<?php echo s(pqsi_form_value($form, 'student_firstname')); ?>"><?php echo pqsi_form_error($fielderrors, 'student_firstname'); ?></div>
            <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'student_lastname'); ?>" id="pqsi-student_lastname"><label>Last name</label><input class="pqsi-input" name="student_lastname" value="<?php echo s(pqsi_form_value($form, 'student_lastname')); ?>"><?php echo pqsi_form_error($fielderrors, 'student_lastname'); ?></div>
            <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'student_display_name'); ?>" id="pqsi-student_display_name"><label>Display name</label><input class="pqsi-input" name="student_display_name" value="<?php echo s(pqsi_form_value($form, 'student_display_name')); ?>" placeholder="Optional"><?php echo pqsi_form_error($fielderrors, 'student_display_name'); ?></div>
            <div class="pqsi-field" id="pqsi-student_username"><label>Username</label><input class="pqsi-input" name="student_username" value="<?php echo s(pqsi_form_value($form, 'student_username')); ?>" placeholder="Auto-generated if blank"></div>
            <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'student_email'); ?>" id="pqsi-student_email"><label>Student email or phone</label><input class="pqsi-input" name="student_email" value="<?php echo s(pqsi_form_value($form, 'student_email')); ?>" placeholder="Optional for children; email or phone required for adults"><?php echo pqsi_form_error($fielderrors, 'student_email'); ?></div>
            <div class="pqsi-field"><label>Date of birth</label><input class="pqsi-input" name="date_of_birth" type="date" value="<?php echo s(pqsi_form_value($form, 'date_of_birth')); ?>"></div>
            <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'age_years'); ?>"><label>Age</label><input class="pqsi-input" name="age_years" type="number" min="0" max="99" value="<?php echo s(pqsi_form_value($form, 'age_years')); ?>"><?php echo pqsi_form_error($fielderrors, 'age_years'); ?></div>
            <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'gender'); ?>"><label>Gender</label><select class="pqsi-select" name="gender"><option value="">Select</option><option value="female"<?php echo pqsi_selected($form, 'gender', 'female'); ?>>Female</option><option value="male"<?php echo pqsi_selected($form, 'gender', 'male'); ?>>Male</option></select><?php echo pqsi_form_error($fielderrors, 'gender'); ?></div>
            <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'special_needs'); ?>"><label>Special Needs</label><select class="pqsi-select" name="special_needs"><option value="">Select</option><option value="no"<?php echo pqsi_selected($form, 'special_needs', 'no'); ?>>No</option><option value="yes"<?php echo pqsi_selected($form, 'special_needs', 'yes'); ?>>Yes</option></select><?php echo pqsi_form_error($fielderrors, 'special_needs'); ?></div>
          </div>

          <h3>Location and language</h3>
          <div class="pqsi-grid">
            <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'country'); ?>" id="pqsi-country"><label>Country</label><?php echo pqsi_select('country', $pqsioptions['countries'] ?? [], $form, $fielderrors); ?></div>
            <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'city'); ?>" id="pqsi-city"><label>City</label><?php echo pqsi_select('city', $pqsioptions['cities'] ?? [], $form, $fielderrors); ?></div>
            <div class="pqsi-field pqsi-city-other<?php echo pqsi_field_class($fielderrors, 'city_other'); ?>" id="pqsi-city_other"><label>City not listed</label><input class="pqsi-input" name="city_other" value="<?php echo s(pqsi_form_value($form, 'city_other')); ?>"><?php echo pqsi_form_error($fielderrors, 'city_other'); ?></div>
            <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'primary_language'); ?>" id="pqsi-primary_language"><label>Primary language</label><?php echo pqsi_select('primary_language', $pqsioptions['primary_languages'] ?? [], $form, $fielderrors); ?></div>
            <div class="pqsi-field" id="pqsi-other_languages"><label>Other languages</label><?php echo pqsi_multi_select('other_languages', $pqsioptions['other_languages'] ?? [], $form, $fielderrors, 5); ?></div>
          </div>

          <h3>Learning placement</h3>
          <div class="pqsi-grid">
            <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'course_type'); ?>" id="pqsi-course_type"><label>Course</label><?php echo pqsi_select('course_type', $pqsioptions['course_types'] ?? [], $form, $fielderrors); ?></div>
            <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'current_level'); ?>" id="pqsi-current_level"><label>Current level</label><?php echo pqsi_select('current_level', $pqsioptions['current_levels'] ?? [], $form, $fielderrors); ?></div>
            <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'learning_base'); ?>" id="pqsi-learning_base"><label>Base of learning</label><?php echo pqsi_select('learning_base', $pqsioptions['learning_bases'] ?? [], $form, $fielderrors); ?></div>
          </div>

          <h3><span class="pqsi-section-pill">Preferred weekly live-session number of sessions and hours</span></h3>
          <div class="pqsi-grid">
            <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'session_count'); ?>" id="pqsi-session_count"><label>Number of sessions</label><?php echo pqsi_select('session_count', $pqsioptions['session_counts'] ?? [], $form, $fielderrors); ?></div>
            <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'timezone'); ?>" id="pqsi-timezone"><label>Time zone</label><?php echo pqsi_select('timezone', $pqsioptions['timezones'] ?? [], $form, $fielderrors); ?></div>
          </div>
          <div class="pqsi-field pqsi-field--full<?php echo pqsi_field_class($fielderrors, 'slots'); ?>" id="pqsi-slots">
            <label>Select all recurring times that could work</label>
            <div class="pqsi-calendar">
              <table>
                <thead>
                  <tr>
                    <th>Day</th>
                    <?php foreach (($pqsioptions['availability_time_windows'] ?? []) as $hourvalue => $hourlabel): ?>
                      <th><?php echo s((string)$hourlabel); ?></th>
                    <?php endforeach; ?>
                  </tr>
                </thead>
                <tbody>
                  <?php foreach (($pqsioptions['availability_days'] ?? []) as $dayvalue => $daylabel): ?>
                    <tr>
                      <td><?php echo s((string)$daylabel); ?></td>
                      <?php foreach (($pqsioptions['availability_time_windows'] ?? []) as $hourvalue => $hourlabel): ?>
                        <?php $slotvalue = (string)$dayvalue . '|' . (string)$hourvalue; ?>
                        <td>
                          <label class="pqsi-slot" title="<?php echo s((string)$daylabel . ', ' . (string)$hourlabel); ?>">
                            <input type="checkbox" name="slots[]" value="<?php echo s($slotvalue); ?>"<?php echo in_array($slotvalue, (array)($form['slots'] ?? []), true) ? ' checked' : ''; ?>>
                          </label>
                        </td>
                      <?php endforeach; ?>
                    </tr>
                  <?php endforeach; ?>
                </tbody>
              </table>
            </div>
            <?php echo pqsi_form_error($fielderrors, 'slots'); ?>
          </div>
          <div class="pqsi-field" id="pqsi-availability"><label>Availability notes</label><textarea class="pqsi-textarea" name="availability_summary" placeholder="Exact availability, restrictions, preferred days, breaks, or admin notes"><?php echo s(pqsi_form_value($form, 'availability')); ?></textarea></div>

          <h3>Parent / guardian <span class="pqsi-muted">(required only when the student is under 18)</span></h3>
          <div class="pqsi-grid">
            <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'parent_name'); ?>" id="pqsi-parent_name"><label>Parent/guardian name</label><input class="pqsi-input" name="parent_name" value="<?php echo s(pqsi_form_value($form, 'parent_name')); ?>"><?php echo pqsi_form_error($fielderrors, 'parent_name'); ?></div>
            <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'parent_email'); ?>" id="pqsi-parent_email"><label>Parent/guardian email or phone</label><input class="pqsi-input" name="parent_email" value="<?php echo s(pqsi_form_value($form, 'parent_email')); ?>" placeholder="Email or phone number"><?php echo pqsi_form_error($fielderrors, 'parent_email'); ?></div>
            <div class="pqsi-field<?php echo pqsi_field_class($fielderrors, 'parent_phone'); ?>" id="pqsi-parent_phone"><label>Parent/guardian phone / WhatsApp</label><input class="pqsi-input" name="parent_phone" value="<?php echo s(pqsi_form_value($form, 'parent_phone')); ?>"><?php echo pqsi_form_error($fielderrors, 'parent_phone'); ?></div>
            <div class="pqsi-field"><label>Parent username</label><input class="pqsi-input" name="parent_username" value="<?php echo s(pqsi_form_value($form, 'parent_username')); ?>" placeholder="Auto-generated if blank"></div>
          </div>
          <div class="pqsi-field"><label>Parent preferences</label><textarea class="pqsi-textarea" name="parent_preferences" placeholder="Teacher gender, language, schedule, sibling grouping"><?php echo s(pqsi_form_value($form, 'parent_preferences')); ?></textarea></div>

          <h3>Consent</h3>
          <label class="pqsi-checkrow<?php echo isset($fielderrors['live_class_consent']) ? ' pqsi-checkrow--error' : ''; ?>"><input type="checkbox" name="live_class_consent" value="1"<?php echo pqsi_checked($form, 'live_class_consent'); ?>><span>Student or parent/guardian consents to live interactive classes.</span></label><?php echo pqsi_form_error($fielderrors, 'live_class_consent'); ?>
          <label class="pqsi-checkrow"><input type="checkbox" name="recording_consent" value="1"<?php echo pqsi_checked($form, 'recording_consent'); ?>><span>Student or parent/guardian consents to class recording when recording policy allows.</span></label>
          <div class="pqsi-field"><label>Consent notes/comment</label><textarea class="pqsi-textarea" name="consent_notes" placeholder="How consent was collected, who confirmed, and any limits"><?php echo s(pqsi_form_value($form, 'consent_notes')); ?></textarea></div>

          <button class="pqsi-btn pqsi-btn--brown" type="submit" name="submit_intake" value="1">Create student intake</button>
        </form>
      </section>
    <?php endif; ?>
  </div>
</main>
<script>
(function() {
  var countryCities = <?php echo json_encode($pqsioptions['country_cities'] ?? [], JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT); ?>;
  var cityLabels = <?php echo json_encode($pqsioptions['cities'] ?? [], JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT); ?>;
  var countryTimezones = <?php echo json_encode($pqsioptions['country_timezones'] ?? [], JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT); ?>;
  var timezoneLabels = <?php echo json_encode($pqsioptions['timezones'] ?? [], JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT); ?>;
  var country = document.querySelector('select[name="country"]');
  var city = document.querySelector('select[name="city"]');
  var timezone = document.querySelector('select[name="timezone"]');
  var cityOther = document.querySelector('.pqsi-city-other');
  function option(value, label, selected) {
    var item = document.createElement('option');
    item.value = value;
    item.textContent = label;
    if (selected) {
      item.selected = true;
    }
    return item;
  }
  function keys(source) {
    return Array.isArray(source) ? source.slice() : Object.keys(source || {});
  }
  function labelFor(source, value, fallback) {
    if (!source || Array.isArray(source)) {
      return fallback;
    }
    return source[value] || fallback;
  }
  function refreshCities() {
    if (!country || !city) {
      return;
    }
    var selected = city.value;
    var countryList = countryCities[country.value];
    var cities = countryList ? keys(countryList) : keys(cityLabels);
    if (cities.indexOf('Other') === -1) {
      cities.push('Other');
    }
    city.innerHTML = '';
    city.appendChild(option('', 'Select', selected === ''));
    cities.forEach(function(cityname) {
      var label = labelFor(countryList, cityname, labelFor(cityLabels, cityname, cityname));
      city.appendChild(option(cityname, label, cityname === selected));
    });
    if (selected && cities.indexOf(selected) === -1) {
      city.value = 'Other';
    }
    if (cityOther) {
      cityOther.classList.toggle('pqsi-city-other--visible', city.value === 'Other');
    }
  }
  function refreshTimezones() {
    if (!country || !timezone) {
      return;
    }
    var selected = timezone.value;
    var countryList = countryTimezones[country.value];
    var zones = countryList ? keys(countryList) : keys(timezoneLabels);
    timezone.innerHTML = '';
    timezone.appendChild(option('', 'Select', selected === ''));
    zones.forEach(function(zone) {
      var label = labelFor(countryList, zone, labelFor(timezoneLabels, zone, zone));
      timezone.appendChild(option(zone, label, zone === selected));
    });
    if (selected && zones.indexOf(selected) === -1) {
      timezone.value = zones.length === 1 ? zones[0] : '';
    }
  }
  if (country) {
    country.addEventListener('change', function() {
      refreshCities();
      refreshTimezones();
    });
  }
  if (city) {
    city.addEventListener('change', refreshCities);
  }
  refreshCities();
  refreshTimezones();
})();
</script>
<?php
echo $OUTPUT->footer();
