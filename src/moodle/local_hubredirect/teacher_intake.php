<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once($CFG->dirroot . '/user/lib.php');
require_once(__DIR__ . '/account_ids.php');
require_login();

if (!is_siteadmin($USER)) {
    throw new moodle_exception('nopermissions', '', '', 'Only site administrators can create teacher intake records.');
}

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
    return $prefix . '.' . $token . '@quraanacademy.local';
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
    return $DB->get_record('user', [
        'id' => $userid,
        'deleted' => 0,
        'mnethostid' => $CFG->mnet_localhost_id,
    ], '*', MUST_EXIST);
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
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/teacher_intake.php'));
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
    'admin_notes' => '',
];

if ((bool)$created) {
    $message = 'Teacher intake completed. The teacher is now ready for scheduling and BBB assignment.';
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && optional_param('submit_intake', '', PARAM_TEXT) === '1') {
    require_sesskey();
    foreach ($form as $key => $default) {
        $form[$key] = is_array($default) ? pqti_array_param($key) : pqti_trim_param($key, (string)$default);
    }

    $transaction = null;
    try {
        if (!$ready) {
            throw new moodle_exception('invalidrecord', '', '', 'Teacher profile table is not ready.');
        }

        $existingteacherid = (int)$form['existing_teacherid'];
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
            'admin_notes' => $form['admin_notes'],
        ];

        $profileid = pqti_save_profile($teacherid, $data);
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
        ]);

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
        ];
        redirect(new moodle_url('/local/hubredirect/teacher_intake.php', ['created' => 1]));
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
@media(max-width:760px){.pqti-top{display:block}.pqti-actions{margin-top:12px}.pqti-grid,.pqti-result,.pqti-choicegrid{grid-template-columns:1fr}.pqti-title{font-size:24px}}
</style>
<main class="pqti-shell">
  <div class="pqti-wrap">
    <section class="pqti-top">
      <div>
        <h1 class="pqti-title">Teacher Intake</h1>
        <p class="pqti-sub">Create or link a Moodle teacher account, capture live-class readiness, and set initial BBB availability.</p>
      </div>
      <div class="pqti-actions">
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
          </div>
        </section>
      <?php endif; ?>

      <section class="pqti-panel">
        <h2>Teacher Onboarding</h2>
        <form method="post" novalidate>
          <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">

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

          <button class="pqti-btn pqti-btn--brown" type="submit" name="submit_intake" value="1">Create teacher intake</button>
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
    var selected = timezone.value;
    var zones = countryTimezones[country.value] ? Object.keys(countryTimezones[country.value]) : Object.keys(timezoneLabels);
    timezone.innerHTML = '';
    timezone.appendChild(option('', 'Select', selected === ''));
    zones.forEach(function(zone) {
      var label = (countryTimezones[country.value] && countryTimezones[country.value][zone]) || timezoneLabels[zone] || zone;
      timezone.appendChild(option(zone, label, zone === selected));
    });
    if (selected && zones.indexOf(selected) === -1) {
      timezone.value = '';
    }
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
