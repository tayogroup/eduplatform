
  /* ==== Grade 3 Science, Lesson 9: Gravity and Friction, part 2 ================
     The chapters "Which way is down?" and "Friction". Joined to
     gravity-and-friction.js in one scope, so gfAt, gfOnly, gfFrom, gfSlide,
     gfRub and gfLabel are that file's.

     The gravity chapter is the lesson's own demo, in its own order: the ball
     let go (its first frame), then ART.scene("gravity", 0) - a child on the
     Earth with the red arrow to the centre - and beside it ART.scene("gravity",
     1), the same Earth with the child on the far side, which is the demo's
     third frame. Nothing is drawn that the lesson does not draw. */

  /* ---- the lesson's gravity scene, 320 x 300, placed at 300 x 281.25 -------- */
  var GF_GK = 0.9375, GF_GW = 300, GF_GH = 281.25, GF_GY = 74;
  function gfEarth(state, x) { return ART.place(ART.scene("gravity", state), x, GF_GY, GF_GW, GF_GH); }
  function gfGX(x, sx) { return x + sx * GF_GK; }
  function gfGY(sy) { return GF_GY + sy * GF_GK; }

  function gfGravityChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cGo = c(0, "go"), cFalls = c(0, "falls"), cNobody = c(0, "nobody"), cGrav0 = c(0, "gravity");
    var cPulls = c(1, "pulls"), cEvery = c(1, "every"), cCentre1 = c(1, "centre");
    var cDown = c(2, "down"), cCentre2 = c(2, "centre");
    var cSide = c(3, "side"), cWay = c(3, "way");
    var cNot = c(4, "not"), cStand = c(4, "stand"), cCentre4 = c(4, "centre");
    var out = "";

    /* ---- beat 1: let go of a ball and it falls -------------------------------- */
    var one = gfOnly(t, scene, 0);
    if (one > 0) {
      var bx = 584, top = 168, rest = 348, inner = "";
      var fall = cFalls == null ? 0 : clamp((t - cFalls) / 0.9, 0, 1);
      var by = lerp(top, rest, fall * fall);
      inner += R(120, 386, 928, 14, 7, "#6B4A2B");
      inner += Em(bx, 104, 72, "✋", { opacity: 1 - 0.45 * fall });
      if (fall > 0) inner += L(bx, top, bx, by - 30, P.muted, 3, { opacity: 0.5 * fall, "stroke-dasharray": "7 9" });
      /* gravity pulled it: the lesson's own red arrow, straight down the path
         the ball fell, drawn UNDER the ball so its tip meets it. Beside the
         path it read as a second falling thing. */
      var gp = on(t, cGrav0, 0.5);
      inner += MK.arrow(bx, top + 6, bx, rest - 46, gp, "#D9473F", 10);
      inner += Em(bx, by, 74, "⚽", { opacity: on(t, cGo, 0.35) });
      /* nobody pushed it: a push, crossed out */
      var nb = on(t, cNobody, 0.4);
      inner += MK.pill(716, 246, "a push", nb, { size: 26, col: P.muted, ink: P.muted });
      inner += MK.arrow(790, 246, 856, 246, nb, P.muted, 7);
      inner += MK.cross(898, 246, 28, popIn(t, gfAt(cNobody, 0.3), 0.35));
      inner += gfLabel(t, 340, 266, "gravity", cGrav0, [bx - 7, 266], 28, "#F0806F", "middle");
      out += G(inner, { opacity: one });
    }

    /* ---- from beat 2: the Earth, and the child standing on it -----------------
       ONE Earth, large and in the middle, while the film is only talking about
       here; it shrinks to the lesson's own size and moves left as the other
       side of the world arrives beside it. At 300 px wide in a 1168 px box the
       single Earth left two thirds of the frame empty for three beats. */
    var earth = gfFrom(t, scene, 1);
    if (earth <= 0) return svg(out);
    var slide = on(t, cSide, 0.9);
    var wl = lerp(404, GF_GW, slide), kl = wl / 320, hl = wl * 300 / 320;
    var xl = lerp(382, 116, slide), yl = lerp(30, GF_GY, slide), xr = 752;
    var lx = function (sx) { return xl + sx * kl; }, ly = function (sy) { return yl + sy * kl; };
    var lcx = lx(160), rcx = gfGX(xr, 160), cy = ly(150);
    out += G(ART.place(ART.scene("gravity", 0), xl, yl, wl, hl), { opacity: earth });
    if (slide > 0) out += G(gfEarth(1, xr), { opacity: slide });

    /* gravity pulls: the lesson's own red arrow, lit */
    var pu = Math.min(1, on(t, cPulls, 0.5) + on(t, cStand, 0.5) + on(t, cCentre4, 0.5));
    out += MK.glow(lcx, ly(100), 36 * kl, "#F0806F", pu * (0.5 + 0.35 * breathe(t)) * earth);
    /* everything: three of the lesson's own things, each pulled towards the
       centre. All three sit to the right and below, so the "down" label's line
       comes in across empty sky instead of straight through the apple. */
    var alive = earth * (1 - into(t, scene.first + 3));
    if (alive > 0 && cEvery != null) {
      var things = [["\u{1F34E}", 325], ["⚽", 30], ["\u{1F45F}", 95]], rr = 119 * kl;
      for (var k = 0; k < things.length; k++) {
        var a = things[k][1] * Math.PI / 180, ox = lcx + rr * Math.cos(a), oy = cy + rr * Math.sin(a);
        var p = popIn(t, gfAt(cEvery, k * 0.3), 0.36) * alive;
        if (p <= 0) continue;
        out += MK.pop(Em(ox, oy, 52, things[k][0]), ox, oy, p);
        out += MK.arrow(ox - 34 * Math.cos(a), oy - 34 * Math.sin(a), ox - 74 * Math.cos(a), oy - 74 * Math.sin(a),
          on(t, gfAt(cEvery, 0.25 + k * 0.3), 0.4) * alive, P.gold, 6);
      }
    }
    /* the centre of the Earth: the lesson's own white dot, lit */
    var ce = Math.min(1, on(t, cCentre1, 0.5) + on(t, cCentre2, 0.5) + on(t, cCentre4, 0.5));
    out += MK.glow(lcx, cy, 40 * kl, P.gold, ce * earth);
    out += MK.ripple(lcx, cy, t, cCentre2, P.gold);
    if (slide > 0) out += MK.glow(rcx, cy, 38, P.gold, on(t, cCentre4, 0.5) * slide);

    /* beat 3: that is what down means - the line lands on the lesson's own red
       arrow, between the child's feet and the centre */
    var three = gfOnly(t, scene, 2);
    if (three > 0) out += G(gfLabel(t, 258, 132, "down", cDown, [lcx - 9, ly(98)], 28, P.gold, "middle"), { opacity: three });

    /* beats 4 and 5: the other side of the world */
    if (slide > 0) {
      out += Tx(lcx, 46, "here", "lab big", "middle", { opacity: slide });
      out += Tx(rcx, 46, "the other side of the world", "lab big", "middle", { opacity: slide });
      var wy = on(t, cWay, 0.5);
      out += MK.glow(rcx, gfGY(198), 44, "#F0806F", Math.min(1, wy + on(t, cStand, 0.5)) * (0.6 + 0.4 * breathe(t)) * slide);
      out += G(gfLabel(t, 1070, 258, "down", cWay, [rcx + 9, gfGY(198)], 28, P.gold, "middle"), { opacity: slide });
      /* the child there is not upside down */
      out += MK.pill(1046, 388, "upside down", on(t, cNot, 0.4), { size: 24, col: P.muted, ink: P.muted });
      out += MK.cross(906, 388, 27, popIn(t, gfAt(cNot, 0.25), 0.35));
      /* wherever you stand, down points to the centre */
      out += MK.pill(584, 392, "down is to the centre", on(t, cCentre4, 0.45), { size: 26, col: P.gold });
    }
    return svg(out);
  }

  /* ==== chapter: friction ======================================================
     A red block on a wooden floor, as the lesson's own friction sim draws one,
     pushed once and slowing to a stop; then a close-up of the two surfaces that
     rub. The three surfaces themselves are the next chapter, where the lesson's
     own drawing does the work. */
  var GF_FLOOR = 326, GF_BW = 76, GF_BH = 66;

  /* the lesson's red block, standing ON the line `base` (the floor by default).
     It was 50 x 44 on a 16 px plank in a 1168 x 440 box, which read as a dot on
     a wire; and the pair of cards in the next chapter drew it half sunk into
     its own slab, because it had no base of its own to stand on. */
  function gfBlock(x, o, base) {
    if (!(o > 0)) return "";
    var b = base == null ? GF_FLOOR : base;
    return G(R(x, b - GF_BH, GF_BW, GF_BH, 10, "#D9473F") +
      R(x + 9, b - GF_BH + 9, GF_BW - 18, 12, 6, "#EE7A70"), { opacity: clamp(o, 0, 1) });
  }
  /* a saw edge along y, teeth h px towards `up`, shifted dx along */
  function gfSaw(x0, x1, y, h, dx, col, o) {
    if (!(o > 0)) return "";
    var d = "", w = 15;
    for (var x = x0; x + w <= x1; x += w) {
      d += "M" + n2(x + dx) + "," + n2(y) + " L" + n2(x + w / 2 + dx) + "," + n2(y - h) + " L" + n2(x + w + dx) + "," + n2(y);
    }
    return Pth(d, null, col, 4, { opacity: clamp(o, 0, 1) });
  }

  function gfFrictionChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cPush = c(0, "push"), cSlows = c(0, "slows"), cStops = c(0, "stops");
    var cWhat = c(1, "what"), cFric = c(1, "friction");
    var cForce = c(2, "force"), cSurf = c(2, "surfaces"), cRub = c(2, "rub");
    var cBack = c(3, "back"), cHard = c(3, "harder");
    var out = "";

    var x0 = 150, x1 = 556, x2 = 842;
    var s1 = gfSlide(t, gfAt(cPush, 0.3), gfAt(cStops, -0.15));
    var s2 = gfSlide(t, gfAt(cBack, 0.2), gfAt(cHard, 0.7));
    var bx = s2 > 0 ? lerp(x1, x2, s2) : lerp(x0, x1, s1);

    out += R(70, GF_FLOOR, 1028, 22, 11, "#C9A26B");
    out += R(70, GF_FLOOR, 1028, 6, 3, "#E0BE8A");
    out += gfBlock(bx, on(t, cPush, 0.3));

    /* ---- beat 1: push it, and it slows down and stops ------------------------- */
    var one = gfOnly(t, scene, 0);
    if (one > 0) {
      var inner = "", po = on(t, cPush, 0.35), sp = popIn(t, cStops, 0.4);
      inner += MK.arrow(bx - 144, GF_FLOOR - 33, bx - 14, GF_FLOOR - 33, po * (1 - s1), P.teal, 10);
      var moving = 4 * s1 * (1 - s1);
      for (var k = 0; k < 3; k++)
        inner += L(bx - 18 - k * 28, GF_FLOOR - 50 - k * 13, bx - 52 - k * 28, GF_FLOOR - 50 - k * 13, P.muted, 5, { opacity: moving * 0.9 });
      /* how far it has come: a dashed trail from where it was pushed, and a
         mark at the start, so beat 1 is never an empty floor with a block on it */
      inner += L(x0, GF_FLOOR + 32, Math.max(x0, bx), GF_FLOOR + 32, P.muted, 3, { opacity: po * 0.7, "stroke-dasharray": "9 8" });
      inner += L(x0, GF_FLOOR + 22, x0, GF_FLOOR + 42, P.muted, 3, { opacity: po * 0.7 });
      inner += L(bx, GF_FLOOR + 22, bx, GF_FLOOR + 42, P.muted, 3, { opacity: po * 0.7 });
      /* "slowing" stays up for the whole slow-down, and gives way to "it stops"
         only when that word is said: at 70% of this line the pill used to have
         faded with the block's speed and left nothing on screen */
      inner += MK.pill(bx + 38, 178, "slowing", on(t, cSlows, 0.4) * (1 - Math.min(1, sp)), { size: 28, col: P.muted, ink: P.muted });
      inner += MK.pop(MK.pill(bx + 38, 178, "it stops", 1, { size: 30, col: P.gold }), bx + 38, 178, sp);
      inner += L(bx + GF_BW + 14, GF_FLOOR - 86, bx + GF_BW + 14, GF_FLOOR - 2, P.gold, 5, { opacity: Math.min(1, sp) });
      out += G(inner, { opacity: one });
    }

    /* ---- beat 2: what made it stop? friction did -------------------------------- */
    var two = gfOnly(t, scene, 1);
    if (two > 0) {
      var in2 = MK.qmark(bx + 38, 172, 44, on(t, cWhat, 0.4));
      in2 += gfRub(bx + 4, bx + GF_BW - 4, GF_FLOOR, on(t, cFric, 0.4), 0, P.gold);
      in2 += gfLabel(t, 292, 252, "friction", cFric, [bx + 10, GF_FLOOR - 6], 30, P.gold, "middle");
      out += G(in2, { opacity: two });
    }

    /* ---- beat 3: a force between two surfaces that rub ------------------------ */
    var three = gfOnly(t, scene, 2);
    if (three > 0) {
      var cp = popIn(t, cForce, 0.45), in3 = "";
      var dx = cRub == null ? 0 : 13 * on(t, cRub, 0.4) * Math.sin((t - cRub) * 6.5);
      in3 += R(660, 28, 460, 230, 22, P.card, P.line, 2);
      in3 += G(R(800, 96, 300, 44, 8, "#D9473F") + gfSaw(802, 1098, 140, -18, 0, "#B03A33", 1), { transform: tr(dx, 0) });
      in3 += R(800, 186, 300, 44, 8, "#C9A26B") + gfSaw(802, 1098, 186, 18, 0, "#96733F", 1);
      in3 += gfSaw(802, 1098, 165, 9, 0, P.gold, bump(t, cRub, 1.6) * 0.9 + (cRub != null && t > cRub ? 0.35 : 0));
      var su = on(t, cSurf, 0.4);
      in3 += Tx(790, 124, "surface", "lab mid gold", "end", { opacity: su });
      in3 += Tx(790, 214, "surface", "lab mid gold", "end", { opacity: su });
      in3 += MK.leader(bx + GF_BW - 4, GF_FLOOR - 10, 676, 250, on(t, cForce, 0.7), P.gold);
      out += G(in3, { opacity: three * Math.min(1, cp) });
    }

    /* ---- beat 4: it pushes back, and moving is harder ------------------------- */
    var four = gfOnly(t, scene, 3);
    if (four > 0) {
      var in4 = "";
      in4 += MK.arrow(bx - 144, GF_FLOOR - 33, bx - 14, GF_FLOOR - 33, on(t, cBack, 0.35), P.teal, 10);
      /* friction pushes BACK: a short gold arrow at the rubbing line, against
         the way the block is going, rather than one long enough to cross it */
      in4 += MK.arrow(bx + GF_BW + 100, GF_FLOOR - 18, bx + GF_BW + 8, GF_FLOOR - 18, on(t, cBack, 0.5), P.gold, 10);
      in4 += MK.pill(bx + 38, 178, "friction", on(t, cBack, 0.45), { size: 28, col: P.gold });
      in4 += gfRub(bx + 4, bx + GF_BW - 4, GF_FLOOR, on(t, cBack, 0.4), 3 * Math.sin(t * 14), P.gold);
      in4 += MK.pill(326, 120, "moving is harder", on(t, cHard, 0.45), { size: 32, col: P.gold });
      out += G(in4, { opacity: four });
    }
    return svg(out);
  }
