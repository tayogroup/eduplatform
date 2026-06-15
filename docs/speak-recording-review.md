# Speak Recording Review

Speak recordings are uploaded through Moodle, not directly from browser JavaScript to Bunny.net.

Flow:

1. Student records a Speak item.
2. Student clicks Done and confirms Continue.
3. Browser sends the recording to Moodle web service `local_prequran_save_speak_recording`.
4. Moodle validates the user, uploads the audio to Bunny Storage, and stores metadata for teacher review.
5. The unit marks the item complete.

## Frontend Config

Each unit can enable uploads without putting message copy or secrets in config:

```js
speak: {
  recordingUpload: {
    enabled: true,
    required: false,
    wsFunction: 'local_prequran_save_speak_recording',
    maxBytes: 3000000
  }
}
```

Use `required: false` while Moodle/Bunny setup is being finalized. Change to `true` when production upload and metadata tables are confirmed.

## Moodle Config

Store Bunny settings server-side in Moodle plugin config:

```text
local_prequran | bunny_storage_zone          = quraanacademy
local_prequran | bunny_storage_host          = storage.bunnycdn.com
local_prequran | bunny_storage_access_key    = <Bunny Storage password>
local_prequran | bunny_submission_prefix     = pre_quraan/submissions/speak
local_prequran | speak_recording_maxbytes    = 3000000
```

Never place the Bunny storage access key in HTML or JavaScript.

## Metadata Table

Create a Moodle table named `local_prequran_speakrec` with these recommended columns:

```sql
CREATE TABLE mdl_local_prequran_speakrec (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  userid BIGINT NOT NULL,
  lessonid VARCHAR(100) NOT NULL,
  unitid VARCHAR(100) NOT NULL,
  step_id VARCHAR(100) NOT NULL,
  letter_key VARCHAR(100) NOT NULL,
  letter_name VARCHAR(255) NOT NULL,
  letter_text VARCHAR(255) NOT NULL DEFAULT '',
  attempt_no BIGINT NOT NULL DEFAULT 1,
  duration_ms BIGINT NOT NULL DEFAULT 0,
  mime_type VARCHAR(100) NOT NULL DEFAULT 'audio/webm',
  filesize BIGINT NOT NULL DEFAULT 0,
  filename VARCHAR(255) NOT NULL,
  bunny_path VARCHAR(500) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'submitted',
  score DECIMAL(10,2) NULL,
  teacher_feedback LONGTEXT NULL,
  timecreated BIGINT NOT NULL,
  timemodified BIGINT NOT NULL,
  INDEX mdl_lpspeak_user_idx (userid),
  INDEX mdl_lpspeak_unit_idx (unitid),
  INDEX mdl_lpspeak_status_idx (status)
);
```

Adjust the table prefix if your Moodle prefix is not `mdl_`.

## Teacher Review

The review page should read `local_prequran_speakrec`, filter by teacher course/cohort/group access, and allow:

- Play student recording.
- Play teacher reference audio.
- Enter score.
- Enter feedback.
- Mark status as `reviewed` or `needs_practice`.
