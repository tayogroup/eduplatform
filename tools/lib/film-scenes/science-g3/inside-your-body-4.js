  /* ==== chapter: a model of your lungs, and the recap ==========================
     tools/lib/film-scenes/science-g3/inside-your-body-4.js. The lesson's demo
     step, built in front of the child in the order the lesson builds it: the
     bottle is cut, a balloon hangs inside from the neck, a second balloon is
     stretched across the bottom, and then the model is USED - pull the bottom
     balloon down and the lung fills, let go and it empties. The kit's own
     lungs picture breathes beside it, because that is what the model is of. */

  /* The model, drawn in its own 260 x 355 space with the neck at the top, so
     the same drawing serves the small one on the "two models" card and the big
     one that is built. o: {cut 0-1 (the bottom taken off), fill 0-1 (the lung),
     pull 0-1 (the bottom balloon pulled down)} */
  var IB_M = { neckX: 106, neckW: 48, neckBot: 46, bodyX0: 36, bodyX1: 224, bodyTop: 100, bottom: 300 };
  function ibModel(o) {
    o = o || {};
    var cut = clamp(o.cut || 0, 0, 1), fill = clamp(o.fill || 0, 0, 1), pull = clamp(o.pull || 0, 0, 1);
    var M = IB_M, out = "", bulge = 34 * pull;
    var leftWall = "M" + M.neckX + "," + (M.neckBot - 4) +
      " C" + M.neckX + ",72 " + M.bodyX0 + ",68 " + M.bodyX0 + "," + M.bodyTop + " L" + M.bodyX0 + "," + M.bottom;
    var rightWall = "M" + (M.neckX + M.neckW) + "," + (M.neckBot - 4) +
      " C" + (M.neckX + M.neckW) + ",72 " + M.bodyX1 + ",68 " + M.bodyX1 + "," + M.bodyTop + " L" + M.bodyX1 + "," + M.bottom;
    /* the bottom a grown-up cuts off, sliding away as it is cut */
    /* It slides away and fades. 40 px down is as far as it can go: the big
       model is drawn at y 42 and scale 1.05, so the rect's own bottom (330 + dy)
       lands at 42 + (330 + dy) * 1.05, and 78 put it under the 440 line
       (--sweep, 7 px out at the opacity it was still visible). */
    if (cut < 1) out += G(R(M.bodyX0, M.bottom, M.bodyX1 - M.bodyX0, 30, 8, "#CDE6F2", "#8FC4DE", 3),
      { transform: tr(46 * cut, 40 * cut), opacity: 1 - cut });
    /* the glass: the clear plastic, then the two walls. The bottom line goes
       with the cut, so an open-bottomed bottle looks open. */
    out += Pth(leftWall + " L" + M.bodyX1 + "," + M.bottom +
      " L" + M.bodyX1 + "," + M.bodyTop + " C" + M.bodyX1 + ",68 " + (M.neckX + M.neckW) + ",72 " +
      (M.neckX + M.neckW) + "," + (M.neckBot - 4) + " Z", "rgba(214,238,249,0.26)", null, 0);
    out += R(M.neckX - 5, 0, M.neckW + 10, 13, 5, "#8FC4DE");
    out += R(M.neckX, 7, M.neckW, M.neckBot - 7, 4, "rgba(214,238,249,0.4)", "#8FC4DE", 4);
    /* the balloon hanging inside from the neck: the lung */
    if (o.lung) {
      var cy = 118 + 40 * fill, rx = 22 + 34 * fill, ry = 30 + 44 * fill;
      out += R(124, 26, 12, cy - ry - 22, 6, "#E4596B");
      out += E(130, cy, rx, ry, "#F0798A", "#C93E52", 3);
      out += E(130 - rx * 0.36, cy - ry * 0.42, rx * 0.26, ry * 0.18, "#FFFFFF", null, null, { opacity: 0.45 });
    }
    out += Pth(leftWall, null, "#8FC4DE", 4);
    out += Pth(rightWall, null, "#8FC4DE", 4);
    if (cut < 1) out += L(M.bodyX0, M.bottom, M.bodyX1, M.bottom, "#8FC4DE", 4, { opacity: 1 - cut });
    /* the open rim a cut bottle has, so an open bottom looks open */
    if (cut > 0) out += E(130, M.bottom, (M.bodyX1 - M.bodyX0) / 2, 10, "#0E2434", "#8FC4DE", 4, { opacity: cut });
    /* the second balloon, stretched across the bottom: the breathing muscle */
    if (o.muscle) {
      out += Pth("M" + M.bodyX0 + "," + M.bottom + " Q130," + n2(M.bottom + bulge * 2.1) + " " + M.bodyX1 + "," + M.bottom,
        "#6FC3DB", "#3E93AE", 4);
      out += E(130, M.bottom + bulge + 13, 9, 11, "#3E93AE");
    }
    return out;
  }
  /* the model at (x, y), scaled: its own 260 x 355 space put in the film's */
  function ibModelAt(x, y, s, o) { return G(ibModel(o), { transform: tr(x, y, s) }); }

  /* how far the bottom balloon is pulled down: still, then pulled, then let go,
     and STAYS let go while the words are "Breathing out" - only on "Your model
     breathes" does it take one small breath of its own, which finishes back at
     empty. It used to run an undamped 2.6 s cosine from the moment it emptied,
     so the balloon was nearly full again on the word "out" and full in the
     chapter's last frame: the opposite of the line. A pure function of t. */
  function ibPull(t, cPull, cLet, cBreathes) {
    if (cPull == null || t < cPull) return 0;
    if (t < cPull + 1.0) return ease((t - cPull) / 1.0);
    if (cLet == null || t < cLet) return 1;
    if (t < cLet + 0.9) return 1 - ease((t - cLet) / 0.9);
    if (cBreathes == null || t < cBreathes) return 0;
    /* one gentle breath, a fifth of the pull, in over 0.5 s and out over 0.5 s.
       It fits the ~1.4 s the estimate leaves after this cue (~1.3 s once the
       real voice runs 5-10% faster) and then holds at empty for good. */
    var d = t - cBreathes;
    if (d < 0.5) return 0.2 * ease(d / 0.5);
    if (d < 1.0) return 0.2 * (1 - ease((d - 0.5) / 0.5));
    return 0;
  }

  var IB_BIG = { x: 503.5, y: 42, s: 1.05 };
  function ibBX(v) { return IB_BIG.x + v * IB_BIG.s; }
  function ibBY(v) { return IB_BIG.y + v * IB_BIG.s; }

  function ibModelChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cOther = c(0, "other"), cMake = c(0, "make");
    var cCuts = c(1, "cuts"), cChest = c(1, "chest");
    var cBalloon = c(2, "balloon"), cNeck = c(2, "neck"), cLung = c(2, "lung");
    var cSecond = c(3, "second"), cAcross = c(3, "across"), cMuscle = c(3, "muscle");
    var cPull = c(4, "pull"), cFills = c(4, "fills"), cIn = c(4, "in");
    var cLet = c(5, "letgo"), cEmpty = c(5, "empties"), cOut = c(5, "out"), cBreathes = c(5, "breathes");
    var out = "", first = ibOnly(t, scene, 0), built = into(t, scene.first + 1);

    /* ---- beat 0: the two kinds of model, side by side ---- */
    if (first > 0.01) {
      var oth = on(t, cOther, 0.5);
      out += G(R(240, 88, 300, 262, 22, P.card, P.line, 2) +
        ART.place(ibBody(), 345, 106, 90, 145) +
        Tx(390, 292, "a diagram", "lab big muted", "middle"), { opacity: first });
      out += G(R(628, 88, 300, 262, 22, "#1B3A52", lerp(P.line, P.gold, oth), 2 + 2 * oth) +
        ibModelAt(713, 104, 0.5, { cut: 1, lung: true, muscle: true, fill: 0.35, pull: 0 }) +
        Tx(778, 292, "one you can make", "lab big", "middle", { fill: lerp(P.muted, P.gold, oth) }), { opacity: first });
      /* 384 and 76, not 392 and 84: the glyph's box is taller than its
         font-size, and the bigger pair sat 3 px under the 440 line. */
      out += MK.pop(Em(778, 384, 76, "\u{1F932}"), 778, 384, popIn(t, cMake, 0.45) * first);
    }

    /* ---- beats 1 to 5: the model, built and then used ---- */
    if (built > 0.01) {
      var pull = ibPull(t, cPull, cLet, cBreathes), fill = pull;
      var cut = on(t, cCuts, 0.9);
      var lung = on(t, cBalloon, 0.6) > 0.02, muscle = on(t, cSecond, 0.6) > 0.02;
      var g = ibModelAt(IB_BIG.x, IB_BIG.y, IB_BIG.s,
        { cut: cut, lung: lung, muscle: muscle, fill: lung ? 0.1 + 0.9 * fill : 0, pull: muscle ? pull : 0 });
      out += G(g, { opacity: built });

      /* the balloon dropping in through the neck, on its own line */
      var drop = on(t, cBalloon, 0.7) * (1 - on(t, cBalloon == null ? null : cBalloon + 1.1, 0.4));
      if (drop > 0) out += MK.arrow(ibBX(130), ibBY(-24), ibBX(130), ibBY(26), drop, P.gold, 7);
      var nk = bump(t, cNeck, 1.1);
      if (nk > 0) out += R(ibBX(M0(-6)), ibBY(2), (IB_M.neckW + 12) * IB_BIG.s, 46 * IB_BIG.s, 8, "none", P.gold, 4, { opacity: nk });
      /* the cut: a dashed line where a grown-up cuts */
      var cl = bump(t, cCuts, 1.3);
      if (cl > 0) out += L(ibBX(IB_M.bodyX0 - 14), ibBY(IB_M.bottom), ibBX(IB_M.bodyX1 + 14), ibBY(IB_M.bottom), P.gold, 4,
        { opacity: cl, "stroke-dasharray": "13 10" });
      /* the second balloon stretching across the bottom */
      var ac = bump(t, cAcross, 1.2);
      if (ac > 0) out += MK.arrow(ibBX(IB_M.bodyX0 - 34), ibBY(IB_M.bottom), ibBX(IB_M.bodyX0 + 24), ibBY(IB_M.bottom), ac, P.gold, 6) +
        MK.arrow(ibBX(IB_M.bodyX1 + 34), ibBY(IB_M.bottom), ibBX(IB_M.bodyX1 - 24), ibBY(IB_M.bottom), ac, P.gold, 6);

      /* the three names, each with a line to the part of the model it names */
      out += ibLabel(t, 500, 250, "chest", cChest, [ibBX(IB_M.bodyX0) + 4, ibBY(240)], true, 26, "end");
      out += ibLabel(t, 500, 150, "lung", cLung, [ibBX(104), ibBY(150)], true, 26, "end");
      out += ibLabel(t, 500, 392, "breathing muscle", cMuscle, [ibBX(74), ibBY(IB_M.bottom + 6)], true, 26, "end");

      /* using it: pull the bottom balloon down, then let go */
      var pu = on(t, cPull, 0.5) * (1 - on(t, cLet, 0.5)), le = on(t, cLet, 0.5);
      var ax = ibBX(IB_M.bodyX1 + 30);
      if (pu > 0) out += MK.arrow(ax, ibBY(IB_M.bottom), ax, ibBY(IB_M.bottom + 46), pu, P.gold, 8);
      if (le > 0) out += MK.arrow(ax, ibBY(IB_M.bottom + 46), ax, ibBY(IB_M.bottom), le, P.teal, 8);
      /* the air going in and out of the neck */
      /* the stream of air stops at "Your model breathes": from there the only
         motion is the model's own small breath, so a stream still pouring out
         of the neck would be air leaving a lung that is quietly filling. */
      var air = Math.max(on(t, cFills, 0.4), on(t, cEmpty, 0.4)) * (1 - on(t, cBreathes, 0.4));
      if (air > 0.02) {
        var going = pull > 0.5;
        for (var k = 0; k < 4; k++) {
          var ph = (((t - (going ? cFills : cEmpty)) / 0.85) + k * 0.25) % 1;
          var y = going ? lerp(14, ibBY(10), ph) : lerp(ibBY(10), 14, ph);
          out += C(ibBX(130) + (IB_SCATTER[k] - 0.5) * 30, y, 7, going ? P.blue : P.teal, null, null, { opacity: (1 - ph) * air });
        }
      }
      /* the "breathing in" pill goes on "Let go", not when "Breathing out" is
         finally said: it labelled the model while the lung was visibly
         emptying, which is the state it no longer named. */
      var inO = popIn(t, cIn, 0.4) * (1 - on(t, cLet, 0.35)), outO = popIn(t, cOut, 0.4);
      if (inO > 0.02 && !(outO > 0)) out += MK.pill(ibBX(130), 414, "breathing in", Math.min(1, inO), { size: 24, col: P.blue });
      if (outO > 0) out += MK.pill(ibBX(130), 414, "breathing out", Math.min(1, outO), { size: 24, col: P.teal });

      /* the real thing, breathing with it: the lesson kit's own lungs */
      var real = on(t, cFills, 0.7);
      if (real > 0.01) {
        out += G(MK.pic(982, 176, 214, "\u{1FAC1}"), { transform: around(982, 176, 0.9 + 0.13 * fill), opacity: real });
        out += MK.pill(982, 322, "your lungs", real, { size: 28, col: P.teal });
        var br = on(t, cBreathes, 0.5);
        if (br > 0) out += MK.leader(ibBX(IB_M.bodyX1 + 6), 176, 876, 176, br, P.teal) +
          Tx(982, 382, "the model works the same way", "lab mid muted readable", "middle", { opacity: br });
      }
    }
    return svg(out);
  }
  /* the model's own x, for a mark measured from the neck */
  function M0(d) { return IB_M.neckX + d; }

  /* ---- what you now know ----------------------------------------------------------- */
  var IB_RECAP = MK.recapKind([
    { beat: 0, at: "brain", title: "Brain", sub: "thinks and controls", pic: "\u{1F9E0}" },
    { beat: 0, at: "lungs", title: "Lungs", sub: "take in air", pic: "\u{1FAC1}" },
    { beat: 0, at: "heart", title: "Heart", sub: "pumps blood", pic: "\u{1FAC0}" },
    { beat: 1, at: "stomach", title: "Stomach", sub: "breaks food down", pic: "\u{1F372}" },
    { beat: 1, at: "intestine", title: "Intestine", sub: "takes the goodness", pic: "\u{1F300}" },
    { beat: 2, at: "models", title: "Two models", sub: "a diagram and a bottle",
      pic: function (cx, cy, size) {
        return ART.place(ibBody(), cx - size * 0.78, cy - size * 0.5, size * 0.62, size) +
          ibModelAt(cx + size * 0.12, cy - size * 0.5, size / 355, { cut: 1, lung: true, muscle: true, fill: 0.4, pull: 0 });
      } }
  ], { goBeat: 3, goAt: "five" });

  var KINDS = {
    title: MK.titleKind({ sub: ["The brain, lungs, heart, stomach and intestine", "What each one does", "Two ways to model your body"] }),
    map: ibMapChapter, brainlungs: ibBrainLungsChapter, heart: ibHeartChapter,
    gut: ibGutChapter, diagram: ibDiagramChapter, model: ibModelChapter, recap: IB_RECAP
  };
