  /* ==== Animals and Their Coverings, part 4 of 4: the chapters "Like their
     parents" and "Diagram or picture", the recap, and KINDS ======================

     The dog family is the lesson's own (its "Like mother, like father" step): a
     spotty mother, a brown father, and three puppies - one spotty, one brown,
     one brown with spots. The dogs are DRAWN rather than emoji, because the
     line names each coat and an emoji dog cannot be spotty.

     The bird diagram is the lesson's own drawing, BIRD_DIAGRAM in
     content/lesson-1.py, redrawn here in its own 120 x 90 space so that each
     stroke and each label can arrive as it is said. The path data, the colours
     and the label positions are the lesson's, character for character. */

  /* ---- a dog, drawn side on, in a 100 x 80 space scaled to `size` wide ------- */
  var AC_COAT = {
    spotty: { skin: "#F2E7D6", line: "#8B7355", spot: "#5A4633" },
    brown: { skin: "#A5713C", line: "#6E4722", spot: null },
    both: { skin: "#A5713C", line: "#6E4722", spot: "#4A3524" }
  };
  var AC_SPOTS = [[36, 40, 6.5], [52, 50, 5], [58, 37, 4], [29, 49, 4], [76, 29, 3.5]];
  function acDog(cx, cy, size, coat, o, spotGlow) {
    if (!(o > 0)) return "";
    var C1 = AC_COAT[coat] || AC_COAT.brown, s = size / 100, w = 1.8;
    var b = "";
    /* legs first, so the body sits over them */
    [28, 41, 55, 66].forEach(function (lx) { b += R(lx, 56, 7.5, 18, 3, C1.skin, C1.line, w); });
    b += Pth("M22,42 C10,38 9,26 16,21", null, C1.line, 4.4);                 /* tail */
    b += E(46, 46, 26, 18, C1.skin, C1.line, w);                              /* body */
    b += C(76, 34, 15, C1.skin, C1.line, w);                                  /* head */
    b += E(90, 40, 9, 6.5, C1.skin, C1.line, w);                              /* snout */
    b += Pth("M70,22 C62,26 62,38 67,43 C72,42 73,30 72,24 Z", C1.line, C1.line, 1);  /* ear */
    if (C1.spot) AC_SPOTS.forEach(function (sp, k) {
      b += C(sp[0], sp[1], sp[2], C1.spot, null, null, { opacity: 0.92 });
      if (spotGlow > 0) b += C(sp[0], sp[1], sp[2] + 2.4, "none", P.gold, 2, { opacity: spotGlow });
    });
    b += C(80, 30, 2.4, "#241A12");                                            /* eye */
    b += C(97.5, 38, 2.8, "#241A12");                                          /* nose */
    return G(b, { transform: "translate(" + n2(cx - size / 2) + "," + n2(cy - size * 0.4) + ") scale(" + n3(s) + ")", opacity: clamp(o, 0, 1) });
  }

  /* ==== chapter: like their parents ==================================================== */
  var AC_PUPS = ["spotty", "brown", "both"];
  var AC_PUP_X = [330, 584, 838];
  var AC_MUM = [210, 118], AC_DAD = [958, 118];

  function acParentsChapter(scene, beat, t, i) {
    var c = function (b, n) { return sc(scene, b, n); }, out = "";
    var cPups = c(0, "puppies"), cMum = c(0, "mother"), cDad = c(0, "father");
    var cSpot = c(1, "spotty"), cBrown = c(1, "brown"), cBoth = c(1, "both");
    var cNoM = c(2, "mother"), cNoD = c(2, "father");
    var cMix = c(3, "mix"), cAll = c(3, "both");
    var gone = 1 - into(t, scene.first + 3);

    /* the two parents, each with the coat the line names */
    out += acDog(AC_MUM[0], AC_MUM[1], 200, "spotty", popIn(t, cMum, 0.5), 0);
    out += acDog(AC_DAD[0], AC_DAD[1], 200, "brown", popIn(t, cDad, 0.5), 0);
    out += MK.pill(AC_MUM[0], 224, "mother", on(t, cMum, 0.5), { size: 26, col: P.plum, ink: P.plum });
    out += MK.pill(AC_DAD[0], 224, "father", on(t, cDad, 0.5), { size: 26, col: P.blue, ink: P.blue });

    /* "Not exactly like the mother": a faded copy of that parent, crossed. It
       belongs to the PARENT band, tucked right under its own label, and is well
       clear of the litter: acDog draws from cy - 0.21 * size to cy + 0.34 * size,
       so at (150, 330) size 124 the copy spanned 304 to 372 and the puppies span
       331 to 412 - level with the three and nearly their size, the bottom of the
       frame read as a litter of five. It is now 76 px across against the pups'
       146, it stops at 310, and a dashed box round it (not a ring level with the
       pups' own waiting rings) says it is a copy rather than a dog. */
    var gm = on(t, cNoM, 0.5) * gone, gd = on(t, cNoD, 0.5) * gone;
    if (gm > 0) out += G(acDog(150, 284, 76, "spotty", 1, 0) +
      R(106, 254, 88, 62, 14, "none", P.muted, 2, { "stroke-dasharray": "9 8" }),
      { opacity: 0.55 * gm }) + MK.cross(212, 285, 19, popIn(t, cNoM == null ? null : cNoM + 0.25, 0.4) * gm);
    if (gd > 0) out += G(acDog(1018, 284, 76, "brown", 1, 0) +
      R(974, 254, 88, 62, 14, "none", P.muted, 2, { "stroke-dasharray": "9 8" }),
      { opacity: 0.62 * gd }) + MK.cross(1080, 285, 19, popIn(t, cNoD == null ? null : cNoD + 0.25, 0.4) * gd);

    /* "a mix from BOTH parents": one band, the mother's colour running into the
       father's, fed by an arrow from each and feeding all three puppies */
    var mx = on(t, cMix, 0.6);
    if (mx > 0) {
      out += '<defs><linearGradient id="acMix" x1="0" x2="1"><stop offset="0" stop-color="' + P.plum +
        '"/><stop offset="1" stop-color="' + P.blue + '"/></linearGradient></defs>' +
        R(300, 264, 568 * mx, 16, 8, "url(#acMix)", null, null, { opacity: mx });
      out += MK.arrow(258, 240, 314, 258, mx, P.plum, 6) + MK.arrow(910, 240, 854, 258, mx, P.blue, 6);
    }
    /* the three puppies, each as its coat is named */
    AC_PUPS.forEach(function (coat, k) {
      var pAt = [cSpot, cBrown, cBoth][k], p = popIn(t, pAt, 0.45);
      if (p <= 0) return;
      var x = AC_PUP_X[k], glow = k === 2 ? bump(t, cBoth, 1.1) + 0.7 * bump(t, cMix, 1.2) : 0;
      out += G(acDog(x, 362, 146, coat, 1, glow), { transform: around(x, 362, Math.min(p, 1.1)) });
      var u = on(t, cAll == null ? null : cAll + k * 0.16, 0.45);
      if (u > 0) out += L(x, 282, x, lerp(282, 336, u), P.teal, 4, { opacity: u });
      out += MK.tick(x + 84, 352, 17, popIn(t, cAll == null ? null : cAll + 0.3 + k * 0.16, 0.4));
    });
    /* before any coat is named, the three wait as empty places */
    var wait = on(t, cPups, 0.5) * (1 - on(t, cSpot, 0.4));
    if (wait > 0 && cSpot != null) out += G(AC_PUP_X.map(function (x) {
      return C(x, 356, 62, "none", P.line, 3, { "stroke-dasharray": "13 10" });
    }).join(""), { opacity: wait });
    return svg(out);
  }

  /* ==== chapter: diagram or picture ====================================================
     The lesson's own bird diagram, drawn stroke by stroke and then labelled. */
  /* `mark` is the PART the label names, in the drawing's own coordinates: what
     lights up is the wing, the beak and the legs, not a disc behind the word. */
  var AC_DLAB = [
    { key: "wing", text: "wing", x: 4, y: 14, line: [22, 16, 46, 40], mark: [47, 41, 11] },
    { key: "beak", text: "beak", x: 90, y: 24, line: [98, 27, 96, 40], mark: [93, 43, 9] },
    { key: "legs", text: "legs", x: 30, y: 86, line: null, mark: [52, 70, 12] }
  ];
  function acBirdDiagram(x, y, s, o) {
    var body = 190, b = "";
    b += Pth("M20 55 q30 -30 60 -10 l20 -6 l-16 14 q-10 22 -44 18z", null, "#fff", 2,
      { "stroke-dasharray": n2(body) + " " + n2(body), "stroke-dashoffset": n2(body * (1 - clamp(o.draw, 0, 1))) });
    b += C(86, 42, 2, "#fff", null, null, { opacity: clamp((o.draw - 0.8) * 5, 0, 1) });
    b += Pth("M60 62 l-8 16 M52 62 l-8 16", null, "#fff", 2, { opacity: clamp((o.draw - 0.85) * 6, 0, 1) });
    AC_DLAB.forEach(function (d, k) {
      var lo = o.labels[k], hot = o.hot[k];
      if (!(lo > 0)) return;
      var sc2 = 1 + 0.3 * hot, tx = d.x + 9, ty = d.y - 3;
      if (d.line && o.lines[k] > 0) b += L(d.line[0], d.line[1], lerp(d.line[0], d.line[2], o.lines[k]), lerp(d.line[1], d.line[3], o.lines[k]), "#F4C95D", 1 + 1.4 * hot, { opacity: lo });
      if (hot > 0) b += C(d.mark[0], d.mark[1], d.mark[2] * (0.7 + 0.3 * hot), "none", "#F4C95D", 2.4, { opacity: Math.min(1, hot) });
      b += G('<text x="' + n2(d.x) + '" y="' + n2(d.y) + '" fill="#F4C95D" font-size="9" font-family="Inter, sans-serif">' + d.text + "</text>",
        { opacity: lo, transform: around(tx, ty, sc2) });
    });
    return G(b, { transform: "translate(" + n2(x) + "," + n2(y) + ") scale(" + n3(s) + ")" });
  }

  var AC_TINT = [[796, 186, 46, "#5FA9E8"], [864, 224, 40, "#E8C15F"], [826, 274, 36, "#7FD08A"]];

  function acDiagramChapter(scene, beat, t, i) {
    var c = function (b, n) { return sc(scene, b, n); }, out = "";
    var cPic = c(0, "picture"), cLooks = c(0, "looks");
    var cDia = c(1, "diagram"), cDraw = c(1, "drawing"), cLab = c(1, "labels"), cParts = c(1, "parts");
    var cWing = c(2, "wing"), cBeak = c(2, "beak"), cLegs = c(2, "legs");
    var cCol = c(3, "colours"), cPurp = c(3, "purpose"), cStand = c(3, "stand");
    var cDrw = c(4, "draw"), cMat = c(4, "matters");

    /* the picture, left */
    var po = popIn(t, cPic, 0.5);
    if (po > 0) {
      out += MK.pop(R(60, 62, 460, 320, 24, P.card, P.line, 2), 290, 222, po);
      out += MK.glow(290, 232, 150, P.blue, 0.8 * bump(t, cLooks, 1.2));
      out += G(MK.pic(290, 232, 200, AC.bird), { transform: around(290, 232, Math.min(po, 1.1) * (1 + 0.06 * bump(t, cLooks, 1.0))), opacity: Math.min(1, po) });
      out += MK.pill(290, 62, "picture", Math.min(1, po), { size: 26, col: P.blue, ink: P.blue, fill: P.ground });
    }
    /* the diagram, right */
    var dop = popIn(t, cDia, 0.5);
    if (dop > 0) {
      out += MK.pop(R(608, 62, 500, 320, 24, P.card, P.gold, 2, { "stroke-opacity": 0.4 + 0.6 * on(t, cMat, 0.5) }), 858, 222, dop);
      var labO = on(t, cLab, 0.45), lines = [on(t, cParts, 0.6), on(t, cParts == null ? null : cParts + 0.2, 0.6), 0];
      out += acBirdDiagram(690, 96, 2.8, {
        draw: on(t, cDraw, 1.1),
        labels: [on(t, cLab, 0.4), on(t, cLab == null ? null : cLab + 0.18, 0.4), on(t, cLab == null ? null : cLab + 0.36, 0.4)],
        lines: lines,
        /* both marks come BACK to nothing: a glow that stayed on left three grey
           discs behind the labels for the rest of the chapter */
        hot: [bump(t, cWing, 1.0), bump(t, cBeak, 1.0), bump(t, cLegs, 1.0)].map(function (v, k) {
          return v + 0.8 * bump(t, cStand == null ? null : cStand + k * 0.14, 1.2);
        })
      });
      out += MK.pill(858, 62, "diagram", Math.min(1, dop), { size: 26, col: P.gold, ink: P.gold, fill: P.ground });
      if (labO <= 0 && on(t, cDraw, 0.4) > 0) out += "";
      /* colours appear over the drawing, then lift away and leave it clean */
      var tin = on(t, cCol, 0.45) * (1 - on(t, cPurp, 1.3));
      if (tin > 0) AC_TINT.forEach(function (sw) {
        var rise = 76 * on(t, cPurp, 1.3);
        out += C(sw[0], sw[1] - rise, sw[2], sw[3], null, null, { opacity: 0.55 * tin });
      });
      /* scientists draw them: a tap, the lesson's own pencil, and a tick */
      out += MK.ripple(858, 222, t, cDrw, P.gold);
      var pe = popIn(t, cDrw, 0.45);
      if (pe > 0) out += G(MK.pic(1052, 330, 66, "✏️"), { transform: around(1052, 330, Math.min(pe, 1.1)), opacity: Math.min(1, pe) });
      out += MK.tick(1078, 90, 22, popIn(t, cMat, 0.45));
    }
    return svg(out);
  }

  /* ==== what you now know ============================================================== */
  function acFourCoverings(cx, cy, size) {
    var r = size * 0.24, out = "";
    [[-1, -1, 0], [1, -1, 1], [-1, 1, 2], [1, 1, 3]].forEach(function (q, k) {
      var x = cx + q[0] * (r + 3), y = cy + q[1] * (r + 3), id = "acRc" + k;
      out += el("clipPath", { id: id }, C(x, y, r)) +
        G(acCovering(q[2], x, y, r, 0, {}, id), { "clip-path": "url(#" + id + ")" }) +
        C(x, y, r, "none", P.line, 2);
    });
    return out;
  }

  var AC_RECAP = MK.recapKind([
    { beat: 0, at: "covering", title: "Coverings", sub: "fur, feathers, scales, skin", pic: acFourCoverings },
    { beat: 1, at: "sort", title: "Sort them", sub: "by what covers them", pic: "\u{1F5C2}️" },
    { beat: 1, at: "alike", title: "Alike and different", sub: "same parts, own details",
      pic: function (cx, cy, size) { return MK.pic(cx - size * 0.32, cy, size * 0.78, AC.catBody) + MK.pic(cx + size * 0.32, cy, size * 0.78, AC.dog); } },
    { beat: 2, at: "grow", title: "Growing up", sub: "egg, chick, hen",
      pic: function (cx, cy, size) { return MK.pic(cx - size * 0.34, cy, size * 0.66, AC.egg) + MK.pic(cx + size * 0.28, cy, size * 0.82, AC.hen); } },
    { beat: 2, at: "mix", title: "A mix from both", sub: "not a copy of one parent",
      pic: function (cx, cy, size) { return acDog(cx, cy + size * 0.1, size * 1.05, "both", 1, 0); } },
    { beat: 3, at: "diagram", title: "Diagram", sub: "labels name the parts", pic: "✏️" }
  ], { goBeat: 3, goAt: "look" });

  var KINDS = {
    title: MK.titleKind({ sub: ["Fur, feathers, scales and skin", "How animals are alike and different", "Growing up, and a mix from both parents"] }),
    coverings: acCoveringsChapter,
    sort: acSortChapter,
    alike: acAlikeChapter,
    grow: acGrowChapter,
    parents: acParentsChapter,
    diagram: acDiagramChapter,
    recap: AC_RECAP
  };
