<?php
// PreQuraan practice cadence — Quraan Academy's own admin page.
//
// Arabic letters are learned by repetition: this page lets an authorized Quraan
// Academy person tune how often the alphabet Practice section repeats, PER LEVEL
// (passes, repeats-per-letter, gap, echo). It is deliberately NOT in the
// platform admin settings tree — the cadence belongs to the quraan-academy
// consumer, and is stored on that consumer's workspace record
// (settingsjson['prequran_practice'][<level>]).
//
// ACCESS is doubly gated:
//   1. DOMAIN — the request must arrive on a Quraan Academy consumer domain
//      (i.e. quraantest.academy). Moodle serves every consumer domain from one
//      install, so we resolve the consumer from the request host and refuse
//      anywhere else, including eduplatform.ai.
//   2. PERSON — the user must be able to manage the Quraan Academy workspace.
//
// The static PreQuraan app reads the saved cadence through the public,
// tokenless practice_config.php endpoint.

require(__DIR__ . '/../../config.php');
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/institutionlib.php');

require_login();

$QURAAN_SLUG = 'quraan-academy';
$pageurl = new moodle_url('/local/prequran/prequran_practice_settings.php');
$PAGE->set_url($pageurl);
$PAGE->set_context(context_system::instance());
$PAGE->set_pagelayout('standard');
$PAGE->set_title('PreQuraan practice cadence');
$PAGE->set_heading('PreQuraan practice cadence');

// -- gate 1: domain. Resolved from the request host via the consumer_domain
// -- table, so this page only ever answers on a Quraan Academy domain. --
$consumercontext = pqh_current_consumer_context();
if ((string)($consumercontext->consumerslug ?? '') !== $QURAAN_SLUG) {
    pqh_access_denied(
        'PreQuraan practice settings are available only on the Quraan Academy domain (quraantest.academy).',
        new moodle_url('/'),
        'Not available on this domain'
    );
}

if (!pqh_consumer_schema_ready()) {
    throw new moodle_exception('error', 'moodle', '', null, 'Consumer tables are not installed yet.');
}

// -- gate 2: person. Resolve the Quraan workspace explicitly and require the
// -- caller to manage it. --
$consumer = $DB->get_record('local_prequran_consumer', ['slug' => $QURAAN_SLUG], '*', IGNORE_MISSING);
$workspaceid = $consumer ? (int)($consumer->primaryworkspaceid ?? 0) : 0;
if ($workspaceid <= 0) {
    throw new moodle_exception('error', 'moodle', '', null, 'Quraan Academy workspace is not set up yet.');
}
if (!pqh_user_can_manage_workspace((int)$USER->id, $workspaceid)) {
    pqh_access_denied(
        'Only Quraan Academy workspace owners and admins can edit PreQuraan practice settings.',
        new moodle_url('/'),
        'PreQuraan practice settings'
    );
}
$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', IGNORE_MISSING);
if (!$workspace) {
    throw new moodle_exception('error', 'moodle', '', null, 'Quraan Academy workspace record is missing.');
}

// Canonical default — mirrors the app module PRACTICE_DEFAULTS.listen and the
// unit JSON practice.listen, so an unconfigured level behaves exactly as today.
$default = ['passes' => 2, 'repeats' => 1, 'gapMs' => 700, 'echo' => false];

$clamp = static function ($v, int $def, int $min, int $max): int {
    if ($v === null || $v === '') {
        return $def;
    }
    return max($min, min($max, (int)$v));
};

$settings = pqhi_json_array((string)($workspace->settingsjson ?? ''));
$store = (isset($settings['prequran_practice']) && is_array($settings['prequran_practice']))
    ? $settings['prequran_practice'] : [];

// Discover PreQuraan levels: any Moodle course idnumber qrn-prequran-lNN,
// unioned with levels already saved, plus level 0 (the built alphabet) so the
// page is usable even before catalog sync creates the per-level courses.
$levels = [];
$courses = $DB->get_records_sql(
    "SELECT id, idnumber, fullname FROM {course} WHERE " . $DB->sql_like('idnumber', ':pat'),
    ['pat' => 'qrn-prequran-l%']
);
foreach ($courses as $c) {
    if (preg_match('/qrn-prequran-l0*(\d+)/', (string)$c->idnumber, $m)) {
        $levels[(int)$m[1]] = (string)$c->fullname;
    }
}
foreach (array_keys($store) as $k) {
    if (!isset($levels[(int)$k])) {
        $levels[(int)$k] = 'Level ' . (int)$k;
    }
}
if (!isset($levels[0])) {
    $levels[0] = 'Level 0 — Letters';
}
ksort($levels);

// -- save --
$notice = '';
if (optional_param('save', 0, PARAM_INT) === 1 && confirm_sesskey()) {
    $passes = optional_param_array('passes', [], PARAM_INT);
    $repeats = optional_param_array('repeats', [], PARAM_INT);
    $gapms = optional_param_array('gapms', [], PARAM_INT);
    $echo = optional_param_array('echo', [], PARAM_INT);
    $saved = 0;
    foreach (array_keys($levels) as $ln) {
        if (!array_key_exists($ln, $passes)) {
            continue;
        }
        $store[(string)$ln] = [
            'passes' => $clamp($passes[$ln] ?? null, $default['passes'], 1, 20),
            'repeats' => $clamp($repeats[$ln] ?? null, $default['repeats'], 1, 20),
            'gapMs' => $clamp($gapms[$ln] ?? null, $default['gapMs'], 0, 10000),
            'echo' => !empty($echo[$ln]),
        ];
        $saved++;
    }
    if ($saved > 0) {
        $settings['prequran_practice'] = $store;
        $workspace->settingsjson = json_encode($settings, JSON_UNESCAPED_SLASHES);
        $workspace->timemodified = time();
        $DB->update_record('local_prequran_workspace', pqhi_record_for_existing_columns('local_prequran_workspace', $workspace));
        $notice = "Saved practice cadence for {$saved} level(s). Children see the change within a few minutes.";
    }
}

// -- render --
echo $OUTPUT->header();
echo html_writer::tag('p',
    'Arabic letters are learned by repetition. Set how many times the alphabet <strong>Practice</strong> section repeats, per level. '
    . 'These values apply to the PreQuraan app for ' . s((string)$workspace->name) . '.',
    ['class' => 'text-muted']
);
if ($notice !== '') {
    echo $OUTPUT->notification($notice, \core\output\notification::NOTIFY_SUCCESS);
}

echo html_writer::start_tag('form', ['method' => 'post', 'action' => $pageurl->out(false)]);
echo html_writer::empty_tag('input', ['type' => 'hidden', 'name' => 'sesskey', 'value' => sesskey()]);
echo html_writer::empty_tag('input', ['type' => 'hidden', 'name' => 'save', 'value' => 1]);

foreach ($levels as $ln => $title) {
    $cur = (isset($store[(string)$ln]) && is_array($store[(string)$ln])) ? $store[(string)$ln] : $default;
    $configured = isset($store[(string)$ln]);
    echo html_writer::start_tag('fieldset', ['class' => 'mb-3 p-3 border rounded']);
    echo html_writer::tag('legend',
        s($title) . ' '
        . html_writer::tag('span', $configured ? 'Custom' : 'Default', ['class' => 'badge ' . ($configured ? 'badge-info' : 'badge-secondary')]),
        ['class' => 'w-auto px-2', 'style' => 'font-size:1rem;font-weight:700']
    );
    echo html_writer::start_div('form-row');

    $field = static function (string $label, string $name, int $ln, $value, string $hint, int $min, int $max, int $step = 1): string {
        return html_writer::div(
            html_writer::tag('label', $label, ['for' => "{$name}_{$ln}", 'class' => 'font-weight-bold'])
            . html_writer::empty_tag('input', [
                'type' => 'number', 'class' => 'form-control', 'id' => "{$name}_{$ln}",
                'name' => "{$name}[{$ln}]", 'value' => (int)$value,
                'min' => $min, 'max' => $max, 'step' => $step,
            ])
            . html_writer::tag('small', $hint, ['class' => 'form-text text-muted']),
            'col-md-3 mb-2'
        );
    };

    echo $field('Passes', 'passes', $ln, $cur['passes'] ?? $default['passes'], 'Loops through the whole set', 1, 20);
    echo $field('Repeats / letter', 'repeats', $ln, $cur['repeats'] ?? $default['repeats'], 'Plays per letter, per pass', 1, 20);
    echo $field('Gap (ms)', 'gapms', $ln, $cur['gapMs'] ?? $default['gapMs'], 'Pause between letters', 0, 10000, 50);

    echo html_writer::div(
        html_writer::tag('label', 'Echo', ['class' => 'font-weight-bold d-block'])
        . html_writer::div(
            html_writer::empty_tag('input', array_merge([
                'type' => 'checkbox', 'class' => 'form-check-input', 'id' => "echo_{$ln}",
                'name' => "echo[{$ln}]", 'value' => 1,
            ], !empty($cur['echo']) ? ['checked' => 'checked'] : []))
            . html_writer::tag('label', ' "Your turn — say it" pause', ['for' => "echo_{$ln}", 'class' => 'form-check-label']),
            'form-check'
        ),
        'col-md-3 mb-2'
    );

    echo html_writer::end_div();
    echo html_writer::end_tag('fieldset');
}

echo html_writer::empty_tag('input', ['type' => 'submit', 'class' => 'btn btn-primary', 'value' => 'Save cadence']);
echo html_writer::end_tag('form');
echo $OUTPUT->footer();
