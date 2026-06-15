# Alphabet Quiz Chatbot Requirements

Date created: 2026-06-12

## Goal

Add a child-friendly quiz chatbot for the Alphabet lesson. The chatbot is launched from the existing `Alphabet Quiz` submenu card in the child app shell and quizzes the child on material from the completed Alphabet unit.

## User Flow

1. Child opens the app shell.
2. Child chooses Alphabet World.
3. Child opens the `Alphabet Quiz` card.
4. The quiz chatbot opens as a full-page activity.
5. The chatbot asks one question at a time.
6. The child answers by tapping large choices.
7. The chatbot gives warm feedback and moves to the next question.
8. At the end, the child sees a simple score summary and can try again.

## Unlock Rule

Target production rule:

- Alphabet Quiz should be available after the child completes the Alphabet lesson.
- When local completion state is available, the quiz page should detect `alphabet_listen_managed_progress_cache_v1` and treat `__finished: true` as completed.
- During local/static preview, the quiz remains startable so QA and curriculum review are not blocked by missing Moodle state.

Future backend rule:

- Moodle should expose lesson completion and quiz attempt state so the app shell can lock or unlock the card before navigation.

## Child Experience

Required:

- Chat-style messages with short, gentle wording.
- No harsh wrong-answer language.
- Large answer buttons.
- Arabic letters shown in large readable type.
- Voice reading for questions and chatbot feedback where browser speech synthesis is available.
- ElevenLabs voice should be used first through the Moodle server-side proxy when configured.
- Initial ElevenLabs voice ID: `B5xxC4eQoOFJnY4R5XkI`.
- ElevenLabs API keys must stay in Moodle server-side settings and must never be embedded in static app shell or Bunny JavaScript.
- Prefer natural installed voices, such as Microsoft Jenny, Aria, Sonia, Libby, Google English voices, or other natural/neural English voices when the browser exposes them.
- Use spoken-only child-friendly scripts rather than reading UI text literally.
- Voice answer input where browser speech recognition is available.
- Tap-answer fallback when microphone or speech recognition is unavailable.
- Immediate feedback after each answer.
- Retry option after the final result.
- Mobile and tablet friendly layout.

Tone:

- Encouraging.
- Calm.
- Simple.
- Suitable for young children.

## Alphabet Quiz Scope

Initial question categories:

- Letter recognition.
- Dots above and below.
- Heavy and light letters.
- Letter order.
- Letter sound/transliteration recall.
- Short vowel recognition.

Initial implementation uses curated static questions. Later versions can generate the question list from unit content config.

## Tracking

Initial local tracking:

- quiz id
- score
- total questions
- percentage
- completion time
- missed question ids

Storage key:

- `pq_alphabet_quiz_chatbot_result_v1`

Future Moodle tracking:

- Persist quiz attempts server-side.
- Show latest result to teacher/parent dashboards.
- Use missed question ids to recommend review.

## Implementation Files

- App shell link: `src/app-shell/js/app-config.js`
- Quiz chatbot page: `src/scripts/alphabet_quiz_chatbot.html`
- Server-side TTS proxy: `src/moodle/local_hubredirect/quiz_tts.php`
- Moodle TTS settings: `src/moodle/local_prequran/settings.php`

## ElevenLabs Configuration Fallbacks

Preferred:

- Configure `ElevenLabs API key`, voice ID, and model ID in Moodle `local_prequran` plugin settings.

If the Moodle settings section is not visible yet, the proxy may also read:

- `$CFG->local_prequran_elevenlabs_api_key`
- `$CFG->local_prequran_quiz_tts_voice_id`
- `$CFG->local_prequran_quiz_tts_model_id`
- `ELEVENLABS_API_KEY`
- `PREQURAN_QUIZ_TTS_VOICE_ID`
- `PREQURAN_QUIZ_TTS_MODEL_ID`

## Acceptance Criteria

- `Alphabet Quiz` opens the chatbot page from the submenu.
- Chatbot renders without backend dependencies.
- Child can complete a full quiz attempt.
- Correct and incorrect answers show supportive feedback.
- Final score summary appears.
- Result is saved locally.
- Quiz Buddy can read the current question aloud.
- Child can answer by saying the answer name or choice number in supported browsers.
- Voice controls fail gently when browser speech APIs are unavailable.
- Bunny build copies the quiz page to `/pre_quraan/scripts/alphabet_quiz_chatbot.html`.
