  /* ==== Think It Through, part 4: decisions, and what you now know ============
     tools/lib/film-scenes/computing-g3/think-it-through-4.js. See the header of
     think-it-through.js.

     The lesson's own decision - is it raining - drawn as a point in an
     algorithm with a way out on each side, because that is how the lesson
     describes one: "a point in an algorithm; there, the answer to a question
     decides what happens next". Nothing is claimed about the No side beyond
     the No of the question itself: the beat says "If it is not, you do not",
     so the picture shows the same coat box, not a second decision - the
     lesson's other example (the bin) is not in this beat's words and is not
     drawn. */

  var TT_D = { cx: 390, cy: 128, hw: 96, hh: 74 };

  /* has this cue been reached? (a cue its beat never names is never reached) */
  function ttPast(t, at) { return at != null && t >= at; }
  /* the same cue, dt seconds later - null stays null */
  function ttAfter(at, dt) { return at == null ? null : at + dt; }
  /* when this chapter's picture should first appear: from the chapter's own start,
     not tied to any one word in it */
  function ttOpen(scene) { return BEATS[scene.first].start; }
  /* a small numbered tile: the same drawing as tiTile (think-it-through.js) */
  var ttMiniTile = tiTile;

  function ttDiamond(cx, cy, hw, hh, o, col, text, textO) {
    if (!(o > 0)) return "";
    var d = "M" + n2(cx) + "," + n2(cy - hh) + " L" + n2(cx + hw) + "," + n2(cy) +
      " L" + n2(cx) + "," + n2(cy + hh) + " L" + n2(cx - hw) + "," + n2(cy) + " Z";
    return G(Pth(d, P.cell, col || P.line, 3) +
      (textO > 0 ? Tx(cx, cy + 7, text, "lab", "middle", { opacity: textO, "font-size": 20 }) : ""),
      { transform: around(cx, cy, Math.min(1.06, o)), opacity: Math.min(1, o) });
  }

  /* the picture for the first three beats: one decision, in an algorithm */
  function ttDecideMain(scene, t) {
    var cDecisions = sc(scene, 0, "decisions");
    var cPoint = sc(scene, 1, "point"), cQuestion = sc(scene, 1, "question"), cNext = sc(scene, 1, "next");
    var cRaining = sc(scene, 2, "raining"), cCoat = sc(scene, 2, "coat"), cNot = sc(scene, 2, "not");
    var out = "";

    /* the two steps before it: a decision is a POINT in an algorithm */
    out += ttMiniTile(36, 88, 80, 1, popIn(t, cPoint, 0.4), P.teal);
    out += ttMiniTile(156, 88, 80, 2, popIn(t, ttAfter(cPoint, 0.2), 0.4), P.teal);
    out += MK.arrow(122, 128, 150, 128, on(t, ttAfter(cPoint, 0.1), 0.4), P.teal, 6);
    out += MK.arrow(242, 128, 288, 128, on(t, ttAfter(cPoint, 0.3), 0.4), P.teal, 6);

    /* the decision itself: a question mark from the start, the lesson's own
       question in its place once the lesson asks it */
    var dp = popIn(t, ttOpen(scene), 0.5), ring = bump(t, cRaining, 1.1) + bump(t, cDecisions, 1.0);
    out += ttDiamond(TT_D.cx, TT_D.cy, TT_D.hw, TT_D.hh, dp,
      ring > 0.3 || ttPast(t, cRaining) ? P.gold : P.blue, "Is it raining?", on(t, cRaining, 0.45));
    var qo = Math.min(1, dp) * (1 - on(t, cRaining, 0.45));
    if (qo > 0) out += Tx(TT_D.cx, TT_D.cy + 18, "?", "lab gold", "middle",
      { opacity: qo, "font-size": 52 + 8 * bump(t, cQuestion, 0.9) });
    out += MK.pill(TT_D.cx, 240, "a decision", popIn(t, cDecisions, 0.45),
      { size: 24, col: P.plum, ink: P.plum });
    var qp = popIn(t, cQuestion, 0.45) * (1 - on(t, cRaining, 0.5));
    out += MK.pill(150, 48, "a question", qp, { size: 24, col: P.gold, ink: P.gold });
    out += MK.leader(240, 56, 298, 112, on(t, ttAfter(cQuestion, 0.2), 0.45) * (1 - on(t, cRaining, 0.5)), P.gold);

    /* the two ways out */
    var nx = on(t, cNext, 0.5);
    out += MK.arrow(462, 108, 578, 74, nx, ttPast(t, cCoat) ? P.good : P.muted, 6);
    out += MK.arrow(462, 148, 578, 182, nx, P.muted, 6);
    out += G(Tx(508, 60, "Yes", "lab big good", "middle") + Tx(512, 216, "No", "lab big muted", "middle"), { opacity: nx });
    var yes = ttPast(t, cCoat) ? 1 : 0.55;
    out += G(R(600, 36, 300, 76, 18, P.cell, ttPast(t, cCoat) ? P.good : P.line, ttPast(t, cCoat) ? 3.5 : 2) +
      Em(646, 74, 44, "\u{1F9E5}") + Tx(682, 82, "take a coat", "lab big", "start"),
      { opacity: nx * yes });
    /* "If it is not, you do not": coat always fires first in this sentence, so
       the No box is already dimmed by then - "not" gets its own flash instead
       of a permanent state the dimming would hide */
    var notFlash = bump(t, cNot, 1.0);
    out += G(R(600, 144, 300, 76, 18, P.cell, notFlash > 0.15 ? P.muted : P.line, notFlash > 0.15 ? 3 : 2) +
      Em(646, 182, 44, "\u{1F9E5}") + MK.cross(646, 182, 22, 1) + Tx(682, 190, "no coat", "lab big muted", "start"),
      { opacity: nx * (ttPast(t, cCoat) ? 0.35 + 0.4 * notFlash : 0.55) });
    out += MK.tick(936, 74, 24, popIn(t, cCoat, 0.4));
    return out;
  }

  /* the last beat: dozens of them a day, and one written down */
  var TT_DOZ = [[110, 152], [250, 152], [390, 152], [530, 152], [110, 300], [250, 300], [390, 300], [530, 300]];

  function ttDecideMany(scene, t) {
    var cDozens = sc(scene, 3, "dozens"), cWriting = sc(scene, 3, "writing"), cAlgorithm = sc(scene, 3, "algorithm");
    var out = "", n = tally(t, cDozens, 8, 1.2);
    TT_DOZ.forEach(function (p, k) {
      if (k >= n) return;
      var u = popIn(t, ttAfter(cDozens, k * 0.17), 0.4);
      out += ttDiamond(p[0], p[1], 56, 40, u, P.plum, "", 0);
      out += G(Tx(p[0], p[1] + 12, "?", "lab", "middle", { fill: P.plum, "font-size": 36 }), { opacity: Math.min(1, u) });
    });
    /* one of them written down is an algorithm */
    var w = popIn(t, cWriting, 0.5);
    if (w > 0) {
      var sheet = R(700, 96, 400, 260, 20, P.paper) +
        L(736, 152, 1064, 152, "#C9B79C", 6) + L(736, 190, 1000, 190, "#C9B79C", 6) +
        Pth("M900,214 L960,254 L900,294 L840,254 Z", "#F7F4EC", "#D0A326", 5) +
        L(736, 316, 1064, 316, "#C9B79C", 6);
      out += G(sheet, { transform: around(900, 226, Math.min(1.04, w)), opacity: Math.min(1, w) });
      out += MK.pop(Em(1072, 330, 46, "✏️"), 1072, 330, w);
      out += MK.pill(900, 392, "an algorithm", popIn(t, cAlgorithm, 0.45),
        { size: 26, col: P.good, ink: P.good });
    }
    return out;
  }

  function ttDecideChapter(scene, beat, t, i) {
    var u = into(t, scene.first + 3), out = "";
    if (u < 1) out += G(ttDecideMain(scene, t), { opacity: 1 - u });
    if (u > 0) out += G(ttDecideMany(scene, t), { opacity: u });
    return svg(out);
  }

  /* ---- what you now know -------------------------------------------------------
     The lesson's own four ideas, one per recap beat: logic, predict, sections,
     and the recap's own last line - a decision sends an algorithm one way or
     the other. */
  var TT_RECAP = MK.recapKind([
    { beat: 0, at: "logic", title: "Logic", sub: "every step has a reason", pic: "\u{1F9E0}" },
    { beat: 1, at: "predict", title: "Predict", sub: "say it before it happens", pic: "\u{1F52E}" },
    { beat: 2, at: "section", title: "Sections", sub: "small parts of a big task", pic: "\u{1F9E9}" },
    { beat: 3, at: "decision", title: "Decision", sub: "one way, or the other", pic: "\u{1F500}" }
  ], { goBeat: 3, goAt: "decision" });

  var KINDS = {
    title: MK.titleKind({ sub: ["Why every step is where it is", "How to predict what one change will do", "How a big task divides into sections"] }),
    logic: tiLogicChapter, predict: tiPredictChapter, kite: tiKiteChapter,
    divide: tiDivideChapter, edit: tiEditChapter, decide: ttDecideChapter, recap: TT_RECAP
  };
