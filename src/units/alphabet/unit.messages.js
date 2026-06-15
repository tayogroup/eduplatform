// Alphabet learner-facing message copy.
// Edit this file when step messages change; keep unit.config.js for stable unit settings.
(function (root) {
  'use strict';

  root.PQ_UNIT_MESSAGES = Object.freeze({
    entry: {
      lecture: {
        audio: "alphabet_lecture step.mp3",
        text: "Welcome to the Alphabet Unit. In this unit, we will learn the Arabic letters step by step. First, you will watch the lesson. Sit in a quiet place, keep your eyes on the lesson, and listen with focus."
      },
      rules: {
        audio: "",
        text: "Great job finishing the lesson. Now you will learn the alphabet rules. You will learn that the Arabic alphabet has 29 letters. You will learn letter names, letter sounds, dots, heavy letters, light letters, and short vowels. Read carefully, then press Rules to listen. When the rules audio finishes two times, this step will be complete."
      },
      listen: {
        audio: "alphabet_listen_step_all_lettlers.mp3",
        text: "Now it is time to listen. This step helps your ears learn the sound of each letter. You will hear every letter in the alphabet. Do not repeat yet. Just listen carefully and notice how each letter sounds different."
      },
      watch: {
        audio: "alphabet_watch_step_watch_all_letters.mp3",
        clap: true,
        text: "Good job listening. Now you will watch the letters. This step helps your eyes see how each letter is said and formed. Look carefully at the screen. Watch the mouth, the sound, and the letter. You will get your turn to repeat soon."
      },
      phonetics: {
        audio: "alphabet_sound_step_articulation_model.mp3",
        text: "Now you will learn how to say the letters correctly. Some sounds come from the lips. Some sounds come from the tongue. Some sounds come from the throat. Listen to the explainer first, then watch and practice the sound in your mind."
      },
      sound: {
        audio: "alphabet_sound_step_articulation_model.mp3",
        text: "Now you will learn how to say the letters correctly. Some sounds come from the lips. Some sounds come from the tongue. Some sounds come from the throat. Listen to the explainer first, then watch and practice the sound in your mind."
      },
      repeat: {
        audio: "",
        text: "Now it is your turn to repeat. You will hear the teacher say a letter, then you will repeat after the teacher. Say the letter clearly. Do not rush. Try again if you need to. Practice makes your voice stronger."
      },
      letterclue: {
        audio: "",
        text: "Now you will use clues to remember the letters. You may see a picture and hear a clue sound for each letter. Look at the picture. Listen to the clue. Say the letter in your mind and remember it."
      },
      listenplus: {
        audio: "",
        text: "Now you will use clues to remember the letters. You may see a picture and hear a clue sound for each letter. Look at the picture. Listen to the clue. Say the letter in your mind and remember it."
      },
      speak: {
        audio: "alphabet_speak_step_all_letters.mp3",
        text: "Now you will speak the letters. Listen to the correct sound, then record your own voice. Say the letter clearly into the microphone. Listen to yourself. If it sounds good, continue. If not, try again."
      },
      match: {
        audio: "",
        text: "Now you will play a matching game. You will hear a sound and choose the correct letter. Listen carefully before you choose. If you make a mistake, do not worry. Try again and keep learning."
      },
      soundclue: {
        audio: "",
        text: "Now you will learn letter sounds with word clues. You will see a letter, a word, and a picture. Listen to the letter. Listen to the word. Try to hear how the letter sound is used."
      },
      words: {
        audio: "",
        text: "Now you will learn letter sounds with word clues. You will see a letter, a word, and a picture. Listen to the letter. Listen to the word. Try to hear how the letter sound is used."
      },
      animate: {
        audio: "",
        text: "Now you will watch how the letters are written. This step helps your eyes learn the writing movement. Watch where each letter starts and where it ends. This will help you when you write."
      },
      write: {
        audio: "",
        text: "Now it is time to write. This step helps your hand practice the Arabic letters. Trace and write the letters slowly. Stay on the lines. Try your best to make each letter clear and neat."
      },
      trace1: {
        audio: "",
        text: "Now it is time to write. This step helps your hand practice the Arabic letters. Trace and write the letters slowly. Stay on the lines. Try your best to make each letter clear and neat."
      },
      submit: {
        audio: "",
        text: "Now you will finish the unit. You will make a final recording so your teacher can hear your practice. Speak clearly. Take your time. When you are done, submit your work."
      }
    },
    entryPasses: {
      listen: [
        {
          audio: "alphabet_listen_step_heavy_letters.mp3",
          text: "Now listen for the heavy letters. These letters have a deep, strong sound. Keep your ears ready and listen carefully."
        },
        {
          audio: "alphabet_listen_step_light_letters.mp3",
          text: "Now listen for the light letters. These letters sound soft and clear. Listen carefully and notice how they are different from the heavy letters."
        },
        {
          audio: "alphabet_listen_step_alifaa_letters.mp3",
          text: "Now listen for the long letter sounds. These sounds stretch a little longer. Listen carefully and follow the sound."
        },
        {
          audio: "alphabet_listen_step_vowels_letters.mp3",
          text: "Now listen for the short vowel sounds. They are quick and clear. Listen carefully and notice how the vowel changes the letter sound."
        }
      ],
      watch: [
        {
          audio: "alphabet_listen_step_heavy_letters.mp3",
          text: "Now watch the heavy letters. Look carefully and notice the deep, strong sound."
        },
        {
          audio: "alphabet_listen_step_light_letters.mp3",
          text: "Now watch the light letters. Look carefully and notice the soft, clear sound."
        },
        {
          audio: "alphabet_listen_step_alifaa_letters.mp3",
          text: "Now watch the long letter sounds. Notice how the sound is held a little longer."
        },
        {
          audio: "alphabet_listen_step_vowels_letters.mp3",
          text: "Now watch the short vowel sounds. Notice how each vowel changes the letter sound."
        }
      ],
      repeat: [
        {
          audio: "alphabet_listen_step_heavy_letters.mp3",
          text: "Now repeat the heavy letters. Use a deep, strong sound. Say each letter clearly."
        },
        {
          audio: "alphabet_listen_step_light_letters.mp3",
          text: "Now repeat the light letters. Keep your sound soft and clear. Say each letter carefully."
        },
        {
          audio: "alphabet_listen_step_alifaa_letters.mp3",
          text: "Now repeat the long letter sounds. Stretch the sound gently and clearly."
        },
        {
          audio: "alphabet_listen_step_vowels_letters.mp3",
          text: "Now repeat the short vowel sounds. Keep them quick, clear, and neat."
        }
      ],
      trace1: [
        {
          audio: "",
          text: "Keep writing carefully. Follow the guide lines and make each letter clear."
        }
      ],
      write: [
        {
          audio: "",
          text: "Keep writing carefully. Follow the guide lines and make each letter clear."
        }
      ]
    },
    completion: {
      audio: "",
      text: "Great job. You practiced the Arabic alphabet in many ways. You listened with your ears. You watched with your eyes. You repeated with your mouth. You matched with your mind. You wrote with your hand. Now you are one step closer to reading the Quran. Keep practicing every day."
    },
    speakDoneConfirm: {
      audio: "",
      titleText: "Message",
      continueText: "Continue",
      cancelText: "Cancel",
      text: "Listen to your voice carefully. If your sound matches the teacher, press Done. If you want to make it better, record again and keep practicing."
    }
  });
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
