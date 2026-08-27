<?php
// Per-subject tutoring anchors — the staff surface for the one number that
// decides which lessons a tutoring learner's search can reach.
//
// A tutoring-support learner has no curriculum position, so their help search
// is drawn around an ANCHOR stage: their own level, plus and minus two. That
// anchor is resolved per subject (progress_gatewaylib.php ::
// pqpg_tutoring_stage) as anchor row -> declared school year -> 4, and until
// this page existed only the middle one could ever be set — by the family, once,
// on the intake form, as a single school year answering for all six subjects.
//
// This is the page that makes the per-subject half real. It is deliberately the
// whole feature's only writer: nothing else in the platform writes an anchor.
//
// Why it matters that it is easy to reach and easy to change: a wrong anchor
// does not fail. The learner gets a working search over the wrong five stages
// and reads the result as "Ehel does not teach this". The child most likely to
// be mis-anchored is exactly the one this category exists for — behind in one
// subject, at their year in the others — so the fix has to be a thing a person
// can do in ten seconds while the parent is on the phone.

declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/accesslib.php');
require_once($CFG->dirroot . '/local/prequran/progress_gatewaylib.php');

pqh_require_academy_operations(
    'Setting a tutoring learner\'s level requires platform operations access.',
    new moodle_url('/local/hubredirect/dashboard.php'),
    'Tutoring level access required'
);

$pqta_context = pqh_current_consumer_context();
$pqta_now = time();
$pqta_notice = '';
$pqta_error = '';

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/tutoring_anchors.php'));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Tutoring levels');
$PAGE->set_heading('Tutoring levels');

/**
 * The tutoring cohort's id, or 0.
 *
 * Cohort membership IS the tutoring category (progress_gatewaylib.php ::
 * pqpg_launch_category), so it is also the only definition of who this page may
 * touch. A missing cohort is reported rather than worked around: the setup that
 * creates it also creates the six umbrella courses, and without either there is
 * no tutoring learner to anchor.
 */
function pqta_cohort_id(): int {
    global $DB;
    try {
        return (int)$DB->get_field('cohort', 'id', ['idnumber' => 'ehel-tutoring'], IGNORE_MISSING);
    } catch (Throwable $e) {
        return 0;
    }
}

/** Whether this user is a tutoring learner. The whole permission to edit them. */
function pqta_is_tutoring_learner(int $userid): bool {
    global $DB;
    $cohortid = pqta_cohort_id();
    if ($cohortid <= 0 || $userid <= 0) {
        return false;
    }
    return $DB->record_exists('cohort_members', ['cohortid' => $cohortid, 'userid' => $userid]);
}

function pqta_audit(string $action, int $targetid, array $details = []): void {
    global $DB, $USER;
    if (!pqh_table_exists_safe('local_prequran_live_audit')) {
        return;
    }
    try {
        $DB->insert_record('local_prequran_live_audit', (object)[
            'sessionid' => 0,
            'actorid' => (int)$USER->id,
            'action' => $action,
            'targettype' => 'tutoring_anchor',
            'targetid' => $targetid,
            'details' => $details ? json_encode($details) : '',
            'timecreated' => time(),
        ]);
    } catch (Throwable $e) {
        // An unwritten audit row must never lose the change it describes.
        debugging('Tutoring anchor audit failed: ' . $e->getMessage(), DEBUG_DEVELOPER);
    }
}

// ---- writes --------------------------------------------------------------
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        require_sesskey();
        if (!pqh_table_exists_safe('local_prequran_tutoring_anchor')) {
            throw new invalid_parameter_exception('The tutoring anchor table is not installed yet. Run the local_prequran upgrade.');
        }
        $targetid = required_param('userid', PARAM_INT);
        $slug = required_param('subject', PARAM_ALPHANUMEXT);
        $action = required_param('action', PARAM_ALPHANUMEXT);

        // Three guards, and each refuses a different mistake. Only a tutoring
        // learner can be anchored at all — this page cannot be turned on an
        // arbitrary account by editing the id in the form. Only a learner
        // inside the operator's own consumer can be touched, which is the
        // tenant isolation every student-targeting write here carries. And only
        // a real subject slug: the map's `ien` alias is excluded by
        // pqpg_ehel_subject_slugs(), so an anchor can never be written under a
        // key the launch resolves through but nobody enumerates.
        if (!pqta_is_tutoring_learner($targetid)) {
            throw new invalid_parameter_exception('That learner is not in the tutoring cohort.');
        }
        if (!pqh_user_belongs_to_consumer_context($targetid, $pqta_context)) {
            throw new invalid_parameter_exception('That learner belongs to a different consumer.');
        }
        if (!in_array($slug, pqpg_ehel_subject_slugs(), true)) {
            throw new invalid_parameter_exception('Unknown subject.');
        }

        $existing = $DB->get_record('local_prequran_tutoring_anchor',
            ['userid' => $targetid, 'subject' => $slug], '*', IGNORE_MISSING);

        if ($action === 'clear') {
            if ($existing) {
                $DB->delete_records('local_prequran_tutoring_anchor', ['id' => (int)$existing->id]);
                pqta_audit('tutoring_anchor_cleared', $targetid, ['subject' => $slug, 'was' => (int)$existing->stage]);
            }
            // Saying what it falls back TO, not just that it is gone: "cleared"
            // alone leaves the operator guessing whether the learner now has no
            // level or their declared one.
            $pqta_notice = 'Cleared. That subject is back to ' . pqpg_tutoring_stage($targetid, $slug)
                . ', worked out from the school year on their intake.';
        } else if ($action === 'set') {
            $stage = required_param('stage', PARAM_INT);
            $subject = pqpg_ehel_subject_map()[$slug];
            $max = (int)$subject['maxstage'];
            // Refused rather than silently clamped. pqpg_tutoring_clamp_stage()
            // would hold a 9 at 8 and the page would report 8 as though that is
            // what was asked for — a save that quietly means something else is
            // how an operator stops trusting the number they typed.
            if ($stage < 1 || $stage > $max) {
                throw new invalid_parameter_exception(
                    $subject['label'] . ' has ' . $max . ' ' . strtolower($subject['param']) . 's, so 1 to ' . $max . ' only.');
            }
            $record = (object)[
                'userid' => $targetid,
                'subject' => $slug,
                'stage' => $stage,
                'source' => 'staff',
                'setby' => (int)$USER->id,
                'timecreated' => (int)($existing->timecreated ?? $pqta_now),
                'timemodified' => $pqta_now,
            ];
            if ($existing) {
                $record->id = (int)$existing->id;
                $DB->update_record('local_prequran_tutoring_anchor', $record);
            } else {
                $DB->insert_record('local_prequran_tutoring_anchor', $record);
            }
            pqta_audit('tutoring_anchor_set', $targetid,
                ['subject' => $slug, 'stage' => $stage, 'was' => (int)($existing->stage ?? 0)]);

            // Report the EFFECTIVE stage, which is not always the one saved:
            // Global Perspectives Stage 5 is withdrawn and resolves to 6. The
            // operator has to see where the learner will actually land.
            $effective = pqpg_tutoring_stage($targetid, $slug);
            $pqta_notice = $subject['label'] . ' set to ' . ucfirst($subject['param']) . ' ' . $effective . '.';
            if ($effective !== $stage) {
                $pqta_notice .= ' (' . ucfirst($subject['param']) . ' ' . $stage
                    . ' is withdrawn, so they open at ' . $effective . '.)';
            }
            $pqta_notice .= ' It applies at their next launch.';
        }
    } catch (Throwable $e) {
        $pqta_error = $e->getMessage();
    }
}

// ---- reads ---------------------------------------------------------------
$pqta_cohortid = pqta_cohort_id();
$pqta_query = trim(optional_param('q', '', PARAM_TEXT));
$pqta_userid = optional_param('userid', 0, PARAM_INT);
$pqta_ready = pqh_table_exists_safe('local_prequran_tutoring_anchor');

$pqta_matches = [];
if ($pqta_cohortid > 0 && $pqta_query !== '' && $pqta_userid <= 0) {
    // Field by field, the way every other search page here does it, rather than
    // a concatenated full name: sql_concat with a literal separator is the kind
    // of clever that differs between database drivers, and this page is not the
    // place to find that out. The cost is that "Amal Yusuf" matches nothing
    // while either half matches — the same trade the rest of the platform makes.
    $like = '%' . $DB->sql_like_escape($pqta_query) . '%';
    $where = '(' . $DB->sql_like('u.firstname', ':qfirst', false)
        . ' OR ' . $DB->sql_like('u.lastname', ':qlast', false)
        . ' OR ' . $DB->sql_like('u.email', ':qemail', false) . ')';
    $params = ['cohortid' => $pqta_cohortid, 'qfirst' => $like, 'qlast' => $like, 'qemail' => $like];
    try {
        $pqta_matches = $DB->get_records_sql(
            "SELECT u.id, u.firstname, u.lastname, u.email
               FROM {user} u
               JOIN {cohort_members} cm ON cm.userid = u.id
              WHERE cm.cohortid = :cohortid AND u.deleted = 0 AND {$where}
           ORDER BY u.lastname ASC, u.firstname ASC",
            $params, 0, 50);
    } catch (Throwable $e) {
        $pqta_error = $pqta_error ?: $e->getMessage();
    }
    // Consumer isolation on the READ as well as the write: an operator should
    // not learn that a learner exists in another consumer by searching for them.
    $pqta_matches = array_values(array_filter($pqta_matches,
        static function ($row) use ($pqta_context) {
            return pqh_user_belongs_to_consumer_context((int)$row->id, $pqta_context);
        }));
}

$pqta_learner = null;
$pqta_rows = [];
if ($pqta_userid > 0) {
    if (!pqta_is_tutoring_learner($pqta_userid) || !pqh_user_belongs_to_consumer_context($pqta_userid, $pqta_context)) {
        $pqta_error = $pqta_error ?: 'That learner is not a tutoring learner in this consumer.';
    } else {
        $pqta_learner = $DB->get_record('user', ['id' => $pqta_userid], 'id, firstname, lastname, email', IGNORE_MISSING);
        $declared = pqpg_tutoring_declared_stage($pqta_userid);
        // Which subjects they can actually open, so the page can say so. The
        // anchor itself is NOT gated on enrolment — setting one for a subject
        // the family is about to buy is harmless and is dark until they are
        // enrolled — but an operator should be able to see the difference.
        $enrolled = [];
        foreach ((array)(pqpg_tutoring_subjects($pqta_userid) ?: []) as $entry) {
            $enrolled[$entry['subject']] = true;
        }
        foreach (pqpg_ehel_subject_slugs() as $slug) {
            $subject = pqpg_ehel_subject_map()[$slug];
            $anchor = pqpg_tutoring_anchor($pqta_userid, $slug);
            $effective = pqpg_tutoring_stage($pqta_userid, $slug);
            if ($anchor > 0) {
                $source = 'Set here';
            } else if ($slug === 'intensive-eng') {
                // Its axis is CEFR levels, so a school year says nothing about
                // it — everyone without an anchor starts at Level 1.
                $source = 'Default — a school year is not a CEFR level';
            } else if ($declared >= 1) {
                $source = 'Their school year on the intake form';
            } else {
                $source = 'Default — no school year on their intake';
            }
            $pqta_rows[] = [
                'slug' => $slug,
                'label' => (string)$subject['label'],
                'word' => ucfirst((string)$subject['param']),
                'max' => (int)$subject['maxstage'],
                'anchor' => $anchor,
                'effective' => $effective,
                'source' => $source,
                'enrolled' => isset($enrolled[$slug]),
                // Asked for, never worked out here: what a level MEANS is the
                // whole point of showing it, and a page that computed its own
                // window could describe one the search does not use.
                'window' => implode(' to ', pqpg_tutoring_window($slug, $effective)),
            ];
        }
    }
}

// ---- render --------------------------------------------------------------
echo $OUTPUT->header();
echo '<style>'
    . '.pqta-wrap{max-width:940px;margin:0 auto}'
    . '.pqta-top{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:14px}'
    . '.pqta-panel{border:1px solid #dfe4ea;border-radius:10px;background:#fff;padding:16px;margin-bottom:14px}'
    . '.pqta-muted{color:#5f6f7d;font-size:13px}'
    . '.pqta-btn{display:inline-flex;align-items:center;min-height:36px;padding:0 13px;border:1px solid #cfd8d0;'
    . 'border-radius:8px;background:#1f5fa8;color:#fff;font-weight:700;text-decoration:none;cursor:pointer}'
    . '.pqta-btn--light{background:#f6f9fc;color:#173044}'
    . '.pqta-input,.pqta-select{border:1px solid #ccd5de;border-radius:7px;padding:8px;font:inherit}'
    . '.pqta-table{width:100%;border-collapse:collapse}'
    . '.pqta-table th,.pqta-table td{border-bottom:1px solid #e7ecf1;padding:10px 8px;text-align:left;vertical-align:middle}'
    . '.pqta-table th{font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:#5f6f7d}'
    . '.pqta-pill{display:inline-flex;padding:3px 9px;border-radius:999px;background:#eef4fb;font-size:12px;font-weight:700}'
    . '.pqta-pill--off{background:#f2f2f2;color:#6b6b6b}'
    . '.pqta-notice{padding:10px 12px;border-radius:8px;margin-bottom:12px;background:#e9f5ec}'
    . '.pqta-error{padding:10px 12px;border-radius:8px;margin-bottom:12px;background:#fff0f0;color:#8a1f1f}'
    . '.pqta-set{display:flex;gap:6px;align-items:center;flex-wrap:wrap}'
    . '@media(max-width:760px){.pqta-top{display:block}.pqta-table th:nth-child(3),.pqta-table td:nth-child(3){display:none}}'
    . '</style>';
echo '<style>' . pqh_openproject_skin_css('pqta') . '</style>';
echo '<div class="pqta-wrap">';
echo '<div class="pqta-top"><div><h2>Tutoring levels</h2><div class="pqta-muted">'
    . 'A tutoring learner searches the lessons two levels either side of their own. '
    . 'That level is set per subject, because a child can be at their school year in one subject and behind in another.'
    . '</div></div><a class="pqta-btn pqta-btn--light" href="'
    . (new moodle_url('/local/hubredirect/dashboard.php'))->out(false) . '">Dashboard</a></div>';

if ($pqta_notice !== '') { echo '<div class="pqta-notice">' . s($pqta_notice) . '</div>'; }
if ($pqta_error !== '') { echo '<div class="pqta-error">' . s($pqta_error) . '</div>'; }
if (!$pqta_ready) {
    echo '<div class="pqta-error">The tutoring anchor table is not installed. Run the local_prequran upgrade before setting any levels.</div>';
}
if ($pqta_cohortid <= 0) {
    echo '<div class="pqta-error">There is no <code>ehel-tutoring</code> cohort on this site, so there are no tutoring learners yet. '
        . 'The setup that creates it also creates the six Tutoring courses.</div>';
}

// --- find a learner ---
echo '<section class="pqta-panel"><h3>Find a tutoring learner</h3>'
    . '<form method="get" class="pqta-set">'
    . '<input class="pqta-input" type="search" name="q" value="' . s($pqta_query) . '" placeholder="Name or email" aria-label="Search tutoring learners by name or email">'
    . '<button class="pqta-btn" type="submit">Search</button></form>';
if ($pqta_query !== '' && $pqta_userid <= 0) {
    if (!$pqta_matches) {
        echo '<p class="pqta-muted">No tutoring learner in this consumer matches that. '
            . 'A learner only appears here once they are in the tutoring cohort.</p>';
    } else {
        echo '<table class="pqta-table"><thead><tr><th>Learner</th><th>Email</th><th></th></tr></thead><tbody>';
        foreach ($pqta_matches as $row) {
            $open = new moodle_url('/local/hubredirect/tutoring_anchors.php', ['userid' => (int)$row->id]);
            echo '<tr><td>' . s(trim($row->firstname . ' ' . $row->lastname)) . '</td><td class="pqta-muted">' . s($row->email) . '</td>'
                . '<td><a class="pqta-btn pqta-btn--light" href="' . $open->out(false) . '">Set levels</a></td></tr>';
        }
        echo '</tbody></table>';
    }
}
echo '</section>';

// --- one learner's six subjects ---
if ($pqta_learner) {
    echo '<section class="pqta-panel"><h3>' . s(trim($pqta_learner->firstname . ' ' . $pqta_learner->lastname)) . '</h3>'
        . '<p class="pqta-muted">' . s($pqta_learner->email) . ' · '
        . 'Changes apply the next time they open a lesson.</p>';
    echo '<table class="pqta-table"><thead><tr><th>Subject</th><th>Opens at</th><th>Searches</th><th>Where that came from</th><th>Set</th></tr></thead><tbody>';
    foreach ($pqta_rows as $row) {
        echo '<tr>';
        echo '<td><strong>' . s($row['label']) . '</strong>'
            . ($row['enrolled'] ? '' : ' <span class="pqta-pill pqta-pill--off">not enrolled</span>') . '</td>';
        echo '<td><span class="pqta-pill">' . s($row['word'] . ' ' . $row['effective']) . '</span></td>';
        echo '<td class="pqta-muted">' . s(strtolower($row['word']) . 's ' . $row['window']) . '</td>';
        echo '<td class="pqta-muted">' . s($row['source']) . '</td>';
        echo '<td><form method="post" class="pqta-set">'
            . '<input type="hidden" name="sesskey" value="' . s(sesskey()) . '">'
            . '<input type="hidden" name="userid" value="' . (int)$pqta_learner->id . '">'
            . '<input type="hidden" name="subject" value="' . s($row['slug']) . '">'
            . '<input type="hidden" name="action" value="set">'
            . '<select class="pqta-select" name="stage" aria-label="' . s($row['label'] . ' level') . '">';
        for ($i = 1; $i <= $row['max']; $i++) {
            $selected = ($row['anchor'] > 0 ? $row['anchor'] : $row['effective']) === $i ? ' selected' : '';
            // Named rather than left to be discovered by saving it and reading
            // the notice afterwards.
            $withdrawn = ($row['slug'] === 'gp' && $i === 5) ? ' (withdrawn)' : '';
            echo '<option value="' . $i . '"' . $selected . '>' . s($row['word'] . ' ' . $i . $withdrawn) . '</option>';
        }
        echo '</select><button class="pqta-btn" type="submit"' . ($pqta_ready ? '' : ' disabled') . '>Save</button></form>';
        if ($row['anchor'] > 0) {
            echo '<form method="post" class="pqta-set" style="margin-top:6px">'
                . '<input type="hidden" name="sesskey" value="' . s(sesskey()) . '">'
                . '<input type="hidden" name="userid" value="' . (int)$pqta_learner->id . '">'
                . '<input type="hidden" name="subject" value="' . s($row['slug']) . '">'
                . '<input type="hidden" name="action" value="clear">'
                . '<button class="pqta-btn pqta-btn--light" type="submit">Use their school year</button></form>';
        }
        echo '</td></tr>';
    }
    echo '</tbody></table>';
    echo '<p class="pqta-muted" style="margin-top:12px">'
        . 'A level set here overrides the school year the family gave on the intake form, for that subject only. '
        . '"Use their school year" removes it again. Intensive English is measured in CEFR levels rather than school years, '
        . 'so it always starts at Level 1 until somebody sets it.'
        . '</p>';
    echo '</section>';
}

echo '</div>';
echo $OUTPUT->footer();
