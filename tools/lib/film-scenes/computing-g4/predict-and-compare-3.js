  /* ==== Grade 4 Computing, Lesson 2: Predict and Compare, part 3 ==============
     tools/lib/film-scenes/computing-g4/predict-and-compare-3.js. The chapters
     "Compare and contrast" and "The purpose decides".

     The three routes, their steps and their facts are the lesson's own
     (content/lesson-2.py, the "compare" step). The two rounds the lesson
     COMPUTES - fewest steps and fastest - are decided here by the kit's own
     ART.algo.best, so the card this film ticks is the card the lesson ticks;
     the other two rounds are the lesson's judged answers, named below. */

  var PC_ALGOS = [
    { id: "cut", name: "The short cut", pic: "\u{1F333}",
      steps: ["Leave the house", "Cross the park", "Through the gap in the hedge", "In at the side gate"],
      facts: { minutes: 12, note: "muddy when wet" } },
    { id: "bus", name: "The bus", pic: "\u{1F68C}",
      steps: ["Leave the house", "Walk to the stop", "Wait for the bus", "Ride three stops", "Get off", "Cross at the lights"],
      facts: { minutes: 8, note: "warm and dry; costs money" } },
    { id: "road", name: "The main road", pic: "\u{1F6E3}️",
      steps: ["Leave the house", "Walk to the corner", "Along the main road", "Cross at the lights", "In at the front gate"],
      facts: { minutes: 15, note: "free, no mud, busy road" } }
  ];
  /* the kit decides the two computable rounds, exactly as the lesson does */
  var PC_BEST_FEWEST = ART.algo.best(PC_ALGOS, { kind: "fewest_steps" });
  var PC_BEST_FASTEST = ART.algo.best(PC_ALGOS, { kind: "fastest" });

  var PC_CARD = { y: 60, h: 346, w: 360, gap: 20, x0: 24 };
  function pcCardX(k) { return PC_CARD.x0 + k * (PC_CARD.w + PC_CARD.gap); }

  /* One route card, in the lesson's own shape: its name and picture, its
     steps, then "N steps - M minutes" and its note. opt: {o, lit, dim,
     stepsO, minsO, noteO, flash ("steps"|"mins")} */
  function pcAlgoCard(a, x, y, w, h, opt) {
    opt = opt || {};
    var o = opt.o == null ? 1 : opt.o;
    if (!(o > 0)) return "";
    var col = opt.lit ? P.gold : P.line;
    var out = R(x, y, w, h, 22, opt.lit ? "#20374A" : P.card, col, opt.lit ? 4 : 2) +
      Em(x + 36, y + 34, 36, a.pic) +
      Tx(x + 66, y + 44, a.name, "lab big", "start");
    a.steps.forEach(function (s, k) {
      out += C(x + 30, y + 72 + k * 26, 4, P.muted, null, null, { opacity: 0.8 });
      out += Tx(x + 44, y + 78 + k * 26, s, "lab mid muted", "start");
    });
    out += L(x + 22, y + 286, x + w - 22, y + 286, P.line, 2);
    out += Tx(x + 26, y + 312, a.steps.length + " steps", "lab", "start",
      { "font-size": 22, fill: P.ink, opacity: opt.stepsO == null ? 1 : clamp(opt.stepsO, 0, 1) });
    out += Tx(x + 150, y + 312, "· " + a.facts.minutes + " minutes", "lab", "start",
      { "font-size": 22, fill: P.ink, opacity: opt.minsO == null ? 1 : clamp(opt.minsO, 0, 1) });
    out += Tx(x + 26, y + 338, a.facts.note, "lab mid", "start",
      { fill: P.gold, opacity: opt.noteO == null ? 1 : clamp(opt.noteO, 0, 1) });
    if (opt.flashSteps > 0) out += R(x + 20, y + 292, 118, 30, 8, "none", P.gold, 3, { opacity: opt.flashSteps });
    if (opt.flashMins > 0) out += R(x + 144, y + 292, 176, 30, 8, "none", P.gold, 3, { opacity: opt.flashMins });
    return G(out, { opacity: clamp(o, 0, 1) * (opt.dim ? 0.45 : 1) });
  }

  /* ==== chapter: compare and contrast ============================================
     Three algorithms for one task, each read out with its facts, then the four
     things the lesson compares them on - steps, time, cost, outcome - and what
     comparing and contrasting each mean. */
  var PC_THINGS = [
    { pic: "\u{1F522}", at: "steps", label: "how many steps" },
    { pic: "⏱️", at: "time", label: "how long it takes" },
    { pic: "\u{1F4B7}", at: "cost", label: "what it costs" },
    { pic: "\u{1F3AF}", at: "outcome", label: "the outcome" }
  ];

  function pcCompareCards(scene, t) {
    var cThree = sc(scene, 0, "three"), cTask = sc(scene, 0, "task"), cSchool = sc(scene, 0, "school");
    var at = [
      { c: sc(scene, 1, "cut"), s: sc(scene, 1, "steps"), m: sc(scene, 1, "mins"), n: sc(scene, 1, "mud") },
      { c: sc(scene, 2, "bus"), s: sc(scene, 2, "steps"), m: sc(scene, 2, "mins"), n: sc(scene, 2, "cost") },
      { c: sc(scene, 3, "road"), s: sc(scene, 3, "steps"), m: sc(scene, 3, "mins"), n: sc(scene, 3, "free") }
    ];
    var out = "", live = -1;
    at.forEach(function (a, k) { if (pcPast(t, a.c)) live = k; });
    out += MK.pill(584, 34, "The task: get from home to school", on(t, cTask, 0.5), { size: 22, col: P.line, ink: P.muted });
    out += MK.pop(Em(824, 34, 32, "\u{1F3EB}"), 824, 34, popIn(t, cSchool, 0.4));
    PC_ALGOS.forEach(function (a, k) {
      out += pcAlgoCard(a, pcCardX(k), PC_CARD.y, PC_CARD.w, PC_CARD.h, {
        o: popIn(t, cThree == null ? null : cThree + k * 0.22, 0.45),
        lit: live === k, dim: live >= 0 && live !== k,
        stepsO: on(t, at[k].s, 0.4), minsO: on(t, at[k].m, 0.4), noteO: on(t, at[k].n, 0.4),
        flashSteps: bump(t, at[k].s, 1.2), flashMins: bump(t, at[k].m, 1.2)
      });
    });
    return out;
  }

  /* the four things to compare on, and what the two words mean */
  function pcCompareThings(scene, t) {
    var cFour = sc(scene, 4, "four");
    var cSame = sc(scene, 5, "same"), cDiff = sc(scene, 5, "diff");
    var out = "", w = 268, pitch = 286;
    out += MK.pill(584, 26, "Compare them on four things", on(t, cFour, 0.5), { size: 22, col: P.plum, ink: P.plum });
    PC_THINGS.forEach(function (th, k) {
      var p = popIn(t, sc(scene, 4, th.at), 0.42), x = 20 + k * pitch;
      if (!(p > 0)) { out += R(x, 58, w, 148, 20, P.card, P.line, 2, { opacity: 0.4 }); return; }
      out += G(R(x, 58, w, 148, 20, "#25324A", P.plum, 3) + Em(x + w / 2, 112, 52, th.pic) +
        Tx(x + w / 2, 176, th.label, "lab mid", "middle"),
        { transform: around(x + w / 2, 132, Math.min(1.06, p)), opacity: Math.min(1, p) });
    });
    var a = on(t, cSame, 0.5), b = on(t, cDiff, 0.5);
    if (a > 0) out += G(R(40, 234, 520, 172, 20, P.card, P.good, 3) +
      Tx(300, 288, "Comparing: what is the same", "lab", "middle", { "font-size": 24, fill: P.good }) +
      Tx(300, 340, "all three get you to school", "lab big", "middle"), { opacity: a });
    if (b > 0) out += G(R(608, 234, 520, 172, 20, P.card, P.accent, 3) +
      Tx(868, 288, "Contrasting: what is different", "lab", "middle", { "font-size": 24, fill: P.accent }) +
      Tx(868, 340, "steps, time, cost, mud", "lab big", "middle"), { opacity: b });
    return out;
  }

  function pcCompareChapter(scene, beat, t, i) {
    var u = into(t, scene.first + 4), out = "";
    if (u < 1) out += G(pcCompareCards(scene, t), { opacity: 1 - u });
    if (u > 0) out += G(pcCompareThings(scene, t), { opacity: u });
    return svg(out);
  }

  /* ==== chapter: the purpose decides =============================================
     One purpose at a time in the band at the top, and the card that suits it
     lighting under it. The short cut wins once, the bus twice and the main
     road once - which is the lesson's point: the purpose changes the answer. */
  var PC_SMALL = { y: 132, h: 252, w: 340, gap: 34, x0: 40 };
  function pcSmallX(k) { return PC_SMALL.x0 + k * (PC_SMALL.w + PC_SMALL.gap); }

  function pcPurposeCard(a, x, y, w, h, lit, o, ticks) {
    if (!(o > 0)) return "";
    var out = R(x, y, w, h, 22, lit ? "#1D3D33" : P.card, lit ? P.good : P.line, lit ? 4 : 2) +
      Em(x + w / 2, y + 70, 60, a.pic) +
      Tx(x + w / 2, y + 140, a.name, "lab big", "middle") +
      Tx(x + w / 2, y + 182, a.steps.length + " steps · " + a.facts.minutes + " minutes", "lab mid muted", "middle") +
      Tx(x + w / 2, y + 216, a.facts.note, "lab mid", "middle", { fill: P.gold });
    ticks.forEach(function (p, k) { out += MK.tick(x + w - 34 - k * 48, y + 30, 20, p); });
    return G(out, { opacity: clamp(o, 0, 1) * (lit ? 1 : 0.64) });
  }

  function pcPurposeChapter(scene, beat, t, i) {
    var cNobest = sc(scene, 0, "nobest"), cDecides = sc(scene, 0, "decides");
    var cFew = sc(scene, 1, "few"), cCut = sc(scene, 1, "cut");
    var cQuick = sc(scene, 2, "quick"), cDry = sc(scene, 2, "dry"), cAgain = sc(scene, 2, "again");
    var cMoney = sc(scene, 3, "money"), cRoad = sc(scene, 3, "road"), cRead = sc(scene, 3, "read");
    var out = "";

    /* The band: ONE purpose at a time, and only one. It used to fade the last
       one out while the next faded in, and for about a third of a second the
       two sentences sat on the same baseline and read as one jammed-up string
       ("stayingdryand no mud", found in the purpose sample sheet). So the
       purpose being read is the LAST one whose cue has passed, and it fades in
       alone; the band is briefly empty between them, which is legible. */
    var band = on(t, cDecides, 0.5);
    var says = [[cFew, "the fewest steps to remember"], [cQuick, "getting there quickest"],
      [cDry, "staying dry"], [cMoney, "no money and no mud"]];
    if (band > 0) {
      var glow = 0.85 + 0.15 * (pcPast(t, cRead) ? breathe(t) : 1);
      out += G(R(140, 22, 888, 76, 22, "rgba(244,201,93,0.10)", P.gold, 4, { "stroke-opacity": glow }) +
        Tx(168, 70, "Purpose:", "lab", "start", { "font-size": 24, fill: P.gold }), { opacity: band });
      var said = -1;
      says.forEach(function (s, k) { if (pcPast(t, s[0])) said = k; });
      if (said >= 0) {
        var o = on(t, says[said][0], 0.3);
        if (o > 0) out += Tx(300, 70, says[said][1], "lab", "start", { "font-size": 28, opacity: o });
      }
    }
    /* no best algorithm on its own: a question over the empty band */
    out += MK.qmark(584, 60, 30, on(t, cNobest, 0.45) * (1 - on(t, cDecides, 0.45)));

    /* which card suits the purpose being read, and the ticks it has won.
       Once the "no money and no mud" label is read (cMoney) the winner goes
       neutral until its own card cue (cRoad) fires - the same neutral gap
       the FIRST purpose gets for free, because nothing has been ticked yet
       when its label is read. Without this, the road purpose's label change
       carries the still-ticked "bus" card over from "staying dry", showing
       the explicitly wrong answer for 1.6s (found in review). */
    var winner = pcPast(t, cRoad) ? "road" : pcPast(t, cMoney) ? null : pcPast(t, cQuick) ? PC_BEST_FASTEST : pcPast(t, cCut) ? PC_BEST_FEWEST : null;
    var ticks = {
      cut: [popIn(t, cCut, 0.4)],
      bus: [popIn(t, cQuick == null ? null : cQuick + 0.55, 0.4), popIn(t, cAgain, 0.4)],
      road: [popIn(t, cRoad, 0.4)]
    };
    PC_ALGOS.forEach(function (a, k) {
      out += pcPurposeCard(a, pcSmallX(k), PC_SMALL.y, PC_SMALL.w, PC_SMALL.h,
        winner === a.id, popIn(t, cNobest == null ? null : cNobest + k * 0.2, 0.45), ticks[a.id] || []);
    });
    /* read the purpose every time: a line up the gap between the cards, so it
       crosses nothing, from the reminder under them to the band itself */
    var read = on(t, cRead, 0.55);
    if (read > 0) {
      out += MK.leader(396, 396, 396, 100, read, P.gold);
      out += MK.pill(584, 414, "read this first, every time", read, { size: 22, col: P.gold, ink: P.gold });
    }
    return svg(out);
  }
