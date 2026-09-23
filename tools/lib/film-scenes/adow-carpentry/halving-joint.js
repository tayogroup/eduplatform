
  /* ==== Professor Adow TVET — Marking Out and Cutting a Halving Joint ======
     The pictures of the halving-joint film, between the shared engine's head
     and tail (tools/lib/ehel-film-engine-head.js explains the assembly).

     NOTHING IS LIFTED FROM THE LESSON. The Science films pass
     renderer.art: ["science"] and the engine pulls the kit's own drawings in.
     That works there because those drawings are pure functions of a state
     index. Carpentry's are SVG DOM built at run time by carpentry.js, and
     this engine emits SVG STRINGS at a time t, so every picture here is drawn
     fresh — in the colours the lesson uses, so a learner who watches the film
     and then opens the lesson sees the same timber and the same marks.

     THE ANIMATION IS CUED OFF THE WORDS, not off a schedule. `cue(beat, name)`
     is the measured moment a phrase is spoken, so the shoulder line is drawn
     as the narrator says "square the shoulder line" — which is the whole
     reason the storyboard keys its marks to phrases rather than to seconds.

     A learner here is an adult at grade 8 to 11 level. There are no stickers
     and no cartoon hands: the drawings are the drawings a tradesperson would
     make on the wood. */

  /* ---- the timber palette, the lesson's own ---------------------------- */
  var WOOD = "#C98A4B", WOOD_D = "#A96E35", WOOD_END = "#B87C3F", GRAIN = "#8A5A28";
  var STEEL = "#B9C6D0", STEEL_D = "#7E8E9B", BRASS = "#C9A227", HANDLE = "#7A4A22";

  /* Each scene owns a colour, as in the science and maths films, so the film
     reads as chapters. */
  var HUE = {
    title: P.teal, joint: P.teal, tools: P.blue, faces: P.gold,
    shoulder: P.plum, gauge: P.teal, waste: P.accent, safety: P.accent,
    saw: P.bad, fit: P.good, recap: P.teal
  };

  /* ==== the timber ========================================================= */

  /* A board seen face on. Grain runs ALONG the length, never across it —
     drawing grain across a board is the mistake a trainer spots first. */
  function board(x, y, w, h, o) {
    o = o || {};
    var out = R(x, y, w, h, 3, o.fill || WOOD, WOOD_D, 2.5);
    var rows = Math.max(2, Math.round(h / 22));
    for (var k = 1; k <= rows; k++) {
      var gy = y + (h * k) / (rows + 1);
      out += Pth("M" + n2(x + 5) + "," + n2(gy) +
        " C" + n2(x + w * 0.3) + "," + n2(gy - 3) +
        " " + n2(x + w * 0.62) + "," + n2(gy + 3) +
        " " + n2(x + w - 5) + "," + n2(gy),
        null, GRAIN, 1.4, { opacity: 0.34 });
    }
    if (o.end) {
      var ex = o.end === "left" ? x : x + w - 14;
      out += R(ex, y, 14, h, 2, WOOD_END, WOOD_D, 2.5);
      for (var r = 1; r <= 3; r++) {
        out += Pth("M" + n2(ex + 2) + "," + n2(y + (h * r) / 4) + " q6,-4 11,0", null, GRAIN, 1.3, { opacity: 0.5 });
      }
    }
    return out;
  }

  /* the carpenter's own handwriting: a looping f on the face side, and the
     mark on the edge that meets it */
  function faceMark(x, y, s, p) {
    if (!(p > 0)) return "";
    return G(Pth("M" + n2(x) + "," + n2(y) + " c0," + n2(-26 * s) + " " + n2(6 * s) + "," + n2(-34 * s) +
      " " + n2(13 * s) + "," + n2(-34 * s) + " c" + n2(5 * s) + ",0 " + n2(7 * s) + "," + n2(5 * s) +
      " " + n2(6 * s) + "," + n2(9 * s), null, P.ink, 3 * s),
      { opacity: Math.min(1, p) });
  }
  function edgeMark(x1, x2, y, p) {
    if (!(p > 0)) return "";
    return L(x1, y, lerp(x1, x2, Math.min(1, p)), y, P.teal, 4.5, { opacity: 0.95 });
  }

  /* ==== the tools ========================================================== */

  function trySquareFig(cx, cy, s, glow) {
    var out = "";
    if (glow > 0) out += R(cx - 30 * s, cy - 92 * s, 250 * s, 150 * s, 18 * s, P.blue, null, null, { opacity: 0.1 * glow });
    out += R(cx, cy - 78 * s, 38 * s, 156 * s, 4 * s, HANDLE, "#5C3517", 3);        /* stock */
    out += R(cx + 9 * s, cy - 70 * s, 7 * s, 140 * s, 0, BRASS, null, null, { opacity: 0.9 });
    out += R(cx + 26 * s, cy - 70 * s, 5 * s, 140 * s, 0, BRASS, null, null, { opacity: 0.55 });
    out += R(cx + 38 * s, cy - 78 * s, 190 * s, 24 * s, 2, STEEL, STEEL_D, 3);      /* blade */
    for (var k = 1; k < 9; k++) {
      out += L(cx + 38 * s + k * 21 * s, cy - 78 * s, cx + 38 * s + k * 21 * s, cy - 78 * s + (k % 5 === 0 ? 14 : 8) * s, STEEL_D, 1.6);
    }
    out += Pth("M" + n2(cx + 38 * s) + "," + n2(cy - 38 * s) + " v" + n2(-16 * s) + " h" + n2(16 * s), null, P.teal, 3.2 * s);
    return out;
  }

  function gaugeFig(cx, cy, s, glow, setP) {
    var out = "";
    if (glow > 0) out += R(cx - 20 * s, cy - 56 * s, 280 * s, 116 * s, 18 * s, P.teal, null, null, { opacity: 0.1 * glow });
    var stemW = lerp(150, 240, clamp(setP == null ? 1 : setP, 0, 1)) * s;
    out += R(cx, cy - 10 * s, stemW, 22 * s, 3, HANDLE, "#5C3517", 2.5);            /* stem */
    out += R(cx + 62 * s, cy - 44 * s, 46 * s, 92 * s, 6, "#8B5A2B", "#5C3517", 2.5); /* fence */
    out += C(cx + 85 * s, cy - 50 * s, 10 * s, BRASS, "#8A6E12", 2.2);              /* thumbscrew */
    out += Pth("M" + n2(cx + stemW) + "," + n2(cy) + " l" + n2(13 * s) + "," + n2(-9 * s) +
      " v" + n2(18 * s) + " z", STEEL, STEEL_D, 1.8);                                /* the pin */
    return out;
  }

  function sawFig(cx, cy, s, glow, teethP, backP) {
    var out = "";
    if (glow > 0) out += R(cx - 20 * s, cy - 54 * s, 330 * s, 120 * s, 18 * s, P.blue, null, null, { opacity: 0.1 * glow });
    out += R(cx, cy - 6 * s, 236 * s, 34 * s, 0, STEEL, STEEL_D, 2.5);              /* blade */
    out += R(cx, cy - 18 * s, 236 * s, 13 * s, 3, "#6E7B86", STEEL_D, 2.5,
      backP > 0 ? { stroke: P.gold, "stroke-width": 3.4 } : null);                  /* the back */
    var d = "M" + n2(cx) + "," + n2(cy + 28 * s);
    for (var x = 0; x < 236; x += 9) d += " l" + n2(4.5 * s) + "," + n2(8 * s) + " l" + n2(4.5 * s) + "," + n2(-8 * s);
    out += Pth(d, null, teethP > 0 ? P.gold : STEEL_D, teethP > 0 ? 3 : 2.2);
    out += Pth("M" + n2(cx + 236 * s) + "," + n2(cy - 22 * s) + " h" + n2(44 * s) +
      " a" + n2(16 * s) + "," + n2(16 * s) + " 0 0 1 " + n2(16 * s) + "," + n2(16 * s) +
      " v" + n2(34 * s) + " a" + n2(16 * s) + "," + n2(16 * s) + " 0 0 1 " + n2(-16 * s) + "," + n2(16 * s) +
      " h" + n2(-44 * s) + " z", HANDLE, "#5C3517", 2.5);
    return out;
  }

  function chiselFig(cx, cy, s, ang) {
    return G(Pth("M0,0 l" + n2(-18 * s) + "," + n2(13 * s) + " l" + n2(18 * s) + "," + n2(13 * s) + " z", "#D8E2EA", STEEL_D, 2) +
      R(0, 0, 150 * s, 26 * s, 0, STEEL, STEEL_D, 2) +
      R(150 * s, -6 * s, 20 * s, 38 * s, 2, BRASS, "#8A6E12", 2) +
      Pth("M" + n2(170 * s) + "," + n2(-8 * s) + " h" + n2(62 * s) +
        " a" + n2(14 * s) + "," + n2(14 * s) + " 0 0 1 " + n2(14 * s) + "," + n2(14 * s) +
        " v" + n2(20 * s) + " a" + n2(14 * s) + "," + n2(14 * s) + " 0 0 1 " + n2(-14 * s) + "," + n2(14 * s) +
        " h" + n2(-62 * s) + " z", HANDLE, "#5C3517", 2),
      { transform: "translate(" + n2(cx) + "," + n2(cy) + ") rotate(" + n2(ang || 0) + ")" });
  }

  /* A bench plane, side on, sole flat. The Foundation module is largely about
     this tool and it appeared nowhere in the film, while the narration said
     "planed straight, planed square" over a board that had simply always been
     that way. */
  function planeFig(cx, cy, s) {
    var out = "";
    out += Pth("M0," + n2(-46 * s) + " h" + n2(150 * s) + " v" + n2(34 * s) +
      " l" + n2(-12 * s) + "," + n2(12 * s) + " h" + n2(-126 * s) +
      " l" + n2(-12 * s) + "," + n2(-12 * s) + " z", "#5E6B76", "#39434B", 2.4);   /* body */
    out += R(0, 0, 150 * s, 7 * s, 1, "#39434B", null, null, {});                   /* the sole */
    out += Pth("M" + n2(84 * s) + "," + n2(-40 * s) + " l" + n2(20 * s) + "," + n2(40 * s) +
      " h" + n2(-11 * s) + " l" + n2(-18 * s) + "," + n2(-38 * s) + " z", STEEL, STEEL_D, 1.8); /* iron */
    out += R(76 * s, -58 * s, 14 * s, 20 * s, 3, BRASS, "#8A6E12", 1.8);            /* lever cap */
    out += Pth("M" + n2(110 * s) + "," + n2(-40 * s) + " q" + n2(26 * s) + "," + n2(-30 * s) +
      " " + n2(30 * s) + "," + n2(4 * s) + " l" + n2(-11 * s) + "," + n2(36 * s) + " z",
      HANDLE, "#5C3517", 2);                                                        /* tote */
    out += C(22 * s, -50 * s, 11 * s, HANDLE, "#5C3517", 2);                        /* knob */
    return G(out, { transform: "translate(" + n2(cx) + "," + n2(cy) + ")" });
  }

  /* A carpenter's mallet — the tool that means the joint is WRONG. */
  function malletFig(cx, cy, s, ang) {
    return G(R(-34 * s, -26 * s, 68 * s, 52 * s, 4 * s, "#A5702F", "#6E4718", 2.4) +
      R(-34 * s, -26 * s, 12 * s, 52 * s, 3 * s, "#8B5A24", "#6E4718", 2) +
      R(-7 * s, 24 * s, 14 * s, 96 * s, 3 * s, HANDLE, "#5C3517", 2.2),
      { transform: "translate(" + n2(cx) + "," + n2(cy) + ") rotate(" + n2(ang || 0) + ")" });
  }

  /* A tape, hooked on a corner, its blade running to wherever it is measuring.
     The diagonals used to appear with nothing measuring them. */
  function tapeFig(x0, y0, x1, y1, p, reading) {
    if (!(p > 0)) return "";
    var ex = lerp(x0, x1, Math.min(1, p)), ey = lerp(y0, y1, Math.min(1, p));
    var out = L(x0, y0, ex, ey, "#E8C33A", 6, { "stroke-linecap": "butt" });
    out += L(x0, y0, ex, ey, "#8A6E12", 1.2, { opacity: 0.5 });
    out += Pth("M" + n2(x0 - 5) + "," + n2(y0 - 9) + " h10 v18 h-10 z", STEEL, STEEL_D, 1.6);  /* the hook */
    out += R(ex - 22, ey - 16, 44, 32, 5, "#C9433A", "#8E2B24", 2);                            /* the case */
    if (p >= 1 && reading) out += Tx((x0 + x1) / 2, (y0 + y1) / 2 - 10, reading, "lab", "middle", { fill: P.teal });
    return out;
  }

  /* A G-cramp, holding the work down to the bench. */
  function crampFig(cx, cy, s, tight) {
    var jaw = lerp(16, 4, clamp(tight, 0, 1));
    return G(Pth("M0,0 h" + n2(-54 * s) + " v" + n2(-84 * s) + " h" + n2(54 * s),
      null, "#4E5A64", 9 * s, { "stroke-linejoin": "round" }) +
      R(-8 * s, -92 * s, 22 * s, 9 * s, 2, "#4E5A64", null, null, {}) +
      R(-6 * s, (-jaw) * s, 16 * s, jaw * s + 4 * s, 2, STEEL, STEEL_D, 1.8) +
      L(2 * s, -4 * s, 2 * s, -40 * s, STEEL_D, 5 * s) +
      L(-16 * s, -40 * s, 20 * s, -40 * s, HANDLE, 6 * s),
      { transform: "translate(" + n2(cx) + "," + n2(cy) + ")" });
  }

  /* Eye protection. Not mentioned once in three minutes of sawing. */
  function gogglesFig(cx, cy, s) {
    return G(Pth("M" + n2(-74 * s) + "," + n2(-12 * s) + " q" + n2(74 * s) + "," + n2(-16 * s) +
      " " + n2(148 * s) + ",0 v" + n2(30 * s) + " q" + n2(-30 * s) + "," + n2(16 * s) +
      " " + n2(-50 * s) + "," + n2(2 * s) + " q" + n2(-24 * s) + "," + n2(-8 * s) +
      " " + n2(-48 * s) + ",0 q" + n2(-20 * s) + "," + n2(14 * s) + " " + n2(-50 * s) + "," + n2(-2 * s) + " z",
      "#BEE3F2", "#5B8EA6", 3, { opacity: 0.92 }) +
      L(-74 * s, -4 * s, -104 * s, 4 * s, "#5B8EA6", 5 * s) +
      L(74 * s, -4 * s, 104 * s, 4 * s, "#5B8EA6", 5 * s),
      { transform: "translate(" + n2(cx) + "," + n2(cy) + ")" });
  }

  /* A run of saw teeth, drawn sharp or blunt. The difference is the whole of
     "a sharp tool is the safer tool" and it cannot be said in words alone. */
  function teethRow(x, y, w, blunt, col) {
    var d = "M" + n2(x) + "," + n2(y), step = blunt ? 20 : 11;
    for (var k = 0; k * step < w; k++) {
      if (blunt) d += " q" + n2(step / 2) + ",13 " + n2(step) + ",0";
      else d += " l" + n2(step / 2) + ",14 l" + n2(step / 2) + ",-14";
    }
    return Pth(d, null, col, 3.2, { "stroke-linejoin": "round" });
  }

  /* THE TWO MEMBERS OF A HALVING JOINT, and the one thing the film kept
     getting wrong. They used to be drawn as two boards STACKED — the upper
     sitting on top of the lower — so the assembled lap was two thicknesses
     and the green "the two faces finish flush" lines were ruled across a
     joint twice as thick as either member. That is the opposite of what a
     halving joint is for.

     Both members are now in the SAME band. Each has its half taken out while
     they are apart; as they close, the cut-away fades and a seam takes its
     place, which is exactly what a finished halving joint looks like. */
  function lapPair(x, y, mw, mh, lap, gap, apFix) {
    var ux = x + mw - lap;
    var ap = apFix == null ? clamp(gap / 20, 0, 1) : apFix;
    var out = board(x, y, mw, mh, {});
    if (ap > 0) out += R(ux, y, lap, mh / 2, 0, P.ground, WOOD_D, 2.5, { opacity: ap });
    out += G(board(0, 0, mw, mh, {}) +
      (ap > 0 ? R(0, mh / 2, lap, mh / 2, 0, P.ground, WOOD_D, 2.5, { opacity: ap }) : ""),
      { transform: "translate(" + n2(ux) + "," + n2(y - gap) + ")" });
    if (ap < 1) {
      out += L(ux, y + mh / 2, ux + lap, y + mh / 2, WOOD_D, 2.4, { opacity: 1 - ap });
      out += L(ux, y, ux, y + mh, WOOD_D, 2, { opacity: (1 - ap) * 0.6 });
      out += L(ux + lap, y, ux + lap, y + mh, WOOD_D, 2, { opacity: (1 - ap) * 0.6 });
    }
    return out;
  }

  /* a caption under the stage, in the scene's own colour */
  function cap(x, y, s, p, col) {
    if (!(p > 0)) return "";
    return Tx(x, y, s, "lab big", "middle", { opacity: Math.min(1, p), fill: col || P.ink,
      transform: "translate(0," + n2((1 - Math.min(1, p)) * 10) + ")" });
  }

  /* ==== scene: title ======================================================= */
  function sceneTitle(scene, beat, t) {
    var one = scene.first;
    var a = inAt(t, BEATS[one].start, 1.0);
    var cross = on(t, cue(one, "cross"), 0.8);
    var flush = on(t, cue(one, "flush"), 0.7);
    var gap = lerp(70, 0, flush);
    var out = board(320, 250, 300, 54, {});
    out += G(board(0, 0, 300, 54, {}), { transform: "translate(" + n2(470) + "," + n2(196 - gap) + ")", opacity: cross });
    out += G(cap(584, 372, "two pieces, crossing — and finishing flush", flush, P.teal), {});
    return svg(G(out, { opacity: 0.35 + a * 0.65 }));
  }

  function titleMotif(o) {
    var t = (o && o.t) || 0;
    var s = 0.42;
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A halving joint, two members crossing flush">' +
      G(board(0, 150, 300, 56, {}) +
        G(board(0, 0, 300, 56, {}), { transform: "translate(30,96)" }) +
        L(20, 178, 320, 178, P.teal, 3, { opacity: 0.5 + 0.3 * breathe(t) }),
        { transform: "translate(30,20) scale(" + n3(s * 2.4) + ")" }) +
      "</svg>";
  }

  /* ==== scene: what a halving joint is ===================================== */
  function sceneJoint(scene, beat, t, i) {
    var b0 = scene.first, b1 = b0 + 1;
    var apart = on(t, cue(b0, "apart"), 0.7);
    var half = on(t, cue(b0, "half"), 0.7);
    var close = on(t, cue(b1, "close"), 1.1);
    var flush = on(t, cue(b1, "flush"), 0.6);

    var MW = 300, MH = 62, LAP = 130;
    var X = 300, Y = 250;
    var lift = lerp(96, 0, close);

    /* THE NOTCH IS CUT, NOT REVEALED. It used to scale up out of nothing,
       which is the film's whole fault in miniature: the result without the
       work. Now a saw runs down the shoulder to half the thickness, and the
       waste lifts out and falls away — the two halves of the actual job. */
    var halfAt = cue(b0, "half");
    var hp = progress(t, halfAt, 2.6);
    var sawP = clamp(hp / 0.55, 0, 1);            /* the cut going down */
    var outP = clamp((hp - 0.6) / 0.4, 0, 1);     /* the waste coming away */
    var NX = X + MW - LAP;

    var out;
    if (outP < 1) {
      /* still cutting: the kerf deepens at the shoulder and the waste lifts */
      out = board(X, Y, MW, MH, {});
      if (sawP > 0) {
        out += R(NX - 3, Y, 6, (MH / 2) * sawP, 0, P.ground, WOOD_D, 2);
        out += dust(NX, Y + 2, sawP * 0.8, "#D9B98A");
        if (sawP < 1) {
          out += G(sawFig(0, 0, 0.42, 0, 0, 0),
            { transform: "translate(" + n2(NX - 108 * 0.42) + "," +
                n2(Y + (MH / 2) * sawP - 12 + stroke(t, halfAt, 1.1) * 5) + ")" });
        }
        if (outP > 0) out += R(NX, Y, LAP, MH / 2, 0, P.ground, WOOD_D, 2.5, { opacity: outP });
        out += G(board(0, 0, LAP, MH / 2, {}),
          { transform: "translate(" + n2(NX + outP * 54) + "," + n2(Y - outP * 74) +
              ") rotate(" + n2(outP * 14) + ")", opacity: Math.max(0, 1 - outP * 1.05) });
      }
      /* the other member waits above, notched to match once the cut is made */
      out += G(board(0, 0, MW, MH, {}) +
        (sawP > 0.9 ? R(0, MH / 2, LAP, MH / 2, 0, P.ground, WOOD_D, 2.5) : ""),
        { transform: "translate(" + n2(NX) + "," + n2(Y - 96) + ")", opacity: 0.25 + 0.75 * apart });
    } else {
      out = lapPair(X, Y, MW, MH, LAP, lift);
    }

    if (half > 0 && close < 0.9) {
      out += Tx(NX + LAP / 2, Y - 116, "half the thickness off each", "lab", "middle",
        { opacity: half * (1 - close), fill: P.gold });
    }
    if (flush > 0) {
      /* now true: both members are in one band, so these two lines are the
         actual faces of the assembled joint */
      out += L(X - 14, Y, NX + MW + 14, Y, P.good, 3, { opacity: 0.9 * flush });
      out += L(X - 14, Y + MH, NX + MW + 14, Y + MH, P.good, 3, { opacity: 0.9 * flush });
      out += cap(584, 386, "one thickness at the lap — the faces finish flush", flush, P.good);
    }
    return svg(out);
  }

  /* ==== scene: three tools ================================================= */
  function sceneTools(scene, beat, t, i) {
    var b0 = scene.first, b1 = b0 + 1, b2 = b0 + 2;
    var sq = on(t, cue(b0, "square"), 0.6);
    var ga = on(t, cue(b1, "gauge"), 0.6);
    var sa = on(t, cue(b2, "saw"), 0.6);
    var teeth = bump(t, cue(b2, "teeth"), 1.4);
    var back = bump(t, cue(b2, "back"), 1.4);
    var rip = on(t, cue(b2, "rip"), 0.7);

    /* THE RIP-SAW CONTRAST. Newly spoken, and it is a difference in the
       TEETH, so it is drawn as teeth: the fine crosscut row this job wants
       against the coarse raked row that would tear the shoulder out. The
       three tools fade back rather than fight it for the stage. */
    function ripCard() {
      var cmp = R(214, 96, 740, 250, 16, P.card, P.line, 2);
      cmp += teethRow(258, 176, 420, false, P.good);
      cmp += Tx(258, 148, "tenon saw — fine teeth, across the grain", "lab", "start", { fill: P.good });
      cmp += Tx(724, 184, "✓", "lab big", "start", { fill: P.good });
      cmp += teethRow(258, 276, 420, true, P.bad);
      cmp += Tx(258, 248, "rip saw — coarse teeth, along the grain", "lab", "start", { fill: P.bad });
      cmp += Tx(724, 284, "✗", "lab big", "start", { fill: P.bad });
      cmp += Tx(584, 322, "a rip saw would tear this shoulder to pieces", "lab", "middle", { fill: P.bad });
      return cmp;
    }

    /* Drawn at 0.78 the three tools sat small in a 1168 x 440 stage with
       dead space all round them — legible, but nobody would call them
       drawings of tools. Bigger, and spaced on thirds. */
    var out = "";
    /* THE SQUARE PROVES SOMETHING. "A try square, to prove a line square" was
       said over a square lying on its own, proving nothing. A piece of timber
       is now offered up to it: stock against the face, blade along the edge,
       and the right angle it proves is marked at the corner. */
    var prove = on(t, cue(b0, "square") == null ? null : cue(b0, "square") + 0.8, 0.8);
    if (prove > 0) {
      var TX0 = 164, TY0 = 134, TW = 214, TH = 112;
      out += G(board(TX0, TY0, TW, TH, {}), { opacity: prove });
      var slid = lerp(18, 0, prove);
      out += G(Pth("M0,26 v-26 h26", null, P.good, 3.6) +
        Tx(44, 22, "90°", "lab", "start", { fill: P.good }),
        { transform: "translate(" + n2(TX0 + 8 + slid) + "," + n2(TY0 + 8) + ")", opacity: prove });
      if (prove > 0.85) out += Tx(TX0 + TW - 6, TY0 + TH - 14, "✓ square", "lab", "end", { fill: P.good });
    }
    out += G(trySquareFig(0, 0, 1.15, sq), { transform: "translate(120,196)", opacity: 0.18 + 0.82 * sq });
    out += Tx(255, 356, "try square", "lab big", "middle", { opacity: sq, fill: P.blue });

    out += G(gaugeFig(0, 0, 1.15, ga, 1), { transform: "translate(470,214)", opacity: 0.18 + 0.82 * ga });
    out += Tx(620, 356, "marking gauge", "lab big", "middle", { opacity: ga, fill: P.teal });

    out += G(sawFig(0, 0, 1.0, sa, teeth, back), { transform: "translate(810,196)", opacity: 0.18 + 0.82 * sa });
    out += Tx(960, 356, "tenon saw", "lab big", "middle", { opacity: sa, fill: P.blue });

    /* y 372 put this straight through the tool labels once they moved down
       to 356 and grew. The caption belt for this scene is the bottom of the
       stage, clear of them. */
    if (teeth > 0) out += cap(584, 416, "fine teeth — a clean cut across the grain", teeth, P.gold);
    else if (back > 0) out += cap(584, 416, "a stiff back — the cut runs straight", back, P.gold);
    /* the comparison crossfades over the three tools rather than cutting to
       a card, which read as a dropped frame in the sample */
    if (rip > 0) return svg(G(out, { opacity: 1 - rip }) + G(ripCard(), { opacity: rip }));
    return svg(out);
  }

  /* ==== scene: face side, face edge ======================================== */
  var BX = 300, BY = 210, BW = 560, BH = 108;
  var SHX = BX + 330;   /* where the shoulder falls */

  function sceneFaces(scene, beat, t, i) {
    var b0 = scene.first, b1 = b0 + 1, b2 = b0 + 2;
    var bd = on(t, cue(b0, "board"), 0.7);
    var fs = progress(t, cue(b1, "faceside"), 1.1);
    var fe = progress(t, cue(b1, "faceedge"), 1.1);
    var both = bump(t, cue(b2, "both"), 1.6);
    var no = on(t, cue(b2, "no"), 0.6);

    var out = board(BX, BY, BW, BH, { end: "right" });

    /* THE PLANE. "Planed straight, planed square, gauged to size" was said
       over a board that had simply always been prepared — and no plane
       appeared anywhere in a film for a course whose Foundation module is
       largely about this tool. It runs the length of the board, taking a
       shaving, for as long as that sentence lasts. */
    var pl = beatU(t, b0);
    if (bd > 0.2 && pl < 0.96) {
      var px = lerp(BX - 60, BX + BW - 40, ease(clamp(pl / 0.9, 0, 1)));
      out += planeFig(px, BY - 2, 0.86);
      out += shaving(px + 74, BY - 10, (pl * 3) % 1, 1);
      out += dust(px + 74, BY - 2, 0.5, "#E3C79B");
      out += cap(584, 386, "planed straight, planed square", clamp(pl * 3, 0, 1), P.gold);
    }

    /* the marks are MADE, by a knife travelling, rather than fading in */
    out += G(faceMark(BX + 120, BY + BH * 0.74, 1.1, fs), {});
    if (fs > 0 && fs < 1) out += knife(BX + 132, BY + BH * 0.74 - 34 * fs, 1);
    if (fs > 0) out += Tx(BX + 128, BY - 16, "face side", "lab", "middle", { opacity: fs, fill: P.ink });
    out += edgeMark(BX, BX + BW, BY + BH, fe);
    if (fe > 0 && fe < 1) out += knife(lerp(BX, BX + BW, fe), BY + BH + 4, 1);
    if (fe > 0) out += Tx(BX + BW - 10, BY + BH + 30, "face edge", "lab", "end", { opacity: fe, fill: P.teal });
    if (both > 0) {
      out += R(BX - 10, BY - 10, BW + 20, BH + 20, 8, null, P.gold, 3, { opacity: 0.8 * both });
      out += cap(584, 386, "every measurement comes off these two", both, P.gold);
    }
    if (no > 0) {
      out += G(L(-16, -16, 16, 16, P.bad, 5) + L(16, -16, -16, 16, P.bad, 5),
        { transform: "translate(" + n2(BX + BW + 34) + "," + n2(BY + BH / 2) + ")", opacity: no });
      out += Tx(BX + BW + 34, BY + BH / 2 + 52, "not a sawn end", "lab", "middle", { opacity: no, fill: P.bad });
    }
    return svg(G(out, { opacity: 0.25 + 0.75 * bd }));
  }

  /* ==== tools at work =====================================================
     The film showed RESULTS, not WORK. Measured before this change: 3 of 10
     scenes moved anything, 4 drew a tool and all four held it still, and the
     scene called "Which side of the line" contained no saw. A learner saw a
     line exist and never saw anyone draw it.

     Everything below is a tool doing its job across the beat that names it,
     rather than a finished state easing in over half a second and then
     sitting there for the remaining three.
     ================================================================== */

  /* how far through the SPOKEN part of beat i, 0..1 — motion that fills the
     sentence instead of snapping at its first word */
  function beatU(t, i) {
    var b = BEATS[i];
    return clamp((t - b.start) / Math.max(spokenEnd(i) - b.start, 0.001), 0, 1);
  }
  /* a back-and-forth stroke, -1..1, `rate` cycles a second */
  function stroke(t, at, rate) {
    if (at == null || t < at) return 0;
    return Math.sin((t - at) * Math.PI * 2 * (rate || 0.9));
  }
  /* 0..1 that runs from a cue over `secs`, for a cut going down */
  function progress(t, at, secs) {
    if (at == null || t < at) return 0;
    return clamp((t - at) / (secs || 2.4), 0, 1);
  }

  /* the marking knife, travelling along the blade of the square */
  function knife(x, y, p) {
    if (!(p > 0)) return "";
    return G(Pth("M0,0 l14,-5 l30,-9 l4,7 l-30,11 l-14,4 z", "#C7D2DA", STEEL_D, 1.6) +
      Pth("M44,-14 l30,-9 a7,7 0 0 1 3,13 l-29,9 z", HANDLE, "#5C3517", 1.6),
      { transform: "translate(" + n2(x) + "," + n2(y) + ") rotate(-58)", opacity: Math.min(1, p) });
  }

  /* dust at the mouth of a cut, growing with the cut */
  function dust(cx, cy, amount, col) {
    if (!(amount > 0)) return "";
    var out = "", n = Math.round(14 * amount);
    for (var k = 0; k < n; k++) {
      var a = (k * 2.399) % 6.283, r = 6 + (k % 5) * 3.4;
      out += C(cx + Math.cos(a) * r * 1.9, cy + Math.abs(Math.sin(a)) * r * 0.5,
        1.3 + (k % 3) * 0.5, col || "#D9B98A", null, null, { opacity: 0.55 });
    }
    return out;
  }

  /* a shaving lifting off a chisel: a curl that rises and falls away */
  function shaving(x, y, p, dir) {
    if (!(p > 0) || p > 1) return "";
    var d = dir || 1, rise = ease(Math.min(p * 2, 1)), fall = clamp((p - 0.55) / 0.45, 0, 1);
    return Pth("M0,0 q" + n2(16 * d) + ",-12 " + n2(30 * d) + ",-3 q" + n2(-12 * d) + ",9 " + n2(-30 * d) + ",3 z",
      "#E0C193", "#B08A55", 1.4,
      { transform: "translate(" + n2(x + 26 * d * fall) + "," + n2(y - 16 * rise + 34 * fall * fall) + ")",
        opacity: (1 - fall) * 0.95 });
  }

  /* ==== scene: the shoulder line ===========================================
     The square is brought in and seated against the face edge, and only then
     does a knife travel along its blade and leave the line behind it. The
     lesson's warning is that the stock lifts; that cannot be shown by a line
     appearing on its own, which is what this scene used to do. */
  function sceneShoulder(scene, beat, t, i) {
    var b0 = scene.first, b1 = b0 + 1, b2 = b0 + 2;
    var meas = on(t, cue(b0, "measure"), 0.7);
    var lineAt = cue(b1, "line");
    var edges = on(t, cue(b1, "edges"), 0.8);
    var press = bump(t, cue(b1, "press"), 1.5);
    var liftAt = cue(b2, "lift");
    var bad = on(t, cue(b2, "bad"), 0.6);

    /* the square arrives, seats, then the knife runs down the blade */
    var seat = on(t, lineAt == null ? null : lineAt - 0.5, 0.5);
    var draw = lineAt == null ? 0 : clamp((t - lineAt) / 1.5, 0, 1);
    var lift = on(t, liftAt, 0.7);

    var out = board(BX, BY, BW, BH, { end: "right" });
    out += faceMark(BX + 120, BY + BH * 0.74, 1.1, 1);
    out += edgeMark(BX, BX + BW, BY + BH, 1);

    /* THE OTHER MEMBER IS OFFERED UP. "Take the width from the piece that has
       to fit, not from the drawing" was drawn as a dimension line — which is
       the drawing. The actual action is laying that member on the work and
       marking its edge, so that is what happens: it comes down, sits, is
       ticked off, and lifts away leaving the width behind. */
    /* Only during its own beat. Left running, the member stayed on screen as
       a grey ghost behind the try square for the next two beats, with its
       gold dimension line colliding with the word "shoulder". */
    if (meas > 0 && i === b0) {
      var u = beatU(t, b0);
      var land = clamp(u / 0.34, 0, 1), away = clamp((u - 0.70) / 0.30, 0, 1);
      var MH2 = BH * 0.62;
      var drop = lerp(-96, 0, ease(land)) - away * 104;
      /* it rests ON the board rather than over it, so the work stays visible */
      out += G(board(0, 0, BX + BW - SHX, MH2, {}),
        { transform: "translate(" + n2(SHX) + "," + n2(BY - MH2 - 6 + drop) + ")",
          opacity: Math.max(0, 1 - away * 1.15) });
      if (land >= 1 && away < 0.5) {
        out += knife(SHX + 6, BY - 2, 1);
        out += L(SHX, BY - MH2 - 14, SHX, BY + BH + 12, P.gold, 2.4, { opacity: 1 - away * 2 });
        out += Tx(SHX - 12, BY + BH + 34, "its edge, marked on the work", "lab", "end",
          { opacity: 1 - away * 2, fill: P.gold });
      }
      if (away > 0) {
        out += L(SHX, BY - 30, BX + BW, BY - 30, P.gold, 2, { opacity: away });
        out += Tx((SHX + BX + BW) / 2, BY - 40, "the width of the other piece", "lab", "middle",
          { opacity: away, fill: P.gold });
      }
    }

    /* THE SQUARE. It slides up to the work, then its stock sits on the face
       edge — and tilts off it when the narration says it lifts. */
    var tilt = lift * 5;
    var slide = lerp(70, 0, seat);
    out += G(trySquareFig(0, 0, 0.95, 0),
      { transform: "translate(" + n2(SHX - 24 + slide) + "," + n2(BY + BH + 10 + slide * 0.5) +
          ") rotate(" + n2(-90 + tilt) + ")", opacity: 0.2 + 0.8 * Math.max(seat, lift) });
    if (press > 0) out += C(SHX - 14, BY + BH - 4, 15 + 6 * press, null, P.good, 3, { opacity: press });

    /* THE LINE, left behind the knife rather than drawn by nobody */
    if (draw > 0) {
      var y0 = BY - 12, y1 = BY + BH + 12, ky = lerp(y0, y1, draw);
      out += L(SHX, y0, SHX, ky, P.ink, 3.2);
      if (draw < 1) out += knife(SHX + 4, ky, 1);
      if (draw > 0.25) out += Tx(SHX, BY - 26, "shoulder", "lab", "middle", { opacity: clamp((draw - 0.25) * 3, 0, 1), fill: P.ink });
    }
    if (edges > 0) {
      out += L(SHX - 16, BY, SHX - 16, BY + BH * edges, P.ink, 2.4, { opacity: 0.85 });
      out += L(SHX + 16, BY, SHX + 16, BY + BH * edges, P.ink, 2.4, { opacity: 0.85 });
    }
    if (bad > 0) {
      out += L(SHX, BY - 12, SHX + 22, BY + BH + 12, P.bad, 3.2, { opacity: bad });
      out += cap(584, 396, "the stock lifted — the line is not square", bad, P.bad);
    }
    return svg(out);
  }

  /* ==== scene: half the thickness ==========================================
     The gauge is PUSHED along the wood, fence riding the face side, and the
     score line appears behind its pin. It used to draw itself while the
     gauge sat in the corner doing nothing. */
  function sceneGauge(scene, beat, t, i) {
    var b0 = scene.first, b1 = b0 + 1, b2 = b0 + 2;
    var set = on(t, cue(b0, "set"), 0.8);
    var lock = bump(t, cue(b0, "lock"), 1.4);
    var scoreAt = cue(b1, "score");
    var both = on(t, cue(b1, "both"), 0.7);
    var equal = on(t, cue(b2, "equal"), 0.6);
    var error = on(t, cue(b2, "error"), 0.7);

    var out = board(BX, BY, BW, BH, { end: "right" });
    out += faceMark(BX + 120, BY + BH * 0.74, 1.1, 1);
    out += edgeMark(BX, BX + BW, BY + BH, 1);
    out += L(SHX, BY - 12, SHX, BY + BH + 12, P.ink, 3.2);

    /* setting it: the stem opens to half the thickness, then the thumbscrew */
    if (scoreAt == null || t < scoreAt) {
      out += G(gaugeFig(0, 0, 0.55, 0, set), { transform: "translate(" + n2(BX + 40) + "," + n2(BY - 78) + ")", opacity: 0.3 + 0.7 * set });
      if (lock > 0) out += C(BX + 40 + 47, BY - 78 - 28, 14 + 5 * lock, null, P.gold, 3, { opacity: lock });
    } else {
      /* scoring: the gauge travels right, the line is left behind the pin */
      var run = clamp((t - scoreAt) / 1.9, 0, 1);
      var px = lerp(SHX, BX + BW, run);
      out += L(SHX, BY + BH / 2, px, BY + BH / 2, P.teal, 3.4);
      /* the fence rides ON the face side: the gauge sits below the board,
         its pin reaching up to the line it is cutting */
      out += G(gaugeFig(0, 0, 0.5, 0, 1),
        { transform: "translate(" + n2(px - 120) + "," + n2(BY + BH + 30) + ")" });
      out += L(px, BY + BH / 2, px, BY + BH + 30, STEEL_D, 1.6, { opacity: 0.5 });
      out += dust(px, BY + BH / 2 + 3, run * 0.6, "#C9A97A");
      if (run > 0.9) out += Tx(BX + BW + 10, BY + BH / 2 + 6, "½", "lab big", "start", { fill: P.teal });
    }

    if (both > 0 && !(error > 0)) out += cap(584, 386, "both members, from the one setting", both, P.teal);
    if (equal > 0) {
      out += L(SHX + 20, BY + 8, SHX + 20, BY + BH / 2 - 8, P.good, 3, { opacity: equal });
      out += L(SHX + 20, BY + BH / 2 + 8, SHX + 20, BY + BH - 8, P.good, 3, { opacity: equal });
    }
    if (error > 0) {
      out += L(SHX, BY + BH / 2 + 9, BX + BW, BY + BH / 2 + 9, P.bad, 3, { opacity: error });
      out += cap(584, 386, "one millimetre out, twice — the joint is two out", error, P.bad);
    }
    return svg(out);
  }

  /* ==== scene: mark the waste ============================================== */
  function hatch(x, y, w, h, p, col) {
    if (!(p > 0)) return "";
    var out = "", n = Math.round(w / 15), got = Math.round(n * Math.min(1, p));
    for (var k = 0; k < got; k++) {
      var hx = x + 4 + k * 15;
      out += L(hx, y + 3, hx - h * 0.55, y + h - 3, col || P.bad, 2.2, { opacity: 0.92 });
    }
    return out;
  }

  function sceneWaste(scene, beat, t, i) {
    var b0 = scene.first, b1 = b0 + 1;
    var hatchAt = cue(b0, "hatch");
    var h = hatchAt == null ? 0 : clamp((t - hatchAt) / 1.6, 0, 1);
    var safe = on(t, cue(b1, "safe"), 0.7);

    var out = board(BX, BY, BW, BH, { end: "right" });
    out += faceMark(BX + 120, BY + BH * 0.74, 1.1, 1);
    out += edgeMark(BX, BX + BW, BY + BH, 1);
    out += L(SHX, BY - 12, SHX, BY + BH + 12, P.ink, 3.2);
    out += L(SHX, BY + BH / 2, BX + BW, BY + BH / 2, P.teal, 3.4);
    out += hatch(SHX, BY, BX + BW - SHX, BH / 2, h);
    /* the pencil that is laying the hatching down */
    if (h > 0 && h < 1) {
      var hx = SHX + (BX + BW - SHX) * h;
      out += knife(hx, BY + BH / 4, 1);
    }
    if (h > 0) out += Tx((SHX + BX + BW) / 2, BY - 22, "waste", "lab big", "middle", { opacity: h, fill: P.bad });
    if (safe > 0) out += cap(584, 396, "nobody who hatches the waste saws off the wrong half", safe, P.accent);
    return svg(out);
  }

  /* ==== scene: which side of the line ======================================
     THE SAW WAS MISSING FROM THE SAW SCENE. A kerf simply existed, at a fixed
     offset, and the learner was told which side it was on. Now the saw works
     the cut down, the kerf deepens under it, dust gathers at its mouth, and
     the two ways of doing it run side by side so the slack joint is watched
     rather than described.
     ================================================================== */
  function sawCut(x, y, w, h, lineX, offset, col, depth, ph, showSaw, fall) {
    var LX = x + lineX, kxf = LX + offset;
    var out;
    if (fall > 0) {
      /* THE WASTE COMES AWAY. It used to be cut free and then simply sit
         there, so nothing on screen ever said which part was the waste. */
      out = board(x, y, kxf - 5 - x, h, {});
      /* It falls 96px and is gone by the time it gets there. The first cut of
         this ran it 196px at 15 degrees and put 84px of waste outside the
         1168 x 440 box — which the sweep catches and a sampled frame does
         not, because it happens between cues. */
      out += G(board(0, 0, x + w - (kxf + 5), h, {}),
        { transform: "translate(" + n2(kxf + 5 + fall * 22) + "," + n2(y + fall * fall * 96) +
            ") rotate(" + n2(fall * 9) + ")", opacity: clamp((1 - fall) / 0.4, 0, 1) });
    } else {
      out = board(x, y, w, h, {});
    }
    out += L(LX, y - 10, LX, y + h + 10, P.ink, 3);
    var kx = LX + offset;
    if (depth > 0) {
      out += R(kx - 5, y, 10, Math.max(h * depth, 2), 0, P.ground, col, 2.4);
      out += dust(kx, y + 2, depth, "#D9B98A");
    }
    if (showSaw && depth < 1) {
      /* the teeth sit in the kerf, so the saw's height IS the cut's depth */
      var s = 0.58, teethY = y + h * depth + ph * 7;
      out += G(sawFig(0, 0, s, 0, 0, 0),
        { transform: "translate(" + n2(kx - 118 * s) + "," + n2(teethY - 28 * s) + ")" });
    }
    return out;
  }

  /* the close-up: a millimetre is two pixels at board scale, and the whole
     scene turns on a millimetre */
  function kerfZoom(px, py, offset, col, label) {
    var pw = 210, ph = 118, Z = 6;
    var out = R(px, py, pw, ph, 12, P.card, P.line, 2);
    var cx = px + pw / 2, top = py + 18, bot = py + ph - 26;
    out += R(px + 14, top, pw - 28, bot - top, 2, WOOD, WOOD_D, 2);
    out += L(cx, top - 6, cx, bot + 6, P.ink, 3);
    out += R(cx + offset * Z - 3 * Z / 2, top, 3 * Z, bot - top, 0, P.ground, col, 2.2);
    out += Tx(cx, py + ph - 8, label, "lab", "middle", { fill: col });
    return out;
  }

  /* a thumb guiding the blade at the start of a cut. Deliberately a plain
     form, not a cartoon hand: this is the diagram a trade manual draws, and
     the narration now names the thumb, so it has to be on screen. */
  function thumbGuide(x, y, s, p) {
    if (!(p > 0)) return "";
    return G(Pth("M0,0 q" + n2(-4 * s) + "," + n2(-30 * s) + " " + n2(16 * s) + "," + n2(-32 * s) +
      " q" + n2(18 * s) + "," + n2(-2 * s) + " " + n2(16 * s) + "," + n2(20 * s) +
      " v" + n2(30 * s) + " h" + n2(-32 * s) + " z", "#D9AE8C", "#A97A57", 2) +
      Pth("M" + n2(4 * s) + "," + n2(-24 * s) + " q" + n2(12 * s) + "," + n2(-5 * s) +
        " " + n2(22 * s) + ",0", null, "#A97A57", 1.6, { opacity: 0.7 }),
      { transform: "translate(" + n2(x) + "," + n2(y) + ")", opacity: Math.min(1, p) });
  }

  /* starting the cut: the saw laid over at a low angle, working BACKWARD to
     cut a groove, with the thumb steadying the blade above the teeth */
  function startingCut(x, y, w, h, lineX, t, at) {
    var LX = x + lineX, u = progress(t, at, 3.0);
    var out = board(x, y, w, h, {});
    out += L(LX, y - 10, LX, y + h + 10, P.ink, 3);
    var kx = LX + 7, groove = 3 + 13 * u;
    out += R(kx - 5, y, 10, groove, 0, P.ground, P.good, 2.2);
    /* The saw is rotated about ITS OWN TEETH, so the teeth stay in the kerf
       whatever the angle. Rotating about the handle put them 130px to the
       left of the line and halfway down the board — which is what the first
       sample showed, and what the sample is for. */
    var s = 0.62, TEETH = 36 * s;
    var back = Math.max(0, -stroke(t, at, 0.7));                  /* BACKWARD strokes only */
    var ang = lerp(-19, -13, clamp(u, 0, 1));
    out += G(sawFig(0, 0, s, 0, 0, 0),
      { transform: "translate(" + n2(kx + back * 24) + "," + n2(y + groove - back * 8) +
          ") rotate(" + n2(ang) + ") translate(0," + n2(-TEETH) + ")" });
    /* clear of the timber: at #D9AE8C on #C98A4B the thumb was invisible on
       the wood, and only its label showed */
    out += thumbGuide(kx - 34, y - 2, 0.92, clamp(u * 4, 0, 1));
    out += Tx(kx - 54, y - 46, "thumb steadies the blade", "lab", "end",
      { opacity: clamp(u * 3, 0, 1), fill: P.gold });
    out += dust(kx, y + 2, u * 0.7, "#D9B98A");
    return out;
  }

  /* the two faces of the work, and a blade that is true on one and running
     off the other — the lesson's TJ.03.3, and the reason a cut is watched
     from both sides */
  function farFacePanel(x, y, w, lean) {
    var H = 74, GAPY = 118, LX = x + w * 0.5;
    var out = board(x, y, w, H, {});
    out += board(x, y + GAPY, w, H, {});
    out += Tx(x - 14, y + H / 2 + 5, "near", "lab", "end", { fill: P.ink });
    out += Tx(x - 14, y + GAPY + H / 2 + 5, "far", "lab", "end", { fill: P.ink });
    out += L(LX, y - 8, LX, y + H + 8, P.ink, 3);
    out += L(LX, y + GAPY - 8, LX, y + GAPY + H + 8, P.ink, 3);
    /* one blade, through both faces; if it leans, the far kerf walks off */
    var off = lean * 34;
    out += Pth("M" + n2(LX + 6) + "," + n2(y - 14) + " L" + n2(LX + 6 + off) + "," + n2(y + GAPY + H + 14) +
      " l12,0 L" + n2(LX + 18) + "," + n2(y - 14) + " z", STEEL, STEEL_D, 2, { opacity: 0.85 });
    out += R(LX + 1, y, 10, H, 0, P.ground, P.good, 2.2);
    out += Tx(LX + 40, y + H / 2 + 5, "✓ on the line", "lab", "start", { fill: P.good });
    out += R(LX + 1 + off, y + GAPY, 10, H, 0, P.ground, lean > 0.3 ? P.bad : P.good, 2.2);
    out += Tx(LX + 54 + off, y + GAPY + H / 2 + 5,
      lean > 0.3 ? "✗ run off, unseen" : "✓ on the line", "lab", "start",
      { fill: lean > 0.3 ? P.bad : P.good });
    return out;
  }

  function sceneSaw(scene, beat, t, i) {
    var b0 = scene.first, bStart = b0 + 1, bGood = b0 + 2, bBad = b0 + 3, bFar = b0 + 4;
    var kerfAt = cue(b0, "kerf");
    var wasteC = bump(t, cue(b0, "waste"), 1.5);
    var startAt = cue(bStart, "angle");
    var goodAt = cue(bGood, "good");
    var badAt = cue(bBad, "bad");
    var slack = on(t, cue(bBad, "slack"), 0.7);
    var farAt = cue(bFar, "far");
    var leanAt = cue(bFar, "lean");

    var W = 330, H = 104, LX = 176;
    var out = "";

    /* BEAT 4 — the far face. Its own picture: the point is a second surface,
       and there is no second surface in the side-by-side comparison. */
    if (i >= bFar) {
      var fa = on(t, farAt, 0.8);
      var lean = on(t, leanAt, 1.2);
      out += G(farFacePanel(0, 0, 420, lean), { transform: "translate(300,120)", opacity: 0.25 + 0.75 * fa });
      out += cap(584, 408, "square on the face you watch, running off the one you do not",
        on(t, leanAt, 1.4), P.bad);
      return svg(out);
    }

    /* BEAT 1 — starting the cut. Low angle, backward strokes, a groove. The
       film used to jump from a clean board to a finished kerf. */
    if (i === bStart) {
      out += G(startingCut(0, 0, 420, 122, 210, t, startAt), { transform: "translate(320,214)" });
      out += Tx(584, 96, "start at a low angle — backward strokes first", "lab big", "middle", { fill: P.gold });
      var gr = on(t, cue(bStart, "groove"), 0.8);
      if (gr > 0) out += cap(584, 404, "two or three strokes cut a groove to run in", gr, P.gold);
      return svg(out);
    }

    /* BEAT 0 — what a kerf IS, before anything is cut. The cut itself now
       belongs to the beats that name it, so this beat no longer starts one. */
    if (i === b0) {
      var ka = on(t, kerfAt, 0.8);
      out += G(sawCut(0, 0, 420, 128, 210, 7, P.good, 0, 0, false, 0), { transform: "translate(160,150)" });
      out += G(kerfZoom(0, 0, 7, P.good, "the kerf, beside the line"), { transform: "translate(660,164)", opacity: ka });
      if (wasteC > 0) out += cap(584, 404, "that millimetre comes out of the waste", wasteC, P.gold);
      return svg(G(out, { opacity: 0.3 + 0.7 * ka }));
    }

    /* LEFT — sawn on the waste side, and the waste taken off */
    var firstAt = goodAt;
    var dGood = progress(t, firstAt, 1.9);
    var fall = goodAt == null ? 0 : progress(t, goodAt + 2.0, 1.2);
    out += G(sawCut(0, 0, W, H, LX, 7, P.good, dGood, stroke(t, firstAt, 1.0),
      dGood > 0 && !(fall > 0), fall),
      { transform: "translate(80,190)" });
    out += Tx(80 + LX, 170, "on the waste side", "lab", "middle", { opacity: dGood > 0 ? 1 : 0, fill: P.good });
    if (fall > 0.5) out += Tx(80 + LX, 330, "the line stays on the work — full size", "lab", "middle", { fill: P.good });
    else if (dGood >= 1) out += Tx(80 + LX, 330, "the line stays on the work", "lab", "middle", { fill: P.good });

    /* RIGHT — down the middle, once it is named */
    if (badAt != null && t >= badAt - 0.4) {
      var dBad = progress(t, badAt, 1.9);
      var fallB = progress(t, badAt + 2.0, 1.2);
      out += G(sawCut(0, 0, W, H, LX, 0, P.bad, dBad, stroke(t, badAt, 1.0),
        dBad > 0 && !(fallB > 0), fallB),
        { transform: "translate(680,190)" });
      out += Tx(680 + LX, 170, "down the middle", "lab", "middle", { fill: P.bad });
      if (slack > 0) out += Tx(680 + LX, 330, "half a kerf out of the joint — slack", "lab", "middle", { opacity: slack, fill: P.bad });
    }

    /* THE CLOSE-UP, while the right way is being cut and nothing else needs
       the space */
    if (dGood > 0.15 && badAt != null && t < badAt - 0.4) {
      out += G(kerfZoom(0, 0, 7, P.good, "the kerf, beside the line"), { transform: "translate(700,182)" });
    }
    if (wasteC > 0) out += cap(584, 404, "the kerf comes out of the waste", wasteC, P.gold);
    return svg(out);
  }

  /* ==== scene: pare, and fit it dry ========================================
     Paring is repeated strokes with a shaving off each one, not a chisel
     sliding into place once. */
  function sceneFit(scene, beat, t, i) {
    var b0 = scene.first, b1 = b0 + 1, b2 = b0 + 2;
    var pareAt = cue(b0, "pare");
    var clean = on(t, cue(b0, "clean"), 0.7);
    var dry = on(t, cue(b1, "dry"), 0.8);
    var tight = on(t, cue(b1, "tight"), 0.7);
    var closeAt = cue(b2, "closed");
    var closed = on(t, closeAt, 1.1);
    var diag = on(t, cue(b2, "diag"), 0.8);

    var out = "";
    /* THREE STATES, not two. "Then fit it dry. If it needs a mallet it is too
       tight" used to be spoken over the PARING diagram, because the scene
       only switched pictures at the last beat — so the mallet the narration
       named was not merely undrawn, there was no joint on screen to strike.
       Trying the joint is now its own state, between paring and the fit. */
    if (dry > 0 && closed < 0.15) {
      var TX = 330, TY = 236, TMW = 270, TMH = 58, TLAP = 118;
      var u = beatU(t, b1);
      var push = clamp(u / 0.4, 0, 1);
      var hit = clamp((u - 0.44) / 0.5, 0, 1);
      var swing = hit > 0 && hit < 1 ? Math.abs(Math.sin(hit * Math.PI * 3)) : 0;
      var stuck = 26 - 12 * push;                                 /* it will not close */
      var UXT = TX + TMW - TLAP;

      out += lapPair(TX, TY, TMW, TMH, TLAP, stuck, 1);

      if (hit > 0) {
        out += malletFig(UXT + 54, TY - stuck - 112 - swing * 34, 0.82, -8 - swing * 22);
        if (swing < 0.25) {
          out += G(L(-16, -12, -24, -22, P.bad, 3) + L(6, -16, 6, -30, P.bad, 3) + L(26, -12, 34, -22, P.bad, 3),
            { transform: "translate(" + n2(UXT + 54) + "," + n2(TY - stuck - 14) + ")" });
        }
      }
      /* the gap called out clear of the timber, not written across it */
      out += L(UXT + TLAP + 12, TY - stuck, UXT + TMW + 24, TY - stuck, P.bad, 2, { "stroke-dasharray": "6 4" });
      out += L(UXT + TLAP + 12, TY, UXT + TMW + 24, TY, P.bad, 2, { "stroke-dasharray": "6 4" });
      out += Tx(UXT + TMW + 32, TY - stuck / 2 + 5, "still open", "lab", "start", { fill: P.bad });

      if (tight > 0) {
        out += cap(584, 388, "if it needs a mallet it is too tight", tight, P.bad);
        out += cap(584, 416, "take a shaving off the cheek and try it again", tight, P.gold);
      } else {
        out += cap(584, 388, "fit it dry, before any glue", clamp(u * 3, 0, 1), P.gold);
      }
      return svg(out);
    }

    if (closed < 0.15) {
      var X = 320, Y = 214, W = 420, H = 116, MID = X + W / 2;
      out += board(X, Y, W, H, {});
      out += L(MID, Y - 10, MID, Y + H + 10, P.ink, 3);

      /* four strokes, alternating face, each one taking a shaving */
      var run = pareAt == null ? 0 : (t - pareAt) / 1.15;
      var n = Math.max(0, Math.floor(run)), ph = run - n;
      var cut = clamp(run / 4, 0, 1);
      if (cut > 0) {
        out += R(MID - 58, Y, 58, H / 2 * cut, 0, P.ground, WOOD_D, 2);
        out += R(MID, Y + H - H / 2 * cut, 58, H / 2 * cut, 0, P.ground, WOOD_D, 2);
      }
      if (run > 0 && cut < 1) {
        var top = n % 2 === 0;
        var cx = MID - 70 - 46 * (1 - ease(Math.min(ph * 1.6, 1)));
        out += G(chiselFig(0, 0, 0.62, top ? 0 : 180),
          { transform: "translate(" + n2(top ? cx : MID + 70 + (MID - cx) - MID + 46) + "," + n2(top ? Y + 20 : Y + H - 20) + ")" });
        out += shaving(MID - 44, top ? Y + 16 : Y + H - 16, ph, top ? 1 : -1);
      }
      if (clean > 0) {
        out += L(MID, Y, MID, Y + H, P.good, 4, { opacity: clean });
        out += cap(584, 392, "supported on both faces — no break-out", clean, P.good);
      }
    } else {
      var MW = 300, MH = 62, LAP = 130, JX = 240, JY = 232;
      var gap = lerp(90, 0, closed);
      var UXC = JX + MW - LAP;
      out += lapPair(JX, JY, MW, MH, LAP, gap);
      if (diag > 0) {
        /* A TAPE MEASURES THEM, AND IT MEASURES A FRAME. The diagonals used
           to be two dashed lines ruled across one lap joint with nothing
           taking a reading — a picture of the answer, and of the wrong
           object: you check diagonals on an ASSEMBLED frame, which is what
           these joints are for. So the frame is drawn, in plan, and the tape
           runs one diagonal and then the other. */
        out = G(out, { opacity: Math.max(0, 1 - diag * 1.25) });
        var FX = 434, FY = 116, FW = 300, FH = 210, TH = 26;
        var fr = board(FX, FY, FW, TH, {}) + board(FX, FY + FH - TH, FW, TH, {});
        fr += G(board(0, 0, FH, TH, {}), { transform: "translate(" + n2(FX + TH) + "," + n2(FY + FH) + ") rotate(-90)" });
        fr += G(board(0, 0, FH, TH, {}), { transform: "translate(" + n2(FX + FW) + "," + n2(FY + FH) + ") rotate(-90)" });
        out += G(fr, { opacity: diag });

        var dg = beatU(t, b2);
        var p1 = clamp((dg - 0.30) / 0.26, 0, 1), p2 = clamp((dg - 0.62) / 0.26, 0, 1);
        out += G(L(FX, FY, FX + FW, FY + FH, P.teal, 2, { "stroke-dasharray": "8 5" }) +
          L(FX + FW, FY, FX, FY + FH, P.teal, 2, { "stroke-dasharray": "8 5" }), { opacity: 0.4 * diag });
        if (p1 > 0 && p2 <= 0) out += tapeFig(FX, FY, FX + FW, FY + FH, p1, "1 042");
        if (p2 > 0) out += tapeFig(FX + FW, FY, FX, FY + FH, p2, "1 042");
        if (p2 >= 1) out += Tx(584, 368, "✓ both 1 042 — the frame is square", "lab big", "middle", { fill: P.good });
        out += cap(584, 402, "check both diagonals before any glue", diag, P.teal);
      } else if (closed > 0.7) {
        out += cap(584, 396, "together by hand, and it stays there", closed, P.good);
      }
    }
    return svg(out);
  }

  /* ==== scene: before you cut ==============================================
     ENTIRELY NEW, and the film's largest gap. Three minutes of sawing with
     no eye protection, no cramping, no word about a sharp tool — the first
     thing a TVET assessor would pull up, and the lesson has a whole step on
     it. Three beats: the work is held, the eyes are covered, the saw is
     sharp. Each is drawn as the difference it makes, not as a rule.
     ================================================================== */
  function sceneSafety(scene, beat, t, i) {
    var b0 = scene.first, b1 = b0 + 1, b2 = b0 + 2;

    /* BEAT 0 — the work shifts, then it is cramped and stops shifting */
    if (i === b0) {
      var u = beatU(t, b0);
      var cramped = clamp((u - 0.42) / 0.3, 0, 1);
      var wob = cramped >= 1 ? 0 : Math.sin(t * 7.5) * 7 * (1 - cramped);
      var BXX = 330, BYY = 214, BWW = 470, BHH = 96;
      var out = R(250, BYY + BHH, 640, 26, 3, "#8B5A2B", "#5C3517", 2.5);   /* the bench */
      out += Tx(570, BYY + BHH + 46, "bench top", "lab", "middle", { fill: P.ink, opacity: 0.6 });
      out += G(board(BXX, BYY, BWW, BHH, { end: "right" }),
        { transform: "translate(" + n2(wob) + "," + n2(Math.abs(wob) * 0.12) + ") rotate(" + n2(wob * 0.12) + "," + n2(BXX + BWW / 2) + "," + n2(BYY) + ")" });
      if (cramped < 1) {
        out += G(L(0, 0, 40, 0, P.bad, 4) + Pth("M40,0 l-11,-8 v16 z", P.bad, null, null, {}) +
          L(0, 0, -40, 0, P.bad, 4) + Pth("M-40,0 l11,-8 v16 z", P.bad, null, null, {}),
          { transform: "translate(" + n2(BXX + BWW / 2) + "," + n2(BYY - 34) + ")", opacity: 1 - cramped });
        out += cap(584, 122, "work that shifts makes the cut wander", 1 - cramped, P.bad);
      }
      out += crampFig(BXX + 74, BYY + BHH + 26, 1.05, cramped);
      out += crampFig(BXX + BWW - 26, BYY + BHH + 26, 1.05, cramped);
      if (cramped >= 1) out += cap(584, 122, "cramped to the bench, before the saw is picked up", 1, P.good);
      return svg(out);
    }

    /* BEAT 1 — eye protection, on before the tool */
    if (i === b1) {
      var e = on(t, cue(b1, "eyes"), 0.9);
      var aft = on(t, cue(b1, "after"), 0.8);
      var o2 = gogglesFig(584, 190, 1.55 * (0.7 + 0.3 * e));
      o2 += Tx(584, 290, "on BEFORE the tool is picked up", "lab big", "middle", { opacity: e, fill: P.accent });
      if (aft > 0) {
        o2 += G(dust(0, 0, 1, "#C9A97A"), { transform: "translate(584,158) scale(2.4)", opacity: aft });
        o2 += cap(584, 340, "sawdust and a sprung splinter both go for the eyes", aft, P.bad);
      }
      return svg(G(o2, { opacity: 0.25 + 0.75 * e }));
    }

    /* BEAT 2 — sharp against blunt, drawn as teeth, because that is what the
       difference is */
    var s = on(t, cue(b2, "sharp"), 0.8);
    var f = on(t, cue(b2, "force"), 0.9);
    var out2 = R(120, 130, 430, 190, 14, P.card, P.line, 2);
    out2 += teethRow(154, 216, 362, false, P.good);
    out2 += Tx(335, 178, "sharp", "lab big", "middle", { fill: P.good });
    out2 += Tx(335, 282, "cuts on its own weight", "lab", "middle", { fill: P.good });
    out2 += G(R(0, 0, 430, 190, 14, P.card, P.line, 2) +
      teethRow(34, 86, 362, true, P.bad) +
      Tx(215, 48, "blunt", "lab big", "middle", { fill: P.bad }) +
      Tx(215, 152, f > 0 ? "has to be forced — and force slips" : "rounded, not cutting", "lab", "middle", { fill: P.bad }),
      { transform: "translate(618,130)", opacity: 0.3 + 0.7 * s });
    if (f > 0) {
      out2 += G(L(-52, 0, 52, 0, P.bad, 6) + Pth("M52,0 l-16,-11 v22 z", P.bad, null, null, {}),
        { transform: "translate(833,238)", opacity: f });
    }
    out2 += cap(584, 372, "the sharp tool is the safer tool", Math.max(s, f), P.accent);
    return svg(G(out2, { opacity: 0.25 + 0.75 * s }));
  }

  /* ==== scene: the order of work =========================================== */
  var ORDER = [
    ["one", "face side"], ["two", "shoulder"], ["three", "gauge"], ["four", "waste"],
    ["five", "saw"], ["six", "pare"], ["seven", "fit dry"]
  ];

  function sceneRecap(scene, beat, t, i) {
    var b0 = scene.first, b1 = b0 + 1;
    var out = "";
    var cx = 118, gap = 156;
    for (var k = 0; k < ORDER.length; k++) {
      var at = k < 4 ? cue(b0, ORDER[k][0]) : cue(b1, ORDER[k][0]);
      var p = popIn(t, at, 0.42);
      if (!(p > 0)) continue;
      var x = cx + k * gap;
      out += G(C(0, 0, 40, P.cell, P.teal, 3) +
        Tx(0, 11, String(k + 1), "lab big", "middle", { fill: P.teal }) +
        Tx(0, 76, ORDER[k][1], "lab", "middle", { fill: P.ink }),
        { transform: "translate(" + n2(x) + ",210) " + around(0, 0, Math.min(p, 1.08)), opacity: Math.min(1, p) });
      if (k > 0) {
        var pp = on(t, at, 0.4);
        out += L(x - gap + 44, 210, x - 44, 210, P.line, 3, { opacity: 0.8 * pp });
      }
    }
    var done = on(t, cue(b1, "seven"), 0.8);
    if (done > 0) out += cap(584, 350, "in that order, every time", done, P.teal);
    return svg(out);
  }

  var KINDS = {
    title: sceneTitle, joint: sceneJoint, tools: sceneTools, faces: sceneFaces,
    shoulder: sceneShoulder, gauge: sceneGauge, waste: sceneWaste,
    safety: sceneSafety, saw: sceneSaw, fit: sceneFit, recap: sceneRecap
  };
