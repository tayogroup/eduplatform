<?php
// Behavioural gate for the tutoring server rules: the stage a tutoring
// learner's ±2 help window is drawn around (per subject), which subjects their
// launch token offers, and which one the single "Tutor Me" card opens.
//
// Why a gate at all. The anchor is ONE NUMBER that decides which five stages of
// a subject a search can reach (shell/get-help.js :: windowStages), and it is
// resolved server-side from three sources with a precedence between them. Get
// the precedence wrong and nothing fails: the learner gets a working search over
// the wrong five stages, which reads as "Ehel does not teach this" rather than
// as a bug. There is no page that can look wrong, so only behaviour can check it.
//
// It loads the REAL progress_gatewaylib.php and calls its real functions against
// a stub $DB. A copy of the resolution here would pass while the shipped code
// was broken — the failure this repo has been bitten by before.
//
// MUTATION-TESTED. Each invariant was broken in turn and this had to fail; the
// list is at the bottom of this file, with what each mutation would have shipped.
//
//   npm run check:tutoring-anchor
//   php tools/check-tutoring-anchor.php

declare(strict_types=1);

// --- Moodle stand-ins ------------------------------------------------------
// Just enough for progress_gatewaylib.php to LOAD and for the anchor chain to
// run. Nothing here reimplements anything the gate asserts on: the stubs answer
// "what is in the database", which is the gate's INPUT, never its logic.
define('MOODLE_INTERNAL', true);
define('IGNORE_MISSING', 0);

class xmldb_table {
    public $name;
    public function __construct(string $name) { $this->name = $name; }
}

/** The rows this run pretends the database holds. Set per scenario. */
class fake_db {
    public $anchors = [];        // "userid:subject" => stage
    public $profiles = [];       // userid => current_grade (free text)
    public $tables = ['local_prequran_tutoring_anchor' => true, 'local_prequran_student_profile' => true];
    public $throwon = '';        // table name whose read blows up

    public function get_manager() {
        return new class($this) {
            private $db;
            public function __construct($db) { $this->db = $db; }
            public function table_exists($table) { return !empty($this->db->tables[$table->name]); }
        };
    }

    public function get_field(string $table, string $field, array $conditions, int $strictness = 0) {
        if ($this->throwon === $table) {
            throw new RuntimeException('simulated database failure');
        }
        if ($table === 'local_prequran_tutoring_anchor') {
            $key = $conditions['userid'] . ':' . $conditions['subject'];
            return $this->anchors[$key] ?? false;
        }
        if ($table === 'local_prequran_student_profile') {
            return $this->profiles[$conditions['userid']] ?? false;
        }
        return false;
    }
}

/** The stubbed learner's last-opened tutoring subject, per userid. */
$PREFS = [];
function get_user_preferences(string $name, $default = null, $user = null) {
    global $PREFS;
    if ($name !== 'local_prequran_tutoring_subject') {
        return $default;
    }
    return $PREFS[(int)$user] ?? $default;
}

/** Courses the stubbed learner is enrolled in — idnumbers only. */
$ENROLMENTS = [];
function enrol_get_users_courses(int $userid, bool $onlyactive = false, string $fields = '') {
    global $ENROLMENTS;
    $out = [];
    foreach (($ENROLMENTS[$userid] ?? []) as $i => $idnumber) {
        $out[$i] = (object)['idnumber' => $idnumber];
    }
    return $out;
}

$libdir = sys_get_temp_dir() . '/ehel-tutoring-anchor-libdir';
if (!is_dir($libdir)) {
    mkdir($libdir, 0777, true);
}
// pqpg_tutoring_subjects() opens with require_once($CFG->libdir.'/enrollib.php').
// enrol_get_users_courses is already declared above, so libdir only has to hold
// a file that exists — an empty one satisfies the require without shadowing it.
file_put_contents($libdir . '/enrollib.php', "<?php\n// stub: the gate declares enrol_get_users_courses itself\n");
$CFG = new stdClass();
$CFG->libdir = $libdir;

$target = __DIR__ . '/../src/moodle/local_prequran/progress_gatewaylib.php';
if (!file_exists($target)) {
    fwrite(STDERR, "✗ cannot find progress_gatewaylib.php at $target\n");
    exit(2);
}
require($target);

// The gate must be testing the real thing. A rename or a signature change turns
// every assertion below into a fatal error rather than a quiet pass, but the
// SUBJECT MAP is the one that could go missing silently — pqpg_tutoring_stage
// would still resolve, and clamping would fall through to its unknown-slug
// floor of 1-8, which is right for five subjects out of six.
foreach (['pqpg_tutoring_stage', 'pqpg_tutoring_anchor', 'pqpg_tutoring_declared_stage',
          'pqpg_tutoring_clamp_stage', 'pqpg_tutoring_subjects', 'pqpg_ehel_subject_map',
          'pqpg_ehel_subject_slugs', 'pqpg_tutoring_subject', 'pqpg_tutoring_resume_subject'] as $fn) {
    if (!function_exists($fn)) {
        fwrite(STDERR, "✗ $fn() is gone — this gate is not testing what it claims to.\n");
        exit(2);
    }
}
$map = pqpg_ehel_subject_map();
if (count(pqpg_ehel_subject_slugs()) !== 6) {
    fwrite(STDERR, "✗ expected 6 real subjects, found " . count(pqpg_ehel_subject_slugs()) . " — the map or its alias handling moved.\n");
    exit(2);
}

$DB = new fake_db();
$pass = 0;
$fail = 0;
function check(string $name, $got, $want): void {
    global $pass, $fail;
    $g = json_encode($got);
    $w = json_encode($want);
    if ($g === $w) {
        $pass++;
        printf("  ok   %s\n", $name);
    } else {
        $fail++;
        printf("  FAIL %s\n         got  %s\n         want %s\n", $name, $g, $w);
    }
}
/** Reset the stubbed world, then describe it. */
function world(array $profiles = [], array $anchors = [], array $enrolments = [], ?array $tables = null, string $throwon = ''): void {
    global $DB, $ENROLMENTS;
    $DB->profiles = $profiles;
    $DB->anchors = $anchors;
    $DB->tables = $tables ?? ['local_prequran_tutoring_anchor' => true, 'local_prequran_student_profile' => true];
    $DB->throwon = $throwon;
    $ENROLMENTS = $enrolments;
}

echo "the declared school year, when nobody has set an anchor\n";
world([7 => 'Grade 4']);
check('a school-year subject anchors on the declared year', pqpg_tutoring_stage(7, 'math'), 4);
check('the year is read out of free text', pqpg_tutoring_stage(7, 'sci'), 4);
world([7 => 'Year 6']);
check('"Year 6" reads the same as "Grade 6"', pqpg_tutoring_stage(7, 'eng'), 6);
world([7 => '']);
check('no profile anchors mid-range, not at stage 1', pqpg_tutoring_stage(7, 'eng'), 4);
world([]);
check('no profile ROW anchors mid-range too', pqpg_tutoring_stage(7, 'comp'), 4);

echo "\nIntensive English is a CEFR axis, not a school year\n";
world([7 => 'Grade 6']);
check('the declared year is ignored — level 1, not level 6', pqpg_tutoring_stage(7, 'intensive-eng'), 1);
world([7 => 'Grade 2']);
check('and ignored when it would have been in range', pqpg_tutoring_stage(7, 'intensive-eng'), 1);

echo "\nGlobal Perspectives stage 5 is withdrawn\n";
world([7 => 'Grade 5']);
check('a year-5 child anchors at 6, not on the withdrawal notice', pqpg_tutoring_stage(7, 'gp'), 6);
check('and every other subject still anchors at 5', pqpg_tutoring_stage(7, 'math'), 5);

echo "\nan explicit anchor, which is the whole point of the table\n";
world([7 => 'Grade 3'], ['7:math' => 6]);
check('the anchored subject uses its anchor', pqpg_tutoring_stage(7, 'math'), 6);
check('and the OTHER subjects are untouched by it', pqpg_tutoring_stage(7, 'eng'), 3);
check('one learner can be two levels at once', [pqpg_tutoring_stage(7, 'math'), pqpg_tutoring_stage(7, 'eng')], [6, 3]);
world([7 => 'Grade 3'], ['8:math' => 6]);
check('an anchor belongs to ONE learner', pqpg_tutoring_stage(7, 'math'), 3);
world([7 => 'Grade 3'], ['7:intensive-eng' => 2]);
check('an anchor beats the Intensive English default', pqpg_tutoring_stage(7, 'intensive-eng'), 2);
world([7 => 'Grade 3'], ['7:math' => 0]);
check('a zero anchor is "unset", not stage 0', pqpg_tutoring_stage(7, 'math'), 3);

echo "\nan anchor is still held inside the stages the subject publishes\n";
world([7 => 'Grade 3'], ['7:intensive-eng' => 7]);
check('above Intensive English\'s two levels clamps to 2', pqpg_tutoring_stage(7, 'intensive-eng'), 2);
world([7 => 'Grade 3'], ['7:math' => 44]);
check('above stage 8 clamps to 8', pqpg_tutoring_stage(7, 'math'), 8);
world([7 => 'Grade 3'], ['7:math' => -2]);
check('a negative anchor falls through to the declared year', pqpg_tutoring_stage(7, 'math'), 3);
world([7 => 'Grade 3'], ['7:gp' => 5]);
check('the withdrawn stage is skipped for an EXPLICIT anchor too', pqpg_tutoring_stage(7, 'gp'), 6);

echo "\nit ships dark: no table, no change\n";
world([7 => 'Grade 6'], ['7:math' => 2], [], ['local_prequran_student_profile' => true]);
check('before the upgrade runs, the declared year answers exactly as it did',
    [pqpg_tutoring_stage(7, 'math'), pqpg_tutoring_stage(7, 'eng'), pqpg_tutoring_stage(7, 'intensive-eng')],
    [6, 6, 1]);
world([7 => 'Grade 6'], ['7:math' => 2], [], null, 'local_prequran_tutoring_anchor');
check('an unreadable anchor table falls back rather than throwing', pqpg_tutoring_stage(7, 'math'), 6);
world([7 => 'Grade 6'], [], [], null, 'local_prequran_student_profile');
check('an unreadable profile falls back to mid-range rather than throwing', pqpg_tutoring_stage(7, 'math'), 4);

echo "\nthe subject picker is derived from ENROLMENT\n";
world([7 => 'Grade 4'], [], [7 => ['ehel-tutoring-eng', 'ehel-tutoring-gp']]);
$subjects = pqpg_tutoring_subjects(7);
check('only the subjects the learner is enrolled in are offered',
    array_column($subjects, 'subject'), ['eng', 'gp']);
check('each carries its own anchor stage', array_column($subjects, 'stage'), [4, 4]);
check('and the course key the picker opens', array_column($subjects, 'course'),
    ['ehel-tutoring-eng', 'ehel-tutoring-gp']);
check('with the subject\'s own stage word', array_column($subjects, 'stageWord'), ['Grade', 'Stage']);
world([7 => 'Grade 4'], [], [7 => ['ehel-tutoring-gp', 'ehel-tutoring-eng']]);
check('offer order is the subject table\'s, not the enrolment query\'s',
    array_column(pqpg_tutoring_subjects(7), 'subject'), ['eng', 'gp']);
world([7 => 'Grade 4'], [], [7 => ['ehel-eng-g04', 'ehel-tutoring-math', 'moodle_12', '']]);
check('an ordinary course enrolment is not a tutoring subject',
    array_column(pqpg_tutoring_subjects(7), 'subject'), ['math']);
world([7 => 'Grade 4'], [], [7 => ['ehel-tutoring-intensive-eng', 'ehel-tutoring-ien']]);
check('the ien alias never draws Intensive English twice',
    array_column(pqpg_tutoring_subjects(7), 'subject'), ['intensive-eng']);
world([7 => 'Grade 5'], ['7:math' => 7], [7 => ['ehel-tutoring-math', 'ehel-tutoring-gp', 'ehel-tutoring-intensive-eng']]);
check('the picker reports the SAME stages the launch would open',
    array_column(pqpg_tutoring_subjects(7), 'stage'),
    [pqpg_tutoring_stage(7, 'math'), pqpg_tutoring_stage(7, 'gp'), pqpg_tutoring_stage(7, 'intensive-eng')]);
check('...which are the anchored, withdrawn-skipped and CEFR answers', array_column(pqpg_tutoring_subjects(7), 'stage'), [7, 6, 1]);
world([7 => 'Grade 4'], [], []);
check('no tutoring enrolment offers nothing — an empty list, not null', pqpg_tutoring_subjects(7), []);

echo "\nwhich subject the single \"Tutor Me\" card opens\n";
world([7 => 'Grade 4']);
$PREFS = [];
check('with no preference, the first subject the table lists',
    pqpg_tutoring_resume_subject(7, ['gp', 'math', 'eng']), 'eng');
check('...which is the table\'s order, not the order it was handed',
    pqpg_tutoring_resume_subject(7, ['gp', 'math']), 'math');
$PREFS = [7 => 'gp'];
check('the last-opened subject resumes', pqpg_tutoring_resume_subject(7, ['gp', 'math', 'eng']), 'gp');
check('a preference for a subject they are no longer enrolled in is ignored',
    pqpg_tutoring_resume_subject(7, ['math', 'eng']), 'eng');
$PREFS = [7 => 'not-a-subject'];
check('a junk preference falls back rather than opening nothing',
    pqpg_tutoring_resume_subject(7, ['math']), 'math');
$PREFS = [7 => 'math'];
check('one learner\'s preference is not another\'s', pqpg_tutoring_resume_subject(8, ['gp', 'eng']), 'eng');
$PREFS = [];
check('no tutoring enrolment opens nothing — the caller draws no card',
    pqpg_tutoring_resume_subject(7, []), '');

echo "\nthe map the launch and the anchor share\n";
// pqpg_ehel_app_base() is on the launch path for EVERY EHEL course, not just
// the tutoring ones — the subject table was lifted out of it so the anchor
// could clamp against the same numbers, and a bad lift would break ordinary
// course launches for six subjects while every tutoring assertion above still
// passed. These are here because that refactor's blast radius is wider than
// this file's subject.
check('an ordinary course key still resolves to its app, param and stage',
    array_map(fn($k) => [pqpg_ehel_app_base($k)['subjectdir'], pqpg_ehel_app_base($k)['levelparam'], pqpg_ehel_app_base($k)['stage']],
        ['ehel-eng-g04', 'ehel-math-g08', 'ehel-sci-g01', 'ehel-comp-g03', 'ehel-gp-g06', 'ehel-intensive-eng-l02']),
    [['english', 'grade', 4], ['mathematics', 'stage', 8], ['science', 'stage', 1],
     ['computing', 'stage', 3], ['global-perspectives', 'stage', 6], ['intensive-english', 'level', 2]]);
check('the retired ien alias still resolves an old launch URL',
    pqpg_ehel_app_base('ehel-ien-l01')['subjectdir'], 'intensive-english');
check('the letter guard still rejects a level read as a grade',
    [pqpg_ehel_app_base('ehel-eng-l01'), pqpg_ehel_app_base('ehel-intensive-eng-g01')], [null, null]);
check('a key that is not EHEL is still not a subject',
    [pqpg_ehel_app_base('moodle_12'), pqpg_ehel_app_base('ehel-nope-g01'), pqpg_ehel_app_base('')], [null, null, null]);
check('every real subject has an umbrella course key that resolves back',
    array_map('pqpg_tutoring_subject', array_map(fn($s) => 'ehel-tutoring-' . $s, pqpg_ehel_subject_slugs())),
    pqpg_ehel_subject_slugs());
$maxes = [];
foreach (pqpg_ehel_subject_slugs() as $slug) {
    $maxes[$slug] = (int)$map[$slug]['maxstage'];
}
// Mirrors `maxStage:` in shell/subjects/<dir>.js. If a subject publishes more
// stages, this and that file move together; the gate names the numbers so the
// change is deliberate rather than discovered by a learner hitting a 404.
check('the published stage counts are the ones the apps declare',
    $maxes, ['eng' => 8, 'math' => 8, 'sci' => 8, 'comp' => 8, 'gp' => 8, 'intensive-eng' => 2]);

printf("\n%d passed, %d failed\n", $pass, $fail);
if ($fail > 0) {
    fwrite(STDERR, "✗ the tutoring anchor resolves wrongly — see the failures above.\n");
    exit(1);
}
echo "✓ tutoring anchors: per subject, clamped to what each subject publishes, and dark until a row exists.\n";
exit(0);

// --- MUTATIONS THIS GATE HAS BEEN WATCHED TO CATCH -------------------------
//
//   drop the anchor lookup from pqpg_tutoring_stage()   the feature does nothing,
//                                                       silently — every learner
//                                                       back on one declared year
//   read the anchor without the subject condition       one subject's anchor moves
//                                                       all six
//   apply the clamp before the anchor instead of after  an anchor of 5 opens GP's
//                                                       withdrawn stage
//   drop the maxstage clamp                             Intensive English opens at
//                                                       level 7, which does not exist
//   keep Intensive English's unconditional return 1     an explicitly placed
//                                                       learner is pinned at level 1
//   let a 0 anchor win                                  stage 0 for anybody whose
//                                                       row was written blank
//   build the picker from the subject map, not enrolment  a family who bought two
//                                                       subjects is offered six
//   include the `ien` alias in pqpg_ehel_subject_slugs()  Intensive English twice
//
// …three on which subject the single "Tutor Me" card opens:
//
//   resume in the caller's order, not the table's      two learners with the same
//                                                       purchase open different
//                                                       subjects, by query order
//   ignore the last-opened preference                   the card never resumes
//   trust the preference unvalidated                    a dropped subject leaves the
//                                                       card pointing at a course
//                                                       the launch will refuse
//
// …and three on the subject table's lift out of pqpg_ehel_app_base(), which is
// on the launch path for EVERY course rather than only the tutoring ones:
//
//   swap a subject's `param`                            every launch of it opens
//                                                       on the app's default stage
//   drop the letter guard                               ehel-eng-l01 resolves a
//                                                       level to a grade
//   lose the `ien` key                                  a launch URL minted before
//                                                       2026-08-21 stops resolving
