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
