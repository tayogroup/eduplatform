# Live Chat And Help Desk Pilot Smoke Checklist

Use this checklist after deploy, Moodle upgrade, and cache purge.

## Role Browser Checks

- Student can open support and create a student-to-help-desk conversation.
- Student can create a student-to-teacher conversation only when policy and teacher assignment allow it.
- Parent can create a parent-to-teacher conversation only for a linked child.
- Teacher can view and reply only to allowed student/parent conversations.
- Help desk agent can view queue conversations and reply.
- Agent can convert a conversation to a ticket.
- Supervisor can view reports and audit review.
- Restricted reviewer can see restricted tickets; ordinary support staff cannot.

## Workflow Checks

- Conversation messages appear without manual refresh during active chat.
- Unread count refreshes while the panel is closed.
- Typing/viewing indicators appear only to authorized conversation participants.
- Agent converts chat to ticket with priority, category, assignee, SLA, and status.
- Complete public chat history remains attached to the ticket.
- Public ticket reply appears in conversation history.
- Conversation reply appears in ticket timeline.
- Internal note does not appear to student or parent.
- Resolved or closed ticket can receive a satisfaction rating.
- Quality review can be recorded for sampled/reported tickets.

## Audit Checks

- `conversation_created` audit row exists.
- `message_created` audit row exists.
- `ticket_converted` audit row exists.
- `ticket_updated` audit row exists after status/priority/assignment change.
- `report_exported` audit row exists after CSV export.
- Ticket event timeline contains conversion, public reply, internal note, SLA, rating, or quality review events as applicable.
- `/local/hubredirect/support_audit.php` shows recent audit and event rows for the pilot workspace.

## Negative Checks

- Unrelated student cannot open another student's conversation by guessed ID.
- Unrelated parent cannot view another child's support history.
- Unrelated teacher cannot view a student outside their assignment.
- Workspace admin cannot access another workspace's support records.
- User without `supportaudit` cannot open the audit page.
- User without `supportreports` cannot export CSV.
- User without `supportviewrestricted` cannot see restricted tickets.

## Rollback Check

- Disable live chat flag and confirm live status falls back to away/offline.
- Disable async support for non-pilot scopes and confirm new support entry points stop creating conversations.
- Existing records remain visible to authorized admins for audit review.
