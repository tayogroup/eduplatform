  /* ==== Grade 3 Computing, Lesson 14: Machines, Things and Robots =============
     tools/lib/film-scenes/computing-g3/machines-things-and-robots.js, with -2,
     -3 and -4.js: the film's pictures, after the shared marks (MK) and before
     the engine's tail, all in one scope. The storyboard is
     computing/grade-3-app/lecture-video/machines-things-and-robots.json.

     WHAT COMES FROM THE LESSON AND WHAT IS DRAWN HERE. The Computing kit keeps
     no top-level drawing for a controlled machine, a smart device or a factory
     line - Lesson 14 sorts and names things, it does not run an activity with
     a picture behind it - so there is no ART.scene for any of this and every
     picture is drawn here, in the engine's own idiom, exactly as
     networks-around-us.js draws its hardware. The washing machine, the bulb,
     the smart watch, the factory items and the robot arm are drawn with the
     lesson's own emoji where the lesson's own step items use one (the sort
     step's washing machine, bicycle, traffic lights, whisk, lift, scissors,
     door and broom; the IoT spotter's bulb, doorbell, thermostat, speaker,
     watch and plug; the "why robots" reasons), and with plain shapes (a chip
     badge for "a small computer inside", a physical rocker switch for the
     lamp that is not smart) where an emoji would draw the wrong thing or
     nothing at all. Nothing here is a picture of a wrong answer: the lesson
     sorts things into "has a program" and "does not", and "smart" and "not",
     which are categories, not mistakes - so rows are marked with a tick or a
     plain dot, never a cross.

     This file: the palette, the timing helpers, the chip badge every chapter
     shares, the title motif, and the chapter "A program decides". Every
     top-level name here starts with mt. */

  var HUE = {
    title: P.teal, control: P.gold, iot: P.blue, line: P.plum,
    why: P.accent, robotparts: P.good, recap: P.teal
  };

  /* ---- timing ---------------------------------------------------------------- */

  /* has this cue been reached? (a cue its beat never names is never reached) */
  function mtPast(t, at) { return at != null && t >= at; }

  /* ---- a small computer inside: drawn, not an emoji ----------------------------
     A rounded chip with two pins and a lit dot, small enough to sit on a
     corner of a card. Used for "a small computer inside" everywhere it is
     said, so the same badge means the same thing in every chapter. */
  function mtChip(cx, cy, s, p) {
    if (!(p > 0)) return "";
    var w = s, h = s * 0.72;
    var out = R(cx - w / 2, cy - h / 2, w, h, s * 0.16, P.dark, P.blue, 2.4);
    for (var k = 0; k < 3; k++) {
      var px = cx - w * 0.3 + k * w * 0.3;
      out += L(px, cy - h / 2, px, cy - h / 2 - s * 0.16, P.blue, 2.4) +
        L(px, cy + h / 2, px, cy + h / 2 + s * 0.16, P.blue, 2.4);
    }
    out += C(cx, cy, s * 0.14, P.good);
    return MK.pop(out, cx, cy, p);
  }

  /* a physical rocker switch: a small plate with a raised half, drawn rather
     than an emoji, for the lamp with "just a switch" in it */
  function mtSwitch(cx, cy, s, on1) {
    var w = s, h = s * 0.56;
    return R(cx - w / 2, cy - h / 2, w, h, h * 0.3, P.plastic, P.line, 2) +
      R(cx - w / 2 + (on1 ? w * 0.5 : w * 0.06), cy - h / 2 + h * 0.12, w * 0.44, h * 0.76, h * 0.2, P.card, P.line, 1.5);
  }

  /* one card: an icon, a label under it, and an optional tick or dot at its
     corner. opt: {o, col, mark: "tick" | "dot", markP, dim} */
  function mtCard(x, y, w, h, pic, label, opt) {
    opt = opt || {};
    var o = opt.o == null ? 1 : opt.o;
    if (!(o > 0)) return "";
    var cx = x + w / 2;
    var body = R(x, y, w, h, h * 0.16, P.cell, opt.col || P.line, opt.col ? 3.5 : 2) +
      MK.pic(cx, y + h * 0.42, h * 0.5, pic) +
      Tx(cx, y + h * 0.84, label, "lab mid", "middle");
    var mx = x + w - h * 0.2, my = y + h * 0.2, mp = opt.markP == null ? 1 : opt.markP;
    if (opt.mark === "tick") body += MK.tick(mx, my, h * 0.2, mp);
    else if (opt.mark === "dot") body += MK.pop(C(mx, my, h * 0.13, P.muted), mx, my, mp);
    return G(body, { opacity: clamp(o, 0, 1) * (opt.dim ? 0.42 : 1) });
  }

  /* ==== the title ================================================================
     A washing machine gaining a chip (a program deciding), a bulb gaining
     wireless rings (talking to the internet), and a robot on a line of three
     dots (building cars) - the film's three ideas, stacked. On the two cards
     it stands still, at full brightness. */
  function titleMotif(o) {
    var t = o.t || 0, sn = o.scene;
    var cMachines = sn ? sc(sn, 0, "machines") : null, cProgram = sn ? sc(sn, 0, "program") : null;
    var cInternet = sn ? sc(sn, 1, "internet") : null, cRobots = sn ? sc(sn, 1, "robots") : null;
    var out = R(10, 22, 340, 316, 28, P.card, P.line, 3);

    /* row 1: the washing machine, then its program */
    var p1 = sn ? on(t, cMachines, 0.6) : 1;
    if (p1 > 0) {
      out += G(Em(96, 96, 62, "\u{1F9FA}") + Tx(160, 108, "a program decides", "lab mid", "start"),
        { opacity: p1 });
      out += mtChip(140, 62, 30, sn ? popIn(t, cProgram, 0.4) : 1);
    }
    /* row 2: the bulb, connected to the internet */
    var p2 = sn ? on(t, cInternet, 0.6) : 1;
    if (p2 > 0) {
      out += G(Em(96, 196, 58, "\u{1F4A1}") + Tx(160, 208, "things go online", "lab mid", "start"), { opacity: p2 });
      out += MK.waves(96, 196, t, sn ? cInternet : t - 1, { n: 3, reach: 60, period: 1.1, col: P.blue });
    }
    /* row 3: the robot, on a line of three dots - a factory line */
    var p3 = sn ? on(t, cRobots, 0.6) : 1;
    if (p3 > 0) {
      out += G(Em(96, 296, 58, "\u{1F916}") + Tx(160, 308, "robots build cars", "lab mid", "start"), { opacity: p3 });
      out += C(60, 328, 6, P.plum) + C(80, 328, 6, P.plum) + C(100, 328, 6, P.plum);
    }
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A washing machine with a program, a bulb online, and a robot on a factory line">' +
      out + "</svg>";
  }

  /* ==== chapter: a program decides =================================================
     Two columns, the lesson's own sort: on the left, four machines a program
     controls, each ticked as it is named; on the right, three that a person
     works by hand, each with a plain dot. The last beat asks the question the
     whole sort answers: is a computer deciding, or are you? */
  var MT_PROG = [
    { id: "washing", pic: "\u{1F9FA}", label: "washing machine" },
    { id: "traffic", pic: "\u{1F6A6}", label: "traffic lights" },
    { id: "lift", pic: "\u{1F3E2}", label: "a lift" },
    { id: "door", pic: "\u{1F6AA}", label: "automatic door" }
  ];
  var MT_NOPROG = [
    { id: "bicycle", pic: "\u{1F6B2}", label: "bicycle" },
    { id: "whisk", pic: "\u{1F944}", label: "a hand whisk" },
    { id: "broom", pic: "\u{1F9F9}", label: "a broom" }
  ];
  var MT_COL = { lw: 500, rw: 380, h: 76, gap: 10, top: 90 };
  function mtColY(k) { return MT_COL.top + k * (MT_COL.h + MT_COL.gap); }

  function mtControlChapter(scene, beat, t, i) {
    var cCtl = sc(scene, 0, "programctl"), cComp = sc(scene, 0, "computerin"), cDec = sc(scene, 0, "decides1"), cCtrld = sc(scene, 0, "compctrld1");
    var cWash = sc(scene, 1, "washing1"), cTurnHeatStop = sc(scene, 1, "turnheatstop");
    var cTraffic = sc(scene, 2, "trafficlift"), cDoor = sc(scene, 2, "autodoor"), cSensor = sc(scene, 2, "sensor1");
    var cBike = sc(scene, 3, "bicyclewhiskbroom"), cNoProg = sc(scene, 3, "noprogram"), cWork = sc(scene, 3, "work1");
    var cCompDec = sc(scene, 4, "computerdeciding"), cYou = sc(scene, 4, "areyou");
    var u = into(t, scene.first + 4), out = "", main = "";

    /* the two headers: a chip for "a program decides", a spanner for not -
       the left one builds in across its own beat: the panel, then the chip */
    var hp = on(t, cCtl, 0.5);
    main += G(R(20, 24, MT_COL.lw, 56, 16, P.card, P.gold, 2.4) +
      Tx(96, 60, "A program decides", "lab big", "start"), { opacity: hp });
    main += mtChip(56, 52, 30, popIn(t, cComp, 0.4));
    main += R(560, 24, MT_COL.rw, 56, 16, P.card, P.line, 2.4) +
      Em(586, 52, 34, "\u{1F527}") + Tx(618, 60, "No program", "lab big", "start");

    /* "computer-controlled": the name for a machine like this, in the row
       where the first machine card is about to land - shown before it
       arrives, and faded out as it does, so the two are never on screen
       together */
    var ctp = popIn(t, cCtrld, 0.4) * (1 - into(t, scene.first + 1));
    if (ctp > 0) main += MK.pill(270, 128, "computer-controlled", Math.min(1, ctp), { size: 24, col: P.gold, ink: P.gold });

    var progAt = { washing: cWash, traffic: cTraffic, lift: cTraffic, door: cDoor };
    MT_PROG.forEach(function (row, k) {
      var o = on(t, progAt[row.id], 0.5);
      if (o <= 0) return;
      main += mtCard(20, mtColY(k), MT_COL.lw, MT_COL.h, row.pic, row.label,
        { o: o, col: P.gold, mark: "tick", markP: popIn(t, progAt[row.id], 0.4) });
      /* the door's own sensor: what tells its program someone is there -
         a small badge at the card's top-left corner, the tick's own style */
      if (row.id === "door") {
        var sp = popIn(t, cSensor, 0.4), sx = 20 + 20, sy = mtColY(k) + 16;
        if (sp > 0) main += MK.pop(C(sx, sy, 15, P.card, P.gold, 2.4) + Em(sx, sy, 19, "\u{1F441}"), sx, sy, sp);
      }
    });
    var noAt = { bicycle: cBike, whisk: cBike, broom: cBike };
    MT_NOPROG.forEach(function (row, k) {
      var o = on(t, noAt[row.id], 0.5);
      if (o <= 0) return;
      main += mtCard(560, mtColY(k), MT_COL.rw, MT_COL.h, row.pic, row.label,
        { o: o, mark: "dot", markP: popIn(t, noAt[row.id], 0.4) });
    });
    /* "have no program": the right header ring flashes once, naming the column */
    var np = bump(t, cNoProg, 1.0);
    if (np > 0) main += R(560, 24, MT_COL.rw, 56, 16, "none", P.muted, 4, { opacity: np });

    /* "you do all the work": a hand, under the three things nobody programs */
    var wp2 = popIn(t, cWork, 0.42);
    if (wp2 > 0) {
      var wy = mtColY(3);
      main += MK.pop(Em(560 + MT_COL.rw / 2, wy + 28, 40, "✋"), 560 + MT_COL.rw / 2, wy + 28, wp2);
      main += MK.pill(560 + MT_COL.rw / 2, wy + 66, "you do the work", wp2, { size: 18, col: P.muted, ink: P.muted });
    }

    /* "decides what it does": the chip points at the machines that have one */
    main += MK.leader(96, 74, 96, mtColY(0) + MT_COL.h / 2, on(t, cDec, 0.5) * (1 - into(t, scene.first + 4)), P.gold);

    /* what the washing machine's program decides: turn, heat, stop - in the
       empty space above the "no program" column, before it fills */
    var ths = on(t, cTurnHeatStop, 0.5) * (1 - into(t, scene.first + 3));
    if (ths > 0) {
      main += MK.leader(560, mtColY(0) + MT_COL.h / 2, 760, mtColY(0) + MT_COL.h / 2, ths, P.gold);
      main += MK.pill(900, mtColY(0) + MT_COL.h / 2, "turn · heat · stop", ths, { size: 22, col: P.gold, ink: P.gold });
    }
    out += G(main, { opacity: 1 - u });

    /* the closing question: the chip on one side, a child on the other */
    var qp = on(t, cCompDec, 0.5);
    if (qp > 0) {
      out += MK.glow(300, 300, 70, P.gold, Math.min(1, qp) * 0.85);
      out += mtChip(300, 300, 54, Math.min(1, qp));
      out += MK.pill(300, 372, "computer deciding", qp, { size: 22, col: P.gold, ink: P.gold });
    }
    var yp = on(t, cYou, 0.55);
    if (yp > 0) {
      out += MK.glow(870, 300, 70, P.blue, Math.min(1, yp) * 0.85);
      out += MK.pop(Em(870, 300, 84, "\u{1F9D2}"), 870, 300, yp);
      out += MK.pill(870, 372, "you deciding", yp, { size: 22, col: P.blue, ink: P.blue });
    }
    if (qp > 0 && yp > 0) out += MK.pill(584, 336, "or", Math.min(qp, yp), { size: 20, col: P.muted, ink: P.muted });
    return svg(out);
  }
