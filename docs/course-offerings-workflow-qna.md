# Course Offerings Workflow Q&A

## What is a course offering?

A course offering is the institution-facing seat record for a course. It belongs to one workspace, points to one Moodle course, and stores the dates, capacity, syllabus, prerequisites, visibility, and publishing status that parents and students need before requesting enrollment.

## Do courses need to be created in Moodle first?

No, not always. The admin can either link an existing Moodle course or choose Create new Moodle course while saving the course offering.

When Create new Moodle course is used, the system creates or reuses the institution Moodle category, creates the Moodle course inside it, enables manual enrollment, and saves the new Moodle course ID on the offering. Approval can also add the student's course key to the local student profile, so the course appears even if Moodle manual enrollment needs follow-up.

## Will students and teachers see only their institution courses?

Yes. Course offerings are scoped by workspace. Parents and students browse published offerings for their current workspace only. Admins manage offerings for their workspace only. Teachers and managers can see workspace students through the same workspace membership checks.

## Where do students and parents see available courses and seats?

They use `local/hubredirect/course_catalog_browse.php`, linked from the dashboard as Course Catalog. Each offering shows the title, course track, open seats, start date, end date, syllabus, prerequisites, and a request form for eligible linked students.

Only students and parents can submit or cancel enrollment requests from the catalog. Staff can browse offerings for context, and workspace admins approve requests from the Course Offerings management page.

The public intake page uses published offerings with `Institution portal` visibility for the current workspace. Draft, closed, archived, full, ended, or workspace-only offerings do not appear on that institution's public form. Institution-scoped public forms do not fall back to the global static course list.

## How does the student know seats are available?

Open seats are calculated from offering capacity minus approved/enrolled requests. Pending requests do not consume a seat until an admin approves them. Unlimited capacity is shown when capacity is set to zero. The catalog also labels each offering as Available, Upcoming, Full, or Enrollment closed.

Future-start offerings can still accept enrollment requests. Offerings whose end date has passed are visible for context but cannot accept new requests.

## How are enrollments approved?

Workspace admins open `local/hubredirect/course_offerings.php`, review pending requests, and approve or reject each request. Approval checks that the offering is still published, has not passed its end date, and still has a seat available. If approved, the system updates the student's course access and attempts Moodle manual enrollment into the linked Moodle course.

If a request is still pending after an offering ends, admins should reject it with an alternative note or extend the offering end date before approving.

## What if Moodle auto-enrollment fails?

The request remains approved, the student course key is still appended to the local student profile, and the admin sees a message to check the linked Moodle course manual enrollment setup. Once the Moodle course has an enabled manual enrollment instance, future approvals can enroll automatically.

Admins can also retry Moodle sync from the Enrollment Requests table. This keeps the original approval intact and updates the request to Enrolled once Moodle enrollment succeeds.

## Can a parent cancel a request?

Yes, pending requests can be cancelled from the Course Catalog status table. Approved, enrolled, rejected, and cancelled requests are retained for audit/history.

## Can admins close a course without removing current students?

Yes. Set the offering status to Closed to stop normal publishing/new approvals while preserving existing approved/enrolled access. Archived offerings are not treated as active course access by the course catalog resolver.

## How does this feed the course transcript?

Course offerings and enrollment requests are the first transcript source of record for course identity, workspace scope, request status, approval, Moodle sync, drops, and course dates. The full transcript requirements are defined in `docs/course-transcript-requirements.md`.

## How should tuition payment affect enrollment?

Tuition and invoice status should be visible during enrollment approval, but automatic payment blocks should be controlled by workspace policy. The recommended first approach is to let admins approve enrollment manually while seeing whether an invoice is draft, sent, paid, partially paid, overdue, scholarship-covered, or sponsor-covered. Later phases can require deposit, first installment, or full payment before approval or Moodle enrollment. The full student finance requirements are defined in `docs/student-tuition-payments-invoicing-requirements.md`.

## What should testers verify?

1. A workspace admin can create and publish an offering linked to a Moodle course.
2. A workspace admin can create an offering using Create new Moodle course.
3. The auto-created Moodle course appears in the institution Moodle category and has manual enrollment enabled.
4. A parent or student in that workspace sees only that workspace's published offerings.
5. Seat counts decrease only after approval/enrollment, not after pending requests.
6. Duplicate active requests for the same student/offering are blocked.
7. Approved/enrolled requests appear in the Course Catalog status table with an Open course action.
8. The student's dashboard My courses includes courses granted through approved/enrolled offerings.
