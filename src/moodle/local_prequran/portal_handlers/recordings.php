<?php
// ---- report: recordings (Speak practice recordings; read + audio stream) ------
// Ported from local_hubredirect/recordings.php via recordings_portallib
// (pqrecl_*). Required from portal_data.php AFTER token auth: $claims verified,
// $USER set to the token's user, JSON exception handler installed.
//
//   GET ?report=recordings&token=…                      -> chooser (student rows)
//   GET ?report=recordings&token=…&childid=N            -> recording groups JSON
//   GET ?report=recordings&token=…&childid=N&action=play&id=R -> audio bytes
//
// Same mode resolution as the legacy page: no childid = student picker scoped
// by role (admin all / teacher their students / parent linked children / self);
// with childid = the legacy access gate verbatim, then the same speakrec query.
// The play action streams Bunny storage bytes exactly like the legacy page
// (pqrecl_stream_bunny_file overrides the JSON Content-Type before output).
// No write actions: the legacy page has no data_submitted()/action writes.

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/recordings_portallib.php');
$userid = (int)($claims['sub'] ?? 0);

$childid = optional_param('childid', 0, PARAM_INT);
if ($childid <= 0) {
    // Legacy: pqr_render_student_picker(pqr_recording_student_rows($USER->id)).
    // The rows are already role-scoped inside pqrecl_recording_student_rows.
    echo json_encode([
        'ok' => true, 'ready' => true,
        'mode' => 'chooser',
        'students' => pqrecl_recording_student_rows($userid),
    ], JSON_UNESCAPED_SLASHES);
    exit;
}

// Legacy entry gate, verbatim shape (self OR linked parent OR teacher; site
// admins pass via pqrecl_parent_can_access_child's is_siteadmin branch).
if ($userid !== $childid
    && !pqrecl_parent_can_access_child($userid, $childid)
    && !pqrecl_teacher_can_access_student($userid, $childid)) {
    pqpd_fail(403, 'You cannot review recordings for this student.');
}

$recordingid = optional_param('id', 0, PARAM_INT);
$action = optional_param('action', '', PARAM_ALPHA);
if ($action === 'play' && $recordingid > 0) {
    if (!pqrecl_table_exists('local_prequran_speakrec')) {
        pqpd_fail(403, 'Speak recording storage is not installed yet.');
    }
    $recording = $DB->get_record('local_prequran_speakrec', ['id' => $recordingid, 'userid' => $childid], '*', IGNORE_MISSING);
    if (!$recording) {
        pqpd_fail(403, 'Choose a valid recording before opening playback.');
    }
    try {
        pqrecl_stream_bunny_file((string)$recording->bunny_path, (string)$recording->mime_type);
    } catch (Throwable $e) {
        pqpd_fail(403, $e->getMessage());
    }
}

$child = core_user::get_user($childid);
$childname = $child ? fullname($child) : 'Student ' . $childid;
$recordinggroups = [];
if (pqrecl_table_exists('local_prequran_speakrec')) {
    $speakrecords = $DB->get_records_sql(
        "SELECT *
           FROM {local_prequran_speakrec}
          WHERE userid = ?
            AND status <> ?
       ORDER BY timecreated DESC, id DESC",
        [$childid, 'upload_failed'],
        0,
        50
    );
    if ($speakrecords) {
        $records = [];
        foreach ($speakrecords as $record) {
            // Same derivations the legacy render loop computes per card.
            $records[] = [
                'id' => (int)$record->id,
                'title' => trim((string)($record->letter_name ?: $record->letter_text ?: $record->letter_key ?: 'Speak recording')),
                'unit' => trim((string)$record->unitid),
                'duration_sec' => (int)round(((int)$record->duration_ms) / 1000),
                'attempt_no' => (int)$record->attempt_no,
                'timecreated' => (int)$record->timecreated,
            ];
        }
        $recordinggroups[] = [
            'key' => 'speak',
            'title' => 'Speak Recordings',
            'summary' => 'Play submitted Speak practice together, or review one recording at a time.',
            'records' => $records,
        ];
    }
}

echo json_encode([
    'ok' => true, 'ready' => true,
    'mode' => 'child',
    'child' => ['id' => $childid, 'name' => $childname],
    'groups' => $recordinggroups,
    'names' => pqpd_names([$childid]),
], JSON_UNESCAPED_SLASHES);
exit;
