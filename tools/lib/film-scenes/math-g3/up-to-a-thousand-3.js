  /* ==== chapters: ten times bigger, rounding, estimating, and the recap =======
     tools/lib/film-scenes/math-g3/up-to-a-thousand-3.js. */

  /* ---- ten times bigger -------------------------------------------------------
     3Np.02, the lesson's "Ten times bigger" step, on its own starting number:
     35 times ten is 350. ART.placeValue with three columns draws 35 as 0 flats,
     3 rods and 5 cubes, and 350 as 3 flats, 5 rods and 0 cubes - the same
     digits, each one column to the left, and a zero holding the ones open. */
  var UTW_T = { x: 30, y: 100 };
  function utwTenChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cNot = c(0, "notadd");
    var cMoves = c(1, "moves");
    var cN35 = c(2, "n35"), cTens = c(2, "tens"), cOnes = c(2, "ones");
    var cTimes = c(3, "times"), cHund = c(3, "hundreds");
    var cFifty = c(4, "fifty"), cZero = c(4, "zero"), cAns = c(4, "ans");
    var out = "", swapAt = cTimes, swapped = swapAt != null && t >= swapAt;

    /* the chart, 35 becoming 350: a HARD swap on "Times ten", not a
       crossfade. Both cards are drawn by ART.placeValue at this same x, y,
       with different printed captions - "35" and "350" - so blending their
       opacity put the two labels on top of each other, unreadable, for the
       whole half second of the fade: the exact instant the child is meant
       to see 35 become 350 (review note, 2026-09-24). Only one card is ever
       drawn now; the new one pops in with a small scale bounce so the swap
       still reads as a change, not a jump-cut. */
    function chart(v) {
      return ART.place(ART.placeValue({ value: v, columns: 3, label: String(v) }), UTW_T.x, UTW_T.y, UTW_PV.w, UTW_PV.h);
    }
    if (swapped) {
      var pop = Math.min(1, popIn(t, swapAt, 0.3));
      out += G(chart(350), { transform: around(UTW_T.x + UTW_PV.w / 2, UTW_T.y + UTW_PV.h / 2, 0.9 + 0.1 * pop) });
    } else {
      out += chart(35);
    }

    /* the two moves, one column to the left each, above the chart */
    function mover(from, to, live) {
      var base = on(t, cMoves, 0.5) * 0.9, hot = on(t, live, 0.5);
      var x1 = UTW_T.x + utwPvMidX(from), x2 = UTW_T.x + utwPvMidX(to);
      return MK.arrow(x1, 68, x2 + 14, 68, base, P.line, 6) + MK.arrow(x1, 68, x2 + 14, 68, hot, P.gold, 7);
    }
    out += mover(1, 0, cHund) + mover(2, 1, cFifty);

    /* the ring that follows what is being named */
    function ring(colIndex, at, until) {
      var o = popIn(t, at, 0.35) * (until == null || until === undefined ? 1 : 1 - on(t, until, 0.4));
      if (!(o > 0)) return "";
      return C(UTW_T.x + utwPvMidX(colIndex), UTW_T.y + UTW_PV.edge + 62, 34, "none", P.gold, 4, { opacity: clamp(o, 0, 1) });
    }
    out += ring(1, cTens, cOnes) + ring(2, cOnes, cTimes);
    out += ring(0, cHund, cFifty) + ring(1, cFifty, cZero) + ring(2, cZero, null);

    /* beat 0: adding a zero on the end is NOT what happens */
    var k0 = utwOnly(t, scene, 0), no = popIn(t, cNot, 0.4) * k0;
    if (no > 0) {
      out += Tx(900, 218, "35", "lab huge", "middle", { "font-size": 76, opacity: Math.min(1, no) });
      out += Tx(972, 218, "0", "lab huge", "middle", { "font-size": 76, fill: P.muted, opacity: Math.min(1, no) });
      out += MK.cross(1046, 200, 30, popIn(t, cNot == null ? null : cNot + 0.45, 0.4) * k0);
      out += Tx(930, 296, "not like that", "lab big", "middle", { fill: P.muted, opacity: Math.min(1, no) });
    }
    /* beat 1: what does happen */
    out += MK.pill(880, 218, "one column to the left", popIn(t, cMoves, 0.4) * utwOnly(t, scene, 1), { size: 26, col: P.gold, ink: P.gold });

    /* beats 2 to 4: what each digit was, and what it became */
    var late = utwFrom(t, scene, 2);
    var rows = [
      { y: 150, at: cTens, a: "3 tens", b: "3 hundreds", bAt: cHund },
      { y: 252, at: cOnes, a: "5 ones", b: "5 tens", bAt: cFifty }
    ];
    for (var r = 0; r < rows.length; r++) {
      var ro = popIn(t, rows[r].at, 0.4) * late;
      if (ro <= 0) continue;
      out += Tx(720, rows[r].y, rows[r].a, "lab big", "middle", { opacity: Math.min(1, ro) });
      out += MK.arrow(800, rows[r].y - 9, 890, rows[r].y - 9, on(t, rows[r].bAt, 0.4) * late, P.gold, 6);
      out += Tx(1010, rows[r].y, rows[r].b, "lab big", "middle", { opacity: on(t, rows[r].bAt, 0.4) * late });
    }
    out += MK.pill(760, 356, "350", popIn(t, cAns, 0.4), { size: 40, col: P.gold, ink: P.gold });
    out += Tx(1000, 350, "a 0 holds", "lab big", "middle", { opacity: on(t, cZero, 0.4) });
    out += Tx(1000, 386, "the ones open", "lab big", "middle", { opacity: on(t, cZero, 0.4) });
    return svg(out);
  }

  /* ---- round it to 10 or 100 --------------------------------------------------
     3Np.05, the lesson's rounding step, with its own number line. 348 sits
     between 340 and 350, halfway is 345, and 348 is past it, so it goes up to
     350. To the nearest hundred it sits between 300 and 400, halfway is 350,
     and 348 has not reached it, so it goes down to 300. Same number, two
     answers - which is the lesson's own point about what you round TO.

     ART.numberLine puts its line 116 down when it is carrying jumps and 46 down
     when it is not, so each card is placed to keep the line at the same height
     on the stage and the jump arc simply grows above it. */
  var UTW_L = { x: 53, cw: 900, k: 1.18, y: 230, pad: 36 };
  function utwLX(v, from, to) {
    return UTW_L.x + (UTW_L.pad + ((v - from) / (to - from)) * (UTW_L.cw - 2 * UTW_L.pad)) * UTW_L.k;
  }
  function utwLine(o, jump) {
    var opts = { from: o.from, to: o.to, step: o.step, labelEvery: o.every, width: UTW_L.cw, marks: o.marks || [] };
    if (jump) opts.jumps = [jump];
    var h = jump ? 178 : 108, top = jump ? 116 : 46;
    return ART.place(ART.numberLine(opts), UTW_L.x, UTW_L.y - top * UTW_L.k, UTW_L.cw * UTW_L.k, h * UTW_L.k);
  }
  function utwRoundChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cNear = c(0, "near");
    var cN348 = c(1, "n348"), cTen = c(1, "ten"), cBetween = c(1, "between");
    var cHalf = c(2, "half"), cPast = c(2, "past"), cUp = c(2, "up");
    var cHund = c(3, "hundred"), cBetween2 = c(3, "between2");
    var cHalf2 = c(4, "half2"), cDown = c(4, "down"), cTwo = c(4, "two");
    var out = "", toB = on(t, cHund, 0.55), a = "", b = "";

    /* the tens line: 340 to 350, ticks of one, labels every five */
    var markA = cN348 != null && t >= cN348 ? [{ at: 348, label: "348" }] : [];
    var jumpA = cUp != null && t >= cUp ? { from: 348, to: 350, label: "up to 350", colour: "good" } : null;
    a += utwLine({ from: 340, to: 350, step: 1, every: 5, marks: markA }, jumpA);
    var endsA = on(t, cNear, 0.5) * (1 - on(t, cBetween == null ? null : cBetween + 1.2, 0.6)) + on(t, cBetween, 0.5);
    a += C(utwLX(340, 340, 350), UTW_L.y, 25, "none", P.gold, 4, { opacity: clamp(endsA, 0, 1) });
    a += C(utwLX(350, 340, 350), UTW_L.y, 25, "none", P.gold, 4, { opacity: clamp(endsA, 0, 1) });
    var hA = on(t, cHalf, 0.5);
    if (hA > 0) {
      a += L(utwLX(345, 340, 350), UTW_L.y - 62, utwLX(345, 340, 350), UTW_L.y + 22, P.gold, 3,
        { opacity: hA * (0.75 + 0.25 * (cPast != null && t >= cPast ? breathe(t) : 1)), "stroke-dasharray": "9 7" });
      a += MK.pill(utwLX(345, 340, 350), UTW_L.y + 92, "halfway 345", hA, { size: 24, col: P.gold, ink: P.gold });
    }
    a += C(utwLX(348, 340, 350), UTW_L.y, 20 + 28 * bump(t, cPast, 0.9), "none", P.gold, 4, { opacity: bump(t, cPast, 0.9) });

    /* the hundreds line: 300 to 400, ticks of ten, labels at each end */
    var markB = [{ at: 348, label: "348" }];
    var jumpB = cDown != null && t >= cDown ? { from: 348, to: 300, label: "down to 300", colour: "accent" } : null;
    b += utwLine({ from: 300, to: 400, step: 10, every: 100, marks: markB }, jumpB);
    var endsB = on(t, cBetween2, 0.5);
    b += C(utwLX(300, 300, 400), UTW_L.y, 25, "none", P.gold, 4, { opacity: endsB });
    b += C(utwLX(400, 300, 400), UTW_L.y, 25, "none", P.gold, 4, { opacity: endsB });
    /* On a line 100 long, 350 and 348 are 20 apart on the stage, so this pill
       cannot sit under its own dashes the way the tens line's does: it stands
       aside and a dashed elbow points back at the halfway mark. */
    var hB = on(t, cHalf2, 0.5), hx = utwLX(350, 300, 400);
    if (hB > 0) {
      b += L(hx, UTW_L.y - 62, hx, UTW_L.y + 22, P.gold, 3, { opacity: hB, "stroke-dasharray": "9 7" });
      b += Pth("M" + n2(hx) + "," + n2(UTW_L.y + 22) + " L" + n2(hx) + "," + n2(UTW_L.y + 82) +
        " L" + n2(hx + 150) + "," + n2(UTW_L.y + 92), null, P.gold, 3, { opacity: hB, "stroke-dasharray": "9 7" });
      b += MK.pill(hx + 262, UTW_L.y + 92, "halfway 350", hB, { size: 24, col: P.gold, ink: P.gold });
    }

    out += G(a, { opacity: 1 - toB }) + G(b, { opacity: toB });
    /* both answers, side by side, on the last line */
    var two = popIn(t, cTwo, 0.45);
    out += MK.pill(360, 404, "nearest 10: 350", two, { size: 26, col: P.good, ink: P.good });
    out += MK.pill(800, 404, "nearest 100: 300", two, { size: 26, col: P.accent, ink: P.accent });
    out += MK.pill(360, 404, "to the nearest ten", on(t, cTen, 0.4) * (1 - toB) * (1 - Math.min(1, two)), { size: 26, col: P.line });
    out += MK.pill(360, 404, "to the nearest hundred", on(t, cHund, 0.4) * (1 - Math.min(1, two)), { size: 26, col: P.line });
    return svg(out);
  }

  /* ---- roughly how many? ------------------------------------------------------
     3Nc.01, the lesson's estimating step: do not count them all, count one
     group and see how many groups there are.

     THE BOX HOLDS EXACTLY 214 DOTS, laid out in 20 columns and 11 rows, the
     last row holding 14. Every dot is nudged off its cell centre by a fixed
     amount, never a random one, so the ring drawn round columns 0 to 4 of rows
     0 and 1 always holds exactly ten of them and never clips an eleventh. The
     twenty group boxes cover rows 0 to 9, which is 20 x 10 = 200; the fourteen
     of row 10 are left visibly outside them, and 200 + 14 = 214. */
  var UTW_E = {
    x: 60, y: 80, w: 700, h: 320, cols: 20, rows: 11, n: 214,
    ring: { x: 62, y: 78, w: 176, h: 62 }
  };
  var UTW_JIT = [0.31, -0.72, 0.58, -0.14, 0.87, -0.46, 0.09, 0.66, -0.91, 0.24,
                 -0.37, 0.79, -0.63, 0.41, -0.05, 0.94, -0.28, 0.52, -0.81, 0.17,
                 0.73, -0.55, 0.36, -0.99];
  function utwDotX(col, idx) { return UTW_E.x + 17.5 + col * 35 + UTW_JIT[(idx * 7) % 24] * 4; }
  function utwDotY(row, idx) { return UTW_E.y + 14.545 + row * 29.09 + UTW_JIT[(idx * 13 + 5) % 24] * 4; }
  function utwEstChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cClose = c(0, "close"), cEst = c(0, "est");
    var cDont = c(1, "dont"), cLong = c(1, "long");
    var cRing = c(2, "ring"), cTen = c(2, "ten");
    var cFill = c(3, "fill"), cTwenty = c(3, "twenty");
    var cTwo = c(4, "two"), cReal = c(4, "real");
    var out = "", j;

    out += R(UTW_E.x, UTW_E.y, UTW_E.w, UTW_E.h, 16, P.card, P.line, 2);
    /* the twenty groups of ten, arriving as "fill the box" is said */
    var groups = tally(t, cFill, 20, 1.3);
    for (j = 0; j < groups; j++) {
      out += R(UTW_E.x + 2 + (j % 4) * 175, UTW_E.y + 2 + Math.floor(j / 4) * 58.18, 171, 54.18, 10,
        "rgba(53,191,178,0.10)", P.teal, 2, { opacity: clamp(groups - j, 0, 1) });
    }
    /* the 214 dots */
    for (j = 0; j < UTW_E.n; j++) {
      out += C(utwDotX(j % UTW_E.cols, j), utwDotY(Math.floor(j / UTW_E.cols), j), 6, P.accent);
    }
    /* the ring round one group of ten */
    var ro = on(t, cRing, 0.45);
    if (ro > 0) {
      out += R(UTW_E.ring.x, UTW_E.ring.y, UTW_E.ring.w, UTW_E.ring.h, 14, "none", P.gold, 4, { opacity: ro });
      var to = popIn(t, cTen, 0.4);
      if (to > 0) {
        out += L(150, 66, 150, UTW_E.ring.y - 4, P.gold, 3, { opacity: Math.min(1, to) });
        out += Tx(150, 54, "about 10", "lab big", "middle", { fill: P.gold, opacity: Math.min(1, to) });
      }
    }

    /* the right-hand column, one thing per beat */
    var k0 = utwOnly(t, scene, 0), k1 = utwOnly(t, scene, 1), k3 = utwOnly(t, scene, 3), k4 = utwFrom(t, scene, 4);
    out += Tx(975, 160, "close is good enough", "lab big", "middle", { opacity: on(t, cClose, 0.4) * k0 });
    out += MK.pill(975, 234, "an estimate", popIn(t, cEst, 0.4) * k0, { size: 30, col: P.good, ink: P.good });
    out += Tx(975, 186, "1, 2, 3, 4, 5, 6 ...", "lab big", "middle", { opacity: on(t, cDont, 0.4) * k1 });
    out += MK.cross(975, 262, 30, popIn(t, cLong, 0.4) * k1);
    out += MK.pill(975, 210, "about 20 groups", popIn(t, cTwenty, 0.4) * k3, { size: 28, col: P.teal, ink: P.teal });
    if (k4 > 0) {
      out += Tx(975, 172, "20 × 10 = 200", "lab huge", "middle", { "font-size": 44, opacity: popIn(t, cTwo, 0.4) * k4 });
      out += Tx(975, 262, "really 214", "lab big", "middle", { fill: P.good, opacity: on(t, cReal, 0.4) * k4 });
      out += Tx(975, 320, "close enough", "lab mid muted", "middle", { opacity: on(t, cReal == null ? null : cReal + 0.5, 0.5) * k4 });
    }
    return svg(out);
  }

  /* ---- what you now know ------------------------------------------------------
     The six ideas, in the lesson's own pictures for its own words: the place
     value tag, the scissors of decomposing, the arrows of regrouping, the
     times sign, the target of rounding and the eyes of estimating. */
  var UTW_RECAP = MK.recapKind([
    { beat: 0, at: "col", title: "Place value", sub: "the column says the worth", pic: "\u{1F3F7}️" },
    { beat: 0, at: "apart", title: "Decompose", sub: "348 is 300 + 40 + 8", pic: "✂️" },
    { beat: 1, at: "regroup", title: "Regroup", sub: "also 200 + 140 + 8", pic: "\u{1F504}" },
    { beat: 1, at: "times", title: "Times ten", sub: "every digit one place left", pic: "✖️" },
    { beat: 2, at: "round", title: "Round", sub: "pick the nearer neighbour", pic: "\u{1F3AF}" },
    { beat: 2, at: "est", title: "Estimate", sub: "count one group of ten", pic: "\u{1F440}" }
  ], { goBeat: 2, goAt: "est" });

  var KINDS = {
    title: MK.titleKind({ sub: ["What each digit is worth", "Two ways to break 348 apart", "Times ten, rounding and estimating"] }),
    worth: utwWorthChapter, apart: utwApartChapter, regroup: utwRegroupChapter,
    tentimes: utwTenChapter, round: utwRoundChapter, estimate: utwEstChapter,
    recap: UTW_RECAP
  };
