  /* ==== Grade 2 Science, Lesson 7: Light and Dark ==============================
     tools/lib/film-scenes/science-g2/light-and-dark.js, with -2.js and -3.js:
     the film's pictures, after the shared marks (MK) and before the engine's
     tail, all in one scope. The storyboard is
     science/grade-2-app/lecture-video/light-and-dark.json.

     The lesson's own things, in the lesson's own order: the light sources of
     its "Things that make light" step (the five its lecture names), the Moon,
     mirror and white paper of its "Source, or not?" sort and that step's two
     bins, the dark cupboard test its explain() gives, the room of its Total
     darkness experiment (ART.sim "darkRoom": the curtains and the lamp, the
     drawing the child clicks), the ray model its demo draws (RAY_MODEL in
     content/lesson-7.py: straight gold lines from the source to the eye, on
     dark navy) and the globe of that demo's second frame (ART.scene "globe").

     This file: the palette, the drawings every chapter shares, the title
     motif and the chapter "Light sources". Every top-level name starts with
     ld, so nothing here can replace a name of the engine, ART or MK. */

  var HUE = {
    title: P.teal, sources: P.gold, back: P.blue, dark: P.plum,
    model: P.good, ideas: P.accent, recap: P.teal
  };

  /* ---- drawings every chapter shares ------------------------------------------ */

  /* The Sun, the kit's gold, with eight rays turning slowly. */
  function ldSun(cx, cy, r, o, t) {
    if (!(o > 0)) return "";
    var rays = "", a0 = (t || 0) * 0.3;
    for (var k = 0; k < 8; k++) {
      var a = a0 + k * Math.PI / 4;
      rays += L(cx + Math.cos(a) * r * 1.3, cy + Math.sin(a) * r * 1.3,
        cx + Math.cos(a) * r * 1.74, cy + Math.sin(a) * r * 1.74, P.gold, r * 0.2);
    }
    return G(MK.glow(cx, cy, r * 2.2, P.gold, 1) + rays + C(cx, cy, r, P.gold), { opacity: clamp(o, 0, 1) });
  }

  /* An eye, drawn rather than taken from the emoji font so it is the same on
     every machine and readable large. The lesson's ray model ends at an eye;
     so does this film. */
  function ldEye(cx, cy, size, o) {
    if (!(o > 0)) return "";
    var w = size * 0.52, h = size * 0.3, sw = Math.max(2, size * 0.055);
    var lid = "M" + n2(cx - w) + "," + n2(cy) +
      " Q" + n2(cx) + "," + n2(cy - h * 1.9) + " " + n2(cx + w) + "," + n2(cy) +
      " Q" + n2(cx) + "," + n2(cy + h * 1.9) + " " + n2(cx - w) + "," + n2(cy) + " Z";
    return G(Pth(lid, "#F7F4EC", "#2B1B10", sw) +
      C(cx, cy, h * 0.94, "#6B4A2B") + C(cx, cy, h * 0.44, "#101820") +
      C(cx - h * 0.3, cy - h * 0.34, h * 0.2, "#FFFFFF", null, null, { opacity: 0.85 }),
      { opacity: clamp(o, 0, 1) });
  }

  /* A straight beam of light from (x1, y1) to (x2, y2), drawn to u. The lesson
     draws light as straight gold lines, so every beam in this film is one.
     The stroke thins with the first fifth of u as well as shortening: a beam
     drawn to almost nothing is a round cap, and three of them stayed behind as
     gold dots when the title motif took the light away. */
  function ldBeam(x1, y1, x2, y2, u, col, w, dash) {
    u = clamp(u, 0, 1);
    if (!(u > 0.02)) return "";
    var ex = lerp(x1, x2, u), ey = lerp(y1, y2, u), ww = (w || 7) * Math.min(1, u * 5);
    return L(x1, y1, ex, ey, col || P.gold, ww, dash ? { "stroke-dasharray": "13 10" } : null);
  }

  /* ==== the title ===============================================================
     What the whole lesson is about, in one picture: the Sun, three straight
     beams and an eye, inside a round night window. In the spoken title chapter
     it lights up as "Light lets you see" is said, the Sun is ringed on "a light
     source", and on the second line the light is taken away and the window goes
     black. On the two cards it simply shines. */
  function titleMotif(o) {
    var t = o.t || 0, s = o.scene, out = "";
    var cSee = s ? sc(s, 0, "see") : null, cSrc = s ? sc(s, 0, "source") : null, cSun = s ? sc(s, 0, "sun") : null;
    var cAway = s ? sc(s, 1, "away") : null, cDark = s ? sc(s, 1, "dark") : null, cNone = s ? sc(s, 1, "none") : null;
    /* no scene: the card's still, fully lit */
    var lit = s ? on(t, cSee, 0.7) : 1;
    var gone = s ? on(t, cAway, 0.8) : 0, night = s ? on(t, cDark, 0.7) : 0;
    var shine = lit * (1 - gone);

    out += el("clipPath", { id: "ldMotifClip" }, C(180, 180, 172));
    out += C(180, 180, 172, "#123247");
    out += C(180, 180, 172, "#000000", null, null, { opacity: night });
    out += G(MK.glow(180, 180, 170, P.gold, shine * 0.9), { "clip-path": "url(#ldMotifClip)" });
    /* the Sun, three beams, the eye */
    /* the three beams end ON the eye (centred 252, 244), not above and below it */
    out += G(ldSun(112, 116, 34, shine, t) +
      ldBeam(148, 134, 214, 234, shine, P.gold, 7) +
      ldBeam(140, 150, 226, 244, shine, P.gold, 7) +
      ldBeam(128, 156, 214, 254, shine, P.gold, 7),
      { "clip-path": "url(#ldMotifClip)" });
    out += ldEye(252, 244, 104, s ? (0.3 + 0.7 * (1 - night)) * (1 - 0.55 * on(t, cNone, 0.6)) : 1);
    /* "a light source": a ring round the Sun; "the Sun": it flares */
    if (cSrc != null) out += C(112, 116, 58 + 10 * bump(t, cSun, 0.9), "none", P.gold, 5,
      { opacity: on(t, cSrc, 0.4) * (1 - gone) });
    out += C(180, 180, 172, "none", P.line, 3);
    return '<svg viewBox="0 0 360 360" role="img" aria-label="The Sun, straight beams of light, and an eye">' + out + "</svg>";
  }

  /* ==== chapter: light sources ==================================================
     The first five pictures of the lesson's "Things that make light" step, in
     the order its lecture names them, with the lesson's own labels. Each lights
     up as it is said; the lamp and torch are switched off and the candle and
     fire blown out on the line that says so; then the Sun alone, biggest. */
  var LD_SRC = [
    { pic: "☀️", label: "the Sun", cue: "sun" },
    { pic: "\u{1F4A1}", label: "a lamp", cue: "lamp" },
    { pic: "\u{1F56F}️", label: "a candle", cue: "candle" },
    { pic: "\u{1F526}", label: "a torch", cue: "torch" },
    { pic: "\u{1F525}", label: "a fire", cue: "fire" }
  ];
  var LD_SRC_X = [176, 374, 572, 770, 968];

  function ldSourcesRow(t, scene) {
    var cOwn = sc(scene, 1, "own"), cSrc = sc(scene, 1, "source");
    var cOff = sc(scene, 2, "off"), cBlow = sc(scene, 2, "blow"), cStops = sc(scene, 2, "stops");
    var offU = on(t, cOff, 0.5), blowU = on(t, cBlow, 0.5), out = "";
    /* which go out on which line: switched off, or blown out */
    var goneBy = [0, offU, blowU, offU, blowU];

    LD_SRC.forEach(function (s, k) {
      var at = sc(scene, 0, s.cue), x = LD_SRC_X[k], p = popIn(t, at, 0.42);
      if (p <= 0) return;
      var out0 = goneBy[k], live = 1 - 0.5 * out0;
      /* each makes its own light: a pool of it, one after another */
      var glow = Math.max(on(t, at, 0.6), on(t, cOwn == null ? null : cOwn + k * 0.16, 0.4));
      out += MK.glow(x, 180, 92, P.gold, glow * (0.72 + 0.28 * breathe(t + k * 0.5)) * (1 - out0));
      out += MK.pop(MK.pic(x, 180, 128, s.pic, { opacity: live }), x, 180, p);
      out += Tx(x, 296, s.label, "lab big", "middle", { opacity: Math.min(1, p) * (1 - 0.4 * out0) });
      /* "a light source": a gold ring round each in turn */
      out += C(x, 180, 82, "none", P.gold, 4,
        { opacity: on(t, cSrc == null ? null : cSrc + k * 0.14, 0.35) * (1 - out0) });
      /* "and the light stops": a cross on the four that were put out */
      if (k > 0) out += MK.cross(x + 62, 120, 24, popIn(t, cStops == null ? null : cStops + (k - 1) * 0.12, 0.35) * out0);
    });
    /* the lesson's word for all five */
    out += MK.pill(584, 392, "light source", on(t, cSrc, 0.45), { size: 32, col: P.gold });
    return out;
  }

  /* "The Sun is the biggest light source we have. Daylight is sunlight." */
  function ldBiggestSun(t, scene) {
    var cBig = sc(scene, 3, "biggest"), cDay = sc(scene, 3, "daylight");
    var g = on(t, cBig, 0.8), day = on(t, cDay, 0.7), out = "";
    out += R(12, 10, 1144, 420, 24, "#F4C95D", null, null, { opacity: 0.085 * day });
    out += ldSun(330, 200, 42 + 46 * g, 1, t);
    /* the other four, small beside it */
    var xs = [762, 950, 762, 950], ys = [132, 132, 290, 290];
    for (var k = 1; k < 5; k++) {
      out += MK.pic(xs[k - 1], ys[k - 1], 88, LD_SRC[k].pic);
      out += Tx(xs[k - 1], ys[k - 1] + 74, LD_SRC[k].label, "lab mid muted", "middle");
    }
    out += MK.pill(330, 398, "the biggest", on(t, cBig, 0.45), { size: 30, col: P.gold });
    out += MK.pill(856, 398, "daylight is sunlight", day, { size: 28, col: P.gold });
    return out;
  }

  function ldSourcesChapter(scene, beat, t, i) {
    var k = i - scene.first;
    if (k <= 2) return svg(ldSourcesRow(t, scene));
    var u = into(t, i);
    return svg((u < 1 ? G(ldSourcesRow(t, scene), { opacity: 1 - u }) : "") + G(ldBiggestSun(t, scene), { opacity: u }));
  }
