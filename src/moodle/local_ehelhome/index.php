<?php
require(__DIR__ . '/../../config.php');

if (isloggedin() && !isguestuser()) {
    redirect(new moodle_url('/my/'));
}

$PAGE->set_url('/local/ehelhome/index.php');
$PAGE->set_context(context_system::instance());
$PAGE->set_pagelayout('embedded');
$PAGE->set_title(get_string('pluginname', 'local_ehelhome'));
$PAGE->set_heading(get_string('pluginname', 'local_ehelhome'));
$PAGE->set_cacheable(false);

echo $OUTPUT->header();
echo $OUTPUT->render_from_template('local_ehelhome/landing', [
    'logintoken' => \core\session\manager::get_login_token(),
    'config' => [
        'wwwroot' => $CFG->wwwroot,
    ],
]);
echo $OUTPUT->footer();
