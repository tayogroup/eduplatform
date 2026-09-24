
  /* ==== chapter: use a key ======================================================
     tools/lib/film-scenes/science-g4/backbone-or-not-4.js.

     The lesson's own key, in its own words (KEY in content/lesson-2.py: "Does
     it have legs?", "Does it have exactly six legs?", "Does it have exactly
     eight legs?"), walked over one of its own six minibeasts.

     The creature is the SPIDER, the lesson's "a creature with eight legs". The
     film says "count them" and then counts them on the legs in the picture, so
     the creature has to be one whose legs are all there to count: this emoji
     draws four a side and no wings, where the ant draws three legs in all. The
     path is the lesson's own, and so is the name the key reaches. */

  var BN_Q = [
    { at: "legs", text: "Does it have legs?", y: 56, mark: "tick" },
    { at: "six", text: "Does it have exactly six legs?", y: 168, mark: "cross" },
    { at: "eight", text: "Does it have exactly eight legs?", y: 280, mark: "tick" }
  ];
  var BN_QX = 42, BN_QW = 462, BN_QH = 78;
  var BN_SPIDER = { x: 890, y: 186, s: 262 };
  /* the eight legs of the lesson's spider, down one side and then the other,
     each point on the leg itself */
  var BN_LEGS = [
    [-0.33, -0.22], [-0.385, -0.03], [-0.35, 0.15], [-0.27, 0.30],
    [0.33, -0.22], [0.385, -0.03], [0.35, 0.15], [0.27, 0.30]
  ];

  /* the chain of questions, with the one being asked lit and its answer beside it */
  function bnKeyChain(t, scene, shown, litK, answered) {
    var out = "";
    BN_Q.forEach(function (q, k) {
      var o = clamp(shown - k, 0, 1);
      if (o <= 0) return;
      var lit = k === litK;
      out += R(BN_QX, q.y, BN_QW, BN_QH, 16, lit ? "#1B3A52" : P.cell, lit ? P.gold : P.line, lit ? 3 : 2, { opacity: o });
      out += Tx(BN_QX + 22, q.y + 48, q.text, "lab", "start", { opacity: o, fill: lit ? P.ink : P.muted });
      if (k < BN_Q.length - 1)
        out += MK.arrow(BN_QX + BN_QW / 2, q.y + BN_QH + 2, BN_QX + BN_QW / 2, q.y + BN_QH + 30,
          clamp(shown - k - 0.5, 0, 1), P.muted, 5);
      var a = answered[k];
      if (a != null) {
        if (q.mark === "tick") out += MK.tick(576, q.y + BN_QH / 2, 26, popIn(t, a, 0.4));
        else out += MK.cross(576, q.y + BN_QH / 2, 26, popIn(t, a, 0.4));
        out += MK.pill(660, q.y + BN_QH / 2, q.mark === "tick" ? "Yes" : "No", on(t, a, 0.4),
          { size: 26, col: q.mark === "tick" ? P.good : P.bad, ink: q.mark === "tick" ? P.good : P.bad });
      }
    });
    return out;
  }

  /* beat 0: what a key is for - a creature, and the name you do not have yet */
  function bnKeyOpenPic(t, scene) {
    var cKey = sc(scene, 0, "key"), cId = sc(scene, 0, "identify"), cWork = sc(scene, 0, "work");
    var out = "", p = popIn(t, cKey, 0.45);
    out += MK.pop(Em(280, 200, 200, "\u{1F511}"), 280, 200, p);
    out += MK.pill(280, 340, "a key", Math.min(1, p), { size: 32, col: P.gold });
    out += MK.arrow(410, 200, 660, 200, on(t, cId, 0.7), P.gold, 8);
    out += MK.qmark(846, 190, 92, on(t, cId, 0.5));
    out += MK.pill(846, 350, "work out what it is", on(t, cWork, 0.5), { size: 30, col: P.gold });
    return out;
  }

  /* beats 1 to 4: the key on the left, the creature on the right */
  function bnKeyWalkPic(t, scene, k) {
    var cChain = sc(scene, 1, "chain"), cEach = sc(scene, 1, "each"), cNext = sc(scene, 1, "next");
    var cLook = sc(scene, 2, "look"), cLegs = sc(scene, 2, "legs"), cYes1 = sc(scene, 2, "yes");
    var cSix = sc(scene, 3, "six"), cCount = sc(scene, 3, "count"),
      cEight = sc(scene, 3, "eight"), cNo = sc(scene, 3, "no");
    var cEight2 = sc(scene, 4, "eight"), cYes3 = sc(scene, 4, "yes"),
      cNames = sc(scene, 4, "names"), cSpider = sc(scene, 4, "spider");
    var A = BN_SPIDER, out = "";

    var shown = cChain == null ? 0 : clamp((t - cChain) / 0.85 * 3, 0, 3);
    if (cEach != null && t >= cEach) shown = 3;
    var lit = cEight2 != null && t >= cEight2 ? 2 : cSix != null && t >= cSix ? 1 : cLegs != null && t >= cLegs ? 0 : -1;
    out += bnKeyChain(t, scene, shown, lit, [cYes1, cNo, cYes3]);
    out += MK.pill(700, 96, "yes or no", on(t, cNext, 0.5) * bnOnly(t, scene, 1), { size: 26, col: P.muted });

    /* the creature: the key icon until the child is asked to look at one */
    var ko = 1 - on(t, cLook, 0.5);
    if (ko > 0) out += G(Em(A.x, A.y, 168, "\u{1F511}") + MK.qmark(A.x, A.y + 170, 46, 1), { opacity: ko });
    var ao = on(t, cLook, 0.5), ap = popIn(t, cLook, 0.45);
    if (ao > 0) {
      out += MK.pop(Em(A.x, A.y, A.s, "\u{1F577}️"), A.x, A.y, ap);
      /* "Does it have legs?": the whole animal, ringed once */
      out += E(A.x, A.y, A.s * 0.47, A.s * 0.45, "none", P.gold, 5,
        { opacity: on(t, cLegs, 0.5) * bnOnly(t, scene, 2) });
      /* "Count them": a number on each of the eight legs, one at a time */
      var cn = tally(t, cCount, 8, 1.3), co = on(t, cCount, 0.4) * bnFrom(t, scene, 3);
      for (var j = 0; j < cn && co > 0; j++) {
        var lx = A.x + BN_LEGS[j][0] * A.s, ly = A.y + BN_LEGS[j][1] * A.s;
        out += MK.pop(C(lx, ly, 18, P.gold, P.ground, 3) +
          Tx(lx, ly + 7, String(j + 1), "lab", "middle", { fill: P.ground }), lx, ly, co);
      }
      /* "Eight, so no": the count, said out loud once every leg has a number */
      out += MK.pill(A.x, A.y - A.s * 0.56, "eight legs", popIn(t, cEight, 0.45) * bnFrom(t, scene, 3),
        { size: 30, col: P.gold, ink: P.gold });
      /* the name the key has reached */
      var no = on(t, cNames, 0.5);
      if (no > 0) {
        out += R(700, 350, 380, 70, 18, P.cell, P.gold, 3, { opacity: no });
        out += Tx(890, 396, "?", "lab big muted", "middle", { opacity: no * (1 - on(t, cSpider, 0.3)) });
        out += MK.pill(890, 385, "spider", popIn(t, cSpider, 0.45), { size: 34, col: P.gold, ink: P.gold });
      }
    }
    return out;
  }

  /* beat 5: answer what you SEE, not what you think it is (the lesson's own
     "Children answer what they think the creature is, not what they see") */
  function bnKeySeePic(t, scene) {
    var cSee = sc(scene, 5, "see"), cThink = sc(scene, 5, "think"), out = "";
    var so = popIn(t, cSee, 0.45), to = popIn(t, cThink, 0.45);
    out += R(96, 60, 420, 320, 24, P.cell, P.good, so > 0 ? 3 : 2, { opacity: Math.min(1, so) });
    out += MK.pop(Em(306, 178, 150, "\u{1F441}️"), 306, 178, so);
    out += MK.tick(306, 292, 34, popIn(t, cSee == null ? null : cSee + 0.3, 0.4));
    out += Tx(306, 356, "what you see", "lab big", "middle", { opacity: Math.min(1, so), fill: P.good });
    out += R(652, 60, 420, 320, 24, P.cell, P.line, 2, { opacity: Math.min(1, to) });
    out += MK.pop(Em(862, 178, 150, "\u{1F4AD}"), 862, 178, to);
    out += MK.cross(862, 292, 34, popIn(t, cThink == null ? null : cThink + 0.3, 0.4));
    out += Tx(862, 356, "what you think", "lab big muted", "middle", { opacity: Math.min(1, to) });
    return out;
  }

  function bnKeyChapter(scene, beat, t, i) {
    var k = i - scene.first;
    if (k === 0) return svg(bnKeyOpenPic(t, scene));
    if (k === 1) {
      var u = into(t, i);
      return svg(bnKeyWalkPic(t, scene, k) + (u < 1 ? G(bnKeyOpenPic(t, scene), { opacity: 1 - u }) : ""));
    }
    if (k === 5) {
      var v = into(t, i);
      return svg(bnKeySeePic(t, scene) + (v < 1 ? G(bnKeyWalkPic(t, scene, 4), { opacity: 1 - v }) : ""));
    }
    return svg(bnKeyWalkPic(t, scene, k));
  }
