# Rules Cue Generation

Rules audio can use exact cue timing from ElevenLabs Forced Alignment.

## Setup

Set the API key in your local shell. Do not commit the key.

```powershell
$env:ELEVENLABS_API_KEY="your_key_here"
```

## Transcript Files

Create a transcript beside each Rules audio file:

```text
src/media/messages/unit_steps/tanween-movement/tanween_rules.transcript.txt
```

The generator strips narration tags such as `[pause]` and `[excited]`.

Optional section markers can be added to help the UI highlight the right broad section:

```text
[[section:hero]]
Today, we are learning Tanween.

[[section:rule-1]]
Rule Number One.
Tanween makes the n sound.
كِتَابٌ
Kitabun.
```

Supported section marker examples:

```text
[[section:hero]]
[[section:rule-1]]
[[section:rule-2]]
[[section:practice]]
[[section:remember]]
```

## Generate Cues

Generate one file:

```powershell
npm run rules:cues -- --audio src/media/messages/unit_steps/tanween-movement/tanween_rules.mp3
```

If ElevenLabs is unavailable, or the API key does not have the `forced_alignment`
permission, generate a local estimated cue file from the transcript and real MP3
duration:

```powershell
npm run rules:cues -- --estimate --audio src/media/messages/unit_steps/tanween-movement/tanween_rules.mp3
```

When `ffprobe` is not on `PATH`, set `FFPROBE_PATH` or pass
`--duration=<seconds>`.

Generate by unit:

```powershell
npm run rules:cues -- --unit tanween-movement
```

Generate all known Rules audio cues:

```powershell
npm run rules:cues -- --all
```

The output is written beside the audio:

```text
src/media/messages/unit_steps/tanween-movement/tanween_rules.cues.json
```

The app automatically looks for `.cues.json` next to the Rules audio file. If no cue file exists, it falls back to approximate section timing.
