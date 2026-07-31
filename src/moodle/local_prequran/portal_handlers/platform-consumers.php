<?php
// ---- report: platform-consumers (tenant/consumer administration; read + admin writes) ----
// Ported from local_hubredirect/platform_consumers.php via platform_consumers_portallib
// (pqpcl_*). Included from portal_data.php AFTER token auth: $claims verified,
// $USER set to the token user, JSON exception handler installed, headers sent.
// GET  = every non-foundation consumer with branding/theme/copy, grouped domains,
//        workspace link state, admin debug links, and the option lists the page's
//        forms are built from.
// POST = the page's five sesskey-guarded admin writes, verbatim via the lib:
//        do=update_consumer (plus nested workspace-status update), do=update_domain,
//        do=add_domain, do=link_workspace, do=create_workspace.
//        confirm_sesskey() dropped: token auth replaces the session key.

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/institutionlib.php');
require_once($CFG->dirroot . '/local/hubredirect/platform_consumers_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

// -- access: same two-stage gate as the page's
//    pqh_require_platform_operations('Only platform administrators can manage consumer apps.')
//    (foundation-domain check, then academy-operations check), with
//    pqh_access_denied's redirects replaced by pqpd_fail(403, same message). --
$consumercontext = pqh_current_consumer_context();
$isfoundationdomain = (string)($consumercontext->consumerslug ?? '') === 'eduplatform'
    && (string)($consumercontext->consumer_type ?? '') === 'platform_foundation'
    && !empty($consumercontext->trusted_domain);
if (!$isfoundationdomain) {
    pqpd_fail(403, 'EduPlatform administration is only available from the EduPlatform foundation domain.');
}
if (!pqh_can_manage_academy_operations($userid)) {
    pqpd_fail(403, 'Only platform administrators can manage consumer apps.');
}

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    $body = json_decode((string)file_get_contents('php://input'), true);
    if (!is_array($body)) {
        $body = [];
    }
    $do = clean_param((string)($body['do'] ?? ''), PARAM_ALPHANUMEXT);
    // Mirror of the legacy optional_param(name, default, PARAM_*) reads.
    $bparam = static function (string $name, $default, string $type) use ($body) {
        if (!array_key_exists($name, $body) || $body[$name] === null) {
            return $default;
        }
        if ($type === PARAM_INT) {
            return (int)clean_param($body[$name], PARAM_INT);
        }
        return clean_param((string)$body[$name], $type);
    };

    try {
        // Governance hardening: every tenant/domain write is audited, and the
        // destructive ones (archive/pause a consumer, change its routing slug,
        // disable a live domain, flip the primary domain) require an explicit
        // confirm_dangerous flag from the page — no more one-POST outages.
        $pcaudit = static function (string $action, int $targetid, array $details) use ($DB, $USER): void {
            try {
                if (!$DB->get_manager()->table_exists(new xmldb_table('local_prequran_course_audit'))) {
                    return;
                }
                $DB->insert_record('local_prequran_course_audit', (object)[
                    'consumerid' => (int)($details['consumerid'] ?? 0), 'workspaceid' => (int)($details['workspaceid'] ?? 0),
                    'offeringid' => 0, 'requestid' => 0, 'studentid' => 0,
                    'actorid' => (int)$USER->id, 'action' => substr($action, 0, 80),
                    'targettype' => 'consumer_config', 'targetid' => $targetid,
                    'details' => json_encode($details, JSON_UNESCAPED_SLASHES),
                    'timecreated' => time(),
                ]);
            } catch (Throwable $auditerror) {
                // Audit must never break the write.
            }
        };
        $confirmed = !empty($body['confirm_dangerous']);

        if ($do === 'update_consumer') {
            // Destructive-change gate: compare against the stored record BEFORE writing.
            $targetconsumerid = $bparam('consumerid', 0, PARAM_INT);
            $before = $DB->get_record('local_prequran_consumer', ['id' => $targetconsumerid], 'id,slug,status', IGNORE_MISSING);
            $newslug = $bparam('consumer_slug', '', PARAM_TEXT);
            $newstatus = $bparam('consumer_status', 'active', PARAM_ALPHANUMEXT);
            if ($before) {
                $dangers = [];
                if ($newslug !== '' && (string)$before->slug !== '' && $newslug !== (string)$before->slug) {
                    $dangers[] = 'slug change ' . $before->slug . ' -> ' . $newslug . ' (breaks existing links)';
                }
                if ((string)$before->status === 'active' && in_array($newstatus, ['archived', 'paused'], true)) {
                    $dangers[] = 'status active -> ' . $newstatus . ' (takes the tenant offline)';
                }
                if ($dangers && !$confirmed) {
                    pqpd_fail(400, 'CONFIRMATION REQUIRED: ' . implode('; ', $dangers) . '. Re-submit with the confirmation box ticked to proceed.');
                }
            }
            // -- write 1: legacy action=update_consumer (verbatim call order) --
            pqpcl_update_consumer(
                $bparam('consumerid', 0, PARAM_INT),
                $bparam('consumer_name', '', PARAM_TEXT),
                $bparam('consumer_slug', '', PARAM_TEXT),
                $bparam('consumer_type', 'institution', PARAM_ALPHANUMEXT),
                $bparam('institution_type', 'primary_education', PARAM_ALPHANUMEXT),
                $bparam('faith_subcategory', '', PARAM_ALPHANUMEXT),
                $bparam('teaching_method', 'regular', PARAM_ALPHANUMEXT),
                $bparam('operator_type', 'private_entity', PARAM_ALPHANUMEXT),
                $bparam('consumer_status', 'active', PARAM_ALPHANUMEXT),
                $bparam('supportemail', '', PARAM_EMAIL),
                $bparam('defaultpublicpath', '/', PARAM_LOCALURL),
                $bparam('defaultdashboardpath', '/local/hubredirect/dashboard.php', PARAM_LOCALURL),
                $bparam('logourl', '', PARAM_TEXT),
                $bparam('brandinitials', '', PARAM_TEXT),
                $bparam('primarycolor', '#2f6f4e', PARAM_TEXT),
                $bparam('accentcolor', '#d99a26', PARAM_TEXT),
                $bparam('surfacecolor', '#f4f8fb', PARAM_TEXT),
                $bparam('heroimage', '', PARAM_TEXT),
                $bparam('headline', '', PARAM_TEXT),
                $bparam('subtitle', '', PARAM_TEXT),
                $bparam('bodycopy', '', PARAM_TEXT),
                $bparam('initialcourses', '', PARAM_TEXT)
            );
            // -- write 1b: nested workspace-status update (legacy: only when workspaceid > 0) --
            $updateworkspaceid = $bparam('workspaceid', 0, PARAM_INT);
            if ($updateworkspaceid > 0) {
                pqpcl_update_workspace(
                    $updateworkspaceid,
                    $bparam('workspace_status', 'active', PARAM_ALPHANUMEXT)
                );
            }
            $pcaudit('consumer_updated', $targetconsumerid, [
                'consumerid' => $targetconsumerid,
                'slug' => $newslug, 'status' => $newstatus,
                'previous_slug' => $before ? (string)$before->slug : '',
                'previous_status' => $before ? (string)$before->status : '',
            ]);
            echo json_encode(['ok' => true, 'message' => 'Consumer settings and workspace status updated.'], JSON_UNESCAPED_SLASHES);
            exit;
        }

        if ($do === 'update_domain') {
            $targetdomainid = $bparam('domainid', 0, PARAM_INT);
            $domainbefore = $DB->get_record('local_prequran_consumer_domain', ['id' => $targetdomainid], 'id,consumerid,domain,status,isprimary', IGNORE_MISSING);
            $newdomainstatus = $bparam('domain_status', 'active', PARAM_ALPHANUMEXT);
            $newisprimary = $bparam('isprimary', 0, PARAM_INT);
            if ($domainbefore) {
                $dangers = [];
                if ((string)$domainbefore->status !== 'disabled' && $newdomainstatus === 'disabled') {
                    $dangers[] = 'disabling domain ' . $domainbefore->domain . ' (may take a live host offline)';
                }
                if ((int)$domainbefore->isprimary === 0 && $newisprimary === 1) {
                    $dangers[] = 'making ' . $domainbefore->domain . ' primary (demotes the current primary domain)';
                }
                if ($dangers && !$confirmed) {
                    pqpd_fail(400, 'CONFIRMATION REQUIRED: ' . implode('; ', $dangers) . '. Re-submit with the confirmation box ticked to proceed.');
                }
            }
            // -- write 2: legacy action=update_domain --
            pqpcl_update_domain(
                $targetdomainid,
                $newdomainstatus,
                $bparam('domain_type', 'public', PARAM_ALPHANUMEXT),
                $newisprimary
            );
            $pcaudit('consumer_domain_updated', $targetdomainid, [
                'consumerid' => $domainbefore ? (int)$domainbefore->consumerid : 0,
                'domain' => $domainbefore ? (string)$domainbefore->domain : '',
                'status' => $newdomainstatus, 'isprimary' => $newisprimary,
                'previous_status' => $domainbefore ? (string)$domainbefore->status : '',
                'previous_isprimary' => $domainbefore ? (int)$domainbefore->isprimary : 0,
            ]);
            echo json_encode(['ok' => true, 'message' => 'Domain updated.'], JSON_UNESCAPED_SLASHES);
            exit;
        }

        if ($do === 'add_domain') {
            // -- write 3: legacy action=add_domain --
            pqpcl_add_domain(
                $bparam('consumerid', 0, PARAM_INT),
                $bparam('workspaceid', 0, PARAM_INT),
                $bparam('domain', '', PARAM_HOST),
                $bparam('domain_type', 'public', PARAM_ALPHANUMEXT),
                $bparam('isprimary', 0, PARAM_INT)
            );
            $pcaudit('consumer_domain_added', $bparam('consumerid', 0, PARAM_INT), [
                'consumerid' => $bparam('consumerid', 0, PARAM_INT),
                'domain' => $bparam('domain', '', PARAM_HOST),
                'domain_type' => $bparam('domain_type', 'public', PARAM_ALPHANUMEXT),
                'isprimary' => $bparam('isprimary', 0, PARAM_INT),
            ]);
            echo json_encode(['ok' => true, 'message' => 'Domain added or refreshed.'], JSON_UNESCAPED_SLASHES);
            exit;
        }

        if ($do === 'link_workspace') {
            // -- write 4: legacy action=link_workspace --
            pqpcl_link_workspace(
                $bparam('consumerid', 0, PARAM_INT),
                $bparam('linkworkspaceid', 0, PARAM_INT),
                $bparam('owneruserid', 0, PARAM_INT)
            );
            $pcaudit('consumer_workspace_linked', $bparam('consumerid', 0, PARAM_INT), [
                'consumerid' => $bparam('consumerid', 0, PARAM_INT),
                'workspaceid' => $bparam('linkworkspaceid', 0, PARAM_INT),
                'owneruserid' => $bparam('owneruserid', 0, PARAM_INT),
            ]);
            echo json_encode(['ok' => true, 'message' => 'Primary workspace linked.'], JSON_UNESCAPED_SLASHES);
            exit;
        }

        if ($do === 'create_workspace') {
            // -- write 5: legacy action=create_workspace --
            $workspaceid = pqpcl_create_workspace_for_consumer(
                $bparam('consumerid', 0, PARAM_INT),
                $bparam('owneruserid', 0, PARAM_INT)
            );
            $pcaudit('consumer_workspace_created', $bparam('consumerid', 0, PARAM_INT), [
                'consumerid' => $bparam('consumerid', 0, PARAM_INT),
                'workspaceid' => (int)$workspaceid,
                'owneruserid' => $bparam('owneruserid', 0, PARAM_INT),
            ]);
            echo json_encode(['ok' => true, 'message' => 'Workspace #' . $workspaceid . ' created and linked.', 'workspaceid' => $workspaceid], JSON_UNESCAPED_SLASHES);
            exit;
        }
    } catch (Throwable $e) {
        // Legacy catches Throwable and shows $e->getMessage() in the error alert.
        pqpd_fail(400, $e->getMessage());
    }

    pqpd_fail(400, 'Unknown platform-consumers action.');
}

// -- GET: the same dataset the page renders (rows + grouped domains + options) --
$consumers = pqpcl_consumer_rows();
$domains = pqpcl_domains_by_consumer($consumers);
$workspaceoptions = pqpcl_workspace_options();

$nameids = [];
$consumersout = [];
foreach ($consumers as $consumer) {
    // Verbatim per-consumer decoration from the page's render loop.
    $workspaceid = (int)$consumer->primaryworkspaceid;
    $params = ['consumer' => (string)$consumer->slug, 'workspaceid' => $workspaceid];
    $consumerdomains = $domains[(int)$consumer->id] ?? [];
    $theme = pqhi_default_theme(pqhi_json_array((string)($consumer->themejson ?? '')));
    $copy = pqhi_default_copy((string)$consumer->name, pqhi_json_array((string)($consumer->copyjson ?? '')));
    $heroimage = pqh_consumer_hero_image_url($consumer);
    $institutiontype = pqhi_clean_institution_type((string)($consumer->institution_type ?? 'primary_education'));
    $faithsubcategory = pqhi_clean_faith_subcategory((string)($consumer->faith_subcategory ?? ''));
    $teachingmethod = pqhi_clean_teaching_method((string)($consumer->teaching_method ?? 'regular'));
    $operatortype = pqhi_clean_operator_type((string)($consumer->operator_type ?? 'private_entity'));
    $consumercontextrow = pqh_consumer_context_by_slug((string)$consumer->slug);
    $workspaceurl = pqh_consumer_url('/local/hubredirect/workspace_dashboard.php', $consumercontextrow, $params);

    $nameids[] = (int)($consumer->owneruserid ?? 0);
    $nameids[] = (int)($consumer->ownerid ?? 0);

    $domainsout = [];
    foreach ($consumerdomains as $domain) {
        $domainsout[] = [
            'id' => (int)$domain->id,
            'domain' => (string)$domain->domain,
            'domain_type' => (string)$domain->domain_type,
            'status' => (string)$domain->status,
            'isprimary' => (int)$domain->isprimary,
            'sslstatus' => (string)($domain->sslstatus ?? ''),
            'verificationstatus' => (string)($domain->verificationstatus ?? ''),
        ];
    }

    $consumersout[] = [
        'id' => (int)$consumer->id,
        'name' => (string)$consumer->name,
        'slug' => (string)$consumer->slug,
        'consumer_type' => (string)$consumer->consumer_type,
        'institution_type' => $institutiontype,
        'institution_type_label' => pqhi_institution_type_label($institutiontype),
        'faith_subcategory' => $faithsubcategory,
        'faith_subcategory_label' => $faithsubcategory !== '' ? pqhi_faith_subcategory_label($faithsubcategory) : '',
        'teaching_method' => $teachingmethod,
        'teaching_method_label' => pqhi_teaching_method_label($teachingmethod),
        'operator_type' => $operatortype,
        'operator_type_label' => pqhi_operator_type_label($operatortype),
        'status' => (string)$consumer->status,
        'workspaceid' => $workspaceid,
        'workspacename' => (string)($consumer->workspacename ?? ''),
        'workspaceslug' => (string)($consumer->workspaceslug ?? ''),
        'workspacestatus' => (string)($consumer->workspacestatus ?? ''),
        'workspace_type' => (string)($consumer->workspace_type ?? ''),
        'owneruserid' => (int)($consumer->owneruserid ?: ($consumer->ownerid ?? 0)),
        'supportemail' => (string)$consumer->supportemail,
        'defaultpublicpath' => (string)$consumer->defaultpublicpath,
        'defaultdashboardpath' => (string)$consumer->defaultdashboardpath,
        'logourl' => (string)($consumer->logourl ?? ''),
        'theme' => $theme,
        'copy' => $copy,
        'heroimage' => $heroimage,
        'timemodified' => (int)($consumer->timemodified ?? 0),
        'domains' => $domainsout,
        'links' => [
            'settings' => $workspaceid > 0 ? (new moodle_url('/local/hubredirect/institution_settings.php', $params))->out(false) : '',
            'workspace' => $workspaceid > 0 ? $workspaceurl->out(false) : '',
            'profile' => $workspaceid > 0 ? (new moodle_url('/local/hubredirect/institution_profile.php', $params))->out(false) : '',
            'onboarding' => (new moodle_url('/local/hubredirect/institution_onboarding.php'))->out(false),
            'landing' => (new moodle_url('/local/hubredirect/consumer_landing.php', ['consumer' => (string)$consumer->slug] + ($workspaceid > 0 ? ['workspaceid' => $workspaceid] : [])))->out(false),
            'diagnostics' => (new moodle_url('/local/hubredirect/consumer_diagnostics.php', ['consumer' => (string)$consumer->slug]))->out(false),
            'probe' => (new moodle_url('/local/hubredirect/consumer_probe.php', ['consumer' => (string)$consumer->slug]))->out(false),
        ],
    ];
}

$workspacesout = [];
foreach ($workspaceoptions as $workspaceoption) {
    $workspacesout[] = [
        'id' => (int)$workspaceoption->id,
        'name' => (string)$workspaceoption->name,
        'slug' => (string)$workspaceoption->slug,
        'workspace_type' => (string)$workspaceoption->workspace_type,
        'status' => (string)$workspaceoption->status,
        'ownerid' => (int)($workspaceoption->ownerid ?? 0),
    ];
}

echo json_encode([
    'ok' => true, 'ready' => true,
    'schema_ready' => pqh_consumer_schema_ready(),
    'consumers' => $consumersout,
    'workspaceoptions' => $workspacesout,
    'options' => [
        'consumer_type' => pqhi_consumer_type_options(),
        'institution_type' => pqhi_institution_type_options(),
        'faith_subcategory' => pqhi_faith_subcategory_options(),
        'teaching_method' => pqhi_teaching_method_options(),
        'operator_type' => pqhi_operator_type_options(),
        'status' => pqpcl_status_options(),
        'domain_status' => pqpcl_domain_status_options(),
        'domain_type' => pqpcl_domain_type_options(),
    ],
    'toplinks' => [
        'dashboard' => (new moodle_url('/local/hubredirect/platform_dashboard.php'))->out(false),
        'create_consumer' => (new moodle_url('/local/hubredirect/consumer_wizard.php'))->out(false),
        'institution_wizard' => (new moodle_url('/local/hubredirect/institution_onboarding.php'))->out(false),
        'diagnostics' => (new moodle_url('/local/hubredirect/platform_diagnostics.php'))->out(false),
    ],
    'legacyurl' => $CFG->wwwroot . '/local/hubredirect/platform_consumers.php',
    'currentuserid' => $userid,
    'names' => pqpd_names($nameids),
], JSON_UNESCAPED_SLASHES);
exit;
