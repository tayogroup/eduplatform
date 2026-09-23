  /* ==== Grade 3 Science, Lesson 4: Growing Up ==================================
     tools/lib/film-scenes/science-g3/growing-up.js, with -2.js, -3.js and
     -4.js: the film's pictures, after the shared marks (MK) and before the
     engine's tail, all in one scope. The storyboard is
     science/grade-3-app/lecture-video/growing-up.json.

     The lesson draws no figure, scene or sim: every stage of this lesson is a
     picture on a card, so the film uses the same pictures the child taps two
     steps later. The kit's own drawings (lesson-kit/_icons.py, reached as
     ART.ICONS) give frogspawn, tadpole, tadpole with legs, froglet, chrysalis
     and the ladybird larva; the lesson's own emoji give the frog, the
     butterfly, the caterpillar, the baby, the child, the adult, the chick, the
     bird, the puppy, the foal, the kitten and the two kinds of model.

     This file: the palette, the helpers every chapter shares, the title motif
     and the chapter "From frogspawn to frog". Every top-level name here starts
     with gu, so nothing can replace a name of the engine, ART or MK. */

  var HUE = {
    title: P.teal, frog: P.good, butterfly: P.gold, bigger: P.blue,
    twoways: P.accent, table: P.plum, models: P.gold, recap: P.teal
  };

  /* ---- timing ---------------------------------------------------------------- */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 comes
     in: for a thing that belongs to that beat alone (rule 7) */
  function guOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function guFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }
  /* fixed numbers for anything scattered: never Math.random */
  var GU_SCATTER = [0.17, 0.63, 0.38, 0.91, 0.24, 0.55, 0.08, 0.79, 0.46, 0.7];

  /* ---- small drawings of the film's own --------------------------------------- */

  /* The kit draws the tadpole, the tadpole with legs and the ladybird larva
     almost black, because the lesson shows them on white. On the film's dark
     stage they vanish, so those three get the light plate the lesson's own card
     is - checked in the sheets, where the tadpole was a dark smudge without it.
     Every other kit drawing and every emoji reads as it is. */
  function guDarkIcon(pic) {
    return pic === ART.ICONS.tadpole || pic === ART.ICONS.tadpolelegs || pic === ART.ICONS.larva;
  }
  function guPic(cx, cy, size, pic, extra) {
    if (!guDarkIcon(pic)) return MK.pic(cx, cy, size, pic, extra);
    var s = size * 1.12;
    return G(R(cx - s / 2, cy - s / 2, s, s, s * 0.2, P.paper, "#CFC6B0", 2) + MK.pic(cx, cy, size, pic), extra);
  }

  /* a panel: the dark card every chapter stands its pictures on */
  function guPanel(x, y, w, h, lit, o) {
    if (!(o > 0)) return "";
    return R(x, y, w, h, 22, lit ? "#1B3A52" : P.card, lit ? P.gold : P.line, lit ? 3 : 2, { opacity: clamp(o, 0, 1) });
  }

  /* an arc from (x0, y0) to (x1, y1) bending through the control point
     (cx, cy), drawn to u (0..1), with an arrowhead on the drawn end */
  function guArc(x0, y0, cx, cy, x1, y1, u, col, w) {
    if (!(u > 0)) return "";
    col = col || P.gold; w = w || 5;
    var at = function (s) {
      var v = 1 - s;
      return [v * v * x0 + 2 * v * s * cx + s * s * x1, v * v * y0 + 2 * v * s * cy + s * s * y1];
    };
    var N = 26, d = "", uu = clamp(u, 0, 1);
    for (var k = 0; k <= N; k++) {
      var s = uu * k / N, p = at(s);
      d += (k ? " L" : "M") + n2(p[0]) + "," + n2(p[1]);
    }
    var e = at(uu), e0 = at(Math.max(0, uu - 0.04));
    var a = Math.atan2(e[1] - e0[1], e[0] - e0[0]), h = w * 2.4;
    return Pth(d, null, col, w) +
      Pth("M" + n2(e[0]) + "," + n2(e[1]) +
        " L" + n2(e[0] - Math.cos(a) * h - Math.sin(a) * h * 0.62) + "," + n2(e[1] - Math.sin(a) * h + Math.cos(a) * h * 0.62) +
        " L" + n2(e[0] - Math.cos(a) * h + Math.sin(a) * h * 0.62) + "," + n2(e[1] - Math.sin(a) * h - Math.cos(a) * h * 0.62) + " Z", col, col, 2);
  }

  /* a bent arrow that says "turn me", above (cx, cy) at radius r */
  function guTurn(cx, cy, r, u, col) {
    return guArc(cx - r, cy - r * 0.55, cx, cy - r * 1.7, cx + r, cy - r * 0.55, u, col || P.gold, 5);
  }

  /* bubbles rising from (x, y0) to y1 while the voice says so */
  function guBubbles(t, at, x, y0, y1, o) {
    if (at == null || t < at || !(o > 0)) return "";
    var out = "";
    for (var k = 0; k < 6; k++) {
      var born = at + k * 0.18;
      if (t < born) continue;
      var ph = ((t - born) / 1.3) % 1;
      /* a deep blue: these rise over the tadpole's own light plate, where the
         lesson's pale pond blue disappeared. Six of them, and wider: four thin
         ones read as a stray dot on the contact sheet. */
      out += C(x + 15 * Math.sin((t - born) * 2.6 + k), lerp(y0, y1, ph), 7 + (k % 3) * 3, "none", "#2F7FA6", 3.4,
        { opacity: (1 - ph) * clamp(o, 0, 1) });
    }
    return out;
  }

  /* ==== the title =================================================================
     The lesson's two changing animals, each beside what it becomes: a tadpole
     and a frog, a caterpillar and a butterfly. In the spoken title chapter the
     two young ones come first, on "starts small"; they glow on "change shape";
     then each pair is named and completed. On the two cards all four stand. */
  var GU_MOTIF = { tad: [112, 120], frog: [256, 120], cat: [112, 252], bfly: [256, 252], s: 92 };
  function titleMotif(o) {
    var t = o.t || 0, s = o.scene, out = "";
    var cSmall = s ? sc(s, 0, "small") : null, cChange = s ? sc(s, 0, "change") : null;
    var cTad = s ? sc(s, 1, "tadpole") : null, cFrog = s ? sc(s, 1, "frog") : null;
    var cCat = s ? sc(s, 1, "cat") : null, cBfly = s ? sc(s, 1, "bfly") : null;
    var pTad = s ? popIn(t, cSmall, 0.45) : 1;
    var pCat = s ? popIn(t, cSmall == null ? null : cSmall + 0.3, 0.45) : 1;
    var pFrog = s ? popIn(t, cFrog, 0.45) : 1;
    var pBfly = s ? popIn(t, cBfly, 0.45) : 1;
    var glow = s ? on(t, cChange, 0.5) * guOnly(t, s, 0) : 0;

    out += C(180, 180, 172, "#123247");
    out += MK.glow(GU_MOTIF.tad[0], GU_MOTIF.tad[1], 74, P.gold, glow * (0.6 + 0.4 * breathe(t)));
    out += MK.glow(GU_MOTIF.cat[0], GU_MOTIF.cat[1], 74, P.gold, glow * (0.6 + 0.4 * breathe(t + 0.5)));
    /* the change: young -> adult, one arrow per row */
    out += MK.arrow(166, 120, 206, 120, s ? on(t, cFrog, 0.5) : 1, P.gold, 6);
    out += MK.arrow(166, 252, 206, 252, s ? on(t, cBfly, 0.5) : 1, P.gold, 6);
    out += MK.pop(guPic(GU_MOTIF.tad[0], GU_MOTIF.tad[1], GU_MOTIF.s, ART.ICONS.tadpole), GU_MOTIF.tad[0], GU_MOTIF.tad[1], pTad);
    out += MK.pop(MK.pic(GU_MOTIF.frog[0], GU_MOTIF.frog[1], GU_MOTIF.s, "\u{1F438}"), GU_MOTIF.frog[0], GU_MOTIF.frog[1], pFrog);
    out += MK.pop(MK.pic(GU_MOTIF.cat[0], GU_MOTIF.cat[1], GU_MOTIF.s, "\u{1F41B}"), GU_MOTIF.cat[0], GU_MOTIF.cat[1], pCat);
    out += MK.pop(MK.pic(GU_MOTIF.bfly[0], GU_MOTIF.bfly[1], GU_MOTIF.s, "\u{1F98B}"), GU_MOTIF.bfly[0], GU_MOTIF.bfly[1], pBfly);
    /* the one being named wears a ring */
    if (s) {
      out += C(GU_MOTIF.tad[0], GU_MOTIF.tad[1], 54, "none", P.gold, 4, { opacity: bump(t, cTad, 1.3) });
      out += C(GU_MOTIF.cat[0], GU_MOTIF.cat[1], 54, "none", P.gold, 4, { opacity: bump(t, cCat, 1.3) });
    }
    out += C(180, 180, 172, "none", P.line, 3);
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A tadpole becoming a frog, and a caterpillar becoming a butterfly">' + out + "</svg>";
  }

  /* ==== chapter: from frogspawn to frog ===========================================
     The five cards of the lesson's own "From frogspawn to frog" step, left to
     right in the order the child has to tap them, over the pond the first three
     live in and the land the last two stand on. One card appears per line and
     the card being talked about is the bright one. */
  var GU_FX = [144, 364, 584, 804, 1024];
  var GU_CW = 176, GU_CY = 96, GU_CH = 244, GU_PIC_Y = 190, GU_PIC_S = 112;
  var GU_FLAB = [["frogspawn"], ["tadpole"], ["tadpole", "with legs"], ["froglet"], ["adult frog"]];
  var GU_WATER = 694;            /* the bank: cards 0-2 in the pond, 3-4 on land */

  function guFrogPic(k) {
    return k === 4 ? "\u{1F438}" : [ART.ICONS.frogspawn, ART.ICONS.tadpole, ART.ICONS.tadpolelegs, ART.ICONS.froglet][k];
  }

  function guStage(k, p, bright) {
    if (!(p > 0)) return "";
    var x = GU_FX[k], labs = GU_FLAB[k], out = "";
    out += R(x - GU_CW / 2, GU_CY, GU_CW, GU_CH, 20, bright ? "#1B3A52" : P.card, bright ? P.gold : P.line, bright ? 3 : 2);
    out += guPic(x, GU_PIC_Y, GU_PIC_S, guFrogPic(k));
    if (labs.length === 1) out += Tx(x, 308, labs[0], "lab mid", "middle");
    else out += Tx(x, 296, labs[0], "lab mid", "middle") + Tx(x, 322, labs[1], "lab mid", "middle");
    return G(out, { opacity: clamp(Math.min(1, p) * (bright ? 1 : 0.42), 0, 1), transform: around(x, GU_CY + GU_CH / 2, Math.min(p, 1.08)) });
  }

  /* the pond and the bank beside it, drawn once the voice says "a pond" */
  function guPond(t, o) {
    if (!(o > 0)) return "";
    var top = 352, bot = 426, out = "";
    out += R(GU_WATER, top, 1128 - GU_WATER, bot - top, 10, "#3E8E4A");
    out += R(40, top, GU_WATER - 40, bot - top, 10, "#245A7C");
    var d = "M40," + top;
    for (var k = 0; k <= 12; k++) {
      var x = 40 + k * (GU_WATER - 40) / 12;
      d += " L" + n2(x) + "," + n2(top + 5 * Math.sin(k * 0.9 + t * 1.1));
    }
    out += Pth(d, null, "#9ED8F0", 3, { opacity: 0.7 });
    /* each band named at its own left end. "pond" used to sit at the water's
       right edge, which is exactly where the froglet's climb arrow leaves the
       water, and the arrow was drawn through the word. */
    out += Tx(64, bot - 16, "pond", "lab mid", "start", { fill: "#BFE3F5" });
    out += Tx(GU_WATER + 24, bot - 16, "land", "lab mid", "start", { fill: "#D6F0D8" });
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  function guFrogChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var k = i - scene.first;
    var appear = [c(0, "eggs"), c(1, "tad"), c(2, "back"), c(3, "froglet"), c(4, "adult")];
    var current = [0, 1, 2, 3, 4, 1][k];
    var out = "";

    out += guPond(t, on(t, c(0, "pond"), 0.7));

    /* the cards, and an arrow into each as it arrives */
    for (var n = 0; n < 5; n++) {
      if (n > 0) out += MK.arrow(GU_FX[n - 1] + GU_CW / 2 + 4, GU_PIC_Y, GU_FX[n] - GU_CW / 2 - 4, GU_PIC_Y, on(t, appear[n], 0.5), P.gold, 5);
      out += guStage(n, popIn(t, appear[n], 0.45), n === current);
    }

    /* beat 0: "This is frogspawn" - the card's own label, boxed */
    out += R(GU_FX[0] - 66, 288, 132, 30, 12, "none", P.gold, 3,
      { opacity: on(t, c(0, "spawn"), 0.4) * guOnly(t, scene, 0) });

    /* beat 1: a tail, no legs, and it breathes in the water */
    var one = guOnly(t, scene, 1), cTail = c(1, "tail");
    if (one > 0) {
      var pA = popIn(t, cTail, 0.35) * one, pB = popIn(t, cTail == null ? null : cTail + 0.5, 0.35) * one;
      out += MK.tick(272, 52, 19, pA) + MK.pill(300, 52, "tail", Math.min(1, pA), { size: 22, anchor: "start", col: P.good });
      out += MK.cross(404, 52, 19, pB) + MK.pill(432, 52, "legs", Math.min(1, pB), { size: 22, anchor: "start", col: P.bad });
      out += guBubbles(t, c(1, "breathes"), GU_FX[1], 246, 140, one);
    }

    /* beat 2: back legs first, then front legs, and the tail shrinks */
    var two = guOnly(t, scene, 2), cBack = c(2, "back"), cFront = c(2, "front"), cShr = c(2, "shrink");
    if (two > 0) {
      var oB = on(t, cBack, 0.45) * two, oF = on(t, cFront, 0.45) * two;
      /* Everything that lands ON the card is drawn in the accent, not gold:
         guPic gives this icon a cream plate and gold on cream is unreadable
         (the first sheets showed a ring nobody could see). One leg mark at a
         time - the back ring gives way to the dashed front one, which is where
         the front legs are still to come; the lesson's drawing has only the
         back pair, so a solid ring there would name a leg it does not draw. */
      out += MK.pill(470, 52, "back legs first", Math.min(1, popIn(t, cBack, 0.4)) * two, { size: 22, col: P.gold });
      out += MK.leader(470, 74, 560, 204, oB * (1 - on(t, cFront, 0.4)), P.accent);
      out += C(572, 214, 32, "none", P.accent, 5, { opacity: oB * (1 - on(t, cFront, 0.4)) });
      out += MK.pill(712, 52, "then front legs", Math.min(1, popIn(t, cFront, 0.4)) * two, { size: 22, col: P.gold });
      /* the front-leg mark sits on a blank patch of torso just ahead of the
         back-leg ring, not on the icon's eye: a review found the previous
         point (548, 200) landing on the tadpole's face. */
      out += MK.leader(712, 74, 588, 195, oF, P.accent);
      out += C(600, 205, 24, "none", P.accent, 5, { opacity: oF, "stroke-dasharray": "8 6" });
      /* the tail, shrinking: the bar over it gets shorter. Its word sits on the
         dark card above the plate, where it can be read. */
      var sh = on(t, cShr, 0.8) * two;
      if (sh > 0) out += L(lerp(590, 622, ease((t - cShr) / 0.8)), 158, 638, 158, P.accent, 6, { opacity: sh }) +
        Tx(614, 120, "tail", "lab mid", "middle", { opacity: sh, fill: P.accent });
    }

    /* beat 3: legs front and back, a stub of tail, and out onto the land.
       The line used to say "four legs", and the kit's froglet draws TWO leg
       strokes - a front one under the head end and a back one under the tail
       end, which is a four-legged animal seen from the side. So the words name
       what the drawing shows and the marks land on those two legs in turn,
       instead of a number the child would count and not find (brief, rule 8).
       Both marks are solid: unlike the front legs of the beat before, both of
       these are drawn. */
    var three = guOnly(t, scene, 3), cLegs = c(3, "legs"), cStub = c(3, "stub"), cClimb = c(3, "climb");
    if (three > 0) {
      var fade = (1 - on(t, cStub, 0.4)) * three;
      out += C(773, 215, 15, "none", P.gold, 4, { opacity: on(t, cLegs, 0.35) * fade });
      out += C(812, 213, 15, "none", P.gold, 4, { opacity: on(t, cLegs == null ? null : cLegs + 0.35, 0.35) * fade });
      out += C(834, 183, 24, "none", P.gold, 4, { opacity: on(t, cStub, 0.4) * three });
      /* out of the water and up onto the bank, under the froglet's own card */
      out += MK.arrow(638, 406, 800, 354, on(t, cClimb, 0.5) * three, P.gold, 7);
    }

    /* beat 4: it breathes air, and lays the eggs the cycle began with */
    var four = guOnly(t, scene, 4);
    if (four > 0) {
      var oAir = on(t, c(4, "air"), 0.5) * four;
      out += MK.pill(GU_FX[4], 46, "air", Math.min(1, popIn(t, c(4, "air"), 0.4)) * four, { size: 22, col: P.blue });
      out += MK.arrow(GU_FX[4], 68, GU_FX[4], 128, oAir, P.blue, 6);
      out += guArc(GU_FX[4], 88, 584, -18, GU_FX[0] + 10, 88, on(t, c(4, "lays"), 0.6) * four, P.gold, 5);
    }

    /* beat 5: a tadpole is not a baby fish */
    var five = guOnly(t, scene, 5);
    if (five > 0) {
      var pF = popIn(t, c(5, "fish"), 0.4) * five, pT = popIn(t, c(5, "baby"), 0.4) * five;
      out += MK.pop(MK.pic(296, 52, 80, "\u{1F41F}"), 296, 52, pF) + MK.cross(364, 52, 24, pF);
      out += MK.pop(MK.pic(470, 52, 80, "\u{1F438}"), 470, 52, pT) + MK.tick(538, 52, 24, pT);
    }
    return svg(out);
  }
