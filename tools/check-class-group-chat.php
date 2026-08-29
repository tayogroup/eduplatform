<?php
// Behavioural gate for the class-group chat's asymmetry.
//
// The rule it protects is stated twice in docs/livechat-helpdesk-requirements.md
// — "Non-Goals: student-to-student chat" and, under Safety And Moderation, "No
// student-to-student messaging" — and the class_group room type added on
// 2026-08-29 is only inside that rule because of two functions: the one that
// stamps a learner's message `group_teacher_only`, and the one that refuses to
// show such a message to another learner. Lose either and nine children have an
// open channel that is unsupervised half of every lesson by the Counterpoint
// Model's own design. Nothing else in the repo reads the requirements doc, so
// nothing else can notice.
//
// externallib_v4.php is 11k lines and MOODLE_INTERNAL-guarded, so unlike
// check-progress-attempted.php this cannot load the whole class. It extracts
// the two functions' SOURCE and evaluates them in a harness — which tests the
// shipped text, not a copy, and REFUSES (exit 2) if extraction fails, because
// a gate that cannot read its target and passes anyway is green about nothing.
//
//   php tools/check-class-group-chat.php

declare(strict_types=1);

$src = @file_get_contents(__DIR__ . '/../src/moodle/local_prequran/externallib_v4.php');
if ($src === false) {
    fwrite(STDERR, "FAIL: cannot read externallib_v4.php\n");
    exit(2);
}

/** Extract one protected static function's full body by brace counting. */
function extract_fn(string $src, string $name): ?string {
    $at = strpos($src, "protected static function {$name}(");
    if ($at === false) {
        return null;
    }
    $open = strpos($src, '{', $at);
    if ($open === false) {
        return null;
    }
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
    return null;
}

$stampfn = extract_fn($src, 'support_message_visibility_for');
$viewfn = extract_fn($src, 'support_message_visible_to_user');
if ($stampfn === null || $viewfn === null) {
    fwrite(STDERR, "FAIL: could not extract the visibility functions — renamed or removed.\n");
    fwrite(STDERR, "      If they were renamed, update this gate in the same commit. If they were\n");
    fwrite(STDERR, "      removed, the classroom room has lost its student-to-student guard.\n");
    exit(2);
}

// The send path must actually CALL the stamp — a perfect stamp function that
// nothing invokes leaves every message public. Match the call site, not the
// definition.
if (strpos($src, "'visibility' => self::support_message_visibility_for(") === false) {
    fwrite(STDERR, "FAIL: support_send_message no longer stamps visibility via support_message_visibility_for().\n");
    exit(1);
}
// And both read paths must filter. Two calls beyond the definition itself.
if (substr_count($src, 'self::support_message_visible_to_user(') < 2) {
    fwrite(STDERR, "FAIL: fewer than two read paths filter through support_message_visible_to_user().\n");
    exit(1);
}

// A SCREENSHOT is never public, whoever sends it. Its visibility is a literal
// at the insert site rather than a call to the stamp, so the gate asserts the
// literal: find the screenshot insert and require group_teacher_only inside it.
$shotat = strpos($src, "'messagekind' => 'screenshot'");
if ($shotat === false) {
    fwrite(STDERR, "FAIL: the screenshot insert is gone from the exchange.
");
    exit(1);
}
$shotwindow = substr($src, $shotat, 600);
if (strpos($shotwindow, "'visibility' => 'group_teacher_only'") === false) {
    fwrite(STDERR, "FAIL: a screenshot message is no longer forced to group_teacher_only.
");
    fwrite(STDERR, "      An image of a child's screen must never reach other children.
");
    exit(1);
}

// ---- harness: evaluate the real text ---------------------------------------
// The view function touches is_siteadmin/has_capability only on its fallback
// branch; stub them false so the fallback denies, which is the strict reading.
function is_siteadmin($u = null): bool { return false; }
function has_capability($cap, $ctx, $u = null): bool { return false; }
// Minimal context stand-in for the \context_system::instance() reference.
class context_system { public static function instance() { return new self(); } }
class_alias('context_system', 'ctx_alias_unused');

$harness = 'class PQ_Gate_Harness { '
    . str_replace(['protected static function'], ['public static function'], $stampfn)
    . ' '
    . str_replace(['protected static function', '\\context_system'], ['public static function', 'context_system'], $viewfn)
    . ' }';
eval($harness);

$TEACHER = 600;
$LEARNER_A = 1001;
$LEARNER_B = 1002;
$ADMINISH = 9999;

$groupthread = (object)['type' => 'class_group', 'assignedto' => $TEACHER];
$oldthread = (object)['type' => 'student_teacher', 'assignedto' => $TEACHER, 'studentid' => $LEARNER_A];

$msg = static function (int $sender, string $visibility) {
    return (object)['senderid' => $sender, 'visibility' => $visibility];
};

$pass = 0;
$fail = 0;
$check = static function (string $why, bool $ok) use (&$pass, &$fail): void {
    if ($ok) {
        $pass++;
        echo "  ok   {$why}\n";
    } else {
        $fail++;
        echo "  FAIL {$why}\n";
    }
};

// ---- the stamp --------------------------------------------------------------
// Role-based, not assigned-teacher-based: the first live test had a site admin
// supervising the board, and their messages to the class were stamped as
// learner messages -- invisible to every child. Staff are not students.
$check("a teacher's message in the room is public",
    PQ_Gate_Harness::support_message_visibility_for($groupthread, $TEACHER, false) === 'public');
$check("STAFF who are not the assigned teacher are still public (the admin case)",
    PQ_Gate_Harness::support_message_visibility_for($groupthread, $ADMINISH, false) === 'public');
$check("a learner's message in the room is teacher-only",
    PQ_Gate_Harness::support_message_visibility_for($groupthread, $LEARNER_A, true) === 'group_teacher_only');
$check("a 1:1 thread is untouched (still public)",
    PQ_Gate_Harness::support_message_visibility_for($oldthread, $LEARNER_A, true) === 'public');

// ---- the view, which is the half that protects children ---------------------
$teachermsg = $msg($TEACHER, 'public');
$learnermsg = $msg($LEARNER_A, 'group_teacher_only');

$check("everyone sees the teacher's broadcast",
    PQ_Gate_Harness::support_message_visible_to_user($teachermsg, $groupthread, $LEARNER_B));
$check("THE RULE: learner B cannot read learner A's message",
    !PQ_Gate_Harness::support_message_visible_to_user($learnermsg, $groupthread, $LEARNER_B));
$check("the teacher reads the learner's message",
    PQ_Gate_Harness::support_message_visible_to_user($learnermsg, $groupthread, $TEACHER));
$check("the author still sees their own message (else they resend it)",
    PQ_Gate_Harness::support_message_visible_to_user($learnermsg, $groupthread, $LEARNER_A));
$check("a random authenticated user is refused",
    !PQ_Gate_Harness::support_message_visible_to_user($learnermsg, $groupthread, $ADMINISH));

// A message wrongly stamped public in the room would leak whatever the view
// rule says — the two halves must FAIL SAFE together, so assert the round trip:
// stamp a learner message, then show it to another learner.
$roundtrip = $msg($LEARNER_A, PQ_Gate_Harness::support_message_visibility_for($groupthread, $LEARNER_A, true));
$check("ROUND TRIP: stamped by one half, refused by the other",
    !PQ_Gate_Harness::support_message_visible_to_user($roundtrip, $groupthread, $LEARNER_B));

echo "\n{$pass} passed, {$fail} failed\n";
if ($fail > 0) {
    exit(1);
}
echo "✓ the classroom room stays inside \"no student-to-student messaging\".\n";
