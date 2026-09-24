  /* ==== Grade 2 Computing, Lesson 11, part 3 ===================================
     The chapter "Portable, or powerful".

     THE CONTRAST HERE IS NOT A RIGHT AND A WRONG, and the picture says so: the
     phone and the desktop stand in two panels of their own, the desktop is
     never crossed out for not being portable (it carries a "stays at one desk"
     line instead), and the chapter ENDS with a tick on BOTH of them, because
     the lesson's answer is "it depends on the job you are doing". */

  /* ---- what portable means ------------------------------------------------- */
  function cdrPortableMeans(scene, t) {
    var cPort = sc(scene, 0, "portable"), cCarry = sc(scene, 0, "carry");
    var p = popIn(t, cPort, 0.5), out = "";
    if (!(p > 0)) return "";
    out += R(284, 68, 600, 290, 26, P.card, P.plum, 3);
    out += Tx(584, 158, "portable", "lab huge", "middle", { fill: P.plum });
    out += Tx(584, 212, "small and light enough to carry", "lab big", "middle");
    var c = popIn(t, cCarry, 0.45);
    if (c > 0) out += MK.pop(Em(500, 300, 68, "\u{1F9D1}") + Em(584, 306, 54, "\u{1F392}") +
      Em(668, 300, 60, "\u{1F4F2}"), 584, 300, c);
    return G(out, { transform: around(584, 213, Math.min(1.04, p)), opacity: Math.min(1, p) });
  }

  /* ---- the two panels ------------------------------------------------------- */
  var CDR_PL = { x: 32, w: 500, y: 36, h: 326 }, CDR_PR = { x: 636, w: 500, y: 36, h: 326 };
  var CDR_PLACES = [
    { x: 122, pic: "\u{1F68C}" }, { x: 282, pic: "\u{1F33E}" }, { x: 442, pic: "\u{1F3E5}" }
  ];

  function cdrPanelBox(b, col, p) {
    if (!(p > 0)) return "";
    return G(R(b.x, b.y, b.w, b.h, 24, P.card, col, 3), { opacity: Math.min(1, p) });
  }

  function cdrPortablePanels(scene, t) {
    var cPhone = sc(scene, 1, "phone"), cDesk = sc(scene, 1, "desktop");
    var cGoes = sc(scene, 2, "goes"), cPocket = sc(scene, 2, "pocket");
    var cBigger = sc(scene, 3, "bigger"), cMore = sc(scene, 3, "more");
    var cBetter = sc(scene, 4, "better"), cDepends = sc(scene, 4, "depends");
    var out = "", k;

    /* ---- left: portable ---- */
    /* ONE phone, never two: it starts big in the middle of the panel and, on
       "goes wherever you go", shrinks and travels along the lesson's own three
       places. A second small phone drawn beside the big one read as a bug. */
    var pL = popIn(t, cPhone, 0.45), oGo = on(t, cGoes, 0.5);
    out += cdrPanelBox(CDR_PL, P.plum, on(t, cPhone, 0.4));
    var phX = 282, phY = 168, phS = 100;
    if (cGoes != null && oGo > 0) {
      var seg = clamp((t - cGoes) / 2.0, 0, 1) * 2, i0 = Math.min(1, Math.floor(seg));
      phX = lerp(282, lerp(CDR_PLACES[i0].x, CDR_PLACES[i0 + 1].x, clamp(seg - i0, 0, 1)), oGo);
      phY = lerp(168, 214, oGo);
      phS = lerp(100, 60, oGo);
    }
    if (pL > 0) out += G(Tx(282, 92, "portable", "lab big", "middle", { fill: P.plum }),
      { opacity: Math.min(1, pL) });

    /* it goes wherever you go: three of the lesson's own places */
    var shown = tally(t, cGoes, 3, 1.3);
    for (k = 0; k < 3; k++) {
      if (shown <= k) continue;
      out += MK.pop(C(CDR_PLACES[k].x, 284, 30, P.cell, P.line, 2) + Em(CDR_PLACES[k].x, 284, 36, CDR_PLACES[k].pic),
        CDR_PLACES[k].x, 284, popIn(t, cGoes == null ? null : cGoes + k * 0.65, 0.34));
    }
    if (pL > 0) out += G(Em(phX, phY, phS, "\u{1F4F2}"),
      { opacity: Math.min(1, pL), transform: around(phX, phY, Math.min(1.05, pL)) });
    out += MK.pill(282, 340, "in a pocket", on(t, cPocket, 0.4), { size: 22, col: P.plum, ink: P.plum });

    /* ---- right: not portable, and it does more ---- */
    var pR = popIn(t, cDesk, 0.45);
    out += cdrPanelBox(CDR_PR, P.blue, on(t, cDesk, 0.4));
    if (pR > 0) out += G(Tx(886, 92, "not portable", "lab big", "middle", { fill: P.blue }) +
      R(756, 228, 260, 14, 5, P.line) + Em(826, 168, 104, "\u{1F5A5}️"),
      { opacity: Math.min(1, pR), transform: around(886, 150, Math.min(1.05, pR)) });
    /* it stays at one desk: said in words, never marked wrong */
    out += G(Tx(886, 268, "it stays at one desk", "lab mid muted readable", "middle"),
      { opacity: on(t, cDesk == null ? null : cDesk + 0.45, 0.5) * (1 - on(t, cMore, 0.4)) });

    var pBig = popIn(t, cBigger, 0.45);
    if (pBig > 0) out += MK.pop(Em(946, 168, 104, "\u{1F5A5}️"), 946, 168, pBig);
    var pMore = popIn(t, cMore, 0.45);
    if (pMore > 0) {
      out += MK.pop(C(826, 284, 30, P.cell, P.blue, 3) + Em(826, 284, 36, "\u{1F3AC}"), 826, 284, pMore);
      out += MK.pop(C(946, 284, 30, P.cell, P.blue, 3) + Em(946, 284, 36, "\u{1F4D0}"), 946, 284,
        popIn(t, cMore == null ? null : cMore + 0.28, 0.4));
    }
    out += MK.pill(886, 340, "does more", on(t, cMore == null ? null : cMore + 0.5, 0.4),
      { size: 22, col: P.blue, ink: P.blue });

    /* ---- which one is better? both, and it depends on the job ---- */
    out += MK.qmark(584, 180, 40, on(t, cBetter, 0.45) * (1 - on(t, cDepends, 0.4)));
    var tick = popIn(t, cDepends, 0.42);
    out += MK.tick(496, 70, 22, tick);
    out += MK.tick(1100, 70, 22, popIn(t, cDepends == null ? null : cDepends + 0.2, 0.42));
    out += MK.pill(584, 400, "it depends on the job", on(t, cDepends == null ? null : cDepends + 0.3, 0.45),
      { size: 24, col: P.good, ink: P.good });
    return out;
  }

  KINDS.portable = function (scene, beat, t, i) {
    var toPanels = into(t, scene.first + 1), out = "";
    if (toPanels < 1) out += G(cdrPortableMeans(scene, t), { opacity: 1 - toPanels });
    if (toPanels > 0) out += G(cdrPortablePanels(scene, t), { opacity: toPanels });
    return svg(out);
  };
