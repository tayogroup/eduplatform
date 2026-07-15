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

function local_prequran_user_looks_like_student(int $userid): bool {
    global $DB;

    if ($userid <= 0) {
        return false;
    }

    try {
        if (local_prequran_table_exists_safely('local_prequran_student_profile')
            && $DB->record_exists('local_prequran_student_profile', ['userid' => $userid])) {
            return true;
        }

        $user = core_user::get_user($userid, 'id,username,email,idnumber,deleted', IGNORE_MISSING);
        if (!$user || !empty($user->deleted)) {
            return false;
        }

        $idnumber = strtoupper(trim((string)($user->idnumber ?? '')));
        if ($idnumber !== '' && preg_match('/^(EA-)?STU[-_]/', $idnumber)) {
            return true;
        }

        $username = strtolower(trim((string)($user->username ?? '')));
        if ($username !== '' && preg_match('/(^|[._-])student([._-]|$)/', $username)) {
            return true;
        }

        $email = strtolower(trim((string)($user->email ?? '')));
        return $email !== '' && preg_match('/(^|[._-])student[0-9._-]*@/', $email);
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
        if (local_prequran_user_looks_like_student($userid)) {
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
        '/local/hubredirect/course_launch.php',
        '/local/hubredirect/dashboard.php',
        '/local/hubredirect/managed_reports.php',
        '/local/hubredirect/unmanaged_reports.php',
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

function local_prequran_normalize_consumer_host(string $host): string {
    $host = strtolower(trim($host));
    $host = preg_replace('/^https?:\/\//', '', $host);
    $host = preg_replace('/\/.*$/', '', $host);
    $host = preg_replace('/:\d+$/', '', $host);
    $host = trim((string)$host, " \t\n\r\0\x0B.");
    return $host !== '' ? clean_param($host, PARAM_HOST) : '';
}

function local_prequran_request_host(): string {
    $host = (string)($_SERVER['HTTP_HOST'] ?? '');
    if ($host === '') {
        $host = (string)($_SERVER['SERVER_NAME'] ?? '');
    }
    return local_prequran_normalize_consumer_host($host);
}

function local_prequran_host_consumer_context(): ?stdClass {
    global $DB;

    $host = local_prequran_request_host();
    if ($host === ''
        || !local_prequran_table_exists_safely('local_prequran_consumer')
        || !local_prequran_table_exists_safely('local_prequran_consumer_domain')) {
        return null;
    }

    try {
        $domain = $DB->get_record('local_prequran_consumer_domain', ['domain' => $host, 'status' => 'active'], '*', IGNORE_MISSING);
        if (!$domain) {
            return null;
        }
        $consumer = $DB->get_record('local_prequran_consumer', ['id' => (int)$domain->consumerid, 'status' => 'active'], '*', IGNORE_MISSING);
        if (!$consumer) {
            return null;
        }
        $workspaceid = (int)($domain->workspaceid ?? 0);
        if ($workspaceid <= 0) {
            $workspaceid = (int)($consumer->primaryworkspaceid ?? 0);
        }
        return (object)[
            'consumerid' => (int)$consumer->id,
            'slug' => (string)$consumer->slug,
            'name' => (string)$consumer->name,
            'consumer_type' => (string)($consumer->consumer_type ?? ''),
            'institution_type' => (string)($consumer->institution_type ?? ''),
            'faith_subcategory' => (string)($consumer->faith_subcategory ?? ''),
            'teaching_method' => (string)($consumer->teaching_method ?? ''),
            'operator_type' => (string)($consumer->operator_type ?? ''),
            'website_mode' => (string)($consumer->website_mode ?? 'hosted'),
            'externalwebsiteurl' => (string)($consumer->externalwebsiteurl ?? ''),
            'domainmanagement' => (string)($consumer->domainmanagement ?? 'consumer_managed'),
            'portallabel' => (string)($consumer->portallabel ?? 'Learning portal'),
            'brandingsource' => (string)($consumer->brandingsource ?? 'eduplatform_settings'),
            'intakelocation' => (string)($consumer->intakelocation ?? 'eduplatform'),
            'integrationmethod' => (string)($consumer->integrationmethod ?? 'links'),
            'returnurl' => (string)($consumer->returnurl ?? ''),
            'workspaceid' => $workspaceid,
            'domain_type' => (string)($domain->domain_type ?? ''),
            'defaultpublicpath' => (string)($consumer->defaultpublicpath ?? '/'),
            'defaultdashboardpath' => (string)($consumer->defaultdashboardpath ?? '/local/hubredirect/dashboard.php'),
            'copyjson' => (string)($consumer->copyjson ?? ''),
        ];
    } catch (Throwable $e) {
        return null;
    }
}

function local_prequran_consumer_copy_value(?stdClass $consumer, string $key, string $fallback = ''): string {
    if (!$consumer || trim($key) === '') {
        return $fallback;
    }
    $copyjson = (string)($consumer->copyjson ?? '');
    if ($copyjson === '') {
        return $fallback;
    }
    $copy = json_decode($copyjson, true);
    if (!is_array($copy) || !array_key_exists($key, $copy)) {
        return $fallback;
    }
    $value = trim((string)$copy[$key]);
    return $value !== '' ? $value : $fallback;
}

function local_prequran_consumer_redirect_url(stdClass $consumer, bool $dashboard): ?moodle_url {
    $path = $dashboard ? (string)$consumer->defaultdashboardpath : (string)$consumer->defaultpublicpath;
    $path = '/' . ltrim(trim($path), '/');
    if ($path === '/' || $path === '') {
        $path = $dashboard ? '/local/hubredirect/dashboard.php' : '/local/hubredirect/consumer_landing.php';
    }
    if ($path === '/local/hubredirect/dashboard.php' && (int)$consumer->workspaceid > 0) {
        $path = '/local/hubredirect/workspace_dashboard.php';
    }
    $params = [];
    if ((string)$consumer->slug !== '') {
        $params['consumer'] = (string)$consumer->slug;
    }
    if ((int)$consumer->workspaceid > 0) {
        $params['workspaceid'] = (int)$consumer->workspaceid;
    }
    return new moodle_url($path, $params);
}

function local_prequran_consumer_login_url(stdClass $consumer, bool $sessionexpired = false): moodle_url {
    $path = local_prequran_consumer_copy_value($consumer, 'default_login_path', '/local/hubredirect/consumer_login.php');
    $path = '/' . ltrim(trim(str_replace('\\', '/', $path)), '/');
    if ($path === '/' || strpos($path, '//') === 0 || preg_match('/^\/?https?:/i', $path)) {
        $path = '/local/hubredirect/consumer_login.php';
    }

    $params = [];
    if ((string)($consumer->slug ?? '') !== '') {
        $params['consumer'] = (string)$consumer->slug;
    }
    if ((int)($consumer->workspaceid ?? 0) > 0) {
        $params['workspaceid'] = (int)$consumer->workspaceid;
    }
    if ($sessionexpired) {
        $params['sessionexpired'] = 1;
    }

    return new moodle_url($path, $params);
}

function local_prequran_uses_branded_login(?stdClass $consumer): bool {
    if (!$consumer) {
        return false;
    }
    $slug = (string)($consumer->slug ?? '');
    if ($slug === '') {
        return false;
    }

    $type = (string)($consumer->consumer_type ?? '');
    if ($type === 'platform_foundation') {
        return true;
    }

    return in_array($type, ['institution', 'academy_consumer', 'marketplace', 'teacher_workspace'], true);
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

    $script = str_replace('\\', '/', (string)($_SERVER['SCRIPT_NAME'] ?? ''));
    $path = parse_url((string)($_SERVER['REQUEST_URI'] ?? ''), PHP_URL_PATH) ?: $script;
    $path = '/' . ltrim(str_replace('\\', '/', $path), '/');
    $consumercontext = local_prequran_host_consumer_context();
    $isloginpage = $path === '/login/index.php' || $script === '/login/index.php';
    $ismydashboard = preg_match('#/my/?(?:index\.php)?$#', $path)
        || preg_match('#/my/?(?:index\.php)?$#', $script);
    $ishomepage = in_array($path, ['/', '/index.php'], true) || in_array($script, ['', '/', '/index.php'], true);

    if (!isloggedin() || isguestuser()) {
        $loginredirect = (string)($_GET['loginredirect'] ?? '') === '1';
        if ($loginredirect && $isloginpage) {
            if (local_prequran_uses_branded_login($consumercontext)) {
                redirect(local_prequran_consumer_login_url($consumercontext, true));
            }
            redirect(new moodle_url('/local/hubredirect/session_expired.php'));
        }
        if (local_prequran_uses_branded_login($consumercontext)
            && $isloginpage
            && strtoupper((string)($_SERVER['REQUEST_METHOD'] ?? 'GET')) === 'GET') {
            redirect(local_prequran_consumer_login_url($consumercontext));
        }
        if ($consumercontext && $ishomepage) {
            $publicurl = local_prequran_consumer_redirect_url($consumercontext, false);
            if ($publicurl) {
                redirect($publicurl);
            }
        }
        return;
    }

    if ($consumercontext && ($isloginpage || $ismydashboard || $ishomepage)) {
        $dashboardurl = local_prequran_consumer_redirect_url($consumercontext, true);
        if ($dashboardurl) {
            redirect($dashboardurl);
        }
    }

    if (is_siteadmin($USER)) {
        return;
    }

    if ($isloginpage) {
        redirect($consumercontext ? local_prequran_consumer_redirect_url($consumercontext, true) : new moodle_url('/local/hubredirect/dashboard.php'));
    }

    if (!local_prequran_should_redirect_moodle_page($path, $script)) {
        return;
    }

    $role = local_prequran_dashboard_redirect_role((int)$USER->id);
    if ($role === 'teacher' || $role === 'parent' || $role === 'student') {
        redirect($consumercontext ? local_prequran_consumer_redirect_url($consumercontext, true) : new moodle_url('/local/hubredirect/dashboard.php'));
    }

    redirect($consumercontext ? local_prequran_consumer_redirect_url($consumercontext, true) : new moodle_url('/local/hubredirect/dashboard.php'));
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
    $consumer = local_prequran_host_consumer_context();
    $brandname = trim((string)($consumer->name ?? ''));
    $consumerbase = local_prequran_request_host();
    $replacelegacybrand = $consumer
        && in_array((string)($consumer->consumer_type ?? ''), ['platform_foundation', 'marketplace', 'institution', 'teacher_workspace'], true)
        && $brandname !== ''
        && $consumerbase !== '';
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

    $output = html_writer::script($js);
    if ($replacelegacybrand) {
        $brandjson = json_encode($brandname, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT);
        $basejson = json_encode('https://' . $consumerbase, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT);
        $brandingjs = <<<JS
(function() {
    var brandName = {$brandjson};
    var consumerBase = {$basejson};
    function repairConsumerChrome() {
        document.querySelectorAll('a[href^="https://quraantest.academy/my"]').forEach(function(link) {
            var source = new URL(link.href);
            link.href = consumerBase + source.pathname + source.search + source.hash;
        });
        document.querySelectorAll('footer, #page-footer, .page-footer, .site-footer, nav.navbar, [role="navigation"]').forEach(function(container) {
            var walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
            var node;
            while ((node = walker.nextNode())) {
                var value = node.nodeValue || '';
                value = value.replace(/Quraan Academy by Ehel Academy Ltd/gi, brandName);
                value = value.replace(/Ehel Quraan Academy/gi, brandName);
                value = value.replace(/Quraan Academy/gi, brandName);
                node.nodeValue = value;
            }
        });
    }
    repairConsumerChrome();
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', repairConsumerChrome, {once: true});
    }
})();
JS;
        $output .= html_writer::script($brandingjs);
    }
    return $output;
}
