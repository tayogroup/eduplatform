  /* ==== Grade 4 Science, Lesson 11: Inside the Earth ==========================
     tools/lib/film-scenes/science-g4/inside-the-earth.js, with -2.js and -3.js:
     the film's pictures, after the shared marks (MK) and before the engine's
     tail, all in one scope. The storyboard is
     science/grade-4-app/lecture-video/inside-the-earth.json.

     The lesson's own drawings come from ART, so the child sees here what they
     tap two steps later: the Earth cut open (ART.figure "earthLayers": crust,
     mantle and core, one named at a time), the volcano demo (ART.scene
     "volcano", the four frames its Next button steps through) and the
     earthquake demo (ART.scene "quake", the same four). The apple and the
     evidence chapters are drawn here, in the lesson's colours.

     This file: the palette, the helpers every chapter shares, the title motif
     and the chapter "Crust, mantle, core". Every top-level name here starts
     with ie, so nothing can replace a name of the engine, ART or MK. */

  var HUE = {
    title: P.teal, layers: P.blue, volcano: P.accent, quake: P.gold,
    apple: P.good, evid: P.plum, recap: P.teal
  };

  /* ---- timing ---------------------------------------------------------------- */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 comes
     in: for a thing that belongs to that beat alone (rule 7) */
  function ieOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function ieFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }
  /* the same, but over a run of beats k..m inclusive */
  function ieSpan(t, scene, k, m) {
    var a = ieFrom(t, scene, k);
    var z = m + 1 < scene.beats.length ? into(t, scene.first + m + 1) : 0;
    return a * (1 - z);
  }
  /* fixed numbers for anything scattered: never Math.random */
  var IE_SCATTER = [0.17, 0.63, 0.41, 0.92, 0.28, 0.77, 0.08, 0.55, 0.36, 0.84, 0.21, 0.69];

  /* ---- small drawings and marks of the film's own ------------------------------ */

  /* the width MK.pill gives a word of this many characters, so a leader can
     start at the pill's own edge whatever the word is */
  function iePillW(text, size) { return String(text).length * size * 0.56 + size * 1.3; }

  /* A word in a pill with a line to the thing it names. side is which way the
     thing lies: "left", "right", "up" or "down". The newest label is gold, one
     named before it keeps its line, quieter. */
  function ieTag(t, x, y, text, at, to, now, size, side) {
    var o = on(t, at, 0.4);
    if (o <= 0) return "";
    size = size || 28;
    var col = now ? P.gold : P.muted, w = iePillW(text, size), h = size * 1.8;
    var sx = x, sy = y;
    if (side === "left") sx = x - w / 2 - 6;
    else if (side === "right") sx = x + w / 2 + 6;
    else if (side === "up") sy = y - h / 2 - 6;
    else sy = y + h / 2 + 6;
    return MK.leader(sx, sy, to[0], to[1], on(t, at, 0.7), col) +
      MK.pill(x, y, text, o, { size: size, anchor: "middle", col: now ? P.gold : P.line });
  }

  /* a quarter-ring (the upper-right quadrant, the way the lesson cuts the
     Earth open) between two radii about (cx, cy); rIn 0 gives a quarter disc */
  function ieWedge(cx, cy, rIn, rOut) {
    var d = "M" + n2(cx) + "," + n2(cy - rOut) +
      " A" + n2(rOut) + "," + n2(rOut) + " 0 0 1 " + n2(cx + rOut) + "," + n2(cy);
    if (rIn > 0)
      d += " L" + n2(cx + rIn) + "," + n2(cy) +
        " A" + n2(rIn) + "," + n2(rIn) + " 0 0 0 " + n2(cx) + "," + n2(cy - rIn) + " Z";
    else d += " L" + n2(cx) + "," + n2(cy) + " Z";
    return d;
  }
  /* that quarter-ring lit: a wash of white inside it and a stroke round it */
  function ieBand(cx, cy, rIn, rOut, u, col, wash) {
    if (!(u > 0)) return "";
    var d = ieWedge(cx, cy, rIn, rOut);
    return Pth(d, "#FFFFFF", null, null, { opacity: 0.2 * clamp(u, 0, 1) * (wash == null ? 1 : wash) }) +
      Pth(d, null, col || P.gold, 5, { opacity: clamp(u, 0, 1) });
  }

  /* a short arc, part of a circle about (cx, cy), from angle a0 over da radians */
  function ieArc(cx, cy, r, a0, da, col, w, extra) {
    var x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
    var x1 = cx + r * Math.cos(a0 + da), y1 = cy + r * Math.sin(a0 + da);
    return Pth("M" + n2(x0) + "," + n2(y0) + " A" + n2(r) + "," + n2(r) + " 0 0 " + (da > 0 ? 1 : 0) +
      " " + n2(x1) + "," + n2(y1), null, col, w, extra);
  }

  /* the Sun, the kit's gold, with eight rays turning slowly */
  function ieSun(cx, cy, r, o, t) {
    if (!(o > 0)) return "";
    var rays = "", a0 = (t || 0) * 0.3;
    for (var k = 0; k < 8; k++) {
      var a = a0 + k * Math.PI / 4;
      rays += L(cx + Math.cos(a) * r * 1.3, cy + Math.sin(a) * r * 1.3,
        cx + Math.cos(a) * r * 1.75, cy + Math.sin(a) * r * 1.75, P.gold, r * 0.2);
    }
    return G(MK.glow(cx, cy, r * 2.2, P.gold, 1) + rays + C(cx, cy, r, P.gold), { opacity: clamp(o, 0, 1) });
  }

  /* a shake that is the same every time it is drawn: dies away over `span` */
  function ieShake(t, at, span, amp) {
    if (at == null || t < at || t > at + span) return 0;
    var u = (t - at) / span;
    return amp * (1 - u) * Math.sin((t - at) * 46);
  }

  /* ==== the title ==================================================================
     The lesson's own Earth, cut open, in a round window. In the spoken title
     chapter the three layers light one after another from the outside in, on
     "three layers"; the question of how anybody knows is asked on "Nobody has
     ever dug down", and answered by the word evidence. On the two cards the
     Earth simply stands. */
  var IE_MOTIF = { x: 20, y: 20, s: 320, cx: 180, cy: 180, k: 1 };
  function ieMotifR(r) { return r * IE_MOTIF.k; }
  function titleMotif(o) {
    var t = o.t || 0, out = "";
    var cx = IE_MOTIF.cx, cy = IE_MOTIF.cy;
    var three = o.scene ? sc(o.scene, 0, "three") : null;
    var dug = o.scene ? sc(o.scene, 1, "dug") : null;
    var ev = o.scene ? sc(o.scene, 1, "evidence") : null;

    out += el("clipPath", { id: "ieMotifClip" }, C(cx, cy, 168));
    out += C(cx, cy, 168, "#0B1D2C");
    out += G(ART.place(ART.figure("earthLayers"), IE_MOTIF.x, IE_MOTIF.y, IE_MOTIF.s, IE_MOTIF.s),
      { "clip-path": "url(#ieMotifClip)" });
    /* the three layers, from the outside in, one after another */
    if (three != null && t >= three) {
      var bands = [[ieMotifR(130), ieMotifR(140)], [ieMotifR(77), ieMotifR(130)], [0, ieMotifR(77)]];
      for (var k = 0; k < 3; k++) {
        var at = three + k * 0.34;
        var u = on(t, at, 0.3) * (1 - 0.55 * on(t, at + 0.9, 0.5));
        out += ieBand(cx, cy, bands[k][0], bands[k][1], u, P.gold);
      }
    }
    out += MK.qmark(300, 78, 26, popIn(t, dug, 0.4) * (1 - on(t, ev, 0.4)));
    out += MK.glow(cx, cy, 170, P.teal, on(t, ev, 0.7) * (0.6 + 0.4 * breathe(t)));
    out += C(cx, cy, 168, "none", P.line, 3);
    return '<svg viewBox="0 0 360 360" role="img" aria-label="The Earth cut open to show its crust, mantle and core">' + out + "</svg>";
  }

  /* ==== chapter: crust, mantle, core ==================================================
     The lesson's tap figure (ART.figure "earthLayers"), drawn whole and large,
     with one layer lit at a time and the lesson's own word beside it. The
     figure's cut quadrant is the upper right, so the words sit to the right of
     it and each line runs back to its own layer. */
  var IE_L = { x: 56, y: 50, s: 360 };
  IE_L.k = IE_L.s / 320;
  IE_L.cx = IE_L.x + 160 * IE_L.k;
  IE_L.cy = IE_L.y + 160 * IE_L.k;
  function ieLX(v) { return IE_L.x + v * IE_L.k; }
  function ieLY(v) { return IE_L.y + v * IE_L.k; }
  function ieLR(r) { return r * IE_L.k; }
  /* a point in the middle of a layer's band, at 45 degrees into the cut */
  function ieLPoint(r) {
    var a = -Math.PI / 4;
    return [IE_L.cx + ieLR(r) * Math.cos(a), IE_L.cy + ieLR(r) * Math.sin(a)];
  }

  var IE_ROWS = [
    { id: "crust", word: "crust", sub: "thin, hard rock", y: 108, mid: 135, num: 162, rIn: 130, rOut: 140 },
    { id: "mantle", word: "mantle", sub: "thick, hot, solid rock", y: 228, mid: 103, num: 100, rIn: 77, rOut: 130 },
    { id: "core", word: "core", sub: "metal, at the centre", y: 348, mid: 45, num: 36, rIn: 0, rOut: 77 }
  ];

  function ieLayersChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cModel = c(0, "model"), cThree = c(0, "three");
    var cCrust = c(1, "crust"), cThin = c(1, "thin"), cLive = c(1, "live");
    var cMantle = c(2, "mantle"), cThick = c(2, "thick"), cHot = c(2, "hot");
    var cMost = c(3, "most"), cFlow = c(3, "flow");
    var cCore = c(4, "core"), cMetal = c(4, "metal");
    var cSun = c(5, "sun");
    var out = "";

    /* the lesson's drawing, whole, with room round it */
    out += R(IE_L.x - 12, IE_L.y - 12, IE_L.s + 24, IE_L.s + 24, 20, P.card, P.line, 2);
    out += ART.place(ART.figure("earthLayers"), IE_L.x, IE_L.y, IE_L.s, IE_L.s);

    /* "three layers": the three bands count off from the outside in */
    var three = on(t, cThree, 0.3) * ieOnly(t, scene, 0);
    if (three > 0) {
      for (var k = 0; k < 3; k++) {
        var row = IE_ROWS[k], at = cThree == null ? null : cThree + k * 0.42;
        out += ieBand(IE_L.cx, IE_L.cy, ieLR(row.rIn), ieLR(row.rOut), on(t, at, 0.32) * three, P.gold);
        var np = ieLPoint(row.num);
        out += MK.pop(C(np[0], np[1], 27, "rgba(11,29,44,0.82)", P.gold, 2) +
          Tx(np[0], np[1] + 14, String(k + 1), "lab huge", "middle", { fill: P.ink }),
          np[0], np[1], popIn(t, at == null ? null : at + 0.12, 0.3) * three);
      }
    }

    /* one layer at a time, from beat 1 on: the one being named is gold and
       washed white, the ones already named keep a quiet teal edge */
    var named = [cCrust, cMantle, cCore];
    var live = [ieSpan(t, scene, 1, 1), ieSpan(t, scene, 2, 3), ieFrom(t, scene, 4)];
    for (var m = 0; m < 3; m++) {
      var r2 = IE_ROWS[m], appear = on(t, named[m], 0.4);
      if (appear <= 0) continue;
      var lit = Math.max(live[m], 0);
      out += ieBand(IE_L.cx, IE_L.cy, ieLR(r2.rIn), ieLR(r2.rOut),
        appear * (lit > 0.02 ? 1 : 0.34), lit > 0.02 ? P.gold : P.teal, lit > 0.02 ? 1 : 0);
    }

    /* the words, one row each, with a line back to the layer */
    var now = cCore != null && t >= cCore ? 2 : cMantle != null && t >= cMantle ? 1 : 0;
    for (var q = 0; q < 3; q++) {
      var r3 = IE_ROWS[q], at3 = named[q], o3 = on(t, at3, 0.4);
      if (o3 <= 0) continue;
      out += ieTag(t, 700, r3.y, r3.word, at3, ieLPoint(r3.mid), now === q, 32, "left");
      var so = on(t, [cThin, cThick, cMetal][q], 0.45);
      if (so > 0) out += Tx(700, r3.y + 48, r3.sub, "lab mid muted", "middle", { opacity: so });
    }

    /* "We live on it": a child stands on the crust, at the top of the globe */
    var liveO = on(t, cLive, 0.4) * ieOnly(t, scene, 1);
    if (liveO > 0) {
      var hx = ieLX(90), hy = ieLY(160 - Math.sqrt(140 * 140 - 70 * 70));
      out += MK.pop(Em(hx, hy - 26, 46, "\u{1F9D2}"), hx, hy - 26, popIn(t, cLive, 0.4) * liveO);
      out += MK.ripple(hx, hy - 4, t, cLive, P.gold);
    }

    /* "hot, solid rock" and "most of the Earth": the mantle glows and is named */
    var hotO = on(t, cHot, 0.5) * ieSpan(t, scene, 2, 3);
    if (hotO > 0) out += MK.glow(ieLPoint(103)[0], ieLPoint(103)[1], 92, P.accent, hotO * (0.6 + 0.4 * breathe(t)));
    var mostO = on(t, cMost, 0.45) * ieOnly(t, scene, 3);
    if (mostO > 0) out += MK.pill(990, 228, "most of the Earth", mostO, { size: 28, col: P.gold });

    /* "flow, very slowly": rock creeping round inside the mantle band */
    var flowO = on(t, cFlow, 0.5) * ieOnly(t, scene, 3);
    if (flowO > 0) {
      for (var f = 0; f < 3; f++) {
        var rr = ieLR(88 + f * 17), a0 = -Math.PI / 2 + 0.22 + ((t * 0.09 + f * 0.31) % 0.6);
        out += ieArc(IE_L.cx, IE_L.cy, rr, a0, 0.5, P.gold, 5, { opacity: 0.85 * flowO });
        var ae = a0 + 0.5;
        out += MK.arrow(IE_L.cx + rr * Math.cos(ae - 0.06), IE_L.cy + rr * Math.sin(ae - 0.06),
          IE_L.cx + rr * Math.cos(ae + 0.05), IE_L.cy + rr * Math.sin(ae + 0.05), flowO, P.gold, 5);
      }
    }

    /* "metal, not rock": the core's word changes from rock to metal */
    var metO = on(t, cMetal, 0.45) * ieSpan(t, scene, 4, 5);
    if (metO > 0) out += MK.pill(990, 348, "metal, not rock", metO, { size: 28, col: P.gold });

    /* "as hot as the surface of the Sun" */
    var sunO = on(t, cSun, 0.5);
    if (sunO > 0) {
      var px = 700 + iePillW("core", 32) / 2 + 10;
      out += L(px, 340, lerp(px, 996, sunO), lerp(340, 214, sunO), P.gold, 3, { "stroke-dasharray": "10 8", opacity: 0.9 });
      out += ieSun(1040, 176, 44, popIn(t, cSun == null ? null : cSun + 0.2, 0.45), t);
    }

    /* "Scientists model": the whole drawing is a model, and says so */
    var modO = on(t, cModel, 0.45) * ieOnly(t, scene, 0);
    if (modO > 0) out += MK.pill(880, 60, "a model of the inside", modO, { size: 28, col: P.line });
    return svg(out);
  }
