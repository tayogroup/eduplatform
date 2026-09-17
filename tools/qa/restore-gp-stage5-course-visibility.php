<?php
/**
 * One-off: restore visibility of the Global Perspectives Stage 5 Moodle
 * course, hidden 2026-08-09 when Stage 5 was withdrawn (visible=0,
 * visibleold=0) and now being un-hidden because the missing content has
 * been authored — see docs/ehel-global-perspectives-stage-5-syllabus.md
 * and src/prototypes/ehel-academy/withdrawn-courses.json.
 *
 * There is no SSH to this box. Per this repo's documented workflow
 * (root CLAUDE.md, "The human-tutor handoff" section): this file is staged
 * somewhere the operator can fetch it, they copy it into the K-12 Moodle
 * DOCROOT (identify it by the ehel-k12 row in local_prequran_consumer,
 * database ehelacad_quraantest — NOT by $CFG->wwwroot, which is
 * host-dependent on this box), run it once from cPanel Terminal with
 * `php restore-gp-stage5-course-visibility.php`, then BOTH SIDES DELETE
 * THEIR COPY. A re-staged fix after any edit needs a new filename — the
 * edge caches the first upload.
 *
 * Identifies the course by idnumber ('ehel-gp-g05'), never by a hardcoded
 * numeric id, in case the id recorded in this repo's docs (71) is stale.
 * Dry-run by default — prints the current row and does nothing. Pass
 * --confirm to actually write.
 *
 * Usage (from the Moodle docroot, e.g. /home/ehelacad/quraantest.academy):
 *   php restore-gp-stage5-course-visibility.php            # preview only
 *   php restore-gp-stage5-course-visibility.php --confirm   # writes
 */

function fail($msg) {
    fwrite(STDERR, "error: $msg\n");
    exit(1);
}

if (!is_file(__DIR__ . '/config.php')) {
    fail("no config.php next to this script — run it FROM the Moodle docroot, not from a home directory");
}
require(__DIR__ . '/config.php');
require_once($CFG->libdir . '/moodlelib.php');

global $DB;

$idnumber = 'ehel-gp-g05';
$course = $DB->get_record('course', array('idnumber' => $idnumber));

if (!$course) {
    fail("no course found with idnumber '$idnumber' — nothing to restore. If it was deleted rather than hidden, this script cannot help; check the Moodle course log.");
}

echo "Found course id {$course->id}: \"{$course->fullname}\" (shortname {$course->shortname})\n";
echo "Current state: visible={$course->visible}, visibleold={$course->visibleold}\n";

if ((int)$course->visible === 1) {
    echo "Already visible — nothing to do. Exiting without writing.\n";
    exit(0);
}

$confirm = in_array('--confirm', $argv, true);
if (!$confirm) {
    echo "\nDry run only (pass --confirm to write). Would set:\n";
    echo "  visible = 1\n";
    echo "  visibleold = 1\n";
    exit(0);
}

$update = new stdClass();
$update->id = $course->id;
$update->visible = 1;
$update->visibleold = 1;
$DB->update_record('course', $update);

// Moodle's own visibility-change event/cache-rebuild path, so the category
// tree and navigation reflect this immediately rather than on next cron.
rebuild_course_cache($course->id, true);
\core\event\course_updated::create(array(
    'objectid' => $course->id,
    'context' => \context_course::instance($course->id),
))->trigger();

$after = $DB->get_record('course', array('id' => $course->id));
echo "\nUpdated. New state: visible={$after->visible}, visibleold={$after->visibleold}\n";
echo "Delete this script from the docroot now — it is a one-off, not meant to stay on the server.\n";
