// maddoleen learner-facing message copy.
// Edit this file when step messages change; keep unit.config.js for stable unit settings.
(function (root) {
  'use strict';

  root.PQ_UNIT_MESSAGES = Object.freeze({
      "entry": {
        "lecture": {
          "text": "Welcome to the MaddoLeen unit. Click Play Lecture and listen carefully before you begin."
        },
        "rules": {
          "audio": "maddoleen.mp3",
          "text": "You have completed the lecture. You have now entered the Rules step. Learn how Maddleen creates a soft ay or aw sound."
        },
        "listen": {
          "text": "You have completed the Rules step. You have now entered Listen. Listen carefully to each Maddleen group."
        },
        "listen1": {
          "text": "You have completed the Rules step. You have now entered Listen 1. Listen carefully to each Maddleen group."
        },
        "listen2": {
          "text": "Good work. You have now entered Listen 2. Listen again and focus on the Madd letters."
        },
        "listen3": {
          "text": "Good work. You have now entered Listen 3. Listen one more time and complete the practice."
        }
      },
      "entryPasses": {},
      "completion": {
        "rules": {
          "text": "Good work. Continue to Listen and hear each Maddleen sound."
        },
        "listen3": {
          "text": "Congratulations. You have completed the MaddoLeen unit."
        }
      }
    });
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
