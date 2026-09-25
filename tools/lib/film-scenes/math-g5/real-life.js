
  /* ==== Grade 5 Mathematics, Lesson 5: Real Life ================================
     tools/lib/film-scenes/math-g5/real-life.js, with -2.js and -3.js: the
     film's pictures, after the shared marks (MK) and before the engine's tail,
     all in one scope. The storyboard is
     mathematics/grade-5-app/lecture-video/real-life.json.

     REVISED 2026-09-25. This lesson (Step 28, "Squares and sequences in real
     life") is a capstone: 27 word problems that each ask the learner to pick
     one of seven tools (extend, square, factors, rule, percent, pattern,
     round) and then work it out - it reviews the whole unit rather than
     teaching one new idea. The previous version of this film claimed 5Ni.04
     and 5Ni.05 (estimate-and-multiply, estimate-and-divide) and invented all
     of its worked examples to deliver them, because the lesson's own
     self-check claims those two codes against "W p85", a workbook page
     outside this app. Checked against the lesson's own 27 problems: none is
     an estimate-and-multiply or estimate-and-divide problem, and the small
     factors in its square/cube problems (4, 5, 7, 8, 12) make a rounded
     estimate misleading rather than useful, so this film drops both codes and
     is rebuilt entirely from the lesson's own numbers. See real-life.json's
     own comment for the full account.

     Mathematics has no lesson kit, so every drawing here is one of the shared
     maths pictures (tools/lib/ehel-film-art-math.js): ART.columnSum for the
     written multiplication and division, and ART.array for the two square
     grids (12 x 12 and 8 x 8).

     This file: the palette, small helpers shared by every chapter, the title
     motif and the chapter "Choosing a method". Every top-level name starts
     with rlf. */

  var HUE = {
    title: P.teal, choosing: P.gold, estimating: P.accent,
    squares: P.plum, story: P.good, recap: P.teal
  };

  /* ---- small helpers shared by every chapter ---------------------------- */

  /* 0 -> 1 over span from a cue, staying at 1: a move that finishes and stays */
  function rlfStep(t, at, span) { return at == null ? 0 : ease(clamp((t - at) / (span || 0.5), 0, 1)); }

  /* a ring round something being named */
  function rlfRing(x, y, r, p, col) {
    if (!(p > 0)) return "";
    return G(C(x, y, r, "none", col || P.gold, 4), { transform: around(x, y, Math.min(p, 1.12)), opacity: Math.min(1, p) });
  }

  /* ==== the title motif =========================================================
     A story (an open book) turns into a checked, exact answer, with the three
     ways to work it out - mental, jottings, formal - lined up underneath. On
     the two cards it simply stands; in the spoken title chapter the book fades
     in, the rounded "about" sign appears, an arrow carries it across to a
     ticked exact answer, and the three method icons settle in below. Unchanged
     by the 2026-09-25 revision: these two beats name no invented numbers, they
     are the lesson's own three-part frame stated generically. */
  function titleMotif(o) {
    var t = o.t || 0, s = o.scene || null;
    var storyO = s ? on(t, sc(s, 0, "hides"), 0.7) : 1;
    var methodO = s ? popIn(t, sc(s, 0, "choose"), 0.5) : 1;
    var estO = s ? on(t, sc(s, 1, "estimate"), 0.6) : 1;
    var decideO = s ? on(t, sc(s, 1, "decide"), 0.5) : 1;
    var mentalO = s ? popIn(t, sc(s, 1, "mentally"), 0.4) : 1;
    var jotO = s ? popIn(t, sc(s, 1, "jottings"), 0.4) : 1;
    var formalO = s ? popIn(t, sc(s, 1, "formal"), 0.4) : 1;
    var out = "";
    out += C(180, 180, 172, "#123247");
    out += el("clipPath", { id: "rlfMotifClip" }, C(180, 180, 172));
    out += G(Em(180, 108, 78, "\u{1F4D6}"),
      { opacity: Math.min(1, storyO), transform: around(180, 108, 0.9 + 0.1 * Math.min(1, storyO)) });
    out += G(C(120, 228, 44, "none", P.gold, 4, { "stroke-dasharray": "7 6" }) +
      Tx(120, 238, "≈", "lab", "middle", { fill: P.gold, "font-size": 34 }), { opacity: Math.min(1, estO) });
    out += MK.arrow(168, 228, 226, 228, methodO, P.teal, 6);
    out += MK.tick(248, 228, 44, methodO);
    /* "then decide": a short connecting line drops from the checked answer to
       the row of three methods, so the row reads as an answer to the arrow
       rather than a separate decoration */
    out += L(248, 272, 248, 292, P.line, 3, { opacity: Math.min(1, decideO) });
    out += G(Em(120, 316, 42, "\u{1F9E0}"), { opacity: Math.min(1, mentalO) });
    out += G(Em(180, 316, 42, "✏️"), { opacity: Math.min(1, jotO) });
    out += G(Em(240, 316, 42, "✍️"), { opacity: Math.min(1, formalO) });
    out += C(180, 180, 172, "none", P.line, 3);
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A story turning into a checked exact answer, with the three ways to work it out">' + out + "</svg>";
  }

  /* ==== chapter: choosing a method ===============================================
     Three columns, left to right: a mental sum, a jotted one, and a full
     formal method - the lesson's own three levels. Every equation is one of
     the lesson's own 27 problems, solved exactly the way the lesson solves
     it: the patio's 7 x 7 = 49 (mental), Amina's savings 250 + 5 x 50 = 500
     (jottings, the lesson's own "hops" working), and the pencil boxes'
     2,024 / 8 = 253 (formal, the lesson's own final division line). All three
     glow together on the chapter's last line, "part of solving any problem". */
  function rlfChoosingChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cQuick = c(0, "quick");
    var cPatioeq = c(1, "patioeq"), cNowrite = c(1, "nowrite");
    var cBigger = c(2, "bigger"), cNotes = c(2, "notes");
    var cSavestart = c(3, "savestart"), cSaveend = c(3, "saveend");
    var cHardest = c(4, "hardest"), cStep = c(4, "step");
    var cPencils = c(5, "pencils"), cFormex = c(5, "formex");
    var cPartsolving = c(6, "partsolving");

    var cols = [
      { cx: 200, icon: "\u{1F9E0}", label: "Mental", col: P.gold,
        labelAt: cQuick, iconAt: cQuick, eqAt: cPatioeq, eq: "7 × 7 = 49",
        extraAt: cNowrite, extra: "worked out in your head" },
      { cx: 584, icon: "✏️", label: "Jottings", col: P.teal,
        labelAt: cBigger, iconAt: cSavestart, eqAt: cSaveend, eq: "250 + 5 × 50 = 500",
        extraAt: cNotes, extra: "5 jumps, jotted down" },
      { cx: 968, icon: "✍️", label: "Formal method", col: P.plum,
        labelAt: cHardest, iconAt: cPencils, eqAt: cFormex, eq: "2,024 ÷ 8 = 253",
        extraAt: cStep, extra: "step by step" }
    ];
    var out = "", k;
    for (k = 0; k < cols.length; k++) {
      var col = cols[k];
      var lo = popIn(t, col.labelAt, 0.45), io = popIn(t, col.iconAt, 0.5),
        eo = popIn(t, col.eqAt, 0.5), xo = on(t, col.extraAt, 0.4);
      if (io > 0) out += MK.pic(col.cx, 108, 76, col.icon, { opacity: Math.min(1, io) });
      if (lo > 0) out += MK.pill(col.cx, 190, col.label, Math.min(1, lo), { size: 25, col: col.col });
      if (eo > 0) out += Tx(col.cx, 254, col.eq, "lab big", "middle", { opacity: Math.min(1, eo), fill: col.col });
      if (xo > 0) out += MK.pill(col.cx, 300, col.extra, xo, { size: 20, col: col.col });
    }
    var closeU = on(t, cPartsolving, 0.6);
    if (closeU > 0) for (k = 0; k < cols.length; k++) out += rlfRing(cols[k].cx, 254, 70, closeU * 0.5, cols[k].col);
    return svg(out);
  }
