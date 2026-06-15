-- Group 3 verification: navigation and UX cleanup.
-- Replace mdlgx_ with your Moodle database prefix if needed.

-- 1) Admin navigation target readiness: operational data behind the primary menu sections.
SELECT 'today_sessions' AS metric,
       COUNT(*) AS value
FROM mdlgx_local_prequran_live_session
WHERE scheduled_start >= UNIX_TIMESTAMP(CURDATE())
  AND scheduled_start < UNIX_TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 1 DAY))
  AND status <> 'cancelled'
UNION ALL
SELECT 'upcoming_7_days',
       COUNT(*)
FROM mdlgx_local_prequran_live_session
WHERE scheduled_start >= UNIX_TIMESTAMP(NOW())
  AND scheduled_start < UNIX_TIMESTAMP(DATE_ADD(NOW(), INTERVAL 7 DAY))
  AND status <> 'cancelled'
UNION ALL
SELECT 'sessions_needing_review',
       COUNT(*)
FROM mdlgx_local_prequran_live_session
WHERE status IN ('awaiting_review', 'needs_review')
UNION ALL
SELECT 'recording_review_queue',
       COUNT(*)
FROM mdlgx_local_prequran_live_recording
WHERE status = 'available'
  AND (reviewedat = 0 OR visible_to_parent = 0)
UNION ALL
SELECT 'open_followups',
       COUNT(*)
FROM mdlgx_local_prequran_live_note
WHERE followup_status <> 'none'
  AND followup_resolved = 0
UNION ALL
SELECT 'qa_queue',
       COUNT(*)
FROM mdlgx_local_prequran_live_session
WHERE qa_status IN ('not_reviewed', 'needs_coaching', 'serious_issue')
  AND status <> 'cancelled'
UNION ALL
SELECT 'teacher_capacity_inputs',
       COUNT(*)
FROM mdlgx_local_prequran_live_availability
WHERE status = 'active';

-- 2) Dashboard role-routing data: teacher assignments and parent links.
SELECT 'active_teacher_student_assignments' AS metric,
       COUNT(*) AS value
FROM mdlgx_local_prequran_teacher_student
WHERE status = 'active'
UNION ALL
SELECT 'guardian_student_links',
       COUNT(*)
FROM mdlgx_local_prequran_comm_consent
UNION ALL
SELECT 'parent_message_threads',
       COUNT(*)
FROM mdlgx_local_prequran_comm_thread;

-- 3) Pages that depend on context should be opened from queue rows, not as generic menu destinations.
SELECT 'context_required_pages' AS check_name,
       'live_review.php, live_monitor.php, live_quality.php, live_followup_message.php, live_parent_trust_purge_evidence.php' AS pages,
       'Open these from session, follow-up, or purge-history rows.' AS expected_navigation;
