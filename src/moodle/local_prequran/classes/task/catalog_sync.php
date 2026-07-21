<?php
// Catalog sync (P1.7) — reads the static catalog.json (source of truth for the
// Ehel Academy courses) and idempotently ensures the Moodle category tree,
// courses (keyed by idnumber), and per-unit grade items exist. The course
// idnumber IS the key the progress web service resolves against
// (local_prequran_progress_external::push_gradebook → get_record('course',
// ['idnumber' => $coursekey])), and the grade items match its grade_update
// coordinates (itemtype 'mod', itemmodule 'local_prequran', iteminstance = unit
// number, itemnumber 0). So once this task has run, the gradebook push goes live.
//
// INERT until registered: it does nothing until db/tasks.php schedules it and
// the admin setting local_prequran/catalog_source_url points at a catalog.json.
// See docs/catalog-sync-integration.md.

namespace local_prequran\task;

defined('MOODLE_INTERNAL') || die();

class catalog_sync extends \core\task\scheduled_task {

    public function get_name(): string {
        return get_string('task_catalog_sync', 'local_prequran');
    }

    public function execute(): void {
        global $CFG, $DB;
        require_once($CFG->dirroot . '/course/lib.php');
        require_once($CFG->libdir . '/gradelib.php');
        require_once($CFG->libdir . '/filelib.php');

        $url = trim((string)get_config('local_prequran', 'catalog_source_url'));
        if ($url === '') {
            mtrace('Catalog sync skipped: local_prequran/catalog_source_url is not set.');
            return;
        }

        // Cache-bust so the task always reads the freshest catalog.
        $fetchurl = $url . (strpos($url, '?') === false ? '?' : '&') . 'cb=' . time();
        $raw = download_file_content($fetchurl);
        $catalog = json_decode((string)$raw, true);
        if (!is_array($catalog) || empty($catalog['courses'])) {
            mtrace('Catalog sync failed: could not parse a catalog with courses from ' . $url);
            return;
        }

        $cats = 0; $courses = 0; $items = 0;
        $catcache = [];
        foreach ($catalog['courses'] as $c) {
            if (empty($c['idnumber'])) {
                continue;
            }
            $categoryid = $this->ensure_category_path($c['categoryPath'] ?? ['Ehel Academy'], $catcache, $cats);
            $courseid = $this->ensure_course($c, $categoryid, $courses);
            if ($courseid) {
                $items += $this->ensure_grade_items($courseid, $c);
            }
        }
        mtrace("Catalog sync: {$cats} categories created, {$courses} courses created/updated, {$items} grade items ensured.");
    }

    /** Get-or-create each level of a category path; returns the leaf category id. */
    private function ensure_category_path(array $path, array &$cache, int &$cats): int {
        global $DB;
        $parent = 0;
        $accum = [];
        foreach ($path as $name) {
            $accum[] = $name;
            $cachekey = implode('/', $accum);
            if (isset($cache[$cachekey])) {
                $parent = $cache[$cachekey];
                continue;
            }
            $idnumber = trim('ehelcat_' . preg_replace('/[^a-z0-9]+/', '_', strtolower($cachekey)), '_');
            $existing = (int)$DB->get_field('course_categories', 'id', ['idnumber' => $idnumber], IGNORE_MISSING);
            if ($existing > 0) {
                $cache[$cachekey] = $existing;
                $parent = $existing;
                continue;
            }
            $category = \core_course_category::create((object)[
                'name' => $name,
                'idnumber' => $idnumber,
                'parent' => $parent,
                'visible' => 1,
            ]);
            $cats++;
            $cache[$cachekey] = (int)$category->id;
            $parent = (int)$category->id;
        }
        return $parent;
    }

    /** Get-or-create a course by idnumber; light-touch update if drifted. */
    private function ensure_course(array $c, int $categoryid, int &$courses): int {
        global $DB;
        $idnumber = (string)$c['idnumber'];
        $existing = $DB->get_record('course', ['idnumber' => $idnumber]);

        if ($existing) {
            $update = (object)['id' => $existing->id];
            $changed = false;
            if ((string)$existing->fullname !== (string)$c['fullname']) { $update->fullname = (string)$c['fullname']; $changed = true; }
            if ((int)$existing->category !== $categoryid) { $update->category = $categoryid; $changed = true; }
            if ((string)$existing->summary !== (string)($c['summary'] ?? '')) { $update->summary = (string)($c['summary'] ?? ''); $update->summaryformat = FORMAT_HTML; $changed = true; }
            if ($changed) {
                update_course($update);
            }
            return (int)$existing->id;
        }

        $shortname = (string)$c['shortname'];
        if ($DB->record_exists('course', ['shortname' => $shortname])) {
            $shortname .= '-' . substr(md5($idnumber), 0, 6);
        }
        $course = create_course((object)[
            'fullname' => (string)$c['fullname'],
            'shortname' => $shortname,
            'idnumber' => $idnumber,
            'category' => $categoryid,
            'summary' => (string)($c['summary'] ?? ''),
            'summaryformat' => FORMAT_HTML,
            'format' => 'topics',
            'visible' => 1,
        ]);
        $this->ensure_manual_enrol((int)$course->id);
        $courses++;
        return (int)$course->id;
    }

    /** Make sure the course has an enabled manual enrolment instance. */
    private function ensure_manual_enrol(int $courseid): void {
        global $DB;
        $plugin = enrol_get_plugin('manual');
        if (!$plugin) {
            return;
        }
        if (!$DB->record_exists('enrol', ['courseid' => $courseid, 'enrol' => 'manual'])) {
            $course = $DB->get_record('course', ['id' => $courseid], '*', MUST_EXIST);
            $plugin->add_default_instance($course);
        }
    }

    /**
     * Pre-create the grade items the progress web service writes into: one per
     * unit (iteminstance = unit number) plus a course-level assessment item
     * (iteminstance 0, used by both English "final" and math/science "capstone").
     * Coordinates and itemname match push_gradebook() exactly so no duplicate
     * items are created on the first grade write.
     */
    private function ensure_grade_items(int $courseid, array $c): int {
        $count = 0;
        $ensure = function (int $iteminstance, string $itemname) use ($courseid) {
            grade_update(
                'local/prequran',
                $courseid,
                'mod',
                'local_prequran',
                $iteminstance,
                0,
                null,
                ['itemname' => $itemname, 'gradetype' => GRADE_TYPE_VALUE, 'grademax' => 100, 'grademin' => 0]
            );
        };
        foreach (($c['units'] ?? []) as $u) {
            $inst = (int)$u['number'];
            $ensure($inst, 'Progress: u' . str_pad((string)$inst, 2, '0', STR_PAD_LEFT));
            $count++;
        }
        $ensure(0, 'Progress: final');
        return $count + 1;
    }
}
