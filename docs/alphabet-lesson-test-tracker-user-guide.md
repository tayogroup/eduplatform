# Alphabet Lesson Test Tracker User Guide

Audience: intern SQA testers running the Quran Academy Pre-Quran Alphabet lesson test cases.

Tracker file: `docs/alphabet-lesson-test-tracker.html`

Moodle tracker page: `/local/hubredirect/sqa_test_artifacts.php?artifact=alphabet-tracker`

## Purpose

Use the Alphabet Lesson Test Tracker to record whether each Alphabet lesson test case passed, failed, was blocked, or needs retesting. The tracker also captures evidence links, screenshots, defect IDs, tester notes, environment details, and export files for handoff.

The tracker saves results in the current browser. At the end of every test session, export the run as JSON and CSV.

## Before You Start

1. Open the tracker.
2. Confirm you are using the correct test environment: Integration, Staging, Production, or Local Preview.
3. Confirm whether the test session is Managed or Unmanaged.
4. Open the Alphabet lesson in a separate browser tab.
5. Keep a place ready for screenshots, such as a folder named with the run ID.

## Run Details Fields

| Field | What to Enter | Example |
| --- | --- | --- |
| Run ID | Unique ID for this test run. The tracker creates one automatically. Keep it unless your lead gives you a specific run ID. | `ALPHA-20260628-1030` |
| Tester | Your name. | `Amina H.` |
| Environment | The system being tested. | `Integration` |
| Session Type | Choose the type of learner session. This also filters the visible test cases. | `Managed` |
| Browser / Device | Browser and device used for testing. Include mobile model if relevant. | `Chrome desktop`, `Android Chrome`, `iPhone Safari` |
| Student ID / Account | Student test account or Moodle user ID. Use a safe label if you do not know the ID. | `student_pre_quran_01` |
| Teacher / Parent Account | Related teacher or parent account used for report/visibility checks. | `parent_test_01`, `teacher_qa_01` |
| Alphabet URL | Full URL of the Alphabet lesson being tested. | `https://.../pre_quraan/.../alphabet/...` |
| Build / Asset Marker | Version marker shown by the app or given by the lead. Do not change unless testing a newer build. | `alphabet-phonetics-completefix-20260620a` |
| Run Notes | Preconditions, reset notes, known issues, account setup, or anything the lead should know. | `Student progress reset before run. Mic allowed.` |

## Session Type

The Session Type dropdown controls which cases are visible:

| Option | Use When | What You Will See |
| --- | --- | --- |
| Managed | Testing a Moodle-launched student account with saved progress, reports, and recording uploads. | Managed-specific cases plus shared cases. |
| Unmanaged | Testing a static/local preview or non-Moodle session. | Unmanaged-specific cases plus shared cases. |
| Both / Mixed | Running a full regression pass or comparing both modes. | All cases. |

## Summary Panel

The Summary panel shows the status of the currently relevant cases.

| Metric | Meaning |
| --- | --- |
| Total | Number of cases visible for the selected session mode. |
| Complete | Percentage of cases marked Pass, Fail, Blocked, Retest, or N/A. |
| Pass | Cases that passed. |
| Fail | Cases that failed and need a defect or clear note. |
| Blocked | Cases that could not be tested because something prevented testing. |
| Not Run | Cases not yet tested. |

## Controls

| Control | Use |
| --- | --- |
| Search | Finds cases by ID, category, priority, mode, test text, or expected result. |
| Category | Filters to one case group, such as Step Messages or Unmanaged Mode Use Cases. |
| Test Mode | Filters cases by Managed, Unmanaged, or both. This stays synced with Session Type. |
| Priority | Filters by P0, P1, P2, or P3. |
| Status | Filters by current result status. Useful for reviewing failures or unfinished cases. |

## Action Buttons

| Button | Use |
| --- | --- |
| Save | Saves current run details and results in this browser. |
| Export JSON | Exports the full run with all case details and results. Use this as the main handoff file. |
| Export CSV | Exports spreadsheet-friendly results. Use this for review, reporting, and defect triage. |
| Import JSON | Loads a previous tracker JSON export back into the tracker. |
| Print | Opens the browser print dialog for a printable record. |
| Reset Results | Clears statuses, notes, evidence, and defect IDs in this browser. Use only when starting fresh. |

## Test Case Fields

| Column | Description |
| --- | --- |
| ID | Unique test case ID. Quote this ID when asking questions or reporting defects. |
| Priority | Importance of the case. P0 is highest priority. |
| Test | What you must do. Follow the wording closely. |
| Expected Result | What should happen if the feature works correctly. |
| Status | Your result for the case. |
| Notes | Short observation, steps taken, or reason for pass/fail/block. |
| Evidence / Link | Screenshot path, video path, report link, console/network note, or defect link. |
| Defect ID | Bug ID from the defect tracker, if one was created. |

## Status Meanings

| Status | When to Use |
| --- | --- |
| Not Run | You have not tested the case yet. |
| Pass | The actual result matched the expected result. |
| Fail | The actual result did not match the expected result. Add notes, evidence, and a defect ID if available. |
| Blocked | You could not test because login, access, environment, account setup, or another dependency stopped you. |
| Retest | A defect was fixed or a result needs another pass. |
| N/A | The case does not apply to this run. Use sparingly and explain why in Notes. |

## How To Attach Screenshot Evidence

The tracker does not upload files directly. Instead, attach evidence by pasting a path or link into the `Evidence / Link` field.

Use one of these:

- Local screenshot path: `C:\Users\inawa\Pictures\SQA\ALPHA-20260628-1030\ALPHA-MSG-003-fail.png`
- Shared drive path if your team uses one.
- Browser-accessible image/video URL.
- Defect tracker URL.
- Moodle report URL.
- Short note such as `Console error: 404 on alphabet_listen_step_all_letters.mp3`.

For failures, screenshot the visible problem and include enough context to identify the case. Name screenshots with the test case ID when possible.

## Recommended Testing Workflow

1. Fill in all Run Details.
2. Select the correct Session Type.
3. Start with P0 cases.
4. For each test case, perform the action in the Alphabet lesson.
5. Compare the actual result to Expected Result.
6. Select the correct Status.
7. Add Notes for anything unusual.
8. Add Evidence / Link for failures, blocked cases, recordings, reports, and important confirmations.
9. Add Defect ID after creating or receiving a bug ticket.
10. Click Save periodically.
11. Export JSON and CSV at the end of the session.

## What To Record For Failures

Every Fail should include:

- What you clicked or tested.
- What happened.
- What should have happened.
- Browser/device.
- Screenshot or video evidence.
- Console/network error if available.
- Defect ID if one was created.

Example note:

`Clicked Pause during Listen. Button changed to Resume, but audio continued playing. Reproduced twice on Chrome desktop.`

Example evidence:

`C:\SQA\ALPHA-20260628-1030\ALPHA-CTRL-002-audio-continues.png`

## Managed vs Unmanaged Reminder

Managed mode means Moodle is involved. Expect saved progress, reports, and recording uploads.

Unmanaged mode means static/local behavior. Do not expect Moodle progress saves or teacher reports unless the session is explicitly converted to managed mode.

If you are unsure which mode you are testing, ask the SQA lead before marking managed-only or unmanaged-only cases.

## End Of Session Checklist

- All P0 cases have a status.
- All failures have notes and evidence.
- All blocked cases explain the blocker.
- Defect IDs are entered where available.
- Run Details are complete.
- JSON export is saved.
- CSV export is saved.
- Screenshots are stored with the run ID.

