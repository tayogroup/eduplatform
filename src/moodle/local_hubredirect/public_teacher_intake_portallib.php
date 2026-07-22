<?php
// Public-teacher-intake helper library — extracted VERBATIM from
// public_teacher_intake.php (renamed pqpti_ -> pqptil_) for the cookieless
// public JSON endpoint local/prequran/public_teacher_intake_data.php. The
// legacy page keeps its inline copies and stays untouched (parallel-run).
//
// Exceptions to the verbatim rule:
//   - pqptil_security_token: stateless HMAC over formtime|'public_teacher_intake'
//     keyed with local_prequran/progress_launch_secret (the legacy version is
//     session-bound: it mixes in sesskey() and passwordsaltmain, neither of
//     which can exist cookieless). Mirrors public_intake_portallib's
//     pqpirl_security_token.
//   - Rendering-only helpers that emit Moodle page HTML were NOT extracted:
//     pqpti_selected, pqpti_checked, pqpti_error, pqpti_select,
//     pqpti_checkboxes, pqpti_radio_cards (the public HTML page renders its
//     own fields from the JSON bootstrap).
//   - The PQPTI_* constants are exposed as pqptil_*() functions with identical
//     values (PQPTI_SESSION_COOLDOWN_SECONDS is intentionally absent: the
//     $SESSION-based cooldown cannot exist cookieless).
//   - pqptil_security_audit is added (mirroring pqpirl_security_audit) so the
//     public endpoint can record the same anti-abuse audit trail; the legacy
//     page had no audit calls.
//
// Requires: local/hubredirect/accesslib.php + institutionlib.php +
// course_offeringlib.php + teacher_intake_config.php loaded first.

defined('MOODLE_INTERNAL') || die();

function pqptil_min_form_seconds(): int {
    return 4; // Legacy PQPTI_MIN_FORM_SECONDS.
}

function pqptil_max_form_seconds(): int {
    return 7200; // Legacy PQPTI_MAX_FORM_SECONDS.
}

function pqptil_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqptil_trim(string $name, string $default = ''): string {
    return trim(optional_param($name, $default, PARAM_TEXT));
}

function pqptil_limit(string $value, int $limit): string {
    return core_text::substr(trim($value), 0, $limit);
}

function pqptil_array_param(string $name): array {
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

function pqptil_single_array_param(string $name): array {
    $values = pqptil_array_param($name);
    return $values ? [reset($values)] : [];
}

function pqptil_label(string $value, array $options): string {
    return (string)($options[$value] ?? $value);
}

function pqptil_labels(array $values, array $options): array {
    $labels = [];
    foreach ($values as $value) {
        $labels[] = pqptil_label((string)$value, $options);
    }
    return $labels;
}

function pqptil_value(array $form, string $name): string {
    $value = $form[$name] ?? '';
    return is_array($value) ? implode(', ', $value) : (string)$value;
}

function pqptil_work_model_values(array $values): array {
    $aliases = [
        'independent_teacher' => 'independent_teacher',
        'independent teacher' => 'independent_teacher',
        'independent teacher/tutor' => 'independent_teacher',
        'private/internal teacher only' => 'independent_teacher',
        'school_teacher' => 'independent_teacher',
        'teach for one school' => 'independent_teacher',
        'multi_school_teacher' => 'independent_teacher',
        'teach for multiple schools' => 'independent_teacher',
        'marketplace_teacher' => 'marketplace_teacher',
        'marketplace teacher/tutor' => 'marketplace_teacher',
        'marketplace_tutor' => 'marketplace_teacher',
        'public marketplace tutor' => 'marketplace_teacher',
    ];
    $normalized = [];
    foreach ($values as $value) {
        $key = core_text::strtolower(trim((string)$value));
        if ($key !== '' && isset($aliases[$key]) && !in_array($aliases[$key], $normalized, true)) {
            $normalized[] = $aliases[$key];
        }
    }
    return $normalized;
}

function pqptil_field_label(string $name): string {
    $labels = [
        'teacher_name' => 'Teacher/tutor name',
        'email' => 'Email',
        'phone' => 'Phone / WhatsApp',
        'gender' => 'Gender',
        'country' => 'Country',
        'city' => 'City',
        'city_other' => 'City not listed',
        'timezone' => 'Time zone',
        'primary_language' => 'Primary teaching language',
        'teacher_work_models' => 'Teacher pathway',
        'service_modes' => 'Service modes',
        'subject_language' => 'Language subject',
        'subject_areas' => 'Subjects you can teach',
        'subject_other' => 'Other subjects',
        'age_groups' => 'Learner levels',
        'general_levels' => 'Teaching levels',
        'workspace_preferences' => 'School/workspace preferences',
        'years_experience' => 'Years of experience',
        'institution_experience' => 'Schools, institutions, and freelance teaching',
        'courses' => 'Legacy course data',
        'levels' => 'Legacy level data',
        'experience' => 'Teaching experience',
        'bio' => 'Public profile summary',
        'online_profile_name' => 'Online teaching brand/profile name',
        'instagram_handle' => 'Social media handle',
        'social_profile_url' => 'Public social profile URL',
        'website_or_booking_url' => 'Website or booking link',
        'demo_video_url' => 'Demo lesson or sample video link',
        'teaching_offer_summary' => 'Teaching offer summary',
        'learner_outcomes' => 'Learner outcomes',
        'curriculum_materials' => 'Curriculum and materials',
        'social_proof' => 'Social proof / reviews',
        'availability' => 'Availability',
        'preferred_contact' => 'Preferred contact method',
        'teaching_experience_range' => 'Teaching or training experience',
        'highest_qualification' => 'Highest qualification',
        'preferred_teaching_format' => 'Preferred teaching format',
        'verification_consent' => 'Qualification and reference verification consent',
        'desired_services' => 'Desired services',
        'form_security' => 'Form security',
    ];
    return $labels[$name] ?? ucfirst(str_replace('_', ' ', $name));
}

function pqptil_slot_summary(array $slots, array $days, array $hours): string {
    $byday = [];
    foreach ($slots as $slot) {
        [$day, $hour] = array_pad(explode('|', (string)$slot, 2), 2, '');
        if ($day !== '' && $hour !== '') {
            $byday[$day][] = pqptil_label($hour, $hours);
        }
    }
    $parts = [];
    foreach ($byday as $day => $dayhours) {
        $parts[] = pqptil_label($day, $days) . ': ' . implode(', ', $dayhours);
    }
    return implode('; ', $parts);
}

function pqptil_request_columns(): array {
    global $DB;
    static $columns = null;
    if ($columns === null) {
        $columns = pqptil_table_exists('local_prequran_teacher_intake_request')
            ? $DB->get_columns('local_prequran_teacher_intake_request')
            : [];
    }
    return $columns;
}

function pqptil_set_request_field(stdClass $record, string $field, $value): void {
    $columns = pqptil_request_columns();
    if (isset($columns[$field])) {
        $record->{$field} = $value;
    }
}

function pqptil_join_nonempty(array $parts, string $separator = "\n"): string {
    $clean = [];
    foreach ($parts as $part) {
        $part = trim((string)$part);
        if ($part !== '') {
            $clean[] = $part;
        }
    }
    return implode($separator, $clean);
}

function pqptil_application_backup_text(array $application): string {
    $lines = [
        'Teaching work model: ' . pqptil_value($application, 'teacher_work_model_labels'),
        'Service modes: ' . pqptil_value($application, 'service_mode_labels'),
        'Language subject: ' . pqptil_value($application, 'subject_language_label'),
        'Subjects: ' . pqptil_value($application, 'subject_area_labels'),
        'Other subjects: ' . pqptil_value($application, 'subject_other'),
        'Learner levels: ' . pqptil_value($application, 'age_group_labels'),
        'Teaching levels: ' . pqptil_value($application, 'general_level_labels'),
        'School/workspace preferences: ' . pqptil_value($application, 'workspace_preferences'),
        'Years of experience: ' . pqptil_value($application, 'years_experience'),
        'Schools, institutions, and freelance teaching: ' . pqptil_value($application, 'institution_experience'),
        'Online profile: ' . pqptil_value($application, 'online_profile_name'),
        'Social media handle: ' . pqptil_value($application, 'instagram_handle'),
        'Social profile URL: ' . pqptil_value($application, 'social_profile_url'),
        'Website/booking URL: ' . pqptil_value($application, 'website_or_booking_url'),
        'Demo/sample URL: ' . pqptil_value($application, 'demo_video_url'),
    ];
    return pqptil_join_nonempty(array_filter($lines, static function(string $line): bool {
        return !preg_match('/:\s*$/', $line);
    }));
}

// NOT verbatim (session-bound in legacy): stateless HMAC keyed with the
// existing server-side launch secret; no sesskey, no passwordsaltmain, no
// cookies. Mirrors public_intake_portallib's pqpirl_security_token.
function pqptil_security_token(int $formtime): string {
    $secret = (string)get_config('local_prequran', 'progress_launch_secret');
    return hash_hmac('sha256', $formtime . '|public_teacher_intake', $secret);
}

// Added (legacy page had no audit calls): mirror pqpirl_security_audit so the
// public endpoint records the same anti-abuse trail into local_prequran_live_audit.
function pqptil_security_audit(string $action, array $details = []): void {
    global $DB;
    if (!pqptil_table_exists('local_prequran_live_audit')) {
        return;
    }
    $details['ip_hash'] = hash('sha256', getremoteaddr() ?: 'unknown');
    $details['ua_hash'] = hash('sha256', (string)($_SERVER['HTTP_USER_AGENT'] ?? 'unknown'));
    $DB->insert_record('local_prequran_live_audit', (object)[
        'sessionid' => 0,
        'actorid' => 0,
        'action' => $action,
        'targettype' => 'public_teacher_intake',
        'targetid' => 0,
        'details' => json_encode($details),
        'timecreated' => time(),
    ]);
}

function pqptil_contact_ok(string $email, string $phone): bool {
    if ($email !== '' && validate_email($email)) {
        return true;
    }
    $digits = preg_replace('/\D+/', '', $phone);
    return core_text::strlen((string)$digits) >= 7 && core_text::strlen((string)$digits) <= 20;
}

function pqptil_url_ok(string $url): bool {
    if ($url === '') {
        return true;
    }
    return (bool)preg_match('/^https?:\/\/[^\s]+$/i', $url);
}
