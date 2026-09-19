
  /* ==== Sounds Near and Far, part 3: "Near and far" (the chapter), and
     "Loud, medium, quiet" ===================================================== */

  function snNearFar(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var k = i - scene.first, plan = snFarPlan(scene), kid = snFarKid(plan, t);
    var swing = snSwing(t, plan.rings.map(function (r) { return r.at; }), 12);
    var W = SN_FAR.w * SN_FAR.k, H = SN_FAR.h * SN_FAR.k;
    var out = "<defs>" +
      '<linearGradient id="snMeterFill" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="' + P.teal + '"/><stop offset="1" stop-color="' + P.gold + '"/></linearGradient>' +
      '<clipPath id="snFarClip">' + R(SN_FAR.x, SN_FAR.y, W, H, 0) + "</clipPath></defs>";
    out += ART.place(snFarSvg(kid.steps, kid.pos, swing), SN_FAR.x, SN_FAR.y, W, H);

    /* "right next to": the bell and the child, ringed together */
    var nx = on(t, c(0, "next"), 0.4) * (1 - on(t, c(1, "step"), 0.3));
    if (nx > 0) out += E((SN_BELL[0] + snKidX(0)) / 2, SN_BELL[1] + 2, 120, 72, "none", P.accent, 5, { opacity: nx });

    /* the sound: every ring, clipped to the drawing */
    var rings = plan.rings.map(function (r) { return snFarRing(t, r); }).join("");
    var kx = snKidX(kid.pos), heard = null, rung = null;
    plan.rings.forEach(function (r) { if (t >= r.arrive) heard = r; if (t >= r.at) rung = r; });
    /* the child hears each ring as it arrives: a ring round the child, as
       strong as the sound that is left */
    if (heard) {
      var g = snGain(heard.steps), hb = bump(t, heard.arrive, 0.7);
      rings += C(kx, SN_KID_Y, 56, "none", P.accent, 2 + 8 * g, { opacity: hb * (0.25 + 0.75 * g) });
    }
    /* "It spreads out": the slow ring is faint by then, as it should be, so a
       thin dashed line traces its circle and shows how big it has grown */
    var spreads = c(4, "spreads");
    plan.rings.forEach(function (r) {
      if (!r.slow || spreads == null || t < spreads) return;
      var rad = SN_RING_R0 + r.v * (t - r.at);
      if (rad < 760) rings += C(SN_BELL[0], SN_BELL[1], rad, "none", P.accent, 3,
        { "stroke-dasharray": "10 12", opacity: 0.9 * on(t, spreads, 0.4) });
    });
    out += G(rings, { "clip-path": "url(#snFarClip)" });

    /* the path the sound takes: on its way, and further */
    var way = c(4, "way"), further = c(5, "further");
    var ax0 = SN_BELL[0] + 46, ax1 = snKidX(6) - 52, ay = 372;
    var au = on(t, way, 0.9);
    if (au > 0) {
      out += MK.arrow(ax0, ay, ax1, ay, au, P.gold, 7 + 3 * bump(t, further, 0.7));
      out += Tx((ax0 + ax1) / 2, ay + 32, further != null && t >= further ? "further" : "on its way", "lab mid", "middle",
        { opacity: on(t, way + 0.3, 0.4) * (further != null && t >= further ? on(t, further, 0.4) : 1) });
    }
    out += MK.pop(MK.pill(470, 76, "spreads out", 1, { size: 26, col: P.gold }), 470, 76, popIn(t, c(4, "spreads"), 0.4) * (1 - on(t, BEATS[scene.first + 5].start, 0.4)));

    /* the meters: at your ear from the start; at the bell from "the same" */
    var mx = 800, mw = 340, start = BEATS[scene.first].start;
    var ear = heard ? snGain(heard.steps) : 0;
    out += snMeter(mx, 104, mw, ear, "\u{1F442}", "at your ear", on(t, start - 0.2, 0.5), heard ? bump(t, heard.arrive, 0.6) : 0);
    var same = c(3, "same");
    out += snMeter(mx, 284, mw, 1, "\u{1F514}", "at the bell", on(t, same, 0.5), rung && same != null && t >= same ? bump(t, rung.at, 0.6) : 0);
    out += MK.pop(MK.pill(mx + mw / 2, 402, "the same every time", 1, { size: 24, col: P.gold }), mx + mw / 2, 402, popIn(t, same == null ? null : same + 0.4, 0.4));

    /* the word for what the child hears, between the meters, until the bell's meter comes */
    var loud = c(0, "loud"), q1 = c(1, "quieter"), wx = mx + mw / 2, wy = 232;
    var wOut = 1 - on(t, same, 0.4);
    if (q1 == null || t < q1) out += MK.pop(Tx(wx, wy, "loud", "lab huge gold", "middle"), wx, wy - 14, popIn(t, loud, 0.4) * wOut);
    else out += MK.pop(Tx(wx, wy, "quieter", "lab huge gold", "middle"), wx, wy - 14, popIn(t, q1, 0.4) * wOut);
    /* the rule, on the drawing's sky where "spreads out" was */
    var fq = c(5, "quieter");
    out += MK.pop(MK.pill(470, 76, "the further, the quieter", 1, { size: 26, col: P.gold, ink: P.gold }), 470, 76, popIn(t, fq, 0.4));
    return svg(out);
  }

  /* ==== chapter: loud, medium, quiet ============================================
     The three words with the lesson's own pictures for them (the record step's
     choices), a drum next to you under "loud" and a whisper under "quiet",
     which you have to be close to hear. Then the lesson's own table, filled in
     row by row as the voice reads it, and the pattern down it: the further
     away, the quieter. */
  var SN_LEVELS = [
    { word: "Loud", pic: "\u{1F50A}", x: 234, cue: "loud" },
    { word: "Medium", pic: "\u{1F509}", x: 584, cue: "medium" },
    { word: "Quiet", pic: "\u{1F508}", x: 934, cue: "quiet" }
  ];

  function snLevels(scene, t) {
    var c = function (k, name) { return sc(scene, k, name); };
    var out = "";
    SN_LEVELS.forEach(function (l) {
      out += MK.pop(MK.pic(l.x, 84, 100, l.pic) + Tx(l.x, 190, l.word, "lab huge", "middle"), l.x, 136, popIn(t, c(0, l.cue), 0.4));
    });
    var drum = c(0, "drum"), dp = popIn(t, drum, 0.4);
    if (dp > 0) out += snBoth(234, 320, t, drum + 0.1, { r0: 66, reach: 100, n: 3, period: 0.9, w: 9 }) + MK.pop(MK.pic(234, 320, 116, "\u{1F941}"), 234, 320, dp);
    var wh = c(1, "whisper"), wp = popIn(t, wh, 0.4), close = on(t, c(1, "close"), 0.9);
    if (wp > 0) out += snBoth(934, 320, t, wh + 0.1, { r0: 62, reach: 26, n: 2, period: 1.5, w: 3, op: 0.6 }) + MK.pop(MK.pic(934, 320, 116, "\u{1F92B}"), 934, 320, wp);
    if (close > 0) out += G(MK.pic(lerp(1104, 1044, close), 320, 80, "\u{1F442}"), { opacity: Math.min(1, close * 3) });
    return out;
  }

  var SN_TROWS = [
    { pic: "1\uFE0F\u20E3", label: "1 step away", word: "Loud", icon: "\u{1F50A}", beat: 3, row: "one", val: "loud" },
    { pic: "3\uFE0F\u20E3", label: "3 steps away", word: "Medium", icon: "\u{1F509}", beat: 3, row: "three", val: "medium" },
    { pic: "6\uFE0F\u20E3", label: "6 steps away", word: "Quiet", icon: "\u{1F508}", beat: 4, row: "six", val: "quiet" }
  ];

  function snTable(scene, t) {
    var c = function (k, name) { return sc(scene, k, name); };
    var write = c(2, "write"), table = c(2, "table"), further = c(4, "further");
    var X = 204, W = 760, SPLIT = 604, out = "";
    var f = on(t, write, 0.5);
    out += G(Tx(X + 18, 48, "DISTANCE", "lab mid caps", "start", { fill: P.teal }) +
      Tx(SPLIT + 18, 48, "HOW LOUD?", "lab mid caps", "start", { fill: P.teal }), { opacity: f });
    SN_TROWS.forEach(function (r, k) {
      var y = 66 + k * 102, h = 88, shown = on(t, write == null ? null : write + 0.15 * k, 0.4);
      if (shown <= 0) return;
      var rowAt = c(r.beat, r.row), valAt = c(r.beat, r.val);
      var named = rowAt != null && t >= rowAt, done = valAt != null && t >= valAt, green = done && t >= valAt + 0.3;
      var border = green ? P.good : named ? P.gold : P.line;
      out += G(R(X, y, W, h, 18, green ? "rgba(79,209,160,0.14)" : P.card, border, named ? 3 : 2) +
        L(SPLIT, y + 10, SPLIT, y + h - 10, P.line, 2) +
        MK.pic(X + 50, y + h / 2, 56, r.pic) +
        Tx(X + 96, y + h / 2 + 11, r.label, "lab big" + (named ? "" : " muted"), "start") +
        (done ? MK.pop(MK.pic(SPLIT + 52, y + h / 2, 54, r.icon) + Tx(SPLIT + 96, y + h / 2 + 11, r.word, "lab big", "start"), SPLIT + 120, y + h / 2, popIn(t, valAt, 0.4))
              : Tx(SPLIT + 30, y + h / 2 + 11, "\u2026", "lab big muted", "start")),
        { opacity: shown, transform: around(X + W / 2, y + h / 2, 1 + 0.03 * bump(t, table, 0.6)) });
    });
    /* the pattern: down the table it gets further, and quieter */
    var u = on(t, further, 0.8);
    if (u > 0) {
      out += MK.arrow(X - 56, 96, X - 56, 330, u, P.gold, 7) + MK.arrow(X + W + 56, 96, X + W + 56, 330, u, P.gold, 7);
      out += Tx(X - 56, 398, "further", "lab big gold", "middle", { opacity: on(t, further + 0.4, 0.4) }) +
        Tx(X + W + 56, 398, "quieter", "lab big gold", "middle", { opacity: on(t, further + 0.7, 0.4) });
    }
    return out;
  }

  /* the three words stay until "write it down", and the table comes in on it */
  function snLoudness(scene, beat, t, i) {
    var k = i - scene.first, write = sc(scene, 2, "write");
    var u = k < 2 ? 0 : k > 2 ? 1 : write == null ? into(t, i) : on(t, write - 0.15, 0.45), out = "";
    if (u < 1) out += G(snLevels(scene, t), { opacity: 1 - u });
    if (u > 0) out += G(snTable(scene, t), { opacity: u });
    return svg(out);
  }
