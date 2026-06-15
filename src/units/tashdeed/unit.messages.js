// tashdeed learner-facing message copy.
// Edit this file when step messages change; keep unit.config.js for stable unit settings.
(function (root) {
  'use strict';

  root.PQ_UNIT_MESSAGES = Object.freeze({
      "entry": {
        "lecture": {
          "text": "Welcome to the Tashdeed unit. Click Play Lecture and listen carefully before you begin."
        },
        "rules": {
          "audio": "tashdeed_rules.mp3",
          "text": "You have completed the lecture. You have now entered the Rules step. Learn how Tashdeed makes a letter doubled and stronger."
        },
        "listen": {
          "text": "You have completed the Rules step. Listen carefully to each Tashdeed word."
        },
        "listen1": {
          "text": "You have completed the Rules step. Listen carefully to each Tashdeed word."
        },
        "listen2": {
          "text": "Listen 2 is ready. Listen again and focus on the shaddah sound."
        },
        "listen3": {
          "text": "Listen 3 is ready. Listen one more time and complete the practice."
        }
      },
      "entryPasses": {},
      "completion": {
        "rules": {
          "text": "Good work. Continue to Listen and hear each Tashdeed sound."
        },
        "listen3": {
          "text": "Congratulations. You have completed the Tashdeed unit."
        }
      }
    });
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
