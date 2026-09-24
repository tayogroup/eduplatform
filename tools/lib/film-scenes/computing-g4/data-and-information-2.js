  /* ==== Data and Information, part 2: the form, and the raw data ===============
     tools/lib/film-scenes/computing-g4/data-and-information-2.js. See the
     header of data-and-information.js.

     The form chapter builds the lesson's own form - its question, its four
     choices, its eight children and the answer each one gives - and then shows
     what a form is good and bad at ON THAT FORM: the answers line up and can
     be counted; Hana's scooter has no box to go in; a bad question spoils
     every answer at once.

     The data chapter is the RAW case and is drawn as one: bare values in
     boxes, no labels, no order, no total, and a question mark. Nothing in it
     is counted or organised - that is the next chapter's job. */

  /* ==== chapter: collecting it with a form ======================================= */

  var DI_FORM_BOX = { x: 48, y: 26, w: 470, h: 354 };
  var DI_Q_BOX = { x: 76, y: 51, w: 414, h: 46 };
  var DI_CHOICE_Y = [126, 178, 230, 282];   /* the four choices the form offers */
  var DI_SCOOTER_Y = 334;                   /* the choice Hana has not got */
  var DI_CELL_X = [650, 782, 914, 1046];
  var DI_CELL_Y = [130, 280];

  /* one row of the form: a tick box, the way's picture and its word */
  function diChoiceRow(y, id, o, opt) {
    if (!(o > 0)) return "";
    opt = opt || {};
    var w = DI_Q_BOX.w, x = DI_Q_BOX.x, col = opt.col || P.line, ink = opt.ink || P.ink;
    var body = R(x, y - 24, w, 48, 10, opt.fill || P.cell, col, opt.sw || 3, opt.dash ? { "stroke-dasharray": "10 8" } : null) +
      R(x + 14, y - 16, 32, 32, 7, P.card, col, 2);
    if (id) body += Em(x + 78, y, 32, DI_WAY[id] ? DI_WAY[id].pic : id) +
      Tx(x + 106, y + 9, opt.label || (DI_WAY[id] ? DI_WAY[id].label : ""), "lab", "start", { fill: ink });
    return G(body, { opacity: clamp(o, 0, 1) });
  }

  /* one child of the eight: face, name, and the answer they gave */
  function diAnsCell(k, o, t, opt) {
    if (!(o > 0)) return "";
    opt = opt || {};
    var kid = DI_KIDS[k], cx = DI_CELL_X[k % 4], cy = DI_CELL_Y[Math.floor(k / 4)];
    var out = Em(cx, cy - 46, 52, kid.pic) +
      Tx(cx, cy - 8, kid.name, "lab mid muted", "middle") +
      diWayChip(cx, cy + 44, 112, 62, kid.ans, 1, { col: opt.col, ink: opt.ink });
    if (opt.mark === "tick") out += MK.tick(cx + 48, cy + 18, 15, opt.markP);
    else if (opt.mark === "cross") out += MK.cross(cx + 48, cy + 18, 15, opt.markP);
    return G(out, { transform: around(cx, cy, Math.min(1.06, o)), opacity: Math.min(1, o) });
  }

  function diFormChapter(scene, beat, t, i) {
    var cForm = sc(scene, 0, "form"), cQues = sc(scene, 0, "question"), cChoices = sc(scene, 0, "choices");
    var cAsk = sc(scene, 1, "ask"), cFour = sc(scene, 1, "four");
    var kidCue = [sc(scene, 2, "amal"), sc(scene, 2, "sami"), sc(scene, 2, "zara"), sc(scene, 2, "omar")];
    var cEight = sc(scene, 3, "eight"), cSameWay = sc(scene, 3, "sameway");
    var cEveryone = sc(scene, 4, "everyone"), cCounted = sc(scene, 4, "counted"), cMissed = sc(scene, 4, "missed");
    var cHana = sc(scene, 5, "hana"), cNot = sc(scene, 5, "notchoice");
    var cWhy = sc(scene, 6, "why"), cBad = sc(scene, 6, "bad"), cWrong = sc(scene, 6, "wrong");
    var out = "", fo = popIn(t, cForm, 0.45), bad = diPast(t, cBad), wrong = diPast(t, cWrong);

    /* ---- the form itself ---- */
    out += G(R(DI_FORM_BOX.x, DI_FORM_BOX.y, DI_FORM_BOX.w, DI_FORM_BOX.h, 22, P.card, P.line, 2),
      { opacity: clamp(fo, 0, 1) });

    /* the question: an empty slot that is pointed at, then the lesson's own question */
    var asked = on(t, cAsk, 0.45), qCol = bad ? P.bad : diPast(t, cQues) && !diPast(t, cAsk) ? P.gold : P.line;
    out += G(R(DI_Q_BOX.x, DI_Q_BOX.y, DI_Q_BOX.w, DI_Q_BOX.h, 10, P.cell, qCol, asked > 0.5 || bad ? 4 : 3,
      asked > 0.5 ? null : { "stroke-dasharray": "10 8" }), { opacity: clamp(fo, 0, 1) });
    if (asked > 0) out += Tx(DI_Q_BOX.x + DI_Q_BOX.w / 2, DI_Q_BOX.y + 32, "How do you get to school?", "lab big", "middle",
      { opacity: asked, fill: bad ? P.bad : P.ink });
    /* "Everyone got the same question": the one question every answer came from */
    var ev = on(t, cEveryone, 0.45) * (1 - on(t, cBad, 0.4));
    if (ev > 0) out += R(DI_Q_BOX.x - 6, DI_Q_BOX.y - 6, DI_Q_BOX.w + 12, DI_Q_BOX.h + 12, 14, "none", P.gold, 4,
      { opacity: ev * (0.6 + 0.4 * breathe(t)) });
    out += MK.tick(DI_Q_BOX.x + DI_Q_BOX.w - 18, DI_Q_BOX.y - 14, 18, popIn(t, cMissed, 0.4) * (1 - on(t, cBad, 0.4)));
    out += MK.cross(DI_Q_BOX.x + DI_Q_BOX.w - 18, DI_Q_BOX.y - 14, 18, popIn(t, cBad, 0.4));

    /* the four choices: empty boxes, pointed at, then filled in */
    var filled = tally(t, cFour, 4, 0.8), pointed = diPast(t, cChoices) && !diPast(t, cFour);
    for (var k = 0; k < 4; k++) {
      var fo4 = clamp(filled - k, 0, 1);
      if (fo4 <= 0) out += diChoiceRow(DI_CHOICE_Y[k], null, fo, { dash: true, col: pointed ? P.gold : P.line });
      else out += diChoiceRow(DI_CHOICE_Y[k], DI_FORM_ORDER[k], fo4, { col: bad ? P.bad : P.line, ink: bad ? P.bad : P.ink });
    }

    /* Hana: her way to school is not one of the choices */
    var ho = popIn(t, cHana, 0.45), no = popIn(t, cNot, 0.45);
    if (ho > 0) out += G(Em(96, 410, 44, "\u{1F467}") + Tx(126, 418, "Hana", "lab mid", "start") +
      Em(228, 410, 40, "\u{1F6F4}") + Tx(254, 418, "scooter", "lab mid", "start"), { opacity: Math.min(1, ho) });
    out += MK.leader(330, 404, 420, 362, on(t, cNot, 0.5), P.bad);
    if (no > 0) out += diChoiceRow(DI_SCOOTER_Y, "\u{1F6F4}", no, { dash: true, col: P.bad, ink: P.bad, label: "scooter", sw: 3 }) +
      MK.cross(DI_Q_BOX.x + DI_Q_BOX.w - 34, DI_SCOOTER_Y, 18, no);

    /* ---- the eight answers ---- */
    var po = diFrom(t, scene, 2);
    out += G(R(552, 26, 576, 354, 22, P.card, P.line, 2), { opacity: po });
    var chipCol = wrong ? P.bad : diPast(t, cSameWay) ? P.gold : P.line;
    for (var j = 0; j < 8; j++) {
      var at = j < 4 ? kidCue[j] : cEight == null ? null : cEight + (j - 4) * 0.22;
      var mAt = wrong ? (cWrong == null ? null : cWrong + j * 0.11) : (cCounted == null ? null : cCounted + j * 0.11);
      out += diAnsCell(j, popIn(t, at, 0.4), t,
        { col: chipCol, ink: wrong ? P.bad : P.ink, mark: wrong ? "cross" : "tick", markP: popIn(t, mAt, 0.35) });
    }

    /* a form cannot ask why */
    var wo = popIn(t, cWhy, 0.45);
    out += MK.bubble(744, 386, 200, 50, "Why?", wo);
    out += MK.cross(976, 411, 22, popIn(t, cWhy == null ? null : cWhy + 0.4, 0.4));
    return svg(out);
  }

  /* ==== chapter: data, the raw facts ==============================================
     Beats 0 and 1 are four bare facts with nothing said about them; from beat
     2 the picture is the lesson's own eight answers, in the order the children
     gave them, and still nothing is counted. */

  var DI_RAW_FACTS = ["21", "walk", "cat", "size 2"];

  function diDataFacts(scene, t) {
    var cData = sc(scene, 0, "data"), cFacts = sc(scene, 0, "facts");
    var cOwn = sc(scene, 1, "own"), cNothing = sc(scene, 1, "nothing");
    var out = "", alone = on(t, cOwn, 0.5);

    out += MK.pill(584, 58, "data", on(t, cData, 0.45), { size: 26, col: P.plum, ink: P.plum });
    for (var k = 0; k < DI_RAW_FACTS.length; k++) {
      var p = popIn(t, cFacts == null ? null : cFacts + k * 0.26, 0.38);
      if (!(p > 0)) continue;
      var cx = 239 + k * 230;
      out += G(diTile(cx, 190, 190, 110, DI_RAW_FACTS[k], p, { col: k === 0 && alone > 0 ? P.gold : P.line, sw: k === 0 && alone > 0 ? 5 : 3 }),
        { opacity: k === 0 ? 1 : 1 - 0.68 * alone });
    }
    /* "on its own ... means nothing at all": one fact, and no meaning for it */
    out += MK.qmark(239, 326, 34, popIn(t, cNothing, 0.4));
    return out;
  }

  function diDataList(scene, t) {
    var cEight = sc(scene, 2, "eight"), cExactly = sc(scene, 2, "exactly");
    var cList = sc(scene, 3, "list"), cWhich = sc(scene, 3, "which");
    var cCannot = sc(scene, 4, "cannot"), cListData = sc(scene, 4, "listdata");
    var out = "";

    out += MK.pill(584, 62, "a list of words is data", on(t, cListData, 0.45), { size: 26, col: P.plum, ink: P.plum });
    for (var k = 0; k < 8; k++) {
      var cx = 108 + k * 136;
      /* the child who gave it, exactly as they gave it */
      var ao = popIn(t, cExactly == null ? null : cExactly + k * 0.11, 0.35);
      if (ao > 0) out += G(Em(cx, 122, 46, DI_KIDS[k].pic), { opacity: Math.min(1, ao) });
      var p = popIn(t, cEight == null ? null : cEight + k * 0.11, 0.38);
      if (!(p > 0)) continue;
      /* read out one at a time, and still in the order they were given */
      var lit = bump(t, cList == null ? null : cList + k * 0.22, 0.44);
      out += diWayChip(cx, 226, 120, 92, DI_KIDS[k].ans, p,
        { col: lit > 0.05 ? P.gold : P.line, sw: 3 + 2 * lit });
    }
    out += MK.qmark(460, 358, 34, popIn(t, cWhich, 0.4));
    out += MK.cross(708, 358, 34, popIn(t, cCannot, 0.4));
    return out;
  }

  function diDataChapter(scene, beat, t, i) {
    var u = into(t, scene.first + 2), out = "";
    if (u < 1) out += G(diDataFacts(scene, t), { opacity: 1 - u });
    if (u > 0) out += G(diDataList(scene, t), { opacity: u });
    return svg(out);
  }
