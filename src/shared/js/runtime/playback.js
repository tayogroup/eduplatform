/*
  Pre-Quraan Alphabet runtime fragment: playback.js
  Playlist playback, Watch/Sound/Listen+/Words/Repeat/Match flows, and playing-tile effects.
  This file is assembled with the other runtime fragments by tools/build-unit-runtime-bundle.js.
  It is intentionally not loaded directly in the browser.
*/
  let __pqRulesHighlightAudio = null;
  let __pqRulesHighlightIndex = -1;
  let __pqRulesHighlightPaused = null;
  let __pqRulesHighlightTimer = 0;
  let __pqRulesCueAudioSrc = '';
  let __pqRulesCueData = null;
  const __pqRulesCueCache = Object.create(null);

  function __pqRulesCueUrl(audio) {
    try {
      const src = String((audio && audio.currentSrc) || (audio && audio.src) || '');
      if (!src) return '';
      return src.replace(/\.(mp3|wav|m4a|ogg)(\?.*)?$/i, '.cues.json$2');
    } catch (_e) {
      return '';
    }
  }

  function __pqLoadRulesCues(audio) {
    try {
      if (window.__pqRulesBlockOnlyHighlight) {
        __pqRulesCueAudioSrc = '';
        __pqRulesCueData = null;
        return;
      }
      const src = String((audio && audio.currentSrc) || (audio && audio.src) || '');
      const url = __pqRulesCueUrl(audio);
      if (!src || !url || __pqRulesCueAudioSrc === src) return;

      __pqRulesCueAudioSrc = src;
      __pqRulesCueData = null;
      if (__pqRulesCueCache[url]) {
        __pqRulesCueData = __pqRulesCueCache[url];
        return;
      }

      fetch(url, { cache: 'no-store' })
        .then(function (res) {
          if (!res || !res.ok) return null;
          return res.json();
        })
        .then(function (json) {
          if (!json || !Array.isArray(json.cues)) return;
          __pqRulesCueCache[url] = json;
          if (__pqRulesCueAudioSrc === src) {
            __pqRulesCueData = json;
            __pqSyncRulesHighlight();
          }
        })
        .catch(function () {});
    } catch (_e) {}
  }

  function __pqVisibleRulesSections() {
    try {
      const panels = Array.from(document.querySelectorAll('section[class*="-rules"], div[class*="-rules"]')).filter(function (panel) {
        if (!panel || panel.hidden) return false;
        const style = window.getComputedStyle(panel);
        return style.display !== 'none' && style.visibility !== 'hidden';
      });
      const panel = panels.find(function (item) {
        return item.querySelector('article[class*="-rule-card"]');
      }) || panels[0] || null;
      if (!panel) return [];

      const selector = [
        '[class*="-rules__hero"]',
        '[class*="-rules__summary"]',
        '[data-rules-subsection="true"]',
        'article[class*="-rule-card"]',
        '[class*="-rules__combo-wrap"]',
        '[class*="-rules__table"]',
        '[class*="-rules__practice"]',
        '[class*="-rules__remember"]'
      ].join(',');

      return Array.from(panel.querySelectorAll(selector)).filter(function (section) {
        if (!section || section.hidden) return false;
        const style = window.getComputedStyle(section);
        if (style.display === 'none' || style.visibility === 'hidden') return false;
        if (section.matches('[class*="-rules__summary"]') && section.querySelector('article[class*="-rule-card"]')) return false;
        return true;
      });
    } catch (_e) {
      return [];
    }
  }

  function __pqRulesSectionWeight(section) {
    try {
      const text = String((section && section.innerText) || '').replace(/\s+/g, ' ').trim();
      const len = text.length || 1;
      if (section.matches('[data-rules-subsection="true"]')) return Math.max(18, Math.min(45, len / 4.5));
      if (section.matches('article[class*="-rule-card"]')) return Math.max(22, Math.min(70, len / 4));
      if (section.matches('[class*="-rules__hero"]')) return Math.max(18, Math.min(55, len / 5));
      if (section.matches('[class*="-rules__practice"]')) return Math.max(28, Math.min(90, len / 4));
      if (section.matches('[class*="-rules__remember"]')) return Math.max(18, Math.min(60, len / 4.5));
      return Math.max(12, Math.min(55, len / 5));
    } catch (_e) {
      return 20;
    }
  }

  function __pqCueText(value) {
    return String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
  }

  function __pqCueComparable(value) {
    return __pqCueText(value)
      .replace(/[.,;:!?"'،؛؟]+$/g, '')
      .replace(/^[.,;:!?"'،؛؟]+/g, '')
      .toLowerCase();
  }

  function __pqRulesTokenParts(text) {
    try {
      const parts = [];
      String(text || '').split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        parts.push({ text: part, word: !/^\s+$/.test(part) });
      });
      return parts;
    } catch (_e) {
      return [];
    }
  }

  function __pqPrepareRulesCueWords(root) {
    try {
      const scope = root || document;
      const selector = 'p, h3, h4, li, span:not(.pq-rules-cue-word):not(.pq-tan-chip)';
      Array.from(scope.querySelectorAll(selector)).forEach(function (node) {
        if (!node || node.dataset.pqCueTokenized === '1') return;
        if (node.closest('button, audio, video, script, style')) return;
        if (node.querySelector('.pq-rules-cue-word')) return;
        const textNodes = Array.from(node.childNodes).filter(function (child) {
          return child && child.nodeType === Node.TEXT_NODE && __pqCueText(child.nodeValue);
        });
        if (!textNodes.length) {
          node.dataset.pqCueTokenized = '1';
          return;
        }
        textNodes.forEach(function (textNode) {
          const frag = document.createDocumentFragment();
          __pqRulesTokenParts(textNode.nodeValue).forEach(function (part) {
            if (!part.word) {
              frag.appendChild(document.createTextNode(part.text));
              return;
            }
            const span = document.createElement('span');
            span.className = 'pq-rules-cue-word';
            span.dataset.cueText = __pqCueComparable(part.text);
            span.textContent = part.text;
            frag.appendChild(span);
          });
          textNode.parentNode.replaceChild(frag, textNode);
        });
        node.dataset.pqCueTokenized = '1';
      });
    } catch (_e) {}
  }
  function __pqVisibleRulesExampleNodes(root) {
    try {
      const scope = root || document;
      return Array.from(scope.querySelectorAll('span, small, em, b, strong, h3, h4, li')).filter(function (node) {
        if (!node || node.hidden) return false;
        if (node.querySelector('.pq-rules-cue-word')) return false;
        const text = __pqCueText(node.textContent);
        if (!text || text.length > 80) return false;
        const style = window.getComputedStyle(node);
        return style.display !== 'none' && style.visibility !== 'hidden';
      });
    } catch (_e) {
      return [];
    }
  }

  function __pqClearRulesCueHighlights() {
    try {
      Array.from(document.querySelectorAll('.pq-rules-current-cue')).forEach(function (node) {
        node.classList.remove('pq-rules-current-cue');
        node.removeAttribute('aria-current');
      });
      Array.from(document.querySelectorAll('.pq-rules-current-phrase')).forEach(function (node) {
        node.classList.remove('pq-rules-current-phrase');
        node.removeAttribute('aria-current');
      });
    } catch (_e) {}
  }

  function __pqFindCueSection(cue, sections) {
    try {
      if (!cue || !sections || !sections.length) return null;
      const sectionKey = String(cue.section || cue.target || '').toLowerCase();
      if (sectionKey === 'hero' || sectionKey === 'intro') {
        return sections.find(function (section) { return section.matches('[class*="-rules__hero"]'); }) || null;
      }
      const ruleMatch = sectionKey.match(/rule[-_\s]*(\d+)/);
      if (ruleMatch) {
        const n = ruleMatch[1];
        return sections.find(function (section) {
          if (!section.matches('article[class*="-rule-card"]')) return false;
          const marker = section.querySelector('[class*="__num"], [class*="__badge"]');
          return marker && __pqCueText(marker.textContent).replace(/^rule\s+/i, '') === n;
        }) || null;
      }
      if (sectionKey === 'practice') {
        return sections.find(function (section) { return section.matches('[class*="-rules__practice"]'); }) || null;
      }
      if (sectionKey === 'remember') {
        return sections.find(function (section) { return section.matches('[class*="-rules__remember"]'); }) || null;
      }
    } catch (_e) {}
    return null;
  }

  function __pqCueOccurrenceIndex(cue, comparableNeedle) {
    try {
      if (!cue || !__pqRulesCueData || !Array.isArray(__pqRulesCueData.cues)) return 0;
      const section = String(cue.section || '').toLowerCase();
      const cueOffset = Number(cue.offset);
      let count = 0;
      for (const item of __pqRulesCueData.cues) {
        if (!item || String(item.type || '').toLowerCase() === 'section') continue;
        if (section && String(item.section || '').toLowerCase() !== section) continue;
        if (__pqCueComparable(item.text) !== comparableNeedle) continue;
        const itemOffset = Number(item.offset);
        if (Number.isFinite(cueOffset) && Number.isFinite(itemOffset) && itemOffset > cueOffset) break;
        count += 1;
        if (item === cue) break;
      }
      return Math.max(0, count - 1);
    } catch (_e) {
      return 0;
    }
  }

  function __pqFindCueNodes(cue, section) {
    try {
      const needles = [cue.text, cue.arabic, cue.transliteration, cue.label]
        .map(__pqCueText)
        .filter(Boolean);
      if (!needles.length) return [];
      __pqPrepareRulesCueWords(section || document);
      const scope = section || document;
      const exactTokenNodes = Array.from(scope.querySelectorAll('.pq-rules-cue-word')).filter(function (node) {
        if (!node || node.hidden) return false;
        const style = window.getComputedStyle(node);
        return style.display !== 'none' && style.visibility !== 'hidden';
      });

      for (const needle of needles) {
        const comparableNeedle = __pqCueComparable(needle);
        if (!comparableNeedle) continue;
        const exactMatches = exactTokenNodes.filter(function (node) {
          return node.dataset && node.dataset.cueText === comparableNeedle;
        });
        if (exactMatches.length) {
          const index = Math.min(__pqCueOccurrenceIndex(cue, comparableNeedle), exactMatches.length - 1);
          return [exactMatches[index]];
        }
      }

      const haystack = __pqVisibleRulesExampleNodes(scope);
      const fallback = haystack.filter(function (node) {
        const value = __pqCueText(node.textContent);
        const comparableValue = node.dataset && node.dataset.cueText ? node.dataset.cueText : __pqCueComparable(value);
        return needles.some(function (needle) {
          const comparableNeedle = __pqCueComparable(needle);
          if (!comparableNeedle) return false;
          if (comparableNeedle.length <= 2) return comparableValue === comparableNeedle;
          return value === needle ||
            comparableValue === comparableNeedle ||
            comparableValue.indexOf(comparableNeedle) !== -1;
        });
      });
      return fallback.length ? [fallback[0]] : [];
    } catch (_e) {
      return [];
    }
  }

  function __pqFindCuePhraseNodes(cue, section) {
    try {
      const needle = __pqCueComparable(cue && cue.text);
      if (!needle) return [];
      const scope = section || document;
      const nodes = Array.from(scope.querySelectorAll('p, h3, h4, li, span')).filter(function (node) {
        if (!node || node.hidden) return false;
        if (node.closest('button, audio, video, script, style')) return false;
        const style = window.getComputedStyle(node);
        if (style.display === 'none' || style.visibility === 'hidden') return false;
        const value = __pqCueComparable(node.textContent);
        if (!value) return false;
        return value === needle || value.indexOf(needle) !== -1 || needle.indexOf(value) !== -1;
      });
      return nodes.length ? [nodes[0]] : [];
    } catch (_e) {
      return [];
    }
  }

  function __pqActiveRulesCue(currentTime) {
    try {
      const cues = (__pqRulesCueData && Array.isArray(__pqRulesCueData.cues)) ? __pqRulesCueData.cues : [];
      return cues.find(function (cue) {
        if (String(cue.type || '').toLowerCase() === 'section') return false;
        const start = Number(cue.start);
        const end = Number(cue.end);
        return Number.isFinite(start) && Number.isFinite(end) && currentTime >= start && currentTime < end;
      }) || null;
    } catch (_e) {
      return null;
    }
  }

  function __pqRulesHighlightDelaySeconds() {
    try {
      if (!__pqRulesCueData) return 0;
      const explicit = Number(__pqRulesCueData.highlightDelaySeconds);
      if (Number.isFinite(explicit) && explicit >= 0) return explicit;
      const provider = String(__pqRulesCueData.provider || '').toLowerCase();
      return provider.indexOf('local-silence') !== -1 ? 0.45 : 0;
    } catch (_e) {
      return 0;
    }
  }

  function __pqActiveRulesSectionCue(currentTime) {
    try {
      const adjustedTime = Math.max(0, Number(currentTime || 0) - __pqRulesHighlightDelaySeconds());
      const sectionCues = (__pqRulesCueData && Array.isArray(__pqRulesCueData.sectionCues))
        ? __pqRulesCueData.sectionCues
        : ((__pqRulesCueData && Array.isArray(__pqRulesCueData.cues)) ? __pqRulesCueData.cues.filter(function (cue) {
          return String(cue.type || '').toLowerCase() === 'section';
        }) : []);
      return sectionCues.find(function (cue) {
        const start = Number(cue.start);
        const end = Number(cue.end);
        return Number.isFinite(start) && Number.isFinite(end) && adjustedTime >= start && adjustedTime < end;
      }) || null;
    } catch (_e) {
      return null;
    }
  }

  function __pqActiveRulesUtteranceCue(currentTime) {
    try {
      const adjustedTime = Math.max(0, Number(currentTime || 0) - __pqRulesHighlightDelaySeconds());
      const utteranceCues = (__pqRulesCueData && Array.isArray(__pqRulesCueData.utteranceCues))
        ? __pqRulesCueData.utteranceCues
        : [];
      return utteranceCues.find(function (cue) {
        const start = Number(cue.start);
        const end = Number(cue.end);
        return Number.isFinite(start) && Number.isFinite(end) && adjustedTime >= start && adjustedTime < end;
      }) || null;
    } catch (_e) {
      return null;
    }
  }

  function __pqRulesWordCuesAreReliable() {
    try {
      if (!__pqRulesCueData) return false;
      const provider = String(__pqRulesCueData.provider || '').toLowerCase();
      if (provider && provider.indexOf('elevenlabs') === -1 && provider.indexOf('forced') === -1) return false;
      return __pqRulesCueData.wordCueReliable === true;
    } catch (_e) {
      return false;
    }
  }

  function __pqClearRulesHighlight() {
    try {
      __pqVisibleRulesSections().forEach(function (section) {
        section.classList.remove('is-current-rule', 'pq-rules-current-section');
        section.removeAttribute('aria-current');
      });
    } catch (_e) {}
    __pqRulesHighlightIndex = -1;
    __pqRulesHighlightPaused = null;
  }

  function __pqSyncRulesHighlight() {
    try {
      const audio = window.__pqRulesAudio || null;
      if (!audio || audio.ended) {
        __pqRulesHighlightAudio = null;
        __pqClearRulesHighlight();
        return;
      }

      const sections = __pqVisibleRulesSections();
      if (!sections.length) {
        __pqClearRulesHighlight();
        return;
      }

      const duration = Number(audio.duration || 0);
      const currentTime = Math.max(0, Number(audio.currentTime || 0));
      const blockOnly = !!window.__pqRulesBlockOnlyHighlight;
      const blockLeadSeconds = blockOnly ? Math.max(0, Number(window.__pqRulesBlockHighlightLeadSeconds || 0)) : 0;
      __pqLoadRulesCues(audio);
      const timelineSections = blockOnly
        ? sections.filter(function (section) { return !section.matches('[data-rules-subsection="true"]'); })
        : sections;
      let manualWindow = null;
      if (blockOnly && Array.isArray(window.__pqRulesManualSectionCues) && window.__pqRulesManualSectionCues.length) {
        const manualCues = window.__pqRulesManualSectionCues
          .map(function (cue) {
            const start = Number(cue && cue.start);
            const section = String((cue && cue.section) || '').toLowerCase();
            return Number.isFinite(start) && section ? { section, start } : null;
          })
          .filter(Boolean)
          .sort(function (a, b) { return a.start - b.start; });
        for (let i = 0; i < manualCues.length; i += 1) {
          const cue = manualCues[i];
          const end = Number(manualCues[i + 1] && manualCues[i + 1].start);
          const cueEnd = Number.isFinite(end)
            ? end
            : (Number.isFinite(duration) && duration > cue.start ? duration : cue.start + 30);
          if (currentTime >= cue.start && currentTime < cueEnd) {
            const sectionNode = timelineSections.find(function (section) {
              return String(section.getAttribute('data-rules-section') || '').toLowerCase() === cue.section;
            }) || null;
            if (sectionNode) manualWindow = { sectionNode, start: cue.start, end: cueEnd };
            break;
          }
        }
      }
      const usableDuration = Number.isFinite(duration) && duration > 0
        ? duration
        : Math.max(timelineSections.length * 22, 1);
      const weights = timelineSections.map(__pqRulesSectionWeight);
      const totalWeight = weights.reduce(function (sum, weight) { return sum + weight; }, 0) || timelineSections.length;
      const progressTime = Math.max(0, Math.min(usableDuration, currentTime + blockLeadSeconds));
      const progressWeight = Math.max(0, Math.min(totalWeight, (progressTime / usableDuration) * totalWeight));
      let cumulative = 0;
      let nextIndex = timelineSections.length - 1;
      let sectionStartWeight = 0;
      for (let i = 0; i < weights.length; i += 1) {
        const before = cumulative;
        cumulative += weights[i];
        if (progressWeight <= cumulative) {
          nextIndex = i;
          sectionStartWeight = before;
          break;
        }
      }
      const isPaused = !!audio.paused;
      const activeCue = blockOnly ? null : __pqActiveRulesCue(currentTime);
      const activeSectionCue = blockOnly ? null : __pqActiveRulesSectionCue(currentTime);
      const activeUtteranceCue = blockOnly ? null : __pqActiveRulesUtteranceCue(currentTime);
      const cueSection = activeSectionCue
        ? __pqFindCueSection(activeSectionCue, sections)
        : (activeUtteranceCue ? __pqFindCueSection(activeUtteranceCue, sections) : (activeCue ? __pqFindCueSection(activeCue, sections) : null));
      if (cueSection) nextIndex = Math.max(0, timelineSections.indexOf(cueSection));

      let activeSection = (manualWindow && manualWindow.sectionNode) || timelineSections[nextIndex] || sections[sections.length - 1];
      if (blockOnly && activeSection && activeSection.querySelector) {
        const childSections = Array.from(activeSection.querySelectorAll('[data-rules-subsection="true"]')).filter(function (section) {
          if (!section || section.hidden) return false;
          const style = window.getComputedStyle(section);
          return style.display !== 'none' && style.visibility !== 'hidden';
        });
        if (childSections.length) {
          const activeWeight = Math.max(1, weights[nextIndex] || __pqRulesSectionWeight(activeSection));
          const localWeight = Math.max(0, progressWeight - sectionStartWeight);
          const introWeight = Math.min(16, Math.max(6, activeWeight * 0.22));
          const childRange = Math.max(1, activeWeight - introWeight);
          const manualRatio = manualWindow && manualWindow.sectionNode === activeSection
            ? Math.max(0, Math.min(1, (currentTime - manualWindow.start) / Math.max(1, manualWindow.end - manualWindow.start)))
            : null;
          if (manualRatio != null && manualRatio > 0.22) {
            const childIndex = Math.max(0, Math.min(childSections.length - 1, Math.floor(((manualRatio - 0.22) / 0.78) * childSections.length)));
            activeSection = childSections[childIndex] || activeSection;
          } else if (manualRatio == null && localWeight > introWeight) {
            const childIndex = Math.max(0, Math.min(childSections.length - 1, Math.floor(((localWeight - introWeight) / childRange) * childSections.length)));
            activeSection = childSections[childIndex] || activeSection;
          }
        }
      }
      const activeIndex = Math.max(0, sections.indexOf(activeSection));

      if (__pqRulesHighlightAudio !== audio || __pqRulesHighlightIndex !== activeIndex || __pqRulesHighlightPaused !== isPaused) {
        sections.forEach(function (section) {
          const active = section === activeSection && !isPaused;
          section.classList.toggle('is-current-rule', active);
          section.classList.toggle('pq-rules-current-section', active);
          if (active) {
            section.setAttribute('aria-current', 'step');
          } else {
            section.removeAttribute('aria-current');
          }
        });

        if (!isPaused && __pqRulesHighlightIndex !== activeIndex) {
          try {
            activeSection.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
          } catch (_e) {}
        }
      }

      __pqClearRulesCueHighlights();
      if (blockOnly) {
        __pqRulesHighlightAudio = audio;
        __pqRulesHighlightIndex = activeIndex;
        __pqRulesHighlightPaused = isPaused;
        return;
      }
      const wordCuesReliable = __pqRulesWordCuesAreReliable();
      if (activeCue && !isPaused && wordCuesReliable) {
        const nodes = __pqFindCueNodes(activeCue, sections[nextIndex]);
        nodes.forEach(function (node) {
          node.classList.add('pq-rules-current-cue');
          node.setAttribute('aria-current', 'true');
        });
      } else if (activeUtteranceCue && !isPaused) {
        const nodes = __pqFindCuePhraseNodes(activeUtteranceCue, sections[nextIndex]);
        nodes.forEach(function (node) {
          node.classList.add('pq-rules-current-phrase');
          node.setAttribute('aria-current', 'true');
        });
      }

      __pqRulesHighlightAudio = audio;
      __pqRulesHighlightIndex = nextIndex;
      __pqRulesHighlightPaused = isPaused;
    } catch (_e) {}
  }

  function __pqEnsureRulesHighlightTimer() {
    if (__pqRulesHighlightTimer) return;
    __pqRulesHighlightTimer = window.setInterval(__pqSyncRulesHighlight, 300);
  }

  try {
    window.__pqStartRulesAudioHighlight = function (audio) {
      try {
        if (audio) window.__pqRulesAudio = audio;
      } catch (_e) {}
      __pqEnsureRulesHighlightTimer();
      __pqSyncRulesHighlight();
    };
    __pqEnsureRulesHighlightTimer();
  } catch (_e) {}

  function setPaused(value) {
    try {
      const current = getCurrentStep();
      const stepId = String((current && current.step && current.step.id) || '').toLowerCase();

      if (stepId === 'rules' && window.__pqRulesAudio) {
        paused = !!value;
        try {
          if (paused) {
            window.__pqRulesAudio.pause();
          } else {
            window.__pqRulesAudio.play().catch(() => {});
          }
        } catch (_e) {}

        if (btnPause) {
          btnPause.hidden = false;
          btnPause.disabled = false;
          btnPause.style.display = 'inline-flex';
          btnPause.style.visibility = 'visible';
          btnPause.style.opacity = '1';
          btnPause.style.pointerEvents = 'auto';
          btnPause.style.touchAction = 'manipulation';
          if (typeof __pqSetBilingualControlLabel === 'function') {
            __pqSetBilingualControlLabel(
              btnPause,
              paused ? 'Resume' : 'Pause',
              paused ? '\u0627\u0633\u062a\u0626\u0646\u0627\u0641' : '\u0625\u064a\u0642\u0627\u0641'
            );
          } else {
            btnPause.textContent = paused
              ? __PQ_TEXT_CACHE.resume
              : __PQ_TEXT_CACHE.pause;
          }
        }

        return paused;
      }

      if (current && __pqIsWatchStep(current.step)) {
        __watchPaused = !!value;
        paused = !!value;

        try {
          if (player) {
            if (__watchPaused) {
              player.pause();
            } else {
              player.play().catch(() => {});
            }
          }
        } catch (_e) {}

        if (btnPause) {
          if (typeof __pqSetBilingualControlLabel === 'function') {
            __pqSetBilingualControlLabel(
              btnPause,
              __watchPaused ? 'Resume' : 'Pause',
              ''
            );
          } else {
            btnPause.textContent = __watchPaused
  ? __PQ_TEXT_CACHE.resume
  : __PQ_TEXT_CACHE.pause;
          }
        }

        return __watchPaused;
      }
    } catch (_e) {}

paused = !!value;

let result = paused;

try {
  if (paused) {
    if (__pqPauseWebAudio()) {
      result = true;
    } else {
      const api = __pqEnsurePlaylistEngine();
      result = api ? api.setPaused(value) : paused;
    }
  } else {
    const resumeRate = parseFloat((speedSel && speedSel.value) || DEFAULTS.speed || '1');

    __pqResumeWebAudio(resumeRate)
      .then((ok) => {
        if (!ok) {
          try {
            const api = __pqEnsurePlaylistEngine();
            if (api) api.setPaused(false);
          } catch (_e) {}
        }
      })
      .catch(() => {
        try {
          const api = __pqEnsurePlaylistEngine();
          if (api) api.setPaused(false);
        } catch (_e) {}
      });

    result = false;
  }
} catch (_e) {
  const api = __pqEnsurePlaylistEngine();
  result = api ? api.setPaused(value) : paused;
}

    try {
      if (btnPause) {
        if (typeof __pqSetBilingualControlLabel === 'function') {
          __pqSetBilingualControlLabel(
            btnPause,
            paused ? 'Resume' : 'Pause',
            ''
          );
        } else {
          btnPause.textContent = paused
            ? __PQ_TEXT_CACHE.resume
            : __PQ_TEXT_CACHE.pause;
        }
      }
    } catch (_e) {}

    return result;
  }

  async function pauseGate(signal) {
    try {
      const current = getCurrentStep();

      if (current && __pqIsWatchStep(current.step)) {
        while (__watchPaused) {
          __pqAssertNotAborted(signal);
          await __pqDelayWithAbort(120, signal);
        }
        return;
      }
    } catch (_e) {
      if (_e && _e.name === 'AbortError') throw _e;
    }

    while (paused) {
      __pqAssertNotAborted(signal);
      await __pqDelayWithAbort(120, signal);
    }

    return undefined;
  }

  function __pqGetWatchSequenceKeys(stepIdOverride) {
    const visible = [
      ...(grid ? grid.querySelectorAll('.tile[data-key]') : [])
    ].map((el) => String(el.dataset.key || ''));

    const visibleSet = new Set(visible.filter(Boolean));
    const fallback = (PLAY_SEQUENCE_KEYS || []).filter((key) => visibleSet.has(key));

    let stepId = 'watch';
    try {
      stepId = __pqCanonicalStepId(stepIdOverride || '');
      if (!stepId) {
        const current = getCurrentStep();
        stepId = __pqCanonicalStepId((current && current.step && current.step.id) || 'watch');
      }
    } catch (_e) {
      stepId = 'watch';
    }

    return __pqGetPassSequenceKeys(stepId || 'watch', fallback);
  }

  function __pqPlayVideoUrl(url, rate) {
    return new Promise((resolve, reject) => {
      try {
        if (!player || !videoModal || !url) {
          reject(new Error('video player unavailable'));
          return;
        }

        let settled = false;

        const cleanup = () => {
          try { player.onended = null; } catch (_e) {}
          try { player.onerror = null; } catch (_e) {}
          try { player.onpause = null; } catch (_e) {}
          try { player.onloadedmetadata = null; } catch (_e) {}
          try { player.oncanplay = null; } catch (_e) {}
          try { player.onabort = null; } catch (_e) {}
          try { player.onemptied = null; } catch (_e) {}
        };

        const done = (ok, err) => {
          if (settled) return;
          settled = true;
          cleanup();

          if (ok) {
            resolve(true);
          } else {
            reject(err || new Error('video playback failed'));
          }
        };

        try {
          videoModal.style.display = 'flex';
        } catch (_e) {}

        try { player.pause(); } catch (_e) {}
        try { player.removeAttribute('src'); } catch (_e) {}
        try { player.load(); } catch (_e) {}

        try {
          player.setAttribute('src', String(url));
        } catch (_e) {}

        try {
          player.playbackRate = Number(rate || 1) || 1;
        } catch (_e) {}

        const failIfInterrupted = (eventName) => {
          try { if (player && player.ended) { done(true); return; } } catch (_e) {}
          try {
            const maybePlay = player && player.play ? player.play() : null;
            if (maybePlay && typeof maybePlay.catch === 'function') {
              maybePlay.catch(function () {
                done(false, new Error('video playback interrupted: ' + eventName));
              });
              return;
            }
          } catch (_e) {}
          window.setTimeout(function () {
            try {
              if (player && !player.paused && !player.ended) return;
            } catch (_e) {}
            done(false, new Error('video playback interrupted: ' + eventName));
          }, 350);
        };

        player.onended = function () {
          try { if (videoModal) videoModal.style.display = 'none'; } catch (_e) {}
          done(true);
        };

        player.onerror = function () {
          done(false, new Error('video playback failed'));
        };

        player.onabort = function () {
          failIfInterrupted('abort');
        };

        player.onemptied = function () {
          failIfInterrupted('emptied');
        };

        player.onloadedmetadata = function () {
          try {
            player.currentTime = 0;
          } catch (_e) {}
        };

        player.oncanplay = function () {
          try {
            const maybePlay = player.play();
            if (maybePlay && typeof maybePlay.then === 'function') {
              maybePlay.then(function () {
                // playing
              }).catch(function (err) {
                done(false, err || new Error('video play() failed'));
              });
            }
          } catch (err) {
            done(false, err);
          }
        };

        try {
          player.load();
        } catch (err) {
          done(false, err);
        }
      } catch (err) {
        reject(err);
      }
    });
  }



function __pqCloseSoundArticulationModal() {
  try {
    const box = document.getElementById('pqSoundArticulationModal');
    if (box) box.remove();
  } catch (_e) {}
}

function __pqHideSoundArticulationImage() {
  __pqCloseSoundArticulationModal();
}

/*
  Shows articulation image inside the current page.

  Buttons:
  - replay: plays the letter audio without closing the modal
  - primary: closes modal and resolves "primary"
  - secondary: closes modal and resolves "secondary"

  This keeps Re-play Letter linked directly to the existing letter audio function,
  so we do not need a separate audio mapping.
*/

let __pqSoundExplainerPlayer = null;
const __pqSoundExplainerSeenByKey = Object.create(null);
const __pqSoundVideoCompletedByKey = Object.create(null);

function __pqSoundCompletedStorageKey() {
  try {
    return __pqStorageKey('soundDoneKeys', 'pq_sound_done_keys_' + __PQ_UNIT_ID);
  } catch (_e) {
    return 'pq_sound_done_keys';
  }
}

function __pqLoadSoundCompletedMap() {
  try {
    const raw = localStorage.getItem(__pqSoundCompletedStorageKey());
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed && typeof parsed === 'object') {
      Object.keys(parsed).forEach((key) => {
        if (parsed[key]) __pqSoundVideoCompletedByKey[String(key)] = true;
      });
    }
  } catch (_e) {}
}

function __pqSaveSoundCompletedMap() {
  try {
    localStorage.setItem(
      __pqSoundCompletedStorageKey(),
      JSON.stringify(__pqSoundVideoCompletedByKey)
    );
  } catch (_e) {}
}

function __pqSoundRequireExplainerFirst() {
  try {
    return __cfg('playback.steps.sound.requireExplainerFirst', __cfg('sound.requireExplainerFirst', true)) !== false;
  } catch (_e) {
    return true;
  }
}

function __pqSoundAutoVideoAfterExplainer() {
  try {
    return __cfg('playback.steps.sound.autoVideoAfterExplainer', __cfg('sound.autoVideoAfterExplainer', true)) !== false;
  } catch (_e) {
    return true;
  }
}

function __pqSoundAutoPlayExplainerOnModalOpen() {
  try {
    return __cfg('playback.steps.sound.autoPlayExplainerOnModalOpen', __cfg('sound.autoPlayExplainerOnModalOpen', true)) !== false;
  } catch (_e) {
    return true;
  }
}

function __pqSoundVideoRepeatCount() {
  try {
    const value = __cfg('playback.steps.sound.videoRepeatCount', __cfg('sound.videoRepeatCount', 1));
    return Math.max(1, Math.floor(Number(value || 1) || 1));
  } catch (_e) {
    return 1;
  }
}

function __pqSoundPreModalPlaybackMode() {
  try {
    const raw = String(__cfg('playback.steps.sound.preModalPlayback', __cfg('sound.preModalPlayback', 'video')) || 'video').trim().toLowerCase();
    return raw === 'audio' ? 'audio' : 'video';
  } catch (_e) {
    return 'video';
  }
}

function __pqSoundHasSeenExplainer(key) {
  try {
    return !!__pqSoundExplainerSeenByKey[String(key || '')];
  } catch (_e) {
    return false;
  }
}

function __pqSoundMarkExplainerSeen(key) {
  try {
    __pqSoundExplainerSeenByKey[String(key || '')] = true;
  } catch (_e) {}
}

function __pqSoundProgressKeys() {
  try {
    if (typeof __pqGetPassSequenceKeys === 'function') {
      const keys = __pqGetPassSequenceKeys('sound', PLAY_SEQUENCE_KEYS || []);
      if (Array.isArray(keys) && keys.length) return keys.map(String);
    }
  } catch (_e) {}

  try {
    return (PLAY_SEQUENCE_KEYS || []).map(String).filter(Boolean);
  } catch (_e) {
    return [];
  }
}

function __pqSoundCompletedCount() {
  const keys = __pqSoundProgressKeys();
  if (!keys.length) return 0;
  return keys.reduce((sum, key) => sum + (__pqSoundVideoCompletedByKey[key] ? 1 : 0), 0);
}

function __pqIsCurrentSoundVisualStep() {
  try {
    const current = (typeof getCurrentStep === 'function') ? getCurrentStep() : null;
    const stepId = current && current.step ? current.step.id : '';
    return __pqCanonicalStepId(stepId) === 'sound';
  } catch (_e) {
    return false;
  }
}

function __pqClearSoundCompletedVisuals() {
  try {
    const tiles = grid
      ? grid.querySelectorAll('.tile.pq-sound-done, .tile[data-sound-done]')
      : document.querySelectorAll('#grid .tile.pq-sound-done, #grid .tile[data-sound-done]');
    tiles.forEach((tile) => {
      tile.classList.remove('pq-sound-done');
      tile.removeAttribute('data-sound-done');
      const check = tile.querySelector('.pq-sound-check');
      if (check) check.remove();
    });
  } catch (_e) {}
}

function __pqSoundResumeIncomplete() {
  try {
    return __cfg('playback.steps.sound.resumeIncomplete', __cfg('sound.resumeIncomplete', true)) !== false;
  } catch (_e) {
    return true;
  }
}

function __pqGetSoundPlaybackSequenceKeys(fallbackKeys) {
  let keys = [];
  try {
    keys = __pqGetPassSequenceKeys('sound', fallbackKeys || PLAY_SEQUENCE_KEYS || []);
  } catch (_e) {
    keys = (fallbackKeys || PLAY_SEQUENCE_KEYS || []).slice();
  }

  keys = (keys || []).map(String).filter(Boolean);

  if (!__pqSoundResumeIncomplete()) return keys;

  try { __pqLoadSoundCompletedMap(); } catch (_e) {}

  const remaining = keys.filter((key) => !__pqSoundVideoCompletedByKey[key]);
  return remaining.length ? remaining : keys;
}

function __pqSoundProgressCfg(path, fallback) {
  try {
    const suffix = String(path || '').trim();
    if (!suffix) return fallback;
    return __cfg(
      'playback.steps.words.progress.' + suffix,
      __cfg('playback.steps.words.' + suffix, __cfg('soundProgress.' + suffix, fallback))
    );
  } catch (_e) {
    return fallback;
  }
}

function __pqEnsureSoundProgressBadge(host, afterNode) {
  if (!host) return null;
  let badge = host.querySelector('.pq-sound-letter-progress-badge');
  if (!badge) {
    badge = document.createElement('span');
    badge.className = 'pq-sound-letter-progress-badge';
    if (afterNode && afterNode.parentNode === host && afterNode.nextSibling) {
      host.insertBefore(badge, afterNode.nextSibling);
    } else {
      host.appendChild(badge);
    }
  }
  return badge;
}

function __pqClearSoundProgressBadges() {
  try {
    document.querySelectorAll('.pq-sound-letter-progress-badge').forEach((badge) => badge.remove());
  } catch (_e) {}
}

function __pqUpdateSoundProgressCounter() {
  try {
    if (!__pqIsCurrentSoundVisualStep()) {
      __pqClearSoundProgressBadges();
      return;
    }
    const total = __pqSoundProgressKeys().length;
    const done = __pqSoundCompletedCount();
    const label = String(__pqSoundProgressCfg('label', 'Progress') || 'Progress').trim();
    const text = label + ' ' + done + '/' + Math.max(1, total || 0);

    const mobileFocus = document.getElementById('pqMobileFocusBadge');
    if (mobileFocus && mobileFocus.parentNode) {
      const badge = __pqEnsureSoundProgressBadge(mobileFocus.parentNode, mobileFocus);
      if (badge) {
        badge.textContent = text;
        badge.setAttribute('aria-label', text);
      }
    }

    const rewardFocus = document.querySelector('#pqStepRewardStars .pq-focus-label');
    if (rewardFocus && rewardFocus.parentNode) {
      const badge = __pqEnsureSoundProgressBadge(rewardFocus.parentNode, rewardFocus);
      if (badge) {
        badge.textContent = text;
        badge.setAttribute('aria-label', text);
      }
    }
  } catch (_e) {}
}

function __pqMarkSoundVideoCompleted(key) {
  try {
    const k = String(key || '');
    if (!k) return;
    __pqSoundVideoCompletedByKey[k] = true;
    __pqSaveSoundCompletedMap();

    const esc = (window.CSS && typeof window.CSS.escape === 'function')
      ? window.CSS.escape(k)
      : k.replace(/"/g, '\\"');
    const tile = grid
      ? grid.querySelector('.tile[data-key="' + esc + '"]')
      : document.querySelector('#grid .tile[data-key="' + esc + '"]');
    if (!__pqIsCurrentSoundVisualStep()) {
      __pqClearSoundCompletedVisuals();
      __pqClearSoundProgressBadges();
      return;
    }
    if (tile) {
      tile.classList.add('pq-sound-done');
      tile.setAttribute('data-sound-done', '1');
      if (!tile.querySelector('.pq-sound-check')) {
        const check = document.createElement('span');
        check.className = 'pq-sound-check';
        check.setAttribute('aria-hidden', 'true');
        check.textContent = String(__pqSoundProgressCfg('checkText', '\u2713') || '\u2713');
        tile.appendChild(check);
      }
    }
    __pqUpdateSoundProgressCounter();
  } catch (_e) {}
}

function __pqApplySoundCompletedVisuals() {
  try {
    __pqLoadSoundCompletedMap();
    if (!__pqIsCurrentSoundVisualStep()) {
      __pqClearSoundCompletedVisuals();
      __pqClearSoundProgressBadges();
      return;
    }
    Object.keys(__pqSoundVideoCompletedByKey).forEach((key) => {
      if (__pqSoundVideoCompletedByKey[key]) __pqMarkSoundVideoCompleted(key);
    });
    __pqUpdateSoundProgressCounter();
  } catch (_e) {}
}

try {
  __pqLoadSoundCompletedMap();
  setTimeout(__pqApplySoundCompletedVisuals, 250);
  setTimeout(__pqApplySoundCompletedVisuals, 1000);
} catch (_e) {}

function __pqGetSoundExplainerUrl(key) {
  try {
    let base = String(__cfg('media.soundAudioBase', '') || '');

    // Safety: if soundAudioBase is not the explainer folder, use fallback.
    if (!/\/explainer\/?$/i.test(base)) {
      base = String(__cfg('media.soundExplainerBase', '') || '');
    }

    if (!base) return '';

    const stem = (typeof __pqSoundFileStemFromKey === 'function')
      ? __pqSoundFileStemFromKey(key)
      : String(key || '').replace(/(\D+)(\d+)$/, function (_m, p1, p2) {
          return p1 + String(Number(p2) || 0).padStart(2, '0');
        });

    return __pqAppendAssetVersion(base.replace(/\/?$/, '/') + stem + '_explainer.mp3');
  } catch (_e) {
    return '';
  }
}

function __pqStopSoundExplainer() {
  try {
    if (__pqSoundExplainerPlayer) {
      __pqSoundExplainerPlayer.pause();
      __pqSoundExplainerPlayer.removeAttribute('src');
      __pqSoundExplainerPlayer.load();
    }
  } catch (_e) {}

  __pqSoundExplainerPlayer = null;
}

async function __pqPlaySoundExplainer(key) {
  try {
    __pqStopSoundExplainer();

    const url = __pqGetSoundExplainerUrl(key);
    if (!url) return false;

    __pqSoundExplainerPlayer = new Audio(url);
    __pqSoundExplainerPlayer.preload = 'auto';

    await __pqSoundExplainerPlayer.play();
    await new Promise((resolve) => {
      const audio = __pqSoundExplainerPlayer;
      if (!audio) {
        resolve(false);
        return;
      }

      let settled = false;
      function finish(ok) {
        if (settled) return;
        settled = true;
        try { audio.removeEventListener('ended', onEnded); } catch (_e) {}
        try { audio.removeEventListener('error', onError); } catch (_e) {}
        resolve(ok);
      }
      function onEnded() { finish(true); }
      function onError() { finish(false); }

      audio.addEventListener('ended', onEnded, { once: true });
      audio.addEventListener('error', onError, { once: true });
    });
    return true;
  } catch (err) {
    console.warn('[PQ Sound] explainer audio failed:', err);
    return false;
  }
}


function __pqSoundModalChoice(key, opts, signal, rate) {
  return new Promise((resolve) => {
    try {
      const url = SOUND_IMAGE_BY_KEY && SOUND_IMAGE_BY_KEY[key];

      if (!url) {
        resolve('primary');
        return;
      }

      __pqCloseSoundArticulationModal();

      const primaryLabel = (opts && opts.primary) || 'Continue';
      const secondaryLabel = opts && opts.secondary ? String(opts.secondary) : '';
      const replayLabel = (opts && opts.replay) || 'Play Letter';
      const explainerLabel = (opts && opts.explainer) || 'Explainer';

      const overlay = document.createElement('div');
      overlay.id = 'pqSoundArticulationModal';
      overlay.className = 'pq-sound-modal-overlay';

      const card = document.createElement('div');
      card.className = 'pq-sound-modal-card';
      card.setAttribute('role', 'dialog');
      card.setAttribute('aria-modal', 'true');

      const closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.className = 'pq-sound-modal-close';
      closeBtn.setAttribute('data-choice', 'close');
      closeBtn.setAttribute('aria-label', 'Close');
      closeBtn.textContent = 'Ã—';

      const img = document.createElement('img');
      img.className = 'pq-sound-modal-img';
      img.src = url;
      img.alt = 'Articulation image';

      img.addEventListener('error', function () {
        try {
          console.warn('[PQ Sound] articulation image failed:', url);
        } catch (_e) {}
      });

      const actions = document.createElement('div');
      actions.className = 'pq-sound-modal-actions';

      const guardHint = document.createElement('div');
      guardHint.className = 'pq-sound-modal-guard';
      guardHint.textContent = 'Tap Explainer first.';

      function makeBtn(className, choice, label) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'pq-sound-modal-btn ' + className;
        btn.setAttribute('data-choice', choice);
        btn.textContent = label;
        return btn;
      }

      // Required visual/order:
      // 1) Next letter / Play video
      // 2) Play video, if present
      // 3) Play letter
      // 4) Explainer
      const primaryBtn = makeBtn('pq-sound-primary', 'primary', primaryLabel);
      actions.appendChild(primaryBtn);

      let secondaryBtn = null;
      if (secondaryLabel) {
        secondaryBtn = makeBtn('pq-sound-secondary', 'secondary', secondaryLabel);
        actions.appendChild(secondaryBtn);
      }

      const replayBtn = makeBtn('pq-sound-replay', 'replay', replayLabel);
      actions.appendChild(replayBtn);

      const explainerBtn = makeBtn('pq-sound-explainer', 'explainer', explainerLabel);
      actions.appendChild(explainerBtn);

      card.appendChild(closeBtn);
      card.appendChild(img);
      card.appendChild(guardHint);
      card.appendChild(actions);
      overlay.appendChild(card);
      document.body.appendChild(overlay);

      const requireExplainerFirst = __pqSoundRequireExplainerFirst();
      const autoVideoAfterExplainer = !!(opts && opts.autoPrimaryAfterExplainer) && __pqSoundAutoVideoAfterExplainer();
      const autoPlayExplainerOnModalOpen = __pqSoundAutoPlayExplainerOnModalOpen();
      let explainerPlayInFlight = false;

      function syncExplainerGuard() {
        const locked = explainerPlayInFlight || (requireExplainerFirst && !__pqSoundHasSeenExplainer(key));
        try { overlay.classList.toggle('pq-sound-locked', locked); } catch (_e) {}
        try { guardHint.hidden = !locked; } catch (_e) {}
        try { primaryBtn.disabled = locked; } catch (_e) {}
        try { replayBtn.disabled = locked; } catch (_e) {}
        try {
          closeBtn.disabled = locked;
          closeBtn.setAttribute('aria-disabled', locked ? 'true' : 'false');
        } catch (_e) {}
        try { if (secondaryBtn) secondaryBtn.disabled = locked; } catch (_e) {}
      }

      syncExplainerGuard();

      function done(choice) {
        try { __pqStopSoundExplainer(); } catch (_e) {}
        try { overlay.remove(); } catch (_e) {}
        resolve(choice || 'primary');
      }

      async function playExplainerFromModal() {
        if (explainerPlayInFlight) return;
        explainerPlayInFlight = true;
        try {
          __pqSoundMarkExplainerSeen(key);
          syncExplainerGuard();
          explainerBtn.disabled = true;
          explainerBtn.textContent = 'Playing explainer...';
          const played = await __pqPlaySoundExplainer(key);
          if (played && autoVideoAfterExplainer) {
            done('primary');
            return;
          }
        } catch (_e) {
        } finally {
          try {
            explainerBtn.disabled = false;
            explainerBtn.textContent = explainerLabel;
          } catch (_e) {}
          explainerPlayInFlight = false;
          syncExplainerGuard();
        }
      }

      explainerBtn.addEventListener('click', function () {
        playExplainerFromModal();
      });

      if (autoPlayExplainerOnModalOpen && !__pqSoundHasSeenExplainer(key)) {
        setTimeout(function () {
          try {
            if (!document.body.contains(overlay)) return;
            playExplainerFromModal();
          } catch (_e) {}
        }, 120);
      }

      replayBtn.addEventListener('click', async function () {
        try {
          if (requireExplainerFirst && !__pqSoundHasSeenExplainer(key)) {
            syncExplainerGuard();
            return;
          }
          replayBtn.disabled = true;
          replayBtn.textContent = 'Playing sound...';
          await playLetter(key, 1, rate, 'sound');
        } catch (_e) {
        } finally {
          try {
            replayBtn.disabled = false;
            replayBtn.textContent = replayLabel;
          } catch (_e) {}
        }
      });

      primaryBtn.addEventListener('click', function () {
        if (requireExplainerFirst && !__pqSoundHasSeenExplainer(key)) {
          syncExplainerGuard();
          return;
        }
        done('primary');
      });

      if (secondaryBtn) {
        secondaryBtn.addEventListener('click', function () {
          if (requireExplainerFirst && !__pqSoundHasSeenExplainer(key)) {
            syncExplainerGuard();
            return;
          }
          done('secondary');
        });
      }

      closeBtn.addEventListener('click', function () {
        if (requireExplainerFirst && !__pqSoundHasSeenExplainer(key)) {
          syncExplainerGuard();
          return;
        }
        done('primary');
      });

      if (signal) {
        if (signal.aborted) {
          done('aborted');
          return;
        }

        signal.addEventListener('abort', function () {
          done('aborted');
        }, { once: true });
      }
    } catch (_e) {
      resolve('primary');
    }
  });
}

function __pqCloseSoundVideo() {
  try {
    if (player) {
      player.pause();
      player.removeAttribute('src');
      player.load();
    }
  } catch (_e) {}

  try {
    if (videoModal) {
      videoModal.style.display = 'none';
    }
  } catch (_e) {}
}

async function __pqPlaySoundVideoRepeated(url, rate, signal) {
  const repeatCount = __pqSoundVideoRepeatCount();
  for (let i = 0; i < repeatCount; i++) {
    if (signal && signal.aborted) return;
    await __pqPlayVideoUrl(url, rate);
    if (i < repeatCount - 1) {
      __pqCloseSoundVideo();
      await __pqStepDelay(Number(__cfg('playback.steps.sound.betweenVideoRepeatsMs', 180) || 0), null, signal);
    }
  }
}

async function __pqPlaySoundGuidedFlow(key, url, rate, signal) {
  __pqUpdateSoundProgressCounter();

  // Step 1: letter video plays first automatically before the articulation modal.
  if (__pqSoundPreModalPlaybackMode() === 'audio') {
    await playLetter(key, 1, rate, 'sound');
  } else {
    await __pqPlaySoundVideoRepeated(url, rate, signal);
    __pqCloseSoundVideo();
  }

  // Step 2: after the opening media, show image modal with Play Letter + Play Video.
  while (true) {
    const afterAudio = await __pqSoundModalChoice(key, {
      replay: 'Play Letter',
      primary: 'Play Video',
      autoPrimaryAfterExplainer: true
    }, signal, rate);

    if (afterAudio === 'aborted' || (signal && signal.aborted)) return false;

    if (afterAudio === 'primary') {
      break;
    }
  }

  // Step 3+: play video, close video, show final image modal.
  while (true) {
    await __pqPlaySoundVideoRepeated(url, rate, signal);
    __pqCloseSoundVideo();
    __pqMarkSoundVideoCompleted(key);

    const afterVideo = await __pqSoundModalChoice(key, {
      replay: 'Play Letter',
      secondary: 'Play Video',
      primary: 'Next Letter'
    }, signal, rate);

    if (afterVideo === 'aborted' || (signal && signal.aborted)) return false;

    if (afterVideo === 'secondary') {
      continue; // replay video
    }

    return true; // next letter
  }
}

async function playWatchVideoForKey(key, rate, stepId, signal) {
  try { __pqSetPlayingTile(key); } catch (_e) {}

  const sid = __pqCanonicalStepId(stepId);
  const map = (sid === 'animate') ? ANIMATE_VIDEO_BY_KEY : WATCH_VIDEO_BY_KEY;
  const url = map[key];

  if (!url) {
    throw new Error('Missing ' + (sid === 'animate' ? 'animate' : sid === 'sound' ? 'sound' : 'watch') + ' video URL for key: ' + key);
  }

  if (sid === 'sound') {
    return __pqPlaySoundGuidedFlow(key, url, rate, signal);
  }

  const effectiveVideoRate = sid === 'animate'
    ? Number(
        __cfg('playback.steps.animate.videoPlaybackRate',
          __cfg('playback.steps.animate.animationPlaybackRate',
            __cfg('playback.steps.animate.playbackRate', rate)
          )
        ) || rate
      ) || rate
    : rate;

  try {
    if (videoModal) {
      videoModal.classList.toggle('pq-animate-video-modal', sid === 'animate');
      if (sid === 'animate') {
        videoModal.style.setProperty(
          '--pq-animate-video-max-width',
          String(__cfg('playback.steps.animate.modalMaxWidth', '72vw'))
        );
        videoModal.style.setProperty(
          '--pq-animate-video-max-height',
          String(__cfg('playback.steps.animate.modalMaxHeight', '72vh'))
        );
      }
    }
  } catch (_e) {}

  try {
    if (sid === 'animate' && __cfg('playback.steps.animate.audioBeforeVideo', true) !== false) {
      const audioRate = Number(__cfg('playback.steps.animate.audioPlaybackRate', rate) || rate) || rate;
      await playLetter(key, 1, audioRate, stepId);
      __pqAssertNotAborted(signal);
      await __pqStepDelay(Number(__cfg('playback.steps.animate.audioVideoGapMs', 250) || 0), null, signal);
    }

    await __pqPlayVideoUrl(url, effectiveVideoRate);
  } finally {
    try {
      if (videoModal) {
        videoModal.classList.remove('pq-animate-video-modal');
        videoModal.style.removeProperty('--pq-animate-video-max-width');
        videoModal.style.removeProperty('--pq-animate-video-max-height');
      }
    } catch (_e) {}
  }
  return true;
}

  async function playAllWatch(stepIdOverride) {
    const controller = __pqStartPlayAllController();
    const signal = controller ? controller.signal : null;
    const rate = parseFloat(speedSel.value || DEFAULTS.speed);
  const rawStepId = String(stepIdOverride || 'watch').toLowerCase();
  const stepId = __pqCanonicalStepId(rawStepId);
  const keys = stepId === 'animate'
  ? __pqGetPassSequenceKeys('animate', PLAY_SEQUENCE_KEYS)
  : stepId === 'sound'
    ? __pqGetSoundPlaybackSequenceKeys(PLAY_SEQUENCE_KEYS)
    : __pqGetWatchSequenceKeys(stepId);

    if (!keys.length) return;

    playingAll = true;
    __watchPlaying = true;
    __watchPaused = false;
    paused = false;
    __pqSetPlaylistDimming(true);

    if (btnPlayAll) {
      btnPlayAll.disabled = true;
      btnPlayAll.textContent = __PQ_TEXT_CACHE.playAll;
    }

    if (btnPause) {
      btnPause.disabled = false;
      if (typeof __pqSetBilingualControlLabel === 'function') {
        __pqSetBilingualControlLabel(btnPause, 'Pause', '');
      } else {
        btnPause.textContent = __PQ_TEXT_CACHE.pause;
      }
    }

    try {
      await __pqStepDelay(stepId, 'beforeStartMs', signal);

      for (const key of keys) {
        __pqAssertNotAborted(signal);

        const idx = LETTERS.findIndex((item) => item.key === key);
        selectedIdx = idx;
        selectedKey = key;
        markActive();

        try {
          __pqSyncWriteUI();
        } catch (_e) {}

        alScrollToKey(key);
        await pauseGate(signal);
        __pqAssertNotAborted(signal);
        await playWatchVideoForKey(key, rate, stepId, signal);
        __pqAssertNotAborted(signal);

        try {
          handleLetterPlayedForCurrentStep(key);
        } catch (_e) {}

        await __pqStepDelay(stepId, 'betweenLettersMs', signal);
      }

      await __pqStepDelay(stepId, 'afterCompleteMs', signal);
      __pqCloseActiveMediaWindows();

      const current = getCurrentStep();
      if (current && current.step && __pqIsWatchStep(current.step)) {
        await markPlaylistStepCompleted(current.step.id);
      }
    } catch (_e) {
      if (!_e || _e.name !== 'AbortError') {
        throw _e;
      }
    } finally {
      const stillOwner = !!(
        __playAllController &&
        controller &&
        __playAllController === controller
      );

      if (stillOwner) {
        __playAllController = null;
      }

      __pqSetPlaylistDimming(false);
      playingAll = false;
      __watchPlaying = false;
      __watchPaused = false;
      paused = false;

      try {
        if (player) {
          player.pause();
          player.removeAttribute('src');
          player.load();
        }
      } catch (_e) {}

      if (videoModal) {
        videoModal.style.display = 'none';
      }

      if (btnPlayAll) {
        btnPlayAll.disabled = false;
        btnPlayAll.textContent = __PQ_TEXT_CACHE.playAll;
      }

      if (btnPause) {
        btnPause.disabled = false;
        if (typeof __pqSetBilingualControlLabel === 'function') {
          __pqSetBilingualControlLabel(btnPause, 'Pause', '');
        } else {
          btnPause.textContent = __PQ_TEXT_CACHE.pause;
        }
      }
    }
  }

  function __pqGetVisibleSequenceKeys(stepIdOverride) {
    let fallback = [];

    try {
      const visible = new Set(
        [...(grid ? grid.querySelectorAll('.tile[data-key]') : [])]
          .map((el) => String(el.dataset.key || ''))
          .filter(Boolean)
      );

      const ordered = (PLAY_SEQUENCE_KEYS || []).filter((key) => visible.has(key));
      if (ordered.length) {
        fallback = ordered;
      }
    } catch (_e) {}

    if (!fallback.length) {
      try {
        fallback = [...(grid ? grid.querySelectorAll('.tile[data-key]') : [])]
          .map((el) => String(el.dataset.key || ''))
          .filter(Boolean);
      } catch (_e) {
        fallback = [];
      }
    }

    try {
      let sid = String(stepIdOverride || '').toLowerCase();

      if (!sid) {
        const current = getCurrentStep();
        sid = String((current && current.step && current.step.id) || '').toLowerCase();
      }

      return __pqGetPassSequenceKeys(__pqCanonicalStepId(sid), fallback);
    } catch (_e) {
      return fallback;
    }
  }

  
  function __pqGetStepRepeatPerLetter(stepId, fallback) {
    try {
      const sid = String(stepId || '').toLowerCase();
      const canonical = __pqCanonicalStepId(sid);
      const base = Math.max(1, Number(fallback || DEFAULTS.repeat || 1) || 1);
      const progress = (managedProgress && (managedProgress[sid] || managedProgress[canonical])) || {};

      const raw =
        progress.repeatPerLetter ??
        progress.repeats_per_letter ??
        progress.repeat_per_letter ??
        progress.default_repeats_per_letter ??
        progress.defaultRepeatsPerLetter ??
        base;

      const n = Number(raw);
      return Number.isFinite(n) && n >= 1 ? Math.floor(n) : base;
    } catch (_e) {
      return Math.max(1, Number(fallback || DEFAULTS.repeat || 1) || 1);
    }
  }


function __pqGetManagedRepeatPerLetter(stepId, fallback) {
  try {
    const sid = String(stepId || '').toLowerCase();
    const canonical = __pqCanonicalStepId(sid);
    const base = Math.max(1, Number(fallback || 1) || 1);
    const progress = (managedProgress && (managedProgress[sid] || managedProgress[canonical])) || null;

    if (!progress) return base;

    const raw =
      progress.repeatPerLetter ??
      progress.repeats_per_letter ??
      progress.repeat_per_letter ??
      progress.default_repeats_per_letter ??
      progress.defaultRepeatsPerLetter ??
      progress.repeatsPerLetter ??
      base;

    const n = Number(raw);
    return Number.isFinite(n) && n >= 1 ? Math.floor(n) : base;
  } catch (_e) {
    return Math.max(1, Number(fallback || 1) || 1);
  }
}


try {
  window.__pqDebugRepeat = function (stepId) {
    const sid = String(stepId || '').toLowerCase();
    const fallback = parseInt((repeatSel && repeatSel.value) || DEFAULTS.repeat || '1', 10) || 1;
    return {
      stepId: sid,
      dropdown: repeatSel ? repeatSel.value : null,
      progress: managedProgress && sid ? managedProgress[sid] : null,
      resolved: __pqGetManagedRepeatPerLetter(sid, fallback)
    };
  };
} catch (_e) {}


function __pqListenPlusCfg(key, fallback) {
  try {
    const lp = __cfg('listenPlus', {}) || {};
    if (!key) return lp;
    return lp[key] == null ? fallback : lp[key];
  } catch (_e) {
    return fallback;
  }
}

function __pqListenPlusUrl(base, name, ext) {
  try {
    name = String(name || '').trim();
    if (!name) return __pqAppendAssetVersion('');
    if (/^https?:\/\//i.test(name)) return __pqAppendAssetVersion(name);
    base = String(base || '').replace(/\/?$/, '/');
    if (/\.[a-z0-9]{2,5}$/i.test(name)) return __pqAppendAssetVersion(base + name);
    return __pqAppendAssetVersion(base + name + String(ext || ''));
  } catch (_e) {
    return __pqAppendAssetVersion('');
  }
}

const __PQ_POPUP_IMAGE_BG = '#fff1c4';

function __pqHexToRgb(hex, fallback) {
  try {
    const clean = String(hex || '').trim().replace(/^#/, '');
    if (!/^[0-9a-f]{6}$/i.test(clean)) return fallback;
    return {
      r: parseInt(clean.slice(0, 2), 16),
      g: parseInt(clean.slice(2, 4), 16),
      b: parseInt(clean.slice(4, 6), 16)
    };
  } catch (_e) {
    return fallback;
  }
}

function __pqIsPopupImageBackgroundPixel(data, idx) {
  const r = data[idx];
  const g = data[idx + 1];
  const b = data[idx + 2];
  const a = data[idx + 3];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);

  return a < 245 || (min > 178 && (max - min) < 34);
}

function __pqPaintPopupImageBackground(img, src, bgColor) {
  try {
    if (!img || !src || !window.HTMLCanvasElement) return;

    const token = String(Date.now()) + '_' + Math.random();
    img.dataset.pqImageBgToken = token;

    const source = new Image();
    source.crossOrigin = 'anonymous';

    source.onload = function () {
      try {
        if (img.dataset.pqImageBgToken !== token) return;

        const width = Math.max(1, source.naturalWidth || source.width || 1);
        const height = Math.max(1, source.naturalHeight || source.height || 1);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        ctx.drawImage(source, 0, 0, width, height);

        let imageData;
        try {
          imageData = ctx.getImageData(0, 0, width, height);
        } catch (_e) {
          return;
        }

        const data = imageData.data;
        const fill = __pqHexToRgb(bgColor, { r: 255, g: 241, b: 196 });
        const seen = new Uint8Array(width * height);
        const queue = [];

        function push(x, y) {
          if (x < 0 || y < 0 || x >= width || y >= height) return;
          const pos = y * width + x;
          if (seen[pos]) return;
          const idx = pos * 4;
          if (!__pqIsPopupImageBackgroundPixel(data, idx)) return;
          seen[pos] = 1;
          queue.push(pos);
        }

        for (let x = 0; x < width; x += 1) {
          push(x, 0);
          push(x, height - 1);
        }
        for (let y = 0; y < height; y += 1) {
          push(0, y);
          push(width - 1, y);
        }

        for (let cursor = 0; cursor < queue.length; cursor += 1) {
          const pos = queue[cursor];
          const x = pos % width;
          const y = Math.floor(pos / width);
          const idx = pos * 4;
          data[idx] = fill.r;
          data[idx + 1] = fill.g;
          data[idx + 2] = fill.b;
          data[idx + 3] = 255;
          push(x + 1, y);
          push(x - 1, y);
          push(x, y + 1);
          push(x, y - 1);
        }

        ctx.putImageData(imageData, 0, 0);
        img.src = canvas.toDataURL('image/png');
      } catch (_e) {}
    };

    source.onerror = function () {};
    source.src = src;
  } catch (_e) {}
}

function __pqEnsureListenPlusOverlay() {
  let el = document.getElementById('pqListenPlusAnimalOverlay');
  if (el) return el;
  const style = document.createElement('style');
  style.textContent = '#pqListenPlusAnimalOverlay{position:fixed;inset:0;z-index:99998;display:none;align-items:center;justify-content:center;pointer-events:none;background:rgba(8,15,28,.16);backdrop-filter:blur(2px)}#pqListenPlusAnimalOverlay .card{width:min(540px,92vw);border-radius:32px;background:linear-gradient(180deg,#fff,#fff7df);border:4px solid rgba(255,255,255,.92);box-shadow:0 24px 70px rgba(18,29,52,.28);padding:20px;text-align:center;transform:scale(.94);opacity:0;transition:opacity .18s ease,transform .18s ease}#pqListenPlusAnimalOverlay.show .card{opacity:1;transform:scale(1)}#pqListenPlusAnimalOverlay .pq-lp-arabic{display:inline-flex;align-items:center;justify-content:center;min-width:82px;min-height:82px;margin:2px auto 10px;padding:4px 18px;border-radius:26px;background:linear-gradient(180deg,#eaffef,#c8f4d4);color:#079238;font-family:"Noto Naskh Arabic","Amiri","Segoe UI",serif;font-size:4rem;font-weight:1000;line-height:1;box-shadow:inset 0 0 0 3px rgba(255,255,255,.9),0 10px 24px rgba(7,146,56,.16);direction:rtl}#pqListenPlusAnimalOverlay img{width:min(360px,72vw);height:min(330px,52vh);object-fit:contain;display:block;margin:0 auto 12px;padding:16px;border-radius:28px;background:linear-gradient(180deg,#fff8df 0%,#fff1c4 100%);box-shadow:inset 0 0 0 3px rgba(255,255,255,.82),0 10px 26px rgba(124,86,27,.16)}.pq-lp-letter{display:inline-flex;align-items:center;justify-content:center;min-width:60px;height:60px;border-radius:20px;background:#e9f5ff;color:#1168a8;font-weight:1000;font-size:2rem;margin-right:10px}.pq-lp-animal{font-weight:1000;font-size:1.95rem;color:#17233b}.pq-lp-title{font-weight:900;color:#24324a;margin-bottom:8px}.pq-lp-sub{margin-top:6px;font-weight:800;color:#5b6780;font-size:1rem}@media(max-width:700px){#pqListenPlusAnimalOverlay .card{width:min(440px,92vw);padding:16px}#pqListenPlusAnimalOverlay .pq-lp-arabic{min-width:68px;min-height:68px;font-size:3.2rem}#pqListenPlusAnimalOverlay img{width:min(310px,74vw);height:min(280px,42vh)}}';
  document.head.appendChild(style);
  el = document.createElement('div');
  el.id = 'pqListenPlusAnimalOverlay';
  el.innerHTML = '<div class="card"><div class="pq-lp-title"></div><div class="pq-lp-arabic"></div><img alt=""><div><span class="pq-lp-letter"></span><span class="pq-lp-animal"></span></div><div class="pq-lp-sub"></div></div>';
  document.body.appendChild(el);
  return el;
}

function __pqListenPlusArabicForKey(key) {
  try {
    key = String(key || '').trim();
    const item = (LETTERS || []).find(function (entry) {
      return entry && String(entry.key || '') === key;
    });
    return item ? String(item.ar || item.text || item.letter || '').trim() : '';
  } catch (_e) {
    return '';
  }
}

function __pqHideListenPlusAnimal() {
  try {
    const el = document.getElementById('pqListenPlusAnimalOverlay');
    if (!el) return;
    el.classList.remove('show');
    setTimeout(function () { if (!el.classList.contains('show')) el.style.display = 'none'; }, 220);
  } catch (_e) {}
}

function __pqPlayListenPlusAudio(url, rate, timeoutMs, signal) {
  return new Promise(function (resolve) {
    try {
      if (!url || (signal && signal.aborted)) return resolve(false);
      const a = new Audio(url);
      let done = false;
      const finish = function (ok) {
        if (done) return;
        done = true;
        try { clearTimeout(timer); } catch (_e) {}
        try { a.pause(); a.removeAttribute('src'); a.load(); } catch (_e) {}
        resolve(!!ok);
      };
      const timer = setTimeout(function () { finish(false); }, Math.max(700, Number(timeoutMs || 3000)));
      if (signal) signal.addEventListener('abort', function () { finish(false); }, { once: true });
      a.playbackRate = Number(rate || 1) || 1;
      a.onended = function () { finish(true); };
      a.onerror = function () { finish(false); };
      const p = a.play();
      if (p && p.catch) p.catch(function () { finish(false); });
    } catch (_e) {
      resolve(false);
    }
  });
}

async function __pqMaybeRunListenPlusAnimal(stepId, key, rate, signal) {
  try {
    if (String(stepId || '').toLowerCase() !== 'listenplus') return false;
    if (__pqListenPlusCfg('enabled', true) === false) return false;
    const map = __pqListenPlusCfg('map', {}) || {};
    const item = map[String(key || '')];
    if (!item) return false;
    const imgUrl = __pqListenPlusUrl(__pqListenPlusCfg('imageBase', ''), item.image || item.img || '', __pqListenPlusCfg('imageExt', '.png'));
    const audioUrl = __pqListenPlusUrl(__pqListenPlusCfg('audioBase', ''), item.audio || '', __pqListenPlusCfg('audioExt', '.mp3'));
    const delayMs = Number(__cfg('playback.steps.listenplus.animalDelayMs', 220) || 0);
    const holdMs = Number(__cfg('playback.steps.listenplus.animalHoldMs', 650) || 0);
    const timeoutMs = Number(__cfg('playback.steps.listenplus.animalAudioTimeoutMs', 3000) || 3000);
    if (delayMs > 0) await __pqDelayWithAbort(delayMs, signal);
    __pqAssertNotAborted(signal);
    const el = __pqEnsureListenPlusOverlay();
    el.querySelector('.pq-lp-title').textContent = __pqListenPlusCfg('title', 'Listen+');
    el.querySelector('.pq-lp-arabic').textContent = __pqListenPlusArabicForKey(key);
    el.querySelector('.pq-lp-letter').textContent = item.letter || '';
    el.querySelector('.pq-lp-animal').textContent = item.animal || '';
    el.querySelector('.pq-lp-sub').textContent = __pqListenPlusCfg('subtitle', '');
    const img = el.querySelector('img');
    img.alt = item.animal || 'Animal';
    img.src = imgUrl;
    __pqPaintPopupImageBackground(img, imgUrl, __PQ_POPUP_IMAGE_BG);
    el.style.display = 'flex';
    setTimeout(function () { el.classList.add('show'); }, 20);
    
const __listenPlusRepeats = Number(__cfg('playback.steps.listenplus.anchorRepeats', 1) || 1);

for (let i = 0; i < __listenPlusRepeats; i++) {
  await __pqPlayListenPlusAudio(
    audioUrl,
    __cfg('playback.steps.listenplus.anchorPlaybackRate', rate),
    timeoutMs,
    signal
  );
}

    __pqAssertNotAborted(signal);
    if (holdMs > 0) await __pqDelayWithAbort(holdMs, signal);
    __pqHideListenPlusAnimal();
    return true;
  } catch (e) {
    __pqHideListenPlusAnimal();
    if (e && e.name === 'AbortError') throw e;
    return false;
  }
}



function __pqGetWordsCfg(path, fallback) {
  try {
    const root = __cfg('words', {}) || {};
    if (!path) return root;
    const parts = String(path).split('.');
    let cur = root;
    for (const part of parts) {
      if (!cur || typeof cur !== 'object' || !(part in cur)) return fallback;
      cur = cur[part];
    }
    return cur == null ? fallback : cur;
  } catch (_e) {
    return fallback;
  }
}

function __pqWordsLetterAudioSourceStep() {
  try {
    return String(
      __cfg(
        'playback.steps.words.letterAudioSourceStep',
        __cfg('playback.steps.words.linkedAudioSourceStep', 'listen')
      ) || 'listen'
    ).trim().toLowerCase() || 'listen';
  } catch (_e) {
    return 'listen';
  }
}

async function __pqPlayWordsModalLetterAudio(key, rate, signal) {
  if (signal && signal.aborted) {
    const err = new Error('Aborted');
    err.name = 'AbortError';
    throw err;
  }

  const mode = String(
    __cfg('playback.steps.words.modalLetterAudioMode', __pqGetWordsCfg('modalLetterAudioMode', 'sound')) || 'sound'
  ).trim().toLowerCase();

  const urls = [];

  try {
    const nameUrl = typeof __pqResolveLetterNameAudioUrlForKey === 'function'
      ? __pqResolveLetterNameAudioUrlForKey(key)
      : '';
    const soundUrl = typeof __pqResolveLetterSoundAudioUrlForKey === 'function'
      ? __pqResolveLetterSoundAudioUrlForKey(key)
      : '';

    if (mode === 'name') {
      if (nameUrl) urls.push(nameUrl);
    } else if (mode === 'both' || mode === 'linked' || mode === 'name_sound') {
      if (nameUrl) urls.push(nameUrl);
      if (soundUrl && soundUrl !== nameUrl) urls.push(soundUrl);
    } else {
      if (soundUrl) urls.push(soundUrl);
    }
  } catch (_e) {}

  if (!urls.length) {
    return false;
  }

  const repeats = Math.max(
    1,
    Math.floor(
      Number(
        __cfg('playback.steps.words.modalLetterRepeats', __pqGetWordsCfg('modalLetterRepeats', 1))
      ) || 1
    )
  );

  for (let repeatIndex = 0; repeatIndex < repeats; repeatIndex += 1) {
    for (let i = 0; i < urls.length; i += 1) {
      if (signal && signal.aborted) {
        const err = new Error('Aborted');
        err.name = 'AbortError';
        throw err;
      }

      const played = await __pqPlayConfiguredAudioUrl(urls[i], rate);
      if (!played) {
        throw new Error('words modal letter audio failed: ' + urls[i]);
      }
      if (i < urls.length - 1) {
        await __pqRepeatGapDelay(__pqLetterAudioSequenceGapMs(__pqWordsLetterAudioSourceStep()));
      }
    }

    if (repeatIndex < repeats - 1) {
      await __pqRepeatGapDelay(350);
    }
  }

  return true;
}

function __pqWordsAssetUrl(base, value, ext) {
  try {
    const raw = String(value || '').trim();
    if (!raw) return __pqAppendAssetVersion('');
    if (/^https?:\/\//i.test(raw)) return __pqAppendAssetVersion(raw);
    const cleanBase = String(base || '').trim();
    if (!cleanBase) return __pqAppendAssetVersion('');
    const hasExt = /\.[a-z0-9]{2,5}(\?|#|$)/i.test(raw);
    return __pqAppendAssetVersion(cleanBase.replace(/\/?$/, '/') + raw + (hasExt ? '' : String(ext || '')));
  } catch (_e) { return __pqAppendAssetVersion(''); }
}

function __pqEnsureWordsOverlay() {
  try {
    let el = document.getElementById('pqWordsOverlay');
    if (el) return el;

    if (!document.getElementById('pqWordsOverlayCss')) {
      const style = document.createElement('style');
      style.id = 'pqWordsOverlayCss';
      style.textContent =
        '#pqWordsOverlay{position:fixed;inset:0;z-index:99999;display:none;align-items:center;justify-content:center;pointer-events:none;background:rgba(8,15,28,.18);backdrop-filter:blur(3px);padding:22px}' +
        '#pqWordsOverlay .pq-words-card{width:min(820px,94vw);border-radius:36px;background:linear-gradient(180deg,#fff 0%,#fff7df 100%);border:5px solid rgba(255,255,255,.94);box-shadow:0 30px 86px rgba(18,29,52,.32);padding:34px;text-align:center;transform:translateY(12px) scale(.94);opacity:0;transition:opacity .18s ease,transform .18s ease;direction:rtl;pointer-events:auto}' +
        '#pqWordsOverlay.pq-show .pq-words-card{opacity:1;transform:translateY(0) scale(1)}' +
        '#pqWordsOverlay .pq-words-title{font-weight:900;font-size:1.55rem;color:#24324a;margin-bottom:18px}' +
        '#pqWordsOverlay .pq-words-img{width:min(500px,72vw);height:min(430px,54vh);object-fit:contain;display:block;margin:0 auto 24px;padding:20px;border-radius:30px;background:linear-gradient(180deg,#fff8df 0%,#fff1c4 100%);box-shadow:inset 0 0 0 4px rgba(255,255,255,.84),0 14px 32px rgba(124,86,27,.17)}' +
        '#pqWordsOverlay .pq-words-letter{display:inline-block;color:#17233b;font-weight:1000;font-size:3.4rem;margin-left:18px;vertical-align:middle;font-family:"Noto Sans Arabic","Amiri",system-ui,sans-serif;user-select:text}' +
        '#pqWordsOverlay .pq-words-word{font-weight:1000;font-size:3.4rem;color:#17233b;vertical-align:middle;font-family:"Noto Sans Arabic","Amiri",system-ui,sans-serif}' +
        '#pqWordsOverlay .pq-words-sub{margin-top:14px;font-weight:800;color:#5b6780;font-size:1.2rem;direction:ltr}' +
        '@media(max-width:700px){#pqWordsOverlay .pq-words-card{width:min(560px,94vw);padding:22px;border-radius:30px}#pqWordsOverlay .pq-words-img{width:min(340px,74vw);height:min(290px,42vh)}#pqWordsOverlay .pq-words-letter{font-size:2.35rem}#pqWordsOverlay .pq-words-word{font-size:2.35rem}}';
      document.head.appendChild(style);
    }

    el = document.createElement('div');
    el.id = 'pqWordsOverlay';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<div class="pq-words-card"><div class="pq-words-title"></div><img class="pq-words-img" alt=""><div><span class="pq-words-letter"></span><span class="pq-words-word"></span></div><div class="pq-words-sub"></div></div>';
    document.body.appendChild(el);
    return el;
  } catch (_e) { return null; }
}

function __pqShowWordsItem(meta) {
  try {
    const el = __pqEnsureWordsOverlay();
    if (!el || !meta) return null;
    const title = el.querySelector('.pq-words-title');
    const img = el.querySelector('.pq-words-img');
    const letter = el.querySelector('.pq-words-letter');
    const word = el.querySelector('.pq-words-word');
    const sub = el.querySelector('.pq-words-sub');

    if (title) title.textContent = __pqGetWordsCfg('title', 'Words');
    el.dataset.key = String(meta.key || '').trim();
    el.dataset.rate = String(meta.rate || '');

    if (letter) {
      letter.textContent = String(meta.letter || '').trim();
      letter.removeAttribute('role');
      letter.removeAttribute('tabindex');
      letter.removeAttribute('aria-label');
      letter.removeAttribute('title');
      letter.onkeydown = null;
    }
    if (word) word.textContent = String(meta.word || '').trim();
    if (sub) sub.textContent = __pqGetWordsCfg('subtitle', '');
    if (img) {
      img.alt = String(meta.word || 'Word');
      if (meta.imageUrl) {
        img.style.display = 'block';
        img.src = meta.imageUrl;
        __pqPaintPopupImageBackground(img, meta.imageUrl, __PQ_POPUP_IMAGE_BG);
      }
      else { img.style.display = 'none'; img.removeAttribute('src'); }
    }

    el.style.display = 'flex';
    window.setTimeout(function () { try { el.classList.add('pq-show'); } catch (_e) {} }, 20);
    return el;
  } catch (_e) { return null; }
}

function __pqHideWordsItem() {
  try {
    const el = document.getElementById('pqWordsOverlay');
    if (!el) return;
    el.classList.remove('pq-show');
    window.setTimeout(function () {
      try { if (!el.classList.contains('pq-show')) el.style.display = 'none'; } catch (_e) {}
    }, 220);
  } catch (_e) {}
}

async function __pqMaybeRunWordsItem(stepId, key, rate, signal) {
  try {
    if (String(stepId || '').toLowerCase() !== 'words') return false;
    if (__pqGetWordsCfg('enabled', true) === false) return false;

    const item = (__pqGetWordsCfg('map', {}) || {})[String(key || '')];
    if (!item) return false;

    const imageUrl = __pqWordsAssetUrl(__pqGetWordsCfg('imageBase', ''), item.image || item.img || '', __pqGetWordsCfg('imageExt', '.png'));
    const audioUrl = __pqWordsAssetUrl(__pqGetWordsCfg('audioBase', ''), item.audio || '', __pqGetWordsCfg('audioExt', '.mp3'));

    const delayMs = Number(__cfg('playback.steps.words.wordDelayMs', 220) || 0);
    const holdMs = Number(__cfg('playback.steps.words.wordHoldMs', 650) || 0);
    const timeoutMs = Number(__cfg('playback.steps.words.wordAudioTimeoutMs', 3000) || 3000);

    if (delayMs > 0) await __pqDelayWithAbort(delayMs, signal);
    __pqAssertNotAborted(signal);

    __pqShowWordsItem({ key, rate, letter: item.letter || '', word: item.word || '', imageUrl });

    await __pqPlayWordsModalLetterAudio(
      key,
      Number(__cfg('playback.steps.words.modalLetterPlaybackRate', 1) || 1) || 1,
      signal
    );
    __pqAssertNotAborted(signal);
    
const __wordRepeats = Math.max(
  1,
  Math.floor(
    Number(
      __cfg(
        'playback.steps.words.wordRepeats',
        __cfg('playback.steps.words.animalNameRepeats', __pqGetWordsCfg('wordRepeats', 3))
      ) || 3
    ) || 3
  )
);
const __wordRate = __cfg('playback.steps.words.wordPlaybackRate', __cfg('playback.steps.words.anchorPlaybackRate', rate));

for (let i = 0; i < __wordRepeats; i++) {
  await __pqPlayListenPlusAudio(
    audioUrl,
    __wordRate,
    timeoutMs,
    signal
  );
}


    __pqAssertNotAborted(signal);
    if (holdMs > 0) await __pqDelayWithAbort(holdMs, signal);

    __pqHideWordsItem();
    return true;
  } catch (_e) {
    try { __pqHideWordsItem(); } catch (_ignore) {}
    if (_e && _e.name === 'AbortError') throw _e;
    return false;
  }
}


/* ============================================================
   REPEAT STEP - LIGHT STUDENT RECORDING
   First letter requires Record click; next letters auto-record.
   ============================================================ */

const __pqRepeatRecordState = {
  stream: null,
  autoMode: false,
  attempts: Object.create(null),
  currentBlobUrl: '',
  isRecording: false
};

function __pqStopMediaStream(stream) {
  try {
    if (!stream || typeof stream.getTracks !== 'function') return;
    stream.getTracks().forEach(function (track) {
      try { track.stop(); } catch (_e) {}
    });
  } catch (_e) {}
}

function __pqReleaseRepeatMicStream() {
  try {
    __pqStopMediaStream(__pqRepeatRecordState.stream);
  } catch (_e) {}

  __pqRepeatRecordState.stream = null;

  try {
    if (__pqRepeatRecordState.currentBlobUrl) {
      URL.revokeObjectURL(__pqRepeatRecordState.currentBlobUrl);
    }
  } catch (_e) {}

  __pqRepeatRecordState.currentBlobUrl = '';
}

function __pqRepeatRecordCfg(key, fallback) {
  try {
    const root = __cfg('repeatRecording', {}) || {};
    if (!key) return root;
    return root[key] == null ? fallback : root[key];
  } catch (_e) {
    return fallback;
  }
}

function __pqEnsureRepeatRecordUi() {
  let el = document.getElementById('pqRepeatRecordOverlay');
  if (el) return el;

  if (!document.getElementById('pqRepeatRecordOverlayCss')) {
    const style = document.createElement('style');
    style.id = 'pqRepeatRecordOverlayCss';
    style.textContent = [
      '#pqRepeatRecordOverlay{position:fixed;inset:0;z-index:2147482900;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(8,15,28,.16);backdrop-filter:blur(4px)}',
      '#pqRepeatRecordOverlay .pq-repeat-card{width:min(540px,92vw);border-radius:32px;background:linear-gradient(180deg,#fff,#fff7df);border:4px solid rgba(255,255,255,.92);box-shadow:0 24px 70px rgba(18,29,52,.30);padding:28px;text-align:center;font-family:system-ui,-apple-system,Segoe UI,Arial,sans-serif}',
      '#pqRepeatRecordOverlay .pq-repeat-title{font-weight:1000;font-size:1.45rem;color:#17233b;margin-bottom:10px}',
      '#pqRepeatRecordOverlay .pq-repeat-letter{display:inline-flex;align-items:center;justify-content:center;min-width:118px;min-height:118px;padding:10px 24px;border-radius:32px;background:linear-gradient(180deg,#eaffef,#c8f4d4);font-family:"Noto Naskh Arabic","Noto Sans Arabic","Amiri",serif;font-weight:1000;font-size:6.5rem;line-height:1;color:#079238;margin:8px auto 14px;box-shadow:inset 0 0 0 3px rgba(255,255,255,.9),0 10px 24px rgba(7,146,56,.16);direction:rtl}',
      '#pqRepeatRecordOverlay .pq-repeat-msg{font-weight:900;color:#31425d;margin:10px 0 20px;font-size:1.08rem}',
      '#pqRepeatRecordOverlay .pq-repeat-actions{display:flex;gap:14px;justify-content:center;flex-wrap:wrap}',
      '#pqRepeatRecordOverlay button{border:0;border-radius:26px;padding:20px 32px;font-weight:1000;font-size:1.35rem;cursor:pointer;min-width:180px;min-height:78px}',
      '#pqRepeatRecordOverlay .pq-repeat-record{background:linear-gradient(180deg,#fff3cf,#ffe0a1);color:#0b5132;box-shadow:inset 0 0 0 3px rgba(255,255,255,.82),0 12px 26px rgba(124,86,27,.18)}',
      '#pqRepeatRecordOverlay .pq-repeat-record::first-letter{font-size:1.8em}',
      '#pqRepeatRecordOverlay button:disabled{opacity:.65;cursor:wait}'
    ].join('\n');
    document.head.appendChild(style);
  }

  el = document.createElement('div');
  el.id = 'pqRepeatRecordOverlay';
  el.innerHTML = [
    '<div class="pq-repeat-card" role="dialog" aria-modal="true">',
      '<div class="pq-repeat-title">Your turn - repeat the letter</div>',
      '<div class="pq-repeat-letter"></div>',
      '<div class="pq-repeat-msg">Tap Record, then say the letter.</div>',
      '<div class="pq-repeat-actions">',
        '<button type="button" class="pq-repeat-record">Record</button>',
      '</div>',
    '</div>'
  ].join('');

  document.body.appendChild(el);
  return el;
}

function __pqShowRepeatRecordUi(key, message) {
  const el = __pqEnsureRepeatRecordUi();
  try {
    const letter = (LETTERS || []).find(function (item) {
      return item && String(item.key) === String(key);
    });

    const txt =
      (letter && (letter.text || letter.ar || letter.letter)) ||
      String(key || '');

    el.querySelector('.pq-repeat-letter').textContent = txt;
    el.querySelector('.pq-repeat-msg').textContent = message || 'Tap Record, then say the letter.';
    el.style.display = 'flex';
  } catch (_e) {}

  return el;
}

function __pqHideRepeatRecordUi() {
  try {
    const el = document.getElementById('pqRepeatRecordOverlay');
    if (el) el.style.display = 'none';
  } catch (_e) {}

  __pqReleaseRepeatMicStream();
}

async function __pqEnsureRepeatMicStream() {
  if (__pqRepeatRecordState.stream) return __pqRepeatRecordState.stream;

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error('Microphone recording is not supported in this browser.');
  }

  __pqRepeatRecordState.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  return __pqRepeatRecordState.stream;
}

function __pqRecordRepeatOnce(stream, ms, signal) {
  return new Promise(function (resolve) {
    try {
      if (!stream || (signal && signal.aborted)) {
        resolve(null);
        return;
      }

      const chunks = [];
      const rec = new MediaRecorder(stream);
      let stopped = false;

      function stopSafe() {
        if (stopped) return;
        stopped = true;
        try {
          if (rec.state !== 'inactive') rec.stop();
        } catch (_e) {
          resolve(null);
        }
      }

      rec.ondataavailable = function (ev) {
        try {
          if (ev && ev.data && ev.data.size > 0) chunks.push(ev.data);
        } catch (_e) {}
      };

      rec.onstop = function () {
        try {
          const blob = chunks.length ? new Blob(chunks, { type: rec.mimeType || 'audio/webm' }) : null;
          resolve(blob);
        } catch (_e) {
          resolve(null);
        }
      };

      rec.onerror = function () {
        resolve(null);
      };

      if (signal) {
        signal.addEventListener('abort', stopSafe, { once: true });
      }

      rec.start();
      window.setTimeout(stopSafe, Math.max(600, Number(ms || 1400) || 1400));
    } catch (_e) {
      resolve(null);
    }
  });
}

async function __pqPlayRepeatStudentBlob(blob) {
  try {
    if (!blob) return false;

    if (__pqRepeatRecordState.currentBlobUrl) {
      try { URL.revokeObjectURL(__pqRepeatRecordState.currentBlobUrl); } catch (_e) {}
      __pqRepeatRecordState.currentBlobUrl = '';
    }

    const url = URL.createObjectURL(blob);
    __pqRepeatRecordState.currentBlobUrl = url;

    const a = new Audio(url);

    await new Promise(function (resolve) {
      let done = false;

      function finish() {
        if (done) return;
        done = true;
        try { a.pause(); } catch (_e) {}
        resolve();
      }

      a.onended = finish;
      a.onerror = finish;

      const p = a.play();
      if (p && p.catch) p.catch(finish);
    });

    return true;
  } catch (_e) {
    return false;
  }
}

async function __pqRepeatRecordAttempt(key, rate, signal, attemptNumber, maxAttempts) {
  try {
    if (signal && signal.aborted) return false;

    if (__pqRepeatRecordCfg('enabled', true) === false) return true;

    const ms = Number(__pqRepeatRecordCfg('recordMs', 1400) || 1400);
    const replayStudent = __pqRepeatRecordCfg('replayStudent', true) !== false;
    attemptNumber = Math.max(1, Number(attemptNumber || 1) || 1);
    maxAttempts = Math.max(1, Number(maxAttempts || 1) || 1);
    const chanceLabel = maxAttempts > 1 ? ' Chance ' + attemptNumber + ' of ' + maxAttempts + '.' : '';

    const el = __pqShowRepeatRecordUi(
      key,
      __pqRepeatRecordState.autoMode
        ? 'Recording starts now. Say the letter.' + chanceLabel
        : 'Tap Record, then say the letter.' + chanceLabel
    );

    const recordBtn = el.querySelector('.pq-repeat-record');

    async function runRecording() {
      try {
        __pqRepeatRecordState.isRecording = true;

        if (recordBtn) {
          recordBtn.disabled = true;
          recordBtn.textContent = 'Recording...';
        }

        const stream = await __pqEnsureRepeatMicStream();
        __pqRepeatRecordState.autoMode = true;

        const blob = await __pqRecordRepeatOnce(stream, ms, signal);
        const quality = (typeof __pqRepeatQualityCheck === 'function')
          ? await __pqRepeatQualityCheck(key, blob)
          : { ok: !!blob, code: 'unchecked', message: blob ? 'Good try!' : 'Try again.' };

        __pqRepeatRecordState.attempts[String(key)] = {
          at: Date.now(),
          attempt: attemptNumber,
          maxAttempts: maxAttempts,
          ok: !!blob,
          qualityOk: !!(quality && quality.ok),
          qualityCode: quality && quality.code ? String(quality.code) : '',
          size: blob ? blob.size : 0
        };

        if (recordBtn && (!quality || !quality.ok)) {
          recordBtn.textContent = 'Try again';
        }

        if (!quality || !quality.ok) {
          try {
            el.querySelector('.pq-repeat-msg').textContent =
              ((quality && quality.message) ||
              (blob ? 'Try again.' : 'I did not hear your voice. Try again.')) +
              chanceLabel;
          } catch (_e) {}
          await __pqDelayWithAbort(Number(__pqRepeatRecordCfg('feedbackHoldMs', 950) || 950), signal);
        }

        return !!(quality && quality.ok);
      } catch (_e) {
        try { el.querySelector('.pq-repeat-msg').textContent = 'Microphone was not ready. Tap Record again.'; } catch (_ignore) {}
        if (recordBtn) {
          recordBtn.disabled = false;
          recordBtn.textContent = 'Record';
        }
        return false;
      } finally {
        __pqRepeatRecordState.isRecording = false;
      }
    }

    if (__pqRepeatRecordState.autoMode) {
      await __pqDelayWithAbort(Number(__pqRepeatRecordCfg('autoStartDelayMs', 450) || 450), signal);
      const ok = await runRecording();
      __pqHideRepeatRecordUi();
      return ok;
    }

    return await new Promise(function (resolve) {
      let resolved = false;

      function finish(ok) {
        if (resolved) return;
        resolved = true;
        __pqHideRepeatRecordUi();
        resolve(!!ok);
      }

      if (signal) {
        if (signal.aborted) {
          finish(false);
          return;
        }

        signal.addEventListener('abort', function () {
          finish(false);
        }, { once: true });
      }

      if (!recordBtn) {
        finish(false);
        return;
      }

      recordBtn.disabled = false;
      recordBtn.textContent = 'Record';

      recordBtn.addEventListener('click', async function () {
        const ok = await runRecording();
        finish(ok);
      }, { once: true });
    });
  } catch (_e) {
    try { __pqHideRepeatRecordUi(); } catch (_ignore) {}
    return false;
  }
}

async function __pqPlayAllPlaylistLocal(stepId) {
    const controller = __pqStartPlayAllController();
    const signal = controller ? controller.signal : null;

    const rate = parseFloat((speedSel && speedSel.value) || DEFAULTS.speed || '1');
    const rawStepId = String(stepId || '').toLowerCase();
    const finalStepId = __pqCanonicalStepId(rawStepId);
    const repeatFallback = parseInt((repeatSel && repeatSel.value) || DEFAULTS.repeat || '1', 10) || 1;
    const repeatCount = __pqGetStepRepeatPerLetter(finalStepId, repeatFallback);
    const keys = __pqGetVisibleSequenceKeys(finalStepId);

    if (!keys.length) return;

    playingAll = true;
    paused = false;
    __pqSetPlaylistDimming(false);

    try {
      if (btnPause) {
        btnPause.disabled = false;
        if (typeof __pqSetBilingualControlLabel === 'function') {
          __pqSetBilingualControlLabel(btnPause, 'Pause', '');
        } else {
          btnPause.textContent = __PQ_TEXT_CACHE.pause;
        }
      }
    } catch (_e) {}

    try {
      if (btnPlayAll) {
        btnPlayAll.disabled = true;
        btnPlayAll.textContent = __PQ_TEXT_CACHE.playAll;
      }
    } catch (_e) {}

    try {
      await __pqStepDelay(finalStepId, 'beforeStartMs', signal);

      for (const key of keys) {
        __pqAssertNotAborted(signal);

        try {
          const tile = grid
            ? grid.querySelector('.tile[data-key="' + String(key).replace(/"/g, '\\\"') + '"]')
            : null;

          const gidx = tile ? Number(tile.dataset.gidx || -1) : -1;
          selectedIdx = Number.isFinite(gidx) ? gidx : -1;
          selectedKey = key;

          markActive();

          try {
            if (typeof __pqSetPlayingTile === 'function') {
              __pqSetPlayingTile(key);
            }
          } catch (_e) {}

          try {
            __pqSyncWriteUI();
          } catch (_e) {}

          alScrollToKey(key);
        } catch (_e) {}

        await pauseGate(signal);
        __pqAssertNotAborted(signal);

        const shouldPlayLetterBeforeModal = finalStepId !== 'words';
        const letterPlaybackStepId = finalStepId;

        if (shouldPlayLetterBeforeModal) {
          await playLetter(key, repeatCount, rate, letterPlaybackStepId);
        }

        if (finalStepId === 'repeat') {
          const maxAttempts = Math.max(1, Number(__pqRepeatRecordCfg('maxAttempts', 3) || 3) || 3);
          const retryDelayMs = Math.max(0, Number(__pqRepeatRecordCfg('retryDelayMs', 600) || 600) || 0);
          let repeatOk = false;

          for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
            repeatOk = await __pqRepeatRecordAttempt(key, rate, signal, attempt, maxAttempts);
            __pqAssertNotAborted(signal);

            if (repeatOk) break;
            if (attempt >= maxAttempts) break;

            await __pqDelayWithAbort(retryDelayMs, signal);
            __pqAssertNotAborted(signal);
            await playLetter(key, repeatCount, rate, letterPlaybackStepId);
          }
        }

        __pqAssertNotAborted(signal);

        await __pqMaybeRunListenPlusAnimal(finalStepId, key, rate, signal);

        __pqAssertNotAborted(signal);

        await __pqMaybeRunWordsItem(finalStepId, key, rate, signal);

        __pqAssertNotAborted(signal);

        try {
          handleLetterPlayedForCurrentStep(key);
        } catch (_e) {}

        await __pqStepDelay(finalStepId, 'betweenLettersMs', signal);
      }

      await __pqStepDelay(finalStepId, 'afterCompleteMs', signal);
      __pqCloseActiveMediaWindows();

      const current = getCurrentStep();
      const resolvedStepId = String(
        (current && current.step && current.step.id) || finalStepId || ''
      );

      if (resolvedStepId) {
        await markPlaylistStepCompleted(resolvedStepId);
      }
    } catch (_e) {
      if (!_e || _e.name !== 'AbortError') {
        throw _e;
      }
    } finally {
      const stillOwner = !!(
        __playAllController &&
        controller &&
        __playAllController === controller
      );

      if (stillOwner) {
        __playAllController = null;
      }

      __pqSetPlaylistDimming(false);
      playingAll = false;
      paused = false;

      try {
        if (typeof __pqClearPlayingTile === 'function') {
          __pqClearPlayingTile();
        }
      } catch (_e) {}

      try {
        if (btnPlayAll) {
          btnPlayAll.disabled = false;
          btnPlayAll.textContent = __PQ_TEXT_CACHE.playAll;
        }
      } catch (_e) {}

      try {
        if (btnPause) {
          btnPause.disabled = false;
          if (typeof __pqSetBilingualControlLabel === 'function') {
            __pqSetBilingualControlLabel(btnPause, 'Pause', '');
          } else {
            btnPause.textContent = __PQ_TEXT_CACHE.pause;
          }
        }
      } catch (_e) {}
    }
  }

function __pqPlayingVideos() {
  try {
    return Array.from(document.querySelectorAll('video')).filter(function (video) {
      return video && !video.paused && !video.ended;
    });
  } catch (_e) {
    return [];
  }
}

function __pqWaitForVideoPlaybackToSettle() {
  const videos = __pqPlayingVideos();
  if (!videos.length) return Promise.resolve();

  return new Promise(function (resolve) {
    let done = false;
    const cleanupFns = [];

    const finish = function () {
      if (done) return;
      if (__pqPlayingVideos().length) return;
      done = true;
      cleanupFns.forEach(function (cleanup) {
        try { cleanup(); } catch (_e) {}
      });
      resolve();
    };

    videos.forEach(function (video) {
      const onEnded = finish;
      const onPause = finish;
      video.addEventListener('ended', onEnded);
      video.addEventListener('pause', onPause);
      cleanupFns.push(function () {
        video.removeEventListener('ended', onEnded);
        video.removeEventListener('pause', onPause);
      });
    });

    window.setTimeout(finish, 300);
  });
}

async function __pqRunMatchStep() {
  if (!window.PQSharedMatchEngine) return;

  const rate = parseFloat((speedSel && speedSel.value) || DEFAULTS.speed || '1') || 1;

  return PQSharedMatchEngine.mount({
    cfg: UNIT_CFG,
    stepId: 'match',
    gridId: 'grid',

    getSequenceKeys: function () {
      return __pqGetPassSequenceKeys('match', PLAY_SEQUENCE_KEYS);
    },

    playAudioForKey: function (key) {
          // PATCH_PLAYING_TILE_IN_MATCH_AUDIO
          try { __pqSetPlayingTile(key); } catch (_e) {}
      return __pqWaitForVideoPlaybackToSettle().then(function () {
        return playLetterOnce(key, rate);
      });
    },

    onComplete: function () {
      completeCurrentStep();
    }
  });
}


  /* ===== PQ PLAYING TILE EFFECT HELPERS START ===== */
  
  /* ===== PQ PLAYING TILE EFFECT CSS START ===== */
  function __pqInjectPlayingTileEffectCss() {
    try {
      if (document.getElementById('pqPlayingTileEffectCss')) return;

      const style = document.createElement('style');
      style.id = 'pqPlayingTileEffectCss';

      style.textContent = [
        '.tile.pq-playing{',
        '  animation:pqTilePlayBounce 850ms ease-in-out both !important;',
        '  border-color:#58c985 !important;',
        '  background:radial-gradient(circle at top,#ffffff,#dff8e8 60%,rgba(122,216,156,.28)) !important;',
        '  box-shadow:0 0 0 5px rgba(255,255,255,.95),0 0 0 12px rgba(122,216,156,.48),0 18px 34px rgba(18,91,58,.24) !important;',
        '  transform:translateY(-8px) scale(1.08) !important;',
        '  z-index:30 !important;',
        '}',
        '@keyframes pqTilePlayBounce{',
        '  0%{transform:translateY(0) scale(1);}',
        '  35%{transform:translateY(-12px) scale(1.10);}',
        '  65%{transform:translateY(-7px) scale(1.06);}',
        '  100%{transform:translateY(-8px) scale(1.08);}',
        '}'
      ].join('\n');

      document.head.appendChild(style);
    } catch (_e) {}
  }
  /* ===== PQ PLAYING TILE EFFECT CSS END ===== */

function __pqClearPlayingTile() {
    try {
      document.querySelectorAll('.tile.pq-playing').forEach(function (tile) {
        tile.classList.remove('pq-playing');
      });
    } catch (_e) {}
  }

  function __pqSetPlayingTile(key) {
    __pqInjectPlayingTileEffectCss();
    try {
      __pqClearPlayingTile();

      const safeKey = String(key || '');
      if (!safeKey) return;

      const tile = document.querySelector('.tile[data-key="' + safeKey.replace(/"/g, '\\"') + '"]');
      if (!tile) return;

      tile.classList.add('pq-playing');

      const cfgEffect =
        (typeof UNIT_CFG !== 'undefined' && UNIT_CFG && UNIT_CFG.activeTileEffect) ||
        (typeof cfg !== 'undefined' && cfg && cfg.activeTileEffect) ||
        {};

      const duration = Number(cfgEffect.durationMs || 900);

      window.setTimeout(function () {
        try {
          tile.classList.remove('pq-playing');
        } catch (_e) {}
      }, Math.max(250, duration));
    } catch (_e) {}
  }
  /* ===== PQ PLAYING TILE EFFECT HELPERS END ===== */

try {
  window.__pqDemoRunPlaybackAction = function (action, key, stepId) {
    const finalAction = String(action || '').toLowerCase();
    const finalKey = String(key || 'alph_1');
    const finalStepId = String(stepId || '').toLowerCase();
    const controller = new AbortController();
    window.__pqDemoPlaybackController = controller;

    if (finalAction === 'watch' || finalAction === 'phonetics' || finalAction === 'animate') {
      const playbackStepId = finalAction === 'phonetics' ? 'sound' : (finalStepId || finalAction);
      playWatchVideoForKey(finalKey, 1, playbackStepId, controller.signal).catch(function () {});
      return true;
    }

    if (finalAction === 'letterclue') {
      __pqMaybeRunListenPlusAnimal('listenplus', finalKey, 1, controller.signal).catch(function () {});
      return true;
    }

    if (finalAction === 'soundclue') {
      __pqMaybeRunWordsItem('words', finalKey, 1, controller.signal).catch(function () {});
      return true;
    }

    if (finalAction === 'repeat' && typeof __pqShowRepeatRecordUi === 'function') {
      __pqShowRepeatRecordUi(finalKey, 'Tap Record, then say the letter. Chance 1 of 3');
      return true;
    }

    return false;
  };
} catch (_e) {}

async function playAll() {
  try {
    const current = getCurrentStep();
    const rawStepId = String((current && current.step && current.step.id) || '').toLowerCase();
    const stepId = __pqCanonicalStepId(rawStepId);

    if (__pqLastPlayAllStepId !== stepId) {
      __pqLastPlayAllStepId = stepId;
      __pqPlaylistEngine = null;
      paused = false;
      __watchPaused = false;
      __watchPlaying = false;

      try {
        if (btnPause) {
          if (typeof __pqSetBilingualControlLabel === 'function') {
            __pqSetBilingualControlLabel(btnPause, 'Pause', '');
          } else {
            btnPause.textContent = __PQ_TEXT_CACHE.pause;
          }
        }
      } catch (_e) {}
    }

    __pqCancelPlayAll();

    if (current && __pqIsWatchStep(current.step)) {
      return playAllWatch(stepId);
    }

    if (stepId === 'match') {
      return __pqRunMatchStep();
    }

    if (
  current &&
  current.step &&
  (
    current.step.type === 'playlist' ||
    stepId === 'listenplus' ||
    stepId === 'words'
  )
) {
  return __pqPlayAllPlaylistLocal(stepId);
}
	
  } catch (_e) {}

  return undefined;
}

  // ============================================================
  // PART 2 END
  // ============================================================

