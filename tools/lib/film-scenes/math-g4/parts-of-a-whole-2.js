  /* ==== Parts of a Whole, part 2 =============================================
     tools/lib/film-scenes/math-g4/parts-of-a-whole-2.js. The two sharing
     chapters: "A fraction is a division" (the lesson's 3 cakes between 4
     children) and "A fraction of an amount" (its one fifth of 20).

     Both are cut equally by arithmetic rather than by eye. A cake's quarter is
     a 90 degree wedge, four of them from 0, 90, 180 and 270, so three cakes
     hold exactly twelve; and the twenty counters are dealt one at a time round
     five groups, counter i to group i % 5, so every group ends with four and
     the picture cannot drift from what the voice says. */

  /* ---- a quarter of a cake ------------------------------------------------
     the wedge whose first edge is at a0 degrees, always a quarter turn wide */
  function pwWedge(cx, cy, r, a0, o, cut) {
    if (!(o > 0)) return "";
    var r0 = (a0 * Math.PI) / 180, r1 = ((a0 + 90) * Math.PI) / 180;
    var d = "M" + n2(cx) + "," + n2(cy) +
      " L" + n2(cx + r * Math.cos(r0)) + "," + n2(cy + r * Math.sin(r0)) +
      " A" + n2(r) + "," + n2(r) + " 0 0,1 " + n2(cx + r * Math.cos(r1)) + "," + n2(cy + r * Math.sin(r1)) + " Z";
    return Pth(d, ART.C.goldSoft, ART.C.ink, Math.max(0.01, 3 * clamp(cut, 0, 1)), { opacity: clamp(o, 0, 1) });
  }

  /* ==== chapter: a fraction is a division ====================================
     Three cakes, four children, twelve quarters. Every quarter travels from
     its cake to a child, one at a time, and the three that land on each child
     assemble into three quarters of a circle: the answer, drawn rather than
     asserted. */
  var PW_CAKE = { y: 104, r: 64, x: [330, 515, 700] };
  var PW_KID = { y: 336, size: 74, x: [230, 420, 610, 800], ay: 226, ar: 44 };

  function pwDivideChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cCakes = c(0, "cakes"), cKids = c(0, "kids");
    var cCut = c(1, "cut"), cTwelve = c(1, "twelve");
    var cShare = c(2, "share");
    var cEach = c(3, "each");
    var cDiv = c(4, "div"), cTop = c(4, "top");
    var out = "", k, j;

    /* the plates, and the children */
    /* a plate empties as its own four quarters leave it, and is gone once they
       have: three white discs left standing would be three cakes that were
       never shared */
    function pwPlate(k) {
      var last = cShare == null ? null : cShare + (k * 4 + 3) * 0.085 + 0.55;
      return popIn(t, cCakes == null ? null : cCakes + k * 0.16, 0.4) * (1 - on(t, last, 0.5));
    }
    for (k = 0; k < 3; k++) {
      var po = pwPlate(k);
      if (po > 0) out += G(C(PW_CAKE.x[k], PW_CAKE.y, PW_CAKE.r + 11, ART.C.card, ART.C.line, 3),
        { transform: around(PW_CAKE.x[k], PW_CAKE.y, Math.min(1, po)), opacity: Math.min(1, po) });
    }
    for (j = 0; j < 4; j++) {
      var ko = popIn(t, cKids == null ? null : cKids + j * 0.14, 0.4);
      if (ko > 0) out += MK.pop(Em(PW_KID.x[j], PW_KID.y, PW_KID.size, "\u{1F9D2}"), PW_KID.x[j], PW_KID.y, ko);
    }

    /* the twelve quarters. Quarter q is wedge q % 4 of cake floor(q / 4); it
       travels to child q % 4 and takes slot floor(q / 4) there - dealt one at a
       time, so each of the four children ends with exactly three. */
    var cutU = on(t, cCut, 0.6), cakeO = popIn(t, cCakes, 0.4);
    for (k = 0; k < 12; k++) {
      var cake = Math.floor(k / 4), wedge = k % 4;
      var kid = k % 4, slot = Math.floor(k / 4);
      var dep = cShare == null ? null : cShare + k * 0.085;
      var u = dep == null ? 0 : clamp((t - dep) / 0.55, 0, 1);
      var o = Math.min(1, popIn(t, cCakes == null ? null : cCakes + cake * 0.16, 0.4));
      if (!(o > 0)) continue;
      var cx = lerp(PW_CAKE.x[cake], PW_KID.x[kid], ease(u));
      var cy = lerp(PW_CAKE.y, PW_KID.ay, ease(u)) - 46 * Math.sin(Math.PI * u);
      var rr = lerp(PW_CAKE.r, PW_KID.ar, ease(u));
      var a0 = lerp(wedge * 90 - 90, slot * 90 - 90, ease(u));
      out += pwWedge(cx, cy, rr, a0, o, Math.max(cutU, u));
    }
    /* the circle round a cake that is still whole */
    for (k = 0; k < 3; k++) {
      var whole = 1 - (cShare == null ? 0 : clamp((t - cShare) / 0.4, 0, 1));
      var co = pwPlate(k) * whole;
      if (co > 0) out += C(PW_CAKE.x[k], PW_CAKE.y, PW_CAKE.r, "none", ART.C.ink, 3.5, { opacity: Math.min(1, co) });
    }

    /* what the picture is, while it is being said */
    out += MK.pill(515, 206, "3 cakes", on(t, cCakes, 0.4) * pwOnly(t, scene, 0), { size: 24, col: P.gold });
    out += MK.pill(515, 414, "4 children", on(t, cKids, 0.4) * pwOnly(t, scene, 0), { size: 24, col: P.gold });
    out += MK.pill(515, 206, "12 quarters", on(t, cTwelve, 0.4) * pwOnly(t, scene, 1), { size: 24, col: P.gold });

    /* "Each child gets three quarters of a cake" */
    for (j = 0; j < 4; j++) {
      var go = popIn(t, cEach == null ? null : cEach + j * 0.18, 0.4);
      if (go > 0) out += pwGlyph(PW_KID.x[j], 410, 3, 4, 26, P.gold, Math.min(1, go));
    }

    /* the division, written: 3 divided by 4 is three quarters */
    var dv = on(t, cDiv, 0.5);
    if (dv > 0) {
      out += Tx(430, 124, "3 ÷ 4 =", "lab huge", "middle", { opacity: dv, fill: P.ink });
      out += pwGlyph(600, 102, 3, 4, 56, P.gold, on(t, cDiv == null ? null : cDiv + 0.35, 0.5));
    }
    /* "the cakes go on top": the top number is the cakes, the bottom the children */
    var tp = on(t, cTop, 0.4), tp2 = on(t, cTop == null ? null : cTop + 0.35, 0.4);
    if (tp > 0) {
      out += MK.leader(716, 68, 638, 78, tp, P.gold);
      out += MK.pill(764, 68, "cakes", tp, { size: 22, col: P.gold, anchor: "start" });
    }
    if (tp2 > 0) {
      out += MK.leader(716, 168, 640, 150, tp2, P.muted);
      out += MK.pill(764, 168, "children", tp2, { size: 22, col: P.line, anchor: "start" });
    }
    return svg(out);
  }

  /* ==== chapter: a fraction of an amount =====================================
     One fifth of 20, the lesson's own numbers. Twenty counters are dealt round
     five groups, one at a time - counter i to group i % 5 - so each group holds
     four when the dealing stops, and one group is the answer. */
  var PW_G = { n: 5, w: 168, h: 170, y: 200, gap: 24 };
  PW_G.x0 = (1168 - (PW_G.n * PW_G.w + (PW_G.n - 1) * PW_G.gap)) / 2;
  function pwGroupX(g) { return PW_G.x0 + g * (PW_G.w + PW_G.gap); }
  /* where counter i sits before it is shared: 10 across, 2 down */
  function pwHome(i) { return [386 + (i % 10) * 44, i < 10 ? 72 : 116]; }
  /* and after: group i % 5, slot floor(i / 5), two by two in its box */
  function pwSeat(i) {
    var g = i % 5, s = Math.floor(i / 5);
    return [pwGroupX(g) + PW_G.w / 2 + (s % 2 ? 42 : -42), PW_G.y + 85 + (s > 1 ? 38 : -38)];
  }

  function pwAmountChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cUnit = c(0, "unit"), cFind = c(0, "find");
    var cBottom = c(1, "bottom"), cMake = c(1, "make");
    var cShare = c(2, "share"), cHolds = c(2, "holds");
    var cOne = c(3, "one"), cAns = c(3, "ans");
    var cNot = c(4, "not"), cGroups = c(4, "groups");
    var out = "", k;

    /* the unit fraction itself, top left */
    out += pwGlyph(95, 92, 1, 5, 56, P.teal, popIn(t, cUnit, 0.45));
    out += Tx(95, 196, "of 20", "lab big", "middle", { opacity: on(t, cFind, 0.45), fill: P.ink });

    /* "The bottom number": the 5 underneath is ringed */
    var bo = on(t, cBottom, 0.45) * pwOnly(t, scene, 1);
    if (bo > 0) out += C(95, 144, 26, "none", P.gold, 4, { opacity: bo });

    /* five equal groups, appearing one at a time */
    for (k = 0; k < 5; k++) {
      var go = popIn(t, cMake == null ? null : cMake + k * 0.13, 0.4);
      if (!(go > 0)) continue;
      var gx = pwGroupX(k), lit = k === 0 ? on(t, cOne, 0.4) : 0;
      out += G(R(gx, PW_G.y, PW_G.w, PW_G.h, 18, ART.C.card, lit > 0.5 ? P.gold : ART.C.line, lit > 0.5 ? 5 : 3),
        { transform: around(gx + PW_G.w / 2, PW_G.y + PW_G.h / 2, Math.min(1, go)) });
      /* "Each group holds four" */
      out += Tx(gx + PW_G.w / 2, PW_G.y + PW_G.h - 16, "4", "lab big", "middle",
        { opacity: on(t, cHolds == null ? null : cHolds + k * 0.1, 0.4), fill: ART.C.ink });
    }

    /* the twenty counters, dealt out one at a time */
    for (k = 0; k < 20; k++) {
      var o = popIn(t, cFind == null ? null : cFind + k * 0.035, 0.35);
      if (!(o > 0)) continue;
      var dep = cShare == null ? null : cShare + k * 0.055;
      var u = dep == null ? 0 : clamp((t - dep) / 0.5, 0, 1);
      var a = pwHome(k), b = pwSeat(k);
      var cx = lerp(a[0], b[0], ease(u)), cy = lerp(a[1], b[1], ease(u));
      var rr = lerp(17, 22, ease(u));
      out += C(cx, cy, rr * Math.min(1, o), ART.C.accent);
    }

    /* "One group is the answer" */
    out += MK.pill(680, 95, "one fifth of 20 is 4", on(t, cAns, 0.45) * pwFrom(t, scene, 3),
      { size: 30, col: P.gold, ink: P.ink });

    /* "It is not 5" */
    var nt = popIn(t, cNot, 0.4);
    if (nt > 0) {
      out += MK.pill(956, 100, "5", Math.min(1, nt), { size: 30, col: P.bad });
      out += MK.cross(1040, 100, 26, popIn(t, cNot == null ? null : cNot + 0.3, 0.35));
    }
    /* "how many groups": a rule under all five, and what it counts */
    var gr = on(t, cGroups, 0.55);
    if (gr > 0) {
      var x0 = pwGroupX(0), x1 = pwGroupX(4) + PW_G.w;
      out += L(x0, 386, lerp(x0, x1, gr), 386, P.gold, 4, { opacity: gr });
      out += MK.pill(584, 412, "5 groups", on(t, cGroups == null ? null : cGroups + 0.3, 0.4), { size: 24, col: P.gold });
    }
    return svg(out);
  }
