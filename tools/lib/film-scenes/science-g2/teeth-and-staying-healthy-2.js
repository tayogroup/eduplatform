  /* ==== chapters: brushing, and sugar and teeth ================================
     tools/lib/film-scenes/science-g2/teeth-and-staying-healthy-2.js.

     Brushing is the lesson's own "Good brushing" demo, frame by frame: the
     kit's toothbrush, a pea of paste, small gentle circles on the front teeth,
     then the sides, then the tops of the molars, and two whole minutes - over
     the same mouth the child taps in the step before, so the three places are
     the same three kinds of teeth.

     Sugar and teeth is the lesson's germ word card and its fact card made into
     one picture: germs too small to see, sugar feeding them, a hole in a tooth,
     and the sweets, fizzy drinks, water and fruit its sort asks about. */

  /* ---- the mouth again, smaller, with the brush working over it ------------- */
  var TH_B = { x: 34, y: 62, w: 440, h: 330, k: 1.375 };
  function thBX(v) { return TH_B.x + v * TH_B.k; }
  function thBY(v) { return TH_B.y + v * TH_B.k; }
  /* the three places the lesson brushes, in the order it brushes them */
  var TH_SPOTS = {
    front: [thBX(161), thBY(72)], sides: [thBX(207), thBY(77)], tops: [thBX(249), thBY(89)]
  };
  /* The lesson's "sides" are the side surfaces of the teeth, not a kind of
     tooth - its own frame says "Then the sides of the teeth, inside and
     outside" - so that cue rings nothing and the brush travels along the row
     instead. Only the two cues that DO name a kind have one here. */
  var TH_SPOT_PART = { front: "incisors", tops: "molars" };

  /* a toothpaste tube standing nozzle-down over the brush, its body squeezed
     by `press` (0 to 1). Its tip is at (cx, top + 168). */
  function thTube(cx, top, o, press) {
    if (!(o > 0)) return "";
    /* Narrow and tall, so it reads as a TUBE of toothpaste: at 110 wide it was
       a squat box on the sheet. */
    var w = 72, h = 130, sq = 1 - 0.13 * clamp(press, 0, 1);
    var body = R(cx - w / 2, top, w, h, 14, "#E7F1F7", "#93AABE", 3) +
      R(cx - w / 2 + 10, top + 34, w - 20, 24, 10, P.teal, null, null, { opacity: 0.85 }) +
      R(cx - w / 2 + 10, top + 13, w - 20, 11, 5, "#C6D7E2") +
      Pth("M" + n2(cx - w / 2) + "," + n2(top + h) + " L" + n2(cx - 17) + "," + n2(top + h + 24) +
        " L" + n2(cx + 17) + "," + n2(top + h + 24) + " L" + n2(cx + w / 2) + "," + n2(top + h) + " Z",
        "#E7F1F7", "#93AABE", 3);
    return G(G(body, { transform: around(cx, top + h + 24, sq) }) +
      R(cx - 13, top + h + 22, 26, 16, 4, "#93AABE"),
      { opacity: clamp(o, 0, 1) });
  }

  function thBrushChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cBrush = c(0, "brush"), cTool = c(0, "tool"), cWorks = c(0, "works"), cRight = c(0, "right");
    var cTwice = c(1, "twice"), cMorn = c(1, "morning"), cBed = c(1, "bed");
    var cSqueeze = c(2, "squeeze"), cPea = c(2, "pea"), cOnto = c(2, "onto");
    var cCircles = c(3, "circles"), cFront = c(3, "front"), cSides = c(3, "sides");
    var cTops = c(4, "tops"), cKeep = c(4, "keep"), cTwo = c(4, "two");
    var out = "", n;

    /* ---- the mouth, with the place being brushed ringed ---- */
    var here = cTops != null && t >= cTops ? "tops" : cSides != null && t >= cSides ? "sides"
      : cFront != null && t >= cFront ? "front" : null;
    var fig = ART.figure("mouth"), from = { front: cFront, sides: cSides, tops: cTops };
    var part = here ? TH_SPOT_PART[here] : null;
    if (part) {
      fig = ART.ring(fig, part, "rgba(244,201,93," + n2(on(t, from[here], 0.35)) + ")", 6);
      ["front", "tops"].forEach(function (k) {
        if (TH_SPOT_PART[k] !== part) fig = ART.dim(fig, TH_SPOT_PART[k], 0.62);
      });
    }
    fig = ART.dim(fig, "tongue", 0.4);
    out += ART.place(fig, TH_B.x, TH_B.y, TH_B.w, TH_B.h);

    /* ---- the brush itself ----
       Beats 0 to 2 it is on the right, being looked at and loaded with paste;
       from "the front teeth" it is on the mouth, circling gently, and it stays
       over the place being brushed until the chapter ends. */
    var moved = here ? TH_SPOTS[here] : null;
    if (moved) {
      /* small gentle circles: 1.5 turns a second, 17 px across, so the motion
         reads at the sampled frames as well as in the film */
      var a = (t - from[here]) * Math.PI * 3;
      /* on "the sides" the brush works its way ALONG the row, because the
         sides are every tooth's side surfaces and not one place */
      var along = here === "sides" ? lerp(-56, 56, clamp((t - from.sides) / 1.5, 0, 1)) : 0;
      var bx = moved[0] - 46 + along + Math.cos(a) * 17, by = moved[1] + 48 + Math.sin(a) * 17;
      out += thBrush(bx, by, 150, 0, thFrom(t, scene, 3));
      out += MK.ripple(moved[0], moved[1], t, from[here], P.gold);
    }

    /* ---- beat 0: a toothbrush is a tool ---- */
    var b0 = thOnly(t, scene, 0);
    if (b0 > 0.01) {
      var wob = cWorks != null && t >= cWorks && (cRight == null || t < cRight) ? 13 * Math.sin((t - cWorks) * 9) : 0;
      var settle = cRight != null && t >= cRight ? 5 * Math.sin((t - cRight) * 3.4) : 0;
      out += G(thBrush(828, 196, 250, wob + settle, Math.min(1, popIn(t, cBrush, 0.45))), { opacity: b0 });
      out += G(MK.pill(700, 368, "a tool", on(t, cTool, 0.4), { size: 30, col: P.blue }) +
        MK.tick(822, 368, 24, popIn(t, cRight, 0.4)) +
        MK.pill(982, 368, "the right way", on(t, cRight, 0.4), { size: 30, col: P.gold }), { opacity: b0 });
    }

    /* ---- beat 1: twice a day ---- */
    var b1 = thOnly(t, scene, 1);
    if (b1 > 0.01) {
      var when = [{ x: 560, pic: "☀️", cap: "morning", at: cMorn }, { x: 862, pic: "\u{1F6CF}️", cap: "before bed", at: cBed }];
      var panel = "";
      for (n = 0; n < 2; n++) {
        var o1 = Math.min(1, popIn(t, cTwice == null ? null : cTwice + n * 0.2, 0.4));
        if (o1 <= 0) continue;
        var w = when[n], lit = on(t, w.at, 0.4);
        panel += G(R(w.x, 118, 278, 196, 22, lit > 0.5 ? "#1B3A52" : P.card, lit > 0.5 ? P.blue : P.line, lit > 0.5 ? 3 : 2) +
          MK.pop(MK.pic(w.x + 139, 196, 86, w.pic), w.x + 139, 196, Math.min(1.06, popIn(t, w.at, 0.45))) +
          Tx(w.x + 139, 282, w.cap, "lab big", "middle", { opacity: lit }), { opacity: o1 });
        panel += MK.tick(w.x + 244, 148, 21, popIn(t, w.at == null ? null : w.at + 0.35, 0.35));
      }
      panel += MK.pill(846, 368, "twice a day", on(t, cTwice, 0.4), { size: 30, col: P.blue });
      out += G(panel, { opacity: b1 });
    }

    /* ---- beat 2: a pea of paste on the brush ---- */
    var b2 = thOnly(t, scene, 2);
    if (b2 > 0.01) {
      var pan = thBrush(900, 306, 208, 0, Math.min(1, popIn(t, cSqueeze, 0.4)));
      var press = cSqueeze == null ? 0 : Math.max(0, Math.sin((t - cSqueeze) * 4.4));
      pan += thTube(932, 40, on(t, cSqueeze, 0.4), press);
      /* the pea grows at the nozzle, then drops onto the bristles */
      var grow = on(t, cPea, 0.5), fall = on(t, cOnto, 0.55);
      if (grow > 0) {
        var py = lerp(208, 256, fall), pr = 15 * grow;
        pan += C(932, py, pr, "#EAF7FF", P.teal, 2.5);
      }
      pan += MK.pill(600, 372, "a pea of paste", on(t, cPea, 0.4), { size: 30, anchor: "start", col: P.gold });
      out += G(pan, { opacity: b2 });
    }

    /* ---- beats 3 and 4: where to brush, and for how long ---- */
    var b34 = thFrom(t, scene, 3);
    if (b34 > 0.01) {
      var rows = [
        { text: "the front teeth", at: cFront, mark: "tick", markAt: cFront == null ? null : cFront + 0.8 },
        { text: "the sides", at: cSides, mark: "tick", markAt: cSides == null ? null : cSides + 0.8 },
        { text: "the tops of the molars", at: cTops, mark: "tick", markAt: cTops == null ? null : cTops + 0.9 }
      ];
      var pan2 = MK.pill(548, 72, "small, gentle circles", on(t, cCircles, 0.4), { size: 29, anchor: "start", col: P.gold });
      pan2 += MK.list(548, 158, rows, t, { lh: 62, cls: "lab big" });
      /* two whole minutes: a ring that fills once round */
      var ko = on(t, cKeep, 0.45);
      if (ko > 0) {
        var cxT = 1010, cyT = 236, rT = 62;
        /* Held just short of 1: at exactly 1 the arc's end point IS its start
           point, SVG draws nothing, and the ring went blank at the moment it
           should read full. */
        var fillU = Math.min(on(t, cTwo, 1.0), 0.999);   /* round in one second, so it is FULL before the line ends */
        pan2 += C(cxT, cyT, rT, P.cell, P.line, 8, { opacity: ko });
        if (fillU > 0) {
          var ang = -Math.PI / 2 + fillU * Math.PI * 2, big = fillU > 0.5 ? 1 : 0;
          pan2 += Pth("M" + n2(cxT) + "," + n2(cyT - rT) + " A" + n2(rT) + "," + n2(rT) + " 0 " + big + " 1 " +
            n2(cxT + Math.cos(ang) * rT) + "," + n2(cyT + Math.sin(ang) * rT), null, P.gold, 8);
        }
        pan2 += Tx(cxT, cyT + 12, "2", "lab huge", "middle", { fill: P.gold, opacity: on(t, cTwo, 0.4) });
        pan2 += Tx(cxT, cyT + 104, "minutes", "lab big", "middle", { opacity: on(t, cTwo, 0.4) });
      }
      out += G(pan2, { opacity: b34 });
    }
    return svg(out);
  }

  /* ==== chapter: sugar and teeth ==============================================
     One tooth of the film's own, big, and the lesson's germs on it: germs too
     small to see (a magnifier shows them), sugar feeding them, a hole opening,
     and then the four things the lesson's sort asks about - sweets and fizzy
     drinks crossed, water and fruit ticked. */
  var TH_T = { x: 300, y: 222, s: 120 };
  function thTX(v) { return TH_T.x + v * TH_T.s / 50; }
  function thTY(v) { return TH_T.y + v * TH_T.s / 50; }
  /* where the germs sit on the crown, in the tooth's own local units */
  var TH_BUGS = [[-30, -20], [10, -34], [34, -10], [-14, -2], [22, -26], [-38, -40], [2, -8], [40, -34], [-22, -32]];

  function thSugarChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cGerms = c(0, "germs"), cLiving = c(0, "living"), cSee = c(0, "see");
    var cSugar = c(1, "sugar"), cFed = c(1, "germs"), cHoles = c(1, "holes");
    var cSweets = c(2, "sweets"), cFizzy = c(2, "fizzy"), cEvery = c(2, "every"), cCause = c(2, "cause");
    var cWater = c(3, "water"), cFruit = c(3, "fruit"), cKinder = c(3, "kinder");
    var cTreat = c(4, "treat"), cFine = c(4, "fine"), cDaily = c(4, "every"), cNot = c(4, "not");
    var out = "", n;

    /* the tooth, and the hole the germs make in it */
    var hole = clamp(0.48 * on(t, cHoles, 0.9) + 0.37 * on(t, cCause, 0.9), 0, 1);
    /* The germs leave on "kinder", and the hole STAYS: nothing in the lesson
       says a hole mends, so nothing here closes one. */
    var gone = on(t, cKinder, 0.6);
    out += thTooth(TH_T.x, TH_T.y, TH_T.s, 1, hole, 0);

    /* the germs: three on "Germs", the rest on "tiny living things", more again
       when the sugar feeds them, and all of them gone on "kinder" */
    var got = tally(t, cGerms, 3, 0.5) + tally(t, cLiving, 2, 0.4) + tally(t, cFed, 4, 0.9);
    for (n = 0; n < TH_BUGS.length; n++) {
      if (n >= got) break;
      var born = n < 3 ? cGerms + n * 0.25 : n < 5 ? cLiving + (n - 3) * 0.4 : cFed + (n - 5) * 0.3;
      out += thGerm(thTX(TH_BUGS[n][0]), thTY(TH_BUGS[n][1]), 11, Math.min(1, popIn(t, born, 0.35)) * (1 - gone), t, n);
    }

    /* ---- beat 0: too small to see ---- */
    var b0 = thOnly(t, scene, 0);
    if (b0 > 0.01) {
      var mo = on(t, cSee, 0.5), gx = 760, gy = 200, gr = 104, pan = "";
      pan += MK.pill(742, 66, "tiny living things", on(t, cLiving, 0.4), { size: 29, col: P.plum });
      if (mo > 0) {
        /* A zoom WINDOW, and never a magnifying glass: the lesson says a
           child cannot see germs at all ("You cannot see germs at all. A hand
           that looks spotless can still be covered in them."), so an
           instrument a child could pick up would teach the opposite of the
           line being said. Two lines carry the eye from the germs on the
           tooth to the same germs drawn big. */
        pan += L(thTX(42), thTY(-40), gx - gr, gy - 50, P.line, 4, { opacity: 0.45 * mo });
        pan += L(thTX(42), thTY(-6), gx - gr, gy + 50, P.line, 4, { opacity: 0.45 * mo });
        pan += C(gx, gy, gr, "#0C2233", null, null, { opacity: 0.96 });
        pan += thGerm(gx - 38, gy - 30, 27, mo, t, 1) + thGerm(gx + 34, gy - 6, 30, mo, t, 4) + thGerm(gx - 6, gy + 46, 24, mo, t, 7);
        pan += C(gx, gy, gr, "none", P.plastic, 9);
        pan += MK.pill(760, 356, "too small to see", mo, { size: 29, col: P.line });
      }
      out += G(pan, { opacity: b0 });
    }

    /* ---- beat 1: sugar feeds them, and they make holes ---- */
    var b1 = thOnly(t, scene, 1);
    if (b1 > 0.01) {
      var pan1 = "";
      /* grains of sugar falling onto the tooth */
      for (n = 0; n < 7; n++) {
        var bornS = cSugar == null ? null : cSugar + n * 0.13;
        if (bornS == null || t < bornS) continue;
        var u = clamp((t - bornS) / 1.05, 0, 1);
        var sx = thTX(-40 + TH_SCATTER[n] * 80), sy = lerp(20, thTY(-44), u * u);
        pan1 += G(R(sx - 11, sy - 11, 22, 22, 5, "#F2EFE4", "#C9C2AE", 2.5),
          { transform: "rotate(" + n2(TH_SCATTER[n] * 60 - 30) + " " + n2(sx) + " " + n2(sy) + ")",
            opacity: Math.min(1, (1 - u) * 5, u * 8) });
      }
      pan1 += MK.pop(MK.pic(900, 146, 130, "\u{1F36C}"), 900, 146, Math.min(1.06, popIn(t, cSugar, 0.45)));
      pan1 += MK.pill(900, 246, "sugar", on(t, cSugar, 0.4), { size: 30, col: P.accent });
      /* the hole, named where it opens */
      var ho = on(t, cHoles, 0.5);
      if (ho > 0) pan1 += MK.leader(770, 340, thTX(-2) + 26, thTY(-26), on(t, cHoles, 0.7), P.bad) +
        MK.pill(776, 340, "a hole", ho, { size: 30, anchor: "start", col: P.bad, ink: P.ink });
      out += G(pan1, { opacity: b1 });
    }

    /* ---- beat 2: sweets and fizzy drinks every day ---- */
    var b2 = thOnly(t, scene, 2);
    if (b2 > 0.01) {
      var bad = [{ x: 664, pic: "\u{1F36C}", cap: "sweets", at: cSweets }, { x: 924, pic: "\u{1F964}", cap: "fizzy drinks", at: cFizzy }];
      var pan2 = "";
      for (n = 0; n < 2; n++) {
        var bb = bad[n], ob = Math.min(1, popIn(t, bb.at, 0.45));
        if (ob <= 0) continue;
        pan2 += G(R(bb.x, 92, 216, 200, 22, P.card, P.bad, 3) + MK.pic(bb.x + 108, 168, 90, bb.pic) +
          Tx(bb.x + 108, 262, bb.cap, "lab big", "middle"), { opacity: Math.min(1, ob) });
        pan2 += MK.cross(bb.x + 192, 116, 22, popIn(t, bb.at == null ? null : bb.at + 0.35, 0.35));
      }
      pan2 += MK.pill(880, 350, "every day", on(t, cEvery, 0.4), { size: 30, col: P.bad, ink: P.ink });
      pan2 += MK.pill(880, 408, "can cause holes", on(t, cCause, 0.4), { size: 30, col: P.bad, ink: P.ink });
      out += G(pan2, { opacity: b2 });
    }

    /* ---- beat 3: water and fruit are kinder ---- */
    var b3 = thOnly(t, scene, 3);
    if (b3 > 0.01) {
      var good = [{ x: 664, pic: "\u{1F4A7}", cap: "water", at: cWater }, { x: 924, pic: "\u{1F34E}", cap: "fruit", at: cFruit }];
      var pan3 = "";
      for (n = 0; n < 2; n++) {
        var gg = good[n], og = Math.min(1, popIn(t, gg.at, 0.45));
        if (og <= 0) continue;
        pan3 += G(R(gg.x, 92, 216, 200, 22, "#183B33", P.good, 3) + MK.pic(gg.x + 108, 168, 90, gg.pic) +
          Tx(gg.x + 108, 262, gg.cap, "lab big", "middle"), { opacity: Math.min(1, og) });
        pan3 += MK.tick(gg.x + 192, 116, 22, popIn(t, gg.at == null ? null : gg.at + 0.35, 0.35));
      }
      pan3 += MK.pill(880, 356, "kinder to your teeth", on(t, cKinder, 0.4), { size: 30, col: P.good, ink: P.ink });
      out += G(pan3, { opacity: b3 });
    }

    /* ---- beat 4: a treat now and then, not every day all day ---- */
    var b4 = thOnly(t, scene, 4);
    if (b4 > 0.01) {
      var pan4 = "", bw = 58, bg = 11, bx0 = 596;
      var rowsY = [104, 274];
      for (var r = 0; r < 2; r++) {
        var rowAt = r === 0 ? cTreat : cDaily;
        var ro = on(t, rowAt, 0.45);
        if (ro <= 0) continue;
        for (n = 0; n < 7; n++) {
          var bxx = bx0 + n * (bw + bg);
          pan4 += R(bxx, rowsY[r], bw, bw, 12, P.cell, P.line, 2, { opacity: ro });
          var has = r === 0 ? (n === 3 ? popIn(t, cTreat == null ? null : cTreat + 0.45, 0.35) : 0)
            : popIn(t, cDaily == null ? null : cDaily + n * 0.1, 0.3);
          if (has > 0) pan4 += MK.pop(MK.pic(bxx + bw / 2, rowsY[r] + bw / 2, 40, "\u{1F36C}"), bxx + bw / 2, rowsY[r] + bw / 2, Math.min(1.06, has));
        }
        pan4 += Tx(bx0, rowsY[r] - 16, r === 0 ? "now and then" : "every day, all day", "lab big", "start", { opacity: ro });
        if (r === 0) pan4 += MK.tick(bx0 + 7 * (bw + bg) + 24, rowsY[r] + bw / 2, 24, popIn(t, cFine, 0.4));
        else pan4 += MK.cross(bx0 + 7 * (bw + bg) + 24, rowsY[r] + bw / 2, 24, popIn(t, cNot, 0.4));
      }
      out += G(pan4, { opacity: b4 });
    }
    return svg(out);
  }
