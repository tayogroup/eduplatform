  /* ==== chapters: how you see a book, how the idea changed, the ray diagram
     and the recap. tools/lib/film-scenes/science-g4/light-and-seeing-3.js. */

  /* ---- how you see a book -------------------------------------------------------
     The lesson's explore step, whose four items are four emoji cards: a source
     lights it, the book reflects, light enters your eye, no source no seeing.
     Drawn here as one journey left to right - lamp, book, eye - so the arrows
     always go source -> object -> eye and never the other way. The last beat is
     the lesson's sort step: what makes light, and what is only seen by it. */
  var LAS_SEE = { lx: 170, ly: 212, bx: 556, by: 252, ex: 944, ey: 198 };

  function lasSeePic(t, scene) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cSource = c(0, "source"), cElse = c(0, "else"), cReflection = c(0, "reflection");
    var cLamp = c(1, "lamp"), cNot = c(1, "not");
    var cReflects = c(2, "reflects"), cEvery = c(2, "every");
    var cEye = c(3, "eye"), cSee = c(3, "see");
    var cOff = c(4, "off"), cNothing = c(4, "nothing"), cNone = c(4, "none");
    var off = on(t, cOff, 0.7), live = 1 - off, out = "";

    /* the lamp, making light of its own */
    var src = on(t, cSource, 0.6) * live;
    out += MK.glow(LAS_SEE.lx, LAS_SEE.ly, 104, P.gold, (0.3 + 0.7 * src) * (0.7 + 0.3 * breathe(t)) * live);
    if (src > 0) {
      for (var r = 0; r < 8; r++) {
        var a = (r / 8) * Math.PI * 2 - Math.PI / 2;
        out += L(LAS_SEE.lx + Math.cos(a) * 68, LAS_SEE.ly + Math.sin(a) * 68,
          LAS_SEE.lx + Math.cos(a) * 96, LAS_SEE.ly + Math.sin(a) * 96, P.gold, 6, { opacity: n2(0.9 * src) });
      }
    }
    out += G(Em(LAS_SEE.lx, LAS_SEE.ly, 116, "\u{1F4A1}"), off > 0.5 ? { style: "filter:brightness(0.34)" } : {});
    out += MK.pill(LAS_SEE.lx, 330, "light source", on(t, cSource, 0.45), { size: 26, col: P.gold });
    out += MK.cross(LAS_SEE.lx, 118, 32, popIn(t, cOff, 0.4));

    /* the lamp lights the book */
    out += G(lasRay(240, 228, 484, 244, on(t, cLamp, 0.7), LAS_RAY, 8), { opacity: n2(live) });
    /* the book, which is not a source, scattering the light it is given */
    out += G(lasScatter(LAS_SEE.bx, 176, 22, 118, -Math.PI * 0.94, -Math.PI * 0.06, 7,
      Math.max(on(t, cReflects, 0.7), on(t, cEvery, 0.7)), LAS_RAY, 5), { opacity: n2(live) });
    out += G(Em(LAS_SEE.bx, LAS_SEE.by, 128, "\u{1F4D5}"),
      off > 0.5 ? { style: "filter:brightness(0.3)" } : {});
    out += C(LAS_SEE.bx, LAS_SEE.by - 14, 86, "none", P.gold, 4, { opacity: n2(bump(t, cElse, 1.6)) });
    out += MK.cross(474, 372, 22, popIn(t, cNot, 0.4));
    out += MK.pill(586, 372, "not a source", on(t, cNot, 0.45), { size: 24, col: P.muted, ink: P.muted });

    /* and a little of it travels straight into the eye */
    out += G(lasRay(628, 214, 866, 206, on(t, cEye, 0.7), LAS_RAY, 8), { opacity: n2(live) });
    out += lasEye(LAS_SEE.ex, LAS_SEE.ey, 76, -1, 0.3 + 0.7 * on(t, cEye, 0.6), 1);
    out += MK.ripple(LAS_SEE.ex, LAS_SEE.ey, t, cEye, P.gold);
    out += MK.tick(1078, 118, 30, popIn(t, cSee, 0.4) * live);
    out += MK.pill(LAS_SEE.ex, 306, "your eye", lasFrom(t, scene, 0), { size: 24, col: P.line });

    /* the words that hold the whole idea, and the dark when the lamp goes off */
    out += MK.pill(LAS_SEE.bx, 56, "seen by reflected light", on(t, cReflection, 0.45) * live, { size: 28, col: P.gold });
    out += MK.cross(LAS_SEE.bx, 176, 40, popIn(t, cNothing, 0.4));
    out += MK.pill(LAS_SEE.ex, 386, "you see nothing", on(t, cNone, 0.45), { size: 26, col: P.muted, ink: P.muted });
    return out;
  }

  /* the lesson's sort step: sources on one side, reflectors on the other */
  var LAS_SORT = [
    { x: 56, w: 496, pic: "\u{1F506}", label: "Light source", items: ["☀️", "\u{1F4A1}", "\u{1F56F}\u{FE0F}"] },
    { x: 616, w: 496, pic: "↩️", label: "Seen by reflected light", items: ["\u{1F315}", "\u{1FA9E}", "\u{1F4D5}"] }
  ];
  function lasSortPic(t, scene) {
    var at = [sc(scene, 5, "sources"), sc(scene, 5, "reflect")], out = "";
    var t0 = BEATS[scene.first + 5].start - GAP;
    for (var k = 0; k < 2; k++) {
      var b = LAS_SORT[k], o = ease(clamp((t - t0 - k * 0.14) / 0.5, 0, 1));
      if (o <= 0) continue;
      var lit = popIn(t, at[k], 0.45);
      out += R(b.x, 66, b.w, 308, 22, lit > 0 ? "#1B3A52" : P.card, lit > 0 ? P.gold : P.line, lit > 0 ? 3 : 2, { opacity: n2(o) });
      out += G(MK.pic(b.x + b.w / 2, 140, 74, b.pic), { opacity: n2(o) });
      out += Tx(b.x + b.w / 2, 232, b.label, "lab big", "middle", { opacity: n2(o), fill: lit > 0 ? P.gold : P.ink });
      for (var j = 0; j < 3; j++) {
        var p = popIn(t, at[k] == null ? null : at[k] + 0.25 + j * 0.28, 0.4);
        if (p <= 0) continue;
        var ix = b.x + b.w / 2 + (j - 1) * 148;
        out += G(MK.pic(ix, 306, 76, b.items[j]), { transform: around(ix, 306, Math.min(p, 1.1)), opacity: n2(Math.min(1, p)) });
      }
    }
    return out;
  }

  function lasSeeingChapter(scene, beat, t, i) {
    var k = i - scene.first;
    if (k < 5) return svg(lasSeePic(t, scene));
    var u = into(t, scene.first + 5);
    return svg(lasSortPic(t, scene) + (u < 1 ? G(lasSeePic(t, scene), { opacity: n2(1 - u) }) : ""));
  }

  /* ---- how the idea changed -----------------------------------------------------
     The lesson's context step, whose four items are the old idea, the problem
     with it, the enquiry and what changed. Two cards: the OLD idea on the left,
     which is the one place in this film a ray leaves an eye, and Ibn
     al-Haytham's dark room with a tiny hole on the right. The old card is
     crossed and dimmed as the line says light comes in, not out. */
  var LAS_OLD = { x: 28, y: 50, w: 506, h: 340 };
  var LAS_ENQ = { x: 614, y: 50, w: 506, h: 340 };
  var LAS_HOLE = [1006, 126], LAS_SUN = [1040, 84], LAS_PATCH = [846, 324];

  function lasOldCard(t, scene) {
    var cLong = sc(scene, 0, "long"), cBeams = sc(scene, 0, "beams");
    var cTrue = sc(scene, 1, "true"), cNot = sc(scene, 3, "not");
    var o = on(t, cLong, 0.5);
    if (o <= 0) return "";
    var beams = on(t, cBeams, 0.8), wrong = on(t, cNot, 0.6), out = "";

    out += R(LAS_OLD.x, LAS_OLD.y, LAS_OLD.w, LAS_OLD.h, 22, P.card, P.line, 2, { opacity: n2(o) });
    out += Tx(281, 104, "The old idea", "lab big", "middle", { opacity: n2(o), fill: P.plum });
    out += lasEye(150, 236, 58, 1, 0.45, o);
    out += Em(430, 246, 92, "\u{1F4D5}", { opacity: n2(o) });
    /* the beams people thought came OUT of the eye: plum, never gold, so they
       can never be mistaken for one of this film's rays */
    for (var r = 0; r < 3; r++) {
      out += MK.arrow(212, 236 + (r - 1) * 14, 372, 246 + (r - 1) * 42, beams, P.plum, 6);
    }
    out += MK.pill(281, 356, "beams out of the eye", on(t, cBeams, 0.45), { size: 24, col: P.muted, ink: P.muted });
    out += MK.qmark(474, 116, 28, on(t, cTrue, 0.45) * (1 - wrong));
    return G(out, { opacity: n2(1 - 0.6 * wrong) });
  }

  function lasEnquiryCard(t, scene) {
    var cDark = sc(scene, 1, "dark");
    var cName = sc(scene, 2, "name"), cHoles = sc(scene, 2, "holes"), cTested = sc(scene, 2, "tested");
    var cInto = sc(scene, 3, "into");
    var o = lasFrom(t, scene, 1);
    if (o <= 0) return "";
    var hole = on(t, cHoles, 0.6), ray = on(t, cTested, 0.8), out = "";

    out += R(LAS_ENQ.x, LAS_ENQ.y, LAS_ENQ.w, LAS_ENQ.h, 22, P.card, P.line, 2);
    out += Tx(760, 104, "A dark room", "lab big", "middle", { fill: P.gold });
    out += R(648, 126, 440, 212, 10, "#0A1119", LAS_WALL_EDGE, 3);
    /* nothing to see, until a hole is made in the wall */
    out += lasEye(720, 246, 50, 1, 0.9, 1);
    out += MK.cross(900, 238, 38, popIn(t, cDark, 0.4) * (1 - ray));
    /* the sun outside, the tiny hole, and the light that comes in through it */
    out += G(Em(LAS_SUN[0], LAS_SUN[1], 54, "☀️"), { opacity: n2(hole) });
    out += C(LAS_HOLE[0], LAS_HOLE[1], 7, P.gold, null, null, { opacity: n2(hole) });
    /* the hole's own label belongs to the line that makes the hole: it goes
       when "light comes IN" arrives, so the two never sit on each other */
    var holeLab = on(t, cHoles, 0.45) * (1 - on(t, cInto, 0.5));
    out += MK.leader(930, 160, LAS_HOLE[0] - 4, LAS_HOLE[1] + 10, holeLab, P.gold);
    out += MK.pill(856, 174, "a tiny hole", holeLab, { size: 20, col: P.gold });
    out += lasRay(LAS_SUN[0] - 6, LAS_SUN[1] + 16, LAS_PATCH[0], LAS_PATCH[1], ray, LAS_RAY, 6);
    out += MK.glow(LAS_PATCH[0], LAS_PATCH[1], 54, P.gold, ray);
    out += MK.pill(867, 368, "Ibn al-Haytham", on(t, cName, 0.45), { size: 24, col: P.gold });
    out += MK.pill(742, 158, "light comes IN", on(t, cInto, 0.45), { size: 24, col: P.good });
    return G(out, { opacity: n2(Math.min(1, o)) });
  }

  function lasOldIdeaChapter(scene, beat, t, i) {
    var cNot = sc(scene, 3, "not"), cEvid = sc(scene, 3, "evidence");
    var dx = lerp(300, 0, lasFrom(t, scene, 1)), out = "";
    out += G(lasOldCard(t, scene), { transform: tr(dx, 0) });
    out += G(MK.cross(281, 236, 76, popIn(t, cNot, 0.45)), { transform: tr(dx, 0) });
    out += lasEnquiryCard(t, scene);
    out += MK.arrow(544, 220, 606, 220, on(t, cEvid, 0.6), P.good, 8);
    out += MK.pill(574, 414, "evidence changed it", on(t, cEvid, 0.45), { size: 24, col: P.good });
    return svg(out);
  }

  /* ---- draw a ray diagram --------------------------------------------------------
     The lesson's diagram step: ART.figure("ray") is the very drawing the child
     labels two steps later, and its four parts are the four labels RAY lists in
     content/lesson-9.py. One part is ringed at a time and the rest are dimmed,
     so the pointer is never four boxes at once. */
  var LAS_FIG = { x: 60, y: 22, w: 582, h: 400, k: 1.81875 };
  function lasFX(v) { return LAS_FIG.x + v * LAS_FIG.k; }
  function lasFY(v) { return LAS_FIG.y + v * LAS_FIG.k; }
  var LAS_PARTS = ["source", "ray", "mirror", "eye"];

  /* the figure with one part ringed and the others dimmed; active null means
     every part at full brightness and none ringed */
  function lasRayFigure(active) {
    var m = ART.figure("ray");
    if (active) {
      for (var k = 0; k < LAS_PARTS.length; k++) if (LAS_PARTS[k] !== active) m = ART.dim(m, LAS_PARTS[k], 0.4);
      m = ART.ring(m, active, P.gold, 4);
    }
    return ART.place(m, LAS_FIG.x, LAS_FIG.y, LAS_FIG.w, LAS_FIG.h);
  }

  function lasDiagramChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cDraw = c(0, "draw"), cS0 = c(0, "source"), cR0 = c(0, "ray"), cM0 = c(0, "mirror"), cE0 = c(0, "eye");
    var cSource = c(1, "source"), cStarts = c(1, "starts");
    var cRuler = c(2, "ruler"), cMirror = c(2, "mirror"), cArrow = c(2, "arrow"), cAway = c(2, "away");
    var cSecond = c(3, "second"), cEye = c(3, "eye"), cDiagram = c(3, "diagram");
    var out = "";

    /* which part is being named right now */
    var order = [[cS0, "source"], [cR0, "ray"], [cM0, "mirror"], [cE0, "eye"],
      [cSource, "source"], [cRuler, "ray"], [cMirror, "mirror"], [cSecond, "ray"], [cEye, "eye"]];
    var active = null, best = -1;
    for (var k = 0; k < order.length; k++) {
      if (order[k][0] != null && t >= order[k][0] && order[k][0] > best) { best = order[k][0]; active = order[k][1]; }
    }
    /* the last line names the whole drawing again, so nothing is dimmed for it */
    if (cDiagram != null && t >= cDiagram) active = null;

    out += R(52, 14, 598, 416, 18, P.card, P.line, 2);
    out += lasRayFigure(active);
    out += R(46, 8, 610, 428, 22, "none", P.gold, 4, { opacity: n2(on(t, cDiagram, 0.5)) });

    /* the four labels, ticked as each one is described */
    out += G(MK.list(668, 104, [
      { text: "light source", at: cS0, mark: "tick", markAt: cStarts },
      { text: "ray", at: cR0, mark: "tick", markAt: cArrow },
      { text: "mirror", at: cM0, mark: "tick", markAt: cMirror },
      { text: "eye", at: cE0, mark: "tick", markAt: cEye }
    ], t, { lh: 78, cls: "lab big" }), { opacity: n2(on(t, cDraw, 0.5)) });

    /* the source, where every ray starts */
    out += MK.ripple(lasFX(40), lasFY(166), t, cSource, P.gold);
    out += C(lasFX(40), lasFY(166), 46, "none", P.good, 4, { opacity: n2(bump(t, cStarts, 1.8)) });
    /* the ruler line, and the arrow that points away from the torch */
    var rule = bump(t, cRuler, 2.2);
    if (rule > 0) out += L(lasFX(62), lasFY(160), lasFX(250), lasFY(100), P.ink, 4,
      { opacity: n2(0.9 * rule), "stroke-dasharray": "13 11" });
    out += C(lasFX(156), lasFY(130), 24, "none", P.gold, 4, { opacity: n2(bump(t, cArrow, 2.0)) });
    out += G(MK.arrow(806, 372, 952, 372, on(t, cAway, 0.5), P.gold, 7) +
      MK.pill(890, 414, "away from the torch", on(t, cAway, 0.45), { size: 22, col: P.gold }),
      { opacity: n2(lasOnly(t, scene, 2)) });
    /* the second line, on into the eye */
    var sec = bump(t, cSecond, 2.2);
    if (sec > 0) out += L(lasFX(250), lasFY(100), lasFX(126), lasFY(61), P.ink, 4,
      { opacity: n2(0.9 * sec), "stroke-dasharray": "13 11" });
    out += MK.ripple(lasFX(104), lasFY(54), t, cEye, P.gold);
    out += MK.pill(890, 412, "a ray diagram", on(t, cDiagram, 0.45), { size: 30, col: P.gold });
    return svg(out);
  }

  /* ---- what you now know ---------------------------------------------------------
     The film's six ideas, lit as each is said. Two cards draw rather than show
     a picture: the mirror, whose one ray in becomes one ray out, and the
     journey, which is the whole lesson in three steps - source, book, eye. */
  function lasRecapStraight(cx, cy, size) {
    return MK.arrow(cx - size * 0.52, cy + size * 0.16, cx + size * 0.52, cy - size * 0.16, 1, LAS_RAY, size * 0.11) +
      L(cx - size * 0.52, cy + size * 0.44, cx + size * 0.52, cy + size * 0.44, P.muted, size * 0.05,
        { "stroke-dasharray": n2(size * 0.14) + " " + n2(size * 0.12) });
  }
  function lasRecapMirror(cx, cy, size) {
    return R(cx - size * 0.44, cy + size * 0.24, size * 0.88, size * 0.14, 3, LAS_GLASS, "#FFFFFF", 2) +
      MK.arrow(cx - size * 0.46, cy - size * 0.42, cx - size * 0.1, cy + size * 0.18, 1, LAS_RAY, size * 0.09) +
      MK.arrow(cx + size * 0.1, cy + size * 0.18, cx + size * 0.46, cy - size * 0.42, 1, LAS_RAY, size * 0.09);
  }
  function lasRecapJourney(cx, cy, size) {
    return Em(cx - size * 0.62, cy, size * 0.6, "\u{1F526}") +
      MK.arrow(cx - size * 0.36, cy, cx - size * 0.16, cy, 1, LAS_RAY, size * 0.08) +
      Em(cx, cy, size * 0.54, "\u{1F4D5}") +
      MK.arrow(cx + size * 0.18, cy, cx + size * 0.38, cy, 1, LAS_RAY, size * 0.08) +
      lasEye(cx + size * 0.62, cy, size * 0.22, -1, 1, 1);
  }

  var LAS_RECAP = MK.recapKind([
    { beat: 0, at: "straight", title: "Straight lines", sub: "light never bends round", pic: lasRecapStraight },
    { beat: 0, at: "rays", title: "Ray diagram", sub: "straight lines with arrows", pic: "✏️" },
    { beat: 1, at: "mirror", title: "A mirror", sub: "neatly, one new line", pic: lasRecapMirror },
    { beat: 1, at: "book", title: "A book", sub: "roughly, every direction", pic: "\u{1F4D5}" },
    { beat: 2, at: "eye", title: "Into your eye", sub: "source, then book, then eye", pic: lasRecapJourney },
    { beat: 3, at: "evidence", title: "Evidence", sub: "it changed the old idea", pic: "\u{1F52C}" }
  ], { goBeat: 3, goAt: "science" });

  var KINDS = {
    title: MK.titleKind({ sub: [
      "Light travels in straight lines, and we draw it as rays",
      "It reflects off a mirror neatly and off a book roughly",
      "You see a thing when its light reaches your eye"
    ] }),
    straight: lasStraightChapter,
    reflect: lasReflectChapter,
    mirror: lasMirrorChapter,
    seeing: lasSeeingChapter,
    oldidea: lasOldIdeaChapter,
    diagram: lasDiagramChapter,
    recap: LAS_RECAP
  };
