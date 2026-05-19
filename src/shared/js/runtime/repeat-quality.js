/*
  Repeat light quality engine.
  This is intentionally lightweight: it checks for voice, reasonable duration,
  and a rough energy-shape match against the reference audio when available.
*/

const __pqRepeatQualityCache = Object.create(null);

function __pqRepeatQualityCfg(key, fallback) {
  try {
    const root = __cfg('repeatRecording.quality', __cfg('repeatQuality', {})) || {};
    return root[key] == null ? fallback : root[key];
  } catch (_e) {
    return fallback;
  }
}

function __pqRepeatQualityEnabled() {
  return __pqRepeatQualityCfg('enabled', true) !== false;
}

function __pqRepeatQualityAudioContext() {
  const Ctor = window.AudioContext || window.webkitAudioContext;
  return Ctor ? new Ctor() : null;
}

async function __pqRepeatQualityDecodeArrayBuffer(arrayBuffer) {
  const ctx = __pqRepeatQualityAudioContext();
  if (!ctx) return null;

  try {
    const copy = arrayBuffer.slice ? arrayBuffer.slice(0) : arrayBuffer;
    return await ctx.decodeAudioData(copy);
  } catch (_e) {
    return null;
  } finally {
    try { if (ctx && typeof ctx.close === 'function') await ctx.close(); } catch (_ignore) {}
  }
}

async function __pqRepeatQualityDecodeBlob(blob) {
  try {
    if (!blob || !blob.size || typeof blob.arrayBuffer !== 'function') return null;
    const arrayBuffer = await blob.arrayBuffer();
    return await __pqRepeatQualityDecodeArrayBuffer(arrayBuffer);
  } catch (_e) {
    return null;
  }
}

function __pqRepeatQualityAnalyzeBuffer(buffer) {
  try {
    if (!buffer || !buffer.length || !buffer.sampleRate) return null;

    const channelCount = Math.max(1, buffer.numberOfChannels || 1);
    const length = buffer.length;
    const sampleStep = Math.max(1, Math.floor(length / 12000));
    const silenceThreshold = Number(__pqRepeatQualityCfg('silenceThreshold', 0.015) || 0.015);
    const bins = Math.max(6, Number(__pqRepeatQualityCfg('envelopeBins', 12) || 12));
    const envelope = Array.from({ length: bins }, function () { return 0; });
    const counts = Array.from({ length: bins }, function () { return 0; });

    let sumSquares = 0;
    let peak = 0;
    let active = 0;
    let loud = 0;
    let total = 0;
    let loudRun = 0;
    let maxLoudRun = 0;
    const voiceThreshold = Number(__pqRepeatQualityCfg('voiceThreshold', 0.045) || 0.045);

    for (let i = 0; i < length; i += sampleStep) {
      let sample = 0;
      for (let ch = 0; ch < channelCount; ch += 1) {
        sample += buffer.getChannelData(ch)[i] || 0;
      }
      sample = sample / channelCount;

      const abs = Math.abs(sample);
      const bin = Math.min(bins - 1, Math.floor((i / length) * bins));

      envelope[bin] += abs;
      counts[bin] += 1;
      sumSquares += sample * sample;
      if (abs > peak) peak = abs;
      if (abs >= silenceThreshold) active += 1;
      if (abs >= voiceThreshold) {
        loud += 1;
        loudRun += 1;
        if (loudRun > maxLoudRun) maxLoudRun = loudRun;
      } else {
        loudRun = 0;
      }
      total += 1;
    }

    let voicedBins = 0;
    const binVoiceThreshold = Number(__pqRepeatQualityCfg('binVoiceThreshold', 0.035) || 0.035);
    for (let i = 0; i < bins; i += 1) {
      envelope[i] = counts[i] ? envelope[i] / counts[i] : 0;
      if (envelope[i] >= binVoiceThreshold) voicedBins += 1;
    }

    return {
      durationMs: Math.round((buffer.duration || 0) * 1000),
      rms: total ? Math.sqrt(sumSquares / total) : 0,
      peak,
      activeRatio: total ? active / total : 0,
      loudRatio: total ? loud / total : 0,
      maxLoudRunMs: Math.round((maxLoudRun * sampleStep / buffer.sampleRate) * 1000),
      voicedBins,
      envelope
    };
  } catch (_e) {
    return null;
  }
}

function __pqRepeatQualityNormalizeEnvelope(envelope) {
  const values = Array.isArray(envelope) ? envelope.slice() : [];
  const max = values.reduce(function (best, value) {
    return Math.max(best, Math.abs(Number(value) || 0));
  }, 0);

  if (!max) return values.map(function () { return 0; });
  return values.map(function (value) { return (Number(value) || 0) / max; });
}

function __pqRepeatQualityEnvelopeDiff(a, b) {
  const left = __pqRepeatQualityNormalizeEnvelope(a);
  const right = __pqRepeatQualityNormalizeEnvelope(b);
  const length = Math.min(left.length, right.length);
  if (!length) return null;

  let sum = 0;
  for (let i = 0; i < length; i += 1) {
    sum += Math.abs(left[i] - right[i]);
  }
  return sum / length;
}

async function __pqRepeatQualityReferenceForKey(key) {
  try {
    key = String(key || '').trim();
    if (!key) return null;
    if (__pqRepeatQualityCache[key]) return __pqRepeatQualityCache[key];

    if (typeof __pqResolveAudioUrlForKey !== 'function') return null;
    const url = __pqResolveAudioUrlForKey(key);
    if (!url) return null;

    const response = await fetch(url, { cache: 'force-cache' });
    if (!response || !response.ok) return null;

    const buffer = await __pqRepeatQualityDecodeArrayBuffer(await response.arrayBuffer());
    const analysis = __pqRepeatQualityAnalyzeBuffer(buffer);
    if (analysis) __pqRepeatQualityCache[key] = analysis;
    return analysis || null;
  } catch (_e) {
    return null;
  }
}

function __pqRepeatQualityResult(ok, code, message, metrics) {
  return {
    ok: !!ok,
    code: String(code || ''),
    message: String(message || ''),
    metrics: metrics || {}
  };
}

async function __pqRepeatQualityCheck(key, blob) {
  if (!__pqRepeatQualityEnabled()) {
    return __pqRepeatQualityResult(true, 'disabled', 'Good try!', {});
  }

  if (!blob || !blob.size) {
    return __pqRepeatQualityResult(false, 'empty', 'I did not hear your voice. Try again.', {});
  }

  const userBuffer = await __pqRepeatQualityDecodeBlob(blob);
  const user = __pqRepeatQualityAnalyzeBuffer(userBuffer);
  if (!user) {
    const failOpen = __pqRepeatQualityCfg('passIfAnalysisUnavailable', false) === true;
    return __pqRepeatQualityResult(
      failOpen,
      'unchecked',
      failOpen ? 'Good try!' : 'I could not check your voice. Try again.',
      { blobSize: blob.size }
    );
  }

  const minDurationMs = Number(__pqRepeatQualityCfg('minDurationMs', 260) || 260);
  const minRms = Number(__pqRepeatQualityCfg('minRms', 0.026) || 0.026);
  const minPeak = Number(__pqRepeatQualityCfg('minPeak', 0.075) || 0.075);
  const minActiveRatio = Number(__pqRepeatQualityCfg('minActiveRatio', 0.14) || 0.14);
  const minLoudRatio = Number(__pqRepeatQualityCfg('minLoudRatio', 0.035) || 0.035);
  const minLoudRunMs = Number(__pqRepeatQualityCfg('minLoudRunMs', 45) || 45);
  const minVoicedBins = Number(__pqRepeatQualityCfg('minVoicedBins', 2) || 2);
  const minVoiceScore = Number(__pqRepeatQualityCfg('minVoiceScore', 3) || 3);
  const hardMinPeak = Number(__pqRepeatQualityCfg('hardMinPeak', 0.035) || 0.035);
  const hardMinRms = Number(__pqRepeatQualityCfg('hardMinRms', 0.010) || 0.010);
  const metrics = { user };

  if (user.durationMs < minDurationMs) {
    return __pqRepeatQualityResult(false, 'too_short', 'That was too quick. Say the letter again.', metrics);
  }

  if (user.peak < hardMinPeak || user.rms < hardMinRms) {
    return __pqRepeatQualityResult(false, 'too_quiet', 'I did not hear enough voice. Say it a little louder.', metrics);
  }

  let voiceScore = 0;
  if (user.rms >= minRms) voiceScore += 1;
  if (user.peak >= minPeak) voiceScore += 1;
  if (user.activeRatio >= minActiveRatio) voiceScore += 1;
  if (user.loudRatio >= minLoudRatio) voiceScore += 1;
  if (user.maxLoudRunMs >= minLoudRunMs) voiceScore += 1;
  if (user.voicedBins >= minVoicedBins) voiceScore += 1;
  metrics.voiceScore = voiceScore;

  if (voiceScore < minVoiceScore) {
    return __pqRepeatQualityResult(false, 'too_quiet', 'I did not hear enough voice. Say it a little louder.', metrics);
  }

  const reference = await __pqRepeatQualityReferenceForKey(key);
  if (!reference) {
    return __pqRepeatQualityResult(true, 'voice_ok', 'Good try!', metrics);
  }

  metrics.reference = reference;

  const maxDurationRatio = Number(__pqRepeatQualityCfg('maxDurationRatio', 3.2) || 3.2);
  const minDurationRatio = Number(__pqRepeatQualityCfg('minDurationRatio', 0.25) || 0.25);
  const durationRatio = reference.durationMs ? user.durationMs / reference.durationMs : 1;
  metrics.durationRatio = durationRatio;

  if (durationRatio > maxDurationRatio) {
    return __pqRepeatQualityResult(false, 'too_long', 'That was a little long. Try the letter again.', metrics);
  }

  if (durationRatio < minDurationRatio) {
    return __pqRepeatQualityResult(false, 'too_short_for_reference', 'Hold the sound a little longer.', metrics);
  }

  const envelopeDiff = __pqRepeatQualityEnvelopeDiff(user.envelope, reference.envelope);
  metrics.envelopeDiff = envelopeDiff;

  const maxEnvelopeDiff = Number(__pqRepeatQualityCfg('maxEnvelopeDiff', 0.75) || 0.75);
  if (envelopeDiff != null && envelopeDiff > maxEnvelopeDiff) {
    return __pqRepeatQualityResult(false, 'rough_shape_mismatch', 'Try again and copy the sound you heard.', metrics);
  }

  return __pqRepeatQualityResult(true, 'ok', 'Good try!', metrics);
}
