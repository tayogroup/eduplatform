  /* ==== Rows and Rules, part 2 ================================================
     "One array, four facts" and "Split it to multiply". The first is the
     lesson's fact-family step: one 4 by 6 array, read four ways, and the array
     itself comes apart into the groups each sharing sentence describes. The
     second is its distributive step with the lesson's own numbers, 24 x 3
     split into 20 x 3 and 4 x 3, and then its estimating step, 38 x 4 against
     an estimate of 40 x 4. */

  /* the array cut into equal groups: `groups` panels of `per` dots, drawn
     along `axis`, sliding apart as u goes 0 -> 1 */
  function rrGrouped(cx, cy, rows, cols, o) {
    o = o || {};
    var cell = o.cell || RR_CELL, pad = rrPad(cell), u = o.u == null ? 1 : o.u;
    var gap = (o.gap == null ? 18 : o.gap) * u;
    var byRow = o.axis !== "cols";
    var n = byRow ? rows : cols;
    var gw = byRow ? cols * cell + 2 * pad : cell + 2 * pad;
    var gh = byRow ? cell + 2 * pad : rows * cell + 2 * pad;
    var totalW = byRow ? gw : n * gw + (n - 1) * gap;
    var totalH = byRow ? n * gh + (n - 1) * gap : gh;
    var x0 = cx - totalW / 2, y0 = cy - totalH / 2;
    var fill = o.colour || ART.C.teal, r = cell * 0.3, out = "", k, a, b, gx, gy;
    for (k = 0; k < n; k++) {
      gx = byRow ? x0 : x0 + k * (gw + gap);
      gy = byRow ? y0 + k * (gh + gap) : y0;
      out += R(gx, gy, gw, gh, 14, ART.C.cell, o.ring === k ? ART.C.accent : ART.C.line, o.ring === k ? 3.5 : 2);
      for (a = 0; a < (byRow ? 1 : rows); a++) {
        for (b = 0; b < (byRow ? cols : 1); b++) {
          out += C(gx + pad + b * cell + cell / 2, gy + pad + a * cell + cell / 2, r, fill);
        }
      }
    }
    return out;
  }

  /* ==== chapter: one array, four facts ==========================================
     3Ni.05. The four sentences arrive as empty slots and fill one at a time,
     and the picture beside them changes to match: the whole array for the two
     times facts, four rows of six for "shared between four", six columns of
     four for "shared between six". */
  var RR_FX = 340, RR_FY = 206, RR_FCELL = 40;
  var RR_FACTS = [
    { text: "4 × 6 = 24", col: P.teal },
    { text: "6 × 4 = 24", col: P.teal },
    { text: "24 ÷ 4 = 6", col: P.blue },
    { text: "24 ÷ 6 = 4", col: P.blue }
  ];
  var RR_FACT_Y = [92, 172, 252, 332];

  function rrFamilyChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cFour = c(0, "four");
    var cF1 = c(1, "f1"), cF2 = c(1, "f2"), cF3 = c(2, "f3"), cF4 = c(3, "f4");
    var cStuck = c(4, "stuck"), cMult = c(4, "mult");
    var at = [cF1, cF2, cF3, cF4], out = "", k;

    /* the picture: whole array, then four rows of six, then six fours */
    var toRows = on(t, cF3, 0.7), toCols = on(t, cF4, 0.7);
    var whole = (1 - toRows) * (1 - toCols);
    if (whole > 0.001) {
      out += G(rrDots(RR_FX, RR_FY, 4, 6, { cell: RR_FCELL, markRow: bump(t, cF1, 1.0) > 0.02 ? 0 : null }) +
        rrBrackets(RR_FX, RR_FY, 4, 6, RR_FCELL, 1, 1, 0), { opacity: n3(whole) });
    }
    if (toRows * (1 - toCols) > 0.001) {
      out += G(rrGrouped(RR_FX, RR_FY, 4, 6, { cell: RR_FCELL, u: toRows, axis: "rows" }) +
        Tx(RR_FX, 396, "4 groups of 6", "lab big", "middle", { fill: P.gold }),
        { opacity: n3(toRows * (1 - toCols)) });
    }
    if (toCols > 0.001) {
      out += G(rrGrouped(RR_FX, RR_FY, 4, 6, { cell: RR_FCELL, u: toCols, axis: "cols" }) +
        Tx(RR_FX, 372, "6 groups of 4", "lab big", "middle", { fill: P.gold }),
        { opacity: n3(toCols) });
    }

    /* the four sentences: empty slots on "four number sentences", each filled
       as it is said */
    var slots = on(t, cFour, 0.5);
    for (k = 0; k < 4; k++) {
      var y = RR_FACT_Y[k], o = popIn(t, at[k], 0.4);
      if (slots > 0.001 && o < 1) {
        out += G(R(848 - 132, y - 30, 264, 60, 12, "none", P.line, 3, { "stroke-dasharray": "10 7" }),
          { opacity: n3(slots * (1 - Math.min(1, o))) });
      }
      out += rrFact(848, y, RR_FACTS[k].text, o, { size: 34, w: 264, col: RR_FACTS[k].col, sw: 3 });
    }

    /* "When a division will not come, ask what you multiply by." */
    var ask = rrOnly(t, scene, 4);
    if (ask > 0.01) {
      out += MK.qmark(1040, RR_FACT_Y[2], 24, on(t, cStuck, 0.4) * ask);
      out += MK.arrow(1040, RR_FACT_Y[2] - 30, 1040, RR_FACT_Y[0] + 32, on(t, cMult, 0.6) * ask, P.gold, 7);
      out += G(Tx(RR_FX, 64, "4 times what makes 24?", "lab big", "middle", { fill: P.gold }),
        { opacity: n3(on(t, cMult, 0.5) * ask) });
    }
    return svg(out);
  }

  /* ==== chapter: split it to multiply ===========================================
     3Ni.06 (distributive) and 3Ni.08. The lesson's own worked example, 24 x 3,
     and then its own estimate, 38 x 4 against 40 x 4 = 160. */
  function rrSplitChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cBig = c(0, "big"), cSplit = c(0, "split"), cInto = c(0, "into");
    var cTens = c(1, "tens"), cOnes = c(1, "ones");
    var cAdd = c(2, "add"), cBoth = c(2, "both");
    var cEst = c(3, "est"), cNear = c(3, "near"), cForty = c(3, "forty");
    var cReal = c(4, "real"), cClose = c(4, "close");

    var est = rrFrom(t, scene, 3), main = 1 - est, out = "";

    if (main > 0.001) {
      var m = "";
      /* "Twenty-four times three" */
      m += G(Tx(276, 96, "24 × 3", "lab", "middle", { "font-size": 58, fill: P.gold }),
        { opacity: n3(on(t, cBig, 0.45)) });
      /* the bar of 24, and the same bar split into 20 and 4 */
      var bar = on(t, cSplit, 0.5), cut = on(t, cInto, 0.6);
      if (bar > 0.001) {
        m += G(R(60, 140, 432, 62, 12, ART.C.cell, ART.C.line, 3) +
          Tx(276, 182, "24", "lab", "middle", { "font-size": 40, fill: ART.C.ink }), { opacity: n3(bar) });
      }
      if (cut > 0.001) {
        m += G(R(60, 236, 353, 62, 12, ART.C.tealSoft, ART.C.teal, 3) +
          Tx(236, 278, "20", "lab", "middle", { "font-size": 40, fill: ART.C.teal }) +
          R(421, 236, 71, 62, 12, ART.C.accentSoft, ART.C.accent, 3) +
          Tx(456, 278, "4", "lab", "middle", { "font-size": 40, fill: ART.C.accent }),
          { opacity: n3(cut), transform: "translate(0," + n2((1 - cut) * -18) + ")" });
      }
      /* the two parts, each multiplied */
      var t1 = popIn(t, cTens, 0.4), t2 = popIn(t, cOnes, 0.4);
      m += rrFact(830, 150, "20 × 3 = 60", t1, { size: 38, w: 300, col: P.teal });
      if (t1 > 0.001) m += G(Tx(830, 206, "the tens part", "lab mid", "middle", { fill: P.muted }), { opacity: n3(Math.min(1, t1)) });
      m += rrFact(830, 252, "4 × 3 = 12", t2, { size: 38, w: 300, col: P.accent });
      if (t2 > 0.001) m += G(Tx(830, 308, "the ones part", "lab mid", "middle", { fill: P.muted }), { opacity: n3(Math.min(1, t2)) });
      /* "Sixty and twelve make seventy-two. Both parts had to be multiplied." */
      m += rrFact(830, 378, "60 + 12 = 72", popIn(t, cAdd, 0.45), { size: 44, w: 352, col: P.gold, sw: 3.5 });
      var bo = on(t, cBoth, 0.5) * rrOnly(t, scene, 2);
      if (bo > 0.001) {
        m += G(R(672, 116, 316, 68, 14, "none", P.gold, 4) + R(672, 218, 316, 68, 14, "none", P.gold, 4),
          { opacity: n3(bo) });
      }
      out += G(m, { opacity: n3(main) });
    }

    if (est > 0.001) {
      var e = "";
      e += G(Tx(584, 88, "38 × 4", "lab", "middle", { "font-size": 56, fill: P.gold }),
        { opacity: n3(on(t, cEst, 0.45)) });
      e += MK.pill(286, 160, "38 is nearly 40", on(t, cNear, 0.45), { size: 28, col: P.teal });
      e += rrFact(880, 160, "40 × 4 = 160", popIn(t, cForty, 0.45), { size: 34, w: 286, col: P.teal });
      /* the number line: the estimate first, then the real answer beside it */
      var marks = [];
      if (cForty != null && t >= cForty) marks.push({ at: 160, label: "160", colour: "teal" });
      if (cReal != null && t >= cReal) marks.push({ at: 152, label: "152", colour: "accent" });
      e += ART.place(ART.numberLine({ from: 120, to: 180, step: 20, marks: marks }), 304, 226, 560, 108);
      e += rrFact(584, 390, "38 × 4 = 152", popIn(t, cReal, 0.45), { size: 42, w: 340, col: P.accent, sw: 3.5 });
      e += MK.tick(880, 390, 26, popIn(t, cClose, 0.4));
      out += G(e, { opacity: n3(est) });
    }
    return svg(out);
  }
