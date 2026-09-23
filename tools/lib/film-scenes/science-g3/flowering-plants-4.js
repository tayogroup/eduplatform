  /* ==== chapters: your table, a conclusion, and the recap ========================
     tools/lib/film-scenes/science-g3/flowering-plants-4.js. The lesson's own
     record step, drawn as its table: its two columns ("Plant", "On day five"),
     its two rows (the warm plant and the cold plant, with its own ☀️ and ❄️)
     and its own two choices, "healthy and green" 🌱 and "drooping and yellow"
     🥀. The conclusion chapter keeps that table, smaller, on the left, because
     a conclusion comes from the results: the two questions a scientist asks
     are answered beside it. */

  /* the table, in its own 810 x 324 space; o says how much of it is written in */
  function fpTable(t, o) {
    var out = R(0, 0, 810, 324, 18, P.card, P.line, 2, { opacity: clamp(o.frame, 0, 1) });
    var h = clamp(o.head, 0, 1);
    out += G(L(0, 64, 810, 64, P.line, 2) + L(370, 0, 370, 324, P.line, 2) +
      Tx(24, 44, "Plant", "lab big", "start") + Tx(394, 44, "On day five", "lab big", "start"), { opacity: h });
    out += L(0, 194, 810, 194, P.line, 2, { opacity: clamp(Math.min(o.row1, o.row2), 0, 1) });
    var rows = [
      { o: o.row1, ao: o.ans1, y: 130, pic: "☀️", label: "warm plant", apic: "\u{1F331}", ans: "healthy and green" },
      { o: o.row2, ao: o.ans2, y: 260, pic: "❄️", label: "cold plant", apic: "\u{1F940}", ans: "drooping and yellow" }
    ];
    rows.forEach(function (r) {
      var ro = clamp(r.o, 0, 1);
      if (ro > 0) out += G(MK.pic(56, r.y, 56, r.pic) + Tx(104, r.y + 12, r.label, "lab big", "start"), { opacity: ro });
      var ao = clamp(r.ao, 0, 1);
      if (ao > 0) out += G(MK.pic(420, r.y, 52, r.apic) + Tx(466, r.y + 12, r.ans, "lab big", "start"), { opacity: ao });
    });
    return out;
  }
  function fpTableAt(t, o, x, y, s) {
    return G(fpTable(t, o), { transform: "translate(" + n2(x) + "," + n2(y) + ") scale(" + n3(s) + ")" });
  }
  /* how much of the table is written in, at time t: read from the record chapter */
  function fpTableState(t) {
    var s = F.scenes.filter(function (x) { return x.id === "record"; })[0];
    if (!s) return { frame: 1, head: 1, row1: 1, row2: 1, ans1: 1, ans2: 1 };
    return {
      frame: on(t, sc(s, 0, "write"), 0.5),
      head: on(t, sc(s, 0, "table"), 0.5),
      row1: on(t, sc(s, 1, "warm"), 0.45),
      row2: on(t, sc(s, 1, "cold"), 0.45),
      ans1: on(t, sc(s, 2, "healthy"), 0.45),
      ans2: on(t, sc(s, 2, "drooping"), 0.45)
    };
  }

  function fpRecordChapter(scene, beat, t, i) {
    var st = fpTableState(t), out = "";
    out += MK.pic(92, 220, 96, "\u{1F4CB}", { opacity: Math.min(1, popIn(t, sc(scene, 0, "write"), 0.45) * fpOnly(t, scene, 0)) });
    out += fpTableAt(t, st, 179, 58, 1);
    /* each answer, as it is said, is ringed in its own cell */
    out += R(179 + 372, 58 + 68, 434, 122, 14, "none", P.good, 3, { opacity: bump(t, sc(scene, 2, "healthy"), 1.6) });
    out += R(179 + 372, 58 + 198, 434, 122, 14, "none", P.gold, 3, { opacity: bump(t, sc(scene, 2, "drooping"), 1.6) });
    return svg(out);
  }

  /* ---- a conclusion -------------------------------------------------------------
     The table stays on the left, smaller; the two questions a scientist asks
     are answered on the right, one picture each. */
  function fpQpair(t, scene) {
    var cTwo = sc(scene, 0, "two"), cRes = sc(scene, 0, "results"), out = "";
    [0, 1].forEach(function (n) {
      var p = popIn(t, cTwo == null ? null : cTwo + n * 0.3, 0.4);
      if (p <= 0) return;
      var y = 110 + n * 150;
      out += G(C(606, y, 36, P.cell, P.line, 3) + Tx(606, y + 14, String(n + 1), "lab huge", "middle", { fill: P.muted }) +
        R(662, y - 42, 470, 84, 18, "none", P.line, 3, { "stroke-dasharray": "14 10" }),
        { transform: around(894, y, Math.min(p, 1.1)), opacity: Math.min(1, p) });
    });
    out += Tx(662, 372, "two questions about the results", "lab big muted", "start", { opacity: on(t, cRes, 0.5) });
    return out;
  }
  function fpQ1(t, scene) {
    var cFirst = sc(scene, 1, "first"), cSupport = sc(scene, 1, "support"),
      cPred = sc(scene, 2, "predicted"), cDid = sc(scene, 2, "did"), out = "";
    var a = on(t, cFirst, 0.5);
    out += R(560, 86, 590, 200, 22, "#1B3A52", P.gold, 3, { opacity: a });
    out += G(C(606, 132, 26, P.card, P.gold, 3) + Tx(606, 142, "1", "lab big", "middle", { fill: P.gold }), { opacity: a });
    out += Tx(646, 142, "Question 1", "lab big gold", "start", { opacity: a });
    var b = on(t, cSupport, 0.5);
    out += Tx(584, 202, "Did the results support", "lab big", "start", { opacity: b });
    out += Tx(584, 248, "my prediction?", "lab big", "start", { opacity: b });
    out += MK.pill(560, 348, "it will stop growing and droop", on(t, cPred, 0.45), { size: 22, anchor: "start", col: P.plum });
    out += MK.tick(996, 348, 26, popIn(t, cDid, 0.4));
    out += Tx(1034, 358, "it did", "lab big good", "start", { opacity: on(t, cDid, 0.45) });
    return out;
  }
  function fpQ2(t, scene) {
    var cSecond = sc(scene, 3, "second"), cTell = sc(scene, 3, "tell"), cConc = sc(scene, 3, "conclusion"),
      cTemp = sc(scene, 4, "temperature"), cWL = sc(scene, 4, "waterlight"), out = "";
    var a = on(t, cSecond, 0.5);
    out += R(560, 56, 590, 156, 22, "#1B3A52", P.gold, 3, { opacity: a });
    out += G(C(606, 100, 26, P.card, P.gold, 3) + Tx(606, 110, "2", "lab big", "middle", { fill: P.gold }), { opacity: a });
    out += Tx(646, 110, "Question 2", "lab big gold", "start", { opacity: a });
    out += Tx(584, 170, "What do the results tell you?", "lab big", "start", { opacity: on(t, cTell, 0.5) });
    out += MK.pill(560, 254, "a conclusion", on(t, cConc, 0.45), { size: 26, anchor: "start", col: P.gold, fill: "#3A2E17" });
    /* the lesson's own conclusion */
    var d = on(t, cTemp, 0.5);
    out += R(560, 288, 590, 132, 20, P.card, P.good, 3, { opacity: d });
    out += Tx(584, 340, "A plant needs water, light", "lab big", "start", { opacity: d });
    out += Tx(584, 384, "and the right temperature.", "lab big", "start", { opacity: on(t, cTemp, 0.6) });
    out += MK.pic(1090, 312, 40, "\u{1F4A7}", { opacity: Math.min(1, popIn(t, cWL, 0.35)) });
    out += MK.pic(1090, 352, 40, "☀️", { opacity: Math.min(1, popIn(t, cWL == null ? null : cWL + 0.18, 0.35)) });
    out += MK.pic(1090, 392, 40, "\u{1F321}️", { opacity: Math.min(1, popIn(t, cTemp == null ? null : cTemp + 0.18, 0.35)) });
    return out;
  }

  function fpConcludeChapter(scene, beat, t, i) {
    var k = i - scene.first, out = fpTableAt(t, fpTableState(t), 22, 124, 0.62);
    out += Tx(22, 104, "your results", "lab mid muted readable", "start");
    var toQ1 = k >= 1 ? into(t, scene.first + 1) : 0, toQ2 = k >= 3 ? into(t, scene.first + 3) : 0;
    if (toQ1 < 1) out += G(fpQpair(t, scene), { opacity: 1 - toQ1 });
    if (toQ1 > 0 && toQ2 < 1) out += G(fpQ1(t, scene), { opacity: toQ1 * (1 - toQ2) });
    if (toQ2 > 0) out += G(fpQ2(t, scene), { opacity: toQ2 });
    /* the results are what both answers come from */
    out += MK.leader(530, 250, 560, 196, on(t, sc(scene, 1, "support"), 0.6) * toQ1 * (1 - toQ2), P.gold);
    out += MK.leader(530, 250, 560, 156, on(t, sc(scene, 3, "tell"), 0.6) * toQ2, P.gold);
    return svg(out);
  }

  /* ---- what you now know ----------------------------------------------------------- */
  var FP_RECAP = MK.recapKind([
    { beat: 0, at: "roots", title: "Roots", sub: "anchor, take in water", pic: ART.ICONS.roots },
    { beat: 0, at: "stem", title: "Stem", sub: "holds up, carries water", pic: "\u{1F331}" },
    { beat: 1, at: "leaves", title: "Leaves", sub: "make food from light", pic: "\u{1F343}" },
    { beat: 1, at: "flower", title: "Flower", sub: "makes seeds", pic: "\u{1F33C}" },
    { beat: 2, at: "needs", title: "What a plant needs", sub: "water, light, the right warmth",
      pic: function (cx, cy, size) {
        return Em(cx - size * 0.62, cy, size * 0.6, "\u{1F4A7}") + Em(cx, cy, size * 0.6, "☀️") + Em(cx + size * 0.62, cy, size * 0.6, "\u{1F321}️");
      } },
    { beat: 3, at: "predicted", title: "Like a scientist", sub: "predict, test, record, conclude", pic: "\u{1F4DD}" }
  ], { goBeat: 3, goAt: "concluded" });

  var KINDS = {
    title: MK.titleKind({ sub: ["What the roots, stem and leaves do", "A warm plant and a cold plant", "Your table, and your conclusion"] }),
    parts: fpPartsChapter, warmcold: fpWarmChapter, fairtest: fpFairChapter,
    record: fpRecordChapter, conclude: fpConcludeChapter, recap: FP_RECAP
  };
