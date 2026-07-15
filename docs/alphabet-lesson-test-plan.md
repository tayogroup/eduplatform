# Alphabet Lesson Test Plan And Intern Script

Purpose: provide a detailed, repeatable test plan for the Quran Academy Pre-Quran Alphabet lesson and a practical script an intern can follow while recording results in the tracker.

Companion tracker: `docs/alphabet-lesson-test-tracker.html`

## How This Was Understood

The Alphabet lesson is the `alphabet_listen` unit inside the Pre-Quran course. It is launched from Moodle through the Quran Academy dashboard/course launcher, then served as a static learner unit with Moodle-managed progress when opened for a managed student.

The unit has 13 ordered learning steps:

1. Lecture
2. Rules
3. Listen
4. Watch
5. Phonetics
6. Repeat
7. LetterClue
8. Speak
9. Match
10. SoundClue
11. Animate
12. Write
13. Submit

The lesson depends on:

- Static assets from Bunny CDN or local preview paths.
- Shared runtime files for stepper, playback, progress, speak, match, write, and messaging.
- Moodle web services for managed progress and recordings.
- Browser media APIs for audio/video and microphone recording.
- Moodle reports for progress, quiz/practice, and recording evidence.

## Scope

In scope:

- Launching Alphabet from the dashboard and direct unit URL.
- Managed and unmanaged/local preview behavior.
- Stepper sequence, progress, completion, and step-back behavior.
- All 13 Alphabet steps.
- Media playback: lecture video, rules audio, letter audio, videos, animation, and captions where present.
- Settings: voice, speed, repeat, and filters.
- Speak and Submit microphone recording flows.
- Match game flow and failure/retry behavior.
- Write canvas/overlay/print controls.
- Moodle persistence, reports, and recording upload.
- Mobile and desktop layouts.
- Basic accessibility, privacy, and error handling.

Out of scope for this script:

- Full app-wide live sessions, parent dashboards, and teacher marketplace testing.
- Deep pronunciation-scoring accuracy, because Alphabet Speak comparison is currently disabled in config.
- External provider quality testing for ElevenLabs or BigBlueButton, except where links interfere with Alphabet.

## Test Environments

Run at least one full pass on integration before staging or production.

- Integration: app path normally contains `/pre_quraan_integration/`.
- Staging: app path normally contains `/pre_quraan_staging/`.
- Production: app path normally contains `/pre_quraan/`.
- Local preview: useful for layout and static behavior, but not a substitute for managed Moodle progress testing.

## Required Test Accounts

- Admin account with dashboard, reports, and reset permissions.
- Managed student account with Pre-Quran course access.
- Parent account linked to the managed student.
- Teacher account assigned to the managed student.
- Optional unmanaged/local preview session for static-only checks.

## Required Devices And Browsers

Desktop:

- Chrome or Edge latest.
- Firefox if available.

Mobile:

- Android Chrome or mobile emulation.
- iPhone Safari or Safari-like viewport if available.

Minimum viewport checks:

- Desktop: 1366 x 768 or larger.
- Tablet: around 768 x 1024.
- Mobile: around 390 x 844.

## Test Data To Capture

For every test run, record:

- Environment.
- URL.
- Browser/device.
- Tester name.
- Moodle user id or test account label.
- Student id.
- Build marker or asset version if visible: `alphabet-phonetics-completefix-20260620a`.
- Console errors.
- Screenshots for failures.
- Network errors for failed Moodle REST calls.
- Recording upload ids or report links where applicable.

## Entry Criteria

- Test account can log in to Moodle.
- Student has Pre-Quran course access.
- Alphabet unit files are deployed or available locally.
- Browser has audio playback permission.
- Microphone permission can be granted for Speak and Submit tests.
- Test tracker file opens in browser.

## Exit Criteria

- All P0/P1 tests pass or have documented defects.
- All 13 lesson steps have been exercised at least once.
- Progress persists after refresh for managed student.
- Speak and Submit recording flows are tested with success and denied-permission cases.
- Desktop and mobile layouts are checked.
- Reports or backend evidence confirm at least one managed progress update.

## Severity Guide

- P0: blocks lesson launch, login, progress, or data privacy.
- P1: blocks completion of a required step or recording upload.
- P2: incorrect behavior with workaround, layout issue, or confusing flow.
- P3: minor copy, polish, or non-blocking visual issue.

## Intern Test Script

### Phase 1: Setup And Baseline

1. Open the tracker: `docs/alphabet-lesson-test-tracker.html`.
2. Enter tester name, environment, browser, device, student id, and run notes.
3. Log in as admin and confirm the test student is active, linked to a parent, assigned to a teacher, and has Pre-Quran access.
4. Log out and log in as the managed student.
5. Open the Quran Academy dashboard.
6. Launch the Pre-Quran course and then Alphabet Learn/Listen.
7. Confirm the URL, asset environment, and Alphabet page load.

Expected:

- No Moodle error page.
- Alphabet page title/header appears.
- Stepper appears with 13 steps.
- Lecture is the first active step.
- No red console errors.

### Phase 2: App Shell And Navigation

1. Check header controls, settings, communications pill, and any parent/managed badge.
2. Open Settings and change voice, speed, repeat, and filter.
3. Close Settings and verify the page still works.
4. Refresh the page and verify settings do not corrupt the stepper or current step.
5. Use step picker or stepper navigation only where allowed.

Expected:

- Controls fit on desktop and mobile.
- Settings are readable and usable.
- Locked future steps are not freely accessible in managed mode unless QA/free navigation is intentionally enabled.

### Phase 3: Step-By-Step Functional Script

#### Step 1: Lecture

1. Start the Lecture step.
2. Confirm the lecture video appears and controls are usable.
3. Play, pause, resume, and complete or simulate completion if the test environment permits.
4. Confirm progress advances to Rules.

Expected:

- Video loads without broken source.
- Progress changes from 0/1 to 1/1.
- Stepper marks Lecture completed.

#### Step 2: Rules

1. Open Rules.
2. Start rules audio.
3. Confirm rules content scrolls/highlights without covering controls.
4. Let audio complete or use approved QA skip if the test run permits.
5. Confirm progress advances to Listen.

Expected:

- Rules audio file loads.
- Content is readable.
- Rules completion counts exactly once.

#### Step 3: Listen

1. Start Listen.
2. Confirm all alphabet letter tiles appear.
3. Confirm letter audio plays in sequence.
4. Confirm active tile animation highlights the current letter.
5. Change speed/repeat and retest a short pass.

Expected:

- Letter names play.
- No missing audio for common letters.
- Progress advances after required pass.

#### Step 4: Watch

1. Start Watch.
2. Open at least three letter videos, including first, middle, and last available letters.
3. Confirm video modal opens and closes.
4. Confirm audio/video timing does not freeze the page.
5. Complete the step.

Expected:

- Video assets load.
- Modal does not trap the user.
- Step completion persists.

#### Step 5: Phonetics

1. Start Phonetics.
2. Confirm explainer/modal behavior appears before phonetic playback when required.
3. Test at least five letters, including light, heavy, vowel, and distinction examples.
4. Confirm phonetic audio/video plays in the configured order.

Expected:

- Explainer behavior is clear.
- Phonetics content does not skip active letters.
- Progress advances.

#### Step 6: Repeat

1. Start Repeat.
2. Confirm each letter prompt plays slowly enough for the child to repeat.
3. If repeat recording is active, grant microphone and record a short attempt.
4. Retest with microphone denied.

Expected:

- Repeat prompts continue through the sequence.
- Denied microphone shows a helpful message and does not crash.
- Progress can continue according to the configured rules.

#### Step 7: LetterClue

1. Start LetterClue.
2. Confirm letter clue/anchor content appears.
3. Test at least five letters.
4. Confirm anchor audio and holds are not too short.

Expected:

- Letter clues correspond to the selected letter.
- Playback continues and completes.

#### Step 8: Speak

1. Start Speak.
2. Confirm microphone prompt appears when needed.
3. Grant microphone and record at least three letters.
4. Confirm completed letters visually mark as done.
5. Test replay or confirmation controls if available.
6. Refresh and confirm done state/progress is not lost for managed mode.

Expected:

- Speak UI mounts in `speakMount`.
- Browser permission flow is understandable.
- Recording upload attempts call `local_prequran_save_speak_recording` when managed.
- Speak comparison/scoring should not be expected because config disables comparison.

#### Step 9: Match

1. Start Match.
2. Confirm prompt audio auto-plays or a clear manual action is available.
3. Select correct and incorrect answers.
4. Confirm wrong answers show feedback and lives decrease.
5. Use all lives in one run if time allows.
6. Complete enough matches to pass.

Expected:

- Match uses 5 lives.
- Correct/wrong visual states are obvious.
- Game can restart after lives are used.
- Match completes after configured pass condition/max games.

#### Step 10: SoundClue

1. Start SoundClue.
2. Confirm sound clue audio and word/anchor repetitions play.
3. Test at least five letters.
4. Confirm progress text updates.

Expected:

- Sound clues are tied to the right letter.
- Word repeats and holds feel stable.
- Step completes.

#### Step 11: Animate

1. Start Animate.
2. Open at least three letter writing animations.
3. Confirm audio-before-video behavior.
4. Confirm modal sizing works on desktop and mobile.
5. Complete the step.

Expected:

- Animation video loads and plays at configured speed.
- Modal can be closed.
- No layout overflow.

#### Step 12: Write

1. Start Write.
2. Open the writing overlay.
3. Draw on the canvas with mouse/touch.
4. Test reset.
5. Test row/column controls.
6. Test print button if browser allows it.
7. Complete enough chunks/passes to satisfy the step.

Expected:

- Canvas accepts input.
- Ghost letters/guides are visible.
- Reset clears the current writing area.
- Print opens a printable view without corrupting the lesson.

#### Step 13: Submit

1. Start Submit.
2. Try to complete without recording.
3. Grant microphone and record final submission.
4. Confirm upload succeeds in managed mode.
5. Confirm final unit completion/reward state appears.
6. Refresh and confirm finished state persists.

Expected:

- Recording is required for Submit.
- Upload calls `local_prequran_save_submit_recording`.
- Maximum upload size is respected.
- Unit completion is visible in UI and reports.

### Phase 4: Persistence And Reports

1. Refresh after several completed steps.
2. Confirm the active step remains correct.
3. Log out and log back in as the same student.
4. Confirm progress is still present.
5. Log in as teacher and open managed report for the student.
6. Confirm progress and recordings are visible where expected.
7. Log in as parent and confirm no teacher-only/internal data is exposed.

Expected:

- Moodle progress matches the lesson UI.
- Speak/Submit evidence is available to authorized teacher/admin views.
- Parent sees only parent-safe data.

### Phase 5: Mobile And Accessibility

1. Open Alphabet on mobile viewport.
2. Confirm mobile step status and bottom dock appear.
3. Open step picker.
4. Exercise Listen, Speak, Match, Write, and Submit on mobile.
5. Check that buttons are tappable and text does not overlap.
6. Use keyboard tab navigation on desktop for main controls.
7. Confirm modals can be closed without mouse-only actions.

Expected:

- Mobile layout is usable.
- No controls overlap important content.
- Focus order is reasonable.
- Dialogs do not trap the tester.

### Phase 6: Negative And Error Handling

1. Disable microphone and test Speak.
2. Disable microphone and test Submit.
3. Use a user without access and try a direct Alphabet URL.
4. Simulate offline/network failure if possible.
5. Load with stale cache or hard refresh.
6. Try future-step direct navigation in managed mode.

Expected:

- Errors are clear and recoverable.
- Unauthorized users cannot access managed student data.
- Static files do not fail silently.
- Progress is not corrupted by failed requests.

## Detailed Test Cases

Use the companion tracker for result recording. The tracker includes these same case groups.

Use the tracker's Test Mode dropdown to switch between:

- Managed only: Moodle-launched student sessions with saved progress, reports, and recording uploads.
- Unmanaged only: static/local preview sessions without Moodle student context.
- Managed + unmanaged: the full regression list.

### Launch And Access

| ID | Priority | Test | Expected Result |
| --- | --- | --- | --- |
| ALPHA-LA-001 | P0 | Launch Alphabet from managed student dashboard. | Alphabet page opens with no Moodle error and correct student context. |
| ALPHA-LA-002 | P0 | Open direct managed Alphabet URL as unauthorized user. | Access is denied or no private student data is exposed. |
| ALPHA-LA-003 | P1 | Open local/static preview URL. | Unit renders without managed-only fatal errors. |
| ALPHA-LA-004 | P1 | Verify environment path and asset marker. | URL/base path and asset version match target environment. |

### Stepper And Progress

| ID | Priority | Test | Expected Result |
| --- | --- | --- | --- |
| ALPHA-SP-001 | P0 | Confirm 13 steps render in order. | Lecture through Submit appear in correct order. |
| ALPHA-SP-002 | P0 | Complete a step and refresh. | Completed state persists for managed user. |
| ALPHA-SP-003 | P1 | Use Step Back from a later step. | Confirmation appears and affected progress resets as described. |
| ALPHA-SP-004 | P1 | Attempt future locked step. | Future step remains locked unless QA/free mode is enabled. |
| ALPHA-SP-005 | P1 | Verify mobile step picker. | Step picker opens, lists steps, and closes cleanly. |

### Lesson Controls And Action Buttons

| ID | Priority | Test | Expected Result |
| --- | --- | --- | --- |
| ALPHA-CTRL-001 | P0 | Dynamic current-step action button updates when moving between steps. | Button label/action matches the active step and never points to the previous step. |
| ALPHA-CTRL-002 | P1 | Pause and resume during Listen/Repeat/Watch playback. | Playback pauses, button changes to Resume, and resume continues without restarting unexpectedly. |
| ALPHA-CTRL-003 | P1 | Stop/close modal during Watch, Phonetics, Animate, Write, and Speak/Submit flows. | Modal closes cleanly, media stops when expected, and the stepper remains usable. |
| ALPHA-CTRL-004 | P1 | Header/mobile Back button from a lesson step. | User returns to the expected previous page or app surface without losing saved progress. |
| ALPHA-CTRL-005 | P0 | Step Back button from a completed/current step. | Confirmation appears, described progress reset happens, and current step moves back correctly. |
| ALPHA-CTRL-006 | P1 | Cancel Step Back confirmation. | User remains on the same step and progress is unchanged. |
| ALPHA-CTRL-007 | P1 | QA Skip Step button, if visible in test environment. | Step is marked skipped/completed according to QA rules and handoff moves to the next step without corrupting progress. |
| ALPHA-CTRL-008 | P1 | QA Skip Step is hidden or unavailable for normal student/parent users. | Non-QA learners cannot skip required learning steps. |
| ALPHA-CTRL-009 | P1 | Mobile bottom action dock mirrors the active step action. | Mobile action button, pause slot, and back button are visible/usable without overlap. |
| ALPHA-CTRL-010 | P2 | Repeated rapid clicks on action/pause/resume. | UI does not duplicate playback, double-count progress, or freeze. |
| ALPHA-CTRL-011 | P1 | Step action button after refresh on an in-progress step. | Correct active step and action button are restored from managed progress. |
| ALPHA-CTRL-012 | P2 | Disabled/locked action states. | Buttons show disabled/locked state clearly and do not perform blocked actions. |

### Step Messages And Audio Prompts

| ID | Priority | Test | Expected Result |
| --- | --- | --- | --- |
| ALPHA-MSG-001 | P0 | Step entry message appears for each of the 13 steps. | Message popup/text appears before or at the start of the correct step and matches the active step. |
| ALPHA-MSG-002 | P1 | Continue button on message popup. | Continue closes the message and starts/enables the correct step action. |
| ALPHA-MSG-003 | P1 | Message audio plays when configured. | Audio prompts load and play for Lecture, Listen, Watch, Phonetics/Sound, Speak, and pass-level prompts. |
| ALPHA-MSG-004 | P1 | Steps with text-only messages. | Rules, Repeat, LetterClue, Match, SoundClue, Animate, Write, and Submit still show readable messages even when no audio is configured. |
| ALPHA-MSG-005 | P1 | Message audio failure or autoplay block. | Text still appears, Continue remains usable, and the lesson is not blocked. |
| ALPHA-MSG-006 | P1 | Pass-level messages for Listen. | Heavy, light, long-letter, and vowel pass messages appear/play at the correct pass. |
| ALPHA-MSG-007 | P1 | Pass-level messages for Watch and Repeat. | Heavy, light, long-letter, and vowel pass messages appear/play for those step passes when applicable. |
| ALPHA-MSG-008 | P2 | Write pass message. | "Keep writing carefully..." pass message appears without interrupting writing progress incorrectly. |
| ALPHA-MSG-009 | P0 | Final unit completion message. | Final completion message appears once after Submit/unit completion and does not repeat after refresh. |
| ALPHA-MSG-010 | P1 | Speak Done confirmation message. | Confirmation text appears with Continue/Cancel, Continue marks done, Cancel returns to recording/practice. |
| ALPHA-MSG-011 | P1 | Message handoff after Step Back or QA Skip. | Message state follows the new active step and does not show stale previous-step copy. |
| ALPHA-MSG-012 | P2 | Clap/visual celebration on configured message. | Watch entry message with clap flag shows the expected celebration effect without layout overlap. |
| ALPHA-MSG-013 | P2 | Localized message UI labels. | Message title and Continue label follow selected UI language where localization exists. |
| ALPHA-MSG-014 | P2 | Message popup responsive layout. | Message modal fits mobile and desktop screens, text is readable, and controls are tappable. |
| ALPHA-MSG-015 | P1 | Duplicate prevention. | Same entry/completion message is not shown repeatedly during rapid refresh, pause/resume, or step rerender. |

### Media And Settings

| ID | Priority | Test | Expected Result |
| --- | --- | --- | --- |
| ALPHA-MS-001 | P0 | Play lecture video. | Video loads, controls work, no console errors. |
| ALPHA-MS-002 | P1 | Play rules audio. | Rules audio loads and completion is counted. |
| ALPHA-MS-003 | P1 | Play Listen sequence. | Letter audio plays and active tile changes. |
| ALPHA-MS-004 | P1 | Change voice/speed/repeat settings. | Playback reflects settings or remains stable without error. |
| ALPHA-MS-005 | P2 | Test filter dropdown. | Filter choices are usable and do not break the grid. |

### Step Coverage

| ID | Priority | Test | Expected Result |
| --- | --- | --- | --- |
| ALPHA-ST-001 | P1 | Rules content and scroll/highlight. | Text is readable and highlight/scroll does not hide controls. |
| ALPHA-ST-002 | P1 | Watch video modal. | Modal opens, plays, and closes. |
| ALPHA-ST-003 | P1 | Phonetics explainer and playback. | Explainer appears and phonetics playback completes. |
| ALPHA-ST-004 | P1 | Repeat prompts and microphone fallback. | Repeat runs and denied mic path is handled. |
| ALPHA-ST-005 | P1 | LetterClue playback. | Clue content corresponds to active letter. |
| ALPHA-ST-006 | P0 | Speak recording. | Recording can be captured and uploaded in managed mode. |
| ALPHA-ST-007 | P1 | Match correct/wrong/lives. | Correct and wrong states display and lives behave correctly. |
| ALPHA-ST-008 | P1 | SoundClue playback. | Sound clue/word repeats play and progress updates. |
| ALPHA-ST-009 | P1 | Animate modal. | Writing animation loads and can close. |
| ALPHA-ST-010 | P0 | Write canvas. | Drawing, reset, and completion work. |
| ALPHA-ST-011 | P0 | Submit recording required. | Cannot finish without required final recording; upload succeeds when granted. |

### Focus, Progress, Rewards, And Summary Area

| ID | Priority | Mode | Test | Expected Result |
| --- | --- | --- | --- | --- |
| ALPHA-FP-001 | P0 | Both | Verify focus/progress area renders on lesson load. | Focus/progress area is visible, readable, and does not overlap the stepper, action buttons, or lesson content. |
| ALPHA-FP-002 | P1 | Managed | Complete a step and verify This Unit stars/progress. | This Unit stars or progress indicators update once for the completed step and remain correct after refresh. |
| ALPHA-FP-003 | P1 | Managed | Verify Total Stars and Units Done values for a managed student. | Summary values match the managed student report and do not show another learner or stale account. |
| ALPHA-FP-004 | P1 | Both | Check focus badge/state before, during, and after a step. | Focus state changes are understandable and do not hide primary controls. |
| ALPHA-FP-005 | P1 | Both | Pause/resume or leave/return while focus tracking is active. | Focus/progress display recovers without double-counting, resetting, or freezing progress. |
| ALPHA-FP-006 | P1 | Managed | Refresh after progress summary changes. | Managed summary reloads from the correct student state and does not flash incorrect values for another user. |
| ALPHA-FP-007 | P2 | Both | Hard refresh/cache check for progress area labels and values. | Latest labels and values appear; stale cached text or old misspellings are not visible. |
| ALPHA-FP-008 | P1 | Both | Mobile focus/progress layout. | Progress chips, stars, and focus text wrap cleanly on mobile with no clipped numbers or labels. |
| ALPHA-FP-009 | P1 | Unmanaged | Unmanaged progress summary behavior. | Static/local session shows local-only progress or a clear unmanaged state and does not attempt to display Moodle-only totals as saved data. |

### Labels, Copy, And Spelling

| ID | Priority | Mode | Test | Expected Result |
| --- | --- | --- | --- | --- |
| ALPHA-LBL-001 | P0 | Both | Verify the 13 step labels and spelling. | Labels read exactly: Lecture, Rules, Listen, Watch, Phonetics, Repeat, LetterClue, Speak, Match, SoundClue, Animate, Write, Submit. |
| ALPHA-LBL-002 | P1 | Both | Scan lesson UI for misspelled English labels. | No visible misspellings, broken capitalization, or old placeholder labels remain. |
| ALPHA-LBL-003 | P1 | Both | Verify Arabic and bilingual text rendering. | Arabic labels render right-to-left where intended and do not show mojibake, missing glyphs, or replacement boxes. |
| ALPHA-LBL-004 | P1 | Both | Verify dynamic button labels across all steps. | Play, Pause, Resume, Continue, Back, Step Back, Skip Step, Done, Record, Stop, Reset, Print, and Submit labels match the action being performed. |
| ALPHA-LBL-005 | P2 | Both | Verify Settings labels. | Voice, Speed, Repeat, Filter, and related option labels are spelled correctly and remain readable after changes. |
| ALPHA-LBL-006 | P2 | Both | Verify labels on mobile. | Buttons, chips, progress labels, and modal titles do not clip, overlap, or wrap awkwardly. |
| ALPHA-LBL-007 | P1 | Both | Verify message text grammar/spelling. | Entry, pass, warning, confirmation, and completion messages are child-friendly, spelled correctly, and match the current step. |
| ALPHA-LBL-008 | P2 | Both | Verify tracker/report labels. | Teacher/admin report labels and exported tracker labels use consistent spelling and terminology. |

### Unmanaged Mode Use Cases

| ID | Priority | Mode | Test | Expected Result |
| --- | --- | --- | --- | --- |
| ALPHA-UM-001 | P0 | Unmanaged | Launch the static Alphabet unit without managed Moodle context. | The unit opens without requiring a Moodle token, managed student id, or dashboard launch. |
| ALPHA-UM-002 | P1 | Unmanaged | Use an unmanaged/local preview URL while logged out. | Static preview works for allowed content and does not reveal private learner data. |
| ALPHA-UM-003 | P1 | Unmanaged | Verify unmanaged step navigation and free/practice behavior. | Available steps can be exercised according to unmanaged rules, and any locked managed-only behavior is clearly communicated. |
| ALPHA-UM-004 | P0 | Unmanaged | Watch network activity during unmanaged progress. | No Moodle progress-save, speak-upload, or submit-upload calls are made unless the session is explicitly converted to managed. |
| ALPHA-UM-005 | P1 | Unmanaged | Refresh an unmanaged session after completing a step. | Expected local-only state is retained or reset according to design; no false managed completion is created. |
| ALPHA-UM-006 | P1 | Unmanaged | Try Speak and Submit recording in unmanaged mode. | Recording is disabled, local-only, or clearly explains that managed upload is required; the lesson does not crash. |
| ALPHA-UM-007 | P1 | Unmanaged | Use media, settings, match, animate, and write in unmanaged mode. | Core static lesson interactions still work without Moodle services. |
| ALPHA-UM-008 | P0 | Unmanaged | Verify privacy in unmanaged mode. | No student name, parent account, teacher-only report link, or prior managed progress is visible. |
| ALPHA-UM-009 | P2 | Unmanaged | Export tester evidence for unmanaged run. | Tester can record notes/evidence in the SQA tracker even though no Moodle learner report is expected. |

### Reports And Data

| ID | Priority | Test | Expected Result |
| --- | --- | --- | --- |
| ALPHA-RD-001 | P0 | Moodle progress save. | Network call succeeds and report reflects progress. |
| ALPHA-RD-002 | P1 | Speak recording report. | Teacher/admin can see uploaded Speak evidence. |
| ALPHA-RD-003 | P0 | Submit recording report. | Teacher/admin can see final submission evidence. |
| ALPHA-RD-004 | P1 | Parent-safe visibility. | Parent sees permitted feedback only, not internal teacher/admin data. |

### Responsive, Accessibility, And Resilience

| ID | Priority | Test | Expected Result |
| --- | --- | --- | --- |
| ALPHA-UX-001 | P1 | Desktop layout. | No text overlap or clipped buttons at 1366 x 768. |
| ALPHA-UX-002 | P1 | Mobile layout. | Bottom dock, step picker, grid, and modals are usable. |
| ALPHA-UX-003 | P2 | Keyboard navigation. | Main controls and dialogs are keyboard reachable. |
| ALPHA-UX-004 | P1 | Microphone denied. | Speak/Submit show recoverable messages. |
| ALPHA-UX-005 | P1 | Network/API failure. | User gets clear failure and progress is not corrupted. |
| ALPHA-UX-006 | P2 | Hard refresh/cache. | Latest deployed assets load and no stale UI remains. |

## Suggested Improvements For Testing

- Add a visible build/version badge to the Alphabet unit in non-production environments.
- Add a QA-only "copy diagnostics" button that exports current step, user id, student id, environment, asset version, and last Moodle REST status.
- Add a dedicated test student reset button in admin tools for Alphabet progress only.
- Add report links directly after Speak and Submit upload success in integration/staging.
- Add automated smoke tests for: page load, 13-step presence, first media source availability, stepper rendering, and managed progress GET/SET.
- Add a small media manifest verification script for Alphabet audio/video/animation files.
- Keep one golden managed-student account and one locked unauthorized account for repeatable regression testing.
