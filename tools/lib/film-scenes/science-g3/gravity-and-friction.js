
  /* ==== Grade 3 Science, Lesson 9: Gravity and Friction =========================
     tools/lib/film-scenes/science-g3/gravity-and-friction.js, with -2.js and
     -3.js: the film's pictures, after the shared marks (MK) and before the
     engine's tail, all in one scope. The storyboard is
     science/grade-3-app/lecture-video/gravity-and-friction.json.

     The lesson's own drawings do the teaching, so the child sees here what they
     use two steps later: the forcemeter with the apple, the shoe and the big
     book (ART.kit.forcemeterSvg, the drawing SIMS.forcemeter hangs things on),
     the child on the Earth with the arrow to the centre (ART.scene "gravity",
     the demo's two frames), and the block pushed across a surface
     (ART.sim("friction", "draw", surface, x), the drawing its Push buttons
     move). The table and the bar chart of the last chapter are the lesson's
     own numbers - ice 9, wood 6, carpet 2 - drawn here.

     This file: the palette, the helpers, the title motif and the chapter
     "Measuring a force". Every top-level name starts with gf, so nothing here
     can replace a name of the engine, ART or MK. */

  var HUE = {
    title: P.teal, force: P.gold, gravity: P.blue, friction: P.accent,
    surfaces: P.good, chart: P.plum, recap: P.teal
  };

  /* ---- timing ---------------------------------------------------------------- */

  /* a cue, moved d seconds on, and still null when the beat names no such cue */
  function gfAt(c, d) { return c == null ? null : c + d; }
  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 does:
     for a thing that belongs to that beat alone (rule 7) */
  function gfOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function gfFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }
  /* a push that slows to a stop: fast at first, nothing at the end */
  function gfSlide(t, from, until) {
    if (from == null || until == null || until <= from) return 0;
    var u = clamp((t - from) / (until - from), 0, 1);
    return 1 - (1 - u) * (1 - u);
  }
  /* the forcemeter's scale is whole newtons; a reading between two of them is
     printed to one decimal, so the spring can stretch without the number
     turning into 1.3733333 N */
  function gfNewtons(v) { return Math.round(v * 10) / 10; }

  /* ---- marks of the film's own ------------------------------------------------ */

  /* the rub between two surfaces: a gold zigzag along the line they touch,
     x0 to x1 at y, `shift` px along (so it can be made to rub) */
  function gfRub(x0, x1, y, o, shift, col) {
    if (!(o > 0)) return "";
    var w = 11, d = "M" + n2(x0 + (shift || 0)) + "," + n2(y), k = 0;
    for (var x = x0; x < x1; x += w) {
      k++;
      d += " L" + n2(Math.min(x + w / 2, x1) + (shift || 0)) + "," + n2(y - (k % 2 ? 8 : 0));
      d += " L" + n2(Math.min(x + w, x1) + (shift || 0)) + "," + n2(y);
    }
    return Pth(d, null, col || P.gold, 4, { opacity: clamp(o, 0, 1) });
  }
  /* a word in a pill with a line from it to the thing it names. The line
     leaves the pill's EDGE: MK.leader puts a dot at its start, and from the
     middle that dot sat inside the word for as long as the line was still
     growing - a red spot through "gravity" on the ball-drop beat. */
  function gfLabel(t, x, y, text, at, to, size, col, anchor) {
    var o = on(t, at, 0.4);
    if (o <= 0) return "";
    var c = col || P.gold, sz = size || 26, a = anchor || "middle";
    var w = String(text).length * sz * 0.56 + sz * 1.3, h = sz * 1.8;
    var left = a === "start" ? x : a === "end" ? x - w : x - w / 2;
    var fx = to[0] > left + w ? left + w + 4 : to[0] < left ? left - 4 : x;
    var fy = to[1] > y + h / 2 ? y + h / 2 + 4 : to[1] < y - h / 2 ? y - h / 2 - 4 : y;
    return MK.leader(fx, fy, to[0], to[1], on(t, at, 0.6), c) +
      MK.pill(x, y, text, o, { size: sz, anchor: a, col: c });
  }

  /* ==== the title ==============================================================
     The lesson's own Earth, with the child standing on it and the red arrow to
     the centre (ART.scene "gravity"), in a round window; and along the bottom
     of the window the red block of the lesson's friction sim, which slides in,
     slows and stops on a wooden floor. On the two cards both simply stand. */
  var GF_MOTIF = { x: 30, y: 30, w: 300, h: 281.25 };
  function gfMotifBlock(u, o, rub) {
    if (!(o > 0)) return "";
    var x = lerp(104, 188, clamp(u, 0, 1)), top = 296, floor = 326;
    return G(R(96, floor, 170, 9, 4, "#C9A26B") +
      R(x, top, 40, 30, 7, "#D9473F") +
      gfRub(x + 2, x + 38, floor, rub, 0, P.gold),
      { opacity: clamp(o, 0, 1) });
  }
  function titleMotif(o) {
    var t = o.t || 0, s0 = o.scene, out = "";
    var cGrav = s0 ? sc(s0, 0, "gravity") : null, cDown = s0 ? sc(s0, 0, "down") : null,
      cGround = s0 ? sc(s0, 0, "ground") : null, cFric = s0 ? sc(s0, 1, "friction") : null,
      cHard = s0 ? sc(s0, 1, "harder") : null;
    out += el("clipPath", { id: "gfMotifClip" }, C(180, 180, 172));
    out += C(180, 180, 172, "#0E2434");
    out += G(ART.place(ART.scene("gravity", 0), GF_MOTIF.x, GF_MOTIF.y, GF_MOTIF.w, GF_MOTIF.h) +
      gfMotifBlock(s0 ? on(t, gfAt(cFric, 0.2), 1.1) : 1, s0 ? on(t, cFric, 0.4) : 1,
        s0 ? bump(t, cHard, 1.4) : 0.9),
      { "clip-path": "url(#gfMotifClip)" });
    /* the pull: the lesson's red arrow lights, and the ground under the child glows */
    out += MK.glow(180, 132, 56, "#F0806F", s0 ? on(t, cGrav, 0.5) * (0.6 + 0.4 * breathe(t)) : 0);
    out += MK.glow(180, 152, 46, P.gold, s0 ? bump(t, cDown, 1.2) : 0);
    out += MK.glow(180, 96, 70, P.good, s0 ? on(t, cGround, 0.5) * 0.9 : 0);
    out += C(180, 180, 172, "none", P.line, 3);
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A child on the Earth with an arrow to the centre, and a block sliding to a stop">' + out + "</svg>";
  }

  /* ==== chapter: measuring a force ==============================================
     The lesson's own forcemeter (ART.kit.forcemeterSvg, the drawing its
     Forcemeter step hangs things on), whole, as a card on the left. The apple,
     the shoe and the big book go on its hook in turn and the spring stretches
     to 2, 3 and 5 newtons - the lesson's three readings - with the readings
     kept in a list on the right as they are taken. */
  var GF_M = { x: 45, y: 14, k: 0.98 };
  function gfMX(v) { return GF_M.x + v * GF_M.k; }
  function gfMY(v) { return GF_M.y + v * GF_M.k; }
  /* the forcemeter drawn at n newtons, with `pic` on its hook */
  function gfMeter(n, pic, label) {
    return R(GF_M.x - 10, GF_M.y - 10, 320 * GF_M.k + 20, 420 * GF_M.k + 20, 18, P.card, P.line, 2) +
      ART.place(ART.kit.forcemeterSvg(gfNewtons(n), pic, label), GF_M.x, GF_M.y, 320 * GF_M.k, 420 * GF_M.k);
  }
  /* where the hook and the hung thing sit at n newtons */
  function gfHookY(n) { return gfMY(200 + 24 * n); }
  function gfHungY(n) { return gfMY(250 + 24 * n); }

  /* the three readings, in the order the lesson hangs them */
  var GF_HUNG = [
    { pic: "\u{1F34E}", label: "an apple", n: 2 },
    { pic: "\u{1F45F}", label: "a shoe", n: 3 },
    { pic: "\u{1F4D5}", label: "a big book", n: 5 }
  ];
  var GF_ROW_Y = [112, 238, 364];

  function gfForceChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cMeter = c(0, "meter"), cSpring = c(0, "spring"), cHook = c(0, "hook");
    var cApple = c(1, "apple"), cPulls = c(1, "pulls"), cStretch = c(1, "stretch");
    var cScale = c(2, "scale"), cNewt = c(2, "newtons"), cTwo = c(2, "two");
    var cShoe = c(3, "shoe"), cThree = c(3, "three"), cBook = c(3, "book"), cFive = c(3, "five");
    var cHeavy = c(4, "heavier"), cHarder = c(4, "harder"), cFurther = c(4, "further");
    var cGrams = c(5, "grams"), cPull = c(5, "pull"), cGravity = c(5, "gravity");
    var out = "";

    /* the reading, and what is on the hook: 0 -> 2 as the apple is hung, then
       2 -> 3 for the shoe and 3 -> 5 for the book, each finishing inside its
       own line */
    var n = 0, which = -1;
    var a0 = gfAt(cPulls, 0.05), a1 = gfAt(cStretch, 0.85);
    if (cApple != null && t >= cApple) { which = 0; }
    if (a0 != null && a1 != null) n = 2 * ease((t - a0) / (a1 - a0));
    if (cShoe != null && t >= cShoe) { which = 1; n = lerp(2, 3, ease((t - cShoe - 0.15) / 0.6)); }
    if (cBook != null && t >= cBook) { which = 2; n = lerp(3, 5, ease((t - cBook - 0.15) / 0.75)); }
    if (cHeavy != null && t >= cHeavy) { which = 2; n = 5; }
    var hung = which < 0 ? null : GF_HUNG[which];
    out += gfMeter(n, hung ? hung.pic : "", hung ? hung.label : "");

    /* beat 1: the whole meter, then the spring and the hook, one at a time */
    var one = gfOnly(t, scene, 0);
    if (one > 0) {
      var mo = bump(t, cMeter, 1.3) * one;
      out += R(GF_M.x - 10, GF_M.y - 10, 320 * GF_M.k + 20, 420 * GF_M.k + 20, 18, "none", P.gold, 5, { opacity: mo });
      var so = on(t, cSpring, 0.4) * one;
      out += R(gfMX(134), gfMY(20), 24 * GF_M.k, 138 * GF_M.k, 8, "none", P.gold, 4, { opacity: so });
      out += gfLabel(t, 520, 96, "spring", cSpring, [gfMX(152), gfMY(44)], 28, P.gold, "middle");
      var ho = on(t, cHook, 0.4) * one;
      out += C(gfMX(160), gfHookY(0) + 8, 26, "none", P.gold, 4, { opacity: ho });
      out += gfLabel(t, 520, 246, "hook", cHook, [gfMX(174), gfHookY(0) + 8], 28, P.gold, "middle");
    }

    /* beat 2: gravity pulls the apple down, and the spring stretches */
    var two = gfOnly(t, scene, 1);
    if (two > 0) {
      var pu = on(t, cPulls, 0.45) * two;
      out += MK.arrow(gfMX(232), gfHungY(n) - 40, gfMX(232), gfHungY(n) + 46, pu, "#D9473F", 8);
      /* how far the spring has stretched, measured beside it */
      var st = on(t, cStretch, 0.5) * two, top = gfMY(30), now = gfMY(30 + 24 * n);
      if (st > 0) {
        out += L(gfMX(90), top, gfMX(122), top, P.gold, 3, { opacity: st, "stroke-dasharray": "8 6" });
        out += L(gfMX(90), now, gfMX(122), now, P.gold, 3, { opacity: st, "stroke-dasharray": "8 6" });
        out += MK.arrow(gfMX(100), top, gfMX(100), now, st, P.gold, 5);
      }
    }

    /* beat 3: the scale, in newtons, reading two */
    var three = gfOnly(t, scene, 2);
    if (three > 0) {
      out += R(gfMX(152), gfMY(20), 48 * GF_M.k, 140 * GF_M.k, 8, "none", P.gold, 4,
        { opacity: on(t, cScale, 0.4) * three * (1 - on(t, cTwo, 0.4)), "stroke-dasharray": "12 8" });
      out += gfLabel(t, 520, 76, "the scale", cScale, [gfMX(178), gfMY(40)], 28, P.gold, "middle");
      out += gfLabel(t, 520, 196, "newtons", cNewt, [gfMX(178), gfMY(112)], 28, P.gold, "middle");
      var tw = popIn(t, cTwo, 0.4) * three;
      /* the meter's own "2 N", the 2 N row of its scale ringed, and the apple's
         row card filled in - a pill saying "2 newtons" as well made three
         copies of one reading on one frame */
      out += R(gfMX(124), gfMY(66), 90 * GF_M.k, 24 * GF_M.k, 6, "none", P.gold, 5, { opacity: Math.min(1, tw) });
    }

    /* The three things the lesson hangs, waiting in a row from the chapter's
       first line, each with a dash where its reading will go; the newtons are
       filled in as that thing is hung. Drawn empty from the start because the
       right two thirds of the box were otherwise blank for three whole beats,
       and because a row of three waiting things is what the lesson's own step
       puts in front of the child. */
    var at = [cTwo, cThree, cFive];
    var rows = gfFrom(t, scene, 0);
    for (var k = 0; k < 3; k++) {
      var p = popIn(t, at[k], 0.4), got = Math.min(1, p);
      var y = GF_ROW_Y[k], lit = which === k;
      out += G(R(740, y - 46, 392, 92, 18, lit ? "#1B3A52" : P.card, lit ? P.gold : P.line, lit ? 3 : 2) +
        MK.pic(800, y, 58, GF_HUNG[k].pic) +
        (got > 0 ? Tx(866, y + 14, GF_HUNG[k].n + " N", "lab huge gold", "start")
                 : Tx(872, y + 14, "?", "lab huge muted", "start")) +
        Tx(1108, y + 10, GF_HUNG[k].label, "lab mid muted", "end"),
        { opacity: rows * (0.42 + 0.58 * got), transform: around(936, y, got > 0 ? Math.min(p, 1.08) : 1) });
    }

    /* beat 5: heavier, so gravity pulls harder, so the spring stretches further */
    var five = gfOnly(t, scene, 4);
    if (five > 0) {
      var hv = on(t, cHeavy, 0.6) * five;
      out += MK.arrow(706, 92, 706, 384, hv, P.gold, 7);
      out += MK.pill(600, 68, "heavier", on(t, cHeavy, 0.4) * five, { size: 24, col: P.gold });
      var hd = on(t, cHarder, 0.5) * five;
      /* the bottom end stops at +15 rather than the card's own +40/+38: any
         further and the arrowhead lands on the forcemeter drawing's own
         baked-in "gravity pulls down" caption in the card's bottom-right
         corner, hiding its first two letters for the whole of this beat and
         the next (review, 2026-09-23; re-measured against a rendered frame). */
      out += MK.arrow(gfMX(240), gfHungY(5) - 50, gfMX(240), gfHungY(5) + 15, hd, "#D9473F", 9);
      var fu = on(t, cFurther, 0.5) * five;
      out += MK.arrow(gfMX(100), gfMY(30), gfMX(100), gfMY(150), fu, P.gold, 6);
      out += L(gfMX(90), gfMY(150), gfMX(122), gfMY(150), P.gold, 3, { opacity: fu, "stroke-dasharray": "8 6" });
    }

    /* beat 6: not grams. The pull, in newtons. The pull is gravity. */
    var six = gfOnly(t, scene, 5);
    if (six > 0) {
      var go = popIn(t, cGrams, 0.4) * six;
      out += MK.pop(MK.pill(546, 96, "grams", 1, { size: 30, col: P.bad, ink: P.muted }), 546, 96, go);
      out += MK.cross(680, 96, 30, go);
      var po = popIn(t, cPull, 0.4) * six;
      out += MK.pop(MK.pill(546, 226, "newtons", 1, { size: 30, col: P.good }), 546, 226, po);
      out += MK.tick(680, 226, 30, po);
      var gr = on(t, cGravity, 0.5) * six;
      /* same shortened bottom end as the "five" block above, and for the same
         reason: it would otherwise sit on the card's own caption. */
      out += MK.arrow(gfMX(232), gfHungY(5) - 46, gfMX(232), gfHungY(5) + 15, gr, "#D9473F", 9);
      out += gfLabel(t, 560, 366, "gravity", cGravity, [gfMX(248), gfHungY(5)], 30, "#F0806F", "middle");
    }
    return svg(out);
  }
