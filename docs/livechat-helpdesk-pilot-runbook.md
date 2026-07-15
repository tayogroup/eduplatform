# Live Chat And Help Desk Pilot Runbook

Purpose: launch the support chat and ticket workflow for one controlled workspace before broader rollout.

## Pilot Scope

- Enable support only for the selected workspace/cohort.
- Keep global defaults conservative unless the pilot workspace policy explicitly overrides them.
- Keep attachments, external messaging ingestion, and destructive retention purge disabled.
- Assign one help desk owner, one teacher-support owner, one supervisor, and one restricted-ticket reviewer.

## Pre-Launch Gates

- Moodle upgrade completed and caches purged.
- `verify_support_phase1.sql` through `verify_support_phase8.sql` reviewed.
- Workspace policy confirms:
  - async support enabled only for pilot scope
  - live chat enabled only if staff coverage exists
  - student free text policy approved
  - parent visibility default approved
  - restricted categories reviewed
- Staff capabilities reviewed:
  - `supportusechat`
  - `supportreply`
  - `supportviewqueue`
  - `supportconvert`
  - `supportupdateticket`
  - `supportaudit`
  - `supportviewrestricted`
- Audit page reviewed at `/local/hubredirect/support_audit.php`.

## Daily Pilot Operations

- Start of day:
  - Check open, unassigned, breached, and restricted ticket counts.
  - Confirm the support inbox opens for help desk and teacher users.
  - Confirm live chat shows online only when staff coverage is present.
- During support hours:
  - Agents reply in conversations first.
  - Convert to ticket when follow-up, assignment, SLA, restricted handling, or supervisor visibility is needed.
  - Add internal notes only for staff-only operational details.
  - Keep restricted tickets assigned to approved reviewers only.
- End of day:
  - Resolve or reassign stale open work.
  - Review SLA warnings/breaches.
  - Review quality queue samples.
  - Review support audit coverage.

## Escalation

- Safeguarding/restricted: assign to the restricted queue and notify the approved reviewer outside the student-visible conversation.
- Billing/account: route to finance/admin queue.
- Lesson or teacher issue: route to teacher support.
- Platform access issue: route to help desk.
- Cross-workspace access concern: stop pilot expansion, keep records read-only, and review audit logs.

## Rollback

- Disable non-pilot workspace entry points by turning off global/workspace support flags.
- Disable live chat first; leave asynchronous conversation history read-only.
- Stop relying on live polling if load or privacy risk appears.
- Preserve all support conversation, ticket, event, and audit records.
- Keep `/local/hubredirect/support_audit.php` available to authorized admins.
- Do not delete or purge pilot support records during rollback.

## Evidence To Keep

- Screenshots or notes from student, parent, teacher, agent, supervisor, and restricted reviewer smoke tests.
- SQL verification output.
- Audit page export/screenshot showing conversation create, message create, conversion, status update, internal note, report export, and quality review evidence where applicable.
- List of pilot issues and disposition before widening rollout.
