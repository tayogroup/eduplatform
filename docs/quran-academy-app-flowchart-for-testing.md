# Quran Academy App Flowchart For Testing

Purpose: help a new testing intern understand where users enter the system, which areas they can reach, and what to verify in each flow.

## Big Picture

```mermaid
flowchart TD
    A[User opens Quran Academy] --> B{Logged in to Moodle?}
    B -->|No| C[Public site and intake pages]
    C --> D[Student / teacher inquiry or intake]
    D --> E[Admin reviews setup, consent, enrollment, workspace]
    E --> F[Moodle login]

    B -->|Yes| F[Moodle login]
    F --> G[local_prequran role redirect]
    G --> H[Quran Academy dashboard]

    H --> I{Detected role}
    I -->|Student| J[Student dashboard]
    I -->|Parent| K[Parent dashboard]
    I -->|Teacher| L[Teacher dashboard]
    I -->|Admin| M[Admin dashboard]
    I -->|Referrer / principal| N[Special role dashboard links]

    J --> O[Course launcher]
    K --> O
    L --> O
    M --> O

    O --> P[Pre-Quran static app shell]
    P --> Q[Lesson units and activities]
    Q --> R[Progress, recordings, quiz analytics]
    R --> S[Moodle web services and reports]

    H --> T[Communications]
    H --> U[Live sessions]
    H --> V[Workspace tools]
    H --> W[Reports and admin operations]
```

Primary files to know:

- `src/moodle/local_prequran/lib.php` handles Moodle dashboard redirection into the Quran Academy hub.
- `src/moodle/local_hubredirect/dashboard.php` builds the role-aware dashboard.
- `src/moodle/local_hubredirect/course_launch.php` sends users into the course app.
- `src/moodle/local_hubredirect/issue_child.php` securely routes managed lesson links.
- `src/app-shell/index.html` and `src/app-shell/js/app-shell.js` run the static learner launcher.
- `src/shared/js/runtime/` and `src/shared/js/shared-*.js` power unit activities.
- `src/moodle/local_prequran/externallib_v4.php` contains the Moodle web-service backend.

## Role Dashboard Flow

```mermaid
flowchart TD
    A[Moodle /my or direct hub URL] --> B[Dashboard redirect]
    B --> C[Resolve role]

    C -->|Student account or managed student| S[Student dashboard]
    C -->|Guardian consent or communication participant| P[Parent dashboard]
    C -->|Assigned teacher, live teacher, or marketplace teacher| T[Teacher dashboard]
    C -->|Site admin| AD[Admin dashboard]
    C -->|Referrer / principal| SP[Special dashboard options]

    S --> S1[Courses]
    S --> S2[Live sessions and schedule]
    S --> S3[Workspace profile / materials]
    S --> S4[Communications]
    S --> S5[Teacher feedback and recordings]

    P --> P1[Child selector]
    P --> P2[Child courses]
    P --> P3[Parent live hub]
    P --> P4[Communications]
    P --> P5[Recordings, summaries, trust receipts]

    T --> T1[Student selector]
    T --> T2[Teacher workspace]
    T --> T3[Live sessions / schedule]
    T --> T4[Parent follow-ups]
    T --> T5[Communications]
    T --> T6[Marketplace profile]

    AD --> A1[Student intake and grouping]
    AD --> A2[Live admin menu]
    AD --> A3[Teacher directory and capacity]
    AD --> A4[Parent links and consent]
    AD --> A5[Managed reports and QA analytics]
    AD --> A6[SQL / deployment support tools]
```

Tester focus:

- Confirm each account type lands on the expected dashboard.
- Confirm users cannot open dashboard links for roles or students they are not allowed to access.
- For parent and teacher accounts, test the child/student selector before opening courses, communications, live sessions, and reports.

## Course And Lesson Flow

```mermaid
flowchart TD
    A[Dashboard course card] --> B[course_launch.php]
    B --> C{Course key}
    C -->|pre_quraan| D[Static Pre-Quran app shell on Bunny CDN]
    C -->|Other academy track| E[Course placeholder or configured launch page]

    D --> F[App shell menu]
    F --> G[Alphabet]
    F --> H[Harakat / movements]
    F --> I[Connection forms]
    F --> J[Rules and Tajweed]
    F --> K[Pillars / Islamic studies]
    F --> L[Games and quizzes]

    G --> M[Unit index.html]
    H --> M
    I --> M
    J --> M
    K --> M

    M --> N[Unit config]
    N --> O[Shared runtime bootstrap]
    O --> P[Steps: Learn, Listen, Match, Speak, Write, Submit]
    P --> Q{Managed Moodle session?}
    Q -->|Yes| R[Web service saves progress / recordings]
    Q -->|No / preview| S[Local static behavior only]
    R --> T[Reports and teacher review]
```

Tester focus:

- Open the app shell from the dashboard and verify the correct environment: production, staging, or integration.
- Verify each unit loads its grid, media, messages, and step state without console errors.
- For managed students, refresh after completing steps and confirm progress persists.
- Test Speak and Submit recording flows with permission prompts, upload success, and report visibility.
- Test quiz analytics by completing an attempt and checking the matching report page.

## Communications Flow

```mermaid
flowchart TD
    A[Dashboard Communications link or app-shell pill] --> B[communications.php or shared communications panel]
    B --> C{Has web-service token / direct page context?}
    C -->|Panel token ready| D[Call Moodle REST web services]
    C -->|Standalone page / direct thread| E[Read communication tables directly]

    D --> F[List threads]
    E --> F
    F --> G{Thread type}
    G -->|Announcement| H[One-way class or student update]
    G -->|Parent-teacher| I[Private thread linked to one student]

    H --> J[Read messages]
    I --> J
    I --> K{Participant can reply?}
    K -->|Yes| L[Send reply]
    K -->|No| M[Read-only view]
    L --> N[Insert message, update last read, audit event]

    F --> O[Unread count / badge]
    J --> P[Mark read / update participant state]
```

Safety model to test:

- Announcements are readable by targeted users but not replyable.
- Parent-teacher messages are scoped to one student.
- Parents can read and reply only where they are explicit participants or linked guardians.
- Teachers can access only assigned/cohort students.
- Students should not see parent-teacher threads.
- Normal users cannot hard-delete messages.
- Audit rows are created for communication actions when tables are available.

Important files:

- `src/shared/js/shared-communications-panel.js`
- `src/moodle/local_hubredirect/communications.php`
- `src/moodle/local_prequran/services.php`
- `src/moodle/local_prequran/externallib_v4.php`
- `src/moodle/local_prequran/sql/create_comm_phase1.sql`

## Live Session Flow

```mermaid
flowchart TD
    A[Dashboard Live Sessions / Schedule] --> B[live_sessions.php and live_schedule.php]
    B --> C{User role}

    C -->|Admin| D[Create sessions, rooms, series, capacity, grouping]
    C -->|Teacher| E[Teacher workspace, schedule, start session]
    C -->|Parent| F[Parent live hub, schedule, summaries, recordings]
    C -->|Student| G[Join scheduled session, view feedback and recordings]

    D --> H[BBB room setup]
    E --> H
    G --> H
    H --> I[Attendance, notes, homework, quality data]
    I --> J[Parent summaries and follow-ups]
    I --> K[Recording review and approved playback]
    I --> L[Reports, QA analytics, leadership dashboards]
```

Tester focus:

- Verify join links appear only inside the allowed time window and for permitted participants.
- Confirm teacher, parent, student, and admin views expose different tools.
- Test post-class notes, homework, summaries, follow-ups, and recording approval from end to end.
- Verify parent-visible pages do not expose internal-only teacher/admin notes.

## Workspace Flow

```mermaid
flowchart TD
    A[Dashboard workspace link] --> B[Workspace dashboard]
    B --> C[People]
    B --> D[Materials]
    B --> E[Sessions]
    B --> F[Series]
    B --> G[Reports]
    B --> H[Student profile]
    B --> I[Parent workspace]

    C --> J[Owners, admins, teachers, assistant teachers, students]
    D --> K[Upload / assign materials]
    K --> L[Student marks in progress or completed]
    L --> M[Teacher notification / audit]
    H --> N[Assigned teachers, guardians, consent, attendance, notes, materials]
    G --> O[Workspace progress and activity reporting]
```

Tester focus:

- Verify workspace members cannot view another workspace without permission.
- Confirm materials assigned to a student appear on that student's workspace profile.
- Confirm completion updates notify the correct teachers and do not notify unrelated users.

## Admin And Data Flow

```mermaid
flowchart TD
    A[Admin dashboard] --> B[Intake]
    A --> C[Grouping]
    A --> D[Teacher directory and marketplace]
    A --> E[Parent links and consent]
    A --> F[Live operations]
    A --> G[Managed reports]
    A --> H[QA analytics]

    B --> I[Student profile, parent/guardian, enrollment approval]
    C --> J[Class group / cohort assignment]
    D --> K[Teacher profile, capacity, availability]
    E --> L[Consent, guardian relationship, parent trust pages]
    F --> M[Sessions, series, reminders, recordings, follow-ups]
    G --> N[Progress, focus, speak/submit, quiz, live summary]
    H --> O[Teacher quality review and coaching signals]
```

Tester focus:

- Use admin tests to create or verify the data needed for role-based testing.
- After creating links or consent, log in as the affected parent/student/teacher and verify the front-end changes.
- Treat admin pages as setup plus evidence: most user-facing bugs should be confirmed from the role account, not only from admin.

## Intern Test Route

Use this route for a first end-to-end smoke test:

1. Log in as admin and verify the dashboard opens.
2. Confirm a test student has a parent/guardian, teacher assignment, consent, and course access.
3. Log in as the student and open the Pre-Quran course.
4. Complete one small lesson step, refresh, and confirm progress remains.
5. Complete or simulate one quiz/recording event and verify the report path.
6. Log in as the parent and confirm the same child appears in the selector.
7. Open Communications and verify announcements/messages are scoped to that child.
8. Log in as the teacher and verify the student appears in the teacher dashboard, reports, live tools, and communications.
9. Open a live session/schedule page for each role and verify role-specific actions.
10. Return to admin reports and confirm the activity is visible where expected.

## Regression Checklist

- No page-level PHP errors or Moodle exceptions.
- No browser console errors on app shell, unit pages, communications panel, and live-session pages.
- User role redirects are stable after logout/login.
- Student and child IDs are preserved in course, communication, report, and live-session links.
- Direct URLs reject unauthorized users.
- Static CDN app shell opens the expected environment.
- Moodle REST calls include a valid token and return JSON, not login HTML.
- Communications badges, thread lists, thread details, and replies agree with backend data.
- Live-session pages respect consent, join timing, recording approval, and parent visibility.
- Reports match the activity completed by the test account.
