  /* ==== chapters: a model of light, how ideas changed, and the recap ===========
     tools/lib/film-scenes/science-g2/light-and-dark-3.js. */

  /* ---- a model of light ----------------------------------------------------------
     The lesson's own ray model (RAY_MODEL in content/lesson-7.py, the first
     frame of its Model maker demo): dark navy, a gold source at the left, three
     straight gold lines, an eye at the right. It is redrawn here in the film's
     space rather than placed, because that drawing lives in the lesson file and
     not in the kit ART lifts. The globe is the demo's second frame, and is the
     kit's own (ART.scene "globe"). */
  var LD_PANEL = { x: 280, y: 30, w: 608, h: 342, k: 3.8 };
  function ldMX(v) { return LD_PANEL.x + v * LD_PANEL.k; }
  function ldMY(v) { return LD_PANEL.y + v * LD_PANEL.k; }

  function ldRayModel(t, scene) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cCannot = c(0, "cannot"), cModel0 = c(0, "model");
    var cLines = c(1, "lines"), cSource = c(1, "source"), cEye = c(1, "eye");
    var cModel = c(2, "model"), cClear = c(2, "clear"), cIdea = c(2, "idea");
    var board = on(t, cModel0, 0.5), out = "";

    out += R(LD_PANEL.x, LD_PANEL.y, LD_PANEL.w, LD_PANEL.h, 16, "#0E2434", P.line, 3);
    out += R(LD_PANEL.x, LD_PANEL.y, LD_PANEL.w, LD_PANEL.h, 16, "none", P.gold, 4,
      { opacity: Math.max(board * 0.75, bump(t, cClear, 1.3)) });
    /* the source and the eye */
    out += MK.glow(ldMX(24), ldMY(45), 130, P.gold, 0.8 * on(t, cCannot, 0.6));
    out += C(ldMX(24), ldMY(45), 12 * LD_PANEL.k, P.gold, null, null, { opacity: on(t, cCannot, 0.6) });
    out += ldEye(ldMX(137), ldMY(45), 120, on(t, cCannot, 0.6));
    /* "We cannot see light travelling": nothing in between, and a question */
    out += MK.qmark(ldMX(80), ldMY(20), 34, on(t, cCannot, 0.5) * (1 - on(t, cLines, 0.5)));
    /* "straight lines, from the source to your eye": each draws itself, and
       each ENDS on the eye. They fanned out to y 106 and y 296 before, which is
       about 60 px clear of an eye that spans y 167 to 235: two of the three
       rays went past the eye while the line said they went into it. The eye is
       centred (800.6, 201) and its lid curve is 20 px high at x 764, so these
       three land inside it and still leave a visible fan. */
    var ends = [[760, 182], [786, 201], [760, 220]];
    /* they LEAVE the source at three places on its rim, so three separate lines
       are visible all the way across; landing them on one point at the source
       as well drew them as a single thick bundle. */
    var begins = [[406, 172], [417, 201], [406, 230]];
    for (var k = 0; k < 3; k++) {
      var u = on(t, cLines == null ? null : cLines + k * 0.14, 0.75);
      out += ldBeam(begins[k][0], begins[k][1], ends[k][0], ends[k][1], u, P.gold, 8);
      out += ldBeam(begins[k][0], begins[k][1], ends[k][0], ends[k][1], u, "#FFFFFF", 3, false);
    }
    /* the lines flash as "an idea" is said */
    var fl = bump(t, cIdea, 1.1);
    if (fl > 0) {
      var flash = "";
      for (var j = 0; j < 3; j++) flash += ldBeam(begins[j][0], begins[j][1], ends[j][0], ends[j][1], 1, P.gold, 8 + 10 * fl, false);
      out += G(flash, { opacity: 0.5 * fl });
    }
    /* the source and the eye, each ringed as it is named */
    out += C(ldMX(24), ldMY(45), 12 * LD_PANEL.k + 16, "none", P.good, 5, { opacity: on(t, cSource, 0.4) });
    out += E(ldMX(137), ldMY(45), 70, 46, "none", P.good, 5, { opacity: on(t, cEye, 0.4) });
    out += MK.pill(584, 404, "model", on(t, cModel, 0.45), { size: 30, col: P.gold });
    return out;
  }

  /* "A globe is a model of the Earth ... It leaves out every house and tree." */
  function ldGlobe(t, scene) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cGlobe = c(3, "globe"), cEarth = c(3, "earth"), cShape = c(3, "shape"), cSeas = c(3, "seas");
    var cHouse = c(4, "house"), cTree = c(4, "tree"), cRest = c(4, "rest");
    var g = on(t, cGlobe, 0.5), out = "";
    out += G(R(160, 42, 356, 356, 20, P.card, P.line, 2) + ART.place(ART.scene("globe", 0), 170, 52, 336, 336), { opacity: g });
    out += C(338, 220, 126, "none", P.good, 5, { opacity: bump(t, cEarth, 1.4) });
    /* the two things the globe does show */
    var so = on(t, cShape, 0.45);
    out += MK.leader(578, 132, 431, 135, on(t, cShape, 0.6), P.gold) + MK.pill(660, 132, "the shape", so, { size: 28, col: P.gold });
    var eo = on(t, cSeas, 0.45);
    out += MK.leader(578, 258, 338, 330, on(t, cSeas, 0.6), "#6E9DE8") + MK.pill(660, 258, "the seas", eo, { size: 28, col: P.blue });
    /* and the two it leaves out */
    var gone = on(t, cRest, 0.5);
    out += MK.pop(MK.pic(930, 130, 112, "\u{1F3E0}", { opacity: 1 - 0.5 * gone }), 930, 130, popIn(t, cHouse, 0.4));
    out += MK.pop(MK.pic(930, 296, 112, "\u{1F333}", { opacity: 1 - 0.5 * gone }), 930, 296, popIn(t, cTree, 0.4));
    out += MK.cross(1000, 84, 28, popIn(t, cRest, 0.4));
    out += MK.cross(1000, 250, 28, popIn(t, cRest == null ? null : cRest + 0.18, 0.4));
    out += MK.pill(940, 402, "left out", gone, { size: 26, col: P.line, ink: P.muted });
    return out;
  }

  function ldModelChapter(scene, beat, t, i) {
    var k = i - scene.first;
    if (k <= 2) return svg(ldRayModel(t, scene));
    var u = into(t, i);
    return svg((u < 1 ? G(ldRayModel(t, scene), { opacity: 1 - u }) : "") + G(ldGlobe(t, scene), { opacity: u }));
  }

  /* ---- how ideas changed ----------------------------------------------------------
     The lesson's "What people thought about light" step: eyes sending out
     beams, like torches; the dark room that shows they cannot; and light
     coming from a source into the eye, which is what testing showed. */
  function ldOldIdea(t, scene) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cLong = c(0, "long"), cBeams = c(0, "beams"), cTorch = c(0, "torches");
    var cDarkR = c(1, "dark"), cCannot = c(1, "cannot");
    var darkU = on(t, cDarkR, 0.6), off = on(t, cCannot, 0.5), out = "";

    out += R(40, 24, 1088, 392, 20, "#000000", "#6B4A2B", 8, { opacity: darkU });
    out += MK.pill(140, 58, "Long ago", on(t, cLong, 0.45), { size: 26, col: P.line, ink: P.muted });
    out += ldEye(400, 145, 180, on(t, cLong, 0.5));
    /* the beams the old idea said came OUT of the eye */
    var ends = [[730, 95], [730, 145], [730, 195]];
    for (var k = 0; k < 3; k++) {
      var u = on(t, cBeams == null ? null : cBeams + k * 0.13, 0.6) * (1 - off);
      out += ldBeam(496, 145, ends[k][0], ends[k][1], u, P.gold, 8);
    }
    /* "like torches": a torch under the eye, TURNED to point the way its beams
       go. It was mirrored before (scale(-1,1)), which puts the body and the lens
       down-right while the torch's own painted light-marks read the other way,
       with the three beams leaving horizontally: a torch aimed one way and its
       light leaving another. Windows draws this emoji lying about 144 degrees
       round, so turning it by -144 lays it flat with the lens to the right, and
       the beams start at the lens, where the emoji's own marks are. Turning it
       also turns its square glyph box, whose corner reached 6 px below the 440
       box as the torch popped in (--sweep), so it is drawn at 128, not 140. */
    var to = popIn(t, cTorch, 0.3) * (1 - darkU);
    out += MK.pop(G(MK.pic(400, 315, 128, "\u{1F526}"), { transform: "rotate(-144 400 315)" }), 400, 315, to);
    var tEnds = [[730, 285], [730, 330], [730, 375]];
    var tu = on(t, cTorch == null ? null : cTorch + 0.08, 0.32) * (1 - darkU);
    for (var j = 0; j < 3; j++) out += ldBeam(456, 329, tEnds[j][0], tEnds[j][1], tu, P.gold, 7);
    out += MK.cross(858, 232, 46, popIn(t, cCannot, 0.4));
    return out;
  }

  /* "Testing showed that light comes from a source, into your eye." */
  function ldNewIdea(t, scene) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cTest = c(2, "testing"), cSource = c(2, "source"), cEye = c(2, "eye");
    var out = "";
    out += MK.tick(150, 92, 36, popIn(t, cTest == null ? null : cTest + 0.35, 0.4));
    out += MK.glow(250, 210, 130, P.gold, on(t, cTest, 0.6) * (0.7 + 0.3 * breathe(t)));
    out += MK.pop(MK.pic(250, 210, 150, "\u{1F4A1}"), 250, 210, popIn(t, cTest, 0.45));
    out += MK.pill(250, 340, "a source", on(t, cSource, 0.45), { size: 28, col: P.gold });
    /* all three land on the eye (centred 890, 210; its lid is 31 px high at
       x 826), for the reason the ray model's do: the line says "into your eye" */
    var ends = [[826, 188], [846, 210], [826, 232]];
    var begins = [[316, 176], [330, 210], [316, 244]];
    for (var k = 0; k < 3; k++) {
      out += ldBeam(begins[k][0], begins[k][1], ends[k][0], ends[k][1], on(t, cSource == null ? null : cSource + 0.15 + k * 0.12, 0.7), P.gold, 8);
    }
    out += ldEye(890, 210, 190, on(t, cTest, 0.5));
    out += E(890, 210, 116, 72, "none", P.good, 5, { opacity: on(t, cEye, 0.45) });
    return out;
  }

  /* "What people know changes when they test it." */
  function ldThenNow(t, scene) {
    var cChange = sc(scene, 3, "changes"), cTest = sc(scene, 3, "test");
    var b = on(t, cChange, 0.6), out = "";
    /* then: beams out of the eye, crossed. It is drawn with the chapter's own
       fade, so the panel is there as the line begins and "changes" moves. */
    out += R(70, 66, 480, 300, 18, P.cell, P.line, 2) +
      ldEye(200, 190, 130, 1) +
      ldBeam(238, 190, 352, 146, 1, P.gold, 6) + ldBeam(238, 190, 352, 234, 1, P.gold, 6) +
      MK.cross(444, 128, 30, 1) +
      Tx(310, 336, "long ago", "lab mid muted", "middle");
    out += MK.arrow(560, 216, 616, 216, b, P.gold, 9);
    /* now: a source, then the eye, ticked */
    out += G(R(618, 66, 480, 300, 18, P.cell, P.line, 2) +
      MK.pic(706, 190, 96, "\u{1F4A1}") +
      ldBeam(756, 190, 934, 180, 1, P.gold, 6) + ldBeam(756, 190, 934, 200, 1, P.gold, 6) +
      ldEye(956, 190, 130, 1) +
      MK.tick(1046, 128, 30, 1) +
      Tx(858, 336, "now", "lab mid muted", "middle"), { opacity: b });
    out += MK.pill(584, 410, "by testing", on(t, cTest, 0.45), { size: 26, col: P.gold });
    return out;
  }

  function ldIdeasChapter(scene, beat, t, i) {
    var k = i - scene.first;
    if (k <= 1) return svg(ldOldIdea(t, scene));
    if (k === 2) {
      var u = into(t, i);
      return svg((u < 1 ? G(ldOldIdea(t, scene), { opacity: 1 - u }) : "") + G(ldNewIdea(t, scene), { opacity: u }));
    }
    var v = into(t, i);
    return svg((v < 1 ? G(ldNewIdea(t, scene), { opacity: 1 - v }) : "") + G(ldThenNow(t, scene), { opacity: v }));
  }

  /* ---- what you now know ----------------------------------------------------------- */
  /* the lesson's ray model, small, for the "A model" card */
  function ldMiniModel(cx, cy, size) {
    var r = size * 0.15, x0 = cx - size * 0.42, y0 = cy, x1 = cx + size * 0.22;
    return C(x0, y0, r, P.gold) +
      L(x0 + r, y0, x1, y0 - size * 0.06, P.gold, size * 0.055) +
      L(x0 + r, y0, cx + size * 0.26, y0, P.gold, size * 0.055) +
      L(x0 + r, y0, x1, y0 + size * 0.06, P.gold, size * 0.055) +
      ldEye(cx + size * 0.4, cy, size * 0.52, 1);
  }

  /* "Darkness: what is left with no light" -- a lamp with its light gone, and a
     cross. The new-moon emoji this card carried draws on Windows as a purple
     sphere with craters, which beside the "Shines back" card read as a second
     moon rather than as the dark. */
  function ldMiniDark(cx, cy, size) {
    return G(MK.pic(cx, cy, size * 0.96, "\u{1F4A1}"), { opacity: 0.3 }) +
      MK.cross(cx + size * 0.36, cy - size * 0.28, size * 0.23, 1);
  }

  /* "Ideas change: when people test them" -- the film's own then-and-now marks,
     a cross turning into a tick, as the last picture of How ideas changed draws
     them. This card carried the lamp emoji, which this film has already used
     twice with another meaning: it is "a lamp" in Light sources and is labelled
     "a source" in How ideas changed, so on the recap grid, beside "Light
     source", it read as a fourth light source rather than as an idea. */
  function ldMiniChange(cx, cy, size) {
    return MK.cross(cx - size * 0.36, cy, size * 0.22, 1) +
      MK.arrow(cx - size * 0.09, cy, cx + size * 0.09, cy, 1, P.gold, size * 0.075) +
      MK.tick(cx + size * 0.36, cy, size * 0.22, 1);
  }

  var LD_RECAP = MK.recapKind([
    { beat: 0, at: "source", title: "Light source", sub: "makes its own light", pic: "☀️" },
    { beat: 1, at: "back", title: "Shines back", sub: "the Moon, a mirror, paper", pic: "\u{1F319}" },
    { beat: 2, at: "dark", title: "Darkness", sub: "what is left with no light", pic: ldMiniDark },
    { beat: 3, at: "model", title: "A model", sub: "shows an idea clearly", pic: ldMiniModel },
    { beat: 3, at: "change", title: "Ideas change", sub: "when people test them", pic: ldMiniChange }
  ], { goBeat: 3, goAt: "change" });

  var KINDS = {
    title: MK.titleKind({ sub: ["Things that make their own light", "Things that only shine it back", "What darkness really is"] }),
    sources: ldSourcesChapter, back: ldBackChapter, dark: ldDarkChapter,
    model: ldModelChapter, ideas: ldIdeasChapter, recap: LD_RECAP
  };
