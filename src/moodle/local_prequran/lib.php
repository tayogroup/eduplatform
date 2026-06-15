<?php
declare(strict_types=1);

defined('MOODLE_INTERNAL') || die();

/**
 * Return true when a table exists without letting upgrade/setup timing break page loads.
 */
function local_prequran_table_exists_safely(string $table): bool {
    global $DB;

    try {
        return isset($DB) && $DB->get_manager()->table_exists($table);
    } catch (Throwable $e) {
        return false;
    }
}

/**
 * Resolve the Pre-Quraan role that should control Moodle dashboard redirects.
 */
function local_prequran_dashboard_redirect_role(int $userid): string {
    global $DB;

    if ($userid <= 0) {
        return '';
    }

    try {
        if (local_prequran_table_exists_safely('local_prequran_student_profile')
            && $DB->record_exists('local_prequran_student_profile', ['userid' => $userid])) {
            return 'student';
        }

        if (local_prequran_table_exists_safely('local_prequran_teacher_profile')
            && $DB->record_exists('local_prequran_teacher_profile', ['userid' => $userid])) {
            return 'teacher';
        }

        if (local_prequran_table_exists_safely('local_prequran_teacher_student')
            && $DB->record_exists_select('local_prequran_teacher_student', 'teacherid = ? AND status <> ?', [$userid, 'archived'])) {
            return 'teacher';
        }

        if (local_prequran_table_exists_safely('local_prequran_class_group')
            && $DB->record_exists_select('local_prequran_class_group', 'teacherid = ? AND status <> ?', [$userid, 'archived'])) {
            return 'teacher';
        }

        if ($DB->record_exists_sql(
            "SELECT 1
               FROM {role_assignments} ra
               JOIN {role} r ON r.id = ra.roleid
              WHERE ra.userid = ?
                AND r.shortname IN ('editingteacher', 'teacher', 'noneditingteacher')",
            [$userid]
        )) {
            return 'teacher';
        }

        if (local_prequran_table_exists_safely('local_prequran_live_consent')
            && $DB->record_exists('local_prequran_live_consent', ['guardianid' => $userid])) {
            return 'parent';
        }

        if (local_prequran_table_exists_safely('local_prequran_comm_consent')
            && $DB->record_exists('local_prequran_comm_consent', ['guardianid' => $userid])) {
            return 'parent';
        }
    } catch (Throwable $e) {
        return '';
    }

    return '';
}

/**
 * Return true for Moodle paths that Pre-Quraan users must still be able to use.
 */
function local_prequran_redirect_allowed_path(string $path): bool {
    $path = '/' . ltrim(str_replace('\\', '/', $path), '/');

    $allowedexact = [
        '/login/index.php',
        '/login/logout.php',
        '/local/hubredirect/issue.php',
        '/local/hubredirect/issue_child.php',
        '/local/hubredirect/dashboard.php',
        '/webservice/rest/server.php',
        '/pluginfile.php',
        '/draftfile.php',
        '/theme/image.php',
    ];

    if (in_array($path, $allowedexact, true)) {
        return true;
    }

    $allowedprefixes = [
        '/local/hubredirect/live_',
        '/local/hubredirect/communications.php',
        '/local/hubredirect/recordings.php',
    ];

    foreach ($allowedprefixes as $prefix) {
        if (strpos($path, $prefix) === 0) {
            return true;
        }
    }

    return false;
}

/**
 * Return true when the current request is a generic Moodle page for Pre-Quraan users.
 */
function local_prequran_should_redirect_moodle_page(string $path, string $script): bool {
    if (local_prequran_redirect_allowed_path($path) || local_prequran_redirect_allowed_path($script)) {
        return false;
    }

    $mydashboard = preg_match('#/my/?(?:index\.php)?$#', $path)
        || preg_match('#/my/?(?:index\.php)?$#', $script);
    if ($mydashboard) {
        return true;
    }

    $blockedprefixes = [
        '/course/',
        '/calendar/',
        '/message/',
        '/user/',
        '/grade/',
        '/mod/',
        '/blocks/',
        '/report/',
    ];

    foreach ($blockedprefixes as $prefix) {
        if (strpos($path, $prefix) === 0 || strpos($script, $prefix) === 0) {
            return true;
        }
    }

    return false;
}

/**
 * Keep Pre-Quraan learners out of Moodle's generic pages.
 *
 * Administrators stay in Moodle. Teachers and parents go to the Moodle
 * Pre-Quraan dashboard. Students and other non-admin accounts go straight to
 * the Bunny app launcher.
 */
function local_prequran_before_http_headers(): void {
    global $CFG, $USER;

    if ((defined('CLI_SCRIPT') && CLI_SCRIPT)
        || (defined('AJAX_SCRIPT') && AJAX_SCRIPT)
        || (defined('WS_SERVER') && WS_SERVER)) {
        return;
    }

    if ((string)get_config('local_prequran', 'redirect_moodle_dashboard') === '0') {
        return;
    }

    if (!isloggedin() || isguestuser() || is_siteadmin($USER)) {
        return;
    }

    $script = str_replace('\\', '/', (string)($_SERVER['SCRIPT_NAME'] ?? ''));
    $path = parse_url((string)($_SERVER['REQUEST_URI'] ?? ''), PHP_URL_PATH) ?: $script;
    $path = '/' . ltrim(str_replace('\\', '/', $path), '/');

    if (!local_prequran_should_redirect_moodle_page($path, $script)) {
        return;
    }

    $role = local_prequran_dashboard_redirect_role((int)$USER->id);
    if ($role === 'teacher' || $role === 'parent') {
        redirect(new moodle_url('/local/hubredirect/dashboard.php'));
    }

    redirect(new moodle_url('/local/hubredirect/issue.php'));
}

/**
 * Hide the retired quraan_contact reply launcher from every Moodle page.
 */
function local_prequran_before_standard_html_head(): string {
    $css = "
a[href*='/local/quraan_contact/'],
a[href*='local/quraan_contact/'],
.floating-buttons,
[href*='quraan_contact'],
[onclick*='quraan_contact'],
[data-url*='quraan_contact'],
[class*='quraan-contact'],
[class*='quraan_contact'],
[id*='quraan-contact'],
[id*='quraan_contact'] {
    display: none !important;
    visibility: hidden !important;
    pointer-events: none !important;
    opacity: 0 !important;
}
";

    return html_writer::tag('style', $css, ['id' => 'local-prequran-remove-legacy-contact']);
}

/**
 * Remove the retired launcher if legacy code injects it after the page loads.
 */
function local_prequran_before_footer(): string {
    $js = <<<'JS'
(function() {
    function removeLegacyContactLauncher() {
        var selectors = [
            "a[href*='/local/quraan_contact/']",
            "a[href*='local/quraan_contact/']",
            "[href*='quraan_contact']",
            "[onclick*='quraan_contact']",
            "[data-url*='quraan_contact']",
            "[class*='quraan-contact']",
            "[class*='quraan_contact']",
            "[id*='quraan-contact']",
            "[id*='quraan_contact']",
            ".floating-buttons"
        ];

        selectors.forEach(function(selector) {
            document.querySelectorAll(selector).forEach(function(element) {
                element.remove();
            });
        });

        document.querySelectorAll("a, button, div, span").forEach(function(element) {
            var text = (element.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
            var style = window.getComputedStyle(element);
            var rect = element.getBoundingClientRect();
            var fixedBottomRight = style.position === "fixed" &&
                rect.width > 40 &&
                rect.height > 28 &&
                rect.right > window.innerWidth - 260 &&
                rect.bottom > window.innerHeight - 180;

            if ((text === "reply" || text.indexOf("reply") !== -1) && fixedBottomRight) {
                element.remove();
            }
        });
    }

    removeLegacyContactLauncher();

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", removeLegacyContactLauncher, {once: true});
    }

    if (document.documentElement) {
        new MutationObserver(removeLegacyContactLauncher).observe(document.documentElement, {
            childList: true,
            subtree: true
        });
    }
})();
JS;

    return html_writer::script($js);
}
