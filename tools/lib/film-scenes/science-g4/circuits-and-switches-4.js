  /* ==== Circuits and Switches, part 4: Safe with electricity, What you do
     today, the recap, and the table of chapter kinds. =========================
     The safety chapter is the lesson's own four rules, one card per rule, each
     lit as it is said and left on screen, because they are a list. The today
     chapter is the lesson's own four steps, in the order the child meets
     them, under the lesson's own step titles. */

  /* a plug socket, drawn rather than emoji: the two live slots and the earth
     hole are what makes it a socket and not a switch plate */
  function csSocket(cx, cy, w) {
    var h = w, x = cx - w / 2, y = cy - h / 2, s = w * 0.09;
    return R(x, y, w, h, w * 0.16, "#E6ECF2", "#9FB2C2", 3) +
      R(cx - w * 0.055, cy - h * 0.30, w * 0.11, h * 0.17, s * 0.4, "#33414E") +
      R(cx - w * 0.30, cy + h * 0.02, w * 0.10, h * 0.20, s * 0.4, "#33414E") +
      R(cx + w * 0.20, cy + h * 0.02, w * 0.10, h * 0.20, s * 0.4, "#33414E") +
      C(cx, cy + h * 0.30, w * 0.055, "#C3CED8");
  }
  /* a wire getting hot: the lesson's warning sign */
  function csHotWire(x, y, w, heat, t) {
    var out = L(x, y, x + w, y, "#2B5673", 16) + L(x, y, x + w, y, heat > 0.2 ? "#D9473F" : "#7E93A6", 9);
    if (heat > 0) {
      out = MK.glow(x + w / 2, y, w * 0.62, P.bad, heat * (0.7 + 0.3 * breathe(t))) + out;
      for (var k = 0; k < 3; k++) {
        var wx = x + w * (0.28 + k * 0.22), ph = ((t * 0.9 + k * 0.33) % 1);
        out += Pth("M" + n2(wx) + "," + n2(y - 12 - ph * 26) + " q7,-9 0,-18", null, P.bad, 4,
          { opacity: heat * (1 - ph) });
      }
    }
    return out;
  }
  /* one card of a grid, lit when its beat is playing and kept afterwards */
  function csPanel(x, y, w, h, live, seen, inner) {
    var o = Math.max(seen * 0.72, live);
    if (!(o > 0)) return "";
    return G(R(x, y, w, h, 20, live > 0.5 ? "#1B3A52" : P.card, live > 0.5 ? P.teal : P.line, live > 0.5 ? 3 : 2) + inner,
      { opacity: clamp(o, 0, 1) });
  }

  /* ==== chapter: Safe with electricity =========================================== */
  var CS_SAFE = [[8, 8], [591, 8], [8, 227], [591, 227]], CS_SAFE_W = 569, CS_SAFE_H = 205;

  function csSafeChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cCells = c(0, "cells"), cNever = c(0, "never");
    var cSmall = c(1, "small"), cMains = c(1, "mains");
    var cWater = c(2, "water"), cDry = c(2, "dry"), cTouch = c(2, "touch");
    var cHot = c(3, "hot"), cOpen = c(3, "open"), cTell = c(3, "tell");
    var out = "";

    /* 1. cells only, never the plug socket */
    var p0 = CS_SAFE[0], in0 = "";
    in0 += ART.place(ART.kit.circuitSvg({ cell: true, lamp: true, wireTop: true, wireBottom: true, on: true }), p0[0] + 26, p0[1] + 30, 186, 127.9);
    in0 += MK.tick(p0[0] + 238, p0[1] + 52, 24, popIn(t, cCells, 0.4));
    in0 += Tx(p0[0] + 119, p0[1] + 186, "a cell, wires, a lamp", "lab mid muted", "middle");
    in0 += csSocket(p0[0] + 400, p0[1] + 92, 112);
    in0 += MK.cross(p0[0] + 470, p0[1] + 46, 24, popIn(t, cNever, 0.4));
    in0 += Tx(p0[0] + 400, p0[1] + 186, "never the plug socket", "lab mid muted", "middle");
    out += csPanel(p0[0], p0[1], CS_SAFE_W, CS_SAFE_H, csOnly(t, scene, 0), csFrom(t, scene, 1), in0);

    /* 2. a small safe push, against the mains */
    var p1 = CS_SAFE[1], in1 = "";
    var sp = on(t, cSmall, 0.5), mp = on(t, cMains, 0.6);
    in1 += MK.pic(p1[0] + 48, p1[1] + 58, 50, "\u{1F50B}");
    in1 += R(p1[0] + 88, p1[1] + 46, 70 * sp, 24, 12, P.good, null, null, { opacity: sp });
    in1 += Tx(p1[0] + 172, p1[1] + 64, "a small, safe push", "lab mid good", "start", { opacity: sp });
    in1 += G(csSocket(p1[0] + 48, p1[1] + 136, 50), { opacity: mp });
    in1 += R(p1[0] + 88, p1[1] + 124, 400 * mp, 24, 12, P.bad, null, null, { opacity: mp });
    in1 += MK.pic(p1[0] + 512, p1[1] + 136, 46, "⚠️", { opacity: mp });
    in1 += MK.pill(p1[0] + 250, p1[1] + 180, "the mains can kill", mp, { size: 22, col: P.bad, ink: P.bad });
    out += csPanel(p1[0], p1[1], CS_SAFE_W, CS_SAFE_H, csOnly(t, scene, 1), csFrom(t, scene, 2), in1);

    /* 3. water carries electricity, so dry your hands */
    var p2 = CS_SAFE[2], in2 = "";
    var wet = on(t, cWater, 0.5), dry = on(t, cDry, 0.5);
    in2 += MK.pic(p2[0] + 92, p2[1] + 92, 62, "\u{1F4A7}", { opacity: wet });
    in2 += G(Pth("M" + n2(p2[0] + 78) + "," + n2(p2[1] + 78) + " l22,22 l-14,6 l20,24", null, P.gold, 5),
      { opacity: wet * (0.5 + 0.5 * breathe(t)) });
    in2 += Tx(p2[0] + 92, p2[1] + 168, "water carries it", "lab mid muted", "middle", { opacity: wet });
    in2 += MK.pic(p2[0] + 282, p2[1] + 92, 76, "✋");
    for (var d = 0; d < 3; d++)
      in2 += MK.pic(p2[0] + 248 + d * 34, p2[1] + 46, 24, "\u{1F4A7}", { opacity: wet * (1 - dry) });
    in2 += MK.tick(p2[0] + 344, p2[1] + 52, 22, popIn(t, cDry, 0.4));
    in2 += Tx(p2[0] + 282, p2[1] + 168, "dry hands", "lab mid good", "middle", { opacity: dry });
    /* the switch closes under the dry hand, so it reads as a switch and not
       as a bar */
    in2 += G(csMotifSwitch(p2[0] + 470, p2[1] + 96, 1 - on(t, cTouch, 0.45), 1), { transform: around(p2[0] + 470, p2[1] + 96, 1.25) });
    in2 += MK.ripple(p2[0] + 470, p2[1] + 96, t, cTouch, P.good);
    in2 += Tx(p2[0] + 470, p2[1] + 168, "then the switch", "lab mid muted", "middle", { opacity: on(t, cTouch, 0.4) });
    out += csPanel(p2[0], p2[1], CS_SAFE_W, CS_SAFE_H, csOnly(t, scene, 2), csFrom(t, scene, 3), in2);

    /* 4. a hot wire: open the switch and tell a grown-up */
    var p3 = CS_SAFE[3], in3 = "";
    var hot = on(t, cHot, 0.5), opened = on(t, cOpen, 0.45);
    in3 += csHotWire(p3[0] + 36, p3[1] + 94, 150, hot, t);
    in3 += Tx(p3[0] + 111, p3[1] + 168, "a hot wire", "lab mid bad", "middle", { opacity: hot });
    in3 += MK.arrow(p3[0] + 200, p3[1] + 94, p3[0] + 256, p3[1] + 94, opened, P.gold, 7);
    in3 += G(csMotifSwitch(p3[0] + 312, p3[1] + 94, opened, 1), { transform: around(p3[0] + 312, p3[1] + 94, 1.3) });
    in3 += Tx(p3[0] + 312, p3[1] + 168, "open the switch", "lab mid muted", "middle", { opacity: opened });
    in3 += MK.arrow(p3[0] + 362, p3[1] + 94, p3[0] + 418, p3[1] + 94, on(t, cTell, 0.45), P.gold, 7);
    in3 += MK.pic(p3[0] + 466, p3[1] + 96, 62, "\u{1F9D1}", { opacity: on(t, cTell, 0.4) });
    in3 += MK.pic(p3[0] + 512, p3[1] + 108, 46, "\u{1F9D2}", { opacity: on(t, cTell, 0.4) });
    in3 += Tx(p3[0] + 480, p3[1] + 168, "tell a grown-up", "lab mid muted", "middle", { opacity: on(t, cTell, 0.4) });
    out += csPanel(p3[0], p3[1], CS_SAFE_W, CS_SAFE_H, csOnly(t, scene, 3), 0, in3);
    return svg(out);
  }

  /* ==== chapter: What you do today ===============================================
     The lesson's own four steps, under its own titles, in its own order. */
  /* four steps across: the table needs the room, so the three picture cards
     are narrower than it is */
  var CS_STEPS = [[10, 244], [266, 244], [522, 380], [914, 244]];

  function csTodayChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cAdd = c(0, "add"), cChange = c(0, "change");
    var cSwitch = c(1, "switch"), cEight = c(1, "eight");
    var cTable = c(2, "table"), cCond = c(2, "conductor"), cIns = c(2, "insulator");
    var cChoose = c(3, "choose"), cCell = c(3, "cell"), cWire = c(3, "wire");
    var TOP = 26, H = 392, out = "";
    var titles = ["Brighter, dimmer, off", "Conductor, or insulator?", "Record the conductor test", "Choose the equipment"];

    for (var k = 0; k < 4; k++) {
      var x = CS_STEPS[k][0], w = CS_STEPS[k][1], cx = x + w / 2;
      var live = csOnly(t, scene, k), seen = k < 3 ? csFrom(t, scene, k + 1) : 0, inner = "";
      inner += C(cx, TOP + 40, 22, live > 0.5 ? P.teal : P.cell, P.line, 2);
      inner += Tx(cx, TOP + 48, String(k + 1), "lab big", "middle");
      inner += Tx(cx, TOP + 96, titles[k], "lab mid", "middle");

      if (k === 0) {
        var lit = on(t, cChange, 0.6);
        inner += MK.pic(cx - 62, TOP + 190, 68, "\u{1F50B}", { opacity: on(t, cAdd, 0.4) });
        inner += Tx(cx, TOP + 200, "+", "lab huge gold", "middle", { opacity: on(t, cAdd, 0.4) });
        if (lit > 0) inner += MK.glow(cx + 62, TOP + 190, 62, P.gold, lit * (0.7 + 0.3 * breathe(t)));
        inner += MK.pic(cx + 62, TOP + 190, 68, "\u{1F4A1}", { opacity: on(t, cAdd, 0.4) });
        inner += MK.arrow(cx - 70, TOP + 274, cx + 70, TOP + 274, lit, P.gold, 8);
        inner += Tx(cx, TOP + 322, "brighter and dimmer", "lab mid muted", "middle", { opacity: lit });
      } else if (k === 1) {
        var sw = on(t, cSwitch, 0.4);
        inner += G(csMotifSwitch(cx, TOP + 172, live > 0.5 ? 0.5 + 0.5 * Math.sin(t * 2.4) : 0.5, sw), { transform: around(cx, TOP + 172, 1.5) });
        inner += Tx(cx, TOP + 246, "open, then close", "lab mid muted", "middle", { opacity: sw });
        var eight = [ART.ICONS.wire, "\u{1F4CF}", "\u{1F511}", "\u{1F388}", ART.ICONS.foil, ART.ICONS.lollystick, ART.ICONS.coin, ART.ICONS.glass];
        var shown = tally(t, cEight, 8, 0.9);
        for (var m = 0; m < shown; m++)
          inner += MK.pic(cx - 90 + (m % 4) * 60, TOP + 296 + Math.floor(m / 4) * 58, 44, eight[m]);
      } else if (k === 2) {
        var rows = [[ART.ICONS.wire, "copper wire", true], ["\u{1F4CF}", "plastic ruler", false],
          [ART.ICONS.coin, "coin", true], [ART.ICONS.lollystick, "lolly stick", false]];
        inner += Tx(x + 24, TOP + 150, "Material", "lab mid muted caps", "start", { opacity: on(t, cTable, 0.4) });
        inner += Tx(x + 228, TOP + 150, "Result", "lab mid muted caps", "start", { opacity: on(t, cTable, 0.4) });
        inner += L(x + 18, TOP + 164, x + w - 18, TOP + 164, P.line, 2, { opacity: on(t, cTable, 0.4) });
        var got = tally(t, cTable, 4, 1.1);
        /* "conductor, or insulator": the word each row was filled in with */
        var wordO = [on(t, cCond, 0.4), on(t, cIns, 0.4)];
        for (var r = 0; r < got; r++) {
          var ry = TOP + 202 + r * 50, ok = rows[r][2];
          var flash = ok ? bump(t, cCond, 1.1) : bump(t, cIns, 1.1);
          inner += MK.pic(x + 42, ry, 38, rows[r][0]);
          inner += Tx(x + 68, ry + 8, rows[r][1], "lab mid", "start");
          if (flash > 0) inner += R(x + 226, ry - 20, 140, 40, 12, ok ? P.good : P.bad, null, null, { opacity: 0.2 * flash });
          inner += (ok ? MK.tick(x + 246, ry, 15, 1) : MK.cross(x + 246, ry, 15, 1));
          inner += Tx(x + 268, ry + 7, ok ? "conductor" : "insulator", "lab mid", "start",
            { fill: ok ? P.good : P.bad, opacity: 0.45 + 0.55 * Math.max(wordO[ok ? 0 : 1], flash) });
        }

      } else {
        inner += MK.pic(cx, TOP + 176, 72, "\u{1F50B}", { opacity: on(t, cChoose, 0.4) });
        inner += MK.tick(cx + 62, TOP + 142, 20, popIn(t, cCell, 0.4));
        inner += Tx(cx, TOP + 238, "a cell: brighter", "lab mid good", "middle", { opacity: on(t, cCell, 0.4) });
        inner += MK.pic(cx, TOP + 298, 72, ART.ICONS.wire, { opacity: on(t, cChoose, 0.4) });
        inner += MK.cross(cx + 62, TOP + 266, 20, popIn(t, cWire, 0.4));
        inner += Tx(cx, TOP + 358, "not more wire", "lab mid muted", "middle", { opacity: on(t, cWire, 0.4) });
      }
      out += csPanel(x, TOP - 4, w, H, live, seen, inner);
    }
    return svg(out);
  }

  /* ==== what you now know ========================================================= */
  function csPicLoop(cx, cy, size, broken) {
    var w = size * 1.12, h = size * 0.8, x = cx - w / 2, y = cy - h / 2, out = "";
    if (broken) {
      out += Pth("M" + n2(x + w * 0.38) + "," + n2(y + h) + " H" + n2(x) + " V" + n2(y) + " H" + n2(x + w) + " V" + n2(y + h) + " H" + n2(x + w * 0.62), null, P.gold, 6);
      out += MK.cross(cx, y + h, size * 0.2, 1);
    } else {
      out += Pth("M" + n2(x) + "," + n2(y) + " H" + n2(x + w) + " V" + n2(y + h) + " H" + n2(x) + " Z", null, P.gold, 6);
    }
    out += G(csMotifCell(cx - size * 0.2, y, 1), { transform: around(cx - size * 0.2, y, size / 92) });
    out += C(x + w, cy, size * 0.17, broken ? "#1B3A52" : P.gold, P.gold, 4);
    return out;
  }
  var CS_RECAP = MK.recapKind([
    { beat: 0, at: "loop", title: "One loop", sub: "cell, wires, lamp, and back",
      pic: function (cx, cy, size) { return csPicLoop(cx, cy, size * 0.82, false); } },
    { beat: 0, at: "break", title: "A break", sub: "and the whole circuit stops",
      pic: function (cx, cy, size) { return csPicLoop(cx, cy, size * 0.82, true); } },
    { beat: 1, at: "switch", title: "A switch", sub: "opens and closes a gap",
      /* the lever swings, so the card shows a switch rather than a bar */
      pic: function (cx, cy, size, t) { return G(csMotifSwitch(cx, cy, 0.5 + 0.5 * Math.sin(t * 1.8), 1), { transform: around(cx, cy, size / 62) }); } },
    { beat: 1, at: "cells", title: "More cells", sub: "brighter", pic: "\u{1F50B}" },
    { beat: 1, at: "lamps", title: "More lamps", sub: "dimmer", pic: "\u{1F4A1}" },
    { beat: 2, at: "metals", title: "Metals conduct", sub: "plastic, rubber, wood and glass do not",
      pic: function (cx, cy, size) { return MK.pic(cx, cy, size, ART.ICONS.wire); } }
  ], { goBeat: 2, goAt: "insulate" });

  var KINDS = {
    title: MK.titleKind({ sub: ["One loop, and what a break does", "A switch: two metal contacts", "Conductors, insulators, and staying safe"] }),
    loop: csLoopChapter, "switch": csSwitchChapter, bright: csBrightChapter,
    materials: csMaterialsChapter, safe: csSafeChapter, today: csTodayChapter, recap: CS_RECAP
  };
