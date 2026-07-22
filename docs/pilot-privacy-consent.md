# Ehel Academy Pilot — Privacy Notice, Terms & Consent (P0.6 draft)

**2026-07-22 · DRAFT for review — not yet legal-approved.** Parent/guardian-facing
document for the 1 Aug pilot. The pilot's data footprint is deliberately tiny
(no accounts, no server-side learner data), which keeps this simple — but a
human (ideally counsel) must review before it is shown to families, since the
learners are minors.

> Reviewer note — what the pilot technically does:
> • No account, login, registration, or collection of names/emails/ages.
> • All learning progress is stored in the browser's localStorage on the
>   learner's own device. Nothing identifies the learner to us.
> • Content (lessons, audio, images) is served from a CDN (bunny.net); like any
>   web server it processes IP addresses in transit and standard access logs.
> • The "Listen" narration is served entirely from pre-generated audio files
>   (~8,600 clips). The app's runtime text-to-speech fallback endpoint does not
>   exist on the pilot deployment (verified: 404) — so no lesson text is sent
>   to any voice provider while a learner uses the pilot.
> • The English speaking exercise records audio on the device only; its
>   speech-scoring endpoint also does not exist on the pilot deployment
>   (verified: 404), so no voice recording ever leaves the device. The exercise
>   simply won't return a score in the pilot.
> • No advertising, no analytics trackers, no cookies beyond localStorage.

---

## Privacy Notice (plain language, parent-facing)

**Who we are.** Ehel Academy ("we") provides online learning materials for
Primary and Lower Secondary learners. Contact: [contact email/WhatsApp].

**What information we collect about your child: almost none.**
- The pilot needs **no account and no login**. We do not ask for, or store, your
  child's name, email, age, photo, or any contact detail.
- Your child's learning progress (completed sections, quiz scores, saved
  writing drafts) is stored **only on your own device**, in the browser. It
  never leaves the device and we cannot see it.
- When the site loads, our content delivery provider (bunny.net) processes your
  device's IP address to deliver the pages — the same way any website loads.
  Standard, short-lived technical logs may exist; we do not use them to
  identify learners.
- Lesson narration is played from pre-recorded audio files. Nothing your child
  types, says, or records is sent anywhere — it stays on your device.

**What we never do:** no ads, no selling or sharing of data, no tracking across
other websites, no profiles about your child.

**Deleting data.** Because progress lives in your browser, you delete it
yourself at any time by clearing the browser's site data for our site. Nothing
remains with us.

**Changes after the pilot.** If we later add accounts (so progress can follow
your child across devices), we will ask for your consent again and update this
notice first.

## Terms of Use (pilot, short form)

1. The pilot is provided free, for personal educational use by your family.
2. Content is provided "as is" during the pilot; we are actively improving it
   and welcome reports of errors.
3. Science activities include hands-on home experiments. **An adult should
   review each experiment and supervise where the activity indicates.** You are
   responsible for your child's safety during offline activities.
4. All content (lessons, audio, images) belongs to Ehel Academy or its
   licensors; please don't redistribute it.
5. Ehel Academy is an independent programme aligned to Cambridge International
   curriculum frameworks; it is not affiliated with, endorsed by, or certified
   by Cambridge University Press & Assessment.
6. We may suspend or end the pilot at any time.

## Parent/Guardian Consent (collect one per learner)

> I am the parent/legal guardian of the learner below. I have read the Privacy
> Notice and Terms of Use for the Ehel Academy pilot. I understand that:
> - the pilot stores my child's progress only on our own device;
> - hands-on science activities are done offline and I am responsible for
>   supervision where indicated;
> - I consent to my child using the Ehel Academy pilot materials.
>
> Learner's grade: ______  ·  Parent/guardian name: ______________________
> Signature: ______________________  ·  Date: ____________
> Preferred contact (for pilot support only): ______________________

*Collection tip: for a remote cohort, reproduce this consent as a short form
(e.g. Google Form/WhatsApp message reply "I consent") — keep the records
together in one place for the pilot file.*

---

**Sign-off (internal):** ☐ Reviewed (counsel if required); published to
families with the welcome message. — Name / date: ______________
