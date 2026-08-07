<?php
// CLI: import learning objectives from the Bunny content tree into Moodle.
//
// The content JSON has always carried rich per-unit outcomes — learning outcome,
// Bloom level, evidence of learning — but nothing ever read them into the
// platform, so "what your child will learn" was answerable only by opening a
// lesson. This pulls them into local_prequran_objective, which is what the
// syllabus, objective coverage and curriculum reporting all read.
//
// Reads the SAME files the learner app reads, so there is one source of truth:
//   <base>/<subject>/g<NN>/course-manifest.json   -> the unit list
//   <base>/<subject>/g<NN>/units/unit-<N>.json    -> outcomes[]
//
// Idempotent: objectives upsert by (courseid, objective_code), so re-running
// after a content edit updates in place rather than duplicating.
//
//   php local/prequran/cli/import_objectives.php --workspaceid=16 --dry-run
//   php local/prequran/cli/import_objectives.php --workspaceid=16
//   php local/prequran/cli/import_objectives.php --workspaceid=16 --course=ehel-eng-g01

define('CLI_SCRIPT', true);
require(__DIR__ . '/../../../config.php');
require_once($CFG->libdir . '/clilib.php');
require_once($CFG->libdir . '/filelib.php'); // Moodle's \curl lives here.
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/content_authoring_portallib.php');
// For pqpg_ehel_app_base — the one definition of which course keys are EHEL
// courses and which content directory each maps to.
require_once($CFG->dirroot . '/local/prequran/progress_gatewaylib.php');

[$options] = cli_get_params([
    'help' => false,
    'workspaceid' => 0,
    'course' => '',
    'base' => 'https://ehelacademy.b-cdn.net/Ehel%20Primary/content',
    'dry-run' => false,
], ['h' => 'help']);

if ($options['help'] || (int)$options['workspaceid'] <= 0) {
    cli_writeln("Import learning objectives from the content tree into Moodle.");
    cli_writeln("  --workspaceid=N   REQUIRED. The workspace these courses belong to.");
    cli_writeln("  --course=IDNUM    Just this course (default: every EHEL catalog course).");
    cli_writeln("  --base=URL        Content root (default: the Ehel Bunny pull zone).");
    cli_writeln("  --dry-run         Report what would be imported, write nothing.");
    exit((int)$options['workspaceid'] > 0 ? 0 : 1);
}

$workspaceid = (int)$options['workspaceid'];
$dryrun = !empty($options['dry-run']);
$base = rtrim((string)$options['base'], '/');

// Which courses? Either the one named, or every catalog course on this site.
// The pattern is deliberately just 'ehel-%': it used to be 'ehel-%-g%', which
// cannot match Intensive English's ehel-intensive-eng-lNN and so silently
// imported no objectives for that subject at all. Anything the pattern over-
// fetches (a unit idnumber, say) is rejected by pqpg_ehel_app_base below, so
// the wider net costs a few discarded rows and nothing else.
if (trim((string)$options['course']) !== '') {
    $courses = $DB->get_records('course', ['idnumber' => trim((string)$options['course'])], '', 'id,idnumber,fullname');
} else {
    $courses = $DB->get_records_select('course',
        $DB->sql_like('idnumber', ':pat'), ['pat' => 'ehel-%'], 'idnumber ASC', 'id,idnumber,fullname');
}
if (!$courses) {
    cli_error('No matching courses found.');
}

/** Fetch a JSON document, or null. */
function pqio_fetch_json(string $url): ?array {
    $curl = new \curl();
    $body = $curl->get($url, [], ['CURLOPT_TIMEOUT' => 25, 'CURLOPT_CONNECTTIMEOUT' => 10]);
    $info = $curl->get_info();
    if ((int)($info['http_code'] ?? 0) !== 200 || !is_string($body) || $body === '') {
        return null;
    }
    $decoded = json_decode($body, true);
    return is_array($decoded) ? $decoded : null;
}

$totalcourses = 0;
$totalunits = 0;
$totalobjectives = 0;
$unreadable = 0;
$skipped = [];

foreach ($courses as $course) {
    $idnumber = (string)$course->idnumber;
    // One definition of what an EHEL course key is, shared with the launch
    // path. This used to be a regex naming English, Mathematics and Science,
    // which is why Computing, Global Perspectives and Intensive English had no
    // objectives in the syllabus or coverage reports — they were skipped here
    // without a word, indistinguishable from having none authored.
    $pqio_base = pqpg_ehel_app_base($idnumber);
    if ($pqio_base === null) {
        continue;
    }
    $subject = $pqio_base['subjectdir'];
    // Always 'g' + two digits, for every subject. Intensive English keeps its
    // stages in level-N/ locally, but upload-content-to-bunny.js publishes it
    // to content/intensive-english/gNN/ like all the others, so the REMOTE
    // directory is g-prefixed even where the local one is not.
    $gradedir = 'g' . str_pad((string)$pqio_base['stage'], 2, '0', STR_PAD_LEFT);
    $courseroot = $base . '/' . $subject . '/' . $gradedir;

    $manifest = pqio_fetch_json($courseroot . '/course-manifest.json');
    if ($manifest === null || empty($manifest['units']) || !is_array($manifest['units'])) {
        $skipped[] = $idnumber . ' (no manifest at ' . $courseroot . ')';
        continue;
    }

    $totalcourses++;
    $courseobjectives = 0;
    cli_writeln($idnumber . '  ' . (string)$course->fullname);

    foreach ($manifest['units'] as $unitentry) {
        if (!is_array($unitentry)) {
            continue;
        }
        // The manifest's data path is repo-relative (./data/units/unit-N.json);
        // the deployed tree drops the data/ prefix, so use the basename.
        $file = basename((string)($unitentry['data'] ?? ''));
        if ($file === '') {
            $file = 'unit-' . (int)($unitentry['number'] ?? 0) . '.json';
        }
        $unitdoc = pqio_fetch_json($courseroot . '/units/' . $file);
        if ($unitdoc === null) {
            cli_writeln('   ! could not read ' . $file);
            continue;
        }

        // Prefer the unit document's own identity over the manifest's.
        $unitmeta = is_array($unitdoc['unit'] ?? null) ? $unitdoc['unit'] : [];
        $unitno = array_key_exists('unitNo', $unitmeta)
            ? (int)$unitmeta['unitNo'] : (int)($unitentry['number'] ?? 0);
        $unittitle = trim((string)($unitmeta['unitTitle'] ?? ($unitentry['title'] ?? '')));

        $outcomes = is_array($unitdoc['outcomes'] ?? null) ? $unitdoc['outcomes'] : [];
        if (!$outcomes) {
            continue;
        }
        $totalunits++;

        $seq = 0;
        foreach ($outcomes as $outcome) {
            $seq++;
            // THREE shapes in the wild, and every one of them is authored, not
            // a mistake to normalise away:
            //   * English and Intensive English — rich objects carrying their
            //     own globally unique outcomeId.
            //   * Maths, Science and Computing — a bare string, no id at all.
            //   * Global Perspectives — {id, text}, where the id is only
            //     'lo01'.. and RESTARTS IN EVERY UNIT.
            // Support all three rather than silently importing nothing: a shape
            // this loop does not recognise still counts toward the "N outcomes"
            // the run prints, so an unhandled one reads as success.
            if (is_string($outcome)) {
                $text = trim($outcome);
                // No id in the source, so synthesise a stable one from position.
                // Position survives the common case (fixing wording); it does
                // shift if units are re-ordered, which would orphan old rows.
                $code = $idnumber . '-u' . str_pad((string)$unitno, 2, '0', STR_PAD_LEFT)
                    . '-lo' . str_pad((string)$seq, 2, '0', STR_PAD_LEFT);
                $outcome = ['sequence' => $seq];
            } else if (is_array($outcome) && isset($outcome['text'])) {
                // Global Perspectives. The id is unit-local ('lo01' in unit 1
                // AND unit 2 AND every other), so it MUST be qualified by the
                // unit before it can key anything: objectives upsert by
                // (courseid, objective_code), so the raw id would collapse a
                // whole course into seven rows, each overwritten by the next
                // unit. Same synthesised shape the bare-string branch uses.
                $rawid = trim((string)($outcome['id'] ?? ''));
                if ($rawid === '') {
                    $rawid = 'lo' . str_pad((string)$seq, 2, '0', STR_PAD_LEFT);
                }
                $code = $idnumber . '-u' . str_pad((string)$unitno, 2, '0', STR_PAD_LEFT) . '-' . $rawid;
                $text = trim((string)$outcome['text']);
            } else if (is_array($outcome)) {
                $code = trim((string)($outcome['outcomeId'] ?? ''));
                $text = trim((string)($outcome['learningOutcome'] ?? ''));
            } else {
                continue;
            }
            if ($code === '' || $text === '') {
                // Counted and reported, never dropped in silence. An outcome
                // shape nobody has taught this loop about lands here, and
                // without the count the run prints "N outcome(s)" per unit and
                // "0 objectives" at the end while looking like it worked.
                $unreadable++;
                continue;
            }
            if (!$dryrun) {
                // The operator asserted the workspace on the command line, so
                // this writes through the raw upsert rather than the portal's
                // membership-checked entry point.
                pqcon_store_objective($workspaceid, 0, [
                    'courseid' => (int)$course->id,
                    'course_idnumber' => $idnumber,
                    'unit_number' => $unitno,
                    'unit_title' => $unittitle,
                    'objective_code' => $code,
                    'sequence' => (int)($outcome['sequence'] ?? $seq),
                    'learning_outcome' => $text,
                    'bloom_level' => (string)($outcome['bloomLevel'] ?? ''),
                    'evidence' => (string)($outcome['evidenceOfLearning'] ?? ''),
                    'framework_code' => (string)($outcome['frameworkCode'] ?? ''),
                ]);
            }
            $courseobjectives++;
            $totalobjectives++;
        }
        cli_writeln('   unit ' . $unitno . ' · ' . $unittitle . ' — ' . count($outcomes) . ' outcome(s)');
    }
    cli_writeln('   => ' . $courseobjectives . ' objectives' . ($dryrun ? ' (dry run)' : ''));
}

cli_writeln('');
cli_writeln('Courses: ' . $totalcourses . ' · units with outcomes: ' . $totalunits
    . ' · objectives: ' . $totalobjectives . ($dryrun ? '  [DRY RUN — nothing written]' : ''));
if ($unreadable > 0) {
    cli_writeln('WARNING: ' . $unreadable . ' outcome(s) were read but could not be imported —'
        . ' no usable code or text. That usually means a subject authors a shape this'
        . ' importer does not know yet; check its units/unit-*.json before trusting the count above.');
}
foreach ($skipped as $s) {
    cli_writeln('skipped: ' . $s);
}
