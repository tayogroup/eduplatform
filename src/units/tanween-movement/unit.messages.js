// tanween-movement learner-facing message copy.
// Edit this file when step messages change; keep unit.config.js for stable unit settings.
(function (root) {
  'use strict';

  root.PQ_UNIT_MESSAGES = Object.freeze({
    entry: {
      lecture: {
        audio: "tanween_movement_step_lecture.mp3",
        text: "Welcome to the Tanween Movement unit. Click Play Lecture and listen carefully before you begin."
      },
      listen: {
        audio: "tanween_movement_step_listen.mp3",
        text: "You have completed the lecture. You have now entered the Listen step. Listen carefully to each word."
      },
      watch: {
        audio: "tanween_movement_step_watch.mp3",
        clap: true,
        text: "Good job. You have completed the Listen step. You have now entered the Watch step. Watch carefully and notice how each word is pronounced."
      },
      repeat: {
        audio: "tanween_movement_step_repeat.mp3",
        text: "You have completed the Watch step. You have now entered the Repeat step. Listen and repeat after each word."
      },
      speak: {
        audio: "tanween_movement_step_speak.mp3",
        text: "You have completed the Repeat step. You have now entered the Speak step. Tap a word, record your voice, and compare your pronunciation."
      },
      trace1: {
        audio: "tanween_movement_step_trace1.mp3",
        text: "You have completed the Speak step. You have now entered the Write step. Trace the words carefully."
      }
    },
    entryPasses: {
      trace1: [
        {
          audio: "tanween_movement_step_trace1_pass2.mp3",
          text: "Good work. Continue with the next writing pass."
        },
        {
          audio: "tanween_movement_step_trace1_pass3.mp3",
          text: "Nice effort. Continue with the next writing pass."
        },
        {
          audio: "tanween_movement_step_trace1_pass4.mp3",
          text: "Almost done. Complete the final writing pass."
        }
      ]
    },
    completion: {
      audio: "tanween_movement_step_completion.mp3",
      text: "Congratulations. You have completed the Tanween Movement unit."
    }
  });
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
