<?php
declare(strict_types=1);

// Parent board — the poll endpoint.
//
// The page and this endpoint cannot disagree: both call pqpb_build() and
// neither holds a second copy of the shape. That is the group board's own rule
// and its own reason — a first frame painted by one and refreshed by another
// drifts, and the drift shows as a tile that changes when it refreshes.
//
// Gating is RESTATED rather than inherited from the page: a guardian is proved
// by having children, and the board is built for the CALLER, so no parameter
// on this request can widen what comes back.

define('AJAX_SCRIPT', true);
require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/parent_boardlib.php');
require_login();
require_sesskey();

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$workspaceid = pqh_current_workspace_id((int)$USER->id, optional_param('workspaceid', 0, PARAM_INT));
$children = pqpb_parent_children((int)$USER->id);
if (!$children && !($workspaceid > 0 && pqh_user_can_manage_workspace((int)$USER->id, $workspaceid))) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'message' => 'The parent board is for a guardian with a child at the school.']);
    exit;
}

try {
    // ALWAYS FOR THE CALLER. There is no studentid or parentid parameter here
    // on purpose: the board is whoever is asking, so there is nothing to
    // tamper with.
    $board = pqpb_build((int)$USER->id);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'message' => 'The board could not be assembled.']);
    exit;
}

echo json_encode($board, JSON_UNESCAPED_SLASHES);
