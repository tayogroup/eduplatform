<?php
/**
 * The per-course launch override, exercised on the shipped bytes.
 *
 * progress_gatewaylib.php sits behind MOODLE_INTERNAL and pulls in Moodle, so
 * this extracts pqpg_ehel_app_base() and pqpg_ehel_subject_map() by brace
 * counting and runs THOSE, with get_config() stubbed. A retyped copy of the
 * logic would pass while the deployed file was broken - the same reason
 * check-class-group-chat.php extracts rather than includes.
 *
 * Run: php tools/check-ehel-app-url-override.php
 */

$src = file_get_contents(__DIR__ . '/../src/moodle/local_prequran/progress_gatewaylib.php');
if ($src === false) {
    fwrite(STDERR, "cannot read progress_gatewaylib.php\n");
    exit(2);
}

/** Pull one function's whole text out of the file by counting braces. */
function extract_fn(string $src, string $name): string {
    $at = strpos($src, 'function ' . $name . '(');
    if ($at === false) {
        fwrite(STDERR, "extract failed: {$name}() not found - the gate cannot read its target\n");
        exit(2);
    }
    $open = strpos($src, '{', $at);
    $depth = 0;
    for ($i = $open; $i < strlen($src); $i++) {
        if ($src[$i] === '{') { $depth++; }
        elseif ($src[$i] === '}') { $depth--; if ($depth === 0) { return substr($src, $at, $i - $at + 1); } }
    }
    fwrite(STDERR, "extract failed: {$name}() has unbalanced braces\n");
    exit(2);
}

$GLOBALS['STUB_CONFIG'] = [];
function get_config($plugin, $name) {
    $key = $plugin . '/' . $name;
    return array_key_exists($key, $GLOBALS['STUB_CONFIG']) ? $GLOBALS['STUB_CONFIG'][$key] : false;
}

eval(extract_fn($src, 'pqpg_ehel_subject_map'));
eval(extract_fn($src, 'pqpg_ehel_app_base'));

$fails = 0;
function ok(string $label, bool $cond, $detail = null) {
    global $fails;
    if ($cond) { echo "  ok   {$label}\n"; return; }
    $fails++;
    echo "  FAIL {$label}" . ($detail === null ? '' : '  -> ' . var_export($detail, true)) . "\n";
}
function set_override($json) { $GLOBALS['STUB_CONFIG']['local_prequran/ehel_app_url_overrides'] = $json; }

$DEFAULT_M = 'https://ehelacademy.b-cdn.net/Ehel%20Primary/app/mathematics/index.html';
$PREVIEW = 'https://ehelacademy.b-cdn.net/Ehel%20Primary/app/mathematics/grade-1-preview/index.html';

echo "No override set - every course launches at its subject entry:\n";
set_override(false);
ok('math g01 falls back to the subject entry', pqpg_ehel_app_base('ehel-math-g01')['appurl'] === $DEFAULT_M, pqpg_ehel_app_base('ehel-math-g01')['appurl']);
ok('math g02 unaffected', pqpg_ehel_app_base('ehel-math-g02')['appurl'] === $DEFAULT_M);
ok('english unaffected', strpos(pqpg_ehel_app_base('ehel-eng-g01')['appurl'], '/app/english/') !== false);
ok('stage still parsed from the key', pqpg_ehel_app_base('ehel-math-g01')['stage'] === 1);
ok('level param is stage for maths', pqpg_ehel_app_base('ehel-math-g01')['levelparam'] === 'stage');

echo "\nGrade 1 maths pointed at the preview build:\n";
set_override(json_encode(['ehel-math-g01' => $PREVIEW]));
ok('math g01 goes to the preview', pqpg_ehel_app_base('ehel-math-g01')['appurl'] === $PREVIEW, pqpg_ehel_app_base('ehel-math-g01')['appurl']);
ok('math g02 STILL goes to the subject entry', pqpg_ehel_app_base('ehel-math-g02')['appurl'] === $DEFAULT_M, pqpg_ehel_app_base('ehel-math-g02')['appurl']);
ok('math g08 STILL goes to the subject entry', pqpg_ehel_app_base('ehel-math-g08')['appurl'] === $DEFAULT_M);
ok('english g01 STILL goes to english', strpos(pqpg_ehel_app_base('ehel-eng-g01')['appurl'], '/app/english/') !== false);
ok('the stage is unchanged by the override', pqpg_ehel_app_base('ehel-math-g01')['stage'] === 1);

echo "\nA bad value is ignored, not launched:\n";
set_override(json_encode(['ehel-math-g01' => 'https://evil.example/steal.html']));
ok('another host is refused', pqpg_ehel_app_base('ehel-math-g01')['appurl'] === $DEFAULT_M, pqpg_ehel_app_base('ehel-math-g01')['appurl']);
set_override(json_encode(['ehel-math-g01' => 'http://ehelacademy.b-cdn.net/x.html']));
ok('plain http is refused', pqpg_ehel_app_base('ehel-math-g01')['appurl'] === $DEFAULT_M);
set_override(json_encode(['ehel-math-g01' => 'https://ehelacademy.b-cdn.net.evil.example/x.html']));
ok('a look-alike host is refused', pqpg_ehel_app_base('ehel-math-g01')['appurl'] === $DEFAULT_M, pqpg_ehel_app_base('ehel-math-g01')['appurl']);
set_override('{not json');
ok('malformed JSON is ignored', pqpg_ehel_app_base('ehel-math-g01')['appurl'] === $DEFAULT_M);
set_override(json_encode(['ehel-math-g01' => ['nested' => 'thing']]));
ok('a non-string value is ignored', pqpg_ehel_app_base('ehel-math-g01')['appurl'] === $DEFAULT_M);
set_override(json_encode(['ehel-math-g01' => '']));
ok('an empty value is ignored', pqpg_ehel_app_base('ehel-math-g01')['appurl'] === $DEFAULT_M);
set_override('   ');
ok('whitespace is ignored', pqpg_ehel_app_base('ehel-math-g01')['appurl'] === $DEFAULT_M);

echo "\nA key that is not a course still resolves to nothing:\n";
set_override(json_encode(['nonsense' => $PREVIEW]));
ok('an unknown subject is still null', pqpg_ehel_app_base('ehel-nope-g01') === null);
ok('a wrong stage letter is still null', pqpg_ehel_app_base('ehel-math-l01') === null);

echo "\n" . ($fails ? "{$fails} FAILURE(S)\n" : "all checks passed\n");
exit($fails ? 1 : 0);
