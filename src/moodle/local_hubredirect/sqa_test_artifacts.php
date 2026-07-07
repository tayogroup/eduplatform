<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');
require_login();

if (!pqh_can_view_sqa_dashboard((int)$USER->id)) {
    pqh_access_denied(
        'SQA test artifacts are available only to SQA testers, school principals, and site administrators.',
        new moodle_url('/local/hubredirect/dashboard.php'),
        'SQA access required'
    );
}

$artifact = optional_param('artifact', 'library', PARAM_ALPHANUMEXT);
$doc = optional_param('doc', '', PARAM_ALPHANUMEXT);

$adminsqadocs = [
    'alphabet-lesson-test-tracker-user-guide' => [
        'title' => 'Alphabet Lesson Test Tracker User Guide',
        'description' => 'Field-by-field intern guide for recording Alphabet lesson test results.',
        'file' => 'alphabet-lesson-test-tracker-user-guide.pdf',
    ],
    'alphabet-lesson-test-plan' => [
        'title' => 'Alphabet Lesson Test Plan And Intern Script',
        'description' => 'Detailed test plan and script for the Pre-Quran Alphabet lesson.',
        'file' => 'alphabet-lesson-test-plan.pdf',
    ],
    'quran-academy-app-flowchart-for-testing' => [
        'title' => 'Quran Academy App Flowchart For Testing',
        'description' => 'System flowchart for onboarding SQA testers.',
        'file' => 'quran-academy-app-flowchart-for-testing.pdf',
    ],
    'quran-academy-functionality-inventory' => [
        'title' => 'Quran Academy Functionality Inventory',
        'description' => 'Categorized functionality inventory for system understanding and test planning.',
        'file' => 'quran-academy-functionality-inventory.pdf',
    ],
    'quran-academy-system-components-diagram' => [
        'title' => 'Quran Academy System Components Diagram',
        'description' => 'Component map showing how Moodle, Bunny, lessons, reports, and roles connect.',
        'file' => 'quran-academy-system-components-diagram.pdf',
    ],
    'sqa-terms-and-definitions' => [
        'title' => 'SQA Terms And Definitions',
        'description' => 'Shared quality-assurance vocabulary for interns and admins.',
        'file' => 'sqa-terms-and-definitions.pdf',
    ],
    'moodle-launch-flow' => [
        'title' => 'Moodle Launch Flow',
        'description' => 'Launch flow reference for Moodle-to-Pre-Quran access and routing.',
        'file' => 'moodle-launch-flow.pdf',
    ],
    'environment-promotion-checklist' => [
        'title' => 'Environment Promotion Checklist',
        'description' => 'Checklist for moving changes through integration, staging, and production.',
        'file' => 'environment-promotion-checklist.pdf',
    ],
    'bunny-deploy' => [
        'title' => 'Bunny Deploy Runbook',
        'description' => 'Bunny build and deployment reference for operations and release checks.',
        'file' => 'bunny-deploy.pdf',
    ],
];
$adminsqabunnyprefix = 'pre_quraan_integration/docs/admin-sqa/';

if ($artifact === 'library') {
    $context = context_system::instance();
    $PAGE->set_context($context);
    $PAGE->set_url(new moodle_url('/local/hubredirect/sqa_test_artifacts.php', ['artifact' => 'library']));
    $PAGE->set_pagelayout('standard');
    $PAGE->set_title('Admin And SQA Documentation');
    $PAGE->set_heading('Admin And SQA Documentation');
    echo $OUTPUT->header();
    echo html_writer::start_div('container-fluid');
    echo html_writer::tag('p', 'PDF documents for admins, SQA testers, and operations users. Bunny links will open after the PDFs are deployed to the configured CDN path.');
    echo html_writer::start_tag('div', ['class' => 'row']);
    foreach ($adminsqadocs as $key => $item) {
        $bunnyurl = pqh_bunny_cdn_url($adminsqabunnyprefix . $item['file']);
        $moodleurl = new moodle_url('/local/hubredirect/sqa_test_artifacts.php', [
            'artifact' => 'admin-sqa-doc',
            'doc' => $key,
        ]);
        echo html_writer::start_div('col-md-6 col-xl-4 mb-3');
        echo html_writer::start_div('card h-100');
        echo html_writer::start_div('card-body');
        echo html_writer::tag('h3', s($item['title']), ['class' => 'h5 card-title']);
        echo html_writer::tag('p', s($item['description']), ['class' => 'card-text']);
        echo html_writer::div('Bunny path: ' . s($adminsqabunnyprefix . $item['file']), 'small text-muted mb-3');
        echo html_writer::link($bunnyurl, 'Open PDF on Bunny', [
            'class' => 'btn btn-primary mr-2 mb-2',
            'target' => '_blank',
            'rel' => 'noopener',
        ]);
        echo html_writer::link($moodleurl, 'Open role-checked copy', [
            'class' => 'btn btn-secondary mb-2',
            'target' => '_blank',
            'rel' => 'noopener',
        ]);
        echo html_writer::end_div();
        echo html_writer::end_div();
        echo html_writer::end_div();
    }
    echo html_writer::end_tag('div');
    echo html_writer::div(
        html_writer::link(new moodle_url('/local/hubredirect/sqa_test_artifacts.php', ['artifact' => 'alphabet-tracker']), 'Open Alphabet Lesson Test Tracker', ['class' => 'btn btn-outline-primary mr-2'])
        . html_writer::link(new moodle_url('/local/hubredirect/dashboard.php'), 'Back to dashboard', ['class' => 'btn btn-outline-secondary']),
        'mt-3'
    );
    echo html_writer::end_div();
    echo $OUTPUT->footer();
    exit;
}

if ($artifact === 'admin-sqa-doc') {
    if (!isset($adminsqadocs[$doc])) {
        pqh_access_denied(
            'Choose a valid SQA document before opening the role-checked copy.',
            new moodle_url('/local/hubredirect/sqa_test_artifacts.php', ['artifact' => 'library']),
            'SQA document unavailable'
        );
    }
    $item = $adminsqadocs[$doc];
    $path = __DIR__ . '/../../../docs/admin-sqa/' . $item['file'];
    if (!is_readable($path)) {
        $context = context_system::instance();
        $PAGE->set_context($context);
        $PAGE->set_url(new moodle_url('/local/hubredirect/sqa_test_artifacts.php', ['artifact' => 'admin-sqa-doc', 'doc' => $doc]));
        $PAGE->set_pagelayout('standard');
        $PAGE->set_title($item['title']);
        $PAGE->set_heading($item['title']);
        echo $OUTPUT->header();
        echo html_writer::div('The local role-checked PDF copy is not deployed on this Moodle instance yet. Use the Bunny link after deployment.', 'alert alert-warning');
        echo html_writer::link(new moodle_url('/local/hubredirect/sqa_test_artifacts.php', ['artifact' => 'library']), 'Back to documentation library');
        echo $OUTPUT->footer();
        exit;
    }
    header('Content-Type: application/pdf');
    header('Content-Disposition: inline; filename="' . basename($item['file']) . '"');
    header('X-Content-Type-Options: nosniff');
    readfile($path);
    exit;
}

$allowed = [
    'alphabet-tracker' => [
        'title' => 'Alphabet Lesson Test Tracker',
        'paths' => [
            __DIR__ . '/sqa_alphabet_lesson_test_tracker.html',
            __DIR__ . '/../../../docs/alphabet-lesson-test-tracker.html',
        ],
        'contenttype' => 'text/html; charset=utf-8',
    ],
    'alphabet-plan' => [
        'title' => 'Alphabet Lesson Test Plan',
        'paths' => [
            __DIR__ . '/../../../docs/alphabet-lesson-test-plan.md',
        ],
        'contenttype' => 'text/plain; charset=utf-8',
    ],
];

if (!isset($allowed[$artifact])) {
    pqh_access_denied(
        'Choose a valid SQA artifact before opening this page.',
        new moodle_url('/local/hubredirect/sqa_test_artifacts.php', ['artifact' => 'library']),
        'SQA artifact unavailable'
    );
}

$item = $allowed[$artifact];
$path = '';
foreach ($item['paths'] as $candidate) {
    if (is_readable($candidate)) {
        $path = $candidate;
        break;
    }
}

if ($path === '') {
    $context = context_system::instance();
    $PAGE->set_context($context);
    $PAGE->set_url(new moodle_url('/local/hubredirect/sqa_test_artifacts.php', ['artifact' => $artifact]));
    $PAGE->set_pagelayout('standard');
    $PAGE->set_title($item['title']);
    $PAGE->set_heading($item['title']);
    echo $OUTPUT->header();
    echo html_writer::div('The requested SQA artifact is not deployed on this Moodle instance yet.', 'alert alert-warning');
    echo html_writer::link(new moodle_url('/local/hubredirect/dashboard.php'), 'Back to dashboard');
    echo $OUTPUT->footer();
    exit;
}

header('Content-Type: ' . $item['contenttype']);
header('X-Content-Type-Options: nosniff');
if ($artifact === 'alphabet-tracker') {
    $html = file_get_contents($path);
    if ($html !== false) {
        $config = [
            'endpoint' => (new moodle_url('/local/hubredirect/sqa_tracker_api.php'))->out(false),
            'sesskey' => sesskey(),
            'artifact' => 'alphabet-tracker',
            'userid' => (int)$USER->id,
        ];
        $script = '<script>window.__PQSQA_TRACKER_CONFIG__ = '
            . json_encode($config, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT | JSON_UNESCAPED_SLASHES)
            . ';</script>';
        echo str_replace('</head>', $script . "\n</head>", $html);
        exit;
    }
}
readfile($path);
