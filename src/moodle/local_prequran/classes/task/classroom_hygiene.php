<?php
// Classroom hygiene — the nightly sweep for everything the session lifecycle
// silently loses (best practice: a classroom incident is DETECTED, not
// discovered weeks later):
//
// 1) NO-SHOWS. A session nobody ever started (teacher never built the BBB
//    room) stays 'scheduled' forever — the awaiting_review cron only touches
//    'live' sessions. This sweep moves ended 'scheduled' sessions into
//    awaiting_review (enforce), audits 'session_no_show', and tells admins.
// 2) STALE REVIEWS. The teacher/admin post-session nags are one-shot inside
//    1h-24h / 1-2d windows; after that, silence. Sessions still awaiting_review
//    3+ days after ending are re-flagged weekly.
// 3) ZERO-ATTENDANCE ended sessions (completed/awaiting_review with no
//    attendance rows at all).
// 4) LATE STARTS: bbb_create_time more than 10 minutes after scheduled_start
//    (report-only; the only teacher-punctuality signal that exists).
// 5) LATE CANCELS per teacher, 30 days (from the session_cancelled_late audits
//    the live-review handler now writes) — report-only.
// 6) GRADING SLA: homework submissions sitting 'submitted' longer than
//    grading_sla_days — the teacher gets a reminder (previously the backlog
//    was invisible; only students/parents were ever reminded).
//
// INERT until classroom_hygiene_mode is set: '' (off) | 'report' | 'enforce'.

namespace local_prequran\task;

defined('MOODLE_INTERNAL') || die();

class classroom_hygiene extends \core\task\scheduled_task {

    public function get_name(): string {
        return get_string('task_classroom_hygiene', 'local_prequran');
    }

    public function execute(): void {
        global $DB;

        $modesetting = trim((string)get_config('local_prequran', 'classroom_hygiene_mode'));
        if ($modesetting === '') {
            mtrace('Classroom hygiene skipped: classroom_hygiene_mode is off.');
            return;
        }
        $enforce = $modesetting === 'enforce';
        $mode = $enforce ? 'enforce' : 'report';
        $now = time();
        $adminlines = [];

        if (!$this->table_exists('local_prequran_live_session')) {
            mtrace('Classroom hygiene skipped: live session table missing.');
            return;
        }

        // 1) No-shows: ended sessions that never went live.
        $noshows = $DB->get_records_select('local_prequran_live_session',
            "status = 'scheduled' AND scheduled_end > 0 AND scheduled_end < :cutoff",
            ['cutoff' => $now - HOURSECS], 'scheduled_start ASC', 'id,title,teacherid,scheduled_start,workspaceid', 0, 200);
        foreach ($noshows as $session) {
            if ($enforce) {
                $DB->update_record('local_prequran_live_session', (object)[
                    'id' => (int)$session->id, 'status' => 'awaiting_review', 'timemodified' => $now,
                ]);
                $this->live_audit((int)$session->id, 'session_no_show', (int)$session->teacherid, [
                    'title' => (string)$session->title, 'scheduled_start' => (int)$session->scheduled_start,
                ]);
                mtrace("  [{$mode}] NO-SHOW: session {$session->id} '{$session->title}' (teacher {$session->teacherid}, " . userdate((int)$session->scheduled_start) . ') -> awaiting_review');
            } else {
                mtrace("  [{$mode}] no-show: session {$session->id} '{$session->title}' (teacher {$session->teacherid}) never started");
            }
        }
        if ($noshows) {
            $adminlines[] = count($noshows) . ' session(s) ended without ever being started (no-show).';
        }

        // 2) Stale awaiting_review (>3 days), re-flagged weekly.
        $stale = $DB->get_records_select('local_prequran_live_session',
            "status = 'awaiting_review' AND scheduled_end > 0 AND scheduled_end < :cutoff",
            ['cutoff' => $now - (3 * DAYSECS)], 'scheduled_end ASC', 'id,title,teacherid,scheduled_end', 0, 200);
        $staleflagged = 0;
        foreach ($stale as $session) {
            $recent = $this->table_exists('local_prequran_live_audit')
                && $DB->record_exists_select('local_prequran_live_audit',
                    "action = 'stale_review_flagged' AND sessionid = :sid AND timecreated > :since",
                    ['sid' => (int)$session->id, 'since' => $now - (7 * DAYSECS)]);
            if ($recent) {
                continue;
            }
            if ($enforce) {
                $this->live_audit((int)$session->id, 'stale_review_flagged', (int)$session->teacherid, [
                    'title' => (string)$session->title, 'ended' => (int)$session->scheduled_end,
                ]);
                $staleflagged++;
            }
            mtrace("  [{$mode}] stale review: session {$session->id} '{$session->title}' ended " . userdate((int)$session->scheduled_end) . ' and is still awaiting review');
        }
        if ($stale) {
            $adminlines[] = count($stale) . ' session(s) still awaiting review 3+ days after ending.';
        }

        // 3) Zero-attendance ended sessions (last 7 days, once each).
        if ($this->table_exists('local_prequran_live_attendance')) {
            $zeroatt = $DB->get_records_sql(
                "SELECT ls.id, ls.title, ls.teacherid
                   FROM {local_prequran_live_session} ls
                  WHERE ls.status IN ('completed', 'awaiting_review')
                    AND ls.scheduled_end > :weekago AND ls.scheduled_end < :dayago
                    AND NOT EXISTS (SELECT 1 FROM {local_prequran_live_attendance} a WHERE a.sessionid = ls.id)",
                ['weekago' => $now - (7 * DAYSECS), 'dayago' => $now - DAYSECS], 0, 100);
            foreach ($zeroatt as $session) {
                $already = $this->table_exists('local_prequran_live_audit')
                    && $DB->record_exists('local_prequran_live_audit',
                        ['action' => 'session_zero_attendance', 'sessionid' => (int)$session->id]);
                if ($already) {
                    continue;
                }
                if ($enforce) {
                    $this->live_audit((int)$session->id, 'session_zero_attendance', (int)$session->teacherid,
                        ['title' => (string)$session->title]);
                }
                mtrace("  [{$mode}] zero attendance: session {$session->id} '{$session->title}' ended with no attendance recorded");
            }
            if ($zeroatt) {
                $adminlines[] = count($zeroatt) . ' ended session(s) with zero attendance rows.';
            }
        }

        // 4) Late starts (report-only): BBB room built >10 min after start, last 7d.
        $latestarts = $DB->get_records_select('local_prequran_live_session',
            "bbb_created = 1 AND bbb_create_time > 0 AND scheduled_start > :weekago
             AND bbb_create_time > scheduled_start + :grace",
            ['weekago' => $now - (7 * DAYSECS), 'grace' => 10 * MINSECS], '', 'id,title,teacherid,scheduled_start,bbb_create_time', 0, 100);
        foreach ($latestarts as $session) {
            $latemin = (int)round(((int)$session->bbb_create_time - (int)$session->scheduled_start) / 60);
            mtrace("  [info] late start: session {$session->id} '{$session->title}' (teacher {$session->teacherid}) started {$latemin} min late");
        }

        // 5) Late cancellations per teacher, last 30 days (report-only).
        if ($this->table_exists('local_prequran_live_audit')) {
            $latecancels = $DB->get_records_sql(
                "SELECT actorid, COUNT(1) AS n
                   FROM {local_prequran_live_audit}
                  WHERE action IN ('session_cancelled_late', 'session_rescheduled_late') AND timecreated > :since
               GROUP BY actorid",
                ['since' => $now - (30 * DAYSECS)]);
            foreach ($latecancels as $row) {
                mtrace("  [info] late cancel/reschedule: user {$row->actorid} made {$row->n} short-notice change(s) in 30d");
            }
        }

        // 6) Grading SLA: submissions awaiting review beyond the SLA.
        $sladays = (int)get_config('local_prequran', 'grading_sla_days');
        if ($sladays < 1) {
            $sladays = 3;
        }
        if ($this->table_exists('local_prequran_homework') && $this->table_exists('local_prequran_homework_sub')) {
            $backlog = $DB->get_records_sql(
                "SELECT h.createdby AS teacherid, COUNT(1) AS n, MIN(hs.submittedat) AS oldest
                   FROM {local_prequran_homework_sub} hs
                   JOIN {local_prequran_homework} h ON h.id = hs.homeworkid
                  WHERE hs.status = 'submitted' AND hs.submittedat > 0 AND hs.submittedat < :cutoff
                    AND h.status = 'published'
               GROUP BY h.createdby",
                ['cutoff' => $now - ($sladays * DAYSECS)]);
            foreach ($backlog as $row) {
                $teacherid = (int)$row->teacherid;
                $oldestdays = (int)floor(($now - (int)$row->oldest) / DAYSECS);
                if ($enforce && $teacherid > 0) {
                    $recent = $this->table_exists('local_prequran_live_audit')
                        && $DB->record_exists_select('local_prequran_live_audit',
                            "action = 'grading_sla_reminder' AND targetid = :tid AND timecreated > :since",
                            ['tid' => $teacherid, 'since' => $now - (3 * DAYSECS)]);
                    if (!$recent) {
                        $this->send_message($teacherid,
                            'Homework awaiting grading: ' . $row->n . ' submission(s)',
                            'You have ' . $row->n . ' homework submission(s) waiting for review — the oldest was submitted ' . $oldestdays
                            . ' day(s) ago. Students see "Awaiting review" until you grade or return them. Open Teacher Homework to clear the queue.');
                        $this->live_audit(0, 'grading_sla_reminder', $teacherid, ['count' => (int)$row->n, 'oldest_days' => $oldestdays]);
                        mtrace("  [{$mode}] grading SLA reminder sent: teacher {$teacherid}, {$row->n} submission(s), oldest {$oldestdays}d");
                    }
                } else {
                    mtrace("  [{$mode}] grading backlog: teacher {$teacherid} has {$row->n} submission(s) past the {$sladays}d SLA (oldest {$oldestdays}d)");
                }
            }
        }

        // Admin summary (enforce only, when something needs eyes).
        if ($enforce && $adminlines) {
            $body = "Classroom hygiene findings:\n\n- " . implode("\n- ", $adminlines)
                . "\n\nDetails are in the task log and the live audit trail (session_no_show / stale_review_flagged / session_zero_attendance).";
            foreach (get_admins() as $admin) {
                $this->send_message((int)$admin->id, 'Classroom hygiene: attention needed', $body);
            }
        }

        set_config('lastrun_classroom_hygiene', $now, 'local_prequran');
        mtrace('Classroom hygiene (' . $mode . '): ' . count($noshows) . ' no-show(s), ' . count($stale) . " stale review(s)"
            . ($enforce ? " ({$staleflagged} newly flagged)" : '') . ', SLA ' . $sladays . 'd.');
    }

    // ---- helpers ----------------------------------------------------------

    private function live_audit(int $sessionid, string $action, int $targetid, array $details): void {
        global $DB;
        if (!$this->table_exists('local_prequran_live_audit')) {
            return;
        }
        try {
            $DB->insert_record('local_prequran_live_audit', (object)[
                'sessionid' => $sessionid,
                'actorid' => 0, // Scheduled task.
                'action' => substr($action, 0, 80),
                'targettype' => 'session',
                'targetid' => $targetid,
                'details' => json_encode(['source' => 'classroom_hygiene'] + $details, JSON_UNESCAPED_SLASHES),
                'timecreated' => time(),
            ]);
        } catch (\Throwable $e) {
            // Audit must never break the sweep.
        }
    }

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

    private $tablecache = [];

    private function table_exists(string $table): bool {
        global $DB;
        if (!array_key_exists($table, $this->tablecache)) {
            $this->tablecache[$table] = $DB->get_manager()->table_exists(new \xmldb_table($table));
        }
        return $this->tablecache[$table];
    }
}
