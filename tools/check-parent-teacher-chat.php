<?php
/**
 * Parent <-> teacher chat: one implementation, two doors, and nothing hidden.
 *
 * THE INVARIANT THIS EXISTS FOR is the one a careless copy would break. The
 * classroom chat stamps a learner's message `group_teacher_only` because nine
 * children share that room and the requirements say twice there is no
 * student-to-student messaging. This thread has two adults in it and one
 * subject between them, so a stamp would hide a parent's message from the
 * person it is addressed to. Somebody porting the classroom room across would
 * bring the stamp with it; this gate fails if they do.
 *
 * The second invariant is the one that decides who may speak as whom: the
 * caller's ROLE is fixed by the door they came through, never read from the
 * request. A door that passed a role from optional_param() would let a parent
 * send as staff.
 *
 * Like check-class-group-chat.php, this EXTRACTS source: externallib_v4.php is
 * 11k lines behind MOODLE_INTERNAL and cannot be included, so the function is
 * pulled out by brace-counting and its shipped text is what gets asserted on.
 *
 * THE BLIND SPOT, recorded rather than papered over: reading source means dead
 * code reads as live code. Wrapping the insert in `if (false)` leaves every
 * pattern here matching. Nothing short of running the PHP against a Moodle
 * catches that, and the enforcement lives in the parts that cannot be tested
 * that way. Exits 2 when extraction fails, because a gate that cannot read its
 * target and passes is green about nothing.
 */
$root = __DIR__ . '/../src/moodle';
$ext = @file_get_contents($root . '/local_prequran/externallib_v4.php');
$teacherdoor = @file_get_contents($root . '/local_hubredirect/parent_teacher_chat.php');
$parentdoor = @file_get_contents($root . '/local_prequran/portal_handlers/student-parent-portal.php');
foreach (['externallib_v4.php' => $ext, 'parent_teacher_chat.php' => $teacherdoor,
          'student-parent-portal.php' => $parentdoor] as $name => $text) {
    if ($text === false) {
        fwrite(STDERR, "cannot read $name\n");
        exit(2);
    }
}

/** One function's full text, by counting braces from its signature. */
function fn_text(string $src, string $name): string {
    $at = strpos($src, "function $name(");
    if ($at === false) {
        fwrite(STDERR, "cannot find function $name\n");
        exit(2);
    }
    $open = strpos($src, '{', $at);
    $depth = 0;
    for ($i = $open, $n = strlen($src); $i < $n; $i++) {
        if ($src[$i] === '{') {
            $depth++;
        } elseif ($src[$i] === '}') {
            $depth--;
            if ($depth === 0) {
                return substr($src, $at, $i - $at + 1);
            }
        }
    }
    fwrite(STDERR, "unbalanced braces in $name\n");
    exit(2);
}

/**
 * Source with its COMMENTS REMOVED.
 *
 * Every "must be present" assertion below runs on this rather than the raw
 * file, because `// require_sesskey();` contains `require_sesskey();` and a
 * gate matching the raw text calls a commented-out guard present. Found by
 * mutation-testing this gate: three mutations survived, all of them this one
 * shape - presence of a name read as presence of working code, which is the
 * failure this repo keeps recording and which I wrote into a fresh gate.
 */
function live_code(string $src): string {
    $src = preg_replace('!/\*.*?\*/!s', ' ', $src);
    return preg_replace('!(^|\s)(//|#)[^\n]*!m', ' ', $src);
}

$exchange = fn_text($ext, 'parent_teacher_chat_exchange');
$thread = fn_text($ext, 'parent_teacher_thread');
$classroom = fn_text($ext, 'class_group_chat_exchange');
$teacherlive = live_code($teacherdoor);
$parentlive = live_code($parentdoor);
$exchangelive = live_code($exchange);

$pass = 0;
$fail = 0;
function check(string $what, bool $ok, string $why = '') {
    global $pass, $fail;
    if ($ok) {
        $pass++;
        echo "  ok   $what\n";
        return;
    }
    $fail++;
    echo "  FAIL $what" . ($why !== '' ? "\n       $why" : "") . "\n";
}

echo "nothing is hidden between two adults\n";

// The whole point. The classroom room stamps; this one must not.
check('the classroom room still stamps (the control)',
    strpos($classroom, 'group_teacher_only') !== false,
    'class_group_chat_exchange no longer stamps — this gate is comparing against nothing.');
check('the parent-teacher exchange stamps NOTHING',
    strpos($exchange, 'group_teacher_only') === false,
    'A stamp here hides a parent message from the teacher it is addressed to.');
check('  and it says so at the insert',
    (bool)preg_match("/'visibility'\s*=>\s*''/", $exchange));
check('no visibility filter is applied when reading',
    strpos($exchange, 'support_message_visible_to_user') === false);

echo "\nthe caller's role comes from the DOOR, never the request\n";

check('the exchange takes a role and validates it',
    (bool)preg_match("/in_array\(\\\$role, \['parent', 'teacher'\], true\)/", $exchange));
// The Moodle-side door serves BOTH adults - a teacher on the per-student page
// and a parent on their own Workspace - so the role is chosen from the
// relationship the door has just proved, never from the request.
check('the session door decides the role from the relationship it proved',
    (bool)preg_match("/parent_teacher_chat_exchange\(\s*\(int\)\\\$USER->id,\s*\\\$studentid,\s*\\\$teaches \? 'teacher' : 'parent'/", $teacherdoor),
    'A role read from the request would let a parent speak as staff.');
check('  and a caller with neither link is refused',
    strpos($teacherdoor, 'That child is not linked to you.') !== false);
// THE WHOLE LOOKUP, not the table name. Replacing the consent check with
// `true` makes every logged-in user a guardian of every child, and a
// name-presence assertion sailed straight past it — the third time in this one
// gate that presence stood in for position.
// The guardian question has ONE definition, in parent_boardlib, shared with
// the parent board. The door must ASK it rather than carry a second copy.
check('  with the guardian link asked of the shared resolver',
    strpos($teacherlive, 'pqpb_parent_owns_child((int)$USER->id, $studentid)') !== false
        && strpos($teacherlive, "require_once(__DIR__ . '/parent_boardlib.php')") !== false);
// A plain substring, not a regex: "\$consenttable" inside a double-quoted PHP
// string interpolates an undefined variable and leaves a pattern that matches
// nothing — an assertion that passes for the wrong reason, which is the same
// family of fault as everything else this gate has caught in itself.
check('  and the door keeps no second copy of it',
    strpos($teacherlive, 'record_exists($consenttable') === false);
check('the parent door sends "parent", literally',
    (bool)preg_match("/parent_teacher_chat_exchange\(\s*\\\$userid,\s*\\\$studentid,\s*'parent'/s", $parentdoor));
check('neither door reads a role from the request',
    !preg_match("/optional_param\('role'/", $teacherdoor . $parentdoor));

echo "\none implementation, two doors\n";

check('the teacher door calls the shared function',
    strpos($teacherdoor, 'parent_teacher_chat_exchange(') !== false,
    'A perfect function nothing invokes protects nobody.');
check('the parent door calls the shared function',
    strpos($parentdoor, 'parent_teacher_chat_exchange(') !== false);
check('neither door writes comm_message itself',
    !preg_match("/insert_record\('local_prequran_comm_message'/", $teacherdoor));

echo "\nthe teacher door restates its gating\n";

check('session auth', strpos($teacherlive, 'require_login();') !== false);
check('sesskey', strpos($teacherlive, 'require_sesskey();') !== false);
check('POST only', strpos($teacherlive, "!== 'POST'") !== false);
// Without this any teacher reads any family's conversation by guessing an id.
// The whole expression, not the table name: a name survives being disabled,
// and `if (false && ...)` left the old assertion perfectly happy.
check('the relationship to the child is REBUILT, not trusted',
    (bool)preg_match("/record_exists\('local_prequran_teacher_student',\s*\['teacherid' => \(int\)\\\$USER->id, 'studentid' => \\\$studentid, 'status' => 'active'\]\)/", $teacherlive)
        && (bool)preg_match('/JOIN \{local_prequran_class_group\} cg ON cg\.id = gm\.groupid/', $teacherlive));
// A lookup can be neutralised without being removed, and the whole-expression
// assertions above still match when it is: `if (false && …)` skips it and
// `true || …` short-circuits past it, leaving every pattern intact. Both
// mutations survived this gate until these two lines existed.
check('  and no lookup is switched off',
    !preg_match('/if \(false/', $teacherlive));
check('  or short-circuited past',
    !preg_match('/(=\s*true\s*\|\||\|\|\s*true\b|\btrue\s*&&)/', $teacherlive));
check('  and a manager is the only other way in',
    strpos($teacherdoor, 'pqh_user_can_manage_workspace') !== false);
// dashboard.php RENDERS A PAGE; requiring it from an AJAX endpoint to borrow
// one helper would execute it.
check('it does not require a page to borrow a helper',
    strpos($teacherdoor, "require_once(__DIR__ . '/dashboard.php')") === false);

echo "\nthe parent door\n";

// The ALLOWLIST ARRAY, not any mention of the name - the door's own
// `=== 'parent_teacher_chat'` comparison kept the weak version green while the
// action was unreachable.
// Matched on the ARRAY LITERAL itself, which carries no `$` — the first
// attempt interpolated one inside a double-quoted PHP string, so the regex saw
// an end-of-string anchor and could never match. It failed loudly, which is the
// only reason it was not shipped as a check that quietly passes on nothing.
check('is on the handler allowlist',
    (bool)preg_match("/\['open_grade_dispute',[^\]]*'parent_teacher_chat'\]/", $parentlive));
// The handler resolves $studentid from the caller's own linked children and
// fails 403 before this point; the door must sit after that, not before it.
check('runs after the portal proves the caller is this child\'s guardian',
    strpos($parentdoor, 'That student is not linked to your portal.')
        < strpos($parentdoor, 'parent_teacher_chat_exchange('));

echo "\nboth sides have a panel that reaches its door\n";

// One level up from "a perfect function nothing invokes": two doors nothing
// calls are two doors nobody can use. The panels are what make this a feature
// rather than a contract.
$teacherpage = @file_get_contents($root . '/local_hubredirect/workspace_student.php');
$familypage = @file_get_contents(__DIR__ . '/../src/portal/student-parent-portal.html');
if ($teacherpage === false || $familypage === false) {
    fwrite(STDERR, "cannot read one of the two panels\n");
    exit(2);
}
check('the teacher page posts to the teacher door',
    strpos($teacherpage, "/local/hubredirect/parent_teacher_chat.php") !== false);
check('  with a sesskey, which the door requires',
    strpos($teacherpage, "p.set('sesskey', sesskey)") !== false);
// Drawn only where the caller may actually use it — a control that reaches
// nothing is worse than none.
check('  and only where the caller may teach',
    strpos($teacherpage, 'if ($canteach && $studentid > 0)') !== false);
check('the family page posts the portal action',
    strpos($familypage, '"parent_teacher_chat"') !== false);
// WHERE A PARENT ACTUALLY IS. The portal page is not in a parent's navigation
// rail — its only inbound link anywhere in the codebase is from an admin
// records page — so a panel there renders correctly on a page they cannot
// reach. Their own Workspace is the first item in that rail.
$parentworkspace = @file_get_contents($root . '/local_hubredirect/workspace_parent.php');
if ($parentworkspace === false) {
    fwrite(STDERR, "cannot read workspace_parent.php\n");
    exit(2);
}
check('the parent\'s own Workspace has the panel',
    strpos($parentworkspace, '/local/hubredirect/parent_teacher_chat.php') !== false
        && strpos($parentworkspace, 'Message the teacher') !== false);
check('  and it polls only while visible',
    strpos($parentworkspace, "visibilityState === 'visible'") !== false);

// The dashboard is the page a parent lands on, so the panel is there too — and
// the two links to the OLD, POST-and-reload messaging are gone with it. Left
// beside a live panel they offered the same conversation twice, with only one
// of them live (owner, 2026-09-08).
$dash = @file_get_contents($root . '/local_hubredirect/dashboard.php');
if ($dash === false) {
    fwrite(STDERR, "cannot read dashboard.php\n");
    exit(2);
}
check('the parent dashboard has the panel',
    strpos($dash, '/local/hubredirect/parent_teacher_chat.php') !== false);
check('  and no longer offers the old messaging to a parent',
    !preg_match("/pqh-btn js-pqh-open-comm\" data-opencomm=\"messages\"/", $dash));
// Students and teachers keep theirs: their Messages carry helpdesk tickets and
// student-teacher threads, which this chat does not replace.
check('  while students and teachers keep their Messages entry',
    substr_count($dash, '<span class="pqh-gnav__label">Messages</span>') === 2);
// A portal left open on a kitchen tablet would otherwise poll all day to
// deliver one message from a teacher who works six hours.
check('neither side polls while its tab is hidden',
    substr_count($teacherpage, "visibilityState === 'visible'") >= 1
        && substr_count($familypage, 'visibilityState === "visible"') >= 1);

// ---- the parent board ------------------------------------------------
// A page with no route is a page nobody finds — which is exactly what happened
// to the chat card twice before this board existed.
echo "\nthe parent board is reachable and reuses the board's own numbers\n";
$pboard = @file_get_contents($root . '/local_hubredirect/parent_board.php');
$plib = @file_get_contents($root . '/local_hubredirect/parent_boardlib.php');
$pdata = @file_get_contents($root . '/local_hubredirect/parent_board_data.php');
if ($pboard === false || $plib === false || $pdata === false) {
    fwrite(STDERR, "cannot read the parent board files\n");
    exit(2);
}
// Comment-stripped, like the doors above. Three mutations survived the first
// version of this block because it matched the RAW file: a commented-out
// require_sesskey() and a commented-out require of the board library both
// still contained their own text. Presence standing in for position, again.
$pboardlive = live_code($pboard);
$pliblive = live_code($plib);
$pdatalive = live_code($pdata);
check('the parent rail links to it',
    strpos($dash, '/local/hubredirect/parent_board.php') !== false
        && strpos($dash, 'Parent board') !== false);
// One builder for both: a page painted by PHP and refreshed by JS drifts, and
// the drift shows as a tile that changes shape the moment it refreshes.
check('page and poll endpoint both call pqpb_build',
    strpos($pboardlive, 'pqpb_build(') !== false && strpos($pdatalive, 'pqpb_build(') !== false);
check('the board is always built for the CALLER',
    strpos($pdatalive, 'pqpb_build((int)$USER->id)') !== false
        && strpos($pdatalive, "optional_param('studentid'") === false
        && strpos($pdatalive, "optional_param('parentid'") === false);
check('the poll endpoint restates its gating',
    strpos($pdatalive, 'require_login();') !== false && strpos($pdatalive, 'require_sesskey();') !== false);
// The per-child facts have ONE definition. A second copy is two boards
// disagreeing about the same child in front of two people who talk to
// each other.
check('per-child facts come from the group board library',
    strpos($pliblive, "require_once(__DIR__ . '/live_group_boardlib.php')") !== false
        && strpos($pliblive, 'pqlgb_progress_snapshot(') !== false
        && strpos($pliblive, 'pqpr_learning_day(') !== false);
// The break count stays on the teacher's board — see the note in
// parent_boardlib for why a family must not be handed it.
check('it carries no focus BREAK count',
    strpos($pliblive, 'pqlgb_focus_signals') === false
        && strpos($pboardlive, 'left page') === false);
check('  but does carry the child\'s own words for stopping early',
    strpos($pliblive, "'course_left_early'") !== false);
// Four different claims, and a zero where nothing was measured is the one that
// tells a family their child did nothing on the strength of missing data.
check('the four week-claims are all present',
    strpos($pboardlive, 'pqpb-flag--quiet">not counted yet<') !== false
        && strpos($pboardlive, '(c.weekcovered ? "" : "at least ")') !== false
        && strpos($pboardlive, 'pqpb-flag--quiet">nothing yet this week<') !== false
        && strpos($pboardlive, 'finished this week') !== false);
check('  and nothing polls while the tab is hidden',
    strpos($pboardlive, 'visibilityState === "visible"') !== false);
// THE SHELL'S OWN STYLESHEET. Its first rule is the 248px left padding that
// clears the FIXED nav rail; without it the page renders correctly and sits
// underneath the rail. Shipped once without it, and that is exactly what a
// formatting fault looks like from the outside.
check('the page emits the shell stylesheet that clears the rail',
    strpos($pboardlive, "pqh_design_shell_css('.pqpb-shell')") !== false);
check('  and the viewer chrome that hides the Moodle furniture',
    strpos($pboardlive, "pqh_viewer_chrome_css('.pqpb-shell')") !== false);
check('  and gives its content wrapper a rule',
    strpos($pboardlive, '.pqpb-wrap{') !== false);
// pqlgb_course_label() FALLS BACK to the raw course key when the subject map
// is absent, so a page that does not load the gateway library labels a tile
// `ehel-eng-g01` and reports no error at all. The teacher's board requires it
// from the page; the library requires it here so the page and the poll
// endpoint cannot disagree.
check('the subject map is loaded, so a tile says English and not ehel-eng-g01',
    strpos($pliblive, "require_once(__DIR__ . '/../local_prequran/progress_gatewaylib.php')") !== false);
// The layout answers to the CONTAINER: a media query measures the viewport,
// and this page's column is narrow inside a wide one.
check('the two columns wrap on the container, not a viewport query',
    strpos($pboardlive, '.pqpb-cols{display:flex;flex-wrap:wrap') !== false);

echo "\nthe message itself\n";

check('a body too long is refused, not truncated',
    strpos($exchange, 'That message is too long to send.') !== false,
    'A message that arrives half-said is worse than one that did not send.');
check('the store\'s own cleaner is used',
    strpos($exchange, 'support_clean_message_body') !== false);
// Both parties are adults who may legitimately need to swap a phone number;
// the contact-details filter exists to stop a CHILD doing it.
check('  as a non-student, deliberately',
    (bool)preg_match('/support_clean_message_body\(\$body, \[\], false,/', $exchange));
check('the thread is keyed on the CHILD',
    (bool)preg_match("/'type' => 'parent_teacher',/", $thread)
        && strpos($thread, "'studentid' => \$studentid") !== false);
check('a participant row is written on first contact',
    strpos($thread, "insert_record('local_prequran_comm_participant'") !== false,
    'The participant row is what every later read is authorised against.');

echo "\n$pass passed, $fail failed\n";
if ($fail) {
    echo "the family conversation does not hold its shape.\n";
    exit(1);
}
echo "parent and teacher: one implementation, two doors, nothing hidden.\n";
