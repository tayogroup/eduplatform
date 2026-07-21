<?php
// One-time seeder: creates three demo student accounts and enrolls them as
// active student members of a workspace (default: 16, Ehel Academy) so the
// full pipeline - session participants, attendance, reports - can be tested
// with real accounts. Idempotent by username. Delete after use.
// ?k=<key>                 -> report what exists / would be created
// ?k=<key>&apply=1         -> create the accounts and memberships
// ?k=<key>&workspaceid=NN  -> target a different workspace

define('NO_MOODLE_COOKIES', true);
require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/institutionlib.php');
require_once($CFG->dirroot . '/user/lib.php');

$key = isset($_GET['k']) ? (string)$_GET['k'] : '';
if (!hash_equals('bff9103454fb45b8b165606d2393b4a0', $key)) {
    http_response_code(404);
    header('Content-Type: text/plain');
    echo 'Not found';
    exit;
}

header('Content-Type: application/json');
header('Cache-Control: no-store');

global $DB;
$workspaceid = isset($_GET['workspaceid']) ? max(1, (int)$_GET['workspaceid']) : 16;
$apply = isset($_GET['apply']) && $_GET['apply'] === '1';
$password = 'EhelDemo#2026';

$out = ['marker' => 'demo-students-v96', 'workspaceid' => $workspaceid, 'apply' => $apply, 'password' => $password, 'students' => []];

$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], 'id, name', IGNORE_MISSING);
if (!$workspace) {
    $out['error'] = 'workspace ' . $workspaceid . ' not found';
    echo json_encode($out, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    exit;
}
$out['workspace'] = (string)$workspace->name;

$specs = [
    ['username' => 'ehel-demo-student-1', 'firstname' => 'Demo', 'lastname' => 'Student One', 'email' => 'demo.student1@ehelacademy.org'],
    ['username' => 'ehel-demo-student-2', 'firstname' => 'Demo', 'lastname' => 'Student Two', 'email' => 'demo.student2@ehelacademy.org'],
    ['username' => 'ehel-demo-student-3', 'firstname' => 'Demo', 'lastname' => 'Student Three', 'email' => 'demo.student3@ehelacademy.org'],
];

foreach ($specs as $spec) {
    $row = ['username' => $spec['username'], 'email' => $spec['email']];
    try {
        $existing = $DB->get_record('user', ['username' => $spec['username'], 'deleted' => 0], 'id, username', IGNORE_MISSING);
        if ($existing) {
            $userid = (int)$existing->id;
            $row['user'] = 'already exists (id ' . $userid . ')';
        } else if ($apply) {
            $user = new stdClass();
            $user->username = $spec['username'];
            $user->firstname = $spec['firstname'];
            $user->lastname = $spec['lastname'];
            $user->email = $spec['email'];
            $user->password = $password;
            $user->auth = 'manual';
            $user->confirmed = 1;
            $user->mnethostid = (int)$CFG->mnet_localhost_id;
            $userid = (int)user_create_user($user, true, false);
            $row['user'] = 'created (id ' . $userid . ')';
        } else {
            $userid = 0;
            $row['user'] = 'would create';
        }
        if ($userid > 0) {
            $member = $DB->get_record('local_prequran_workspace_member', [
                'workspaceid' => $workspaceid, 'userid' => $userid, 'workspace_role' => 'student',
            ], 'id, status', IGNORE_MISSING);
            if ($member && (string)$member->status === 'active') {
                $row['membership'] = 'already active';
            } else if ($apply) {
                pqhi_upsert_workspace_member($workspaceid, $userid, 'student', 0, 'Demo student for live-class testing');
                $row['membership'] = 'enrolled as student';
            } else {
                $row['membership'] = 'would enroll';
            }
        }
    } catch (Throwable $e) {
        $row['error'] = $e->getMessage();
    }
    $out['students'][] = $row;
}

echo json_encode($out, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
