
  /* ==== Pushes, Pulls and Floating, part 2 of 3 =================================
     "A bigger push" and "Stop it, turn it". Same scope as part 1. */

  /* ==== chapter: a bigger push ===================================================
     The lesson's own track (ART.sim "pushBall": the child, the ball and eleven
     marks, 0 to 10), exactly as the experiment step draws it. The film counts
     along it: the marks light as they are counted, a gold bar grows over the
     distance rolled, and the step count sits over the ball. The gentle push
     rolls it 3 steps and the hard push 9, the sim's own numbers.

     The drawing is placed whole, and one thing in its markup changes: the ball
     (the one <text> at font-size 44) turns as it rolls, and loses the CSS
     transition the lesson gives it, since a film moves nothing by itself. The
     label is the sim's own ("steps along the track", then "It rolled 3 steps"),
     blank while the ball rolls, as the sim leaves it. */
  var TRACK_BALL = 'font-size="44" style="transition: x 900ms ease-out"';
  function trackSvg(pos, label) {
    var m = ART.sim("pushBall", "draw", pos, label);
    var k = m.indexOf(TRACK_BALL);
    if (k < 0) throw new Error("pushes-pulls-and-floating: the lesson's pushBall no longer draws its ball as the film expects (" + TRACK_BALL + ")");
    /* the ball's centre is 15 px above its baseline (y 176) */
    return m.slice(0, k) + 'font-size="44" transform="rotate(' + n2(rollSpin(pos * 26, 44)) + " " + n2(30 + pos * 26) + ' 161)"' +
      m.slice(k + TRACK_BALL.length);
  }
  /* where the track sits in the chapter, and a point of the lesson's 320 x 240 in it */
  function trackBox(x, y, w) { return { x: x, y: y, w: w, h: w * 0.75, s: w / 320 }; }
  function tx(b, lx) { return b.x + lx * b.s; }
  function ty(b, ly) { return b.y + ly * b.s; }
  var markX = function (n) { return 30 + n * 26; };

  /* the lesson's track, and the film's counting on it. o: {pos, label, lit (how
     many marks are counted, fractional while one lights), bar (steps under the
     gold bar), badge ({n, p, pulse}), push ({u, big, word, pulse}),
     sweep, glowBall, glowFloor, flashLine, far} */
  function countedTrack(b, o) {
    var out = ART.place(trackSvg(o.pos, o.label), b.x, b.y, b.w, b.h), s = b.s;
    if (o.flashLine > 0) out += R(tx(b, 20), ty(b, 194), 280 * s, 8 * s, 2, P.gold, null, null, { opacity: o.flashLine });
    if (o.bar > 0) out += R(tx(b, 30), ty(b, 193.5), o.bar * 26 * s, 9 * s, 3 * s, P.gold);
    if (o.barGlow > 0) out += R(tx(b, 30) - 5, ty(b, 188), o.bar * 26 * s + 10, 20 * s, 9 * s, P.gold, null, null, { opacity: 0.5 * o.barGlow });
    for (var n = 0; n <= 10; n++) {
      var lit = n === 0 ? 0 : clamp(o.lit - n + 1, 0, 1), sw = o.sweep ? o.sweep(n) : 0, v = Math.max(lit, sw);
      if (v <= 0) continue;
      out += G(C(tx(b, markX(n)), ty(b, 224), 10 * s, P.gold) +
        Tx(tx(b, markX(n)), ty(b, 228), String(n), "lab", "middle", { fill: "#142B3E", "font-size": 11 * s }), { opacity: v });
    }
    if (o.far > 0) out += MK.arrow(tx(b, markX(0)), ty(b, 186), tx(b, markX(10)), ty(b, 186), o.far, P.gold, 4 * s);
    var bx = tx(b, markX(o.pos)), by = ty(b, 161);
    if (o.glowBall > 0) out += C(bx, by, 27 * s, "none", P.gold, 3 * s, { opacity: o.glowBall });
    if (o.glowFloor > 0) out += R(b.x + 3, ty(b, 181), b.w - 6, 58 * s, 6, "none", P.gold, 4, { opacity: o.glowFloor });
    if (o.push && o.push.u > 0) {
      /* a pulse (0-1) lights the arrow as the push is named again */
      var len = o.push.big ? 116 : 52, pulse = clamp(o.push.pulse || 0, 0, 1);
      out += MK.glow(tx(b, 10 + len / 2), ty(b, 88), (len / 2 + 14) * s, PUSH, pulse * 2.4) +
        MK.arrow(tx(b, 10), ty(b, 88), tx(b, 10 + len), ty(b, 88), o.push.u, PUSH, (o.push.big ? 11 : 5) * s * (1 + 0.6 * pulse)) +
        Tx(tx(b, 12), ty(b, 66), o.push.word, "lab big gold", "start", { opacity: o.push.u });
    }
    if (o.badge && o.badge.p > 0) {
      var cx = tx(b, markX(o.badge.n)), cy = ty(b, 112), k = 1 + 0.25 * (o.badge.pulse || 0);
      out += MK.pop(C(cx, cy, 30 * k, P.gold) + Tx(cx, cy + 12 * k, String(o.badge.n), "lab big", "middle", { fill: "#142B3E", "font-size": 34 * k }), cx, cy, o.badge.p);
    }
    return out;
  }

  function sceneBigger(scene, beat, t, i) {
    var b0 = scene.first, k = i - b0;
    /* one track, centred, then two side by side for the hard push */
    var u = k >= 2 ? ease(into(t, b0 + 2)) : 0;
    var A = trackBox(lerp(304, 18, u), lerp(10, 30, u), lerp(560, 506, u)), B = trackBox(lerp(660, 644, u), 30, 506);

    var trackAt = sc(scene, 0, "track"), stepsAt = sc(scene, 0, "steps"), measureAt = sc(scene, 0, "measure");
    var gently = sc(scene, 1, "gently"), threeAt = sc(scene, 1, "three");
    var counted = ["one", "two", "three"].map(function (c) { return sc(scene, 1, c); });
    var hard = sc(scene, 2, "hard"), nineAt = sc(scene, 2, "nine");
    var sameBall = sc(scene, 3, "ball"), sameFloor = sc(scene, 3, "floor"), thePush = sc(scene, 3, "push");
    var bigPush = sc(scene, 4, "push"), bigMove = sc(scene, 4, "move"), three2 = sc(scene, 4, "three"), nine2 = sc(scene, 4, "nine");

    /* the gentle push: the ball leaves just after "Push it gently" and has
       stopped at 3 before the counting starts */
    var gGo = gently == null ? null : gently + 0.3;
    var gPos = gGo == null ? 0 : 3 * glide((t - gGo) / 1.3);
    var lit = 0;
    counted.forEach(function (c) { lit += on(t, c, 0.3); });
    var gLabel = gGo == null || t < gGo ? "steps along the track" : threeAt != null && t >= threeAt ? "It rolled 3 steps" : "";
    var together = bump(t, bigMove, 1.2);
    var gentle = countedTrack(A, {
      pos: gPos, label: gLabel, lit: lit, bar: lit, barGlow: together,
      sweep: stepsAt == null ? null : function (n) { return bump(t, stepsAt + n * 0.12, 0.7); },
      flashLine: bump(t, trackAt, 1.1), far: on(t, measureAt, 0.9) * (1 - on(t, gently, 0.4)),
      glowBall: bump(t, sameBall, 1.4), glowFloor: bump(t, sameFloor, 1.4),
      push: { u: on(t, gently, 0.35), big: false, word: "gentle push", pulse: bump(t, thePush, 1.4) },
      badge: { n: 3, p: popIn(t, threeAt, 0.4), pulse: bump(t, three2, 0.7) + together }
    });

    var out = gentle;
    if (u > 0) {
      var hGo = hard == null ? null : hard + 0.3;
      var hPos = hGo == null ? 0 : 9 * glide((t - hGo) / 1.8);
      var hLabel = hGo == null || t < hGo ? "steps along the track" : nineAt != null && t >= nineAt ? "It rolled 9 steps" : "";
      out += G(countedTrack(B, {
        pos: hPos, label: hLabel, lit: Math.floor(hPos + 1e-6), bar: hPos, barGlow: together,
        glowBall: bump(t, sameBall, 1.4), glowFloor: bump(t, sameFloor, 1.4),
        push: { u: on(t, hard, 0.35), big: true, word: "hard push", pulse: bump(t, thePush, 1.4) + bump(t, bigPush, 1.4) },
        badge: { n: 9, p: popIn(t, nineAt, 0.4), pulse: bump(t, nine2, 0.7) + together }
      }), { opacity: u });
    }
    return svg(out);
  }

  /* ==== chapter: stop it, turn it ================================================
     The ball seen from above, on a floor, so that a turn can be seen. It stays
     still until a push starts it; it rolls along into a hand that pushes back,
     and stops as "The ball stops" is said; a second ball is tapped on the side
     and goes a new way, its path bent where the finger touched it. Then the
     three jobs side by side, as the last line names them. */
  var FLOOR = { x: 16, y: 10, w: 1136, h: 420 }, TOP = 84;
  function floorFromAbove(o) {
    if (!(o > 0)) return "";
    var s = R(FLOOR.x, FLOOR.y, FLOOR.w, FLOOR.h, 26, "#15324A", P.line, 2);
    for (var k = 1; k < 7; k++) s += L(FLOOR.x + 16, FLOOR.y + k * 60, FLOOR.x + FLOOR.w - 16, FLOOR.y + k * 60, P.line, 2, { opacity: 0.6 });
    return G(s, { opacity: o });
  }

  /* the first ball: still, pushed, rolling, stopped by the hand */
  function stopRun(scene, t) {
    var b0 = scene.first, Y = 228, X0 = 230, HX = 920, XS = HX - 48 - 38;
    var stillAt = cue(b0, "still"), roundAt = cue(b0, "round"), notAt = cue(b0, "not");
    var pushAt = cue(b0 + 1, "push"), rollAt = cue(b0 + 1, "rolling");
    var handAt = cue(b0 + 2, "hand"), backAt = cue(b0 + 2, "back"), stopAt = cue(b0 + 2, "stops");
    var go = pushAt == null ? null : pushAt + 0.25, bx = X0, moving = false;
    if (go != null && stopAt != null && t > go) {
      /* a quick start, then steady, meeting the hand exactly at "The ball stops" */
      var a = 0.12, v = clamp((t - go) / Math.max(1, stopAt - go), 0, 1);
      var f = v < a ? (v * v / (2 * a)) / (1 - a / 2) : (v - a / 2) / (1 - a / 2);
      bx = lerp(X0, XS, f) - 12 * bump(t, stopAt, 0.45);
      moving = t < stopAt;
    }
    var out = "";
    if (bx > X0 + 1) out += L(X0, Y, bx - 40, Y, P.muted, 4, { "stroke-dasharray": "3 12", opacity: 0.8 });
    var noMove = on(t, notAt, 0.4) * (1 - on(t, pushAt, 0.3));
    if (noMove > 0) out += G(Pth("M" + (X0 + 64) + "," + Y + " L" + (X0 + 300) + "," + Y, null, P.muted, 5, { "stroke-dasharray": "14 12" }) +
      Pth("M" + (X0 + 286) + "," + (Y - 14) + " L" + (X0 + 304) + "," + Y + " L" + (X0 + 286) + "," + (Y + 14), null, P.muted, 5), { opacity: noMove }) +
      MK.cross(X0 + 184, Y, 30, popIn(t, notAt == null ? null : notAt + 0.3, 0.35) * (1 - on(t, pushAt, 0.3)));
    out += MK.pill(X0, Y + 88, "stays still", on(t, stillAt, 0.4) * (1 - on(t, pushAt, 0.3)), { size: 24 });
    out += C(X0, Y, 50, "none", P.gold, 4, { opacity: bump(t, roundAt, 1.3) });
    out += G(MK.arrow(X0 - 196, Y, X0 - 54, Y, on(t, pushAt, 0.35), PUSH, 11), { opacity: 1 - on(t, rollAt, 0.6) });
    out += MK.ripple(X0 - 42, Y, t, go, PUSH);
    if (moving && rollAt != null && t > rollAt) {
      for (var j = 0; j < 3; j++) out += L(bx - 64 - j * 10, Y - 22 + j * 22, bx - 104 - j * 10, Y - 22 + j * 22, P.ink, 4, { opacity: 0.55 * on(t, rollAt, 0.4) });
    }
    var hp = popIn(t, handAt, 0.4);
    if (hp > 0) out += MK.pop(Em(HX, Y, 104, HAND), HX, Y, hp);
    out += MK.arrow(HX - 30, Y - 92, HX - 170, Y - 92, on(t, backAt, 0.5), PUSH, 10);
    out += MK.ripple(XS + 40, Y, t, stopAt, PUSH);
    out += MK.pill(XS - 20, Y + 88, "stops", on(t, stopAt, 0.4), { size: 24 });
    return out + football(bx, Y, TOP, rollSpin(bx - X0, TOP));
  }

  /* the second ball: rolling, tapped from the side, away a new way */
  function turnRun(scene, t) {
    var bi = scene.first + 3, Y = 318, X0 = 120, TXP = 520, DIR = [0.866, -0.5];
    var sideAt = cue(bi, "side"), turnAt = cue(bi, "turns"), wayAt = cue(bi, "way");
    var t0 = BEATS[bi].start - GAP, tap = sideAt == null ? t0 + 1.6 : sideAt + 0.35;
    var v = (TXP - X0) / Math.max(0.8, tap - t0), bx, by, d;
    if (t <= tap) { bx = X0 + v * Math.max(0, t - t0); by = Y; d = bx - X0; }
    else {
      var s2 = Math.min(470, 0.85 * v * (t - tap));
      bx = TXP + DIR[0] * s2; by = Y + DIR[1] * s2; d = TXP - X0 + s2;
    }
    var out = Pth("M" + X0 + "," + Y + " L" + n2(Math.min(bx, TXP)) + "," + Y + (t > tap ? " L" + n2(bx) + "," + n2(by) : ""), null, P.muted, 4,
      { "stroke-dasharray": "3 12", opacity: 0.8 });
    /* the finger comes up from the side, taps, and goes */
    var fin = ease((t - (tap - 0.5)) / 0.5) * (1 - ease((t - tap - 0.2) / 0.5));
    if (fin > 0) out += MK.finger(TXP, lerp(Y + 66, Y + 42, fin), Math.min(1, fin * 1.6)) + MK.arrow(TXP - 52, Y + 96, TXP - 52, Y + 50, fin, PUSH, 7);
    out += MK.ripple(TXP, Y + 40, t, tap, PUSH);
    var ta = on(t, turnAt, 0.5);
    if (ta > 0) out += MK.arrow(TXP + 30, Y - 36, TXP + 30 + DIR[0] * 150, Y - 36 + DIR[1] * 150, ta, P.gold, 8);
    out += MK.pill(TXP + 300, Y - 68, "a new way", on(t, wayAt, 0.4), { size: 24 });
    return out + football(bx, by, TOP, rollSpin(d, TOP));
  }

  function sceneStopTurn(scene, beat, t, i) {
    var b0 = scene.first, last = b0 + 4;
    var fo = i < last ? 1 : 1 - into(t, last);
    var jobs = function (n) {
      if (n === 0) return stopRun(scene, t);
      if (n === 1) return turnRun(scene, t);
      var out = "";
      /* [the job drawn, its word, the cue that names it, where] */
      [["move", "start", "starts", 90], ["stop", "stop", "stop", 438], ["turn", "turn", "turn", 786]].forEach(function (j) {
        var at = sc(scene, 4, j[2]), p = popIn(t, at, 0.4);
        if (p <= 0) return;
        out += G(forceJob(j[0], j[1], t, at), { opacity: Math.min(1, p), transform: tr(j[3], 40, 1.4) + " " + around(104, 116, 0.92 + 0.08 * Math.min(p, 1.05)) });
      });
      return out;
    };
    return svg(floorFromAbove(fo) + phased(t, i, scene, [0, 3, 4], jobs));
  }
