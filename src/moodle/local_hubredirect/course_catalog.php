<?php
declare(strict_types=1);

defined('MOODLE_INTERNAL') || die();

function pqh_course_catalog(): array {
    return [
        'pre_quraan' => [
            'key' => 'pre_quraan',
            'title' => 'Pre-Quraan',
            'summary' => 'Letters, harakat, blending, early reading, practice, and progress.',
            'status' => 'live',
            'aliases' => ['pre_quraan', 'pre-quraan', 'pre quraan', 'prequran', 'pre-quran'],
        ],
        'tarbiyah_kids' => [
            'key' => 'tarbiyah_kids',
            'title' => 'Tarbiyah Kids',
            'summary' => 'Character, manners, values, and child-friendly tarbiyah lessons.',
            'status' => 'placeholder',
            'aliases' => ['tarbiyah_kids', 'tarbiyah kids', 'tarbiyah'],
        ],
        'essential_arabic' => [
            'key' => 'essential_arabic',
            'title' => 'Essential Arabic',
            'summary' => '',
            'status' => 'placeholder',
            'aliases' => ['essential_arabic', 'essential arabic', 'arabic essentials', 'arabic foundations', 'foundational arabic'],
        ],
        'quran_reading' => [
            'key' => 'quran_reading',
            'title' => 'Quran Reading',
            'summary' => 'Reading fluency and guided Quran reading practice.',
            'status' => 'placeholder',
            'aliases' => ['quran_reading', 'quraan_reading', 'quran reading', 'quraan reading'],
        ],
        'quran_tafsir' => [
            'key' => 'quran_tafsir',
            'title' => 'Quran Tafsir',
            'summary' => 'Age-appropriate Quran meaning, reflection, and discussion.',
            'status' => 'placeholder',
            'aliases' => ['quran_tafsir', 'quraan_tafsir', 'quran tafsir', 'quraan tafsir', 'tafsir'],
        ],
        'quraan_memorization' => [
            'key' => 'quraan_memorization',
            'title' => 'Quran Memorization',
            'summary' => 'Memorization, revision targets, and teacher follow-up.',
            'status' => 'placeholder',
            'aliases' => ['quraan_memorization', 'quran_memorization', 'quraan memorization', 'quran memorization', 'hifz'],
        ],
    ];
}

function pqh_course_table_has_field(string $table, string $field): bool {
    global $DB;

    try {
        return $DB->get_manager()->field_exists(new xmldb_table($table), new xmldb_field($field));
    } catch (Throwable $e) {
        try {
            $columns = $DB->get_columns($table);
            return array_key_exists($field, $columns);
        } catch (Throwable $e2) {
            return false;
        }
    }
}

function pqh_course_table_exists(string $table): bool {
    global $DB;

    try {
        return $DB->get_manager()->table_exists(new xmldb_table($table));
    } catch (Throwable $e) {
        try {
            $DB->get_columns($table);
            return true;
        } catch (Throwable $e2) {
            return false;
        }
    }
}

function pqh_normalize_course_key(string $value): string {
    $value = strtolower(trim($value));
    $value = preg_replace('/[^a-z0-9]+/', '_', $value) ?? '';
    $value = trim($value, '_');

    foreach (pqh_course_catalog() as $key => $course) {
        if ($value === $key) {
            return $key;
        }
        foreach (($course['aliases'] ?? []) as $alias) {
            $normalizedalias = preg_replace('/[^a-z0-9]+/', '_', strtolower(trim((string)$alias))) ?? '';
            if ($value === trim($normalizedalias, '_')) {
                return $key;
            }
        }
    }

    return '';
}

function pqh_normalize_course_keys(string $value): array {
    // Supports dual-course profile values such as "quran_tafsir,quraan_memorization".
    $keys = [];
    foreach (preg_split('/[,;|]+/', $value) ?: [] as $part) {
        $key = pqh_normalize_course_key((string)$part);
        if ($key !== '') {
            $keys[$key] = true;
        }
    }
    return array_keys($keys);
}

function pqh_course_catalog_moodle_matches(stdClass $course): array {
    $haystack = strtolower(implode(' ', [
        (string)($course->shortname ?? ''),
        (string)($course->idnumber ?? ''),
        (string)($course->fullname ?? ''),
    ]));

    $matches = [];
    foreach (pqh_course_catalog() as $key => $candidate) {
        foreach (($candidate['aliases'] ?? []) as $alias) {
            $needle = strtolower(str_replace('_', ' ', (string)$alias));
            if ($needle !== '' && strpos(str_replace(['_', '-'], ' ', $haystack), $needle) !== false) {
                $matches[$key] = true;
                break;
            }
        }
    }

    return array_keys($matches);
}

function pqh_user_course_keys_from_moodle_enrolments(int $userid): array {
    global $DB;

    if ($userid <= 0) {
        return [];
    }

    $keys = [];
    try {
        $courses = $DB->get_records_sql(
            "SELECT DISTINCT c.id, c.fullname, c.shortname, c.idnumber
               FROM {course} c
               JOIN {enrol} e ON e.courseid = c.id
               JOIN {user_enrolments} ue ON ue.enrolid = e.id
              WHERE ue.userid = :userid
                AND c.id <> :siteid
                AND c.visible = 1
                AND e.status = 0
                AND ue.status = 0",
            ['userid' => $userid, 'siteid' => SITEID]
        );
        foreach ($courses as $course) {
            foreach (pqh_course_catalog_moodle_matches($course) as $key) {
                $keys[$key] = true;
            }
        }
    } catch (Throwable $e) {
        return [];
    }

    return array_keys($keys);
}

function pqh_user_moodle_enrolment_courses(int $userid): array {
    global $DB;

    if ($userid <= 0) {
        return [];
    }

    try {
        $courses = $DB->get_records_sql(
            "SELECT DISTINCT c.id, c.fullname, c.shortname, c.idnumber, c.summary
               FROM {course} c
               JOIN {enrol} e ON e.courseid = c.id
               JOIN {user_enrolments} ue ON ue.enrolid = e.id
              WHERE ue.userid = :userid
                AND c.id <> :siteid
                AND c.visible = 1
                AND e.status = 0
                AND ue.status = 0
           ORDER BY c.sortorder ASC, c.fullname ASC",
            ['userid' => $userid, 'siteid' => SITEID]
        );
    } catch (Throwable $e) {
        return [];
    }

    $out = [];
    foreach ($courses as $course) {
        $courseid = (int)$course->id;
        if ($courseid <= 0) {
            continue;
        }
        $catalogkeys = pqh_course_catalog_moodle_matches($course);
        $out[$courseid] = [
            'key' => 'moodle_' . $courseid,
            'title' => (string)($course->fullname ?: $course->shortname ?: 'Course ' . $courseid),
            'summary' => '',
            'course_number' => trim((string)($course->idnumber ?? '')),
            'status' => 'live',
            'moodlecourseid' => $courseid,
            'catalogkeys' => $catalogkeys,
        ];
    }
    return $out;
}

function pqh_user_course_keys_from_profile(int $userid): array {
    global $DB;

    if ($userid <= 0) {
        return [];
    }

    $keys = [];
    try {
        if (pqh_course_table_has_field('local_prequran_student_profile', 'course_type')) {
            $course_type = (string)$DB->get_field('local_prequran_student_profile', 'course_type', ['userid' => $userid]);
            foreach (pqh_normalize_course_keys($course_type) as $key) {
                $keys[$key] = true;
            }
        }
    } catch (Throwable $e) {
        return [];
    }

    return array_keys($keys);
}

function pqh_user_course_keys_from_course_offerings(int $userid): array {
    global $DB;

    if ($userid <= 0
        || !pqh_course_table_exists('local_prequran_course_offering')
        || !pqh_course_table_exists('local_prequran_course_enrol_req')) {
        return [];
    }

    $keys = [];
    try {
        [$offeringsql, $offeringparams] = $DB->get_in_or_equal(['published', 'closed'], SQL_PARAMS_NAMED, 'offstatus');
        $rows = $DB->get_records_sql(
            "SELECT DISTINCT o.course_key
               FROM {local_prequran_course_enrol_req} r
               JOIN {local_prequran_course_offering} o ON o.id = r.offeringid
               JOIN {course} c ON c.id = o.moodlecourseid
               JOIN {enrol} e ON e.courseid = c.id
               JOIN {user_enrolments} ue ON ue.enrolid = e.id AND ue.userid = r.studentid
              WHERE r.studentid = :userid
                AND r.status = :requeststatus
                AND COALESCE(r.moodleenrolledat, 0) > 0
                AND c.visible = 1
                AND e.enrol = :enrolmethod
                AND e.status = 0
                AND ue.status = 0
                AND o.status {$offeringsql}",
            ['userid' => $userid, 'requeststatus' => 'enrolled', 'enrolmethod' => 'manual'] + $offeringparams
        );
        foreach ($rows as $row) {
            $key = pqh_normalize_course_key((string)($row->course_key ?? ''));
            if ($key !== '') {
                $keys[$key] = true;
            }
        }
    } catch (Throwable $e) {
        return [];
    }

    return array_keys($keys);
}

function pqh_user_course_keys(int $userid): array {
    $keys = [];
    foreach (array_merge(
        pqh_user_course_keys_from_moodle_enrolments($userid),
        pqh_user_course_keys_from_profile($userid),
        pqh_user_course_keys_from_course_offerings($userid)
    ) as $key) {
        $keys[$key] = true;
    }
    return array_values(array_intersect(array_keys(pqh_course_catalog()), array_keys($keys)));
}

function pqh_user_courses(int $userid): array {
    $catalog = pqh_course_catalog();
    $courses = [];
    foreach (pqh_user_course_keys($userid) as $key) {
        if (isset($catalog[$key])) {
            $courses[$key] = $catalog[$key];
        }
    }
    return $courses;
}

function pqh_user_moodle_course_cards(int $userid, array $excludedcourseids = [], array $excludedcatalogkeys = []): array {
    $excludedcourseids = array_fill_keys(array_map('intval', $excludedcourseids), true);
    $courses = [];
    foreach (pqh_user_moodle_enrolment_courses($userid) as $courseid => $course) {
        if (isset($excludedcourseids[(int)$courseid])) {
            continue;
        }
        $courses[(string)$course['key']] = $course;
    }
    return $courses;
}

function pqh_user_can_access_course(int $userid, string $coursekey): bool {
    $coursekey = pqh_normalize_course_key($coursekey);
    return $coursekey !== '' && in_array($coursekey, pqh_user_course_keys($userid), true);
}
