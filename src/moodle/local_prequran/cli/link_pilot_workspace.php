<?php
// CLI: give the Ehel English pilot a WORKSPACE identity so the portal teacher
// and at-risk views work.
//
// WHY: the pilot was provisioned through the catalog/cohort path — real Moodle
// courses (ehel-eng-g0N) with students enrolled by cohort_sync and teachers given
// the editingteacher role. The portal reads a different data path entirely:
//   * pqh_current_workspace_id() -> local_prequran_workspace_member  (no row => 0
//     => every teacher handler 403s)
//   * at-risk / engagement population -> workspace_member(role=student, active)
//   * teacher roster + at-risk teacher scoping -> local_prequran_teacher_student
// Moodle's editingteacher role assignment is invisible to all of them. This
// script writes the missing rows.
//
// It derives the mapping from ACTUAL course enrolments (not username parsing):
// for each ehel-eng-g0N course it reads the enrolled students and editing
// teachers, then links every teacher of that course to every student of it.
//
// SAFETY: only ever touches users whose username starts `ehel-pilot-`, so it
// cannot pull real accounts into the pilot workspace. Idempotent.
//
//   php local/prequran/cli/link_pilot_workspace.php --dry-run
//   php local/prequran/cli/link_pilot_workspace.php
//   php local/prequran/cli/link_pilot_workspace.php --delete

define('CLI_SCRIPT', true);
require(__DIR__ . '/../../../config.php');
require_once($CFG->libdir . '/clilib.php');
require_once($CFG->libdir . '/accesslib.php');

[$options] = cli_get_params([
    'help' => false,
    'slug' => 'ehel-academy',
    'name' => 'Ehel Academy',
    'workspaceid' => 0,
    'courses' => 'ehel-eng-g01,ehel-eng-g02,ehel-eng-g03',
    'dry-run' => false,
    'delete' => false,
], ['h' => 'help']);

if ($options['help']) {
    cli_writeln("Link the Ehel pilot courses into a workspace so the portal teacher views work.");
    cli_writeln("  --slug=        workspace slug (default ehel-academy)");
    cli_writeln("  --name=        workspace name (default 'Ehel Academy')");
    cli_writeln("  --workspaceid= reuse an existing workspace id instead of get-or-create");
    cli_writeln("  --courses=     comma list of course idnumbers (default the 3 enrolled grades)");
    cli_writeln("  --dry-run      report only");
    cli_writeln("  --delete       remove the pilot member/assignment rows (keeps the workspace)");
    exit(0);
}

const PILOT_PREFIX = 'ehel-pilot-';
$now = time();
$actor = 2; // admin uid fallback; only stored as createdby/assignedby
$dbman = $DB->get_manager();

foreach (['local_prequran_workspace', 'local_prequran_workspace_member', 'local_prequran_teacher_student'] as $t) {
    if (!$dbman->table_exists($t)) {
        cli_error("Required table {$t} is missing — run the local_prequran upgrade first.");
    }
}

/** Insert only the columns that actually exist (schema-drift safe). */
function ehelpw_filter(string $table, array $data): stdClass {
    global $DB;
    $cols = $DB->get_columns($table);
    $out = [];
    foreach ($data as $k => $v) {
        if (isset($cols[$k])) {
            $out[$k] = $v;
        }
    }
    return (object)$out;
}

function ehelpw_upsert_member(int $wsid, int $userid, string $role, int $actor, bool $dry): string {
    global $DB, $now;
    $existing = $DB->get_record('local_prequran_workspace_member',
        ['workspaceid' => $wsid, 'userid' => $userid, 'workspace_role' => $role]);
    if ($existing) {
        if ((string)$existing->status !== 'active') {
            if (!$dry) {
                $DB->update_record('local_prequran_workspace_member',
                    (object)['id' => (int)$existing->id, 'status' => 'active', 'timemodified' => $now]);
            }
            return 'reactivated';
        }
        return 'exists';
    }
    if (!$dry) {
        $DB->insert_record('local_prequran_workspace_member', ehelpw_filter('local_prequran_workspace_member', [
            'workspaceid' => $wsid, 'userid' => $userid, 'workspace_role' => $role, 'status' => 'active',
            'notes' => '', 'createdby' => $actor, 'timecreated' => $now, 'timemodified' => $now,
        ]));
    }
    return 'created';
}

function ehelpw_upsert_assignment(int $wsid, int $teacherid, int $studentid, int $actor, bool $dry): string {
    global $DB, $now;
    $existing = $DB->get_record('local_prequran_teacher_student',
        ['workspaceid' => $wsid, 'teacherid' => $teacherid, 'studentid' => $studentid]);
    if ($existing) {
        if ((string)$existing->status !== 'active') {
            if (!$dry) {
                $DB->update_record('local_prequran_teacher_student',
                    (object)['id' => (int)$existing->id, 'status' => 'active', 'timemodified' => $now]);
            }
            return 'reactivated';
        }
        return 'exists';
    }
    if (!$dry) {
        $DB->insert_record('local_prequran_teacher_student', ehelpw_filter('local_prequran_teacher_student', [
            'workspaceid' => $wsid, 'teacherid' => $teacherid, 'studentid' => $studentid,
            'cohortid' => 0, 'status' => 'active', 'assignedby' => $actor,
            'timecreated' => $now, 'timemodified' => $now,
        ]));
    }
    return 'created';
}

// ---- 1. workspace ---------------------------------------------------------
$wsid = (int)$options['workspaceid'];
if ($wsid > 0) {
    if (!$DB->record_exists('local_prequran_workspace', ['id' => $wsid])) {
        cli_error("No workspace with id {$wsid}.");
    }
    cli_writeln("workspace: reusing id {$wsid}");
} else {
    $ws = $DB->get_record('local_prequran_workspace', ['slug' => $options['slug']]);
    if ($ws) {
        $wsid = (int)$ws->id;
        cli_writeln("workspace: found '{$options['slug']}' id {$wsid}");
    } else if ($options['dry-run']) {
        cli_writeln("workspace: would CREATE '{$options['slug']}' ({$options['name']})");
        $wsid = -1;
    } else {
        // workspace_type 'school' — deliberately NOT 'solo_teacher', which would
        // make every teacher member count as every student's teacher.
        $wsid = (int)$DB->insert_record('local_prequran_workspace', ehelpw_filter('local_prequran_workspace', [
            'name' => $options['name'], 'slug' => $options['slug'], 'workspace_type' => 'school',
            'ownerid' => 0, 'status' => 'active', 'plan_code' => 'pilot',
            'student_limit' => 0, 'teacher_limit' => 0, 'session_limit' => 0, 'storage_limit_mb' => 0,
            'settingsjson' => '{}', 'createdby' => $actor, 'timecreated' => $now, 'timemodified' => $now,
        ]));
        cli_writeln("workspace: CREATED '{$options['slug']}' id {$wsid}");
    }
}

// ---- 2. walk the courses --------------------------------------------------
$studentroleid = (int)$DB->get_field('role', 'id', ['shortname' => 'student']);
$teacherroleids = [];
foreach (['editingteacher', 'teacher'] as $sn) {
    $rid = (int)$DB->get_field('role', 'id', ['shortname' => $sn]);
    if ($rid > 0) {
        $teacherroleids[] = $rid;
    }
}

$mem = ['created' => 0, 'exists' => 0, 'reactivated' => 0];
$asg = ['created' => 0, 'exists' => 0, 'reactivated' => 0];
$delmem = 0; $delasg = 0;

foreach (array_filter(array_map('trim', explode(',', (string)$options['courses']))) as $idnumber) {
    $course = $DB->get_record('course', ['idnumber' => $idnumber]);
    if (!$course) {
        cli_writeln("  ! course {$idnumber} not found — skipping");
        continue;
    }
    $ctx = context_course::instance($course->id);
    $pilotonly = function(array $users): array {
        return array_filter($users, function($u) {
            return strpos((string)$u->username, PILOT_PREFIX) === 0;
        });
    };
    $students = $pilotonly(get_role_users($studentroleid, $ctx, false, 'u.id, u.username'));
    $teachers = [];
    foreach ($teacherroleids as $rid) {
        $teachers += $pilotonly(get_role_users($rid, $ctx, false, 'u.id, u.username'));
    }
    cli_writeln("{$idnumber}: " . count($teachers) . " teacher(s), " . count($students) . " student(s)");

    if ($options['delete']) {
        if ($wsid > 0 && !$options['dry-run']) {
            foreach ($teachers as $t) {
                $delasg += $DB->delete_records('local_prequran_teacher_student',
                    ['workspaceid' => $wsid, 'teacherid' => (int)$t->id]) ? 1 : 0;
                $DB->delete_records('local_prequran_workspace_member',
                    ['workspaceid' => $wsid, 'userid' => (int)$t->id]);
                $delmem++;
            }
            foreach ($students as $s) {
                $DB->delete_records('local_prequran_workspace_member',
                    ['workspaceid' => $wsid, 'userid' => (int)$s->id]);
                $delmem++;
            }
        }
        continue;
    }

    if ($wsid <= 0) {
        continue; // dry-run with no workspace yet
    }
    foreach ($teachers as $t) {
        $mem[ehelpw_upsert_member($wsid, (int)$t->id, 'teacher', $actor, $options['dry-run'])]++;
    }
    foreach ($students as $s) {
        $mem[ehelpw_upsert_member($wsid, (int)$s->id, 'student', $actor, $options['dry-run'])]++;
    }
    foreach ($teachers as $t) {
        foreach ($students as $s) {
            $asg[ehelpw_upsert_assignment($wsid, (int)$t->id, (int)$s->id, $actor, $options['dry-run'])]++;
        }
    }
}

cli_writeln('');
if ($options['delete']) {
    cli_writeln("Removed pilot rows (members touched={$delmem}) — workspace kept."
        . ($options['dry-run'] ? '  [DRY RUN]' : ''));
} else {
    cli_writeln("workspace_member: created={$mem['created']}, existing={$mem['exists']}, reactivated={$mem['reactivated']}");
    cli_writeln("teacher_student : created={$asg['created']}, existing={$asg['exists']}, reactivated={$asg['reactivated']}"
        . ($options['dry-run'] ? '  [DRY RUN]' : ''));
}

// ---- 3. report the consumer/domain situation ------------------------------
// If the login host maps to a consumer_domain owned by a DIFFERENT consumer,
// pqh_consumer_context_allows_workspace() will hide this workspace from that
// host. Report so we can decide whether an ehel consumer/domain row is needed.
cli_writeln('');
cli_writeln('-- consumer domains (login-host mapping) --');
if ($dbman->table_exists('local_prequran_consumer_domain') && $dbman->table_exists('local_prequran_consumer')) {
    $rows = $DB->get_records_sql(
        "SELECT cd.id, cd.domain, cd.workspaceid, c.slug AS consumerslug, c.primaryworkspaceid
           FROM {local_prequran_consumer_domain} cd
           JOIN {local_prequran_consumer} c ON c.id = cd.consumerid
          WHERE cd.status = 'active' ORDER BY cd.domain", []);
    if (!$rows) {
        cli_writeln('  (none) — hosts fall back to platform_foundation, which allows ALL workspaces.');
    }
    foreach ($rows as $r) {
        cli_writeln(sprintf('  %-34s consumer=%-18s cd.workspaceid=%d primaryws=%d',
            $r->domain, $r->consumerslug, (int)$r->workspaceid, (int)$r->primaryworkspaceid));
    }
} else {
    cli_writeln('  consumer/domain tables missing.');
}
cli_writeln('');
cli_writeln("Pilot workspace id = {$wsid}");
