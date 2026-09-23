  /* ==== chapter: a question you can test ==========================================
     The lesson's own ask step: the snail questions, and the fair test its
     "How would you find out?" answer describes - the same snail over the same
     distance, timed on wet ground and then on dry. One question can be
     answered and one cannot, side by side on the right. */

  var LO_WAYS = [
    { cx: 300, cue: "looking", word: "looking", pic: "\u{1F440}" },
    { cx: 584, cue: "testing", word: "testing", pic: "\u2696\uFE0F" },
    { cx: 868, cue: "up", word: "looking up", pic: "\u{1F4DA}" }
  ];

  function loAskOpen(scene, t) {
    var cQ = sc(scene, 0, "question"), out = "";
    out += MK.pop(MK.qmark(584, 140, 76, 1), 584, 140, popIn(t, cQ, 0.5));
    LO_WAYS.forEach(function (w) {
      var p = popIn(t, sc(scene, 0, w.cue), 0.42);
      if (p <= 0) return;
      out += G(R(w.cx - 130, 268, 260, 140, 20, "#1B3A52", P.accent, 3) +
        MK.pic(w.cx, 318, 58, w.pic) +
        Tx(w.cx, 390, w.word, "lab big", "middle"),
        { transform: around(w.cx, 330, Math.min(1.08, p)), opacity: Math.min(1, p) });
    });
    return out;
  }

  /* a question on a paper card, with the mark that says whether it can be
     answered. lines: one or two short lines. */
  function loAskCard(y, lines, o, mark, mp) {
    if (!(o > 0)) return "";
    var m = R(650, y, 480, 118, 22, P.paper);
    if (lines.length > 1) {
      m += Tx(858, y + 44, lines[0], "lab dark", "middle", { "font-size": 26 });
      m += Tx(858, y + 82, lines[1], "lab dark", "middle", { "font-size": 26 });
    } else {
      m += Tx(858, y + 68, lines[0], "lab dark", "middle", { "font-size": 26 });
    }
    if (mark === "tick") m += MK.tick(1085, y + 59, 24, mp);
    if (mark === "cross") m += MK.cross(1085, y + 59, 24, mp);
    return G(m, { transform: around(890, y + 59, 0.95 + 0.05 * Math.min(1, o)), opacity: Math.min(1, o) });
  }

  function loAskTest(scene, t) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cSnails = c(1, "snails"), cWet1 = c(1, "wet"), cCan = c(1, "can");
    var cTime = c(2, "time"), cDist = c(2, "distance"), cWet = c(2, "wet"), cDry = c(2, "dry");
    var cNice = c(3, "nice"), cNot = c(3, "cannot");
    var cHow = c(4, "how"), cToday = c(4, "today"), cTest = c(4, "test");
    var out = "";

    /* the first line: one snail, and the wet ground it might move faster on */
    var only1 = loOnly(t, scene, 1);
    if (only1 > 0.01) {
      var g1 = "";
      g1 += E(300, 316, 132, 24, "#2E6E96", null, null, { opacity: 0.85 * on(t, cWet1, 0.5) });
      g1 += MK.pop(MK.pic(300, 236, 124, LO.snail), 300, 236, popIn(t, cSnails, 0.45));
      out += G(g1, { opacity: clamp(only1, 0, 1) });
    }

    /* from the second line on: the fair test, two lanes */
    var lanes = loFrom(t, scene, 2);
    if (lanes > 0.01) {
      var g2 = "", uWet = on(t, cWet, 1.2), uDry = on(t, cDry, 1.2);
      g2 += R(90, 116, 480, 76, 14, P.cell, P.line, 2);
      g2 += R(90, 116, 480, 76, 14, "#2E6E96", null, null, { opacity: 0.8 * on(t, cWet, 0.5) });
      g2 += R(90, 212, 480, 76, 14, P.cell, P.line, 2);
      g2 += R(90, 212, 480, 76, 14, "#7A6438", null, null, { opacity: 0.8 * on(t, cDry, 0.5) });
      g2 += Tx(76, 164, "wet", "lab big", "end");
      g2 += Tx(76, 260, "dry", "lab big", "end");
      if (on(t, cWet, 0.4) > 0) g2 += MK.pic(lerp(130, 526, uWet), 154, 58, LO.snail);
      if (on(t, cDry, 0.4) > 0) g2 += MK.pic(lerp(130, 526, uDry), 250, 58, LO.snail);
      /* the same snail, and the same distance */
      g2 += loWatch(540, 58, 28, on(t, cTime, 0.4), t, true);
      g2 += MK.pill(230, 62, "same snail", on(t, cTime == null ? null : cTime + 0.25, 0.4), { size: 20, col: P.gold });
      var du = on(t, cDist, 0.6);
      g2 += MK.arrow(328, 318, 130, 318, du, P.gold, 6) + MK.arrow(328, 318, 526, 318, du, P.gold, 6);
      g2 += MK.pill(328, 352, "same distance", du, { size: 20, col: P.gold });
      out += G(g2, { opacity: clamp(lanes, 0, 1) });
    }

    /* the two questions */
    var tickP = popIn(t, cCan, 0.4);
    var glow = cTest != null && t >= cTest ? 0.5 + 0.5 * breathe(t) : 0;
    /* the pool of light stays inside the 1168 x 440 box: at r 250 its disc
       reached 118 px above the top of it */
    out += MK.glow(890, 133, 128, P.good, glow * 0.9);
    out += loAskCard(74, ["Do snails move faster", "on wet ground?"], on(t, cSnails, 0.5), "tick", tickP);
    out += loAskCard(228, ["Are snails nice?"], on(t, cNice, 0.5), "cross", popIn(t, cNot, 0.4));
    /* today, you ask one */
    out += MK.pill(350, 400, "How would I find out?", on(t, cHow, 0.45), { size: 24, col: P.gold });
    out += MK.ripple(1085, 133, t, cToday, P.good);
    return out;
  }

  function loQuestionChapter(scene, beat, t, i) {
    var swap = into(t, scene.first + 1), out = "";
    if (swap < 1) out += G(loAskOpen(scene, t), { opacity: 1 - swap });
    if (swap > 0) out += G(loAskTest(scene, t), { opacity: swap });
    return svg(out);
  }

  /* ==== what you now know ========================================================= */
  var LO_RECAP = MK.recapKind([
    { beat: 0, at: "living", title: "Four life processes", sub: "and plants do them too",
      pic: function (cx, cy, size) {
        var m = "";
        [LO.plate, LO.chart, LO.runner, LO.chick].forEach(function (p, k) {
          m += MK.pic(cx - size * 0.78 + k * size * 0.52, cy, size * 0.5, p);
        });
        return m;
      } },
    { beat: 1, at: "once", title: "Once alive", sub: "wood, paper, wool and leather", pic: "\u{1FAB5}" },
    { beat: 1, at: "never", title: "Never alive", sub: "rock, metal and glass", pic: "\u{1F529}" },
    { beat: 2, at: "five", title: "Five enquiries", sub: "five ways to find out", pic: "\u{1F50E}" },
    { beat: 2, at: "test", title: "Ask a good question", sub: "one you can find out", pic: "\u2753" }
  ], { goBeat: 2, goAt: "test" });

  var KINDS = {
    title: MK.titleKind({ sub: [
      "The four things every living thing does",
      "Living, once alive and never alive",
      "The five ways scientists find out"
    ] }),
    life: loLifeChapter,
    once: loOnceChapter,
    never: loNeverChapter,
    enquiry: loEnquiryChapter,
    question: loQuestionChapter,
    recap: LO_RECAP
  };
