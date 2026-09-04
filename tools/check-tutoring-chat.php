<?php
// Gate for the tutoring chat (owner, 2026-09-05): the classroom chat for the
// tutoring category, one thread per learner per subject with the subject's
// teacher group (a cohort) on the other side.
//
// It asserts the rules that keep the room safe and that nothing else reads:
//   1. the learner door derives the SUBJECT from the launch token's course
//      claim and never from the payload -- a subject in the body would let any
//      token read any subject's thread;
//   2. an attachment's type is proven by MAGIC BYTES for every accepted type,
//      never taken from the client's mime, and each type has a cap;
//   3. the file fetch re-runs BOTH the thread and the message visibility
//      checks -- a bubble and its bytes cannot diverge in who may see them;
//   4. the tutor door resolves the cohort from the THREAD row, never from the
//      request;
//   5. every subject slug the app launches has a cohort name, and the six
//      names are the ones the owner gave.
//
//   php tools/check-tutoring-chat.php

declare(strict_types=1);

$root = __DIR__ . '/../src/moodle/';
$read = static function (string $rel) use ($root): string {
    $src = @file_get_contents($root . $rel);
    if ($src === false) {
        fwrite(STDERR, "FAIL: cannot read {$rel}\n");
        exit(2);
    }
    return $src;
};
$ext = $read('local_prequran/externallib_v4.php');
$door = $read('local_hubredirect/course_group_chat.php');
$tutordoor = $read('local_hubredirect/tutoring_inbox_data.php');
$lib = $read('local_hubredirect/tutoring_chatlib.php');

$failures = 0;
$ok = static function (string $label): void { echo "  ok   {$label}\n"; };
$fail = static function (string $label, string $why) use (&$failures): void {
    $failures++;
    echo "  FAIL {$label}\n       {$why}\n";
};

/** Extract one static function's full body by brace counting. */
function tut_extract_fn(string $src, string $name): ?string {
    $at = strpos($src, "static function {$name}(");
    if ($at === false) {
        return null;
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
    return null;
}

// 1. The subject comes from the token.
if (preg_match('/pqpg_tutoring_subject\(\(string\)\(\$claims\[\'course\'\]/', $door)) {
    $ok('learner door derives the subject from the token\'s course claim');
} else {
    $fail('learner door derives the subject from the token\'s course claim', 'course_group_chat.php no longer calls pqpg_tutoring_subject() on $claims[\'course\']');
}
if (preg_match('/\$payload\[\'(subject|slug|cohort|cohortid|studentid)\'\]/', $door)) {
    $fail('learner door never reads a subject or learner id from the payload', 'a subject in the body would let any token read any subject\'s thread');
} else {
    $ok('learner door never reads a subject or learner id from the payload');
}

// 2. Magic bytes for every accepted type, and a cap per type.
$check = tut_extract_fn($ext, 'tutoring_chat_check_attachment');
if ($check === null) {
    fwrite(STDERR, "FAIL: could not extract tutoring_chat_check_attachment() -- renamed or removed.\n");
    exit(2);
}
foreach ([
    'jpeg' => '"\\xFF\\xD8"',
    'png' => '"\\x89PNG"',
    'pdf' => "'%PDF'",
    'zip (docx/pptx)' => '"PK\\x03\\x04"',
] as $type => $magic) {
    if (strpos($check, $magic) !== false) {
        $ok("attachment type {$type} is proven by magic bytes");
    } else {
        $fail("attachment type {$type} is proven by magic bytes", "the magic {$magic} is gone from tutoring_chat_check_attachment()");
    }
}
if (preg_match('/in_array\(\$ext, \[\'docx\', \'pptx\'\], true\)/', $check)) {
    $ok('a zip is accepted only under a .docx or .pptx name');
} else {
    $fail('a zip is accepted only under a .docx or .pptx name', 'any zip would be stored as a document');
}
if (strpos($check, "\$attachment['type']") !== false || strpos($check, '$attachment["type"]') !== false) {
    $fail('the client\'s declared mime is never consulted', 'tutoring_chat_check_attachment() reads $attachment[\'type\']');
} else {
    $ok('the client\'s declared mime is never consulted');
}
if (strpos($check, 'TUTORING_CHAT_IMAGE_MAX_BYTES') !== false && strpos($check, 'TUTORING_CHAT_DOC_MAX_BYTES') !== false) {
    $ok('images and documents each have a size cap');
} else {
    $fail('images and documents each have a size cap', 'one of the two caps is no longer applied');
}

// 3. The file fetch re-runs both visibility checks.
$fetch = tut_extract_fn($ext, 'tutoring_chat_file');
if ($fetch === null) {
    fwrite(STDERR, "FAIL: could not extract tutoring_chat_file() -- renamed or removed.\n");
    exit(2);
}
if (strpos($fetch, 'support_can_read_thread_as(') !== false && strpos($fetch, 'support_message_visible_to_user(') !== false) {
    $ok('a stored file is served only through both visibility checks');
} else {
    $fail('a stored file is served only through both visibility checks', 'tutoring_chat_file() dropped one of them');
}
if (preg_match('/\'tutoring_chat_file\'/', $ext) && !preg_match('/pluginfile|moodle_url::make_pluginfile_url/', $fetch)) {
    $ok('no public URL is minted for a stored file');
} else {
    $fail('no public URL is minted for a stored file', 'a pluginfile URL would bypass the doors');
}

// 4. The tutor door trusts the thread row, not the request.
if (strpos($tutordoor, '(int)$cohort->id === (int)$thread->cohortid') !== false
        && strpos($tutordoor, "['id' => \$threadid, 'type' => 'tutoring']") !== false) {
    $ok('tutor door resolves the subject from the thread row');
} else {
    $fail('tutor door resolves the subject from the thread row', 'tutoring_inbox_data.php no longer matches the thread\'s cohort against the caller\'s cohorts');
}
if (preg_match('/optional_param\(\'(slug|subject|cohortid|studentid)\'/', $tutordoor)) {
    $fail('tutor door never takes a subject or learner from the request', 'a tutor could name a subject they are not in');
} else {
    $ok('tutor door never takes a subject or learner from the request');
}
if (strpos($tutordoor, 'require_sesskey();') !== false && strpos($tutordoor, 'require_login();') !== false) {
    $ok('tutor door is session + sesskey');
} else {
    $fail('tutor door is session + sesskey', 'one of require_login / require_sesskey is gone');
}

// 5. The cohort map covers the six subjects with the owner's names.
$expected = [
    'eng' => 'english_tutoring', 'math' => 'math_tutoring', 'sci' => 'science_tutoring',
    'comp' => 'computing_tutoring', 'gp' => 'global_perspectives_tutoring', 'intensive-eng' => 'intensive_english_tutoring',
];
foreach ($expected as $slug => $idnumber) {
    if (preg_match('/\'' . preg_quote($slug, '/') . '\' => \'' . preg_quote($idnumber, '/') . '\'/', $lib)) {
        $ok("cohort for {$slug} is {$idnumber}");
    } else {
        $fail("cohort for {$slug} is {$idnumber}", 'the map in tutoring_chatlib.php changed -- the cohorts on the server are keyed by these idnumbers');
    }
}

echo "\n" . (count($expected) + 15 - $failures) . " passed, {$failures} failed\n";
if ($failures > 0) {
    exit(1);
}
echo "✓ the tutoring chat keeps the subject on the token, the type on the bytes, and the file behind the doors.\n";
