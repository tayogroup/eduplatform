# Alphabet Lecture Recording Plan

Use this after the ElevenLabs audio is ready. The goal is a simple screen-recorded lecture that shows students exactly how to use the Alphabet unit.

## Source Files

- Step script source: `docs/lecture-scripts/alphabet_lecture_steps.json`
- Generated narration script: `docs/lecture-scripts/alphabet_lecture_script.txt`
- Current lecture video to replace or model: `src/media/messages/lectures/alphabet_lecture.mp4`
- Final target path: `src/media/messages/lectures/alphabet_lecture.mp4`
- Test URL: `http://127.0.0.1:4173/pre_quraan_integration/units/alphabet/index.html?managed=1&v=alphabet-lecture-refresh`

## Recording Style

- Record at desktop width first, with the unit centered and readable.
- Move slowly between steps so children can follow.
- Keep the cursor visible.
- Click only the controls being discussed.
- Avoid browser bookmarks, unrelated tabs, and desktop distractions in the final recording.
- Edit the step script source first, then rebuild the generated narration script and audio clips.
- Use the generated narration audio as the timing guide.

## Screen Recording Storyboard

| Segment | Narration focus | Screen action |
| --- | --- | --- |
| 1 | Welcome to the Alphabet Unit | Open the Alphabet unit page and show the title/header. |
| 2 | Lecture step | Show the stepper with Lecture selected, then click or hover over Play Lecture. |
| 3 | Rules step | Move to Rules and show the child-friendly rules canvas. Point to Complete Rules and Pause. |
| 4 | Listen step | Show Listen. Play one or two letter tiles without repeating. |
| 5 | Watch step | Show Watch video controls and one sample letter video. |
| 6 | Phonetics step | Show Phonetics and point to mouth/place-of-sound learning. |
| 7 | Repeat step | Show Repeat and demonstrate listening then repeating after the teacher. |
| 8 | LetterClue step | Show LetterClue and point to the letter shape and dots. |
| 9 | Speak step | Show Speak and demonstrate the record/compare workflow without recording private audio. |
| 10 | Match step | Show Match and complete one obvious match slowly. |
| 11 | SoundClue step | Show SoundClue and demonstrate listening for the correct letter. |
| 12 | Animate step | Show Animate and let one writing animation play briefly. |
| 13 | Write step | Show Write, tracing, and print controls if available. |
| 14 | Submit step | Show Submit/review area and explain finishing the unit. |
| 15 | Navigation safety | Show Back, Step Back, Skip Step, and the confirmation message behavior. |
| 16 | Closing | Return to the unit title or first step and end with "Bismillah." |

## Suggested Capture Checklist

1. Start the local integration server.
2. Open the Alphabet unit test URL.
3. Reset or use a clean student state if needed so the stepper begins at Lecture.
4. Record the screen while playing the ElevenLabs narration.
5. Keep the recording aligned with the narration. If the narration mentions a step, show that step.
6. Export as MP4.
7. Replace `src/media/messages/lectures/alphabet_lecture.mp4`.
8. Run the integration build and verification.
9. Test the Lecture step in the browser.

## Notes For The Video Pass

- If the final narration is longer than the current lecture video, that is okay. The screen recording should follow the narration rather than the old video length.
- If any step is locked during recording, use the app's managed test state or temporarily navigate through completed steps during capture.
- The video should teach the workflow, not every letter. Use one or two examples per interactive step.
