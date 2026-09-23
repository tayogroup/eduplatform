  /* ==== part 3 of 4: "A new material" and "Burning" ============================
     tools/lib/film-scenes/science-g2/changing-materials-3.js.

     The egg chapter is the lesson's own experiment, drawn by the lesson's own
     drawing: ART.sim("newMaterial", "draw", heat, cooled) is the pan the child
     will press Heat on three times and then Cool. The film presses it for them
     - once on "Now heat it", once on "turns white", once on "goes solid" - so
     the pan on screen is at the state the voice has just named, and the
     prediction is made first, as the lesson asks.

     Burning is the wood of the lecture's third part and the candle of the
     lesson's questions, and it ends with both of them side by side: each one
     has a way back that is stopped, because burning never goes back. */

  /* the lesson's pan, placed in the film's space (viewBox 320 x 200) */
  var CM_PAN = { x: 130, y: 66, w: 500, h: 313, k: 1.5625 };
  function cmPanX(v) { return CM_PAN.x + v * CM_PAN.k; }
  function cmPanY(v) { return CM_PAN.y + 0.25 + v * CM_PAN.k; }
  var CM_CARD = { x: 680, w: 460 };

  /* ==== A new material ========================================================= */
  KINDS.egg = function (scene, beat, t, i) {
    var eggAt = sc(scene, 0, "egg"), whiteAt = sc(scene, 0, "white"), runnyAt = sc(scene, 0, "runny");
    var predictAt = sc(scene, 1, "predict"), coolsAt = sc(scene, 1, "cools"), rawAt = sc(scene, 1, "raw");
    var heatAt = sc(scene, 2, "heat"), white2At = sc(scene, 2, "white"), solidAt = sc(scene, 2, "solid");
    var coolAt = sc(scene, 3, "cool"), staysAt = sc(scene, 3, "stays");
    var sayAt = sc(scene, 4, "say"), matchedAt = sc(scene, 4, "matched");
    var newAt = sc(scene, 5, "new"), backAt = sc(scene, 5, "back");

    function pan() {
      /* one press of Heat for each thing the voice names, then Cool */
      var heat = (t >= heatAt ? 1 : 0) + (t >= white2At ? 1 : 0) + (t >= solidAt ? 1 : 0);
      var cooled = coolAt != null && t >= coolAt;
      var out = "", p = popIn(t, eggAt, 0.5);
      out += G(ART.place(ART.sim("newMaterial", "draw", heat, cooled), CM_PAN.x, CM_PAN.y, CM_PAN.w, CM_PAN.h),
        { transform: around(cmPanX(160), cmPanY(100), Math.min(1.02, p)), opacity: Math.min(1, p) });

      /* "The egg white is runny and clear": a line to the white itself */
      var one = cmOnly(t, scene, 0);
      out += G(MK.leader(760, 168, cmPanX(215), cmPanY(118), on(t, whiteAt, 0.5), P.gold), { opacity: one });
      out += G(MK.pill(918, 168, "runny and clear", popIn(t, runnyAt, 0.4), { size: 24, col: P.gold, ink: P.ink }), { opacity: one });

      /* "Predict first": the lesson's question, asked before anything is heated */
      var pc = cmOnly(t, scene, 1);
      if (pc > 0.004) {
        out += G(R(CM_CARD.x, 132, CM_CARD.w, 196, 22, P.card, P.gold, 3, { "stroke-opacity": 0.8 }) +
          Tx(CM_CARD.x + CM_CARD.w / 2, 182, "Predict", "lab big gold", "middle") +
          MK.qmark(CM_CARD.x + CM_CARD.w / 2, 238, 30, on(t, coolsAt, 0.45)) +
          Tx(CM_CARD.x + CM_CARD.w / 2, 306, "back to raw?", "lab big", "middle", { opacity: n2(on(t, rawAt, 0.45)) }),
          { opacity: pc * popIn(t, predictAt, 0.45), transform: around(CM_CARD.x + CM_CARD.w / 2, 230, Math.min(1.02, popIn(t, predictAt, 0.45))) });
      }

      /* three presses of Heat it, one for each thing named; they go out on Cool */
      var hs = [heatAt, white2At, solidAt], lit = cmOnly(t, scene, 2) + cmOnly(t, scene, 3);
      if (lit > 0.004) for (var k = 0; k < 3; k++) {
        var px = 304 + k * 76, pk = popIn(t, hs[k], 0.35) * (1 - (cooled ? on(t, coolAt, 0.5) : 0));
        if (pk > 0) out += G(C(px, 405, 24, P.card, P.accent, 3) + MK.pic(px, 405, 28, "\u{1F525}"),
          { opacity: Math.min(1, pk) * Math.min(1, lit), transform: around(px, 405, Math.min(1.08, pk)) });
      }
      /* Cool it down: the cold over the pan, and the tick when it stays cooked */
      var co = on(t, coolAt, 0.5) * cmOnly(t, scene, 3);
      if (co > 0) {
        out += MK.glow(cmPanX(160), cmPanY(126), 160, P.blue, co * 0.9);
        out += MK.pic(cmPanX(60), cmPanY(56), 46, "❄️", { opacity: n2(co) });
        out += MK.pic(cmPanX(262), cmPanY(56), 46, "❄️", { opacity: n2(co) });
        out += MK.tick(918, 230, 44, popIn(t, staysAt, 0.45) * cmOnly(t, scene, 3));
      }

      /* "Say what happened, and whether it matched your prediction" */
      var rc = cmOnly(t, scene, 4);
      if (rc > 0.004) {
        out += G(R(CM_CARD.x, 150, CM_CARD.w, 170, 22, P.card, P.line, 2) +
          MK.list(CM_CARD.x + 22, 216, [
            { text: "Predicted: stays cooked", at: sayAt, mark: "tick", markAt: matchedAt },
            { text: "Happened: stays cooked", at: sayAt == null ? null : sayAt + 0.55, mark: "tick", markAt: matchedAt == null ? null : matchedAt + 0.3 }
          ], t, { cls: "lab", lh: 62, markR: 19 }), { opacity: rc });
      }
      return out;
    }

    function verdict() {
      var out = MK.pill(CM_AX, CM_CY - 108, "runny and clear", popIn(t, newAt, 0.4), { size: 20, col: P.line, ink: P.muted });
      out += MK.pill(CM_BX, CM_CY - 108, "white and solid", popIn(t, newAt, 0.4), { size: 20, col: P.gold, ink: P.ink });
      out += cmChange(CM_BOX.x, CM_BOX.y, CM_BOX.w, {
        size: CM_BOX.s,
        a: function (cx, cy, s) { return cmIconRaw(cx, cy, s); },
        /* both eggs sit in the pan here, as the lesson's own drawing has them:
           one pan, two states, which is the change this chapter is about */
        b: function (cx, cy, s, tt) { return G(cmIconCooked(cx, cy, s, tt, 1), { transform: around(cx, cy, 1 + 0.07 * bump(tt, newAt, 0.8)) }); },
        fwd: on(t, newAt, 0.8), word: "cooking",
        back: on(t, backAt, 0.9), backWord: "cooling",
        verdict: "cross", vp: popIn(t, backAt == null ? null : backAt + 0.55, 0.4)
      }, t);
      return out;
    }

    return svg(cmPhased(t, i, scene, [0, 5], function (n) { return n === 0 ? pan() : verdict(); }));
  };

  /* ==== Burning ================================================================
     A compact change, for the two of them side by side on the last beat:
     the first material, what it became, and a way back that is stopped. */
  function cmMini(x, y, w, a, b, word, u, vp, t) {
    if (!(u > 0.004)) return "";
    var s = 104, ax = x + s / 2, bx = x + w - s / 2, mx = (ax + bx) / 2, out = "";
    out += G(typeof a === "function" ? a(ax, y, s, t) : MK.pic(ax, y, s, a), { opacity: Math.min(1, u) });
    out += G(typeof b === "function" ? b(bx, y, s, t) : MK.pic(bx, y, s, b), { opacity: Math.min(1, u) });
    out += MK.arrow(ax + s * 0.62, y - 12, bx - s * 0.62, y - 12, Math.min(1, u), P.gold, 8);
    out += Tx(mx, y - 30, word, "lab mid gold", "middle", { opacity: n2(Math.min(1, u)) });
    /* the way back, stopped short */
    var q0 = [bx - s * 0.62, y + 26], q2 = [ax + s * 0.62, y + 26], q1 = [mx, y + 74];
    out += cmBow(q0, q1, q2, Math.min(1, u) * 0.42, P.teal, 7);
    var stop = cmBowAt(q0, q1, q2, 0.42);
    if (vp > 0) out += C(stop[0], stop[1], 22, P.ground, null, null, { opacity: Math.min(1, vp) }) + MK.cross(stop[0], stop[1], 19, vp);
    return out;
  }

  /* what the burning wax goes off as: the lesson's own words for a candle are
     "gas and smoke", and a wisp alone was too faint to say it */
  function cmAir(cx, by, t, o, rise) {
    if (!(o > 0)) return "";
    return cmWisps(cx, by, t, o, 3) + G(cmSmoke(cx, by, t + 2.4, 0, null, 1, rise || 150), { opacity: n2(0.5 * clamp(o, 0, 1)) });
  }

  KINDS.burn = function (scene, beat, t, i) {
    var burnsAt = sc(scene, 0, "burns"), ashAt = sc(scene, 0, "ash"), smokeAt = sc(scene, 0, "smoke");
    var backAt = sc(scene, 1, "back"), noAt = sc(scene, 1, "no");
    var candleAt = sc(scene, 2, "candle"), shorterAt = sc(scene, 2, "shorter"), awayAt = sc(scene, 2, "away");
    var newAt = sc(scene, 3, "new"), airAt = sc(scene, 3, "air");
    var alwaysAt = sc(scene, 4, "always"), back2At = sc(scene, 4, "back");

    function fire() {
      var flame = on(t, burnsAt, 0.6) * (1 - 0.55 * on(t, ashAt, 0.8));
      return cmChange(CM_BOX.x, CM_BOX.y, CM_BOX.w, {
        size: CM_BOX.s,
        a: function (cx, cy, s, tt) {
          /* the tall flames stand BEHIND the log, so they show above it, and one
             small one in front, so the log is still plainly a log */
          return cmFlames(cx, cy + s * 0.36, s * 1.04, tt, flame, 3) + cmIconWood(cx, cy, s) +
            cmFlames(cx + s * 0.02, cy + s * 0.30, s * 0.36, tt, flame, 1);
        },
        b: function (cx, cy, s, tt) { return cmIconAsh(cx, cy, s, tt); },
        bO: popIn(t, ashAt, 0.5),
        fwd: on(t, burnsAt, 0.9), word: "burning",
        back: on(t, backAt, 0.9), backWord: "back to wood?",
        verdict: "cross", vp: popIn(t, noAt, 0.4)
      }, t) +
        /* the smoke it makes, named on the same line as the ash */
        cmSmoke(CM_BX + 18, CM_CY - 40, t, smokeAt, null, on(t, smokeAt, 0.5), 150);
    }

    function candle() {
      /* the candle, drawn bigger than its own drawing: K about its foot */
      var K = 1.3, cx = 372, by = 410, hFull = 196;
      var h = hFull - 112 * on(t, shorterAt, 1.5);
      var sy = function (v) { return by - K * (by - v); };
      var top = by - 16 - h, top0 = by - 16 - hFull, out = "";
      out += G(cmCandle(cx, by, h, t, on(t, candleAt, 0.5)), { transform: around(cx, by, K) });
      /* how tall it was, and how far it has burned down */
      var so = on(t, shorterAt, 0.5);
      if (so > 0) {
        out += L(cx - 118, sy(top0), cx + 118, sy(top0), P.muted, 3, { "stroke-dasharray": "11 9", opacity: n2(so) });
        out += MK.arrow(cx - 100, sy(top0) + 9, cx - 100, sy(top) - 9, so, P.muted, 6);
      }
      /* the wax going off into the air: wisps off the flame, then a column of
         them rising beside it as "into the air" is said */
      var away = on(t, awayAt, 0.6), air = on(t, airAt, 0.6);
      out += cmWisps(cx, sy(top) - 64, t, away, 3);
      out += cmAir(692, 358, t, air, 200) + cmWisps(812, 340, t, air * 0.85, 3);
      out += MK.arrow(746, 340, 746, 152, air, P.accent, 10);
      out += MK.pill(886, 128, "new materials", popIn(t, newAt, 0.45), { size: 24, col: P.accent, ink: P.ink });
      /* the line lands ON the wisps coming off the flame - cmWisps sets them at
         cx - 22, cx and cx + 22, so it ends on the right-hand one, and not in
         the gap between them and the column of smoke further right */
      out += MK.leader(774, 128, cx + 24, sy(top) - 96, on(t, newAt, 0.5), P.accent);
      return out;
    }

    function both() {
      var u1 = on(t, alwaysAt, 0.55), u2 = on(t, alwaysAt == null ? null : alwaysAt + 0.45, 0.55);
      var vp = popIn(t, back2At, 0.4);
      return cmMini(230, 128, 700, cmIconWood, cmIconAsh, "burning", u1, vp, t) +
        cmMini(230, 330, 700, function (cx, cy, s, tt) { return cmCandle(cx, cy + s * 0.46, s * 0.5, tt, 1); },
          function (cx, cy, s, tt) { return cmAir(cx, cy + s * 0.34, tt, 1, 92); }, "burning", u2, popIn(t, back2At == null ? null : back2At + 0.3, 0.4), t);
    }

    return svg(cmPhased(t, i, scene, [0, 2, 4], function (n) { return n === 0 ? fire() : n === 1 ? candle() : both(); }));
  };
