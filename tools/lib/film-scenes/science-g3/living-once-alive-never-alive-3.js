  /* ==== chapter: never alive ======================================================
     The four things the lesson's own sort calls never alive - a stone, a metal
     spoon, a drinking glass and a plastic cup - and then its three bins, with
     the lesson's own answer to the misconception it names: wood and paper come
     from trees, so they go in "Once alive", not in "Never alive". */

  var LO_NEVER = [
    { x: 56, cue: "stone", pic: "\u{1FAA8}", cap: "a stone" },
    { x: 340, cue: "spoon", pic: "\u{1F944}", cap: "a metal spoon" },
    { x: 624, cue: "glass", pic: null, cap: "a drinking glass" },
    { x: 908, cue: "cup", pic: "\u{1F964}", cap: "a plastic cup" }
  ];
  var LO_NOT = [
    { cx: 190, word: "ate", cue: "ate" },
    { cx: 450, word: "grew", cue: "grew" },
    { cx: 710, word: "moved", cue: "moved" },
    { cx: 990, word: "had young", cue: "young" }
  ];
  var LO_BINS = [
    { x: 48, label: "Living", pic: "\u{1F331}", col: "good" },
    { x: 414, label: "Once alive", pic: "\u{1FAB5}", col: "gold" },
    { x: 780, label: "Never alive", pic: "\u{1F529}", col: "blue" }
  ];

  function loNeverThings(scene, t) {
    var out = "";
    LO_NEVER.forEach(function (o, k) {
      var p = popIn(t, sc(scene, 0, o.cue), 0.42);
      if (p <= 0) return;
      var cx = o.x + 125;
      out += G(R(o.x, 46, 250, 210, 20, "#1B3A52", P.line, 3) +
        MK.pic(cx, 132, 94, o.pic || LO_GLASS) +
        Tx(cx, 224, o.cap, "lab mid muted", "middle"),
        { transform: around(cx, 150, Math.min(1.04, p)), opacity: Math.min(1, p) });
    });
    /* none of them ever did any of the four life processes */
    LO_NOT.forEach(function (n) {
      var at = sc(scene, 1, n.cue), o = on(t, at, 0.4);
      if (o <= 0) return;
      out += MK.cross(n.cx - 80, 340, 22, popIn(t, at, 0.35));
      out += Tx(n.cx - 48, 351, n.word, "lab big", "start", { opacity: o });
    });
    return out;
  }

  function loNeverBins(scene, t) {
    var cNever = sc(scene, 2, "never"), cThree = sc(scene, 2, "three"), cTwo = sc(scene, 2, "two");
    var cAsk = sc(scene, 3, "ask"), cWood = sc(scene, 3, "wood"), cTrees = sc(scene, 3, "trees");
    var out = "";
    /* All three bins stand there from the moment the objects give way to them -
       a blank stage between the two halves reads as a picture that failed. The
       never-alive bin lights first, as it is named, then the other two. */
    var ats = [cThree, cThree == null ? null : cThree + 0.22, cNever];
    LO_BINS.forEach(function (b, k) {
      var p = popIn(t, ats[k], 0.42), lit = p > 0;
      var col = lit ? (b.col === "good" ? P.good : b.col === "gold" ? P.gold : P.blue) : P.line;
      var cx = b.x + 170, m = "";
      m += R(b.x, 60, 340, 280, 22, lit ? "#1B3A52" : P.card, col, lit ? 3 : 2);
      m += MK.pic(cx, 142, 86, b.pic);
      m += Tx(cx, 234, b.label, "lab big", "middle", { fill: lit ? P.ink : P.muted });
      out += G(m, { transform: around(cx, 180, lit ? Math.min(1.06, p) : 0.96), opacity: lit ? Math.min(1, p) : 0.5 });
    });
    /* the four things drop into the never-alive bin as it appears */
    var nIn = tally(t, cNever == null ? null : cNever + 0.3, 4, 0.8);
    for (var k = 0; k < nIn; k++) {
      out += MK.pop(MK.pic(840 + k * 60, 296, 46, LO_NEVER[k].pic || LO_GLASS), 840 + k * 60, 296,
        popIn(t, cNever == null ? null : cNever + 0.3 + k * 0.2, 0.32));
    }
    /* three groups, not two: the bins are numbered as it is said */
    LO_BINS.forEach(function (b, k) {
      var np = popIn(t, cTwo == null ? null : cTwo + k * 0.16, 0.32);
      if (np <= 0) return;
      out += MK.pop(C(b.x + 30, 90, 19, P.gold) + Tx(b.x + 30, 98, String(k + 1), "lab dark", "middle", { "font-size": 24 }),
        b.x + 30, 90, np);
    });
    /* ask where it came from: wood and paper go to "once alive" */
    out += MK.pill(250, 390, "Where did it come from?", on(t, cAsk, 0.45), { size: 25, col: P.gold });
    /* The wood and the book start on the floor under the "once alive" bin,
       never under "living", and rise straight up into it as they are named -
       the move is over before "come from trees" is said. */
    var u = on(t, cWood == null ? null : cWood + 0.1, 0.8);
    var pw = popIn(t, cWood, 0.4), pb = popIn(t, cWood == null ? null : cWood + 0.22, 0.4);
    var wy = lerp(384, 296, u), wz = lerp(56, 46, u);
    if (pw > 0) out += MK.pop(MK.pic(500, wy, wz, LO.wood), 500, wy, Math.min(1.08, pw));
    if (pb > 0) out += MK.pop(MK.pic(576, wy, wz, LO.book), 576, wy, Math.min(1.08, pb));
    /* The tree they came from stands on the floor OUTSIDE every bin and is
       named as living. The lesson's own sort puts an oak tree in the LIVING
       bin ("A tree takes in food, grows and makes acorns. Living."), so a tree
       inside "Once alive", at the size of the wood and the book, would teach
       the opposite. The arrow is the green of the living bin and runs from the
       tree to the wood and the paper it made. */
    var pt = popIn(t, cTrees, 0.4);
    if (pt > 0) {
      out += MK.pop(MK.pic(700, 380, 62, LO.tree), 700, 380, Math.min(1.08, pt));
      out += Tx(700, 432, "a living tree", "lab mid good", "middle", { opacity: Math.min(1, pt) });
    }
    out += MK.arrow(660, 366, 602, 330, on(t, cTrees == null ? null : cTrees + 0.3, 0.45), P.good, 6);
    return out;
  }

  function loNeverChapter(scene, beat, t, i) {
    var swap = into(t, scene.first + 2);
    var out = "";
    if (swap < 1) out += G(loNeverThings(scene, t), { opacity: 1 - swap });
    if (swap > 0) out += G(loNeverBins(scene, t), { opacity: swap });
    return svg(out);
  }

  /* ==== chapter: five ways to find out ===========================================
     The lesson's own five enquiry cards, as its "Five ways to find out" step
     names and captions them, one row each. A row is numbered and empty until
     its own line; then it takes its picture, its name and the lesson's own
     caption, and the lesson's own example question opens beside it. */

  var LO_ENQ = [
    { beat: 1, cue: "research", name: "Research", sub: "look it up", pic: "\u{1F4DA}",
      ask: "How far away is the Moon?", askCue: "moon", extra: "moon" },
    { beat: 2, cue: "fair", name: "Fair test", sub: "change one thing", pic: "\u2696\uFE0F",
      ask: "Does more water make a plant grow taller?", askCue: "water", bumpCue: "one" },
    { beat: 3, cue: "time", name: "Observing over time", sub: "watch it change", pic: "\u23F3",
      ask: "How does a tadpole change each week?", askCue: "tadpole", extra: "tadpole" },
    { beat: 4, cue: "classify", name: "Identifying and classifying", sub: "sort into groups", pic: "\u{1F5C2}\uFE0F",
      askCue: "sort", extra: "bins" },
    { beat: 5, cue: "pattern", name: "Pattern seeking", sub: "look for a pattern", pic: "\u{1F4C8}",
      ask: "Do taller children have bigger feet?", askCue: "taller", extra: "children", extraCue: "feet" }
  ];

  function loEnqExtra(kind, cy, o, t) {
    if (!(o > 0)) return "";
    if (kind === "moon") return MK.pop(MK.pic(930, cy, 44, "\u{1F319}"), 930, cy, o);
    /* the kit's tadpole is a drawing with a light background of its own, so it
       is given the plate the lesson gives it rather than sat on the dark card */
    if (kind === "tadpole") return MK.pop(R(1020, cy - 26, 52, 52, 12, P.paper) + MK.pic(1046, cy, 42, LO_TADPOLE), 1046, cy, o);
    if (kind === "children") return MK.pop(MK.pic(1042, cy + 5, 40, "\u{1F9D2}") + MK.pic(1100, cy, 54, "\u{1F9D2}"), 1070, cy, o);
    if (kind === "bins") {
      var m = "";
      ["\u{1F331}", "\u{1FAB5}", "\u{1F529}"].forEach(function (p, k) {
        m += R(604 + k * 74, cy - 26, 62, 52, 12, P.cell, P.line, 2) + MK.pic(635 + k * 74, cy, 34, p);
      });
      return G(m, { opacity: Math.min(1, o) });
    }
    return "";
  }

  function loEnquiryChapter(scene, beat, t, i) {
    var cFive = sc(scene, 0, "five"), cEnq = sc(scene, 0, "enquiry"), out = "";
    /* the five empty rows are on stage from the chapter's first frame, and are
       numbered one by one as "five ways" is said */
    var appear = inAt(t, BEATS[scene.first].start - GAP, 0.6);
    if (appear <= 0) return svg("");
    LO_ENQ.forEach(function (r, k) {
      var cy = 44 + k * 80;
      var at = sc(scene, r.beat, r.cue), lit = on(t, at, 0.4);
      var next = k + 1 < LO_ENQ.length ? sc(scene, LO_ENQ[k + 1].beat, LO_ENQ[k + 1].cue) : null;
      var now = lit > 0 && on(t, next, 0.4) < 0.5;
      var flash = bump(t, cEnq == null ? null : cEnq + k * 0.12, 0.7) * (1 - lit);
      var col = lit > 0 ? (now ? P.gold : P.plum) : (flash > 0.2 ? P.plum : P.line);
      var m = R(20, cy - 36, 1128, 72, 16, lit > 0 ? "#1B3A52" : P.card, col, lit > 0 || flash > 0.2 ? 3 : 2);
      var num = on(t, cFive == null ? null : cFive + k * 0.18, 0.4) * (1 - lit);
      if (num > 0) m += Tx(66, cy + 15, String(k + 1), "lab huge muted", "middle", { opacity: num });
      if (lit > 0.02) {
        var bp = r.bumpCue ? bump(t, sc(scene, r.beat, r.bumpCue), 0.8) : 0;
        m += G(G(MK.pic(66, cy, 46, r.pic), { transform: around(66, cy, 1 + 0.16 * bp) }) +
          Tx(108, cy - 2, r.name, "lab big", "start") +
          Tx(108, cy + 24, r.sub, "lab mid muted", "start"), { opacity: Math.min(1, lit) });
      }
      var ao = on(t, sc(scene, r.beat, r.askCue), 0.45);
      if (r.ask) m += MK.pill(600, cy, r.ask, ao, { size: 19, anchor: "start", col: P.gold, fill: P.cell });
      if (r.extra) {
        var ec = r.extraCue ? sc(scene, r.beat, r.extraCue)
          : (sc(scene, r.beat, r.askCue) == null ? null : sc(scene, r.beat, r.askCue) + 0.3);
        m += loEnqExtra(r.extra, cy, r.extra === "bins" ? ao : popIn(t, ec, 0.35), t);
      }
      out += G(m, { opacity: clamp(appear * (lit > 0 ? 1 : 0.62), 0, 1) });
    });
    return svg(out);
  }
