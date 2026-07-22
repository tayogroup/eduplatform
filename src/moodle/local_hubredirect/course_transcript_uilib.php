<?php
// Course-transcript page-UI helper library — extracted VERBATIM from the three
// legacy transcript pages for the token-gated portal handlers. The legacy pages
// keep their inline copies and stay untouched (parallel-run).
//
//   pqctui_* (course_transcript.php)          -> pqctul_*
//   pqctx_*  (course_transcript_export.php)   -> pqctxl_*
//   pqcto_*  (course_transcript_official.php) -> pqctol_*
//
// NOT ported from course_transcript_export.php (by design):
//   pqctx_payload_lines_csv / pqctx_docs_csv  — the portal returns the same
//     dataset as JSON and the page builds the identical CSV client-side.
//   pqctx_pdf_html / pqctx_send_pdf           — PDF generation stays on the
//     legacy page; the portal returns the legacy PDF URL instead.
//
// Requires: local/hubredirect/accesslib.php loaded first
// (pqctul_resolve_workspace_id calls pqh_current_workspace_id /
// pqh_user_workspaces).

defined('MOODLE_INTERNAL') || die();

// ---- from course_transcript.php (pqctui_*) -----------------------------------

function pqctul_status_label(string $status): string {
    $status = trim($status);
    return $status === '' ? 'Unknown' : ucwords(str_replace('_', ' ', $status));
}

function pqctul_date(int $timestamp): string {
    return $timestamp > 0 ? userdate($timestamp, get_string('strftimedate')) : 'Not recorded';
}

function pqctul_short_date(int $timestamp): string {
    return $timestamp > 0 ? userdate($timestamp, get_string('strftimedateshort')) : '';
}

function pqctul_percent($value): string {
    return is_numeric($value) ? format_float((float)$value, 1) . '%' : 'Not recorded';
}

function pqctul_filter_timestamp(string $date, bool $endofday = false): int {
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
        return 0;
    }
    $time = strtotime($date . ($endofday ? ' 23:59:59' : ' 00:00:00'));
    return $time ? (int)$time : 0;
}

function pqctul_course_filter_value(array $line): string {
    $course = $line['course'] ?? [];
    $key = trim((string)($course['key'] ?? ''));
    return $key !== '' ? 'key:' . $key : 'offering:' . (int)($line['offeringid'] ?? 0);
}

function pqctul_line_reference_timestamp(array $line): int {
    $course = $line['course'] ?? [];
    $dates = $line['dates'] ?? [];
    foreach ([
        (int)($course['startdate'] ?? 0),
        (int)($dates['moodle_timestart'] ?? 0),
        (int)($dates['moodleenrolledat'] ?? 0),
        (int)($dates['approvedat'] ?? 0),
        (int)($dates['requestedat'] ?? 0),
    ] as $timestamp) {
        if ($timestamp > 0) {
            return $timestamp;
        }
    }
    return 0;
}

function pqctul_warning_class(string $severity): string {
    return $severity === 'blocker' ? 'pqct-warn--blocker' : 'pqct-warn--warning';
}

function pqctul_resolve_workspace_id(int $userid, int $requestedid, ?stdClass $consumercontext = null): int {
    $workspaceid = pqh_current_workspace_id($userid, $requestedid);
    if ($workspaceid > 0) {
        return $workspaceid;
    }
    $contextworkspaceid = (int)($consumercontext->workspaceid ?? 0);
    if ($contextworkspaceid > 0) {
        $workspaceid = pqh_current_workspace_id($userid, $contextworkspaceid);
        if ($workspaceid > 0) {
            return $workspaceid;
        }
    }
    $workspaces = pqh_user_workspaces($userid);
    if (count($workspaces) === 1) {
        return (int)$workspaces[0]->id;
    }
    return 0;
}

// ---- from course_transcript_export.php (pqctx_*) -----------------------------

function pqctxl_label(string $value): string {
    $value = trim($value);
    return $value === '' ? 'Unknown' : ucwords(str_replace('_', ' ', $value));
}

function pqctxl_date(int $time): string {
    return $time > 0 ? userdate($time, get_string('strftimedatetimeshort')) : '';
}

// ---- from course_transcript_official.php (pqcto_*) ---------------------------

function pqctol_status_label(string $status): string {
    $status = trim($status);
    return $status === '' ? 'Unknown' : ucwords(str_replace('_', ' ', $status));
}

function pqctol_date(int $time): string {
    return $time > 0 ? userdate($time, get_string('strftimedatetimeshort')) : 'Not recorded';
}

function pqctol_snapshot_value(array $line, string $key, string $fallback = 'Not recorded'): string {
    $display = $line['display'] ?? [];
    return trim((string)($display[$key] ?? '')) !== '' ? (string)$display[$key] : $fallback;
}
