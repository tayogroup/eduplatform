<?php
namespace local_prequran\task;

defined('MOODLE_INTERNAL') || die();

require_once($GLOBALS['CFG']->dirroot . '/local/prequran/notificationlib.php');

class live_session_reminders extends \core\task\scheduled_task {
    public function get_name(): string {
        return get_string('task_live_session_reminders', 'local_prequran');
    }

    public function execute(): void {
        if (!$this->tables_ready()) {
            mtrace('PreQuran live reminders skipped: live-session tables are not ready.');
            return;
        }

        $this->mark_ended_sessions_awaiting_review();
        $this->send_practice_coach_session_reports();
        $this->send_before_class_reminders('24h', 23 * HOURSECS, 25 * HOURSECS);
        $this->send_before_class_reminders('1h', 50 * MINSECS, 70 * MINSECS);
        $this->send_teacher_followups();
        $this->send_admin_followups();
        $this->send_live_followup_reminders();
        $this->send_quality_review_reminders();
        $this->send_quality_coaching_reminders();
        $this->send_leadership_alerts();
        $this->send_improvement_plan_reminders();
        $this->send_series_acknowledgement_reminders();
    }

    private function tables_ready(): bool {
        global $DB;
        $manager = $DB->get_manager();
        return $manager->table_exists('local_prequran_live_session')
            && $manager->table_exists('local_prequran_live_participant')
            && $manager->table_exists('local_prequran_live_audit');
    }

    private function audit_exists(int $sessionid, int $targetid, string $action): bool {
        global $DB;
        return $DB->record_exists('local_prequran_live_audit', [
            'sessionid' => $sessionid,
            'targettype' => 'user',
            'targetid' => $targetid,
            'action' => $action,
        ]);
    }

    private function audit_exists_for_student(int $sessionid, int $studentid, string $action): bool {
        global $DB;
        return $DB->record_exists('local_prequran_live_audit', [
            'sessionid' => $sessionid,
            'targettype' => 'student',
            'targetid' => $studentid,
            'action' => $action,
        ]);
    }

    private function audit_exists_for_session(int $sessionid, string $action): bool {
        global $DB;
        return $DB->record_exists('local_prequran_live_audit', [
            'sessionid' => $sessionid,
            'targettype' => 'session',
            'targetid' => $sessionid,
            'action' => $action,
        ]);
    }

    private function audit_exists_for_series_since(int $seriesid, int $targetid, string $action, int $since): bool {
        global $DB;
        return $DB->record_exists_sql(
            "SELECT 1
               FROM {local_prequran_live_audit}
              WHERE action = :action
                AND targettype = :targettype
                AND targetid = :targetid
                AND timecreated >= :since",
            [
                'action' => $action,
                'targettype' => 'series',
                'targetid' => $seriesid,
                'since' => $since,
            ]
        );
    }

    private function audit_exists_for_series_parent_since(int $seriesid, int $parentid, string $action, int $since): bool {
        global $DB;
        return $DB->record_exists_sql(
            "SELECT 1
               FROM {local_prequran_live_audit}
              WHERE sessionid = :seriesid
                AND action = :action
                AND targettype = :targettype
                AND targetid = :parentid
                AND timecreated >= :since",
            [
                'seriesid' => $seriesid,
                'action' => $action,
                'targettype' => 'series_parent',
                'parentid' => $parentid,
                'since' => $since,
            ]
        );
    }

    private function column_exists(string $table, string $column): bool {
        global $DB;
        try {
            $columns = $DB->get_columns($table);
        } catch (\Throwable $e) {
            return false;
        }
        return array_key_exists($column, $columns);
    }

    private function brand_for_workspace(int $workspaceid): string {
        global $DB;

        if ($workspaceid <= 0 || !$DB->get_manager()->table_exists('local_prequran_consumer')) {
            return 'EduPlatform';
        }

        try {
            $consumer = $DB->get_record_sql(
                "SELECT name
                   FROM {local_prequran_consumer}
                  WHERE primaryworkspaceid = :workspaceid
                    AND status = :status
               ORDER BY id ASC",
                ['workspaceid' => $workspaceid, 'status' => 'active'],
                IGNORE_MULTIPLE
            );
            $name = trim((string)($consumer->name ?? ''));
            return $name !== '' ? $name : 'EduPlatform';
        } catch (\Throwable $e) {
            return 'EduPlatform';
        }
    }

    private function brand_for_session($session): string {
        return $this->brand_for_workspace((int)($session->workspaceid ?? 0));
    }

    private function brand_for_session_id(int $sessionid): string {
        global $DB;

        if ($sessionid <= 0 || !$this->column_exists('local_prequran_live_session', 'workspaceid')) {
            return 'EduPlatform';
        }

        try {
            return $this->brand_for_workspace((int)$DB->get_field('local_prequran_live_session', 'workspaceid', ['id' => $sessionid], IGNORE_MISSING));
        } catch (\Throwable $e) {
            return 'EduPlatform';
        }
    }

    private function brand_for_series($series): string {
        global $DB;

        $workspaceid = (int)($series->workspaceid ?? 0);
        if ($workspaceid > 0) {
            return $this->brand_for_workspace($workspaceid);
        }

        if (empty($series->id) || !$this->column_exists('local_prequran_live_session', 'workspaceid')) {
            return 'EduPlatform';
        }

        try {
            $workspaceid = (int)$DB->get_field_sql(
                "SELECT MAX(workspaceid)
                   FROM {local_prequran_live_session}
                  WHERE seriesid = :seriesid
                    AND workspaceid > 0",
                ['seriesid' => (int)$series->id]
            );
            return $workspaceid > 0 ? $this->brand_for_workspace($workspaceid) : 'EduPlatform';
        } catch (\Throwable $e) {
            return 'EduPlatform';
        }
    }

    private function mark_attempted(int $sessionid, int $targetid, string $action, array $details = []): void {
        local_prequran_notify_audit($sessionid, $targetid, $action, $details);
    }

    private function mark_student_attempted(int $sessionid, int $studentid, string $action, array $details = []): void {
        global $DB;
        if (!$DB->get_manager()->table_exists('local_prequran_live_audit')) {
            return;
        }
        $DB->insert_record('local_prequran_live_audit', (object)[
            'sessionid' => $sessionid,
            'actorid' => 0,
            'action' => $action,
            'targettype' => 'student',
            'targetid' => $studentid,
            'details' => $details ? json_encode($details) : '',
            'timecreated' => time(),
        ]);
    }

    private function mark_session_attempted(int $sessionid, string $action, array $details = []): void {
        global $DB;
        if (!$DB->get_manager()->table_exists('local_prequran_live_audit')) {
            return;
        }
        $DB->insert_record('local_prequran_live_audit', (object)[
            'sessionid' => $sessionid,
            'actorid' => 0,
            'action' => $action,
            'targettype' => 'session',
            'targetid' => $sessionid,
            'details' => $details ? json_encode($details) : '',
            'timecreated' => time(),
        ]);
    }

    private function mark_ended_sessions_awaiting_review(): void {
        global $DB;

        $now = time();
        $sessions = $DB->get_records_sql(
            "SELECT id, title, teacherid, status, scheduled_end, timemodified
               FROM {local_prequran_live_session}
              WHERE scheduled_end < :nowtime
                AND status IN ('live', 'needs_review')
           ORDER BY scheduled_end ASC, id ASC",
            ['nowtime' => $now],
            0,
            200
        );

        $updated = 0;
        foreach ($sessions as $session) {
            $oldstatus = (string)$session->status;
            $session->status = 'awaiting_review';
            $session->timemodified = $now;
            $DB->update_record('local_prequran_live_session', $session);
            if (!$this->audit_exists_for_session((int)$session->id, 'session_awaiting_review')) {
                $this->mark_session_attempted((int)$session->id, 'session_awaiting_review', [
                    'oldstatus' => $oldstatus,
                    'scheduled_end' => (int)$session->scheduled_end,
                    'reason' => 'scheduled end passed; teacher review required',
                ]);
            }
            $updated++;
        }

        if ($updated > 0) {
            mtrace('PreQuran live lifecycle: marked ' . $updated . ' ended session(s) awaiting review.');
        }
    }

    private function mark_series_attempted(int $seriesid, string $action, array $details = []): void {
        global $DB;
        if (!$DB->get_manager()->table_exists('local_prequran_live_audit')) {
            return;
        }
        $DB->insert_record('local_prequran_live_audit', (object)[
            'sessionid' => 0,
            'actorid' => 0,
            'action' => $action,
            'targettype' => 'series',
            'targetid' => $seriesid,
            'details' => $details ? json_encode($details) : '',
            'timecreated' => time(),
        ]);
    }

    private function mark_series_parent_attempted(int $seriesid, int $parentid, string $action, array $details = []): void {
        global $DB;
        if (!$DB->get_manager()->table_exists('local_prequran_live_audit')) {
            return;
        }
        $DB->insert_record('local_prequran_live_audit', (object)[
            'sessionid' => $seriesid,
            'actorid' => 0,
            'action' => $action,
            'targettype' => 'series_parent',
            'targetid' => $parentid,
            'details' => $details ? json_encode($details) : '',
            'timecreated' => time(),
        ]);
    }

    private function send_practice_coach_session_reports(): void {
        global $DB;

        $manager = $DB->get_manager();
        if (!$manager->table_exists('local_prequran_practice_coach_event')) {
            return;
        }
        if (!$this->column_exists('local_prequran_live_session', 'session_type')
                && !$this->column_exists('local_prequran_live_session', 'teacher_required')) {
            return;
        }

        $now = time();
        $since = $now - (14 * DAYSECS);
        $reportselect = $this->column_exists('local_prequran_live_session', 'report_to_teacherid')
            ? 's.report_to_teacherid,'
            : '0 AS report_to_teacherid,';
        $modewhere = [];
        if ($this->column_exists('local_prequran_live_session', 'session_type')) {
            $modewhere[] = "s.session_type = 'supervised_practice'";
        }
        if ($this->column_exists('local_prequran_live_session', 'teacher_required')) {
            $modewhere[] = 's.teacher_required = 0';
        }
        $modesql = '(' . implode(' OR ', $modewhere) . ')';

        $sessions = $DB->get_records_sql(
            "SELECT DISTINCT s.id, s.title, s.teacherid, {$reportselect}
                    s.lessonid, s.unitid, s.scheduled_start, s.scheduled_end, s.status
               FROM {local_prequran_live_session} s
               JOIN {local_prequran_practice_coach_event} e ON e.live_sessionid = s.id
              WHERE s.scheduled_end < :nowtime
                AND s.scheduled_end >= :since
                AND s.status IN ('awaiting_review', 'completed', 'live', 'needs_review')
                AND {$modesql}
           ORDER BY s.scheduled_end ASC, s.id ASC",
            ['nowtime' => $now, 'since' => $since],
            0,
            50
        );

        $sent = 0;
        foreach ($sessions as $session) {
            $sessionid = (int)$session->id;
            if ($this->audit_exists_for_session($sessionid, 'practice_coach_summary_prepared')) {
                continue;
            }

            $followupexpr = $this->column_exists('local_prequran_practice_coach_event', 'recommendation_key')
                ? "SUM(CASE WHEN recommendation_key = 'teacher_followup' THEN 1 ELSE 0 END)"
                : '0';
            $rows = $DB->get_records_sql(
                "SELECT userid,
                        COUNT(1) AS total_events,
                        SUM(CASE WHEN trigger_key = 'idle_nudge' THEN 1 ELSE 0 END) AS idle_events,
                        SUM(CASE WHEN trigger_key IN ('screen_return', 'focus_return') THEN 1 ELSE 0 END) AS away_events,
                        {$followupexpr} AS followup_events,
                        MIN(timecreated) AS first_event,
                        MAX(timecreated) AS last_event
                   FROM {local_prequran_practice_coach_event}
                  WHERE live_sessionid = :sessionid
               GROUP BY userid
               ORDER BY userid ASC",
                ['sessionid' => $sessionid]
            );
            if (!$rows) {
                continue;
            }

            $studentlines = [];
            foreach ($rows as $row) {
                $studentid = (int)$row->userid;
                $student = \core_user::get_user($studentid);
                $name = $student ? fullname($student) : 'Student ' . $studentid;
                $total = (int)$row->total_events;
                $idle = (int)$row->idle_events;
                $away = (int)$row->away_events;
                $followups = (int)$row->followup_events;
                $recommendation = $followups > 0 || $idle >= 3 || $away >= 3
                    ? 'teacher follow-up recommended'
                    : 'continue current lesson practice';
                $studentlines[] = $name . ': ' . $total . ' coach prompt(s), ' . $idle . ' idle, ' . $away . ' away/return, ' . $recommendation . '.';
                $this->mark_student_attempted($sessionid, $studentid, 'practice_coach_student_summary_available', [
                    'total_events' => $total,
                    'idle_events' => $idle,
                    'away_events' => $away,
                    'followup_events' => $followups,
                    'recommendation' => $recommendation,
                ]);

                $parentmessage = 'A supervised practice summary is ready for ' . $name . ' from "' . (string)$session->title . '". Practice Coach gave ' . $total . ' support prompt(s). Suggested next step: ' . $recommendation . '.';
                $parenturl = new \moodle_url('/local/hubredirect/live_summaries.php', ['sessionid' => $sessionid, 'childid' => $studentid]);
                foreach (local_prequran_notify_parent_ids_for_student($studentid) as $parentid) {
                    $action = 'practice_coach_parent_report_sent';
                    if ($this->audit_exists($sessionid, (int)$parentid, $action)) {
                        continue;
                    }
                    local_prequran_notify_user_live_update(
                        $sessionid,
                        (int)$parentid,
                        'Supervised practice summary ready',
                        $parentmessage,
                        $parenturl,
                        'Open live summary',
                        'practice_coach_parent_summary',
                        $studentid
                    );
                    $this->mark_attempted($sessionid, (int)$parentid, $action, [
                        'role' => 'parent',
                        'studentid' => $studentid,
                    ]);
                    $sent++;
                }
            }

            $reportteacherid = (int)($session->report_to_teacherid ?? 0);
            if ($reportteacherid <= 0) {
                $reportteacherid = (int)$session->teacherid;
            }
            $reporturl = new \moodle_url('/local/hubredirect/live_practice_coach.php', ['sessionid' => $sessionid]);
            $summary = 'Practice Coach summary is ready for "' . (string)$session->title . "\".\n\n" . implode("\n", $studentlines);
            if ($reportteacherid > 0 && !$this->audit_exists($sessionid, $reportteacherid, 'practice_coach_summary_teacher_sent')) {
                local_prequran_notify_user_live_update(
                    $sessionid,
                    $reportteacherid,
                    'Practice Coach summary ready',
                    $summary,
                    $reporturl,
                    'Open Practice Coach report',
                    'practice_coach_teacher_summary'
                );
                $this->mark_attempted($sessionid, $reportteacherid, 'practice_coach_summary_teacher_sent', [
                    'role' => 'teacher',
                    'student_count' => count($rows),
                ]);
                $sent++;
            }

            foreach (get_admins() as $admin) {
                $action = 'practice_coach_summary_admin_sent';
                if ($this->audit_exists($sessionid, (int)$admin->id, $action)) {
                    continue;
                }
                local_prequran_notify_user_live_update(
                    $sessionid,
                    (int)$admin->id,
                    'Practice Coach admin review available',
                    $summary,
                    $reporturl,
                    'Open Practice Coach report',
                    'practice_coach_admin_summary'
                );
                $this->mark_attempted($sessionid, (int)$admin->id, $action, [
                    'role' => 'admin',
                    'student_count' => count($rows),
                ]);
                $sent++;
            }

            $this->mark_session_attempted($sessionid, 'practice_coach_summary_prepared', [
                'student_count' => count($rows),
                'report_to_teacherid' => $reportteacherid,
            ]);
        }

        if ($sent > 0) {
            mtrace('PreQuran Practice Coach: sent ' . $sent . ' supervised-practice summary notification(s).');
        }
    }

    private function send_before_class_reminders(string $key, int $fromoffset, int $tooffset): void {
        global $DB;

        $now = time();
        $sessions = $DB->get_records_sql(
            "SELECT *
               FROM {local_prequran_live_session}
              WHERE scheduled_start BETWEEN :fromtime AND :totime
                AND status IN ('scheduled', 'live')",
            ['fromtime' => $now + $fromoffset, 'totime' => $now + $tooffset]
        );

        foreach ($sessions as $session) {
            $action = 'live_reminder_' . $key . '_sent';
            $start = userdate((int)$session->scheduled_start, get_string('strftimedatetimeshort'));
            $url = new \moodle_url('/local/hubredirect/live_sessions.php');
            $subject = 'Live class reminder';
            $message = 'Reminder: your ' . $this->brand_for_session($session) . ' live class "' . (string)$session->title . '" is scheduled for ' . $start . '.';

            if ((int)$session->teacherid > 0 && !$this->audit_exists((int)$session->id, (int)$session->teacherid, $action)) {
                local_prequran_notify_user_live_update((int)$session->id, (int)$session->teacherid, $subject, $message, $url, 'Open live sessions', 'live_class_reminder_' . $key);
                $this->mark_attempted((int)$session->id, (int)$session->teacherid, $action, ['role' => 'teacher', 'window' => $key]);
            }

            $participants = $DB->get_records('local_prequran_live_participant', [
                'sessionid' => (int)$session->id,
                'role' => 'student',
                'status' => 'active',
            ]);
            foreach ($participants as $participant) {
                $studentid = (int)($participant->studentid ?: $participant->userid);
                if ((int)$participant->userid > 0 && !$this->audit_exists((int)$session->id, (int)$participant->userid, $action)) {
                    local_prequran_notify_user_live_update((int)$session->id, (int)$participant->userid, $subject, $message, $url, 'Open live sessions', 'live_class_reminder_' . $key, $studentid);
                    $this->mark_attempted((int)$session->id, (int)$participant->userid, $action, ['role' => 'student', 'window' => $key, 'studentid' => $studentid]);
                }

                foreach (local_prequran_notify_parent_ids_for_student($studentid) as $parentid) {
                    if ($this->audit_exists((int)$session->id, (int)$parentid, $action)) {
                        continue;
                    }
                    local_prequran_notify_user_live_update((int)$session->id, (int)$parentid, $subject, $message, $url, 'Open live sessions', 'live_class_parent_reminder_' . $key, $studentid);
                    $this->mark_attempted((int)$session->id, (int)$parentid, $action, ['role' => 'parent', 'window' => $key, 'studentid' => $studentid]);
                }
            }
        }
    }

    private function send_teacher_followups(): void {
        global $DB;

        if (!$DB->get_manager()->table_exists('local_prequran_live_attendance')
            || !$DB->get_manager()->table_exists('local_prequran_live_note')) {
            return;
        }

        $now = time();
        $sessions = $DB->get_records_sql(
            "SELECT s.id,
                    s.teacherid,
                    s.title,
                    s.scheduled_end,
                    COUNT(DISTINCT p.id) AS student_count,
                    COUNT(DISTINCT a.id) AS attendance_count,
                    COUNT(DISTINCT n.id) AS note_count
               FROM {local_prequran_live_session} s
               JOIN {local_prequran_live_participant} p ON p.sessionid = s.id AND p.role = 'student' AND p.status = 'active'
          LEFT JOIN {local_prequran_live_attendance} a ON a.sessionid = s.id AND a.studentid = p.studentid
          LEFT JOIN {local_prequran_live_note} n ON n.sessionid = s.id AND n.studentid = p.studentid
              WHERE s.scheduled_end BETWEEN :fromtime AND :totime
           GROUP BY s.id, s.teacherid, s.title, s.scheduled_end",
            ['fromtime' => $now - DAYSECS, 'totime' => $now - HOURSECS]
        );

        foreach ($sessions as $session) {
            if ((int)$session->student_count <= 0) {
                continue;
            }
            if ((int)$session->attendance_count >= (int)$session->student_count && (int)$session->note_count >= (int)$session->student_count) {
                continue;
            }
            $action = 'live_followup_teacher_sent';
            if ($this->audit_exists((int)$session->id, (int)$session->teacherid, $action)) {
                continue;
            }
            $url = new \moodle_url('/local/hubredirect/live_review.php', ['sessionid' => (int)$session->id]);
            local_prequran_notify_user_live_update(
                (int)$session->id,
                (int)$session->teacherid,
                'Live class review needed',
                'Please complete attendance and parent-visible feedback for "' . (string)$session->title . '".',
                $url,
                'Complete live class review',
                'live_teacher_review_followup'
            );
            $this->mark_attempted((int)$session->id, (int)$session->teacherid, $action, [
                'student_count' => (int)$session->student_count,
                'attendance_count' => (int)$session->attendance_count,
                'note_count' => (int)$session->note_count,
            ]);
        }
    }

    private function send_admin_followups(): void {
        global $DB;

        $now = time();
        $sessions = $DB->get_records_sql(
            "SELECT s.*
               FROM {local_prequran_live_session} s
          LEFT JOIN {local_prequran_live_audit} a ON a.sessionid = s.id AND a.action = 'review_saved'
              WHERE s.scheduled_end BETWEEN :fromtime AND :totime
                AND a.id IS NULL",
            ['fromtime' => $now - (2 * DAYSECS), 'totime' => $now - DAYSECS]
        );

        $admins = get_admins();
        foreach ($sessions as $session) {
            foreach ($admins as $admin) {
                $action = 'live_followup_admin_sent';
                if ($this->audit_exists((int)$session->id, (int)$admin->id, $action)) {
                    continue;
                }
                $url = new \moodle_url('/local/hubredirect/live_review.php', ['sessionid' => (int)$session->id]);
                local_prequran_notify_user_live_update(
                    (int)$session->id,
                    (int)$admin->id,
                    'Live class missing post-session review',
                    'A ' . $this->brand_for_session($session) . ' live class has no saved post-session review: "' . (string)$session->title . '".',
                    $url,
                    'Review live class',
                    'live_admin_review_followup'
                );
                $this->mark_attempted((int)$session->id, (int)$admin->id, $action, ['role' => 'admin']);
            }
        }
    }

    private function send_live_followup_reminders(): void {
        global $DB;

        if (!$DB->get_manager()->table_exists('local_prequran_live_note')
            || !$this->column_exists('local_prequran_live_note', 'followup_status')
            || !$this->column_exists('local_prequran_live_note', 'followup_contactedat')) {
            return;
        }

        $now = time();
        $rows = $DB->get_records_sql(
            "SELECT n.*,
                    s.title AS session_title,
                    s.teacherid AS session_teacherid,
                    s.scheduled_start
               FROM {local_prequran_live_note} n
               JOIN {local_prequran_live_session} s ON s.id = n.sessionid
              WHERE n.followup_status <> :none
                AND n.followup_resolved = 0",
            ['none' => 'none']
        );

        foreach ($rows as $note) {
            $sessionid = (int)$note->sessionid;
            $studentid = (int)$note->studentid;
            $teacherid = (int)($note->teacherid ?: $note->session_teacherid);
            $base = (int)($note->followup_contactedat ?: $note->timemodified);
            if ($base <= 0) {
                $base = $now;
            }
            $age = $now - $base;

            if ($age >= (2 * DAYSECS)) {
                $this->send_parent_followup_reminder($note, $studentid);
                $this->send_teacher_followup_reminder($note, $teacherid);
            }

            if ((string)$note->followup_status === 'admin_support_requested' || $age >= (3 * DAYSECS)) {
                $this->send_admin_followup_escalation($note, $studentid);
            }
        }
    }

    private function parent_replied_to_followup($note): bool {
        global $DB;

        if (empty($note->followup_threadid)
            || !$DB->get_manager()->table_exists('local_prequran_comm_message')
            || !$DB->get_manager()->table_exists('local_prequran_comm_participant')) {
            return false;
        }

        return $DB->record_exists_sql(
            "SELECT 1
               FROM {local_prequran_comm_message} m
               JOIN {local_prequran_comm_participant} p ON p.threadid = m.threadid AND p.userid = m.senderid
              WHERE m.threadid = :threadid
                AND p.role = :role
                AND m.timecreated > :since",
            [
                'threadid' => (int)$note->followup_threadid,
                'role' => 'parent',
                'since' => (int)$note->followup_contactedat,
            ]
        );
    }

    private function send_parent_followup_reminder($note, int $studentid): void {
        if ($this->parent_replied_to_followup($note)) {
            return;
        }

        $sessionid = (int)$note->sessionid;
        $url = new \moodle_url('/local/hubredirect/live_summaries.php', ['childid' => $studentid]);
        foreach (local_prequran_notify_parent_ids_for_student($studentid) as $parentid) {
            $action = 'followup_parent_reminder_sent';
            if ($this->audit_exists($sessionid, (int)$parentid, $action)) {
                continue;
            }
            local_prequran_notify_user_live_update(
                $sessionid,
                (int)$parentid,
                'Live class follow-up reminder',
                'A ' . $this->brand_for_session_id($sessionid) . ' live-class follow-up is still waiting for your review.',
                $url,
                'View follow-up',
                'live_followup_parent_reminder',
                $studentid
            );
            $this->mark_attempted($sessionid, (int)$parentid, $action, [
                'studentid' => $studentid,
                'followup_status' => (string)$note->followup_status,
                'threadid' => (int)($note->followup_threadid ?? 0),
            ]);
        }
    }

    private function send_teacher_followup_reminder($note, int $teacherid): void {
        if ($teacherid <= 0) {
            return;
        }
        $sessionid = (int)$note->sessionid;
        $studentid = (int)$note->studentid;
        $action = 'followup_teacher_reminder_sent';
        if ($this->audit_exists($sessionid, $teacherid, $action)) {
            return;
        }
        local_prequran_notify_user_live_update(
            $sessionid,
            $teacherid,
            'Live class follow-up still open',
            'A ' . $this->brand_for_session_id($sessionid) . ' live-class follow-up is still unresolved.',
            new \moodle_url('/local/hubredirect/live_review.php', ['sessionid' => $sessionid]),
            'Resolve follow-up',
            'live_followup_teacher_reminder',
            $studentid
        );
        $this->mark_attempted($sessionid, $teacherid, $action, [
            'studentid' => $studentid,
            'followup_status' => (string)$note->followup_status,
            'threadid' => (int)($note->followup_threadid ?? 0),
        ]);
    }

    private function send_admin_followup_escalation($note, int $studentid): void {
        $sessionid = (int)$note->sessionid;
        $action = 'followup_escalated_admin';
        if ($this->audit_exists_for_student($sessionid, $studentid, $action)) {
            return;
        }

        foreach (get_admins() as $admin) {
            local_prequran_notify_user_live_update(
                $sessionid,
                (int)$admin->id,
                'Live follow-up needs admin attention',
                'A ' . $this->brand_for_session_id($sessionid) . ' live-class follow-up needs admin review.',
                new \moodle_url('/local/hubredirect/live_ops.php'),
                'Open live operations',
                'live_followup_admin_escalation',
                $studentid
            );
        }

        $this->mark_student_attempted($sessionid, $studentid, $action, [
            'followup_status' => (string)$note->followup_status,
            'threadid' => (int)($note->followup_threadid ?? 0),
        ]);
    }

    private function send_quality_review_reminders(): void {
        global $DB;

        if (!$this->column_exists('local_prequran_live_session', 'qa_status')
            || !$this->column_exists('local_prequran_live_session', 'qa_reviewedat')) {
            return;
        }

        $now = time();
        $sessions = $DB->get_records_sql(
            "SELECT id, title, teacherid, scheduled_end, qa_status, qa_reviewedat
               FROM {local_prequran_live_session}
              WHERE status <> :cancelled
                AND scheduled_end BETWEEN :fromtime AND :totime
                AND (qa_status = :notreviewed OR qa_reviewedat = 0)
           ORDER BY scheduled_end ASC, id ASC",
            [
                'cancelled' => 'cancelled',
                'fromtime' => $now - (14 * DAYSECS),
                'totime' => $now - DAYSECS,
                'notreviewed' => 'not_reviewed',
            ],
            0,
            50
        );

        foreach ($sessions as $session) {
            foreach (get_admins() as $admin) {
                $action = 'quality_review_reminder_sent';
                if ($this->audit_exists((int)$session->id, (int)$admin->id, $action)) {
                    continue;
                }

                local_prequran_notify_user_live_update(
                    (int)$session->id,
                    (int)$admin->id,
                    'Live class quality review needed',
                    'A ' . $this->brand_for_session($session) . ' live class is ready for admin quality review: "' . (string)$session->title . '".',
                    new \moodle_url('/local/hubredirect/live_quality.php', ['sessionid' => (int)$session->id]),
                    'Review class quality',
                    'live_quality_review_reminder'
                );
                $this->mark_attempted((int)$session->id, (int)$admin->id, $action, [
                    'role' => 'admin',
                    'qa_status' => (string)$session->qa_status,
                    'ended_at' => (int)$session->scheduled_end,
                ]);
            }
        }
    }

    private function send_quality_coaching_reminders(): void {
        global $DB;

        if (!$this->column_exists('local_prequran_live_session', 'qa_coaching_status')
            || !$this->column_exists('local_prequran_live_session', 'qa_coaching_due_date')) {
            return;
        }

        $now = time();
        $sessions = $DB->get_records_sql(
            "SELECT id, title, teacherid, qa_status, qa_score, qa_coaching_status, qa_coaching_priority,
                    qa_coaching_due_date, qa_coaching_ackat, qa_reviewedat
               FROM {local_prequran_live_session}
              WHERE qa_coaching_status IN ('assigned', 'acknowledged')
           ORDER BY qa_coaching_due_date ASC, qa_reviewedat DESC, id DESC",
            [],
            0,
            100
        );

        foreach ($sessions as $session) {
            $sessionid = (int)$session->id;
            $teacherid = (int)$session->teacherid;
            $due = (int)$session->qa_coaching_due_date;
            $isoverdue = $due > 0 && $due < $now;
            $duewithinaday = $due > 0 && $due <= $now + DAYSECS;
            $reviewage = (int)$session->qa_reviewedat > 0 ? $now - (int)$session->qa_reviewedat : 0;

            if ($teacherid > 0
                && ((string)$session->qa_coaching_status === 'assigned' || $duewithinaday || $isoverdue)
                && !$this->audit_exists($sessionid, $teacherid, 'quality_coaching_teacher_reminder_sent')) {
                local_prequran_notify_user_live_update(
                    $sessionid,
                    $teacherid,
                    'QA coaching follow-up',
                    'A ' . $this->brand_for_session($session) . ' live-class coaching item needs your attention: "' . (string)$session->title . '".',
                    new \moodle_url('/local/hubredirect/live_teacher.php'),
                    'Open teacher workspace',
                    'live_quality_coaching_teacher_reminder'
                );
                $this->mark_attempted($sessionid, $teacherid, 'quality_coaching_teacher_reminder_sent', [
                    'qa_status' => (string)$session->qa_status,
                    'qa_score' => (int)$session->qa_score,
                    'coaching_status' => (string)$session->qa_coaching_status,
                    'priority' => (string)$session->qa_coaching_priority,
                    'due_date' => $due,
                    'review_age_seconds' => $reviewage,
                ]);
            }

            if (!$isoverdue) {
                continue;
            }

            if (!$this->audit_exists_for_session($sessionid, 'quality_coaching_overdue')) {
                $this->mark_session_attempted($sessionid, 'quality_coaching_overdue', [
                    'teacherid' => $teacherid,
                    'coaching_status' => (string)$session->qa_coaching_status,
                    'priority' => (string)$session->qa_coaching_priority,
                    'due_date' => $due,
                ]);
            }

            foreach (get_admins() as $admin) {
                $action = 'quality_coaching_admin_escalated';
                if ($this->audit_exists($sessionid, (int)$admin->id, $action)) {
                    continue;
                }

                local_prequran_notify_user_live_update(
                    $sessionid,
                    (int)$admin->id,
                    'QA coaching overdue',
                    'A teacher QA coaching follow-up is overdue for "' . (string)$session->title . '".',
                    new \moodle_url('/local/hubredirect/live_quality.php', ['sessionid' => $sessionid]),
                    'Review coaching',
                    'live_quality_coaching_admin_escalation'
                );
                $this->mark_attempted($sessionid, (int)$admin->id, $action, [
                    'role' => 'admin',
                    'teacherid' => $teacherid,
                    'coaching_status' => (string)$session->qa_coaching_status,
                    'priority' => (string)$session->qa_coaching_priority,
                    'due_date' => $due,
                ]);
            }
        }
    }

    private function send_leadership_alerts(): void {
        global $DB;

        if (!$this->column_exists('local_prequran_live_session', 'leadership_review_status')
            || !$this->column_exists('local_prequran_live_session', 'qa_status')
            || !$this->column_exists('local_prequran_live_session', 'qa_score')
            || !$this->column_exists('local_prequran_live_session', 'qa_reviewedat')
            || !$this->column_exists('local_prequran_live_session', 'qa_coaching_status')
            || !$this->column_exists('local_prequran_live_session', 'qa_coaching_due_date')) {
            return;
        }

        $this->auto_flag_serious_quality_issues();
        $this->auto_flag_overdue_coaching();
        $this->auto_flag_teacher_quality_patterns();
    }

    private function send_improvement_plan_reminders(): void {
        global $DB;

        if (!$this->column_exists('local_prequran_live_session', 'improvement_plan_status')
            || !$this->column_exists('local_prequran_live_session', 'improvement_plan_due_date')
            || !$this->column_exists('local_prequran_live_session', 'improvement_plan_assignedat')
            || !$this->column_exists('local_prequran_live_session', 'improvement_plan_ackat')) {
            return;
        }

        $now = time();
        $sessions = $DB->get_records_sql(
            "SELECT id, title, teacherid, qa_status, qa_score, leadership_review_status,
                    improvement_plan_status, improvement_plan_priority, improvement_plan_due_date,
                    improvement_plan_assignedat, improvement_plan_ackat, improvement_plan_mentorid
               FROM {local_prequran_live_session}
              WHERE improvement_plan_status IN ('assigned', 'in_progress')
           ORDER BY CASE improvement_plan_priority
                        WHEN 'high' THEN 1
                        WHEN 'normal' THEN 2
                        ELSE 3
                    END,
                    improvement_plan_due_date ASC,
                    improvement_plan_assignedat DESC",
            [],
            0,
            150
        );

        foreach ($sessions as $session) {
            $sessionid = (int)$session->id;
            $teacherid = (int)$session->teacherid;
            $due = (int)$session->improvement_plan_due_date;
            $assignedat = (int)$session->improvement_plan_assignedat;
            $ackat = (int)$session->improvement_plan_ackat;
            $isoverdue = $due > 0 && $due < $now;
            $duewithinaday = $due > 0 && $due <= $now + DAYSECS;
            $assignedoverday = $assignedat > 0 && $assignedat <= $now - DAYSECS;

            if ($teacherid > 0
                && (string)$session->improvement_plan_status === 'assigned'
                && $ackat <= 0
                && $assignedoverday
                && !$this->audit_exists($sessionid, $teacherid, 'improvement_plan_teacher_reminder_sent')) {
                local_prequran_notify_user_live_update(
                    $sessionid,
                    $teacherid,
                    'Improvement plan acknowledgement needed',
                    'A ' . $this->brand_for_session($session) . ' teacher improvement plan is waiting for your acknowledgement: "' . (string)$session->title . '".',
                    new \moodle_url('/local/hubredirect/live_teacher.php'),
                    'Open teacher workspace',
                    'live_improvement_plan_teacher_reminder'
                );
                $this->mark_attempted($sessionid, $teacherid, 'improvement_plan_teacher_reminder_sent', [
                    'status' => (string)$session->improvement_plan_status,
                    'priority' => (string)$session->improvement_plan_priority,
                    'due_date' => $due,
                    'assigned_at' => $assignedat,
                    'reason' => 'assigned_not_acknowledged',
                ]);
            }

            if ($teacherid > 0
                && $duewithinaday
                && !$isoverdue
                && !$this->audit_exists($sessionid, $teacherid, 'improvement_plan_due_soon_sent')) {
                local_prequran_notify_user_live_update(
                    $sessionid,
                    $teacherid,
                    'Improvement plan due soon',
                    'A ' . $this->brand_for_session($session) . ' teacher improvement plan is due soon for "' . (string)$session->title . '".',
                    new \moodle_url('/local/hubredirect/live_teacher.php'),
                    'Open teacher workspace',
                    'live_improvement_plan_due_soon'
                );
                $this->mark_attempted($sessionid, $teacherid, 'improvement_plan_due_soon_sent', [
                    'status' => (string)$session->improvement_plan_status,
                    'priority' => (string)$session->improvement_plan_priority,
                    'due_date' => $due,
                    'mentorid' => (int)$session->improvement_plan_mentorid,
                ]);
            }

            if (!$isoverdue) {
                continue;
            }

            if (!$this->audit_exists_for_session($sessionid, 'improvement_plan_overdue')) {
                $this->mark_session_attempted($sessionid, 'improvement_plan_overdue', [
                    'teacherid' => $teacherid,
                    'status' => (string)$session->improvement_plan_status,
                    'priority' => (string)$session->improvement_plan_priority,
                    'due_date' => $due,
                    'mentorid' => (int)$session->improvement_plan_mentorid,
                ]);
            }

            foreach (get_admins() as $admin) {
                $action = 'improvement_plan_admin_escalated';
                if ($this->audit_exists($sessionid, (int)$admin->id, $action)) {
                    continue;
                }

                local_prequran_notify_user_live_update(
                    $sessionid,
                    (int)$admin->id,
                    'Teacher improvement plan overdue',
                    'A ' . $this->brand_for_session($session) . ' teacher improvement plan is overdue for "' . (string)$session->title . '".',
                    new \moodle_url('/local/hubredirect/live_leadership.php', ['teacherid' => $teacherid, 'status' => 'all']),
                    'Open leadership review',
                    'live_improvement_plan_admin_escalation'
                );
                $this->mark_attempted($sessionid, (int)$admin->id, $action, [
                    'role' => 'admin',
                    'teacherid' => $teacherid,
                    'status' => (string)$session->improvement_plan_status,
                    'priority' => (string)$session->improvement_plan_priority,
                    'due_date' => $due,
                    'mentorid' => (int)$session->improvement_plan_mentorid,
                ]);
            }
        }
    }

    private function send_series_acknowledgement_reminders(): void {
        global $DB;

        if (!$DB->get_manager()->table_exists('local_prequran_live_ack')
            || !$DB->get_manager()->table_exists('local_prequran_live_series')
            || !$DB->get_manager()->table_exists('local_prequran_live_session')
            || !$DB->get_manager()->table_exists('local_prequran_live_participant')) {
            return;
        }

        $now = time();
        $seriesrows = $DB->get_records_sql(
            "SELECT se.id, se.title, se.teacherid, se.status, se.timemodified,
                    MAX(CASE
                            WHEN a.action IN (
                                'series_updated',
                                'series_session_updated',
                                'series_single_session_cancelled',
                                'series_cancelled',
                                'session_cancelled',
                                'series_change_notifications_processed',
                                'series_cancel_notifications_processed',
                                'series_single_session_cancel_notifications_processed'
                            ) THEN a.timecreated
                            ELSE 0
                        END) AS latestchange
               FROM {local_prequran_live_series} se
          LEFT JOIN {local_prequran_live_audit} a ON a.targettype = :targettype AND a.targetid = se.id
              WHERE se.status <> :cancelled
           GROUP BY se.id, se.title, se.teacherid, se.status, se.timemodified
             HAVING latestchange > 0
           ORDER BY latestchange ASC, se.id ASC",
            ['targettype' => 'series', 'cancelled' => 'cancelled'],
            0,
            100
        );

        foreach ($seriesrows as $series) {
            $seriesid = (int)$series->id;
            $latestchange = (int)$series->latestchange;
            if ($seriesid <= 0 || $latestchange <= 0) {
                continue;
            }

            $studentids = $this->series_studentids($seriesid);
            if (!$studentids) {
                $this->maybe_mark_series_skip($seriesid, $latestchange, 'series_ack_auto_reminder_skipped', [
                    'reason' => 'no active students',
                ]);
                continue;
            }

            foreach ($studentids as $studentid) {
                $parents = local_prequran_notify_parent_ids_for_student($studentid);
                if (!$parents) {
                    $this->maybe_mark_series_skip($seriesid, $latestchange, 'series_ack_auto_reminder_skipped', [
                        'studentid' => $studentid,
                        'reason' => 'no linked parents',
                    ]);
                    continue;
                }

                foreach ($parents as $parentid) {
                    $parentid = (int)$parentid;
                    if ($this->series_ack_is_current($seriesid, $studentid, $parentid, $latestchange)) {
                        continue;
                    }

                    $ack = $this->ensure_series_ack_record($seriesid, $studentid, $parentid, $latestchange);
                    $lastcontact = (int)($ack->remindedat ?? 0);
                    $base = $lastcontact > 0 ? $lastcontact : $latestchange;
                    $age = $now - $base;

                    if ($now - $latestchange >= DAYSECS
                        && ($lastcontact <= 0 || $lastcontact < $latestchange)
                        && !$this->audit_exists_for_series_parent_since($seriesid, $parentid, 'series_ack_auto_reminder_sent', $latestchange)) {
                        $this->send_series_ack_parent_reminder($series, $studentid, $parentid, $latestchange);
                        continue;
                    }

                    if ($now - $latestchange >= (3 * DAYSECS)
                        && $age >= DAYSECS
                        && !$this->audit_exists_for_series_parent_since($seriesid, $parentid, 'series_ack_escalated_admin', $latestchange)) {
                        $this->send_series_ack_admin_escalation($series, $studentid, $parentid, $latestchange);
                    }
                }
            }
        }
    }

    private function series_studentids(int $seriesid): array {
        global $DB;
        $rows = $DB->get_records_sql(
            "SELECT DISTINCT p.studentid
               FROM {local_prequran_live_session} s
               JOIN {local_prequran_live_participant} p ON p.sessionid = s.id
              WHERE s.seriesid = :seriesid
                AND p.role = :role
                AND p.status = :status
                AND p.studentid > 0
           ORDER BY p.studentid ASC",
            ['seriesid' => $seriesid, 'role' => 'student', 'status' => 'active']
        );

        $studentids = [];
        foreach ($rows as $row) {
            $studentids[(int)$row->studentid] = (int)$row->studentid;
        }
        return array_values($studentids);
    }

    private function series_ack_is_current(int $seriesid, int $studentid, int $parentid, int $latestchange): bool {
        global $DB;
        $ack = $DB->get_record('local_prequran_live_ack', [
            'seriesid' => $seriesid,
            'studentid' => $studentid,
            'parentid' => $parentid,
        ]);
        return $ack
            && (string)$ack->ack_status === 'acknowledged'
            && (int)$ack->acknowledgedat >= $latestchange;
    }

    private function ensure_series_ack_record(int $seriesid, int $studentid, int $parentid, int $latestchange) {
        global $DB;

        $ack = $DB->get_record('local_prequran_live_ack', [
            'seriesid' => $seriesid,
            'studentid' => $studentid,
            'parentid' => $parentid,
        ]);

        $now = time();
        if ($ack) {
            if ((int)$ack->lastchangeat < $latestchange || (string)$ack->ack_status === 'acknowledged') {
                $ack->ack_status = 'pending';
                $ack->lastchangeat = $latestchange;
                $ack->timemodified = $now;
                $DB->update_record('local_prequran_live_ack', $ack);
            }
            return $ack;
        }

        $ack = (object)[
            'seriesid' => $seriesid,
            'studentid' => $studentid,
            'parentid' => $parentid,
            'ack_status' => 'pending',
            'ack_message' => '',
            'acknowledgedat' => 0,
            'lastchangeat' => $latestchange,
            'remindedat' => 0,
            'timecreated' => $now,
            'timemodified' => $now,
        ];
        $ack->id = $DB->insert_record('local_prequran_live_ack', $ack);
        return $ack;
    }

    private function send_series_ack_parent_reminder($series, int $studentid, int $parentid, int $latestchange): void {
        global $DB;

        $seriesid = (int)$series->id;
        $sent = local_prequran_notify_user_live_update(
            0,
            $parentid,
            'Please acknowledge live class schedule change',
            'A ' . $this->brand_for_series($series) . ' recurring live class schedule changed. Please review and acknowledge the updated schedule.',
            new \moodle_url('/local/hubredirect/live_series_schedule.php', ['childid' => $studentid]),
            'Review live class schedule',
            'series_ack_auto_reminder',
            $studentid
        );

        if ($sent) {
            $now = time();
            $ack = $this->ensure_series_ack_record($seriesid, $studentid, $parentid, $latestchange);
            $ack->ack_status = 'pending';
            $ack->lastchangeat = $latestchange;
            $ack->remindedat = $now;
            $ack->timemodified = $now;
            $DB->update_record('local_prequran_live_ack', $ack);
            $this->mark_series_parent_attempted($seriesid, $parentid, 'series_ack_auto_reminder_sent', [
                'studentid' => $studentid,
                'seriesid' => $seriesid,
                'latestchange' => $latestchange,
                'series_title' => (string)$series->title,
            ]);
        } else {
            $this->mark_series_parent_attempted($seriesid, $parentid, 'series_ack_auto_reminder_skipped', [
                'studentid' => $studentid,
                'seriesid' => $seriesid,
                'latestchange' => $latestchange,
                'reason' => 'notification not sent',
            ]);
        }
    }

    private function send_series_ack_admin_escalation($series, int $studentid, int $parentid, int $latestchange): void {
        $seriesid = (int)$series->id;
        foreach (get_admins() as $admin) {
            local_prequran_notify_user_live_update(
                0,
                (int)$admin->id,
                'Parent schedule acknowledgement overdue',
                'A parent has not acknowledged a ' . $this->brand_for_series($series) . ' recurring live class schedule change.',
                new \moodle_url('/local/hubredirect/live_series.php'),
                'Open class series',
                'series_ack_admin_escalation',
                $studentid
            );
        }

        $this->mark_series_parent_attempted($seriesid, $parentid, 'series_ack_escalated_admin', [
            'studentid' => $studentid,
            'parentid' => $parentid,
            'seriesid' => $seriesid,
            'latestchange' => $latestchange,
            'series_title' => (string)$series->title,
        ]);
    }

    private function maybe_mark_series_skip(int $seriesid, int $latestchange, string $action, array $details): void {
        if ($this->audit_exists_for_series_since($seriesid, $seriesid, $action, $latestchange)) {
            return;
        }
        $this->mark_series_attempted($seriesid, $action, $details + ['seriesid' => $seriesid, 'latestchange' => $latestchange]);
    }

    private function auto_flag_serious_quality_issues(): void {
        global $DB;

        $sessions = $DB->get_records_sql(
            "SELECT id, title, teacherid, qa_status, qa_score, leadership_review_status
               FROM {local_prequran_live_session}
              WHERE status <> :cancelled
                AND qa_status = :serious
                AND qa_reviewedat > 0
                AND leadership_review_status = :none
           ORDER BY qa_reviewedat DESC, id DESC",
            ['cancelled' => 'cancelled', 'serious' => 'serious_issue', 'none' => 'none'],
            0,
            50
        );

        foreach ($sessions as $session) {
            $this->auto_flag_leadership_review($session, 'SERIOUS_ISSUE', 'QA review marked this class as a serious issue.');
        }
    }

    private function auto_flag_overdue_coaching(): void {
        global $DB;

        $sessions = $DB->get_records_sql(
            "SELECT id, title, teacherid, qa_status, qa_score, qa_coaching_status, qa_coaching_due_date, leadership_review_status
               FROM {local_prequran_live_session}
              WHERE status <> :cancelled
                AND qa_coaching_status IN ('assigned', 'acknowledged')
                AND qa_coaching_due_date > 0
                AND qa_coaching_due_date < :nowtime
                AND leadership_review_status = :none
           ORDER BY qa_coaching_due_date ASC, id DESC",
            ['cancelled' => 'cancelled', 'nowtime' => time(), 'none' => 'none'],
            0,
            50
        );

        foreach ($sessions as $session) {
            $reason = 'Teacher QA coaching is overdue.';
            if (!empty($session->qa_coaching_due_date)) {
                $reason .= ' Due date: ' . userdate((int)$session->qa_coaching_due_date, get_string('strftimedatetimeshort')) . '.';
            }
            $this->auto_flag_leadership_review($session, 'OVERDUE_COACHING', $reason);
        }
    }

    private function auto_flag_teacher_quality_patterns(): void {
        global $DB;

        $now = time();
        $teachers = $DB->get_records_sql(
            "SELECT teacherid,
                    COUNT(1) AS reviewed_sessions,
                    ROUND(AVG(qa_score), 0) AS avg_score,
                    SUM(CASE WHEN qa_status = 'needs_coaching' THEN 1 ELSE 0 END) AS needs_coaching_count,
                    SUM(CASE WHEN qa_status = 'serious_issue' THEN 1 ELSE 0 END) AS serious_issue_count
               FROM {local_prequran_live_session}
              WHERE status <> :cancelled
                AND qa_status <> :notreviewed
                AND qa_reviewedat > 0
                AND scheduled_start >= :fromtime
           GROUP BY teacherid
             HAVING (ROUND(AVG(qa_score), 0) < 75 AND COUNT(1) >= 2)
                 OR SUM(CASE WHEN qa_status = 'needs_coaching' THEN 1 ELSE 0 END) >= 2
           ORDER BY serious_issue_count DESC, avg_score ASC, needs_coaching_count DESC",
            [
                'cancelled' => 'cancelled',
                'notreviewed' => 'not_reviewed',
                'fromtime' => $now - (90 * DAYSECS),
            ],
            0,
            100
        );

        foreach ($teachers as $teacher) {
            $reasoncode = 'LOW_SCORE_TREND';
            $reason = 'Teacher average QA score is below 75% across recent reviewed sessions.';
            if ((int)$teacher->needs_coaching_count >= 2) {
                $reasoncode = 'REPEATED_COACHING';
                $reason = 'Teacher has repeated sessions marked as needs coaching.';
            }
            if ((int)$teacher->avg_score < 75 && (int)$teacher->reviewed_sessions >= 2 && (int)$teacher->needs_coaching_count >= 2) {
                $reasoncode = 'LOW_SCORE_AND_REPEATED_COACHING';
                $reason = 'Teacher has a low QA score trend and repeated needs-coaching reviews.';
            }

            $session = $DB->get_record_sql(
                "SELECT id, title, teacherid, qa_status, qa_score, leadership_review_status
                   FROM {local_prequran_live_session}
                  WHERE teacherid = :teacherid
                    AND status <> :cancelled
                    AND qa_status <> :notreviewed
                    AND qa_reviewedat > 0
                    AND scheduled_start >= :fromtime
                    AND leadership_review_status = :none
               ORDER BY qa_reviewedat DESC, id DESC",
                [
                    'teacherid' => (int)$teacher->teacherid,
                    'cancelled' => 'cancelled',
                    'notreviewed' => 'not_reviewed',
                    'fromtime' => $now - (90 * DAYSECS),
                    'none' => 'none',
                ],
                IGNORE_MULTIPLE
            );

            if (!$session) {
                if (!$this->audit_exists(0, (int)$teacher->teacherid, 'leadership_review_auto_skipped')) {
                    $this->mark_attempted(0, (int)$teacher->teacherid, 'leadership_review_auto_skipped', [
                        'teacherid' => (int)$teacher->teacherid,
                        'reasoncode' => $reasoncode,
                        'reason' => 'No unflagged session was available for this teacher pattern.',
                        'reviewed_sessions' => (int)$teacher->reviewed_sessions,
                        'avg_score' => (int)$teacher->avg_score,
                        'needs_coaching_count' => (int)$teacher->needs_coaching_count,
                    ]);
                }
                continue;
            }

            $this->auto_flag_leadership_review($session, $reasoncode, $reason, [
                'reviewed_sessions' => (int)$teacher->reviewed_sessions,
                'avg_score' => (int)$teacher->avg_score,
                'needs_coaching_count' => (int)$teacher->needs_coaching_count,
            ]);
        }
    }

    private function auto_flag_leadership_review($session, string $reasoncode, string $reason, array $extra = []): void {
        global $DB;

        $sessionid = (int)$session->id;
        if ($sessionid <= 0 || $this->audit_exists_for_session($sessionid, 'leadership_review_auto_flagged')) {
            return;
        }

        $now = time();
        $session->leadership_review_status = 'flagged';
        $session->leadership_review_reason = $reason;
        $session->leadership_review_notes = trim((string)($session->leadership_review_notes ?? ''));
        $session->leadership_reviewby = 0;
        $session->leadership_reviewat = $now;
        $session->leadership_clearedby = 0;
        $session->leadership_clearedat = 0;
        $session->timemodified = $now;
        $DB->update_record('local_prequran_live_session', $session);

        $details = $extra + [
            'reasoncode' => $reasoncode,
            'reason' => $reason,
            'teacherid' => (int)$session->teacherid,
            'qa_status' => (string)($session->qa_status ?? ''),
            'qa_score' => (int)($session->qa_score ?? 0),
        ];
        $this->mark_session_attempted($sessionid, 'leadership_review_auto_flagged', $details);
        $this->notify_admins_about_leadership_alert($session, $reasoncode, $reason, $details);
    }

    private function notify_admins_about_leadership_alert($session, string $reasoncode, string $reason, array $details): void {
        $sessionid = (int)$session->id;
        foreach (get_admins() as $admin) {
            $action = 'leadership_review_admin_notified';
            if ($this->audit_exists($sessionid, (int)$admin->id, $action)) {
                continue;
            }

            local_prequran_notify_user_live_update(
                $sessionid,
                (int)$admin->id,
                'Leadership QA review flagged',
                'A ' . $this->brand_for_session($session) . ' live class was automatically flagged for leadership review: "' . (string)$session->title . '". Reason: ' . $reason,
                new \moodle_url('/local/hubredirect/live_quality.php', ['sessionid' => $sessionid]),
                'Open leadership review',
                'live_leadership_review_alert'
            );
            $this->mark_attempted($sessionid, (int)$admin->id, $action, $details + [
                'role' => 'admin',
                'reasoncode' => $reasoncode,
            ]);
        }
    }
}
