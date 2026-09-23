  /* ==== chapters: waterproof or not, chosen for the job, and the recap =========
     tools/lib/film-scenes/science-g2/natural-or-made-3.js. */

  /* ---- waterproof or not ----------------------------------------------------
     The lesson's drip test, then the table it asks the child to fill in. Water
     is dripped on glass and runs off it; the same water on wool sinks in and
     leaves a wet patch. Then the five rows of the record step, filling in as
     they are named: glass yes, wool no, metal yes, sponge no, thin plastic yes. */
  var NM_WET = [330, 838];

  /* `named` lights the name pill: the voice has just said WHICH material is
     being dripped on. `lit` lights the whole plate, on the property word. */
  function nmDripTile(cx, pic, name, named, lit, col) {
    return nmTile(cx, 200, 380, 330, lit > 0.4, 1) +
      MK.pic(cx, 186, 200, pic) +
      MK.pill(cx, 318, name, 1, { size: 30, col: named > 0.4 ? col : P.line });
  }
  /* drops falling on a tile from `at` until `until`: one every half second, so
     the water is still falling when the line about it ends */
  function nmDrips(t, at, until, cx, land, off) {
    if (at == null || t < at) return "";
    var out = "";
    for (var k = 0; k < 8; k++) {
      var born = at + k * 0.46;
      if (born > until) break;
      var ph = (t - born) / 1.05;
      if (ph < 0 || ph >= 1) continue;
      var fall = Math.min(1, ph / 0.42), run = clamp((ph - 0.42) / 0.58, 0, 1);
      var x = cx - 24 + (off ? 236 * run * run : 0);
      var y = lerp(46, land, fall * fall) + (off ? 214 * run * run : 0);
      out += nmDrop(x, y, 12 - (off ? 0 : 5 * run), off ? 1 - run * run * run : 1 - run * 0.2);
    }
    return out;
  }

  function nmDripPic(scene, t) {
    var c = function (b, n) { return sc(scene, b, n); };
    var cD0 = c(0, "drip"), cRun = c(0, "runs"), cD1 = c(1, "drip"), cSoak = c(1, "soaks");
    var cWp = c(2, "glass"), cThr = c(2, "through"), cAb = c(3, "wool"), cUp = c(3, "soaks");
    var cG0 = c(0, "glass");
    var out = "", woolIn = on(t, c(1, "wool"), 0.5);
    out += nmDripTile(NM_WET[0], ART.ICONS.glass, "glass", on(t, cG0, 0.5), on(t, cWp, 0.5), P.teal);
    out += G(nmDripTile(NM_WET[1], NM_PIC.wool, "wool", woolIn, on(t, cAb, 0.5), P.blue), { opacity: woolIn });
    /* "on glass": the plate the water is about to land on flashes its outline,
       so the material being named is the thing that moves */
    var g0 = bump(t, cG0, 1.4);
    if (g0 > 0) out += R(NM_WET[0] - 190, 35, 380, 330, 18, "none", P.gold, 4, { opacity: g0 });
    /* on glass the water runs off the side; on wool it sinks in */
    out += nmDrips(t, cD0, cRun == null ? 0 : cRun + 0.3, NM_WET[0], 150, true);
    out += G(nmDrips(t, cD1, cSoak == null ? 0 : cSoak + 0.3, NM_WET[1], 180, false), { opacity: woolIn });
    var wet = on(t, cSoak, 1.2) * woolIn;
    if (wet > 0) out += E(NM_WET[1], 208, 92 * wet, 62 * wet, "#2E6FA0", null, null, { opacity: 0.5 * wet });
    /* the two words the lesson gives them */
    var wp = popIn(t, cWp, 0.45);
    if (wp > 0) {
      out += MK.pill(NM_WET[0], 406, "waterproof", Math.min(1, wp), { size: 32, col: P.teal });
      out += MK.tick(NM_WET[0] + 186, 406, 22, popIn(t, nmAfter(cThr, 0.1), 0.4));
      /* "does not go through it": a bar across the pane, and a drop stopped on it */
      var th = on(t, cThr, 0.5);
      if (th > 0) out += L(NM_WET[0] - 104, 276, NM_WET[0] + 104, 276, P.teal, 7, { opacity: th }) +
        nmDrop(NM_WET[0], 260, 12, th);
    }
    var ab = popIn(t, cAb, 0.45);
    if (ab > 0) {
      out += MK.pill(NM_WET[1], 406, "absorbent", Math.min(1, ab), { size: 32, col: P.blue });
      /* "it soaks water up": three drops sink into the wool and the patch grows */
      var up = on(t, cUp, 0.8);
      for (var q = 0; q < 3; q++) {
        var ph = clamp((t - (cUp == null ? 1e9 : cUp) - q * 0.28) / 0.9, 0, 1);
        if (ph <= 0 || ph >= 1) continue;
        out += nmDrop(NM_WET[1] - 60 + q * 60, lerp(120, 226, ph * ph), 12 * (1 - ph * 0.7), 1 - ph * ph);
      }
      if (up > 0) out += E(NM_WET[1], 208, 104, 72, "none", "#7FC4EA", 4, { opacity: up * (0.4 + 0.6 * breathe(t)) });
    }
    return out;
  }

  /* the record step's table */
  var NM_ROWS = [
    { pic: ART.ICONS.glass, label: "glass", yes: true },
    { pic: NM_PIC.wool, label: "wool", yes: false },
    { pic: NM_PIC.metal, label: "metal", yes: true },
    { pic: NM_PIC.sponge, label: "sponge", yes: false },
    { pic: NM_PIC.plastic, label: "thin plastic", yes: true }
  ];
  function nmTablePic(scene, t) {
    var c = function (b, n) { return sc(scene, b, n); };
    var cRec = c(4, "record"), cTab = c(4, "table"), cG = c(4, "glass"), cW = c(4, "wool");
    var cRow = c(5, "row"), cCmp = c(5, "compare");
    var fr = on(t, cRec, 0.5), ruled = on(t, cTab, 0.5), out = "";
    out += R(150, 30, 868, 380, 22, P.card, P.line, 2, { opacity: fr });
    out += Tx(214, 82, "Material", "lab big muted", "start", { opacity: ruled });
    out += Tx(958, 82, "Waterproof?", "lab big muted", "end", { opacity: ruled });
    out += L(176, 102, 992, 102, P.line, 2, { opacity: ruled });
    var ats = [cG, cW, cRow, nmAfter(cRow, 0.5), nmAfter(cRow, 1.0)];
    for (var q = 0; q < 5; q++) {
      var y = 146 + q * 56, o = on(t, ats[q], 0.4), r = NM_ROWS[q];
      /* every row of the table is there from the start, waiting to be filled */
      out += R(176, y - 25, 816, 50, 12, "none", P.line, 2,
        { "stroke-dasharray": "10 9", opacity: ruled * (1 - o) * 0.8 });
      if (o <= 0) continue;
      out += G(R(176, y - 25, 816, 50, 12, P.cell) +
        MK.pic(212, y, 44, r.pic) +
        Tx(256, y + 10, r.label, "lab big", "start") +
        Tx(958, y + 10, r.yes ? "yes" : "no", r.yes ? "lab big good" : "lab big bad", "end"),
        { opacity: o, transform: "translate(" + n2((1 - o) * 16) + ",0)" });
      if (r.yes) out += MK.tick(862, y, 19, popIn(t, nmAfter(ats[q], 0.25), 0.35));
      else out += MK.cross(862, y, 19, popIn(t, nmAfter(ats[q], 0.25), 0.35));
    }
    var cm = on(t, cCmp, 0.6);
    if (cm > 0) out += R(820, 114, 186, 290, 18, "none", P.gold, 4, { opacity: cm });
    return out;
  }

  var NM_WATER_KIND = ["drip", "drip", "drip", "drip", "table", "table"];
  function nmWaterChapter(scene, beat, t, i) {
    var k = i - scene.first;
    var u = k === 0 || NM_WATER_KIND[k] === NM_WATER_KIND[k - 1] ? 1 : into(t, scene.first + k);
    var pic = function (q) { return NM_WATER_KIND[q] === "table" ? nmTablePic(scene, t) : nmDripPic(scene, t); };
    var out = "";
    if (u < 1) out += G(pic(k - 1), { opacity: 1 - u });
    return svg(out + G(pic(k), { opacity: u }));
  }

  /* ---- chosen for the job ---------------------------------------------------
     The lesson's context step: the kettle whose body is metal and whose handle
     is plastic, and the tyre that is rubber. The kettle is the kit's own
     drawing, so the ring lands on its own handle: in its 64 x 64 space the body
     is the panel (14, 18) to (45, 52) and the handle the arc round (52, 35). */
  var NM_KET = { cx: 330, cy: 196, size: 320 };
  function nmKX(a) { return NM_KET.cx - NM_KET.size / 2 + a * NM_KET.size / 64; }
  function nmKY(b) { return NM_KET.cy - NM_KET.size / 2 + b * NM_KET.size / 64; }

  /* a pill with a line back to the thing it names */
  function nmLeaderPill(t, x1, y1, x2, y2, text, at, col, size) {
    var o = on(t, at, 0.45);
    if (o <= 0) return "";
    return MK.leader(x1, y1, x2 - 12, y2, on(t, at, 0.6), col) +
      MK.pill(x2, y2, text, o, { size: size || 30, col: col, anchor: "start" });
  }

  /* beat 1: a material is chosen for a job, because of its properties */
  function nmChoosePic(scene, t) {
    var c = function (b, n) { return sc(scene, b, n); };
    var cCh = c(0, "choose"), cJob = c(0, "job"), cPr = c(0, "props"), out = "";
    var mats = [NM_PIC.wood, NM_PIC.metal, NM_PIC.plastic, NM_PIC.wool];
    var ch = on(t, cCh, 0.5);
    out += R(46, 44, 318, 318, 24, P.cell, P.line, 2, { opacity: ch });
    for (var q = 0; q < 4; q++) {
      var mx = 130 + (q % 2) * 150, my = 128 + Math.floor(q / 2) * 150;
      out += MK.pop(MK.pic(mx, my, 96, mats[q]), mx, my, popIn(t, nmAfter(cCh, q * 0.16), 0.4));
    }
    out += MK.pill(205, 400, "materials", ch, { size: 30, col: P.line });
    var jb = on(t, cJob, 0.5);
    var jobs = [NM_PIC.kettle, NM_PIC.bike, NM_PIC.boot];
    out += R(804, 44, 318, 318, 24, P.cell, P.line, 2, { opacity: jb });
    for (var r = 0; r < 3; r++) {
      out += MK.pop(MK.pic(963, 118 + r * 104, 96, jobs[r]), 963, 118 + r * 104, popIn(t, nmAfter(cJob, r * 0.18), 0.4));
    }
    out += MK.pill(963, 400, "the job", jb, { size: 30, col: P.line });
    var pr = Math.min(1, popIn(t, cPr, 0.5));
    out += MK.arrow(378, 200, 442, 200, pr, P.gold, 8);
    out += MK.arrow(722, 200, 792, 200, pr, P.gold, 8);
    out += MK.pill(582, 200, "properties", pr, { size: 36, col: P.gold });
    return out;
  }

  /* beats 2 and 3: the kettle - a metal body that does not melt, a plastic
     handle that does not carry the heat to your hand */
  function nmKettlePic(scene, t, handle) {
    var c = function (b, n) { return sc(scene, b, n); };
    var cKet = c(1, "kettle"), cMet = c(1, "metal"), cMelt = c(1, "melt"), cHot = c(1, "hot");
    var cHan = c(2, "handle"), cPla = c(2, "plastic"), cHeat = c(2, "heat"), cHand = c(2, "hand");
    var hot = on(t, cHot, 0.7), out = "";
    out += G(R(nmKX(8), 372, nmKX(54) - nmKX(8), 16, 8, "#3A4A58"), { opacity: hot });
    out += MK.glow(nmKX(31), 336, 100, "#F0806F", hot * (0.55 + 0.35 * breathe(t)));
    out += nmFlame(nmKX(31), 374, 62, t, hot);
    out += MK.pop(MK.pic(NM_KET.cx, NM_KET.cy, NM_KET.size, NM_PIC.kettle), NM_KET.cx, NM_KET.cy, popIn(t, cKet, 0.5));
    if (!handle) {
      var mt = on(t, cMet, 0.5);
      out += R(nmKX(13), nmKY(17), nmKX(46) - nmKX(13), nmKY(53) - nmKY(17), 14, "none", P.gold, 4, { opacity: mt });
      out += nmLeaderPill(t, nmKX(45), nmKY(24), 700, 146, "metal", cMet, P.gold, 34);
      out += nmLeaderPill(t, nmKX(45), nmKY(46), 700, 268, "does not melt", cMelt, P.gold, 30);
    } else {
      var hn = on(t, cHan, 0.5);
      out += C(nmKX(52), nmKY(35), 46, "none", P.plum, 4, { opacity: hn });
      out += nmLeaderPill(t, nmKX(58), nmKY(28), 700, 140, "plastic", cPla, P.plum, 34);
      /* the heat travels through the body and stops at the plastic handle */
      var ht = on(t, cHeat, 0.6);
      if (ht > 0) {
        out += MK.arrow(nmKX(22), nmKY(35), lerp(nmKX(22), nmKX(43), ht), nmKY(35), ht, "#F0806F", 7);
        out += L(nmKX(46), nmKY(22), nmKX(46), nmKY(48), P.plum, 9, { opacity: ht });
        out += MK.cross(nmKX(46), nmKY(35), 24, popIn(t, nmAfter(cHeat, 0.5), 0.4));
      }
      var hd = popIn(t, cHand, 0.5);
      if (hd > 0) {
        out += MK.pop(Em(nmKX(66), nmKY(36), 76, NM_PIC.hand), nmKX(66), nmKY(36), hd);
        out += MK.pill(760, 350, "your hand stays cool", Math.min(1, hd), { size: 30, col: P.good });
      }
    }
    return out;
  }

  /* beat 4: the tyre rolls over a bump - rubber grips the road, and bends */
  function nmTyre(cx, cy, r, squash, spin) {
    var out = C(cx, cy, r, "#2A2A2E", "#111114", 4) + C(cx, cy, r * 0.4, "#93AABE", "#4E6070", 5);
    for (var k = 0; k < 12; k++) {
      var a = spin + k * Math.PI / 6;
      out += L(cx + Math.cos(a) * r * 0.72, cy + Math.sin(a) * r * 0.72,
        cx + Math.cos(a) * r * 0.97, cy + Math.sin(a) * r * 0.97, "#5A5A62", 7);
    }
    /* over the bump the tyre FLATTENS: wider and shorter, never taller. The
       extra translate puts the squashed bottom back on the road. */
    return G(out, { transform: "translate(0," + n2(r * squash * 0.1) + ") translate(" + n2(cx) + "," + n2(cy) +
      ") scale(" + n3(1 + squash * 0.1) + "," + n3(1 - squash * 0.1) + ") translate(" + n2(-cx) + "," + n2(-cy) + ")" });
  }
  function nmTyrePic(scene, t) {
    var c = function (b, n) { return sc(scene, b, n); };
    var cTy = c(3, "tyre"), cRub = c(3, "rubber"), cGrip = c(3, "grips"), cBend = c(3, "bends");
    var road = 318, bx = 700, br = 52, r = 86, out = "";
    out += R(60, road, 1048, 18, 9, "#3A4A58");
    out += Pth("M" + n2(bx - br) + "," + n2(road + 4) + " A" + n2(br) + "," + n2(br) + " 0 0 1 " +
      n2(bx + br) + "," + n2(road + 4) + " Z", "#3A4A58");
    out += L(60, road + 24, 1108, road + 24, P.line, 3);
    /* the tyre rolls up to the bump while it is named, and over it on "bends" */
    var x = 220;
    if (cTy != null) {
      var stop = cBend == null ? cTy + 2.4 : cBend;
      x = lerp(200, 580, ease(clamp((t - cTy) / Math.max(stop - cTy, 0.4), 0, 1)));
      if (cBend != null && t > cBend) x = lerp(580, 960, ease(clamp((t - cBend) / 1.6, 0, 1)));
    }
    var d = Math.abs(x - bx);
    var lift = d < br + r ? Math.max(0, Math.sqrt(Math.max(0, (br + r) * (br + r) - d * d)) - r) : 0;
    /* grip marks the tyre has left on the road behind it */
    var gr = on(t, cGrip, 0.5);
    if (gr > 0) for (var k = 0; k < 11; k++) {
      var gx = 190 + k * 62;
      if (gx > x - 24) continue;
      out += L(gx, road - 7, gx + 20, road - 7, P.gold, 6, { opacity: gr * 0.85 });
    }
    out += MK.pop(nmTyre(x, road - r - lift, r, clamp(lift / br, 0, 1), (x - 200) / r), x, road - r, popIn(t, cTy, 0.45));
    out += MK.pill(232, 396, "rubber", on(t, cRub, 0.45), { size: 34, col: P.gold });
    out += MK.pill(600, 396, "grips the road", on(t, cGrip, 0.45), { size: 30, col: P.gold });
    out += MK.pill(950, 396, "bends over bumps", on(t, cBend, 0.45), { size: 30, col: P.gold });
    return out;
  }

  /* beat 5: the three choices together, and the science that explains them */
  /* The middle card recaps the kettle's plastic HANDLE. It draws the kettle
     with the plum ring on its handle and the hand beside it, exactly as beat 3
     of this chapter did - the lesson's generic plastic emoji is a bottle, and
     a bottle shows nothing about a handle that stays cool to hold. */
  function nmHandleCard(cx, cy, size) {
    return MK.pic(cx, cy, size, NM_PIC.kettle) +
      C(cx + size * 0.3125, cy + size * 0.047, size * 0.16, "none", P.plum, 4) +
      MK.pic(cx + size * 0.47, cy + size * 0.075, size * 0.30, NM_PIC.hand);
  }
  var NM_WHY = [
    { pic: "kettle", mat: "metal", why: "does not melt" },
    { draw: nmHandleCard, mat: "plastic", why: "the handle stays cool" },
    { pic: "bike", mat: "rubber", why: "grips and bends" }
  ];
  function nmWhyPic(scene, t) {
    var c = function (b, n) { return sc(scene, b, n); };
    var cEv = c(4, "every"), cCh = c(4, "chosen"), cSci = c(4, "science"), out = "";
    var cxs = [200, 584, 968];
    for (var q = 0; q < 3; q++) {
      var at = nmAfter(cEv, q * 0.26), o = popIn(t, at, 0.45), cx = cxs[q];
      if (o <= 0) continue;
      var ring = on(t, nmAfter(cCh, q * 0.2), 0.4);
      out += G(R(cx - 180, 48, 360, 296, 22, P.cell, ring > 0.4 ? P.gold : P.line, ring > 0.4 ? 4 : 2) +
        (NM_WHY[q].draw ? NM_WHY[q].draw(cx, 144, 118) : MK.pic(cx, 144, 118, NM_PIC[NM_WHY[q].pic])) +
        Tx(cx, 318, NM_WHY[q].why, "lab mid muted readable", "middle"),
        { opacity: Math.min(1, o), transform: around(cx, 196, Math.min(1.06, o)) });
      out += MK.pill(cx, 262, NM_WHY[q].mat, Math.min(1, o), { size: 30, col: ring > 0.4 ? P.gold : P.line });
    }
    out += MK.pill(584, 400, "science explains why", on(t, cSci, 0.5), { size: 32, col: P.teal });
    return out;
  }

  var NM_JOB_KIND = ["choose", "kettle", "handle", "tyre", "why"];
  function nmJobPic(scene, t, k) {
    var kind = NM_JOB_KIND[k];
    if (kind === "kettle") return nmKettlePic(scene, t, false);
    if (kind === "handle") return nmKettlePic(scene, t, true);
    if (kind === "tyre") return nmTyrePic(scene, t);
    if (kind === "why") return nmWhyPic(scene, t);
    return nmChoosePic(scene, t);
  }
  function nmJobChapter(scene, beat, t, i) {
    var k = i - scene.first;
    var u = k === 0 ? 1 : into(t, scene.first + k);
    var out = "";
    if (u < 1) out += G(nmJobPic(scene, t, k - 1), { opacity: 1 - u });
    return svg(out + G(nmJobPic(scene, t, k), { opacity: u }));
  }

  /* ---- what you now know -------------------------------------------------------
     One card per idea of the recap, lit as it is said. The waterproof card
     carries its beat's second cue as well: the table the child filled in draws
     itself on "in a table", so every phrase of that line moves something. */
  function nmRecapScene() {
    for (var k = 0; k < F.scenes.length; k++) if (F.scenes[k].id === "recap") return F.scenes[k];
    return null;
  }
  function nmWaterCard(cx, cy, size, t) {
    var sn = nmRecapScene(), tab = sn ? on(t, sc(sn, 2, "table"), 0.6) : 0;
    var out = MK.pic(cx - size * 0.3, cy, size * 0.9, ART.ICONS.glass) +
      nmDrop(cx + size * 0.16, cy - size * 0.12, size * 0.11, 1);
    if (tab > 0) {
      var w = size * 0.6, h = size * 0.5, x = cx + size * 0.2, y = cy - h / 2;
      out += G(R(x, y, w, h, 6, P.card, P.gold, 2) +
        L(x, y + h / 3, x + w, y + h / 3, P.gold, 2) +
        L(x, y + 2 * h / 3, x + w, y + 2 * h / 3, P.gold, 2) +
        L(x + w * 0.58, y, x + w * 0.58, y + h, P.gold, 2), { opacity: tab });
    }
    return out;
  }
  /* the lesson's four tests, as one card: press, bend, light, water */
  function nmTestsCard(cx, cy, size) {
    var out = "", d = size * 0.3, r = size * 0.29;
    for (var k = 0; k < 4; k++) {
      var x = cx + (k % 2 ? d : -d), y = cy + (k > 1 ? d : -d);
      out += C(x, y, r, P.cell, P.line, 2) + nmTestIcon(k, x, y, r * 1.25);
    }
    return out;
  }
  var NM_RECAP = MK.recapKind([
    { beat: 0, at: "natural", title: "Natural", sub: "it grows, or is dug up", pic: NM_PIC.tree },
    { beat: 0, at: "made", title: "Manufactured", sub: "people make it", pic: NM_PIC.factory },
    { beat: 1, at: "property", title: "Property", sub: "what a material is like", pic: NM_PIC.lens },
    { beat: 1, at: "test", title: "Test it", sub: "each test finds one", pic: nmTestsCard },
    { beat: 2, at: "water", title: "Waterproof", sub: "water runs off glass", pic: nmWaterCard },
    { beat: 3, at: "chosen", title: "Chosen for the job", sub: "for its properties", pic: NM_PIC.kettle }
  ], { goBeat: 3, goAt: "hunt" });

  var KINDS = {
    title: MK.titleKind({ sub: ["Natural, or made by people", "Test a material for its properties", "Why each material was chosen"] }),
    natural: nmNaturalChapter, made: nmMadeChapter, testing: nmTestingChapter,
    waterproof: nmWaterChapter, job: nmJobChapter, recap: NM_RECAP
  };
