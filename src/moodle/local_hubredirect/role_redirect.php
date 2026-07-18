<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/accesslib.php');

$requestedworkspaceid = optional_param('workspaceid', 0, PARAM_INT);
$consumer = pqh_requested_consumer_context();
$slug = (string)($consumer->consumerslug ?? '');
$consumertype = (string)($consumer->consumer_type ?? '');
$consumerworkspaceid = (int)($consumer->workspaceid ?? 0);
$usesworkspacecontext = $consumerworkspaceid > 0 && !in_array($consumertype, ['academy_consumer', 'platform_foundation'], true);
$workspaceid = $requestedworkspaceid > 0 ? $requestedworkspaceid : ($usesworkspacecontext ? $consumerworkspaceid : 0);

if ($workspaceid <= 0) {
    $workspaceid = pqh_current_workspace_id((int)$USER->id, 0);
}

$params = [];
if ($slug !== '') {
    $params['consumer'] = $slug;
}
if ($workspaceid > 0) {
    $params['workspaceid'] = $workspaceid;
}

if ($consumertype === 'academy_consumer' && $requestedworkspaceid <= 0) {
    $academyparams = [];
    if ($slug !== '') {
        $academyparams['consumer'] = $slug;
    }
    redirect(new moodle_url('/local/hubredirect/dashboard.php', $academyparams));
}

if (pqh_can_manage_academy_operations((int)$USER->id)) {
    if ($consumertype === 'platform_foundation') {
        redirect(new moodle_url('/local/hubredirect/platform_consumers.php', $params));
    }
    if ($workspaceid > 0) {
        redirect(new moodle_url('/local/hubredirect/workspace_dashboard.php', $params));
    }
}

if ($workspaceid > 0) {
    $role = pqh_user_workspace_role((int)$USER->id, $workspaceid);
    if ($role === 'student') {
        redirect(new moodle_url('/local/hubredirect/dashboard.php', $params));
    }
    if ($role === 'parent') {
        redirect(new moodle_url('/local/hubredirect/workspace_parent.php', $params));
    }
    if (in_array($role, ['teacher', 'assistant_teacher'], true)) {
        redirect(new moodle_url('/local/hubredirect/teacher_workspace.php', $params));
    }
    if (in_array($role, ['owner', 'admin', 'platform_admin', 'coordinator', 'auditor'], true)) {
        redirect(new moodle_url('/local/hubredirect/workspace_dashboard.php', $params));
    }
    if ($role === '') {
        $userconsumer = pqh_user_primary_consumer_context((int)$USER->id);
        if ($userconsumer && (string)($userconsumer->consumerslug ?? '') !== '' && (string)($userconsumer->consumerslug ?? '') !== $slug) {
            redirect(pqh_user_consumer_dashboard_url($userconsumer));
        }
        if ($consumertype === 'academy_consumer' && $requestedworkspaceid <= 0) {
            $academyparams = [];
            if ($slug !== '') {
                $academyparams['consumer'] = $slug;
            }
            redirect(new moodle_url('/local/hubredirect/dashboard.php', $academyparams));
        }
    }
}

$dashboardpath = trim((string)($consumer->defaultdashboardpath ?? ''));
if ($dashboardpath === '') {
    $dashboardpath = $consumertype === 'platform_foundation'
        ? '/local/hubredirect/platform_consumers.php'
        : '/local/hubredirect/dashboard.php';
}

if ($consumertype === 'academy_consumer' && $requestedworkspaceid <= 0 && $dashboardpath === '/local/hubredirect/dashboard.php') {
    unset($params['workspaceid']);
}

redirect(new moodle_url($dashboardpath, $params));
