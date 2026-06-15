<?php

defined('MOODLE_INTERNAL') || die();

/**
 * Send guest front-page traffic to the custom Ehel login page.
 */
function local_ehelhome_before_http_headers(): void {
    global $SCRIPT;

    if ((defined('CLI_SCRIPT') && CLI_SCRIPT) || (defined('AJAX_SCRIPT') && AJAX_SCRIPT)) {
        return;
    }

    if ($SCRIPT !== '/index.php') {
        return;
    }

    if (isloggedin() && !isguestuser()) {
        return;
    }

    redirect(new moodle_url('/local/ehelhome/index.php'));
}
