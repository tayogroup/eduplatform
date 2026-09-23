  /* ==== Electricity and Circuits, part 5 ======================================
     The last two chapters and "What you now know".

     "The diagram is a model" is the lesson's demo step as three cards side by
     side - the real torch opened up, a picture of a torch, and the lesson's own
     circuit drawing - because that step's whole point is the difference between
     them (2TWSm.03). "How a torch works" is the same drawing with a switch cut
     into the top wire: a gap the child opens and closes, and the torch beside
     it lighting and going out with it. */

  /* a value that steps from key to key, each over 0.35 s; keys are in order */
  function ecKeyed(t, keys, dflt) {
    var v = dflt;
    for (var k = 0; k < keys.length; k++) {
      if (keys[k][0] == null) continue;
      v = lerp(v, keys[k][1], ease(clamp((t - keys[k][0]) / 0.35, 0, 1)));
    }
    return v;
  }

  /* ---- a circuit diagram small enough for a card ------------------------------
     The lesson's own symbols: a long line and a short line for the cell, a
     circle with a cross for the lamp, straight lines for the wires. */
  function ecMiniLoop(cx, cy, size, opt) {
    opt = opt || {};
    var w = size * 0.96, h = size * 0.7, sw = Math.max(3, size * 0.075);
    var x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - h / 2, y1 = cy + h / 2;
    var col = opt.col || P.gold, g = "";
    var swb = opt.sw == null ? 0 : size * 0.15, gpb = opt.gap ? size * 0.13 : 0;
    var cb = size * 0.1, lb = size * 0.15, lr = size * 0.15;
    g += L(x0, y0, cx - swb, y0, col, sw) + L(cx + swb, y0, x1, y0, col, sw);
    g += L(x1, y0, x1, cy - lb, col, sw) + L(x1, cy + lb, x1, y1, col, sw);
    g += L(x1, y1, cx + gpb, y1, col, sw) + L(cx - gpb, y1, x0, y1, col, sw);
    g += L(x0, y1, x0, cy + cb, col, sw) + L(x0, cy - cb, x0, y0, col, sw);
    g += L(x0 - size * 0.11, cy - cb * 0.5, x0 + size * 0.11, cy - cb * 0.5, col, sw);
    g += L(x0 - size * 0.055, cy + cb * 0.5, x0 + size * 0.055, cy + cb * 0.5, col, sw);
    g += C(x1, cy, lr, opt.on ? col : "none", col, sw * 0.8);
    g += L(x1 - lr * 0.66, cy - lr * 0.66, x1 + lr * 0.66, cy + lr * 0.66, opt.on ? P.night : col, sw * 0.7);
    g += L(x1 + lr * 0.66, cy - lr * 0.66, x1 - lr * 0.66, cy + lr * 0.66, opt.on ? P.night : col, sw * 0.7);
    /* The break in the bottom wire is the picture; the words are the card's
       own title. Only a caller that has room asks for the label - on a recap
       card it landed on top of "A gap stops it". */
    if (opt.gap && opt.label) g += Tx(cx, y1 + size * 0.32, "a gap", "lab mid bad", "middle");
    if (opt.sw != null) {
      var a = -0.62 * (1 - opt.sw), ln = swb * 2.1;
      g += C(cx - swb, y0, sw * 0.9, col) + C(cx + swb, y0, sw * 0.9, col);
      g += L(cx - swb, y0, cx - swb + ln * Math.cos(a), y0 + ln * Math.sin(a), col, sw);
    }
    if (opt.on) g += MK.glow(x1, cy, size * 0.45, col, 0.75);
    return g;
  }

  /* ==== chapter: the diagram is a model ========================================= */
  var EC_D = { y: 86, h: 286, w: 354, x: [31, 407, 783] };
  function ecDCx(k) { return EC_D.x[k] + EC_D.w / 2; }
  var EC_DIA = ecMap(795, 108, 0.98);

  function ecDiagramChapter(scene, beat, t, i) {
    var cTorch = sc(scene, 0, "torch"), cBatt = sc(scene, 0, "battery"),
      cStrips = sc(scene, 0, "strips"), cLamp0 = sc(scene, 0, "lamp");
    var cPic = sc(scene, 1, "picture"), cLooks = sc(scene, 1, "looks"), cInside = sc(scene, 1, "loop");
    var cDia = sc(scene, 2, "diagram"), cSym = sc(scene, 2, "symbols"),
      cLong = sc(scene, 2, "long"), cShort = sc(scene, 2, "short"), cCell = sc(scene, 2, "cell");
    var cCircle = sc(scene, 3, "circle"), cLamp3 = sc(scene, 3, "lamp"),
      cLines = sc(scene, 3, "lines"), cWires = sc(scene, 3, "wires");
    var cModel = sc(scene, 4, "model"), cLoop = sc(scene, 4, "loop");
    var m = EC_DIA, out = "";

    /* --- 1: a real torch, opened up ------------------------------------------ */
    var t1 = on(t, cTorch, 0.5), c1 = ecDCx(0), s1 = 1.2, tx = 208, ty = 196;
    out += ecCard(EC_D.x[0], EC_D.y, EC_D.w, EC_D.h, 0.4 + 0.6 * t1, P.line);
    if (t1 > 0) {
      out += G(ecTorch(tx, ty, s1, { on: true, sw: 1, cut: true }), { opacity: t1 });
      var own = ecOnly(t, scene, 0);
      var last = ecLatest(t, [[cBatt, "battery"], [cStrips, "metal strips"], [cLamp0, "a lamp"]]);
      /* The pointer here is TEAL, not the film's gold and not white: the
         battery IS gold, so a gold ring round it is invisible, and the strips
         are silver, so a white ring round each of those read as part of the
         torch rather than as a pointer at it. Teal is in neither. */
      var ec = P.teal;
      if (last === "battery")
        out += R(tx + EC_TP.batt[0] * s1 - 8, ty + EC_TP.batt[1] * s1 - 8, EC_TP.batt[2] * s1 + 16,
          EC_TP.batt[3] * s1 + 16, 11, "none", ec, 5, { opacity: on(t, cBatt, 0.45) * own });
      if (last === "metal strips")
        out += R(tx + EC_TP.stripX[0] * s1 - 6, ty - EC_TP.strip * s1 - 9, (EC_TP.stripX[1] - EC_TP.stripX[0]) * s1 + 12, 18, 9, "none", ec, 5, { opacity: on(t, cStrips, 0.45) * own }) +
          R(tx + EC_TP.stripX[0] * s1 - 6, ty + EC_TP.strip * s1 - 9, (EC_TP.stripX[1] - EC_TP.stripX[0]) * s1 + 12, 18, 9, "none", ec, 5, { opacity: on(t, cStrips, 0.45) * own });
      if (last === "a lamp")
        out += C(tx + EC_TP.lamp[0] * s1, ty, EC_TP.lamp[2] * s1 + 12, "none", ec, 5, { opacity: on(t, cLamp0, 0.45) * own });
      if (last) out += MK.pill(c1, 292, last, own, { size: 24, col: P.gold });
      out += ecCap(c1, EC_D.y + EC_D.h - 26, "a real torch", t1);
    }

    /* --- 2: a picture of a torch --------------------------------------------- */
    var t2 = on(t, cPic, 0.5), c2 = ecDCx(1);
    out += ecCard(EC_D.x[1], EC_D.y, EC_D.w, EC_D.h, 0.4 + 0.6 * t2, P.line);
    if (t2 > 0) {
      out += G(MK.pic(c2, 178, 150, "\u{1F526}"), { transform: around(c2, 178, 1 + 0.07 * bump(t, cLooks, 0.9)), opacity: t2 });
      /* "It does not show the loop inside": the thing crossed out is the LOOP,
         in an empty window below the torch, not the torch. The first cut put
         the dashed box and the cross over the torch itself, which reads as
         "this torch is wrong" rather than "the loop is not in here". */
      var io = on(t, cInside, 0.5) * ecOnly(t, scene, 1);
      if (io > 0) {
        out += R(c2 - 112, 252, 224, 68, 18, "none", P.muted, 4, { opacity: 0.85 * io, "stroke-dasharray": "12 10" });
        out += G(ecMiniLoop(c2 - 28, 286, 54, { col: P.muted }), { opacity: 0.6 * io });
        out += MK.cross(c2 + 64, 286, 21, popIn(t, cInside == null ? null : cInside + 0.35, 0.4) * io);
      }
      out += ecCap(c2, EC_D.y + EC_D.h - 26, "a picture", t2);
    }

    /* --- 3: the lesson's own circuit diagram ---------------------------------- */
    var t3 = on(t, cDia, 0.5), c3 = ecDCx(2);
    out += ecCard(EC_D.x[2], EC_D.y, EC_D.w, EC_D.h, 0.4 + 0.6 * t3, P.line);
    if (t3 > 0) {
      var pic = ART.kit.circuitSvg({ cell: true, lamp: true, wireTop: true, wireBottom: true, on: true });
      var sf = bump(t, cSym, 1.1);
      if (sf > 0) {
        var fc = "rgba(244,201,93," + n2(sf) + ")";
        pic = ART.ring(ART.ring(ART.ring(pic, "cell", fc, 6), "wire", fc, 6), "lamp", fc, 6);
      }
      /* The pointer belongs to the two beats that name symbols. Beat 4 names
         none, so it is dropped there rather than left on whichever part was
         last said (rule 3: point at one part at a time, and at nothing when
         nothing is being named). */
      var naming = ecOnly(t, scene, 2) + ecOnly(t, scene, 3);
      var nowp = naming > 0.5 ? ecLatest(t, [[cCell, "cell"], [cCircle, "lamp"], [cWires, "wire"]]) : null;
      if (nowp) pic = ART.ring(pic, nowp, P.gold, 6);
      out += G(ecPlaceMarkup(pic, m), { opacity: t3 });
      /* the long line and the short line of the cell symbol, one at a time */
      out += L(m.x(34), m.y(97), m.x(86), m.y(97), P.gold, 8, { opacity: bump(t, cLong, 1.1) });
      out += L(m.x(46), m.y(123), m.x(74), m.y(123), P.gold, 8, { opacity: bump(t, cShort, 1.1) });
      /* the circle and its cross */
      out += C(m.x(260), m.y(110), 30, "none", P.gold, 5, { opacity: bump(t, cCircle, 1.2) });
      out += L(m.x(246), m.y(96), m.x(274), m.y(124), P.gold, 5, { opacity: bump(t, cCircle == null ? null : cCircle + 0.35, 1.0) }) +
        L(m.x(274), m.y(96), m.x(246), m.y(124), P.gold, 5, { opacity: bump(t, cCircle == null ? null : cCircle + 0.35, 1.0) });
      /* the straight lines that are the wires */
      var lu = on(t, cLines, 0.7);
      if (lu > 0) {
        out += L(m.x(60), m.y(60), m.x(lerp(60, 260, lu)), m.y(60), P.gold, 8, { opacity: 0.9 });
        out += L(m.x(260), m.y(160), m.x(lerp(260, 60, lu)), m.y(160), P.gold, 8, { opacity: 0.9 });
      }
      out += ecLoopTrace(m, on(t, cLoop, 0.9));
      out += ecCap(c3, EC_D.y + EC_D.h - 26, "a diagram", t3);
    }

    /* --- the diagram is a model OF the torch ---------------------------------- */
    var mo = on(t, cModel, 0.8);
    if (mo > 0) {
      var hw = ecPillHalf("a model", 26);
      out += L(c1, 52, lerp(c1, 584 - hw - 10, mo), 52, P.gold, 4, { "stroke-dasharray": "12 9" });
      out += L(c3, 52, lerp(c3, 584 + hw + 10, mo), 52, P.gold, 4, { "stroke-dasharray": "12 9" });
      out += L(c1, 52, c1, lerp(52, EC_D.y - 4, mo), P.gold, 4) + L(c3, 52, c3, lerp(52, EC_D.y - 4, mo), P.gold, 4);
      out += MK.pill(584, 52, "a model", on(t, cModel, 0.45), { size: 26, col: P.gold });
    }
    return svg(out);
  }

  /* ==== chapter: how a torch works ==============================================
     The lesson's circuit with a switch cut into the top wire. The lever and
     the torch's own slider move together, and the lamp - the drawing's and the
     torch's - follows the loop. */
  var EC_SW = ecMap(60, 66, 1.5);
  function ecSwitchChapter(scene, beat, t, i) {
    var cSwitch = sc(scene, 0, "switch"), cGap = sc(scene, 0, "gap"), cOpen = sc(scene, 0, "open");
    var cOn = sc(scene, 1, "on"), cCloses = sc(scene, 1, "closes"), cLights = sc(scene, 1, "lights");
    var cOff = sc(scene, 2, "off"), cOpens = sc(scene, 2, "opens"), cOut = sc(scene, 2, "out");
    var m = EC_SW;
    var open = ecKeyed(t, [[cSwitch, 0], [cGap, 1], [cOpen == null ? null : cOpen + 0.45, 0],
      [cOpen == null ? null : cOpen + 0.95, 1], [cOn, 0], [cOff, 1]], 0);
    var lit = open < 0.5, shown = on(t, cSwitch, 0.4);
    var out = ecPlaceCircuit({ cell: true, lamp: true, wireTop: true, wireBottom: true, on: lit }, m);
    out += MK.glow(m.x(260), m.y(110), 92, P.gold,
      (lit ? 0.45 + 0.4 * breathe(t) : 0) + 0.7 * bump(t, cLights, 1.2));

    /* the switch, cut into the top wire the way the drawing cuts a gap */
    if (shown > 0) {
      var sx1 = m.x(140), sx2 = m.x(180), sy = m.y(60), ln = sx2 - sx1, a = -0.62 * open;
      out += G(R(sx1 - 4, sy - 12, ln + 8, 24, 0, P.night) +
        C(sx1, sy, 8, P.gold) + C(sx2, sy, 8, P.gold) +
        L(sx1, sy, sx1 + ln * Math.cos(a), sy + ln * Math.sin(a), P.gold, 9), { opacity: shown });
      out += MK.leader(m.x(160), 52, m.x(160), sy - 26, shown, P.gold) +
        MK.pill(m.x(160), 32, "switch", shown, { size: 24, col: P.gold });
      if (open > 0.5) {
        out += C(m.x(160), sy, 32, "none", P.bad, 4,
          { opacity: (open - 0.5) * 2 * (0.6 + 0.4 * breathe(t)) });
        out += Tx(m.x(160), m.y(100), "a gap", "lab mid bad", "middle", { opacity: (open - 0.5) * 2 });
      }
      out += ecLoopTrace(m, on(t, cCloses, 0.8) * (lit ? 1 : 0), P.gold, 6);
      out += C(m.x(260), m.y(110), 46, "none", P.muted, 4, { opacity: 0.85 * bump(t, cOut, 1.0) });
    }
    out += ecCap(m.x(160), 424, "its circuit", shown, "lab mid");

    /* the torch: its slider and its lamp follow the switch */
    out += G(ecTorch(830, 222, 1.1, { on: lit, beam: lit ? 0.85 : 0, sw: 1 - open }), { opacity: 1 });
    out += MK.ripple(830 - 40 * 1.1, 222 - 42 * 1.1, t, cSwitch, P.gold);
    out += ecCap(830, 348, "a torch", 1, "lab mid");
    return svg(out);
  }

  /* ==== what you now know ======================================================= */
  function ecRecapScene() {
    for (var k = 0; k < F.scenes.length; k++) if (F.scenes[k].id === "recap") return F.scenes[k];
    return null;
  }
  var EC_RECAP = MK.recapKind([
    { beat: 0, at: "jobs", title: "Electric jobs", sub: "light, heat, cold, sound", pic: "\u{1F4A1}" },
    { beat: 0, at: "rules", title: "Stay safe", sub: "only plugs, dry hands", pic: "⚠️" },
    { beat: 1, at: "parts", title: "Cell, wires, lamp", sub: "in a complete loop",
      pic: function (cx, cy, size, t) {
        var s = ecRecapScene();
        return ecMiniLoop(cx, cy, size, { on: s ? ecAt(t, sc(s, 1, "loop")) : false });
      } },
    { beat: 1, at: "gap", title: "A gap stops it", sub: "the lamp goes out",
      pic: function (cx, cy, size) { return ecMiniLoop(cx, cy, size, { gap: true }); } },
    /* The lever swings shut and open, and the lamp is lit only while it is
       SHUT: a lamp burning over a half-open switch says the opposite of the
       card it sits on. So the lever moves over half a second and then holds,
       and the lamp follows the same number. */
    { beat: 2, at: "switch", title: "A switch", sub: "opens and closes a gap",
      pic: function (cx, cy, size, t) {
        var s = ecRecapScene(), at = s ? sc(s, 2, "switch") : null;
        var u = 1;
        if (at != null && t >= at) {
          var ph = ((t - at) / 2.4) % 1;
          u = ph < 0.5 ? 1 - ease(clamp(ph / 0.22, 0, 1)) : ease(clamp((ph - 0.5) / 0.22, 0, 1));
        }
        return ecMiniLoop(cx, cy, size, { sw: u, on: u > 0.92 });
      } },
    { beat: 2, at: "diagram", title: "A diagram", sub: "a model of the circuit", pic: "\u{1F4D0}" }
  ], { goBeat: 2, goAt: "model" });

  var KINDS = {
    title: MK.titleKind({ sub: ["What electricity does for us", "The rules that keep you safe", "A cell, wires and a lamp in a loop"] }),
    uses: ecUsesChapter, safe: ecSafeChapter, parts: ecPartsChapter, gap: ecGapChapter,
    diagram: ecDiagramChapter, "switch": ecSwitchChapter, recap: EC_RECAP
  };
