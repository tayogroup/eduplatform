// madd learner-facing message copy.
// Edit this file when step messages change; keep unit.config.js for stable unit settings.
(function (root) {
  'use strict';

  root.PQ_UNIT_MESSAGES = Object.freeze({
      "entry": {
        "lecture": {
          "title": "Lecture",
          "body": "Watch the Madd lesson before you begin."
        },
        "rules": {
          "title": "Rules",
          "audio": "madd_rules.mp3",
          "body": "Learn the Madd rules. Madd means stretching the sound clearly and smoothly."
        },
        "listen": {
          "title": "Listen",
          "body": "You completed the Rules step. Listen carefully to each Madd sound."
        },
        "watch": {
          "title": "Watch",
          "body": "Watch the Madd example."
        },
        "repeat": {
          "title": "Repeat",
          "body": "Repeat each Madd sound after the teacher voice."
        },
        "trace1": {
          "title": "Write",
          "body": "Practice writing the Madd examples."
        }
      },
      "entryPasses": {},
      "completion": {
        "lecture": {
          "title": "Lecture complete",
          "body": "Good listening. Continue to the next step."
        },
        "rules": {
          "title": "Rules complete",
          "body": "Good work. Continue to Listen and hear each Madd sound."
        },
        "trace1": {
          "title": "Madd practice complete",
          "body": "Great work. Your Madd practice is complete."
        }
      }
    });
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
