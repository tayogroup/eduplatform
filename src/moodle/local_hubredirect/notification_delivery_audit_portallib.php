<?php
// Notification-delivery-audit query library — extracted VERBATIM from
// notification_delivery_audit.php (prefix pqnda_, unchanged) for the
// token-gated portal endpoint. The legacy page keeps its own inline copies
// and stays untouched (parallel-run).
// Requires: local/hubredirect/accesslib.php loaded first (shared pqh_* helpers
// are NOT copied here — they are called at runtime from the handler).

defined('MOODLE_INTERNAL') || die();

function pqnda_like(string $value): string {
    global $DB;
    return '%' . $DB->sql_like_escape($value) . '%';
}

function pqnda_count_sql(string $sql, array $params = []): int {
    global $DB;
    try {
        return (int)$DB->count_records_sql($sql, $params);
    } catch (Throwable $e) {
        return 0;
    }
}

function pqnda_recent_sql(string $sql, array $params = []): string {
    global $DB;
    try {
        $row = $DB->get_record_sql($sql, $params, IGNORE_MULTIPLE);
        if (!$row) {
            return '';
        }
        $parts = [];
        foreach ((array)$row as $key => $value) {
            if ($value !== null && $value !== '') {
                $parts[] = $key . '=' . core_text::substr((string)$value, 0, 140);
            }
        }
        return implode('; ', $parts);
    } catch (Throwable $e) {
        return '';
    }
}

function pqnda_row(string $category, string $source, int $count, string $evidence): array {
    return [
        'category' => $category,
        'source' => $source,
        'status' => $count > 0 ? 'PASS' : 'CHECK',
        'count' => $count,
        'evidence' => $evidence !== '' ? $evidence : 'No matching evidence found for the supplied run identifiers.',
    ];
}
