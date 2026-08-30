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

Verified in our rooms on 2026-08-30. Two options this section used to
recommend do NOT exist here, so do not go looking for them: there is no
"Share camera as content" on the toolbar camera button, and the Layouts
dialog has no "Focus on video" — this server's video-focused layout is
called **Grid layout**.

### The recipe: Pin + Grid layout, pushed to everyone

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
