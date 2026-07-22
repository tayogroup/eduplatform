<?php
// Teacher-portal helper library — extracted VERBATIM from teacher_portal.php
// (renamed pqtp_ -> pqtprl_) for the token-gated portal endpoint. The legacy
// page keeps its inline copy and stays untouched (parallel-run).
// Requires: local/prequran/notificationlib.php loaded first
// (local_prequran_notify_parent_live_update).

defined('MOODLE_INTERNAL') || die();

function pqtprl_notify_parent_update(int $workspaceid, int $sessionid, int $studentid, string $subject, string $message, string $eventtype): void {
    try {
        local_prequran_notify_parent_live_update(
            $sessionid,
            $studentid,
            $subject,
            $message,
            new moodle_url('/local/hubredirect/workspace_parent.php', [
                'workspaceid' => $workspaceid,
                'childid' => $studentid,
            ]),
            'Open parent workspace',
            $eventtype
        );
    } catch (Throwable $e) {
        debugging('Teacher portal parent notification failed: ' . $e->getMessage(), DEBUG_DEVELOPER);
    }
}
