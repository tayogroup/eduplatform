
  /* ==== the shared engine, second half ======================================
     The cards, the frame and the export. HUE, KINDS and titleMotif come from
     the film's scenes file (see ehel-film-engine-head.js). */
  if (typeof HUE !== "object" || typeof KINDS !== "object" || typeof titleMotif !== "function")
    throw new Error("the scenes file must define HUE, KINDS and titleMotif");

  /* ---- the title card and the end card ---------------------------------
     The maths film's cards: silent timeline segments, not beats. */
  function openCard(t) {
    var c = F.cards.open;
    var u = clamp((t - c.start) / Math.max(c.end - c.start, 0.001), 0, 1);
    var a = inAt(t, c.start + 0.15, 0.85);
    var b = inAt(t, c.start + 0.55, 0.9);
    var d = inAt(t, c.start + 1.15, 0.9);
    var out = 1 - ease((u - 0.86) / 0.14);
    return '<div class="card-slide open" style="opacity:' + (a * out).toFixed(3) + '">' +
      '<div class="cs-fig" style="opacity:' + (a * 0.13).toFixed(3) +
        ";transform:scale(" + (1.04 + u * 0.05).toFixed(4) + ')">' + titleMotif({ t: t }) + "</div>" +
      '<div class="cs-in">' +
        '<div class="cs-mark" style="opacity:' + a.toFixed(3) +
          ";transform:scale(" + (0.86 + a * 0.14).toFixed(3) + ')">E</div>' +
        '<p class="eyebrow" style="opacity:' + a.toFixed(3) + '">Ehel Academy · ' + esc(F.subtitle) + "</p>" +
        '<h1 style="opacity:' + b.toFixed(3) + ";transform:translateY(" + ((1 - b) * 18).toFixed(2) + 'px)">' +
          esc(F.title) + "</h1>" +
        '<div class="cs-rule" style="transform:scaleX(' + d.toFixed(3) + ')"></div>' +
        '<p class="cs-by" style="opacity:' + d.toFixed(3) +
          ";transform:translateY(" + ((1 - d) * 8).toFixed(2) + 'px)">' +
          "A short unit lecture by the Ehel Academy Virtual Teacher</p>" +
        '<p class="cs-sub" style="opacity:' + inAt(t, c.start + 1.55, 0.8).toFixed(3) +
          '">' + esc(F.framework || "Cambridge Primary Computing 0059") + " · Stage " + esc(F.stage) + "</p>" +
      "</div></div>";
  }

  function endCard(t) {
    var c = F.cards.end;
    var u = clamp((t - c.start) / Math.max(c.end - c.start, 0.001), 0, 1);
    var a = inAt(t, c.start + 0.35, 0.8);
    var b = inAt(t, c.start + 0.85, 0.8);
    var codes = (F.objectives || []).map(function (o, n) {
      var k = inAt(t, c.start + 1.15 + n * 0.09, 0.5);
      return '<span style="opacity:' + k.toFixed(3) +
        ";transform:translateY(" + ((1 - k) * 8).toFixed(2) + 'px)">' + esc(o[0]) + "</span>";
    }).join("");
    return '<div class="card-slide end" style="opacity:' + a.toFixed(3) + '">' +
      '<div class="cs-fig" style="opacity:' + (a * 0.11).toFixed(3) +
        ";transform:scale(" + (1.0 + u * 0.05).toFixed(4) + ')">' + titleMotif({ t: t }) + "</div>" +
      '<div class="cs-in">' +
        '<p class="eyebrow" style="opacity:' + a.toFixed(3) + '">That is the whole lesson</p>' +
        '<h1 style="opacity:' + a.toFixed(3) + ";transform:translateY(" + ((1 - a) * 14).toFixed(2) + 'px)">' +
          esc(F.title) + "</h1>" +
        '<div class="cs-rule" style="transform:scaleX(' + b.toFixed(3) + ')"></div>' +
        '<p class="cs-cap" style="opacity:' + b.toFixed(3) + '">What this lesson covered</p>' +
        '<div class="cs-codes">' + codes + "</div>" +
        '<p class="cs-sign" style="opacity:' + inAt(t, c.start + 2.2, 0.8).toFixed(3) + '">' +
          '<span class="cs-mark sm">E</span>Ehel Academy · ' + esc(F.subtitle) + "</p>" +
      "</div></div>";
  }

  /* ---- the frame --------------------------------------------------------- */
  function frame(t) {
    var film = document.getElementById("film");
    if (F.cards && t < F.cards.open.end) {
      film.style.setProperty("--hue", HUE.title);
      film.innerHTML = openCard(t);
      return;
    }
    if (F.cards && t >= F.cards.end.start) {
      film.style.setProperty("--hue", HUE.recap);
      film.innerHTML = endCard(t);
      return;
    }

    var i = beatAt(t);
    var beat = BEATS[i];
    var scene = F.scenes[beat.scene];
    var draw = KINDS[scene.kind];
    if (!draw) throw new Error("storyboard scene " + scene.id + ": no drawing for kind " + scene.kind);

    var fade = inAt(t, scene.start, 0.4);
    film.style.setProperty("--hue", HUE[scene.id] || P.teal);

    var span = Math.max(scene.end - scene.start, 0.001);
    var d = clamp((t - scene.start) / span, 0, 1);

    film.innerHTML =
      chrome(scene, t) +
      '<main class="stage" style="opacity:' + fade.toFixed(3) +
        ";transform:translateY(" + ((1 - fade) * 14 - d * 4).toFixed(2) +
        "px) scale(" + (1 + d * 0.008).toFixed(4) + ')">' +
        heading(scene, t, i) +
        draw(scene, beat, t, i) +
      "</main>" +
      band(beat, t);
  }

  /* cues(i) is for checking, not rendering: when each named phrase of beat i
     is estimated to be said, so a frame can be taken exactly there */
  window.EHEL_FILM = {
    frame: frame,
    total: TOTAL,
    cues: function (i) {
      var at = (BEATS[i].art && BEATS[i].art.at) || {}, out = {};
      Object.keys(at).forEach(function (k) { out[k] = cue(i, k); });
      return { start: BEATS[i].start, spokenEnd: spokenEnd(i), cues: out };
    }
  };
})();
