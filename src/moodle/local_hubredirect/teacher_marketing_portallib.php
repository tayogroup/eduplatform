<?php
// Teacher-marketing query library — extracted VERBATIM from teacher_marketing.php
// (renamed pqtmkt_ -> pqtmktl_) for the token-gated portal endpoint. The legacy
// page keeps its inline copies and stays untouched (parallel-run).
// Requires: local/hubredirect/accesslib.php loaded first.

defined('MOODLE_INTERNAL') || die();

function pqtmktl_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqtmktl_column_exists(string $table, string $column): bool {
    global $DB;
    if (!pqtmktl_table_exists($table)) {
        return false;
    }
    try {
        return array_key_exists($column, $DB->get_columns($table));
    } catch (Throwable $e) {
        return false;
    }
}

function pqtmktl_json(string $value): array {
    $decoded = json_decode($value, true);
    return is_array($decoded) ? $decoded : [];
}

function pqtmktl_url(string $value): string {
    $value = trim(clean_param($value, PARAM_URL));
    if ($value === '') {
        return '';
    }
    if (!filter_var($value, FILTER_VALIDATE_URL)) {
        throw new invalid_parameter_exception('Enter a valid public URL.');
    }
    $scheme = strtolower((string)parse_url($value, PHP_URL_SCHEME));
    if (!in_array($scheme, ['http', 'https'], true)) {
        throw new invalid_parameter_exception('Public links must use HTTP or HTTPS.');
    }
    return $value;
}

function pqtmktl_social_url(string $value): string {
    $value = pqtmktl_url($value);
    if ($value === '') {
        return '';
    }
    $host = strtolower((string)parse_url($value, PHP_URL_HOST));
    if (in_array($host, ['instagram.com', 'www.instagram.com'], true)) {
        $path = '/' . trim((string)parse_url($value, PHP_URL_PATH), '/');
        return 'https://www.instagram.com' . ($path === '/' ? '' : $path);
    }
    return $value;
}

function pqtmktl_text(string $name, int $max): string {
    $value = trim(optional_param($name, '', PARAM_TEXT));
    if (core_text::strlen($value) > $max) {
        throw new invalid_parameter_exception('One or more marketing fields exceed the allowed length.');
    }
    return $value;
}

function pqtmktl_draft_matches_approved(stdClass $profile, array $application, array $draft): bool {
    if (!$draft || !in_array((string)(($application['marketplace_marketing_last_review']['status'] ?? '')), ['approved', 'published'], true)) {
        return false;
    }
    $approved = [
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
    foreach ($approved as $field => $value) {
        if (trim((string)($draft[$field] ?? '')) !== trim($value)) {
            return false;
        }
    }
    return true;
}

function pqtmktl_audit(string $action, int $profileid, array $details = []): void {
    global $DB, $USER;
    if (!pqtmktl_table_exists('local_prequran_live_audit')) {
        return;
    }
    $DB->insert_record('local_prequran_live_audit', (object)[
        'sessionid' => 0,
        'actorid' => (int)$USER->id,
        'action' => $action,
        'targettype' => 'teacher_profile',
        'targetid' => $profileid,
        'details' => json_encode($details, JSON_UNESCAPED_SLASHES),
        'timecreated' => time(),
    ]);
}

function pqtmktl_preference_key(int $consumerid): string {
    return 'local_hubredirect_mktstatus_' . max(0, $consumerid);
}

function pqtmktl_latest_audit_review(array $profileids): array {
    global $DB;
    if (!$profileids || !pqtmktl_table_exists('local_prequran_live_audit')) {
        return [];
    }
    [$insql, $params] = $DB->get_in_or_equal(array_values($profileids), SQL_PARAMS_NAMED, 'mktprofile');
    $params['targettype'] = 'teacher_profile';
    $rows = $DB->get_records_sql(
        "SELECT a.*
           FROM {local_prequran_live_audit} a
          WHERE a.targettype = :targettype
            AND a.targetid {$insql}
            AND a.action IN ('teacher_marketing_submitted', 'teacher_marketing_approved', 'teacher_marketing_rejected')
       ORDER BY a.timecreated DESC, a.id DESC",
        $params,
        0,
        1
    );
    $audit = $rows ? reset($rows) : false;
    $status = match ((string)($audit->action ?? '')) {
        'teacher_marketing_submitted' => 'pending_review',
        'teacher_marketing_approved' => 'published',
        'teacher_marketing_rejected' => 'rejected',
        default => '',
    };
    return $status === '' ? [] : [
        'status' => $status,
        'time' => (int)($audit->timecreated ?? 0),
        'priority' => $status === 'published' ? 30 : ($status === 'rejected' ? 20 : 10),
    ];
}

function pqtmktl_canonical_review_status(int $userid, int $consumerid, array $profiles): string {
    $key = pqtmktl_preference_key($consumerid);
    $events = [];
    $auditevent = pqtmktl_latest_audit_review(array_map(static fn($profile): int => (int)$profile->id, $profiles));
    if ($auditevent) {
        $events[] = $auditevent;
    }
    foreach ($profiles as $profile) {
        $application = pqtmktl_json((string)($profile->application_json ?? ''));
        $draft = $application['marketplace_marketing_draft'] ?? [];
        if (is_array($draft) && $draft) {
            $draftstatus = (string)($draft['review_status'] ?? 'pending_review');
            $drafttime = $draftstatus === 'rejected'
                ? (int)($draft['reviewed_at'] ?? $draft['submitted_at'] ?? 0)
                : (int)($draft['submitted_at'] ?? 0);
            $events[] = [
                'status' => $draftstatus,
                'time' => $drafttime,
                'priority' => $draftstatus === 'rejected' ? 20 : 10,
            ];
        }
        $lastreview = $application['marketplace_marketing_last_review'] ?? [];
        if (is_array($lastreview) && in_array((string)($lastreview['status'] ?? ''), ['approved', 'published'], true)) {
            $events[] = [
                'status' => 'published',
                'time' => (int)($lastreview['reviewed_at'] ?? $profile->timemodified ?? 0),
                'priority' => 30,
            ];
        }
        if ((int)($profile->marketplace_visible ?? 0) === 1
                && (string)($profile->marketplace_status ?? '') === 'published') {
            $publishedtime = (int)($lastreview['reviewed_at'] ?? 0);
            if (!is_array($draft) || !$draft) {
                $publishedtime = max($publishedtime, (int)($profile->timemodified ?? 0));
            }
            $events[] = [
                'status' => 'published',
                'time' => $publishedtime,
                'priority' => 30,
            ];
        }
    }
    if ($events) {
        usort($events, static function(array $left, array $right): int {
            return [$right['time'], $right['priority']] <=> [$left['time'], $left['priority']];
        });
        $status = (string)$events[0]['status'];
        set_user_preference($key, $status, $userid);
        return $status;
    }
    $status = (string)get_user_preferences($key, 'draft', $userid);
    return in_array($status, ['pending_review', 'published', 'rejected', 'draft'], true) ? $status : 'draft';
}

function pqtmktl_review_status(stdClass $profile, array $application, array $draft, string $canonicalstatus): string {
    if ($canonicalstatus !== '') {
        return $canonicalstatus;
    }
    if ((int)($profile->marketplace_visible ?? 0) === 1
            && (string)($profile->marketplace_status ?? '') === 'published') {
        return 'published';
    }
    if ($draft) {
        return (string)($draft['review_status'] ?? 'pending_review');
    }
    $lastreview = $application['marketplace_marketing_last_review'] ?? [];
    if (is_array($lastreview) && trim((string)($lastreview['status'] ?? '')) !== '') {
        return (string)$lastreview['status'];
    }
    return (string)($profile->marketplace_status ?? 'draft');
}

function pqtmktl_status_label(string $status): string {
    $labels = [
        'pending_review' => 'Pending Review',
        'published' => 'Published',
        'approved' => 'Approved',
        'rejected' => 'Returned for Revision',
        'draft' => 'Draft',
    ];
    return $labels[$status] ?? ucwords(str_replace('_', ' ', $status));
}
