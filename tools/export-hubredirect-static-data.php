<?php
// P2.3 — exports local_hubredirect's four static datasets (shipped today as PHP
// arrays) to JSON for the platform SPA on Bunny. Pure data files: only the
// MOODLE_INTERNAL guard stands between them and a plain include, so we satisfy
// it and json_encode the returned arrays.
//
// Usage:  php tools/export-hubredirect-static-data.php
// Output: src/platform-data/{country_cities,country_timezones,
//         student_intake_config,teacher_intake_config}.json
// Deploy: upload src/platform-data/*.json to the Bunny storage zone under
//         platform/data/ (see docs/hubredirect-triage.md).

define('MOODLE_INTERNAL', true);

$root = dirname(__DIR__);
$src = $root . '/src/moodle/local_hubredirect';
$out = $root . '/src/platform-data';
if (!is_dir($out)) {
    mkdir($out, 0777, true);
}

$files = ['country_cities', 'country_timezones', 'student_intake_config', 'teacher_intake_config'];
foreach ($files as $name) {
    $data = require $src . '/' . $name . '.php';
    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    if ($json === false) {
        fwrite(STDERR, "FAIL {$name}: " . json_last_error_msg() . "\n");
        exit(1);
    }
    file_put_contents($out . '/' . $name . '.json', $json . "\n");
    $keys = is_array($data) ? count($data, COUNT_RECURSIVE) : 0;
    echo str_pad($name . '.json', 30) . ' ' . str_pad((string)strlen($json), 8, ' ', STR_PAD_LEFT) . " bytes  ({$keys} nodes)\n";
}
echo "done → src/platform-data/\n";
