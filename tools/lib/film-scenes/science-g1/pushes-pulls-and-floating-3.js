
  /* ==== Pushes, Pulls and Floating, part 3 of 3 =================================
     "Float or sink", "Forces all around", the recap, and KINDS. Same scope as
     parts 1 and 2. */

  /* ==== chapter: float or sink ===================================================
     The lesson's own tank (ART.tank), as the predict-and-drop step draws it, in
     two places: an apple and a stone, then a big log and a tiny coin. A thing
     appears above its tank as it is named and drops in; the lesson's two answer
     chips, Float and Sink, stand between the tanks and light with each result.
     For the log they come first, as the question, so the child predicts before
     it drops. */
  var TANK_W = 380, TANK_H = TANK_W * 260 / 320, TS = TANK_W / 320;
  var SLOT = [{ x: 30, y: 8 }, { x: 758, y: 8 }];
  var UP = "⬆️", DOWN = "⬇️";

  function tankIn(n, pic, y) { return ART.place(ART.tank(pic, y), SLOT[n].x, SLOT[n].y, TANK_W, TANK_H); }

  /* where a dropped thing is, in ART.tank's own y (0 above the water, 56 floating,
     188 on the bottom): it hangs above the tank from `at`, falls at +0.3 s,
     meets the water at +0.75 s, then either dips and bobs back up to the top
     or sinks, slowing, to the bottom (+1.75 s) */
  var HIT = 0.75, SUNK = 1.75;
  function dropY(t, at, floats) {
    if (at == null || t < at) return null;
    var d = t - at - 0.3;
    if (d <= 0) return 0;
    if (d < 0.45) return 14 * fall(d / 0.45);
    var e = d - 0.45;
    if (floats) return ART.TANK.float + (14 - ART.TANK.float) * Math.exp(-e * 4) * Math.cos(e * 6) + 1.5 * Math.sin(t * 2.3);
    return lerp(14, ART.TANK.sink, glide(e / 1.0));
  }
  /* rings on the water, and four drops thrown up, where a thing goes in */
  function splash(n, t, hit) {
    if (hit == null || t < hit || t > hit + 0.8) return "";
    var u = (t - hit) / 0.8, cx = SLOT[n].x + 160 * TS, cy = SLOT[n].y + 60 * TS;
    var out = E(cx, cy, 24 + 80 * u, 6 + 12 * u, "none", "#2B5673", 5 * (1 - u) + 1, { opacity: 1 - u });
    [[-1, 0.9], [-0.45, 1.25], [0.45, 1.2], [1, 0.95]].forEach(function (dp) {
      out += C(cx + dp[0] * (16 + 50 * u), cy - 80 * dp[1] * u + 110 * u * u, 6, "#2B5673", null, null, { opacity: 1 - u });
    });
    return out;
  }
  /* the thing's name, then what it did, under its tank */
  function underTank(n, name, nameO, did, didO) {
    var cx = SLOT[n].x + TANK_W / 2, out = "";
    if (nameO > 0) out += Tx(cx, 354, name, "lab mid muted", "middle", { opacity: nameO });
    if (didO > 0) out += Tx(cx, 402, did, "lab big", "middle", { opacity: didO, transform: "translate(0," + n2((1 - didO) * 8) + ")" });
    return out;
  }

  function floatPairs(scene, t, n) {
    var out = "";
    if (n === 0) {
      var a = sc(scene, 0, "drop"), s = sc(scene, 1, "drop"), ya = dropY(t, a, true), ys = dropY(t, s, false);
      out += tankIn(0, ya == null ? "" : APPLE, ya || 0) + splash(0, t, a == null ? null : a + HIT);
      out += tankIn(1, ys == null ? "" : STONE, ys || 0) + splash(1, t, s == null ? null : s + HIT);
      return out + underTank(0, "apple", on(t, a, 0.4), "floats", on(t, sc(scene, 0, "floats"), 0.4)) +
        underTank(1, "stone", on(t, s, 0.4), "sinks", on(t, sc(scene, 1, "sinks"), 0.4));
    }
    var look = sc(scene, 2, "looking"), logAt = sc(scene, 2, "log"), drop = sc(scene, 3, "drop"), coin = sc(scene, 4, "coin");
    var yl = logAt == null || t < logAt ? null : drop == null || t < drop ? 0 : dropY(t, drop, true), yc = dropY(t, coin, false);
    out += tankIn(0, yl == null ? "" : LOG, yl || 0) + splash(0, t, drop == null ? null : drop + HIT);
    out += MK.qmark(SLOT[0].x + 160 * TS, SLOT[0].y + 150 * TS, 40, on(t, look, 0.4) * (1 - on(t, drop, 0.3)));
    out += tankIn(1, yc == null ? "" : COIN, yc || 0) + splash(1, t, coin == null ? null : coin + HIT);
    return out + underTank(0, "big log", on(t, logAt, 0.4), "floats", on(t, sc(scene, 3, "floats"), 0.4)) +
      underTank(1, "tiny coin", on(t, coin, 0.4), "sinks", on(t, coin == null ? null : coin + SUNK, 0.4));
  }

  /* the lesson's answer chips, between the tanks: lit with a tick for each
     result; asked again, blank, for the log; and the test that decides it */
  function floatChips(scene, t, i) {
    var b0 = scene.first, fresh = i >= b0 + 2 ? into(t, b0 + 2) : 0, out = "";
    var f0 = sc(scene, 0, "floats"), s0 = sc(scene, 1, "sinks"), f1 = sc(scene, 3, "floats"), coin = sc(scene, 4, "coin");
    var s1 = coin == null ? null : coin + SUNK;
    /* "float or sink?" lights both chips as a question, and they stay lit from
       "Predict first" until the log is dropped in: the time to choose one */
    var predict = sc(scene, 3, "predict"), dropLog = sc(scene, 3, "drop");
    var ask = clamp(bump(t, sc(scene, 2, "ask"), 1.4) + on(t, predict, 0.3) * (1 - on(t, dropLog, 0.3)), 0, 1);
    var fTick = Math.max(popIn(t, f0, 0.35) * (1 - fresh), popIn(t, f1, 0.35));
    var sTick = Math.max(popIn(t, s0, 0.35) * (1 - fresh), popIn(t, s1, 0.35));
    [[40, UP, "Float", fTick], [150, DOWN, "Sink", sTick]].forEach(function (c) {
      out += G(choiceChip(444, c[0], 280, 90, c[1], c[2], 1, c[3] > 0.5 || ask > 0.25) + MK.tick(686, c[0] + 45, 20, c[3]),
        { transform: around(584, c[0] + 45, 1 + 0.1 * ask) });
    });
    var guess = sc(scene, 4, "guess"), test = sc(scene, 4, "test");
    /* a guess, crossed out: the "?" stays readable under a smaller cross */
    out += MK.qmark(570, 290, 34, on(t, guess, 0.35)) + MK.cross(606, 316, 20, popIn(t, guess == null ? null : guess + 0.25, 0.35));
    /* the lesson's own button for the test, pressed once as it appears */
    var press = 1 - 0.08 * bump(t, test == null ? null : test + 0.3, 0.3);
    return out + G(MK.pill(584, 380, "Drop it in", on(t, test, 0.3), { size: 26, fill: P.gold, col: P.gold, ink: "#142B3E" }),
      { transform: around(584, 380, press) });
  }

  function sceneFloat(scene, beat, t, i) {
    return svg(phased(t, i, scene, [0, 2], function (n) { return floatPairs(scene, t, n); }) + floatChips(scene, t, i));
  }

  /* ==== chapter: forces all around ================================================
     The lesson's context step: a bicycle (feet push the pedals, hands pull the
     brakes), a boat the water pushes up, a kite the wind pushes and its string
     pulls. The bicycle is drawn so its pedals and wheels can go round and stop;
     the ground slides by under it. Then the four things the step taps. */
  var RH = [226, 326], FH = [562, 326], WR = 78, BB = [382, 334];
  /* px rolled: nothing until `go`, up to speed over 1 s, steady, then slowing to
     a stop over 1.2 s from `brake` */
  function bikeDist(t, go, brake) {
    var V = 150, A1 = 1.0, B1 = 1.2;
    if (go == null || t <= go) return 0;
    var ta = Math.min(t, go + A1) - go, d = 0.5 * (V / A1) * ta * ta;
    if (t <= go + A1) return d;
    var tb = brake == null ? Infinity : Math.max(brake, go + A1);
    d += V * (Math.min(t, tb) - go - A1);
    if (t <= tb) return d;
    var td = Math.min(t - tb, B1);
    return d + V * td - 0.5 * (V / B1) * td * td;
  }
  function bikeWheel(c, turn) {
    var s = C(c[0], c[1], WR, "none", P.muted, 10) + C(c[0], c[1], WR - 9, "none", P.line, 2);
    for (var k = 0; k < 8; k++) {
      var a = turn + k * Math.PI / 4;
      s += L(c[0], c[1], c[0] + Math.cos(a) * (WR - 8), c[1] + Math.sin(a) * (WR - 8), P.muted, 2);
    }
    return s + C(c[0], c[1], 7, P.muted);
  }
  function bicycle(d, lever) {
    var turn = d / WR, crank = turn * 0.4, frame = P.accent, out = "";
    out += bikeWheel(RH, turn) + bikeWheel(FH, turn);
    out += Pth("M" + RH + " L" + BB + " L348,214 Z", null, frame, 9) + Pth("M348,214 L530,206 L542,236 L" + BB, null, frame, 9);
    out += L(542, 236, FH[0], FH[1], frame, 8) + L(348, 214, 338, 190, frame, 8) + R(300, 180, 78, 15, 7, "#142B3E", P.muted, 2);
    out += L(530, 206, 520, 166, P.muted, 7) + L(520, 166, 478, 160, P.muted, 7) + R(448, 152, 36, 15, 7, "#142B3E", P.muted, 2);
    /* the brake lever, under the grip: pulled towards it by `lever` (0-1) */
    out += L(506, 172, lerp(470, 480, lever), lerp(196, 174, lever), P.ink, 6);
    out += C(BB[0], BB[1], 22, "none", P.muted, 4);
    [0, Math.PI].forEach(function (a0) {
      var px = BB[0] + Math.cos(crank + a0) * 38, py = BB[1] + Math.sin(crank + a0) * 38;
      out += L(BB[0], BB[1], px, py, P.ink, 7) + R(px - 16, py - 5, 32, 10, 3, "#142B3E", P.ink, 2);
    });
    return out;
  }

  function aroundBike(scene, t) {
    var b0 = scene.first, bikeAt = cue(b0, "bike"), pushAt = cue(b0, "push");
    var pullAt = cue(b0 + 1, "pull"), goAt = cue(b0 + 1, "go"), stopAt = cue(b0 + 1, "stop");
    var d = bikeDist(t, pushAt == null ? null : pushAt + 0.2, pullAt == null ? null : pullAt + 0.25);
    var out = MK.glow(394, 280, 156, P.good, bump(t, bikeAt, 1.4) * 1.6) + L(30, 406, 700, 406, P.line, 4);
    for (var k = 0; k < 12; k++) {
      var x = 30 + (((k * 62 - d) % 682) + 682) % 682;
      out += L(x, 418, Math.min(x + 26, 712), 418, P.line, 4);
    }
    out += bicycle(d, on(t, pullAt, 0.35));
    out += G(MK.arrow(438, 236, 438, 306, on(t, pushAt, 0.4), PUSH, 10), { opacity: 1 - on(t, pullAt, 0.4) });
    out += MK.arrow(528, 228, 486, 188, on(t, pullAt, 0.35), PULL, 8);
    out += MK.pill(930, 170, "push to go", on(t, goAt, 0.4), { size: 32, col: PUSH });
    return out + MK.pill(930, 262, "pull to stop", on(t, stopAt, 0.4), { size: 32, col: PULL });
  }

  /* the boat the water pushes up, and the kite the wind pushes and the string pulls */
  function aroundBoatKite(scene, t) {
    var b2 = scene.first + 2, b3 = scene.first + 3;
    var boatAt = cue(b2, "boat"), upAt = cue(b2, "up");
    var windAt = cue(b3, "wind"), kiteAt = cue(b3, "kite"), strAt = cue(b3, "string"), backAt = cue(b3, "back");
    var out = R(20, 20, 540, 404, 22, "#DDEFF7") + R(600, 20, 548, 404, 22, "#DDEFF7");
    /* the boat, bobbing */
    var bob = 3 * Math.sin(t * 2.2), rock = 1.6 * Math.sin(t * 1.7);
    out += MK.glow(290, 250, 170, P.gold, bump(t, boatAt, 1.3));
    out += G(Pth("M150,262 L430,262 L394,316 L186,316 Z", "#C0583A", "#5E3A1A", 3) + L(290, 262, 290, 104, "#5E3A1A", 6) +
      Pth("M297,114 L297,248 L404,248 Z", "#FFFFFF", "#93AABE", 2), { transform: "translate(0," + n2(bob) + ") rotate(" + n2(rock) + " 290 300)" });
    var wave = "M20," + n2(294 + bob * 0.3);
    for (var x = 20; x < 560; x += 30) wave += " Q" + (x + 15) + "," + n2(286 + bob * 0.3) + " " + (x + 30) + "," + n2(294 + bob * 0.3);
    out += Pth(wave + " L560,402 Q560,424 538,424 L42,424 Q20,424 20,402 Z", "#7FC4EA", null, null, { opacity: 0.88 });
    [210, 290, 370].forEach(function (x, k) {
      var u = on(t, upAt == null ? null : upAt + k * 0.12, 0.45), lift = 4 * Math.sin(t * 5 + k);
      /* tails at 398, so the head of an arrow just starting to grow stays in the box */
      out += MK.arrow(x, 398, x, 334 + lift, u, "#5E3A1A", 14) + MK.arrow(x, 396, x, 338 + lift, u, PUSH, 9);
    });
    /* the kite: the wind blows, it goes up; the string pulls it back */
    out += Pth("M600,368 L1148,368 L1148,402 Q1148,424 1126,424 L622,424 Q600,424 600,402 Z", P.grass) + Em(676, 336, 76, KID);
    /* the wind: streaks blowing left to right, each fading at both ends of its run */
    var wo = on(t, windAt, 0.4);
    for (var k2 = 0; k2 < 4; k2++) {
      var ph = ((t * 240 + k2 * 137) % 400) / 400, wx = 620 + 400 * ph, wy = 70 + k2 * 70;
      out += Pth("M" + n2(wx) + "," + wy + " q30,-12 60,0 t60,0", null, P.blue, 5, { opacity: wo * 0.85 * Math.sin(Math.PI * ph) });
    }
    var rise = on(t, kiteAt, 1.0) * 46, back = on(t, backAt, 0.9) * 26;
    var kx = 972 - back + 6 * Math.sin(t * 1.3), ky = 176 - rise + 4 * Math.sin(t * 1.9);
    var hand = [700, 326], tail = [kx, ky + 74];
    out += Pth("M" + hand + " Q" + n2((hand[0] + kx) / 2 + 30) + "," + n2((hand[1] + ky) / 2 + 60) + " " + n2(kx) + "," + n2(ky + 20), null, "#5E3A1A", 3);
    out += Pth("M" + hand + " Q" + n2((hand[0] + kx) / 2 + 30) + "," + n2((hand[1] + ky) / 2 + 60) + " " + n2(kx) + "," + n2(ky + 20), null, PULL, 9, { opacity: 0.6 * bump(t, strAt, 1.2) });
    out += Pth("M" + n2(kx) + "," + n2(ky - 64) + " L" + n2(kx + 46) + "," + n2(ky) + " L" + n2(kx) + "," + n2(ky + 74) + " L" + n2(kx - 46) + "," + n2(ky) + " Z", "#F0806F", "#5E3A1A", 3) +
      Pth("M" + n2(kx) + "," + n2(ky - 64) + " L" + n2(kx + 46) + "," + n2(ky) + " L" + n2(kx) + "," + n2(ky) + " Z", "#F4C95D") +
      Pth("M" + n2(kx) + "," + n2(ky + 74) + " L" + n2(kx - 46) + "," + n2(ky) + " L" + n2(kx) + "," + n2(ky) + " Z", "#6E9DE8") +
      L(kx, ky - 64, kx, ky + 74, "#5E3A1A", 2) + L(kx - 46, ky, kx + 46, ky, "#5E3A1A", 2) +
      Pth("M" + n2(tail[0]) + "," + n2(tail[1]) + " q-14,24 0,44 t0,44", null, "#5E3A1A", 2);
    out += MK.arrow(kx + 92, ky + 98, kx + 92, ky + 18, on(t, kiteAt, 0.45), "#5E3A1A", 13) + MK.arrow(kx + 92, ky + 96, kx + 92, ky + 22, on(t, kiteAt, 0.45), PUSH, 8);
    return out + MK.arrow(kx - 40, ky + 60, kx - 150, ky + 128, on(t, backAt, 0.45), PULL, 9);
  }

  var CONTEXT = [["\u{1F6B2}", "bicycle"], ["\u{1F6D2}", "trolley"], ["\u{1F6F6}", "boat"], ["\u{1FA81}", "kite"]];
  function aroundAll(scene, t) {
    var bi = scene.first + 4, both = cue(bi, "both"), every = cue(bi, "every"), out = "";
    var bo = on(t, both, 0.45);
    out += MK.arrow(410, 58, 560, 58, bo, PUSH, 12) + Tx(485, 40, "push", "lab big gold", "middle", { opacity: bo });
    out += MK.arrow(758, 58, 608, 58, bo, PULL, 12) + Tx(683, 40, "pull", "lab big", "middle", { fill: PULL, opacity: bo });
    CONTEXT.forEach(function (c, k) {
      var p = popIn(t, every == null ? null : every + k * 0.2, 0.4), x = 30 + k * 282;
      if (p <= 0) return;
      out += G(R(x, 120, 262, 290, 22, P.card, P.line, 2) + MK.pic(x + 131, 240, 130, c[0]) + Tx(x + 131, 380, c[1], "lab big", "middle"),
        { opacity: Math.min(1, p), transform: around(x + 131, 265, 0.9 + 0.1 * Math.min(p, 1.06)) });
    });
    return out;
  }

  function sceneAround(scene, beat, t, i) {
    return svg(phased(t, i, scene, [0, 2, 4], function (n) {
      return n === 0 ? aroundBike(scene, t) : n === 1 ? aroundBoatKite(scene, t) : aroundAll(scene, t);
    }));
  }

  /* ==== what you now know ==========================================================
     The shared recap, one card per chapter, lit as it is said. Two cards move
     inside as well, so each idea the voice names changes something: the Pull
     hand joins the Push hand on "A pull", and the stone is dropped in on
     "test them". No card has a sub line: recapKind draws it at lab small, under
     the brief's lab mid, and the band already says the sentence. */
  function recapCue(k, name) {
    for (var q = 0; q < F.scenes.length; q++) if (F.scenes[q].id === "recap") return sc(F.scenes[q], k, name);
    return null;
  }
  var sceneRecap = MK.recapKind([
    { beat: 0, at: "push", title: "Push and pull",
      pic: function (cx, cy, size, t) {
        var pull = recapCue(0, "pull"), pl = on(t, pull, 0.35), bx = cx + size * 0.5;
        return Em(cx - size * 0.5, cy, size * 0.9, "\u{1F449}") +
          G(Em(bx, cy, size * 0.9, "\u{1F448}"), { opacity: 0.3 + 0.7 * pl, transform: around(bx, cy, 1 + 0.3 * bump(t, pull, 0.7)) });
      } },
    { beat: 1, at: "bigger", title: "A bigger push",
      pic: function (cx, cy, size) { return ART.place(trackSvg(9, "It rolled 9 steps"), cx - size * 0.8, cy - size * 0.6, size * 1.6, size * 1.2); } },
    { beat: 1, at: "stop", title: "Start, stop, turn",
      pic: function (cx, cy, size) { return football(cx - size * 0.42, cy, size * 0.8, 0) + Em(cx + size * 0.42, cy, size * 0.8, HAND); } },
    { beat: 2, at: "float", title: "Float or sink",
      pic: function (cx, cy, size, t) {
        /* the apple floats; the stone waits beside the water until "test them",
           then goes in and sinks */
        var test = recapCue(2, "test"), d = test == null ? -1 : t - test, sx, sy;
        if (d <= 0) { sx = cx + size * 1.08; sy = cy - size * 0.54; }
        else if (d < 0.25) { sx = lerp(cx + size * 1.08, cx + size * 0.24, ease(d / 0.25)); sy = lerp(cy - size * 0.54, cy - size * 0.42, ease(d / 0.25)); }
        else { sx = cx + size * 0.24; sy = lerp(cy - size * 0.42, cy + size * 0.26, glide((d - 0.25) / 0.6)); }
        return R(cx - size * 1.08, cy - size * 0.42, size * 1.72, size * 0.92, 10, "#7FC4EA", null, null, { opacity: 0.85 }) +
          MK.pic(cx - size * 0.54, cy - size * 0.3, size * 0.5, APPLE) + MK.pic(sx, sy, size * 0.46, STONE);
      } },
    { beat: 3, at: "around", title: "All around you", pic: "\u{1F6B2}" }
  ], { goBeat: 3, goAt: "go" });

  var KINDS = {
    title: sceneTitle, pushpull: scenePushPull, bigger: sceneBigger, stopturn: sceneStopTurn,
    float: sceneFloat, around: sceneAround, recap: sceneRecap
  };
