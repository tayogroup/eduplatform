// alphabet learner-facing message copy.
// Edit this file when step messages change; keep unit.config.js for stable unit settings.
(function (root) {
  'use strict';

  root.PQ_UNIT_MESSAGES = Object.freeze({
    entry: {
      lecture: {
        audio: "alphabet_lecture step.mp3",
        text: "Welcome to Quraan Academy Pre-quraan course.  You are in the first unit, the Alphabet, Lecture step. Click ‘Play Lecture’ and listen to the lecture carefully. Make sure you are in a quiet space with no distractions, and stay focused throughout the entire unit."
      },
      listen: {
        audio: "alphabet_listen_step_all_lettlers.mp3",
        text: "You have completed Alphabet Movement Lecture step. You have now entered Listen step, all letters. Listen carefully. Do not repeat—just focus on how each sound is different. Notice which sounds are strong, soft, or long. You will have the opportunity to watch and repeat later. Click on Listen to continue"
      },
      watch: {
        audio: "alphabet_watch_step_watch_all_letters.mp3",
        clap: true,
        text: "Good Job! You have completed the Alphabet Listen step. You have now entered the Watch step, all letters section. Click “Watch” and look carefully at how each letter is pronounced and formed. Watch quietly, keep your eyes on the screen, and do not repeat yet. You will have the opportunity to repeat later."
      },
      repeat: {
        audio: "",
        text: "You have completed Alphabet Watch step. You have now entered Repeat step. Click on Play All, then listen and repeat after."
      },
      sound: {
        audio: "alphabet_sound_step_articulation_model.mp3",
        text: "You have completed Alphabet Watch step. You have now entered Sound step. First click Explainer and listen carefully. Then you can replay the letter or continue to the video.."
      },
      speak: {
        audio: "alphabet_speak_step_all_letters.mp3",
        text: "You have completed Alphabet Repeat step. You have now entered Speak step. Tap a word, record your voice, and compare with the correct pronunciation."
      },
      animate: {
        audio: "",
        text: "You have completed Alphabet Repeat step. You have now entered Animate step. Tap a word, record your voice, and compare with the correct pronunciation."
      },
      trace1: {
        audio: "",
        text: "You have completed Alphabet Animate step. You have now entered Write step. Click on Write, Trace, and then Print."
      }
    },
    entryPasses: {
      listen: [
        {
          audio: "alphabet_listen_step_heavy_letters.mp3",
          text: "You have completed Listen step, all letters section.  You are now in Listen step, heavy letters section. Listen carefully. Do not repeat—just focus on the deep, strong sound. You will have the opportunity to watch and repeat later. Click on Listen to continue"
        },
        {
          audio: "alphabet_listen_step_light_letters.mp3",
          text: "You have completed Listen step, heavy letters section.  You are now in Listen step, light letters section.  Listen carefully. Do not repeat—just focus on the soft, clear sound. Notice how the tongue stays relaxed and the sound is not heavy. You will have the opportunity to watch and repeat later. Click on Listen to continue"
        },
        {
          audio: "alphabet_listen_step_alifaa_letters.mp3",
          text: "You have completed Listen step, heavy letters section. You are now in letters with Alif. Listen carefully. Do not repeat—just focus on the long, stretched sound. Notice how the sound is held longer and flows smoothly. You will have the opportunity to watch and repeat later. Click on Listen to continue"
        },
        {
          audio: "alphabet_listen_step_vowels_letters.mp3",
          text: "You have completed Listen step, letters with Alif section.  You are now in vowels section. Listen carefully. Do not repeat—just focus on the short, clear sound. Notice how each vowel changes the letter sound quickly and lightly. You will have the opportunity to watch and repeat later. Click on Watch to continue"
        }
      ],
      watch: [
        {
          audio: "alphabet_listen_step_heavy_letters.mp3",
          text: "You have completed Watch step, all letters section.  You are now in Listen step, heavy letters section. Listen carefully. Do not repeat—just focus on the deep, strong sound. You will have the opportunity to watch and repeat later. Click on Listen to continue"
        },
        {
          audio: "alphabet_listen_step_light_letters.mp3",
          text: "You have completed Watch step, heavy letters section.  You are now in Listen step, light letters section.  Listen carefully. Do not repeat—just focus on the soft, clear sound. Notice how the tongue stays relaxed and the sound is not heavy. You will have the opportunity to watch and repeat later. Click on Listen to continue"
        },
        {
          audio: "alphabet_listen_step_alifaa_letters.mp3",
          text: "You have completed Watch step, heavy letters section. You are now in letters with Alif. Listen carefully. Do not repeat—just focus on the long, stretched sound. Notice how the sound is held longer and flows smoothly. You will have the opportunity to watch and repeat later. Click on Listen to continue"
        },
        {
          audio: "alphabet_listen_step_vowels_letters.mp3",
          text: "You have completed Watch step, letters with Alif section.  You are now in vowels section. Listen carefully. Do not repeat—just focus on the short, clear sound. Notice how each vowel changes the letter sound quickly and lightly. You will have the opportunity to watch and repeat later. Click on Watch to continue"
        }
      ],
      repeat: [
        {
          audio: "alphabet_listen_step_heavy_letters.mp3",
          text: "You have completed Repeat step, all letters section.  You are now in Listen step, heavy letters section. Listen carefully. Do not repeat—just focus on the deep, strong sound. You will have the opportunity to watch and repeat later. Click on Listen to continue"
        },
        {
          audio: "alphabet_listen_step_light_letters.mp3",
          text: "You have completed Repeat step, heavy letters section.  You are now in Listen step, light letters section.  Listen carefully. Do not repeat—just focus on the soft, clear sound. Notice how the tongue stays relaxed and the sound is not heavy. You will have the opportunity to watch and repeat later. Click on Listen to continue"
        },
        {
          audio: "alphabet_listen_step_alifaa_letters.mp3",
          text: "You have completed Repeat step, heavy letters section. You are now in letters with Alif. Listen carefully. Do not repeat—just focus on the long, stretched sound. Notice how the sound is held longer and flows smoothly. You will have the opportunity to watch and repeat later. Click on Listen to continue"
        },
        {
          audio: "alphabet_listen_step_vowels_letters.mp3",
          text: "You have completed Repeat step, letters with Alif section.  You are now in vowels section. Listen carefully. Do not repeat—just focus on the short, clear sound. Notice how each vowel changes the letter sound quickly and lightly. You will have the opportunity to watch and repeat later. Click on Watch to continue"
        }
      ],
      trace1: [
        {
          audio: "",
          text: "..."
        }
      ]
    },
    completion: {
      audio: "",
      text: "Congratulations. You have completed Alphabet Learn Unit. You can now move to unmanaged mode or to the next unit."
    },
    speakDoneConfirm: {
      audio: "",
      titleText: "Message",
      continueText: "Continue",
      cancelText: "Cancel",
      text: "Listen carefully. If your sound matches with teacher, click Done. Otherwise, re-record and practice."
    }
  });
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
