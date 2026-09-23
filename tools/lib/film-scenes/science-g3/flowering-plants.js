  /* ==== Grade 3 Science, Lesson 2: Flowering Plants ===========================
     tools/lib/film-scenes/science-g3/flowering-plants.js, with -2.js, -3.js and
     -4.js: the film's pictures, after the shared marks (MK) and before the
     engine's tail, all in one scope. The storyboard is
     science/grade-3-app/lecture-video/flowering-plants.json.

     The lesson's own drawings come from ART, so the child sees here what they
     tap two steps later: the tap figure of its "Tap the part" step
     (ART.figure("plant"): roots, stem, leaves and flower, one named at a
     time), the warm-and-cold test of its experiment step (ART.pots with the
     plantWarm sim's own options: labelA "warm place", labelB "cold place",
     sun, coldB) and the two rows of its record step, with the lesson's own
     choices and pictures.

     This file: the palette, the timing helpers, the small drawings every
     chapter shares, and the title motif. Every top-level name here starts
     with fp, so nothing can replace a name of the engine, ART or MK. */

  var HUE = {
    title: P.teal, rootstem: P.blue, leafflower: P.good, warmcold: P.gold,
    fairtest: P.plum, record: P.accent, conclude: P.blue, recap: P.teal
  };

  /* ---- timing ---------------------------------------------------------------- */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 comes
     in: for a thing that belongs to that beat alone (rule 7) */
  function fpOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function fpFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }
  /* fixed numbers for anything scattered: never Math.random */
  var FP_SCATTER = [0.17, 0.63, 0.38, 0.91, 0.24, 0.55, 0.08, 0.86, 0.44, 0.72, 0.31, 0.97];

  /* ---- small drawings of the film's own --------------------------------------- */

  /* a drop of water, its round bottom centred on (x, y). col is for the
     drawings with a pale sky behind them, where #7FC4EA all but disappears. */
  function fpDrop(x, y, r, o, col) {
    if (!(o > 0)) return "";
    col = col || "#7FC4EA";
    return G(Pth("M" + n2(x - r * 0.9) + "," + n2(y - r * 0.42) + " L" + n2(x) + "," + n2(y - r * 2.1) +
        " L" + n2(x + r * 0.9) + "," + n2(y - r * 0.42) + " Z", col) +
      C(x, y, r, col) + C(x - r * 0.34, y - r * 0.28, r * 0.28, "#FFFFFF", null, null, { opacity: 0.75 }),
      { opacity: clamp(o, 0, 1) });
  }

  /* the Sun, the kit's gold, with eight rays turning slowly */
  function fpSun(cx, cy, r, o, t) {
    if (!(o > 0)) return "";
    var rays = "", a0 = (t || 0) * 0.3;
    for (var k = 0; k < 8; k++) {
      var a = a0 + k * Math.PI / 4;
      rays += L(cx + Math.cos(a) * r * 1.32, cy + Math.sin(a) * r * 1.32, cx + Math.cos(a) * r * 1.78, cy + Math.sin(a) * r * 1.78, P.gold, r * 0.2);
    }
    return G(MK.glow(cx, cy, r * 2.3, P.gold, 1) + rays + C(cx, cy, r, P.gold), { opacity: clamp(o, 0, 1) });
  }

  /* a seed, the colour of the lesson's (SCENES.plant draws #C7A76B) */
  function fpSeed(cx, cy, rx, rot, o) {
    if (!(o > 0)) return "";
    return G(E(0, 0, rx, rx * 0.7, "#C7A76B", "#8B6A3A", Math.max(1, rx * 0.16)),
      { transform: "translate(" + n2(cx) + "," + n2(cy) + ") rotate(" + n2(rot || 0) + ")", opacity: clamp(o, 0, 1) });
  }

  /* a small new plant: a stem and two leaves, grown to u (0..1), standing on (x, y) */
  function fpSprout(x, y, h, u) {
    if (!(u > 0)) return "";
    var top = y - h * u, lu = clamp((u - 0.45) / 0.55, 0, 1), s = h * 0.42 * lu;
    return L(x, y, x, top, "#4CB65C", Math.max(2, h * 0.12)) +
      (lu > 0 ? Pth("M" + n2(x) + "," + n2(top + 2) + " q" + n2(-s * 0.9) + "," + n2(-s * 0.1) + " " + n2(-s * 1.1) + "," + n2(-s * 0.8) + " q" + n2(s * 0.8) + ",0 " + n2(s * 1.1) + "," + n2(s * 0.8) + "z", "#4CB65C") +
        Pth("M" + n2(x) + "," + n2(top + 2) + " q" + n2(s * 0.9) + "," + n2(-s * 0.1) + " " + n2(s * 1.1) + "," + n2(-s * 0.8) + " q" + n2(-s * 0.8) + ",0 " + n2(-s * 1.1) + "," + n2(s * 0.8) + "z", "#4CB65C") : "");
  }

  /* a four-pointed sparkle: the food a leaf makes */
  function fpSpark(x, y, r, col, o) {
    if (!(o > 0)) return "";
    return Pth("M" + n2(x) + "," + n2(y - r) + " L" + n2(x + r * 0.3) + "," + n2(y - r * 0.3) + " L" + n2(x + r) + "," + n2(y) +
      " L" + n2(x + r * 0.3) + "," + n2(y + r * 0.3) + " L" + n2(x) + "," + n2(y + r) + " L" + n2(x - r * 0.3) + "," + n2(y + r * 0.3) +
      " L" + n2(x - r) + "," + n2(y) + " L" + n2(x - r * 0.3) + "," + n2(y - r * 0.3) + " Z", col || "#FFF3B0", null, null, { opacity: clamp(o, 0, 1) });
  }

  /* a snowflake, six arms, centred on (x, y): the cold place */
  function fpFlake(x, y, r, o) {
    if (!(o > 0)) return "";
    var out = "";
    for (var k = 0; k < 6; k++) {
      var a = k * Math.PI / 3, ex = x + Math.cos(a) * r, ey = y + Math.sin(a) * r;
      out += L(x, y, ex, ey, "#BFE3F5", Math.max(2, r * 0.13));
      out += L(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55,
        x + Math.cos(a) * r * 0.55 + Math.cos(a + 0.9) * r * 0.3, y + Math.sin(a) * r * 0.55 + Math.sin(a + 0.9) * r * 0.3, "#BFE3F5", Math.max(1.5, r * 0.1));
      out += L(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55,
        x + Math.cos(a) * r * 0.55 + Math.cos(a - 0.9) * r * 0.3, y + Math.sin(a) * r * 0.55 + Math.sin(a - 0.9) * r * 0.3, "#BFE3F5", Math.max(1.5, r * 0.1));
    }
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* a word in a pill, with a leader line from it to the thing it names. The
     newest is gold; one named before it keeps its line, quieter. */
  function fpLabel(t, x, y, text, at, to, now, size) {
    var o = on(t, at, 0.4);
    if (o <= 0) return "";
    var col = now ? P.gold : P.muted;
    return MK.leader(x - 8, y, to[0], to[1], on(t, at, 0.6), col) +
      MK.pill(x, y, text, o, { size: size || 26, anchor: "start", col: now ? P.gold : P.line });
  }

  /* ==== the title =================================================================
     The lesson's tap figure in a round window. In the spoken title chapter the
     four parts light one at a time, from the roots up, on "four main parts";
     each part's job shows beside it on "a job to do"; on "what a plant needs"
     the three things it needs line up under it. On the two cards it stands. */
  var FP_PARTS = ["roots", "stem", "leaves", "flower"];
  function fpMotifFigure(t, o) {
    var fig = ART.figure("plant");
    if (!o.scene) return fig;
    var four = sc(o.scene, 0, "four");
    if (four == null || t < four) return fig;
    var step = (t - four) / 0.3, lit = Math.floor(step);
    FP_PARTS.forEach(function (p, n) {
      if (n > lit) fig = ART.dim(fig, p, 0.35);
      else if (n === lit && lit < 4) fig = ART.ring(fig, p, "rgba(244,201,93," + n2(clamp(1 - (step - lit) * 0.6, 0, 1)) + ")", 6);
    });
    return fig;
  }
  function titleMotif(o) {
    var t = o.t || 0, out = "";
    /* the figure's 320 x 360 drawn at 300 x 337.5 from (30, 12) */
    var fx = function (v) { return 30 + v * 0.9375; }, fy = function (v) { return 12 + v * 0.9375; };
    var jobAt = o.scene ? sc(o.scene, 0, "job") : null, needAt = o.scene ? sc(o.scene, 1, "needs") : null;
    var doesAt = o.scene ? sc(o.scene, 1, "does") : null;
    /* "what each part does": the four jobs already drawn each swell in turn,
       roots first, so the second line names what the first line put there */
    var jobPulse = function (k, x, y, m) {
      return m && G(m, { transform: around(x, y, 1 + 0.26 * bump(t, doesAt == null ? null : doesAt + k * 0.22, 0.55)) });
    };
    out += el("clipPath", { id: "fpMotifClip" }, C(180, 180, 172));
    out += C(180, 180, 172, "#123247");
    out += MK.glow(180, 170, 168, P.good, on(t, needAt, 0.6) * (0.7 + 0.3 * breathe(t)));
    out += G(ART.place(fpMotifFigure(t, o), 30, 12, 300, 337.5), { "clip-path": "url(#fpMotifClip)" });
    out += C(180, 180, 172, "none", P.line, 3);
    if (jobAt != null && t >= jobAt) {
      /* each part's job, one after another: drink, hold up, catch light, make seeds */
      out += jobPulse(0, fx(222), fy(292), fpDrop(fx(222), fy(300), 11, popIn(t, jobAt, 0.35)));
      out += jobPulse(1, fx(196), fy(213), MK.arrow(fx(196), fy(238), fx(196), fy(188), on(t, jobAt + 0.25, 0.4), P.gold, 6));
      out += jobPulse(2, 292, 150, fpSun(292, 150, 14, popIn(t, jobAt + 0.5, 0.35), t));
      out += jobPulse(3, 265, 56, fpSeed(265, 56, 10, -20, popIn(t, jobAt + 0.75, 0.35)));
    }
    /* what a plant needs: water, light, the right temperature */
    if (needAt != null && t >= needAt) {
      out += MK.pic(122, 330, 34, "\u{1F4A7}", { opacity: Math.min(1, popIn(t, needAt, 0.35)) });
      out += MK.pic(180, 330, 34, "☀️", { opacity: Math.min(1, popIn(t, needAt + 0.2, 0.35)) });
      out += MK.pic(238, 330, 34, "\u{1F321}️", { opacity: Math.min(1, popIn(t, needAt + 0.4, 0.35)) });
    }
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A flowering plant: roots, stem, leaves and flower">' + out + "</svg>";
  }
