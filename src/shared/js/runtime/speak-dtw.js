/*
  Shared Speak DTW comparison engine.
  Lightweight in-browser pronunciation check for short letter recordings.
*/
(function () {
  const PQ_DTW_AUDIO_CONTEXT = { value: null };

  function getAudioContext() {
    if (PQ_DTW_AUDIO_CONTEXT.value) return PQ_DTW_AUDIO_CONTEXT.value;
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    PQ_DTW_AUDIO_CONTEXT.value = new Ctor();
    return PQ_DTW_AUDIO_CONTEXT.value;
  }

  function clamp(value, min, max) {
    value = Number(value || 0) || 0;
    return Math.max(min, Math.min(max, value));
  }

  function toMono(buffer) {
    const length = buffer.length || 0;
    const channels = Math.max(1, buffer.numberOfChannels || 1);
    const out = new Float32Array(length);

    for (let c = 0; c < channels; c += 1) {
      const data = buffer.getChannelData(c);
      for (let i = 0; i < length; i += 1) out[i] += data[i] / channels;
    }

    return out;
  }

  function resampleLinear(input, inRate, outRate) {
    if (!input || !input.length) return new Float32Array(0);
    if (!inRate || !outRate || Math.abs(inRate - outRate) < 1) return input;

    const ratio = inRate / outRate;
    const length = Math.max(1, Math.floor(input.length / ratio));
    const out = new Float32Array(length);

    for (let i = 0; i < length; i += 1) {
      const pos = i * ratio;
      const left = Math.floor(pos);
      const right = Math.min(input.length - 1, left + 1);
      const frac = pos - left;
      out[i] = input[left] * (1 - frac) + input[right] * frac;
    }

    return out;
  }

  function trimSilence(samples, threshold, padding) {
    if (!samples || !samples.length) return samples || new Float32Array(0);
    threshold = threshold || 0.012;
    padding = padding || 120;

    let start = 0;
    let end = samples.length - 1;

    while (start < samples.length && Math.abs(samples[start]) < threshold) start += 1;
    while (end > start && Math.abs(samples[end]) < threshold) end -= 1;

    start = Math.max(0, start - padding);
    end = Math.min(samples.length - 1, end + padding);

    return samples.slice(start, end + 1);
  }

  function zcr(samples, start, end) {
    let crossings = 0;
    let last = samples[start] || 0;
    for (let i = start + 1; i < end; i += 1) {
      const cur = samples[i] || 0;
      if ((last < 0 && cur >= 0) || (last >= 0 && cur < 0)) crossings += 1;
      last = cur;
    }
    return crossings / Math.max(1, end - start);
  }

  function meanAbsDelta(samples, start, end) {
    let sum = 0;
    let last = samples[start] || 0;
    for (let i = start + 1; i < end; i += 1) {
      const cur = samples[i] || 0;
      sum += Math.abs(cur - last);
      last = cur;
    }
    return sum / Math.max(1, end - start);
  }

  function extractFeatures(samples, options) {
    options = options || {};
    const sampleRate = Number(options.sampleRate || 8000) || 8000;
    const frameMs = Number(options.frameMs || 32) || 32;
    const hopMs = Number(options.hopMs || 16) || 16;
    const frame = Math.max(64, Math.floor(sampleRate * frameMs / 1000));
    const hop = Math.max(32, Math.floor(sampleRate * hopMs / 1000));
    const features = [];

    if (!samples || samples.length < frame) return features;

    let maxRms = 0.0001;
    const raw = [];

    for (let start = 0; start + frame <= samples.length; start += hop) {
      let sumSq = 0;
      let peak = 0;
      for (let i = start; i < start + frame; i += 1) {
        const v = samples[i] || 0;
        sumSq += v * v;
        peak = Math.max(peak, Math.abs(v));
      }

      const rms = Math.sqrt(sumSq / frame);
      maxRms = Math.max(maxRms, rms);
      raw.push({
        rms,
        peak,
        zcr: zcr(samples, start, start + frame),
        delta: meanAbsDelta(samples, start, start + frame)
      });
    }

    raw.forEach(function (item) {
      features.push([
        clamp(item.rms / maxRms, 0, 1),
        clamp(item.peak, 0, 1),
        clamp(item.zcr * 30, 0, 1),
        clamp(item.delta * 42, 0, 1)
      ]);
    });

    return features;
  }

  function sliceVowelRegion(samples, sampleRate, options) {
    if (!samples || !samples.length) return new Float32Array(0);
    const windowMs = Number(options.vowelWindowMs || 350) || 350;
    const windowSize = Math.max(128, Math.floor(sampleRate * windowMs / 1000));
    const minSize = Math.min(samples.length, windowSize);
    const region = String(options.vowelRegion || 'tail').toLowerCase();

    let start = 0;
    if (region === 'middle') {
      start = Math.floor((samples.length - minSize) / 2);
    } else if (region === 'head') {
      start = 0;
    } else {
      start = Math.max(0, samples.length - minSize);
    }

    return samples.slice(start, Math.min(samples.length, start + minSize));
  }

  function goertzelPower(samples, sampleRate, frequency) {
    if (!samples || !samples.length || !frequency) return 0;
    const normalized = frequency / sampleRate;
    const coeff = 2 * Math.cos(2 * Math.PI * normalized);
    let s0 = 0;
    let s1 = 0;
    let s2 = 0;

    for (let i = 0; i < samples.length; i += 1) {
      s0 = (samples[i] || 0) + coeff * s1 - s2;
      s2 = s1;
      s1 = s0;
    }

    return Math.max(0, s1 * s1 + s2 * s2 - coeff * s1 * s2);
  }

  function vowelShapeVector(samples, sampleRate, options) {
    const region = sliceVowelRegion(samples, sampleRate, options);
    if (!region.length) return [];

    const centers = Array.isArray(options.vowelBandCenters) && options.vowelBandCenters.length
      ? options.vowelBandCenters
      : [320, 500, 700, 950, 1250, 1650, 2150, 2850];

    const raw = centers.map(function (frequency) {
      return Math.log(1 + goertzelPower(region, sampleRate, Number(frequency || 0)));
    });

    const mean = raw.reduce(function (sum, value) { return sum + value; }, 0) / Math.max(1, raw.length);
    let variance = 0;
    raw.forEach(function (value) {
      const d = value - mean;
      variance += d * d;
    });

    const std = Math.sqrt(variance / Math.max(1, raw.length)) || 1;
    return raw.map(function (value) {
      return (value - mean) / std;
    });
  }

  function vectorDistance(a, b) {
    if (!a.length || !b.length) return Infinity;
    let sum = 0;
    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i += 1) {
      const d = (a[i] || 0) - (b[i] || 0);
      sum += d * d;
    }
    return Math.sqrt(sum / Math.max(1, len));
  }

  function compareVowelShape(referenceSamples, studentSamples, sampleRate, options) {
    const ref = vowelShapeVector(referenceSamples, sampleRate, options);
    const student = vowelShapeVector(studentSamples, sampleRate, options);
    if (!ref.length || !student.length) {
      return { passed: false, score: 0, reason: 'vowel_shape_unavailable' };
    }

    const distance = vectorDistance(ref, student);
    const scale = Number(options.vowelDistanceScale || 0.62) || 0.62;
    const score = clamp(1 - (distance * scale), 0, 1);
    const minScore = Number(options.vowelMinScore || options.vowelShapeMinScore || 0.58) || 0.58;

    return {
      passed: score >= minScore,
      score,
      distance,
      reason: score >= minScore ? 'vowel_shape_pass' : 'vowel_shape_mismatch'
    };
  }

  function featureDistance(a, b) {
    let sum = 0;
    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i += 1) {
      const d = (a[i] || 0) - (b[i] || 0);
      sum += d * d;
    }
    return Math.sqrt(sum / Math.max(1, len));
  }

  function dtwDistance(a, b, bandRatio) {
    const n = a.length;
    const m = b.length;
    if (!n || !m) return Infinity;

    const band = Math.max(4, Math.ceil(Math.max(n, m) * (Number(bandRatio || 0.32) || 0.32)));
    const prev = new Float32Array(m + 1);
    const curr = new Float32Array(m + 1);
    for (let j = 0; j <= m; j += 1) prev[j] = Infinity;
    prev[0] = 0;

    for (let i = 1; i <= n; i += 1) {
      curr[0] = Infinity;
      const jStart = Math.max(1, i - band);
      const jEnd = Math.min(m, i + band);

      for (let j = 1; j < jStart; j += 1) curr[j] = Infinity;

      for (let j = jStart; j <= jEnd; j += 1) {
        const cost = featureDistance(a[i - 1], b[j - 1]);
        curr[j] = cost + Math.min(prev[j], curr[j - 1], prev[j - 1]);
      }

      for (let j = jEnd + 1; j <= m; j += 1) curr[j] = Infinity;

      for (let j = 0; j <= m; j += 1) prev[j] = curr[j];
    }

    return prev[m] / Math.max(1, n + m);
  }

  async function decodeArrayBuffer(arrayBuffer) {
    const ctx = getAudioContext();
    if (!ctx) throw new Error('AudioContext unavailable');
    return await ctx.decodeAudioData(arrayBuffer.slice(0));
  }

  async function decodeUrl(url) {
    const response = await fetch(url, { cache: 'force-cache' });
    if (!response.ok) throw new Error('Reference audio failed: ' + response.status);
    return decodeArrayBuffer(await response.arrayBuffer());
  }

  async function decodeBlob(blob) {
    return decodeArrayBuffer(await blob.arrayBuffer());
  }

  function prepareSamples(buffer, options) {
    const targetRate = Number(options.sampleRate || 8000) || 8000;
    let samples = toMono(buffer);
    samples = resampleLinear(samples, buffer.sampleRate || targetRate, targetRate);
    samples = trimSilence(samples, Number(options.silenceThreshold || 0.012) || 0.012, Math.floor(targetRate * 0.015));
    return { samples, sampleRate: targetRate };
  }

  function prepareFeatures(buffer, options) {
    const prepared = prepareSamples(buffer, options);
    return extractFeatures(prepared.samples, Object.assign({}, options, { sampleRate: prepared.sampleRate }));
  }

  async function compare(options) {
    options = options || {};
    const referenceUrl = String(options.referenceUrl || '').trim();
    const studentBlob = options.studentBlob || null;
    if (!referenceUrl || !studentBlob) {
      return { passed: false, score: 0, reason: 'missing_audio' };
    }

    const refBuffer = await decodeUrl(referenceUrl);
    const studentBuffer = await decodeBlob(studentBlob);
    const refPrepared = prepareSamples(refBuffer, options);
    const studentPrepared = prepareSamples(studentBuffer, options);
    const refFeatures = extractFeatures(refPrepared.samples, Object.assign({}, options, { sampleRate: refPrepared.sampleRate }));
    const studentFeatures = extractFeatures(studentPrepared.samples, Object.assign({}, options, { sampleRate: studentPrepared.sampleRate }));

    const minFrames = Number(options.minFrames || 5) || 5;
    if (refFeatures.length < minFrames || studentFeatures.length < minFrames) {
      return { passed: false, score: 0, reason: 'not_enough_voice' };
    }

    const dist = dtwDistance(refFeatures, studentFeatures, options.bandRatio);
    const distanceScale = Number(options.distanceScale || 2.7) || 2.7;
    const score = clamp(1 - (dist * distanceScale), 0, 1);
    const minScore = Number(options.minScore || 0.58) || 0.58;

    let passed = score >= minScore;
    let reason = passed ? 'dtw_pass' : 'dtw_retry';
    let vowel = null;

    if (options.requireVowelShape === true || options.requireHarakahShape === true) {
      vowel = compareVowelShape(refPrepared.samples, studentPrepared.samples, refPrepared.sampleRate, options);
      if (!vowel.passed) {
        passed = false;
        reason = vowel.reason || 'vowel_shape_mismatch';
      }
    }

    return {
      passed,
      score,
      distance: dist,
      reason,
      vowel,
      referenceFrames: refFeatures.length,
      studentFrames: studentFeatures.length
    };
  }

  window.PQSpeakDtw = {
    compare
  };
})();
