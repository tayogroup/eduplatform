#!/usr/bin/env node

const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..', '..');
const outRoot = path.join(root, 'outputs', 'somali-news-podcast');
const configPath = path.join(__dirname, 'sources.json');
const playerTemplatePath = path.join(__dirname, 'tv-player.html');
const defaultElevenLabsVoiceId = 'B5xxC4eQoOFJnY4R5XkI';
const defaultElevenLabsVoiceName = 'Ubax';
const allowedSourceNames = new Set([
  'BBC English',
  'BBC Somali',
  'Reuters',
  'AP',
  'Al Jazeera',
  'VOA Somali',
  'NYT',
  'Washington Post',
  'CNN',
  'MSNBC',
]);

function loadDotEnv() {
  const envPath = path.join(root, '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^"|"$/g, '');
  }
}

function arg(name, fallback = '') {
  const args = process.argv.slice(2);
  const prefix = `--${name}=`;
  const found = args.find((item) => item.startsWith(prefix));
  if (found) return found.slice(prefix.length);
  const index = args.indexOf(`--${name}`);
  if (index >= 0 && args[index + 1] && !args[index + 1].startsWith('--')) return args[index + 1];
  return fallback;
}

function hasFlag(name) {
  return process.argv.slice(2).includes(`--${name}`);
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function xmlDecode(value) {
  return String(value || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function textFromTag(block, tag) {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match ? xmlDecode(match[1]).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '';
}

function parseFeed(xml, source) {
  const blocks = xml.match(/<item[\s\S]*?<\/item>|<entry[\s\S]*?<\/entry>/gi) || [];
  return blocks.map((block) => {
    const title = textFromTag(block, 'title');
    const summary = textFromTag(block, 'description') || textFromTag(block, 'summary') || textFromTag(block, 'content');
    const dateText = textFromTag(block, 'pubDate') || textFromTag(block, 'updated') || textFromTag(block, 'published');
    const link = textFromTag(block, 'link') || ((block.match(/<link[^>]+href=["']([^"']+)["']/i) || [])[1] || '');
    const publishedAt = dateText ? new Date(dateText) : new Date();
    return {
      source: source.name,
      sourceId: source.id,
      title,
      summary,
      url: link,
      publishedAt: Number.isNaN(publishedAt.getTime()) ? new Date().toISOString() : publishedAt.toISOString(),
    };
  }).filter((item) => item.title);
}

function parseHomepage(html, source) {
  const base = new URL(source.home || source.url);
  const anchors = [];
  const anchorRe = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = anchorRe.exec(html))) {
    const rawTitle = xmlDecode(match[2]).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!rawTitle || rawTitle.length < 18 || rawTitle.length > 180) continue;
    if (isJunkHeadline(rawTitle)) continue;
    let url = match[1];
    if (url.startsWith('#') || url.startsWith('mailto:')) continue;
    try {
      url = new URL(url, base).toString();
    } catch (_err) {
      continue;
    }
    if (new URL(url).hostname.replace(/^www\./, '') !== base.hostname.replace(/^www\./, '')) continue;
    anchors.push({
      source: source.name,
      sourceId: source.id,
      title: rawTitle,
      summary: '',
      url,
      publishedAt: new Date().toISOString(),
    });
  }
  const seen = new Set();
  return anchors.filter((item) => {
    const key = item.title.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 12);
}

function isJunkHeadline(title) {
  const text = String(title || '').trim();
  if (!text) return true;
  if (/\b(getty images|anadolu|get caught up|what you may have missed|live tv|sign in|subscribe|newsletter)\b/i.test(text)) return true;
  if (/^[A-Z][a-z]+(?:\s+[A-Z]\.){2,}/.test(text)) return true;
  if (text.split(/\s+/).length < 4 && !/[.!?؟]/.test(text)) return true;
  return false;
}

async function fetchText(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'user-agent': 'SomaliNewsPodcastLocal/1.0 (+local personal news digest)',
        accept: 'application/rss+xml, application/xml, text/xml, */*',
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timeout);
  }
}

function validateConfig(config) {
  for (const source of config.sources || []) {
    if (!allowedSourceNames.has(source.name)) {
      throw new Error(`Source is not approved: ${source.name}`);
    }
  }
}

async function fetchApprovedNews(config) {
  const fetched = [];
  const errors = [];
  for (const source of config.sources) {
    try {
      const xml = await fetchText(source.url);
      const feedItems = parseFeed(xml, source);
      if (!feedItems.length) throw new Error('Feed returned no RSS/Atom items');
      fetched.push(...feedItems);
      console.log(`Fetched ${source.name} (${feedItems.length} feed items)`);
    } catch (err) {
      if (source.home) {
        try {
          const html = await fetchText(source.home);
          const homepageItems = parseHomepage(html, source);
          fetched.push(...homepageItems);
          errors.push({ source: source.name, message: `RSS failed: ${err.message}; used homepage fallback.` });
          console.warn(`RSS failed for ${source.name}; used homepage fallback (${homepageItems.length} items).`);
          continue;
        } catch (fallbackErr) {
          errors.push({ source: source.name, message: `${err.message}; homepage fallback failed: ${fallbackErr.message}` });
          console.warn(`Could not fetch ${source.name}: ${err.message}; homepage fallback failed: ${fallbackErr.message}`);
          continue;
        }
      }
      errors.push({ source: source.name, message: err.message });
      console.warn(`Could not fetch ${source.name}: ${err.message}`);
    }
  }
  const deduped = [];
  const seen = new Set();
  for (const item of fetched.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))) {
    if (isJunkHeadline(item.title)) continue;
    const key = item.title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().slice(0, 120);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    deduped.push(item);
  }
  const selected = diversify(deduped, Number(config.maxItems || 14));
  return { items: selected, errors };
}

function diversify(items, maxItems) {
  const selected = [];
  const bySource = new Map();
  for (const item of items) {
    if (!bySource.has(item.source)) bySource.set(item.source, []);
    bySource.get(item.source).push(item);
  }
  for (const sourceItems of bySource.values()) {
    if (sourceItems[0]) selected.push(sourceItems[0]);
    if (selected.length >= maxItems) return selected;
  }
  for (const item of items) {
    if (selected.includes(item)) continue;
    selected.push(item);
    if (selected.length >= maxItems) break;
  }
  return selected;
}

function demoItems() {
  const now = new Date().toISOString();
  return [
    { source: 'BBC English', title: 'Global leaders meet for urgent security talks', summary: 'Diplomats are seeking a common response to a fast-moving international crisis.', url: 'https://www.bbc.com/news/world', publishedAt: now },
    { source: 'Reuters', title: 'Markets watch energy prices amid regional tension', summary: 'Oil and currency traders reacted as governments assessed supply risks.', url: 'https://www.reuters.com/world/', publishedAt: now },
    { source: 'AP', title: 'Aid agencies warn of growing humanitarian needs', summary: 'Relief groups say food, medical supplies, and shelter remain urgent priorities.', url: 'https://apnews.com/hub/world-news', publishedAt: now },
    { source: 'Al Jazeera', title: 'Ceasefire diplomacy continues after overnight talks', summary: 'Mediators reported cautious progress while warning that major gaps remain.', url: 'https://www.aljazeera.com/news/', publishedAt: now },
    { source: 'VOA Somali', title: 'Wararkii ugu dambeeyay ee Geeska Afrika', summary: 'Warbixinno ku saabsan siyaasadda gobolka iyo xaaladaha bulshada.', url: 'https://www.voasomali.com/', publishedAt: now },
  ];
}

function fallbackEpisode(items, config, modeNote) {
  const dateLabel = new Intl.DateTimeFormat('so-SO', { dateStyle: 'full', timeStyle: 'short' }).format(new Date());
  const slides = items.slice(0, 8).map((item, index) => ({
    type: 'headline',
    kicker: item.source,
    title: item.title,
    bullets: [
      item.summary || 'Faahfaahin kooban ayaa laga soo xigtay ilaha la oggolaaday.',
      `Isha: ${item.source}`,
    ],
    source: item.source,
    url: item.url,
    accent: ['#0b6bcb', '#0f766e', '#b45309', '#7c3aed'][index % 4],
  }));
  const narrationParts = [
    `Kusoo dhowaada ${config.episodeTitle}. Waa ${dateLabel}.`,
    modeNote || 'Qaybtan waxaa lagu diyaariyay hab kooban oo maxalli ah. Furaha OpenAI marka la geliyo, qoraalka Soomaaliga wuxuu noqonayaa mid dhammaystiran oo tafatiran.',
    ...items.slice(0, 8).map((item, index) => `Qodobka ${index + 1}. ${item.source} waxay qortay: ${item.title}. ${item.summary || ''}`),
    'Intaas ayay ahayd warbixinta caalamka ee maanta. Mahadsanid.',
  ];
  return {
    title: config.episodeTitle,
    language: 'Somali',
    scriptQuality: 'preview',
    generatedAt: new Date().toISOString(),
    dateLabel,
    narration: narrationParts.join('\n\n'),
    slides: [
      {
        type: 'cover',
        kicker: 'Somali AI News Podcast',
        title: config.episodeTitle,
        bullets: [dateLabel, 'BBC, Reuters, AP, Al Jazeera, VOA, NYT, Washington Post, CNN, MSNBC'],
        accent: '#0f766e',
      },
      ...slides,
      {
        type: 'closing',
        kicker: 'Dhammaad',
        title: 'Mahadsanid',
        bullets: ['Wararka waxaa laga soo xulay oo keliya ilaha la oggolaaday.', 'Hubi bogagga ilaha rasmiga ah si aad u akhrido faahfaahinta buuxda.'],
        accent: '#334155',
      },
    ],
    items,
  };
}

async function createEpisodeWithOpenAI(items, config) {
  if (!process.env.OPENAI_API_KEY) {
    return fallbackEpisode(items, config, 'OPENAI_API_KEY lama helin; tani waa qoraal kooban oo tijaabo ah.');
  }
  const model = process.env.OPENAI_NEWS_MODEL || 'gpt-4o-mini';
  const sourcePacket = items.map((item, index) => ({
    index: index + 1,
    source: item.source,
    title: item.title,
    summary: item.summary,
    url: item.url,
    publishedAt: item.publishedAt,
  }));
  const prompt = [
    'Create a Somali-language international news video podcast episode from ONLY the supplied approved-source items.',
    'Do not add facts that are not in the supplied items. Attribute each headline to its source.',
    'Return strict JSON with keys: title, language, narration, slides.',
    'slides must be 8 to 12 objects with keys: type, kicker, title, bullets, source, url, accent.',
    'Narration should be fluent Somali, neutral, suitable for audio, 5 to 8 minutes if enough items exist.',
    'Do not include markdown.',
    JSON.stringify(sourcePacket, null, 2),
  ].join('\n\n');
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.25,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'You are a careful Somali news editor and broadcast producer.' },
        { role: 'user', content: prompt },
      ],
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.warn(`OpenAI script generation failed (${res.status}); using fallback. ${body.slice(0, 300)}`);
    return fallbackEpisode(items, config, 'AI tafatirka qoraalka wuu fashilmay; tani waa qoraal kooban oo tijaabo ah.');
  }
  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content || '{}';
  const episode = JSON.parse(raw);
  episode.generatedAt = new Date().toISOString();
  episode.dateLabel = new Intl.DateTimeFormat('so-SO', { dateStyle: 'full', timeStyle: 'short' }).format(new Date());
  episode.items = items;
  episode.scriptQuality = 'ai-somali';
  if (!Array.isArray(episode.slides) || !episode.slides.length || !episode.narration) {
    throw new Error('OpenAI response did not include usable narration/slides.');
  }
  return episode;
}

function findFfmpeg() {
  const candidates = [
    process.env.FFMPEG_PATH,
    String.raw`C:\ffmpeg\bin\ffmpeg.exe`,
    String.raw`C:\Users\inawa\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.0-full_build\bin\ffmpeg.exe`,
    'ffmpeg',
  ].filter(Boolean);
  for (const candidate of candidates) {
    const probe = spawnSync(candidate, ['-version'], { encoding: 'utf8' });
    if (probe.status === 0) return candidate;
  }
  throw new Error('ffmpeg not found. Install ffmpeg or set FFMPEG_PATH in .env.');
}

function estimateNarrationSeconds(text) {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(60, Math.min(900, Math.ceil((words / 125) * 60)));
}

function createSilentAudio(text, outPath) {
  const ffmpeg = findFfmpeg();
  const seconds = estimateNarrationSeconds(text);
  const res = spawnSync(ffmpeg, [
    '-y',
    '-f', 'lavfi',
    '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100',
    '-t', String(seconds),
    '-c:a', 'libmp3lame',
    '-b:a', '128k',
    outPath,
  ], { encoding: 'utf8' });
  if (res.status !== 0) throw new Error(`Could not create silent audio: ${(res.stderr || res.stdout).slice(0, 500)}`);
}

async function createOpenAiAudio(text, outPath) {
  const model = process.env.OPENAI_TTS_MODEL || 'gpt-4o-mini-tts';
  const voice = process.env.OPENAI_TTS_VOICE || 'alloy';
  const res = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ model, voice, input: text, format: 'mp3' }),
  });
  if (!res.ok) throw new Error(`OpenAI TTS failed (${res.status}): ${(await res.text()).slice(0, 500)}`);
  fs.writeFileSync(outPath, Buffer.from(await res.arrayBuffer()));
}

async function createElevenLabsAudio(text, outPath) {
  const requestedVoiceName = process.env.SOMALI_NEWS_ELEVENLABS_VOICE_NAME || defaultElevenLabsVoiceName;
  const configuredVoiceId = process.env.SOMALI_NEWS_ELEVENLABS_VOICE_ID || process.env.PREQURAN_QUIZ_TTS_VOICE_ID || '';
  const voiceId = configuredVoiceId || await resolveElevenLabsVoiceByName(requestedVoiceName);
  const model = process.env.SOMALI_NEWS_ELEVENLABS_MODEL_ID || process.env.PREQURAN_QUIZ_TTS_MODEL_ID || 'eleven_multilingual_v2';
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: {
      'xi-api-key': process.env.ELEVENLABS_API_KEY,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      text,
      model_id: model,
      voice_settings: { stability: 0.55, similarity_boost: 0.75, style: 0.15, use_speaker_boost: true },
    }),
  });
  if (!res.ok) throw new Error(`ElevenLabs TTS failed (${res.status}): ${(await res.text()).slice(0, 500)}`);
  fs.writeFileSync(outPath, Buffer.from(await res.arrayBuffer()));
}

async function resolveElevenLabsVoiceByName(voiceName) {
  try {
    return await findElevenLabsVoiceId(voiceName);
  } catch (err) {
    if (String(voiceName || '').trim().toLowerCase() === 'ubax') {
      throw new Error(
        `Ubax voice requested, but SOMALI_NEWS_ELEVENLABS_VOICE_ID is not set and this ElevenLabs key cannot list voices. ` +
        `Add Ubax's ElevenLabs voice ID to .env as SOMALI_NEWS_ELEVENLABS_VOICE_ID. Lookup failed: ${err.message}`
      );
    }
    console.warn(`Could not resolve ElevenLabs voice "${voiceName}"; using fallback voice ID. ${err.message}`);
    return defaultElevenLabsVoiceId;
  }
}

async function findElevenLabsVoiceId(voiceName) {
  const res = await fetch('https://api.elevenlabs.io/v1/voices', {
    headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY },
  });
  if (!res.ok) throw new Error(`ElevenLabs voice lookup failed (${res.status}): ${(await res.text()).slice(0, 500)}`);
  const data = await res.json();
  const voices = Array.isArray(data.voices) ? data.voices : [];
  const normalized = String(voiceName || '').trim().toLowerCase();
  const voice = voices.find((item) => String(item.name || '').trim().toLowerCase() === normalized) ||
    voices.find((item) => String(item.name || '').trim().toLowerCase().includes(normalized)) ||
    voices[0];
  if (!voice?.voice_id) {
    throw new Error('ElevenLabs voice lookup returned no available voices.');
  }
  console.log(`Using ElevenLabs voice: ${voice.name || voice.voice_id}`);
  return voice.voice_id;
}

async function createAudio(episode, outPath) {
  if ((episode.scriptQuality || '') === 'preview' && process.env.SOMALI_NEWS_ALLOW_PREVIEW_TTS !== 'true') {
    console.warn('No OPENAI_API_KEY is configured, so the script is only a mixed-source preview. Creating silent audio instead of bad Somali narration.');
    createSilentAudio(episode.narration, outPath);
    return 'silent-preview-script-needs-openai';
  }

  const provider = (process.env.SOMALI_NEWS_TTS_PROVIDER || '').toLowerCase();
  if ((provider === 'elevenlabs' || (!provider && process.env.ELEVENLABS_API_KEY)) && process.env.ELEVENLABS_API_KEY) {
    try {
      await createElevenLabsAudio(episode.narration, outPath);
      return 'elevenlabs';
    } catch (err) {
      if (String(err.message || '').includes('Ubax voice requested')) throw err;
      if (provider === 'elevenlabs') throw err;
      console.warn(`ElevenLabs unavailable; trying next audio option. ${err.message}`);
    }
  }
  if ((provider === 'openai' || (!provider && process.env.OPENAI_API_KEY)) && process.env.OPENAI_API_KEY) {
    try {
      await createOpenAiAudio(episode.narration, outPath);
      return 'openai';
    } catch (err) {
      if (provider === 'openai') throw err;
      console.warn(`OpenAI TTS unavailable; creating silent preview audio. ${err.message}`);
    }
  }
  createSilentAudio(episode.narration, outPath);
  return 'silent-preview';
}

function renderVideo(episodePath, audioPath, videoPath) {
  const python = process.env.PYTHON || 'python';
  const res = spawnSync(python, [
    path.join(__dirname, 'render_video.py'),
    '--episode', episodePath,
    '--audio', audioPath,
    '--out', videoPath,
  ], { cwd: root, encoding: 'utf8' });
  if (res.status !== 0) {
    throw new Error(`Video render failed:\n${res.stdout}\n${res.stderr}`);
  }
  process.stdout.write(res.stdout);
}

function writePlayer(episode, videoName) {
  const videoPath = path.join(outRoot, videoName);
  const videoVersion = fs.existsSync(videoPath) ? String(fs.statSync(videoPath).mtimeMs.toFixed(0)) : String(Date.now());
  const videoSrc = `${videoName}?v=${videoVersion}`;
  const html = fs.readFileSync(playerTemplatePath, 'utf8')
    .replaceAll('__EPISODE_TITLE__', escapeHtml(episode.title || 'Somali News Podcast'))
    .replaceAll('__VIDEO_SRC__', escapeHtml(videoSrc))
    .replaceAll('__GENERATED_AT__', escapeHtml(episode.dateLabel || episode.generatedAt || ''))
    .replaceAll('__HEADLINES__', (episode.slides || []).filter((slide) => slide.type !== 'cover' && slide.type !== 'closing').slice(0, 10).map((slide) => {
      return `<li><span>${escapeHtml(slide.kicker || slide.source || '')}</span>${escapeHtml(slide.title || '')}</li>`;
    }).join('\n'));
  fs.writeFileSync(path.join(outRoot, 'index.html'), html, 'utf8');
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

async function runOnce() {
  loadDotEnv();
  ensureDir(outRoot);
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  validateConfig(config);
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const episodeDir = path.join(outRoot, stamp);
  ensureDir(episodeDir);
  const news = hasFlag('demo') ? { items: demoItems(), errors: [] } : await fetchApprovedNews(config);
  if (!news.items.length) throw new Error('No news items were fetched. Try --demo or check the feed URLs/network.');
  fs.writeFileSync(path.join(episodeDir, 'source-items.json'), JSON.stringify(news, null, 2), 'utf8');
  const episode = await createEpisodeWithOpenAI(news.items, config);
  const episodePath = path.join(episodeDir, 'episode.json');
  const audioPath = path.join(episodeDir, 'narration.mp3');
  const videoPath = path.join(episodeDir, 'somali-news-podcast.mp4');
  fs.writeFileSync(episodePath, JSON.stringify(episode, null, 2), 'utf8');
  const audioProvider = await createAudio(episode, audioPath);
  renderVideo(episodePath, audioPath, videoPath);
  fs.copyFileSync(videoPath, path.join(outRoot, 'latest.mp4'));
  fs.copyFileSync(episodePath, path.join(outRoot, 'latest.json'));
  writePlayer(episode, 'latest.mp4');
  console.log(`Audio provider: ${audioProvider}`);
  console.log(`TV page: ${path.join(outRoot, 'index.html')}`);
  console.log(`Video: ${videoPath}`);
}

function refreshPlayer() {
  loadDotEnv();
  ensureDir(outRoot);
  const episodePath = path.join(outRoot, 'latest.json');
  const videoPath = path.join(outRoot, 'latest.mp4');
  if (!fs.existsSync(episodePath)) throw new Error(`Missing ${episodePath}. Run the podcast pipeline first.`);
  if (!fs.existsSync(videoPath)) throw new Error(`Missing ${videoPath}. Run the podcast pipeline first.`);
  const episode = JSON.parse(fs.readFileSync(episodePath, 'utf8'));
  writePlayer(episode, 'latest.mp4');
  console.log(`Refreshed TV page: ${path.join(outRoot, 'index.html')}`);
}

function serve() {
  loadDotEnv();
  const port = Number(arg('port', process.env.SOMALI_NEWS_PORT || '8787'));
  ensureDir(outRoot);
  const server = http.createServer((req, res) => {
    const requestPath = decodeURIComponent((req.url || '/').split('?')[0]);
    const safePath = path.normalize(requestPath === '/' ? '/index.html' : requestPath).replace(/^(\.\.[/\\])+/, '');
    const filePath = path.join(outRoot, safePath);
    if (!filePath.startsWith(outRoot) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const types = { '.html': 'text/html; charset=utf-8', '.json': 'application/json; charset=utf-8', '.mp4': 'video/mp4', '.mp3': 'audio/mpeg' };
    res.writeHead(200, { 'content-type': types[ext] || 'application/octet-stream', 'cache-control': 'no-store' });
    fs.createReadStream(filePath).pipe(res);
  });
  server.listen(port, '0.0.0.0', () => {
    const addresses = localAddresses().map((ip) => `http://${ip}:${port}/`);
    console.log(`Somali news TV server running.`);
    console.log(`Local: http://127.0.0.1:${port}/`);
    console.log(`TV: ${addresses.join('  ')}`);
  });
}

function localAddresses() {
  const nets = os.networkInterfaces();
  const addresses = [];
  for (const entries of Object.values(nets)) {
    for (const entry of entries || []) {
      if (entry.family === 'IPv4' && !entry.internal) addresses.push(entry.address);
    }
  }
  return addresses.length ? addresses : ['127.0.0.1'];
}

async function watch() {
  const everyMinutes = Math.max(15, Number(arg('every-minutes', process.env.SOMALI_NEWS_EVERY_MINUTES || '180')));
  await runOnce();
  setInterval(() => {
    runOnce().catch((err) => console.error(err.stack || err.message));
  }, everyMinutes * 60 * 1000);
  serve();
}

async function main() {
  if (hasFlag('refresh-player')) return refreshPlayer();
  if (hasFlag('serve')) return serve();
  if (hasFlag('watch')) return watch();
  return runOnce();
}

main().catch((err) => {
  console.error(err.stack || err.message);
  process.exit(1);
});
