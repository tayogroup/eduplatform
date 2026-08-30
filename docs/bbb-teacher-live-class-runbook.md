# Teacher Live-Class Runbook (BigBlueButton)

How-to guidance for teachers running live classes in our BigBlueButton rooms.
The admin/launch side lives in `bbb-launch-execution-runbook.md`; this file is
for what a teacher does inside a running room.

## Putting your camera on every student's screen

**"Fullscreen webcam" only affects your own screen.** The option in your
webcam tile's dropdown menu is a browser fullscreen on your machine alone —
BBB has no way to push fullscreen to students, and browsers themselves forbid
it (fullscreen needs a local click on each device). Use the recipe below
instead; it is reflected on the students' side.

### Best: share your camera as the lesson content

Enabled for rooms created from 2026-08-30 (it used to be switched off in our
room settings — in an older room, use the recipe below instead).

1. **Turn your regular webcam OFF first** (the camera button in the bottom
   toolbar). A camera cannot be a webcam tile and presented content at the
   same time — if you skip this step the dialog says "This camera is already
   being shared" (its Stop sharing button does the same thing).
2. Click the **small arrow (caret) beside the toolbar camera button**, not
   the camera icon itself. (This option is NOT in the menu on your video
   tile.)
3. Choose the present-camera option — the dialog is titled **"Present
   Camera"** — pick your camera and start.

Your camera fills the main canvas (the presentation area) for you **and every
student**, exactly like a screen share — no layout fiddling. Stop the share
to bring the presentation back for everyone. A presented camera occupies the
presentation slot, so it cannot run at the same time as a screen share.

### Fallback: Pin + Grid layout, pushed to everyone

Verified in our rooms on 2026-08-30. Note the Layouts dialog has no "Focus on
video" — this server's video-focused layout is called **Grid layout**.

1. **Pin your webcam**: dropdown on your own video tile → **Pin**. A
   moderator's pin is room-wide — your camera stays visible and prioritised
   on every student's screen even as other webcams come and go.
2. Open the **Layouts** dialog (actions **(+)** button → layouts).
3. Choose **Grid layout** — the tile showing webcams filling the stage with
   the presentation shrunk into a corner.
4. Leave the **"Update to everyone"** toggle **ON** and click **Update**.

Every student's screen switches to webcams-as-main-stage, with your camera
filling it.

- **Grid gives every switched-on camera an equal tile**, so your face fills
  the whole stage only while student cameras are off (the normal setup in our
  classes). If several students have cameras on, you share the grid equally;
  the pin keeps you visible but not dominant.
- To go back to the slides: same dialog → **Smart layout** (or **Focus on
  presentation**) → "Update to everyone" ON → **Update**.

## Sharing your screen without it freezing

Seen live 2026-08-30: a teacher shared the lesson tab, switched back to the
class, and every student watched a frozen page saying "This video is playing
in Picture-in-Picture mode."

The mechanics: a **tab** share captures only that tab's own pixels. When you
switch away from a tab with a playing video, the browser pops the video out
into a floating Picture-in-Picture window — which is a separate window
OUTSIDE the tab — so the shared tab freezes on a placeholder. A minimized
**window** share freezes the same way (Windows stops painting minimized
windows).

- **Quick fix mid-class**: close the floating video (its ✕) or click back
  into the lesson tab — the video returns into the page and the share
  resumes for students.
- **Sturdy setup 1 — share your entire screen**: everything visible is
  captured, Picture-in-Picture included.
- **Sturdy setup 2 — two windows side by side**: the class in one window,
  the lesson in the other; share the lesson WINDOW and keep it visible —
  never minimize it while sharing.
- **Sharing a tab that plays video? Tick "Also share tab audio"** in the
  share picker, or students see the video and hear nothing.

Students join content-first by design (since 2026-08-30): their sidebar
starts collapsed, so slides and your shared screen use the full width of
their window. A student can still open chat and the users list with the
toggle at the top left.

**The last step is the student's own click, and it cannot be automated** —
browsers only grant fullscreen from a click on the page, so no setting can
do it for them. Teach it as a class ritual (verified in class 2026-08-30):

> "When I share my screen, press the **expand arrows (⛶) at the top-right
> corner of the shared screen**."

One instruction, once — fullscreen swallows the dark bands around the
share and fills the student's whole display. Esc brings them back.

## Showing a website to the class

Sharing a website link as content embeds that site in a frame inside the
class — and **websites choose whether they allow that**. Most big sites
(news, Google, social media) refuse, and every student then sees a browser
error naming the site ("will not allow Firefox to display the page if
another site has embedded it" — seen live with CNN, 2026-08-30). That is
the site's own security policy, enforced by the student's browser; no
setting on our side or BBB's can override it.

- **Embedding works for**: purpose-built educational embeds, our own
  lesson pages, and YouTube — use the dedicated **Share an external
  video** feature for video sites.
- **For everything else, screen share the site**: open it in its own
  window and share that window (see "Sharing your screen" above — keep
  the window visible). Screen share captures pixels, so no site can
  refuse it, and the students' content-first layout and the ⛶ click work
  the same as any share.

## Student webcams are off by policy

Rooms are created with student webcam sharing locked (owner decision,
2026-08-30 — `lockSettingsDisableCam` in
`local_prequran_bbb_meeting_defaults`). Students see no working camera
button; the teacher joins as moderator and is unaffected. This also means
Grid layout above is always the teacher's face alone.

- **To let ONE student share** (a show-and-tell, a reading check): click that
  student's name in the participants list → **Unlock user**. Lock them again
  the same way afterwards.
- **In a room created before this shipped**, lock it by hand: gear icon above
  the participants list → **Lock viewers** → turn **Share webcam** to locked
  → **Apply**. Lock settings are baked in at room creation, so an
  already-running room keeps whatever it started with until it ends.
