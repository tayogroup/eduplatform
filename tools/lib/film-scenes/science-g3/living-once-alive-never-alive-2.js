  /* ==== chapter: once alive =======================================================
     The lesson's own demo, "Where once-alive things come from": a tree, the
     axe, the wood and the chair, one frame at a time, left to right, exactly
     the order its Next button steps through. Under them, the lesson's other
     three once-alive things - a sheep's wool made into a jumper, a tree made
     into a paper book, and the leather shoe from its sort. */

  var LO_FR = [
    { cx: 152, cap: "a tree" },
    { cx: 440, cap: "cut down" },
    { cx: 728, cap: "wood" },
    { cx: 1016, cap: "a chair" }
  ];
  var LO_FR_PIC = ["\u{1F333}", "\u{1FA93}", "\u{1FAB5}", "\u{1FA91}"];

  /* one frame of the chair story: empty and dashed until its picture arrives */
  function loFrame(k, pop, col, t, dashCol) {
    var f = LO_FR[k], x = f.cx - 100, out = "";
    if (!(pop > 0)) {
      return R(x, 26, 200, 160, 20, "none", dashCol || P.line, 3, { "stroke-dasharray": "12 10", opacity: dashCol ? 0.95 : 0.6 });
    }
    out += R(x, 26, 200, 160, 20, "#1B3A52", col || P.line, 3);
    out += MK.pic(f.cx, 92, 84, LO_FR_PIC[k]);
    out += Tx(f.cx, 166, f.cap, "lab mid muted", "middle");
    return G(out, { transform: around(f.cx, 106, Math.min(1.08, pop)), opacity: Math.min(1, pop) });
  }

  /* one of the three cards under the chair story: a source, an arrow and the
     thing it was made into */
  function loMadeCard(x, src, out2, cap, u, t) {
    if (!(u > 0)) return "";
    var mid = x + 165, m = "";
    m += R(x, 246, 330, 168, 20, "#1B3A52", P.gold, 3);
    m += R(x + 14, 256, 302, 6, 3, P.gold, null, null, { opacity: 0.85 });
    m += MK.pic(x + 82, 318, 72, src);
    m += MK.arrow(x + 132, 318, x + 198, 318, clamp((u - 0.25) / 0.5, 0, 1), P.gold, 7);
    m += MK.pic(x + 248, 318, 72, out2);
    m += Tx(mid, 396, cap, "lab mid muted", "middle");
    return G(m, { transform: around(mid, 330, 0.96 + 0.04 * Math.min(1, u)), opacity: Math.min(1, u) });
  }

  function loOnceChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cNow = c(0, "now"), cCame = c(0, "came");
    var cTree = c(1, "tree"), cCut = c(1, "cut"), cWood = c(1, "wood"), cNo = c(1, "no");
    var cMade = c(2, "made"), cOnce = c(2, "once");
    var cJump = c(3, "jumper"), cSheep = c(3, "sheep"), cBook = c(3, "book"), cTree2 = c(3, "tree");
    var cShoe = c(4, "shoe"), cSkin = c(4, "skin");
    var out = "", row1 = "";

    /* the four empty frames are on stage from the chapter's first frame; the
       first line marks the end of the story ("not alive now") and draws the
       arrow back to where it came from */
    var frames = inAt(t, BEATS[scene.first].start - GAP, 0.6);
    if (frames <= 0) return svg("");
    var backU = on(t, cCame, 0.9);

    var pops = [popIn(t, cTree, 0.45), popIn(t, cCut, 0.45), popIn(t, cWood, 0.45), popIn(t, cMade, 0.45)];
    var alive = on(t, cTree, 0.4) * (1 - on(t, cNo, 0.5));
    var cols = [alive > 0.5 ? P.good : P.line, P.line, on(t, cNo, 0.4) > 0 ? P.muted : P.line, on(t, cOnce, 0.4) > 0 ? P.gold : P.line];
    var dash = [backU > 0.85 ? P.good : null, null, null, on(t, cNow, 0.4) > 0.3 ? P.gold : null];
    for (var k = 0; k < 4; k++) row1 += loFrame(k, pops[k], cols[k], t, dash[k]);
    /* the arrows between the frames, each with the frame it points at */
    row1 += MK.arrow(262, 106, 330, 106, on(t, cCut, 0.5), P.gold, 7);
    row1 += MK.arrow(550, 106, 618, 106, on(t, cWood, 0.5), P.gold, 7);
    row1 += MK.arrow(838, 106, 906, 106, on(t, cMade, 0.5), P.gold, 7);
    /* alive, then no longer alive */
    row1 += MK.tick(196, 52, 18, popIn(t, cTree == null ? null : cTree + 0.4, 0.35) * (1 - on(t, cNo, 0.5)));
    row1 += MK.cross(772, 52, 18, popIn(t, cNo, 0.35), P.muted);
    /* "once alive", under the chair */
    row1 += MK.pill(1016, 208, "once alive", on(t, cOnce, 0.4), { size: 24, col: P.gold });

    /* the first line's own mark: they came from something that was alive */
    var back = loOnly(t, scene, 0);
    if (back > 0) row1 += MK.arrow(1016, 214, 152, 214, backU * back, P.muted, 5);

    /* while the story is the only thing on stage it sits in the middle of the
       box, and it rises as the three other once-alive things come in under it */
    var rise = into(t, scene.first + 3);
    out += G(row1, { transform: "translate(0," + n2(lerp(114, 0, rise)) + ")",
      opacity: clamp(frames * (1 - 0.55 * rise), 0, 1) });

    /* the other three once-alive things */
    out += loMadeCard(48, LO.sheep, LO.jumper, "a woollen jumper", on(t, cJump, 0.5) * (0.35 + 0.65 * on(t, cSheep, 0.5)), t);
    out += loMadeCard(419, LO.tree, LO.book, "a paper book", on(t, cBook, 0.5) * (0.35 + 0.65 * on(t, cTree2, 0.5)), t);

    var su = on(t, cShoe, 0.5);
    if (su > 0) {
      var sc3 = "";
      sc3 += R(790, 246, 330, 168, 20, "#1B3A52", P.gold, 3);
      sc3 += R(804, 256, 302, 6, 3, P.gold, null, null, { opacity: 0.85 });
      sc3 += MK.pic(955, 302, 84, LO.shoe);
      out += G(sc3, { transform: around(955, 330, 0.96 + 0.04 * Math.min(1, su)), opacity: Math.min(1, su) });
      out += MK.pill(955, 390, "animal skin", on(t, cSkin, 0.4), { size: 21, col: P.gold });
    }
    return svg(out);
  }
