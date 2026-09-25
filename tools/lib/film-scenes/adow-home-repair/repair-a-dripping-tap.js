  /* ==== Professor Adow TVET — Repair a Dripping Tap ========================
     The pictures of the tap film, between the shared engine's head and tail
     (tools/lib/ehel-film-engine-head.js explains the assembly).

     ANIMATED FROM THE FIRST DRAFT, which the tiling film was not. The owner's
     standard: these learners are grades 8 to 12 and have often never done the
     job, so the MOVEMENT is the teaching. A tap is the clearest case of it in
     the whole school — everything that matters happens INSIDE a brass body
     that a learner has never seen opened, and a still picture of a tap shows
     a shiny object and hides the mechanism entirely. So the body is in
     section throughout and the stem actually screws down onto the seat.

     THE TWO LEAKS ARE NEVER DRAWN AT ONCE except in the scene whose whole
     job is to separate them. A drip at the SPOUT and a weep at the STEM are
     different faults with different parts, and a learner who conflates them
     strips a tap and renews a washer that was never at fault.

     UK / East African: tap, spout, gland nut, gland packing. The source
     document is American; the wording is not its wording. */

  /* ---- materials --------------------------------------------------------- */
  var BRASS = "#C9A227", BRASS_D = "#94761A";
  var CHROME = "#C6D2DA", CHROME_D = "#8B9BA6";
  var BODY = "#AEBDC6", BODY_D = "#7A8A95";
  var RUBBER = "#3E4A52", RUBBER_D = "#252E34";
  var WATER = "#4FA3D1", PACK = "#D8CBA8", PACK_D = "#A99A73";

  var HUE = {
    title: P.blue, types: P.gold, isolate: P.good, diagnose: P.accent,
    strip: P.plum, washer: P.teal, seat: P.gold, packing: P.blue,
    rebuild: P.good, recap: P.teal
  };

  /* ---- time -------------------------------------------------------------- */
  function beatU(t, i) {
    var b = BEATS[i], end = spokenEnd(i);
    return clamp((t - b.start) / Math.max(0.2, end - b.start), 0, 1);
  }
  /* a repeating 0..1 ramp, for anything that loops while a beat is spoken */
  function loop(t, at, period) {
    if (at == null || t < at) return 0;
    return ((t - at) % period) / period;
  }

  /* ---- the tap, in section ----------------------------------------------
     One drawing, driven by flags, so the film can strip it a part at a time
     without ever redrawing the body. cx is the centreline.               */
  var CX = 560, TOP = 78;
  /* How far the headwork travels when it is threaded out. tapBody multiplies
     this by 300, and the stem's own top sits at TOP + 16, so anything above
     0.313 lifts the stem off the top of the 1168 x 440 box — and the handle
     indicator, at TOP + 10, is tighter still at 0.293. 0.28 clears both. */
  var LIFT_MAX = 0.28;

  function tapBody(o) {
    o = o || {};
    var out = "";
    var bodyTop = TOP + 120;

    /* casting, in section: two walls with the bore between them */
    out += Pth("M" + (CX - 66) + "," + bodyTop + " h132 v150 h-32 v-66 h-68 v66 h-32 z",
      BODY, BODY_D, 2.5, {});
    /* the spout, out to the left */
    out += Pth("M" + (CX - 66) + "," + (bodyTop + 30) + " h-96 v34 h62 v56 h34 z", BODY, BODY_D, 2.5, {});
    /* the inlet below the seat */
    out += R(CX - 26, bodyTop + 150, 52, 44, 2, BODY, BODY_D, 2.5, {});

    /* water standing below the seat, always */
    if (o.water !== false) {
      out += R(CX - 21, bodyTop + 116, 42, 78, 0, WATER, "none", 0, { opacity: 0.85 });
    }
    /* water ABOVE the seat only when the tap is open or not sealing */
    if (o.through > 0) {
      out += R(CX - 21, bodyTop + 66, 42, 52, 0, WATER, "none", 0, { opacity: 0.8 * o.through });
      out += Pth("M" + (CX - 66) + "," + (bodyTop + 44) + " h-96 v20 h96 z", WATER, "none", 0,
        { opacity: 0.8 * o.through });
    }

    /* the seat: the brass ring the washer closes onto */
    out += R(CX - 28, bodyTop + 106, 20, 12, 0, BRASS, BRASS_D, 1.5, {});
    out += R(CX + 8, bodyTop + 106, 20, 12, 0, BRASS, BRASS_D, 1.5, {});
    if (o.seatCut) {
      out += Pth("M" + (CX - 8) + "," + (bodyTop + 106) + " q8,7 16,0", "none", P.bad, 3, {});
    }

    /* the stem: `close` 0 = fully open, 1 = washer on the seat.
       `lift` raises the whole headwork out of the body.               */
    var lift = o.lift || 0;
    if (o.stem !== false) {
      var close = o.close == null ? 0.5 : o.close;
      var washerY = bodyTop + 40 + close * 66 - lift * 300;
      var stemTop = TOP + 16 - lift * 300;
      out += R(CX - 13, stemTop, 26, washerY - stemTop, 2, CHROME, CHROME_D, 2, {});
      for (var k = 0; k < 6; k++) {
        var ty = stemTop + 44 + k * 13;
        if (ty < washerY - 8) out += L(CX - 13, ty, CX + 13, ty - 6, CHROME_D, 1.5, {});
      }
      if (o.washer !== false) {
        out += R(CX - 24, washerY, 48, 15, 2, o.washerWorn ? RUBBER_D : RUBBER, RUBBER_D, 2, {});
        if (o.washerWorn) out += L(CX - 15, washerY + 7, CX + 15, washerY + 7, P.bad, 2.5, {});
        out += C(CX, washerY + 7, 4, BRASS, BRASS_D, 1, {});
      }
      if (o.packing) {
        out += R(CX - 18, TOP + 30 - lift * 300, 36, 18, 1, PACK, PACK_D, 1.5, {});
      }
    }

    /* the gland nut */
    if (o.gland !== false) {
      out += R(CX - 36, TOP + 50 - (o.glandLift || 0) * 300, 72, 30, 3, CHROME, CHROME_D, 2.5, {});
    }
    /* handle and cap */
    if (o.handle !== false) {
      var hl = (o.handleLift || 0) * 300;
      out += Pth("M" + (CX - 50) + "," + (TOP + 6 - hl) + " h100 l-14,30 h-72 z", CHROME, CHROME_D, 2.5, {});
      if (o.cap !== false) {
        out += C(CX, TOP + 2 - (o.capLift || 0) * 300 - hl, 13, CHROME, CHROME_D, 2.5, {});
      } else {
        out += C(CX, TOP + 4 - hl, 5, BRASS_D, "none", 0, {});
      }
    }
    return out;
  }

  /* falling drops from the spout: p is a looping 0..1 */
  function drips(p, n, col) {
    var out = "", sx = CX - 132, sy = TOP + 240;
    for (var k = 0; k < (n || 3); k++) {
      var u = (p + k / (n || 3)) % 1;
      /* The fall is 100, not 150: the spout mouth sits at y 318 in a 440-high
         box, so a 150 px fall put every drop 28 px out the bottom — 67 frames
         of it, which --sweep counted and no still would have shown. */
      out += E(sx, sy + u * u * 100, 5 - u * 1.4, 7 - u, col || WATER, "none", 0,
        { opacity: 0.95 * (1 - u * 0.5) });
    }
    return out;
  }

  /* beads of water weeping at the stem */
  function weep(p, col) {
    var out = "", sx = CX + 34, sy = TOP + 64;
    for (var k = 0; k < 3; k++) {
      var u = (p + k / 3) % 1;
      out += C(sx + u * 18, sy + u * u * 90, 4 - u * 1.6, col || WATER, "none", 0,
        { opacity: 0.9 * (1 - u * 0.6) });
    }
    return out;
  }

  /* ---- tools ------------------------------------------------------------- */
  function screwdriver(cx, cy, ang, len) {
    return G(R(0, -11, (len || 130) * 0.5, 22, 5, "#7A4A22", "#5E3A1B", 2, {}) +
      R((len || 130) * 0.5, -5, (len || 130) * 0.42, 10, 1, CHROME, CHROME_D, 2, {}) +
      Pth("M" + n2((len || 130) * 0.92) + ",-6 L" + n2(len || 130) + ",-4 v8 L" + n2((len || 130) * 0.92) + ",6 z",
        CHROME, CHROME_D, 1.5, {}),
      { transform: "translate(" + n2(cx) + "," + n2(cy) + ") rotate(" + n3(ang) + ")" });
  }

  function spannerFig(cx, cy, ang, pad) {
    return G(Pth("M0,0 a19,19 0 1 0 21,25 l104,25 a11,11 0 0 0 6,-22 l-104,-25 a19,19 0 0 0 -27,-3 z",
      CHROME, CHROME_D, 2, {}) +
      (pad ? R(3, 5, 25, 25, 3, "#2B2B2B", "#111", 1.5, {}) : ""),
      { transform: "translate(" + n2(cx) + "," + n2(cy) + ") rotate(" + n3(ang) + ")" });
  }

  function dresserFig(cx, cy, spin) {
    return G(R(-10, 0, 20, 70, 3, CHROME, CHROME_D, 2, {}) +
      R(-32, 70, 64, 18, 2, BRASS, BRASS_D, 2, {}) +
      R(-24, -28, 48, 28, 5, "#7A4A22", "#5E3A1B", 2, {}),
      { transform: "translate(" + n2(cx) + "," + n2(cy) + ") rotate(" + n3(spin) + ")" });
  }

  function wrenchFig(cx, cy, spin) {
    return G(R(-8, 0, 16, 72, 2, CHROME, CHROME_D, 2, {}) +
      Pth("M-14,72 h28 l-5,20 h-18 z", CHROME, CHROME_D, 1.5, {}) +
      R(-38, -20, 76, 20, 3, "#7A4A22", "#5E3A1B", 2, {}),
      { transform: "translate(" + n2(cx) + "," + n2(cy) + ") rotate(" + n3(spin) + ")" });
  }

  function cap(x, y, s, p, col) {
    if (!(p > 0)) return "";
    return Tx(x, y, s, "lab big", "middle", { fill: col || P.ink, opacity: Math.min(1, p),
      transform: "translate(0," + n2((1 - Math.min(1, p)) * 9) + ")" });
  }
  function note(x, y, s, p, col) {
    if (!(p > 0)) return "";
    return Tx(x, y, s, "lab", "middle", { fill: col || P.muted, opacity: Math.min(1, p) });
  }

  /* ==== scenes ============================================================ */

  function sceneTitle(scene, beat, t) {
    var one = scene.first;
    var a = inAt(t, BEATS[one].start, 1.0);
    var d = on(t, cue(one, "drips"), 0.6);
    var hard = on(t, cue(one, "harder"), 0.9);
    /* the handle is screwed harder and harder, and it still drips */
    var out = tapBody({ close: 0.92 + hard * 0.06, through: 0.16 * (1 - hard * 0.4), washerWorn: hard > 0.3 });
    if (d > 0) out += drips(loop(t, cue(one, "drips"), 1.15), 3);
    if (hard > 0) {
      out += Pth("M" + (CX + 66) + "," + (TOP + 10) + " a54,54 0 0 1 26,40", "none", P.bad, 3.5,
        { opacity: hard, "marker-end": "" });
      out += note(CX + 150, TOP + 38, "tighter is not a repair", hard, P.bad);
    }
    out += cap(584, 424, "every drop is paid for", d, P.blue);
    return svg(G(out, { opacity: 0.35 + a * 0.65 }));
  }

  function titleMotif(o) {
    var t = (o && o.t) || 0;
    var drop = (t % 1.2) / 1.2;
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A tap with a drop falling from the spout">' +
      G(R(60, 40, 90, 120, 6, BODY, BODY_D, 3, {}) +
        Pth("M60,80 h-56 v26 h30 v44 h26 z", BODY, BODY_D, 3, {}) +
        Pth("M70,20 h70 l-10,22 h-50 z", CHROME, CHROME_D, 3, {}) +
        E(34, 160 + drop * 120, 9, 12, WATER, "none", 0, { opacity: 1 - drop * 0.6 }) +
        L(0, 300, 210, 300, P.blue, 3, { opacity: 0.5 + 0.3 * breathe(t) }),
        { transform: "translate(70,20)" }) +
      "</svg>";
  }

  /* Which kind: the compression handle screws DOWN through several turns,
     the washerless one snaps through a quarter turn. Both move. */
  function sceneTypes(scene, beat, t, i) {
    var b0 = scene.first, bW = b0 + 1;
    var out;
    if (i === b0) {
      var s = on(t, cue(b0, "screws"), 0.5);
      var turns = on(t, cue(b0, "several"), 2.2);
      out = tapBody({ close: 0.12 + turns * 0.8, through: 0.8 * (1 - turns), handle: true });
      /* the handle spins several times as the stem descends */
      if (s > 0) {
        out += G(Pth("M-46,0 h92", "none", P.gold, 4, {}),
          { transform: "translate(" + CX + "," + (TOP + 18) + ") rotate(" + n3(turns * 1080) + ")", opacity: 0.7 * s });
      }
      out += note(CX, 392, "several turns — rubber pressed onto brass", turns, P.muted);
      out += cap(584, 424, "a washer tap screws down", s, P.gold);
    } else {
      var q = on(t, cue(bW, "quarter"), 0.9);
      var k = on(t, cue(bW, "kit"), 0.8);
      /* a cartridge body: the lever swings a quarter turn and stops */
      out = R(CX - 62, TOP + 120, 124, 110, 8, BODY, BODY_D, 2.5, {});
      out += Pth("M" + (CX - 62) + "," + (TOP + 166) + " h-70 v28 h40 v46 h30 z", BODY, BODY_D, 2.5, {});
      out += C(CX, TOP + 172, 34, CHROME, CHROME_D, 2.5, {});
      out += C(CX, TOP + 172, 14, RUBBER, RUBBER_D, 2, {});
      out += G(R(-6, -76, 12, 76, 4, CHROME_D, "none", 0, {}) + R(-44, -90, 88, 16, 6, CHROME, CHROME_D, 2, {}),
        { transform: "translate(" + CX + "," + (TOP + 172) + ") rotate(" + n3(-ease(Math.min(1, q)) * 90) + ")" });
      if (k > 0) {
        out += R(CX + 150, TOP + 150, 130, 86, 8, P.cell, P.gold, 2, { opacity: k });
        out += Tx(CX + 215, TOP + 186, "repair kit", "lab", "middle", { fill: P.gold, opacity: k });
        out += Tx(CX + 215, TOP + 212, "not a washer", "lab", "middle", { fill: P.muted, opacity: k });
      }
      out += cap(584, 424, "a quarter turn — no washer inside", q, P.gold);
    }
    return svg(out);
  }

  /* Isolating: the valve turns, the water drains out of the body, the tap
     runs dry. The proof is a thing you watch happen. */
  function sceneIsolate(scene, beat, t, i) {
    var b0 = scene.first, bD = b0 + 1;
    var out;
    if (i === b0) {
      var v = on(t, cue(b0, "valve"), 1.2);
      var h = on(t, cue(b0, "heater"), 0.8);
      out = L(180, 330, 940, 330, CHROME_D, 16, {});
      out += C(430, 330, 30, BODY, BODY_D, 2.5, {});
      out += G(R(-6, -50, 12, 50, 3, CHROME_D, "none", 0, {}) + R(-30, -62, 60, 14, 5, "#C9433A", "#8E2E28", 2, {}),
        { transform: "translate(430,330) rotate(" + n3(v * 90) + ")" });
      out += note(430, 396, "service valve", 1, P.good);
      out += C(770, 330, 24, BODY, BODY_D, 2.5, { opacity: 0.55 });
      out += note(770, 396, "or the main stop tap", 1, P.muted);
      if (h > 0) {
        out += R(880, 170, 90, 120, 10, P.cell, P.accent, 2, { opacity: h });
        out += Tx(925, 238, "hot", "lab big", "middle", { fill: P.accent, opacity: h });
      }
      /* the water in the pipe drains away as the valve closes */
      out += R(180, 323, (940 - 180) * (1 - v), 14, 0, WATER, "none", 0, { opacity: 0.85 });
      out += cap(584, 424, "shut it, and shut the hot as well", Math.max(v, h), P.good);
    } else {
      var d = on(t, cue(bD, "dry"), 1.6);
      out = tapBody({ close: 0.05, through: 1 - d, water: d < 0.8 });
      if (d < 0.75) out += drips(loop(t, BEATS[bD].start, 0.5), 4);
      out += note(CX, 392, d > 0.8 ? "nothing. that is the proof." : "still running…",
        on(t, cue(bD, "proof"), 0.7), d > 0.8 ? P.good : P.muted);
      out += cap(584, 424, "open it and let it run dry", d, P.good);
    }
    return svg(out);
  }

  /* The two leaks, side by side, each appearing with its own phrase. */
  function sceneDiagnose(scene, beat, t, i) {
    var b0 = scene.first, bH = b0 + 1;
    var out;
    if (i === b0) {
      var s = on(t, cue(b0, "spout"), 0.7);
      out = tapBody({ close: 1, through: 0.3, washerWorn: true, seatCut: true });
      if (s > 0) {
        out += drips(loop(t, cue(b0, "spout"), 1.0), 3);
        out += R(CX - 34, TOP + 268, 68, 60, 6, "none", P.accent, 3, { opacity: 0.8 * s });
        out += note(CX + 128, TOP + 300, "washer, or seat", s, P.accent);
      }
      out += cap(584, 424, "from the SPOUT: it is not closing", s, P.accent);
    } else {
      var h = on(t, cue(bH, "handle"), 0.7);
      var w = on(t, cue(bH, "wrong"), 0.8);
      out = tapBody({ close: 0.6, packing: true });
      if (h > 0) {
        out += weep(loop(t, cue(bH, "handle"), 1.1));
        out += R(CX - 40, TOP + 26, 80, 60, 6, "none", P.accent, 3, { opacity: 0.8 * h });
        out += note(CX + 150, TOP + 56, "gland packing, or O-ring", h, P.accent);
      }
      if (w > 0) out += note(584, 392, "the wrong diagnosis renews a good washer", w, P.bad);
      out += cap(584, 424, "around the HANDLE: a weep at the stem", h, P.accent);
    }
    return svg(out);
  }

  /* Stripping: the cap lifts, the screw backs out turning, the handle comes
     off, then the gland nut and the whole stem thread out. */
  function sceneStrip(scene, beat, t, i) {
    var b0 = scene.first, bG = b0 + 1;
    var out;
    if (i === b0) {
      var c = on(t, cue(b0, "cap"), 0.9);
      var sc = on(t, cue(b0, "screw"), 1.3);
      var lf = on(t, cue(b0, "lifts"), 1.1);
      out = tapBody({ close: 0.5, cap: c < 0.5, capLift: c * 0.09, handleLift: lf * 0.10, through: 0 });
      if (sc > 0 && lf < 0.4) {
        /* A screwdriver spins about its OWN axis, which in a side view does
           not move it at all. Rotating the whole tool about a far origin, as
           this first did, swung it like an arm and threw it 30 px off the top
           of the box. The tool is fixed with its tip in the screw; the TURN is
           shown by the arc, and the screw itself backs out and rises. */
        out += screwdriver(CX + 6, 8, 90, 74);
        out += Pth("M" + (CX + 54) + ",34 a30,30 0 0 1 8,26", "none", P.plum, 3.5,
          { opacity: 0.85 * sc });
        out += C(CX + 6, 86 - sc * 46, 5.5, BRASS, BRASS_D, 1.5, { opacity: sc });
      }
      out += cap(584, 424, "cap, then the one screw under it", Math.max(c, sc), P.plum);
    } else {
      var g = on(t, cue(bG, "gland"), 1.0);
      var op = on(t, cue(bG, "open"), 1.8);
      var pd = on(t, cue(bG, "pad"), 0.8);
      out = tapBody({ handle: false, close: 0.5 - op * 0.5, glandLift: g * 0.10, lift: op * LIFT_MAX, through: 0 });
      if (g > 0 && op < 0.5) out += spannerFig(CX + 74, TOP + 44, -14 + g * 26, pd > 0.3);
      if (op > 0) {
        /* tapBody lifts by `lift * 300`, so a lift of 0.34 raises the stem by
           102 px. This indicator used op * 300 and climbed 300, which put it
           213 px above the box at the end of the beat. Same lift, same units. */
        out += G(Pth("M-40,0 h80", "none", P.plum, 4, {}),
          /* This line is 80 long and SPINS, so its ends reach 40 px either side
             of its centre. Following the stem all the way up put the centre at
             y 4 and swung the ends to -36. The centre is held at 44 or lower,
             which is the least height a spinning 80-px line can have. */
          { transform: "translate(" + CX + "," + n2(Math.max(44, TOP + 10 - op * LIFT_MAX * 300)) + ") rotate(" + n3(op * 900) + ")", opacity: 0.7 });
      }
      if (pd > 0 && op < 0.5) out += note(CX + 210, TOP + 112, "tape on the jaws", pd, P.gold);
      out += cap(584, 424, "thread the stem out in the OPEN direction", op, P.plum);
    }
    return svg(out);
  }

  /* The washer: the screw comes out turning, the worn washer drops away,
     the new one is offered up and matched. */
  function sceneWasher(scene, beat, t, i) {
    var b0 = scene.first, bM = b0 + 1;
    var sx = CX - 40, sy = 150;
    var out;
    if (i === b0) {
      var gr = on(t, cue(b0, "groove"), 0.8);
      var un = on(t, cue(b0, "undo"), 1.5);
      /* the stem laid on the bench, washer end up */
      out = R(sx - 16, sy, 32, 190, 3, CHROME, CHROME_D, 2.5, {});
      out += R(sx - 34, sy + 190 + un * 60, 68, 20, 2, RUBBER_D, RUBBER_D, 2.5,
        { opacity: 1 - un * 0.25 });
      if (gr > 0) out += L(sx - 22, sy + 200 + un * 60, sx + 22, sy + 200 + un * 60, P.bad, 3, { opacity: gr });
      /* the screw drops away, but only as far as the box allows: sy + 200 is
         350, so a 150 fall put it 60 px below the bottom edge */
      out += C(sx, sy + 200 + un * 70, 6, BRASS, BRASS_D, 1.5, { opacity: 1 - un * 0.4 });
      /* likewise: tip in the screw, handle below, and it does not swing */
      if (un > 0 && un < 0.9) out += screwdriver(sx, sy + 278, -90, 74);
      if (gr > 0) out += note(sx, sy + 258, "a groove pressed into it", gr, P.bad);
      out += cap(584, 424, "hard, or grooved — that is your drip", gr, P.teal);
    } else {
      var m = on(t, cue(bM, "match"), 1.0);
      var br = on(t, cue(bM, "brass"), 0.8);
      out = R(sx - 34, 200, 68, 20, 2, RUBBER_D, RUBBER_D, 2.5, {});
      out += L(sx - 22, 210, sx + 22, 210, P.bad, 3, {});
      out += note(sx - 40, 254, "the old one", 1, P.muted);
      /* the new washer slides across to sit beside the old one. 170 apart put
         "matched for size and style" hard against "the old one"; 250 does not. */
      out += R(lerp(sx + 360, sx + 210, ease(m)) - 34, 200, 68, 20, 2, RUBBER, RUBBER_D, 2.5, { opacity: m });
      out += note(sx + 210, 254, "matched for size and style", m, P.good);
      if (br > 0) {
        out += C(sx + 210, 300, 8, BRASS, BRASS_D, 2, { opacity: br });
        out += note(sx + 210, 336, "brass, not steel", br, P.gold);
      }
      out += cap(584, 424, "take the old one with you", m, P.teal);
    }
    return svg(out);
  }

  /* The seat: it eats washers; then the torch test, and either the wrench
     turning it out or the dresser grinding it smooth. */
  function sceneSeat(scene, beat, t, i) {
    var b0 = scene.first, bT = b0 + 1;
    var out;
    if (i === b0) {
      var e = on(t, cue(b0, "eats"), 1.6);
      var c = on(t, cue(b0, "cut"), 0.8);
      out = tapBody({ handle: false, gland: false, stem: false, seatCut: c > 0.3, water: true });
      /* a row of chewed washers, arriving one after another */
      for (var k = 0; k < 4; k++) {
        var f = clamp(e * 4 - k, 0, 1);
        if (f <= 0) continue;
        /* clear of the tap: its casting spans x 494 to 626, and the old row
           ended at 500, so the last washer sat on the body. */
        out += R(150 + k * 70, 300, 52, 17, 2, RUBBER_D, RUBBER_D, 2, { opacity: f });
        out += L(158 + k * 70, 308, 194 + k * 70, 308, P.bad, 2.5, { opacity: f });
      }
      out += note(255, 352, "one after another", e, P.bad);
      out += cap(584, 424, "the seat is cutting each new washer", c, P.gold);
    } else {
      var to = on(t, cue(bT, "torch"), 0.8);
      var sq = on(t, cue(bT, "square"), 1.0);
      var dr = on(t, cue(bT, "dress"), 1.2);
      /* two seats, side by side: the test a learner actually performs */
      out = C(400, 230, 62, BRASS, BRASS_D, 2.5, { opacity: 0.35 + 0.65 * to });
      out += R(376, 206, 48, 48, 2, P.ground, BRASS_D, 2.5, { opacity: sq });
      out += note(400, 328, "square or hex — it unscrews", sq, P.good);
      if (sq > 0.5) out += wrenchFig(400, 96, -sq * 300);
      out += C(770, 230, 62, BRASS, BRASS_D, 2.5, { opacity: 0.35 + 0.65 * to });
      out += C(770, 230, 23, P.ground, BRASS_D, 2.5, { opacity: to });
      out += note(770, 328, "plain round — dress it in place", dr, P.gold);
      if (dr > 0) out += dresserFig(770, 100, dr * 540);
      out += cap(584, 424, "the torch tells you which job it is", to, P.gold);
    }
    return svg(out);
  }

  /* Packing: the turn is WOUND on, in the direction the nut tightens. */
  function scenePacking(scene, beat, t, i) {
    var b0 = scene.first;
    var w = on(t, cue(b0, "wrap"), 1.8);
    var d = on(t, cue(b0, "direction"), 1.0);
    var out = R(CX - 20, 120, 40, 230, 3, CHROME, CHROME_D, 2.5, {});
    /* the packing winds round the stem, one turn */
    var turns = 3;
    for (var k = 0; k < turns; k++) {
      var f = clamp(w * turns - k, 0, 1);
      if (f <= 0) continue;
      out += E(CX, 206 + k * 17, 46 * f, 10 * f, PACK, PACK_D, 2, {});
    }
    if (d > 0) {
      out += Pth("M" + (CX + 78) + ",188 a58,58 0 0 1 10,52", "none", P.blue, 4, { opacity: d });
      out += note(CX + 236, 228, "the way the nut tightens", d, P.blue);
    }
    /* the nut comes down onto it */
    out += R(CX - 44, 122 - (1 - w) * 90, 88, 34, 3, CHROME, CHROME_D, 2.5, { opacity: 0.4 + 0.6 * w });
    out += cap(584, 424, "one turn, wound the right way", w, P.blue);
    return svg(out);
  }

  /* Rebuild: the headwork travels back down, greased, and the nut is taken
     hand tight and then exactly half a turn further. */
  function sceneRebuild(scene, beat, t, i) {
    var b0 = scene.first, bH = b0 + 1;
    var out;
    if (i === b0) {
      var rv = on(t, cue(b0, "reverse"), 2.0);
      var gr = on(t, cue(b0, "grease"), 0.9);
      out = tapBody({ lift: (1 - rv) * LIFT_MAX, handleLift: (1 - rv) * 0.10,
        glandLift: (1 - rv) * 0.10, close: 0.5, packing: true, through: 0 });
      if (gr > 0) {
        for (var k = 0; k < 4; k++) {
          out += E(CX + 44, 150 + k * 22, 9, 5, P.gold, "none", 0, { opacity: 0.55 * gr });
        }
        out += note(CX + 166, 196, "grease the threads", gr, P.gold);
      }
      out += cap(584, 424, "the reverse of taking it apart", rv, P.good);
    } else {
      var hf = on(t, cue(bH, "half"), 1.4);
      var sl = on(t, cue(bH, "slowly"), 1.2);
      out = tapBody({ close: 0.6, packing: true, through: sl * 0.5 });
      /* hand tight, then exactly half a turn: 180 degrees and it stops */
      out += G(Pth("M-52,0 h104", "none", P.good, 5, {}),
        { transform: "translate(" + CX + "," + (TOP + 65) + ") rotate(" + n3(hf * 180) + ")", opacity: 0.85 });
      out += note(CX + 200, TOP + 62, hf > 0.9 ? "half a turn. stop." : "hand tight…", hf, hf > 0.9 ? P.good : P.muted);
      if (sl > 0) {
        out += drips(loop(t, cue(bH, "slowly"), 1.4), 1, P.cell);
        out += note(584, 392, "watch the spout AND the handle", sl, P.muted);
      }
      out += cap(584, 424, "not as hard as it will go", hf, P.good);
    }
    return svg(out);
  }

  function sceneRecap(scene, beat, t, i) {
    var b0 = scene.first;
    var rows = [
      ["identify", "washer tap, or washerless", P.gold, "identify"],
      ["isolate", "shut it, then prove it runs dry", P.good, "isolate"],
      ["read it", "spout = washer or seat · handle = packing", P.accent, "read"],
      ["rebuild", "reverse, greased, hand tight + half a turn", P.teal, "reverse"]
    ];
    var out = "";
    for (var k = 0; k < rows.length; k++) {
      var p = on(t, cue(b0, rows[k][3]), 0.5);
      if (!(p > 0)) continue;
      var yy = 130 + k * 66;
      out += G(R(230, yy, 710, 50, 10, P.cell, rows[k][2], 2, { opacity: 0.9 * p }) +
        Tx(254, yy + 31, rows[k][0], "lab", "start", { fill: rows[k][2], opacity: p }) +
        Tx(916, yy + 31, rows[k][1], "lab", "end", { fill: P.ink, opacity: p }),
        { transform: "translate(" + n2((1 - Math.min(1, p)) * -60) + ",0)" });
    }
    return svg(out);
  }

  var KINDS = {
    title: sceneTitle, types: sceneTypes, isolate: sceneIsolate,
    diagnose: sceneDiagnose, strip: sceneStrip, washer: sceneWasher,
    seat: sceneSeat, packing: scenePacking, rebuild: sceneRebuild,
    recap: sceneRecap
  };
