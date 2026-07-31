<?php
// Availability overlap library (pqav_*). Requires accesslib.php.
//
// Turns per-person weekly availability into UTC minute-intervals and answers
// the only question that matters for cross-timezone matching: do these
// people's hours actually intersect, and is the intersection big enough to
// host the required sessions?
//
// Timezone names are treated as display metadata everywhere in this library.
// Two people in Africa/Nairobi and Europe/Moscow (both UTC+3) overlap fully;
// two people in Africa/Nairobi and Africa/Lagos (2h apart) do not just
// because both strings start with "Africa". String comparison of zone names
// produced both of those errors in the old scorers.
//
// Representation: a week is 10080 minutes, Monday 00:00 UTC = 0. A person's
// availability is a list of [startminute, endminute) intervals in that space,
// merged and sorted. Intervals crossing Sunday midnight wrap around.
declare(strict_types=1);

defined('MOODLE_INTERNAL') || die();

const PQAV_WEEK_MINUTES = 10080;

/**
 * Minutes a named zone is ahead of UTC right now (negative when behind).
 * DST NOTE: this uses the zone's CURRENT offset. A weekly grid has no date, so
 * "Wednesday 17:00 in New York" is inherently ambiguous across DST. Callers
 * that schedule real sessions must re-derive concrete times from local time +
 * zone per date; this library only ranks whether people can EVER meet, for
 * which the current offset is the right approximation.
 */
function pqav_zone_offset_minutes(string $timezone): int {
    $timezone = trim($timezone) !== '' ? trim($timezone) : 'UTC';
    try {
        $tz = new DateTimeZone($timezone);
    } catch (Throwable $e) {
        return 0;
    }
    return (int)round($tz->getOffset(new DateTime('now', new DateTimeZone('UTC'))) / 60);
}

/**
 * Map local weekly minutes to UTC weekly minutes, splitting on week wrap.
 * $weekday: 0 = Monday ... 6 = Sunday (the convention live_availability uses).
 *
 * @return array[] list of [start, end) pairs in UTC week-minute space
 */
function pqav_local_to_utc_intervals(int $weekday, int $startminute, int $endminute, string $timezone): array {
    if ($endminute <= $startminute) {
        return [];
    }
    $offset = pqav_zone_offset_minutes($timezone);
    $daybase = (($weekday % 7) + 7) % 7 * 1440;
    $start = $daybase + max(0, min(1440, $startminute)) - $offset;
    $end = $daybase + max(0, min(1440, $endminute)) - $offset;

    // Normalise into [0, WEEK) with wraparound producing up to two intervals.
    $start = (($start % PQAV_WEEK_MINUTES) + PQAV_WEEK_MINUTES) % PQAV_WEEK_MINUTES;
    $end = $start + ($endminute - $startminute);
    if ($end <= PQAV_WEEK_MINUTES) {
        return [[$start, $end]];
    }
    return [[$start, PQAV_WEEK_MINUTES], [0, $end - PQAV_WEEK_MINUTES]];
}

/** Merge overlapping/adjacent [start, end) intervals into a sorted minimal set. */
function pqav_merge_intervals(array $intervals): array {
    if (!$intervals) {
        return [];
    }
    usort($intervals, static function(array $a, array $b): int {
        return $a[0] <=> $b[0];
    });
    $merged = [];
    foreach ($intervals as $interval) {
        if ($merged && $interval[0] <= end($merged)[1]) {
            $last = array_pop($merged);
            $merged[] = [$last[0], max($last[1], $interval[1])];
        } else {
            $merged[] = $interval;
        }
    }
    return $merged;
}

/** Intersect two merged interval sets. */
function pqav_intersect_intervals(array $a, array $b): array {
    $out = [];
    $i = 0;
    $j = 0;
    while ($i < count($a) && $j < count($b)) {
        $start = max($a[$i][0], $b[$j][0]);
        $end = min($a[$i][1], $b[$j][1]);
        if ($start < $end) {
            $out[] = [$start, $end];
        }
        if ($a[$i][1] < $b[$j][1]) {
            $i++;
        } else {
            $j++;
        }
    }
    return $out;
}

/** Total minutes covered by a merged interval set. */
function pqav_total_minutes(array $intervals): int {
    $total = 0;
    foreach ($intervals as $interval) {
        $total += $interval[1] - $interval[0];
    }
    return $total;
}

/**
 * Teacher availability -> UTC intervals, from local_prequran_live_availability
 * (weekday, start_minute, end_minute, timezone -- already structured).
 */
function pqav_teacher_intervals(int $teacherid): array {
    global $DB;
    if ($teacherid <= 0 || !pqh_table_exists_safe('local_prequran_live_availability')) {
        return [];
    }
    $intervals = [];
    try {
        $rows = $DB->get_records_select(
            'local_prequran_live_availability',
            "teacherid = :teacherid AND status <> 'inactive'",
            ['teacherid' => $teacherid]
        );
    } catch (Throwable $e) {
        return [];
    }
    foreach ($rows as $row) {
        // live_availability.weekday follows PHP date('w'): 0 = SUNDAY (see
        // pqti_weekday_number in teacher_intake.php). This library's week
        // space is 0 = Monday, so map Sun 0 -> 6, Mon 1 -> 0, ... Sat 6 -> 5.
        // Getting this wrong shifts every teacher by one day and silently
        // wrecks all cross-matching.
        $weekday = (((int)$row->weekday) + 6) % 7;
        foreach (pqav_local_to_utc_intervals(
            $weekday,
            (int)$row->start_minute,
            (int)$row->end_minute,
            (string)$row->timezone
        ) as $interval) {
            $intervals[] = $interval;
        }
    }
    return pqav_merge_intervals($intervals);
}

/**
 * Parse the intake-style availability payload
 *   {"timezone": "...", "slots": ["mon|8", "wed|15", ...]}
 * into UTC intervals. Each slot is one hour starting at the named hour.
 * Day tokens accept mon/tue/... or monday/tuesday/... case-insensitively.
 */
function pqav_json_to_intervals(string $json): array {
    $decoded = json_decode($json, true);
    if (!is_array($decoded)) {
        return [];
    }
    $timezone = trim((string)($decoded['timezone'] ?? 'UTC'));
    $daymap = ['mon' => 0, 'tue' => 1, 'wed' => 2, 'thu' => 3, 'fri' => 4, 'sat' => 5, 'sun' => 6];
    $intervals = [];
    foreach ((array)($decoded['slots'] ?? []) as $slot) {
        [$day, $hour] = array_pad(explode('|', (string)$slot, 2), 2, '');
        $day = substr(strtolower(trim($day)), 0, 3);
        if (!isset($daymap[$day]) || !is_numeric($hour)) {
            continue;
        }
        $hour = (int)$hour;
        if ($hour < 0 || $hour > 23) {
            continue;
        }
        foreach (pqav_local_to_utc_intervals($daymap[$day], $hour * 60, ($hour + 1) * 60, $timezone) as $interval) {
            $intervals[] = $interval;
        }
    }
    return pqav_merge_intervals($intervals);
}

/**
 * Student availability -> UTC intervals.
 *
 * The canonical structured copy is student_profile.availability_json (written
 * by the admin student-intake form and editable there); the newest intake
 * request is the fallback for students created before that column existed.
 * student_profile.availability is free text and is deliberately not parsed.
 */
function pqav_student_intervals(int $studentid): array {
    global $DB;
    if ($studentid <= 0) {
        return [];
    }
    if (pqh_table_exists_safe('local_prequran_student_profile')
            && pqh_table_has_field_safe('local_prequran_student_profile', 'availability_json')) {
        try {
            $profilejson = trim((string)$DB->get_field('local_prequran_student_profile', 'availability_json',
                ['userid' => $studentid], IGNORE_MISSING));
        } catch (Throwable $e) {
            $profilejson = '';
        }
        if ($profilejson !== '') {
            $intervals = pqav_json_to_intervals($profilejson);
            if ($intervals) {
                return $intervals;
            }
        }
    }
    if (!pqh_table_exists_safe('local_prequran_intake_request')) {
        return [];
    }
    if (!pqh_table_has_field_safe('local_prequran_intake_request', 'availability_json')) {
        return [];
    }
    // The intake row is linked to the created Moodle account at transfer time
    // via transferred_userid (see intake_requests.php).
    $studentfield = pqh_table_has_field_safe('local_prequran_intake_request', 'transferred_userid')
        ? 'transferred_userid'
        : (pqh_table_has_field_safe('local_prequran_intake_request', 'studentid') ? 'studentid' : '');
    if ($studentfield === '') {
        return [];
    }
    try {
        $rows = $DB->get_records_select(
            'local_prequran_intake_request',
            "{$studentfield} = :studentid AND availability_json <> ''",
            ['studentid' => $studentid],
            'id DESC',
            'id,availability_json',
            0,
            1
        );
    } catch (Throwable $e) {
        return [];
    }
    $row = $rows ? reset($rows) : null;
    return $row ? pqav_json_to_intervals((string)$row->availability_json) : [];
}

/**
 * Can these intervals host $sessions sessions of $minutes each, on distinct
 * days? Returns [bool viable, array chosen] where chosen holds one candidate
 * [start, end) per session.
 *
 * Greedy by day: a session needs one contiguous run of $minutes; requiring
 * distinct days matches how weekly live classes actually run (Mon/Wed/Fri),
 * and avoids proposing three back-to-back hours on one evening.
 */
function pqav_can_host_sessions(array $intervals, int $sessions, int $minutes): array {
    if ($sessions <= 0 || $minutes <= 0) {
        return [true, []];
    }
    $bydays = [];
    foreach ($intervals as $interval) {
        // Split by day so "distinct days" is well-defined.
        $cursor = $interval[0];
        while ($cursor < $interval[1]) {
            $day = intdiv($cursor, 1440);
            $dayend = min($interval[1], ($day + 1) * 1440);
            if ($dayend - $cursor >= $minutes) {
                $bydays[$day][] = [$cursor, $dayend];
            }
            $cursor = $dayend;
        }
    }
    if (count($bydays) < $sessions) {
        return [false, []];
    }
    $chosen = [];
    ksort($bydays);
    foreach ($bydays as $segments) {
        $chosen[] = [$segments[0][0], $segments[0][0] + $minutes];
        if (count($chosen) === $sessions) {
            return [true, $chosen];
        }
    }
    return [false, []];
}

/** Human-readable UTC label for a week-minute interval, e.g. "Wed 07:00-08:00 UTC". */
function pqav_interval_label(array $interval): string {
    $names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    $day = $names[intdiv($interval[0], 1440) % 7];
    $fmt = static function(int $minute): string {
        return sprintf('%02d:%02d', intdiv($minute % 1440, 60), $minute % 60);
    };
    return $day . ' ' . $fmt($interval[0]) . '-' . $fmt($interval[1]) . ' UTC';
}

/**
 * The headline scorer: overlap between a teacher and one-or-many students.
 *
 * @param array $teacherintervals from pqav_teacher_intervals()
 * @param array $studentintervalsets one interval set per student
 * @return array {minutes: int, windows: array, labels: string[]}
 *         minutes = size of the common intersection across everyone.
 */
function pqav_overlap(array $teacherintervals, array $studentintervalsets): array {
    $common = $teacherintervals;
    foreach ($studentintervalsets as $set) {
        if (!$common) {
            break;
        }
        $common = pqav_intersect_intervals($common, pqav_merge_intervals($set));
    }
    return [
        'minutes' => pqav_total_minutes($common),
        'windows' => $common,
        'labels' => array_map('pqav_interval_label', $common),
    ];
}

/**
 * Propose cohorts for a set of students given a session requirement.
 *
 * Pure function: takes [studentid => intervals] and returns proposed clusters
 * plus an explicit unplaceable list with reasons. Greedy, most-constrained
 * first: seed each cluster with the student who has the fewest available
 * minutes, then admit candidates only while the cluster's COMMON windows can
 * still host the required sessions. That ordering protects tightly-constrained
 * students from being stranded by flexible ones taking their seats.
 *
 * @param array $studentintervals studentid => merged UTC intervals
 * @param int $sessions sessions per week required (0 = any overlap >= 60min)
 * @param int $minutes minutes per session
 * @param int $maxstudents capacity per cohort
 * @return array {cohorts: [{studentids, windows, labels}], unplaced: [{studentid, reason}]}
 */
function pqav_propose_cohorts(array $studentintervals, int $sessions, int $minutes, int $maxstudents): array {
    $sessions = max(0, $sessions);
    $minutes = $minutes > 0 ? $minutes : 60;
    $maxstudents = max(1, $maxstudents);

    $unplaced = [];
    $pool = [];
    foreach ($studentintervals as $studentid => $intervals) {
        $intervals = pqav_merge_intervals($intervals);
        if (!$intervals) {
            $unplaced[] = ['studentid' => (int)$studentid, 'reason' => 'no availability recorded'];
            continue;
        }
        $pool[(int)$studentid] = $intervals;
    }

    $viable = static function(array $windows) use ($sessions, $minutes): bool {
        if ($sessions <= 0) {
            return pqav_total_minutes($windows) >= $minutes;
        }
        [$ok, ] = pqav_can_host_sessions($windows, $sessions, $minutes);
        return $ok;
    };

    $cohorts = [];
    while ($pool) {
        // Most-constrained seed.
        uasort($pool, static function(array $a, array $b): int {
            return pqav_total_minutes($a) <=> pqav_total_minutes($b);
        });
        $seedid = array_key_first($pool);
        $windows = $pool[$seedid];
        unset($pool[$seedid]);
        if (!$viable($windows)) {
            $unplaced[] = ['studentid' => $seedid, 'reason' => 'own availability cannot host the required sessions'];
            continue;
        }
        $members = [$seedid];
        foreach ($pool as $candidateid => $candidateintervals) {
            if (count($members) >= $maxstudents) {
                break;
            }
            $next = pqav_intersect_intervals($windows, $candidateintervals);
            if ($viable($next)) {
                $windows = $next;
                $members[] = $candidateid;
                unset($pool[$candidateid]);
            }
        }
        $cohorts[] = [
            'studentids' => $members,
            'windows' => $windows,
            'labels' => array_map('pqav_interval_label', $windows),
        ];
    }

    return ['cohorts' => $cohorts, 'unplaced' => $unplaced];
}

/**
 * Rank teachers for a cohort's common windows: viability first (can this
 * teacher's availability host the sessions INSIDE the cohort windows), then
 * spare overlap as the tiebreak.
 *
 * Ordering: viability first, then LOWEST current workload, then spare overlap.
 * Without the load term every cohort piles onto the most-available teacher;
 * with it, assignment is least-loaded-first inside each shift, which is what
 * "balance student workload within the shift boundaries" means in practice.
 *
 * @param array $cohortwindows merged UTC intervals shared by the cohort
 * @param array $teacherintervalmap teacherid => merged UTC intervals
 * @param array $loadmap teacherid => current weekly teaching minutes (or any
 *              consistent load measure); missing entries count as 0
 * @return array ranked [{teacherid, viable, minutes, load, sessionslots, labels}]
 */
function pqav_rank_teachers_for_cohort(array $cohortwindows, array $teacherintervalmap, int $sessions, int $minutes, array $loadmap = []): array {
    $minutes = $minutes > 0 ? $minutes : 60;
    $ranked = [];
    foreach ($teacherintervalmap as $teacherid => $intervals) {
        $common = pqav_intersect_intervals($cohortwindows, pqav_merge_intervals($intervals));
        if ($sessions > 0) {
            [$ok, $slots] = pqav_can_host_sessions($common, $sessions, $minutes);
        } else {
            $ok = pqav_total_minutes($common) >= $minutes;
            $slots = $ok && $common ? [[$common[0][0], $common[0][0] + $minutes]] : [];
        }
        $ranked[] = [
            'teacherid' => (int)$teacherid,
            'viable' => $ok,
            'minutes' => pqav_total_minutes($common),
            'load' => (int)($loadmap[(int)$teacherid] ?? 0),
            'sessionslots' => $slots,
            'labels' => array_map('pqav_interval_label', $slots),
        ];
    }
    usort($ranked, static function(array $a, array $b): int {
        if ($a['viable'] !== $b['viable']) {
            return $a['viable'] ? -1 : 1;
        }
        if ($a['load'] !== $b['load']) {
            return $a['load'] <=> $b['load'];
        }
        return $b['minutes'] <=> $a['minutes'];
    });
    return $ranked;
}

/**
 * DST-safe expansion of one weekly UTC slot into concrete session start times.
 *
 * The slot (UTC week-minutes, from pqav_* matching) is converted ONCE into the
 * anchor zone's local weekday + wall-clock time; every following week is then
 * built from that LOCAL time in that zone. When the anchor zone changes DST,
 * the UTC instant moves with it and the class stays at the same local hour for
 * the anchor -- which is the property naive "start + N*WEEKSECS" stepping
 * (what the legacy series expansion does) gets wrong twice a year.
 *
 * A class spanning zones with different DST regimes cannot be stable in both;
 * anchoring is a policy choice. Callers here anchor to the teacher's zone and
 * record it on the session so every surface can render viewer-local times.
 *
 * @param int $slotstart UTC week-minute start (Mon 00:00 UTC = 0)
 * @param int $minutes session length
 * @param string $anchorzone IANA zone the local wall-clock is pinned to
 * @param int $rangestart first eligible timestamp
 * @param int $rangeend last eligible timestamp (0 = no end; $maxcount rules)
 * @param int $maxcount hard cap on generated sessions
 * @return array[] list of ['start' => ts, 'end' => ts]
 */
function pqav_generate_session_times(int $slotstart, int $minutes, string $anchorzone, int $rangestart, int $rangeend, int $maxcount = 13): array {
    $minutes = $minutes > 0 ? $minutes : 60;
    $maxcount = max(1, min(52, $maxcount));
    try {
        $tz = new DateTimeZone(trim($anchorzone) !== '' ? trim($anchorzone) : 'UTC');
    } catch (Throwable $e) {
        $tz = new DateTimeZone('UTC');
    }

    // Slot -> anchor-local weekday + wall-clock, resolved at the range start
    // so "the class meets Wed 15:00 teacher-time" is fixed from day one.
    $probe = new DateTime('@' . max($rangestart, time()));
    $offset = (int)round($tz->getOffset($probe) / 60);
    $local = $slotstart + $offset;
    $local = (($local % PQAV_WEEK_MINUTES) + PQAV_WEEK_MINUTES) % PQAV_WEEK_MINUTES;
    $weekday = intdiv($local, 1440);            // 0 = Monday
    $hour = intdiv($local % 1440, 60);
    $minute = $local % 60;
    $daynames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    $cursor = new DateTime('@' . $rangestart);
    $cursor->setTimezone($tz);
    // First occurrence of the local weekday at/after range start.
    $first = clone $cursor;
    $first->modify($daynames[$weekday] . ' this week')->setTime($hour, $minute);
    if ($first->getTimestamp() < $rangestart) {
        $first->modify('+1 week');
    }

    $out = [];
    $occurrence = clone $first;
    for ($i = 0; $i < $maxcount; $i++) {
        $start = $occurrence->getTimestamp();
        if ($rangeend > 0 && $start > $rangeend) {
            break;
        }
        $out[] = ['start' => $start, 'end' => $start + $minutes * 60];
        // Step by LOCAL week: same wall-clock next week in the anchor zone,
        // whatever DST does in between.
        $occurrence->modify('+1 week')->setTime($hour, $minute);
    }
    return $out;
}

/**
 * Teacher shift windows, defined in East Africa Time (the operating base;
 * EAT is UTC+3 year-round, so these UTC boundaries never move with DST):
 *
 *   shift1  10:00-20:00 EAT = 07:00-17:00 UTC  (Africa day, Europe afternoon,
 *                                               Asia/Oceania evening)
 *   shift2  20:00-06:00 EAT = 17:00-03:00 UTC  (Europe evening, Americas
 *                                               evening; wraps midnight)
 *
 * Known coverage hole: 03:00-07:00 UTC (= 19:00-23:00 US Pacific).
 */
function pqav_shift_definitions(): array {
    static $defs = null;
    if ($defs !== null) {
        return $defs;
    }
    $shift1 = [];
    $shift2 = [];
    for ($day = 0; $day < 7; $day++) {
        // 10:00-20:00 EAT.
        foreach (pqav_local_to_utc_intervals($day, 10 * 60, 20 * 60, 'Africa/Nairobi') as $iv) {
            $shift1[] = $iv;
        }
        // 20:00-24:00 and 00:00-06:00 EAT (overnight, split at midnight).
        foreach (pqav_local_to_utc_intervals($day, 20 * 60, 24 * 60, 'Africa/Nairobi') as $iv) {
            $shift2[] = $iv;
        }
        foreach (pqav_local_to_utc_intervals($day, 0, 6 * 60, 'Africa/Nairobi') as $iv) {
            $shift2[] = $iv;
        }
    }
    $defs = [
        'shift1' => ['label' => 'Shift 1 — 10:00-20:00 EAT (day)', 'windows' => pqav_merge_intervals($shift1)],
        'shift2' => ['label' => 'Shift 2 — 20:00-06:00 EAT (night)', 'windows' => pqav_merge_intervals($shift2)],
    ];
    return $defs;
}

/**
 * A teacher's EFFECTIVE availability: personal availability intersected with
 * their assigned shift window. No shift assigned (or an unknown key) means
 * the personal availability stands unrestricted -- shifts constrain, they
 * never grant hours the teacher did not declare.
 */
function pqav_teacher_effective_intervals(int $teacherid): array {
    global $DB;
    $intervals = pqav_teacher_intervals($teacherid);
    if (!$intervals) {
        return [];
    }
    $shift = '';
    if (pqh_table_exists_safe('local_prequran_teacher_profile')
            && pqh_table_has_field_safe('local_prequran_teacher_profile', 'shift')) {
        try {
            $shift = trim((string)$DB->get_field('local_prequran_teacher_profile', 'shift',
                ['userid' => $teacherid], IGNORE_MISSING));
        } catch (Throwable $e) {
            $shift = '';
        }
    }
    $defs = pqav_shift_definitions();
    if ($shift === '' || !isset($defs[$shift])) {
        return $intervals;
    }
    return pqav_intersect_intervals($intervals, $defs[$shift]['windows']);
}

/** Concrete UTC timestamp -> UTC week-minute (Mon 00:00 UTC = 0). */
function pqav_timestamp_to_week_minute(int $timestamp): int {
    // 345600 = Mon 5 Jan 1970 00:00:00 UTC, the first Monday of the epoch.
    $seconds = (($timestamp - 345600) % 604800 + 604800) % 604800;
    return intdiv($seconds, 60);
}

/**
 * Is the concrete window [$timestamp, +$minutes) covered by the given weekly
 * UTC intervals? Splits on the week boundary. Used to validate a real session
 * time against a teacher's effective (shift-capped) availability -- correctly
 * across timezones, unlike comparisons via date('G') in server-local time.
 */
function pqav_covers_timestamp(int $timestamp, int $minutes, array $intervals): bool {
    if ($minutes <= 0 || !$intervals) {
        return false;
    }
    $start = pqav_timestamp_to_week_minute($timestamp);
    $end = $start + $minutes;
    $needed = $end <= PQAV_WEEK_MINUTES
        ? [[$start, $end]]
        : [[$start, PQAV_WEEK_MINUTES], [0, $end - PQAV_WEEK_MINUTES]];
    foreach ($needed as $segment) {
        $covered = false;
        foreach ($intervals as $interval) {
            if ($segment[0] >= $interval[0] && $segment[1] <= $interval[1]) {
                $covered = true;
                break;
            }
        }
        if (!$covered) {
            return false;
        }
    }
    return true;
}
