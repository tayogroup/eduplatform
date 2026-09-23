  /* ==== part 4 of 4: "Baking", "Safe with heat" and the recap ==================
     tools/lib/film-scenes/science-g2/changing-materials-4.js.

     Baking is the lecture's fourth part: the same oven twice, with the dough
     the lesson names and then its cake mix, so the child sees that baking does
     the same thing to both. Safe with heat is the lesson's Safe hands step, its
     five rules in its own order and its own words, each one shown on the left
     as it is said and ticked on the right - including its misconception, that a
     pan which has stopped steaming is cool. */

  /* an oven, front on, its glass door lit while it bakes; `inside` is drawn
     behind the glass, in the window's own box */
  var CM_OVEN = { x: 398, y: 74, w: 344, h: 272 };
  var CM_WIN = { x: CM_OVEN.x + 28, y: CM_OVEN.y + CM_OVEN.h * 0.27, w: CM_OVEN.w - 56, h: CM_OVEN.h * 0.55 };
  function cmOven(glow, t, inside) {
    var x = CM_OVEN.x, y = CM_OVEN.y, w = CM_OVEN.w, h = CM_OVEN.h, out = "";
    out += R(x, y, w, h, 18, CM.steel, CM.steelDark, 5);
    out += R(x + 16, y + h * 0.05, w - 32, h * 0.16, 11, "#8E9BA8", CM.steelDark, 3);
    out += C(x + 50, y + h * 0.13, 14, CM.handle, "#4A5560", 3) + L(x + 50, y + h * 0.13, x + 50, y + h * 0.13 - 11, "#E3E9EE", 4);
    out += C(x + 92, y + h * 0.13, 14, CM.handle, "#4A5560", 3) + L(x + 92, y + h * 0.13, x + 100, y + h * 0.13 - 8, "#E3E9EE", 4);
    out += R(CM_WIN.x, CM_WIN.y, CM_WIN.w, CM_WIN.h, 14, cmMix("#0E2434", "#5A3418", glow), "#4A5560", 6);
    out += inside || "";
    if (glow > 0) out += MK.glow(CM_WIN.x + CM_WIN.w / 2, CM_WIN.y + CM_WIN.h / 2, CM_WIN.w * 0.46, P.gold, glow * 0.75);
    out += R(CM_WIN.x + 6, CM_WIN.y + 6, CM_WIN.w - 12, CM_WIN.h - 12, 10, "none", "rgba(255,255,255,0.18)", 3);
    out += R(x + 20, y + h * 0.92, w - 40, h * 0.05, 7, CM.handle);
    return out;
  }

  /* ==== Baking =================================================================
     The same oven twice: the dough of the lecture's fourth part, then the cake
     mix of its last line. Left to right - what goes in, the oven, what comes
     out - and then the way back, which stops. */
  KINDS.bake = function (scene, beat, t, i) {
    var IN = { cx: CM_WIN.x + CM_WIN.w / 2, cy: CM_WIN.y + CM_WIN.h / 2 };

    /* o: {startAt, inAt (it goes in), outAt (it comes out), newAt, backAt;
           raw (cx, by), baked (cx, by, u), out (cx, cy, s) -> markup} */
    function ovenScene(o) {
      var gone = on(t, o.inAt, 0.7), glow = on(t, o.inAt, 0.6);
      var bake = Math.max(on(t, o.inAt == null ? null : o.inAt + 0.5, 1.2), on(t, o.outAt, 0.3));
      var res = "";
      /* what goes in, on its board; a ghost of it stays, for the way back */
      res += G(o.raw(224, 296), { opacity: popIn(t, o.startAt, 0.5) * lerp(1, 0.55, gone) });
      res += MK.arrow(300, 250, 380, 250, on(t, o.inAt, 0.5) * (1 - on(t, o.inAt == null ? null : o.inAt + 1.0, 0.6)), P.gold, 9);
      res += cmOven(glow, t, G(o.baked(IN.cx, IN.cy + 54, bake), { opacity: gone * (1 - on(t, o.outAt, 0.5)) }));
      /* and what comes out, beside it */
      var op = popIn(t, o.outAt, 0.5);
      res += MK.arrow(760, 250, 848, 250, on(t, o.outAt, 0.5), P.gold, 9);
      if (op > 0) {
        res += MK.glow(960, 244, 132, P.gold, on(t, o.newAt, 0.6) * 0.8);
        res += G(o.out(960, 244, 150), { opacity: Math.min(1, op), transform: around(960, 244, Math.min(1.06, op)) });
      }
      /* the way back, stopped: a baked thing does not go back */
      var bo = on(t, o.backAt, 0.8);
      if (bo > 0) {
        var q0 = [890, 352], q1 = [592, 428], q2 = [294, 352];
        res += cmBow(q0, q1, q2, bo * 0.42, P.teal, 8);
        var stop = cmBowAt(q0, q1, q2, 0.42);
        var vp = popIn(t, o.backAt == null ? null : o.backAt + 0.5, 0.4);
        if (vp > 0) res += C(stop[0], stop[1], 26, P.ground, null, null, { opacity: Math.min(1, vp) }) + MK.cross(stop[0], stop[1], 23, vp);
      }
      return res;
    }

    function loaf() {
      return ovenScene({
        startAt: sc(scene, 0, "dough"), inAt: sc(scene, 0, "oven"), outAt: sc(scene, 0, "bread"),
        newAt: sc(scene, 1, "new"), backAt: sc(scene, 1, "back"),
        raw: function (cx, by) { return cmPlate(cx, by + 8, 102) + cmDough(cx, by, 164, 0); },
        baked: function (cx, by, u) { return cmPlate(cx, by + 8, 92) + cmDough(cx, by, 148, u); },
        out: function (cx, cy, s) { return MK.pic(cx, cy, s, "\u{1F35E}"); }
      });
    }

    function cake() {
      return ovenScene({
        startAt: sc(scene, 2, "mix"), inAt: sc(scene, 2, "runny"), outAt: sc(scene, 2, "cake"),
        newAt: sc(scene, 3, "baked"), backAt: sc(scene, 3, "back"),
        raw: function (cx, by) { return cmTin(cx, by + 18, 182, 0); },
        baked: function (cx, by, u) { return cmTin(cx, by + 18, 164, u); },
        out: function (cx, cy, s) { return MK.pic(cx, cy, s, "\u{1F370}"); }
      });
    }

    return svg(cmPhased(t, i, scene, [0, 2], function (n) { return n === 0 ? loaf() : cake(); }));
  };

  /* ==== Safe with heat ========================================================= */
  /* a pan seen from the side, standing on (cx, by); hot warms it, steam rises */
  function cmPanSide(cx, by, w, t, hot, steam) {
    var h = w * 0.3, out = "";
    out += R(cx + w * 0.46, by - h - 10, w * 0.5, 13, 6, CM.handle, "#4A5560", 2);
    out += Pth("M" + n2(cx - w / 2) + "," + n2(by - h) + " L" + n2(cx + w / 2) + "," + n2(by - h) +
      " L" + n2(cx + w * 0.4) + "," + n2(by) + " Q" + n2(cx) + "," + n2(by + h * 0.5) + " " + n2(cx - w * 0.4) + "," + n2(by) + " Z", CM.steelDark, "#4A5560", 3);
    out += E(cx, by - h, w / 2, h * 0.24, CM.steel, "#4A5560", 3);
    if (hot > 0) out += MK.glow(cx, by - h * 0.2, w * 0.62, P.accent, hot * 0.9) + cmWarm(cx, by - h - 16, t, hot);
    if (steam > 0) out += cmWisps(cx, by - h - 26, t, steam, 3);
    return out;
  }
  /* a head, its hair loose or tied back; tied 0 -> 1 gathers it */
  function cmHead(cx, cy, s, tied) {
    var r = s * 0.32, u = clamp(tied, 0, 1), out = "";
    out += G(E(cx - r * 1.02, cy + r * 0.62, r * 0.36, r * 1.02, CM.hair) + E(cx + r * 1.02, cy + r * 0.62, r * 0.36, r * 1.02, CM.hair), { opacity: 1 - u });
    out += C(cx, cy, r, CM.skin, CM.skinDark, 3);
    out += Pth("M" + n2(cx - r) + "," + n2(cy - r * 0.12) + " a" + n2(r) + "," + n2(r) + " 0 0 1 " + n2(2 * r) + ",0 q" + n2(-r) + "," + n2(-r * 0.5) + " " + n2(-2 * r) + ",0 Z", CM.hair);
    out += C(cx - r * 0.36, cy + r * 0.06, r * 0.1, "#2A1A12") + C(cx + r * 0.36, cy + r * 0.06, r * 0.1, "#2A1A12");
    out += Pth("M" + n2(cx - r * 0.3) + "," + n2(cy + r * 0.46) + " q" + n2(r * 0.3) + "," + n2(r * 0.22) + " " + n2(r * 0.6) + ",0", null, CM.skinDark, 3);
    /* the ponytail, behind the head */
    out += G(C(cx + r * 1.2, cy - r * 0.18, r * 0.3, CM.hair) + E(cx + r * 1.5, cy + r * 0.34, r * 0.22, r * 0.62, CM.hair) +
      R(cx + r * 0.9, cy - r * 0.34, r * 0.22, r * 0.34, 4, P.gold), { opacity: u });
    return out;
  }

  KINDS.safe = function (scene, beat, t, i) {
    var hurtAt = sc(scene, 0, "hurt"), grownAt = sc(scene, 0, "grown"), watchAt = sc(scene, 0, "watch");
    var leaveAt = sc(scene, 1, "leave"), moveAt = sc(scene, 1, "move"), glovesAt = sc(scene, 1, "gloves");
    var neverAt = sc(scene, 2, "never"), testAt = sc(scene, 2, "test"), askAt = sc(scene, 2, "ask");
    var hairAt = sc(scene, 3, "hair"), sleevesAt = sc(scene, 3, "sleeves");
    var steamAt = sc(scene, 4, "steam"), hotAt = sc(scene, 4, "hot"), waitAt = sc(scene, 4, "wait");
    var changesAt = sc(scene, 5, "changes"), rulesAt = sc(scene, 5, "rules");
    var CARD = { x: 50, y: 66, w: 500, h: 324 };
    var cx = CARD.x + CARD.w / 2, cy = CARD.y + CARD.h / 2;
    var out = R(CARD.x, CARD.y, CARD.w, CARD.h, 26, P.card, P.line, 2);

    /* the five rules, in the lesson's order and its own words */
    out += MK.list(614, 112, [
      { text: "a grown-up handles the heat", at: grownAt, mark: "tick", markAt: watchAt },
      { text: "leave it for a grown-up", at: leaveAt, mark: "tick", markAt: glovesAt },
      { text: "never touch to test", at: neverAt, mark: "tick", markAt: askAt },
      { text: "hair tied back", at: hairAt, mark: "tick", markAt: sleevesAt },
      { text: "wait for it to cool", at: steamAt, mark: "tick", markAt: waitAt }
    ], t, { cls: "lab", lh: 62, markR: 18 });
    if (rulesAt != null) out += MK.glow(830, 236, 188, P.good, on(t, rulesAt, 0.6) * 0.7);

    /* one rule at a time, on the card */
    var k0 = cmOnly(t, scene, 0);
    if (k0 > 0.004) out += G(cmPanSide(322, 330, 150, t, on(t, hurtAt, 0.5), 0) +
      cmFlames(322, 348, 44, t, on(t, hurtAt, 0.5), 3) +
      G(MK.pic(168, 214, 124, "\u{1F9D1}‍\u{1F373}"), { opacity: n2(popIn(t, grownAt, 0.5)) }) +
      G(MK.pic(452, 224, 92, "\u{1F9D2}"), { opacity: n2(popIn(t, watchAt, 0.5)) }), { opacity: k0 });

    var k1 = cmOnly(t, scene, 1);
    if (k1 > 0.004) out += G(cmPanSide(392, 316, 140, t, on(t, leaveAt, 0.5), 0) +
      MK.arrow(268, 268, 344, 292, on(t, moveAt, 0.55), P.gold, 8) +
      G(MK.pic(190, 236, 128, "\u{1F9E4}"), { opacity: n2(popIn(t, glovesAt, 0.5)) }), { opacity: k1 });

    var k2 = cmOnly(t, scene, 2);
    if (k2 > 0.004) {
      var reach = on(t, testAt, 0.6) * (1 - on(t, askAt, 0.5));
      out += G(cmPanSide(392, 320, 140, t, 1, 0) +
        G(MK.pic(196, 246, 118, "✋"), { opacity: n2(popIn(t, neverAt, 0.5)), transform: "translate(" + n2(62 * reach) + ",0)" }) +
        MK.cross(322, 176, 40, popIn(t, testAt, 0.45) * (1 - on(t, askAt, 0.5))) +
        MK.tick(322, 176, 40, popIn(t, askAt, 0.45)), { opacity: k2 });
    }

    var k3 = cmOnly(t, scene, 3);
    if (k3 > 0.004) {
      /* The arm is on screen from the start of the beat with its sleeve LONG,
         as the hair is on screen loose, because "roll up your sleeves" is the
         rolling: an arm that fades in on the cue while the sleeve is already
         halfway up never shows the child the long sleeve it started from. So
         only `sl` moves, and the arm itself carries the beat's own opacity. */
      var sl = on(t, sleevesAt, 0.7);
      out += G(cmHead(228, 218, 200, on(t, hairAt, 0.8)) +
        R(400, 238, 36, 106, 18, CM.skin, CM.skinDark, 3) +
        /* the thumb first and the hand OVER it, so what shows is the bit that
           sticks out of the hand: a thumb drawn beside the hand, with its own
           outline all the way round, reads as a ball hanging off the arm */
        C(393, 341, 11, CM.skin, CM.skinDark, 3) + C(418, 352, 29, CM.skin, CM.skinDark, 3) +
        R(392, 224, 52, n2(98 - 56 * sl), 14, CM.shirt, CM.shirtDark, 3) +
        R(388, n2(308 - 56 * sl), 60, 15, 7, CM.shirtDark), { opacity: k3 });
    }

    var k4 = cmOnly(t, scene, 4);
    if (k4 > 0.004) {
      var stop = on(t, steamAt, 0.6);
      out += G(cmPanSide(300, 322, 150, t, on(t, hotAt, 0.5), 0.9 * (1 - stop)) +
        G(MK.pic(474, 176, 86, "⏳"), { opacity: n2(popIn(t, waitAt, 0.5)) }) +
        MK.pill(300, 128, "still hot", popIn(t, hotAt, 0.45), { size: 24, col: P.bad, ink: P.ink }), { opacity: k4 });
    }

    var k5 = cmOnly(t, scene, 5);
    if (k5 > 0.004) {
      /* what heat changed in this film, on "Heat changes materials" */
      var changed = "";
      [function (px) { return cmIconCooked(px, 164, 150); },
       function (px) { return cmIconAsh(px, 152, 88, t); },
       function (px) { return MK.pic(px, 164, 78, "\u{1F35E}"); }].forEach(function (f, n) {
        var px = 176 + n * 124, p = popIn(t, changesAt == null ? null : changesAt + n * 0.16, 0.4);
        if (p > 0) changed += G(f(px), { transform: around(px, 164, Math.min(1.08, p)), opacity: Math.min(1, p) });
      });
      /* and the five rules that keep hands safe */
      var row = "";
      [["\u{1F9D1}‍\u{1F373}", 0], ["\u{1F9E4}", 1], ["✋", 2], [null, 3], ["⏳", 4]].forEach(function (q, n) {
        var px = 128 + n * 86, p = popIn(t, rulesAt == null ? null : rulesAt + n * 0.15, 0.4);
        if (!(p > 0)) return;
        row += G(q[0] == null ? cmHead(px, 286, 82, 1) : MK.pic(px, 286, 66, q[0]), { transform: around(px, 286, Math.min(1.08, p)), opacity: Math.min(1, p) });
        row += MK.tick(px, 348, 17, p);
      });
      out += G(MK.glow(cx, 164, 156, P.gold, on(t, changesAt, 0.6) * 0.7) + changed +
        MK.glow(cx, 300, 134, P.good, on(t, rulesAt, 0.6) * 0.7) + row, { opacity: k5 });
    }
    return svg(out);
  };

  /* ==== What you now know ====================================================== */
  KINDS.recap = MK.recapKind([
    { beat: 0, at: "same", title: "Same material", sub: "melting and freezing", pic: function (cx, cy, s, t) { return cmIconIce(cx, cy, s * 0.92); } },
    { beat: 1, at: "new", title: "A new material", sub: "cooking, burning, baking", pic: function (cx, cy, s) { return cmIconCooked(cx, cy, s); } },
    { beat: 2, at: "predict", title: "Predict, then test", sub: "and say what happened", pic: "\u{1F9EA}" },
    { beat: 3, at: "safe", title: "Safe with heat", sub: "a grown-up handles it", pic: "\u{1F9E4}" }
  ], { goBeat: 3, goAt: "ask" });
