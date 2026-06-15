# Parent WhatsApp urgent alerts

This feature adds an optional WhatsApp delivery channel for urgent or important child-related parent alerts.

The system should treat Moodle communications as the source of truth. WhatsApp is only a fast delivery path. Every alert is first written as a parent-teacher communication thread and message, then Moodle notifications and WhatsApp delivery are attempted.

## When to use

Use urgent WhatsApp alerts for situations that need parent attention quickly, such as:

- A child cannot join or remain safely in a live class.
- A teacher or admin needs a parent response before the next class.
- A safeguarding, consent, attendance, schedule, or technical issue needs same-day parent attention.

Do not use this path for ordinary lesson summaries, routine reminders, marketing, or private teacher-only notes.

## Configuration

In Moodle site administration, open the PreQuran local plugin settings and configure:

- `Enable urgent WhatsApp alerts`
- `WhatsApp delivery provider`: use `Meta WhatsApp Cloud API`
- `Meta Graph API version`
- `Meta phone number ID`
- `Meta permanent access token`
- `Meta urgent alert template name`
- `Meta template language code`

The Moodle plugin sends directly to Meta WhatsApp Cloud API when `Meta WhatsApp Cloud API` is selected. The generic webhook fields remain available only for a future external integration service.

## Meta template

Create and approve a WhatsApp template in Meta Business Manager before enabling live alerts.

Recommended template name:

`parent_urgent_alert`

Recommended language:

`en_US`

Recommended body text:

```text
Hello {{1}}, this is an urgent update from Quraan Academy regarding {{2}}.

{{3}}

Please open your parent messages here: {{4}}
```

The Moodle adapter sends these variables:

- `{{1}}`: parent or guardian full name
- `{{2}}`: student full name
- `{{3}}`: alert message body
- `{{4}}`: Moodle parent communication link

## Web service

Registered function:

`local_prequran_comm_send_parent_alert`

Parameters:

- `cohortid`: optional legacy cohort context
- `studentid`: required Moodle user id of the child
- `sessionid`: optional live session id for audit linkage
- `subject`: parent-safe alert title
- `body`: parent-safe alert message
- `urgent`: when true, attempt WhatsApp delivery if configured

Behavior:

1. Checks that the caller can create parent communications for the student.
2. Finds linked guardians from communication consent, live consent, and existing parent-teacher threads.
3. Creates a `local_prequran_comm_thread` and `local_prequran_comm_message`.
4. Adds teacher/admin and parent participants.
5. Sends the normal Moodle notification.
6. If `urgent = true`, sends WhatsApp template messages for guardians with a phone or WhatsApp number.
7. Writes delivery audit rows to `local_prequran_live_audit`.

## Meta Cloud API payload

The plugin posts JSON to:

```text
https://graph.facebook.com/{graph_version}/{phone_number_id}/messages
```

Payload shape:

```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "254700000000",
  "type": "template",
  "template": {
    "name": "parent_urgent_alert",
    "language": {
      "code": "en_US"
    },
    "components": [
      {
        "type": "body",
        "parameters": [
          { "type": "text", "text": "Parent Name" },
          { "type": "text", "text": "Student Name" },
          { "type": "text", "text": "Please contact Quraan Academy about today's class." },
          { "type": "text", "text": "https://quraan.academy/local/hubredirect/communications.php?..." }
        ]
      }
    ]
  }
}
```

Meta should return a 2xx status and message id when it accepts the send request.

## Audit actions

Expected audit actions in `local_prequran_live_audit`:

- `notification_sent`
- `notification_failed`
- `notification_skipped`
- `whatsapp_alert_sent`
- `whatsapp_alert_failed`
- `whatsapp_alert_skipped`
- `urgent_parent_alert_skipped`

The communication history is available in:

- `local_prequran_comm_thread`
- `local_prequran_comm_message`
- `local_prequran_comm_participant`
- `local_prequran_comm_audit`

## Smoke test

1. Configure Meta Cloud API settings in the PreQuran plugin settings.
2. Make sure the Meta template is approved and the configured phone number can send to the test parent number.
3. Make sure a test student has at least one linked parent with a valid phone or WhatsApp number on their Moodle user profile or custom profile fields.
4. Call `local_prequran_comm_send_parent_alert` with `urgent = true`.
5. Confirm a parent-teacher thread appears in `/local/hubredirect/communications.php`.
6. Confirm `notification_sent` and `whatsapp_alert_sent` audit rows exist.
7. Disable WhatsApp alerts and repeat; the communication thread should still be created, while WhatsApp should audit as skipped.
