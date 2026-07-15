(function () {
  const state = {
    zip: null,
    manifest: null,
    audioUrls: new Map(),
    mediaUrls: new Map(),
    sceneIndex: 0,
    currentAudio: null,
    playToken: 0
  };

  const $ = (id) => document.getElementById(id);

  function setStatus(message, isError) {
    const el = $('importStatus');
    el.textContent = message;
    el.style.color = isError ? '#9b1c1c' : '';
  }

  function sanitizeSceneTitle(title, fallback) {
    return String(title || fallback || 'Scene').trim();
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  async function loadZip(file) {
    if (!window.JSZip) {
      throw new Error('JSZip did not load. Check internet access or bundle JSZip locally.');
    }

    const zip = await window.JSZip.loadAsync(file);
    const manifestFile = zip.file('manifest.json');
    if (!manifestFile) throw new Error('This ZIP has no manifest.json. Export it using OpenMAIC Classroom ZIP.');

    const manifest = JSON.parse(await manifestFile.async('string'));
    if (!Array.isArray(manifest.scenes)) throw new Error('manifest.json does not contain scenes.');

    state.zip = zip;
    state.manifest = manifest;
    state.audioUrls.clear();
    state.mediaUrls.clear();
    state.sceneIndex = 0;

    await preloadMedia(zip, manifest);
    renderPlayer();
  }

  async function preloadMedia(zip, manifest) {
    const entries = Object.keys(manifest.mediaIndex || {});
    for (const path of entries) {
      const file = zip.file(path);
      if (!file) continue;
      const info = manifest.mediaIndex[path] || {};
      const blob = await file.async('blob');
      const url = URL.createObjectURL(blob);
      if (info.type === 'audio' || path.startsWith('audio/')) state.audioUrls.set(path, url);
      else state.mediaUrls.set(path, url);
    }
  }

  function renderPlayer() {
    const manifest = state.manifest;
    $('classroomTitle').textContent = manifest.stage?.name || 'Imported OpenMAIC Classroom';
    $('player').hidden = false;

    const buttons = $('sceneButtons');
    buttons.innerHTML = '';
    manifest.scenes.forEach((scene, index) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = `${index + 1}. ${sanitizeSceneTitle(scene.title, 'Scene')}`;
      btn.className = index === state.sceneIndex ? 'is-active' : '';
      btn.addEventListener('click', () => showScene(index));
      buttons.appendChild(btn);
    });

    showScene(state.sceneIndex);
    setStatus(`Loaded ${manifest.scenes.length} scene(s).`);
  }

  function showScene(index) {
    const scenes = state.manifest?.scenes || [];
    if (!scenes.length) return;
    state.sceneIndex = Math.max(0, Math.min(index, scenes.length - 1));
    stopAudio();

    document.querySelectorAll('.scene-buttons button').forEach((btn, i) => {
      btn.classList.toggle('is-active', i === state.sceneIndex);
    });

    const scene = scenes[state.sceneIndex];
    $('sceneCounter').textContent = `${state.sceneIndex + 1} / ${scenes.length}`;
    $('sceneType').textContent = scene.type || 'Scene';
    $('sceneTitle').textContent = sanitizeSceneTitle(scene.title, `Scene ${state.sceneIndex + 1}`);
    renderSceneCanvas(scene);
    renderSpeechPanel(scene);
  }

  function renderSceneCanvas(scene) {
    const canvas = $('sceneCanvas');
    canvas.innerHTML = '';

    if (scene.content?.type === 'interactive' && scene.content.html) {
      const frame = document.createElement('iframe');
      frame.className = 'interactive-frame';
      frame.setAttribute('sandbox', 'allow-scripts allow-forms allow-pointer-lock allow-popups allow-modals');
      frame.srcdoc = scene.content.html;
      canvas.appendChild(frame);
      return;
    }

    if (scene.content?.type === 'slide' && scene.content.canvas) {
      canvas.appendChild(renderSlideScene(scene.content.canvas));
      return;
    }

    const fallback = document.createElement('div');
    fallback.className = 'fallback-scene';
    fallback.innerHTML = [
      '<p>This scene is not an embedded interactive HTML scene. Its OpenMAIC data is shown below.</p>',
      `<pre>${escapeHtml(JSON.stringify(scene.content || scene, null, 2))}</pre>`
    ].join('');
    canvas.appendChild(fallback);
  }

  function renderSlideScene(slide) {
    const baseWidth = Number(slide.viewportSize || 1000);
    const ratio = Number(slide.viewportRatio || 0.5625);
    const baseHeight = Math.max(1, baseWidth * ratio);
    const stage = document.createElement('div');
    stage.className = 'slide-stage';

    const board = document.createElement('div');
    board.className = 'slide-board';
    board.style.aspectRatio = `${baseWidth} / ${baseHeight}`;
    board.style.background = slide.theme?.backgroundColor || '#ffffff';
    board.style.color = slide.theme?.fontColor || '#222222';

    (slide.elements || []).forEach((element) => {
      const rendered = renderSlideElement(element, baseWidth, baseHeight, slide);
      if (rendered) board.appendChild(rendered);
    });

    stage.appendChild(board);
    return stage;
  }

  function renderSlideElement(element, baseWidth, baseHeight, slide) {
    const box = {
      left: Number(element.left || 0),
      top: Number(element.top || 0),
      width: Number(element.width || 0),
      height: Number(element.height || 0)
    };
    const wrap = document.createElement('div');
    wrap.className = `slide-el slide-el-${escapeClassName(element.type || 'item')}`;
    positionSlideElement(wrap, box, baseWidth, baseHeight);
    if (element.rotate) wrap.style.transform = `rotate(${Number(element.rotate) || 0}deg)`;

    if (element.type === 'image') {
      const img = document.createElement('img');
      img.alt = '';
      img.draggable = false;
      img.src = mediaUrlForSource(element.src) || element.url || '';
      if (!img.src) {
        wrap.classList.add('is-missing-media');
        wrap.textContent = 'Image';
      } else {
        wrap.appendChild(img);
      }
      return wrap;
    }

    if (element.type === 'shape' && element.path) {
      wrap.appendChild(renderSvgShape(element));
      return wrap;
    }

    if (element.type === 'latex') {
      wrap.classList.add('slide-rich-text');
      wrap.style.color = element.color || slide.theme?.fontColor || '#222';
      wrap.innerHTML = sanitizeRichHtml(element.html || latexToFallback(element.latex));
      return wrap;
    }

    if (element.type === 'text' || element.content) {
      wrap.classList.add('slide-rich-text');
      if (element.fill) wrap.style.background = element.fill;
      wrap.style.color = element.defaultColor || slide.theme?.fontColor || '#222';
      wrap.style.fontFamily = fontStack(element.defaultFontName || slide.theme?.fontName);
      wrap.innerHTML = sanitizeRichHtml(element.content || '');
      return wrap;
    }

    if (element.path) {
      wrap.appendChild(renderSvgShape(element));
      return wrap;
    }

    return null;
  }

  function positionSlideElement(el, box, baseWidth, baseHeight) {
    el.style.left = `${(box.left / baseWidth) * 100}%`;
    el.style.top = `${(box.top / baseHeight) * 100}%`;
    el.style.width = `${(box.width / baseWidth) * 100}%`;
    el.style.height = `${(box.height / baseHeight) * 100}%`;
  }

  function renderSvgShape(element) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const viewBox = Array.isArray(element.viewBox) ? element.viewBox : [1, 1];
    svg.setAttribute('viewBox', `0 0 ${Number(viewBox[0]) || 1} ${Number(viewBox[1]) || 1}`);
    svg.setAttribute('preserveAspectRatio', element.fixedRatio ? 'xMidYMid meet' : 'none');
    svg.setAttribute('aria-hidden', 'true');

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', element.path);
    path.setAttribute('fill', element.fill || 'transparent');
    if (element.outline?.color) {
      path.setAttribute('stroke', element.outline.color);
      path.setAttribute('stroke-width', element.outline.width || 1);
    }
    svg.appendChild(path);
    return svg;
  }

  function mediaUrlForSource(src) {
    if (!src) return '';
    if (state.mediaUrls.has(src)) return state.mediaUrls.get(src);
    const clean = String(src).replace(/^media\//, '').replace(/\.(png|jpe?g|gif|webp|svg)$/i, '');
    for (const [path, url] of state.mediaUrls.entries()) {
      const name = path.split('/').pop() || path;
      const stem = name.replace(/\.[^.]+$/, '');
      if (path === src || name === src || stem === clean) return url;
    }
    return '';
  }

  function sanitizeRichHtml(html) {
    const template = document.createElement('template');
    template.innerHTML = String(html || '');
    template.content.querySelectorAll('script, iframe, object, embed, link, meta').forEach((node) => node.remove());
    template.content.querySelectorAll('*').forEach((node) => {
      [...node.attributes].forEach((attr) => {
        if (/^on/i.test(attr.name)) node.removeAttribute(attr.name);
        if ((attr.name === 'href' || attr.name === 'src') && /^javascript:/i.test(attr.value)) node.removeAttribute(attr.name);
      });
    });
    return template.innerHTML;
  }

  function latexToFallback(latex) {
    return escapeHtml(String(latex || '').replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1 / $2'));
  }

  function escapeClassName(value) {
    return String(value).toLowerCase().replace(/[^a-z0-9_-]+/g, '-');
  }

  function fontStack(fontName) {
    const name = String(fontName || '').trim();
    if (!name) return '';
    return `"${name}", Inter, ui-sans-serif, system-ui, sans-serif`;
  }

  function renderSpeechPanel(scene) {
    const panel = $('speechPanel');
    const speeches = getSpeechActions(scene);
    if (!speeches.length) {
      panel.innerHTML = '<p class="speech-line">No packaged speech audio found for this scene.</p>';
      return;
    }

    panel.innerHTML = '';
    speeches.forEach((action, index) => {
      const line = document.createElement('div');
      line.className = 'speech-line';
      line.dataset.speechIndex = String(index);
      line.textContent = action.text || action.content || `Speech ${index + 1}`;
      panel.appendChild(line);
    });
  }

  function getSpeechActions(scene) {
    return (scene.actions || []).filter((action) => action.type === 'speech');
  }

  function audioUrlForAction(action) {
    if (action.audioRef && state.audioUrls.has(action.audioRef)) return state.audioUrls.get(action.audioRef);
    if (action.audioUrl) return action.audioUrl;
    return '';
  }

  async function playSceneAudio() {
    const scene = state.manifest?.scenes?.[state.sceneIndex];
    if (!scene) return;
    const speeches = getSpeechActions(scene);
    if (!speeches.length) {
      setStatus('This scene has no speech actions/audio.', true);
      return;
    }

    const token = ++state.playToken;
    for (let i = 0; i < speeches.length; i++) {
      if (token !== state.playToken) return;
      const url = audioUrlForAction(speeches[i]);
      if (!url) continue;
      markSpeech(i);
      await playAudioUrl(url, token);
    }
    clearSpeechMarks();
  }

  function playAudioUrl(url, token) {
    return new Promise((resolve) => {
      stopCurrentAudioOnly();
      const audio = new Audio(url);
      state.currentAudio = audio;
      audio.onended = resolve;
      audio.onerror = resolve;
      audio.play().catch((err) => {
        setStatus(`Audio could not play: ${err.message || err}`, true);
        resolve();
      });
      const check = setInterval(() => {
        if (token !== state.playToken) {
          clearInterval(check);
          resolve();
        }
      }, 120);
    });
  }

  function markSpeech(index) {
    document.querySelectorAll('.speech-line').forEach((line) => {
      line.classList.toggle('is-playing', line.dataset.speechIndex === String(index));
    });
  }

  function clearSpeechMarks() {
    document.querySelectorAll('.speech-line').forEach((line) => line.classList.remove('is-playing'));
  }

  function stopCurrentAudioOnly() {
    if (!state.currentAudio) return;
    state.currentAudio.pause();
    state.currentAudio.currentTime = 0;
    state.currentAudio = null;
  }

  function stopAudio() {
    state.playToken++;
    stopCurrentAudioOnly();
    clearSpeechMarks();
  }

  function bindEvents() {
    const input = $('zipInput');
    input.addEventListener('change', async () => {
      const file = input.files && input.files[0];
      if (!file) return;
      setStatus('Loading classroom...');
      try {
        await loadZip(file);
      } catch (err) {
        setStatus(err.message || String(err), true);
      }
    });

    const dropZone = $('dropZone');
    dropZone.addEventListener('dragover', (event) => {
      event.preventDefault();
      dropZone.classList.add('is-dragover');
    });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('is-dragover'));
    dropZone.addEventListener('drop', async (event) => {
      event.preventDefault();
      dropZone.classList.remove('is-dragover');
      const file = event.dataTransfer?.files?.[0];
      if (!file) return;
      setStatus('Loading classroom...');
      try {
        await loadZip(file);
      } catch (err) {
        setStatus(err.message || String(err), true);
      }
    });

    $('prevScene').addEventListener('click', () => showScene(state.sceneIndex - 1));
    $('nextScene').addEventListener('click', () => showScene(state.sceneIndex + 1));
    $('playAudio').addEventListener('click', playSceneAudio);
    $('stopAudio').addEventListener('click', stopAudio);
  }

  document.addEventListener('DOMContentLoaded', bindEvents);
})();
