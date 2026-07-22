<?php
// Teacher-application review-queue library — extracted VERBATIM from
// teacher_intake_requests.php (renamed pqtirq_ -> pqtirql_) for the token-gated
// portal endpoint. The legacy page keeps its inline copies and stays untouched
// (parallel-run). Requires: local/hubredirect/accesslib.php loaded first.

defined('MOODLE_INTERNAL') || die();

function pqtirql_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqtirql_statuses(): array {
    return [
        'new' => 'New',
        'reviewing' => 'Reviewing',
        'approved' => 'Approved',
        'needs_update' => 'Needs update',
        'rejected' => 'Rejected',
        'converted' => 'Converted',
        'closed' => 'Closed',
    ];
}

function pqtirql_status_label(string $status): string {
    $statuses = pqtirql_statuses();
    return $statuses[$status] ?? ucfirst(str_replace('_', ' ', $status));
}

function pqtirql_short(string $value, int $max = 180): string {
    $value = trim($value);
    if ($value === '') {
        return 'Not provided';
    }
    if (core_text::strlen($value) <= $max) {
        return $value;
    }
    return core_text::substr($value, 0, $max) . '...';
}

function pqtirql_application_json(stdClass $request): array {
    $decoded = json_decode((string)($request->application_json ?? ''), true);
    if (is_array($decoded) && $decoded) {
        return $decoded;
    }
    $map = [
        'Teaching work model' => 'teacher_work_model_labels',
        'Service modes' => 'service_mode_labels',
        'Language subject' => 'subject_language_label',
        'Subjects' => 'subject_area_labels',
        'Other subjects' => 'subject_other',
        'Learner levels' => 'age_group_labels',
        'Teaching levels' => 'general_level_labels',
        'School/workspace preferences' => 'workspace_preferences',
        'Years of experience' => 'years_experience',
        'Schools, institutions, and freelance teaching' => 'institution_experience',
        'Online profile' => 'online_profile_name',
        'Social media handle' => 'instagram_handle',
        'Social profile URL' => 'social_profile_url',
        'Website/booking URL' => 'website_or_booking_url',
        'Demo/sample URL' => 'demo_video_url',
    ];
    $backup = [];
    foreach (preg_split('/\R/', (string)($request->notes ?? '')) ?: [] as $line) {
        if (strpos($line, ':') === false) {
            continue;
        }
        [$label, $value] = array_map('trim', explode(':', $line, 2));
        if ($value !== '' && isset($map[$label])) {
            $backup[$map[$label]] = $value;
        }
    }
    return $backup;
}

function pqtirql_app_value(array $application, string $key): string {
    $value = $application[$key] ?? '';
    return is_array($value) ? trim(implode(', ', array_map('strval', $value))) : trim((string)$value);
}

function pqtirql_request_or_app(stdClass $request, array $application, string $field, string $jsonkey = '', string $labelkey = ''): string {
    $stored = trim((string)($request->{$field} ?? ''));
    if ($stored !== '') {
        return $stored;
    }
    if ($labelkey !== '') {
        $value = pqtirql_app_value($application, $labelkey);
        if ($value !== '') {
            return $value;
        }
    }
    $value = pqtirql_app_value($application, $jsonkey !== '' ? $jsonkey : $field);
    return $value;
}

function pqtirql_request_or_app_int(stdClass $request, array $application, string $field): int {
    $stored = trim((string)($request->{$field} ?? ''));
    if ($stored !== '') {
        return (int)$stored;
    }
    $value = pqtirql_app_value($application, $field);
    return $value !== '' ? (int)$value : 0;
}

function pqtirql_status_class(string $status): string {
    if (in_array($status, ['approved', 'converted'], true)) {
        return ' pqtirq-pill--ok';
    }
    if (in_array($status, ['rejected', 'closed'], true)) {
        return ' pqtirq-pill--bad';
    }
    if (in_array($status, ['new', 'needs_update'], true)) {
        return ' pqtirq-pill--warn';
    }
    return '';
}

function pqtirql_consumer_params(stdClass $request): array {
    $slug = trim((string)($request->consumer_slug ?? ''));
    return $slug !== '' ? ['consumer' => $slug] : [];
}

function pqtirql_intake_params(stdClass $request): array {
    $params = [
        'consumer' => (string)($request->consumer_slug ?? ''),
        'teacher_requestid' => (int)$request->id,
        'requestid' => (int)$request->id,
    ];
    if (!empty($request->workspaceid)) {
        $params['workspaceid'] = (int)$request->workspaceid;
    }
    return $params;
}

function pqtirql_audit(string $action, int $targetid, array $details = []): void {
    global $DB, $USER;
    if (!pqtirql_table_exists('local_prequran_live_audit')) {
        return;
    }
    $DB->insert_record('local_prequran_live_audit', (object)[
        'sessionid' => 0,
        'actorid' => (int)$USER->id,
        'action' => $action,
        'targettype' => 'teacher_intake_request',
        'targetid' => $targetid,
        'details' => $details ? json_encode($details, JSON_UNESCAPED_SLASHES) : '',
        'timecreated' => time(),
    ]);
}

function pqtirql_request_with_profile_values(stdClass $request): stdClass {
    global $DB;

    $display = clone $request;
    if (!pqtirql_table_exists('local_prequran_teacher_profile')) {
        return $display;
    }

    $profile = null;
    $profileid = (int)($request->converted_profileid ?? 0);
    if ($profileid > 0) {
        $profile = $DB->get_record('local_prequran_teacher_profile', ['id' => $profileid], '*', IGNORE_MISSING);
    }
    if (!$profile && (int)($request->converted_userid ?? 0) > 0) {
        $profile = $DB->get_record('local_prequran_teacher_profile', ['userid' => (int)$request->converted_userid], '*', IGNORE_MISSING);
    }
    if (!$profile) {
        return $display;
    }

    $fields = [
        'teacher_work_models',
        'service_modes',
        'subject_language',
        'subject_areas',
        'subject_other',
        'age_groups',
        'general_levels',
        'workspace_preferences',
        'institution_experience',
        'application_json',
        'availability_summary',
        'primary_language',
        'other_languages',
        'country',
        'city',
        'timezone',
    ];
    foreach ($fields as $field) {
        $value = trim((string)($profile->{$field} ?? ''));
        if ($value !== '') {
            $display->{$field} = $value;
        }
    }

    if (isset($profile->years_experience)) {
        $display->years_experience = (int)$profile->years_experience;
    }
    foreach ([
        'marketplace_bio' => 'bio',
        'marketplace_experience' => 'experience',
        'marketplace_education' => 'education',
        'marketplace_teaching_style' => 'teaching_style',
        'marketplace_courses' => 'courses',
    ] as $profilefield => $requestfield) {
        $value = trim((string)($profile->{$profilefield} ?? ''));
        if ($value !== '') {
            $display->{$requestfield} = $value;
        }
    }

    return $display;
}
