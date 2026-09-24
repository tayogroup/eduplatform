  /* ==== Shapes and Sizes, part 2 ==============================================
     The chapters "Solid shapes" and "Flat or solid?". See shapes-and-sizes.js
     for the palette and the shared drawings. */

  /* how many of a beat's cues have been said by t: the count on screen is
     therefore always the count the voice has reached */
  function ssSaid(t, cues) {
    var n = 0;
    for (var k = 0; k < cues.length; k++) if (cues[k] != null && t >= cues[k]) n++;
    return n;
  }
  /* the first n whole numbers, or false for none: ART.solid's own mark list */
  function ssUpTo(n) {
    if (n <= 0) return false;
    var out = [], k;
    for (k = 0; k < n; k++) out.push(k);
    return out;
  }

  /* ==== chapter: solid shapes ====================================================
     ART.solid draws every solid see-through, so the faces and edges at the back
     are dashed and can be counted with the rest - which is the lesson's own
     point ("A cube has 6 faces... The picture only shows 3 of them"). The faces
     are marked one at a time, on the words one to six, and then the edges. */
  var SS_SOLID = { x: 434, y: 36, w: 364 };
  var SS_PAIR_L = { x: 236, y: 58, w: 312 }, SS_PAIR_R = { x: 622, y: 58, w: 312 };

  function ssSolidPlace(markup, b) { return ART.place(markup, b.x, b.y, b.w, b.w); }

  function ssSolidCard(scene, n, t) {
    var k = n - scene.first;
    var c = function (j, name) { return sc(scene, j, name); };
    if (k <= 1) {
      /* "You can hold it in your hand": the cube lifts off its shadow */
      var lift = k === 0 ? on(t, c(0, "hold"), 0.8) : 0;
      return (lift > 0 ? E(SS_SOLID.x + SS_SOLID.w / 2, SS_SOLID.y + SS_SOLID.w - 6, 108 * lift, 15 * lift, "#000000", null, null, { opacity: 0.28 * lift }) : "") +
        G(ssSolidPlace(ART.solid("cube"), SS_SOLID), { transform: tr(0, -18 * lift) });
    }
    if (k === 2) {
      var said = ssSaid(t, [c(2, "one"), c(2, "two"), c(2, "three"), c(2, "four"), c(2, "five"), c(2, "six")]);
      return ssSolidPlace(ART.solid("cube", { faces: ssUpTo(said) }), SS_SOLID);
    }
    if (k === 3) {
      var all = c(3, "twelve") != null && t >= c(3, "twelve");
      var one = c(3, "edge") != null && t >= c(3, "edge");
      return ssSolidPlace(ART.solid("cube", { edges: all ? true : one ? [0] : false }), SS_SOLID);
    }
    if (k === 4) {
      var face1 = c(4, "curved") != null && t >= c(4, "curved");
      return ssSolidPlace(ART.solid("sphere", { faces: face1 ? [0] : false }), SS_SOLID);
    }
    return ssSolidPlace(ART.solid("cylinder"), SS_PAIR_L) + ssSolidPlace(ART.solid("cone"), SS_PAIR_R);
  }

  function ssSolidChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var out = "";

    out += crossfade(t, i, scene, function (n) { return ssSolidCard(scene, n, t); });

    /* beat 0: what a solid shape is */
    var b0 = ssOnly(t, scene, 0);
    if (b0 > 0) {
      out += G(MK.pill(190, 176, "solid", on(t, c(0, "solid"), 0.4), { size: 34, col: P.teal }) +
        MK.pill(190, 252, "not flat", on(t, c(0, "solid"), 0.4), { size: 30, col: P.muted }) +
        MK.pill(978, 214, "hold it", on(t, c(0, "hold"), 0.4), { size: 32, col: P.gold }), { opacity: b0 });
    }

    /* beat 1: like a dice, and the word face. The dice goes at beat 3, so the
       left column is clear for the edge's own picture. */
    var b1 = ssFrom(t, scene, 1) * (1 - ssFrom(t, scene, 4));
    if (b1 > 0) {
      out += G(MK.pill(186, 96, "cube", on(t, c(1, "cube"), 0.4), { size: 34, col: P.teal }) +
        MK.pill(978, 130, "face", on(t, c(1, "faces"), 0.4), { size: 34, col: P.gold }), { opacity: b1 });
      out += G(MK.pop(Em(186, 232, 118, "\u{1F3B2}"), 186, 232, popIn(t, c(1, "dice"), 0.45)),
        { opacity: b1 * (1 - ssFrom(t, scene, 3)) });
    }

    /* beat 2: six faces counted */
    var b2 = ssFrom(t, scene, 2) * (1 - ssFrom(t, scene, 4));
    if (b2 > 0) out += G(MK.pill(978, 236, "6 faces", on(t, c(2, "six"), 0.4), { size: 36, col: P.gold }), { opacity: b2 });

    /* beat 3: the edges, and what an edge is - two faces meeting along a line */
    var b3 = ssFrom(t, scene, 3) * (1 - ssFrom(t, scene, 4));
    if (b3 > 0) {
      out += G(MK.pill(186, 210, "edge", on(t, c(3, "edge"), 0.4), { size: 34, col: P.accent }) +
        ssFacesMeet(186, 330, 196, popIn(t, c(3, "meet"), 0.5)) +
        MK.pill(978, 340, "12 edges", on(t, c(3, "twelve"), 0.4), { size: 36, col: P.accent }), { opacity: b3 });
    }

    /* beat 4: the sphere */
    var b4 = ssOnly(t, scene, 4);
    if (b4 > 0) {
      var no4 = popIn(t, c(4, "none"), 0.4);
      out += G(MK.pill(186, 150, "sphere", on(t, c(4, "sphere"), 0.4), { size: 34, col: P.teal }) +
        MK.pop(Em(186, 288, 120, "⚽"), 186, 288, popIn(t, c(4, "ball"), 0.45)) +
        MK.pill(978, 150, "1 curved face", on(t, c(4, "curved"), 0.4), { size: 28, col: P.gold }) +
        MK.cross(978, 254, 28, no4) +
        MK.pill(978, 330, "no edges", Math.min(1, no4), { size: 32, col: P.accent }), { opacity: b4 });
    }

    /* beat 5: the cylinder and the cone */
    var b5 = ssOnly(t, scene, 5);
    if (b5 > 0) {
      var g5 = "";
      g5 += MK.pill(SS_PAIR_L.x + SS_PAIR_L.w / 2, 402, "cylinder", on(t, c(5, "cylinder"), 0.4), { size: 32, col: P.teal });
      g5 += MK.pill(SS_PAIR_R.x + SS_PAIR_R.w / 2, 402, "cone", on(t, c(5, "cone"), 0.4), { size: 32, col: P.teal });
      g5 += MK.pop(Em(120, 190, 116, "\u{1F96B}"), 120, 190, popIn(t, c(5, "tin"), 0.45));
      /* the cone's apex, in the film's space: ART.solid draws it at (150, 64)
         of its own 300-wide card, so the arrow lands ON the point */
      var pt = popIn(t, c(5, "point"), 0.4);
      g5 += MK.arrow(1062, 246, 812, 142, Math.min(1, pt), P.gold, 8);
      g5 += MK.pill(1048, 306, "a point", Math.min(1, pt), { size: 28, col: P.gold });
      out += G(g5, { opacity: b5 });
    }

    return svg(out);
  }

  /* ==== chapter: flat or solid? ==================================================
     The one question the lesson asks - could I pick it up and turn it over? -
     with a flat shape on the left and the solid one beside it: a circle and a
     ball, then a square and a cube, whose six faces ARE squares. */
  var SS_SORT_L = ssBox(156, 42, 272);
  var SS_SORT_R = { x: 724, y: 34, w: 288 };
  var SS_SORT_FLAT = ["circle", "circle", "circle", "square"];
  var SS_SORT_SOLID = ["sphere", "sphere", "sphere", "cube"];

  function ssSortCards(scene, n, t) {
    var k = clamp(n - scene.first, 0, 3);
    var c = function (j, name) { return sc(scene, j, name); };
    /* "turn it over": the solid one swings, because a solid shape can be turned */
    var swing = k === 1 ? 11 * Math.sin(Math.PI * 2 * clamp((t - (c(1, "turn") || 1e9)) / 1.4, 0, 1)) : 0;
    var rx = SS_SORT_R.x + SS_SORT_R.w / 2, ry = SS_SORT_R.y + SS_SORT_R.w / 2;
    var six = k === 3 && c(3, "six") != null && t >= c(3, "six");
    return ssPlace(ART.shape2d(SS_SORT_FLAT[k], { colour: "teal" }), SS_SORT_L) +
      G(ART.place(ART.solid(SS_SORT_SOLID[k], six ? { faces: true } : null), SS_SORT_R.x, SS_SORT_R.y, SS_SORT_R.w, SS_SORT_R.w),
        { transform: "rotate(" + n2(swing) + " " + n2(rx) + " " + n2(ry) + ")" });
  }

  /* a ring round one of the two cards: 0 the flat one, 1 the solid one */
  function ssSortRing(which, o, col) {
    if (!(o > 0)) return "";
    var b = which ? { x: SS_SORT_R.x - 8, y: SS_SORT_R.y - 8, w: SS_SORT_R.w + 16, h: SS_SORT_R.w + 16 }
      : { x: SS_SORT_L.x - 8, y: SS_SORT_L.y - 8, w: SS_SORT_L.w + 16, h: SS_SORT_L.h + 16 };
    return R(b.x, b.y, b.w, b.h, 28, "none", col, 5, { opacity: clamp(o, 0, 1) });
  }

  function ssSortChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var out = "", lx = SS_SORT_L.x + SS_SORT_L.w / 2, rx = SS_SORT_R.x + SS_SORT_R.w / 2;

    out += crossfade(t, i, scene, function (n) { return ssSortCards(scene, n, t); });

    /* beat 0: the two of them, and the question mark between */
    var b0 = ssOnly(t, scene, 0);
    if (b0 > 0) {
      out += G(MK.qmark(578, 168, 46, on(t, c(0, "tell"), 0.5)) +
        MK.pill(lx, 352, "flat?", on(t, c(0, "flat"), 0.4), { size: 30, col: P.muted }) +
        MK.pill(rx, 372, "solid?", on(t, c(0, "solid"), 0.4), { size: 30, col: P.muted }), { opacity: b0 });
    }

    /* beat 1: the one question to ask */
    var b1 = ssOnly(t, scene, 1);
    if (b1 > 0) {
      out += G(MK.pill(578, 392, "Could I pick it up?", on(t, c(1, "ask"), 0.4), { size: 28, col: P.gold }) +
        MK.arrow(rx, 424, rx, 372, on(t, c(1, "pick"), 0.5), P.gold, 8) +
        MK.pill(578, 168, "turn it", on(t, c(1, "turn"), 0.4), { size: 26, col: P.gold }), { opacity: b1 });
    }

    /* beat 2: the circle is flat, the ball is solid. Each card is ringed as it
       is named, so the words pick out which of the two is being talked about. */
    var b2 = ssFrom(t, scene, 2), only2 = ssOnly(t, scene, 2);
    if (only2 > 0) {
      /* this beat's own rings go out with it, so the next beat's "square" and
         "cube" have rings of their own to bring back */
      out += G(ssSortRing(0, on(t, c(2, "circle"), 0.5), P.teal) +
        ssSortRing(1, on(t, c(2, "ball"), 0.5), P.accent), { opacity: only2 });
    }
    if (b2 > 0) {
      var flat2 = on(t, c(2, "flat"), 0.4), hold2 = on(t, c(2, "hold"), 0.4);
      out += G(MK.pill(lx, 352, "flat", flat2, { size: 34, col: P.teal }) +
        MK.pill(rx, 372, "solid", hold2, { size: 34, col: P.accent }) +
        MK.tick(578, 250, 30, popIn(t, c(2, "hold"), 0.4)), { opacity: b2 });
    }

    /* beat 3: a cube is made of six square faces */
    var b3 = ssOnly(t, scene, 3);
    if (b3 > 0) {
      var six3 = on(t, c(3, "six"), 0.6);
      out += G(ssSortRing(0, on(t, c(3, "square"), 0.5), P.teal) +
        ssSortRing(1, on(t, c(3, "cube"), 0.5), P.accent) +
        MK.leader(lx + 150, 176, SS_SORT_R.x + 26, 176, six3, P.gold) +
        MK.pill(578, 392, "6 square faces", six3, { size: 30, col: P.gold }), { opacity: b3 });
    }

    return svg(out);
  }
