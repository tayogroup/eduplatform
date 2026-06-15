# Moodle Web Services

Document web service functions, request payloads, response payloads, roles, groups, and permissions here.

## Planned Communications Services

See [communications-implementation-plan.md](communications-implementation-plan.md) for the staged implementation plan covering announcements, teacher-parent messaging, supervised student help requests, data tables, permissions, moderation, consent, and Moodle web-service endpoints.

### Phase 1 Announcements

Initial announcement services are implemented in `src/moodle/local_prequran/externallib_v4.php` and registered in `src/moodle/local_prequran/services.php`:

- `local_prequran_comm_list_threads`
- `local_prequran_comm_get_thread`
- `local_prequran_comm_create_announcement`
- `local_prequran_comm_create_parent_thread`
- `local_prequran_comm_send_message`

Manual SQL helper: `src/moodle/local_prequran/sql/create_comm_phase1.sql`.

### Phase 2 Teacher-Parent Messaging

Teacher-parent messaging uses the same communication tables as announcements. A teacher/admin creates a `parent_teacher` thread with an explicit `parentid`; after that, only explicit participants can read and reply. Students cannot create or view parent-teacher threads unless incorrectly added as participants, and the backend rejects managed students as `parentid`.

Create a parent thread:

- `wsfunction`: `local_prequran_comm_create_parent_thread`
- `cohortid`: cohort containing the student
- `studentid`: student user id
- `parentid`: Moodle user id for the parent/guardian account
- `subject`: short thread title
- `body`: initial message

Send a reply:

- `wsfunction`: `local_prequran_comm_send_message`
- `threadid`: parent-teacher thread id
- `body`: reply body
- `templatekey`: optional, usually empty for Phase 2

List parent-teacher threads:

- `wsfunction`: `local_prequran_comm_list_threads`
- `cohortid`: cohort id
- `type`: `parent_teacher`
- `studentid`: optional student filter

## Moodle Upgrade Settings

If Moodle shows new external-auth mapping settings for custom profile fields after upgrade, the safe default is usually to leave mappings empty and click `Save changes`, unless the site intentionally syncs these fields from External database, LDAP, or Shibboleth.

Current language profile fields expected by the app:

- `prequran_language`: preferred course/content language.
- `scope`: language scope, normalized by the app as `ui`, `content`, or `both`.

For manually managed Moodle accounts, leave external auth mapping empty, keep `Update external` as `Never`, and keep the field unlocked if teachers/admins should be able to edit it in Moodle.
