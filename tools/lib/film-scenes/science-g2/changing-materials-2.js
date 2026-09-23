  /* ==== part 2 of 4: the title chapter, and "Same material back" ===============
     tools/lib/film-scenes/science-g2/changing-materials-2.js. Part 1 defined the
     palette, the drawings and cmChange; this file opens KINDS and fills in the
     film's first two chapters.

     The chapter is the lesson's first lecture part and the two frames of its
     demo that say "same material": ice melting and freezing back, and chocolate
     melting in the sun and setting hard again in the fridge. Both are drawn as
     the film's one change picture - the first material on the left, what it
     became on the right, the change arching over and the way BACK arching
     under - and in both the way back closes, so the tick comes. */

  /* the change picture's box, and the two things that stand beside it */
  var CM_BOX = { x: 230, y: 70, w: 630, s: 130 };
  var CM_AX = CM_BOX.x + CM_BOX.s * 0.6 + 6;              /* 314: the first material */
  var CM_BX = CM_BOX.x + CM_BOX.w - CM_BOX.s * 0.6 - 6;   /* 776: what it became */
  var CM_CY = CM_BOX.y + 150;                             /* 220: both are centred here */
  var CM_MX = (CM_AX + CM_BX) / 2;                        /* 545: under the arches */
  var CM_FRIDGE = { x: 900, y: 105, w: 170, h: 280 };

  /* Warmth rising into a thing standing at (cx, by): small orange squiggles,
     for "heat it and it melts". `offs` is where they stand, in px either side
     of cx, and it matters: a squiggle drawn BEHIND the thing being heated
     shows only its dark bottom half and reads as a drip running out of it, not
     as heat. So the caller puts them where the thing is not. */
  function cmWarm(cx, by, t, o, offs) {
    if (!(o > 0)) return "";
    var out = "", xs = offs || [-40, 0, 40];
    for (var k = 0; k < xs.length; k++) {
      var ph = ((t * 0.7 + k * 0.33) % 1), x = cx + xs[k], y = by - 62 * ph;
      out += Pth("M" + n2(x) + "," + n2(y) + " q13,-15 0,-30 t0,-30", null, CM.flameOut, 7,
        { opacity: (1 - ph) * Math.min(1, ph * 5) * 0.95 });
    }
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* a word's underline, sweeping in from the left as the word is said */
  function cmUnderline(cx, y, halfWidth, u, col) {
    if (!(u > 0)) return "";
    return L(cx - halfWidth, y, cx - halfWidth + 2 * halfWidth * ease(u), y, col, 4, { "stroke-linecap": "round" });
  }

  /* a ring drawn round one of the two things, to point at it */
  function cmRing(cx, o, col) {
    if (!(o > 0)) return "";
    return C(cx, CM_CY, 80, "none", col, 3.5, { opacity: clamp(o, 0, 1), "stroke-dasharray": "13 10" });
  }

  var KINDS = {
    title: MK.titleKind({ sub: [
      "Ice melts, and freezes back to ice.",
      "An egg cooks, and never goes back.",
      "Ask: can you get the first material back?"
    ] })
  };

  /* ==== Same material back ===================================================== */
  KINDS.same = function (scene, beat, t, i) {
    /* beat 0-2: the ice.  beat 3-4: the chocolate. */
    var solidAt = sc(scene, 0, "solid"), meltsAt = sc(scene, 0, "melts"),
      waterAt = sc(scene, 0, "water"), liquidAt = sc(scene, 0, "liquid");
    var freezerAt = sc(scene, 1, "freezer"), againAt = sc(scene, 1, "again");
    var meltingAt = sc(scene, 2, "melting"), freezingAt = sc(scene, 2, "freezing"),
      sameAt = sc(scene, 2, "same"), alongAt = sc(scene, 2, "along");
    var meltsB = sc(scene, 3, "melts"), sunB = sc(scene, 3, "sun"),
      fridgeB = sc(scene, 3, "fridge"), setsB = sc(scene, 3, "sets");
    var looksC = sc(scene, 4, "looks"), stillC = sc(scene, 4, "still"), backC = sc(scene, 4, "back");

    function ice() {
      var out = "";
      /* "It is water all along": both of them, one material, lit together */
      var along = on(t, alongAt, 0.7);
      if (along > 0) out += MK.glow(CM_AX, CM_CY, 130, P.teal, along * 0.9) + MK.glow(CM_BX, CM_CY, 130, P.teal, along * 0.9);
      /* The warmth that melts it, from "Heat it" until the freezer is opened.
         The cube stands across x 267 to 372 (cmIconIce at CM_AX, CM_CY, 130),
         so the squiggles rise in two pairs either side of it, where the child
         can see a whole one. */
      var warm = on(t, meltsAt, 0.5) * (1 - on(t, freezerAt, 0.5));
      out += MK.glow(CM_AX, CM_CY + 34, 132, P.accent, warm * 0.85) +
        cmWarm(CM_AX, CM_CY + 120, t, warm, [-118, -80, 84, 122]);
      out += cmChange(CM_BOX.x, CM_BOX.y, CM_BOX.w, {
        size: CM_BOX.s,
        a: function (cx, cy, s, tt) {
          return G(cmIconIce(cx, cy, s), { transform: around(cx, cy, 1 + 0.08 * bump(tt, solidAt, 0.7) + 0.08 * bump(tt, againAt, 0.7)) });
        },
        b: function (cx, cy, s, tt) {
          return G(cmIconWater(cx, cy, s), { transform: around(cx, cy, 1 + 0.08 * bump(tt, liquidAt, 0.7)) });
        },
        bO: popIn(t, waterAt, 0.45),
        fwd: on(t, meltsAt, 0.9), word: "melting",
        back: on(t, freezerAt, 0.9), backWord: "freezing",
        verdict: "tick", vp: popIn(t, sameAt, 0.4)
      }, t);
      /* the two words are named on the third line: each is underlined as it is said */
      out += cmUnderline(CM_MX, CM_CY - 96, 58, on(t, meltingAt, 0.5), P.gold);
      out += cmUnderline(CM_MX, CM_CY + 170, 64, on(t, freezingAt, 0.5), P.teal);
      /* the lesson's two words for the two states */
      out += MK.pill(CM_AX, CM_CY - 108, "solid", popIn(t, solidAt, 0.4), { size: 22, col: P.blue, ink: P.ink });
      out += MK.pill(CM_BX, CM_CY - 108, "liquid", popIn(t, liquidAt, 0.4), { size: 22, col: P.blue, ink: P.ink });
      /* the freezer, opened on "in the freezer", with the cube back in it */
      var open = on(t, freezerAt, 0.6);
      if (open > 0) {
        var inner = cmIconIce(CM_FRIDGE.x + CM_FRIDGE.w / 2, CM_FRIDGE.y + 56, 72);
        out += G(cmFridge(CM_FRIDGE.x, CM_FRIDGE.y, CM_FRIDGE.w, CM_FRIDGE.h, "freezer", open, on(t, freezerAt + 0.25, 0.8), t), { opacity: 1 });
        out += G(inner, { transform: around(CM_FRIDGE.x + CM_FRIDGE.w / 2, CM_FRIDGE.y + 56, popIn(t, againAt, 0.45)), opacity: Math.min(1, popIn(t, againAt, 0.45)) });
      } else {
        out += G(cmFridge(CM_FRIDGE.x, CM_FRIDGE.y, CM_FRIDGE.w, CM_FRIDGE.h, "freezer", 0, 0, t), { opacity: 0.45 });
      }
      return out;
    }

    function choc() {
      var out = "";
      /* the Sun that melts it */
      out += cmSun(132, 142, 40, on(t, sunB, 0.7), t);
      out += cmChange(CM_BOX.x, CM_BOX.y, CM_BOX.w, {
        size: CM_BOX.s,
        a: function (cx, cy, s, tt) {
          return G(cmIconChoc(cx, cy, s, tt), { transform: around(cx, cy, 1 + 0.08 * bump(tt, setsB, 0.8) + 0.06 * bump(tt, stillC, 0.7)) });
        },
        b: function (cx, cy, s, tt) { return cmIconMelted(cx, cy, s, tt); },
        bO: popIn(t, meltsB, 0.45),
        fwd: on(t, meltsB, 0.9), word: "melting",
        back: on(t, fridgeB, 0.9), backWord: "setting",
        verdict: "tick", vp: popIn(t, backC, 0.4)
      }, t);
      /* "It looks different": the melted one is pointed at, and then the bar,
         which is the same chocolate */
      out += cmRing(CM_BX, on(t, looksC, 0.4) * (1 - on(t, stillC, 0.45)), P.gold);
      out += cmRing(CM_AX, on(t, stillC, 0.4), P.teal);
      out += MK.pill(CM_AX, CM_CY - 108, "still chocolate", popIn(t, stillC, 0.45), { size: 22, col: P.teal, ink: P.ink });
      /* the fridge, opened on "In the fridge", with the bar set hard in it */
      var open = on(t, fridgeB, 0.6), bar = CM_FRIDGE.y + 178;
      if (open > 0) {
        out += cmFridge(CM_FRIDGE.x, CM_FRIDGE.y, CM_FRIDGE.w, CM_FRIDGE.h, "fridge", open, on(t, fridgeB + 0.25, 0.8), t);
        var p = popIn(t, setsB, 0.45);
        out += G(cmIconChoc(CM_FRIDGE.x + CM_FRIDGE.w / 2, bar, 86, t), { transform: around(CM_FRIDGE.x + CM_FRIDGE.w / 2, bar, p), opacity: Math.min(1, p) });
      } else {
        out += G(cmFridge(CM_FRIDGE.x, CM_FRIDGE.y, CM_FRIDGE.w, CM_FRIDGE.h, "fridge", 0, 0, t), { opacity: 0.45 });
      }
      return out;
    }

    return svg(cmPhased(t, i, scene, [0, 3], function (n) { return n === 0 ? ice() : choc(); }));
  };
