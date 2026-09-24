  /* ==== Grade 2 Mathematics, Lesson 1: Tens and Ones =========================
     tools/lib/film-scenes/math-g2/tens-and-ones.js, with -2.js and -3.js: the
     film's pictures, after the shared marks (MK) and before the engine's tail,
     all in one scope. The storyboard is
     mathematics/grade-2-app/lecture-video/tens-and-ones.json.

     Mathematics has no lesson kit, so every drawing here comes from the shared
     picture library (ART, tools/lib/ehel-film-art-math.js): ART.placeValue for
     the tens and ones, ART.numberLine for the rounding, ART.array for the
     arrays. Only the sharing chapter is drawn by hand, because the library has
     no "share a pool into equal groups" picture.

     This file: the palette, the place-value card and the coordinates of its
     own rods and cubes, the title motif, and the chapter "Tens and ones".
     Every top-level name starts with tao, so nothing here can replace a name
     of the engine, of ART or of MK. */

  var HUE = {
    title: P.teal, tens: P.gold, build: P.blue, round: P.plum,
    arrays: P.good, share: P.accent, recap: P.teal
  };

  /* the lessons' light palette, for anything drawn beside a library card */
  var TAOC = ART.C;

  /* ---- timing ----------------------------------------------------------------
     0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 comes
     in: for a thing that belongs to that beat alone (rule 7). */
  function taoOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function taoFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }
  /* 1 until the chapter's beat k arrives, then 0: for a thing that must clear */
  function taoUntil(t, scene, k) { return k >= scene.beats.length ? 1 : 1 - into(t, scene.first + k); }

  /* ==== the place-value card =====================================================
     ART.placeValue({tens, ones}) with two columns and no caption is 354 x 274,
     and this film points at the rods and cubes inside it, so their places are
     worked out from the library's own geometry (edge 20, column 150 wide, gap
     14, blocks sitting on by = 240; a rod is 11 x 38 and steps 15, a cube is
     13 x 13 and steps 17, eight rods and five cubes to a row).

     The card is placed at exactly 1.5x, so 354 x 274 becomes 531 x 411 and
     nothing is letterboxed: taoPX and taoPY turn a card coordinate into a film
     one. */
  var TAO_PV = { x: 90, y: 14, k: 1.5 };
  function taoPX(v) { return TAO_PV.x + v * TAO_PV.k; }
  function taoPY(v) { return TAO_PV.y + v * TAO_PV.k; }
  function taoPVCard(tens, ones, lit) {
    return ART.place(ART.placeValue({ tens: tens, ones: ones, lit: lit || null }),
      TAO_PV.x, TAO_PV.y, 354 * TAO_PV.k, 274 * TAO_PV.k);
  }
  /* the centre of rod i of n, and of cube i of n, in CARD coordinates */
  function taoRodAt(i, n) {
    var rows = Math.ceil(n / 8), r = Math.floor(i / 8), c = i % 8;
    var inRow = Math.min(8, n - r * 8);
    return [20 + 75 - (inRow * 15 - 4) / 2 + c * 15 + 5.5, 240 - (rows - r) * 42 + 19];
  }
  function taoCubeAt(i, n) {
    var rows = Math.ceil(n / 5), r = Math.floor(i / 5), c = i % 5;
    var inRow = Math.min(5, n - r * 5);
    return [184 + 75 - (inRow * 17 - 4) / 2 + c * 17 + 6.5, 240 - (rows - r) * 17 + 6.5];
  }
  /* a gold box round every rod, or every cube, in FILM coordinates */
  function taoRing(at, n, padX, padY, o) {
    if (!(o > 0) || n < 1) return "";
    var x1 = 1e9, x2 = -1e9, y1 = 1e9, y2 = -1e9, p, i;
    for (i = 0; i < n; i++) {
      p = at(i, n);
      if (p[0] < x1) x1 = p[0];
      if (p[0] > x2) x2 = p[0];
      if (p[1] < y1) y1 = p[1];
      if (p[1] > y2) y2 = p[1];
    }
    return R(taoPX(x1 - padX), taoPY(y1 - padY), (x2 - x1 + 2 * padX) * TAO_PV.k, (y2 - y1 + 2 * padY) * TAO_PV.k,
      14, "none", P.gold, 4, { opacity: clamp(o, 0, 1) });
  }

  /* ---- a rod and a cube of the film's own, for the comparison ------------------
     The library draws these inside its card; beside the card they have to be
     drawn here, in the same light colours, at whatever size the frame needs. */
  function taoRod(x, y, w, h, o) {
    if (!(o > 0)) return "";
    var s = R(0, 0, w, h, w * 0.22, TAOC.goodSoft, TAOC.good, 2.4), i;
    for (i = 1; i < 10; i++) s += L(0, i * h / 10, w, i * h / 10, TAOC.good, 1.1, { opacity: 0.55, "stroke-linecap": "butt" });
    return G(s + R(0, 0, w, h, w * 0.22, "none", TAOC.good, 2.4), { transform: tr(x, y), opacity: clamp(o, 0, 1) });
  }
  function taoCube(x, y, s, o) {
    if (!(o > 0)) return "";
    return R(x, y, s, s, s * 0.19, TAOC.accentSoft, TAOC.accent, 2.4, { opacity: clamp(o, 0, 1) });
  }

  /* ==== the title motif ===========================================================
     The lesson's own place-value card for 34: three rods and four cubes under
     the digits 3 and 4, with "34" written above them. In the spoken title
     chapter the tens column lights and then the ones column, on "tens and
     ones"; what each digit is worth appears under it on "what it is worth". On
     the two cards it simply stands. */
  var TAO_M = { x: 18, y: 70, k: 0.9153 };
  function taoMX(v) { return TAO_M.x + v * TAO_M.k; }
  function taoMY(v) { return TAO_M.y + v * TAO_M.k; }
  function titleMotif(o) {
    var t = o.t || 0, scene = o.scene, out = "";
    var num = scene ? sc(scene, 0, "num") : null;
    var made = scene ? sc(scene, 0, "made") : null;
    var digit = scene && scene.beats.length > 1 ? sc(scene, 1, "digit") : null;
    var worth = scene && scene.beats.length > 1 ? sc(scene, 1, "worth") : null;
    var lit = null;
    if (made != null && t >= made) lit = t < made + 1.0 ? "tens" : t < made + 2.0 ? "ones" : null;
    out += R(4, 4, 352, 352, 30, "#123247", P.line, 3);
    /* on the two cards, and before "the number 34" is said, the number stands */
    var heading = scene ? popIn(t, num, 0.45) : 1;
    out += MK.pop(Tx(180, 54, "34", "lab", "middle", { "font-size": 56, fill: P.gold }), 180, 40, heading);
    out += ART.place(ART.placeValue({ tens: 3, ones: 4, lit: lit }), TAO_M.x, TAO_M.y, 354 * TAO_M.k, 274 * TAO_M.k);
    /* "Every digit": a ring round each of the two digits in the card */
    if (digit != null) {
      out += C(taoMX(95), taoMY(82), 34, "none", P.gold, 4, { opacity: on(t, digit, 0.4) });
      out += C(taoMX(259), taoMY(82), 34, "none", P.gold, 4, { opacity: on(t, digit == null ? null : digit + 0.35, 0.4) });
    }
    if (worth != null) {
      out += MK.pill(taoMX(95), 338, "worth 30", popIn(t, worth, 0.4), { size: 21, col: P.gold });
      out += MK.pill(taoMX(259), 338, "worth 4", popIn(t, worth == null ? null : worth + 0.5, 0.4), { size: 21, col: P.gold });
    }
    return '<svg viewBox="0 0 360 360" role="img" aria-label="The number 34 as three ten rods and four ones">' + out + "</svg>";
  }

  /* ==== chapter: tens and ones ======================================================
     One place-value card for 34, large on the left, and the film's own working
     on the right. The rods are ringed and counted ten, twenty, thirty; the
     cubes are ringed next; then 30 + 4 = 34 is written out; then one rod is
     stood beside ten separate cubes, so that "ten times a one" is something to
     count rather than only to hear. */
  function taoTensChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cBlocks = c(0, "blocks"), cMade = c(0, "made");
    var cRods = c(1, "rods"), cTen = c(1, "ten");
    var c10 = c(2, "ten"), c20 = c(2, "twenty"), c30 = c(2, "thirty");
    var cCubes = c(3, "cubes"), cOne = c(3, "one");
    var cSum = c(4, "sum"), cAns = c(4, "answer");
    var cRod = c(5, "rod"), cTenCubes = c(5, "cubes"), cTimes = c(5, "times");
    var out = "", k;

    /* which column is lit: the rods while they are being named and counted,
       the cubes while they are, and neither once the number is put together */
    var tensLit = on(t, cRods, 0.3) * taoUntil(t, scene, 3);
    var onesLit = on(t, cCubes, 0.3) * taoUntil(t, scene, 4);
    var lit = onesLit > 0.5 ? "ones" : tensLit > 0.5 ? "tens" : null;

    var appear = on(t, cBlocks, 0.5);
    out += G(taoPVCard(3, 4, lit), { opacity: appear, transform: around(taoPX(177), taoPY(137), 0.93 + 0.07 * appear) });
    /* "what it is made of": the two columns flash once, tens then ones */
    var madeT = bump(t, cMade, 0.7), madeO = bump(t, cMade == null ? null : cMade + 0.45, 0.7);
    if (madeT > 0) out += R(taoPX(20), taoPY(20), 150 * TAO_PV.k, 234 * TAO_PV.k, 18 * TAO_PV.k, "none", P.gold, 4, { opacity: 0.85 * madeT });
    if (madeO > 0) out += R(taoPX(184), taoPY(20), 150 * TAO_PV.k, 234 * TAO_PV.k, 18 * TAO_PV.k, "none", P.gold, 4, { opacity: 0.85 * madeO });

    /* the rods, ringed as they are named, then counted one at a time */
    out += taoRing(taoRodAt, 3, 12, 26, on(t, cRods, 0.4) * taoUntil(t, scene, 3));
    var oneTen = on(t, cTen, 0.4) * taoUntil(t, scene, 2);
    if (oneTen > 0) {
      var r0 = taoRodAt(0, 3);
      out += MK.leader(taoPX(95), taoPY(164), taoPX(r0[0]), taoPY(r0[1] - 22), on(t, cTen, 0.7), P.gold);
      out += MK.pill(taoPX(95), taoPY(152), "1 ten", oneTen, { size: 26, col: P.gold });
    }

    /* ten, twenty, thirty: the running count, and the rod it has reached */
    var count = c30 != null && t >= c30 ? 3 : c20 != null && t >= c20 ? 2 : c10 != null && t >= c10 ? 1 : 0;
    var countO = on(t, c10, 0.3) * taoUntil(t, scene, 4);
    if (countO > 0 && count > 0) {
      for (k = 0; k < count; k++) {
        var rk = taoRodAt(k, 3);
        out += R(taoPX(rk[0] - 9), taoPY(rk[1] - 22), 18 * TAO_PV.k, 44 * TAO_PV.k, 6, "none", P.gold, 3.5,
          { opacity: (k === count - 1 ? 1 : 0.45) * countO });
      }
      out += MK.pill(taoPX(95), taoPY(152), String(count * 10), countO, { size: 36, col: P.gold });
    }

    /* the cubes, ringed as they are named, and one of them worth just one */
    out += taoRing(taoCubeAt, 4, 12, 12, on(t, cCubes, 0.4) * taoUntil(t, scene, 4));
    var justOne = on(t, cOne, 0.4) * taoUntil(t, scene, 4);
    if (justOne > 0) {
      var q0 = taoCubeAt(0, 4);
      out += MK.pill(taoPX(259), taoPY(152), "1", justOne, { size: 36, col: P.accent });
      out += MK.leader(taoPX(259), taoPY(162), taoPX(q0[0]), taoPY(q0[1]) - 14, on(t, cOne, 0.7), P.accent);
    }

    /* 30 and 4 make 34 */
    var sumO = taoOnly(t, scene, 4);
    if (sumO > 0) {
      out += Tx(905, 152, "30 + 4", "lab huge", "middle", { fill: P.ink, opacity: on(t, cSum, 0.4) * sumO });
      out += Tx(905, 238, "= 34", "lab huge", "middle", { fill: P.gold, opacity: popIn(t, cAns, 0.4) * sumO });
      out += Tx(905, 310, "3 tens and 4 ones", "lab big muted", "middle", { opacity: on(t, cAns == null ? null : cAns + 0.4, 0.5) * sumO });
    }

    /* one rod beside ten cubes: count them */
    var cmp = taoOnly(t, scene, 5);
    if (cmp > 0) {
      out += taoRod(700, 140, 44, 150, popIn(t, cRod, 0.4) * cmp);
      out += Tx(792, 228, "=", "lab", "middle", { "font-size": 60, fill: P.muted, opacity: on(t, cTenCubes, 0.4) * cmp });
      var got = tally(t, cTenCubes, 10, 1.0);
      for (k = 0; k < got; k++) {
        out += taoCube(840 + (k % 5) * 46, 176 + Math.floor(k / 5) * 46, 38, cmp);
      }
      out += Tx(930, 330, "1 ten = 10 ones", "lab big", "middle", { fill: P.gold, opacity: on(t, cTimes, 0.5) * cmp });
    }
    return svg(out);
  }
