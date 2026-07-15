# Multi-Consumer Platform Implementation Plan

Purpose: make `quraantest.academy`, `EduForTomorrow.com`, independent teacher workspaces, and institution workspaces independent consumers of the same Moodle, web services, plugin codebase, and database, without exposing the wrong brand/domain or leaking cross-consumer data.

## Target Model

- One Moodle installation and one custom codebase.
- One shared database with explicit consumer, brand, workspace, and domain scoping.
- `quraantest.academy` remains the Quran Academy consumer.
- `EduForTomorrow.com` becomes the independent teacher/tutor marketplace and services consumer.
- Institutions can become consumers with their own workspace, users, branding, and optional custom domain.
- Solo independent teachers can operate as workspace consumers under EduForTomorrow or later under their own custom domain.
- Public pages, intake, marketplace, dashboards, emails, and web-service links resolve the active consumer and workspace from the current domain.
- Workspaces remain the operational boundary for students, parents, teachers, sessions, materials, and reports.

## Implementation Status

- Started: Phase 1 foundation.
- Added consumer/domain schema plan to Moodle upgrade lifecycle.
- Added seeded consumers for Quran Academy and EduForTomorrow.
- Added seeded domains for `quraantest.academy`, `quraan.academy`, `edufortomorrow.com`, `www.edufortomorrow.com`, and `app.edufortomorrow.com`.
- Added runtime helpers to resolve current consumer/domain/workspace context.
- Not started yet: public page routing, intake scoping, marketplace consumer filters, login continuity, and web-service enforcement.

## Consumer Model

Use three related boundaries:

- Platform: the shared Moodle install, database, codebase, web services, scheduled tasks, and deployment pipeline.
- Consumer/brand: controls public identity, domain defaults, site name, logo, copy, marketplace positioning, default links, and email branding.
- Workspace/institution: controls operational access to students, parents, teachers, courses, live sessions, materials, reports, and daily teaching workflows.

Consumer types:

- `platform_brand`: Quran Academy or EduForTomorrow.
- `institution`: a school, academy, masjid, tutoring center, or partner organization with multiple teachers/admins.
- `solo_teacher`: one independent teacher operating a private teaching workspace.
- `marketplace`: a public listing/discovery surface, usually EduForTomorrow.

Domain types:

- `public`: marketing/landing pages.
- `app`: login, dashboards, authenticated tools.
- `marketplace`: public teacher discovery and parent acquisition.
- `institution_portal`: institution-branded landing, intake, login, dashboard, and parent/student links.
- `api`: web-service endpoint where custom domain support is allowed.

## Recommended Data Boundaries

Recommended relationship:

- A consumer/brand can own many workspaces.
- A workspace belongs to one primary consumer/brand.
- An institution consumer usually has one primary institution workspace, but can add child workspaces later.
- A solo teacher consumer usually has one `solo_teacher` workspace.
- A domain maps to one consumer and optionally one default workspace.
- A teacher profile may be visible in one marketplace, multiple marketplaces, one institution portal, or private only.
- A parent/student intake request belongs to the consumer/domain/workspace where it was submitted.
- Platform admins can see all consumers; consumer admins see their consumer; workspace admins see only assigned workspaces.
- An organization group can link related consumers/workspaces without collapsing their operational boundaries.
- Use `owned_group` for wholly owned school branches and `franchise_network` for independently run franchise schools.
- Owned-branch access may inherit operations/audit permissions when explicitly configured.
- Franchise-member access defaults to governance visibility; chats, student records, finance, reports, and support require explicit sensitive-access flags.

Practical examples:

- `quraantest.academy` resolves to the Quran Academy consumer and default Quran Academy workspace.
- `EduForTomorrow.com` resolves to the EduForTomorrow consumer and public marketplace context.
- `portal.exampleacademy.com` resolves to the Example Academy institution consumer and its institution workspace.
- `teachername.edufortomorrow.com` could later resolve to a solo teacher workspace if subdomain support is added.

## Phase 0: Discovery And Guardrails

Goal: confirm the current tables, routes, and permission helpers that must become consumer/domain/workspace-aware.

Tasks:

- Inventory public routes:
  - `/local/ehelhome/index.php`
  - `/local/hubredirect/public_intake.php`
  - `/local/hubredirect/teacher_marketplace.php`
  - `/local/hubredirect/teacher_marketplace_profile.php`
- Inventory authenticated routes:
  - dashboard, live sessions, communications, reports, workspaces, student intake, teacher intake, marketplace admin.
- Inventory tables that already use `workspaceid`.
- Inventory tables that do not yet have consumer/workspace scoping but expose sensitive data.
- Inventory domain-sensitive output:
  - generated links
  - email templates
  - notification links
  - web-service endpoints
  - Bunny/static app launch URLs
- Define a migration rule: existing rows default to Quran Academy unless explicitly reassigned.

Exit criteria:

- A table-by-table scoping checklist exists.
- Every public and authenticated route is classified as global, consumer-scoped, workspace-scoped, domain-scoped, or user-scoped.

## Phase 1: Consumer Registry, Brand Settings, And Domain Resolution

Goal: introduce a small, reliable consumer/domain layer before touching large workflows.

Database:

- Add `local_prequran_consumer`:
  - `id`
  - `slug`
  - `name`
  - `type`
  - `status`
  - `primaryworkspaceid`
  - `owneruserid`
  - `supportemail`
  - `timecreated`
  - `timemodified`
- Add `local_prequran_consumer_domain`:
  - `id`
  - `consumerid`
  - `workspaceid`
  - `domain`
  - `domaintype`
  - `isprimary`
  - `sslstatus`
  - `verificationstatus`
  - `verifiedat`
  - `status`
  - `timecreated`
  - `timemodified`
- Add or extend brand settings:
  - `consumerid`
  - `supportemail`
  - `logourl`
  - `themejson`
  - `copyjson`
  - `defaultpublicpath`
  - `defaultdashboardpath`
  - `emailfromname`
  - `emailreplyto`
- Seed:
  - `quraan_academy`
  - `edu_for_tomorrow`

Code:

- Add consumer/domain helpers in `local_hubredirect/accesslib.php` or a dedicated shared include:
  - resolve current consumer from `HTTP_HOST`.
  - resolve default workspace from domain when present.
  - return fallback consumer for CLI/admin contexts.
  - build domain-aware Moodle URLs.
  - expose `consumerid`, `consumerslug`, `consumername`, `workspaceid`, `domaintype`, and public/app domains.
- Add a strict domain allow-list so arbitrary host headers cannot become trusted consumer context.
- Add a domain verification process for institution custom domains:
  - DNS TXT token or CNAME verification.
  - admin approval before activation.
  - SSL readiness status before public use.

Exit criteria:

- Visiting supported domains resolves a deterministic consumer and optional workspace.
- Unknown domains fall back safely or return a controlled error.
- No user-facing route relies on hard-coded quraantest branding when a consumer/domain helper can provide it.

## Phase 2: Public Front Doors

Goal: launch consumer-aware public pages while keeping high-risk authenticated flows unchanged.

Tasks:

- Create EduForTomorrow public landing content:
  - home
  - for teachers
  - for parents
  - marketplace
  - services/features
  - pricing or onboarding
  - contact
- Preserve or adapt Quran Academy public landing content under the Quran Academy consumer.
- Add a reusable public-page shell that can render consumer/institution settings:
  - logo
  - name
  - colors
  - hero copy
  - intake CTAs
  - login CTAs
  - marketplace CTAs where enabled
- Route CTAs to consumer-aware public forms:
  - teacher application/profile intake
  - student/parent intake
  - teacher marketplace browse
  - login/dashboard
- Keep copy broad: independent tutors, teachers, small academies, live classes, student management, course/session tools, parent marketplace.
- For institution domains, support a simpler institution portal:
  - institution landing
  - student enrollment/intake
  - parent login
  - teacher login
  - course/live-session information

Exit criteria:

- Users entering from EduForTomorrow see EduForTomorrow public branding.
- Users entering from Quran Academy still see Quran Academy public branding.
- Users entering from an institution custom domain see institution branding after the domain is verified and active.
- No EduForTomorrow CTA visibly sends users to a quraantest URL unless intentionally accepted as a temporary launch compromise.
- No institution-domain CTA visibly sends users to another consumer domain unless intentionally configured.

## Phase 3: Public Intake Scoping

Goal: make parent/student, teacher, and institution intake safe for all consumers.

Parent/student intake:

- Add `consumerid`, `workspaceid`, and source domain fields to public intake request tables.
- Store source domain, source path, campaign/referrer fields, current consumer, and default workspace.
- Admin intake review filters by consumer and workspace.
- Student records created from intake inherit consumer/workspace defaults.

Teacher intake:

- Do not expose the existing admin-only `teacher_intake.php` as a public teacher form.
- Add a public teacher application/profile request flow that stores pending teacher applications under the current consumer and optional workspace.
- Admin review converts approved teacher applications into Moodle accounts, teacher profiles, availability, and marketplace visibility.

Institution intake:

- Add an institution inquiry/onboarding flow:
  - institution name
  - owner/admin contact
  - desired custom domain
  - number of teachers/students
  - courses/services needed
  - requested branding
- Approved institution onboarding creates:
  - consumer record
  - primary institution workspace
  - owner/admin membership
  - pending domain mapping if a custom domain is requested

Exit criteria:

- EduForTomorrow teacher applicants do not require admin access.
- EduForTomorrow parent/student inquiries land in an EduForTomorrow queue.
- Institution inquiries can create a pending consumer/workspace without touching Quran Academy data.
- Existing Quran Academy intake still works with its current behavior.

## Phase 4: Marketplace Consumer Scoping

Goal: let parents browse teacher profiles under the active consumer/domain without mixing marketplaces accidentally.

Database:

- Add a consumer visibility join table, for example `local_prequran_teacher_consumer`:
  - `id`
  - `teacherid`
  - `consumerid`
  - `workspaceid`
  - `marketplace_visible`
  - `marketplace_status`
  - `featured`
  - `sortorder`
  - `timecreated`
  - `timemodified`
- Keep teacher profile content in the teacher profile table unless brand-specific bios/pricing are required.

Code:

- Update marketplace listing queries to require current consumer visibility.
- Update profile page to load only profiles visible under current consumer or institution workspace.
- Require login or intake before parent messaging/selection.
- Store marketplace requests with consumer/workspace/domain context.
- For institution portals, decide whether the marketplace is:
  - disabled,
  - limited to institution teachers,
  - or allowed to show external EduForTomorrow marketplace teachers.

Exit criteria:

- EduForTomorrow marketplace shows only EduForTomorrow-approved teachers.
- Quran Academy marketplace shows only Quran Academy-approved teachers.
- Institution portals show only institution-approved teachers unless external marketplace sharing is enabled.
- A teacher can intentionally appear in both marketplaces.
- Direct URL attempts cannot open a teacher profile not visible in the current consumer/workspace.

## Phase 5: Auth, Login, Dashboard, And Custom-Domain Continuity

Goal: preserve consumer/domain/workspace continuity once users log in.

Tasks:

- Capture intended consumer, workspace, and domain before login.
- After login, route users back to the correct consumer/workspace dashboard when allowed.
- Make dashboard header, labels, public links, support links, and marketplace links consumer-aware.
- If a user belongs to multiple consumers/workspaces, provide a clear selector or default to the domain they entered through.
- Prevent a user from using an EduForTomorrow domain to access a Quran-only workspace unless they have explicit access and the UI makes that context clear.
- Prevent a user from using an institution domain to access another institution's workspace.
- Support institution custom domains for app/dashboard links only after domain verification and SSL readiness.

Exit criteria:

- Login from EduForTomorrow returns to EduForTomorrow branded dashboard.
- Login from quraantest returns to Quran Academy branded dashboard.
- Login from an institution custom domain returns to the institution-branded workspace dashboard.
- Teacher, parent, student, and admin dashboards still route correctly.

## Phase 6: Web Service Consumer Enforcement

Goal: enforce consumer/workspace permissions in the backend, not only in UI filters.

Tasks:

- Add consumer/workspace context resolution to Moodle REST entry points where relevant.
- Audit web-service methods for:
  - progress saves
  - recordings
  - quiz reports
  - communications
  - live sessions
  - reports
  - marketplace requests
- Reject requests where user, student, session, workspace, consumer, domain, or teacher profile does not belong to an allowed consumer/workspace.
- Keep platform admin bypass explicit and auditable.

Exit criteria:

- UI filtering is not the only protection.
- Direct REST calls cannot read or write cross-consumer or cross-workspace data.
- Regression SQL or browser tests exist for at least the highest-risk endpoints.

## Phase 7: Communications, Live Sessions, Reports, And Emails

Goal: finish the sensitive operational surfaces.

Tasks:

- Communications:
  - consumer/workspace-scope thread creation and listing.
  - prevent cross-consumer parent-teacher messages.
- Live sessions:
  - ensure sessions inherit workspace and consumer.
  - filter teacher/student/parent schedules by membership.
- Reports:
  - add consumer/workspace filters to admin, teacher, parent, and student reports.
  - global platform admin reports must clearly label consumer/workspace.
- Course transcripts:
  - implement the transcript resolver, official snapshot, export, hold, verification, and reissue requirements in `docs/course-transcript-requirements.md`.
  - follow the phased build plan in `docs/course-transcript-implementation-plan.md`.
  - keep EduForTomorrow, Quran Academy, and institution transcript branding and verification URLs domain-aware.
- Emails and notifications:
  - use consumer sender name, support address, logo, and domain links.
  - never send quraantest links from EduForTomorrow flows unless explicitly configured.
  - never send another institution's domain from institution flows.

Exit criteria:

- Parent, student, and teacher communications stay inside the correct operational boundary.
- Live-session schedules and reports do not mix consumers or workspaces.
- Transcript previews, official exports, and verification pages do not mix consumers or workspaces.
- Email links preserve the source consumer/domain.

## Phase 8: Institution Admin, Domain Admin, And Platform Controls

Goal: make operations usable without losing platform-level control.

Tasks:

- Add consumer/workspace filters to admin queues:
  - intake requests
  - teacher applications
  - teacher marketplace admin
  - student intake
  - teacher intake
  - live admin
  - reports
- Add institution admin pages:
  - institution settings
  - institution branding
  - institution domain status
  - workspace members
  - teachers
  - students
  - courses/services
  - plan/capacity limits
- Add custom-domain admin controls:
  - request domain
  - show DNS verification token
  - mark verified
  - show SSL status
  - activate/deactivate domain
- Add role distinctions:
  - platform admin: all consumers.
  - consumer admin: assigned consumer.
  - workspace admin/owner: assigned workspaces.
- Add clear labels when viewing global data.

Exit criteria:

- Admins can intentionally switch scope.
- Consumer/workspace admins cannot manage unrelated records.
- Institution owners can manage their own workspace and branding without platform admin access.
- Custom domains cannot be activated until verified.
- Existing academy operations flows remain available to platform admins.

## Phase 9: Institution Custom-Domain Pilot

Goal: prove the custom-domain workflow with a limited institution before broad rollout.

Tasks:

- Select one pilot institution workspace.
- Configure a non-critical custom domain, preferably a subdomain such as `portal.exampleacademy.com`.
- Verify DNS ownership.
- Confirm SSL readiness.
- Test public landing, intake, login, dashboard, live sessions, communications, reports, and email links under the custom domain.
- Confirm fallback behavior if the custom domain is disabled.

Exit criteria:

- Pilot institution users never see quraantest or EduForTomorrow branding unless intentionally linked.
- Platform admins can still access and support the institution from the global admin context.
- Custom-domain disablement cleanly returns users to the configured fallback domain.

## Testing Strategy

Minimum smoke matrix:

| Role | Quran Academy | EduForTomorrow | Institution Custom Domain |
|---|---|---|---|
| Anonymous visitor | Public landing, intake, marketplace browse | Public landing, intake, marketplace browse | Institution landing and intake |
| Parent | Intake, marketplace request, dashboard, child schedule, communications | Intake, marketplace request, dashboard, child schedule, communications | Institution dashboard, child schedule, communications |
| Teacher | Dashboard, profile, students, courses, live sessions | Dashboard, profile, students, courses, live sessions | Institution teacher dashboard, students, courses, live sessions |
| Student | Dashboard, lessons, live schedule, reports | Dashboard, lessons, live schedule, reports | Institution lessons, live schedule, reports |
| Consumer admin | Scoped intake, marketplace, reports | Scoped intake, marketplace, reports | Institution settings, users, reports |
| Platform admin | Global views with consumer/workspace labels | Global views with consumer/workspace labels | Global support with consumer/workspace labels |

Required negative tests:

- EduForTomorrow parent cannot see Quran Academy-only teacher profile.
- Quran Academy parent cannot see EduForTomorrow-only teacher profile.
- Institution parent cannot see another institution's teacher, student, live session, message, or report.
- Institution admin cannot manage another institution's workspace.
- Teacher assigned to one workspace cannot access another workspace's students.
- Web-service calls using guessed IDs fail across consumer/workspace boundaries.
- Email links generated from EduForTomorrow do not point to quraantest.
- Email links generated from an institution do not point to quraantest, EduForTomorrow, or another institution unless intentionally configured.
- Unknown or unverified custom domains cannot resolve a trusted workspace context.

## Rollout Plan

Recommended rollout:

1. Build consumer registry, domain mapping, and domain resolution behind a config flag.
2. Launch EduForTomorrow public pages with forms storing brand context.
3. Convert marketplace listing/profile to consumer-aware read paths.
4. Add login/dashboard consumer and workspace continuity.
5. Harden web services and sensitive operational pages.
6. Enable EduForTomorrow for limited pilot teachers and parents.
7. Enable one institution workspace under the platform fallback domain.
8. Pilot one institution custom domain.
9. Expand to full marketplace and institution onboarding once negative tests pass.

Rollback strategy:

- Keep default consumer as Quran Academy.
- Keep consumer/domain-specific logic behind config flags while migrating.
- Existing records should continue to resolve to Quran Academy.
- If EduForTomorrow pilot fails, disable EduForTomorrow domain routing without changing core quraantest workflows.
- If an institution custom-domain pilot fails, disable only that domain mapping and keep the workspace available through the fallback app domain.

## Effort And Risk

Effort:

- Minimal public front door: low-medium.
- Consumer-aware public intake and marketplace: medium-high.
- Institution workspace consumer support without custom domains: medium-high.
- Institution custom-domain support: high.
- Full shared platform with dashboards, web services, communications, live sessions, reports, emails, institutions, and custom domains: high.

Highest risks:

- Cross-consumer and cross-workspace data leakage.
- Moodle multi-domain login and `wwwroot` behavior.
- Email links using the wrong domain.
- Admin screens showing mixed data without labels.
- Web-service endpoints trusting UI filters instead of enforcing permissions.
- Custom-domain SSL/DNS lifecycle complexity.
- Cookie/session behavior across many domains.

Risk reduction:

- Add consumer/workspace permission helpers first.
- Migrate one workflow at a time.
- Add negative tests for every workflow before opening it publicly.
- Keep old quraantest behavior as the default fallback until EduForTomorrow paths are proven.
- Pilot custom domains with one institution before making self-service domain onboarding available.
