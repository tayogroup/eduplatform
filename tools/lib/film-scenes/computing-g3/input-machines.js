  /* ==== Grade 3 Computing, Lesson 4: Input Machines ===========================
     tools/lib/film-scenes/computing-g3/input-machines.js, with -2.js and -3.js:
     the film's pictures, after the shared marks (MK) and before the engine's
     tail, all in one scope. The storyboard is
     computing/grade-3-app/lecture-video/input-machines.json.

     EVERY NUMBER A MACHINE SENDS OUT IN THIS FILM IS ART.rule(...), the
     lesson's own ruleOutput (mirrored in the lesson kit's _rules.py), so the
     film's doubling machine and the lesson's doubling machine cannot give a
     child two different answers to the same input. Nothing here does its own
     arithmetic; see IM_OUT below, which is worked out once as the page loads.

     Computing keeps no ART.sim - the lesson's machines live inside activities
     that need the lesson page's own element ids - so the PICTURE of a machine
     is the film's and only the RULES are the lesson's. The recipe's
     ingredients and the finished cake are the kit's own cake scene, painted
     from a growing list of its ids, exactly as the lesson's paintScene does.

     This file: the palette, the shared machine and tile drawings, the title
     motif and the chapter "What goes in". Every top-level name starts with im.
  */

  var HUE = {
    title: P.teal, input: P.gold, machine: P.accent, output: P.blue,
    predict: P.plum, rule: P.good, linear: P.gold, recap: P.teal
  };

  /* input is gold and output is green, everywhere in the film */
  var IM_IN = P.gold, IM_OUT_COL = P.good;

  /* ---- the lesson's own arithmetic, asked once ------------------------------
     ART.rule is the kit's ruleOutput. If the lesson ever changes what one of
     its machines does, these move with it and so does every frame. */
  var IM_OUT = {
    double3: ART.rule("double", 3),      /* 6  */
    double5: ART.rule("double", 5),      /* 10 */
    add3of10: ART.rule("add:3", 10),     /* 13 */
    add8of4: ART.rule("add:8", 4),       /* 12 */
    add8of5: ART.rule("add:8", 5),       /* 13 */
    times3of4: ART.rule("times:3", 4),   /* 12 */
    times3of5: ART.rule("times:3", 5),   /* 15 */
    sum34: ART.rule("add:4", 3)          /* 7: the lesson's "give it 3 and 4" */
  };

  /* ---- timing ----------------------------------------------------------------- */

  /* 0 -> 1 over the chapter's beats from .. to inclusive, and back to 0 as the
     beat after them comes in: for a picture that belongs to those beats alone
     (rule 7 - nothing left over from the beat before) */
  function imPhase(t, scene, from, to) {
    if (from >= scene.beats.length) return 0;
    var a = from === 0 ? 1 : into(t, scene.first + from);
    var z = to + 1 < scene.beats.length ? into(t, scene.first + to + 1) : 0;
    return a * (1 - z);
  }
  /* has this cue been reached? (a cue the beat never names is never reached) */
  function imPast(t, at) { return at != null && t >= at; }

  /* ---- the two things every chapter draws ------------------------------------- */

  /* A number (or a word) on a card: what goes in, and what comes out. */
  function imTile(cx, cy, s, text, p, col) {
    if (!(p > 0)) return "";
    var str = String(text), fs = s * (str.length > 2 ? 0.40 : 0.52);
    return G(R(cx - s / 2, cy - s / 2, s, s, s * 0.20, P.card, col, 4) +
      Tx(cx, cy + fs * 0.36, str, "lab", "middle", { fill: col, "font-size": fs }),
      { transform: around(cx, cy, Math.min(p, 1.1)), opacity: Math.min(1, p) });
  }

  /* The machine: a body with a name plate, a mouth on the left where the input
     goes in and a chute on the right where the output comes out. The picture is
     the film's; the numbers it sends out are the lesson's.
     g: {x, y, w, h, col, name, nameOn, o} */
  function imMachineShell(g) {
    var col = g.col || IM_IN, o = g.o == null ? 1 : g.o;
    if (!(o > 0)) return "";
    var my = g.y + g.h * 0.58;
    var body = R(g.x - 30, my - 30, 34, 60, 10, P.line, col, 3) +
      R(g.x + g.w - 4, my - 30, 34, 60, 10, P.line, col, 3) +
      R(g.x, g.y, g.w, g.h, 26, P.cell, col, 4) +
      R(g.x + 16, g.y + 14, g.w - 32, 54, 16, P.card, col, 2) +
      Em(g.x + 50, g.y + 42, 30, "⚙️") +
      (g.name ? Tx(g.x + 78, g.y + 51, g.name, "lab big", "start",
        { fill: col, opacity: n2(g.nameOn == null ? 1 : clamp(g.nameOn, 0, 1)) }) : "");
    return G(body, { opacity: clamp(o, 0, 1) });
  }

  /* One step inside a machine: a number, and the step in the lesson's words.
     An empty slot is drawn while the steps have not been read out yet. */
  function imStepRow(x, y, w, h, n, text, o, lit) {
    if (!(o > 0)) return "";
    var col = lit ? IM_IN : P.line;
    var body = R(x, y, w, h, h * 0.30, lit ? "#1B3A52" : P.card, col, lit ? 3.5 : 2,
      text ? null : { "stroke-dasharray": "9 7" }) +
      C(x + h * 0.52, y + h / 2, h * 0.30, P.cell, col, 2) +
      Tx(x + h * 0.52, y + h / 2 + h * 0.12, String(n), "lab", "middle", { fill: lit ? IM_IN : P.muted, "font-size": h * 0.36 }) +
      (text ? Tx(x + h * 1.02, y + h / 2 + 8, text, "lab", "start") : "");
    return G(body, { opacity: clamp(o, 0, 1) });
  }

  /* ==== the title ===============================================================
     The whole lesson in one picture: a number goes into a machine and a
     different number comes out. Spoken, the number arrives, the machine pops in
     on "a machine", the answer on "Out comes a different number", and the two
     words the lesson teaches are written under them as they are said. */
  function titleMotif(o) {
    var t = o.t || 0, sn = o.scene, out = "";
    var cMach = sn ? sc(sn, 0, "machine") : null, cOut = sn ? sc(sn, 0, "out") : null;
    var cIn = sn ? sc(sn, 1, "input") : null, cOutW = sn ? sc(sn, 1, "output") : null;
    var pNum = sn ? popIn(t, BEATS[sn.first].start + 0.1, 0.45) : 1;
    var pMach = sn ? popIn(t, cMach, 0.45) : 1;
    var pAns = sn ? popIn(t, cOut, 0.45) : 1;
    var aIn = sn ? on(t, cIn, 0.5) : 1, aOut = sn ? on(t, cOutW, 0.5) : 1;

    out += R(6, 40, 348, 280, 28, P.card, P.line, 3);
    out += MK.arrow(100, 150, 134, 150, pNum, IM_IN, 7);
    out += MK.arrow(246, 150, 282, 150, Math.min(1, pAns), IM_OUT_COL, 7);
    /* the machine */
    out += G(R(140, 98, 100, 104, 20, P.cell, P.accent, 4) +
      R(148, 106, 84, 26, 9, P.card, P.accent, 2) +
      Em(190, 168, 46, "⚙️"), { opacity: Math.min(1, pMach), transform: around(190, 150, Math.min(pMach, 1.1)) });
    out += imTile(58, 150, 74, "3", pNum, IM_IN);
    out += imTile(314, 150, 74, IM_OUT.double3, pAns, IM_OUT_COL);
    out += Tx(58, 246, "input", "lab", "middle", { fill: IM_IN, "font-size": 26, opacity: n2(aIn) });
    out += Tx(314, 246, "output", "lab", "middle", { fill: IM_OUT_COL, "font-size": 26, opacity: n2(aOut) });
    out += Tx(190, 246, "steps", "lab", "middle", { fill: P.muted, "font-size": 22, opacity: n2(Math.min(aIn, aOut)) });
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A number goes into a machine and a different number comes out">' + out + "</svg>";
  }

  /* ==== chapter: what goes in =====================================================
     The lesson's own five-algorithm input finder, four of them: a recipe, adding
     two numbers, a search, Robo on the grid. Each row names its input as the
     voice does, and the spotlight on the right shows THAT input and no other -
     the kit's own cake scene for the ingredients, the lesson's 3 and 4, the word
     the lesson types, and Robo's own command arrows. The last beat answers the
     lesson's misconception: the input is not a step. */

  var IM_ROW = { x: 24, w: 680, h: 76, gap: 20 };
  var IM_SPOT = { x: 740, y: 68, w: 404, h: 303 };   /* the kit's cake scene is 320 x 240 */
  function imRowY(k) { return 38 + k * (IM_ROW.h + IM_ROW.gap); }

  var IM_ALGOS = [
    { pic: "\u{1F373}", label: "a recipe", input: "the ingredients" },
    { pic: "➕", label: "adding two numbers", input: "the two numbers" },
    { pic: "\u{1F50D}", label: "a search", input: "the word you type" },
    { pic: "\u{1F916}", label: "Robo on the grid", input: "the program of arrows" }
  ];

  /* one algorithm, and the input it is given */
  function imAlgoRow(k, o, pillP, live) {
    if (!(o > 0)) return "";
    var a = IM_ALGOS[k], x = IM_ROW.x, y = imRowY(k), w = IM_ROW.w, h = IM_ROW.h;
    var col = live ? IM_IN : P.line;
    var body = R(x, y, w, h, 20, live ? "#1B3A52" : P.card, col, live ? 3.5 : 2) +
      Em(x + 44, y + h / 2, 38, a.pic) +
      Tx(x + 78, y + h / 2 + 8, a.label, "lab", "start") +
      MK.arrow(x + 322, y + h / 2, x + 372, y + h / 2, Math.min(1, pillP), IM_IN, 6) +
      MK.pill(x + w - 16, y + h / 2, a.input, Math.min(1, pillP), { size: 20, anchor: "end", col: IM_IN, ink: IM_IN });
    return G(body, { opacity: clamp(o, 0, 1) * (live ? 1 : 0.55) });
  }

  /* the spotlight: the input of the algorithm being named, and nothing else */
  function imSpotBox(inner, o) {
    if (!(o > 0)) return "";
    return G(R(IM_SPOT.x - 8, IM_SPOT.y - 52, IM_SPOT.w + 16, IM_SPOT.h + 68, 22, P.card, P.line, 2) + inner,
      { opacity: clamp(o, 0, 1) });
  }
  /* One of the kit's drawings, zoomed in on the part the words are about and
     clipped to its box. The drawing is the kit's, untouched; only the window on
     it is the film's - at the size the spotlight allows, the eggs and the flour
     inside the lesson's own bowl are a few pixels across and a child sees an
     empty bowl beside the words "eggs, flour and sugar go in". */
  function imZoom(id, x, y, w, h, markup) {
    return '<defs><clipPath id="' + id + '"><rect x="' + n2(x) + '" y="' + n2(y) +
      '" width="' + n2(w) + '" height="' + n2(h) + '" rx="14"/></clipPath></defs>' +
      '<g clip-path="url(#' + id + ')">' + markup + "</g>";
  }
  /* the kit's cake scene at 2.6x, framed on the mixing bowl */
  function imCake(n, o) {
    if (!(o > 0)) return "";
    var ids = ["bowl", "eggs", "flour"].slice(0, n);
    return G(imZoom("imbowl", IM_SPOT.x, IM_SPOT.y, IM_SPOT.w, IM_SPOT.h,
      ART.place(ART.scene("cake", ids), 736, -170.5, 832, 624)), { opacity: clamp(o, 0, 1) });
  }

  function imInputChapter(scene, beat, t, i) {
    var cInput = sc(scene, 0, "input"), cWork = sc(scene, 0, "work");
    var cRec = sc(scene, 1, "recipe"), cIng = sc(scene, 1, "ing");
    var cSum = sc(scene, 2, "sum"), cTwo = sc(scene, 2, "two"), cNums = sc(scene, 2, "nums");
    var cSea = sc(scene, 3, "search"), cType = sc(scene, 3, "type"), cWord = sc(scene, 3, "word");
    var cRobo = sc(scene, 4, "robo"), cProg = sc(scene, 4, "prog");
    var cNot = sc(scene, 5, "notstep"), cWorkOn = sc(scene, 5, "workon");
    var out = "", mid = IM_SPOT.x + IM_SPOT.w / 2;

    /* the rows: each appears as its algorithm is named, and only the one being
       talked about is lit */
    var rowAt = [cRec, cSum, cSea, cRobo], pillAt = [cIng, cTwo, cType, cProg];
    var dimAll = imPast(t, cNot);
    for (var k = 0; k < 4; k++) {
      var nextAt = k < 3 ? rowAt[k + 1] : cNot;
      out += imAlgoRow(k, on(t, rowAt[k], 0.45), popIn(t, pillAt[k], 0.4),
        !dimAll && imPast(t, rowAt[k]) && !imPast(t, nextAt));
    }
    /* before any of them, four empty slots, so the shape of the page is there */
    var pre = on(t, cInput, 0.5) * (1 - on(t, cRec, 0.4));
    if (pre > 0) for (var s = 0; s < 4; s++)
      out += G(R(IM_ROW.x, imRowY(s), IM_ROW.w, IM_ROW.h, 20, P.card, P.line, 2, { "stroke-dasharray": "10 8" }), { opacity: pre });

    /* the spotlight, one input at a time */
    var pIntro = (1 - on(t, cRec, 0.5));
    var pRec = on(t, cRec, 0.5) * (1 - on(t, cSum, 0.5));
    var pSum = on(t, cSum, 0.5) * (1 - on(t, cSea, 0.5));
    var pSea = on(t, cSea, 0.5) * (1 - on(t, cRobo, 0.5));
    var pRobo = on(t, cRobo, 0.5) * (1 - on(t, cNot, 0.5));
    var pNot = on(t, cNot, 0.5);

    out += imSpotBox(
      /* the idea itself */
      G(MK.pic(mid, 190, 132, "\u{1F4E5}") +
        Tx(mid, 300, "what it is given to work on", "lab mid muted readable", "middle", { opacity: n2(on(t, cWork, 0.5)) }),
        { opacity: pIntro * Math.min(1, popIn(t, cInput, 0.45)) }) +
      /* the recipe: the kit's own cake scene, given the ingredients */
      imCake(imPast(t, cIng) ? 1 + tally(t, cIng, 2, 0.8) : imPast(t, cRec) ? 1 : 0, pRec) +
      /* adding: the lesson's own two numbers, 3 and 4 */
      G(imTile(mid - 88, 215, 96, "3", popIn(t, cTwo, 0.4), IM_IN) +
        Tx(mid, 232, "+", "lab", "middle", { fill: P.muted, "font-size": 46, opacity: on(t, cNums, 0.4) }) +
        imTile(mid + 88, 215, 96, "4", popIn(t, cTwo == null ? null : cTwo + 0.25, 0.4), IM_IN) +
        MK.ripple(mid - 88, 215, t, cNums, IM_IN) +
        MK.ripple(mid + 88, 215, t, cNums == null ? null : cNums + 0.2, IM_IN), { opacity: pSum }) +
      /* the search: the word the lesson types */
      G(R(IM_SPOT.x + 28, 178, IM_SPOT.w - 56, 76, 22, P.cell, IM_IN, 3) +
        Em(IM_SPOT.x + 66, 216, 34, "\u{1F50D}") +
        Tx(IM_SPOT.x + 98, 228, "lions".slice(0, tally(t, cWord, 5, 0.7)), "lab big", "start", { fill: IM_IN }),
        { opacity: pSea * on(t, cType, 0.4) }) +
      /* Robo: the kit's own command arrows */
      G(["F", "R", "F", "L"].map(function (cmd, n) {
        var cx = mid - 132 + n * 88;
        return imTile(cx, 215, 74, ART.robo.CMD[cmd].icon, popIn(t, cProg == null ? null : cProg + n * 0.18, 0.35), IM_IN);
      }).join(""), { opacity: pRobo }) +
      /* not a step */
      G(R(IM_SPOT.x + 10, 96, IM_SPOT.w - 20, 112, 20, P.cell, IM_OUT_COL, 3) +
        Tx(IM_SPOT.x + 34, 140, "the ingredients", "lab", "start") +
        Tx(IM_SPOT.x + 34, 176, "the input", "lab mid", "start", { fill: IM_OUT_COL }) +
        MK.tick(IM_SPOT.x + IM_SPOT.w - 56, 152, 28, popIn(t, cWorkOn, 0.4)) +
        R(IM_SPOT.x + 10, 240, IM_SPOT.w - 20, 112, 20, P.cell, P.bad, 3) +
        Tx(IM_SPOT.x + 34, 284, "mix it", "lab", "start") +
        Tx(IM_SPOT.x + 34, 320, "a step", "lab mid", "start", { fill: P.bad }) +
        MK.cross(IM_SPOT.x + IM_SPOT.w - 56, 296, 28, popIn(t, cNot == null ? null : cNot + 0.3, 0.4)),
        { opacity: pNot }),
      on(t, cInput, 0.5));

    out += Tx(mid, 50, "the input", "lab big", "middle", { fill: IM_IN, opacity: on(t, cInput, 0.5) });
    return svg(out);
  }
