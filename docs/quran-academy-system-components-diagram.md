# Quran Academy System Components Diagram

Purpose: show the major system components and how they are linked for testing, onboarding, and release planning.

```mermaid
flowchart LR
    subgraph U[Users]
        Student[Student]
        Parent[Parent / Guardian]
        Teacher[Teacher / Tutor]
        Admin[Admin / Operations]
    end

    subgraph Moodle[Moodle Platform]
        Auth[Moodle login / session]
        Core[Moodle core: users, roles, cohorts, courses]
        Home[local_ehelhome public pages]
        Hub[local_hubredirect dashboard and pages]
        Plugin[local_prequran plugin]
        WS[Moodle REST web services]
        DB[(Moodle database)]
        Tasks[Scheduled tasks]
        Notify[Moodle notifications]
    end

    subgraph StaticApp[Static Pre-Quran Learner App]
        Shell[App shell]
        Units[Unit pages]
        Runtime[Shared lesson runtime]
        CommPanel[Communications panel]
        Games[Games and quiz/chatbot pages]
    end

    subgraph DataAreas[Feature Data]
        Progress[(Progress / focus / recordings)]
        Quiz[(Quiz attempts and questions)]
        Comm[(Communication threads and audit)]
        Live[(Live sessions, attendance, notes)]
        Workspace[(Workspaces, members, materials)]
        Reports[Reports and QA analytics]
    end

    subgraph Storage[Media And Storage]
        BunnyCDN[Bunny CDN static assets]
        BunnyStorage[Bunny Storage private uploads]
        Media[Lesson audio, video, captions, images]
    end

    subgraph External[External Services]
        BBB[BigBlueButton rooms]
        WhatsApp[WhatsApp Cloud API]
        ElevenLabs[ElevenLabs TTS]
        BrowserAPIs[Browser microphone and media APIs]
    end

    subgraph Tooling[Build, QA, Deployment]
        Build[Build scripts]
        Verify[Verification scripts]
        Deploy[Deploy scripts]
        Docs[Docs and training assets]
    end

    Student --> Auth
    Parent --> Auth
    Teacher --> Auth
    Admin --> Auth
    Home --> Auth

    Auth --> Core
    Core --> Hub
    Hub --> Shell
    Hub --> WS
    Hub --> Plugin

    Plugin --> WS
    WS --> DB
    Plugin --> DB
    Tasks --> DB
    Tasks --> Notify
    Notify --> Parent
    Notify --> Teacher
    Notify --> Admin

    Shell --> Units
    Shell --> CommPanel
    Shell --> Games
    Units --> Runtime
    Runtime --> BrowserAPIs
    Runtime --> WS
    Games --> WS
    CommPanel --> WS

    BunnyCDN --> Shell
    BunnyCDN --> Units
    BunnyCDN --> Games
    BunnyCDN --> Media
    Runtime --> Media
    Runtime --> BunnyStorage

    WS --> Progress
    WS --> Quiz
    WS --> Comm
    WS --> Live
    WS --> Workspace
    Progress --> Reports
    Quiz --> Reports
    Live --> Reports
    Workspace --> Reports

    Hub --> Reports
    Hub --> Live
    Hub --> Workspace
    Hub --> Comm

    Live --> BBB
    Live --> BunnyStorage
    Live --> Notify
    Comm --> Notify
    Comm --> WhatsApp
    Games --> ElevenLabs

    Build --> BunnyCDN
    Deploy --> BunnyCDN
    Deploy --> BunnyStorage
    Verify --> StaticApp
    Verify --> Moodle
    Docs --> Tooling
```

## Component Notes

- Users enter through Moodle login, public pages, or direct dashboard links.
- `local_hubredirect` is the main role-aware hub for dashboard pages, live tools, workspaces, communications, reports, and course launch.
- `local_prequran` owns most backend data, web services, scheduled tasks, notifications, and permission checks.
- The static learner app runs from Bunny CDN and calls Moodle REST services when launched with a managed student context.
- Unit pages share runtime modules for step state, playback, progress, speak/write/submit flows, media, and reporting.
- Communications connect the static app panel, standalone Moodle page, web services, communication tables, audit logs, Moodle notifications, and optional parent alerts.
- Live sessions connect dashboard pages, Moodle data, BigBlueButton rooms, attendance, notes, recordings, parent summaries, reports, and reminders.
- Workspace tools manage people, materials, sessions, series, reports, and student/parent views.
- Build and deploy scripts generate and publish static assets, then verification scripts smoke-test the resulting output.

## Testing Boundaries

- Frontend boundary: app shell, unit pages, communications panel, games, quiz, and media playback.
- Backend service boundary: Moodle REST calls for progress, recordings, quiz, communications, live sessions, and reports.
- Permission boundary: role redirects, student/child scoping, workspace membership, teacher assignment, guardian links, and direct URL denial.
- External-service boundary: Bunny CDN/storage, BigBlueButton, Moodle notifications, WhatsApp alerts, ElevenLabs, and browser microphone permissions.
