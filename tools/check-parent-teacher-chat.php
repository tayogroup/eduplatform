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
check('the teacher door sends "teacher", literally',
    (bool)preg_match("/parent_teacher_chat_exchange\(\s*\(int\)\\\$USER->id,\s*\\\$studentid,\s*'teacher'/", $teacherdoor),
    'A role read from the request would let a parent speak as staff.');
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
check('  and neither lookup is switched off',
    !preg_match('/if \(false/', $teacherlive));
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
