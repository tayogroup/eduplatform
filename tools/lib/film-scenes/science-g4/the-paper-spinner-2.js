
  /* ==== chapters: the variables, and the kit ====================================
     tools/lib/film-scenes/science-g4/the-paper-spinner-2.js. */

  /* ---- change one, keep the rest ------------------------------------------------
     The lesson's own three variable bins ("Change, measure, or keep the same?"),
     side by side, with the lesson's own items in them. Only ONE card is ever
     boxed in gold - the one being named - and the four things that are kept the
     same tick off one by one as they are said, so the frame shows the rest
     staying the same rather than only saying it. The last beat breaks the fair
     test on purpose: the drop height moves across into Change, its row is
     crossed out, and nothing can be told from the result. */
  var PSP_COL = [
    { x: 16, w: 340, pic: "\u{1F504}", label: "Change" },
    { x: 372, w: 340, pic: "\u{1F4CB}", label: "Measure" },
    { x: 728, w: 424, pic: "\u{1F512}", label: "Keep the same" }
  ];
  var PSP_COLY = 70, PSP_COLH = 362;
  function pspColumn(k, col, headIn, o) {
    var c = PSP_COL[k];
    if (!(o > 0)) return "";
    return G(R(c.x, PSP_COLY, c.w, PSP_COLH, 20, P.card, col || P.line, col ? 4 : 2) +
      G(MK.pic(c.x + 44, PSP_COLY + 46, 44, c.pic) +
        Tx(c.x + 76, PSP_COLY + 58, c.label, "lab big", "start"), { opacity: clamp(headIn, 0, 1) }),
      { opacity: clamp(o, 0, 1) });
  }

  function pspFairChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cVar = c(0, "variable"), cCouldChange = c(0, "change");
    var cChange = c(1, "change"), cWings = c(1, "wings");
    var cMeasure = c(2, "measure"), cFall = c(2, "fall");
    var cSame = c(3, "same"), cHeight = c(3, "height"), cPaper = c(3, "paper"), cClip = c(3, "clip"), cPerson = c(3, "person");
    var cTwo = c(4, "two"), cCannot = c(4, "cannot");
    var out = "", broken = on(t, cTwo, 0.5);

    /* The three cards, then their headings one after another. GOLD means "the
       one thing we change" and belongs to that card alone: the other two get
       their own colours, so a frame can never show two cards claiming to be
       the change. The last beat turns the Change card red, because by then it
       holds two things. */
    var frames = on(t, cVar, 0.5);
    var heads = [on(t, cCouldChange, 0.4), on(t, cCouldChange == null ? null : cCouldChange + 0.3, 0.4), on(t, cCouldChange == null ? null : cCouldChange + 0.6, 0.4)];
    out += pspColumn(0, broken > 0.4 ? P.bad : on(t, cChange, 0.5) > 0.4 ? P.gold : null, heads[0], frames);
    out += pspColumn(1, on(t, cMeasure, 0.5) > 0.4 ? P.blue : null, heads[1], frames);
    out += pspColumn(2, on(t, cSame, 0.5) > 0.4 ? P.good : null, heads[2], frames);

    /* Change: the one thing we change, the size of the wings */
    var pw = popIn(t, cWings, 0.45), spin = cWings == null || t < cWings ? 0 : (t - cWings) * 3.0;
    var wx = lerp(186, 130, broken);
    out += pspSpinner(wx, 236, 2.6, PSP_WING_BIG, spin, pw);
    out += MK.pill(wx, 376, "wing size", Math.min(1, pw), { size: 22, col: P.gold });
    /* the second thing, changed by mistake, arriving on the last beat */
    out += MK.pop(Em(286, 224, 96, "\u{1F4CF}"), 286, 224, popIn(t, cTwo, 0.45));
    out += MK.pill(286, 376, "height", Math.min(1, broken), { size: 22, col: P.bad });

    /* Measure: how long it takes to fall */
    var pm = popIn(t, cFall, 0.45);
    out += MK.pop(Em(542, 230, 150, "⏱️"), 542, 230, pm);
    out += MK.pill(542, 376, "time to fall", Math.min(1, pm), { size: 22, col: P.blue });

    /* Keep the same: the lesson's own four, ticking as they are said */
    out += MK.list(764, 190, [
      { text: "the height", at: cHeight, mark: broken > 0.4 ? "cross" : "tick", markAt: broken > 0.4 ? cTwo : null },
      { text: "the paper", at: cPaper, mark: "tick" },
      { text: "the paperclip", at: cClip, mark: "tick" },
      { text: "who drops it", at: cPerson, mark: "tick" }
    ], t, { lh: 62, cls: "lab big", markR: 19 });
    /* the height leaves the list when it is changed by mistake */
    if (broken > 0.4) out += L(800, 190, 980, 190, P.bad, 4, { opacity: broken });

    /* "you cannot tell which one made the difference" */
    out += MK.bubble(38, 2, 300, 58, "Which one?", on(t, cCannot, 0.45), 190, 66);
    return svg(out);
  }

  /* ---- the right kit, the right units --------------------------------------------
     The lesson's kit list, as a tray of six tools: the two it asks for and four
     it offers instead. Each right one is ringed and ticked as it is named, with
     its unit under it. The last beat is the lesson's own reason for standard
     units (:69 in content/lesson-13.py - "they are the same for everyone, so
     results can be compared") - carried by the two tools already chosen and
     already ringed gold with their own "seconds"/"centimetres" pills, not by a
     worked demonstration with figures the lesson never runs. An earlier cut
     drew two people's hand spans as "7 spans" and "5 spans" of one height
     beside two tape measures agreeing at "150 cm" - none of those numbers are
     in the lesson (review, 2026-09-24: the lesson's only "150" is an unrelated
     extension question about laying a 50 cm ruler down three times, and the
     lesson's only three "span" mentions carry no figures at all), so it was
     removed rather than replaced with a different invented one. */
  var PSP_TOOLS = [
    { pic: "⏱️", label: "stopwatch" },
    { pic: "\u{1F4CF}", label: "tape measure" },
    { pic: "\u{1F4D0}", label: "ruler" },
    { pic: "✂️", label: "scissors" },
    { pic: "⚖️", label: "scales" },
    { pic: "\u{1F321}️", label: "thermometer" }
  ];
  var PSP_TOOLW = 176, PSP_TOOLGAP = 16, PSP_TOOLX = 16, PSP_TOOLY = 10, PSP_TOOLH = 166;
  function pspToolX(k) { return PSP_TOOLX + k * (PSP_TOOLW + PSP_TOOLGAP); }

  function pspKitChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cKit = c(0, "equipment"), cJob = c(0, "job"), cTool = c(0, "tool");
    var cWatch = c(1, "stopwatch"), cSec = c(1, "seconds");
    var cTape = c(2, "tape"), cCm = c(2, "cm");
    var cStd = c(3, "standard"), cEvery = c(3, "everyone"), cCheck = c(3, "check");
    var out = "", shown = tally(t, cKit, 6, 1.3);

    for (var k = 0; k < 6; k++) {
      if (k >= shown) continue;
      var x = pspToolX(k), cx = x + PSP_TOOLW / 2;
      var chosen = k === 0 ? on(t, cWatch, 0.45) : k === 1 ? on(t, cTape, 0.45) : 0;
      var pop = popIn(t, cKit == null ? null : cKit + k * 0.22, 0.4);
      out += G(R(x, PSP_TOOLY, PSP_TOOLW, PSP_TOOLH, 18, chosen > 0.4 ? P.cell : P.card, chosen > 0.4 ? P.gold : P.line, chosen > 0.4 ? 4 : 2) +
        MK.pic(cx, PSP_TOOLY + 62, 84, PSP_TOOLS[k].pic) +
        Tx(cx, PSP_TOOLY + 140, PSP_TOOLS[k].label, "lab mid muted", "middle"),
        { opacity: Math.min(1, pop), transform: around(cx, PSP_TOOLY + PSP_TOOLH / 2, Math.min(pop, 1.06)) });
    }
    /* "the right tool": a question mark travelling along the tray */
    var hunt = on(t, cTool, 0.4) * pspUntil(t, scene, 1);
    if (hunt > 0) {
      var u = clamp((t - cTool) / 0.7, 0, 1);
      out += MK.qmark(lerp(pspToolX(5) + PSP_TOOLW / 2, pspToolX(0) + PSP_TOOLW / 2, ease(u)), PSP_TOOLY + PSP_TOOLH + 36, 26, hunt);
    }
    /* "Each job": the two jobs of this test arrive in the middle, with no tool
       yet; each then slides under the tool that is chosen for it. */
    var jobs = popIn(t, cJob, 0.45);
    var jw = popIn(t, cWatch, 0.45), jt = popIn(t, cTape, 0.45);
    var jax = lerp(430, pspToolX(0) + PSP_TOOLW / 2, on(t, cWatch, 0.6));
    var jbx = lerp(740, pspToolX(1) + PSP_TOOLW / 2, on(t, cTape, 0.6));
    out += MK.pill(jax, 212, "time the fall", Math.min(1, jobs), { size: 24, col: on(t, cWatch, 0.4) > 0.4 ? P.gold : P.line });
    out += MK.pill(jbx, 212, "drop height", Math.min(1, popIn(t, cJob == null ? null : cJob + 0.25, 0.45)), { size: 24, col: on(t, cTape, 0.4) > 0.4 ? P.gold : P.line });
    out += MK.tick(pspToolX(0) + PSP_TOOLW - 24, PSP_TOOLY + 24, 22, jw);
    out += MK.tick(pspToolX(1) + PSP_TOOLW - 24, PSP_TOOLY + 24, 22, jt);
    out += MK.pill(pspToolX(0) + PSP_TOOLW / 2, 260, "seconds", Math.min(1, popIn(t, cSec, 0.4)), { size: 26, col: P.gold, ink: P.gold });
    out += MK.pill(pspToolX(1) + PSP_TOOLW / 2, 260, "centimetres", Math.min(1, popIn(t, cCm, 0.4)), { size: 26, col: P.gold, ink: P.gold });

    /* The last beat, on the two cards already on screen: "standard units" (a
       shared gold ring joins the stopwatch and tape measure cards), "the same
       for everyone" (their own "seconds"/"centimetres" pills, already gold,
       flash together), "anybody can check" (a tick lands under each). Nothing
       here is a number: it points at what is already drawn rather than
       staging a worked example the lesson does not run. */
    var std = on(t, cStd, 0.6);
    if (std > 0) {
      var pulse = 0.55 + 0.45 * breathe(t);
      var ringL = pspToolX(0) - 10, ringR = pspToolX(1) + PSP_TOOLW + 10;
      out += R(ringL, PSP_TOOLY - 10, ringR - ringL, PSP_TOOLH + 20, 26, "none", P.gold, 5, { opacity: clamp(std * pulse, 0, 1) });
    }
    var every = on(t, cEvery, 0.5);
    if (every > 0) {
      out += R(pspToolX(0) + 14, 236, PSP_TOOLW - 28, 46, 14, "none", P.gold, 3, { opacity: clamp(every, 0, 1) });
      out += R(pspToolX(1) + 14, 236, PSP_TOOLW - 28, 46, 14, "none", P.gold, 3, { opacity: clamp(every, 0, 1) });
    }
    out += MK.tick(pspToolX(0) + PSP_TOOLW / 2, 306, 26, popIn(t, cCheck, 0.4));
    out += MK.tick(pspToolX(1) + PSP_TOOLW / 2, 306, 26, popIn(t, cCheck == null ? null : cCheck + 0.2, 0.4));
    return svg(out);
  }
