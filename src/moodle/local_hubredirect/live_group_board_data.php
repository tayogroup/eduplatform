<?php
declare(strict_types=1);

// Live group board — the poll endpoint.
//
// Returns exactly what live_group_board.php paints, so the page and its refresh
// cannot disagree: both call pqlgb_build() and neither holds a second copy of
// the assembly. The page renders the first frame server-side (so the board is
// useful before any JS runs) and then replaces it from here every few seconds.
//
// Polling rather than reloading is not cosmetic here. A teacher entering the
// second breakout room is mid-glance; a full page reload throws away their
// scroll position and their place in the sorted list, which is the one thing
// the board exists to hold steady.
//
// Same gating as the page, restated rather than inherited — an endpoint that
// trusts the page having checked is an endpoint anyone can call directly.

define('AJAX_SCRIPT', true);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/live_group_boardlib.php');
require_once($CFG->dirroot . '/local/prequran/progress_gatewaylib.php');

require_login();
require_sesskey();

$requestedworkspaceid = optional_param('workspaceid', 0, PARAM_INT);
$windowminutes = optional_param('window', PQLGB_DEFAULT_WINDOW_MINUTES, PARAM_INT);
$env = optional_param('env', 'production', PARAM_ALPHA);

$workspaceid = pqh_current_workspace_id((int)$USER->id, $requestedworkspaceid);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

if ($workspaceid <= 0 || !pqh_user_can_teach_in_workspace((int)$USER->id, $workspaceid)) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'message' => 'Teacher access to this workspace is required.']);
    exit;
}

if (!pqlgb_schema_ready()) {
    echo json_encode(['ok' => false, 'message' => 'Grouping tables are not installed on this site yet.']);
    exit;
}

// An administrator supervising cover reads another teacher's board; everyone
// else reads their own. The manage check is what separates those, so the
// teacherid parameter can never widen access on its own.
$teacherid = (int)$USER->id;
$requestedteacherid = optional_param('teacherid', 0, PARAM_INT);
if ($requestedteacherid > 0 && $requestedteacherid !== $teacherid
        && pqh_user_can_manage_workspace((int)$USER->id, $workspaceid)) {
    $teacherid = $requestedteacherid;
}

try {
    $board = pqlgb_build($teacherid, $workspaceid, $windowminutes, $env);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'message' => 'The board could not be assembled.']);
    exit;
}

$board['ok'] = true;
$board['teacherid'] = $teacherid;
echo json_encode($board, JSON_UNESCAPED_SLASHES);
