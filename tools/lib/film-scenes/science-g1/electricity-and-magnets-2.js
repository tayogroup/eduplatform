
  /* ==== Electricity and Magnets, part 2: the three electricity chapters ======== */

  /* ==== chapter: what needs electricity ==========================================
     The lesson's own sort, as it is said: its two bins, "Needs electricity" and
     "No electricity"; the lamp, television, fridge and phone go into one, the
     book, chair and bicycle into the other. Then the lesson's test: the switch
     goes off, everything in the first bin goes dark, and the book can still be
     read. Last, each thing that stopped gets its lightning mark. */
  var EM_YES = [
    { cue: "lamp", label: "lamp", pic: "\u{1F4A1}" },
    { cue: "tv", label: "television", pic: "\u{1F4FA}" },
    { cue: "fridge", label: "fridge", pic: null },
    { cue: "phone", label: "phone", pic: "\u{1F4F1}" }
  ];
  var EM_NO = [
    { cue: "book", label: "book", pic: "\u{1F4D6}" },
    { cue: "chair", label: "chair", pic: "\u{1FA91}" },
    { cue: "bike", label: "bicycle", pic: "\u{1F6B2}" }
  ];
  var EM_BINS = [{ x: 0, w: 664, n: 4 }, { x: 692, w: 476, n: 3 }], EM_ITEM_Y = 238;
  function emSlot(b, k) { return EM_BINS[b].x + EM_BINS[b].w * (k + 0.5) / EM_BINS[b].n; }

  function emBin(b, pic, label, p, lit, dark) {
    if (!(p > 0)) return "";
    var B = EM_BINS[b];
    return G(R(B.x, 6, B.w, 428, 26, P.card, lit > 0.5 ? P.gold : P.line, 2 + 2 * lit) +
      (dark > 0 ? R(B.x, 6, B.w, 428, 26, "#000000", null, null, { opacity: 0.28 * dark }) : "") +
      MK.pic(B.x + 50, 62, 46, pic) + Tx(B.x + 88, 73, label, "lab big", "start", lit > 0.5 ? { fill: P.gold } : null),
      { opacity: Math.min(1, p), transform: around(B.x + B.w / 2, 220, 0.96 + 0.04 * Math.min(p, 1.05)) });
  }

  function sceneNeeds(scene, beat, t, i) {
    var testAt = sc(scene, 3, "test"), off = on(t, sc(scene, 3, "off"), 0.5);
    var outAt = sc(scene, 4, "out"), readAt = sc(scene, 4, "read");
    var stopsAt = sc(scene, 5, "stops"), needsAt = sc(scene, 5, "needs"), lit = on(t, needsAt, 0.4);
    var out = emBin(0, "⚡", "Needs electricity", popIn(t, sc(scene, 0, "need"), 0.45), lit, off) +
      emBin(1, "\u{1F6AB}", "No electricity", popIn(t, sc(scene, 0, "not"), 0.45), 0, 0);
    /* the switch the test turns off */
    var sp = popIn(t, testAt, 0.4);
    if (sp > 0) out += MK.pop(emSwitch(610, 66, 70, 1 - off) +
      Tx(562, 77, off > 0.5 ? "OFF" : "ON", "lab big", "end", { fill: off > 0.5 ? P.bad : P.gold }), 596, 66, sp);
    EM_YES.forEach(function (it, k) {
      var p = popIn(t, sc(scene, 1, it.cue), 0.45);
      if (p <= 0) return;
      var cx = emSlot(0, k), cy = EM_ITEM_Y;
      var pic = it.pic ? MK.pic(cx, cy, 104, it.pic) : emFridge(cx, cy, 118, 1 - off);
      var shake = bump(t, stopsAt == null ? null : stopsAt + k * 0.14, 0.45);
      out += G(emHalo(cx, cy, 80, "emHaloGold", (1 - off) * (0.55 + 0.25 * breathe(t + k * 0.7))) + emDark(pic, off),
        { transform: around(cx, cy, Math.min(p, 1.1) * (1 + 0.07 * shake)), opacity: Math.min(1, p) });
      out += Tx(cx, 354, it.label, "lab", "middle", { opacity: Math.min(1, p) * (1 - 0.4 * off) });
      var bolt = popIn(t, needsAt == null ? null : needsAt + k * 0.12, 0.35);
      if (bolt > 0) out += MK.pop(C(cx + 52, cy - 56, 21, P.card, P.gold, 2) + Em(cx + 52, cy - 55, 26, "⚡"), cx + 52, cy - 56, bolt);
    });
    /* the lamp that went out, pointed at while it is named */
    var ring = on(t, outAt, 0.35) * (1 - on(t, readAt, 0.35));
    if (ring > 0) out += C(emSlot(0, 0), EM_ITEM_Y, 72, "none", P.gold, 4, { opacity: ring });
    EM_NO.forEach(function (it, k) {
      var p = popIn(t, sc(scene, 2, it.cue), 0.45);
      if (p <= 0) return;
      var cx = emSlot(1, k), cy = EM_ITEM_Y, read = k === 0 ? on(t, readAt, 0.4) : 0;
      out += G(emHalo(cx, cy, 80, "emHaloGood", read) + MK.pic(cx, cy, 104, it.pic),
        { transform: around(cx, cy, Math.min(p, 1.1) * (1 + 0.08 * bump(t, k === 0 ? readAt : null, 0.5))), opacity: Math.min(1, p) });
      out += Tx(cx, 354, it.label, "lab", "middle", { opacity: Math.min(1, p) });
      if (k === 0) out += MK.tick(cx + 52, cy - 56, 21, popIn(t, readAt, 0.35));
    });
    return svg(EM_DEFS + out);
  }

  /* ==== chapter: where it comes from =============================================
     A house, in the middle until the battery side arrives. Electricity comes
     along the wires from the pole outside, through the wall, to the socket; the
     lamp's plug goes in, electricity runs along its lead, and the lamp lights.
     Then the house moves over for the lesson's battery, a torch with its two
     batteries showing, and a toy car that drives. */
  var EM_WIRE = [[46, 86], [60, 116], [80, 150], [112, 176], [300, 176], [300, 290]];
  var EM_SOCK = [300, 322, 64], EM_PLUG_REST = [396, 402], EM_LAMP_AT = [532, 330];

  function emHouse(o) {
    return G(Pth("M84,154 L372,16 L660,154 Z", "#1B3A52", P.line, 3) + R(112, 152, 520, 282, 6, P.card, P.line, 3) +
      R(428, 330, 200, 12, 4, "#7A5A36") + L(446, 342, 446, 430, "#7A5A36", 8) + L(610, 342, 610, 430, "#7A5A36", 8), { opacity: o });
  }

  function sceneSource(scene, beat, t, i) {
    var houseAt = sc(scene, 0, "house"), wiresAt = sc(scene, 0, "wires"), sockAt = sc(scene, 1, "sockets");
    var plugAt = sc(scene, 2, "plug"), lampAt = sc(scene, 2, "lamp"), lightAt = sc(scene, 2, "lights");
    var batAt = sc(scene, 3, "battery"), torchAt = sc(scene, 3, "torch"), toysAt = sc(scene, 3, "toys");
    var lookPlug = sc(scene, 4, "plug"), lookBat = sc(scene, 4, "battery");
    var home = emHouse(0.45 + 0.55 * on(t, houseAt, 0.5));
    if (houseAt != null) home += R(112, 152, 520, 282, 6, "none", P.blue, 4, { opacity: bump(t, houseAt, 0.9) });
    /* the pole and the wires in, drawn out along their way, then electricity flowing */
    var w = on(t, wiresAt, 1.0), wlen = polyLen(EM_WIRE);
    if (w > 0) {
      home += L(46, 70, 46, 432, "#8A6A3A", 9) + L(24, 84, 68, 84, "#8A6A3A", 7) +
        Pth(emPolyD(EM_WIRE, w), null, "#C98B4A", 5) +
        emFlow(function (u) { return polyAt(EM_WIRE, u * wlen * w); }, t, wiresAt == null ? null : wiresAt + 0.3, 0.55, 6, 6, P.gold, 1);
    }
    /* the socket, the plug going in, and the lead to the lamp */
    var sk = popIn(t, sockAt, 0.4);
    if (sk > 0) {
      home += MK.pop(emSocket(EM_SOCK[0], EM_SOCK[1], EM_SOCK[2], bump(t, sockAt, 1.0)), EM_SOCK[0], EM_SOCK[1], sk);
      home += Tx(254, 290, "socket", "lab big", "end", { opacity: Math.min(1, sk) });
    }
    var pu = on(t, plugAt, 0.7), px = lerp(EM_PLUG_REST[0], EM_SOCK[0], pu), py = lerp(EM_PLUG_REST[1], EM_SOCK[1], pu);
    var lead = emCubic([px, py + 16], [px, 436], [470, 436], [494, 326]);
    var hlPlug = on(t, lookPlug, 0.35) * (1 - on(t, lookBat, 0.35));
    if (hlPlug > 0) home += Pth(lead.d, null, P.gold, 11, { opacity: 0.45 * hlPlug });
    home += Pth(lead.d, null, EM_CABLE, 6) + emPlug(px, py, EM_SOCK[2], 1 - clamp((pu - 0.6) / 0.4, 0, 1));
    if (plugAt != null && t >= plugAt) home += Tx(px - 44, py + 20, "plug", "lab big", "end", { opacity: on(t, plugAt, 0.4) });
    if (pu >= 1) home += emFlow(lead.at, t, lampAt, 0.9, 4, 5, P.gold, 1) + MK.ripple(EM_SOCK[0], EM_SOCK[1], t, plugAt + 0.7, P.gold);
    home += emLamp(EM_LAMP_AT[0], EM_LAMP_AT[1], 0.8, on(t, lightAt, 0.4));
    if (hlPlug > 0) home += C(px, py, 44, "none", P.gold, 4, { opacity: hlPlug });
    var out = G(home, { transform: tr(230 * (1 - into(t, scene.first + 3)), 0) });
    /* the battery side: the lesson's battery, a torch lit by its own two, the toy car */
    var rc = popIn(t, batAt, 0.45);
    if (rc > 0) out += G(R(690, 6, 478, 428, 26, P.card, P.line, 2) +
      MK.pop(MK.pic(768, 88, 100, "\u{1F50B}"), 768, 88, rc) + Tx(832, 100, "battery", "lab big", "start"), { opacity: Math.min(1, rc) });
    var tp = popIn(t, torchAt, 0.45);
    if (tp > 0) out += G(emTorch(704, 234, on(t, torchAt == null ? null : torchAt + 0.3, 0.35), 1, 196),
      { opacity: Math.min(1, tp), transform: around(830, 234, 0.9 + 0.1 * Math.min(tp, 1.05)) });
    var hlBat = on(t, lookBat, 0.35);
    if (hlBat > 0) out += R(730, 206, 162, 56, 14, "none", P.gold, 4, { opacity: hlBat });
    var cp = popIn(t, toysAt, 0.4), drive = on(t, toysAt, 1.2);
    if (cp > 0) {
      var cx = lerp(1050, 930, drive), hop = 4 * Math.abs(Math.sin(drive * Math.PI * 3)) * (drive < 1 ? 1 : 0);
      for (var k = 0; k < 3 && drive < 1; k++) out += L(cx + 58, 352 + k * 14, cx + 86 + k * 8, 352 + k * 14, P.muted, 3, { opacity: 0.7 * Math.min(1, cp) });
      out += G(Em(cx, 366 - hop, 100, "\u{1F697}"), { opacity: Math.min(1, cp) });
    }
    return svg(EM_DEFS + out);
  }

  /* ==== chapter: three safety rules ==============================================
     "Very useful": the lamp, television and phone lit. "It can hurt you": the
     danger sign. Then the three rules, one panel each, lit in turn and kept lit:
     a plug goes into the socket while a finger and a toy are crossed out; the
     radio is moved away from the water, and a wet hand is crossed out; the
     broken wire sparks, the hand stays back, and a grown-up is told. */
  var EM_PANEL = { w: 372, gap: 26, h: 424 };

  function emUseful(t, useAt, hurtAt) {
    var out = "";
    ["\u{1F4A1}", "\u{1F4FA}", "\u{1F4F1}"].forEach(function (pic, k) {
      var p = popIn(t, useAt == null ? null : useAt + k * 0.15, 0.4), cx = 130 + k * 160;
      if (p > 0) out += MK.pop(emHalo(cx, 214, 82, "emHaloGold", 0.7 + 0.3 * breathe(t + k)) + MK.pic(cx, 214, 104, pic), cx, 214, p);
    });
    var hp = popIn(t, hurtAt, 0.45);
    if (hp > 0) out += MK.pop(emHazard(880, 222, 270), 880, 210, hp);
    return out;
  }

  function emRuleOne(t, c) {
    var u = on(t, c.plugs, 0.6), py = lerp(304, 160, u), out = emSocket(186, 160, 96, bump(t, c.plugs == null ? null : c.plugs + 0.6, 0.8));
    out += Pth("M186," + n2(py + 24) + " L186,318 Q186,350 222,350 L352,350", null, EM_CABLE, 6) + emPlug(186, py, 96, 1 - clamp((u - 0.6) / 0.4, 0, 1));
    out += MK.tick(272, 94, 22, popIn(t, c.plugs == null ? null : c.plugs + 0.6, 0.35));
    var f = on(t, c.fingers, 0.4);
    if (f > 0) out += G(Em(lerp(52, 66, f), 160, 70, "\u{1F449}"), { opacity: f }) + MK.cross(66, 160, 32, popIn(t, c.fingers + 0.4, 0.3));
    var y = on(t, c.toys, 0.4);
    if (y > 0) out += G(Em(lerp(334, 314, y), 160, 72, "\u{1F697}"), { opacity: y }) + MK.cross(314, 160, 32, popIn(t, c.toys + 0.4, 0.3));
    return out;
  }

  function emRuleTwo(t, c) {
    var out = R(80, 76, 60, 20, 7, "#8C97A3") + R(96, 60, 28, 14, 5, "#6B7F90") +
      Pth("M132,86 Q146,86 146,112", null, "#8C97A3", 18) + E(146, 304, 90, 18, "#6E9DE8", "#4F86D9", 2, { opacity: 0.85 });
    for (var k = 0; k < 3; k++) out += E(146, 128 + ((t * 0.9 + k / 3) % 1) * 164, 7, 10, "#8DB8F2", "#4F86D9", 1.5);
    var away = on(t, c.water, 0.8), rx = lerp(254, 312, away);
    out += G(emHazard(254, 186, 56), { opacity: on(t, c.two, 0.4) * (1 - away) });
    out += MK.pic(rx, 262, 80, "\u{1F4FB}") + MK.tick(312, 194, 22, popIn(t, c.water == null ? null : c.water + 0.8, 0.35));
    var wet = on(t, c.wet, 0.4);
    if (wet > 0) {
      out += G(MK.pic(62, 214 - 10 * wet, 62, "✋") + E(44, 256 - 10 * wet, 5, 7, "#8DB8F2") + E(80, 260 - 10 * wet, 5, 7, "#8DB8F2"), { opacity: wet });
      out += MK.cross(62, 204, 28, popIn(t, c.wet + 0.4, 0.3));
    }
    return out;
  }

  function emRuleThree(t, c) {
    var b = on(t, c.broken, 0.4), gap = 10 + 30 * b, out = "";
    if (b <= 0) out += L(20, 170, 352, 170, EM_CABLE, 14);
    else {
      out += L(20, 170, 186 - gap, 170, EM_CABLE, 14) + L(186 + gap, 170, 352, 170, EM_CABLE, 14);
      [-1, 1].forEach(function (s) {
        var ex = 186 - s * gap;
        for (var k = -1.5; k <= 1.5; k += 1) out += L(ex, 170 + k * 3, ex + s * 22, 170 + k * 11, "#D9893E", 4, { opacity: b });
      });
      if ((t * 6) % 1 < 0.6) out += emHalo(186, 168, 46, "emHaloGold", b) +
        Pth("M" + n2(186 - gap + 18) + ",160 L178,150 L192,176 L" + n2(186 + gap - 18) + ",162", null, P.gold, 6, { opacity: b }) +
        Pth("M" + n2(186 - gap + 18) + ",160 L178,150 L192,176 L" + n2(186 + gap - 18) + ",162", null, "#FFFFFF", 2, { opacity: b });
    }
    var h = on(t, c.touch, 0.5);
    if (h > 0) out += G(MK.pic(186, lerp(344, 296, h), 84, "✋"), { opacity: h }) + MK.cross(186, 296, 36, popIn(t, c.touch + 0.5, 0.3));
    return out;
  }

  function sceneSafety(scene, beat, t, i) {
    var b0 = scene.first, u = into(t, b0 + 1), out = "";
    if (u < 1) out += G(emUseful(t, sc(scene, 0, "useful"), sc(scene, 0, "hurt")), { opacity: 1 - u });
    if (u <= 0) return svg(EM_DEFS + out);
    var starts = [sc(scene, 1, "one"), sc(scene, 2, "two"), sc(scene, 3, "three")];
    var labels = ["Only plugs", "Away from water", "Tell a grown-up"], labAt = [sc(scene, 1, "plugs"), sc(scene, 2, "water"), sc(scene, 3, "tell")];
    var draws = [
      function () { return emRuleOne(t, { plugs: sc(scene, 1, "plugs"), fingers: sc(scene, 1, "fingers"), toys: sc(scene, 1, "toys") }); },
      function () { return emRuleTwo(t, { two: sc(scene, 2, "two"), water: sc(scene, 2, "water"), wet: sc(scene, 2, "wet") }); },
      function () { return emRuleThree(t, { broken: sc(scene, 3, "broken"), touch: sc(scene, 3, "touch") }); }
    ];
    for (var k = 0; k < 3; k++) {
      var x = k * (EM_PANEL.w + EM_PANEL.gap), reached = starts[k] != null && t >= starts[k];
      var now = reached && (k === 2 || starts[k + 1] == null || t < starts[k + 1]), lo = popIn(t, labAt[k], 0.4);
      var inner = R(0, 0, EM_PANEL.w, EM_PANEL.h, 24, P.card, now ? P.accent : P.line, now ? 3 : 2) +
        C(44, 44, 26, reached ? P.accent : P.cell) + Tx(44, 54, String(k + 1), "lab big", "middle", { fill: reached ? "#142B3E" : P.muted }) +
        (reached ? draws[k]() : "") +
        (lo > 0 ? MK.pop(Tx(186, 400, labels[k], "lab big", "middle"), 186, 390, lo) : "");
      out += G(inner, { transform: tr(x, 8), opacity: u * (reached ? 1 : 0.35) });
    }
    return svg(EM_DEFS + out);
  }
