
  /* ==== Grade 4 Science, Lesson 13: The Paper Spinner ==========================
     tools/lib/film-scenes/science-g4/the-paper-spinner.js, with -2.js and -3.js:
     the film's pictures, after the shared marks (MK) and before the engine's
     tail, all in one scope. The storyboard is
     science/grade-4-app/lecture-video/the-paper-spinner.json.

     This lesson is one whole investigation, so the film shows the investigation
     being done. Its pictures are the lesson's own: the five enquiry bins and
     the three variable bins of its two sorting steps, its kit list, and above
     all ART.sim("spinner", "draw", n, y, big, m) - the drawing the child drops
     and times two steps later, with the lesson's own numbers (2.1, 2.3, 2.0
     and 2.8, 3.0, 2.7) appearing in it as they are said.

     This file: the palette, the spinner the film draws itself, the timing
     helpers, the title motif, and the chapters "Which kind of enquiry?" and
     "Change one, keep the rest". Every top-level name here starts with psp. */

  var HUE = {
    title: P.teal, enquiry: P.gold, fairtest: P.blue, kit: P.plum,
    repeat: P.accent, record: P.good, conclude: P.gold, recap: P.teal
  };

  /* ---- timing ---------------------------------------------------------------- */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 comes
     in: for a thing that belongs to that beat alone (rule 7) */
  function pspOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function pspFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }
  /* 1 until the chapter's beat k comes in, then 0 */
  function pspUntil(t, scene, k) { return 1 - pspFrom(t, scene, k); }

  /* ---- the paper spinner ------------------------------------------------------
     The lesson's own spinner, shape for shape. ICONS.spinner (lesson-kit/_icons.py,
     what icon("spinner") draws in this lesson's enquiry picker) is a gold stem
     with a grey paperclip on it and two paper wings in two tints, which is how
     a real one is folded: one wing forward, one back. Those are its paths, with
     the stem's top moved to the origin, and `wing` - how far a wing reaches out
     - left free so the small spinner and the one with bigger wings are the same
     drawing at two sizes, as the lesson's own sim draws them (16 px against 32).

     It turns about its own stem. A turn about a vertical axis, seen from the
     side, is a squash across: scale(cos(phase), 1). So the wings narrow, meet
     edge-on, and open again with the far wing now in front, which is why the
     two tints swap sides. The phase only ever increases, so it turns the same
     way in every frame of the film. */
  var PSP_WING_SMALL = 13, PSP_WING_BIG = 26;
  function pspSpinner(cx, cy, k, wing, phase, o) {
    if (!(o > 0)) return "";
    var w = wing, iw = w * 0.54;
    /* edge-on it would be a bare stem for a few frames, which is true of a real
       spinner and unreadable in a still: the squash stops at 0.28 of its width,
       so a wing is always visible and the turn still reads */
    var cq = Math.cos(phase), cs = (cq < 0 ? -1 : 1) * (0.28 + 0.72 * Math.abs(cq));
    var inner =
      Pth("M-4,0 L" + n2(-w) + ",-26 L" + n2(-iw) + ",-26 L0,-4 Z", "#F0A56B", "#C0763A", 1.5) +
      Pth("M4,0 L" + n2(w) + ",-26 L" + n2(iw) + ",-26 L0,-4 Z", "#F7C08F", "#C0763A", 1.5) +
      Pth("M-4,0 L4,0 L4,24 L-4,24 Z", "#F4C95D", "#B8902E", 1.5) +
      R(-3, 20, 6, 4, 1, "#7D7D7D");
    return G(G(inner, { transform: "scale(" + n3(cs) + ",1)" }),
      { transform: tr(cx, cy, k), opacity: clamp(o, 0, 1) });
  }
  /* a ring round a spinner's wings, for the one being named */
  function pspWingRing(cx, cy, k, wing, o) {
    if (!(o > 0)) return "";
    return E(cx, cy - 15 * k, wing * k + 14, 17 * k + 12, "none", P.gold, 4, { opacity: clamp(o, 0, 1) });
  }

  /* ---- the title motif ---------------------------------------------------------
     A round window with the lesson's spinner turning as it falls. On the two
     cards it simply falls, round and round; in the spoken title chapter it is
     cued: the small one appears and hangs still, it starts to turn, the bigger
     one drops in beside it, and a question mark asks which is slower. */
  var PSP_FALL_TOP = 96, PSP_FALL_FLOOR = 292;
  function pspFallY(t, period, offset) {
    var u = (((t + offset) % period) + period) % period / period;
    return lerp(PSP_FALL_TOP, PSP_FALL_FLOOR, ease(u));
  }
  function titleMotif(o) {
    var t = o.t || 0, s = o.scene, out = "";
    var card = !s;                                        /* on the two cards nothing is cued */
    var cSpin = s ? sc(s, 0, "spinner") : null, cTurn = s ? sc(s, 0, "turning") : null,
      cBig = s ? sc(s, 0, "bigger") : null, cFind = s ? sc(s, 1, "find") : null,
      cWhole = s ? sc(s, 1, "whole") : null;
    var oSmall = card ? 1 : popIn(t, cSpin, 0.45);
    var oBig = card ? 1 : popIn(t, cBig, 0.45);
    /* it hangs still until it is said to turn */
    var spin = card ? t * 4.4 : (cTurn == null || t < cTurn ? 0 : (t - cTurn) * 4.4);

    out += el("clipPath", { id: "pspMotifClip" }, C(180, 180, 172));
    out += C(180, 180, 172, "#123247");
    /* the ground and the falling spinners live inside the round window; the
       ground is the sim's own brown, and is clipped with them so it cannot
       stick out either side of the circle */
    var ySmall = card || cSpin == null ? PSP_FALL_TOP : (t < cSpin ? PSP_FALL_TOP : pspFallY(t - cSpin, 2.6, 0));
    var yBig = card || cBig == null ? PSP_FALL_TOP : (t < cBig ? PSP_FALL_TOP : pspFallY(t - cBig, 2.6, 0));
    var inner = R(0, 304, 360, 60, 0, "#8A6A4A") +
      pspSpinner(122, ySmall, 1.9, PSP_WING_SMALL, spin, oSmall) +
      pspSpinner(252, yBig, 1.9, PSP_WING_BIG, spin + 0.7, oBig);
    out += G(inner, { "clip-path": "url(#pspMotifClip)" });
    out += C(180, 180, 172, "none", P.line, 3);
    /* which of the two is slower? */
    out += MK.qmark(180, 96, 34, card ? 1 : popIn(t, cBig == null ? null : cBig + 0.3, 0.4));
    /* "find out": the question mark brightens; "one whole investigation": a
       gold ring closes all the way round the picture */
    if (!card) {
      out += MK.glow(180, 96, 66, P.gold, on(t, cFind, 0.6) * (0.6 + 0.4 * breathe(t)));
      var loop = on(t, cWhole, 1.5), circ = 2 * Math.PI * 164;
      if (loop > 0) out += C(180, 180, 164, "none", P.gold, 6,
        { "stroke-dasharray": n2(circ), "stroke-dashoffset": n2(circ * (1 - loop)), transform: "rotate(-90 180 180)", opacity: 0.9 });
    }
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A paper spinner turning as it falls, beside one with bigger wings">' + out + "</svg>";
  }

  /* ==== chapter: which kind of enquiry? ==========================================
     Three pictures, one fading into the next: a question that can be tested,
     the question itself, and the lesson's own five enquiry bins - the bins of
     its "Which type of enquiry?" sorting step, in the order its explain names
     them. The last beat draws a line from our question to Fair testing and
     ticks it, and dims the other four. */
  var PSP_BINS = [
    { pic: "\u{1F4DA}", l1: "Research", l2: "" },
    { pic: "⚖️", l1: "Fair", l2: "testing" },
    { pic: "⌛", l1: "Observing", l2: "over time" },
    { pic: "\u{1F5C2}️", l1: "Classifying", l2: "" },
    { pic: "\u{1F4C8}", l1: "Pattern", l2: "seeking" }
  ];
  var PSP_BINW = 206, PSP_BINGAP = 28, PSP_BINX = 13, PSP_BINY = 150, PSP_BINH = 240;
  function pspBinX(k) { return PSP_BINX + k * (PSP_BINW + PSP_BINGAP); }

  /* beat 1: a question you can actually test */
  function pspAskPic(t, scene) {
    var cStarts = sc(scene, 0, "starts"), cQ = sc(scene, 0, "question"), cTest = sc(scene, 0, "test");
    var out = "";
    out += MK.arrow(250, 200, 470, 200, on(t, cStarts, 0.6), P.gold, 8);
    out += MK.qmark(584, 200, 92, popIn(t, cQ, 0.45));
    out += MK.tick(744, 200, 40, popIn(t, cTest, 0.4));
    /* the things you can actually do: the lesson's own kit for this test */
    var kitIn = on(t, cTest, 0.5);
    if (kitIn > 0) {
      out += MK.pop(MK.pic(470, 364, 86, ART.ICONS.spinner), 470, 364, popIn(t, cTest, 0.4));
      out += MK.pop(Em(584, 364, 80, "⏱️"), 584, 364, popIn(t, cTest == null ? null : cTest + 0.18, 0.4));
      out += MK.pop(Em(698, 364, 80, "\u{1F4CF}"), 698, 364, popIn(t, cTest == null ? null : cTest + 0.36, 0.4));
    }
    return out;
  }

  /* beat 2: our question, the two spinners side by side */
  function pspQuestionPic(t, scene) {
    var cOurs = sc(scene, 1, "ours"), cWings = sc(scene, 1, "wings"), cSlow = sc(scene, 1, "slower");
    var spin = cOurs == null || t < cOurs ? 0 : (t - cOurs) * 3.4, out = "";
    var pSmall = popIn(t, cOurs, 0.45), pBig = popIn(t, cOurs == null ? null : cOurs + 0.25, 0.45);
    out += pspSpinner(392, 250, 2.6, PSP_WING_SMALL, spin, pSmall);
    out += pspSpinner(776, 250, 2.6, PSP_WING_BIG, spin + 0.7, pBig);
    out += MK.pill(392, 412, "small wings", Math.min(1, pSmall), { size: 24, col: P.line });
    out += MK.pill(776, 412, "bigger wings", Math.min(1, pBig), { size: 24, col: cWings != null && t >= cWings ? P.gold : P.line });
    out += pspWingRing(776, 250, 2.6, PSP_WING_BIG, on(t, cWings, 0.45));
    out += MK.qmark(584, 214, 56, popIn(t, cOurs == null ? null : cOurs + 0.5, 0.4));
    /* "more slowly": the stopwatch that will settle it, with a line to each
       spinner - it has nothing to say yet, which is why the question mark stays */
    var slow = popIn(t, cSlow, 0.45);
    out += MK.pop(Em(584, 340, 118, "⏱️"), 584, 340, slow);
    out += MK.leader(524, 300, 452, 236, on(t, cSlow == null ? null : cSlow + 0.2, 0.5), P.gold);
    out += MK.leader(644, 300, 716, 236, on(t, cSlow == null ? null : cSlow + 0.35, 0.5), P.gold);
    return out;
  }

  /* beats 3 to 5: the lesson's five enquiry bins */
  function pspBinsPic(t, scene) {
    var cFive = sc(scene, 2, "five"), cTells = sc(scene, 2, "tells");
    var named = [sc(scene, 3, "research"), sc(scene, 3, "fair"), sc(scene, 3, "time"), sc(scene, 3, "classify"), sc(scene, 3, "pattern")];
    var cChange = sc(scene, 4, "change"), cOurs = sc(scene, 4, "ours");
    var out = "", shown = tally(t, cFive, 5, 0.9), picked = on(t, cOurs, 0.45);

    for (var k = 0; k < 5; k++) {
      if (k >= shown) continue;
      var x = pspBinX(k), fair = k === 1;
      var fade = fair ? 1 : 1 - 0.68 * picked;
      var lit = on(t, named[k], 0.45);
      var ring = fair ? Math.max(on(t, cChange, 0.5), picked) : 0;
      var pop = popIn(t, cFive == null ? null : cFive + k * 0.225, 0.4);
      var g = R(x, PSP_BINY, PSP_BINW, PSP_BINH, 20, lit > 0.4 ? P.cell : P.card, ring > 0.4 ? P.gold : P.line, ring > 0.4 ? 4 : 2) +
        MK.pop(MK.pic(x + PSP_BINW / 2, PSP_BINY + 80, 84, PSP_BINS[k].pic), x + PSP_BINW / 2, PSP_BINY + 80, popIn(t, named[k], 0.4)) +
        Tx(x + PSP_BINW / 2, PSP_BINY + 168, PSP_BINS[k].l1, "lab big", "middle", { opacity: lit }) +
        (PSP_BINS[k].l2 ? Tx(x + PSP_BINW / 2, PSP_BINY + 206, PSP_BINS[k].l2, "lab big", "middle", { opacity: lit }) : "");
      out += G(g, { opacity: clamp(fade * Math.min(1, pop), 0, 1), transform: around(x + PSP_BINW / 2, PSP_BINY + PSP_BINH / 2, Math.min(pop, 1.06)) });
    }
    /* our question, small, above the row */
    var echo = popIn(t, cTells, 0.45), spin = cTells == null || t < cTells ? 0 : (t - cTells) * 3.0;
    if (echo > 0) {
      out += G(pspSpinner(506, 76, 1.25, PSP_WING_SMALL, spin, 1) + pspSpinner(600, 76, 1.25, PSP_WING_BIG, spin + 0.7, 1) +
        MK.qmark(674, 62, 24, 1), { opacity: clamp(echo, 0, 1) });
      out += MK.pill(392, 62, "our question", Math.min(1, echo), { size: 22, col: P.line });
    }
    /* "change one thing": a line from the question down to Fair testing */
    out += MK.leader(600, 112, pspBinX(1) + PSP_BINW / 2, PSP_BINY - 6, on(t, cChange, 0.65), P.gold);
    /* "ours is a fair test" */
    out += MK.tick(pspBinX(1) + PSP_BINW - 26, PSP_BINY + 26, 26, popIn(t, cOurs, 0.4));
    return out;
  }

  function pspEnquiryChapter(scene, beat, t, i) {
    var toB = into(t, scene.first + 1), toC = into(t, scene.first + 2), out = "";
    if (toB < 1) out += G(pspAskPic(t, scene), { opacity: 1 - toB });
    if (toB > 0 && toC < 1) out += G(pspQuestionPic(t, scene), { opacity: toB * (1 - toC) });
    if (toC > 0) out += G(pspBinsPic(t, scene), { opacity: toC });
    return svg(out);
  }
