<?php
// Cohort enrolment sync (P1.7) — reads the static cohorts.json roster and closes
// the catalog→learner loop: ensures a Moodle cohort per grade, adds the rostered
// learners to it, and cohort-enrols the cohort into that grade's synced courses
// (idnumber ehel-{subj}-gNN, created by catalog_sync). Once a learner is enrolled,
// their progress web-service checkpoints land as real grades in a course they
// belong to.
//
// Safety: this task NEVER creates user accounts. It matches rostered members to
// EXISTING Moodle users by username (preferred) or email, and reports any it
// cannot find — account creation stays in the admissions / Upload-users flow.
//
// INERT until registered: it does nothing until db/tasks.php schedules it and the
// admin setting local_prequran/cohorts_source_url points at a cohorts.json.
// See docs/cohort-enrolment-integration.md.

namespace local_prequran\task;

defined('MOODLE_INTERNAL') || die();

class cohort_sync extends \core\task\scheduled_task {

    public function get_name(): string {
        return get_string('task_cohort_sync', 'local_prequran');
    }

    public function execute(): void {
        global $CFG, $DB;
        require_once($CFG->dirroot . '/cohort/lib.php');
        require_once($CFG->dirroot . '/enrol/cohort/locallib.php');
        require_once($CFG->libdir . '/filelib.php');

        $url = trim((string)get_config('local_prequran', 'cohorts_source_url'));
        if ($url === '') {
            mtrace('Cohort sync skipped: local_prequran/cohorts_source_url is not set.');
            return;
        }

        $studentrole = $DB->get_record('role', ['shortname' => 'student']);
        if (!$studentrole) {
            mtrace('Cohort sync failed: no "student" role on this site.');
            return;
        }

        $fetchurl = $url . (strpos($url, '?') === false ? '?' : '&') . 'cb=' . time();
        $roster = json_decode((string)download_file_content($fetchurl), true);
        if (!is_array($roster) || empty($roster['cohorts'])) {
            mtrace('Cohort sync failed: could not parse cohorts from ' . $url);
            return;
        }

        $systemctx = \context_system::instance();
        $cohortsdone = 0; $added = 0; $missing = 0; $enrols = 0;
        $touchedcourses = [];

        foreach ($roster['cohorts'] as $c) {
            if (empty($c['idnumber'])) {
                continue;
            }
            $cohortid = $this->ensure_cohort((string)$c['idnumber'], (string)($c['name'] ?? $c['idnumber']), $systemctx);
            $cohortsdone++;

            foreach (($c['members'] ?? []) as $m) {
                $user = $this->find_user($m);
                if (!$user) {
                    $missing++;
                    mtrace('  unmatched roster member: ' . json_encode($m));
                    continue;
                }
                if (!cohort_is_member($cohortid, $user->id)) {
                    cohort_add_member($cohortid, $user->id);
                    $added++;
                }
            }

            foreach (($c['courses'] ?? []) as $coursekey) {
                $course = $DB->get_record('course', ['idnumber' => $coursekey]);
                if (!$course) {
                    mtrace('  course not found (run catalog_sync first): ' . $coursekey);
                    continue;
                }
                if ($this->ensure_cohort_enrol($course, $cohortid, (int)$studentrole->id)) {
                    $enrols++;
                }
                $touchedcourses[$course->id] = true;
            }
        }

        // Enrol the members now (rather than waiting for the enrol_cohort cron).
        foreach (array_keys($touchedcourses) as $courseid) {
            enrol_cohort_sync(new \null_progress_trace(), $courseid);
        }

        mtrace("Cohort sync: {$cohortsdone} cohorts, {$added} memberships added, {$missing} unmatched, {$enrols} cohort-enrol links ensured.");
    }

    /** Get-or-create a cohort by idnumber in the given context; returns its id. */
    private function ensure_cohort(string $idnumber, string $name, \context $context): int {
        global $DB;
        $existing = $DB->get_record('cohort', ['idnumber' => $idnumber]);
        if ($existing) {
            return (int)$existing->id;
        }
        return (int)cohort_add_cohort((object)[
            'contextid' => $context->id,
            'name' => $name,
            'idnumber' => $idnumber,
            'description' => 'Ehel Academy pilot enrolment cohort.',
            'descriptionformat' => FORMAT_HTML,
            'visible' => 1,
        ]);
    }

    /** Match a roster member to an EXISTING user by username then email. No creation. */
    private function find_user(array $m) {
        global $DB;
        if (!empty($m['username'])) {
            $u = $DB->get_record('user', ['username' => \core_text::strtolower(trim((string)$m['username'])), 'deleted' => 0]);
            if ($u) {
                return $u;
            }
        }
        if (!empty($m['email'])) {
            return $DB->get_record('user', ['email' => \core_text::strtolower(trim((string)$m['email'])), 'deleted' => 0], '*', IGNORE_MULTIPLE);
        }
        return null;
    }

    /** Ensure a cohort-enrol instance links this cohort → course with the role. */
    private function ensure_cohort_enrol(\stdClass $course, int $cohortid, int $roleid): bool {
        global $DB;
        $exists = $DB->record_exists('enrol', [
            'courseid' => $course->id, 'enrol' => 'cohort', 'customint1' => $cohortid,
        ]);
        if ($exists) {
            return false;
        }
        $plugin = enrol_get_plugin('cohort');
        if (!$plugin) {
            mtrace('  enrol_cohort plugin is disabled — cannot link cohort to ' . $course->idnumber);
            return false;
        }
        $plugin->add_instance($course, ['customint1' => $cohortid, 'roleid' => $roleid]);
        return true;
    }
}
