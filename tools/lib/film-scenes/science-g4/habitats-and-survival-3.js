  /* ==== Habitats and Survival, part 3 =========================================
     The chapters "A question you can test" and "Science near you".
     See habitats-and-survival.js for what this film draws and why. */

  /* ==== chapter: a question you can test =======================================
     The ask step's own two questions, in its own words, and then its own way
     of answering the good one: count under a damp patch and a dry patch of the
     same size, at the same time. The woodlouse is the kit's drawing, which is
     the picture the lesson shows for it. */

  /* ---- view A: what makes a question one you can investigate ------------------- */
  var HS_WAYS = [
    { cue: "observe", word: "observing", pic: "\u{1F440}" },
    { cue: "count", word: "counting", pic: null },
    { cue: "test", word: "testing", pic: "\u{1F52C}" }
  ];
  function hsWays(scene, t, o) {
    if (!(o > 0)) return "";
    var cQ = sc(scene, 0, "question"), out = "";
    var qo = popIn(t, cQ, 0.5);
    out += MK.pop(C(188, 210, 78, P.cell, P.plum, 4) + Tx(188, 238, "?", "lab huge", "middle", { "font-size": 96, fill: P.plum }), 188, 210, qo);
    out += MK.pill(188, 336, "a question", qo, { size: 26, col: P.plum });
    HS_WAYS.forEach(function (w, k) {
      var at = sc(scene, 0, w.cue), p = popIn(t, at, 0.45);
      if (p <= 0) return;
      var x = 448 + k * 232, y = 120;
      out += MK.arrow(276, 210, x - 16, y + 96, on(t, at, 0.5), P.plum, 6);
      out += G(R(x, y, 194, 192, 18, P.card, P.plum, 3) +
        (w.pic ? MK.pic(x + 97, y + 76, 76, w.pic) :
          Tx(x + 97, y + 94, "1 2 3", "lab huge", "middle", { fill: P.gold })) +
        Tx(x + 97, y + 158, w.word, "lab big", "middle"),
        { opacity: Math.min(1, p), transform: around(x + 97, y + 96, Math.min(1.05, p)) });
    });
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* ---- view B: the two questions ----------------------------------------------- */
  function hsQuestionCards(scene, t, o) {
    if (!(o > 0)) return "";
    var cHappy = sc(scene, 1, "happy"), cCannot = sc(scene, 1, "cannot");
    var cDamp = sc(scene, 2, "damp"), cCount = sc(scene, 2, "count");
    var out = "", x = 404, w = 700;
    out += MK.pic(206, 218, 224, ART.ICONS.woodlouse);
    out += Tx(206, 366, "a woodlouse", "lab big muted", "middle");

    var a = popIn(t, cHappy, 0.45);
    if (a > 0) {
      out += G(R(x, 96, w, 124, 20, P.card, P.bad, 3) +
        Tx(x + 34, 172, "Are woodlice happy?", "lab big", "start"),
        { opacity: Math.min(1, a), transform: around(x + w / 2, 158, Math.min(1.03, a)) });
      out += MK.cross(x + w - 58, 158, 30, popIn(t, cCannot, 0.4));
    }
    var b = popIn(t, cDamp, 0.45);
    if (b > 0) {
      out += G(R(x, 258, w, 124, 20, P.card, P.good, 3) +
        Tx(x + 34, 320, "More woodlice in damp than dry?", "lab big", "start"),
        { opacity: Math.min(1, b), transform: around(x + w / 2, 320, Math.min(1.03, b)) });
      out += MK.tick(x + w - 58, 320, 30, popIn(t, cCount, 0.4));
    }
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* ---- view C: the count, and why it is fair ------------------------------------ */
  var HS_PATCH = { w: 272, h: 136, y: 152, a: 70, b: 378 };
  /* woodlice under a patch: a fixed arrangement, never scattered at random */
  var HS_LICE = [[0.22, 0.30], [0.52, 0.22], [0.78, 0.34], [0.34, 0.58], [0.64, 0.62], [0.18, 0.74], [0.82, 0.76]];
  function hsPatch(t, x, damp, lift, n, o) {
    if (!(o > 0)) return "";
    var y = HS_PATCH.y, w = HS_PATCH.w, h = HS_PATCH.h, out = "";
    out += R(x, y, w, h, 14, damp ? "#3C4A33" : "#C7B189", damp ? "#5E7550" : "#9C8A68", 3);
    for (var k = 0; k < n && k < HS_LICE.length; k++) {
      out += G(MK.pic(x + HS_LICE[k][0] * w, y + 20 + HS_LICE[k][1] * (h - 36), 52, ART.ICONS.woodlouse), { opacity: clamp(lift, 0, 1) });
    }
    if (damp) {
      for (var j = 0; j < 4; j++) {
        var dx = x + 34 + j * (w - 68) / 3, dy = y + 12 + 5 * Math.sin(t * 2 + j);
        out += C(dx, dy, 6, "#7FC4EA", null, null, { opacity: 0.8 });
      }
    }
    /* the flat piece of wood, lifted off the patch */
    out += G(MK.pic(x + w / 2, y - 34 - 52 * lift, 120, ART.ICONS.wood), { opacity: 1 });
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  function hsFairView(scene, t, o) {
    if (!(o > 0)) return "";
    var cDamp = sc(scene, 3, "damp"), cDry = sc(scene, 3, "dry"), cSize = sc(scene, 3, "size"), cTime = sc(scene, 3, "time");
    var cOnly = sc(scene, 4, "only"), cFair = sc(scene, 4, "fair");
    var y = HS_PATCH.y, w = HS_PATCH.w, h = HS_PATCH.h, out = "";
    var la = on(t, cDamp, 0.7), lb = on(t, cDry, 0.7);

    var there = into(t, scene.first + 3);
    out += hsPatch(t, HS_PATCH.a, true, la, 7, there);
    out += hsPatch(t, HS_PATCH.b, false, lb, 2, there);
    out += G(Tx(HS_PATCH.a + w / 2, y + h + 38, "damp", "lab big", "middle", { fill: P.blue }), { opacity: on(t, cDamp, 0.4) });
    out += G(Tx(HS_PATCH.b + w / 2, y + h + 38, "dry", "lab big", "middle", { fill: P.gold }), { opacity: on(t, cDry, 0.4) });

    /* the same size: one measure under each, drawn the same */
    var so = on(t, cSize, 0.5);
    if (so > 0) {
      [HS_PATCH.a, HS_PATCH.b].forEach(function (px) {
        out += L(px, y + h + 62, px + w * so, y + h + 62, P.muted, 3);
        out += L(px, y + h + 54, px, y + h + 70, P.muted, 3) + L(px + w * so, y + h + 54, px + w * so, y + h + 70, P.muted, 3, { opacity: so });
      });
      out += MK.pill(360, y + h + 100, "the same size", so, { size: 24, col: P.line });
    }
    /* at the same time: one clock over both */
    var to = popIn(t, cTime, 0.45);
    if (to > 0) {
      out += MK.pop(C(360, 72, 40, P.card, P.muted, 3) + L(360, 72, 360, 50, P.ink, 4) + L(360, 72, 376, 78, P.ink, 4), 360, 72, to);
      out += L(HS_PATCH.a + w / 2, y - 106, 318, 72, P.muted, 2, { opacity: Math.min(1, to), "stroke-dasharray": "8 7" });
      out += L(HS_PATCH.b + w / 2, y - 106, 402, 72, P.muted, 2, { opacity: Math.min(1, to), "stroke-dasharray": "8 7" });
    }

    /* only the dampness is different: the fair test, written out */
    var oo = on(t, cOnly, 0.5);
    if (oo > 0) {
      out += G(R(714, 100, 424, 244, 20, P.card, P.line, 2), { opacity: oo });
      out += MK.list(742, 156, [
        { text: "same size", at: cOnly, mark: "tick" },
        { text: "same time", at: cOnly == null ? null : cOnly + 0.35, mark: "tick" }
      ], t, { lh: 64, cls: "lab big", markR: 18 });
      /* the third row is the one thing that is NOT the same */
      var od = on(t, cOnly == null ? null : cOnly + 0.7, 0.4);
      if (od > 0) {
        out += C(760, 284, 13, P.gold, null, null, { opacity: od });
        out += Tx(794, 294, "only damp or dry", "lab big gold", "start", { opacity: od });
      }
    }
    out += MK.pill(926, 392, "a fair test", on(t, cFair, 0.4), { size: 30, col: P.good });
    out += MK.tick(790, 392, 24, popIn(t, cFair, 0.4));
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  function hsQuestionChapter(scene, beat, t, i) {
    var out = "";
    out += hsWays(scene, t, hsUntil(t, scene, 1));
    out += hsQuestionCards(scene, t, hsFrom(t, scene, 1) * hsUntil(t, scene, 3));
    out += hsFairView(scene, t, hsFrom(t, scene, 3));
    return svg(out);
  }

  /* ==== chapter: science near you ==============================================
     The context step's own four things, with its own pictures, and then the
     two it describes in most detail: the road that brings shops and cuts a
     habitat in two, and the pond dug in a park. */
  var HS_NEAR = [
    { cue: "roads", pic: "\u{1F6E3}️", label: "a new road" },
    { cue: "lights", pic: "\u{1F4A1}", label: "streetlights" },
    { cue: "recycling", pic: "♻️", label: "a recycling centre" },
    { cue: "ponds", pic: "\u{1F438}", label: "a park pond" }
  ];

  function hsAreaView(scene, t, o) {
    if (!(o > 0)) return "";
    var cArea = sc(scene, 0, "area"), cTech = sc(scene, 0, "tech"), cMake = sc(scene, 0, "make");
    var out = "", here = into(t, scene.first), ao = on(t, cArea, 0.7);
    out += G(R(584 - 404 * ao, 318, 808 * ao, 16, 8, "#3E5A44"), { opacity: Math.min(1, ao) });
    out += MK.pop(MK.pic(584, 202, 236, "\u{1F3D8}️"), 584, 202, here);
    out += MK.pill(584, 358, "technology", on(t, cTech, 0.4), { size: 32, col: P.good });
    out += MK.pill(584, 414, "things people make and use", on(t, cMake, 0.4), { size: 26, col: P.line });
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  function hsNearCards(scene, t, o) {
    if (!(o > 0)) return "";
    var cChanges = sc(scene, 1, "changes"), out = "", plates = into(t, scene.first + 1);
    HS_NEAR.forEach(function (nd, k) {
      var at = sc(scene, 1, nd.cue), p = popIn(t, at, 0.45);
      var x = hsBinX(k), cx = x + HS_BW / 2, y = 96, h = 244;
      var ch = on(t, cChanges == null ? null : cChanges + k * 0.14, 0.4);
      out += R(x, y, HS_BW, h, 20, P.card, ch > 0.4 ? P.good : P.line, ch > 0.4 ? 4 : 2, { opacity: plates });
      if (p <= 0) return;
      out += G(MK.pic(cx, y + 92, 104, nd.pic) +
        Tx(cx, y + 196, nd.label, "lab", "middle"),
        { opacity: Math.min(1, p), transform: around(cx, y + 92, Math.min(1.04, p)) });
      if (ch > 0) out += MK.arrow(cx, y + h + 10, cx, y + h + 44, ch, P.good, 6);
    });
    out += MK.pill(584, 412, "each changes the habitats nearby", on(t, cChanges, 0.5), { size: 26, col: P.good });
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* the road cuts a green habitat in two */
  function hsRoadView(scene, t, o) {
    if (!(o > 0)) return "";
    var cRoad = sc(scene, 2, "road"), cShops = sc(scene, 2, "shops"), cCuts = sc(scene, 2, "cuts");
    var x = 96, y = 104, w = 604, h = 252, out = "";
    var cut = on(t, cCuts, 0.6), road = on(t, cRoad, 0.5), gap = 10 * cut;
    var mid = y + h / 2, rh = 46;
    /* the habitat, in two halves that draw apart as the road cuts it */
    out += G(R(x, y, w, h / 2 - rh / 2 - gap, 12, "#2F6B3A", "#47895A", 2) +
      Em(x + 96, y + 62, 58, "\u{1F333}") + Em(x + 268, y + 54, 46, "\u{1F98A}") + Em(x + 452, y + 62, 54, "\u{1F333}"),
      { transform: tr(0, -gap) });
    out += G(R(x, mid + rh / 2 + gap, w, h / 2 - rh / 2 - gap, 12, "#2F6B3A", "#47895A", 2) +
      Em(x + 120, y + h - 34, 54, "\u{1F333}") + Em(x + 300, y + h - 26, 46, "\u{1F407}") + Em(x + 470, y + h - 34, 58, "\u{1F333}"),
      { transform: tr(0, gap) });
    /* the road itself */
    out += G(R(x, mid - rh / 2, w * road, rh, 0, "#59606A") +
      L(x + 8, mid, x + 8 + (w - 16) * road, mid, P.gold, 4, { "stroke-dasharray": "26 22" }), { opacity: road });
    out += MK.pill(x + w / 2, y - 44, "a new road", road, { size: 26, col: P.muted });
    /* what it brings, and what it does */
    var so = popIn(t, cShops, 0.45);
    if (so > 0) {
      out += MK.pop(MK.pic(940, 136, 96, "\u{1F3EC}"), 940, 136, so);
      out += G(Tx(940, 212, "shops and jobs", "lab big", "middle"), { opacity: Math.min(1, so) });
      out += MK.tick(1064, 106, 24, popIn(t, cShops == null ? null : cShops + 0.25, 0.4));
    }
    if (cut > 0) {
      out += MK.cross(940, 282, 26, popIn(t, cCuts, 0.4));
      out += G(Tx(940, 348, "a habitat cut in two", "lab big", "middle", { fill: P.bad }), { opacity: cut });
      out += MK.arrow(x + w / 2 - 70, mid - rh / 2 - 26, x + w / 2 - 70, mid - rh / 2 - 66, cut, P.bad, 6);
      out += MK.arrow(x + w / 2 + 70, mid + rh / 2 + 26, x + w / 2 + 70, mid + rh / 2 + 66, cut, P.bad, 6);
    }
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* a dragonfly: a long body and four narrow wings, beating as a function of t */
  function hsDragonfly(cx, cy, s, t, o) {
    if (!(o > 0)) return "";
    var beat = 0.55 + 0.45 * Math.abs(Math.sin(t * 9));
    return G(E(0, 0, s * 0.46, s * 0.11 * beat, "#EAF6FC", "#4E7FC4", 2, { transform: "translate(" + n2(-s * 0.22) + "," + n2(-s * 0.13) + ")" }) +
      E(0, 0, s * 0.46, s * 0.11 * beat, "#EAF6FC", "#4E7FC4", 2, { transform: "translate(" + n2(s * 0.22) + "," + n2(-s * 0.13) + ")" }) +
      E(0, 0, s * 0.36, s * 0.09 * beat, "#EAF6FC", "#4E7FC4", 2, { transform: "translate(" + n2(-s * 0.17) + "," + n2(s * 0.11) + ")" }) +
      E(0, 0, s * 0.36, s * 0.09 * beat, "#EAF6FC", "#4E7FC4", 2, { transform: "translate(" + n2(s * 0.17) + "," + n2(s * 0.11) + ")" }) +
      R(-s * 0.07, -s * 0.18, s * 0.14, s * 0.66, s * 0.07, "#1F4E6B") +
      C(0, -s * 0.22, s * 0.12, "#123247"),
      { transform: tr(cx, cy), opacity: clamp(o, 0, 1) });
  }

  /* the pond dug in a park */
  function hsPondView(scene, t, o) {
    if (!(o > 0)) return "";
    var cPond = sc(scene, 3, "pond"), cHab = sc(scene, 3, "habitat"), cFrogs = sc(scene, 3, "frogs"), cFlies = sc(scene, 3, "flies");
    var x = 248, y = 96, w = 672, h = 256, out = "";
    var dig = on(t, cPond, 0.8), cx = x + w / 2, cy = y + h * 0.58;
    out += R(x, y, w, h, 16, "#3E8E4A", "#5BA968", 3);
    out += Em(x + 62, y + 58, 52, "\u{1F333}") + Em(x + w - 62, y + 58, 52, "\u{1F333}");
    if (dig > 0) {
      out += E(cx, cy, 214 * dig, 82 * dig, "#2E6E96", "#6E9DE8", 4);
      out += E(cx - 40 * dig, cy - 20 * dig, 64 * dig, 16 * dig, "#4E90BC", null, null, { opacity: 0.7 });
    }
    var ho = on(t, cHab, 0.45);
    if (ho > 0) out += MK.pill(cx, y + h + 46, "a new habitat", ho, { size: 30, col: P.good });
    var fo = popIn(t, cFrogs, 0.45);
    if (fo > 0) {
      out += MK.pop(Em(cx - 156, cy + 22, 62, "\u{1F438}"), cx - 156, cy + 22, fo);
      out += MK.pop(Em(cx + 142, cy + 30, 52, "\u{1F438}"), cx + 142, cy + 30, popIn(t, cFrogs == null ? null : cFrogs + 0.22, 0.4));
    }
    var dro = on(t, cFlies, 0.5);
    if (dro > 0) {
      out += hsDragonfly(cx - 58 + 26 * Math.sin(t * 1.3), cy - 100 + 10 * Math.sin(t * 2.1), 84, t, dro);
      out += hsDragonfly(cx + 106 + 22 * Math.sin(t * 1.7 + 1), cy - 80 + 12 * Math.sin(t * 2.4 + 2), 72, t, dro);
      out += G(Tx(cx, y - 30, "dragonflies", "lab big", "middle"), { opacity: dro });
    }
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  function hsNearChapter(scene, beat, t, i) {
    var out = "";
    out += hsAreaView(scene, t, hsUntil(t, scene, 1));
    out += hsNearCards(scene, t, hsFrom(t, scene, 1) * hsUntil(t, scene, 2));
    out += hsRoadView(scene, t, hsFrom(t, scene, 2) * hsUntil(t, scene, 3));
    out += hsPondView(scene, t, hsFrom(t, scene, 3));
    return svg(out);
  }
