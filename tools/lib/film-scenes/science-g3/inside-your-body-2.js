  /* ==== chapters: the brain and the lungs, and the heart =======================
     tools/lib/film-scenes/science-g3/inside-your-body-2.js. The body on the
     left is the lesson's own figure throughout (ibBodyCard); the right of the
     stage is a WINDOW onto the same drawing, the region round the organ being
     talked about, so the child sees the lesson's brain and the lesson's lungs
     rather than a second picture of them. */

  /* A window onto the lesson's body: the region (v.x, v.y, v.w, v.h) of its own
     260 x 420 drawing, shown in the box (b.x, b.y, b.w, b.h) of the film's
     space. It is a nested svg, so it CROPS instead of drawing outside its box.
     Give v and b the same shape (v.w / v.h === b.w / b.h) and ibWX / ibWY say
     where a point of the drawing lands. `scale` swells the drawing about the
     figure point `about`, which is how a chest fills with air. */
  /* The nested svg already clips to its own viewport, but a CLIP-PATH round it
     says so in the markup: --sweep measures an element's box, and a nested svg
     reports the box of everything inside it, so a window showing a tenth of the
     drawing was read as a drawing 1064 px outside the 1168 x 440 box. The rect
     is the window's own box, so nothing on screen changes; the id is made from
     that box, so every definition of one id is the same drawing. */
  function ibWindow(fig, v, b, scale, about) {
    var inner = ART.place(fig, 0, 0, 260, 420);
    if (scale != null && scale !== 1) inner = G(inner, { transform: around(about[0], about[1], scale) });
    var id = "ibWin" + [b.x, b.y, b.w, b.h].map(function (q) { return Math.round(q); }).join("_");
    return el("clipPath", { id: id }, R(b.x, b.y, b.w, b.h, 0, "#000")) +
      G('<svg x="' + n2(b.x) + '" y="' + n2(b.y) + '" width="' + n2(b.w) + '" height="' + n2(b.h) +
        '" viewBox="' + n2(v.x) + " " + n2(v.y) + " " + n2(v.w) + " " + n2(v.h) + '" preserveAspectRatio="xMidYMid slice">' +
        inner + "</svg>", { "clip-path": "url(#" + id + ")" });
  }
  function ibWX(v, b, px) { return b.x + (px - v.x) * b.w / v.w; }
  function ibWY(v, b, py) { return b.y + (py - v.y) * b.h / v.h; }
  /* the card a window sits on, so the lesson's drawing is never cropped to nothing */
  function ibWindowCard(b) { return R(b.x - 12, b.y - 12, b.w + 24, b.h + 24, 22, P.card, P.line, 2); }

  /* a heart, drawn the shape the lesson's figure draws it */
  function ibHeartShape(cx, cy, s, fill, stroke, sw, extra) {
    var d = "M" + n2(cx) + "," + n2(cy + s * 0.78) +
      " C" + n2(cx - s * 1.34) + "," + n2(cy - s * 0.04) + " " + n2(cx - s * 0.92) + "," + n2(cy - s * 1.12) + " " + n2(cx) + "," + n2(cy - s * 0.4) +
      " C" + n2(cx + s * 0.92) + "," + n2(cy - s * 1.12) + " " + n2(cx + s * 1.34) + "," + n2(cy - s * 0.04) + " " + n2(cx) + "," + n2(cy + s * 0.78) + " Z";
    return Pth(d, fill, stroke, sw, extra);
  }

  /* ==== chapter: the brain and the lungs =============================================
     Beat 0 and 1: the lesson's brain, big, in a window; "thinks", "remembers"
     and "feels" appear under it as they are said. Beat 2: messages run down
     the body from the brain to each other organ, and each lights as its
     message lands. Beats 3 and 4: the window moves to the chest, and the
     chest swells and falls with the air going in and out. */
  var IB_BRAIN_V = { x: 90, y: 20, w: 80, h: 80 }, IB_BRAIN_B = { x: 640, y: 26, w: 300, h: 300 };
  var IB_CHEST_V = { x: 60, y: 130, w: 140, h: 140 }, IB_CHEST_B = { x: 640, y: 26, w: 300, h: 300 };
  var IB_MIND = [
    { at: "thinks", text: "thinks", x: 672 }, { at: "remembers", text: "remembers", x: 830 }, { at: "feels", text: "feels", x: 980 }
  ];

  /* how full the lungs are: still until "breathe in", then in, then out, then
     a slow cycle of its own for "all day long" (a pure function of t) */
  function ibLungFill(t, cIn, cOut) {
    if (cIn == null || t < cIn) return 0.16;
    if (t < cIn + 1.1) return lerp(0.16, 1, ease((t - cIn) / 1.1));
    if (cOut == null || t < cOut) return 1;
    if (t < cOut + 1.1) return lerp(1, 0.16, ease((t - cOut) / 1.1));
    return 0.16 + 0.72 * (0.5 - 0.5 * Math.cos((t - cOut - 1.1) * Math.PI / 1.3));
  }

  function ibBrainLungsChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cBrain = c(0, "brain"), cHead = c(0, "head"), cSkull = c(0, "skull");
    var cTells = c(2, "tells"), cWhat = c(2, "what");
    var cLungs = c(3, "lungs"), cAir = c(3, "air"), cIn = c(3, "in");
    var cPush = c(4, "push"), cOut = c(4, "out"), cAll = c(4, "allday");
    var out = "", toChest = into(t, scene.first + 3);

    /* the message beat: each organ lights as the brain's message reaches it */
    var msg = on(t, cTells, 0.4) * ibOnly(t, scene, 2), lit = {}, ring = {};
    var targets = ["lungs", "heart", "stomach", "intestine"];
    IB_IDS.forEach(function (p) { lit[p] = 0.35; });
    lit.brain = lerp(0.35, 1, on(t, cBrain, 0.45));
    targets.forEach(function (p, n) {
      var land = cTells == null ? null : cTells + 0.35 + n * 0.28;
      lit[p] = Math.max(lit[p], on(t, land, 0.4) * msg);
    });
    lit.lungs = Math.max(lit.lungs, on(t, cLungs, 0.45));
    ring.brain = on(t, cBrain, 0.35) * (1 - on(t, cLungs, 0.35));
    ring.lungs = on(t, cLungs, 0.35);
    out += ibBodyCard(ibBody({ ring: ring, lit: lit }));

    /* "inside your skull": the head lights up round the brain */
    var sk = bump(t, cSkull, 1.2);
    if (sk > 0) out += C(ibFX(130), ibFY(58), 46 + 10 * sk, "none", P.gold, 4, { opacity: sk, "stroke-dasharray": "9 7" });
    var hd = bump(t, cHead, 1.0);
    /* r 64, not 74: the head sits at y 70, so a wider pool spills over the
       chapter heading (--sweep, 4 px out). */
    if (hd > 0) out += MK.glow(ibFX(130), ibFY(58), 64, P.gold, hd * 0.9);

    /* the messages themselves: a dashed line down the body and a dot running it */
    if (msg > 0.01) {
      targets.forEach(function (p, n) {
        var go = cTells == null ? null : cTells + 0.1 + n * 0.28, a = ibAt("brain"), b = ibAt(p);
        var u = on(t, go, 0.5);
        if (u <= 0) return;
        out += L(a[0], a[1] + 18, lerp(a[0], b[0], u), lerp(a[1] + 18, b[1], u), P.plum, 3.5, { opacity: 0.85 * msg, "stroke-dasharray": "8 7" });
        if (u >= 1) out += C(b[0], b[1], 7 + 5 * bump(t, go + 0.5, 0.6), P.plum, null, null, { opacity: msg });
      });
      /* "what to do": every organ the message reached answers with a pulse */
      var wo = on(t, cWhat, 0.45) * msg;
      if (wo > 0) targets.forEach(function (p, n) {
        var b = bump(t, cWhat + n * 0.12, 0.8) * wo, q = ibAt(p);
        if (b > 0) out += C(q[0], q[1], 14 + 14 * b, "none", P.plum, 4, { opacity: b });
      });
    }

    /* ---- the window: the brain, then the chest ---- */
    var chestLit = { heart: 0.22, stomach: 0.3, intestine: 0.3 };
    var fill = ibLungFill(t, cIn, cOut);
    out += ibWindowCard(IB_BRAIN_B);
    if (toChest < 1) {
      out += G(ibWindow(ibBody({ lit: { lungs: 0.34, heart: 0.28, stomach: 0.3, intestine: 0.3 } }), IB_BRAIN_V, IB_BRAIN_B), { opacity: 1 - toChest });
    }
    if (toChest > 0) {
      out += G(ibWindow(ibBody({ lit: chestLit }), IB_CHEST_V, IB_CHEST_B, 1 + 0.09 * fill, [130, 200]), { opacity: toChest });
    }

    /* beats 0 and 1: what the brain does, in the lesson's three words */
    var mind = (1 - toChest);
    IB_MIND.forEach(function (m, n) {
      var p = popIn(t, c(1, m.at), 0.4) * mind;
      if (p > 0) out += MK.pill(m.x, 382, m.text, Math.min(1, p), { size: 28, col: P.plum });
      var s = bump(t, c(1, m.at), 0.9) * mind;
      if (s > 0) {
        for (var q = 0; q < 5; q++) {
          var a = (q * 72 + n * 18) * Math.PI / 180, r = 118 + 34 * s;
          out += C(790 + Math.cos(a) * r, 176 + Math.sin(a) * r * 0.82, 5 + 4 * s, P.plum, null, null, { opacity: s });
        }
      }
    });

    /* beats 3 and 4: the air going in and coming out */
    if (toChest > 0.01) {
      var mouth = [790, 44], top = [790, 112];
      var inU = on(t, cAir, 0.5) * (1 - on(t, cPush, 0.4));
      var outU = on(t, cPush, 0.5);
      if (inU > 0) out += MK.arrow(mouth[0], mouth[1], top[0], top[1], inU, P.blue, 9);
      if (outU > 0) out += MK.arrow(top[0], top[1], mouth[0], mouth[1], outU, P.teal, 9);
      /* the air itself: four puffs riding the same way as the arrow */
      var go = outU > 0.5 ? cPush : cAir;
      if (go != null && t >= go) {
        for (var k = 0; k < 4; k++) {
          var ph = (((t - go) / 0.9) + k * 0.25) % 1;
          var y = outU > 0.5 ? lerp(top[1], mouth[1], ph) : lerp(mouth[1], top[1], ph);
          out += C(790 + (IB_SCATTER[k] - 0.5) * 34, y, 7, outU > 0.5 ? P.teal : P.blue, null, null, { opacity: (1 - ph) * toChest });
        }
      }
      var allO = on(t, cAll, 0.5), labO = on(t, cAir, 0.6) * toChest;
      if (allO < 0.995 && labO > 0.01)
        out += MK.pill(790, 382, cPush != null && t >= cPush ? "breathing out" : "breathing in", labO * (1 - allO), { size: 28, col: P.blue });
      if (allO > 0.01) out += MK.pill(790, 382, "in, out, in, out", allO * toChest, { size: 28, col: P.blue });
    }
    return svg(out);
  }

  /* ==== chapter: the heart ============================================================
     The lesson's heart in the chest, on the left and in a window; on the right
     it beats about once a second and pushes blood round a loop to every part.
     Beat 1 is the lesson's own correction: not on the far left, in the middle. */
  var IB_HEART_V = { x: 56, y: 130, w: 148, h: 148 }, IB_HEART_B = { x: 396, y: 44, w: 272, h: 272 };
  var IB_LOOP = { cx: 900, cy: 196, rx: 210, ry: 140 };
  function ibLoopAt(u) {
    var a = -Math.PI / 2 + u * 2 * Math.PI;
    return [IB_LOOP.cx + IB_LOOP.rx * Math.cos(a), IB_LOOP.cy + IB_LOOP.ry * Math.sin(a)];
  }
  /* one squeeze a second, from `from` on: 0 rest, 1 fully squeezed */
  function ibPulse(t, from) {
    if (from == null || t < from) return 0;
    var u = (t - from) % 1;
    return u < 0.34 ? Math.sin(Math.PI * u / 0.34) : 0;
  }

  function ibHeartChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cHeart = c(0, "heart"), cBetween = c(0, "between"), cMiddle = c(0, "middle");
    var cFar = c(1, "far"), cReally = c(1, "really");
    var cPump = c(2, "pump"), cSecond = c(2, "second"), cSqueeze2 = c(2, "squeeze");
    var cSqueeze = c(3, "squeeze"), cBlood = c(3, "blood"), cBody = c(3, "body");
    var cCarries = c(4, "carries"), cGoodness = c(4, "goodness"), cEvery = c(4, "every");
    var cHand = c(5, "hand"), cFeel = c(5, "feel");
    var out = "", beatFrom = cSqueeze2;

    var lit = { brain: 0.3, lungs: 0.45, stomach: 0.32, intestine: 0.32 };
    lit.lungs = Math.min(1, 0.45 + 0.4 * bump(t, cBetween, 1.2));
    out += ibBodyCard(ibBody({ ring: { heart: on(t, cHeart, 0.4) }, lit: lit }));

    /* "in the middle of your chest": a dashed line down the middle of the body */
    var mid = on(t, cMiddle, 0.5) * (1 - into(t, scene.first + 2));
    if (mid > 0) out += L(ibFX(130), ibFY(120), ibFX(130), ibFY(300), P.teal, 3, { opacity: mid * 0.9, "stroke-dasharray": "11 9" });

    /* the window: the lesson's own heart between the lungs, squeezing. The two
       lungs brighten on "between your two lungs". */
    out += ibWindowCard(IB_HEART_B);
    out += ibWindow(ibBody({ ring: { heart: on(t, cHeart, 0.4) }, width: 4,
        lit: { lungs: 0.34 + 0.5 * bump(t, cBetween, 1.2), brain: 0.3, stomach: 0.3, intestine: 0.3 } }),
      IB_HEART_V, IB_HEART_B, 1 - 0.07 * ibPulse(t, beatFrom), [130, 198]);

    /* "on the far left": the place children put it, crossed out in the window
       where the chest is big, and then the real one lit in the middle */
    var ghost = [ibWX(IB_HEART_V, IB_HEART_B, 80), ibWY(IB_HEART_V, IB_HEART_B, 198)];
    var real = [ibWX(IB_HEART_V, IB_HEART_B, 130), ibWY(IB_HEART_V, IB_HEART_B, 198)];
    var wrong = on(t, cFar, 0.4) * ibOnly(t, scene, 1) * (1 - on(t, cReally, 0.5));
    if (wrong > 0) {
      out += G(ibHeartShape(ghost[0], ghost[1], 28, "rgba(240,128,111,0.30)", P.bad, 4), { opacity: wrong });
      out += MK.cross(ghost[0], ghost[1], 30, popIn(t, cFar == null ? null : cFar + 0.3, 0.4) * wrong);
    }
    var right = on(t, cReally, 0.45) * ibOnly(t, scene, 1);
    if (right > 0) out += MK.glow(real[0], real[1], 84, P.good, right * 0.9) +
      MK.tick(real[0] + 90, real[1] - 76, 24, popIn(t, cReally == null ? null : cReally + 0.15, 0.4) * right);

    /* the pump, on the right: the loop, the blood, and the heart at its centre */
    var pumpO = on(t, cPump, 0.5);
    if (pumpO > 0.01) {
      out += E(IB_LOOP.cx, IB_LOOP.cy, IB_LOOP.rx, IB_LOOP.ry, "none", P.line, 5, { opacity: pumpO });
      var bloodU = on(t, cBlood, 0.5);
      if (bloodU > 0) {
        out += E(IB_LOOP.cx, IB_LOOP.cy, IB_LOOP.rx, IB_LOOP.ry, "none", "#8E3630", 5, { opacity: bloodU });
        for (var k = 0; k < 8; k++) {
          var ph = (((t - cBlood) / 3.4) + k / 8) % 1, p = ibLoopAt(ph);
          out += ibDrop(p[0], p[1], 8, bloodU);
        }
      }
      /* "every part of you": four places on the loop light up */
      var ev = on(t, cEvery, 0.5);
      if (ev > 0) [0.12, 0.37, 0.63, 0.88].forEach(function (u, n) {
        var p = ibLoopAt(u), b = popIn(t, cEvery == null ? null : cEvery + n * 0.16, 0.35);
        if (b > 0) out += MK.glow(p[0], p[1], 40, P.gold, Math.min(1, b) * ev) + C(p[0], p[1], 9, P.gold, null, null, { opacity: Math.min(1, b) * ev });
      });
      /* what the blood carries. The second pill says "goodness from air", not
         "air": the line, and the lesson behind it, are careful that what the
         blood takes round is the goodness the lungs get OUT of the air. The
         wider pill is centred left of the loop's middle so it clears the
         "food" one (food 694-786, goodness 819-1101 of the 1168). */
      var ca = popIn(t, cCarries, 0.4), gd = popIn(t, cGoodness, 0.4);
      if (ca > 0) out += MK.pill(IB_LOOP.cx - 160, 382, "food", Math.min(1, ca), { size: 26, col: P.gold });
      if (gd > 0) out += MK.pill(IB_LOOP.cx + 60, 382, "goodness from air", Math.min(1, gd), { size: 26, col: P.blue });

      var sq = ibPulse(t, beatFrom);
      out += G(MK.pic(IB_LOOP.cx, IB_LOOP.cy, 196, "\u{1FAC0}"), { transform: around(IB_LOOP.cx, IB_LOOP.cy, 1 - 0.1 * sq) });
      out += MK.glow(IB_LOOP.cx, IB_LOOP.cy, 128, P.bad, 0.85 * sq * pumpO);
      var so = on(t, cSecond, 0.5) * (1 - on(t, cCarries, 0.5));
      if (so > 0) out += MK.pill(IB_LOOP.cx, 42, "once a second", so, { size: 28, col: P.gold });
      /* "Each squeeze pushes blood": arrows leaving the heart as it squeezes */
      var pushO = on(t, cSqueeze, 0.5) * (1 - on(t, cEvery, 0.6));
      if (pushO > 0) {
        var g = bump(t, beatFrom == null ? null : beatFrom + Math.floor((t - beatFrom)) , 0.34);
        out += MK.arrow(IB_LOOP.cx, IB_LOOP.cy - 96, IB_LOOP.cx, IB_LOOP.cy - IB_LOOP.ry + 6, pushO * (0.45 + 0.55 * g), P.bad, 7);
      }
    }

    /* "Put a hand on your chest and feel it beating" */
    var hand = popIn(t, cHand, 0.45);
    if (hand > 0) {
      out += MK.pop(Em(ibFX(132), ibFY(226), 124, "✋"), ibFX(132), ibFY(226), hand);
      var fe = on(t, cFeel, 0.4);
      if (fe > 0) for (var r = 0; r < 3; r++) {
        var at = cFeel == null ? null : cFeel + r * 0.9;
        out += MK.ripple(ibFX(130), ibFY(198), t, at, P.bad);
      }
    }
    return svg(out);
  }
