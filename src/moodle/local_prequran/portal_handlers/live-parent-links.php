<?php
// ---- report: live-parent-links (student parent-link management; read + write) --
// Ported from local_hubredirect/live_parent_links.php via
// live_parent_links_portallib (pqlpl_*). Included from portal_data.php AFTER
// token auth: $claims verified, $USER set to the token user, JSON exception
// handler installed, headers sent.
// GET  = the student parent-link rows exactly as the legacy page builds them
//        (guardian links + profile-only contacts + live-session consent), with
//        student/parent names decorated, plus the q/source filters the page uses.
// POST = do=link (the legacy "Create / Refresh Link" write VERBATIM: comm-consent
//        upsert + three live-consent upserts + optional student-profile parent
//        update + audit). confirm_sesskey() dropped: token auth replaces it.
//
// Not ported: the legacy ?export=csv download (a file-server response, not part
// of the JSON contract). There is no unlink/delete action on the legacy page.

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/live_parent_links_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

// -- entry access: legacy calls pqh_require_academy_operations(<message>) which
// -- funnels to pqh_access_denied; the API delivers the same message as 403. --
if (!pqh_can_manage_academy_operations($userid)) {
    pqpd_fail(403, 'Only academy operations users can view student parent links.');
}

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    $body = json_decode((string)file_get_contents('php://input'), true);
    $do = is_array($body) ? clean_param((string)($body['do'] ?? ''), PARAM_ALPHANUMEXT) : '';

    // -- write: link (legacy POST "Create / Refresh Link", verbatim) --
    if ($do === 'link') {
        $linkstudentid = (int)($body['link_studentid'] ?? 0);
        $linkparentid = (int)($body['link_parentid'] ?? 0);
        $linknotes = trim(clean_param((string)($body['link_notes'] ?? ''), PARAM_TEXT));
        $linkliveconsent = !empty($body['link_live_consent']) ? 1 : 0;
        $linkrecordingconsent = !empty($body['link_recording_consent']) ? 1 : 0;
        $linkupdateprofile = !empty($body['link_update_profile']) ? 1 : 0;

        $validationerror = '';
        $student = pqlpl_get_active_user($linkstudentid, 'Student', $validationerror);
        $parent = $validationerror === '' ? pqlpl_get_active_user($linkparentid, 'Parent/guardian', $validationerror) : null;
        if ($validationerror !== '') {
            pqpd_fail(400, $validationerror);
        } else if (!$student || !$parent) {
            pqpd_fail(400, 'Choose valid student and parent Moodle accounts before linking.');
        } else if ((int)$student->id === (int)$parent->id) {
            pqpd_fail(400, 'Student and parent must be different Moodle user accounts.');
        }
        // Guardian-link mode (parent_link_confirm_mode): '' = instant-active
        // (legacy), 'notify' = active + the parent is told, 'confirm' = the
        // link starts PENDING and grants nothing until the parent confirms it
        // on their portal.
        $linkmode = (string)get_config('local_prequran', 'parent_link_confirm_mode');
        if ($linkmode === 'confirm') {
            $linkliveconsent = 0;
            $linkrecordingconsent = 0;
        }
        $sourcekey = $linkmode === 'confirm' ? 'pending_parent_confirm' : 'manual_parent_student_link';
        $details = $linknotes !== '' ? $linknotes : 'Manual admin link between existing Moodle student and existing Moodle parent/guardian.';
        $commstatus = pqlpl_upsert_comm_link((int)$student->id, (int)$parent->id, $sourcekey);
        if ($commstatus === 'communication consent table missing') {
            pqpd_fail(400, 'Communication consent table is not installed, so the parent link could not be saved.');
        }
        $livestatus = pqlpl_upsert_live_consent((int)$student->id, (int)$parent->id, 'live_session', $linkliveconsent, $sourcekey, $details);
        $recordingstatus = pqlpl_upsert_live_consent((int)$student->id, (int)$parent->id, 'recording', $linkrecordingconsent, $sourcekey, $details);
        $audiostatus = pqlpl_upsert_live_consent(
            (int)$student->id,
            (int)$parent->id,
            'audio_recording_policy',
            1,
            $sourcekey,
            'Audio is always recorded for safeguarding, class quality, lesson review, parent/teacher review, quiz support, and academy compliance. ' . $details
        );
        $profilestatus = $linkupdateprofile ? pqlpl_update_student_profile_parent((int)$student->id, $parent) : 'not requested';
        if ($linkmode === 'confirm') {
            // Park the pair: consented=0 until the parent confirms on their
            // portal. Field-existence guarded (comm_consent schema variants).
            $commcolumns = $DB->get_columns('local_prequran_comm_consent');
            $pair = $DB->get_record('local_prequran_comm_consent',
                ['studentid' => (int)$student->id, 'guardianid' => (int)$parent->id], '*', IGNORE_MISSING);
            if ($pair) {
                $pending = (object)['id' => (int)$pair->id];
                if (isset($commcolumns['consented'])) {
                    $pending->consented = 0;
                }
                if (isset($commcolumns['source'])) {
                    $pending->source = 'pending_parent_confirm';
                }
                if (isset($commcolumns['consent_source'])) {
                    $pending->consent_source = 'pending_parent_confirm';
                }
                if (isset($commcolumns['timemodified'])) {
                    $pending->timemodified = time();
                }
                $DB->update_record('local_prequran_comm_consent', $pending);
            }
        }
        pqlpl_audit($linkmode === 'confirm' ? 'student_parent_link_pending' : 'student_parent_linked',
            (int)$student->id, (int)$parent->id, [
            'comm' => $commstatus,
            'live_session' => $livestatus,
            'recording' => $recordingstatus,
            'audio_policy' => $audiostatus,
            'profile' => $profilestatus,
            'mode' => $linkmode,
        ]);
        if ($linkmode === 'notify' || $linkmode === 'confirm') {
            // The guardian must always learn a link was made in their name.
            try {
                $notice = new \core\message\message();
                $notice->component = 'local_prequran';
                $notice->name = 'live_session_update';
                $notice->userfrom = core_user::get_noreply_user();
                $notice->userto = $parent;
                $notice->subject = 'You were linked as parent/guardian of ' . fullname($student);
                $notice->fullmessage = 'The academy linked your account as parent/guardian of ' . fullname($student) . '.'
                    . ($linkmode === 'confirm'
                        ? ' The link is INACTIVE until you confirm it on your family portal (Student & Parent Portal).'
                        : ' If this is not correct, contact your school immediately.');
                $notice->fullmessageformat = FORMAT_PLAIN;
                $notice->fullmessagehtml = '';
                $notice->smallmessage = $notice->subject;
                $notice->notification = 1;
                $notice->courseid = SITEID;
                message_send($notice);
            } catch (Throwable $e) {
                // Notification is best-effort; the link/audit already stand.
            }
        }
        $linkmessage = ($linkmode === 'confirm' ? 'PENDING link created (parent must confirm on their portal): ' : 'Linked ')
            . fullname($student) . ' (' . pqh_account_no_label($student) . ', student Moodle ID ' . (int)$student->id . ') to ' . fullname($parent) . ' (' . pqh_account_no_label($parent) . ', parent Moodle ID ' . (int)$parent->id . ').';
        echo json_encode([
            'ok' => true,
            'message' => $linkmessage,
            'studentid' => (int)$student->id,
            'parentid' => (int)$parent->id,
        ], JSON_UNESCAPED_SLASHES);
        exit;
    }

    // -- write: unlink (consent WITHDRAWAL — the revoke path the legacy page
    // never had). Sets comm_consent.consented=0 and every live_consent row for
    // the pair to granted=0. The pair then disappears from parent-observer
    // reconcile, parent reporting access, and notification fan-out (all filter
    // on consented/granted after this change). Rows are kept as dated history.
    if ($do === 'unlink') {
        $unlinkstudentid = (int)($body['link_studentid'] ?? 0);
        $unlinkparentid = (int)($body['link_parentid'] ?? 0);
        $unlinkreason = trim(clean_param((string)($body['link_notes'] ?? ''), PARAM_TEXT));
        if ($unlinkstudentid <= 0 || $unlinkparentid <= 0) {
            pqpd_fail(400, 'Choose the student and parent to unlink.');
        }
        $now = time();
        $commrevoked = 0; $liverevoked = 0;
        if ($DB->get_manager()->table_exists(new xmldb_table('local_prequran_comm_consent'))) {
            $rows = $DB->get_records('local_prequran_comm_consent',
                ['studentid' => $unlinkstudentid, 'guardianid' => $unlinkparentid]);
            foreach ($rows as $row) {
                if ((int)$row->consented === 1) {
                    $DB->update_record('local_prequran_comm_consent', (object)[
                        'id' => (int)$row->id, 'consented' => 0, 'timemodified' => $now,
                    ]);
                    $commrevoked++;
                }
            }
        }
        if ($DB->get_manager()->table_exists(new xmldb_table('local_prequran_live_consent'))) {
            $rows = $DB->get_records('local_prequran_live_consent',
                ['studentid' => $unlinkstudentid, 'guardianid' => $unlinkparentid]);
            foreach ($rows as $row) {
                if ((int)$row->granted === 1) {
                    $DB->update_record('local_prequran_live_consent', (object)[
                        'id' => (int)$row->id, 'granted' => 0, 'timemodified' => $now,
                    ]);
                    $liverevoked++;
                }
            }
        }
        pqlpl_audit('student_parent_unlinked', $unlinkstudentid, $unlinkparentid, [
            'comm_revoked' => $commrevoked,
            'live_revoked' => $liverevoked,
            'reason' => $unlinkreason,
        ]);
        echo json_encode([
            'ok' => true,
            'message' => 'Parent link revoked: ' . $commrevoked . ' communication consent(s) and ' . $liverevoked
                . ' live consent(s) withdrawn. The parent no longer appears in observer sync, reports, or notifications. Re-link any time to restore.',
        ], JSON_UNESCAPED_SLASHES);
        exit;
    }

    pqpd_fail(400, 'Unknown parent-links action.');
}

// -- GET: the parent-link rows + q/source filters exactly as the legacy page --
$q = trim(optional_param('q', '', PARAM_TEXT));
$source = optional_param('source', 'all', PARAM_ALPHANUMEXT);

$rows = pqlpl_rows();
$filtered = [];
foreach ($rows as $row) {
    if ($source === 'linked' && (int)$row['parentid'] <= 0) {
        continue;
    }
    if ($source === 'profile' && (int)$row['parentid'] > 0) {
        continue;
    }
    if ($q !== '') {
        $haystack = strtolower(implode(' ', array_map('strval', $row)));
        if (strpos($haystack, strtolower($q)) === false) {
            continue;
        }
    }
    $filtered[] = $row;
}

echo json_encode([
    'ok' => true,
    'ready' => true,
    'q' => $q,
    'source' => $source,
    'rows' => array_values($filtered),
    'total' => count($filtered),
    'linkedcount' => count(array_filter($filtered, function($row) { return (int)$row['parentid'] > 0; })),
    'profilecount' => count(array_filter($filtered, function($row) { return (int)$row['parentid'] <= 0; })),
    'legacyurl' => $CFG->wwwroot . '/local/hubredirect/live_parent_links.php',
], JSON_UNESCAPED_SLASHES);
exit;
