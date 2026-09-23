  /* ==== Grade 3 Science, Lesson 13: The Moon =================================
     tools/lib/film-scenes/science-g3/the-moon.js, with -2.js and -3.js: the
     film's pictures, after the shared marks (MK) and before the engine's tail,
     all in one scope. The storyboard is
     science/grade-3-app/lecture-video/the-moon.json.

     The lesson's own drawings come from ART, so the child sees here what they
     tap two steps later: the Earth from space (ART.scene "globe", the demo's
     first frame), the Sun drawn as a star (ART.scene "sky", 3, the demo's third
     frame), the Moon through a month (ART.sim "moonPhases", the drawing its
     Three days later button steps through) and the Earth-and-Moon model the
     child builds on the screen (ART.kit.earthMoonSvg).

     Where the film draws a Moon of its own - the month strip, the ball on the
     stick, what the child sees in the model - it uses the lesson's own phase
     geometry and the lesson's own two colours, so a disc here and a disc in the
     lesson are the same picture (tmMoon below).

     This file: the palette, the drawings every chapter shares, the title motif
     and the chapter "Three spheres". Every top-level name starts with tm, so
     nothing here can replace a name of the engine, ART or MK. */

  var HUE = {
    title: P.teal, spheres: P.blue, month: P.gold, ball: P.plum,
    orbit: P.good, ideas: P.accent, recap: P.teal
  };

  /* ---- timing ---------------------------------------------------------------- */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 comes
     in: for a thing that belongs to that beat alone (rule 7) */
  function tmOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function tmFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }
  /* fixed numbers for anything scattered: never Math.random */
  var TM_SCATTER = [0.17, 0.63, 0.38, 0.91, 0.24, 0.55, 0.08, 0.79, 0.46, 0.71, 0.11, 0.86,
    0.33, 0.68, 0.02, 0.95, 0.51, 0.27, 0.74, 0.41];

  /* ---- the drawings every chapter shares -------------------------------------- */

  /* A Moon, drawn with the LESSON's own phase geometry (SIMS.moonPhases.draw in
     lesson-kit/lib/science.js) and its two colours, so the film's own discs and
     the lesson's own picture are one drawing. k runs 0 (new) to 4 (full) to 8
     (new again), and may be fractional here so a phase can change smoothly. */
  function tmMoon(cx, cy, r, k, opt) {
    opt = opt || {};
    var u = clamp(k, 0, 8) / 8;
    var lit = u <= 0.5 ? u * 2 : (1 - u) * 2;      /* how much of the face is lit, 0 to 1 */
    var right = u <= 0.5;
    var rx = Math.abs(lit * 2 - 1) * r;
    var dark = opt.dark || "#1B2A3A", pale = opt.lit || "#F3EFE6";
    var out = C(cx, cy, r, dark, opt.edge || "#4A5A6A", opt.sw || 2);
    if (lit > 0.002) {
      out += Pth("M" + n2(cx) + "," + n2(cy - r) + " a" + n2(r) + "," + n2(r) + " 0 0 " + (right ? 1 : 0) +
        " 0," + n2(2 * r) + "z", pale);
      out += E(cx, cy, rx, r, lit >= 0.5 ? pale : dark);
    }
    return out;
  }

  /* a night card: the dark ground of the lesson's own Moon picture, with stars */
  function tmStars(x, y, w, h, n, seed) {
    var out = "";
    for (var k = 0; k < n; k++) {
      var a = TM_SCATTER[(k * 2 + (seed || 0)) % TM_SCATTER.length];
      var b = TM_SCATTER[(k * 2 + 1 + (seed || 0)) % TM_SCATTER.length];
      out += C(x + a * w, y + b * h, k % 3 === 0 ? 2.4 : 1.6, "#FFFFFF", null, null, { opacity: 0.75 });
    }
    return out;
  }
  function tmNightCard(x, y, w, h, o) {
    if (!(o > 0)) return "";
    return G(R(x, y, w, h, 18, P.night, P.line, 2) + tmStars(x + 14, y + 14, w - 28, h - 28, 9, 3),
      { opacity: clamp(o, 0, 1) });
  }
  /* a plate for one of the lesson's own drawings, with room round it */
  function tmCard(x, y, w, h, o) {
    if (!(o > 0)) return "";
    return G(R(x - 10, y - 10, w + 20, h + 20, 20, P.card, P.line, 2), { opacity: clamp(o, 0, 1) });
  }

  /* The Earth as people once pictured it: a flat disc with a child standing on
     it. Drawn rather than taken from the lesson's map emoji, which this machine
     draws as an open book (rule 5). */
  function tmFlatEarth(cx, cy, rx) {
    var ry = rx * 0.28;
    return E(cx, cy, rx, ry, "#3B7FD1", "#2A5E9E", 3) +
      E(cx - rx * 0.42, cy - ry * 0.22, rx * 0.3, ry * 0.42, "#4CB65C") +
      E(cx + rx * 0.34, cy + ry * 0.18, rx * 0.24, ry * 0.36, "#4CB65C") +
      E(cx + rx * 0.02, cy - ry * 0.5, rx * 0.17, ry * 0.26, "#4CB65C") +
      Em(cx - rx * 0.46, cy - ry - 13, 28, "\u{1F9D2}");
  }

  /* a word in a pill with a leader line to the thing it names; the newest is
     gold, one named before it keeps its line, quieter */
  function tmLabel(t, x, y, text, at, to, now, size) {
    var o = on(t, at, 0.4);
    if (o <= 0) return "";
    var col = now ? P.gold : P.muted;
    return MK.leader(x - 8, y, to[0], to[1], on(t, at, 0.6), col) +
      MK.pill(x, y, text, o, { size: size || 24, anchor: "start", col: now ? P.gold : P.line });
  }

  /* ==== the title motif =========================================================
     The whole lesson in one picture: the Earth from space (the lesson's own
     globe), the Moon's orbit as a dashed ring, and the Moon on it - drawn at
     the phase its place on the ring gives, so the motif itself says that where
     the Moon is decides how much of its lit half we see. */
  function titleMotif(o) {
    var t = o.t || 0, out = "", s = o.scene;
    /* in the spoken title chapter the motif answers its four cues; on the two
       cards o.scene is absent and every cue is null, so it simply turns */
    var cMoon = s ? sc(s, 0, "moon") : null, cDiff = s ? sc(s, 0, "different") : null;
    var cBall = s ? sc(s, 1, "ball") : null, cRound = s ? sc(s, 1, "round") : null;
    var cx = 180, cy = 180;
    /* one slow turn, pure in t, with a push on "look different" and on "round" */
    var a = t * 0.34 + 1.7 * on(t, cDiff, 1.3) + 2.3 * on(t, cRound, 1.8);
    var mx = cx + Math.cos(a) * 126, my = cy + Math.sin(a) * 78;
    /* the Moon's phase from where it stands: nearest the Sun's side is new */
    var k = (1 - Math.cos(a + Math.PI)) / 2 * 4;
    k = Math.sin(a) >= 0 ? k : 8 - k;
    var lit = cRound != null && t >= cRound ? P.gold : "#4A5A6A";
    out += el("clipPath", { id: "tmMotifClip" }, C(cx, cy, 172));
    out += C(cx, cy, 172, "#0B1D2C");
    out += G(tmStars(20, 20, 320, 320, 16, 0), { "clip-path": "url(#tmMotifClip)" });
    out += E(cx, cy, 126, 78, "none", lit, 2.5, { "stroke-dasharray": "8 7" });
    out += G(ART.place(ART.scene("globe", a * 24), cx - 58, cy - 58, 116, 116), { "clip-path": "url(#tmMotifClip)" });
    out += G(tmMoon(mx, my, 22, k) +
      C(mx, my, 32, "none", P.gold, 3.5, { opacity: on(t, cMoon, 0.5) * (0.55 + 0.45 * breathe(t)) }),
      { "clip-path": "url(#tmMotifClip)", transform: around(mx, my, 1 + 0.14 * bump(t, cBall, 1.1)) });
    out += C(cx, cy, 172, "none", P.line, 3);
    return '<svg viewBox="0 0 360 360" role="img" aria-label="The Moon going round the Earth, its lit part changing">' +
      out + "</svg>";
  }

  /* ==== chapter: three spheres ====================================================
     Two pictures. The first is the three of them side by side - the lesson's
     own Earth (SCENES.globe) and its own Sun (SCENES.sky 3, the demo's third
     frame), with a Moon drawn in the lesson's phase colours - each named, then
     called a sphere, then the Sun alone for its size and its warning. The
     second is why the Earth looks flat: a child on a huge gentle curve, and the
     same Earth seen from space beside them. */

  var TM_EARTH = { x: 95, y: 48, w: 250, h: 250 };
  var TM_SUN = { x: 442, y: 52, w: 284, h: 231 };
  var TM_MOONC = { x: 823, y: 48, w: 250, h: 250 };

  function tmSpheresRow(t, scene) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cEarth = c(0, "earth"), cSun = c(0, "sun"), cMoon = c(0, "moon"), cBalls = c(0, "balls");
    var cSphere = c(1, "sphere"), cThree = c(1, "three");
    var cHuge = c(2, "huge"), cGas = c(2, "gas"), cNever = c(2, "never");
    var out = "";

    var huge = on(t, cHuge, 0.6), quiet = 1 - 0.55 * huge;
    var pe = popIn(t, cEarth, 0.45), ps = popIn(t, cSun, 0.45), pm = popIn(t, cMoon, 0.45);
    var ex = TM_EARTH.x + TM_EARTH.w / 2, ey = TM_EARTH.y + TM_EARTH.h / 2;
    var sx = TM_SUN.x + TM_SUN.w / 2, sy = TM_SUN.y + TM_SUN.h / 2;
    var mx = TM_MOONC.x + TM_MOONC.w / 2, my = TM_MOONC.y + TM_MOONC.h / 2;

    /* the Earth, the lesson's own drawing */
    out += G(tmCard(TM_EARTH.x, TM_EARTH.y, TM_EARTH.w, TM_EARTH.h, 1) +
      ART.place(ART.scene("globe", 0), TM_EARTH.x, TM_EARTH.y, TM_EARTH.w, TM_EARTH.h) +
      C(ex, ey, 96, "none", P.gold, 5, { opacity: on(t, cBalls, 0.5) }) +
      MK.tick(TM_EARTH.x + TM_EARTH.w - 6, TM_EARTH.y + 6, 22, popIn(t, cThree, 0.35)),
      { transform: around(ex, ey, Math.min(1, pe)), opacity: Math.min(1, pe) * quiet });

    /* the Moon, in the lesson's own phase colours, on a night card */
    out += G(tmNightCard(TM_MOONC.x, TM_MOONC.y, TM_MOONC.w, TM_MOONC.h, 1) +
      tmMoon(mx, my, 92, 4) +
      C(mx, my, 100, "none", P.gold, 5, { opacity: on(t, cBalls == null ? null : cBalls + 0.5, 0.5) }) +
      MK.tick(TM_MOONC.x + TM_MOONC.w - 6, TM_MOONC.y + 6, 22, popIn(t, cThree == null ? null : cThree + 0.4, 0.35)),
      { transform: around(mx, my, Math.min(1, pm)), opacity: Math.min(1, pm) * quiet });

    /* the Sun, the lesson's own drawing; it grows a little for "a huge ball" */
    var grow = 1 + 0.12 * huge;
    out += G(tmCard(TM_SUN.x, TM_SUN.y, TM_SUN.w, TM_SUN.h, 1) +
      MK.glow(sx, sy, 140, P.gold, huge * (0.7 + 0.3 * breathe(t))) +
      ART.place(ART.scene("sky", 3), TM_SUN.x, TM_SUN.y, TM_SUN.w, TM_SUN.h) +
      C(sx, sy - 16, 96, "none", P.gold, 5, { opacity: on(t, cBalls == null ? null : cBalls + 0.25, 0.5) }) +
      MK.tick(TM_SUN.x + TM_SUN.w - 6, TM_SUN.y + 6, 22, popIn(t, cThree == null ? null : cThree + 0.2, 0.35)),
      { transform: around(sx, sy, Math.min(1, ps) * grow), opacity: Math.min(1, ps) });

    /* the three names */
    out += MK.pill(ex, 336, "Earth", Math.min(1, pe) * quiet, { size: 28, col: P.blue });
    out += MK.pill(sx, 336, "Sun", Math.min(1, ps), { size: 28, col: P.gold });
    out += MK.pill(mx, 336, "Moon", Math.min(1, pm) * quiet, { size: 28, col: P.plum });

    /* "a sphere": the word itself, for its own line */
    out += MK.pill(584, 404, "sphere: a ball shape", on(t, cSphere, 0.4) * tmOnly(t, scene, 1),
      { size: 30, col: P.gold });

    /* "a huge ball of hot, glowing gas", and the lesson's own warning */
    var third = tmOnly(t, scene, 2);
    out += MK.pill(sx, 336, "hot, glowing gas", on(t, cGas, 0.4) * third, { size: 26, col: P.gold });
    var nev = popIn(t, cNever, 0.4) * third;
    if (nev > 0) {
      out += MK.cross(452, 404, 24, nev, P.bad);
      out += MK.pill(486, 404, "never look straight at the Sun", Math.min(1, nev),
        { size: 26, anchor: "start", col: P.bad, ink: P.bad });
    }
    return out;
  }

  /* the ground is a piece of a huge ball: a curve so gentle it reads as flat */
  var TM_ARC = "M0,257.4 A2000,2000 0 0 1 660,257.4";
  function tmEarthFlat(t, scene) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cFlat = c(3, "flat"), cStand = c(3, "stand"), cBig = c(3, "big");
    var cSpace = c(4, "space"), cBlue = c(4, "blue"), cPlate = c(4, "plate");
    var out = "", big = bump(t, cBig, 1.6);

    /* the ground, and the child standing on it */
    out += Pth(TM_ARC + " L660,440 L0,440 Z", "#2F4A3A");
    out += Pth(TM_ARC, null, big > 0.02 ? P.gold : "#6FA37F", 4 + 4 * big);
    out += Em(330, 186, 92, "\u{1F9D2}");
    out += MK.ripple(330, 238, t, cStand, P.gold);
    out += E(330, 240, 56, 15, "none", P.gold, 4, { opacity: on(t, cStand, 0.4) });

    /* "looks flat": a dead straight line along the ground */
    var fo = on(t, cFlat, 0.5);
    if (fo > 0) out += L(24, 230, lerp(24, 638, fo), 230, P.gold, 4, { "stroke-dasharray": "14 10" });
    out += MK.pill(160, 302, "looks flat", fo, { size: 26, col: P.gold });
    out += MK.pill(490, 302, "so big", on(t, cBig, 0.4), { size: 26, col: P.gold });

    /* the same Earth, seen from space */
    var sp = popIn(t, cSpace, 0.5);
    out += G(tmCard(738, 62, 290, 290, 1) +
      ART.place(ART.scene("globe", 0), 738, 62, 290, 290) +
      C(883, 207, 151, "none", P.gold, 5, { opacity: on(t, cBlue, 0.5) }),
      { transform: around(883, 207, Math.min(1, sp)), opacity: Math.min(1, sp) });
    out += MK.leader(390, 190, 830, 168, on(t, cSpace, 0.7), P.gold);
    out += MK.pill(883, 26, "a round blue ball", on(t, cBlue, 0.4), { size: 26, col: P.gold });

    /* "not a flat plate" */
    var pl = popIn(t, cPlate, 0.4);
    if (pl > 0) {
      out += MK.pop(E(806, 404, 62, 15, "#9FB0BD", "#6F7C88", 3) + E(806, 398, 46, 9, "#C6D2DB"), 806, 404, pl);
      out += MK.cross(806, 404, 30, pl, P.bad);
      out += MK.pill(858, 404, "a flat plate", Math.min(1, pl), { size: 24, anchor: "start", col: P.bad, ink: P.bad });
    }
    return out;
  }

  function tmSpheresChapter(scene, beat, t, i) {
    var k = i - scene.first;
    if (k < 3) return svg(tmSpheresRow(t, scene));
    if (k === 3) {
      var u = into(t, i);
      return svg(tmEarthFlat(t, scene) + (u < 1 ? G(tmSpheresRow(t, scene), { opacity: 1 - u }) : ""));
    }
    return svg(tmEarthFlat(t, scene));
  }
