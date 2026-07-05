<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once($CFG->dirroot . '/user/lib.php');
require_once(__DIR__ . '/account_ids.php');
require_login();
require_once(__DIR__ . '/accesslib.php');

pqh_require_academy_operations('Only academy operations users can create teacher intake records.');

$pqtioptions = require(__DIR__ . '/teacher_intake_config.php');

function pqti_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqti_ready(): bool {
    return pqti_table_exists('local_prequran_teacher_profile');
}

function pqti_trim_param(string $name, string $default = ''): string {
    return trim(optional_param($name, $default, PARAM_TEXT));
}

function pqti_array_param(string $name): array {
    return array_values(array_filter(array_map('trim', optional_param_array($name, [], PARAM_TEXT)), static function($value): bool {
        return $value !== '';
    }));
}

function pqti_contact_is_email(string $contact): bool {
    return validate_email($contact);
}

function pqti_phone_email(string $contact, string $prefix): string {
    $token = preg_replace('/[^0-9a-z]+/i', '', core_text::strtolower($contact));
    if ($token === '') {
        $token = uniqid($prefix, false);
    }
    return $prefix . '.' . $token . '@eduplatform.local';
}

function pqti_moodle_email_from_contact(string $contact, string $prefix): string {
    if ($contact !== '' && pqti_contact_is_email($contact)) {
        return $contact;
    }
    return pqti_phone_email($contact, $prefix);
}

function pqti_normalize_username(string $seed): string {
    $seed = core_text::strtolower(trim($seed));
    $seed = preg_replace('/[^a-z0-9._-]+/', '.', $seed);
    $seed = trim((string)$seed, '.-_');
    return $seed !== '' ? $seed : 'teacher';
}

function pqti_unique_username(string $seed): string {
    global $DB, $CFG;
    $base = core_text::substr(pqti_normalize_username($seed), 0, 80);
    $username = $base;
    $suffix = 1;
    while ($DB->record_exists('user', ['username' => $username, 'mnethostid' => $CFG->mnet_localhost_id])) {
        $suffix++;
        $username = core_text::substr($base, 0, 70) . $suffix;
    }
    return $username;
}

function pqti_existing_user(int $userid): stdClass {
    global $DB, $CFG;
    $user = $DB->get_record('user', [
        'id' => $userid,
        'deleted' => 0,
        'mnethostid' => $CFG->mnet_localhost_id,
    ], '*', IGNORE_MISSING);
    if (!$user) {
        throw new invalid_parameter_exception('Choose a valid existing Moodle teacher account.');
    }
    return $user;
}

function pqti_find_user_by_email(string $email): ?stdClass {
    global $DB, $CFG;
    if ($email === '' || !pqti_contact_is_email($email)) {
        return null;
    }
    $user = $DB->get_record('user', [
        'email' => $email,
        'deleted' => 0,
        'mnethostid' => $CFG->mnet_localhost_id,
    ], '*', IGNORE_MULTIPLE);
    return $user ?: null;
}

function pqti_create_user(string $firstname, string $lastname, string $email, string $username, bool $emailstop): array {
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

function pqti_audit(string $action, string $targettype, int $targetid, array $details = []): void {
    global $DB, $USER;
    if (!pqti_table_exists('local_prequran_live_audit')) {
        return;
    }
    $DB->insert_record('local_prequran_live_audit', (object)[
        'sessionid' => 0,
        'actorid' => (int)$USER->id,
        'action' => $action,
        'targettype' => $targettype,
        'targetid' => $targetid,
        'details' => json_encode($details),
        'timecreated' => time(),
    ]);
}

function pqti_form_value(array $form, string $name, string $default = ''): string {
    $value = $form[$name] ?? $default;
    return is_array($value) ? implode(', ', $value) : (string)$value;
}

function pqti_labels(array $values, array $options): array {
    $labels = [];
    foreach ($values as $value) {
        $labels[] = (string)($options[$value] ?? $value);
    }
    return $labels;
}

function pqti_values_from_labels(string $stored, array $options): array {
    $parts = array_values(array_filter(array_map('trim', explode(',', $stored)), static function(string $value): bool {
        return $value !== '';
    }));
    if (!$parts) {
        return [];
    }

    $values = [];
    $reverse = [];
    foreach ($options as $value => $label) {
        $reverse[core_text::strtolower((string)$label)] = (string)$value;
        $reverse[core_text::strtolower((string)$value)] = (string)$value;
    }
    foreach ($parts as $part) {
        $key = core_text::strtolower($part);
        $values[] = $reverse[$key] ?? $part;
    }
    return array_values(array_unique($values));
}

function pqti_split_name(string $name): array {
    $parts = array_values(array_filter(preg_split('/\s+/', trim($name)) ?: [], static function(string $part): bool {
        return $part !== '';
    }));
    if (!$parts) {
        return ['', ''];
    }
    if (count($parts) === 1) {
        return [$parts[0], $parts[0]];
    }
    $firstname = array_shift($parts);
    return [$firstname, implode(' ', $parts)];
}

function pqti_slots_from_availability_json(string $json): array {
    $decoded = json_decode($json, true);
    if (!is_array($decoded) || empty($decoded['slots']) || !is_array($decoded['slots'])) {
        return [];
    }
    $slots = [];
    foreach ($decoded['slots'] as $slot) {
        if (!is_array($slot)) {
            continue;
        }
        $day = trim((string)($slot['day'] ?? ''));
        $time = trim((string)($slot['time'] ?? ''));
        if ($day !== '' && $time !== '') {
            $slots[] = $day . '|' . $time;
        }
    }
    return array_values(array_unique($slots));
}

function pqti_normalize_timezone(string $timezone, array $options, string $fallback = ''): string {
    $timezone = trim($timezone);
    if ($timezone === '' || $timezone === '99') {
        return $fallback;
    }
    if (array_key_exists($timezone, $options)) {
        return $timezone;
    }
    foreach ($options as $value => $label) {
        if (core_text::strtolower((string)$value) === core_text::strtolower($timezone)
            || core_text::strtolower((string)$label) === core_text::strtolower($timezone)) {
            return (string)$value;
        }
    }
    return $timezone;
}

function pqti_profile_columns(): array {
    global $DB;
    static $columns = null;
    if ($columns === null) {
        $columns = pqti_ready() ? $DB->get_columns('local_prequran_teacher_profile') : [];
    }
    return $columns;
}

function pqti_set_profile_field(stdClass $record, string $field, $value): void {
    $columns = pqti_profile_columns();
    if (isset($columns[$field])) {
        $record->{$field} = $value;
    }
}

function pqti_save_profile(int $teacherid, array $data): int {
    global $DB, $USER;
    $now = time();

    $record = (object)[
        'userid' => $teacherid,
        'teacher_display_name' => (string)$data['teacher_display_name'],
        'gender' => (string)$data['gender'],
        'country' => (string)$data['country'],
        'city' => (string)$data['city'],
        'timezone' => (string)$data['timezone'],
        'primary_language' => (string)$data['primary_language'],
        'other_languages' => (string)$data['other_languages'],
        'courses_taught' => (string)$data['courses_taught'],
        'levels_taught' => (string)$data['levels_taught'],
        'max_students_per_class' => (int)$data['max_students_per_class'],
        'max_weekly_hours' => (int)$data['max_weekly_hours'],
        'availability_summary' => (string)$data['availability_summary'],
        'bbb_trained' => (int)$data['bbb_trained'],
        'safeguarding_trained' => (int)$data['safeguarding_trained'],
        'recording_qa_ack' => (int)$data['recording_qa_ack'],
        'status' => (string)$data['status'],
        'admin_notes' => (string)$data['admin_notes'],
        'timemodified' => $now,
    ];
    pqti_set_profile_field($record, 'teacher_phone', (string)$data['teacher_phone']);
    pqti_set_profile_field($record, 'preferred_contact', (string)$data['preferred_contact']);
    pqti_set_profile_field($record, 'marketplace_visible', (int)$data['marketplace_visible']);
    pqti_set_profile_field($record, 'marketplace_status', (string)$data['marketplace_status']);
    pqti_set_profile_field($record, 'marketplace_bio', (string)$data['marketplace_bio']);
    pqti_set_profile_field($record, 'marketplace_skills', (string)$data['marketplace_skills']);
    pqti_set_profile_field($record, 'marketplace_experience', (string)$data['marketplace_experience']);
    pqti_set_profile_field($record, 'marketplace_education', (string)$data['marketplace_education']);
    pqti_set_profile_field($record, 'marketplace_teaching_style', (string)$data['marketplace_teaching_style']);
    pqti_set_profile_field($record, 'marketplace_courses', (string)$data['marketplace_courses']);
    pqti_set_profile_field($record, 'vetting_status', (string)$data['vetting_status']);
    pqti_set_profile_field($record, 'vetting_summary', (string)$data['vetting_summary']);
    pqti_set_profile_field($record, 'vetting_reviewedby', (int)$data['vetting_reviewedby']);
    pqti_set_profile_field($record, 'vetting_reviewedat', (int)$data['vetting_reviewedat']);
    pqti_set_profile_field($record, 'consumerid', (int)($data['consumerid'] ?? 0));
    pqti_set_profile_field($record, 'workspaceid', (int)($data['workspaceid'] ?? 0));

    $existing = $DB->get_record('local_prequran_teacher_profile', ['userid' => $teacherid]);
    if ($existing) {
        $record->id = (int)$existing->id;
        $DB->update_record('local_prequran_teacher_profile', $record);
        return (int)$existing->id;
    }

    $record->createdby = (int)$USER->id;
    $record->timecreated = $now;
    return (int)$DB->insert_record('local_prequran_teacher_profile', $record);
}

function pqti_weekday_number(string $day): int {
    $map = ['sun' => 0, 'mon' => 1, 'tue' => 2, 'wed' => 3, 'thu' => 4, 'fri' => 5, 'sat' => 6];
    return $map[$day] ?? -1;
}

function pqti_time_to_minutes(string $time): ?int {
    $time = trim(core_text::strtolower($time));
    if (!preg_match('/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/', $time, $matches)) {
        return null;
    }
    $hour = (int)$matches[1];
    $minute = isset($matches[2]) && $matches[2] !== '' ? (int)$matches[2] : 0;
    $ampm = $matches[3] ?? '';
    if ($ampm === 'pm' && $hour < 12) {
        $hour += 12;
    }
    if ($ampm === 'am' && $hour === 12) {
        $hour = 0;
    }
    if ($hour < 0 || $hour > 23 || $minute < 0 || $minute > 59) {
        return null;
    }
    return ($hour * 60) + $minute;
}

function pqti_save_availability_slots(int $teacherid, array $slots, string $timezone, int $slotminutes = 60): int {
    global $DB, $USER;
    if (!pqti_table_exists('local_prequran_live_availability')) {
        return 0;
    }
    $created = 0;
    $now = time();
    $slotminutes = max(1, min(24 * 60, $slotminutes));
    foreach ($slots as $slot) {
        [$day, $time] = array_pad(explode('|', (string)$slot, 2), 2, '');
        $weekday = pqti_weekday_number((string)$day);
        if ($weekday < 0) {
            continue;
        }
        $start = pqti_time_to_minutes((string)$time);
        if ($start === null) {
            continue;
        }
        $end = min(24 * 60, $start + $slotminutes);
        $exists = $DB->record_exists('local_prequran_live_availability', [
            'teacherid' => $teacherid,
            'weekday' => $weekday,
            'start_minute' => $start,
            'end_minute' => $end,
            'status' => 'active',
        ]);
        if ($exists) {
            continue;
        }
        $DB->insert_record('local_prequran_live_availability', (object)[
            'teacherid' => $teacherid,
            'weekday' => $weekday,
            'start_minute' => $start,
            'end_minute' => $end,
            'timezone' => $timezone !== '' ? $timezone : 'UTC',
            'status' => 'active',
            'createdby' => (int)$USER->id,
            'timecreated' => $now,
            'timemodified' => $now,
        ]);
        $created++;
    }
    return $created;
}

function pqti_availability_slots(int $teacherid): array {
    global $DB;
    if ($teacherid <= 0 || !pqti_table_exists('local_prequran_live_availability')) {
        return [];
    }
    $reverse = [0 => 'sun', 1 => 'mon', 2 => 'tue', 3 => 'wed', 4 => 'thu', 5 => 'fri', 6 => 'sat'];
    $slots = [];
    $rows = $DB->get_records('local_prequran_live_availability', ['teacherid' => $teacherid, 'status' => 'active'], 'weekday ASC, start_minute ASC');
    foreach ($rows as $row) {
        $weekday = (int)($row->weekday ?? -1);
        if (!isset($reverse[$weekday])) {
            continue;
        }
        $start = max(0, min(24 * 60, (int)($row->start_minute ?? 0)));
        $hour = str_pad((string)((int)floor($start / 60)), 2, '0', STR_PAD_LEFT) . ':' . str_pad((string)($start % 60), 2, '0', STR_PAD_LEFT);
        $slots[] = $reverse[$weekday] . '|' . $hour;
    }
    return array_values(array_unique($slots));
}

function pqti_slot_summary(array $slots, array $days, array $hours, int $sessioncount): string {
    if (!$slots) {
        return '';
    }
    $byday = [];
    foreach ($slots as $slot) {
        [$day, $hour] = array_pad(explode('|', (string)$slot, 2), 2, '');
        if ($day === '' || $hour === '') {
            continue;
        }
        $byday[$day][] = (string)($hours[$hour] ?? $hour);
    }
    $parts = [];
    foreach ($byday as $day => $dayhours) {
        $parts[] = (string)($days[$day] ?? $day) . ': ' . implode(', ', array_unique($dayhours));
    }
    return $sessioncount . ' session' . ($sessioncount === 1 ? '' : 's') . ' per week; available slots: ' . implode('; ', $parts);
}

function pqti_field_label(string $name): string {
    $labels = [
        'existing_teacherid' => 'Existing Moodle teacher ID',
        'teacher_requestid' => 'Teacher application ID',
        'teacher_firstname' => 'First name',
        'teacher_lastname' => 'Last name',
        'teacher_display_name' => 'Display name',
        'teacher_contact' => 'Teacher email or phone',
        'gender' => 'Gender',
        'country' => 'Country',
        'city' => 'City',
        'city_other' => 'City not listed',
        'timezone' => 'Time zone',
        'primary_language' => 'Primary teaching language',
        'courses_taught' => 'Courses taught',
        'levels_taught' => 'Levels taught',
        'session_count' => 'Number of sessions',
        'slots' => 'Preferred weekly live-session number of sessions and hours',
        'max_students_per_class' => 'Max students per class',
        'max_weekly_hours' => 'Max weekly live hours',
        'bbb_trained' => 'BBB/live classroom training',
        'safeguarding_trained' => 'Child safety training',
        'recording_qa_ack' => 'Recording and QA policy acknowledgement',
        'status' => 'Teacher status',
        'marketplace_status' => 'Marketplace status',
        'vetting_status' => 'Vetting status',
    ];
    return $labels[$name] ?? $name;
}

function pqti_form_error(array $errors, string $name): string {
    return isset($errors[$name]) ? '<div class="pqti-error">' . s($errors[$name]) . '</div>' : '';
}

function pqti_field_class(array $errors, string $name): string {
    return isset($errors[$name]) ? ' pqti-field--error' : '';
}

function pqti_selected(array $form, string $name, string $value): string {
    return pqti_form_value($form, $name) === $value ? ' selected' : '';
}

function pqti_checked(array $form, string $name): string {
    return !empty($form[$name]) ? ' checked' : '';
}

function pqti_select(string $name, array $options, array $form, array $errors, string $placeholder = 'Select'): string {
    $selected = pqti_form_value($form, $name);
    $html = '<select class="pqti-select" name="' . s($name) . '">';
    $html .= '<option value="">' . s($placeholder) . '</option>';
    foreach ($options as $value => $label) {
        $html .= '<option value="' . s((string)$value) . '"' . ($selected === (string)$value ? ' selected' : '') . '>' . s((string)$label) . '</option>';
    }
    $html .= '</select>' . pqti_form_error($errors, $name);
    return $html;
}

function pqti_workspaceid_for_requestid(int $requestid): int {
    global $DB;
    if ($requestid <= 0 || !pqti_table_exists('local_prequran_teacher_intake_request')) {
        return 0;
    }
    try {
        $columns = $DB->get_columns('local_prequran_teacher_intake_request');
    } catch (Throwable $e) {
        return 0;
    }
    if (!array_key_exists('workspaceid', $columns)) {
        return 0;
    }
    return (int)$DB->get_field('local_prequran_teacher_intake_request', 'workspaceid', ['id' => $requestid], IGNORE_MISSING);
}

function pqti_upsert_workspace_member(int $workspaceid, int $userid, string $role, string $note): void {
    global $DB, $USER;
    if ($workspaceid <= 0 || $userid <= 0 || !pqti_table_exists('local_prequran_workspace_member')) {
        return;
    }
    $now = time();
    $existing = $DB->get_record('local_prequran_workspace_member', [
        'workspaceid' => $workspaceid,
        'userid' => $userid,
        'workspace_role' => $role,
    ], '*', IGNORE_MISSING);
    if ($existing) {
        $existing->status = 'active';
        if (trim((string)($existing->notes ?? '')) === '') {
            $existing->notes = $note;
        }
        $existing->timemodified = $now;
        $DB->update_record('local_prequran_workspace_member', $existing);
        return;
    }
    $DB->insert_record('local_prequran_workspace_member', (object)[
        'workspaceid' => $workspaceid,
        'userid' => $userid,
        'workspace_role' => $role,
        'status' => 'active',
        'notes' => $note,
        'createdby' => (int)$USER->id,
        'timecreated' => $now,
        'timemodified' => $now,
    ]);
}

function pqti_multi_select(string $name, array $options, array $form, array $errors, int $size = 5): string {
    $selected = isset($form[$name]) && is_array($form[$name]) ? array_map('strval', $form[$name]) : [];
    $html = '<select class="pqti-select pqti-select--multi" name="' . s($name) . '[]" multiple size="' . $size . '">';
    foreach ($options as $value => $label) {
        $html .= '<option value="' . s((string)$value) . '"' . (in_array((string)$value, $selected, true) ? ' selected' : '') . '>' . s((string)$label) . '</option>';
    }
    $html .= '</select>' . pqti_form_error($errors, $name);
    return $html;
}

function pqti_checkbox_group(string $name, array $options, array $form, array $errors): string {
    $selected = isset($form[$name]) && is_array($form[$name]) ? array_map('strval', $form[$name]) : [];
    $html = '<div class="pqti-choicegrid">';
    foreach ($options as $value => $label) {
        $checked = in_array((string)$value, $selected, true) ? ' checked' : '';
        $html .= '<label class="pqti-choice"><input type="checkbox" name="' . s($name) . '[]" value="' . s((string)$value) . '"' . $checked . '><span>' . s((string)$label) . '</span></label>';
    }
    $html .= '</div>' . pqti_form_error($errors, $name);
    return $html;
}

$context = context_system::instance();
$consumercontext = pqh_requested_consumer_context();
$consumerparams = ['consumer' => (string)$consumercontext->consumerslug];
$contextworkspaceid = (int)$consumercontext->workspaceid;
if ($contextworkspaceid > 0) {
    $consumerparams['workspaceid'] = $contextworkspaceid;
}
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/teacher_intake.php', $consumerparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Teacher Intake');
$PAGE->set_heading('Teacher Intake');
$PAGE->add_body_class('pqh-teacher-intake-page');

$ready = pqti_ready();
$message = '';
$error = '';
$fielderrors = [];
$created = $SESSION->pqti_created ?? null;
unset($SESSION->pqti_created);

$form = [
    'teacher_requestid' => '',
    'workspaceid' => $contextworkspaceid > 0 ? (string)$contextworkspaceid : '',
    'existing_teacherid' => '',
    'teacher_firstname' => '',
    'teacher_lastname' => '',
    'teacher_display_name' => '',
    'teacher_contact' => '',
    'teacher_phone' => '',
    'teacher_username' => '',
    'preferred_contact' => 'email',
    'gender' => '',
    'country' => '',
    'city' => '',
    'city_other' => '',
    'timezone' => '',
    'primary_language' => '',
    'other_languages' => [],
    'courses_taught' => [],
    'levels_taught' => [],
    'session_count' => '1',
    'slots' => [],
    'availability_summary' => '',
    'max_students_per_class' => '9',
    'max_weekly_hours' => '10',
    'bbb_trained' => '',
    'safeguarding_trained' => '',
    'recording_qa_ack' => '',
    'status' => 'pending',
    'marketplace_visible' => '',
    'marketplace_status' => 'draft',
    'marketplace_bio' => '',
    'marketplace_skills' => '',
    'marketplace_experience' => '',
    'marketplace_education' => '',
    'marketplace_teaching_style' => '',
    'marketplace_courses' => '',
    'vetting_status' => 'not_reviewed',
    'vetting_summary' => '',
    'admin_notes' => '',
];

$sourceapplication = null;
$prefillrequestid = optional_param('teacher_requestid', 0, PARAM_INT);
if ($prefillrequestid <= 0) {
    $prefillrequestid = optional_param('requestid', 0, PARAM_INT);
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $prefillrequestid > 0) {
    try {
        if (!pqti_table_exists('local_prequran_teacher_intake_request')) {
            throw new invalid_parameter_exception('Teacher application table is not ready.');
        }
        $teacherrequest = $DB->get_record('local_prequran_teacher_intake_request', ['id' => $prefillrequestid], '*', IGNORE_MISSING);
        if (!$teacherrequest) {
            throw new invalid_parameter_exception('The selected teacher application could not be found.');
        }
        $sourceapplication = clone $teacherrequest;
        [$firstname, $lastname] = pqti_split_name((string)$teacherrequest->teacher_name);
        $form['teacher_requestid'] = (string)$prefillrequestid;
        if (!empty($teacherrequest->workspaceid)) {
            $form['workspaceid'] = (string)(int)$teacherrequest->workspaceid;
        }
        $form['teacher_firstname'] = $firstname;
        $form['teacher_lastname'] = $lastname;
        $form['teacher_display_name'] = (string)$teacherrequest->teacher_name;
        $form['teacher_contact'] = (string)$teacherrequest->email;
        $form['teacher_phone'] = (string)$teacherrequest->phone;
        $form['preferred_contact'] = validate_email((string)$teacherrequest->email) ? 'email' : 'phone';
        $form['country'] = (string)$teacherrequest->country;
        $form['city'] = (string)$teacherrequest->city;
        $form['timezone'] = pqti_normalize_timezone((string)$teacherrequest->timezone, $pqtioptions['timezones'] ?? []);
        $form['primary_language'] = (string)$teacherrequest->primary_language;
        $form['other_languages'] = pqti_values_from_labels((string)$teacherrequest->other_languages, $pqtioptions['other_languages'] ?? []);
        $form['courses_taught'] = pqti_values_from_labels((string)$teacherrequest->courses, $pqtioptions['course_types'] ?? []);
        $form['levels_taught'] = pqti_values_from_labels((string)$teacherrequest->levels, $pqtioptions['current_levels'] ?? []);
        $form['slots'] = pqti_slots_from_availability_json((string)$teacherrequest->availability_json);
        $form['availability_summary'] = (string)$teacherrequest->availability_summary;
        $form['marketplace_bio'] = (string)$teacherrequest->bio;
        $form['marketplace_experience'] = (string)$teacherrequest->experience;
        $form['marketplace_education'] = (string)$teacherrequest->education;
        $form['marketplace_teaching_style'] = (string)$teacherrequest->teaching_style;
        $form['marketplace_courses'] = (string)$teacherrequest->courses;
        $form['marketplace_skills'] = (string)$teacherrequest->levels;
        $form['vetting_status'] = (string)$teacherrequest->status === 'approved' ? 'approved' : 'in_review';
        $form['vetting_summary'] = trim((string)$teacherrequest->admin_notes) !== ''
            ? (string)$teacherrequest->admin_notes
            : 'Loaded from public teacher application #' . $prefillrequestid . '.';
        $form['admin_notes'] = trim((string)$teacherrequest->notes) !== ''
            ? 'Applicant notes: ' . (string)$teacherrequest->notes
            : 'Loaded from public teacher application #' . $prefillrequestid . '.';
        $form['marketplace_status'] = 'review';
        $form['marketplace_visible'] = '0';
        if ((int)$teacherrequest->converted_userid > 0) {
            $form['existing_teacherid'] = (string)(int)$teacherrequest->converted_userid;
        }

        if ((string)$teacherrequest->status === 'new') {
            $teacherrequest->status = 'reviewing';
            $teacherrequest->reviewedby = (int)$USER->id;
            $teacherrequest->reviewedat = time();
            $teacherrequest->timemodified = time();
            $DB->update_record('local_prequran_teacher_intake_request', $teacherrequest);
            $sourceapplication = clone $teacherrequest;
        }
    } catch (Throwable $e) {
        $error = 'Could not load teacher application into intake: ' . $e->getMessage();
    }
}

$prefillteacherid = optional_param('existing_teacherid', 0, PARAM_INT);
if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $prefillteacherid > 0) {
    $form['existing_teacherid'] = (string)$prefillteacherid;
    try {
        $teacheruser = pqti_existing_user($prefillteacherid);
        $profile = $ready ? $DB->get_record('local_prequran_teacher_profile', ['userid' => $prefillteacherid], '*', IGNORE_MISSING) : null;

        $form['teacher_firstname'] = (string)($teacheruser->firstname ?? '');
        $form['teacher_lastname'] = (string)($teacheruser->lastname ?? '');
        $form['teacher_username'] = (string)($teacheruser->username ?? '');
        $form['teacher_contact'] = (string)($teacheruser->email ?? '');
        $form['country'] = (string)($teacheruser->country ?? '');
        $form['city'] = (string)($teacheruser->city ?? '');
        $form['timezone'] = pqti_normalize_timezone((string)($teacheruser->timezone ?? ''), $pqtioptions['timezones'] ?? []);

        if ($profile) {
            $form['teacher_display_name'] = (string)($profile->teacher_display_name ?? '');
            $form['teacher_phone'] = (string)($profile->teacher_phone ?? '');
            $form['preferred_contact'] = (string)($profile->preferred_contact ?? 'email');
            $form['gender'] = (string)($profile->gender ?? '');
            $form['country'] = (string)($profile->country ?? $form['country']);
            $form['city'] = (string)($profile->city ?? $form['city']);
            $form['timezone'] = pqti_normalize_timezone((string)($profile->timezone ?? ''), $pqtioptions['timezones'] ?? [], $form['timezone']);
            $form['primary_language'] = (string)($profile->primary_language ?? '');
            $form['other_languages'] = pqti_values_from_labels((string)($profile->other_languages ?? ''), $pqtioptions['other_languages'] ?? []);
            $form['courses_taught'] = pqti_values_from_labels((string)($profile->courses_taught ?? ''), $pqtioptions['course_types'] ?? []);
            $form['levels_taught'] = pqti_values_from_labels((string)($profile->levels_taught ?? ''), $pqtioptions['current_levels'] ?? []);
            $form['max_students_per_class'] = (string)($profile->max_students_per_class ?? '9');
            $form['max_weekly_hours'] = (string)($profile->max_weekly_hours ?? '10');
            $form['availability_summary'] = (string)($profile->availability_summary ?? '');
            $form['bbb_trained'] = (string)(int)($profile->bbb_trained ?? 0);
            $form['safeguarding_trained'] = (string)(int)($profile->safeguarding_trained ?? 0);
            $form['recording_qa_ack'] = (string)(int)($profile->recording_qa_ack ?? 0);
            $form['status'] = (string)($profile->status ?? 'pending');
            $form['marketplace_visible'] = isset($profile->marketplace_visible) ? (string)(int)$profile->marketplace_visible : '';
            $form['marketplace_status'] = (string)($profile->marketplace_status ?? 'draft');
            $form['marketplace_bio'] = (string)($profile->marketplace_bio ?? '');
            $form['marketplace_skills'] = (string)($profile->marketplace_skills ?? '');
            $form['marketplace_experience'] = (string)($profile->marketplace_experience ?? '');
            $form['marketplace_education'] = (string)($profile->marketplace_education ?? '');
            $form['marketplace_teaching_style'] = (string)($profile->marketplace_teaching_style ?? '');
            $form['marketplace_courses'] = (string)($profile->marketplace_courses ?? '');
            $form['vetting_status'] = (string)($profile->vetting_status ?? 'not_reviewed');
            $form['vetting_summary'] = (string)($profile->vetting_summary ?? '');
            $form['admin_notes'] = (string)($profile->admin_notes ?? '');
            $form['slots'] = pqti_availability_slots($prefillteacherid);
        }
    } catch (Throwable $e) {
        $error = 'Could not load existing teacher intake details: ' . $e->getMessage();
    }
}

if ((bool)$created) {
    $message = 'Teacher intake completed. The teacher is now ready for scheduling and BBB assignment.';
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && optional_param('submit_intake', '', PARAM_TEXT) === '1') {
    foreach ($form as $key => $default) {
        $form[$key] = is_array($default) ? pqti_array_param($key) : pqti_trim_param($key, (string)$default);
    }

    $transaction = null;
    try {
        if (!confirm_sesskey()) {
            throw new invalid_parameter_exception('This teacher intake form expired. Please refresh and try again.');
        }
        if (!$ready) {
            throw new invalid_parameter_exception('Teacher profile table is not ready.');
        }

        $existingteacherid = (int)$form['existing_teacherid'];
        $teacherrequestid = (int)$form['teacher_requestid'];
        $workspaceid = (int)$form['workspaceid'];
        if ($workspaceid <= 0 && $teacherrequestid > 0) {
            $workspaceid = pqti_workspaceid_for_requestid($teacherrequestid);
        }
        if ($workspaceid <= 0) {
            $workspaceid = $contextworkspaceid;
        }
        $form['workspaceid'] = $workspaceid > 0 ? (string)$workspaceid : '';
        $firstname = $form['teacher_firstname'];
        $lastname = $form['teacher_lastname'];
        $displayname = $form['teacher_display_name'] !== '' ? $form['teacher_display_name'] : trim($firstname . ' ' . $lastname);
        $contact = $form['teacher_contact'];
        $phone = $form['teacher_phone'];
        $city = $form['city'];
        $cityother = $form['city_other'];
        $savedcity = $city === 'Other' ? $cityother : $city;

        if ($existingteacherid <= 0) {
            if ($firstname === '') {
                $fielderrors['teacher_firstname'] = 'First name is required when creating a new teacher account.';
            }
            if ($lastname === '') {
                $fielderrors['teacher_lastname'] = 'Last name is required when creating a new teacher account.';
            }
            if ($contact === '' && $phone === '') {
                $fielderrors['teacher_contact'] = 'Enter a teacher email or phone number.';
            }
        } else {
            pqti_existing_user($existingteacherid);
        }

        foreach ([
            'gender' => 'Gender is required.',
            'country' => 'Country is required.',
            'city' => 'City is required.',
            'timezone' => 'Time zone is required.',
            'primary_language' => 'Primary teaching language is required.',
            'status' => 'Teacher status is required.',
        ] as $field => $fieldmessage) {
            if (trim((string)$form[$field]) === '') {
                $fielderrors[$field] = $fieldmessage;
            }
        }
        if ($city === 'Other' && $cityother === '') {
            $fielderrors['city_other'] = 'Enter the city name.';
        }
        if (!$form['courses_taught']) {
            $fielderrors['courses_taught'] = 'Select at least one course this teacher can teach.';
        }
        if (!$form['levels_taught']) {
            $fielderrors['levels_taught'] = 'Select at least one level this teacher can teach.';
        }
        if ((int)$form['max_students_per_class'] <= 0 || (int)$form['max_students_per_class'] > 20) {
            $fielderrors['max_students_per_class'] = 'Enter a class size between 1 and 20.';
        }
        if ((int)$form['max_weekly_hours'] <= 0 || (int)$form['max_weekly_hours'] > 60) {
            $fielderrors['max_weekly_hours'] = 'Enter weekly live hours between 1 and 60.';
        }
        if ((int)$form['session_count'] <= 0 || (int)$form['session_count'] > 5) {
            $fielderrors['session_count'] = 'Select a number of sessions between 1 and 5.';
        }
        $validdays = array_keys($pqtioptions['availability_days'] ?? []);
        $validhours = array_keys($pqtioptions['availability_time_windows'] ?? []);
        foreach ($form['slots'] as $slot) {
            [$day, $hour] = array_pad(explode('|', (string)$slot, 2), 2, '');
            if (!in_array($day, $validdays, true) || !in_array($hour, $validhours, true)) {
                $fielderrors['slots'] = 'Select availability from the weekly calendar.';
                break;
            }
        }
        foreach ([
            'bbb_trained' => 'Confirm whether BBB/live classroom training is complete.',
            'safeguarding_trained' => 'Confirm whether child safety training is complete.',
            'recording_qa_ack' => 'Confirm whether recording and QA policy was acknowledged.',
        ] as $field => $fieldmessage) {
            if (!in_array((string)$form[$field], ['0', '1'], true)) {
                $fielderrors[$field] = $fieldmessage;
            }
        }
        if (!in_array((string)$form['marketplace_visible'], ['', '0', '1'], true)) {
            $fielderrors['marketplace_visible'] = 'Choose whether parents can see this marketplace profile.';
        }
        if (!in_array((string)$form['marketplace_status'], ['draft', 'review', 'published', 'paused'], true)) {
            $fielderrors['marketplace_status'] = 'Choose a valid marketplace status.';
        }
        if (!in_array((string)$form['vetting_status'], ['not_reviewed', 'in_review', 'approved', 'needs_update', 'rejected'], true)) {
            $fielderrors['vetting_status'] = 'Choose a valid vetting status.';
        }
        if ($fielderrors) {
            throw new InvalidArgumentException('__validation__');
        }

        $transaction = $DB->start_delegated_transaction();

        $teacherusername = '';
        $teacherpassword = '';
        $existingteacher = false;
        $teacheraccountid = '';
        if ($existingteacherid > 0) {
            $teacheruser = pqti_existing_user($existingteacherid);
            $teacherid = (int)$teacheruser->id;
            $teacherusername = (string)$teacheruser->username;
            $existingteacher = true;
            if ($displayname === '') {
                $displayname = fullname($teacheruser);
            }
        } else {
            $preferredcontact = $contact !== '' ? $contact : $phone;
            $teacheremail = pqti_moodle_email_from_contact($preferredcontact, 'teacher');
            $existinguser = pqti_find_user_by_email($teacheremail);
            if ($existinguser) {
                $teacherid = (int)$existinguser->id;
                $teacherusername = (string)$existinguser->username;
                $existingteacher = true;
            } else {
                $teacherusername = pqti_unique_username(optional_param('teacher_username', '', PARAM_USERNAME) ?: 'teacher.' . $firstname . '.' . $lastname);
                [$teacherid, $teacherpassword] = pqti_create_user($firstname, $lastname, $teacheremail, $teacherusername, !pqti_contact_is_email($preferredcontact));
            }
        }
        $teacheraccountid = pqh_assign_account_id($teacherid, 'teacher');

        $teacheruser = core_user::get_user($teacherid);
        if ($teacheruser) {
            if (core_text::strlen($form['country']) <= 2) {
                $teacheruser->country = core_text::strtoupper($form['country']);
            }
            $teacheruser->city = $savedcity;
            $teacheruser->timezone = $form['timezone'];
            user_update_user($teacheruser, false, false);
        }

        $slotsummary = pqti_slot_summary(
            $form['slots'],
            $pqtioptions['availability_days'] ?? [],
            $pqtioptions['availability_time_windows'] ?? [],
            (int)$form['session_count']
        );
        $availabilitysummary = trim((string)$form['availability_summary']);
        if ($slotsummary !== '') {
            $availabilitysummary = $availabilitysummary !== '' ? $slotsummary . "\nNotes: " . $availabilitysummary : $slotsummary;
        }

        $data = [
            'teacher_display_name' => $displayname,
            'teacher_phone' => $phone,
            'preferred_contact' => $form['preferred_contact'],
            'gender' => $form['gender'],
            'country' => $form['country'],
            'city' => $savedcity,
            'timezone' => $form['timezone'],
            'primary_language' => $form['primary_language'],
            'other_languages' => implode(', ', pqti_labels($form['other_languages'], $pqtioptions['other_languages'] ?? [])),
            'courses_taught' => implode(', ', pqti_labels($form['courses_taught'], $pqtioptions['course_types'] ?? [])),
            'levels_taught' => implode(', ', pqti_labels($form['levels_taught'], $pqtioptions['current_levels'] ?? [])),
            'max_students_per_class' => (int)$form['max_students_per_class'],
            'max_weekly_hours' => (int)$form['max_weekly_hours'],
            'availability_summary' => $availabilitysummary,
            'bbb_trained' => (int)$form['bbb_trained'],
            'safeguarding_trained' => (int)$form['safeguarding_trained'],
            'recording_qa_ack' => (int)$form['recording_qa_ack'],
            'status' => $form['status'],
            'marketplace_visible' => (int)($form['marketplace_visible'] === '1'),
            'marketplace_status' => $form['marketplace_status'],
            'marketplace_bio' => $form['marketplace_bio'],
            'marketplace_skills' => $form['marketplace_skills'],
            'marketplace_experience' => $form['marketplace_experience'],
            'marketplace_education' => $form['marketplace_education'],
            'marketplace_teaching_style' => $form['marketplace_teaching_style'],
            'marketplace_courses' => $form['marketplace_courses'],
            'vetting_status' => $form['vetting_status'],
            'vetting_summary' => $form['vetting_summary'],
            'vetting_reviewedby' => in_array((string)$form['vetting_status'], ['approved', 'needs_update', 'rejected'], true) ? (int)$USER->id : 0,
            'vetting_reviewedat' => in_array((string)$form['vetting_status'], ['approved', 'needs_update', 'rejected'], true) ? time() : 0,
            'admin_notes' => $form['admin_notes'],
            'consumerid' => (int)$consumercontext->consumerid,
            'workspaceid' => $workspaceid,
        ];

        $profileid = pqti_save_profile($teacherid, $data);
        if ($workspaceid > 0) {
            pqti_upsert_workspace_member($workspaceid, $teacherid, 'teacher', 'Added from teacher intake.');
        }
        $availabilityrows = pqti_save_availability_slots(
            $teacherid,
            $form['slots'],
            $form['timezone'],
            (int)($pqtioptions['availability_slot_minutes'] ?? 60)
        );
        pqti_audit($existingteacher ? 'teacher_intake_updated' : 'teacher_intake_created', 'teacher', $teacherid, [
            'profileid' => $profileid,
            'existing_teacher' => $existingteacher ? 1 : 0,
            'availability_rows_created' => $availabilityrows,
            'session_count' => (int)$form['session_count'],
            'slots_count' => count($form['slots']),
            'teacher_account_id' => $teacheraccountid,
            'consumerid' => (int)$consumercontext->consumerid,
            'consumerslug' => (string)$consumercontext->consumerslug,
            'teacher_requestid' => $teacherrequestid,
            'workspaceid' => $workspaceid,
        ]);

        if ($teacherrequestid > 0 && pqti_table_exists('local_prequran_teacher_intake_request')) {
            $teacherrequest = $DB->get_record('local_prequran_teacher_intake_request', ['id' => $teacherrequestid], '*', IGNORE_MISSING);
            if ($teacherrequest) {
                $teacherrequest->status = 'converted';
                $teacherrequest->converted_userid = $teacherid;
                $teacherrequest->converted_profileid = $profileid;
                $teacherrequest->reviewedby = (int)$USER->id;
                $teacherrequest->reviewedat = time();
                $teacherrequest->timemodified = time();
                $DB->update_record('local_prequran_teacher_intake_request', $teacherrequest);
            }
        }

        $transaction->allow_commit();
        $transaction = null;

        $SESSION->pqti_created = [
            'teacherid' => $teacherid,
            'teacheraccountid' => $teacheraccountid,
            'teacherusername' => $teacherusername,
            'teacherpassword' => $teacherpassword,
            'existingteacher' => $existingteacher,
            'profileid' => $profileid,
            'availabilityrows' => $availabilityrows,
            'consumerid' => (int)$consumercontext->consumerid,
            'consumerslug' => (string)$consumercontext->consumerslug,
            'teacherrequestid' => $teacherrequestid,
            'workspaceid' => $workspaceid,
        ];
        redirect(new moodle_url('/local/hubredirect/teacher_intake.php', ['created' => 1] + $consumerparams));
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
            : 'Teacher intake did not complete: ' . $e->getMessage();
    }
}

$formcity = pqti_form_value($form, 'city');
if ($formcity !== '' && $formcity !== 'Other') {
    $countrycities = $pqtioptions['country_cities'][pqti_form_value($form, 'country')] ?? [];
    if ($countrycities && !array_key_exists($formcity, $countrycities)) {
        $form['city'] = 'Other';
        $form['city_other'] = $formcity;
    }
}

$sourceapplicationid = (int)pqti_form_value($form, 'teacher_requestid');
if (!$sourceapplication && $sourceapplicationid > 0 && pqti_table_exists('local_prequran_teacher_intake_request')) {
    $sourceapplication = $DB->get_record('local_prequran_teacher_intake_request', ['id' => $sourceapplicationid], '*', IGNORE_MISSING) ?: null;
}

$missingconversion = [];
foreach ([
    'teacher_firstname' => 'First name',
    'teacher_lastname' => 'Last name',
    'teacher_contact' => 'Teacher email or phone',
    'gender' => 'Gender',
    'country' => 'Country',
    'city' => 'City',
    'timezone' => 'Time zone',
    'primary_language' => 'Primary teaching language',
    'bbb_trained' => 'BBB/live classroom training',
    'safeguarding_trained' => 'Child safety training',
    'recording_qa_ack' => 'Recording and QA acknowledgement',
] as $field => $label) {
    if (trim(pqti_form_value($form, $field)) === '') {
        $missingconversion[] = $label;
    }
}
if (!$form['courses_taught']) {
    $missingconversion[] = 'Courses taught';
}
if (!$form['levels_taught']) {
    $missingconversion[] = 'Levels taught';
}
$willpublish = pqti_form_value($form, 'status') === 'active'
    && pqti_form_value($form, 'marketplace_visible') === '1'
    && pqti_form_value($form, 'marketplace_status') === 'published'
    && pqti_form_value($form, 'vetting_status') === 'approved';

$isupdate = (int)pqti_form_value($form, 'existing_teacherid') > 0;
$pagetitle = $isupdate ? 'Update Teacher Intake' : 'Teacher Intake';
$pagesubtitle = $isupdate
    ? 'Update an existing Moodle teacher account, marketplace profile, vetting state, and BBB availability.'
    : 'Create or link a Moodle teacher account, capture live-class readiness, and set initial BBB availability.';
$paneltitle = $isupdate ? 'Update Teacher Onboarding' : 'Teacher Onboarding';
$submitlabel = $isupdate ? 'Update teacher intake' : 'Create teacher intake';

echo $OUTPUT->header();
?>
<style>
body.pqh-teacher-intake-page header,body.pqh-teacher-intake-page footer,body.pqh-teacher-intake-page nav.navbar,body.pqh-teacher-intake-page #page-header,body.pqh-teacher-intake-page #page-footer,body.pqh-teacher-intake-page .drawer,body.pqh-teacher-intake-page .drawer-toggles,body.pqh-teacher-intake-page .block-region,body.pqh-teacher-intake-page [data-region="drawer"],body.pqh-teacher-intake-page [data-region="right-hand-drawer"]{display:none!important}
body.pqh-teacher-intake-page #page,body.pqh-teacher-intake-page #page-content,body.pqh-teacher-intake-page #region-main,body.pqh-teacher-intake-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqti-shell{min-height:100vh;padding:28px 18px 54px;background:#f5f8fb;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#173044}
.pqti-wrap{max-width:1120px;margin:0 auto}.pqti-top,.pqti-panel{background:#fff;border:1px solid rgba(23,48,68,.12);border-radius:10px;box-shadow:0 10px 24px rgba(23,48,68,.06)}
.pqti-top{display:flex;justify-content:space-between;gap:14px;align-items:center;padding:22px;margin-bottom:16px}.pqti-title{margin:0;font-size:30px;line-height:1.12;font-weight:950;color:#241b24}.pqti-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:800}.pqti-muted{color:#5e7280;font-size:12px}
.pqti-actions{display:flex;flex-wrap:wrap;gap:9px}.pqti-btn{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:0 14px;border:0;border-radius:8px;background:#2f6f4e;color:#fff!important;text-decoration:none;font-size:14px;font-weight:950;cursor:pointer}.pqti-btn--light{background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12)}.pqti-btn--brown{background:#7a5637}
.pqti-panel{padding:20px;margin-bottom:16px}.pqti-panel h2{margin:0 0 12px;font-size:22px;font-weight:950}.pqti-panel h3{margin:18px 0 10px;font-size:15px;font-weight:950;color:#7a5637}.pqti-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.pqti-field{display:grid;gap:6px;margin-bottom:10px}.pqti-field label{font-size:12px;font-weight:900;color:#415665}.pqti-city-other{display:none}.pqti-city-other--visible{display:grid}.pqti-input,.pqti-select,.pqti-textarea{width:100%;min-height:40px;border:1px solid rgba(23,48,68,.18);border-radius:8px;padding:8px 10px;font:800 14px/1.2 system-ui;background:#fff;color:#173044}.pqti-select--multi{min-height:124px}.pqti-field--error .pqti-input,.pqti-field--error .pqti-select,.pqti-field--error .pqti-textarea,.pqti-field--error .pqti-choicegrid,.pqti-field--error .pqti-calendar{border-color:#a33a2c;background:#fff8f6}.pqti-error{font-size:12px;font-weight:900;color:#a33a2c}.pqti-textarea{min-height:86px}.pqti-choicegrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;padding:10px;border:1px solid rgba(23,48,68,.18);border-radius:8px;background:#fff}.pqti-choice{display:flex;gap:7px;align-items:center;font-size:13px;font-weight:850;color:#173044}.pqti-choice input{width:17px;height:17px}
.pqti-calendar{overflow:auto;border:2px solid #dbe8f7;border-radius:18px;background:#fff}.pqti-calendar table{width:100%;min-width:900px;border-collapse:collapse}.pqti-calendar th,.pqti-calendar td{border:1px solid #e3ebf1;text-align:center;padding:10px}.pqti-calendar th{background:#eaf7fb;color:#264055;font-size:14px;font-weight:950}.pqti-calendar td:first-child{background:#fbfaf6;text-align:left;font-size:15px;font-weight:950;color:#142233}.pqti-calendar tr:nth-child(even) td:first-child{background:#f7fcf8}.pqti-slot{display:inline-flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:12px;background:#eef7ff;border:1px solid #d4e8fb;cursor:pointer}.pqti-slot input{width:22px;height:22px;accent-color:#2f6f4e;cursor:pointer}
.pqti-alert{padding:12px 14px;border-radius:8px;margin-bottom:12px;font-weight:850}.pqti-alert--ok{background:#edf9ef;color:#245c35}.pqti-alert--bad{background:#fff0ed;color:#883526}.pqti-errorlist{margin:8px 0 0;padding-left:20px}.pqti-errorlist a{color:#883526!important;text-decoration:underline}.pqti-empty{padding:16px;border:1px dashed rgba(23,48,68,.22);border-radius:10px;color:#5e7280;font-weight:850;background:#fff}.pqti-result{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.pqti-result div{padding:12px;border-radius:8px;background:#f8fbfd;border:1px solid rgba(23,48,68,.1);font-weight:850}.pqti-result strong{display:block;color:#7a5637;margin-bottom:4px}
.pqti-checks{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:12px}.pqti-check{padding:12px;border:1px solid rgba(23,48,68,.1);border-radius:8px;background:#fbfdff;font-weight:850}.pqti-check strong{display:block;margin-bottom:4px;color:#7a5637}.pqti-pill{display:inline-flex;align-items:center;min-height:26px;padding:0 9px;border-radius:999px;font-size:12px;font-weight:950;background:#eef4f6;color:#173044}.pqti-pill--ok{background:#edf9ef;color:#245c35}.pqti-pill--warn{background:#fff4dc;color:#7a5637}.pqti-pill--bad{background:#fff0ed;color:#883526}.pqti-linkrow{display:flex;flex-wrap:wrap;gap:9px;margin-top:12px}
@media(max-width:760px){.pqti-top{display:block}.pqti-actions{margin-top:12px}.pqti-grid,.pqti-result,.pqti-choicegrid{grid-template-columns:1fr}.pqti-title{font-size:24px}}
@media(max-width:920px){.pqti-checks{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:560px){.pqti-checks{grid-template-columns:1fr}}
<?php echo pqh_dashboard_header_css(); ?>
</style>
<main class="pqti-shell">
  <div class="pqti-wrap">
    <section class="pqti-top pqh-workspace-top">
      <div>
        <h1 class="pqti-title pqh-workspace-title"><?php echo s($pagetitle); ?></h1>
        <p class="pqti-sub pqh-workspace-sub"><?php echo s($pagesubtitle); ?></p>
      </div>
      <div class="pqti-actions pqh-workspace-actions">
        <a class="pqti-btn pqti-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_teacher_directory.php'))->out(false); ?>">Teacher directory</a>
        <a class="pqti-btn pqti-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_availability.php'))->out(false); ?>">Availability</a>
        <a class="pqti-btn pqti-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_capacity.php'))->out(false); ?>">Capacity</a>
        <a class="pqti-btn" href="<?php echo (new moodle_url('/local/hubredirect/live_admin.php'))->out(false); ?>">Admin menu</a>
      </div>
    </section>

    <?php if ($message !== ''): ?><div class="pqti-alert pqti-alert--ok"><?php echo s($message); ?></div><?php endif; ?>
    <?php if ($error !== ''): ?>
      <div class="pqti-alert pqti-alert--bad">
        <?php echo s($error); ?>
        <?php if ($fielderrors): ?>
          <ul class="pqti-errorlist">
            <?php foreach ($fielderrors as $fieldname => $fieldmessage): ?>
              <li><a href="#pqti-<?php echo s($fieldname); ?>"><strong><?php echo s(pqti_field_label((string)$fieldname)); ?>:</strong> <?php echo s($fieldmessage); ?></a></li>
            <?php endforeach; ?>
          </ul>
        <?php endif; ?>
      </div>
    <?php endif; ?>
    <?php if (!$ready): ?>
      <section class="pqti-panel"><div class="pqti-empty">Teacher profile table is not ready. Run the teacher intake SQL script first.</div></section>
    <?php else: ?>
      <?php if ($created): ?>
        <section class="pqti-panel">
          <h2>Teacher Account</h2>
          <div class="pqti-result">
            <div><strong>Teacher</strong>ID <?php echo s((string)($created['teacheraccountid'] ?? '')); ?><br>Moodle user ID: <?php echo (int)$created['teacherid']; ?><br>Username: <?php echo s($created['teacherusername']); ?><?php if (empty($created['existingteacher'])): ?><br>Temporary password: <?php echo s($created['teacherpassword']); ?><?php else: ?><br>Existing Moodle account linked.<?php endif; ?></div>
            <div><strong>Onboarding</strong>Profile ID <?php echo (int)$created['profileid']; ?><br>Availability rows created: <?php echo (int)$created['availabilityrows']; ?></div>
            <?php if (!empty($created['workspaceid'])): ?><div><strong>Workspace</strong>Linked as teacher in workspace ID <?php echo (int)$created['workspaceid']; ?>.</div><?php endif; ?>
          </div>
          <div class="pqti-linkrow">
            <a class="pqti-btn pqti-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/teacher_intake_requests.php'))->out(false); ?>">Application queue</a>
            <a class="pqti-btn pqti-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/teacher_marketplace_profile.php', ['teacherid' => (int)$created['teacherid']] + $consumerparams))->out(false); ?>">Marketplace profile</a>
            <a class="pqti-btn pqti-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/teacher_marketplace.php', $consumerparams))->out(false); ?>">Marketplace</a>
          </div>
        </section>
      <?php endif; ?>

      <?php if ($sourceapplicationid > 0): ?>
        <section class="pqti-panel">
          <h2>Conversion Checklist</h2>
          <div class="pqti-checks">
            <div class="pqti-check"><strong>Source application</strong>#<?php echo (int)$sourceapplicationid; ?><?php if ($sourceapplication): ?><br><?php echo s((string)$sourceapplication->teacher_name); ?><?php endif; ?></div>
            <div class="pqti-check"><strong>Consumer</strong><?php echo s((string)$consumercontext->consumername); ?><br><span class="pqti-muted"><?php echo s((string)$consumercontext->consumerslug); ?></span></div>
            <div class="pqti-check"><strong>Required fields</strong><span class="pqti-pill <?php echo !$missingconversion ? 'pqti-pill--ok' : 'pqti-pill--warn'; ?>"><?php echo !$missingconversion ? 'Ready' : count($missingconversion) . ' remaining'; ?></span><?php if ($missingconversion): ?><br><span class="pqti-muted"><?php echo s(implode(', ', array_slice($missingconversion, 0, 5))); ?><?php echo count($missingconversion) > 5 ? '...' : ''; ?></span><?php endif; ?></div>
            <div class="pqti-check"><strong>Marketplace</strong><span class="pqti-pill <?php echo $willpublish ? 'pqti-pill--ok' : 'pqti-pill--warn'; ?>"><?php echo $willpublish ? 'Will be public' : 'Will stay hidden'; ?></span><br><span class="pqti-muted">Needs active + visible + published + approved.</span></div>
            <div class="pqti-check"><strong>Application status</strong><span class="pqti-pill pqti-pill--ok">Will mark converted</span><br><span class="pqti-muted">After successful save.</span></div>
            <div class="pqti-check"><strong>Current source state</strong><?php echo $sourceapplication ? s((string)$sourceapplication->status) : 'Unknown'; ?></div>
            <div class="pqti-check"><strong>Account mode</strong><?php echo $isupdate ? 'Update existing teacher' : 'Create/link teacher account'; ?></div>
            <div class="pqti-check"><strong>Next action</strong>Complete decisions below, then save intake.</div>
          </div>
          <div class="pqti-linkrow">
            <a class="pqti-btn pqti-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/teacher_intake_requests.php'))->out(false); ?>">Back to queue</a>
            <a class="pqti-btn pqti-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/teacher_marketplace.php', $consumerparams))->out(false); ?>">Preview marketplace</a>
          </div>
        </section>
      <?php endif; ?>

      <section class="pqti-panel">
        <h2><?php echo s($paneltitle); ?></h2>
        <form method="post" novalidate>
          <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
          <input type="hidden" name="consumer" value="<?php echo s((string)$consumercontext->consumerslug); ?>">
          <input type="hidden" name="teacher_requestid" value="<?php echo s(pqti_form_value($form, 'teacher_requestid')); ?>">
          <input type="hidden" name="workspaceid" value="<?php echo s(pqti_form_value($form, 'workspaceid')); ?>">

          <h3>Teacher account</h3>
          <div class="pqti-field<?php echo pqti_field_class($fielderrors, 'existing_teacherid'); ?>" id="pqti-existing_teacherid"><label>Existing Moodle teacher ID</label><input class="pqti-input" name="existing_teacherid" type="number" min="0" value="<?php echo s(pqti_form_value($form, 'existing_teacherid')); ?>" placeholder="Optional: use only to add/update onboarding profile for an existing teacher"><?php echo pqti_form_error($fielderrors, 'existing_teacherid'); ?></div>
          <div class="pqti-grid">
            <div class="pqti-field<?php echo pqti_field_class($fielderrors, 'teacher_firstname'); ?>" id="pqti-teacher_firstname"><label>First name</label><input class="pqti-input" name="teacher_firstname" value="<?php echo s(pqti_form_value($form, 'teacher_firstname')); ?>"><?php echo pqti_form_error($fielderrors, 'teacher_firstname'); ?></div>
            <div class="pqti-field<?php echo pqti_field_class($fielderrors, 'teacher_lastname'); ?>" id="pqti-teacher_lastname"><label>Last name</label><input class="pqti-input" name="teacher_lastname" value="<?php echo s(pqti_form_value($form, 'teacher_lastname')); ?>"><?php echo pqti_form_error($fielderrors, 'teacher_lastname'); ?></div>
            <div class="pqti-field"><label>Display name</label><input class="pqti-input" name="teacher_display_name" value="<?php echo s(pqti_form_value($form, 'teacher_display_name')); ?>" placeholder="Optional"></div>
            <div class="pqti-field"><label>Username</label><input class="pqti-input" name="teacher_username" value="<?php echo s(pqti_form_value($form, 'teacher_username')); ?>" placeholder="Auto-generated if blank"></div>
            <div class="pqti-field<?php echo pqti_field_class($fielderrors, 'teacher_contact'); ?>" id="pqti-teacher_contact"><label>Teacher email or phone</label><input class="pqti-input" name="teacher_contact" value="<?php echo s(pqti_form_value($form, 'teacher_contact')); ?>" placeholder="Email preferred; phone accepted"><?php echo pqti_form_error($fielderrors, 'teacher_contact'); ?></div>
            <div class="pqti-field"><label>Phone / WhatsApp</label><input class="pqti-input" name="teacher_phone" value="<?php echo s(pqti_form_value($form, 'teacher_phone')); ?>"></div>
            <div class="pqti-field"><label>Preferred contact</label><select class="pqti-select" name="preferred_contact"><option value="email"<?php echo pqti_selected($form, 'preferred_contact', 'email'); ?>>Email</option><option value="phone"<?php echo pqti_selected($form, 'preferred_contact', 'phone'); ?>>Phone / WhatsApp</option><option value="moodle"<?php echo pqti_selected($form, 'preferred_contact', 'moodle'); ?>>Moodle message</option></select></div>
            <div class="pqti-field<?php echo pqti_field_class($fielderrors, 'gender'); ?>" id="pqti-gender"><label>Gender</label><select class="pqti-select" name="gender"><option value="">Select</option><option value="female"<?php echo pqti_selected($form, 'gender', 'female'); ?>>Female</option><option value="male"<?php echo pqti_selected($form, 'gender', 'male'); ?>>Male</option></select><?php echo pqti_form_error($fielderrors, 'gender'); ?></div>
          </div>

          <h3>Location and language</h3>
          <div class="pqti-grid">
            <div class="pqti-field<?php echo pqti_field_class($fielderrors, 'country'); ?>" id="pqti-country"><label>Country</label><?php echo pqti_select('country', $pqtioptions['countries'] ?? [], $form, $fielderrors); ?></div>
            <div class="pqti-field<?php echo pqti_field_class($fielderrors, 'city'); ?>" id="pqti-city"><label>City</label><?php echo pqti_select('city', $pqtioptions['cities'] ?? [], $form, $fielderrors); ?></div>
            <div class="pqti-field pqti-city-other<?php echo pqti_field_class($fielderrors, 'city_other'); ?>" id="pqti-city_other"><label>City not listed</label><input class="pqti-input" name="city_other" value="<?php echo s(pqti_form_value($form, 'city_other')); ?>"><?php echo pqti_form_error($fielderrors, 'city_other'); ?></div>
            <div class="pqti-field<?php echo pqti_field_class($fielderrors, 'primary_language'); ?>" id="pqti-primary_language"><label>Primary teaching language</label><?php echo pqti_select('primary_language', $pqtioptions['primary_languages'] ?? [], $form, $fielderrors); ?></div>
            <div class="pqti-field"><label>Other languages</label><?php echo pqti_multi_select('other_languages', $pqtioptions['other_languages'] ?? [], $form, $fielderrors, 5); ?></div>
          </div>

          <h3>Teaching scope</h3>
          <div class="pqti-grid">
            <div class="pqti-field<?php echo pqti_field_class($fielderrors, 'courses_taught'); ?>" id="pqti-courses_taught"><label>Courses taught</label><?php echo pqti_multi_select('courses_taught', $pqtioptions['course_types'] ?? [], $form, $fielderrors, 3); ?></div>
            <div class="pqti-field<?php echo pqti_field_class($fielderrors, 'levels_taught'); ?>" id="pqti-levels_taught"><label>Levels taught</label><?php echo pqti_multi_select('levels_taught', $pqtioptions['current_levels'] ?? [], $form, $fielderrors, 6); ?></div>
            <div class="pqti-field<?php echo pqti_field_class($fielderrors, 'max_students_per_class'); ?>" id="pqti-max_students_per_class"><label>Max students per class</label><input class="pqti-input" name="max_students_per_class" type="number" min="1" max="20" value="<?php echo s(pqti_form_value($form, 'max_students_per_class')); ?>"><?php echo pqti_form_error($fielderrors, 'max_students_per_class'); ?></div>
            <div class="pqti-field<?php echo pqti_field_class($fielderrors, 'max_weekly_hours'); ?>" id="pqti-max_weekly_hours"><label>Max weekly live hours</label><input class="pqti-input" name="max_weekly_hours" type="number" min="1" max="60" value="<?php echo s(pqti_form_value($form, 'max_weekly_hours')); ?>"><?php echo pqti_form_error($fielderrors, 'max_weekly_hours'); ?></div>
          </div>

          <h3>Parent-facing marketplace profile</h3>
          <div class="pqti-grid">
            <div class="pqti-field<?php echo pqti_field_class($fielderrors, 'marketplace_status'); ?>" id="pqti-marketplace_status"><label>Marketplace status</label><select class="pqti-select" name="marketplace_status"><option value="draft"<?php echo pqti_selected($form, 'marketplace_status', 'draft'); ?>>Draft</option><option value="review"<?php echo pqti_selected($form, 'marketplace_status', 'review'); ?>>Ready for academy review</option><option value="published"<?php echo pqti_selected($form, 'marketplace_status', 'published'); ?>>Published</option><option value="paused"<?php echo pqti_selected($form, 'marketplace_status', 'paused'); ?>>Paused</option></select><?php echo pqti_form_error($fielderrors, 'marketplace_status'); ?></div>
            <div class="pqti-field<?php echo pqti_field_class($fielderrors, 'marketplace_visible'); ?>" id="pqti-marketplace_visible"><label>Parent visibility</label><select class="pqti-select" name="marketplace_visible"><option value=""<?php echo pqti_selected($form, 'marketplace_visible', ''); ?>>Keep hidden</option><option value="0"<?php echo pqti_selected($form, 'marketplace_visible', '0'); ?>>Hidden</option><option value="1"<?php echo pqti_selected($form, 'marketplace_visible', '1'); ?>>Visible to parents after approval</option></select><?php echo pqti_form_error($fielderrors, 'marketplace_visible'); ?></div>
            <div class="pqti-field<?php echo pqti_field_class($fielderrors, 'vetting_status'); ?>" id="pqti-vetting_status"><label>Academy vetting status</label><select class="pqti-select" name="vetting_status"><option value="not_reviewed"<?php echo pqti_selected($form, 'vetting_status', 'not_reviewed'); ?>>Not reviewed</option><option value="in_review"<?php echo pqti_selected($form, 'vetting_status', 'in_review'); ?>>In review</option><option value="approved"<?php echo pqti_selected($form, 'vetting_status', 'approved'); ?>>Approved</option><option value="needs_update"<?php echo pqti_selected($form, 'vetting_status', 'needs_update'); ?>>Needs update</option><option value="rejected"<?php echo pqti_selected($form, 'vetting_status', 'rejected'); ?>>Rejected</option></select><?php echo pqti_form_error($fielderrors, 'vetting_status'); ?></div>
            <div class="pqti-field"><label>Parent-visible academy vetting summary</label><textarea class="pqti-textarea" name="vetting_summary" placeholder="Short, parent-safe summary of academy review status"><?php echo s(pqti_form_value($form, 'vetting_summary')); ?></textarea></div>
          </div>
          <div class="pqti-grid">
            <div class="pqti-field"><label>General profile / bio</label><textarea class="pqti-textarea" name="marketplace_bio" placeholder="Parent-safe introduction, teaching background, and learner fit"><?php echo s(pqti_form_value($form, 'marketplace_bio')); ?></textarea></div>
            <div class="pqti-field"><label>Skills</label><textarea class="pqti-textarea" name="marketplace_skills" placeholder="Tajweed, beginner Arabic, memorization support, child engagement, etc."><?php echo s(pqti_form_value($form, 'marketplace_skills')); ?></textarea></div>
            <div class="pqti-field"><label>Experience</label><textarea class="pqti-textarea" name="marketplace_experience" placeholder="Years taught, student ages, settings, online teaching experience"><?php echo s(pqti_form_value($form, 'marketplace_experience')); ?></textarea></div>
            <div class="pqti-field"><label>Education and qualifications</label><textarea class="pqti-textarea" name="marketplace_education" placeholder="Formal education, ijazah, certificates, institutes, training"><?php echo s(pqti_form_value($form, 'marketplace_education')); ?></textarea></div>
            <div class="pqti-field"><label>Teaching style</label><textarea class="pqti-textarea" name="marketplace_teaching_style" placeholder="How the teacher works with children, adults, beginners, review, practice, feedback"><?php echo s(pqti_form_value($form, 'marketplace_teaching_style')); ?></textarea></div>
            <div class="pqti-field"><label>Courses intended to teach</label><textarea class="pqti-textarea" name="marketplace_courses" placeholder="Consumer courses and any other parent-safe course offerings"><?php echo s(pqti_form_value($form, 'marketplace_courses')); ?></textarea></div>
          </div>

          <h3>Preferred weekly live-session number of sessions and hours</h3>
          <div class="pqti-grid">
            <div class="pqti-field<?php echo pqti_field_class($fielderrors, 'session_count'); ?>" id="pqti-session_count"><label>Number of sessions</label><?php echo pqti_select('session_count', $pqtioptions['session_counts'] ?? [], $form, $fielderrors, 'Select'); ?></div>
            <div class="pqti-field<?php echo pqti_field_class($fielderrors, 'timezone'); ?>" id="pqti-timezone"><label>Time zone</label><?php echo pqti_select('timezone', $pqtioptions['timezones'] ?? [], $form, $fielderrors); ?></div>
          </div>
          <div class="pqti-field<?php echo pqti_field_class($fielderrors, 'slots'); ?>" id="pqti-slots">
            <label>Select all recurring times that could work</label>
            <div class="pqti-calendar">
              <table>
                <thead>
                  <tr>
                    <th>Day</th>
                    <?php foreach (($pqtioptions['availability_time_windows'] ?? []) as $hour => $hourlabel): ?>
                      <th><?php echo s((string)$hourlabel); ?></th>
                    <?php endforeach; ?>
                  </tr>
                </thead>
                <tbody>
                  <?php foreach (($pqtioptions['availability_days'] ?? []) as $day => $daylabel): ?>
                    <tr>
                      <td><?php echo s((string)$daylabel); ?></td>
                      <?php foreach (($pqtioptions['availability_time_windows'] ?? []) as $hour => $hourlabel): $slot = (string)$day . '|' . (string)$hour; ?>
                        <td>
                          <label class="pqti-slot" title="<?php echo s((string)$daylabel . ' ' . (string)$hourlabel); ?>">
                            <input type="checkbox" name="slots[]" value="<?php echo s($slot); ?>"<?php echo in_array($slot, $form['slots'], true) ? ' checked' : ''; ?>>
                          </label>
                        </td>
                      <?php endforeach; ?>
                    </tr>
                  <?php endforeach; ?>
                </tbody>
              </table>
            </div>
            <?php echo pqti_form_error($fielderrors, 'slots'); ?>
          </div>
          <div class="pqti-field"><label>Availability notes</label><textarea class="pqti-textarea" name="availability_summary" placeholder="Exact availability, restrictions, preferred days, breaks, or admin notes"><?php echo s(pqti_form_value($form, 'availability_summary')); ?></textarea></div>

          <h3>Safety and classroom readiness</h3>
          <div class="pqti-grid">
            <div class="pqti-field<?php echo pqti_field_class($fielderrors, 'bbb_trained'); ?>" id="pqti-bbb_trained"><label>BBB/live classroom training</label><select class="pqti-select" name="bbb_trained"><option value="">Select</option><option value="1"<?php echo pqti_selected($form, 'bbb_trained', '1'); ?>>Completed</option><option value="0"<?php echo pqti_selected($form, 'bbb_trained', '0'); ?>>Not completed</option></select><?php echo pqti_form_error($fielderrors, 'bbb_trained'); ?></div>
            <div class="pqti-field<?php echo pqti_field_class($fielderrors, 'safeguarding_trained'); ?>" id="pqti-safeguarding_trained"><label>Child safety training</label><select class="pqti-select" name="safeguarding_trained"><option value="">Select</option><option value="1"<?php echo pqti_selected($form, 'safeguarding_trained', '1'); ?>>Completed</option><option value="0"<?php echo pqti_selected($form, 'safeguarding_trained', '0'); ?>>Not completed</option></select><?php echo pqti_form_error($fielderrors, 'safeguarding_trained'); ?></div>
            <div class="pqti-field<?php echo pqti_field_class($fielderrors, 'recording_qa_ack'); ?>" id="pqti-recording_qa_ack"><label>Recording and QA policy acknowledgement</label><select class="pqti-select" name="recording_qa_ack"><option value="">Select</option><option value="1"<?php echo pqti_selected($form, 'recording_qa_ack', '1'); ?>>Acknowledged</option><option value="0"<?php echo pqti_selected($form, 'recording_qa_ack', '0'); ?>>Not acknowledged</option></select><?php echo pqti_form_error($fielderrors, 'recording_qa_ack'); ?></div>
            <div class="pqti-field<?php echo pqti_field_class($fielderrors, 'status'); ?>" id="pqti-status"><label>Teacher status</label><select class="pqti-select" name="status"><option value="pending"<?php echo pqti_selected($form, 'status', 'pending'); ?>>Pending</option><option value="active"<?php echo pqti_selected($form, 'status', 'active'); ?>>Active</option><option value="paused"<?php echo pqti_selected($form, 'status', 'paused'); ?>>Paused</option><option value="inactive"<?php echo pqti_selected($form, 'status', 'inactive'); ?>>Inactive</option></select><?php echo pqti_form_error($fielderrors, 'status'); ?></div>
          </div>
          <div class="pqti-field"><label>Admin notes</label><textarea class="pqti-textarea" name="admin_notes" placeholder="Background checks, onboarding notes, internal restrictions, teaching strengths"><?php echo s(pqti_form_value($form, 'admin_notes')); ?></textarea></div>

          <button class="pqti-btn pqti-btn--brown" type="submit" name="submit_intake" value="1"><?php echo s($submitlabel); ?></button>
        </form>
      </section>
    <?php endif; ?>
  </div>
</main>
<script>
(function() {
  var countryCities = <?php echo json_encode($pqtioptions['country_cities'] ?? [], JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT); ?>;
  var cityLabels = <?php echo json_encode($pqtioptions['cities'] ?? [], JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT); ?>;
  var countryTimezones = <?php echo json_encode($pqtioptions['country_timezones'] ?? [], JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT); ?>;
  var timezoneLabels = <?php echo json_encode($pqtioptions['timezones'] ?? [], JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT); ?>;
  var initialTimezone = <?php echo json_encode(pqti_form_value($form, 'timezone'), JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT); ?>;
  var country = document.querySelector('select[name="country"]');
  var city = document.querySelector('select[name="city"]');
  var timezone = document.querySelector('select[name="timezone"]');
  var cityOther = document.querySelector('.pqti-city-other');
  if (!country || !city || !timezone) {
    return;
  }
  function option(value, label, selected) {
    var item = document.createElement('option');
    item.value = value;
    item.textContent = label;
    if (selected) {
      item.selected = true;
    }
    return item;
  }
  function refreshCities() {
    var selected = city.value;
    var cities = countryCities[country.value] ? Object.keys(countryCities[country.value]) : Object.keys(cityLabels);
    if (cities.indexOf('Other') === -1) {
      cities.push('Other');
    }
    city.innerHTML = '';
    city.appendChild(option('', 'Select', selected === ''));
    cities.forEach(function(cityname) {
      var label = (countryCities[country.value] && countryCities[country.value][cityname]) || cityLabels[cityname] || cityname;
      city.appendChild(option(cityname, label, cityname === selected));
    });
    if (selected && cities.indexOf(selected) === -1) {
      city.value = 'Other';
    }
    if (cityOther) {
      cityOther.classList.toggle('pqti-city-other--visible', city.value === 'Other');
    }
  }
  function refreshTimezones() {
    var selected = timezone.value || initialTimezone;
    var zones = countryTimezones[country.value] ? Object.keys(countryTimezones[country.value]) : Object.keys(timezoneLabels);
    timezone.innerHTML = '';
    timezone.appendChild(option('', 'Select', selected === ''));
    if (selected && zones.indexOf(selected) === -1) {
      timezone.appendChild(option(selected, timezoneLabels[selected] || selected, true));
    }
    zones.forEach(function(zone) {
      var label = (countryTimezones[country.value] && countryTimezones[country.value][zone]) || timezoneLabels[zone] || zone;
      timezone.appendChild(option(zone, label, zone === selected));
    });
    timezone.value = selected;
    initialTimezone = '';
  }
  country.addEventListener('change', function() {
    refreshCities();
    refreshTimezones();
  });
  city.addEventListener('change', refreshCities);
  refreshCities();
  refreshTimezones();
})();
</script>
<?php
echo $OUTPUT->footer();
