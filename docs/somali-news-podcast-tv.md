# Somali AI News Podcast for Samsung TV

This local pipeline creates a Somali-language, video-style international news podcast and serves it to a Samsung Smart TV on the same home network.

## Approved Sources

The source allowlist is fixed in `tools/news-podcast/sources.json`:

- BBC English
- BBC Somali
- Reuters
- AP
- Al Jazeera
- VOA Somali
- NYT
- Washington Post
- CNN
- MSNBC

The pipeline validates source names before it runs, so accidental extra sources are rejected.

## Setup

Add local keys to `.env`:

```env
OPENAI_API_KEY=your-openai-key
OPENAI_NEWS_MODEL=gpt-4o-mini
SOMALI_NEWS_TTS_PROVIDER=elevenlabs
ELEVENLABS_API_KEY=your-elevenlabs-key
SOMALI_NEWS_ELEVENLABS_VOICE_NAME=Ubax
SOMALI_NEWS_ELEVENLABS_VOICE_ID=your-ubax-elevenlabs-voice-id
SOMALI_NEWS_ELEVENLABS_MODEL_ID=eleven_multilingual_v2
SOMALI_NEWS_PORT=8787
SOMALI_NEWS_EVERY_MINUTES=180
```

If `ELEVENLABS_API_KEY` is not set, the script tries OpenAI TTS when `OPENAI_API_KEY` is present. If no TTS provider is configured, it creates a silent preview video so the TV page can still be tested.

For the Ubax voice, set `SOMALI_NEWS_ELEVENLABS_VOICE_ID` to Ubax's ElevenLabs voice ID. Some restricted ElevenLabs keys can create speech but cannot list voices by name.

Install or expose `ffmpeg`. The scripts first check `FFMPEG_PATH`, then the existing local Winget ffmpeg path used by this repo, then `ffmpeg` on `PATH`.

## Run Once

```powershell
node tools/news-podcast/pipeline.js
```

For a no-network layout test:

```powershell
node tools/news-podcast/pipeline.js --demo
```

Outputs are written to:

```text
outputs/somali-news-podcast/
```

The current TV files are:

- `outputs/somali-news-podcast/index.html`
- `outputs/somali-news-podcast/latest.mp4`
- `outputs/somali-news-podcast/latest.json`

## Serve to Samsung TV

Start the local TV server:

```powershell
node tools/news-podcast/pipeline.js --serve --port=8787
```

Open the printed LAN URL on the Samsung TV browser, for example:

```text
http://192.168.1.50:8787/
```

The TV and laptop must be on the same network.

## Run Automatically

Run and keep refreshing every 3 hours:

```powershell
node tools/news-podcast/pipeline.js --watch --every-minutes=180 --port=8787
```

For a permanent Windows setup, create a Task Scheduler task that starts this command when the laptop logs in.
