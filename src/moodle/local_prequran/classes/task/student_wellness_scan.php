<?php
// Student wellness scan — closes the "everything is passive" gap on the
// student side (best practice: at-risk detection and homework follow-up are
// AUTOMATED, not a report someone remembers to open):
//
// 1) AT-RISK SCAN (student_risk_mode). Nightly signals per active workspace
//    student: login inactivity (risk_inactive_days), unexcused absences in
//    the last 30 days (risk_absence_count), and missing homework
//    (risk_missing_homework). Report mode logs; enforce mode also writes an
//    'at_risk_flagged' row into local_prequran_live_audit (deduped 7 days),
//    which surfaces in the existing at-risk report's audit history.
//
// 2) HOMEWORK REMINDERS (homework_reminder_mode). Published homework due in
//    the next 24h (status assigned/in_progress) → reminder to the student and
//    their linked parents; homework that BECAME overdue in the last 48h →
//    missed notice. Sends are deduped via live_audit rows and use the
//    existing 'live_session_update' message provider (no new provider —
//    recipients control it with the same Moodle preference). Parent fan-out
//    uses local_prequran_notify_parent_ids_for_student, which excludes
//    revoked links.
//
// INERT until configured: each phase runs only when its mode setting is set —
// '' (off, default) | 'report' | 'enforce'. Start with 'report'.

namespace local_prequran\task;

defined('MOODLE_INTERNAL') || die();

class student_wellness_scan extends \core\task\scheduled_task {

    public function get_name(): string {
        return get_string('task_student_wellness_scan', 'local_prequran');
    }

    public function execute(): void {
        $riskmode = trim((string)get_config('local_prequran', 'student_risk_mode'));
        $homeworkmode = trim((string)get_config('local_prequran', 'homework_reminder_mode'));

        if ($riskmode === '' && $homeworkmode === '') {
            mtrace('Student wellness scan skipped: both mode settings are off.');
            return;
        }
        if ($riskmode !== '') {
            $this->scan_at_risk($riskmode === 'enforce');
        }
        if ($homeworkmode !== '') {
            $this->homework_reminders($homeworkmode === 'enforce');
        }
        $digestmode = trim((string)get_config('local_prequran', 'parent_digest_mode'));
        if ($digestmode !== '') {
            $this->parent_weekly_digest($digestmode === 'enforce');
        }
        // Task-health stamp (see admin access review in enrolment_reconcile).
        set_config('lastrun_student_wellness_scan', time(), 'local_prequran');
    }

    // ---- phase 3: weekly per-child parent digest --------------------------

    /**
     * The push summary parents never had (only a staff ops digest existed):
     * once a week (parent_digest_day, ISO 1=Mon..7=Sun), each student's linked
     * parents receive a one-message snapshot — upcoming live classes (7d),
     * attendance last 7d, homework due next 7d + currently missing, and new
     * parent-visible teacher notes. Fan-out uses
     * local_prequran_notify_parent_ids_for_student, so revoked links and the
     * parent_email_enabled opt-out are honored automatically. Deduped per
     * student per 6 days via live_audit parent_digest_sent rows.
     */
    private function parent_weekly_digest(bool $enforce): void {
        global $CFG, $DB;

        $mode = $enforce ? 'enforce' : 'report';
        $day = (int)get_config('local_prequran', 'parent_digest_day');
        if ($day < 1 || $day > 7) {
            $day = 1; // Monday.
        }
        if ((int)date('N') !== $day) {
            mtrace('Parent digest (' . $mode . '): not digest day (runs on ISO day ' . $day . ').');
            return;
        }
        if (!$this->table_exists('local_prequran_workspace_member')) {
            mtrace('Parent digest skipped: workspace member table missing.');
            return;
        }
        require_once($CFG->dirroot . '/local/prequran/notificationlib.php');

        $now = time();
        $weekago = $now - (7 * DAYSECS);
        $weekahead = $now + (7 * DAYSECS);
        $sent = 0; $students = 0;

        $rows = $DB->get_records_sql(
            "SELECT DISTINCT wm.userid
               FROM {local_prequran_workspace_member} wm
               JOIN {user} u ON u.id = wm.userid AND u.deleted = 0 AND u.suspended = 0
              WHERE wm.workspace_role = 'student' AND wm.status = 'active'"
        );
        foreach ($rows as $row) {
            $studentid = (int)$row->userid;
            $parents = function_exists('local_prequran_notify_parent_ids_for_student')
                ? local_prequran_notify_parent_ids_for_student($studentid) : [];
            if (!$parents) {
                continue;
            }
            $students++;
            if ($this->table_exists('local_prequran_live_audit')
                    && $DB->record_exists_select('local_prequran_live_audit',
                        "action = 'parent_digest_sent' AND targetid = :sid AND timecreated > :since",
                        ['sid' => $studentid, 'since' => $now - (6 * DAYSECS)])) {
                continue; // Already sent this week.
            }

            $lines = [];
            if ($this->table_exists('local_prequran_live_session') && $this->table_exists('local_prequran_live_participant')) {
                $upcoming = (int)$DB->count_records_sql(
                    "SELECT COUNT(1) FROM {local_prequran_live_session} ls
                       JOIN {local_prequran_live_participant} p ON p.sessionid = ls.id
                      WHERE (p.userid = :sid OR p.studentid = :sid2) AND p.status = 'active'
                        AND ls.status = 'scheduled' AND ls.scheduled_start > :now AND ls.scheduled_start < :ahead",
                    ['sid' => $studentid, 'sid2' => $studentid, 'now' => $now, 'ahead' => $weekahead]);
                $lines[] = 'Live classes in the next 7 days: ' . $upcoming;
            }
            if ($this->table_exists('local_prequran_live_attendance')) {
                $present = (int)$DB->count_records_select('local_prequran_live_attendance',
                    "studentid = :sid AND timecreated > :since AND attendance_status IN ('present', 'late', 'makeup_completed')",
                    ['sid' => $studentid, 'since' => $weekago]);
                $absent = (int)$DB->count_records_select('local_prequran_live_attendance',
                    "studentid = :sid AND timecreated > :since AND attendance_status = 'absent'",
                    ['sid' => $studentid, 'since' => $weekago]);
                if ($present + $absent > 0) {
                    $lines[] = 'Attendance last 7 days: ' . $present . ' attended, ' . $absent . ' missed';
                }
            }
            if ($this->table_exists('local_prequran_homework') && $this->table_exists('local_prequran_homework_sub')) {
                $duesoon = (int)$DB->count_records_sql(
                    "SELECT COUNT(1) FROM {local_prequran_homework_sub} hs
                       JOIN {local_prequran_homework} h ON h.id = hs.homeworkid
                      WHERE hs.studentid = :sid AND hs.status IN ('assigned', 'in_progress')
                        AND h.status = 'published' AND h.duedate > :now AND h.duedate < :ahead",
                    ['sid' => $studentid, 'now' => $now, 'ahead' => $weekahead]);
                $missing = (int)$DB->count_records_sql(
                    "SELECT COUNT(1) FROM {local_prequran_homework_sub} hs
                       JOIN {local_prequran_homework} h ON h.id = hs.homeworkid
                      WHERE hs.studentid = :sid AND hs.status IN ('assigned', 'in_progress', 'returned')
                        AND h.status = 'published' AND h.duedate > 0 AND h.duedate < :now",
                    ['sid' => $studentid, 'now' => $now]);
                $lines[] = 'Homework due in the next 7 days: ' . $duesoon . ($missing > 0 ? ' — ' . $missing . ' item(s) OVERDUE' : '');
            }
            if ($this->table_exists('local_prequran_live_note')) {
                $notes = (int)$DB->count_records_select('local_prequran_live_note',
                    'studentid = :sid AND visible_to_parent = 1 AND timecreated > :since',
                    ['sid' => $studentid, 'since' => $weekago]);
                if ($notes > 0) {
                    $lines[] = 'New teacher notes this week: ' . $notes . ' — read them in your parent hub';
                }
            }

            $studentuser = \core_user::get_user($studentid);
            $studentname = $studentuser ? fullname($studentuser) : ('student #' . $studentid);
            $subject = 'Weekly summary for ' . $studentname;
            $body = "Here is this week's snapshot for {$studentname}:\n\n- " . implode("\n- ", $lines)
                . "\n\nOpen your parent hub for details, summaries and recordings.";

            if ($enforce) {
                foreach ($parents as $pid) {
                    $this->send_message((int)$pid, $subject, $body);
                }
                $this->live_audit('parent_digest_sent', $studentid, ['parents' => count($parents), 'lines' => $lines]);
                $sent++;
                mtrace("  [{$mode}] digest sent for student {$studentid} to " . count($parents) . ' parent(s)');
            } else {
                mtrace("  [{$mode}] WOULD send digest for student {$studentid} to " . count($parents) . ' parent(s): ' . implode(' | ', $lines));
            }
        }
        mtrace('Parent digest (' . $mode . '): ' . $students . ' students with linked parents' . ($enforce ? ", {$sent} digests sent" : '') . '.');
    }

    // ---- phase 1: at-risk early warning -----------------------------------

    private function scan_at_risk(bool $enforce): void {
        global $DB;

        if (!$this->table_exists('local_prequran_workspace_member')) {
            mtrace('At-risk scan skipped: workspace member table missing.');
            return;
        }
        $mode = $enforce ? 'enforce' : 'report';
        $now = time();
        $inactivedays = $this->setting_int('risk_inactive_days', 14);
        $absencecount = $this->setting_int('risk_absence_count', 3);
        $missinghomework = $this->setting_int('risk_missing_homework', 3);

        $students = $DB->get_records_sql(
            "SELECT DISTINCT wm.userid, wm.workspaceid
               FROM {local_prequran_workspace_member} wm
               JOIN {user} u ON u.id = wm.userid AND u.deleted = 0 AND u.suspended = 0
              WHERE wm.workspace_role = 'student' AND wm.status = 'active'"
        );

        $flagged = 0; $checked = 0;
        foreach ($students as $s) {
            $studentid = (int)$s->userid;
            $checked++;
            $reasons = [];

            // Signal 1: login inactivity.
            $lastaccess = (int)$DB->get_field('user', 'lastaccess', ['id' => $studentid]);
            if ($lastaccess > 0 && $lastaccess < $now - ($inactivedays * DAYSECS)) {
                $reasons[] = 'no login for ' . (int)floor(($now - $lastaccess) / DAYSECS) . 'd';
            } else if ($lastaccess === 0) {
                $reasons[] = 'never logged in';
            }

            // Signal 2: unexcused absences in the last 30 days.
            if ($this->table_exists('local_prequran_live_attendance')) {
                $absences = $DB->count_records_select('local_prequran_live_attendance',
                    "studentid = :sid AND attendance_status = 'absent' AND timecreated > :since",
                    ['sid' => $studentid, 'since' => $now - (30 * DAYSECS)]);
                if ($absences >= $absencecount) {
                    $reasons[] = $absences . ' absences in 30d';
                }
            }

            // Signal 3: missing homework (past due, never submitted).
            if ($this->table_exists('local_prequran_homework') && $this->table_exists('local_prequran_homework_sub')) {
                $missing = $DB->count_records_sql(
                    "SELECT COUNT(1)
                       FROM {local_prequran_homework_sub} hs
                       JOIN {local_prequran_homework} h ON h.id = hs.homeworkid
                      WHERE hs.studentid = :sid AND hs.status IN ('assigned', 'in_progress', 'returned')
                        AND h.status = 'published' AND h.duedate > 0 AND h.duedate < :now",
                    ['sid' => $studentid, 'now' => $now]);
                if ($missing >= $missinghomework) {
                    $reasons[] = $missing . ' missing homework';
                }
            }

            // Signal 4: grade decline — a published course grade below the
            // concern threshold OR a drop of risk_grade_decline points against
            // the student's prior published grade in the same offering. Reads
            // course_grade (published); skipped when the setting is 0.
            $declinethreshold = $this->setting_int('risk_grade_decline', 0);
            $lowthreshold = $this->setting_int('risk_grade_low', 0);
            if (($declinethreshold > 0 || $lowthreshold > 0) && $this->table_exists('local_prequran_course_grade')) {
                $grades = $DB->get_records_select('local_prequran_course_grade',
                    "studentid = :sid AND status = 'published'", ['sid' => $studentid], 'offeringid ASC, timemodified DESC',
                    'id,offeringid,final_percent,timemodified', 0, 200);
                $latestbyoffering = [];
                foreach ($grades as $g) {
                    $oid = (int)$g->offeringid;
                    $pct = (float)preg_replace('/[^0-9.]/', '', (string)$g->final_percent);
                    if (!isset($latestbyoffering[$oid])) {
                        $latestbyoffering[$oid] = ['latest' => $pct, 'prev' => null];
                        if ($lowthreshold > 0 && $pct > 0 && $pct < $lowthreshold) {
                            $reasons[] = 'low grade ' . round($pct) . '%';
                        }
                    } else if ($latestbyoffering[$oid]['prev'] === null) {
                        $latestbyoffering[$oid]['prev'] = $pct;
                        $drop = $latestbyoffering[$oid]['latest'] - $pct;
                        if ($declinethreshold > 0 && $drop >= $declinethreshold) {
                            $reasons[] = 'grade dropped ' . round($drop) . 'pts';
                        }
                    }
                }
            }

            if (!$reasons) {
                continue;
            }
            $reasontext = implode('; ', $reasons);
            if ($enforce) {
                // Dedup: one flag per student per 7 days.
                $recent = $DB->record_exists_select('local_prequran_live_audit',
                    "action = 'at_risk_flagged' AND targetid = :sid AND timecreated > :since",
                    ['sid' => $studentid, 'since' => $now - (7 * DAYSECS)]);
                if (!$recent) {
                    $this->live_audit('at_risk_flagged', $studentid, [
                        'workspaceid' => (int)$s->workspaceid, 'reasons' => $reasons,
                    ]);
                    $flagged++;
                }
                mtrace("  [{$mode}] AT RISK student {$studentid}: {$reasontext}");
            } else {
                mtrace("  [{$mode}] at-risk student {$studentid}: {$reasontext}");
            }
        }
        mtrace('At-risk scan (' . $mode . '): ' . $checked . ' active students checked' . ($enforce ? ", {$flagged} newly flagged" : '') . '.');
    }

    // ---- phase 2: homework due/missed reminders ---------------------------

    private function homework_reminders(bool $enforce): void {
        global $CFG, $DB;

        if (!$this->table_exists('local_prequran_homework') || !$this->table_exists('local_prequran_homework_sub')) {
            mtrace('Homework reminders skipped: homework tables missing.');
            return;
        }
        require_once($CFG->dirroot . '/local/prequran/notificationlib.php');

        $mode = $enforce ? 'enforce' : 'report';
        $now = time();
        $duereminded = 0; $missednoticed = 0;

        // Due within the next 24 hours, not yet submitted.
        $duesoon = $DB->get_records_sql(
            "SELECT hs.id AS subid, hs.studentid, h.id AS homeworkid, h.title, h.duedate
               FROM {local_prequran_homework_sub} hs
               JOIN {local_prequran_homework} h ON h.id = hs.homeworkid
              WHERE hs.status IN ('assigned', 'in_progress')
                AND h.status = 'published' AND h.duedate > :now AND h.duedate < :soon",
            ['now' => $now, 'soon' => $now + DAYSECS]);
        foreach ($duesoon as $row) {
            if ($this->already_sent('homework_reminder_sent', (int)$row->subid)) {
                continue;
            }
            $subject = 'Homework due soon: ' . (string)$row->title;
            $body = '"' . (string)$row->title . '" is due ' . userdate((int)$row->duedate) . '. Open your homework page to finish and submit it.';
            if ($enforce) {
                $this->notify_student_and_parents((int)$row->studentid, $subject, $body);
                $this->live_audit('homework_reminder_sent', (int)$row->subid, ['studentid' => (int)$row->studentid, 'homeworkid' => (int)$row->homeworkid]);
                $duereminded++;
            }
            mtrace("  [{$mode}] " . ($enforce ? 'reminded' : 'WOULD remind') . " student {$row->studentid}: due-soon '{$row->title}'");
        }

        // Became overdue within the last 48 hours (newly missed).
        $missed = $DB->get_records_sql(
            "SELECT hs.id AS subid, hs.studentid, h.id AS homeworkid, h.title, h.duedate
               FROM {local_prequran_homework_sub} hs
               JOIN {local_prequran_homework} h ON h.id = hs.homeworkid
              WHERE hs.status IN ('assigned', 'in_progress', 'returned')
                AND h.status = 'published' AND h.duedate > :since AND h.duedate < :now",
            ['since' => $now - (2 * DAYSECS), 'now' => $now]);
        foreach ($missed as $row) {
            if ($this->already_sent('homework_missed_sent', (int)$row->subid)) {
                continue;
            }
            $subject = 'Homework missed: ' . (string)$row->title;
            $body = '"' . (string)$row->title . '" was due ' . userdate((int)$row->duedate) . ' and has not been submitted yet. It can still be completed — please submit as soon as possible.';
            if ($enforce) {
                $this->notify_student_and_parents((int)$row->studentid, $subject, $body);
                $this->live_audit('homework_missed_sent', (int)$row->subid, ['studentid' => (int)$row->studentid, 'homeworkid' => (int)$row->homeworkid]);
                $missednoticed++;
            }
            mtrace("  [{$mode}] " . ($enforce ? 'notified' : 'WOULD notify') . " student {$row->studentid}: missed '{$row->title}'");
        }

        mtrace('Homework reminders (' . $mode . '): ' . count($duesoon) . ' due-soon, ' . count($missed) . ' newly missed' . ($enforce ? " ({$duereminded} reminded, {$missednoticed} missed notices sent)" : '') . '.');
    }

    /** Send to the student + every linked (non-revoked) parent. */
    private function notify_student_and_parents(int $studentid, string $subject, string $body): void {
        $recipients = [$studentid => $studentid];
        if (function_exists('local_prequran_notify_parent_ids_for_student')) {
            foreach (local_prequran_notify_parent_ids_for_student($studentid) as $pid) {
                $recipients[(int)$pid] = (int)$pid;
            }
        }
        foreach ($recipients as $recipientid) {
            $this->send_message($recipientid, $subject, $body);
        }
    }

    /**
     * Plain Moodle message via the existing live_session_update provider
     * (recipients manage it with the same notification preference; adding a
     * dedicated provider is deliberately avoided to keep the change surface
     * small — revisit if homework comms need separate opt-out).
     */
    private function send_message(int $recipientid, string $subject, string $body): void {
        $recipient = \core_user::get_user($recipientid);
        if (!$recipient || !empty($recipient->deleted) || !empty($recipient->suspended)) {
            return;
        }
        try {
            $message = new \core\message\message();
            $message->component = 'local_prequran';
            $message->name = 'live_session_update';
            $message->userfrom = \core_user::get_noreply_user();
            $message->userto = $recipient;
            $message->subject = $subject;
            $message->fullmessage = $body;
            $message->fullmessageformat = FORMAT_PLAIN;
            $message->fullmessagehtml = '';
            $message->smallmessage = $subject;
            $message->notification = 1;
            $message->courseid = SITEID;
            message_send($message);
        } catch (\Throwable $e) {
            mtrace('  message send failed for user ' . $recipientid . ': ' . $e->getMessage());
        }
    }

    // ---- helpers ----------------------------------------------------------

    private function already_sent(string $action, int $targetid): bool {
        global $DB;
        if (!$this->table_exists('local_prequran_live_audit')) {
            return false;
        }
        return $DB->record_exists('local_prequran_live_audit', ['action' => $action, 'targetid' => $targetid]);
    }

    private function live_audit(string $action, int $targetid, array $details): void {
        global $DB;
        if (!$this->table_exists('local_prequran_live_audit')) {
            return;
        }
        try {
            $DB->insert_record('local_prequran_live_audit', (object)[
                'sessionid' => 0,
                'actorid' => 0, // Scheduled task.
                'action' => substr($action, 0, 80),
                'targettype' => 'user',
                'targetid' => $targetid,
                'details' => json_encode(['source' => 'student_wellness_scan'] + $details, JSON_UNESCAPED_SLASHES),
                'timecreated' => time(),
            ]);
        } catch (\Throwable $e) {
            // Audit must never break the scan.
        }
    }

    private function setting_int(string $name, int $default): int {
        $value = get_config('local_prequran', $name);
        if ($value === false || $value === '') {
            return $default;
        }
        return max(1, (int)$value);
    }

    private $tablecache = [];

    private function table_exists(string $table): bool {
        global $DB;
        if (!array_key_exists($table, $this->tablecache)) {
            $this->tablecache[$table] = $DB->get_manager()->table_exists(new \xmldb_table($table));
        }
        return $this->tablecache[$table];
    }
}
