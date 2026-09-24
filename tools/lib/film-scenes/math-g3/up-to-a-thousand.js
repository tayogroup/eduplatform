  /* ==== Grade 3 Mathematics, Lesson 1: Up to a Thousand =======================
     tools/lib/film-scenes/math-g3/up-to-a-thousand.js, with -2.js and -3.js:
     the film's pictures, after the shared marks (MK) and before the engine's
     tail, all in one scope. The storyboard is
     mathematics/grade-3-app/lecture-video/up-to-a-thousand.json.

     Mathematics has no lesson kit, so the manipulatives come from ART
     (tools/lib/ehel-film-art-math.js): ART.placeValue is the hundreds / tens /
     ones chart with its flats, rods and cubes, which is the lesson's own
     "Three digits" step, and ART.numberLine is its rounding step's line.
     Two things ART cannot do are drawn here and only here: fourteen tens (its
     placeValue takes 0 to 9 in a column, which is the whole point of the
     regrouping chapter) and a box of 214 loose dots for the estimate.

     EVERY FRAME IS A QUANTITY CLAIM. The numbers said and the numbers drawn
     are checked together in the comments below: 348 is 3 flats, 4 rods and 8
     cubes; regrouped it is 2 flats, 14 rods and 8 cubes, and 200 + 140 + 8 is
     still 348; 35 times ten is 350; 348 rounds up to 350 and down to 300; the
     dot box holds twenty full groups of ten and fourteen over, which is 214.

     This file: the colours, the blocks, the title motif and the chapter "What
     a digit is worth". Every top-level name here starts with utw, so nothing
     can replace a name of the engine, ART or MK. */

  var HUE = {
    title: P.teal, worth: P.gold, apart: P.blue, regroup: P.plum,
    tentimes: P.accent, round: P.teal, estimate: P.good, recap: P.teal
  };

  /* ---- timing ---------------------------------------------------------------- */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 comes
     in: for a thing that belongs to that beat alone (rule 7) */
  function utwOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function utwFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }

  /* ---- the lesson's blocks, in ART's own colours -----------------------------
     ART.placeValue draws a hundred as a tealSoft square ruled ten by ten, a ten
     as a goodSoft rod ruled ten ways and a one as an accentSoft cube. The
     regrouping chapter has to move one block between columns and fan it out
     into ten, so it draws its own at any size, in those same colours. */
  var UTW_B = {
    flat: ART.C.tealSoft, flatE: ART.C.teal,
    rod: ART.C.goodSoft, rodE: ART.C.good,
    cube: ART.C.accentSoft, cubeE: ART.C.accent
  };
  /* a hundred: a square ruled into a ten by ten grid, top-left at (x, y) */
  function utwFlat(x, y, s, o) {
    if (!(o > 0)) return "";
    var g = "", k, p = s / 10;
    for (k = 1; k < 10; k++) {
      g += L(x + k * p, y, x + k * p, y + s, UTW_B.flatE, 0.7, { opacity: 0.5, "stroke-linecap": "butt" });
      g += L(x, y + k * p, x + s, y + k * p, UTW_B.flatE, 0.7, { opacity: 0.5, "stroke-linecap": "butt" });
    }
    return G(R(x, y, s, s, 4, UTW_B.flat, UTW_B.flatE, 2) + g + R(x, y, s, s, 4, "none", UTW_B.flatE, 2),
      { opacity: clamp(o, 0, 1) });
  }
  /* a ten: a rod ruled into ten, top-left at (x, y) */
  function utwRod(x, y, w, h, o) {
    if (!(o > 0)) return "";
    var g = "", k, p = h / 10;
    for (k = 1; k < 10; k++) g += L(x, y + k * p, x + w, y + k * p, UTW_B.rodE, 0.7, { opacity: 0.55, "stroke-linecap": "butt" });
    return G(R(x, y, w, h, 3, UTW_B.rod, UTW_B.rodE, 2) + g + R(x, y, w, h, 3, "none", UTW_B.rodE, 2),
      { opacity: clamp(o, 0, 1) });
  }
  /* a one */
  function utwCube(x, y, s, o) {
    if (!(o > 0)) return "";
    return R(x, y, s, s, 3, UTW_B.cube, UTW_B.cubeE, 2, { opacity: clamp(o, 0, 1) });
  }

  /* ---- ART's place-value chart, and where its parts land on the stage --------
     ART.placeValue with three columns and its blocks draws a card 518 x 308:
     an edge of 20, three columns 150 wide with a gap of 14, the column's digit
     centred 62 down, and the value captioned 22 up from the bottom. Placed at
     its own size, a point of the card is simply offset, which is how the film
     rings a column or points at a digit. */
  var UTW_PV = { w: 518, h: 308, edge: 20, cw: 150, gap: 14 };
  function utwPvColX(i) { return UTW_PV.edge + i * (UTW_PV.cw + UTW_PV.gap); }   /* left of column i */
  function utwPvMidX(i) { return utwPvColX(i) + UTW_PV.cw / 2; }                  /* its centre */

  /* ---- the title motif ------------------------------------------------------
     The lesson's own chart, holding 348, in a round window. In the spoken title
     chapter the chart arrives on "348", the three digits are ringed one at a
     time on "three digits", and the whole thing glows on "worth what its own
     column says". On the two cards it simply stands. */
  var UTW_MOTIF = { x: 20, y: 96, w: 320 };
  function utwMotifK() { return UTW_MOTIF.w / UTW_PV.w; }
  function utwMotifX(v) { return UTW_MOTIF.x + v * utwMotifK(); }
  function utwMotifY(v) { return UTW_MOTIF.y + v * utwMotifK(); }
  function titleMotif(o) {
    var t = o.t || 0, out = "";
    var cNum = o.scene ? sc(o.scene, 0, "num") : null;
    var cDig = o.scene ? sc(o.scene, 0, "digits") : null;
    var cWorth = o.scene ? sc(o.scene, 1, "worth") : null;
    var arrive = o.scene ? popIn(t, cNum, 0.5) : 1;
    out += el("clipPath", { id: "utwMotifClip" }, C(180, 180, 172));
    out += C(180, 180, 172, "#123247");
    out += MK.glow(180, 180, 168, P.gold, on(t, cWorth, 0.7) * (0.7 + 0.3 * breathe(t)));
    if (arrive > 0) {
      var card = ART.place(ART.placeValue({ value: 348, label: "348" }),
        UTW_MOTIF.x, UTW_MOTIF.y, UTW_MOTIF.w, UTW_PV.h * utwMotifK());
      out += G(card, { "clip-path": "url(#utwMotifClip)", transform: around(180, 190, Math.min(1, arrive)), opacity: Math.min(1, arrive) });
    }
    /* the three digits ringed, one at a time, as "three digits" is said */
    var lit = o.scene ? tally(t, cDig, 3, 0.75) : 0;
    for (var k = 0; k < lit; k++) {
      out += C(utwMotifX(utwPvMidX(k)), utwMotifY(UTW_PV.edge + 62), 25, "none", P.gold, 4,
        { opacity: 0.55 + 0.45 * (k === lit - 1 ? 1 : 0.55) });
    }
    out += C(180, 180, 172, "none", P.line, 3);
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A place value chart holding 348: three hundreds, four tens and eight ones">' + out + "</svg>";
  }

  /* ==== chapter: what a digit is worth =========================================
     3Np.01. The lesson's "Three digits" step: 348 built in the columns, and the
     misreading it teaches against ("Children read the digits as separate small
     numbers, three, four, eight. They are not.").

     ART.placeValue({value: 348}) draws 3 flats, 4 rods and 8 cubes, which is
     348, and captions 348 under them. The card sits at (40, 26) at its own
     size, so a column of the card is at 60 + i * 164 on the stage and a digit
     is at 135 + i * 164, 108. */
  var UTW_W = { x: 40, y: 26 };
  function utwWX(v) { return UTW_W.x + v; }
  function utwWY(v) { return UTW_W.y + v; }
  /* the three column values, said one per beat, under their own column */
  var UTW_WORTHS = [
    { cap: "3 hundreds", val: "300" },
    { cap: "4 tens", val: "40" },
    { cap: "8 ones", val: "8" }
  ];
  /* The big 348 on the right, and the ring round the digit being named. The
     three digits are drawn SEPARATELY, each anchored on its own centre, so the
     ring lands on the digit rather than on wherever the font's advance width
     happens to put it - the first cut drew "348" as one string and estimated
     the digit centres, and every ring sat half a digit to the right. */
  var UTW_BIG = { x: 875, y: 140, size: 92, pitch: 54, d: ["3", "4", "8"] };
  function utwBigDigitX(k) { return UTW_BIG.x + (k - 1) * UTW_BIG.pitch; }

  function utwWorthChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cCols = c(0, "cols"), cHto = c(0, "hto");
    var cThree = c(1, "three"), cWorth = c(1, "worth");
    var cFour = c(2, "four"), cForty = c(2, "forty");
    var cEight = c(3, "eight"), cJust = c(3, "just");
    var cNot = c(4, "not"), cReal = c(4, "real");
    var k = i - scene.first, out = "";

    /* which column is lit: the one whose digit has just been named, and none
       once the chapter turns to the whole number */
    var lit = null;
    if (k < 4) {
      if (cEight != null && t >= cEight) lit = "ones";
      else if (cFour != null && t >= cFour) lit = "tens";
      else if (cThree != null && t >= cThree) lit = "hundreds";
    }
    var arrive = popIn(t, cCols, 0.5);
    if (arrive > 0) {
      out += G(ART.place(ART.placeValue({ value: 348, lit: lit, label: "348" }), UTW_W.x, UTW_W.y, UTW_PV.w, UTW_PV.h),
        { transform: around(utwWX(UTW_PV.w / 2), utwWY(UTW_PV.h / 2), Math.min(1, arrive)), opacity: Math.min(1, arrive) });
    }

    /* "hundreds, tens and ones": the three columns named, left to right */
    var named = tally(t, cHto, 3, 0.9) * (k === 0 ? 1 : 1 - into(t, scene.first + 1));
    for (var n = 0; n < Math.ceil(named); n++) {
      out += R(utwWX(utwPvColX(n)), utwWY(UTW_PV.edge), UTW_PV.cw, 234, 18, "none", P.gold, 3,
        { opacity: clamp(named - n, 0, 1) });
    }

    /* what each column is worth, under its own column, as it is said */
    var worthAt = [cWorth, cForty, cJust];
    for (n = 0; n < 3; n++) {
      var wo = popIn(t, worthAt[n], 0.4);
      if (wo <= 0) continue;
      var mx = utwWX(utwPvMidX(n));
      out += Tx(mx, 362, UTW_WORTHS[n].cap, "lab mid muted", "middle", { opacity: Math.min(1, wo) });
      out += MK.pill(mx, 400, UTW_WORTHS[n].val, Math.min(1, wo), { size: 30, col: P.gold, ink: P.gold });
    }

    /* The number itself, big, with the digit being named picked out in gold and
       grown a little, the other two dimmed. A RING round the digit was tried
       first and is not in the film: three rings of a readable size overlap at
       this pitch, and a ring can only be as well registered as the estimate of
       where the glyph is. Colour cannot be off by a few pixels. */
    var bigO = 0.35 + 0.65 * on(t, cCols, 0.5);
    var namedAt = [cThree, cFour, cEight], focus = -1;
    if (k < 4) {
      if (cEight != null && t >= cEight) focus = 2;
      else if (cFour != null && t >= cFour) focus = 1;
      else if (cThree != null && t >= cThree) focus = 0;
    }
    for (n = 0; n < 3; n++) {
      var isF = n === focus, dx = utwBigDigitX(n);
      out += Tx(dx, UTW_BIG.y + UTW_BIG.size * 0.34, UTW_BIG.d[n], "lab huge", "middle",
        { "font-size": UTW_BIG.size, opacity: bigO,
          fill: isF ? P.gold : focus < 0 ? P.ink : P.muted,
          transform: around(dx, UTW_BIG.y, isF ? 1 + 0.12 * Math.min(1, popIn(t, namedAt[n], 0.35)) : 1) });
    }

    /* 300 + 40 + 8 = 348, built as the three worths are said */
    var sum = [
      { s: "300", x: 677, at: cWorth }, { s: "+", x: 742, at: cForty },
      { s: "40", x: 796, at: cForty }, { s: "+", x: 851, at: cJust },
      { s: "8", x: 898, at: cJust }, { s: "=", x: 952, at: cReal },
      { s: "348", x: 1030, at: cReal }
    ];
    for (n = 0; n < sum.length; n++) {
      var so = popIn(t, sum[n].at, 0.4);
      if (so <= 0) continue;
      out += Tx(sum[n].x, 282, sum[n].s, "lab huge", "middle",
        { "font-size": 40, fill: sum[n].s === "+" || sum[n].s === "=" ? P.muted : P.ink, opacity: Math.min(1, so) });
    }

    /* the misreading, crossed; the reading, ticked */
    var no = popIn(t, cNot, 0.4);
    if (no > 0) {
      out += Tx(800, 360, "three, four, eight", "lab big", "middle", { fill: P.muted, opacity: Math.min(1, no) });
      out += L(662, 354, 938, 354, P.bad, 4, { opacity: Math.min(1, no) });
      out += MK.cross(1092, 352, 22, popIn(t, cNot == null ? null : cNot + 0.25, 0.35));
    }
    var yes = popIn(t, cReal, 0.4);
    if (yes > 0) {
      out += Tx(800, 422, "three hundred and forty-eight", "lab big", "middle", { opacity: Math.min(1, yes) });
      out += MK.tick(1092, 414, 22, popIn(t, cReal == null ? null : cReal + 0.3, 0.35));
    }
    return svg(out);
  }
