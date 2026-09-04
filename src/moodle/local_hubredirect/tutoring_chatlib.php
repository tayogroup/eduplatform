<?php
declare(strict_types=1);

// Tutoring chat — the pieces that name the teacher group for a subject.
//
// Owner decision 2026-09-05: tutoring-support learners get the real classroom
// chat, with the variation the category forces. A tutoring learner has no
// class group and no assigned teacher; they have a SUBJECT (the launch token
// names the umbrella course, ehel-tutoring-<slug>) and, on the other side, a
// TEACHER GROUP PER SUBJECT — math_tutoring, science_tutoring,
// english_tutoring and so on. A learner's message routes to the group for the
// subject they came for help in.
//
// The teacher group is a Moodle COHORT, keyed by the idnumbers below, managed
// in Site admin like the ehel-tutoring learner cohort is — no new admin UI.
// Adding a tutor to the cohort puts them on every learner thread in that
// subject the next time it is opened; removing them mutes their row.
//
// ONE MAP, slug → cohort idnumber. The slugs are the umbrella course slugs
// pqpg_tutoring_subject() resolves (progress_gatewaylib.php); the idnumbers are
// the names the owner gave. Nothing else in the repo knows these names, so a
// cohort created under a different idnumber simply switches nothing on — the
// learner door reports enabled:false and no panel mounts.

require_once(__DIR__ . '/../../config.php');
require_once($CFG->dirroot . '/local/prequran/progress_gatewaylib.php');

/** slug (umbrella course) → tutor cohort idnumber. */
function pqtut_cohort_map(): array {
    return [
        'eng' => 'english_tutoring',
        'math' => 'math_tutoring',
        'sci' => 'science_tutoring',
        'comp' => 'computing_tutoring',
        'gp' => 'global_perspectives_tutoring',
        'intensive-eng' => 'intensive_english_tutoring',
    ];
}

/** The tutor cohort idnumber for a subject slug, or null for an unknown slug. */
function pqtut_cohort_idnumber(string $slug): ?string {
    return pqtut_cohort_map()[$slug] ?? null;
}

/** The subject slug a tutor cohort idnumber belongs to, or null. */
function pqtut_slug_for_cohort(string $idnumber): ?string {
    $slug = array_search($idnumber, pqtut_cohort_map(), true);
    return $slug === false ? null : (string)$slug;
}

/** "Mathematics" for 'math' — the label the app already uses for the subject. */
function pqtut_subject_label(string $slug): string {
    $map = pqpg_ehel_subject_map();
    return (string)($map[$slug]['label'] ?? $slug);
}

/**
 * The tutor cohorts that exist, keyed by slug: [slug => cohort record].
 * A subject with no cohort is not offered; that absence is the off switch.
 */
function pqtut_existing_cohorts(): array {
    global $DB;
    $out = [];
    foreach (pqtut_cohort_map() as $slug => $idnumber) {
        $cohort = $DB->get_record('cohort', ['idnumber' => $idnumber]);
        if ($cohort) {
            $out[$slug] = $cohort;
        }
    }
    return $out;
}

/**
 * The subjects THIS user tutors, as [slug => cohort record]. A site admin, or
 * anyone holding the support queue capability, sees every subject that has a
 * cohort — cover supervision, the same rule the live group board keeps.
 */
function pqtut_user_cohorts(int $userid): array {
    global $DB;
    if ($userid <= 0) {
        return [];
    }
    $existing = pqtut_existing_cohorts();
    if (!$existing) {
        return [];
    }
    if (is_siteadmin($userid) || has_capability('local/prequran:supportviewqueue', context_system::instance(), $userid)) {
        return $existing;
    }
    $mine = [];
    foreach ($existing as $slug => $cohort) {
        if ($DB->record_exists('cohort_members', ['cohortid' => (int)$cohort->id, 'userid' => $userid])) {
            $mine[$slug] = $cohort;
        }
    }
    return $mine;
}

/** True when the user tutors at least one subject (or supervises them all). */
function pqtut_user_is_tutor(int $userid): bool {
    return count(pqtut_user_cohorts($userid)) > 0;
}
