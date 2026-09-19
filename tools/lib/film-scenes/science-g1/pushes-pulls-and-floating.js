
  /* ==== Grade 1 Science, Lesson 5: Pushes, Pulls and Floating ================
     tools/lib/film-scenes/science-g1/pushes-pulls-and-floating.js, part 1 of 3
     (-2.js and -3.js follow it in the same scope). The storyboard is
     science/grade-1-app/lecture-video/pushes-pulls-and-floating.json, and the
     BRIEF.md beside it says how a film is made.

     One chapter per part of LESSON["lecture"] in content/lesson-5.py. Where
     the lesson draws, the film draws the lesson's drawing: the ball on its
     track marked in steps (ART.sim "pushBall") and the tank things are dropped
     into (ART.tank). Where the lesson shows an emoji (the sort's Push and Pull
     bins, the doorbell, the drawer, the bicycle, trolley, boat and kite), the
     film shows that emoji. What must move in a way an emoji cannot (a drawer
     sliding out, pedals going round, a kite on its string) is drawn.

     One colour rule runs through the whole film: a PUSH arrow is gold and a
     PULL arrow is teal, from the first kick to the kite string.

     Part 1: the palette, the shared helpers, the title motif, and the chapter
     "Pushes and pulls". */

  var PUSH = P.gold, PULL = P.teal;

  var HUE = {
    title: P.teal, pushpull: P.gold, bigger: P.accent, stopturn: P.plum,
    float: P.blue, around: P.good, recap: P.teal
  };

  var BALL = "⚽", KID = "\u{1F9D2}", HAND = "✋";
  var APPLE = "\u{1F34E}", STONE = "\u{1FAA8}", LOG = "\u{1FAB5}", COIN = "\u{1FA99}";
  var DRAWER = "\u{1F5C4}️", BELL = "\u{1F6CE}️";

  /* a football of `size`, turned `spin` degrees about its own centre (the
     emoji is centred on its point, so it turns without wobbling) */
  function football(cx, cy, size, spin, extra) {
    return Em(cx, cy, size, BALL, Object.assign({ transform: "rotate(" + n2(spin || 0) + " " + n2(cx) + " " + n2(cy) + ")" }, extra || {}));
  }
  /* how far a ball of that size has turned, in degrees, after rolling d px */
  function rollSpin(d, size) { return d / (size * 0.45) * 57.2958; }
  /* 0 -> 1, fast and then slowing: a thing that was pushed once, coming to rest */
  function glide(u) { u = clamp(u, 0, 1); return 1 - (1 - u) * (1 - u); }
  /* 0 -> 1, slow and then fast: a thing falling */
  function fall(u) { u = clamp(u, 0, 1); return u * u; }

  /* A chapter whose picture changes only at some beats: `starts` lists the
     beat (k, in the chapter) each picture begins at, and draw(n) draws picture
     n. The old picture fades out as the new one fades in, in the pause before
     its beat; a picture that carries on across a beat is drawn once, so it
     never dips the way crossfading it with itself would. */
  function phased(t, i, scene, starts, draw) {
    var k = i - scene.first, n = 0;
    for (var q = 0; q < starts.length; q++) if (k >= starts[q]) n = q;
    var u = n > 0 && k === starts[n] ? into(t, i) : 1, out = "";
    if (u < 1) out += G(draw(n - 1), { opacity: 1 - u });
    return out + G(draw(n), { opacity: u });
  }

  /* one of the lesson's answer buttons, as its choice chips look: a picture and
     a word in a rounded box, lit when chosen */
  function choiceChip(x, y, w, h, pic, word, o, lit) {
    if (!(o > 0)) return "";
    return G(R(x, y, w, h, 18, lit ? "#1B3A52" : P.card, lit ? P.gold : P.line, lit ? 4 : 2) +
      MK.pic(x + 46, y + h / 2, h * 0.56, pic) + Tx(x + 88, y + h / 2 + 11, word, "lab big", "start"), { opacity: o });
  }

  /* ==== the title ==============================================================
     The lesson in one picture: a ball pushed away along the floor and pulled
     back on a string, over the tank with an apple floating and a stone at the
     bottom. In the spoken title each happens as it is said; behind the cards it
     stands still, the push made and both drops done. */
  function titleMotif(o) {
    var t = o.t || 0, s = o.spoken ? o.scene : null;
    var pushAt = s ? sc(s, 0, "push") : null, pullAt = s ? sc(s, 0, "pull") : null;
    var waterAt = s ? sc(s, 1, "water") : null, floatAt = s ? sc(s, 1, "float") : null, sinkAt = s ? sc(s, 1, "sink") : null;
    var X0 = 118, X1 = 262, X2 = 184, BY = 118, BS = 62;
    var bx = X1, pushO = 1, pullO = 0;
    if (s) {
      var a = pushAt == null ? 0 : glide((t - pushAt - 0.15) / 0.9);
      var b = pullAt == null ? 0 : ease((t - pullAt - 0.1) / 0.9);
      bx = lerp(lerp(X0, X1, a), X2, b);
      pushO = on(t, pushAt, 0.35) * (1 - on(t, pullAt, 0.3));
      pullO = on(t, pullAt, 0.35);
    }
    var out = L(18, 150, 342, 150, P.line, 4);
    out += G(MK.arrow(20, BY, X0 - 40, BY, 1, PUSH, 9), { opacity: pushO });
    if (pullO > 0) out += G(L(22, BY, bx - 28, BY, P.paper, 3) + MK.arrow(bx - 6, BY - 46, bx - 92, BY - 46, 1, PULL, 8), { opacity: pullO });
    out += football(bx, BY, BS, rollSpin(bx - X0, BS));

    /* the tank: water as the lesson's (#7FC4EA), with an outline for the dark stage */
    var TX = 40, TY = 196, TW = 280, TH = 146;
    var appleY = TY + 12, stoneY = TY + TH - 28, appleO = 1, stoneO = 1;
    if (s) {
      appleO = popIn(t, floatAt, 0.3); stoneO = popIn(t, sinkAt, 0.3);
      appleY = floatAt == null ? TY - 50 : lerp(TY - 50, TY + 12, fall((t - floatAt - 0.2) / 0.6));
      stoneY = sinkAt == null ? TY - 50 : t < sinkAt + 0.55 ? lerp(TY - 50, TY + 6, fall((t - sinkAt - 0.15) / 0.4)) :
        lerp(TY + 6, TY + TH - 28, glide((t - sinkAt - 0.55) / 0.5));
    }
    var bob = 2.5 * Math.sin(t * 2.2);
    /* behind a card the water is fainter, so it does not sit as a pale box under the card's words */
    out += R(TX, TY, TW, TH, 14, "#7FC4EA", null, null, { opacity: s ? 0.85 : 0.4 });
    out += L(TX + 16, TY + 3, TX + TW - 16, TY + 3, "#FFFFFF", 4, { opacity: 0.25 + 0.6 * bump(t, waterAt, 1.2) });
    if (appleO > 0) out += MK.pic(122, appleY + (appleY >= TY + 12 ? bob : 0), 56, APPLE, { opacity: Math.min(1, appleO) });
    if (stoneO > 0) out += MK.pic(238, stoneY, 50, STONE, { opacity: Math.min(1, stoneO) });
    out += R(TX, TY, TW, TH, 14, "none", P.muted, 4);
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A ball pushed and pulled, and a tank of water with an apple floating and a stone at the bottom">' + out + "</svg>";
  }

  var sceneTitle = MK.titleKind({ sub: ["Pushes and pulls are forces.", "A bigger push makes a bigger move.", "Some things float, some things sink."] });

  /* ==== chapter: pushes and pulls ===============================================
     The lesson's own sort, Push 👉 and Pull 👈, fills as each example is named,
     and the stage beside it acts the example out: a ball kicked away from you,
     a drawer pulled towards you, a doorbell pushed with one gentle tap. Then the
     two bins are named forces, and a force's three jobs appear. */
  var BIN_X = 742, BIN_W = 412, BIN_H = 196;
  var BINS = [
    { y: 14, pic: "\u{1F449}", word: "Push", col: PUSH, k: 0, at: "push" },
    { y: 230, pic: "\u{1F448}", word: "Pull", col: PULL, k: 1, at: "pull" }
  ];
  /* the three examples the chapter sorts, as the lesson's sort pictures them */
  var SORTED = [
    { bin: 0, slot: 0, pic: BALL, k: 0, at: "kick" },
    { bin: 1, slot: 0, pic: DRAWER, k: 1, at: "drawer" },
    { bin: 0, slot: 1, pic: BELL, k: 2, at: "still" }
  ];

  function pushPullBins(scene, t) {
    var out = "", forces = sc(scene, 3, "forces"), fo = on(t, forces, 0.5);
    BINS.forEach(function (b) {
      var p = popIn(t, sc(scene, b.k, b.at), 0.4);
      if (p <= 0) return;
      var card = R(BIN_X, b.y, BIN_W, BIN_H, 22, P.card, b.col, 2 + 2 * fo) +
        Em(BIN_X + 62, b.y + 62, 64, b.pic) + Tx(BIN_X + 112, b.y + 78, b.word, "lab huge", "start", { fill: b.col });
      out += G(card, { transform: around(BIN_X + BIN_W / 2, b.y + BIN_H / 2, 0.9 + 0.1 * Math.min(p, 1.08)), opacity: Math.min(1, p) });
    });
    SORTED.forEach(function (it) {
      var at = sc(scene, it.k, it.at), p = popIn(t, at, 0.45);
      if (p <= 0) return;
      var cx = BIN_X + 70 + it.slot * 116, cy = BINS[it.bin].y + 146;
      out += MK.glow(cx, cy, 58, BINS[it.bin].col, bump(t, at, 1.2)) + MK.pop(Em(cx, cy, 62, it.pic), cx, cy, p);
    });
    /* "Pushes and pulls are forces": one bracket takes both bins */
    if (fo > 0) {
      out += Pth("M732,20 Q716,20 716,38 L716,402 Q716,420 732,420", null, P.gold, 5, { opacity: fo }) +
        MK.arrow(392, 78, 700, 78, fo, P.gold, 7);
    }
    return out;
  }

  /* the floor and "you", for the kick and the drawer */
  var FLOOR_Y = 332, YOU_X = 112;
  function youOnFloor(o) {
    if (!(o > 0)) return "";
    return G(L(28, FLOOR_Y, 690, FLOOR_Y, P.line, 4) + Em(YOU_X, FLOOR_Y - 50, 96, KID) +
      Tx(YOU_X, FLOOR_Y + 44, "you", "lab mid muted", "middle"), { opacity: o });
  }

  /* a chest of drawers seen from the side, its drawers facing you; the top
     drawer slides out towards you by `out` px */
  function drawers(out) {
    var X = 470, Y = 146, W = 176, H = FLOOR_Y - 146, wood = "#A56B36", dark = "#5E3A1A";
    var s = R(X, Y, W, H, 8, "#8B5A2B", dark, 3) + L(X, Y + 62, X + W, Y + 62, dark, 3) + L(X, Y + 124, X + W, Y + 124, dark, 3) +
      C(X - 6, Y + 93, 7, P.gold, dark, 2) + C(X - 6, Y + 155, 7, P.gold, dark, 2);
    return s + R(X + 6 - out, Y + 6, W - 12, 52, 5, wood, dark, 3) + C(X - out, Y + 32, 8, P.gold, dark, 2);
  }

  function pushPullStage(scene, t, bi) {
    var k = bi - scene.first, out = "";
    if (k === 0) {
      var pushAt = cue(bi, "push"), awayAt = cue(bi, "away");
      var bx = lerp(234, 604, awayAt == null ? 0 : glide((t - awayAt - 0.1) / 1.4));
      out += MK.arrow(176, 206, 474, 206, on(t, pushAt, 0.5), PUSH, 11);
      out += Tx(326, 180, "away from you", "lab big gold", "middle", { opacity: on(t, awayAt, 0.4) });
      out += MK.ripple(198, FLOOR_Y - 36, t, awayAt, PUSH);
      out += football(bx, FLOOR_Y - 36, 76, rollSpin(bx - 234, 76));
      return out;
    }
    if (k === 1) {
      var pullAt = cue(bi, "pull"), towAt = cue(bi, "towards");
      var slide = towAt == null ? 0 : ease((t - towAt - 0.1) / 1.0) * 128;
      out += MK.arrow(452, 104, 186, 104, on(t, pullAt, 0.5), PULL, 11);
      out += Tx(320, 78, "towards you", "lab big", "middle", { fill: PULL, opacity: on(t, towAt, 0.4) });
      return out + drawers(slide);
    }
    if (k === 2) {
      /* The finger over the bell carries the push on its back: a big arrow for
         a hard push, shrinking to a small one for a gentle tap. The tap presses
         the bell and it rings. */
      var hardAt = cue(bi, "hard"), tapAt = cue(bi, "tap"), stillAt = cue(bi, "still");
      var shrink = on(t, tapAt == null ? null : tapAt - 0.35, 0.6);
      var BX = 380, BY = 330, press = tapAt == null ? 0 : bump(t, tapAt + 0.3, 0.55);
      var fy = lerp(196, 221, press), fingerTop = fy - 46;
      out += MK.glow(BX, BY - 20, 120, PUSH, bump(t, stillAt, 1.2)) + Em(BX, BY, 140, BELL);
      out += G(Em(BX - 18, fy, 92, "\u{1F447}"), { opacity: on(t, hardAt == null ? null : hardAt - 0.6, 0.4) });
      var ho = on(t, hardAt, 0.4);
      if (ho > 0) {
        out += G(MK.arrow(BX - 18, fingerTop - lerp(124, 42, shrink), BX - 18, fingerTop - 6, 1, PUSH, lerp(16, 6, shrink)) +
          Tx(BX + 22, fingerTop - lerp(70, 22, shrink), shrink < 0.5 ? "hard" : "gentle", "lab big gold", "start", { opacity: Math.abs(1 - 2 * shrink) }),
          { opacity: ho });
      }
      var ring = tapAt == null ? null : tapAt + 0.4, quiet = ring == null ? null : ring + 1.5;
      out += MK.waves(BX - 66, BY - 24, t, ring, { dir: Math.PI, spread: 1.1, reach: 80, period: 0.8, col: P.gold, until: quiet }) +
        MK.waves(BX + 66, BY - 24, t, ring, { dir: 0, spread: 1.1, reach: 80, period: 0.8, col: P.gold, until: quiet });
      return out;
    }
    /* a force's three jobs, each with the ball that does it */
    var forces = cue(bi, "forces");
    out += Em(150, 74, 78, "\u{1F4AA}\u{1F3FE}", { opacity: on(t, forces, 0.4) }) +
      Tx(210, 92, "forces", "lab huge gold", "start", { opacity: on(t, forces, 0.4) });
    [["move", 20], ["stop", 244], ["turn", 468]].forEach(function (j) {
      var at = cue(bi, j[0]), p = popIn(t, at, 0.4);
      if (p <= 0) return;
      out += G(forceJob(j[0], j[0], t, at), { opacity: Math.min(1, p), transform: tr(j[1], 158) + " " + around(104, 116, 0.92 + 0.08 * Math.min(p, 1.05)) });
    });
    return out;
  }

  /* A 208 x 232 card at the origin: the ball doing one of a force's jobs
     ("move", "stop" or "turn", acted out in the 0.5 s after `at`, because the
     last of them is named in a line's last word), under the word `word`. */
  function forceJob(job, word, t, at) {
    var u = ease((t - at) / 0.5), out = R(0, 0, 208, 232, 20, P.card, P.line, 2);
    if (job === "move") {
      out += MK.arrow(16, 92, 70, 92, 1, PUSH, 7) + football(lerp(104, 150, u), 92, 60, rollSpin(46 * u, 60));
    } else if (job === "stop") {
      var bx = lerp(52, 110, u);
      out += Em(168, 92, 64, HAND) + football(bx, 92, 60, rollSpin(bx - 52, 60)) + MK.ripple(140, 92, t, at + 0.5, PUSH);
    } else {
      var p1 = [22, 140], p2 = [104, 140], p3 = [176, 52];
      var bxy = u < 0.5 ? [lerp(p1[0], p2[0], u * 2), p1[1]] : [lerp(p2[0], p3[0], u * 2 - 1), lerp(p2[1], p3[1], u * 2 - 1)];
      out += Pth("M" + p1[0] + "," + p1[1] + " L" + p2[0] + "," + p2[1] + " L" + p3[0] + "," + p3[1], null, P.muted, 3, { "stroke-dasharray": "6 8" }) +
        MK.arrow(104, 186, 104, 160, 1, PUSH, 6) + football(bxy[0], bxy[1], 50, rollSpin(u * 190, 50));
    }
    return out + Tx(104, 216, word, "lab big", "middle");
  }

  function scenePushPull(scene, beat, t, i) {
    var b2 = BEATS[scene.first + 2], kidO = i < scene.first + 2 ? 1 : 1 - inAt(t, b2.start - GAP, 0.5);
    return svg(youOnFloor(kidO) + crossfade(t, i, scene, function (bi) { return pushPullStage(scene, t, bi); }) + pushPullBins(scene, t));
  }
