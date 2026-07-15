# Workspace And Institution Model

This model supports Quraan Academy, solo independent teachers, and institutions with multiple teachers through one workspace abstraction.

## Core Idea

A workspace is the operational boundary for students, parents, teachers, classes, live sessions, materials, and reports.

An organization group is the relationship boundary above consumers/workspaces. It is used only when several schools share ownership, brand, curriculum, or governance rules.

Workspace types:

- `academy_managed`: Quraan Academy owned operations.
- `solo_teacher`: one independent teacher operating independently.
- `institution`: an organization with multiple teachers and admins.
- `partner`, `masjid`, `school`: future labels using the same permissions model.

## Roles

Workspace roles live in `local_prequran_workspace_member`:

- `owner`
- `admin`
- `teacher`
- `assistant_teacher`
- `coordinator`
- `auditor`
- `parent`
- `student`

Platform administrators and `school_principal` users can see/manage all workspaces through the academy operations layer.

## Institution Ownership Cases

### Wholly Owned Schools

Use one `owned_group` organization group when one institution owns several schools, campuses, or branches.

Recommended shape:

- Parent institution/consumer owns the group.
- Each school or branch remains a separate workspace.
- Group user links give central owners/admins inherited access only when the branch member link is configured for operational or audit scope.
- Branch staff remain scoped to their own workspace unless separately added elsewhere.

This is the correct model for one legal/operator organization with multiple school sites.

### Franchise Schools

Use one `franchise_network` organization group when schools are independently operated but share a brand, curriculum, platform, or franchise agreement.

Recommended shape:

- The franchise network or brand owner owns the group.
- Each franchise school remains its own institution consumer/workspace.
- The default relationship is `franchise_member` with governance visibility only.
- Sensitive access to chats, students, finance, reports, and support must be explicitly granted through `access_scope` and `inherit_sensitive_access`.

This keeps the brand owner from automatically reading school-owned parent/student/teacher conversations.

## Organization Group Tables

Group records live in `local_prequran_org_group`:

- `owned_group`: wholly owned school group.
- `franchise_network`: independent franchise network.
- `partner_network`: looser partner network.

Group member links live in `local_prequran_org_group_member`:

- `member_type`: `user`, `consumer`, or `workspace`.
- `relationship_type`: `owned_branch`, `franchise_member`, `managed_service`, or `partner`.
- `group_role`: user role in the group, such as `owner`, `admin`, `auditor`, or `support`.
- `access_scope`: `governance`, `operations`, `audit`, or `shared_support`.
- `inherit_sensitive_access`: explicit flag for cross-workspace sensitive access.

Access rule:

- Owned branches can support inherited operations/audit access when configured.
- Franchise members do not inherit sensitive access by default.
- Franchise shared support or audit must be explicit and auditable.

Seeded operating model records:

- `owned-schools`: an `owned_group` for wholly owned schools.
- `franchise-schools`: a `franchise_network` for independently run franchise schools.

Operations admins can refresh these records and link each school from `/local/hubredirect/workspaces.php` under **Institution Operating Model**. Use `owned_branch` with `operations` scope for wholly owned schools, and `franchise_member` with `governance` scope for independently run franchise schools.

School staff stay inside the school workspace:

- Institution group `owner` and `admin` users can manage an `owned_branch` only when the branch link has `operations` or `audit` scope and `inherit_sensitive_access = 1`.
- School principals and school administrators are direct workspace `admin` members.
- Teachers are direct workspace `teacher` or `assistant_teacher` members.
- Parents and students are direct workspace `parent` and `student` members.
- Franchise school links default to `governance` only and do not grant inherited sensitive access unless the link is explicitly expanded.

## Implementation Added

- Moodle upgrade helper: `xmldb_local_prequran_ensure_workspace_schema()`.
- Tables:
  - `local_prequran_workspace`
  - `local_prequran_workspace_member`
  - `local_prequran_workspace_material`
  - `local_prequran_org_group`
  - `local_prequran_org_group_member`
- Default workspace seed:
  - slug: `quraan-academy`
  - type: `academy_managed`
- Workspace helper functions:
  - `pqh_user_workspaces()`
  - `pqh_user_workspace_role()`
  - `pqh_user_can_manage_workspace()`
  - `pqh_user_can_teach_in_workspace()`
  - `pqh_current_workspace_id()`
- Organization group helper functions:
  - `pqh_org_group_schema_ready()`
  - `pqh_user_org_group_links()`
  - `pqh_user_org_group_workspace_ids()`
  - `pqh_user_has_org_group_workspace_access()`
- Organization operating model seed:
  - `xmldb_local_prequran_seed_organization_operating_model()`
  - `owned-schools`
  - `franchise-schools`
- Admin page:
  - `/local/hubredirect/workspaces.php`

## First Enforcement Rule

Every new student, class group, live session, material, report, and parent/teacher view should resolve a workspace first:

1. Which workspace is this user operating inside?
2. What role does the user have in that workspace?
3. Is the requested student, session, material, or report inside that workspace?

Older records default to the `quraan-academy` workspace until migrated or reassigned.

## Next Work

1. Add workspace selectors to student intake, teacher intake, grouping, and live-session wizards.
2. Scope report queries by `workspaceid`.
3. Scope teacher/student assignment checks by `workspaceid`.
4. Add institution dashboards for owners/admins.
5. Add workspace plan-limit checks before creating students, teachers, sessions, and material records.
