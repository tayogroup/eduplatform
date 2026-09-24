  /* ==== Collecting Data, part 2: a purpose first, and the ways of collecting ====
     tools/lib/film-scenes/computing-g2/collecting-data-2.js. See collecting-data.js
     for the eight answers every number here is counted off.

     The ways chapter is the lesson's own survey step: shouting, guessing, a
     tally on paper and a form on the tablet, each with the outcome the lesson
     gives it. The tally's marks and the form's counts are the same eight
     answers written two ways, so "four marks for banana, two for apple" is
     true of both pictures at once. The last beat is the lesson's own car
     question: a driver cannot fill in a form, so the tally app is tapped as
     each car passes - and the number on the app is the number of cars that
     have gone by, counted from the same list of times that moves them. */

  /* ==== chapter: a purpose first ==================================================
     The purpose on the left, the question it decides on the right, and the four
     fruits arriving on the button each is named on. */
  var CD_PUR = { x: 40, y: 100, w: 450, h: 246 };
  var CD_Q = { x: 600, y: 62, w: 530, h: 320 };
  var CD_BTN = { w: 228, h: 84, cols: [646, 886], rows: [196, 292] };

  function cdPurposeChapter(scene, beat, t, i) {
    var cPurpose = sc(scene, 0, "purpose"), cFind = sc(scene, 0, "find");
    var cParty = sc(scene, 1, "party"), cQuestion = sc(scene, 2, "question");
    var at = [sc(scene, 3, "apple"), sc(scene, 3, "banana"), sc(scene, 3, "orange"), sc(scene, 3, "grapes")];
    var out = "";

    /* the purpose */
    var pc = popIn(t, cPurpose, 0.45), q = on(t, cFind, 0.5), tg = popIn(t, cParty, 0.45);
    out += MK.pop(R(CD_PUR.x, CD_PUR.y, CD_PUR.w, CD_PUR.h, 24, P.card, P.gold, 3),
      CD_PUR.x + CD_PUR.w / 2, CD_PUR.y + CD_PUR.h / 2, pc);
    out += MK.pill(148, 74, "Purpose", Math.min(1, pc), { size: 22, col: P.gold, ink: P.gold });
    out += MK.qmark(265, 223, 54, q * (1 - Math.min(1, tg)));
    if (tg > 0) {
      out += MK.pop(Em(135, 232, 96, "\u{1F3AF}"), 135, 223, tg);
      out += Tx(200, 212, "which fruit to buy", "lab", "start", { opacity: Math.min(1, tg) });
      out += Tx(200, 252, "for the class party", "lab", "start", { opacity: Math.min(1, tg) });
    }

    /* the question it decides */
    var qc = popIn(t, cQuestion, 0.45);
    out += MK.arrow(500, 223, 588, 223, on(t, cQuestion, 0.5), P.gold, 8);
    out += MK.pop(R(CD_Q.x, CD_Q.y, CD_Q.w, CD_Q.h, 24, P.card, P.line, 2),
      CD_Q.x + CD_Q.w / 2, CD_Q.y + CD_Q.h / 2, qc);
    if (qc > 0) {
      out += Tx(865, 122, "Which fruit do you", "lab big", "middle", { opacity: Math.min(1, qc) });
      out += Tx(865, 158, "like best?", "lab big", "middle", { opacity: Math.min(1, qc) });
    }
    CD_FRUIT.forEach(function (f, k) {
      var x = CD_BTN.cols[k % 2], y = CD_BTN.rows[Math.floor(k / 2)], p = popIn(t, at[k], 0.4);
      out += MK.pop(R(x, y, CD_BTN.w, CD_BTN.h, 20, P.cell, P.teal, 2.5) +
        Em(x + 48, y + CD_BTN.h / 2, 48, f.pic) +
        Tx(x + 88, y + CD_BTN.h / 2 + 8, f.label, "lab", "start"),
        x + CD_BTN.w / 2, y + CD_BTN.h / 2, p);
    });
    return svg(out);
  }

  /* ==== chapter: ways of collecting ==============================================
     Four ways on the left, and on the right what each one actually gives. */
  var CD_WAYS = [
    { pic: "\u{1F5E3}️", label: "everyone shouts", ok: false },
    { pic: "\u{1F914}", label: "just guess", ok: false },
    { pic: "\u{1F4DD}", label: "a tally on paper", ok: true },
    { pic: "\u{1F4F1}", label: "a form on the tablet", ok: true }
  ];
  var CD_ROW = { x: 36, w: 486, h: 80, pitch: 98, top: 33 };
  var CD_OUT = { x: 560, y: 30, w: 572, h: 380 };

  function cdWayRow(k, lit, mark, markP) {
    var w = CD_WAYS[k], y = CD_ROW.top + k * CD_ROW.pitch;
    var col = mark === "tick" ? P.good : mark === "cross" ? P.bad : lit > 0.5 ? P.gold : P.line;
    return G(R(CD_ROW.x, y, CD_ROW.w, CD_ROW.h, 20, P.cell, col, lit > 0.5 || mark ? 3.5 : 2) +
      MK.pic(CD_ROW.x + 44, y + CD_ROW.h / 2, 44, w.pic) +
      Tx(CD_ROW.x + 82, y + CD_ROW.h / 2 + 8, w.label, "lab", "start") +
      (mark === "tick" ? MK.tick(CD_ROW.x + CD_ROW.w - 42, y + CD_ROW.h / 2, 24, markP) : "") +
      (mark === "cross" ? MK.cross(CD_ROW.x + CD_ROW.w - 42, y + CD_ROW.h / 2, 24, markP) : ""),
      { opacity: 0.45 + 0.55 * clamp(lit, 0, 1) });
  }

  /* the shouting: four answers at once, and no way to count any of them */
  var CD_SHOUT = [
    { x: 584, y: 58, w: 250, h: 74, say: "Banana!" },
    { x: 862, y: 116, w: 234, h: 74, say: "Apple!" },
    { x: 596, y: 176, w: 276, h: 74, say: "BANANA!" },
    { x: 874, y: 238, w: 234, h: 74, say: "Grapes!" }
  ];

  function cdWayOutcome(scene, k, t) {
    var out = "";
    if (k === 0) {
      var ch = on(t, sc(scene, 0, "choose"), 0.5), wk = popIn(t, sc(scene, 0, "works"), 0.4);
      out += MK.qmark(846, 196, 78, ch);
      out += MK.tick(778, 336, 30, wk);
      out += MK.cross(914, 336, 30, popIn(t, sc(scene, 0, "works") == null ? null : sc(scene, 0, "works") + 0.3, 0.4));
      return out;
    }
    if (k === 1) {
      var sh = sc(scene, 1, "shouts"), nz = sc(scene, 1, "noise");
      CD_SHOUT.forEach(function (b, n) {
        out += MK.bubble(b.x, b.y, b.w, b.h, b.say, popIn(t, sh == null ? null : sh + n * 0.22, 0.35));
      });
      out += MK.waves(846, 196, t, sh, { dir: -1.57, spread: 2.2, reach: 170, col: P.bad, n: 4 });
      out += MK.cross(846, 368, 32, popIn(t, nz, 0.4));
      return out;
    }
    if (k === 2) {
      var gs = sc(scene, 2, "guess"), ct = sc(scene, 2, "count");
      out += MK.pop(Em(846, 318, 104, "\u{1F914}"), 846, 318, popIn(t, gs, 0.4));
      out += MK.bubble(616, 96, 460, 92, "bananas, probably", popIn(t, gs == null ? null : gs + 0.4, 0.4), 846, 250);
      out += MK.cross(1052, 126, 30, popIn(t, ct, 0.4));
      return out;
    }
    if (k === 3) {
      var ty = sc(scene, 3, "tally"), f4 = sc(scene, 3, "four"), t2 = sc(scene, 3, "two");
      out += cdPaper(596, 58, 500, 322, popIn(t, ty, 0.4));
      out += cdChart(636, 80, 420, { got: cdGot(tally(t, ty, CD_TOTAL, 1.1)), ink: "#2A2A2A",
        mark: "#3B3B3B", rowH: 72, em: 38, markX: 196, countX: 368, markH: 36,
        ring: cdPast(t, t2) ? "apple" : cdPast(t, f4) ? "banana" : null, o: popIn(t, ty, 0.4) });
      out += MK.tick(1078, 86, 28, popIn(t, ty == null ? null : ty + 0.6, 0.4));
      return out;
    }
    var fm = sc(scene, 4, "form"), rc = sc(scene, 4, "records"), cn = sc(scene, 4, "counts");
    var p = popIn(t, fm, 0.45), got = cdGot(tally(t, rc, CD_TOTAL, 1.5));
    out += MK.pop(R(636, 40, 420, 360, 26, "#2B5673", "#93AABE", 4) +
      R(660, 72, 372, 296, 8, P.ground) + C(846, 384, 10, P.ground, "#93AABE", 2), 846, 220, p);
    if (p > 0) {
      out += Tx(846, 108, "Which fruit?", "lab mid", "middle", { opacity: Math.min(1, p), fill: P.gold });
      CD_FRUIT.forEach(function (f, k2) {
        var y = 152 + k2 * 52, n = got[f.id] || 0, fl = bump(t, cn == null ? null : cn + k2 * 0.12, 1.0);
        out += G(R(686, y - 22, 320, 44, 12, P.cell, n > 0 ? P.teal : P.line, n > 0 ? 2.5 : 1.5) +
          Em(714, y, 30, f.pic) + Tx(740, y + 7, f.label, "lab mid", "start") +
          Tx(978, y + 8, String(n), "lab", "middle", { fill: n > 0 ? P.good : P.muted, "font-size": 26 + 8 * fl }),
          { opacity: Math.min(1, p) });
      });
      out += Tx(846, 348, CD_TOTAL + " answers, counted", "lab mid muted", "middle",
        { opacity: Math.min(1, p) * on(t, cn, 0.5) });
    }
    out += MK.tick(1082, 62, 28, popIn(t, fm == null ? null : fm + 0.7, 0.4));
    return out;
  }

  /* the lesson's cars: a driver cannot fill in a form, so a tally app is tapped
     as each one passes the gate. One list of times moves the cars AND writes
     the marks, so the number on the app is the number that has gone by. */
  var CD_CAR = { gate: 430, speed: 300, y: 252, n: 3 };
  function cdCarPass(at, k) { return at == null ? null : at + 0.55 + k * 0.75; }

  function cdCarsPicture(scene, t) {
    var cCars = sc(scene, 5, "cars"), cApp = sc(scene, 5, "app"), out = "";
    /* the road */
    out += R(0, 186, 1168, 132, 0, P.cell, null, null, { opacity: 0.85 });
    out += L(0, 186, 1168, 186, P.line, 3) + L(0, 318, 1168, 318, P.line, 3);
    for (var d = 0; d < 12; d++) out += L(24 + d * 92, 252, 78 + d * 92, 252, P.muted, 4, { opacity: 0.45 });
    /* the school gate the cars pass */
    out += Em(CD_CAR.gate, 128, 74, "\u{1F3EB}");
    out += L(CD_CAR.gate, 168, CD_CAR.gate, 330, P.gold, 4, { "stroke-dasharray": "12 10" });

    /* a form nobody in a car can fill in */
    var fo = popIn(t, cCars, 0.45);
    out += MK.pop(R(36, 16, 300, 142, 20, P.card, P.line, 2) +
      Tx(186, 58, "a form", "lab", "middle", { fill: P.muted }) +
      L(70, 88, 302, 88, P.line, 4) + L(70, 118, 302, 118, P.line, 4), 186, 87, fo);
    out += MK.cross(320, 34, 28, popIn(t, cCars == null ? null : cCars + 0.6, 0.4));

    /* the cars, and the app counting them */
    var passed = 0, k;
    for (k = 0; k < CD_CAR.n; k++) {
      var pt = cdCarPass(cApp, k);
      if (pt == null) continue;
      if (t >= pt) passed++;
      out += MK.ripple(880, 372, t, pt, P.gold);
      var x = CD_CAR.gate + (t - pt) * CD_CAR.speed;
      /* the svg does not clip, so a car is drawn only while the whole of it
         is inside the box, and fades at each end rather than driving off it */
      if (x < 52 || x > 1116) continue;
      var fade = clamp(Math.min(x - 52, 1116 - x) / 90, 0, 1);
      out += G(Em(x, CD_CAR.y, 76, "\u{1F697}"), { opacity: fade });
    }
    var ap = popIn(t, cApp, 0.45);
    out += MK.pop(R(760, 330, 372, 96, 20, P.card, P.teal, 3) +
      Tx(786, 386, "tally app", "lab mid muted", "start") +
      cdTally(900, 378, passed, 40, 20, P.gold, 1) +
      C(1086, 378, 27, "none", P.good, 3) +
      Tx(1086, 388, String(passed), "lab", "middle", { fill: P.good, "font-size": 28 }),
      946, 378, ap);
    if (passed > 0) out += MK.finger(880, 372, bump(t, cdCarPass(cApp, passed - 1), 0.7));
    return out;
  }

  /* each way's own cue, and how long after it the lesson's verdict lands */
  var CD_ROW_CUE = [["noise", 0], ["guess", 0.9], ["tally", 0.5], ["form", 0.7]];

  function cdWaysChapter(scene, beat, t, i) {
    var u = into(t, scene.first + 5), out = "", k = clamp(i - scene.first, 0, 4);
    if (u < 1) {
      var main = "", rows = "";
      /* which row is being talked about, and what the lesson decided about it */
      CD_WAYS.forEach(function (w, n) {
        var beatOf = n + 1, cue0 = CD_ROW_CUE[n], at = sc(scene, beatOf, cue0[0]);
        var markAt = at == null ? null : at + cue0[1];
        rows += cdWayRow(n, cdFrom(t, scene, beatOf) * (n === k - 1 ? 1 : 0.75),
          cdPast(t, markAt) ? (w.ok ? "tick" : "cross") : null, popIn(t, markAt, 0.35));
      });
      main += G(rows, { opacity: on(t, sc(scene, 0, "choose"), 0.5) });
      main += R(CD_OUT.x, CD_OUT.y, CD_OUT.w, CD_OUT.h, 22, P.card, P.line, 2);
      main += crossfade(t, i, scene, function (n) { return cdWayOutcome(scene, clamp(n - scene.first, 0, 4), t); });
      out += G(main, { opacity: 1 - u });
    }
    if (u > 0) out += G(cdCarsPicture(scene, t), { opacity: u });
    return svg(out);
  }
